/**
 * Export the Categorías → Proyectos domain model + Pages + Navigation from
 * Payload into the static front-end fixtures (Phase 18). Emits, matching
 * src/app/blocks/types.ts exactly:
 *
 *   - content/categories.json  ({ categories: Category[] })
 *       each Category has embedded ResolvedProject[] (image + caseStudy),
 *       media resolved to "/images/<filename>", caseStudyLayout fully resolved.
 *   - content/pages.json       ({ pages: PageData[] })
 *       the home page (+ any standalone pages) with fully-resolved blocks;
 *       categoryShowcase blocks embed the resolved category (with its projects).
 *   - content/navigation.json  ({ brand, items: [{ label, href, anchor? }] })
 *
 * All media refs → "/images/<filename>" and relationships → embedded resolved
 * objects (no Payload IDs). Any referenced image missing from public/images is
 * downloaded from its R2 url.
 *
 * Run:  pnpm payload run src/scripts/export-content.ts
 * NOTE: stdout is swallowed -> a summary is written to /tmp/export-report.json.
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CONTENT_DIR, IMAGES_DIR } from './content-map'

const ALL = 'all' as any
type Loc = { es: string; en: string }

const referencedImages = new Set<string>()
const imageUrlByFilename: Record<string, string> = {}

/** media doc / path -> "/images/<filename>", tracking the referenced file. */
function mediaToPath(m: any): string {
  if (!m) return ''
  let filename = ''
  if (typeof m === 'string') {
    return m.startsWith('/') ? m : `/images/${m}`
  }
  if (typeof m === 'object' && m.filename) {
    filename = m.filename as string
    if (m.url) imageUrlByFilename[filename] = m.url as string
  }
  if (!filename) return ''
  referencedImages.add(filename)
  return `/images/${filename}`
}

/** Resolve a project doc into a front-end ResolvedProject card. */
function projectToCard(p: any): any {
  const card: any = {
    type: p.type ?? 'image',
    image: mediaToPath(p.image),
    alt: p.alt ?? { es: '', en: '' },
    category: p.categoryLabel ?? p.alt ?? { es: '', en: '' },
    title: p.title ?? p.alt ?? { es: '', en: '' },
  }
  if (p.categoryLabel) card.categoryLabel = p.categoryLabel
  if (p.slug) card.slug = p.slug
  if (p.size) card.size = p.size
  if (p.type === 'caseStudy' && Array.isArray(p.caseStudyLayout)) {
    card.caseStudyLayout = p.caseStudyLayout.map(convertBlock)
  }
  return card
}

function copy(out: any, src: any, keys: string[]) {
  for (const k of keys) if (src[k] !== undefined && src[k] !== null) out[k] = src[k]
}

