export const dynamic = 'force-dynamic'
/**
 * GET /api/schools/me/analytics?days=30
 *
 * FIX SUMMARY (all data-mismatch issues):
 *
 * BUG 1 — Analytics showing 0 leads while Leads page shows 1:
 *   The analytics query counts ALL leads WHERE school_id = $1.
 *   The Leads page counts leads via the discovery engine which includes
 *   DIRECT leads (school_id = $1) PLUS discovered leads (school_id != $1 but
 *   nearby/pincode/search). When a school unlocks a discovered lead,
 *   purchased_by = schoolId but school_id still points to the original school.
 *   FIX: totalLeadsRow and the daily timeline now also count
 *   leads WHERE is_purchased = true AND purchased_by = $1
 *
 * BUG 2 — Profile views always 0:
 *   school_views table query was failing silently because the table likely
 *   doesn't exist. Fixed: ensureViewsTable() + fallback to school_profile_views.
 *
 * BUG 3 — classWise always empty:
 *   Column name was assumed to be `class_grade` but leads table uses
 *   `class_applying_for`. Fixed to use correct column name.
 *
 * BUG 4 — sourceBreakdown always empty:
 *   Column name `source` is correct but the query had the interval bug.
 *   Fixed by interval interpolation fix.
 *
 * BUG 5 — dayOfWeek always zeros:
 *   Same root cause — interval bug. Fixed.
 *
 * BUG 6 — Monthly chart empty:
 *   Same root cause. Fixed.
 *
 * BUG 7 — Totals (KPIs) showing 0:
 *   Same root cause. Fixed.
 *
 * ROOT CAUSE of all "0 data" bugs:
 *   ($2 || ' days')::INTERVAL does NOT work in pg parameterized queries.
 *   PostgreSQL binds $2 as a value, not a string fragment before casting.
 *   All queries that used `$2` for the interval were silently returning 0 rows.
 *   Fix: interpolate `days` as a numeric literal (safe: already clamped to int).
 *
 * PERF FIX: ensureViewsTable() now runs only once per server process via a
 *   module-level flag instead of on every request.
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
  classWise: [], monthly: [], dayOfWeek: Array(7).fill(0),
  sourceBreakdown: [], statusBreakdown: [],
  totals: { leads: 0, applications: 0, profileViews: 0, conversion: 0 },
}

// ✅ FIX: module-level flag so ensureViewsTable only runs once per server process
let viewsTableEnsured = false

async function ensureViewsTable() {
  if (viewsTableEnsured) return
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
  viewsTableEnsured = true
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    // Safe integer — used as template literal, not user-controlled string
    const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)))

    const schoolRow = await db.query(
      'SELECT id FROM schools WHERE admin_user_id = $1 LIMIT 1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!schoolRow.rows.length) return NextResponse.json(EMPTY_RESPONSE)

    const schoolId = schoolRow.rows[0].id

    // Ensure views table exists before querying it
    await ensureViewsTable()

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
      // ✅ FIX: include discovered leads unlocked by this school (purchased_by = $1)
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
          AND (l.school_id = $1 OR (l.is_purchased = true AND l.purchased_by = $1))
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
      // FIX: was using `class_grade` — correct column is `class_applying_for`
      // ✅ FIX: include discovered leads
      db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(class_applying_for), ''), 'Unknown') AS class_group,
          COUNT(*) AS count
        FROM leads
        WHERE (school_id = $1 OR (is_purchased = true AND purchased_by = $1))
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY class_group
        ORDER BY count DESC
        LIMIT 10
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Monthly lead + application counts — last 6 months ─────────────────
      // ✅ FIX: include discovered leads in the monthly leads subquery
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
          FROM leads
          WHERE school_id = $1 OR (is_purchased = true AND purchased_by = $1)
          GROUP BY m
        ) l ON l.m = gs.m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*) AS apps
          FROM applications WHERE school_id = $1 GROUP BY m
        ) a ON a.m = gs.m
        ORDER BY gs.m
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Day-of-week activity ───────────────────────────────────────────────
      // ✅ FIX: include discovered leads
      db.query(`
        SELECT
          EXTRACT(DOW FROM created_at)::int AS dow,
          COUNT(*) AS count
        FROM leads
        WHERE (school_id = $1 OR (is_purchased = true AND purchased_by = $1))
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY dow
        ORDER BY dow
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Lead source breakdown ──────────────────────────────────────────────
      // ✅ FIX: include discovered leads
      db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(source), ''), 'Unknown') AS source,
          COUNT(*) AS count
        FROM leads
        WHERE (school_id = $1 OR (is_purchased = true AND purchased_by = $1))
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY source
        ORDER BY count DESC
        LIMIT 6
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Application status breakdown ───────────────────────────────────────
      db.query(`
        SELECT
          COALESCE(NULLIF(status, ''), 'pending') AS status,
          COUNT(*) AS count
        FROM applications
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY status
        ORDER BY count DESC
      `, [schoolId]).catch(() => ({ rows: [] })),

      // ── Total leads in window ──────────────────────────────────────────────
      // ✅ FIX: count direct leads + discovered leads unlocked by this school
      db.query(`
        SELECT COUNT(*) AS total
        FROM leads
        WHERE (school_id = $1 OR (is_purchased = true AND purchased_by = $1))
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] })),

      // ── Total applications in window ───────────────────────────────────────
      db.query(`
        SELECT COUNT(*) AS total
        FROM applications
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] })),

      // ── Profile views ──────────────────────────────────────────────────────
      // FIX: ensureViewsTable() called above so this no longer silently fails.
      db.query(`
        SELECT COUNT(*) AS total
        FROM school_views
        WHERE school_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `, [schoolId]).catch(() =>
        db.query(`
          SELECT COUNT(*) AS total
          FROM school_profile_views
          WHERE school_id = $1
            AND created_at >= NOW() - INTERVAL '${days} days'
        `, [schoolId]).catch(() => ({ rows: [{ total: 0 }] }))
      ),
    ])

    // ── DOW: fill all 7 days ───────────────────────────────────────────────
    const dowFull = Array(7).fill(0)
    dayOfWeek.rows.forEach((r: any) => { dowFull[Number(r.dow)] = Number(r.count) })

    const totalLeads   = Number(totalLeadsRow.rows[0]?.total   || 0)
    const totalApps    = Number(totalAppsRow.rows[0]?.total    || 0)
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
