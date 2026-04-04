export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id          UUID UNIQUE,
      name                   VARCHAR(300),
      slug                   VARCHAR(300) UNIQUE,
      tagline                VARCHAR(300),
      affiliation_no         VARCHAR(100),
      description            TEXT,
      founding_year          INTEGER,
      total_students         INTEGER,
      student_teacher_ratio  VARCHAR(20),
      school_type            VARCHAR(100),
      board                  TEXT[],
      gender_policy          VARCHAR(100),
      medium_of_instruction  VARCHAR(100),
      recognition            VARCHAR(100),
      classes_from           VARCHAR(50),
      classes_to             VARCHAR(50),
      monthly_fee_min        INTEGER,
      monthly_fee_max        INTEGER,
      annual_fee             INTEGER,
      admission_open         BOOLEAN DEFAULT false,
      admission_academic_year VARCHAR(50),
      facilities             TEXT[],
      sports                 TEXT[],
      languages              TEXT[],
      extracurriculars       TEXT[],
      address_line1          TEXT,
      state                  VARCHAR(100),
      city                   VARCHAR(100),
      locality               VARCHAR(100),
      pincode                VARCHAR(10),
      latitude               NUMERIC(10,7),
      longitude              NUMERIC(10,7),
      phone                  VARCHAR(20),
      email                  VARCHAR(200),
      website_url            VARCHAR(300),
      principal_name         VARCHAR(200),
      logo_url               VARCHAR(500),
      cover_url              VARCHAR(500),
      rating                 NUMERIC(3,1) DEFAULT 0,
      is_verified            BOOLEAN DEFAULT false,
      is_featured            BOOLEAN DEFAULT false,
      is_active              BOOLEAN DEFAULT true,
      profile_completed      BOOLEAN DEFAULT false,
      created_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // Add any missing columns to existing tables (safe migrations)
  const migrations = [
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS tagline VARCHAR(300)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS affiliation_no VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS founding_year INTEGER`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS total_students INTEGER`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_teacher_ratio VARCHAR(20)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_type VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS medium_of_instruction VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS recognition VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS classes_from VARCHAR(50)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS classes_to VARCHAR(50)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS monthly_fee_min INTEGER`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS monthly_fee_max INTEGER`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS annual_fee INTEGER`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS admission_open BOOLEAN DEFAULT false`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS admission_academic_year VARCHAR(50)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS facilities TEXT[]`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS sports TEXT[]`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS languages TEXT[]`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS extracurriculars TEXT[]`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS address_line1 TEXT`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS state VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS locality VARCHAR(100)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS website_url VARCHAR(300)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_name VARCHAR(200)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)`,
  ]
  for (const sql of migrations) {
    await db.query(sql).catch(() => {})
  }
}

// Parse array values from FormData (appended multiple times)
function getArr(fd: FormData, key: string): string[] {
  const all = fd.getAll(key)
  return all.flatMap(v => {
    const s = String(v).trim()
    if (!s || s === 'undefined' || s === 'null') return []
    // Handle JSON-encoded arrays
    if (s.startsWith('[')) {
      try { return JSON.parse(s).filter(Boolean) } catch { return [s] }
    }
    return [s]
  })
}

function getStr(fd: FormData, key: string): string | null {
  const v = fd.get(key)
  if (v === null || v === undefined || String(v).trim() === '' || String(v) === 'undefined' || String(v) === 'null') return null
  return String(v).trim()
}

