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
 * them. Proving the two emitters agree with each other is R13b and is not here.
 *
 * `export-content.ts` cannot be imported (cms/ is a separate project with its own
 * lockfile, and its import chain reaches `payload`), so the invariants that only
 * exist on that side are asserted against its SOURCE TEXT, in the same way and for
 * the same reasons as tests/invariants/media-admin-columns.test.ts. Every parse
 * below asserts that it parsed something, or the check passes vacuously the first
 * time someone reformats the file.
 */
import { describe, expect, it } from 'vitest'
import {
  deepDiff,
  summarizeFidelity,
  formatFidelityFailure,
} from '../../scripts/lib/fidelity.mjs'
import exportSource from '../../cms/src/scripts/export-content.ts?raw'
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

describe('export-content.ts (source-text invariants — the twin we cannot import)', () => {
  it('parsed a file that looks like the exporter', () => {
    expect(exportSource.length).toBeGreaterThan(10_000)
    expect(exportSource).toContain('const OUT_DIR')
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
    expect(exportSource).toContain('Does NOT modify the committed content/*.json')
    const contentWrites = [...exportSource.matchAll(/writeFileSync\(\s*\n?\s*path\.join\(CONTENT_DIR/g)]
    expect(contentWrites).toEqual([])
  })

  // Regression: `process.exit(0)` sat OUTSIDE the try/catch, so a thrown
  // exception was written to /tmp/export-error.json and then exited 0.
  it('exits non-zero from its catch block', () => {
    const catchBlock = exportSource.slice(exportSource.lastIndexOf('} catch (err'))
    expect(catchBlock.length).toBeGreaterThan(50)
    expect(catchBlock).toContain('process.exit(1)')
  })
})

describe('fetch-content.mjs (source-text invariants)', () => {
  it('parsed a file that looks like the fetcher', () => {
    expect(fetchSource.length).toBeGreaterThan(10_000)
    expect(fetchSource).toContain('async function main()')
  })

  // Regression: the fidelity path set `allMatch=false`, logged one line and
  // returned normally, so the script exited 0. The existing `exit(1)` at the
  // bottom only ever fired for an unhandled throw.
  it('exits non-zero on a mismatch in gate mode', () => {
    expect(fetchSource).toContain('if (GATE) {')
    const gateBlock = fetchSource.slice(fetchSource.indexOf('  if (GATE) {'))
    expect(gateBlock.slice(0, 120)).toContain('process.exit(1)')
  })

  // The gate reads the same verdict logic this suite tests, rather than a second
  // inline copy of it.
  it('imports the shared fidelity primitives', () => {
    expect(fetchSource).toContain("from './lib/fidelity.mjs'")
    expect(fetchSource).toContain('summarizeFidelity(')
  })
})
