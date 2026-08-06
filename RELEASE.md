# RELEASE.md — Production release runbook

## Context & decision (2026-07-30)

Schema-changing releases can't auto-deploy to production yet: **dev uses Payload
`push`, prod has no migration files**, so schema changes don't propagate on a
normal deploy. Until that's fixed, a schema-changing release uses the **manual
runbook** below (apply schema to prod first, then deploy code).

**Decision (2026-07-30):** ship the *editable labels + per-field show/hide
(Categorías-driven)* feature via the **manual runbook now**, and adopt the
**automation** (Payload migrations → CI gate → release workflow) as the immediate
next project — see [Automation plan](#automation-plan-deferred).

---

## Manual production release — schema-changing change

Operator = Release Manager (Roberto). Production actions require the governance
authorization phrases (`docs/rules/release-and-deployment.md`); the AI never
supplies or assumes them.

**You provide first:** prod Neon connection string in **direct (non-pooled)** form
for DDL (remove `-pooler` from the host); a quiet window (~2–4 min where only the
**CMS admin** is down — the public site is prebuilt and stays up); soak decision
(governance suggests 24h for High risk; Release Manager may waive).

**Safety invariants:**
- **Never `seed` against prod** — it wipes Categorías/Proyectos. Only `export`
  (schema push, read-only for data).
- Use the **direct** endpoint for any DDL (the Neon pooler hangs on schema push).
- `dbGuard.ts` requires `DB_TARGET_HOST` to match `DATABASE_URI` — set it.

**Steps:**
1. **Pre-flight (AI, read-only):** confirm every Categoría `home`/`page` text is
   populated, so nothing goes blank when the old inline `headerContent`/
   `portfolioIntroContent` columns are dropped.
2. **Back up (you):** in Neon, create a branch from production
   (`pre-<change>-migration`) = instant rollback.
3. **Apply schema to prod.** Type `authorize db migration on production`, then run
   from `cms/`:
   ```
   DATABASE_URI="<PROD DIRECT>" DB_TARGET_HOST="<prod direct host>" \
     pnpm payload run src/scripts/export-content.ts
   ```
   Answer **`y`** to the "DATA LOSS WARNING" (drops the unused inline columns).
   ⚠️ The live prod CMS **admin** now 500s until Step 4 — expected; public site is
   unaffected. Proceed promptly.
   ℹ️ Since R13a this script is genuinely read-only (it reconstructs into
   `/tmp/export-out/`, never into `content/`) and its fidelity gate **exits 1**
   when prod content differs from the committed `content/*.json`. That is
   informational for this step, not a failure of it — prefix with
   `FIDELITY_GATE=0` if a non-zero exit would break your shell pipeline. Before
   R13a the same run silently overwrote `content/pages.json`,
   `content/categories.json`, `content/case-studies.json` and `content/site.json`
   with prod data.
4. **Deploy code.** Type `authorize production deploy`, then merge `preview` →
   `main` (deploys prod CMS new code + rebuilds prod site).
5. **Verify (AI):** prod CMS `/api/pages` → 200; prod site renders; public site
   pixel-unchanged at defaults.
6. **Spot-check (you):** log into the prod admin, confirm a toggle/label, done.

**Rollback:** point prod `DATABASE_URI` at the Step-2 backup branch and revert the
`main` merge commit → redeploy. Added columns are harmless if left; the backup
covers the dropped ones.

---

## Automation plan (deferred)

To be done as the next project so future schema releases are one step:
- **Tier 1 — Payload migrations:** `migrate:create` committed; prod runs
  `payload migrate` on deploy; `push:false` in prod. Removes Steps 1–4's manual
  DB work and the admin-downtime window.
- **Tier 2 — CI gate on PRs:** `tsc`, `payload-types` drift check, `vite build`,
  automated pixel gate, and a "migrations committed" check.
- **Tier 3 — deploy ordering:** CMS-then-site with a health gate; auto
  pre-migration Neon snapshot.
- **Tier 4 — ergonomics:** npm script wrappers (`db:migrate`/`db:seed`/`db:export`
  using the direct endpoint + guard); email adapter so password resets send.
- **End state:** one-command release workflow gated by a GitHub Environment
  approval rule (= `authorize production deploy`).

See also: `INFRASTRUCTURE.md`, `DEPLOY.md`, `EDITING.md`.
