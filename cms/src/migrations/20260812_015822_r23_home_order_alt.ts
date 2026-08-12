import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * R23b-ii — the two home-side facts `images[]` was missing.  ADDITIVE ONLY.
 *
 * ── WHY THIS EXISTS, GIVEN THE DESIGN SAID IT DID NOT NEED TO ────────────────────────────────
 * `r23-target-model.md` §3.2 declined a home-side order: *"Home order equals page order in all
 * four categories (§2.1), and branding's single `order` sequence spans both placements (§2.4).
 * Sorting the flattened image rows by their own `order` … reproduces every array."*
 *
 * The first half of that is **false in two of the four categorías**, measured on dev:
 *
 *     branding    home 1,2,3,4,5      page 1,2,3,5,…,21     offset 1 on every image
 *     fotografía  gift-box-vinte.png  home 5 / page 8       no constant offset at all
 *
 * The second half is true and survives — *sorting* by the page order does reproduce every
 * array. What it misses is that `content/pages.json` **publishes** the home number: a
 * CategoryGallery block with `placement: 'home'` emits `id: p.order` read from the home row,
 * which is 0-based-contiguous in all four home blocks today. Read from `images[].order`
 * instead, branding's home block emits `1,2,3,4,5` where `0,1,2,3,4` is committed, and
 * fotografía's last card emits `8` where `5` is committed.
 *
 * And a second loss §3.2 does not mention at all: the home card's **alt**. Thirteen
 * non-branding home cards in `pages.json` publish `{"es":"","en":""}`, because their home rows
 * carry no alt while the page rows do. `images[].alt` holds the page row's text, so emitting it
 * would rewrite all thirteen. Branding is the mirror case — its home rows *do* carry an alt,
 * byte-identical to the page one (§2.2), which is why the loss stayed invisible in the design.
 *
 * Nineteen published values in one file. Byte-identity is R23b's entire safety argument, so the
 * facts get stored rather than guessed. The alternative — deriving the id from the card's index
 * and the alt from "does this image have a homeTitle?" — reproduces today's bytes and invents a
 * number the first time an editor reorders anything. The old home rows are still in `projects`
 * (R23b-iii deletes them, deliberately after the promotion), so the true values are right there.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT DO ───────────────────────────────────────────────────────
 * Drops nothing, deletes no row, and touches no old column. `up` adds two nullable columns and
 * fills them; `down` drops exactly those two. The 17 redundant `projects` rows and the old
 * `placement`/`image`/`alt`/`categoryLabel`/`order`/`size` columns are R23b-iii's, after
 * byte-identity has been proved on production and not before.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────────────────────────
 * The DDL is `payload migrate:create` output, unedited. The backfill below it is hand-written
 * and lives in the migration, not a `payload run` script, for the same reason R23b-i's does:
 * production applies through `payload migrate` and preview through `ci:build`, so a script would
 * land the schema on those environments without the data.
 *
 * Written to run on **both** a 57/40 database (dev) and a 58/41 one (production) — R49's lesson.
 * It asserts nothing about counts. It asserts a correspondence: every image flagged
 * `showOnHome` must have a surviving home row to read from, and it names the photograph if one
 * does not. Production's `1.jpg` is `placement: 'both'`, which IS its own home row, so it
 * resolves with no special case.
 *
 * ── WHY THE BACKFILL IS SQL AND NOT `payload.update`, UNLIKE R23b-i ──────────────────────────
 * **Measured, not preferred.** `payload.update({ locale: 'all', data: { images } })` on an array
 * whose rows already exist **silently drops every localized sub-field**. Probed directly on dev
 * before writing this: setting `alt`, `homeTitle` and `homeAlt` on one existing `images[]` row
 * and reading it back returned the original values unchanged, while the non-localized
 * `homeOrder` in the same object went 0 → 99 → 0 exactly as asked. No error, no warning.
 *
 * R23b-i did not hit this because `images[]` was empty there: every row was an INSERT, and the
 * insert path does write `projects_images_locales`. This migration UPDATEs rows that R23b-i
 * created, which is the path that loses them. The first draft of this file used the Payload API,
 * reported `18 of 18` backfilled, and left `home_alt` NULL in all 18 — a green run with the work
 * not done. That is the failure mode this project keeps finding (R13a's exit code, R23b-i's
 * `git diff` gate), so it is recorded here rather than just fixed.
 *
 * Deleting and re-inserting every array row would also work, but it churns 40 rows and their
 * ids to write 5 strings. Two `UPDATE … FROM` statements say exactly what is meant.
 */

const fail = (msg: string): never => {
  throw new Error(`[R23b-ii home backfill] ${msg}`)
}

