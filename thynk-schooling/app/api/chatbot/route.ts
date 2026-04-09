import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// ── Auth helper ──────────────────────────────────────────────────────────────
async function isAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return false
  try {
    const payload = await verifyToken(token)
    return payload?.role === 'admin'
  } catch { return false }
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // Public: get config + FAQs for the widget
  if (action === 'widget-init') {
    const [cfgRows, faqRows] = await Promise.all([
      pool.query('SELECT key, value FROM chatbot_config'),
      pool.query('SELECT id, question, answer, keywords FROM chatbot_faqs WHERE is_active = true ORDER BY sort_order ASC'),
    ])
    const config: Record<string, string> = {}
    for (const row of cfgRows.rows) config[row.key] = row.value
    return NextResponse.json({ config, faqs: faqRows.rows })
  }

  // Admin only below
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'config') {
    const { rows } = await pool.query('SELECT key, value FROM chatbot_config ORDER BY key')
    const config: Record<string, string> = {}
    for (const row of rows) config[row.key] = row.value
    return NextResponse.json(config)
  }

  if (action === 'faqs') {
    const { rows } = await pool.query('SELECT * FROM chatbot_faqs ORDER BY sort_order ASC, created_at ASC')
    return NextResponse.json(rows)
  }

  if (action === 'sessions') {
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    const where = search
      ? `WHERE user_name ILIKE $3 OR user_phone ILIKE $3 OR user_email ILIKE $3`
      : ''
    const params: any[] = search ? [limit, offset, `%${search}%`] : [limit, offset]

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM chatbot_sessions ${where} ORDER BY started_at DESC LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM chatbot_sessions ${where}`,
        search ? [`%${search}%`] : []
      ),
    ])
    return NextResponse.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) })
  }

  if (action === 'messages') {
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    const { rows } = await pool.query(
      'SELECT * FROM chatbot_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    )
    return NextResponse.json(rows)
  }

  if (action === 'stats') {
    const [total, today, withUser] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM chatbot_sessions'),
      pool.query("SELECT COUNT(*) FROM chatbot_sessions WHERE started_at >= CURRENT_DATE"),
      pool.query("SELECT COUNT(*) FROM chatbot_sessions WHERE user_name IS NOT NULL"),
    ])
    const faqCount = await pool.query('SELECT COUNT(*) FROM chatbot_faqs WHERE is_active = true')
    return NextResponse.json({
      totalSessions: parseInt(total.rows[0].count),
      todaySessions: parseInt(today.rows[0].count),
      identifiedLeads: parseInt(withUser.rows[0].count),
      activeFaqs: parseInt(faqCount.rows[0].count),
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  // Public: start a chat session
  if (action === 'session-start') {
    const { userName, userPhone, userEmail, pageUrl } = body
    const { rows } = await pool.query(
      `INSERT INTO chatbot_sessions (user_name, user_phone, user_email, page_url)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userName || null, userPhone || null, userEmail || null, pageUrl || null]
    )
    return NextResponse.json({ sessionId: rows[0].id })
  }

  // Public: save a message
  if (action === 'message') {
    const { sessionId, role, content } = body
    if (!sessionId || !role || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    await pool.query(
      `INSERT INTO chatbot_messages (session_id, role, content) VALUES ($1, $2, $3)`,
      [sessionId, role, content]
    )
    await pool.query(
      `UPDATE chatbot_sessions SET last_msg_at = NOW(), msg_count = msg_count + 1 WHERE id = $1`,
      [sessionId]
    )
    return NextResponse.json({ ok: true })
  }

  // Admin only below
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'config') {
    const { updates } = body // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO chatbot_config (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      )
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'faq-upsert') {
    const { id, question, answer, keywords, isActive, sortOrder } = body
    if (id) {
      await pool.query(
        `UPDATE chatbot_faqs SET question=$1, answer=$2, keywords=$3, is_active=$4, sort_order=$5, updated_at=NOW() WHERE id=$6`,
        [question, answer, keywords, isActive ?? true, sortOrder ?? 0, id]
      )
    } else {
      const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM chatbot_faqs')
      await pool.query(
        `INSERT INTO chatbot_faqs (question, answer, keywords, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [question, answer, keywords, isActive ?? true, maxOrder.rows[0].n]
      )
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (action === 'faq' && id) {
    await pool.query('DELETE FROM chatbot_faqs WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  }

  if (action === 'session' && id) {
    await pool.query('DELETE FROM chatbot_sessions WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
