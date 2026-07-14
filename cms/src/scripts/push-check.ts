import { writeFileSync } from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'

const OUT = '/tmp/push-check.txt'
const lines: string[] = []

try {
  const payload = await getPayload({ config })
  lines.push('getPayload OK — schema pushed to Neon')

  // Confirm the key tables exist by querying them.
  const cats = await payload.db.drizzle.execute(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('categories','projects','categories_locales','projects_locales') ORDER BY tablename",
  )
  const rows = (cats as { rows?: Array<{ tablename: string }> }).rows ?? []
  lines.push('tables found: ' + rows.map((r) => r.tablename).join(', '))

  // Simple count queries to prove they are usable.
  const catCount = await payload.count({ collection: 'categories' })
  const projCount = await payload.count({ collection: 'projects' })
  lines.push(`categories count: ${catCount.totalDocs}`)
  lines.push(`projects count: ${projCount.totalDocs}`)

  lines.push('RESULT: SUCCESS')
} catch (err) {
  lines.push('RESULT: ERROR')
  lines.push(err instanceof Error ? (err.stack ?? err.message) : String(err))
}

writeFileSync(OUT, lines.join('\n') + '\n')
process.exit(0)
