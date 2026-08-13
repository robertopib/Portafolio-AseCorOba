#!/usr/bin/env bash
#
# REPLAY THE WHOLE MIGRATION CHAIN AGAINST AN EMPTY DATABASE.
#
# ── Why this exists ──────────────────────────────────────────────────────────
# The 2026-08-12 production promotion failed because
# `20260811_114118_r23_clientes_images` read through the Payload Local API, which
# builds its query from TODAY's config — including a column the NEXT migration
# adds. It worked on dev, where the migrations were applied one at a time as the
# config grew, and failed on production, where the chain ran back-to-back.
#
#   A migration reads through the FINAL config, not the config as of when it was
#   written. So a chain can work incrementally and fail from scratch — and every
#   fresh database is "from scratch".
#
# The missing test was the obvious one nobody ran: apply every migration to an
# empty database. That is precisely the shape production presents to a new
# migration. This script is that test, in one command with no setup.
#
# Its sibling is the CAUSE guard: `scripts/ci/check-migrations.mjs` hard-fails any
# migration that touches the Local API at all, offline, inside the required
# `repo-integrity` check. This script is the EFFECT guard, and it needs a real
# database — which is why it is local and not CI. `docs/testing-standards.md` §3
# bars live-database tests from CI and §6 says DB-backed checks "keep behind a
# separate local script and say so, so the next person doesn't 'helpfully' wire
# them in". This is that script. Do not wire it into CI.
#
# ── Usage ────────────────────────────────────────────────────────────────────
#   pnpm replay:migrations
#
# Exit 0 only when every committed migration applied cleanly, in order, to a
# database that started empty. Anything else exits non-zero, so it is usable as a
# gate (RELEASE.md step 3) rather than something you read and nod at.
#
# ── Safety ───────────────────────────────────────────────────────────────────
# Touches NOTHING but a throwaway PostgreSQL cluster created under `mktemp -d`
# and removed on exit, pass or fail. `DATABASE_URI` is exported before the CLI
# runs; Payload's env loader (`@next/env`) never overwrites an already-set
# variable, and the assertion at the end proves where the migrations actually
# landed rather than trusting that. Neon — dev or production — is never reached.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${REPLAY_PG_PORT:-55432}"
DBNAME="replay_from_scratch"

for bin in initdb pg_ctl createdb psql; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "❌ \`$bin\` not found. Install PostgreSQL locally (macOS: \`brew install postgresql@14\`)." >&2
    exit 1
  }
done

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/r23-replay.XXXXXX")"
PGDATA_DIR="$WORKDIR/pgdata"
STARTED=0

cleanup() {
  if [ "$STARTED" = "1" ]; then
    pg_ctl -D "$PGDATA_DIR" -m immediate stop >/dev/null 2>&1 || true
  fi
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "▶ throwaway cluster: $PGDATA_DIR (port $PORT)"
initdb -D "$PGDATA_DIR" -U postgres --auth-local=trust --auth-host=trust \
  --encoding=UTF8 --no-locale >"$WORKDIR/initdb.log" 2>&1 || {
  echo "❌ initdb failed:" >&2
  cat "$WORKDIR/initdb.log" >&2
  exit 1
}

pg_ctl -D "$PGDATA_DIR" -l "$WORKDIR/pg.log" -w \
  -o "-p $PORT -k $WORKDIR -c listen_addresses=127.0.0.1" start >/dev/null 2>&1 || {
  echo "❌ could not start PostgreSQL on port $PORT (set REPLAY_PG_PORT to change it):" >&2
  cat "$WORKDIR/pg.log" >&2
  exit 1
}
STARTED=1

createdb -h 127.0.0.1 -p "$PORT" -U postgres "$DBNAME"
PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d "$DBNAME" -v ON_ERROR_STOP=1 -qtAX)

echo "▶ server: $("${PSQL[@]}" -c 'SHOW server_version;')"

# The database must start EMPTY. If it does not, the cluster was not fresh and the
# whole point of the run is void.
PRE_TABLES="$("${PSQL[@]}" -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")"
if [ "$PRE_TABLES" != "0" ]; then
  echo "❌ the throwaway database is not empty ($PRE_TABLES tables). Aborting." >&2
  exit 1
fi
echo "▶ database is empty (0 tables in public) — this is what production presents to a new chain"

ON_DISK="$(find "$ROOT/cms/src/migrations" -maxdepth 1 -name '*.ts' ! -name 'index.ts' | wc -l | tr -d ' ')"
echo "▶ applying $ON_DISK committed migration(s), in order"
echo

export DATABASE_URI="postgres://postgres@127.0.0.1:$PORT/$DBNAME"
export PAYLOAD_SECRET="${PAYLOAD_SECRET:-replay-from-scratch-throwaway}"

pnpm --dir "$ROOT/cms" migrate

echo
echo "▶ migrate:status"
pnpm --dir "$ROOT/cms" migrate:status

# ── The assertion. Proves WHERE the migrations landed, not just that the CLI
# exited 0. If Payload had somehow resolved a different DATABASE_URI (a stale
# cms/.env winning, a shell export), this throwaway would still be empty and the
# run would fail here instead of reporting a green replay of nothing.
APPLIED="$("${PSQL[@]}" -c \
  "SELECT count(*) FROM payload_migrations WHERE batch > 0;")" || {
  echo "❌ no payload_migrations table in the throwaway database — the CLI did not migrate it." >&2
  exit 1
}
if [ "$APPLIED" != "$ON_DISK" ]; then
  echo "❌ $ON_DISK migration(s) on disk but $APPLIED applied to the throwaway database." >&2
  exit 1
fi

echo
echo "▶ applied, from the throwaway database itself:"
"${PSQL[@]}" -c \
  "SELECT '   ' || lpad(row_number() OVER (ORDER BY id)::text, 2) || '. ' || name || '  (batch ' || batch || ')'
   FROM payload_migrations ORDER BY id;"

echo
echo "✅ all $APPLIED migrations applied cleanly to a database that started empty."
