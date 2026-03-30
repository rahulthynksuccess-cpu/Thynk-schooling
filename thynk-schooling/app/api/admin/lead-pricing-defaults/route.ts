export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

export async function GET() {
  await ensure()
  try {
    const res = await db.query(`SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'`)
    if (!res.rows.length) return NextResponse.json({ pricePerLead: 299, bulkDiscount: 10, minLeads: 5 })
    return NextResponse.json(JSON.parse(res.rows[0].value))
  } catch { return NextResponse.json({ pricePerLead: 299, bulkDiscount: 10, minLeads: 5 }) }
}

export async function PUT(req: NextRequest) {
  await ensure()
  try {
    const body = await req.json()
    await db.query(`INSERT INTO admin_settings (key,value,updated_at) VALUES ('lead_pricing_defaults',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`, [JSON.stringify(body)])
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
