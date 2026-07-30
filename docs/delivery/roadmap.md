# Delivery Roadmap — Portafolio AseCorOba

> Single source of truth for delivery. The **conductor** reads this + the latest
> session note, emits **one** task prompt at a time (see
> [conductor-playbook.md](./conductor-playbook.md)), and updates it after each
> outcome. Task prompts use [task-prompt-template.md](./task-prompt-template.md);
> workers return [outcome-summary-template.md](./outcome-summary-template.md).
>
> This instantiates the governance workflow in
> `governance/.github/agents/delivery-planner.agent.md` +
> `governance/docs/rules/session-and-context.md`.

Last updated: 2026-07-30

---

## Locked decisions (do not re-litigate)

- **CMS is a content editor only.** Public design is fixed / pixel-identical; the
  page-builder was tried and reverted — don't reintroduce it. (memory:
  `cms-is-content-editor`)
- **Branch/deploy:** develop on `preview` (or feature branches), never on `main`.
  `main`→Vercel Production, `preview`→Vercel Preview. Preview/local use the Neon
  **`dev`** branch. (INFRASTRUCTURE.md §3/§7, memory: `preview-environment`)
- **Schema = migrations** (as of 2026-07-30): `push:false` everywhere;
  `pnpm migrate:create` → commit → the CMS build (`ci:build`) auto-applies. Dev +
  prod are baselined. (RELEASE.md, memory: `release-process`)
- **DB safety:** `cms/src/scripts/dbGuard.ts` aborts unless `DB_TARGET_HOST` matches
  `DATABASE_URI` host. Use the **direct (non-pooled)** endpoint for any DDL (pooler
  hangs). Never `seed` prod. `neonctl` here is a *different* account — take strings
  from the portfolio's own Neon. (memory: `neon-db-separate-account`)
- **Two env files:** `cms/.env` = dev (daily), `cms/.env.prod` = prod (`:prod`
  scripts only; git-ignored).

## Rules quick-ref (cite in every prompt)

- Read `governance/CLAUDE.md` first; load task-relevant `governance/docs/rules/*.md`.
- Env/ops truth: `INFRASTRUCTURE.md`, `RELEASE.md`, `EDITING.md`.
- Pixel gate (any UI/content render change): `scripts/shoot.mjs` + `scripts/diff.mjs`
  vs `screenshots/baseline` — **must be 0.000%** at defaults.
- Prod authorization phrases (human types them; never assumed):
  `authorize production deploy`, `authorize db migration on production`.

---

## Backlog

| ID | Title | Status | Agent | Risk | Depends on |
|----|-------|--------|-------|------|------------|
| R1 | Image uploader fix + thumbnails + backfill | in-progress | full-stack + devops | High | — |
| R1b | ↳ Upload fix (clientUploads + R2 CORS + S3_BUCKET) | done (preview) | devops | High | — |
| R1c | ↳ Thumbnails (imageSizes + adminThumbnail) | todo | full-stack | Medium | R1b |
| R1d | ↳ Backfill thumbnails for 42 existing images | todo | devops | Medium | R1c |
| R2 | Automation Tier 2 — CI gate (GitHub Actions) | todo | devops | Medium | — |
| R3 | Automation Tier 3 — email adapter + npm ergonomics | todo | full-stack/devops | Medium | — |
| R4 | Rotate shared Neon password + update envs | todo | devops (human) | Medium | — |
| R5 | Fix local Homebrew Node (dyld/libsimdjson) | todo | chore (human) | Low | — |
| R6 | Correct stale root CLAUDE.md hosting section | todo | docs | Low | — |
| R7 | Fill governance placeholders (domain-vocabulary, Guidelines) | todo | docs | Low | — |
| R8 | Restore prod CMS build (phantom `testdelta` import on `main`) + confirm migrations Tier 1 actually live | todo | devops | High | R1b |

Status values: `todo` · `in-progress` · `blocked` · `done`.

---

## Item detail

### R1 — Image uploader fix + thumbnails + backfill  (High)
**Context:** The CMS image uploader is reported broken (the *whole* uploader, not
just bulk). Source images are 11–18 MB PNGs; uploads currently route through the
Vercel serverless function (no `clientUploads`), which caps request bodies at
~4.5 MB. Media has **no `imageSizes`/`adminThumbnail`**, so the library shows no
thumbnails. R2 *serving* works; R2 has **no CORS** configured; Cloudflare on-the-fly
resize (`/cdn-cgi/image/`) is **OFF**.
**Diagnosis (2026-07-30, cms-preview):** upload → **413 FUNCTION_PAYLOAD_TOO_LARGE**
(Vercel ~4.5 MB serverless body limit). All source images are 11–18 MB, so every
upload fails → whole uploader appears dead. **Fix path = `clientUploads` (direct
browser→R2) + R2 CORS.**
**Acceptance criteria (stub):** editor can upload a small AND a large (>4.5 MB)
image successfully; the media library shows a thumbnail per image; the 42 existing
images get thumbnails (backfill); public site still pixel-identical (0.000%).
**Notes:** schema change (`imageSizes` → new size columns) → migration. If
`clientUploads`: configure R2 CORS (PUT from the admin origin) and
`disablePayloadAccessControl`. Reference: `cms/src/collections/Media.ts`,
`cms/src/payload.config.ts` (s3Storage plugin).

