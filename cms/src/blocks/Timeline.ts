import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * Timeline — mirrors CaseStudy.timeline
 * ({ title, durationLabel, durationValue, phases: [{ phase, duration }] }).
 */
export const Timeline: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  labels: {
    singular: 'Cronograma',
    plural: 'Cronogramas',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: 'Título' },
    {
      name: 'durationLabel',
      type: 'text',
      localized: true,
      label: 'Etiqueta de duración',
    },
    {
      name: 'durationValue',
      type: 'text',
      localized: true,
      label: 'Duración',
    },
    {
      name: 'phases',
      type: 'array',
      label: 'Fases',
      labels: { singular: 'Fase', plural: 'Fases' },
      fields: [
        { name: 'phase', type: 'text', localized: true, label: 'Fase' },
        { name: 'duration', type: 'text', localized: true, label: 'Duración' },
      ],
    },
    anchorField,
  ],
}
