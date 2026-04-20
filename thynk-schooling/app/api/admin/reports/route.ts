export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

const PAID = `status IN ('paid','captured','success','completed')`

// ─── SCHOOL ANALYTICS ────────────────────────────────────────────────────────
async function schoolAnalytics() {
  const [
    totals,
    stateWise,
    cityWise,
    pincodeCount,
    boardWise,
    genderWise,
    typeWise,
    facilitySummary,
    sportsSummary,
    languageSummary,
    extraSummary,
    monthlyGrowth,
  ] = await Promise.all([
    // A. Totals
    db.query(`
      SELECT
        COUNT(*)                                                    AS total,
        COUNT(*) FILTER(WHERE is_verified=true)                    AS verified,
        COUNT(*) FILTER(WHERE is_active=true)                      AS active,
        COUNT(*) FILTER(WHERE is_featured=true)                    AS featured,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '30 days') AS new_30d,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '7 days')  AS new_7d
      FROM schools
    `).catch(() => ({ rows: [{}] })),

    // B. State-wise
    db.query(`
      SELECT state, COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_verified=true) AS verified
      FROM schools
      WHERE state IS NOT NULL AND state <> ''
      GROUP BY state ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // C. City-wise
    db.query(`
      SELECT city, COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_verified=true) AS verified
      FROM schools
      WHERE city IS NOT NULL AND city <> ''
      GROUP BY city ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // D. Active pincodes
    db.query(`
      SELECT COUNT(DISTINCT pincode) AS active_pincodes,
             COUNT(DISTINCT SUBSTRING(pincode,1,4)) AS active_districts
      FROM schools
      WHERE pincode IS NOT NULL AND pincode <> ''
    `).catch(() => ({ rows: [{}] })),

    // E. Board-wise
    db.query(`
      SELECT b.board_name AS name, COUNT(s.id) AS count
      FROM schools s, UNNEST(s.board) AS b(board_name)
      WHERE b.board_name IS NOT NULL AND b.board_name <> ''
      GROUP BY b.board_name ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // F. Gender policy
    db.query(`
      SELECT COALESCE(gender_policy,'Not Specified') AS name, COUNT(*) AS count
      FROM schools
      GROUP BY gender_policy ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // G. School type
    db.query(`
      SELECT COALESCE(school_type,'Not Specified') AS name, COUNT(*) AS count
      FROM schools
      GROUP BY school_type ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // H. Facility-wise
    db.query(`
      SELECT f.facility AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.facilities) AS f(facility)
      WHERE f.facility IS NOT NULL AND f.facility <> ''
      GROUP BY f.facility ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // I. Sports
    db.query(`
      SELECT sp.sport AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.sports) AS sp(sport)
      WHERE sp.sport IS NOT NULL AND sp.sport <> ''
      GROUP BY sp.sport ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // J. Languages
    db.query(`
      SELECT lang.language AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.languages) AS lang(language)
      WHERE lang.language IS NOT NULL AND lang.language <> ''
      GROUP BY lang.language ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // K. Extra-curriculars
    db.query(`
      SELECT ec.activity AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.extracurriculars) AS ec(activity)
      WHERE ec.activity IS NOT NULL AND ec.activity <> ''
      GROUP BY ec.activity ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // Monthly growth (last 12m)
    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             COUNT(*) AS count
      FROM schools
      WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at)
      ORDER BY month_dt
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  return {
    totals: {
      total: +t.total || 0, verified: +t.verified || 0,
      active: +t.active || 0, featured: +t.featured || 0,
      new30d: +t.new_30d || 0, new7d: +t.new_7d || 0,
    },
    stateWise:      stateWise.rows.map(r => ({ name: r.state, count: +r.count, verified: +r.verified })),
    cityWise:       cityWise.rows.map(r => ({ name: r.city, count: +r.count, verified: +r.verified })),
    pincodes:       { active: +(pincodeCount.rows[0]?.active_pincodes || 0), districts: +(pincodeCount.rows[0]?.active_districts || 0) },
    boardWise:      boardWise.rows.map(r => ({ name: r.name, count: +r.count })),
    genderWise:     genderWise.rows.map(r => ({ name: r.name, count: +r.count })),
    typeWise:       typeWise.rows.map(r => ({ name: r.name, count: +r.count })),
    facilities:     facilitySummary.rows.map(r => ({ name: r.name, count: +r.count })),
    sports:         sportsSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    languages:      languageSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    extraCurricular: extraSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    monthlyGrowth:  monthlyGrowth.rows.map(r => ({ month: r.month, count: +r.count })),
  }
}

// ─── LEAD ANALYTICS ──────────────────────────────────────────────────────────
async function leadAnalytics() {
  const [
    totals,
    stateWise,
    cityWise,
    pincodeCount,
    boardWise,
    typeWise,
    statusBreakdown,
    monthlyTrend,
    topSchools,
    sourceBreakdown,
  ] = await Promise.all([
    // D. Totals
    db.query(`
      SELECT
        COUNT(*)                                                         AS total,
        COUNT(*) FILTER(WHERE is_purchased=true)                        AS purchased,
        COUNT(*) FILTER(WHERE is_purchased=false OR is_purchased IS NULL) AS unpurchased,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '30 days')   AS new_30d,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '7 days')    AS new_7d,
        COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE)               AS today
      FROM leads
    `).catch(() => ({ rows: [{}] })),

    // A. State-wise (via school's state)
    db.query(`
      SELECT COALESCE(s.state,'Unknown') AS name, COUNT(l.id) AS count
      FROM leads l
      LEFT JOIN schools s ON s.id = l.school_id
      WHERE s.state IS NOT NULL AND s.state <> ''
      GROUP BY s.state ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // B. City-wise (via school's city)
    db.query(`
      SELECT COALESCE(s.city,'Unknown') AS name, COUNT(l.id) AS count
      FROM leads l
      LEFT JOIN schools s ON s.id = l.school_id
      WHERE s.city IS NOT NULL AND s.city <> ''
      GROUP BY s.city ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // C. Active pincodes
    db.query(`
      SELECT COUNT(DISTINCT s.pincode) AS active_pincodes
      FROM leads l
      JOIN schools s ON s.id = l.school_id
      WHERE s.pincode IS NOT NULL AND s.pincode <> ''
    `).catch(() => ({ rows: [{}] })),

    // E. Lead count by board
    db.query(`
      SELECT b.board_name AS name, COUNT(l.id) AS count
      FROM leads l
      JOIN schools s ON s.id = l.school_id,
      UNNEST(s.board) AS b(board_name)
      WHERE b.board_name IS NOT NULL AND b.board_name <> ''
      GROUP BY b.board_name ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // F. Lead count by school type
    db.query(`
      SELECT COALESCE(s.school_type,'Not Specified') AS name, COUNT(l.id) AS count
      FROM leads l
      LEFT JOIN schools s ON s.id = l.school_id
      GROUP BY s.school_type ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // Status breakdown
    db.query(`
      SELECT COALESCE(status,'new') AS name, COUNT(*) AS count
      FROM leads
      GROUP BY status ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // Monthly trend
    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_purchased=true) AS purchased
      FROM leads
      WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at)
      ORDER BY month_dt
    `).catch(() => ({ rows: [] })),

    // Top schools by leads
    db.query(`
      SELECT s.name, COUNT(l.id) AS leads,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased
      FROM leads l
      JOIN schools s ON s.id = l.school_id
      GROUP BY s.id, s.name ORDER BY leads DESC LIMIT 10
    `).catch(() => ({ rows: [] })),

    // Source breakdown
    db.query(`
      SELECT COALESCE(source,'direct') AS name, COUNT(*) AS count
      FROM leads
      GROUP BY source ORDER BY count DESC
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  return {
    totals: {
      total: +t.total || 0, purchased: +t.purchased || 0,
      unpurchased: +t.unpurchased || 0,
      new30d: +t.new_30d || 0, new7d: +t.new_7d || 0, today: +t.today || 0,
    },
    stateWise:       stateWise.rows.map(r => ({ name: r.name, count: +r.count })),
    cityWise:        cityWise.rows.map(r => ({ name: r.name, count: +r.count })),
    activePincodes:  +(pincodeCount.rows[0]?.active_pincodes || 0),
    boardWise:       boardWise.rows.map(r => ({ name: r.name, count: +r.count })),
    typeWise:        typeWise.rows.map(r => ({ name: r.name, count: +r.count })),
    statusBreakdown: statusBreakdown.rows.map(r => ({ name: r.name, count: +r.count })),
    monthlyTrend:    monthlyTrend.rows.map(r => ({ month: r.month, count: +r.count, purchased: +r.purchased })),
    topSchools:      topSchools.rows.map(r => ({ name: r.name, leads: +r.leads, purchased: +r.purchased })),
    sourceBreakdown: sourceBreakdown.rows.map(r => ({ name: r.name, count: +r.count })),
  }
}

// ─── PAYMENT ANALYTICS ───────────────────────────────────────────────────────
async function paymentAnalytics() {
  const [
    totals,
    gatewayBreakdown,
    statusBreakdown,
    monthlyRevenue,
    couponBreakdown,
    planBreakdown,
    revenueBySource,
    recentPayments,
    gatewayStats,
  ] = await Promise.all([
    // A+B. Total & actual collection
    db.query(`
      SELECT
        COALESCE(SUM(amount_paise),0)                          AS total_initiated,
        COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0)    AS total_collected,
        COALESCE(SUM(discount_paise) FILTER(WHERE ${PAID}),0)  AS total_discounts,
        COUNT(*) FILTER(WHERE ${PAID})                         AS paid_count,
        COUNT(*) FILTER(WHERE status='pending')                AS pending_count,
        COUNT(*) FILTER(WHERE status IN ('failed','dropped','cancelled')) AS failed_count,
        COUNT(*)                                               AS total_txns
      FROM (
        SELECT amount_paise, discount_paise, status FROM subscription_payments
        UNION ALL
        SELECT amount_paise, discount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT amount_paise, 0 AS discount_paise, status FROM featured_listing_payments
      ) all_pay
    `).catch(() => ({ rows: [{}] })),

    // C. Gateway-wise collection
    db.query(`
      SELECT gateway, SUM(amount_paise) FILTER(WHERE ${PAID}) AS collected,
             SUM(amount_paise) AS initiated, COUNT(*) AS total_txns
      FROM (
        SELECT gateway, amount_paise, status FROM subscription_payments
        UNION ALL
        SELECT gateway, amount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT gateway, amount_paise, status FROM featured_listing_payments
      ) p
      GROUP BY gateway ORDER BY collected DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // D. Status breakdown
    db.query(`
      SELECT status, COUNT(*) AS count, SUM(amount_paise) AS amount
      FROM (
        SELECT status, amount_paise FROM subscription_payments
        UNION ALL
        SELECT status, amount_paise FROM lead_package_payments
        UNION ALL
        SELECT status, amount_paise FROM featured_listing_payments
      ) p
      GROUP BY status ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // Monthly revenue trend
    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             SUM(amount_paise) FILTER(WHERE ${PAID}) AS revenue,
             COUNT(*) FILTER(WHERE ${PAID}) AS txns
      FROM (
        SELECT created_at, amount_paise, status FROM subscription_payments
        UNION ALL
        SELECT created_at, amount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT created_at, amount_paise, status FROM featured_listing_payments
      ) p
      WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at)
      ORDER BY month_dt
    `).catch(() => ({ rows: [] })),

    // F. Coupon / discount breakdowns
    db.query(`
      SELECT code, coupon_code, COUNT(*) AS uses,
             SUM(discount_paise) AS total_discount,
             SUM(amount_paise) AS total_collected
      FROM (
        SELECT coupon_code AS code, coupon_code, amount_paise, discount_paise FROM subscription_payments WHERE ${PAID} AND coupon_code IS NOT NULL
        UNION ALL
        SELECT coupon_code AS code, coupon_code, amount_paise, discount_paise FROM lead_package_payments WHERE ${PAID} AND coupon_code IS NOT NULL
      ) c
      GROUP BY code, coupon_code ORDER BY total_discount DESC
    `).catch(() => ({ rows: [] })),

    // Plan-wise breakdown for subscriptions
    db.query(`
      SELECT plan_key AS name, COUNT(*) AS count,
             SUM(amount_paise) FILTER(WHERE ${PAID}) AS revenue
      FROM subscription_payments
      WHERE plan_key IS NOT NULL
      GROUP BY plan_key ORDER BY revenue DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // G. Revenue by source/product type
    db.query(`
      SELECT 'Subscription Plans' AS source,
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0) AS revenue,
             COUNT(*) FILTER(WHERE ${PAID}) AS count
      FROM subscription_payments
      UNION ALL
      SELECT 'Lead Packages',
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0),
             COUNT(*) FILTER(WHERE ${PAID})
      FROM lead_package_payments
      UNION ALL
      SELECT 'Featured Listings',
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0),
             COUNT(*) FILTER(WHERE ${PAID})
      FROM featured_listing_payments
    `).catch(() => ({ rows: [] })),

    // Recent payments
    db.query(`
      SELECT s.name AS school, p.gateway, p.amount_paise, p.status,
             p.coupon_code, p.created_at, 'subscription' AS type, p.plan_key AS label
      FROM subscription_payments p
      LEFT JOIN schools s ON s.id = p.school_id
      ORDER BY p.created_at DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // E. PG-wise full stats (initiated, paid, dropped, conv%)
    db.query(`
      SELECT gateway,
             COUNT(*)                                           AS initiated,
             COUNT(*) FILTER(WHERE ${PAID})                    AS paid,
             COUNT(*) FILTER(WHERE status IN ('failed','dropped','cancelled')) AS dropped,
             COUNT(*) FILTER(WHERE status='pending')           AS pending,
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0) AS collected_paise
      FROM (
        SELECT gateway, amount_paise, status FROM subscription_payments
        UNION ALL
        SELECT gateway, amount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT gateway, amount_paise, status FROM featured_listing_payments
      ) p
      GROUP BY gateway ORDER BY initiated DESC
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  const totalCollected = +t.total_collected || 0
  const totalInitiated = +t.total_initiated || 0
  const totalDiscounts = +t.total_discounts || 0

  return {
    totals: {
      totalInitiated:   Math.round(totalInitiated / 100),
      totalCollected:   Math.round(totalCollected / 100),
      totalDiscounts:   Math.round(totalDiscounts / 100),
      netRevenue:       Math.round((totalCollected - totalDiscounts) / 100),
      paidCount:        +t.paid_count || 0,
      pendingCount:     +t.pending_count || 0,
      failedCount:      +t.failed_count || 0,
      totalTxns:        +t.total_txns || 0,
      conversionRate:   totalInitiated > 0 ? Math.round((+t.paid_count || 0) / (+t.total_txns || 1) * 100) : 0,
    },
    gatewayBreakdown:  gatewayBreakdown.rows.map(r => ({
      name: r.gateway, collected: Math.round(+r.collected / 100 || 0),
      initiated: Math.round(+r.initiated / 100), txns: +r.total_txns,
    })),
    statusBreakdown:   statusBreakdown.rows.map(r => ({
      name: r.status, count: +r.count, amount: Math.round(+r.amount / 100 || 0),
    })),
    monthlyRevenue:    monthlyRevenue.rows.map(r => ({
      month: r.month, revenue: Math.round(+r.revenue / 100 || 0), txns: +r.txns,
    })),
    couponBreakdown:   couponBreakdown.rows.map(r => ({
      code: r.code || '—', uses: +r.uses,
      discount: Math.round(+r.total_discount / 100), collected: Math.round(+r.total_collected / 100),
    })),
    planBreakdown:     planBreakdown.rows.map(r => ({
      name: r.name, count: +r.count, revenue: Math.round(+r.revenue / 100 || 0),
    })),
    revenueBySource:   revenueBySource.rows.map(r => ({
      source: r.source, revenue: Math.round(+r.revenue / 100 || 0), count: +r.count,
    })),
    recentPayments:    recentPayments.rows.map(r => ({
      school: r.school || '—', gateway: r.gateway, amount: Math.round(+r.amount_paise / 100 || 0),
      status: r.status, coupon: r.coupon_code, createdAt: r.created_at, label: r.label, type: r.type,
    })),
    gatewayStats:      gatewayStats.rows.map(r => ({
      gateway:    r.gateway,
      initiated:  +r.initiated,
      paid:       +r.paid,
      dropped:    +r.dropped,
      pending:    +r.pending,
      collected:  Math.round(+r.collected_paise / 100 || 0),
      convPct:    +r.initiated > 0 ? Math.round(+r.paid / +r.initiated * 100) : 0,
    })),
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'schools'

    switch (type) {
      case 'schools':  return NextResponse.json(await schoolAnalytics())
      case 'leads':    return NextResponse.json(await leadAnalytics())
      case 'payments': return NextResponse.json(await paymentAnalytics())
      default:         return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[reports]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
