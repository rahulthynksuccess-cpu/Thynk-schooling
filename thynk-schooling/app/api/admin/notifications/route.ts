export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureTable() {
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
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id UUID`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50)`).catch(() => {})
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN`).catch(() => {})
  await db.query(`UPDATE notifications SET type='info' WHERE type IS NULL`).catch(() => {})
  await db.query(`UPDATE notifications SET is_read=false WHERE is_read IS NULL`).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()

    const { audience, title, body } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    // Normalize audience values from admin UI
    const normalizedAudience =
      audience === 'schools' ? 'school' :
      audience === 'parents' ? 'parent' : 'all'

    await db.query(
      `INSERT INTO notifications (audience, title, body, type, school_id, is_read)
       VALUES ($1, $2, $3, 'admin_broadcast', NULL, false)`,
      [normalizedAudience, title.trim(), body?.trim() || '']
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[admin/notifications POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const res = await db.query(
      `SELECT id, audience, title, body,
              COALESCE(type,'info') AS type,
              COALESCE(is_read,false) AS is_read,
              sent_at
       FROM notifications
       WHERE school_id IS NULL
       ORDER BY sent_at DESC
       LIMIT 50`
    ).catch(() => ({ rows: [] }))
    return NextResponse.json({ notifications: res.rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