/** Strip Payload block bookkeeping and dispatch by blockType. */
function convertBlock(block: any): any {
  const { id, blockName, blockType, ...rest } = block
  const out: any = { blockType }
  rest.blockType = blockType

  switch (blockType) {
    case 'hero': {
      out.backgroundImagePath = rest.backgroundImage
        ? mediaToPath(rest.backgroundImage)
        : (rest.backgroundImagePath ?? '')
      copy(out, rest, ['title', 'subtitle', 'body', 'cta1', 'cta2', 'anchorId'])
      return out
    }
    case 'portfolioSection': {
      copy(out, rest, [
        'heading',
        'description',
        'studioName',
        'roleDescription',
        'ctaLabel',
        'ctaHref',
        'anchorId',
      ])
      return out
    }
    case 'projectGallery': {
      out.layoutVariant = rest.layoutVariant
      let cards: any[] = []
      if (rest.source === 'items' && Array.isArray(rest.items)) {
        cards = rest.items
          .filter((it: any) => it && it.project)
          .map((it: any) => ({ ...projectToCard(it.project), ...(it.size ? { size: it.size } : {}) }))
      } else if (Array.isArray(rest.projects)) {
        cards = rest.projects.filter(Boolean).map((p: any) => projectToCard(p))
      }
      out.projects = cards
      copy(out, rest, ['anchorId'])
      return out
    }
    case 'categoryShowcase': {
      out.category = categoryToResolved(rest.category)
      copy(out, rest, [
        'headingOverride',
        'layoutVariant',
        'maxItems',
        'showCta',
        'ctaLabel',
        'ctaHref',
        'anchorId',
      ])
      return out
    }
    case 'sectionHeading': {
      copy(out, rest, ['eyebrow', 'number', 'heading', 'anchorId'])
      return out
    }
    case 'richText': {
      copy(out, rest, ['heading', 'anchorId'])
      out.paragraphs = (rest.paragraphs ?? []).map((p: any) => ({ text: p.text }))
      return out
    }
    case 'twoColumn': {
      out.left = rest.left ? { label: rest.left.label, text: rest.left.text } : undefined
      out.right = rest.right ? { label: rest.right.label, text: rest.right.text } : undefined
      copy(out, rest, ['anchorId'])
      return out
    }
    case 'detailsTable': {
      copy(out, rest, ['title', 'anchorId'])
      out.rows = (rest.rows ?? []).map((r: any) => ({ label: r.label, value: r.value }))
      return out
    }
    case 'timeline': {
      copy(out, rest, ['title', 'durationLabel', 'durationValue', 'anchorId'])
      out.phases = (rest.phases ?? []).map((p: any) => ({ phase: p.phase, duration: p.duration }))
      return out
    }
    case 'journeyMap': {
      copy(out, rest, ['title', 'labels', 'anchorId'])
      out.intro = (rest.intro ?? []).map((p: any) => ({ text: p.text }))
      out.stages = (rest.stages ?? []).map((s: any) => ({
        number: s.number,
        name: s.name,
        action: s.action,
        thought: s.thought,
        friction: s.friction,
      }))
      out.qa = (rest.qa ?? []).map((q: any) => ({
        question: q.question,
        answer: q.answer,
        bullets: (q.bullets ?? []).map((b: any) => ({ text: b.text })),
      }))
      return out
    }
    case 'personaCards': {
      copy(out, rest, ['title', 'sectionLabels', 'anchorId'])
      out.intro = (rest.intro ?? []).map((p: any) => ({ text: p.text }))
      out.qa = (rest.qa ?? []).map((q: any) => ({
        question: q.question,
        answer: (q.answer ?? []).map((a: any) => ({ text: a.text })),
      }))
      out.cards = (rest.cards ?? []).map((c: any) => ({
        name: c.name,
        descriptor: c.descriptor,
        quote: c.quote,
        basicInfo: (c.basicInfo ?? []).map((x: any) => ({ text: x.text })),
        channels: (c.channels ?? []).map((x: any) => ({ text: x.text })),
        motivations: (c.motivations ?? []).map((x: any) => ({ text: x.text })),
        painPoints: (c.painPoints ?? []).map((x: any) => ({ text: x.text })),
      }))
      return out
    }
    case 'qa': {
      copy(out, rest, ['title', 'anchorId'])
      out.items = (rest.items ?? []).map((q: any) => ({
        question: q.question,
        answer: q.answer,
        bullets: (q.bullets ?? []).map((b: any) => ({ text: b.text })),
      }))
      return out
    }
    case 'infoColumns': {
      copy(out, rest, ['headings', 'anchorId'])
      out.education = (rest.education ?? []).map((e: any) => ({ item: e.item }))
      out.tools = (rest.tools ?? []).map((t: any) => ({ value: t.value }))
      out.languages = (rest.languages ?? []).map((l: any) => ({ value: l.value }))
      return out
    }
    case 'experienceAccordion': {
      copy(out, rest, ['headings', 'anchorId'])
      out.experience = (rest.experience ?? []).map((job: any) => ({
        role: job.role,
        period: job.period,
        responsibilities: (job.responsibilities ?? []).map((r: any) => ({ item: r.item })),
      }))
      return out
    }
    case 'contact': {
      copy(out, rest, ['heading', 'body', 'email', 'phone', 'footer', 'anchorId'])
      out.socialLinks = (rest.socialLinks ?? []).map((s: any) => ({ name: s.name, url: s.url }))
      return out
    }
    case 'image': {
      out.image = mediaToPath(rest.image)
      copy(out, rest, ['caption', 'width', 'anchorId'])
      return out
    }
    case 'ctaButton': {
      copy(out, rest, ['label', 'href', 'style', 'anchorId'])
      return out
    }
    case 'spacer': {
      copy(out, rest, ['size', 'anchorId'])
      return out
    }
    default:
      copy(out, rest, ['anchorId'])
      return out
  }
}

/** projectsByCategoryId is populated in main() before any block conversion. */
let projectsByCategoryId: Record<number, any[]> = {}

