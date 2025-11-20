import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  
  if (databaseUrl) {
    return databaseUrl;
  }
  
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  
  const pgHost = PGHOST?.trim();
  const pgPort = PGPORT?.trim();
  const pgUser = PGUSER?.trim();
  const pgPassword = PGPASSWORD?.trim();
  const pgDatabase = PGDATABASE?.trim();
  
  if (pgHost && pgPort && pgUser && pgPassword && pgDatabase) {
    return `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
  }
  
  console.error("Database configuration is missing or incomplete.");
  console.error("DATABASE_URL:", databaseUrl ? "set but empty" : "not set");
  console.error("PGHOST:", pgHost || "not set or empty");
  console.error("PGPORT:", pgPort || "not set or empty");
  console.error("PGUSER:", pgUser || "not set or empty");
  console.error("PGDATABASE:", pgDatabase || "not set or empty");
  
  const localDbUrl = "postgresql://runner@localhost:5432/replit?sslmode=disable";
  console.log(`Attempting to use local database: ${localDbUrl}`);
  return localDbUrl;
}

const connectionString = getDatabaseUrl();
const isLocalDatabase = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = isLocalDatabase 
  ? new PgPool({ connectionString })
  : new NeonPool({ connectionString });

export const db = isLocalDatabase
  ? drizzlePg({ client: pool as PgPool, schema })
  : drizzleNeon({ client: pool as NeonPool, schema });
