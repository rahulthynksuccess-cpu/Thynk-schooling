export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return Response.json({ message: 'Phone number required' }, { status: 400 })

    const res = await db.query('SELECT id FROM users WHERE phone=$1 OR mobile=$1', [phone])
    if (!res.rows.length)
      return Response.json({ message: 'If this number is registered, a reset OTP has been sent.' })

    const userId = res.rows[0].id
    const token  = crypto.randomBytes(32).toString('hex')
    await db.query("UPDATE password_reset_tokens SET used=true WHERE user_id=$1 AND used=false", [userId]).catch(() => {})
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')`,
      [userId, token]
    )

    const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    return Response.json({
      message: 'If this number is registered, a reset link has been sent.',
      ...(isDev && { token, resetUrl: `/reset-password?token=${token}` }),
    })
  } catch (err) {
    return Response.json({ message: 'Request failed' }, { status: 500 })
  }
}
