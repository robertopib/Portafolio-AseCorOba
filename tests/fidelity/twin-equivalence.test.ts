/**
 * Fidelity layer (standard §2, risk 2) — R13b: the twins must agree with EACH
 * OTHER.
 *
 * The bug this would have caught: `scripts/fetch-content.mjs` (REST) and
 * `cms/src/scripts/export-emit.ts` (Payload Local API) are hand-maintained
 * line-for-line mirrors, ~1,150 lines each, that must emit byte-identical JSON.
 * Nothing verified that. Edit one and forget the other — a `?? ''` that becomes
 * `|| ''`, a `!== false` that becomes `=== true`, a filter widened on one side —
 * and the site keeps building: the REST twin is the production content producer,
 * so ITS output is what ships. The divergence surfaces as wrong content on every
 * published page, and the R13a gate cannot see it, because that gate compares
 * each twin against committed content, never the twins against each other.
 *
 * WHY THIS CAN RUN IN CI. Both twins now take their data source as a parameter,
 * so this drives the whole reconstruction over one committed synthetic fixture:
 * no network, no database, no Payload boot, no secrets, no live CMS, and nothing
 * written to disk (standard §3/§6). The `tests` job installs root dependencies
 * only, which is why the Local twin's reconstruction had to be split out of
 * export-content.ts — `payload` is not resolvable here and never gets imported.
 *
 * BYTES, NOT OBJECTS. The contract is byte-identical JSON *text*, so that is what
 * is compared. It also happens to be the only correct choice: R13a's hand-off
 * records that `deepDiff` walks the in-memory object, where a key valued
 * `undefined` exists (`'k' in obj` is true) but is dropped by `JSON.stringify` —
 * so an object diff can report a difference between two files that are identical
 * on disk, and could equally miss a key-ORDER change, which is a real byte
 * difference. `deepDiff` is used here only to *explain* a failure, never to
 * decide one.
 *
 * NOT compared against `content/*.json`: that file set is known-stale w.r.t. both
 * emitters (R17 — it predates studioLabelVisible/roleLabelVisible), and reading a
 * pre-existing staleness as induced divergence is exactly the trap the roadmap
 * warns about. Committed content is R13a's gate's business, not this test's.
 *
 * ONE SEMANTICS BLOCK LIVES HERE TOO (R46, at the bottom). Everything above
 * compares the twins to EACH OTHER and is deliberately blind to what they emit —
 * two emitters that share a bug agree perfectly, which is precisely how R46's
 * `placement: 'both'` bug survived: both twins dropped the row, byte-identically,
 * and this file stayed green. So the placement assertions run over BOTH twins'
 * output, asserting a value rather than an agreement. They belong here because
 * `beforeAll` has already driven both reconstructions over the fixture — a
 * separate file would re-run them for nothing (standard §6: ≤ 60 s).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { main as restMain } from '../../scripts/fetch-content.mjs'
import { main as localMain } from '@cms-export-emit'
import { deepDiff } from '../../scripts/lib/fidelity.mjs'
import { makeLocalPayload, makeRestGetJson } from './twin-drivers'

/**
 * Every file the pair is contracted to emit. Hard-coded rather than derived from
 * either twin: if a twin stops emitting one, the other's key list would quietly
 * shrink with it and a "both emitted the same set" assertion would still pass.
 */
const EXPECTED_FILES = [
  'about.json',
  'career.json',
  'case-studies.json',
  'categories.json',
  'home.json',
  'pages.json',
  'sections/branding.json',
  'sections/marketing-360.json',
  'sections/photography.json',
  'sections/uxui-casestudy.json',
  'sections/uxui.json',
  'sections/web-apps.json',
  'site.json',
  'ui.json',
].sort()

/**
 * Vacuity floors, in bytes — NOT a census (see the roadmap's "pin the invariant,
 * never the census"). Set far below what the fixture actually produces, and here
 * for one reason only: two emitters that both produced `{}` would be perfectly
 * equivalent and prove nothing. If a floor ever fails, the fixture got thinner,
 * not the code.
 */
const MIN_BYTES = 120

/** Quiet the twins' progress logging; a failure prints its own detail. */
const silent = { log: () => {}, warn: () => {}, error: () => {} }

