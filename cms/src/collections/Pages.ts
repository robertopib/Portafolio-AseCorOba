import type { CollectionConfig } from 'payload'
import { inlineContentFields } from '../blocks/contentFields'

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
  // ---- Home (vista previa) ----
  { label: 'Portada', value: 'hero' },
  { label: 'Branding (vista previa)', value: 'brandingPreview' },
  { label: 'Web y Apps (vista previa)', value: 'webAppsPreview' },
  { label: 'UX/UI (vista previa)', value: 'uxuiPreview' },
  { label: 'Fotografía (vista previa)', value: 'fotografiaPreview' },
  { label: 'Marketing 360° (vista previa)', value: 'marketingPreview' },
  { label: 'Experiencia laboral', value: 'experiencia' },
  { label: 'Sobre mí y contacto', value: 'contacto' },

  // ---- Branding (página de proyecto) ----
  { label: 'Branding · Encabezado', value: 'brandingHeader' },
  { label: 'Branding · Galería Deportes', value: 'gallery:deportes' },
  { label: 'Branding · Galería Belleza', value: 'gallery:belleza' },
  { label: 'Branding · Galería Logos', value: 'gallery:logos' },

  // ---- Web y Apps (página de proyecto) ----
  { label: 'Web y Apps · Encabezado', value: 'webAppsHeader' },
  { label: 'Web y Apps · Galería', value: 'webAppsGallery' },

  // ---- Fotografía (página de proyecto) ----
  { label: 'Fotografía · Encabezado', value: 'fotografiaHeader' },
  { label: 'Fotografía · Galería', value: 'fotografiaGallery' },

  // ---- Marketing 360° (página de proyecto) ----
  { label: 'Marketing · Encabezado', value: 'marketingHeader' },
  { label: 'Marketing · Galería', value: 'marketingGallery' },

  // ---- UX/UI Producto (caso de estudio, por sub-bloques) ----
  { label: 'UX/UI · Encabezado', value: 'uxuiHeader' },
  { label: 'UX/UI · Imagen principal', value: 'uxuiHero' },
  { label: 'UX/UI · Resumen', value: 'uxuiOverview' },
  { label: 'UX/UI · Introducción', value: 'uxuiIntro' },
  { label: 'UX/UI · Problema y Solución', value: 'uxuiProblemSolution' },
  { label: 'UX/UI · Detalles', value: 'uxuiDetails' },
  { label: 'UX/UI · Cronograma', value: 'uxuiTimeline' },
  { label: 'UX/UI · User Journey', value: 'uxuiJourney' },
  { label: 'UX/UI · User Personas', value: 'uxuiPersonas' },
  { label: 'UX/UI · Bocetos', value: 'uxuiSketches' },
  { label: 'UX/UI · Aprendizajes', value: 'uxuiLearnings' },
]

/**
 * Which blockTypes are galleries that draw their cards from the
 * Categorías → Proyectos model. For these, the `source` group tells the export
 * which Proyectos to resolve (category slug + placement + optional group).
 */
const GALLERY_BLOCK_TYPES = [
  'gallery:deportes',
  'gallery:belleza',
  'gallery:logos',
  'webAppsGallery',
  'fotografiaGallery',
  'marketingGallery',
]

const CATEGORY_SLUG_OPTIONS = [
  { label: 'Branding', value: 'branding' },
  { label: 'Web y Apps', value: 'web-apps' },
  { label: 'UX/UI Producto', value: 'uxui-producto' },
  { label: 'Fotografía de Producto', value: 'fotografia-producto' },
  { label: 'Marketing 360°', value: 'marketing-360' },
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
        {
          name: 'subheading',
          type: 'text',
          localized: true,
          label: 'Subtítulo de la galería',
          admin: {
            description:
              'Opcional. Subtítulo mostrado sobre la galería (p. ej. la categoría del grupo).',
            condition: (_data, siblingData) =>
              GALLERY_BLOCK_TYPES.includes(siblingData?.blockType),
          },
        },
        {
          name: 'source',
          type: 'group',
          label: 'Origen de la galería',
          admin: {
            description:
              'De dónde salen las imágenes de esta galería (categoría + ubicación + grupo).',
            condition: (_data, siblingData) =>
              GALLERY_BLOCK_TYPES.includes(siblingData?.blockType),
          },
          fields: [
            {
              name: 'category',
              type: 'select',
              label: 'Categoría',
              options: CATEGORY_SLUG_OPTIONS,
              admin: { description: 'Categoría cuyas imágenes se muestran.' },
            },
            {
              name: 'placement',
              type: 'select',
              label: 'Ubicación',
              options: [
                { label: 'Página de proyecto', value: 'page' },
                { label: 'Inicio (home)', value: 'home' },
              ],
              admin: { description: 'Qué conjunto de Proyectos usar.' },
            },
            {
              name: 'group',
              type: 'text',
              label: 'Grupo',
              admin: {
                description:
                  'Opcional. Subgrupo dentro de la categoría (p. ej. sports, adrianaMunoz, anaGrace, logos para Branding).',
              },
            },
          ],
        },
        // Inline CONTENT groups (one per CONTENT block family). Each is shown +
        // populated only for its matching blockType; the front-end reads it via
        // the block's `content` prop. See blocks/contentFields.ts.
        ...inlineContentFields(),
      ],
    },
  ],
}
