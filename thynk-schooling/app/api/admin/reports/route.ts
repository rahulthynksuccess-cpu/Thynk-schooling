export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

const PAID = `status IN ('paid','captured','success','completed')`

// ─── Interval map ─────────────────────────────────────────────────────────────
function getInterval(range: string): string {
  const MAP: Record<string, string> = {
    '1d': '1 day', '7d': '7 days', '15d': '15 days', '30d': '30 days',
    '3m': '3 months', '6m': '6 months', '1y': '1 year',
  }
  return MAP[range] || '30 days'
}

// ─── SCHOOL ANALYTICS ─────────────────────────────────────────────────────────
async function schoolAnalytics(range: string) {
  const intv = getInterval(range)
  const [
    totals, stateWise, cityWise, pincodeCount, boardWise,
    genderWise, typeWise, facilitySummary, sportsSummary,
    languageSummary, extraSummary, monthlyGrowth,
    verifiedTrend, feeRange, recognitionWise,
  ] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                                                AS total,
        COUNT(*) FILTER(WHERE is_verified=true)                                AS verified,
        COUNT(*) FILTER(WHERE is_active=true)                                  AS active,
        COUNT(*) FILTER(WHERE is_featured=true)                                AS featured,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '${intv}')          AS period_new,
        COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE)                      AS today,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '7 days')           AS new_7d,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '30 days')          AS new_30d
      FROM schools
    `).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT state AS name, COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_verified=true) AS verified,
             COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '${intv}') AS period_count
      FROM schools WHERE state IS NOT NULL AND state <> ''
      GROUP BY state ORDER BY count DESC LIMIT 25
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT city AS name, COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_verified=true) AS verified,
             COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '${intv}') AS period_count
      FROM schools WHERE city IS NOT NULL AND city <> ''
      GROUP BY city ORDER BY count DESC LIMIT 25
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COUNT(DISTINCT pincode) AS active_pincodes,
             COUNT(DISTINCT SUBSTRING(pincode,1,4)) AS active_districts,
             COUNT(DISTINCT state) AS active_states,
             COUNT(DISTINCT city) AS active_cities
      FROM schools WHERE pincode IS NOT NULL AND pincode <> ''
    `).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT b.board_name AS name, COUNT(s.id) AS count
      FROM schools s, UNNEST(s.board) AS b(board_name)
      WHERE b.board_name IS NOT NULL AND b.board_name <> ''
      GROUP BY b.board_name ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(gender_policy,'Not Specified') AS name, COUNT(*) AS count
      FROM schools GROUP BY gender_policy ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(school_type,'Not Specified') AS name, COUNT(*) AS count
      FROM schools GROUP BY school_type ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT f.facility AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.facilities) AS f(facility)
      WHERE f.facility IS NOT NULL AND f.facility <> ''
      GROUP BY f.facility ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT sp.sport AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.sports) AS sp(sport)
      WHERE sp.sport IS NOT NULL AND sp.sport <> ''
      GROUP BY sp.sport ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT lang.language AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.languages) AS lang(language)
      WHERE lang.language IS NOT NULL AND lang.language <> ''
      GROUP BY lang.language ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT ec.activity AS name, COUNT(*) AS count
      FROM schools s, UNNEST(s.extracurriculars) AS ec(activity)
      WHERE ec.activity IS NOT NULL AND ec.activity <> ''
      GROUP BY ec.activity ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // Monthly growth series
    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             COUNT(*) AS count,
             COUNT(*) FILTER(WHERE is_verified=true) AS verified
      FROM schools WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at)
      ORDER BY month_dt
    `).catch(() => ({ rows: [] })),

    // Daily trend for selected range
    db.query(`
      SELECT to_char(gs.day,'DD Mon') AS label, gs.day::date AS day_dt,
             COUNT(s.id) AS count,
             COUNT(s.id) FILTER(WHERE s.is_verified=true) AS verified
      FROM generate_series((NOW()-INTERVAL '${intv}')::date, NOW()::date, INTERVAL '1 day') AS gs(day)
      LEFT JOIN schools s ON DATE(s.created_at) = gs.day::date
      GROUP BY gs.day ORDER BY gs.day
    `).catch(() => ({ rows: [] })),

    // Fee range distribution
    db.query(`
      SELECT
        COUNT(*) FILTER(WHERE monthly_fee_min < 2000 OR monthly_fee_min IS NULL) AS budget,
        COUNT(*) FILTER(WHERE monthly_fee_min BETWEEN 2000 AND 8000)             AS mid,
        COUNT(*) FILTER(WHERE monthly_fee_min > 8000)                            AS premium
      FROM schools
    `).catch(() => ({ rows: [{}] })),

    // Recognition / affiliation
    db.query(`
      SELECT COALESCE(recognition,'Not Specified') AS name, COUNT(*) AS count
      FROM schools GROUP BY recognition ORDER BY count DESC LIMIT 10
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  const pc = pincodeCount.rows[0] || {}
  const fr = feeRange.rows[0] || {}

  return {
    range,
    totals: {
      total: +t.total||0, verified: +t.verified||0, active: +t.active||0,
      featured: +t.featured||0, periodNew: +t.period_new||0,
      today: +t.today||0, new7d: +t.new_7d||0, new30d: +t.new_30d||0,
    },
    coverage: {
      pincodes: +pc.active_pincodes||0, districts: +pc.active_districts||0,
      states: +pc.active_states||0, cities: +pc.active_cities||0,
    },
    feeRange: {
      budget: +fr.budget||0, mid: +fr.mid||0, premium: +fr.premium||0,
    },
    stateWise:      stateWise.rows.map(r => ({ name: r.name, count: +r.count, verified: +r.verified, periodCount: +r.period_count })),
    cityWise:       cityWise.rows.map(r => ({ name: r.name, count: +r.count, verified: +r.verified, periodCount: +r.period_count })),
    boardWise:      boardWise.rows.map(r => ({ name: r.name, count: +r.count })),
    genderWise:     genderWise.rows.map(r => ({ name: r.name, count: +r.count })),
    typeWise:       typeWise.rows.map(r => ({ name: r.name, count: +r.count })),
    facilities:     facilitySummary.rows.map(r => ({ name: r.name, count: +r.count })),
    sports:         sportsSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    languages:      languageSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    extraCurricular: extraSummary.rows.map(r => ({ name: r.name, count: +r.count })),
    monthlyGrowth:  monthlyGrowth.rows.map(r => ({ month: r.month, count: +r.count, verified: +r.verified })),
    dailyTrend:     verifiedTrend.rows.map(r => ({ label: r.label, count: +r.count, verified: +r.verified })),
    recognitionWise: recognitionWise.rows.map(r => ({ name: r.name, count: +r.count })),
  }
}

