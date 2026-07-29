/**
 * Export + FIDELITY GATE.
 *
 * Reads the Categorías → Proyectos domain model (+ globals) via the Local API
 * with locale:'all', RECONSTRUCTS the exact original content files, writes them
 * to a TEMP dir (/tmp/export-out/), then deep-diffs each temp file against the
 * committed content/*.json.  Writes /tmp/fidelity-report.json.
 *
 * Run:  pnpm payload run src/scripts/export-content.ts
 * Does NOT modify the committed content/*.json (source of truth).
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  CONTENT_DIR,
  SECTIONS_DIR,
  filenameToPath,
  SECTION_SPECS,
  BRANDING_PAGE_GROUPS,
  CASE_STUDY_FILE,
  CASE_STUDIES_FILE,
  CASE_STUDY_BODY_SLICE_KEY,
} from './content-map'
import { assertPortfolioDb } from './dbGuard'

const OUT_DIR = '/tmp/export-out'
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))

// ---------- deep compare ----------
// order-insensitive for object keys, order-SENSITIVE for arrays.
function deepDiff(a: any, b: any, pathStr = ''): string[] {
  const diffs: string[] = []
  const ta = typeof a
  const tb = typeof b
  const isArrA = Array.isArray(a)
  const isArrB = Array.isArray(b)

  if (isArrA || isArrB) {
    if (!isArrA || !isArrB) {
      diffs.push(`${pathStr}: array vs non-array (${JSON.stringify(a)} vs ${JSON.stringify(b)})`)
      return diffs
    }
    if (a.length !== b.length) {
      diffs.push(`${pathStr}: array length ${a.length} vs ${b.length}`)
    }
    const n = Math.min(a.length, b.length)
    for (let i = 0; i < n; i++) diffs.push(...deepDiff(a[i], b[i], `${pathStr}[${i}]`))
    return diffs
  }

  if (a !== null && b !== null && ta === 'object' && tb === 'object') {
    const all = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of all) {
      const inA = k in a
      const inB = k in b
      if (!inA) {
        diffs.push(`${pathStr}.${k}: missing in reconstructed (orig=${JSON.stringify(b[k])})`)
        continue
      }
      if (!inB) {
        diffs.push(`${pathStr}.${k}: extra in reconstructed (recon=${JSON.stringify(a[k])})`)
        continue
      }
      diffs.push(...deepDiff(a[k], b[k], `${pathStr}.${k}`))
    }
    return diffs
  }

  if (a !== b) diffs.push(`${pathStr}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`)
  return diffs
}

type LV = { es?: string | null; en?: string | null }
const loc = (v: LV | undefined | null): { es: string; en: string } => ({
  es: (v?.es ?? '') as string,
  en: (v?.en ?? '') as string,
})

async function main() {
  // Safety: verify we're pointed at THIS project's database before Payload
  // connects (auto-push would mutate a wrong/foreign DB). See dbGuard.ts.
  await assertPortfolioDb()

  const payload = await getPayload({ config })
  const report: Record<string, { match: boolean; diffs: string[] }> = {}
  const written: Record<string, any> = {}

  fs.mkdirSync(path.join(OUT_DIR, 'sections'), { recursive: true })

  // ---- media id -> filename ----
  const media = await payload.find({ collection: 'media', limit: 1000, depth: 0, locale: 'all' })
  const idToFile: Record<number, string> = {}
  for (const m of media.docs) idToFile[m.id as number] = m.filename as string

  const imgPathFromMedia = (image: any): string => {
    const id = typeof image === 'object' && image ? image.id : image
    const fn = idToFile[id]
    if (!fn) throw new Error(`No filename for media id ${id}`)
    return filenameToPath(fn)
  }

  const emit = (relPath: string, recon: any, origPath: string) => {
    fs.writeFileSync(path.join(OUT_DIR, relPath), JSON.stringify(recon, null, 2) + '\n')
    written[relPath] = recon
    const diffs = deepDiff(recon, readJson(origPath))
    report[relPath] = { match: diffs.length === 0, diffs }
  }

  // ---- Categorías + Proyectos (loaded once; used by BOTH the Páginas block
  //      -- CategoryGallery resolution -- and the sections reconstruction) ----
  const cats = await payload.find({ collection: 'categories', limit: 100, depth: 0, locale: 'all' })
  const catBySlug: Record<string, any> = {}
  const catIdToSlug: Record<number, string> = {}
  for (const c of cats.docs as any[]) {
    catBySlug[c.slug] = c
    catIdToSlug[c.id] = c.slug
  }

  const allProjects = await payload.find({ collection: 'projects', limit: 2000, depth: 0, locale: 'all' })
  const slugOf = (p: any) => catIdToSlug[typeof p.category === 'object' ? p.category.id : p.category]
  const byOrder = (docs: any[]) => [...docs].sort((a, b) => a.order - b.order)

  const projByKey = (slug: string, placement: string, group?: string) =>
    (allProjects.docs as any[]).filter(
      (p) =>
        slugOf(p) === slug &&
        p.type === 'image' &&
        p.placement === placement &&
        (group ? p.group === group : !p.group),
    )

  /**
   * Resolve a CategoryGallery block's Proyectos into the front-end card shape.
   * Filters by category slug + placement ('all' = no placement filter) +
   * optional grupo, orders by `order`, applies maxItems, and returns cards
   * carrying image path, localized alt/categoryLabel/title, size and group.
   */
  const resolveGalleryCards = (opts: {
    slug: string
    placement?: string | null
    group?: string | null
    maxItems?: number | null
  }) => {
    const { slug, placement, group } = opts
    let docs = (allProjects.docs as any[]).filter((p) => {
      if (slugOf(p) !== slug) return false
      if (p.type !== 'image') return false
      if (placement && placement !== 'all' && p.placement !== placement) return false
      if (group) return p.group === group
      return true
    })
    docs = byOrder(docs)
    if (opts.maxItems && opts.maxItems > 0) docs = docs.slice(0, opts.maxItems)
    return docs.map((p: any) => {
      const card: any = {
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
    const g: any = await payload.findGlobal({ slug: 'home', locale: 'all', depth: 0 })
    const recon = {
      hero: {
        backgroundImage: g.hero.backgroundImage,
        title: loc(g.hero.title),
        subtitle: loc(g.hero.subtitle),
        body: loc(g.hero.body),
        cta1: loc(g.hero.cta1),
        cta2: loc(g.hero.cta2),
      },
    }
    emit('home.json', recon, path.join(CONTENT_DIR, 'home.json'))
  }

  // ==================== ABOUT ====================
  {
    const g: any = await payload.findGlobal({ slug: 'about', locale: 'all', depth: 0 })
    const recon = {
      headings: {
        education: loc(g.headings.education),
        tools: loc(g.headings.tools),
        languages: loc(g.headings.languages),
      },
      education: {
        es: g.education.map((r: any) => r.item?.es ?? ''),
        en: g.education.map((r: any) => r.item?.en ?? ''),
      },
      tools: g.tools.map((r: any) => r.value),
      languages: g.languages.map((r: any) => r.value),
      contact: {
        heading: loc(g.contact.heading),
        body: loc(g.contact.body),
        email: g.contact.email,
        phone: g.contact.phone,
      },
      socialLinks: g.socialLinks.map((s: any) => ({ name: s.name, url: s.url })),
      footer: {
        copyrightPrefix: g.footer.copyrightPrefix,
        rights: loc(g.footer.rights),
        privacy: loc(g.footer.privacy),
        terms: loc(g.footer.terms),
      },
    }
    emit('about.json', recon, path.join(CONTENT_DIR, 'about.json'))
  }

  // ==================== CAREER ====================
  {
    const g: any = await payload.findGlobal({ slug: 'career', locale: 'all', depth: 0 })
    const buildExp = (l: 'es' | 'en') =>
      g.experience.map((row: any) => ({
        role: row.role?.[l] ?? '',
        period: row.period?.[l] ?? '',
        responsibilities: row.responsibilities.map((r: any) => r.item?.[l] ?? ''),
      }))
    const recon = {
      headings: {
        careerPath: loc(g.headings.careerPath),
        professionalExperience: loc(g.headings.professionalExperience),
      },
      experience: { es: buildExp('es'), en: buildExp('en') },
    }
    emit('career.json', recon, path.join(CONTENT_DIR, 'career.json'))
  }

  // ==================== UI STRINGS ====================
  {
    const g: any = await payload.findGlobal({ slug: 'ui-strings', locale: 'all', depth: 0 })
    const es: Record<string, string> = {}
    const en: Record<string, string> = {}
    for (const row of g.strings) {
      es[row.key] = row.value?.es ?? ''
      en[row.key] = row.value?.en ?? ''
    }
    emit('ui.json', { es, en }, path.join(CONTENT_DIR, 'ui.json'))
  }

  // ==================== SITIO Y NAVEGACIÓN ====================
  // Written directly to content/site.json (front-end reads it; no fidelity-diff
  // source like pages.json).
  {
    const g: any = await payload.findGlobal({ slug: 'site', locale: 'all', depth: 0 })
    const site = {
      siteTitle: g.siteTitle,
      brand: g.brand,
      navItems: (g.navItems || []).map((n: any) => ({ label: n.label, target: n.target })),
    }
    fs.writeFileSync(path.join(CONTENT_DIR, 'site.json'), JSON.stringify(site, null, 2) + '\n')
  }

  // ==================== PÁGINAS ====================
  // The Pages collection is the source of truth for page composition (block
  // order). Unlike the other exports, content/pages.json has no pre-existing
  // hand-authored source to fidelity-diff against, so we write it directly to
  // the committed content dir. The front end reads it at build time.
  {
    const pagesRes = await payload.find({
      collection: 'pages',
      limit: 1000,
      depth: 0,
      sort: 'slug',
      locale: 'all',
    })
    // Only gallery blocks carry source/subheading metadata (they draw their
    // cards from the Categorías → Proyectos model). Keep this list in sync with
    // GALLERY_BLOCK_TYPES in collections/Pages.ts.
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

    // ---- inline-content reconstructors (block group -> flat JSON shape) ----
    const rowsText = (arr: any[]) => (arr || []).map((r: any) => loc(r.text))

    const vis = (v: any) => v !== false
    const heroFrom = (c: any) => ({
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
    const careerFrom = (c: any) => {
      const buildExp = (l: 'es' | 'en') =>
        (c.experience || []).map((row: any) => ({
          role: row.role?.[l] ?? '',
          period: row.period?.[l] ?? '',
          responsibilities: (row.responsibilities || []).map((r: any) => r.item?.[l] ?? ''),
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
    const aboutFrom = (c: any) => ({
      headings: {
        education: loc(c.headings.education),
        educationVisible: vis(c.headings.educationVisible),
        tools: loc(c.headings.tools),
        toolsVisible: vis(c.headings.toolsVisible),
        languages: loc(c.headings.languages),
        languagesVisible: vis(c.headings.languagesVisible),
      },
      education: {
        es: (c.education || []).map((r: any) => r.item?.es ?? ''),
        en: (c.education || []).map((r: any) => r.item?.en ?? ''),
      },
      educationVisible: vis(c.educationVisible),
      tools: (c.tools || []).map((r: any) => r.value),
      toolsVisible: vis(c.toolsVisible),
      languages: (c.languages || []).map((r: any) => r.value),
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
      socialLinks: (c.socialLinks || []).map((s: any) => ({ name: s.name, url: s.url })),
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
    const uxuiFrom = (cs: any) => ({
      header: { title: loc(cs.header.title), tagline: loc(cs.header.tagline) },
      hero: { image: cs.hero.image, alt: loc(cs.hero.alt) },
      project: {
        name: loc(cs.project.name),
        subtitle: loc(cs.project.subtitle),
        overview: cs.project.overview.map((o: any) => ({ label: loc(o.label), text: loc(o.text) })),
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
        rows: cs.details.rows.map((r: any) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
      },
      timeline: {
        title: loc(cs.timeline.title),
        durationLabel: loc(cs.timeline.durationLabel),
        durationValue: loc(cs.timeline.durationValue),
        phases: cs.timeline.phases.map((p: any) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
      },
      journey: {
        title: loc(cs.journey.title),
        intro: rowsText(cs.journey.intro),
        labels: {
          action: loc(cs.journey.labels.action),
          thought: loc(cs.journey.labels.thought),
          friction: loc(cs.journey.labels.friction),
        },
        stages: cs.journey.stages.map((s: any) => ({
          number: s.number,
          name: loc(s.name),
          action: loc(s.action),
          thought: loc(s.thought),
          friction: loc(s.friction),
        })),
        qa: cs.journey.qa.map((q: any) => {
          const out: any = { question: loc(q.question) }
          if (q.bullets && q.bullets.length > 0) out.bullets = rowsText(q.bullets)
          else out.answer = loc(q.answer)
          return out
        }),
      },
      personas: {
        title: loc(cs.personas.title),
        intro: rowsText(cs.personas.intro),
        qa: cs.personas.qa.map((q: any) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
        sectionLabels: {
          basicInfo: loc(cs.personas.sectionLabels.basicInfo),
          channels: loc(cs.personas.sectionLabels.channels),
          motivations: loc(cs.personas.sectionLabels.motivations),
          painPoints: loc(cs.personas.sectionLabels.painPoints),
        },
        cards: cs.personas.cards.map((c: any) => ({
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
        qa: cs.sketches.qa.map((q: any) => ({ question: loc(q.question), answer: loc(q.answer) })),
      },
      learnings: {
        title: loc(cs.learnings.title),
        qa: cs.learnings.qa.map((q: any) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
      },
    })

    // Home-preview intro, RESOLVED FROM THE CATEGORÍA (single source of truth).
    // Only non-empty keys are emitted (so a non-UX/UI intro omits tagline/sketch*,
    // matching the original markup). Each emitted key carries its `<key>Visible`
    // flag (default true) so the front-end can hide the field. Categorías now
    // DRIVE this text — the old inline portfolioIntro content was removed.
    const introFromCat = (cat: any) => {
      const h = (cat && cat.home) || {}
      const out: any = {}
      const putLoc = (k: string) => {
        const v = h[k]
        if (v && (v.es || v.en)) {
          out[k] = loc(v)
          out[`${k}Visible`] = h[`${k}Visible`] !== false
        }
      }
      const putRaw = (k: string) => {
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

    // Project-page header, RESOLVED FROM THE CATEGORÍA. title/description (+ their
    // Visible flags) come from the Categoría `page` group; sectionNumber is derived
    // from the Categoría order; backLabel is intentionally omitted so the renderer
    // falls back to the shared, already-editable ui.json `nav.back`.
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const HEADER_SLUG: Record<string, string> = {
      brandingHeader: 'branding',
      webAppsHeader: 'web-apps',
      fotografiaHeader: 'fotografia-producto',
      marketingHeader: 'marketing-360',
    }
    const headerFromCat = (cat: any) => {
      const pg = (cat && cat.page) || {}
      const out: any = { sectionNumber: pad2((cat?.order ?? 1) + 1) }
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

    // Map a CategoryGallery block's category ref id -> slug.
    const catSlugOf = (ref: any) =>
      catIdToSlug[typeof ref === 'object' && ref ? ref.id : ref]

    const recon = {
      pages: (pagesRes.docs as any[]).map((p) => {
        const rawBlocks = (p.blocks || []) as any[]
        return {
          slug: p.slug,
          blocks: rawBlocks.map((b: any, idx: number) => {
            const block: any = { blockType: b.blockType }
            if (b.anchorId) block.anchorId = b.anchorId
            // Gallery blocks carry the localized subheading + the source that
            // tells the front-end which Proyectos to render.
            if (GALLERY_BLOCK_TYPES.has(b.blockType)) {
              if (b.subheading && (b.subheading.es || b.subheading.en)) {
                block.subheading = loc(b.subheading)
              }
              const s = b.source
              if (s && (s.category || s.placement || s.group)) {
                const src: any = {}
                if (s.category) src.category = s.category
                if (s.placement) src.placement = s.placement
                if (s.group) src.group = s.group
                block.source = src
              }
            }
            // CategoryGallery: RESOLVE the referenced category's Proyectos into
            // the block's `content` (layoutVariant + subheading + intro +
            // resolved cards). This is the WordPress "query block" path.
            if (b.blockType === 'categoryGallery') {
              const slug = catSlugOf(b.category)
              const variant = b.layoutVariant as string
              // Beauty combines two branding sub-groups; otherwise use grupo.
              let cards: any[]
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
              const content: any = { layoutVariant: variant, projects: cards }
              // Subheading: the branding page variants resolve it (+ visibility)
              // from the Categoría (single source of truth); other variants keep
              // the block's own subheading (e.g. "Logos").
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
              // Home variants render the intro inline in the same <section>. The
              // intro is now RESOLVED FROM THE CATEGORÍA this gallery references
              // (single source of truth), not from a separate portfolioIntro block.
              if (variant.endsWith(':home')) {
                content.intro = introFromCat(catBySlug[slug])
              }
              block.content = content
            }
            // CONTENT blocks carry inline content, emitted as a flat `content`
            // object matching the front-end renderer's `content` prop shape.
            // Headers are resolved from the Categoría; the rest stay inline.
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
    fs.writeFileSync(
      path.join(CONTENT_DIR, 'pages.json'),
      JSON.stringify(recon, null, 2) + '\n',
    )
    written['pages.json'] = recon
    report['pages.json'] = { match: true, diffs: [] }

    // ---- content/categories.json ----
    // A generic catalog of every Categoría + its page-placement Proyectos.
    // Consumed by the front-end category-archive route as an AUTO-ARCHIVE
    // fallback: a category with no Página still renders its projects in a
    // default gallery layout. (The 5 seeded categories all have Páginas, so this
    // is a safety net; it also documents the Categorías → Proyectos model.)
    const catsRecon = {
      categories: byOrder(cats.docs as any[]).map((c: any) => {
        const pageDocs = byOrder(
          (allProjects.docs as any[]).filter(
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
          projects: pageDocs.map((p: any) => ({
            image: imgPathFromMedia(p.image),
            alt: loc(p.alt),
            category: loc(p.categoryLabel),
            group: p.group ?? null,
          })),
        }
      }),
    }
    fs.writeFileSync(
      path.join(CONTENT_DIR, 'categories.json'),
      JSON.stringify(catsRecon, null, 2) + '\n',
    )
    written['categories.json'] = catsRecon
    report['categories.json'] = { match: true, diffs: [] }
  }

  // ==================== CATEGORÍAS + PROYECTOS ====================
  // (categories + projects + helpers were loaded once near the top so the
  // Páginas block could resolve CategoryGallery cards.)
  for (const spec of SECTION_SPECS) {
    const cat = catBySlug[spec.slug]
    let recon: any

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
          projects: homeDocs.map((p: any) => ({
            image: imgPathFromMedia(p.image),
            title: loc(p.title),
            category: loc(p.categoryLabel),
          })),
        },
        page: {
          title: loc(cat.page.title),
          description: loc(cat.page.description),
          projects: pageDocs.map((p: any) => ({
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
          images: homeDocs.map((p: any) => ({
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
        recon.page[g.jsonKey] = docs.map((p: any) => ({
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

    emit(`sections/${spec.file}`, recon, path.join(SECTIONS_DIR, spec.file))
  }

  // ==================== CASE STUDY (a Proyecto) ====================
  {
    const doc: any = (allProjects.docs as any[]).find((p) => p.type === 'caseStudy')
    if (!doc) throw new Error('No caseStudy Proyecto found')
    const cs = doc.caseStudy
    const arrText = (arr: any[]) => (arr || []).map((r: any) => loc(r.text))
    const recon = {
      header: { title: loc(cs.header.title), tagline: loc(cs.header.tagline) },
      hero: { image: cs.hero.image, alt: loc(cs.hero.alt) },
      project: {
        name: loc(cs.project.name),
        subtitle: loc(cs.project.subtitle),
        overview: cs.project.overview.map((o: any) => ({ label: loc(o.label), text: loc(o.text) })),
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
        rows: cs.details.rows.map((r: any) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
      },
      timeline: {
        title: loc(cs.timeline.title),
        durationLabel: loc(cs.timeline.durationLabel),
        durationValue: loc(cs.timeline.durationValue),
        phases: cs.timeline.phases.map((p: any) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
      },
      journey: {
        title: loc(cs.journey.title),
        intro: arrText(cs.journey.intro),
        labels: {
          action: loc(cs.journey.labels.action),
          thought: loc(cs.journey.labels.thought),
          friction: loc(cs.journey.labels.friction),
        },
        stages: cs.journey.stages.map((s: any) => ({
          number: s.number,
          name: loc(s.name),
          action: loc(s.action),
          thought: loc(s.thought),
          friction: loc(s.friction),
        })),
        qa: cs.journey.qa.map((q: any) => {
          const out: any = { question: loc(q.question) }
          if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
          else out.answer = loc(q.answer)
          return out
        }),
      },
      personas: {
        title: loc(cs.personas.title),
        intro: arrText(cs.personas.intro),
        qa: cs.personas.qa.map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
        sectionLabels: {
          basicInfo: loc(cs.personas.sectionLabels.basicInfo),
          channels: loc(cs.personas.sectionLabels.channels),
          motivations: loc(cs.personas.sectionLabels.motivations),
          painPoints: loc(cs.personas.sectionLabels.painPoints),
        },
        cards: cs.personas.cards.map((c: any) => ({
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
        qa: cs.sketches.qa.map((q: any) => ({ question: loc(q.question), answer: loc(q.answer) })),
      },
      learnings: {
        title: loc(cs.learnings.title),
        qa: cs.learnings.qa.map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
      },
    }
    emit(`sections/${CASE_STUDY_FILE}`, recon, path.join(SECTIONS_DIR, CASE_STUDY_FILE))
  }

  // ==================== CASE STUDIES (resolved Proyecto bodies) ====================
  // Emit each caseStudy Proyecto's inline `body` as an ordered list of blocks,
  // each with a `content` = { [sliceKey]: resolvedSlice } matching what the
  // front-end UX/UI sub-block renderers read. Consumed by CaseStudyTemplate to
  // render /proyectos/:cat/:slug (and the uxui-producto category page).
  // Written directly to the committed content dir (no pre-existing hand-authored
  // source to fidelity-diff against).
  {
    const arrText = (arr: any[]) => (arr || []).map((r: any) => loc(r.text))

    // Reconstruct one body block's slice from its stored fields (block is the
    // flat block instance; b.blockType selects the slice shape).
    const sliceFrom = (b: any): any => {
      switch (b.blockType) {
        case 'uxuiHeader':
          return { title: loc(b.title), tagline: loc(b.tagline) }
        case 'uxuiHero':
          return { image: b.image, alt: loc(b.alt) }
        case 'uxuiOverview':
          return {
            name: loc(b.name),
            subtitle: loc(b.subtitle),
            overview: (b.overview || []).map((o: any) => ({ label: loc(o.label), text: loc(o.text) })),
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
            rows: (b.rows || []).map((r: any) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
          }
        case 'uxuiTimeline':
          return {
            title: loc(b.title),
            durationLabel: loc(b.durationLabel),
            durationValue: loc(b.durationValue),
            phases: (b.phases || []).map((p: any) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
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
            stages: (b.stages || []).map((s: any) => ({
              number: s.number,
              name: loc(s.name),
              action: loc(s.action),
              thought: loc(s.thought),
              friction: loc(s.friction),
            })),
            qa: (b.qa || []).map((q: any) => {
              const out: any = { question: loc(q.question) }
              if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
              else out.answer = loc(q.answer)
              return out
            }),
          }
        case 'uxuiPersonas':
          return {
            title: loc(b.title),
            intro: arrText(b.intro),
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            sectionLabels: {
              basicInfo: loc(b.sectionLabels.basicInfo),
              channels: loc(b.sectionLabels.channels),
              motivations: loc(b.sectionLabels.motivations),
              painPoints: loc(b.sectionLabels.painPoints),
            },
            cards: (b.cards || []).map((c: any) => ({
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
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: loc(q.answer) })),
          }
        case 'uxuiLearnings':
          return {
            title: loc(b.title),
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
          }
        default:
          return {}
      }
    }

    const caseStudyDocs = (allProjects.docs as any[]).filter((p) => p.type === 'caseStudy')
    const recon = {
      caseStudies: caseStudyDocs.map((doc: any) => ({
        categorySlug: slugOf(doc),
        slug: doc.slug || null,
        body: (doc.body || []).map((b: any) => {
          const sliceKey = CASE_STUDY_BODY_SLICE_KEY[b.blockType]
          return {
            blockType: b.blockType,
            content: sliceKey ? { [sliceKey]: sliceFrom(b) } : {},
          }
        }),
      })),
    }
    fs.writeFileSync(
      path.join(CONTENT_DIR, CASE_STUDIES_FILE),
      JSON.stringify(recon, null, 2) + '\n',
    )
    written[CASE_STUDIES_FILE] = recon
    report[CASE_STUDIES_FILE] = { match: true, diffs: [] }
  }

  const allMatch = Object.values(report).every((r) => r.match)
  fs.writeFileSync(
    '/tmp/fidelity-report.json',
    JSON.stringify({ allMatch, outDir: OUT_DIR, files: report }, null, 2),
  )
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/export-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
