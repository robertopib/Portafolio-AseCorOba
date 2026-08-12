# R45 — Production pre-flight against the R23 worksheet

> **SUPERSEDED 2026-08-12 by `r50-production-preflight.md`.** Its verdict below — *"the R23b-i
> backfill does not fit production as-is"* — was true when measured and has since been resolved
> by **R49**, which added `1.jpg` to the worksheet and replaced the census with a set comparison.
> Production now reconciles exactly, and R50 measures all three migrations, not just the first.
> **The measurements here are still the record of what production looked like on 2026-08-11** and
> are cited throughout R50; only the verdict is out of date.

> **Read-only.** Production was only read: three `SELECT`-only queries against the prod Neon
> branch, `pnpm migrate:status:prod`, and HTTP `GET`s against the prod CMS REST API. No `INSERT`,
> `UPDATE`, `DELETE`, `seed`, `payload migrate`, admin edit, or deploy. Nothing in `content/` or
> `cms/src/migrations/` was changed. Measured **2026-08-11**.
>
> | | host (direct, non-pooled — the pooler hangs) |
> |---|---|
> | **production** | `ep-jolly-firefly-as96kap9.c-4.eu-central-1.aws.neon.tech` |
> | dev / preview | `ep-mute-wave-aszh37j6.c-4.eu-central-1.aws.neon.tech` |
>
> Both runs passed `dbGuard`'s rule (`DATABASE_URI` host == `DB_TARGET_HOST`), and the two hosts
> differ, so a mis-target would be visible here.

---

## Verdict

**The R23b-i backfill does not fit production as-is. Promoting today would abort the migration,
fail `ci:build`, and leave the promotion stuck.** One photograph the worksheet never described has
been added in the prod admin.

| | prod | dev | migration expects |
|---|---|---|---|
| image rows (`projects` with an `image_id`) | **58** | 57 | **57** — `EXPECTED.sourceRows` |
| distinct media | **41** | 40 | **40** — `EXPECTED.images` |

Two of the migration's pre-write assertions fail against prod:

```
✗ found 58 image rows, expected 57.                             (:214)
✗ fotografia-producto|1.jpg exists in the database
    but has no client cell in the worksheet.                    (:240)
```

Both fire before the first data write, so **no content is at risk** — the failure mode is a red
build and Vercel keeping the last good deployment, exactly the R8 shape RELEASE.md step 4 warns
about. This is a blocked promotion, not lost content.

**Prod migration status is otherwise clean:** `20260730_133159_baseline` **Ran: Yes**,
`20260730_192249_add_media_image_sizes` **Ran: Yes**, `20260811_114118_r23_clientes_images`
**Ran: No** — nothing was applied out of band.

## The one unaccounted-for row

| field | value |
|---|---|
| `projects.id` | **581** |
| `internal_title` | `Sesión producto` |
| `title.es` | `Sesiones privadas` |
| categoría | `fotografia-producto` (id 49) |
| media | id 71, **`1.jpg`**, 1200×1200 JPEG, uploaded **2026-08-03** |
| `placement` | **`both`** |
| `size` / `order` | `medium` / `1` |
| created | **2026-08-10 13:49 UTC** |

Three things make it unexpected, beyond simply being new:

1. **It is the only row in the database that uses `placement: 'both'`.** All 17 photographs that
   appear in two places are stored as *two* rows. That is why it adds one row rather than two, and
   why fotografía reads 13 images / 19 rows instead of 12 / 18.
2. **`order: 1` collides** with `croissant.png`, which holds order 1 in both the home and the page
   sequence of that categoría.
3. **`alt` and `categoryLabel` are empty** — it has a title but no alt text.

**14 more photographs are staged behind it.** `2.jpg` … `15.jpg` were uploaded to prod in the same
batch on 2026-08-03 and are not yet attached to any project. Placing any of them moves these counts
again, so **re-run this pre-flight immediately before promoting**, not once.

## Both directions

| direction | count | detail |
|---|---|---|
| in **prod**, not in the worksheet | **1** | `fotografia-producto\|1.jpg` |
| in the **worksheet**, not in prod | **0** | all 40 worksheet filenames are present |

Per-categoría, against the worksheet's 25 / 18 / 8 / 6 rows and 21 / 12 / 4 / 3 images:

| Categoría | imágenes | ambas | solo página | solo inicio | filas | expected |
|---|---|---|---|---|---|---|
| Branding Corporativo | 21 | 4 | 16 | 1 | 25 | 21 / 25 ✓ |
| Fotografía de Producto | **13** | 7 | 6 | 0 | **19** | 12 / 18 ✗ |
| Marketing 360° | 4 | 4 | 0 | 0 | 8 | 4 / 8 ✓ |
| Web y Apps | 3 | 3 | 0 | 0 | 6 | 3 / 6 ✓ |