### R8 — Restore prod CMS build + confirm Tier 1 live  (High)
**Context:** The migrations commit (`2095df8`) shipped a broken
`cms/src/migrations/index.ts` importing a never-committed `20260730_133343_testdelta`
migration (leftover from a dev test). `next build` has no `ignoreBuildErrors`, so the
CMS `ci:build` fails → Vercel kept the last good deploy. So **migrations Tier 1 never
actually deployed**; prod CMS is still serving the pre-migrations build (`d019791`,
label feature — functionally fine; schema was applied manually earlier). Preview is
fixed by `987b58c`; `main` still has the broken import.
**Acceptance criteria (stub):** preview CMS builds green and serves `987b58c`;
`main` build restored (via the R1b preview→main merge, which includes the fix);
prod CMS `/api/pages` served by the NEW build; `migrate` runs in `ci:build` (no-op).
**Note:** resolved as a side effect of merging R1b (clientUploads) to `main` — verify
explicitly, don't assume.

### R2 — Automation Tier 2: CI gate  (Medium)
**Context:** No CI exists (`.github/workflows/` empty). Bad merges to `main` aren't
caught before deploy.
**Acceptance criteria (stub):** a GitHub Actions PR workflow runs `tsc` (cms+site),
`payload generate:types` drift check, `pnpm build`, the pixel gate, and a
"migrations committed / no schema drift" check; failing any blocks merge.

### R3 — Automation Tier 3: email adapter + npm ergonomics  (Medium)
**Context:** No email adapter → admin password reset can't send (had to reset via
DB). Ops commands still need care around direct-endpoint/guard.
**Acceptance criteria (stub):** password-reset email sends (Resend/SMTP via env);
convenience scripts wrap seed/export/migrate with the direct endpoint + guard.

### R4 — Rotate shared Neon password  (Medium)
**Context:** The project-wide `neondb_owner` password was pasted in chat during the
release; it's shared by prod + dev.
**Acceptance criteria (stub):** password rotated in Neon; updated in Vercel
(`asecoroba-cms` Production + Preview `DATABASE_URI`) and local `cms/.env` +
`cms/.env.prod`; both `cms.ase-cor-oba.site` and `cms-preview…` return 200.

### R5 — Fix local Homebrew Node  (Low)
**Context:** Local `node` intermittently fails with `dyld: libsimdjson… not loaded`,
breaking local `pnpm`/`payload` commands (e.g. `migrate:create`).
**Acceptance criteria (stub):** `node -e 1` and `pnpm migrate:status` run cleanly.

### R6 — Correct stale root CLAUDE.md hosting section  (Low)
**Context:** Root `CLAUDE.md` "Hosting/Deployment" still says SiteGround via
GitHub Actions + rsync / `.github/workflows/deploy.yml`; reality is Vercel + Neon +
R2 (see INFRASTRUCTURE.md), and that workflow file doesn't exist.
**Acceptance criteria (stub):** the section reflects the current stack and points to
INFRASTRUCTURE.md / RELEASE.md.

### R7 — Fill governance placeholders  (Low)
**Context:** `governance/docs/rules/domain-vocabulary.md` and root
`guidelines/Guidelines.md` are still uncustomized templates.
**Acceptance criteria (stub):** domain vocabulary + guidelines filled with real
project terms (Categorías/Proyectos/case study, etc.). Note: `domain-vocabulary.md`
lives in the **governance submodule** — changing it is a submodule commit.

---

## Done archive
_(moved here when completed; full detail in `.claude/session-notes/`)_

- 2026-07-30 — Editable labels + per-field show/hide (Categorías-driven visibility),
  hero/experiencia/contacto + UX/UI case study, per-category studio/role labels.
  Shipped to prod. (commits `de787bc`…`f02262e`, merge `d019791`)
- 2026-07-30 — Automation Tier 1: Payload migrations + auto-apply on deploy +
  two-file env; dev+prod baselined; code merged to `main` (`469d2d2`). ⚠️ CORRECTION:
  did NOT actually deploy — the commit carried a build-breaking phantom `testdelta`
  import, so the CMS build failed and Vercel kept the prior deploy. Being restored via
  R8 / the R1b merge. (schema itself WAS applied to prod manually earlier.)
