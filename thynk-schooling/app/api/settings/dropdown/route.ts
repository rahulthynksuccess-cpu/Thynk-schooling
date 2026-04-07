export const dynamic = 'force-dynamic'
/**
 * GET /api/settings/dropdown?category=xxx — proxy to /api/settings?action=dropdown&category=xxx
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || ''
    const parentValue = url.searchParams.get('parentValue') || ''

    await db.query(`
      CREATE TABLE IF NOT EXISTS dropdown_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(100) NOT NULL,
        label VARCHAR(200) NOT NULL,
        value VARCHAR(200) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        parent_value VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {})

    let query = `SELECT label, value FROM dropdown_options WHERE category=$1 AND is_active=true`
    const params: any[] = [category]
    if (parentValue) { query += ` AND parent_value=$2`; params.push(parentValue) }
    query += ` ORDER BY sort_order, label`

    const rows = await db.query(query, params)
    return NextResponse.json({ options: rows.rows })
  } catch (e: any) {
    return NextResponse.json({ options: [], error: e.message }, { status: 500 })
  }
}
