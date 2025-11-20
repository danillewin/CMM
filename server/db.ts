import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
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

export const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle({ client: pool, schema });
