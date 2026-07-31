/**
 * Server-side thumbnail generation for the Media collection.
 *
 * WHY: `clientUploads: true` (payload.config.ts) makes the browser PUT the original
 * straight to R2, so Payload's server never runs `sharp` and the `imageSizes.thumbnail`
 * (config in collections/Media.ts) is never auto-generated — every doc's
 * `sizes.thumbnail` stays null and the admin library shows no previews.
 *
 * This module regenerates that variant ourselves: GetObject the original from R2
 * (server-side, no CORS), resize with sharp to match the `imageSizes` config, PutObject
 * the WebP back to R2 under the exact key Payload would use, and return the
 * `sizes.thumbnail` object for the caller to persist. Shared by the Media afterChange
 * hook (future uploads) and the backfill script (existing docs).
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import type { BasePayload } from 'payload'
import type { Media } from '../payload-types'

/** Thumbnail spec — MUST match `imageSizes.thumbnail` in collections/Media.ts. */
const THUMB_WIDTH = 400
const THUMB_QUALITY = 70

type ThumbnailSize = NonNullable<NonNullable<Media['sizes']>['thumbnail']>
type MediaDocLike = Pick<Media, 'id' | 'filename' | 'mimeType'>

let cachedClient: S3Client | null = null

/**
 * Memoized S3 client for R2. Mirrors the s3Storage `config` in payload.config.ts
 * (endpoint / region:'auto' / forcePathStyle:true / credentials). The plugin's own
 * client is not exported, so we build our own from the same env vars.
 */
function getR2Client(): S3Client {
  if (cachedClient) return cachedClient
  cachedClient = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  })
  return cachedClient
}

/** Public URL for an R2 object key, matching `generateFileURL` in payload.config.ts. */
function publicUrl(filename: string): string {
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
  return `${base}/${filename}`
}

/**
 * Generate (or regenerate) the 400px WebP thumbnail for a media doc and write it to R2.
 * Returns the `sizes.thumbnail` object to persist, or `null` if the doc isn't a resizable
 * raster image or generation failed (callers must treat null as "skip", never fatal).
 *
 * The R2 key / filename follows Payload core's `generateImageSizeFilename`:
 *   `{base}-{width}x{height}.webp`  (base = stored filename minus extension).
 * Media has no `prefix`, so the object key is exactly that filename.
 */
export async function generateThumbnail(
  doc: MediaDocLike,
  payload: BasePayload,
): Promise<ThumbnailSize | null> {
  const { filename, mimeType } = doc

  // Only raster images can be resized. Skip SVG (vector — pointless to rasterize a
  // 400px preview) and any non-image upload.
  if (!filename || !mimeType || !mimeType.startsWith('image/') || mimeType === 'image/svg+xml') {
    return null
  }

  const bucket = process.env.S3_BUCKET || ''

  try {
    // 1. Fetch the original from R2 (server-side GetObject — no CORS, no proxy).
    const original = await getR2Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: filename }),
    )
    if (!original.Body) {
      payload.logger.warn(
        `[generateThumbnail] R2 GetObject returned empty body for "${filename}"`,
      )
      return null
    }
    const inputBuffer = Buffer.from(await original.Body.transformToByteArray())

    // 2. Resize to the thumbnail spec (match imageSizes config exactly).
    const { data, info } = await sharp(inputBuffer)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer({ resolveWithObject: true })

    // 3. Build the filename Payload expects for this size (actual output dims —
    //    height is aspect-derived, never assumed).
    const base = filename.replace(/\.[^.]+$/, '')
    const thumbFilename = `${base}-${info.width}x${info.height}.webp`

    // 4. Write the variant back to R2 under that key.
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbFilename,
        Body: data,
        ContentType: 'image/webp',
      }),
    )

    // 5. Return the sizes.thumbnail object for the caller to persist.
    return {
      url: publicUrl(thumbFilename),
      width: info.width,
      height: info.height,
      mimeType: 'image/webp',
      filesize: info.size,
      filename: thumbFilename,
    }
  } catch (err) {
    payload.logger.error(
      `[generateThumbnail] failed for "${filename}": ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
    return null
  }
}
