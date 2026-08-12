/**
 * One synthetic CMS state, in Payload document shape, for R13b's twin-equivalence
 * check (`tests/fidelity/twin-equivalence.test.ts`).
 *
 * WHY SYNTHETIC. Standard §5: a fidelity fixture must never be live CMS data and
 * never a snapshot of `content/*.json`. Both would churn with editor activity and
 * the test would be disabled the second time it went red for a good reason. This
 * file is frozen, hand-authored, contains no secrets and no real personal data,
 * and changes only when someone deliberately widens branch coverage.
 *
 * WHAT IT HAS TO BE. Not realistic — *legal, and branchy*. The two emitters are
 * hand-mirrored line for line, so they diverge at a conditional, not at a value:
 * a `?? ''` that became `|| ''`, a `!== false` that became `=== true`, a key
 * emitted in one order on one side. So the state below deliberately covers, for
 * every emitted file, both sides of the conditionals the reconstruction contains:
 *
 *   - `*Visible` flags: absent (defaults to true), explicitly `false`, explicitly
 *     `true` — including `studioLabelVisible` / `roleLabelVisible`, the R17
 *     feature that `content/pages.json` predates.
 *   - Localized values present, empty-string, and missing entirely (`loc()`'s
 *     `?? ''` fallback, and the `v.es || v.en` guards that decide whether a key
 *     is emitted at all).
 *   - Photographs in every `images[]` combination — `showOnPage` only,
 *     `showOnHome` only, and both (R46's `placement: 'both'`, translated) — on
 *     grouped and ungrouped parents, with and without `homeTitle` / `size`, and
 *     with `homeOrder` both equal to and different from `order`.
 *   - Parents alongside the LEFTOVER rows R23b-i merged and R23b-iii will
 *     delete, because that is the state production is in when the new emitters
 *     first run against it (R23b-ii).
 *   - A `categoryGallery` per layoutVariant that matters: `branding:sports` and
 *     `branding:beauty` (which concatenates two groups), `branding:logos`, and a
 *     `:home` variant, which is the only path that resolves `intro` from the
 *     Categoría.
 *   - A caseStudy Proyecto whose `body` uses every block type in
 *     CASE_STUDY_BODY_SLICE_KEY, plus one unknown blockType (the `default: {}`
 *     arm), plus a journey Q&A both with `bullets` and with `answer`.
 *   - A block type no renderer knows, to pin the "unknown block" path.
 *
 * SHAPE NOTE. This is shaped to what the two emitters READ, not to what Payload
 * would return in full — no timestamps, no `_status`, no pagination metadata,
 * because neither twin looks at them. Relationships are stored at depth 0 (ids);
 * `tests/fidelity/twin-drivers.ts` populates them when a caller asks for depth,
 * which is how the twins' one genuine asymmetry (REST reads pages at depth 2,
 * the Local API at depth 0) gets exercised rather than papered over.
 */

/** A localized value as Payload returns it under `?locale=all`. */
const L = (es: string, en: string) => ({ es, en })

// ---------------------------------------------------------------------------
// Media — id -> filename, which is all either twin uses them for.
// ---------------------------------------------------------------------------
const media = [
  { id: 1, filename: 'alpha.png', url: '/api/media/file/alpha.png' },
  { id: 2, filename: 'beta.jpg', url: '/api/media/file/beta.jpg' },
  { id: 3, filename: 'gamma.webp', url: '/api/media/file/gamma.webp' },
  { id: 4, filename: 'delta.png', url: '/api/media/file/delta.png' },
  { id: 5, filename: 'epsilon.jpg', url: '/api/media/file/epsilon.jpg' },
  { id: 6, filename: 'zeta.png', url: '/api/media/file/zeta.png' },
  { id: 7, filename: 'eta.png', url: '/api/media/file/eta.png' },
  // R46/R48: 8 onwards are used by EXACTLY ONE image each. Media 1..7 above are
  // shared by several rows, so an assertion naming one cannot tell which row
  // produced it. That is not hypothetical: R46's first draft asserted on
  // `delta.png`, which the branding `sports` row also emits, and the
  // CategoryGallery assertion passed with the bug still in place. A dedicated
  // file makes "this image appeared here" mean "that row reached here".
  { id: 8, filename: 'theta.png', url: '/api/media/file/theta.png' },
  { id: 9, filename: 'iota.png', url: '/api/media/file/iota.png' },
  // R23b-ii's three. Each pins one thing the flattening can get wrong:
  //   kappa   home-only, on an UNGROUPED parent — the `fisio-equina.png` shape
  //   lambda  on home, on a GROUPED parent — the `wodfest-1.png` shape, and the
  //           reason branding's `home.images` needs group mode 'any'
  //   mu      homeOrder ≠ order — the `gift-box-vinte.png` shape (home 5/page 8)
  { id: 10, filename: 'kappa.png', url: '/api/media/file/kappa.png' },
  { id: 11, filename: 'lambda.png', url: '/api/media/file/lambda.png' },
  { id: 12, filename: 'mu.png', url: '/api/media/file/mu.png' },
]

