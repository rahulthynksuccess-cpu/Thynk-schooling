/**
 * lib/email.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Core email engine for Thynk Schooling.
 *
 * How it works:
 *  1. Loads the matching `message_triggers` row from DB for a given triggerKey.
 *  2. Replaces {{variable}} placeholders with real values.
 *  3. Renders a beautiful HTML email using the trigger's template_style.
 *  4. Sends via SendGrid (SENDGRID_API_KEY) if configured, otherwise logs.
 *  5. Never throws — all failures are swallowed so events keep flowing.
 *
 * Template styles:
 *  'default'   — Standard branded email (header + body + footer)
 *  'lead'      — Eye-catching "New Lead Available" card with CTA button
 *  'alert'     — Warning/reminder style with yellow accent
 *  'success'   — Green confirmation style
 *
 * Usage (fire-and-forget):
 *   import { fireEmailTrigger } from '@/lib/email'
 *   fireEmailTrigger('new_lead_available', 'school', {
 *     school_id: school.id,
 *     variables: { '{{school_name}}': school.name, ... }
 *   }).catch(() => {})
 */

import db from './db'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = 'school' | 'parent'
type TemplateStyle = 'default' | 'lead' | 'alert' | 'success'

interface SendOptions {
  school_id?:    string
  parent_email?: string
  variables?:    Record<string, string>
}

interface TriggerRow {
  id:                    string
  trigger_key:           string
  template_style:        string | null
  email_school_subject:  string | null
  email_school_body:     string | null
  email_school_enabled:  boolean
  email_parent_subject:  string | null
  email_parent_body:     string | null
  email_parent_enabled:  boolean
  recipients:            string[] | string
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
    const res = await db.query(
      `SELECT u.email FROM schools s
       JOIN users u ON u.id = s.admin_user_id
       WHERE s.id = $1 AND u.email IS NOT NULL AND u.email <> ''
       LIMIT 1`,
      [schoolId]
    )
    if (res.rows[0]?.email) return res.rows[0].email
    const res2 = await db.query(
      `SELECT email FROM schools WHERE id=$1 AND email IS NOT NULL AND email <> '' LIMIT 1`,
      [schoolId]
    )
    return res2.rows[0]?.email ?? null
  } catch {
    return null
  }
}

// ─── HTML Renderers ───────────────────────────────────────────────────────────

/**
 * Renders the "New Lead Available for Unlock" email template.
 * Eye-catching card style with lead preview and CTA.
 */
