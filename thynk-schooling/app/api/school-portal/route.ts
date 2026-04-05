export const dynamic = 'force-dynamic'
/**
 * Consolidated School Portal Route
 *
 * GET   /api/school-portal?action=leads
 * PATCH /api/school-portal?action=leads   — update lead status
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

const VALID_STATUSES = ['new','contacted','interested','not_interested','admitted','lost']

async function ensureLeads() {
  await db.query(`CREATE TABLE IF NOT EXISTS leads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
}

// ─── leads ────────────────────────────────────────────────────────────────────

async function getLeads(req: NextRequest) {
  await ensureLeads()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = Number(new URL(req.url).searchParams.get('limit') || 10)
  const school = await db.query('SELECT id, profile_completed, is_active FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) return NextResponse.json([])
  if (!school.rows[0].profile_completed) {
    return NextResponse.json(
      { error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' },
      { status: 403 }
    )
  }
  if (school.rows[0].is_active === false) {
    return NextResponse.json(
      { error: 'ACCOUNT_SUSPENDED', message: 'Account suspended. Contact support.' },
      { status: 403 }
    )
  }
  const rows = await db.query(
    `SELECT l.*, u.full_name AS parent_name FROM leads l LEFT JOIN users u ON u.id=l.parent_id WHERE l.school_id=$1 ORDER BY l.created_at DESC LIMIT $2`,
    [school.rows[0].id, limit]
  )
  return NextResponse.json(rows.rows)
}

async function patchLead(req: NextRequest) {
  await ensureLeads()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id) return NextResponse.json({ error: 'Lead id is required' }, { status: 400 })
  if (!status || !VALID_STATUSES.includes(status))
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })
  const result = await db.query(`UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2 AND school_id=$3 RETURNING id, status`, [status, id, school.rows[0].id])
  if (!result.rows.length) return NextResponse.json({ error: 'Lead not found or does not belong to your school' }, { status: 404 })
  return NextResponse.json({ success: true, lead: result.rows[0] })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'leads') return await getLeads(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'leads') return await patchLead(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
