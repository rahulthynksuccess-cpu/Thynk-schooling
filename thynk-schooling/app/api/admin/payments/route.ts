export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const params = [limit, offset]
    const rows = await db.query(
      `SELECT lp.*, s.name AS school_name FROM lead_purchases lp LEFT JOIN schools s ON s.id=lp.school_id ORDER BY lp.created_at DESC LIMIT $1 OFFSET $2`,
      params
    ).catch(() => ({ rows: [] }))
    const ct = await db.query(`SELECT COUNT(*) FROM lead_purchases`).catch(() => ({ rows: [{ count: 0 }] }))
    return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
  } catch { return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 }) }
}
