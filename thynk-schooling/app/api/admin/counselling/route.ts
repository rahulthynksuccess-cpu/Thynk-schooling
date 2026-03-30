export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID,
      name VARCHAR(200),
      phone VARCHAR(20),
      city VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function GET(req: NextRequest) {
  await ensureTable()
  try {
    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page') || 1))
    const limit  = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    const conds = ['1=1']
    const params: any[] = []
    if (status) { params.push(status); conds.push(`cr.status = $${params.length}`) }
    const where = conds.join(' AND ')
    params.push(limit, offset)

    const [rows, ct] = await Promise.all([
      db.query(`SELECT cr.*, u.full_name AS user_name FROM counselling_requests cr LEFT JOIN users u ON u.id = cr.parent_id WHERE ${where} ORDER BY cr.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      db.query(`SELECT COUNT(*) FROM counselling_requests cr WHERE ${where}`, params.slice(0,-2)),
    ])
    return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
  } catch { return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 }) }
}

export async function PUT(req: NextRequest) {
  await ensureTable()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const { status, notes } = await req.json()
    await db.query(`UPDATE counselling_requests SET status=$1, notes=$2 WHERE id=$3`, [status, notes, id])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
