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

    // Normalize — accept with/without +91, with/without spaces
    const normalizedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)

    const res = await db.query(
      `SELECT u.*, up.school_id, s.name AS school_name
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       LEFT JOIN schools s ON s.id = up.school_id
       WHERE u.phone = $1 OR u.mobile = $1`,
      [normalizedPhone]
    )

    if (!res.rows.length)
      return Response.json({ message: 'No account found with this mobile number' }, { status: 401 })

    const user = res.rows[0]

    if (user.is_active === false)
      return Response.json({ message: 'Account suspended. Contact support.' }, { status: 403 })

    const storedHash = user.password_hash || user.password
    if (!storedHash)
      return Response.json({ message: 'Password not set. Please use OTP login or reset your password.' }, { status: 401 })

    const valid = await bcrypt.compare(password, storedHash)
    const ip    = getClientIP(req as any)
    const ua    = req.headers.get('user-agent') || undefined

    if (!valid) {
      await logActivity(user.id, 'login_failed', 'Wrong password', ip, ua).catch(() => {})
      return Response.json({ message: 'Incorrect password' }, { status: 401 })
    }

    await db.query(
      'UPDATE users SET last_login_at=NOW(), last_ip=$2 WHERE id=$1', [user.id, ip]
    ).catch(() => {})
    await logActivity(user.id, 'login', `Login via password from ${ip}`, ip, ua).catch(() => {})

    const accessToken  = signAccessToken ({ id: user.id, role: user.role })
    const refreshToken = signRefreshToken({ id: user.id })

    const resp = Response.json({
      user: {
        id:               user.id,
        phone:            user.phone || user.mobile,
        email:            user.email,
        fullName:         user.full_name || user.name,
        role:             user.role,
        avatarUrl:        user.avatar_url,
        isVerified:       user.is_phone_verified || user.is_verified || false,
        isActive:         user.is_active !== false,
        profileCompleted: user.profile_completed || false,
        createdAt:        user.created_at,
        schoolName:       user.school_name || null,
      },
      accessToken,
    })

    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production'
    resp.headers.set('Set-Cookie',
      `ts_refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Lax;${isProduction ? ' Secure;' : ''} Max-Age=${7*24*3600}`)
    return resp
  } catch (err: any) {
    console.error('[login-mobile]', err)
    return Response.json({ message: 'Login failed. Please try again.' }, { status: 500 })
  }
}
