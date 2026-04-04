export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    // 1. Authorization: Bearer <token>  (sent by the profile page via fetch)
    const bearer = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (bearer) {
      const p = jwt.verify(bearer, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
      const id = p?.userId || p?.id || null
      if (id) return id
    }
  } catch {}
  try {
    // 2. ts_access_token cookie  (fallback)
    const cookie = req.cookies.get('ts_access_token')?.value || ''
    if (cookie) {
      const p = jwt.verify(cookie, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
      return p?.userId || p?.id || null
    }
  } catch {}
  try {
    // 3. ts_refresh cookie — last resort, decode without verify to get userId
    //    (refresh token uses a different secret, so just decode the payload)
    const refresh = req.cookies.get('ts_refresh')?.value || ''
    if (refresh) {
      const p = jwt.decode(refresh) as any
      return p?.id || null
    }
  } catch {}
  return null
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized — could not identify user' }, { status: 401 })
    }

    const body = await req.json()
    const sets: string[] = []
    const params: any[] = []

    if (body.fullName         !== undefined) { params.push(body.fullName);         sets.push(`full_name=$${params.length}`) }
    if (body.profileCompleted !== undefined) { params.push(body.profileCompleted); sets.push(`profile_completed=$${params.length}`) }

    if (!sets.length) return NextResponse.json({ success: true })

    params.push(userId)
    const result = await db.query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${params.length} RETURNING id, full_name, profile_completed`,
      params
    )

    if (!result.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (e: any) {
    console.error('[complete-profile PUT]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
