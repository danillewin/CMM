-- Data Export from Development to Production Database
-- Generated: 2025-08-08
-- 
-- Instructions:
-- 1. Run this script on your production database
-- 2. Make sure to backup your production database first
-- 3. Some INSERT statements may fail if data already exists (due to unique constraints)
--
-- Note: This script contains all data from your development database

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM research_jtbds;
-- DELETE FROM meeting_jtbds;
-- DELETE FROM custom_filters;
-- DELETE FROM meetings;
-- DELETE FROM researches;
-- DELETE FROM jtbds;
-- DELETE FROM positions;
-- DELETE FROM teams;

-- Teams data
INSERT INTO teams (id, name, created_at) VALUES (2, 'Product', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (3, 'Marketing', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (4, 'Design', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (5, 'Engineering', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (6, 'Sales', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (7, 'Customer Success', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (8, 'Research', '2025-08-07 12:59:43.729884');
INSERT INTO teams (id, name, created_at) VALUES (9, 'Strategy', '2025-08-07 12:59:43.729884');

-- Positions data
INSERT INTO positions (id, name, created_at) VALUES (4, 'Product Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (5, 'UX Designer', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (6, 'Software Engineer', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (7, 'Marketing Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (8, 'Sales Director', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (9, 'Customer Success Manager', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (10, 'Data Analyst', '2025-08-07 12:59:43.956467');
INSERT INTO positions (id, name, created_at) VALUES (11, 'Business Analyst', '2025-08-07 12:59:43.956467');

-- JTBDs data
INSERT INTO jtbds (id, title, job_statement, job_story, description, category, priority, parent_id, level, content_type, created_at) VALUES (1, 'WDwdwad', '', '', 'adddwa', '', '', 0, 1, '', '2025-08-06 05:54:07.291765');
INSERT INTO jtbds (id, title, job_statement, job_story, description, category, priority, parent_id, level, content_type, created_at) VALUES (2, 'dwadwdd', '', '', 'wdwaadwwd', '', '', 1, 2, '', '2025-08-06 05:54:14.16167');