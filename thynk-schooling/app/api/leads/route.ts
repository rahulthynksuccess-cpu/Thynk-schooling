export const dynamic = 'force-dynamic'
/**
 * GET  /api/leads?limit=N               — school admin: list leads for their school
 *                                          Now includes nearby leads (same pincode OR within 10 km)
 *                                          even if the parent never explicitly applied to this school.
 * POST /api/leads?action=purchase&id=X  — school admin: purchase/unlock a lead (deducts 1 credit
 *                                          OR charges single-lead price if no credits)
 * POST /api/leads (body: action=create_lead|request_call) — public: parent expresses interest
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
  return digits.slice(0, 2) + '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-2)
}

// ─────────────────────────────────────────────────────────────
// GET — school admin fetches their leads (including geo-matched leads)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const limit  = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const page   = Math.max(1, Number(url.searchParams.get('page') || 1))
    const offset = (page - 1) * limit

    const school = await db.query(
      'SELECT id, name, profile_completed, is_active, city, pincode, latitude, longitude FROM schools WHERE admin_user_id=$1',
      [userId]
    )
    if (!school.rows.length) return NextResponse.json({ data: [], total: 0, page, limit })

    const { id: schoolId, name: schoolName, profile_completed, is_active, city, pincode, latitude, longitude } = school.rows[0]

    // Self-heal profile_completed
    let isComplete = profile_completed === true
    if (!isComplete && schoolName && schoolName !== 'School') {
      await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [schoolId]).catch(() => {})
      isComplete = true
    }
    if (!isComplete) {
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' }, { status: 403 })
    }
    if (is_active === false) {
      return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended. Contact support.' }, { status: 403 })
    }

    const creditRow = await db.query('SELECT credits, total_credits, used_credits FROM lead_credits WHERE school_id=$1', [schoolId])
    const creditBalance = creditRow.rows[0] ?? { credits: 0, total_credits: 0, used_credits: 0 }

    // Fetch single-lead price from admin settings
    const pricingRow = await db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'").catch(() => ({ rows: [] }))
    let singleLeadPricePaise = 29900 // default ₹299
    if (pricingRow.rows.length) {
      try {
        const cfg = JSON.parse(pricingRow.rows[0].value)
        singleLeadPricePaise = cfg.defaultPricePaise ?? cfg.pricePerLead * 100 ?? 29900
      } catch {}
    }

    // ── Geo-aware lead query ──────────────────────────────────────────────────
    // Leads are shown if ANY of these match:
    //   1. lead.school_id = this school (explicit application/enquiry)
    //   2. lead's parent pincode matches school pincode (same pincode area)
    //   3. parent lat/lon is within ~10 km of school (haversine approximation)
    //
    // For geo leads (conditions 2 & 3), we join parent_profiles for location.
    // A lead from the same pincode/radius is shown as a "discovery" lead — masked,
    // purchasable — so the school can reach out even if the parent didn't apply directly.
    // We avoid showing the same lead twice (DISTINCT ON l.id).

    let geoClause = `l.school_id = $1`
    const params: any[] = [schoolId]

    if (pincode) {
      // Same pincode: match leads where the parent's profile pincode matches the school
      params.push(pincode)
      geoClause += `
        OR (
          l.school_id IS DISTINCT FROM $1
          AND EXISTS (
            SELECT 1 FROM parent_profiles pp
            WHERE pp.user_id = l.parent_id AND pp.pincode = $${params.length}
          )
        )`
    }

    if (latitude && longitude) {
      // 10 km radius using haversine (pure SQL, no PostGIS required)
      params.push(latitude, longitude)
      const latIdx = params.length - 1
      const lonIdx = params.length
      geoClause += `
        OR (
          l.school_id IS DISTINCT FROM $1
          AND EXISTS (
            SELECT 1 FROM parent_profiles pp
            WHERE pp.user_id = l.parent_id
              AND pp.pincode IS DISTINCT FROM $${params.length - (pincode ? 2 : 0)}
              AND (
                6371 * acos(
                  cos(radians($${latIdx}::float)) *
                  cos(radians(pp.latitude::float)) *
                  cos(radians(pp.longitude::float) - radians($${lonIdx}::float)) +
                  sin(radians($${latIdx}::float)) *
                  sin(radians(pp.latitude::float))
                )
              ) <= 10
          )
        )`
    }

    // If neither pincode nor lat/lon are set, just fall back to school_id only
    const dataQuery = `
      SELECT DISTINCT ON (l.id)
        l.id, l.status,
        l.is_purchased AS "isPurchased",
        l.school_id = $1 AS "isDirectLead",
        l.child_name AS "childName",
        l.class_applying_for AS "classApplyingFor",
        l.city, l.created_at AS "createdAt", l.source,
        l.message, l.how_did_you_hear AS "howDidYouHear",
        COALESCE(u.full_name, l.parent_name) AS "fullName",
        COALESCE(u.phone, l.phone)            AS "fullPhone",
        COALESCE(u.email, l.email)            AS "fullEmail"
      FROM leads l
      LEFT JOIN users u ON u.id = l.parent_id
      WHERE (${geoClause})
      ORDER BY l.id, l.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

    params.push(limit, offset)

    // Count query (same WHERE, no pagination)
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) FROM leads l
      LEFT JOIN users u ON u.id = l.parent_id
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE (${geoClause.replace(/\$${params\.length \+ \d+}/g, '')})`

    const countParams = params.slice(0, params.length - 2)

    const [dataRes, countRes] = await Promise.all([
      db.query(dataQuery, params),
      db.query(
        `SELECT COUNT(DISTINCT l.id) FROM leads l
         LEFT JOIN users u ON u.id = l.parent_id
         LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
         WHERE (${geoClause})`,
        countParams
      ).catch(() => ({ rows: [{ count: '0' }] })),
    ])

    const data = dataRes.rows.map(row => ({
      ...row,
      maskedName:  maskName(row.fullName || 'Parent'),
      maskedPhone: maskPhone(row.fullPhone || ''),
      fullName:    row.isPurchased ? row.fullName  : undefined,
      fullPhone:   row.isPurchased ? row.fullPhone : undefined,
      fullEmail:   undefined,
      singleLeadPricePaise, // so the UI can show the buy price
    }))

    return NextResponse.json({
      data,
      total: Number(countRes.rows[0]?.count ?? 0),
      page,
      limit,
      credits: creditBalance,
      singleLeadPricePaise,
    })
  } catch (e: any) {
    console.error('[leads GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await ensureTables()

    const url = new URL(req.url)
    const queryAction = url.searchParams.get('action')
    const queryLeadId = url.searchParams.get('id')

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const action = queryAction || body.action

    // ── Public: create_lead / request_call ────────────────────
    if (action === 'create_lead' || action === 'request_call') {
      const { schoolId, parentName, phone, childName, classApplyingFor, source } = body

      if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
      if (action === 'request_call') {
        if (!parentName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!phone?.trim())       return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
        const digits = (phone as string).replace(/\D/g, '')
        if (digits.length < 10)   return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }

      const userId = getUserId(req)
      const schoolRow = await db.query('SELECT id FROM schools WHERE id=$1', [schoolId])
      if (!schoolRow.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })

      if (phone) {
        const duplicate = await db.query(
          `SELECT id FROM leads WHERE school_id=$1 AND phone=$2 AND source=$3 AND created_at > NOW() - INTERVAL '24 hours'`,
          [schoolId, phone.replace(/\D/g, '').slice(-10), source || action]
        ).catch(() => ({ rows: [] }))
        if (duplicate.rows.length) return NextResponse.json({ success: true, duplicate: true })
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

      const school = await db.query(
        'SELECT id, name, profile_completed, is_active FROM schools WHERE admin_user_id=$1',
        [userId]
      )
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })

      let isComplete = school.rows[0].profile_completed === true
      if (!isComplete && school.rows[0].name && school.rows[0].name !== 'School') {
        await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [school.rows[0].id]).catch(() => {})
        isComplete = true
      }
      if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 })
      if (school.rows[0].is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })

      const schoolId = school.rows[0].id

      // Lead can belong to this school OR be a geo-matched lead not yet claimed
      const lead = await db.query(
        'SELECT id, is_purchased, school_id FROM leads WHERE id=$1',
        [leadId]
      )
      if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      if (lead.rows[0].is_purchased) return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })

      const credRow = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
      const available = credRow.rows[0]?.credits ?? 0

      if (available >= 1) {
        // ── Use a credit ────────────────────────────────────────
        await db.query('BEGIN')
        try {
          await db.query(
            `UPDATE lead_credits SET credits=credits-1, used_credits=COALESCE(used_credits,0)+1, updated_at=NOW() WHERE school_id=$1`,
            [schoolId]
          )
          // If geo lead: assign it to this school so it shows up in their list properly
          await db.query(
            `UPDATE leads SET is_purchased=true, school_id=$2, updated_at=NOW() WHERE id=$1`,
            [leadId, schoolId]
          )
          await db.query('COMMIT')
        } catch (err) {
          await db.query('ROLLBACK')
          throw err
        }
      } else {
        // ── No credits: charge single-lead price via direct DB credit (payment flow) ──
        // Frontend handles Razorpay; this path is for when they've already paid (verify step).
        // For now return a specific error so the frontend can trigger payment.
        return NextResponse.json({
          error: 'NO_CREDITS',
          message: 'You have no lead credits. Buy a package or purchase this lead individually.',
        }, { status: 402 })
      }

      const unlocked = await db.query(
        `SELECT l.id, l.source, l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
                COALESCE(u.full_name, l.parent_name) AS "fullName",
                COALESCE(u.phone, l.phone)            AS "fullPhone"
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
