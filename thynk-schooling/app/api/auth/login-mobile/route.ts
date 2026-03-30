export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { logActivity, getClientIP } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()
    if (!phone || !password)
      return Response.json({ message: 'Phone and password required' }, { status: 400 })

    const res = await db.query(
      `SELECT u.*, up.school_id, s.name AS school_name
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       LEFT JOIN schools s ON s.id = up.school_id
       WHERE u.phone = $1 OR u.mobile = $1`,
      [phone]
    )

    if (!res.rows.length)
      return Response.json({ message: 'Invalid credentials' }, { status: 401 })

    const user = res.rows[0]
    if (!user.is_active && user.is_active !== undefined)
      return Response.json({ message: 'Account suspended. Contact support.' }, { status: 403 })

    const valid = await bcrypt.compare(password, user.password_hash || user.password)
    const ip = getClientIP(req as any)
    const ua = req.headers.get('user-agent') || undefined

    if (!valid) {
      await logActivity(user.id, 'login_failed', 'Wrong password', ip, ua)
      return Response.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login + IP
    await db.query(
      'UPDATE users SET last_login_at = NOW(), last_ip = $2 WHERE id = $1',
      [user.id, ip]
    ).catch(() => {})

    await logActivity(user.id, 'login', `Login via password from ${ip}`, ip, ua)

    const accessToken  = signAccessToken ({ id: user.id, role: user.role })
    const refreshToken = signRefreshToken({ id: user.id })

    const resp = Response.json({
      user: {
        id: user.id, phone: user.phone || user.mobile,
        email: user.email, fullName: user.full_name || user.name,
        role: user.role, avatarUrl: user.avatar_url,
        isVerified: user.is_phone_verified || user.is_verified || false,
        isActive: user.is_active !== false,
        profileCompleted: user.profile_completed || false,
        createdAt: user.created_at,
        schoolName: user.school_name || null,
      },
      accessToken,
    })

    resp.headers.set('Set-Cookie',
      `ts_refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7*24*3600}`)
    return resp
  } catch (err) {
    console.error('[login-mobile]', err)
    return Response.json({ message: 'Login failed' }, { status: 500 })
  }
}
