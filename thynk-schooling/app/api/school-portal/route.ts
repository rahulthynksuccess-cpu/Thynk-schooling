export const dynamic = 'force-dynamic'
/**
 * GET /api/school-portal?action=applications
 *
 * Returns applications for the school admin.
 * Schema is managed via supabase-migration.sql — zero DDL here.
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
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url    = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'applications') {
      const schoolRes = await db.query(
        'SELECT id FROM schools WHERE admin_user_id = $1 LIMIT 1',
        [userId]
      ).catch(() => ({ rows: [] }))

      if (!schoolRes.rows.length) {
        return NextResponse.json({ applications: [], data: [] })
      }
      const schoolId = schoolRes.rows[0].id
      const limit = Math.min(100, Number(url.searchParams.get('limit') || 50))

      const rows = await db.query(
        `SELECT
           a.id,
           a.status,
           a.child_name,
           a.class_applying_for,
           a.created_at,
           COALESCE(u.full_name, 'Unknown Parent') AS parent_name,
           u.phone AS parent_phone,
           u.email AS parent_email
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
