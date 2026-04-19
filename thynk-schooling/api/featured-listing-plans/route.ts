export const dynamic = 'force-dynamic'
/**
 * /api/featured-listing-plans
 *
 * GET  — list all active featured listing plans
 * POST ?action=buy&id=X&gateway=Y  — create payment order
 * POST ?action=verify-payment      — verify & activate featured listing
 */

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

const DEFAULT_FEATURED_PLANS = [
  {
    name: 'Spotlight – 7 Days',
    plan_key: 'featured_7',
    description: 'Get noticed for a week. Ideal for testing featured placement.',
    price_paise: 49900,
    duration_days: 7,
    features: ['Top-of-search placement', 'Featured badge on listing', 'Priority in city search', 'Analytics dashboard'],
    is_hot: false,
    cta: 'Get Featured',
    sort_order: 1,
  },
  {
    name: 'Spotlight – 30 Days',
    plan_key: 'featured_30',
    description: 'Full month of premium visibility during peak admission season.',
    price_paise: 149900,
    duration_days: 30,
    features: ['Top-of-search placement', 'Featured badge on listing', 'Priority in city search', 'Analytics dashboard', 'Homepage carousel slot', 'Email campaign inclusion'],
    is_hot: true,
    cta: 'Get Featured',
    sort_order: 2,
  },
  {
    name: 'Spotlight – 90 Days',
    plan_key: 'featured_90',
    description: 'Dominate search for the full admission quarter.',
    price_paise: 349900,
    duration_days: 90,
    features: ['Top-of-search placement', 'Featured badge on listing', 'Priority in city search', 'Analytics dashboard', 'Homepage carousel slot', 'Email campaign inclusion', 'Social media spotlight', 'Dedicated account manager'],
    is_hot: false,
    cta: 'Get Featured',
    sort_order: 3,
  },
]

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS featured_listing_plans (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_key     VARCHAR(80) NOT NULL UNIQUE,
      name         VARCHAR(200) NOT NULL,
      description  TEXT,
      price_paise  INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER NOT NULL DEFAULT 30,
      features     JSONB NOT NULL DEFAULT '[]',
      is_hot       BOOLEAN NOT NULL DEFAULT false,
      cta          VARCHAR(100) NOT NULL DEFAULT 'Get Featured',
      sort_order   INTEGER NOT NULL DEFAULT 0,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
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

  // Seed defaults if empty
  const count = await db.query('SELECT COUNT(*) FROM featured_listing_plans').catch(() => ({ rows: [{ count: '0' }] }))
  if (Number(count.rows[0].count) === 0) {
    for (const p of DEFAULT_FEATURED_PLANS) {
      await db.query(
        `INSERT INTO featured_listing_plans (plan_key, name, description, price_paise, duration_days, features, is_hot, cta, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
        [p.plan_key, p.name, p.description, p.price_paise, p.duration_days, JSON.stringify(p.features), p.is_hot, p.cta, p.sort_order]
      ).catch(() => {})
    }
  }

  await ensureGatewayTable().catch(() => {})
}

function toPlan(row: any) {
  return {
    id:           row.id,
    planKey:      row.plan_key,
    name:         row.name,
    description:  row.description || '',
    price:        row.price_paise,
    durationDays: row.duration_days,
    features:     Array.isArray(row.features) ? row.features : (JSON.parse(row.features || '[]')),
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

    // Current featured status for a school
    if (action === 'current') {
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const school = await db.query('SELECT id, is_featured, featured_until FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
      if (!school.rows.length) return NextResponse.json({ isFeatured: false })
      const s = school.rows[0]
      return NextResponse.json({
        isFeatured:    s.is_featured ?? false,
        featuredUntil: s.featured_until ?? null,
      })
    }

    // List active plans + enabled gateways
    const plans = await db.query(
      `SELECT * FROM featured_listing_plans WHERE is_active = true ORDER BY sort_order ASC`
    ).catch(() => ({ rows: [] }))

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

    // ── Buy ───────────────────────────────────────────────────────────────────
    if (action === 'buy') {
      const planId    = searchParams.get('id')
      const gatewayId = (searchParams.get('gateway') || 'razorpay') as GatewayId
      const couponId  = searchParams.get('coupon_id')

      if (!planId) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })

      const planRow = await db.query('SELECT * FROM featured_listing_plans WHERE id=$1 AND is_active=true', [planId])
      if (!planRow.rows.length) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      const plan = planRow.rows[0]

      // Coupon handling
      let discountPaise = 0
      let finalAmountPaise = plan.price_paise
      let couponCode: string | null = null
      if (couponId) {
        const couponRes = await db.query(`SELECT * FROM discount_coupons WHERE id=$1`, [couponId]).catch(() => ({ rows: [] }))
        const coupon = couponRes.rows[0]
        if (coupon) {
          couponCode = coupon.code
          if (coupon.type === 'percent') discountPaise = Math.round(plan.price_paise * coupon.value / 100)
          else discountPaise = coupon.value ?? 0
          finalAmountPaise = Math.max(0, plan.price_paise - discountPaise)
        }
      }

      // Create payment record
      const payRec = await db.query(
        `INSERT INTO featured_listing_payments
           (school_id, plan_key, plan_name, gateway, amount_paise, discount_paise, original_amount_paise, coupon_code, duration_days, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING id`,
        [schoolId, plan.plan_key, plan.name, gatewayId, finalAmountPaise, discountPaise, plan.price_paise, couponCode, plan.duration_days]
      )
      const payId = payRec.rows[0].id

      // Dev / zero-price
      if (process.env.NODE_ENV === 'development' || finalAmountPaise === 0) {
        await db.query(
          `UPDATE schools SET is_featured=true, featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
          [plan.duration_days, schoolId]
        )
        await db.query(
          `UPDATE featured_listing_payments SET status='completed', payment_id=$1 WHERE id=$2`,
          ['dev_' + Date.now(), payId]
        )
        return NextResponse.json({ success: true, _dev: true })
      }

      const user = await db.query(
        `SELECT COALESCE(full_name,name) AS name, email, COALESCE(phone,mobile) AS phone FROM users WHERE id=$1`,
        [userId]
      ).catch(() => ({ rows: [] }))
      const u = user.rows[0] || {}

      const order = await createOrder({
        gatewayId,
        amountPaise: finalAmountPaise,
        currency: 'INR',
        receiptId: payId,
        description: `${plan.name} – Featured Listing`,
        customerName:  u.name  || schoolName || 'School',
        customerEmail: u.email || '',
        customerPhone: u.phone || '',
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/school/packages?tab=featured&order_id=${payId}&gateway=${gatewayId}`,
      })

      await db.query(`UPDATE featured_listing_payments SET order_id=$1 WHERE id=$2`, [order.orderId, payId])
      return NextResponse.json({ ...order, paymentRecordId: payId })
    }

    // ── Verify payment ────────────────────────────────────────────────────────
    if (action === 'verify-payment') {
      const body = await parseBody(req)
      const { gateway, orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

      const payRec = await db.query(
        `SELECT * FROM featured_listing_payments WHERE order_id=$1 AND status='pending'`,
        [orderId]
      ).catch(() => ({ rows: [] }))

      if (!payRec.rows.length) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      const pay = payRec.rows[0]

      const verified = await verifyPayment({
        gatewayId: gateway,
        orderId,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        razorpayOrderId: razorpay_order_id,
      })

      if (!verified) return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })

      await db.query(
        `UPDATE featured_listing_payments SET status='completed', payment_id=$1, updated_at=NOW() WHERE id=$2`,
        [razorpay_payment_id || orderId, pay.id]
      )
      await db.query(
        `UPDATE schools SET is_featured=true, featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
        [pay.duration_days, pay.school_id]
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('[featured-listing-plans POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
