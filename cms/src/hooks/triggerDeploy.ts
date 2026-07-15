/**
 * Deploy trigger — fire the front-end rebuild ON DEMAND.
 *
 * The front-end is a separate Vercel project whose build re-fetches all content
 * from this CMS (see scripts/fetch-content.mjs). Rebuilds are NO LONGER fired
 * automatically on every content save. Instead the admin exposes a manual
 * "Publicar cambios" button that calls the `/api/publish` endpoint, which uses
 * the helper below.
 *
 * Behavior:
 *  - Reads process.env.VERCEL_DEPLOY_HOOK_URL.
 *  - If unset/empty, returns { ok: false, reason: 'no-hook' } (local dev, or
 *    before the hook is configured).
 *  - Otherwise awaits a POST to the deploy hook and reports success/failure.
 */

export type PingDeployResult =
  | { ok: true }
  | { ok: false; reason: 'no-hook' }
  | { ok: false; reason: 'error'; status?: number; message?: string }

/** POST the deploy hook, if configured. Awaited; never throws. */
export async function pingDeployHook(label = 'manual'): Promise<PingDeployResult> {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) return { ok: false, reason: 'no-hook' }

  try {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      console.warn(`[deploy-hook] ${label}: hook responded ${res.status}`)
      return { ok: false, reason: 'error', status: res.status }
    }
    console.log(`[deploy-hook] ${label}: front-end rebuild triggered`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[deploy-hook] ${label}: ping failed:`, message)
    return { ok: false, reason: 'error', message }
  }
}
