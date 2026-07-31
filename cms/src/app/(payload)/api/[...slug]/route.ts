/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

// R1d: media create runs the generateMediaThumbnail afterChange hook, which fetches an
// ~11–18 MB original from R2 and resizes it with sharp. Give the function headroom beyond
// the platform default so a large upload's thumbnail completes in-request.
// (Route-segment config; re-add if Payload ever regenerates this file.)
export const maxDuration = 60

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
