import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Projects } from './collections/Projects'
import { Pages } from './collections/Pages'
import { Home } from './globals/Home'
import { About } from './globals/About'
import { Career } from './globals/Career'
import { UiStrings } from './globals/UiStrings'
import { SectionText } from './globals/SectionText'
import { CaseStudy } from './globals/CaseStudy'
import { Navigation } from './globals/Navigation'

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
  // Pages is listed FIRST so its group "Páginas y Contenido" is encountered before
  // "Portafolio" (Media/Projects) and "Ajustes" (Users).
  collections: [Pages, Media, Categories, Projects, Users],
  globals: [Navigation, Home, SectionText, CaseStudy, About, Career, UiStrings],
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
        media: true,
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
