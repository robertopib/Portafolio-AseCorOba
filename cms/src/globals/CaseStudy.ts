import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/sections/uxui-casestudy.json (the "Snaga" UX/UI case study).
 *
 * Every field in the source JSON has a home here. Bilingual {es,en} values are
 * `localized: true`; language-agnostic values (image paths, stage numbers) are not.
 * Arrays of bilingual strings are modeled as arrays of { item/text: localized }
 * rows; with ?locale=all a fetch script can pivot each row's .es/.en to reproduce
 * the original parallel arrays.
 *
 * Top-level JSON keys: header, hero, project, intro, problemSolution, details,
 * timeline, journey, personas, sketches, learnings.
 */
export const CaseStudy: GlobalConfig = {
  slug: 'case-study',
  label: 'Caso de Estudio UX/UI',
  admin: {
    group: 'Páginas y Contenido',
    description: 'Todo el contenido de la página del caso de estudio (Snaga).',
  },
  fields: [
    // header: { title:{es,en}, tagline:{es,en} }
    {
      type: 'group',
      name: 'header',
      label: 'Encabezado',
      admin: { description: 'Título y lema en la parte superior de la página.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
        { name: 'tagline', type: 'text', localized: true, label: 'Lema (tagline)' },
      ],
    },

    // hero: { image (path), alt:{es,en} }
    {
      type: 'group',
      name: 'hero',
      label: 'Imagen principal',
      admin: { description: 'La imagen grande de portada del caso de estudio.' },
      fields: [
        { name: 'image', type: 'text', label: 'Imagen (ruta)' }, // language-agnostic path
        { name: 'alt', type: 'text', localized: true, label: 'Texto alternativo' },
      ],
    },

    // project: { name:{es,en}, subtitle:{es,en}, overview:[ {label:{es,en}, text:{es,en}} ] }
    {
      type: 'group',
      name: 'project',
      label: 'El proyecto',
      admin: { description: 'Nombre, subtítulo y resumen del proyecto.' },
      fields: [
        { name: 'name', type: 'text', localized: true, label: 'Nombre del proyecto' },
        { name: 'subtitle', type: 'text', localized: true, label: 'Subtítulo' },
        {
          name: 'overview',
          type: 'array',
          label: 'Resumen',
          labels: { singular: 'Dato', plural: 'Datos' },
          admin: { description: 'Puntos de resumen (etiqueta + texto).' },
          fields: [
            { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
            { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
          ],
        },
      ],
    },

    // intro: [ {es,en}, ... ]  -> array of localized paragraphs.
    {
      name: 'intro',
      type: 'array',
      label: 'Introducción',
      labels: { singular: 'Párrafo', plural: 'Párrafos' },
      admin: { description: 'Párrafos de introducción del caso de estudio.' },
      fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
    },

    // problemSolution: { problem:{label,text}, solution:{label,text} }
    {
      type: 'group',
      name: 'problemSolution',
      label: 'Problema y solución',
      admin: { description: 'El problema detectado y la solución propuesta.' },
      fields: [
        {
          type: 'group',
          name: 'problem',
          label: 'Problema',
          fields: [
            { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
            { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
          ],
        },
        {
          type: 'group',
          name: 'solution',
          label: 'Solución',
          fields: [
            { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
            { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
          ],
        },
      ],
    },

    // details: { headers:{tools,team,role}, rows:[ {tools,team,role} ] }
    {
      type: 'group',
      name: 'details',
      label: 'Detalles del proyecto',
      admin: { description: 'Tabla de herramientas, equipo y rol.' },
      fields: [
        {
          type: 'group',
          name: 'headers',
          label: 'Encabezados de la tabla',
          fields: [
            { name: 'tools', type: 'text', localized: true, label: 'Herramientas' },
            { name: 'team', type: 'text', localized: true, label: 'Equipo' },
            { name: 'role', type: 'text', localized: true, label: 'Rol' },
          ],
        },
        {
          name: 'rows',
          type: 'array',
          label: 'Filas',
          labels: { singular: 'Fila', plural: 'Filas' },
          fields: [
            { name: 'tools', type: 'text', localized: true, label: 'Herramientas' },
            { name: 'team', type: 'text', localized: true, label: 'Equipo' },
            { name: 'role', type: 'text', localized: true, label: 'Rol' },
          ],
        },
      ],
    },

    // timeline: { title, durationLabel, durationValue, phases:[ {phase, duration} ] }
    {
      type: 'group',
      name: 'timeline',
      label: 'Cronograma',
      admin: { description: 'Duración y fases del proyecto.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
        { name: 'durationLabel', type: 'text', localized: true, label: 'Etiqueta de duración' },
        { name: 'durationValue', type: 'text', localized: true, label: 'Duración' },
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
      ],
    },

    // journey: { title, intro:[...], labels:{action,thought,friction},
    //            stages:[ {number, name, action, thought, friction} ],
    //            qa:[ {question, answer?} | {question, bullets:[...]} ] }
    {
      type: 'group',
      name: 'journey',
      label: 'Recorrido del usuario (User Journey)',
      admin: { description: 'Etapas y preguntas del recorrido del usuario.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
        {
          name: 'intro',
          type: 'array',
          label: 'Introducción',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
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
            { name: 'number', type: 'text', label: 'Número' }, // "1".."5" - language-agnostic
            { name: 'name', type: 'text', localized: true, label: 'Nombre' },
            { name: 'action', type: 'textarea', localized: true, label: 'Acción' },
            { name: 'thought', type: 'text', localized: true, label: 'Pensamiento' },
            { name: 'friction', type: 'text', localized: true, label: 'Fricción' },
          ],
        },
        // qa rows: some have a scalar `answer` ({es,en}), one has `bullets` ([{es,en}]).
        // Both optional fields are provided so every qa entry round-trips.
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
              fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Punto' }],
            },
          ],
        },
      ],
    },

    // personas: { title, intro:[...], qa:[ {question, answer:[...]} ],
    //             sectionLabels:{basicInfo,channels,motivations,painPoints},
    //             cards:[ {name, descriptor, quote, basicInfo:[...], channels:[...],
    //                      motivations:[...], painPoints:[...]} ] }
    {
      type: 'group',
      name: 'personas',
      label: 'Personas (usuarios tipo)',
      admin: { description: 'Perfiles de usuarios tipo del proyecto.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
        {
          name: 'intro',
          type: 'array',
          label: 'Introducción',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
        },
        {
          // personas.qa answers are ARRAYS of paragraphs ({es,en}), unlike journey.qa.
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
              fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
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
    },

    // sketches: { title, intro:[...], qa:[ {question, answer} ] }
    {
      type: 'group',
      name: 'sketches',
      label: 'Bocetos',
      admin: { description: 'Sección de bocetos e ideas iniciales.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
        {
          name: 'intro',
          type: 'array',
          label: 'Introducción',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
        },
        {
          name: 'qa',
          type: 'array',
          label: 'Preguntas y respuestas',
          labels: { singular: 'Pregunta', plural: 'Preguntas' },
          fields: [
            { name: 'question', type: 'textarea', localized: true, label: 'Pregunta' },
            { name: 'answer', type: 'textarea', localized: true, label: 'Respuesta' },
          ],
        },
      ],
    },

    // learnings: { title, qa:[ {question, answer:[...]} ] }  (answers are arrays)
    {
      type: 'group',
      name: 'learnings',
      label: 'Aprendizajes',
      admin: { description: 'Conclusiones y aprendizajes del proyecto.' },
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'Título' },
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
              fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
            },
          ],
        },
      ],
    },
  ],
}