Everything else the migration checks before writing passes on prod: no unknown categoría, no
unknown media, no duplicate page/home row for one photograph, group homogeneity holds per project,
and `fisio-equina.png`'s derived page order is still 4 and still free.

**The same script against dev returns 57 / 40 with every assertion passing.** The divergence is
production-only; R23b-i's repair of dev holds.

## R43 — the missing third data point

| file | prod vs committed | dev vs committed | prod vs dev | who is the outlier |
|---|---|---|---|---|
| `site.json` | 2 paths | 2 paths | **identical** | **committed** |
| `case-studies.json` | 39 paths | 39 paths | **identical** | **committed** |
| `pages.json` | 578 paths | 1106 paths | 623 paths | **all three differ** |
| `categories.json` | 45 paths | identical | 45 paths | **prod** |
| `sections/photography.json` | 1 path | identical | 1 path | **prod** |
| `ui.json` | 1 path | identical | 1 path | **prod** |

- **Brand name — prod and dev agree; committed is the stale one.** Both live databases hold
  `Oriana Cordero Obando`; only `content/site.json` still says `Asenat Cordero Obando`. **But the
  rename is unfinished in prod:** `ui.json`'s `en.nav.brand` is still `Asenat Cordero Obando`
  (`es` was changed, `en` was not), so the English nav shows the old name. A content decision, not
  a code one.
- **`case-studies.json` — prod and dev are byte-identical**; committed is stale by 39 paths.
- **`pages.json` — prod matches *committed's* structure and dev does not.** Home has **13 blocks in
  prod and in committed, but 8 on dev** — dev is missing all five `portfolioIntro` blocks. R43 read
  this as dev-vs-committed drift; the third data point shows dev is the odd one out structurally.
  Of the 578 prod-vs-committed paths, **530 are shared with dev** (mostly `*Visible` flags that
  post-date the committed snapshot). The remaining **48 are prod-only** and are real edits — the
  home hero title (`Diseño que conecta estrategia, creatividad y marca.`), subtitle, body and CTA.
- **`categories.json` / `photography.json` / `ui.json` — prod-only**, and all three trace to the
  same two prod edits: the new `1.jpg` row (which shifts the Vinte-Vinte sequence by one) and the
  categoría renamed to `Fotografía de Producto - Sesiones privadas`.

*Path counts are from a leaf-path flattening and are not comparable to R43's own numbers, which
used the exporter's differ. The three-way relationships are what matter here.*

## The owner's original question, answered from the live site

**Promoting cannot lose production content, and prod proves it rather than the code merely implying
it.** The deployed production bundle (`/assets/index-DXhnfjR3.js`) already contains
`Oriana Cordero Obando` ×3, `Fotografía de Producto - Sesiones privadas` ×3, and `/images/1.jpg` —
edits made in the prod admin on 2026-08-10, live now, having survived every deploy since. The site
rebuilds from the production CMS; committed `content/*.json` never reaches it.

## Side finding — not this task's to fix

**`placement: 'both'` is honoured by one exporter and silently dropped by the other.**
`categories.json` filters `placement === 'page' || placement === 'both'`
(`scripts/fetch-content.mjs:740-742`); `sections/*.json` filters on exact equality
(`:259-266`), so a `both` row appears in neither its home nor its page array. `1.jpg` is therefore
in `categories.json` (13 projects) and absent from `sections/photography.json` (still 6 home / 12
page), which is what `ProductPhotography.tsx` and `ProductPhotographyProjects.tsx` read. Pre-existing
and unrelated to R23b-i, but it lands directly on **R23b-ii's byte-identity proof**, which must
cover a `both` row if one still exists by then.

## What this does not do

No fix is proposed. Extending the worksheet needs the owner's client ruling for `1.jpg`, exactly as
R23a-ii established — and the answer also has to say what to do with the 14 staged uploads and with
the `both` placement. Prod was not edited, the worksheet was not extended, and the migration was not
adjusted.

## Reproducing

```
node --env-file=cms/.env.prod  /tmp/r45-preflight.mjs   # SELECT-only; replicates every
node --env-file=cms/.env       /tmp/r45-preflight.mjs   # pre-write assertion in the migration
pnpm --dir cms migrate:status:prod                      # read-only
node /tmp/r45-content-3way.mjs                          # GETs both CMS APIs, writes only to /tmp
```

Kept out of the repository on purpose — one-use, same convention as the worksheet's own §5 script.

**`export-content.ts` could not be used against prod from this branch, and that is expected.** It
boots Payload with *this branch's* config, whose `projects` query selects `cliente_id` and joins
`projects_images` — columns prod does not have until the migration runs. It failed at that query,
before touching anything. The substitutes above read the same rows the migration reads (direct
`SELECT`) and the same content the site build reads (`fetch-content.mjs`'s `main()` with
`contentDir` pointed at `/tmp` and `images: false`, against the deployed prod CMS's REST API).
