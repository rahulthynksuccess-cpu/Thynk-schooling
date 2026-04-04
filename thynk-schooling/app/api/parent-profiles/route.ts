export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS parent_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE, full_name VARCHAR(200), city VARCHAR(100),
      state VARCHAR(100), locality VARCHAR(200),
      occupation VARCHAR(200), income_range VARCHAR(100),
      religion VARCHAR(100), budget_min INTEGER, budget_max INTEGER,
      how_did_you_hear VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})
  // Add columns if they don't exist (safe migration)
  for (const col of [
    "ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS locality VARCHAR(200)",
    "ADD COLUMN IF NOT EXISTS religion VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS budget_min INTEGER",
    "ADD COLUMN IF NOT EXISTS budget_max INTEGER",
    "ADD COLUMN IF NOT EXISTS how_did_you_hear VARCHAR(200)",
    "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
  ]) {
    await db.query(`ALTER TABLE parent_profiles ${col}`).catch(()=>{})
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const row = await db.query(
      `SELECT id, user_id AS "userId", full_name AS "fullName", city, state, locality,
              occupation, income_range AS "incomeRange", religion,
              budget_min AS "budgetMin", budget_max AS "budgetMax",
              how_did_you_hear AS "howDidYouHear", created_at AS "createdAt"
       FROM parent_profiles WHERE user_id=$1`, [userId]
    )
    return NextResponse.json(row.rows[0] || null)
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { fullName, city, state, locality, occupation, annualIncomeRange, religion, budgetMin, budgetMax, howDidYouHear } = await req.json()
    await db.query(
      `INSERT INTO parent_profiles (user_id,full_name,city,state,locality,occupation,income_range,religion,budget_min,budget_max,how_did_you_hear,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         full_name=$2, city=$3, state=$4, locality=$5, occupation=$6,
         income_range=$7, religion=$8, budget_min=$9, budget_max=$10,
         how_did_you_hear=$11, updated_at=NOW()`,
      [userId, fullName, city||null, state||null, locality||null, occupation||null, annualIncomeRange||null, religion||null, budgetMin||null, budgetMax||null, howDidYouHear||null]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
