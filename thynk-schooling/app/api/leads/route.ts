export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS leads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const limit  = Number(new URL(req.url).searchParams.get('limit') || 10)
    const school = await db.query(`SELECT id FROM schools WHERE admin_user_id=$1`, [userId])
    if (!school.rows.length) return NextResponse.json([])
    const rows = await db.query(
      `SELECT l.*, u.full_name AS parent_name FROM leads l LEFT JOIN users u ON u.id=l.parent_id
       WHERE l.school_id=$1 ORDER BY l.created_at DESC LIMIT $2`,
      [school.rows[0].id, limit]
    )
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}
