# CLAUDE.md - Portafolio AseCorOba

> This project follows the AI Development Governance framework.
> **Always read `governance/CLAUDE.md` first** — it is the governance root.
> Then read **[Governance precedence](#governance-precedence)** below: `governance/` is a
> submodule shared with other projects, and where a project file disagrees with it, the
> **project file wins**. Four safety mechanisms are exempt.

> **Checked against reality 2026-08-10 (R38 + R6).** Project Context named the wrong
> hosting platform, and a `## Deployment` section described a GitHub Actions workflow
> deleted on 2026-07-15 (`ecd4aee`, *"site now deploys via Vercel"*) — this file was never
> updated with it. Both are corrected below, and the deployment summary is **deleted rather
> than rewritten**: `INFRASTRUCTURE.md` and `RELEASE.md` are correct and maintained, and
> restating them here is what let it drift. Also fixed: a session-note count gone stale.
> The only workflow file in this repo is `.github/workflows/ci.yml`.

---

## Project Context

- **Site** (`src/`) — React + Vite + Tailwind CSS + shadcn/ui, shipped as a **prebuilt
  static SPA**. Content is pulled from the CMS at *build* time into `content/*.json` +
  `public/images` (`vercel.json:3` → `scripts/fetch-content.mjs && pnpm build`).
- **CMS** (`cms/`) — Payload 3 on Next.js (`cms/package.json:33-34`), Neon Postgres,
  Cloudflare R2 for media. It is a **content editor only**: the public design is fixed and
  pixel-identical, and the page-builder was tried and reverted — do not reintroduce it.
- **Hosting** — Vercel, **two projects from this one repo**. `main` → Production,
  `preview` → Preview. **`INFRASTRUCTURE.md` is authoritative** for hosting, DNS, env vars
  and the publish flow; **`RELEASE.md`** is the production release runbook. Cite them; do
  not restate them here.
- **Package manager** — pnpm. Two lockfiles: root and `cms/`.
- **Quality gates** — 6 required CI checks on **both** `main` and `preview`
  (`.github/workflows/ci.yml`), including `Pixel parity (head vs merge base, 0.000%)`.
  Testing rules: `docs/testing-standards.md`. There is **no `lint` script** in the root
  `package.json` (**R9**).

## Governance

All rules from the governance framework apply **except where a project file overrides
them** — see [Governance precedence](#governance-precedence) below.

- Governance root: `governance/CLAUDE.md`
- Technical baseline for all AI tools: `governance/AGENTS.md`
- Rule files: `governance/docs/rules/`
- Architecture: `governance/docs/governance-architecture.md`
- **Testing standard for this repo (overrides upstream): `docs/testing-standards.md`**

> ⚠️ **Reading any file under `governance/` with the Read tool also injects
> `governance/.claude/rules/01-project-context.md` and three siblings** — unfilled upstream
> templates that assert a `[framework] + [database] + [hosting]` stack and a 400-line PR
> cap, and that read as rules. **They govern nothing here; Project Context above wins.**
> Measured in **R40**; mechanism and the machine-local suppression in
> `docs/delivery/governance-deltas.md` §6.1.

## Governance precedence

`governance/` is a **git submodule** — upstream boilerplate **shared with other
projects**. It is written to fit several repositories at once, so parts of it do not fit
this one.

**Where a project file in `docs/` disagrees with `governance/docs/rules/`, the project
file wins for this repo**, and that file's Deltas section records every departure and
why. **Never edit `governance/` in place** — it is shared, and a local edit silently
changes the rules for every other consumer. Overriding a rule means writing or extending
a *project* file with a Deltas table. Promoting a delta upstream is tracked as **R20**,
the sole item permitted to change submodule content.

### Why this does not violate upstream's Override Hierarchy

`governance/CLAUDE.md:19-29` prints an *Override Hierarchy* closing with *"No layer may
contradict this file. If a conflict exists, this file wins."* Read cold, that looks like it
outlaws the paragraph above. It does not:

1. **It never contemplates a downstream project file.** Every layer it names sits inside
   `governance/` — `AGENTS.md`, `docs/rules/`, `.github/agents/` — except `.claude/rules/`,
   which it neuters as *"Project-local overrides (additive only)"* (`:24`) and which this
   repo does not have (**R7**). A project file in `docs/` is absent from the diagram, so
   the hierarchy is **silent** on it. That is a **gap, not a collision**.
2. **Upstream has already retracted the one line that reads otherwise.** Its own **LD-03**
   (`governance/docs/delivery/locked-decisions.md:97-127`, locked 2026-08-04) holds that *"A
   project may override any upstream rule"* — because the strict version *"was not obeyed --
   it was routed around"* and *"produced less governance, not more"* (`:115-119`) — and it
   lists `CLAUDE.md:24` among the *"Current wrong claims to remove"* (`:125-127`). The
   safety floor below is upstream's own **LD-05** (`:160-188`), not our invention.

**But none of it is implemented at submodule commit `fddf95b`.** The item that deletes `:24`
and adds upstream's own `## Governance Precedence` is **F2**, still `todo`
(`governance/docs/delivery/roadmap.md:42`; detail `:87-101`). *"D3"*, the label our roadmap
uses, is the same item — upstream's legend at `:26` maps *"D3 precedence"* onto F2.

**So this clause stands, and must not be "fixed" back.** Reverting it re-exposes this repo
to the live 80% coverage mandate worked through below. Re-read this note when a bump lands
F2: upstream's own wording may make it redundant, which is the condition for closing
**R38**.

### Not overridable — the safety floor

Four mechanisms are **not** subject to the rule above (upstream D3/LD-05, drawn from a
real failure: a sibling project was found running production Stripe with no authorization
phrases at all — it had kept the scaffolding that presupposes them and lost the phrase
table):

1. **Authorization phrases** — `authorize production deploy`, `authorize db migration on
   production`. The human types them in the current session; an agent never assumes,
   simulates, or skips one.
2. **The destructive-operations protocol** (`governance/CLAUDE.md` → *Destructive
   Operations Protocol*).
3. **Secrets and PII handling.**
4. **Protected branches** — R2: PR-only on `main` *and* `preview`, 6 required CI checks,
   `enforce_admins: true`.

**Content is tailorable; the mechanism is not removable.** A two-tier project may need
fewer phrases than a four-tier one — but dropping one of these four needs **named human
sign-off, not a table row in a Deltas section.**

### Current overrides

**Every departure from `governance/` is recorded, with its reason, in
`docs/delivery/governance-deltas.md`.** Read it before following an upstream rule that
seems to contradict how this repo works — the reason is there so you do not "fix" the
divergence back.

| Upstream rule | Project file that wins | Deltas recorded in |
|---|---|---|
| `governance/docs/rules/testing-standards.md` | `docs/testing-standards.md` | its **§7** |
| `governance/docs/rules/github-workflow.md` — issue links, 400-line PR cap, ≥1 reviewer | `docs/delivery/governance-deltas.md` | its **§1** |
| `governance/docs/rules/session-and-context.md` — note location, 10-note cap, 30-day clean, no permanent notes | `docs/delivery/governance-deltas.md` | its **§2** |
| `governance/.github/agents/testing-qa.agent.md` — coverage threshold (`:22`, `:39`, `:267`, `:304`) | `docs/testing-standards.md` §2 | `docs/delivery/governance-deltas.md` **§3** |
| `governance/CLAUDE.md:131-135`, `:142-148` — plan-approval gate | `docs/delivery/task-prompt-template.md` | `docs/delivery/governance-deltas.md` **§4** |

The three most likely to mislead a cold reader:

- **`github-workflow.md:135`** — *"Request review from at least [1] reviewer."* **R2 set
  branch protection to 0 required approvals** with `enforce_admins: true`, because the
  owner is the only reviewer. Raising it looks like tightening and would make every PR
  unmergeable. Branch protection is on the safety floor; **R25** forbids changing it.
- **`session-and-context.md:130`** — *"Never keep session notes as a permanent knowledge
  store."* **Most of our session notes explicitly declare themselves permanent** and are
  where this project's inherited-claim errors are recorded. Upstream's own note template
  permits `Expiry: "permanent"` at `:110`, so it contradicts itself. Do not move, expire or
  delete a session note; do not adopt the 10-note cap or the 30-day clean.
  *(Said "13 of our 17" until 2026-08-10 (R38); both numbers had drifted, so the claim was
  rewritten to one that cannot. `docs/delivery/governance-deltas.md` §2.2 still carries the
  stale census.)*
- **`governance/CLAUDE.md:134`** — *"Wait for explicit approval before writing ANY code."*
  Satisfied, earlier and in writing: the emitted task prompt **is** the plan and the human
  pasting it **is** the approval. Approval is **never implicit** — work exceeding the
  prompt's stated scope needs a **fresh prompt**, and an authorization phrase is a
  separate mechanism that a pasted prompt never satisfies.

**Worked example — the upstream rule most likely to mislead you.**
`governance/docs/rules/testing-standards.md:77` mandates *"80% line coverage on new
files"*, and `governance/.github/agents/testing-qa.agent.md` re-imports it three times
(`:39`, `:267`, `:304` — *"NEVER lower coverage thresholds"*). **That mandate does not
apply to this repository.** `docs/testing-standards.md` rejects a coverage percentage
outright: 48 of the site's 83 files (58%) are vendored shadcn/ui, so a repo-wide ratio is
cheapest to satisfy by rendering static markup — it rewards the very tests our standard
forbids, and says nothing about content shape or twin drift. Required coverage here is by
**named risk category** (`docs/testing-standards.md` §2); the ratio is never measured.
Do not add a coverage gate, and do not write tests to move one.

## Delivery workflow

Work is roadmap-driven: a **conductor** session emits one standardized task prompt
at a time, each executed in a fresh **worker** session that returns an outcome
summary. See:

- Roadmap (source of truth + backlog): `docs/delivery/roadmap.md`
- How to run it: `docs/delivery/conductor-playbook.md`
- Prompt / outcome formats: `docs/delivery/task-prompt-template.md`,
  `docs/delivery/outcome-summary-template.md`
- Commands: `/next-task` (emit next prompt), `/log-outcome` (ingest a result)
- Per-task notes: `.claude/session-notes/`

## Deployment

**Deliberately not documented here.** `INFRASTRUCTURE.md` (hosting, DNS, env vars, publish
flow) and `RELEASE.md` (production release runbook, authorization phrases) are the
authoritative, maintained sources. A summary in this file drifted out of date once already
— see the review note at the top — so there is no summary. Read those two files.
