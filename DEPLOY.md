# DEPLOY.md — Portafolio AseCorOba

Two Vercel projects from **one** GitHub repo:

1. **Front-end** (this repo root) — Vite site. Its build fetches all content from
   the deployed CMS, then runs `vite build`. Output: `dist/`.
2. **CMS** (`cms/` subdirectory) — Payload CMS (Next.js) backed by Neon (Postgres)
   + Cloudflare R2 (images).

**Publish flow (manual):** editing content in the CMS admin → editor clicks the
**"Publicar cambios"** button (→ `POST /api/publish`) → it POSTs the front-end's
Vercel **Deploy Hook** (`VERCEL_DEPLOY_HOOK_URL`) → Vercel rebuilds the front-end →
its build re-fetches the fresh content and images. (Auto-deploy-on-save hooks were
removed — publishing is deliberate, one rebuild per click.)

> **Live infrastructure, domains, preview environment, env-var matrix, and the
> gotchas learned during deploy are documented in [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md).**
> This file (DEPLOY.md) covers first-time project creation.

> **Secrets are NEVER committed.** Everything below is entered in the Vercel
> dashboard (Project → Settings → Environment Variables) or Neon/Cloudflare.
> `cms/.env` is git-ignored and is for local development only.

---

## 1. Create the CMS Vercel project (do this first — the front-end needs its URL)

1. Vercel → **Add New… → Project** → import this GitHub repo.
2. **Root Directory:** `cms`  (click *Edit* and select the `cms/` folder).
3. **Framework Preset:** Next.js (auto-detected). Leave build/output as default.
4. **Environment Variables** (all Environments):
   - `PAYLOAD_SECRET` — a long random string (e.g. `openssl rand -hex 32`).
   - `DATABASE_URI` — the Neon connection string (see step 2).
   - `S3_BUCKET` — Cloudflare R2 bucket name (e.g. `asecoroba-media`).
   - `S3_ENDPOINT` — R2 S3 endpoint, `https://<account-id>.r2.cloudflarestorage.com`.
   - `S3_ACCESS_KEY_ID` — R2 access key.
   - `S3_SECRET_ACCESS_KEY` — R2 secret key.
   - `VERCEL_DEPLOY_HOOK_URL` — **leave empty for now**; filled in step 5.
5. **Deploy.** Note the CMS URL, e.g. `https://asecoroba-cms.vercel.app`.

## 2. Neon (Postgres) + Vercel integration

1. Create a Neon project (or reuse the existing one). Copy its **pooled**
   connection string (`...-pooler...`, `sslmode=require`) → this is `DATABASE_URI`.
2. Install the **Neon** integration from the Vercel Marketplace and connect it to
   the **CMS** project. This enables a **database branch per preview deployment**,
   so CMS preview builds don't touch production data.
3. First deploy runs Payload's automatic migrations against the DB.

## 3. Cloudflare R2 (images)

1. Create an R2 bucket; create an S3 API token (access key + secret).
2. Fill `S3_*` in the CMS project (step 1.4).
3. Uploaded images are served by the CMS at `/api/media/file/<filename>`; the
   front-end build downloads them from there (falling back to R2 directly if
   `S3_*` are also set on the front-end project).

## 4. Create the Front-end Vercel project

1. Vercel → **Add New… → Project** → import the **same** GitHub repo again.
2. **Root Directory:** `.` (repo root — leave as default).
3. **Framework Preset:** Vite (or "Other"). The build/output come from
   `vercel.json`, which is already committed:
   - Build Command: `node scripts/fetch-content.mjs && pnpm build`
   - Output Directory: `dist`
   - SPA rewrites: all routes → `/index.html`
4. **Environment Variables** (all Environments):
   - `PAYLOAD_API_URL` — the CMS base URL from step 1.5
     (e.g. `https://asecoroba-cms.vercel.app`). **No trailing slash.**
   - *(optional)* `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
     `S3_SECRET_ACCESS_KEY` — only needed if you want image downloads to fall
     back to pulling straight from R2. Normally the CMS URL is enough.
5. **Deploy.** Verify the site renders with the CMS content.

## 5. Create the Deploy Hook and wire Publish → rebuild

1. **Front-end** project → **Settings → Git → Deploy Hooks** →
   **Create Hook** (name: `cms-publish`, branch: `main`). Copy the generated URL.
2. **CMS** project → **Settings → Environment Variables** → set
   `VERCEL_DEPLOY_HOOK_URL` = that URL (all Environments).
3. **Redeploy the CMS** so it picks up the new env var.
4. Test: edit any content in the CMS admin and Save → the front-end project
   should start a new deployment within a few seconds.

## 6. Domain (DNS)

1. **Front-end** project → **Settings → Domains** → add the public domain
   (e.g. `asecoroba.com`) and follow Vercel's DNS instructions (A/CNAME).
2. *(optional)* Add a subdomain for the CMS (e.g. `admin.asecoroba.com`) on the
   **CMS** project. If you do, update `PAYLOAD_API_URL` on the front-end to match
   and redeploy the front-end.

## 7. Create the owner's admin user (after first CMS deploy)

1. Open the CMS admin at `<cms-url>/admin`.
2. On first load Payload prompts to create the first user — create the wife's
   account (email + password). This is the login for editing content.
3. Add more users later under **Ajustes → Usuarios**.

---

## Notes

- **Content is source-controlled AND regenerated.** The committed
  `content/*.json` and `public/images/*` are the fallback/reference; on every
  Vercel build `scripts/fetch-content.mjs` overwrites them from the live CMS.
  Editing content in the CMS + Publish is the normal workflow; you don't edit the
  JSON by hand.
- **Local development:** copy the real secrets into `cms/.env` (git-ignored). Run
  the CMS with `pnpm dev` (in `cms/`, serves on `:4400`). To regenerate content
  locally: `PAYLOAD_API_URL=http://localhost:4400 node scripts/fetch-content.mjs`.
- **Fidelity/parity check (local):** `fetch-content.mjs` deep-compares all 14
  emitted files against their committed versions at git HEAD and writes
  `/tmp/fetch-fidelity.json`. A divergence is always printed in full (file, JSON
  path, expected vs actual). Add `--gate` to make it **exit non-zero**:
  `PAYLOAD_API_URL=http://localhost:4400 node scripts/fetch-content.mjs --gate`.
  Without the flag it warns and exits 0, because on the Vercel build the script
  is the content *producer* and a diff from HEAD is the normal result of a
  publish. The visual-parity gate (`scripts/shoot.mjs` + `scripts/diff.mjs`)
  confirms 0.000% pixel drift.
- **The CMS-side twin is read-only.** `cms/src/scripts/export-content.ts`
  reconstructs the same 14 files into `/tmp/export-out/` and diffs them; it never
  writes into `content/`. Its gate is ON by default (exit 1 on any file not
  proven identical); `FIDELITY_GATE=0` downgrades that to a warning. That file is
  the CLI — the reconstruction itself lives in `cms/src/scripts/export-emit.ts`,
  which imports no `payload` and runs nothing on import. Run the CLI, not the
  library.
- **The two twins are checked against EACH OTHER, offline** (R13b).
  `tests/fidelity/twin-equivalence.test.ts` drives both emitters over one
  committed synthetic fixture and requires byte-identical output for all 14
  files. It is part of the `tests` CI job — no CMS, no database, no network. Both
  gates above compare a twin to *committed content*; only this compares the twins
  to *each other*, which is the contract that keeps the hand-mirroring honest.
