import type { CollectionConfig } from 'payload'

import { allBlocks } from '../blocks'

/**
 * Pages — the page-builder collection. Each page has an addressable slug and a
 * `layout` composed of any of the blocks in the block library.
 *
 * Drafts are enabled so pages can be edited and previewed before publishing.
 * Live Preview points at the (future) front-end preview route.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Página',
    plural: 'Páginas',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Páginas y Contenido',
    description:
      'Las páginas del sitio, construidas con bloques. Arrastra bloques para armar cada página.',
    defaultColumns: ['title', 'slug', 'showInNav', 'navOrder'],
    livePreview: {
      url: ({ data }) =>
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/preview/${data?.slug ?? ''}`,
      breakpoints: [
        { name: 'mobile', label: 'Móvil', width: 375, height: 667 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'desktop', label: 'Escritorio', width: 1440, height: 900 },
      ],
    },
  },
  // NOTE: drafts were disabled during the Phase-3 migration. The Neon dev DB's
  // `_pages_v*` version tables were left in a stale/inconsistent state (dev push
  // did not heal them), which aborted every Pages write inside the version
  // cleanup step. This build-time-export workflow only ever publishes, so drafts
  // are not needed. Re-enable with `versions: { drafts: true }` once the version
  // tables can be rebuilt (a fresh migration / fresh DB).
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: 'Título',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      label: 'Dirección (slug)',
      admin: {
        description:
          "la dirección de la página, p.ej. proyectos/branding; usa '' o 'home' para la portada",
      },
    },
    {
      name: 'menuLabel',
      type: 'text',
      localized: true,
      label: 'Texto en el menú',
      admin: {
        description: 'Cómo aparece esta página en el menú de navegación.',
      },
    },
    {
      name: 'showInNav',
      type: 'checkbox',
      defaultValue: false,
      label: '¿Mostrar en el menú?',
    },
    {
      name: 'navOrder',
      type: 'number',
      label: 'Orden en el menú',
      admin: {
        description: 'El número menor aparece primero.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Contenido de la página',
      labels: { singular: 'Bloque', plural: 'Bloques' },
      admin: {
        description: 'Añade y ordena los bloques que forman esta página.',
      },
      blocks: allBlocks,
    },
  ],
}
