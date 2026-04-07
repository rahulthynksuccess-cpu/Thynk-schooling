export const dynamic = 'force-dynamic'
/**
 * GET /api/recommendations — returns active schools ordered by rating
 * In future: use child profile to personalise. For now returns top schools.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(20, Number(new URL(req.url).searchParams.get('limit') || 6))
    const rows = await db.query(
      `SELECT id, name, slug, city, state, logo_url, avg_rating, monthly_fee_min, board, school_type
       FROM schools
       WHERE is_active = true
       ORDER BY avg_rating DESC NULLS LAST, created_at DESC
       LIMIT $1`,
      [limit]
    ).catch(() => ({ rows: [] }))
    return NextResponse.json(rows.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
