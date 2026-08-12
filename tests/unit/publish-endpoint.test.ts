/**
 * Unit layer (standard §2, "Payload endpoint handlers — unit, injected fake
 * `req`") — R29, closing **risk 3** and the last unstarted item in §2's
 * recommended sequence.
 *
 * THE BUG THIS EXISTS FOR. `POST /api/publish` answers **HTTP 200** when
 * `VERCEL_DEPLOY_HOOK_URL` is missing or blank: `pingDeployHook` returns
 * `{ ok: false, reason: 'no-hook' }` and the handler passes it straight through
 * as a success status. Nothing rebuilds. It is the R3a bug shape — an env var
 * whose absence produces a green-looking result — and the only thing standing
 * between an editor and a silently-unpublished site is the word `no-hook` in the
 * response body, which `PublishButton.tsx:37-39` reads to decide whether to show
 * a red toast. Drop that word and the failure becomes invisible.
 *
 * WHICH IS WHY EVERY OUTCOME HERE IS ASSERTED ON THE **BODY** (standard §8). A
 * test asserting `status === 200` passes in both the broken and the fixed world;
 * it is worse than no test. Whether the status *should* change is roadmap R19,
 * still open — this suite tests the behaviour that exists, and is written so R19
 * can flip the status without touching an assertion.
 *
 * The one deliberate exception is the unauthenticated case, and the reason is in
 * a comment on that test: 403 is not under R19's open question, and a silent
 * downgrade to 200 there is an auth regression, not a design choice.
 *
 * WHY THIS CAN RUN IN CI. `fetch` and the env var are stubbed and restored per
 * test: no network, no database, no secrets, no Payload boot (standard §3/§6).
 * The handler was extracted out of `payload.config.ts` for exactly that reason
 * (R29, same shape as R13b's `export-emit.ts`) — the `tests` job installs root
 * dependencies only, so a test whose import graph reaches `payload` fails in CI
 * and nowhere else.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishHandler } from '@cms-publish-endpoint'
import configSource from '../../cms/src/payload.config.ts?raw'
import handlerSource from '../../cms/src/endpoints/publish.ts?raw'

const EDITOR = { id: 7, email: 'editora@ase-cor-oba.site' }
const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_fake/notarealhook'

/** The whole point of the suite: read the body, never the status. */
async function bodyOf(res: Response) {
  return (await res.json()) as Record<string, unknown>
}

/** A `fetch` that fails the test if it is ever called, plus the spy to assert on. */
function stubFetch(impl: () => Promise<Response> = () => Promise.reject(new Error('unexpected'))) {
  const spy = vi.fn(impl)
  vi.stubGlobal('fetch', spy)
  return spy
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/publish — authentication', () => {
  // Regression: drop or invert the `!req.user` guard and any unauthenticated
  // caller who can reach /api/publish can fire unlimited Vercel builds. The
  // second assertion is the one that would catch an inversion that still
  // *returns* 403 — the hook must not have been pinged at all.
  //
  // THE ONE STATUS ASSERTION IN THIS FILE, deliberately. Everywhere else the
  // status is off-limits because R19 may legitimately change it; 403 is not part
  // of that question, and a downgrade to 200 here is an auth hole, not a
  // redesign. PublishButton.tsx:41 also branches on `res.status === 403`.
  it.each([
    ['user is null', { user: null }],
    ['user is undefined', { user: undefined }],
    ['there is no user key at all', {}],
  ])('refuses the request and never pings the hook when %s', async (_label, req) => {
    const fetchSpy = stubFetch()
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', HOOK)

    const res = await publishHandler(req)

    expect(await bodyOf(res)).toEqual({ ok: false, reason: 'unauthorized' })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(res.status).toBe(403)
  })
})

