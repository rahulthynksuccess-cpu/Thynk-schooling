export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [signups30, schools30, leads30, topCities, boardDist, funnel] = await Promise.all([
      db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
      db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM schools WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
      db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count, COUNT(*)*300 AS revenue FROM lead_purchases WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
      db.query("SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(lp.id) AS leads FROM schools s LEFT JOIN lead_purchases lp ON lp.school_id=s.id WHERE s.city IS NOT NULL GROUP BY s.city ORDER BY leads DESC LIMIT 6").catch(() => ({ rows: [] })),
      db.query("SELECT UNNEST(board) AS name, COUNT(*) AS value FROM schools WHERE board IS NOT NULL GROUP BY name ORDER BY value DESC LIMIT 5").catch(() => ({ rows: [] })),
      db.query("SELECT (SELECT COUNT(*) FROM users WHERE role!='super_admin') AS visitors, (SELECT COUNT(*) FROM schools) AS school_views, (SELECT COUNT(*) FROM lead_purchases) AS leads_purchased, (SELECT COUNT(*) FROM applications) AS applications").catch(() => ({ rows: [{}] })),
    ])
    const BOARD_COLORS = ['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E']
    const f = funnel.rows[0] || {}
    return NextResponse.json({
      signups: signups30.rows,
      schools: schools30.rows,
      dailyLeads30: leads30.rows.map((r:any) => ({ day: String(r.day).slice(5), leads: Number(r.count), revenue: Number(r.revenue) })),
      topCities: topCities.rows.map((r:any) => ({ city: r.city, leads: Number(r.leads), schools: Number(r.schools) })),
      boardData: boardDist.rows.map((r:any, i:number) => ({ name: r.name, value: Number(r.value), color: BOARD_COLORS[i] || '#888' })),
      funnelData: [
        { name:'Registered Users', value: Number(f.visitors||0) },
        { name:'School Views',     value: Number(f.school_views||0) },
        { name:'Leads Purchased',  value: Number(f.leads_purchased||0) },
        { name:'Applications',     value: Number(f.applications||0) },
      ],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
