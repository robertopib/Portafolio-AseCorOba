/**
 * BUILD-TIME CONTENT FETCH (REST twin of cms/src/scripts/export-content.ts).
 *
 * Run at the FRONT-END build (Vercel buildCommand: `node scripts/fetch-content.mjs && pnpm build`).
 * Reads the deployed CMS over the Payload REST API and RECONSTRUCTS every
 * content file the front-end imports, in the EXACT shapes the committed
 * content/*.json use, then downloads every referenced image to public/images/.
 *
 * The reconstruction logic is a line-for-line mirror of export-content.ts (which
 * uses the Local API). Both read localized fields with ?locale=all (returning
 * { es, en }) and relationships/uploads at the right depth, so the emitted JSON
 * is byte-identical to what the Local-API export produces.
 *
 * Env:
 *   PAYLOAD_API_URL  base URL of the deployed CMS, e.g. https://cms.example.com
 *                    (defaults to http://localhost:4400 for local runs).
 *   S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
 *                    OPTIONAL. Only used as a fallback if a Media doc's own
 *                    `url` can't be downloaded. Normally images are pulled from
 *                    `PAYLOAD_API_URL + media.url` (the CMS serves them).
 *
 * FIDELITY GATE: every emitted file is deep-compared against its committed
 * version at git HEAD and a report is written to /tmp/fetch-fidelity.json. A
 * divergence is always printed in full (file + JSON path + expected vs actual).
 *
 *   node scripts/fetch-content.mjs           producing run — writes content/ and
 *                                            WARNS on divergence, exit 0. This is
 *                                            the Vercel build path: content newer
 *                                            than git HEAD is the whole point.
 *   node scripts/fetch-content.mjs --gate    gate run — same comparison, but any
 *                                            file not proven identical exits 1.
 *
 * (`FIDELITY_GATE=1` is equivalent to `--gate`.) See the GATE const below for
 * why the default is off here and on in export-content.ts.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
// Deep compare + gate verdict + failure formatting. Order-insensitive for object
// keys, order-SENSITIVE for arrays. Mirrored (not imported) by export-content.ts
// — see the note at the top of that module.
import { deepDiff, summarizeFidelity, formatFidelityFailure } from './lib/fidelity.mjs'

// ----------------------------------------------------------------------------
// Paths (scripts/ -> project root)
// ----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content')
const SECTIONS_DIR = path.join(CONTENT_DIR, 'sections')
const IMAGES_DIR = path.join(ROOT, 'public', 'images')

// ----------------------------------------------------------------------------
// Content-map constants (mirrored from cms/src/scripts/content-map.ts)
// ----------------------------------------------------------------------------
const filenameToPath = (f) => `/images/${f}`
const pathToFilename = (p) => p.replace(/^\/images\//, '')

const SECTION_SPECS = [
  { slug: 'web-apps', file: 'web-apps.json' },
  { slug: 'fotografia-producto', file: 'photography.json' },
  { slug: 'marketing-360', file: 'marketing-360.json' },
  { slug: 'branding', file: 'branding.json' },
  { slug: 'uxui-producto', file: 'uxui.json' },
]

const BRANDING_PAGE_GROUPS = [
  { group: 'sports', jsonKey: 'sportsProjects' },
  { group: 'adrianaMunoz', jsonKey: 'adrianaMunozProjects' },
  { group: 'anaGrace', jsonKey: 'anaGraceProjects' },
  { group: 'logos', jsonKey: 'logoProjects' },
]

const CASE_STUDY_FILE = 'uxui-casestudy.json'
const CASE_STUDIES_FILE = 'case-studies.json'

const CASE_STUDY_BODY_SLICE_KEY = {
  uxuiHeader: 'header',
  uxuiHero: 'hero',
  uxuiOverview: 'project',
  uxuiIntro: 'intro',
  uxuiProblemSolution: 'problemSolution',
  uxuiDetails: 'details',
  uxuiTimeline: 'timeline',
  uxuiJourney: 'journey',
  uxuiPersonas: 'personas',
  uxuiSketches: 'sketches',
  uxuiLearnings: 'learnings',
}

// ----------------------------------------------------------------------------
// REST helpers
// ----------------------------------------------------------------------------
const API = (process.env.PAYLOAD_API_URL || 'http://localhost:4400').replace(/\/$/, '')

const FIDELITY_REPORT = '/tmp/fetch-fidelity.json'

/**
 * `--gate` / `FIDELITY_GATE=1` turns the fidelity comparison into a real gate
 * (non-zero exit on any file that is not proven identical to committed content).
 *
 * It is OPT-IN rather than the default, and that asymmetry with export-content.ts
 * is deliberate. This script is the production content PRODUCER: `vercel.json`
 * runs it as `node scripts/fetch-content.mjs && pnpm build`, and its whole purpose
 * there is to overwrite content/ with newer CMS data. A diff from git HEAD is
 * therefore the normal, correct outcome of every publish — failing on it would red
 * every production deploy the moment an editor changes a word. (`content/pages.json`
 * is also already known-stale w.r.t. both emitters — roadmap R13b — so a default-on
 * gate would fail on day one.)
 *
 * export-content.ts defaults the other way because nothing depends on its exit
 * code: it is a verification tool, not a build step.
 *
 * Without the flag the same divergence is still printed in full — file, path,
 * expected vs actual — just as a warning. The gate's honesty does not depend on
 * the flag; only the exit code does.
 */
