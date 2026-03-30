export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') || 5)
    const school = await db.query('SELECT id FROM schools WHERE slug = $1', [params.slug])
    if (!school.rows.length) return NextResponse.json({ reviews: [] })
    const schoolId = school.rows[0].id
    const rows = await db.query(
      `SELECT r.*, u.full_name AS user_name FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.school_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC LIMIT $2`,
      [schoolId, limit]
    ).catch(() => ({ rows: [] }))
    return NextResponse.json({ reviews: rows.rows })
  } catch { return NextResponse.json({ reviews: [] }) }
}
