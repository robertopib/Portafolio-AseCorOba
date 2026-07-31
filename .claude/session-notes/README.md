# Session notes

Persistent per-task notes that survive across sessions, written by the **conductor**
after ingesting each worker Outcome Summary (see
`docs/delivery/conductor-playbook.md`). Convention from
`governance/docs/rules/session-and-context.md`.

## Naming
```
.claude/session-notes/<YYYY-MM-DD>-<R#>.md      e.g. 2026-07-31-R1.md
```

## Format
```markdown
## [R# — Task title] — [Date]

### Context
[Why this note exists / what task it records]

### Content
[The Outcome Summary that was ingested, plus any conductor decisions]

### Expiry
[When this note is no longer relevant, or "permanent"]
```

Any new session should read the latest notes here at start, and expired notes may be
cleaned up. Notes are committed with the repo so the roadmap + notes fully describe
delivery state.
