export const dynamic = 'force-dynamic'
/**
 * GET /api/settings/dropdown?category=xxx         — single category
 * GET /api/settings/dropdown?categories=a,b,c     — batch: multiple categories in ONE query
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
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
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    await ensureTable()

    // ── Batch mode: ?categories=board,school_type,city,... ─────────────────
    const categoriesParam = url.searchParams.get('categories')
    if (categoriesParam) {
      const cats = categoriesParam.split(',').map(c => c.trim()).filter(Boolean)
      if (!cats.length) return NextResponse.json({})

      // Single query fetching all categories at once
      const rows = await db.query(
        `SELECT category, label, value FROM dropdown_options
         WHERE category = ANY($1::text[]) AND is_active = true
         ORDER BY category, sort_order, label`,
        [cats]
      )

      // Group by category
      const result: Record<string, { label: string; value: string }[]> = {}
      for (const cat of cats) result[cat] = []
      for (const row of rows.rows) {
        if (result[row.category]) result[row.category].push({ label: row.label, value: row.value })
      }
      return NextResponse.json(result)
    }

    // ── Single mode: ?category=xxx ─────────────────────────────────────────
    const category = url.searchParams.get('category') || ''
    const parentValue = url.searchParams.get('parentValue') || ''

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
