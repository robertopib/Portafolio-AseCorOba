# TESTING-STANDARDS.md — Portafolio AseCorOba

Project-calibrated testing rules. This is the **companion** to
`governance/docs/rules/testing-standards.md`, not a replacement for it: where the two
disagree, **this file wins for this repo**, and §7 records every departure so a human can
decide later what to promote upstream.

Why a companion is needed: the upstream baseline lives in a **git submodule shared with
other projects**. It mandates 80% line coverage (`governance/docs/rules/testing-standards.md:36`),
a full unit/integration/E2E matrix (`:8-20`), and a render + snapshot test per
presentational component (`:16`). Applied literally here, that produces hundreds of tests
over third-party code — **48 of the site's 83 `.ts`/`.tsx` files (58%) are vendored
shadcn/ui under `src/app/components/ui/`**. The submodule is never edited from this repo.

Written as of 2026-08-03, when the repo had **zero tests and zero test tooling** — no
runner, no `test` script in `package.json` or `cms/package.json`, no test files in either
project. This is the first standard, not a tightening of an existing one. That cuts both
ways: no legacy to respect, and no safety net — so a rule that generates busywork will
discredit the whole effort before it earns trust.

---

## 1. What we test and why

### The thesis

**The deployed site is never the artifact CI validated, and no type checker can close
that gap.** Those two facts compound, and everything below follows from them.

| Fact | Evidence |
|---|---|
| CI builds the site from **committed fixtures** and deliberately never runs `fetch-content.mjs` | `.github/workflows/ci.yml:133-137`, `:154-161` |
| Production rebuilds against the **live CMS**, triggered by a publish hook that never touches GitHub Actions | `cms/src/hooks/triggerDeploy.ts:23-28` (no GitHub reference), `INFRASTRUCTURE.md:103-113` |
| **The site's types are real but cannot see CMS data.** `tsc --noEmit` runs `strict` at 0 errors as its own CI job — and validates nothing about what the CMS actually emits, because that is a runtime value. | root `tsconfig.json`, `.github/workflows/ci.yml` `typecheck` job, `src/app/PageRenderer.tsx:225-232` |
| **No error boundary anywhere in `src/`.** | `grep -rn "ErrorBoundary\|componentDidCatch" src/` → no matches |

> **Updated 2026-08-04 (R12), correcting this section as written on 2026-08-03.** Row 3 used
> to read "the site has no TypeScript dependency and no `tsconfig.json`". R17 landed one:
> full `strict`, 0 errors, `typescript` + React-18 `@types/*`, a working `@/*` alias and a
> green (not yet required) `typecheck` job. **The conclusion did not change, it got
> sharper** — see below.

The third row is the one people get wrong, and it got a new way to be wrong when R17
landed. `src/app/components/HeroSection.tsx:6-14` declares a `HeroContent` type with
required `title`, `subtitle`, `body`, `cta1`, `cta2`. Those annotations are now genuinely
checked — but only against the *other TypeScript* that references them. The content they
describe arrives as JSON from a live CMS at build time, so **a type cannot tell you whether
the field is actually there.** `PageRenderer.tsx:225-232` states the same limit at the seam
where it bites: there is no compile-time relationship between a `blockType` string and the
shape of the content the CMS emits for it, so the registry lookup is an unprovable cast,
left with a comment pointing at R12's runtime check.

The practical rule is unchanged from the first draft, only its reason is: **never cite a
type annotation as evidence that a CMS field is present at runtime.** Before R17 that was
because nothing checked the annotation. Now it is because the annotation describes data the
checker never sees. A typechecker cannot validate runtime CMS data — which is exactly why
R12 exists.

Combine that with row 4 and the failure mode is severe: `HeroSection.tsx:50` does
`home.hero.title[language]` with no guard. A `title` missing from a CMS publish throws a
`TypeError` at render, React unmounts the tree, and with no error boundary the visitor gets
a **blank page** — not a degraded hero.

### Risk ranking

Rank every proposed test against this. Content changes continuously **by design**; public
code is effectively frozen (17 commits in 6 months). So test what changes.

| # | Risk | Why it's invisible today | Where it goes |
|---|---|---|---|
| **1** | **Content-shaped breakage** | CI validates code against a fixture; prod renders live CMS data. No type check, no error boundary, no clamping. | **R12** — §2 integration + invariant layers |
| **2** | **Fidelity-twin drift** | Two hand-synced emitters must produce byte-identical JSON. As written (2026-08-03) the existing gate covered 9.8% of content bytes and could not fail — **both closed by R13a/R13b**, see the note under "Risk 2 in detail". | **R13** — §2 node-integration layer |
| **3** | **Publish plumbing** | A missing deploy-hook env var returns **HTTP 200** carrying `{ ok: false, reason: 'no-hook' }`. The whole signal is that one string, and **non-UI consumers** — `curl`, monitoring, any future integration — read the 200 as success. | §2 unit layer, item 3 — **done, R29** |
| **4** | **Bilingual `{es,en}` fallback** | `fallback: true` degrades a missing `en` to Spanish silently. | Folded into R12's fixtures |
| **5** | **Migration integrity** | — **already gated.** `repo-integrity` checks `index.ts`↔disk both ways and `push: false` in ~15 s. | **Cite it, don't rebuild it** (`ci.yml:49-68`) |

### Risk 1 in detail — the four unguarded paths

| Path | Code | What ships unseen |
|---|---|---|
| Missing required field | `src/app/components/HeroSection.tsx:50` — `home.hero.title[language]`, unguarded | Blank page (no error boundary) |
| Over-long text | **No `line-clamp` or `truncate` in any project-owned component** — they appear only in vendored `ui/alert.tsx`, `ui/sidebar.tsx`, `ui/select.tsx` | A 400-char heading reflows unbounded and pushes the layout apart |
| Wrong-aspect image | **22 fixed-aspect containers with `overflow-hidden`**, e.g. `src/app/components/Marketing360.tsx:76`, `src/app/blocks/BrandingBlocks.tsx:194` | A portrait upload is centre-cropped with no warning |
| Renamed block type | `src/app/PageRenderer.tsx:240-265` — an unknown `blockType` renders nothing | **A whole section vanishes from the live page.** Since R12 it is at least reported (`console.error`); the section is still gone. A second, identical path sits one layer down at `CategoryGalleryBlocks.tsx`'s variant dispatcher. |

