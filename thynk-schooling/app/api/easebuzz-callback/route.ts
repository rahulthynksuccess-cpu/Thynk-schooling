export const dynamic = 'force-dynamic'
/**
 * /api/easebuzz-callback
 * PUBLIC — Easebuzz POSTs form-urlencoded here after payment.
 * ?type=lead | subscription | featured
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import db from '@/lib/db'

// MUST be server-side env var — NEXT_PUBLIC_ is undefined on server
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''

async function getEasebuzzSalt(): Promise<string> {
  const row = await db.query(
    `SELECT extra FROM payment_gateways WHERE id='easebuzz' AND enabled=true LIMIT 1`
  ).catch(() => ({ rows: [] }))
  return (row.rows[0]?.extra as any)?.salt || ''
}

function verifyHash(params: Record<string, string>, salt: string): boolean {
  // Easebuzz reverse hash formula:
  // sha512(SALT|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const fields = ['status','udf5','udf4','udf3','udf2','udf1','email','firstname','productinfo','amount','txnid','key']
  const str = [salt, ...fields.map(f => params[f] || '')].join('|')
  return crypto.createHash('sha512').update(str).digest('hex') === params['hash']
}

async function ensureSchoolColumns() {
  await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`).catch(() => {})
  await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ`).catch(() => {})
}

async function activateFeatured(schoolId: string, durationDays: number) {
  await db.query(
    `UPDATE schools SET is_featured=true, featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
    [String(durationDays), schoolId]
  )
}

async function creditLeads(schoolId: string, leadCount: number) {
  if (!leadCount || leadCount === -1) return
  await db.query(`
    INSERT INTO lead_credits (school_id, credits, total_credits, used_credits) VALUES ($1,$2,$2,0)
    ON CONFLICT (school_id) DO UPDATE
      SET credits=lead_credits.credits+$2, total_credits=lead_credits.total_credits+$2, updated_at=NOW()
  `, [schoolId, leadCount])
}

export async function POST(req: NextRequest) {
  const type = new URL(req.url).searchParams.get('type') || 'lead'

  try {
    await ensureSchoolColumns()

    const text   = await req.text()
    const params = Object.fromEntries(new URLSearchParams(text).entries())
    const { txnid, status, hash } = params

    if (!txnid) {
      console.error('[easebuzz-callback] missing txnid')
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
    }

    // Verify hash — skip only if salt is not configured (shouldn't happen in prod)
    const salt = await getEasebuzzSalt()
    if (salt && hash) {
      if (!verifyHash(params, salt)) {
        console.error('[easebuzz-callback] HASH MISMATCH for txnid:', txnid, 'type:', type)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
      }
    }

    const success = status === 'success'
    if (!success) {
      console.warn('[easebuzz-callback] payment not success, status:', status, 'txnid:', txnid)
      const tab = type === 'featured' ? 'featured' : 'leads'
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=${tab}&status=failed`, 303)
    }

    const mihpayid = params['mihpayid'] || txnid

    // ── FEATURED LISTING ─────────────────────────────────────────────────────
    if (type === 'featured') {
      const pay = await db.query(
        `SELECT * FROM featured_listing_payments WHERE order_id=$1 AND status='pending'`, [txnid]
      ).catch(() => ({ rows: [] }))

      if (!pay.rows.length) {
        console.error('[easebuzz-callback] featured payment not found, txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=featured&status=failed`, 303)
      }

      const rec = pay.rows[0]
      await db.query(
        `UPDATE featured_listing_payments SET status='completed', payment_id=$1, updated_at=NOW() WHERE id=$2`,
        [mihpayid, rec.id]
      )
      await activateFeatured(rec.school_id, rec.duration_days)
      console.log('[easebuzz-callback] featured activated for school:', rec.school_id, 'days:', rec.duration_days)
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=featured&status=success`, 303)
    }

    // ── SUBSCRIPTION ─────────────────────────────────────────────────────────
    if (type === 'subscription') {
      const pay = await db.query(
        `SELECT * FROM subscription_payments WHERE order_id=$1 AND status='pending'`, [txnid]
      ).catch(() => ({ rows: [] }))

      if (!pay.rows.length) {
        console.error('[easebuzz-callback] subscription payment not found, txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=leads&status=failed`, 303)
      }

      const rec       = pay.rows[0]
      const leadCount = rec.lead_count ?? rec.leads_per_month ?? 0
      const planRow   = await db.query(`SELECT name, includes_featured_listing, featured_listing_days FROM subscription_plans WHERE plan_key=$1`, [rec.plan_key]).catch(() => ({ rows: [] }))
      const planName  = planRow.rows[0]?.name || rec.plan_key

      await db.query(`
        INSERT INTO school_subscriptions (school_id,plan_key,plan_name,lead_count,activated_at,payment_id)
        VALUES ($1,$2,$3,$4,NOW(),$5)
        ON CONFLICT (school_id) DO UPDATE
          SET plan_key=$2,plan_name=$3,lead_count=$4,activated_at=NOW(),payment_id=$5,updated_at=NOW()
      `, [rec.school_id, rec.plan_key, planName, leadCount, rec.id])

      await creditLeads(rec.school_id, leadCount)

      // If this subscription plan includes featured listing, activate it too
      if (planRow.rows[0]?.includes_featured_listing) {
        const days = Number(planRow.rows[0].featured_listing_days ?? 30)
        await activateFeatured(rec.school_id, days)
      }

      await db.query(
        `UPDATE subscription_payments SET status='completed', payment_id=$1, updated_at=NOW() WHERE id=$2`,
        [mihpayid, rec.id]
      )
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=leads&status=success`, 303)
    }

    // ── LEAD PACKAGE ─────────────────────────────────────────────────────────
    {
      const pay = await db.query(
        `SELECT * FROM lead_package_payments WHERE order_id=$1 AND status='pending'`, [txnid]
      ).catch(() => ({ rows: [] }))

      if (!pay.rows.length) {
        console.error('[easebuzz-callback] lead payment not found, txnid:', txnid)
        return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=leads&status=failed`, 303)
      }

      const rec = pay.rows[0]
      await creditLeads(rec.school_id, rec.credits_added)

      if (rec.package_id) {
        const pkg = await db.query(
          `SELECT includes_featured_listing, featured_listing_days FROM lead_packages WHERE id=$1`, [rec.package_id]
        ).catch(() => ({ rows: [] }))
        if (pkg.rows[0]?.includes_featured_listing) {
          await activateFeatured(rec.school_id, Number(pkg.rows[0].featured_listing_days ?? 30))
        }
      }

      await db.query(
        `UPDATE lead_package_payments SET status='completed', payment_id=$1 WHERE id=$2`,
        [mihpayid, rec.id]
      )
      return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?tab=leads&status=success`, 303)
    }

  } catch (e: any) {
    console.error('[easebuzz-callback] FATAL:', e.message, 'txnid:', new URLSearchParams(await req.text().catch(() => '')).get('txnid'))
    return NextResponse.redirect(`${APP_URL}/dashboard/school/packages?status=failed`, 303)
  }
}
