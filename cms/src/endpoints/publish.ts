/**
 * `POST /api/publish` — the handler itself (roadmap R29).
 *
 * Manual publish: one authenticated POST fires ONE front-end rebuild via the
 * Vercel deploy hook. `payload.config.ts` keeps the endpoint definition (path,
 * method) and points it here; nothing about the wire behaviour changed when this
 * moved — same status codes, same body shapes, same 403.
 *
 * ── Why it is a separate module ──────────────────────────────────────────────
 * It used to be an inline arrow function in the `endpoints` array of
 * payload.config.ts, which made it untestable in practice: importing it meant
 * importing the whole config — DB adapter, S3 plugin, every collection — and the
 * root `tests` CI job installs ROOT dependencies only, so anything reaching
 * `payload` cannot even resolve there. Same problem and same fix as R13b's
 * `cms/src/scripts/export-emit.ts`.
 *
 * What makes the split cheap: the only thing this handler reads off Payload is
 * `req.user`. `PublishRequest` below describes exactly that much, structurally,
 * so this file imports nothing from `payload` and stays importable from the root
 * suite. **Keep it that way** — one `payload` import here deletes
 * `tests/unit/publish-endpoint.test.ts` from CI. `pingDeployHook` is already
 * Payload-free for the same reason (global `fetch` + one env var).
 */
import { pingDeployHook } from '../hooks/triggerDeploy'

/**
 * The seam: everything the handler reads off Payload's request, and no more.
 *
 * Structural on purpose. Payload's real `PayloadRequest` is assignable to this
 * (`user` is `TypedUser | null`, and `User.id` / `User.email` are `number` /
 * `string` — cms/src/payload-types.ts:1599-1604), so payload.config.ts still
 * type-checks under `next build` while a test can hand-build a plain object.
 */
export interface PublishRequestUser {
  id: string | number
  email?: string | null
}

export interface PublishRequest {
  user?: PublishRequestUser | null
}

export async function publishHandler(req: PublishRequest): Promise<Response> {
  if (!req.user) {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 403 })
  }
  try {
    const result = await pingDeployHook(`manual:${req.user.email ?? req.user.id}`)
    // 200 even when no hook is configured — that's a valid, expected state
    // the button surfaces to the editor, not a server error.
    //
    // That call is roadmap R19's, still open, and R29 deliberately did not
    // settle it: the test suite asserts on the BODY and never on this status,
    // so R19 can change it without touching a single assertion.
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, reason: 'error', message }, { status: 500 })
  }
}
