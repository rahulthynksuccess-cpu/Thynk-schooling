export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID,
    school_id UUID,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {})
}

const VALID_STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'admitted', 'lost']

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const limit  = Number(new URL(req.url).searchParams.get('limit') || 10)
    const school = await db.query(`SELECT id FROM schools WHERE admin_user_id=$1`, [userId])
    if (!school.rows.length) return NextResponse.json([])
    const rows = await db.query(
      `SELECT l.*, u.full_name AS parent_name
       FROM leads l
       LEFT JOIN users u ON u.id = l.parent_id
       WHERE l.school_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2`,
      [school.rows[0].id, limit]
    )
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}

export async function PATCH(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 })
    }
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Confirm the lead belongs to this school admin's school
    const school = await db.query(
      `SELECT id FROM schools WHERE admin_user_id = $1`,
      [userId]
    )
    if (!school.rows.length) {
      return NextResponse.json({ error: 'School not found for this user' }, { status: 403 })
    }

    const result = await db.query(
      `UPDATE leads
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND school_id = $3
       RETURNING id, status`,
      [status, id, school.rows[0].id]
    )

    if (!result.rows.length) {
      return NextResponse.json(
        { error: 'Lead not found or does not belong to your school' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, lead: result.rows[0] })
  } catch (err) {
    console.error('[leads PATCH]', err)
    return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
  }
}
