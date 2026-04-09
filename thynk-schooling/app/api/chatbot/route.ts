import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ── Auth helper — matches exact pattern used across this codebase ────────────
function getAdminUser(req: NextRequest): any | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const payload = verifyAccessToken(token) as any
    return payload?.role === 'super_admin' ? payload : null
  } catch { return null }
}

// ── Migration guard — runs DDL only once per server process ─────────────────
const _migrated = new Set<string>()
async function runOnce(key: string, fn: () => Promise<void>) {
  if (_migrated.has(key)) return
  await fn()
  _migrated.add(key)
}

async function ensureTables() {
  await runOnce('chatbot', async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chatbot_config (
        id         SERIAL PRIMARY KEY,
        key        VARCHAR(100) NOT NULL UNIQUE,
        value      TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await db.query(`
      INSERT INTO chatbot_config (key, value) VALUES
        ('bot_name',          'Thynk Assistant'),
        ('brand_color',       '#FF5C00'),
        ('greeting_message',  'Hi! 👋 Welcome to Thynk Schooling. I help with admissions & fee queries. May I know your name?'),
        ('fallback_message',  'Thanks for asking! Our team will get back to you shortly. Feel free to ask anything about admissions or fees.'),
        ('contact_phone',     '+91 88000 00000'),
        ('contact_email',     'hello@thynkschooling.in'),
        ('bot_enabled',       'true')
      ON CONFLICT (key) DO NOTHING
    `)
    await db.query(`
      CREATE TABLE IF NOT EXISTS chatbot_faqs (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question   TEXT NOT NULL,
        answer     TEXT NOT NULL,
        keywords   TEXT[] NOT NULL DEFAULT '{}',
        is_active  BOOLEAN NOT NULL DEFAULT true,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_active ON chatbot_faqs(is_active)`)
    // Seed default FAQs only if table is empty
    const { rows } = await db.query('SELECT COUNT(*) FROM chatbot_faqs')
    if (parseInt(rows[0].count) === 0) {
      await db.query(`
        INSERT INTO chatbot_faqs (question, answer, keywords, sort_order) VALUES
          ('How do I apply for admission?',
           'You can apply by clicking "Get Started Free" on our website. Fill in your child''s details, choose schools, and submit. Our counsellors will guide you through the rest.',
           ARRAY['apply','admission','enroll','enrol','register','join','how to apply'], 1),
          ('What documents are required for admission?',
           'Typically: Birth Certificate, Aadhar Card of child & parent, Transfer Certificate (if applicable), Passport-size photographs, and Address Proof. Requirements may vary by school.',
           ARRAY['documents','docs','papers','certificate','birth','id proof','required','what documents'], 2),
          ('What is the admission age criteria?',
           'Generally: Nursery: 3–4 years, LKG/KG: 4–5 years, Class 1: 5–6 years. Cut-off dates vary by school (typically March 31 or June 30).',
           ARRAY['age','criteria','class 1','nursery','kg','kindergarten','eligible','age limit'], 3),
          ('What is the fee structure?',
           'Fees vary by school, board, and city. View detailed fee structures on each school''s profile page. Use our fee filter to find schools within your budget.',
           ARRAY['fee','fees','cost','price','charges','structure','fee structure','how much'], 4),
          ('What payment modes are accepted?',
           'Most schools accept UPI, Net Banking, Cheque, and Cash. Thynk Schooling itself is completely free for parents — we do not collect any fees from you.',
           ARRAY['payment','pay','online','upi','cheque','cash','bank','transfer','payment mode'], 5),
          ('Is Thynk Schooling free for parents?',
           'Yes! 100% free for parents. We never charge parents for searching, comparing, applying, or counselling. Our revenue comes from schools who list on our platform.',
           ARRAY['free','charge','cost','pay you','service fee','commission','is it free'], 6),
          ('When does admission season start?',
           'Most schools open admissions between October and February for the April academic year. Some accept applications year-round. Apply early to secure your preferred school.',
           ARRAY['when','start','season','open','begin','dates','timeline','schedule','admission dates'], 7),
          ('What boards are available?',
           'We list schools across CBSE, ICSE, IB (International Baccalaureate), IGCSE, and all State Boards. Filter by board on our schools search page.',
           ARRAY['board','cbse','icse','ib','state','igcse','curriculum','which board'], 8)
      `)
    }
    await db.query(`
      CREATE TABLE IF NOT EXISTS chatbot_sessions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_name   VARCHAR(200),
        user_phone  VARCHAR(30),
        user_email  VARCHAR(200),
        page_url    TEXT,
        started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_msg_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        msg_count   INT NOT NULL DEFAULT 0
      )
    `)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_started ON chatbot_sessions(started_at DESC)`)
    await db.query(`
      CREATE TABLE IF NOT EXISTS chatbot_messages (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
        role       VARCHAR(10) NOT NULL CHECK (role IN ('user','bot')),
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session ON chatbot_messages(session_id, created_at)`)
  })
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  await ensureTables()
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // ── Public: widget loads config + FAQs on init ──
  if (action === 'widget-init') {
    const [cfgRows, faqRows] = await Promise.all([
      db.query('SELECT key, value FROM chatbot_config'),
      db.query('SELECT id, question, answer, keywords FROM chatbot_faqs WHERE is_active = true ORDER BY sort_order ASC'),
    ])
    const config: Record<string, string> = {}
    for (const row of cfgRows.rows) config[row.key] = row.value
    return NextResponse.json({ config, faqs: faqRows.rows })
  }

  // ── Admin-only routes below ──
  if (!getAdminUser(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'config') {
    const { rows } = await db.query('SELECT key, value FROM chatbot_config ORDER BY key')
    const config: Record<string, string> = {}
    for (const row of rows) config[row.key] = row.value
    return NextResponse.json(config)
  }

  if (action === 'faqs') {
    const { rows } = await db.query('SELECT * FROM chatbot_faqs ORDER BY sort_order ASC, created_at ASC')
    return NextResponse.json(rows)
  }

  if (action === 'sessions') {
    const page   = parseInt(searchParams.get('page')  || '1')
    const limit  = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    const [dataRes, countRes] = search
      ? await Promise.all([
          db.query(`SELECT * FROM chatbot_sessions WHERE user_name ILIKE $3 OR user_phone ILIKE $3 OR user_email ILIKE $3 ORDER BY started_at DESC LIMIT $1 OFFSET $2`, [limit, offset, `%${search}%`]),
          db.query(`SELECT COUNT(*) FROM chatbot_sessions WHERE user_name ILIKE $1 OR user_phone ILIKE $1 OR user_email ILIKE $1`, [`%${search}%`]),
        ])
      : await Promise.all([
          db.query(`SELECT * FROM chatbot_sessions ORDER BY started_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
          db.query(`SELECT COUNT(*) FROM chatbot_sessions`),
        ])

    return NextResponse.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) })
  }

  if (action === 'messages') {
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    const { rows } = await db.query(
      'SELECT * FROM chatbot_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    )
    return NextResponse.json(rows)
  }

  if (action === 'stats') {
    const [total, today, withUser, faqCount] = await Promise.all([
      db.query('SELECT COUNT(*) FROM chatbot_sessions'),
      db.query("SELECT COUNT(*) FROM chatbot_sessions WHERE started_at >= CURRENT_DATE"),
      db.query("SELECT COUNT(*) FROM chatbot_sessions WHERE user_name IS NOT NULL"),
      db.query('SELECT COUNT(*) FROM chatbot_faqs WHERE is_active = true'),
    ])
    return NextResponse.json({
      totalSessions:   parseInt(total.rows[0].count),
      todaySessions:   parseInt(today.rows[0].count),
      identifiedLeads: parseInt(withUser.rows[0].count),
      activeFaqs:      parseInt(faqCount.rows[0].count),
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  await ensureTables()
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  // ── Public: start session ──
  if (action === 'session-start') {
    const { userName, userPhone, userEmail, pageUrl } = body
    const { rows } = await db.query(
      `INSERT INTO chatbot_sessions (user_name, user_phone, user_email, page_url)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userName || null, userPhone || null, userEmail || null, pageUrl || null]
    )
    return NextResponse.json({ sessionId: rows[0].id })
  }

  // ── Public: save a message ──
  if (action === 'message') {
    const { sessionId, role, content } = body
    if (!sessionId || !role || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    await db.query(
      `INSERT INTO chatbot_messages (session_id, role, content) VALUES ($1, $2, $3)`,
      [sessionId, role, content]
    )
    await db.query(
      `UPDATE chatbot_sessions SET last_msg_at = NOW(), msg_count = msg_count + 1 WHERE id = $1`,
      [sessionId]
    )
    return NextResponse.json({ ok: true })
  }

  // ── Admin-only routes below ──
  if (!getAdminUser(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'config') {
    const { updates } = body
    for (const [key, value] of Object.entries(updates)) {
      await db.query(
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
      await db.query(
        `UPDATE chatbot_faqs SET question=$1, answer=$2, keywords=$3, is_active=$4, sort_order=$5, updated_at=NOW() WHERE id=$6`,
        [question, answer, keywords, isActive ?? true, sortOrder ?? 0, id]
      )
    } else {
      const { rows } = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM chatbot_faqs')
      await db.query(
        `INSERT INTO chatbot_faqs (question, answer, keywords, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [question, answer, keywords, isActive ?? true, rows[0].n]
      )
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!getAdminUser(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (action === 'faq' && id) {
    await db.query('DELETE FROM chatbot_faqs WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  }

  if (action === 'session' && id) {
    await db.query('DELETE FROM chatbot_sessions WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
