export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/dashboard-stats
 * Returns summary stats for the authenticated school admin's dashboard.
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

    const school = await db.query(
      'SELECT id, name, logo_url, city, state, board, profile_completed, rating FROM schools WHERE admin_user_id=$1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!school.rows.length) {
      return NextResponse.json({
        totalLeads: 0,
        newLeadsToday: 0,
        totalApplications: 0,
        avgRating: 0,
        profileViews: 0,
        credits: 0,
        profileCompleteness: 0,
      })
    }

    const { id: schoolId, name: schoolName, logo_url: schoolLogo, city: schoolCity, state: schoolState, board: schoolBoard, profile_completed, rating } = school.rows[0]

    const [leads, newLeads, apps, credits, reviews] = await Promise.all([
      db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [schoolId])
        .catch(() => ({ rows: [{ count: 0 }] })),
      db.query(
        `SELECT COUNT(*) FROM leads WHERE school_id=$1 AND created_at >= CURRENT_DATE`,
        [schoolId]
      ).catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) FROM applications WHERE school_id=$1', [schoolId])
        .catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT credits FROM lead_credits WHERE school_id=$1', [schoolId])
        .catch(() => ({ rows: [] })),
      db.query('SELECT AVG(rating) as avg FROM reviews WHERE school_id=$1', [schoolId])
        .catch(() => ({ rows: [{ avg: null }] })),
    ])

    // Compute a simple profile completeness score (0–100)
    const schoolRow = school.rows[0]
    const fields = [
      'name', 'description', 'school_type', 'board', 'city', 'state',
      'phone', 'email', 'address_line1', 'logo_url', 'principal_name',
      'monthly_fee_min', 'classes_from', 'classes_to',
    ]
    // Re-fetch full row for completeness check
    const fullRow = await db.query('SELECT * FROM schools WHERE id=$1', [schoolId])
      .catch(() => ({ rows: [schoolRow] }))
    const row = fullRow.rows[0] || schoolRow
    const filled = fields.filter(f => {
      const v = row[f]
      if (Array.isArray(v)) return v.length > 0
      return v !== null && v !== undefined && v !== ''
    }).length
    const profileCompleteness = Math.round((filled / fields.length) * 100)

    return NextResponse.json({
      totalLeads: Number(leads.rows[0].count),
      newLeadsToday: Number(newLeads.rows[0].count),
      totalApplications: Number(apps.rows[0].count),
      avgRating: reviews.rows[0]?.avg ? parseFloat(Number(reviews.rows[0].avg).toFixed(1)) : (rating ? parseFloat(Number(rating).toFixed(1)) : 0),
      profileViews: 0,
      credits: credits.rows[0]?.credits ?? 0,
      profileCompleteness,
      schoolName:  schoolName  || null,
      schoolLogo:  schoolLogo  || null,
      schoolCity:  schoolCity  || null,
      schoolState: schoolState || null,
      schoolBoard: Array.isArray(schoolBoard) ? schoolBoard : [],
    })
  } catch (e: any) {
    console.error('[schools/me/dashboard-stats GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
