export const dynamic = 'force-dynamic'
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
  // Create with all columns from the start
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      audience  VARCHAR(50) NOT NULL DEFAULT 'all',
      school_id UUID,
      title     TEXT NOT NULL,
      body      TEXT,
      type      VARCHAR(50) DEFAULT 'info',
      is_read   BOOLEAN DEFAULT false,
      sent_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // Safe column additions — split NOT NULL from DEFAULT to avoid Postgres version issues
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id UUID`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50)`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW()`).catch(() => {})

  // Set defaults for any NULL values from old rows
  await db.query(`UPDATE notifications SET type = 'info' WHERE type IS NULL`).catch(() => {})
  await db.query(`UPDATE notifications SET is_read = false WHERE is_read IS NULL`).catch(() => {})

  await db.query(`CREATE INDEX IF NOT EXISTS idx_notif_school_id ON notifications(school_id)`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_notif_audience ON notifications(audience)`).catch(() => {})
}

function toNotif(r: any) {
  return {
    id:         r.id,
    title:      r.title || '',
    body:       r.body || '',
    type:       r.type || 'info',
    isRead:     r.is_read === true,
    read:       r.is_read === true,       // alias for parent dashboard
    sentAt:     r.sent_at,
    created_at: r.sent_at,               // alias for parent dashboard
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const user = getUser(req)
    if (!user) return NextResponse.json([])

    const isParent = user.role === 'parent'

    if (!isParent) {
      // School admin — get school-specific + broadcast notifications
      const schoolRes = await db.query(
        'SELECT id FROM schools WHERE admin_user_id=$1', [user.userId]
      ).catch(() => ({ rows: [] }))
      const schoolId = schoolRes.rows[0]?.id || null

      const res = schoolId
        ? await db.query(`
            SELECT id, audience, title, body,
                   COALESCE(type,'info') AS type,
                   COALESCE(is_read,false) AS is_read,
                   sent_at
            FROM notifications
            WHERE school_id = $1
               OR (school_id IS NULL AND audience IN ('school','schools','all'))
            ORDER BY sent_at DESC
            LIMIT 30
          `, [schoolId]).catch(() => ({ rows: [] }))
        : await db.query(`
            SELECT id, audience, title, body,
                   COALESCE(type,'info') AS type,
                   COALESCE(is_read,false) AS is_read,
                   sent_at
            FROM notifications
            WHERE school_id IS NULL
              AND audience IN ('school','schools','all')
            ORDER BY sent_at DESC
            LIMIT 30
          `).catch(() => ({ rows: [] }))

      return NextResponse.json(res.rows.map(toNotif))
    }

    // Parent
    const res = await db.query(`
      SELECT id, audience, title, body,
             COALESCE(type,'info') AS type,
             COALESCE(is_read,false) AS is_read,
             sent_at
      FROM notifications
      WHERE school_id IS NULL
        AND audience IN ('parent','parents','all')
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
              OR (school_id IS NULL AND audience IN ('school','schools','all'))`,
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
