export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return Response.json({ valid: false })
  try {
    const res = await db.query(
      'SELECT id, expires_at, used FROM password_reset_tokens WHERE token=$1', [token]
    )
    if (!res.rows.length) return Response.json({ valid: false, error: 'Invalid link' })
    if (res.rows[0].used) return Response.json({ valid: false, error: 'Already used' })
    if (new Date(res.rows[0].expires_at) < new Date()) return Response.json({ valid: false, error: 'Expired' })
    return Response.json({ valid: true })
  } catch { return Response.json({ valid: false }) }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token) return Response.json({ message: 'Token required' }, { status: 400 })
    if (!password || password.length < 8)
      return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })

    const res = await db.query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token=$1', [token]
    )
    if (!res.rows.length) return Response.json({ message: 'Invalid link' }, { status: 400 })
    const row = res.rows[0]
    if (row.used) return Response.json({ message: 'Link already used' }, { status: 400 })
    if (new Date(row.expires_at) < new Date()) return Response.json({ message: 'Link expired' }, { status: 400 })

    const hash = await bcrypt.hash(password, 10)
    await db.query('UPDATE users SET password_hash=$1, password=$1 WHERE id=$2', [hash, row.user_id])
    await db.query('UPDATE password_reset_tokens SET used=true WHERE id=$1', [row.id])

    return Response.json({ message: 'Password updated. Please log in.' })
  } catch (err) {
    return Response.json({ message: 'Reset failed' }, { status: 500 })
  }
}
