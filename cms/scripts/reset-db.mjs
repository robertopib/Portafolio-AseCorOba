/**
 * One-off DB reset for the schema re-model.
 *
 * Drops every table + enum in the Neon `public` schema so Payload can recreate
 * the new Categorías → Proyectos schema cleanly on next boot (avoids interactive
 * drizzle data-loss prompts). SAFE here: all content is reproducible from
 * content/*.json + the images already in Cloudflare R2, and is re-created by the
 * seed script afterwards.
 *
 * Run from the cms/ folder:
 *   node --env-file=.env scripts/reset-db.mjs
 */
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { readdirSync } from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const cmsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pnpmDir = path.join(cmsDir, 'node_modules/.pnpm')
const pgDir = readdirSync(pnpmDir).find((d) => d.startsWith('pg@'))
const { Client } = require(path.join(pnpmDir, pgDir, 'node_modules/pg'))

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI not set. Run with: node --env-file=.env scripts/reset-db.mjs')
  process.exit(1)
}

const c = new Client({ connectionString: uri })
try {
  await c.connect()
  const { rows: tables } = await c.query(
    "select tablename from pg_tables where schemaname='public'",
  )
  console.log(`Dropping ${tables.length} tables...`)
  if (tables.length) {
    const list = tables.map((t) => `"${t.tablename}"`).join(', ')
    await c.query(`DROP TABLE IF EXISTS ${list} CASCADE`)
  }
  const { rows: enums } = await c.query("select typname from pg_type where typtype='e'")
  for (const e of enums) await c.query(`DROP TYPE IF EXISTS "${e.typname}" CASCADE`)
  const { rows: after } = await c.query(
    "select count(*)::int as n from pg_tables where schemaname='public'",
  )
  console.log(`Done. Tables remaining: ${after[0].n}. Enums dropped: ${enums.length}.`)
} catch (err) {
  console.error('Reset failed:', err.message)
  process.exit(1)
} finally {
  await c.end()
}
