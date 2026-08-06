/**
 * FIDELITY GATE PRIMITIVES — shared by the content twins' gates.
 *
 * `scripts/fetch-content.mjs` (REST) and `cms/src/scripts/export-content.ts`
 * (Payload Local API) are hand-maintained line-for-line mirrors that must emit
 * byte-identical JSON. Each carries a "fidelity gate" that deep-diffs what it
 * reconstructed against the committed content/*.json. Before R13a those gates
 * could not fail: 90.2% of content bytes were reported as matching without ever
 * being compared, and a mismatch exited 0 on both sides.
 *
 * These three functions are the part of the gate worth testing on its own:
 * pure, offline, no fs, no CMS, no DB. `tests/fidelity/fidelity-gate.test.ts`
 * pins them.
 *
 * ONLY the REST twin imports this module. `export-content.ts` lives in cms/,
 * which is a SEPARATE pnpm project with its own lockfile and its own Vercel
 * root directory — a `../../../scripts/` import would not resolve in the CMS
 * deployment and would break `next build`. It therefore keeps a mirrored copy,
 * exactly as it already mirrors `loc()`, the SECTION_SPECS and the reconstruction
 * logic itself. Collapsing that duplication is R13b's job, not this module's.
 * If you edit anything here, mirror it there in the same commit.
 */

/**
 * Deep-compare two reconstructed JSON values.
 *
 * Order-INSENSITIVE for object keys, order-SENSITIVE for arrays (array order is
 * meaningful in every content file — it is block order, project order, nav order).
 * Returns one human-readable line per divergence, each prefixed with the JSON
 * path that diverged, so a gate failure says WHERE and not just THAT.
 *
 * @param {unknown} a reconstructed value
 * @param {unknown} b committed value
 * @param {string} pathStr JSON path accumulated so far (internal)
 * @returns {string[]} one line per difference; empty means identical
 */
export function deepDiff(a, b, pathStr = '') {
  const diffs = []
  const ta = typeof a
  const tb = typeof b
  const isArrA = Array.isArray(a)
  const isArrB = Array.isArray(b)

  if (isArrA || isArrB) {
    if (!isArrA || !isArrB) {
      diffs.push(`${pathStr}: array vs non-array`)
      return diffs
    }
    if (a.length !== b.length) diffs.push(`${pathStr}: array length ${a.length} vs ${b.length}`)
    const n = Math.min(a.length, b.length)
    for (let i = 0; i < n; i++) diffs.push(...deepDiff(a[i], b[i], `${pathStr}[${i}]`))
    return diffs
  }
  if (a !== null && b !== null && ta === 'object' && tb === 'object') {
    const all = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of all) {
      if (!(k in a)) { diffs.push(`${pathStr}.${k}: missing in reconstructed (orig=${JSON.stringify(b[k])})`); continue }
      if (!(k in b)) { diffs.push(`${pathStr}.${k}: extra in reconstructed (recon=${JSON.stringify(a[k])})`); continue }
      diffs.push(...deepDiff(a[k], b[k], `${pathStr}.${k}`))
    }
    return diffs
  }
  if (a !== b) diffs.push(`${pathStr}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`)
  return diffs
}

/**
 * Reduce a per-file report to a verdict.
 *
 * `match: true` is the ONLY passing value. Anything else — `false`, `null`
 * ("there was no committed file to compare against"), or a file the emitter
 * forgot to report at all — counts as unproven and fails the gate. That is the
 * whole point of R13a: before it, `pages.json`, `categories.json` and
 * `case-studies.json` carried a hardcoded `match: true` and `site.json` was
 * absent from the report entirely, so "allMatch" meant nothing.
 *
 * @param {Record<string, { match: boolean | null, diffs?: string[], note?: string }>} files
 * @param {string[]} [expected] every relPath the emitter wrote; any not present
 *   in `files` is reported as `missingFromReport` (a fabricated-report guard)
 * @returns {{ allMatch: boolean, mismatched: string[], unverified: string[], missingFromReport: string[] }}
 */
export function summarizeFidelity(files, expected = []) {
  const mismatched = []
  const unverified = []
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
 * Render a gate failure a human can act on without opening the JSON report.
 *
 * Follows the house style of `scripts/ci/check-lockfiles.mjs`: collect
 * everything, then print every problem with the file it is in — never throw on
 * the first one. Diffs are truncated per file (a single renamed key in
 * pages.json can produce thousands of lines) with an explicit count of what was
 * elided, because a silently-cut list reads as "that was all of it".
 *
 * @param {Record<string, { match: boolean | null, diffs?: string[], note?: string }>} files
 * @param {{ label: string, reportPath: string, expected?: string[], maxDiffsPerFile?: number }} opts
 * @returns {string} multi-line message, no trailing newline
 */
export function formatFidelityFailure(files, opts) {
  const { label, reportPath, expected = [], maxDiffsPerFile = 12 } = opts
  const { mismatched, unverified, missingFromReport } = summarizeFidelity(files, expected)
  const out = []

  out.push(`❌ ${label}: FIDELITY MISMATCH — the reconstruction does not match the committed content.`)

  for (const rel of mismatched) {
    const diffs = files[rel].diffs || []
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
    `  This means the two content emitters and the committed content/*.json no longer agree.`,
    `  Do NOT commit regenerated content to make this green — find which side changed first.`,
  )
  return out.join('\n')
}
