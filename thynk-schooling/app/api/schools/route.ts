import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Force dynamic — this route reads request.url (search params)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city   = searchParams.get('city')
    const board  = searchParams.get('board')
    const search = searchParams.get('search')
    const limit  = Number(searchParams.get('limit'))  || 50
    const page   = Number(searchParams.get('page'))   || 1
    const offset = (page - 1) * limit

    let query = 'SELECT * FROM schools WHERE 1=1'
    const params: (string | number)[] = []

    if (city)   { params.push(city);          query += ` AND city = $${params.length}` }
    if (board)  { params.push(board);         query += ` AND $${params.length} = ANY(board)` }
    if (search) { params.push(`%${search}%`); query += ` AND name ILIKE $${params.length}` }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM schools WHERE 1=1${city ? ` AND city = '${city}'` : ''}`,
      []
    )
    const total = Number(countResult.rows[0].count)

    params.push(limit);  query += ` ORDER BY avg_rating DESC LIMIT $${params.length}`
    params.push(offset); query += ` OFFSET $${params.length}`

    const result = await pool.query(query, params)

    return NextResponse.json({
      data:       result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('GET /api/schools error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
