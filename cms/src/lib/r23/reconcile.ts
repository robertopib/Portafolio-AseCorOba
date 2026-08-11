/**
 * R49 — reconcile the committed worksheet against whatever the database actually holds.
 *
 * WHY THIS EXISTS. R23b-i asserted census equality — `EXPECTED = { images: 40, clients: 16,
 * projects: 20, sourceRows: 57 }` — and aborted on any mismatch. R45 then measured production:
 * **58 rows / 41 media** against dev's 57 / 40, because the owner added a photograph in the prod
 * admin. One constant cannot satisfy two databases that legitimately differ, and they will keep
 * differing: production is edited by hand, by design.
 *
 * **The census was testing the wrong property.** What the backfill actually needs is that
 * *no row is silently orphaned* — every `projects` row with an image must have a client answer,
 * or it receives no parent and R23b-ii's cleanup could take it with them. That is a **set
 * comparison in one direction**, and it is true of both databases:
 *
 *   database → worksheet   every photograph in the database MUST have a worksheet entry.  FATAL.
 *   worksheet → database   an entry with no row is INFORMATIONAL — dev simply lacks `1.jpg`.
 *
 * The safety property survives intact: prod gaining an unknown row still aborts, still before
 * the first write, and still naming the file. The census was never what protected the data.
 *
 * PURE ON PURPOSE — no `fs`, no `path`, no Payload — for the same reason `parseWorksheet.ts` is:
 * it is what lets the root Vitest suite import it (the root tsconfig has no `@types/node`), and
 * therefore what makes the abort testable without a database.
 */
import type { WorksheetEntry } from './parseWorksheet'

/** `${categoria}|${archivo}` — one photograph, the key both sides are compared on. */
export const photoKey = (categoria: string, archivo: string): string => `${categoria}|${archivo}`

/**
 * The database side of the comparison: one entry per photograph, carrying just enough to name
 * it usefully in a failure. `id` is the `projects` row a reader would go and open.
 */
export type DbPhotograph = {
  id: number
  placement: string
}

export type Reconciliation = {
  /**
   * The worksheet entries whose photograph exists in THIS database. Everything the backfill
   * writes — clients, project parents, images — is derived from these and nothing else, so a
   * worksheet answer for a photograph this database does not have creates no orphan client.
   */
  covered: WorksheetEntry[]
  /** Photographs in the database that the worksheet never describes. Fatal — see `formatUnknown`. */
  unknown: Array<{ key: string } & DbPhotograph>
  /** Worksheet answers with no row behind them, in worksheet order. Informational only. */
  unused: string[]
}

/**
 * Compare the two sides. Order is preserved on both: `covered` follows the worksheet (so the
 * backfill writes in the owner's order) and `unknown` follows the database.
 */
export function reconcile(
  entries: readonly WorksheetEntry[],
  photographs: ReadonlyMap<string, DbPhotograph>,
): Reconciliation {
  const answered = new Set(entries.map((e) => photoKey(e.categoria, e.archivo)))

  return {
    covered: entries.filter((e) => photographs.has(photoKey(e.categoria, e.archivo))),
    unknown: [...photographs]
      .filter(([key]) => !answered.has(key))
      .map(([key, photo]) => ({ key, ...photo })),
    unused: entries
      .map((e) => photoKey(e.categoria, e.archivo))
      .filter((key) => !photographs.has(key)),
  }
}

/**
 * The abort message. The first sentence of each line is R23b-i's, word for word, because that is
 * the sentence that made R45's pre-flight useful — it named the file, and naming the file is what
 * turned "the promotion is stuck" into "add `1.jpg` to the worksheet". Everything after it is new:
 * the row to open, and the two commands that fix it.
 */
export function formatUnknown(unknown: Reconciliation['unknown']): string {
  const lines = unknown.map(
    ({ key, id, placement }) =>
      `${key} exists in the database but has no client cell in the worksheet ` +
      `(projects row #${id}, placement '${placement}').`,
  )

  return [
    lines.length === 1
      ? lines[0]!
      : `${lines.length} photographs exist in the database but have no client cell in the ` +
        `worksheet:\n  - ${lines.join('\n  - ')}`,
    '',
    'A row with no answer would receive no parent, and R23b-ii deletes unparented rows — so this',
    'stops here, before the first write. Nothing has been changed.',
    'Fix: add the photograph to docs/delivery/r23-backfill-mapping.md §2 (write the client, or',
    '"—" for "no client, its own project"), then regenerate the map:',
    '  pnpm --dir cms payload run src/scripts/r23-generate-client-map.ts',
  ].join('\n')
}
