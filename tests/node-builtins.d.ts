/**
 * Minimal ambient types for the three Node builtins the R28 suite needs, and
 * nothing else.
 *
 * WHY THIS FILE EXISTS. The root tsconfig.json deliberately omits `@types/node`
 * (adding it changes `setTimeout`'s return type across all 83 site files — see
 * the note in tsconfig.json), so `import { spawnSync } from 'node:child_process'`
 * from a test fails with TS2307. Same problem, same shape of answer, as
 * tests/cms-twin.d.ts and scripts/lib/fidelity.d.mts: declare the sliver of
 * surface actually used, let tsc typecheck against that, and let Vitest resolve
 * the real builtin at runtime.
 *
 * Deliberately `declare module`, never a global. A `declare const process` would
 * leak Node's globals into every file under src/** and quietly legitimise
 * server-only code in a browser bundle.
 *
 * Keep it minimal ON PURPOSE. This is not a stand-in for @types/node; every entry
 * is one the suite calls. If it ever grows past a handful, that is the signal to
 * argue for the real types rather than to keep extending this.
 *
 * IF @types/node IS EVER ADDED, this file becomes a duplicate-module error and
 * `pnpm typecheck` will say so. Delete it then — do not merge the two.
 */

declare module 'node:child_process' {
  export interface SpawnSyncOptions {
    encoding?: 'utf8'
    /** Bytes of stdout/stderr to buffer before the child is killed. */
    maxBuffer?: number
    timeout?: number
    env?: Record<string, string | undefined>
  }

  export interface SpawnSyncReturns {
    /** Exit code, or null if the child was killed by a signal. */
    status: number | null
    signal: string | null
    stdout: string
    stderr: string
    error?: Error
  }

  export function spawnSync(
    command: string,
    args: readonly string[],
    options: SpawnSyncOptions,
  ): SpawnSyncReturns
}

declare module 'node:process' {
  /** Absolute path to the node binary running this process. */
  export const execPath: string
  /**
   * Only `CI` is ever read, by exit-flush.test.ts's vacuity guard (R37). Imported
   * rather than reached through a global for the reason in the header: a
   * `declare const process` would leak Node's globals into every file in src/**.
   */
  export const env: Record<string, string | undefined>
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string
}