// ---------------------------------------------------------------------------
// Categorías. Ids 10..14, `order` deliberately NOT in id order so that byOrder()
// is actually doing something (headerFromCat also derives sectionNumber from it).
// ---------------------------------------------------------------------------
const categories = [
  {
    id: 10,
    slug: 'branding',
    name: L('Branding Corporativo', 'Corporate Branding'),
    anchorId: 'branding',
    order: 1,
    home: {
      heading: L('Branding', 'Branding'),
      description: L('Identidad de marca.', 'Brand identity.'),
      studioLabel: L('Estudio', 'Studio'),
      studioName: 'Estudio AseCorOba',
      roleLabel: L('Rol', 'Role'),
      roleDescription: L('Dirección de arte', 'Art direction'),
      cta: L('Ver más', 'See more'),
      sectionHeading: L('Marcas', 'Brands'),
    },
    page: {
      title: L('Branding Corporativo', 'Corporate Branding'),
      description: L('Proyectos de marca.', 'Brand projects.'),
      subtitleSports: L('Deportes', 'Sports'),
      subtitleBeauty: L('Belleza', 'Beauty'),
    },
  },
  {
    id: 11,
    slug: 'web-apps',
    name: L('Diseño Web y Apps', 'Web & App Design'),
    anchorId: 'web-apps',
    order: 2,
    home: {
      heading: L('Web y Apps', 'Web & Apps'),
      description: L('Productos digitales.', 'Digital products.'),
      // studioLabel/roleLabel omitted entirely: putLabel() must still emit their
      // Visible flags, and putLoc() must NOT emit the missing text keys.
      studioName: 'Estudio Web',
      roleDescription: L('Diseño de producto', 'Product design'),
      cta: L('Explorar', 'Explore'),
      // Explicitly hidden — the `!== false` default is the bug class §2's worked
      // example names ("changing v !== false to v === true hides everything").
      ctaVisible: false,
    },
    page: {
      title: L('Diseño Web y Apps', 'Web & App Design'),
      description: L('Casos web.', 'Web cases.'),
    },
  },
  {
    id: 12,
    slug: 'uxui-producto',
    name: L('UX/UI Producto', 'UX/UI Product'),
    anchorId: 'uxui',
    order: 3,
    home: {
      heading: L('UX/UI', 'UX/UI'),
      tagline: L('Investigación y producto', 'Research and product'),
      description: L('Procesos de diseño.', 'Design processes.'),
      studioLabel: L('Estudio', 'Studio'),
      // Explicitly visible — the third state, next to absent and false.
      studioLabelVisible: true,
      studioName: 'Estudio UX',
      roleLabel: L('Rol', 'Role'),
      roleLabelVisible: false,
      roleDescription: L('UX researcher', 'UX researcher'),
      sketchImage: '/images/eta.png',
      sketchAlt: L('Bocetos', 'Sketches'),
      cta: L('Ver caso', 'View case'),
    },
    page: {
      title: L('UX/UI Producto', 'UX/UI Product'),
      description: L('Caso de estudio.', 'Case study.'),
    },
  },
  {
    id: 13,
    slug: 'fotografia-producto',
    name: L('Fotografía de Producto y Packaging', 'Product Photography & Packaging'),
    anchorId: 'fotografia',
    order: 4,
    home: {
      heading: L('Fotografía', 'Photography'),
      // Empty on BOTH locales: `v.es || v.en` is false, so the key must not be
      // emitted at all — distinct from "missing" only in the fixture, and the
      // two twins must agree on that.
      description: L('', ''),
      studioName: '',
      roleDescription: L('Fotografía', 'Photography'),
      cta: L('Ver galería', 'View gallery'),
    },
    page: {
      title: L('Fotografía de Producto', 'Product Photography'),
      // description absent: headerFromCat must emit neither description nor
      // descriptionVisible.
    },
  },
  {
    id: 14,
    slug: 'marketing-360',
    name: L('Diseño 360°', '360° Design'),
    anchorId: 'marketing-360',
    order: 5,
    home: {
      heading: L('Marketing 360', 'Marketing 360'),
      description: L('Campañas.', 'Campaigns.'),
      studioName: 'Estudio 360',
      roleDescription: L('Dirección creativa', 'Creative direction'),
      cta: L('Ver campañas', 'View campaigns'),
    },
    page: {
      title: L('Diseño 360°', '360° Design'),
      description: L('Campañas integrales.', 'Integrated campaigns.'),
    },
  },
]

