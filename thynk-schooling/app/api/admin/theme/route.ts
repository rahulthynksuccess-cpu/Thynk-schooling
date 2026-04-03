export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(()=>{})
}

const DEFAULTS = {
  containerWidth: 1600,
  ivory: '#FAF7F2', ivory2: '#F5F0E8', ivory3: '#EDE5D8',
  ink: '#0D1117', ink2: '#1C2333', inkMuted: '#4A5568', inkFaint: '#A0ADB8',
  gold: '#B8860B', gold2: '#C9960D', goldLight: '#E8C547', goldWash: '#FEF7E0',
}

export async function GET() {
  await ensureTable()
  try {
    const res = await db.query("SELECT value FROM site_settings WHERE key = 'theme'")
    let theme = res.rows.length ? JSON.parse(res.rows[0].value) : null
    // Always enforce 1600 default if not explicitly set
    if (theme && !theme.containerWidth) theme.containerWidth = 1600
    if (!theme) theme = DEFAULTS
    return Response.json({ theme }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' }
    })
  } catch { return Response.json({ theme: DEFAULTS }, { headers: { 'Cache-Control': 'no-store' } }) }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { theme } = await req.json()
    // Enforce minimum container width
    if (theme && !theme.containerWidth) theme.containerWidth = 1600
    await db.query(
      `INSERT INTO site_settings (key,value,updated_at) VALUES ('theme',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`,
      [JSON.stringify(theme)]
    )
    return Response.json({ message: 'Theme saved' })
  } catch(e: any) {
    return Response.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
