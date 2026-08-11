/**
 * Regenerate `cms/src/lib/r23/clientMap.generated.ts` from the committed worksheet.
 *
 * Run:  pnpm --dir cms payload run src/scripts/r23-generate-client-map.ts
 *       (no database, no network — it only reads and writes two files)
 *
 * `payload run` rather than `node --experimental-strip-types` because the latter needs the
 * `.ts` extension on the relative import, which cms/tsconfig.json rejects
 * (allowImportingTsExtensions is off) and `next build` therefore fails on.
 *
 * WHY THE MAP IS COMMITTED RATHER THAN PARSED AT MIGRATE TIME. A migration must be a frozen
 * snapshot: the same migration has to do the same thing on dev today and on production
 * later. Reading `docs/delivery/r23-backfill-mapping.md` from inside `up()` would make it
 * depend on a file that can change, and on that file being present in the CMS's Vercel
 * build root (it is outside it). So the worksheet is parsed once, here, and the result is
 * committed as a literal the migration imports.
 *
 * The guarantee that the two stay in step is `tests/unit/r23-worksheet.test.ts`, which
 * re-parses the worksheet on every CI run and fails if the committed map has drifted.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parseWorksheet, clientNames, projectKey } from '../lib/r23/parseWorksheet'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const WORKSHEET = path.join(ROOT, 'docs/delivery/r23-backfill-mapping.md')
const OUT = path.join(ROOT, 'cms/src/lib/r23/clientMap.generated.ts')

const entries = parseWorksheet(fs.readFileSync(WORKSHEET, 'utf8'))
const clients = clientNames(entries)
const projects = new Set(entries.map(projectKey))

const rows = entries
  .map(
    (e) =>
      `  { categoria: ${JSON.stringify(e.categoria)}, archivo: ${JSON.stringify(e.archivo)}, ` +
      `cliente: ${e.cliente === null ? 'null' : JSON.stringify(e.cliente)} },`,
  )
  .join('\n')

fs.writeFileSync(
  OUT,
  `/**
 * GENERATED — do not edit by hand.
 *
 * Source: docs/delivery/r23-backfill-mapping.md (the owner's completed client worksheet).
 * Regenerate: node --experimental-strip-types cms/src/scripts/r23-generate-client-map.ts
 * Guarded by: tests/unit/r23-worksheet.test.ts, which re-parses the worksheet and fails if
 * this file has drifted from it.
 *
 * ${entries.length} images · ${clients.length} distinct clients · ${projects.size} projects
 * (one Cliente + one Categoría = one Proyecto; each \`cliente: null\` is its own project).
 */
import type { WorksheetEntry } from './parseWorksheet'

export const R23_CLIENT_MAP: readonly WorksheetEntry[] = [
${rows}
]
`,
  'utf8',
)

// stdout is unreliable under `payload run`, but this script is plain node — printing is fine.
console.log(`wrote ${OUT}`)
console.log(`  images   ${entries.length}`)
console.log(`  clients  ${clients.length}`)
console.log(`  projects ${projects.size}`)
console.log(`  no-client projects ${entries.filter((e) => e.cliente === null).length}`)
