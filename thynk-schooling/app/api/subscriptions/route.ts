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
    if (ct.includes('application/x-www-form-urlencoded'))
      return Object.fromEntries(new URLSearchParams(await req.text()))
    return {}
  } catch { return {} }
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscription_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL,
      plan_key VARCHAR(50) NOT NULL,
      plan_name VARCHAR(100),
      gateway VARCHAR(20) NOT NULL DEFAULT 'demo',
      order_id VARCHAR(200),
      payment_id VARCHAR(200),
      amount_paise INTEGER NOT NULL DEFAULT 0,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      original_amount_paise INTEGER NOT NULL DEFAULT 0,
      coupon_code VARCHAR(50),
      leads_per_month INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      meta JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sub_pay_school ON subscription_payments(school_id)`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sub_pay_order  ON subscription_payments(order_id)`).catch(() => {})
  await db.query(`ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100)`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS school_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL UNIQUE,
      plan_key VARCHAR(50) NOT NULL DEFAULT 'free',
      plan_name VARCHAR(100),
      leads_per_month INTEGER NOT NULL DEFAULT 0,
      activated_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      payment_id UUID,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_school_sub_school ON school_subscriptions(school_id)`).catch(() => {})

  await db.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_featured_listing BOOLEAN DEFAULT false`).catch(() => {})
  await db.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS featured_listing_days INTEGER NOT NULL DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ`).catch(() => {})
}

async function applyFeaturedListing(planKey: string, schoolId: string) {
  try {
    const r = await db.query(
      `SELECT is_featured_listing, featured_listing_days FROM subscription_plans WHERE plan_key=$1`,
      [planKey]
    ).catch(() => ({ rows: [] }))
    const p = r.rows[0]
    if (p?.is_featured_listing && p.featured_listing_days > 0) {
      await db.query(
        `UPDATE schools SET is_featured=true, featured_until=NOW() + ($1||' days')::INTERVAL WHERE id=$2`,
        [p.featured_listing_days, schoolId]
      )
    }
  } catch (e) { console.error('[applyFeaturedListing]', e) }
}

async function creditLeads(schoolId: string, leadsPerMonth: number) {
  const credits = leadsPerMonth === -1 ? 999 : leadsPerMonth
  if (credits <= 0) return
  await db.query(`
    INSERT INTO lead_credits (school_id, credits, total_credits, used_credits)
    VALUES ($1,$2,$2,0)
    ON CONFLICT (school_id) DO UPDATE
      SET credits=lead_credits.credits+$2,
          total_credits=lead_credits.total_credits+$2,
          updated_at=NOW()
  `, [schoolId, credits])
}

async function recordAdminPayment(
  schoolId: string, planName: string, gateway: string,
  orderId: string, paymentId: string, amountPaise: number,
  discountPaise: number, originalAmountPaise: number,
  couponCode: string | null, creditsAdded: number
) {
  try {
    await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS discount_paise INTEGER NOT NULL DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER`).catch(() => {})
    await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)`).catch(() => {})
    await db.query(`
      INSERT INTO lead_package_payments
        (school_id, gateway, order_id, payment_id, amount_paise, discount_paise,
         original_amount_paise, coupon_code, credits_added, status, meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed',$10)
    `, [schoolId, gateway, orderId, paymentId, amountPaise, discountPaise,
        originalAmountPaise || amountPaise, couponCode, creditsAdded,
        JSON.stringify({ type: 'subscription', plan: planName })])
  } catch (e) { console.error('[recordAdminPayment]', e) }
}

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  if (action === 'current') {
    try {
      await ensureTables()
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
      if (!school.rows.length) return NextResponse.json({ planKey: null })
      const sub = await db.query('SELECT * FROM school_subscriptions WHERE school_id=$1', [school.rows[0].id]).catch(() => ({ rows: [] }))
      if (!sub.rows.length) return NextResponse.json({ planKey: null })
      const r = sub.rows[0]
      return NextResponse.json({ planKey: r.plan_key, planName: r.plan_name, leadsPerMonth: r.leads_per_month, activatedAt: r.activated_at, expiresAt: r.expires_at })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'activate-free') {
    try {
      await ensureTables()
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const planKey = searchParams.get('planKey')
      if (!planKey) return NextResponse.json({ error: 'planKey required' }, { status: 400 })
      const plan = await db.query('SELECT * FROM subscription_plans WHERE plan_key=$1 AND is_active=true', [planKey]).catch(() => ({ rows: [] }))
      if (!plan.rows.length) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      const p = plan.rows[0]
      if (p.price_paise > 0) return NextResponse.json({ error: 'This plan requires payment' }, { status: 400 })
      const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
      const schoolId = school.rows[0].id
      await db.query(`
        INSERT INTO school_subscriptions (school_id,plan_key,plan_name,leads_per_month,activated_at,expires_at)
        VALUES ($1,$2,$3,$4,NOW(),NULL)
        ON CONFLICT (school_id) DO UPDATE SET plan_key=$2,plan_name=$3,leads_per_month=$4,activated_at=NOW(),expires_at=NULL,updated_at=NOW()
      `, [schoolId, p.plan_key, p.name, p.leads_per_month])
      await creditLeads(schoolId, p.leads_per_month)
      await applyFeaturedListing(p.plan_key, schoolId)
      return NextResponse.json({ success: true, planKey: p.plan_key, planName: p.name })
    } catch (e: any) {
      console.error('[subscriptions activate-free]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'buy') {
    try {
      await ensureTables()
      await ensureGatewayTable()
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const planKey      = searchParams.get('planKey')
      const gatewayId    = (searchParams.get('gateway') || 'razorpay') as GatewayId
      const couponIdParam = searchParams.get('coupon_id') || null
      if (!planKey) return NextResponse.json({ error: 'planKey required' }, { status: 400 })
      const plan = await db.query('SELECT * FROM subscription_plans WHERE plan_key=$1 AND is_active=true', [planKey]).catch(() => ({ rows: [] }))
      if (!plan.rows.length) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      const p = plan.rows[0]
      const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId]).catch(() => ({ rows: [] }))
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
      const schoolId = school.rows[0].id

      let finalPricePaise = p.price_paise
      let discountPaise = 0, couponId: string | null = null, couponCodeStr: string | null = null
      if (couponIdParam) {
        const cr = await db.query('SELECT * FROM discount_coupons WHERE id=$1', [couponIdParam]).catch(() => ({ rows: [] }))
        const c = cr.rows[0]
        if (c && c.active &&
            (!c.valid_until || new Date(c.valid_until) >= new Date()) &&
            (!c.valid_from  || new Date(c.valid_from)  <= new Date()) &&
            (c.max_uses === null || c.used_count < c.max_uses) &&
            (p.price_paise / 100 >= Number(c.min_amount || 0)) &&
            (!c.applicable_gateways?.length || c.applicable_gateways.includes(gatewayId))) {
          discountPaise   = c.type === 'percent' ? Math.round((p.price_paise * Number(c.value)) / 100) : Math.round(Number(c.value) * 100)
          discountPaise   = Math.min(discountPaise, p.price_paise)
          finalPricePaise = p.price_paise - discountPaise
          couponId = c.id; couponCodeStr = c.code
        }
      }

      const gw = await db.query('SELECT key_id,key_secret FROM payment_gateways WHERE id=$1 AND enabled=true', [gatewayId]).catch(() => ({ rows: [] }))
      const hasKeys = gw.rows.length > 0 && gw.rows[0].key_id && gw.rows[0].key_secret

      if (!hasKeys) {
        await db.query(`
          INSERT INTO school_subscriptions (school_id,plan_key,plan_name,leads_per_month,activated_at)
          VALUES ($1,$2,$3,$4,NOW())
          ON CONFLICT (school_id) DO UPDATE SET plan_key=$2,plan_name=$3,leads_per_month=$4,activated_at=NOW(),updated_at=NOW()
        `, [schoolId, p.plan_key, p.name, p.leads_per_month])
        await creditLeads(schoolId, p.leads_per_month)
        await applyFeaturedListing(p.plan_key, schoolId)
        return NextResponse.json({ success: true, _dev: true, orderId: 'demo_sub_' + Date.now(), message: 'Subscription activated (demo mode)' })
      }

      const ui = await db.query(`SELECT COALESCE(full_name,name) AS name, email, COALESCE(phone,mobile) AS phone FROM users WHERE id=$1`, [userId]).catch(() => ({ rows: [] }))
      const buyer = ui.rows[0] || {}
      const receipt = `sub_${p.id.replace(/-/g,'').slice(0,8)}_${Date.now().toString(36)}`

      try {
        const order = await createOrder(gatewayId, finalPricePaise, 'INR', receipt, {
          buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: buyer.phone,
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions?action=verify-payment`,
        })
        await db.query(`
          INSERT INTO subscription_payments
            (school_id,plan_key,plan_name,gateway,order_id,amount_paise,discount_paise,
             original_amount_paise,coupon_code,leads_per_month,status,meta)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11)
        `, [schoolId, p.plan_key, p.name, order.gateway, order.orderId,
            finalPricePaise, discountPaise, p.price_paise, couponCodeStr,
            p.leads_per_month, JSON.stringify({ ...order.clientPayload, coupon_id: couponId })])
        if (couponId) await db.query('UPDATE discount_coupons SET used_count=used_count+1,updated_at=NOW() WHERE id=$1', [couponId]).catch(() => {})
        return NextResponse.json({ gateway: order.gateway, orderId: order.orderId, amount: order.amount, currency: order.currency, clientPayload: order.clientPayload, discount_paise: discountPaise, original_amount: p.price_paise, coupon_applied: !!couponId })
      } catch (gwErr: any) {
        if (process.env.NODE_ENV !== 'production') {
          const mid = `order_dev_sub_${Date.now()}`
          await db.query(`INSERT INTO subscription_payments (school_id,plan_key,plan_name,gateway,order_id,amount_paise,leads_per_month,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,
            [schoolId, p.plan_key, p.name, gatewayId, mid, finalPricePaise, p.leads_per_month])
          return NextResponse.json({ gateway: gatewayId, orderId: mid, amount: finalPricePaise, currency: 'INR', _dev: true })
        }
        throw gwErr
      }
    } catch (e: any) {
      console.error('[subscriptions buy]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'verify-payment') {
    try {
      await ensureTables()
      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const body = await parseBody(req)
      const { gateway = 'razorpay', orderId,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        cfOrderId, txnid, status: txnStatus, hash: ebHash, paypalOrderId } = body

      const resolvedOrderId = orderId || razorpay_order_id || cfOrderId || txnid || paypalOrderId
      if (!resolvedOrderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

      const payment = await db.query(`SELECT * FROM subscription_payments WHERE order_id=$1 AND status='pending'`, [resolvedOrderId])

      if (!payment.rows.length) {
        if (process.env.NODE_ENV !== 'production' && resolvedOrderId.startsWith('order_dev_sub_')) {
          const dev = await db.query('SELECT * FROM subscription_payments WHERE order_id=$1 LIMIT 1', [resolvedOrderId])
          if (dev.rows.length) {
            const { school_id, plan_key, plan_name, leads_per_month } = dev.rows[0]
            await db.query(`INSERT INTO school_subscriptions (school_id,plan_key,plan_name,leads_per_month,activated_at) VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (school_id) DO UPDATE SET plan_key=$2,plan_name=$3,leads_per_month=$4,activated_at=NOW(),updated_at=NOW()`,
              [school_id, plan_key, plan_name, leads_per_month])
            await creditLeads(school_id, leads_per_month)
            await applyFeaturedListing(plan_key, school_id)
            await db.query(`UPDATE subscription_payments SET status='completed',payment_id='dev_payment' WHERE order_id=$1`, [resolvedOrderId])
            const ca = leads_per_month === -1 ? 999 : leads_per_month
            await recordAdminPayment(school_id, plan_name||plan_key, 'demo', resolvedOrderId, 'dev_payment', 0, 0, 0, null, ca)
            return NextResponse.json({ success: true, leadsAdded: leads_per_month })
          }
        }
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }

      const rec  = payment.rows[0]
      const gwId = (gateway || rec.gateway) as GatewayId

      const result = await verifyPayment({
        gateway: gwId, orderId: resolvedOrderId,
        paymentId: razorpay_payment_id || cfOrderId || paypalOrderId,
        signature: razorpay_signature  || ebHash,
        status:    txnStatus,
      })
      if (!result.success) return NextResponse.json({ error: result.error || 'Payment verification failed' }, { status: 400 })

      const { school_id, plan_key, plan_name, leads_per_month,
              amount_paise, discount_paise, original_amount_paise, coupon_code } = rec

      await db.query(`
        INSERT INTO school_subscriptions (school_id,plan_key,plan_name,leads_per_month,activated_at,payment_id)
        VALUES ($1,$2,$3,$4,NOW(),$5)
        ON CONFLICT (school_id) DO UPDATE SET plan_key=$2,plan_name=$3,leads_per_month=$4,activated_at=NOW(),payment_id=$5,updated_at=NOW()
      `, [school_id, plan_key, plan_name||plan_key, leads_per_month, rec.id])

      await creditLeads(school_id, leads_per_month)
      await applyFeaturedListing(plan_key, school_id)

      await db.query(`UPDATE subscription_payments SET status='completed',payment_id=$1,updated_at=NOW() WHERE order_id=$2`, [result.paymentId, resolvedOrderId])

      const creditsAdded = leads_per_month === -1 ? 999 : leads_per_month
      await recordAdminPayment(school_id, plan_name||plan_key, gwId, resolvedOrderId, result.paymentId,
        amount_paise, discount_paise, original_amount_paise, coupon_code, creditsAdded)

      const ct = req.headers.get('content-type') || ''
      if (ct.includes('application/x-www-form-urlencoded'))
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/packages?status=success`, 303)

      return NextResponse.json({ success: true, leadsAdded: leads_per_month })
    } catch (e: any) {
      console.error('[subscriptions verify-payment]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
