import { pool } from './db';

async function addGiftColumnToMeetings() {
  try {
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'has_gift'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding has_gift column to meetings table...');
      // Add the column if it doesn't exist
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN has_gift TEXT DEFAULT 'no'
      `);
      console.log('Successfully added has_gift column');
    } else {
      console.log('has_gift column already exists');
    }
  } catch (error) {
    console.error('Error adding has_gift column:', error);
  } finally {
    // Don't close the pool as it's imported and used elsewhere
  }
}

// Run migration
addGiftColumnToMeetings()
  .then(() => {
    console.log('Migration completed');
    // Don't exit process as this might be imported by another file
  })
  .catch(err => {
    console.error('Migration failed:', err);
  });

export default addGiftColumnToMeetings;