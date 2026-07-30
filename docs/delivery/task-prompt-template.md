# Task Prompt Template

> The **conductor** fills this in and emits it as **one** paste-ready prompt for a
> **fresh worker session**. Format = the governance Delivery Planner prompt format
> (`governance/.github/agents/delivery-planner.agent.md`) + a governance always-cite
> header. **One task per prompt.** Delete guidance in _italics_ before sending.

---

```
# [R#] — [Task title — clear and specific]

## Orient first (governance)
- Read `governance/CLAUDE.md` first (hard gates, Definition of Done, authorization phrases).
- Load these rule files for this task type: [e.g. coding-standards, database-safety, design-system-rules, testing-standards, release-and-deployment].
- Locked context / env truth: `docs/delivery/roadmap.md` (Locked decisions), `INFRASTRUCTURE.md`, `RELEASE.md`.
- Branch: work on `preview` (never `main`). Package manager: pnpm.

## Agent to load
[full-stack | devops | testing-qa | code-review | release-manager | product-designer]  — _why this one_

## Context
[Why this task exists and what system it touches. Trace the path: data/stocks-and-flows, upstream/downstream (schema→queries→API→component→UX), what state/events it leaves behind. Enough that the worker never guesses intent.]

## Build
[What to implement — the what and the why, NOT the how. Let the worker choose the implementation, guided by the reference pattern.]

## Acceptance criteria
- [Specific and verifiable — each item testable by a human or a command.]
- [For UI: name the states — loading, empty, error, success, partial.]

## Do not touch
[Explicit list of files/modules/areas out of scope. Always include: the public design must stay pixel-identical; don't reintroduce the page-builder.]

## Reference pattern
[Existing file(s) to model the implementation on, with path. "none" if genuinely new — and say why nothing fits.]

## Verification (run before reporting done)
- Compiles, lint clean, no `any` without justification (Definition of Done).
- [If UI/content render change] Pixel gate 0.000%: build → serve → `node scripts/shoot.mjs <url> screenshots/candidate` → `node scripts/diff.mjs screenshots/baseline screenshots/candidate`.
- [If schema change] `pnpm migrate:create <name>` → commit the migration file; DDL uses the **direct** Neon endpoint; `DB_TARGET_HOST` matches `DATABASE_URI` (dbGuard). Never `seed` prod.
- [If tests apply] per `governance/docs/rules/testing-standards.md` (regression test for bugfixes).
- [Deploy] only via `preview` → `main`; state which authorization phrase the human must type.

## Authorization (if this task deploys or touches a remote DB)
This task requires the human to type: [`authorize production deploy` / `authorize db migration on production` / none]. Do not assume or simulate it.

## Return
End by producing an **Outcome Summary** using `docs/delivery/outcome-summary-template.md`. Paste it back to the conductor session.
```

---

## Prompt quality gate (conductor self-checks before sending)

From `delivery-planner.agent.md` — every box must be true:
- [ ] Context is sufficient — the worker can orient without guessing.
- [ ] Task is atomic — one clear output.
- [ ] Acceptance criteria are specific and verifiable.
- [ ] Constraints explicit — "Do not touch" stated.
- [ ] If schema changes: migration + safety plan included (direct endpoint, guard, no prod seed).
- [ ] Reference pattern named if one exists.
- [ ] DS / pixel-gate compliance stated for any UI/render task.
- [ ] Correct agent recommended; rule files to load listed.
- [ ] Authorization phrase named if it deploys / touches remote DB (and left for the human).
