import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
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
import { Clients } from './collections/Clients'
import { Projects } from './collections/Projects'
import { Home } from './globals/Home'
import { About } from './globals/About'
import { Career } from './globals/Career'
import { UiStrings } from './globals/UiStrings'
import { Site } from './globals/Site'
import { publishHandler } from './endpoints/publish'

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
  collections: [Pages, Media, Categories, Clients, Projects, Users],
  globals: [Home, About, Career, UiStrings, Site],
  endpoints: [
    {
      // Manual publish: POST /api/publish triggers ONE front-end rebuild.
      // Reachable at /api/publish. Requires an authenticated admin user.
      //
      // The handler body lives in ./endpoints/publish (R29) so the root test
      // suite can drive it without importing this config — that job installs
      // root dependencies only, where `payload` does not resolve. Behaviour is
      // unchanged; the reasoning about the 200-on-no-hook moved with the code.
      path: '/publish',
      method: 'post',
      handler: publishHandler,
    },
  ],
  // Absolute base URL for links Payload generates OUTSIDE a browser context —
  // notably the forgot-password reset link in the email. Without this, Payload
  // falls back to the request Host only if it's in the CORS/CSRF allowlist and
  // otherwise emits an empty origin, producing a relative "/admin/reset/<token>"
  // link that mail clients reject as an invalid address.
  // Per-environment (see INFRASTRUCTURE.md §4); VERCEL_URL is a safety net so a
  // missing var degrades to the deployment URL rather than a broken link.
  serverURL:
    process.env.PAYLOAD_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4400'),
  editor: lexicalEditor(),
  // Transactional email (Resend) so Payload's admin flows actually deliver —
  // notably forgot-password, which otherwise generates a reset link but sends
  // nothing (Payload logs "No email adapter provided"). All creds come from env;
  // no secrets in code. Sending domain: ase-cor-oba.site (DNS on Cloudflare).
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_DEFAULT_FROM_ADDRESS || 'no-reply@ase-cor-oba.site',
    defaultFromName: process.env.EMAIL_DEFAULT_FROM_NAME || 'AseCorOba CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
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
      // Browser PUTs the file directly to R2 via a presigned URL, bypassing the
      // ~4.5 MB Vercel serverless function body limit that 413s on our 11–18 MB
      // source images. Requires R2 CORS to allow PUT from the admin origins.
      clientUploads: true,
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
