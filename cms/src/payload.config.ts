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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Order so the admin nav groups read logically:
  //   Páginas y Contenido -> Portafolio -> Ajustes
  // (Payload orders nav groups by the definition order in which they first appear.)
  collections: [Pages, Media, Categories, Projects, Users],
  globals: [Home, About, Career, UiStrings, Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
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
