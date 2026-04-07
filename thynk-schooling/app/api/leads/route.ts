export const dynamic = 'force-dynamic'
/**
 * GET  /api/leads?limit=N&page=N        — school admin: list leads
 * POST /api/leads?action=purchase&id=X  — school admin: unlock a lead
 * POST /api/leads (body)                — public: create_lead | request_call | record_search
 *
 * LEAD DISCOVERY LOGIC
 * ─────────────────────
 * A lead row is visible to a school if ANY branch matches:
 *
 *   1. DIRECT  — lead.school_id = this school (parent explicitly applied / enquired)
 *
 *   2. PINCODE — parent_profiles.pincode matches school.pincode
 *
 *   3. GEO     — parent_profiles lat/lon is within school's configured radius (default 10 km)
 *
 *   4. SEARCH  — user searched for schools in this school's city or pincode
 *                (recorded in user_searches via POST action=record_search)
 *
 * All discovery leads are shown MASKED. The timeline (how many days back to look)
 * and the geo radius are controlled from Admin → Lead Pricing.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

// ─── auth ─────────────────────────────────────────────────────────────────────
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

// ─── table setup ─────────────────────────────────────────────────────────────
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

  for (const c of [
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
  ]) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

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

  // Tracks which cities/pincodes a user searched — powers SEARCH discovery branch
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      search_city VARCHAR(100),
      search_pincode VARCHAR(10),
      search_lat NUMERIC(10,7),
      search_lon NUMERIC(10,7),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

// ─── masking ──────────────────────────────────────────────────────────────────
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

// ─── admin config ─────────────────────────────────────────────────────────────
interface DiscoveryCfg {
  discoveryWindowDays: number   // days to look back for discovery leads
  radiusKm: number              // geo radius
  singleLeadPricePaise: number  // price when school has no credits
}
async function getDiscoveryCfg(): Promise<DiscoveryCfg> {
  try {
    const row = await db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'")
    if (!row.rows.length) return { discoveryWindowDays: 90, radiusKm: 10, singleLeadPricePaise: 29900 }
    const cfg = JSON.parse(row.rows[0].value)
    return {
      discoveryWindowDays: Number(cfg.discoveryWindowDays ?? 90),
      radiusKm: Number(cfg.radiusKm ?? (cfg.maskBlurMeters ? cfg.maskBlurMeters / 1000 : 10)),
      singleLeadPricePaise: Number(cfg.defaultPricePaise ?? (cfg.pricePerLead ? cfg.pricePerLead * 100 : 29900)),
    }
  } catch {
    return { discoveryWindowDays: 90, radiusKm: 10, singleLeadPricePaise: 29900 }
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTables()

    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url    = new URL(req.url)
    const limit  = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const page   = Math.max(1, Number(url.searchParams.get('page')  || 1))
    const offset = (page - 1) * limit

    const schoolRes = await db.query(
      `SELECT id, name, profile_completed, is_active, city, pincode, latitude, longitude
       FROM schools WHERE admin_user_id = $1`,
      [userId]
    )
    if (!schoolRes.rows.length) return NextResponse.json({ data: [], total: 0, page, limit })

    const {
      id: schoolId, name: schoolName, profile_completed, is_active,
      city: schoolCity, pincode: schoolPincode,
      latitude: schoolLat, longitude: schoolLon,
    } = schoolRes.rows[0]

    // Self-heal
    let isComplete = profile_completed === true
    if (!isComplete && schoolName && schoolName !== 'School') {
      await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [schoolId]).catch(() => {})
      isComplete = true
    }
    if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' }, { status: 403 })
    if (is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended. Contact support.' }, { status: 403 })

    const creditRow = await db.query('SELECT credits, total_credits, used_credits FROM lead_credits WHERE school_id=$1', [schoolId])
    const creditBalance = creditRow.rows[0] ?? { credits: 0, total_credits: 0, used_credits: 0 }

    const cfg = await getDiscoveryCfg()
    const { discoveryWindowDays, radiusKm, singleLeadPricePaise } = cfg

    // ── Discovery UNION ───────────────────────────────────────────────────────
    // Params shared across all branches:
    //   $1 = schoolId (UUID)
    //   $2 = schoolPincode (text|null)
    //   $3 = schoolLat (numeric|null)
    //   $4 = schoolLon (numeric|null)
    //   $5 = radiusKm (numeric)
    //   $6 = schoolCity (text|null)
    //   $7 = discoveryWindowDays (integer) — used as interval via string interpolation

    // We interpolate the interval as a literal integer (safe — always a number) to avoid
    // the "invalid input syntax for type interval" error with parameterised intervals.
    const win = Math.max(1, Math.floor(discoveryWindowDays))

    const unionSQL = `
      -- Branch 1: DIRECT — explicit application to this school
      SELECT l.id AS lead_id, 'direct' AS discovery_source
      FROM leads l
      WHERE l.school_id = $1
        AND l.created_at >= NOW() - INTERVAL '${win} days'

      UNION

      -- Branch 2: PINCODE — parent registered with same pincode as school
      SELECT l.id AS lead_id, 'pincode' AS discovery_source
      FROM leads l
      JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE l.parent_id IS NOT NULL
        AND l.school_id IS DISTINCT FROM $1
        AND $2 IS NOT NULL
        AND pp.pincode = $2
        AND l.created_at >= NOW() - INTERVAL '${win} days'

      UNION

      -- Branch 3: GEO — parent's saved location within radiusKm of school
      SELECT l.id AS lead_id, 'geo' AS discovery_source
      FROM leads l
      JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE l.parent_id IS NOT NULL
        AND l.school_id IS DISTINCT FROM $1
        AND $3 IS NOT NULL AND $4 IS NOT NULL
        AND pp.latitude IS NOT NULL AND pp.longitude IS NOT NULL
        AND (
          6371.0 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($3::float)) * cos(radians(pp.latitude::float)) *
              cos(radians(pp.longitude::float) - radians($4::float)) +
              sin(radians($3::float)) * sin(radians(pp.latitude::float))
            ))
          )
        ) <= $5
        AND l.created_at >= NOW() - INTERVAL '${win} days'

      UNION

      -- Branch 4: SEARCH — user searched for schools in this school's city or pincode
      SELECT l.id AS lead_id, 'search' AS discovery_source
      FROM leads l
      JOIN user_searches us ON us.user_id = l.parent_id
      WHERE l.parent_id IS NOT NULL
        AND l.school_id IS DISTINCT FROM $1
        AND l.created_at >= NOW() - INTERVAL '${win} days'
        AND us.created_at >= NOW() - INTERVAL '${win} days'
        AND (
          ($2 IS NOT NULL AND us.search_pincode = $2)
          OR ($6 IS NOT NULL AND lower(us.search_city) = lower($6))
        )
    `

    // Collapse to one row per lead_id, preferring more-direct sources
    const dedupedSQL = `
      SELECT DISTINCT ON (lead_id) lead_id, discovery_source
      FROM ( ${unionSQL} ) raw
      ORDER BY lead_id,
        CASE discovery_source
          WHEN 'direct'  THEN 1
          WHEN 'pincode' THEN 2
          WHEN 'geo'     THEN 3
          WHEN 'search'  THEN 4
          ELSE 5
        END
    `

    const baseParams = [
      schoolId,          // $1
      schoolPincode || null, // $2
      schoolLat     || null, // $3
      schoolLon     || null, // $4
      radiusKm,          // $5
      schoolCity    || null, // $6
    ]

    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT
           l.id, l.status,
           l.is_purchased              AS "isPurchased",
           l.child_name               AS "childName",
           l.class_applying_for       AS "classApplyingFor",
           l.city, l.created_at       AS "createdAt",
           l.source, l.message,
           l.how_did_you_hear         AS "howDidYouHear",
           d.discovery_source         AS "discoverySource",
           COALESCE(u.full_name, l.parent_name) AS "fullName",
           COALESCE(u.phone, l.phone)            AS "fullPhone",
           COALESCE(u.email, l.email)            AS "fullEmail"
         FROM ( ${dedupedSQL} ) d
         JOIN leads l ON l.id = d.lead_id
         LEFT JOIN users u ON u.id = l.parent_id
         ORDER BY l.created_at DESC
         LIMIT $7 OFFSET $8`,
        [...baseParams, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM ( ${dedupedSQL} ) d`,
        baseParams
      ),
    ])

    const data = dataRes.rows.map(row => ({
      ...row,
      maskedName:  maskName(row.fullName || 'Parent'),
      maskedPhone: maskPhone(row.fullPhone || ''),
      fullName:    row.isPurchased ? row.fullName  : undefined,
      fullPhone:   row.isPurchased ? row.fullPhone : undefined,
      fullEmail:   undefined,
      singleLeadPricePaise,
    }))

    return NextResponse.json({
      data,
      total: Number(countRes.rows[0]?.count ?? 0),
      page,
      limit,
      credits: creditBalance,
      singleLeadPricePaise,
      discoveryWindowDays,
    })
  } catch (e: any) {
    console.error('[leads GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await ensureTables()

    const url         = new URL(req.url)
    const queryAction = url.searchParams.get('action')
    const queryLeadId = url.searchParams.get('id')

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const action = queryAction || body.action

    // ── Public: create_lead / request_call ────────────────────────────────────
    if (action === 'create_lead' || action === 'request_call') {
      const { schoolId, parentName, phone, childName, classApplyingFor, source } = body
      if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
      if (action === 'request_call') {
        if (!parentName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!phone?.trim())       return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
        if ((phone as string).replace(/\D/g, '').length < 10)
          return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }
      const userId = getUserId(req)
      const schoolRow = await db.query('SELECT id FROM schools WHERE id=$1', [schoolId])
      if (!schoolRow.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
      if (phone) {
        const dup = await db.query(
          `SELECT id FROM leads WHERE school_id=$1 AND phone=$2 AND source=$3 AND created_at > NOW() - INTERVAL '24 hours'`,
          [schoolId, phone.replace(/\D/g, '').slice(-10), source || action]
        ).catch(() => ({ rows: [] }))
        if (dup.rows.length) return NextResponse.json({ success: true, duplicate: true })
      }
      await db.query(
        `INSERT INTO leads (school_id, parent_id, parent_name, phone, child_name, class_applying_for, source, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new',NOW(),NOW())`,
        [
          schoolId, userId ?? null, parentName?.trim() || null,
          phone ? phone.replace(/\D/g, '').slice(-10) : null,
          childName?.trim() || null, classApplyingFor?.trim() || null, source || action,
        ]
      )
      return NextResponse.json({ success: true })
    }

    // ── Record a school search (called from school listing page) ─────────────
    // This populates user_searches and powers Branch 4 (SEARCH discovery).
    if (action === 'record_search') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ success: true }) // guests silently ignored
      const { city, pincode, lat, lon } = body
      await db.query(
        `INSERT INTO user_searches (user_id, search_city, search_pincode, search_lat, search_lon)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, city || null, pincode || null, lat || null, lon || null]
      ).catch(() => {})
      return NextResponse.json({ success: true })
    }

    // ── School admin: purchase / unlock a lead ────────────────────────────────
    if (action === 'purchase') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const leadId = queryLeadId || body.id
      if (!leadId) return NextResponse.json({ error: 'Lead id required' }, { status: 400 })

      const schoolRes = await db.query(
        'SELECT id, name, profile_completed, is_active FROM schools WHERE admin_user_id=$1',
        [userId]
      )
      if (!schoolRes.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })

      const s = schoolRes.rows[0]
      let isComplete = s.profile_completed === true
      if (!isComplete && s.name && s.name !== 'School') {
        await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [s.id]).catch(() => {})
        isComplete = true
      }
      if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 })
      if (s.is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })

      const schoolId = s.id

      // Lead can be from any source (direct or geo discovery)
      const lead = await db.query('SELECT id, is_purchased FROM leads WHERE id=$1', [leadId])
      if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      if (lead.rows[0].is_purchased) return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })

      const credRow = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
      const available = credRow.rows[0]?.credits ?? 0

      if (available < 1) {
        const cfg = await getDiscoveryCfg()
        return NextResponse.json({
          error: 'NO_CREDITS',
          message: 'You have no lead credits.',
          singleLeadPricePaise: cfg.singleLeadPricePaise,
        }, { status: 402 })
      }

      await db.query('BEGIN')
      try {
        await db.query(
          `UPDATE lead_credits
           SET credits = credits - 1, used_credits = COALESCE(used_credits,0)+1, updated_at=NOW()
           WHERE school_id=$1`,
          [schoolId]
        )
        // Assign geo/discovery leads to this school on purchase
        await db.query(
          `UPDATE leads SET is_purchased=true, school_id=$2, updated_at=NOW() WHERE id=$1`,
          [leadId, schoolId]
        )
        await db.query('COMMIT')
      } catch (err) {
        await db.query('ROLLBACK')
        throw err
      }

      const unlocked = await db.query(
        `SELECT l.id, l.source, l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
                COALESCE(u.full_name, l.parent_name) AS "fullName",
                COALESCE(u.phone, l.phone)            AS "fullPhone"
         FROM leads l LEFT JOIN users u ON u.id=l.parent_id WHERE l.id=$1`,
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
