import { Pool as NeonPool } from '@neondatabase/serverless';
import pg from 'pg';

const { Pool: PgPool } = pg;
type AnyPool = NeonPool | PgPool;

export async function migrateAddResearchAttachments(pool: AnyPool): Promise<void> {
  console.log("Running migration: Create research_attachments table...");

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS research_attachments (
        id SERIAL PRIMARY KEY,
        research_id INTEGER NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        object_path TEXT NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("✓ Research attachments migration completed successfully");
  } catch (error) {
    console.error("❌ Research attachments migration failed:", error);
    throw error;
  }
}
