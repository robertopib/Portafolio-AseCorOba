import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { planCleanup, formatUnsafe, type CleanupRow } from '../lib/r23/cleanup'
import { photoKey } from '../lib/r23/reconcile'

/**
 * R23b-iii — delete the redundant `projects` rows and drop the six old columns.
 *
 * **THE FIRST GENUINELY DESTRUCTIVE STEP IN THE R23 ARC.** Everything before it added: R23b-i
 * built `clients`, the project parents and `images[]` beside the old model; R23b-ii switched
 * both exporters onto `images[]` and proved the emitted bytes did not move (14 files, tree
 * `sha256 acaa8b64…`, on both twins). What was left was the old model sitting *beside* the new
 * one — the duplication the whole refactor exists to remove, and the thing the owner sees when
 * searching *OFF DAY Trainer* and getting four records instead of two.
 *
 * On dev, 58 rows → 21: 20 parents + the one case study, and 37 rows deleted.
 *
 * ── WHY THIS RUNS BEFORE THE PROMOTION, NOT AFTER ────────────────────────────────────────────
 * It was scoped to run *after*, so the old columns could act as a fallback if the new emitters
 * misbehaved against production data. The owner reversed that on 2026-08-12 (locked: *"promote
 * complete work, never an intermediate state"*). `RELEASE.md` step 2 already requires a **Neon
 * backup branch** before any promotion, which restores everything rather than six columns, so
 * the fallback was largely redundant — and its real cost was concrete: the owner would be asked
 * to review, and sign off on, a state still showing the duplicates.
 *
 * ── HOW THE DELETE SET IS DERIVED, AND WHY NOT A COUNT ───────────────────────────────────────
 * Not by id, and not by "expect 37". Dev holds 57 photographs and production 58 (R45), so one
 * constant cannot describe both — that is R49's lesson, and it applies here in mirror image.
 * `../lib/r23/cleanup.ts` is a pure, unit-tested function asserting the property that actually
 * matters:
 *
 *     a row is deleted only when its photograph is provably preserved in projects_images.
 *
 * Anything it cannot account for — an editor's new card, a row with no media — is neither
 * deleted nor silently kept. It aborts, before the first write, naming the file. A count
 * assertion would pass while deleting the *wrong* 37 rows.
 *
 * ── ROLLBACK: `down` RESTORES THE ROWS, NOT JUST THE COLUMNS ─────────────────────────────────
 * r23-target-model.md §5.4 assumed it could not, and said recovery from this step would be a
 * Neon point-in-time restore. It can, and cheaply: `up` snapshots `projects` and
 * `projects_locales` into two archive tables *before* deleting, and `down` recreates the six
 * columns, restores every surviving row's values, re-inserts the deleted rows with their
 * original ids, and drops the archives. The snapshot must cover **all** rows, not just the
 * doomed ones — `DROP COLUMN` destroys the survivors' `placement`/`image`/`order`/… too, and a
 * `down` that left those NULL could not restore the original `NOT NULL` schema.
 *
 * The two archive tables therefore OUTLIVE a successful `up`. They are deliberately outside
 * Payload's schema (`migrate:create` diffs the config against the committed .json snapshot, not
 * the live database, so they will not reappear as spurious drops later) and they are, in
 * effect, the fallback that moving this migration before the promotion gave up. A follow-up
 * item drops them once the promotion has settled.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────────────────────────
 * The DDL in `up` is `payload migrate:create` output, unedited. **The generated `down` was
 * NOT usable** and is replaced — R44 again, a different symptom: it emitted
 * `ADD COLUMN "placement" … NOT NULL` and `ADD COLUMN "order" numeric NOT NULL` against a table
 * with rows in it, which Postgres rejects outright (no default to fill them with). A `down`
 * that cannot run is not a rollback plan. This one adds the columns nullable, restores every
 * value from the archive, and only then re-applies `NOT NULL`.
 *
 * Not touched, deliberately: `projects_images.home_order` and `projects_images_locales.home_alt`.
 * They were added by R23b-ii and are part of the NEW model. R23b-ii proved they cannot be
 * derived (branding's home sequence is offset 1 from its page sequence throughout, and
 * `gift-box-vinte.png` is home 5 / page 8), so dropping them would silently undo it.
 */

