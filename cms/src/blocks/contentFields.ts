/**
 * Inline CONTENT field builders for the Pages `blocks` array.
 *
 * WordPress Phase 1: CONTENT blocks (hero, project-page headers, the UX/UI
 * case-study sub-blocks, career, about/contact) carry and edit their content
 * INLINE on the block instead of the front-end self-sourcing content/*.json.
 *
 * Each builder returns a localized group whose shape mirrors exactly the slice
 * of committed JSON that the corresponding front-end renderer reads, so seed.ts
 * can populate it and export-content.ts can emit it into content/pages.json
 * (consumed by the renderer via its `content` prop).
 *
 * WHY DISTINCT GROUP NAMES (not one shared `content`): Payload requires field
 * names to be unique within their parent, and a group's subfield names become
 * columns. Different block types need different (and sometimes same-named, e.g.
 * `title`) fields, so each block-type family gets its OWN top-level group field
 * (`heroContent`, `headerContent`, `careerContent`, `aboutContent`,
 * `uxuiContent`). Only the group matching the selected blockType is shown (via
 * `condition`) and populated. export-content maps each blockType to its group
 * and emits it as the block's flat `content` in JSON.
 *
 * The 11 UX/UI sub-blocks all render slices of the SAME case-study object, so
 * they SHARE one `uxuiContent` group (shown for any UX/UI blockType); each such
 * block instance stores the full case study and its renderer slices what it
 * needs.
 *
 * POSTGRES 63-CHAR IDENTIFIER LIMIT & UNIQUE dbName:
 * Payload builds each nested ARRAY's table name as `<parentTable>_<dbName>` and
 * derives its Drizzle relation KEY from `dbName`. Two arrays sharing a dbName
 * therefore (a) can collide on table name and (b) make Drizzle unable to infer
 * the relation ("not enough information to infer relation"). So EVERY array
 * here is given a GLOBALLY-UNIQUE, short `dbName`. `group` fields do NOT create
 * their own table (they flatten into the parent), and Payload ignores `dbName`
 * on groups for column prefixes, so groups carry no dbName. With the base
 * `pages_blocks` (13 chars) the longest resulting table
 * (`pages_blocks_u_cards_upp_locales`) stays well under 63.
 */
import type { Field } from 'payload'

const t = (name: string, label: string, localized = true): Field => ({
  name,
  type: 'text',
  localized,
  label,
})
const ta = (name: string, label: string, localized = true): Field => ({
  name,
  type: 'textarea',
  localized,
  label,
})

/** A localized `{es,en}` array-of-strings modeled as rows of { text }. */
const textArray = (name: string, label: string, dbName: string, useTextarea = true): Field => ({
  name,
  type: 'array',
  label,
  dbName,
  fields: [useTextarea ? ta('text', label) : t('text', label)],
})

const gate = (blockTypes: string | string[]) => {
  const set = new Set(Array.isArray(blockTypes) ? blockTypes : [blockTypes])
  return (_data: unknown, sibling: any) => set.has(sibling?.blockType)
}

// ---------------------------------------------------------------------------
// HERO (home 'hero')  -> field name: heroContent
// ---------------------------------------------------------------------------
export const heroContent = (): Field => ({
  type: 'group',
  name: 'heroContent',
  label: 'Contenido — Portada',
  admin: { condition: gate('hero'), description: 'Contenido de la portada (se edita aquí).' },
  fields: [
    { name: 'backgroundImage', type: 'text', label: 'Imagen de fondo (ruta)' }, // agnostic
    t('title', 'Título'),
    t('subtitle', 'Subtítulo'),
    ta('body', 'Texto'),
    t('cta1', 'Botón principal'),
    t('cta2', 'Botón secundario'),
  ],
})

