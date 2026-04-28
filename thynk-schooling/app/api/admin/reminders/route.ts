export const dynamic = 'force-dynamic'
/**
 * /api/admin/reminders
 *
 * Full CRUD for the automated reminder scheduler.
 * Reminders are rules like:
 *   "3 days after a lead is created and not unlocked → send Email + WhatsApp to school"
 *
 * DB table: reminder_schedules
 *   id, name, trigger_event, delay_days, channels (json), message_email_subject,
 *   message_email_body, message_wa_body, wa_template_name, wa_template_lang,
 *   is_active, created_at, updated_at
 *
 * Also exposes GET /api/admin/reminders?action=logs for execution history.
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return false
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.role === 'admin' || p?.role === 'super_admin'
  } catch { return false }
}

// ─── Ensure tables ────────────────────────────────────────────────────────────
let tablesEnsured = false
async function ensureTables() {
  if (tablesEnsured) return
  // Main schedules table
  await db.query(`
    CREATE TABLE IF NOT EXISTS reminder_schedules (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                  VARCHAR(200)  NOT NULL,
      trigger_event         VARCHAR(100)  NOT NULL,
      delay_days            INTEGER       NOT NULL DEFAULT 1,
      delay_hours           INTEGER       NOT NULL DEFAULT 0,
      channels              JSONB         NOT NULL DEFAULT '["email"]',
      message_email_subject TEXT          NOT NULL DEFAULT '',
      message_email_body    TEXT          NOT NULL DEFAULT '',
      message_wa_body       TEXT          NOT NULL DEFAULT '',
      wa_template_name      VARCHAR(200)  DEFAULT '',
      wa_template_lang      VARCHAR(20)   DEFAULT 'en',
      repeat_every_days     INTEGER       DEFAULT 0,
      max_repeats           INTEGER       DEFAULT 1,
      stop_on_events        JSONB         NOT NULL DEFAULT '[]',
      target_audience       VARCHAR(50)   NOT NULL DEFAULT 'school',
      is_active             BOOLEAN       NOT NULL DEFAULT true,
      sort_order            INTEGER       NOT NULL DEFAULT 0,
      created_at            TIMESTAMPTZ   DEFAULT NOW(),
      updated_at            TIMESTAMPTZ   DEFAULT NOW()
    )
  `).catch(() => {})

  // Execution log table — tracks which reminders have been sent to which schools
  await db.query(`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      schedule_id         UUID NOT NULL REFERENCES reminder_schedules(id) ON DELETE CASCADE,
      school_id           UUID,
      lead_id             UUID,
      trigger_event       VARCHAR(100),
      channels_sent       JSONB NOT NULL DEFAULT '[]',
      status              VARCHAR(50) NOT NULL DEFAULT 'sent',
      error_message       TEXT,
      sent_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_rl_schedule_id  ON reminder_logs(schedule_id)`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_rl_school_id    ON reminder_logs(school_id)`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_rl_lead_id      ON reminder_logs(lead_id)`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_rs_trigger_event ON reminder_schedules(trigger_event)`).catch(() => {})

  // Add template_style column to message_triggers if missing (for the email.ts upgrade)
  await db.query(`ALTER TABLE message_triggers ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'default'`).catch(() => {})

  // Seed the new_lead_available trigger if it doesn't exist yet
  await db.query(`
    INSERT INTO message_triggers
      (trigger_key, category, event, description, recipients, variables,
       email_school_subject, email_school_body, email_school_enabled,
       email_parent_subject, email_parent_body, email_parent_enabled,
       wa_school_body, wa_school_enabled, wa_parent_body, wa_parent_enabled,
       template_style, sort_order)
    VALUES (
      'new_lead_available', 'Leads', 'New Lead Available for Unlock',
      'Sent when a new lead is discovered/available for a school to unlock. Uses a rich lead-card email template.',
      '["school"]',
      '["{{school_name}}","{{child_name}}","{{class_applying}}","{{city}}","{{masked_name}}","{{masked_phone}}","{{source}}","{{leads_count}}","{{unlock_url}}","{{dashboard_url}}"]',
      'New admission lead available — {{school_name}}',
      'Hi,

A parent has enquired about admissions at {{school_name}}.

Child: {{child_name}} | Class: {{class_applying}} | City: {{city}}

Unlock this lead to access their full contact details.

Dashboard: {{dashboard_url}}',
      true,
      '', '', false,
      '🔔 *New lead for {{school_name}}!*

Child: {{child_name}} | Class: {{class_applying}} | City: {{city}}

Unlock contact details 👉 {{dashboard_url}}',
      true, '', false,
      'lead', 3
    )
    ON CONFLICT (trigger_key) DO UPDATE SET
      template_style = 'lead',
      email_school_enabled = true,
      wa_school_enabled = true,
      updated_at = NOW()
  `).catch(() => {})

  // Seed default reminder schedules if empty
  const ct = await db.query('SELECT COUNT(*) FROM reminder_schedules').catch(() => ({ rows: [{ count: '0' }] }))
  if (parseInt(ct.rows[0].count) === 0) {
    const defaults = [
      {
        name: 'Unlock Reminder — Day 2',
        trigger_event: 'lead_not_unlocked',
        delay_days: 2,
        delay_hours: 9,
        channels: ['email', 'whatsapp'],
        message_email_subject: 'Reminder: {{leads_count}} lead(s) waiting to be unlocked — {{school_name}}',
        message_email_body: `Hi {{school_name}},

You have {{leads_count}} lead(s) that have not been unlocked yet.

These parents are looking for schools — don't let them wait too long.

Unlock now: {{dashboard_url}}

The Thynk Schooling Team`,
        message_wa_body: `⏰ *Reminder: {{leads_count}} lead(s) waiting!*\n\nHi {{school_name}}, you still have unlocked leads from interested parents.\n\nUnlock now 👉 {{dashboard_url}}`,
        wa_template_name: 'lead_unlock_reminder',
        wa_template_lang: 'en',
        repeat_every_days: 0,
        max_repeats: 1,
        stop_on_events: ['lead_unlocked'],
        target_audience: 'school',
        sort_order: 0,
      },
      {
        name: 'Unlock Reminder — Day 5',
        trigger_event: 'lead_not_unlocked',
        delay_days: 5,
        delay_hours: 10,
        channels: ['email'],
        message_email_subject: 'Last chance: {{leads_count}} parent(s) still waiting — {{school_name}}',
        message_email_body: `Hi {{school_name}},

{{leads_count}} parent(s) enquired about admissions 5 days ago and haven't received a response yet.

Parents often apply to multiple schools. Unlock and reach out before they pick another school.

Unlock leads: {{dashboard_url}}

The Thynk Schooling Team`,
        message_wa_body: '',
        wa_template_name: '',
        wa_template_lang: 'en',
        repeat_every_days: 0,
        max_repeats: 1,
        stop_on_events: ['lead_unlocked'],
        target_audience: 'school',
        sort_order: 1,
      },
      {
        name: 'Credits Low Warning',
        trigger_event: 'credits_low',
        delay_days: 0,
        delay_hours: 1,
        channels: ['email', 'whatsapp'],
        message_email_subject: 'You\'re running low on lead credits — {{school_name}}',
        message_email_body: `Hi {{school_name}},

Your lead credit balance is low ({{credits_remaining}} credit(s) remaining).

Top up now so you don't miss incoming parent enquiries.

Buy credits: {{packages_url}}

The Thynk Schooling Team`,
        message_wa_body: `⚡ *Credits running low!*\n\nHi {{school_name}}, you only have {{credits_remaining}} lead credit(s) left.\n\nBuy more 👉 {{packages_url}}`,
        wa_template_name: 'credits_low_reminder',
        wa_template_lang: 'en',
        repeat_every_days: 3,
        max_repeats: 3,
        stop_on_events: ['credits_purchased'],
        target_audience: 'school',
        sort_order: 2,
      },
      {
        name: 'Credits Expired',
        trigger_event: 'credits_expired',
        delay_days: 0,
        delay_hours: 0,
        channels: ['email'],
        message_email_subject: 'Your lead credits have expired — {{school_name}}',
        message_email_body: `Hi {{school_name}},

Your lead credits have expired. New parent enquiries will be masked until you top up.

Renew now: {{packages_url}}

The Thynk Schooling Team`,
        message_wa_body: '',
        wa_template_name: '',
        wa_template_lang: 'en',
        repeat_every_days: 0,
        max_repeats: 1,
        stop_on_events: ['credits_purchased'],
        target_audience: 'school',
        sort_order: 3,
      },
    ]
    for (const d of defaults) {
      await db.query(`
        INSERT INTO reminder_schedules
          (name, trigger_event, delay_days, delay_hours, channels,
           message_email_subject, message_email_body, message_wa_body,
           wa_template_name, wa_template_lang, repeat_every_days, max_repeats,
           stop_on_events, target_audience, is_active, sort_order)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)
      `, [
        d.name, d.trigger_event, d.delay_days, d.delay_hours,
        JSON.stringify(d.channels),
        d.message_email_subject, d.message_email_body, d.message_wa_body,
        d.wa_template_name, d.wa_template_lang,
        d.repeat_every_days, d.max_repeats,
        JSON.stringify(d.stop_on_events),
        d.target_audience, d.sort_order,
      ]).catch(() => {})
    }
  }

  tablesEnsured = true
}

// ─── Serializer ───────────────────────────────────────────────────────────────
function toSchedule(r: any) {
  const parse = (v: any, fallback: any) => {
    if (Array.isArray(v)) return v
    try { return JSON.parse(v) } catch { return fallback }
  }
  return {
    id:                   r.id,
    name:                 r.name,
    triggerEvent:         r.trigger_event,
    delayDays:            r.delay_days,
    delayHours:           r.delay_hours,
    channels:             parse(r.channels, ['email']),
    messageEmailSubject:  r.message_email_subject || '',
    messageEmailBody:     r.message_email_body    || '',
    messageWaBody:        r.message_wa_body        || '',
    waTemplateName:       r.wa_template_name       || '',
    waTemplateLang:       r.wa_template_lang       || 'en',
    repeatEveryDays:      r.repeat_every_days      ?? 0,
    maxRepeats:           r.max_repeats            ?? 1,
    stopOnEvents:         parse(r.stop_on_events,   []),
    targetAudience:       r.target_audience         || 'school',
    isActive:             !!r.is_active,
    sortOrder:            r.sort_order              ?? 0,
    createdAt:            r.created_at,
    updatedAt:            r.updated_at,
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function getSchedules() {
  await ensureTables()
  const rows = await db.query('SELECT * FROM reminder_schedules ORDER BY sort_order ASC, created_at ASC')
  return NextResponse.json(rows.rows.map(toSchedule))
}

async function getLogs(req: NextRequest) {
  await ensureTables()
  const url = new URL(req.url)
  const scheduleId = url.searchParams.get('schedule_id')
  const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50'))

  let query = `
    SELECT rl.*, rs.name AS schedule_name, rs.trigger_event,
           s.name AS school_name
    FROM reminder_logs rl
    LEFT JOIN reminder_schedules rs ON rs.id = rl.schedule_id
    LEFT JOIN schools s ON s.id = rl.school_id
  `
  const params: any[] = []
  if (scheduleId) {
    params.push(scheduleId)
    query += ` WHERE rl.schedule_id = $1`
  }
  query += ` ORDER BY rl.sent_at DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const rows = await db.query(query, params).catch(() => ({ rows: [] }))
  return NextResponse.json(rows.rows)
}

async function saveSchedule(req: NextRequest) {
  await ensureTables()
  const body = await req.json()
  const {
    id, name, triggerEvent, delayDays, delayHours, channels,
    messageEmailSubject, messageEmailBody, messageWaBody,
    waTemplateName, waTemplateLang,
    repeatEveryDays, maxRepeats, stopOnEvents,
    targetAudience, isActive, sortOrder,
  } = body

  if (!name || !triggerEvent) {
    return NextResponse.json({ error: 'name and triggerEvent are required' }, { status: 400 })
  }

  const params = [
    name, triggerEvent,
    delayDays ?? 1, delayHours ?? 0,
    JSON.stringify(channels ?? ['email']),
    messageEmailSubject || '', messageEmailBody || '', messageWaBody || '',
    waTemplateName || '', waTemplateLang || 'en',
    repeatEveryDays ?? 0, maxRepeats ?? 1,
    JSON.stringify(stopOnEvents ?? []),
    targetAudience || 'school',
    isActive !== false,
    sortOrder ?? 0,
  ]

  let res
  if (id) {
    res = await db.query(`
      UPDATE reminder_schedules SET
        name=$1, trigger_event=$2, delay_days=$3, delay_hours=$4, channels=$5,
        message_email_subject=$6, message_email_body=$7, message_wa_body=$8,
        wa_template_name=$9, wa_template_lang=$10, repeat_every_days=$11, max_repeats=$12,
        stop_on_events=$13, target_audience=$14, is_active=$15, sort_order=$16,
        updated_at=NOW()
      WHERE id=$17 RETURNING *
    `, [...params, id])
  } else {
    res = await db.query(`
      INSERT INTO reminder_schedules
        (name, trigger_event, delay_days, delay_hours, channels,
         message_email_subject, message_email_body, message_wa_body,
         wa_template_name, wa_template_lang, repeat_every_days, max_repeats,
         stop_on_events, target_audience, is_active, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, params)
  }

  return NextResponse.json(toSchedule(res.rows[0]))
}

async function deleteSchedule(req: NextRequest) {
  await ensureTables()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('DELETE FROM reminder_schedules WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

async function toggleSchedule(req: NextRequest) {
  await ensureTables()
  const { id, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('UPDATE reminder_schedules SET is_active=$1, updated_at=NOW() WHERE id=$2', [isActive, id])
  return NextResponse.json({ success: true })
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'logs') return await getLogs(req)
    return await getSchedules()
  } catch (e: any) {
    console.error('[reminders GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'toggle') return await toggleSchedule(req)
    return await saveSchedule(req)
  } catch (e: any) {
    console.error('[reminders POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return await deleteSchedule(req)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
