import type { DefaultServerCellComponentProps } from 'payload'
import React from 'react'

/**
 * Small thumbnail shown as the first column of the media list (R10).
 *
 * The Media collection has no readable `thumbnailURL` on the client, and
 * Payload's computed `/api/media/file/…` proxy 500s because files live in R2
 * with access control disabled. So this is a SERVER Cell that reuses the exact
 * same URL-building logic as `adminThumbnail` in Media.ts: R2_PUBLIC_URL (only
 * available server-side) + the stored `sizes.thumbnail.filename`.
 *
 * Rows without a generated thumbnail (e.g. SVGs) render a neutral placeholder
 * instead of a broken image.
 */
const SIZE = 44

export const MediaThumbnailCell: React.FC<DefaultServerCellComponentProps> = ({ rowData }) => {
  const row = rowData as {
    alt?: string | null
    sizes?: { thumbnail?: { filename?: string | null } }
  }

  const fn = row?.sizes?.thumbnail?.filename
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
  const src = fn && base ? `${base}/${fn}` : null

  if (!src) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: 4,
          background: 'var(--theme-elevation-100)',
          border: '1px solid var(--theme-elevation-150)',
        }}
      />
    )
  }

  return (
    <img
      src={src}
      alt={row?.alt || ''}
      width={SIZE}
      height={SIZE}
      loading="lazy"
      style={{
        width: SIZE,
        height: SIZE,
        objectFit: 'cover',
        borderRadius: 4,
        display: 'block',
      }}
    />
  )
}

export default MediaThumbnailCell
