export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS page_content (
      key         TEXT PRIMARY KEY,
      value       JSONB NOT NULL DEFAULT '{}',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const key = new URL(req.url).searchParams.get('key')
    if (key) {
      const res = await db.query("SELECT value FROM page_content WHERE key = $1", [key])
      return Response.json({ content: res.rows[0]?.value ?? {} })
    }
    const res = await db.query("SELECT key, value, updated_at FROM page_content ORDER BY key")
    return Response.json({ pages: res.rows })
  } catch { return Response.json({ content: {} }) }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!token) return Response.json({ error: 'Unauthorised' }, { status: 401 })
    verifyAccessToken(token) // throws if invalid
    await ensureTable()
    const { key, value } = await req.json()
    await db.query(
      `INSERT INTO page_content (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    )
    return Response.json({ message: 'Saved' })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
