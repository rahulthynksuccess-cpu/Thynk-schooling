export const dynamic = 'force-dynamic'
/**
 * GET  /api/saved-schools — list parent's saved schools
 * POST /api/saved-schools — save a school { schoolId }
 * DELETE /api/saved-schools?schoolId=xxx — unsave
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      school_id UUID,
      UNIQUE(user_id, school_id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json([])
    const url = new URL(req.url)
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const rows = await db.query(
      `SELECT s.id, s.name, s.slug, s.city, s.state, s.logo_url, s.avg_rating, s.monthly_fee_min, s.board
       FROM saved_schools ss
       JOIN schools s ON s.id = ss.school_id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC
       LIMIT $2`,
      [userId, limit]
    )
    return NextResponse.json(rows.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { schoolId } = await req.json()
    if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
    await db.query(
      `INSERT INTO saved_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, schoolId]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTable()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const schoolId = new URL(req.url).searchParams.get('schoolId')
    if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
    await db.query(`DELETE FROM saved_schools WHERE user_id=$1 AND school_id=$2`, [userId, schoolId])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
