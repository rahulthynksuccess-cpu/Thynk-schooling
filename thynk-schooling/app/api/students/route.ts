export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID, full_name VARCHAR(200), class_level VARCHAR(50),
      board_preference VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
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

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const rows = await db.query(`SELECT * FROM students WHERE parent_id=$1 ORDER BY created_at`, [userId])
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const { fullName, classLevel, boardPreference } = await req.json()
    const row = await db.query(
      `INSERT INTO students (parent_id,full_name,class_level,board_preference) VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, fullName, classLevel||null, boardPreference||null]
    )
    return NextResponse.json(row.rows[0])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
