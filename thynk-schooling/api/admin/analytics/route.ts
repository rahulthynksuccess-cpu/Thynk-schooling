export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [signups, schools] = await Promise.all([
      db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users 
                WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`
      ).catch(() => ({ rows: [] })),
      db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM schools 
                WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`
      ).catch(() => ({ rows: [] })),
    ])
    return NextResponse.json({ signups: signups.rows, schools: schools.rows })
  } catch {
    return NextResponse.json({ signups: [], schools: [] })
  }
}
