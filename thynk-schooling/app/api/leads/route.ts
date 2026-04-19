export const dynamic = 'force-dynamic'
/**
 * GET  /api/leads?limit=N&page=N        — school admin: list leads
 * POST /api/leads?action=purchase&id=X  — school admin: unlock a lead
 * POST /api/leads (body)                — public: create_lead | request_call | record_search
 *
 * Discovery branches (pincode / geo / search) are each individually guarded —
 * if their tables or columns don't exist yet they silently return 0 rows,
 * so direct leads ALWAYS show regardless of schema state.
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

// ─── table / column setup ─────────────────────────────────────────────────────
async function ensureTables() {
  // leads
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
    'ADD COLUMN IF NOT EXISTS school_remarks TEXT',
  ]) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

  // lead_credits
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
  for (const c of [
    'ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ',
  ]) await db.query(`ALTER TABLE lead_credits ${c}`).catch(() => {})

  // admin_settings
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // parent_profiles — ensure it exists AND has the lat/lon columns we need for geo discovery
  await db.query(`
    CREATE TABLE IF NOT EXISTS parent_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE,
      full_name VARCHAR(200),
      city VARCHAR(100),
      state VARCHAR(100),
      locality VARCHAR(200),
      pincode VARCHAR(10),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  // Add lat/lon if not present — these power the GEO discovery branch
  for (const c of [
    'ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
  ]) await db.query(`ALTER TABLE parent_profiles ${c}`).catch(() => {})

  // user_searches — powers the SEARCH discovery branch
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
  discoveryWindowDays: number
  radiusKm: number
  singleLeadPricePaise: number
}
async function getDiscoveryCfg(): Promise<DiscoveryCfg> {
  try {
    const row = await db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'")
    if (!row.rows.length) return { discoveryWindowDays: 90, radiusKm: 10, singleLeadPricePaise: 29900 }
    const cfg = JSON.parse(row.rows[0].value)
    return {
      singleLeadPricePaise: Number(cfg.defaultPricePaise ?? (cfg.pricePerLead ? cfg.pricePerLead * 100 : 29900)) || 29900,
      radiusKm:             Number(cfg.radiusKm ?? (cfg.maskBlurMeters ? Math.round(cfg.maskBlurMeters / 1000) : 10)) || 10,
      discoveryWindowDays:  Number(cfg.discoveryWindowDays ?? 90) || 90,
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

    // Self-heal profile_completed
    let isComplete = profile_completed === true
    if (!isComplete && schoolName && schoolName !== 'School') {
      await db.query('UPDATE schools SET profile_completed=true WHERE id=$1', [schoolId]).catch(() => {})
      isComplete = true
    }
    if (!isComplete) return NextResponse.json({ error: 'PROFILE_INCOMPLETE', message: 'Complete your school profile to access leads.' }, { status: 403 })
    if (is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended.' }, { status: 403 })

    const creditRow = await db.query('SELECT credits, total_credits, used_credits FROM lead_credits WHERE school_id=$1', [schoolId])
    const creditBalance = creditRow.rows[0] ?? { credits: 0, total_credits: 0, used_credits: 0 }

    const cfg = await getDiscoveryCfg()
    const { discoveryWindowDays, radiusKm, singleLeadPricePaise } = cfg
    const win = Math.max(1, Math.floor(discoveryWindowDays))

    // ── Step 1: Always get direct leads (safe, no joins) ─────────────────────
    const directRes = await db.query(
      `SELECT l.id AS lead_id, 'direct' AS discovery_source
       FROM leads l
       WHERE l.school_id = $1
         AND l.created_at >= NOW() - INTERVAL '${win} days'`,
      [schoolId]
    )

    // ── Step 2: Discovery branches — each runs independently and fails safely ─
    // Collect all discovered lead IDs with their source
    const discoveredMap = new Map<string, string>() // lead_id -> source (lowest priority wins)

    // Branch 2: PINCODE — only if school has a pincode
    if (schoolPincode) {
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN parent_profiles pp ON pp.user_id = l.parent_id
         WHERE l.parent_id IS NOT NULL
           AND l.school_id IS DISTINCT FROM $1
           AND pp.pincode = $2
           AND l.created_at >= NOW() - INTERVAL '${win} days'`,
        [schoolId, schoolPincode]
      ).then(res => {
        res.rows.forEach((r: any) => {
          if (!discoveredMap.has(r.lead_id)) discoveredMap.set(r.lead_id, 'pincode')
        })
      }).catch(() => {}) // safe: parent_profiles may not have pincode col yet
    }

    // Branch 3: GEO — only if school has lat/lon
    if (schoolLat && schoolLon) {
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN parent_profiles pp ON pp.user_id = l.parent_id
         WHERE l.parent_id IS NOT NULL
           AND l.school_id IS DISTINCT FROM $1
           AND pp.latitude IS NOT NULL AND pp.longitude IS NOT NULL
           AND (
             6371.0 * acos(
               LEAST(1.0, GREATEST(-1.0,
                 cos(radians($2::float)) * cos(radians(pp.latitude::float)) *
                 cos(radians(pp.longitude::float) - radians($3::float)) +
                 sin(radians($2::float)) * sin(radians(pp.latitude::float))
               ))
             )
           ) <= $4
           AND l.created_at >= NOW() - INTERVAL '${win} days'`,
        [schoolId, schoolLat, schoolLon, radiusKm]
      ).then(res => {
        res.rows.forEach((r: any) => {
          if (!discoveredMap.has(r.lead_id)) discoveredMap.set(r.lead_id, 'geo')
        })
      }).catch(() => {}) // safe: lat/lon columns may not exist on parent_profiles yet
    }

    // Branch 4: SEARCH — only if school has a city
    if (schoolCity || schoolPincode) {
      await db.query(
        `SELECT l.id AS lead_id
         FROM leads l
         JOIN user_searches us ON us.user_id = l.parent_id
         WHERE l.parent_id IS NOT NULL
           AND l.school_id IS DISTINCT FROM $1
           AND l.created_at >= NOW() - INTERVAL '${win} days'
           AND us.created_at >= NOW() - INTERVAL '${win} days'
           AND (
             ($2::text IS NOT NULL AND us.search_pincode = $2)
             OR ($3::text IS NOT NULL AND lower(us.search_city) = lower($3))
           )`,
        [schoolId, schoolPincode || null, schoolCity || null]
      ).then(res => {
        res.rows.forEach((r: any) => {
          if (!discoveredMap.has(r.lead_id)) discoveredMap.set(r.lead_id, 'search')
        })
      }).catch(() => {}) // safe: user_searches may not exist yet
    }

    // ── Step 3: Merge direct + discovery, removing duplicates ─────────────────
    // Build a unified map: lead_id -> discovery_source
    // Direct always takes priority over discovery
    const allLeadIds = new Map<string, string>()

    // Add discovery leads first (lower priority)
    discoveredMap.forEach((source, id) => allLeadIds.set(id, source))

    // Add direct leads (highest priority, overwrites discovery source)
    directRes.rows.forEach((r: any) => allLeadIds.set(r.lead_id, 'direct'))

    if (allLeadIds.size === 0) {
      return NextResponse.json({
        data: [], total: 0, page, limit,
        credits: creditBalance, singleLeadPricePaise, discoveryWindowDays,
      })
    }

    const allIds   = Array.from(allLeadIds.keys())
    const total    = allIds.length

    // Paginate the IDs
    const pageIds  = allIds.slice(offset, offset + limit)

    if (pageIds.length === 0) {
      return NextResponse.json({
        data: [], total, page, limit,
        credits: creditBalance, singleLeadPricePaise, discoveryWindowDays,
      })
    }

    // ── Step 4: Fetch full lead rows for this page ────────────────────────────
    const placeholders = pageIds.map((_, i) => `$${i + 1}`).join(', ')
    const dataRes = await db.query(
      `SELECT
         l.id, l.status,
         l.is_purchased        AS "isPurchased",
         l.child_name          AS "childName",
         l.class_applying_for  AS "classApplyingFor",
         l.city, l.created_at  AS "createdAt",
         l.source, l.message,
         l.how_did_you_hear    AS "howDidYouHear",
         l.school_remarks      AS "schoolRemarks",
         COALESCE(u.full_name, l.parent_name) AS "fullName",
         COALESCE(u.phone, l.phone)            AS "fullPhone",
         COALESCE(u.email, l.email)            AS "fullEmail"
       FROM leads l
       LEFT JOIN users u ON u.id = l.parent_id
       WHERE l.id IN (${placeholders})
       ORDER BY l.created_at DESC`,
      pageIds
    )

    const data = dataRes.rows.map(row => ({
      ...row,
      discoverySource: allLeadIds.get(row.id) ?? 'direct',
      maskedName:  maskName(row.fullName || 'Parent'),
      maskedPhone: maskPhone(row.fullPhone || ''),
      fullName:    row.isPurchased ? row.fullName  : undefined,
      fullPhone:   row.isPurchased ? row.fullPhone : undefined,
      fullEmail:   undefined,
      singleLeadPricePaise,
    }))

    return NextResponse.json({
      data,
      total,
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
      // Notify school of new lead
      if (schoolId) { import("@/lib/notify").then(m => m.notifyNewLead(schoolId, parentName?.trim() || "A parent", childName?.trim(), classApplyingFor?.trim())).catch(()=>{}) }
      return NextResponse.json({ success: true })
    }

    // ── Record school search ───────────────────────────────────────────────────
    if (action === 'record_search') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ success: true })
      const { city, pincode, lat, lon } = body
      await db.query(
        `INSERT INTO user_searches (user_id, search_city, search_pincode, search_lat, search_lon)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, city || null, pincode || null, lat || null, lon || null]
      ).catch(() => {})
      return NextResponse.json({ success: true })
    }

    // ── School admin: purchase / unlock ───────────────────────────────────────
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
          `UPDATE lead_credits SET credits=credits-1, used_credits=COALESCE(used_credits,0)+1, updated_at=NOW() WHERE school_id=$1`,
          [schoolId]
        )
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
      // Notify school of lead unlock
      const unlockedLead = unlocked.rows[0]
      if (unlockedLead) {
        import('@/lib/notify').then(m => m.notifyLeadUnlocked(schoolId, unlockedLead.fullName || 'A parent')).catch(() => {})
      }
      return NextResponse.json({ success: true, lead: unlockedLead ?? null })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[leads POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── PATCH /api/leads — school updates lead status + remarks ─────────────────
export async function PATCH(req: NextRequest) {
  try {
    await ensureTables()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, status, remarks } = body

    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    if (!status)  return NextResponse.json({ error: 'status required' },  { status: 400 })

    // Confirm the lead belongs to this school
    const schoolRes = await db.query(
      'SELECT id, is_active FROM schools WHERE admin_user_id=$1',
      [userId]
    )
    if (!schoolRes.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 403 })
    const school = schoolRes.rows[0]
    if (school.is_active === false) return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })

    // Only allow updating leads that belong to this school
    const lead = await db.query(
      'SELECT id, is_purchased FROM leads WHERE id=$1 AND school_id=$2',
      [leadId, school.id]
    )
    if (!lead.rows.length) return NextResponse.json({ error: 'Lead not found or not accessible' }, { status: 404 })
    if (!lead.rows[0].is_purchased) return NextResponse.json({ error: 'Unlock the lead first before updating status' }, { status: 403 })

    await db.query(
      `UPDATE leads SET status=$1, school_remarks=$2, updated_at=NOW() WHERE id=$3 AND school_id=$4`,
      [status, remarks?.trim() || null, leadId, school.id]
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[leads PATCH]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
