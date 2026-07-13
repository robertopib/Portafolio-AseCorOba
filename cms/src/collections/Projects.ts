import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Imagen de Proyecto',
    plural: 'Imágenes de Proyectos',
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Portafolio',
    description:
      'Las tarjetas con imagen de cada proyecto. Elige la página y dónde se muestra.',
    defaultColumns: ['image', 'section', 'placement', 'group', 'order', 'alt'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'section',
      type: 'select',
      required: true,
      label: 'Página',
      admin: {
        description: '¿En qué página aparece esta imagen?',
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
      required: true,
      label: 'Dónde se muestra',
      admin: {
        description: 'Elige dónde aparece esta tarjeta.',
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
        description:
          'Solo para Branding: subgrupo (p. ej. deportes, belleza, logos).',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Imagen',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      label: 'Orden',
      admin: {
        description:
          'Número para ordenar dentro de su grupo (el menor aparece primero).',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Título',
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texto alternativo (accesibilidad)',
    },
    {
      name: 'category',
      type: 'text',
      localized: true,
      label: 'Categoría',
    },
  ],
}
