/**
 * Ambient types for `@cms-export-emit` — the Local-API twin's reconstruction
 * (`cms/src/scripts/export-emit.ts`), aliased in vitest.config.ts.
 *
 * WHY AN ALIAS AND A DECLARATION rather than a relative import: importing the
 * real path from a test adds that file to the `tsc --noEmit` program, and it
 * imports `fs` and `path`. The root tsconfig deliberately has no `@types/node`
 * (adding it would change setTimeout's return type across all 83 site files —
 * see the note in tsconfig.json), so every such import fails with TS2307. A
 * bare specifier resolves to this ambient declaration instead and tsc never
 * opens the file. Exactly the trick `scripts/lib/fidelity.d.mts` uses for the
 * REST side, for the same reason.
 *
 * DRIFT: nothing makes this declaration match the module automatically. Two
 * things catch a lie — `pnpm --dir cms build` typechecks the real module against
 * cms/tsconfig.json, and tests/fidelity/twin-equivalence.test.ts calls it for
 * real, so a wrong shape fails at runtime rather than passing vacuously.
 */
declare module '@cms-export-emit' {
  export interface FileReport {
    match: boolean | null
    diffs?: string[]
    note?: string
  }

  /** The seam: `getPayload({ config })`, narrowed to what the twin calls. */
  export interface PayloadReader {
    find(args: {
      collection: string
      limit?: number
      depth?: number
      sort?: string
      locale?: string
    }): Promise<{ docs: any[] }>
    findGlobal(args: { slug: string; depth?: number; locale?: string }): Promise<any>
  }

  export interface ExportOptions {
    payload: PayloadReader
    /** `null` = write nothing. */
    outDir?: string | null
    /** `null` = skip the comparison against committed content. */
    compareDir?: string | null
  }

  export interface FidelitySummary {
    allMatch: boolean
    mismatched: string[]
    unverified: string[]
    missingFromReport: string[]
  }

  export interface ExportResult {
    written: Record<string, any>
    /** The exact bytes of each emitted file — the twins' actual contract. */
    serialized: Record<string, string>
    report: Record<string, FileReport>
    summary: FidelitySummary
  }

  export const OUT_DIR: string
  export function main(opts: ExportOptions): Promise<ExportResult>

  // The hand-mirrored copies of scripts/lib/fidelity.mjs. Exported so a test can
  // drive both implementations over the same inputs (R13b).
  export function deepDiff(a: any, b: any, pathStr?: string): string[]
  export function summarizeFidelity(
    files: Record<string, FileReport>,
    expected?: string[],
  ): FidelitySummary
  export function formatFidelityFailure(
    files: Record<string, FileReport>,
    opts: { label: string; reportPath: string; expected?: string[]; maxDiffsPerFile?: number },
  ): string
}
