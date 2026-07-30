/**
 * Case-study BODY — an inline block layout (blocks/layout) field for a Proyecto.
 *
 * WordPress Phase 3: a Proyecto of `type: caseStudy` carries its case-study
 * BODY inline, edited on the post like WP content. The body is an ordered list
 * of blocks; the block set is the 11 case-study sub-blocks (header / hero /
 * overview / intro / problemSolution / details / timeline / journey / personas /
 * sketches / learnings). A newly-added caseStudy Proyecto composes its page by
 * adding/reordering these blocks.
 *
 * Each block carries ONLY its own slice of the case study (the WP-post-body
 * model: a block edits its content in place). The front-end sub-block renderers
 * (src/app/blocks/UXUIBlocks.tsx) each read exactly one top-level slice
 * (`caseStudy.personas.*`, `caseStudy.journey.*`, …). So export-content emits
 * each body block's `content` as `{ [sliceKey]: <resolvedSlice> }`, matching the
 * shape the renderer reads. Renderers are UNCHANGED.
 *
 * POSTGRES 63-CHAR IDENTIFIER LIMIT & UNIQUE dbName (same discipline as
 * contentFields.ts): a blocks field builds each block's table as
 * `<collection>_<bodyFieldName>_<blockSlug>` and each nested array's table as
 * `<blockTable>_<arrayDbName>` (chaining ancestor array dbNames). Every nested
 * array here gets a GLOBALLY-UNIQUE short `dbName` prefixed `b_`; groups create
 * no table. Worst-case resulting table (doubly-nested localized array) stays
 * well under 63 chars, e.g. `projects_body_uxuiLearnings_b_ln_qa_b_ln_ans_locales` (52).
 */
import type { Block, Field } from 'payload'
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

// ---- per-slice field sets (mirror Projects.caseStudy / uxuiContent shapes) ----

// Each scalar leaf gets a `<name>Visible` toggle; each array gets a whole-array
// toggle. Mirrors contentFields.uxuiContent (u_ prefix) with the b_ prefix here.
const headerFields = (): Field[] => [...meta(t('title', 'Título'), 'Título'), ...meta(t('tagline', 'Lema'), 'Lema')]

const heroFields = (): Field[] => [
  ...meta({ name: 'image', type: 'text', label: 'Imagen (ruta)' }, 'Imagen'),
  ...meta(t('alt', 'Texto alternativo'), 'Texto alternativo'),
]

const projectFields = (): Field[] => [
  ...meta(t('name', 'Nombre'), 'Nombre'),
  ...meta(t('subtitle', 'Subtítulo'), 'Subtítulo'),
  ...meta(
    { name: 'overview', type: 'array', label: 'Resumen', dbName: 'b_ov', fields: [t('label', 'Etiqueta'), ta('text', 'Texto')] },
    'Resumen',
  ),
]

const problemSolutionFields = (): Field[] => [
  { type: 'group', name: 'problem', label: 'Problema', fields: [...meta(t('label', 'Etiqueta'), 'Etiqueta (Problema)'), ...meta(ta('text', 'Texto'), 'Texto (Problema)')] },
  { type: 'group', name: 'solution', label: 'Solución', fields: [...meta(t('label', 'Etiqueta'), 'Etiqueta (Solución)'), ...meta(ta('text', 'Texto'), 'Texto (Solución)')] },
]

const detailsFields = (): Field[] => [
  {
    type: 'group',
    name: 'headers',
    label: 'Encabezados',
    fields: [...meta(t('tools', 'Herramientas'), 'Herramientas'), ...meta(t('team', 'Equipo'), 'Equipo'), ...meta(t('role', 'Rol'), 'Rol')],
  },
  ...meta(
    { name: 'rows', type: 'array', label: 'Filas', dbName: 'b_rows', fields: [t('tools', 'Herramientas'), t('team', 'Equipo'), t('role', 'Rol')] },
    'Filas',
  ),
]

const timelineFields = (): Field[] => [
  ...meta(t('title', 'Título'), 'Título'),
  ...meta(t('durationLabel', 'Etiqueta de duración'), 'Etiqueta de duración'),
  ...meta(t('durationValue', 'Duración'), 'Duración'),
  ...meta(
    { name: 'phases', type: 'array', label: 'Fases', dbName: 'b_phases', fields: [t('phase', 'Fase'), t('duration', 'Duración')] },
    'Fases',
  ),
]

const journeyFields = (): Field[] => [
  ...meta(t('title', 'Título'), 'Título'),
  ...meta(textArray('intro', 'Introducción', 'b_jn_intro'), 'Introducción'),
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
      dbName: 'b_stages',
      fields: [
        { name: 'number', type: 'text', label: 'Número' },
        t('name', 'Nombre'),
        ta('action', 'Acción'),
        t('thought', 'Pensamiento'),
        t('friction', 'Fricción'),
      ],
    },
    'Etapas',
  ),
  ...meta(
    { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'b_jn_qa', fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta'), textArray('bullets', 'Puntos', 'b_jn_bul')] },
    'Preguntas y respuestas',
  ),
]

