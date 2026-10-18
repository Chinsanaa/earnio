#!/usr/bin/env bash
# Applies every migration to a fresh database on a local Postgres, then runs
# the integrity exploit checks. Needs psql and a running Postgres you can
# create databases on, e.g.:
#   PGHOST=/var/run/postgresql PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="earnio_migration_test_$$"
psql -q -v ON_ERROR_STOP=1 -d postgres -c "CREATE DATABASE $DB" >/dev/null
trap 'psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null' EXIT

export PGOPTIONS="-c client_min_messages=warning"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/supabase_stub.sql >/dev/null
for f in supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null
done
unset PGOPTIONS
echo "Applied $(ls supabase/migrations/*.sql | wc -l) migrations"

psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f supabase/tests/integrity.sql
