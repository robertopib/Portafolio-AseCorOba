/**
 * R50 — the R23 promotion pre-flight.  READ-ONLY: it issues `SELECT` and nothing else.
 *
 * Answers one question about ONE database, three times over — once per migration the
 * promotion applies in a single deploy:
 *
 *   1. 20260811_114118_r23_clientes_images  (R23b-i, widened by R49)   would it apply cleanly?
 *   2. 20260812_015822_r23_home_order_alt   (R23b-ii)                  …and this one?
 *   3. 20260812_111929_r23_drop_old_columns (R23b-iii — DELETES ROWS)  …and this one?
 *
 * and then: **what would this database hold afterwards?** Every number in the report is
 * derived from the rows this database actually has. Nothing is asserted from dev's shape —
 * R23a's hard-coded "29" is why, and R49 exists because a baked-in count blocked a promotion.
 *
 * ── WHY THIS IS COMMITTED, WHEN R45's AND R49's PRE-FLIGHTS LIVED IN /tmp ────────────────────
 * Because it **imports the real gates instead of restating them**. `reconcile()` decides
 * migration 1's abort and `planCleanup()` derives migration 3's delete set; both are pure,
 * unit-tested, and importable, so this script cannot drift from what the migrations will
 * actually do. A hand-mirrored copy can, and that is the shape R13b was written to prevent.
 *
 * It also has to be re-run **immediately before every promotion attempt**, not once: production
 * is edited by hand, and attaching any of the 14 staged uploads (`2.jpg`…`15.jpg`, R45) moves
 * every count in here.
 *
 * ── WHAT IS MIRRORED, AND WHY IT COULD NOT BE IMPORTED ───────────────────────────────────────
 * Three things in R23b-i's `up()` are inline in the migration rather than in `lib/r23/`, and
 * this script reproduces them to project the post-backfill shape: the page/home slotting, the
 * choice of WHICH existing row becomes the parent (migration `:342-343`), and
 * `deriveHomeOnlyOrder` (`:91-111`). Extracting them would mean editing a committed migration,
 * which R50 explicitly forbids. They are cited line-for-line below; if you change the
 * migration, change them here in the same commit.
 *
 * ── NO DEFAULT TARGET ────────────────────────────────────────────────────────────────────────
 * There is no connection string in this file and no default database. The run is refused
 * unless the operator declares BOTH what they are aiming at (`R23_PREFLIGHT_TARGET`) and the
 * exact host (`DB_TARGET_HOST`, enforced by `dbGuard.ts` against `DATABASE_URI`). A pooled
 * endpoint is refused too — RELEASE.md's rule, and it keeps this run identical in shape to the
 * `payload migrate` that will follow it.
 *
 * Run — production (direct, non-pooled endpoint; nothing is written):
 *   cd cms
 *   DATABASE_URI="<PROD DIRECT>" DB_TARGET_HOST="<prod direct host>" \
 *   R23_PREFLIGHT_TARGET=production \
 *     pnpm payload run src/scripts/r23-preflight.ts
 *
 * Self-check against a database where the three migrations have ALREADY run: point it at
 * R23b-iii's archive table, which is the pre-migration snapshot of `projects`, and the
 * projection below must reproduce the outcome that migration actually produced.
 *   R23_PREFLIGHT_SOURCE=archive … pnpm payload run src/scripts/r23-preflight.ts
 *
 * Output: `/tmp/r23-preflight.json` (+ `.txt`), overridable with `R23_PREFLIGHT_OUT`. Written
 * to disk because stdout is unreliable under `payload run` — same reason as
 * `backfill-thumbnails.ts`. Exit code is 1 if any migration would NOT apply cleanly.
 */
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import { assertPortfolioDb } from './dbGuard'
import { R23_CLIENT_MAP } from '../lib/r23/clientMap.generated'
import { clientNames, projectKey, type WorksheetEntry } from '../lib/r23/parseWorksheet'
import { reconcile, formatUnknown, photoKey, type DbPhotograph } from '../lib/r23/reconcile'
import { planCleanup, formatUnsafe, type CleanupRow } from '../lib/r23/cleanup'

// ---------------------------------------------------------------------------------------------
// Inputs. All of them explicit; none of them defaulted to a database.
// ---------------------------------------------------------------------------------------------

