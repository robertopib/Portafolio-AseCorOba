import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { R23_CLIENT_MAP } from '../lib/r23/clientMap.generated'
import { clientNames as distinctClientNames, projectKey } from '../lib/r23/parseWorksheet'
import { reconcile, formatUnknown, photoKey, type DbPhotograph } from '../lib/r23/reconcile'

/**
 * R23b-i — Clientes, Proyecto parents, images[].  ADDITIVE ONLY.
 *
 * Spec: docs/delivery/r23-target-model.md §5.1 (schema) and §5.2 (backfill).
 * Input: docs/delivery/r23-backfill-mapping.md, the owner's completed client worksheet,
 * parsed into ../lib/r23/clientMap.generated.ts.
 *
 * The DDL in `up` is `payload migrate:create` output, unedited. The backfill below it is
 * hand-written, and lives in the migration rather than a `payload run` script because
 * production applies this through `payload migrate` (RELEASE.md) and preview through the
 * CMS `ci:build` — a script would land the schema on those environments without the data.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It drops nothing and deletes no rows. The old
 * `placement` / `image` / `alt` / `categoryLabel` / `order` / `size` columns stay populated
 * and both content emitters keep reading them, so this migration changes ZERO bytes of
 * published output. That is the entire safety argument: only one thing changed, so an
 * unchanged export is unambiguous evidence the backfill is faithful. R23b-ii switches the
 * emitters over and only then removes the 37 now-redundant rows and the old columns.
 *
 * `down` was CORRECTED, once, before this migration was ever committed. The generator
 * emitted `DROP TABLE "clients" CASCADE` followed by `ALTER TABLE "projects" DROP CONSTRAINT
 * "projects_cliente_id_clients_id_fk"` — but the CASCADE has already removed that
 * constraint, so the statement failed with *constraint … does not exist* (measured, not
 * theorised). §5.4 called this exact hazard: `down` must drop in FK order. See `down`.
 *
 * ── AMENDED BY R49, 2026-08-11 ─────────────────────────────────────────────────────────────
 * This file's `EXPECTED = { images: 40, clients: 16, projects: 20, sourceRows: 57 }` census was
 * replaced by a one-directional set comparison (`../lib/r23/reconcile.ts`). R45 measured
 * production at **58 rows / 41 media** against dev's 57 / 40 — the owner added a photograph in
 * the prod admin — so the census made the migration inapplicable to production, and widening it
 * would have made it inapplicable to dev. The two databases legitimately differ and will keep
 * differing. What the backfill needs is that no row is silently orphaned, which is a set
 * comparison and is true of both. See `reconcile.ts` for the full argument.
 *
 * **Editing an applied migration is normally forbidden, and this is the narrow exception.** That
 * rule protects a migration applied somewhere you cannot roll back. This one is applied on **dev
 * only** — prod's `migrate:status` reads `Ran: No` (R45) — dev is disposable, and R23b-i
 * *demonstrated* `down` → `up` clean and idempotent with a byte-identical export afterwards. Dev
 * was rolled back and re-applied as part of R49, so no database anywhere holds the old backfill
 * while this file describes a new one. **This is not licence to edit other applied migrations.**
 *
 * ── AMENDED BY R55, 2026-08-13: THE LOCAL API IS GONE FROM THIS FILE ────────────────────────
 * **The 2026-08-12 promotion failed here, at what used to be `:190`.** From the production
 * build log:
 *
 *     column projects_images__locales.home_alt does not exist
 *       at 20260811_114118_r23_clientes_images.ts:190 → payload.find({ collection: 'projects' })
 *
 * `payload.find` builds its query from **today's config**, and today's config carries `homeAlt`
 * — added by the NEXT migration, `20260812_015822_r23_home_order_alt`. This one runs first, so
 * the column does not exist yet. **A migration that uses the Local API reads through the FINAL
 * config, not the config as of when it was written**, so the chain works incrementally and
 * fails from scratch — which is the state every fresh database is in. Dev never caught it
 * because dev never ran the chain in sequence: this migration ran when the config had no
 * `homeAlt`, and the next one added it later. Production runs all three back-to-back.
 *
 * **The reasoning already existed, one migration too late.** `20260812_015822_r23_home_order_alt`
 * `:53-54` — *"WHY THE BACKFILL IS SQL AND NOT `payload.update`, UNLIKE R23b-i"* — recorded that
 * the Local API silently drops localized array sub-fields and moved to SQL. Nobody came back and
 * applied it here. Now applied: **every database access below is raw SQL.** `payload.logger` is
 * not database access and stays.
 *
 * **A second, independent break the build log never got far enough to show.** R23b-iii removed
 * `placement` / `image` / `order` / `alt` / `categoryLabel` from `collections/Projects.ts`
 * entirely, and the row mapper below reads exactly those five off the document. So even with
 * `home_alt` present, `payload.find` would return documents with `image` undefined, the
 * `image != null` filter would drop EVERY row, reconciliation would cover nothing, the
 * `imagesWritten === covered.length` self-check would pass at 0 === 0, and this migration would
 * log success having written nothing. (R23b-iii's vacuity floor would then abort the chain — the
 * net holds, but the point stands.) **The Local API can no longer read the old model on any
 * database.** Raw SQL can, because the COLUMNS still exist at this point in the chain; R23b-iii
 * is what drops them.
 *
 * Guarded going forward by `scripts/ci/check-migrations.mjs`, which hard-fails any migration
 * using the Local API, and by `scripts/replay-migrations.sh`, which applies the whole chain to
 * an empty database. Both landed with R55, because the missing test was the obvious one nobody
 * ran.
 */

