import type { Block } from 'payload'

/**
 * ProjectGallery block — selects which project cards to render and how.
 *
 * `source`:
 *   - 'by-filter': pull projects from the `projects` collection matching
 *     section / placement / group (mirrors Projects.ts field options).
 *   - 'manual': hand-pick specific project documents.
 * `layoutVariant` maps to the existing per-page grid CSS on the front end.
 */
export const ProjectGallery: Block = {
  slug: 'projectGallery',
  interfaceName: 'ProjectGalleryBlock',
  labels: {
    singular: 'Galería de proyectos',
    plural: 'Galerías de proyectos',
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'by-filter',
      label: 'Origen de los proyectos',
      admin: {
        description: '¿Cómo eliges las imágenes que se muestran?',
      },
      options: [
        { label: 'Por filtro (automático)', value: 'by-filter' },
        { label: 'Selección manual', value: 'manual' },
      ],
    },
    // --- by-filter ---
    {
      name: 'section',
      type: 'select',
      label: 'Página / sección',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description: '¿De qué sección tomar las imágenes?',
      },
      options: [
        { label: 'Branding', value: 'branding' },
        { label: 'Web y Apps', value: 'web-apps' },
        { label: 'UX/UI Producto', value: 'uxui-producto' },
        { label: 'Fotografía de Producto', value: 'fotografia-producto' },
        { label: 'Marketing 360°', value: 'marketing-360' },
      ],
    },
    {
      name: 'placement',
      type: 'select',
      label: 'Dónde se muestra',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description: 'Filtra por el campo "Dónde se muestra" de cada proyecto.',
      },
      options: [
        { label: 'Solo vista previa (inicio)', value: 'home' },
        { label: 'Solo página del proyecto', value: 'page' },
        { label: 'Ambas', value: 'both' },
      ],
    },
    {
      name: 'group',
      type: 'text',
      label: 'Grupo',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description:
          'Opcional. Solo para Branding: subgrupo (p. ej. deportes, belleza, logos).',
      },
    },
    // --- manual ---
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Proyectos',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: 'Elige a mano las tarjetas de proyecto que quieres mostrar.',
      },
    },
    // --- layout ---
    {
      name: 'layoutVariant',
      type: 'select',
      required: true,
      defaultValue: 'grid-3',
      label: 'Diseño de la cuadrícula',
      admin: {
        description: 'Cómo se distribuyen las tarjetas.',
      },
      options: [
        { label: 'Mosaico — Branding', value: 'masonry-branding' },
        { label: 'Cuadrícula de 3', value: 'grid-3' },
        { label: 'Mosaico — Fotografía', value: 'masonry-photo' },
        { label: 'Cuadrícula de 4', value: 'grid-4' },
        { label: 'Una sola imagen', value: 'single' },
      ],
    },
  ],
}