// ---------------------------------------------------------------------------
// The case-study payload. ONE object feeds three different readers, which is
// exactly what makes it worth pinning: the Proyecto's `caseStudy` group
// (sections/uxui-casestudy.json), a page's `uxuiContent` (pages.json, WITH the
// Visible flags) and — flattened one level — the `body` blocks
// (case-studies.json). All three are mirrored in both twins.
// ---------------------------------------------------------------------------
const csHeader = {
  title: L('Rediseño de checkout', 'Checkout redesign'),
  tagline: L('Menos fricción', 'Less friction'),
  taglineVisible: false,
}
const csHero = { image: '/images/zeta.png', alt: L('Pantalla principal', 'Main screen') }
const csProject = {
  name: L('Checkout', 'Checkout'),
  subtitle: L('App de compra', 'Shopping app'),
  overview: [
    { label: L('Cliente', 'Client'), text: L('Retail', 'Retail') },
    { label: L('Año', 'Year'), text: L('2025', '2025') },
  ],
  overviewVisible: false,
}
const csIntro = [{ text: L('Contexto del proyecto.', 'Project context.') }, { text: L('', '') }]
const csProblemSolution = {
  problem: {
    label: L('Problema', 'Problem'),
    text: L('Abandono alto.', 'High abandonment.'),
    textVisible: false,
  },
  solution: { label: L('Solución', 'Solution'), text: L('Flujo en un paso.', 'One-step flow.') },
}
const csDetails = {
  headers: { tools: L('Herramientas', 'Tools'), team: L('Equipo', 'Team'), role: L('Rol', 'Role') },
  rows: [
    { tools: L('Figma', 'Figma'), team: L('3 personas', '3 people'), role: L('Lead', 'Lead') },
    { tools: L('Maze', 'Maze'), team: L('2 personas', '2 people'), role: L('Research', 'Research') },
  ],
}
const csTimeline = {
  title: L('Cronograma', 'Timeline'),
  durationLabel: L('Duración', 'Duration'),
  durationValue: L('8 semanas', '8 weeks'),
  durationValueVisible: false,
  phases: [
    { phase: L('Descubrimiento', 'Discovery'), duration: L('2 semanas', '2 weeks') },
    { phase: L('Diseño', 'Design'), duration: L('4 semanas', '4 weeks') },
  ],
}
const csJourney = {
  title: L('Recorrido', 'Journey'),
  intro: [{ text: L('Cómo compra la gente.', 'How people buy.') }],
  labels: {
    action: L('Acción', 'Action'),
    thought: L('Pensamiento', 'Thought'),
    friction: L('Fricción', 'Friction'),
    frictionVisible: false,
  },
  stages: [
    {
      number: 1,
      name: L('Descubrir', 'Discover'),
      action: L('Busca', 'Searches'),
      thought: L('¿Existe?', 'Does it exist?'),
      friction: L('Ruido', 'Noise'),
    },
    {
      number: 2,
      name: L('Comprar', 'Buy'),
      action: L('Paga', 'Pays'),
      thought: L('¿Es seguro?', 'Is it safe?'),
      friction: L('Formulario largo', 'Long form'),
    },
  ],
  // Both arms of the qa branch: one with bullets, one with a plain answer.
  qa: [
    {
      question: L('¿Qué observamos?', 'What did we observe?'),
      bullets: [{ text: L('Carritos vacíos', 'Empty carts') }, { text: L('Dudas de pago', 'Payment doubts') }],
    },
    { question: L('¿Qué cambiamos?', 'What did we change?'), answer: L('El flujo.', 'The flow.') },
  ],
}
const csPersonas = {
  title: L('Personas', 'Personas'),
  intro: [{ text: L('Dos perfiles.', 'Two profiles.') }],
  qa: [{ question: L('¿A quién servimos?', 'Who do we serve?'), answer: [{ text: L('Compradores.', 'Buyers.') }] }],
  sectionLabels: {
    basicInfo: L('Datos', 'Basics'),
    channels: L('Canales', 'Channels'),
    motivations: L('Motivaciones', 'Motivations'),
    painPoints: L('Frustraciones', 'Pain points'),
    painPointsVisible: false,
  },
  cards: [
    {
      name: L('Ana', 'Ana'),
      descriptor: L('Compradora frecuente', 'Frequent buyer'),
      quote: L('Quiero terminar rápido.', 'I want to finish fast.'),
      basicInfo: [{ text: L('34 años', '34 years old') }],
      channels: [{ text: L('Móvil', 'Mobile') }],
      motivations: [{ text: L('Rapidez', 'Speed') }],
      painPoints: [{ text: L('Formularios', 'Forms') }],
    },
  ],
}
const csSketches = {
  title: L('Bocetos', 'Sketches'),
  intro: [{ text: L('Exploración.', 'Exploration.') }],
  qa: [{ question: L('¿Qué probamos?', 'What did we try?'), answer: L('Tres rutas.', 'Three routes.') }],
}
const csLearnings = {
  title: L('Aprendizajes', 'Learnings'),
  qa: [{ question: L('¿Qué aprendimos?', 'What did we learn?'), answer: [{ text: L('Menos pasos.', 'Fewer steps.') }] }],
}

