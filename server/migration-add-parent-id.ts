import { db } from "./db";
import { sql } from "drizzle-orm";

async function addParentIdColumnToJtbds() {
  try {
    // Check if the column already exists to avoid errors
    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'jtbds' AND column_name = 'parent_id'
    `);

    if (columnExists.rows.length === 0) {
      // Add parent_id column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE jtbds
        ADD COLUMN parent_id integer DEFAULT 0
      `);
      console.log("Successfully added parent_id column to jtbds table");
    } else {
      console.log("parent_id column already exists in jtbds table");
    }
  } catch (error) {
    console.error("Error adding parent_id column:", error);
    throw error;
  }
}

// Run the migration
addParentIdColumnToJtbds()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });