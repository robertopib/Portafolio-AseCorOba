/**
 * Types for `scripts/lib/fidelity.mjs`.
 *
 * `scripts/` is plain ESM JavaScript and the root tsconfig.json does not set
 * `allowJs` (nor include `scripts/`), so a TypeScript test importing the module
 * needs a declaration file or `pnpm typecheck` fails on TS7016. Hand-written
 * rather than generated: the module is 3 exported functions and adding a build
 * step for `scripts/` would be a much bigger change than R13a.
 *
 * Keep in sync with the JSDoc in fidelity.mjs.
 */

/** One file's entry in a fidelity report. `match: null` = not compared. */
export interface FidelityFileReport {
  match: boolean | null
  diffs?: string[]
  note?: string
}

export type FidelityFiles = Record<string, FidelityFileReport>

export interface FidelitySummary {
  allMatch: boolean
  mismatched: string[]
  unverified: string[]
  missingFromReport: string[]
}

export interface FidelityFailureOptions {
  label: string
  reportPath: string
  expected?: string[]
  maxDiffsPerFile?: number
}

export declare function deepDiff(a: unknown, b: unknown, pathStr?: string): string[]

export declare function summarizeFidelity(
  files: FidelityFiles,
  expected?: string[],
): FidelitySummary

export declare function formatFidelityFailure(
  files: FidelityFiles,
  opts: FidelityFailureOptions,
): string
