export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS seo_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key VARCHAR(120) NOT NULL,
    param_key VARCHAR(200) NOT NULL,
    param_value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(page_key, param_key)
  )`).catch(() => {})
}

export async function GET(req: NextRequest) {
  await ensureTable()
  try {
    const pageKey = new URL(req.url).searchParams.get('page') || 'global'
    const res = await db.query(
      `SELECT param_key, param_value FROM seo_settings WHERE page_key=$1 ORDER BY param_key`,
      [pageKey]
    )
    const data: Record<string,string> = {}
    res.rows.forEach((r: any) => { data[r.param_key] = r.param_value })
    return Response.json({ data })
  } catch { return Response.json({ data: {} }) }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { pageKey, params } = await req.json()
    // params is { key: value, ... }
    for (const [k, v] of Object.entries(params as Record<string,string>)) {
      await db.query(
        `INSERT INTO seo_settings(page_key,param_key,param_value,updated_at) VALUES($1,$2,$3,NOW())
         ON CONFLICT(page_key,param_key) DO UPDATE SET param_value=$3,updated_at=NOW()`,
        [pageKey, k, v]
      )
    }
    return Response.json({ message: 'SEO settings saved' })
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await ensureTable()
  try {
    const { pageKey, paramKey } = await req.json()
    await db.query(`DELETE FROM seo_settings WHERE page_key=$1 AND param_key=$2`, [pageKey, paramKey])
    return Response.json({ success: true })
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
