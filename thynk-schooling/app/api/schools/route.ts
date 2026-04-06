export const dynamic = 'force-dynamic'
/**
 * Consolidated Schools Route  (replaces schools/route, schools/profile/route,
 *                               schools/me/analytics/route, schools/me/dashboard-stats/route)
 *
 * GET  /api/schools                        — public listing with filters
 * GET  /api/schools?action=profile         — school admin: get own profile
 * POST /api/schools?action=profile         — school admin: create/update profile
 * GET  /api/schools?action=analytics       — school admin: analytics chart data
 * GET  /api/schools?action=dashboard-stats — school admin: stats counts
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    // 1. Authorization header (may be stripped by Vercel rewrites — kept as fallback)
    // 2. ts_access_token cookie (never set by this app's auth routes — kept for future use)
    // 3. __token query param — frontend appends this so it survives Vercel rewrites
    const url = new URL(req.url)
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      url.searchParams.get('__token') ||
      ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function ensureSchoolsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID UNIQUE, name VARCHAR(300), slug VARCHAR(300) UNIQUE,
      tagline VARCHAR(300), affiliation_no VARCHAR(100), description TEXT,
      founding_year INTEGER, total_students INTEGER, student_teacher_ratio VARCHAR(20),
      school_type VARCHAR(100), board TEXT[], gender_policy VARCHAR(100),
      medium_of_instruction VARCHAR(100), recognition VARCHAR(100),
      classes_from VARCHAR(50), classes_to VARCHAR(50),
      monthly_fee_min INTEGER, monthly_fee_max INTEGER, annual_fee INTEGER,
      admission_open BOOLEAN DEFAULT false, admission_academic_year VARCHAR(50),
      facilities TEXT[], sports TEXT[], languages TEXT[], extracurriculars TEXT[],
      address_line1 TEXT, state VARCHAR(100), city VARCHAR(100), locality VARCHAR(100),
      pincode VARCHAR(10), latitude NUMERIC(10,7), longitude NUMERIC(10,7),
      phone VARCHAR(20), email VARCHAR(200), website_url VARCHAR(300),
      principal_name VARCHAR(200), logo_url VARCHAR(500), cover_url VARCHAR(500),
      rating NUMERIC(3,1) DEFAULT 0, is_verified BOOLEAN DEFAULT false,
      is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
      profile_completed BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  const migrations = [
    'ADD COLUMN IF NOT EXISTS tagline VARCHAR(300)', 'ADD COLUMN IF NOT EXISTS affiliation_no VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS founding_year INTEGER', 'ADD COLUMN IF NOT EXISTS total_students INTEGER',
    'ADD COLUMN IF NOT EXISTS student_teacher_ratio VARCHAR(20)', 'ADD COLUMN IF NOT EXISTS school_type VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS medium_of_instruction VARCHAR(100)', 'ADD COLUMN IF NOT EXISTS recognition VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS classes_from VARCHAR(50)', 'ADD COLUMN IF NOT EXISTS classes_to VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS monthly_fee_min INTEGER', 'ADD COLUMN IF NOT EXISTS monthly_fee_max INTEGER',
    'ADD COLUMN IF NOT EXISTS annual_fee INTEGER', 'ADD COLUMN IF NOT EXISTS admission_open BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS admission_academic_year VARCHAR(50)', 'ADD COLUMN IF NOT EXISTS facilities TEXT[]',
    'ADD COLUMN IF NOT EXISTS sports TEXT[]', 'ADD COLUMN IF NOT EXISTS languages TEXT[]',
    'ADD COLUMN IF NOT EXISTS extracurriculars TEXT[]', 'ADD COLUMN IF NOT EXISTS address_line1 TEXT',
    'ADD COLUMN IF NOT EXISTS state VARCHAR(100)', 'ADD COLUMN IF NOT EXISTS locality VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)', 'ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)', 'ADD COLUMN IF NOT EXISTS website_url VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS principal_name VARCHAR(200)', 'ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)',
    'ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)',
  ]
  for (const m of migrations) await db.query(`ALTER TABLE schools ${m}`).catch(() => {})
}

// FormData helpers
function getArr(fd: FormData, key: string): string[] {
  return fd.getAll(key).flatMap(v => {
    const s = String(v).trim()
    if (!s || s === 'undefined' || s === 'null') return []
    if (s.startsWith('[')) { try { return JSON.parse(s).filter(Boolean) } catch { return [s] } }
    return [s]
  })
}
function getStr(fd: FormData, key: string): string | null {
  const v = fd.get(key)
  const s = String(v ?? '').trim()
  return (!v || !s || s === 'undefined' || s === 'null') ? null : s
}
function getInt(fd: FormData, key: string): number | null { const v = getStr(fd, key); if (!v) return null; const n = parseInt(v, 10); return isNaN(n) ? null : n }
function getFloat(fd: FormData, key: string): number | null { const v = getStr(fd, key); if (!v) return null; const n = parseFloat(v); return isNaN(n) ? null : n }
function getBool(fd: FormData, key: string): boolean { const v = getStr(fd, key); return v === 'true' || v === '1' }

// ─── handlers ────────────────────────────────────────────────────────────────

async function listSchools(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Direct school lookup by UUID (used by /apply/[schoolId] page)
  const schoolId = searchParams.get('schoolId')
  if (schoolId) {
    const res = await db.query(
      'SELECT id, name, city, state, logo_url, school_type, board, monthly_fee_min, monthly_fee_max FROM schools WHERE id=$1',
      [schoolId]
    ).catch(() => ({ rows: [] }))
    return NextResponse.json({ school: res.rows[0] || null })
  }

  const city     = searchParams.get('city')
  const state    = searchParams.get('state')
  const board    = searchParams.get('board')
  const query    = searchParams.get('query') || searchParams.get('search') || searchParams.get('q')
  const pincode  = searchParams.get('pincode')
  const userLat  = parseFloat(searchParams.get('lat')    || '')
  const userLng  = parseFloat(searchParams.get('lng')    || '')
  const radiusKm = parseFloat(searchParams.get('radius') || '10')
  const sortBy   = searchParams.get('sortBy') || 'rating'
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const offset   = (page - 1) * limit

  const useGPS     = !isNaN(userLat) && !isNaN(userLng)
  const usePincode = !!pincode && /^\d{6}$/.test(pincode)

  // ── VISIBILITY RULE: only profile_completed schools, not suspended ──────────
  const conditions: string[] = [
    'profile_completed = true',
    '(is_active = true OR is_active IS NULL)',
  ]
  const params: any[] = []

  // ── GPS proximity (Haversine bounding box + exact formula) ─────────────────
  if (useGPS) {
    const latDelta = radiusKm / 111.0
    const lngDelta = radiusKm / (111.0 * Math.cos(userLat * Math.PI / 180))
    params.push(userLat - latDelta, userLat + latDelta)
    conditions.push(`latitude BETWEEN $${params.length - 1} AND $${params.length}`)
    params.push(userLng - lngDelta, userLng + lngDelta)
    conditions.push(`longitude BETWEEN $${params.length - 1} AND $${params.length}`)
    params.push(userLat, userLng, radiusKm)
    const pL = params.length
    conditions.push(
      `(6371 * acos(LEAST(1.0, cos(radians($${pL-2})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${pL-1})) + sin(radians($${pL-2})) * sin(radians(latitude))))) <= $${pL}`
    )
  }

  // ── Exact pincode match (takes priority over city when no GPS) ─────────────
  if (usePincode && !useGPS) {
    params.push(pincode)
    conditions.push(`pincode = $${params.length}`)
  }

  // ── Standard filters ───────────────────────────────────────────────────────
  if (city  && !usePincode && !useGPS) { params.push(city);  conditions.push(`city ILIKE $${params.length}`) }
  if (state && !useGPS)                { params.push(state); conditions.push(`state ILIKE $${params.length}`) }
  if (board)  { params.push(`%${board}%`);  conditions.push(`board::text ILIKE $${params.length}`) }
  if (query)  { params.push(`%${query}%`);  conditions.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR board::text ILIKE $${params.length} OR pincode ILIKE $${params.length})`) }

  const extra: Record<string, string | null> = {
    feeMin: searchParams.get('feeMin'), feeMax: searchParams.get('feeMax'),
    rating: searchParams.get('rating'), isFeatured: searchParams.get('isFeatured'),
    type: searchParams.get('type'), gender_policy: searchParams.get('gender_policy'),
    medium: searchParams.get('medium'), facilities: searchParams.get('facilities'),
    sports: searchParams.get('sports'), extra_curricular: searchParams.get('extra_curricular'),
    language: searchParams.get('language'),
  }
  if (extra.facilities)       { params.push(`%${extra.facilities}%`);       conditions.push(`facilities::text ILIKE $${params.length}`) }
  if (extra.sports)           { params.push(`%${extra.sports}%`);           conditions.push(`sports::text ILIKE $${params.length}`) }
  if (extra.extra_curricular) { params.push(`%${extra.extra_curricular}%`); conditions.push(`extracurriculars::text ILIKE $${params.length}`) }
  if (extra.language)         { params.push(`%${extra.language}%`);         conditions.push(`languages::text ILIKE $${params.length}`) }
  if (extra.feeMin)           { params.push(Number(extra.feeMin));           conditions.push(`monthly_fee_min >= $${params.length}`) }
  if (extra.feeMax)           { params.push(Number(extra.feeMax));           conditions.push(`monthly_fee_max <= $${params.length}`) }
  if (extra.rating)           { params.push(Number(extra.rating));           conditions.push(`rating >= $${params.length}`) }
  if (extra.isFeatured)       { conditions.push('is_featured = true') }
  if (extra.type)             { params.push(extra.type);         conditions.push(`school_type ILIKE $${params.length}`) }
  if (extra.gender_policy)    { params.push(extra.gender_policy); conditions.push(`gender_policy ILIKE $${params.length}`) }
  if (extra.medium)           { params.push(extra.medium);       conditions.push(`medium_of_instruction ILIKE $${params.length}`) }

  const where = conditions.join(' AND ')

  // ── Distance column for GPS sort ───────────────────────────────────────────
  let distCol = ''
  let distParams: any[] = []
  if (useGPS) {
    distParams = [userLat, userLng]
    const pBase = params.length
    distCol = `, ROUND((6371 * acos(LEAST(1.0, cos(radians($${pBase+1})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${pBase+2})) + sin(radians($${pBase+1})) * sin(radians(latitude)))))::numeric, 1) AS distance_km`
  }

  // ── Sort order ─────────────────────────────────────────────────────────────
  let orderBy = 'is_featured DESC NULLS LAST, rating DESC NULLS LAST, created_at DESC'
  if (useGPS)                   orderBy = 'distance_km ASC NULLS LAST, is_featured DESC NULLS LAST'
  else if (sortBy === 'fee_asc')  orderBy = 'monthly_fee_min ASC NULLS LAST'
  else if (sortBy === 'fee_desc') orderBy = 'monthly_fee_min DESC NULLS LAST'
  else if (sortBy === 'newest')   orderBy = 'created_at DESC'

  const countRes = await db.query(`SELECT COUNT(*) FROM schools WHERE ${where}`, params)
  const total = parseInt(countRes.rows[0].count)

  const allParams = [...params, ...distParams, limit, offset]
  const dataRes = await db.query(
    `SELECT *${distCol} FROM schools WHERE ${where} ORDER BY ${orderBy} LIMIT $${allParams.length - 1} OFFSET $${allParams.length}`,
    allParams
  )

  const data = dataRes.rows.map((s: any) => ({
    id: s.id, name: s.name || '—', slug: s.slug || '',
    city: s.city || '—', state: s.state || null,
    pincode: s.pincode || null,
    latitude: s.latitude ? Number(s.latitude) : null,
    longitude: s.longitude ? Number(s.longitude) : null,
    board: Array.isArray(s.board) ? s.board : [],
    schoolType: s.school_type || null,
    genderPolicy: s.gender_policy || null,
    mediumOfInstruction: s.medium_of_instruction || null,
    logoUrl: s.logo_url || null,
    coverImageUrl: s.cover_url || null,
    isVerified: s.is_verified || false,
    isFeatured: s.is_featured || false,
    isActive: s.is_active !== false,
    avgRating: Number(s.rating) || 0,
    totalReviews: 0,
    monthlyFeeMin: s.monthly_fee_min || null,
    monthlyFeeMax: s.monthly_fee_max || null,
    annualFee: s.annual_fee || null,
    classesFrom: s.classes_from || null,
    classesTo: s.classes_to || null,
    facilities: Array.isArray(s.facilities) ? s.facilities : [],
    sports: Array.isArray(s.sports) ? s.sports : [],
    extraCurricular: Array.isArray(s.extracurriculars) ? s.extracurriculars : [],
    languagesOffered: Array.isArray(s.languages) ? s.languages : [],
    tags: [],
    ...(s.distance_km !== undefined ? { distanceKm: Number(s.distance_km) } : {}),
  }))
  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}


async function getProfile(req: NextRequest) {
  await ensureSchoolsTable()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.query('SELECT * FROM schools WHERE admin_user_id=$1', [userId])
  return NextResponse.json({ school: res.rows[0] || null })
}

async function saveProfile(req: NextRequest) {
  await ensureSchoolsTable()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized — token missing or invalid' }, { status: 401 })

  const fd = await req.formData()
  const name = getStr(fd, 'name') || 'School'

  // Image handling
  let logoUrl: string | null = getStr(fd, 'logo_url')
  let coverUrl: string | null = getStr(fd, 'cover_url')
  const logoFile = fd.get('logo') as File | null
  const coverFile = fd.get('cover') as File | null
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo image must be under 2MB' }, { status: 400 })
    logoUrl = `data:${logoFile.type};base64,${Buffer.from(await logoFile.arrayBuffer()).toString('base64')}`
  }
  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Cover image must be under 2MB' }, { status: 400 })
    coverUrl = `data:${coverFile.type};base64,${Buffer.from(await coverFile.arrayBuffer()).toString('base64')}`
  }

  const fields = [
    name,
    getStr(fd, 'tagline'), getStr(fd, 'affiliationNo'), getStr(fd, 'description'),
    getInt(fd, 'foundingYear'), getInt(fd, 'totalStudents'), getStr(fd, 'studentTeacherRatio'),
    getStr(fd, 'schoolType'), getArr(fd, 'board'), getStr(fd, 'genderPolicy'),
    getStr(fd, 'mediumOfInstruction'), getStr(fd, 'recognition'),
    getStr(fd, 'classesFrom'), getStr(fd, 'classesTo'),
    getInt(fd, 'monthlyFeeMin'), getInt(fd, 'monthlyFeeMax'), getInt(fd, 'annualFee'),
    getBool(fd, 'admissionOpen'), getStr(fd, 'admissionAcademicYear'),
    getArr(fd, 'facilities'), getArr(fd, 'sports'), getArr(fd, 'languages'), getArr(fd, 'extracurriculars'),
    getStr(fd, 'addressLine1'), getStr(fd, 'state'), getStr(fd, 'city'),
    getStr(fd, 'locality'), getStr(fd, 'pincode'),
    getFloat(fd, 'latitude'), getFloat(fd, 'longitude'),
    getStr(fd, 'phone'), getStr(fd, 'email'), getStr(fd, 'websiteUrl'), getStr(fd, 'principalName'),
    logoUrl, coverUrl,
  ]

  // Check for existing row — NEVER regenerate slug on update (causes UNIQUE constraint crash)
  const existing = await db.query('SELECT slug FROM schools WHERE admin_user_id=$1', [userId])

  if (existing.rows.length > 0) {
    // UPDATE — leave slug alone
    await db.query(
      `UPDATE schools SET
        name=$2, tagline=$3, affiliation_no=$4, description=$5,
        founding_year=$6, total_students=$7, student_teacher_ratio=$8,
        school_type=$9, board=$10, gender_policy=$11,
        medium_of_instruction=$12, recognition=$13,
        classes_from=$14, classes_to=$15,
        monthly_fee_min=$16, monthly_fee_max=$17, annual_fee=$18,
        admission_open=$19, admission_academic_year=$20,
        facilities=$21, sports=$22, languages=$23, extracurriculars=$24,
        address_line1=$25, state=$26, city=$27, locality=$28, pincode=$29,
        latitude=$30, longitude=$31,
        phone=$32, email=$33, website_url=$34, principal_name=$35,
        logo_url=COALESCE($36, logo_url),
        cover_url=COALESCE($37, cover_url),
        profile_completed=true
      WHERE admin_user_id=$1`,
      [userId, ...fields]
    )
  } else {
    // INSERT — generate slug only once, ever
    const slug = toSlug(name) + '-' + Date.now()
    await db.query(
      `INSERT INTO schools (
        admin_user_id, name, slug, tagline, affiliation_no, description,
        founding_year, total_students, student_teacher_ratio,
        school_type, board, gender_policy, medium_of_instruction, recognition,
        classes_from, classes_to, monthly_fee_min, monthly_fee_max, annual_fee,
        admission_open, admission_academic_year,
        facilities, sports, languages, extracurriculars,
        address_line1, state, city, locality, pincode, latitude, longitude,
        phone, email, website_url, principal_name, logo_url, cover_url, profile_completed
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,true
      )`,
      [
        userId,                          // $1  admin_user_id
        name,                            // $2  name
        slug,                            // $3  slug
        fields[1],                       // $4  tagline
        fields[2],                       // $5  affiliation_no
        fields[3],                       // $6  description
        fields[4],                       // $7  founding_year
        fields[5],                       // $8  total_students
        fields[6],                       // $9  student_teacher_ratio
        fields[7],                       // $10 school_type
        fields[8],                       // $11 board
        fields[9],                       // $12 gender_policy
        fields[10],                      // $13 medium_of_instruction
        fields[11],                      // $14 recognition
        fields[12],                      // $15 classes_from
        fields[13],                      // $16 classes_to
        fields[14],                      // $17 monthly_fee_min
        fields[15],                      // $18 monthly_fee_max
        fields[16],                      // $19 annual_fee
        fields[17],                      // $20 admission_open
        fields[18],                      // $21 admission_academic_year
        fields[19],                      // $22 facilities
        fields[20],                      // $23 sports
        fields[21],                      // $24 languages
        fields[22],                      // $25 extracurriculars
        fields[23],                      // $26 address_line1
        fields[24],                      // $27 state
        fields[25],                      // $28 city
        fields[26],                      // $29 locality
        fields[27],                      // $30 pincode
        fields[28],                      // $31 latitude
        fields[29],                      // $32 longitude
        fields[30],                      // $33 phone
        fields[31],                      // $34 email
        fields[32],                      // $35 website_url
        fields[33],                      // $36 principal_name
        fields[34],                      // $37 logo_url
        fields[35],                      // $38 cover_url
      ]
    )
  }

  return NextResponse.json({ success: true })
}

async function getAnalytics(req: NextRequest) {
  const userId = getUserId(req)
  const days = Number(new URL(req.url).searchParams.get('days') || 30)
  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
  if (!school.rows.length) return NextResponse.json({ leads: [], applications: [] })
  const sid = school.rows[0].id
  const [leads, apps] = await Promise.all([
    db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM leads WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '${days} days' GROUP BY day ORDER BY day`, [sid]).catch(() => ({ rows: [] })),
    db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM applications WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '${days} days' GROUP BY day ORDER BY day`, [sid]).catch(() => ({ rows: [] })),
  ])
  return NextResponse.json({ leads: leads.rows, applications: apps.rows })
}

async function getDashboardStats(req: NextRequest) {
  const userId = getUserId(req)
  const school = await db.query(
    'SELECT id, name, logo_url, city, state, board FROM schools WHERE admin_user_id=$1',
    [userId]
  ).catch(() => ({ rows: [] }))
  if (!school.rows.length) return NextResponse.json({ totalLeads: 0, totalApplications: 0, profileViews: 0, credits: 0, profileCompleteness: 0 })
  const { id: sid, name: schoolName, logo_url: schoolLogo, city: schoolCity, state: schoolState, board: schoolBoard } = school.rows[0]
  const [leads, apps, credits] = await Promise.all([
    db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ count: 0 }] })),
    db.query('SELECT COUNT(*) FROM applications WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ count: 0 }] })),
    db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ credits: 0 }] })),
  ])
  return NextResponse.json({
    totalLeads: Number(leads.rows[0].count),
    totalApplications: Number(apps.rows[0].count),
    profileViews: 0,
    credits: credits.rows[0]?.credits ?? 0,
    profileCompleteness: 0,
    schoolName:  schoolName  || null,
    schoolLogo:  schoolLogo  || null,
    schoolCity:  schoolCity  || null,
    schoolState: schoolState || null,
    schoolBoard: Array.isArray(schoolBoard) ? schoolBoard : [],
  })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'profile')         return await getProfile(req)
    if (action === 'analytics')       return await getAnalytics(req)
    if (action === 'dashboard-stats') return await getDashboardStats(req)
    return await listSchools(req)
  } catch (e: any) {
    console.error('[schools GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'profile') return await saveProfile(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[schools POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
