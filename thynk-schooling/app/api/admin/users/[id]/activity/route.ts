export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const p = verifyAccessToken(req.headers.get('authorization')?.replace('Bearer ','') || '') as any
    if (p?.role !== 'super_admin') return Response.json({ message: 'Forbidden' }, { status: 403 })
  } catch { return Response.json({ message: 'Forbidden' }, { status: 403 }) }

  try {
    const limit = Math.min(50, Number(new URL(req.url).searchParams.get('limit') || 30))
    const res = await db.query(
      `SELECT id, action, detail, ip_address, user_agent, created_at
       FROM user_activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [params.id, limit]
    )
    return Response.json({ logs: res.rows })
  } catch (err) {
    return Response.json({ message: 'Failed' }, { status: 500 })
  }
}
