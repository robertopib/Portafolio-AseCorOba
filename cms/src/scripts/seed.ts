/**
 * Idempotent seed: loads content/*.json + public/images into the intuitive
 * Categorías → Proyectos domain model.
 *
 * Run:  pnpm payload run src/scripts/seed.ts
 * NOTE: console output is swallowed in this sandbox -> results go to /tmp/seed-report.json
 *
 * Localized fields are written in a SINGLE pass with `locale: 'all'`, passing each
 * localized leaf as an { es, en } object. This preserves array row identity across
 * locales (writing es then en in two passes drops the first pass's array rows).
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  CONTENT_DIR,
  SECTIONS_DIR,
  IMAGES_DIR,
  pathToFilename,
  SECTION_SPECS,
  BRANDING_PAGE_GROUPS,
  CATEGORY_SPECS,
  CASE_STUDY_CATEGORY_SLUG,
  CASE_STUDY_FILE,
} from './content-map'

type Loc = { es: string; en: string }
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ALL = 'all' as any

async function main() {
  const payload = await getPayload({ config })
  const report: Record<string, unknown> = {}

  // -------------------- MEDIA --------------------
  const imageFiles = fs.readdirSync(IMAGES_DIR).filter((f) => !f.startsWith('.'))
  const mediaMap: Record<string, number> = {} // filename -> id

  const existingMedia = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  for (const m of existingMedia.docs) {
    if (m.filename) mediaMap[m.filename as string] = m.id as number
  }

  let uploaded = 0
  for (const filename of imageFiles) {
    if (mediaMap[filename]) continue
    const stem = filename.replace(/\.[^.]+$/, '')
    const created = await payload.create({
      collection: 'media',
      filePath: path.join(IMAGES_DIR, filename),
      locale: ALL,
      data: { alt: { es: stem, en: stem } } as any,
    })
    mediaMap[created.filename as string] = created.id as number
    uploaded++
  }
  report.mediaTotal = Object.keys(mediaMap).length
  report.mediaUploaded = uploaded

  const mediaId = (imgPath: string): number => {
    const fn = pathToFilename(imgPath)
    const id = mediaMap[fn]
    if (!id) throw new Error(`No media for ${imgPath} (filename ${fn})`)
    return id
  }

  const setGlobal = (slug: any, data: any) => payload.updateGlobal({ slug, locale: ALL, data })

  // -------------------- HOME --------------------
  const home = readJson(path.join(CONTENT_DIR, 'home.json'))
  await setGlobal('home', {
    hero: {
      backgroundImage: home.hero.backgroundImage,
      title: home.hero.title,
      subtitle: home.hero.subtitle,
      body: home.hero.body,
      cta1: home.hero.cta1,
      cta2: home.hero.cta2,
    },
  })

  // -------------------- ABOUT --------------------
  const about = readJson(path.join(CONTENT_DIR, 'about.json'))
  const eduLen = about.education.es.length
  await setGlobal('about', {
    headings: about.headings,
    education: Array.from({ length: eduLen }, (_, i) => ({
      item: { es: about.education.es[i], en: about.education.en[i] },
    })),
    tools: about.tools.map((v: string) => ({ value: v })),
    languages: about.languages.map((v: string) => ({ value: v })),
    contact: {
      heading: about.contact.heading,
      body: about.contact.body,
      email: about.contact.email,
      phone: about.contact.phone,
    },
    socialLinks: about.socialLinks.map((s: any) => ({ name: s.name, url: s.url })),
    footer: {
      copyrightPrefix: about.footer.copyrightPrefix,
      rights: about.footer.rights,
      privacy: about.footer.privacy,
      terms: about.footer.terms,
    },
  })

  // -------------------- CAREER --------------------
  const career = readJson(path.join(CONTENT_DIR, 'career.json'))
  const expLen = career.experience.es.length
  await setGlobal('career', {
    headings: career.headings,
    experience: Array.from({ length: expLen }, (_, i) => {
      const es = career.experience.es[i]
      const en = career.experience.en[i]
      const respLen = es.responsibilities.length
      return {
        role: { es: es.role, en: en.role },
        period: { es: es.period, en: en.period },
        responsibilities: Array.from({ length: respLen }, (_, j) => ({
          item: { es: es.responsibilities[j], en: en.responsibilities[j] },
        })),
      }
    }),
  })

  // -------------------- UI STRINGS --------------------
  const ui = readJson(path.join(CONTENT_DIR, 'ui.json'))
  const uiKeys = Object.keys(ui.es)
  await setGlobal('ui-strings', {
    strings: uiKeys.map((k) => ({ key: k, value: { es: ui.es[k], en: ui.en[k] } })),
  })

  // -------------------- SITIO Y NAVEGACIÓN --------------------
  const siteJson = readJson(path.join(CONTENT_DIR, 'site.json'))
  await setGlobal('site', {
    siteTitle: siteJson.siteTitle,
    brand: siteJson.brand,
    navItems: (siteJson.navItems || []).map((n: any) => ({ label: n.label, target: n.target })),
  })

  // -------------------- PÁGINAS --------------------
  // Upsert each Page with its ordered block list (idempotent). The home page
  // renders whole preview sections; the project pages are decomposed into their
  // real sub-sections. Gallery blocks carry a `source` (category slug +
  // placement + optional group) + optional `subheading` so the export can emit
  // what the front-end block renderers need.
  const readSection = (file: string) => readJson(path.join(SECTIONS_DIR, file))
  const brandingJson = readSection('branding.json')
  const webAppsJson = readSection('web-apps.json')
  const photographyJson = readSection('photography.json')
  const marketingJson = readSection('marketing-360.json')
  const caseStudyJson = readSection(CASE_STUDY_FILE)

  // ---- Inline CONTENT builders (JSON shape -> Payload block content shape) ----
  const uiJson = readJson(path.join(CONTENT_DIR, 'ui.json'))
  const navBack: Loc = { es: uiJson.es['nav.back'], en: uiJson.en['nav.back'] }

  // Localized {es,en} string array -> [{ text:{es,en} }]
  const textRows = (arr: Loc[]) => arr.map((v) => ({ text: v }))

  const heroContentFrom = (h: any) => ({
    backgroundImage: h.backgroundImage,
    title: h.title,
    subtitle: h.subtitle,
    body: h.body,
    cta1: h.cta1,
    cta2: h.cta2,
  })

  const headerContentFrom = (sectionJson: any, sectionNumber: string) => ({
    backLabel: navBack,
    sectionNumber,
    title: sectionJson.page.title,
    description: sectionJson.page.description,
  })

  // PortfolioIntro inline content, built from a section file's `home` keys
  // (the intro copy the old *Preview section drew). Only present keys are set.
  const introContentFrom = (sectionJson: any) => {
    const h = sectionJson.home || {}
    const out: any = {}
    if (h.sectionHeading !== undefined) out.sectionHeading = h.sectionHeading
    if (h.heading !== undefined) out.heading = h.heading
    if (h.tagline !== undefined) out.tagline = h.tagline
    if (h.description !== undefined) out.description = h.description
    if (h.studioName !== undefined) out.studioName = h.studioName
    if (h.roleDescription !== undefined) out.roleDescription = h.roleDescription
    if (h.cta !== undefined) out.cta = h.cta
    if (h.sketchImage !== undefined) out.sketchImage = h.sketchImage
    if (h.sketchAlt !== undefined) out.sketchAlt = h.sketchAlt
    return out
  }
  const uxuiJson = readSection('uxui.json')

  const careerJson = readJson(path.join(CONTENT_DIR, 'career.json'))
  const careerContentValue = (() => {
    const c = careerJson
    const len = c.experience.es.length
    return {
      headings: c.headings,
      experience: Array.from({ length: len }, (_, i) => {
        const es = c.experience.es[i]
        const en = c.experience.en[i]
        return {
          role: { es: es.role, en: en.role },
          period: { es: es.period, en: en.period },
          responsibilities: es.responsibilities.map((_: string, j: number) => ({
            item: { es: es.responsibilities[j], en: en.responsibilities[j] },
          })),
        }
      }),
    }
  })()

  const aboutJson = readJson(path.join(CONTENT_DIR, 'about.json'))
  const aboutContentValue = (() => {
    const a = aboutJson
    const eduLen = a.education.es.length
    return {
      headings: a.headings,
      education: Array.from({ length: eduLen }, (_, i) => ({
        item: { es: a.education.es[i], en: a.education.en[i] },
      })),
      tools: a.tools.map((v: string) => ({ value: v })),
      languages: a.languages.map((v: string) => ({ value: v })),
      contact: {
        heading: a.contact.heading,
        body: a.contact.body,
        email: a.contact.email,
        phone: a.contact.phone,
      },
      socialLinks: a.socialLinks.map((s: any) => ({ name: s.name, url: s.url })),
      footer: {
        copyrightPrefix: a.footer.copyrightPrefix,
        rights: a.footer.rights,
        privacy: a.footer.privacy,
        terms: a.footer.terms,
      },
    }
  })()

  // Full case study -> Payload uxuiContent shape (mirrors Projects.caseStudy).
  const uxuiContentValue = (() => {
    const cs = caseStudyJson
    return {
      header: { title: cs.header.title, tagline: cs.header.tagline },
      hero: { image: cs.hero.image, alt: cs.hero.alt },
      project: {
        name: cs.project.name,
        subtitle: cs.project.subtitle,
        overview: cs.project.overview.map((o: any) => ({ label: o.label, text: o.text })),
      },
      intro: textRows(cs.intro),
      problemSolution: {
        problem: { label: cs.problemSolution.problem.label, text: cs.problemSolution.problem.text },
        solution: { label: cs.problemSolution.solution.label, text: cs.problemSolution.solution.text },
      },
      details: {
        headers: cs.details.headers,
        rows: cs.details.rows.map((r: any) => ({ tools: r.tools, team: r.team, role: r.role })),
      },
      timeline: {
        title: cs.timeline.title,
        durationLabel: cs.timeline.durationLabel,
        durationValue: cs.timeline.durationValue,
        phases: cs.timeline.phases.map((p: any) => ({ phase: p.phase, duration: p.duration })),
      },
      journey: {
        title: cs.journey.title,
        intro: textRows(cs.journey.intro),
        labels: cs.journey.labels,
        stages: cs.journey.stages.map((s: any) => ({
          number: s.number,
          name: s.name,
          action: s.action,
          thought: s.thought,
          friction: s.friction,
        })),
        qa: cs.journey.qa.map((q: any) => ({
          question: q.question,
          answer: q.answer ? q.answer : undefined,
          bullets: q.bullets ? textRows(q.bullets) : undefined,
        })),
      },
      personas: {
        title: cs.personas.title,
        intro: textRows(cs.personas.intro),
        qa: cs.personas.qa.map((q: any) => ({ question: q.question, answer: textRows(q.answer) })),
        sectionLabels: cs.personas.sectionLabels,
        cards: cs.personas.cards.map((c: any) => ({
          name: c.name,
          descriptor: c.descriptor,
          quote: c.quote,
          basicInfo: textRows(c.basicInfo),
          channels: textRows(c.channels),
          motivations: textRows(c.motivations),
          painPoints: textRows(c.painPoints),
        })),
      },
      sketches: {
        title: cs.sketches.title,
        intro: textRows(cs.sketches.intro),
        qa: cs.sketches.qa.map((q: any) => ({ question: q.question, answer: q.answer })),
      },
      learnings: {
        title: cs.learnings.title,
        qa: cs.learnings.qa.map((q: any) => ({ question: q.question, answer: textRows(q.answer) })),
      },
    }
  })()

  // Built lazily (as a function) because the CategoryGallery blocks reference
  // category ids (catIdBySlug), which are only known after the Categorías are
  // created further below. buildPageDefs() is invoked after that.
  const buildPageDefs = (catIdBySlug: Record<string, number>): {
    slug: string
    title: Loc
    blocks: any[]
  }[] => [
    {
      slug: 'home',
      title: { es: 'Inicio', en: 'Home' },
      // Each home preview is split into a PortfolioIntro (inline intro copy) +
      // a CategoryGallery (query block, placement=home) that renders the
      // curated preview cards in the faithful layout. The gallery draws the
      // intro from its preceding PortfolioIntro, so on the home page the pair
      // renders exactly one <section> (byte-identical to the old *Preview).
      blocks: [
        { blockType: 'hero', heroContent: heroContentFrom(home.hero) },
        { blockType: 'portfolioIntro', portfolioIntroContent: introContentFrom(brandingJson) },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['branding'],
          layoutVariant: 'branding:home',
          placement: 'home',
        },
        { blockType: 'portfolioIntro', portfolioIntroContent: introContentFrom(webAppsJson) },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['web-apps'],
          layoutVariant: 'web-apps:home',
          placement: 'home',
        },
        { blockType: 'portfolioIntro', portfolioIntroContent: introContentFrom(uxuiJson) },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['uxui-producto'],
          layoutVariant: 'uxui:home',
          placement: 'home',
        },
        { blockType: 'portfolioIntro', portfolioIntroContent: introContentFrom(photographyJson) },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['fotografia-producto'],
          layoutVariant: 'fotografia:home',
          placement: 'home',
        },
        { blockType: 'portfolioIntro', portfolioIntroContent: introContentFrom(marketingJson) },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['marketing-360'],
          layoutVariant: 'marketing:home',
          placement: 'home',
        },
        { blockType: 'experiencia', careerContent: careerContentValue },
        { blockType: 'contacto', aboutContent: aboutContentValue },
      ],
    },
    {
      slug: 'branding',
      title: { es: 'Branding Corporativo', en: 'Corporate Branding' },
      blocks: [
        { blockType: 'brandingHeader', headerContent: headerContentFrom(brandingJson, '02') },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['branding'],
          layoutVariant: 'branding:sports',
          placement: 'page',
          grupo: 'sports',
          subheading: brandingJson.page.subtitleSports,
        },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['branding'],
          layoutVariant: 'branding:beauty',
          placement: 'page',
          subheading: brandingJson.page.subtitleBeauty,
        },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['branding'],
          layoutVariant: 'branding:logos',
          placement: 'page',
          grupo: 'logos',
          subheading: { es: 'Logos', en: 'Logos' },
        },
      ],
    },
    {
      slug: 'web-apps',
      title: { es: 'Diseño Web y Apps', en: 'Web & App Design' },
      blocks: [
        { blockType: 'webAppsHeader', headerContent: headerContentFrom(webAppsJson, '03') },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['web-apps'],
          layoutVariant: 'web-apps:page',
          placement: 'page',
        },
      ],
    },
    {
      slug: 'uxui-producto',
      title: { es: 'UX/UI Producto', en: 'UX/UI Product' },
      blocks: [
        { blockType: 'uxuiHeader', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiHero', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiOverview', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiIntro', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiProblemSolution', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiDetails', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiTimeline', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiJourney', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiPersonas', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiSketches', uxuiContent: uxuiContentValue },
        { blockType: 'uxuiLearnings', uxuiContent: uxuiContentValue },
      ],
    },
    {
      slug: 'fotografia-producto',
      title: { es: 'Fotografía de Producto y Packaging', en: 'Product Photography & Packaging' },
      blocks: [
        { blockType: 'fotografiaHeader', headerContent: headerContentFrom(photographyJson, '05') },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['fotografia-producto'],
          layoutVariant: 'fotografia:page',
          placement: 'page',
        },
      ],
    },
    {
      slug: 'marketing-360',
      title: { es: 'Diseño 360°', en: '360° Design' },
      blocks: [
        { blockType: 'marketingHeader', headerContent: headerContentFrom(marketingJson, '06') },
        {
          blockType: 'categoryGallery',
          category: catIdBySlug['marketing-360'],
          layoutVariant: 'marketing:page',
          placement: 'page',
        },
      ],
    },
  ]

  // -------------------- CATEGORÍAS --------------------
  // Wipe existing for an idempotent re-seed. Delete Proyectos FIRST so no
  // relationship/foreign-key still points at the Categorías we're removing.
  const existingProjectsPre = await payload.find({ collection: 'projects', limit: 2000, depth: 0 })
  for (const p of existingProjectsPre.docs) await payload.delete({ collection: 'projects', id: p.id })

  const existingCats = await payload.find({ collection: 'categories', limit: 1000, depth: 0 })
  for (const c of existingCats.docs) await payload.delete({ collection: 'categories', id: c.id })

  const catIdBySlug: Record<string, number> = {}

  // Build the home/page presentation groups from each section file.
  const buildHome = (f: any) => {
    const h = f.home
    if (!h) return {}
    const out: any = {}
    if (h.heading !== undefined) out.heading = h.heading
    if (h.tagline !== undefined) out.tagline = h.tagline
    if (h.description !== undefined) out.description = h.description
    if (h.studioName !== undefined) out.studioName = h.studioName
    if (h.roleDescription !== undefined) out.roleDescription = h.roleDescription
    if (h.cta !== undefined) out.cta = h.cta
    if (h.sectionHeading !== undefined) out.sectionHeading = h.sectionHeading
    if (h.sketchImage !== undefined) out.sketchImage = h.sketchImage
    if (h.sketchAlt !== undefined) out.sketchAlt = h.sketchAlt
    return out
  }
  const buildPage = (f: any) => {
    const p = f.page
    if (!p) return {}
    const out: any = {}
    if (p.title !== undefined) out.title = p.title
    if (p.description !== undefined) out.description = p.description
    if (p.subtitleSports !== undefined) out.subtitleSports = p.subtitleSports
    if (p.subtitleBeauty !== undefined) out.subtitleBeauty = p.subtitleBeauty
    return out
  }

  for (const spec of CATEGORY_SPECS) {
    const f = readJson(path.join(SECTIONS_DIR, spec.file))
    const created = await payload.create({
      collection: 'categories',
      locale: ALL,
      data: {
        name: spec.name,
        slug: spec.slug,
        anchorId: spec.anchorId,
        order: spec.order,
        home: buildHome(f),
        page: buildPage(f),
      } as any,
    })
    catIdBySlug[spec.slug] = created.id as number
  }
  report.categoriesCreated = Object.keys(catIdBySlug).length

  // -------------------- PROYECTOS --------------------
  // (Existing Proyectos were already deleted above, before the Categorías, so
  // that no relationship still referenced a Categoría being removed.)
  let projectsCreated = 0

  async function createProject(base: {
    slug: string
    type?: 'image' | 'caseStudy'
    placement: 'home' | 'page' | 'both'
    group?: string
    image?: number
    order: number
    internalTitle?: string
    title?: Loc
    alt?: Loc
    categoryLabel?: Loc
    caseStudy?: any
    body?: any
    projectSlug?: string
  }) {
    await payload.create({
      collection: 'projects',
      locale: ALL,
      data: {
        category: catIdBySlug[base.slug],
        type: base.type ?? 'image',
        placement: base.placement,
        group: base.group,
        image: base.image,
        order: base.order,
        internalTitle: base.internalTitle,
        title: base.title,
        alt: base.alt,
        categoryLabel: base.categoryLabel,
        caseStudy: base.caseStudy,
        body: base.body,
        slug: base.projectSlug,
      } as any,
    })
    projectsCreated++
  }

  for (const spec of SECTION_SPECS) {
    const f = readJson(path.join(SECTIONS_DIR, spec.file))

    // HOME cards
    if (spec.homeKind === 'titleProjects') {
      const arr = f.home.projects as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          slug: spec.slug,
          placement: 'home',
          image: mediaId(it.image),
          order: i,
          internalTitle: it.title?.es,
          title: it.title,
          categoryLabel: it.category,
        })
      }
    } else if (spec.homeKind === 'brandingImages') {
      const arr = f.home.images as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          slug: spec.slug,
          placement: 'home',
          image: mediaId(it.src),
          order: i,
          internalTitle: it.alt?.es,
          alt: it.alt,
        })
      }
    }

    // PAGE cards
    if (spec.pageKind === 'altProjects') {
      const arr = f.page.projects as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          slug: spec.slug,
          placement: 'page',
          image: mediaId(it.image),
          order: i,
          internalTitle: it.alt?.es,
          alt: it.alt,
          categoryLabel: it.category,
        })
      }
    } else if (spec.pageKind === 'brandingGroups') {
      for (const g of BRANDING_PAGE_GROUPS) {
        const arr = f.page[g.jsonKey] as any[]
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i]
          await createProject({
            slug: spec.slug,
            placement: 'page',
            group: g.group,
            image: mediaId(it.src),
            order: it.id, // preserve original id ordering value
            internalTitle: it.alt?.es,
            alt: it.alt,
            categoryLabel: it.category,
          })
        }
      }
    }
  }

  // -------------------- CASE STUDY PROYECTO --------------------
  const cs = readJson(path.join(SECTIONS_DIR, CASE_STUDY_FILE))
  const arrText = (arr: Loc[], key = 'text') => arr.map((o) => ({ [key]: o }))

  // The inline case-study BODY: an ordered list of blocks, each carrying its own
  // slice of the case study (mirrors blocks/caseStudyBody.ts). This is the WP
  // post-body the front-end case-study template renders. Built from the SAME
  // committed uxui-casestudy.json so the body is byte-faithful to it.
  const caseStudyBody = [
    { blockType: 'uxuiHeader', title: cs.header.title, tagline: cs.header.tagline },
    { blockType: 'uxuiHero', image: cs.hero.image, alt: cs.hero.alt },
    {
      blockType: 'uxuiOverview',
      name: cs.project.name,
      subtitle: cs.project.subtitle,
      overview: cs.project.overview.map((o: any) => ({ label: o.label, text: o.text })),
    },
    { blockType: 'uxuiIntro', intro: textRows(cs.intro) },
    {
      blockType: 'uxuiProblemSolution',
      problem: { label: cs.problemSolution.problem.label, text: cs.problemSolution.problem.text },
      solution: { label: cs.problemSolution.solution.label, text: cs.problemSolution.solution.text },
    },
    {
      blockType: 'uxuiDetails',
      headers: cs.details.headers,
      rows: cs.details.rows.map((r: any) => ({ tools: r.tools, team: r.team, role: r.role })),
    },
    {
      blockType: 'uxuiTimeline',
      title: cs.timeline.title,
      durationLabel: cs.timeline.durationLabel,
      durationValue: cs.timeline.durationValue,
      phases: cs.timeline.phases.map((p: any) => ({ phase: p.phase, duration: p.duration })),
    },
    {
      blockType: 'uxuiJourney',
      title: cs.journey.title,
      intro: textRows(cs.journey.intro),
      labels: cs.journey.labels,
      stages: cs.journey.stages.map((s: any) => ({
        number: s.number,
        name: s.name,
        action: s.action,
        thought: s.thought,
        friction: s.friction,
      })),
      qa: cs.journey.qa.map((q: any) => ({
        question: q.question,
        answer: q.answer ? q.answer : undefined,
        bullets: q.bullets ? textRows(q.bullets) : undefined,
      })),
    },
    {
      blockType: 'uxuiPersonas',
      title: cs.personas.title,
      intro: textRows(cs.personas.intro),
      qa: cs.personas.qa.map((q: any) => ({ question: q.question, answer: textRows(q.answer) })),
      sectionLabels: cs.personas.sectionLabels,
      cards: cs.personas.cards.map((c: any) => ({
        name: c.name,
        descriptor: c.descriptor,
        quote: c.quote,
        basicInfo: textRows(c.basicInfo),
        channels: textRows(c.channels),
        motivations: textRows(c.motivations),
        painPoints: textRows(c.painPoints),
      })),
    },
    {
      blockType: 'uxuiSketches',
      title: cs.sketches.title,
      intro: textRows(cs.sketches.intro),
      qa: cs.sketches.qa.map((q: any) => ({ question: q.question, answer: q.answer })),
    },
    {
      blockType: 'uxuiLearnings',
      title: cs.learnings.title,
      qa: cs.learnings.qa.map((q: any) => ({ question: q.question, answer: textRows(q.answer) })),
    },
  ]

  await createProject({
    slug: CASE_STUDY_CATEGORY_SLUG,
    type: 'caseStudy',
    placement: 'page',
    order: 0,
    internalTitle: cs.project?.name?.es,
    projectSlug: 'snaga',
    body: caseStudyBody,
    caseStudy: {
      header: { title: cs.header.title, tagline: cs.header.tagline },
      hero: { image: cs.hero.image, alt: cs.hero.alt },
      project: {
        name: cs.project.name,
        subtitle: cs.project.subtitle,
        overview: cs.project.overview.map((o: any) => ({ label: o.label, text: o.text })),
      },
      intro: arrText(cs.intro),
      problemSolution: {
        problem: { label: cs.problemSolution.problem.label, text: cs.problemSolution.problem.text },
        solution: { label: cs.problemSolution.solution.label, text: cs.problemSolution.solution.text },
      },
      details: {
        headers: cs.details.headers,
        rows: cs.details.rows.map((r: any) => ({ tools: r.tools, team: r.team, role: r.role })),
      },
      timeline: {
        title: cs.timeline.title,
        durationLabel: cs.timeline.durationLabel,
        durationValue: cs.timeline.durationValue,
        phases: cs.timeline.phases.map((p: any) => ({ phase: p.phase, duration: p.duration })),
      },
      journey: {
        title: cs.journey.title,
        intro: arrText(cs.journey.intro),
        labels: cs.journey.labels,
        stages: cs.journey.stages.map((s: any) => ({
          number: s.number,
          name: s.name,
          action: s.action,
          thought: s.thought,
          friction: s.friction,
        })),
        qa: cs.journey.qa.map((q: any) => ({
          question: q.question,
          answer: q.answer ? q.answer : undefined,
          bullets: q.bullets ? arrText(q.bullets) : undefined,
        })),
      },
      personas: {
        title: cs.personas.title,
        intro: arrText(cs.personas.intro),
        qa: cs.personas.qa.map((q: any) => ({ question: q.question, answer: arrText(q.answer) })),
        sectionLabels: cs.personas.sectionLabels,
        cards: cs.personas.cards.map((c: any) => ({
          name: c.name,
          descriptor: c.descriptor,
          quote: c.quote,
          basicInfo: arrText(c.basicInfo),
          channels: arrText(c.channels),
          motivations: arrText(c.motivations),
          painPoints: arrText(c.painPoints),
        })),
      },
      sketches: {
        title: cs.sketches.title,
        intro: arrText(cs.sketches.intro),
        qa: cs.sketches.qa.map((q: any) => ({ question: q.question, answer: q.answer })),
      },
      learnings: {
        title: cs.learnings.title,
        qa: cs.learnings.qa.map((q: any) => ({ question: q.question, answer: arrText(q.answer) })),
      },
    },
  })

  report.projectsCreated = projectsCreated

  // -------------------- PÁGINAS --------------------
  // Upsert AFTER Categorías/Proyectos exist, so the CategoryGallery blocks can
  // reference category ids. Idempotent per slug.
  const PAGE_DEFS = buildPageDefs(catIdBySlug)
  let pagesUpserted = 0
  for (const def of PAGE_DEFS) {
    const pageData = { title: def.title, slug: def.slug, blocks: def.blocks }
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: def.slug } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        locale: ALL,
        data: pageData as any,
      })
    } else {
      await payload.create({
        collection: 'pages',
        locale: ALL,
        data: pageData as any,
      })
    }
    pagesUpserted++
  }
  report.pagesUpserted = pagesUpserted

  fs.writeFileSync('/tmp/seed-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/seed-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
