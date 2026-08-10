# GOVERNANCE-DELTAS.md — Portafolio AseCorOba

Where this repo **knowingly diverges** from `governance/`, and **why**. One entry per
divergence, each with the upstream `path:line`, what we do instead, and the reason —
because the reason is the only thing that stops a future worker "fixing" the divergence
back into the upstream rule.

Read this together with root `CLAUDE.md` → **Governance precedence**, which states the
rule these entries apply: `governance/` is a submodule **shared with other projects**, so
where a project file disagrees with it, **the project file wins for this repo** — except
for the four safety-floor mechanisms, which are never overridable and appear nowhere in
this file.

**Nothing in `governance/` was modified by this document.** Overriding upstream means
writing a *project* file. Changing the submodule is **R20**'s remit and nothing else's.

---

## Why the deltas live here

There was no home for a cross-cutting delta before this file. `docs/testing-standards.md`
§7 works because every row in it is about testing; these five are not.

The placement is forced by four constraints, three of them upstream's own:

| Constraint | Source | Effect |
|---|---|---|
| Never create documentation at `docs/` root | `governance/CLAUDE.md:603` | rules out `docs/governance-deltas.md` |
| Never put project-specific rules in `docs/rules/` | `governance/CLAUDE.md:605` | rules out the mirrored path — see **R36**, blocked because this contradicts upstream's own LD-04 |
| `.claude/rules/` is read by Claude Code and nothing else, and is *additive only* | `governance/CLAUDE.md:23`, `governance/.claude/rules/README.md` | an override placed there is invisible to every other tool, and "additive" cannot express "this upstream rule does not apply" |
| Root `CLAUDE.md` is read first by every agent | root `CLAUDE.md:4` | right place for the **pointer**, wrong place for five full deltas — it exists to stay short |

`docs/delivery/` is not merely what is left over. Upstream's own decision tree routes here
directly: *"Is it backlog state, or a decision that must not be re-litigated? →
`docs/delivery/`"* (`governance/CLAUDE.md:597-598`). Every entry below is exactly that — a
decision already settled, recorded so it is not argued again. Its folder table says the
same: `docs/delivery/` holds *"Backlog SSOT and settled decisions"* (`:569`).

So: one file, in a subdirectory, in the directory upstream nominates for settled
decisions, linked from the overrides table in root `CLAUDE.md`. Future bumps append here.

**Do not resolve the `:605` ↔ LD-04 contradiction in this file.** That is **R36**, and it
is blocked on upstream, not on us.

---

## Index

