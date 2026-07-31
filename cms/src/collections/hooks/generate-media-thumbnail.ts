/**
 * Media `afterChange` hook: generate the admin thumbnail for future uploads.
 *
 * With clientUploads the browser PUTs the original to R2 and then POSTs a small doc-create
 * request; the server never runs sharp. This hook runs AFTER that create/update, fetches
 * the original from R2, resizes it, writes the WebP back, and persists `sizes.thumbnail`.
 *
 * Recursion safety: writing `sizes.thumbnail` via `payload.update` re-fires afterChange, so
 * that internal update carries `context.skipThumbnailGeneration` and we bail immediately.
 * Idempotency: if the doc already has a thumbnail whose filename matches the current source,
 * we skip (so plain alt-text edits don't regenerate); a replaced file changes the base, so
 * its stale thumbnail no longer matches and we regenerate.
 */
import type { CollectionAfterChangeHook } from 'payload'
import type { Media } from '../../payload-types'
import { generateThumbnail } from '../../lib/generateThumbnail'

export const generateMediaThumbnail: CollectionAfterChangeHook<Media> = async ({
  doc,
  req,
  context,
}) => {
  if (context?.skipThumbnailGeneration) return doc

  const { payload } = req

  if (!doc.filename || !doc.mimeType?.startsWith('image/')) return doc

  const base = doc.filename.replace(/\.[^.]+$/, '')
  if (doc.sizes?.thumbnail?.filename?.startsWith(`${base}-`)) return doc

  const startedAt = Date.now()
  const thumbnail = await generateThumbnail(doc, payload)
  if (!thumbnail) return doc

  await payload.update({
    collection: 'media',
    id: doc.id,
    data: { sizes: { thumbnail } },
    // Prevent this write from re-triggering the hook (infinite loop guard).
    context: { skipThumbnailGeneration: true },
  })

  payload.logger.info(
    `[generateMediaThumbnail] built ${thumbnail.filename} (${thumbnail.width}x${thumbnail.height}, ${thumbnail.filesize}B) for media #${doc.id} in ${Date.now() - startedAt}ms`,
  )

  return doc
}
