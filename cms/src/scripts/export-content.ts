/**
 * Export published Pages + Navigation from Payload into the static front-end
 * fixtures the page-builder loader reads:
 *   - content/pages.json       ({ pages: PageData[] })
 *   - content/navigation.json  ({ brand, items: [{ label, href, anchor? }] })
 *
 * This is the LOCAL mirror of the Phase-5 build-time fetch. Media + project
 * relationship refs are pre-resolved:
 *   - media upload -> "/images/<filename>"
 *   - projectGallery.projects / .items -> resolved cards
 *       { image, alt:{es,en}, category:{es,en}, title:{es,en}, size? }
 *
 * Run:  pnpm payload run src/scripts/export-content.ts
 * NOTE: stdout is swallowed -> a summary is written to /tmp/export-report.json.
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CONTENT_DIR } from './content-map'

const ALL = 'all' as any

type Loc = { es: string; en: string }

/** media doc / path -> "/images/<filename>" */
function mediaToPath(m: any): string {
  if (!m) return ''
  if (typeof m === 'string') {
    // already a path (e.g. "/images/foo.png") or a bare filename
    return m.startsWith('/') ? m : `/images/${m}`
  }
  if (typeof m === 'object' && m.filename) return `/images/${m.filename}`
  return ''
}

/** Resolve a project relationship doc into a front-end card. */
function projectToCard(p: any, size?: string): any {
  const card: any = {
    image: mediaToPath(p.image),
    alt: p.alt ?? { es: '', en: '' },
    category: p.category ?? { es: '', en: '' },
    title: p.title ?? p.alt ?? { es: '', en: '' },
  }
  if (size) card.size = size
  return card
}

/** Strip Payload block bookkeeping fields we don't emit. */
function baseBlock(block: any): any {
  const { id, blockName, ...rest } = block
  const out: any = { blockType: rest.blockType }
  if (id) out.id = id
  return { out, rest }
}

function convertBlock(block: any): any {
  const { out, rest } = baseBlock(block)

  switch (rest.blockType) {
    case 'hero': {
      out.backgroundImagePath = rest.backgroundImage
        ? mediaToPath(rest.backgroundImage)
        : rest.backgroundImagePath ?? ''
      copy(out, rest, ['title', 'subtitle', 'body', 'cta1', 'cta2'])
      return out
    }
    case 'portfolioSection': {
      copy(out, rest, ['heading', 'description', 'studioName', 'roleDescription', 'ctaLabel', 'ctaHref'])
      return out
    }
    case 'projectGallery': {
      out.layoutVariant = rest.layoutVariant
      let cards: any[] = []
      if (rest.source === 'items' && Array.isArray(rest.items)) {
        cards = rest.items
          .filter((it: any) => it && it.project)
          .map((it: any) => projectToCard(it.project, it.size))
      } else if (Array.isArray(rest.projects)) {
        cards = rest.projects.filter(Boolean).map((p: any) => projectToCard(p))
      }
      out.projects = cards
      return out
    }
    case 'sectionHeading': {
      copy(out, rest, ['eyebrow', 'number', 'heading'])
      return out
    }
    case 'richText': {
      copy(out, rest, ['heading'])
      out.paragraphs = (rest.paragraphs ?? []).map((p: any) => ({ text: p.text }))
      return out
    }
    case 'twoColumn': {
      out.left = rest.left ? { label: rest.left.label, text: rest.left.text } : undefined
      out.right = rest.right ? { label: rest.right.label, text: rest.right.text } : undefined
      return out
    }
    case 'detailsTable': {
      copy(out, rest, ['title'])
      out.rows = (rest.rows ?? []).map((r: any) => ({ label: r.label, value: r.value }))
      return out
    }
    case 'timeline': {
      copy(out, rest, ['title', 'durationLabel', 'durationValue'])
      out.phases = (rest.phases ?? []).map((p: any) => ({ phase: p.phase, duration: p.duration }))
      return out
    }
    case 'journeyMap': {
      copy(out, rest, ['title', 'labels'])
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
      copy(out, rest, ['title', 'sectionLabels'])
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
      copy(out, rest, ['title'])
      out.items = (rest.items ?? []).map((q: any) => ({
        question: q.question,
        answer: q.answer,
        bullets: (q.bullets ?? []).map((b: any) => ({ text: b.text })),
      }))
      return out
    }
    case 'infoColumns': {
      copy(out, rest, ['headings'])
      out.education = (rest.education ?? []).map((e: any) => ({ item: e.item }))
      out.tools = (rest.tools ?? []).map((t: any) => ({ value: t.value }))
      out.languages = (rest.languages ?? []).map((l: any) => ({ value: l.value }))
      return out
    }
    case 'experienceAccordion': {
      copy(out, rest, ['headings'])
      out.experience = (rest.experience ?? []).map((job: any) => ({
        role: job.role,
        period: job.period,
        responsibilities: (job.responsibilities ?? []).map((r: any) => ({ item: r.item })),
      }))
      return out
    }
    case 'contact': {
      copy(out, rest, ['heading', 'body', 'email', 'phone', 'footer'])
      out.socialLinks = (rest.socialLinks ?? []).map((s: any) => ({ name: s.name, url: s.url }))
      return out
    }
    case 'image': {
      out.image = typeof rest.image === 'string' ? mediaToPath(rest.image) : mediaToPath(rest.image)
      copy(out, rest, ['caption', 'width'])
      return out
    }
    case 'ctaButton': {
      copy(out, rest, ['label', 'href', 'style'])
      return out
    }
    case 'spacer': {
      copy(out, rest, ['size'])
      return out
    }
    default:
      return out
  }
}

