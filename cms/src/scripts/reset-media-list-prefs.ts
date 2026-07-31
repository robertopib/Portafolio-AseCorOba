/**
 * One-off: clear saved media-LIST column preferences so the list falls back to
 * Media.admin.defaultColumns (['preview','alt','updatedAt'] — R10).
 *
 * WHY: Payload's `defaultColumns` only applies to users with NO saved column
 * preference. Any admin who used the media list before R10 has a stored
 * preference (in `payload-preferences`) that omits the new `preview` column, so
 * the thumbnail column never shows for them. Deleting those preference rows makes
 * the list fall back to defaultColumns for everyone.
 *
 * Run:  pnpm payload run src/scripts/reset-media-list-prefs.ts
 * Report -> /tmp/reset-media-list-prefs-report.json  (errors -> ...-error.json)
 *
 * Idempotent: re-running just finds 0 rows. DB safety: assertPortfolioDb() runs
 * BEFORE getPayload (which auto-connects). See dbGuard.ts. Point cms/.env at the
 * intended (dev) DB.
 */
import fs from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import { assertPortfolioDb } from './dbGuard'

async function main() {
  await assertPortfolioDb()

  const payload = await getPayload({ config })

  // Payload stores list-view column prefs under a key like `media-list`.
  // Fetch a wide net (any pref key mentioning media) and only delete list ones.
  const prefs = await payload.find({
    collection: 'payload-preferences',
    limit: 1000,
    depth: 0,
    where: { key: { like: 'media' } },
  })

  const report = {
    matched: prefs.docs.map((d: { id: number | string; key?: string | null }) => ({
      id: d.id,
      key: d.key,
    })),
    deleted: [] as Array<number | string>,
  }

  for (const doc of prefs.docs as Array<{ id: number | string; key?: string | null }>) {
    // Only the list-view preference (holds column choices); leave others alone.
    if (doc.key !== 'collection-media') continue
    await payload.delete({ collection: 'payload-preferences', id: doc.id })
    report.deleted.push(doc.id)
    payload.logger.info(`[reset-media-list-prefs] deleted pref #${doc.id} (${doc.key})`)
  }

  fs.writeFileSync('/tmp/reset-media-list-prefs-report.json', JSON.stringify(report, null, 2))
  payload.logger.info(
    `[reset-media-list-prefs] done: ${report.deleted.length} deleted of ${report.matched.length} matched`,
  )
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync(
    '/tmp/reset-media-list-prefs-error.json',
    JSON.stringify({ message: err.message, stack: err.stack }, null, 2),
  )
}
process.exit(0)
