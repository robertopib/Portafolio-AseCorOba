# R50 — Production pre-flight for the R23 promotion

> **Read-only.** `SELECT` only, plus `pnpm migrate:status:prod`. No `INSERT`/`UPDATE`/`DELETE`,
> no DDL, no `payload migrate`, no `seed`, no admin edit, no deploy. Nothing in `content/` or
> `cms/src/migrations/` changed. Measured **2026-08-12 13:30 UTC**.
>
> | | host (direct, non-pooled — the script refuses a `-pooler` host) |
> |---|---|
> | **production** | `ep-jolly-firefly-as96kap9.c-4.eu-central-1.aws.neon.tech` |
> | dev / preview | `ep-mute-wave-aszh37j6.c-4.eu-central-1.aws.neon.tech` |
>
> The two hosts differ, `dbGuard` passed on both runs (`DATABASE_URI` host == `DB_TARGET_HOST`),
> and neither URI carried `-pooler`. **Supersedes `r45-production-preflight.md`**, whose verdict
> (*"the backfill does not fit production"*) R49 has since resolved.

---

## Verdict — **GO**

**All three migrations would apply cleanly to production, and none of their pre-write assertions
fires.** The promotion takes production from **59 `projects` rows to 22** — 21 Proyecto parents
plus the UX/UI case study — deleting 37 rows whose photographs are all provably preserved.

| | production | dev (for contrast) |
|---|---|---|
| `projects` rows before | **59** (58 with an image + 1 case study) | 58 (57 + 1) |
| photographs | **41** | 40 |
| media rows | **57** | 44 |
| → parents after | **21** | 20 |
| → `projects_images` after | **41** | 40 |
| → `clients` after | **16** | 16 |
| → rows deleted | **37** | 37 |
| → **`projects` rows after** | **22** | 21 |

Production is one photograph — `1.jpg` — larger than dev at every step, and *deletes the same 37
rows*, because that photograph is both a new image and its own new parent. **Every number above
is derived from production's own rows**; none is carried over from dev.

`migrate:status:prod`, first run, no flakiness:

```
20260730_133159_baseline              1  Yes
20260730_192249_add_media_image_sizes 2  Yes
20260811_114118_r23_clientes_images      No
20260812_015822_r23_home_order_alt       No
20260812_111929_r23_drop_old_columns     No
```

Nothing was applied out of band. `clients` and `projects_images` do not exist on production yet.

---

## Migration 1 — `20260811_114118_r23_clientes_images` ✓

*Would every prod row reconcile against the worksheet? Is any media unknown?*

| | |
|---|---|
| photographs in the database | **41** |
| covered by the worksheet | **41** |
| in the database, **not** in the worksheet (**fatal**) | **0** |
| in the worksheet, not in the database (informational) | **0** |
| would create | **16 clients · 21 project parents · 41 `images[]` rows** |

**This is the R45 blocker, closed.** R45 aborted here on `fotografia-producto|1.jpg exists in the
database but has no client cell in the worksheet`. R49 added that row to the worksheet with the
owner's `—` (no client, its own project) and replaced the census with `reconcile()`; production
now reconciles exactly, in both directions, with nothing left over.

Every other pre-write assertion in the backfill passes on production:

- no row with an unknown categoría, no row pointing at unknown media;
- no photograph with two page rows or two home rows;
- group homogeneity holds for all 21 projects (`§3.1`);
- the one home-only photograph, `branding|fisio-equina.png`, derives **order 4** — the single
  offset in branding is still 1, and 4 is still free in the page sequence.

Per categoría, rows → photographs: branding 25 → 21, fotografía 19 → 13, marketing 8 → 4,
web y apps 6 → 3.

## Migration 2 — `20260812_015822_r23_home_order_alt` ✓

*Does the `homeOrder`/`homeAlt` backfill cover production's home rows?*

