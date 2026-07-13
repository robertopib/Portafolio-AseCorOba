import type { Block } from 'payload'

/**
 * InfoColumns — mirrors About (education / tools / languages).
 *   - education: array of localized items (per-locale parallel lists).
 *   - tools / languages: language-agnostic string lists.
 * Section headings mirror About.headings.
 */
export const InfoColumns: Block = {
  slug: 'infoColumns',
  interfaceName: 'InfoColumnsBlock',
  labels: {
    singular: 'Columnas de información',
    plural: 'Bloques de columnas de información',
  },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos de las columnas',
      fields: [
        { name: 'education', type: 'text', localized: true, label: 'Título de Formación' },
        { name: 'tools', type: 'text', localized: true, label: 'Título de Herramientas' },
        { name: 'languages', type: 'text', localized: true, label: 'Título de Idiomas' },
      ],
    },
    {
      name: 'education',
      type: 'array',
      label: 'Formación',
      labels: { singular: 'Estudio', plural: 'Estudios' },
      fields: [
        { name: 'item', type: 'text', localized: true, label: 'Estudio' },
      ],
    },
    {
      name: 'tools',
      type: 'array',
      label: 'Herramientas',
      labels: { singular: 'Herramienta', plural: 'Herramientas' },
      admin: { description: 'Igual en ambos idiomas.' },
      fields: [{ name: 'value', type: 'text', label: 'Herramienta' }],
    },
    {
      name: 'languages',
      type: 'array',
      label: 'Idiomas',
      labels: { singular: 'Idioma', plural: 'Idiomas' },
      admin: { description: 'Igual en ambos idiomas.' },
      fields: [{ name: 'value', type: 'text', label: 'Idioma' }],
    },
  ],
}
