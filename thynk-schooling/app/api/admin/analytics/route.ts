export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [signups30, schools30, leads30, topCities, boardDist, funnel, parentStats, schoolStats, weeklyActivity] = await Promise.all([
      db.query(
        "SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day"
      ).catch(() => ({ rows: [] })),

      db.query(
        "SELECT DATE(created_at) AS day, COUNT(*) AS count FROM schools WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day"
      ).catch(() => ({ rows: [] })),

      db.query(
        "SELECT DATE(created_at) AS day, COUNT(*) AS count, COUNT(*)*300 AS revenue FROM lead_purchases WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day"
      ).catch(() => ({ rows: [] })),

      db.query(
        "SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(lp.id) AS leads FROM schools s LEFT JOIN lead_purchases lp ON lp.school_id=s.id WHERE s.city IS NOT NULL GROUP BY s.city ORDER BY leads DESC LIMIT 6"
      ).catch(() => ({ rows: [] })),

      db.query(
        "SELECT UNNEST(board) AS name, COUNT(*) AS value FROM schools WHERE board IS NOT NULL GROUP BY name ORDER BY value DESC LIMIT 5"
      ).catch(() => ({ rows: [] })),

      db.query(
        `SELECT
          (SELECT COUNT(*) FROM users WHERE role!='super_admin') AS visitors,
          (SELECT COUNT(*) FROM schools) AS school_views,
          (SELECT COUNT(*) FROM lead_purchases) AS leads_purchased,
          (SELECT COUNT(*) FROM applications) AS applications`
      ).catch(() => ({ rows: [{}] })),

      // Parent breakdown by budget tier (based on lead_purchases amounts)
      db.query(
        `SELECT
          SUM(CASE WHEN lp.total_amount < 50000 THEN 1 ELSE 0 END) AS budget_low,
          SUM(CASE WHEN lp.total_amount BETWEEN 50000 AND 150000 THEN 1 ELSE 0 END) AS budget_mid,
          SUM(CASE WHEN lp.total_amount > 150000 THEN 1 ELSE 0 END) AS budget_high,
          COUNT(DISTINCT u.id) AS total_parents,
          ROUND(AVG(lp.total_amount)) AS avg_spend,
          (SELECT COUNT(*) FROM (
            SELECT user_id FROM lead_purchases GROUP BY user_id HAVING COUNT(*)>1
          ) rpt) AS repeat_buyers,
          ROUND(AVG(lead_count)) AS avg_leads
        FROM users u
        LEFT JOIN lead_purchases lp ON lp.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS lead_count FROM lead_purchases GROUP BY user_id) lc ON lc.user_id = u.id
        WHERE u.role = 'parent'`
      ).catch(() => ({ rows: [{}] })),

      // School stats by type
      db.query(
        `SELECT
          s.school_type,
          COUNT(DISTINCT s.id) AS school_count,
          COUNT(lp.id) AS leads_received,
          COUNT(a.id) AS applications,
          ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(lp.id),0) * 100) AS conversion_pct
        FROM schools s
        LEFT JOIN lead_purchases lp ON lp.school_id = s.id
        LEFT JOIN applications a ON a.school_id = s.id
        WHERE s.school_type IS NOT NULL
        GROUP BY s.school_type
        ORDER BY leads_received DESC
        LIMIT 6`
      ).catch(() => ({ rows: [] })),

      // Weekly heatmap: activity count by day-of-week and week number (last 4 weeks)
      db.query(
        `SELECT
          EXTRACT(DOW FROM created_at) AS dow,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / (7*86400)) AS week_ago,
          COUNT(*) AS count
        FROM lead_purchases
        WHERE created_at >= NOW() - INTERVAL '28 days'
        GROUP BY dow, week_ago
        ORDER BY week_ago DESC, dow`
      ).catch(() => ({ rows: [] })),
    ])

    const BOARD_COLORS = ['#378ADD', '#3B6D11', '#BA7517', '#534AB7', '#888780']
    const f = funnel.rows[0] || {}
    const p = parentStats.rows[0] || {}
    const totalParents = Number(p.total_parents || 0)
    const repeatBuyers = Number(p.repeat_buyers || 0)

    // Build weekly heatmap matrix [week][dow]
    const heatMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0))
    weeklyActivity.rows.forEach((r: any) => {
      const wk = Math.min(3, Number(r.week_ago))
      const dow = Number(r.dow) // 0=Sun..6=Sat
      if (wk >= 0 && wk < 4 && dow >= 0 && dow < 7) heatMatrix[wk][dow] = Number(r.count)
    })

    return NextResponse.json({
      signups: signups30.rows,
      schools: schools30.rows,
      dailyLeads30: leads30.rows.map((r: any) => ({
        day: String(r.day).slice(5),
        leads: Number(r.count),
        revenue: Number(r.revenue),
      })),
      topCities: topCities.rows.map((r: any) => ({
        city: r.city,
        leads: Number(r.leads),
        schools: Number(r.schools),
      })),
      boardData: boardDist.rows.map((r: any, i: number) => ({
        name: r.name,
        value: Number(r.value),
        color: BOARD_COLORS[i] || '#888',
      })),
      funnelData: [
        { name: 'Registered Users', value: Number(f.visitors || 0) },
        { name: 'School Views',     value: Number(f.school_views || 0) },
        { name: 'Leads Purchased',  value: Number(f.leads_purchased || 0) },
        { name: 'Applications',     value: Number(f.applications || 0) },
      ],
      parentStats: {
        budgetLow: Number(p.budget_low || 0),
        budgetMid: Number(p.budget_mid || 0),
        budgetHigh: Number(p.budget_high || 0),
        totalParents,
        avgSpend: Number(p.avg_spend || 0),
        repeatBuyerPct: totalParents > 0 ? Math.round(repeatBuyers / totalParents * 100) : 0,
        avgLeads: Number(p.avg_leads || 0),
      },
      schoolStats: schoolStats.rows.map((r: any) => ({
        type: r.school_type,
        count: Number(r.school_count),
        leads: Number(r.leads_received),
        applications: Number(r.applications),
        conversionPct: Number(r.conversion_pct || 0),
      })),
      weeklyHeatmap: heatMatrix,
    })
  } catch (e: any) {
    console.error('[analytics route]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
