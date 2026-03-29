export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensureTables() {
  await db.query(`CREATE TABLE IF NOT EXISTS page_content (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT \'{}\', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(()=>{})
  await db.query(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(()=>{})
}

function isAdmin(req: NextRequest): boolean {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || ''
    if (!token) return false
    // Verify with ignoreExpiration so saved sessions still work
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return payload?.role === 'admin' || payload?.role === 'super_admin'
  } catch { return false }
}

export async function GET(req: NextRequest) {
  await ensureTables()
  try {
    const key = new URL(req.url).searchParams.get('key')
    if (key) {
      const res = await db.query("SELECT value FROM page_content WHERE key = $1", [key])
      if (!res.rows.length) return Response.json({ content: {} })
      try { return Response.json({ content: JSON.parse(res.rows[0].value) }) }
      catch { return Response.json({ content: res.rows[0].value }) }
    }
    const [pages, settings] = await Promise.all([
      db.query("SELECT key, value FROM page_content ORDER BY key"),
      db.query("SELECT key, value FROM site_settings WHERE key LIKE \'content%\'"),
    ])
    const out: Record<string,any> = {}
    pages.rows.forEach((r: any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
    settings.rows.forEach((r: any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
    return Response.json(out)
  } catch { return Response.json({}) }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  await ensureTables()
  try {
    const { key, value } = await req.json()
    const stored = JSON.stringify(value)
    await db.query(
      `INSERT INTO page_content (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`,
      [key, stored]
    )
    if (key === 'content.css') {
      await db.query(
        `INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`,
        [key, stored]
      )
    }
    return Response.json({ message: 'Saved' })
  } catch(e: any) {
    return Response.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
