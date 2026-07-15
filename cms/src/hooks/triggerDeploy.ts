/**
 * Publish trigger — fire the front-end rebuild when content changes.
 *
 * The front-end is a separate Vercel project whose build re-fetches all content
 * from this CMS (see scripts/fetch-content.mjs). To make "Publish" in the admin
 * cause the public site to update, we POST the front-end's Vercel Deploy Hook
 * URL whenever a content collection or global changes (create/update/delete).
 *
 * Wired into the content collections (Pages, Projects, Categories, Media) and
 * globals (Site, UiStrings, and the hidden Home/About/Career).
 *
 * Behavior:
 *  - Reads process.env.VERCEL_DEPLOY_HOOK_URL. If unset/empty, does NOTHING
 *    (local dev, or before the hook is configured).
 *  - Fire-and-forget: never awaited, never blocks the save, swallows all errors.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/** POST the deploy hook, if configured. Never throws. */
function pingDeployHook(label: string): void {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) return // not configured (local dev) -> skip silently

  // Fire-and-forget: do not await, do not block the save.
  void fetch(url, { method: 'POST' })
    .then((res) => {
      if (!res.ok) {
        console.warn(`[deploy-hook] ${label}: hook responded ${res.status}`)
      } else {
        console.log(`[deploy-hook] ${label}: front-end rebuild triggered`)
      }
    })
    .catch((err) => {
      // Swallow — a failed rebuild ping must never break a content save.
      console.warn(`[deploy-hook] ${label}: ping failed:`, err?.message ?? err)
    })
}

export const triggerDeployAfterChange: CollectionAfterChangeHook = ({ collection }) => {
  pingDeployHook(`collection:${collection.slug}`)
}

export const triggerDeployAfterDelete: CollectionAfterDeleteHook = ({ collection }) => {
  pingDeployHook(`collection:${collection.slug}:delete`)
}

export const triggerDeployGlobalAfterChange: GlobalAfterChangeHook = ({ global }) => {
  pingDeployHook(`global:${global.slug}`)
}
