export const dynamic = 'force-dynamic'
/**
 * /api/lead-packages
 *
 * GET    — list active packages
 * POST   ?action=buy&id=X&gateway=razorpay&coupon=CODE  — create order (coupon optional)
 * POST   ?action=verify-payment                          — verify & credit school
 * PUT    ?id=X                                          — update package (admin)
 * DELETE ?id=X                                          — delete package (admin)
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

function toPackage(row: any) {
  return {
    id:           row.id,
    name:         row.name,
    description:  row.description || null,
    leadCredits:  row.leads_count,
    price:        row.price_paise,
    validityDays: row.validity_days ?? 365,
    isActive:     row.is_active,
  }
}

const DEFAULT_PACKAGES = [
  { name: 'Starter',      description: 'Perfect for new schools getting started',   leads_count: 10,  price_paise:  99900, validity_days: 365 },
  { name: 'Growth',       description: 'Best value for growing schools',             leads_count: 25,  price_paise: 199900, validity_days: 365 },
  { name: 'Professional', description: 'For established schools scaling admissions', leads_count: 60,  price_paise: 399900, validity_days: 365 },
  { name: 'Enterprise',   description: 'Maximum leads for large school networks',    leads_count: 150, price_paise: 799900, validity_days: 365 },
]

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_packages (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          VARCHAR(200) NOT NULL,
      description   TEXT,
      leads_count   INTEGER NOT NULL DEFAULT 10,
      price_paise   INTEGER NOT NULL DEFAULT 29900,
      validity_days INTEGER NOT NULL DEFAULT 365,
      is_active     BOOLEAN DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`ALTER TABLE lead_packages ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 365`).catch(() => {})

  const count = await db.query('SELECT COUNT(*) FROM lead_packages').catch(() => ({ rows: [{ count: '0' }] }))
  if (parseInt(count.rows[0].count) === 0) {
    for (const pkg of DEFAULT_PACKAGES) {
      await db.query(
        `INSERT INTO lead_packages (name, description, leads_count, price_paise, validity_days) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [pkg.name, pkg.description, pkg.leads_count, pkg.price_paise, pkg.validity_days]
      ).catch(() => {})
    }
  }
}

async function ensurePaymentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_package_payments (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id       UUID NOT NULL,
      package_id      UUID NOT NULL,
      gateway         VARCHAR(20) NOT NULL DEFAULT 'razorpay',
      order_id        VARCHAR(300),
      payment_id      VARCHAR(300),
      amount_paise    INTEGER NOT NULL,
      credits_added   INTEGER NOT NULL DEFAULT 0,
      status          VARCHAR(50) DEFAULT 'pending',
      meta            JSONB DEFAULT '{}',
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) NOT NULL DEFAULT 'razorpay'`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS order_id VARCHAR(300)`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS payment_id VARCHAR(300)`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS credits_added INTEGER NOT NULL DEFAULT 0`).catch(() => {})
  await db.query(`
    UPDATE lead_package_payments SET order_id = razorpay_order_id
    WHERE order_id IS NULL AND razorpay_order_id IS NOT NULL
  `).catch(() => {})
}

/**
 * Parse request body — handles both JSON and application/x-www-form-urlencoded.
 * Easebuzz POSTs back as form-urlencoded (browser redirect), not JSON.
 */
async function parseBody(req: NextRequest): Promise<Record<string, any>> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    const params = new URLSearchParams(text)
    return Object.fromEntries(params.entries())
  }
  try {
    return await req.json()
  } catch {
    return {}
  }
}

