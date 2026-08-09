/**
 * Fidelity-gate layer (standard §2, risk 2) — R28's regression suite.
 *
 * THE BUG. R13a's whole value is the MESSAGE, not the exit code: when the two
 * content emitters diverge, the gate prints which file and which JSON path
 * disagree. R13b found the message can vanish. `console.error(report)` followed
 * immediately by `process.exit(1)` discards whatever the stream has merely
 * queued, and on a pipe everything past the first 64 KiB buffer is queued.
 * GitHub Actions captures job output through a pipe.
 *
 * THE TRAP THIS SUITE IS BUILT AROUND. A regression test that asserts the exit
 * code reproduces the bug it is meant to catch — the exit code was ALWAYS right;
 * the output was lost. So every test here counts DELIVERED BYTES through a real
 * pipe, at a payload comfortably over the buffer boundary. A test driven with a
 * small message proves nothing: 55 bytes survive unfixed, every time.
 *
 * ── What was measured, macOS / Node 22, 200,000-byte payload, stderr ─────────
 *
 *   writer                        file (2> log)   pipe (2>&1 | …)
 *   console.error + exit(1)         200,001         65,536      the bug
 *   bare fs.writeSync, cold fd      200,001        200,001      looks fixed…
 *   bare fs.writeSync, warm fd      200,001         65,536      …is not (see below)
 *   writeAllSync (the fix)          200,001        200,001
 *
 * Files were never affected — POSIX file writes are synchronous. It is pipes.
 *
 * TWO FINDINGS WORTH NOT RELEARNING, both pinned by tests below:
 *
 *  1. A BARE `fs.writeSync` IS NOT THE FIX. It delivers everything only while the
 *     fd is still blocking, where POSIX `write()` to a pipe returns only after
 *     every byte lands. libuv flips the fd to non-blocking as soon as Node
 *     instantiates `process.stderr` — and it takes almost nothing to get there:
 *     a script importing only `node:fs` delivered all 200,000 bytes, while adding
 *     `import { execPath } from 'node:process'` and touching nothing else dropped
 *     it to 65,536. Pulling a named export off the builtin reads the
 *     `process.stdout`/`stderr` getters. So every real script is already in the
 *     truncating state, and verifying the naive fix in a bare scratch file is
 *     precisely how it would have shipped looking green.
 *
 *  2. THE "ZERO-BYTE LOG" R13b SAW IS REAL, and it is this same bug one step
 *     worse. What survives is one pipe buffer's worth in TOTAL, shared with
 *     whatever the script printed earlier. If that earlier output already filled
 *     the buffer and the reader has not drained it, the report's first `write()`
 *     gets EAGAIN, the whole message is queued, and `process.exit` drops ALL of
 *     it — zero bytes of report, not 64 KiB. Measured: 64 KiB of prior output
 *     then a 200,000-byte report gave report=0 in 5/5 runs against a reader that
 *     stalled 300 ms, and in 9/20 runs against a prompt one; with 8 KiB of prior
 *     output the report got exactly 65,536 − 8,192 = 57,344 bytes. That timing
 *     dependence is why R13b saw it "twice in ~12 runs". Same fix covers it.
 */
import { spawnSync } from 'node:child_process'
import { execPath } from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import fetchSource from '../../scripts/fetch-content.mjs?raw'
import cliSource from '../../cms/src/scripts/export-content.ts?raw'
import rootWriter from '../../scripts/lib/write-sync.mjs?raw'
import cmsWriter from '../../cms/src/scripts/write-sync.ts?raw'

const PROBE = fileURLToPath(new URL('./exit-flush-probe.mjs', import.meta.url))

/**
 * Comfortably over one 64 KiB pipe buffer. Not arbitrary: the gate can genuinely
 * produce a message this size, because scripts/lib/fidelity.mjs embeds
 * `JSON.stringify(value)` in a diff line with no truncation — one divergence at a
 * top-level key of content/pages.json is a single line of over 500 KB.
 */
const PAYLOAD = 200_000

/** `stdio: 'pipe'` is a pipe by definition, which is the whole point. */
function runProbe(args: string[]) {
  const result = spawnSync(execPath, [PROBE, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  })
  if (result.error) throw result.error
  // Guards against measuring a probe that crashed: a child that died on an
  // import error delivers 0 payload bytes and would read as "truncated".
  if (result.signal) throw new Error(`probe killed by ${result.signal}`)
  const stream = args.includes('--fd=1') ? result.stdout : result.stderr
  return {
    status: result.status,
    /** Bytes OF THE REPORT delivered — prefill bytes are 'F' and don't count. */
    report: stream.split('P').length - 1,
    stderr: result.stderr,
  }
}

describe('the gate report survives being piped (R28)', () => {
  // Regression: console.error(report) + process.exit(1) delivered only the first
  // 64 KiB of the report through a pipe — CI saw the exit code and no reason.
  it('delivers a 200,000-byte report through a pipe before process.exit(1)', () => {
    const { report, status } = runProbe(['sync', String(PAYLOAD), '1', '--fd=2'])

    expect(report).toBe(PAYLOAD)
    // Asserted second, and only alongside the byte count: this was correct even
    // when the bug was live. On its own it is the non-test the standard warns of.
    expect(status).toBe(1)
  })

  // Regression: a bare fs.writeSync delivers everything only on a blocking fd; in
  // the real scripts an earlier console call has already made it non-blocking.
  it('delivers it once the fd is non-blocking, where a bare writeSync truncates', () => {
    const { report, status } = runProbe(['sync', String(PAYLOAD), '1', '--fd=2', '--warm'])

    expect(report).toBe(PAYLOAD)
    expect(status).toBe(1)
  })

  // Regression: export-content.ts's FIDELITY_GATE=0 branch prints the same full
  // report and does NOT exit there — it falls through to the unconditional
  // process.exit(0) at the end of the file, which truncates identically at exit 0.
  it('delivers a report on stdout before an exit(0)', () => {
    const { report, status } = runProbe(['sync', String(PAYLOAD), '0', '--fd=1'])

    expect(report).toBe(PAYLOAD)
    expect(status).toBe(0)
  })

  // Regression: R13b's zero-byte log — with the buffer already full of earlier
  // output, the unfixed writer delivered NONE of the report. See finding 2 above.
  it('delivers the whole report even when earlier output already filled the buffer', () => {
    const { report, status } = runProbe([
      'sync',
      String(PAYLOAD),
      '1',
      '--fd=2',
      '--prefill=65536',
    ])

    expect(report).toBe(PAYLOAD)
    expect(status).toBe(1)
  })
})

