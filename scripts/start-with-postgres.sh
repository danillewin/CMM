#!/bin/bash

PGDATA="/home/runner/workspace/pgdata/data"
PGSOCKET="/home/runner/workspace/pgdata/socket"
PGLOGFILE="/home/runner/workspace/pgdata/logfile"

mkdir -p "$PGSOCKET"

if [ ! -d "$PGDATA" ] || [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL database..."
  PGPORT=5432 initdb -D "$PGDATA"
fi

echo "Starting PostgreSQL..."
PGPORT=5432 pg_ctl -D "$PGDATA" -o "-k $PGSOCKET" -l "$PGLOGFILE" start || true

sleep 2

if PGHOST="$PGSOCKET" PGPORT=5432 PGUSER=runner psql -c "SELECT 1;" >/dev/null 2>&1; then
  echo "PostgreSQL is running"
else
  echo "Warning: PostgreSQL may not be running"
fi

unset DATABASE_URL

echo "Starting application..."
exec npx tsx server/index.ts
