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
    const days = Number(new URL(req.url).searchParams.get('days') || 30)
    const school = await db.query(`SELECT id FROM schools WHERE admin_user_id=$1`, [userId]).catch(()=>({rows:[]}))
    if (!school.rows.length) return NextResponse.json({ leads: [], applications: [] })
    const sid = school.rows[0].id
    const [leads, apps] = await Promise.all([
      db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM leads WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '${days} days' GROUP BY day ORDER BY day`, [sid]).catch(()=>({rows:[]})),
      db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM applications WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '${days} days' GROUP BY day ORDER BY day`, [sid]).catch(()=>({rows:[]})),
    ])
    return NextResponse.json({ leads: leads.rows, applications: apps.rows })
  } catch { return NextResponse.json({ leads: [], applications: [] }) }
}
