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

Last updated: 2026-08-10

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
- **PR-only on both branches** (as of 2026-08-03, R2; check list widened 2026-08-04, R25).
  `main` *and* `preview` are protected: pull request required, all **6 CI checks**
  required, `enforce_admins: true` (no bypass, including the owner), force-push and
  deletion disabled. The six, spelled as GitHub matches them (the job's `name:`, not its
  YAML key — a typo here silently protects nothing):
  `Repo integrity (migrations, lockfiles)`, `CMS (frozen install, type drift, build)`,
  `Site (frozen install, build)`, `Site typecheck (tsc --noEmit)`,
  `Tests (vitest, offline)`, `Pixel parity (head vs merge base, 0.000%)`.
  **Direct pushes to `preview` are rejected** — every task now works on a feature
  branch and opens a PR. This is what makes `pixel-parity` (a `pull_request`-only
  job) actually gate preview work. Escape hatch if CI itself breaks:
  `gh api -X DELETE repos/robertopib/Portafolio-AseCorOba/branches/<b>/protection/enforce_admins`.
- **How to edit branch protection** (as of 2026-08-04, R25). Three rules, each earned:
  1. **`PATCH .../protection/required_status_checks`, never `PUT .../protection`.** The
     sub-resource payload does not carry `enforce_admins` / `allow_force_pushes` /
     `allow_deletions`, so they cannot be clobbered by omission — which is exactly how R2
     silently disabled enforcement. The `contexts` array **replaces**: read the current
     value first and resend every context you want kept.
  2. **Send `checks` with `app_id: 15368`** (GitHub Actions), not bare `contexts`, so a
     third-party app cannot satisfy a required check by reporting a same-named status.
     **Copy each job name verbatim from a live run** (`gh api …/commits/<sha>/check-runs`) —
     GitHub matches the job's `name:`, not its YAML key, and a typo protects nothing silently.
  3. **Prove enforcement by behaviour, never by the API response.** Two probes: a real push
     that is actually rejected (`! [remote rejected] … protected branch hook declined`, and
     the ref unmoved), and — to show a check is *required* rather than merely reported — get
     a green PR to `mergeStateStatus: CLEAN`, then re-run **one** job
     (`POST /actions/jobs/<id>/rerun`) and watch it flip to `BLOCKED` with that check as the
     only non-green one. GraphQL `isRequired(pullRequestNumber:)` corroborates per context.
     **Never disable `enforce_admins` to make a probe easier** — that is R2's mistake.
- **Visual regression is settled — do not re-litigate.** The CMS-churn objection
  ("the front page changes constantly, so a baseline goes stale") does **not** apply:
  `pixel-parity` stores no baseline, diffs merge-base vs head against the *same*
  committed `content/*.json` fixtures, and editor publishes never trigger CI (publish
  → Vercel deploy hook, no GitHub involvement). Editor activity generates zero pixel
  noise. `scripts/shoot.mjs` + `scripts/diff.mjs` stay as-is. Admin UI is never
  pixel-tested. Evidence: `.claude/session-notes/2026-08-03-R2.md`.
- **Testing standard = `docs/testing-standards.md`** (as of 2026-08-03, R11). The
  upstream `governance/docs/rules/testing-standards.md` is generic submodule boilerplate
  shared with other projects and is **not binding here**; where the two disagree the
  project file wins, and its §7 deltas table records every departure. Binding
  consequences:
  - **No coverage-percentage target, ever.** The upstream 80% rule is dropped: 48 of the
    site's 83 files (58%) are vendored shadcn, so a ratio is cheapest to satisfy by
    rendering static markup — it rewards the tests the standard forbids and says nothing
    about content shape or twin drift. Required coverage is by **named risk category**
    (§2); the ratio is never measured. Also dropped: snapshot-per-presentational-component,
    loading-state verification (no async UI exists), and the code-type layer matrix.
  - **Kept non-negotiable:** a bug fix ships a regression test that fails without the fix.
  - **E2E is deferred, not omitted** — the only true end-to-end flow (publish) needs auth
    + live Neon + a real deploy hook, all forbidden in CI. Reopen only when publish gains
    real logic. **Adopting Playwright later does NOT reopen the visual-regression
    decision** — `shoot.mjs`/`diff.mjs` stay as-is regardless.
  - **Tooling — INSTALLED as of R12** (2026-08-04, merge `4ceeaf0`). ~~recommended, not yet
    installed~~; ~~introduces the site's first TypeScript dependency~~ (R17 landed that
    first, so R12 inherited a clean `strict`/0-error foundation). The shape below is what
    R13 and everything after it inherits — **do not re-derive it per task**:
    - **Vitest + React Testing Library + jsdom**, 3 dev deps, **root lockfile only**.
      `cms/pnpm-lock.yaml` is never touched by a test change.
    - **`vitest.config.ts` MERGES `vite.config.ts`.** One source of truth for module
      resolution — a test must resolve an import exactly the way the shipped build does.
      Never restate a `resolve` option in the test config.
    - **ONE tsconfig.** `include: ["src", "tests"]`; tests typecheck under the same `strict`
      options as `src/**`. `tests/env.d.ts` supplies `vite/client` for `?raw` and
      `import.meta.glob`, so **`@types/node` stays out** (it would change `setTimeout`'s
      return type across all 83 site files).
    - **`environment: 'node'` by default**; DOM suites opt in per file with a
      `@vitest-environment jsdom` docblock. **`globals: false`** — import `describe`/`it`/
      `expect` explicitly.
    - Layout per `docs/testing-standards.md` §4: co-located `*.test.ts` for units,
      `tests/{fixtures,renderers,invariants,fidelity}/` for the rest. `tests/fidelity/` is
      R13's slot and is already covered by the config's `include`.
  - **A co-located test file is a Tailwind SOURCE file** (measured, R12). `@source` in
    `src/styles/tailwind.css` scans `src/**` as *text*, so a class name written in an
    assertion becomes a real CSS rule and moves the shipped bundle — i.e. it reddens
    `pixel-parity` for a change that touches no markup. Same mechanism as R17's "static"
    comment. **`@source not '../**/*.test.{ts,tsx}'` is load-bearing — do not remove it**,
    or move tests out of `src/`.
  - **Pin the invariant, never the census.** Content counts move constantly by design (the
    localized-pair total went 2,709 → ~3,045 in one day). Assert *properties* — zero
    asymmetric `{es,en}` pairs, key-set parity, **used ⊆ registered** — never a number. Where
    a count is unavoidable it is a **labelled vacuity floor** set far below measured values,
    there only so "the walker found nothing" fails instead of passing green.
  - **A vanished section is REPORTED, not thrown** (R12). Unknown `blockType`
    (`PageRenderer`) and unknown `layoutVariant` (`CategoryGalleryBlocks`) `console.error`
    naming the value, the page and where to fix it, and still return `null`. Not a throw —
    that blanks the page. Not dev-only — the failure happens on the production rebuild
    against the live CMS. **Local degradation is R18's job; do not re-litigate the
    reporting.**
  - **The two twins gate differently, on purpose** (R13a, 2026-08-06). `export-content.ts` is a
    verification tool nothing depends on → **fidelity gate ON by default** (`FIDELITY_GATE=0`
    opts out). `scripts/fetch-content.mjs` is the build's content **producer** —
    `vercel.json`'s `buildCommand` is `node scripts/fetch-content.mjs && pnpm build`, so a
    non-zero exit **aborts the deploy**, and a diff from `git HEAD` is the *normal* result of
    an editor publish. It therefore detects and reports identically but exits non-zero only
    under `--gate` / `FIDELITY_GATE=1`. **Do not "fix" this asymmetry into symmetry** — that
    reds every production deploy. Before requiring any script to exit non-zero, check what
    invokes it.
  - **Fidelity comparisons use serialized BYTES, never parsed objects** (R13b, 2026-08-07). The
    twins' contract is byte-identical JSON *text*. An object diff **invents** differences (a key
    valued `undefined` exists in memory but `JSON.stringify` drops it) **and misses real ones** —
    key-order changes are invisible to it and are exactly what a hand-edit to one mirrored
    emitter produces. `deepDiff` explains a byte failure by naming the path; it never decides one.
  - **A hand-mirror is not a mirror until something checks it** (R13b). Proof: R13a's own commit
    `5830a00` created two copies of `formatFidelityFailure` **with different failure text**, and
    nothing noticed until a mirror test existed. Cross-project duplication is permitted where
    collapsing it would risk the CMS deploy (`cms/` is a separate Vercel root directory) — but it
    **must be covered by an equivalence test** driving both copies over the same inputs.
  - **Payload Local API integration tests are local-only, never in CI.**
  - **A new CI job gates nothing until branch protection is updated by hand** (`gh api`,
    both branches) and verified with a real push. Promote a job to *required* only after
    **two green runs**. Done for `typecheck` + `tests` in R25 — see the
    **branch-protection edits** entry below for the mechanics.
