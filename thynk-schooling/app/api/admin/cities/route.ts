export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS seo_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    state VARCHAR(120),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch(() => {})
}

export async function GET() {
  await ensureTable()
  try {
    const res = await db.query('SELECT * FROM seo_cities ORDER BY sort_order ASC, name ASC')
    return Response.json({ cities: res.rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ cities: [] }) }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { cities } = await req.json()
    // cities: [{name, slug, state, sort_order}]
    for (const c of cities) {
      await db.query(
        `INSERT INTO seo_cities(name,slug,state,sort_order,is_active) VALUES($1,$2,$3,$4,true)
         ON CONFLICT(slug) DO UPDATE SET name=$1,state=$3,sort_order=$4`,
        [c.name, c.slug || c.name.toLowerCase().replace(/\s+/g,'-'), c.state || '', c.sort_order || 0]
      )
    }
    return Response.json({ message: 'Saved' })
  } catch(e: any) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  await ensureTable()
  try {
    const { slug } = await req.json()
    await db.query('DELETE FROM seo_cities WHERE slug=$1', [slug])
    return Response.json({ success: true })
  } catch(e: any) { return Response.json({ error: e.message }, { status: 500 }) }
}
