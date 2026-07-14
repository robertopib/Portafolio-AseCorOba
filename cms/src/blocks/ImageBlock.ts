import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * ImageBlock — a single image from the media library with an optional caption
 * and display width. Image ref is language-agnostic; caption is localized.
 */
export const ImageBlock: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: {
    singular: 'Imagen',
    plural: 'Imágenes',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Imagen',
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'Pie de foto',
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'full',
      label: 'Ancho',
      options: [
        { label: 'Ancho completo', value: 'full' },
        { label: 'Ancho de contenido', value: 'contained' },
        { label: 'Mitad', value: 'half' },
      ],
    },
    anchorField,
  ],
}