/** Rows are `{ rows: [...] }` on the pg driver and a bare array on some paths. */
const rowsOf = (r: any): any[] => (Array.isArray(r) ? r : (r?.rows ?? []))

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_images" ADD COLUMN "home_order" numeric;
  ALTER TABLE "projects_images_locales" ADD COLUMN "home_alt" varchar;`)

  // --- Pre-check: the match must be unique. -----------------------------------------------
  // Both UPDATEs below join a photograph to its home row on (categoría, media). If a categoría
  // ever held two home rows for one photograph, Postgres would pick one arbitrarily and the
  // published home order would be a coin flip. R23b-i asserts this invariant at backfill time;
  // assert it again here rather than inherit it, because production is edited between the two.
  const dupes = rowsOf(
    await db.execute(sql`
      SELECT category_id, image_id, count(*) AS n
      FROM projects
      WHERE "type" = 'image' AND placement IN ('home', 'both') AND image_id IS NOT NULL
      GROUP BY category_id, image_id
      HAVING count(*) > 1`),
  )
  if (dupes.length)
    fail(
      `${dupes.length} photograph(s) have more than one home row, so the home order cannot be ` +
        `matched unambiguously: ` +
        dupes.map((d: any) => `categoría ${d.category_id}/media ${d.image_id} ×${d.n}`).join(', '),
    )

  // --- The backfill. Two statements, one per table. ----------------------------------------
  // `hp` is the surviving home row: same categoría as the image's PARENT project, same media,
  // placement home or both. A `both` row is its own home row (R46), which is why production's
  // `1.jpg` needs no special case.
  await db.execute(sql`
    UPDATE "projects_images" pi
    SET "home_order" = hp."order"
    FROM "projects" parent, "projects" hp
    WHERE pi."_parent_id" = parent."id"
      AND hp."category_id" = parent."category_id"
      AND hp."image_id" = pi."image_id"
      AND hp."type" = 'image'
      AND hp."placement" IN ('home', 'both')
      AND pi."show_on_home" = true`)

  // The 13 non-branding home rows carry NO alt, so this leaves `home_alt` NULL for them — which
  // is the correct published value (`loc(null)` → `{"es":"","en":""}`). Only branding's five
  // home rows have alt text to copy. NOTHING here may fall back to the image's own `alt`: that
  // is the PAGE text, and publishing it would rewrite 13 cards.
  await db.execute(sql`
    UPDATE "projects_images_locales" pil
    SET "home_alt" = hpl."alt"
    FROM "projects_images" pi, "projects" parent, "projects" hp, "projects_locales" hpl
    WHERE pil."_parent_id" = pi."id"
      AND pi."_parent_id" = parent."id"
      AND hp."category_id" = parent."category_id"
      AND hp."image_id" = pi."image_id"
      AND hp."type" = 'image'
      AND hp."placement" IN ('home', 'both')
      AND hpl."_parent_id" = hp."id"
      AND hpl."_locale" = pil."_locale"
      AND pi."show_on_home" = true`)

  // --- The assertion that matters, and it names the photograph. ----------------------------
  // Not a count: a correspondence. Every image the backfill flagged for home must have found a
  // home row to read its published position from. One that did not would emit a wrong id into
  // content/pages.json — silently, because `null` sorts and renders without complaint.
  const orphans = rowsOf(
    await db.execute(sql`
      SELECT pi."id", pi."image_id", m."filename", c."slug" AS categoria
      FROM "projects_images" pi
      JOIN "projects" parent ON parent."id" = pi."_parent_id"
      LEFT JOIN "categories" c ON c."id" = parent."category_id"
      LEFT JOIN "media" m ON m."id" = pi."image_id"
      WHERE pi."show_on_home" = true AND pi."home_order" IS NULL`),
  )
  if (orphans.length)
    fail(
      `${orphans.length} image(s) are flagged showOnHome but no surviving projects row with ` +
        `placement home/both carries that photograph, so the published home position cannot be ` +
        `recovered: ` +
        orphans.map((o: any) => `${o.categoria}/${o.filename ?? `media ${o.image_id}`}`).join(', ') +
        `. Resolve by hand before migrating.`,
    )

  const [{ n: filled }] = rowsOf(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM "projects_images" WHERE "show_on_home" = true`),
  )
  const [{ n: withAlt }] = rowsOf(
    await db.execute(sql`
      SELECT count(DISTINCT "_parent_id")::int AS n
      FROM "projects_images_locales" WHERE "home_alt" IS NOT NULL`),
  )
  payload.logger.info(
    `[R23b-ii] backfilled homeOrder on ${filled} showOnHome images; ${withAlt} of them also ` +
      `carry a home alt (the rest publish an empty one, which is what is committed).`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Two nullable columns in, two out. Nothing else was touched, so there is nothing else to
  // restore — unlike R23b-i's `down`, this one loses no data that is not reconstructible by
  // re-running `up` against the still-present home rows.
  await db.execute(sql`
   ALTER TABLE "projects_images" DROP COLUMN "home_order";
  ALTER TABLE "projects_images_locales" DROP COLUMN "home_alt";`)
}
