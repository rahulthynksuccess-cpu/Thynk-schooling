export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS parent_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE, full_name VARCHAR(200), city VARCHAR(100),
      occupation VARCHAR(200), income_range VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})
}

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') ||
                  req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const { fullName, city, occupation, incomeRange } = await req.json()
    await db.query(
      `INSERT INTO parent_profiles (user_id,full_name,city,occupation,income_range)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET full_name=$2,city=$3,occupation=$4,income_range=$5`,
      [userId, fullName, city||null, occupation||null, incomeRange||null]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
