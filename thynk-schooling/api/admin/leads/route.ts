export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    const conds = ['1=1']
    const params: any[] = []
    if (status) { params.push(status); conds.push(`lp.status = $${params.length}`) }

    const where = conds.join(' AND ')
    params.push(limit, offset)

    const [rows, ct] = await Promise.all([
      db.query(
        `SELECT lp.*, s.name AS school_name, u.full_name AS parent_name
         FROM lead_purchases lp
         LEFT JOIN schools s ON s.id = lp.school_id
         LEFT JOIN users u ON u.id = lp.parent_id
         WHERE ${where} ORDER BY lp.created_at DESC
         LIMIT $${params.length-1} OFFSET $${params.length}`,
        params
      ),
      db.query(`SELECT COUNT(*) FROM lead_purchases lp WHERE ${where}`, params.slice(0, -2)),
    ])
    return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
  } catch (e: any) {
    console.error('[admin/leads]', e)
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 })
  }
}