// ---------------------------------------------------------------------------
// PROJECT-PAGE HEADERS (branding/webApps/fotografia/marketing) -> headerContent
// ---------------------------------------------------------------------------
const HEADER_BLOCK_TYPES = ['brandingHeader', 'webAppsHeader', 'fotografiaHeader', 'marketingHeader']
export const headerContent = (): Field => ({
  type: 'group',
  name: 'headerContent',
  label: 'Contenido — Encabezado',
  admin: { condition: gate(HEADER_BLOCK_TYPES), description: 'Contenido del encabezado (se edita aquí).' },
  fields: [
    t('backLabel', 'Texto del enlace "volver"'),
    { name: 'sectionNumber', type: 'text', label: 'Número de sección' }, // agnostic
    t('title', 'Título'),
    ta('description', 'Descripción'),
  ],
})

// ---------------------------------------------------------------------------
// CAREER (home 'experiencia') -> careerContent
// ---------------------------------------------------------------------------
export const careerContent = (): Field => ({
  type: 'group',
  name: 'careerContent',
  label: 'Contenido — Experiencia',
  admin: { condition: gate('experiencia'), description: 'Contenido de la experiencia (se edita aquí).' },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos',
      fields: [t('careerPath', 'Título "Trayectoria"'), t('professionalExperience', 'Título "Experiencia"')],
    },
    // JSON is { es:[rows], en:[rows] } (index-parallel). Modeled as ONE array of
    // rows with localized role/period + nested localized responsibilities.
    {
      name: 'experience',
      type: 'array',
      label: 'Experiencia',
      labels: { singular: 'Puesto', plural: 'Puestos' },
      dbName: 'car_exp',
      fields: [
        t('role', 'Puesto / cargo'),
        t('period', 'Periodo'),
        {
          name: 'responsibilities',
          type: 'array',
          label: 'Responsabilidades',
          dbName: 'car_resp',
          fields: [t('item', 'Punto')],
        },
      ],
    },
  ],
})

// ---------------------------------------------------------------------------
// ABOUT / CONTACT (home 'contacto') -> aboutContent
// ---------------------------------------------------------------------------
export const aboutContent = (): Field => ({
  type: 'group',
  name: 'aboutContent',
  label: 'Contenido — Sobre mí y contacto',
  admin: { condition: gate('contacto'), description: 'Contenido de "sobre mí y contacto" (se edita aquí).' },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos de sección',
      fields: [t('education', 'Formación'), t('tools', 'Herramientas'), t('languages', 'Idiomas')],
    },
    // education: { es:[...], en:[...] } -> array of { item (localized) }
    { name: 'education', type: 'array', label: 'Formación', dbName: 'abt_edu', fields: [t('item', 'Estudio')] },
    // tools / languages: language-agnostic string arrays
    { name: 'tools', type: 'array', label: 'Herramientas', dbName: 'abt_tools', fields: [t('value', 'Herramienta', false)] },
    { name: 'languages', type: 'array', label: 'Idiomas', dbName: 'abt_langs', fields: [t('value', 'Idioma', false)] },
    {
      type: 'group',
      name: 'contact',
      label: 'Contacto',
      fields: [
        t('heading', 'Título de contacto'),
        ta('body', 'Texto de contacto'),
        { name: 'email', type: 'text', label: 'Correo' }, // agnostic
        { name: 'phone', type: 'text', label: 'Teléfono' }, // agnostic
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Redes sociales',
      dbName: 'abt_social',
      fields: [
        { name: 'name', type: 'text', label: 'Nombre' }, // agnostic
        { name: 'url', type: 'text', label: 'Enlace' }, // agnostic
      ],
    },
    {
      type: 'group',
      name: 'footer',
      label: 'Pie de página',
      fields: [
        { name: 'copyrightPrefix', type: 'text', label: 'Copyright' }, // agnostic
        t('rights', 'Derechos reservados'),
        t('privacy', 'Privacidad'),
        t('terms', 'Términos'),
      ],
    },
  ],
})

