/**
 * Invariant layer (standard §2): structural checks over the COMMITTED content.
 *
 * This is the one layer that reads content/*.json rather than a synthetic
 * fixture, and it is deterministic in CI for a specific reason: content/*.json
 * changes only when someone deliberately runs `fetch-content.mjs` locally and
 * commits the result. An editor publishing in the CMS goes straight to the Vercel
 * deploy hook and never touches GitHub Actions, so editor activity cannot redden
 * this job (standard §6).
 *
 * PIN THE INVARIANT, NEVER THE CENSUS. The counts here move on every legitimate
 * fetch-content commit — measured 2,709 localized pairs in R11 and 3,045 in R12,
 * six weeks apart. A test asserting an exact count is guaranteed to go red for a
 * legitimate reason while catching no risk at all. What must hold regardless of
 * how much content exists is asserted below; counts appear only as vacuity floors,
 * each labelled as such.
 */
import { describe, expect, it } from 'vitest'
import { blockRegistry } from '../../src/app/PageRenderer'
import { VARIANTS } from '../../src/app/blocks/CategoryGalleryBlocks'
import uiStrings from '../../content/ui.json'
import pagesJson from '../../content/pages.json'

/**
 * Every committed content file, loaded the same way the renderers load them.
 * A glob rather than a hand-written list so a new content file is covered the
 * day it lands instead of the day someone remembers to add it here.
 */
const contentFiles = import.meta.glob<Record<string, unknown>>(
  '../../content/**/*.json',
  { eager: true, import: 'default' },
)

/**
 * Vacuity floors, NOT a census.
 *
 * Every assertion below is of the form "no node violates X". That form passes
 * trivially if the walker finds no nodes — a refactor of the content shape, or a
 * bug in the walker, would turn this suite green while checking nothing. These
 * floors are set far below the measured values (14 files, 3,045 pairs on
 * 2026-08-04) so ordinary content churn can never reach them; they exist only to
 * make "found nothing" fail.
 */
const MIN_CONTENT_FILES = 8
const MIN_LOCALIZED_PAIRS = 1000

type LocalizedPair = { es?: unknown; en?: unknown }

/** A `{ es, en }` leaf: exactly those two keys, neither holding a container. */
function isLocalizedPair(node: unknown): node is LocalizedPair {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return false
  const keys = Object.keys(node)
  if (keys.length !== 2 || !keys.includes('es') || !keys.includes('en')) return false
  return Object.values(node).every(
    (v) => typeof v !== 'object' || v === null,
  )
}

const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === ''

