export const dynamic = 'force-dynamic'
/**
 * Consolidated Auth Route  (replaces 9 separate auth/* routes)
 *
 * POST /api/auth?action=register
 * POST /api/auth?action=login-mobile
 * POST /api/auth?action=login-otp
 * POST /api/auth?action=logout
 * POST /api/auth?action=refresh
 * POST /api/auth?action=send-otp
 * POST /api/auth?action=forgot-password
 * POST /api/auth?action=reset-password
 * GET  /api/auth?action=reset-password&token=...  (validate token)
 * PUT  /api/auth?action=complete-profile
 */
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import db from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { logActivity, getClientIP } from '@/lib/activity'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getUserId(req: NextRequest): string | null {
  try {
    const bearer = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (bearer) {
      const p = jwt.verify(bearer, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
      const id = p?.userId || p?.id || null
      if (id) return id
    }
  } catch {}
  try {
    const cookie = req.cookies.get('ts_access_token')?.value || ''
    if (cookie) {
      const p = jwt.verify(cookie, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
      return p?.userId || p?.id || null
    }
  } catch {}
  try {
    const refresh = req.cookies.get('ts_refresh')?.value || ''
    if (refresh) {
      const p = jwt.decode(refresh) as any
      return p?.id || null
    }
  } catch {}
  return null
}

function secureCookie(token: string) {
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production'
  return `ts_refresh=${token}; HttpOnly; Path=/; SameSite=Lax;${isProduction ? ' Secure;' : ''} Max-Age=${7 * 24 * 3600}`
}

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
  const cols = [
    'ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)',
    'ADD COLUMN IF NOT EXISTS email VARCHAR(255)',
    'ADD COLUMN IF NOT EXISTS full_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS password TEXT',
    'ADD COLUMN IF NOT EXISTS password_hash TEXT',
    'ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT false',
    'ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false',
    'ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false',
    'ADD COLUMN IF NOT EXISTS avatar_url TEXT',
    'ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45)',
    'ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ',
  ]
  for (const col of cols) await db.query(`ALTER TABLE users ${col}`).catch(() => {})
}

// ─── action handlers ──────────────────────────────────────────────────────────

async function handleRegister(req: NextRequest) {
  await ensureUsersTable()
  const { phone, name, fullName, email, password, role } = await req.json()
  const displayName = fullName || name
  if (!phone || !password || !displayName)
    return Response.json({ message: 'Name, phone and password required' }, { status: 400 })
  if (password.length < 8)
    return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
  const normalizedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)
  const existing = await db.query('SELECT id FROM users WHERE phone=$1 OR mobile=$1', [normalizedPhone])
  if (existing.rows.length)
    return Response.json({ message: 'Phone number already registered' }, { status: 409 })
  const ip = getClientIP(req as any)
  const ua = req.headers.get('user-agent') || undefined
  const hash = await bcrypt.hash(password, 10)
  const ins = await db.query(
    `INSERT INTO users (phone,mobile,email,full_name,name,password_hash,password,role,is_active,is_phone_verified,profile_completed,last_ip,created_at)
     VALUES ($1,$1,$2,$3,$3,$4,$4,$5,true,false,false,$6,NOW())
     RETURNING id,phone,email,full_name,name,role,created_at,profile_completed`,
    [normalizedPhone, email || null, displayName, hash, role || 'parent', ip]
  )
  const user = ins.rows[0]
  await logActivity(user.id, 'register', `New ${role || 'parent'} account`, ip, ua).catch(() => {})
  const accessToken = signAccessToken({ id: user.id, role: user.role })
  const refreshToken = signRefreshToken({ id: user.id })
  const resp = Response.json({
    user: { id: user.id, phone: user.phone, email: user.email, fullName: user.full_name || user.name, role: user.role, isVerified: false, isActive: true, profileCompleted: false, createdAt: user.created_at },
    accessToken,
  }, { status: 201 })
  resp.headers.set('Set-Cookie', secureCookie(refreshToken))
  return resp
}

