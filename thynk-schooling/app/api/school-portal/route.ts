export const dynamic = 'force-dynamic'
/**
 * GET /api/school-portal?action=applications
 * Returns applications for the school admin (not the parent).
 *
 * FIX SUMMARY:
 *
 * BUG 1 — Applications page was fetching /api/school-portal?action=applications
 *   but the existing GET handler (route__3_.ts) was written for PARENTS
 *   (fetches applications WHERE parent_id = userId). School admins need
 *   applications WHERE school_id matches their school. This is a completely
 *   wrong query — school admins were seeing 0 applications because they were
 *   being filtered as parents.
 *
 * BUG 2 — parent_name column doesn't exist on applications table.
 *   The school applications page tried to read a.parent_name but the column
 *   is not in the schema. Fixed: JOIN to users table to get parent name via
 *   applications.parent_id → users.full_name.
 *
 * BUG 3 — Duplicate header.get() call in getUserId (dead code, harmless but fixed).
 *
 * ROUTING NOTE: This file should live at app/api/school-portal/route.ts.
 *   The existing route__3_.ts (at /api/applications) serves parents — keep that
 *   file as-is. This new file is the school-portal endpoint.
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

async function ensureTables() {
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
  for (const col of [
    'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
    'ADD COLUMN IF NOT EXISTS lead_id UUID',
    'ADD COLUMN IF NOT EXISTS child_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS class_applying_for VARCHAR(50)',
  ]) await db.query(`ALTER TABLE applications ${col}`).catch(() => {})
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables()

    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url    = new URL(req.url)
    const action = url.searchParams.get('action')

    // ── School admin: list applications for their school ──────────────────────
    if (action === 'applications') {
      // FIX: look up the school for this admin, then query by school_id
      const schoolRes = await db.query(
        'SELECT id FROM schools WHERE admin_user_id = $1 LIMIT 1',
        [userId]
      ).catch(() => ({ rows: [] }))

      if (!schoolRes.rows.length) {
        return NextResponse.json({ applications: [], data: [] })
      }
      const schoolId = schoolRes.rows[0].id

      const limit = Math.min(100, Number(url.searchParams.get('limit') || 50))

      // FIX: query by school_id, JOIN users for parent name
      const rows = await db.query(
        `SELECT
           a.id,
           a.status,
           a.child_name,
           a.class_applying_for,
           a.created_at,
           COALESCE(u.full_name, u.name, 'Unknown Parent') AS parent_name,
           u.phone  AS parent_phone,
           u.email  AS parent_email
         FROM applications a
         LEFT JOIN users u ON u.id = a.parent_id
         WHERE a.school_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [schoolId, limit]
      ).catch(() => ({ rows: [] }))

      return NextResponse.json({ data: rows.rows, applications: rows.rows, total: rows.rows.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[/api/school-portal GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
