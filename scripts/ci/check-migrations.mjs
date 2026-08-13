/**
 * CI GATE — Payload migrations integrity.
 *
 * Exists because of a real incident: commit 2095df8 shipped a
 * `cms/src/migrations/index.ts` that imported `20260730_133343_testdelta`, a
 * migration file that was never committed. `next build` has no
 * `ignoreBuildErrors`, so the CMS build failed, Vercel silently kept serving the
 * previous deploy, and "migrations Tier 1" appeared live for days while prod was
 * running the pre-migrations build. See roadmap R8.
 *
 * Checks (all offline — no DATABASE_URI, no network):
 *   1. HARD  every migration imported by index.ts exists on disk
 *   2. HARD  every migration listed in the exported `migrations` array is imported
 *   3. HARD  every migration file on disk is wired into index.ts
 *            (a committed-but-unreferenced migration would silently never run)
 *   4. HARD  payload.config.ts sets `push: false`
 *            (schema changes must ship as committed migrations, never dev push)
 *   5. WARN  each migration .ts has its .json snapshot committed
 *   6. WARN  a PR that touches schema-bearing files ships a new migration
 *   7. HARD  no migration uses the Payload Local API (roadmap R55)
 *
 * Usage: node scripts/ci/check-migrations.mjs
 *   BASE_SHA=<sha>  optional — enables check 6 against the PR merge base.
 */
import { readFileSync, readdirSync, existsSync } from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const ROOT = path.resolve(import.meta.dirname, '../..')
const MIG_DIR = path.join(ROOT, 'cms/src/migrations')
const INDEX = path.join(MIG_DIR, 'index.ts')
const CONFIG = path.join(ROOT, 'cms/src/payload.config.ts')

const errors = []
const warnings = []
const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

// ---------------------------------------------------------------------------
// 1-3. index.ts <-> disk consistency
// ---------------------------------------------------------------------------
if (!existsSync(INDEX)) {
  fail(`cms/src/migrations/index.ts is missing — the CMS build cannot resolve migrations.`)
} else {
  const src = readFileSync(INDEX, 'utf8')

  // `import * as migration_X from './X'`
  const imported = [...src.matchAll(/from\s+'\.\/([^']+)'/g)].map((m) => m[1])
  // `name: 'X'` entries inside the exported migrations array
  const listed = [...src.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1])

  const onDisk = readdirSync(MIG_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''))

  // 1. imported but not on disk — the exact R8 incident
  for (const name of imported) {
    if (!onDisk.includes(name)) {
      fail(
        `index.ts imports './${name}' but cms/src/migrations/${name}.ts does not exist. ` +
          `This breaks \`next build\` and silently freezes the CMS deploy (roadmap R8).`,
      )
    }
  }

  // 2. listed in the array but never imported
  for (const name of listed) {
    if (!imported.includes(name)) {
      fail(`index.ts lists migration '${name}' in the migrations array but never imports it.`)
    }
  }

  // 3. on disk but not wired up — would never run
  for (const name of onDisk) {
    if (!imported.includes(name)) {
      fail(
        `cms/src/migrations/${name}.ts is committed but not imported by index.ts, ` +
          `so \`payload migrate\` will never run it.`,
      )
    }
    // 5. snapshot presence (advisory — affects future migrate:create, not this build)
    if (!existsSync(path.join(MIG_DIR, `${name}.json`))) {
      warn(`cms/src/migrations/${name}.json snapshot is missing; \`migrate:create\` may emit a wrong diff.`)
    }
  }

  console.log(
    `migrations: ${onDisk.length} on disk, ${imported.length} imported, ${listed.length} registered`,
  )
}

// ---------------------------------------------------------------------------
// 4. push must stay off — schema changes ship as migrations, not dev push
// ---------------------------------------------------------------------------
if (!existsSync(CONFIG)) {
  fail(`cms/src/payload.config.ts is missing.`)
} else {
  const cfg = readFileSync(CONFIG, 'utf8')
  if (!/push:\s*false/.test(cfg)) {
    fail(
      `cms/src/payload.config.ts does not set \`push: false\` on the postgres adapter. ` +
        `With push on, schema changes apply implicitly instead of via a committed migration, ` +
        `and \`payload migrate\` can prompt interactively and hang the Vercel build.`,
    )
  } else {
    console.log('payload.config.ts: push: false ✓')
  }
}