function renderLeadEmail(body: string, vars: Record<string, string>): string {
  const schoolName     = vars['{{school_name}}']     || 'Your School'
  const childName      = vars['{{child_name}}']      || 'A student'
  const classApplying  = vars['{{class_applying}}']  || ''
  const city           = vars['{{city}}']            || ''
  const leadsCount     = vars['{{leads_count}}']     || '1'
  const dashboardUrl   = vars['{{dashboard_url}}']   || '#'
  const unlockUrl      = vars['{{unlock_url}}']      || dashboardUrl
  const maskedName     = vars['{{masked_name}}']     || '•••• ••••'
  const maskedPhone    = vars['{{masked_phone}}']    || '98** ****72'
  const source         = vars['{{source}}']          || 'Direct'
  const year           = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Lead Available</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#F0EDE8;font-family:'DM Sans',system-ui,sans-serif;padding:40px 16px}
  .outer{max-width:600px;margin:0 auto}
  /* Header */
  .brand{text-align:center;margin-bottom:24px}
  .brand-name{font-size:18px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px}
  .brand-name em{font-style:normal;color:#B8860B}
  /* Main card */
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.07)}
  /* Top accent bar */
  .accent-bar{height:5px;background:linear-gradient(90deg,#B8860B 0%,#E8C547 50%,#B8860B 100%)}
  /* Alert banner */
  .alert-banner{background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:28px 32px;text-align:center}
  .alert-icon{font-size:40px;margin-bottom:10px}
  .alert-title{font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;margin-bottom:6px}
  .alert-sub{font-size:14px;color:rgba(255,255,255,0.6)}
  .badge{display:inline-block;background:#B8860B;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px}
  /* Body */
  .body{padding:28px 32px}
  .greeting{font-size:15px;color:#374151;line-height:1.7;margin-bottom:24px}
  /* Lead preview card */
  .lead-card{background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:14px;padding:20px;margin-bottom:24px;position:relative;overflow:hidden}
  .lead-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#B8860B,#E8C547)}
  .lead-card-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px}
  .lead-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .lead-row:last-child{margin-bottom:0}
  .lead-icon{width:30px;height:30px;border-radius:8px;background:#F3F4F6;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
  .lead-detail{flex:1}
  .lead-detail-label{font-size:10px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}
  .lead-detail-value{font-size:13px;font-weight:600;color:#111827;margin-top:1px;filter:blur(4px);user-select:none}
  .lead-detail-value.visible{filter:none}
  .source-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);font-size:11px;font-weight:600;color:#0D7A5F}
  /* Unlock count */
  .count-box{display:flex;align-items:center;gap:14px;background:rgba(184,134,11,0.06);border:1px solid rgba(184,134,11,0.2);border-radius:12px;padding:14px 18px;margin-bottom:24px}
  .count-num{font-size:28px;font-weight:800;color:#B8860B;line-height:1}
  .count-text{font-size:13px;color:#6B7280;line-height:1.5}
  .count-text strong{color:#111827;font-weight:600}
  /* CTA */
  .cta-wrap{text-align:center;margin-bottom:24px}
  .cta-btn{display:inline-block;background:#111827;color:#fff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px}
  .cta-note{font-size:12px;color:#9CA3AF;text-align:center;margin-top:8px}
  /* Steps */
  .steps-title{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px}
  .step{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
  .step-num{width:22px;height:22px;border-radius:50%;background:#111827;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .step-text{font-size:13px;color:#374151;line-height:1.5}
  /* Footer */
  .footer{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center}
  .footer-text{font-size:12px;color:#9CA3AF;line-height:1.7}
  .footer-text a{color:#B8860B;text-decoration:none}
  /* Responsive */
  @media(max-width:480px){
    .alert-banner,.body,.footer{padding-left:20px;padding-right:20px}
    .alert-title{font-size:18px}
    .cta-btn{display:block;padding:13px 20px}
  }
</style>
</head>
<body>
<div class="outer">
  <div class="brand">
    <div class="brand-name">Thynk<em>Schooling</em></div>
  </div>
  <div class="card">
    <div class="accent-bar"></div>

    <!-- Alert Banner -->
    <div class="alert-banner">
      <div class="badge">🔔 New Lead</div>
      <div class="alert-icon">👤</div>
      <div class="alert-title">A Parent Wants to Admit Their Child</div>
      <div class="alert-sub">New enquiry available for ${schoolName}</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">
        A parent has enquired about admissions. Their contact details are masked until you unlock this lead. 
        Act fast — schools that respond within 2 hours see <strong>3× higher conversion</strong>.
      </p>

      <!-- Lead preview card -->
      <div class="lead-card">
        <div class="lead-card-label">Lead Preview</div>

        <div class="lead-row">
          <div class="lead-icon">👤</div>
          <div class="lead-detail">
            <div class="lead-detail-label">Parent Name</div>
            <div class="lead-detail-value">${maskedName}</div>
          </div>
          <div class="source-badge">✓ ${source}</div>
        </div>

        <div class="lead-row">
          <div class="lead-icon">📚</div>
          <div class="lead-detail">
            <div class="lead-detail-label">Child / Class</div>
            <div class="lead-detail-value visible">${childName}${classApplying ? ` · Class ${classApplying}` : ''}</div>
          </div>
        </div>

        <div class="lead-row">
          <div class="lead-icon">📍</div>
          <div class="lead-detail">
            <div class="lead-detail-label">City</div>
            <div class="lead-detail-value visible">${city || '—'}</div>
          </div>
        </div>

        <div class="lead-row">
          <div class="lead-icon">📞</div>
          <div class="lead-detail">
            <div class="lead-detail-label">Phone (masked)</div>
            <div class="lead-detail-value">${maskedPhone}</div>
          </div>
        </div>
      </div>

      <!-- Lead count box -->
      <div class="count-box">
        <div class="count-num">${leadsCount}</div>
        <div class="count-text">
          <strong>lead${parseInt(leadsCount) !== 1 ? 's' : ''} waiting to be unlocked</strong><br>
          Unlock now to access full name, phone & email
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${unlockUrl}" class="cta-btn">🔓 Unlock This Lead</a>
        <div class="cta-note">Uses 1 credit · Contact details revealed instantly</div>
      </div>

      <!-- Steps -->
      <div class="steps-title">How to unlock</div>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">Click the button above to go to your Leads dashboard</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">Click "Unlock (1 credit)" next to this lead</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">Full name, phone number and email revealed instantly</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        ${schoolName} · <a href="${dashboardUrl}">Dashboard</a> · 
        <a href="${dashboardUrl}/packages">Buy Credits</a><br>
        © ${year} Thynk Schooling · 
        <a href="#">Unsubscribe from lead alerts</a>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

/** Renders the 'alert' / reminder style — yellow accent, urgent tone */
function renderAlertEmail(subject: string, body: string, vars: Record<string, string>): string {
  const dashboardUrl = vars['{{dashboard_url}}'] || '#'
  const year = new Date().getFullYear()
  const safeBody = body.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#FFFBEB;font-family:'DM Sans',system-ui,sans-serif;padding:40px 16px}
  .outer{max-width:580px;margin:0 auto}
  .brand{text-align:center;margin-bottom:20px;font-size:16px;font-weight:700;color:#1a1a1a}
  .brand em{font-style:normal;color:#B8860B}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06)}
  .top{background:linear-gradient(135deg,#B8860B,#E8C547);padding:26px 30px;text-align:center}
  .top-icon{font-size:36px;margin-bottom:8px}
  .top-title{font-size:20px;font-weight:700;color:#fff}
  .body{padding:28px 30px;color:#374151;font-size:14px;line-height:1.8;white-space:pre-wrap}
  .cta{text-align:center;padding:0 30px 28px}
  .cta a{display:inline-block;background:#111827;color:#fff;padding:12px 32px;border-radius:9px;text-decoration:none;font-size:14px;font-weight:700}
  .footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 30px;text-align:center;font-size:11px;color:#9ca3af}
  .footer a{color:#B8860B;text-decoration:none}
</style>
</head>
<body>
<div class="outer">
  <div class="brand">Thynk<em>Schooling</em></div>
  <div class="card">
    <div class="top">
      <div class="top-icon">⏰</div>
      <div class="top-title">${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>
    <div class="body">${safeBody}</div>
    <div class="cta"><a href="${dashboardUrl}">Go to Dashboard →</a></div>
    <div class="footer">© ${year} Thynk Schooling · <a href="#">Unsubscribe</a></div>
  </div>
</div>
</body>
</html>`
}

/** Renders the default branded email */
function renderDefaultEmail(subject: string, body: string, vars: Record<string, string>): string {
  const dashboardUrl = vars['{{dashboard_url}}'] || '#'
  const year = new Date().getFullYear()
  const safeBody = body.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#F0EDE8;font-family:'DM Sans',system-ui,sans-serif;padding:40px 16px}
  .outer{max-width:580px;margin:0 auto}
  .brand{text-align:center;margin-bottom:20px;font-size:16px;font-weight:700;color:#1a1a1a}
  .brand em{font-style:normal;color:#B8860B}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06)}
  .header{background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:26px 32px}
  .header h1{margin:0;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px}
  .body{padding:32px;color:#374151;font-size:14px;line-height:1.85;white-space:pre-wrap}
  .footer{padding:18px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
  .footer a{color:#B8860B;text-decoration:none}
</style>
</head>
<body>
<div class="outer">
  <div class="brand">Thynk<em>Schooling</em></div>
  <div class="card">
    <div class="header"><h1>${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h1></div>
    <div class="body">${safeBody}</div>
    <div class="footer">© ${year} Thynk Schooling · <a href="${dashboardUrl}">Dashboard</a> · <a href="#">Unsubscribe</a></div>
  </div>
</div>
</body>
</html>`
}

function buildHtml(style: TemplateStyle, subject: string, body: string, vars: Record<string, string>): string {
  switch (style) {
    case 'lead':    return renderLeadEmail(body, vars)
    case 'alert':   return renderAlertEmail(subject, body, vars)
    case 'success': return renderDefaultEmail(subject, body, vars) // can extend
    default:        return renderDefaultEmail(subject, body, vars)
  }
}

async function sendViaSendGrid(to: string, subject: string, body: string, html: string): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) {
    console.log(`[email] No SENDGRID_API_KEY — skipping send to ${to}: ${subject}`)
    return
  }
  const fromEmail = process.env.FROM_EMAIL || 'noreply@thynkschooling.in'
  const fromName  = process.env.FROM_NAME  || 'Thynk Schooling'

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

export async function fireEmailTrigger(
  triggerKey: string,
  profile: Profile,
  opts: SendOptions = {}
): Promise<void> {
  try {
    const res = await db.query<TriggerRow>(
      `SELECT id, trigger_key, template_style,
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

    const vars         = opts.variables ?? {}
    const finalSubject = substitute(subject, vars)
    const finalBody    = substitute(body,    vars)
    const style        = (trigger.template_style || 'default') as TemplateStyle
    const html         = buildHtml(style, finalSubject, finalBody, vars)

    let toEmail: string | null = null
    if (isSchool) {
      if (!opts.school_id) return
      toEmail = await getAdminEmail(opts.school_id)
    } else {
      toEmail = opts.parent_email ?? null
    }
    if (!toEmail) return

    await sendViaSendGrid(toEmail, finalSubject, finalBody, html)
  } catch (err) {
    console.error(`[email] fireEmailTrigger error (${triggerKey}/${profile}):`, err)
  }
}

export async function fireEmailTriggerAll(
  triggerKey: string,
  opts: { school_id?: string; parent_email?: string; variables?: Record<string, string> } = {}
): Promise<void> {
  try {
    const res = await db.query(
      `SELECT recipients FROM message_triggers WHERE trigger_key=$1 LIMIT 1`,
      [triggerKey]
    )
    const row = res.rows[0]
    if (!row) return
    let recipients: string[]
    if (Array.isArray(row.recipients)) recipients = row.recipients
    else { try { recipients = JSON.parse(row.recipients) } catch { recipients = [] } }
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

/**
 * NEW: Send the "new_lead_available" email for a specific school + lead.
 * Called by the reminders cron job and by the leads POST handler.
 */
export async function sendNewLeadAvailableEmail(opts: {
  schoolId:      string
  childName?:    string
  classApplying?: string
  city?:         string
  maskedName?:   string
  maskedPhone?:  string
  source?:       string
  leadsCount?:   number
  unlockUrl?:    string
  dashboardUrl?: string
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://thynkschooling.in'
  const dash = opts.dashboardUrl || `${base}/dashboard/school/leads`

  // Fetch school name
  let schoolName = 'Your School'
  try {
    const sr = await db.query('SELECT name FROM schools WHERE id=$1', [opts.schoolId])
    schoolName = sr.rows[0]?.name || 'Your School'
  } catch {}

  await fireEmailTrigger('new_lead_available', 'school', {
    school_id: opts.schoolId,
    variables: {
      '{{school_name}}':    schoolName,
      '{{child_name}}':     opts.childName      || 'A student',
      '{{class_applying}}': opts.classApplying  || '',
      '{{city}}':           opts.city           || '',
      '{{masked_name}}':    opts.maskedName     || '•••• ••••',
      '{{masked_phone}}':   opts.maskedPhone    || '98** ****72',
      '{{source}}':         opts.source         || 'Direct',
      '{{leads_count}}':    String(opts.leadsCount ?? 1),
      '{{unlock_url}}':     opts.unlockUrl      || dash,
      '{{dashboard_url}}':  dash,
    },
  })
}

/**
 * NEW: Direct email send — used by cron/reminders for dynamic reminder messages
 * that are not stored as message_triggers rows.
 */
export async function sendDirectEmail(
  to: string,
  subject: string,
  body: string,
  style: TemplateStyle = 'default',
  vars: Record<string, string> = {}
): Promise<void> {
  try {
    const html = buildHtml(style, subject, body, vars)
    await sendViaSendGrid(to, subject, body, html)
  } catch (err) {
    console.error('[email] sendDirectEmail error:', err)
  }
}
