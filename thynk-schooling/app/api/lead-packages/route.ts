export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      leads_count INTEGER NOT NULL DEFAULT 10,
      price_paise INTEGER NOT NULL DEFAULT 29900,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const all = new URL(req.url).searchParams.get('all')
    const where = all ? '1=1' : 'is_active = true'
    const rows = await db.query(`SELECT * FROM lead_packages WHERE ${where} ORDER BY price_paise ASC`)
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const { name, description, leadsCount, pricePaise } = await req.json()
    const row = await db.query(
      `INSERT INTO lead_packages (name,description,leads_count,price_paise) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, description, leadsCount, pricePaise]
    )
    return NextResponse.json(row.rows[0])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  await ensure()
  try {
    const id = new URL(req.url).searchParams.get('id')
    const body = await req.json()
    const sets: string[] = []; const params: any[] = []
    if (body.name        !== undefined) { params.push(body.name);        sets.push(`name=$${params.length}`) }
    if (body.description !== undefined) { params.push(body.description); sets.push(`description=$${params.length}`) }
    if (body.leadsCount  !== undefined) { params.push(body.leadsCount);  sets.push(`leads_count=$${params.length}`) }
    if (body.pricePaise  !== undefined) { params.push(body.pricePaise);  sets.push(`price_paise=$${params.length}`) }
    if (body.isActive    !== undefined) { params.push(body.isActive);    sets.push(`is_active=$${params.length}`) }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    params.push(id)
    const row = await db.query(`UPDATE lead_packages SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params)
    return NextResponse.json(row.rows[0])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  await ensure()
  try {
    const id = new URL(req.url).searchParams.get('id')
    await db.query(`DELETE FROM lead_packages WHERE id=$1`, [id])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
