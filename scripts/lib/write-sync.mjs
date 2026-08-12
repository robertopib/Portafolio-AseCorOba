/**
 * SYNCHRONOUS STDIO — so a report survives the `process.exit()` that follows it.
 *
 * THE BUG THIS EXISTS FOR (roadmap R28, found by R13b). `console.error(msg)`
 * immediately followed by `process.exit(1)` LOSES most of `msg` when stderr is a
 * pipe. `process.exit` does not drain queued stream writes, and a write larger
 * than the kernel's pipe buffer only lands one buffer's worth synchronously; the
 * rest is queued and dropped. Measured on macOS / Node 22, 200,000-byte payload:
 *
 *   destination        console.error + process.exit(1)
 *   file  (2> log)     200,001 / 200,001   safe — POSIX file writes are synchronous
 *   pipe  (2>&1 | …)      65,536 / 200,001   truncated at exactly one 64 KiB buffer
 *
 * GitHub Actions captures job output through a pipe, so CI is the exposed case —
 * and the loss is size-dependent, which is why it hid for so long: a 55-byte
 * message survives every time. It only bites once a failure report exceeds 64 KiB,
 * i.e. precisely when many files diverge and the message matters most. That is
 * reachable here: scripts/lib/fidelity.mjs embeds `JSON.stringify(value)` in a
 * diff line with no truncation, so ONE diff at a top-level key of pages.json is
 * a single line of ~528 KB.
 *
 * ── The two traps, both measured, both load-bearing ──────────────────────────
 *
 * 1. A BARE `fs.writeSync(2, …)` IS NOT ENOUGH. It delivers all 200,001 bytes
 *    only while fd 2 is still in blocking mode — where POSIX `write()` to a pipe
 *    does not return until every byte is written. libuv switches the fd to
 *    O_NONBLOCK the moment Node instantiates `process.stderr`, and then a bare
 *    `fs.writeSync` truncates at 65,536: identical to the bug it was meant to fix.
 *    It takes remarkably little to reach that state — measured, three otherwise
 *    identical scripts writing 200,000 bytes to a pipe:
 *
 *      import fs from 'node:fs'                      → 200,000 delivered
 *      import fs …; import process from 'node:process' →  65,536 delivered
 *      import fs …; import { execPath } from 'node:process' → 65,536 delivered
 *
 *    An IMPORT is enough; no console call is required, because pulling named
 *    exports off the builtin touches the `process.stdout`/`stderr` getters. Any
 *    real script is already in the truncating state. Hence the offset loop and
 *    the EAGAIN retry below: they are the fix, not defensive garnish.
 *
 * 2. THE RETRY MUST SLEEP, NOT SPIN. On a full pipe every `fs.writeSync` throws
 *    EAGAIN until the reader drains. A bare `continue` busy-waits: measured 1.01 s
 *    of user CPU against a reader that stalled for 1 s. `Atomics.wait` on the main
 *    thread is a real synchronous sleep and drops that to 0.08 s for the same
 *    wall-clock and the same 200,001 bytes delivered.
 *
 * ── Why NOT `process.exitCode` ───────────────────────────────────────────────
 * The other candidate fix (assign `process.exitCode`, let Node exit naturally
 * once stdio drains) works, but it cannot be adopted by the second consumer:
 * cms/src/scripts/export-content.ts ends in an unconditional `process.exit(0)`
 * that is load-bearing (Payload holds an open pg pool), and `process.exitCode = 1`
 * followed by `process.exit(0)` silently exits 0. Writing synchronously changes NO
 * exit-control flow at all, which is what keeps R28 from disturbing the locked
 * asymmetric gate semantics.
 *
 * MIRRORED, NOT SHARED: cms/src/scripts/write-sync.ts is a hand-kept copy, for the
 * same reason export-emit.ts mirrors fidelity.mjs rather than importing it — cms/
 * is a separate pnpm project with its own Vercel root directory, and a
 * `../../../scripts/` import would not resolve there and would break `next build`.
 * If you edit this file, mirror it there in the same commit;
 * tests/fidelity/exit-flush.test.ts compares the two.
 */
import fs from 'node:fs'
import { format } from 'node:util'

/** Shared 4 bytes used only as an `Atomics.wait` sleep target. Never written. */
const SLEEP = new Int32Array(new SharedArrayBuffer(4))

/**
 * Write `text` to a file descriptor, in full, before returning.
 *
 * Unlike `console.*` / `stream.write()` nothing is queued for later, so a
 * `process.exit()` on the next line cannot discard any of it.
 *
 * @param {number} fd 1 for stdout, 2 for stderr
 * @param {string} text
 */
export function writeAllSync(fd, text) {
  const buf = Buffer.from(text, 'utf8')
  let offset = 0
  while (offset < buf.length) {
    try {
      offset += fs.writeSync(fd, buf, offset)
    } catch (err) {
      // The pipe is full and the reader has not drained it yet. Sleep 1 ms and
      // retry — see trap 2 in the header for why this is not a bare `continue`.
      if (err.code === 'EAGAIN') {
        Atomics.wait(SLEEP, 0, 0, 1)
        continue
      }
      throw err
    }
  }
}

/**
 * A `console`-shaped sink whose output cannot be lost to a following
 * `process.exit()`. Drop-in for `console`: same `util.format` formatting, and the
 * same destinations Node's console uses — `log` to stdout, `warn` AND `error` to
 * stderr — so the bytes on each stream are unchanged.
 *
 * @type {{ log: (...args: unknown[]) => void, warn: (...args: unknown[]) => void, error: (...args: unknown[]) => void }}
 */
export const syncConsole = {
  log: (...args) => writeAllSync(1, format(...args) + '\n'),
  warn: (...args) => writeAllSync(2, format(...args) + '\n'),
  error: (...args) => writeAllSync(2, format(...args) + '\n'),
}
