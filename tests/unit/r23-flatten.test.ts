/**
 * Unit layer (standard §2 — "Project-owned pure functions | Unit | Required").
 *
 * `flattenImages()` is the whole behavioural change in R23b-ii: the one function every output
 * shape reads, replacing the six filters that used to read the old top-level columns. It is
 * pure, so it is pinned here directly — no Payload, no database, no twin harness.
 *
 * WHY THIS EXISTS ALONGSIDE twin-equivalence. That test compares the two emitters TO EACH
 * OTHER, so it is blind to a mistake both make (R46's `both` bug survived a green suite for
 * exactly that reason). The semantics below are the ones neither twin can check by agreeing:
 *
 *   - the THREE group modes, and specifically that 'any' is not the same as absent
 *   - `showOnHome` / `showOnPage` as independent flags, not a single placement
 *   - home sets ordered by `homeOrder`, page sets by `order` — they differ in two of the four
 *     real categorías, and `content/pages.json` publishes the home number as a card `id`
 *   - leftover rows with no `images[]` contributing nothing, which is the property that lets
 *     R23b-iii's cleanup wait until after the promotion
 *
 * The Local twin's copy is the one imported. The REST twin mirrors it by hand (it is plain
 * ESM run by Vercel's build and cannot import from cms/ — scripts/lib/fidelity.mjs's header
 * explains why), and twin-equivalence is what proves the copies still agree.
 */
import { describe, expect, it } from 'vitest'
// Through the alias, NOT the relative path. A relative import adds export-emit.ts to the
// `tsc --noEmit` program, and it imports `fs`, `path` and `payload` — none resolvable from the
// root project, which deliberately has no @types/node (tests/cms-twin.d.ts explains why, and
// CI's `Site typecheck` job is where a relative import gets caught).
import { flattenImages, sortFlat } from '@cms-export-emit'

/** Minimal project docs — only the fields flattenImages() reads. */
const slugOf = (p: any) => p.categorySlug

const img = (o: Partial<Record<string, any>> & { order: number }) => ({
  showOnPage: false,
  showOnHome: false,
  ...o,
})

/**
 * One branding categoría in the state production is in between R23b-i and R23b-iii:
 * parents carrying images[], and the rows they were merged from still sitting there.
 */
const projects = [
  // Grouped parent, one image on the page only and one on home AND the page.
  {
    id: 10,
    categorySlug: 'branding',
    type: 'image',
    group: 'sports',
    images: [
      img({ id: 'pageOnly', order: 2, showOnPage: true }),
      img({ id: 'both', order: 1, showOnPage: true, showOnHome: true, homeOrder: 0 }),
    ],
  },
  // Ungrouped parent whose only image is on home and in no page array — fisio-equina.
  {
    id: 11,
    categorySlug: 'branding',
    type: 'image',
    images: [img({ id: 'homeOnly', order: 4, showOnHome: true, homeOrder: 3 })],
  },
  // A different group, so the named mode has something to exclude.
  {
    id: 12,
    categorySlug: 'branding',
    type: 'image',
    group: 'logos',
    images: [img({ id: 'logo', order: 7, showOnPage: true })],
  },
  // Another categoría entirely.
  {
    id: 13,
    categorySlug: 'web-apps',
    type: 'image',
    images: [img({ id: 'other', order: 1, showOnPage: true })],
  },
  // The case study: a Proyecto that is not `type: 'image'`.
  { id: 14, categorySlug: 'branding', type: 'caseStudy', images: [img({ id: 'nope', order: 0, showOnPage: true })] },
  // LEFTOVERS — real rows, real placement, real media, NO images[]. R23b-iii deletes these;
  // until then the only thing keeping them out of the published site is this function.
  { id: 20, categorySlug: 'branding', type: 'image', placement: 'page', order: 90, image: 4 },
  { id: 21, categorySlug: 'branding', type: 'image', placement: 'home', order: 91, image: 5, images: [] },
]

const ids = (rows: ReturnType<typeof flattenImages>) => rows.map((r) => r.img.id)

