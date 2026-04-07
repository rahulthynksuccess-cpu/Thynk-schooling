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
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}


function maskName(name: string): string {
  if (!name) return '****'
  const parts = name.trim().split(' ')
  return parts.map((p: string, i: number) => i === 0 ? p : p[0] + '***').join(' ')
}
function maskPhone(phone: string): string {
  if (!phone) return '***** *****'
  const d = phone.replace(/\D/g, '')
  if (d.length < 6) return '*'.repeat(d.length)
  return d.slice(0,2) + '*'.repeat(Math.max(0,d.length-4)) + d.slice(-2)
}
const VALID_STATUSES = ['new','contacted','interested','not_interested','admitted','lost']

// ─── CANONICAL leads table definition — all columns used across ALL routes ────
async function ensureLeads() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id           UUID,
      school_id           UUID,
      status              VARCHAR(50)  DEFAULT 'new',
      is_purchased        BOOLEAN      DEFAULT false,
      child_name          VARCHAR(200),
      class_applying_for  VARCHAR(50),
      city                VARCHAR(100),
      parent_name         VARCHAR(200),
      phone               VARCHAR(30),
      email               VARCHAR(200),
      message             TEXT,
      source              VARCHAR(100),
      how_did_you_hear    VARCHAR(200),
      created_at          TIMESTAMPTZ  DEFAULT NOW(),
      updated_at          TIMESTAMPTZ  DEFAULT NOW()
    )
  `).catch(() => {})

  // Ensure every column exists on already-created tables (safe on re-run)
  const cols = [
    "ADD COLUMN IF NOT EXISTS status             VARCHAR(50)  DEFAULT 'new'",
    'ADD COLUMN IF NOT EXISTS is_purchased        BOOLEAN      DEFAULT false',
    'ADD COLUMN IF NOT EXISTS child_name          VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS class_applying_for  VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS city                VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS parent_name         VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS phone               VARCHAR(30)',
    'ADD COLUMN IF NOT EXISTS email               VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS message             TEXT',
    'ADD COLUMN IF NOT EXISTS source              VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS how_did_you_hear    VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ  DEFAULT NOW()',
  ]
  for (const c of cols) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})
}

// ─── GET leads ────────────────────────────────────────────────────────────────
async function getLeads(req: NextRequest) {
  await ensureLeads()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = Number(new URL(req.url).searchParams.get('limit') || 10)
  let school = await db.query('SELECT id, is_active FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) {
    const uRow = await db.query('SELECT email FROM users WHERE id=$1', [userId]).catch(() => ({ rows: [] as any[] }))
    if (uRow.rows[0]?.email) {
      school = await db.query('SELECT id, is_active FROM schools WHERE email=$1', [uRow.rows[0].email])
      if (school.rows.length) await db.query('UPDATE schools SET admin_user_id=$1 WHERE id=$2', [userId, school.rows[0].id]).catch(() => {})
    }
  }
  if (!school.rows.length) return NextResponse.json({ data: [], total: 0, credits: { credits:0, availableCredits:0, usedCredits:0 } })
  if (school.rows[0].is_active === false) {
    return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Account suspended.' }, { status: 403 })
  }
  const schoolId = school.rows[0].id
  const [rows, countRes, credRow] = await Promise.all([
    db.query(
      `SELECT l.id, l.status, l.is_purchased AS "isPurchased",
              l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
              l.city, l.created_at AS "createdAt", l.source, l.phone AS "maskedPhone",
              l.how_did_you_hear AS "howDidYouHear",
              COALESCE(u.full_name, l.parent_name) AS "fullName",
              COALESCE(u.phone,    l.phone)        AS "fullPhone",
              COALESCE(u.email,    l.email)        AS "fullEmail"
       FROM leads l
       LEFT JOIN users u ON u.id = l.parent_id
       WHERE l.school_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2`,
      [schoolId, limit]
    ),
    db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [schoolId]),
    db.query('SELECT credits, COALESCE(used_credits,0) as used_credits FROM lead_credits WHERE school_id=$1', [schoolId]),
  ])
  const data = rows.rows.map((row: any) => ({
    ...row,
    maskedName:  row.isPurchased ? row.fullName  : maskName(row.fullName || 'Parent'),
    maskedPhone: row.isPurchased ? row.fullPhone : maskPhone(row.fullPhone || row.maskedPhone || ''),
    fullName:    row.isPurchased ? row.fullName  : undefined,
    fullPhone:   row.isPurchased ? row.fullPhone : undefined,
  }))
  const cr = credRow.rows[0] || { credits: 0, used_credits: 0 }
  return NextResponse.json({
    data,
    total:   Number(countRes.rows[0].count),
    credits: { credits: cr.credits, availableCredits: cr.credits, usedCredits: cr.used_credits },
  })
}

// ─── PATCH lead status ────────────────────────────────────────────────────────
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
  const result = await db.query(
    `UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2 AND school_id=$3 RETURNING id, status`,
    [status, id, school.rows[0].id]
  )
  if (!result.rows.length) return NextResponse.json({ error: 'Lead not found or does not belong to your school' }, { status: 404 })
  return NextResponse.json({ success: true, lead: result.rows[0] })
}
async function getApplications(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const school = await db.query(
    'SELECT id FROM schools WHERE admin_user_id=$1',
    [userId]
  )

  if (!school.rows.length) {
    return NextResponse.json({ data: [], total: 0 })
  }

  const schoolId = school.rows[0].id

  const result = await db.query(
    `SELECT * FROM applications WHERE school_id=$1 ORDER BY created_at DESC`,
    [schoolId]
  )

  return NextResponse.json({
    data: result.rows,
    total: result.rows.length,
  })
}
// ─── router ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'leads') return await getLeads(req)
if (action === 'applications') return await getApplications(req)
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

// ─── POST: purchase lead ──────────────────────────────────────────────────────
async function purchaseLead(req: NextRequest) {
  await ensureLeads()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const leadId = url.searchParams.get('id')
  if (!leadId) return NextResponse.json({ error: 'Lead id required' }, { status: 400 })

  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })
  const schoolId = school.rows[0].id

  const lead = await db.query('SELECT id, is_purchased FROM leads WHERE id=$1 AND school_id=$2', [leadId, schoolId])
  if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.rows[0].is_purchased) return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })

  const credRow = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
  const available = credRow.rows[0]?.credits ?? 0
  if (available < 1) return NextResponse.json({ error: 'Insufficient credits. Buy more from Subscription Plan.' }, { status: 402 })

  await db.query('BEGIN')
  try {
    await db.query(`UPDATE lead_credits SET credits=credits-1, used_credits=COALESCE(used_credits,0)+1, updated_at=NOW() WHERE school_id=$1`, [schoolId])
    await db.query(`UPDATE leads SET is_purchased=true, updated_at=NOW() WHERE id=$1`, [leadId])
    await db.query('COMMIT')
  } catch(e) { await db.query('ROLLBACK'); throw e }

  const unlocked = await db.query(
    `SELECT l.id, l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
            COALESCE(u.full_name, l.parent_name) AS "fullName",
            COALESCE(u.phone, l.phone) AS "fullPhone"
     FROM leads l LEFT JOIN users u ON u.id=l.parent_id WHERE l.id=$1`,
    [leadId]
  )
  return NextResponse.json({ success: true, lead: unlocked.rows[0] })
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'purchase') return await purchaseLead(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
