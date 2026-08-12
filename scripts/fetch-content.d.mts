/**
 * Types for `scripts/fetch-content.mjs` — the REST twin's exported surface.
 *
 * Same reason as `scripts/lib/fidelity.d.mts`: `scripts/` is plain ESM JavaScript,
 * the root tsconfig.json sets no `allowJs` and deliberately has no `@types/node`,
 * so a TypeScript test importing the module directly would fail `pnpm typecheck`
 * (TS7016 for the missing declaration, then TS2307 on its `fs`/`path` imports).
 * A declaration file keeps the real module out of the tsc program entirely.
 *
 * Only `main` is declared — it is the only export, and the only thing R13b's
 * twin-equivalence test needs. Keep in sync with the JSDoc on `main`.
 */

/** The injectable seam: every read the script performs goes through this. */
export type GetJson = (url: string) => Promise<any>

export interface FetchContentOptions {
  /** Replace to run offline over a fixture. Default: real `fetch`. */
  getJson?: GetJson
  /** Where to write the reconstruction. `null` = don't write anything. */
  contentDir?: string | null
  /** Download referenced images (needs the network). Default `true`. */
  images?: boolean
  /** Diff against git HEAD and write /tmp/fetch-fidelity.json. Default `true`. */
  fidelity?: boolean
  /** Gate wording/severity only; the caller owns the exit code. */
  gate?: boolean
  /** console-shaped sink, so a test run stays quiet. */
  log?: Pick<Console, 'log' | 'warn' | 'error'>
}

export interface FetchContentResult {
  /** relative content path -> the reconstructed object. */
  written: Record<string, unknown>
  /**
   * relative content path -> the exact bytes written (`JSON.stringify(x, null, 2)
   * + '\n'`). THIS is what the twins must agree on — an object key valued
   * `undefined` lives in `written` but is dropped from the text.
   */
  serialized: Record<string, string>
  /** The fidelity report, or `null` when `fidelity: false`. */
  fidelity: Record<string, any> | null
  /** False when at least one file was not proven identical to committed content. */
  allMatch: boolean
}

export declare function main(opts?: FetchContentOptions): Promise<FetchContentResult>
