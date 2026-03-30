export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS saved_schools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, school_id UUID, UNIQUE(user_id,school_id), created_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
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
    const limit = Number(new URL(req.url).searchParams.get('limit') || 4)
    const rows = await db.query(
      `SELECT s.* FROM saved_schools ss JOIN schools s ON s.id=ss.school_id
       WHERE ss.user_id=$1 ORDER BY ss.created_at DESC LIMIT $2`,
      [userId, limit]
    )
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}
