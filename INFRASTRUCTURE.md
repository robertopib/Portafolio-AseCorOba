# INFRASTRUCTURE.md — Portafolio AseCorOba

Authoritative reference for how this project is hosted, deployed, and previewed.
Current as of the deploy/preview setup session (July 2026). No secrets live here —
they are in Vercel env vars, Neon, Cloudflare, and the git-ignored `cms/.env`.

---

## 1. Big picture

- **One GitHub repo** → **two Vercel projects** (both **Hobby** plan):
  - **`asecoroba-site`** — Root Directory `.` — the Vite/React SPA. Its build runs
    `node scripts/fetch-content.mjs && pnpm build`, which pulls all content + images
    from the deployed CMS into `content/*.json` / `public/images`, then builds `dist/`.
  - **`asecoroba-cms`** — Root Directory `cms` — Payload CMS (Next.js), backed by
    **Neon** (Postgres) + **Cloudflare R2** (images).
- **DNS:** Cloudflare (nameservers moved off Namecheap; **registrar stays Namecheap**).
- **Design guarantee:** the public site stays **pixel-identical** to the original
  bespoke design. Verified by `scripts/shoot.mjs` + `scripts/diff.mjs` (0.000% gate).
  See memory `cms-is-content-editor`.

## 2. Live URLs

| Layer | Production (`main`) | Preview (`preview`) |
|---|---|---|
| Site | `https://www.ase-cor-oba.site` (apex `ase-cor-oba.site` 308→www) | `https://preview.ase-cor-oba.site` |
| CMS admin | `https://cms.ase-cor-oba.site/admin` | `https://cms-preview.ase-cor-oba.site/admin` |
| Media (R2) | `https://media.ase-cor-oba.site` | (shared) |
| Database | prod Neon branch | isolated Neon **`dev`** branch |

## 3. Branches & environments

- **`main`** → Vercel **Production** for both projects.
- **`preview`** → Vercel **Preview** for both projects (long-lived branch).
- **Develop enhancements on `preview` (or feature branches), never on `main`.**
  Merge to `main` only after review → production updates.
- **Neon `dev` branch** = copy-on-write clone of prod data. The preview CMS and
  local dev use it, so enhancement work never touches production data.

## 4. Environment variables (Vercel, scoped Production vs Preview)

**Site project (`asecoroba-site`):**
| Var | Production | Preview |
|---|---|---|
| `PAYLOAD_API_URL` | `https://cms.ase-cor-oba.site` | `https://cms-preview.ase-cor-oba.site` |
| `R2_PUBLIC_URL` | `https://media.ase-cor-oba.site` | same |
| `S3_*` | set | same |

**CMS project (`asecoroba-cms`):**
| Var | Production | Preview |
|---|---|---|
| `DATABASE_URI` | prod Neon (pooled) | `dev` Neon branch (pooled) |
| `PAYLOAD_SECRET` | set | same |
| `R2_PUBLIC_URL` | `https://media.ase-cor-oba.site` | same |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | set | same |
| `VERCEL_DEPLOY_HOOK_URL` | Site **`main`** deploy hook | Site **`preview`** deploy hook |

> `R2_PUBLIC_URL` makes Payload serve media straight from the R2 public/custom
> domain (`generateFileURL` in `cms/src/payload.config.ts`), bypassing the ~4.5 MB
> Vercel function response limit that otherwise 500s on large images.

