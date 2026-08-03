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

Last updated: 2026-08-03

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
| R1 | Image uploader fix + thumbnails + backfill | done (PROD) | full-stack + devops | High | — |
| R1b | ↳ Upload fix (clientUploads + R2 CORS + S3_BUCKET) | done (PROD) | devops | High | — |
| R1c | ↳ Thumbnails foundation (imageSizes+adminThumbnail+migration) | done (PROD) | full-stack | Medium | R1b |
| R1d | ↳ GENERATE thumbnails (sharp hook + backfill) — 43/43 done | done (PROD) | full-stack | Medium | R1c |
| R9 | ESLint v9 flat-config missing → `pnpm lint` broken repo-wide | todo | devops | Low | — |
| R10 | Thumbnail preview COLUMN in the media library list (custom Cell) | done (PROD) | full-stack | Low | R1d |
| R2 | Automation Tier 2 — CI gate (GitHub Actions) | in-progress | devops | Medium | — |
| R3 | Email adapter (forgot-password sends) [+ npm ergonomics = R3b] | in-progress | full-stack/devops | High | — |
| R3a | ↳ Resend adapter + `serverURL` (reset email sends + link works) | done (PROD) | devops | High | — |
| R3c | Show/hide toggle on admin password inputs | todo | full-stack | Low | R3a |
| R4 | Rotate shared Neon password + update envs | todo | devops (human) | Medium | — |
| R5 | Fix local Homebrew Node (dyld/libsimdjson) | todo | chore (human) | Low | — |
| R6 | Correct stale root CLAUDE.md hosting section | todo | docs | Low | — |
| R7 | Fill governance placeholders (domain-vocabulary, Guidelines) | todo | docs | Low | — |
| R8 | Restore prod CMS build (phantom `testdelta` import on `main`) + confirm migrations Tier 1 actually live | done (PROD) | devops | High | R1b |

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

### R3 — Email adapter (forgot-password) + npm ergonomics  (High)
**Context:** No email adapter → admin **forgot-password sends nothing** (confirmed
2026-08-02: had to reset `robertopib@gmail.com` via a guarded Local-API script against
`.env.prod`, then delete the script). Bumped to High — the owner can't self-serve
password resets until this lands. Ops commands still need care around
direct-endpoint/guard.
**Acceptance criteria (stub):** configure an email adapter (Resend or SMTP via env,
in `payload.config.ts`) so forgot-password + admin emails send from a real address;
verify a reset email arrives end-to-end on preview. Optionally keep a small guarded
`reset-user-password` ops script as a fallback.
**Status:** the email half is **done and live in PROD** — see **R3a** below (Resend +
`serverURL`, verified in prod 2026-08-03). The npm ergonomics half stays split off as
**R3b** (the only thing keeping R3 open). A UX gap found while testing (no reveal
toggle on password inputs) is logged as **R3c**.

### R3a — Resend email adapter + `serverURL`  (High) — done (PROD) 2026-08-03
**Shipped:** `@payloadcms/email-resend@3.86.0` wired as `email:` in
`cms/src/payload.config.ts`, env-driven, from `no-reply@ase-cor-oba.site`. Domain
`ase-cor-oba.site` verified in Resend (MX/SPF on the `send` subdomain +
`resend._domainkey` DKIM, all grey/DNS-only in Cloudflare — existing apex mail
preserved). Confirmed end-to-end on cms-preview: email arrives, reset link works.
No schema, no migration, public site untouched. Commits `7121be3`, `a8897da`.
**New env vars** (Vercel `asecoroba-cms`): `RESEND_API_KEY`,
`EMAIL_DEFAULT_FROM_ADDRESS`, `EMAIL_DEFAULT_FROM_NAME` (same in both scopes) +
`PAYLOAD_SERVER_URL` — **differs per scope**: Preview
`https://cms-preview.ase-cor-oba.site`, Production `https://cms.ase-cor-oba.site`.
**Gotcha (locked finding):** the adapter alone was NOT enough — the first reset
email's link was a *relative* `/admin/reset/<token>`, which mail clients reject as
an invalid address. Payload's `getRequestOrigin` returns `config.serverURL` if set,
otherwise trusts the request `Host` **only** when that origin is in the CORS/CSRF
allowlist, else falls back to `''`. We had set neither → host-less link. **Any
Payload deploy that sends email needs an explicit `serverURL`.**
**Prod rollout: DONE 2026-08-03** — all four vars confirmed in the Production scope
(incl. `PAYLOAD_SERVER_URL=https://cms.ase-cor-oba.site`), merged `preview`→`main`
(`841d736`, no-ff) on `authorize production deploy`. No DB migration. Prod `/admin`
+ `/api/pages` + public site all 200; **forgot-password verified in prod by the
owner**. Full record: `.claude/session-notes/2026-08-03-R3a.md`.