/** Whitelist, not interpolation: these two names are the only tables this script will read from. */
const SOURCES = {
  live: { projects: 'projects', locales: 'projects_locales' },
  archive: { projects: 'projects_pre_r23biii', locales: 'projects_locales_pre_r23biii' },
} as const

const MIGRATIONS = [
  '20260811_114118_r23_clientes_images',
  '20260812_015822_r23_home_order_alt',
  '20260812_111929_r23_drop_old_columns',
] as const

const OUT = process.env.R23_PREFLIGHT_OUT ?? '/tmp/r23-preflight.json'

type Verdict = { migration: string; clean: boolean; findings: string[]; detail: Record<string, unknown> }

type OldRow = {
  id: number
  type: string
  categoryId: number | null
  categoria: string | null
  imageId: number | null
  archivo: string | null
  placement: string | null
  group: string | null
  size: string | null
  order: number
  internalTitle: string | null
}

type Locale = {
  parentId: number
  locale: string
  title: string | null
  alt: string | null
  categoryLabel: string | null
}

/** One row `projects_images` would hold after migration 1, plus what migration 2 would add. */
type ProjectedImage = {
  key: string
  categoria: string
  archivo: string
  imageId: number
  parentId: number
  order: number
  size: string | null
  showOnPage: boolean
  showOnHome: boolean
  /** Migration 2's `home_order`, read from the surviving home row. */
  homeOrder: number | null
  /** Locales that would receive a non-empty `home_alt`. */
  homeAltLocales: string[]
  /** How many candidate home rows migration 2's join would find. 1 is the only good answer. */
  homeRowMatches: number
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------------------------
  // 0. Refuse to run by accident. `payload run` loads cms/.env, so "no arguments" would
  //    otherwise mean "dev" — this script must never pick a database for you.
  // -------------------------------------------------------------------------------------------
  const target = process.env.R23_PREFLIGHT_TARGET
  if (!target)
    throw new Error(
      'R23_PREFLIGHT_TARGET is not set. Name the database you mean to read — e.g.\n' +
        '  R23_PREFLIGHT_TARGET=production   (with DATABASE_URI + DB_TARGET_HOST for prod)\n' +
        'This script has no default target on purpose.',
    )

  const sourceName = (process.env.R23_PREFLIGHT_SOURCE ?? 'live') as keyof typeof SOURCES
  const source = SOURCES[sourceName]
  if (!source)
    throw new Error(`R23_PREFLIGHT_SOURCE must be one of: ${Object.keys(SOURCES).join(', ')}.`)

  const host = new URL(process.env.DATABASE_URI ?? 'postgres://unset/').host
  if (host.includes('-pooler'))
    throw new Error(
      `DATABASE_URI points at the POOLED endpoint (${host}). Use the direct, non-pooled one — ` +
        'remove "-pooler" from the host. RELEASE.md: the pooler hangs, and the promotion itself ' +
        'runs against the unpooled endpoint, so the pre-flight must read the same one.',
    )

  assertPortfolioDb() // DATABASE_URI host must equal the declared DB_TARGET_HOST.

  const payload = await getPayload({ config })
  const pool = (payload.db as unknown as {
    pool: { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }
  }).pool
  const q = async (text: string, params: unknown[] = []): Promise<any[]> =>
    (await pool.query(text, params)).rows

  const report: Record<string, unknown> = {
    task: 'R50 — R23 promotion pre-flight',
    readOnly: 'SELECT only. No INSERT/UPDATE/DELETE, no DDL, no payload migrate.',
    target,
    host,
    source: source.projects,
    measuredAt: new Date().toISOString(),
  }
  const verdicts: Verdict[] = []

  // -------------------------------------------------------------------------------------------
  // 1. Where is this database in the arc? Read it, never assume it.
  // -------------------------------------------------------------------------------------------
  const applied = (await q(`SELECT "name" FROM "payload_migrations" ORDER BY "id"`)).map(
    (r) => r.name as string,
  )
  const pending = MIGRATIONS.filter((m) => !applied.includes(m))
  report.migrations = {
    applied,
    r23: Object.fromEntries(MIGRATIONS.map((m) => [m, applied.includes(m) ? 'Ran: Yes' : 'Ran: No'])),
  }

  const [schema] = await q(
    `SELECT to_regclass($1) IS NOT NULL                                         AS has_source,
            to_regclass('public.projects_images') IS NOT NULL                   AS has_images_table,
            to_regclass('public.clients') IS NOT NULL                           AS has_clients_table,
            EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = $2
                       AND column_name = 'placement')                           AS has_old_columns`,
    [`public.${source.projects}`, source.projects],
  )
  report.schema = schema

  if (!schema.has_source)
    throw new Error(
      `table "${source.projects}" does not exist on ${host}. ` +
        (sourceName === 'archive'
          ? 'The archive only exists where 20260812_111929_r23_drop_old_columns has run.'
          : 'This does not look like the portfolio database.'),
    )
  if (!schema.has_old_columns)
    throw new Error(
      `"${source.projects}" has no "placement" column on ${host}, so the old model is already ` +
        'gone here and there is no promotion left to predict. If the three R23 migrations have ' +
        'already run, re-run with R23_PREFLIGHT_SOURCE=archive to check this script against ' +
        'what they actually did.',
    )

  // -------------------------------------------------------------------------------------------
  // 2. Read the old model. One query; everything below is derived from it in memory.
  // -------------------------------------------------------------------------------------------
  const rows: OldRow[] = (
    await q(`
      SELECT p."id",
             p."type"::text          AS type,
             p."category_id"         AS category_id,
             c."slug"                AS categoria,
             p."image_id"            AS image_id,
             m."filename"            AS archivo,
             p."placement"::text     AS placement,
             p."group"::text         AS "group",
             p."size"::text          AS size,
             p."order"::float8       AS "order",
             p."internal_title"      AS internal_title
      FROM "${source.projects}" p
      LEFT JOIN "categories" c ON c."id" = p."category_id"
      LEFT JOIN "media"      m ON m."id" = p."image_id"
      ORDER BY p."id"`)
  ).map((r) => ({
    id: Number(r.id),
    type: String(r.type),
    categoryId: r.category_id == null ? null : Number(r.category_id),
    categoria: r.categoria ?? null,
    imageId: r.image_id == null ? null : Number(r.image_id),
    archivo: r.archivo ?? null,
    placement: r.placement ?? null,
    group: r.group ?? null,
    size: r.size ?? null,
    order: Number(r.order),
    internalTitle: r.internal_title ?? null,
  }))

  const locales: Locale[] = (
    await q(`
      SELECT "_parent_id" AS parent_id, "_locale"::text AS locale, "title", "alt", "category_label"
      FROM "${source.locales}"`)
  ).map((r) => ({
    parentId: Number(r.parent_id),
    locale: String(r.locale),
    title: r.title ?? null,
    alt: r.alt ?? null,
    categoryLabel: r.category_label ?? null,
  }))
  const localesByParent = new Map<number, Locale[]>()
  for (const l of locales) localesByParent.set(l.parentId, [...(localesByParent.get(l.parentId) ?? []), l])

  const imageRows = rows.filter((r) => r.imageId != null)
  const [{ n: mediaCount }] = await q(`SELECT count(*)::int AS n FROM "media"`)

  report.before = {
    projectsRows: rows.length,
    imageRows: imageRows.length,
    caseStudyRows: rows.filter((r) => r.type !== 'image').length,
    media: Number(mediaCount),
    worksheetEntries: R23_CLIENT_MAP.length,
  }

  // ===========================================================================================
  // MIGRATION 1 — 20260811_114118_r23_clientes_images
  // Every prod row reconciles against the worksheet; no unknown media; the backfill's other
  // pre-write assertions hold.
  // ===========================================================================================
  const m1: Verdict = { migration: MIGRATIONS[0], clean: true, findings: [], detail: {} }
  const flag = (v: Verdict, msg: string) => {
    v.clean = false
    v.findings.push(msg)
  }

  // Migration `:204-205` — both of these `fail()` inside the row mapping.
  for (const r of imageRows) {
    if (!r.categoria) flag(m1, `project ${r.id} has no known categoría.`)
    if (!r.archivo) flag(m1, `project ${r.id} points at unknown media (image_id ${r.imageId}).`)
  }

  // Migration `:218-234` — the page/home slotting, and the two duplicate checks in it.
  const onPage = (r: OldRow) => r.placement === 'page' || r.placement === 'both'
  const onHome = (r: OldRow) => r.placement === 'home' || r.placement === 'both'
  const photos = new Map<string, { page?: OldRow; home?: OldRow }>()
  for (const r of imageRows) {
    if (!r.categoria || !r.archivo) continue
    const k = photoKey(r.categoria, r.archivo)
    const slot = photos.get(k) ?? {}
    if (onPage(r)) {
      if (slot.page) flag(m1, `${k} has two page rows (${slot.page.id}, ${r.id}).`)
      slot.page = r
    }
    if (onHome(r)) {
      if (slot.home) flag(m1, `${k} has two home rows (${slot.home.id}, ${r.id}).`)
      slot.home = r
    }
    photos.set(k, slot)
  }

  // --- THE gate, imported. This is R49's `reconcile()`, the same call the migration makes. ---
  const state = reconcile(
    R23_CLIENT_MAP,
    new Map<string, DbPhotograph>(
      [...photos].map(([k, slot]) => {
        const r = (slot.page ?? slot.home)!
        return [k, { id: r.id, placement: r.placement ?? 'none' }]
      }),
    ),
  )
  if (state.unknown.length) flag(m1, formatUnknown(state.unknown))

  const covered = state.covered
  const clients = clientNames(covered as WorksheetEntry[])

  // Migration `:266-270` — one group per (cliente, categoría); each `—` image its own project.
  const groups = new Map<string, WorksheetEntry[]>()
  for (const e of covered) groups.set(projectKey(e), [...(groups.get(projectKey(e)) ?? []), e])

  // Migration `:273-287` — the per-categoría sequence facts `deriveHomeOnlyOrder` needs.
  const pairedByCat = new Map<string, Array<{ home: number; page: number }>>()
  const pageOrdersByCat = new Map<string, Set<number>>()
  for (const [k, slot] of photos) {
    const categoria = k.split('|')[0]!
    if (slot.page) {
      const set = pageOrdersByCat.get(categoria) ?? new Set<number>()
      set.add(slot.page.order)
      pageOrdersByCat.set(categoria, set)
    }
    if (slot.page && slot.home)
      pairedByCat.set(categoria, [
        ...(pairedByCat.get(categoria) ?? []),
        { home: slot.home.order, page: slot.page.order },
      ])
  }

  /** MIRRORS migration `:91-111`. Same two assertions, reported instead of thrown. */
  const deriveHomeOnlyOrder = (categoria: string, homeOrder: number): number | null => {
    const paired = pairedByCat.get(categoria) ?? []
    if (paired.length === 0) {
      flag(m1, `${categoria}: a home-only image, but no image with both placements to derive an offset from.`)
      return null
    }
    const offsets = [...new Set(paired.map((p) => p.page - p.home))]
    if (offsets.length !== 1) {
      flag(m1, `${categoria}: home and page sequences do not share one offset (saw ${offsets.join(', ')}).`)
      return null
    }
    const derived = homeOrder + offsets[0]!
    if ((pageOrdersByCat.get(categoria) ?? new Set()).has(derived)) {
      flag(m1, `${categoria}: derived order ${derived} for the home-only image is already taken.`)
      return null
    }
    return derived
  }

  // Migration `:300-372` — build each group, pick its parent, project its images[].
  const projected: ProjectedImage[] = []
  const parentIdByGroup = new Map<string, number>()
  const homeOnly: Array<{ key: string; derivedOrder: number | null }> = []

  for (const [gkey, entries] of groups) {
    const categoria = entries[0]!.categoria
    const built = entries.map((e) => {
      const slot = photos.get(photoKey(e.categoria, e.archivo))!
      const { page, home } = slot
      const src = (page ?? home)!
      let order = page ? page.order : deriveHomeOnlyOrder(categoria, home!.order)
      if (order === null) order = home!.order
      if (!page) homeOnly.push({ key: photoKey(e.categoria, e.archivo), derivedOrder: order })
      return { order, src, page, home, entry: e }
    })
    built.sort((a, b) => a.order - b.order)

    // Migration `:342-343`, verbatim in intent: the parent is an EXISTING row — the lowest-order
    // page row, falling back to the home row for the one project that has none.
    const pageCandidates = built.filter((b) => b.src.placement !== 'home')
    const parent = (pageCandidates.length ? pageCandidates : built)[0]!.src
    parentIdByGroup.set(gkey, parent.id)

    // Migration `:347-349` — §3.1's claim that a project's images share one `group`.
    for (const b of built)
      if (b.src.group !== parent.group)
        flag(m1, `${gkey}: image ${b.src.archivo} is in group ${b.src.group}, parent is ${parent.group}.`)

    for (const b of built)
      projected.push({
        key: photoKey(b.entry.categoria, b.entry.archivo),
        categoria: b.entry.categoria,
        archivo: b.entry.archivo,
        imageId: b.src.imageId!,
        parentId: parent.id,
        order: b.order,
        size: b.src.size,
        showOnPage: Boolean(b.page),
        showOnHome: Boolean(b.home),
        homeOrder: null,
        homeAltLocales: [],
        homeRowMatches: 0,
      })
  }

  // Migration `:377-378` — the write loop's self-check, projected.
  if (projected.length !== covered.length)
    flag(m1, `projected ${projected.length} image rows but reconciliation covered ${covered.length}.`)

  m1.detail = {
    photographsInDatabase: photos.size,
    worksheetCovered: covered.length,
    unknownToWorksheet: state.unknown.map((u) => `${u.key} (row #${u.id}, placement '${u.placement}')`),
    worksheetEntriesWithNoRowHere: state.unused,
    wouldCreate: { clients: clients.length, projectParents: groups.size, images: projected.length },
    homeOnlyImages: homeOnly,
    perCategoria: [...new Set([...photos.keys()].map((k) => k.split('|')[0]!))].sort().map((cat) => ({
      categoria: cat,
      photographs: [...photos.keys()].filter((k) => k.startsWith(`${cat}|`)).length,
      rows: imageRows.filter((r) => r.categoria === cat).length,
    })),
  }
  verdicts.push(m1)

  // ===========================================================================================
  // MIGRATION 2 — 20260812_015822_r23_home_order_alt
  // Does the homeOrder/homeAlt backfill cover every home row this database has?
  // ===========================================================================================
  const m2: Verdict = { migration: MIGRATIONS[1], clean: true, findings: [], detail: {} }

  // The migration's own pre-check (`:88-101`), run verbatim against this database.
  const dupes = await q(`
    SELECT category_id, image_id, count(*) AS n
    FROM "${source.projects}"
    WHERE "type" = 'image' AND placement IN ('home', 'both') AND image_id IS NOT NULL
    GROUP BY category_id, image_id
    HAVING count(*) > 1`)
  if (dupes.length)
    flag(
      m2,
      `${dupes.length} photograph(s) have more than one home row: ` +
        dupes.map((d: any) => `categoría ${d.category_id}/media ${d.image_id} ×${d.n}`).join(', '),
    )

  // The two `UPDATE … FROM` joins (`:107-134`), evaluated as lookups. `hp` is any row in the
  // PARENT's categoría carrying the same media with placement home/both — a `both` row is its
  // own home row, which is the R23b-ii prediction production's `1.jpg` is here to test.
  const parentById = new Map(rows.map((r) => [r.id, r]))
  for (const pi of projected) {
    if (!pi.showOnHome) continue
    const parent = parentById.get(pi.parentId)!
    const matches = imageRows.filter(
      (r) =>
        r.type === 'image' &&
        (r.placement === 'home' || r.placement === 'both') &&
        r.categoryId === parent.categoryId &&
        r.imageId === pi.imageId,
    )
    pi.homeRowMatches = matches.length
    if (matches.length === 0) {
      flag(
        m2,
        `${pi.categoria}/${pi.archivo} is flagged showOnHome but no surviving projects row with ` +
          'placement home/both carries that photograph.',
      )
      continue
    }
    pi.homeOrder = matches[0]!.order
    pi.homeAltLocales = (localesByParent.get(matches[0]!.id) ?? [])
      .filter((l) => l.alt != null && l.alt !== '')
      .map((l) => l.locale)
      .sort()
  }

  const homeImages = projected.filter((p) => p.showOnHome)
  // Not an assertion — an observation the report should carry: two photographs of one categoría
  // sharing a published home (or page) number is legal, and the emitters' tiebreak decides it.
  const collisions: string[] = []
  for (const [label, key] of [
    ['home', (p: ProjectedImage) => (p.showOnHome ? (p.homeOrder ?? p.order) : null)],
    ['page', (p: ProjectedImage) => (p.showOnPage ? p.order : null)],
  ] as const) {
    const seen = new Map<string, string[]>()
    for (const p of projected) {
      const n = key(p)
      if (n === null) continue
      const k = `${p.categoria}|${label}|${n}`
      seen.set(k, [...(seen.get(k) ?? []), p.archivo])
    }
    for (const [k, files] of seen) if (files.length > 1) collisions.push(`${k} → ${files.join(', ')}`)
  }

  m2.detail = {
    showOnHomeImages: homeImages.length,
    wouldCarryHomeAlt: homeImages.filter((p) => p.homeAltLocales.length > 0).length,
    homeAltEmpty: homeImages.filter((p) => p.homeAltLocales.length === 0).length,
    // R23b-ii predicted a `both` row "resolves with no special case" because it IS its own home
    // row. Production's `1.jpg` is the only one anywhere, so this is where that prediction is
    // checked — `homeRowMatches: 1` and a non-null `homeOrder` are the prediction holding.
    bothPlacementRows: imageRows
      .filter((r) => r.placement === 'both')
      .map((r) => {
        const pi = projected.find((p) => p.categoria === r.categoria && p.archivo === r.archivo)
        return {
          row: `${r.categoria}/${r.archivo} #${r.id}`,
          order: r.order,
          projected: pi
            ? {
                parentId: pi.parentId,
                isItsOwnParent: pi.parentId === r.id,
                showOnPage: pi.showOnPage,
                showOnHome: pi.showOnHome,
                homeRowMatches: pi.homeRowMatches,
                homeOrder: pi.homeOrder,
                homeAltLocales: pi.homeAltLocales,
                // What the home card would publish. Empty strings are a real published value
                // here, not a gap — see the migration's note on the 13 non-branding home cards.
                homeCard: Object.fromEntries(
                  (localesByParent.get(r.id) ?? []).map((l) => [
                    l.locale,
                    { title: l.title ?? '', categoryLabel: l.categoryLabel ?? '', alt: l.alt ?? '' },
                  ]),
                ),
              }
            : null,
        }
      }),
    duplicateHomeRows: dupes.length,
    orderCollisionsWithinCategoria: collisions,
  }
  verdicts.push(m2)

  // ===========================================================================================
  // MIGRATION 3 — 20260812_111929_r23_drop_old_columns.  THE DESTRUCTIVE ONE.
  // planCleanup() over what migration 1 would have left behind. Imported, never restated.
  // ===========================================================================================
  const m3: Verdict = { migration: MIGRATIONS[2], clean: true, findings: [], detail: {} }

  // What the NEW model would hold, keyed exactly as the migration keys it (`:104-113`): the
  // parent's categoría + the media filename.
  const coveredByNewModel = new Set(
    projected.map((p) => photoKey(parentById.get(p.parentId)!.categoria!, p.archivo)),
  )
  const imageRowsByParent = new Map<number, number>()
  for (const p of projected) imageRowsByParent.set(p.parentId, (imageRowsByParent.get(p.parentId) ?? 0) + 1)

  const cleanupRows: CleanupRow[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    categoria: r.categoria,
    archivo: r.archivo,
    placement: r.placement,
    imageRows: imageRowsByParent.get(r.id) ?? 0,
  }))

  const plan = planCleanup(cleanupRows, coveredByNewModel)
  if (plan.unsafe.length) flag(m3, formatUnsafe(plan.unsafe))

  // The migration's vacuity floor (`:125-130`).
  if (cleanupRows.some((r) => r.type === 'image') && plan.parents.length === 0)
    flag(m3, `no row would carry images[] — R23b-i's backfill would not have run on this database.`)

  // Named explicitly because they are the two things R50 asks to be confirmed by name, and
  // "planCleanup guarantees it" is a claim about code, not about this database's rows.
  const doomedIds = new Set(plan.doomed.map((r) => r.id))
  const parentsInDoomed = plan.parents.filter((r) => doomedIds.has(r.id))
  const caseStudies = rows.filter((r) => r.type !== 'image')
  const caseStudiesInDoomed = caseStudies.filter((r) => doomedIds.has(r.id))
  if (parentsInDoomed.length) flag(m3, `${parentsInDoomed.length} parent row(s) are in the delete set.`)
  if (caseStudiesInDoomed.length)
    flag(m3, `${caseStudiesInDoomed.length} caseStudy row(s) are in the delete set.`)

  // The DO block at `:183-203`, as a SELECT: would deleting these rows cascade into anything?
  // `projects_images` is not in this list yet — it does not exist until migration 1 — and its
  // future rows hang off parents, which are never doomed.
  const children = await q(`
    SELECT c.conrelid::regclass::text AS child, a.attname AS col
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f'
      AND c.confrelid = 'projects'::regclass
      AND c.conrelid NOT IN ('projects_locales'::regclass, 'payload_locked_documents_rels'::regclass)`)
  const cascade: string[] = []
  if (sourceName === 'live')
    for (const { child, col } of children as Array<{ child: string; col: string }>) {
      const [{ n }] = await q(`SELECT count(*)::int AS n FROM ${child} WHERE "${col}" = ANY($1::int[])`, [
        [...doomedIds],
      ])
      if (Number(n) > 0) {
        cascade.push(`${child}(${n} rows)`)
        flag(m3, `the rows marked redundant still own child rows: ${child} (${n}).`)
      }
    }

  // The enum-users check (`:250-266`) — nothing but the two columns going with them may use them.
  const enumUsers = await q(`
    SELECT c.relname AS "table", a.attname AS "column", t.typname AS "type"
    FROM pg_attribute a
    JOIN pg_type  t ON t.oid = a.atttypid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE t.typname IN ('enum_projects_placement', 'enum_projects_size')
      AND a.attnum > 0 AND NOT a.attisdropped AND c.relkind = 'r'`)
  const unexpectedEnumUsers = (enumUsers as Array<{ table: string; column: string }>).filter(
    (u) => !(u.table === 'projects' && ['placement', 'size'].includes(u.column)),
  )
  if (unexpectedEnumUsers.length)
    flag(
      m3,
      'these columns still use the enum types this migration drops: ' +
        unexpectedEnumUsers.map((u) => `${u.table}.${u.column}`).join(', '),
    )

  m3.detail = {
    projectsRowsRead: cleanupRows.length,
    parents: plan.parents.length,
    retainedNonImage: plan.retained.map((r) => `#${r.id} (${r.type})`),
    doomed: plan.doomed.length,
    unsafe: plan.unsafe.map((r) => `${r.categoria}|${r.archivo} #${r.id}: ${r.reason}`),
    parentsInDeleteSet: parentsInDoomed.map((r) => r.id),
    caseStudiesInDeleteSet: caseStudiesInDoomed.map((r) => r.id),
    deleteWouldCascadeInto: cascade,
    unexpectedEnumUsers,
    doomedIds: plan.doomed.map((r) => r.id),
  }
  verdicts.push(m3)

  // ===========================================================================================
  // THE RESULTING SHAPE — derived from the three projections above, never asserted.
  // ===========================================================================================
  report.after = {
    projectsRows: cleanupRows.length - plan.doomed.length,
    ofWhichParents: plan.parents.length,
    ofWhichNonImage: plan.retained.length,
    clients: clients.length,
    projectsImages: projected.length,
    showOnHomeImages: homeImages.length,
    rowsDeleted: plan.doomed.length,
    // Every surviving Proyecto by name, because "21 parents" is a number and the owner will
    // read a list. `parentId` is the EXISTING row that becomes the parent — no row is created.
    projects: [...groups.keys()].map((gkey) => ({
      project: gkey,
      parentId: parentIdByGroup.get(gkey)!,
      images: projected.filter((p) => p.parentId === parentIdByGroup.get(gkey)).length,
    })),
    perCategoria: [...new Set(projected.map((p) => p.categoria))].sort().map((cat) => ({
      categoria: cat,
      projects: [...groups.keys()].filter((k) => k.startsWith(`${cat}|`)).length,
      images: projected.filter((p) => p.categoria === cat).length,
      onHome: projected.filter((p) => p.categoria === cat && p.showOnHome).length,
      onPage: projected.filter((p) => p.categoria === cat && p.showOnPage).length,
    })),
  }

  // ===========================================================================================
  // THE STAGED UPLOADS — R45 found 14 of them (`2.jpg`…`15.jpg`) attached to nothing. If one
  // has been attached since, every count above describes a database that no longer exists.
  //
  // Every FK into `media` is walked, so "attached" means attached ANYWHERE, not just to a
  // project — MINUS two tables that are not attachments and would each hide a staged upload:
  //   payload_locked_documents_rels  transient admin edit-lock state. Merely OPENING a media
  //                                  document in the admin puts a row here, so counting it
  //                                  reports "attached" for a file nobody placed. Measured: it
  //                                  is what made `15.jpg` disappear from this list on the
  //                                  first run of this script.
  //   media_locales                  the media document's OWN localized fields. Every media row
  //                                  points at itself through it.
  // ===========================================================================================
  const NOT_AN_ATTACHMENT = new Set(['payload_locked_documents_rels', 'media_locales'])
  const mediaFks = (await q(`
    SELECT c.conrelid::regclass::text AS child, a.attname AS col
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.confrelid = 'media'::regclass`)) as Array<{
    child: string
    col: string
  }>
  const contentFks = mediaFks.filter((f) => !NOT_AN_ATTACHMENT.has(f.child.replace(/^public\./, '')))
  const refRows = contentFks.length
    ? await q(
        contentFks
          .map(
            ({ child, col }) =>
              `SELECT '${child}.${col}' AS src, x."${col}" AS media_id, count(*)::int AS n ` +
              `FROM ${child} x WHERE x."${col}" IS NOT NULL GROUP BY 1, 2`,
          )
          .join(' UNION ALL '),
      )
    : []
  const refsByMedia = new Map<number, string[]>()
  for (const r of refRows)
    refsByMedia.set(Number(r.media_id), [
      ...(refsByMedia.get(Number(r.media_id)) ?? []),
      `${r.src}×${r.n}`,
    ])

  const media = await q(`SELECT "id", "filename", "created_at" FROM "media" ORDER BY "id"`)
  const described = (r: any) => ({
    id: Number(r.id),
    filename: r.filename as string,
    created: r.created_at,
    attachedVia: refsByMedia.get(Number(r.id)) ?? [],
  })
  const unattached = media.map(described).filter((m) => m.attachedVia.length === 0)
  report.media = {
    total: media.length,
    countedAsAttachment: contentFks.map((f) => `${f.child}.${f.col}`),
    ignoredAsNotAnAttachment: mediaFks
      .filter((f) => NOT_AN_ATTACHMENT.has(f.child.replace(/^public\./, '')))
      .map((f) => `${f.child}.${f.col}`),
    unattached,
    // R45's staged batch is named `<n>.jpg`. Listed by name, attached or not, so "still 14" is
    // read off the report rather than inferred from a total that could move for other reasons.
    numericallyNamed: media.map(described).filter((m) => /^\d+\.[a-z0-9]+$/i.test(m.filename)),
  }

  // ===========================================================================================
  // Verdict, report, exit code.
  // ===========================================================================================
  const clean = verdicts.every((v) => v.clean)
  report.verdicts = verdicts
  report.pendingHere = pending
  report.goNoGo = clean
    ? 'GO — all three migrations would apply cleanly against this database.'
    : 'NO-GO — at least one migration would abort. See verdicts[].findings.'

  const line = (s = '') => s
  const summary = [
    `R23 promotion pre-flight — ${target} (${host})`,
    `source table: ${source.projects} · read-only · ${report.measuredAt}`,
    line(),
    `pending here: ${pending.length ? pending.join(', ') : 'none — all three already applied'}`,
    line(),
    `BEFORE  ${(report.before as any).projectsRows} projects rows ` +
      `(${(report.before as any).imageRows} with an image, ${(report.before as any).caseStudyRows} not) · ` +
      `${(report.before as any).media} media`,
    ...verdicts.map(
      (v) =>
        `${v.clean ? '✓' : '✗'} ${v.migration}` +
        (v.findings.length ? `\n    ${v.findings.join('\n    ')}` : ''),
    ),
    `AFTER   ${(report.after as any).projectsRows} projects rows ` +
      `(${(report.after as any).ofWhichParents} parents + ${(report.after as any).ofWhichNonImage} non-image) · ` +
      `${(report.after as any).clients} clients · ${(report.after as any).projectsImages} images · ` +
      `${(report.after as any).rowsDeleted} rows deleted`,
    `unattached media: ${unattached.length}`,
    line(),
    report.goNoGo as string,
  ].join('\n')

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
  fs.writeFileSync(`${OUT}.txt`, `${summary}\n`)
  // eslint-disable-next-line no-console
  console.log(`${summary}\n\nfull report: ${OUT}`)

  process.exit(clean ? 0 : 1)
}

await main()