function copy(out: any, src: any, keys: string[]) {
  for (const k of keys) if (src[k] !== undefined && src[k] !== null) out[k] = src[k]
}

/** Build a nav item href from the Navigation global's linkType. */
function navHref(item: any, pagesBySlug: Record<number, string>): { href: string; anchor?: boolean } {
  if (item.linkType === 'anchor') return { href: item.anchor ?? '#', anchor: true }
  if (item.linkType === 'custom') return { href: item.url ?? '#' }
  // page
  const pageId = typeof item.page === 'object' ? item.page?.id : item.page
  const slug = pageId != null ? pagesBySlug[pageId] : undefined
  return { href: slug ? `/${slug}` : '/' }
}

async function main() {
  const payload = await getPayload({ config })
  const report: Record<string, unknown> = {}

  // Drafts are disabled on Pages (see Pages.ts note), so every Page is live.
  const pagesRes = await payload.find({
    collection: 'pages',
    limit: 100,
    depth: 2,
    locale: ALL,
  })

  const pagesBySlug: Record<number, string> = {}
  for (const p of pagesRes.docs) pagesBySlug[p.id as number] = p.slug as string

  const pages = pagesRes.docs.map((p: any) => ({
    slug: p.slug,
    title: p.title as Loc,
    layout: (p.layout ?? []).map(convertBlock),
  }))

  fs.writeFileSync(path.join(CONTENT_DIR, 'pages.json'), JSON.stringify({ pages }, null, 2) + '\n')

  const nav: any = await payload.findGlobal({ slug: 'navigation', depth: 1, locale: ALL })
  const navigation = {
    brand: nav.brand ?? { es: '', en: '' },
    items: (nav.items ?? []).map((item: any) => {
      const { href, anchor } = navHref(item, pagesBySlug)
      return anchor ? { label: item.label, href, anchor: true } : { label: item.label, href }
    }),
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'navigation.json'), JSON.stringify(navigation, null, 2) + '\n')

  report.pages = pages.map((p: any) => ({
    slug: p.slug,
    blocks: p.layout.length,
    galleries: p.layout
      .filter((b: any) => b.blockType === 'projectGallery')
      .map((b: any) => ({ variant: b.layoutVariant, cards: b.projects.length })),
  }))
  report.navItems = navigation.items.length
  fs.writeFileSync('/tmp/export-report.json', JSON.stringify(report, null, 2))
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync('/tmp/export-error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
}
process.exit(0)
