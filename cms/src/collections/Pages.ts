import type { CollectionConfig } from 'payload'

/**
 * Páginas — data-driven page composition.
 *
 * A Página is an ordered, drag-reorderable list of `blocks`. Each block picks
 * a `blockType` (which front-end section to render) and an optional `anchorId`.
 * The front end reads this order from content/pages.json (emitted by
 * export-content) and renders each block via the ORIGINAL section component, so
 * the design stays pixel-identical while the CMS controls composition.
 *
 * `blockType` values map 1:1 to the front-end block registry in
 * src/app/PageRenderer.tsx.
 */
const BLOCK_OPTIONS = [
  { label: 'Portada', value: 'hero' },
  { label: 'Branding (vista previa)', value: 'brandingPreview' },
  { label: 'Web y Apps', value: 'webAppsPreview' },
  { label: 'UX/UI', value: 'uxuiPreview' },
  { label: 'Fotografía', value: 'fotografiaPreview' },
  { label: 'Marketing 360°', value: 'marketingPreview' },
  { label: 'Experiencia laboral', value: 'experiencia' },
  { label: 'Sobre mí y contacto', value: 'contacto' },
]

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
      'Cada página del sitio y el orden de sus bloques. Arrastra los bloques para reordenarlos, o agrégalos y elimínalos.',
    defaultColumns: ['title', 'slug'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Título',
      admin: { description: 'El nombre de la página (se usa como título en el panel).' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Identificador (slug)',
      admin: {
        description:
          'Identificador técnico único (p. ej. "home"). No cambiar salvo que sepas lo que haces.',
      },
    },
    {
      name: 'blocks',
      type: 'array',
      label: 'Bloques',
      labels: { singular: 'Bloque', plural: 'Bloques' },
      admin: {
        description:
          'Los bloques de la página, en orden. Arrastra para reordenar; el orden se refleja en la web.',
      },
      fields: [
        {
          name: 'blockType',
          type: 'select',
          required: true,
          label: 'Tipo de bloque',
          options: BLOCK_OPTIONS,
          admin: { description: 'Qué sección mostrar en este bloque.' },
        },
        {
          name: 'anchorId',
          type: 'text',
          label: 'Ancla (anchor)',
          admin: {
            description:
              'Opcional. Id de ancla para saltar a este bloque (uso técnico).',
          },
        },
      ],
    },
  ],
}
