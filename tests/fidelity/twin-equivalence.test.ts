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
