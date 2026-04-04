export const dynamic = 'force-dynamic'
/**
 * /api/schools/profile  ← legacy path used by complete-profile page
 * Delegates to the consolidated /api/schools?action=profile handler.
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

/** GET /api/schools/profile — return the school profile for the authenticated admin */
export async function GET(req: NextRequest) {
  try {
    await ensureSchoolsTable()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await db.query('SELECT * FROM schools WHERE admin_user_id=$1', [userId])
    return NextResponse.json({ school: res.rows[0] || null })
  } catch (e: any) {
    console.error('[schools/profile GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/** POST /api/schools/profile — create or update the school profile */
export async function POST(req: NextRequest) {
  try {
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

    const logoFile = fd.get('logo') as File | null
    const coverFile = fd.get('cover') as File | null
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo image must be under 2MB' }, { status: 400 })
      const buf = Buffer.from(await logoFile.arrayBuffer())
      logoUrl = `data:${logoFile.type};base64,${buf.toString('base64')}`
    }
    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Cover image must be under 2MB' }, { status: 400 })
      const buf = Buffer.from(await coverFile.arrayBuffer())
      coverUrl = `data:${coverFile.type};base64,${buf.toString('base64')}`
    }

    await db.query(
      `INSERT INTO schools (admin_user_id,name,slug,tagline,affiliation_no,description,founding_year,total_students,student_teacher_ratio,school_type,board,gender_policy,medium_of_instruction,recognition,classes_from,classes_to,monthly_fee_min,monthly_fee_max,annual_fee,admission_open,admission_academic_year,facilities,sports,languages,extracurriculars,address_line1,state,city,locality,pincode,latitude,longitude,phone,email,website_url,principal_name,logo_url,cover_url,profile_completed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,true)
       ON CONFLICT (admin_user_id) DO UPDATE SET name=$2,tagline=$4,affiliation_no=$5,description=$6,founding_year=$7,total_students=$8,student_teacher_ratio=$9,school_type=$10,board=$11,gender_policy=$12,medium_of_instruction=$13,recognition=$14,classes_from=$15,classes_to=$16,monthly_fee_min=$17,monthly_fee_max=$18,annual_fee=$19,admission_open=$20,admission_academic_year=$21,facilities=$22,sports=$23,languages=$24,extracurriculars=$25,address_line1=$26,state=$27,city=$28,locality=$29,pincode=$30,latitude=$31,longitude=$32,phone=$33,email=$34,website_url=$35,principal_name=$36,logo_url=COALESCE($37,schools.logo_url),cover_url=COALESCE($38,schools.cover_url),profile_completed=true`,
      [userId, name, slug, tagline, affiliationNo, description, foundingYear, totalStudents, studentTeacherRatio, schoolType, board, genderPolicy, mediumOfInstruction, recognition, classesFrom, classesTo, monthlyFeeMin, monthlyFeeMax, annualFee, admissionOpen, admissionAcademicYear, facilities, sports, languages, extracurriculars, addressLine1, state, city, locality, pincode, latitude, longitude, phone, email, websiteUrl, principalName, logoUrl, coverUrl]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[schools/profile POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