// ─── LEAD ANALYTICS ───────────────────────────────────────────────────────────
async function leadAnalytics(range: string) {
  const intv = getInterval(range)
  const [
    totals, stateWise, cityWise, pincodeCount, boardWise, typeWise,
    statusBreakdown, monthlyTrend, dailyTrend, topSchools,
    sourceBreakdown, classBreakdown, conversionByBoard,
  ] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                                          AS total,
        COUNT(*) FILTER(WHERE is_purchased=true)                         AS purchased,
        COUNT(*) FILTER(WHERE is_purchased=false OR is_purchased IS NULL) AS unpurchased,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '${intv}')    AS period_count,
        COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE)                AS today,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '7 days')     AS new_7d
      FROM leads
    `).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT COALESCE(s.state,'Unknown') AS name, COUNT(l.id) AS count,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased,
             COUNT(l.id) FILTER(WHERE l.created_at >= NOW()-INTERVAL '${intv}') AS period_count
      FROM leads l LEFT JOIN schools s ON s.id = l.school_id
      WHERE s.state IS NOT NULL AND s.state <> ''
      GROUP BY s.state ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(s.city,'Unknown') AS name, COUNT(l.id) AS count,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased,
             COUNT(l.id) FILTER(WHERE l.created_at >= NOW()-INTERVAL '${intv}') AS period_count
      FROM leads l LEFT JOIN schools s ON s.id = l.school_id
      WHERE s.city IS NOT NULL AND s.city <> ''
      GROUP BY s.city ORDER BY count DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COUNT(DISTINCT s.pincode) AS active_pincodes,
             COUNT(DISTINCT s.city) AS active_cities,
             COUNT(DISTINCT s.state) AS active_states
      FROM leads l JOIN schools s ON s.id = l.school_id
      WHERE s.pincode IS NOT NULL AND s.pincode <> ''
    `).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT b.board_name AS name, COUNT(l.id) AS count,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased
      FROM leads l JOIN schools s ON s.id = l.school_id,
      UNNEST(s.board) AS b(board_name)
      WHERE b.board_name IS NOT NULL AND b.board_name <> ''
      GROUP BY b.board_name ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(s.school_type,'Not Specified') AS name, COUNT(l.id) AS count,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased
      FROM leads l LEFT JOIN schools s ON s.id = l.school_id
      GROUP BY s.school_type ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(status,'new') AS name, COUNT(*) AS count
      FROM leads GROUP BY status ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             COUNT(*) AS count, COUNT(*) FILTER(WHERE is_purchased=true) AS purchased
      FROM leads WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at) ORDER BY month_dt
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT to_char(gs.day,'DD Mon') AS label,
             COUNT(l.id) AS count,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased
      FROM generate_series((NOW()-INTERVAL '${intv}')::date, NOW()::date, INTERVAL '1 day') AS gs(day)
      LEFT JOIN leads l ON DATE(l.created_at) = gs.day::date
      GROUP BY gs.day ORDER BY gs.day
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT s.name, COUNT(l.id) AS leads,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased,
             ROUND(COUNT(l.id) FILTER(WHERE l.is_purchased=true)::numeric/NULLIF(COUNT(l.id),0)*100) AS conv_pct
      FROM leads l JOIN schools s ON s.id = l.school_id
      WHERE l.created_at >= NOW()-INTERVAL '${intv}'
      GROUP BY s.id, s.name ORDER BY leads DESC LIMIT 10
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(source,'direct') AS name, COUNT(*) AS count
      FROM leads GROUP BY source ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT COALESCE(class_applying_for,'Not Specified') AS name, COUNT(*) AS count
      FROM leads WHERE class_applying_for IS NOT NULL
      GROUP BY class_applying_for ORDER BY count DESC LIMIT 12
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT b.board_name AS board,
             COUNT(l.id) AS total,
             COUNT(l.id) FILTER(WHERE l.is_purchased=true) AS purchased,
             ROUND(COUNT(l.id) FILTER(WHERE l.is_purchased=true)::numeric/NULLIF(COUNT(l.id),0)*100) AS conv_pct
      FROM leads l JOIN schools s ON s.id = l.school_id,
      UNNEST(s.board) AS b(board_name)
      GROUP BY b.board_name ORDER BY total DESC LIMIT 8
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  const pc = pincodeCount.rows[0] || {}

  return {
    range,
    totals: {
      total: +t.total||0, purchased: +t.purchased||0,
      unpurchased: +t.unpurchased||0, periodCount: +t.period_count||0,
      today: +t.today||0, new7d: +t.new_7d||0,
      convRate: +t.total > 0 ? Math.round(+t.purchased/+t.total*100) : 0,
    },
    coverage: { pincodes: +pc.active_pincodes||0, cities: +pc.active_cities||0, states: +pc.active_states||0 },
    stateWise:       stateWise.rows.map(r => ({ name: r.name, count: +r.count, purchased: +r.purchased, periodCount: +r.period_count })),
    cityWise:        cityWise.rows.map(r => ({ name: r.name, count: +r.count, purchased: +r.purchased, periodCount: +r.period_count })),
    boardWise:       boardWise.rows.map(r => ({ name: r.name, count: +r.count, purchased: +r.purchased })),
    typeWise:        typeWise.rows.map(r => ({ name: r.name, count: +r.count, purchased: +r.purchased })),
    statusBreakdown: statusBreakdown.rows.map(r => ({ name: r.name, count: +r.count })),
    monthlyTrend:    monthlyTrend.rows.map(r => ({ month: r.month, count: +r.count, purchased: +r.purchased })),
    dailyTrend:      dailyTrend.rows.map(r => ({ label: r.label, count: +r.count, purchased: +r.purchased })),
    topSchools:      topSchools.rows.map(r => ({ name: r.name, leads: +r.leads, purchased: +r.purchased, convPct: +r.conv_pct||0 })),
    sourceBreakdown: sourceBreakdown.rows.map(r => ({ name: r.name, count: +r.count })),
    classBreakdown:  classBreakdown.rows.map(r => ({ name: r.name, count: +r.count })),
    conversionByBoard: conversionByBoard.rows.map(r => ({ board: r.board, total: +r.total, purchased: +r.purchased, convPct: +r.conv_pct||0 })),
  }
}

