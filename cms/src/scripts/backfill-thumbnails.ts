/**
 * One-off backfill: generate the admin thumbnail for existing media docs whose
 * `sizes.thumbnail` is still null (the ~42 images uploaded before R1d).
 *
 * Run:  pnpm payload run src/scripts/backfill-thumbnails.ts
 * NOTE: console output is swallowed in this sandbox -> results go to
 *       /tmp/backfill-thumbnails-report.json (errors to /tmp/backfill-thumbnails-error.json)
 *
 * Idempotent: docs that already have a matching `sizes.thumbnail` are skipped, so re-running
 * is safe. Uses the same generateThumbnail helper as the Media afterChange hook.
 * DB safety: assertPortfolioDb() runs BEFORE getPayload (which auto-connects). See dbGuard.ts.
 */
import fs from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import { assertPortfolioDb } from './dbGuard'
import { generateThumbnail } from '../lib/generateThumbnail'

async function main() {
  await assertPortfolioDb()

  const payload = await getPayload({ config })

  const report = {
    total: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    docs: [] as Array<{
      id: number
      filename?: string | null
      status: string
      thumb?: string | null
    }>,
  }

  const media = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  report.total = media.docs.length

  for (const doc of media.docs) {
    // Skip docs that already have a thumbnail matching the current source file.
    const base = doc.filename?.replace(/\.[^.]+$/, '')
    if (base && doc.sizes?.thumbnail?.filename?.startsWith(`${base}-`)) {
      report.skipped++
      report.docs.push({ id: doc.id, filename: doc.filename, status: 'skipped' })
      continue
    }

    const thumbnail = await generateThumbnail(doc, payload)
    if (!thumbnail) {
      report.failed++
      report.docs.push({ id: doc.id, filename: doc.filename, status: 'failed' })
      payload.logger.warn(`[backfill-thumbnails] no thumbnail generated for media #${doc.id}`)
      continue
    }

    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { sizes: { thumbnail } },
      context: { skipThumbnailGeneration: true },
    })

    report.processed++
    report.docs.push({
      id: doc.id,
      filename: doc.filename,
      status: 'processed',
      thumb: thumbnail.filename,
    })
    payload.logger.info(
      `[backfill-thumbnails] media #${doc.id} -> ${thumbnail.filename} (${thumbnail.width}x${thumbnail.height})`,
    )
  }

  fs.writeFileSync('/tmp/backfill-thumbnails-report.json', JSON.stringify(report, null, 2))
  payload.logger.info(
    `[backfill-thumbnails] done: ${report.processed} processed, ${report.skipped} skipped, ${report.failed} failed (of ${report.total})`,
  )
}

try {
  await main()
} catch (err: any) {
  fs.writeFileSync(
    '/tmp/backfill-thumbnails-error.json',
    JSON.stringify({ message: err.message, stack: err.stack }, null, 2),
  )
}
process.exit(0)
