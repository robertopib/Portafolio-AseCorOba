/**
 * Synthetic hostile-but-legal CMS content (roadmap R12, standard §2/§5).
 *
 * "Hostile" here does NOT mean malformed. Every value below is something the
 * Payload admin will happily accept and publish: a very long heading, an English
 * translation the editor never filled in, a portrait upload in a slot the layout
 * assumes is landscape, a field cleared to empty, a block renamed in the CMS.
 * None of it is caught by CI, because CI builds the site against the committed
 * content/*.json fixtures and production rebuilds against the LIVE CMS via the
 * publish hook, which never touches GitHub Actions.
 *
 * SYNTHETIC ON PURPOSE (standard §5): none of this is copied or snapshotted from
 * content/*.json. A fixture derived from live content churns with editor activity
 * and gets disabled — the same reasoning that makes pixel-parity churn-proof.
 * Change these values freely; they are owned by the tests, not by the CMS.
 */

type LocalizedText = { es: string; en: string }

/**
 * The shortest heading these fixtures count as "hostile". The hero's <h1> is
 * drawn for a handful of words; anything past this is unquestionably beyond it.
 * Asserted against in the tests so that shortening a fixture below it fails
 * loudly instead of quietly weakening the case it was written to make.
 */
export const OVER_LONG_MIN_LENGTH = 300

/** A heading far past anything the design was drawn for. */
export const OVER_LONG_ES =
  'Diseño gráfico integral trescientos sesenta grados con identidad visual corporativa ' +
  'estratégica y acompañamiento continuo para marcas que necesitan comunicar valor real ' +
  'a una audiencia exigente en cada punto de contacto, desde el logotipo hasta la última ' +
  'pieza de campaña, sin perder coherencia ni carácter en ningún soporte impreso o digital ' +
  'de la marca por completo'

/** Same, in English, so the over-long case can be checked in both locales. */
export const OVER_LONG_EN =
  'Comprehensive three hundred and sixty degree graphic design with strategic corporate ' +
  'visual identity and continuous support for brands that need to communicate real value ' +
  'to a demanding audience at every single touchpoint, from the logotype through to the ' +
  'very last campaign asset, without losing coherence or character in any printed or ' +
  'digital medium at all'

/**
 * Image sources whose ASPECT RATIOS disagree with what the galleries assume.
 * The URLs are inert data: URIs so nothing in the suite can reach the network.
 */
export const PORTRAIT_IMAGE = 'data:image/gif;base64,portrait-600x2400'
export const PANORAMA_IMAGE = 'data:image/gif;base64,panorama-4000x400'
export const SQUARE_IMAGE = 'data:image/gif;base64,square-800x800'

const loc = (es: string, en: string): LocalizedText => ({ es, en })

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/** A hero exactly as the CMS emits it when every field is filled in. */
export const heroHappy = {
  backgroundImage: SQUARE_IMAGE,
  title: loc('Título', 'Title'),
  subtitle: loc('Subtítulo', 'Subtitle'),
  body: loc('Cuerpo', 'Body'),
  cta1: loc('Ver trabajo', 'View work'),
  cta2: loc('Contactar', 'Contact'),
}

/** An editor pasted an essay into the heading field. Legal; nothing clamps it. */
export const heroOverLongTitle = {
  ...heroHappy,
  title: loc(OVER_LONG_ES, OVER_LONG_EN),
}

/**
 * The Spanish is written, the English never was. `fallback: true` in
 * payload.config.ts means the CMS serves Spanish for a missing `en`, but an
 * editor who CLEARS the field publishes an empty string instead — which falls
 * back to nothing and renders blank to an English visitor.
 */
export const heroMissingEnglish = {
  ...heroHappy,
  title: loc('Soy diseñadora gráfica', ''),
  subtitle: loc('Y este es mi portafolio', ''),
}

/**
 * `title` is GONE — not empty, absent. This is what an editor deleting a field
 * (or a schema rename) actually produces, and HeroSection.tsx:50 indexes
 * `home.hero.title[language]` with no guard.
 */
export const heroMissingTitle: typeof heroHappy = (() => {
  const { title: _title, ...rest } = heroHappy
  return rest as typeof heroHappy
})()

/**
 * Every field explicitly hidden via the CMS's per-field show/hide meta
 * (`<name>Visible: false`, read by src/app/blocks/contentMeta.ts).
 */
export const heroAllHidden = {
  ...heroHappy,
  backgroundImageVisible: false,
  titleVisible: false,
  subtitleVisible: false,
  bodyVisible: false,
  cta1Visible: false,
  cta2Visible: false,
}

// ---------------------------------------------------------------------------
// CategoryGallery — the "query block" that renders a Categoría's Proyectos
// ---------------------------------------------------------------------------