function getInt(fd: FormData, key: string): number | null {
  const v = getStr(fd, key)
  if (!v) return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

function getFloat(fd: FormData, key: string): number | null {
  const v = getStr(fd, key)
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function getBool(fd: FormData, key: string): boolean {
  const v = getStr(fd, key)
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest) {
  await ensureTable()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await db.query('SELECT * FROM schools WHERE admin_user_id = $1', [userId])
    return NextResponse.json({ school: res.rows[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse FormData (supports file uploads + text fields)
    const fd = await req.formData()

    const name        = getStr(fd, 'name') || 'School'
    const slug        = toSlug(name) + '-' + Date.now()

    const tagline              = getStr(fd, 'tagline')
    const affiliationNo        = getStr(fd, 'affiliationNo')
    const description          = getStr(fd, 'description')
    const foundingYear         = getInt(fd, 'foundingYear')
    const totalStudents        = getInt(fd, 'totalStudents')
    const studentTeacherRatio  = getStr(fd, 'studentTeacherRatio')
    const schoolType           = getStr(fd, 'schoolType')
    const board                = getArr(fd, 'board')
    const genderPolicy         = getStr(fd, 'genderPolicy')
    const mediumOfInstruction  = getStr(fd, 'mediumOfInstruction')
    const recognition          = getStr(fd, 'recognition')
    const classesFrom          = getStr(fd, 'classesFrom')
    const classesTo            = getStr(fd, 'classesTo')
    const monthlyFeeMin        = getInt(fd, 'monthlyFeeMin')
    const monthlyFeeMax        = getInt(fd, 'monthlyFeeMax')
    const annualFee            = getInt(fd, 'annualFee')
    const admissionOpen        = getBool(fd, 'admissionOpen')
    const admissionAcademicYear = getStr(fd, 'admissionAcademicYear')
    const facilities           = getArr(fd, 'facilities')
    const sports               = getArr(fd, 'sports')
    const languages            = getArr(fd, 'languages')
    const extracurriculars     = getArr(fd, 'extracurriculars')
    const addressLine1         = getStr(fd, 'addressLine1')
    const state                = getStr(fd, 'state')
    const city                 = getStr(fd, 'city')
    const locality             = getStr(fd, 'locality')
    const pincode              = getStr(fd, 'pincode')
    const latitude             = getFloat(fd, 'latitude')
    const longitude            = getFloat(fd, 'longitude')
    const phone                = getStr(fd, 'phone')
    const email                = getStr(fd, 'email')
    const websiteUrl           = getStr(fd, 'websiteUrl')
    const principalName        = getStr(fd, 'principalName')

    // File uploads — convert to base64 data URIs for now (or store as-is if no storage configured)
    let logoUrl: string | null = getStr(fd, 'logo_url')
    let coverUrl: string | null = getStr(fd, 'cover_url')

    const logoFile  = fd.get('logo')  as File | null
    const coverFile = fd.get('cover') as File | null

    if (logoFile && logoFile.size > 0) {
      const buf = Buffer.from(await logoFile.arrayBuffer())
      logoUrl = `data:${logoFile.type};base64,${buf.toString('base64')}`
    }
    if (coverFile && coverFile.size > 0) {
      const buf = Buffer.from(await coverFile.arrayBuffer())
      coverUrl = `data:${coverFile.type};base64,${buf.toString('base64')}`
    }

    await db.query(
      `INSERT INTO schools (
        admin_user_id, name, slug, tagline, affiliation_no, description,
        founding_year, total_students, student_teacher_ratio,
        school_type, board, gender_policy, medium_of_instruction, recognition,
        classes_from, classes_to,
        monthly_fee_min, monthly_fee_max, annual_fee,
        admission_open, admission_academic_year,
        facilities, sports, languages, extracurriculars,
        address_line1, state, city, locality, pincode, latitude, longitude,
        phone, email, website_url, principal_name,
        logo_url, cover_url, profile_completed
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,true
      )
      ON CONFLICT (admin_user_id) DO UPDATE SET
        name=$2, tagline=$4, affiliation_no=$5, description=$6,
        founding_year=$7, total_students=$8, student_teacher_ratio=$9,
        school_type=$10, board=$11, gender_policy=$12, medium_of_instruction=$13, recognition=$14,
        classes_from=$15, classes_to=$16,
        monthly_fee_min=$17, monthly_fee_max=$18, annual_fee=$19,
        admission_open=$20, admission_academic_year=$21,
        facilities=$22, sports=$23, languages=$24, extracurriculars=$25,
        address_line1=$26, state=$27, city=$28, locality=$29, pincode=$30,
        latitude=$31, longitude=$32,
        phone=$33, email=$34, website_url=$35, principal_name=$36,
        logo_url = COALESCE($37, schools.logo_url),
        cover_url = COALESCE($38, schools.cover_url),
        profile_completed=true`,
      [
        userId, name, slug, tagline, affiliationNo, description,
        foundingYear, totalStudents, studentTeacherRatio,
        schoolType, board, genderPolicy, mediumOfInstruction, recognition,
        classesFrom, classesTo,
        monthlyFeeMin, monthlyFeeMax, annualFee,
        admissionOpen, admissionAcademicYear,
        facilities, sports, languages, extracurriculars,
        addressLine1, state, city, locality, pincode, latitude, longitude,
        phone, email, websiteUrl, principalName,
        logoUrl, coverUrl,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[schools/profile POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
