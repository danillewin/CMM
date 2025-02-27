import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 second timeout
  max: 20, // Maximum number of clients to create
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  maxUses: 7500, // Close clients after 7500 queries
});

export const db = drizzle(pool, { schema });