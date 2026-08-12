/**
 * R23b-iii — decide which `projects` rows the new model has made redundant.
 *
 * WHY THIS EXISTS. R23b-i copied 57 rows' worth of content into 20 parents and 40
 * `projects_images`, and R23b-ii proved both exporters emit the same bytes from the new
 * shape. The 37 rows left over are duplicates of data that now lives inside `images[]` —
 * but "left over" is a property to be *derived and checked*, never a list of ids typed into
 * a migration. Two databases legitimately differ (dev 57 photographs, production 58 — R45),
 * so the same migration must compute a different answer on each and still be correct.
 *
 * THE SAFETY PROPERTY, which is R49's pointed the other way. `reconcile.ts` asks *"does
 * every photograph in the database have a worksheet answer?"* — nothing may be left without
 * a parent. This asks the mirror question:
 *
 *     nothing is deleted whose photograph is not already preserved in `projects_images`.
 *
 * A row is only doomed when the new model demonstrably carries its photograph. A row whose
 * photograph is missing from `images[]` — a row an editor added after the backfill, say —
 * is NOT quietly deleted and NOT quietly kept: it is `unsafe`, and it aborts the migration
 * before the first write, naming the file. That is the whole point. A count assertion
 * ("expect 37") would pass on a database where the wrong 37 rows were selected.
 *
 * PURE ON PURPOSE — no `fs`, no `path`, no Payload — for the same reason `reconcile.ts` and
 * `parseWorksheet.ts` are: it is what lets the root Vitest suite import it (the root tsconfig
 * has no `@types/node`), and therefore what makes the abort testable without a database.
 */
import { photoKey } from './reconcile'

/**
 * One `projects` row, flattened to just what the decision needs. `imageRows` is the count of
 * `projects_images` children — the single fact that distinguishes a parent from a leftover.
 */
export type CleanupRow = {
  id: number
  /** `'image'` | `'caseStudy'`. */
  type: string
  /** The categoría slug, or null if the row somehow has none. */
  categoria: string | null
  /** The media filename of the row's old top-level `image`, or null if it has none. */
  archivo: string | null
  /** Only ever used to name a row in a failure message, exactly as `reconcile.ts` does. */
  placement: string | null
  /** How many `projects_images` rows hang off this row. */
  imageRows: number
}

export type CleanupPlan = {
  /** Redundant rows whose photograph is provably preserved in `images[]`. Safe to delete. */
  doomed: CleanupRow[]
  /** Rows carrying `images[]`. These ARE the new model — never deletable. */
  parents: CleanupRow[]
  /** Surviving non-image rows: the UX/UI case study, the one Proyecto that is a project. */
  retained: CleanupRow[]
  /** Deletion candidates the new model does not account for. Fatal — see `formatUnsafe`. */
  unsafe: Array<CleanupRow & { reason: string }>
}

/**
 * Partition every `projects` row into keep / delete / abort.
 *
 * @param rows    every row in `projects`, in whatever order the database returned them
 * @param covered `${categoria}|${archivo}` for every photograph reachable through
 *                `projects_images` — i.e. what the NEW model holds. Built with `photoKey`
 *                so the two sides of the comparison cannot drift apart.
 *
 * Order of the tests matters and is the argument:
 *   1. a row with `images[]` is a parent — it is the new model, whatever else it looks like;
 *   2. a row that is not `type: 'image'` is the case study — it never had a photograph;
 *   3. everything else is a candidate, and only survives as `doomed` if `covered` proves the
 *      new model already carries its photograph.
 */
export function planCleanup(
  rows: readonly CleanupRow[],
  covered: ReadonlySet<string>,
): CleanupPlan {
  const plan: CleanupPlan = { doomed: [], parents: [], retained: [], unsafe: [] }

  for (const row of rows) {
    if (row.imageRows > 0) {
      plan.parents.push(row)
      continue
    }
    if (row.type !== 'image') {
      plan.retained.push(row)
      continue
    }
    // A candidate. It must prove itself redundant; the default is to abort, not to delete.
    if (!row.categoria || !row.archivo) {
      plan.unsafe.push({
        ...row,
        reason: !row.categoria
          ? 'it belongs to no categoría, so its photograph cannot be matched'
          : 'it carries no image, so there is nothing to match against images[]',
      })
      continue
    }
    if (!covered.has(photoKey(row.categoria, row.archivo))) {
      plan.unsafe.push({
        ...row,
        reason: 'its photograph appears in no images[] row, so deleting it would lose content',
      })
      continue
    }
    plan.doomed.push(row)
  }

  return plan
}

/**
 * The abort message. Same shape as `formatUnknown` in `reconcile.ts`, and for the same
 * reason: R45 turned "the promotion is stuck" into "add `1.jpg` to the worksheet" purely
 * because the failure named the file. Name the file, name the row to open, say what to do.
 */
export function formatUnsafe(unsafe: CleanupPlan['unsafe']): string {
  const lines = unsafe.map(
    (r) =>
      `${r.categoria ?? '(no categoría)'}|${r.archivo ?? '(no image)'} — ` +
      `projects row #${r.id}, placement '${r.placement ?? 'none'}': ${r.reason}.`,
  )

  return [
    lines.length === 1
      ? lines[0]!
      : `${lines.length} projects rows cannot be shown to be redundant:\n  - ${lines.join('\n  - ')}`,
    '',
    'This cleanup only deletes rows whose photograph is already preserved in projects_images.',
    'A row the new model does not account for is neither deleted nor silently kept — it stops',
    'here, before the first write. Nothing has been changed.',
    'Fix: give the photograph a home in the new model (add it to the right Proyecto’s',
    'Imágenes, or delete the row by hand if it is genuinely junk), then re-run the migration.',
  ].join('\n')
}
