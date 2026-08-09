/**
 * SYNCHRONOUS STDIO — the Local-API twin's copy. See scripts/lib/write-sync.mjs
 * for the full measured account of the bug (roadmap R28); this header only says
 * why the duplication exists and what keeps the two honest.
 *
 * MIRRORED, NOT SHARED, for exactly the reason export-emit.ts mirrors
 * scripts/lib/fidelity.mjs instead of importing it: cms/ is a SEPARATE pnpm
 * project with its own lockfile and its own Vercel root directory, so a
 * `../../../scripts/` import would not resolve in the CMS deployment and would
 * break `next build`. If you edit either copy, edit both in the same commit.
 *
 * WHAT CATCHES A LIE: tests/fidelity/exit-flush.test.ts normalizes both files
 * (comments and type annotations stripped) and asserts the remaining source is
 * identical, so the behavioural proof it runs against the root copy — a spawned
 * child delivering 200,001 bytes through a pipe before `process.exit(1)` —
 * transfers to this one.
 *
 * The two things that look like polish and are not: the write loop (a bare
 * `fs.writeSync` truncates at 65,536 bytes once anything has touched
 * `process.stderr`, because libuv then puts the fd in non-blocking mode), and the
 * `Atomics.wait` in the EAGAIN retry (a bare `continue` busy-waits a whole core
 * while a slow log reader drains). Both measured — see the root copy's header.
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
 * @param fd 1 for stdout, 2 for stderr
 */
export function writeAllSync(fd: number, text: string): void {
  const buf = Buffer.from(text, 'utf8')
  let offset = 0
  while (offset < buf.length) {
    try {
      offset += fs.writeSync(fd, buf, offset)
    } catch (err: any) {
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
 */
export const syncConsole = {
  log: (...args: unknown[]) => writeAllSync(1, format(...args) + '\n'),
  warn: (...args: unknown[]) => writeAllSync(2, format(...args) + '\n'),
  error: (...args: unknown[]) => writeAllSync(2, format(...args) + '\n'),
}
