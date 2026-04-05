export const dynamic = 'force-dynamic'
/**
 * GET  /api/lead-packages              — list active packages (public, for school to browse)
 * POST /api/lead-packages?id=X&action=buy          — initiate Razorpay order for a package
 * POST /api/lead-packages?action=verify-payment    — verify Razorpay payment & credit school
 *
 * DB columns:  id, name, description, leads_count, price_paise, validity_days, is_active
 * Frontend expects: id, name, leadCredits, price, validityDays, isActive, description
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

// Map DB row → frontend shape
function toPackage(row: any) {
  return {
    id:           row.id,
    name:         row.name,
    description:  row.description || null,
    leadCredits:  row.leads_count,
    price:        row.price_paise,           // kept in paise; UI does /100
    validityDays: row.validity_days ?? 365,
    isActive:     row.is_active,
  }
}

const DEFAULT_PACKAGES = [
  { name: 'Starter',     description: 'Perfect for new schools getting started',  leads_count: 10,  price_paise:  99900, validity_days: 365 },
  { name: 'Growth',      description: 'Best value for growing schools',            leads_count: 25,  price_paise: 199900, validity_days: 365 },
  { name: 'Professional',description: 'For established schools scaling admissions',leads_count: 60,  price_paise: 399900, validity_days: 365 },
  { name: 'Enterprise',  description: 'Maximum leads for large school networks',   leads_count: 150, price_paise: 799900, validity_days: 365 },
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
  // Add validity_days if missing on older tables
  await db.query(`ALTER TABLE lead_packages ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 365`).catch(() => {})

  // Seed default packages if the table is empty
  const count = await db.query('SELECT COUNT(*) FROM lead_packages').catch(() => ({ rows: [{ count: '0' }] }))
  if (parseInt(count.rows[0].count) === 0) {
    for (const pkg of DEFAULT_PACKAGES) {
      await db.query(
        `INSERT INTO lead_packages (name, description, leads_count, price_paise, validity_days)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [pkg.name, pkg.description, pkg.leads_count, pkg.price_paise, pkg.validity_days]
      ).catch(() => {})
    }
  }
}

async function ensurePaymentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_package_payments (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id         UUID NOT NULL,
      package_id        UUID NOT NULL,
      razorpay_order_id VARCHAR(200),
      razorpay_payment_id VARCHAR(200),
      amount_paise      INTEGER NOT NULL,
      credits_added     INTEGER NOT NULL,
      status            VARCHAR(50) DEFAULT 'pending',
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

// ── GET — list packages ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'
    const rows = await db.query(
      `SELECT * FROM lead_packages WHERE ${all ? '1=1' : 'is_active=true'} ORDER BY price_paise ASC`
    )
    return NextResponse.json(rows.rows.map(toPackage))
  } catch (e: any) {
    console.error('[lead-packages GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── POST — buy or verify-payment ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // ── buy: create Razorpay order ──────────────────────────────────────────────
  if (action === 'buy') {
    try {
      await ensureTable()
      await ensurePaymentsTable()

      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const packageId = searchParams.get('id')
      if (!packageId) return NextResponse.json({ error: 'Package id required' }, { status: 400 })

      const pkg = await db.query('SELECT * FROM lead_packages WHERE id=$1 AND is_active=true', [packageId])
      if (!pkg.rows.length) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

      const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
      if (!school.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })

      const p = pkg.rows[0]
      const schoolId = school.rows[0].id

      // If Razorpay is configured, create a real order
      const razorpayKey    = process.env.RAZORPAY_KEY_ID
      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

      if (razorpayKey && razorpaySecret) {
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64'),
          },
          body: JSON.stringify({
            amount:   p.price_paise,
            currency: 'INR',
            receipt:  `pkg_${packageId}_${Date.now()}`,
          }),
        })
        const order = await orderRes.json()
        if (!orderRes.ok) return NextResponse.json({ error: order.error?.description || 'Failed to create order' }, { status: 500 })

        // Store pending payment record
        await db.query(
          `INSERT INTO lead_package_payments (school_id, package_id, razorpay_order_id, amount_paise, credits_added, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')`,
          [schoolId, packageId, order.id, p.price_paise, p.leads_count]
        )

        return NextResponse.json({ orderId: order.id, amount: p.price_paise, currency: 'INR' })
      }

      // Razorpay not configured — return a mock order for development
      const mockOrderId = 'order_dev_' + Date.now()
      await db.query(
        `INSERT INTO lead_package_payments (school_id, package_id, razorpay_order_id, amount_paise, credits_added, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [schoolId, packageId, mockOrderId, p.price_paise, p.leads_count]
      )
      return NextResponse.json({ orderId: mockOrderId, amount: p.price_paise, currency: 'INR', _dev: true })
    } catch (e: any) {
      console.error('[lead-packages buy]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── verify-payment: confirm Razorpay signature & credit the school ──────────
  if (action === 'verify-payment') {
    try {
      await ensurePaymentsTable()

      const userId = getUserId(req)
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const body = await req.json()
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

      // Verify signature if Razorpay is configured
      if (razorpaySecret && razorpay_signature) {
        const expected = crypto
          .createHmac('sha256', razorpaySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex')
        if (expected !== razorpay_signature) {
          return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
        }
      }

      // Find the pending payment record
      const payment = await db.query(
        `SELECT * FROM lead_package_payments WHERE razorpay_order_id=$1 AND status='pending'`,
        [razorpay_order_id]
      )
      if (!payment.rows.length) {
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }

      const { school_id, credits_added } = payment.rows[0]

      // Credit the school — upsert lead_credits
      await db.query(`
        INSERT INTO lead_credits (school_id, credits, total_credits, used_credits)
        VALUES ($1, $2, $2, 0)
        ON CONFLICT (school_id) DO UPDATE SET
          credits       = lead_credits.credits + $2,
          total_credits = lead_credits.total_credits + $2,
          updated_at    = NOW()
      `, [school_id, credits_added])

      // Mark payment as completed
      await db.query(
        `UPDATE lead_package_payments SET status='completed', razorpay_payment_id=$1 WHERE razorpay_order_id=$2`,
        [razorpay_payment_id || 'dev', razorpay_order_id]
      )

      return NextResponse.json({ success: true, creditsAdded: credits_added })
    } catch (e: any) {
      console.error('[lead-packages verify-payment]', e)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── PUT — update a package ────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Package id required' }, { status: 400 })

    const body = await req.json()
    const sets: string[] = []
    const params: any[] = []

    if (body.name        !== undefined) { params.push(body.name);          sets.push(`name=$${params.length}`) }
    if (body.description !== undefined) { params.push(body.description);   sets.push(`description=$${params.length}`) }
    if (body.leadCredits !== undefined) { params.push(body.leadCredits);   sets.push(`leads_count=$${params.length}`) }
    if (body.price       !== undefined) { params.push(body.price);         sets.push(`price_paise=$${params.length}`) }
    if (body.validityDays!== undefined) { params.push(body.validityDays);  sets.push(`validity_days=$${params.length}`) }
    if (body.isActive    !== undefined) { params.push(body.isActive);      sets.push(`is_active=$${params.length}`) }

    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    params.push(id)
    const res = await db.query(
      `UPDATE lead_packages SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    )
    if (!res.rows.length) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    return NextResponse.json(toPackage(res.rows[0]))
  } catch (e: any) {
    console.error('[lead-packages PUT]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── DELETE — delete a package ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Package id required' }, { status: 400 })

    // Check for active purchases referencing this package
    const purchases = await db.query(
      `SELECT COUNT(*) FROM lead_package_payments WHERE package_id=$1 AND status='completed'`,
      [id]
    ).catch(() => ({ rows: [{ count: '0' }] }))

    if (parseInt(purchases.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete — package has active purchases.' },
        { status: 409 }
      )
    }

    await db.query('DELETE FROM lead_packages WHERE id=$1', [id])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[lead-packages DELETE]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
