# R23 — Target content model for "a Proyecto is not a project" (Option A)

> **Status: design only.** No schema, no migration, no exporter change, no renderer change.
> Successor to [analysis-projects-vs-photos.md](analysis-projects-vs-photos.md) (**R23a**);
> the thing it is designed to make safe to execute is **R23b**. Its companion is
> [r23-backfill-mapping.md](r23-backfill-mapping.md) — the 57-row mapping the owner signs off.
>
> **All evidence below was measured offline from committed content and committed source on
> 2026-08-10.** No live CMS, no database, no network. Every claim carries a `path:line` or a
> command that reproduces it.

---

## 1. Verdict up front

**Option A survives contact with the real data, and the data argues for it more strongly than
the analysis did.** The site *already renders* a project level — it just does not store one
(§2.1). The parent entity is not an invention; it is the thing the home preview has been
faking all along.

**But Option A is materially bigger than the analysis and the roadmap scope it as**, in three
ways that were not visible from `sections/*.json` alone:

| | Scoped as | Actually |
|---|---|---|
| Output shapes | "three different shapes" | **six shapes across three files** — `sections/*.json` **plus** `content/categories.json` **plus** `content/pages.json` (§4) |
| Emitters to change | `export-content.ts` + `fetch-content.mjs` | the same six shapes, **twice** — both hand-maintained ~1,150-line twins, guarded by `tests/fidelity/twin-equivalence.test.ts` |
| `placement` | "moves to the parent" | **cannot** move to the parent — two rows disprove it (§3.2) |

Recommendation: **do Option A, and split R23b in two** — see §7.

---

## 2. What the real data says

