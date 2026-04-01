export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { logActivity, getClientIP } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const { phone, name, fullName, email, password, role } = await req.json()
    const displayName = fullName || name
    if (!phone || !password || !displayName)
      return Response.json({ message: 'Name, phone and password required' }, { status: 400 })

    const existing = await db.query('SELECT id FROM users WHERE phone=$1 OR mobile=$1', [phone])
    if (existing.rows.length)
      return Response.json({ message: 'Phone number already registered' }, { status: 409 })

    const ip   = getClientIP(req as any)
    const ua   = req.headers.get('user-agent') || undefined
    const hash = await bcrypt.hash(password, 10)

    const ins = await db.query(
      `INSERT INTO users (phone, mobile, email, full_name, name, password_hash, password, role, is_active, is_phone_verified, profile_completed, last_ip, created_at)
       VALUES ($1,$1,$2,$3,$3,$4,$4,$5,true,false,false,$6,NOW())
       RETURNING id, phone, email, full_name, name, role, created_at`,
      [phone, email || null, displayName, hash, role || 'parent', ip]
    )
    const user = ins.rows[0]

    await logActivity(user.id, 'register', `New ${role || 'parent'} account`, ip, ua)

    const accessToken  = signAccessToken ({ id: user.id, role: user.role })
    const refreshToken = signRefreshToken({ id: user.id })

    const resp = Response.json({
      user: {
        id: user.id, phone: user.phone, email: user.email,
        fullName: user.full_name || user.name, role: user.role,
        isVerified: false, isActive: true, profileCompleted: false,
        createdAt: user.created_at,
      },
      accessToken,
    }, { status: 201 })

    // SameSite=Lax (was Strict) — required for iOS Safari compatibility when
    // the API is served via the Next.js same-origin proxy (see next.config.js).
    // Lax still blocks the cookie on cross-site POST requests, so it remains secure.
    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production'
    resp.headers.set(
      'Set-Cookie',
      `ts_refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Lax;${isProduction ? ' Secure;' : ''} Max-Age=${7 * 24 * 3600}`
    )
    return resp
  } catch (err) {
    console.error('[register]', err)
    return Response.json({ message: 'Registration failed' }, { status: 500 })
  }
}
