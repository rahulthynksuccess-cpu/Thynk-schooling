import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,   // fail fast if DB unreachable (5s not 30s)
  idleTimeoutMillis: 30000,
  max: 10,
});

// Log connection errors without crashing the process
pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message);
});

export default pool;