Two more silent-degradation paths belong to risk 4:
- `src/app/context/LanguageContext.tsx:26-27` — `translations[language][key] || key` renders
  the **raw key string** when a UI string is missing.
- `cms/src/payload.config.ts:101-105` — `fallback: true`, so a missing `en` value serves
  Spanish instead of failing.

**Measured baseline — and a correction about what to do with it.**

| Measured | 2026-08-03 (R11) | 2026-08-04 (R12) |
|---|---|---|
| Localized `{es,en}` pairs across `content/**` | 2,709 | **~3,045** (14 files) |
| Pairs with `es` populated and `en` empty | **0** | **0** |
| Pairs with both empty | 56 | 59 |
| `content/ui.json` key parity | 73/73 | **73/73** |

The first draft of this section called the census "exactly what a test should pin". **That
was wrong, and R12 corrects it.** The pair count moved 12% in a single day of ordinary
editing, and it will move again on the next legitimate `fetch-content` commit. A test
asserting `pairs === 3045` is guaranteed to go red for a good reason while catching no risk
whatsoever — and the second time that happens, someone deletes it.

**Pin the invariant, never the census.** What did *not* move, and is what
`tests/invariants/content-shape.test.ts` actually asserts: **zero** asymmetric pairs, and
identical `ui.json` key sets. Counts appear in that suite only as **vacuity floors** — set
far below the measured values, labelled as such, and there purely so that "the walker found
nothing" fails instead of passing. If a count is ever worth pinning for its own sake, say
why in a comment next to it.

(Exact pair totals depend on how a `{es,en}` leaf is defined — the suite counts objects
with exactly those two keys and no nested value. Another reason not to assert on them.)

### Risk 2 in detail — the existing fidelity gate is 90% decorative

`scripts/fetch-content.mjs:1-25` declares itself a *line-for-line mirror* of
`cms/src/scripts/export-content.ts` (1,093 vs 1,031 lines). Both must emit byte-identical
JSON. Coverage of the two hand-written gates is **asymmetric**:

| Twin | Coverage |
|---|---|
| **REST** (`scripts/fetch-content.mjs`) | **Complete.** Every file goes through `emit()` (`:154-162`) and the gate deep-diffs all of them against `git HEAD` (`:1058-1084`). |
| **Local API** (`cms/src/scripts/export-content.ts`) | **Partial.** `emit()` diffs only what it routes (`:104-109`). `pages.json` (`:653-657`), `categories.json` (`:689-694`) and `case-studies.json` (`:1011-1016`) are written **straight into `content/`** with a hardcoded `report[…] = { match: true, diffs: [] }`. |

**Measured: those three files are 598,916 of 664,086 committed content bytes — 90.2% of
content reported as matching without ever being compared.**

Two aggravating findings:
- **Neither gate can fail anything.** `fetch-content.mjs:1084` logs `allMatch` and
  continues; `export-content.ts:1026-1031` catches every error, writes
  `/tmp/export-error.json`, and calls `process.exit(0)`.
- `export-content.ts:1-10` claims it "Does NOT modify the committed content/\*.json (source
  of truth)". Lines 653, 689 and 1011 write directly into `CONTENT_DIR`. The header is wrong.

R13 is not "add drift detection to a working gate." It is "the gate is mostly a comment."

> **Updated 2026-08-10 (R30) — everything above is now the *historical* diagnosis; R13 shipped.**
> The three sentences in the present tense are no longer true, and are kept because they are the
> case for the work. Current state, read from the code: every emitted file goes through `emit()`
> into a temp dir and is deep-diffed, and `match: true` is the only passing verdict
> (`cms/src/scripts/export-emit.ts:97`, `scripts/fetch-content.mjs:1135`); the header's
> "does NOT modify the committed content" claim is now literally true rather than a lie
> (`cms/src/scripts/export-content.ts:11-17`); and **both gates can fail** —
> `export-content.ts` exits 1 by default, `fetch-content.mjs` exits 1 under `--gate` /
> `FIDELITY_GATE=1` (`:1227`). **That default asymmetry is deliberate and locked** — the
> verification tool fails loudly because nothing depends on it; the production content producer
> wired into `vercel.json` does not, because a diff from `git HEAD` is the normal result of an
> editor publishing. Do not "harmonise" them.

### Risk 3 in detail — success at HTTP 200

`cms/src/endpoints/publish.ts` (extracted from `payload.config.ts` by R29; the config keeps the
endpoint definition at `payload.config.ts:41-54`). Auth is correct: `403` when `!req.user`
(`publish.ts:44-46`). The failure mode is the happy path — a missing or wrong
`VERCEL_DEPLOY_HOOK_URL` makes `pingDeployHook` return `{ ok: false, reason: 'no-hook' }`
(`cms/src/hooks/triggerDeploy.ts:24-25`), which the endpoint returns with **status 200**
(`publish.ts:49-55`, deliberately). That is the R3a bug shape: an env var whose absence produces
a green-looking result and a broken outcome (`docs/delivery/roadmap.md:299-304`).

> **Corrected 2026-08-10 (R30) — who actually gets misled.** The risk-3 row above used to end
> *"The editor sees success; nothing rebuilds."* **That clause was false, and had been since this
> document was written on 2026-08-03.** `cms/src/components/PublishButton.tsx:35-37` branches on
> `data.reason === 'no-hook'` and raises a red toast — *"No hay un hook de despliegue
> configurado."* — and has done since `fcf0335`, the **only** commit that file has ever had. The
> editor **is** told.
>
> The risk stays in the ranking, because the exposure is real; it just belongs to a different
> consumer. **The entire signal is the `reason` string in a 200 body.** Anything that is not the
> admin button — `curl`, an uptime check, a future integration — sees HTTP 200 and stops there.
> And because the UI branch keys off `reason` rather than the status, tidying that field out of
> the payload would have silently degraded the specific toast to the generic *"No se pudo
> publicar"* with nothing going red. R29 pinned it with an exact `toEqual`
> (`tests/unit/publish-endpoint.test.ts`), which is what the test was worth.
>
> The 500 path carries nothing extra: `publish.ts:56-58` fires only if `pingDeployHook` throws,
> which it is documented never to do (`triggerDeploy.ts:22`), and its body is byte-identical to
> the 200 error body. **So the status code conveys no information the body does not** — which is
> why the open question (**R19**) is a contract question, not a status-code question.
>
> Cost of the wrong clause, recorded because it is the point: it propagated from this line into
> `docs/delivery/roadmap.md` twice (R19's and R29's detail) and into R29's task prompt before
> anyone opened `PublishButton.tsx`. Never restate a claim about behaviour from a document —
> open the file.

