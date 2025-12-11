import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

function createPool() {
  // First try DATABASE_URL
  if (databaseUrl) {
    console.log('Using Replit-managed PostgreSQL database (via DATABASE_URL)');
    return new Pool({ connectionString: databaseUrl });
  }
  
  // Fallback to individual PG* environment variables
  const pgHost = process.env.PGHOST;
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE;
  const pgUser = process.env.PGUSER;
  const pgPassword = process.env.PGPASSWORD;
  
  if (pgHost && pgDatabase && pgUser) {
    console.log('Using Replit-managed PostgreSQL database (via PG* env vars)');
    return new Pool({
      host: pgHost,
      port: parseInt(pgPort, 10),
      database: pgDatabase,
      user: pgUser,
      password: pgPassword || undefined,
    });
  }
  
  console.log('ERROR: No database connection configured.');
  console.log('Please provision a database in your Replit environment.');
  throw new Error('Database connection not configured. Missing DATABASE_URL or PG* environment variables.');
}

export const pool = createPool();
export const db = drizzle(pool, { schema });
