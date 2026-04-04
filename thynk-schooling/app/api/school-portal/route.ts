export const dynamic = 'force-dynamic'
/**
 * Consolidated School Portal Route
 *
 * GET   /api/school-portal?action=leads
 * PATCH /api/school-portal?action=leads        — update lead status
 * GET   /api/school-portal?action=lead-packages
 * POST  /api/school-portal?action=lead-packages
 * PUT   /api/school-portal?action=lead-packages&id=...
 * DELETE /api/school-portal?action=lead-packages&id=...
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

async function ensureLeadPackages() {
  await db.query(`CREATE TABLE IF NOT EXISTS lead_packages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(200) NOT NULL, description TEXT, leads_count INTEGER NOT NULL DEFAULT 10, price_paise INTEGER NOT NULL DEFAULT 29900, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
}

// ─── leads ────────────────────────────────────────────────────────────────────

async function getLeads(req: NextRequest) {
  await ensureLeads()
  const userId = getUserId(req)
  const limit = Number(new URL(req.url).searchParams.get('limit') || 10)
  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) return NextResponse.json([])
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

// ─── lead-packages ────────────────────────────────────────────────────────────

async function getLeadPackages(req: NextRequest) {
  await ensureLeadPackages()
  const all = new URL(req.url).searchParams.get('all')
  const rows = await db.query(`SELECT * FROM lead_packages WHERE ${all ? '1=1' : 'is_active=true'} ORDER BY price_paise ASC`)
  return NextResponse.json(rows.rows)
}

async function createLeadPackage(req: NextRequest) {
  await ensureLeadPackages()
  const { name, description, leadsCount, pricePaise } = await req.json()
  const row = await db.query(`INSERT INTO lead_packages (name,description,leads_count,price_paise) VALUES ($1,$2,$3,$4) RETURNING *`, [name, description, leadsCount, pricePaise])
  return NextResponse.json(row.rows[0])
}

async function updateLeadPackage(req: NextRequest) {
  await ensureLeadPackages()
  const id = new URL(req.url).searchParams.get('id')
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  if (body.name        !== undefined) { params.push(body.name);        sets.push(`name=$${params.length}`) }
  if (body.description !== undefined) { params.push(body.description); sets.push(`description=$${params.length}`) }
  if (body.leadsCount  !== undefined) { params.push(body.leadsCount);  sets.push(`leads_count=$${params.length}`) }
  if (body.pricePaise  !== undefined) { params.push(body.pricePaise);  sets.push(`price_paise=$${params.length}`) }
  if (body.isActive    !== undefined) { params.push(body.isActive);    sets.push(`is_active=$${params.length}`) }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  params.push(id)
  const row = await db.query(`UPDATE lead_packages SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params)
  return NextResponse.json(row.rows[0])
}

async function deleteLeadPackage(req: NextRequest) {
  await ensureLeadPackages()
  const id = new URL(req.url).searchParams.get('id')
  await db.query('DELETE FROM lead_packages WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'leads')         return getLeads(req)
    if (action === 'lead-packages') return getLeadPackages(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'lead-packages') return createLeadPackage(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'lead-packages') return updateLeadPackage(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'leads') return patchLead(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'lead-packages') return deleteLeadPackage(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