## 5. Cloudflare DNS records

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` (apex) | `<vercel-dns target>` (e.g. `xxxx.vercel-dns-017.com`) | **DNS only (grey)** |
| CNAME | `www` | `cname.vercel-dns.com` | **DNS only (grey)** |
| CNAME | `cms` | `cname.vercel-dns.com` | **DNS only (grey)** |
| CNAME | `preview` | `cname.vercel-dns.com` | **DNS only (grey)** |
| CNAME | `cms-preview` | `cname.vercel-dns.com` | **DNS only (grey)** |
| CNAME | `media` | (auto, from R2 custom-domain connect) | **Proxied (orange)** |
| MX / TXT | — | email (SPF/DKIM) — **preserve on nameserver moves** | — |

- **Every Vercel record must be grey-cloud (DNS only).** Orange breaks Vercel SSL/verify.
- **`media` is the one exception — orange/proxied** (it's an R2 custom domain).
- Apex uses Cloudflare **CNAME flattening**; a CNAME on `@` is allowed here.

## 6. Publish flow (content → live)

Editing is **manual publish**, not auto-deploy-on-save:
1. Editor changes content in the CMS admin and Saves.
2. Editor clicks **"Publicar cambios"** (admin nav button →
   `POST /api/publish`, `cms/src/components/PublishButton.tsx`).
3. The endpoint (auth-gated) fires `pingDeployHook` →
   `VERCEL_DEPLOY_HOOK_URL` → the matching Site project rebuilds.
4. The Site build re-fetches fresh content/images and redeploys.

Prod CMS → rebuilds prod site; preview CMS → rebuilds preview site (separate hooks).

## 7. Enhancement workflow

> ⚠️ **The portfolio's Neon lives in its OWN account.** It is **NOT** the account
> the local `neonctl` CLI is logged into (that login belongs to a *different*,
> unrelated project). **Never** use `neonctl` here to discover or repoint the
> database — always take the connection string from the portfolio's own Neon
> account. A mis-repoint once contaminated an unrelated project's DB.
>
> **Safety guard:** `cms/src/scripts/dbGuard.ts` runs before Payload connects in
> `seed`/`export` and **aborts unless `DB_TARGET_HOST` (in `cms/.env`) matches the
> `DATABASE_URI` host.** Set `DB_TARGET_HOST` to the exact host you intend to use;
> bypass only with `SEED_SKIP_DB_GUARD=1` when you are certain.

1. Point local `cms/.env` `DATABASE_URI` at the portfolio's Neon **dev** branch,
   and set `DB_TARGET_HOST` to that same host.
2. Build the change on the `preview` branch (or a feature branch merged into it).
3. **Run the pixel gate locally** — must be 0.000% (`shoot.mjs` + `diff.mjs` vs
   `screenshots/baseline`). See DEPLOY.md notes + `cms-is-content-editor` memory.
4. Push `preview` → review on `preview.ase-cor-oba.site` / `cms-preview…/admin`.
5. Merge to `main` → production updates.

## 8. Gotchas learned (don't relearn these)

- **Vercel Deployment Protection defaults to ON for previews.** It serves a
  "Log in to Vercel" HTML page for every request — a protected `/admin` returns
  **200 (the Vercel login page, not Payload)** and `/api/media` **302s** to it.
  This blocks both human access AND the site build's `fetch-content` (build fails:
  `<cms-preview>/api/media -> 404 / deployment could not be found`).
  **Fix:** both projects → Settings → Deployment Protection → Vercel Authentication →
  **Disabled**. Payload's own login still guards the admin.
- **Hobby DOES route custom domains to a git branch.** Early preview 404s were
  propagation delay, not a plan limit — the pinned `.preview` domains work.
- **The site build depends on the CMS being reachable** (it fetches from
  `PAYLOAD_API_URL`). Get the CMS preview green before rebuilding the site preview.
- **Apex CNAME conflict on Cloudflare:** the imported SiteGround A record on `@`
  must be deleted before adding Vercel's apex CNAME ("record with that host
  already exists").
- **Neon connection strings** are the **pooled** ones (`...-pooler...`,
  `sslmode=require&channel_binding=require`).

## 9. Outstanding / periodic

- [ ] **Local `cms/.env`** `DATABASE_URI` → `dev` branch (isolate local dev).
- [ ] **Rotate credentials** (Neon password + R2 API token were pasted in chat
      during setup) and update Vercel env vars.
- [ ] Optional: decide canonical host (currently `www`; apex redirects to it).
- [ ] Optional: refresh the `dev` Neon branch from prod occasionally for fresh data.

## 10. See also

- `DEPLOY.md` — first-time project/domain creation steps.
- `EDITING.md` — the editor's (owner's) content-editing guide.
- Memory: `preview-environment`, `cms-is-content-editor`.
