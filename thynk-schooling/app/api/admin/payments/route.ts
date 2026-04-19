export const dynamic = 'force-dynamic'
/**
 * /api/admin/payments
 *
 * GET ?action=list     — paginated transactions with search/filter
 * GET ?action=analytics — PG-wise, day/week/month breakdowns, coupon stats
 * GET ?action=export   — CSV download
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

async function ensureTables() {
  // Ensure lead_package_payments has coupon columns
  await db.query(`
    ALTER TABLE lead_package_payments
      ADD COLUMN IF NOT EXISTS coupon_code   VARCHAR(50),
      ADD COLUMN IF NOT EXISTS discount_paise INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER
  `).catch(() => {})

  // Back-fill coupon_code + discount_paise from meta JSONB (for existing rows)
  await db.query(`
    UPDATE lead_package_payments
    SET
      coupon_code          = meta->>'coupon_code',
      discount_paise       = COALESCE((meta->>'discount_paise')::int, 0),
      original_amount_paise= COALESCE((meta->>'original_price_paise')::int, amount_paise)
    WHERE coupon_code IS NULL AND meta->>'coupon_id' IS NOT NULL
  `).catch(() => {})
}

function buildWhere(params: {
  status?: string | null
  gateway?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}) {
  const conds: string[] = ['1=1']
  const vals: any[]     = []
  let i = 1

  if (params.status && params.status !== 'all') {
    conds.push(`lpp.status = $${i++}`)
    vals.push(params.status)
  }
  if (params.gateway && params.gateway !== 'all') {
    conds.push(`lpp.gateway = $${i++}`)
    vals.push(params.gateway)
  }
  if (params.search) {
    const like = `%${params.search}%`
    conds.push(`(s.name ILIKE $${i} OR lpp.order_id ILIKE $${i} OR lpp.payment_id ILIKE $${i} OR lpp.coupon_code ILIKE $${i})`)
    vals.push(like); i++
  }
  if (params.from) { conds.push(`lpp.created_at >= $${i++}`); vals.push(params.from) }
  if (params.to)   { conds.push(`lpp.created_at <  $${i++}`); vals.push(params.to)   }

  return { where: conds.join(' AND '), vals, nextIdx: i }
}

/* ─── list ────────────────────────────────────────────────────────────────── */

