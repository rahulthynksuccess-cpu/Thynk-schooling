export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const res = await db.query("SELECT value FROM site_settings WHERE key = 'theme'")
    if (res.rows.length === 0) return Response.json({ theme: null })
    return Response.json({ theme: JSON.parse(res.rows[0].value) })
  } catch { return Response.json({ theme: null }) }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!token) return Response.json({ error: 'Unauthorised' }, { status: 401 })
    verifyAccessToken(token)
    await ensureTable()
    const { theme } = await req.json()
    await db.query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ('theme', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(theme)]
    )
    return Response.json({ message: 'Theme saved' })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
