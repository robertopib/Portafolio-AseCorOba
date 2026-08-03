/**
 * One-off: clear saved media-LIST column preferences so the list falls back to
 * Media.admin.defaultColumns (['filename','alt','updatedAt'] — R21; was
 * ['preview','alt','updatedAt'] under R10).
 *
 * WHY: Payload's `defaultColumns` only applies to users with NO saved column
 * preference. Any admin who used the media list before the change has a stored
 * preference (in `payload-preferences`) pinning the old column order, so the new
 * order never reaches them. Deleting those preference rows makes the list fall back
 * to defaultColumns for everyone.
 *
 * NOTE (R21): the media picker DRAWER reads this same `collection-media` preference
 * key, so a stale row also keeps the drawer's first column — its only select
 * affordance — pointed at the wrong field. Run this if "elegir existente" still
 * shows the old column order after a defaultColumns change.
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
