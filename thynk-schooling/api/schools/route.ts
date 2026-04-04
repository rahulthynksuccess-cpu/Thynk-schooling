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
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
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
  const city = searchParams.get('city'), state = searchParams.get('state')
  const board = searchParams.get('board')
  const query = searchParams.get('query') || searchParams.get('search') || searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit
  const conditions: string[] = ['1=1']; const params: any[] = []
  if (city)  { params.push(city);          conditions.push(`city ILIKE $${params.length}`) }
  if (state) { params.push(state);         conditions.push(`state ILIKE $${params.length}`) }
  if (board) { params.push(`%${board}%`);  conditions.push(`board::text ILIKE $${params.length}`) }
  if (query) { params.push(`%${query}%`);  conditions.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR board::text ILIKE $${params.length})`) }
  const extra: Record<string, string | null> = { feeMin: searchParams.get('feeMin'), feeMax: searchParams.get('feeMax'), rating: searchParams.get('rating'), isFeatured: searchParams.get('isFeatured'), type: searchParams.get('type'), gender_policy: searchParams.get('gender_policy'), medium: searchParams.get('medium'), facilities: searchParams.get('facilities'), sports: searchParams.get('sports'), extra_curricular: searchParams.get('extra_curricular'), language: searchParams.get('language') }
  if (extra.facilities)      { params.push(`%${extra.facilities}%`);      conditions.push(`facilities::text ILIKE $${params.length}`) }
  if (extra.sports)          { params.push(`%${extra.sports}%`);          conditions.push(`sports::text ILIKE $${params.length}`) }
  if (extra.extra_curricular){ params.push(`%${extra.extra_curricular}%`);conditions.push(`extra_curricular::text ILIKE $${params.length}`) }
  if (extra.language)        { params.push(`%${extra.language}%`);        conditions.push(`languages_offered::text ILIKE $${params.length}`) }
  if (extra.feeMin)          { params.push(extra.feeMin);                 conditions.push(`fee_min >= $${params.length}`) }
  if (extra.feeMax)          { params.push(extra.feeMax);                 conditions.push(`fee_max <= $${params.length}`) }
  if (extra.rating)          { params.push(extra.rating);                 conditions.push(`rating >= $${params.length}`) }
  if (extra.isFeatured)      {                                             conditions.push('is_featured = true') }
  if (extra.type)            { params.push(extra.type);                   conditions.push(`type ILIKE $${params.length}`) }
  if (extra.gender_policy)   { params.push(extra.gender_policy);          conditions.push(`gender_policy ILIKE $${params.length}`) }
  if (extra.medium)          { params.push(extra.medium);                 conditions.push(`medium ILIKE $${params.length}`) }
  const where = conditions.join(' AND ')
  const countRes = await db.query(`SELECT COUNT(*) FROM schools WHERE ${where}`, params)
  const total = parseInt(countRes.rows[0].count)
  params.push(limit, offset)
  const dataRes = await db.query(`SELECT * FROM schools WHERE ${where} ORDER BY is_featured DESC NULLS LAST, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  return NextResponse.json({ data: dataRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) })
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
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fd = await req.formData()
  const name = getStr(fd, 'name') || 'School'
  const slug = toSlug(name) + '-' + Date.now()
  const tagline = getStr(fd, 'tagline'), affiliationNo = getStr(fd, 'affiliationNo'), description = getStr(fd, 'description')
  const foundingYear = getInt(fd, 'foundingYear'), totalStudents = getInt(fd, 'totalStudents')
  const studentTeacherRatio = getStr(fd, 'studentTeacherRatio'), schoolType = getStr(fd, 'schoolType')
  const board = getArr(fd, 'board'), genderPolicy = getStr(fd, 'genderPolicy')
  const mediumOfInstruction = getStr(fd, 'mediumOfInstruction'), recognition = getStr(fd, 'recognition')
  const classesFrom = getStr(fd, 'classesFrom'), classesTo = getStr(fd, 'classesTo')
  const monthlyFeeMin = getInt(fd, 'monthlyFeeMin'), monthlyFeeMax = getInt(fd, 'monthlyFeeMax'), annualFee = getInt(fd, 'annualFee')
  const admissionOpen = getBool(fd, 'admissionOpen'), admissionAcademicYear = getStr(fd, 'admissionAcademicYear')
  const facilities = getArr(fd, 'facilities'), sports = getArr(fd, 'sports'), languages = getArr(fd, 'languages'), extracurriculars = getArr(fd, 'extracurriculars')
  const addressLine1 = getStr(fd, 'addressLine1'), state = getStr(fd, 'state'), city = getStr(fd, 'city'), locality = getStr(fd, 'locality'), pincode = getStr(fd, 'pincode')
  const latitude = getFloat(fd, 'latitude'), longitude = getFloat(fd, 'longitude')
  const phone = getStr(fd, 'phone'), email = getStr(fd, 'email'), websiteUrl = getStr(fd, 'websiteUrl'), principalName = getStr(fd, 'principalName')
  let logoUrl: string | null = getStr(fd, 'logo_url'), coverUrl: string | null = getStr(fd, 'cover_url')
  const logoFile = fd.get('logo') as File | null, coverFile = fd.get('cover') as File | null
  if (logoFile && logoFile.size > 0) { const buf = Buffer.from(await logoFile.arrayBuffer()); logoUrl = `data:${logoFile.type};base64,${buf.toString('base64')}` }
  if (coverFile && coverFile.size > 0) { const buf = Buffer.from(await coverFile.arrayBuffer()); coverUrl = `data:${coverFile.type};base64,${buf.toString('base64')}` }
  await db.query(
    `INSERT INTO schools (admin_user_id,name,slug,tagline,affiliation_no,description,founding_year,total_students,student_teacher_ratio,school_type,board,gender_policy,medium_of_instruction,recognition,classes_from,classes_to,monthly_fee_min,monthly_fee_max,annual_fee,admission_open,admission_academic_year,facilities,sports,languages,extracurriculars,address_line1,state,city,locality,pincode,latitude,longitude,phone,email,website_url,principal_name,logo_url,cover_url,profile_completed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,true)
     ON CONFLICT (admin_user_id) DO UPDATE SET name=$2,tagline=$4,affiliation_no=$5,description=$6,founding_year=$7,total_students=$8,student_teacher_ratio=$9,school_type=$10,board=$11,gender_policy=$12,medium_of_instruction=$13,recognition=$14,classes_from=$15,classes_to=$16,monthly_fee_min=$17,monthly_fee_max=$18,annual_fee=$19,admission_open=$20,admission_academic_year=$21,facilities=$22,sports=$23,languages=$24,extracurriculars=$25,address_line1=$26,state=$27,city=$28,locality=$29,pincode=$30,latitude=$31,longitude=$32,phone=$33,email=$34,website_url=$35,principal_name=$36,logo_url=COALESCE($37,schools.logo_url),cover_url=COALESCE($38,schools.cover_url),profile_completed=true`,
    [userId, name, slug, tagline, affiliationNo, description, foundingYear, totalStudents, studentTeacherRatio, schoolType, board, genderPolicy, mediumOfInstruction, recognition, classesFrom, classesTo, monthlyFeeMin, monthlyFeeMax, annualFee, admissionOpen, admissionAcademicYear, facilities, sports, languages, extracurriculars, addressLine1, state, city, locality, pincode, latitude, longitude, phone, email, websiteUrl, principalName, logoUrl, coverUrl]
  )
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
  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
  if (!school.rows.length) return NextResponse.json({ totalLeads: 0, totalApplications: 0, profileViews: 0, credits: 0 })
  const sid = school.rows[0].id
  const [leads, apps, credits] = await Promise.all([
    db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ count: 0 }] })),
    db.query('SELECT COUNT(*) FROM applications WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ count: 0 }] })),
    db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [sid]).catch(() => ({ rows: [{ credits: 0 }] })),
  ])
  return NextResponse.json({ totalLeads: Number(leads.rows[0].count), totalApplications: Number(apps.rows[0].count), profileViews: 0, credits: credits.rows[0]?.credits ?? 0 })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'profile')         return getProfile(req)
    if (action === 'analytics')       return getAnalytics(req)
    if (action === 'dashboard-stats') return getDashboardStats(req)
    return listSchools(req)
  } catch (e: any) {
    console.error('[schools GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'profile') return saveProfile(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[schools POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
