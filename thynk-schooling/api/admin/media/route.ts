export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS media_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch(() => {})
}

export async function GET() {
  await ensureTable()
  try {
    const res = await db.query('SELECT key, value FROM media_settings')
    const data: Record<string,string> = {}
    res.rows.forEach((r: any) => { data[r.key] = r.value })
    return Response.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ data: {} }) }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { settings } = await req.json()
    for (const [k, v] of Object.entries(settings as Record<string,string>)) {
      await db.query(
        `INSERT INTO media_settings(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=$2,updated_at=NOW()`,
        [k, v]
      )
    }
    return Response.json({ message: 'Saved' })
  } catch(e: any) { return Response.json({ error: e.message }, { status: 500 }) }
}
