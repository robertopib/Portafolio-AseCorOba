# Conductor Playbook

> How to run the **conductor session** — the roadmap-driven session that emits one
> task prompt at a time and ingests each outcome. The conductor plans; a **fresh
> worker session** executes each prompt. This is the Delivery Planner role
> (`governance/.github/agents/delivery-planner.agent.md`) made operational.

## Roles
- **Conductor** (this session): plans, sequences, writes prompts, updates the
  roadmap + session notes. Does **not** implement tasks.
- **Worker** (a new, clean session per task): executes exactly one prompt, then
  returns an Outcome Summary.
- **Human** (you): opens the worker session, pastes the prompt, pastes the outcome
  back, and types any authorization phrases.

## The loop

1. **Orient** (start of every conductor turn):
   - Read `governance/CLAUDE.md`, then `docs/delivery/roadmap.md`, then the latest
     file in `.claude/session-notes/`.
2. **Select** the next `todo` item whose `depends-on` are all `done` (top of the
   backlog wins). If the top item is `blocked`, pick the next unblocked one and note why.
3. **Trace the system path** before writing (both lenses from delivery-planner):
   - *User lens*: name the specific person and moment this serves.
   - *System lens*: data in/out, upstream→downstream chain, side effects, what it
     looks like at scale.
4. **Compose** the prompt using `task-prompt-template.md`. Split into multiple
   numbered prompts if the item isn't atomic (e.g. R1 diagnostic vs. R1 fix).
5. **Run the quality gate** (bottom of the template). If any box fails, fix the
   prompt before sending.
6. **Emit ONE prompt** (paste-ready), set that roadmap item to `in-progress`, and stop.
7. **Wait** for the human to run it in a fresh worker session and paste back the
   Outcome Summary.
8. **Ingest** the outcome:
   - Update the item's `status` in the backlog table (`done`/`partial`/`blocked`).
   - Write `.claude/session-notes/[date]-[R#].md` (see that dir's README).
   - Move finished items to **Done archive**; add any **New backlog items** with new IDs.
   - Record any decision the worker made under **Locked decisions** if it should bind future work.
9. **Repeat** from step 2 for the next prompt.

## Rules
- **One task per prompt.** Never combine tasks. Never end a conductor turn with only
  discussion — end with either a prompt or an updated roadmap.
- **Never** put an authorization phrase in a prompt as if satisfied — name which
  phrase the human must type.
- **Never** plan work that contradicts a Locked decision; if a task requires it,
  surface it as a question first.
- Keep the roadmap the single source of truth — update it every cycle so any new
  conductor session can resume from it + the session notes alone.

## Fast path (slash commands)
- `/next-task` — orient, select, and emit the next prompt (steps 1–6).
- `/log-outcome` — paste an Outcome Summary; it updates the roadmap + writes the
  session note (step 8). Then run `/next-task` again.