/**
 * Compare two emitters' output. Returns one human-readable line per problem and
 * an empty array when they agree — the collect-everything house style of
 * scripts/ci/check-lockfiles.mjs, so one run names every divergence.
 */
export function diffEmitters(
  rest: Record<string, string>,
  local: Record<string, string>,
): string[] {
  const problems: string[] = []
  const restFiles = Object.keys(rest).sort()
  const localFiles = Object.keys(local).sort()

  for (const rel of restFiles.filter((f) => !localFiles.includes(f))) {
    problems.push(`content/${rel} — emitted by the REST twin only`)
  }
  for (const rel of localFiles.filter((f) => !restFiles.includes(f))) {
    problems.push(`content/${rel} — emitted by the Local-API twin only`)
  }

  for (const rel of restFiles.filter((f) => localFiles.includes(f))) {
    if (rest[rel] === local[rel]) continue
    // Bytes decided it; deepDiff only explains it.
    const paths = deepDiff(JSON.parse(rest[rel]), JSON.parse(local[rel]))
    if (paths.length === 0) {
      problems.push(
        `content/${rel} — the two twins' BYTES differ while their parsed objects are equal.` +
          ` That is a key-ORDER or whitespace divergence (${rest[rel].length} vs` +
          ` ${local[rel].length} bytes) — invisible to an object diff, visible in git.`,
      )
      continue
    }
    const shown = paths.slice(0, 8)
    problems.push(
      `content/${rel} — ${paths.length} diverging path(s) (REST vs Local API):\n` +
        shown.map((p) => `      ${p}`).join('\n') +
        (paths.length > shown.length ? `\n      … and ${paths.length - shown.length} more` : ''),
    )
  }
  return problems
}

let rest: Record<string, string>
let local: Record<string, string>

beforeAll(async () => {
  const restResult = await restMain({
    getJson: makeRestGetJson(),
    contentDir: null, // never write into the repo
    images: false, // the only remaining network path
    fidelity: false, // do not compare against committed content — see the header
    log: silent,
  })
  const localResult = await localMain({
    payload: makeLocalPayload(),
    outDir: null,
    compareDir: null,
  })
  rest = restResult.serialized
  local = localResult.serialized
})

describe('the two content emitters, driven over one CMS state', () => {
  it('both ran and emitted the whole contracted file set', () => {
    expect(Object.keys(rest).sort()).toEqual(EXPECTED_FILES)
    expect(Object.keys(local).sort()).toEqual(EXPECTED_FILES)
  })

  // Regression: any hand-edit to one 1,150-line twin that is not mirrored in the
  // other. Before this existed, the only signal was wrong content on the live
  // site — the REST twin produces what ships, and both gates reported "match".
  it('emits byte-identical JSON for every file', () => {
    const problems = diffEmitters(rest, local)
    expect(
      problems.length === 0
        ? ''
        : `The REST and Local-API emitters disagree — they are hand-mirrored and have drifted:\n  ` +
            problems.join('\n  '),
    ).toBe('')
  })

  // Vacuity floor, not a census: two emitters that both produce `{}` agree
  // perfectly and prove nothing.
  it('produced substantive output, so the comparison is not vacuous', () => {
    for (const rel of EXPECTED_FILES) {
      expect(rest[rel].length, `content/${rel} is suspiciously small`).toBeGreaterThan(MIN_BYTES)
    }
  })

  // Vacuity floor: the fixture must actually reach the branchy parts of the
  // reconstruction — resolved gallery cards, a case study, more than one page.
  it('exercised the structures the twins are most likely to drift on', () => {
    const pages = JSON.parse(rest['pages.json']).pages
    expect(pages.length).toBeGreaterThanOrEqual(3)

    const galleryBlocks = pages
      .flatMap((p: any) => p.blocks)
      .filter((b: any) => b.blockType === 'categoryGallery')
    expect(galleryBlocks.length).toBeGreaterThanOrEqual(4)
    expect(galleryBlocks.some((b: any) => b.content.projects.length > 1)).toBe(true)
    // The `:home` variant is the only path that resolves an intro from the
    // Categoría, and the only emitter of studioLabelVisible / roleLabelVisible.
    expect(galleryBlocks.some((b: any) => b.content.intro?.studioLabelVisible === true)).toBe(true)
    expect(galleryBlocks.some((b: any) => b.content.intro?.roleLabelVisible === false)).toBe(true)

    expect(JSON.parse(rest['case-studies.json']).caseStudies.length).toBeGreaterThanOrEqual(1)
    expect(JSON.parse(rest['categories.json']).categories.length).toBe(5)
  })
})