/** The `caseStudy` group on a Proyecto, and a page block's `uxuiContent`. */
const caseStudyGroup = {
  header: csHeader,
  hero: csHero,
  project: csProject,
  intro: csIntro,
  introVisible: false,
  problemSolution: csProblemSolution,
  details: csDetails,
  timeline: csTimeline,
  journey: csJourney,
  personas: csPersonas,
  sketches: csSketches,
  learnings: csLearnings,
}

/**
 * The caseStudy Proyecto's inline `body`. Every block type in
 * CASE_STUDY_BODY_SLICE_KEY, plus one the map does not know — that last one must
 * emit `content: {}` on BOTH sides, which is the arm most likely to be
 * hand-edited out of one twin.
 */
const caseStudyBody = [
  { blockType: 'uxuiHeader', ...csHeader },
  { blockType: 'uxuiHero', ...csHero },
  { blockType: 'uxuiOverview', ...csProject },
  { blockType: 'uxuiIntro', intro: csIntro },
  { blockType: 'uxuiProblemSolution', ...csProblemSolution },
  { blockType: 'uxuiDetails', ...csDetails },
  { blockType: 'uxuiTimeline', ...csTimeline },
  { blockType: 'uxuiJourney', ...csJourney },
  { blockType: 'uxuiPersonas', ...csPersonas },
  { blockType: 'uxuiSketches', ...csSketches },
  { blockType: 'uxuiLearnings', ...csLearnings },
  { blockType: 'uxuiSomethingNobodyRenders', title: L('Ignorado', 'Ignored') },
]

