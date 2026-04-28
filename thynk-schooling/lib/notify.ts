/**
 * lib/notify.ts
 * Auto-notification helper — called after key events to create
 * in-app notifications for school admins.
 *
 * Events covered:
 *  - New lead enquiry received
 *  - Lead unlocked/purchased by school
 *  - New application submitted
 *  - Parent viewed school profile
 *  - Subscription / lead package payment completed
 *  - Featured listing activated
 */

import db from './db'


async function create(schoolId: string, title: string, body: string, type: string = 'info') {
  try {
      await db.query(
      `INSERT INTO notifications (school_id, audience, title, body, type, is_read) VALUES ($1, 'school', $2, $3, $4, false)`,
      [schoolId, title, body, type]
    )
  } catch (e) {
    // Never throw — notifications are non-critical
    console.error('[notify] failed:', e)
  }
}

/** New lead enquiry received by a school (from parent search/apply) */
export async function notifyNewLead(schoolId: string, parentName: string, childName?: string, grade?: string) {
  const who = childName ? `${parentName} (child: ${childName}${grade ? `, ${grade}` : ''})` : parentName
  await create(schoolId, '📩 New Lead Received', `${who} has enquired about admission.`, 'lead')
}

/** School admin unlocked/purchased a lead */
export async function notifyLeadUnlocked(schoolId: string, parentName: string) {
  await create(schoolId, '🔓 Lead Unlocked', `You unlocked contact details for ${parentName}.`, 'lead')
}

/** New application submitted to a school */
export async function notifyNewApplication(schoolId: string, parentName: string, childName?: string, grade?: string) {
  const who = childName ? `${parentName} for ${childName}${grade ? ` (${grade})` : ''}` : parentName
  await create(schoolId, '📋 New Application', `${who} submitted an admission application.`, 'application')
}

/** Parent viewed school profile */
export async function notifyProfileView(schoolId: string) {
  // Batch into one notification per day to avoid spam
  try {
      const today = new Date().toISOString().slice(0, 10)
    const existing = await db.query(
      `SELECT id FROM notifications WHERE school_id=$1 AND type='view' AND sent_at::date = $2::date LIMIT 1`,
      [schoolId, today]
    ).catch(() => ({ rows: [] }))
    if (existing.rows.length) {
      // Update existing today's view notification count
      await db.query(
        `UPDATE notifications SET body = (
          SELECT CONCAT(
            (regexp_replace(body, '[^0-9]', '', 'g'))::int + 1, ' parent(s) viewed your school profile today'
          )
          FROM notifications WHERE id = $1
        ), sent_at = NOW() WHERE id = $1`,
        [existing.rows[0].id]
      ).catch(() => {})
    } else {
      await create(schoolId, '👀 Profile Viewed', '1 parent(s) viewed your school profile today.', 'view')
    }
  } catch (e) {
    console.error('[notify profileView]', e)
  }
}

/** Subscription / lead package payment completed */
export async function notifyPaymentDone(schoolId: string, planName: string, amount: number) {
  const fmt = '₹' + Math.round(amount / 100).toLocaleString('en-IN')
  await create(schoolId, '✅ Payment Successful', `Your payment of ${fmt} for ${planName} was successful.`, 'payment')
}

/** Featured listing activated */
export async function notifyFeaturedActivated(schoolId: string, durationDays: number) {
  await create(
    schoolId,
    '⭐ Featured Listing Activated',
    `Your school is now featured for ${durationDays} days. You'll appear at the top of search results.`,
    'featured'
  )
}
