export const dynamic = 'force-dynamic'
/**
 * POST /api/admin/fix-pending-payments
 * One-time fix: finds all pending Easebuzz payments, verifies against
 * Easebuzz Transaction API, and marks confirmed ones as completed.
 * 
 * SAFE: read-only check first, only updates if Easebuzz confirms success.
 * DELETE THIS FILE after running once.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import crypto from 'crypto'

async function getEasebuzzKeys() {
  const row = await db.query(
    `SELECT key_id, key_secret FROM payment_gateways WHERE id='easebuzz' AND enabled=true LIMIT 1`
  ).catch(() => ({ rows: [] }))
  return {
    key:  (row.rows[0]?.key_id  || '').trim(),
    salt: (row.rows[0]?.key_secret || '').trim(),
  }
}

async function checkEasebuzzTxn(key: string, salt: string, txnid: string): Promise<{ status: string | null, raw: any }> {
  const hash = crypto.createHash('sha512').update(`${key}|${txnid}|${salt}`).digest('hex')
  try {
    const res = await fetch('https://pay.easebuzz.in/transaction/v1/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key, txnid, hash }).toString(),
    })
    const data = await res.json()
    let status = null
    if (data.status === 1 && data.data?.status) status = data.data.status
    else if (data.status === 1 && Array.isArray(data.data) && data.data[0]?.status) status = data.data[0].status
    return { status, raw: data }
  } catch (e: any) {
    return { status: null, raw: { error: e.message } }
  }
}

async function activateSubscription(rec: any) {
  const leadCount = rec.lead_count ?? 0
  const planRow = await db.query(
    `SELECT name, includes_featured_listing, featured_listing_days FROM subscription_plans WHERE plan_key=$1`,
    [rec.plan_key]
  ).catch(() => ({ rows: [] }))
  const planName = planRow.rows[0]?.name || rec.plan_key

  await db.query(`
    INSERT INTO school_subscriptions (school_id, plan_key, plan_name, lead_count, activated_at, payment_id)
    VALUES ($1,$2,$3,$4,NOW(),$5)
    ON CONFLICT (school_id) DO UPDATE
      SET plan_key=$2, plan_name=$3, lead_count=$4, activated_at=NOW(), payment_id=$5, updated_at=NOW()
  `, [rec.school_id, rec.plan_key, planName, leadCount, rec.id])

  if (leadCount > 0) {
    await db.query(`
      INSERT INTO lead_credits (school_id, credits, total_credits, used_credits)
      VALUES ($1,$2,$2,0)
      ON CONFLICT (school_id) DO UPDATE
        SET credits=lead_credits.credits+$2, total_credits=lead_credits.total_credits+$2, updated_at=NOW()
    `, [rec.school_id, leadCount])
  }

  if (planRow.rows[0]?.includes_featured_listing) {
    const days = Number(planRow.rows[0].featured_listing_days ?? 30)
    await db.query(
      `UPDATE schools SET is_featured=true, featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
      [String(days), rec.school_id]
    ).catch(() => {})
  }

  await db.query(
    `UPDATE subscription_payments SET status='completed', payment_id='easebuzz_recovered', updated_at=NOW() WHERE id=$1`,
    [rec.id]
  )

  // Send notification
  import('@/lib/notify').then(m => m.notifyPaymentDone(rec.school_id, planName, rec.amount_paise)).catch(() => {})

  return { planName, leadCount }
}

export async function POST(req: NextRequest) {
  try {
    const { key, salt } = await getEasebuzzKeys()
    if (!key || !salt) return NextResponse.json({ error: 'Easebuzz not configured' }, { status: 400 })

    // Find all pending Easebuzz subscription payments
    const pending = await db.query(`
      SELECT * FROM subscription_payments
      WHERE gateway='easebuzz' AND status='pending'
      ORDER BY created_at DESC
    `).catch(() => ({ rows: [] }))

    const results: any[] = []

    for (const rec of pending.rows) {
      const txnid = rec.order_id
      if (!txnid) continue

      const { status: ebStatus, raw } = await checkEasebuzzTxn(key, salt, txnid)

      if (ebStatus === 'success') {
        const activated = await activateSubscription(rec)
        results.push({ txnid, status: 'FIXED', ...activated, raw })
      } else {
        results.push({ txnid, status: 'SKIPPED', easebuzzStatus: ebStatus || 'unknown', raw })
      }
    }

    // Also check featured_listing_payments
    const pendingFeatured = await db.query(`
      SELECT * FROM featured_listing_payments
      WHERE gateway='easebuzz' AND status='pending'
      ORDER BY created_at DESC
    `).catch(() => ({ rows: [] }))

    for (const rec of pendingFeatured.rows) {
      const txnid = rec.order_id
      if (!txnid) continue

      const { status: ebStatus, raw } = await checkEasebuzzTxn(key, salt, txnid)

      if (ebStatus === 'success') {
        await db.query(
          `UPDATE featured_listing_payments SET status='completed', payment_id='easebuzz_recovered', updated_at=NOW() WHERE id=$1`,
          [rec.id]
        )
        await db.query(
          `UPDATE schools SET is_featured=true, featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
          [String(rec.duration_days || 30), rec.school_id]
        ).catch(() => {})
        import('@/lib/notify').then(m => m.notifyFeaturedActivated(rec.school_id, rec.duration_days || 30)).catch(() => {})
        results.push({ txnid, type: 'featured', status: 'FIXED', days: rec.duration_days, raw })
      } else {
        results.push({ txnid, type: 'featured', status: 'SKIPPED', easebuzzStatus: ebStatus || 'unknown', raw })
      }
    }

    return NextResponse.json({
      fixed:   results.filter(r => r.status === 'FIXED').length,
      skipped: results.filter(r => r.status === 'SKIPPED').length,
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
