export const dynamic = 'force-dynamic'
/**
 * POST /api/schools/profile — save school profile
 * GET  /api/schools/profile — load school profile
 *
 * THIS IS THE REAL HANDLER. next.config.js has a rewrite that points here,
 * but Next.js also serves this file directly. Either way, this file handles it.
 *
 * Fixes applied:
 * 1. Reads token from Authorization header, cookie, OR ?__token= query param
 *    (Vercel rewrites strip Authorization headers)
 * 2. Uses UPDATE vs INSERT to avoid slug UNIQUE constraint crash on re-save
 * 3. Runs ALTER TABLE migrations to add admin_user_id if missing from old DB
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
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
  // Create table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID UNIQUE,
      name VARCHAR(300),
      slug VARCHAR(300) UNIQUE,
      tagline VARCHAR(300),
      affiliation_no VARCHAR(100),
      description TEXT,
      founding_year INTEGER,
      total_students INTEGER,
      student_teacher_ratio VARCHAR(20),
      school_type VARCHAR(100),
      board TEXT[],
      gender_policy VARCHAR(100),
      medium_of_instruction VARCHAR(100),
      recognition VARCHAR(100),
      classes_from VARCHAR(50),
      classes_to VARCHAR(50),
      monthly_fee_min INTEGER,
      monthly_fee_max INTEGER,
      annual_fee INTEGER,
      admission_open BOOLEAN DEFAULT false,
      admission_academic_year VARCHAR(50),
      facilities TEXT[],
      sports TEXT[],
      languages TEXT[],
      extracurriculars TEXT[],
      address_line1 TEXT,
      state VARCHAR(100),
      city VARCHAR(100),
      locality VARCHAR(100),
      pincode VARCHAR(10),
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      phone VARCHAR(20),
      email VARCHAR(200),
      website_url VARCHAR(300),
      principal_name VARCHAR(200),
      logo_url VARCHAR(500),
      cover_url VARCHAR(500),
      rating NUMERIC(3,1) DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      profile_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // Run ALL column migrations — including admin_user_id which may be missing
  // from databases created before this column was added
  const migrations = [
    'ADD COLUMN IF NOT EXISTS admin_user_id UUID',
    'ADD COLUMN IF NOT EXISTS slug VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS tagline VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS affiliation_no VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS description TEXT',
    'ADD COLUMN IF NOT EXISTS founding_year INTEGER',
    'ADD COLUMN IF NOT EXISTS total_students INTEGER',
    'ADD COLUMN IF NOT EXISTS student_teacher_ratio VARCHAR(20)',
    'ADD COLUMN IF NOT EXISTS school_type VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS board TEXT[]',
    'ADD COLUMN IF NOT EXISTS gender_policy VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS medium_of_instruction VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS recognition VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS classes_from VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS classes_to VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS monthly_fee_min INTEGER',
    'ADD COLUMN IF NOT EXISTS monthly_fee_max INTEGER',
    'ADD COLUMN IF NOT EXISTS annual_fee INTEGER',
    'ADD COLUMN IF NOT EXISTS admission_open BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS admission_academic_year VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS facilities TEXT[]',
    'ADD COLUMN IF NOT EXISTS sports TEXT[]',
    'ADD COLUMN IF NOT EXISTS languages TEXT[]',
    'ADD COLUMN IF NOT EXISTS extracurriculars TEXT[]',
    'ADD COLUMN IF NOT EXISTS address_line1 TEXT',
    'ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS locality VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
    'ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS website_url VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS principal_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)',
    'ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)',
    'ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false',
  ]
  for (const m of migrations) {
    await db.query(`ALTER TABLE schools ${m}`).catch(() => {})
  }

  // Ensure UNIQUE constraints exist (safe to run multiple times)
  await db.query(`
    DO $$ BEGIN
      BEGIN
        ALTER TABLE schools ADD CONSTRAINT schools_admin_user_id_key UNIQUE (admin_user_id);
      EXCEPTION WHEN duplicate_table THEN NULL;
      END;
      BEGIN
        ALTER TABLE schools ADD CONSTRAINT schools_slug_key UNIQUE (slug);
      EXCEPTION WHEN duplicate_table THEN NULL;
      END;
    END $$;
  `).catch(() => {})
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
  const v = fd.get(key); const s = String(v ?? '').trim()
  return (!v || !s || s === 'undefined' || s === 'null') ? null : s
}
function getInt(fd: FormData, key: string): number | null {
  const v = getStr(fd, key); if (!v) return null; const n = parseInt(v, 10); return isNaN(n) ? null : n
}
function getFloat(fd: FormData, key: string): number | null {
  const v = getStr(fd, key); if (!v) return null; const n = parseFloat(v); return isNaN(n) ? null : n
}
function getBool(fd: FormData, key: string): boolean {
  const v = getStr(fd, key); return v === 'true' || v === '1'
}

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

export async function POST(req: NextRequest) {
  try {
    await ensureSchoolsTable()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized — token missing or invalid. Please log out and log in again.' }, { status: 401 })

    const fd = await req.formData()
    const name = getStr(fd, 'name') || 'School'

    // Image handling
    let logoUrl: string | null = getStr(fd, 'logo_url')
    let coverUrl: string | null = getStr(fd, 'cover_url')
    const logoFile = fd.get('logo') as File | null
    const coverFile = fd.get('cover') as File | null
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo must be under 2 MB' }, { status: 400 })
      logoUrl = `data:${logoFile.type};base64,${Buffer.from(await logoFile.arrayBuffer()).toString('base64')}`
    }
    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Cover image must be under 2 MB' }, { status: 400 })
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

    // Check existing row FIRST — never regenerate slug (causes UNIQUE constraint crash)
    const existing = await db.query('SELECT slug FROM schools WHERE admin_user_id=$1', [userId])

    if (existing.rows.length > 0) {
      // UPDATE — never touch slug
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
      // INSERT — generate slug once, ever
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
          userId, name, slug,
          fields[1], fields[2], fields[3], fields[4], fields[5], fields[6],
          fields[7], fields[8], fields[9], fields[10], fields[11], fields[12],
          fields[13], fields[14], fields[15], fields[16], fields[17], fields[18],
          fields[19], fields[20], fields[21], fields[22], fields[23], fields[24],
          fields[25], fields[26], fields[27], fields[28], fields[29], fields[30],
          fields[31], fields[32], fields[33], fields[34], fields[35],
        ]
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[schools/profile POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
