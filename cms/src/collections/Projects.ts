import type { CollectionConfig } from 'payload'
import { caseStudyBodyField } from '../blocks/caseStudyBody'

/**
 * Proyectos — the leaf level of the "Categorías → Proyectos" model.
 *
 * A Proyecto is either:
 *   - type='image'     : a normal project card (image + title/alt/category), OR
 *   - type='caseStudy' : the full UX/UI case study (the `caseStudy` group holds
 *                        all of content/sections/uxui-casestudy.json).
 *
 * Each Proyecto belongs to a Categoría (relationship) and declares where it
 * shows (home preview, category page, or both). `group` is only used for the
 * branding sub-groups (sports / adrianaMunoz / anaGrace / logos).
 *
 * `size` is a masonry span token for the layout; it is CMS-organizational and
 * does not appear in the content JSON. `order` sorts cards within their group.
 *
 * The `caseStudy` group uses a short dbName ('cs') so its deeply-nested
 * localized arrays stay within Postgres' 63-char table-name limit.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Proyecto',
    plural: 'Proyectos',
  },
  // Content is public: the front-end build reads it over the REST API without
  // auth. Create/update/delete stay auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'internalTitle',
    group: 'Portafolio',
    description:
      'Cada proyecto del portafolio. Elige su categoría, el tipo, y dónde se muestra.',
    defaultColumns: ['internalTitle', 'category', 'type', 'placement', 'group', 'order'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Categoría',
      admin: {
        description: '¿A qué categoría pertenece este proyecto?',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'image',
      label: 'Tipo',
      options: [
        { label: 'Imagen (tarjeta normal)', value: 'image' },
        { label: 'Caso de estudio (UX/UI)', value: 'caseStudy' },
      ],
      admin: {
        description: 'Una tarjeta de imagen normal, o un caso de estudio completo.',
      },
    },
    {
      name: 'placement',
      type: 'select',
      required: true,
      label: 'Dónde se muestra',
      admin: {
        description: 'Elige dónde aparece esta tarjeta.',
      },
      options: [
        { label: 'Solo vista previa (inicio)', value: 'home' },
        { label: 'Solo página de la categoría', value: 'page' },
        { label: 'Ambas', value: 'both' },
      ],
    },
    {
      name: 'group',
      type: 'text',
      label: 'Grupo',
      admin: {
        description:
          'Solo para Branding: subgrupo (sports, adrianaMunoz, anaGrace, logos).',
      },
    },
    {
      name: 'size',
      type: 'select',
      label: 'Tamaño (masonry)',
      admin: {
        description: 'Cuánto espacio ocupa la tarjeta en la cuadrícula.',
      },
      options: [
        { label: 'Pequeño', value: 'small' },
        { label: 'Mediano', value: 'medium' },
        { label: 'Grande', value: 'large' },
        { label: 'Ancho', value: 'wide' },
        { label: 'Alto', value: 'tall' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen',
      admin: {
        description: 'La imagen de la tarjeta.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      label: 'Orden',
      admin: {
        description:
          'Número para ordenar dentro de su grupo (el menor aparece primero).',
      },
    },
    {
      name: 'internalTitle',
      type: 'text',
      label: 'Título interno',
      admin: {
        description: 'Nombre solo para el panel (no se muestra en la web).',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Identificador (slug)',
      index: true,
      admin: {
        description:
          'Solo casos de estudio: identificador de la página del caso, usado en la URL /proyectos/<categoría>/<slug>.',
        condition: (data) => data?.type === 'caseStudy',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Título',
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texto alternativo (accesibilidad)',
    },
    {
      name: 'categoryLabel',
      type: 'text',
      localized: true,
      label: 'Etiqueta de categoría',
      admin: {
        description: 'La etiqueta pequeña de la tarjeta (p. ej. "Logo", "Social Media").',
      },
    },

    // ================= CASE STUDY BODY (inline post body) =================
    // Only used when type='caseStudy'. The case study as an ordered, inline
    // block layout edited on the Proyecto (like a WP post body). Each block is
    // one case-study sub-block carrying its own slice. This is the SOURCE the
    // front-end case-study TEMPLATE renders at /proyectos/:cat/:slug (and, for
    // the single uxui case study, at /proyectos/uxui-producto). See
    // blocks/caseStudyBody.ts.
    caseStudyBodyField(),

    // ================= CASE STUDY (legacy round-trip source) =================
    // Only used when type='caseStudy'. Mirrors content/sections/uxui-casestudy.json
    // and remains the round-trip source for that committed file (seed reads it in;
    // export reconstructs it). The `body` above is populated from the same JSON.
    {
      type: 'group',
      name: 'caseStudy',
      label: 'Caso de estudio (UX/UI)',
      admin: {
        description: 'Todo el contenido de la página del caso de estudio.',
        condition: (data) => data?.type === 'caseStudy',
      },
      fields: [
        // header: { title:{es,en}, tagline:{es,en} }
        {
          type: 'group',
          name: 'header',
          label: 'Encabezado',
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
          fields: [
            { name: 'image', type: 'text', label: 'Imagen (ruta)' }, // language-agnostic
            { name: 'alt', type: 'text', localized: true, label: 'Texto alternativo' },
          ],
        },
        // project: { name, subtitle, overview:[{label,text}] }
        {
          type: 'group',
          name: 'project',
          label: 'El proyecto',
          fields: [
            { name: 'name', type: 'text', localized: true, label: 'Nombre del proyecto' },
            { name: 'subtitle', type: 'text', localized: true, label: 'Subtítulo' },
            {
              name: 'overview',
              type: 'array',
              label: 'Resumen',
              labels: { singular: 'Dato', plural: 'Datos' },
              fields: [
                { name: 'label', type: 'text', localized: true, label: 'Etiqueta' },
                { name: 'text', type: 'textarea', localized: true, label: 'Texto' },
              ],
            },
          ],
        },
        // intro: [ {es,en} ]
        {
          name: 'intro',
          type: 'array',
          label: 'Introducción',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [{ name: 'text', type: 'textarea', localized: true, label: 'Párrafo' }],
        },
        // problemSolution: { problem:{label,text}, solution:{label,text} }
        {
          type: 'group',
          name: 'problemSolution',
          label: 'Problema y solución',
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
        // details: { headers:{tools,team,role}, rows:[{tools,team,role}] }
        {
          type: 'group',
          name: 'details',
          label: 'Detalles del proyecto',
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
        // timeline: { title, durationLabel, durationValue, phases:[{phase,duration}] }
        {
          type: 'group',
          name: 'timeline',
          label: 'Cronograma',
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
        // journey: { title, intro:[...], labels:{...}, stages:[...], qa:[...] }
        {
          type: 'group',
          name: 'journey',
          label: 'Recorrido del usuario (User Journey)',
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
                { name: 'number', type: 'text', label: 'Número' }, // language-agnostic
                { name: 'name', type: 'text', localized: true, label: 'Nombre' },
                { name: 'action', type: 'textarea', localized: true, label: 'Acción' },
                { name: 'thought', type: 'text', localized: true, label: 'Pensamiento' },
                { name: 'friction', type: 'text', localized: true, label: 'Fricción' },
              ],
            },
            // qa rows: most have a scalar `answer`; one has `bullets`.
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
        // personas: { title, intro:[...], qa:[{question,answer:[...]}],
        //             sectionLabels:{...}, cards:[...] }
        {
          type: 'group',
          name: 'personas',
          label: 'Personas (usuarios tipo)',
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
        // sketches: { title, intro:[...], qa:[{question,answer}] }
        {
          type: 'group',
          name: 'sketches',
          label: 'Bocetos',
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
        // learnings: { title, qa:[{question,answer:[...]}] }
        {
          type: 'group',
          name: 'learnings',
          label: 'Aprendizajes',
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
    },
  ],
}
