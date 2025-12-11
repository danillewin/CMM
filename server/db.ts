import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

function createPool() {
  if (databaseUrl) {
    console.log('Using Replit-managed PostgreSQL database');
    return new Pool({ connectionString: databaseUrl });
  }
  
  console.log('Using local PostgreSQL database');
  return new Pool({
    host: '/home/runner/workspace/pgdata/socket',
    port: 5432,
    user: 'runner',
    database: 'runner'
  });
}

export const pool = createPool();
export const db = drizzle(pool, { schema });
