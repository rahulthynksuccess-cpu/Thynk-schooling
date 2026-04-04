export const dynamic = 'force-dynamic'
/**
 * GET /api/lead-credits
 * Returns lead credit balance for the authenticated school admin.
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

export async function GET(req: NextRequest) {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS lead_credits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID UNIQUE,
        credits INTEGER DEFAULT 0,
        total_credits INTEGER DEFAULT 0,
        used_credits INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {})
    // Add missing columns to existing tables
    await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`).catch(() => {})

    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
    if (!school.rows.length) {
      return NextResponse.json({ totalCredits: 0, usedCredits: 0, availableCredits: 0, expiresAt: null })
    }

    const schoolId = school.rows[0].id
    const cred = await db.query('SELECT * FROM lead_credits WHERE school_id=$1', [schoolId])
    if (!cred.rows.length) {
      return NextResponse.json({ totalCredits: 0, usedCredits: 0, availableCredits: 0, expiresAt: null })
    }

    const row = cred.rows[0]
    const totalCredits = row.total_credits ?? row.credits ?? 0
    const usedCredits = row.used_credits ?? 0
    const availableCredits = row.credits ?? Math.max(0, totalCredits - usedCredits)

    return NextResponse.json({
      totalCredits,
      usedCredits,
      availableCredits,
      expiresAt: row.expires_at || null,
    })
  } catch (e: any) {
    console.error('[lead-credits GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