// ---------------------------------------------------------------------------
// UX/UI CASE STUDY (all 11 sub-blocks share one uxuiContent group) -> uxuiContent
// Every array below has a globally-unique short dbName prefixed with `u_`.
// ---------------------------------------------------------------------------
export const UXUI_CONTENT_BLOCK_TYPES = [
  'uxuiHeader',
  'uxuiHero',
  'uxuiOverview',
  'uxuiIntro',
  'uxuiProblemSolution',
  'uxuiDetails',
  'uxuiTimeline',
  'uxuiJourney',
  'uxuiPersonas',
  'uxuiSketches',
  'uxuiLearnings',
] as const

const caseStudyFields = (): Field[] => [
  {
    type: 'group',
    name: 'header',
    label: 'Encabezado',
    fields: [t('title', 'Título'), t('tagline', 'Lema')],
  },
  {
    type: 'group',
    name: 'hero',
    label: 'Imagen principal',
    fields: [{ name: 'image', type: 'text', label: 'Imagen (ruta)' }, t('alt', 'Texto alternativo')],
  },
  {
    type: 'group',
    name: 'project',
    label: 'El proyecto',
    fields: [
      t('name', 'Nombre'),
      t('subtitle', 'Subtítulo'),
      {
        name: 'overview',
        type: 'array',
        label: 'Resumen',
        dbName: 'u_ov',
        fields: [t('label', 'Etiqueta'), ta('text', 'Texto')],
      },
    ],
  },
  textArray('intro', 'Introducción', 'u_intro'),
  {
    type: 'group',
    name: 'problemSolution',
    label: 'Problema y solución',
    fields: [
      { type: 'group', name: 'problem', label: 'Problema', fields: [t('label', 'Etiqueta'), ta('text', 'Texto')] },
      { type: 'group', name: 'solution', label: 'Solución', fields: [t('label', 'Etiqueta'), ta('text', 'Texto')] },
    ],
  },
  {
    type: 'group',
    name: 'details',
    label: 'Detalles',
    fields: [
      {
        type: 'group',
        name: 'headers',
        label: 'Encabezados',
        fields: [t('tools', 'Herramientas'), t('team', 'Equipo'), t('role', 'Rol')],
      },
      {
        name: 'rows',
        type: 'array',
        label: 'Filas',
        dbName: 'u_rows',
        fields: [t('tools', 'Herramientas'), t('team', 'Equipo'), t('role', 'Rol')],
      },
    ],
  },
  {
    type: 'group',
    name: 'timeline',
    label: 'Cronograma',
    fields: [
      t('title', 'Título'),
      t('durationLabel', 'Etiqueta de duración'),
      t('durationValue', 'Duración'),
      {
        name: 'phases',
        type: 'array',
        label: 'Fases',
        dbName: 'u_phases',
        fields: [t('phase', 'Fase'), t('duration', 'Duración')],
      },
    ],
  },
  {
    type: 'group',
    name: 'journey',
    label: 'Recorrido del usuario',
    fields: [
      t('title', 'Título'),
      textArray('intro', 'Introducción', 'u_jn_intro'),
      {
        type: 'group',
        name: 'labels',
        label: 'Etiquetas',
        fields: [t('action', 'Acción'), t('thought', 'Pensamiento'), t('friction', 'Fricción')],
      },
      {
        name: 'stages',
        type: 'array',
        label: 'Etapas',
        dbName: 'u_stages',
        fields: [
          { name: 'number', type: 'text', label: 'Número' }, // agnostic
          t('name', 'Nombre'),
          ta('action', 'Acción'),
          t('thought', 'Pensamiento'),
          t('friction', 'Fricción'),
        ],
      },
      {
        name: 'qa',
        type: 'array',
        label: 'Preguntas y respuestas',
        dbName: 'u_jn_qa',
        fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta'), textArray('bullets', 'Puntos', 'u_jn_bul')],
      },
    ],
  },
  {
    type: 'group',
    name: 'personas',
    label: 'Personas',
    fields: [
      t('title', 'Título'),
      textArray('intro', 'Introducción', 'u_pr_intro'),
      {
        name: 'qa',
        type: 'array',
        label: 'Preguntas y respuestas',
        dbName: 'u_pr_qa',
        fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'u_pr_ans')],
      },
      {
        type: 'group',
        name: 'sectionLabels',
        label: 'Etiquetas de fichas',
        fields: [
          t('basicInfo', 'Información básica'),
          t('channels', 'Canales'),
          t('motivations', 'Motivaciones'),
          t('painPoints', 'Frustraciones'),
        ],
      },
      {
        name: 'cards',
        type: 'array',
        label: 'Fichas',
        dbName: 'u_cards',
        fields: [
          t('name', 'Nombre'),
          t('descriptor', 'Descriptor'),
          ta('quote', 'Cita'),
          textArray('basicInfo', 'Información básica', 'u_c_bi', false),
          textArray('channels', 'Canales', 'u_c_ch', false),
          textArray('motivations', 'Motivaciones', 'u_c_mo', false),
          textArray('painPoints', 'Frustraciones', 'u_c_pp', false),
        ],
      },
    ],
  },
  {
    type: 'group',
    name: 'sketches',
    label: 'Bocetos',
    fields: [
      t('title', 'Título'),
      textArray('intro', 'Introducción', 'u_sk_intro'),
      {
        name: 'qa',
        type: 'array',
        label: 'Preguntas y respuestas',
        dbName: 'u_sk_qa',
        fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta')],
      },
    ],
  },
  {
    type: 'group',
    name: 'learnings',
    label: 'Aprendizajes',
    fields: [
      t('title', 'Título'),
      {
        name: 'qa',
        type: 'array',
        label: 'Preguntas y respuestas',
        dbName: 'u_ln_qa',
        fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'u_ln_ans')],
      },
    ],
  },
]

