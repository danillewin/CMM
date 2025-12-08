import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

// Check if using Replit-managed database (non-empty DATABASE_URL that doesn't point to localhost)
const useReplitDatabase = databaseUrl && 
  databaseUrl.length > 0 && 
  !databaseUrl.includes('localhost') && 
  !databaseUrl.includes('127.0.0.1');

export const pool = useReplitDatabase
  ? (() => {
      console.log('Using Replit-managed PostgreSQL database');
      return new Pool({ connectionString: databaseUrl });
    })()
  : (() => {
      console.log('Using local PostgreSQL database');
      return new Pool({
        host: '/home/runner/workspace/pgdata/socket',
        port: 5432,
        user: 'runner',
        database: 'replit'
      });
    })();

export const db = drizzle(pool, { schema });