/** Every localized pair in every committed content file, with a path to it. */
function collectLocalizedPairs(): { path: string; pair: LocalizedPair }[] {
  const found: { path: string; pair: LocalizedPair }[] = []

  const walk = (node: unknown, path: string) => {
    if (isLocalizedPair(node)) {
      found.push({ path, pair: node })
      return
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${path}[${i}]`))
      return
    }
    if (typeof node === 'object' && node !== null) {
      for (const [key, child] of Object.entries(node)) walk(child, `${path}.${key}`)
    }
  }

  for (const [file, data] of Object.entries(contentFiles)) {
    walk(data, file.replace('../../', ''))
  }
  return found
}

describe('committed content — the walker itself', () => {
  /**
   * Bug it would catch: every other test in this file passing vacuously. If the
   * glob stops matching, or the content shape changes so `{es,en}` leaves are no
   * longer recognised, the "no node violates X" assertions below would all go
   * green while inspecting nothing at all.
   */
  it('actually finds the content it is meant to be checking', () => {
    expect(Object.keys(contentFiles).length).toBeGreaterThanOrEqual(MIN_CONTENT_FILES)
    expect(collectLocalizedPairs().length).toBeGreaterThanOrEqual(MIN_LOCALIZED_PAIRS)
  })
})

describe('committed content — bilingual symmetry', () => {
  /**
   * Bug it would catch: Spanish content shipping with its English counterpart
   * blank. The English visitor gets an empty heading, an empty CTA or an empty alt
   * attribute, and NOTHING reports it: Payload's `fallback: true` only covers an
   * absent `en`, not a cleared one, so an editor who empties the English field
   * publishes a blank. The invariant holds today (0 asymmetric pairs across 3,045)
   * and until now nothing guarded it tomorrow.
   *
   * Both-empty pairs are explicitly allowed — 59 exist today and they are
   * legitimate: an optional caption nobody filled in is not a translation gap.
   * The asymmetric case is the bug, because someone clearly meant to write it.
   */
  it('has no pair with Spanish written and English left blank', () => {
    const asymmetric = collectLocalizedPairs()
      .filter(({ pair }) => !isBlank(pair.es) && isBlank(pair.en))
      .map(({ path }) => path)

    expect(asymmetric).toEqual([])
  })
})

describe('committed content — ui.json locale parity', () => {
  /**
   * Bug it would catch: a UI string key present in one locale and not the other.
   * LanguageContext.tsx:26 is `translations[language][key] || key`, so a key
   * missing from `en` renders the KEY ITSELF to the page — the English visitor
   * reads "nav.back" where a word should be. ui.json is CMS-generated, so a
   * rename or a partially-filled locale produces this immediately.
   */
  it('has identical key sets in es and en', () => {
    const es = Object.keys(uiStrings.es).sort()
    const en = Object.keys(uiStrings.en).sort()

    expect(en.filter((k) => !es.includes(k))).toEqual([])
    expect(es.filter((k) => !en.includes(k))).toEqual([])
    // Vacuity floor, not a census: ui.json has 73 keys today.
    expect(es.length).toBeGreaterThan(20)
  })

  /**
   * Bug it would catch: a key present in both locales but EMPTY, which renders the
   * raw key exactly as a missing one does. Key-set parity alone would not see it.
   */
  it('has no empty UI string in either locale', () => {
    const empty = (['es', 'en'] as const).flatMap((locale) =>
      Object.entries(uiStrings[locale])
        .filter(([, value]) => isBlank(value))
        .map(([key]) => `${locale}.${key}`),
    )

    expect(empty).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Render-chain coverage: does every piece of committed content have something
// that can render it? These are the two silent-drop paths, caught at the point
// content lands in the repo rather than after it has shipped.
// ---------------------------------------------------------------------------

type Block = { blockType: string; content?: { layoutVariant?: string } }
const pages = (pagesJson as { pages: { slug: string; blocks: Block[] }[] }).pages

describe('committed content — every blockType can be rendered', () => {
  /**
   * Bug it would catch: exactly the failure PageRenderer's unknown-blockType
   * branch degrades from — a block renamed in the CMS, or a registry key dropped
   * in a refactor, so a whole section stops rendering. The console.error in
   * PageRenderer reports it at RUNTIME, in a browser nobody is watching; this
   * catches the same mismatch in CI, before the merge.
   *
   * ONE DIRECTION ONLY: used ⊆ registered. The reverse is false by design — 28
   * registry entries exist against 20 blockTypes currently placed, and those 8
   * spare entries are blocks available to an editor that no page uses today.
   * Asserting registered ⊆ used would fail on day one and be deleted by whoever
   * hit it next.
   */
  it('has a registry entry for every blockType used in pages.json', () => {
    const registered = new Set(Object.keys(blockRegistry))
    const unrenderable = pages.flatMap((page) =>
      page.blocks
        .filter((block) => !registered.has(block.blockType))
        .map((block) => `${page.slug}: ${block.blockType}`),
    )

    expect(unrenderable).toEqual([])
    // Vacuity floor: 20 distinct blockTypes are placed today.
    expect(new Set(pages.flatMap((p) => p.blocks.map((b) => b.blockType))).size)
      .toBeGreaterThan(5)
  })
})

describe('committed content — every gallery layoutVariant can be rendered', () => {
  /**
   * Bug it would catch: the second silent-drop path. A `categoryGallery` block
   * whose `layoutVariant` is not in the dispatcher renders nothing even though its
   * blockType is perfectly registered — so the check above passes and the gallery
   * still vanishes. Renaming a variant is a one-word change in the CMS.
   *
   * Same single direction, and for the same reason: an unplaced variant is fine.
   */
  it('has a dispatcher entry for every layoutVariant used in pages.json', () => {
    const defined = new Set(Object.keys(VARIANTS))
    const unrenderable = pages.flatMap((page) =>
      page.blocks
        .map((block) => block.content?.layoutVariant)
        .filter((variant): variant is string => typeof variant === 'string')
        .filter((variant) => !defined.has(variant))
        .map((variant) => `${page.slug}: ${variant}`),
    )

    expect(unrenderable).toEqual([])
  })
})
