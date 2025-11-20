#!/bin/bash

# Start PostgreSQL in the background
export PGDATA=/home/runner/workspace/pgdata
export PGHOST=/home/runner/workspace/pgdata/socket

# Clear empty environment variables that interfere with PostgreSQL
unset PGPORT
unset PGUSER
unset PGPASSWORD
unset PGDATABASE

# Start PostgreSQL server
/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/postgres -D $PGDATA -p 5432 -k $PGHOST &

# Wait for server to start
sleep 3

# Create database if it doesn't exist
/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/createdb -h 127.0.0.1 -p 5432 replit 2>/dev/null || true

echo "PostgreSQL started on localhost:5432"
echo "Database: replit"
echo "Connection string: postgresql://runner@localhost:5432/replit?sslmode=disable"
