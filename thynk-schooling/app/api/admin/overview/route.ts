export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [users, schools, apps, leads] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role != 'super_admin'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM schools").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM applications").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM lead_purchases").catch(() => ({ rows: [{ count: 0 }] })),
    ])
    return NextResponse.json({
      totalUsers:    Number(users.rows[0].count),
      totalSchools:  Number(schools.rows[0].count),
      totalApps:     Number(apps.rows[0].count),
      totalLeads:    Number(leads.rows[0].count),
    })
  } catch (e: any) {
    return NextResponse.json({ totalUsers:0, totalSchools:0, totalApps:0, totalLeads:0 })
  }
}