describe('POST /api/publish — the deploy hook is not configured', () => {
  // Regression: THE headline case, and the reason this task exists. A missing or
  // blank VERCEL_DEPLOY_HOOK_URL means nothing rebuilds, and the response says so
  // only in `reason`. Collapse the body to a bare `{ ok: false }`, or drop
  // `reason` while "tidying" the payload, and PublishButton's `no-hook` branch
  // dies silently: the editor gets the generic "No se pudo publicar" instead of
  // "No hay un hook de despliegue configurado", and nobody learns the deployment
  // is misconfigured. `toEqual` is exact on purpose — a partial match would let
  // exactly that regression through.
  //
  // NO STATUS ASSERTION. It is 200 today (R19 owns whether it stays 200); the
  // defect is that the status is silent, so the status is not the contract.
  it.each([
    ['unset', undefined],
    ['set but blank — the "configured in Vercel, left empty" case', ''],
  ])('surfaces reason:"no-hook" in the body when the URL is %s', async (_label, value) => {
    const fetchSpy = stubFetch()
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', value)

    const res = await publishHandler({ user: EDITOR })

    expect(await bodyOf(res)).toEqual({ ok: false, reason: 'no-hook' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('POST /api/publish — the deploy hook answers', () => {
  // Regression: invert `if (!res.ok)` in triggerDeploy.ts and every successful
  // publish reports failure (editors stop trusting the button and start
  // re-clicking it); invert it the other way and every failure reports success.
  // The call-count assertion pins the "ONE rebuild" contract in the endpoint's
  // own comment — a retry loop added here would double every editor's builds.
  it('reports ok:true, and pings the configured hook exactly once, on 2xx', async () => {
    const fetchSpy = stubFetch(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', HOOK)
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await publishHandler({ user: EDITOR })

    expect(await bodyOf(res)).toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(HOOK, { method: 'POST' })
  })

  // Regression: a revoked or mistyped deploy hook answers 404, and a rate-limited
  // one answers 429. Both must reach the editor as a failure. Swallowing the
  // upstream status — returning a bare `{ ok: false }` — is the same class of
  // silence as the no-hook case: the response is the only place the number ever
  // appears, since the server log is on Vercel and the editor cannot see it.
  it.each([404, 429, 500])('reports reason:"error" and the hook status %i', async (status) => {
    stubFetch(() => Promise.resolve(new Response('nope', { status })))
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', HOOK)
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const res = await publishHandler({ user: EDITOR })

    expect(await bodyOf(res)).toEqual({ ok: false, reason: 'error', status })
  })

  // Regression: a DNS failure, a dropped connection or a TLS error must reach
  // the caller as something diagnosable. Drop `message` from the result, or
  // replace `err instanceof Error ? err.message : String(err)` with a bare
  // `String(err)`, and every network failure collapses into an indistinguishable
  // "error" — the server log is on Vercel and the editor cannot see it, so the
  // body is the only place that detail ever appears. Both mutations go red here.
  //
  // MEASURED LIMIT, stated so nobody over-trusts this test: it does NOT catch
  // `pingDeployHook` losing its try/catch. If the rejection escapes, the
  // handler's own catch produces a byte-identical body and only the status
  // differs (500 vs 200) — and this file asserts no status. See the R29 outcome
  // note; that is R19's evidence, not a hole to plug by asserting a status here.
  it('reports reason:"error" with the message when the hook is unreachable', async () => {
    stubFetch(() => Promise.reject(new TypeError('fetch failed')))
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', HOOK)
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const res = await publishHandler({ user: EDITOR })

    expect(await bodyOf(res)).toEqual({ ok: false, reason: 'error', message: 'fetch failed' })
  })
})

/**
 * The handler is now tested in isolation, which means nothing above proves the
 * CMS still USES it. These two checks are the seam guard — source text, because
 * "this file wires that function" and "this file imports nothing from payload"
 * are properties of the text, not of one run (same tool, same reason, as
 * tests/fidelity/fidelity-gate.test.ts).
 */
describe('the extraction has not rotted', () => {
  it('parsed files that look like the config and the handler', () => {
    expect(configSource).toContain('export default buildConfig(')
    expect(handlerSource).toContain('export async function publishHandler(')
  })

  // Regression (introduced by R29 itself): delete the import or repoint the
  // endpoint and every assertion above still passes while POST /api/publish
  // 404s in production. Extracting a handler for testability is only safe if
  // something checks that the extraction is still connected.
  it('still wires POST /api/publish to the extracted handler', () => {
    expect(configSource).toContain("from './endpoints/publish'")

    const start = configSource.indexOf('endpoints: [')
    const block = configSource.slice(start, configSource.indexOf('\n  ],', start))
    expect(block.length, 'the endpoints array was not found — this check is vacuous').toBeGreaterThan(50)
    expect(block).toContain("path: '/publish'")
    expect(block).toContain("method: 'post'")
    expect(block).toContain('handler: publishHandler')
  })

  // Regression (R13b's lesson, same shape): the `tests` CI job installs ROOT
  // dependencies only. One `payload` import in the handler module and this whole
  // suite stops resolving — in CI, not locally, so the PR goes red for a reason
  // that looks nothing like its cause. Exact equality, so it also fails if the
  // regex matched nothing.
  it('keeps payload out of the handler module', () => {
    const runtimeImports = [
      ...handlerSource.matchAll(/^import\s+(?!type\b)[\s\S]*?from\s+'([^']+)'/gm),
    ].map((m) => m[1])
    expect(runtimeImports).toEqual(['../hooks/triggerDeploy'])
  })
})
