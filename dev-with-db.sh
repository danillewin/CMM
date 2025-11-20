#!/bin/bash

# Start PostgreSQL if not running
if ! ps aux | grep "postgres.*5432" | grep -v grep > /dev/null; then
  echo "Starting PostgreSQL..."
  ./start-postgres.sh > /tmp/postgres-start.log 2>&1
  sleep 3
fi

# Set DATABASE_URL and start the app
export DATABASE_URL="postgresql://runner@localhost:5432/replit?sslmode=disable"

# Clear empty PG variables that interfere
export PGHOST=""
export PGPORT=""
export PGUSER=""
export PGPASSWORD=""
export PGDATABASE=""

echo "Starting application with DATABASE_URL=$DATABASE_URL"
npm run dev
