/**
 * Export + FIDELITY GATE.
 *
 * Reads the Categorías → Proyectos domain model (+ globals) via the Local API
 * with locale:'all', RECONSTRUCTS the exact original content files, writes them
 * to a TEMP dir (/tmp/export-out/), then deep-diffs each temp file against the
 * committed content/*.json.  Writes /tmp/fidelity-report.json.
 *
 * Run:  pnpm payload run src/scripts/export-content.ts
 *
 * Does NOT modify the committed content/*.json (source of truth). This is now
 * literally true: EVERY emitted file goes through emit() into OUT_DIR. Until
 * R13a, `site.json`, `pages.json`, `categories.json` and `case-studies.json`
 * were written straight into CONTENT_DIR while this header claimed otherwise
 * (roadmap R16), so anyone who trusted the header and ran this against prod
 * silently overwrote the source of truth with prod data. The one script that is
 * MEANT to rewrite content/ is scripts/fetch-content.mjs.
 *
 * Exit code is the gate: 0 only when all 14 files are proven identical to the
 * committed content. A mismatch, a file with nothing to compare against, an
 * emitted file missing from the report, or a thrown exception all exit 1.
 * `FIDELITY_GATE=0` downgrades a mismatch to a warning (for the RELEASE.md
 * schema step, where the script is run against prod for its side effects and a
 * content diff is expected) — it does NOT suppress a thrown exception.
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
const REPORT_PATH = '/tmp/fidelity-report.json'
const ERROR_PATH = '/tmp/export-error.json'
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'))

/**
 * `FIDELITY_GATE=0` downgrades a fidelity mismatch from "exit 1" to a warning.
 *
 * ON by default, which is the opposite of scripts/fetch-content.mjs. The
 * asymmetry is deliberate and is about what depends on the exit code: this
 * script is a verification tool nobody's build calls, so failing loudly costs
 * nothing; fetch-content.mjs is the production content producer wired into
 * vercel.json's buildCommand, where a diff from git HEAD is the normal result of
 * an editor publishing. Same detection on both sides, opposite defaults.
 *
 * The escape hatch exists for RELEASE.md's prod step, which runs this script for
 * its Payload side effects and expects prod content to differ from committed
 * content. It does not suppress a thrown exception.
 */
const GATE = process.env.FIDELITY_GATE !== '0'

type FileReport = { match: boolean | null; diffs?: string[]; note?: string }

// ---------- gate verdict + failure formatting ----------
// MIRRORS scripts/lib/fidelity.mjs, which the REST twin imports. cms/ is a
// separate pnpm project with its own lockfile and its own Vercel root directory,
// so a `../../../scripts/` import would not resolve in the CMS deployment and
// would break `next build`. Duplicated on purpose, like loc()/deepDiff()/the
// reconstruction logic itself. Edit both sides in the same commit; collapsing
// the duplication properly is R13b.

/**
 * Reduce the per-file report to a verdict. `match: true` is the ONLY passing
 * value — a `null` (nothing committed to diff against) or an emitted file absent
 * from the report counts as unproven and fails. That is the whole point of R13a.
 */
function summarizeFidelity(files: Record<string, FileReport>, expected: string[] = []) {
  const mismatched: string[] = []
  const unverified: string[] = []
  for (const [rel, r] of Object.entries(files)) {
    if (r && r.match === true) continue
    if (r && r.match === false) mismatched.push(rel)
    else unverified.push(rel)
  }
  const missingFromReport = expected.filter((rel) => !(rel in files))
  return {
    allMatch: mismatched.length === 0 && unverified.length === 0 && missingFromReport.length === 0,
    mismatched: mismatched.sort(),
    unverified: unverified.sort(),
    missingFromReport: missingFromReport.sort(),
  }
}

/**
 * Render the failure so it can be acted on without opening the JSON report:
 * every offending file, and the JSON paths inside it that diverged. Collects
 * everything and prints it all, in the house style of
 * scripts/ci/check-lockfiles.mjs — never throw on the first problem.
 */
