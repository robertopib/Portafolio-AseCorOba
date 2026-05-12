# CLAUDE.md - Portafolio AseCorOba

> This project follows the AI Development Governance framework.
> **Always read `governance/CLAUDE.md` first** — it is the governance root.

---

## Project Context

- **Stack**: React + Vite + Tailwind CSS + shadcn/ui components
- **Type**: Static portfolio website
- **Hosting**: SiteGround (deployed via GitHub Actions + rsync)
- **Package Manager**: pnpm

## Governance

All rules from the governance framework apply:

- Governance root: `governance/CLAUDE.md`
- Rule files: `governance/docs/rules/`
- Architecture: `governance/docs/governance-architecture.md`

## Deployment

- Push to `main` triggers automatic build and deploy via `.github/workflows/deploy.yml`
- Built files are rsync'd to SiteGround `public_html`
- No manual deployment steps required