> **Do not treat `read: () => true` on the collections as a finding.** Public reads are
> intentional — the site is a public portfolio. Assert that intent holds; don't "fix" it.

---

## 2. Layer assignment

Replaces the upstream matrix at `governance/docs/rules/testing-standards.md:8-20`. The
upstream table is organized by *code type*, which in a 58%-vendored presentational codebase
routes almost everything to "unit + snapshot." This one is organized by **risk**.

| Risk / code type | Layer | Required? |
|---|---|---|
| Content-shaped breakage in a renderer | Integration (jsdom, synthetic fixture) | **Required** — R12 |
| Committed-content invariants (locale parity, required keys) | Invariant check (node, no DOM) | **Required** — R12 |
| Fidelity twin (`fetch-content.mjs` ≡ `export-content.ts`) | Integration (node, no DOM, fixture CMS state) | **Required** — R13 |
| Project-owned pure functions | Unit | **Required** |
| Payload endpoint handlers | Unit (injected fake `req`) | Required when the handler has branches |
| Payload collections / hooks / access control | Integration via Local API, **local only** | Recommended, **never in CI** |
| Interactive project-owned components | Unit (events + state) | Only where state logic exists |
| Presentational project-owned components | — | Covered by `pixel-parity`, not by unit tests |
| Vendored `src/app/components/ui/**` | — | **Never** (see §3) |
| Payload admin UI | — | **Never** (see §3) |
| Migrations, lockfiles, type/import-map drift | Already gated by CI | **Cite `ci.yml:49-68`, `:104-124`** |
| Full user workflows (publish → deploy) | E2E | **Deferred** (see below) |

### Worked example per layer

**Unit — `src/app/blocks/contentMeta.ts:21-46`**

`fieldVisible` and `fieldLabel` are pure, project-owned, dependency-free, and the
pixel-identity guarantee rests on their exact defaults: `fieldVisible` returns `true` unless
`<name>Visible` is *explicitly* `false` (`:21-24`), and `fieldLabel` falls back to the
hardcoded string via `?? fallback` (`:33-37`). Every section renderer calls them (e.g.
`HeroSection.tsx:33`, `:48`, `:55`).

*Bug it would catch:* changing `v !== false` to `v === true` flips the default to hidden.
Every section whose content predates the show/hide feature disappears. `pixel-parity` would
catch it on a PR — but only if the change ships as code; a three-line unit test names the
invariant so nobody "simplifies" it. `?? fallback` → `|| fallback` is the same class of bug:
an intentional empty-string caption silently reverts to the hardcoded default.

**Integration (jsdom) — render `PageRenderer` / `HeroSection` against hostile fixtures**

Render with **synthetic** content designed to be legal-but-hostile: a 400-character heading,
`title` omitted entirely, an `en` value missing, a portrait image where the layout assumes
square.

*Bugs it would catch:*
- `HeroSection.tsx:50` throws on missing `title` → asserts the page still renders, or fails
  **loudly and locally** instead of blanking the whole document.
- `PageRenderer.tsx:240-265` drops an unknown `blockType` → asserts that an unrecognized
  block is *reported*, not swallowed. Before R12, renaming a CMS block deleted a section
  from production with no signal anywhere. (Line refs moved in R17 and again in R12; they
  were `:206-209` when this was written. Verify before citing.)
- `LanguageContext.tsx:26-27` renders a raw key on a missing UI string.

**Integration (node, no DOM) — the fidelity twin**

Drive both emitters over one fixture CMS state and byte-compare their output, including the
three files `export-content.ts` currently skips.

*Bug it would catch:* the measured 90.2% blind spot, directly. Any hand-edit to one of the
1,000-line twins that isn't mirrored in the other. Today such a divergence corrupts every
published page and the local gate reports `allMatch` regardless.

**Invariant check (node, no DOM) — committed content**

Assert over `content/*.json`: every localized node has both `es` and `en` keys; no node has
`es` populated with `en` empty; `ui.json`'s `es`/`en` key sets are identical; every
`blockType` in `pages.json` exists in the `blockRegistry` at `PageRenderer.tsx:71-120`
(`:45-94` when this was written, `:65-114` after R17 — verify before citing), and every
`layoutVariant` exists in the `VARIANTS` dispatcher in `CategoryGalleryBlocks.tsx`.
Assert **used ⊆ registered** only: spare registry entries are blocks an editor can place
and nobody has, so the reverse direction fails on day one.

*Bug it would catch:* the block-registry mismatch above, at the point where content lands in
the repo rather than after it has shipped. Deterministic in CI — `content/*.json` changes
only on a deliberate local `fetch-content` run, never from editor activity.

**E2E — deferred, and here is the reason**

The only genuinely end-to-end flow is publish: authenticate as an admin → `POST /api/publish`
→ deploy hook fires → the site rebuilds against live content. That needs an authenticated
Payload session, a reachable Neon database, and a real Vercel deploy hook. **All three are
forbidden in CI** (`ci.yml:16-20`, `:77-83`). An E2E test that mocks all three tests nothing
the unit test in item 3 doesn't already cover.

*Reopen when:* the publish flow gains real logic (queuing, partial publish, per-locale
publish), or the site stops being a static SPA. At that point evaluate Playwright — but note
**§3: adopting Playwright does not reopen the visual-regression decision.**

### Recommended sequence — item 1 ships alone

