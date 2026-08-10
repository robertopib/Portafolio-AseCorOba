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
 * ── And on the CI runner: ubuntu-latest / Node 24, same probe, 5 runs each ───
 *
 *   console.error, no prefill    200000,146176,146176,146176,146176
 *   console.error, warm          200000,146176,146176,146176,200000
 *   console.error, prefill 64K   200000,109632,200000,182720,109632
 *   bare fs.writeSync, warm      146176,146176,146176,200000,146176
 *   syncConsole (the fix)        200000,200000,200000,200000,200000
 *
 * Two things follow, and they shape how this file is written. **The fix is
 * deterministic on both platforms; the bug is not.** Linux loses a random amount
 * — and sometimes none at all — where macOS truncates at a clean 65,536 every
 * time. That is a second, independent reason R13b saw this intermittently. It
 * also means no assertion about the unfixed shape can be made about a SINGLE run
 * without being flaky on Linux, which is why the guard below samples.
 *
 * ── RE-MEASURED 2026-08-10 (R37), and the sampling conclusion above is WRONG ──
 *
 * The 5-run table above was read as "Linux loses bytes on ~4 runs in 5", i.e. a
 * per-RUN coin flip, and the guard below was sized against it. 2,700 fresh runs
 * say the rate is not 0.8 and the flip is not per-run.
 *
 * Runner: `ubuntu-24.04`, image `20260720.247.2`, Node 24.15.0, 4 vCPU, kernel
 * `6.17.0-1020-azure`. Hosts drawn: AMD EPYC 7763, EPYC 9V74, Xeon Platinum
 * 8573C, Xeon 6973P-C. `console.error` + `exit(1)`, 200,000 B, fd 2, no prefill:
 *
 *   where                              runs   lost   delivered-bytes histogram
 *   1 job, standalone parent            300    299   146176×298, 182720, 200000
 *   same job, inside vitest             200    200   146176×200
 *   12 parallel jobs × 100              1200   1199  146176×1199, 200000
 *   20 parallel jobs × 50               1000   1000  146176×999, 182720
 *   ── total, 33 job executions ─────── 2700   2698  p = 0.9993
 *
 *   macOS 15 / Node 22, same day        100    100   65536×99, 131072
 *
 * **So the bug is not gone — it reproduces essentially always.** The 146,176-byte
 * plateau is stable because the child's fd 2 is a `socketpair`, not a FIFO
 * (measured `isFIFO=false isSocket=true` on all 20 hosts), sized by
 * `net.core.wmem_default` = 212,992 on every host sampled. That is also why Linux
 * loses less than macOS's clean 65,536: the socket buffer is bigger than a pipe's.
 *
 * ── Which leaves the thing R37 actually had to explain ───────────────────────
 *
 * PR #23's `tests` job saw all TEN runs deliver in full and went red. Under an
 * i.i.d. per-run rate of 0.9993, ten consecutive full deliveries is a ~5e-32
 * event. It happened once in the 13 `tests` job executions since this file
 * landed. **Therefore the runs inside one job are not independent.** The
 * loss/no-loss behaviour is a property of the JOB — the host it lands on and how
 * loaded that host is — drawn once, then near-deterministic for every run within
 * it: 33 of 33 measured jobs sat at p ≈ 1, none straddled. It is a race between
 * the child's single `try_write` and the parent's reader, and on a host where the
 * parent is already draining, nothing ever queues.
 *
 * **The operational consequence, and the reason the guard below no longer gates:
 * SAMPLES buys nothing.** On a loss-mode job the guard is green at SAMPLES=1; on
 * a no-loss job it is red at SAMPLES=1000. Raising it does not lower the false
 * red — it only makes the suite slower. Measured directly: 100 evaluations of the
 * guard exactly as written (10 samples, pass iff one loses) across 20 hosts were
 * 100/100 green, and PR #23's job would have been 0/1 at any SAMPLES value.
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
import { env, execPath } from 'node:process'
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
    // Repeated, unlike the cases below, because "the fix is deterministic where
    // the bug is not" is half of what this file claims. One green run would not
    // distinguish the fix from a lucky sample on Linux.
    const runs = Array.from({ length: 5 }, () => runProbe(['sync', String(PAYLOAD), '1', '--fd=2']))

    expect(runs.map((r) => r.report)).toEqual(Array(5).fill(PAYLOAD))
    // Asserted second, and only alongside the byte counts: this was correct even
    // when the bug was live. On its own it is the non-test the standard warns of.
    expect(runs.map((r) => r.status)).toEqual(Array(5).fill(1))
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
 * THE VACUITY GUARD. Without it every assertion above could quietly become a
 * tautology: if the unfixed shape stopped losing bytes, this whole file would
 * pass whether or not the fix was still there, and nobody would find out.
 *
 * It is the one place in the suite that asserts a defect still exists, so it is
 * written to be robust rather than precise. It SAMPLES, because the loss is
 * probabilistic on Linux (measured 4 of 5 runs; deterministic on macOS) — a
 * single-run `expect(report).toBeLessThan(PAYLOAD)` was tried first and went red
 * on the CI runner for exactly that reason.
 *
 * Two claims are deliberately NOT asserted here, because they held on macOS and
 * not on Linux, and a cross-platform gate is not the place for them. Both are
 * recorded in the header instead:
 *   - a bare `fs.writeSync` on a non-blocking fd truncates (5/5 macOS, 4/5 Linux)
 *   - with the buffer pre-filled the report is lost ENTIRELY — 0 bytes, 5/5
 *     against a stalled reader on macOS. That is R13b's zero-byte log.
 *
 * ── WHY IT NO LONGER RUNS IN CI (R37, 2026-08-10) ───────────────────────────
 *
 * It went red on PR #23 — a gitlink and one markdown file — and green on a re-run
 * of the same job against an unchanged tree. The docblock here used to end *"IF
 * THIS GOES RED, do not 'fix' it. It means the platform changed — re-measure and
 * decide whether write-sync.mjs still earns its keep."* That instruction was
 * followed. The re-measurement is in the header, and it says two things:
 *
 *  1. **The platform did NOT change.** 2,698 of 2,700 runs across 33 job
 *     executions still lose bytes. `write-sync.mjs` earns its keep, emphatically,
 *     and the four fixed-path tests above stay exactly as they are.
 *  2. **This assertion cannot do its job from inside one CI job.** The no-loss
 *     behaviour is drawn per job, not per run, so a red here does not mean "the
 *     platform stopped exhibiting the bug" — it means "this job landed on a host
 *     that was already draining the socket". Raising SAMPLES cannot separate the
 *     two, because every sample in a job gets the same draw. The arithmetic is in
 *     the header; the short version is that ten samples and a thousand samples
 *     have the same false-red rate, and it is the ~1-in-13 observed here.
 *
 * So the assertion is kept and its gate is dropped. `skipIf(env.CI)` is the whole
 * mechanism, and the reasons for that shape over the alternatives:
 *
 *   - **Not "raise SAMPLES"** — measured ineffective, above. It is also the move
 *     the old docblock explicitly forbade, and it would have converted a real
 *     signal into a slower suite that fails just as often.
 *   - **Not "delete it"** — the vacuity risk it was written for is real and
 *     unchanged. What makes deletion survivable-but-worse is that the four tests
 *     above are only vacuous on a no-loss host, i.e. on ~1 job in 13 they prove
 *     nothing and on the other 12 they are genuine regression tests. That is a
 *     degradation, not a hole — but it is a degradation nobody would ever notice,
 *     and noticing is this block's entire purpose.
 *   - **Not "its own non-required CI job"** — that needs a workflow change and, if
 *     it is ever to mean anything, a required-checks decision; both are out of
 *     R37's scope (the second is R25's). Recommended in the outcome summary, not
 *     done here.
 *   - **`skipIf(env.CI)` keeps it discoverable, which a local-only opt-in flag
 *     would not.** It runs on every plain `pnpm test` on a developer machine, so
 *     it cannot rot unnoticed, and macOS is where it is *deterministic* — 100/100
 *     runs lost bytes there on the day this was written, versus a per-job coin
 *     flip on the runner. The check now lives on the platform where it is a check.
 *
 * IF THIS GOES RED LOCALLY, the original instruction still stands and now has a
 * baseline to compare against: do not "fix" it, re-measure (the method is in the
 * header — spawn the probe a few hundred times and histogram the delivered bytes)
 * and decide whether write-sync.mjs still earns its keep.
 */
describe('the shape the fix rejects still loses bytes', () => {
  // Ten is no longer a false-green calculation — the header shows sample count
  // does not move that number. It is just enough runs to print a distribution
  // rather than a single reading if someone ever has to look at this again.
  const SAMPLES = 10

  it.skipIf(env.CI)('console.error + process.exit(1) truncates, with the exit code intact', () => {
    const runs = Array.from({ length: SAMPLES }, () =>
      runProbe(['console', String(PAYLOAD), '1', '--fd=2']),
    )

    expect(runs.some((r) => r.report < PAYLOAD)).toBe(true)
    // The exit code is RIGHT in every run and the message is gone in most of
    // them. That is the whole bug, and the reason a regression test asserting
    // only `status` would have caught precisely nothing.
    expect(runs.map((r) => r.status)).toEqual(Array(SAMPLES).fill(1))
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
