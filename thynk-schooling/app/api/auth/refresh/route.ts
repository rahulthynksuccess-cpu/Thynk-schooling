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

    const res = await db.query(
      `SELECT id, role, phone, mobile, email, full_name, avatar_url,
              is_phone_verified, is_active, profile_completed, created_at
       FROM users WHERE id=$1 AND is_active=true`,
      [payload.id]
    )
    if (!res.rows.length) return Response.json({ message: 'User not found' }, { status: 401 })

    const u = res.rows[0]
    const accessToken = signAccessToken({ id: u.id, role: u.role })

    return Response.json({
      accessToken,
      user: {
        id:               u.id,
        phone:            u.phone || u.mobile,
        email:            u.email,
        fullName:         u.full_name,
        role:             u.role,
        avatarUrl:        u.avatar_url,
        isVerified:       u.is_phone_verified || false,
        isActive:         u.is_active !== false,
        profileCompleted: u.profile_completed || false,
        createdAt:        u.created_at,
      },
    })
  } catch (e) {
    console.error('[refresh]', e)
    return Response.json({ message: 'Invalid refresh token' }, { status: 401 })
  }
}
