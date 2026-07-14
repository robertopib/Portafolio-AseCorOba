import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * JourneyMap — mirrors CaseStudy.journey
 * ({ title, intro:[...], labels:{action,thought,friction},
 *    stages:[{number,name,action,thought,friction}],
 *    qa:[{question, answer?, bullets?}] }).
 */
export const JourneyMap: Block = {
  slug: 'journeyMap',
  interfaceName: 'JourneyMapBlock',
  labels: {
    singular: 'Recorrido del usuario',
    plural: 'Recorridos del usuario',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: 'Título' },
    {
      name: 'intro',
      type: 'array',
      label: 'Introducción',
      labels: { singular: 'Párrafo', plural: 'Párrafos' },
      fields: [
        { name: 'text', type: 'textarea', localized: true, label: 'Párrafo' },
      ],
    },
    {
      type: 'group',
      name: 'labels',
      label: 'Etiquetas',
      fields: [
        { name: 'action', type: 'text', localized: true, label: 'Acción' },
        { name: 'thought', type: 'text', localized: true, label: 'Pensamiento' },
        { name: 'friction', type: 'text', localized: true, label: 'Fricción' },
      ],
    },
    {
      name: 'stages',
      type: 'array',
      label: 'Etapas',
      labels: { singular: 'Etapa', plural: 'Etapas' },
      fields: [
        { name: 'number', type: 'text', label: 'Número' },
        { name: 'name', type: 'text', localized: true, label: 'Nombre' },
        { name: 'action', type: 'textarea', localized: true, label: 'Acción' },
        { name: 'thought', type: 'text', localized: true, label: 'Pensamiento' },
        { name: 'friction', type: 'text', localized: true, label: 'Fricción' },
      ],
    },
    {
      name: 'qa',
      type: 'array',
      label: 'Preguntas y respuestas',
      labels: { singular: 'Pregunta', plural: 'Preguntas' },
      fields: [
        { name: 'question', type: 'textarea', localized: true, label: 'Pregunta' },
        { name: 'answer', type: 'textarea', localized: true, label: 'Respuesta' },
        {
          name: 'bullets',
          type: 'array',
          label: 'Puntos',
          labels: { singular: 'Punto', plural: 'Puntos' },
          fields: [
            { name: 'text', type: 'textarea', localized: true, label: 'Punto' },
          ],
        },
      ],
    },
    anchorField,
  ],
}