// ---------------------------------------------------------------------------
// 7. HARD — no migration may use the Payload Local API
// ---------------------------------------------------------------------------
// Exists because of a real incident: the 2026-08-12 production promotion failed
// with `column projects_images__locales.home_alt does not exist` inside
// `payload.find({ collection: 'projects' })` at
// 20260811_114118_r23_clientes_images.ts:190. `homeAlt` is added by the NEXT
// migration, so the column did not exist yet.
//
//   The Local API builds its query from TODAY's config, not the config as of when
//   the migration was written. A chain that grew one migration at a time on dev
//   therefore works incrementally and fails from scratch — which is what every
//   fresh database, and every un-migrated production database, presents.
//
// Raw SQL names the columns the migration actually needs, at the point in the
// chain where they exist. `20260812_015822_r23_home_order_alt.ts:53-69` had
// already worked this out for a different symptom (the Local API silently drops
// localized array sub-fields on UPDATE) and nobody applied it backwards. This
// gate is what makes that not depend on somebody remembering. See roadmap R55.
//
// `payload.logger` is allowed: it is not database access, and all three R23
// migrations use it to report what they did.
//
// COMMENTS ARE STRIPPED BEFORE MATCHING, deliberately. The migrations document
// this hazard by quoting the very calls they must not make, and a gate that
// fails on its own documentation teaches people to delete the documentation.
const LOCAL_API = /\bpayload\s*\.\s*(find|findByID|findGlobal|create|update|updateGlobal|delete|count|db)\b/g

const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments, including the JSDoc headers
    .replace(/(^|[^:])\/\/.*$/gm, '$1') // line comments, without eating `https://`

if (existsSync(MIG_DIR)) {
  const errorsBefore = errors.length
  for (const file of readdirSync(MIG_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
    const code = stripComments(readFileSync(path.join(MIG_DIR, file), 'utf8'))
    const hits = [...code.matchAll(LOCAL_API)].map((m) => m[0].replace(/\s+/g, ''))
    if (hits.length) {
      fail(
        `cms/src/migrations/${file} uses the Payload Local API: ${[...new Set(hits)].join(', ')}. ` +
          `A migration reads through TODAY's config, not the config as of when it was written, ` +
          `so it works incrementally on dev and fails from scratch — which is what production is. ` +
          `This exact call shape aborted the 2026-08-12 promotion (roadmap R55). Use raw SQL via ` +
          `\`db.execute(sql\`…\`)\`; see 20260812_015822_r23_home_order_alt.ts for the pattern. ` +
          `payload.logger is fine.`,
      )
    }
  }
  if (errors.length === errorsBefore) console.log('migrations: no Payload Local API usage ✓')
}

// ---------------------------------------------------------------------------
// 6. ADVISORY — schema-bearing change without a new migration
// ---------------------------------------------------------------------------
// Deliberately a warning, not a gate: schema-bearing files also carry admin-only
// changes (labels, custom Cell components, hooks) that legitimately need no
// migration, so blocking here would reject valid PRs. Promoting this to a hard
// gate needs a real schema diff, which needs a live DB — see the R2 outcome note.
const baseSha = process.env.BASE_SHA
if (baseSha) {
  try {
    const changed = execFileSync('git', ['diff', '--name-only', `${baseSha}...HEAD`], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)

    const schemaish = changed.filter(
      (f) =>
        /^cms\/src\/(collections|globals)\//.test(f) || f === 'cms/src/payload.config.ts',
    )
    const newMigrations = changed.filter(
      (f) => /^cms\/src\/migrations\/.+\.ts$/.test(f) && !f.endsWith('index.ts'),
    )

    if (schemaish.length && !newMigrations.length) {
      warn(
        `This change touches schema-bearing files with no new migration committed:\n` +
          schemaish.map((f) => `      - ${f}`).join('\n') +
          `\n    If any FIELD changed (not just admin/UI config), run ` +
          `\`pnpm --dir cms migrate:create <name>\` and commit the result. ` +
          `push is off, so an un-migrated field change deploys a build whose code ` +
          `expects a column the database does not have.`,
      )
    } else if (schemaish.length) {
      console.log(`schema-bearing files changed (${schemaish.length}) with ${newMigrations.length} new migration(s) ✓`)
    } else {
      console.log('no schema-bearing files changed ✓')
    }
  } catch (err) {
    warn(`could not diff against BASE_SHA=${baseSha}: ${err.message}`)
  }
} else {
  console.log('BASE_SHA not set — skipping the schema-change/migration advisory check')
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
for (const w of warnings) console.log(`::warning title=Migrations::${w.replace(/\n/g, '%0A')}`)
for (const e of errors) console.log(`::error title=Migrations::${e.replace(/\n/g, '%0A')}`)

if (errors.length) {
  console.error(`\n❌ migrations integrity: ${errors.length} error(s)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`\n✅ migrations integrity OK${warnings.length ? ` (${warnings.length} warning(s))` : ''}`)
