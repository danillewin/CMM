import { db } from './server/db';
import { teams, positions, researches, meetings, jtbds } from './shared/schema';
import fs from 'fs';

async function generateExport() {
  console.log('Starting data export...');
  
  let exportSQL = `-- Data Export from Development to Production Database
-- Generated: ${new Date().toISOString()}
-- 
-- Instructions:
-- 1. Run this script on your production database
-- 2. Make sure to backup your production database first
-- 3. Some INSERT statements may fail if data already exists (due to unique constraints)
--
-- Note: This script contains all data from your development database

-- Clear existing data (optional - uncomment if you want to start fresh)
-- TRUNCATE TABLE research_jtbds CASCADE;
-- TRUNCATE TABLE meeting_jtbds CASCADE;
-- TRUNCATE TABLE custom_filters CASCADE;
-- TRUNCATE TABLE meetings CASCADE;
-- TRUNCATE TABLE researches CASCADE;
-- TRUNCATE TABLE jtbds CASCADE;
-- TRUNCATE TABLE positions CASCADE;
-- TRUNCATE TABLE teams CASCADE;

-- Reset sequences (optional - uncomment if you cleared data above)
-- ALTER SEQUENCE teams_id_seq RESTART WITH 1;
-- ALTER SEQUENCE positions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE jtbds_id_seq RESTART WITH 1;
-- ALTER SEQUENCE researches_id_seq RESTART WITH 1;
-- ALTER SEQUENCE meetings_id_seq RESTART WITH 1;

`;

  // Export teams
  console.log('Exporting teams...');
  const teamsData = await db.select().from(teams);
  exportSQL += '\n-- Teams data\n';
  for (const team of teamsData) {
    const name = team.name.replace(/'/g, "''");
    exportSQL += `INSERT INTO teams (id, name, created_at) VALUES (${team.id}, '${name}', '${team.created_at.toISOString()}');\n`;
  }

  // Export positions
  console.log('Exporting positions...');
  const positionsData = await db.select().from(positions);
  exportSQL += '\n-- Positions data\n';
  for (const position of positionsData) {
    const name = position.name.replace(/'/g, "''");
    exportSQL += `INSERT INTO positions (id, name, created_at) VALUES (${position.id}, '${name}', '${position.created_at.toISOString()}');\n`;
  }

  // Export jtbds
  console.log('Exporting jtbds...');
  const jtbdsData = await db.select().from(jtbds);
  exportSQL += '\n-- JTBDs data\n';
  for (const jtbd of jtbdsData) {
    const title = jtbd.title?.replace(/'/g, "''") || '';
    const jobStatement = jtbd.job_statement?.replace(/'/g, "''") || '';
    const jobStory = jtbd.job_story?.replace(/'/g, "''") || '';
    const description = jtbd.description?.replace(/'/g, "''") || '';
    const category = jtbd.category?.replace(/'/g, "''") || '';
    const priority = jtbd.priority?.replace(/'/g, "''") || '';
    const contentType = jtbd.content_type?.replace(/'/g, "''") || '';
    
    exportSQL += `INSERT INTO jtbds (id, title, job_statement, job_story, description, category, priority, parent_id, level, content_type, created_at) VALUES (${jtbd.id}, '${title}', '${jobStatement}', '${jobStory}', '${description}', '${category}', '${priority}', ${jtbd.parent_id || 'NULL'}, ${jtbd.level}, '${contentType}', '${jtbd.created_at.toISOString()}');\n`;
  }

  // Export researches (first 10 to keep manageable)
  console.log('Exporting researches...');
  const researchesData = await db.select().from(researches);
  exportSQL += '\n-- Researches data\n';
  for (const research of researchesData) {
    const escape = (str: string | null) => str ? str.replace(/'/g, "''") : '';
    const arrayToSQL = (arr: string[] | null) => {
      if (!arr || arr.length === 0) return 'ARRAY[]::text[]';
      const escaped = arr.map(item => `'${escape(item)}'`);
      return `ARRAY[${escaped.join(', ')}]`;
    };
    
    exportSQL += `INSERT INTO researches (id, name, team, researcher, description, date_start, date_end, status, color, research_type, products, customer_full_name, additional_stakeholders, result_format, customer_segment_description, project_background, problem_to_solve, results_usage, product_metrics, limitations, research_goals, research_hypotheses, key_questions, previous_resources, additional_materials, related_researches, figma_prototype_link, artifact_link, brief, guide, guide_intro_text, guide_intro_questions, guide_main_questions, guide_concluding_questions, full_text, clients_we_search_for, invite_template) VALUES (`;
    
    exportSQL += `${research.id}, `;
    exportSQL += `'${escape(research.name)}', `;
    exportSQL += `'${escape(research.team)}', `;
    exportSQL += `'${escape(research.researcher)}', `;
    exportSQL += `'${escape(research.description)}', `;
    exportSQL += `${research.date_start ? `'${research.date_start.toISOString()}'` : 'NULL'}, `;
    exportSQL += `${research.date_end ? `'${research.date_end.toISOString()}'` : 'NULL'}, `;
    exportSQL += `'${escape(research.status)}', `;
    exportSQL += `'${escape(research.color)}', `;
    exportSQL += `'${escape(research.research_type)}', `;
    exportSQL += `${arrayToSQL(research.products)}, `;
    exportSQL += `'${escape(research.customer_full_name)}', `;
    exportSQL += `${arrayToSQL(research.additional_stakeholders)}, `;
    exportSQL += `'${escape(research.result_format)}', `;
    exportSQL += `'${escape(research.customer_segment_description)}', `;
    exportSQL += `'${escape(research.project_background)}', `;
    exportSQL += `'${escape(research.problem_to_solve)}', `;
    exportSQL += `'${escape(research.results_usage)}', `;
    exportSQL += `'${escape(research.product_metrics)}', `;
    exportSQL += `'${escape(research.limitations)}', `;
    exportSQL += `'${escape(research.research_goals)}', `;
    exportSQL += `'${escape(research.research_hypotheses)}', `;
    exportSQL += `'${escape(research.key_questions)}', `;
    exportSQL += `'${escape(research.previous_resources)}', `;
    exportSQL += `'${escape(research.additional_materials)}', `;
    exportSQL += `${arrayToSQL(research.related_researches)}, `;
    exportSQL += `'${escape(research.figma_prototype_link)}', `;
    exportSQL += `'${escape(research.artifact_link)}', `;
    exportSQL += `'${escape(research.brief)}', `;
    exportSQL += `'${escape(research.guide)}', `;
    exportSQL += `'${escape(research.guide_intro_text)}', `;
    exportSQL += `'${escape(research.guide_intro_questions)}', `;
    exportSQL += `'${escape(research.guide_main_questions)}', `;
    exportSQL += `'${escape(research.guide_concluding_questions)}', `;
    exportSQL += `'${escape(research.full_text)}', `;
    exportSQL += `'${escape(research.clients_we_search_for)}', `;
    exportSQL += `'${escape(research.invite_template)}'`;
    
    exportSQL += ');\n';
  }

  // Export meetings (first 20 to keep manageable)
  console.log('Exporting meetings...');
  const meetingsData = await db.select().from(meetings).limit(20);
  exportSQL += '\n-- Meetings data (first 20 records)\n';
  for (const meeting of meetingsData) {
    const escape = (str: string | null) => str ? str.replace(/'/g, "''") : '';
    
    exportSQL += `INSERT INTO meetings (id, respondent_name, respondent_position, cnum, gcc, company_name, email, researcher, relationship_manager, recruiter, date, research_id, status, notes, full_text, has_gift) VALUES (`;
    
    exportSQL += `${meeting.id}, `;
    exportSQL += `'${escape(meeting.respondent_name)}', `;
    exportSQL += `'${escape(meeting.respondent_position)}', `;
    exportSQL += `'${escape(meeting.cnum)}', `;
    exportSQL += `'${escape(meeting.gcc)}', `;
    exportSQL += `'${escape(meeting.company_name)}', `;
    exportSQL += `'${escape(meeting.email)}', `;
    exportSQL += `'${escape(meeting.researcher)}', `;
    exportSQL += `'${escape(meeting.relationship_manager)}', `;
    exportSQL += `'${escape(meeting.recruiter)}', `;
    exportSQL += `${meeting.date ? `'${meeting.date.toISOString()}'` : 'NULL'}, `;
    exportSQL += `${meeting.research_id || 'NULL'}, `;
    exportSQL += `'${escape(meeting.status)}', `;
    exportSQL += `'${escape(meeting.notes)}', `;
    exportSQL += `'${escape(meeting.full_text)}', `;
    exportSQL += `'${escape(meeting.has_gift)}'`;
    
    exportSQL += ');\n';
  }

  exportSQL += '\n-- Update sequences to avoid conflicts\n';
  exportSQL += `SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));\n`;
  exportSQL += `SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));\n`;
  exportSQL += `SELECT setval('jtbds_id_seq', (SELECT MAX(id) FROM jtbds));\n`;
  exportSQL += `SELECT setval('researches_id_seq', (SELECT MAX(id) FROM researches));\n`;
  exportSQL += `SELECT setval('meetings_id_seq', (SELECT MAX(id) FROM meetings));\n`;

  fs.writeFileSync('export-to-production.sql', exportSQL);
  console.log('Export complete! File saved as export-to-production.sql');
  
  // Print summary
  console.log('\nExport Summary:');
  console.log(`- Teams: ${teamsData.length} records`);
  console.log(`- Positions: ${positionsData.length} records`);
  console.log(`- JTBDs: ${jtbdsData.length} records`);
  console.log(`- Researches: ${researchesData.length} records`);
  console.log(`- Meetings: ${Math.min(meetingsData.length, 20)} records (limited to first 20)`);
}

generateExport().catch(console.error);