/** Rows are `{ rows: [...] }` on the pg driver and a bare array on some paths. Same shim as R23b-ii. */
const rowsOf = (r: any): any[] => (Array.isArray(r) ? r : (r?.rows ?? []))

/** The two locales, in `_locales` enum order. Localized array rows get one row each, always. */
const LOCALES = ['es', 'en'] as const

/**
 * Payload writes `projects_images.id` — a `varchar` primary key with no database default — as a
 * **BSON ObjectId hex string**, not a UUID. Measured on dev, not assumed: the rows this migration
 * created read `6a7b568aa00b61ebcfaeb76d`, `…6e`, `…6f` — 4-byte timestamp, a 5-byte
 * per-process random, and a 3-byte incrementing counter.
 *
 * Reproduced here rather than imported. `bson-objectid` is a dependency of `payload`, not of this
 * package, so importing it would be a phantom dependency that resolves locally under pnpm's
 * hoisting and could vanish on a Vercel install. Twenty lines beats that risk, and keeping the
 * shape means an id generated by this migration is indistinguishable from one the admin writes.
 */
const OID_MACHINE = [...crypto.getRandomValues(new Uint8Array(5))]
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('')
let oidCounter = crypto.getRandomValues(new Uint32Array(1))[0]! % 0xffffff

const nextObjectId = (): string => {
  oidCounter = (oidCounter + 1) % 0x1000000
  return (
    Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, '0') +
    OID_MACHINE +
    oidCounter.toString(16).padStart(6, '0')
  )
}

/**
 * A labelled vacuity floor, not a census (`docs/testing-standards.md` §2's idiom). R49 removed
 * every count-equality assertion; this one exists only so that "the generated map was empty, so
 * the backfill wrote nothing and reported success" fails instead of passing green.
 */
const MIN_WORKSHEET_ENTRIES = 1

type Loc = { es?: string | null; en?: string | null } | null

type Row = {
  id: number
  categoria: string
  archivo: string
  placement: string
  group: string | null
  size: string | null
  order: number
  imageId: number
  internalTitle: string | null
  title: Loc
  alt: Loc
  categoryLabel: Loc
}

const fail = (msg: string): never => {
  throw new Error(`[R23b-i backfill] ${msg}`)
}

/**
 * The `order` for the ONE image that is on home and in no page array — `fisio-equina.png`.
 *
 * Every other image inherits `order` verbatim from its page row. This one has no page row,
 * so a value has to be derived, and getting it wrong would silently reorder the branding
 * home preview in R23b-ii. It is derived rather than picked: within a categoría, every image
 * that has BOTH rows shows a constant offset between the two placements' sequences (branding
 * stores home 0-based and page 1-based, so the offset is 1), and applying that offset lands
 * `fisio-equina` on exactly the number missing from the published page sequence — the gap at
 * 4 that §2.4 says exists *because of* this image. Both facts are asserted; either failing
 * aborts rather than guessing.
 */
