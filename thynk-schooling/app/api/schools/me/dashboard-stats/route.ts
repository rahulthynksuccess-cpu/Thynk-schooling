export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    const school = await db.query(`SELECT id FROM schools WHERE admin_user_id=$1`, [userId]).catch(()=>({rows:[]}))
    if (!school.rows.length) return NextResponse.json({ totalLeads:0, totalApplications:0, profileViews:0, credits:0 })
    const sid = school.rows[0].id
    const [leads, apps, credits] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM leads WHERE school_id=$1`, [sid]).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM applications WHERE school_id=$1`, [sid]).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT credits FROM lead_credits WHERE school_id=$1`, [sid]).catch(()=>({rows:[{credits:0}]})),
    ])
    return NextResponse.json({
      totalLeads: Number(leads.rows[0].count),
      totalApplications: Number(apps.rows[0].count),
      profileViews: 0,
      credits: credits.rows[0]?.credits ?? 0,
    })
  } catch { return NextResponse.json({ totalLeads:0, totalApplications:0, profileViews:0, credits:0 }) }
}