describe('flattenImages — the group modes (R23b-ii)', () => {
  it("'any' ignores the group entirely", () => {
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: false }))).toEqual([
      'both',
      'pageOnly',
      'logo',
    ])
  })

  it('a named group admits only parents in it', () => {
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'sports', home: false }))).toEqual([
      'both',
      'pageOnly',
    ])
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'logos', home: false }))).toEqual(['logo'])
  })

  it('null means ungrouped parents only — which is NOT what \'any\' means', () => {
    // The distinction that matters: under `null`, branding's home array is EMPTY, because
    // every photograph on it now hangs off a grouped parent. That is the silent failure
    // group mode 'any' exists to prevent, and asserting both halves is what names it.
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: null, home: false }))).toEqual([])
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: true }))).toEqual([
      'both',
      'homeOnly',
    ])
  })

  it('never crosses a categoría, and skips a caseStudy Proyecto', () => {
    expect(ids(flattenImages(projects, slugOf, { slug: 'web-apps', group: 'any', home: false }))).toEqual(['other'])
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: false }))).not.toContain('nope')
  })
})

describe('flattenImages — the two flags are independent (R23b-ii)', () => {
  it('keeps a home-only photograph out of the page set and vice versa', () => {
    const page = ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: false }))
    const home = ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: true }))
    expect(page).not.toContain('homeOnly')
    expect(home).toContain('homeOnly')
    expect(home).not.toContain('pageOnly')
    expect(page).toContain('pageOnly')
  })

  it('emits a two-placement photograph into both sets, once each (R46)', () => {
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: false })).filter((i) => i === 'both')).toHaveLength(1)
    expect(ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: true })).filter((i) => i === 'both')).toHaveLength(1)
  })
})

describe('flattenImages — leftover rows are invisible (R23b-ii / R23b-iii)', () => {
  it('contributes nothing from a project with no images[], present or empty', () => {
    const all = [
      ...ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: false })),
      ...ids(flattenImages(projects, slugOf, { slug: 'branding', group: 'any', home: true })),
    ]
    expect(all).toEqual(['both', 'pageOnly', 'logo', 'both', 'homeOnly'])
    // Vacuity floor: the two leftovers really are in the input, so this is an exclusion and
    // not an empty search.
    expect(projects.filter((p) => !(p as any).images?.length)).toHaveLength(2)
  })
})

describe('sortFlat — home sets order by homeOrder, page sets by order (R23b-ii)', () => {
  // The gift-box-vinte.png shape, which r23-target-model.md §3.2 said could not exist:
  // page order 8, home order 5. Sorting the home set by `order` puts it last there too.
  const gift = { img: { id: 'gift', order: 8, homeOrder: 5 }, parent: { id: 1 }, index: 0 }
  const later = { img: { id: 'later', order: 9, homeOrder: 6 }, parent: { id: 1 }, index: 1 }
  const early = { img: { id: 'early', order: 4, homeOrder: 7 }, parent: { id: 1 }, index: 2 }

  it('uses order for a page set', () => {
    expect(sortFlat([gift, later, early], false).map((r) => r.img.id)).toEqual(['early', 'gift', 'later'])
  })

  it('uses homeOrder for a home set', () => {
    expect(sortFlat([gift, later, early], true).map((r) => r.img.id)).toEqual(['gift', 'later', 'early'])
  })

  it('falls back to order when homeOrder was never set', () => {
    const bare = { img: { id: 'bare', order: 1 }, parent: { id: 1 }, index: 0 }
    expect(sortFlat([gift, bare], true).map((r) => r.img.id)).toEqual(['bare', 'gift'])
  })

  // Production has a real collision: `1.jpg` and `croissant.png` both sit at order 1 (R45).
  // Without a tiebreak the winner is whatever order the API returned the parents in, and the
  // two twins can legitimately differ on that.
  it('breaks an order tie deterministically, by parent then array position', () => {
    const a = { img: { id: 'a', order: 1 }, parent: { id: 7 }, index: 1 }
    const b = { img: { id: 'b', order: 1 }, parent: { id: 7 }, index: 0 }
    const c = { img: { id: 'c', order: 1 }, parent: { id: 3 }, index: 9 }
    expect(sortFlat([a, b, c], false).map((r) => r.img.id)).toEqual(['c', 'b', 'a'])
    expect(sortFlat([b, c, a], false).map((r) => r.img.id)).toEqual(['c', 'b', 'a'])
  })
})
