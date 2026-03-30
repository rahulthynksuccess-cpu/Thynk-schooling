export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID, name VARCHAR(200), phone VARCHAR(20), email VARCHAR(200),
      city VARCHAR(100), query TEXT, status VARCHAR(50) DEFAULT 'pending',
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const body = await req.json()
    const { name, phone, email, city, query } = body
    await db.query(
      `INSERT INTO counselling_requests (name, phone, email, city, query) VALUES ($1,$2,$3,$4,$5)`,
      [name, phone, email||null, city||null, query||null]
    )
    return NextResponse.json({ success: true, message: 'Booking received!' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