const personasFields = (): Field[] => [
  ...meta(t('title', 'Título'), 'Título'),
  ...meta(textArray('intro', 'Introducción', 'b_pr_intro'), 'Introducción'),
  ...meta(
    { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'b_pr_qa', fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'b_pr_ans')] },
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
      dbName: 'b_cards',
      fields: [
        t('name', 'Nombre'),
        t('descriptor', 'Descriptor'),
        ta('quote', 'Cita'),
        textArray('basicInfo', 'Información básica', 'b_c_bi', false),
        textArray('channels', 'Canales', 'b_c_ch', false),
        textArray('motivations', 'Motivaciones', 'b_c_mo', false),
        textArray('painPoints', 'Frustraciones', 'b_c_pp', false),
      ],
    },
    'Fichas',
  ),
]

const sketchesFields = (): Field[] => [
  ...meta(t('title', 'Título'), 'Título'),
  ...meta(textArray('intro', 'Introducción', 'b_sk_intro'), 'Introducción'),
  ...meta(
    { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'b_sk_qa', fields: [ta('question', 'Pregunta'), ta('answer', 'Respuesta')] },
    'Preguntas y respuestas',
  ),
]

const learningsFields = (): Field[] => [
  ...meta(t('title', 'Título'), 'Título'),
  ...meta(
    { name: 'qa', type: 'array', label: 'Preguntas y respuestas', dbName: 'b_ln_qa', fields: [ta('question', 'Pregunta'), textArray('answer', 'Respuesta', 'b_ln_ans')] },
    'Preguntas y respuestas',
  ),
]

/**
 * The 11 case-study body blocks. `slug` = front-end blockType (1:1 with the
 * block registry in src/app/PageRenderer.tsx). `sliceKey` (declared here for the
 * export/seed to consume) is the case-study top-level key the block represents.
 */
export const CASE_STUDY_BODY_BLOCKS: { slug: string; sliceKey: string; label: string; fields: Field[] }[] = [
  { slug: 'uxuiHeader', sliceKey: 'header', label: 'UX/UI · Encabezado', fields: headerFields() },
  { slug: 'uxuiHero', sliceKey: 'hero', label: 'UX/UI · Imagen principal', fields: heroFields() },
  { slug: 'uxuiOverview', sliceKey: 'project', label: 'UX/UI · Resumen', fields: projectFields() },
  { slug: 'uxuiIntro', sliceKey: 'intro', label: 'UX/UI · Introducción', fields: [textArray('intro', 'Introducción', 'b_intro')] },
  { slug: 'uxuiProblemSolution', sliceKey: 'problemSolution', label: 'UX/UI · Problema y Solución', fields: problemSolutionFields() },
  { slug: 'uxuiDetails', sliceKey: 'details', label: 'UX/UI · Detalles', fields: detailsFields() },
  { slug: 'uxuiTimeline', sliceKey: 'timeline', label: 'UX/UI · Cronograma', fields: timelineFields() },
  { slug: 'uxuiJourney', sliceKey: 'journey', label: 'UX/UI · User Journey', fields: journeyFields() },
  { slug: 'uxuiPersonas', sliceKey: 'personas', label: 'UX/UI · User Personas', fields: personasFields() },
  { slug: 'uxuiSketches', sliceKey: 'sketches', label: 'UX/UI · Bocetos', fields: sketchesFields() },
  { slug: 'uxuiLearnings', sliceKey: 'learnings', label: 'UX/UI · Aprendizajes', fields: learningsFields() },
]

const caseStudyBlocks = (): Block[] =>
  CASE_STUDY_BODY_BLOCKS.map((b) => ({
    slug: b.slug,
    labels: { singular: b.label, plural: b.label },
    fields: b.fields,
  }))

/**
 * The `body` field for the Projects collection. Shown only for caseStudy
 * Proyectos. An ordered, drag-reorderable list of case-study sub-blocks, each
 * carrying its own slice — the inline post body of a case study.
 */
export const caseStudyBodyField = (): Field => ({
  name: 'body',
  type: 'blocks',
  label: 'Cuerpo del caso de estudio',
  minRows: 0,
  blocks: caseStudyBlocks(),
  admin: {
    description:
      'El contenido del caso de estudio, en bloques y en orden (como el cuerpo de un post). Arrastra para reordenar; agrega o elimina sub-bloques.',
    condition: (data) => data?.type === 'caseStudy',
  },
})
