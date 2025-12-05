import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

const { Pool: PgPool } = pg;

neonConfig.webSocketConstructor = ws;

// Get database connection string
const databaseUrl = process.env.DATABASE_URL?.trim();

// Determine if using local or remote database
const isLocalDatabase = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

console.log(`Using ${isLocalDatabase ? 'local' : 'remote'} database`);

// For local database, use Unix socket connection
export const pool = isLocalDatabase 
  ? new PgPool({ 
      host: '/home/runner/workspace/pgdata/socket',
      port: 5432,
      user: 'runner',
      database: 'replit'
    })
  : new NeonPool({ connectionString: databaseUrl });

export const db = isLocalDatabase
  ? drizzlePg({ client: pool as PgPool, schema })
  : drizzleNeon({ client: pool as NeonPool, schema });
