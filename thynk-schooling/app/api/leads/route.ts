export const dynamic = 'force-dynamic'
/**
 * GET  /api/leads?limit=N               — school admin: list leads for their school
 * POST /api/leads (body action=purchase) — school admin: purchase/unlock a lead
 * POST /api/leads (body action=create_lead|request_call) — public: parent expresses interest
 *   Actions from school profile page (no auth required):
 *   - create_lead:   parent saved or compared the school
 *   - request_call:  parent submitted call back request form
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID,
      school_id UUID,
      status VARCHAR(50) DEFAULT 'new',
      is_purchased BOOLEAN DEFAULT false,
      child_name VARCHAR(200),
      class_applying_for VARCHAR(50),
      city VARCHAR(100),
      parent_name VARCHAR(200),
      phone VARCHAR(30),
      email VARCHAR(200),
      message TEXT,
      source VARCHAR(100),
      how_did_you_hear VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  // Add missing columns to existing leads table
  const cols = [
    'ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS child_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS class_applying_for VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS parent_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS phone VARCHAR(30)',
    'ADD COLUMN IF NOT EXISTS email VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS message TEXT',
    'ADD COLUMN IF NOT EXISTS source VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS how_did_you_hear VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
  ]
  for (const c of cols) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_credits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID UNIQUE,
      credits INTEGER DEFAULT 0,
      total_credits INTEGER DEFAULT 0,
      used_credits INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`).catch(() => {})
}

function maskName(name: string): string {
  if (!name) return '****'
  const parts = name.trim().split(' ')
  return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ')
}

function maskPhone(phone: string): string {
  if (!phone) return '***** *****'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return '*'.repeat(digits.length)
  // Show first 2 and last 2 digits, mask middle — 5-digit masking for display
  return digits.slice(0, 2) + '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-2)
}

// ─────────────────────────────────────────────────────────────
// GET — school admin fetches their leads
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const offset = (page - 1) * limit

    const school = await db.query('SELECT id, profile_completed, is_active FROM schools WHERE admin_user_id=$1', [userId])
    if (!school.rows.length) return NextResponse.json({ data: [], total: 0, page, limit })
    if (!school.rows[0].profile_completed) {
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' }, { status: 403 })
    }
    if (school.rows[0].is_active === false) {
      return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended. Contact support.' }, { status: 403 })
    }
    const schoolId = school.rows[0].id

    // Also fetch credit balance to include in response
    const creditRow = await db.query('SELECT credits, total_credits, used_credits FROM lead_credits WHERE school_id=$1', [schoolId])
    const creditBalance = creditRow.rows[0] ?? { credits: 0, total_credits: 0, used_credits: 0 }

    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT
           l.id, l.status, l.is_purchased AS "isPurchased",
           l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
           l.city, l.created_at AS "createdAt", l.source,
           l.message, l.how_did_you_hear AS "howDidYouHear",
           COALESCE(u.full_name, l.parent_name) AS "fullName",
           COALESCE(u.phone,    l.phone)        AS "fullPhone",
           COALESCE(u.email,    l.email)        AS "fullEmail"
         FROM leads l
         LEFT JOIN users u ON u.id = l.parent_id
         WHERE l.school_id = $1
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [schoolId, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [schoolId]),
    ])

    const data = dataRes.rows.map(row => ({
      ...row,
      maskedName:  maskName(row.fullName || 'Parent'),
      // Show only first 2 chars + masked middle + last 2, no email shown
      maskedPhone: maskPhone(row.fullPhone || ''),
      // Only expose real contact details if lead is purchased
      fullName:  row.isPurchased ? row.fullName  : undefined,
      fullPhone: row.isPurchased ? row.fullPhone : undefined,
      fullEmail: undefined, // Email is never shown (even after purchase, only phone+name)
    }))

    return NextResponse.json({
      data,
      total: Number(countRes.rows[0].count),
      page,
      limit,
      credits: creditBalance,
    })
  } catch (e: any) {
    console.error('[leads GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// POST — 3 actions:
//   1. action=create_lead    — public: parent saved/compared (no auth)
//   2. action=request_call   — public: parent request call back form (no auth)
//   3. action=purchase (query param) — school admin purchases a lead
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await ensureTables()

    const url = new URL(req.url)
    // Support both query param and body action
    const queryAction = url.searchParams.get('action')
    const queryLeadId = url.searchParams.get('id')

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const action = queryAction || body.action

    // ── Public actions: create_lead, request_call ──────────────
    if (action === 'create_lead' || action === 'request_call') {
      const { schoolId, parentName, phone, childName, classApplyingFor, source } = body

      if (!schoolId) {
        return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
      }

      // For request_call, name and phone are required
      if (action === 'request_call') {
        if (!parentName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!phone?.trim()) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
        // Basic phone validation
        const digits = (phone as string).replace(/\D/g, '')
        if (digits.length < 10) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }

      // Try to get parent user id if logged in
      const userId = getUserId(req)

      // Check if school exists
      const schoolRow = await db.query('SELECT id FROM schools WHERE id=$1', [schoolId])
      if (!schoolRow.rows.length) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 })
      }

      // Prevent duplicate leads from same user/phone for same source on same day
      if (phone) {
        const duplicate = await db.query(
          `SELECT id FROM leads WHERE school_id=$1 AND phone=$2 AND source=$3 AND created_at > NOW() - INTERVAL '24 hours'`,
          [schoolId, phone.replace(/\D/g, '').slice(-10), source || action]
        ).catch(() => ({ rows: [] }))
        if (duplicate.rows.length) {
          return NextResponse.json({ success: true, duplicate: true })
        }
      }

      await db.query(
        `INSERT INTO leads (school_id, parent_id, parent_name, phone, child_name, class_applying_for, source, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW(), NOW())`,
        [
          schoolId,
          userId ?? null,
          parentName?.trim() || null,
          phone ? phone.replace(/\D/g, '').slice(-10) : null,
          childName?.trim() || null,
          classApplyingFor?.trim() || null,
          source || action,
        ]
      )

      return NextResponse.json({ success: true })
    }

    // ── School admin: purchase lead ────────────────────────────
    if (action === 'purchase') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const leadId = queryLeadId || body.id
      if (!leadId) return NextResponse.json({ error: 'Lead id required' }, { status: 400 })

      const school = await db.query('SELECT id, profile_completed, is_active FROM schools WHERE admin_user_id=$1', [userId])
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })
      if (!school.rows[0].profile_completed) {
        return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to purchase leads.' }, { status: 403 })
      }
      if (school.rows[0].is_active === false) {
        return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Account suspended.' }, { status: 403 })
      }
      const schoolId = school.rows[0].id

      const lead = await db.query('SELECT id, is_purchased FROM leads WHERE id=$1 AND school_id=$2', [leadId, schoolId])
      if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      if (lead.rows[0].is_purchased) return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })

      const credRow = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
      const available = credRow.rows[0]?.credits ?? 0
      if (available < 1) {
        return NextResponse.json({
          error: 'Insufficient credits. Please upgrade your subscription plan to get more lead credits.',
        }, { status: 402 })
      }

      // Atomic deduct + mark purchased
      await db.query('BEGIN')
      try {
        await db.query(
          `UPDATE lead_credits SET credits = credits - 1, used_credits = COALESCE(used_credits,0)+1, updated_at=NOW() WHERE school_id=$1`,
          [schoolId]
        )
        await db.query(`UPDATE leads SET is_purchased=true, updated_at=NOW() WHERE id=$1`, [leadId])
        await db.query('COMMIT')
      } catch (err) {
        await db.query('ROLLBACK')
        throw err
      }

      // Return the newly unlocked lead details (name + phone, no email)
      const unlocked = await db.query(
        `SELECT l.id, l.source, l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
                COALESCE(u.full_name, l.parent_name) AS "fullName",
                COALESCE(u.phone, l.phone) AS "fullPhone"
         FROM leads l LEFT JOIN users u ON u.id=l.parent_id
         WHERE l.id=$1`,
        [leadId]
      )

      return NextResponse.json({ success: true, lead: unlocked.rows[0] ?? null })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[leads POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
