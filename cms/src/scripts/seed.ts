/**
 * Idempotent seed: loads content/*.json + public/images into Payload.
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
    headings: about.headings, // { education:{es,en}, tools:{es,en}, languages:{es,en} }
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
    await payload.create({
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
  fs.writeFileSync('/tmp/seed-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/seed-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