// ---------------------------------------------------------------------------
// Proyectos — MODELLED ON THE PROMOTION STATE, not on a tidy end state (R23b-ii).
//
// After R23b-i the database holds BOTH: parents carrying `images[]`, and the
// redundant rows the backfill merged, still present and still populated on their
// old top-level columns. R23b-iii deletes those, deliberately after a successful
// promotion — so the shape below is exactly what the new emitters first meet on
// production, and the LEFTOVER rows at the bottom are the point. They carry
// values that would be obvious in any output (`LEFTOVER`), and an emitter that
// still reads a top-level `p.image` publishes them. Both twins would do that
// identically, so the byte comparison cannot see it: the guard is the assertion
// block in twin-equivalence.test.ts that no emitted file contains that string.
//
// `order` is scrambled within each parent and across parents on purpose, so the
// sort has work to do — a twin that dropped it would emit the same cards in a
// different order and the byte comparison would catch that one.
//
// WHICH FIELD FEEDS WHICH OUTPUT, because it is the thing this file exists to
// pin (§2.2 — four distinct strings per photograph, not one shown twice):
//   page card   alt / categoryLabel / order
//   home card   homeAlt / homeCategoryLabel / homeTitle / homeOrder
// ---------------------------------------------------------------------------
const projects = [
  // ================= PARENTS (carry images[]) =================

  // -- branding, grouped 'sports'. `lambda` is on home AND on the page, from a
  //    GROUPED parent: the wodfest-1.png shape. It is why branding's
  //    `home.images` uses group mode 'any' — under "ungrouped only" this array
  //    silently empties. `delta` next to it is page-only, so widening the group
  //    clause into "match everything" would put delta on home and diverge.
  {
    id: 100, category: 10, type: 'image', placement: 'page', group: 'sports', order: 2, image: 3,
    alt: L('Deporte 1', 'Sport 1'), categoryLabel: L('Deportes', 'Sports'),
    images: [
      { id: 'i100a', image: 4, order: 2, showOnPage: true, showOnHome: false, size: 'large', alt: L('Deporte 1', 'Sport 1'), categoryLabel: L('Deportes', 'Sports') },
      { id: 'i100b', image: 11, order: 1, showOnPage: true, showOnHome: true, homeOrder: 0, homeAlt: L('Marca B', 'Brand B'), alt: L('Deporte 2', 'Sport 2'), categoryLabel: L('Deportes', 'Sports') },
    ],
  },
  // -- branding, UNGROUPED, and its one image is on home and in NO page array:
  //    the fisio-equina.png shape. Proves showOnHome and showOnPage are
  //    independent, and that an ungrouped branding parent still reaches home.
  {
    id: 101, category: 10, type: 'image', placement: 'home', order: 1, image: 2,
    alt: L('Marca A', 'Brand A'), categoryLabel: L('Branding', 'Branding'),
    images: [
      { id: 'i101a', image: 10, order: 4, showOnPage: false, showOnHome: true, homeOrder: 3, homeAlt: L('Solo inicio', 'Home only') },
    ],
  },
  {
    id: 104, category: 10, type: 'image', placement: 'page', group: 'adrianaMunoz', order: 1, image: 5,
    alt: L('Adriana 1', 'Adriana 1'), categoryLabel: L('Belleza', 'Beauty'),
    images: [
      { id: 'i104a', image: 5, order: 5, showOnPage: true, showOnHome: false, alt: L('Adriana 1', 'Adriana 1'), categoryLabel: L('Belleza', 'Beauty') },
    ],
  },
  {
    id: 105, category: 10, type: 'image', placement: 'page', group: 'anaGrace', order: 1, image: 6,
    alt: L('Ana Grace 1', 'Ana Grace 1'), categoryLabel: L('Belleza', 'Beauty'),
    images: [
      { id: 'i105a', image: 6, order: 6, showOnPage: true, showOnHome: false, alt: L('Ana Grace 1', 'Ana Grace 1'), categoryLabel: L('Belleza', 'Beauty') },
    ],
  },
  // -- branding 'logos'. `iota` is R46's grouped two-placement photograph,
  //    translated: `placement: 'both'` became showOnPage + showOnHome. Under the
  //    old model it was kept OUT of branding's home array by the group clause;
  //    under R23's model that array is ungrouped-blind on purpose and it belongs
  //    there — see the note on that assertion in twin-equivalence.test.ts.
  {
    id: 106, category: 10, type: 'image', placement: 'page', group: 'logos', order: 1, image: 7,
    alt: L('Logo 1', 'Logo 1'), categoryLabel: L('Logos', 'Logos'), title: L('Logo uno', 'Logo one'),
    images: [
      { id: 'i106a', image: 7, order: 7, showOnPage: true, showOnHome: false, alt: L('Logo 1', 'Logo 1'), categoryLabel: L('Logos', 'Logos') },
      { id: 'i106b', image: 9, order: 8, showOnPage: true, showOnHome: true, homeOrder: 4, homeAlt: L('Logo 2', 'Logo 2'), alt: L('Logo 2', 'Logo 2'), categoryLabel: L('Logos', 'Logos') },
    ],
  },

  // -- web-apps, ungrouped, and the parent that carries most of the traps.
  //
  //    THE ORDERS ARE DELIBERATELY NOT MONOTONIC WITH THE HOME ORDERS. `theta`
  //    is third on the page (order 3) and FIRST on home (homeOrder 0), so the
  //    two sequences disagree on both position and published `id`:
  //         by homeOrder   theta(0) alpha(1) beta(2)
  //         by order       alpha(1) beta(2)  theta(3)
  //    An emitter that sorted the home set by `order`, or published `order` as
  //    the home card's id, gets a different array either way. Without that skew
  //    the assertion is vacuous — which is how the first draft of this fixture
  //    let both regressions through a green suite (R48, again).
  //
  //      alpha   on both, homeAlt ABSENT but `alt` REAL -> the {"es":"","en":""}
  //              arm that a `homeAlt ?? alt` fallback would break. This is the
  //              live shape: all 13 real home cards carry a page alt and no home
  //              alt.
  //      beta    home only, homeTitle empty on both locales -> the
  //              `title.es || title.en` false arm (key omitted)
  //      gamma   page only
  //      theta   on both, and R46's canonical photograph
  {
    id: 110, category: 11, type: 'image', placement: 'home', order: 1, image: 1,
    title: L('App A', 'App A'), alt: L('App A', 'App A'), categoryLabel: L('Web', 'Web'),
    images: [
      { id: 'i110a', image: 1, order: 1, showOnPage: true, showOnHome: true, homeOrder: 1, homeTitle: L('App A', 'App A'), homeCategoryLabel: L('Web inicio', 'Web home'), alt: L('App A - página', 'App A - page'), categoryLabel: L('Web', 'Web') },
      { id: 'i110b', image: 2, order: 2, showOnPage: false, showOnHome: true, homeOrder: 2, homeTitle: L('', ''), homeCategoryLabel: L('Web', 'Web') },
      { id: 'i110c', image: 3, order: 4, showOnPage: true, showOnHome: false, alt: L('Web 1', 'Web 1'), categoryLabel: L('Web', 'Web') },
      { id: 'i110d', image: 8, order: 3, showOnPage: true, showOnHome: true, homeOrder: 0, homeTitle: L('Web 2 inicio', 'Web 2 home'), homeCategoryLabel: L('Web inicio', 'Web home'), alt: L('Web 2', 'Web 2'), categoryLabel: L('Web', 'Web') },
    ],
  },

  // -- fotografía. `mu` is the gift-box-vinte.png shape: LAST in the page array
  //    (order 9) and FIRST in the home preview (homeOrder 2, against epsilon's
  //    3). Sorting the home set by `order` reverses it.
  {
    id: 120, category: 13, type: 'image', placement: 'home', order: 1, image: 5,
    title: L('Foto A', 'Photo A'), alt: L('Foto A', 'Photo A'), categoryLabel: L('Foto', 'Photo'),
    images: [
      { id: 'i120a', image: 12, order: 9, showOnPage: true, showOnHome: true, homeOrder: 2, homeTitle: L('Foto C', 'Photo C'), homeCategoryLabel: L('Foto inicio', 'Photo home'), alt: L('Foto C página', 'Photo C page'), categoryLabel: L('Foto', 'Photo') },
      { id: 'i120b', image: 6, order: 2, showOnPage: true, showOnHome: false, alt: L('Foto B', 'Photo B'), categoryLabel: L('Foto', 'Photo') },
      { id: 'i120c', image: 5, order: 1, showOnPage: false, showOnHome: true, homeOrder: 3, homeTitle: L('Foto A', 'Photo A'), homeCategoryLabel: L('Foto', 'Photo') },
    ],
  },

  // -- marketing --
  {
    id: 130, category: 14, type: 'image', placement: 'home', order: 1, image: 7,
    title: L('Campaña', 'Campaign'), alt: L('Campaña', 'Campaign'), categoryLabel: L('360', '360'),
    images: [
      { id: 'i130a', image: 7, order: 1, showOnPage: false, showOnHome: true, homeOrder: 1, homeTitle: L('Campaña', 'Campaign'), homeCategoryLabel: L('360', '360') },
      { id: 'i130b', image: 1, order: 2, showOnPage: true, showOnHome: false, alt: L('Campaña 2', 'Campaign 2'), categoryLabel: L('360', '360') },
    ],
  },

  // -- the case study. A Proyecto with an EMPTY images[] — which is what it has
  //    always been conceptually, and what every leftover row below looks like.
  {
    id: 140,
    category: 12,
    type: 'caseStudy',
    placement: 'page',
    order: 1,
    slug: 'checkout',
    image: 2,
    alt: L('Caso', 'Case'),
    categoryLabel: L('UX/UI', 'UX/UI'),
    caseStudy: caseStudyGroup,
    body: caseStudyBody,
  },

  // ================= LEFTOVERS (no images[]; must be invisible) =================
  // The 17 rows R23b-i merged and R23b-iii will delete. Every one of them is a
  // real `type: 'image'` row with a real media and a real placement, so nothing
  // but reading `images[]` excludes them. Their text is `LEFTOVER` so that a
  // regression is legible in the diff rather than plausible.
  { id: 150, category: 10, type: 'image', placement: 'home', order: 90, image: 4, alt: L('LEFTOVER branding home', 'LEFTOVER branding home'), categoryLabel: L('LEFTOVER', 'LEFTOVER') },
  { id: 151, category: 10, type: 'image', placement: 'page', group: 'sports', order: 91, image: 11, alt: L('LEFTOVER branding page', 'LEFTOVER branding page'), categoryLabel: L('LEFTOVER', 'LEFTOVER') },
  { id: 152, category: 11, type: 'image', placement: 'both', order: 92, image: 8, alt: L('LEFTOVER web both', 'LEFTOVER web both'), categoryLabel: L('LEFTOVER', 'LEFTOVER'), title: L('LEFTOVER', 'LEFTOVER') },
  { id: 153, category: 13, type: 'image', placement: 'home', order: 93, image: 12, title: L('LEFTOVER foto home', 'LEFTOVER foto home'), categoryLabel: L('LEFTOVER', 'LEFTOVER') },
  { id: 154, category: 14, type: 'image', placement: 'page', order: 94, image: 1, alt: L('LEFTOVER marketing page', 'LEFTOVER marketing page'), categoryLabel: L('LEFTOVER', 'LEFTOVER'), images: [] },
]

