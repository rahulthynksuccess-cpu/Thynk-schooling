export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/analytics?days=30
 * Returns full analytics data for the school analytics dashboard.
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

const EMPTY_RESPONSE = {
  leads: [], applications: [],
  classWise: [], monthly: [], dayOfWeek: [],
  sourceBreakdown: [], statusBreakdown: [],
  totals: { leads: 0, applications: 0, profileViews: 0, conversion: 0 },
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    // Clamp to integer — used as a template literal (safe: not user-controlled string)
    const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)))

    const schoolRow = await db.query(
      'SELECT id FROM schools WHERE admin_user_id = $1 LIMIT 1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!schoolRow.rows.length) return NextResponse.json(EMPTY_RESPONSE)

    const schoolId = schoolRow.rows[0].id

    // ─────────────────────────────────────────────────────────────────────────
    // BUG FIX 1: ($2 || ' days')::INTERVAL does NOT work in pg parameterized
    // queries. PostgreSQL binds $2 as a value, not a string to concatenate
    // before casting. All time-range queries were silently failing / caught.
    // Fix: interpolate `days` directly as a numeric literal in the SQL string.
    // This is safe because `days` is already Math.min/max clamped to an integer.
    // ─────────────────────────────────────────────────────────────────────────

    const [
      leads,
      apps,
      classWise,
      monthly,
      dayOfWeek,
      sourceBreakdown,
      statusBreakdown,
      totalLeadsRow,
      totalAppsRow,
      profileViewsRow,
    ] = await Promise.all([

      // ── Daily leads timeline — gap-filled ──────────────────────────────────
      // BUG FIX 4: was missing days with 0 leads. Now uses generate_series so
      // every day in the range has a row, giving a continuous X-axis.
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(l.id), 0) AS count
        FROM generate_series(
          (NOW() - INTERVAL '${days} days')::date,
          NOW()::date,
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN leads l
          ON DATE(l.created_at) = gs.day
          AND l.school_id = $1
        GROUP BY gs.day
        ORDER BY gs.day
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Daily applications timeline — gap-filled ───────────────────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(a.id), 0) AS count
        FROM generate_series(
          (NOW() - INTERVAL '${days} days')::date,
          NOW()::date,
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN applications a
          ON DATE(a.created_at) = gs.day
          AND a.school_id = $1
        GROUP BY gs.day
        ORDER BY gs.day
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Class-wise lead breakdown ──────────────────────────────────────────
      // NOTE: rename `class_grade` below if your column has a different name.
      db.query(`
        SELECT
          COALESCE(class_grade, 'Unknown') AS class_group,
          COUNT(*) AS count
        FROM leads
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY class_group
        ORDER BY count DESC
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Monthly lead + application counts — last 6 months ─────────────────
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', gs.m), 'Mon YY') AS month,
          COALESCE(l.leads, 0)  AS leads,
          COALESCE(a.apps,  0)  AS applications
        FROM generate_series(
          DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
          DATE_TRUNC('month', NOW()),
          INTERVAL '1 month'
        ) AS gs(m)
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*) AS leads
          FROM leads WHERE school_id = $1 GROUP BY m
        ) l ON l.m = gs.m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*) AS apps
          FROM applications WHERE school_id = $1 GROUP BY m
        ) a ON a.m = gs.m
        ORDER BY gs.m
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Day-of-week activity ───────────────────────────────────────────────
      db.query(`
        SELECT
          EXTRACT(DOW FROM created_at)::int AS dow,
          COUNT(*) AS count
        FROM leads
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY dow
        ORDER BY dow
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Lead source breakdown ──────────────────────────────────────────────
      // NOTE: rename `source` if your column has a different name.
      db.query(`
        SELECT
          COALESCE(source, 'Unknown') AS source,
          COUNT(*) AS count
        FROM leads
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY source
        ORDER BY count DESC
        LIMIT 6
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Application status breakdown ───────────────────────────────────────
      db.query(`
        SELECT
          COALESCE(status, 'pending') AS status,
          COUNT(*) AS count
        FROM applications
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY status
        ORDER BY count DESC
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── BUG FIX 3a: total leads — isolated so other totals survive if this fails ─
      db.query(`
        SELECT COUNT(*) AS total
        FROM leads
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] })),

      // ── BUG FIX 3b: total applications — isolated ─────────────────────────
      db.query(`
        SELECT COUNT(*) AS total
        FROM applications
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] })),

      // ── BUG FIX 3c: profile views — isolated, safe fallback if table missing ─
      // Replace `school_views` with the actual table name in your schema.
      // If the table doesn't exist this catch returns 0 without affecting other KPIs.
      db.query(`
        SELECT COUNT(*) AS total
        FROM school_views
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] })),
    ])

    // ── DOW: fill all 7 days, missing days = 0 ────────────────────────────
    const dowFull = Array(7).fill(0)
    dayOfWeek.rows.forEach((r: any) => { dowFull[Number(r.dow)] = Number(r.count) })

    const totalLeads = Number(totalLeadsRow.rows[0]?.total || 0)
    const totalApps  = Number(totalAppsRow.rows[0]?.total  || 0)
    const profileViews = Number(profileViewsRow.rows[0]?.total || 0)

    return NextResponse.json({
      leads: leads.rows.map((r: any) => ({
        day:   String(r.day).slice(0, 10),
        count: Number(r.count),
      })),
      applications: apps.rows.map((r: any) => ({
        day:   String(r.day).slice(0, 10),
        count: Number(r.count),
      })),
      classWise: classWise.rows.map((r: any) => ({
        label: r.class_group,
        count: Number(r.count),
      })),
      monthly: monthly.rows.map((r: any) => ({
        month:        r.month,
        leads:        Number(r.leads),
        applications: Number(r.applications),
      })),
      dayOfWeek: dowFull,
      sourceBreakdown: sourceBreakdown.rows.map((r: any) => ({
        source: r.source,
        count:  Number(r.count),
      })),
      statusBreakdown: statusBreakdown.rows.map((r: any) => ({
        status: r.status,
        count:  Number(r.count),
      })),
      totals: {
        leads:        totalLeads,
        applications: totalApps,
        profileViews,
        conversion: totalLeads > 0
          ? Math.round((totalApps / totalLeads) * 100)
          : 0,
      },
    })
  } catch (e: any) {
    console.error('[schools/me/analytics GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
