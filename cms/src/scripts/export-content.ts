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
} from './content-map'

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

  // ==================== CATEGORÍAS + PROYECTOS ====================
  // load all categories + projects once
  const cats = await payload.find({ collection: 'categories', limit: 100, depth: 0, locale: 'all' })
  const catBySlug: Record<string, any> = {}
  const catIdToSlug: Record<number, string> = {}
  for (const c of cats.docs as any[]) {
    catBySlug[c.slug] = c
    catIdToSlug[c.id] = c.slug
  }

  const allProjects = await payload.find({ collection: 'projects', limit: 2000, depth: 0, locale: 'all' })
  const slugOf = (p: any) => catIdToSlug[typeof p.category === 'object' ? p.category.id : p.category]

  const projByKey = (slug: string, placement: string, group?: string) =>
    (allProjects.docs as any[]).filter(
      (p) =>
        slugOf(p) === slug &&
        p.type === 'image' &&
        p.placement === placement &&
        (group ? p.group === group : !p.group),
    )
  const byOrder = (docs: any[]) => [...docs].sort((a, b) => a.order - b.order)

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