- **Governance precedence — `governance/` is non-binding where a project file disagrees**
  (locked 2026-08-10, R33; generalizes R11's testing-only clause to the whole submodule).
  `governance/` is upstream boilerplate **shared with other projects**. Where a project file
  disagrees with `governance/docs/rules/`, **the project file wins**, and its Deltas section
  records every departure and why. **Never edit `governance/` in place** — override in a
  project file (**R20** is the sole exception).
  **Safety floor — four things are NOT overridable** (adopted from upstream D3/LD-05, which
  drew it from an observed failure: a sibling project running production Stripe with no
  authorization phrases at all). Content is tailorable; **the mechanism is not removable**,
  and dropping one needs named human sign-off, not a table row:
  1. **Authorization phrases** — `authorize production deploy`, `authorize db migration on
     production`. 2. **Destructive-operations protocol.** 3. **Secrets and PII handling.**
  4. **Protected branches** (R2: PR-only, 6 required checks, `enforce_admins: true`).
  **This must live in root `CLAUDE.md`, not only here.** A worker that reads `CLAUDE.md` and
  nothing else must learn that upstream is non-binding — otherwise it reads the still-live
  80% coverage mandate (`governance/docs/rules/testing-standards.md:77`, re-imported 3× by
  `testing-qa.agent.md`) as law and writes exactly the tests our standard forbids.
- **Owner reviews on preview before ANY promotion to production** (locked 2026-08-11, at the
  owner's instruction: *"this is how the pipeline should always work"*).
  **Nothing reaches production that the owner has not seen on `preview` first.** This closes a
  real hole rather than restating existing practice: `RELEASE.md`'s owner spot-check was
  **step 6 — after production deployed**, so the runbook had the owner discovering problems in
  production. It is now **step 0**, before the pre-flight.
  - Review surfaces: the public site at `preview.ase-cor-oba.site`, and — for schema or
    content-model work, which is frequently invisible on the site — the CMS admin at
    `cms-preview.ase-cor-oba.site`.
  - **A change that is deliberately invisible on preview must say so, and say what to inspect
    instead.** "Nothing to see" is a finding to state, never a step to skip. An additive
    migration is the normal case (R23b-i: the site was byte-identical *by design*, and the
    evidence was 20 parents and 16 clients in the admin).
  - **Reviewing is not authorising.** `authorize production deploy` is a *separate* gate that
    comes afterwards; typing it does not imply a review happened, and a review does not imply
    consent to deploy.
  - **Conductor obligation:** every task prompt whose change could reach production must state
    what the owner should look at on preview — or state plainly that there is nothing to see
    and why.
- **CI is offline and DB-free.** No secrets, no live Neon: the CMS build and
  `generate:types` use an unreachable placeholder `DATABASE_URI` (verified Payload
  never connects), `payload migrate` runs only in Vercel's `ci:build`, and
  `fetch-content.mjs` is not run in CI (committed content keeps builds
  deterministic, so a CMS outage cannot redden a PR).

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
| R2 | Automation Tier 2 — CI gate (GitHub Actions) | done (preview) | devops | Medium | — |
| R3 | Email adapter (forgot-password sends) [+ npm ergonomics = R3b] | in-progress | full-stack/devops | High | — |
| R3a | ↳ Resend adapter + `serverURL` (reset email sends + link works) | done (PROD) | devops | High | — |
| R3c | Show/hide toggle on admin password inputs | todo | full-stack | Low | R3a |
| R4 | Rotate shared Neon password + update envs | todo | devops (human) | Medium | — |
| R5 | Fix local Homebrew Node (dyld/libsimdjson) | todo | chore (human) | Low | — |
| R6 | ↳ folded into R38 — root `CLAUDE.md` misinforms agents | done (via R38) | docs | **Medium** (was Low) | — |
| R7 | Fill governance placeholders (domain-vocabulary, Guidelines) | todo | docs | Low | — |
| R8 | Restore prod CMS build (phantom `testdelta` import on `main`) + confirm migrations Tier 1 actually live | done (PROD) | devops | High | R1b |
| R11 | Project-calibrated testing standards (`docs/testing-standards.md`) | done (preview) | qa | Medium | R2 |
| R12 | Content-resilience tests — the gap CI structurally cannot see | done (preview) | qa/full-stack | Medium | R11, R17 |
| R13 | Fidelity-twin test + repair the 90%-blind local gate (split → R13a/R13b) | **done (preview)** | full-stack | High | R11 |
| R13a | ↳ Repair the local fidelity gate (compare all 4 files, fail loudly) + R16 | done (preview) | full-stack | High | R11 |
| R13b | ↳ Twin-equivalence test — prove both emitters agree, fail on induced divergence | done (preview) | full-stack | High | R13a |
| R14 | Dead file `src/styles/globals.css` — imported by nothing (footgun) | todo | chore | Low | — |
| R15 | `pnpm/action-setup@v4` Node-20 deprecation warning in CI | todo | devops | Low | R2 |
| R16 | `export-content.ts` header contradicts its behaviour (writes committed content) | done (preview) | docs/chore | Low | — |
| R17 | Site has no typechecker at all (no root tsconfig, no `typescript` dep) | done (preview) | devops | Medium | — |
| R25 | `typecheck` + `tests` → required checks (one branch-protection edit) | done (preview) | devops | Low | R17, R12 |
| R26 | TypeScript major skew: root **7.0.2** vs `cms` **6.0.3** | todo | devops | Low | R17 |
| R27 | ↳ absorbed into R30 — RELEASE.md staleness | done (via R30) | docs | Low | — |
| R32 | `export-content.ts` header mis-describes why `FIDELITY_GATE=0` exists | todo | docs/chore | Low | R30 |
| R28 | Gate can lose its whole report when output is piped (`console.*` then `process.exit`) | done (preview) | full-stack | Medium | R13a |
| R31 | ~~Same `console.*`-then-`exit` in 3 more CMS scripts~~ — **premise disproved, closed without work** | closed (not a defect) | full-stack | — | R28 |
| R39 | Scheduled non-required "is the exit-flush race still live?" job (multi-host sampling) | todo | devops/qa | Low | R37, R25 |
| R29 | `POST /api/publish` handler unit test (§2 item 3) — closes risk 3 | done (preview) | qa/devops | Low | R12 |
| R30 | Docs tell the truth: `docs/testing-standards.md` ×10 + RELEASE.md (absorbed R27) | done (preview) | qa/docs | Low | R29, R28 |
| R18 | No error boundary in `src/` — one missing CMS field blanks the whole page | todo | full-stack | Medium | — |
| R19 | `POST /api/publish` returns HTTP 200 when the deploy hook is unconfigured | todo | devops | Low | — |
| R20 | Promote R11's testing deltas upstream into the governance submodule | todo | docs | Low | R11 |
| R21 | Media picker unusable — "elegir existente" can't select (R10 regression) | done (PROD) | full-stack | High | R10 |
| R22 | Media picker ergonomics — `alt` editing in the drawer (select affordance now fixed) | todo | full-stack | Low | R21 |
| R23 | Content model: "Proyecto" conflates project + photo + placement (**split**) | split | full-stack | **High** | R12, R13 |
| R23a | ↳ Target model + backfill mapping — **superseded in part: `Cliente` was missing** | done (preview) | full-stack | **High** | R13 |
| R23a-ii | ↳ Revise for the `Cliente` axis + client worksheet — **blocked: 18 cells need the owner** | done (preview) | full-stack | **High** | R23a |
| R23b | ↳ Implement Option A (**split**) | split | full-stack | **High** | R23a-ii |
| R23b-i | ↳↳ Additive migration + backfill — **done on preview/dev; PROD PENDING** | done (preview) | full-stack | **High** | R23a-ii |
| R45 | Production pre-flight — **VERDICT: backfill does NOT fit prod (58/41 vs 57/40)** | done (preview) | devops | **High** | R23b-i |
| R46 | `placement: 'both'` honoured by one exporter, dropped by the other | done (preview) | full-stack | Medium | — |
| R48 | Fixture media 1–7 are shared by several projects — assertions can pass vacuously | todo | qa | Low | R46 |
| R47 | Prod brand rename is half-done — `ui.json` `en.nav.brand` still reads the old name | todo | content | Low | — |
| R49 | Make R23b-i's backfill survive a prod/dev row-count difference | done (preview) | full-stack | **High** | R23b-i, R45 |
| R50 | Commit the prod pre-flight as `cms/src/scripts/r23-preflight.ts` (must re-run per promotion) | todo | devops | Low | R49 |
| R51 | Reassign `1.jpg`'s real client — `—` is a placeholder, not an answer | todo | content | Low | R49 |
| R23b-ii | ↳↳ **Exporter flattening + byte-identity proof** (no cleanup) | in-progress | full-stack | **High** | R23b-i, R45, R49 |
| R23b-iii | ↳↳ Cleanup migration — drop old columns + duplicate rows, **after prod byte-identity** | todo | full-stack | **High** | R23b-ii, promotion |
| R43 | **Dev CMS diverges from committed content in 3 files — preview renders the dev values** | todo | full-stack | **Medium** | — |
| R44 | `payload migrate:create` emits a broken `down` for new collections | todo | docs | Low | R23b-i |
| R24 | Project detail pages (Option B) — deliberate public redesign, breaks the pixel gate by intent | todo | product-designer + full-stack | Medium | R23 |
| R33 | Governance bump `e85041e`→`fddf95b` + precedence clause into root `CLAUDE.md` (T1+T2) | done (preview) | devops/docs | Medium | — |
| R34 | Record deltas for the 5 incoming upstream files that conflict with our practice | done (preview) | docs | Medium | R33 |
| R40 | `governance/.claude/rules/` templates — **premise confirmed**: they load on the first Read under `governance/`; excluded | done (preview) | docs | **Medium** | R33 |
| R41 | ~~Committed `.claude/settings.json` for `claudeMdExcludes`~~ — **closed dormant, owner's decision** | closed (dormant) | devops | Low | R40, R37 |
| R37 | `exit-flush` vacuity guard no longer gates — samples aren't independent | done (preview) | qa | Medium | R28 |
| R38 | Root `CLAUDE.md`: override-hierarchy note (+ R6 folded in) — **done, watch upstream F2** | done (preview) | docs | Medium | R33 |
| R42 | Census claims in `governance-deltas.md` §2.2 go stale within a day — should it assert any? | todo | docs | Low | R34, R38 |
| R35 | `.claude/agents/full-stack.md` + `devops.md` in `qa.md`'s shape (T5) | todo | docs | Low | R33 |
| R36 | Move `docs/testing-standards.md` → `docs/rules/` mirrored path (upstream D3/LD-04) | todo | docs | Low | R33, upstream D3 landing |

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
**⚠️ Shipped a High regression → R21.** Putting the custom `preview` Cell **first** in
`defaultColumns` took over the drawer's linked column, which is the only cell that carries
`onSelect` — so "elegir existente" became unusable and reached prod. Lesson for any future
custom Cell: **never make it column 0** unless it wires selection itself.

### R11 — Project-calibrated testing standards  (Medium)
**Context:** The repo has **zero tests and zero test tooling** (no runner, no `test`
script, no test files, either project). `governance/docs/rules/testing-standards.md`
is generic **submodule** boilerplate shared with other projects: 80% line coverage, a
full unit/integration/E2E matrix, snapshot tests per presentational component —
applied literally to ~83 mostly-presentational files with vendored shadcn it produces
pure busywork. A project-local QA agent exists at `.claude/agents/qa.md`; this task is
the agent authoring the calibrated companion standard.
**Acceptance criteria (stub):** `docs/testing-standards.md` exists with the risk
ranking, layer assignment (concrete example per layer from real files), explicit
non-goals *with reasons*, a tooling recommendation with tradeoffs, a calibrated
Definition of Done, CI integration + runtime budget, and a deltas-from-upstream
table. Recommendations sequenced so item 1 ships alone. **Rules only** — no tooling
installed, no lockfile touched, submodule not edited.
**Locked decision:** visual regression is **settled, not open**. `pixel-parity`
already guards the public design invariant and is immune to CMS content churn (it
diffs merge-base vs head against the *same* committed fixtures, stores no baseline,
and editor publishes never trigger CI). `shoot.mjs`/`diff.mjs` stay as-is. Do not
re-litigate — see `.claude/session-notes/2026-08-03-R2.md`.
**Status: done (preview)** 2026-08-03 — `docs/testing-standards.md`, 426 lines, 7
sections + a gotchas section. Commit `77a08a9`, PR #4 → merge `b0ecb43`. Docs-only:
one added file, submodule untouched (SHA still `e85041e`), no lockfile/CI change, no
runner installed. All 4 required checks green; `pixel-parity` 0.000%. The rules it
locked are now in **Locked decisions** above. Full record:
`.claude/session-notes/2026-08-03-R11.md`.
**Five defects found while writing it** (each verified in source, none fixed here —
this was a rules-only task): the fidelity-gate blind spot (folded into **R13**), plus
**R16**–**R19**. R11 also produced a list of upstream-promotion candidates → **R20**.

### R12 — Content-resilience tests  (Medium)
**Context:** The largest untested gap, and it is structural: CI builds the site
against committed `content/*.json` fixtures, but production rebuilds against the
**live CMS** via the publish hook, which never touches GitHub Actions. **The deployed
site is never the artifact CI validated.** A 400-character heading, a portrait image
where the layout assumes landscape, or an empty field a renderer assumes is populated
ships to production unseen. Content changes continuously by design; public code is
frozen (17 commits/6 months).
**Layer + tooling: SETTLED by R11** — see `docs/testing-standards.md` §2/§4 and Locked
decisions. Integration (jsdom, **synthetic** fixtures — never live CMS data) for the
renderers, plus a node invariant check over committed `content/*.json`. Runner: Vitest +
RTL + jsdom.
**R11 sharpened why this is invisible** (all verified, ~~no typechecker~~ **superseded by
R17 — see below**): there is **no error boundary anywhere in `src/`**, so
`HeroSection.tsx:50` indexing `title[language]` unguarded means one missing field **blanks
the whole page**. Also: no `line-clamp`/`truncate` in any project-owned component, 22
fixed-aspect `overflow-hidden` containers, and `PageRenderer.tsx` silently drops an unknown
`blockType` (a renamed CMS block deletes a live section with zero signal).
**⚠️ `docs/testing-standards.md` is partly STALE as of R17 — the worker must not trust it
blindly.** It was written 2026-08-03, before the typechecker existed. Wrong now: §1's fact
table row 3 ("no TypeScript dependency and no `tsconfig.json`"), §1's "the types are
decorative" paragraph, §4's tooling-cost row ("Vitest brings the first TypeScript
dependency"), and §8's first gotcha. **Still true and still the point:** types cannot
validate *runtime* CMS data — `PageRenderer.tsx:230-232` says so explicitly, in a comment
R17 left pointing at this task. R12 should correct those four spots as part of the work.
**Line refs shifted in R17** — re-verified 2026-08-04 against `origin/preview`: the block
registry is `PageRenderer.tsx:65-114` (was `:45-94`), and the unknown-`blockType` drop is
now `:233-237` (was `:206-209`). `HeroSection.tsx:50` and `LanguageContext.tsx:26` are
unchanged.
**Measured baseline — ⚠️ re-measured 2026-08-04 and it MOVED.** The R11 figure was 2,709
localized `{es,en}` pairs / 56 both-empty; it is now **3,050 pairs / 59 both-empty** across
14 content files. What did **not** move: **0** pairs with `es` populated and `en` empty, and
`ui.json` still at **73/73** with identical key sets. **Pin the invariant, never the census.**
A test asserting `pairs === 3050` is guaranteed to redden on the next legitimate
`fetch-content` commit while catching no risk whatsoever. Assert: zero asymmetric pairs,
`ui.json` key-set equality, and every `blockType` present in the registry.
**Block-registry invariant re-verified 2026-08-04:** 28 registry entries, 20 `blockType`s
used in `pages.json`, **0 used-but-unregistered** (nothing is silently vanishing today), 8
registered-but-unused. Assert the *used ⊆ registered* direction only — the 8 unused entries
are legitimate (blocks available to editors but not currently placed), so asserting the
reverse would fail immediately.
**Acceptance criteria (stub):** renderers survive hostile-but-legal content
(over-long strings, empty optional fields, wrong-aspect images, missing `en`) without
layout collapse; failures are loud, not silent. **Plus the R21 debt:** a config invariant
asserting `Media.admin.defaultColumns[0]` names a field with **no custom `Cell`** (or that
the Cell wires `onSelect`) — R21 shipped a prod fix without a regression test because no
runner existed; this is where that test lands. Cheap, no admin rendering.
**Sequencing note:** installing Vitest is a **root lockfile change** — confirm
`scripts/ci/check-lockfiles.mjs` tolerates it. ~~expect first-time site type errors~~ —
**resolved: R17 landed first and R12 now inherits a clean foundation** (2026-08-04): root
`tsconfig.json` (full `strict`, **0 errors**), `typescript` + React-18 `@types/*`, `react` +
`react-dom` promoted to **direct** dependencies, a working `@/*` alias, and a green
`typecheck` CI job. The feared "surprise pile" never materialised — it was 29 errors from 2
root causes, all fixed at source. Add the `tests` CI job here, but make it a *required* check
only after two green runs (Locked decisions).
**Inherited constraints from R17 — read before touching config:**
- **Extend `tsconfig.json`, do not add a second one.** R17 wrote it expecting exactly this,
  with `include: ["src"]` and a comment saying R12 extends it.
- **`noUncheckedIndexedAccess` is the named ratchet, deliberately off.** It flags every
  `content.x[language]` read (e.g. `HeroSection.tsx:50`) — real risk, but the fix is runtime
  guards + an error boundary, i.e. **R18** work that changes behaviour. Turn it on when R18
  lands, not here, and never silence it with `!`.
- **`pnpm.overrides` pins `@types/react` 18.3.31 / `@types/react-dom` 18.3.7.** Do not remove
  them: an incremental install otherwise leaves a stray `@types/react@19` in pnpm's hoisted
  peer dir and produces ~200 phantom TS2786 errors from duplicate `ReactNode`. The R17 worker
  hit this for real.
- **A prose comment in `src/` can move the stylesheet** — Tailwind v4's
  `@source '../**/*.{js,ts,jsx,tsx}'` extracts candidates from comment text; the word
  "static" emitted a stray `.static{position:static}` rule and changed the CSS bundle. If
  `pixel-parity` reddens on a comment-only change, this is why.
- Root TS is **7.0.2**, `cms` is **6.0.3** (**R26**). If the runner spans both projects per
  `docs/testing-standards.md` §4, resolve that skew deliberately.

**Status: done (preview)** 2026-08-04 — PR #9, merge `4ceeaf0`. **78 tests, 1.5 s local /
36 s in CI** including install (budget 60 s). Vitest + RTL + jsdom, 3 dev deps in the root
lockfile; `cms/pnpm-lock.yaml` untouched. `pixel-parity` **0.000%** across all 24 shots,
`typecheck` 0 errors, **CSS bundle byte-identical**, JS +790 B (the two `console.error`
strings). Four layers shipped: renderer integration (jsdom, synthetic hostile fixtures),
committed-content invariants, `contentMeta` units, and the R21 config invariant — **R21's
regression-test debt is now paid.** Every test names the bug it would have caught; every
group was verified by breaking the code and watching it go red (**21 mutations, all red,
all restored**). Post-merge CI on `preview` green. Details:
`.claude/session-notes/2026-08-04-R12.md`.

**Two findings from this task that bind future work** (both now in Locked decisions):
- **A co-located test file is a Tailwind source file.** `@source` scans `src/**` as text, so
  class names in an assertion become real CSS rules — measured: one probe test added
  `.static`, `.line-clamp-2`, `.truncate` to `dist` and moved the bundle. Fixed with
  `@source not '../**/*.test.{ts,tsx}'` in `src/styles/tailwind.css`. This is R17's gotcha
  arriving at exactly the file layout the standard mandates. **Keep that line.**
- **Two mutations found real gaps in the worker's own first draft**, which is the argument
  for the break-the-code rule: (a) removing `object-cover` from ONE gallery variant passed
  against a single-variant test — the suite now sweeps all 11 variants from the exported
  dispatcher, so a new variant is covered automatically; (b) breaking the content glob or
  the `{es,en}` walker turned the whole invariant file green, hence the labelled vacuity
  floors.

### R13 — Fidelity-twin test + repair the local gate  (High)
**Context:** `scripts/fetch-content.mjs` (REST, build-time) is a hand-maintained
*line-for-line mirror* of `cms/src/scripts/export-content.ts` (Local API) — two
implementations of one contract that must emit **byte-identical** JSON, kept in sync
by hand. A silent divergence corrupts every published page.
**⚠️ Bumped Medium→High by R11: the existing local gate is ~90% decorative.** Verified,
with line refs:
- The **REST twin diffs everything** — all files go through `emit()`
  (`scripts/fetch-content.mjs:154-162`) and are deep-diffed against `git HEAD`
  (`:1058-1084`).
- The **Local-API twin does not.** `emit()` diffs only what it routes
  (`export-content.ts:104-109`), but `pages.json` (`:653-657`), `categories.json`
  (`:689-694`) and `case-studies.json` (`:1011-1016`) are written **straight into
  `content/`** with a hardcoded `report[…] = { match: true, diffs: [] }`.
  **Measured: 598,916 of 664,086 committed content bytes = 90.2% reported as matching
  without ever being compared.**
- **Neither gate can fail anything.** `fetch-content.mjs:1084` logs `allMatch` and
  continues; `export-content.ts:1026-1031` catches every error, writes
  `/tmp/export-error.json`, and calls `process.exit(0)`.
So this is not "add drift detection to a working gate" — **the gate must be repaired as
part of the task.** A green fidelity report is currently weak evidence.
**⚠️ SPLIT 2026-08-06 into R13a + R13b — this item is not atomic.** (a)+(b) are a surgical,
same-file repair that makes the gate real immediately; (c) is an architectural task needing
fixture capture and probably a refactor of two ~1,050-line files. Bundling them means the
valuable small fix waits on the hard one, and `docs/testing-standards.md` §2 explicitly warns
*"Do not bundle these… a big-bang suite gets abandoned."* You also cannot write a meaningful
equivalence test on a gate that hardcodes `match: true`, so the order is forced.
**Original acceptance criteria, now divided:** (a) the three un-diffed files are actually
compared and the hardcoded `match: true` is gone → **R13a**; (b) both gates exit non-zero on
mismatch → **R13a**; (c) an automated check proves both paths produce identical output for
the same CMS state and fails on an **induced** divergence → **R13b**. Both must respect the
no-live-DB-in-CI constraint (fixture or throwaway DB, never prod/dev Neon).

### R13a — Repair the local fidelity gate (+ R16)  (High)
**Re-verified in source 2026-08-06** (the R11 measurements still hold exactly):
- Hardcoded `match: true` at `export-content.ts:657` (`pages.json`), `:694`
  (`categories.json`), `:1016` (`case-studies.json`) — each written **straight into
  `CONTENT_DIR`** (`:653`, `:690`, `:1012`) instead of `OUT_DIR` (`:28` = `/tmp/export-out`)
  like every `emit()`ed file.
- **Byte share re-measured and unchanged: 598,916 / 664,086 = 90.2%** across 14 content
  files (`pages.json` alone is 537,374 bytes = 80.9%).
- **`allMatch` is computed and then discarded.** `export-content.ts:1019` computes it, `:1021`
  writes it to `/tmp/fidelity-report.json`, and **nothing ever reads it**. `process.exit(0)`
  at `:1031` sits *outside* the `try/catch` (`:1027-1030`), so even a thrown error exits 0.
- **The REST twin's `exit(1)` does NOT cover this.** `fetch-content.mjs:1092` exits 1 only
  from `main().catch(...)` — an unhandled throw. The fidelity path at `:1079-1084` sets
  `allMatch=false`, logs it, and returns normally → **exit 0**. Don't mistake the existing
  `exit(1)` for a working gate.
- **NEW (found 2026-08-06, not in R11's list): a FOURTH direct write.** `site.json` is
  written straight to `CONTENT_DIR` at `:259` and is **not in `report` at all** — not even a
  fake `match: true`. It is 546 bytes, so it barely moves the percentage, but it means the
  report is silently *incomplete* as well as partly fabricated. Fix it in the same pass.
- The comment at `:263-266` claims `pages.json` "has no pre-existing hand-authored source to
  fidelity-diff against". That was true once; the file is committed now, so the stated reason
  no longer holds. Decide deliberately: compare against the committed file like everything
  else, or document why not.
**Acceptance criteria (stub):** all four files are genuinely compared (no fabricated
`match: true`, no file missing from `report`); a mismatch makes **both** twins exit non-zero;
`allMatch` is actually consumed rather than written and forgotten; a swallowed exception no
longer produces exit 0; **R16** fixed in the same pass (the `:1-10` header claims the script
does not modify committed content while `:259`, `:653`, `:690`, `:1012` do). Prove the gate
works by **inducing** a divergence and watching it fail.
**Note:** this changes a script's exit code, not the site. Pixel gate n/a in principle, but
CI still runs it. No schema, no migration.

**Status: done (preview)** 2026-08-06 — PR #13, squash `5830a00`. All 14 emitted files now
route through `emit()`; the report has 14 entries and no fabricated verdicts. Tests 78 → 98
(**5 of the new cases fail without the fix**, verified against the pre-fix scripts). All 6
required checks green — **the first PR gated by R25's expanded list**. Pixel 0.000%/24.
**R16 closed in the same pass**, and the header is now literally true: `grep
'writeFileSync(path.join(CONTENT_DIR'` → **no matches** (conductor-verified on
`origin/preview`). Full record: `.claude/session-notes/2026-08-06-R13a.md`.
**⚠️ CONDUCTOR ERROR — an acceptance criterion I wrote was wrong, and shipping it literally
would have broken production.** I required "a mismatch makes **both** twins exit non-zero",
carried forward from R11's original R13 stub without checking what invokes them.
`vercel.json`'s `buildCommand` is **`node scripts/fetch-content.mjs && pnpm build`** — that
script is the build's content **producer**, and with `&&` a non-zero exit **aborts the deploy**.
A diff from `git HEAD` is the *normal, correct* outcome of every editor publish, so a
default-on gate there would red every production deploy the moment a word changed — and would
have failed on day one anyway, because `content/pages.json` is already stale w.r.t. both
emitters (R17). The worker caught it and split the behaviour by role, which is right:
- `export-content.ts` — a verification tool nothing depends on → **gates ON by default**
  (`FIDELITY_GATE=0` opts out).
- `fetch-content.mjs` — the producer → detects and reports **identically**, but exits non-zero
  only under `--gate` / `FIDELITY_GATE=1`. Only the exit code differs between modes.
**Lesson: before requiring a script to exit non-zero, check what invokes it.** Same shape as
the `studioLabel` error — a claim inherited and re-asserted without verifying its consequence.
**Decisions worth keeping:** all four files moved to `OUT_DIR` (not `CONTENT_DIR`), making the
exporter genuinely read-only — the exemption's stated reason ("no pre-existing hand-authored
source to diff against") stopped being true once the files were committed, and RELEASE.md step
3 already describes the script as read-only while running it against **prod**. That hazard was
live, not theoretical: the pre-fix script **silently overwrote three committed files with empty
data** during this task (12,731 deletions), which is R16 demonstrated rather than argued.
Also: `match: null` and "emitted but absent from the report" now both **fail** the gate —
`site.json` was invisible precisely because absence read as "nothing to check".
**Known duplication, deliberate:** gate logic lives in `scripts/lib/fidelity.mjs` and is
**mirrored by hand** in `export-content.ts`, because `cms/` is a separate pnpm project with its
own Vercel root directory — `../../../scripts/…` would not exist in the CMS deployment.
Flagged in both files as **R13b's to collapse**.

### R13b — Twin-equivalence test  (High)
**Depends on R13a** — an equivalence test written against a gate that hardcodes `match: true`
proves nothing.
**The hard part, scoped honestly:** the twins read from *different sources* —
`export-content.ts` boots Payload (`getPayload({ config })` at `:86`) and queries the DB via
`payload.find(...)`; `fetch-content.mjs` goes over HTTP to the REST API. CI has **neither** a
database nor a live CMS. So proving equivalence offline requires separating each twin's
**transform** from its **fetch**, then driving both transforms over one captured fixture of
raw CMS data. That is the real deliverable, and it also attacks the root cause: the
duplication that makes drift possible in the first place.
**Acceptance criteria (stub):** an automated, offline check proves both paths produce
identical output for the same CMS state, and **fails on an induced divergence**; it runs in
the existing `tests` job (`tests/fidelity/` is already inside `vitest.config.ts`'s `include`
and was reserved for exactly this by R12); no live DB, no live CMS, no secrets.
**Also fold in (from R17):** `content/pages.json` is **stale w.r.t. both exporters** — it
predates the per-category studio/role label feature, so the next `fetch-content` run
introduces `studioLabelVisible`/`roleLabelVisible` keys. Output stays identical unless an
editor sets a label, but **a committed fixture currently disagrees with what both twins would
emit** — the equivalence test must not mistake that for induced divergence.

**R13a hand-off (2026-08-06) — R13a cleared the blocker and left three things for you:**
1. **`deepDiff` compares the in-memory object, not the serialized bytes.** A key whose value is
   `undefined` exists in the recon object but is dropped by `JSON.stringify`, so the file on
   disk lacks the key while `deepDiff` reports `extra in reconstructed (recon=undefined)`.
   Latent today (real content never has those fields empty; it surfaced only against an
   artificially empty DB) — but **R13b compares emitter outputs directly, which is exactly
   where it bites.** Decide whether to compare parsed objects or serialized bytes; the twins'
   contract is *byte*-identical JSON, which argues for bytes.
2. **`scripts/lib/fidelity.mjs` already exists** — `deepDiff`, `summarizeFidelity`,
   `formatFidelityFailure`, with hand-written types at `fidelity.d.mts` (the root tsconfig has
   no `allowJs`, so a TS test importing it would otherwise fail `tsc` with TS7016). It is the
   natural home for shared comparison code.
3. **The duplication is the root cause R13b was scoped around.** `export-content.ts` mirrors
   that module by hand because `cms/` is a separate pnpm project with its own Vercel root
   directory. Collapsing it — or separating each twin's *transform* from its *fetch* so both
   can be driven over one fixture — is the actual deliverable, not just a test.
`tests/fidelity/` already exists and holds R13a's 20-case suite; `vitest.config.ts`'s `include`
already covers it.

**Feasibility measured by the conductor 2026-08-07 — the refactor is SMALLER than "separate
transform from fetch" implies. Do not restructure 2,300 lines.** Each twin funnels all data
access through **one seam**:
- **REST twin:** every read goes through `getJson()` (`fetch-content.mjs:121`), wrapped by
  `getGlobal()` (`:130`) and `getCollection()` (`:133`) — **8 call sites, 1 function**. Stub
  `getJson` and the whole twin is offline.
- **Local twin:** 9 `payload.find` / `payload.findGlobal` calls, but all on the single
  `payload` object obtained once from `getPayload({ config })`
  (`export-content.ts:86`-ish). Inject a fake object with `.find()` / `.findGlobal()` and the
  whole twin is offline — **no Payload boot, no DB**.
- **Shape note:** REST is essentially the HTTP serialization of the same Payload docs, so one
  recorded fixture can plausibly drive both (the REST side needs the `{docs:[…]}` envelope).
  Verify this early — it is the main unknown.
**The real blocker is smaller still: neither script is importable.** Both auto-run at module
top level and call `process.exit` — `fetch-content.mjs` ends with `main().catch(…)`,
`export-content.ts` with a bare `process.exit(0)`. A test cannot import either without
executing it. Making `main` exported and guarding the auto-run behind a
"invoked directly" check is the first, smallest step.
**Scope discipline:** `docs/testing-standards.md` §2 warns *"do not bundle these… a big-bang
suite gets abandoned."* If the fixture work balloons, deliver a **narrower but genuinely
working** equivalence check over a subset of the 14 files and say which are uncovered — that
beats an abandoned rewrite. Do not silently reduce coverage; name it.

**Status: done (preview)** 2026-08-07 — PR #15, squash `fdb3302`. **All 14 files proven
equivalent**, not a subset. Tests 98 → 130; CI `tests` **31 s** (budget 60 s); all 6 required
checks green; pixel 0.000%/24; **no lockfile change, no new dependency**. The feasibility read
held: `export-content.ts` became a thin CLI over a new `export-emit.ts` (~97% a rename — the
~1,000 reconstruction lines untouched, conductor-verified: the 185 differing lines are imports,
exports and the injection interface, nothing in the reconstruction body), and
`fetch-content.mjs`'s `main()` was exported and parameterised. Both fakes inject at the single
seam each. Full record: `.claude/session-notes/2026-08-07-R13b.md`.

**⚠️ THE FINDING THAT JUSTIFIES THE WHOLE OF R13 — the hand-mirror had already drifted, inside
the very commit that created it.** R13a's `5830a00` wrote `formatFidelityFailure` twice, and the
two copies shipped with **different failure text** — `scripts/lib/fidelity.mjs:138` said "the two
content emitters and the committed content/*.json no longer agree" while
`export-content.ts:128` said "the CMS reconstruction and…". Same commit, same hour, already
divergent, and nothing detected it until R13b's mirror test ran. Conductor-verified at both
paths. **Hand-mirroring does not drift over months; it drifts immediately.** Fixed in PR #15.

**Locked decisions this produced (do not re-litigate):**
- **Compare serialized BYTES, never parsed objects.** Byte-identical JSON text is the actual
  contract. An object diff both *invents* differences (a key valued `undefined` exists in memory
  but `JSON.stringify` drops it — R13a's hand-off trap) and *misses* real ones (**key-order
  changes are invisible to an object diff and are exactly what a hand-edit to one mirrored
  emitter produces** — demonstrated with an induced swap in `site.json`: 299 vs 299 bytes,
  parsed objects equal). `deepDiff` is now used only to *explain* a byte failure by naming the
  path, with an explicit "objects equal, bytes differ" branch. Both behaviours are pinned.
- **A hand-mirror is not a mirror until something checks it.** The `fidelity.mjs` duplication was
  **deliberately NOT collapsed** — `cms/` is a separate Vercel root directory, every sharing
  scheme puts a generator in front of `next build`, and a broken CMS deploy is far worse than a
  duplicated 60-line helper. Instead the mirror is **verified**: the CMS copies are exported and
  25 cases drive both implementations over the same inputs. Apply this pattern to any future
  cross-project duplication.
- **The fixture models the twins' depth asymmetry rather than papering over it.** REST reads
  pages at `depth: 2`, the Local API at `depth: 0`; both survive only because every relationship
  read is `typeof x === 'object' ? x.id : x`. The fixture stores ids and projects per request, so
  a twin that loses one of those guards **fails the test**.
**Not covered, explicitly named:** image download (REST-only, no Local-API equivalent, so nothing
to compare); Payload behaviour the fake reader doesn't model (access control, drafts, pagination
beyond `limit`, locale fallback — it implements `depth` and `sort:'slug'`, which is all either
twin asks for); and branch coverage that is broad but not exhaustive across every field of every
global.
**Stale note now resolved:** this item said "fix R16 in the same pass" — **R13a already closed
R16**; no action was needed or taken.
**Note:** fix R16 (the misleading header) in the same pass — same file, same reader.
**Also fold in (from R17, 2026-08-04):** `content/pages.json` is **stale w.r.t. both
exporters** — it predates the per-category studio/role label feature, so the next
`fetch-content` run introduces `studioLabelVisible`/`roleLabelVisible` keys. Output stays
identical unless an editor sets a label, but it means **a committed fixture currently
disagrees with what both twins would emit** — directly relevant to R13's equivalence test,
which must not mistake this for induced divergence.

### R14 — Dead file `src/styles/globals.css`  (Low)
**Context:** Nothing imports it. `src/main.tsx` imports only `src/styles/index.css`,
which pulls in `fonts.css`, `tailwind.css`, `theme.css` and the slick CSS. Surfaced
during R2: a deliberate 1px regression probe was written into `globals.css` and CI
**correctly** stayed green, which briefly looked like a broken pixel gate. Real global
style changes belong in `theme.css`.
**Acceptance criteria (stub):** file deleted (or wired into `index.css` if it was
meant to be live); pixel gate 0.000%; a note so nobody reads a green gate on a
`globals.css` edit as evidence the gate is broken.

### R15 — `pnpm/action-setup@v4` Node-20 deprecation  (Low)
**Context:** Every CI run annotates *"Node.js 20 is deprecated … forced to run on
Node.js 24"* for `pnpm/action-setup@v4`. Harmless today (`actions/*` are already on
v5), but it will break when GitHub drops the Node-20 shim.
**Acceptance criteria (stub):** annotation gone — bump the action when a v5 exists,
or replace it with `corepack`/`packageManager`. Note neither `package.json` declares
`packageManager`, which is why the pnpm version is pinned explicitly in the workflow.

### R16 — `export-content.ts` header contradicts its behaviour  (Low)
**Context (from R11):** the header at `cms/src/scripts/export-content.ts:1-10` states it
"Does NOT modify the committed content/\*.json (source of truth)". Lines 653, 689 and 1011
write `pages.json`, `categories.json` and `case-studies.json` **directly into
`CONTENT_DIR`**. Anyone trusting the comment will run the export believing it is read-only
and silently overwrite the source of truth.
**Acceptance criteria (stub):** header matches actual behaviour (or the writes are
redirected to `OUT_DIR` like every other file — decide which is intended).
**Fold into R13** — same file, same reader, and R13 already rewrites that logic.

### R17 — Site has no typechecker at all  (Medium)
**Context (from R11):** there is **no root `tsconfig.json`** (only `cms/tsconfig.json`) and
**no `typescript` dependency** in the root `package.json`. `vite build` is the entire static
gate (`.github/workflows/ci.yml:157-158`) and esbuild strips types without checking them.
Consequence: every type in `src/**` is decorative. The `HeroContent` type at
`src/app/components/HeroSection.tsx:6-14` declares `title`/`subtitle`/`body`/`cta1`/`cta2`
required and **nothing enforces it** — which is precisely the guard R12's risk-1 work
needs. Never cite a type annotation in `src/` as evidence a field is present.
**Acceptance criteria (stub):** a root `tsconfig.json` + `typescript` dev dep; `tsc
--noEmit` runs and either passes or reports only pre-existing, documented errors; decide
explicitly whether it becomes a CI gate (mind the ~2-minute budget and the R9 precedent —
don't add a check that reddens every PR for pre-existing reasons).
**Note:** R12 will add a tsconfig for the test runner anyway, so land this **first or
together** — otherwise R12 inherits a surprise pile of type errors mid-task.

**Sequencing resolved 2026-08-04 — R17 is now a hard dependency of R12** (prompt 1 of 2),
because the conductor finally *measured* the "surprise pile" instead of speculating about
it. Probe: the CMS's own `tsc` run against `src/**` with a throwaway config (nothing
written to the repo, deleted after).
- **Under naive strict config: 655 errors.** Misleading — 629 of them (TS7026 / TS7016 /
  TS7053) are the *absence of React types*, not defects.
- **With React types resolvable: 33 errors, in exactly 3 files, with 3 root causes.** Not a
  pile. A bounded, one-session task:
  - `src/app/PageRenderer.tsx` — **19**, all one structural pattern: the block-registry map
    is typed `ComponentType<{ content?: unknown }>` and each concrete block component has a
    narrower `content` prop, so every entry is a variance error. One fix, not 19.
  - `src/app/blocks/CategoryGalleryBlocks.tsx` — **11**: `studioLabel` / `roleLabel` read at
    `:697`, `:706`, `:884`, `:893`, `:1061`, `:1070`, `:1161`, `:1170` but absent from the
    `IntroContent` type (`:47-57`) — **and absent from `content/categories.json` entirely
    (0 occurrences of either)**. Plus one `Cannot find namespace 'JSX'`.
  - `src/main.tsx` — **3**, all config-shaped: `react-dom/client` types, a `.tsx` import
    extension (needs `allowImportingTsExtensions`), and a CSS side-effect import (needs a
    `*.css` module declaration).
- **Also found, and a real blocker for R12:** the root `package.json` declares **no
  `typescript`, no `@types/react`, no `@types/react-dom` — and does not declare `react` or
  `react-dom` as direct dependencies at all** (both resolve only transitively; pnpm
  hoists them, `react@18.3.1`). RTL + Vitest cannot be configured correctly on top of that,
  which is precisely why R12 must not inherit this.
- **Version trap:** `cms/node_modules/@types/react` is **19.2.14** while the site runs
  **react@18.3.1**. Do not reuse the CMS's types — install v18-matching ones at the root.
**~~The `studioLabel`/`roleLabel` finding is a live defect~~ — CONDUCTOR ERROR, corrected by
the R17 worker.** I claimed those branches were "permanently dead, failing silently" on the
strength of `grep studioLabel content/categories.json` → 0. That inference was wrong, and the
grep was too narrow. **They render on the live site today.** Verified at ingest: the CMS
defines both fields (`cms/src/collections/Categories.ts:108`, `:119`); both exporters emit
them via `putLabel`; the shared fallbacks live in **`content/ui.json`**
(`es.home.studioLabel` = "Branding corporativo de:", `es.home.roleLabel` = "Mi rol", plus
`en`); and `fieldVisible` **defaults to true when `<name>Visible` is absent**
(`src/app/blocks/contentMeta.ts:22-25`), so the branch renders the fallback. Resolution: the
fields are **intended**, and were added to `IntroContent`. Lesson: absence from one fixture is
not absence from the render path — the `fieldVisible` + `ui.json` fallback pattern means a
field can be live while appearing nowhere in the obvious content file.

**Status: done (preview)** 2026-08-04 — PR #8, squashed to `preview` as `03d5e84`. Full
`strict`, **0 errors**, achieved by fixing all 29 at source rather than suppressing. All 5 CI
jobs green (verified via `gh pr checks 8`), pixel-parity 0.000%/24, **build output
byte-identical** (same content hashes). No prod deploy — correctly stopped at preview.
Details in `.claude/session-notes/2026-08-04-R17.md`.

### R18 — No error boundary in `src/`  (Medium)
**Context (from R11):** `grep -rn "ErrorBoundary\|componentDidCatch" src/` returns nothing.
Combined with R17 (types unenforced) and `src/app/components/HeroSection.tsx:50` indexing
`home.hero.title[language]` unguarded, a single field missing from a CMS publish throws at
render, React unmounts the tree, and the visitor gets a **blank page** — not a degraded
section. This is the blast radius that makes R12's risk 1 severe rather than cosmetic.
**Acceptance criteria (stub):** a render error degrades to a contained fallback instead of
a white screen; the failure is **loud** (visible/logged), not silently swallowed; public
site pixel-identical in the happy path (0.000%).
**Note:** cheap fix, large blast-radius reduction — natural companion to R12. Must not
alter the happy-path render, or `pixel-parity` will (correctly) go red.

**Scope grew in R12 (2026-08-04) — a SECOND crash path was found, and two tests now pin
this task's expectations.** Folded in here rather than given its own ID because the fix is
identical: runtime guards plus the boundary.
- **`BrandingBeauty` throws on a Proyecto with no `group`.** The `branding:beauty` variant
  is the only one that partitions its cards, splitting by `group` into `adrianaMunoz` /
  `anaGrace` and then indexing fixed slots (`[0]`, `[1]`, `.slice(2)`). `group` is optional
  free text in the CMS, so clearing it — or renaming a studio — empties a partition and the
  fixed slot indexes past the end. Same blank page as `HeroSection.tsx:50`, one content edit
  away. Covered by `tests/renderers/CategoryGallery.test.tsx`.
- **Two R12 tests deliberately assert the CURRENT, BAD behaviour and must be flipped here,
  not "fixed" when they go red.** Both carry comments saying so:
  `HeroSection` with `title` absent → asserts it throws and destroys the surrounding tree;
  the beauty case above → asserts it throws. When R18 lands guards + a boundary, update both
  to "renders the rest of the section". **Do not add a guard to make them pass mid-task** —
  that IS R18, and it changes rendered output.
- **`noUncheckedIndexedAccess` is R18's ratchet** (R17 left it off deliberately). Turn it on
  as part of this task, never silence it with `!`.
- Unknown `blockType` / `layoutVariant` are already **reported** as of R12 (`console.error`,
  no render change). R18 owns making the failure **degrade locally**; do not re-litigate the
  reporting.

### R19 — `POST /api/publish` returns 200 on an unconfigured hook  (Low)
**Context (from R11):** ~~`cms/src/payload.config.ts:41-62`~~ — **the handler moved in R29 and
now lives at `cms/src/endpoints/publish.ts:49-55`.** Auth is correct (403 when
`!req.user`), but a missing/wrong `VERCEL_DEPLOY_HOOK_URL` makes
`pingDeployHook` return `{ ok: false, reason: 'no-hook' }`
(`cms/src/hooks/triggerDeploy.ts:24-25`) which the endpoint returns with **status 200**
(`:52-55`, deliberately). ~~Editor sees success; nothing rebuilds.~~ Same shape as the R3a
bug — an env var whose absence produces a green-looking result.

**⚠️ RE-SCOPED 2026-08-07 (R29). The premise above is FALSE — do not work this item against it.**
"The editor sees success" was wrong when R11 wrote it and was repeated unchecked ever since.
`PublishButton.tsx:35-37` branches on `data.reason === 'no-hook'` and raises a **red error
toast** — *"No hay un hook de despliegue configurado."* — and has since `fcf0335`, the only
commit that file has. Conductor-verified in source. **The editor is already told.**
**The real, narrower gap:**
1. **Non-UI consumers.** `curl`, monitoring, any future integration reads 200 as success. The
   editor is not affected.
2. **The entire signal is the `reason` string** — the status carries none of it. R29 now pins
   `reason` with an exact `toEqual`, so it can no longer be tidied out of the payload without a
   red test. Before that, removing it would have silently degraded the specific toast to the
   generic *"No se pudo publicar"*.
3. **The 500 path is unreachable and body-identical.** The handler's `catch` fires only if
   `pingDeployHook` throws, which it is documented never to do — and if it did, the body would be
   byte-identical to the 200 error path (measured, R29). **So today the status carries zero
   information the body does not.**
**Therefore:** this is a **UI/API-contract** decision, not a status-code bug. The strongest case
is now *keep 200* and decide deliberately what the endpoint promises non-UI callers. R29 already
delivered the handler unit test this item used to bundle, so that is no longer part of the scope.
**Acceptance criteria (stub):** a recorded decision on what `POST /api/publish` guarantees a
non-UI caller, and whichever of status/body/docs makes that true. **Do not change the editor UX
without evidence it is deficient** — it currently reports the failure correctly. Any change must
keep R29's 13 tests green or update them deliberately.

### R33 — Governance bump + precedence clause  (Medium)  ← T1+T2, emitted 2026-08-10
**Everything in the governance arc depends on this.** Planned from a *verified* read of
upstream, not from the planning prompt's description — which was written against `8562d06`
and is now stale in ways that matter.

**Corrections to the planning input (all verified 2026-08-10 by fetching the submodule
read-only, no bump performed):**
- Upstream `main` is **`fddf95b`**, not `8562d06`. The gap is **14 commits, not 5** —
  `8562d06` is 4 commits *behind* the tip.
- The prompt's incoming-file list is right as far as it goes (`AGENTS.md`,
  `.claude/rules/` ×4, `.github/skills/` ×5, `docs/rules/github-workflow.md`,
  `docs/session-notes/README.md`, personas 861→2,911 lines) but **misses 12 files added
  after `8562d06`**: `docs/alignment/` (10 files) and `docs/delivery/{roadmap,locked-decisions}.md`.
  Total diff `e85041e..fddf95b` = **45 files, +8,977/−354**.
- **The framework has already harvested us.** `docs/alignment/` contains a cross-project
  gap analysis, a decisions doc (**D1–D8**), and four per-project planning prompts —
  including `portafolio-planning-prompt.md`, the source of this very session's input.
  Upstream `docs/delivery/locked-decisions.md` and `roadmap.md` are our patterns, adopted.

**T2's premise is VALID and urgent — verified, not assumed.** The 80% mandate is **still
live at the tip**: `docs/rules/testing-standards.md:77` — *"Minimum coverage for new code:
80% line coverage on new files"* — and `.github/agents/testing-qa.agent.md` re-imports it
**three times** (`:39`, `:267`, `:304` — *"NEVER lower coverage thresholds"*) plus a
`Coverage threshold` context row at `:22`. Upstream **D4 decided to remove it** but has
**not implemented it**. So the bump lands a live 80% mandate *and* a persona that enforces
it, while our rejection lives only in `docs/delivery/roadmap.md`. **A fresh worker reading
`CLAUDE.md` and nothing else would read the mandate as law.** That is why T1 and T2 ship
together and not in sequence.

**⚠️ T2's suggested clause is SUPERSEDED by upstream D3 — do not paste it verbatim.**
D3 adopts our formulation (*"the strict rule was not obeyed, it was routed around, and it
produced less governance rather than more"*) but adds two things the prompt's draft omits:
1. **A safety floor (LD-05).** A blanket "project file wins" would legitimize the worst
   finding in the cross-project audit — a sibling project running production Stripe with
   **no authorization phrases at all**. The exception list is closed and short:
   **authorization phrases, destructive-operations protocol, secrets/PII, protected
   branches.** Content is tailorable; the mechanism is not removable. Our clause must carry
   this floor — we have those phrases and R2's protected branches, and they must not become
   overridable by a table row.
2. **The surface (LD-04).** Upstream prefers the **mirrored path** `docs/rules/<same-name>.md`
   over our flat `docs/testing-standards.md`, because a mirrored set can be *verified* (diff
   the file sets, require a Deltas table in every shadow) and a flat convention cannot.
   **Deliberately deferred to R36** — R30 has just finished correcting every citation of
   `docs/testing-standards.md`, and moving it now re-breaks them. Move once upstream lands D3.

**Also verified for T2:** root `CLAUDE.md` points at neither `governance/AGENTS.md` (which
did not exist at our pin) nor `docs/testing-standards.md`. Both must be added.

**Status: done (preview)** 2026-08-10 — PR #23, squash `582e637`. Tip matched `fddf95b`
exactly. Gitlink-only move confirmed at ingest: `git ls-tree origin/preview governance` →
`fddf95b…`, and no tracked file inside the submodule changed. `CLAUDE.md` +58/−2. All 6
checks green, pixel 0.000%/24, 151 tests, no lockfile change.
**The reader test was met the right way.** Rather than a bare table row, the clause names the
trap: *"`governance/docs/rules/testing-standards.md:77` mandates 80% line coverage… **That
mandate does not apply to this repository.**"* A row saying "testing-standards.md is
overridden" would not tell a cold reader *which* rule to disregard. Adopt that pattern for
future overrides — **name the rule, not just the file.**
**Worker correctly refused to silently merge the conductor's planning commit** and rebased
instead, flagging that `a5b6104` was unmerged. Right call; the roadmap on `preview` had no
R33–R36 rows until this ingest landed them.

### R34 — Deltas for the incoming files that conflict with our practice  (Medium)
**The bump's real risk is not the 80% rule — that one is known. It is the three files that
contradict settled practice quietly.** All verified against `origin/main`:
1. **`docs/rules/github-workflow.md` (new; did not exist at our pin) conflicts with R2 in
   three places.** *"Every PR must link to at least one issue"* — we use roadmap-as-SSOT and
   have never opened an issue. *"PR must be under [400] lines"* — R13b and R30 both exceeded
   that for good reason. *"Request review from at least [1] reviewer"* (`:135`) — **R2
   deliberately set branch protection to 0 approvals** with `enforce_admins: true`, because
   the owner is the only reviewer. Adopting that line literally would deadlock every PR.
2. **`docs/rules/session-and-context.md` (+140/−22) relocates and re-purposes session
   notes.** It puts them in `docs/session-notes/`; ours live in `.claude/session-notes/`. It
   also says *"Never keep session notes as a permanent knowledge store — extract and
   integrate"* (`:130`), while ours are explicitly marked **Permanent** and are where the
   four inherited-claim errors are recorded. That practice is load-bearing; the upstream rule
   would delete the project's error memory.
3. **`.github/agents/testing-qa.agent.md`** re-imports the coverage threshold our standard
   drops (see R33).
**Acceptance criteria (stub):** a delta recorded for each, in the project file that overrides
it, with the reason. **Do not edit `governance/`.** Where we keep our practice, say so and
why; where upstream is better, adopt it deliberately.

**WIDENED to 5 by R33's ingest, 2026-08-10. Conductor answers to the questions R33 raised —
these are decided, not open:**

4. **Plan-approval gate — RECORD AS A DELTA, and it is a strong one, not a dodge.**
   `governance/CLAUDE.md:131-135` requires presenting a plan and *"Wait for explicit approval
   before writing ANY code — even single-line fixes"*, plus a second approval before creating
   any file (`:143-148`). Verified. Our answer: **the emitted task prompt *is* the plan, and
   the human pasting it into a worker session *is* the explicit approval.** That is not a
   lighter reading — it is the gate performed earlier and in writing. The prompt states scope,
   acceptance criteria, an explicit "Do not touch" list and the verification bar; a human reads
   it and chooses to run it. The conductor playbook's rule that a turn never ends with only
   discussion is the same requirement from the other side. **What we must NOT do is let a
   worker infer that approval is implicit** — the delta should say the approval is real,
   located at prompt-paste time, and that anything exceeding the prompt's stated scope still
   needs a fresh one.
5. **`release-and-deployment.md:116` — *"Never run `git push` before `gh pr create`"*.**
   Record as **not adopted**, one line. Not executable for a new branch (`gh pr create` needs a
   pushed head); scoped to promotion PRs it is merely unusual. No behaviour change.

**Q4 from R33 (a sixth coverage site — `.github/skills/test-coverage.skill.md:103`) is NOT an
R34 item.** It is upstream's blast-radius list being incomplete, which is feedback for
**R20**, not a delta for us: nothing here loads `governance/.github/skills/`.

**Status: done (preview)** 2026-08-10 — PR #28, squash `ba8fea5`.
`docs/delivery/governance-deltas.md`, 476 lines; `CLAUDE.md`'s overrides table gains 4 rows
plus the three rules most likely to mislead a cold reader, cited by line (R33's convention).
6/6 checks, pixel 0.000%, submodule untouched (`fddf95b`, inner status empty).
**The placement was better-justified than my recommendation.** I proposed
`docs/delivery/governance-deltas.md` as the least-bad of four boxed-in options. The worker
found it is **affirmatively sanctioned**: `governance/CLAUDE.md:597-598` routes *"a decision
that must not be re-litigated"* to `docs/delivery/`, and `:569` calls that directory *"Backlog
SSOT and settled decisions."* Upstream endorses the location it forbids everywhere else.
**Delta #5 confirmed NOT a conflict**, with a corroboration I had not found:
`governance/CLAUDE.md:374` orders *"commit → verify → push → PR"* for ordinary PRs, so `:116`
and `:374` are consistent **only if** `:116` is promotion-scoped — which its own heading
(`:108 ## Promotion PR Workflow`) already says. Recorded as *applies, complied with*, kept out
of the overrides table, and carrying forward **the mis-reading rather than the rule**: do not
generalize `:116` to feature branches.

**⚠️ TWO CONDUCTOR ERRORS, both corrected by the worker with measurements:**
1. **"R13b and R30 both exceeded 400 lines"** — R13b did (PR #15 = **3,742**); **R30 did not**
   (PR #21 = 296+64 = **360**, comfortably under). Verified at ingest via `gh pr view`.
   Replaced with four measured examples that do exceed: #15 (3,742), #13 (768), #19 (624),
   #14 (592). The claim was right in direction and wrong in its second instance — I reached
   for a recent PR without measuring it.
2. **"11 of 18 session notes are permanent"** — it is **13 of 17**. The 18th file is
   `README.md`, the template, which I counted as a note. Verified at ingest: `ls | wc -l` = 18,
   minus README = 17, `grep -l Permanent` = 13. The four unmarked ones (R1b/R1c/R1d/R10) are
   superseded — and superseded *by a permanent note that says so* (`2026-07-31-R8.md:36`),
   which strengthens the delta rather than weakening it.

### R42 — Should `governance-deltas.md` assert a census at all?  (Low)
**Found by R38's worker, 2026-08-10 — and it is self-demonstrating.** §2.2 of the deltas file
says *"13 of the 17"* session notes are permanent. That number was **measured at R34 ingest on
the same day** and is already wrong: **19 notes** now (+ README), **15** declaring permanence,
and only **4** using the literal `**Permanent**` string — the rest say *"permanent record"* or
*"**Keep: permanent.**"*.
**Three ways it has been wrong in three days:** I first wrote "11 of 18" (counted README as a
note); R34's worker corrected it to "13 of 17"; R38's worker measured 19/15/4. Each count was
right when taken. **The defect is asserting a census in a document nobody re-measures**, in the
file whose entire purpose is preventing stale claims.
**The decision, and it is a real one:** does the delta need a number at all? Its *claim* —
"this repo keeps permanent session notes, upstream's 30-day clean would delete them" — is true
regardless of the count, and R38 already rewrote root `CLAUDE.md`'s version into a form that
cannot drift. Options: drop the number; replace it with a command that regenerates it; or keep
it with a measured-on date.
**Secondary finding worth fixing while there:** the permanence marker is **not uniform** (three
different phrasings), so any future count is unreliable regardless. Standardising it is cheaper
than counting.
**Acceptance criteria (stub):** §2.2 no longer carries a claim that goes stale unattended; the
underlying delta unchanged in substance; if a marker convention is adopted, existing notes are
made consistent or the inconsistency is recorded.

### R41 — Committed settings for `claudeMdExcludes`  (Low) — **CLOSED DORMANT 2026-08-10**
**Owner's decision, taken with the exposure correctly scoped.** R40's fix is machine-local, but
the affected population is far smaller than the outcome implied. Measured at ingest:
- **123 commits, one contributor** — "every other contributor" is currently nobody.
- **CI never loads Claude Code rules** (`grep -ciE 'claude|anthropic' .github/workflows/ci.yml`
  → 0), so "every CI checkout" is not exposed either.
- `~/.claude/settings.json` carries the same exclusion at **user level**, so any fresh clone
  **on this machine** is already covered.
Residual exposure is therefore **the owner on a different machine**, and nothing else.
**Closed rather than done.** Reopen if a second contributor or a second machine appears.
**⚠️ If it does recur it will be silent** — that is R40's whole finding, and `/context` cannot
see it. The re-open test is in `docs/delivery/governance-deltas.md` (Maintenance step 5), and
the answer is pinned to Claude Code **2.1.220**; re-run it rather than trusting the record.
**A cleaner fix exists if this is ever reopened**, and it does *not* meaningfully reverse R37:
put `claudeMdExcludes` alone in a **committed `.claude/settings.json`** (that file is Claude
Code's *shared* settings by convention) and keep the machine-specific `GH_CONFIG_DIR` path and
permission allowlist in the gitignored `.claude/settings.local.json`. R37 ignored that file
because of its machine-specific *content*, not because repo policy may never be committed.

### R38 — Root `CLAUDE.md`: override-hierarchy note, with R6 folded in  (Medium)
**Found by R33's worker; conductor-verified 2026-08-10.** The bump landed an *Override
Hierarchy* block at `governance/CLAUDE.md:19-29`:
```
CLAUDE.md (this file)          ← Cannot be overridden
  └── AGENTS.md
       └── .claude/rules/      ← Project-local overrides (additive only)
            └── docs/rules/
                 └── .github/agents/
```
followed by *"No layer may contradict this file. If a conflict exists, this file wins."*
So the file **every worker is told to read first** asserts that the precedence section R33
just landed is not permitted. That is why this is **not** folded into R34: R34 records deltas
against *rule files*; this is a contradiction at the governance **root**, about whether our
override mechanism exists at all.
**Conductor's reading, and the answer to work from:** the hierarchy describes layers *within*
`governance/` and **does not contemplate a downstream project file at all** — every layer it
names is upstream except `.claude/rules/`, which it neuters as "additive only". So this is a
**gap**, not a head-on collision, and it is precisely the gap upstream **D3** was written to
fill. D3 sides with us (*"the strict rule was not obeyed, it was routed around, and it
produced less governance rather than more"*) but **is not implemented at `fddf95b`**.
**We keep our clause.** R11's evidence stands, D3 endorses it, and reverting would re-expose
us to the live 80% mandate.
**Acceptance criteria (stub):** a short note *inside* root `CLAUDE.md`'s own precedence
section — that is where the contradiction is visible — explaining why the clause does not
violate the upstream hierarchy (it fills a gap the hierarchy omits; D3 ratifies it), with the
`governance/CLAUDE.md:19-29` citation. Cheap, and it pre-empts a future worker deciding our
clause is illegal and "fixing" it. **Close this when upstream ships D3**, and check whether
upstream's own wording makes our note redundant.

**R6 FOLDED IN 2026-08-10.** Both edit root `CLAUDE.md`; the roadmap already warned *"do not
run them concurrently on the same file."* They are also the same job — **making the file every
agent reads first correct and self-consistent.** R6's three verified defects (wrong platform,
a workflow file that does not exist, wrong mechanism) are in its own detail block above; do not
re-derive them, but do re-verify before writing.
**One extra reason R6 now matters more than its original Low suggested:** R40 proved that a
governance read injects `governance/.claude/rules/01-project-context.md`, which asserts a
`[framework]` + `[database]` + `[hosting]` stack. Root `CLAUDE.md` is the file that has to be
*right* when a placeholder stack is sitting next to it in context. On this machine the
exclusion suppresses it — on any other, it does not (**R41**, closed dormant).

**Status: done (preview)** 2026-08-10 — PR #32, squash `22a1cbd`. `CLAUDE.md` 122 → **180
lines** (under the ~200 guidance);
`grep -ciE "siteground|rsync|public_html|deploy\.yml"` → **0**. R33's 80% worked example
byte-identical. 6/6 checks, pixel 0.000% over **24** images — the count read and reported
correctly this time. **R6 closes with it.**
**Deployment section: summary deleted, heading kept as a tombstone** pointing at
`INFRASTRUCTURE.md` + `RELEASE.md`. Right call — a heading-scanner still lands somewhere, and
the remaining four lines contain *nothing that can go stale*, which is the actual fix for
drift. The R40 injection hazard was also surfaced in the file itself (`:48-53`).

**⚠️ TERMINOLOGY CORRECTION — "D3" is mine and it is not greppable upstream.** I have used
"D3" across R33, R34, R36 and R38. Verified: upstream's own files contain it **only** as a
legend token at `governance/docs/delivery/roadmap.md:26`. The real identifiers are:
- **F2** — the roadmap item that implements it (`:42`, still `todo`, depends on LD-03/04/05).
- **LD-03** — override precedence · **LD-04** — the mirrored-path surface (**R36**) ·
  **LD-05** — the safety floor.
Cite **F2 / LD-03 / LD-05** in future prompts; a worker grepping upstream for "D3" finds a
table legend and concludes we invented it.

**⚠️ The worker found a stronger argument than the one I supplied, and verified at ingest.**
My reading was that the hierarchy is a *gap* — true, and still the right lead. But upstream has
**already retracted the line**: `governance/docs/delivery/locked-decisions.md:125-127` lists
*"Current wrong claims to remove: `CLAUDE.md:24`, `CLAUDE.md:463`, …"* — `:24` being the exact
*"additive only"* line a worker could cite against our clause. LD-03's own rationale is that
the strict rule *"was not obeyed — it was routed around"* and *"produced less governance, not
more."* So the one sentence that appears to outlaw our precedence section is **disowned by its
author and scheduled for deletion in F2.** That is a fact, not an inference, and it belongs in
front of the gap argument.
**Closing condition is now written into `CLAUDE.md` itself** — re-read the note when a bump
lands upstream **F2**; upstream's own wording may make ours redundant. Tracked as a watch, not
an open item.
**Prompt premise corrected (mild):** `.github/workflows/deploy.yml` *did* exist — added in
`640cd95`, deleted **2026-07-15** in `ecd4aee` (*"Remove SiteGround rsync deploy workflow"*).
"Does not exist" was accurate; "never existed" would have replaced one false claim with
another. The review marker now records the deletion date, which is the drift *mechanism* rather
than just the defect.

### R37 — The `exit-flush` vacuity guard can red any PR at random  (Medium)
**Found by R33's worker on a gitlink-plus-markdown PR — it went red on the first CI run and
green on a re-run of the same job against an unchanged tree.** Conductor-verified: the guard
at `tests/fidelity/exit-flush.test.ts:185` asserts `runs.some(r => r.report < PAYLOAD)` over
`SAMPLES` runs — i.e. **at least one of ten runs must reproduce a platform race.** R28
measured a ~4-in-5 per-run loss rate on Linux, which puts an all-ten-deliver false green near
`1e-7`. Hitting it on the first attempt means the real rate on the current runner
(`ubuntu-24.04`, Node 24.15.0) is far below 0.8.
**The test's own docblock is right and should be respected:** *"IF THIS GOES RED, do not
'fix' it. It means the platform changed — re-measure and decide whether `write-sync.mjs`
still earns its keep."* **Do not raise `SAMPLES` to make it pass** without re-measuring; that
converts a real signal into noise suppression.
**But there is a design question above the measurement, and it is the actual decision:** this
is a **required check** (R25), so a platform-change signal costs a blocked PR and a re-run
every time it fires. A test whose job is to detect that the environment stopped exhibiting a
bug is valuable — as a *reported* signal, not a *gate*. Options: re-measure and raise
`SAMPLES` if the rate is merely lower; move this one case out of the gating suite while
keeping the fixed-path assertions gating; or retire the guard and keep its finding in the
file header. **Decide deliberately; state which and why.**
**Do not weaken the fixed-path tests** — "the report survives a pipe" is R28's actual
deliverable and must keep gating.
**The blast radius is exactly one test — conductor-verified 2026-08-10.** Of the 6 `it()`
blocks in the file, only **`:180`** asserts the *unfixed* shape (`runs.some(r => r.report <
PAYLOAD)`, `SAMPLES = 10`, `PAYLOAD = 200_000`). The four fixed-path tests (`:108`, `:122`,
`:132`, `:141`) assert the **fix works** and are deterministic on both platforms per the
file's own measurements; `:251` is a source-text mirror check. So the flaky surface is one
assertion and the surgery is small — **do not restructure the suite.**
~~**The rate that made this safe:** 4/5 runs lost bytes, so at p=0.8 over 10 samples a false
green is ~`1e-7`, and observing one means p has dropped a long way.~~ **← BOTH PREMISES ABOVE
ARE MEASURED FALSE. Conductor error; see the status block.** *"That measurement is the
deliverable, not a green suite"* was the one part that held, and it is what produced the fix.

**Status: done (preview)** 2026-08-10 — PR #25, squash `1e3e85d` (+ follow-up PR #26,
`5775150`). Guard is now `it.skipIf(env.CI)` at `:269`; the four fixed-path tests are
byte-identical and still gate; `SAMPLES` unchanged at 10. Three consecutive green CI runs
(33/32/26 s, vitest ~3.9 s — well inside the §6 60 s budget). 6/6 checks, pixel 0.000%/24.

**⚠️ CONDUCTOR ERROR — I reasoned from an unexamined model, and it inverted the conclusion.**
I wrote that a first-attempt false green "means the real rate has dropped a long way". The
arithmetic (`0.2^10 ≈ 1e-7`) was correct; **the model was not.** `0.2^10` assumes the ten
samples are **independent Bernoulli trials**. They are not.
**Measured: 2,698 of 2,700 runs across 33 job executions still lose bytes — p = 0.9993.** The
bug did not weaken at all; if anything R28's 5-run table *understated* it. The flakiness comes
from the samples sharing a job: **the mode is drawn per CI job, not per run.** It is a race
between the child's single `try_write` and the parent's reader, so on a host already draining
the pipe, nothing ever queues — and then all ten runs deliver in full. 33 of 33 measured jobs
sat at p ≈ 1; **none straddled.** Ten consecutive full deliveries would be a ~5e-32 event under
independence, and it happened in **1 of 13** `tests` job executions.
**The decisive consequence: raising `SAMPLES` could never have worked.** On a loss-mode job the
guard is green at `SAMPLES=1`; on a no-loss job it is red at `SAMPLES=1000`. Ten samples and a
thousand have the *same* false-red rate — the observed ~1-in-13. My prompt told the worker not
to raise `SAMPLES` without measuring, which was right for the wrong reason: it is not merely
unjustified, it is **provably ineffective**.
**Lesson, and it is a new failure mode for this project's list.** The earlier four errors were
*citing a document instead of the code*. This one is **citing a model instead of the
mechanism** — I applied i.i.d. Bernoulli to a process whose whole subject matter is a
scheduling race, without asking whether the trials could be correlated. **Before reasoning
probabilistically about a flaky test, establish what the unit of randomness actually is.**

**Decision shipped: option 2, `skipIf(env.CI)`** — keep the assertion, drop the gate. Rejected,
each recorded in the file: *raise `SAMPLES`* (measured ineffective); *delete it* (the vacuity
risk is real — on a no-loss host the four fixed-path tests **pass vacuously**, so ~1 job in 13
they prove nothing, and noticing exactly that is the guard's purpose); *its own non-required
job* (needs a workflow change **and** a required-checks decision — correctly deferred to R25).
`skipIf(env.CI)` beats a local-only opt-in flag on **discoverability**: it runs on every plain
`pnpm test` on a developer machine, so it cannot rot unnoticed — and **macOS is where it is
deterministic** (100/100 lost bytes) rather than a per-job coin flip. Good reasoning; the
weakest option would have been the one that made CI green fastest.
**Mechanism worth keeping:** the child's fd 2 is a **`socketpair`, not a FIFO** (measured
`isFIFO=false isSocket=true` on all 20 hosts), sized by `net.core.wmem_default` = 212,992 —
which is why Linux plateaus at 146,176 while macOS truncates at a clean 65,536.
**Scope note, accepted:** the worker also corrected `docs/testing-standards.md` §8, whose R28
bullet asserted the loss is per-run non-deterministic and that the guard "samples ~10 runs".
Both halves are now measured false, and leaving a **binding** standard describing a mechanism
that does not exist is exactly the failure R30 was created to fix. Dated correction in place,
house style, nothing else touched. Right call.

### R40 — `governance/.claude/rules/` templates load on the first Read under `governance/`  (Medium)
**Found by R34's worker, 2026-08-10 — the most consequential thing the bump brought, and it
was on nobody's list.** The bump added four files under `governance/.claude/rules/`. This repo
has **no `.claude/rules/` of its own**, and the worker reports observing all four **in its own
loaded context** during the session. If that holds generally, every session here is being
handed placeholder rules as if they were configuration.
Two concrete harms, both cited:
- `governance/.claude/rules/02-non-negotiables.md:17` re-smuggles
  `[e.g., "PRs must be under 400 lines of diff"]` — **the exact cap R34 §1.3 just recorded as
  not adopted**, re-entering by a second door.
- `governance/.claude/rules/01-project-context.md:8-9` asserts `[your-project-name]` /
  `[framework]` + `[database]` + `[hosting]` — a **wrong stack** injected into a repo whose
  root `CLAUDE.md` states the real one.
This is the R7 hazard realized: *a placeholder file is worse than no file, because it reads as
configured.* R7 predicted it for files we might create; nobody checked whether the submodule's
own copies were already being loaded.
~~**⚠️ VERIFY THE LOADING CLAIM FIRST — the conductor's own evidence contradicts it
(2026-08-10).**~~ **Resolved — see the verified block below. The worker was right, the
conductor's contrary evidence was real but measured a different thing.** The challenge is kept
because the *reason* the two disagreed is the durable finding:
- ~~`.claude/rules/` is documented as a **project-level** path — `<cwd>/.claude/rules/`. Ours
  would be `./.claude/rules/`, which **does not exist**. `governance/.claude/rules/` sits in a
  **subdirectory**, and CLAUDE.md discovery walks **up** the tree, not down.~~ True of
  *session-start* discovery, and irrelevant: the load is on demand, not at launch.
- The docs do acknowledge *"rules in nested `.claude/rules/` directories"* as a real category,
  but describe them as loading **on demand** — when Claude reads files in that directory — not
  at launch. **This was the correct reading**, and it is broader than it sounds: reading a file
  anywhere under `governance/` is enough, not just inside the rules dir.
- ~~**Contrary evidence from this very session:** … has **never appeared as loaded
  instructions** — only as explicit `git show` tool output.~~ **`git show` is exactly why.**
  Only the **Read tool** triggers the injection; `cat`, `sed` and `git show` read the same
  bytes and fire nothing. The conductor's observation was accurate and its inference was not.
  **Second, independent reason it was inapplicable — found at ingest.** The conductor *did* use
  the Read tool on `governance/CLAUDE.md`, once: during the T1–T6 planning session. That was
  **before R33 bumped the submodule**, when the pin was `e85041e` — which contains **no
  `.claude/` directory at all** (`git -C governance ls-tree e85041e .claude/` → empty).
  Injection was impossible. Every governance read *after* the bump used `sed`, `git show` or
  `ls`. So the evidence was doubly inapplicable: wrong tool, and before the files existed.
  **The lesson is not "the conductor was careless" — it is that "I looked and saw nothing" is
  only evidence if you can state what would have made it visible.** Neither condition was
  checked before the observation was offered as a counter-argument.
- ~~the documented check is **`/context`**~~ — **`/context` cannot see this.** Its **Memory
  Files** table after a governance read is byte-identical to a cold session's while all four
  files sit in context. Following the prompt's own recommended method would have closed R40 on
  a false negative.
**If it IS real, the fix is documented and one line** — `claudeMdExcludes` in
`.claude/settings.local.json`, which takes absolute-path globs:
`{"claudeMdExcludes": ["**/governance/.claude/rules/**"]}`. Note `.claude/settings.json` is now
git-ignored (R37 follow-up), so decide deliberately whether the exclusion should be
machine-local or committed — a machine-local fix protects only the person who applies it.
**If it is NOT loading, close as a non-issue and keep only the R20 feedback** — upstream still
ships populated-*looking* templates at a path that at minimum *invites* this, which is a
footgun for consumers who do create their own `.claude/rules/`.
**Acceptance criteria (stub):** placeholder rules from the submodule no longer reach a session
here as if authoritative — either a project `.claude/rules/` that overrides them (which is
**R7**, so consider merging), or excluding the submodule's from discovery. **Do not edit
`governance/`.** Either way it is also **R20** feedback: upstream ships populated-*looking*
templates at an auto-loaded path, which is a footgun for every consumer, not just us.
**Interaction with R7:** R7 plans to write real `.claude/rules/` files. ~~If they land first and
shadow the submodule's, R40 may close itself — check before doing both.~~ **Tested: they do not
shadow. R7 is unaffected and keeps its full value** — see below.

**✅ VERIFIED AND FIXED 2026-08-10 — Claude Code `2.1.220`, macOS 25.5.0.**
Five fresh headless sessions (`claude -p`, tools restricted to `Read`), cwd = repo root:

| # | Session did | Four files injected? |
|---|---|---|
| A | Nothing — cold, no tool calls | **NO** |
| B | Read tool on `governance/CLAUDE.md` | **YES** — all four |
| C | Read tool on `governance/docs/rules/github-workflow.md` (deep, not the rules dir) | **YES** — all four |
| D | Read tool on `docs/delivery/roadmap.md` only | **NO** |
| E | B, with `claudeMdExcludes` applied | **NO** |

**Verdict: the premise is TRUE.** Not at session start — **on demand, on the first Read of any
file under `governance/`.** Since every task prompt here opens with *"Read
`governance/CLAUDE.md` first"*, that is effectively every worker session, and R34's worker was
reporting real behaviour.

**Fix applied:** `"claudeMdExcludes": ["**/governance/.claude/rules/**"]` in
`.claude/settings.local.json` **and** in user-level `~/.claude/settings.json`. Re-verified
against the real files (not the `--settings` flag) on both a shallow and a deep governance
read. The glob is scoped to the rules dir, so `governance/CLAUDE.md` and
`governance/docs/rules/*` still read normally — confirmed, since every prompt depends on them.

**Who is protected: this machine only.** `.gitignore:25-27` ignores **both** project settings
files (R37). Every fresh clone, every other contributor and every CI checkout still loads all
four. A shared fix needs a committed settings file, which would reverse R37 — **not reversed
here; raised as R41.**

**R7 shadowing, tested rather than reasoned:** a throwaway `/tmp` fixture with a project
`.claude/rules/` *and* a submodule `governance/.claude/rules/`, each holding a unique sentinel.
**Both loaded** — the project one at session start, the submodule one on the governance read.
The mechanism keys off the directory of the file being read, not off a missing project rules
dir, so a project `.claude/rules/` **adds** a load rather than replacing one.

**Two methodological findings, recorded in `.claude/session-notes/2026-08-10-R40.md`
(permanent) because they generalise past this item:** `/context` is blind to on-demand loads,
and reading via `cat`/`sed`/`git show` bypasses instruction injection entirely. Any future
"is X loaded?" check must use the **Read tool** or it measures nothing. **Full write-up:**
`docs/delivery/governance-deltas.md` §6.1.

**R20 feedback stands and is strengthened** — upstream ships populated-*looking* templates at a
path that injects them into consumers who never opted in. They should be `.example` files or
live outside `.claude/`.

### R41 — R40's fix is machine-local; a shared one needs a committed settings file  (Low)
**Context (from R40, 2026-08-10):** R40 stopped the four upstream template files from being
injected, with `"claudeMdExcludes": ["**/governance/.claude/rules/**"]`. The key works, is
verified, and is **invisible to everyone else** — it lives in `.claude/settings.local.json`
and `~/.claude/settings.json`, and `.gitignore:25-27` ignores both project settings files. A
fresh clone, a second contributor, or a CI checkout still loads all four placeholder rules on
the first Read under `governance/`, including the 400-line PR cap §1.3 explicitly dropped.

**The tension, stated so it is decided rather than drifted into.** R37 git-ignored
`.claude/settings.json` for a good reason: it held **machine-local tool permissions**, which
are per-operator and do not belong in the repo. `claudeMdExcludes` is the opposite kind of
thing — it is **project configuration**, true for anyone who clones this repo, and it is only
correct if it is shared. The R37 decision and this need are both right; they just want
different files.

**Options, none chosen — this needs the owner, not a worker:**
1. Un-ignore `.claude/settings.json` and commit it holding **only** `claudeMdExcludes`, keeping
   `settings.local.json` ignored for permissions. Narrowest reversal of R37, and it puts the
   two kinds of setting in the two files the tool already distinguishes.
2. Leave it machine-local and accept that only the owner is protected — defensible while the
   owner is the sole contributor (root `CLAUDE.md` notes exactly that for reviewers), but it
   silently expires the moment anyone else clones, and CI is already a second "contributor".
3. Wait for **R20** to fix it upstream. Correct in principle, unbounded in time, and it does
   nothing for the current submodule pin.

**Acceptance criteria (stub):** a decision recorded with its reason; if option 1, a committed
`.claude/settings.json` containing nothing but the exclusion, `.gitignore` narrowed to
`settings.local.json` only, R37's note updated to say why the split exists, and the exclusion
re-verified from a clean clone. **Do not silently reverse R37** — whatever is chosen, the
reason goes in `docs/delivery/governance-deltas.md`.
**Note:** the underlying behaviour is version-dependent (measured on Claude Code `2.1.220`).
If this sits for a while, re-run §6.1's test before acting on it.

### R39 — Scheduled "is the exit-flush race still live?" job  (Low)
**Context (from R37, 2026-08-10):** the vacuity guard's *finding* is worth a standing signal —
if the platform ever stops truncating, `write-sync.mjs`'s justification changes and the four
fixed-path tests start passing vacuously. But **a per-PR check structurally cannot deliver
that signal**: it gets exactly one host draw, and R37 measured that the loss mode is drawn
**per job**, so a single job's result is a coin flip on host state rather than a measurement.
**Right shape:** a scheduled (cron) job sampling across several hosts and reporting the
aggregate rate — many job executions, not many runs inside one.
**⚠️ To mean anything it needs a required-checks decision, which is R25's territory and needs
a real rejected-push verification** (R2's precedent: an apply returned success and protected
nothing). R37 correctly recommended rather than acted.
**Acceptance criteria (stub):** a non-required scheduled job reporting the aggregate loss rate
across ≥10 job executions; a stated threshold at which a human should revisit
`write-sync.mjs`; no change to the required-checks list without going through R25.

### R35 — `full-stack.md` + `devops.md` agents  (Low)  ← T5, depends on R33
**Context:** `.claude/agents/` holds exactly one agent, `qa.md` — and the cross-project audit
names it **the best-shaped agent across all four projects**: real tool names, `model: opus`,
and an explicit **negative scope fence** (*"Your remit is authoring testing rules, not tests.
You do not install runners, add dependencies, touch either lockfile."*). Upstream personas
have no such fence; ours is being harvested as the reference shape (D8/H12).
That fence has been load-bearing here — R11 shipped rules-only and R12 shipped the runner,
cleanly, because the boundary was written down.
**Most prompts this session named `full-stack` or `devops` as the agent to load, and neither
exists** — the worker got the label and no persona.
**Acceptance criteria (stub):** `full-stack.md` and `devops.md` in `qa.md`'s shape, each with
its own negative scope fence. Keep them terse — the value is the fence, not the length.
**⚠️ Premise corrected by R33's worker, measured at `fddf95b`:** ~~base them on the expanded
upstream personas~~ — the expansion is real (861→2,911 lines) but **H12/F12's shape changes
are decided upstream and NOT implemented.** Measured across the 10 personas: **1 of 10** has
an `## Out of scope` fence (`product-owner`), **0 of 10** carry `model:`, **0 of 10** have the
*"The one thing to get right"* opener. The new `devops.agent.md` (220 lines) is a useful
**content** source — CI/CD debugging protocol, environment-parity checklist, secret rotation —
but its Project Context table is 10 placeholder rows and it has **no fence**.
**So: take content from upstream, take the shape from our own `qa.md`.** That is the artifact
the cross-project audit called the best-shaped agent of the four projects, and the fence is
why R11 shipped rules-only and R12 shipped the runner without either bleeding into the other.

### R36 — Move `docs/testing-standards.md` to the mirrored path  (Low)  ← deferred from R33
**Context (upstream D3/LD-04):** upstream prefers project overrides at the **mirrored path**
`docs/rules/<same-name>.md`, because a mirrored set can be *verified* — diff the file set of
`governance/docs/rules/` against `docs/rules/` and require a Deltas table in every shadow.
Our flat `docs/testing-standards.md` works but no gate can check it. Upstream costs this as
*"Portafolio moves one file."*
**Why deferred, not done in R33:** R30 has just finished correcting every citation of
`docs/testing-standards.md` across the roadmap, the standard itself, and CLAUDE.md. Moving it
immediately re-breaks all of them for a benefit that only materializes once upstream ships
the `verify-governance` gate. **Do this when upstream lands D3**, ideally in the same pass
that adopts the gate.
**⚠️ ALSO BLOCKED ON UPSTREAM BEING SELF-CONSISTENT — conductor-verified 2026-08-10.** As of
`fddf95b`, `governance/CLAUDE.md` forbids **every available placement** of a project override:
`:603` *"Never create documentation at `docs/` root"* (rules out our current
`docs/testing-standards.md`), `:605` *"Never put project-specific rules in `docs/rules/` (use
`.claude/rules/`)"* (rules out the mirrored path **LD-04 explicitly chose**), and the override
hierarchy at `:23` makes `.claude/rules/` *"additive only"* — while D3's own reasoning rejects
that directory as a rule surface because it is read by Claude Code and nothing else, making an
override invisible to other tools and contradicting `AGENTS.md`.
Upstream contradicts itself, and R36 would be moving a file **from one forbidden location to
another**. **Do not act until upstream resolves `:605` against LD-04** — flag it via **R20**.
Staying put is currently the least-wrong option, and it is the one R30's citations already
point at.
**Acceptance criteria (stub):** file moved, every citation updated (grep, don't guess), the
§7 deltas table intact, no substance change.

### R20 — Promote R11's testing deltas upstream  (Low)
**Context (from R11):** `docs/testing-standards.md` §7 is a 10-row deltas table written so
a human can decide what belongs in the shared `governance/` submodule. Candidates, ranked:
1. **Strongest** — replace the flat 80% coverage rule with risk-category requirements, or
   sanction "no coverage target on predominantly presentational codebases" as an explicit
   deviation, so each project needn't re-argue it.
2. Narrow snapshot-per-component to *project-owned* components; never require snapshots of
   vendored code.
3. Add a carve-out for "CI cannot reach a database" — upstream's
   integration-test-every-DB-query rule doesn't contemplate it.
4. Add a "data/content shape" tier to the test priority order for content-driven sites.
5. Reword `governance/CLAUDE.md:63` from "Tests exist per testing-standards.md" to "meets
   the project's testing standard" — as written it is unsatisfiable until a runner exists.
6. Soften `governance/docs/rules/coding-standards.md:7` (`kebab-case.tsx`) to "explicit and
   enforced per project" — this repo uses `PascalCase.tsx` throughout, and its own note at
   `:16-17` already implies this.
**Acceptance criteria (stub):** a decision recorded per row (promote / decline / defer);
promoted rows land as a **submodule commit** in `robertopib/ai-dev-governance`, then the
gitlink is bumped here.
**⚠️ This is the one item that legitimately edits the submodule** — it is shared with other
projects, so changes affect them. Same caveat as R7. Never edit it from a task that isn't
this one.

**RE-SCOPED 2026-08-10 (T6) — and mostly overtaken by events. Verify before working it.**
The framework has **already harvested this repo**, without a PR from us. Upstream
`origin/main` now carries `docs/alignment/` (10 files: a cross-project gap analysis, a
decisions doc **D1–D8**, four per-project planning prompts) plus
`docs/delivery/{roadmap,locked-decisions}.md` — our patterns, adopted upstream. Four things
were harvested, not one: the conductor/worker loop, the **Locked decisions register**,
`.claude/commands/`, and the downstream-precedence clause.
Status of our §7 deltas as of the tip:
- **D3 adopts our precedence formulation** — with a safety floor and a mirrored-path surface
  (see R33, R36).
- **D4 adopts our coverage argument** and quotes R11 directly, but refines it: upstream will
  forbid the *harmful shape* (a repo-wide ratio counting vendored code, used as a primary
  gate) rather than banning percentages absolutely — *"no coverage percentage, ever" is right
  for Portafolio and over-generalized as an upstream absolute.* **That does not conflict with
  our Locked decision**, which is scoped to this repo.
- **D4 also lifted a drafting pattern from us**: *"a deferral records its reason and states
  explicitly what it does not reopen"* — generalized from our Playwright/visual-regression
  clause.
- **Neither D3 nor D4 is implemented yet** — the 80% mandate is still live at
  `docs/rules/testing-standards.md:77`.
**So R20 is now: decide what, if anything, is left to push, and in what form** (issue, PR, or
written hand-off) — most likely a review of D1–D8 for anything that misrepresents our
position, plus the deltas R34 records. Upstream is adopting **SemVer** (D2); once it tags
`v1.0.0` we can pin deliberately instead of tracking a moving `main`. **Do that.**

### R21 — Media picker can't select an image (R10 regression, live in prod)  (High)
**Symptom (owner, 2026-08-03):** on a Proyecto's **Imagen** field, "elegir existente"
opens the Biblioteca de Imágenes drawer, but **no row can be chosen** — there is no
clickable cell, no checkbox, nothing. The only way to attach an image is "crear nuevo",
which re-uploads a duplicate 11–18 MB original to R2 every time. So the media library is
effectively write-only: 43 images exist and none can be reused.

**Root cause — verified in source, all line refs in `cms/node_modules`:**
- The **first active column is the row's click target**:
  `isLinkedColumn: enableLinkedCell && colIndex === activeColumnsIndices[0]`
  (`@payloadcms/ui/dist/providers/TableColumns/buildColumnState/index.js:141`).
- In a list **drawer**, that cell is the *only* select affordance, and the wiring exists
  **only inside `RenderDefaultCell`** — it reads `useListDrawerContext()` and attaches
  `onClick → onSelect({ collectionSlug, doc, docID })`
  (`.../TableColumns/RenderDefaultCell/index.js`). The handler is **never passed to a
  custom Cell**: in `renderCell.js`, `cellServerProps.onClick` is
  `baseCellClientProps.onClick` — always `undefined`.
- `renderCell` resolves a custom Cell via `RenderCustomComponent`, which returns the
  custom component and **never renders the `RenderDefaultCell` fallback**
  (`elements/RenderCustomComponent/index.js`: falls back only when `CustomComponent ===
  undefined`).
- **R10** set `defaultColumns: ['preview', 'alt', 'updatedAt']`
  (`cms/src/collections/Media.ts:20`), putting our `MediaThumbnailCell` — a bare `<img>`
  with no `onClick` (`cms/src/components/MediaThumbnailCell.tsx`) — in the linked slot.
  Result: **no selectable cell in any row.**
- **No checkbox fallback exists here:** `enableRowSelections: hasMany`
  (`fields/Upload/Input.js:587`), and Payload's own comment at `:301` is *"only hasMany
  can bulk select."* `Projects.image` is single-valued, so row checkboxes are
  deliberately off — this is not a flag we can flip. See **R22**.

**Blast radius:** `main` carries the same `defaultColumns`, so **production is affected**.
`image` on Proyectos (`cms/src/collections/Projects.ts:104-112`) is the **only** upload
field in the schema, so this is the single path for attaching any portfolio image.

**Fix options (worker decides; record the tradeoff in the outcome):**
- **(a) Reorder — recommended.** `defaultColumns: ['alt', 'preview', 'updatedAt']`. `alt`
  becomes the linked cell (a real `DefaultCell`, so `onSelect` is wired again); the
  thumbnail moves to column 2 and stays visible. One line, no new component,
  upgrade-safe. Cost: walks back R10's *thumbnail-first* layout, not the thumbnail itself.
- **(b) Client wrapper, thumbnail stays first.** Server Cell computes the R2 `src` (it
  must stay server-side — `R2_PUBLIC_URL` is server-only, see the `MediaThumbnailCell`
  header) and hands it to a client child that calls `useListDrawerContext()` to wire
  `onSelect`, falling back to a doc link outside a drawer. **Cost: `useListDrawerContext`
  is not reachable from a public subpath** — `@payloadcms/ui` exports only
  `./elements/*` → `elements/*/index.js`, and `ListDrawer/index.d.ts` does **not**
  re-export it (it lives in `Provider.js`). Requires a deep `dist/` import that breaks
  silently on upgrade — the exact failure mode R3c's approach was chosen to avoid.

**Acceptance criteria:** (1) in the Imagen field, "elegir existente" → clicking a row
selects that image and closes the drawer, and the Proyecto saves with it; (2) the
thumbnail column still renders (R10's intent preserved); (3) the main media list view
still navigates to the doc on click; (4) verified on **cms-preview** by actually
attaching an existing image to a real Proyecto, then rolled to prod; (5) public site
pixel-identical — 0.000%.

**Status: done (PROD)** 2026-08-04 — commit `c60b83f`, PR #6 → `preview` (`7298825`),
PR #7 → `main` (`8e48d81`) on `authorize production deploy`. Verified by the owner on both
preview and prod. All 5 criteria met; pixel-parity 0.000%/24; no schema, no migration, no
lockfile change, nothing under `src/`.
**Fix shipped = option (a), but with `filename`, not the suggested `alt` — and it beat the
stated tradeoff.** `defaultColumns: ['filename', 'alt', 'updatedAt']`. On an upload
collection `filename` is not a plain text cell: `cellComponents` has **no `text` key**, so
`DefaultCellComponent` is falsy and `DefaultCell` falls through to its `FileCell` branch
(`elements/Table/DefaultCell/index.js:115-123`), which renders a `Thumbnail` **plus** the
name. That `CellComponent` is then wrapped in `WrapElement`, which becomes a
`<button type="button">` whenever `onClick` is present (`:73-82`). **So the thumbnail
itself is the click target** — R10's thumbnail-first layout was preserved rather than
walked back, which was option (a)'s only cost. Conductor re-verified this chain in source.
`alt` was equally viable (44/44 populated, so no empty-placeholder risk) but would have
demoted the thumbnail. Option (b) rejected: the deep `dist/` import isn't worth an outcome
(a) already achieves. The `preview` UI field stays **defined but out of the default
layout** — still offered by the column selector, and keeping it registered left
`importMap.js` byte-identical.
**Locked finding — never put a custom Cell in column 0** of any collection reachable from a
picker. The drawer's only select affordance is the first column, and its wiring lives in
`RenderDefaultCell`, which is skipped for custom Cells. Now recorded as a comment in
`cms/src/collections/Media.ts` at the config itself.
**Locked finding — saved column preferences override `defaultColumns`, and the picker
drawer shares the `collection-media` preference key with the main list.** A stale
preference row silently defeats any `defaultColumns` change. Not hit this time (verified
`upsertPreferences` strips undefined, and the client persists columns only on explicit user
action), but it is a live trap for any future column work — and the reason
`reset-media-list-prefs.ts` exists. Its docstring was corrected in the same commit.
**⚠️ PR #7 promoted 13 commits, not just this fix** — it also carried R2's CI gate, R11's
testing standards, the `qa` agent and session notes to `main`. All docs/CI/tooling with
zero `src/`, `content/` or migration changes, so the public output was unaffected; flagged
to the owner before merging. **Consequence: `main` now has CI and the testing standard.**
**Notes:** admin-only, **no schema, no migration**. If a component is added/changed, run
`pnpm generate:importmap` (R10/R3c precedent) — CI checks `importMap.js` drift and will
redden the PR otherwise.
**Regression-test exemption (deliberate, per R11):** the locked standard makes "a bug fix
ships a regression test that fails without the fix" non-negotiable, but **no runner is
installed yet** (that's R12) and admin UI is never pixel-tested. Do **not** install Vitest
here — a prod content-editing blocker must not wait on tooling. Instead R12 must add the
cheap config invariant that would have caught this: assert `Media.admin.defaultColumns[0]`
resolves to a field with **no custom `Cell`** (or, if option (b) ships, that the Cell wires
`onSelect`). Tracked in R12's acceptance criteria — this debt is recorded, not skipped.

### R22 — Media picker ergonomics: `alt` in the drawer  (Low)
**Context (owner request during R21 triage, 2026-08-03; rescoped after R21 shipped).**
Requested: an explicit checkbox/radio control, multiple selection, and editing `alt` from
inside the picker. **R21 largely settled the affordance half** — `FileCell` puts the
thumbnail *inside* the select button, so the click target is now a 44px image plus its
filename, not an invisible text cell. Re-evaluate whether anything further is needed before
building. What remains, verified:
- **Radio/checkbox per row:** still no built-in for single-value upload fields
  (`enableRowSelections: hasMany`, `fields/Upload/Input.js:587`). Achievable only as a
  custom column rendering a visible "Seleccionar" control — which lands in the same
  `useListDrawerContext` deep-import problem as R21 option (b), **and a custom Cell must
  not be column 0** (R21's locked finding). Given the thumbnail is now the button, this is
  probably not worth the upgrade risk — try discoverability first (hover/cursor styling, a
  hint line, `admin.description`) and only then consider a control.
- **Multiple selection: not applicable to the current schema.** `Projects.image` is one
  image per card and the public renderer consumes one. Native bulk select (`onBulkSelect`,
  `Input.js:588`) switches on automatically **if a field is `hasMany: true`** — so this
  comes for free the day a gallery-type field is added, and until then has no target.
  Making `image` itself `hasMany` is a **content-model change**: migration + public
  renderer + both fidelity twins (R13). Out of scope; do not do it as a picker fix.
- **`alt` editing:** already possible **after** selection — `RelationshipContent/index.js:142`
  renders an Edit button opening a DocumentDrawer on the media doc. Real gaps: it's not
  discoverable, and there's no way to fix a bad `alt` *while choosing*. `alt` is
  **localized**, so any in-drawer editor writes only the active locale — that must be
  explicit in the UI or it silently creates es/en drift (the exact class of bug R12's
  2,709-pair baseline exists to catch).
**Acceptance criteria (stub):** selecting an existing image is *visibly* selectable
without reading docs; `alt` is viewable and correctable from the choosing flow (or one
documented click away); no deep `dist/` imports without recording the upgrade risk; if
`hasMany` is ever wanted, it's a separate item with a migration. Admin-only — pixel gate
n/a, no schema.
**Do first:** ship R21. This item is polish on top and must not delay the prod fix.

### R23b-i — Additive migration + backfill  (High) — **done (preview) 2026-08-11**
PR #40, squash `51b9e6b`. **16 clients · 20 parents · 40 `projects_images` · from 57 rows** —
computed, and matching the conductor's cross-check exactly. `cliente_id` set on 17; 16 < 17
because OFF DAY Trainer spans two categorías. All of §5.3's checks 0–7 pass. Both exporters
byte-unchanged. Pixel 0.000%/24. Tests 151 → **161**. **Production is untouched and pending.**
**Rollback demonstrated, not just written** — all six objects present → absent → present, and
the export is byte-identical after the full `down`/`up` cycle, so the backfill is idempotent.
That requirement paid for itself: see the `down` defect below.
**Bonus verification worth keeping:** `GET /api/clients` → **403** while `GET /api/projects` →
**200**. `Cliente` is CMS-only *by demonstration*, not by assumption.

**⚠️ CONDUCTOR ERROR — my headline acceptance criterion was unachievable, on any database.**
I wrote that `git diff --exit-code content/` coming back clean was *"the single most important
criterion in the task."* It can never be clean. Verified at ingest:
- `scripts/fetch-content.mjs:218` writes `JSON.stringify(recon, null, 2)`.
- The committed files are **hand-formatted**: `content/sections/web-apps.json:17` reads
  `"title": { "es": "OFF DAY Trainer", "en": "OFF DAY Trainer" },` — a nested object compacted
  onto one line, which `JSON.stringify(…, null, 2)` cannot produce.
- **Nothing in this repo has ever compared emitted bytes to committed bytes.** R13a's gate
  compares *parsed* objects (`fetch-content.mjs:1164`, `deepDiff(recon, JSON.parse(committedRaw))`)
  and R13b's twin-equivalence compares the two emitters **to each other**. I invented a
  byte-level gate against committed files without checking that it could ever pass.
**The worker's replacement is strictly better than what I asked for:** freeze the export
*before* the migration, re-run *after*, prove all 14 files byte-identical. That isolates the
backfill from pre-existing drift, which `git diff` conflates. Result: **14/14 identical**, tree
`sha256 c2a8291…`, confirmed on **both** twins. **Adopt this instrument for R23b-ii** — the
question "did my change alter the output?" is not the same question as "does the output match
what was committed months ago."
**Root cause, and it is the same shape as R13a's exit-code criterion:** an acceptance criterion
written without checking the mechanism it depends on. **Rule: before making a command the
headline gate, run it once.**

**Two more corrections to my prompt, both the worker's:**
1. **My smoke test named the wrong number.** I asked that `Set Regalo Vinte-Vinte` open as one
   record with **7** images. It has **8** — the owner assigned `Caja de Regalo Navideña` (B8) to
   the same client, so the rule merges it. Not discretionary: 7 would imply 21 parents, not 20.
   The check came from the design doc, written *before* the owner answered; I carried it
   forward unchecked. The 7 views *are* one record, which was the intent.
2. **`payload migrate:create` emits a broken `down` for a new collection** (→ **R44**). It
   generated `DROP TABLE "clients" CASCADE` followed by `DROP CONSTRAINT
   "projects_cliente_id_clients_id_fk"` — the CASCADE has already removed that constraint, so
   `down` fails with *constraint … does not exist*. **Measured, not theorised.** §5.4 predicted
   exactly this FK-ordering hazard, and requiring a demonstrated rollback is what caught it.

**Decisions worth keeping:**
- **The worksheet is parsed, not transcribed** — a wrong client on the right file yields a wrong
  project that *looks* correct. `parseWorksheet()` is pure and unit-tested, and that test **is**
  §5.3 check 0, now permanent in CI rather than a one-off.
- **The backfill lives in the migration**, not a `payload run` script — prod applies via
  `payload migrate` and preview via `ci:build`, so a script would land schema without data.
- **`fisio-equina`'s `order` is derived, not copied.** It is the one image with no page row.
  Within a categoría the home and page sequences differ by a constant offset; applying it lands
  it on exactly the missing page number, **4**. Both facts are asserted in the migration —
  either failing aborts.
- **One dev-data repair, owner-approved:** the `fotografia-producto` order-0 card pointed at
  `Gemini_Generated_Image_…png`, a test upload present in neither `content/` nor
  `public/images`, which made the DB show **41** photographs against the worksheet's 40.
  Repointed to `crackers.png` with preconditions asserted first. It *reduced* pre-existing drift.

**⚠️ HIGH — a correction that blocks R23b-ii's correctness.** The target model's §2.4/§3.2 say
home order equals page order in all four categorías. **False for branding:** home is **0-based**
(`0,1,2,3,4`), page is **1-based with a gap** (`1,2,3,5,…,21`). The substance survives — the
offset is a constant 1 and `fisio-equina` occupies slot 4 — but **R23b-ii's `flatten()` must not
assume the two sequences are the same numbers.** R23b-i handled it correctly; R23b-ii will hit
it head-on. **Fold this into R23b-ii's prompt.**

### R45 — Production pre-flight: does prod match the worksheet?  (High)
**Status: done (preview)** 2026-08-11 — report at `docs/delivery/r45-production-preflight.md`.
**VERDICT: the R23b-i backfill does NOT fit production.** Prod holds **58 image rows / 41
distinct media** against the migration's expected **57 / 40**, so two pre-write assertions fail
(`:214` row count, `:240` unknown media). Promoting today aborts the migration, fails
`ci:build`, and Vercel keeps the last good deployment — **a stuck promotion, no content at
risk**, exactly as predicted. **Every other pre-write check passes on prod**, and the same
script against dev returns 57/40 clean, so the divergence is production-only.
**The unaccounted row:** `projects#581` — `Sesión producto` / `Sesiones privadas`,
`fotografia-producto`, media 71 `1.jpg`, created **2026-08-10**. It is the **only
`placement: 'both'` row in either database** (→ **R46**), its `order: 1` collides with
`croissant.png`, and `alt`/`categoryLabel` are empty.
**14 more are staged** — `2.jpg`…`15.jpg`, uploaded to prod in the same batch, not yet attached
to a project. **Placing any one moves the counts again, so the pre-flight must be re-run
immediately before promoting, not once.**

**The owner's literal question, answered empirically.** The deployed bundle
`/assets/index-DXhnfjR3.js` already contains `Oriana Cordero Obando`, `Sesiones privadas` and
`/images/1.jpg` — conductor-verified by fetching the live site. **Prod-admin edits from
2026-08-10 are live and have survived every deploy since. Promotion cannot lose them.**

**R43 is resolved and its framing was backwards.** Three-way comparison:
- **Brand name — prod and dev AGREE (`Oriana`); `content/site.json` is the stale outlier.** I
  had recorded committed content as a candidate source of truth. It is not. (→ **R47** for the
  half-finished English string.)
- **`pages.json` — prod matches *committed's* structure (13 home blocks); dev has 8**, missing
  five `portfolioIntro` blocks. So **`preview` renders a materially different home page than
  production**, and dev is the outlier here — the reverse of the brand case.
- `case-studies.json`: prod and dev identical, committed stale. `categories.json`,
  `sections/photography.json`, `ui.json`: prod is the outlier (it holds `1.jpg` / the rename).
**R43's own path counts are not comparable** to these — different differ. The *relationships*
are the finding.

**⚠️ Correction to RELEASE.md step 3, worth folding into R27/R44.** `export-content.ts` **cannot
be run against prod from a branch carrying an unapplied schema migration** — it boots Payload
with *that branch's* config, whose `projects` query selects `cliente_id` and joins
`projects_images`, columns prod does not have until the migration runs. It failed at that query,
before touching anything. R30 rewrote step 3 as read-only verification; the note now needs the
caveat that the optional export is unusable in exactly the situation you most want it.
The worker substituted `SELECT`-only queries replicating **every** pre-write assertion, plus
`fetch-content.mjs`'s `main()` against the deployed prod API. Better instruments for the job.


**Raised by the owner 2026-08-11:** *"content edits have been done in production like the brand
name, so how can we reliably ensure those changes are not lost once we promote?"*

**First, the reassuring half — verified, not reasoned.** **Promoting code cannot lose production
content.** `vercel.json`'s `buildCommand` is `node scripts/fetch-content.mjs && pnpm build`, and
`fetch-content.mjs:107` reads `PAYLOAD_API_URL`, which is scoped per Vercel environment. So the
production site **rebuilds from the production CMS on every deploy**; committed `content/*.json`
is overwritten at build time and exists only as a deterministic CI fixture (CI deliberately never
runs `fetch-content` — Locked decision). An edit made in the prod admin is re-fetched on the next
build.

**The real exposure is the migration, and it already fails safe.** Promoting to `main` runs
`payload migrate` inside `ci:build`, applying R23b-i's backfill to the **production** database.
That backfill asserts the database holds exactly **57** image rows
(`cms/src/migrations/20260811_114118_r23_clientes_images.ts:213-214`) and the first write is at
`:364` — so a mismatch **aborts before touching data**. `ci:build` then fails, `next build` never
runs, and Vercel keeps the last good deployment (the **R8** shape, documented in RELEASE.md).
**So the failure mode is not lost content — it is a red deploy and a stuck promotion**, found at
the worst possible moment.

**Why prod plausibly differs, and this is the point of the item.** The worksheet's 40 images and
57 rows were derived from **committed content**, which is stale against *both* databases.
**Dev turned out to hold 41 photographs** — R23b-i found a stray `Gemini_Generated_Image_…png`
test upload and repaired it. **Prod is a third, unexamined state**, and the owner has confirmed
content was edited there. If prod holds rows the worksheet never described, they receive no
parent — and **R23b-ii's cleanup, which deletes the 17 duplicate rows and drops the old columns,
is where content could genuinely be lost.**

**Acceptance criteria (stub):** a read-only reconciliation of production against the worksheet —
row count, distinct media count, and per-categoría breakdown — with a clear verdict: *the backfill
fits prod as-is*, or *these specific rows are unaccounted for*. **No writes, no migration, no
deploy.** `export-content.ts` has been genuinely read-only since **R13a** (zero
`writeFileSync(path.join(CONTENT_DIR` in either it or `export-emit.ts`; everything goes to
`OUT_DIR = /tmp/export-out`), and **R30** rewrote RELEASE.md step 3 as read-only pre-deploy
verification with **no authorization phrase**.
**Sequencing this protects:** pre-flight → fix any gap in the worksheet → R23b-ii on preview →
**one** promotion carrying both migrations, so prod migrates once rather than twice → cleanup only
after byte-identity is proven **on prod**, not just dev.

### R23b-ii / R23b-iii — why the cleanup was split out  (conductor, 2026-08-11)
**`r23-target-model.md` contradicts itself, and the careful half wins.**
- **§5.1 (`:546-547`)**: the old `placement`/`image`/`alt`/`categoryLabel`/`order`/`size`
  columns *"stay in place, unused, until a follow-up migration removes them once byte-identity
  has been proved on `preview` **and** production."*
- **§7 (`:679`)**: *"R23b-ii — exporter flattening + byte-identity proof **+ cleanup**."*
§5.1 is right and §7 is a summary that lost a condition. **Production is not migrated until the
promotion**, so "byte-identity proved on production" cannot be true while R23b-ii is being
written. Shipping the cleanup in the same promotion that switches the exporters would drop the
fallback columns and delete the 17 duplicate rows **in the same deploy that first exercises the
new emitters against production data** — with no way back except a Neon branch restore.
**So: R23b-ii is exporters + proof, and R23b-iii is the cleanup, after a successful promotion
and a byte-identity check against production.** The columns sitting unused for one release is
the cheapest insurance available.

### R49 — Make R23b-i's backfill survive a prod/dev row-count difference  (High)
**Blocks the promotion, and would surface at the worst possible moment.** R23b-i's migration
hard-codes `EXPECTED = { images: 40, clients: 16, projects: 20, sourceRows: 57 }`
(`20260811_114118_r23_clientes_images.ts:34`) and aborts on any mismatch. **Prod holds 58/41**
(R45), and prod's `migrate:status` shows this migration as **`Ran: No`** — so promoting runs it
as written and aborts.
**Answering `1.jpg`'s client later does not fix it.** The counts are baked into a file that is
already written. And **widening the constant to 58/41 breaks dev, which has 57/40.** One
constant cannot satisfy two databases that legitimately differ — and they will keep differing,
because the owner edits production.
**The assertion is testing the wrong thing.** Its real job is *"no row is silently orphaned"*,
not *"there are exactly N rows"*. A set comparison in one direction — **every row in the
database has a worksheet entry** — holds on both databases and keeps the safety property:
prod gaining an unknown row still aborts. Worksheet entries with no matching row become
informational (dev simply lacks `1.jpg`), not fatal.
**Editing the migration is legitimate here, and only because rollback works.** The rule against
modifying an applied migration protects one applied somewhere you cannot roll back. This one is
applied **on dev only** (prod: `Ran: No`), dev is disposable, and R23b-i **demonstrated** `down`
→ `up` clean and idempotent. That demonstration is what makes this cheap instead of a crisis.
**Verified before scoping:** the migration already handles `placement: 'both'` correctly —
`:217-218` map it to both `onPage` and `onHome`, feeding `showOnPage`/`showOnHome` at
`:300-301`. So `1.jpg` needs no special handling beyond being *known*.
**Acceptance criteria (stub):** the same migration applies cleanly to both a 57/40 and a 58/41
database; `1.jpg` is in the worksheet as `—` (own project, no client — the owner parked its real
client and the new model makes reassignment a dropdown); the map is regenerated, not hand-edited;
dev is rolled back and re-applied; and the R45 pre-flight script reports prod would now pass.

**Status: done (preview)** 2026-08-11 — PR #46, squash `7ae97f8`. Tests **173 → 181**. Dev
rolled back and re-applied; counts identical to R23b-i's table; export 14/14 byte-identical by
the freeze/re-run instrument. **Prod evidenced read-only: 58/41, every pre-write assertion
passes, projected 16 clients · 21 parents · 41 images.** The 58/41 blocker is closed.

**Conductor confirmation, requested by the worker.** They flagged the unit test's change from
set-equality to directional as *"not a weakening, but the conductor should confirm it reads that
way."* **Confirmed, and it is formally equivalent.** The old assertion was `A === B`. The new one
is `B ⊆ A` (no photograph lacks an answer) **and** `(A \ B) === PRODUCTION_ONLY`, pinned by
name, sorted, exact. Those two conjoined are the original statement with the difference made an
explicit reviewed allowlist instead of implicitly empty — when the list is empty they are
identical. An unexpected stray still fails **by name**; a missing answer still fails. The only
erosion path is appending to `PRODUCTION_ONLY` casually, and the file already says *"Adding to
this list is a deliberate act, never a fixup."* Good flag; right answer.

**A real bug found on the way, and it is the worksheet's own failure mode.**
`parseWorksheet` matched `endsWith('.png')`, so `1.jpg` would have been **silently dropped** —
no error, no entry, and the migration would then have aborted naming a row the worksheet
"didn't describe" when in fact the parser had discarded it. Now a regex, with a test. This is
exactly the class of silent-skip the worksheet exists to prevent.

**Better evidence than the prompt asked for: the abort rolls back the DDL too.** After a failed
`payload migrate` on dev, `clients`, `projects_images`, `projects_images_locales`,
`projects.cliente_id` and `enum_projects_images_size` were **all absent** and `migrate:status`
still read `Ran: No`. So the production failure mode is a clean red build with **nothing
half-applied** — which materially de-risks the promotion, and was previously only inferred.

**Design decision worth carrying into R23b-ii:** the reconciliation is a **pure importable
library function** (`cms/src/lib/r23/reconcile.ts`), not inline migration code. That is why the
prod pre-flight could **import the real `reconcile()`** rather than hand-mirror the migration's
checks — R45's script mirrored them, which is precisely the drift shape R13b warns about. Prefer
importable over mirrored wherever a check has to run in two places.

### R46 — `placement: 'both'` is honoured by one exporter and dropped by the other  (Medium)
**Found by R45; conductor-verified in source 2026-08-11. This is a live production render bug,
not a theoretical one.**
- `categories.json` honours it — `scripts/fetch-content.mjs:741`:
  `p.placement === 'page' || p.placement === 'both'`.
- `sections/*.json` does **not** — `:264` filters on **exact equality** (`p.placement ===
  placement`), so a `both` row matches neither `'home'` nor `'page'` and **lands in neither
  array**.
`src/app/pages/ProductPhotographyProjects.tsx:6` imports `content/sections/photography.json`,
so a `both` row is **invisible on the photography page** while still appearing in
`categories.json`. Confirmed against the deployed production bundle
(`/assets/index-DXhnfjR3.js`): `images/1.jpg` and `Sesiones privadas` are both present, yet
`sections/photography.json` still reads 6 home / 12 page.
**The owner hit this by choosing the obvious option.** `both` is offered in the admin
(`Projects.ts`, "Ambas") and it half-works. Every other two-placement photograph in either
database is stored as **two rows** — `1.jpg` is the only `both` row that exists.
**⚠️ This collides with R23b-ii's byte-identity proof, and the collision is unavoidable.**
R23's model replaces `placement` with per-image `showOnHome`/`showOnPage`. A `both` row becomes
`true`/`true`, and the new exporter would emit it into **both** arrays — which is *different*
from today's output, where it appears in neither. So while a `both` row exists, R23b-ii must
either **reproduce the bug** to hold byte-identity, or **fix it** and accept a deliberate,
explained render change. **That is an owner decision, not an implementation detail.**
**Acceptance criteria (stub):** the two filters agree; a `both` row appears in exactly the
places the admin label promises. If fixed *before* R23b-ii, the collision disappears and
byte-identity stays clean — which is the cheapest ordering.

**OWNER DECISION 2026-08-11: fix R46 first.** Confirmed the cheapest ordering.
**Conductor-verified before emitting — both twins share the identical inconsistency:**

| | `sections/*.json` | `categories.json` |
|---|---|---|
| REST (`scripts/fetch-content.mjs`) | `:264` exact equality | `:741` `page \|\| both` |
| Local API (`cms/src/scripts/export-emit.ts`) | `:292` exact equality | `:827` `page \|\| both` |

They agree with each other today, which is why `twin-equivalence` is green. **Changing one and
not the other turns that test red — correctly.** The Local twin also has a second site,
`resolveGalleryCards` at `:312`, which the REST twin reaches through `projByKey`; both need the
same treatment.
**Effect on the gates, worked out in advance so nobody misreads a green run:** CI's
`pixel-parity` builds from **committed** `content/*.json`, which contains **no `both` row**
(CI never runs `fetch-content` — Locked). So **CI stays 0.000% and that is not evidence the fix
worked.** The visible change happens when production next rebuilds and re-fetches: *Sesiones
privadas* starts appearing on the photography page, which is the intended outcome.

**Status: done (preview)** 2026-08-11 — PR #44, squash `97e599a`. Tests **161 → 173**. Both
twins changed identically; `twin-equivalence` green, and **proven rather than asserted** —
reverting only the REST twin reddens it, naming `pages.json`, `sections/branding.json` and
`sections/web-apps.json`. Regression demo: with the fix reverted in both twins, **6 failed /
13 passed, 3 failures per twin, symmetric**. Pixel 0.000%, **and the worker correctly reported
that as proving nothing here.**

**⚠️ CONDUCTOR ERROR — it was four filter sites, not three.** My R46 detail and prompt both said
*"the REST twin reaches `resolveGalleryCards` through `projByKey`"*. **It does not.** Verified at
ingest: the REST twin has its **own** copy at `scripts/fetch-content.mjs:273`, structurally
parallel to the Local twin's `export-emit.ts:312`. So the map is:

| | `projByKey` | `resolveGalleryCards` |
|---|---|---|
| REST — `fetch-content.mjs` | `:264` | **`:273`** |
| Local API — `export-emit.ts` | `:292` | `:312` |

The worker fixed all four after checking with the owner. **R23b-ii inherits this corrected map** —
a task that patched only three sites would have left one path emitting the old behaviour.

**The finding worth generalizing — an assertion that passes with the bug still in place.** The
worker's first draft asserted on fixture media `delta.png`, which the branding `sports` row also
emits, so the CategoryGallery assertion **passed before the fix was applied**. Media 1–7 are each
shared by several fixture projects, so an assertion naming one cannot say *which row* produced
it. Fixed here by giving the two `both` rows dedicated media (`theta.png`, `iota.png`) and
recording why in the fixture comment. **Generalises → R48.**
**Also added: a grouped `both` row (`projects#107`)**, so the fix cannot be widened into "match
everything" and still pass. Good instinct — the group clause is untouched and now proven so.
**Where the semantics block lives matters:** it is in `twin-equivalence.test.ts`, whose other
assertions compare the twins *to each other* and are therefore blind to what they emit — which is
exactly how this bug survived. Both twins were wrong **byte-identically** and the file stayed
green. A test that only checks agreement cannot catch a shared mistake.

**⚠️ Owner-facing consequence of this fix, on the next production rebuild.** *Sesiones privadas*
(`1.jpg`, `projects#581`) will begin appearing in **three** places: the photography category page
gallery, the landing-page photography preview (`sections/photography.json` `home`), and any
CategoryGallery block scoped to that categoría. R45 recorded its `alt`/`categoryLabel` as
**empty** and its `order: 1` as **colliding with `croissant.png`** — so it will render with a
blank caption in a contested sort position. **An admin content edit, not a code fix.**

**CI infrastructure hiccup, not a code problem.** On the first attempt `Repo integrity` and
`Site` completed every step including `Complete job`, but the check-runs never reported a
conclusion, leaving the PR `BLOCKED` while the run itself read `completed/success`. Re-running
cleared it. **Second CI infra flake this session** — the first was five jobs cancelled while
queued (PR #14). Both times the fix was a re-run and nothing was bypassed. Worth knowing before
debugging a red that isn't.

### R48 — Fixture media 1–7 are shared, so assertions on them can pass vacuously  (Low)
**Found by R46, the hard way.** Its first-draft assertion named `delta.png` and **passed with
the bug still in place**, because the branding `sports` row emits that image too. In
`tests/fixtures/cms-state.ts`, media 1–7 are each referenced by several projects, so an
assertion naming one cannot establish *which row* produced it. R46 fixed this for its own two
rows by giving them dedicated media (`theta.png`, `iota.png`).
**Acceptance criteria (stub):** audit existing fixture-based assertions for the same trap; where
one names a shared image, either point it at dedicated media or assert something that
distinguishes the producing row. **Do not mass-rewrite** — only where an assertion could pass
vacuously. The fixture comment R46 added is the explanation to reuse.

### R47 — Prod's brand rename is half-done  (Low, content)
**Found by R45.** Both databases now read `Oriana Cordero Obando`, but prod's `ui.json`
`en.nav.brand` still reads **`Asenat Cordero Obando`** — the Spanish string was changed and the
English one was not. Conductor-verified against the live bundle: **both names ship in
`/assets/index-DXhnfjR3.js`**, so the English navigation currently shows the old name.
One admin edit; the owner's call, not a code change. **Note for R43:** this makes
`content/site.json` (`Asenat`) the stale outlier, not the source of truth — prod and dev agree.

### R43 — Dev CMS diverges from committed content in 3 files  (Medium)
**Found by R23b-i, and unrelated to it** — identical verdicts before and after the migration, so
this is pre-existing. But **`preview` renders the dev values**, so it is what a visitor to the
preview site currently sees:
- **`site.json` — the brand name differs.** Committed is `Asenat Cordero Obando`
  (conductor-verified at ingest); dev reads **`Oriana Cordero Obando`**. Two paths.
- **`pages.json` — 589 differing paths**, including a page with **8 blocks against the committed
  13**.
- **`case-studies.json` — 39 differing paths.**
**Someone has to decide which side is right**, and it is a content judgement, not a code fix.
If dev is right, committed content is stale and a `fetch-content` run should be committed. If
committed is right, the dev CMS has drifted or been edited experimentally.
**Do not "fix" this inside R23b-ii** — it would contaminate the byte-identity proof, which is
that task's entire safety argument.

### R44 — `payload migrate:create` emits a broken `down` for new collections  (Low)
**Context (R23b-i, 2026-08-11):** reproducible. The generator emits `DROP TABLE <new> CASCADE`
and then a `DROP CONSTRAINT` the CASCADE already removed, so `down` fails. It cost R23b-i one
failed rollback before being corrected to drop in FK order with the new table last.
**Acceptance criteria (stub):** a note in the migration runbook (`RELEASE.md`, or wherever
R27 lands) telling the next author to **execute `down` before trusting it** whenever a migration
adds a collection. Docs only — do not attempt to patch Payload.

### R23 target model — SETTLED BY THE OWNER 2026-08-10 (locked)
**The owner corrected the model at the R23a review gate, which is exactly what that gate was
for.** R23a's design assumed `Categoría → Proyecto → images`. Wrong: **a client's work spans
several categories**, so `Cliente` cannot sit under `Categoría`. They are different axes.
```
Clientes (NEW collection)
    ↑ relationship
Proyecto ──→ Categoría   (exactly one)
    └── images[]   media · title/alt · size · order · showOnHome / showOnPage
```
**Three decisions, owner-chosen 2026-08-10 — do not re-litigate:**
1. **No product level.** A project holds images directly; the image title names the product.
   Vinte-Vinte's 7 views are 7 images, not a nested product. Matches how the site renders —
   every image is a card.
2. **A project belongs to exactly one Categoría.** A client's branding work and photography
   work are separate projects. Keeps every project rendering on exactly one page, so the
   exporter and the public pages are unchanged.
3. **`Clientes` is a real collection, not a text field.** This is the *root-cause fix*: the bug
   is that grouping lives in a hand-typed string that drifts (`Ana Grace` vs `Ana Grace Salon
   & Estética` split one salon into two projects). A relationship cannot drift, and renaming a
   client becomes one edit.
**Generative rule: one `Cliente` + one `Categoría` = one `Proyecto`** (default; genuine
exceptions allowed). This **auto-resolves four of R23a's six open questions** — Ana Grace's
split prefix, WodFest, Live Técnica Phicontour, and OFF DAY Trainer all collapse to "same
client, same category, same project."
**`Cliente` is CMS-only and invisible to the exporter, so byte-identical output still holds.**
Categoría continues to drive the public pages exactly as today.
**Model validated against real data (conductor, 2026-08-10):** **OFF DAY Trainer appears in
both Branding and Web y Apps** — one client, two projects, two categories. Precisely the
Adriana Muñoz shape the owner described, and R23a had filed it as "no action needed."

**⚠️ CRITICAL FINDING — client is NOT recoverable from the strings, so the mapping cannot be
machine-generated.** The owner's own example proves it: `Crackers D'Argent` and `Pan D'Argent`
name the client, but **`Croissant Artesanal` and `Croissant Premium` carry no client marker at
all** — yet all four are D'Argent's. Same for the gift boxes. R23a's mapping was built by
prefix-grouping, which produces the wrong answer exactly where the owner corrected it.
**Consequence for R23a-ii: the deliverable is a worksheet the owner *fills in*, not a mapping
the owner *corrects*.** Pre-fill only where a client is unambiguously named; leave the rest
blank rather than guessing, because a plausible wrong guess is harder to spot than a gap.

### R23 — Content model: a Proyecto is not a project (CMS-only regroup, Option A)  (High)
**Raised by the owner 2026-08-04 while verifying R21.** Full analysis, with live-data
evidence and two costed options: **`docs/delivery/analysis-projects-vs-photos.md`** (142
lines — read it before writing the task prompt; it is the spec).
**The problem:** one `Projects` row encodes **three unrelated concerns** — which asset,
which project it belongs to, and where it appears. A portfolio's unit of work is a project
containing many images; here the unit is a single image card, so a real project cannot be
represented at all. Measured on live `cms-preview`, category 54 `fotografia-producto`:
**18 Proyecto records for 12 distinct images.**
- **(a) A project is a naming convention, not an entity.** "Set Regalo Vinte-Vinte" is one
  shoot with 7 views, bound together only by a **human-typed `internalTitle` prefix**.
  Nothing enforces it; renaming the project means editing 7 rows.
- **(b) The same photo is duplicated per placement.** Every photo shown on both home and
  the category page exists **twice** — one `placement: 'home'` row and one
  `placement: 'page'` row pointing at the same media ID. `placement` has a `'both'` option
  (`cms/src/collections/Projects.ts:68-78`), but home shows a different subset/order than
  the page, so the data was duplicated instead. Fixing one photo's `alt` means remembering
  two places.
**Why it looks like this (not an accident):** the CMS was reverse-engineered from committed
JSON whose shape is a flat card list — `content/sections/photography.json` is literally
`page.projects[] = {image, alt, category}`, mapped straight into a lightbox grid by
`src/app/pages/ProductPhotographyProjects.tsx:10-15`. So `Projects` models **the rendered
grid**, not the portfolio. Two existing features are already workarounds for the missing
parent level: `group` (free-text, hand-rolled one-level grouping for branding's four
sub-groups, read at `export-content.ts:753`) and `type: 'caseStudy'` — **the one Proyecto of
58 that IS a real project**, with a slug, detail page and body. The model can host a real
project; it just isn't available to the other 57.
**Scope = Option A only.** Introduce a real parent (`Proyecto` → ordered `images[]`) and
make `export-content.ts` **flatten back to byte-identical `content/sections/*.json`**, so
public renderers don't change and `pixel-parity` stays **0.000%**. `placement` moves to the
parent, collapsing the duplication; where home and page genuinely differ, that becomes
explicit parent fields instead of duplicate rows. `group` retained as-is to avoid widening
scope. **Option B (detail pages) is R24 — do not blend them.**
**Acceptance criteria (stub):** the 7-view shoot is ONE editable record; no photo exists
twice for placement; committed `content/*.json` is **byte-identical** before/after the
migration (this is the whole safety argument — prove it, don't assert it); pixel gate
0.000%; both fidelity twins still agree (R13).
**Cost / risk:** a real migration — new table for image rows, backfill 58 Proyectos →
parents + children, **grouping photography's 7-view sets by their `internalTitle` prefix
needs a one-off mapping the owner must eyeball** (a typo'd prefix silently splits a
project). Touches `export-content.ts` **and** `fetch-content.mjs`.
**Sequencing (why it depends on R12 + R13):** it rewrites the exporter that produces every
committed fixture, and R13 owns both twins — doing this first would mean rewriting that
logic twice and losing R13's induced-divergence check as evidence. R12's content-resilience
tests should exist first so the restructure has a net. **Order: R12 → R13 → R23 → decide R24.**

### R24 — Project detail pages (Option B): a deliberate public redesign  (Medium)
**Context:** the other half of `docs/delivery/analysis-projects-vs-photos.md` — what the
owner actually described as "how a portfolio works". Category page shows project **covers**;
each project gets `/proyectos/:cat/:slug` with its own gallery, reusing the case-study route
pattern that already exists (the one real project of 58 proves the pattern works).
**⚠️ This is the one item that intentionally breaks the pixel gate.** It is a public
redesign, so `pixel-parity` goes red **by intent** — the locked 0.000% invariant must be
**explicitly suspended for that PR and re-baselined**, with the owner's sign-off. That makes
it categorically different from every item shipped so far. It also can't be validated by the
existing gate, so it wants R12's tests in place first.
**Not a data-model fix — a design project.** Needs real design decisions: cover-grid layout,
project-page template, and what happens to the current lightbox. Scope it **with the owner
as a design decision** after R23 has given it a sane model to render.
**Acceptance criteria:** deliberately not stubbed — this needs a design brief first, not an
implementation plan. Do not emit a worker prompt for this until the owner has made the
design call.
**Does NOT reopen the page-builder** (locked non-goal): R23/R24 add a *content* hierarchy
and routes, not layout editing.

### R25 — Promote `typecheck` + `tests` to required checks  (Low)
**Context (from R17, 2026-08-04):** the `typecheck` job exists and is green, but **gates
nothing** — per Locked decisions a new job is only made *required* after two green runs, and
branch protection must be updated by hand (`gh api`, **both** `main` and `preview`) and
verified with a real push. R17 deliberately left it non-required with one green run.
**Do this once, not twice:** R12 will add a `tests` job with the same requirement. Batching
both into a single branch-protection edit avoids touching protection on two branches twice.
**Acceptance criteria (stub):** both jobs required on both branches; verified by a real
rejected push (R2's precedent — the first `enforce_admins: false` apply silently let a push
through, so *verify*, don't assume); the required-check count in Locked decisions updated from
4 to its new value (**6**).

**UNBLOCKED 2026-08-04 (R12 ingest) — the two-green-runs bar is met for both jobs.**
`typecheck`: green on R17's PR #8, then on R12's PR #9 (plus the post-merge run on
`preview`). `tests`: green on R12's PR #9 (36 s) and on the post-merge `preview` run. Both
jobs now have ≥2 green runs each, so the precondition in Locked decisions is satisfied and
this is ready to queue. Exact job names to add to the required list — copy verbatim, GitHub
matches on the job's `name:`, not its key:
- `Site typecheck (tsc --noEmit)`
- `Tests (vitest, offline)`

**DONE 2026-08-04** (PR #11, squash `aa3edb0`). Both branches now require **6** contexts;
enforcement verified by a rejected push, a 405 merge attempt, and a single-job re-run that
flipped the PR `CLEAN → BLOCKED → CLEAN` for each new check independently. Mechanics promoted
to **Locked decisions** ("How to edit branch protection"). Full record:
`.claude/session-notes/2026-08-06-R25.md`.

### R31 — Same `console.*`-then-`exit` pattern in three more CMS scripts  (Low)
**Context (from R28, 2026-08-10):** `cms/src/scripts/seed.ts:806`,
`backfill-thumbnails.ts:90` and `reset-media-list-prefs.ts:73` all end in `process.exit(0)`
after `console.*`, the exact shape R28 fixed. They were outside R28's named site list, so
correctly left alone. **`seed.ts` is the one that prints enough to matter.**
**Now a one-line import each** — `cms/src/scripts/write-sync.ts` already exists and is mirrored,
tested and documented. Cheap.
~~**Premise sharpened by R37 — risk raised Low → Medium.** These three scripts lose their
output essentially always; `seed.ts` prints enough to matter.~~

**❌ CLOSED WITHOUT WORK 2026-08-10 — the premise is false. Verified before emitting a prompt;
no session was spent on it.** R28's bug is *buffered stdout/stderr discarded by an immediate
`process.exit`*. It needs (a) output on a **pipe-backed stream** and (b) **enough of it** to
pass the buffer boundary. None of the three scripts satisfies both:

| Script | `console.*` | `payload.logger` | Verdict |
|---|---|---|---|
| `seed.ts` | **0** | **0** | **No stdout output at all.** Writes `/tmp/seed-report.json`. Nothing to lose. |
| `backfill-thumbnails.ts` | **0** | 3 | Report goes to `/tmp/backfill-thumbnails-error.json`. |
| `reset-media-list-prefs.ts` | **0** | 2 | One ~80-byte summary line before `exit(0)`. |

Two independent reasons this is a non-defect:
1. **`grep -c 'console\.'` returns 0 for all three.** The R28-shaped call does not exist here.
   Both `seed.ts:6` and `backfill-thumbnails.ts:6` carry a header note — *"console output is
   swallowed in this sandbox → results go to `/tmp/…`"* — so they had already routed around
   output loss by writing files, years before R28 named the mechanism.
2. **Even the one real candidate is far below the boundary.** `reset-media-list-prefs.ts:60-62`
   logs a single interpolated line (~80 bytes) before `process.exit(0)` at `:73`. R28's own
   measurement settles it: *"A test driven with a small message proves nothing: **55 bytes
   survive unfixed, every time**"* (`exit-flush.test.ts:15`). The buffer boundary is 64 KiB on
   macOS and ~146 KiB on the Linux runner. An 80-byte line is never at risk.
`fs.writeFileSync` is also immune regardless — R28 measured *"Files were never affected —
POSIX file writes are synchronous. It is pipes."*

**Where the original claim came from:** R28's worker reported the three scripts *"all end in
`process.exit(0)` with the same shape"*. The **exit** is the same shape; the **output** is not,
and the output is the whole bug. Nobody grepped for `console.` until now. **Fifth instance of
this project's recurring failure mode** — inherit a claim, restate it, never open the file.
This time it was caught at prompt-writing rather than after a worker session, which is the
verification discipline paying for itself.
**R32 no longer folds in here** — it is a real, separately-verified item and now stands alone.
**Note the R28 lesson when scoping:** the bug is `console.*` before **any** `process.exit`,
including `exit(0)` — not just before a failing one.
**Acceptance criteria (stub):** each script's output survives a pipe at >64 KiB; exit codes
unchanged; no behaviour change. Regression coverage can reuse
`tests/fidelity/exit-flush-probe.mjs`.

### R30 — Make the docs tell the truth (testing-standards ×10 + RELEASE.md; absorbed R27)  (Low)
**Both found by R29, 2026-08-07. The standard is binding, so a wrong line in it propagates into
every task prompt that cites it — which is exactly how both of these caused damage.**
1. **§4's file layout lists `cms/src/**/*.test.ts`, which the root runner cannot reach.**
   `vitest.config.ts`'s `include` is `src/**/*.test.{ts,tsx}` + `tests/**/*.test.{ts,tsx}`, and
   the root tsconfig doesn't include `cms/`. A CMS unit test placed where §4 says would simply
   never run — silently green. Replace that row with the **test-only alias + ambient `.d.ts`**
   pattern actually used twice now (`tests/cms-twin.d.ts` for R13b, `tests/cms-publish-endpoint.d.ts`
   for R29), and note that CMS-side tests live under `tests/`.
2. **§1's risk-3 row (`:73`) says "The editor sees success; nothing rebuilds" — false.**
   `PublishButton.tsx:35-37` shows a red toast on `reason === 'no-hook'` and always has. Correct
   it to name the real exposure: **non-UI consumers** reading 200 as success, and the fact that
   the whole signal lives in the `reason` string. Keep risk 3 in the ranking — the endpoint
   behaviour is still worth a test, and R29 wrote it — but state it accurately.
**Why this is worth its own item:** the false clause reached three documents and one task prompt
before anyone opened `PublishButton.tsx`. Fixing the source stops the next re-assertion.
**Acceptance criteria (stub):** both corrected; §7's deltas table still consistent; no change to
the standard's substance or to any locked decision. Docs only.
**Two more additions, from R28 (2026-08-10) — fold into the same pass:**
3. **§8 gotcha:** *a message written immediately before `process.exit` is truncated when output
   is a pipe, and CI reads output through a pipe.* Add the sharp edge too: **a bare
   `fs.writeSync` is not the fix** — it works only while the fd is blocking, and merely
   importing from `node:process` flips it non-blocking. Point at `scripts/lib/write-sync.mjs`,
   whose header already documents this at length.
4. **§4** has no note that reaching Node builtins from a test needs a **scoped ambient**
   declaration (`tests/node-builtins.d.ts`), because the root tsconfig deliberately omits
   `@types/node`. That is now the third instance of the same shielding pattern
   (`tests/cms-twin.d.ts`, `tests/cms-publish-endpoint.d.ts`) and belongs in the layout section
   rather than being rediscovered per task.

**All four re-verified 2026-08-09/10 against current `preview`:** §4's `cms/src/**/*.test.ts` is
at `:318` while `vitest.config.ts` includes only `src/**` + `tests/**` (`:59`, `:61`); the
risk-3 row is at `:73`; §8 currently has 9 gotchas. **Note §1's *fact table* row 3 is already
fixed** — R12 corrected the R17 staleness there and left a dated "Updated" note. Only the
**risk-3 row** is still wrong. Don't re-fix the fact table.

**R27 ABSORBED HERE 2026-08-10, and its scope grew on inspection.** `RELEASE.md` is stale in two
places, not one:
- **Step 3 (`:41-46`) is a *production runbook* that describes behaviour that no longer exists.**
  It says running `export-content.ts` **applies schema to prod** and tells the operator to answer
  `y` to a *"DATA LOSS WARNING"*. Neither happens: `push:false` everywhere since 2026-07-30 and
  schema comes from committed migrations (Locked decisions). `:30` likewise calls the script
  "(schema push, read-only for data)". R13a appended an accurate ℹ️ note about the new exit code
  **without** correcting the step around it, so the two now contradict each other. **This is the
  riskiest doc in the repo to leave wrong** — it is typed at a prod database behind
  `authorize db migration on production`.
- **The whole "Automation plan (deferred)" section (`:70-82`) lists shipped work as pending.**
  Verified against the roadmap: **Tier 1** (Payload migrations) shipped 2026-07-30 and was
  confirmed live by **R8**; **Tier 2** (CI gate) shipped as **R2** and has since grown to **6
  required checks** (R25); **Tier 4's email adapter** shipped as **R3a** (done, PROD). Still
  genuinely outstanding: **Tier 3** (deploy ordering / auto pre-migration snapshot) and Tier 4's
  **npm script wrappers** (= the open half of **R3**, tracked as R3b).

**Status: done (preview)** 2026-08-10 — PR #21, squash `f7e3fed`. All 6 checks green, pixel
0.000%/24, 151 tests unchanged, docs only. **Scope grew from 6 corrections to 11**, all the same
class of defect and all in sections already being edited — the prompt invited reporting extras and
the worker fixed them instead of queuing them, which was the right call for docs.
**Beyond the six commissioned:** §4's opener still said *"Recommended, not adopted. No runner is
installed"* (R12 installed it); §1's risk-2 detail and two §8 bullets still said neither fidelity
gate can fail and that `export-content.ts`'s header lies (R13a/R13b closed both — collapsed into
one bullet that keeps the *lesson*: never accept a green report as evidence a gate works);
post-R29 line refs to the publish handler were stale in §1, §7 and §8 (it lives at
`cms/src/endpoints/publish.ts` now); §2's sequence item 3 was still "new, ~20 lines" (R29 measured
the extraction — kept visible, because **an untestable seam is part of the estimate**); and
RELEASE.md step 1 generalized one past release's dropped columns into the standing checklist.
**RELEASE.md step 3 redesigned, not just corrected.** Schema application is no longer an operator
step — it is `payload migrate` inside the deploy's `ci:build` (`cms/package.json:19`). So step 3 is
now **read-only pre-deploy verification with no authorization phrase** (confirm the migration is
committed and wired, then `migrate:status:prod` shows the new one `Ran: No`; stop if it already
says `Ran: Yes`), and **`authorize db migration on production` moved to step 4**, which now takes
both phrases. That also relocates the downtime window — no longer "admin 500s from step 3 until
step 4" but "old CMS code serves against the new schema for the length of `next build`". The R8
failure shape is documented there too: a failed migration means `next build` never runs and Vercel
keeps the last good deployment, **so prod looks healthy while serving old code**.
The 2026-07-30 Context block was marked **superseded** rather than deleted — its premise ("dev uses
Payload `push`, prod has no migration files") is *why* the manual runbook exists, and it is the
sentence that made the rest of the file read as current.
**Worth locking (generalisable):** the old rule "do not import CMS source from a root test" was
**reworded, not deleted** — as written it now contradicts the alias pattern used twice. The real
constraint was never the directory: it is the **transitive import graph reaching
`payload`/`sharp`/`@aws-sdk/*`**, which the `tests` job cannot resolve because it installs root
dependencies only (`ci.yml:265-266`). State the rule about the import graph, not the path.
**Also corrected at ingest:** the prompt told the worker `pnpm lint` "is broken repo-wide (R9)".
More precisely — the **root `package.json` has no `lint` script at all**
(`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`), and `cms`'s `eslint .` exits 2 demanding a flat-config
migration. R9's title says "flat-config missing", which is only half of it.

**One proposed backlog item DECLINED at ingest — it is already a settled decision.** The outcome
suggested filing "`check-migrations.mjs` check 6 is a WARN, not a gate" for a conscious decision.
That decision was already made **deliberately, in R2**, and is recorded in two places: this
roadmap (R2 detail — *"'schema change without a migration' is a **warning**, not a blocker,
because schema-bearing files also carry admin-only changes"*) and the code itself
(`scripts/ci/check-migrations.mjs:112-115` — *"Deliberately a warning, not a gate… Promoting this
to a hard gate needs a real schema diff, which needs a live DB"*). Filing it would have invited a
future worker to re-litigate a Locked decision. **Not a criticism of the finding** — noticing the
gap between "assumed enforced" and "actually advisory" is exactly right, and the answer is that
the gap is known and priced. No item created.

### R32 — `export-content.ts` header mis-describes why `FIDELITY_GATE=0` exists  (Low)
**Context (from R30, 2026-08-10):** `cms/src/scripts/export-content.ts:22-23` says the flag exists
"for the RELEASE.md schema step, where the script is run against prod **for its side effects**".
There are no schema side effects any more (R13a made it read-only; `push:false` since
2026-07-30). The flag's actual job is that **a prod content diff is expected**, so a non-zero exit
would break the operator's pipeline. R30 was forbidden from touching `cms/src/`, so it correctly
left this alone. **Fold into R31** — same directory, same "stale claim in a CMS script" shape.
**Acceptance criteria (stub):** the comment states the real reason. Comment-only; no behaviour
change, and **do not touch the gate semantics** (Locked).

### R28 — The gate can lose its whole report when stdout is redirected  (Medium)
**Context (found by R13b, 2026-08-07).** `console.error`/`console.warn` immediately followed by
`process.exit()` **truncates buffered output on a non-TTY**. Observed twice in ~12 runs — the
process exited with the correct code but wrote a **zero-byte log**.
**Why this is Medium, not Low:** it defeats R13a's entire "fail loudly" guarantee at exactly the
moment it matters — a CI job or script piping the gate's output to a file gets the right exit
code and *no explanation of what diverged*. R13a's value was the message, not the exit status.
**Pre-existing, not introduced by R13b** — reproduced on the pre-split R13a code.
**Acceptance criteria (stub):** the full report survives redirection to a file/pipe. Fix is
small (`process.exitCode` and let stdio flush, or `fs.writeSync(1, …)`), but it **touches the
locked asymmetric-exit path** (see Locked decisions), so it gets its own task rather than being
smuggled into an unrelated one. A regression test must pipe the output and assert it is
non-empty — asserting the exit code alone reproduces the bug it is meant to catch.
**Could fold into R27** (both touch the same scripts and docs) if convenient.

**⚠️ MECHANISM REPRODUCED by the conductor, 2026-08-09 — read this before diagnosing.** The
roadmap's own wording ("redirected to a file/pipe") was imprecise. Measured on macOS / Node 22
with a 200,000-byte payload written via `console.error` immediately before `process.exit(1)`:

| Destination | Bytes delivered | Verdict |
|---|---|---|
| File (`2> log`) | 200,001 / 200,001 | **safe** — POSIX file writes are synchronous |
| Pipe (`2>&1 \| …`) | **65,536** | **truncated at exactly one 64 KiB pipe buffer** |

So it is **pipes, not files** — and GitHub Actions captures job output through a pipe. A *small*
report survives (55-byte payload delivered intact across 5/5 runs), which is why this hid: the
loss is **size-dependent**, appearing only once a failure report exceeds the 64 KiB buffer.
**Both candidate fixes verified at 200 KB**, each delivering 200,001 bytes with exit code 1
preserved: `process.exitCode = 1` (let Node exit naturally) and `fs.writeSync(2, …)`.
**Not reproduced: R13b's "zero-byte log".** I measured 64 KiB truncation, never a zero-byte
result. Same class of bug and definitely real, but the exact zero-byte path is uncharacterised —
possibly Linux/CI buffering or a different timing. **The worker should characterise it rather
than assume my mechanism is the whole story.**

**Status: done (preview)** 2026-08-10 — PR #19, squash `96b2419`. All 6 checks green, pixel
0.000%/24, tests 143 → **151**, `tests` job 32 s. Fix is `scripts/lib/write-sync.mjs`
(`writeAllSync` + a `console`-shaped `syncConsole` sink), hand-mirrored to
`cms/src/scripts/write-sync.ts` for the same separate-Vercel-root reason as `fidelity.mjs`.
Measured on the **real CLIs**, piped: `export-content` gate-ON went **65,530 → 240,891 bytes**;
`fetch-content --gate` went **65,687 → 210,651**. Exit codes identical in all 8 modes — and true
*by construction*, since no `process.exit` call or condition is in the diff. Only `console`
references left in either script are comments (conductor-verified).

**⚠️ CONDUCTOR ERROR — my verification was right about the wrong thing.** I told the worker
"both candidate fixes verified at 200 KB", having measured `fs.writeSync` delivering 200,001
bytes. **That result was an artifact of my scratch script importing nothing else.** A bare
`fs.writeSync` delivers in full only while fd 2 is still **blocking**; libuv flips it to
`O_NONBLOCK` the moment Node instantiates `process.stderr`, after which a bare `writeSync`
truncates at 65,536 — *identical to the bug it was meant to fix*. Re-confirmed at ingest:
adding a single `import { execPath } from 'node:process'` to my own repro drops it from
**200,001 → 65,536 bytes**. An import is enough; no console call required. **Every real script
is already in the truncating state**, so the offset loop + EAGAIN retry the worker wrote are the
actual fix, not defensive garnish. They also replaced a busy-wait with `Atomics.wait` (measured
1.01 s → 0.08 s user CPU against a reader stalled 1 s).
**This is a different failure mode from the previous three** (`studioLabel`, the exit-code
criterion, R19's premise). Those were claims inherited from a document without opening the code.
This one I *did* measure — but under conditions that did not resemble the target. **Rule: a
verification is only worth what its setup shares with the real thing. A scratch script is not a
1,000-line script with imports.**
**My platform generalisation was also wrong.** I reported a clean 65,536 truncation "every
time"; that is macOS-specific. On **Linux / Node 24 the bug is non-deterministic** — five runs
gave `200000, 146176, 146176, 146176, 146176`, i.e. sometimes no loss at all. The fix delivered
200,000 5/5 on both platforms. This is why the worker's vacuity guard **samples 10 runs** and
asserts at least one lost bytes, instead of asserting that a single run truncates: the strict
form was written first, reddened CI, and was downgraded rather than shipped flaky. Correct call.

**A fourth site I failed to list.** The prompt named three; the `FIDELITY_GATE=0` **warning**
branch prints the same full report and falls through to the trailing `exit(0)`, truncating
identically at exit code 0. Measured before/after: **65,528 → 240,980 bytes**. Lesson: I listed
the sites that *exit non-zero* and missed the one that warns then exits zero — the bug is
`console.*` before **any** `process.exit`, not before a failing one.

**`fs.writeSync` chosen over `process.exitCode`, and the reasoning is worth keeping:**
`export-content.ts` ends in an unconditional `process.exit(0)` that is **load-bearing** (Payload
holds an open pg pool, so the process would not exit on its own) and would silently override an
assigned `exitCode`. Proving otherwise needs a DB run this task forbade. Writing synchronously
touches no exit-control flow, so the locked asymmetry is preserved **by construction** rather
than by test. Applied to *all* output in both scripts, not just the exit-adjacent lines —
mixing `writeSync` with buffered `console` reorders output.

### R29 — `POST /api/publish` handler unit test  (Low)
**Context:** `docs/testing-standards.md` §2's recommended sequence, item 3 — **the last
unstarted item in that sequence** (1 = R12 ✓, 2 = R13 ✓, 4 = E2E, deferred). Closes **risk 3**
in the standard's ranking: `cms/src/payload.config.ts:41-62` returns **HTTP 200** when the
deploy hook is unconfigured (`pingDeployHook` → `{ ok: false, reason: 'no-hook' }`), ~~so the
editor sees success and nothing rebuilds~~ — **that clause is FALSE, see the status block below.**
**Acceptance criteria (stub):** ~20 lines, unit level with a hand-built fake `req`, offline, no
Payload boot. Two branches: **403 when unauthenticated**, and `no-hook` **surfaced in the body**
at 200. **Assert on the body, never the status** (§8 gotcha).
**Note:** this is the *test* only. Whether the status code or the UI should change is **R19**,
which is a separate, still-open decision — do not resolve R19 here.

**⚠️ Not as trivial as "~20 lines" implies — measured 2026-08-07.** The handler is **inline** in
the `endpoints` array at `cms/src/payload.config.ts:41-62`, not an exported function. It cannot
be imported without importing the whole config (DB adapter, plugins, collections). And the
`tests` CI job installs **root dependencies only** (established by R13b), so any test whose
import graph reaches `payload` **fails in CI**.
So R29 needs a small extraction first — the same shape as R13b's: move the handler into its own
module that imports **nothing** from `payload`, and leave `payload.config.ts` referencing it.
What makes this cheap: the handler's only Payload coupling is reading `req.user`, so a
structural param type (`{ user?: { email?: string｜null; id: string｜number } | null }`) removes
the dependency entirely. `pingDeployHook` (`cms/src/hooks/triggerDeploy.ts`) is **already** pure —
global `fetch` + `process.env.VERCEL_DEPLOY_HOOK_URL`, no Payload import — so it is directly
testable as-is and needs no change.
**Reach into `cms/` using R13b's established pattern:** a **test-only** vitest alias plus an
ambient `.d.ts` (`vitest.config.ts` + `tests/cms-twin.d.ts` document why at length — a relative
import drags the module into the `tsc --noEmit` program, where its `fs`/`path` imports fail
because the root tsconfig deliberately has no `@types/node`). Do not put the alias in
`vite.config.ts`; the shipped bundle must never resolve anything inside `cms/`.

**Status: done (preview)** 2026-08-07 — PR #17, squash `9676a97`. Handler extracted **verbatim**
to `cms/src/endpoints/publish.ts` (imports only `../hooks/triggerDeploy`); `payload.config.ts`
keeps the endpoint definition. Tests 130 → **143**; CI `tests` **27 s**; all 6 checks green;
pixel 0.000%/24; no lockfile change. **12 mutations run, each reddening only its own cases** —
plus a vacuity guard (renaming `publishHandler` reddens 11 of 13). The alias was proven
load-bearing rather than assumed: a relative import gives
`triggerDeploy.ts(24,15): error TS2591: Cannot find name 'process'` — exactly R13b's failure mode.
**Three seam guards added beyond the four branches** — a handler tested in isolation proves
nothing about whether the config still uses it, and that risk is *created* by the extraction. So
there are source-text tests pinning the wiring, the path, and the absence of a `payload` import.
Good instinct; adopt it whenever a task extracts code for testability.
**One measured limit, written into the test file rather than hidden:** removing
`pingDeployHook`'s try/catch is NOT caught — the handler's own catch produces a byte-identical
body and only the status differs (500 vs 200), and this file asserts no status there.
**Deliberate, declared departure from "assert on the body, never the status":** one status
assertion, on the **403 only**, reason in a comment. 403 is not part of R19's open question, a
silent downgrade to 200 there is an **auth hole** rather than a redesign, and
`PublishButton.tsx:41` branches on it. Every other assertion is body-only, so R19 can change the
status without touching one of them. Correct call.

**⚠️ CONDUCTOR/STANDARD ERROR — R19's premise is factually wrong, and has been since R11.**
"The editor sees success; nothing rebuilds" is **false**. `PublishButton.tsx:35-37` branches on
`data.reason === 'no-hook'` and raises a red toast — *"No hay un hook de despliegue
configurado."* — and has done since `fcf0335`, the **only** commit that file has ever had.
Conductor-verified in source. **The editor is told.** The wrong clause propagated to three
places: `docs/testing-standards.md:73` (§1 risk 3, the origin), and
`docs/delivery/roadmap.md` in both R19's and R29's detail — I re-asserted it in R29's own prompt
without checking. **Third instance of this failure mode** (after `studioLabel` and the
exit-code criterion): a claim inherited from an earlier document and repeated without opening
the file. Corrections tracked as **R30**.
**What the real gap is** — R19 must be re-scoped before it is worked:
- The affected consumers are **non-UI**: `curl`, monitoring, any future integration reading 200
  as success. Not the editor.
- **The whole signal is the `reason` string**, and until R29 nothing pinned it. Anyone tidying
  `reason` out of the payload would have silently killed the UI branch, degrading the specific
  toast to the generic *"No se pudo publicar"*. Now pinned by an exact `toEqual`.
- **The only non-200 failure path is unreachable and body-identical.** The handler's `catch` →
  500 can fire only if `pingDeployHook` throws, which it is documented never to do; measured, if
  it did the body would be byte-identical to the 200 error path. **So the status carries zero
  information the body does not** — which argues R19 is a UI/contract question, not a
  status-code question.
**Branches worth covering** (all four are real, verified): `403` unauthenticated;
`{ ok: false, reason: 'no-hook' }` at **200** when `VERCEL_DEPLOY_HOOK_URL` is unset;
`{ ok: true }` on a 2xx hook response; `reason: 'error'` when the hook responds non-2xx or
`fetch` throws. **Assert on the body, never the status** (§8) — the whole defect is that the
status says nothing.

### R27 — RELEASE.md step 3 is stale  (Low)
**Context (from R13a, 2026-08-06):** step 3 describes `export-content.ts` applying schema via
**auto-push** and warns of a "DATA LOSS WARNING" prompt. Neither exists any more: `push:false`
is set everywhere and schema comes from committed migrations (Locked decisions, since
2026-07-30). R13a added an accurate note about the script's new exit code but deliberately did
not rewrite the step — out of scope for a gate repair.
**Extra reason this matters:** that step runs the exporter **against production**. Until R13a
the script silently rewrote committed content when it did so; it is now genuinely read-only,
but the surrounding instructions still describe behaviour that is gone.
**Acceptance criteria (stub):** step 3 matches reality (migrations, no auto-push, no data-loss
prompt, current exit-code semantics). Docs only.
**Also trivial, fold in if convenient:** `fetch-content.mjs:159-161` has a dead
`if (fs.existsSync(outPath + '.orig'))` block commented "never used; placeholder for clarity".
R13a left it to keep the diff surgical.

### R26 — TypeScript major-version skew: root 7.0.2 vs cms 6.0.3  (Low)
**Context (found at R17 ingest, 2026-08-04):** R17 installed `typescript@7.0.2` at the root
while `cms/` runs `6.0.3` — **two different TypeScript majors in one repo**. Harmless today
because the two projects have separate lockfiles, separate configs and separate CI jobs, and
both pass. Two reasons it is worth a deliberate decision rather than drift:
1. `docs/testing-standards.md` §4 recommends **one runner for both projects** (R12). A single
   Vitest config spanning both would sit on top of a TS major skew.
2. TS 7 is the native port and removed options the older config may still rely on — R17
   already hit one (`baseUrl` removed in 7, noted in `tsconfig.json`).
**Acceptance criteria (stub):** a recorded decision — align both on one major, or document
why the skew is deliberate and safe. No behaviour change expected either way.

### R2 — Automation Tier 2: CI gate  (Medium)
**Context:** No CI exists (`.github/workflows/` empty). Bad merges to `main` aren't
caught before deploy.
**Acceptance criteria (stub):** a GitHub Actions PR workflow runs `tsc` (cms+site),
`payload generate:types` drift check, `pnpm build`, the pixel gate, and a
"migrations committed / no schema drift" check; failing any blocks merge.
**Status: done (preview)** — `.github/workflows/ci.yml`, 4 jobs, all green on
`preview` (run `30823119081`), PR-triggered pixel gate proven on PR #2 (closed).
Runs on PRs *and* pushes to `preview`/`main`. No secrets; CI never touches a real DB
(placeholder unreachable `DATABASE_URI`; `payload migrate` is NOT run in CI).
- `repo-integrity` (~15s, no install): migrations `index.ts`↔disk both ways,
  `push: false`, two-lockfile invariants. `scripts/ci/check-migrations.mjs`,
  `scripts/ci/check-lockfiles.mjs`.
- `cms` (~1m): frozen `--ignore-workspace` install (mirrors `cms/vercel.json`),
  `payload-types.ts` + admin `importMap.js` drift, `next build` (= the typecheck).
- `site` (~30s): frozen root install + `vite build`. Fully offline —
  `fetch-content.mjs` is not run; `content/*.json` + `public/images` are committed.
- `pixel-parity` (~3m, PRs only): shoots merge base *and* head on the SAME runner,
  requires 0.000%, uploads diff PNGs on failure.
**Locked finding — the pixel gate cannot use `screenshots/baseline` in CI.** That dir
is git-ignored (46 MB) *and* macOS-rendered. Measured Linux Chrome vs the committed
baseline: **all 24 shots differ 0.084%–1.449% with byte-identical page dimensions** —
pure font rasterization, so layout is portable but the 0.000% gate would fail every
PR. Same-platform repeat runs measured **0.000%/24**, which is why head-vs-base at
zero tolerance is safe and needs no committed baseline.
**Deliberate non-gates:** `pnpm lint` (R9 — no ESLint flat config, would fail every
PR); "schema change without a migration" is a **warning**, not a blocker, because
schema-bearing files also carry admin-only changes — a hard version needs a real
schema diff, which needs a live DB.
**Branch protection: DONE 2026-08-03** (same session). Both `main` and `preview`:
PR required (0 approvals), all 4 checks required, `enforce_admins: true`, force-push
and deletion disabled. Verified by probe — a direct push to `preview` is now
`remote rejected … protected branch hook declined`. First apply used
`enforce_admins: false` and the push silently went through anyway; enforcement had to
be turned on explicitly. See Locked decisions. Cost: two empty commits on `preview`
(`0d815df`, zero file changes) that can't be removed without relaxing the rules.

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

### R6 — Root `CLAUDE.md` misinforms agents  (Medium — raised from Low, 2026-08-10)
**Re-verified 2026-08-10; worse than logged, hence the risk bump.** This is the file every
agent reads *first*. It is wrong on three counts, not one:

| `CLAUDE.md` claims | Reality |
|---|---|
| `:12` "Hosting: SiteGround (deployed via GitHub Actions + rsync)" | Vercel — two projects (`asecoroba-site`, `asecoroba-cms`) |
| `:38` "Push to `main` triggers deploy via `.github/workflows/deploy.yml`" | **That file does not exist.** `ls .github/workflows/` → `ci.yml` only |
| `:39` "Built files are rsync'd to SiteGround `public_html`" | `main`→Vercel Production, `preview`→Vercel Preview |

An agent orienting today is told the wrong platform, the wrong mechanism, and a workflow
file that isn't there. It survived this long because `INFRASTRUCTURE.md` and `RELEASE.md`
are correct, so nobody reading *those* noticed.
**Acceptance criteria (stub):** root `CLAUDE.md` no longer contains a false statement about
deployment. **Strongly consider deleting the Deployment section entirely** and pointing at
`INFRASTRUCTURE.md` + `RELEASE.md` — duplication is precisely what let this drift, and R30
just spent a session on the same failure mode in two other files.
**Sequencing:** R33 also edits root `CLAUDE.md` (precedence clause + the two missing
pointers). Either fold R6 into R33, or land R33 first and do R6 immediately after —
**do not run them concurrently on the same file.**
**Re-confirmed by R21** (2026-08-04) as a live defect, independently: the cited
`.github/workflows/deploy.yml` **does not exist** and deployment is Vercel-on-push. Logged
there as a "new" finding — it is this item; no duplicate created. Two workers have now
tripped over it, so it costs more than its Low rating suggests.

### R7 — Fill the project-local layer  (Low)  ← re-scoped 2026-08-10 (T4), depends on R33
**Original context:** `governance/docs/rules/domain-vocabulary.md` and root
`guidelines/Guidelines.md` are uncustomized templates. `domain-vocabulary.md` lives in the
**submodule** — changing it is a submodule commit (**R20**'s remit, not this one).

**Re-scoped after verifying what the bump brings.** `.claude/rules/` does not exist here
(confirmed); the bump adds upstream templates for it. **Do not copy them in as-is** —
measured, they are placeholder-dominated: `01-project-context.md` 13 placeholder lines / 32,
`02-non-negotiables.md` 10 / 29, `03-environment.md` 14 / 45, in the shape
`- [ ] [e.g., "PRs must be under 400 lines of diff"]`. An agent cannot reliably tell that
from a real rule, and R7 has sat `todo` since 2026-07-30 for exactly that reason — **a
placeholder file is worse than no file**, because it reads as configured.
Write terse, real files instead. **All the content already exists**, scattered across
`INFRASTRUCTURE.md`, `RELEASE.md` and Locked decisions:
- `01-project-context.md` — React + Vite + Tailwind + shadcn, pnpm, Neon, **two Vercel
  projects in one repo, two independent lockfiles**.
- `02-non-negotiables.md` — CMS is a content editor only; never reintroduce the
  page-builder; never `seed` prod; **direct (non-pooled) Neon endpoint for DDL** (the pooler
  hangs); `dbGuard` must pass; public design stays pixel-identical (0.000%).
- `03-environment.md` — `cms/.env` (dev) vs `cms/.env.prod` (git-ignored); the Homebrew Node
  dyld issue (**R5**); pooler-hangs-on-DDL.
**Note the upstream constraint (D3/LD-04):** `.claude/rules/` is read by Claude Code and
nothing else, so it must carry project **context**, never a rule *override* — an override
there would be invisible to other tools and would contradict `AGENTS.md`. **Additive only.**
**R40 does not close R7, and R7 does not close R40 (tested 2026-08-10).** R40 measured the
upstream templates actually loading, and tested the shadowing question on a fixture holding
both a project and a submodule `.claude/rules/`: **both loaded.** So writing these files does
**not** displace the submodule's — it adds a second load on top. Two consequences for R7:
its value is undiminished (the placeholders were never going to be shadowed away), and it must
not be scoped as "this also fixes R40" — R40 was fixed separately, by exclusion.
**`guidelines/Guidelines.md` — verified: 61 lines of untouched Figma Make boilerplate**,
literally *"**Add your own guidelines here**"* followed by commented-out examples. It is a
second, contradictory governance root sitting beside a real one. **Delete it or fill it; do
not leave it.** Recommendation: delete — `.claude/rules/` + `CLAUDE.md` now cover its job.

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
- 2026-08-03 — **R11 done on preview** (`77a08a9`, PR #4, merge `b0ecb43`):
  `docs/testing-standards.md` — the first testing standard for this repo, 426 lines, as
  the project-calibrated companion to the non-binding upstream submodule baseline.
  Rules only: no runner installed, no lockfile/CI change, submodule untouched. Dropped
  the 80% coverage target, snapshot-per-component, loading-state verification and the
  code-type layer matrix (each justified in a deltas table); kept the regression-test
  rule as non-negotiable. Now in **Locked decisions**. **Five defects found while
  writing it**, none fixed there: the fidelity gate reports `match: true` for **90.2% of
  committed content bytes without comparing them** (→ R13, bumped to High), plus R16–R19.
  Upstream-promotion candidates → R20.
- 2026-08-04 — **R17 done on preview** (PR #8, squash `03d5e84`): the site got its first
  typechecker. Root `tsconfig.json` at **full `strict` with 0 errors**, `typescript` +
  React-18 `@types/*`, and `react`/`react-dom` **promoted from transitive-only to real
  dependencies** — they were used by 83 files while declared nowhere. 29 pre-existing errors
  found, all 29 fixed at source (19 were one variance pattern in `PageRenderer.tsx`'s block
  registry); **build output byte-identical**, pixel-parity 0.000%. New non-required
  `typecheck` CI job (5 jobs now). The "surprise pile of type errors" that had twice deferred
  this item was measured and turned out to be 2 root causes. **Conductor error corrected
  here:** my claim that `studioLabel`/`roleLabel` were dead branches was wrong — they render
  live via `ui.json` fallbacks and `fieldVisible`'s default-true; I had grepped one fixture
  and over-inferred. Follow-ups: **R25** (required checks), **R26** (TS major skew), stale
  `content/pages.json` → R13.
- 2026-08-04 — **R21 shipped to PROD** (`c60b83f`, PR #6 → `7298825`, PR #7 → `8e48d81`):
  the media picker's "elegir existente" drawer had **no clickable row**, so the library was
  write-only — 44 images and none reusable. An R10 regression that reached production: a
  custom Cell in column 0 took over the drawer's linked cell, and the `onSelect` wiring
  lives only in `RenderDefaultCell`, which is skipped for custom Cells. Fixed by making
  `filename` column 0 — on an upload collection that renders via `FileCell` (thumbnail +
  name) *inside* the select button, so the thumbnail became the click target and R10's
  layout survived. Admin-only: no schema, no migration, no lockfile, nothing under `src/`.
  **Locked findings:** (1) never put a custom Cell in column 0 of a picker-reachable
  collection; (2) saved column preferences override `defaultColumns`, and the drawer shares
  the `collection-media` preference key with the main list. Shipped **without** a regression
  test — a deliberate, recorded exemption (no runner until R12, which now carries the
  invariant). PR #7 also promoted R2's CI gate and R11's testing standards to `main`.
- 2026-08-04 — **R12 done on preview** (PR #9, merge `4ceeaf0`): the repo's **first test
  runner and first test suite**. Vitest + RTL + jsdom, 3 dev deps in the root lockfile
  (`cms/pnpm-lock.yaml` untouched), `vitest.config.ts` merging `vite.config.ts`, the single
  root tsconfig extended. **78 tests, 1.5 s local / 36 s in CI** against a 60 s budget, in a
  sixth `tests` job parallel with `site`. Four layers: renderer integration against synthetic
  hostile fixtures (missing field, over-long string, cleared `en`, wrong-aspect upload,
  renamed block — the aspect checks sweep **all 11 gallery variants**), committed-content
  invariants, `contentMeta` units, and the CMS config invariant that **pays off R21's
  regression-test debt**. Unknown `blockType`/`layoutVariant` now report instead of vanishing
  silently, with **no change to rendered output**: `pixel-parity` **0.000%** on all 24 shots,
  CSS bundle byte-identical, JS +790 B. `typecheck` still 0 errors. **21 mutations applied,
  all red, all restored** — two of them exposed real gaps in the first draft. Also corrected
  the four spots R17 made stale in `docs/testing-standards.md` (substance unchanged and
  sharper: *a typechecker cannot validate runtime CMS data*). **Locked:** the runner shape,
  the Tailwind `@source` trap, pin-the-invariant, and report-don't-throw.
- 2026-08-03 — **R3a shipped to PROD** (merge `841d736`): Payload transactional email
  via `@payloadcms/email-resend`, domain `ase-cor-oba.site` verified in Resend, plus the
  `serverURL` config the reset link needs to be absolute. The owner can now self-serve
  password resets; verified in prod. First deploy with no schema change/migration.
  **Locked finding:** any Payload deploy that sends email must set `serverURL`, or
  generated links come out host-less and mail clients reject them.
- 2026-08-04 — **R25 done on preview** (PR #11, squash `aa3edb0`): `typecheck` and `tests`
  are now **required** checks on both `main` and `preview` — **4 → 6 contexts**, adding
  `Site typecheck (tsc --noEmit)` and `Tests (vitest, offline)` (names copied verbatim from a
  live run, pinned to `app_id: 15368`). `strict: true`, `enforce_admins: true`, force-push
  and deletion settings all read back **unchanged** before, after the edit, and again after
  every probe. Config-only: no workflow, code or test change; two docs files touched.
  R12's suite now actually gates — a red `tests` blocks merge. **Enforcement proved by
  behaviour, not an API 200**, which is the whole point of the item: a real push of a real
  commit was rejected (`! [remote rejected] … protected branch hook declined`, `origin/preview`
  unmoved, GitHub reporting *6 of 6*), a live merge attempt returned **405 "2 of 6 required
  status checks are in progress"**, and — the controlled experiment — with all 6 green and the
  PR `CLEAN`, re-running **one** job flipped it to `BLOCKED` with that check as the only
  non-green one, for **each new check independently**, recovering to `CLEAN` both times.
  Control that separates *required* from *merely reported*: `Vercel – asecoroba-cms` was
  pending on the same commit, `isRequired=false`, and GitHub's count ignored it. The mechanics
  are now in **Locked decisions** (`PATCH` the sub-resource, pin `app_id`, single-job re-run
  as the probe, never disable `enforce_admins`). No throwaway PR was created — the probes ran
  on the real PR, so there is no residue. `enforce_admins` was never disabled, not even
  momentarily.
