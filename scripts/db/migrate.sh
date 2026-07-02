#!/usr/bin/env bash
# Applies supabase/migrations/*.sql (in filename order) to $DATABASE_URL,
# tracking applied files in public.__migrations so reruns are no-ops.
#
# Local/plain-Postgres validation: run with SHIM=1 the first time to install
# scripts/db/supabase-local-shim.sql (auth/storage/roles emulation).
# Against a real Supabase project you can use this with the direct connection
# string, or use `supabase link && supabase db push` instead — never both.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (postgres connection string)." >&2
  exit 1
fi

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)

if [[ "${SHIM:-0}" == "1" ]]; then
  echo "Applying local Supabase shim (plain Postgres only)…"
  "${PSQL[@]}" -f scripts/db/supabase-local-shim.sql
fi

"${PSQL[@]}" -c "create table if not exists public.__migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);"

for file in supabase/migrations/*.sql; do
  name=$(basename "$file")
  applied=$("${PSQL[@]}" -Atc "select 1 from public.__migrations where name = '$name'")
  if [[ "$applied" == "1" ]]; then
    echo "skip   $name"
    continue
  fi
  echo "apply  $name"
  "${PSQL[@]}" -f "$file"
  "${PSQL[@]}" -c "insert into public.__migrations (name) values ('$name');"
done

echo "Migrations up to date."
