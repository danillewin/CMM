import { db } from "./db";

async function addJtbdFields() {
  try {
    console.log("Adding job_statement and job_story columns to jtbds table...");
    
    // Add job_statement column
    await db.execute(`
      ALTER TABLE jtbds 
      ADD COLUMN IF NOT EXISTS job_statement TEXT;
    `);
    
    // Add job_story column
    await db.execute(`
      ALTER TABLE jtbds 
      ADD COLUMN IF NOT EXISTS job_story TEXT;
    `);
    
    console.log("Successfully added columns to jtbds table");
    process.exit(0);
  } catch (error) {
    console.error("Error adding columns:", error);
    process.exit(1);
  }
}

addJtbdFields();