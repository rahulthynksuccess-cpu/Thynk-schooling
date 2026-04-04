export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [users, schools, apps, leads, pendingSchoolsCt, newUsersToday, leadsToday,
           revenue, pendingApps, pendingReviews, reviews,
           weeklyLeads, monthlyGrowth, boardDist, appStatus,
           recentLeadsRows, recentUsersRows, pendingSchoolsRows] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role!='super_admin'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM schools").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM applications").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM lead_purchases").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM schools WHERE (is_verified=false OR is_verified IS NULL)").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM users WHERE role!='super_admin' AND created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM lead_purchases WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COALESCE(SUM(amount),0) AS total FROM lead_purchases").catch(() => ({ rows: [{ total: 0 }] })),
      db.query("SELECT COUNT(*) FROM applications WHERE status='pending' OR status IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM reviews WHERE is_approved=false OR is_approved IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM reviews").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT to_char(DATE(created_at),'Dy') AS day, COUNT(*) AS leads, COUNT(*)*300 AS revenue FROM lead_purchases WHERE created_at >= NOW()-INTERVAL '7 days' GROUP BY DATE(created_at), to_char(DATE(created_at),'Dy') ORDER BY DATE(created_at)").catch(() => ({ rows: [] })),
      db.query("SELECT to_char(DATE_TRUNC('month',created_at),'Mon') AS month, COUNT(*) AS users, COUNT(*) AS schools, COUNT(*) AS leads FROM users WHERE created_at >= NOW()-INTERVAL '6 months' GROUP BY DATE_TRUNC('month',created_at), to_char(DATE_TRUNC('month',created_at),'Mon') ORDER BY DATE_TRUNC('month',created_at)").catch(() => ({ rows: [] })),
      db.query("SELECT UNNEST(board) AS name, COUNT(*) AS value FROM schools WHERE board IS NOT NULL GROUP BY name ORDER BY value DESC LIMIT 5").catch(() => ({ rows: [] })),
      db.query("SELECT COALESCE(status,'pending') AS name, COUNT(*) AS value FROM applications GROUP BY status").catch(() => ({ rows: [] })),
      db.query("SELECT lp.id, s.name AS school_name, COALESCE(u.full_name,u.name) AS parent_name, lp.class_applied, lp.amount AS price, lp.is_purchased, lp.created_at FROM lead_purchases lp LEFT JOIN schools s ON s.id=lp.school_id LEFT JOIN users u ON u.id=lp.user_id ORDER BY lp.created_at DESC LIMIT 8").catch(() => ({ rows: [] })),
      db.query("SELECT id, COALESCE(full_name,name) AS full_name, COALESCE(phone,mobile) AS phone, role FROM users WHERE role!='super_admin' ORDER BY created_at DESC LIMIT 5").catch(() => ({ rows: [] })),
      db.query("SELECT id, name, city FROM schools WHERE (is_verified=false OR is_verified IS NULL) ORDER BY created_at DESC LIMIT 5").catch(() => ({ rows: [] })),
    ])
    const BOARD_COLORS: Record<string,string> = { CBSE:'#F5A623', ICSE:'#4F8EF7', State:'#00E5A0', IB:'#9B72FF' }
    const STATUS_COLORS: Record<string,string> = { pending:'#FBBF24', shortlisted:'#00E5A0', admitted:'#4F8EF7', rejected:'#FF5757' }
    return NextResponse.json({
      totalUsers: Number(users.rows[0].count),
      totalSchools: Number(schools.rows[0].count),
      totalApps: Number(apps.rows[0].count),
      totalLeads: Number(leads.rows[0].count),
      totalReviews: Number(reviews.rows[0].count),
      pendingVerification: Number(pendingSchoolsCt.rows[0].count),
      newUsersToday: Number(newUsersToday.rows[0].count),
      leadsToday: Number(leadsToday.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total) * 100,
      pendingApps: Number(pendingApps.rows[0].count),
      pendingReviews: Number(pendingReviews.rows[0].count),
      leadsWeekly: weeklyLeads.rows.map((r:any) => ({ day: r.day, leads: Number(r.leads), revenue: Number(r.revenue) })),
      monthlyGrowth: monthlyGrowth.rows.map((r:any) => ({ month: r.month, users: Number(r.users), schools: Number(r.schools), leads: Number(r.leads) })),
      schoolsByBoard: boardDist.rows.map((r:any,i:number) => ({ name: r.name, value: Number(r.value), color: BOARD_COLORS[r.name] || ['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E'][i] || '#888' })),
      appStatus: appStatus.rows.map((r:any) => ({ name: r.name, value: Number(r.value), fill: STATUS_COLORS[r.name] || '#888' })),
      recentLeads: recentLeadsRows.rows.map((r:any) => ({ id: r.id, schoolName: r.school_name||'—', parentName: r.parent_name||'—', classApplied: r.class_applied||'—', price: Number(r.price)||0, isPurchased: r.is_purchased||false, createdAt: r.created_at })),
      recentUsers: recentUsersRows.rows.map((r:any) => ({ id: r.id, fullName: r.full_name||'—', phone: r.phone||'—', role: r.role })),
      pendingSchools: pendingSchoolsRows.rows,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
