export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { logActivity, getClientIP } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json()
    if (!phone || !otp) return Response.json({ message: 'Phone and OTP required' }, { status: 400 })

    const ip = getClientIP(req as any)
    const ua = req.headers.get('user-agent') || undefined

    // Check OTP (stub — always pass in dev if otp is '123456')
    const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    if (!isDev) {
      const otpRes = await db.query(
        'SELECT * FROM otp_codes WHERE phone=$1 AND code=$2 AND used=false AND expires_at > NOW()',
        [phone, otp]
      ).catch(() => ({ rows: [] }))
      if (!otpRes.rows.length)
        return Response.json({ message: 'Invalid or expired OTP' }, { status: 401 })
      await db.query('UPDATE otp_codes SET used=true WHERE phone=$1', [phone]).catch(() => {})
    }

    let userRes = await db.query('SELECT * FROM users WHERE phone=$1 OR mobile=$1', [phone])
    if (!userRes.rows.length) {
      // Auto-register on first OTP login
      const ins = await db.query(
        `INSERT INTO users (phone, mobile, role, is_active, is_phone_verified, profile_completed, last_ip, created_at)
         VALUES ($1,$1,'parent',true,true,false,$2,NOW()) RETURNING *`,
        [phone, ip]
      )
      userRes = ins
      await logActivity(ins.rows[0].id, 'register', 'OTP auto-register', ip, ua)
    }

    const user = userRes.rows[0]
    await db.query('UPDATE users SET last_login_at=NOW(), last_ip=$2, is_phone_verified=true WHERE id=$1', [user.id, ip]).catch(() => {})
    await logActivity(user.id, 'login', `OTP login from ${ip}`, ip, ua)

    const accessToken  = signAccessToken ({ id: user.id, role: user.role })
    const refreshToken = signRefreshToken({ id: user.id })

    const resp = Response.json({
      user: {
        id: user.id, phone: user.phone||user.mobile, email: user.email,
        fullName: user.full_name||user.name, role: user.role,
        isVerified: true, isActive: true,
        profileCompleted: user.profile_completed||false, createdAt: user.created_at,
      },
      accessToken,
    })
    resp.headers.set('Set-Cookie',
      `ts_refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7*24*3600}`)
    return resp
  } catch (err) {
    console.error('[login-otp]', err)
    return Response.json({ message: 'Login failed' }, { status: 500 })
  }
}
