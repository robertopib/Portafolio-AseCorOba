import type { Block } from 'payload'

/**
 * TwoColumn — two side-by-side text columns with optional labels.
 * Mirrors CaseStudy.problemSolution ({ problem, solution } each with label + text).
 */
export const TwoColumn: Block = {
  slug: 'twoColumn',
  interfaceName: 'TwoColumnBlock',
  labels: {
    singular: 'Dos columnas',
    plural: 'Bloques de dos columnas',
  },
  fields: [
    {
      type: 'group',
      name: 'left',
      label: 'Columna izquierda',
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
        { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
      ],
    },
    {
      type: 'group',
      name: 'right',
      label: 'Columna derecha',
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
        { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
      ],
    },
  ],
}