// ---------------------------------------------------------------------------
// Páginas. Pre-sorted by slug (both twins request sort:'slug'); the drivers sort
// anyway so a fixture reordering cannot quietly change the expected output.
// ---------------------------------------------------------------------------
const heroContent = {
  backgroundImage: '/images/alpha.png',
  title: L('Hola', 'Hello'),
  subtitle: L('Diseño', 'Design'),
  subtitleVisible: false,
  body: L('Portafolio.', 'Portfolio.'),
  cta1: L('Ver', 'View'),
  cta2: L('', ''),
  cta2Visible: true,
}

const careerContent = {
  headings: {
    careerPath: L('Trayectoria', 'Career path'),
    professionalExperience: L('Experiencia', 'Experience'),
    professionalExperienceVisible: false,
  },
  experience: [
    {
      role: L('Diseñadora', 'Designer'),
      period: L('2020-2023', '2020-2023'),
      responsibilities: [{ item: L('Identidad', 'Identity') }, { item: L('', '') }],
    },
  ],
}

const aboutContent = {
  headings: {
    education: L('Educación', 'Education'),
    tools: L('Herramientas', 'Tools'),
    toolsVisible: false,
    languages: L('Idiomas', 'Languages'),
  },
  education: [{ item: L('Diseño gráfico', 'Graphic design') }],
  tools: [{ value: 'Figma' }, { value: 'Illustrator' }],
  languages: [{ value: 'ES' }, { value: 'EN' }],
  contact: {
    heading: L('Contacto', 'Contact'),
    body: L('Escríbeme.', 'Write to me.'),
    email: 'hola@example.invalid',
    phone: '+00 000 000 000',
    phoneVisible: false,
  },
  socialLinks: [{ name: 'Instagram', url: 'https://example.invalid/ig' }],
  footer: {
    copyrightPrefix: '©',
    rights: L('Derechos reservados', 'All rights reserved'),
    privacy: L('Privacidad', 'Privacy'),
    terms: L('Términos', 'Terms'),
  },
}