const GATE = process.argv.includes('--gate') || process.env.FIDELITY_GATE === '1'

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}\n${body.slice(0, 500)}`)
  }
  return res.json()
}

const getGlobal = (slug, depth = 0) =>
  getJson(`${API}/api/globals/${slug}?locale=all&depth=${depth}`)

const getCollection = async (slug, { depth = 2, limit = 1000, sort } = {}) => {
  const qs = new URLSearchParams({ locale: 'all', depth: String(depth), limit: String(limit) })
  if (sort) qs.set('sort', sort)
  const data = await getJson(`${API}/api/${slug}?${qs.toString()}`)
  return data.docs || []
}

// ----------------------------------------------------------------------------
// Shape helpers (mirrored from export-content.ts)
// ----------------------------------------------------------------------------
const loc = (v) => ({ es: (v?.es ?? ''), en: (v?.en ?? '') })

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  console.log(`[fetch-content] CMS: ${API}`)
  fs.mkdirSync(SECTIONS_DIR, { recursive: true })
  fs.mkdirSync(IMAGES_DIR, { recursive: true })

  const report = {}
  const written = {}
  const imageFilenames = new Set() // filenames referenced by content
  const mediaByFilename = {} // filename -> media doc (for downloading)

  const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'))

  // Emit a file, and (if a committed source exists) fidelity-diff against it.
  const emit = (relPath, recon) => {
    const outPath = path.join(CONTENT_DIR, relPath)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(recon, null, 2) + '\n')
    written[relPath] = recon
    if (fs.existsSync(outPath + '.orig')) {
      // never used; placeholder for clarity
    }
  }

  // ---- media id -> filename ----
  const media = await getCollection('media', { depth: 0, limit: 1000 })
  const idToFile = {}
  for (const m of media) {
    idToFile[m.id] = m.filename
    mediaByFilename[m.filename] = m
  }

  const imgPathFromMedia = (image) => {
    const id = typeof image === 'object' && image ? image.id : image
    const fn = idToFile[id]
    if (!fn) throw new Error(`No filename for media id ${id}`)
    imageFilenames.add(fn)
    return filenameToPath(fn)
  }

  // ---- Categorías + Proyectos (loaded once) ----
  const cats = await getCollection('categories', { depth: 0, limit: 100 })
  const catBySlug = {}
  const catIdToSlug = {}
  for (const c of cats) {
    catBySlug[c.slug] = c
    catIdToSlug[c.id] = c.slug
  }

  const allProjects = await getCollection('projects', { depth: 0, limit: 2000 })
  const slugOf = (p) => catIdToSlug[typeof p.category === 'object' ? p.category.id : p.category]
  const byOrder = (docs) => [...docs].sort((a, b) => a.order - b.order)

  const projByKey = (slug, placement, group) =>
    allProjects.filter(
      (p) =>
        slugOf(p) === slug &&
        p.type === 'image' &&
        p.placement === placement &&
        (group ? p.group === group : !p.group),
    )

  const resolveGalleryCards = (opts) => {
    const { slug, placement, group } = opts
    let docs = allProjects.filter((p) => {
      if (slugOf(p) !== slug) return false
      if (p.type !== 'image') return false
      if (placement && placement !== 'all' && p.placement !== placement) return false
      if (group) return p.group === group
      return true
    })
    docs = byOrder(docs)
    if (opts.maxItems && opts.maxItems > 0) docs = docs.slice(0, opts.maxItems)
    return docs.map((p) => {
      const card = {
        id: p.order,
        src: imgPathFromMedia(p.image),
        alt: loc(p.alt),
        category: loc(p.categoryLabel),
      }
      if (p.title && (p.title.es || p.title.en)) card.title = loc(p.title)
      if (p.size) card.size = p.size
      if (p.group) card.group = p.group
      return card
    })
  }

  // ==================== HOME ====================
  {
    const g = await getGlobal('home')
    emit('home.json', {
      hero: {
        backgroundImage: g.hero.backgroundImage,
        title: loc(g.hero.title),
        subtitle: loc(g.hero.subtitle),
        body: loc(g.hero.body),
        cta1: loc(g.hero.cta1),
        cta2: loc(g.hero.cta2),
      },
    })
  }

  // ==================== ABOUT ====================
  {
    const g = await getGlobal('about')
    emit('about.json', {
      headings: {
        education: loc(g.headings.education),
        tools: loc(g.headings.tools),
        languages: loc(g.headings.languages),
      },
      education: {
        es: g.education.map((r) => r.item?.es ?? ''),
        en: g.education.map((r) => r.item?.en ?? ''),
      },
      tools: g.tools.map((r) => r.value),
      languages: g.languages.map((r) => r.value),
      contact: {
        heading: loc(g.contact.heading),
        body: loc(g.contact.body),
        email: g.contact.email,
        phone: g.contact.phone,
      },
      socialLinks: g.socialLinks.map((s) => ({ name: s.name, url: s.url })),
      footer: {
        copyrightPrefix: g.footer.copyrightPrefix,
        rights: loc(g.footer.rights),
        privacy: loc(g.footer.privacy),
        terms: loc(g.footer.terms),
      },
    })
  }

  // ==================== CAREER ====================
  {
    const g = await getGlobal('career')
    const buildExp = (l) =>
      g.experience.map((row) => ({
        role: row.role?.[l] ?? '',
        period: row.period?.[l] ?? '',
        responsibilities: row.responsibilities.map((r) => r.item?.[l] ?? ''),
      }))
    emit('career.json', {
      headings: {
        careerPath: loc(g.headings.careerPath),
        professionalExperience: loc(g.headings.professionalExperience),
      },
      experience: { es: buildExp('es'), en: buildExp('en') },
    })
  }

  // ==================== UI STRINGS ====================
  {
    const g = await getGlobal('ui-strings')
    const es = {}
    const en = {}
    for (const row of g.strings) {
      es[row.key] = row.value?.es ?? ''
      en[row.key] = row.value?.en ?? ''
    }
    emit('ui.json', { es, en })
  }

  // ==================== SITIO Y NAVEGACIÓN ====================
  {
    const g = await getGlobal('site')
    emit('site.json', {
      siteTitle: g.siteTitle,
      brand: g.brand,
      navItems: (g.navItems || []).map((n) => ({ label: n.label, target: n.target })),
    })
  }

  // ==================== PÁGINAS ====================
  {
    const pages = await getCollection('pages', { depth: 2, limit: 1000, sort: 'slug' })

    const GALLERY_BLOCK_TYPES = new Set([
      'gallery:deportes',
      'gallery:belleza',
      'gallery:logos',
      'webAppsGallery',
      'fotografiaGallery',
      'marketingGallery',
    ])
    const HEADER_BLOCK_TYPES = new Set([
      'brandingHeader',
      'webAppsHeader',
      'fotografiaHeader',
      'marketingHeader',
    ])
    const UXUI_BLOCK_TYPES = new Set([
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
    ])

    const rowsText = (arr) => (arr || []).map((r) => loc(r.text))

    const vis = (v) => v !== false
    const heroFrom = (c) => ({
      backgroundImage: c.backgroundImage,
      backgroundImageVisible: vis(c.backgroundImageVisible),
      title: loc(c.title),
      titleVisible: vis(c.titleVisible),
      subtitle: loc(c.subtitle),
      subtitleVisible: vis(c.subtitleVisible),
      body: loc(c.body),
      bodyVisible: vis(c.bodyVisible),
      cta1: loc(c.cta1),
      cta1Visible: vis(c.cta1Visible),
      cta2: loc(c.cta2),
      cta2Visible: vis(c.cta2Visible),
    })
    const careerFrom = (c) => {
      const buildExp = (l) =>
        (c.experience || []).map((row) => ({
          role: row.role?.[l] ?? '',
          period: row.period?.[l] ?? '',
          responsibilities: (row.responsibilities || []).map((r) => r.item?.[l] ?? ''),
        }))
      return {
        headings: {
          careerPath: loc(c.headings.careerPath),
          careerPathVisible: vis(c.headings.careerPathVisible),
          professionalExperience: loc(c.headings.professionalExperience),
          professionalExperienceVisible: vis(c.headings.professionalExperienceVisible),
        },
        experience: { es: buildExp('es'), en: buildExp('en') },
        experienceVisible: vis(c.experienceVisible),
      }
    }
    const aboutFrom = (c) => ({
      headings: {
        education: loc(c.headings.education),
        educationVisible: vis(c.headings.educationVisible),
        tools: loc(c.headings.tools),
        toolsVisible: vis(c.headings.toolsVisible),
        languages: loc(c.headings.languages),
        languagesVisible: vis(c.headings.languagesVisible),
      },
      education: {
        es: (c.education || []).map((r) => r.item?.es ?? ''),
        en: (c.education || []).map((r) => r.item?.en ?? ''),
      },
      educationVisible: vis(c.educationVisible),
      tools: (c.tools || []).map((r) => r.value),
      toolsVisible: vis(c.toolsVisible),
      languages: (c.languages || []).map((r) => r.value),
      languagesVisible: vis(c.languagesVisible),
      contact: {
        heading: loc(c.contact.heading),
        headingVisible: vis(c.contact.headingVisible),
        body: loc(c.contact.body),
        bodyVisible: vis(c.contact.bodyVisible),
        email: c.contact.email,
        emailVisible: vis(c.contact.emailVisible),
        phone: c.contact.phone,
        phoneVisible: vis(c.contact.phoneVisible),
      },
      socialLinks: (c.socialLinks || []).map((s) => ({ name: s.name, url: s.url })),
      socialLinksVisible: vis(c.socialLinksVisible),
      footer: {
        copyrightPrefix: c.footer.copyrightPrefix,
        copyrightPrefixVisible: vis(c.footer.copyrightPrefixVisible),
        rights: loc(c.footer.rights),
        rightsVisible: vis(c.footer.rightsVisible),
        privacy: loc(c.footer.privacy),
        privacyVisible: vis(c.footer.privacyVisible),
        terms: loc(c.footer.terms),
        termsVisible: vis(c.footer.termsVisible),
      },
    })
    const uxuiFrom = (cs) => ({
      header: { title: loc(cs.header.title), titleVisible: vis(cs.header.titleVisible), tagline: loc(cs.header.tagline), taglineVisible: vis(cs.header.taglineVisible) },
      hero: { image: cs.hero.image, imageVisible: vis(cs.hero.imageVisible), alt: loc(cs.hero.alt), altVisible: vis(cs.hero.altVisible) },
      project: {
        name: loc(cs.project.name),
        nameVisible: vis(cs.project.nameVisible),
        subtitle: loc(cs.project.subtitle),
        subtitleVisible: vis(cs.project.subtitleVisible),
        overview: cs.project.overview.map((o) => ({ label: loc(o.label), text: loc(o.text) })),
        overviewVisible: vis(cs.project.overviewVisible),
      },
      intro: rowsText(cs.intro),
      introVisible: vis(cs.introVisible),
      problemSolution: {
        problem: { label: loc(cs.problemSolution.problem.label), labelVisible: vis(cs.problemSolution.problem.labelVisible), text: loc(cs.problemSolution.problem.text), textVisible: vis(cs.problemSolution.problem.textVisible) },
        solution: { label: loc(cs.problemSolution.solution.label), labelVisible: vis(cs.problemSolution.solution.labelVisible), text: loc(cs.problemSolution.solution.text), textVisible: vis(cs.problemSolution.solution.textVisible) },
      },
      details: {
        headers: {
          tools: loc(cs.details.headers.tools),
          toolsVisible: vis(cs.details.headers.toolsVisible),
          team: loc(cs.details.headers.team),
          teamVisible: vis(cs.details.headers.teamVisible),
          role: loc(cs.details.headers.role),
          roleVisible: vis(cs.details.headers.roleVisible),
        },
        rows: cs.details.rows.map((r) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
        rowsVisible: vis(cs.details.rowsVisible),
      },
      timeline: {
        title: loc(cs.timeline.title),
        titleVisible: vis(cs.timeline.titleVisible),
        durationLabel: loc(cs.timeline.durationLabel),
        durationLabelVisible: vis(cs.timeline.durationLabelVisible),
        durationValue: loc(cs.timeline.durationValue),
        durationValueVisible: vis(cs.timeline.durationValueVisible),
        phases: cs.timeline.phases.map((p) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
        phasesVisible: vis(cs.timeline.phasesVisible),
      },
      journey: {
        title: loc(cs.journey.title),
        titleVisible: vis(cs.journey.titleVisible),
        intro: rowsText(cs.journey.intro),
        introVisible: vis(cs.journey.introVisible),
        labels: {
          action: loc(cs.journey.labels.action),
          actionVisible: vis(cs.journey.labels.actionVisible),
          thought: loc(cs.journey.labels.thought),
          thoughtVisible: vis(cs.journey.labels.thoughtVisible),
          friction: loc(cs.journey.labels.friction),
          frictionVisible: vis(cs.journey.labels.frictionVisible),
        },
        stages: cs.journey.stages.map((s) => ({
          number: s.number,
          name: loc(s.name),
          action: loc(s.action),
          thought: loc(s.thought),
          friction: loc(s.friction),
        })),
        stagesVisible: vis(cs.journey.stagesVisible),
        qa: cs.journey.qa.map((q) => {
          const out = { question: loc(q.question) }
          if (q.bullets && q.bullets.length > 0) out.bullets = rowsText(q.bullets)
          else out.answer = loc(q.answer)
          return out
        }),
        qaVisible: vis(cs.journey.qaVisible),
      },
      personas: {
        title: loc(cs.personas.title),
        titleVisible: vis(cs.personas.titleVisible),
        intro: rowsText(cs.personas.intro),
        introVisible: vis(cs.personas.introVisible),
        qa: cs.personas.qa.map((q) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
        qaVisible: vis(cs.personas.qaVisible),
        sectionLabels: {
          basicInfo: loc(cs.personas.sectionLabels.basicInfo),
          basicInfoVisible: vis(cs.personas.sectionLabels.basicInfoVisible),
          channels: loc(cs.personas.sectionLabels.channels),
          channelsVisible: vis(cs.personas.sectionLabels.channelsVisible),
          motivations: loc(cs.personas.sectionLabels.motivations),
          motivationsVisible: vis(cs.personas.sectionLabels.motivationsVisible),
          painPoints: loc(cs.personas.sectionLabels.painPoints),
          painPointsVisible: vis(cs.personas.sectionLabels.painPointsVisible),
        },
        cards: cs.personas.cards.map((c) => ({
          name: loc(c.name),
          descriptor: loc(c.descriptor),
          quote: loc(c.quote),
          basicInfo: rowsText(c.basicInfo),
          channels: rowsText(c.channels),
          motivations: rowsText(c.motivations),
          painPoints: rowsText(c.painPoints),
        })),
        cardsVisible: vis(cs.personas.cardsVisible),
      },
      sketches: {
        title: loc(cs.sketches.title),
        titleVisible: vis(cs.sketches.titleVisible),
        intro: rowsText(cs.sketches.intro),
        introVisible: vis(cs.sketches.introVisible),
        qa: cs.sketches.qa.map((q) => ({ question: loc(q.question), answer: loc(q.answer) })),
        qaVisible: vis(cs.sketches.qaVisible),
      },
      learnings: {
        title: loc(cs.learnings.title),
        titleVisible: vis(cs.learnings.titleVisible),
        qa: cs.learnings.qa.map((q) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
        qaVisible: vis(cs.learnings.qaVisible),
      },
    })

    // Home-preview intro, RESOLVED FROM THE CATEGORÍA (single source of truth),
    // each emitted key carrying its `<key>Visible` flag. Mirrors export-content.ts.
    const introFromCat = (cat) => {
      const h = (cat && cat.home) || {}
      const out = {}
      const putLoc = (k) => {
        const v = h[k]
        if (v && (v.es || v.en)) {
          out[k] = loc(v)
          out[`${k}Visible`] = h[`${k}Visible`] !== false
        }
      }
      const putRaw = (k) => {
        if (h[k]) {
          out[k] = h[k]
          out[`${k}Visible`] = h[`${k}Visible`] !== false
        }
      }
      // Labels with a shared front-end fallback: always emit Visible, text if set.
      const putLabel = (k) => {
        const v = h[k]
        if (v && (v.es || v.en)) out[k] = loc(v)
        out[`${k}Visible`] = h[`${k}Visible`] !== false
      }
      putLoc('sectionHeading')
      putLoc('heading')
      putLoc('tagline')
      putLoc('description')
      putLabel('studioLabel')
      putRaw('studioName')
      putLabel('roleLabel')
      putLoc('roleDescription')
      putLoc('cta')
      putRaw('sketchImage')
      putLoc('sketchAlt')
      return out
    }

    // Project-page header, RESOLVED FROM THE CATEGORÍA. Mirrors export-content.ts.
    const pad2 = (n) => String(n).padStart(2, '0')
    const HEADER_SLUG = {
      brandingHeader: 'branding',
      webAppsHeader: 'web-apps',
      fotografiaHeader: 'fotografia-producto',
      marketingHeader: 'marketing-360',
    }
    const headerFromCat = (cat) => {
      const pg = (cat && cat.page) || {}
      const out = { sectionNumber: pad2((cat?.order ?? 1) + 1) }
      if (pg.title && (pg.title.es || pg.title.en)) {
        out.title = loc(pg.title)
        out.titleVisible = pg.titleVisible !== false
      }
      if (pg.description && (pg.description.es || pg.description.en)) {
        out.description = loc(pg.description)
        out.descriptionVisible = pg.descriptionVisible !== false
      }
      return out
    }

    const catSlugOf = (ref) => catIdToSlug[typeof ref === 'object' && ref ? ref.id : ref]

    const pagesRecon = {
      pages: pages.map((p) => {
        const rawBlocks = p.blocks || []
        return {
          slug: p.slug,
          blocks: rawBlocks.map((b, idx) => {
            const block = { blockType: b.blockType }
            if (b.anchorId) block.anchorId = b.anchorId
            if (GALLERY_BLOCK_TYPES.has(b.blockType)) {
              if (b.subheading && (b.subheading.es || b.subheading.en)) {
                block.subheading = loc(b.subheading)
              }
              const s = b.source
              if (s && (s.category || s.placement || s.group)) {
                const src = {}
                if (s.category) src.category = s.category
                if (s.placement) src.placement = s.placement
                if (s.group) src.group = s.group
                block.source = src
              }
            }
            if (b.blockType === 'categoryGallery') {
              const slug = catSlugOf(b.category)
              const variant = b.layoutVariant
              let cards
              if (variant === 'branding:beauty') {
                cards = [
                  ...resolveGalleryCards({ slug, placement: b.placement, group: 'adrianaMunoz' }),
                  ...resolveGalleryCards({ slug, placement: b.placement, group: 'anaGrace' }),
                ]
              } else {
                cards = resolveGalleryCards({
                  slug,
                  placement: b.placement,
                  group: b.grupo,
                  maxItems: b.maxItems,
                })
              }
              const content = { layoutVariant: variant, projects: cards }
              // Branding page subheadings resolve (+ visibility) from the Categoría;
              // other variants keep the block's own subheading (e.g. "Logos").
              const catForSub = catBySlug[slug]
              if (variant === 'branding:sports' && catForSub?.page?.subtitleSports) {
                content.subheading = loc(catForSub.page.subtitleSports)
                content.subheadingVisible = catForSub.page.subtitleSportsVisible !== false
              } else if (variant === 'branding:beauty' && catForSub?.page?.subtitleBeauty) {
                content.subheading = loc(catForSub.page.subtitleBeauty)
                content.subheadingVisible = catForSub.page.subtitleBeautyVisible !== false
              } else if (b.subheading && (b.subheading.es || b.subheading.en)) {
                content.subheading = loc(b.subheading)
              }
              // Home-preview intro resolved from the referenced Categoría.
              if (variant.endsWith(':home')) {
                content.intro = introFromCat(catBySlug[slug])
              }
              block.content = content
            }
            if (b.blockType === 'hero' && b.heroContent) {
              block.content = heroFrom(b.heroContent)
            } else if (HEADER_BLOCK_TYPES.has(b.blockType)) {
              block.content = headerFromCat(catBySlug[HEADER_SLUG[b.blockType]])
            } else if (b.blockType === 'experiencia' && b.careerContent) {
              block.content = careerFrom(b.careerContent)
            } else if (b.blockType === 'contacto' && b.aboutContent) {
              block.content = aboutFrom(b.aboutContent)
            } else if (UXUI_BLOCK_TYPES.has(b.blockType) && b.uxuiContent) {
              block.content = uxuiFrom(b.uxuiContent)
            }
            return block
          }),
        }
      }),
    }
    emit('pages.json', pagesRecon)

    // ---- content/categories.json ----
    const catsRecon = {
      categories: byOrder(cats).map((c) => {
        const pageDocs = byOrder(
          allProjects.filter(
            (p) => slugOf(p) === c.slug && p.type === 'image' && (p.placement === 'page' || p.placement === 'both'),
          ),
        )
        return {
          slug: c.slug,
          name: loc(c.name),
          anchorId: c.anchorId,
          page: {
            title: loc(c.page?.title),
            description: loc(c.page?.description),
          },
          projects: pageDocs.map((p) => ({
            image: imgPathFromMedia(p.image),
            alt: loc(p.alt),
            category: loc(p.categoryLabel),
            group: p.group ?? null,
          })),
        }
      }),
    }
    emit('categories.json', catsRecon)
  }

  // ==================== CATEGORÍAS + PROYECTOS (sections/*.json) ====================
  for (const spec of SECTION_SPECS) {
    const cat = catBySlug[spec.slug]
    let recon

    if (spec.slug === 'web-apps' || spec.slug === 'fotografia-producto' || spec.slug === 'marketing-360') {
      const homeDocs = byOrder(projByKey(spec.slug, 'home'))
      const pageDocs = byOrder(projByKey(spec.slug, 'page'))
      recon = {
        home: {
          heading: loc(cat.home.heading),
          description: loc(cat.home.description),
          studioName: cat.home.studioName,
          roleDescription: loc(cat.home.roleDescription),
          cta: loc(cat.home.cta),
          projects: homeDocs.map((p) => ({
            image: imgPathFromMedia(p.image),
            title: loc(p.title),
            category: loc(p.categoryLabel),
          })),
        },
        page: {
          title: loc(cat.page.title),
          description: loc(cat.page.description),
          projects: pageDocs.map((p) => ({
            image: imgPathFromMedia(p.image),
            alt: loc(p.alt),
            category: loc(p.categoryLabel),
          })),
        },
      }
    } else if (spec.slug === 'branding') {
      const homeDocs = byOrder(projByKey('branding', 'home'))
      recon = {
        home: {
          heading: loc(cat.home.heading),
          description: loc(cat.home.description),
          studioName: cat.home.studioName,
          roleDescription: loc(cat.home.roleDescription),
          cta: loc(cat.home.cta),
          sectionHeading: loc(cat.home.sectionHeading),
          images: homeDocs.map((p) => ({
            src: imgPathFromMedia(p.image),
            alt: loc(p.alt),
          })),
        },
        page: {
          title: loc(cat.page.title),
          description: loc(cat.page.description),
          subtitleSports: loc(cat.page.subtitleSports),
          subtitleBeauty: loc(cat.page.subtitleBeauty),
        },
      }
      for (const g of BRANDING_PAGE_GROUPS) {
        const docs = byOrder(projByKey('branding', 'page', g.group))
        recon.page[g.jsonKey] = docs.map((p) => ({
          id: p.order,
          src: imgPathFromMedia(p.image),
          alt: loc(p.alt),
          category: loc(p.categoryLabel),
        }))
      }
    } else if (spec.slug === 'uxui-producto') {
      recon = {
        home: {
          heading: loc(cat.home.heading),
          tagline: loc(cat.home.tagline),
          description: loc(cat.home.description),
          studioName: cat.home.studioName,
          roleDescription: loc(cat.home.roleDescription),
          sketchImage: cat.home.sketchImage,
          sketchAlt: loc(cat.home.sketchAlt),
          cta: loc(cat.home.cta),
        },
      }
    }

    emit(`sections/${spec.file}`, recon)
  }

  // ==================== CASE STUDY (a Proyecto) -> sections/uxui-casestudy.json ====================
  {
    const doc = allProjects.find((p) => p.type === 'caseStudy')
    if (!doc) throw new Error('No caseStudy Proyecto found')
    const cs = doc.caseStudy
    const arrText = (arr) => (arr || []).map((r) => loc(r.text))
    emit(`sections/${CASE_STUDY_FILE}`, {
      header: { title: loc(cs.header.title), tagline: loc(cs.header.tagline) },
      hero: { image: cs.hero.image, alt: loc(cs.hero.alt) },
      project: {
        name: loc(cs.project.name),
        subtitle: loc(cs.project.subtitle),
        overview: cs.project.overview.map((o) => ({ label: loc(o.label), text: loc(o.text) })),
      },
      intro: arrText(cs.intro),
      problemSolution: {
        problem: { label: loc(cs.problemSolution.problem.label), text: loc(cs.problemSolution.problem.text) },
        solution: { label: loc(cs.problemSolution.solution.label), text: loc(cs.problemSolution.solution.text) },
      },
      details: {
        headers: {
          tools: loc(cs.details.headers.tools),
          team: loc(cs.details.headers.team),
          role: loc(cs.details.headers.role),
        },
        rows: cs.details.rows.map((r) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
      },
      timeline: {
        title: loc(cs.timeline.title),
        durationLabel: loc(cs.timeline.durationLabel),
        durationValue: loc(cs.timeline.durationValue),
        phases: cs.timeline.phases.map((p) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
      },
      journey: {
        title: loc(cs.journey.title),
        intro: arrText(cs.journey.intro),
        labels: {
          action: loc(cs.journey.labels.action),
          thought: loc(cs.journey.labels.thought),
          friction: loc(cs.journey.labels.friction),
        },
        stages: cs.journey.stages.map((s) => ({
          number: s.number,
          name: loc(s.name),
          action: loc(s.action),
          thought: loc(s.thought),
          friction: loc(s.friction),
        })),
        qa: cs.journey.qa.map((q) => {
          const out = { question: loc(q.question) }
          if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
          else out.answer = loc(q.answer)
          return out
        }),
      },
      personas: {
        title: loc(cs.personas.title),
        intro: arrText(cs.personas.intro),
        qa: cs.personas.qa.map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
        sectionLabels: {
          basicInfo: loc(cs.personas.sectionLabels.basicInfo),
          channels: loc(cs.personas.sectionLabels.channels),
          motivations: loc(cs.personas.sectionLabels.motivations),
          painPoints: loc(cs.personas.sectionLabels.painPoints),
        },
        cards: cs.personas.cards.map((c) => ({
          name: loc(c.name),
          descriptor: loc(c.descriptor),
          quote: loc(c.quote),
          basicInfo: arrText(c.basicInfo),
          channels: arrText(c.channels),
          motivations: arrText(c.motivations),
          painPoints: arrText(c.painPoints),
        })),
      },
      sketches: {
        title: loc(cs.sketches.title),
        intro: arrText(cs.sketches.intro),
        qa: cs.sketches.qa.map((q) => ({ question: loc(q.question), answer: loc(q.answer) })),
      },
      learnings: {
        title: loc(cs.learnings.title),
        qa: cs.learnings.qa.map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
      },
    })
  }

  // ==================== CASE STUDIES (resolved Proyecto bodies) ====================
  {
    const arrText = (arr) => (arr || []).map((r) => loc(r.text))
    const visB = (v) => v !== false
    const sliceFrom = (b) => {
      switch (b.blockType) {
        case 'uxuiHeader':
          return { title: loc(b.title), titleVisible: visB(b.titleVisible), tagline: loc(b.tagline), taglineVisible: visB(b.taglineVisible) }
        case 'uxuiHero':
          return { image: b.image, imageVisible: visB(b.imageVisible), alt: loc(b.alt), altVisible: visB(b.altVisible) }
        case 'uxuiOverview':
          return {
            name: loc(b.name),
            nameVisible: visB(b.nameVisible),
            subtitle: loc(b.subtitle),
            subtitleVisible: visB(b.subtitleVisible),
            overview: (b.overview || []).map((o) => ({ label: loc(o.label), text: loc(o.text) })),
            overviewVisible: visB(b.overviewVisible),
          }
        case 'uxuiIntro':
          return arrText(b.intro)
        case 'uxuiProblemSolution':
          return {
            problem: { label: loc(b.problem.label), labelVisible: visB(b.problem.labelVisible), text: loc(b.problem.text), textVisible: visB(b.problem.textVisible) },
            solution: { label: loc(b.solution.label), labelVisible: visB(b.solution.labelVisible), text: loc(b.solution.text), textVisible: visB(b.solution.textVisible) },
          }
        case 'uxuiDetails':
          return {
            headers: {
              tools: loc(b.headers.tools), toolsVisible: visB(b.headers.toolsVisible),
              team: loc(b.headers.team), teamVisible: visB(b.headers.teamVisible),
              role: loc(b.headers.role), roleVisible: visB(b.headers.roleVisible),
            },
            rows: (b.rows || []).map((r) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
            rowsVisible: visB(b.rowsVisible),
          }
        case 'uxuiTimeline':
          return {
            title: loc(b.title),
            titleVisible: visB(b.titleVisible),
            durationLabel: loc(b.durationLabel),
            durationLabelVisible: visB(b.durationLabelVisible),
            durationValue: loc(b.durationValue),
            durationValueVisible: visB(b.durationValueVisible),
            phases: (b.phases || []).map((p) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
            phasesVisible: visB(b.phasesVisible),
          }
        case 'uxuiJourney':
          return {
            title: loc(b.title),
            titleVisible: visB(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: visB(b.introVisible),
            labels: {
              action: loc(b.labels.action), actionVisible: visB(b.labels.actionVisible),
              thought: loc(b.labels.thought), thoughtVisible: visB(b.labels.thoughtVisible),
              friction: loc(b.labels.friction), frictionVisible: visB(b.labels.frictionVisible),
            },
            stages: (b.stages || []).map((s) => ({
              number: s.number,
              name: loc(s.name),
              action: loc(s.action),
              thought: loc(s.thought),
              friction: loc(s.friction),
            })),
            stagesVisible: visB(b.stagesVisible),
            qa: (b.qa || []).map((q) => {
              const out = { question: loc(q.question) }
              if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
              else out.answer = loc(q.answer)
              return out
            }),
            qaVisible: visB(b.qaVisible),
          }
        case 'uxuiPersonas':
          return {
            title: loc(b.title),
            titleVisible: visB(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: visB(b.introVisible),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            qaVisible: visB(b.qaVisible),
            sectionLabels: {
              basicInfo: loc(b.sectionLabels.basicInfo), basicInfoVisible: visB(b.sectionLabels.basicInfoVisible),
              channels: loc(b.sectionLabels.channels), channelsVisible: visB(b.sectionLabels.channelsVisible),
              motivations: loc(b.sectionLabels.motivations), motivationsVisible: visB(b.sectionLabels.motivationsVisible),
              painPoints: loc(b.sectionLabels.painPoints), painPointsVisible: visB(b.sectionLabels.painPointsVisible),
            },
            cards: (b.cards || []).map((c) => ({
              name: loc(c.name),
              descriptor: loc(c.descriptor),
              quote: loc(c.quote),
              basicInfo: arrText(c.basicInfo),
              channels: arrText(c.channels),
              motivations: arrText(c.motivations),
              painPoints: arrText(c.painPoints),
            })),
            cardsVisible: visB(b.cardsVisible),
          }
        case 'uxuiSketches':
          return {
            title: loc(b.title),
            titleVisible: visB(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: visB(b.introVisible),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: loc(q.answer) })),
            qaVisible: visB(b.qaVisible),
          }
        case 'uxuiLearnings':
          return {
            title: loc(b.title),
            titleVisible: visB(b.titleVisible),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            qaVisible: visB(b.qaVisible),
          }
        default:
          return {}
      }
    }

    const caseStudyDocs = allProjects.filter((p) => p.type === 'caseStudy')
    emit(CASE_STUDIES_FILE, {
      caseStudies: caseStudyDocs.map((doc) => ({
        categorySlug: slugOf(doc),
        slug: doc.slug || null,
        body: (doc.body || []).map((b) => {
          const sliceKey = CASE_STUDY_BODY_SLICE_KEY[b.blockType]
          return {
            blockType: b.blockType,
            content: sliceKey ? { [sliceKey]: sliceFrom(b) } : {},
          }
        }),
      })),
    })
  }

  // ==================== IMAGE DOWNLOAD ====================
  // Every image referenced by content (via imgPathFromMedia) plus any image
  // referenced by a language-agnostic path field (hero backgrounds, uxui
  // hero/sketch images) that maps to a Media filename we know about.
  //
  // Collect path-referenced images from the emitted JSON (they are stored as
  // "/images/<filename>" strings). We scan for those and add their filenames.
  const scanForImagePaths = (obj) => {
    if (obj == null) return
    if (typeof obj === 'string') {
      const m = obj.match(/^\/images\/(.+)$/)
      if (m) imageFilenames.add(m[1])
      return
    }
    if (Array.isArray(obj)) { obj.forEach(scanForImagePaths); return }
    if (typeof obj === 'object') { for (const v of Object.values(obj)) scanForImagePaths(v) }
  }
  for (const recon of Object.values(written)) scanForImagePaths(recon)

  let downloaded = 0
  let skipped = 0
  const missing = []
  for (const fn of imageFilenames) {
    const dest = path.join(IMAGES_DIR, fn)
    const doc = mediaByFilename[fn]
    // Prefer the CMS-served URL (media.url is "/api/media/file/<fn>").
    const candidates = []
    if (doc?.url) candidates.push(doc.url.startsWith('http') ? doc.url : `${API}${doc.url}`)
    candidates.push(`${API}/api/media/file/${encodeURIComponent(fn)}`)
    // S3/R2 direct fallback (if configured).
    if (process.env.S3_ENDPOINT && process.env.S3_BUCKET) {
      candidates.push(`${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${process.env.S3_BUCKET}/${fn}`)
    }
    let ok = false
    for (const url of candidates) {
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const buf = Buffer.from(await res.arrayBuffer())
        fs.writeFileSync(dest, buf)
        downloaded++
        ok = true
        break
      } catch {
        // try next candidate
      }
    }
    if (!ok) {
      // If a committed copy already exists locally, keep it (local dev / already present).
      if (fs.existsSync(dest)) { skipped++ } else { missing.push(fn) }
    }
  }
  console.log(`[fetch-content] images: ${downloaded} downloaded, ${skipped} already present, ${missing.length} missing`)
  if (missing.length) {
    console.warn('[fetch-content] MISSING images:', missing.join(', '))
  }

  // ==================== FIDELITY GATE ====================
  // Compare each emitted file to a pristine committed copy if git is available.
  // We read the committed version from git HEAD so a re-run doesn't compare a
  // file against itself after we've overwritten it.
  //
  // EVERY file in `written` is compared — including pages.json, categories.json,
  // case-studies.json and site.json. The verdict is decided by summarizeFidelity,
  // for which `match: true` is the only passing value: a `null` (nothing committed
  // to compare against) or a file missing from the report fails the gate just like
  // a real diff. See scripts/lib/fidelity.mjs.
  const fidelity = { gate: GATE, allMatch: true, cms: API, files: {} }
  const { execSync } = await import('child_process')
  const gitShow = (rel) => {
    try {
      return execSync(`git show HEAD:content/${rel}`, { cwd: ROOT, encoding: 'utf-8' })
    } catch {
      return null
    }
  }
  for (const [rel, recon] of Object.entries(written)) {
    const committedRaw = gitShow(rel)
    if (committedRaw == null) {
      fidelity.files[rel] = { match: null, note: 'no committed HEAD version to compare' }
      continue
    }
    const diffs = deepDiff(recon, JSON.parse(committedRaw))
    fidelity.files[rel] = { match: diffs.length === 0, diffs }
  }
  fidelity.images = { downloaded, skipped, missing }

  // Suppress unused warning for pathToFilename (kept for symmetry with content-map).
  void pathToFilename

  const summary = summarizeFidelity(fidelity.files, Object.keys(written))
  fidelity.allMatch = summary.allMatch
  fidelity.mismatched = summary.mismatched
  fidelity.unverified = summary.unverified
  fs.writeFileSync(FIDELITY_REPORT, JSON.stringify(fidelity, null, 2))

  if (summary.allMatch) {
    console.log(
      `[fetch-content] fidelity: all ${Object.keys(fidelity.files).length} files match the committed content ✓ (report: ${FIDELITY_REPORT})`,
    )
    return
  }

  // A divergence here means the live CMS no longer agrees with committed content.
  // That is EXPECTED on the producing run (an editor published; overwriting
  // content/ from the CMS is this script's job — DEPLOY.md "Content is
  // source-controlled AND regenerated"), and a DEFECT on a gate run. Same
  // detection, different consequence — so the message is identical and only the
  // exit code differs.
  const detail = formatFidelityFailure(fidelity.files, {
    label: '[fetch-content]',
    reportPath: FIDELITY_REPORT,
    expected: Object.keys(written),
  })
  if (GATE) {
    console.error(detail)
    process.exit(1)
  }
  console.warn(detail.replace(/^❌ /, '⚠️  '))
  console.warn(
    `\n[fetch-content] exit 0: this is the PRODUCING run, where a diff from git HEAD is the normal` +
      ` result of a CMS publish. Re-run with --gate to make the above fail the process.`,
  )
}

main().catch((err) => {
  console.error('[fetch-content] FAILED:', err.stack || err.message)
  process.exit(1)
})
