# Database Export Guide: Development to Production

## Overview
Your development database contains:
- **Teams**: 8 records
- **Positions**: 8 records  
- **JTBDs**: 2 records
- **Researches**: 100 records
- **Meetings**: 500 records

## ⚠️ Important: I Can Only Access Development Database
I can only access your development database through the tools available to me. I **cannot** directly access or modify production databases for security reasons.

## Export Files Created

### 1. `production-database-export.sql`
**Contains**: Teams, Positions, and JTBDs data (small tables)
**Use for**: Quick import of reference data
**Size**: Small, ready to run

### 2. `large_tables_export.sql` 
**Contains**: Researches, Meetings, and junction tables (large datasets)
**Use for**: Complete data migration
**Size**: Large, contains all 600+ records

## Migration Options

### Option A: Complete Migration (Recommended)
1. **Backup your production database first!**
2. Run `production-database-export.sql` on production (small tables)
3. Run `large_tables_export.sql` on production (large tables)

### Option B: Using Replit Database Pane
1. Open the Database pane in Replit
2. Connect to your production database
3. Use the import/export features in the database interface
4. Copy data table by table

### Option C: Selective Import
1. Start with `production-database-export.sql` (teams, positions, JTBDs)
2. Export specific researches/meetings using custom queries
3. Import in smaller batches

## Production Database Commands

### To run the export files:
```bash
# Connect to your production database
psql YOUR_PRODUCTION_DATABASE_URL

# Import small tables
\i production-database-export.sql

# Import large tables  
\i large_tables_export.sql
```

### To verify the import:
```sql
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'positions' as table_name, COUNT(*) as record_count FROM positions
UNION ALL
SELECT 'jtbds' as table_name, COUNT(*) as record_count FROM jtbds
UNION ALL
SELECT 'researches' as table_name, COUNT(*) as record_count FROM researches
UNION ALL
SELECT 'meetings' as table_name, COUNT(*) as record_count FROM meetings;
```

Expected results:
- teams: 8
- positions: 8  
- jtbds: 2
- researches: 100
- meetings: 500

## Alternative: Using pg_dump/pg_restore

If you have direct access to both databases:

```bash
# Export from development
pg_dump $DEV_DATABASE_URL --data-only --inserts > full_export.sql

# Import to production  
psql $PROD_DATABASE_URL < full_export.sql
```

## Next Steps

1. Choose your preferred migration method
2. **Backup production database first**
3. Run the appropriate export files on your production database
4. Verify the data was imported correctly
5. Update your application's database connection to point to production

## Need Help?

Since I can only access the development database, you'll need to:
- Use the Replit database pane for production operations
- Contact Replit support if you need help with production database access
- Run the export files manually on your production environment

The export files I've created contain all your development data and are ready to use!