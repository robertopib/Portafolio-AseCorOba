/**
 * Fidelity-gate layer (standard §2, risk 2) — R13a's regression suite.
 *
 * The bug: the two content emitters' "fidelity gate" was ~90% decorative.
 * `cms/src/scripts/export-content.ts` wrote `pages.json`, `categories.json` and
 * `case-studies.json` straight into `content/` with a hardcoded
 * `report[…] = { match: true, diffs: [] }`, and `site.json` was not in the report
 * at all — 598,916 of 664,086 committed content bytes (90.2%) reported as
 * matching without ever being compared. Both twins then exited 0 regardless, and
 * `export-content.ts`'s `process.exit(0)` sat outside its try/catch so even a
 * thrown exception was a clean exit.
 *
 * This suite pins the repaired verdict logic. It is deliberately PURE: no Payload,
 * no database, no network, no fs — standard §3 forbids a CI test that needs any of
 * them. Proving the two emitters agree with each other is R13b, in
 * twin-equivalence.test.ts.
 *
 * Updated 2026-08-07 (R13b) on two points:
 *
 *  1. The Local twin IS importable now. Its reconstruction moved out of the CLI
 *     into `cms/src/scripts/export-emit.ts`, which imports no `payload`, so the
 *     source-text checks below read that file where the logic went and
 *     `export-content.ts` where the CLI behaviour stayed. Source text is still
 *     the right tool for these particular invariants — "this file contains no
 *     write into CONTENT_DIR" is a property of the text, not of one run.
 *  2. The gate helpers that `export-emit.ts` MIRRORS by hand from
 *     `scripts/lib/fidelity.mjs` are exported, so the last describe block drives
 *     both implementations over the same inputs. The duplication is still there
 *     (cms/ is a separate Vercel root; a `../../../scripts/` import would break
 *     `next build`), but it is no longer merely asserted to be a mirror.
 *
 * Every source-text parse below asserts that it parsed something, or the check
 * passes vacuously the first time someone reformats the file.
 */
import { describe, expect, it } from 'vitest'
import {
  deepDiff,
  summarizeFidelity,
  formatFidelityFailure,
} from '../../scripts/lib/fidelity.mjs'
import {
  deepDiff as cmsDeepDiff,
  summarizeFidelity as cmsSummarizeFidelity,
  formatFidelityFailure as cmsFormatFidelityFailure,
} from '@cms-export-emit'
import cliSource from '../../cms/src/scripts/export-content.ts?raw'
import exportSource from '../../cms/src/scripts/export-emit.ts?raw'
import fetchSource from '../../scripts/fetch-content.mjs?raw'

describe('deepDiff', () => {
  // Regression: the gate must report a mismatch for content that differs — before
  // R13a, 90.2% of content bytes were declared matching without being compared.
  it('reports a divergence, naming the JSON path that diverged', () => {
    const committed = { hero: { title: { es: 'Hola', en: 'Hello' } } }
    const reconstructed = { hero: { title: { es: 'Hola', en: 'Hi' } } }

    const diffs = deepDiff(reconstructed, committed)

    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toContain('.hero.title.en')
    expect(diffs[0]).toContain('"Hi"')
    expect(diffs[0]).toContain('"Hello"')
  })

  it('returns nothing for identical content', () => {
    const value = { pages: [{ slug: 'home', blocks: [{ blockType: 'hero' }] }] }
    expect(deepDiff(structuredClone(value), value)).toEqual([])
  })

  it('reports an added key as extra and a removed key as missing', () => {
    // This is the shape of the known pages.json staleness (R13b): the exporters
    // emit studioLabelVisible/roleLabelVisible that the committed file lacks.
    const added = deepDiff({ a: 1, studioLabelVisible: true }, { a: 1 })
    expect(added).toHaveLength(1)
    expect(added[0]).toContain('extra in reconstructed')
    expect(added[0]).toContain('.studioLabelVisible')

    const removed = deepDiff({ a: 1 }, { a: 1, roleLabelVisible: true })
    expect(removed).toHaveLength(1)
    expect(removed[0]).toContain('missing in reconstructed')
  })

  it('is order-SENSITIVE for arrays — block order is meaningful content', () => {
    const diffs = deepDiff(['b', 'a'], ['a', 'b'])
    expect(diffs).toHaveLength(2)
    expect(diffs[0]).toContain('[0]')
  })

  it('is order-INSENSITIVE for object keys', () => {
    expect(deepDiff({ es: 'x', en: 'y' }, { en: 'y', es: 'x' })).toEqual([])
  })

  it('reports a length change and still diffs the overlapping elements', () => {
    const diffs = deepDiff([{ id: 1 }], [{ id: 2 }, { id: 3 }])
    expect(diffs[0]).toContain('array length 1 vs 2')
    expect(diffs.some((d) => d.includes('[0].id'))).toBe(true)
  })
})

