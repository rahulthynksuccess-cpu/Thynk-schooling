export const dynamic = 'force-dynamic'
/**
 * GET  /api/notifications        — fetch notifications for current user
 * POST /api/notifications?action=mark-read&id=X
 * POST /api/notifications?action=mark-all-read
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUser(req: NextRequest): { userId: string; role: string } | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return { userId: p?.userId || p?.id || '', role: p?.role || 'school' }
  } catch { return null }
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      audience  VARCHAR(50) NOT NULL DEFAULT 'all',
      school_id UUID,
      title     TEXT NOT NULL,
      body      TEXT,
      type      VARCHAR(50) NOT NULL DEFAULT 'info',
      is_read   BOOLEAN NOT NULL DEFAULT false,
      sent_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id UUID`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'info'`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_notif_school_id ON notifications(school_id)`).catch(() => {})
}

function toNotif(r: any) {
  return {
    id:         r.id,
    title:      r.title,
    body:       r.body || '',
    type:       r.type || 'info',
    isRead:     r.is_read || false,
    read:       r.is_read || false,      // alias for parent dashboard
    sentAt:     r.sent_at,
    created_at: r.sent_at,              // alias for parent dashboard
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const user = getUser(req)
    if (!user) return NextResponse.json([])

    const isParent = user.role === 'parent'
    const audience = isParent ? 'parent' : 'school'

    if (!isParent) {
      // School: get school-specific notifications + broadcast to 'school' or 'all'
      const schoolRes = await db.query(
        'SELECT id FROM schools WHERE admin_user_id=$1', [user.userId]
      ).catch(() => ({ rows: [] }))
      const schoolId = schoolRes.rows[0]?.id || null

      let rows: any[] = []
      if (schoolId) {
        const res = await db.query(`
          SELECT id, audience, title, body, type, is_read, sent_at
          FROM notifications
          WHERE school_id = $1
             OR (school_id IS NULL AND audience IN ('school', 'all'))
          ORDER BY sent_at DESC
          LIMIT 30
        `, [schoolId]).catch(() => ({ rows: [] }))
        rows = res.rows
      } else {
        // No school found — just return broadcast notifications
        const res = await db.query(`
          SELECT id, audience, title, body, type, is_read, sent_at
          FROM notifications
          WHERE school_id IS NULL AND audience IN ('school', 'all')
          ORDER BY sent_at DESC LIMIT 30
        `).catch(() => ({ rows: [] }))
        rows = res.rows
      }
      return NextResponse.json(rows.map(toNotif))
    }

    // Parent: get parent-targeted + all-audience notifications
    const res = await db.query(`
      SELECT id, audience, title, body, type, is_read, sent_at
      FROM notifications
      WHERE audience IN ('parent', 'all')
        AND school_id IS NULL
      ORDER BY sent_at DESC
      LIMIT 30
    `).catch(() => ({ rows: [] }))
    return NextResponse.json(res.rows.map(toNotif))

  } catch (e: any) {
    console.error('[notifications GET]', e)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (action === 'mark-read') {
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      await db.query(`UPDATE notifications SET is_read=true WHERE id=$1`, [id])
      return NextResponse.json({ success: true })
    }

    if (action === 'mark-all-read') {
      const schoolRes = await db.query(
        'SELECT id FROM schools WHERE admin_user_id=$1', [user.userId]
      ).catch(() => ({ rows: [] }))
      const schoolId = schoolRes.rows[0]?.id

      if (schoolId) {
        await db.query(
          `UPDATE notifications SET is_read=true
           WHERE school_id=$1
              OR (school_id IS NULL AND audience IN ('school','all'))`,
          [schoolId]
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