const fail = (msg: string): never => {
  throw new Error(`[R23b-iii cleanup] ${msg}`)
}

/** Rows are `{ rows: [...] }` on the pg driver and a bare array on some paths. */
const rowsOf = (r: any): any[] => (Array.isArray(r) ? r : (r?.rows ?? []))

const scalar = async (db: any, query: any): Promise<number> =>
  Number(rowsOf(await db.execute(query))[0]?.n ?? -1)

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ===========================================================================================
  // 1. Read both sides. NOTHING is written until every check below has passed.
  // ===========================================================================================
  const rows: CleanupRow[] = rowsOf(
    await db.execute(sql`
      SELECT p."id",
             p."type"::text                AS "type",
             c."slug"                      AS "categoria",
             m."filename"                  AS "archivo",
             p."placement"::text           AS "placement",
             (SELECT count(*) FROM "projects_images" pi WHERE pi."_parent_id" = p."id")::int
                                           AS "imageRows"
      FROM "projects" p
      LEFT JOIN "categories" c ON c."id" = p."category_id"
      LEFT JOIN "media"      m ON m."id" = p."image_id"
      ORDER BY p."id"`),
  ).map((r: any) => ({
    id: Number(r.id),
    type: String(r.type),
    categoria: r.categoria ?? null,
    archivo: r.archivo ?? null,
    placement: r.placement ?? null,
    imageRows: Number(r.imageRows),
  }))

  // What the NEW model holds: every photograph reachable through `images[]`, keyed the same way
  // the worksheet reconciliation keys it, so the two sides cannot drift apart.
  const covered = new Set(
    rowsOf(
      await db.execute(sql`
        SELECT DISTINCT c."slug" AS "categoria", m."filename" AS "archivo"
        FROM "projects_images" pi
        JOIN "projects"   parent ON parent."id" = pi."_parent_id"
        JOIN "categories" c      ON c."id"      = parent."category_id"
        JOIN "media"      m      ON m."id"      = pi."image_id"`),
    ).map((r: any) => photoKey(r.categoria, r.archivo)),
  )

  // ===========================================================================================
  // 2. The gate. Derived, never hard-coded — see the header.
  // ===========================================================================================
  const plan = planCleanup(rows, covered)
  if (plan.unsafe.length) fail(formatUnsafe(plan.unsafe))

  // A labelled vacuity floor, in `docs/testing-standards.md` §2's idiom, and the one check here
  // that guards against catastrophe rather than mess: if this database holds photographs but
  // NOTHING carries `images[]`, then R23b-i's backfill has not run on it and the six columns
  // about to be dropped are the only copy of the content.
  if (rows.some((r) => r.type === 'image') && plan.parents.length === 0)
    fail(
      `${rows.length} projects rows exist but none carries images[] — R23b-i's backfill has not ` +
        `run on this database. Dropping the old columns now would destroy the only copy of the ` +
        `content. Apply 20260811_114118_r23_clientes_images first.`,
    )

  payload.logger.info(
    `[R23b-iii] ${rows.length} projects rows: ${plan.parents.length} parents (carry images[]), ` +
      `${plan.retained.length} non-image (the case study), ${plan.doomed.length} redundant → delete. ` +
      `${rows.length - plan.doomed.length} will remain.`,
  )

  const doomedIds = plan.doomed.map((r) => r.id)
  if (doomedIds.some((id) => !Number.isInteger(id))) fail('a projects id is not an integer.')
  // Safe to inline: every id came back from `projects.id`, an integer column, and was just
  // re-checked with Number.isInteger. Drizzle's `sql` cannot template a list of parameters
  // without `sql.join`, and an id list is the one thing that must be literal for the DO block
  // below to reuse it.
  const idArray = sql.raw(`ARRAY[${doomedIds.join(',')}]::int[]`)

  const imagesBefore = await scalar(db, sql`SELECT count(*)::int AS n FROM "projects_images"`)
  const imageLocalesBefore = await scalar(
    db,
    sql`SELECT count(*)::int AS n FROM "projects_images_locales"`,
  )

  // ===========================================================================================
  // 3. The archive — this IS the rollback. All rows, not just the doomed ones (see header).
  // ===========================================================================================
  // `placement` and `size` are stored as TEXT on purpose: keeping them as enums would leave the
  // archive holding a live dependency on `enum_projects_placement` / `enum_projects_size`, and
  // the DROP TYPE at the end of this migration would fail. `down` casts them back.
  await db.execute(sql`
    DROP TABLE IF EXISTS "projects_pre_r23biii";
    DROP TABLE IF EXISTS "projects_locales_pre_r23biii";

    CREATE TABLE "projects_pre_r23biii" AS
      SELECT "id", "category_id", "type", "placement"::text AS "placement", "group",
             "size"::text AS "size", "image_id", "order", "internal_title",
             "case_study_hero_image", "updated_at", "created_at", "slug", "cliente_id"
      FROM "projects";

    CREATE TABLE "projects_locales_pre_r23biii" AS SELECT * FROM "projects_locales";`)

  const archived = await scalar(db, sql`SELECT count(*)::int AS n FROM "projects_pre_r23biii"`)
  if (archived !== rows.length)
    fail(`archived ${archived} rows but read ${rows.length}. Refusing to delete anything.`)

  // ===========================================================================================
  // 4. Prove the delete takes nothing but the rows themselves.
  // ===========================================================================================
  if (doomedIds.length) {
    // Every table with an FK to `projects` cascades. Walk them all rather than reasoning about
    // which ones could hold a row: `projects_images` is in the loop deliberately, so "no image
    // is lost" is proved rather than inferred from `imageRows = 0`. Excluded:
    // `projects_locales`, which is archived and restored, and `payload_locked_documents_rels`,
    // which is transient admin edit-lock state.
    await db.execute(sql`
      DO $$
      DECLARE r record; n bigint; bad text := '';
      BEGIN
        FOR r IN
          SELECT c.conrelid::regclass::text AS child, a.attname AS col
          FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
          WHERE c.contype = 'f'
            AND c.confrelid = 'projects'::regclass
            AND c.conrelid NOT IN ('projects_locales'::regclass,
                                   'payload_locked_documents_rels'::regclass)
        LOOP
          EXECUTE format('SELECT count(*) FROM %I WHERE %I = ANY($1)', r.child, r.col)
            INTO n USING ${idArray};
          IF n > 0 THEN bad := bad || format('%s(%s rows) ', r.child, n); END IF;
        END LOOP;
        IF bad <> '' THEN
          RAISE EXCEPTION '[R23b-iii cleanup] the rows marked redundant still own child rows: %. Nothing has been changed.', bad;
        END IF;
      END $$;`)

    const deleted = rowsOf(
      await db.execute(sql`DELETE FROM "projects" WHERE "id" = ANY(${idArray}) RETURNING "id"`),
    )
    if (deleted.length !== doomedIds.length)
      fail(`planned to delete ${doomedIds.length} rows but deleted ${deleted.length}.`)
  }

  // ===========================================================================================
  // 5. Verify the outcome before touching the schema.
  // ===========================================================================================
  const remaining = await scalar(db, sql`SELECT count(*)::int AS n FROM "projects"`)
  if (remaining !== plan.parents.length + plan.retained.length)
    fail(
      `${remaining} projects rows remain, expected ${plan.parents.length + plan.retained.length} ` +
        `(${plan.parents.length} parents + ${plan.retained.length} non-image).`,
    )

  const imagesAfter = await scalar(db, sql`SELECT count(*)::int AS n FROM "projects_images"`)
  const imageLocalesAfter = await scalar(
    db,
    sql`SELECT count(*)::int AS n FROM "projects_images_locales"`,
  )
  if (imagesAfter !== imagesBefore || imageLocalesAfter !== imageLocalesBefore)
    fail(
      `the delete cascaded into the new model: projects_images ${imagesBefore} → ${imagesAfter}, ` +
        `projects_images_locales ${imageLocalesBefore} → ${imageLocalesAfter}.`,
    )

  // The case study is the one Proyecto with no photograph, and it currently carries a REQUIRED
  // `placement` — removing a required field from a collection with rows in it is exactly where
  // this could go wrong, so it is checked by name rather than assumed.
  const caseStudies = rowsOf(
    await db.execute(sql`SELECT "id", "slug" FROM "projects" WHERE "type" = 'caseStudy'`),
  )
  if (caseStudies.length !== plan.retained.length)
    fail(`${caseStudies.length} caseStudy rows survive, expected ${plan.retained.length}.`)
  payload.logger.info(
    `[R23b-iii] ${remaining} projects rows remain; ${imagesAfter} images untouched; case ` +
      `stud${caseStudies.length === 1 ? 'y' : 'ies'} intact: ` +
      `${caseStudies.map((c: any) => `#${c.id} '${c.slug}'`).join(', ') || 'none'}.`,
  )

  // The two enum types are about to be dropped. Nothing but the two columns going with them may
  // still use either — the archive above casts them to text for precisely this reason, and R44
  // has already caught this generator emitting drops that could not run.
  const users = rowsOf(
    await db.execute(sql`
      SELECT c.relname AS "table", a.attname AS "column", t.typname AS "type"
      FROM pg_attribute a
      JOIN pg_type  t ON t.oid = a.atttypid
      JOIN pg_class c ON c.oid = a.attrelid
      WHERE t.typname IN ('enum_projects_placement', 'enum_projects_size')
        AND a.attnum > 0 AND NOT a.attisdropped AND c.relkind = 'r'`),
  )
  const unexpected = users.filter(
    (u: any) => !(u.table === 'projects' && ['placement', 'size'].includes(u.column)),
  )
  if (unexpected.length)
    fail(
      `these columns still use the enum types this migration drops: ` +
        unexpected.map((u: any) => `${u.table}.${u.column} (${u.type})`).join(', '),
    )

  // ===========================================================================================
  // 6. The schema. `payload migrate:create` output, unedited.
  // ===========================================================================================
  await db.execute(sql`
   ALTER TABLE "projects" DROP CONSTRAINT "projects_image_id_media_id_fk";

  DROP INDEX "projects_image_idx";
  ALTER TABLE "projects" DROP COLUMN "placement";
  ALTER TABLE "projects" DROP COLUMN "size";
  ALTER TABLE "projects" DROP COLUMN "image_id";
  ALTER TABLE "projects" DROP COLUMN "order";
  ALTER TABLE "projects_locales" DROP COLUMN "alt";
  ALTER TABLE "projects_locales" DROP COLUMN "category_label";
  DROP TYPE "public"."enum_projects_placement";
  DROP TYPE "public"."enum_projects_size";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // REPLACES THE GENERATED `down`, which could not run — see the header. Order matters: types,
  // then nullable columns, then the data, then NOT NULL, then the index and FK, then the
  // archives. Re-applying NOT NULL is only possible because step 3 restores the SURVIVORS'
  // values too, not just the deleted rows.
  const archives = rowsOf(
    await db.execute(sql`
      SELECT to_regclass('public.projects_pre_r23biii')         AS "projects",
             to_regclass('public.projects_locales_pre_r23biii') AS "locales"`),
  )[0]
  if (!archives?.projects || !archives?.locales)
    fail(
      'the archive tables projects_pre_r23biii / projects_locales_pre_r23biii are missing, so ' +
        'the deleted rows cannot be restored. Recover from a Neon backup branch instead ' +
        '(RELEASE.md step 2) rather than running a partial rollback.',
    )

  // 1-2. The types, and the columns back as NULLABLE.
  await db.execute(sql`
    CREATE TYPE "public"."enum_projects_placement" AS ENUM('home', 'page', 'both');
    CREATE TYPE "public"."enum_projects_size" AS ENUM('small', 'medium', 'large', 'wide', 'tall');
    ALTER TABLE "projects"         ADD COLUMN "placement" "enum_projects_placement";
    ALTER TABLE "projects"         ADD COLUMN "size" "enum_projects_size";
    ALTER TABLE "projects"         ADD COLUMN "image_id" integer;
    ALTER TABLE "projects"         ADD COLUMN "order" numeric;
    ALTER TABLE "projects_locales" ADD COLUMN "alt" varchar;
    ALTER TABLE "projects_locales" ADD COLUMN "category_label" varchar;`)

  // 3. The deleted rows, with their original ids, then every surviving row's old values.
  await db.execute(sql`
    INSERT INTO "projects" ("id", "category_id", "type", "placement", "group", "size", "image_id",
                            "order", "internal_title", "case_study_hero_image", "updated_at",
                            "created_at", "slug", "cliente_id")
      SELECT a."id", a."category_id", a."type",
             a."placement"::"enum_projects_placement", a."group", a."size"::"enum_projects_size",
             a."image_id", a."order", a."internal_title", a."case_study_hero_image",
             a."updated_at", a."created_at", a."slug", a."cliente_id"
      FROM "projects_pre_r23biii" a
      WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = a."id");

    UPDATE "projects" p
      SET "placement" = a."placement"::"enum_projects_placement",
          "size"      = a."size"::"enum_projects_size",
          "image_id"  = a."image_id",
          "order"     = a."order"
      FROM "projects_pre_r23biii" a
      WHERE a."id" = p."id";`)

  // The locale rows of the deleted projects went with them (ON DELETE cascade). Their column
  // list is read from the archive rather than typed out: `projects_locales` has 32 columns, all
  // but two of them case-study text, and a hand-copied list is a silent-data-loss waiting to
  // happen. Re-added columns land last, so the two sides must be named, not `SELECT *`.
  await db.execute(sql`
    DO $$
    DECLARE cols text;
    BEGIN
      SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
        INTO cols
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects_locales_pre_r23biii';
      EXECUTE format(
        'INSERT INTO "projects_locales" (%s) SELECT %s FROM "projects_locales_pre_r23biii" a
           WHERE NOT EXISTS (SELECT 1 FROM "projects_locales" l WHERE l."id" = a."id")',
        cols, cols);
    END $$;

    UPDATE "projects_locales" l
      SET "alt" = a."alt", "category_label" = a."category_label"
      FROM "projects_locales_pre_r23biii" a
      WHERE a."id" = l."id";`)

  // 4. Sequences, so the next insert does not collide with a restored id.
  await db.execute(sql`
    SELECT setval('projects_id_seq', GREATEST((SELECT max("id") FROM "projects"), 1), true);
    SELECT setval('projects_locales_id_seq',
                  GREATEST((SELECT max("id") FROM "projects_locales"), 1), true);`)

  // 5. NOT NULL — but say which rows are wrong rather than letting Postgres say "column
  // contains null values" with no id in it.
  const holes = rowsOf(
    await db.execute(sql`
      SELECT "id" FROM "projects" WHERE "placement" IS NULL OR "order" IS NULL ORDER BY "id"`),
  )
  if (holes.length)
    fail(
      `${holes.length} projects row(s) have no archived placement/order and cannot take the ` +
        `original NOT NULL: #${holes.map((h: any) => h.id).join(', #')}.`,
    )

  await db.execute(sql`
    ALTER TABLE "projects" ALTER COLUMN "placement" SET NOT NULL;
    ALTER TABLE "projects" ALTER COLUMN "order" SET NOT NULL;
    ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "projects_image_idx" ON "projects" USING btree ("image_id");`)

  const restored = await scalar(db, sql`SELECT count(*)::int AS n FROM "projects"`)

  // 6. The archives have done their job. Dropping them is what makes down → up → down
  // repeatable: `up` re-snapshots from scratch every time.
  await db.execute(sql`
    DROP TABLE "projects_pre_r23biii";
    DROP TABLE "projects_locales_pre_r23biii";`)

  payload.logger.info(`[R23b-iii] rolled back: ${restored} projects rows and six columns restored.`)
}