| Order | Item | Roadmap | Independently deliverable? |
|---|---|---|---|
| **1** | Content resilience: hostile-fixture renderer tests + committed-content invariants | **R12** | **Yes.** Needs only the site project. Closes the largest gap. Do this one first, alone. |
| 2 | Fidelity-twin equivalence test | **R13** | Yes, after item 1 establishes the runner. Also fix the two gate defects in §1 (the hardcoded `match: true`, the `exit(0)`). |
| 3 | `POST /api/publish` handler unit test — 403 unauthenticated, `no-hook` surfaced | **R29** | Yes. ~~~20 lines~~ — see the note below. |
| 4 | E2E | — | **Deferred.** Not scheduled. |

Do **not** bundle these. One roadmap task at a time; a big-bang suite gets abandoned.

> **Updated 2026-08-10 (R30).** Item 3 shipped as **R29** (2026-08-07); the Roadmap column said
> "new" when this was written. The *"~20 lines"* estimate was wrong and is worth keeping visible:
> the handler was an **inline arrow function** in the `endpoints` array, so testing it at all
> required first extracting it to `cms/src/endpoints/publish.ts` — importing it in place meant
> importing the whole config, and the `tests` job installs root dependencies only, where
> `payload` does not resolve (`.github/workflows/ci.yml:265-266`). **An untestable seam is part
> of the estimate**, not a surprise to absorb inside one.

---

## 3. What we explicitly do NOT test

A standard is judged as much by what it declines to require.

| Non-goal | Reason |
|---|---|
| **No coverage-percentage target.** Dropped from `governance/docs/rules/testing-standards.md:36` (80% line coverage on new files). | 48 of 83 site files (58%) are vendored shadcn/ui; most of the remainder is static marketing JSX. A percentage is satisfied fastest by rendering static markup — it would reward exactly the tests §1 says are worthless and say nothing about content shape or twin drift. **Replacement: named risk categories in §2 are required; the ratio is not measured.** See §5 and §7. |
| **No pixel tests of the Payload admin.** | Behind login, never publicly visible, and Payload owns its own UI — we'd be testing a vendor's rendering across their upgrades. Locked decision (`docs/delivery/roadmap.md:43-47`). |
| **No new visual-regression work.** `scripts/shoot.mjs` + `scripts/diff.mjs` stay exactly as they are. | `pixel-parity` already guards the public design invariant *and* is immune to content churn: it stores no baseline, diffs merge-base vs head against the **same** committed fixtures on the **same** runner, and editor publishes never trigger CI. Measured evidence, including the macOS-vs-Linux rasterization finding, is in `.claude/session-notes/2026-08-03-R2.md`. **Locked — do not re-litigate.** This holds even if Playwright is later adopted for E2E: `toHaveScreenshot()` is not a sanctioned replacement here. |
| **No snapshot tests of vendored shadcn components.** Dropped from `:16`. | Third-party code with no project logic. A snapshot over `src/app/components/ui/**` records upstream's markup, then breaks on every dependency bump for reasons no reviewer can act on. Pure churn. |
| **No tests requiring a live Neon connection in CI.** | CI has no secrets and must never touch a real database (`ci.yml:16-20`; the placeholder `DATABASE_URI` at `:78` is deliberately unreachable). The portfolio's Neon is also a **separate account** from the local `neonctl` login, and `cms/src/scripts/dbGuard.ts` exists precisely because a mis-repoint once contaminated an unrelated project's DB (`INFRASTRUCTURE.md:117-126`). |
| **No E2E suite yet.** | See §2 — the only true E2E flow needs auth + a live DB + a real deploy hook, all forbidden in CI. Deferred with a stated trigger, not silently skipped. |
| **No loading-state verification.** Dropped from `:34`. | `grep` for `fetch(` / `await` across the site's own code (excluding vendored `ui/`) returns **nothing**. All content is imported as JSON at build time. There is no async UI, therefore no loading state to verify. Reinstate if the site ever fetches at runtime. |
| **No tests of `screenshots/baseline` portability.** | Answered and measured in R2: all 24 shots differ 0.084%–1.449% between macOS and Linux Chrome with byte-identical page dimensions. Layout is portable; rasterization is not. Settled. |

---

## 4. Tooling recommendation

**ADOPTED as of R12** (2026-08-04, merge `4ceeaf0`) — Vitest + RTL + jsdom are installed, in the
**root lockfile only**, with `vitest.config.ts` merging `vite.config.ts`. *(Updated 2026-08-10
(R30): this paragraph used to read "**Recommended, not adopted.** No runner is installed as of
this document. Installing one is R12's first step, and it is a lockfile change — treat it as
such." It was written on 2026-08-03 against a repo with zero test tooling. The reasoning below is
kept as the record of **why** each choice was made — read it as rationale, not as a pending
decision.)*

### Site + shared: Vitest + React Testing Library + jsdom

| | |
|---|---|
| **Why Vitest over Jest** | Market standard for Vite projects and the only one that reuses the build config already in the repo: `vite.config.ts:13-18` aliases `@` → `src/`, and both packages are `"type": "module"`. Jest needs a parallel transform + ESM + alias configuration that then drifts from `vite.config.ts` — a second source of truth for how modules resolve. |
| **Why RTL** | The queries assert what a visitor sees, which is what risk 1 is about. Its explicit anti-snapshot stance matches §3. |
| **Cost, stated plainly** | 3 direct dev deps in the **root** lockfile: `vitest`, `@testing-library/react`, `jsdom`. `scripts/ci/check-lockfiles.mjs` enforces two-lockfile invariants; verify it tolerates the additions before committing (R12 did — `cms/pnpm-lock.yaml` untouched). **Corrected 2026-08-04:** this row used to read "the site has no TypeScript dependency today; Vitest brings the first one, and adding a tsconfig will surface pre-existing type errors — budget for that". R17 landed the typechecker first, so R12 inherited `typescript`, React-18 `@types/*` and a `strict` config already at 0 errors. There was no pile of errors to absorb. **Extend the single root `tsconfig.json` for the tests; do not add a second one.** |
| **Alternative considered** | `node:test` + `node --experimental-strip-types`: zero dependencies, and sufficient for the fidelity twin and the invariant check. But it has no DOM, so it cannot do the renderer layer that closes the *largest* gap — and running two runners costs more than the deps it saves. **Pick Vitest for both.** |

### CMS: same runner, two scopes

- **Unit** (endpoint handlers, `generateThumbnail`, `content-map` helpers): Vitest with a
  hand-built fake `req`. Offline, no Payload boot, milliseconds. **CI-safe.**
