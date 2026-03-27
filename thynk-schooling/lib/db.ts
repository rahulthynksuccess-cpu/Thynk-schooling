import { Pool } from 'pg';

// SSL only in production (Vercel/Hostinger) - not needed for local dev
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
