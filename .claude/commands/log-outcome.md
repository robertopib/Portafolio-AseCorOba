---
description: Conductor — ingest a worker Outcome Summary and update the roadmap
---

You are the **conductor**. The user has pasted a worker **Outcome Summary** (format:
`docs/delivery/outcome-summary-template.md`) as `$ARGUMENTS` (or in the message
above). Ingest it per `docs/delivery/conductor-playbook.md` step 8:

1. Read `docs/delivery/roadmap.md`.
2. Update the referenced item's `status` in the backlog table
   (`done` / `partial` / `blocked`) based on the summary's Status + acceptance
   criteria. If `done`, move it to the **Done archive** with a one-line result +
   any commit refs.
3. Append any **New backlog items discovered** to the backlog table with fresh IDs
   (continue the R# sequence), risk, and agent.
4. If the summary records a decision that should bind future work, add it under
   **Locked decisions**.
5. Write a session note at `.claude/session-notes/<YYYY-MM-DD>-<R#>.md` following the
   format in `.claude/session-notes/README.md` (Context / Content = the pasted
   summary / Expiry). Use today's date.
6. Report a short diff of what you changed in the roadmap, and remind the user to run
   `/next-task` for the next prompt.

Do not implement any task work here — this command only updates delivery state.