- **Integration** (collections, hooks, access control) via the Payload **Local API** against
  a throwaway database: genuinely valuable, and **explicitly excluded from CI** per §3.
  Local/manual only, documented as such.
  - *If it is ever wanted in CI*, the honest options are `pglite` (in-process Postgres, no
    Docker, but Payload's `db-postgres` adapter support must be verified first) or
    Testcontainers (faithful, needs Docker, adds minutes). Both blow the §6 budget. Neither
    is recommended now.

#### The migration replay harness — the local script §6 anticipates (R55, 2026-08-13)

`scripts/replay-migrations.sh` (`pnpm replay:migrations`) stands up a throwaway PostgreSQL with
`initdb`, applies every committed migration in order to an **empty** database, and exits non-zero
if any fails. It is **local-only by design, and must stay that way** — this paragraph exists so
the next reader finds the tool and the reason in the same place, which is exactly what §6's
*"say so … so the next person doesn't 'helpfully' wire them in"* asks for.

**Why it is not a CI job**, having actually been weighed rather than assumed: §3 bars tests
requiring a live database from CI, and a Postgres service container plus a full `payload migrate`
blows §6's ≤ 60 s budget. A *non-required* job would be advisory and skippable; making it required
means editing branch protection on `main` and `preview`, which **R25 forbids**. So the effect
guard is local and gated in the runbook (`RELEASE.md` step 3), and the **cause** guard went into
CI instead, where it costs nothing: `scripts/ci/check-migrations.mjs` check 7 hard-fails any
migration that touches the Payload Local API, offline, inside the already-required
`repo-integrity` check.

**Why it exists at all.** The 2026-08-12 production promotion failed on an ordering bug —
migration 1 read through the Local API, whose query is built from *today's* config, including a
column migration 2 adds. Dev had never run the chain in sequence, so it had never been seen.
R50's read-only pre-flight replicated every assertion the migrations make and passed: **it
validated the inputs and not the execution, and a projection cannot see an ordering bug.** This
harness is the only check here that runs the real thing against the real shape production
presents. Do not replace it with more `SELECT`s.

### Playwright: not now

Deferred with E2E (§2). If it is ever adopted, its official Docker image and
`toHaveScreenshot()` would solve the cross-platform baseline problem properly — but per the
locked R2 decision that is **not** a reason to replace `shoot.mjs`/`diff.mjs`, and adopting
Playwright does not reopen §3.

### File layout

Upstream's layout (`:79-95`) assumes a `src/features/**` structure this repo does not have.
Use instead:

```
src/app/blocks/contentMeta.test.ts          # co-located unit tests, next to the source
tests/env.d.ts                              # vite/client types for the suites (no @types/node)
tests/fixtures/hostile-content.ts           # synthetic hostile-but-legal content
tests/renderers/render-helpers.tsx          # router + language providers, and nothing else
tests/renderers/*.test.tsx                  # jsdom integration layer
tests/invariants/content-shape.test.ts      # invariant checks over content/*.json
tests/invariants/media-admin-columns.test.ts# CMS config invariants (source-text, no CMS deps)
tests/fidelity/twin-equivalence.test.ts     # R13
tests/unit/*.test.ts                        # CMS-side unit tests live HERE, not under cms/
tests/cms-twin.d.ts                         # ambient for the @cms-export-emit alias (R13b)
tests/cms-publish-endpoint.d.ts             # ambient for the @cms-publish-endpoint alias (R29)
tests/node-builtins.d.ts                    # ambient for node:child_process / :process / :url (R28)
```

> **Corrected 2026-08-10 (R30) — the old last row pointed at a path the runner cannot reach.**
> This block used to end with `cms/src/**/*.test.ts   # co-located CMS unit tests`. **No such
> test would ever run.** `vitest.config.ts`'s `include` is exactly two globs —
> `src/**/*.test.{ts,tsx}` (`:59`) and `tests/**/*.test.{ts,tsx}` (`:61`) — and the root
> `tsconfig.json`'s `include` is `["src", "tests"]` (`:77`). A suite never collected reports
> nothing, so
> the run stays **green**: the worst possible failure mode for a line in a binding standard.
> Use the pattern below instead, which is what R13b and R29 actually did.

**Reaching into `cms/` from a root test — alias + ambient `.d.ts`.** CMS-side tests live under
`tests/` like every other suite and reach the CMS module through a **test-only** vitest alias
paired with a hand-written ambient declaration. Two instances so far:

| Alias | Real module | Ambient declaration | Task |
|---|---|---|---|
| `@cms-export-emit` | `cms/src/scripts/export-emit.ts` | `tests/cms-twin.d.ts` | R13b |
| `@cms-publish-endpoint` | `cms/src/endpoints/publish.ts` | `tests/cms-publish-endpoint.d.ts` | R29 |

Both halves are load-bearing, and each fails differently:

- **The alias goes in `vitest.config.ts` (`:37`, `:42`) and NEVER in `vite.config.ts`.** The
  shipped bundle has no business resolving anything inside `cms/` (`vitest.config.ts:24-25`).
  This is the one sanctioned exception to "never restate a resolve option outside
  `vite.config.ts`" — it holds because no *build* resolution depends on it (`:35-36`).
- **The ambient declaration is what keeps the real module out of `tsc --noEmit`.** A relative
  import drags the file *and everything it imports* into the typecheck program, where `fs` /
  `path` / `process` fail: the root tsconfig deliberately has no `@types/node`
  (`tsconfig.json:61-64`). Measured, not assumed — R29 pointed a test at the relative path and
  got `cms/src/hooks/triggerDeploy.ts(24,15): error TS2591: Cannot find name 'process'`
  (`tests/cms-publish-endpoint.d.ts:8-16`). A bare specifier resolves to the declaration, tsc
  never opens the file, and Vitest resolves the real module at runtime.

An ambient declaration is perfectly happy to lie, so it is only safe when something else catches
drift: `pnpm --dir cms build` typechecks the real module against `cms/tsconfig.json`, and the
test must **call** the module for real rather than merely typecheck against the declaration.
Where the *wiring* is what the extraction put at risk, also assert on the config's source text —
R29 added seam guards pinning that `payload.config.ts` still references the handler, at the right
path, without importing `payload`.

**Reaching a Node builtin needs the same shielding.** `tests/node-builtins.d.ts` declares only
the sliver of `node:child_process`, `node:process` and `node:url` the R28 suite calls — third
instance of the same pattern, same `@types/node` reason. Two rules from that file's header
(`tests/node-builtins.d.ts:13-22`): keep it **minimal**, and keep it `declare module`, never a
global — a `declare const process` would leak Node's globals into all 83 files under `src/**` and
quietly legitimise server-only code in a browser bundle. If `@types/node` is ever added this file
becomes a duplicate-module error; delete it then, don't merge the two.

**A co-located test file is a Tailwind source file** (R12, measured). `@source` in
`src/styles/tailwind.css` scans `src/**` as text, so class names written in an assertion
become real CSS rules and move the shipped bundle — i.e. they redden `pixel-parity` for a
change that touches no markup. `@source not '../**/*.test.{ts,tsx}'` excludes them; with it
the bundle is byte-identical. Keep that line, or keep tests out of `src/`. See §8.

**Never let a root test's import graph reach `payload`, `sharp` or `@aws-sdk/*`.** *(Reworded
2026-08-10 (R30); this used to say "Do not import CMS source from a root test", which the alias
pattern above now contradicts. The real constraint was never the directory — it is the transitive
import graph.)* `cms/` is a separate project with its own lockfile, enforced by
`scripts/ci/check-lockfiles.mjs`, and the `tests` job installs **root dependencies only**
(`.github/workflows/ci.yml:265-266`), so those specifiers will neither resolve nor typecheck from
the root. That is exactly why the two aliased modules were carved out to import nothing from
`payload`: **one `payload` import added to either of them takes its suite out of CI** — the
specifier does not resolve there, so the job reddens and the pressure is to delete the test
rather than to restore the seam. Say so in the module's header, as both of them do. A CMS
*config*
invariant can still be asserted by reading the file as source text (`?raw`) — see
`tests/invariants/media-admin-columns.test.ts`, which guards the R21 outage that way. When
doing that, assert that the parse itself succeeded, or the test passes vacuously the first
time someone reformats the config.

