export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
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
    const limit = Number(new URL(req.url).searchParams.get('limit') || 5)
    const rows = await db.query(
      `SELECT a.*, s.name AS school_name FROM applications a LEFT JOIN schools s ON s.id=a.school_id
       WHERE a.parent_id=$1 ORDER BY a.created_at DESC LIMIT $2`,
      [userId, limit]
    )
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}
