/**
 * The child process driven by tests/fidelity/exit-flush.test.ts (roadmap R28).
 *
 * It exists because the thing under test is not a function's return value — it is
 * whether bytes survive `process.exit()` on the far side of a pipe. That cannot
 * be observed in-process: it needs a real child, a real pipe, and a real exit.
 *
 * It imports the REAL scripts/lib/write-sync.mjs rather than reimplementing it,
 * so the test measures the code that ships. The `console` and `writeSync` writers
 * are the two shapes the fix rejects, kept here so the suite can prove they are
 * still broken — a fixed-path assertion that would also pass unfixed proves
 * nothing, and both of those modes are exactly how someone would "simplify" this
 * later.
 *
 * NOT a test file and not typechecked: vitest's `include` only collects
 * `*.test.{ts,tsx}`, and the root tsconfig has no `allowJs`, so a .mjs sibling is
 * invisible to both. That is deliberate — this file needs Node globals the root
 * tsconfig deliberately cannot see (see tests/node-builtins.d.ts).
 *
 * Usage:
 *   node exit-flush-probe.mjs <writer> <bytes> <exitCode> [--fd=1|2] [--warm] [--prefill=N]
 *
 *   writer     sync         syncConsole (the fix, as the two scripts use it)
 *              writeAllSync the primitive, called directly
 *              writeSync    a BARE fs.writeSync, no loop — the naive fix
 *              console      console.log/console.error — the original bug
 *   bytes      length of the payload, written as that many 'P' bytes
 *   --fd       2 (stderr, the report path) or 1 (stdout)
 *   --warm     touch process.stderr first, which is what makes libuv put the fd
 *              in non-blocking mode. Any earlier console call does this in real
 *              life; it is the difference between a bare fs.writeSync working and
 *              truncating.
 *   --prefill  emit N bytes of 'F' through the same writer first, modelling output
 *              the script printed before the report. If the pipe reader has not
 *              drained it, this is what turns truncation into total loss.
 */
import fs from 'node:fs'
import process from 'node:process'
import { syncConsole, writeAllSync } from '../../scripts/lib/write-sync.mjs'

const [writer, bytesArg, exitArg, ...flags] = process.argv.slice(2)
const flag = (name, fallback) => {
  const found = flags.find((f) => f.startsWith(`--${name}=`))
  return found === undefined ? fallback : Number(found.slice(name.length + 3))
}

const bytes = Number(bytesArg)
const exitCode = Number(exitArg)
const fd = flag('fd', 2)
const prefill = flag('prefill', 0)

/** Writes `text` plus a newline, through whichever writer is under test. */
function emit(text) {
  switch (writer) {
    case 'sync':
      return fd === 1 ? syncConsole.log(text) : syncConsole.error(text)
    case 'writeAllSync':
      return writeAllSync(fd, text + '\n')
    case 'writeSync':
      return void fs.writeSync(fd, text + '\n')
    case 'console':
      return fd === 1 ? console.log(text) : console.error(text)
    default:
      throw new Error(`exit-flush-probe: unknown writer '${writer}'`)
  }
}

// Instantiating the stream is what flips the fd to non-blocking, and thereby
// what makes a bare fs.writeSync truncate. --warm states that intent explicitly,
// though this file is already in that state before it runs: `import … from
// 'node:process'` above reads the process.stderr getter all by itself (measured
// — see finding 1 in exit-flush.test.ts). Keeping the flag means a test can say
// which behaviour it is relying on instead of depending on that side effect.
if (flags.includes('--warm')) process.stderr.write('')

// The caller counts 'P' bytes, so the payload is exactly `bytes` of them. 'F' and
// 'P' are distinguishable on purpose: with a prefill, the question is not how much
// arrived but how much of THE REPORT arrived.
if (prefill > 0) emit('F'.repeat(prefill))
emit('P'.repeat(bytes))

process.exit(exitCode)