async function handleLoginMobile(req: NextRequest) {
  const { phone, password } = await req.json()
  if (!phone || !password)
    return Response.json({ message: 'Phone and password required' }, { status: 400 })
  const normalizedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)
  const res = await db.query(
    `SELECT u.*, up.school_id, s.name AS school_name FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     LEFT JOIN schools s ON s.id = up.school_id
     WHERE u.phone=$1 OR u.mobile=$1`,
    [normalizedPhone]
  )
  if (!res.rows.length) return Response.json({ message: 'No account found with this mobile number' }, { status: 401 })
  const user = res.rows[0]
  if (user.is_active === false) return Response.json({ message: 'Account suspended. Contact support.' }, { status: 403 })
  const storedHash = user.password_hash || user.password
  if (!storedHash) return Response.json({ message: 'Password not set. Please use OTP login or reset your password.' }, { status: 401 })
  const ip = getClientIP(req as any)
  const ua = req.headers.get('user-agent') || undefined
  const valid = await bcrypt.compare(password, storedHash)
  if (!valid) {
    await logActivity(user.id, 'login_failed', 'Wrong password', ip, ua).catch(() => {})
    return Response.json({ message: 'Incorrect password' }, { status: 401 })
  }
  await db.query('UPDATE users SET last_login_at=NOW(), last_ip=$2 WHERE id=$1', [user.id, ip]).catch(() => {})
  await logActivity(user.id, 'login', `Login via password from ${ip}`, ip, ua).catch(() => {})
  const accessToken = signAccessToken({ id: user.id, role: user.role })
  const refreshToken = signRefreshToken({ id: user.id })
  const resp = Response.json({
    user: { id: user.id, phone: user.phone || user.mobile, email: user.email, fullName: user.full_name || user.name, role: user.role, avatarUrl: user.avatar_url, isVerified: user.is_phone_verified || user.is_verified || false, isActive: user.is_active !== false, profileCompleted: user.profile_completed || false, createdAt: user.created_at, schoolName: user.school_name || null },
    accessToken,
  })
  resp.headers.set('Set-Cookie', secureCookie(refreshToken))
  return resp
}

async function handleLoginOtp(req: NextRequest) {
  const { phone, otp } = await req.json()
  if (!phone || !otp) return Response.json({ message: 'Phone and OTP required' }, { status: 400 })
  const ip = getClientIP(req as any)
  const ua = req.headers.get('user-agent') || undefined
  const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  if (!isDev) {
    const otpRes = await db.query('SELECT * FROM otp_codes WHERE phone=$1 AND code=$2 AND used=false AND expires_at > NOW()', [phone, otp]).catch(() => ({ rows: [] }))
    if (!otpRes.rows.length) return Response.json({ message: 'Invalid or expired OTP' }, { status: 401 })
    await db.query('UPDATE otp_codes SET used=true WHERE phone=$1', [phone]).catch(() => {})
  }
  let userRes = await db.query('SELECT * FROM users WHERE phone=$1 OR mobile=$1', [phone])
  if (!userRes.rows.length) {
    const ins = await db.query(
      `INSERT INTO users (phone,mobile,role,is_active,is_phone_verified,profile_completed,last_ip,created_at)
       VALUES ($1,$1,'parent',true,true,false,$2,NOW()) RETURNING *`,
      [phone, ip]
    )
    userRes = ins
    await logActivity(ins.rows[0].id, 'register', 'OTP auto-register', ip, ua)
  }
  const user = userRes.rows[0]
  await db.query('UPDATE users SET last_login_at=NOW(), last_ip=$2, is_phone_verified=true WHERE id=$1', [user.id, ip]).catch(() => {})
  await logActivity(user.id, 'login', `OTP login from ${ip}`, ip, ua)
  const accessToken = signAccessToken({ id: user.id, role: user.role })
  const refreshToken = signRefreshToken({ id: user.id })
  const resp = Response.json({ user: { id: user.id, phone: user.phone || user.mobile, email: user.email, fullName: user.full_name || user.name, role: user.role, isVerified: true, isActive: true, profileCompleted: user.profile_completed || false, createdAt: user.created_at }, accessToken })
  resp.headers.set('Set-Cookie', secureCookie(refreshToken))
  return resp
}

async function handleLogout() {
  const resp = Response.json({ message: 'Logged out' })
  resp.headers.set('Set-Cookie', 'ts_refresh=; HttpOnly; Path=/; Max-Age=0')
  return resp
}

async function handleRefresh(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/ts_refresh=([^;]+)/)
  if (!match) return Response.json({ message: 'No refresh token' }, { status: 401 })
  try {
    const payload = jwt.verify(match[1], process.env.JWT_REFRESH_SECRET!) as { id: string }
    const res = await db.query(
      `SELECT id,role,phone,mobile,email,full_name,avatar_url,is_phone_verified,is_active,profile_completed,created_at FROM users WHERE id=$1 AND is_active=true`,
      [payload.id]
    )
    if (!res.rows.length) return Response.json({ message: 'User not found' }, { status: 401 })
    const u = res.rows[0]
    const accessToken = signAccessToken({ id: u.id, role: u.role })
    return Response.json({ accessToken, user: { id: u.id, phone: u.phone || u.mobile, email: u.email, fullName: u.full_name, role: u.role, avatarUrl: u.avatar_url, isVerified: u.is_phone_verified || false, isActive: u.is_active !== false, profileCompleted: u.profile_completed || false, createdAt: u.created_at } })
  } catch {
    return Response.json({ message: 'Invalid refresh token' }, { status: 401 })
  }
}

