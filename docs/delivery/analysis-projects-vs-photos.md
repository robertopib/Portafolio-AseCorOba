# Analysis — "Proyecto" conflates a project, a photo, and a placement

> **Status: analysis only.** No code, no migration, no schema change. Written for the
> conductor to turn into one or more roadmap items. Raised by the owner 2026-08-04 while
> verifying R21. Evidence is from live `cms-preview` data, not inference.

---

## 1. The problem in one line

A portfolio's unit of work is a **project** that contains **many images**. In this CMS the
unit is a single **image card**, so a real project cannot be represented at all — it is
faked by repeating its name in a free-text field.

## 2. Evidence (live data, category 54 `fotografia-producto`)

`GET /api/projects?where[category][equals]=54` returns **18 Proyecto records** for **12
distinct images**. The 12 `placement: 'page'` records are:

```
order  0 | img  9 | Crackers D'Argent - Fotografía de Producto
order  1 | img 11 | Croissant Artesanal - Fotografía de Producto
order  2 | img  7 | Pan D'Argent - Fotografía de Producto
order  3 | img 10 | Croissant Premium - Packaging & Fotografía
order  4 | img 18 | Caja de Regalo Navideña - Packaging & Fotografía
order  5 | img 19 | Set Regalo Vinte-Vinte - Vista 1     ← one project,
order  6 | img 20 | Set Regalo Vinte-Vinte - Vista 2     ← seven records,
order  7 | img 21 | Set Regalo Vinte-Vinte - Vista 3     ← "project" exists
order  8 | img 25 | Set Regalo Vinte-Vinte - Vista 4     ← only as a string
order  9 | img 22 | Set Regalo Vinte-Vinte - Vista 5       prefix in
order 10 | img 23 | Set Regalo Vinte-Vinte - Vista 6       internalTitle
order 11 | img 24 | Set Regalo Vinte-Vinte - Vista 7
```

Two independent defects are visible here:

**(a) A project is a naming convention, not an entity.** "Set Regalo Vinte-Vinte" is one
photo shoot with 7 views. The only thing binding those 7 rows together is the human-typed
prefix in `internalTitle`. Nothing enforces it, nothing groups by it, and renaming the
project means editing 7 rows.

**(b) The same photo is duplicated per placement.** 18 records / 12 images: each photo
shown both on the home preview and on the category page exists **twice** — one row with
`placement: 'home'`, another with `placement: 'page'`, pointing at the same media ID
(e.g. img 9 appears as order 0 `page` *and* order 0 `home`). `placement` has a `'both'`
option ([Projects.ts:68-78](../../cms/src/collections/Projects.ts#L68-L78)), but the home
preview shows a different subset and order than the page, so the data was duplicated
instead. Fixing a photo's `alt` means remembering to fix it in two places.

So one row currently encodes three unrelated concerns: **which asset**, **which project it
belongs to**, and **where it appears**.

## 3. Why it looks like this (not an accident)

The CMS was reverse-engineered from committed JSON fixtures whose shape is a flat card
list. [photography.json](../../content/sections/photography.json) is literally
`page.projects[] = {image, alt, category}`, and
[ProductPhotographyProjects.tsx:10-15](../../src/app/pages/ProductPhotographyProjects.tsx#L10-L15)
maps that array straight into a lightbox grid. The collection mirrors the JSON, and the
JSON mirrors the original hard-coded design. `Projects` therefore models *the rendered
grid*, not the portfolio.

Two existing features are already workarounds for the missing "project" level:
- `group` — a free-text field whose only real use is branding's four sub-groups
  (`sports`, `adrianaMunoz`, `anaGrace`, `logos`), read by
  [export-content.ts:753](../../cms/src/scripts/export-content.ts#L753). This is a
  hand-rolled one-level grouping that a real parent entity would subsume.
- `type: 'caseStudy'` — the one Proyecto (of 58) that *is* a real project, with its own
  slug, detail page and inline body. It proves the model can host a real project; it just
  isn't available to the other 57.

## 4. What it costs today

- **Editing:** adding a 7-photo shoot means creating 7 (or 14, with a home preview)
  records and hand-typing a consistent prefix into each.
- **Integrity:** nothing prevents `Vista 8` from landing in the wrong category, or a
  typo'd prefix from silently splitting a project in two.
- **Duplication:** the home/page split doubles the rows and lets the two copies drift.
- **Capability ceiling:** because a project is not an entity, it can never have a title,
  description, client, year, cover image, or its own page — the things a portfolio visitor
  actually wants. Only the single case study has them.
- **This is also why R21 hurt so much:** with 57 image-cards each needing its own media
  pick, a broken media picker blocks nearly all content work.

## 5. Options

### Option A — CMS-only regrouping; public site stays pixel-identical (recommended first)

Introduce a real parent and make the exporter flatten back to today's JSON.

```
Categoría → Proyecto (real: title, cover, order, placement)
              └── images[]  (ordered rows: media + alt + size)
```

- `export-content.ts` flattens `Proyecto.images[]` back into the existing flat
  `projects[]` arrays, in the same order, producing **byte-identical**
  `content/sections/*.json`.
- Public renderers, and therefore the rendered site, do not change → `pixel-parity` stays
  **0.000%** and the locked design guarantee holds.
- `placement` moves to the parent, so the home/page duplication collapses. Where home and
  page genuinely need different subsets/orders, that becomes explicit parent fields rather
  than duplicate rows.
- `group` is retained as-is for branding to avoid widening scope.

**Cost:** a real migration (new table for the image rows, backfill 58 Proyectos → parents +
children, grouping photography's 7-view sets by their `internalTitle` prefix — needs a
one-off mapping the owner should eyeball). Also touches `export-content.ts` and
`fetch-content.mjs`, which **R13** already owns — sequence after or merge with R13.

**Payoff:** fixes the editing model and the duplication without touching the design.

### Option B — Full restructure with project detail pages

Category page shows project **covers**; each project gets `/proyectos/:cat/:slug` with its
gallery, reusing the case-study route pattern that already exists.

**Cost:** this is a deliberate **public redesign** — `pixel-parity` breaks *by intent*, so
the locked 0.000% invariant must be explicitly suspended for that PR and re-baselined. It
needs real design decisions (cover-grid layout, project-page template, what happens to the
lightbox) and is much larger. It also can't be validated by the existing gate, so it wants
R12's tests in place first.

**Payoff:** what the owner actually described as "how a portfolio works".

## 6. Recommendation

Do **A**, then decide on **B** separately.

A is invisible to visitors, guarded by the existing pixel gate, and removes the editing
pain and the duplication. B is a design project, not a data-model fix, and should be
scoped with the owner as a design decision once A has given it a sane model to render.

Sequencing note: A collides with **R13** (`export-content.ts` / `fetch-content.mjs`) and
wants **R12**'s content-resilience tests to exist first, since it rewrites the exporter
that produces every committed fixture. Suggested order: **R12 → R13 → A → (decide B)**.

## 7. Explicitly out of scope of this note

No schema, migration, exporter or renderer change was made. This is analysis only, per the
owner's instruction on 2026-08-04. The page-builder remains a locked non-goal — Option A
adds a *content* hierarchy, not layout editing.
