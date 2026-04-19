export const dynamic = 'force-dynamic'
/**
 * /api/easebuzz-callback
 *
 * PUBLIC endpoint — Easebuzz POSTs back here after payment (no auth header sent).
 * It handles both lead-package payments and subscription-plan payments.
 *
 * Query param: ?type=lead | ?type=subscription
 *
 * Easebuzz posts form-urlencoded with fields:
 *   txnid, status, hash, amount, email, firstname, productinfo, key, ...
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import db from '@/lib/db'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

async function getEasebuzzConfig() {
  const row = await db.query(
    `SELECT key_id, key_secret, extra FROM payment_gateways WHERE id='easebuzz' AND enabled=true`
  ).catch(() => ({ rows: [] }))
  if (!row.rows.length) return null
  return {
    keyId:  row.rows[0].key_id  as string,
    salt:   (row.rows[0].extra as any)?.salt as string || '',
  }
}

function verifyHash(params: Record<string, string>, salt: string): boolean {
  // Easebuzz reverse hash: sha512(SALT|status|||||||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const fields = ['status','udf5','udf4','udf3','udf2','udf1','email','firstname','productinfo','amount','txnid','key']
  const hashStr = [salt, ...fields.map(f => params[f] || '')].join('|')
  const expected = crypto.createHash('sha512').update(hashStr).digest('hex')
  return expected === params['hash']
}

export async function POST(req: NextRequest) {
  const type = new URL(req.url).searchParams.get('type') || 'lead'

  try {
    // Parse form-urlencoded body
    const text = await req.text()
    const params = Object.fromEntries(new URLSearchParams(text).entries())

    const { txnid, status, hash } = params
    const success = status === 'success'

    if (!txnid) {
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
    }

    // Verify Easebuzz hash
    const cfg = await getEasebuzzConfig()
    if (cfg && hash) {
      const valid = verifyHash(params, cfg.salt)
      if (!valid) {
        console.error('[easebuzz-callback] Hash mismatch for txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
      }
    }

    if (!success) {
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
    }

    if (type === 'subscription') {
      // ── Handle subscription payment ───────────────────────────────────────
      const payment = await db.query(
        `SELECT * FROM subscription_payments WHERE order_id=$1 AND status='pending'`,
        [txnid]
      ).catch(() => ({ rows: [] }))

      if (!payment.rows.length) {
        console.error('[easebuzz-callback] subscription payment not found for txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
      }

      const rec = payment.rows[0]
      const { school_id, plan_key, leads_per_month } = rec

      // Get plan name
      const planRow = await db.query(
        `SELECT name, includes_featured_listing FROM subscription_plans WHERE plan_key=$1`,
        [plan_key]
      ).catch(() => ({ rows: [] }))
      const planName = planRow.rows[0]?.name || plan_key
      const isFeaturedPlan = planRow.rows[0]?.includes_featured_listing ?? false

      // Activate subscription
      await db.query(`
        INSERT INTO school_subscriptions (school_id, plan_key, plan_name, leads_per_month, activated_at, payment_id)
        VALUES ($1,$2,$3,$4,NOW(),$5)
        ON CONFLICT (school_id) DO UPDATE
          SET plan_key=$2, plan_name=$3, leads_per_month=$4, activated_at=NOW(), payment_id=$5, updated_at=NOW()
      `, [school_id, plan_key, planName, leads_per_month, rec.id])

      // Auto-feature school if plan includes featured listing
      await db.query(`UPDATE schools SET is_featured=$1 WHERE id=$2`, [isFeaturedPlan, school_id]).catch(() => {})

      // Credit leads
      if (leads_per_month > 0) {
        await db.query(`
          INSERT INTO lead_credits (school_id, credits, total_credits, used_credits) VALUES ($1,$2,$2,0)
          ON CONFLICT (school_id) DO UPDATE
            SET credits=lead_credits.credits+$2, total_credits=lead_credits.total_credits+$2, updated_at=NOW()
        `, [school_id, leads_per_month])
      }

      await db.query(
        `UPDATE subscription_payments SET status='completed', payment_id=$1, updated_at=NOW() WHERE order_id=$2`,
        [params['mihpayid'] || txnid, txnid]
      ).catch(() => {})

    } else {
      // ── Handle lead-package payment ───────────────────────────────────────
      const payment = await db.query(
        `SELECT * FROM lead_package_payments WHERE order_id=$1 AND status='pending'`,
        [txnid]
      ).catch(() => ({ rows: [] }))

      if (!payment.rows.length) {
        console.error('[easebuzz-callback] lead payment not found for txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
      }

      const rec = payment.rows[0]
      const { school_id, credits_added } = rec

      // Credit lead credits
      await db.query(`
        INSERT INTO lead_credits (school_id, credits, total_credits, used_credits) VALUES ($1,$2,$2,0)
        ON CONFLICT (school_id) DO UPDATE
          SET credits=lead_credits.credits+$2, total_credits=lead_credits.total_credits+$2, updated_at=NOW()
      `, [school_id, credits_added])

      await db.query(
        `UPDATE lead_package_payments SET status='completed', payment_id=$1 WHERE order_id=$2`,
        [params['mihpayid'] || txnid, txnid]
      ).catch(() => {})
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=success`, 303)

  } catch (e: any) {
    console.error('[easebuzz-callback]', e)
    return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
  }
}
