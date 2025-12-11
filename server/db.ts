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
  
  console.log('WARNING: DATABASE_URL not found. Waiting for database provisioning...');
  console.log('Please ensure the database is set up in your Replit environment.');
  throw new Error('DATABASE_URL environment variable is not set. The database connection is not available.');
}

export const pool = createPool();
export const db = drizzle(pool, { schema });
