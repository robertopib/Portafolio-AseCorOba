# CLAUDE.md - Portafolio AseCorOba

> This project follows the AI Development Governance framework.
> **Always read `governance/CLAUDE.md` first** — it is the governance root.
> Then read **[Governance precedence](#governance-precedence)** below: `governance/` is a
> submodule shared with other projects, and where a project file disagrees with it, the
> **project file wins**. Four safety mechanisms are exempt.

---

## Project Context

- **Stack**: React + Vite + Tailwind CSS + shadcn/ui components
- **Type**: Static portfolio website
- **Hosting**: SiteGround (deployed via GitHub Actions + rsync)
- **Package Manager**: pnpm

## Governance

All rules from the governance framework apply **except where a project file overrides
them** — see [Governance precedence](#governance-precedence) below.

- Governance root: `governance/CLAUDE.md`
- Technical baseline for all AI tools: `governance/AGENTS.md`
- Rule files: `governance/docs/rules/`
- Architecture: `governance/docs/governance-architecture.md`
- **Testing standard for this repo (overrides upstream): `docs/testing-standards.md`**

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

| Upstream rule file | Project file that wins | Deltas recorded in |
|---|---|---|
| `governance/docs/rules/testing-standards.md` | `docs/testing-standards.md` | its **§7** |

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

- Push to `main` triggers automatic build and deploy via `.github/workflows/deploy.yml`
- Built files are rsync'd to SiteGround `public_html`
- No manual deployment steps required
