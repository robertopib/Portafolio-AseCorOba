import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Categories } from './collections/Categories'
import { Projects } from './collections/Projects'
import { Home } from './globals/Home'
import { About } from './globals/About'
import { Career } from './globals/Career'
import { UiStrings } from './globals/UiStrings'
import { Site } from './globals/Site'
import { pingDeployHook } from './hooks/triggerDeploy'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Manual "Publicar cambios" button, shown in the admin nav on every screen.
      beforeNavLinks: ['/components/PublishButton#PublishButton'],
    },
  },
  // Order so the admin nav groups read logically:
  //   Páginas y Contenido -> Portafolio -> Ajustes
  // (Payload orders nav groups by the definition order in which they first appear.)
  collections: [Pages, Media, Categories, Projects, Users],
  globals: [Home, About, Career, UiStrings, Site],
  endpoints: [
    {
      // Manual publish: POST /api/publish triggers ONE front-end rebuild.
      // Reachable at /api/publish. Requires an authenticated admin user.
      path: '/publish',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ ok: false, reason: 'unauthorized' }, { status: 403 })
        }
        try {
          const result = await pingDeployHook(`manual:${req.user.email ?? req.user.id}`)
          // 200 even when no hook is configured — that's a valid, expected state
          // the button surfaces to the editor, not a server error.
          return Response.json(result)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return Response.json({ ok: false, reason: 'error', message }, { status: 500 })
        }
      },
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Migrations everywhere (push OFF in all envs) so local/preview/prod behave
    // identically and no environment ever leaves the "dev push" marker that makes
    // `payload migrate` prompt interactively (which would hang the Vercel build).
    // Schema change workflow: edit schema -> `pnpm migrate:create <name>` -> commit
    // the generated file. `pnpm migrate` (run automatically in the CMS build via
    // `ci:build`) applies pending migrations. See cms/src/migrations/.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  localization: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    fallback: true,
  },
  plugins: [
    s3Storage({
      collections: {
        // When R2_PUBLIC_URL is set, serve media DIRECTLY from R2's public URL
        // (no proxy through the serverless function — avoids the ~4.5MB Vercel
        // function response limit and 500s). Falls back to Payload proxy locally.
        media: process.env.R2_PUBLIC_URL
          ? {
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename }: { filename: string }) =>
                `${(process.env.R2_PUBLIC_URL as string).replace(/\/+$/, '')}/${filename}`,
            }
          : true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
