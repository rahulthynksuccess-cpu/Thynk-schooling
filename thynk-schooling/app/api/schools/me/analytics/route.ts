export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/analytics?days=30
 * Returns lead and application counts grouped by day for the school's analytics chart.
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
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 30)))

    const school = await db.query(
      'SELECT id FROM schools WHERE admin_user_id=$1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!school.rows.length) {
      return NextResponse.json({ leads: [], applications: [] })
    }

    const schoolId = school.rows[0].id

    const [leads, apps] = await Promise.all([
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
           FROM leads
          WHERE school_id = $1
            AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          GROUP BY day
          ORDER BY day`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
           FROM applications
          WHERE school_id = $1
            AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          GROUP BY day
          ORDER BY day`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),
    ])

    return NextResponse.json({
      leads: leads.rows,
      applications: apps.rows,
    })
  } catch (e: any) {
    console.error('[schools/me/analytics GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
