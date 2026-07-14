import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * DetailsTable — a simple label/value table.
 * Mirrors CaseStudy.details (headers + rows of tools/team/role) in a generic
 * label/value shape so any details table can be represented.
 */
export const DetailsTable: Block = {
  slug: 'detailsTable',
  interfaceName: 'DetailsTableBlock',
  labels: {
    singular: 'Tabla de detalles',
    plural: 'Tablas de detalles',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Título (opcional)',
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Filas',
      labels: { singular: 'Fila', plural: 'Filas' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
        { name: 'value', type: 'textarea', localized: true, label: 'Valor' },
      ],
    },
    anchorField,
  ],
}
