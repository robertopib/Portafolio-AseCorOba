import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * SectionHeading — an eyebrow/number + a heading. Heading and eyebrow are
 * localized; `number` (e.g. "01") is language-agnostic.
 */
export const SectionHeading: Block = {
  slug: 'sectionHeading',
  interfaceName: 'SectionHeadingBlock',
  labels: {
    singular: 'Título de sección',
    plural: 'Títulos de sección',
  },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true, label: 'Antetítulo (eyebrow)' },
    { name: 'number', type: 'text', label: 'Número (p. ej. 01)' },
    { name: 'heading', type: 'text', localized: true, label: 'Título' },
    anchorField,
  ],
}