### R3c — Show/hide toggle on admin password inputs  (Low)
**Context:** Surfaced during R3a's reset-password test. Payload's password inputs
have no reveal control, so the owner can't see what they're typing — awkward on the
reset screen where a typo is only caught by the confirm field. Not configurable:
`@payloadcms/ui`'s `PasswordInput` hardcodes `type: "password"` with no toggle prop
(`node_modules/@payloadcms/ui/dist/fields/Password/input.js`), and
`@payloadcms/next`'s `ResetPasswordForm` composes Payload's own `PasswordField` /
`ConfirmPasswordField`.
**Approach (decided):** a small client component registered via
`admin.components.providers` in `cms/src/payload.config.ts` that adds an accessible
reveal toggle to every password input. Covers reset + login + account + new-user in
one place, and doesn't fork Payload internals (so it survives upgrades). Rejected
alternative: copying `ResetPasswordForm` to swap the input — duplicates internal
code, fixes only that one screen, breaks on upgrade.
**Notes:** admin-only → **pixel gate n/a**, no schema, no migration. Registered
component → run `pnpm generate:importmap` (same as R10's Cell component). Toggle
must be a real `<button type="button">` (never submits), with `aria-label` +
`aria-pressed`, 32×32px min touch target, and must default to hidden.
**Acceptance criteria (stub):** every admin password field shows a reveal toggle
that switches the input between masked/plain; keyboard-accessible and screen-reader
labelled; defaults to masked; reset + login + account screens all work.

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
  two-file env; dev+prod baselined; code merged to `main` (`469d2d2`). ⚠️ That merge
  did NOT deploy (build-breaking phantom `testdelta` import → Vercel kept prior build).
  ✅ RESOLVED 2026-07-31 by R8 (merge `db0109c`): phantom import removed, prod CMS
  build green, `payload migrate` runs in `ci:build` (no-op; migrations applied via
  direct endpoint). Migrations Tier 1 is now genuinely live.
- 2026-07-31 — **R1 + R10 shipped to PROD** (merge `db0109c`): image uploads
  (clientUploads direct→R2, R2 CORS, S3_BUCKET fix), media thumbnails (imageSizes +
  self-generated via sharp hook; migration `…_add_media_image_sizes` applied to prod),
  backfill 42/42, and the media-library thumbnail column. Verified: prod thumbs serve
  from R2, API 200, public site pixel-identical. First real schema change through the
  auto-migration workflow. (adminThumbnail→R2-URL fix `c8728e1` for the proxy-500.)
- 2026-07-31 — **Delivery workflow** (this file + templates + playbook + `/next-task`
  `/log-outcome` + session-notes) shipped (`623648a`), now proven across R1b→R10.
- 2026-08-03 — **R3a shipped to PROD** (merge `841d736`): Payload transactional email
  via `@payloadcms/email-resend`, domain `ase-cor-oba.site` verified in Resend, plus the
  `serverURL` config the reset link needs to be absolute. The owner can now self-serve
  password resets; verified in prod. First deploy with no schema change/migration.
  **Locked finding:** any Payload deploy that sends email must set `serverURL`, or
  generated links come out host-less and mail clients reject them.
