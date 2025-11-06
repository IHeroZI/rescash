import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    // Extract database connection info from Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    }

    // Parse Supabase URL to get the host
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    
    // Construct PostgreSQL connection string
    // Format: postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryDb<T = any>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> {
  const pool = getDbPool();
  const result = await pool.query(text, params);
  return result.rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryDbSingle<T = any>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T | null> {
  const rows = await queryDb<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
