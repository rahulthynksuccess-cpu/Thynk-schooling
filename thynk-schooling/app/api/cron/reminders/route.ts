export const dynamic = 'force-dynamic'
/**
 * /api/cron/reminders
 *
 * Vercel Cron Job — runs every hour.
 * Finds all due reminder_schedules and sends Email / WhatsApp to affected schools.
 *
 * Configured in vercel.json:
 *   { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
 *
 * Protected by CRON_SECRET env variable.
 *
 * Trigger events handled:
 *   lead_not_unlocked   — lead created N days ago, still is_purchased=false for this school
 *   credits_low         — school has <= 2 credits
 *   credits_expired     — school has 0 credits and lead_credits.expires_at < NOW()
 *
 * Stop conditions:
 *   lead_unlocked       — do not remind if the lead has since been unlocked
 *   credits_purchased   — do not remind if credits have been topped up
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { fireEmailTrigger } from '@/lib/email'

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev mode: allow if no secret set
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

// ─── Placeholder substitution ─────────────────────────────────────────────────
function sub(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(k, v ?? '')
  return out
}

// ─── WhatsApp send via Meta Cloud API ────────────────────────────────────────
async function sendWhatsApp(to: string, templateName: string, lang: string, vars: Record<string, string>): Promise<void> {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) {
    console.log(`[cron/reminders] No WhatsApp credentials — skipping WA to ${to}`)
    return
  }
  const phone = to.replace(/\D/g, '').replace(/^0+/, '')
  const withCountry = phone.startsWith('91') ? phone : `91${phone}`

  // Build component parameters from common variables
  const paramValues = [
    vars['{{school_name}}'] || '',
    vars['{{leads_count}}'] || '',
    vars['{{dashboard_url}}'] || '',
    vars['{{credits_remaining}}'] || '',
    vars['{{packages_url}}'] || '',
  ].filter(Boolean).map(v => ({ type: 'text', text: v }))

  const body: any = {
    messaging_product: 'whatsapp',
    to: withCountry,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang || 'en' },
      components: paramValues.length > 0
        ? [{ type: 'body', parameters: paramValues }]
        : [],
    },
  }

  const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const err = await resp.text().catch(() => '')
    console.error(`[cron/reminders] WhatsApp error ${resp.status} for ${to}:`, err)
  } else {
    console.log(`[cron/reminders] WhatsApp sent to ${to} (template: ${templateName})`)
  }
}

// ─── Get school email + phone ─────────────────────────────────────────────────
async function getSchoolContact(schoolId: string): Promise<{ email: string | null; phone: string | null; name: string }> {
  try {
    const res = await db.query(
      `SELECT s.name, s.phone AS s_phone, s.email AS s_email,
              u.email AS u_email, u.phone AS u_phone
       FROM schools s
       LEFT JOIN users u ON u.id = s.admin_user_id
       WHERE s.id = $1`,
      [schoolId]
    )
    const r = res.rows[0]
    if (!r) return { email: null, phone: null, name: 'School' }
    return {
      name:  r.name || 'School',
      email: r.u_email || r.s_email || null,
      phone: r.u_phone || r.s_phone || null,
    }
  } catch {
    return { email: null, phone: null, name: 'School' }
  }
}

// ─── Check if a log entry already exists (dedup) ─────────────────────────────
async function alreadySent(scheduleId: string, schoolId: string, leadId?: string): Promise<boolean> {
  const res = await db.query(
    `SELECT id FROM reminder_logs
     WHERE schedule_id=$1 AND school_id=$2
       AND ($3::uuid IS NULL OR lead_id=$3)
       AND status='sent'
     LIMIT 1`,
    [scheduleId, schoolId, leadId || null]
  ).catch(() => ({ rows: [] }))
  return res.rows.length > 0
}

async function logSent(scheduleId: string, schoolId: string, leadId: string | null, triggerEvent: string, channels: string[], error?: string) {
  await db.query(
    `INSERT INTO reminder_logs (schedule_id, school_id, lead_id, trigger_event, channels_sent, status, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [scheduleId, schoolId, leadId, triggerEvent, JSON.stringify(channels), error ? 'error' : 'sent', error || null]
  ).catch(() => {})
}

// ─── Trigger: lead_not_unlocked ───────────────────────────────────────────────
async function processLeadNotUnlocked(schedule: any, base: string): Promise<number> {
  const delayMs = ((schedule.delay_days * 24) + schedule.delay_hours) * 60 * 60 * 1000
  const cutoff  = new Date(Date.now() - delayMs)

  // Find leads that:
  // - were created >= delayDays+delayHours ago
  // - belong to a school (direct leads only — discovered leads don't have a specific school to remind)
  // - have not been purchased/unlocked
  // - the school hasn't been sent this specific reminder yet
  const leads = await db.query(`
    SELECT
      l.id AS lead_id,
      l.school_id,
      l.parent_name, l.child_name, l.class_applying_for, l.city, l.source,
      l.created_at
    FROM leads l
    WHERE l.school_id IS NOT NULL
      AND l.is_purchased = false
      AND l.created_at <= $1
      AND l.created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM reminder_logs rl
        WHERE rl.schedule_id = $2
          AND rl.school_id = l.school_id
          AND rl.lead_id = l.id
          AND rl.status = 'sent'
      )
    ORDER BY l.created_at ASC
    LIMIT 200
  `, [cutoff, schedule.id]).catch(() => ({ rows: [] }))

  // Group by school so we send one combined email per school
  const bySchool = new Map<string, any[]>()
  for (const lead of leads.rows) {
    if (!bySchool.has(lead.school_id)) bySchool.set(lead.school_id, [])
    bySchool.get(lead.school_id)!.push(lead)
  }

  let count = 0
  const channels: string[] = Array.isArray(schedule.channels) ? schedule.channels : JSON.parse(schedule.channels || '["email"]')

  for (const [schoolId, schoolLeads] of bySchool) {
    const contact = await getSchoolContact(schoolId)
    const packagesUrl = `${base}/dashboard/school/packages`
    const dashUrl     = `${base}/dashboard/school/leads`
    const firstLead   = schoolLeads[0]

    const vars: Record<string, string> = {
      '{{school_name}}':    contact.name,
      '{{leads_count}}':    String(schoolLeads.length),
      '{{child_name}}':     firstLead.child_name      || 'A student',
      '{{class_applying}}': firstLead.class_applying_for || '',
      '{{city}}':           firstLead.city             || '',
      '{{dashboard_url}}':  dashUrl,
      '{{unlock_url}}':     dashUrl,
      '{{packages_url}}':   packagesUrl,
    }

    const channelsSent: string[] = []

    // Email
    if (channels.includes('email') && contact.email && schedule.message_email_subject) {
      await fireEmailTrigger('__reminder_dynamic__', 'school', {
        school_id: schoolId,
        variables: { ...vars, '__subject__': sub(schedule.message_email_subject, vars), '__body__': sub(schedule.message_email_body, vars) },
      }).catch(async () => {
        // Fallback: send directly
        const { sendDirectEmail } = await import('@/lib/email')
        await sendDirectEmail(contact.email!, sub(schedule.message_email_subject, vars), sub(schedule.message_email_body, vars), 'alert', vars).catch(() => {})
      })
      channelsSent.push('email')
    }

    // WhatsApp
    if (channels.includes('whatsapp') && contact.phone && schedule.wa_template_name) {
      await sendWhatsApp(contact.phone, schedule.wa_template_name, schedule.wa_template_lang || 'en', vars)
      channelsSent.push('whatsapp')
    }

    // Log every lead individually for clean dedup
    for (const lead of schoolLeads) {
      await logSent(schedule.id, schoolId, lead.lead_id, schedule.trigger_event, channelsSent)
    }
    count++
  }
  return count
}

// ─── Trigger: credits_low ─────────────────────────────────────────────────────
async function processCreditsLow(schedule: any, base: string): Promise<number> {
  const LOW_THRESHOLD = 2

  const schools = await db.query(`
    SELECT lc.school_id, lc.credits
    FROM lead_credits lc
    WHERE lc.credits > 0 AND lc.credits <= $1
      AND NOT EXISTS (
        SELECT 1 FROM reminder_logs rl
        WHERE rl.schedule_id = $2
          AND rl.school_id = lc.school_id
          AND rl.sent_at >= NOW() - INTERVAL '${schedule.repeat_every_days > 0 ? schedule.repeat_every_days : 3} days'
          AND rl.status = 'sent'
      )
    LIMIT 100
  `, [LOW_THRESHOLD, schedule.id]).catch(() => ({ rows: [] }))

  let count = 0
  const channels: string[] = Array.isArray(schedule.channels) ? schedule.channels : JSON.parse(schedule.channels || '["email"]')

  for (const sc of schools.rows) {
    const contact     = await getSchoolContact(sc.school_id)
    const packagesUrl = `${base}/dashboard/school/packages`
    const dashUrl     = `${base}/dashboard/school/leads`

    const vars: Record<string, string> = {
      '{{school_name}}':       contact.name,
      '{{credits_remaining}}': String(sc.credits),
      '{{dashboard_url}}':     dashUrl,
      '{{packages_url}}':      packagesUrl,
    }
    const channelsSent: string[] = []

    if (channels.includes('email') && contact.email) {
      const { sendDirectEmail } = await import('@/lib/email')
      await sendDirectEmail(contact.email, sub(schedule.message_email_subject, vars), sub(schedule.message_email_body, vars), 'alert', vars).catch(() => {})
      channelsSent.push('email')
    }
    if (channels.includes('whatsapp') && contact.phone && schedule.wa_template_name) {
      await sendWhatsApp(contact.phone, schedule.wa_template_name, schedule.wa_template_lang, vars)
      channelsSent.push('whatsapp')
    }

    await logSent(schedule.id, sc.school_id, null, schedule.trigger_event, channelsSent)
    count++
  }
  return count
}

// ─── Trigger: credits_expired ─────────────────────────────────────────────────
async function processCreditsExpired(schedule: any, base: string): Promise<number> {
  const schools = await db.query(`
    SELECT lc.school_id, lc.credits, lc.expires_at
    FROM lead_credits lc
    WHERE lc.credits = 0
      AND lc.expires_at IS NOT NULL AND lc.expires_at < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM reminder_logs rl
        WHERE rl.schedule_id = $1
          AND rl.school_id = lc.school_id
          AND rl.sent_at >= NOW() - INTERVAL '7 days'
          AND rl.status = 'sent'
      )
    LIMIT 100
  `, [schedule.id]).catch(() => ({ rows: [] }))

  let count = 0
  const channels: string[] = Array.isArray(schedule.channels) ? schedule.channels : JSON.parse(schedule.channels || '["email"]')

  for (const sc of schools.rows) {
    const contact     = await getSchoolContact(sc.school_id)
    const packagesUrl = `${base}/dashboard/school/packages`
    const dashUrl     = `${base}/dashboard/school`
    const vars: Record<string, string> = {
      '{{school_name}}':   contact.name,
      '{{dashboard_url}}': dashUrl,
      '{{packages_url}}':  packagesUrl,
    }
    const channelsSent: string[] = []

    if (channels.includes('email') && contact.email) {
      const { sendDirectEmail } = await import('@/lib/email')
      await sendDirectEmail(contact.email, sub(schedule.message_email_subject, vars), sub(schedule.message_email_body, vars), 'alert', vars).catch(() => {})
      channelsSent.push('email')
    }
    if (channels.includes('whatsapp') && contact.phone && schedule.wa_template_name) {
      await sendWhatsApp(contact.phone, schedule.wa_template_name, schedule.wa_template_lang, vars)
      channelsSent.push('whatsapp')
    }

    await logSent(schedule.id, sc.school_id, null, schedule.trigger_event, channelsSent)
    count++
  }
  return count
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://thynkschooling.in'
  const startedAt = Date.now()
  const results: Record<string, number> = {}

  try {
    // Load all active schedules
    const schedulesRes = await db.query(
      `SELECT * FROM reminder_schedules WHERE is_active = true ORDER BY sort_order ASC`
    ).catch(() => ({ rows: [] }))

    for (const schedule of schedulesRes.rows) {
      const parse = (v: any, fb: any) => { try { return Array.isArray(v) ? v : JSON.parse(v) } catch { return fb } }
      schedule.channels     = parse(schedule.channels, ['email'])
      schedule.stop_on_events = parse(schedule.stop_on_events, [])

      let processed = 0
      try {
        switch (schedule.trigger_event) {
          case 'lead_not_unlocked':
            processed = await processLeadNotUnlocked(schedule, base); break
          case 'credits_low':
            processed = await processCreditsLow(schedule, base); break
          case 'credits_expired':
            processed = await processCreditsExpired(schedule, base); break
          default:
            console.log(`[cron/reminders] Unknown trigger_event: ${schedule.trigger_event}`)
        }
      } catch (e: any) {
        console.error(`[cron/reminders] Error processing schedule "${schedule.name}":`, e.message)
      }

      results[schedule.name] = processed
    }

    const elapsed = Date.now() - startedAt
    console.log(`[cron/reminders] Done in ${elapsed}ms`, results)

    return NextResponse.json({
      ok: true,
      elapsed: `${elapsed}ms`,
      schedulesRun: schedulesRes.rows.length,
      results,
    })
  } catch (e: any) {
    console.error('[cron/reminders]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
