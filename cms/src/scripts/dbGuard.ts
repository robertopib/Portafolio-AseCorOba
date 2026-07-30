/**
 * DB safety preflight — run BEFORE `getPayload({config})` in any script that
 * connects to Postgres (seed, export).
 *
 * WHY: Payload's dev adapter auto-PUSHES the schema on connect, so merely
 * pointing `DATABASE_URI` at the wrong database and running a script CREATES this
 * project's tables there (and can rename/alter shared enums). This happened once:
 * `cms/.env` was repointed at an unrelated account's database and a seed
 * contaminated it.
 *
 * IMPORTANT: this project's Neon lives in a SEPARATE Neon account that is NOT the
 * one the local `neonctl` is logged into. Never source the DB from `neonctl`
 * here — always set `cms/.env` from the portfolio's own Neon account.
 *
 * The guard is dependency-free: it requires you to DECLARE the host you intend to
 * use in `cms/.env` as `DB_TARGET_HOST`, and aborts unless `DATABASE_URI`'s host
 * matches it. An accidental/automated repoint of `DATABASE_URI` alone (exactly
 * the failure above) no longer matches `DB_TARGET_HOST`, so the run stops before
 * Payload connects. Escape hatch: `SEED_SKIP_DB_GUARD=1`.
 */
export function assertPortfolioDb(): void {
  const uri = process.env.DATABASE_URI
  if (!uri) throw new Error('DB guard: DATABASE_URI is not set.')

  let host: string
  try {
    host = new URL(uri).host
  } catch {
    throw new Error('DB guard: DATABASE_URI is not a valid URL.')
  }

  if (process.env.SEED_SKIP_DB_GUARD === '1') {
    // eslint-disable-next-line no-console
    console.warn(`DB guard BYPASSED (SEED_SKIP_DB_GUARD=1). Target host: ${host}`)
    return
  }

  const expected = process.env.DB_TARGET_HOST
  if (!expected) {
    throw new Error(
      [
        'DB SAFETY GUARD: DB_TARGET_HOST is not set.',
        `  DATABASE_URI host: ${host}`,
        '',
        'Set DB_TARGET_HOST in cms/.env to the exact host you intend to use, so a',
        "wrong/accidental DATABASE_URI can't be seeded. This project's Neon is in a",
        'SEPARATE account (not the local `neonctl` login). If you are certain the',
        'target is correct, bypass once with SEED_SKIP_DB_GUARD=1.',
      ].join('\n'),
    )
  }

  if (expected !== host) {
    throw new Error(
      [
        'DB SAFETY GUARD: refusing to run — DATABASE_URI does not match DB_TARGET_HOST.',
        `  DATABASE_URI host: ${host}`,
        `  DB_TARGET_HOST:    ${expected}`,
        '',
        'DATABASE_URI appears to point at a different database than you declared.',
        'Fix cms/.env, or update DB_TARGET_HOST if the new host is intended.',
      ].join('\n'),
    )
  }
}
