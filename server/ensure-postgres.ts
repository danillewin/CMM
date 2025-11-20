import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import pg from 'pg';

const { Pool } = pg;
const execAsync = promisify(exec);

async function isPostgresReady(): Promise<boolean> {
  try {
    const pool = new Pool({ connectionString: 'postgresql://runner@localhost:5432/postgres?connect_timeout=2' });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch {
    return false;
  }
}

export async function ensurePostgresRunning(): Promise<void> {
  try {
    delete process.env.PGHOST;
    delete process.env.PGPORT;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
    delete process.env.PGDATABASE;
    
    process.env.DATABASE_URL = process.env.DATABASE_URL?.trim() || 'postgresql://runner@localhost:5432/replit?sslmode=disable';
    console.log(`Using database: ${process.env.DATABASE_URL}`);
    
    // Check if using a remote database (e.g., Neon)
    const isRemoteDatabase = process.env.DATABASE_URL.includes('neon.tech') || 
                             process.env.DATABASE_URL.includes('amazonaws.com') ||
                             (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'));
    
    if (isRemoteDatabase) {
      console.log('Using remote database, skipping local PostgreSQL startup');
      return;
    }
    
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
    
    const postgresProcess = spawn(
      '/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/postgres',
      ['-D', pgdataDir, '-p', '5432', '-k', `${pgdataDir}/socket`],
      {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          PGHOST: undefined,
          PGPORT: undefined,
          PGUSER: undefined,
          PGPASSWORD: undefined,
          PGDATABASE: undefined,
        }
      }
    );
    
    postgresProcess.unref();
    
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (await isPostgresReady()) {
        console.log('PostgreSQL started successfully');
        
        try {
          await execAsync('/nix/store/bgwr5i8jf8jpg75rr53rz3fqv5k8yrwp-postgresql-16.10/bin/createdb -h 127.0.0.1 -p 5432 replit 2>/dev/null || true');
        } catch (e) {
        }
        
        return;
      }
    }
    
    throw new Error('PostgreSQL failed to start within 15 seconds');
  } catch (error) {
    console.error('Error ensuring PostgreSQL is running:', error);
    throw error;
  }
}
