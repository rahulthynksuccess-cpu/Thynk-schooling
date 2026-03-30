export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(()=>{})
}

export async function GET() {
  await ensureTable()
  try {
    const res = await db.query("SELECT value FROM site_settings WHERE key = 'theme'")
    if (!res.rows.length) return Response.json({ theme: null })
    return Response.json({ theme: JSON.parse(res.rows[0].value) })
  } catch { return Response.json({ theme: null }) }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { theme } = await req.json()
    await db.query(
      `INSERT INTO site_settings (key,value,updated_at) VALUES ('theme',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`,
      [JSON.stringify(theme)]
    )
    return Response.json({ message: 'Theme saved' })
  } catch(e: any) {
    return Response.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
