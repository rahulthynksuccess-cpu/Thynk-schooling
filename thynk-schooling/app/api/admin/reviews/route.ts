export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID, user_id UUID, rating INTEGER, content TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    const conds = ['1=1']; const params: any[] = []
    if (status) { params.push(status); conds.push(`r.status = $${params.length}`) }
    const where = conds.join(' AND ')
    params.push(limit, offset)
    const [rows, ct] = await Promise.all([
      db.query(`SELECT r.*, s.name AS school_name, u.full_name AS user_name FROM reviews r LEFT JOIN schools s ON s.id=r.school_id LEFT JOIN users u ON u.id=r.user_id WHERE ${where} ORDER BY r.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      db.query(`SELECT COUNT(*) FROM reviews r WHERE ${where}`, params.slice(0,-2)),
    ])
    return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
  } catch { return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 }) }
}

export async function PUT(req: NextRequest) {
  await ensure()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const { status } = await req.json()
    await db.query(`UPDATE reviews SET status=$1 WHERE id=$2`, [status, id])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  await ensure()
  try {
    const id = new URL(req.url).searchParams.get('id')
    await db.query(`DELETE FROM reviews WHERE id=$1`, [id])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