export const uxuiContent = (): Field => ({
  type: 'group',
  name: 'uxuiContent',
  label: 'Contenido — Caso de estudio UX/UI',
  admin: {
    condition: gate(UXUI_CONTENT_BLOCK_TYPES as unknown as string[]),
    description:
      'Todo el contenido del caso de estudio. Cada sub-bloque muestra la parte que le corresponde.',
  },
  fields: caseStudyFields(),
})

// ---------------------------------------------------------------------------
// PORTFOLIO INTRO (home preview intro) -> portfolioIntroContent
// ---------------------------------------------------------------------------
// The inline intro (heading/description/studioName/roleDescription/cta) shown
// above a home preview gallery. Split OUT of the old *Preview section blocks so
// the intro copy is edited in place while the gallery becomes a query block.
export const PORTFOLIO_INTRO_BLOCK_TYPE = 'portfolioIntro'
export const portfolioIntroContent = (): Field => ({
  type: 'group',
  name: 'portfolioIntroContent',
  label: 'Contenido — Introducción (vista previa)',
  admin: {
    condition: gate(PORTFOLIO_INTRO_BLOCK_TYPE),
    description: 'El texto de introducción de la vista previa (se edita aquí).',
  },
  fields: [
    t('sectionHeading', 'Título de la sección (solo Branding)'),
    t('heading', 'Título'),
    t('tagline', 'Lema (solo UX/UI)'),
    ta('description', 'Descripción'),
    { name: 'studioName', type: 'text', label: 'Nombre del estudio' }, // agnostic
    ta('roleDescription', 'Rol / descripción del rol'),
    t('cta', 'Texto del botón'),
    { name: 'sketchImage', type: 'text', label: 'Imagen del boceto (ruta, solo UX/UI)' }, // agnostic
    t('sketchAlt', 'Texto alternativo del boceto (solo UX/UI)'),
  ],
})

/** All inline CONTENT groups to spread into the Pages `blocks` array fields. */
export const inlineContentFields = (): Field[] => [
  heroContent(),
  headerContent(),
  careerContent(),
  aboutContent(),
  uxuiContent(),
  portfolioIntroContent(),
]
