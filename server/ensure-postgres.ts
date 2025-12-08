import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import pg from 'pg';

const { Pool } = pg;
const execAsync = promisify(exec);

async function isPostgresReady(): Promise<boolean> {
  try {
    const pool = new Pool({ 
      host: '/home/runner/workspace/pgdata/socket',
      port: 5432,
      user: 'runner',
      database: 'postgres',
      connectionTimeoutMillis: 2000
    });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch {
    return false;
  }
}

export async function ensurePostgresRunning(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  
  // Check if using Replit-managed database
  const useReplitDatabase = databaseUrl && 
    databaseUrl.length > 0 && 
    !databaseUrl.includes('localhost') && 
    !databaseUrl.includes('127.0.0.1');
  
  if (useReplitDatabase) {
    console.log('Using Replit-managed PostgreSQL database, skipping local startup');
    return;
  }
  
  console.log('Starting local PostgreSQL database');
  
  // Unset PG* environment variables that might interfere with local PostgreSQL
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;
  
  // Check if PostgreSQL is already running
  if (await isPostgresReady()) {
    console.log('PostgreSQL is already running');
    return;
  }
  
  const pgdataDir = '/home/runner/workspace/pgdata';
  const pgConfigFile = `${pgdataDir}/postgresql.conf`;
  
  // Initialize database if postgresql.conf doesn't exist
  if (!existsSync(pgConfigFile)) {
    console.log('Initializing PostgreSQL data directory...');
    // Create a clean environment for initdb
    const cleanInitEnv = { ...process.env };
    delete cleanInitEnv.PGHOST;
    delete cleanInitEnv.PGPORT;
    delete cleanInitEnv.PGUSER;
    delete cleanInitEnv.PGPASSWORD;
    delete cleanInitEnv.PGDATABASE;
    
    await execAsync(`mkdir -p ${pgdataDir} && /nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/initdb -D ${pgdataDir} --auth=trust`, {
      env: cleanInitEnv
    });
  }
  
  // Ensure correct permissions
  await execAsync(`chmod 700 ${pgdataDir}`);
  await execAsync(`mkdir -p ${pgdataDir}/socket && chmod 700 ${pgdataDir}/socket`);
  
  // Remove stale lock files
  await execAsync(`rm -f ${pgdataDir}/postmaster.pid ${pgdataDir}/socket/.s.PGSQL.5432* 2>/dev/null || true`);
  
  // Create a clean environment for PostgreSQL without PG* variables
  const cleanEnv = { ...process.env };
  delete cleanEnv.PGHOST;
  delete cleanEnv.PGPORT;
  delete cleanEnv.PGUSER;
  delete cleanEnv.PGPASSWORD;
  delete cleanEnv.PGDATABASE;
  
  // Start PostgreSQL
  const postgresProcess = spawn(
    '/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/postgres',
    ['-D', pgdataDir, '-p', '5432', '-k', `${pgdataDir}/socket`],
    {
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe'],
      env: cleanEnv
    }
  );
  
  let stderrOutput = '';
  postgresProcess.stderr?.on('data', (data) => {
    stderrOutput += data.toString();
  });
  
  postgresProcess.unref();
  
  // Wait for PostgreSQL to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (await isPostgresReady()) {
      console.log('PostgreSQL started successfully');
      
      // Create the replit database if it doesn't exist
      try {
        await execAsync(`/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/createdb -h ${pgdataDir}/socket -p 5432 replit 2>/dev/null || true`);
      } catch (e) {
        // Ignore errors - database might already exist
      }
      
      return;
    }
  }
  
  if (stderrOutput) {
    console.error('PostgreSQL stderr output:', stderrOutput);
  }
  throw new Error('PostgreSQL failed to start within 15 seconds');
}
