# R23 — Target content model for "a Proyecto is not a project" (Option A)

> **Status: design only.** No schema, no migration, no exporter change, no renderer change.
> Successor to [analysis-projects-vs-photos.md](analysis-projects-vs-photos.md) (**R23a**);
> the thing it is designed to make safe to execute is **R23b**. Its companion is
> [r23-backfill-mapping.md](r23-backfill-mapping.md) — the client worksheet the owner fills in.
>
> **All evidence below was measured offline from committed content and committed source on
> 2026-08-10.** No live CMS, no database, no network. Every claim carries a `path:line` or a
> command that reproduces it.

> ## ⚠️ Revised 2026-08-10 (R23a-ii) — the `Cliente` axis was missing
>
> **The owner reviewed R23a at the review gate and corrected the model. That is the gate
> working, not a failure.** R23a designed `Categoría → Proyecto → images[]` and stopped there.
> Wrong: **a client's work spans several categories**, so `Cliente` cannot sit under
> `Categoría` — they are different axes. The three owner decisions and the generative rule are
> **locked** ([roadmap.md:1528-1566](roadmap.md)); they are recorded in **§3.0** and are not
> re-litigated anywhere in this file.
>
> **What changed on 2026-08-10:**
>
> | § | Change |
> |---|---|
> | **3.0** | **New.** The locked model, the three owner decisions, the generative rule. |
> | **3.2** | The WodFest hedge is **deleted** — the rule settles it, and it settles it *for* image-level placement rather than against it. |
> | **3.5** | **New.** Decision 4 — the `Clientes` collection and the `cliente` relationship. |
> | **3.6** | The entity diagram, replacing R23a's two-level sketch. |
> | **4** | **New §4.1** — proof that `Cliente` reaches nothing the exporter emits. The six shapes are otherwise untouched. |
> | **5.1** | Migration surface: three new tables and two new columns, not two tables. |
> | **5.2** | Backfill is driven by the worksheet's `(cliente, categoría)` pairs, not by typed prefixes. |
> | **5.3 / 5.4** | The parent count is now an *output* of the worksheet; rollback drops in FK order. |
> | **7** | R23b-i is blocked on the **worksheet**, not on six questions — four are resolved. |
>
> **What did NOT change, and must not be redone:** §2 in full (the measured evidence),
> §3.1 (`group` stays, on the parent), §3.2's conclusion (placement stays on the *image*),
> §3.3 (`images[]` is an array field, not a second collection), §3.4's field table, §4's six
> shapes and the `group: 'any'` wrinkle, and the order-preservation rule (branding's published
> `id` **is** `p.order`; the gap at 4 is `fisio-equina`; never renumber).

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

**And one thing R23a itself got wrong, corrected by the owner on 2026-08-10:** the model needs
a **third** entity, `Cliente`, on an axis of its own — see §3.0. It does not disturb any of the
three findings above.

Recommendation: **do Option A, and split R23b in two** — see §7.

---

## 2. What the real data says

