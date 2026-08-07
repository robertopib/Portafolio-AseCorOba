/**
 * Ambient types for `@cms-publish-endpoint` — the `POST /api/publish` handler
 * (`cms/src/endpoints/publish.ts`), aliased in vitest.config.ts.
 *
 * WHY AN ALIAS AND A DECLARATION rather than a relative import: importing the
 * real path from a test adds that file, and everything it imports, to the
 * `tsc --noEmit` program. The handler itself is clean, but it imports
 * `cms/src/hooks/triggerDeploy.ts`, which reads `process.env` — and the root
 * tsconfig deliberately has no `@types/node` (adding it would change
 * setTimeout's return type across all 83 site files; see the note in
 * tsconfig.json), so that is a hard error — measured, by pointing the test at
 * the relative path: `cms/src/hooks/triggerDeploy.ts(24,15): error TS2591:
 * Cannot find name 'process'`. A bare specifier resolves to this ambient
 * declaration instead and tsc never opens the file. Exactly the trick
 * `tests/cms-twin.d.ts` and `scripts/lib/fidelity.d.mts` use, for the same
 * reason.
 *
 * DRIFT: nothing makes this declaration match the module automatically, and an
 * ambient declaration is perfectly happy to lie. Two things catch a lie —
 * `pnpm --dir cms build` typechecks the real module against cms/tsconfig.json,
 * and tests/unit/publish-endpoint.test.ts CALLS it for real (and reads the
 * module's source text), so a wrong shape fails at runtime rather than passing
 * vacuously.
 */
declare module '@cms-publish-endpoint' {
  /** Everything the handler reads off Payload's request, and no more. */
  export interface PublishRequestUser {
    id: string | number
    email?: string | null
  }

  export interface PublishRequest {
    user?: PublishRequestUser | null
  }

  export function publishHandler(req: PublishRequest): Promise<Response>
}