/** Resolve a category doc (relationship) into a front-end Category. */
function categoryToResolved(c: any): any {
  if (!c) return null
  const id = typeof c === 'object' ? c.id : c
  const doc = typeof c === 'object' ? c : undefined
  const projects = (projectsByCategoryId[id as number] ?? []).map(projectToCard)
  return {
    name: doc?.name ?? { es: '', en: '' },
    slug: doc?.slug ?? '',
    anchorId: doc?.anchorId ?? '',
    ...(doc?.intro ? { intro: doc.intro } : {}),
    ...(doc?.order != null ? { order: doc.order } : {}),
    projects,
  }
}

/** Build a nav item href from the Navigation global's linkType. */
function navHref(item: any, pagesBySlug: Record<number, string>): { href: string; anchor?: boolean } {
  if (item.linkType === 'anchor') return { href: item.anchor ?? '#', anchor: true }
  if (item.linkType === 'custom') return { href: item.url ?? '#' }
  const pageId = typeof item.page === 'object' ? item.page?.id : item.page
  const slug = pageId != null ? pagesBySlug[pageId] : undefined
  return { href: slug ? `/${slug}` : '/' }
}

async function downloadMissingImages() {
  for (const filename of referencedImages) {
    const dest = path.join(IMAGES_DIR, filename)
    if (fs.existsSync(dest)) continue
    const url = imageUrlByFilename[filename]
    if (!url) continue
    const res = await fetch(url)
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
  }
}

async function main() {
  const payload = await getPayload({ config })
  const report: Record<string, unknown> = {}

  // ---- projects grouped by category (depth 2 resolves image + caseStudy media) ----
  const projectsRes = await payload.find({
    collection: 'projects',
    limit: 2000,
    depth: 2,
    locale: ALL,
    sort: 'order',
  })
  projectsByCategoryId = {}
  for (const p of projectsRes.docs as any[]) {
    const catId = typeof p.category === 'object' ? p.category?.id : p.category
    if (catId == null) continue
    ;(projectsByCategoryId[catId] ??= []).push(p)
  }

  // ---- categories.json ----
  const catsRes = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
    locale: ALL,
    sort: 'order',
  })
  const categories = (catsRes.docs as any[]).map((c) => ({
    name: c.name,
    slug: c.slug,
    anchorId: c.anchorId,
    ...(c.intro ? { intro: c.intro } : {}),
    ...(c.order != null ? { order: c.order } : {}),
    projects: (projectsByCategoryId[c.id as number] ?? []).map(projectToCard),
  }))
  fs.writeFileSync(
    path.join(CONTENT_DIR, 'categories.json'),
    JSON.stringify({ categories }, null, 2) + '\n',
  )

  // ---- pages.json ----
  const pagesRes = await payload.find({
    collection: 'pages',
    limit: 100,
    depth: 2,
    locale: ALL,
  })
  const pagesBySlug: Record<number, string> = {}
  for (const p of pagesRes.docs) pagesBySlug[p.id as number] = p.slug as string

  const pages = (pagesRes.docs as any[]).map((p) => ({
    slug: p.slug,
    title: p.title as Loc,
    layout: (p.layout ?? []).map(convertBlock),
  }))
  fs.writeFileSync(path.join(CONTENT_DIR, 'pages.json'), JSON.stringify({ pages }, null, 2) + '\n')

  // ---- navigation.json ----
  const nav: any = await payload.findGlobal({ slug: 'navigation', depth: 1, locale: ALL })
  const navigation = {
    brand: nav.brand ?? { es: '', en: '' },
    items: (nav.items ?? []).map((item: any) => {
      const { href, anchor } = navHref(item, pagesBySlug)
      return anchor ? { label: item.label, href, anchor: true } : { label: item.label, href }
    }),
  }
  fs.writeFileSync(
    path.join(CONTENT_DIR, 'navigation.json'),
    JSON.stringify(navigation, null, 2) + '\n',
  )

  // ---- download any referenced image missing locally ----
  await downloadMissingImages()

  report.categories = categories.map((c: any) => ({ slug: c.slug, projects: c.projects.length }))
  report.pages = pages.map((p: any) => ({
    slug: p.slug,
    blocks: p.layout.length,
    blockTypes: p.layout.map((b: any) => b.blockType),
  }))
  report.navItems = navigation.items.length
  report.referencedImages = [...referencedImages].sort()
  fs.writeFileSync('/tmp/export-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/export-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
