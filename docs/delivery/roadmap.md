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
| R1 | Image uploader fix + thumbnails + backfill | done (preview) | full-stack + devops | High | — |
| R1b | ↳ Upload fix (clientUploads + R2 CORS + S3_BUCKET) | done (preview) | devops | High | — |
| R1c | ↳ Thumbnails foundation (imageSizes+adminThumbnail+migration) | done (preview) | full-stack | Medium | R1b |
| R1d | ↳ GENERATE thumbnails (sharp hook + backfill) — 43/43 done | done (preview) | full-stack | Medium | R1c |
| R9 | ESLint v9 flat-config missing → `pnpm lint` broken repo-wide | todo | devops | Low | — |
| R10 | Thumbnail preview COLUMN in the media library list (custom Cell) | done (preview) | full-stack | Low | R1d |
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
**Combined rollout (R8 + R1 + R10), ordered:**
1. Pre-checks (human): prod Vercel `S3_BUCKET` has NO leading space (Production scope);
   prod R2 CORS covers `https://cms.ase-cor-oba.site`.
2. Phrases: `authorize production deploy` + `authorize db migration on production`.
3. Merge `preview`→`main`, push → prod CMS `ci:build` restores the build, runs
   `payload migrate` (applies `20260730_192249_add_media_image_sizes` to prod), deploys.
4. Post-deploy (prod, `.env.prod`, direct endpoint, dbGuard):
   `pnpm --dir cms payload run src/scripts/backfill-thumbnails.ts` (generate the 42
   prod thumbnails), then `…/reset-media-list-prefs.ts` (so the preview column shows).
5. Verify: prod `/api/pages` + `/api/media` 200; a prod media doc's `thumbnailURL` = R2
   URL; admin library shows thumbnails; public site pixel-identical; test a real upload.

### R1d — Generate media thumbnails  (Medium)
**Context (locked finding from R1c):** `clientUploads` sends bytes browser→R2, so
Payload's server never runs `sharp` — `imageSizes` columns exist but stay null on
new uploads (traced in `generateFileData.ts` v3.86: returns before the resize gate
when `req.file` is undefined). So R1d must **generate** thumbnails, not just backfill.
**Recommended approach:** a Media `afterChange`/`afterOperation` hook that fetches the
R2 original, runs `sharp` to the 400px WebP `thumbnail`, writes it to R2, and sets
`sizes.thumbnail` — covers both the 42 existing images and all future uploads in one
mechanism, no infra change, keeps `clientUploads`. (Alt: Cloudflare Image
Transformations — currently OFF; infra toggle + adminThumbnail→transform URL.)
**Acceptance criteria (stub):** new uploads AND the 42 existing images show a real
thumbnail in the library; `sizes.thumbnail` populated + serves from R2; public site
pixel-identical; a one-off/backfill path covers the existing 42.
**Note:** the hook runs server-side on Vercel — mind the fn memory/time for large
originals; may need to fetch + resize a bounded set. No new schema (columns exist).

### R9 — Fix repo-wide lint (ESLint v9 flat config)  (Low)
**Context:** `pnpm lint` is broken repo-wide — ESLint v9 needs `eslint.config.js`
(flat config) and the project still has none (pre-existing, surfaced during R1d).
Governance requires lint-clean before PR, so this blocks that gate.
**Acceptance criteria (stub):** `pnpm lint` runs and passes (or reports only
pre-existing, documented issues) in cms + site.
**Fold into R2** (CI gate) if convenient.

### R10 — Thumbnail preview column in media library  (Low)
**Context:** Uploads + thumbnail generation work (R1b–R1d); `thumbnailURL` resolves to
R2 and is used in the edit view + image picker + bulk cards. But Payload 3.86's media
LIST is a table with no image column and no grid view, so the library reads as text
rows. To make it visually scannable, add a custom preview column.
**Approach:** a virtual `preview` UI field on Media with `admin.components.Cell` (client
component) rendering `<img src={row.thumbnailURL || row.url}>`; put it first via
`admin.defaultColumns`. Registered component → `pnpm generate:importmap`. Admin-only;
no schema, no migration, public site untouched.
**Acceptance criteria (stub):** the Biblioteca de Imágenes list shows a small
thumbnail per row; pixel gate n/a (admin-only); no migration.

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