const pages = [
  {
    id: 200,
    slug: 'branding',
    blocks: [
      { blockType: 'brandingHeader', anchorId: 'branding-top' },
      // Relationship stored at depth 0. The REST twin reads pages at depth 2 and
      // therefore gets this populated; the Local twin reads at depth 0 and gets
      // the id. Both must resolve to the same slug.
      { blockType: 'categoryGallery', category: 10, layoutVariant: 'branding:sports', placement: 'page' },
      { blockType: 'categoryGallery', category: 10, layoutVariant: 'branding:beauty', placement: 'page' },
      {
        blockType: 'categoryGallery',
        category: 10,
        layoutVariant: 'branding:logos',
        placement: 'page',
        grupo: 'logos',
        maxItems: 1,
        subheading: L('Logotipos', 'Logos'),
      },
    ],
  },
  {
    id: 201,
    slug: 'home',
    blocks: [
      { blockType: 'hero', anchorId: 'inicio', heroContent },
      // `:home` is the only variant that resolves `intro` from the Categoría —
      // the path that emits studioLabelVisible / roleLabelVisible.
      { blockType: 'categoryGallery', category: 11, layoutVariant: 'web-apps:home', placement: 'home' },
      { blockType: 'categoryGallery', category: 12, layoutVariant: 'uxui:home', placement: 'home' },
      { blockType: 'categoryGallery', category: 13, layoutVariant: 'fotografia:home', placement: 'home', maxItems: 1 },
      // `placement: 'all'` ("Todos") is offered by Pages.ts and used by no real
      // Página. Under the old model it emitted a two-placement photograph TWICE,
      // once per row; one photograph is now one row, so it emits one card, with
      // the page text where the image is on the page and the home text where it
      // is not. Unused paths drift silently — this block is what stops the two
      // twins defining 'all' differently.
      { blockType: 'categoryGallery', category: 11, layoutVariant: 'web-apps:page', placement: 'all' },
      {
        blockType: 'webAppsGallery',
        subheading: L('Trabajo reciente', 'Recent work'),
        source: { category: 'web-apps', placement: 'home' },
      },
      // A gallery block whose `source` is entirely empty: `block.source` must be
      // omitted, not emitted as {}.
      { blockType: 'marketingGallery', source: {} },
      { blockType: 'experiencia', careerContent },
      { blockType: 'contacto', aboutContent },
      // Unknown to every dispatcher: must emit just { blockType } on both sides.
      { blockType: 'somethingNobodyRenders' },
    ],
  },
  {
    id: 202,
    slug: 'uxui',
    blocks: [
      { blockType: 'uxuiHeader', uxuiContent: caseStudyGroup },
      { blockType: 'fotografiaHeader' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
const globals = {
  home: {
    hero: {
      backgroundImage: '/images/alpha.png',
      title: L('AseCorOba', 'AseCorOba'),
      subtitle: L('Diseño y marca', 'Design and brand'),
      body: L('Portafolio de diseño.', 'Design portfolio.'),
      cta1: L('Proyectos', 'Projects'),
      cta2: L('Contacto', 'Contact'),
    },
  },
  about: {
    headings: {
      education: L('Educación', 'Education'),
      tools: L('Herramientas', 'Tools'),
      languages: L('Idiomas', 'Languages'),
    },
    education: [{ item: L('Diseño gráfico', 'Graphic design') }, { item: L('Máster', 'Masters') }],
    tools: [{ value: 'Figma' }, { value: 'Photoshop' }],
    languages: [{ value: 'Español' }, { value: 'English' }],
    contact: {
      heading: L('Hablemos', "Let's talk"),
      body: L('Disponible para proyectos.', 'Available for projects.'),
      email: 'hola@example.invalid',
      phone: '+00 000 000 000',
    },
    socialLinks: [
      { name: 'Instagram', url: 'https://example.invalid/ig' },
      { name: 'LinkedIn', url: 'https://example.invalid/li' },
    ],
    footer: {
      copyrightPrefix: '©',
      rights: L('Todos los derechos reservados', 'All rights reserved'),
      privacy: L('Privacidad', 'Privacy'),
      terms: L('Términos', 'Terms'),
    },
  },
  career: {
    headings: {
      careerPath: L('Trayectoria', 'Career path'),
      professionalExperience: L('Experiencia profesional', 'Professional experience'),
    },
    experience: [
      {
        role: L('Directora de arte', 'Art director'),
        period: L('2021 — hoy', '2021 — today'),
        responsibilities: [{ item: L('Identidad de marca', 'Brand identity') }, { item: L('Equipo', 'Team') }],
      },
      {
        role: L('Diseñadora', 'Designer'),
        // period missing entirely: the `?? ''` fallback, per locale.
        responsibilities: [{ item: L('Piezas gráficas', 'Graphic pieces') }],
      },
    ],
  },
  'ui-strings': {
    strings: [
      { key: 'nav.home', value: L('Inicio', 'Home') },
      { key: 'nav.contact', value: L('Contacto', 'Contact') },
      // Missing `en`: ui.json's two maps must still get the same key set, with
      // '' on the missing side. The invariant suite's asymmetry rule is about
      // committed content; here it is a legal input both twins must handle alike.
      { key: 'cta.more', value: { es: 'Más' } },
    ],
  },
  site: {
    siteTitle: 'AseCorOba',
    brand: 'AseCorOba',
    navItems: [
      { label: L('Inicio', 'Home'), target: 'home' },
      { label: L('Branding', 'Branding'), target: 'branding' },
    ],
  },
}

/** One CMS state, as both twins would read it. */
export interface CmsState {
  globals: Record<string, any>
  collections: {
    media: any[]
    categories: any[]
    projects: any[]
    pages: any[]
  }
}

export const cmsState: CmsState = {
  globals,
  collections: { media, categories, projects, pages },
}

/**
 * Which document fields are relationships, for the depth projection in
 * tests/fidelity/twin-drivers.ts. Measured, not guessed: `grep -rn relationTo
 * cms/src` returns exactly three, and only the Páginas one is ever read at a
 * depth above 0 (Pages.ts:206 — a CategoryGallery block's Categoría).
 */
export const RELATIONSHIPS: Record<string, { field: string; collection: keyof CmsState['collections'] }[]> = {
  pages: [{ field: 'category', collection: 'categories' }],
  projects: [
    { field: 'category', collection: 'categories' },
    { field: 'image', collection: 'media' },
  ],
}