/**
 * Vacuity guards. Without these the assertions above could quietly become
 * tautologies — if the unfixed shapes stopped losing bytes, every test in this
 * file would pass whether or not the fix was still there, and nobody would know.
 *
 * These are the one place in the suite that asserts a defect still exists. If one
 * goes red, do not "fix" it: it means Node changed, and the right response is to
 * re-measure and decide whether write-sync.mjs is still earning its keep.
 */
describe('the shapes the fix rejects still lose bytes', () => {
  it('console.error + process.exit(1) truncates, with the exit code intact', () => {
    const { report, status } = runProbe(['console', String(PAYLOAD), '1', '--fd=2'])

    expect(report).toBeLessThan(PAYLOAD)
    expect(report).toBeGreaterThan(0)
    // The exit code is RIGHT and the message is gone. This is the whole bug, and
    // the reason a test asserting only `status` would have caught nothing.
    expect(status).toBe(1)
  })

  it('a bare fs.writeSync truncates too, once the fd is non-blocking', () => {
    // --warm is belt-and-braces here: the probe's own `import … from
    // 'node:process'` has already instantiated the stream, which is finding 1 and
    // the reason writeAllSync loops. A bare fs.writeSync only looks like a fix in
    // a scratch file that imports nothing but node:fs.
    const { report } = runProbe(['writeSync', String(PAYLOAD), '1', '--fd=2', '--warm'])

    expect(report).toBeLessThan(PAYLOAD)
  })

  it('loses the report entirely when earlier output already filled the buffer', () => {
    // Only `< PAYLOAD` is asserted, deliberately. The exact figure is 0 or 65,536
    // depending on whether the parent's read loop got scheduled between the two
    // writes (9/20 runs gave 0 locally) — the intermittency R13b hit. Asserting 0
    // would be a flaky test about scheduling; asserting loss is the stable claim.
    const { report } = runProbe(['console', String(PAYLOAD), '1', '--fd=2', '--prefill=65536'])

    expect(report).toBeLessThan(PAYLOAD)
  })
})

/**
 * Source-text checks, the house style of fidelity-gate.test.ts. The behavioural
 * tests above prove the WRITER works; these prove the two gates actually use it,
 * which is the part a later edit would undo. Comment lines are excluded so the
 * prose explaining the bug does not trip the check on itself — and each test
 * asserts the filter did real work, or it passes vacuously.
 */
describe('both gates write through the synchronous sink, not console', () => {
  const codeLines = (source: string) =>
    source
      .split('\n')
      .filter((line) => {
        const t = line.trim()
        return t !== '' && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
      })

  // Any mention of `console` as a value, not just `console.error(…)` calls.
  // Measured necessity: reverting fetch-content's `main({ log = syncConsole })`
  // default to `log = console` reintroduces the bug at the site that prints the
  // report, and a call-shaped pattern does not see it — the call is `log.error`.
  const consoleUses = (source: string) =>
    codeLines(source).filter((line) => /(^|[^.\w])console\b/.test(line))

  it.each([
    ['scripts/fetch-content.mjs', fetchSource, 'formatFidelityFailure'],
    ['cms/src/scripts/export-content.ts', cliSource, 'formatFidelityFailure'],
  ])('%s never touches console, and imports the sync writer', (_name, source, anchor) => {
    // Non-vacuity: the file was really read, really has code lines, and the
    // comment filter really is discarding console mentions rather than there
    // being none to find.
    expect(source).toContain(anchor)
    expect(codeLines(source).length).toBeGreaterThan(50)
    expect(source).toContain('console.')

    expect(consoleUses(source)).toEqual([])
    expect(source).toMatch(/from '\.[./]*(lib\/)?write-sync(\.mjs)?'/)
  })
})

/**
 * The two copies of the writer are hand-mirrored, for the same reason
 * export-emit.ts mirrors scripts/lib/fidelity.mjs rather than importing it: cms/
 * is a separate pnpm project with its own Vercel root, and a `../../../scripts/`
 * import would break `next build`. Nothing makes them agree automatically, so
 * this asserts it — which is what lets the behavioural tests above, which drive
 * only the root copy, say anything about the CMS one.
 */
describe('the CMS copy of the writer mirrors the root copy', () => {
  const normalize = (source: string) =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => line !== '')
      .join('\n')
      // The only permitted divergence: TypeScript annotations on the cms side.
      .replace(/:\s*(number|string|void|any|unknown\[\])(?=[,)\s])/g, '')

  it('is the same code once comments and type annotations are stripped', () => {
    const root = normalize(rootWriter)
    const cms = normalize(cmsWriter)

    // Non-vacuity: normalize() must not have eaten the implementation.
    expect(root).toContain('EAGAIN')
    expect(root).toContain('Atomics.wait')
    expect(root.length).toBeGreaterThan(400)

    expect(cms).toBe(root)
  })
})
