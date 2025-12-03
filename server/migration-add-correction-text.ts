import { Pool as NeonPool } from '@neondatabase/serverless';
import pg from 'pg';

const { Pool: PgPool } = pg;
type AnyPool = NeonPool | PgPool;

export async function migrateAddCorrectionText(pool: AnyPool): Promise<void> {
  console.log("Running migration: Add correction_text to text_annotations...");

  try {
    await pool.query(`
      ALTER TABLE text_annotations
        ADD COLUMN IF NOT EXISTS correction_text TEXT
    `);

    console.log("✓ Correction text migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}