describe('summarizeFidelity', () => {
  it('passes only when every file is proven identical', () => {
    const summary = summarizeFidelity({
      'home.json': { match: true, diffs: [] },
      'site.json': { match: true, diffs: [] },
    })
    expect(summary).toMatchObject({ allMatch: true, mismatched: [], unverified: [] })
  })

  // Regression: `allMatch` was computed and then discarded — export-content.ts
  // wrote it to /tmp/fidelity-report.json and nothing read it, so a real
  // divergence still exited 0.
  it('fails, and names the file, when any file diverges', () => {
    const summary = summarizeFidelity({
      'home.json': { match: true, diffs: [] },
      'pages.json': { match: false, diffs: ['.pages[0].blocks[2].blockType: "hero" !== "heroLegacy"'] },
    })
    expect(summary.allMatch).toBe(false)
    expect(summary.mismatched).toEqual(['pages.json'])
  })

  // Regression: `match: null` must not read as a pass. fetch-content.mjs assigns
  // it when a file has no committed version at git HEAD; treating that as
  // "nothing to worry about" is how an uncompared file becomes an invisible one.
  it('treats an uncompared file as a failure, not a pass', () => {
    const summary = summarizeFidelity({
      'home.json': { match: true, diffs: [] },
      'case-studies.json': { match: null, note: 'no committed HEAD version to compare' },
    })
    expect(summary.allMatch).toBe(false)
    expect(summary.unverified).toEqual(['case-studies.json'])
  })

  // Regression: site.json was EMITTED but absent from `report` entirely — not even
  // a fabricated `match: true` — so the report was silently incomplete and
  // `Object.values(report).every(...)` never looked at it.
  it('fails when an emitted file is missing from the report', () => {
    const summary = summarizeFidelity(
      { 'home.json': { match: true, diffs: [] } },
      ['home.json', 'site.json'],
    )
    expect(summary.allMatch).toBe(false)
    expect(summary.missingFromReport).toEqual(['site.json'])
  })
})

describe('formatFidelityFailure', () => {
  // Regression: the old gate logged `allMatch=false` and nothing else. A gate that
  // fails without saying where costs more than it saves.
  it('names the file and the diverging path, not just a boolean', () => {
    const message = formatFidelityFailure(
      {
        'pages.json': {
          match: false,
          diffs: ['.pages[0].blocks[2].content.title.es: "Inicio" !== "Home"'],
        },
      },
      { label: '[export-content]', reportPath: '/tmp/fidelity-report.json' },
    )
    expect(message).toContain('content/pages.json')
    expect(message).toContain('.pages[0].blocks[2].content.title.es')
    expect(message).toContain('"Inicio"')
    expect(message).toContain('/tmp/fidelity-report.json')
  })

  it('says how many diffs it elided rather than truncating silently', () => {
    const diffs = Array.from({ length: 20 }, (_, i) => `.pages[${i}]: a !== b`)
    const message = formatFidelityFailure(
      { 'pages.json': { match: false, diffs } },
      { label: '[export-content]', reportPath: '/tmp/r.json', maxDiffsPerFile: 3 },
    )
    expect(message).toContain('and 17 more')
  })

  it('reports uncompared and unreported files too', () => {
    const message = formatFidelityFailure(
      { 'site.json': { match: null, note: 'no committed HEAD version to compare' } },
      { label: '[fetch-content]', reportPath: '/tmp/r.json', expected: ['site.json', 'ui.json'] },
    )
    expect(message).toContain('content/site.json — NOT COMPARED')
    expect(message).toContain('content/ui.json — emitted but absent from the fidelity report')
  })
})

