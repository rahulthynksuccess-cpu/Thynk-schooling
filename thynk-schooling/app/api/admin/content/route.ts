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
    // Return all page_content + site_settings content keys merged
    const [pages, settings] = await Promise.all([
      db.query("SELECT key, value FROM page_content ORDER BY key"),
      db.query("SELECT key, value FROM site_settings WHERE key LIKE 'content%'"),
    ])
    const out: Record<string,any> = {}
    pages.rows.forEach((r: any) => { try { out[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value } catch { out[r.key] = r.value } })
    settings.rows.forEach((r: any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
    return Response.json(out)
  } catch { return Response.json({}) }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!token) return Response.json({ error: 'Unauthorised' }, { status: 401 })
    verifyAccessToken(token)
    await ensureTable()
    const { key, value } = await req.json()
    // Write to page_content for text content
    await db.query(
      `INSERT INTO page_content (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    )
    // Also write CSS to site_settings so layout.tsx and ContentStyleInjector can find it
    if (key === 'content.css') {
      await db.query(
        `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
      ).catch(() => {})
      await db.query(
        `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      )
    }
    return Response.json({ message: 'Saved' })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
