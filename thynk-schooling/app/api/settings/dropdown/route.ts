export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Ensure table exists with correct schema
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dropdown_options (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category     VARCHAR(60)  NOT NULL,
      label        VARCHAR(120) NOT NULL,
      value        VARCHAR(120) NOT NULL,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      parent_value VARCHAR(120),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category, value)
    )
  `).catch(() => {})
}

export async function GET(req: NextRequest) {
  await ensureTable()
  try {
    const { searchParams } = new URL(req.url)
    const category        = searchParams.get('category')
    const parentValue     = searchParams.get('parentValue')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 })

    const conditions: string[] = ['category = $1']
    const params: any[] = [category]

    if (parentValue) {
      params.push(parentValue)
      conditions.push(`parent_value = $${params.length}`)
    }
    if (!includeInactive) {
      conditions.push('is_active = true')
    }

    const result = await pool.query(
      `SELECT id, category, label, value,
              sort_order AS "sortOrder", is_active AS "isActive", parent_value AS "parentValue"
       FROM dropdown_options
       WHERE ${conditions.join(' AND ')}
       ORDER BY label ASC`,
      params
    )
    return NextResponse.json({ options: result.rows })
  } catch (err: any) {
    console.error('Dropdown GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { category, label, value, sortOrder = 0, parentValue } = await req.json()
    if (!category || !label || !value) {
      return NextResponse.json({ error: 'category, label and value are required' }, { status: 400 })
    }
    const result = await pool.query(
      `INSERT INTO dropdown_options (category, label, value, sort_order, parent_value)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (category, value) DO UPDATE SET label=$2, sort_order=$4
       RETURNING id, category, label, value,
                 sort_order AS "sortOrder", is_active AS "isActive", parent_value AS "parentValue"`,
      [category, label, value, sortOrder, parentValue || null]
    )
    return NextResponse.json({ option: result.rows[0] })
  } catch (err: any) {
    console.error('Dropdown POST error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  await ensureTable()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const { label, value, sortOrder, isActive, parentValue } = await req.json()
    const result = await pool.query(
      `UPDATE dropdown_options
       SET label        = COALESCE($1, label),
           value        = COALESCE($2, value),
           sort_order   = COALESCE($3, sort_order),
           is_active    = COALESCE($4, is_active),
           parent_value = $5
       WHERE id = $6
       RETURNING id, category, label, value,
                 sort_order AS "sortOrder", is_active AS "isActive", parent_value AS "parentValue"`,
      [label || null, value || null, sortOrder ?? null, isActive ?? null, parentValue || null, id]
    )
    if (!result.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ option: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await ensureTable()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query('DELETE FROM dropdown_options WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