Reproduce the row inventory with the script in
[r23-backfill-mapping.md §5](r23-backfill-mapping.md#5-cómo-regenerar-el-inventario):
`node /tmp/r23-worksheet.mjs` → `ROWS: 57` (branding 25, fotografia-producto 18, marketing-360
8, web-apps 6) and `IMAGES: 40` (21 / 12 / 4 / 3).

*(R23a cited the same script printing `PROJECTS: 28   HOME-ONLY ROWS: 1`. That output is
**gone on purpose**: it was the prefix-grouping this task removes. The row and image counts
are unchanged and still reconcile — 17×2 + 22 + 1 = 57.)*

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

### 3.0 The locked model — settled by the owner, 2026-08-10

**These are not proposals and this file does not argue them.** They were chosen by the owner at
the R23a review gate and locked in [roadmap.md:1528-1566](roadmap.md). Everything below §3.0 is
design *under* them.

| # | Decision | What it rules out |
|---|---|---|
| **1** | **No product level.** A project holds images directly; the image title names the product. Vinte-Vinte's 7 views are **7 images in one project**, not a nested product entity. | A four-level `Cliente → Proyecto → Producto → imagen` hierarchy. Matches how the site renders — every image is a card. |
| **2** | **A project belongs to exactly one `Categoría`.** A client's branding work and their photography work are **separate projects**. | A project spanning two category pages. Keeps every project rendering on exactly one page, so the exporter and the public pages are unchanged. |
| **3** | **`Clientes` is a real collection, not a text field.** | The root cause. The bug is that grouping lives in a hand-typed string that drifts — `Ana Grace` vs `Ana Grace Salon & Estética` split one salon into two. A relationship cannot drift, and renaming a client becomes one edit. |

**The generative rule: one `Cliente` + one `Categoría` = one `Proyecto`** — the default, with
genuine exceptions allowed. It is not a constraint the schema enforces; it is the rule the
backfill applies and the rule an editor follows afterwards.

**The rule is load-bearing: it auto-resolves four of R23a's six open questions.** Ana Grace's
split prefix, WodFest, `Live Técnica Phicontour` and OFF DAY Trainer all collapse to *"same
client, same category, same project."* The two that survive are named in
[r23-backfill-mapping.md §4](r23-backfill-mapping.md#4-lo-que-la-regla-no-resuelve).

**Validated against the real data.** `OFF DAY Trainer` appears in **Branding** (2 images,
`sports`) *and* in **Web y Apps** (1 image) — one client, two categories, two projects. R23a
had filed that collision under *"no action needed"* (its §1.7); under the locked model it is
the case the model exists for. Reproduce:
`node /tmp/r23-worksheet.mjs --imgs | grep -i "off day"`.

**Why `Cliente` cannot live under `Categoría`** — the shape R23a assumed. A client with work in
two categories would need two client records, which is the same drift-prone duplication the
typed prefix already causes, one level up. The axes are independent: `Categoría` selects the
public page, `Cliente` names who the work was for, and `group` (§3.1) selects a layout slot.
**Three axes, three fields.**

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

**`group` is a third axis, distinct from `Cliente` as well as from `Categoría`** (added
2026-08-10). The same evidence proves both: `sports` holds WodFest, OFF DAY Trainer and SNAGA —
**three clients in one group** — while the six `adrianaMunoz` rows may well collapse to **one
client in one group**. A group is neither a client nor a project; it is a slot on a page.

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

*(**Settled 2026-08-10.** R23a hedged here, deferring to an owner ruling on whether WodFest is
one project or two. The generative rule answers it: `wodfest-1` and `wodfest-2` are **one
client, one categoría → one project with two images, both flagged `showOnHome`**. So case 1 is
now **confirmed** rather than conditional, and the locked model argues *for* image-level
placement rather than leaving it contingent. Case 2 — `fisio-equina` — never depended on the
ruling.)*

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

**What the duplication collapse is worth:** 57 rows → **40 image rows**. 17 of the 18 home rows
merge into the page row that already carries the same media; `fisio-equina` has no page twin
and stays as its own image row. Branding 25 → 21, photography 18 → 12, marketing 8 → 4,
web-apps 6 → 3. Reconciles as 17×2 + 22 + 1 = 57 (`node /tmp/r23-worksheet.mjs`).

**40 is fixed; the number of *parents* is not.** R23a said "across 29 projects". That was the
prefix-grouping's answer. Under the locked model the parent count is whatever the worksheet's
distinct `(cliente, categoría)` pairs come to — **≤ 29, because the rule only ever merges**
(§5.3). 40 is a property of the media and does not move.

### 3.3 Decision 3 — Payload shape: an `images[]` **array field** on the existing `projects`

**Decision: add an ordered `images[]` array field to the existing `projects` collection, and
promote that collection to the parent. Do not create a second collection.**

The tradeoff, stated plainly:

| | Array field on `projects` | Separate `project-images` collection |
|---|---|---|
| Editing a 7-view shoot | **one record** | seven records + a parent = eight |
| Admin surface | one list of projects | two lists; the images list has 40 unlabelled rows |
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
| **`cliente` relationship** | **new** | §3.5 — to `clients`, `hasMany: false`, optional |
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

### 3.5 Decision 4 — `Clientes`: a real collection, plus one relationship on `projects`

**Locked by the owner (§3.0 decision 3).** This section designs it; it does not argue it.

**The collection.** Modelled field-for-field on the house pattern in
[Categories.ts](../../cms/src/collections/Categories.ts) — Spanish `labels`, `admin.group:
'Portafolio'`, `useAsTitle`, and an `admin.description` on the collection *and* on every field.

| Field | Type | Notes |
|---|---|---|
| `name` | text, required, **not localized** | A client's name is language-agnostic, exactly like `studioName` at [Categories.ts:116](../../cms/src/collections/Categories.ts#L116). This is what keeps `clients_locales` out of the migration (§5.1). |
| `notes` | textarea, optional | Free notes for the owner. CMS-only, like every field here. |

```ts
labels: { singular: 'Cliente', plural: 'Clientes' },
admin: {
  useAsTitle: 'name',
  group: 'Portafolio',
  description: 'Las personas y marcas para las que se hizo el trabajo. Un cliente puede '
    + 'tener proyectos en varias categorías.',
  defaultColumns: ['name'],
},
```

**No `access.read: () => true`.** `Categories` and `Projects` both open read to the public
because the build fetches them over REST without auth
([Categories.ts:36-39](../../cms/src/collections/Categories.ts#L36-L39)). Nothing in the build
fetches clients. Leaving read auth'd (Payload's default when unset) is the **schema-level
statement that `Cliente` is CMS-only** — and it means a future exporter change cannot silently
start reading it without also changing access. §4.1.

**The relationship, on `projects`:**

```ts
{
  name: 'cliente',
  type: 'relationship',
  relationTo: 'clients',
  hasMany: false,          // decision 2: one project, one client
  // NOT required — the UX/UI case study has no client row, and a genuinely
  // client-less piece must stay representable.
  label: 'Cliente',
  admin: { description: '¿Para quién se hizo este trabajo? Un cliente puede tener '
    + 'proyectos en varias categorías; cada uno es un proyecto aparte.' },
}
```

`hasMany: false` with a single `relationTo` is what keeps this a plain FK column rather than a
`projects_rels` join table — the same shape `category` already has
([baseline.ts:357](../../cms/src/migrations/20260730_133159_baseline.ts#L357),
[:1764](../../cms/src/migrations/20260730_133159_baseline.ts#L1764),
[:2047](../../cms/src/migrations/20260730_133159_baseline.ts#L2047)). §5.1 depends on it.

**Optional, not required, and that is deliberate.** A `required` relationship would make the
backfill unable to land any row the worksheet leaves blank — turning a content gap into a
migration failure. §5.2 fails loudly on a blank *worksheet cell* instead, which is the check
that belongs in the migration; the schema stays permissive.

### 3.6 The resulting shape

```
Clientes                        (name, notes)                      ← CMS-only
   ▲
   │ cliente  (relationship, opcional, hasMany: false)
   │
Proyecto  ──── category ───▶  Categoría                            ← drives the public page
   │      (exactamente una, §3.0 decision 2)
   │      (type, group, internalTitle, slug, title, caseStudy…)
   │
   └── images[]   (image, alt, categoryLabel, order, size,
                   showOnPage, showOnHome, homeTitle, homeCategoryLabel)
```

Three axes, and none of them nests inside another: **`Categoría`** selects the public page,
**`Cliente`** names who the work was for, **`group`** selects a layout slot on the branding
page (§3.1). R23a's diagram had only the first.

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
(`roadmap.md` → *R23 acceptance criteria* — *"this is the whole safety argument — prove it,
don't assert it"*). `pixel-parity` then holds at 0.000% for free, because no renderer input
changed.

### 4.1 `Cliente` changes nothing the exporter emits — checked, not assumed

**Verdict: nil.** Adding the `clients` collection and the `cliente` relationship changes
**zero bytes** of `content/`. The roadmap asserts this
([roadmap.md:1553](roadmap.md) — *"`Cliente` is CMS-only and invisible to the exporter"*); this
section is the check, because an assumption here would invalidate the byte-identity gate that
the entire migration rests on. Four independent reasons, any one of which is sufficient:

| # | Reason | Evidence |
|---|---|---|
| 1 | **Neither twin ever fetches `clients`.** Between them they read exactly four collections — `media`, `categories`, `projects`, `pages` — plus globals. | [export-emit.ts:236, :275, :283, :432](../../cms/src/scripts/export-emit.ts#L236); [fetch-content.mjs:231, :247, :255, :381](../../scripts/fetch-content.mjs#L231) |
| 2 | **Every emitted card is an explicit object literal**, listing its keys by name. There is **no spread of a project doc** anywhere in either twin, so a new field cannot ride along. | `resolveGalleryCards` [export-emit.ts:311-328](../../cms/src/scripts/export-emit.ts#L311-L328), and the five other emit sites `:838-843`, `:867-871`, `:876-880`, `:893-896`, `:907-912` — each names its keys |
| 3 | **Projects are fetched at `depth: 0`**, so `cliente` would serialise as a bare integer id even if something read it. | `depth: 0` at [export-emit.ts:283](../../cms/src/scripts/export-emit.ts#L283) and [fetch-content.mjs:255](../../scripts/fetch-content.mjs#L255) |
| 4 | **The one deep fetch cannot reach it.** The REST twin loads `pages` at `depth: 2` — the only non-zero depth in either twin. `Pages`' sole relationship is to `categories` ([Pages.ts:206](../../cms/src/collections/Pages.ts#L206)), and `Categories` has **no** relationship fields at all, so the populate terminates one hop short of `projects`. | [fetch-content.mjs:381](../../scripts/fetch-content.mjs#L381); [Categories.ts:48-192](../../cms/src/collections/Categories.ts#L48-L192) |

Reproduce reason 1 and 2 together — no hit in either exporter:

```
grep -rni 'client\|cliente' cms/src/scripts/export-emit.ts cms/src/scripts/export-content.ts \
  scripts/fetch-content.mjs        # no output
```

*(The same grep over `content/` **does** hit — 18 times, all of them the Spanish word
`cliente` inside the UX/UI case study's prose, e.g. `content/sections/uxui-casestudy.json:42`
*"un cliente real"*. Prose, not structure. Flagged so a future reader does not mistake it for
a leak.)*

**Consequence for R23b:** the exporter work in R23b-ii is exactly what R23a specified — the six
shapes and the `group: 'any'` wrinkle. The `Cliente` axis adds **nothing** to it. Had this come
out the other way it would have been a significant finding and would have reopened §3.0
decision 2; it did not.

---

## 5. Migration and rollback plan

Per the locked **schema = migrations** decision (`push:false`, `pnpm migrate:create` → commit →
`ci:build` auto-applies; [roadmap.md:25-27](roadmap.md)). Format follows
`cms/src/migrations/20260730_192249_add_media_image_sizes.ts` — `up`/`down` with
`db.execute(sql\`…\`)` — and both must be registered in `cms/src/migrations/index.ts`.
**Written in R23b, not here.**

### 5.1 Shape of the change — three new tables, two new columns, all additive

**Revised 2026-08-10.** R23a's plan created two tables. The `Cliente` axis adds a third, plus
two columns — and, notably, **not** a fourth table.

`up` — additive only, nothing dropped, in one migration:

| # | Statement | Why this shape |
|---|---|---|
| 1 | `CREATE TABLE clients` (`id`, `name`, `notes`, `updated_at`, `created_at`) | §3.0 decision 3. **No `clients_locales`** — `name` is not localized (§3.5), so there is nothing to put in it. |
| 2 | `ALTER TABLE projects ADD COLUMN "cliente_id" integer` + FK to `clients(id)` `ON DELETE set null` + `CREATE INDEX projects_cliente_idx` | A single non-`hasMany` relationship is an FK column, not a join table. Mirrors `category_id` exactly — [baseline.ts:357](../../cms/src/migrations/20260730_133159_baseline.ts#L357), FK [:1764](../../cms/src/migrations/20260730_133159_baseline.ts#L1764), index [:2047](../../cms/src/migrations/20260730_133159_baseline.ts#L2047). |
| 3 | `ALTER TABLE payload_locked_documents_rels ADD COLUMN "clients_id" integer` + FK `ON DELETE cascade` | Payload keeps one `<collection>_id` column per collection on that table — [baseline.ts:1407-1417](../../cms/src/migrations/20260730_133159_baseline.ts#L1407-L1417). Easy to miss by hand; `migrate:create` generates it. |
| 4 | `CREATE TABLE projects_images` (Payload's array-field table: `_order`, `_parent_id`, `id`, plus the non-localized columns from §3.4) | unchanged from R23a |
| 5 | `CREATE TABLE projects_images_locales` (the four localized fields) | unchanged from R23a; mirrors how the baseline models `projects_locales` |

**Why one plus a relationship, and not two new tables.** The task framed this as a choice.
Steps 1–3 *are* "one table plus a relationship" — the relationship costs a column, not a table,
because of `hasMany: false` (§3.5). Making it `hasMany` would buy a `projects_rels` join table
and multi-client projects, which §3.0 decision 2 rules out. Step 3's column is not a choice at
all; Payload requires it.

`ALTER TABLE projects` drops nothing. The old `placement` / `image` / `alt` / `categoryLabel` /
`order` / `size` columns **stay in place**, unused, until a follow-up migration removes them
once byte-identity has been proved on `preview` *and* production.

> ## ⚠️ Superseded 2026-08-12 (R23b-iii) — the follow-up ran **before** production, not after
>
> The paragraph above, and §5.4's *"after it: `down` restores the schema but not the deleted
> rows"*, both assume the cleanup lands **after** the promotion. It did not. The owner locked
> **"promote complete work, never an intermediate state"** on 2026-08-12
> ([roadmap.md](roadmap.md)): a multi-step refactor lands entirely on `preview`, is reviewed
> there as a finished thing, and promotes in one release. Two things follow, and neither
> weakens the argument this section makes:
>
> | This section says | What R23b-iii did |
> |---|---|
> | wait for byte-identity on production | byte-identity on **preview**, on both twins, is the gate — production is migrated once, with everything in it |
> | the old columns are the fallback | **`RELEASE.md` step 2's Neon backup branch** is, and it restores *everything*, not six columns |
> | `down` cannot restore the deleted rows (§5.4) | it can, and does — `up` archives `projects` / `projects_locales` into `projects_pre_r23biii` / `projects_locales_pre_r23biii` first, and `down` re-inserts the rows with their original ids. Demonstrated: 21 → 58 → 21, fingerprints identical, export byte-identical after the cycle |
>
> **What did not change:** the ordering *constraint* this section exists to state. The
> destructive step is still a **separate migration**, still runs only after the exporters have
> been switched over and proved, and still asserts before it writes. It is one promotion later
> in the file and one promotion earlier in reality.

### 5.2 The backfill

A data migration, driven by the **owner-completed**
[r23-backfill-mapping.md](r23-backfill-mapping.md). **Revised 2026-08-10:** R23b no longer
parses proposed project names out of typed prefixes. It reads **one column** — the client the
owner wrote against each of the 40 images — and derives the projects from it.

**The gate.** R23b must **fail loudly** if *any* `CLIENTE` cell is still blank. R23a's
equivalent check was "no `Certeza` cell reads `AMBIGUO`"; blank is a stronger and simpler
signal, because it cannot be produced by accident. The worksheet gives the owner an explicit
`—` token meaning *"no client — its own project"*, so **blank always means "not answered"** and
can never be mistaken for an answer.

1. **Derive the projects.** Group the 40 images by the pair `(cliente, categoría)` — the
   generative rule (§3.0), applied mechanically. Each `—` image is its own project. Each
   distinct pair becomes one parent.
2. For each project: keep **one** existing `projects` row as the parent (the lowest-`order`
   page row), set `cliente_id`, set `group` from it, set `internalTitle` to the project name.
3. For each page row in the project: insert a `projects_images` entry carrying `image`, `alt`,
   `categoryLabel`, `order`, `size` verbatim, `showOnPage = true`.
4. For each home row: **merge into the image row with the same media**, setting
   `showOnHome = true`, `homeTitle` from the home row's `title` (branding: leave null — shape
   C has no title) and `homeCategoryLabel` from its `category` (branding: null). If no page
   row shares the media — `fisio-equina.png`, the single case — insert a new image row with
   `showOnHome = true, showOnPage = false` and its own `order`.
5. **Insert the `clients` rows** first, one per distinct client name across the whole
   worksheet — **not per category**. A client with work in two categories is **one** client row
   and two projects (§3.0 decision 2; `OFF DAY Trainer` is the live case).
6. Delete the now-redundant `projects` rows (the 18 home rows and the non-parent page rows).
   **This is the only destructive step**, and it runs against production, so it needs the
   Destructive Operations Protocol and `authorize db migration on production` typed by the
   human in-session — never assumed, never simulated.

**Expected result: 57 `projects` rows → N parents + 40 `projects_images` rows**, where **N is
computed from the committed worksheet, not predicted here** (§5.3). Emit all three numbers
before and after; any mismatch aborts.

### 5.3 Verification, in order

| # | Check | Pass condition |
|---|---|---|
| 0 | Every `CLIENTE` cell in the worksheet is filled (a name, or `—`) | 40 of 40 — **abort before touching the database** |
| 1 | Row counts before/after | 57 → **N** parents + **40** image rows, where N = distinct `(cliente, categoría)` pairs in the worksheet |
| 1b | `clients` rows | one per distinct client **name**, across all categories — fewer than N whenever a client has work in two categories |
| 2 | Both exporters re-run, `git diff --exit-code content/` | **no diff** — the whole safety argument |
| 3 | `pnpm test` incl. `twin-equivalence` | green |
| 4 | `pixel-parity` | **0.000%** |
| 5 | Branding ids in `sections/branding.json` | `1,2,3,5,…,21` — gap at 4 intact |
| 6 | Admin smoke: open `Set Regalo Vinte-Vinte` | **one** record, 7 images |
| 7 | Admin smoke: open the `OFF DAY Trainer` client | **two** projects, in two different categories |

**On check 1: the parent count is an output, not a target.** R23a wrote `57 → 29 + 40` and R23b
would have asserted 29. Under the locked model, 29 was the *prefix-grouping's* answer and the
rule can only ever produce **fewer** parents, never more — every merge the owner confirms
removes one. So N is computed from the completed worksheet at migration time and asserted
against the database; hard-coding 29 would turn a correct merge into a spurious abort. **40 is
a real constant** — it counts distinct media, which the grouping cannot change.

Run 1–5 on the Neon `dev` branch first. `dbGuard.ts` must pass (`DB_TARGET_HOST` matching
`DATABASE_URI`), use the **direct, non-pooled** endpoint for DDL, and **never `seed` prod**
([roadmap.md:28-31](roadmap.md)).

### 5.4 Rollback

**Revised 2026-08-10** for the two extra objects. `down` must drop in **FK order**, the exact
reverse of §5.1 — dropping `clients` before the two columns that reference it fails:

```
DROP TABLE projects_images_locales;
DROP TABLE projects_images;
ALTER TABLE payload_locked_documents_rels DROP COLUMN clients_id;   -- FK → clients
ALTER TABLE projects                      DROP COLUMN cliente_id;   -- FK → clients
DROP TABLE clients;                                                 -- last
```

- **Before the destructive step (5.2 step 6):** run `down`. The original 57 `projects` rows are
  untouched; nothing about the public site was ever read from the new objects.
- **After it:** `down` restores the schema but not the deleted rows. Recovery is a Neon
  point-in-time restore, so **step 6 must be a separate migration from steps 1–5**, applied
  only once check 2 has passed on production data. The intermediate state — old columns and
  new array both populated — is fully functional, because the exporter changes land with step
  6, not before.
  *(**Corrected 2026-08-12 by R23b-iii** — see the ⚠️ note in §5.1. `down` **does** restore the
  deleted rows: `up` archives both tables before deleting, and rolling back re-inserts every
  row with its original id. A Neon restore is the recovery path for the archive being gone, not
  for an ordinary rollback. "Step 6 is a separate migration" survives unchanged and is what
  R23b-iii is.)*
- **The one new loss, and why it is acceptable.** `down` now also destroys the `clients` rows
  and every `projects.cliente_id` — the only content in this whole migration that is *new
  data* rather than moved data, and therefore the only part not recoverable from the surviving
  `projects` rows. It does not need to be: **the completed worksheet is the durable source**,
  it is committed to `git`, and re-running step 5 of the backfill reconstructs `clients` and
  the assignments exactly. This is the practical reason the worksheet is a **committed
  document** and not a spreadsheet or a chat message.

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
4. **A third entity, added 2026-08-10 (§3.0).** `Clientes` is one more collection, one more
   FK column and one more admin list. It is the smallest of the four costs and it buys the
   root-cause fix: grouping stops living in a string that drifts. It costs the exporter
   **nothing** (§4.1).

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

**Blocked on the owner — restated 2026-08-10.** R23b-i must not start until the **client
worksheet** ([r23-backfill-mapping.md](r23-backfill-mapping.md)) comes back with all 40 cells
filled. R23a phrased this as "six open questions"; **four are resolved by the generative rule**
(§3.0) and the remaining two are named in
[§4 of the worksheet](r23-backfill-mapping.md#4-lo-que-la-regla-no-resuelve) — neither blocks
R23b-i:

- The **genuine-exception** case (one client, one categoría, but two projects) — answered
  inside the worksheet itself, per row.
- **`FisioEquina` home-only** — a content question. Image-level `showOnHome`/`showOnPage` is
  lossless either way (§3.2), so R23b-i can proceed whichever way it lands.

What does block it is the client column, and **it cannot be inferred**: `Croissant Artesanal`
and `Croissant Premium` carry no client marker at all yet are the same client as
`Crackers D'Argent`. R23a's prefix-grouping produced the wrong answer exactly there. Guessing
mid-migration is what this gate exists to prevent.

## 8. Explicitly out of scope

No schema, migration, exporter, renderer or content change was made by R23a **or by R23a-ii** —
this file and [r23-backfill-mapping.md](r23-backfill-mapping.md) are the entire output of both.
**Option B / project detail pages are R24** and are not designed here. The **page-builder
remains a locked non-goal**: this adds a *content* hierarchy, not layout editing — `group`
keeps selecting from the same four fixed layouts the renderers already hard-code (§2.3), and no
new layout choice is exposed to an editor. Adding `Clientes` does not change that: a client is
content, and it reaches no renderer at all (§4.1).
