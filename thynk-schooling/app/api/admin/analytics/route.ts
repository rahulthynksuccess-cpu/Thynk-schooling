export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [
      signups30,
      schools30,
      leads30,
      revenue30,
      topCities,
      boardDist,
      funnel,
      parentStats,
      schoolStatsByType,
      schoolStatsByCity,
      weeklyActivity,
      classBreakdown,
      parentCityBreakdown,
      priorPeriod,
      totalSchoolsRow,
    ] = await Promise.all([

      // Daily parent signups last 30 days (gap-filled)
      db.query(`
        SELECT gs.day::date AS day, COALESCE(COUNT(u.id), 0) AS count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN users u ON DATE(u.created_at) = gs.day::date AND u.role = 'parent'
        GROUP BY gs.day ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // Daily new schools last 30 days (gap-filled)
      db.query(`
        SELECT gs.day::date AS day, COALESCE(COUNT(s.id), 0) AS count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN schools s ON DATE(s.created_at) = gs.day::date
        GROUP BY gs.day ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // Daily lead count last 30 days (gap-filled)
      db.query(`
        SELECT gs.day::date AS day, COALESCE(COUNT(l.id), 0) AS count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN leads l ON DATE(l.created_at) = gs.day::date
        GROUP BY gs.day ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // Daily REAL revenue from paid package payments last 30 days (gap-filled)
      db.query(`
        SELECT gs.day::date AS day, COALESCE(SUM(lpp.amount_paise), 0) AS revenue_paise
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN lead_package_payments lpp
          ON DATE(lpp.created_at) = gs.day::date AND lpp.status = 'paid'
        GROUP BY gs.day ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // Top cities by lead count
      db.query(`
        SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(l.id) AS leads
        FROM schools s
        LEFT JOIN leads l ON l.school_id = s.id
        WHERE s.city IS NOT NULL AND s.city <> ''
        GROUP BY s.city
        ORDER BY leads DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // Board distribution — board is a single varchar column
      db.query(`
        SELECT board AS name, COUNT(*) AS value
        FROM schools
        WHERE board IS NOT NULL AND board <> ''
        GROUP BY board
        ORDER BY value DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),

      // Funnel counts
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'parent')        AS registered_parents,
          (SELECT COUNT(*) FROM schools)                            AS registered_schools,
          (SELECT COUNT(*) FROM leads WHERE is_purchased = true)    AS leads_purchased,
          (SELECT COUNT(*) FROM applications)                       AS applications
      `).catch(() => ({ rows: [{}] })),

      // Parent stats: budget buckets from lead_package_payments + KPIs
      db.query(`
        WITH per_school AS (
          SELECT
            school_id,
            COUNT(*)          AS purchase_count,
            SUM(amount_paise) AS total_spent_paise
          FROM lead_package_payments
          WHERE status = 'paid'
          GROUP BY school_id
        )
        SELECT
          SUM(CASE WHEN ps.total_spent_paise < 5000000                            THEN 1 ELSE 0 END)::int AS budget_low,
          SUM(CASE WHEN ps.total_spent_paise BETWEEN 5000000 AND 15000000         THEN 1 ELSE 0 END)::int AS budget_mid,
          SUM(CASE WHEN ps.total_spent_paise > 15000000                           THEN 1 ELSE 0 END)::int AS budget_high,
          COUNT(DISTINCT u.id)::int                                                                        AS total_parents,
          COALESCE(ROUND(AVG(ps.total_spent_paise) / 100.0), 0)                                           AS avg_spend,
          COUNT(CASE WHEN ps.purchase_count > 1 THEN 1 END)::int                                          AS repeat_buyers,
          COALESCE(ROUND(AVG(ps.purchase_count)), 0)                                                      AS avg_leads
        FROM users u
        LEFT JOIN per_school ps ON ps.school_id = (
          SELECT id FROM schools WHERE admin_user_id = u.id LIMIT 1
        )
        WHERE u.role = 'school_admin'
      `).catch(() => ({ rows: [{}] })),

      // School stats by type
      db.query(`
        SELECT
          s.school_type                                                                         AS type,
          COUNT(DISTINCT s.id)::int                                                             AS school_count,
          COUNT(l.id)::int                                                                      AS leads,
          COUNT(a.id)::int                                                                      AS applications,
          COALESCE(ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(l.id), 0) * 100), 0)::int         AS conversion_pct
        FROM schools s
        LEFT JOIN leads l        ON l.school_id = s.id
        LEFT JOIN applications a ON a.school_id = s.id
        WHERE s.school_type IS NOT NULL AND s.school_type <> ''
        GROUP BY s.school_type
        ORDER BY leads DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // School stats by city
      db.query(`
        SELECT
          s.city                                                                                AS type,
          COUNT(DISTINCT s.id)::int                                                             AS school_count,
          COUNT(l.id)::int                                                                      AS leads,
          COUNT(a.id)::int                                                                      AS applications,
          COALESCE(ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(l.id), 0) * 100), 0)::int         AS conversion_pct
        FROM schools s
        LEFT JOIN leads l        ON l.school_id = s.id
        LEFT JOIN applications a ON a.school_id = s.id
        WHERE s.city IS NOT NULL AND s.city <> ''
        GROUP BY s.city
        ORDER BY leads DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // Weekly heatmap — leads created per day-of-week per week
      db.query(`
        SELECT
          EXTRACT(DOW FROM created_at)::int                                 AS dow,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / (7*86400))::int AS week_ago,
          COUNT(*)::int                                                      AS count
        FROM leads
        WHERE created_at >= NOW() - INTERVAL '28 days'
        GROUP BY dow, week_ago
        ORDER BY week_ago DESC, dow
      `).catch(() => ({ rows: [] })),

      // Parent segment by class applying for
      db.query(`
        SELECT
          CASE
            WHEN class_applying_for ILIKE ANY(ARRAY['Nursery','LKG','UKG','Pre-K','KG','Pre Primary'])
              THEN 'Nursery–KG'
            WHEN class_applying_for ILIKE ANY(ARRAY['1','2','3','4','5',
              'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
              'Class 1','Class 2','Class 3','Class 4','Class 5'])
              THEN 'Grade 1–5'
            WHEN class_applying_for ILIKE ANY(ARRAY['6','7','8','9','10',
              'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10',
              'Class 6','Class 7','Class 8','Class 9','Class 10'])
              THEN 'Grade 6–10'
            WHEN class_applying_for ILIKE ANY(ARRAY['11','12',
              'Grade 11','Grade 12','Class 11','Class 12'])
              THEN 'Grade 11–12'
            ELSE 'Other'
          END AS class_group,
          COUNT(*)::int AS count
        FROM leads
        WHERE class_applying_for IS NOT NULL AND class_applying_for <> ''
        GROUP BY class_group
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),

      // Parent segment by city (from leads)
      db.query(`
        SELECT city, COUNT(*)::int AS count
        FROM leads
        WHERE city IS NOT NULL AND city <> ''
        GROUP BY city
        ORDER BY count DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // Prior 30d vs previous 30d for % change badges
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM leads
           WHERE created_at >= NOW() - INTERVAL '30 days')::int                               AS leads_cur,
          (SELECT COUNT(*) FROM leads
           WHERE created_at BETWEEN NOW() - INTERVAL '60 days'
             AND NOW() - INTERVAL '30 days')::int                                             AS leads_prev,
          (SELECT COALESCE(SUM(amount_paise), 0) FROM lead_package_payments
           WHERE status = 'paid'
             AND created_at >= NOW() - INTERVAL '30 days')::numeric                           AS rev_cur,
          (SELECT COALESCE(SUM(amount_paise), 0) FROM lead_package_payments
           WHERE status = 'paid'
             AND created_at BETWEEN NOW() - INTERVAL '60 days'
             AND NOW() - INTERVAL '30 days')::numeric                                         AS rev_prev,
          (SELECT COUNT(*) FROM users
           WHERE role = 'parent'
             AND created_at >= NOW() - INTERVAL '30 days')::int                               AS signups_cur,
          (SELECT COUNT(*) FROM users
           WHERE role = 'parent'
             AND created_at BETWEEN NOW() - INTERVAL '60 days'
             AND NOW() - INTERVAL '30 days')::int                                             AS signups_prev,
          (SELECT COUNT(*) FROM schools
           WHERE created_at >= NOW() - INTERVAL '30 days')::int                               AS schools_cur,
          (SELECT COUNT(*) FROM schools
           WHERE created_at BETWEEN NOW() - INTERVAL '60 days'
             AND NOW() - INTERVAL '30 days')::int                                             AS schools_prev
      `).catch(() => ({ rows: [{}] })),

      // Total school count
      db.query(`SELECT COUNT(*)::int AS total FROM schools`).catch(() => ({ rows: [{ total: 0 }] })),
    ])

    // ── Helpers ──────────────────────────────────────────────────────────────
    const BOARD_COLORS = ['#378ADD', '#3B6D11', '#BA7517', '#534AB7', '#888780']

    function pctChange(cur: number, prev: number): string | null {
      if (!prev) return null
      const pct = Math.round((cur - prev) / prev * 100)
      return (pct >= 0 ? '↑' : '↓') + Math.abs(pct) + '% vs prior 30d'
    }

    const pp = priorPeriod.rows[0] || {}
    const f  = funnel.rows[0]      || {}
    const p  = parentStats.rows[0] || {}

    const totalParents = Number(p.total_parents || 0)
    const repeatBuyers = Number(p.repeat_buyers || 0)

    // Merge leads30 + revenue30 into single dailyLeads30 array (both are gap-filled same length)
    const dailyLeads30 = leads30.rows.map((r: any, i: number) => ({
      day:     String(r.day).slice(5),
      leads:   Number(r.count),
      revenue: Math.round(Number(revenue30.rows[i]?.revenue_paise || 0) / 100), // paise → rupees
    }))

    // Heatmap matrix [4 weeks][7 days]
    const heatMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0))
    weeklyActivity.rows.forEach((r: any) => {
      const wk  = Number(r.week_ago)
      const dow = Number(r.dow)
      const idx = 3 - wk
      if (idx >= 0 && idx < 4 && dow >= 0 && dow < 7) {
        heatMatrix[idx][dow] = Number(r.count)
      }
    })

    // Class breakdown → percentages
    const classTotal = classBreakdown.rows.reduce((s: number, r: any) => s + Number(r.count), 0) || 1
    const classPcts  = classBreakdown.rows.map((r: any) => ({
      name:  r.class_group,
      value: Number(r.count),
      pct:   Math.round(Number(r.count) / classTotal * 100),
    }))

    // City (parent leads) breakdown → percentages
    const cityTotal = parentCityBreakdown.rows.reduce((s: number, r: any) => s + Number(r.count), 0) || 1
    const cityPcts  = parentCityBreakdown.rows.map((r: any) => ({
      name:  r.city,
      value: Number(r.count),
      pct:   Math.round(Number(r.count) / cityTotal * 100),
    }))

    return NextResponse.json({
      // Time-series
      signups: signups30.rows.map((r: any) => ({
        day:   String(r.day).slice(5),
        count: Number(r.count),
      })),
      schools: schools30.rows.map((r: any) => ({
        day:   String(r.day).slice(5),
        count: Number(r.count),
      })),
      dailyLeads30,

      // Geography
      topCities: topCities.rows.map((r: any) => ({
        city:    r.city,
        leads:   Number(r.leads),
        schools: Number(r.schools),
      })),

      // Boards — single varchar grouped
      boardData: boardDist.rows.map((r: any, i: number) => ({
        name:  r.name,
        value: Number(r.value),
        color: BOARD_COLORS[i] || '#888',
      })),

      // Funnel
      funnelData: [
        { name: 'Registered parents', value: Number(f.registered_parents || 0) },
        { name: 'Registered schools', value: Number(f.registered_schools || 0) },
        { name: 'Leads purchased',    value: Number(f.leads_purchased    || 0) },
        { name: 'Applications',       value: Number(f.applications       || 0) },
      ],

      // Prior period deltas
      priorPeriod: {
        leadsChange:   pctChange(Number(pp.leads_cur   || 0), Number(pp.leads_prev   || 0)),
        revenueChange: pctChange(Number(pp.rev_cur     || 0), Number(pp.rev_prev     || 0)),
        signupsChange: pctChange(Number(pp.signups_cur || 0), Number(pp.signups_prev || 0)),
        schoolsChange: pctChange(Number(pp.schools_cur || 0), Number(pp.schools_prev || 0)),
      },

      totalSchools: Number(totalSchoolsRow.rows[0]?.total || 0),

      // Parent segments
      parentStats: {
        budgetLow:      Number(p.budget_low  || 0),
        budgetMid:      Number(p.budget_mid  || 0),
        budgetHigh:     Number(p.budget_high || 0),
        classPcts,
        cityPcts,
        totalParents,
        avgSpend:       Number(p.avg_spend   || 0),
        repeatBuyerPct: totalParents > 0 ? Math.round(repeatBuyers / totalParents * 100) : 0,
        avgLeads:       Number(p.avg_leads   || 0),
      },

      // School performance
      schoolStatsByType: schoolStatsByType.rows.map((r: any) => ({
        type:          r.type,
        count:         Number(r.school_count),
        leads:         Number(r.leads),
        applications:  Number(r.applications),
        conversionPct: Number(r.conversion_pct),
      })),
      schoolStatsByCity: schoolStatsByCity.rows.map((r: any) => ({
        type:          r.type,
        count:         Number(r.school_count),
        leads:         Number(r.leads),
        applications:  Number(r.applications),
        conversionPct: Number(r.conversion_pct),
      })),

      weeklyHeatmap: heatMatrix,
    })

  } catch (e: any) {
    console.error('[analytics route]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
