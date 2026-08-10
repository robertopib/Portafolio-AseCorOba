# RELEASE.md — Production release runbook

> **⚠️ SUPERSEDED PREMISE — read this before the Context block (2026-08-10, R30).**
>
> **Schema now ships with the deploy.** `push: false` is set in every environment
> (`cms/src/payload.config.ts:89`) and the CMS build runs migrations before it
> builds: `ci:build` = `payload migrate && next build` (`cms/package.json:19`).
> Applying schema is therefore **part of Step 4**, not a separate manual step
> before it. The Context block below is the **2026-07-30 record of why the manual
> runbook existed**; its premise ("dev uses Payload `push`, prod has no migration
> files") stopped being true the same day, and R8 confirmed migrations live in
> production. Nothing in this file asks you to push schema by hand any more.

## Context & decision (2026-07-30) — historical

Schema-changing releases can't auto-deploy to production yet: **dev uses Payload
`push`, prod has no migration files**, so schema changes don't propagate on a
normal deploy. Until that's fixed, a schema-changing release uses the **manual
runbook** below (apply schema to prod first, then deploy code).

**Decision (2026-07-30):** ship the *editable labels + per-field show/hide
(Categorías-driven)* feature via the **manual runbook now**, and adopt the
**automation** (Payload migrations → CI gate → release workflow) as the immediate
next project — see [Automation plan](#automation-plan-still-outstanding).

---

## Manual production release — schema-changing change

Operator = Release Manager (Roberto). Production actions require the governance
authorization phrases (`docs/rules/release-and-deployment.md`); the AI never
supplies or assumes them.

**You provide first:** a quiet window (~2–4 min where only the **CMS admin** may be
down — the public site is prebuilt and stays up); soak decision (governance suggests
24h for High risk; Release Manager may waive). Plus, only if you run the optional
read-only checks in Step 3 by hand, the prod Neon connection string in **direct
(non-pooled)** form (remove `-pooler` from the host).

**Safety invariants:**
- **Never `seed` against prod** — it wipes Categorías/Proyectos. `export` is safe:
  since R13a it is **fully read-only**, reconstructing into `/tmp/export-out/` and
  applying no schema (`cms/src/scripts/export-content.ts:1-17`). *(Corrected
  2026-08-10 (R30): this line used to describe `export` as "schema push, read-only
  for data". It pushes nothing.)*
- Use the **direct (non-pooled)** endpoint for any DDL — the Neon pooler hangs on
  it. The prod build already does this for you: `ci:build` runs `payload migrate`
  against `DATABASE_URI_UNPOOLED` (`cms/package.json:19`). Match it for anything you
  run by hand.
- `dbGuard.ts` requires `DB_TARGET_HOST` to match `DATABASE_URI` — set it.

**Steps:**
1. **Pre-flight (AI, read-only):** for every column the migration **drops or
   renames**, confirm its replacement is already populated in prod, so nothing goes
   blank. *(The 2026-07-30 release, for which this runbook was written: confirm every
   Categoría `home`/`page` text is populated before the inline `headerContent` /
   `portfolioIntroContent` columns are dropped. That is the example, not the
   checklist — substitute your own migration's dropped columns.)*
2. **Back up (you):** in Neon, create a branch from production
   (`pre-<change>-migration`) = instant rollback.
3. **Pre-deploy verification — read-only, no DDL, no authorization phrase.**
   Schema is applied by the deploy in Step 4; this step only proves the deploy will
   do the right thing.
   - **The migration is committed and wired.** A green PR already proves it:
     `repo-integrity` runs `scripts/ci/check-migrations.mjs`, which hard-fails on a
     migration missing from disk, one not wired into `index.ts`, or `push: false`
     being turned off. Locally, `pnpm --dir cms migrate:status` against dev.
   - **Prod is where you think it is.** From `cms/`: `pnpm migrate:status:prod`
     (reads `.env.prod`; `cms/package.json:18`). Every earlier migration must read
     **`Ran: Yes`** and the new one **`Ran: No`**. If the new one already says
     `Ran: Yes`, it was applied out of band — **stop and find out why** before
     deploying.

   ℹ️ *Optional, read-only:* a content-fidelity diff against prod, from `cms/`:
   ```
   FIDELITY_GATE=0 DATABASE_URI="<PROD DIRECT>" DB_TARGET_HOST="<prod direct host>" \
     pnpm payload run src/scripts/export-content.ts
   ```
   Since R13a this script applies **no schema** and writes **nothing** into
   `content/` — it reconstructs into `/tmp/export-out/` and deep-diffs against the
   committed `content/*.json` (`cms/src/scripts/export-content.ts:1-24`). Its gate
   **exits 1** when they differ, which against prod is the *expected* result
   (editors have published since the last local `fetch-content` run), so
   `FIDELITY_GATE=0` downgrades that to a warning. Before R13a the same run silently
   overwrote `content/pages.json`, `content/categories.json`,
   `content/case-studies.json` and `content/site.json` with prod data.

   > **Corrected 2026-08-10 (R30).** This step used to read *"**Apply schema to
   > prod.** Type `authorize db migration on production`, then run … `pnpm payload
   > run src/scripts/export-content.ts`"*, told the operator to *"Answer **`y`** to
   > the 'DATA LOSS WARNING'"*, and warned that the admin would 500 until Step 4.
   > **None of that happens.** The script pushes no schema and prompts for nothing —
   > it contains no `readline`/`prompt`/`stdin` call, and `push: false` is set at
   > `cms/src/payload.config.ts:89`. R13a appended the accurate ℹ️ note above without
   > correcting the step around it, so this runbook told an operator to answer a
   > prompt that does not exist, at a production database, behind an authorization
   > phrase. Schema application moved into Step 4 along with the migration; the
   > `authorize db migration on production` phrase moved with it.

4. **Deploy code — and this is where schema is applied.** Type **both**
   `authorize db migration on production` and `authorize production deploy`, then
   merge `preview` → `main`. The prod CMS build runs `payload migrate && next build`
   against the unpooled endpoint (`cms/package.json:19`), then the prod site
   rebuilds.
   ⚠️ **The admin-downtime window lives here now, and it is shorter.** Between
   `payload migrate` completing and Vercel promoting the new deployment, the *old*
   CMS code is serving against the *new* schema, so the admin may 500 for the length
   of `next build`. The public site is prebuilt and unaffected.
   ⚠️ **If the migration fails, `next build` never runs and Vercel keeps the last
   good deployment** — prod looks healthy while quietly serving the old code. That
   is exactly the R8 failure shape, where "migrations Tier 1" appeared live for days
   and was not. **Read the build log; do not infer success from the site being up.**
5. **Verify (AI):** prod CMS `/api/pages` → 200; prod site renders; public site
   pixel-unchanged at defaults.
6. **Spot-check (you):** log into the prod admin, confirm a toggle/label, done.

**Rollback:** point prod `DATABASE_URI` at the Step-2 backup branch and revert the
`main` merge commit → redeploy. Added columns are harmless if left; the backup
covers the dropped ones.

---

## Automation plan (still outstanding)

*Rewritten 2026-08-10 (R30). This section listed all four tiers as pending; three
of them had shipped. What each tier turned into is recorded below the line so the
plan stays legible, but **only the two items in this first list are still open**.*

- **Tier 3 — deploy ordering.** CMS-then-site with a health gate, and an
  **automatic pre-migration Neon snapshot** so Step 2 stops being a manual
  click. Not started.
- **Tier 4 (part) — ops script wrappers.** `db:seed` / `db:export` wrappers that
  bake in the direct endpoint and the `dbGuard` env, so the long
  `DATABASE_URI=… DB_TARGET_HOST=… pnpm payload run …` line in Step 3 stops being
  retyped by hand. Tracked as **R3b**, the only thing keeping R3 open. The
  *migrate* half already exists (`migrate:prod`, `migrate:status:prod` —
  `cms/package.json:17-18`).
- **End state (unchanged):** a one-command release workflow gated by a GitHub
  Environment approval rule (= `authorize production deploy`).

### Shipped — do not re-plan these

- **Tier 1 — Payload migrations. Shipped 2026-07-30; confirmed live in prod by
  R8.** `push: false` in **every** environment, not just prod
  (`cms/src/payload.config.ts:89`), and the CMS build applies pending migrations:
  `ci:build` = `payload migrate && next build` (`cms/package.json:19`). This is
  what removed the manual schema step from the runbook above.
- **Tier 2 — CI gate on PRs. Shipped as R2**, and it has grown past what this
  bullet asked for: **6 required checks** as of R25, on **both** `main` and
  `preview`, with `enforce_admins: true` — `Repo integrity (migrations,
  lockfiles)`, `CMS (frozen install, type drift, build)`, `Site (frozen install,
  build)`, `Site typecheck (tsc --noEmit)`, `Tests (vitest, offline)`, `Pixel
  parity (head vs merge base, 0.000%)`. Every item originally listed here is in
  there: `tsc`, the `payload-types` drift check (`.github/workflows/ci.yml:104`),
  `vite build`, the automated pixel gate, and the migrations checks in
  `scripts/ci/check-migrations.mjs`. One caveat worth knowing before you rely on
  it: *"a PR that touches schema-bearing files ships a new migration"* is that
  script's **check 6, a WARN, not a hard failure** (`:19`). Checks 1–4 — every
  imported migration exists, every file is wired in, `push: false` still set — are
  hard (`:12-17`).
- **Tier 4 (part) — email adapter. Shipped as R3a, live in PROD** since
  2026-08-03: `@payloadcms/email-resend` wired as `email:` in
  `cms/src/payload.config.ts`, plus the `serverURL` that makes the reset link
  absolute. Forgot-password sends and the link works.

See also: `INFRASTRUCTURE.md`, `DEPLOY.md`, `EDITING.md`.
