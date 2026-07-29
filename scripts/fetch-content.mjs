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
 * FIDELITY GATE (local only): if run against a local CMS AND the committed
 * content/*.json exist, every emitted file is deep-compared to the committed
 * one and a report is written to /tmp/fetch-fidelity.json.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

// ---- deep compare (order-insensitive keys, order-SENSITIVE arrays) ----
function deepDiff(a, b, pathStr = '') {
  const diffs = []
  const ta = typeof a
  const tb = typeof b
  const isArrA = Array.isArray(a)
  const isArrB = Array.isArray(b)

  if (isArrA || isArrB) {
    if (!isArrA || !isArrB) {
      diffs.push(`${pathStr}: array vs non-array`)
      return diffs
    }
    if (a.length !== b.length) diffs.push(`${pathStr}: array length ${a.length} vs ${b.length}`)
    const n = Math.min(a.length, b.length)
    for (let i = 0; i < n; i++) diffs.push(...deepDiff(a[i], b[i], `${pathStr}[${i}]`))
    return diffs
  }
  if (a !== null && b !== null && ta === 'object' && tb === 'object') {
    const all = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of all) {
      if (!(k in a)) { diffs.push(`${pathStr}.${k}: missing in reconstructed (orig=${JSON.stringify(b[k])})`); continue }
      if (!(k in b)) { diffs.push(`${pathStr}.${k}: extra in reconstructed (recon=${JSON.stringify(a[k])})`); continue }
      diffs.push(...deepDiff(a[k], b[k], `${pathStr}.${k}`))
    }
    return diffs
  }
  if (a !== b) diffs.push(`${pathStr}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`)
  return diffs
}

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

    const heroFrom = (c) => ({
      backgroundImage: c.backgroundImage,
      title: loc(c.title),
      subtitle: loc(c.subtitle),
      body: loc(c.body),
      cta1: loc(c.cta1),
      cta2: loc(c.cta2),
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
          professionalExperience: loc(c.headings.professionalExperience),
        },
        experience: { es: buildExp('es'), en: buildExp('en') },
      }
    }
    const aboutFrom = (c) => ({
      headings: {
        education: loc(c.headings.education),
        tools: loc(c.headings.tools),
        languages: loc(c.headings.languages),
      },
      education: {
        es: (c.education || []).map((r) => r.item?.es ?? ''),
        en: (c.education || []).map((r) => r.item?.en ?? ''),
      },
      tools: (c.tools || []).map((r) => r.value),
      languages: (c.languages || []).map((r) => r.value),
      contact: {
        heading: loc(c.contact.heading),
        body: loc(c.contact.body),
        email: c.contact.email,
        phone: c.contact.phone,
      },
      socialLinks: (c.socialLinks || []).map((s) => ({ name: s.name, url: s.url })),
      footer: {
        copyrightPrefix: c.footer.copyrightPrefix,
        rights: loc(c.footer.rights),
        privacy: loc(c.footer.privacy),
        terms: loc(c.footer.terms),
      },
    })
    const uxuiFrom = (cs) => ({
      header: { title: loc(cs.header.title), tagline: loc(cs.header.tagline) },
      hero: { image: cs.hero.image, alt: loc(cs.hero.alt) },
      project: {
        name: loc(cs.project.name),
        subtitle: loc(cs.project.subtitle),
        overview: cs.project.overview.map((o) => ({ label: loc(o.label), text: loc(o.text) })),
      },
      intro: rowsText(cs.intro),
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
        intro: rowsText(cs.journey.intro),
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
          if (q.bullets && q.bullets.length > 0) out.bullets = rowsText(q.bullets)
          else out.answer = loc(q.answer)
          return out
        }),
      },
      personas: {
        title: loc(cs.personas.title),
        intro: rowsText(cs.personas.intro),
        qa: cs.personas.qa.map((q) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
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
          basicInfo: rowsText(c.basicInfo),
          channels: rowsText(c.channels),
          motivations: rowsText(c.motivations),
          painPoints: rowsText(c.painPoints),
        })),
      },
      sketches: {
        title: loc(cs.sketches.title),
        intro: rowsText(cs.sketches.intro),
        qa: cs.sketches.qa.map((q) => ({ question: loc(q.question), answer: loc(q.answer) })),
      },
      learnings: {
        title: loc(cs.learnings.title),
        qa: cs.learnings.qa.map((q) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
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
      putLoc('sectionHeading')
      putLoc('heading')
      putLoc('tagline')
      putLoc('description')
      putRaw('studioName')
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
    const sliceFrom = (b) => {
      switch (b.blockType) {
        case 'uxuiHeader':
          return { title: loc(b.title), tagline: loc(b.tagline) }
        case 'uxuiHero':
          return { image: b.image, alt: loc(b.alt) }
        case 'uxuiOverview':
          return {
            name: loc(b.name),
            subtitle: loc(b.subtitle),
            overview: (b.overview || []).map((o) => ({ label: loc(o.label), text: loc(o.text) })),
          }
        case 'uxuiIntro':
          return arrText(b.intro)
        case 'uxuiProblemSolution':
          return {
            problem: { label: loc(b.problem.label), text: loc(b.problem.text) },
            solution: { label: loc(b.solution.label), text: loc(b.solution.text) },
          }
        case 'uxuiDetails':
          return {
            headers: { tools: loc(b.headers.tools), team: loc(b.headers.team), role: loc(b.headers.role) },
            rows: (b.rows || []).map((r) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
          }
        case 'uxuiTimeline':
          return {
            title: loc(b.title),
            durationLabel: loc(b.durationLabel),
            durationValue: loc(b.durationValue),
            phases: (b.phases || []).map((p) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
          }
        case 'uxuiJourney':
          return {
            title: loc(b.title),
            intro: arrText(b.intro),
            labels: {
              action: loc(b.labels.action),
              thought: loc(b.labels.thought),
              friction: loc(b.labels.friction),
            },
            stages: (b.stages || []).map((s) => ({
              number: s.number,
              name: loc(s.name),
              action: loc(s.action),
              thought: loc(s.thought),
              friction: loc(s.friction),
            })),
            qa: (b.qa || []).map((q) => {
              const out = { question: loc(q.question) }
              if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
              else out.answer = loc(q.answer)
              return out
            }),
          }
        case 'uxuiPersonas':
          return {
            title: loc(b.title),
            intro: arrText(b.intro),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            sectionLabels: {
              basicInfo: loc(b.sectionLabels.basicInfo),
              channels: loc(b.sectionLabels.channels),
              motivations: loc(b.sectionLabels.motivations),
              painPoints: loc(b.sectionLabels.painPoints),
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
          }
        case 'uxuiSketches':
          return {
            title: loc(b.title),
            intro: arrText(b.intro),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: loc(q.answer) })),
          }
        case 'uxuiLearnings':
          return {
            title: loc(b.title),
            qa: (b.qa || []).map((q) => ({ question: loc(q.question), answer: arrText(q.answer) })),
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

  // ==================== FIDELITY GATE (local runs) ====================
  // Compare each emitted file to a pristine committed copy if git is available.
  // We read the committed version from git HEAD so a re-run doesn't compare a
  // file against itself after we've overwritten it.
  const fidelity = { allMatch: true, cms: API, files: {} }
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
    const match = diffs.length === 0
    if (!match) fidelity.allMatch = false
    fidelity.files[rel] = { match, diffs }
  }
  fidelity.images = { downloaded, skipped, missing }
  fs.writeFileSync('/tmp/fetch-fidelity.json', JSON.stringify(fidelity, null, 2))
  console.log(`[fetch-content] fidelity: allMatch=${fidelity.allMatch} (report: /tmp/fetch-fidelity.json)`)

  // Suppress unused warning for pathToFilename (kept for symmetry with content-map).
  void pathToFilename
}

main().catch((err) => {
  console.error('[fetch-content] FAILED:', err.stack || err.message)
  process.exit(1)
})
