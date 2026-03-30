export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') ||
                  req.cookies.get('ts_access_token')?.value || ''
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserId(req)
    const body = await req.json()
    const sets: string[] = []; const params: any[] = []
    if (body.fullName          !== undefined) { params.push(body.fullName);          sets.push(`full_name=$${params.length}`) }
    if (body.profileCompleted  !== undefined) { params.push(body.profileCompleted);  sets.push(`profile_completed=$${params.length}`) }
    if (!sets.length || !userId) return NextResponse.json({ success: true })
    params.push(userId)
    await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$${params.length}`, params)
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
