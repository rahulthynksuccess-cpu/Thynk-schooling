/**
 * lib/email.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Core email engine for Thynk Schooling.
 *
 * How it works:
 *  1. Loads the matching `message_triggers` row from DB for a given triggerKey.
 *  2. Replaces {{variable}} placeholders with real values.
 *  3. Sends via SendGrid (SENDGRID_API_KEY) if configured, otherwise logs.
 *  4. Never throws — all failures are swallowed so events keep flowing.
 *
 * Usage (fire-and-forget):
 *   import { fireEmailTrigger } from '@/lib/email'
 *   fireEmailTrigger('new_lead_school', 'school', {
 *     school_id: school.id,
 *     variables: { '{{school_name}}': school.name, '{{admin_name}}': admin.name, ... }
 *   }).catch(() => {})
 */

import db from './db'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = 'school' | 'parent'

interface SendOptions {
  /** Required when profile='school' — used to look up admin email */
  school_id?: string
  /** Required when profile='parent' — the parent's email address */
  parent_email?: string
  /** Variable substitutions: key = '{{variable_name}}', value = replacement */
  variables?: Record<string, string>
}

interface TriggerRow {
  id: string
  trigger_key: string
  email_school_subject: string | null
  email_school_body: string | null
  email_school_enabled: boolean
  email_parent_subject: string | null
  email_parent_body: string | null
  email_parent_enabled: boolean
  recipients: string[] | string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function substitute(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(k, v ?? '')
  }
  return out
}

async function getAdminEmail(schoolId: string): Promise<string | null> {
  try {
    // Try users table via admin_user_id
    const res = await db.query(
      `SELECT u.email FROM schools s
       JOIN users u ON u.id = s.admin_user_id
       WHERE s.id = $1 AND u.email IS NOT NULL AND u.email <> ''
       LIMIT 1`,
      [schoolId]
    )
    if (res.rows[0]?.email) return res.rows[0].email

    // Fallback: school's own email field
    const res2 = await db.query(
      `SELECT email FROM schools WHERE id=$1 AND email IS NOT NULL AND email <> '' LIMIT 1`,
      [schoolId]
    )
    return res2.rows[0]?.email ?? null
  } catch {
    return null
  }
}

async function sendViaSendGrid(to: string, subject: string, body: string): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) {
    console.log(`[email] No SENDGRID_API_KEY — skipping send to ${to}: ${subject}`)
    return
  }

  const fromEmail = process.env.FROM_EMAIL || 'noreply@thynkschooling.in'
  const fromName  = process.env.FROM_NAME  || 'Thynk Schooling'

  // Convert plain-text body with basic line breaks into clean HTML
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:32px 0}
  .wrap{max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#B8860B,#E8C547);padding:28px 32px}
  .header h1{margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-.3px}
  .body{padding:32px;color:#374151;font-size:15px;line-height:1.75;white-space:pre-wrap}
  .footer{padding:18px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center}
  a{color:#B8860B}
</style></head><body>
  <div class="wrap">
    <div class="header"><h1>Thynk Schooling</h1></div>
    <div class="body">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <div class="footer">© ${new Date().getFullYear()} Thynk Schooling · <a href="#">Unsubscribe</a></div>
  </div>
</body></html>`

  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: 'text/plain', value: body },
        { type: 'text/html',  value: html },
      ],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    console.error(`[email] SendGrid error ${resp.status} for ${to}:`, errText)
  } else {
    console.log(`[email] Sent "${subject}" → ${to}`)
  }
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Fire an email trigger for a given profile (school or parent).
 *
 * @param triggerKey  Matches trigger_key column in message_triggers table.
 * @param profile     'school' or 'parent'
 * @param opts        { school_id?, parent_email?, variables? }
 */
export async function fireEmailTrigger(
  triggerKey: string,
  profile: Profile,
  opts: SendOptions = {}
): Promise<void> {
  try {
    // 1. Load trigger from DB
    const res = await db.query<TriggerRow>(
      `SELECT id, trigger_key,
              email_school_subject, email_school_body, email_school_enabled,
              email_parent_subject, email_parent_body, email_parent_enabled,
              recipients
       FROM message_triggers WHERE trigger_key = $1 LIMIT 1`,
      [triggerKey]
    )

    const trigger = res.rows[0]
    if (!trigger) {
      console.log(`[email] Trigger "${triggerKey}" not found in DB`)
      return
    }

    const isSchool = profile === 'school'
    const enabled  = isSchool ? trigger.email_school_enabled : trigger.email_parent_enabled
    if (!enabled) return

    const subject  = (isSchool ? trigger.email_school_subject : trigger.email_parent_subject) || ''
    const body     = (isSchool ? trigger.email_school_body    : trigger.email_parent_body)    || ''
    if (!subject && !body) return

    // 2. Substitute variables
    const vars = opts.variables ?? {}
    const finalSubject = substitute(subject, vars)
    const finalBody    = substitute(body,    vars)

    // 3. Resolve recipient email
    let toEmail: string | null = null

    if (isSchool) {
      if (!opts.school_id) {
        console.warn(`[email] Trigger "${triggerKey}" profile=school but no school_id provided`)
        return
      }
      toEmail = await getAdminEmail(opts.school_id)
    } else {
      toEmail = opts.parent_email ?? null
    }

    if (!toEmail) {
      console.log(`[email] Trigger "${triggerKey}" — no email address found for ${profile}, skipping`)
      return
    }

    // 4. Send
    await sendViaSendGrid(toEmail, finalSubject, finalBody)
  } catch (err) {
    // Never throw — email is non-critical
    console.error(`[email] fireEmailTrigger error (${triggerKey}/${profile}):`, err)
  }
}

/**
 * Fire a trigger for ALL profiles listed in its recipients array.
 * Convenience wrapper so callers don't need to call fireEmailTrigger twice.
 */
export async function fireEmailTriggerAll(
  triggerKey: string,
  opts: {
    school_id?: string
    parent_email?: string
    variables?: Record<string, string>
  } = {}
): Promise<void> {
  try {
    const res = await db.query(
      `SELECT recipients FROM message_triggers WHERE trigger_key=$1 LIMIT 1`,
      [triggerKey]
    )
    const row = res.rows[0]
    if (!row) return

    let recipients: string[]
    if (Array.isArray(row.recipients)) {
      recipients = row.recipients
    } else {
      try { recipients = JSON.parse(row.recipients) } catch { recipients = [] }
    }

    await Promise.allSettled(
      recipients.map((p: string) =>
        (p === 'school' || p === 'parent')
          ? fireEmailTrigger(triggerKey, p as Profile, opts)
          : Promise.resolve()
      )
    )
  } catch (err) {
    console.error(`[email] fireEmailTriggerAll error (${triggerKey}):`, err)
  }
}