async function handleSendOtp(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return Response.json({ message: 'Phone required' }, { status: 400 })
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await db.query(
    `INSERT INTO otp_codes (phone,code,expires_at) VALUES ($1,$2,NOW()+INTERVAL '10 minutes')
     ON CONFLICT (phone) DO UPDATE SET code=$2,expires_at=NOW()+INTERVAL '10 minutes',used=false`,
    [phone, otp]
  ).catch(() => {})
  const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  return Response.json({ message: 'OTP sent', ...(isDev && { otp }) })
}

async function handleForgotPassword(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return Response.json({ message: 'Phone number required' }, { status: 400 })
  const res = await db.query('SELECT id FROM users WHERE phone=$1 OR mobile=$1', [phone])
  if (!res.rows.length) return Response.json({ message: 'If this number is registered, a reset OTP has been sent.' })
  const userId = res.rows[0].id
  const token = crypto.randomBytes(32).toString('hex')
  await db.query('UPDATE password_reset_tokens SET used=true WHERE user_id=$1 AND used=false', [userId]).catch(() => {})
  await db.query(`INSERT INTO password_reset_tokens (user_id,token,expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')`, [userId, token])
  const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  return Response.json({ message: 'If this number is registered, a reset link has been sent.', ...(isDev && { token, resetUrl: `/reset-password?token=${token}` }) })
}

async function handleResetPasswordGet(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return Response.json({ valid: false })
  try {
    const res = await db.query('SELECT id,expires_at,used FROM password_reset_tokens WHERE token=$1', [token])
    if (!res.rows.length) return Response.json({ valid: false, error: 'Invalid link' })
    if (res.rows[0].used) return Response.json({ valid: false, error: 'Already used' })
    if (new Date(res.rows[0].expires_at) < new Date()) return Response.json({ valid: false, error: 'Expired' })
    return Response.json({ valid: true })
  } catch { return Response.json({ valid: false }) }
}

async function handleResetPasswordPost(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token) return Response.json({ message: 'Token required' }, { status: 400 })
  if (!password || password.length < 8) return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
  const res = await db.query('SELECT id,user_id,expires_at,used FROM password_reset_tokens WHERE token=$1', [token])
  if (!res.rows.length) return Response.json({ message: 'Invalid link' }, { status: 400 })
  const row = res.rows[0]
  if (row.used) return Response.json({ message: 'Link already used' }, { status: 400 })
  if (new Date(row.expires_at) < new Date()) return Response.json({ message: 'Link expired' }, { status: 400 })
  const hash = await bcrypt.hash(password, 10)
  await db.query('UPDATE users SET password_hash=$1,password=$1 WHERE id=$2', [hash, row.user_id])
  await db.query('UPDATE password_reset_tokens SET used=true WHERE id=$1', [row.id])
  return Response.json({ message: 'Password updated. Please log in.' })
}

async function handleCompleteProfile(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return Response.json({ error: 'Unauthorized — could not identify user' }, { status: 401 })
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  if (body.fullName !== undefined) { params.push(body.fullName); sets.push(`full_name=$${params.length}`) }
  if (body.profileCompleted !== undefined) { params.push(body.profileCompleted); sets.push(`profile_completed=$${params.length}`) }
  if (!sets.length) return Response.json({ success: true })
  params.push(userId)
  const result = await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$${params.length} RETURNING id,full_name,profile_completed`, params)
  if (!result.rows.length) return Response.json({ error: 'User not found' }, { status: 404 })
  return Response.json({ success: true, user: result.rows[0] })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'reset-password') return await handleResetPasswordGet(req)
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error(`[auth GET:${action}]`, e)
    return Response.json({ message: e.message || 'Action failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'register':        return await handleRegister(req)
      case 'login-mobile':    return await handleLoginMobile(req)
      case 'login-otp':       return await handleLoginOtp(req)
      case 'logout':          return await handleLogout()
      case 'refresh':         return await handleRefresh(req)
      case 'send-otp':        return await handleSendOtp(req)
      case 'forgot-password': return await handleForgotPassword(req)
      case 'reset-password':  return await handleResetPasswordPost(req)
      default:                return Response.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    console.error(`[auth:${action}]`, e)
    return Response.json({ message: e.message || 'Action failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  if (action === 'complete-profile') {
    try { return await handleCompleteProfile(req) }
    catch (e: any) { return Response.json({ error: e.message }, { status: 500 }) }
  }
  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
