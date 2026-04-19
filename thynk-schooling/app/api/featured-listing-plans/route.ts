export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'
import {
  createOrder,
  verifyPayment,
  getEnabledGateways,
  ensureGatewayTable,
  type GatewayId,
} from '@/lib/payment-gateway'

const BASE_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value || ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

async function parseBody(req: NextRequest): Promise<Record<string, any>> {
  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) return await req.json()
    return {}
  } catch { return {} }
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS featured_listing_plans (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_key      VARCHAR(80) NOT NULL UNIQUE,
      name          VARCHAR(200) NOT NULL,
      description   TEXT,
      price_paise   INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER NOT NULL DEFAULT 30,
      features      JSONB NOT NULL DEFAULT '[]',
      is_hot        BOOLEAN NOT NULL DEFAULT false,
      cta           VARCHAR(100) NOT NULL DEFAULT 'Get Featured',
      sort_order    INTEGER NOT NULL DEFAULT 0,
      is_active     BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS featured_listing_payments (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id             UUID NOT NULL,
      plan_key              VARCHAR(80) NOT NULL,
      plan_name             VARCHAR(200),
      gateway               VARCHAR(20) NOT NULL DEFAULT 'demo',
      order_id              VARCHAR(300),
      payment_id            VARCHAR(300),
      amount_paise          INTEGER NOT NULL DEFAULT 0,
      discount_paise        INTEGER NOT NULL DEFAULT 0,
      original_amount_paise INTEGER,
      coupon_code           VARCHAR(50),
      duration_days         INTEGER NOT NULL DEFAULT 30,
      status                VARCHAR(20) NOT NULL DEFAULT 'pending',
      meta                  JSONB DEFAULT '{}',
      created_at            TIMESTAMPTZ DEFAULT NOW(),
      updated_at            TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // CRITICAL: ensure schools has these columns — they may be missing if
  // subscriptions route has never been called on this DB
  await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`).catch(() => {})
  await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ`).catch(() => {})

  // Remove auto-seeded Spotlight defaults
  await db.query(`DELETE FROM featured_listing_plans WHERE plan_key IN ('featured_7','featured_30','featured_90')`).catch(() => {})

  await ensureGatewayTable().catch(() => {})
}

// Does NOT silently swallow errors — called after every successful payment
async function activateFeatured(schoolId: string, durationDays: number) {
  const res = await db.query(
    `UPDATE schools
     SET is_featured    = true,
         featured_until = NOW() + ($1 || ' days')::INTERVAL
     WHERE id = $2
     RETURNING id`,
    [String(durationDays), schoolId]
  )
  if (!res.rows.length) throw new Error(`School ${schoolId} not found — cannot activate featured listing`)
}

