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
import { meta } from './fieldMeta'

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
    ...meta({ name: 'backgroundImage', type: 'text', label: 'Imagen de fondo (ruta)' }, 'Imagen de fondo'), // agnostic
    ...meta(t('title', 'Título'), 'Título'),
    ...meta(t('subtitle', 'Subtítulo'), 'Subtítulo'),
    ...meta(ta('body', 'Texto'), 'Texto'),
    ...meta(t('cta1', 'Botón principal'), 'Botón principal'),
    ...meta(t('cta2', 'Botón secundario'), 'Botón secundario'),
  ],
})

// ---------------------------------------------------------------------------
// PROJECT-PAGE HEADERS (branding/webApps/fotografia/marketing):
// The header content (título/descripción/número/volver) is NO LONGER edited
// inline on the block — it is RESOLVED FROM THE CATEGORÍA at export time
// (Categorías are the single source of truth). The `*Header` blocks now only mark
// where the header renders; there is no headerContent group. See export-content.ts
// `headerFromCat` and collections/Categories.ts `page` group.
// ---------------------------------------------------------------------------

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
      fields: [
        ...meta(t('careerPath', 'Título "Trayectoria"'), 'Título "Trayectoria"'),
        ...meta(t('professionalExperience', 'Título "Experiencia"'), 'Título "Experiencia"'),
      ],
    },
    // JSON is { es:[rows], en:[rows] } (index-parallel). Modeled as ONE array of
    // rows with localized role/period + nested localized responsibilities.
    // Whole-array visibility toggle (per-row toggles would break index parallelism).
    ...meta(
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
      'Experiencia',
    ),
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
      fields: [
        ...meta(t('education', 'Formación'), 'Formación'),
        ...meta(t('tools', 'Herramientas'), 'Herramientas'),
        ...meta(t('languages', 'Idiomas'), 'Idiomas'),
      ],
    },
    // education: { es:[...], en:[...] } -> array of { item (localized) }. Whole-array toggle.
    ...meta({ name: 'education', type: 'array', label: 'Formación', dbName: 'abt_edu', fields: [t('item', 'Estudio')] }, 'Formación (lista)'),
    // tools / languages: language-agnostic string arrays. Whole-array toggle.
    ...meta({ name: 'tools', type: 'array', label: 'Herramientas', dbName: 'abt_tools', fields: [t('value', 'Herramienta', false)] }, 'Herramientas (lista)'),
    ...meta({ name: 'languages', type: 'array', label: 'Idiomas', dbName: 'abt_langs', fields: [t('value', 'Idioma', false)] }, 'Idiomas (lista)'),
    {
      type: 'group',
      name: 'contact',
      label: 'Contacto',
      fields: [
        ...meta(t('heading', 'Título de contacto'), 'Título de contacto'),
        ...meta(ta('body', 'Texto de contacto'), 'Texto de contacto'),
        ...meta({ name: 'email', type: 'text', label: 'Correo' }, 'Correo'), // agnostic
        ...meta({ name: 'phone', type: 'text', label: 'Teléfono' }, 'Teléfono'), // agnostic
      ],
    },
    // Whole-array toggle for the social links list.
    ...meta(
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
      'Redes sociales',
    ),
    {
      type: 'group',
      name: 'footer',
      label: 'Pie de página',
      fields: [
        ...meta({ name: 'copyrightPrefix', type: 'text', label: 'Copyright' }, 'Copyright'), // agnostic
        ...meta(t('rights', 'Derechos reservados'), 'Derechos reservados'),
        ...meta(t('privacy', 'Privacidad'), 'Privacidad'),
        ...meta(t('terms', 'Términos'), 'Términos'),
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

// Each scalar leaf gets a `<name>Visible` toggle; each array gets a whole-array
// toggle (per-row toggles would break the index-parallel data). Nested slice
// groups (header/hero/…) stay groups; block-level show/hide already exists via
// adding/removing the body sub-block.
const caseStudyFields = (): Field[] => [
  {
    type: 'group',
    name: 'header',
    label: 'Encabezado',
    fields: [...meta(t('title', 'Título'), 'Título'), ...meta(t('tagline', 'Lema'), 'Lema')],
  },
  {
    type: 'group',
    name: 'hero',
    label: 'Imagen principal',
    fields: [
      ...meta({ name: 'image', type: 'text', label: 'Imagen (ruta)' }, 'Imagen'),
      ...meta(t('alt', 'Texto alternativo'), 'Texto alternativo'),
    ],
  },
  {
    type: 'group',
    name: 'project',
    label: 'El proyecto',
    fields: [
      ...meta(t('name', 'Nombre'), 'Nombre'),
      ...meta(t('subtitle', 'Subtítulo'), 'Subtítulo'),
      ...meta(
        { name: 'overview', type: 'array', label: 'Resumen', dbName: 'u_ov', fields: [t('label', 'Etiqueta'), ta('text', 'Texto')] },
        'Resumen',
      ),
    ],
  },
  ...meta(textArray('intro', 'Introducción', 'u_intro'), 'Introducción'),
  {
    type: 'group',
    name: 'problemSolution',
    label: 'Problema y solución',
    fields: [
      { type: 'group', name: 'problem', label: 'Problema', fields: [...meta(t('label', 'Etiqueta'), 'Etiqueta (Problema)'), ...meta(ta('text', 'Texto'), 'Texto (Problema)')] },
      { type: 'group', name: 'solution', label: 'Solución', fields: [...meta(t('label', 'Etiqueta'), 'Etiqueta (Solución)'), ...meta(ta('text', 'Texto'), 'Texto (Solución)')] },
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
        fields: [...meta(t('tools', 'Herramientas'), 'Herramientas'), ...meta(t('team', 'Equipo'), 'Equipo'), ...meta(t('role', 'Rol'), 'Rol')],
      },
      ...meta(
        { name: 'rows', type: 'array', label: 'Filas', dbName: 'u_rows', fields: [t('tools', 'Herramientas'), t('team', 'Equipo'), t('role', 'Rol')] },
        'Filas',
      ),
    ],
  },
  {
    type: 'group',
    name: 'timeline',
    label: 'Cronograma',
    fields: [
      ...meta(t('title', 'Título'), 'Título'),
      ...meta(t('durationLabel', 'Etiqueta de duración'), 'Etiqueta de duración'),
      ...meta(t('durationValue', 'Duración'), 'Duración'),
      ...meta(
        { name: 'phases', type: 'array', label: 'Fases', dbName: 'u_phases', fields: [t('phase', 'Fase'), t('duration', 'Duración')] },
        'Fases',
      ),
    ],
  },
  {
    type: 'group',
    name: 'journey',
    label: 'Recorrido del usuario',
    fields: [
      ...meta(t('title', 'Título'), 'Título'),
      ...meta(textArray('intro', 'Introducción', 'u_jn_intro'), 'Introducción'),
      {
        type: 'group',
        name: 'labels',
        label: 'Etiquetas',
        fields: [...meta(t('action', 'Acción'), 'Acción'), ...meta(t('thought', 'Pensamiento'), 'Pensamiento'), ...meta(t('friction', 'Fricción'), 'Fricción')],
      },
      ...meta(
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
        'Etapas',
      ),
      ...meta(
        { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'u_jn_qa', fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta'), textArray('bullets', 'Puntos', 'u_jn_bul')] },
        'Preguntas y respuestas',
      ),
    ],
  },
  {
    type: 'group',
    name: 'personas',
    label: 'Personas',
    fields: [
      ...meta(t('title', 'Título'), 'Título'),
      ...meta(textArray('intro', 'Introducción', 'u_pr_intro'), 'Introducción'),
      ...meta(
        { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'u_pr_qa', fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'u_pr_ans')] },
        'Preguntas y respuestas',
      ),
      {
        type: 'group',
        name: 'sectionLabels',
        label: 'Etiquetas de fichas',
        fields: [
          ...meta(t('basicInfo', 'Información básica'), 'Información básica'),
          ...meta(t('channels', 'Canales'), 'Canales'),
          ...meta(t('motivations', 'Motivaciones'), 'Motivaciones'),
          ...meta(t('painPoints', 'Frustraciones'), 'Frustraciones'),
        ],
      },
      ...meta(
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
        'Fichas',
      ),
    ],
  },
  {
    type: 'group',
    name: 'sketches',
    label: 'Bocetos',
    fields: [
      ...meta(t('title', 'Título'), 'Título'),
      ...meta(textArray('intro', 'Introducción', 'u_sk_intro'), 'Introducción'),
      ...meta(
        { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'u_sk_qa', fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta')] },
        'Preguntas y respuestas',
      ),
    ],
  },
  {
    type: 'group',
    name: 'learnings',
    label: 'Aprendizajes',
    fields: [
      ...meta(t('title', 'Título'), 'Título'),
      ...meta(
        { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'u_ln_qa', fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'u_ln_ans')] },
        'Preguntas y respuestas',
      ),
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
// PORTFOLIO INTRO (home preview intro):
// The home-preview intro (heading/description/studioName/roleDescription/cta/…)
// is NO LONGER edited inline. It is RESOLVED FROM THE CATEGORÍA the home
// `categoryGallery` references (single source of truth) at export time. See
// export-content.ts `introFromCat` and collections/Categories.ts `home` group.
// ---------------------------------------------------------------------------

/** All inline CONTENT groups to spread into the Pages `blocks` array fields. */
export const inlineContentFields = (): Field[] => [
  heroContent(),
  careerContent(),
  aboutContent(),
  uxuiContent(),
]
