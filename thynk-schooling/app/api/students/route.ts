export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  // Create table with all fields
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id       UUID,
      full_name       VARCHAR(200),
      dob             DATE,
      gender          VARCHAR(50),
      current_class   VARCHAR(50),
      applying_for_class VARCHAR(50),
      academic_year   VARCHAR(50),
      blood_group     VARCHAR(20),
      current_school  VARCHAR(200),
      special_needs   TEXT,
      class_level     VARCHAR(50),
      board_preference VARCHAR(100),
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})

  // Safe migrations — add missing columns to existing tables
  const cols = [
    "ADD COLUMN IF NOT EXISTS dob DATE",
    "ADD COLUMN IF NOT EXISTS gender VARCHAR(50)",
    "ADD COLUMN IF NOT EXISTS current_class VARCHAR(50)",
    "ADD COLUMN IF NOT EXISTS applying_for_class VARCHAR(50)",
    "ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50)",
    "ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20)",
    "ADD COLUMN IF NOT EXISTS current_school VARCHAR(200)",
    "ADD COLUMN IF NOT EXISTS special_needs TEXT",
  ]
  for (const col of cols) {
    await db.query(`ALTER TABLE students ${col}`).catch(()=>{})
  }
}

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') ||
                  req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json([])
    const rows = await db.query(
      `SELECT
         id,
         parent_id        AS "parentId",
         full_name        AS "fullName",
         dob,
         gender,
         current_class    AS "currentClass",
         applying_for_class AS "applyingForClass",
         academic_year    AS "academicYear",
         blood_group      AS "bloodGroup",
         current_school   AS "currentSchool",
         special_needs    AS "specialNeeds",
         class_level      AS "classLevel",
         board_preference AS "boardPreference",
         created_at       AS "createdAt"
       FROM students
       WHERE parent_id = $1
       ORDER BY created_at`,
      [userId]
    )
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      fullName, dob, gender,
      currentClass, applyingForClass, academicYear,
      bloodGroup, currentSchool, specialNeeds,
      // legacy fields from add-child form
      classLevel, boardPreference,
    } = await req.json()

    const row = await db.query(
      `INSERT INTO students (
         parent_id, full_name, dob, gender,
         current_class, applying_for_class, academic_year,
         blood_group, current_school, special_needs,
         class_level, board_preference
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING
         id, parent_id AS "parentId",
         full_name AS "fullName", dob, gender,
         current_class AS "currentClass",
         applying_for_class AS "applyingForClass",
         academic_year AS "academicYear",
         blood_group AS "bloodGroup",
         current_school AS "currentSchool",
         special_needs AS "specialNeeds",
         class_level AS "classLevel",
         board_preference AS "boardPreference",
         created_at AS "createdAt"`,
      [
        userId,
        fullName || null,
        dob || null,
        gender || null,
        currentClass || classLevel || null,
        applyingForClass || null,
        academicYear || null,
        bloodGroup || null,
        currentSchool || null,
        specialNeeds || null,
        classLevel || currentClass || null,
        boardPreference || null,
      ]
    )
    return NextResponse.json(row.rows[0])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