/**
 * Six cards, all identical except for the image each points at.
 *
 * `group` alternates because the branding:beauty variant splits its grid by it
 * (`adrianaMunoz` / `anaGrace`) and indexes past the end of either array if a
 * group comes back with fewer than two cards. Alternating over six gives three
 * apiece, which is what every beauty layout slot needs.
 */
export const galleryCards = (sources: string[]) =>
  sources.map((src, i) => ({
    id: i + 1,
    src,
    alt: loc(`Imagen ${i + 1}`, `Image ${i + 1}`),
    category: loc('Categoría', 'Category'),
    title: loc(`Proyecto ${i + 1}`, `Project ${i + 1}`),
    group: i % 2 === 0 ? 'adrianaMunoz' : 'anaGrace',
  }))

/**
 * Gallery content for any `layoutVariant`, so a test can sweep the whole
 * dispatcher rather than picking one variant and hoping it is representative.
 * `intro` is supplied because the home variants render the paired PortfolioIntro
 * copy inside their own <section>.
 */
export const galleryContent = (layoutVariant: string, sources: string[]) => ({
  layoutVariant,
  projects: galleryCards(sources),
  intro: {
    sectionHeading: loc('Sección', 'Section'),
    heading: loc('Encabezado', 'Heading'),
    tagline: loc('Lema', 'Tagline'),
    description: loc('Descripción', 'Description'),
    studioName: 'Estudio',
    roleDescription: loc('Rol', 'Role'),
    cta: loc('Ver más', 'See more'),
    sketchImage: SQUARE_IMAGE,
    sketchAlt: loc('Boceto', 'Sketch'),
  },
})

/** Six uploads in the aspect ratio the gallery layouts were drawn against. */
export const SQUARE_SOURCES = Array.from({ length: 6 }, () => SQUARE_IMAGE)

/**
 * The same six slots filled with portrait and panorama uploads instead. Same
 * count, same alt text, same everything else — so any difference in the rendered
 * result can only have come from the image dimensions.
 */
export const WRONG_ASPECT_SOURCES = Array.from({ length: 6 }, (_unused, i) =>
  i % 2 === 0 ? PORTRAIT_IMAGE : PANORAMA_IMAGE,
)

/** Six well-behaved cards in the simplest project-page variant. */
export const galleryLandscape = galleryContent('web-apps:page', SQUARE_SOURCES)

/** The same gallery, with the wrong-aspect uploads swapped in. */
export const galleryWrongAspect = galleryContent('web-apps:page', WRONG_ASPECT_SOURCES)

/** A gallery whose `layoutVariant` no longer exists in the dispatcher. */
export const galleryUnknownVariant = galleryContent(
  'branding:carousel-that-was-removed',
  SQUARE_SOURCES,
)

/**
 * A beauty gallery whose Proyectos lost their `group` — the CMS field is free
 * text and optional, so this is one rename away at any time.
 */
export const galleryBeautyUngrouped = {
  ...galleryContent('branding:beauty', SQUARE_SOURCES),
  projects: galleryCards(SQUARE_SOURCES).map((c) => ({ ...c, group: null })),
}

// ---------------------------------------------------------------------------
// ui.json — the CMS-editable UI strings behind LanguageContext's `t(key)`
// ---------------------------------------------------------------------------

/**
 * A stand-in for content/ui.json covering all three states a key can be in.
 * Deliberately tiny: the real file's 73 keys would make the interesting cases
 * hard to see, and its contents are the CMS's to change.
 */
export const hostileUiStrings = {
  es: {
    'nav.back': 'Volver al inicio',
    // Present, but the editor emptied it.
    'nav.cleared': '',
  },
  en: {
    'nav.back': 'Back to home',
    'nav.cleared': '',
  },
}

/** A key no locale in `hostileUiStrings` has. */
export const MISSING_UI_KEY = 'nav.key.the.cms.does.not.have'

// ---------------------------------------------------------------------------
// pages.json — the CMS's page composition, as PageRenderer consumes it
// ---------------------------------------------------------------------------

/**
 * A page list standing in for content/pages.json. `renamedInTheCms` is the whole
 * point: it is a block an editor renamed, so no registry entry matches it and the
 * section disappears from the live page. It sits BETWEEN two good blocks so a
 * test can prove the neighbours survive.
 */
export const hostilePages = {
  pages: [
    {
      slug: 'hostile',
      blocks: [
        { blockType: 'hero', content: heroHappy },
        { blockType: 'renamedInTheCms', anchorId: 'orphan', content: { any: 'thing' } },
        { blockType: 'portfolioIntro', anchorId: 'intro' },
      ],
    },
    {
      slug: 'hostile-hero-missing-title',
      blocks: [{ blockType: 'hero', content: heroMissingTitle }],
    },
    {
      slug: 'hostile-empty',
      blocks: [],
    },
  ],
}