Naming: `[filename].test.ts(x)`, matching upstream `:12`. **Note the conflict:** upstream
`governance/docs/rules/coding-standards.md:7` mandates `kebab-case.tsx` for components,
while this repo uses `PascalCase.tsx` throughout (`HeroSection.tsx`, `PageRenderer.tsx`).
Test files follow the file they test. Flagged in §7; not "fixed" here.

---

## 5. Definition of Done for a test-bearing PR

Replaces `governance/docs/rules/testing-standards.md:26-47`.

### Every PR that adds or changes a test

- [ ] **Each new test names the bug it would have caught**, in a comment or the test name.
      If you can't name one, delete the test. This is the rule that keeps the suite from
      rotting into the thing §3 rejects.
- [ ] The test maps to a **named risk category in §2**. Coverage ratio is neither measured
      nor required — see §3 and §7.
- [ ] **A test asserting content shape uses a synthetic fixture, never live CMS data and
      never a snapshot of `content/*.json`.** Otherwise the test churns with editor activity
      and gets disabled — the same reasoning that makes `pixel-parity` immune (§3).
- [ ] The test is **offline**: no network, no database, no secrets. If it can't be, it is a
      local-only test and is excluded from the CI job (§6) explicitly, with a comment saying
      why.
- [ ] It fails for the right reason. Break the code, watch it go red, restore.
- [ ] Runtime respects the §6 budget.

### Every bug-fix PR — kept from upstream, non-negotiable

Kept verbatim in spirit from `:38-47`, because it is cheap and it is the one upstream rule
this project's history most obviously validates:

- [ ] **A regression test that fails without the fix.** Write it first, watch it fail, then
      fix.
- [ ] The fix itself.
- [ ] A `// Regression: <one line>` comment on the test.
- [ ] Existing tests still pass.

### Every PR, test-bearing or not — unchanged project gates

- [ ] All 6 required CI checks green (`repo-integrity`, `cms`, `site`, `typecheck`,
      `tests`, `pixel-parity`). `typecheck` (R17) and `tests` (R12) became *required* on
      both `main` and `preview` on 2026-08-04 (R25) — a red `tests` run now blocks merge.
- [ ] Public render unchanged unless intended → `pixel-parity` at **0.000%**.
- [ ] Schema change → migration committed and imported in `cms/src/migrations/index.ts`.
- [ ] `pnpm lint` is **not** a gate (R9 — no ESLint flat config exists). Don't make it one
      as a side effect of adding a runner.

### Deliberately absent from this checklist

No coverage threshold (§3). No snapshot requirement (§3). No loading-state check (§3). No
"integration test for every API route" — this project has exactly one custom endpoint, and
§2 item 3 covers it as a unit test.

---

## 6. How it plugs into CI

**Its own job in `.github/workflows/ci.yml`** — the sixth, as of R12 (`repo-integrity`,
`cms`, `site`, `typecheck`, `tests`, `pixel-parity`; this said "a fifth job" before R17
added `typecheck`). Not folded into `site`: a test failure and a
build failure should be distinguishable at a glance, and the existing `site` job (`:138-161`)
mirrors Vercel's build exactly — keep it that way.

| Property | Value |
|---|---|
| Job name | `tests` |
| Triggers | Same as the rest: PRs and pushes to `preview`/`main` (`:23-28`) |
| Runs | In **parallel** with `site`, not after — no wall-clock added to the ~2-minute pipeline |
| Budget | **≤ 60 s total**, including install. Over that, split the slow test out to local-only. |
| Network | **None.** No secrets, no `DATABASE_URI`, no live CMS, `fetch-content.mjs` not run. |
| Install | `pnpm install --frozen-lockfile` (root), same as `site` (`:154-155`) |
| Node / pnpm | Reuse the workflow-level `NODE_VERSION` / `PNPM_VERSION` env (`:38-42`) |

### Becoming a required check — the step that is easy to miss

**GitHub does not infer required checks from a workflow.** Adding the job does not gate
anything until the branch-protection required-checks list is updated via `gh api` on **both**
`main` and `preview`, which are protected with `enforce_admins: true`
(`docs/delivery/roadmap.md:34-40`).

