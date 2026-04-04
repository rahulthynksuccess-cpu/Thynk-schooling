export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { logActivity, getClientIP } from '@/lib/activity'

async function ensureUsersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone             VARCHAR(20) UNIQUE,
      mobile            VARCHAR(20),
      email             VARCHAR(255),
      full_name         VARCHAR(200),
      name              VARCHAR(200),
      password_hash     TEXT,
      password          TEXT,
      role              VARCHAR(30) NOT NULL DEFAULT 'parent',
      is_active         BOOLEAN NOT NULL DEFAULT true,
      is_phone_verified BOOLEAN NOT NULL DEFAULT false,
      is_verified       BOOLEAN NOT NULL DEFAULT false,
      profile_completed BOOLEAN NOT NULL DEFAULT false,
      avatar_url        TEXT,
      last_ip           VARCHAR(45),
      last_login_at     TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})
  // safe column migrations for existing tables
  const cols = [
    "ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)",
    "ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS full_name VARCHAR(200)",
    "ADD COLUMN IF NOT EXISTS name VARCHAR(200)",
    "ADD COLUMN IF NOT EXISTS password TEXT",
    "ADD COLUMN IF NOT EXISTS password_hash TEXT",
    "ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT false",
    "ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false",
    "ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false",
    "ADD COLUMN IF NOT EXISTS avatar_url TEXT",
    "ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45)",
    "ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ",
  ]
  for (const col of cols) {
    await db.query(`ALTER TABLE users ${col}`).catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUsersTable()

    const { phone, name, fullName, email, password, role, otp } = await req.json()
    const displayName = fullName || name

    if (!phone || !password || !displayName)
      return Response.json({ message: 'Name, phone and password required' }, { status: 400 })

    if (password.length < 8)
      return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })

    // Normalize phone — strip +91 prefix if present
    const normalizedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)

    const existing = await db.query(
      'SELECT id FROM users WHERE phone=$1 OR mobile=$1', [normalizedPhone]
    )
    if (existing.rows.length)
      return Response.json({ message: 'Phone number already registered' }, { status: 409 })

    const ip   = getClientIP(req as any)
    const ua   = req.headers.get('user-agent') || undefined
    const hash = await bcrypt.hash(password, 10)

    const ins = await db.query(
      `INSERT INTO users (phone, mobile, email, full_name, name, password_hash, password, role, is_active, is_phone_verified, profile_completed, last_ip, created_at)
       VALUES ($1,$1,$2,$3,$3,$4,$4,$5,true,false,false,$6,NOW())
       RETURNING id, phone, email, full_name, name, role, created_at, profile_completed`,
      [normalizedPhone, email || null, displayName, hash, role || 'parent', ip]
    )
    const user = ins.rows[0]

    await logActivity(user.id, 'register', `New ${role || 'parent'} account`, ip, ua).catch(() => {})

    const accessToken  = signAccessToken ({ id: user.id, role: user.role })
    const refreshToken = signRefreshToken({ id: user.id })

    const resp = Response.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name || user.name,
        role: user.role,
        isVerified: false,
        isActive: true,
        profileCompleted: false,
        createdAt: user.created_at,
      },
      accessToken,
    }, { status: 201 })

    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production'
    resp.headers.set('Set-Cookie',
      `ts_refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Lax;${isProduction ? ' Secure;' : ''} Max-Age=${7*24*3600}`)
    return resp
  } catch (err: any) {
    console.error('[register]', err)
    return Response.json({ message: err.message || 'Registration failed' }, { status: 500 })
  }
}
