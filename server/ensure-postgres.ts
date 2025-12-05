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
      connectTimeoutMillis: 2000
    });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch {
    return false;
  }
}

export async function ensurePostgresRunning(): Promise<void> {
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    
    // Check if using a remote database (e.g., Neon/Replit database)
    const isRemoteDatabase = databaseUrl && (
      databaseUrl.includes('neon.tech') || 
      databaseUrl.includes('amazonaws.com') ||
      databaseUrl.includes('pooler.supabase.com') ||
      (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1'))
    );
    
    if (isRemoteDatabase) {
      console.log(`Using remote database: ${databaseUrl}`);
      console.log('Skipping local PostgreSQL startup');
      return;
    }
    
    // Only delete these vars if we're using local database
    delete process.env.PGHOST;
    delete process.env.PGPORT;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
    delete process.env.PGDATABASE;
    
    process.env.DATABASE_URL = databaseUrl || 'postgresql://runner@localhost:5432/replit?sslmode=disable';
    console.log(`Using database: ${process.env.DATABASE_URL}`);
    
    if (await isPostgresReady()) {
      console.log('PostgreSQL is already running');
      return;
    }
    
    console.log('PostgreSQL not running, starting it...');
    
    const pgdataDir = '/home/runner/workspace/pgdata';
    if (!existsSync(pgdataDir)) {
      console.log('Initializing PostgreSQL data directory...');
      await execAsync(`mkdir -p ${pgdataDir} && unset PGPORT && /nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/initdb -D ${pgdataDir} --auth=trust`);
    }
    
    // Ensure correct permissions on pgdata directory (PostgreSQL requires 0700)
    await execAsync(`chmod 700 ${pgdataDir}`);
    
    // Create socket directory if it doesn't exist
    await execAsync(`mkdir -p ${pgdataDir}/socket && chmod 700 ${pgdataDir}/socket`);
    
    // Remove stale PID and lock files if they exist
    await execAsync(`rm -f ${pgdataDir}/postmaster.pid ${pgdataDir}/socket/.s.PGSQL.5432.lock ${pgdataDir}/socket/.s.PGSQL.5432`);
    
    // Create a clean environment without PG* variables
    const cleanEnv = { ...process.env };
    delete cleanEnv.PGHOST;
    delete cleanEnv.PGPORT;
    delete cleanEnv.PGUSER;
    delete cleanEnv.PGPASSWORD;
    delete cleanEnv.PGDATABASE;
    
    const postgresProcess = spawn(
      '/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/postgres',
      ['-D', pgdataDir, '-p', '5432', '-k', `${pgdataDir}/socket`],
      {
        detached: true,
        stdio: ['ignore', 'ignore', 'pipe'],
        env: cleanEnv
      }
    );
    
    // Capture stderr to a variable to debug startup issues
    let stderrOutput = '';
    postgresProcess.stderr?.on('data', (data) => {
      stderrOutput += data.toString();
    });
    
    postgresProcess.unref();
    
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (await isPostgresReady()) {
        console.log('PostgreSQL started successfully');
        
        try {
          await execAsync(`/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/createdb -h ${pgdataDir}/socket -p 5432 replit 2>/dev/null || true`);
        } catch (e) {
        }
        
        return;
      }
    }
    
    if (stderrOutput) {
      console.error('PostgreSQL stderr output:', stderrOutput);
    }
    throw new Error('PostgreSQL failed to start within 15 seconds');
  } catch (error) {
    console.error('Error ensuring PostgreSQL is running:', error);
    throw error;
  }
}
