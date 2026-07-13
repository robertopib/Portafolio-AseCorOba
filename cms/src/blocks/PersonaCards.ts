import type { Block } from 'payload'

/**
 * PersonaCards — mirrors CaseStudy.personas
 * ({ title, intro:[...], qa:[{question, answer:[...]}],
 *    sectionLabels:{basicInfo,channels,motivations,painPoints},
 *    cards:[{name,descriptor,quote,basicInfo:[...],channels:[...],
 *            motivations:[...],painPoints:[...]}] }).
 */
export const PersonaCards: Block = {
  slug: 'personaCards',
  interfaceName: 'PersonaCardsBlock',
  labels: {
    singular: 'Fichas de persona',
    plural: 'Bloques de fichas de persona',
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
      name: 'qa',
      type: 'array',
      label: 'Preguntas y respuestas',
      labels: { singular: 'Pregunta', plural: 'Preguntas' },
      fields: [
        { name: 'question', type: 'textarea', localized: true, label: 'Pregunta' },
        {
          name: 'answer',
          type: 'array',
          label: 'Respuesta',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [
            { name: 'text', type: 'textarea', localized: true, label: 'Párrafo' },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'sectionLabels',
      label: 'Etiquetas de las fichas',
      fields: [
        { name: 'basicInfo', type: 'text', localized: true, label: 'Información básica' },
        { name: 'channels', type: 'text', localized: true, label: 'Canales' },
        { name: 'motivations', type: 'text', localized: true, label: 'Motivaciones' },
        { name: 'painPoints', type: 'text', localized: true, label: 'Frustraciones' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Fichas de persona',
      labels: { singular: 'Ficha', plural: 'Fichas' },
      fields: [
        { name: 'name', type: 'text', localized: true, label: 'Nombre' },
        { name: 'descriptor', type: 'text', localized: true, label: 'Descriptor' },
        { name: 'quote', type: 'textarea', localized: true, label: 'Cita' },
        {
          name: 'basicInfo',
          type: 'array',
          label: 'Información básica',
          labels: { singular: 'Punto', plural: 'Puntos' },
          fields: [{ name: 'text', type: 'text', localized: true, label: 'Punto' }],
        },
        {
          name: 'channels',
          type: 'array',
          label: 'Canales',
          labels: { singular: 'Canal', plural: 'Canales' },
          fields: [{ name: 'text', type: 'text', localized: true, label: 'Canal' }],
        },
        {
          name: 'motivations',
          type: 'array',
          label: 'Motivaciones',
          labels: { singular: 'Motivación', plural: 'Motivaciones' },
          fields: [{ name: 'text', type: 'text', localized: true, label: 'Motivación' }],
        },
        {
          name: 'painPoints',
          type: 'array',
          label: 'Frustraciones',
          labels: { singular: 'Frustración', plural: 'Frustraciones' },
          fields: [{ name: 'text', type: 'text', localized: true, label: 'Frustración' }],
        },
      ],
    },
  ],
}
