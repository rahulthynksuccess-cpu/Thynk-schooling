export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import db from '@/lib/db'
import { signAccessToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const match  = cookie.match(/ts_refresh=([^;]+)/)
    if (!match) return Response.json({ message: 'No refresh token' }, { status: 401 })

    const payload = jwt.verify(match[1], process.env.JWT_REFRESH_SECRET!) as { id: string }
    const res = await db.query('SELECT id, role FROM users WHERE id=$1 AND is_active=true', [payload.id])
    if (!res.rows.length) return Response.json({ message: 'User not found' }, { status: 401 })

    const accessToken = signAccessToken({ id: res.rows[0].id, role: res.rows[0].role })
    return Response.json({ accessToken })
  } catch {
    return Response.json({ message: 'Invalid refresh token' }, { status: 401 })
  }
}