async function listPayments(req: NextRequest) {
  await ensureTables()
  const sp     = new URL(req.url).searchParams
  const page   = Math.max(1, Number(sp.get('page')   || 1))
  const limit  = Math.min(50, Number(sp.get('limit')  || 20))
  const offset = (page - 1) * limit

  const { where, vals, nextIdx } = buildWhere({
    status:  sp.get('status'),
    gateway: sp.get('gateway'),
    search:  sp.get('search'),
    from:    sp.get('from'),
    to:      sp.get('to'),
  })

  // Combined payments view: lead_package_payments + subscription_payments
  // buildWhere uses lpp. alias — we replicate the same columns from both tables
  const subWhere = where
    .replace(/lpp\.status/g, 'sp.status')
    .replace(/lpp\.gateway/g, 'sp.gateway')
    .replace(/lpp\.order_id/g, 'sp.order_id')
    .replace(/lpp\.payment_id/g, 'sp.payment_id')
    .replace(/lpp\.coupon_code/g, 'sp.coupon_code')
    .replace(/lpp\.created_at/g, 'sp.created_at')
    .replace(/s\.name ILIKE/g, 's2.name ILIKE')

  const [rows, ct, totals] = await Promise.all([
    db.query(`
      SELECT * FROM (
        SELECT
          lpp.id,
          lpp.order_id,
          lpp.payment_id,
          lpp.gateway,
          lpp.amount_paise,
          COALESCE(lpp.discount_paise, (lpp.meta->>'discount_paise')::int, 0) AS discount_resolved,
          lpp.original_amount_paise,
          COALESCE(lpp.coupon_code, lpp.meta->>'coupon_code') AS coupon_code_resolved,
          lpp.credits_added,
          lpp.status,
          lpp.created_at,
          s.name AS school_name,
          COALESCE(lp.name, 'Lead Package') AS package_name,
          'lead_credit' AS payment_type
        FROM lead_package_payments lpp
        LEFT JOIN schools s  ON s.id  = lpp.school_id
        LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
        WHERE ${where}
        UNION ALL
        SELECT
          sp.id,
          sp.order_id,
          sp.payment_id,
          sp.gateway,
          sp.amount_paise,
          COALESCE(sp.discount_paise, 0) AS discount_resolved,
          sp.original_amount_paise,
          sp.coupon_code AS coupon_code_resolved,
          0 AS credits_added,
          sp.status,
          sp.created_at,
          s2.name AS school_name,
          COALESCE(spl.name, sp.plan_key, 'Subscription') AS package_name,
          'subscription' AS payment_type
        FROM subscription_payments sp
        LEFT JOIN schools s2 ON s2.id = sp.school_id
        LEFT JOIN subscription_plans spl ON spl.plan_key = sp.plan_key
        WHERE ${subWhere}
      ) combined
      ORDER BY created_at DESC
      LIMIT $${nextIdx} OFFSET $${nextIdx + 1}
    `, [...vals, limit, offset]),

    db.query(`
      SELECT (
        (SELECT COUNT(*) FROM lead_package_payments lpp LEFT JOIN schools s ON s.id = lpp.school_id WHERE ${where})
        +
        (SELECT COUNT(*) FROM subscription_payments sp LEFT JOIN schools s2 ON s2.id = sp.school_id WHERE ${subWhere})
      ) AS count
    `, vals),

    db.query(`
      SELECT
        COALESCE(SUM(amount_paise), 0)                                          AS total_amount,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END), 0)    AS completed_amount,
        COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE THEN amount_paise END), 0) AS today_amount,
        COALESCE(SUM(discount_paise), 0)                                        AS total_discount
      FROM (
        SELECT lpp.amount_paise, lpp.status, lpp.created_at,
               COALESCE(lpp.discount_paise,(lpp.meta->>'discount_paise')::int,0) AS discount_paise
        FROM lead_package_payments lpp LEFT JOIN schools s ON s.id = lpp.school_id WHERE ${where}
        UNION ALL
        SELECT sp.amount_paise, sp.status, sp.created_at, COALESCE(sp.discount_paise,0)
        FROM subscription_payments sp LEFT JOIN schools s2 ON s2.id = sp.school_id WHERE ${subWhere}
      ) all_pay
    `, vals),
  ])

  const t = totals.rows[0]

  return NextResponse.json({
    data: rows.rows.map((r: any) => ({
      id:              r.id,
      transactionId:   r.payment_id || r.order_id || r.id?.slice(0, 12),
      orderId:         r.order_id,
      schoolName:      r.school_name  || '—',
      packageName:     r.package_name || 'Lead Package',
      type:            r.payment_type === 'subscription' ? 'Subscription Plan' : 'Lead Purchase',
      amount:          Number(r.amount_paise)   || 0,
      discount:        Number(r.discount_resolved) || 0,
      originalAmount:  Number(r.original_amount_paise) || Number(r.amount_paise) || 0,
      couponCode:      r.coupon_code_resolved   || null,
      creditsAdded:    Number(r.credits_added)  || 0,
      gateway:         r.gateway || 'razorpay',
      status:          r.status  || 'pending',
      createdAt:       r.created_at,
    })),
    total:            Number(ct.rows[0].count),
    page,
    limit,
    totalAmount:      Number(t.total_amount),
    completedAmount:  Number(t.completed_amount),
    todayAmount:      Number(t.today_amount),
    totalDiscount:    Number(t.total_discount),
  })
}

/* ─── analytics ──────────────────────────────────────────────────────────── */

