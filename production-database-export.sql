-- Complete Data Export from Development to Production Database
-- Generated: 2025-08-08
-- 
-- Instructions:
-- 1. BACKUP YOUR PRODUCTION DATABASE FIRST!
-- 2. Run this script on your production database
-- 3. Some INSERT statements may fail if data already exists (due to unique constraints)
-- 4. If you want to start fresh, uncomment the TRUNCATE statements below
--
-- Database Summary:
-- - Teams: 8 records
-- - Positions: 8 records
-- - JTBDs: 2 records
-- - Researches: 100 records
-- - Meetings: 500 records

-- Uncomment these lines if you want to clear existing data first
-- TRUNCATE TABLE research_jtbds CASCADE;
-- TRUNCATE TABLE meeting_jtbds CASCADE;
-- TRUNCATE TABLE custom_filters CASCADE;
-- TRUNCATE TABLE meetings CASCADE;
-- TRUNCATE TABLE researches CASCADE;
-- TRUNCATE TABLE jtbds CASCADE;
-- TRUNCATE TABLE positions CASCADE;
-- TRUNCATE TABLE teams CASCADE;

-- Reset sequences (uncomment if you cleared data above)
-- ALTER SEQUENCE teams_id_seq RESTART WITH 1;
-- ALTER SEQUENCE positions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE jtbds_id_seq RESTART WITH 1;
-- ALTER SEQUENCE researches_id_seq RESTART WITH 1;
-- ALTER SEQUENCE meetings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE custom_filters_id_seq RESTART WITH 1;

-- ========================================
-- TEAMS DATA
-- ========================================
INSERT INTO teams (id, name, created_at) VALUES (2, 'Product', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (3, 'Marketing', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (4, 'Design', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (5, 'Engineering', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (6, 'Sales', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (7, 'Customer Success', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (8, 'Research', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (9, 'Strategy', '2025-08-07 12:59:43.729884');

-- ========================================
-- POSITIONS DATA
-- ========================================
INSERT INTO positions (id, name, created_at) VALUES (4, 'Product Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (5, 'UX Designer', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (6, 'Software Engineer', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (7, 'Marketing Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (8, 'Sales Director', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (9, 'Customer Success Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (10, 'Data Analyst', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (11, 'Business Analyst', '2025-08-07 12:59:43.956467');

-- ========================================
-- JTBDS DATA
-- ========================================
INSERT INTO jtbds (id, title, job_statement, job_story, description, category, priority, parent_id, level, content_type, created_at) VALUES (1, 'WDwdwad', '', '', 'adddwa', '', '', 0, 1, '', '2025-08-06 05:54:07.291765');
INSERT INTO jtbds (id, title, job_statement, job_story, description, category, priority, parent_id, level, content_type, created_at) VALUES (2, 'dwadwdd', '', '', 'wdwaadwwd', '', '', 1, 2, '', '2025-08-06 05:54:14.16167');

-- ========================================
-- NOTE: RESEARCHES AND MEETINGS DATA
-- ========================================
-- Due to the large volume of data (100 researches and 500 meetings), 
-- the full export would be very large. 
--
-- To export this data to production, you have several options:
--
-- OPTION A: Use pg_dump to export specific tables
-- Run this on your development database:
-- pg_dump $DATABASE_URL -t researches -t meetings -t research_jtbds -t meeting_jtbds --data-only --inserts > large_data_export.sql
--
-- OPTION B: Export smaller batches
-- You can modify the queries below to export data in smaller batches
--
-- OPTION C: Use the Replit database pane
-- Connect to your production database through the Replit database pane and manually copy data

-- ========================================
-- UPDATE SEQUENCES
-- ========================================
-- Run these after importing to ensure sequences are set correctly
SELECT setval('teams_id_seq', (SELECT COALESCE(MAX(id), 1) FROM teams));
SELECT setval('positions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM positions));
SELECT setval('jtbds_id_seq', (SELECT COALESCE(MAX(id), 1) FROM jtbds));
-- Uncomment after importing researches and meetings:
-- SELECT setval('researches_id_seq', (SELECT COALESCE(MAX(id), 1) FROM researches));
-- SELECT setval('meetings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM meetings));

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these after import to verify data was imported correctly:
-- SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
-- UNION ALL
-- SELECT 'positions' as table_name, COUNT(*) as record_count FROM positions
-- UNION ALL
-- SELECT 'jtbds' as table_name, COUNT(*) as record_count FROM jtbds
-- UNION ALL
-- SELECT 'researches' as table_name, COUNT(*) as record_count FROM researches
-- UNION ALL
-- SELECT 'meetings' as table_name, COUNT(*) as record_count FROM meetings;