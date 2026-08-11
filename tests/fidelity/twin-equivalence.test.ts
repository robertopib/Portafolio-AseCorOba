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
// R46 — what `placement: 'both'` MEANS. See the header note: the equivalence
// assertions above cannot see this, because both twins were wrong in the same
// way. Every assertion runs against both twins, so a fix applied to one side
// only fails here as well as in the byte comparison.
// ---------------------------------------------------------------------------

/**
 * Emitted image paths for the fixture rows these assertions turn on. The two
 * `both` rows own their media outright (cms-state.ts media 8 and 9), so finding
 * one of these paths in an array proves WHICH row put it there. Asserting on a
 * shared image instead is how the first draft of the CategoryGallery test below
 * passed with the bug still in place.
 */
const BOTH_WEBAPPS = '/images/theta.png' // projects#113 — placement 'both', web-apps, ungrouped
const HOME_ONLY_WEBAPPS = ['/images/alpha.png', '/images/beta.jpg'] // #110, #111
const PAGE_ONLY_WEBAPPS = '/images/gamma.webp' // #112
const GROUPED_BOTH_BRANDING = '/images/iota.png' // projects#107 — 'both' AND group 'logos'

/** Read lazily: `rest`/`local` are only populated in `beforeAll`. */
const twins: Record<string, () => Record<string, string>> = {
  REST: () => rest,
  'Local API': () => local,
}

for (const [twinName, output] of Object.entries(twins)) {
  describe(`placement 'both' means both — ${twinName} twin (R46)`, () => {
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

    // Regression: `projByKey`'s group clause is `group ? p.group === group :
    // !p.group`, and widening the PLACEMENT test must not leak into it. A
    // grouped 'both' row belongs to its branding page slot; branding's
    // `home.images` is the ungrouped list and must not acquire it.
    it("respects the group clause for a grouped 'both' row", () => {
      const { home, page } = branding()
      expect(page.logoProjects.map((p: any) => p.src)).toContain(GROUPED_BOTH_BRANDING)
      expect(home.images.map((i: any) => i.src)).not.toContain(GROUPED_BOTH_BRANDING)
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
}
