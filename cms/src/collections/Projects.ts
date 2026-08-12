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
    defaultColumns: ['internalTitle', 'cliente', 'category', 'type', 'placement', 'group', 'order'],
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
      // R23b-i. `hasMany: false` with a single `relationTo` is what keeps this a plain FK
      // column on `projects` rather than a `projects_rels` join table — the same shape
      // `category` above already has. Making it hasMany would buy multi-client projects,
      // which owner decision 2 rules out.
      //
      // DELIBERATELY NOT `required`. The UX/UI case study has no client, and a genuinely
      // client-less piece must stay representable. A required relationship would also turn
      // an unanswered worksheet cell into a migration crash; the backfill fails loudly on
      // the *cell* instead (r23-target-model.md §5.2), which is where that check belongs.
      name: 'cliente',
      type: 'relationship',
      relationTo: 'clients',
      hasMany: false,
      label: 'Cliente',
      admin: {
        description:
          '¿Para quién se hizo este trabajo? Un cliente puede tener proyectos en varias categorías; cada uno es un proyecto aparte.',
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
        // Reworded in R23b-i. It used to say "subgrupo", which is what invited R23a to read
        // it as a proto-project. It is not: `sports` holds three unrelated clients. A group
        // selects a LAYOUT SLOT on the branding page — a third axis, distinct from both
        // Categoría and Cliente (r23-target-model.md §3.1).
        description:
          'Solo para Branding: en qué sección de la página aparece este proyecto (sports, adrianaMunoz, anaGrace, logos).',
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

    // ================= IMÁGENES DEL PROYECTO (R23b-i) =================
    // The level the model was missing. A Proyecto is a client's body of work in one
    // categoría; each photograph is a row here, not a Proyecto of its own. The 7-view
    // Vinte-Vinte shoot becomes ONE editable record — the acceptance criterion R23 is
    // judged against.
    //
    // AN ARRAY FIELD, NOT A SECOND COLLECTION (r23-target-model.md §3.3). A collection
    // would re-create seven records plus a parent and split editing across two admin
    // lists — the problem restated in tidier language. The one thing a collection buys,
    // a referenceable cover, is not needed: the home-flagged image IS the cover (§3.2).
    //
    // WHY PLACEMENT LIVES HERE AND NOT ON THE PARENT. Two rows disprove parent-level
    // placement: `WodFest Costa Rica` puts TWO of its images on home, and
    // `fisio-equina.png` is on home and in no page array at all. A parent-level flag can
    // say "this project appears on home", not "these two of its images do".
    //
    // READ BY BOTH EXPORTERS SINCE R23b-ii. R23b-i landed the data while both twins still read
    // the old top-level `image`/`alt`/`order`/… columns above; R23b-ii switched them over and
    // proved the emitted bytes did not move. Those old columns are STILL POPULATED and are the
    // fallback until R23b-iii drops them — deliberately after a successful promotion, so the
    // deploy that first runs the new emitters against production still has a way back.
    {
      name: 'images',
      type: 'array',
      label: 'Imágenes',
      labels: { singular: 'Imagen', plural: 'Imágenes' },
      admin: {
        description:
          'Las fotografías de este proyecto, en orden. Cada una es una tarjeta en la web.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagen',
          admin: { description: 'La fotografía.' },
        },
        {
          name: 'alt',
          type: 'text',
          localized: true,
          label: 'Texto alternativo (accesibilidad)',
          admin: {
            description: 'El texto de la tarjeta en la página de la categoría.',
          },
        },
        {
          name: 'categoryLabel',
          type: 'text',
          localized: true,
          label: 'Etiqueta de categoría',
          admin: {
            description: 'La etiqueta pequeña de la tarjeta (p. ej. "Logo", "Packaging").',
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          label: 'Orden',
          admin: {
            // For Branding this number IS the card id published in
            // content/sections/branding.json (1,2,3,5,…,21 — the gap at 4 is real and must
            // survive). Renumbering changes published output; do not tidy the sequence.
            description:
              'Número para ordenar las tarjetas dentro de la categoría (el menor aparece primero).',
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
          name: 'showOnPage',
          type: 'checkbox',
          // Defaulted on because 39 of the 40 existing photographs are on their category
          // page; an image added with everything off would appear nowhere, silently.
          defaultValue: true,
          label: 'Mostrar en la página de la categoría',
          admin: { description: '¿Aparece esta imagen en la página de su categoría?' },
        },
        {
          name: 'showOnHome',
          type: 'checkbox',
          label: 'Mostrar en la vista previa de inicio',
          admin: {
            description:
              '¿Aparece también en la vista previa de esta categoría en la página de inicio?',
          },
        },
        {
          // Home and the category page carry DIFFERENT text for the same photograph — four
          // distinct strings per photo, not one shown twice (§2.2). Marketing's home card
          // reads title "Brochure Corporativo" / label "Material Impreso - Grupo Santa Fe",
          // while its page card reads alt "Brochure Corporativo - Grupo Santa Fe" / label
          // "Material Impreso". Collapsing the duplication means keeping all four.
          // Branding is the exception: its home cards carry neither, so both stay empty.
          name: 'homeTitle',
          type: 'text',
          localized: true,
          label: 'Título en inicio',
          admin: {
            description:
              'Solo si aparece en inicio: el título de la tarjeta allí, que suele ser distinto del texto alternativo.',
            condition: (_, sibling) => Boolean(sibling?.showOnHome),
          },
        },
        {
          name: 'homeCategoryLabel',
          type: 'text',
          localized: true,
          label: 'Etiqueta de categoría en inicio',
          admin: {
            description:
              'Solo si aparece en inicio: la etiqueta pequeña allí, que suele incluir el nombre del cliente.',
            condition: (_, sibling) => Boolean(sibling?.showOnHome),
          },
        },
        {
          // ADDED BY R23b-ii, and it corrects the design (r23-target-model.md §3.2).
          //
          // §3.2 declined a home-side order on the grounds that "home order equals page order
          // in all four categories". MEASURED FALSE in two of them, on the dev database:
          //   branding    home 1,2,3,4,5   page 1,2,3,5,…,21   -- offset 1, every image
          //   fotografía  gift-box-vinte   home 5   page 8     -- no constant offset at all
          // and `content/pages.json` PUBLISHES the home number as the card's `id`
          // (resolveGalleryCards → `id: p.order`, 0-based in every home block today). Without
          // this field the branding home block emits 1,2,3,4,5 where it must emit 0,1,2,3,4,
          // and fotografía's last card emits 8 where it must emit 5. Nineteen values in one
          // file, and the byte-identity proof is the whole safety argument.
          //
          // Deriving it was the alternative and it was rejected: the two published sequences
          // are 0-based-contiguous only by today's data, and an index rule silently invents a
          // number the moment an editor reorders. The old home rows still exist, so the true
          // value is available — store it.
          name: 'homeOrder',
          type: 'number',
          label: 'Orden en inicio',
          admin: {
            description:
              'Solo si aparece en inicio: su posición en la vista previa de inicio, que puede ' +
              'diferir del orden en la página de la categoría.',
            condition: (_, sibling) => Boolean(sibling?.showOnHome),
          },
        },
        {
          // The second, undocumented loss §3.2 did not mention at all. The home CARD's `alt`
          // is not the page card's: the 13 non-branding home cards in pages.json publish
          // `{es:"",en:""}` because their home rows carry no alt, while `alt` above holds the
          // PAGE row's text ("OFF DAY Trainer - Diseño Web de Fitness"). Branding is the
          // mirror case — its home rows do carry an alt, byte-identical to the page one (§2.2).
          //
          // NOTHING MAY FALL BACK TO `alt` HERE. `homeAlt ?? alt` re-publishes the page text on
          // those 13 cards. An empty home alt is a real, published value; `loc(null)` already
          // yields the empty pair, which is exactly right.
          name: 'homeAlt',
          type: 'text',
          localized: true,
          label: 'Texto alternativo en inicio',
          admin: {
            description:
              'Solo si aparece en inicio: el texto alternativo de la tarjeta allí. Suele estar ' +
              'vacío — la mayoría de las vistas previas de inicio muestran título y etiqueta, no alt.',
            condition: (_, sibling) => Boolean(sibling?.showOnHome),
          },
        },
      ],
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
