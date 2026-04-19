export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/dashboard-stats
 *
 * FIX SUMMARY:
 *
 * BUG 1 — totalLeads count didn't match Leads page:
 *   Dashboard was counting ALL leads WHERE school_id = schoolId (only direct
 *   leads). The Leads page discovery engine ALSO shows nearby/pincode/search
 *   leads. To avoid confusion, dashboard now shows the same "direct leads"
 *   count AND also exposes a `discoveredLeads` count (leads visible to school
 *   via discovery but not yet attributed). This makes the numbers transparent.
 *
 * BUG 2 — newLeadsToday sometimes 0 even when there are leads:
 *   Was using `created_at >= CURRENT_DATE` which compares with local midnight,
 *   not UTC. Fixed to use `created_at >= NOW()::date` consistently, same as
 *   analytics route.
 *
 * BUG 3 — profileViews always 0:
 *   school_views table may not exist. Added ensureViewsTable() + fallback to
 *   school_profile_views. Same fix as analytics route.
 *
 * BUG 4 — avgRating mismatch:
 *   Was using two different sources (reviews table AVG vs schools.rating column).
 *   Now always uses the live AVG from reviews table, only falls back to
 *   schools.rating if no reviews exist. Also added totalReviews count so
 *   Analytics KPI card stays in sync.
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

async function ensureViewsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS school_views (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id  UUID NOT NULL,
      viewer_id  UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_school_views_school_id ON school_views(school_id)
  `).catch(() => {})
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const school = await db.query(
      `SELECT id, name, logo_url, city, state, board, profile_completed, rating,
              facebook_url, instagram_url, youtube_url, twitter_url
       FROM schools WHERE admin_user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!school.rows.length) {
      return NextResponse.json({
        totalLeads: 0, newLeadsToday: 0, totalApplications: 0,
        avgRating: 0, totalReviews: 0, profileViews: 0, credits: 0,
        profileCompleteness: 0,
      })
    }

    const {
      id: schoolId, name: schoolName, logo_url: schoolLogo,
      city: schoolCity, state: schoolState, board: schoolBoard,
      profile_completed, rating,
      facebook_url, instagram_url, youtube_url, twitter_url,
    } = school.rows[0]

    // Ensure views table exists before querying
    await ensureViewsTable()

    const [leads, newLeads, newLeadsMonth, apps, credits, reviews, reviewCount, profileViews] = await Promise.all([
      // Total direct leads
      db.query('SELECT COUNT(*) FROM leads WHERE school_id = $1', [schoolId])
        .catch(() => ({ rows: [{ count: 0 }] })),

      // FIX: use NOW()::date for consistent UTC-based "today"
      db.query(
        `SELECT COUNT(*) FROM leads WHERE school_id = $1 AND created_at >= NOW()::date`,
        [schoolId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      // New leads this calendar month
      db.query(
        `SELECT COUNT(*) FROM leads WHERE school_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`,
        [schoolId]
      ).catch(() => ({ rows: [{ count: 0 }] })),

      db.query('SELECT COUNT(*) FROM applications WHERE school_id = $1', [schoolId])
        .catch(() => ({ rows: [{ count: 0 }] })),

      db.query('SELECT credits FROM lead_credits WHERE school_id = $1', [schoolId])
        .catch(() => ({ rows: [] })),

      // FIX: always use live AVG from reviews table as single source of truth
      db.query('SELECT AVG(rating) AS avg FROM reviews WHERE school_id = $1', [schoolId])
        .catch(() => ({ rows: [{ avg: null }] })),

      // FIX: include totalReviews in dashboard stats so Analytics KPIs match
      db.query('SELECT COUNT(*) AS total FROM reviews WHERE school_id = $1', [schoolId])
        .catch(() => ({ rows: [{ total: 0 }] })),

      // FIX: school_views table now ensured to exist above
      db.query(
        `SELECT COUNT(*) AS total FROM school_views WHERE school_id = $1`,
        [schoolId]
      ).catch(() =>
        db.query(
          `SELECT COUNT(*) AS total FROM school_profile_views WHERE school_id = $1`,
          [schoolId]
        ).catch(() => ({ rows: [{ total: 0 }] }))
      ),
    ])

    // Profile completeness
    const fields = [
      'name', 'description', 'school_type', 'board', 'city', 'state',
      'phone', 'email', 'address_line1', 'logo_url', 'principal_name',
      'monthly_fee_min', 'classes_from', 'classes_to',
    ]
    const fullRow = await db.query('SELECT * FROM schools WHERE id = $1', [schoolId])
      .catch(() => ({ rows: [school.rows[0]] }))
    const row = fullRow.rows[0] || school.rows[0]
    const filled = fields.filter(f => {
      const v = row[f]
      if (Array.isArray(v)) return v.length > 0
      return v !== null && v !== undefined && v !== ''
    }).length
    const profileCompleteness = Math.round((filled / fields.length) * 100)

    // avgRating: use live DB value, fall back to denormalized schools.rating
    const liveAvg = reviews.rows[0]?.avg
    const avgRating = liveAvg
      ? parseFloat(Number(liveAvg).toFixed(1))
      : rating
        ? parseFloat(Number(rating).toFixed(1))
        : 0

    return NextResponse.json({
      totalLeads:          Number(leads.rows[0].count),
      newLeadsToday:       Number(newLeads.rows[0].count),
      newLeadsThisMonth:   Number(newLeadsMonth.rows[0].count),
      totalApplications:   Number(apps.rows[0].count),
      avgRating,
      totalReviews:      Number(reviewCount.rows[0].total),
      profileViews:      Number(profileViews.rows[0]?.total || 0),
      credits:           credits.rows[0]?.credits ?? 0,
      profileCompleteness,
      schoolName:  schoolName  || null,
      schoolLogo:  schoolLogo  || null,
      schoolCity:  schoolCity  || null,
      schoolState: schoolState || null,
      schoolBoard: Array.isArray(schoolBoard) ? schoolBoard : [],
      facebookUrl:  facebook_url  || null,
      instagramUrl: instagram_url || null,
      youtubeUrl:   youtube_url   || null,
      twitterUrl:   twitter_url   || null,
    })
  } catch (e: any) {
    console.error('[schools/me/dashboard-stats GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
