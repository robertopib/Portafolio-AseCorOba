import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * RichTextBlock — a run of localized paragraphs (mirrors CaseStudy.intro and the
 * various `intro: [{ text }]` arrays). Kept as a textarea array so bilingual
 * content round-trips as parallel es/en arrays via ?locale=all.
 */
export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: 'Texto (párrafos)',
    plural: 'Textos (párrafos)',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      label: 'Título (opcional)',
    },
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Párrafos',
      labels: { singular: 'Párrafo', plural: 'Párrafos' },
      fields: [
        { name: 'text', type: 'textarea', localized: true, label: 'Párrafo' },
      ],
    },
    anchorField,
  ],
}
