export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/analytics?days=30
 * Returns full analytics data for the school's analytics dashboard.
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

    const url  = new URL(req.url)
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 30)))

    const schoolRow = await db.query(
      'SELECT id FROM schools WHERE admin_user_id=$1 LIMIT 1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!schoolRow.rows.length) {
      return NextResponse.json({
        leads: [], applications: [],
        classWise: [], monthly: [], dayOfWeek: [],
        sourceBreakdown: [], statusBreakdown: [],
        totals: { leads: 0, applications: 0, profileViews: 0, conversion: 0 },
      })
    }

    const schoolId = schoolRow.rows[0].id

    const [
      leads, apps, classWise, monthly,
      dayOfWeek, sourceBreakdown, statusBreakdown, totals,
    ] = await Promise.all([

      // Daily leads timeline
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
           FROM leads
          WHERE school_id = $1
            AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          GROUP BY day ORDER BY day`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Daily applications timeline
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
           FROM applications
          WHERE school_id = $1
            AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          GROUP BY day ORDER BY day`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Class-wise lead breakdown — adjust `class_grade` to your actual column name
      db.query(
        `SELECT
           COALESCE(l.class_grade, 'Unknown') AS class_group,
           COUNT(*) AS count
         FROM leads l
         WHERE l.school_id = $1
           AND l.created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY class_group
         ORDER BY count DESC`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Monthly lead + application counts — last 6 months
      db.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', gs.m), 'Mon YY') AS month,
           COALESCE(l.leads, 0)    AS leads,
           COALESCE(a.apps, 0)     AS applications
         FROM generate_series(
           DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
           DATE_TRUNC('month', NOW()),
           INTERVAL '1 month'
         ) AS gs(m)
         LEFT JOIN (
           SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*) AS leads
             FROM leads WHERE school_id=$1 GROUP BY m
         ) l ON l.m = gs.m
         LEFT JOIN (
           SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*) AS apps
             FROM applications WHERE school_id=$1 GROUP BY m
         ) a ON a.m = gs.m
         ORDER BY gs.m`,
        [schoolId]
      ).catch(() => ({ rows: [] })),

      // Day-of-week activity (0=Sun … 6=Sat)
      db.query(
        `SELECT
           EXTRACT(DOW FROM created_at)::int AS dow,
           COUNT(*) AS count
         FROM leads
         WHERE school_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY dow ORDER BY dow`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Lead source breakdown — adjust `source` to your actual column name
      db.query(
        `SELECT
           COALESCE(source, 'Unknown') AS source,
           COUNT(*) AS count
         FROM leads
         WHERE school_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY source
         ORDER BY count DESC
         LIMIT 6`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Application status breakdown
      db.query(
        `SELECT
           COALESCE(status, 'pending') AS status,
           COUNT(*) AS count
         FROM applications
         WHERE school_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY status
         ORDER BY count DESC`,
        [schoolId, days]
      ).catch(() => ({ rows: [] })),

      // Totals for KPI strip
      // Replace `school_views` with the actual table/column in your schema
      db.query(
        `SELECT
           (SELECT COUNT(*) FROM leads        WHERE school_id=$1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL) AS total_leads,
           (SELECT COUNT(*) FROM applications  WHERE school_id=$1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL) AS total_apps,
           (SELECT COUNT(*) FROM school_views  WHERE school_id=$1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL) AS profile_views`,
        [schoolId, days]
      ).catch(() => ({ rows: [{ total_leads: 0, total_apps: 0, profile_views: 0 }] })),
    ])

    const t          = totals.rows[0] || {}
    const totalLeads = Number(t.total_leads  || 0)
    const totalApps  = Number(t.total_apps   || 0)

    // Build full DOW array [Sun … Sat], filling any missing days with 0
    const dowFull = Array(7).fill(0)
    dayOfWeek.rows.forEach((r: any) => { dowFull[Number(r.dow)] = Number(r.count) })

    return NextResponse.json({
      leads:           leads.rows.map((r: any) => ({ day: String(r.day).slice(0, 10), count: Number(r.count) })),
      applications:    apps.rows.map((r: any)  => ({ day: String(r.day).slice(0, 10), count: Number(r.count) })),
      classWise:       classWise.rows.map((r: any) => ({ label: r.class_group, count: Number(r.count) })),
      monthly:         monthly.rows.map((r: any)   => ({ month: r.month, leads: Number(r.leads), applications: Number(r.applications) })),
      dayOfWeek:       dowFull,
      sourceBreakdown: sourceBreakdown.rows.map((r: any) => ({ source: r.source, count: Number(r.count) })),
      statusBreakdown: statusBreakdown.rows.map((r: any) => ({ status: r.status, count: Number(r.count) })),
      totals: {
        leads:        totalLeads,
        applications: totalApps,
        profileViews: Number(t.profile_views || 0),
        conversion:   totalLeads > 0 ? Math.round((totalApps / totalLeads) * 100) : 0,
      },
    })
  } catch (e: any) {
    console.error('[schools/me/analytics GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
