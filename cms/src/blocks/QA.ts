import type { Block } from 'payload'

/**
 * QA — question/answer list (mirrors CaseStudy.sketches.qa / learnings.qa).
 * Each item has a localized question, an optional localized answer, and an
 * optional bullets array so both scalar-answer and bulleted-answer entries fit.
 */
export const QA: Block = {
  slug: 'qa',
  interfaceName: 'QABlock',
  labels: {
    singular: 'Preguntas y respuestas',
    plural: 'Bloques de preguntas y respuestas',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: 'Título (opcional)' },
    {
      name: 'items',
      type: 'array',
      label: 'Preguntas',
      labels: { singular: 'Pregunta', plural: 'Preguntas' },
      fields: [
        { name: 'question', type: 'textarea', localized: true, label: 'Pregunta' },
        { name: 'answer', type: 'textarea', localized: true, label: 'Respuesta' },
        {
          name: 'bullets',
          type: 'array',
          label: 'Puntos (opcional)',
          labels: { singular: 'Punto', plural: 'Puntos' },
          fields: [
            { name: 'text', type: 'textarea', localized: true, label: 'Punto' },
          ],
        },
      ],
    },
  ],
}