async function getAnalytics(req: NextRequest) {
  await ensureTables()
  const sp      = new URL(req.url).searchParams
  const range   = sp.get('range') || '30d'   // 7d | 30d | 90d | 1y

  const intervalMap: Record<string, string> = {
    '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year',
  }
  const interval = intervalMap[range] || '30 days'

  const [
    pgWise,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    statusBreakdown,
    couponStats,
    topSchools,
    hourlyHeatmap,
  ] = await Promise.all([

    // PG-wise transactions + revenue (lead credits + subscription plans)
    db.query(`
      SELECT
        gateway,
        COUNT(*)                                                            AS txn_count,
        COALESCE(SUM(amount_paise),0)                                      AS total_amount,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS completed_amount,
        COUNT(CASE WHEN status='completed' THEN 1 END)                     AS completed_count,
        COUNT(CASE WHEN status='pending'   THEN 1 END)                     AS pending_count,
        COUNT(CASE WHEN status='failed'    THEN 1 END)                     AS failed_count,
        ROUND(100.0 * COUNT(CASE WHEN status='completed' THEN 1 END) / NULLIF(COUNT(*),0), 1) AS success_rate
      FROM (
        SELECT gateway, status, amount_paise FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        UNION ALL
        SELECT gateway, status, amount_paise FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      ) ap
      GROUP BY gateway
      ORDER BY total_amount DESC
    `).catch(() => ({ rows: [] })),

    // Daily trend
    db.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*)         AS txn_count,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM (
        SELECT created_at, status, amount_paise FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        UNION ALL
        SELECT created_at, status, amount_paise FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      ) ap
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `).catch(() => ({ rows: [] })),

    // Weekly trend
    db.query(`
      SELECT
        DATE_TRUNC('week', created_at)::date AS week_start,
        COUNT(*) AS txn_count,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM (
        SELECT created_at, status, amount_paise FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        UNION ALL
        SELECT created_at, status, amount_paise FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
      ) ap
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week_start ASC
    `).catch(() => ({ rows: [] })),

    // Monthly trend
    db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
        DATE_TRUNC('month', created_at)                    AS month_date,
        COUNT(*) AS txn_count,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM (
        SELECT created_at, status, amount_paise FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '12 months'
        UNION ALL
        SELECT created_at, status, amount_paise FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '12 months'
      ) ap
      GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY')
      ORDER BY month_date ASC
    `).catch(() => ({ rows: [] })),

    // Status breakdown
    db.query(`
      SELECT
        status,
        COUNT(*)                     AS count,
        COALESCE(SUM(amount_paise),0) AS amount
      FROM (
        SELECT status, amount_paise FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        UNION ALL
        SELECT status, amount_paise FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      ) ap
      GROUP BY status
    `).catch(() => ({ rows: [] })),

    // Coupon performance (lead_package_payments + subscription_payments)
    db.query(`
      SELECT
        code,
        COUNT(*)                                                           AS usage_count,
        COALESCE(SUM(discount_paise),0)                                    AS total_discount,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue_after_discount
      FROM (
        SELECT COALESCE(coupon_code, meta->>'coupon_code') AS code,
               COALESCE(discount_paise,(meta->>'discount_paise')::int,0) AS discount_paise,
               amount_paise, status
        FROM lead_package_payments
        WHERE COALESCE(coupon_code, meta->>'coupon_code') IS NOT NULL
          AND created_at >= NOW() - INTERVAL '${interval}'
        UNION ALL
        SELECT coupon_code AS code, COALESCE(discount_paise,0), amount_paise, status
        FROM subscription_payments
        WHERE coupon_code IS NOT NULL
          AND created_at >= NOW() - INTERVAL '${interval}'
      ) cp
      WHERE code IS NOT NULL
      GROUP BY code
      ORDER BY usage_count DESC
      LIMIT 10
    `).catch(() => ({ rows: [] })),

    // Top schools by revenue (both payment types)
    db.query(`
      SELECT
        school_name,
        COUNT(*)  AS txn_count,
        COALESCE(SUM(amount_paise),0) AS revenue
      FROM (
        SELECT s.name AS school_name, lpp.amount_paise
        FROM lead_package_payments lpp
        LEFT JOIN schools s ON s.id = lpp.school_id
        WHERE lpp.created_at >= NOW() - INTERVAL '${interval}' AND lpp.status='completed'
        UNION ALL
        SELECT s2.name AS school_name, sp.amount_paise
        FROM subscription_payments sp
        LEFT JOIN schools s2 ON s2.id = sp.school_id
        WHERE sp.created_at >= NOW() - INTERVAL '${interval}' AND sp.status='completed'
      ) rs
      GROUP BY school_name
      ORDER BY revenue DESC
      LIMIT 8
    `).catch(() => ({ rows: [] })),

    // Hourly heatmap
    db.query(`
      SELECT
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*) AS txn_count
      FROM (
        SELECT created_at FROM lead_package_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}' AND status='completed'
        UNION ALL
        SELECT created_at FROM subscription_payments
        WHERE created_at >= NOW() - INTERVAL '${interval}' AND status='completed'
      ) ap
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `).catch(() => ({ rows: [] })),
  ])

  return NextResponse.json({
    pgWise:         pgWise.rows.map((r: any) => ({
      gateway:        r.gateway,
      txnCount:       Number(r.txn_count),
      totalAmount:    Number(r.total_amount),
      completedAmount:Number(r.completed_amount),
      completedCount: Number(r.completed_count),
      pendingCount:   Number(r.pending_count),
      failedCount:    Number(r.failed_count),
      successRate:    Number(r.success_rate) || 0,
    })),
    dailyTrend:     dailyTrend.rows.map((r: any) => ({
      day:     String(r.day).slice(5),   // MM-DD
      count:   Number(r.txn_count),
      revenue: Number(r.revenue),
    })),
    weeklyTrend:    weeklyTrend.rows.map((r: any) => ({
      week:    String(r.week_start).slice(5, 10),
      count:   Number(r.txn_count),
      revenue: Number(r.revenue),
    })),
    monthlyTrend:   monthlyTrend.rows.map((r: any) => ({
      month:   r.month,
      count:   Number(r.txn_count),
      revenue: Number(r.revenue),
    })),
    statusBreakdown: statusBreakdown.rows.map((r: any) => ({
      status: r.status,
      count:  Number(r.count),
      amount: Number(r.amount),
    })),
    couponStats:    couponStats.rows.map((r: any) => ({
      code:          r.code,
      usageCount:    Number(r.usage_count),
      totalDiscount: Number(r.total_discount),
      revenueAfter:  Number(r.revenue_after_discount),
    })),
    topSchools:     topSchools.rows.map((r: any) => ({
      name:    r.school_name || '—',
      count:   Number(r.txn_count),
      revenue: Number(r.revenue),
    })),
    hourlyHeatmap:  (() => {
      const map: Record<number, number> = {}
      hourlyHeatmap.rows.forEach((r: any) => { map[Number(r.hour)] = Number(r.txn_count) })
      return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: map[h] || 0 }))
    })(),
  })
}

