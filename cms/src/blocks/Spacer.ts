import type { Block } from 'payload'

/**
 * Spacer — vertical spacing between blocks. Language-agnostic.
 */
export const Spacer: Block = {
  slug: 'spacer',
  interfaceName: 'SpacerBlock',
  labels: {
    singular: 'Espacio',
    plural: 'Espacios',
  },
  fields: [
    {
      name: 'size',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      label: 'Tamaño',
      options: [
        { label: 'Pequeño', value: 'small' },
        { label: 'Mediano', value: 'medium' },
        { label: 'Grande', value: 'large' },
        { label: 'Extra grande', value: 'xlarge' },
      ],
    },
  ],
}
