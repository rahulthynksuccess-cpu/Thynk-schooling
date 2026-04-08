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
      schoolStats,
      weeklyActivity,
    ] = await Promise.all([

      // ── Daily signups (last 30 days, gap-filled) ──────────────────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(u.id), 0) AS count
        FROM generate_series(
          NOW() - INTERVAL '29 days',
          NOW(),
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN users u
          ON DATE(u.created_at) = gs.day::date
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Daily new schools (last 30 days, gap-filled) ──────────────────────
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(s.id), 0) AS count
        FROM generate_series(
          NOW() - INTERVAL '29 days',
          NOW(),
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN schools s
          ON DATE(s.created_at) = gs.day::date
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Daily leads + REAL revenue (last 30 days, gap-filled) ────────────
      // BUG FIX 1: was COUNT(*)*300 (hardcoded). Now uses actual amount from
      // lead_purchases. Adjust column name (amount / total_amount) to match
      // your schema.
      db.query(`
        SELECT
          gs.day::date AS day,
          COALESCE(COUNT(lp.id), 0)          AS count,
          COALESCE(SUM(lp.amount), 0)        AS revenue
        FROM generate_series(
          NOW() - INTERVAL '29 days',
          NOW(),
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN lead_purchases lp
          ON DATE(lp.created_at) = gs.day::date
        GROUP BY gs.day
        ORDER BY gs.day
      `).catch(() => ({ rows: [] })),

      // ── Top cities ────────────────────────────────────────────────────────
      db.query(`
        SELECT
          s.city,
          COUNT(DISTINCT s.id)  AS schools,
          COUNT(lp.id)          AS leads
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        WHERE s.city IS NOT NULL
        GROUP BY s.city
        ORDER BY leads DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── Board distribution ────────────────────────────────────────────────
      // BUG FIX 2: UNNEST only works for array columns (text[]).
      // If your `board` column is text (comma-separated), use the commented
      // alternative below instead.
      db.query(`
        SELECT UNNEST(board) AS name, COUNT(*) AS value
        FROM schools
        WHERE board IS NOT NULL AND array_length(board, 1) > 0
        GROUP BY name
        ORDER BY value DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),

      /* Alternative if board is a plain text column (comma-separated):
      db.query(`
        SELECT
          TRIM(b.name) AS name,
          COUNT(*)     AS value
        FROM schools,
          LATERAL UNNEST(STRING_TO_ARRAY(board, ',')) AS b(name)
        WHERE board IS NOT NULL AND board <> ''
        GROUP BY TRIM(b.name)
        ORDER BY value DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),
      */

      // ── Funnel ────────────────────────────────────────────────────────────
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role NOT IN ('super_admin')) AS registered_users,
          (SELECT COUNT(*) FROM schools)                                  AS school_count,
          (SELECT COUNT(*) FROM lead_purchases)                           AS leads_purchased,
          (SELECT COUNT(*) FROM applications)                             AS applications
      `).catch(() => ({ rows: [{}] })),

      // ── Parent stats (budget breakdown + KPIs) ────────────────────────────
      // BUG FIX 3: COALESCE on avg_leads so it never returns NULL when data exists.
      // NOTE: total_amount vs amount — adjust to your lead_purchases schema.
      db.query(`
        WITH per_user AS (
          SELECT
            user_id,
            COUNT(*)          AS purchase_count,
            SUM(amount)       AS total_spent
          FROM lead_purchases
          GROUP BY user_id
        )
        SELECT
          SUM(CASE WHEN pu.total_spent < 50000  THEN 1 ELSE 0 END) AS budget_low,
          SUM(CASE WHEN pu.total_spent BETWEEN 50000 AND 150000 THEN 1 ELSE 0 END) AS budget_mid,
          SUM(CASE WHEN pu.total_spent > 150000 THEN 1 ELSE 0 END) AS budget_high,
          COUNT(DISTINCT u.id)                                      AS total_parents,
          COALESCE(ROUND(AVG(pu.total_spent)), 0)                   AS avg_spend,
          COUNT(CASE WHEN pu.purchase_count > 1 THEN 1 END)         AS repeat_buyers,
          COALESCE(ROUND(AVG(pu.purchase_count)), 0)                AS avg_leads
        FROM users u
        LEFT JOIN per_user pu ON pu.user_id = u.id
        WHERE u.role = 'parent'
      `).catch(() => ({ rows: [{}] })),

      // ── School stats by type ──────────────────────────────────────────────
      db.query(`
        SELECT
          s.school_type,
          COUNT(DISTINCT s.id)                                                    AS school_count,
          COUNT(lp.id)                                                            AS leads_received,
          COUNT(a.id)                                                             AS applications,
          COALESCE(
            ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(lp.id), 0) * 100),
            0
          )                                                                       AS conversion_pct
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        LEFT JOIN applications   a  ON a.school_id  = s.id
        WHERE s.school_type IS NOT NULL
        GROUP BY s.school_type
        ORDER BY leads_received DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),

      // ── Weekly heatmap (last 28 days) ─────────────────────────────────────
      // BUG FIX 4: week_ago=0 is the CURRENT week. The frontend renders rows
      // as ['Week 4','Week 3','Week 2','This week'] (index 0..3) so we must
      // store week_ago=0 at matrix index 3 (= "This week").
      // Fix applied in JS below: heatMatrix[3 - wk][dow] = count
      db.query(`
        SELECT
          EXTRACT(DOW FROM created_at)::int                                    AS dow,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / (7 * 86400))::int  AS week_ago,
          COUNT(*)::int                                                         AS count
        FROM lead_purchases
        WHERE created_at >= NOW() - INTERVAL '28 days'
        GROUP BY dow, week_ago
        ORDER BY week_ago DESC, dow
      `).catch(() => ({ rows: [] })),
    ])

    // ── Constants ──────────────────────────────────────────────────────────
    const BOARD_COLORS = ['#378ADD', '#3B6D11', '#BA7517', '#534AB7', '#888780']
    const f = funnel.rows[0] || {}
    const p = parentStats.rows[0] || {}
    const totalParents = Number(p.total_parents || 0)
    const repeatBuyers = Number(p.repeat_buyers || 0)

    // ── Heatmap matrix ─────────────────────────────────────────────────────
    // BUG FIX 4 (applied): week_ago=0 → matrix index 3 ("This week")
    //                       week_ago=1 → matrix index 2 ("Week 2"), etc.
    const heatMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0))
    weeklyActivity.rows.forEach((r: any) => {
      const wk  = Number(r.week_ago)
      const dow = Number(r.dow)
      const idx = 3 - wk          // ← inverted so index 3 = current week
      if (idx >= 0 && idx < 4 && dow >= 0 && dow < 7) {
        heatMatrix[idx][dow] = Number(r.count)
      }
    })

    return NextResponse.json({
      signups: signups30.rows,
      schools: schools30.rows,

      // Gap-filled: every day has an entry even if count=0
      dailyLeads30: leads30.rows.map((r: any) => ({
        day:     String(r.day).slice(5),    // "MM-DD"
        leads:   Number(r.count),
        revenue: Number(r.revenue),
      })),

      topCities: topCities.rows.map((r: any) => ({
        city:    r.city,
        leads:   Number(r.leads),
        schools: Number(r.schools),
      })),

      boardData: boardDist.rows.map((r: any, i: number) => ({
        name:  r.name,
        value: Number(r.value),
        color: BOARD_COLORS[i] || '#888',
      })),

      funnelData: [
        { name: 'Registered Users', value: Number(f.registered_users || 0) },
        { name: 'School Views',     value: Number(f.school_count     || 0) },
        { name: 'Leads Purchased',  value: Number(f.leads_purchased  || 0) },
        { name: 'Applications',     value: Number(f.applications     || 0) },
      ],

      parentStats: {
        budgetLow:       Number(p.budget_low  || 0),
        budgetMid:       Number(p.budget_mid  || 0),
        budgetHigh:      Number(p.budget_high || 0),
        totalParents,
        avgSpend:        Number(p.avg_spend   || 0),
        repeatBuyerPct:  totalParents > 0
                           ? Math.round(repeatBuyers / totalParents * 100)
                           : 0,
        avgLeads:        Number(p.avg_leads   || 0),
      },

      schoolStats: schoolStats.rows.map((r: any) => ({
        type:          r.school_type,
        count:         Number(r.school_count),
        leads:         Number(r.leads_received),
        applications:  Number(r.applications),
        conversionPct: Number(r.conversion_pct || 0),
      })),

      weeklyHeatmap: heatMatrix,
    })

  } catch (e: any) {
    console.error('[analytics route]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