| # | Upstream rule | Status | Section |
|---|---|---|---|
| 1 | `docs/rules/github-workflow.md` — issue links, 400-line cap, ≥1 reviewer | **3 dropped, rest adopted** | [§1](#1-github-workflowmd--pr-rules) |
| 2 | `docs/rules/session-and-context.md` — note location, 10-note cap, 30-day clean, no permanent notes | **Dropped** | [§2](#2-session-and-contextmd--session-note-location-and-lifecycle) |
| 3 | `.github/agents/testing-qa.agent.md` — coverage threshold | **Dropped** (persona re-import of an already-dropped rule) | [§3](#3-testing-qaagentmd--the-coverage-threshold-re-imported-by-the-persona) |
| 4 | `CLAUDE.md:131-135`, `:142-148` — plan-approval gate | **Satisfied differently, not dropped** | [§4](#4-claudemd131-135--the-plan-approval-gate) |
| 5 | `docs/rules/release-and-deployment.md:116` — no `git push` before `gh pr create` | **Not a delta — applies as written** | [§5](#5-release-and-deploymentmd116--push-before-pr-not-a-delta) |
| — | Further conflicts found in the same bump, not on the R34 list | recorded; **§6.1 verified and fixed by R40**, rest deferred | [§6](#6-also-found-in-the-fddf95b-bump) |

All five verified by reading the files at submodule commit `fddf95b` (bumped from
`e85041e` by **R33**, 2026-08-10 — 14 commits, 45 files).

---

## 1. `github-workflow.md` — PR rules

**Upstream file:** `governance/docs/rules/github-workflow.md`. **New at this bump** — it
did not exist at `e85041e` (`git diff --name-status e85041e fddf95b` reports it as `A`),
so no prior delta could have covered it.

### 1.1 What we adopt — most of the file

Read this first, so the three drops below are not mistaken for a rejection of the file.

| Upstream section | Status |
|---|---|
| Branch naming: `[type]/[short-description]` (`:10-14`) | **Adopted** — `docs/log-r34`, `test/…`, `fix/…`, `chore/…` all follow it |
| Branch types table (`:16-26`) — `feature/ fix/ refactor/ chore/ hotfix/ docs/ test/` | **Adopted, already matched before we read it** |
| Branch rules (`:29-32`) — branch from the dev branch, kebab-case, <50 chars, delete after merge | **Adopted** (our dev branch is `preview`) |
| Commit format (`:37`) and type table (`:49-62`) — `feat fix refactor test docs style chore perf ci revert` | **Adopted, already matched** — see any commit in `git log` |
| Squash merge by default (`:137`) | **Adopted** — every merged PR in this repo is a squash |

### 1.2 `:131` — *"Every PR must link to at least one issue (unless it's a chore/docs PR)"*

**Dropped.** This repo has **never opened a GitHub issue**. The backlog lives in
`docs/delivery/roadmap.md` as SSOT, and the **roadmap item ID (`R#`) plays the role the
issue number plays upstream** — it appears in the branch name, the commit subject, the PR
title, the session note filename, and the Outcome Summary. That is more traceability than
an issue link, not less, and it is greppable offline.

**Why not just open issues:** it would create a second backlog that must be kept in sync
with the roadmap, and the conductor playbook's whole design assumes one source of truth
(`docs/delivery/conductor-playbook.md:48-49`). Two SSOTs is the failure this project has
already paid for in documentation drift (see R30).

Note upstream's own carve-out — *"unless it's a chore/docs PR"* — already exempts a large
share of our PRs. The drop is about the remainder (`feat`, `fix`, `test`), not the whole
rule.

**Same root, second site:** `governance/AGENTS.md:92` requires *"TODO comments must
include an issue link: `// TODO(#123): reason`"*, restated as a Definition-of-Done
checkbox at `governance/CLAUDE.md:310`. Same answer: cite the `R#`, not an issue number.

### 1.3 `:132` — *"PR must be under [your-max-diff-lines, e.g., 400] lines of diff"*

**Dropped as a hard cap; kept as a smell.** Measured, merged, and deliberate:

| PR | Item | Diff |
|---|---|---|
| #15 (`fdb3302`) | R13b — equivalence test for the two content emitters | **3,742 lines** |
| #13 (`5830a00`) | R13a/R16 — fidelity gate made to fail loudly | **768 lines** |
| #19 (`96b2419`) | R28 — exit-flush fix + measurement tables | **624 lines** |
| #14 (`24cfacf`) | R25 ingest + R13a ingest | **592 lines** |

Splitting these would have been worse, not better. R13b's diff is dominated by
`tests/fixtures/cms-state.ts` (594 lines of fixture) plus the emitter it proves equal to
— a stacked PR would have landed a test that cannot run, then the thing it tests, and the
gate would have been red in between. Upstream's own remedy (*"break into stacked PRs with
clear dependencies"*, `:133`) presumes reviewers working in parallel; here the owner is
the only reviewer, so stacking adds serialization without adding review.

Where a PR is large for a bad reason — two concerns in one — the fix is
`governance/CLAUDE.md:386` (*"One concern per PR"*), which we **do** keep. That rule
catches the real problem; the line count is a proxy for it that misfires on fixtures,
generated content, and docs.

> **Correction to the R34 prompt and to `docs/delivery/roadmap.md`'s R34 detail.** Both
> say *"R13b and R30 both exceeded it."* R13b did, by an order of magnitude. **R30 did
> not** — PR #21 (`f7e3fed`) is 296 insertions + 64 deletions = **360 lines**, under the
> 400 cap. The claim is right and the examples above make it, but R30 is not one of them.

### 1.4 `:135` — *"Request review from at least [your-min-reviewers, e.g., 1] reviewer"*

**Dropped — adopting it literally deadlocks every PR in this repo.**

**R2 deliberately set branch protection to 0 required approvals**, with
`enforce_admins: true`, precisely because the owner is the only person with access:
`.claude/session-notes/2026-08-03-R2.md:86` (*"PR required | yes, **0 approvals** (solo
repo — the owner can merge their own PR)"*) and `:88` (`enforce_admins: true` — *"no
bypass, including the owner"*). R25 re-verified both settings survived its changes
(`.claude/session-notes/2026-08-06-R25.md:75`).

With `enforce_admins: true` and a one-person repo, a required approval is an approval
nobody can give. The protection that upstream expects from a reviewer is supplied here by
the **6 required CI checks** — which the owner also cannot bypass.

**This is the delta most likely to be "fixed" by a well-meaning worker**, because raising
the approval count looks like tightening. It is not: it is the one change that would make
the repo unmergeable. It also collides with the safety floor — branch protection is
non-overridable per root `CLAUDE.md`, and **R25** forbids changing it.

**Promote upstream?** **Yes, all three.** Each is a placeholder (`[your-max-diff-lines]`,
`[your-min-reviewers]`) that reads as a mandate when left unfilled. Upstream should say
what a solo repo does, and should not assume an issue tracker is in use — a
roadmap-as-SSOT project satisfies the *intent* of `:131` completely.

---

## 2. `session-and-context.md` — session-note location and lifecycle

**Upstream file:** `governance/docs/rules/session-and-context.md` (+162 lines at this
bump).

### 2.1 Location — `:17`, `:77`, `:83`, `:173`

Upstream puts session notes in `docs/session-notes/` (*"Session notes live in
`docs/session-notes/`"*, `:77`; restated at `:17`, `:83`, `:173`, and in
`governance/CLAUDE.md:42` and `:571`). Ours live in **`.claude/session-notes/`**.

**Kept as-is.** They are worker/conductor handoff artifacts consumed by agent sessions,
not project documentation for a human reader; `.claude/` is where this repo keeps
agent-facing material (`.claude/agents/`, `.claude/commands/`). Root `CLAUDE.md:116` and
the conductor playbook already point every agent at the right path, so nothing is lost by
not matching upstream's location — and moving 17 files would break every citation of them
across the roadmap, exactly the churn **R36** is deferred to avoid.

### 2.2 The lifecycle rules — `:117`, `:118`, `:124`, `:130`

| Upstream | Ours |
|---|---|
| `:117` *"Maximum active notes \| 10 -- archive or delete older ones"* | **17 notes** (plus a README) |
| `:118` *"Auto-clean threshold \| 30 days"*, and `:124` *"When a note reaches 30 days or the 10-note limit is hit"* → review, extract, **delete** | **No expiry.** Notes from 2026-07-30 are current |
| `:130` *"Never keep session notes as a permanent knowledge store -- extract and integrate"* | **13 of the 17 are explicitly marked `**Permanent**`** |
| `governance/CLAUDE.md:606` *"Never leave session notes older than 30 days without archiving or deleting"* | same answer |

**All four dropped.** The notes marked permanent are **where this project's
inherited-claim errors are recorded** — the class of bug where a document asserts
something that was once true, a later worker cites it, and the claim propagates. R30 was
an entire item spent unwinding four of them. R28's note (`2026-08-10-R28.md:3`) records a
*conductor* error of a new kind; R17's (`2026-08-04-R17.md:3`) and R13a's
(`2026-08-06-R13a.md:3`) likewise. A 30-day clean would have deleted every one of these
before R30 was written, and R30 could not have been done.

The 13, for the record: R11, R2, R3a, R12, R17, R21, R13a, R25, R13b, R29, R8, R28, R30.
The 4 unmarked ones (R1b, R1c, R1d, R10) are superseded preview-rollout notes — and are
superseded *by* a permanent note that says so (`2026-07-31-R8.md:36`), which is the
"extract and integrate" step upstream asks for, done deliberately rather than on a timer.

**Do not adopt the 10-note cap, do not adopt the 30-day clean, do not move or delete a
note.** The roadmap's Locked decisions and this file are the "integrate" destination when
a note genuinely retires — a date is not a reason.

> **Correction to the R34 prompt.** It says *"11 of our 18 are explicitly marked
> `**Permanent**`"*. Verified count: **13 of 17** notes carry the marker; the 18th file in
> the directory is `README.md`, which is the template, not a note.

### 2.3 Upstream contradicts itself here — and that is the stronger finding

`:130` forbids permanent notes. But upstream's **own note template**, 20 lines earlier,
offers permanence as a first-class option:

```
:109  ### Expiry
:110  [Date when this note is no longer relevant, or "permanent"]
```

So a note marked `Expiry: permanent` is simultaneously template-conformant (`:110`) and
rule-violating (`:130`), inside one file. **Our practice matches `:110` exactly.** The
divergence is therefore narrower than "we disagree with upstream" — we disagree with one
of upstream's two positions, and we follow the other one.

**Promote upstream? Yes — this is the highest-value R20 item in this file**, because it
costs upstream nothing to fix and it is a self-inflicted inconsistency, not a judgement
call. The resolution should be `:130`'s: reword it to forbid *undifferentiated* note
accumulation while explicitly sanctioning a note whose Expiry is `permanent`, and make
the `:117`/`:118` lifecycle apply only to notes that declared an expiry date. Also worth
sending: the reason a permanent tier is needed at all — a note recording *why a past
decision was wrong* has no expiry date, and deleting it recreates the error.

---

## 3. `testing-qa.agent.md` — the coverage threshold, re-imported by the persona

**Upstream file:** `governance/.github/agents/testing-qa.agent.md` (+286 lines at this
bump — effectively a new file).

| Line | Text |
|---|---|
| `:22` | `\| **Coverage threshold** \| [line: X%, branch: X%, function: X%] \|` — a context row the persona is told to fill from the project |
| `:39` | *"2. **NEVER lower coverage thresholds**"* |
| `:267` | *"**Never lower coverage thresholds** — if a change reduces coverage, add tests"* |
| `:304` | *"- [ ] Coverage threshold maintained or improved"* — a completion checkbox |

**Dropped, for the reason already recorded in `docs/testing-standards.md` §7 row 1:** this
repo has **no coverage threshold to lower**. 48 of the site's 83 `.ts`/`.tsx` files (58%)
are vendored shadcn/ui, so a repo-wide ratio is cheapest to satisfy by rendering static
markup — it rewards precisely the tests our standard forbids, and says nothing about
content shape or twin drift. Required coverage here is by **named risk category**
(`docs/testing-standards.md` §2). The ratio is never measured and no coverage gate exists.

**Why this needs its own entry when §7 already covers the rule:** R33 neutralized the
*rule file* (`governance/docs/rules/testing-standards.md:77`) in root `CLAUDE.md`'s worked
example. **The persona is what an agent actually loads** when it is told to act as
testing-QA — Layer 3 in upstream's own three-layer model
(`governance/CLAUDE.md:454`) — and it restates the mandate four times without citing the
rule file. An agent that reads only the persona sees an unqualified "NEVER", finds no
delta, and adds a coverage gate. Naming the persona is the point of this entry.

Practical instruction: when loading the `testing-qa` persona in this repo, treat `:22`,
`:39`, `:267` and `:304` as **not applicable** and substitute
`docs/testing-standards.md` §2. Do not add a coverage gate, and do not write tests to
move one.

**Cross-reference, not a delta:** a **sixth** coverage site exists at
`governance/.github/skills/test-coverage.skill.md:103` (*"Coverage meets minimum threshold
(target: [your-threshold, e.g., 80%])"*). Nothing in this repo loads
`governance/.github/skills/`, so it governs nothing here. It is recorded as **R20**
feedback — upstream's blast radius for its own coverage rule is wider than upstream
thinks.

**Promote upstream? Yes.** Not "delete the rule" — the ask is that a persona restating a
`docs/rules/` mandate **cite the rule file it comes from**, so that overriding the rule
once overrides it everywhere. Four uncited restatements is why R33's fix was incomplete.

---

## 4. `CLAUDE.md:131-135` — the plan-approval gate

**Upstream text.** Under *Before Writing Code (Plan Approval Gate)*:

| Line | Text |
|---|---|
| `:133` | *"Present plan to human in the format above"* (the format is `:70-103`) |
| `:134` | *"**Wait for explicit approval** before writing ANY code"* |
| `:135` | *"Even single-line fixes require a brief plan statement"* |
| `:148` | *"**Wait for approval** before creating"* — a second gate, before any new file |
| `:385` | anti-pattern: *"Present a plan without waiting for approval → Always include ⏸️ and wait"* |

**Status: satisfied, at a different point in time. Not dropped, not relaxed.**

### The approval is real, and it is located at prompt-paste time

This repo runs a **conductor/worker** loop (root `CLAUDE.md:105-116`,
`docs/delivery/conductor-playbook.md`). A conductor session emits **one** standardized
task prompt; a **human reads it and pastes it into a fresh worker session**; the worker
executes it and returns an Outcome Summary.

**The emitted task prompt *is* the plan. The human pasting it *is* the explicit
approval.** That is not a lighter reading of `:134` — it is the same gate, performed
**earlier and in writing**. The prompt template
(`docs/delivery/task-prompt-template.md`) carries every element upstream's Plan
Presentation Format asks for, and two it does not:

| Upstream `:70-103` asks for | Where it is in our prompt |
|---|---|
| What the user will see | `## Context` |
| Scope | `## Build` + `## Do not touch` |
| Implementation steps | `## Build` |
| Files to create/modify | `## Build`, bounded by `## Do not touch` |
| Risks & breaking changes | `## Do not touch`, `## Authorization` |
| ⏸️ waiting for approval | **the paste itself** |
| *(not in upstream)* | `## Acceptance criteria` — the bar, stated before work starts |
| *(not in upstream)* | `## Verification` — what must be run before reporting done |

The playbook enforces the same requirement from the other side: *"Never end a conductor
turn with only discussion — end with either a prompt or an updated roadmap"*
(`docs/delivery/conductor-playbook.md:42-43`). A worker never begins without a written,
human-approved plan, because a worker session has no other way to begin.

`:148`'s second gate — approval before creating a file — is satisfied the same way, when
and only when the prompt names the file or the placement decision it delegates. This
document is an example: the R34 prompt delegated the placement decision explicitly and
required the choice to be justified in the outcome.

### The limit — read this part

**Approval here is scoped to the prompt, and to nothing else.**

- Work that exceeds the prompt's stated scope **is not approved**, and needs a **fresh
  prompt** from the conductor. Not a note in the outcome, not "while I was in there" —
  a new prompt.
- Anything on the prompt's `## Do not touch` list is refused, even if the worker becomes
  convinced it is wrong. The correct move is to surface it as a **new backlog item** in
  the Outcome Summary and let the conductor decide.
- A prompt is not a standing authorization. Approval does not carry from one task to the
  next, matching `governance/CLAUDE.md:422` (*"Task-scope exceptions do not carry over"*).
- **Approval is never inferred.** If a worker cannot point to the sentence in its prompt
  that covers what it is about to do, it does not have approval for it.
- **This delta does not touch the safety floor.** The authorization phrases
  (`authorize production deploy`, `authorize db migration on production`) are a *separate*
  mechanism from the plan gate, are not overridable, and must be typed by the human **in
  the worker session**. A pasted prompt is not, and never becomes, an authorization
  phrase.

**What must not be concluded from this entry:** that approval is implicit in this repo. It
is explicit, it is in writing, and it happened before the session started.

**Promote upstream? Yes.** `:134` assumes a single interactive session in which plan and
execution share a context window. It has no concept of a plan authored in one session and
approved into another, which is a normal shape for agent delivery. Upstream should state
the gate as a *property* — "no code is written until a human has approved a written plan
covering it" — and let a project say where that approval lives, rather than mandating the
⏸️ mechanism that `:385` hardcodes.

---

## 5. `release-and-deployment.md:116` — push before PR (**not a delta**)

**Upstream text** (`governance/docs/rules/release-and-deployment.md:116-117`), under the
heading **`## Promotion PR Workflow`** at `:108`:

> 2. **Never run `git push` before `gh pr create`** for promotion PRs -- the PR
>    creation sets up the correct tracking

### Determination: this is not a conflict. It applies, and we comply naturally.

The reasoning, since the entry exists to record it rather than to record a divergence:

1. **It is scoped, in its own sentence, to promotion PRs** — *"for promotion PRs"* — and
   sits under a heading that scopes it again. It does not govern feature-branch PRs.
2. **For a promotion, it is trivially satisfiable.** Our only promotion is
   `preview` → `main`. Both branches already exist on the remote, so
   `gh pr create --base main --head preview` needs no push at all. There is no way to
   violate the rule while doing the thing the rule is about. Promotions of this shape are
   already in the history (`e721d17`, `841d736`, `d019791` — all *"Merge preview into
   main"*).
3. **Upstream's own anti-pattern table orders it the other way for ordinary PRs:**
   `governance/CLAUDE.md:374` — *"Combine commit + push + PR in one sequence → Separate:
   commit → verify → push → PR"*. Push precedes PR there, explicitly. Read together, the
   two are consistent only if `:116` is promotion-scoped — which is what it says.

So the earlier reading, that the rule is unexecutable because `gh pr create` requires a
pushed head, was a **generalization error**: true of feature branches, and the rule does
not apply to feature branches.

**Recorded status: applies, complied with, no behaviour change, no override.** It is not
in root `CLAUDE.md`'s overrides table, because a deltas table that lists non-conflicts
teaches a reader to distrust the ones that are real.

**The thing worth carrying forward** is the mis-reading, not the rule: **do not generalize
`:116` to feature-branch PRs.** Feature work here is `git push -u origin <branch>` then
`gh pr create --base preview`, in that order, and that is correct.

**Promote upstream? Minor.** `:116` would be harder to mis-generalize if it said *why* it
is promotion-only — that both branches pre-exist, so the push is not merely discouraged
but unnecessary.

---

## 6. Also found in the `fddf95b` bump

Conflicts and hazards from the same 45-file bump that were **not** on the R34 list. Found
while verifying the five above. Recorded so the next bump starts from a complete picture.

### 6.1 Four upstream template files load on the first read under `governance/` ⚠️

The bump added `governance/.claude/rules/01-project-context.md`,
`02-non-negotiables.md`, `03-environment.md` and `README.md` (all `A` at this bump).
**This repo has no `.claude/rules/` of its own.**

**Verified by experiment in R40 (2026-08-10), Claude Code `2.1.220`, macOS.** The
original wording here — *"loaded into every Claude Code session"*, *"picked up as
project-local rules"* — named the wrong mechanism and rested on the unfalsifiable
*"observing them in this session's loaded context"*. Right conclusion, wrong reason. The
measured behaviour:

| # | Fresh session did | Four files injected? |
|---|---|---|
| A | Nothing — cold, no tool calls | **NO** |
| B | Read tool on `governance/CLAUDE.md` | **YES** — all four |
| C | Read tool on `governance/docs/rules/github-workflow.md` (three levels deep, not the rules dir) | **YES** — all four |
| D | Read tool on `docs/delivery/roadmap.md` only, nothing under `governance/` | **NO** |
| E | Read tool on `governance/CLAUDE.md`, with the exclusion below applied | **NO** |

So they do **not** load at session start. They load **on demand, the moment any file
anywhere under `governance/` is opened with the Read tool**, and they arrive as
system-reminders that read as instructions. Because every task prompt in this repo opens
with *"Read `governance/CLAUDE.md` first"*, **in practice that is every worker session.**

**Two traps this experiment exposed — both matter more than the result:**

1. **`/context` cannot detect this.** Its **Memory Files** table after a governance read
   is byte-identical to a cold session's, while all four files are demonstrably in
   context. It tabulates session-start memory only. R40's own prompt named `/context` as
   *the* documented check; used alone it returns a **false negative** and would have
   closed this as a non-issue.
2. **Only the Read tool triggers the injection.** `cat`, `sed` and `git show` read the
   same bytes and fire nothing. This is the whole explanation for the contradictory
   evidence that made R40 a task: the reports came from different tools, and both were
   accurate.

They are **unfilled templates**, and they read as rules:

- `governance/.claude/rules/02-non-negotiables.md:17` — `[e.g., "PRs must be under 400
  lines of diff"]`, i.e. **§1.3's dropped cap, re-entering by a second door**, dressed as
  a project non-negotiable.
- `governance/.claude/rules/01-project-context.md:8-9` — Name `[your-project-name]`,
  Stack `[framework] + [database] + [hosting]`. **Actively wrong** for a repo whose real
  stack is stated in root `CLAUDE.md:13-16`.
- `03-environment.md` — placeholder runtime versions, env vars and reset commands for
  services this project does not run.

**Nothing here is authoritative. Where these disagree with root `CLAUDE.md` or this file,
they lose** — they are upstream boilerplate that happens to sit at a path a tool
auto-loads, not a decision anyone made about this repo.

This is also **evidence for a claim root `CLAUDE.md` already makes**: `.claude/rules/` is
the wrong surface for governance, because it is loaded by one tool, invisible to the
others, and — as here — can inject content nobody chose. Worth sending upstream via
**R20**: shipping populated-looking templates at an auto-loaded path is a footgun for
every consumer, and they should be `.example` files or live outside `.claude/`. R40
**strengthens** that feedback rather than retiring it — the templates reach a consumer
who never opted in, through a path no one configured.

**The fix, applied in R40.** One documented key, verified as row E above and again against
the real settings files on both a shallow (`governance/CLAUDE.md`) and a deep
(`governance/docs/rules/…`) read:

```json
"claudeMdExcludes": ["**/governance/.claude/rules/**"]
```

Scoped to `.claude/rules/` only — `governance/CLAUDE.md` and `governance/docs/rules/*`
still read normally, which is required, since they are the files every prompt sends
workers to.

**Who is protected: this machine only.** The key is set in `.claude/settings.local.json`
and in the user-level `~/.claude/settings.json`. **Both are machine-local** —
`.gitignore:25-27` ignores *both* project settings files, by a deliberate **R37**
decision. Every fresh clone, every other contributor and every CI checkout still loads
all four on the first governance read. A shared fix needs a *committed* settings file,
which would reverse R37. **Not reversed here** — raised as **R41** so it is decided
deliberately rather than by side effect.

**This is not fixed by R7, and R7 does not make it moot.** R40 tested the shadowing
question directly on a throwaway fixture with a project `.claude/rules/` *and* a
submodule one, each carrying a unique sentinel: **both loaded.** The project-level file
loaded at session start, the submodule's still injected on the governance read. The
mechanism is keyed to the directory of the file being read, not to a missing project
rules dir, so a project `.claude/rules/` **adds** a load rather than replacing one. R7
keeps its full value and R40 had to be fixed independently.

### 6.2 Path collision: upstream now ships its own `docs/delivery/`

New at this bump: `governance/docs/delivery/roadmap.md` (354 lines),
`locked-decisions.md` (412), `README.md`. **Same relative paths as ours.** A worker told
to read `docs/delivery/roadmap.md` can now open the wrong one, and upstream's is a
plausible-looking roadmap for the governance framework itself.

**Ours is the one that governs:** `docs/delivery/roadmap.md` at the repo root, never
`governance/docs/delivery/`. Cite the full path in prompts. No file change needed — this
is a naming hazard, recorded so it is recognized rather than debugged.

### 6.3 `AGENTS.md:92` — TODO comments must carry an issue link

New file at this bump. Same root cause as §1.2 (this repo has no issues) and the same
answer: cite the roadmap `R#`. Folded into §1.2 rather than given its own entry.

### 6.4 `AGENTS.md:59` — general files `kebab-case`

`docs/testing-standards.md` §7 already records this conflict against
`governance/docs/rules/coding-standards.md:7` (this repo uses `PascalCase.tsx` throughout;
renaming 83 files to satisfy a shared template would touch the public render). `AGENTS.md`
restates it at a *higher* layer — Layer 1, per `governance/CLAUDE.md:452` — which widens
the existing delta's blast radius without changing its substance or its verdict. Recorded
here; the reasoning stays in §7.

---

## Maintenance

When a future submodule bump lands:

1. Diff the rule files: `git -C governance diff --name-status <old> <new>`.
2. For each changed or added file, ask whether it contradicts settled practice — check
   `docs/delivery/roadmap.md`'s **Locked decisions**, `docs/testing-standards.md`, and
   this file.
3. Append a section here for each new divergence, with `path:line`, what we do, and
   **why**. Add a row to root `CLAUDE.md`'s overrides table only if the divergence is an
   override; a non-conflict like §5 stays here.
4. Re-verify existing entries still cite the right lines — line numbers move when upstream
   edits a file. A stale citation is an inherited-claim error waiting to happen.
5. **If the bump adds or moves anything under a `.claude/` directory, re-run §6.1's test**
   — the behaviour is version-dependent, and §6.1's answer is pinned to Claude Code
   `2.1.220`. The test is: fresh session, **Read tool** on a file under `governance/`, then
   ask what was auto-injected. **Not `/context`** (blind to on-demand loads) and **not
   `cat`/`git show`** (they do not trigger it). Widen `claudeMdExcludes` if the path moved.
5. **Never edit `governance/`.** Promotion upstream is **R20**.
