export const dynamic = 'force-dynamic'
/**
 * /api/school-history
 *
 * GET ?tab=subscriptions  — school's subscription payment history
 * GET ?tab=leads          — all leads purchased by school (via credits OR direct buy)
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

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

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') || 'subscriptions'

    // Resolve school id
    const schoolRow = await db.query(
      'SELECT id FROM schools WHERE admin_user_id=$1',
      [userId]
    ).catch(() => ({ rows: [] }))

    if (!schoolRow.rows.length)
      return NextResponse.json({ error: 'School not found' }, { status: 404 })

    const schoolId = schoolRow.rows[0].id

    // ── Subscriptions tab ────────────────────────────────────────────────────
    if (tab === 'subscriptions') {
      // Ensure tables exist (idempotent)
      await db.query(`
        CREATE TABLE IF NOT EXISTS subscription_payments (
          id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id             UUID NOT NULL,
          plan_key              VARCHAR(50) NOT NULL,
          gateway               VARCHAR(20) NOT NULL DEFAULT 'demo',
          order_id              VARCHAR(200),
          payment_id            VARCHAR(200),
          amount_paise          INTEGER NOT NULL DEFAULT 0,
          discount_paise        INTEGER NOT NULL DEFAULT 0,
          original_amount_paise INTEGER NOT NULL DEFAULT 0,
          coupon_code           VARCHAR(50),
          lead_count            INTEGER NOT NULL DEFAULT 0,
          status                VARCHAR(20) NOT NULL DEFAULT 'pending',
          meta                  JSONB DEFAULT '{}',
          created_at            TIMESTAMPTZ DEFAULT NOW(),
          updated_at            TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      await db.query(`
        CREATE TABLE IF NOT EXISTS school_subscriptions (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id    UUID NOT NULL UNIQUE,
          plan_key     VARCHAR(50) NOT NULL DEFAULT 'free',
          plan_name    VARCHAR(100),
          lead_count   INTEGER NOT NULL DEFAULT 0,
          activated_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at   TIMESTAMPTZ,
          payment_id   UUID,
          updated_at   TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      const paymentsRes = await db.query(`
        SELECT
          sp.id,
          sp.plan_key,
          COALESCE(spl.name, sp.plan_key) AS plan_name,
          sp.gateway,
          sp.order_id,
          sp.payment_id,
          sp.amount_paise,
          sp.discount_paise,
          sp.original_amount_paise,
          sp.coupon_code,
          sp.lead_count,
          sp.status,
          sp.created_at,
          sp.updated_at
        FROM subscription_payments sp
        LEFT JOIN subscription_plans spl ON spl.plan_key = sp.plan_key
        WHERE sp.school_id = $1
        ORDER BY sp.created_at DESC
        LIMIT 100
      `, [schoolId]).catch(() => ({ rows: [] }))

      // Also fetch current active subscription for context
      const activeSubRes = await db.query(`
        SELECT
          ss.plan_key,
          COALESCE(spl.name, ss.plan_key) AS plan_name,
          ss.lead_count,
          ss.activated_at,
          ss.expires_at
        FROM school_subscriptions ss
        LEFT JOIN subscription_plans spl ON spl.plan_key = ss.plan_key
        WHERE ss.school_id = $1
      `, [schoolId]).catch(() => ({ rows: [] }))

      return NextResponse.json({
        payments: paymentsRes.rows.map(r => ({
          id:                   r.id,
          planKey:              r.plan_key,
          planName:             r.plan_name,
          gateway:              r.gateway,
          orderId:              r.order_id,
          transactionId:        r.payment_id,
          amountPaise:          r.amount_paise,
          discountPaise:        r.discount_paise,
          originalAmountPaise:  r.original_amount_paise,
          couponCode:           r.coupon_code,
          leadCredits:          r.lead_count,
          status:               r.status,
          createdAt:            r.created_at,
          updatedAt:            r.updated_at,
        })),
        activeSub: activeSubRes.rows[0] ? {
          planKey:     activeSubRes.rows[0].plan_key,
          planName:    activeSubRes.rows[0].plan_name,
          leadCount:   activeSubRes.rows[0].lead_count,
          activatedAt: activeSubRes.rows[0].activated_at,
          expiresAt:   activeSubRes.rows[0].expires_at,
        } : null,
      })
    }

    // ── Leads tab ────────────────────────────────────────────────────────────
    if (tab === 'leads') {
      // Ensure lead_credits table exists
      await db.query(`
        CREATE TABLE IF NOT EXISTS lead_credits (
          school_id     UUID PRIMARY KEY,
          credits       INTEGER NOT NULL DEFAULT 0,
          total_credits INTEGER NOT NULL DEFAULT 0,
          used_credits  INTEGER NOT NULL DEFAULT 0,
          updated_at    TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      // Add purchased_at column if not exists
      await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ`).catch(() => {})
      // Add purchase_source column to track credit vs direct
      await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(30)`).catch(() => {})

      const leadsRes = await db.query(`
        SELECT
          l.id,
          COALESCE(u.full_name, l.parent_name)   AS parent_name,
          l.child_name,
          l.class_applying_for,
          COALESCE(u.phone, l.phone)              AS phone,
          l.city,
          l.source                                AS discovery_source,
          l.status,
          l.purchase_source,
          COALESCE(l.purchased_at, l.updated_at)  AS purchased_at,
          l.created_at
        FROM leads l
        LEFT JOIN users u ON u.id = l.parent_id
        WHERE l.school_id = $1
          AND l.is_purchased = true
        ORDER BY COALESCE(l.purchased_at, l.updated_at) DESC
        LIMIT 200
      `, [schoolId]).catch(() => ({ rows: [] }))

      return NextResponse.json({
        leads: leadsRes.rows.map(r => ({
          id:              r.id,
          parentName:      r.parent_name || '—',
          childName:       r.child_name  || '—',
          grade:           r.class_applying_for || '—',
          phone:           r.phone || '—',
          city:            r.city  || '—',
          discoverySource: r.discovery_source || 'direct',
          status:          r.status || 'new',
          purchaseSource:  r.purchase_source || 'credits',
          purchasedAt:     r.purchased_at,
          createdAt:       r.created_at,
        })),
        total: leadsRes.rows.length,
      })
    }

    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  } catch (e: any) {
    console.error('[school-history GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
