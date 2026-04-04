export const dynamic = 'force-dynamic'
/**
 * Consolidated School Slug Route
 * GET /api/schools/[slug]              — get school by slug
 * GET /api/schools/[slug]?action=reviews — get reviews
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'reviews') {
      const limit = Number(new URL(req.url).searchParams.get('limit') || 5)
      const school = await db.query('SELECT id FROM schools WHERE slug=$1', [params.slug])
      if (!school.rows.length) return NextResponse.json({ reviews: [] })
      const rows = await db.query(
        `SELECT r.*, u.full_name AS user_name FROM reviews r
         LEFT JOIN users u ON u.id=r.user_id
         WHERE r.school_id=$1 AND r.status='approved'
         ORDER BY r.created_at DESC LIMIT $2`,
        [school.rows[0].id, limit]
      ).catch(() => ({ rows: [] }))
      return NextResponse.json({ reviews: rows.rows })
    }
    const result = await db.query('SELECT * FROM schools WHERE slug=$1', [params.slug])
    if (!result.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    return NextResponse.json({ school: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