function deriveHomeOnlyOrder(
  categoria: string,
  homeOrder: number,
  paired: Array<{ home: number; page: number }>,
  pageOrders: Set<number>,
): number {
  if (paired.length === 0)
    fail(`${categoria}: a home-only image, but no image with both placements to derive an offset from.`)

  const offsets = [...new Set(paired.map((p) => p.page - p.home))]
  if (offsets.length !== 1)
    fail(
      `${categoria}: home and page sequences do not share one offset (saw ${offsets.join(', ')}), ` +
        'so the position of a home-only image cannot be derived. Resolve by hand.',
    )

  const derived = homeOrder + offsets[0]!
  if (pageOrders.has(derived))
    fail(`${categoria}: derived order ${derived} for the home-only image is already taken by a page row.`)
  return derived
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // ---------------------------------------------------------------------------
  // Schema — `payload migrate:create` output, unedited. §5.1's five objects:
  // clients; projects.cliente_id (+FK, +index); payload_locked_documents_rels.clients_id
  // (+FK) — the one easy to miss by hand; projects_images; projects_images_locales.
  // No `clients_locales`: `name` is not localized, so there is nothing to put in it.
  // ---------------------------------------------------------------------------
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_images_size" AS ENUM('small', 'medium', 'large', 'wide', 'tall');
  CREATE TABLE "clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "projects_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"order" numeric NOT NULL,
  	"size" "enum_projects_images_size",
  	"show_on_page" boolean DEFAULT true,
  	"show_on_home" boolean
  );

  CREATE TABLE "projects_images_locales" (
  	"alt" varchar,
  	"category_label" varchar,
  	"home_title" varchar,
  	"home_category_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "projects" ADD COLUMN "cliente_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "projects_images" ADD CONSTRAINT "projects_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_images" ADD CONSTRAINT "projects_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_images_locales" ADD CONSTRAINT "projects_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_images"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
  CREATE INDEX "projects_images_order_idx" ON "projects_images" USING btree ("_order");
  CREATE INDEX "projects_images_parent_id_idx" ON "projects_images" USING btree ("_parent_id");
  CREATE INDEX "projects_images_image_idx" ON "projects_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "projects_images_locales_locale_parent_id_unique" ON "projects_images_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cliente_id_clients_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_cliente_idx" ON "projects" USING btree ("cliente_id");
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");`)

  // ===========================================================================
  // Backfill — §5.2 steps 1-5. (Step 6, deleting the redundant rows, is R23b-ii:
  // it is the only destructive step and must not run until byte-identity has been
  // proved on preview AND production.)
  // ===========================================================================

  // --- Check 0: the worksheet, before the database is read at all. ----------
  // A blank cell already throws in parseWorksheet() and the committed map is pinned to the
  // worksheet by tests/unit/r23-worksheet.test.ts, so there is nothing left to assert here
  // beyond the vacuity floor. R49 deleted the three census checks that used to live here —
  // they described dev, and production is a different, equally valid shape.
  const entries = R23_CLIENT_MAP
  if (entries.length < MIN_WORKSHEET_ENTRIES)
    fail('clientMap.generated.ts holds no entries, so there is nothing to backfill. Regenerate it.')

  // --- Read the database. RAW SQL ONLY — see the R55 amendment in the header. -----------------
  // `categories.name` is localized, so it lives in `categories_locales`. The Local API call this
  // replaces passed no `locale`, so it received the DEFAULT locale's string
  // (`payload.config.ts:96` — `defaultLocale: 'es'`), which is why only `es` is read here. The
  // only two things anything downstream wants are the slug-by-id map and that display name.
  const esNameBySlug = new Map<string, string>()
  const slugById = new Map<number, string>()
  for (const c of rowsOf(
    await db.execute(sql`
      SELECT c."id", c."slug", cl."name", cl."_locale"
      FROM "categories" c
      LEFT JOIN "categories_locales" cl ON cl."_parent_id" = c."id"
      ORDER BY c."id"`),
  )) {
    slugById.set(Number(c.id), String(c.slug))
    if (c._locale === 'es' && c.name != null) esNameBySlug.set(String(c.slug), String(c.name))
  }

  // `LEFT JOIN`, not `JOIN`, on both `categories` and `media`. An inner join would silently drop
  // a project pointing at an unknown categoría or an unknown media row; the two `fail()`s below
  // must keep aborting by name instead, which is what they were written to do.
  const projectRows = rowsOf(
    await db.execute(sql`
      SELECT p."id",
             c."slug"            AS "categoria",
             m."filename"        AS "archivo",
             p."placement"::text AS "placement",
             p."group"           AS "group",
             p."size"::text      AS "size",
             p."order"           AS "order",
             p."image_id"        AS "image_id",
             p."internal_title"  AS "internal_title",
             pl."_locale"        AS "_locale",
             pl."title"          AS "title",
             pl."alt"            AS "alt",
             pl."category_label" AS "category_label"
      FROM "projects" p
      LEFT JOIN "categories"       c  ON c."id"          = p."category_id"
      LEFT JOIN "media"            m  ON m."id"          = p."image_id"
      LEFT JOIN "projects_locales" pl ON pl."_parent_id" = p."id"
      WHERE p."image_id" IS NOT NULL
      ORDER BY p."id", pl."_locale"`),
  )

  // One `Row` per project, folding its (at most two) locale rows back into the `{ es, en }` shape
  // `locale: 'all'` used to hand over. Everything below this point is untouched by R55.
  const byId = new Map<number, Row>()
  for (const r of projectRows) {
    const pid = Number(r.id)
    let row = byId.get(pid)
    if (!row) {
      row = {
        id: pid,
        categoria: r.categoria ?? fail(`project ${pid} has no known categoría.`),
        archivo: r.archivo ?? fail(`project ${pid} points at unknown media.`),
        placement: String(r.placement),
        group: r.group ?? null,
        size: r.size ?? null,
        order: Number(r.order),
        imageId: Number(r.image_id),
        internalTitle: r.internal_title ?? null,
        title: null,
        alt: null,
        categoryLabel: null,
      }
      byId.set(pid, row)
    }
    if (r._locale === 'es' || r._locale === 'en') {
      const loc = r._locale as 'es' | 'en'
      row.title = { ...(row.title ?? {}), [loc]: r.title }
      row.alt = { ...(row.alt ?? {}), [loc]: r.alt }
      row.categoryLabel = { ...(row.categoryLabel ?? {}), [loc]: r.category_label }
    }
  }
  const rows: Row[] = [...byId.values()]

  // --- Index the rows by photograph, and reconcile with the worksheet. ------
  const onPage = (r: Row) => r.placement === 'page' || r.placement === 'both'
  const onHome = (r: Row) => r.placement === 'home' || r.placement === 'both'

  const photos = new Map<string, { page?: Row; home?: Row }>()
  for (const r of rows) {
    const k = photoKey(r.categoria, r.archivo)
    const slot = photos.get(k) ?? {}
    if (onPage(r)) {
      if (slot.page) fail(`${k} has two page rows (${slot.page.id}, ${r.id}).`)
      slot.page = r
    }
    if (onHome(r)) {
      if (slot.home) fail(`${k} has two home rows (${slot.home.id}, ${r.id}).`)
      slot.home = r
    }
    photos.set(k, slot)
  }

  // --- THE gate (R49). One direction is fatal, the other is a note. ---------
  // Fatal: a photograph in the database that the worksheet never describes. It would receive no
  // parent, and R23b-ii deletes unparented rows — so it aborts, before the first write, naming
  // the file. This is the assertion that used to be `rows.length !== 57`, doing the job that one
  // was standing in for, on any database.
  // Informational: a worksheet answer with no row behind it. That used to abort too, and it is
  // exactly what dev looks like now — `1.jpg` exists only in production. It is not an error for
  // a database to hold a subset of the photographs the worksheet describes.
  const state = reconcile(
    entries,
    new Map<string, DbPhotograph>(
      [...photos].map(([k, slot]) => {
        const r = (slot.page ?? slot.home)!
        return [k, { id: r.id, placement: r.placement }]
      }),
    ),
  )
  if (state.unknown.length) fail(formatUnknown(state.unknown))
  if (state.unused.length)
    payload.logger.info(
      `[R23b-i] ${state.unused.length} worksheet entr${state.unused.length === 1 ? 'y describes a photograph' : 'ies describe photographs'} ` +
        `this database does not hold — skipped, not an error: ${state.unused.join(', ')}`,
    )

  // Everything below backfills from `covered` — the entries this database actually has rows for.
  // Deriving the clients from it too (rather than from the whole worksheet) is what stops a
  // client whose only photograph is missing here becoming an orphan `clients` row.
  const covered = state.covered
  const clientNames = distinctClientNames(covered)

  const groups = new Map<string, typeof covered>()
  for (const e of covered) {
    const k = projectKey(e)
    groups.set(k, [...(groups.get(k) ?? []), e])
  }

  // --- Per-categoría sequence facts, for the one home-only image. -----------
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

  // --- Step 1: the clients. One row per distinct NAME across the whole -------
  // worksheet, not per categoría: a client with work in two categorías is one client and
  // two proyectos (§3.0 decision 2 — `OFF DAY Trainer` is the live case).
  // One INSERT per name, in `clientNames` order, so the serial ids land exactly as the
  // `payload.create` loop this replaces assigned them. `updated_at` / `created_at` default to
  // now() in the DDL above, which is what Payload would have written.
  const clientIdByName = new Map<string, number>()
  for (const name of clientNames) {
    const inserted = rowsOf(
      await db.execute(sql`INSERT INTO "clients" ("name") VALUES (${name}) RETURNING "id"`),
    )
    const newId = Number(inserted[0]?.id)
    if (!Number.isInteger(newId)) fail(`inserting client '${name}' returned no id.`)
    clientIdByName.set(name, newId)
  }

  // --- Steps 2-5: one parent per (cliente, categoría), carrying its images. --
  let imagesWritten = 0
  for (const [gkey, groupEntries] of groups) {
    const categoria = groupEntries[0]!.categoria
    const cliente = groupEntries[0]!.cliente

    const built = groupEntries.map((e) => {
      const slot = photos.get(photoKey(e.categoria, e.archivo))!
      const { page, home } = slot
      // The page row is the primary source; a home-only photograph falls back to its home
      // row. Branding home rows carry `alt` but no `title`/`categoryLabel`, and non-branding
      // home rows carry `title`/`categoryLabel` but no `alt` (§2.2) — so the same four
      // assignments below are correct for every category with no special-casing.
      const src = (page ?? home)!
      const order = page
        ? page.order
        : deriveHomeOnlyOrder(
            categoria,
            home!.order,
            pairedByCat.get(categoria) ?? [],
            pageOrdersByCat.get(categoria) ?? new Set(),
          )
      return {
        order,
        src,
        row: {
          image: src.imageId,
          alt: src.alt ?? undefined,
          categoryLabel: src.categoryLabel ?? undefined,
          order,
          size: src.size ?? undefined,
          showOnPage: Boolean(page),
          showOnHome: Boolean(home),
          homeTitle: home?.title ?? undefined,
          homeCategoryLabel: home?.categoryLabel ?? undefined,
        },
      }
    })

    built.sort((a, b) => a.order - b.order)

    // The parent is an EXISTING row — the lowest-order page row, falling back to the home
    // row for the one project that has none (`fisio-equina`). It keeps its own old columns
    // untouched; it just gains `cliente` and `images[]`.
    const pageCandidates = built.filter((b) => b.src.placement !== 'home')
    const parent = (pageCandidates.length ? pageCandidates : built)[0]!.src

    // §3.1 claims every image of a project shares one `group`, because a group is a layout
    // slot and a project renders in exactly one. Assert it rather than inherit it blindly.
    for (const b of built)
      if (b.src.group !== parent.group)
        fail(`${gkey}: image ${b.src.archivo} is in group ${b.src.group}, parent is ${parent.group}.`)

    // §5.2 step 2 — "set internalTitle to the project name". The project name is the pair
    // that defines it: `<Cliente> — <Categoría>`. It is the only form that tells the two
    // OFF DAY Trainer projects apart in the admin list. Client-less projects keep the name
    // the row already had; there is no client to name them after.
    const catLabel = esNameBySlug.get(categoria) ?? categoria
    const internalTitle = cliente ? `${cliente} — ${catLabel}` : parent.internalTitle

    // The parent. `cliente_id` was NULL a few statements ago (the column is added by this
    // migration's own DDL), so writing NULL for a client-less project is exactly what the
    // `cliente: … : undefined` branch amounted to. `updated_at` is bumped because
    // `payload.update` bumped it.
    await db.execute(sql`
      UPDATE "projects"
      SET "cliente_id"     = ${cliente ? (clientIdByName.get(cliente) ?? null) : null},
          "internal_title" = ${internalTitle},
          "updated_at"     = now()
      WHERE "id" = ${parent.id}`)

    // The images. `_order` is 1-based and contiguous per parent (measured on dev, where Payload
    // wrote it), over `built` — which is already sorted by `order` above.
    for (const [index, b] of built.entries()) {
      const rowId = nextObjectId()
      await db.execute(sql`
        INSERT INTO "projects_images"
          ("_order", "_parent_id", "id", "image_id", "order", "size", "show_on_page", "show_on_home")
        VALUES (${index + 1}, ${parent.id}, ${rowId}, ${b.row.image}, ${b.row.order},
                ${b.row.size ?? null}::"enum_projects_images_size",
                ${b.row.showOnPage}, ${b.row.showOnHome})`)

      // ONE LOCALE ROW PER LOCALE, ALWAYS — 2 per image, which is what Payload wrote (measured:
      // 80 locale rows for 40 images, every image with both). This is not cosmetic. R23b-ii's
      // `home_alt` backfill is an `UPDATE … FROM` against this table and inserts nothing, so an
      // image missing a locale row here would silently keep `home_alt` NULL — the exact
      // "green run with the work not done" shape R23b-ii was written to stop.
      for (const locale of LOCALES) {
        await db.execute(sql`
          INSERT INTO "projects_images_locales"
            ("_parent_id", "_locale", "alt", "category_label", "home_title", "home_category_label")
          VALUES (${rowId}, ${locale}::"_locales",
                  ${b.row.alt?.[locale] ?? null},
                  ${b.row.categoryLabel?.[locale] ?? null},
                  ${b.row.homeTitle?.[locale] ?? null},
                  ${b.row.homeCategoryLabel?.[locale] ?? null})`)
      }
    }

    imagesWritten += built.length
  }

  // Not a census — a self-check that the write loop wrote what the reconciliation planned. It
  // holds at 40 on dev and at 41 on production because both sides are derived from the same
  // `covered`, which is the point of R49's change.
  if (imagesWritten !== covered.length)
    fail(`wrote ${imagesWritten} image rows, but reconciliation covered ${covered.length}.`)

  payload.logger.info(
    `[R23b-i] backfilled ${clientIdByName.size} clients, ${groups.size} project parents, ` +
      `${imagesWritten} images from ${rows.length} rows.`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // CORRECTED FROM THE GENERATOR — see the header. The order below is §5.4's, and it is not
  // cosmetic: `clients` must go LAST, after both columns that reference it, because
  // `DROP TABLE clients CASCADE` silently removes those FK constraints and the generated
  // `ALTER TABLE … DROP CONSTRAINT` that followed then failed outright.
  //
  // This destroys the `clients` rows and every `projects.cliente_id` — the only NEW data in
  // this migration rather than moved data. That is acceptable and planned for: the completed
  // worksheet is the durable source, it is committed to git, and re-running `up` reconstructs
  // both exactly. The pre-existing `projects` rows are never touched by either direction —
  // whether there are 57 of them (dev) or 58 (production).
  await db.execute(sql`
   ALTER TABLE "clients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_images_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_images_locales" CASCADE;
  DROP TABLE "projects_images" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_cliente_id_clients_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_clients_fk";
  DROP INDEX IF EXISTS "projects_cliente_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_clients_id_idx";
  ALTER TABLE "projects" DROP COLUMN "cliente_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clients_id";
  DROP TABLE "clients" CASCADE;
  DROP TYPE "public"."enum_projects_images_size";`)
}
