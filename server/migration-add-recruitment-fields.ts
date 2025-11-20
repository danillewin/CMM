import { Pool as NeonPool } from '@neondatabase/serverless';
import pg from 'pg';

const { Pool: PgPool } = pg;
type AnyPool = NeonPool | PgPool;

export async function migrateAddRecruitmentFields(pool: AnyPool): Promise<void> {
  console.log("Running migration: Add recruitment fields...");

  try {
    // Check if old columns exist before dropping
    const oldColumnsExist = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'researches' 
      AND column_name IN ('clients_we_search_for', 'invite_template')
    `);

    // Always run the migration (idempotent with IF NOT EXISTS/IF EXISTS)
    await pool.query(`
      ALTER TABLE researches
        ADD COLUMN IF NOT EXISTS recruitment_quantity integer,
        ADD COLUMN IF NOT EXISTS recruitment_roles text,
        ADD COLUMN IF NOT EXISTS recruitment_segments text,
        ADD COLUMN IF NOT EXISTS recruitment_used_products text[],
        ADD COLUMN IF NOT EXISTS recruitment_used_channels text,
        ADD COLUMN IF NOT EXISTS recruitment_cq_min integer,
        ADD COLUMN IF NOT EXISTS recruitment_cq_max integer,
        ADD COLUMN IF NOT EXISTS recruitment_legal_entity_type text,
        ADD COLUMN IF NOT EXISTS recruitment_restrictions text
    `);

    // Drop old columns if they exist
    await pool.query(`
      ALTER TABLE researches
        DROP COLUMN IF EXISTS clients_we_search_for,
        DROP COLUMN IF EXISTS invite_template
    `);

    console.log("✓ Recruitment fields migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}