import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * ExperienceAccordion — mirrors Career.experience
 * (rows of role / period / responsibilities, all localized). Optional headings
 * mirror Career.headings.
 */
export const ExperienceAccordion: Block = {
  slug: 'experienceAccordion',
  // Short dbName: the default table name (with the drafts `_pages_v_blocks_`
  // prefix + localized nested arrays) exceeds Postgres' 63-char identifier limit.
  dbName: 'exp_acc',
  interfaceName: 'ExperienceAccordionBlock',
  labels: {
    singular: 'Experiencia (acordeón)',
    plural: 'Bloques de experiencia',
  },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos',
      fields: [
        { name: 'careerPath', type: 'text', localized: true, label: 'Título "Trayectoria"' },
        {
          name: 'professionalExperience',
          type: 'text',
          localized: true,
          label: 'Título "Experiencia profesional"',
        },
      ],
    },
    {
      name: 'experience',
      type: 'array',
      dbName: 'exp',
      label: 'Experiencia',
      labels: { singular: 'Puesto', plural: 'Puestos' },
      fields: [
        { name: 'role', type: 'text', localized: true, label: 'Puesto / cargo' },
        { name: 'period', type: 'text', localized: true, label: 'Periodo (fechas)' },
        {
          name: 'responsibilities',
          type: 'array',
          dbName: 'resp',
          label: 'Responsabilidades',
          labels: { singular: 'Responsabilidad', plural: 'Responsabilidades' },
          fields: [
            { name: 'item', type: 'text', localized: true, label: 'Punto' },
          ],
        },
      ],
    },
    anchorField,
  ],
}