// ─── PAYMENT ANALYTICS ────────────────────────────────────────────────────────
async function paymentAnalytics(range: string) {
  const intv = getInterval(range)
  const [
    totals, gatewayStats, statusBreakdown, monthlyRevenue, dailyRevenue,
    couponBreakdown, revenueBySource, recentPayments,
    // Plans from DB — actual names
    subPlans, leadPackages,
    planBreakdown, packageBreakdown,
    dailyTxnCount,
  ] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(SUM(amount_paise),0)                                    AS total_initiated,
        COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0)              AS total_collected,
        COALESCE(SUM(discount_paise) FILTER(WHERE ${PAID}),0)            AS total_discounts,
        COUNT(*) FILTER(WHERE ${PAID})                                   AS paid_count,
        COUNT(*) FILTER(WHERE status='pending')                          AS pending_count,
        COUNT(*) FILTER(WHERE status IN ('failed','dropped','cancelled')) AS failed_count,
        COUNT(*)                                                         AS total_txns,
        COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID} AND created_at >= NOW()-INTERVAL '${intv}'),0) AS period_collected,
        COUNT(*) FILTER(WHERE ${PAID} AND created_at >= CURRENT_DATE)   AS today_paid
      FROM (
        SELECT amount_paise,discount_paise,status,created_at FROM subscription_payments
        UNION ALL SELECT amount_paise,discount_paise,status,created_at FROM lead_package_payments
        UNION ALL SELECT amount_paise,0,status,created_at FROM featured_listing_payments
      ) all_pay
    `).catch(() => ({ rows: [{}] })),

    // E. Full PG stats — ACTUAL collected only (not initiated)
    db.query(`
      SELECT gateway,
             COUNT(*)                                                 AS initiated,
             COUNT(*) FILTER(WHERE ${PAID})                          AS paid,
             COUNT(*) FILTER(WHERE status IN ('failed','dropped','cancelled')) AS dropped,
             COUNT(*) FILTER(WHERE status='pending')                 AS pending,
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0)     AS collected_paise,
             COALESCE(SUM(discount_paise) FILTER(WHERE ${PAID}),0)   AS discounts_paise,
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID} AND created_at >= NOW()-INTERVAL '${intv}'),0) AS period_collected
      FROM (
        SELECT gateway,amount_paise,discount_paise,status,created_at FROM subscription_payments
        UNION ALL SELECT gateway,amount_paise,discount_paise,status,created_at FROM lead_package_payments
        UNION ALL SELECT gateway,0,0,status,created_at FROM featured_listing_payments
      ) p GROUP BY gateway ORDER BY collected_paise DESC
    `).catch(() => ({ rows: [] })),

    // D. Status breakdown
    db.query(`
      SELECT status, COUNT(*) AS count,
             COALESCE(SUM(amount_paise),0) AS amount
      FROM (
        SELECT status,amount_paise FROM subscription_payments
        UNION ALL SELECT status,amount_paise FROM lead_package_payments
        UNION ALL SELECT status,amount_paise FROM featured_listing_payments
      ) p GROUP BY status ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // Monthly trend
    db.query(`
      SELECT to_char(DATE_TRUNC('month',created_at),'Mon YY') AS month,
             DATE_TRUNC('month',created_at) AS month_dt,
             COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0) AS revenue,
             COUNT(*) FILTER(WHERE ${PAID}) AS txns
      FROM (
        SELECT created_at,amount_paise,status FROM subscription_payments
        UNION ALL SELECT created_at,amount_paise,status FROM lead_package_payments
        UNION ALL SELECT created_at,amount_paise,status FROM featured_listing_payments
      ) p WHERE created_at >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',created_at) ORDER BY month_dt
    `).catch(() => ({ rows: [] })),

    // Daily revenue for selected range
    db.query(`
      SELECT to_char(gs.day,'DD Mon') AS label,
             COALESCE(SUM(p.amount_paise) FILTER(WHERE ${PAID}),0) AS revenue,
             COUNT(p.id) FILTER(WHERE ${PAID}) AS txns
      FROM generate_series((NOW()-INTERVAL '${intv}')::date, NOW()::date, INTERVAL '1 day') AS gs(day)
      LEFT JOIN (
        SELECT id::text,created_at,amount_paise,status FROM subscription_payments
        UNION ALL SELECT id::text,created_at,amount_paise,status FROM lead_package_payments
        UNION ALL SELECT id::text,created_at,amount_paise,status FROM featured_listing_payments
      ) p ON DATE(p.created_at) = gs.day::date
      GROUP BY gs.day ORDER BY gs.day
    `).catch(() => ({ rows: [] })),

    // F. Coupon breakdown
    db.query(`
      SELECT COALESCE(coupon_code,'—') AS code,
             COUNT(*) AS uses,
             SUM(discount_paise) AS total_discount,
             SUM(amount_paise) AS total_collected
      FROM (
        SELECT coupon_code,amount_paise,discount_paise FROM subscription_payments WHERE ${PAID} AND coupon_code IS NOT NULL
        UNION ALL SELECT coupon_code,amount_paise,discount_paise FROM lead_package_payments WHERE ${PAID} AND coupon_code IS NOT NULL
      ) c GROUP BY coupon_code ORDER BY total_discount DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // Revenue by source type
    db.query(`
      SELECT 'Subscription Plans' AS source, COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0) AS revenue, COUNT(*) FILTER(WHERE ${PAID}) AS count FROM subscription_payments
      UNION ALL SELECT 'Lead Packages', COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0), COUNT(*) FILTER(WHERE ${PAID}) FROM lead_package_payments
      UNION ALL SELECT 'Featured Listings', COALESCE(SUM(amount_paise) FILTER(WHERE ${PAID}),0), COUNT(*) FILTER(WHERE ${PAID}) FROM featured_listing_payments
    `).catch(() => ({ rows: [] })),

    // Recent payments
    db.query(`
      SELECT s.name AS school, sp.gateway, sp.amount_paise, sp.discount_paise, sp.status,
             sp.coupon_code, sp.created_at, sp.plan_key AS label, 'subscription' AS type
      FROM subscription_payments sp LEFT JOIN schools s ON s.id=sp.school_id
      ORDER BY sp.created_at DESC LIMIT 20
    `).catch(() => ({ rows: [] })),

    // Pull actual plan names from DB
    db.query(`SELECT plan_key, name, price_paise, lead_count FROM subscription_plans WHERE is_active=true ORDER BY sort_order ASC`).catch(() => ({ rows: [] })),
    db.query(`SELECT id, name, price_paise, leads_count FROM lead_packages WHERE is_active=true ORDER BY sort_order ASC`).catch(() => ({ rows: [] })),

    // Plan-wise revenue — join to actual plan names
    db.query(`
      SELECT sp2.name AS name, sp.plan_key,
             COUNT(*) FILTER(WHERE ${PAID}) AS count,
             COALESCE(SUM(sp.amount_paise) FILTER(WHERE ${PAID}),0) AS revenue,
             COALESCE(SUM(sp.discount_paise) FILTER(WHERE ${PAID}),0) AS discounts
      FROM subscription_payments sp
      LEFT JOIN subscription_plans sp2 ON sp2.plan_key = sp.plan_key
      WHERE sp.plan_key IS NOT NULL
      GROUP BY sp.plan_key, sp2.name ORDER BY revenue DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // Package-wise revenue (lead packages) — join to actual package names
    db.query(`
      SELECT lp.name AS name, lpp.package_id,
             COUNT(*) FILTER(WHERE ${PAID}) AS count,
             COALESCE(SUM(lpp.amount_paise) FILTER(WHERE ${PAID}),0) AS revenue
      FROM lead_package_payments lpp
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      GROUP BY lpp.package_id, lp.name ORDER BY revenue DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // Daily txn count by status for sparkline
    db.query(`
      SELECT to_char(gs.day,'DD Mon') AS label,
             COUNT(p.id) FILTER(WHERE ${PAID}) AS paid,
             COUNT(p.id) FILTER(WHERE p.status='pending') AS pending,
             COUNT(p.id) FILTER(WHERE p.status IN ('failed','dropped','cancelled')) AS failed
      FROM generate_series((NOW()-INTERVAL '${intv}')::date, NOW()::date, INTERVAL '1 day') AS gs(day)
      LEFT JOIN (
        SELECT id::text,created_at,status FROM subscription_payments
        UNION ALL SELECT id::text,created_at,status FROM lead_package_payments
        UNION ALL SELECT id::text,created_at,status FROM featured_listing_payments
      ) p ON DATE(p.created_at) = gs.day::date
      GROUP BY gs.day ORDER BY gs.day
    `).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  const totalColl = +t.total_collected||0
  const totalInit = +t.total_initiated||0

  return {
    range,
    totals: {
      totalInitiated: Math.round(totalInit/100),
      totalCollected: Math.round(totalColl/100),
      totalDiscounts: Math.round(+t.total_discounts/100||0),
      netRevenue:     Math.round((totalColl - +t.total_discounts)/100||0),
      paidCount:      +t.paid_count||0,
      pendingCount:   +t.pending_count||0,
      failedCount:    +t.failed_count||0,
      totalTxns:      +t.total_txns||0,
      periodCollected: Math.round(+t.period_collected/100||0),
      todayPaid:      +t.today_paid||0,
      conversionRate: +t.total_txns>0 ? Math.round(+t.paid_count/+t.total_txns*100) : 0,
    },
    // PG stats with ACTUAL collection (not initiated)
    gatewayStats: gatewayStats.rows.map(r => ({
      gateway:         r.gateway,
      initiated:       +r.initiated,
      paid:            +r.paid,
      dropped:         +r.dropped,
      pending:         +r.pending,
      collected:       Math.round(+r.collected_paise/100||0),   // ACTUAL collected
      discounts:       Math.round(+r.discounts_paise/100||0),
      netCollected:    Math.round((+r.collected_paise - +r.discounts_paise)/100||0),
      periodCollected: Math.round(+r.period_collected/100||0),
      convPct:         +r.initiated>0 ? Math.round(+r.paid/+r.initiated*100) : 0,
    })),
    statusBreakdown:  statusBreakdown.rows.map(r => ({ name: r.status, count: +r.count, amount: Math.round(+r.amount/100||0) })),
    monthlyRevenue:   monthlyRevenue.rows.map(r => ({ month: r.month, revenue: Math.round(+r.revenue/100||0), txns: +r.txns })),
    dailyRevenue:     dailyRevenue.rows.map(r => ({ label: r.label, revenue: Math.round(+r.revenue/100||0), txns: +r.txns })),
    dailyTxnCount:    dailyTxnCount.rows.map(r => ({ label: r.label, paid: +r.paid, pending: +r.pending, failed: +r.failed })),
    couponBreakdown:  couponBreakdown.rows.map(r => ({ code: r.code||'—', uses: +r.uses, discount: Math.round(+r.total_discount/100||0), collected: Math.round(+r.total_collected/100||0) })),
    revenueBySource:  revenueBySource.rows.map(r => ({ source: r.source, revenue: Math.round(+r.revenue/100||0), count: +r.count })),
    recentPayments:   recentPayments.rows.map(r => ({ school: r.school||'—', gateway: r.gateway, amount: Math.round(+r.amount_paise/100||0), discount: Math.round(+r.discount_paise/100||0), status: r.status, coupon: r.coupon_code, createdAt: r.created_at, label: r.label, type: r.type })),
    // Actual plan names from DB
    subPlans:         subPlans.rows.map(r => ({ planKey: r.plan_key, name: r.name, price: Math.round(+r.price_paise/100), leadCount: +r.lead_count })),
    leadPackages:     leadPackages.rows.map(r => ({ id: r.id, name: r.name, price: Math.round(+r.price_paise/100), leadsCount: +r.leads_count })),
    planBreakdown:    planBreakdown.rows.map(r => ({ name: r.name||r.plan_key||'Unknown', planKey: r.plan_key, count: +r.count, revenue: Math.round(+r.revenue/100||0), discounts: Math.round(+r.discounts/100||0) })),
    packageBreakdown: packageBreakdown.rows.map(r => ({ name: r.name||'Unknown Package', count: +r.count, revenue: Math.round(+r.revenue/100||0) })),
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type  = searchParams.get('type')  || 'schools'
    const range = searchParams.get('range') || '30d'
    switch (type) {
      case 'schools':  return NextResponse.json(await schoolAnalytics(range))
      case 'leads':    return NextResponse.json(await leadAnalytics(range))
      case 'payments': return NextResponse.json(await paymentAnalytics(range))
      default:         return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[reports]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