Sequence: land the job → let it run green on at least two PRs → then add it to required
checks → **verify with a real push, not the API response.** The R2 session note records a
protection apply that returned success and protected nothing; the warnings on a bypassed push
look identical to a rejection (`.claude/session-notes/2026-08-03-R2.md`).

### Why editor activity cannot redden this job

Same reasoning that makes `pixel-parity` churn-proof:
- Renderer tests use **synthetic** fixtures from `tests/fixtures/`, not live content.
- Invariant checks read **committed** `content/*.json`, which changes only when someone
  deliberately runs `fetch-content.mjs` locally and commits — never from a publish, which
  goes straight to the Vercel deploy hook (`cms/src/hooks/triggerDeploy.ts`).
- The fidelity-twin test uses a **fixture CMS state**, never `dev` or prod Neon.

### Explicitly out of the CI job

Payload Local API integration tests (§4). They need a database. Keep them behind a separate
local script and say so in a comment in the workflow, so the next person doesn't "helpfully"
wire them in.

---

## 7. Deltas from the upstream baseline

For a human deciding what to promote into the governance submodule. **Nothing in
`governance/` was modified by this document.**

| Upstream rule | Status | Why | Promote upstream? |
|---|---|---|---|
| **80% line coverage on new files** (`testing-standards.md:36`) | **Dropped** | 58% of site files are vendored shadcn; the rest is static marketing JSX. A percentage is cheapest to satisfy by rendering static markup, i.e. it actively rewards the tests §3 forbids, and is silent on content shape and twin drift. Replaced by required coverage of **named risk categories**. | **Yes — the strongest candidate.** Either replace the flat number with risk-category requirements, or make "no coverage target on predominantly presentational codebases" an explicitly sanctioned deviation so each project need not re-argue it. |
| **Layer matrix by code type** (`:8-20`) | **Changed** | Reorganized by **risk** rather than code type. The upstream table routes ~everything here to "unit + snapshot". | Maybe — as an alternative table for content-driven / presentational projects. |
| **Snapshot test per presentational component** (`:16`) | **Dropped** | Third-party vendored code; snapshots record upstream markup and break on dependency bumps for reasons no reviewer can act on. Presentational output is guarded by `pixel-parity` instead. | Yes — narrow the rule to *project-owned* components, and never require snapshots of vendored code. |
| **Loading-state verification** (`:34`) | **Dropped** | Zero `fetch(`/`await` in the site's own code; all content is build-time JSON. No async UI exists. | No — the rule is fine, it just needs its "(if async UI)" condition taken seriously. |
| **Integration test for every API route / DB query** (`:13-14`) | **Changed** | One custom endpoint exists (defined at `payload.config.ts:41-54`, handler at `cms/src/endpoints/publish.ts` since R29); a unit test with a hand-built fake `req` covers its branches (`tests/unit/publish-endpoint.test.ts`). DB-backed integration is recommended but **local-only** — CI has no database by design. | Yes — add an explicit carve-out for "CI cannot reach a database", which upstream currently doesn't contemplate. |
| **Regression test on every bug fix** (`:38-47`) | **KEPT, non-negotiable** | Cheap, high-value, and this project's history validates it — R8's phantom migration import and R3a's host-less reset link are both exactly the class of bug a regression test pins. | Already upstream. Leave it. |
| **Test priority order** (`:64-75`) | **Changed** | Upstream ranks auth/business-logic above UI. Here the top risk is **content shape reaching a renderer**, which upstream's list has no row for. §1's ranking replaces it. | Maybe — add a "data/content shape" tier for content-driven sites. |
| **Test file organization** (`:79-95`) | **Changed** | Assumes `src/features/**`, which this repo does not use. Replaced with a co-located layout in §4. | No — it's illustrative, not binding. |
| **Naming: `kebab-case.tsx` for components** (`coding-standards.md:7`) | **Conflict, flagged not fixed** | This repo uses `PascalCase.tsx` throughout (`HeroSection.tsx`, `PageRenderer.tsx`). Renaming 83 files to satisfy a shared template is not a testing task and would touch the public render. | Yes — soften upstream to "explicit and enforced per project", which its own note at `:16-17` already implies. |
| **"Tests exist per testing-standards.md" as a pre-PR hard gate** (`governance/CLAUDE.md:63`) | **Changed** | Unsatisfiable as written until R12 lands a runner. Reading: satisfied when a PR meets §5 — which for a docs-only or admin-only PR means "no test required." | Yes — the gate should say "meets the project's testing standard", not "tests exist". |

---

## 8. Gotchas learned (don't relearn these)

- **A type annotation is never evidence that a CMS field is present.** *(Rewritten
  2026-08-04. This used to read "the site's TypeScript is decorative — no root
  `tsconfig.json`, no `typescript` dependency, types are stripped and never checked". R17
  made the types real: `strict`, 0 errors, its own CI job.)* The rule survived the fix,
  because the reason was never really the missing checker: content arrives as JSON from a
  live CMS at build time, so no amount of static checking can tell you whether a field
  exists. `PageRenderer.tsx:225-232` marks the seam — a `blockType` string has no
  compile-time relationship to the shape of its content. Runtime checks, not types.
- **A prose comment in `src/` can move the stylesheet.** Tailwind v4's
  `@source '../**/*.{js,ts,jsx,tsx}'` (`src/styles/tailwind.css`) scans those files as
  TEXT, so any class-shaped token anywhere in one — including inside a comment — becomes a
  real CSS rule. R17 wrote the word "static" in a comment and emitted
  `.static{position:static}`, moving the CSS bundle. R12 measured the same thing from a
  co-located test file: one probe naming `line-clamp-2 truncate static` in an assertion
  added three rules to `dist`. If `pixel-parity` reddens on a change that touches no
  markup, this is why. Test files are excluded via `@source not '../**/*.test.{ts,tsx}'`;
  keep that line, or move tests out of `src/`.
- **A missing content field blanks the whole page**, it does not degrade one section. No
  error boundary exists anywhere in `src/`.