| | |
|---|---|
| images flagged `showOnHome` | **19** |
| of those, found exactly one surviving home row | **19** |
| orphans (flagged for home, no home row to read from) | **0** |
| photographs with more than one home row (the migration's own pre-check) | **0** |
| would carry a non-empty `home_alt` | **5** (branding) |
| would publish an empty home alt — the committed value | **14** |

**R23b-ii's prediction about `placement: 'both'` holds, and this is the first time it has been
checked against the row it was written for.** `1.jpg` (row #581, the only `both` row in either
database) is its own home row: the join finds **exactly one** match, `home_order` resolves to
**1**, and no special case is needed. It becomes its own parent, `showOnPage` **and**
`showOnHome` true, home card `{ es: title "Sesiones privadas", categoryLabel "", alt "" }`.

**The `order: 1` collision R45 found is real and is now deterministic, not resolved by luck.**
Within `fotografia-producto`, `croissant.png` and `1.jpg` both sit at order 1, on home and on
page. R23b-ii's `sortFlat` tiebreak (`scripts/fetch-content.mjs:190-197`) breaks it by parent
id: croissant.png's parent is **#535**, `1.jpg`'s is **#581**, so croissant.png sorts first, in
both emitters, every run. See *What production will look like* below for what that means on the
site.

## Migration 3 — `20260812_111929_r23_drop_old_columns` ✓ — the destructive one

*What exactly would `planCleanup()` delete on production?*

| | |
|---|---|
| `projects` rows read | **59** |
| parents (carry `images[]`) — never deletable | **21** |
| retained non-image rows | **1** — `#580`, the UX/UI case study |
| **doomed — the delete set** | **37** |
| `unsafe` (photograph not preserved in `images[]` — **would abort**) | **0** |
| parents in the delete set | **0** |
| case studies in the delete set | **0** |
| the delete would cascade into | **nothing** |
| columns still using the two enum types being dropped | **none beyond `projects.placement` / `projects.size`** |

The 37 doomed ids: `523, 524, 525, 529, 530, 531, 532, 533, 534, 536, 537, 538, 540, 541, 542,
543, 544, 545, 546, 547, 548, 549, 550, 555, 556, 557, 559, 561, 563, 566, 567, 568, 569, 570,
572, 573, 574`.

`#580` (case study) and `#581` (`1.jpg`) are **not** in it, and neither is any of the 21 parents.
The cascade check walks every table with a foreign key to `projects` — excluding
`projects_locales`, which the migration archives and restores, and
`payload_locked_documents_rels`, which is transient admin edit-lock state — and finds no child
row owned by a doomed id.

**37 on production and 37 on dev is a coincidence worth naming, not a check that passed.**
Production has one more row *and* one more parent than dev, and `58 − 21 = 57 − 20`. If the
count had been asserted rather than derived — R23a's mistake — it would have been right here by
accident and wrong the moment a staged upload is attached.

---

## What production will hold afterwards — derived

**22 `projects` rows: 21 parents + 1 case study.** 16 `clients`, 41 `projects_images`, 19 of them
on home. Every parent is an **existing** row that gains `cliente` and `images[]`; no `projects`
row is created.

| Categoría | Proyectos | imágenes | on home | on page |
|---|---|---|---|---|
| Branding Corporativo | 11 | 21 | 5 | 20 |
| Fotografía de Producto | **3** | 13 | 7 | 13 |
| Marketing 360° | 4 | 4 | 4 | 4 |
| Web y Apps | 3 | 3 | 3 | 3 |

Fotografía's three: `D'Argent` (#535, 4 images), `Todo en caja` (#539, 8), and `1.jpg` (#581, 1)
— the client-less project the worksheet's `—` produces. **R51 is what turns that `—` into a real
client**; until then production carries a Proyecto named `Sesión producto` with no cliente, which
is a legitimate state and not a migration failure.

### One visible change on the public site, and preview could not have shown it

**`1.jpg` will appear on the photography page and in the home photography preview, where today it
appears in neither.** This is not a regression — it is the row rendering as the owner configured
it — but it is a change to published production content, and **the owner's preview sign-off
cannot cover it because preview's database has no `1.jpg`**.

The mechanism is R45's side finding. The old emitter filtered sections on exact equality
(`placement === 'home'`), so a `both` row landed in neither array; the new one reads
`showOnHome` / `showOnPage` booleans (`scripts/fetch-content.mjs:232`), and `1.jpg` has both.
Committed `content/sections/photography.json` holds **6 home / 12 page** cards; production after
the promotion emits **7 / 13**, the extra card sorting immediately after `croissant.png` in both.
`categories.json` already counts it today (13 projects) — the `page || both` filter there always
let it through — so that file does not move.

The card publishes `title: "Sesiones privadas"` on home and an empty `alt`/`category` on both.
**Empty alt text on a live card is a content gap, not a code one** — R51's to fill.

## The 14 staged uploads are still unattached ✓

`2.jpg` … `15.jpg` (media ids 57–70, all uploaded 2026-08-03) are attached to **nothing**. None
has been placed since R45, so the counts above still describe production.

> **A trap worth recording, because the first run of the script fell into it.** Counting *every*
> foreign key into `media` reported only **13** unattached — `15.jpg` looked placed. It was not:
> the reference came from `payload_locked_documents_rels`, the admin's transient edit-lock table,
> which gets a row merely from **opening** a media document. `media_locales` is the same shape in
> reverse: every media row points at itself. The committed script now excludes both by name and
> counts only real attachments (`projects.image_id` today).

Two other media rows are unattached by foreign key and are **not** staged uploads:
`hero-background.jpg` (#26) and `uxui-sketch.png` (#40). Both are referenced by *path* rather
than by relationship (`content/home.json`, `content/case-studies.json`), so they are live, and
nothing in this promotion touches them.

---

## The script, and how it was checked

**`cms/src/scripts/r23-preflight.ts` is committed**, and it **imports** the two gates rather than
restating them — `reconcile()` from `cms/src/lib/r23/reconcile.ts` (migration 1's abort) and
`planCleanup()` from `cms/src/lib/r23/cleanup.ts` (migration 3's delete set). It cannot drift
from what the migrations do, which a `/tmp` copy of them does. Three things are still mirrored,
because they live inline in R23b-i's `up()` and extracting them would mean editing a committed
migration: the page/home slotting, the choice of which existing row becomes the parent
(`:342-343`), and `deriveHomeOnlyOrder` (`:91-111`). Each is cited line-for-line in the script.

**It has no default target.** `R23_PREFLIGHT_TARGET` must name the database, `dbGuard` must pass,
and a `-pooler` host is refused. Run with no environment, it does nothing.

**The mirrored projection was checked against a known outcome, not just reasoned about.**
R23b-iii leaves `projects_pre_r23biii` behind — dev's `projects` table exactly as it was before
the cleanup ran. Pointed at that archive, the script predicts **58 rows → 21 (20 parents + 1 case
study), 16 clients, 40 images, 37 deleted**, which is what R23b-iii actually produced on dev. The
projection reproduces a migration that has already happened, on a different-sized database.

```
cd cms

# production — read-only
R23_PREFLIGHT_TARGET=production \
  node --env-file=.env.prod node_modules/payload/bin.js run src/scripts/r23-preflight.ts

# self-check against dev's pre-cleanup archive
R23_PREFLIGHT_TARGET=dev R23_PREFLIGHT_SOURCE=archive \
  pnpm payload run src/scripts/r23-preflight.ts

pnpm migrate:status:prod                       # read-only
```

Exit code is 1 if any migration would abort, so it is usable as a gate. Full JSON lands in
`/tmp/r23-preflight.json` (`R23_PREFLIGHT_OUT` to move it), because stdout is unreliable under
`payload run`. Pointed at an already-migrated database in `live` mode it refuses to guess and
says so.

**Re-run it immediately before the promotion.** Attaching any one of the 14 staged uploads adds a
photograph the worksheet does not describe, and migration 1 would then abort — before its first
write, naming the file, exactly as it did for R45.

## What this does not do

No authorization phrase was requested, assumed or needed: reading production is not a deploy and
not a migration (R30, `RELEASE.md` step 3). `authorize db migration on production` and
`authorize production deploy` belong to the promotion and are the owner's to type. The Neon
backup branch (`RELEASE.md` step 2) is still outstanding and is the owner's click. Production was
not edited: `1.jpg` was not given a client, no staged upload was attached, and R43, R47, R51,
R52 and R53 were left alone.