describe('the comparison itself', () => {
  // Regression: an equivalence assertion that cannot fail is worse than no
  // assertion — it reads as proof. This is the check on the check.
  it('reports a divergence when two emitters disagree', () => {
    const problems = diffEmitters(
      { 'home.json': '{\n  "hero": {\n    "title": "Hola"\n  }\n}\n' },
      { 'home.json': '{\n  "hero": {\n    "title": "Hello"\n  }\n}\n' },
    )
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('content/home.json')
    expect(problems[0]).toContain('.hero.title')
  })

  // Regression (R13a hand-off): `deepDiff` compares the in-memory object, so a
  // pure key-ORDER change — a real byte divergence, and exactly what a hand-edit
  // to one mirrored emitter produces — is invisible to it. Comparing bytes and
  // explaining with deepDiff has to survive that case rather than report
  // "0 differences" and pass.
  it('catches a key-order divergence that an object diff cannot see', () => {
    const problems = diffEmitters(
      { 'site.json': '{\n  "a": 1,\n  "b": 2\n}\n' },
      { 'site.json': '{\n  "b": 2,\n  "a": 1\n}\n' },
    )
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('key-ORDER or whitespace divergence')
  })

  it('reports a file that only one twin emits', () => {
    const problems = diffEmitters({ 'ui.json': '{}\n', 'site.json': '{}\n' }, { 'ui.json': '{}\n' })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('content/site.json — emitted by the REST twin only')
  })
})

// ---------------------------------------------------------------------------
// R46 — what a TWO-PLACEMENT photograph means. See the header note: the
// equivalence assertions above cannot see this, because both twins were wrong in
// the same way. Every assertion runs against both twins, so a fix applied to one
// side only fails here as well as in the byte comparison.
//
// TRANSLATED BY R23b-ii. R46 wrote these against `placement: 'both'` on a
// project row. That column is still there and still populated, but no emitter
// reads it any more: the same photograph is now one `images[]` entry with
// `showOnPage: true, showOnHome: true`. Same claim, same media, new storage —
// and one of the six assertions genuinely changes sign, which is called out
// where it happens rather than quietly rewritten.
// ---------------------------------------------------------------------------

/**
 * Emitted image paths for the fixture photographs these assertions turn on.
 * Media 8 upwards are owned by exactly one image each (cms-state.ts), so finding
 * one of these paths in an array proves WHICH row put it there. Asserting on a
 * shared image instead is how the first draft of the CategoryGallery test below
 * passed with the bug still in place (R48).
 */
const BOTH_WEBAPPS = '/images/theta.png' // #110 i110d — showOnPage + showOnHome, ungrouped
const HOME_ONLY_WEBAPPS = ['/images/beta.jpg'] // #110 i110b
const PAGE_ONLY_WEBAPPS = '/images/gamma.webp' // #110 i110c
const GROUPED_BOTH_BRANDING = '/images/iota.png' // #106 i106b — both, AND group 'logos'
const GROUPED_PAGE_ONLY_BRANDING = '/images/delta.png' // #100 i100a — page only, group 'sports'
const HOME_ONLY_BRANDING = '/images/kappa.png' // #101 i101a — home only, ungrouped parent
const GROUPED_HOME_BRANDING = '/images/lambda.png' // #100 i100b — on home, group 'sports'

/** Read lazily: `rest`/`local` are only populated in `beforeAll`. */
const twins: Record<string, () => Record<string, string>> = {
  REST: () => rest,
  'Local API': () => local,
}