- **A gate that cannot fail is a comment.** *(Rewritten 2026-08-10 (R30) — both bullets this
  replaces are FIXED and must not be re-asserted. They used to read: "`export-content.ts` reports
  `match: true` for 90.2% of content bytes without comparing them (`:653-657`, `:689-694`,
  `:1011-1016`), and both fidelity gates `exit 0` on failure"; and "`export-content.ts`'s header
  lies — it says it does not modify committed content, and writes `pages.json`,
  `categories.json` and `case-studies.json` straight into `content/`.")* R13a/R13b closed both:
  every file is emitted to a temp dir and really diffed, `match: true` is the only passing
  verdict (`cms/src/scripts/export-emit.ts:97`), and the exit code is now the gate
  (`cms/src/scripts/export-content.ts:19-24`). **What survives as the lesson**: a hardcoded
  `match: true` and a `catch`-then-`exit(0)` are both invisible in a green run, so *never* accept
  a passing report as evidence a gate works — make it go red on purpose first. See also the
  locked default asymmetry between the two gates in §1's risk-2 note.
- **`POST /api/publish` returns 200 when the deploy hook is unconfigured**
  (`cms/src/endpoints/publish.ts:49-55`; the handler moved out of `payload.config.ts` in R29).
  Nothing rebuilds, and the only thing distinguishing it from success is
  `reason: 'no-hook'` in the body. **Assert on the body, never the status** — the status is
  R19's open question and every body assertion survives R19 changing it. *(Corrected 2026-08-10
  (R30): this bullet used to say "Green response"; the admin UI is not fooled —
  `PublishButton.tsx:35-37` shows a red toast. The consumers at risk are non-UI. See §1 risk 3.)*
  One sanctioned exception, R29's, worth copying rather than re-arguing: the **403** may be
  asserted on status, because a silent downgrade there is an auth hole rather than a redesign and
  `PublishButton.tsx:38` branches on it. Say why in a comment when you take it.
- **A message written immediately before `process.exit` is truncated when output is a pipe —
  and CI reads output through a pipe.** *(R28, 2026-08-10.)* `console.error(msg)` then
  `process.exit(1)` does not drain queued stream writes: measured on macOS / Node 22 with a
  200,000-byte payload, a **file** (`2> log`) got all 200,001 bytes while a **pipe** (`2>&1 | …`)
  got exactly **65,536** — one kernel pipe buffer. GitHub Actions captures job output through a
  pipe, so CI is the exposed case, and the loss is **size-dependent**, which is why it hid for
  months: a short message always survives. It bites once a failure report exceeds 64 KiB, i.e.
  precisely when the report matters most. **The sharp edge: a bare `fs.writeSync` is NOT the
  fix.** It delivers in full only while the fd is still *blocking*, and libuv flips it to
  `O_NONBLOCK` the moment Node instantiates `process.stderr` — after which it truncates at 65,536,
  identically to the bug it was meant to fix. **Merely importing a named export from
  `node:process` is enough to reach that state** (measured: `import { execPath } from
  'node:process'` drops 200,000 → 65,536), so every real script is already in it. The working fix
  is an **offset loop plus an `Atomics.wait` sleep on EAGAIN**; use `writeAllSync` /
  `syncConsole` from `scripts/lib/write-sync.mjs`, whose header carries the full measurement
  tables and the reasoning for choosing it over `process.exitCode` (`:22-54`). Two consequences
  for tests: **a regression test must pipe the output and assert on its bytes** — asserting the
  exit code alone reproduces the bug it is meant to catch — and because the truncation is
  **non-deterministic on Linux** (five runs gave 200000, 146176, 146176, 146176, 146176), the
  vacuity guard samples ~10 runs and asserts at least one loses bytes rather than asserting that
  a single run truncates. See `tests/fidelity/exit-flush.test.ts`.
- **Sampling only defends against a per-run coin flip — check which one you have.** *(R37,
  2026-08-10, correcting the last clause of the bullet above.)* That guard sized its 10 samples
  against a "4 runs in 5" reading of the table, then went red on a PR whose diff was a gitlink
  and one markdown file. Re-measured: **2,698 of 2,700 runs across 33 CI job executions lose
  bytes (p = 0.9993)** — the bug is not gone, and the 5-run table simply had too few samples to
  see the real shape. What actually varies is the **job**: ten consecutive full deliveries is a
  ~5e-32 event under an i.i.d. per-run rate, and it happened in 1 of 13 `tests` jobs, so the
  runs inside a job are **not independent** — the host is the draw. **Consequence worth
  generalising: `SAMPLES` reduces a false verdict only when the samples are independent.** When
  the flake is per-job, ten samples and a thousand have the same failure rate, and raising the
  count buys a slower suite and nothing else. Before sizing a sampling gate, measure *across*
  runs of the job, not just within one. R37 kept the assertion, dropped its gate
  (`skipIf(env.CI)` — it is deterministic on macOS, where a developer runs it), and left the
  four fixed-path tests gating; the full derivation is in the test file's header.
- **A verification is only worth what its setup shares with the real thing.** *(R28's other
  lesson, and it is not about stdio.)* The bare-`writeSync` claim above was originally "verified"
  at 200 KB — in a scratch script that imported nothing else, which is the one condition under
  which it passes. A scratch script is not a 1,000-line script with imports. Reproduce in
  something shaped like the target, or say plainly that you did not.
- **A green `pixel-parity` on a `src/styles/globals.css` edit proves nothing** — that file is
  imported by nothing (roadmap R14). Real global style changes go in `theme.css`.
- **Adding a CI job does not gate anything** until branch protection's required-checks list
  is updated by hand, and protection must be verified with a real push (§6).
- **`content/*.json` is safe to read in CI, `PAYLOAD_API_URL` is not.** Committed content is
  deterministic; the live CMS is not, and a CMS outage must never redden a PR.

---

## 9. See also

- `governance/docs/rules/testing-standards.md` — the upstream baseline this calibrates (§7).
- `.claude/agents/qa.md` — the project-local QA agent; risk model and non-goals.
- `.claude/session-notes/2026-08-03-R2.md` — what CI already covers, the measured pixel-gate
  evidence, the branch-protection verification trap.
- `docs/delivery/roadmap.md` — Locked decisions; R12 and R13 detail.
- `INFRASTRUCTURE.md` — environment truth: publish flow (§6), the Neon separate-account trap
  (§7).