/* ── GET ─────────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    await ensureGatewayTable()
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'

    const rows = await db.query(
      `SELECT * FROM lead_packages WHERE ${all ? '1=1' : 'is_active=true'} ORDER BY price_paise ASC`
    )

    const gateways = await getEnabledGateways()
    const gatewayList = gateways.map(g => ({
      id:       g.id,
      name:     g.name,
      priority: g.priority,
    }))

    return NextResponse.json({
      packages:  rows.rows.map(toPackage),
      gateways:  gatewayList,
    })
  } catch (e: any) {
    console.error('[lead-packages GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/* ── POST ────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  /* ── buy: create order via chosen gateway ─────────────────────────────────── */
  if (action === 'buy') {
    try {
      await ensureTable()
      await ensurePaymentsTable()
      await ensureGatewayTable()

      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const packageId  = searchParams.get('id')
      const gatewayId  = (searchParams.get('gateway') || 'razorpay') as GatewayId
      const couponCode = searchParams.get('coupon') || null

      if (!packageId) return NextResponse.json({ error: 'Package id required' }, { status: 400 })

      const pkg = await db.query('SELECT * FROM lead_packages WHERE id=$1 AND is_active=true', [packageId])
      if (!pkg.rows.length) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

      const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })

      const p        = pkg.rows[0]
      const schoolId = school.rows[0].id

      // ── Apply coupon if provided ──────────────────────────────────────────
      let finalPricePaise = p.price_paise
      let discountPaise   = 0
      let couponId: number | null = null

      if (couponCode) {
        const couponRow = await db.query(
          `SELECT * FROM discount_coupons WHERE code=$1`,
          [couponCode.trim().toUpperCase()]
        ).catch(() => ({ rows: [] }))

        const c = couponRow.rows[0]
        const isValid =
          c &&
          c.active &&
          (!c.valid_until || new Date(c.valid_until) >= new Date()) &&
          (!c.valid_from  || new Date(c.valid_from)  <= new Date()) &&
          (c.max_uses === null || c.used_count < c.max_uses) &&
          (p.price_paise / 100 >= Number(c.min_amount)) &&
          (!c.applicable_gateways?.length || c.applicable_gateways.includes(gatewayId))

        if (isValid) {
          if (c.type === 'percent') {
            discountPaise = Math.round((p.price_paise * Number(c.value)) / 100)
          } else {
            // flat — c.value is in ₹
            discountPaise = Math.round(Number(c.value) * 100)
          }
          discountPaise   = Math.min(discountPaise, p.price_paise)
          finalPricePaise = p.price_paise - discountPaise
          couponId        = c.id
        }
      }

      // ── receipt must be ≤ 40 chars for Razorpay ───────────────────────────
      const shortId = packageId.replace(/-/g, '').slice(0, 8)
      const receipt = `pkg_${shortId}_${Date.now().toString(36)}`

      const userInfo = await db.query(
        `SELECT COALESCE(full_name, name) AS name, email, COALESCE(phone, mobile) AS phone FROM users WHERE id=$1`,
        [userId]
      ).catch(() => ({ rows: [] }))
      const buyer = userInfo.rows[0] || {}

      const gwConfig = await db.query(
        'SELECT key_id, key_secret FROM payment_gateways WHERE id=$1 AND enabled=true',
        [gatewayId]
      ).catch(() => ({ rows: [] }))
      const hasKeys = gwConfig.rows.length > 0 && gwConfig.rows[0].key_id && gwConfig.rows[0].key_secret

      if (!hasKeys) {
        await db.query(
          `INSERT INTO lead_credits (school_id, credits, total_credits, updated_at)
           VALUES ($1, $2, $2, NOW())
           ON CONFLICT (school_id) DO UPDATE
           SET credits = lead_credits.credits + $2,
               total_credits = lead_credits.total_credits + $2,
               updated_at = NOW()`,
          [schoolId, p.leads_count]
        )
        await db.query(
          `INSERT INTO lead_package_payments (school_id, package_id, gateway, amount_paise, credits_added, status, created_at)
           VALUES ($1, $2, 'demo', $3, $4, 'completed', NOW())`,
          [schoolId, packageId, p.price_paise, p.leads_count]
        ).catch(() => {})
        return NextResponse.json({ success: true, _dev: true, orderId: 'demo_' + Date.now(), message: 'Credits added (demo mode — configure payment gateway in Admin > Integrations)' })
      }

      try {
        const order = await createOrder(
          gatewayId,
          finalPricePaise,
          'INR',
          receipt,
          { buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: buyer.phone }
        )

        // Store pending payment record (with coupon info in meta)
        await db.query(
          `INSERT INTO lead_package_payments
             (school_id, package_id, gateway, order_id, amount_paise, credits_added, status, meta)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
          [schoolId, packageId, order.gateway, order.orderId, finalPricePaise, p.leads_count,
           JSON.stringify({ ...order.clientPayload, coupon_id: couponId, discount_paise: discountPaise, original_price_paise: p.price_paise })]
        )

        // Increment coupon used_count if applied
        if (couponId) {
          await db.query(
            'UPDATE discount_coupons SET used_count = used_count + 1, updated_at=NOW() WHERE id=$1',
            [couponId]
          ).catch(() => {})
        }

        return NextResponse.json({
          gateway:             order.gateway,
          orderId:             order.orderId,
          amount:              order.amount,
          currency:            order.currency,
          clientPayload:       order.clientPayload,
          discount_paise:      discountPaise,
          original_amount:     p.price_paise,
          coupon_applied:      !!couponId,
        })

      } catch (gwErr: any) {
        if (process.env.NODE_ENV !== 'production') {
          const mockOrderId = `order_dev_${Date.now()}`
          await db.query(
            `INSERT INTO lead_package_payments (school_id, package_id, gateway, order_id, amount_paise, credits_added, status) VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
            [schoolId, packageId, gatewayId, mockOrderId, finalPricePaise, p.leads_count]
          )
          return NextResponse.json({ gateway: gatewayId, orderId: mockOrderId, amount: finalPricePaise, currency: 'INR', _dev: true })
        }
        throw gwErr
      }
    } catch (e: any) {
      console.error('[lead-packages buy]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  /* ── verify-payment ──────────────────────────────────────────────────────── */
  if (action === 'verify-payment') {
    try {
      await ensurePaymentsTable()

      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      // Parse both JSON (Razorpay/PayPal) and form-urlencoded (Easebuzz)
      const body = await parseBody(req)

      const {
        gateway = 'razorpay',
        orderId,
        // Razorpay
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        // Cashfree
        cfOrderId,
        // Easebuzz
        txnid, status: txnStatus, hash: ebHash,
        // PayPal
        paypalOrderId,
      } = body

      const resolvedOrderId = orderId || razorpay_order_id || cfOrderId || txnid || paypalOrderId

      if (!resolvedOrderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

      const payment = await db.query(
        `SELECT * FROM lead_package_payments WHERE order_id=$1 AND status='pending'`,
        [resolvedOrderId]
      )

      if (!payment.rows.length) {
        if (process.env.NODE_ENV !== 'production' && resolvedOrderId.startsWith('order_dev_')) {
          const devPayment = await db.query(
            `SELECT * FROM lead_package_payments WHERE order_id=$1 LIMIT 1`,
            [resolvedOrderId]
          )
          if (devPayment.rows.length) {
            const { school_id, credits_added } = devPayment.rows[0]
            await db.query(`
              INSERT INTO lead_credits (school_id, credits, total_credits, used_credits) VALUES ($1,$2,$2,0)
              ON CONFLICT (school_id) DO UPDATE SET credits = lead_credits.credits + $2, total_credits = lead_credits.total_credits + $2, updated_at = NOW()
            `, [school_id, credits_added])
            await db.query(`UPDATE lead_package_payments SET status='completed', payment_id=$1 WHERE order_id=$2`, ['dev_payment', resolvedOrderId])
            return NextResponse.json({ success: true, creditsAdded: credits_added })
          }
        }
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }

      const rec  = payment.rows[0]
      const gwId = (gateway || rec.gateway) as GatewayId

      const result = await verifyPayment({
        gateway:   gwId,
        orderId:   resolvedOrderId,
        paymentId: razorpay_payment_id || cfOrderId || paypalOrderId,
        signature: razorpay_signature  || ebHash,
        status:    txnStatus,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Payment verification failed' }, { status: 400 })
      }

      const { school_id, credits_added } = rec

      await db.query(`
        INSERT INTO lead_credits (school_id, credits, total_credits, used_credits) VALUES ($1,$2,$2,0)
        ON CONFLICT (school_id) DO UPDATE SET
          credits       = lead_credits.credits + $2,
          total_credits = lead_credits.total_credits + $2,
          updated_at    = NOW()
      `, [school_id, credits_added])

      await db.query(
        `UPDATE lead_package_payments SET status='completed', payment_id=$1 WHERE order_id=$2`,
        [result.paymentId, resolvedOrderId]
      )

      // For Easebuzz: redirect browser back to packages page
      // Easebuzz hits surl as a browser POST, so we redirect after verifying
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        return NextResponse.redirect(`${appUrl}/dashboard/school/packages?status=success&credits=${credits_added}`, 303)
      }

      return NextResponse.json({ success: true, creditsAdded: credits_added })
    } catch (e: any) {
      console.error('[lead-packages verify-payment]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/* ── PUT ─────────────────────────────────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Package id required' }, { status: 400 })

    const body = await req.json()
    const sets: string[] = []; const params: any[] = []
    if (body.name        !== undefined) { params.push(body.name);        sets.push(`name=$${params.length}`) }
    if (body.description !== undefined) { params.push(body.description); sets.push(`description=$${params.length}`) }
    if (body.leadCredits !== undefined) { params.push(body.leadCredits); sets.push(`leads_count=$${params.length}`) }
    if (body.price       !== undefined) { params.push(body.price);       sets.push(`price_paise=$${params.length}`) }
    if (body.validityDays!== undefined) { params.push(body.validityDays);sets.push(`validity_days=$${params.length}`) }
    if (body.isActive    !== undefined) { params.push(body.isActive);    sets.push(`is_active=$${params.length}`) }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    params.push(id)
    const res = await db.query(`UPDATE lead_packages SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`, params)
    if (!res.rows.length) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    return NextResponse.json(toPackage(res.rows[0]))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/* ── DELETE ──────────────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Package id required' }, { status: 400 })
    const purchases = await db.query(
      `SELECT COUNT(*) FROM lead_package_payments WHERE package_id=$1 AND status='completed'`, [id]
    ).catch(() => ({ rows: [{ count: '0' }] }))
    if (parseInt(purchases.rows[0].count) > 0)
      return NextResponse.json({ error: 'Cannot delete — package has active purchases.' }, { status: 409 })
    await db.query('DELETE FROM lead_packages WHERE id=$1', [id])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