for (const [twinName, output] of Object.entries(twins)) {
  describe(`a two-placement photograph reaches both arrays — ${twinName} twin (R46)`, () => {
    const webApps = () => JSON.parse(output()['sections/web-apps.json'])
    const branding = () => JSON.parse(output()['sections/branding.json'])

    // Regression: `projByKey` filtered on exact equality (`p.placement ===
    // placement`), so a row saved as 'both' — the admin's "Ambas" — matched
    // neither 'home' nor 'page' and was emitted into NEITHER array, while
    // categories.json (`page || both`) still listed it. Live in production:
    // projects#581 / 1.jpg was invisible on the photography page and its home
    // preview, both of which read sections/photography.json.
    it("emits a 'both' row into the home array AND the page array", () => {
      const { home, page } = webApps()
      expect(home.projects.map((p: any) => p.image)).toContain(BOTH_WEBAPPS)
      expect(page.projects.map((p: any) => p.image)).toContain(BOTH_WEBAPPS)
    })

    // Regression: the already-correct filter must not be broken while fixing
    // the other two. categories.json is the one place `both` has always worked.
    it("keeps the 'both' row in categories.json", () => {
      const cat = JSON.parse(output()['categories.json']).categories.find(
        (c: any) => c.slug === 'web-apps',
      )
      expect(cat.projects.map((p: any) => p.image)).toContain(BOTH_WEBAPPS)
    })

    // Regression: the cheapest wrong fix is to widen both filters until every
    // row matches every placement. That would pass the assertion above and
    // silently duplicate the entire catalogue onto the home page. These two
    // tests are the reason the fix has to be a disjunct on 'both' specifically.
    it("leaves 'home'-only rows out of the page array", () => {
      const { home, page } = webApps()
      const homeImages = home.projects.map((p: any) => p.image)
      const pageImages = page.projects.map((p: any) => p.image)
      for (const img of HOME_ONLY_WEBAPPS) {
        expect(homeImages).toContain(img)
        expect(pageImages).not.toContain(img)
      }
    })

    it("leaves 'page'-only rows out of the home array", () => {
      const { home, page } = webApps()
      expect(page.projects.map((p: any) => p.image)).toContain(PAGE_ONLY_WEBAPPS)
      expect(home.projects.map((p: any) => p.image)).not.toContain(PAGE_ONLY_WEBAPPS)
    })

    // Regression: widening the PLACEMENT test must not leak into the group
    // clause. A grouped two-placement photograph belongs to its own branding
    // page slot and to no other.
    it('respects the group clause for a grouped two-placement photograph', () => {
      const { page } = branding()
      expect(page.logoProjects.map((p: any) => p.src)).toContain(GROUPED_BOTH_BRANDING)
      expect(page.sportsProjects.map((p: any) => p.src)).not.toContain(GROUPED_BOTH_BRANDING)
      expect(page.adrianaMunozProjects.map((p: any) => p.src)).not.toContain(GROUPED_BOTH_BRANDING)
    })

    // ⚠️ THIS ASSERTION CHANGED SIGN IN R23b-ii, deliberately. R46 asserted the
    // OPPOSITE — that a grouped 'both' row stays OUT of branding's `home.images`
    // — because `projByKey('branding', 'home')` matched `!p.group` and branding's
    // home ROWS carried no group. After R23b-i those photographs hang off grouped
    // parents (`wodfest-1.png` belongs to a `sports` project), so that filter now
    // matches nothing and the array would emit []. Shape C is ungrouped-blind on
    // purpose (group mode 'any', r23-target-model.md §4), and this is the
    // assertion that says so out loud instead of letting an empty array pass as
    // "no regression". The anti-widening property R46 was protecting still has a
    // home — in the test directly above, where the group clause still exists.
    it('puts every branding photograph flagged for home into home.images, grouped or not', () => {
      const { home } = branding()
      const srcs = home.images.map((i: any) => i.src)
      expect(srcs).toContain(GROUPED_HOME_BRANDING) // grouped parent, on home
      expect(srcs).toContain(GROUPED_BOTH_BRANDING) // grouped parent, on home AND page
      expect(srcs).toContain(HOME_ONLY_BRANDING) // ungrouped parent, home only
      // …and nothing that is not flagged for home, which is what rules out
      // "fixed it by matching everything".
      expect(srcs).not.toContain(GROUPED_PAGE_ONLY_BRANDING)
    })

    // The fisio-equina.png shape: on home, in no page array at all. It is the row
    // that disproves parent-level placement (§3.2), so it is worth pinning that
    // both halves of the flag are honoured independently.
    it('keeps a home-only photograph out of every branding page group', () => {
      const { home, page } = branding()
      expect(home.images.map((i: any) => i.src)).toContain(HOME_ONLY_BRANDING)
      for (const key of ['sportsProjects', 'adrianaMunozProjects', 'anaGraceProjects', 'logoProjects']) {
        expect(page[key].map((p: any) => p.src)).not.toContain(HOME_ONLY_BRANDING)
      }
    })

    // Regression: `resolveGalleryCards` — the second, independent filter, one
    // per twin (the roadmap recorded it as existing only on the Local side) —
    // carried the same exact-equality test, so a 'both' row also vanished from
    // every CategoryGallery block on a Página.
    it("resolves a 'both' row into a CategoryGallery block", () => {
      const cards = JSON.parse(output()['pages.json'])
        .pages.flatMap((p: any) => p.blocks)
        .filter((b: any) => b.blockType === 'categoryGallery')
        .flatMap((b: any) => b.content.projects ?? [])
      // Vacuity floor: an empty card set would satisfy nothing below.
      expect(cards.length).toBeGreaterThan(0)
      expect(cards.map((c: any) => c.src)).toContain(BOTH_WEBAPPS)
    })
  })

  // -------------------------------------------------------------------------
  // R23b-ii — what the emitters now read, and what they must keep ignoring.
  //
  // Everything here is invisible to the byte comparison above, for the reason
  // R46 wrote down: both twins are hand-mirrored, so both can be wrong in the
  // same way and still agree. A test that only checks agreement cannot catch a
  // shared mistake.
  // -------------------------------------------------------------------------
  describe(`reads images[], not the leftover rows — ${twinName} twin (R23b-ii)`, () => {
    const webApps = () => JSON.parse(output()['sections/web-apps.json'])
    const branding = () => JSON.parse(output()['sections/branding.json'])
    const fotografia = () => JSON.parse(output()['sections/photography.json'])
    const galleryBlocks = () =>
      JSON.parse(output()['pages.json'])
        .pages.flatMap((p: any) => p.blocks)
        .filter((b: any) => b.blockType === 'categoryGallery')

    // THE ONE THAT PROTECTS THE DEFERRED CLEANUP. R23b-iii deletes the 17
    // redundant `projects` rows, deliberately after the promotion — so between
    // now and then, production holds parents AND the rows they were merged from,
    // every one of them a real `type: 'image'` row with a real media and a real
    // placement. Nothing but reading `images[]` excludes them. An emitter that
    // still reaches for a top-level `p.image` publishes them into the live site,
    // and both twins would do it identically, so only this can see it.
    it('emits nothing from a project row that has no images[]', () => {
      for (const [rel, text] of Object.entries(output())) {
        expect(text, `content/${rel} published a leftover row`).not.toContain('LEFTOVER')
      }
    })

    // §2.2 — home and page carry FOUR distinct strings for one photograph, not
    // one string shown twice. `theta.png` is on both, with different text on
    // each side, so a twin that read `alt`/`categoryLabel` for the home card
    // (which is what r23-target-model.md §4 literally says) fails here.
    it('publishes home text on home cards and page text on page cards', () => {
      const { home, page } = webApps()
      const homeCard = home.projects.find((p: any) => p.image === BOTH_WEBAPPS)
      const pageCard = page.projects.find((p: any) => p.image === BOTH_WEBAPPS)
      expect(homeCard.title.es).toBe('Web 2 inicio')
      expect(homeCard.category.es).toBe('Web inicio')
      expect(pageCard.alt.es).toBe('Web 2')
      expect(pageCard.category.es).toBe('Web')
    })

    // The 13 real home cards publish `{"es":"","en":""}` because their home rows
    // carried no alt, while `alt` holds the page text. `homeAlt ?? alt` would
    // rewrite every one of them, and it is the obvious "tidy-up" to make.
    //
    // `theta.png` is owned by one image, and that image has a REAL `alt` and no
    // `homeAlt` — so the two arms give different strings and this can fail. An
    // earlier draft asserted on a photograph with neither, where the fallback and
    // the correct answer are both `''`; it passed with the fallback in place.
    it('leaves a home card alt empty rather than falling back to the page alt', () => {
      const homeBlock = galleryBlocks().find((b: any) => b.content.layoutVariant === 'web-apps:home')
      const homeCard = homeBlock.content.projects.find((c: any) => c.src === BOTH_WEBAPPS)
      expect(homeCard.alt).toEqual({ es: '', en: '' })
      expect(homeCard.title.es).toBe('Web 2 inicio')
      // …and the page card for the same photograph still publishes it.
      expect(webApps().page.projects.find((p: any) => p.image === BOTH_WEBAPPS).alt.es).toBe('Web 2')
    })

    // Shape C is a home array too, and branding is the one place `homeAlt` is
    // non-empty — so reading `alt` there is invisible on the real data (§2.2 says
    // the two strings match throughout branding) and caught only here.
    it('reads homeAlt for branding home.images, not the page alt', () => {
      const entry = branding().home.images.find((i: any) => i.src === GROUPED_HOME_BRANDING)
      expect(entry.alt.es).toBe('Marca B') // homeAlt
      const pageCard = branding().page.sportsProjects.find((p: any) => p.src === GROUPED_HOME_BRANDING)
      expect(pageCard.alt.es).toBe('Deporte 2') // alt — the same photograph, different text
    })

    // Two silent failures at once: sorting the home set by `order`, and
    // publishing `order` as the home card's `id`. The fixture's home and page
    // sequences disagree on BOTH, so either mistake changes this array.
    it('orders and numbers home cards by homeOrder, not by order', () => {
      const homeBlock = galleryBlocks().find((b: any) => b.content.layoutVariant === 'web-apps:home')
      // by homeOrder: theta(0) alpha(1) beta(2).  by order: alpha(1) beta(2) theta(3).
      expect(homeBlock.content.projects.map((c: any) => c.src)).toEqual([
        BOTH_WEBAPPS,
        '/images/alpha.png',
        '/images/beta.jpg',
      ])
      expect(homeBlock.content.projects.map((c: any) => c.id)).toEqual([0, 1, 2])
      // The page array of the same categoría still runs on `order`.
      expect(webApps().page.projects.map((p: any) => p.image)).toEqual([
        '/images/alpha.png',
        BOTH_WEBAPPS,
        PAGE_ONLY_WEBAPPS,
      ])
    })

    // The gift-box-vinte.png shape in a `sections/*.json` home array (shape A),
    // which publishes no id — so only the ORDER can catch it here. `mu.png` is
    // last on the page (order 9) and first on home (homeOrder 2 vs 3).
    it('orders a sections home array by homeOrder too', () => {
      const { home, page } = fotografia()
      expect(home.projects.map((p: any) => p.image)).toEqual(['/images/mu.png', '/images/epsilon.jpg'])
      expect(page.projects.map((p: any) => p.image)).toEqual(['/images/zeta.png', '/images/mu.png'])
    })

    // A group is a section of the CATEGORY PAGE. Emitting `parent.group` on home
    // cards is the single thing that moved when this change was first run against
    // the live dev database — four of branding's five home cards gained the key.
    it('never publishes `group` on a home card', () => {
      for (const b of galleryBlocks()) {
        if (!String(b.content.layoutVariant).endsWith(':home')) continue
        for (const c of b.content.projects) expect(c.group).toBeUndefined()
      }
      // …and still publishes it on the page block that consumes it.
      const beauty = galleryBlocks().find((b: any) => b.content.layoutVariant === 'branding:beauty')
      expect(beauty.content.projects.every((c: any) => c.group)).toBe(true)
    })

    // `placement: 'all'` is admin-reachable and used by no real Página, so it is
    // exactly the path that drifts. One card per photograph — not one per row,
    // which is what the old model produced for a two-placement photograph.
    it("emits one card per photograph for a 'all'-placement block", () => {
      const all = galleryBlocks().find((b: any) => b.content.projects?.some((c: any) => c.src === BOTH_WEBAPPS) && b.content.projects.length === 4)
      expect(all, "the 'all' block should hold all four web-apps photographs").toBeTruthy()
      const srcs = all.content.projects.map((c: any) => c.src)
      expect(new Set(srcs).size).toBe(srcs.length)
      expect(srcs).toContain(BOTH_WEBAPPS)
      expect(srcs).toContain(PAGE_ONLY_WEBAPPS)
      for (const img of HOME_ONLY_WEBAPPS) expect(srcs).toContain(img)
    })
  })
}