describe('the Local-API twin (source-text invariants)', () => {
  it('parsed files that look like the exporter and its CLI', () => {
    expect(exportSource.length).toBeGreaterThan(10_000)
    expect(exportSource).toContain('export const OUT_DIR')
    expect(cliSource).toContain("from './export-emit'")
  })

  // Regression (R13b): the reconstruction must stay importable from the root test
  // suite, which installs root dependencies only. A `payload` or `@payload-config`
  // import here would not resolve in the `tests` CI job, and the twin-equivalence
  // check would have to be deleted. `import type` is erased, so the type-only
  // reference to payload's BasePayload does not count — hence the negative lookahead.
  it('keeps the CMS-only imports in the CLI, not in the reconstruction', () => {
    const runtimeImports = [
      ...exportSource.matchAll(/^import\s+(?!type\b)[\s\S]*?from\s+'([^']+)'/gm),
    ].map((m) => m[1])
    expect(runtimeImports.length).toBeGreaterThan(0)
    expect(runtimeImports).toEqual(expect.arrayContaining(['./content-map']))
    expect(runtimeImports).not.toContain('payload')
    expect(runtimeImports).not.toContain('@payload-config')
    expect(runtimeImports).not.toContain('./dbGuard')
    // …and the CLI is where they went.
    expect(cliSource).toContain("from 'payload'")
    expect(cliSource).toContain("from './dbGuard'")
  })

  // Regression (R13b): the reconstruction must not exit the process. It used to
  // call process.exit(1) from inside main(), which a test cannot survive.
  it('leaves the exit code to the CLI', () => {
    expect(exportSource).not.toContain('process.exit')
    expect(cliSource).toContain('process.exit(1)')
  })

  // Regression: pages.json / categories.json / case-studies.json each carried
  // `report[…] = { match: true, diffs: [] }` — a fabricated pass for 90.2% of
  // content bytes.
  it('fabricates no fidelity result', () => {
    const fabricated = [...exportSource.matchAll(/report\[[^\]]+\]\s*=\s*\{\s*match:\s*true/g)]
    expect(fabricated).toEqual([])
  })

  // Regression (R16): the header claims "Does NOT modify the committed
  // content/*.json (source of truth)" while four writes did exactly that. Whoever
  // trusted the header and ran this against prod overwrote the source of truth.
  it('writes nothing into the committed content dir, so its header is true', () => {
    expect(cliSource).toContain('Does NOT modify the committed content/*.json')
    const contentWrites = [
      ...exportSource.matchAll(/writeFileSync\(\s*\n?\s*path\.join\(CONTENT_DIR/g),
      ...cliSource.matchAll(/writeFileSync\(\s*\n?\s*path\.join\(CONTENT_DIR/g),
    ]
    expect(contentWrites).toEqual([])
  })

  // Regression: `process.exit(0)` sat OUTSIDE the try/catch, so a thrown
  // exception was written to /tmp/export-error.json and then exited 0. The
  // try/catch now lives in the CLI, which is the only side that can exit.
  it('exits non-zero from its catch block', () => {
    const catchBlock = cliSource.slice(cliSource.lastIndexOf('} catch (err'))
    expect(catchBlock.length).toBeGreaterThan(50)
    expect(catchBlock).toContain('process.exit(1)')
  })
})

describe('fetch-content.mjs (source-text invariants)', () => {
  it('parsed a file that looks like the fetcher', () => {
    expect(fetchSource.length).toBeGreaterThan(10_000)
    expect(fetchSource).toContain('export async function main(')
  })

  // Regression (R13b): the CLI must only run when this file IS the process entry
  // point. `main().catch(...)` at module scope meant importing the module ran the
  // whole fetch — including the network — so no test could touch it.
  it('runs its CLI only when invoked directly', () => {
    expect(fetchSource).toContain('if (invokedDirectly) {')
    expect(fetchSource).toContain('path.resolve(process.argv[1]) === __filename')
  })

  // Regression: the fidelity path set `allMatch=false`, logged one line and
  // returned normally, so the script exited 0. The existing `exit(1)` at the
  // bottom only ever fired for an unhandled throw.
  // (R13b moved the exit out of main() and into the CLI, so the two halves are
  // asserted separately: main REPORTS the failure under the gate and returns
  // allMatch:false, and the CLI turns that into exit 1. Neither half alone is the
  // gate — that split is exactly how the pre-R13a decoy `exit(1)` fooled people.)
  it('exits non-zero on a mismatch in gate mode', () => {
    const gateBlock = fetchSource.slice(fetchSource.indexOf('  if (gate) {'))
    expect(gateBlock.slice(0, 120)).toContain('log.error(detail)')
    expect(fetchSource).toContain('if (GATE && !allMatch) process.exit(1)')
  })

  // The gate reads the same verdict logic this suite tests, rather than a second
  // inline copy of it.
  it('imports the shared fidelity primitives', () => {
    expect(fetchSource).toContain("from './lib/fidelity.mjs'")
    expect(fetchSource).toContain('summarizeFidelity(')
  })
})

/**
 * The gate helpers exist TWICE: `scripts/lib/fidelity.mjs`, which the REST twin
 * imports, and a hand-written copy inside `cms/src/scripts/export-emit.ts`.
 *
 * R13b was scoped to collapse that. It deliberately did not: `cms/` is a separate
 * pnpm project with its own Vercel ROOT DIRECTORY, so `../../../scripts/…` does
 * not exist in the CMS deployment and any sharing scheme (vendoring with a
 * generated-file check, a published internal package, a build step) puts a code
 * generator in front of `next build`. A broken CMS deploy is far worse than a
 * duplicated 60-line helper.
 *
 * What it did instead is this block: drive BOTH implementations over the same
 * inputs and require identical results, so the mirror is verified rather than
 * asserted. Edit one side without the other and this goes red — which is the
 * actual risk the duplication carries.
 */
describe('the two fidelity-helper implementations agree', () => {
  const CASES: [string, unknown, unknown][] = [
    ['identical', { a: 1 }, { a: 1 }],
    ['changed leaf', { hero: { title: { es: 'Hola' } } }, { hero: { title: { es: 'Hi' } } }],
    ['extra key', { a: 1, studioLabelVisible: true }, { a: 1 }],
    ['missing key', { a: 1 }, { a: 1, roleLabelVisible: false }],
    ['array length', { xs: [1, 2, 3] }, { xs: [1, 2] }],
    ['array order (order-SENSITIVE)', { xs: [1, 2] }, { xs: [2, 1] }],
    ['type change', { a: '1' }, { a: 1 }],
    ['null vs missing', { a: null }, {}],
    ['nested arrays of objects', { xs: [{ b: [{ c: 1 }] }] }, { xs: [{ b: [{ c: 2 }] }] }],
  ]

  it.each(CASES)('deepDiff: %s', (_label, a, b) => {
    expect(cmsDeepDiff(a, b)).toEqual(deepDiff(a, b))
  })

  const REPORTS: [string, Record<string, { match: boolean | null; diffs?: string[]; note?: string }>, string[]][] = [
    ['all match', { 'a.json': { match: true } }, ['a.json']],
    ['a mismatch', { 'a.json': { match: false, diffs: ['.x'] } }, ['a.json']],
    ['unverified null', { 'a.json': { match: null, note: 'nothing to compare' } }, ['a.json']],
    ['missing from report', { 'a.json': { match: true } }, ['a.json', 'b.json']],
    ['empty report', {}, []],
    [
      'several at once',
      {
        'a.json': { match: true },
        'b.json': { match: false, diffs: ['.p', '.q'] },
        'c.json': { match: null },
      },
      ['a.json', 'b.json', 'c.json', 'd.json'],
    ],
  ]

  it.each(REPORTS)('summarizeFidelity: %s', (_label, files, expected) => {
    expect(cmsSummarizeFidelity(files, expected)).toEqual(summarizeFidelity(files, expected))
  })

  it.each(REPORTS)('formatFidelityFailure: %s', (_label, files, expected) => {
    const opts = { label: '[x]', reportPath: '/tmp/r.json', expected }
    expect(cmsFormatFidelityFailure(files, opts)).toBe(formatFidelityFailure(files, opts))
  })

  it('truncates long diff lists the same way on both sides', () => {
    const files = { 'a.json': { match: false, diffs: Array.from({ length: 30 }, (_, i) => `.p${i}`) } }
    const opts = { label: '[x]', reportPath: '/tmp/r.json', expected: ['a.json'], maxDiffsPerFile: 4 }
    expect(cmsFormatFidelityFailure(files, opts)).toBe(formatFidelityFailure(files, opts))
    expect(formatFidelityFailure(files, opts)).toContain('and 26 more')
  })
})
