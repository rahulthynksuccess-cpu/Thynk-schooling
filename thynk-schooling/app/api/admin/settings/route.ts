export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

export async function GET() {
  await ensure()
  try {
    const res = await db.query("SELECT key, value FROM admin_settings")
    const out: Record<string,any> = {}
    res.rows.forEach((r:any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
    return Response.json(out)
  } catch { return Response.json({}) }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const { key, value } = await req.json()
    await db.query(
      `INSERT INTO admin_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`,
      [key, JSON.stringify(value)]
    )
    return Response.json({ message: 'Saved' })
  } catch(e: any) { return Response.json({ error: e.message||'Failed' }, { status:500 }) }
}
