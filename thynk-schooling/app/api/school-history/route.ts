export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

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

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') || 'subscriptions'

    const schoolRow = await db.query(
      'SELECT id FROM schools WHERE admin_user_id=$1', [userId]
    ).catch(() => ({ rows: [] }))

    if (!schoolRow.rows.length)
      return NextResponse.json({ error: 'School not found' }, { status: 404 })

    const schoolId = schoolRow.rows[0].id

    // ── SUBSCRIPTIONS TAB ─────────────────────────────────────────────────────
    if (tab === 'subscriptions') {

      // Ensure tables exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS subscription_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id UUID NOT NULL, plan_key VARCHAR(50) NOT NULL,
          gateway VARCHAR(20) NOT NULL DEFAULT 'demo',
          order_id VARCHAR(200), payment_id VARCHAR(200),
          amount_paise INTEGER NOT NULL DEFAULT 0,
          discount_paise INTEGER NOT NULL DEFAULT 0,
          original_amount_paise INTEGER NOT NULL DEFAULT 0,
          coupon_code VARCHAR(50), lead_count INTEGER NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          meta JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      await db.query(`
        CREATE TABLE IF NOT EXISTS featured_listing_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id UUID NOT NULL, plan_key VARCHAR(80) NOT NULL,
          plan_name VARCHAR(200), gateway VARCHAR(20) NOT NULL DEFAULT 'demo',
          order_id VARCHAR(300), payment_id VARCHAR(300),
          amount_paise INTEGER NOT NULL DEFAULT 0,
          discount_paise INTEGER NOT NULL DEFAULT 0,
          original_amount_paise INTEGER,
          coupon_code VARCHAR(50), duration_days INTEGER NOT NULL DEFAULT 30,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          meta JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      await db.query(`
        CREATE TABLE IF NOT EXISTS school_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id UUID NOT NULL UNIQUE,
          plan_key VARCHAR(50) NOT NULL DEFAULT 'free', plan_name VARCHAR(100),
          lead_count INTEGER NOT NULL DEFAULT 0,
          activated_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ,
          payment_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      // ── 1. Subscription payments (lead plans) ───────────────────────────
      const subPayRes = await db.query(`
        SELECT
          sp.id,
          sp.plan_key,
          COALESCE(spl.name, sp.plan_key)  AS plan_name,
          sp.gateway,
          sp.order_id,
          sp.payment_id,
          sp.amount_paise,
          sp.discount_paise,
          sp.original_amount_paise,
          sp.coupon_code,
          sp.lead_count                    AS lead_credits,
          NULL::integer                    AS duration_days,
          sp.status,
          sp.created_at,
          'subscription'                   AS payment_type
        FROM subscription_payments sp
        LEFT JOIN subscription_plans spl ON spl.plan_key = sp.plan_key
        WHERE sp.school_id = $1
      `, [schoolId]).catch(() => ({ rows: [] }))

      // ── 2. Featured listing payments ────────────────────────────────────
      const featPayRes = await db.query(`
        SELECT
          flp.id,
          flp.plan_key,
          COALESCE(flp.plan_name, flp.plan_key) AS plan_name,
          flp.gateway,
          flp.order_id,
          flp.payment_id,
          flp.amount_paise,
          flp.discount_paise,
          flp.original_amount_paise,
          flp.coupon_code,
          NULL::integer                          AS lead_credits,
          flp.duration_days,
          flp.status,
          flp.created_at,
          'featured'                             AS payment_type
        FROM featured_listing_payments flp
        WHERE flp.school_id = $1
      `, [schoolId]).catch(() => ({ rows: [] }))

      // ── 3. Merge + sort by date desc ────────────────────────────────────
      const allPayments = [
        ...subPayRes.rows,
        ...featPayRes.rows,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 100)

      // ── 4. Active subscription ───────────────────────────────────────────
      const activeSubRes = await db.query(`
        SELECT ss.plan_key,
               COALESCE(spl.name, ss.plan_key) AS plan_name,
               ss.lead_count, ss.activated_at, ss.expires_at
        FROM school_subscriptions ss
        LEFT JOIN subscription_plans spl ON spl.plan_key = ss.plan_key
        WHERE ss.school_id = $1
      `, [schoolId]).catch(() => ({ rows: [] }))

      // ── 5. Active featured listing status ───────────────────────────────
      const featStatusRes = await db.query(`
        SELECT is_featured, featured_until
        FROM schools WHERE id = $1
      `, [schoolId]).catch(() => ({ rows: [] }))

      const featStatus = featStatusRes.rows[0]
      const now = new Date()
      const featuredUntil = featStatus?.featured_until ? new Date(featStatus.featured_until) : null
      const isFeatured = featStatus?.is_featured === true && (!featuredUntil || featuredUntil > now)

      return NextResponse.json({
        payments: allPayments.map(r => ({
          id:                  r.id,
          planKey:             r.plan_key,
          planName:            r.plan_name,
          gateway:             r.gateway,
          orderId:             r.order_id,
          transactionId:       r.payment_id,
          amountPaise:         r.amount_paise,
          discountPaise:       r.discount_paise,
          originalAmountPaise: r.original_amount_paise,
          couponCode:          r.coupon_code,
          leadCredits:         r.lead_credits,
          durationDays:        r.duration_days,
          status:              r.status,
          paymentType:         r.payment_type,
          createdAt:           r.created_at,
        })),
        activeSub: activeSubRes.rows[0] ? {
          planKey:     activeSubRes.rows[0].plan_key,
          planName:    activeSubRes.rows[0].plan_name,
          leadCount:   activeSubRes.rows[0].lead_count,
          activatedAt: activeSubRes.rows[0].activated_at,
          expiresAt:   activeSubRes.rows[0].expires_at,
        } : null,
        featuredStatus: {
          isFeatured,
          featuredUntil: featStatus?.featured_until ?? null,
        },
      })
    }

    // ── LEADS TAB ─────────────────────────────────────────────────────────────
    if (tab === 'leads') {
      await db.query(`
        CREATE TABLE IF NOT EXISTS lead_credits (
          school_id UUID PRIMARY KEY,
          credits INTEGER NOT NULL DEFAULT 0,
          total_credits INTEGER NOT NULL DEFAULT 0,
          used_credits INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {})

      await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ`).catch(() => {})
      await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(30)`).catch(() => {})

      const leadsRes = await db.query(`
        SELECT
          l.id,
          COALESCE(u.full_name, l.parent_name) AS parent_name,
          l.child_name, l.class_applying_for,
          COALESCE(u.phone, l.phone)            AS phone,
          l.city, l.source AS discovery_source,
          l.status, l.purchase_source,
          COALESCE(l.purchased_at, l.updated_at) AS purchased_at,
          l.created_at
        FROM leads l
        LEFT JOIN users u ON u.id = l.parent_id
        WHERE l.school_id = $1 AND l.is_purchased = true
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
