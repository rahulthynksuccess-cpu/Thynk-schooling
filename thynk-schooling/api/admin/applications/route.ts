export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
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
    if (status) { params.push(status); conds.push(`a.status = $${params.length}`) }
    const where = conds.join(' AND ')
    params.push(limit, offset)
    const [rows, ct] = await Promise.all([
      db.query(`SELECT a.*, s.name AS school_name, u.full_name AS parent_name FROM applications a LEFT JOIN schools s ON s.id=a.school_id LEFT JOIN users u ON u.id=a.parent_id WHERE ${where} ORDER BY a.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      db.query(`SELECT COUNT(*) FROM applications a WHERE ${where}`, params.slice(0,-2)),
    ])
    return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
  } catch { return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 }) }
}

export async function PUT(req: NextRequest) {
  await ensure()
  try {
    const id = new URL(req.url).searchParams.get('id')
    const { status } = await req.json()
    await db.query(`UPDATE applications SET status=$1 WHERE id=$2`, [status, id])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
