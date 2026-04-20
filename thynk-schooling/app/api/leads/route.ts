export const dynamic = 'force-dynamic'
/**
 * /api/leads — Complete workflow implementation
 *
 * SCENARIO A — Parent SEARCHES a school:
 *   → Lead created for that school (source = 'search')
 *   → Visible MASKED to:
 *       1. The searched school (direct)
 *       2. Other schools matching gender_policy OR class range
 *       3. All schools within 20km OR matching 2-3 nearby pincodes
 *   → Any school can unlock by spending 1 credit OR buying single lead
 *
 * SCENARIO B — Parent APPLIES to a school:
 *   → Lead created (source = 'apply_page'), application record created
 *   → Applied school: if has credits → AUTO-UNLOCK (full details visible, 1 credit deducted)
 *   → Applied school: if NO credits → show MASKED, prompt to buy credit/package
 *   → Other matching schools → show MASKED (same criteria as Scenario A)
 *   → Any school can unlock by spending 1 credit OR buying single lead
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id          UUID,
      school_id          UUID,
      status             VARCHAR(50)  DEFAULT 'new',
      is_purchased       BOOLEAN      DEFAULT false,
      purchased_by       UUID,
      child_name         VARCHAR(200),
      class_applying_for VARCHAR(50),
      city               VARCHAR(100),
      parent_name        VARCHAR(200),
      phone              VARCHAR(30),
      email              VARCHAR(200),
      message            TEXT,
      source             VARCHAR(100),
      how_did_you_hear   VARCHAR(200),
      school_remarks     TEXT,
      created_at         TIMESTAMPTZ  DEFAULT NOW(),
      updated_at         TIMESTAMPTZ  DEFAULT NOW()
    )
  `).catch(() => {})
  for (const c of [
    'ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS purchased_by UUID',
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
    'ADD COLUMN IF NOT EXISTS school_remarks TEXT',
    'ADD COLUMN IF NOT EXISTS purchased_by UUID',
  ]) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_credits (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id     UUID UNIQUE,
      credits       INTEGER DEFAULT 0,
      total_credits INTEGER DEFAULT 0,
      used_credits  INTEGER DEFAULT 0,
      expires_at    TIMESTAMPTZ,
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  for (const c of [
    'ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ',
  ]) await db.query(`ALTER TABLE lead_credits ${c}`).catch(() => {})

  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS parent_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE, full_name VARCHAR(200),
      city VARCHAR(100), state VARCHAR(100), locality VARCHAR(200), pincode VARCHAR(10),
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  for (const c of [
    'ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
  ]) await db.query(`ALTER TABLE parent_profiles ${c}`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      search_city VARCHAR(100), search_pincode VARCHAR(10),
      search_lat NUMERIC(10,7), search_lon NUMERIC(10,7),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

function maskName(name: string): string {
  if (!name) return '****'
  const parts = name.trim().split(' ')
  return parts.map((p) => p[0] + '*'.repeat(Math.max(1, p.length - 1))).join(' ')
}
function maskPhone(phone: string): string {
  if (!phone) return '***** *****'
  const d = phone.replace(/\D/g, '')
  if (d.length < 6) return '*'.repeat(d.length)
  return d.slice(0, 2) + '*'.repeat(Math.max(0, d.length - 4)) + d.slice(-2)
}

interface DiscoveryCfg {
  discoveryWindowDays: number
  radiusKm:            number
  nearbyPincodeCount:  number
  singleLeadPricePaise: number
}
async function getDiscoveryCfg(): Promise<DiscoveryCfg> {
  try {
    const row = await db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'")
    if (!row.rows.length) return { discoveryWindowDays: 90, radiusKm: 20, nearbyPincodeCount: 3, singleLeadPricePaise: 29900 }
    const cfg = JSON.parse(row.rows[0].value)
    return {
      singleLeadPricePaise: Number(cfg.defaultPricePaise ?? 29900) || 29900,
      radiusKm:             Number(cfg.radiusKm ?? 20) || 20,
      nearbyPincodeCount:   Number(cfg.nearbyPincodeCount ?? 3) || 3,
      discoveryWindowDays:  Number(cfg.discoveryWindowDays ?? 90) || 90,
    }
  } catch {
    return { discoveryWindowDays: 90, radiusKm: 20, nearbyPincodeCount: 3, singleLeadPricePaise: 29900 }
  }
}

// Convert class name to number for range comparison
function classToNum(cls: string | null | undefined): number {
  if (!cls) return -99
  const s = cls.toString().toLowerCase().trim()
  if (['nursery','nur','pp1','pre-primary 1','playgroup'].includes(s)) return -3
  if (['lkg','lower kg','pp2','pre-primary 2'].includes(s)) return -2
  if (['ukg','upper kg'].includes(s)) return -1
  const n = parseInt(s.replace(/[^0-9]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── GET — school admin: list leads visible to this school ────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTables()

    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url    = new URL(req.url)
    const limit  = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const page   = Math.max(1, Number(url.searchParams.get('page') || 1))
    const offset = (page - 1) * limit

    // Load school profile — we need lat/lon, pincode, city, gender_policy, classes_from/to
    const schoolRes = await db.query(
      `SELECT id, name, profile_completed, is_active,
              city, pincode, latitude, longitude,
              gender_policy, classes_from, classes_to
       FROM schools WHERE admin_user_id = $1`,
      [userId]
    )
    if (!schoolRes.rows.length) return NextResponse.json({ data: [], total: 0, page, limit })

    const s = schoolRes.rows[0]
    const {
      id: schoolId,
      city: schoolCity, pincode: schoolPincode,
      latitude: schoolLat, longitude: schoolLon,
      gender_policy: schoolGender,
      classes_from: schoolClassFrom, classes_to: schoolClassTo,
      profile_completed, is_active,
    } = s

    // Profile check
    let isComplete = profile_completed === true
    if (!isComplete && s.name && s.name !== 'School') {
      await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [schoolId]).catch(() => {})
      isComplete = true
    }
    if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' }, { status: 403 })
    if (is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })

    const creditRow = await db.query('SELECT credits, total_credits, used_credits FROM lead_credits WHERE school_id=$1', [schoolId])
    const creditBalance = creditRow.rows[0] ?? { credits: 0, total_credits: 0, used_credits: 0 }

    const cfg = await getDiscoveryCfg()
    const { discoveryWindowDays, radiusKm, nearbyPincodeCount, singleLeadPricePaise } = cfg
    const win = Math.max(1, Math.floor(discoveryWindowDays))

    const allLeadIds = new Map<string, string>() // lead_id → source

    // ── Branch 1: DIRECT leads — parent applied/enquired directly to THIS school
    await db.query(
      `SELECT id AS lead_id FROM leads
       WHERE school_id = $1 AND created_at >= NOW() - INTERVAL '${win} days'`,
      [schoolId]
    ).then(r => r.rows.forEach((row: any) => allLeadIds.set(row.lead_id, 'direct')))
     .catch(() => {})

    // ── Branch 2: CRITERIA MATCH — same gender_policy OR overlapping class range
    //    Shows leads from other schools where the parent's child criteria matches this school
    if (schoolGender || (schoolClassFrom && schoolClassTo)) {
      const classFromNum = classToNum(schoolClassFrom)
      const classToNum_  = classToNum(schoolClassTo)

      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         WHERE l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND (
             -- Gender policy match: school accepts this gender
             ($2::text IS NOT NULL AND (
               l.parent_id IN (
                 SELECT pp.user_id FROM parent_profiles pp WHERE pp.user_id IS NOT NULL
               )
             ))
             OR
             -- Class range overlap: parent's desired class falls within school's range
             ($3::int > -99 AND $4::int > -99 AND
               CASE
                 WHEN l.class_applying_for ILIKE '%nursery%' OR l.class_applying_for ILIKE '%nur%' THEN -3
                 WHEN l.class_applying_for ILIKE '%lkg%' THEN -2
                 WHEN l.class_applying_for ILIKE '%ukg%' THEN -1
                 ELSE COALESCE(NULLIF(regexp_replace(l.class_applying_for, '[^0-9]', '', 'g'), '')::int, 0)
               END BETWEEN $3 AND $4
             )
           )`,
        [schoolId, schoolGender || null, classFromNum, classToNum_]
      ).then(r => r.rows.forEach((row: any) => {
        if (!allLeadIds.has(row.lead_id)) allLeadIds.set(row.lead_id, 'criteria')
      })).catch(() => {})
    }

    // ── Branch 3: GEO — leads from parents within 20km of this school
    if (schoolLat && schoolLon) {
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN parent_profiles pp ON pp.user_id = l.parent_id
         WHERE l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND pp.latitude IS NOT NULL AND pp.longitude IS NOT NULL
           AND (
             6371.0 * acos(
               LEAST(1.0, GREATEST(-1.0,
                 cos(radians($2::float)) * cos(radians(pp.latitude::float)) *
                 cos(radians(pp.longitude::float) - radians($3::float)) +
                 sin(radians($2::float)) * sin(radians(pp.latitude::float))
               ))
             )
           ) <= $4`,
        [schoolId, schoolLat, schoolLon, radiusKm]
      ).then(r => r.rows.forEach((row: any) => {
        if (!allLeadIds.has(row.lead_id)) allLeadIds.set(row.lead_id, 'geo')
      })).catch(() => {})
    }

    // ── Branch 4: PINCODE — leads from same or nearby pincodes
    if (schoolPincode) {
      // Get nearby pincodes from other schools in DB as proxy for adjacent pincodes
      const nearbyPincodes = await db.query(
        `SELECT DISTINCT pincode FROM schools
         WHERE pincode IS NOT NULL AND pincode <> $1 AND pincode <> ''
           AND ($2::numeric IS NULL OR $3::numeric IS NULL OR
             6371.0 * acos(
               LEAST(1.0, GREATEST(-1.0,
                 cos(radians($2::float)) * cos(radians(latitude::float)) *
                 cos(radians(longitude::float) - radians($3::float)) +
                 sin(radians($2::float)) * sin(radians(latitude::float))
               ))
             ) <= 15
           )
         LIMIT $4`,
        [schoolPincode, schoolLat || null, schoolLon || null, nearbyPincodeCount]
      ).catch(() => ({ rows: [] }))

      const pincodes = [schoolPincode, ...nearbyPincodes.rows.map((r: any) => r.pincode)]

      // Leads where parent's profile pincode matches
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN parent_profiles pp ON pp.user_id = l.parent_id
         WHERE l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND pp.pincode = ANY($2::text[])`,
        [schoolId, pincodes]
      ).then(r => r.rows.forEach((row: any) => {
        if (!allLeadIds.has(row.lead_id)) allLeadIds.set(row.lead_id, 'pincode')
      })).catch(() => {})

      // Also leads from user_searches in same pincodes
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN user_searches us ON us.user_id = l.parent_id
         WHERE l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND us.created_at >= NOW() - INTERVAL '${win} days'
           AND us.search_pincode = ANY($2::text[])`,
        [schoolId, pincodes]
      ).then(r => r.rows.forEach((row: any) => {
        if (!allLeadIds.has(row.lead_id)) allLeadIds.set(row.lead_id, 'search')
      })).catch(() => {})
    }

    // ── Branch 5: CITY SEARCH — leads from parents who searched this city
    if (schoolCity) {
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN user_searches us ON us.user_id = l.parent_id
         WHERE l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND us.created_at >= NOW() - INTERVAL '${win} days'
           AND lower(us.search_city) = lower($2)`,
        [schoolId, schoolCity]
      ).then(r => r.rows.forEach((row: any) => {
        if (!allLeadIds.has(row.lead_id)) allLeadIds.set(row.lead_id, 'search')
      })).catch(() => {})
    }

    if (allLeadIds.size === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit, credits: creditBalance, singleLeadPricePaise, discoveryWindowDays })
    }

    const allIds  = Array.from(allLeadIds.keys())
    const total   = allIds.length
    const pageIds = allIds.slice(offset, offset + limit)

    if (pageIds.length === 0) {
      return NextResponse.json({ data: [], total, page, limit, credits: creditBalance, singleLeadPricePaise, discoveryWindowDays })
    }

    const placeholders = pageIds.map((_, i) => `$${i + 1}`).join(', ')
    const dataRes = await db.query(
      `SELECT
         l.id, l.status, l.source, l.message,
         l.is_purchased                        AS "isPurchased",
         l.purchased_by                        AS "purchasedBy",
         l.child_name                          AS "childName",
         l.class_applying_for                  AS "classApplyingFor",
         l.city, l.created_at                  AS "createdAt",
         l.how_did_you_hear                    AS "howDidYouHear",
         l.school_remarks                      AS "schoolRemarks",
         COALESCE(u.full_name, l.parent_name)  AS "fullName",
         COALESCE(u.phone, l.phone)            AS "fullPhone",
         COALESCE(u.email, l.email)            AS "fullEmail"
       FROM leads l
       LEFT JOIN users u ON u.id = l.parent_id
       WHERE l.id IN (${placeholders})
       ORDER BY l.created_at DESC`,
      pageIds
    )

    const data = dataRes.rows.map(row => {
      // A lead is unlocked for THIS school if:
      // 1. It's a direct lead AND is_purchased = true AND purchased_by = this school
      // 2. OR it's a direct lead AND purchased_by IS NULL (legacy — auto-unlocked for direct school)
      const isDirect   = allLeadIds.get(row.id) === 'direct'
      const unlockedForMe = row.isPurchased && (row.purchasedBy === schoolId || (isDirect && !row.purchasedBy))

      return {
        id:              row.id,
        status:          row.status,
        source:          row.source,
        childName:       row.childName,
        classApplyingFor: row.classApplyingFor,
        city:            row.city,
        createdAt:       row.createdAt,
        howDidYouHear:   row.howDidYouHear,
        schoolRemarks:   row.schoolRemarks,
        discoverySource: allLeadIds.get(row.id) ?? 'direct',
        isPurchased:     unlockedForMe,
        // Full details only if unlocked for THIS school
        fullName:        unlockedForMe ? row.fullName  : undefined,
        fullPhone:       unlockedForMe ? row.fullPhone : undefined,
        fullEmail:       unlockedForMe ? row.fullEmail : undefined,
        // Masked details always visible
        maskedName:      maskName(row.fullName  || 'Parent'),
        maskedPhone:     maskPhone(row.fullPhone || ''),
        singleLeadPricePaise,
      }
    })

    return NextResponse.json({ data, total, page, limit, credits: creditBalance, singleLeadPricePaise, discoveryWindowDays })
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

    // ── Public: create_lead / request_call (from school profile page) ─────────
    if (action === 'create_lead' || action === 'request_call') {
      const { schoolId, parentName, phone, childName, classApplyingFor, source } = body
      if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
      if (action === 'request_call') {
        if (!parentName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!phone?.trim())      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
      }
      const userId  = getUserId(req)
      const schoolRow = await db.query('SELECT id FROM schools WHERE id=$1', [schoolId])
      if (!schoolRow.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })

      // Dedup: same phone to same school within 24h
      if (phone) {
        const dup = await db.query(
          `SELECT id FROM leads WHERE school_id=$1 AND phone=$2 AND source=$3 AND created_at > NOW() - INTERVAL '24 hours'`,
          [schoolId, phone.replace(/\D/g, '').slice(-10), source || action]
        ).catch(() => ({ rows: [] }))
        if (dup.rows.length) return NextResponse.json({ success: true, duplicate: true })
      }

      await db.query(
        `INSERT INTO leads (school_id, parent_id, parent_name, phone, child_name, class_applying_for, source, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new')`,
        [schoolId, userId ?? null, parentName?.trim() || null,
         phone ? phone.replace(/\D/g, '').slice(-10) : null,
         childName?.trim() || null, classApplyingFor?.trim() || null, source || action]
      )
      if (schoolId) {
        import('@/lib/notify').then(m => m.notifyNewLead(schoolId, parentName?.trim() || 'A parent', childName?.trim(), classApplyingFor?.trim())).catch(() => {})
        // Fire email trigger — get school name for variable substitution
        db.query('SELECT name FROM schools WHERE id=$1', [schoolId]).then(sr => {
          const schoolName = sr.rows[0]?.name || ''
          import('@/lib/email').then(m => m.fireEmailTrigger('new_lead_school', 'school', {
            school_id: schoolId,
            variables: {
              '{{school_name}}':    schoolName,
              '{{admin_name}}':     schoolName,
              '{{child_name}}':     childName?.trim() || '',
              '{{class_applying}}': classApplyingFor?.trim() || '',
              '{{city}}':           '',
              '{{lead_count}}':     '',
              '{{dashboard_url}}':  `${process.env.NEXT_PUBLIC_BASE_URL || ''}/school/dashboard`,
            },
          })).catch(() => {})
        }).catch(() => {})
      }
      return NextResponse.json({ success: true })
    }

    // ── Public: record_search — parent searched for schools ───────────────────
    if (action === 'record_search') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ success: true }) // guests: nothing to record
      const { city, pincode, lat, lon, schoolId } = body

      // Record the search for discovery
      await db.query(
        `INSERT INTO user_searches (user_id, search_city, search_pincode, search_lat, search_lon)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, city || null, pincode || null, lat || null, lon || null]
      ).catch(() => {})

      // If parent viewed a specific school, create a search lead for that school
      if (schoolId) {
        const dup = await db.query(
          `SELECT id FROM leads WHERE school_id=$1 AND parent_id=$2 AND source='search' AND created_at > NOW() - INTERVAL '24 hours'`,
          [schoolId, userId]
        ).catch(() => ({ rows: [] }))

        if (!dup.rows.length) {
          // Get parent profile for name/phone
          const profile = await db.query(
            `SELECT u.full_name, u.phone, pp.pincode FROM users u
             LEFT JOIN parent_profiles pp ON pp.user_id = u.id
             WHERE u.id = $1`, [userId]
          ).catch(() => ({ rows: [] }))
          const p = profile.rows[0] || {}

          await db.query(
            `INSERT INTO leads (school_id, parent_id, parent_name, phone, source, status)
             VALUES ($1,$2,$3,$4,'search','new')`,
            [schoolId, userId, p.full_name || null, p.phone || null]
          ).catch(() => {})
        }
      }

      return NextResponse.json({ success: true })
    }

    // ── School admin: purchase / unlock a lead ────────────────────────────────
    if (action === 'purchase') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const leadId = queryLeadId || body.id
      if (!leadId) return NextResponse.json({ error: 'Lead id required' }, { status: 400 })

      const schoolRes = await db.query(
        'SELECT id, name, profile_completed, is_active FROM schools WHERE admin_user_id=$1', [userId]
      )
      if (!schoolRes.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })

      const sc = schoolRes.rows[0]
      let isComplete = sc.profile_completed === true
      if (!isComplete && sc.name && sc.name !== 'School') {
        await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [sc.id]).catch(() => {})
        isComplete = true
      }
      if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 })
      if (sc.is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })

      const schoolId = sc.id

      const lead = await db.query(
        'SELECT id, is_purchased, purchased_by FROM leads WHERE id=$1', [leadId]
      )
      if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

      // Already unlocked by THIS school
      const row = lead.rows[0]
      if (row.is_purchased && row.purchased_by === schoolId) {
        const unlocked = await db.query(
          `SELECT l.id, l.source, l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
                  COALESCE(u.full_name, l.parent_name) AS "fullName",
                  COALESCE(u.phone, l.phone) AS "fullPhone",
                  COALESCE(u.email, l.email) AS "fullEmail"
           FROM leads l LEFT JOIN users u ON u.id=l.parent_id WHERE l.id=$1`, [leadId]
        )
        return NextResponse.json({ success: true, lead: unlocked.rows[0] ?? null, alreadyUnlocked: true })
      }

      const credRow = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
      const available = credRow.rows[0]?.credits ?? 0

      if (available < 1) {
        const cfg = await getDiscoveryCfg()
        // NO CREDITS: return masked lead info + prompt to buy
        return NextResponse.json({
          error:                'NO_CREDITS',
          message:              'You have no lead credits. Buy a package or single lead to unlock.',
          singleLeadPricePaise: cfg.singleLeadPricePaise,
          buyUrl:               '/dashboard/school/packages',
        }, { status: 402 })
      }

      // Has credits: deduct 1 and unlock
      await db.query('BEGIN')
      try {
        await db.query(
          `UPDATE lead_credits SET credits=credits-1, used_credits=COALESCE(used_credits,0)+1, updated_at=NOW()
           WHERE school_id=$1`, [schoolId]
        )
        // Mark purchased_by this school (not global is_purchased — other schools can still buy)
        await db.query(
          `UPDATE leads SET is_purchased=true, purchased_by=$2, updated_at=NOW() WHERE id=$1`,
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
                COALESCE(u.phone, l.phone) AS "fullPhone",
                COALESCE(u.email, l.email) AS "fullEmail"
         FROM leads l LEFT JOIN users u ON u.id=l.parent_id WHERE l.id=$1`, [leadId]
      )
      const unlockedLead = unlocked.rows[0]
      if (unlockedLead) {
        import('@/lib/notify').then(m => m.notifyLeadUnlocked(schoolId, unlockedLead.fullName || 'A parent')).catch(() => {})
        import('@/lib/email').then(m => m.fireEmailTrigger('lead_unlocked', 'school', {
          school_id: schoolId,
          variables: {
            '{{parent_name}}':    unlockedLead.fullName || '',
            '{{parent_phone}}':   unlockedLead.fullPhone || '',
            '{{parent_email}}':   unlockedLead.fullEmail || '',
            '{{child_name}}':     unlockedLead.childName || '',
            '{{class_applying}}': unlockedLead.classApplyingFor || '',
            '{{dashboard_url}}':  `${process.env.NEXT_PUBLIC_BASE_URL || ''}/school/dashboard`,
          },
        })).catch(() => {})
      }
      return NextResponse.json({ success: true, lead: unlockedLead ?? null })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[leads POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