Reproduce the row inventory with the script in
[r23-backfill-mapping.md §4](r23-backfill-mapping.md#4-how-to-regenerate-this-file):
`node /tmp/r23-map.mjs` → `ROWS: 57` (branding 25, fotografia-producto 18, marketing-360 8,
web-apps 6), `PROJECTS: 28   HOME-ONLY ROWS: 1`.

### 2.1 The home preview is already a project index — it just is not modelled

The analysis frames home/page as "the home preview shows a different subset and order than the
page, so the data was duplicated instead"
([analysis-projects-vs-photos.md:44-48](analysis-projects-vs-photos.md)). That is true but
undersells it. In `fotografia-producto`, the 6 home cards are **exactly the 6 projects you get
by grouping the 7 `Vista` rows**, in page order:

```
home[0] crackers.png            page[0]  Crackers D'Argent
home[1] croissant.png           page[1]  Croissant Artesanal
home[2] bread-dargent.png       page[2]  Pan D'Argent
home[3] croissant-packaging.png page[3]  Croissant Premium
home[4] gift-box-1.png          page[4]  Caja de Regalo Navideña
home[5] gift-box-vinte.png      page[5..11]  Set Regalo Vinte-Vinte, Vista 1..7
```

Same in `marketing-360` (4/4) and `web-apps` (3/3). **Home is one card per project.** This is
positive evidence for the parent entity: the missing level is already load-bearing in the
rendered site.

**The cover is not the first image.** The Vinte-Vinte home card uses `gift-box-vinte.png`,
which is page index **8** — `"Set Regalo Vinte-Vinte - Vista 4"`. A derived "first image"
cover would silently change the home page.

### 2.2 Home and page carry *different text for the same photograph*, transposed

| | `marketing-360` home[0] | `marketing-360` page[0] |
|---|---|---|
| shape | `{image, title, category}` | `{image, alt, category}` |
| text | `title: "Brochure Corporativo"` | `alt: "Brochure Corporativo - Grupo Santa Fe"` |
| label | `category: "Material Impreso - Grupo Santa Fe"` | `category: "Material Impreso"` |

The client name moves from the *label* on home to the *alt* on the page. Photography does the
same (`"Croissant Premium"` / `"Packaging & Fotografía"` on home vs
`"Croissant Premium - Packaging & Fotografía"` / `"Packaging"` on the page). These are **four
distinct strings per photo**, not one string shown twice. Collapsing the duplication therefore
means keeping all four, not deduplicating them away.

Branding is the exception: `home.images[].alt` is byte-identical to the matching
`page.*Projects[].alt`, and home carries no label at all.

### 2.3 `group` is a page **layout section**, not a project — the analysis is wrong here

The analysis calls `group` "a hand-rolled one-level grouping that a real parent entity would
subsume" ([analysis-projects-vs-photos.md:64-67](analysis-projects-vs-photos.md)). The data
says otherwise. `sports` holds **three unrelated clients**:

```
id 1,2   WodFest Costa Rica       id 10,11  OFF DAY Trainer      id 16  SNAGA Team Relay
```

and `logos` holds **five** clients with one logo each. A project parent does not subsume
`group`; they are different axes.

The renderers confirm it. `src/app/blocks/BrandingBlocks.tsx:152` reads
`branding.page.sportsProjects` and gives indices `[0]`, `[1]`, `[2]` bespoke hero slots with
`.slice(3)` falling through to a grid (`:234`). `adrianaMunozProjects` and `anaGraceProjects`
are **interleaved into one lightbox** at
[CategoryGalleryBlocks.tsx:295-313](../../src/app/blocks/CategoryGalleryBlocks.tsx#L295-L313),
with the index arithmetic `adrianaRestStart = 2 + anaGraceProjects.length`
([BrandingBlocks.tsx:298](../../src/app/blocks/BrandingBlocks.tsx#L298)). `group` selects a
**layout**. Both mechanisms stay. §3.1.

### 2.4 Branding's published `id` is `order`, and the sequence is shared across placements

`export-emit.ts:320` and `:908` emit `id: p.order`. Branding's page ids run **1–21 with 4
missing**, and the missing number is explained by the data: `fisio-equina.png` sits at home
position 4 and appears in **no** page array, so the page sequence steps over it.

That makes the gap a *derived* fact, not a magic number — which matters for the migration
(§5.2): merging the duplicate home/page rows into one image row reproduces `1,2,3,5,…,21`
**by construction**. It also means branding's `order` is one sequence spanning both
placements, which R23b must confirm against the live CMS before migrating — offline content
shows the consequence, not the stored values.

### 2.5 Nothing else about the rows is observable offline

`size`, `internalTitle` and the `order` values for the three non-branding categories never
reach any JSON (`if (p.size) card.size = p.size` at `export-emit.ts:326` /
`fetch-content.mjs:287` is the only `size` reference, and no committed file contains a `size`
key). They are CMS-organizational. R23b carries them across unchanged.

---

## 3. The target model

### 3.1 Decision 1 — `group`: keep it, move it to the parent, and rename what it *means*

**Decision: `group` stays, as a field on the parent, relabelled as a page section.**

The analysis's "retained as-is to avoid widening scope" would have left `group` on the image
row, giving two grouping mechanisms at the same level. Both alternatives to keeping it fail:

- *Subsume `group` into the project* — impossible: `sports` contains three projects (§2.3).
- *Leave `group` on the image row* — legal, but then two images of one project could sit in
  different page sections, which the renderers cannot express.

Every image of every proposed project shares one `group` in the data, so the parent is where
it belongs. The one change beyond moving it is honesty in the admin UI:
`cms/src/collections/Projects.ts:84-87` currently says *"Solo para Branding: subgrupo (sports,
adrianaMunoz, anaGrace, logos)"*. It is a **page section**, and calling it a subgroup is what
invited the analysis to read it as a proto-project. R23b should say
*"Solo para Branding: en qué sección de la página aparece este proyecto."*

Not overridable by this decision: `group` remains free text with the same four values, so
`projByKey`'s `(group ? p.group === group : !p.group)` filter
([export-emit.ts:287-294](../../cms/src/scripts/export-emit.ts#L287-L294)) keeps working
unchanged for the non-branding categories, which have no group.

### 3.2 Decision 2 — home vs page: placement stays on the **image**, not the parent

**Decision: replace the `placement` select with two booleans on the image row —
`showOnHome` / `showOnPage` — plus image-level `homeTitle` and `homeCategoryLabel`. No
`homeOrder`, no parent `placement`, and no parent `cover`.**

This contradicts the analysis and the roadmap scope line (*"`placement` moves to the parent,
so the home/page duplication collapses"*). **Two rows disprove parent-level placement:**

1. **`WodFest Costa Rica` puts two cards on home.** `branding.home.images[0]` and `[1]` are
   `wodfest-1.png` and `wodfest-2.png` — both images of one proposed project. A parent-level
   "show on home" can express "this project appears on home", not "these two of its images
   do".
2. **`fisio-equina.png` is on home and in no page array at all.** A parent whose placement is
   `home` would have to own an image that the page arrays must not see — which is exactly an
   image-level flag, wearing a parent's clothes.

*(If the owner rules in [r23-backfill-mapping.md §1.2](r23-backfill-mapping.md#12--wodfest-costa-rica--one-project-or-two-this-one-changes-the-schema)
that WodFest is two projects, case 1 disappears. Case 2 does not, and the image-level flag is
lossless either way — which is why this design does not wait on that answer.)*

**Why no `homeOrder`.** Home order equals page order in all four categories (§2.1), and
branding's single `order` sequence spans both placements (§2.4). Sorting the flattened image
rows by their own `order` — precisely what `byOrder(projByKey(...))` does today at
`export-emit.ts:286` — reproduces every array. Adding a second ordering field would create a
way for the two to disagree, with nothing to reconcile them.

**Why no parent `cover`.** The analysis proposes `Proyecto(title, cover, order, placement)`.
Under image-level placement, the home-flagged image **is** the cover, and adding a second
field pointing at the same media invites the two to drift — the exact defect being removed. A
real `cover` becomes worth having in **R24**, when a project needs a cover independent of what
the home preview shows; adding it now is unused schema. Recorded here so R24 does not have to
rediscover it.

**What the duplication collapse is worth:** 57 rows → **40 image rows** across 29 projects.
17 of the 18 home rows merge into the page row that already carries the same media;
`fisio-equina` has no page twin and stays as its own image row. Photography 18 → 12,
branding 25 → 21, marketing 8 → 4, web-apps 6 → 3.

### 3.3 Decision 3 — Payload shape: an `images[]` **array field** on the existing `projects`

**Decision: add an ordered `images[]` array field to the existing `projects` collection, and
promote that collection to the parent. Do not create a second collection.**

The tradeoff, stated plainly:

| | Array field on `projects` | Separate `project-images` collection |
|---|---|---|
| Editing a 7-view shoot | **one record** | seven records + a parent = eight |
| Admin surface | one list of 29 projects | two lists; images list has 40 unlabelled rows |
| Referenceable by ID | no | yes |
| Migration | rows → `projects_images` array table, one `INSERT … SELECT` | new collection + relationship + join table |

The acceptance criterion R23 is judged against is *"the 7-view shoot is ONE editable record"*
(`roadmap.md` → *R23 acceptance criteria*, `:1558`). A separate collection re-creates seven
records and splits editing across two admin lists — it restates the problem in tidier language. The single thing
a collection buys that an array cannot, a referenceable cover, is not needed (§3.2).

**Reuse `projects` as the parent rather than adding a third level.** `type: 'caseStudy'`, the
`Categorías → Proyectos` relationship, the `caseStudy` group and `caseStudyBodyField()` all
stay exactly where they are; the case study becomes a project with an empty `images[]`, which
is what it already is conceptually — *"the one Proyecto of 58 that IS a real project"*. A new
top collection would require re-pointing `Categories`, the `CategoryGallery` blocks and
`pages.json` resolution for no gain.

### 3.4 The resulting schema

Checked field-by-field against
[cms/src/collections/Projects.ts](../../cms/src/collections/Projects.ts) (not against the
analysis).

**Stays on `projects` (the parent):**

| Field | Change | Note |
|---|---|---|
| `category` relationship (`:42-51`) | none | |
| `type` select (`:52-65`) | none | `image` \| `caseStudy` |
| `group` text (`:80-88`) | **description rewritten** | §3.1 — "sección de la página" |
| `internalTitle` (`:123-130`) | becomes the project name | admin-only, as today |
| `slug` (`:131-141`), `title` (`:142-147`) | none | |
| `caseStudy` group (`:177-502`), `caseStudyBodyField()` (`:171`) | none | |
| ~~`placement`~~ (`:66-79`) | **moves down** | §3.2 |
| ~~`image`~~ (`:104-112`), ~~`alt`~~ (`:148-153`), ~~`categoryLabel`~~ (`:154-162`), ~~`order`~~ (`:113-122`), ~~`size`~~ (`:89-103`) | **move down** | |

**New `images[]` array on `projects`**, one entry per photograph:

| Field | Type | Purpose |
|---|---|---|
| `image` | `upload` → `media` | the asset |
| `alt` | text, localized | the page card's alt (shape B/D/E/F) |
| `categoryLabel` | text, localized | the page card's small label |
| `order` | number, required | sorts within the category; **is** branding's published `id` (§2.4) |
| `size` | select | masonry token, CMS-only (§2.5) |
| `showOnPage` | checkbox | in the category-page arrays |
| `showOnHome` | checkbox | in the home preview |
| `homeTitle` | text, localized | home card text — **different** from `alt` (§2.2) |
| `homeCategoryLabel` | text, localized | home card label — **different** from `categoryLabel` (§2.2) |

Spanish `admin.description` on every field, per the `Categories.ts` house pattern
([Categories.ts:26-27](../../cms/src/collections/Categories.ts#L26-L27), [:55](../../cms/src/collections/Categories.ts#L55)).
`homeTitle` / `homeCategoryLabel` get `admin.condition: (_, sibling) => sibling?.showOnHome`
so they only appear when they apply.

```
Categoría
  └── Proyecto            (category, type, group, internalTitle, slug, title, caseStudy…)
        └── images[]      (image, alt, categoryLabel, order, size,
                           showOnPage, showOnHome, homeTitle, homeCategoryLabel)
```

---

## 4. What byte-identical output requires

The same 57 rows are re-emitted **153 times, in six shapes, across three files**. Reproduce
the counts:

```
node -e 'const d=require("./content/pages.json");let n=0;(function w(o){if(Array.isArray(o))return o.forEach(w);
if(o&&typeof o==="object"){if(o.id!==undefined&&o.src)n++;Object.values(o).forEach(w)}})(d);console.log(n)'   # 57
node -e 'const d=require("./content/categories.json");let n=0;(function w(o){if(Array.isArray(o))return o.forEach(w);
if(o&&typeof o==="object"){if(o.image)n++;Object.values(o).forEach(w)}})(d);console.log(n)'                   # 39
```

| # | File | Key | Item shape | Cards | Emitter |
|---|---|---|---|---|---|
| A | `sections/{photography,marketing-360,web-apps}.json` | `home.projects[]` | `{image, title, category}` | 13 | `export-emit.ts:867-871` |
| B | ″ | `page.projects[]` | `{image, alt, category}` | 19 | `:876-880` |
| C | `sections/branding.json` | `home.images[]` | `{src, alt}` | 5 | `:893-896` |
| D | ″ | `page.{sports,adrianaMunoz,anaGrace,logo}Projects[]` | `{id, src, alt, category}` | 20 | `:907-912` |
| E | `content/categories.json` | `categories[].projects[]` | `{image, alt, category, group}` | 39 | `:838-843` |
| F | `content/pages.json` | `CategoryGallery` block cards | `{id, src, alt, category, title?, size?, group?}` | 57 | `resolveGalleryCards`, `:302-328` |

Each also exists in the REST twin: `scripts/fetch-content.mjs:259` (`projByKey`), `:268`
(`resolveGalleryCards`), `:281` (`id: p.order`), `:770-771`. `tests/fidelity/twin-equivalence.test.ts`
compares the two **as bytes**, so a change to one and not the other fails CI.

**What R23b must emit, per shape.** All six read the *same* flattened list, so the exporter
change is one function, applied six times:

```
flatten(slug, group, home) =            // group: a name | null (ungrouped only) | 'any'
    projects.filter(p => p.category.slug === slug && p.type === 'image'
                      && (group === 'any' || (group ? p.group === group : !p.group)))
            .flatMap(p => p.images)
            .filter(i => home ? i.showOnHome : i.showOnPage)
            .sort((a, b) => a.order - b.order)
```

- **`group: 'any'` is new, and shape C needs it.** Today
  `projByKey('branding', 'home')` matches `!p.group`
  ([export-emit.ts:287-294](../../cms/src/scripts/export-emit.ts#L287-L294)) and works because
  branding's *home* rows carry no group. After the migration those images hang off **grouped**
  parents (`wodfest-1.png` belongs to a `sports` project), so the existing filter would return
  nothing and `home.images[]` would silently emit `[]`. Both twins need the third mode.
- **Sort by the image row's own `order`, globally within the filtered set** — not
  project-then-image. In today's data the two agree, because projects happen to be contiguous
  in `order` within each group (§2.4); relying on that coincidence would break the first time
  the owner reorders. This is the same rule `byOrder` applies today
  ([export-emit.ts:286](../../cms/src/scripts/export-emit.ts#L286)), so the ordering code does
  not change — only where the rows come from.
- **A** uses `homeTitle` / `homeCategoryLabel`; **B/D/E/F** use `alt` / `categoryLabel`. This
  is the one place shape A differs and it is easy to get wrong (§2.2).
- **C** emits `{src, alt}` only, with `home: true` and **no** `group` filter — branding home
  images carry no group and `fisio-equina` belongs to a project that has no page rows.
- **D** emits `id: order`. Preserve `order` verbatim in the migration and the `1,2,3,5,…,21`
  sequence falls out (§2.4). Do **not** renumber.
- **E** filters `showOnPage` across all four branding groups at once, and re-emits
  `group: p.group ?? null` — `group` is now read from the **parent**.
- **F** keeps its conditional keys: `title` only when non-empty (13 cards), `size` only when
  set (0 cards today), `group` only when set (20 cards). Key *presence* is a byte difference.

**The gate that proves it.** After the migration, run both exporters and
`git diff --exit-code content/` — zero diff is the whole safety argument
(`roadmap.md:1560` — *"this is the whole safety argument — prove it, don't assert it"*).
`pixel-parity` then holds at 0.000% for free, because no renderer input changed.

---

## 5. Migration and rollback plan

Per the locked **schema = migrations** decision (`push:false`, `pnpm migrate:create` → commit →
`ci:build` auto-applies; [roadmap.md:25-27](roadmap.md)). Format follows
`cms/src/migrations/20260730_192249_add_media_image_sizes.ts` — `up`/`down` with
`db.execute(sql\`…\`)` — and both must be registered in `cms/src/migrations/index.ts`.
**Written in R23b, not here.**

### 5.1 Shape of the change

`up` — additive only, in one migration:

1. `CREATE TABLE projects_images` (Payload's array-field table: `_order`, `_parent_id`, `id`,
   plus the nine columns from §3.4) and `projects_images_locales` for the four localized
   fields, mirroring how the baseline models `projects_locales`.
2. `ALTER TABLE projects` — nothing dropped. The old `placement` / `image` / `alt` /
   `categoryLabel` / `order` / `size` columns **stay in place**, unused, until a follow-up
   migration removes them once byte-identity has been proved on `preview` *and* production.

`down` — `DROP TABLE projects_images_locales, projects_images`. Nothing else, because nothing
else was destructive. **This is what makes the change reversible**, and it is the reason for
the two-migration split rather than a single drop-and-move.

### 5.2 The backfill

A data migration, driven by the **owner-approved**
[r23-backfill-mapping.md](r23-backfill-mapping.md) — R23b parses the §3 tables, and must
**fail loudly** if any `Certeza` cell still reads `AMBIGUO` or any §5 ruling is still
`pendiente`.

1. For each of the 29 approved projects: keep **one** existing `projects` row as the parent
   (the lowest-`order` page row), set `group` from it, set `internalTitle` to the project name.
2. For each page row in the project: insert a `projects_images` entry carrying `image`, `alt`,
   `categoryLabel`, `order`, `size` verbatim, `showOnPage = true`.
3. For each home row: **merge into the image row with the same media**, setting
   `showOnHome = true`, `homeTitle` from the home row's `title` (branding: leave null — shape
   C has no title) and `homeCategoryLabel` from its `category` (branding: null). If no page
   row shares the media — `fisio-equina.png`, the single case — insert a new image row with
   `showOnHome = true, showOnPage = false` and its own `order`.
4. Delete the now-redundant `projects` rows (the 18 home rows and the non-parent page rows).
   **This is the only destructive step**, and it runs against production, so it needs the
   Destructive Operations Protocol and `authorize db migration on production` typed by the
   human in-session — never assumed, never simulated.

**Expected result: 57 `projects` rows → 29 parents + 40 `projects_images` rows.** State both
numbers before and after; a mismatch aborts.

### 5.3 Verification, in order

| # | Check | Pass condition |
|---|---|---|
| 1 | Row counts before/after | 57 → 29 + 40 |
| 2 | Both exporters re-run, `git diff --exit-code content/` | **no diff** — the whole safety argument |
| 3 | `pnpm test` incl. `twin-equivalence` | green |
| 4 | `pixel-parity` | **0.000%** |
| 5 | Branding ids in `sections/branding.json` | `1,2,3,5,…,21` — gap at 4 intact |
| 6 | Admin smoke: open `Set Regalo Vinte-Vinte` | **one** record, 7 images |

Run 1–5 on the Neon `dev` branch first. `dbGuard.ts` must pass (`DB_TARGET_HOST` matching
`DATABASE_URI`), use the **direct, non-pooled** endpoint for DDL, and **never `seed` prod**
([roadmap.md:28-31](roadmap.md)).

### 5.4 Rollback

- **Before the destructive step (5.2 step 4):** run the migration's `down`. The original 57
  rows are untouched; nothing is lost.
- **After it:** `down` restores the schema but not the deleted rows. Recovery is a Neon
  point-in-time restore, so **step 4 must be a separate migration from steps 1–3**, applied
  only once check 2 has passed on production data. The intermediate state — old columns and
  new array both populated — is fully functional, because the exporter changes land with step
  4, not before.

---

## 6. Does Option A still look right?

**Yes — and the data strengthens the case.** §2.1 is the finding: the home preview is already
a project index, so the parent is not a speculative abstraction. Every argument in the
analysis holds: the public site cannot change (guarded by check 2 then `pixel-parity`), the
editing model gets the record the owner actually works with, and 18 duplicate rows disappear.

**Three costs the analysis did not have:**

1. **Six shapes across three files, times two twins** — twelve emit sites, not two. Mitigated
   by §4's single `flatten()`: the ordering rule does not change, only the row source. Still,
   `pages.json` and `categories.json` were not in scope and each has a conditional-key
   contract (`title?`, `size?`, `group?`) where a missing key is a byte difference.
2. **Legacy `id` numbers.** Byte-identity requires `1,2,3,5,…,21` including the gap. §2.4
   shows the merge reproduces it by construction — but only if `order` is preserved verbatim
   and branding's shared home/page sequence is confirmed against the live CMS first.
3. **The parent is thinner and the child fatter than sketched.** `placement` and `cover` do
   *not* move up (§3.2); four localized text fields move *down*. The analysis's
   `Proyecto(title, cover, order, placement) → images[] (media + alt + size)` would have lost
   `homeTitle`, `homeCategoryLabel` and `categoryLabel`, and could not represent `WodFest` or
   `fisio-equina` at all.

None of this argues for Option B instead. Option B (**R24**) is a public redesign that breaks
the pixel gate by intent and still wants this model underneath it.

## 7. Recommendation for the conductor

**Split R23b in two**, so the irreversible step is verified before the large one begins:

- **R23b-i — schema + backfill, exporters untouched.** Migration 1 (additive), backfill steps
  1–3, both exporters still reading the *old* columns. Proves the data landed correctly with
  `git diff --exit-code content/` against unchanged emitter code — a clean signal, because
  only one thing changed. Fully reversible via `down`.
- **R23b-ii — exporter flattening + byte-identity proof + cleanup.** The six shapes in both
  twins, then migration 2 dropping the old columns and the redundant rows.

**Blocked on the owner.** R23b-i must not start until the six questions in
[r23-backfill-mapping.md §1](r23-backfill-mapping.md#1-read-this-first--the-groupings-that-are-guesses)
are answered. §1.2 (WodFest) is the only one that touches the schema, and §3.2 is written to
be lossless either way — but the groupings themselves are content judgements, and inferring
them mid-migration is what this task exists to prevent.

## 8. Explicitly out of scope

No schema, migration, exporter, renderer or content change was made by R23a — this file and
[r23-backfill-mapping.md](r23-backfill-mapping.md) are the entire output. **Option B / project
detail pages are R24** and are not designed here. The **page-builder remains a locked
non-goal**: this adds a *content* hierarchy, not layout editing — `group` keeps selecting from
the same four fixed layouts the renderers already hard-code (§2.3), and no new layout choice
is exposed to an editor.