/* ─── export CSV ─────────────────────────────────────────────────────────── */

async function exportPayments(req: NextRequest) {
  await ensureTables()
  const sp = new URL(req.url).searchParams
  const { where, vals } = buildWhere({
    status:  sp.get('status'),
    gateway: sp.get('gateway'),
    search:  sp.get('search'),
    from:    sp.get('from'),
    to:      sp.get('to'),
  })

  const subWhere = where
    .replace(/lpp\.status/g, 'sp.status')
    .replace(/lpp\.gateway/g, 'sp.gateway')
    .replace(/lpp\.order_id/g, 'sp.order_id')
    .replace(/lpp\.payment_id/g, 'sp.payment_id')
    .replace(/lpp\.coupon_code/g, 'sp.coupon_code')
    .replace(/lpp\.created_at/g, 'sp.created_at')
    .replace(/s\.name ILIKE/g, 's2.name ILIKE')

  const rows = await db.query(`
    SELECT * FROM (
      SELECT
        lpp.order_id,
        lpp.payment_id,
        s.name AS school_name,
        COALESCE(lp.name, 'Lead Package') AS package_name,
        lpp.gateway,
        lpp.amount_paise,
        COALESCE(lpp.discount_paise, (lpp.meta->>'discount_paise')::int, 0) AS discount_paise,
        COALESCE(lpp.coupon_code, lpp.meta->>'coupon_code') AS coupon_code,
        lpp.credits_added,
        lpp.status,
        lpp.created_at,
        'Lead Credit' AS payment_type
      FROM lead_package_payments lpp
      LEFT JOIN schools s  ON s.id  = lpp.school_id
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      WHERE ${where}
      UNION ALL
      SELECT
        sp.order_id,
        sp.payment_id,
        s2.name AS school_name,
        COALESCE(spl.name, sp.plan_key, 'Subscription') AS package_name,
        sp.gateway,
        sp.amount_paise,
        COALESCE(sp.discount_paise, 0) AS discount_paise,
        sp.coupon_code,
        0 AS credits_added,
        sp.status,
        sp.created_at,
        'Subscription Plan' AS payment_type
      FROM subscription_payments sp
      LEFT JOIN schools s2 ON s2.id = sp.school_id
      LEFT JOIN subscription_plans spl ON spl.plan_key = sp.plan_key
      WHERE ${subWhere}
    ) combined
    ORDER BY created_at DESC
    LIMIT 10000
  `, vals)

  const header = 'Order ID,Payment ID,School,Package,Gateway,Amount (₹),Discount (₹),Coupon Code,Credits,Status,Date\n'
  const csv = rows.rows.map((r: any) => [
    r.order_id   || '',
    r.payment_id || '',
    r.school_name   || '',
    r.package_name  || '',
    r.gateway       || '',
    ((Number(r.amount_paise)   || 0) / 100).toFixed(2),
    ((Number(r.discount_paise) || 0) / 100).toFixed(2),
    r.coupon_code || '',
    r.credits_added || 0,
    r.status || '',
    r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new Response(header + csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payments_${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}

/* ─── router ──────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const action = new URL(req.url).searchParams.get('action') || 'list'
    if (action === 'analytics') return await getAnalytics(req)
    if (action === 'export')    return await exportPayments(req)
    return await listPayments(req)
  } catch (e: any) {
    console.error('[/api/admin/payments]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
