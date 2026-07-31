# Outcome Summary Template

> The **worker session** produces this at the end of a task and pastes it back into
> the **conductor** session. The conductor uses it to update
> `docs/delivery/roadmap.md`, write a session note, and compose the next prompt.
> Aligned to the Session Summary in `governance/docs/rules/session-and-context.md`.

---

```
# Outcome — [R#] [Task title]  ·  [date]

## Status
[done | partial | blocked]

## Acceptance criteria
- ✅ [criterion met]
- ❌ [criterion NOT met — why]

## Files changed
- `path` — [what changed, one line]

## Verification results
- Build/lint: [pass/fail + note]
- Pixel gate: [N.NNN% / n-a] (routes checked)
- Tests: [pass/fail / n-a]
- Migration: [created `<name>` / n-a]  ·  Deploy: [none / preview / prod + commit]

## Decisions
- [Any architectural/design decision + reasoning — the conductor records these as locked if applicable]

## Deviations / constraints
- [Anything done differently from the prompt; confirm "Do not touch" respected; confirm pixel-identity held]

## Blockers
- [Anything that stopped progress / needs a human action or authorization phrase]

## New backlog items discovered
- [Title — one line — suggested risk/agent]  (or "none")

## Recommended next step
- [What the conductor should queue next, given the roadmap]
```

---

**Handoff rules** (from `session-and-context.md`): the worker writes this summary;
the conductor reads it before composing the next prompt; if the conductor disagrees
with a decision it raises a question rather than silently overriding.
