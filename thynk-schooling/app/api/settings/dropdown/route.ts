import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Force dynamic — reads request.url search params
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category      = searchParams.get('category')
    const parentValue   = searchParams.get('parentValue')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!category) {
      return NextResponse.json({ error: 'category param is required' }, { status: 400 })
    }

    let query  = 'SELECT * FROM dropdown_options WHERE category = $1'
    const params: string[] = [category]

    if (!includeInactive) {
      query += ' AND is_active = true'
    }
    if (parentValue) {
      params.push(parentValue)
      query += ` AND parent_value = $${params.length}`
    }

    query += ' ORDER BY sort_order ASC, label ASC'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/settings/dropdown error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, label, value, sortOrder = 0, parentValue, isActive = true } = body

    if (!category || !label || !value) {
      return NextResponse.json({ error: 'category, label, value are required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO dropdown_options (category, label, value, sort_order, parent_value, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [category, label, value, sortOrder, parentValue || null, isActive]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/settings/dropdown error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id   = searchParams.get('id')
    const body = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id param required' }, { status: 400 })
    }

    const fields  = Object.keys(body)
    const values  = Object.values(body)
    const setClause = fields
      .map((f, i) => `${f} = $${i + 2}`)
      .join(', ')

    const result = await pool.query(
      `UPDATE dropdown_options SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    )
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('PUT /api/settings/dropdown error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id param required' }, { status: 400 })
    }

    await pool.query(
      'UPDATE dropdown_options SET is_active = false WHERE id = $1',
      [id]
    )
    return NextResponse.json({ success: true, message: 'Option deactivated' })
  } catch (err) {
    console.error('DELETE /api/settings/dropdown error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
