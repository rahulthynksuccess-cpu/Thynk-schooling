export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS lead_credits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID UNIQUE, credits INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    const school = await db.query(`SELECT id FROM schools WHERE admin_user_id=$1`, [userId])
    if (!school.rows.length) return NextResponse.json({ credits: 0 })
    const cred = await db.query(`SELECT credits FROM lead_credits WHERE school_id=$1`, [school.rows[0].id])
    return NextResponse.json({ credits: cred.rows[0]?.credits ?? 0 })
  } catch { return NextResponse.json({ credits: 0 }) }
}