function toPlan(row: any) {
  return {
    id:           row.id,
    planKey:      row.plan_key,
    name:         row.name,
    description:  row.description || '',
    price:        row.price_paise,
    durationDays: row.duration_days,
    features:     Array.isArray(row.features) ? row.features : JSON.parse(row.features || '[]'),
    isHot:        row.is_hot ?? false,
    cta:          row.cta || 'Get Featured',
    sortOrder:    row.sort_order ?? 0,
    isActive:     row.is_active,
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'current') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const school = await db.query(
        'SELECT id, is_featured, featured_until FROM schools WHERE admin_user_id=$1', [userId]
      ).catch(() => ({ rows: [] }))
      if (!school.rows.length) return NextResponse.json({ isFeatured: false })
      const s = school.rows[0]
      const until = s.featured_until ? new Date(s.featured_until) : null
      return NextResponse.json({
        isFeatured:    s.is_featured === true && (!until || until > new Date()),
        featuredUntil: s.featured_until ?? null,
      })
    }

    const plans    = await db.query(`SELECT * FROM featured_listing_plans WHERE is_active=true ORDER BY sort_order ASC`).catch(() => ({ rows: [] }))
    const gateways = await getEnabledGateways().catch(() => [])
    return NextResponse.json({ plans: plans.rows.map(toPlan), gateways })
  } catch (e: any) {
    console.error('[featured-listing-plans GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const school = await db.query('SELECT id, name FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
    if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    const schoolId   = school.rows[0].id
    const schoolName = school.rows[0].name

    // ── BUY ───────────────────────────────────────────────────────────────────
    if (action === 'buy') {
      const planId    = searchParams.get('id')
      const gatewayId = (searchParams.get('gateway') || 'razorpay') as GatewayId
      const couponId  = searchParams.get('coupon_id')
      if (!planId) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })

      const planRow = await db.query('SELECT * FROM featured_listing_plans WHERE id=$1 AND is_active=true', [planId])
      if (!planRow.rows.length) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      const plan = planRow.rows[0]

      let discountPaise = 0, finalAmountPaise = plan.price_paise, couponCode: string | null = null
      if (couponId) {
        const cr = await db.query(`SELECT * FROM discount_coupons WHERE id=$1`, [couponId]).catch(() => ({ rows: [] }))
        const c = cr.rows[0]
        if (c) {
          couponCode    = c.code
          discountPaise = c.type === 'percent' ? Math.round(plan.price_paise * c.value / 100) : (c.value ?? 0)
          finalAmountPaise = Math.max(0, plan.price_paise - discountPaise)
        }
      }

      const payRec = await db.query(
        `INSERT INTO featured_listing_payments
           (school_id,plan_key,plan_name,gateway,amount_paise,discount_paise,original_amount_paise,coupon_code,duration_days,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING id`,
        [schoolId, plan.plan_key, plan.name, gatewayId, finalAmountPaise, discountPaise, plan.price_paise, couponCode, plan.duration_days]
      )
      const payId = payRec.rows[0].id

      // Free plan — activate instantly
      if (finalAmountPaise === 0) {
        await activateFeatured(schoolId, plan.duration_days)
        await db.query(`UPDATE featured_listing_payments SET status='completed', payment_id=$1 WHERE id=$2`, ['free_' + Date.now(), payId])
        return NextResponse.json({ success: true })
      }

      const user = await db.query(
        `SELECT COALESCE(full_name,name) AS name, email, COALESCE(phone,mobile) AS phone FROM users WHERE id=$1`, [userId]
      ).catch(() => ({ rows: [] }))
      const u = user.rows[0] || {}

      const order = await createOrder({
        gatewayId,
        amountPaise:   finalAmountPaise,
        currency:      'INR',
        receiptId:     payId,
        description:   `${plan.name} – Featured Listing`,
        customerName:  u.name  || schoolName || 'School',
        customerEmail: u.email || '',
        customerPhone: u.phone || '',
        callbackType:  'featured',
        returnUrl:     `${BASE_URL}/dashboard/school/packages?tab=featured&order_id=${payId}&gateway=${gatewayId}`,
      })

      await db.query(`UPDATE featured_listing_payments SET order_id=$1 WHERE id=$2`, [order.orderId, payId])
      return NextResponse.json({ ...order, paymentRecordId: payId })
    }

    // ── VERIFY PAYMENT ────────────────────────────────────────────────────────
    if (action === 'verify-payment') {
      const body = await parseBody(req)
      const { gateway, orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature, cfOrderId } = body

      const resolvedOrderId = orderId || razorpay_order_id || cfOrderId
      if (!resolvedOrderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

      const payRec = await db.query(
        `SELECT * FROM featured_listing_payments WHERE order_id=$1 AND status='pending'`, [resolvedOrderId]
      ).catch(() => ({ rows: [] }))

      if (!payRec.rows.length) {
        console.error('[featured verify] no pending record for order_id:', resolvedOrderId)
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }
      const pay = payRec.rows[0]
      const gwId = (gateway || pay.gateway) as GatewayId

      const result = await verifyPayment({
        gateway:   gwId,
        orderId:   resolvedOrderId,
        paymentId: razorpay_payment_id || cfOrderId,
        signature: razorpay_signature,
      })
      if (!result.success) {
        console.error('[featured verify] failed:', result.error)
        return NextResponse.json({ error: result.error || 'Payment verification failed' }, { status: 400 })
      }

      await db.query(
        `UPDATE featured_listing_payments SET status='completed', payment_id=$1, updated_at=NOW() WHERE id=$2`,
        [result.paymentId || razorpay_payment_id || resolvedOrderId, pay.id]
      )

      // Activate — errors are NOT swallowed so we know if it fails
      await activateFeatured(pay.school_id, pay.duration_days)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[featured-listing-plans POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