function formatFidelityFailure(
  files: Record<string, FileReport>,
  opts: { label: string; reportPath: string; expected?: string[]; maxDiffsPerFile?: number },
): string {
  const { label, reportPath, expected = [], maxDiffsPerFile = 12 } = opts
  const { mismatched, unverified, missingFromReport } = summarizeFidelity(files, expected)
  const out: string[] = []

  out.push(`❌ ${label}: FIDELITY MISMATCH — the reconstruction does not match the committed content.`)

  for (const rel of mismatched) {
    const diffs = files[rel]?.diffs || []
    out.push(`\n  content/${rel} — ${diffs.length} diverging path(s):`)
    for (const d of diffs.slice(0, maxDiffsPerFile)) out.push(`    ${d}`)
    if (diffs.length > maxDiffsPerFile) {
      out.push(`    … and ${diffs.length - maxDiffsPerFile} more (full list: ${reportPath})`)
    }
  }
  for (const rel of unverified) {
    out.push(`\n  content/${rel} — NOT COMPARED: ${files[rel]?.note || 'no committed version to diff against'}`)
  }
  for (const rel of missingFromReport) {
    out.push(`\n  content/${rel} — emitted but absent from the fidelity report (the report is incomplete).`)
  }

  out.push(
    `\n  Full report: ${reportPath}`,
    `  This means the CMS reconstruction and the committed content/*.json no longer agree.`,
    `  Do NOT commit regenerated content to make this green — find which side changed first.`,
  )
  return out.join('\n')
}

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
  const report: Record<string, FileReport> = {}
  // Every file emit() wrote. Cross-checked against `report` at the end so an
  // emitted-but-unreported file (site.json was exactly that until R13a) fails
  // the gate instead of vanishing from it.
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

  /**
   * Write one reconstructed file to OUT_DIR and diff it against the committed
   * original. THE ONLY WAY A FILE MAY LEAVE THIS SCRIPT — every emitted file
   * lands in `report`, and nothing writes into CONTENT_DIR.
   *
   * A missing or unreadable original is reported as `match: null` rather than
   * throwing, so one absent file surfaces alongside every other problem instead
   * of aborting the run at the first one. summarizeFidelity still fails on it.
   */
  const emit = (relPath: string, recon: any, origPath: string) => {
    fs.writeFileSync(path.join(OUT_DIR, relPath), JSON.stringify(recon, null, 2) + '\n')
    written[relPath] = recon
    if (!fs.existsSync(origPath)) {
      report[relPath] = { match: null, note: `no committed ${path.relative(CONTENT_DIR, origPath)} to diff against` }
      return
    }
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
  {
    const g: any = await payload.findGlobal({ slug: 'site', locale: 'all', depth: 0 })
    const site = {
      siteTitle: g.siteTitle,
      brand: g.brand,
      navItems: (g.navItems || []).map((n: any) => ({ label: n.label, target: n.target })),
    }
    emit('site.json', site, path.join(CONTENT_DIR, 'site.json'))
  }

  // ==================== PÁGINAS ====================
  // The Pages collection is the source of truth for page composition (block
  // order). content/pages.json used to be written straight into the committed
  // content dir on the grounds that it had "no pre-existing hand-authored source
  // to fidelity-diff against" — true when the file was first generated, false
  // ever since it was committed. At 537,374 bytes it is 80.9% of all content, so
  // that one exemption was most of the gate's 90.2% blind spot (R13a). It goes
  // through emit() like everything else now.
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
      header: { title: loc(cs.header.title), titleVisible: vis(cs.header.titleVisible), tagline: loc(cs.header.tagline), taglineVisible: vis(cs.header.taglineVisible) },
      hero: { image: cs.hero.image, imageVisible: vis(cs.hero.imageVisible), alt: loc(cs.hero.alt), altVisible: vis(cs.hero.altVisible) },
      project: {
        name: loc(cs.project.name),
        nameVisible: vis(cs.project.nameVisible),
        subtitle: loc(cs.project.subtitle),
        subtitleVisible: vis(cs.project.subtitleVisible),
        overview: cs.project.overview.map((o: any) => ({ label: loc(o.label), text: loc(o.text) })),
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
        rows: cs.details.rows.map((r: any) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
        rowsVisible: vis(cs.details.rowsVisible),
      },
      timeline: {
        title: loc(cs.timeline.title),
        titleVisible: vis(cs.timeline.titleVisible),
        durationLabel: loc(cs.timeline.durationLabel),
        durationLabelVisible: vis(cs.timeline.durationLabelVisible),
        durationValue: loc(cs.timeline.durationValue),
        durationValueVisible: vis(cs.timeline.durationValueVisible),
        phases: cs.timeline.phases.map((p: any) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
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
        stages: cs.journey.stages.map((s: any) => ({
          number: s.number,
          name: loc(s.name),
          action: loc(s.action),
          thought: loc(s.thought),
          friction: loc(s.friction),
        })),
        stagesVisible: vis(cs.journey.stagesVisible),
        qa: cs.journey.qa.map((q: any) => {
          const out: any = { question: loc(q.question) }
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
        qa: cs.personas.qa.map((q: any) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
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
        cards: cs.personas.cards.map((c: any) => ({
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
        qa: cs.sketches.qa.map((q: any) => ({ question: loc(q.question), answer: loc(q.answer) })),
        qaVisible: vis(cs.sketches.qaVisible),
      },
      learnings: {
        title: loc(cs.learnings.title),
        titleVisible: vis(cs.learnings.titleVisible),
        qa: cs.learnings.qa.map((q: any) => ({ question: loc(q.question), answer: rowsText(q.answer) })),
        qaVisible: vis(cs.learnings.qaVisible),
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
      // Labels with a shared front-end fallback: ALWAYS emit the Visible flag (so
      // the toggle works even when the per-category text is left blank), and the
      // text only when set.
      const putLabel = (k: string) => {
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
    emit('pages.json', recon, path.join(CONTENT_DIR, 'pages.json'))

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
    emit('categories.json', catsRecon, path.join(CONTENT_DIR, 'categories.json'))
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
  {
    const arrText = (arr: any[]) => (arr || []).map((r: any) => loc(r.text))
    const vis = (v: any) => v !== false

    // Reconstruct one body block's slice from its stored fields (block is the
    // flat block instance; b.blockType selects the slice shape). Each field's
    // `<name>Visible` flag is carried through so the detail route honors it.
    const sliceFrom = (b: any): any => {
      switch (b.blockType) {
        case 'uxuiHeader':
          return { title: loc(b.title), titleVisible: vis(b.titleVisible), tagline: loc(b.tagline), taglineVisible: vis(b.taglineVisible) }
        case 'uxuiHero':
          return { image: b.image, imageVisible: vis(b.imageVisible), alt: loc(b.alt), altVisible: vis(b.altVisible) }
        case 'uxuiOverview':
          return {
            name: loc(b.name),
            nameVisible: vis(b.nameVisible),
            subtitle: loc(b.subtitle),
            subtitleVisible: vis(b.subtitleVisible),
            overview: (b.overview || []).map((o: any) => ({ label: loc(o.label), text: loc(o.text) })),
            overviewVisible: vis(b.overviewVisible),
          }
        case 'uxuiIntro':
          return arrText(b.intro)
        case 'uxuiProblemSolution':
          return {
            problem: { label: loc(b.problem.label), labelVisible: vis(b.problem.labelVisible), text: loc(b.problem.text), textVisible: vis(b.problem.textVisible) },
            solution: { label: loc(b.solution.label), labelVisible: vis(b.solution.labelVisible), text: loc(b.solution.text), textVisible: vis(b.solution.textVisible) },
          }
        case 'uxuiDetails':
          return {
            headers: {
              tools: loc(b.headers.tools), toolsVisible: vis(b.headers.toolsVisible),
              team: loc(b.headers.team), teamVisible: vis(b.headers.teamVisible),
              role: loc(b.headers.role), roleVisible: vis(b.headers.roleVisible),
            },
            rows: (b.rows || []).map((r: any) => ({ tools: loc(r.tools), team: loc(r.team), role: loc(r.role) })),
            rowsVisible: vis(b.rowsVisible),
          }
        case 'uxuiTimeline':
          return {
            title: loc(b.title),
            titleVisible: vis(b.titleVisible),
            durationLabel: loc(b.durationLabel),
            durationLabelVisible: vis(b.durationLabelVisible),
            durationValue: loc(b.durationValue),
            durationValueVisible: vis(b.durationValueVisible),
            phases: (b.phases || []).map((p: any) => ({ phase: loc(p.phase), duration: loc(p.duration) })),
            phasesVisible: vis(b.phasesVisible),
          }
        case 'uxuiJourney':
          return {
            title: loc(b.title),
            titleVisible: vis(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: vis(b.introVisible),
            labels: {
              action: loc(b.labels.action), actionVisible: vis(b.labels.actionVisible),
              thought: loc(b.labels.thought), thoughtVisible: vis(b.labels.thoughtVisible),
              friction: loc(b.labels.friction), frictionVisible: vis(b.labels.frictionVisible),
            },
            stages: (b.stages || []).map((s: any) => ({
              number: s.number,
              name: loc(s.name),
              action: loc(s.action),
              thought: loc(s.thought),
              friction: loc(s.friction),
            })),
            stagesVisible: vis(b.stagesVisible),
            qa: (b.qa || []).map((q: any) => {
              const out: any = { question: loc(q.question) }
              if (q.bullets && q.bullets.length > 0) out.bullets = arrText(q.bullets)
              else out.answer = loc(q.answer)
              return out
            }),
            qaVisible: vis(b.qaVisible),
          }
        case 'uxuiPersonas':
          return {
            title: loc(b.title),
            titleVisible: vis(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: vis(b.introVisible),
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            qaVisible: vis(b.qaVisible),
            sectionLabels: {
              basicInfo: loc(b.sectionLabels.basicInfo), basicInfoVisible: vis(b.sectionLabels.basicInfoVisible),
              channels: loc(b.sectionLabels.channels), channelsVisible: vis(b.sectionLabels.channelsVisible),
              motivations: loc(b.sectionLabels.motivations), motivationsVisible: vis(b.sectionLabels.motivationsVisible),
              painPoints: loc(b.sectionLabels.painPoints), painPointsVisible: vis(b.sectionLabels.painPointsVisible),
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
            cardsVisible: vis(b.cardsVisible),
          }
        case 'uxuiSketches':
          return {
            title: loc(b.title),
            titleVisible: vis(b.titleVisible),
            intro: arrText(b.intro),
            introVisible: vis(b.introVisible),
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: loc(q.answer) })),
            qaVisible: vis(b.qaVisible),
          }
        case 'uxuiLearnings':
          return {
            title: loc(b.title),
            titleVisible: vis(b.titleVisible),
            qa: (b.qa || []).map((q: any) => ({ question: loc(q.question), answer: arrText(q.answer) })),
            qaVisible: vis(b.qaVisible),
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
    emit(CASE_STUDIES_FILE, recon, path.join(CONTENT_DIR, CASE_STUDIES_FILE))
  }

  // ==================== VERDICT ====================
  // `allMatch` used to be computed here, written to /tmp, and never read by
  // anything — the gate detected divergence and then dropped it on the floor
  // (R13a). It is now the script's exit code.
  const summary = summarizeFidelity(report, Object.keys(written))
  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        allMatch: summary.allMatch,
        outDir: OUT_DIR,
        mismatched: summary.mismatched,
        unverified: summary.unverified,
        missingFromReport: summary.missingFromReport,
        files: report,
      },
      null,
      2,
    ),
  )

  if (summary.allMatch) {
    console.log(
      `[export-content] fidelity: all ${Object.keys(report).length} files match the committed content ✓ ` +
        `(reconstruction in ${OUT_DIR}, report: ${REPORT_PATH})`,
    )
    return
  }

  const detail = formatFidelityFailure(report, {
    label: '[export-content]',
    reportPath: REPORT_PATH,
    expected: Object.keys(written),
  })
  if (GATE) {
    console.error(detail)
    process.exit(1)
  }
  console.warn(detail.replace(/^❌ /, '⚠️  '))
  console.warn('\n[export-content] exit 0: FIDELITY_GATE=0 was set, so the mismatch above is a warning.')
}

try {
  await main()
} catch (err: any) {
  // Still write the error file — it is genuinely useful — but never swallow the
  // failure. `process.exit(0)` used to sit outside this try/catch, so a thrown
  // exception produced a clean exit and an empty fidelity report that read as a
  // pass (R13a).
  fs.writeFileSync(ERROR_PATH, JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
  console.error(`❌ [export-content] FAILED: ${err.message}`)
  console.error(err.stack)
  console.error(`  Details: ${ERROR_PATH}`)
  process.exit(1)
}
process.exit(0)
