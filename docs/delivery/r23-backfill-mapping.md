# R23 — Backfill mapping: which image belongs to which project

> **Status: for owner review. Nothing has been changed.** This file is the human decision
> gate that **R23a** exists to produce and **R23b** will execute. Design rationale lives in
> [r23-target-model.md](r23-target-model.md); the original problem statement is
> [analysis-projects-vs-photos.md](analysis-projects-vs-photos.md).
>
> **Generated from committed content on 2026-08-10** — see [§4](#4-how-to-regenerate-this-file)
> for the exact script. **Not hand-typed**, and reproducible.
>
> **How to review:** read [§1](#1-read-this-first--the-groupings-that-are-guesses) — the
> guesses — then skim the tables in [§3](#3-the-full-mapping--all-57-rows). To correct
> anything, **edit this file directly**: it is the source of truth R23b reads. You do not need
> to read any code.

---

## 0. What this is

Today one *Proyecto* record in the CMS = **one image card**. A real project — a photo shoot
with seven views, a client with four social posts — is not stored anywhere. It exists only as
a **prefix someone typed by hand** into each row's text: `"Set Regalo Vinte-Vinte - Vista 1"`
… `"Vista 7"`.

R23 introduces the missing level: **Proyecto → imágenes[]**. To do that, every existing row
has to be told which project it joins. **That is a content judgement, not a technical one**,
so this file proposes an answer for all 57 rows and asks you to confirm or correct it.

**The proposal in one line:** group rows by the text before the first `" - "`.

**57 rows → 29 projects.** Reconciles exactly with the expected count:

| Categoría | inicio | página | filas | proyectos propuestos |
|---|---|---|---|---|
| Branding Corporativo | 5 | 20 | **25** | 16 |
| Fotografía de Producto | 6 | 12 | **18** | 6 |
| Marketing 360° | 4 | 4 | **8** | 4 |
| Web y Apps | 3 | 3 | **6** | 3 |
| **Total** | **18** | **39** | **57** ✓ | **29** |

*(The 58th Proyecto in the CMS is the UX/UI case study. It has no image row, is already a real
project, and is not touched by this mapping.)*

---

## 1. Read this first — the groupings that are guesses

**Every grouping in this document is inferred from a typed string.** None is certain. These
are the ones where the guess could plausibly be wrong, worst first.

### 1.1 ⚠⚠ `Ana Grace` vs `Ana Grace Salon & Estética` — almost certainly one client, split in two

| Filas | Prefijo tecleado |
|---|---|
| 1 (`ana-grace.png`) | `Ana Grace Salon & Estética - Branding digital` |
| 3 (`ana-grace-hair`, `ana-grace-online`, `ana-grace-payment`) | `Ana Grace - …` |

The prefix drifted, so a mechanical grouping produces **two projects for what looks like one
salon**. This is precisely the failure the roadmap predicted ("a typo'd prefix silently splits
a project"). *Proposed: leave them split, because merging them is your call.*
**→ Merge into one 4-image project, or keep as two?**

### 1.2 ⚠⚠ `WodFest Costa Rica` — one project or two? *(this one changes the schema)*

Two images, **different labels** (`Campaña Publicitaria` / `Diseño de Marca`), and **both
appear separately on the home page**.

This is the only case in the whole portfolio where one proposed project puts **two cards on
the home preview**. Everywhere else, home shows exactly one card per project. If WodFest is
**two** projects, that rule holds without exception; if it is **one**, the CMS needs
"show on home" to sit on each image rather than on the project.
[r23-target-model.md §3.2](r23-target-model.md#32-decision-2--home-vs-page-placement-stays-on-the-image-not-the-parent) is written to
handle both, so either answer is fine — but say which.
**→ Two projects (campaign, brand design), or one with two images?**

### 1.3 ⚠ `Adriana Muñoz` appears as a prefix *and* as a suffix

`Adriana Muñoz - Contenido para redes sociales` (a project named after her) but also
`Live Técnica Phicontour - Adriana Muñoz` (her name as the *suffix*). Mechanically these are
two projects. If the whole `adrianaMunoz` group is really **one client's body of work**, the
grouping should be different.
**→ Is `Live Técnica Phicontour` its own project, or part of Adriana Muñoz's?**

### 1.4 ⚠ Multi-image groupings that look right but are still prefix guesses

| Proyecto propuesto | Imágenes | Confianza |
|---|---|---|
| `Set Regalo Vinte-Vinte` | 7 (`Vista 1`…`Vista 7`) | **Alta** — numbered views, unambiguous |
| `OFF DAY Trainer` (branding) | 2 (Deadlift, Pull-ups) | Media |
| `Curso Phibrows` | 2 (Material Promocional, Antes y Después) | Media |
| `Ana Grace` | 3 | see [§1.1](#11--ana-grace-vs-ana-grace-salon--estética--almost-certainly-one-client-split-in-two) |

### 1.5 ⚠ The 23 single-image projects are a *default*, not a finding

23 of the 29 proposed projects have exactly one image (all 5 logos, the 4 Marketing pieces,
the 3 Web y Apps pieces, 5 of the Fotografía pieces, and 6 more in Branding). Nothing in the
data says whether `Crackers D'Argent` is a finished one-photo project or the first photo of a
shoot that will grow. **Proposed uniformly: a one-image project.** It costs nothing and lets
you add images later without restructuring.
**→ Fine as a default, or should any of these merge?**

### 1.6 ⚠ `FisioEquina` is on the home page and nowhere else

`fisio-equina.png` appears in `branding.home.images[]` but in **none** of the four page
arrays. It is not an error in this mapping — it is genuinely how the site is built today.
It becomes a project with one image that is shown on home and not on the category page.
**→ Intended, or should it also appear on the Branding page?**

### 1.7 Two names collide across categories — no action needed

`OFF DAY Trainer` exists in **Branding** (2 images) and in **Web y Apps** (1 image). They stay
separate because projects belong to a category. Flagged only so it does not look like a bug.

---

## 2. What this mapping does *not* decide

- **Project names.** The proposed name is the typed prefix, warts and all
  (`Ana Grace Salon & Estética`). Rename freely — the name is new data and changing it cannot
  break the site.
- **Order.** Every row keeps its current position exactly. Reordering is a separate,
  later, safe edit.
- **Anything visible.** R23b's acceptance criterion is that `content/*.json` comes out
  **byte-identical**, so the public site does not change by a single pixel.
- **Three CMS-only fields** — `size`, `internalTitle`, and the `order` numbers for the
  non-Branding categories — are not visible in committed content and so are not listed here.
  R23b carries them across unchanged; they affect nothing in this decision.

---

## 3. The full mapping — all 57 rows

**Reading the tables.** One block per proposed project. `page` rows are the images on the
category page, in order; `inicio` rows are the cards on the home preview. The `id` column is
Branding's published card number, which must survive the migration unchanged (see
[r23-target-model.md §4](r23-target-model.md#4-what-byte-identical-output-requires)).

**Certeza:**

| Valor | Significado |
|---|---|
| `INFERIDO (fuerte)` | Several rows, numbered views — unambiguous |
| `INFERIDO` | Several rows share an exact typed prefix |
| `INFERIDO (individual)` | One row → one project, by default ([§1.5](#15--the-23-single-image-projects-are-a-default-not-a-finding)) |
| `AMBIGUO` | Prefix collides or drifts — **needs your ruling** ([§1](#1-read-this-first--the-groupings-that-are-guesses)) |
| `SOLO INICIO` | Shown on home only, no page row ([§1.6](#16--fisioequina-is-on-the-home-page-and-nowhere-else)) |

### Branding Corporativo `branding` — 16 proyectos, 25 filas

| Proyecto propuesto | Certeza | Grupo | Fila | id | Archivo | Texto de la fila | Etiqueta |
|---|---|---|---|---|---|---|---|
| **WodFest Costa Rica** | INFERIDO ⚠⚠ | `sports` | page | 1 | `wodfest-1.png` | WodFest Costa Rica - Campaña publicitaria | Campaña Publicitaria |
|  |  |  | page | 2 | `wodfest-2.png` | WodFest Costa Rica - Diseño de marca | Diseño de Marca |
|  |  |  | **inicio** | — | `wodfest-1.png` | WodFest Costa Rica - Campaña publicitaria | — |
|  |  |  | **inicio** | — | `wodfest-2.png` | WodFest Costa Rica - Diseño de marca | — |
| **OFF DAY Trainer** | INFERIDO | `sports` | page | 10 | `fitness-deadlift.png` | OFF DAY Trainer - Técnica Deadlift | Contenido Educativo |
|  |  |  | page | 11 | `fitness-pullups.png` | OFF DAY Trainer - Técnica Pull-ups | Contenido Educativo |
| **SNAGA Team Relay 9th Anniversary** | INFERIDO (individual) | `sports` | page | 16 | `snaga-relay.png` | SNAGA Team Relay 9th Anniversary | Evento Fitness |
| **Adriana Muñoz** | AMBIGUO ⚠ | `adrianaMunoz` | page | 3 | `adriana-munoz.png` | Adriana Muñoz - Contenido para redes sociales | Social Media |
|  |  |  | **inicio** | — | `adriana-munoz.png` | Adriana Muñoz - Contenido para redes sociales | — |
| | | | | | | ⚠ "Adriana Muñoz" también aparece como sufijo en "Live Técnica Phicontour - Adriana Muñoz" | |
| **Live Técnica Phicontour** | INFERIDO (individual) | `adrianaMunoz` | page | 6 | `phicontour-live.png` | Live Técnica Phicontour - Adriana Muñoz | Social Media |
| **Curso Phibrows** | INFERIDO | `adrianaMunoz` | page | 9 | `phibrows-course.png` | Curso Phibrows - Material Promocional | Social Media |
|  |  |  | page | 12 | `phibrows-before-after.png` | Curso Phibrows - Antes y Después | Social Media |
| **Live con Ana Oprea** | INFERIDO (individual) | `adrianaMunoz` | page | 14 | `live-microblading.png` | Live con Ana Oprea - Técnica Microblading | Evento Online |
| **Live con Stefany Galeano** | INFERIDO (individual) | `adrianaMunoz` | page | 15 | `live-phibrows-shading.png` | Live con Stefany Galeano - Phibrows Shading | Evento Online |
| **Ana Grace Salon & Estética** | AMBIGUO ⚠ | `anaGrace` | page | 5 | `ana-grace.png` | Ana Grace Salon & Estética - Branding digital | Branding Digital |
|  |  |  | **inicio** | — | `ana-grace.png` | Ana Grace Salon & Estética - Branding digital | — |
| | | | | | | ⚠ prefijo casi idéntico: "Ana Grace" / "Ana Grace Salon & Estética" | |
| **Ana Grace** | AMBIGUO ⚠ | `anaGrace` | page | 7 | `ana-grace-hair.png` | Ana Grace - Promoción Tratamiento Capilar | Social Media |
|  |  |  | page | 8 | `ana-grace-online.png` | Ana Grace - Compra Online | Social Media |
|  |  |  | page | 13 | `ana-grace-payment.png` | Ana Grace - Información de Pago | Social Media |
| | | | | | | ⚠ prefijo casi idéntico: "Ana Grace" / "Ana Grace Salon & Estética" | |
| **La Dulcereta Obleas** | INFERIDO (individual) | `logos` | page | 17 | `la-dulcereta.png` | La Dulcereta Obleas - Diseño de Logo | Logo |
| **Fit Cookie by Elsa Cubero** | INFERIDO (individual) | `logos` | page | 18 | `fit-cookie.png` | Fit Cookie by Elsa Cubero - Diseño de Logo | Logo |
| **Nomads Eighty-Six** | INFERIDO (individual) | `logos` | page | 19 | `nomads.png` | Nomads Eighty-Six - Diseño de Logo | Logo |
| **Carnicería La Pedreña** | INFERIDO (individual) | `logos` | page | 20 | `la-pedrena.png` | Carnicería La Pedreña - Diseño de Logo | Logo |
| **Falecon Decoraciones** | INFERIDO (individual) | `logos` | page | 21 | `falecon.png` | Falecon Decoraciones - Diseño de Logo | Logo |
| **FisioEquina** | SOLO INICIO | `—` | **inicio** | — | `fisio-equina.png` | FisioEquina - Social media marketing | — |

### Fotografía de Producto `fotografia-producto` — 6 proyectos, 18 filas

| Proyecto propuesto | Certeza | Grupo | Fila | id | Archivo | Texto de la fila | Etiqueta |
|---|---|---|---|---|---|---|---|
| **Crackers D'Argent** | INFERIDO (individual) | `—` | page | — | `crackers.png` | Crackers D'Argent - Fotografía de Producto | Fotografía de Producto |
|  |  |  | **inicio** | — | `crackers.png` | Crackers D'Argent | Fotografía de Producto |
| **Croissant Artesanal** | INFERIDO (individual) | `—` | page | — | `croissant.png` | Croissant Artesanal - Fotografía de Producto | Fotografía de Producto |
|  |  |  | **inicio** | — | `croissant.png` | Croissant Artesanal | Fotografía de Producto |
| **Pan D'Argent** | INFERIDO (individual) | `—` | page | — | `bread-dargent.png` | Pan D'Argent - Fotografía de Producto | Fotografía de Producto |
|  |  |  | **inicio** | — | `bread-dargent.png` | Pan D'Argent | Fotografía de Producto |
| **Croissant Premium** | INFERIDO (individual) | `—` | page | — | `croissant-packaging.png` | Croissant Premium - Packaging & Fotografía | Packaging |
|  |  |  | **inicio** | — | `croissant-packaging.png` | Croissant Premium | Packaging & Fotografía |
| **Caja de Regalo Navideña** | INFERIDO (individual) | `—` | page | — | `gift-box-1.png` | Caja de Regalo Navideña - Packaging & Fotografía | Packaging |
|  |  |  | **inicio** | — | `gift-box-1.png` | Caja de Regalo Navideña | Packaging & Fotografía |
| **Set Regalo Vinte-Vinte** | INFERIDO (fuerte) | `—` | page | — | `gift-box-vinte-1.png` | Set Regalo Vinte-Vinte - Vista 1 | Packaging |
|  |  |  | page | — | `gift-box-vinte-2.png` | Set Regalo Vinte-Vinte - Vista 2 | Packaging |
|  |  |  | page | — | `gift-box-vinte-3.png` | Set Regalo Vinte-Vinte - Vista 3 | Packaging |
|  |  |  | page | — | `gift-box-vinte.png` | Set Regalo Vinte-Vinte - Vista 4 | Packaging |
|  |  |  | page | — | `gift-box-vinte-4.png` | Set Regalo Vinte-Vinte - Vista 5 | Packaging |
|  |  |  | page | — | `gift-box-vinte-5.png` | Set Regalo Vinte-Vinte - Vista 6 | Packaging |
|  |  |  | page | — | `gift-box-vinte-6.png` | Set Regalo Vinte-Vinte - Vista 7 | Packaging |
|  |  |  | **inicio** | — | `gift-box-vinte.png` | Set Regalo Vinte-Vinte | Packaging & Fotografía |

### Marketing 360° `marketing-360` — 4 proyectos, 8 filas

| Proyecto propuesto | Certeza | Grupo | Fila | id | Archivo | Texto de la fila | Etiqueta |
|---|---|---|---|---|---|---|---|
| **Brochure Corporativo** | INFERIDO (individual) | `—` | page | — | `santa-fe-brochure.png` | Brochure Corporativo - Grupo Santa Fe | Material Impreso |
|  |  |  | **inicio** | — | `santa-fe-brochure.png` | Brochure Corporativo | Material Impreso - Grupo Santa Fe |
| **Banner de Evento** | INFERIDO (individual) | `—` | page | — | `concert-banner.png` | Banner de Evento - Concierto | Publicidad Digital |
|  |  |  | **inicio** | — | `concert-banner.png` | Banner de Evento | Publicidad Digital - Concierto |
| **Mural Deportivo** | INFERIDO (individual) | `—` | page | — | `basketball-mural.png` | Mural Deportivo - PAS Eagles | Publicidad OOH |
|  |  |  | **inicio** | — | `basketball-mural.png` | Mural Deportivo | Publicidad OOH - PAS Eagles |
| **Tarjetas de Presentación** | INFERIDO (individual) | `—` | page | — | `fisioterapia-cards.png` | Tarjetas de Presentación - Fisioterapia | Branding |
|  |  |  | **inicio** | — | `fisioterapia-cards.png` | Tarjetas de Presentación | Branding - Fisioterapia |

### Web y Apps `web-apps` — 3 proyectos, 6 filas

| Proyecto propuesto | Certeza | Grupo | Fila | id | Archivo | Texto de la fila | Etiqueta |
|---|---|---|---|---|---|---|---|
| **OFF DAY Trainer** | INFERIDO (individual) | `—` | page | — | `offday-trainer.png` | OFF DAY Trainer - Diseño Web de Fitness | Diseño Web |
|  |  |  | **inicio** | — | `offday-trainer.png` | OFF DAY Trainer | Diseño Web de Fitness |
| **TOPMED E-Commerce** | INFERIDO (individual) | `—` | page | — | `topmed-ecommerce.png` | TOPMED E-Commerce - Diseño Responsivo | E-Commerce |
|  |  |  | **inicio** | — | `topmed-ecommerce.png` | TOPMED E-Commerce | Diseño Responsivo |
| **Live Betting App** | INFERIDO (individual) | `—` | page | — | `live-betting.png` | Live Betting App - UI/UX Mobile | App Mobile |
|  |  |  | **inicio** | — | `live-betting.png` | Live Betting App | Aplicación de Apuestas |

---

## 4. How to regenerate this file

The tables in [§3](#3-the-full-mapping--all-57-rows) are generated, not typed. Save the script
below **outside the repository** (it is deliberately not committed — it is a one-off), then
from the repository root:

```
node /tmp/r23-map.mjs        # counts + a readable dump
node /tmp/r23-map.mjs --md   # the §3 tables
```

It reads only `content/sections/*.json`. **No database, no network, no writes.**

```js
// R23a — derive the backfill mapping from committed content. Read-only.
import fs from 'node:fs'

const SECTIONS = [
  { slug: 'branding', file: 'branding.json', label: 'Branding Corporativo' },
  { slug: 'fotografia-producto', file: 'photography.json', label: 'Fotografía de Producto' },
  { slug: 'marketing-360', file: 'marketing-360.json', label: 'Marketing 360°' },
  { slug: 'web-apps', file: 'web-apps.json', label: 'Web y Apps' },
]
const BRANDING_GROUPS = [
  ['sportsProjects', 'sports'],
  ['adrianaMunozProjects', 'adrianaMunoz'],
  ['anaGraceProjects', 'anaGrace'],
  ['logoProjects', 'logos'],
]

const rows = []
const push = (r) => rows.push(r)

for (const s of SECTIONS) {
  const d = JSON.parse(fs.readFileSync(`content/sections/${s.file}`, 'utf8'))
  if (s.slug === 'branding') {
    d.home.images.forEach((it, i) =>
      push({ sec: s.slug, placement: 'home', group: null, idx: i, id: null,
             img: it.src, text: it.alt.es, cat: null }))
    for (const [key, group] of BRANDING_GROUPS)
      d.page[key].forEach((it, i) =>
        push({ sec: s.slug, placement: 'page', group, idx: i, id: it.id,
               img: it.src, text: it.alt.es, cat: it.category.es }))
  } else {
    d.home.projects.forEach((it, i) =>
      push({ sec: s.slug, placement: 'home', group: null, idx: i, id: null,
             img: it.image, text: it.title.es, cat: it.category.es }))
    d.page.projects.forEach((it, i) =>
      push({ sec: s.slug, placement: 'page', group: null, idx: i, id: null,
             img: it.image, text: it.alt.es, cat: it.category.es }))
  }
}

// Proposed project name = the text before the FIRST " - " (the hand-typed prefix).
const prefixOf = (t) => (t.includes(' - ') ? t.slice(0, t.indexOf(' - ')) : t).trim()
for (const r of rows) r.proj = prefixOf(r.text)

// Group page rows into proposed projects, per category.
const projects = new Map() // key: sec|proj
for (const r of rows.filter((r) => r.placement === 'page')) {
  const k = `${r.sec}|${r.proj}`
  if (!projects.has(k)) projects.set(k, { sec: r.sec, name: r.proj, group: r.group, imgs: [] })
  projects.get(k).imgs.push(r)
}

// Certainty. Nothing here is certain — every grouping comes from a typed prefix.
for (const p of projects.values()) {
  const enumerated = p.imgs.length > 1 && p.imgs.every((r) => /\s-\s.*\b\d+$/.test(r.text))
  p.certeza = p.imgs.length === 1 ? 'INFERIDO (individual)'
            : enumerated ? 'INFERIDO (fuerte)' : 'INFERIDO'
}
// Near-miss prefixes inside one category = the "typo'd prefix silently splits a project" risk.
for (const a of projects.values())
  for (const b of projects.values())
    if (a !== b && a.sec === b.sec && b.name.startsWith(a.name + ' ')) {
      a.certeza = 'AMBIGUO'; b.certeza = 'AMBIGUO'
      a.note = b.note = `prefijo casi idéntico: "${a.name}" / "${b.name}"`
    }
// A project name that appears as the SUFFIX of another row = the same client written the
// other way round. Surface it; do not merge silently.
for (const p of projects.values())
  for (const r of rows)
    if (r.sec === p.sec && r.proj !== p.name && r.text.endsWith(' - ' + p.name)) {
      p.certeza = 'AMBIGUO'
      p.note = `"${p.name}" también aparece como sufijo en "${r.text}"`
    }

// Attach home rows: by image file, else by prefix, else home-only.
const homeOnly = []
for (const r of rows.filter((r) => r.placement === 'home')) {
  let hit = [...projects.values()].find((p) => p.sec === r.sec && p.imgs.some((i) => i.img === r.img))
  if (!hit) hit = [...projects.values()].find((p) => p.sec === r.sec && p.name === r.proj)
  if (!hit) { homeOnly.push(r); continue }
  ;(hit.homeRows ??= []).push(r)
}

const MD = process.argv.includes('--md')
const say = (...a) => { if (!MD) console.log(...a) }
say(`ROWS: ${rows.length}`)
for (const s of SECTIONS) {
  const rs = rows.filter((r) => r.sec === s.slug)
  say(`  ${s.slug}: ${rs.length} (home ${rs.filter((r) => r.placement === 'home').length}, page ${rs.filter((r) => r.placement === 'page').length})`)
}
say(`PROJECTS: ${projects.size}   HOME-ONLY ROWS: ${homeOnly.length}`)
say()
for (const s of SECTIONS) {
  say(`===== ${s.slug}`)
  for (const p of [...projects.values()].filter((p) => p.sec === s.slug)) {
    const hr = p.homeRows ?? []
    say(`  * ${p.name}  [${p.certeza}]  grupo=${p.group ?? '-'}  imgs=${p.imgs.length}  home=${hr.length}` +
      (hr.length > 1 ? '  ⚠⚠ MÁS DE UNA TARJETA EN INICIO' : '') + (p.note ? `  ⚠ ${p.note}` : ''))
    for (const i of p.imgs)
      say(`      - id=${i.id ?? '-'} idx=${i.idx} ${i.img.split('/').pop()} | ${i.text} | ${i.cat}`)
    for (const r of hr) {
      const ci = p.imgs.findIndex((i) => i.img === r.img)
      say(`      HOME(#${ci < 0 ? 'no-en-page' : ci + 1}/${p.imgs.length}): ${r.img.split('/').pop()} | ${r.text} | ${r.cat ?? '(sin categoría)'}`)
    }
  }
  for (const r of homeOnly.filter((r) => r.sec === s.slug))
    say(`  * ${r.proj}  [SOLO HOME]  ${r.img.split('/').pop()} | ${r.text}`)
}

if (MD) {
  const out = []
  for (const s of SECTIONS) {
    const ps = [...projects.values()].filter((p) => p.sec === s.slug)
    const ho = homeOnly.filter((r) => r.sec === s.slug)
    const n = rows.filter((r) => r.sec === s.slug).length
    out.push(`### ${s.label} \`${s.slug}\` — ${ps.length + ho.length} proyectos, ${n} filas\n`)
    out.push('| Proyecto propuesto | Certeza | Grupo | Fila | id | Archivo | Texto de la fila | Etiqueta |')
    out.push('|---|---|---|---|---|---|---|---|')
    const blocks = [...ps, ...ho.map((r) => ({ name: r.proj, group: null, imgs: [], homeRows: [r], certeza: 'SOLO INICIO' }))]
    for (const p of blocks) {
      const hr = p.homeRows ?? []
      const flag = hr.length > 1 ? ' ⚠⚠' : p.note ? ' ⚠' : ''
      const lines = [
        ...p.imgs.map((i) => ['page', i.id ?? '—', i.img.split('/').pop(), i.text, i.cat]),
        ...hr.map((r) => ['**inicio**', r.id ?? '—', r.img.split('/').pop(), r.text, r.cat ?? '—']),
      ]
      lines.forEach((l, k) => out.push(
        `| ${k === 0 ? `**${p.name}**` : ''} | ${k === 0 ? p.certeza + flag : ''} | ${k === 0 ? '`' + (p.group ?? '—') + '`' : ''} | ${l[0]} | ${l[1]} | \`${l[2]}\` | ${l[3]} | ${l[4]} |`))
      if (p.note) out.push(`| | | | | | | ⚠ ${p.note} | |`)
    }
    out.push('')
  }
  process.stdout.write(out.join('\n') + '\n')
}
```

**Verification, 2026-08-10:** `node /tmp/r23-map.mjs` prints `ROWS: 57` —
branding 25, fotografia-producto 18, marketing-360 8, web-apps 6 — and
`PROJECTS: 28   HOME-ONLY ROWS: 1` (28 + 1 = **29**). Both reconcile with the counts in
[§0](#0-what-this-is) and with the conductor's independent count of 57.

---

## 5. Sign-off

R23b must not start until the six questions in [§1](#1-read-this-first--the-groupings-that-are-guesses)
are answered. Answer them by editing this file — either amend the tables directly, or add the
rulings here:

| # | Question | Ruling |
|---|---|---|
| 1.1 | `Ana Grace` + `Ana Grace Salon & Estética` — merge into one project? | *pendiente* |
| 1.2 | `WodFest Costa Rica` — one project or two? | *pendiente* |
| 1.3 | `Live Técnica Phicontour` — own project, or part of Adriana Muñoz? | *pendiente* |
| 1.4 | `OFF DAY Trainer` (2) and `Curso Phibrows` (2) — correct as grouped? | *pendiente* |
| 1.5 | 23 single-image projects — accept the default? | *pendiente* |
| 1.6 | `FisioEquina` home-only — intended? | *pendiente* |
