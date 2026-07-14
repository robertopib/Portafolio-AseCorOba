/**
 * Idempotent seed for the Categorías → Proyectos domain model (Phase 18).
 *
 * Loads content/*.json + public/images into Payload and builds:
 *   - Media   (42 images, upserted by filename → R2)
 *   - Categorías (5)   with name/slug/anchorId/intro/order
 *   - Proyectos        image cards (type:'image') + the SNAGA caseStudy
 *   - Home Page        Hero + 5 CategoryShowcase + ExperienceAccordion +
 *                      InfoColumns + Contact
 *   - Navigation       brand + category anchors + #contact
 *   - UiStrings        (still used by the front-end: nav.back, etc.)
 *
 * Run:  pnpm payload run src/scripts/seed.ts
 * NOTE: stdout is swallowed -> results go to /tmp/seed-report.json
 *
 * Localized fields are written in a SINGLE pass with `locale: 'all'`, passing
 * each localized leaf as an { es, en } object so array row identity is kept
 * across locales.
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CONTENT_DIR, SECTIONS_DIR, IMAGES_DIR, pathToFilename } from './content-map'

type Loc = { es: string; en: string }
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))
const ALL = 'all' as any
const loc = (es: string, en: string): Loc => ({ es, en })

async function main() {
  const payload = await getPayload({ config })
  const report: Record<string, unknown> = {}

  const home = readJson(path.join(CONTENT_DIR, 'home.json'))
  const about = readJson(path.join(CONTENT_DIR, 'about.json'))
  const career = readJson(path.join(CONTENT_DIR, 'career.json'))
  const ui = readJson(path.join(CONTENT_DIR, 'ui.json'))
  const cs = readJson(path.join(SECTIONS_DIR, 'uxui-casestudy.json'))
  const sec = {
    branding: readJson(path.join(SECTIONS_DIR, 'branding.json')),
    'web-apps': readJson(path.join(SECTIONS_DIR, 'web-apps.json')),
    'uxui-producto': readJson(path.join(SECTIONS_DIR, 'uxui.json')),
    'fotografia-producto': readJson(path.join(SECTIONS_DIR, 'photography.json')),
    'marketing-360': readJson(path.join(SECTIONS_DIR, 'marketing-360.json')),
  } as Record<string, any>

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

  // -------------------- CLEAR (idempotent) --------------------
  // Delete projects first (they reference categories), then categories, then pages.
  for (const coll of ['projects', 'categories', 'pages'] as const) {
    const found = await payload.find({ collection: coll, limit: 2000, depth: 0 })
    for (const d of found.docs) await payload.delete({ collection: coll, id: d.id })
  }

  // ==================================================================
  // CATEGORÍAS
  // ==================================================================
  // name from ui.json portfolio.* labels; intro from portfolio.*.desc.
  // anchorId matches content/navigation.json anchors (branding, web-apps,
  // uxui-producto, fotografia, marketing).
  const categoryDefs: {
    slug: string
    anchorId: string
    name: Loc
    intro: Loc
    order: number
  }[] = [
    {
      slug: 'branding',
      anchorId: 'branding',
      order: 1,
      name: loc(ui.es['portfolio.branding'], ui.en['portfolio.branding']),
      intro: loc(ui.es['portfolio.branding.desc'], ui.en['portfolio.branding.desc']),
    },
    {
      slug: 'web-apps',
      anchorId: 'web-apps',
      order: 2,
      name: loc(ui.es['portfolio.web'], ui.en['portfolio.web']),
      intro: loc(ui.es['portfolio.web.desc'], ui.en['portfolio.web.desc']),
    },
    {
      slug: 'uxui-producto',
      anchorId: 'uxui-producto',
      order: 3,
      name: loc(sec['uxui-producto'].home.heading.es, sec['uxui-producto'].home.heading.en),
      intro: loc(
        sec['uxui-producto'].home.description.es,
        sec['uxui-producto'].home.description.en,
      ),
    },
    {
      slug: 'fotografia-producto',
      anchorId: 'fotografia',
      order: 4,
      name: loc(ui.es['portfolio.photography'], ui.en['portfolio.photography']),
      intro: loc(ui.es['portfolio.photography.desc'], ui.en['portfolio.photography.desc']),
    },
    {
      slug: 'marketing-360',
      anchorId: 'marketing',
      order: 5,
      name: loc(ui.es['portfolio.marketing'], ui.en['portfolio.marketing']),
      intro: loc(ui.es['portfolio.marketing.desc'], ui.en['portfolio.marketing.desc']),
    },
  ]

  const categoryIdBySlug: Record<string, number> = {}
  for (const def of categoryDefs) {
    const doc = await payload.create({
      collection: 'categories',
      locale: ALL,
      data: {
        name: def.name,
        slug: def.slug,
        anchorId: def.anchorId,
        intro: def.intro,
        order: def.order,
      } as any,
    })
    categoryIdBySlug[def.slug] = doc.id as number
  }
  report.categoriesCreated = categoryDefs.length

  // ==================================================================
  // PROYECTOS
  // ==================================================================
  type Card = { image: string; alt: Loc; category: Loc; size: string }

  // Per-category project cards (the full galleries the category page renders as
  // masonry-6). Sizes follow the Phase-3 page-gallery composition, adapted to a
  // single masonry-6 grid per category.
  const brandingSizeOf = (i: number): string =>
    i === 0 ? 'hero' : i === 1 ? 'med' : i === 2 ? 'tall' : 'normal'
  const brandingCards: Card[] = [
    ...(sec.branding.page.sportsProjects as any[]),
    ...(sec.branding.page.adrianaMunozProjects as any[]),
    ...(sec.branding.page.anaGraceProjects as any[]),
    ...(sec.branding.page.logoProjects as any[]),
  ].map((p: any, i: number) => ({
    image: p.src,
    alt: p.alt,
    category: p.category,
    size: brandingSizeOf(i),
  }))

  const webAppsCards: Card[] = (sec['web-apps'].page.projects as any[]).map((p: any, i: number) => ({
    image: p.image,
    alt: p.alt,
    category: p.category,
    size: i === 0 ? 'hero' : i === 1 ? 'wide-tall' : 'col3',
  }))

  const photoSizeOf = (i: number): string => {
    switch (i) {
      case 0:
        return 'hero'
      case 1:
        return 'med'
      case 2:
        return 'wide-tall'
      case 3:
        return 'col3'
      case 4:
        return 'wide5-tall'
      case 5:
        return 'wide-tall'
      case 7:
        return 'col4'
      default:
        return 'normal'
    }
  }
  const photoCards: Card[] = (sec['fotografia-producto'].page.projects as any[]).map(
    (p: any, i: number) => ({
      image: p.image,
      alt: p.alt,
      category: p.category,
      size: photoSizeOf(i),
    }),
  )

  const marketingCards: Card[] = (sec['marketing-360'].page.projects as any[]).map(
    (p: any, i: number) => ({
      image: p.image,
      alt: p.alt,
      category: p.category,
      size: i === 0 ? 'hero' : i === 1 ? 'tall' : 'col3',
    }),
  )

  // UX/UI image cards (non-case-study). The category also gets the SNAGA
  // caseStudy (created below, first in order).
  const uxuiImageCards: Card[] = [
    {
      image: '/images/live-betting.png',
      alt: loc('Live Betting App - UI/UX Mobile', 'Live Betting App - UI/UX Mobile'),
      category: loc(ui.es['category.uiux'], ui.en['category.uiux']),
      size: 'wide-tall',
    },
    {
      image: '/images/uxui-sketch.png',
      alt: sec['uxui-producto'].home.sketchAlt,
      category: loc('Wireframes', 'Wireframes'),
      size: 'col3',
    },
  ]

  let projectsCreated = 0
  let caseStudyCount = 0
  const projectsPerCategory: Record<string, number> = {}

  const createImageProject = async (
    categorySlug: string,
    card: Card,
    order: number,
  ) => {
    await payload.create({
      collection: 'projects',
      locale: ALL,
      data: {
        category: categoryIdBySlug[categorySlug],
        type: 'image',
        image: mediaId(card.image),
        order,
        title: card.alt,
        alt: card.alt,
        categoryLabel: card.category,
        size: (card as any).size,
      } as any,
    })
    projectsCreated++
    projectsPerCategory[categorySlug] = (projectsPerCategory[categorySlug] ?? 0) + 1
  }

  // ---- SNAGA case study layout (reproduces uxui-casestudy.json) ----
  const arrText = (arr: Loc[]) => arr.map((t) => ({ text: t }))
  const snagaLayout: any[] = [
    {
      blockType: 'sectionHeading',
      number: '04',
      eyebrow: cs.header.title,
      heading: cs.header.tagline,
    },
    {
      blockType: 'image',
      image: mediaId(cs.hero.image),
      caption: cs.hero.alt,
      width: 'full',
    },
    {
      blockType: 'detailsTable',
      title: cs.project.name,
      rows: cs.project.overview.map((o: any) => ({ label: o.label, value: o.text })),
    },
    { blockType: 'richText', paragraphs: arrText(cs.intro) },
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
        ...(q.answer ? { answer: q.answer } : {}),
        ...(q.bullets ? { bullets: arrText(q.bullets) } : {}),
      })),
    },
    {
      blockType: 'personaCards',
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
    {
      blockType: 'richText',
      heading: cs.sketches.title,
      paragraphs: arrText(cs.sketches.intro),
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
        bullets: arrText(q.answer),
      })),
    },
    {
      blockType: 'ctaButton',
      label: loc('Volver a UX/UI', 'Back to UX/UI'),
      href: '/proyectos/uxui-producto',
      style: 'secondary',
    },
  ]

  // Create projects per category. UX/UI gets the caseStudy first (order 0).
  await payload.create({
    collection: 'projects',
    locale: ALL,
    data: {
      category: categoryIdBySlug['uxui-producto'],
      type: 'caseStudy',
      slug: 'snaga',
      image: mediaId('/images/uxui-sketch.png'),
      order: 0,
      title: cs.project.name,
      alt: cs.hero.alt,
      categoryLabel: loc('Caso de estudio', 'Case study'),
      size: 'hero',
      caseStudyLayout: snagaLayout,
    } as any,
  })
  projectsCreated++
  caseStudyCount++
  projectsPerCategory['uxui-producto'] = 1

  const perCategoryImageCards: [string, Card[]][] = [
    ['branding', brandingCards],
    ['web-apps', webAppsCards],
    ['fotografia-producto', photoCards],
    ['marketing-360', marketingCards],
  ]
  for (const [slug, cards] of perCategoryImageCards) {
    for (let i = 0; i < cards.length; i++) await createImageProject(slug, cards[i], i)
  }
  // UX/UI image cards after the caseStudy (orders 1, 2).
  for (let i = 0; i < uxuiImageCards.length; i++) {
    await createImageProject('uxui-producto', uxuiImageCards[i], i + 1)
  }

  report.projectsCreated = projectsCreated
  report.caseStudyCount = caseStudyCount
  report.projectsPerCategory = projectsPerCategory

  // ==================================================================
  // HOME PAGE
  // ==================================================================
  const eduLen = about.education.es.length
  const expLen = career.experience.es.length

  const showcase = (
    categorySlug: string,
    anchorId: string,
    layoutVariant: string,
    maxItems: number,
    ctaHref: string,
  ) => ({
    blockType: 'categoryShowcase',
    category: categoryIdBySlug[categorySlug],
    layoutVariant,
    maxItems,
    showCta: true,
    ctaLabel: loc('Ver más proyectos', 'View more projects'),
    ctaHref,
    anchorId,
  })

  const homeLayout: any[] = [
    {
      blockType: 'hero',
      backgroundImagePath: home.hero.backgroundImage,
      title: home.hero.title,
      subtitle: home.hero.subtitle,
      body: home.hero.body,
      cta1: home.hero.cta1,
      cta2: home.hero.cta2,
    },
    // 5 category showcases, layout/maxItems matching the original home previews.
    showcase('branding', 'branding', 'grid-3', 3, '/proyectos/branding'),
    showcase('web-apps', 'web-apps', 'grid-3', 3, '/proyectos/web-apps'),
    showcase('uxui-producto', 'uxui-producto', 'single', 1, '/proyectos/uxui-producto'),
    showcase('fotografia-producto', 'fotografia', 'masonry-photo', 5, '/proyectos/fotografia-producto'),
    showcase('marketing-360', 'marketing', 'grid-4', 4, '/proyectos/marketing-360'),
    // Career accordion
    {
      blockType: 'experienceAccordion',
      headings: career.headings,
      experience: Array.from({ length: expLen }, (_, i) => {
        const es = career.experience.es[i]
        const en = career.experience.en[i]
        const respLen = es.responsibilities.length
        return {
          role: loc(es.role, en.role),
          period: loc(es.period, en.period),
          responsibilities: Array.from({ length: respLen }, (_, j) => ({
            item: loc(es.responsibilities[j], en.responsibilities[j]),
          })),
        }
      }),
    },
    // About info columns
    {
      blockType: 'infoColumns',
      headings: about.headings,
      education: Array.from({ length: eduLen }, (_, i) => ({
        item: loc(about.education.es[i], about.education.en[i]),
      })),
      tools: about.tools.map((v: string) => ({ value: v })),
      languages: about.languages.map((v: string) => ({ value: v })),
    },
    // Contact + footer
    {
      blockType: 'contact',
      anchorId: 'contact',
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

  const homeDoc = await payload.create({
    collection: 'pages',
    locale: ALL,
    data: {
      slug: 'home',
      title: loc('Inicio', 'Home'),
      layout: homeLayout,
    } as any,
  })
  report.homePageId = homeDoc.id
  report.homeBlockTypes = homeLayout.map((b) => b.blockType)

  // ==================================================================
  // NAVIGATION
  // ==================================================================
  await payload.updateGlobal({
    slug: 'navigation',
    locale: ALL,
    data: {
      brand: loc('Asenath Cordero', 'Asenath Cordero'),
      items: [
        { label: loc('Branding', 'Branding'), linkType: 'anchor', anchor: '/#branding' },
        { label: loc('Web y Apps', 'Web & Apps'), linkType: 'anchor', anchor: '/#web-apps' },
        { label: loc('UX/UI', 'UX/UI'), linkType: 'anchor', anchor: '/#uxui-producto' },
        { label: loc('Fotografía', 'Photography'), linkType: 'anchor', anchor: '/#fotografia' },
        { label: loc('Marketing 360', 'Marketing 360'), linkType: 'anchor', anchor: '/#marketing' },
        { label: loc('Contacto', 'Contact'), linkType: 'anchor', anchor: '/#contact' },
      ],
    } as any,
  })

  // ==================================================================
  // UI STRINGS (still used by the front-end)
  // ==================================================================
  const uiKeys = Object.keys(ui.es)
  await payload.updateGlobal({
    slug: 'ui-strings',
    locale: ALL,
    data: {
      strings: uiKeys.map((k) => ({ key: k, value: loc(ui.es[k], ui.en[k]) })),
    } as any,
  })

  fs.writeFileSync('/tmp/seed-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/seed-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
