import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * CategoryShowcase — a home-page block that renders the projects of a single
 * Categoría in a chosen gallery layout. Layout variants mirror ProjectGallery.
 */
export const CategoryShowcase: Block = {
  slug: 'categoryShowcase',
  interfaceName: 'CategoryShowcaseBlock',
  labels: {
    singular: 'Muestra de categoría',
    plural: 'Muestras de categoría',
  },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Categoría',
    },
    {
      name: 'headingOverride',
      type: 'text',
      localized: true,
      label: 'Título alternativo (opcional)',
      admin: {
        description: 'Si lo dejas vacío, se usa el nombre de la categoría.',
      },
    },
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
        { label: 'Cuadrícula de 3', value: 'grid-3' },
        { label: 'Cuadrícula de 4', value: 'grid-4' },
        { label: 'Una sola imagen', value: 'single' },
        { label: 'Mosaico — Fotografía (inicio)', value: 'masonry-photo' },
        { label: 'Mosaico — 6 columnas', value: 'masonry-6' },
        { label: 'Mosaico — 8 columnas', value: 'masonry-8' },
        { label: 'Mosaico — 10 columnas', value: 'masonry-10' },
      ],
    },
    {
      name: 'maxItems',
      type: 'number',
      label: 'Máximo de elementos (opcional)',
      admin: {
        description: 'Limita cuántos proyectos se muestran. Vacío = todos.',
      },
    },
    {
      name: 'showCta',
      type: 'checkbox',
      defaultValue: false,
      label: '¿Mostrar botón?',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      label: 'Texto del botón',
      admin: {
        condition: (_, siblingData) => siblingData?.showCta === true,
      },
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'Enlace del botón (URL)',
      admin: {
        condition: (_, siblingData) => siblingData?.showCta === true,
      },
    },
    anchorField,
  ],
}
