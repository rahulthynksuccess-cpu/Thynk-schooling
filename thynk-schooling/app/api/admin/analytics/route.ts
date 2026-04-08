export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [
      signups30,
      schools30,
      leads30,
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

      // ── Daily signups last 30 days (gap-filled) ─────────────────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(u.id), 0) AS count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN users u ON DATE(u.created_at) = gs.day::date AND u.role = 'parent'
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Daily new schools last 30 days (gap-filled) ──────────────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(s.id), 0) AS count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN schools s ON DATE(s.created_at) = gs.day::date
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Daily leads + real revenue last 30 days (gap-filled) ────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(lp.id), 0)    AS count,
          COALESCE(SUM(lp.amount), 0)  AS revenue
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS gs(day)
        LEFT JOIN lead_purchases lp ON DATE(lp.created_at) = gs.day::date
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Top cities ────────────────────────────────────────────────────────
      db.query(`
        SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(lp.id) AS leads
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        WHERE s.city IS NOT NULL
        GROUP BY s.city
        ORDER BY leads DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── Board distribution ────────────────────────────────────────────────
      db.query(`
        SELECT UNNEST(board) AS name, COUNT(*) AS value
        FROM schools
        WHERE board IS NOT NULL AND array_length(board, 1) > 0
        GROUP BY name
        ORDER BY value DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),

      // ── Funnel ────────────────────────────────────────────────────────────
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'parent')              AS registered_parents,
          (SELECT COUNT(*) FROM users WHERE role = 'school')              AS registered_schools,
          (SELECT COUNT(*) FROM lead_purchases)                           AS leads_purchased,
          (SELECT COUNT(*) FROM applications)                             AS applications
      `).catch(() => ({ rows: [{}] })),

      // ── Parent stats by budget + KPIs ─────────────────────────────────────
      db.query(`
        WITH per_user AS (
          SELECT user_id, COUNT(*) AS purchase_count, SUM(amount) AS total_spent
          FROM lead_purchases
          GROUP BY user_id
        )
        SELECT
          SUM(CASE WHEN pu.total_spent < 50000             THEN 1 ELSE 0 END)::int AS budget_low,
          SUM(CASE WHEN pu.total_spent BETWEEN 50000 AND 150000 THEN 1 ELSE 0 END)::int AS budget_mid,
          SUM(CASE WHEN pu.total_spent > 150000            THEN 1 ELSE 0 END)::int AS budget_high,
          COUNT(DISTINCT u.id)::int                                            AS total_parents,
          COALESCE(ROUND(AVG(pu.total_spent)), 0)                              AS avg_spend,
          COUNT(CASE WHEN pu.purchase_count > 1 THEN 1 END)::int               AS repeat_buyers,
          COALESCE(ROUND(AVG(pu.purchase_count)), 0)                           AS avg_leads
        FROM users u
        LEFT JOIN per_user pu ON pu.user_id = u.id
        WHERE u.role = 'parent'
      `).catch(() => ({ rows: [{}] })),

      // ── School stats by type ──────────────────────────────────────────────
      db.query(`
        SELECT
          s.school_type AS type,
          COUNT(DISTINCT s.id)::int                                          AS school_count,
          COUNT(lp.id)::int                                                  AS leads_received,
          COUNT(a.id)::int                                                   AS applications,
          COALESCE(ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(lp.id),0) * 100), 0)::int AS conversion_pct
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        LEFT JOIN applications   a  ON a.school_id  = s.id
        WHERE s.school_type IS NOT NULL
        GROUP BY s.school_type
        ORDER BY leads_received DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── School stats by city (REAL — was missing before) ─────────────────
      db.query(`
        SELECT
          s.city AS type,
          COUNT(DISTINCT s.id)::int                                          AS school_count,
          COUNT(lp.id)::int                                                  AS leads_received,
          COUNT(a.id)::int                                                   AS applications,
          COALESCE(ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(lp.id),0) * 100), 0)::int AS conversion_pct
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        LEFT JOIN applications   a  ON a.school_id  = s.id
        WHERE s.city IS NOT NULL
        GROUP BY s.city
        ORDER BY leads_received DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── Weekly heatmap ────────────────────────────────────────────────────
      db.query(`
        SELECT
          EXTRACT(DOW FROM created_at)::int                                   AS dow,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / (7*86400))::int   AS week_ago,
          COUNT(*)::int                                                        AS count
        FROM lead_purchases
        WHERE created_at >= NOW() - INTERVAL '28 days'
        GROUP BY dow, week_ago
        ORDER BY week_ago DESC, dow
      `).catch(() => ({ rows: [] })),

      // ── Parent segment: by class seeking (REAL — was all fake before) ─────
      db.query(`
        SELECT
          CASE
            WHEN class_applying_for IN ('Nursery','LKG','UKG','Pre-K','KG') THEN 'Nursery–KG'
            WHEN class_applying_for IN ('1','2','3','4','5',
                                        'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5') THEN 'Grade 1–5'
            WHEN class_applying_for IN ('6','7','8','9','10',
                                        'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10') THEN 'Grade 6–10'
            WHEN class_applying_for IN ('11','12','Grade 11','Grade 12') THEN 'Grade 11–12'
            ELSE 'Other'
          END AS class_group,
          COUNT(*)::int AS count
        FROM leads
        WHERE class_applying_for IS NOT NULL
        GROUP BY class_group
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),

      // ── Parent segment: by city (REAL — was all fake before) ─────────────
      db.query(`
        SELECT city, COUNT(*)::int AS count
        FROM leads
        WHERE city IS NOT NULL AND city <> ''
        GROUP BY city
        ORDER BY count DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── Prior-period comparison (days 31–60) for % change ────────────────
      // Replaces all the hardcoded "↑ 12%" etc.
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM lead_purchases WHERE created_at >= NOW() - INTERVAL '30 days')::int  AS leads_cur,
          (SELECT COUNT(*) FROM lead_purchases WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')::int AS leads_prev,
          (SELECT COALESCE(SUM(amount),0) FROM lead_purchases WHERE created_at >= NOW() - INTERVAL '30 days')::numeric  AS rev_cur,
          (SELECT COALESCE(SUM(amount),0) FROM lead_purchases WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')::numeric AS rev_prev,
          (SELECT COUNT(*) FROM users WHERE role = 'parent' AND created_at >= NOW() - INTERVAL '30 days')::int  AS signups_cur,
          (SELECT COUNT(*) FROM users WHERE role = 'parent' AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')::int AS signups_prev,
          (SELECT COUNT(*) FROM schools WHERE created_at >= NOW() - INTERVAL '30 days')::int  AS schools_cur,
          (SELECT COUNT(*) FROM schools WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')::int AS schools_prev
      `).catch(() => ({ rows: [{}] })),

      // ── Total school count (actual, not from funnel subquery) ─────────────
      db.query(`SELECT COUNT(*)::int AS total FROM schools`).catch(() => ({ rows: [{ total: 0 }] })),
    ])

    // ── Helpers ────────────────────────────────────────────────────────────
    const BOARD_COLORS = ['#378ADD', '#3B6D11', '#BA7517', '#534AB7', '#888780']

    function pctChange(cur: number, prev: number): string | null {
      if (!prev) return null
      const pct = Math.round((cur - prev) / prev * 100)
      return (pct >= 0 ? '↑' : '↓') + Math.abs(pct) + '% vs prior 30d'
    }

    const pp  = priorPeriod.rows[0] || {}
    const f   = funnel.rows[0] || {}
    const p   = parentStats.rows[0] || {}
    const totalParents = Number(p.total_parents || 0)
    const repeatBuyers = Number(p.repeat_buyers || 0)

    // ── Heatmap matrix ─────────────────────────────────────────────────────
    const heatMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0))
    weeklyActivity.rows.forEach((r: any) => {
      const wk  = Number(r.week_ago)
      const dow = Number(r.dow)
      const idx = 3 - wk
      if (idx >= 0 && idx < 4 && dow >= 0 && dow < 7) {
        heatMatrix[idx][dow] = Number(r.count)
      }
    })

    // ── Class breakdown → percentage ───────────────────────────────────────
    const classTotal = classBreakdown.rows.reduce((s: number, r: any) => s + Number(r.count), 0) || 1
    const classPcts  = classBreakdown.rows.map((r: any) => ({
      name:  r.class_group,
      value: Number(r.count),
      pct:   Math.round(Number(r.count) / classTotal * 100),
    }))

    // ── City (parent) breakdown → percentage ───────────────────────────────
    const cityTotal = parentCityBreakdown.rows.reduce((s: number, r: any) => s + Number(r.count), 0) || 1
    const cityPcts  = parentCityBreakdown.rows.map((r: any) => ({
      name:  r.city,
      value: Number(r.count),
      pct:   Math.round(Number(r.count) / cityTotal * 100),
    }))

    return NextResponse.json({
      // ── Time-series ─────────────────────────────────────────────────────
      signups: signups30.rows.map((r: any) => ({
        day:   String(r.day).slice(5),
        count: Number(r.count),
      })),
      schools: schools30.rows.map((r: any) => ({
        day:   String(r.day).slice(5),
        count: Number(r.count),
      })),
      dailyLeads30: leads30.rows.map((r: any) => ({
        day:     String(r.day).slice(5),
        leads:   Number(r.count),
        revenue: Number(r.revenue),
      })),

      // ── Geography ──────────────────────────────────────────────────────
      topCities: topCities.rows.map((r: any) => ({
        city:    r.city,
        leads:   Number(r.leads),
        schools: Number(r.schools),
      })),

      // ── Boards ──────────────────────────────────────────────────────────
      boardData: boardDist.rows.map((r: any, i: number) => ({
        name:  r.name,
        value: Number(r.value),
        color: BOARD_COLORS[i] || '#888',
      })),

      // ── Funnel (corrected labels) ────────────────────────────────────────
      funnelData: [
        { name: 'Registered parents', value: Number(f.registered_parents || 0) },
        { name: 'Registered schools', value: Number(f.registered_schools || 0) },
        { name: 'Leads purchased',    value: Number(f.leads_purchased    || 0) },
        { name: 'Applications',       value: Number(f.applications       || 0) },
      ],

      // ── Stat pill values with REAL prior-period deltas ───────────────────
      priorPeriod: {
        leadsChange:   pctChange(Number(pp.leads_cur   || 0), Number(pp.leads_prev   || 0)),
        revenueChange: pctChange(Number(pp.rev_cur     || 0), Number(pp.rev_prev     || 0)),
        signupsChange: pctChange(Number(pp.signups_cur || 0), Number(pp.signups_prev || 0)),
        schoolsChange: pctChange(Number(pp.schools_cur || 0), Number(pp.schools_prev || 0)),
      },

      // ── Totals ──────────────────────────────────────────────────────────
      totalSchools: Number(totalSchoolsRow.rows[0]?.total || 0),

      // ── Parent segments (all REAL data) ─────────────────────────────────
      parentStats: {
        // budget
        budgetLow:      Number(p.budget_low  || 0),
        budgetMid:      Number(p.budget_mid  || 0),
        budgetHigh:     Number(p.budget_high || 0),
        // class
        classPcts,
        // city
        cityPcts,
        // KPIs
        totalParents,
        avgSpend:       Number(p.avg_spend   || 0),
        repeatBuyerPct: totalParents > 0 ? Math.round(repeatBuyers / totalParents * 100) : 0,
        avgLeads:       Number(p.avg_leads   || 0),
      },

      // ── School performance (type + city, both real) ─────────────────────
      schoolStatsByType: schoolStatsByType.rows.map((r: any) => ({
        type:          r.type,
        count:         Number(r.school_count),
        leads:         Number(r.leads_received),
        applications:  Number(r.applications),
        conversionPct: Number(r.conversion_pct),
      })),
      schoolStatsByCity: schoolStatsByCity.rows.map((r: any) => ({
        type:          r.type,
        count:         Number(r.school_count),
        leads:         Number(r.leads_received),
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
