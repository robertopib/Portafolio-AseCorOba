/**
 * Idempotent seed: loads content/*.json + public/images into Payload, and builds
 * the CMS Pages (block layouts) + Navigation global that reproduce the current
 * site exactly (Phase 3 page-builder migration).
 *
 * Run:  pnpm payload run src/scripts/seed.ts
 * NOTE: console output is swallowed in this sandbox -> results go to /tmp/seed-report.json
 *
 * Localized fields are written in a SINGLE pass with `locale: 'all'`, passing each
 * localized leaf as an { es, en } object. This preserves array row identity across
 * locales (writing es then en in two passes drops the first pass's array rows).
 *
 * Media + Projects seeding stays idempotent (media is upserted by filename;
 * projects are wiped + recreated deterministically). Pages are upserted by slug.
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
  SECTION_TEXT_MAP,
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

  const existing = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  for (const m of existing.docs) {
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

  // -------------------- SECTION TEXT --------------------
  const sectionFiles: Record<string, any> = {}
  for (const spec of SECTION_TEXT_MAP) {
    sectionFiles[spec.group] = readJson(path.join(SECTIONS_DIR, spec.file))
  }
  const buildSectionText = (group: string, opts: { isUxui?: boolean; hasSectionHeading?: boolean; hasBrandingPageExtras?: boolean } = {}) => {
    const f = sectionFiles[group]
    if (opts.isUxui) {
      return {
        home: {
          heading: f.home.heading,
          tagline: f.home.tagline,
          description: f.home.description,
          studioName: f.home.studioName,
          roleDescription: f.home.roleDescription,
          sketchImage: f.home.sketchImage,
          sketchAlt: f.home.sketchAlt,
          cta: f.home.cta,
        },
      }
    }
    const homeGroup: any = {
      heading: f.home.heading,
      description: f.home.description,
      studioName: f.home.studioName,
      roleDescription: f.home.roleDescription,
      cta: f.home.cta,
    }
    if (opts.hasSectionHeading) homeGroup.sectionHeading = f.home.sectionHeading
    const pageGroup: any = {
      title: f.page.title,
      description: f.page.description,
    }
    if (opts.hasBrandingPageExtras) {
      pageGroup.subtitleSports = f.page.subtitleSports
      pageGroup.subtitleBeauty = f.page.subtitleBeauty
    }
    return { home: homeGroup, page: pageGroup }
  }
  await setGlobal('section-text', {
    webApps: buildSectionText('webApps'),
    branding: buildSectionText('branding', { hasSectionHeading: true, hasBrandingPageExtras: true }),
    photography: buildSectionText('photography'),
    marketing360: buildSectionText('marketing360'),
    uxui: buildSectionText('uxui', { isUxui: true }),
  })

  // -------------------- CASE STUDY --------------------
  const cs = readJson(path.join(SECTIONS_DIR, 'uxui-casestudy.json'))
  const arrText = (arr: Loc[], key = 'text') => arr.map((o) => ({ [key]: o }))
  await setGlobal('case-study', {
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
  })

  // -------------------- PROJECTS --------------------
  const existingProjects = await payload.find({ collection: 'projects', limit: 2000, depth: 0 })
  for (const p of existingProjects.docs) {
    await payload.delete({ collection: 'projects', id: p.id })
  }

  let projectsCreated = 0
  // Lookup key -> created project id, so page galleries can reference exact docs.
  // key = `${section}|${placement}|${group ?? ''}|${order}`
  const projectKey = (section: string, placement: string, group: string | undefined, order: number) =>
    `${section}|${placement}|${group ?? ''}|${order}`
  const projectIdByKey: Record<string, number> = {}

  async function createProject(base: {
    section: string
    placement: 'home' | 'page'
    group?: string
    image: number
    order: number
    title?: Loc
    alt?: Loc
    category?: Loc
  }) {
    const doc = await payload.create({
      collection: 'projects',
      locale: ALL,
      data: {
        section: base.section,
        placement: base.placement,
        group: base.group,
        image: base.image,
        order: base.order,
        title: base.title,
        alt: base.alt,
        category: base.category,
      } as any,
    })
    projectIdByKey[projectKey(base.section, base.placement, base.group, base.order)] = doc.id as number
    projectsCreated++
  }

  for (const spec of SECTION_SPECS) {
    const f = readJson(path.join(SECTIONS_DIR, spec.file))

    // HOME
    if (spec.homeKind === 'titleProjects') {
      const arr = f.home.projects as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          section: spec.section,
          placement: 'home',
          image: mediaId(it.image),
          order: i,
          title: it.title,
          category: it.category,
        })
      }
    } else if (spec.homeKind === 'brandingImages') {
      const arr = f.home.images as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          section: spec.section,
          placement: 'home',
          image: mediaId(it.src),
          order: i,
          alt: it.alt,
        })
      }
    }

    // PAGE
    if (spec.pageKind === 'altProjects') {
      const arr = f.page.projects as any[]
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        await createProject({
          section: spec.section,
          placement: 'page',
          image: mediaId(it.image),
          order: i,
          alt: it.alt,
          category: it.category,
        })
      }
    } else if (spec.pageKind === 'brandingGroups') {
      for (const g of BRANDING_PAGE_GROUPS) {
        const arr = f.page[g.jsonKey] as any[]
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i]
          await createProject({
            section: spec.section,
            placement: 'page',
            group: g.group,
            image: mediaId(it.src),
            order: it.id, // preserve original id ordering value
            alt: it.alt,
            category: it.category,
          })
        }
      }
    }
  }
  report.projectsCreated = projectsCreated

  // ==================================================================
  // PAGES — block compositions reproducing the current site.
  // ==================================================================

  // ---- helpers for reading section text back from the JSON files ----
  const sec: Record<string, any> = {}
  for (const spec of SECTION_SPECS) sec[spec.section] = readJson(path.join(SECTIONS_DIR, spec.file))

  const pid = (section: string, placement: string, group: string | undefined, order: number) => {
    const id = projectIdByKey[projectKey(section, placement, group, order)]
    if (!id) throw new Error(`No project for ${projectKey(section, placement, group, order)}`)
    return id
  }

  // Block factories -------------------------------------------------
  const sectionHeading = (number: string, eyebrow?: Loc, heading?: Loc) => ({
    blockType: 'sectionHeading',
    number,
    ...(eyebrow ? { eyebrow } : {}),
    ...(heading ? { heading } : {}),
  })

  const portfolioSection = (s: any, ctaHref: string) => ({
    blockType: 'portfolioSection',
    heading: s.home.heading,
    description: s.home.description,
    studioName: s.home.studioName,
    roleDescription: s.home.roleDescription,
    ctaLabel: s.home.cta,
    ctaHref,
  })

  // by-filter gallery (equal cards) referencing existing project docs by list.
  const galleryManual = (layoutVariant: string, ids: number[]) => ({
    blockType: 'projectGallery',
    source: 'manual',
    layoutVariant,
    projects: ids,
  })

  // sized gallery (masonry) referencing docs with per-card size.
  const gallerySized = (layoutVariant: string, items: { project: number; size: string }[]) => ({
    blockType: 'projectGallery',
    source: 'items',
    layoutVariant,
    items,
  })

  // ---- HOME layout ----
  // Home preview galleries reproduce the exact cards each home section shows.
  // Branding home: original renders home.images.slice(2,5) => orders 2,3,4 (grid-3).
  const brandingHomeIds = [2, 3, 4].map((o) => pid('branding', 'home', undefined, o))
  // Web-apps home: home.projects[0..2] (grid-3).
  const webAppsHomeIds = [0, 1, 2].map((o) => pid('web-apps', 'home', undefined, o))
  // Photography home: original renders indices 0,1,3,4,5 (masonry-photo; 1 large + 4).
  const photoHomeIds = [0, 1, 3, 4, 5].map((o) => pid('fotografia-producto', 'home', undefined, o))
  // Marketing home: home.projects[0..3] (grid-4).
  const marketingHomeIds = [0, 1, 2, 3].map((o) => pid('marketing-360', 'home', undefined, o))

  const homeLayout: any[] = [
    // Hero
    {
      blockType: 'hero',
      backgroundImagePath: home.hero.backgroundImage,
      title: home.hero.title,
      subtitle: home.hero.subtitle,
      body: home.hero.body,
      cta1: home.hero.cta1,
      cta2: home.hero.cta2,
    },
    // 02 Branding (has the big "Proyectos" section heading in the original)
    sectionHeading('02', sec['branding'].home.sectionHeading, sec['branding'].home.heading),
    portfolioSection(sec['branding'], '/proyectos/branding'),
    galleryManual('grid-3', brandingHomeIds),
    // 03 Web & Apps
    sectionHeading('03'),
    portfolioSection(sec['web-apps'], '/proyectos/web-apps'),
    galleryManual('grid-3', webAppsHomeIds),
    // 04 UX/UI (single sketch image + CTA; no gallery cards)
    sectionHeading('04'),
    {
      blockType: 'portfolioSection',
      heading: sec['uxui-producto'].home.heading,
      description: sec['uxui-producto'].home.description,
      studioName: sec['uxui-producto'].home.studioName,
      roleDescription: sec['uxui-producto'].home.roleDescription,
      ctaLabel: sec['uxui-producto'].home.cta,
      ctaHref: '/proyectos/uxui-producto',
    },
    {
      blockType: 'image',
      image: mediaId(sec['uxui-producto'].home.sketchImage),
      caption: sec['uxui-producto'].home.sketchAlt,
      width: 'full',
    },
    // 05 Photography
    sectionHeading('05'),
    portfolioSection(sec['fotografia-producto'], '/proyectos/fotografia-producto'),
    galleryManual('masonry-photo', photoHomeIds),
    // 06 Marketing 360
    sectionHeading('06'),
    portfolioSection(sec['marketing-360'], '/proyectos/marketing-360'),
    galleryManual('grid-4', marketingHomeIds),
    // 01 About: career accordion + info columns + contact (footer)
    {
      blockType: 'experienceAccordion',
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
    },
    {
      blockType: 'infoColumns',
      headings: about.headings,
      education: Array.from({ length: eduLen }, (_, i) => ({
        item: { es: about.education.es[i], en: about.education.en[i] },
      })),
      tools: about.tools.map((v: string) => ({ value: v })),
      languages: about.languages.map((v: string) => ({ value: v })),
    },
    {
      blockType: 'contact',
      heading: about.contact.heading,
      body: about.contact.body,
      email: about.contact.email,
      phone: about.contact.phone,
      socialLinks: about.socialLinks.map((s: any) => ({ name: s.name, url: s.url })),
      footer: {
        copyrightPrefix: about.footer.copyrightPrefix,
        rights: about.footer.rights,
        privacy: about.footer.privacy,
        terms: about.footer.terms,
      },
    },
  ]

  // ---- BRANDING page layout ----
  // Sports (6-col grid): idx0 hero, idx1 med, idx2 tall, rest normal. orders: 1,2,10,11,16
  const brandingSportsOrders = sec['branding'].page.sportsProjects.map((p: any) => p.id)
  const brandingSportsItems = brandingSportsOrders.map((order: number, i: number) => ({
    project: pid('branding', 'page', 'sports', order),
    size: i === 0 ? 'hero' : i === 1 ? 'med' : i === 2 ? 'tall' : 'normal',
  }))

  // Beauty (8-col grid): adriana[0] wide5-tall, adriana[1] wide-tall, then anaGrace normal,
  // then adriana[2..] (index%3===0 ? col3 : normal). Original render order:
  //   [adriana0, adriana1, ...anaGrace, ...adriana(2..)]
  const adriana = sec['branding'].page.adrianaMunozProjects
  const anaGrace = sec['branding'].page.anaGraceProjects
  const beautyItems: { project: number; size: string }[] = []
  beautyItems.push({ project: pid('branding', 'page', 'adrianaMunoz', adriana[0].id), size: 'wide5-tall' })
  beautyItems.push({ project: pid('branding', 'page', 'adrianaMunoz', adriana[1].id), size: 'wide-tall' })
  for (const g of anaGrace) {
    beautyItems.push({ project: pid('branding', 'page', 'anaGrace', g.id), size: 'normal' })
  }
  adriana.slice(2).forEach((p: any, index: number) => {
    beautyItems.push({
      project: pid('branding', 'page', 'adrianaMunoz', p.id),
      size: index % 3 === 0 ? 'col3' : 'normal',
    })
  })

  // Logos (10-col grid): idx0 hero, rest normal.
  const logos = sec['branding'].page.logoProjects
  const logoItems = logos.map((p: any, i: number) => ({
    project: pid('branding', 'page', 'logos', p.id),
    size: i === 0 ? 'hero' : 'normal',
  }))

  const brandingLayout: any[] = [
    sectionHeading('02', sec['branding'].page.title, sec['branding'].page.title),
    {
      blockType: 'richText',
      paragraphs: [{ text: sec['branding'].page.description }],
    },
    { blockType: 'sectionHeading', number: '', heading: sec['branding'].page.subtitleSports },
    gallerySized('masonry-6', brandingSportsItems),
    { blockType: 'sectionHeading', number: '', heading: sec['branding'].page.subtitleBeauty },
    gallerySized('masonry-8', beautyItems),
    { blockType: 'sectionHeading', number: '', heading: { es: 'Logos', en: 'Logos' } },
    gallerySized('masonry-10', logoItems),
  ]

  // ---- WEB-APPS page layout ----
  // 6-col: idx0 hero(4x2), idx1 wide-tall(3x2), rest col3.
  const webAppsPageItems = (sec['web-apps'].page.projects as any[]).map((_p, i) => ({
    project: pid('web-apps', 'page', undefined, i),
    size: i === 0 ? 'hero' : i === 1 ? 'wide-tall' : 'col3',
  }))
  const webAppsLayout: any[] = [
    sectionHeading('03', sec['web-apps'].page.title, sec['web-apps'].page.title),
    { blockType: 'richText', paragraphs: [{ text: sec['web-apps'].page.description }] },
    gallerySized('masonry-6', webAppsPageItems),
  ]

  // ---- PHOTOGRAPHY page layout ----
  // 6-col explicit per-index (see ProductPhotographyProjects.tsx).
  const photoSizeByIndex = (i: number): string => {
    switch (i) {
      case 0: return 'hero'        // col-4 row-2
      case 1: return 'med'         // col-2 row-1
      case 2: return 'wide-tall'   // col-3 row-2
      case 3: return 'col3'        // col-3
      case 4: return 'wide5-tall'  // col-5 row-2
      case 5: return 'wide-tall'   // col-3 row-2
      case 6: return 'normal'      // col-2
      case 7: return 'col4'        // col-4
      default: return 'normal'     // col-2
    }
  }
  const photoPageItems = (sec['fotografia-producto'].page.projects as any[]).map((_p, i) => ({
    project: pid('fotografia-producto', 'page', undefined, i),
    size: photoSizeByIndex(i),
  }))
  const photographyLayout: any[] = [
    sectionHeading('05', sec['fotografia-producto'].page.title, sec['fotografia-producto'].page.title),
    { blockType: 'richText', paragraphs: [{ text: sec['fotografia-producto'].page.description }] },
    gallerySized('masonry-6', photoPageItems),
  ]

  // ---- MARKETING page layout ----
  // 6-col: idx0 hero(4x2), idx1 tall(2x2), rest col3.
  const marketingPageItems = (sec['marketing-360'].page.projects as any[]).map((_p, i) => ({
    project: pid('marketing-360', 'page', undefined, i),
    size: i === 0 ? 'hero' : i === 1 ? 'tall' : 'col3',
  }))
  const marketingLayout: any[] = [
    sectionHeading('06', sec['marketing-360'].page.title, sec['marketing-360'].page.title),
    { blockType: 'richText', paragraphs: [{ text: sec['marketing-360'].page.description }] },
    gallerySized('masonry-6', marketingPageItems),
  ]

  // ---- UX/UI case study page layout ----
  const uxuiLayout: any[] = [
    sectionHeading('04', cs.header.title, cs.header.title),
    { blockType: 'richText', heading: cs.header.tagline },
    { blockType: 'image', image: mediaId(cs.hero.image), caption: cs.hero.alt, width: 'full' },
    {
      blockType: 'detailsTable',
      title: cs.project.name,
      rows: cs.project.overview.map((o: any) => ({ label: o.label, value: o.text })),
    },
    { blockType: 'richText', paragraphs: cs.intro.map((t: Loc) => ({ text: t })) },
    {
      blockType: 'twoColumn',
      left: { label: cs.problemSolution.problem.label, text: cs.problemSolution.problem.text },
      right: { label: cs.problemSolution.solution.label, text: cs.problemSolution.solution.text },
    },
    {
      blockType: 'detailsTable',
      rows: cs.details.rows.map((r: any) => ({
        label: r.tools,
        value: {
          es: [r.team.es, r.role.es].filter(Boolean).join(' · '),
          en: [r.team.en, r.role.en].filter(Boolean).join(' · '),
        },
      })),
    },
    {
      blockType: 'timeline',
      title: cs.timeline.title,
      durationLabel: cs.timeline.durationLabel,
      durationValue: cs.timeline.durationValue,
      phases: cs.timeline.phases.map((p: any) => ({ phase: p.phase, duration: p.duration })),
    },
    {
      blockType: 'journeyMap',
      title: cs.journey.title,
      intro: cs.journey.intro.map((t: Loc) => ({ text: t })),
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
        ...(q.answer ? { answer: q.answer } : {}),
        ...(q.bullets ? { bullets: q.bullets.map((b: Loc) => ({ text: b })) } : {}),
      })),
    },
    {
      blockType: 'personaCards',
      title: cs.personas.title,
      intro: cs.personas.intro.map((t: Loc) => ({ text: t })),
      qa: cs.personas.qa.map((q: any) => ({ question: q.question, answer: q.answer.map((t: Loc) => ({ text: t })) })),
      sectionLabels: cs.personas.sectionLabels,
      cards: cs.personas.cards.map((c: any) => ({
        name: c.name,
        descriptor: c.descriptor,
        quote: c.quote,
        basicInfo: c.basicInfo.map((t: Loc) => ({ text: t })),
        channels: c.channels.map((t: Loc) => ({ text: t })),
        motivations: c.motivations.map((t: Loc) => ({ text: t })),
        painPoints: c.painPoints.map((t: Loc) => ({ text: t })),
      })),
    },
    {
      blockType: 'richText',
      heading: cs.sketches.title,
      paragraphs: cs.sketches.intro.map((t: Loc) => ({ text: t })),
    },
    {
      blockType: 'qa',
      items: cs.sketches.qa.map((q: any) => ({ question: q.question, answer: q.answer })),
    },
    {
      blockType: 'qa',
      title: cs.learnings.title,
      items: cs.learnings.qa.map((q: any) => ({
        question: q.question,
        bullets: q.answer.map((t: Loc) => ({ text: t })),
      })),
    },
  ]

  // ---- upsert all pages by slug ----
  const pageDefs: { slug: string; title: Loc; menuLabel?: Loc; showInNav?: boolean; navOrder?: number; layout: any[] }[] = [
    { slug: 'home', title: { es: 'Inicio', en: 'Home' }, layout: homeLayout },
    { slug: 'proyectos/branding', title: sec['branding'].page.title, layout: brandingLayout },
    { slug: 'proyectos/web-apps', title: sec['web-apps'].page.title, layout: webAppsLayout },
    { slug: 'proyectos/uxui-producto', title: cs.header.title, layout: uxuiLayout },
    { slug: 'proyectos/fotografia-producto', title: sec['fotografia-producto'].page.title, layout: photographyLayout },
    { slug: 'proyectos/marketing-360', title: sec['marketing-360'].page.title, layout: marketingLayout },
  ]

  const pageIdBySlug: Record<string, number> = {}
  let pagesUpserted = 0
  for (const def of pageDefs) {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: def.slug } },
      limit: 1,
      depth: 0,
      locale: ALL,
    })
    const data: any = {
      slug: def.slug,
      title: def.title,
      layout: def.layout,
    }
    if (found.docs.length > 0) {
      const doc = await payload.update({
        collection: 'pages',
        id: found.docs[0].id,
        locale: ALL,
        data,
      })
      pageIdBySlug[def.slug] = doc.id as number
    } else {
      const doc = await payload.create({ collection: 'pages', locale: ALL, data })
      pageIdBySlug[def.slug] = doc.id as number
    }
    pagesUpserted++
  }
  report.pagesUpserted = pagesUpserted
  report.blockCountsPerPage = Object.fromEntries(pageDefs.map((d) => [d.slug, d.layout.length]))

  // -------------------- NAVIGATION --------------------
  await setGlobal('navigation', {
    brand: { es: 'Asenath Cordero', en: 'Asenath Cordero' },
    items: [
      { label: { es: 'Proyectos', en: 'Projects' }, linkType: 'anchor', anchor: '#work' },
      { label: { es: 'Sobre mí', en: 'About' }, linkType: 'anchor', anchor: '#about' },
      { label: { es: 'Contacto', en: 'Contact' }, linkType: 'anchor', anchor: '#contact' },
    ],
  })

  fs.writeFileSync('/tmp/seed-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/seed-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
