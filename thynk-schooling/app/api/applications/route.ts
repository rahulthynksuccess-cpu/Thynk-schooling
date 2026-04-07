export const dynamic = 'force-dynamic'
/**
 * GET /api/applications — proxy to /api/parent?action=applications
 * Fetches applications for the logged-in parent, joined with school name & logo.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    // Ensure applications table has all needed columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id           UUID,
        school_id           UUID,
        lead_id             UUID,
        status              VARCHAR(50) DEFAULT 'submitted',
        child_name          VARCHAR(200),
        class_applying_for  VARCHAR(50),
        message             TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {})
    await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`).catch(() => {})
    await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS lead_id UUID`).catch(() => {})
    await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS child_name VARCHAR(200)`).catch(() => {})
    await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS class_applying_for VARCHAR(50)`).catch(() => {})

    const userId = getUserId(req)
    if (!userId) return NextResponse.json([], { status: 200 })

    const url = new URL(req.url)
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 10))

    const rows = await db.query(
      `SELECT
         a.id, a.status, a.child_name, a.class_applying_for, a.created_at,
         s.name  AS school_name,
         s.logo_url AS school_logo,
         s.city  AS school_city,
         s.slug  AS school_slug
       FROM applications a
       LEFT JOIN schools s ON s.id = a.school_id
       WHERE a.parent_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [userId, limit]
    )

    return NextResponse.json(rows.rows)
  } catch (e: any) {
    console.error('[/api/applications GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
