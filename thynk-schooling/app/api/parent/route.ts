export const dynamic = 'force-dynamic'
/**
 * Consolidated Parent Route
 *
 * GET  /api/parent?action=applications
 * GET  /api/parent?action=students
 * POST /api/parent?action=students
 * GET  /api/parent?action=profile
 * POST /api/parent?action=profile
 * GET  /api/parent?action=saved-schools
 * GET  /api/parent?action=recommendations
 * POST /api/parent?action=book-counselling
 * GET  /api/parent?action=lead-credits
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

async function ensureStudents() {
  await db.query(`CREATE TABLE IF NOT EXISTS students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, full_name VARCHAR(200), dob DATE, gender VARCHAR(50), current_class VARCHAR(50), applying_for_class VARCHAR(50), academic_year VARCHAR(50), blood_group VARCHAR(20), current_school VARCHAR(200), special_needs TEXT, class_level VARCHAR(50), board_preference VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  for (const col of ['ADD COLUMN IF NOT EXISTS dob DATE','ADD COLUMN IF NOT EXISTS gender VARCHAR(50)','ADD COLUMN IF NOT EXISTS current_class VARCHAR(50)','ADD COLUMN IF NOT EXISTS applying_for_class VARCHAR(50)','ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50)','ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20)','ADD COLUMN IF NOT EXISTS current_school VARCHAR(200)','ADD COLUMN IF NOT EXISTS special_needs TEXT'])
    await db.query(`ALTER TABLE students ${col}`).catch(() => {})
}

async function ensureParentProfiles() {
  await db.query(`CREATE TABLE IF NOT EXISTS parent_profiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE, full_name VARCHAR(200), city VARCHAR(100), state VARCHAR(100), locality VARCHAR(200), pincode VARCHAR(10), occupation VARCHAR(200), income_range VARCHAR(100), religion VARCHAR(100), budget_min INTEGER, budget_max INTEGER, how_did_you_hear VARCHAR(200), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  for (const col of ['ADD COLUMN IF NOT EXISTS state VARCHAR(100)','ADD COLUMN IF NOT EXISTS locality VARCHAR(200)','ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)','ADD COLUMN IF NOT EXISTS religion VARCHAR(100)','ADD COLUMN IF NOT EXISTS budget_min INTEGER','ADD COLUMN IF NOT EXISTS budget_max INTEGER','ADD COLUMN IF NOT EXISTS how_did_you_hear VARCHAR(200)','ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()'])
    await db.query(`ALTER TABLE parent_profiles ${col}`).catch(() => {})
}

async function ensureCounselling() {
  await db.query(`CREATE TABLE IF NOT EXISTS counselling_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, name VARCHAR(200), phone VARCHAR(20), email VARCHAR(200), city VARCHAR(100), query TEXT, status VARCHAR(50) DEFAULT 'pending', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
}

async function sendCounsellingEmail(data: any) {
  try {
    const key = process.env.SENDGRID_API_KEY
    if (!key) { console.log('[Counselling] No SENDGRID_API_KEY, skipping email', data); return }
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalizations: [{ to: [{ email: 'success@thynksuccess.com' }] }], from: { email: process.env.FROM_EMAIL || 'noreply@thynkschooling.in', name: 'Thynk Schooling' }, subject: `New Counselling Request — ${data.name} (${data.phone})`, content: [{ type: 'text/plain', value: JSON.stringify(data, null, 2) }] })
    })
  } catch (e) { console.error('[Counselling] email error', e) }
}

// ─── GET handlers ─────────────────────────────────────────────────────────────

async function getApplications(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const userId = getUserId(req)
  const limit = Number(new URL(req.url).searchParams.get('limit') || 5)
  const rows = await db.query(`SELECT a.*, s.name AS school_name FROM applications a LEFT JOIN schools s ON s.id=a.school_id WHERE a.parent_id=$1 ORDER BY a.created_at DESC LIMIT $2`, [userId, limit])
  return NextResponse.json(rows.rows)
}

async function getStudents(req: NextRequest) {
  await ensureStudents()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json([])
  const rows = await db.query(
    `SELECT id, parent_id AS "parentId", full_name AS "fullName", dob, gender, current_class AS "currentClass", applying_for_class AS "applyingForClass", academic_year AS "academicYear", blood_group AS "bloodGroup", current_school AS "currentSchool", special_needs AS "specialNeeds", class_level AS "classLevel", board_preference AS "boardPreference", created_at AS "createdAt" FROM students WHERE parent_id=$1 ORDER BY created_at`,
    [userId]
  )
  return NextResponse.json(rows.rows)
}

async function getParentProfile(req: NextRequest) {
  await ensureParentProfiles()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await db.query(`SELECT id, user_id AS "userId", full_name AS "fullName", city, state, locality, pincode, occupation, income_range AS "incomeRange", religion, budget_min AS "budgetMin", budget_max AS "budgetMax", how_did_you_hear AS "howDidYouHear", created_at AS "createdAt" FROM parent_profiles WHERE user_id=$1`, [userId])
  return NextResponse.json(row.rows[0] || null)
}

async function getSavedSchools(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS saved_schools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, school_id UUID, UNIQUE(user_id,school_id), created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const userId = getUserId(req)
  const limit = Number(new URL(req.url).searchParams.get('limit') || 4)
  const rows = await db.query(`SELECT s.* FROM saved_schools ss JOIN schools s ON s.id=ss.school_id WHERE ss.user_id=$1 ORDER BY ss.created_at DESC LIMIT $2`, [userId, limit])
  return NextResponse.json(rows.rows)
}

async function getRecommendations(req: NextRequest) {
  const limit = Number(new URL(req.url).searchParams.get('limit') || 4)
  const rows = await db.query(`SELECT * FROM schools WHERE is_active=true ORDER BY rating DESC NULLS LAST LIMIT $1`, [limit]).catch(() => ({ rows: [] }))
  return NextResponse.json(rows.rows)
}

async function getLeadCredits(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS lead_credits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID UNIQUE, credits INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const userId = getUserId(req)
  const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
  if (!school.rows.length) return NextResponse.json({ credits: 0 })
  const cred = await db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [school.rows[0].id])
  return NextResponse.json({ credits: cred.rows[0]?.credits ?? 0 })
}

// ─── POST handlers ────────────────────────────────────────────────────────────

async function addStudent(req: NextRequest) {
  await ensureStudents()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fullName, dob, gender, currentClass, applyingForClass, academicYear, bloodGroup, currentSchool, specialNeeds, classLevel, boardPreference } = await req.json()
  const row = await db.query(
    `INSERT INTO students (parent_id,full_name,dob,gender,current_class,applying_for_class,academic_year,blood_group,current_school,special_needs,class_level,board_preference)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, parent_id AS "parentId", full_name AS "fullName", dob, gender, current_class AS "currentClass", applying_for_class AS "applyingForClass", academic_year AS "academicYear", blood_group AS "bloodGroup", current_school AS "currentSchool", special_needs AS "specialNeeds", class_level AS "classLevel", board_preference AS "boardPreference", created_at AS "createdAt"`,
    [userId, fullName||null, dob||null, gender||null, currentClass||classLevel||null, applyingForClass||null, academicYear||null, bloodGroup||null, currentSchool||null, specialNeeds||null, classLevel||currentClass||null, boardPreference||null]
  )
  return NextResponse.json(row.rows[0])
}

async function saveParentProfile(req: NextRequest) {
  await ensureParentProfiles()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fullName, city, state, locality, pincode, occupation, annualIncomeRange, religion, budgetMin, budgetMax, howDidYouHear } = await req.json()
  await db.query(
    `INSERT INTO parent_profiles (user_id,full_name,city,state,locality,pincode,occupation,income_range,religion,budget_min,budget_max,how_did_you_hear,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (user_id) DO UPDATE SET full_name=$2,city=$3,state=$4,locality=$5,pincode=$6,occupation=$7,income_range=$8,religion=$9,budget_min=$10,budget_max=$11,how_did_you_hear=$12,updated_at=NOW()`,
    [userId, fullName, city||null, state||null, locality||null, pincode||null, occupation||null, annualIncomeRange||null, religion||null, budgetMin||null, budgetMax||null, howDidYouHear||null]
  )
  return NextResponse.json({ success: true })
}

async function bookCounselling(req: NextRequest) {
  await ensureCounselling()
  const body = await req.json()
  const { name, phone, email, city, query } = body
  await db.query(`INSERT INTO counselling_requests (name,phone,email,city,query) VALUES ($1,$2,$3,$4,$5)`, [name, phone, email||null, city||null, query||null])
  await sendCounsellingEmail({ name, phone, email, city, query })
  return NextResponse.json({ success: true, message: 'Booking received!' })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'applications':    return await getApplications(req)
      case 'students':        return await getStudents(req)
      case 'profile':         return await getParentProfile(req)
      case 'saved-schools':   return await getSavedSchools(req)
      case 'recommendations': return await getRecommendations(req)
      case 'lead-credits':    return await getLeadCredits(req)
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    console.error(`[parent:${action}]`, e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'students':          return await addStudent(req)
      case 'profile':           return await saveParentProfile(req)
      case 'book-counselling':  return await bookCounselling(req)
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    console.error(`[parent POST:${action}]`, e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
