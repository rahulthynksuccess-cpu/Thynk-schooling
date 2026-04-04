import { Pool } from 'pg';

// Supabase pooler (port 6543) requires no SSL object - just the connection string
// Direct connection (port 5432) requires ssl: { rejectUnauthorized: false }
const isSupabasePooler = process.env.DATABASE_URL?.includes('pooler.supabase.com')
const isLocalhost      = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalhost ? false : isSupabasePooler ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message);
});

export default pool;
