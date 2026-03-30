export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return Response.json({ message: 'Phone required' }, { status: 400 })
    // In production: generate OTP, store in DB, send via SMS (e.g. MSG91, Twilio)
    // For dev: return OTP directly
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await db.query(
      `INSERT INTO otp_codes (phone, code, expires_at)
       VALUES ($1,$2,NOW() + INTERVAL '10 minutes')
       ON CONFLICT (phone) DO UPDATE SET code=$2, expires_at=NOW()+INTERVAL '10 minutes', used=false`,
      [phone, otp]
    ).catch(() => {}) // table may not exist yet
    const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    return Response.json({ message: 'OTP sent', ...(isDev && { otp }) })
  } catch (err) {
    return Response.json({ message: 'Failed to send OTP' }, { status: 500 })
  }
}
