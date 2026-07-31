import type { CollectionConfig } from 'payload'

import { generateMediaThumbnail } from './hooks/generate-media-thumbnail'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Imagen',
    plural: 'Biblioteca de Imágenes',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Portafolio',
    description:
      'Todas las imágenes subidas. Sube aquí una imagen antes de usarla en un proyecto.',
    // Show the thumbnail preview first so the list is visually scannable (R10).
    defaultColumns: ['preview', 'alt', 'updatedAt'],
  },
  fields: [
    {
      // Virtual (no DB column) preview column: a server Cell renders the R2
      // thumbnail. See components/MediaThumbnailCell.tsx.
      name: 'preview',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Cell: '/components/MediaThumbnailCell#MediaThumbnailCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texto alternativo',
      admin: {
        description:
          'Breve descripción de la imagen (para accesibilidad). Sirve también como nombre en la biblioteca.',
      },
    },
  ],
  hooks: {
    // Because clientUploads skips server-side sharp (see the upload note below), we
    // generate the thumbnail ourselves after each create/update. See the hook file.
    afterChange: [generateMediaThumbnail],
  },
  upload: {
    // Small WebP thumbnail so the media grid + relationship pickers are scannable
    // (originals are 11–18 MB, too heavy to preview). Public site keeps using the
    // full-size R2 URLs — this size is admin-only.
    // NOTE: with clientUploads (see payload.config.ts) the browser PUTs originals
    // straight to R2, so the server never runs sharp on new uploads and these sizes
    // are NOT auto-generated — generateMediaThumbnail (hooks.afterChange) does it.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        // height omitted → preserve aspect ratio
        formatOptions: { format: 'webp', options: { quality: 70 } },
      },
    ],
    // Point the admin thumbnail straight at the R2 public URL of the generated
    // `thumbnail` size. We do NOT use the size-name string form: with
    // `disablePayloadAccessControl` the files live in R2, so Payload's computed
    // `thumbnailURL` (the `/api/media/file/…` proxy) 500s. Building from the stored
    // thumbnail filename + R2_PUBLIC_URL works for both hook- and backfill-generated
    // sizes regardless of what `sizes.thumbnail.url` was persisted as. Runs
    // server-side, so R2_PUBLIC_URL is available.
    adminThumbnail: ({ doc }) => {
      const fn = (doc as { sizes?: { thumbnail?: { filename?: string | null } } })?.sizes
        ?.thumbnail?.filename
      const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
      return fn && base ? `${base}/${fn}` : null
    },
  },
}
