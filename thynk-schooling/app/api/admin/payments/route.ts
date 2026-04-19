export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureTables() {
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS discount_paise INTEGER NOT NULL DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE lead_package_payments ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER`).catch(() => {})
  await db.query(`
    CREATE TABLE IF NOT EXISTS featured_listing_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL, plan_key VARCHAR(80) NOT NULL,
      plan_name VARCHAR(200), gateway VARCHAR(20) NOT NULL DEFAULT 'demo',
      order_id VARCHAR(300), payment_id VARCHAR(300),
      amount_paise INTEGER NOT NULL DEFAULT 0, discount_paise INTEGER NOT NULL DEFAULT 0,
      original_amount_paise INTEGER, coupon_code VARCHAR(50),
      duration_days INTEGER NOT NULL DEFAULT 30,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      meta JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

function fmt(p: number) { return '₹' + (p/100).toLocaleString('en-IN', { minimumFractionDigits: 0 }) }

// Build a combined UNION of all 3 payment tables
function buildCombinedQuery(where: string, subWhere: string, featWhere: string, vals: any[], limit: number, offset: number, nextIdx: number) {
  return `
    SELECT * FROM (
      SELECT
        lpp.id, lpp.order_id, lpp.payment_id, lpp.gateway,
        lpp.amount_paise,
        COALESCE(lpp.discount_paise, (lpp.meta->>'discount_paise')::int, 0) AS discount_resolved,
        lpp.original_amount_paise,
        COALESCE(lpp.coupon_code, lpp.meta->>'coupon_code') AS coupon_code_resolved,
        lpp.credits_added AS credits_added, lpp.status, lpp.created_at,
        s.name AS school_name,
        COALESCE(lp.name, 'Lead Package') AS package_name,
        'lead_credit' AS payment_type
      FROM lead_package_payments lpp
      LEFT JOIN schools s ON s.id = lpp.school_id
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      WHERE ${where}
      UNION ALL
      SELECT
        sp.id, sp.order_id, sp.payment_id, sp.gateway,
        sp.amount_paise,
        COALESCE(sp.discount_paise, 0) AS discount_resolved,
        sp.original_amount_paise,
        sp.coupon_code AS coupon_code_resolved,
        0 AS credits_added, sp.status, sp.created_at,
        s2.name AS school_name,
        COALESCE(spl.name, sp.plan_key, 'Subscription') AS package_name,
        'subscription' AS payment_type
      FROM subscription_payments sp
      LEFT JOIN schools s2 ON s2.id = sp.school_id
      LEFT JOIN subscription_plans spl ON spl.plan_key = sp.plan_key
      WHERE ${subWhere}
      UNION ALL
      SELECT
        flp.id, flp.order_id, flp.payment_id, flp.gateway,
        flp.amount_paise,
        COALESCE(flp.discount_paise, 0) AS discount_resolved,
        flp.original_amount_paise,
        flp.coupon_code AS coupon_code_resolved,
        0 AS credits_added, flp.status, flp.created_at,
        s3.name AS school_name,
        COALESCE(flp.plan_name, flp.plan_key, 'Featured Listing') AS package_name,
        'featured' AS payment_type
      FROM featured_listing_payments flp
      LEFT JOIN schools s3 ON s3.id = flp.school_id
      WHERE ${featWhere}
    ) combined
    ORDER BY created_at DESC
    LIMIT $${nextIdx} OFFSET $${nextIdx + 1}
  `
}

function buildWhere(params: { status?: string|null; gateway?: string|null; search?: string|null; from?: string|null; to?: string|null }) {
  const conds: string[] = ['1=1']; const vals: any[] = []; let i = 1
  if (params.status && params.status !== 'all') { conds.push(`lpp.status = $${i++}`); vals.push(params.status) }
  if (params.gateway && params.gateway !== 'all') { conds.push(`lpp.gateway = $${i++}`); vals.push(params.gateway) }
  if (params.search) {
    const like = `%${params.search}%`
    conds.push(`(s.name ILIKE $${i} OR lpp.order_id ILIKE $${i} OR lpp.payment_id ILIKE $${i})`)
    vals.push(like); i++
  }
  if (params.from) { conds.push(`lpp.created_at >= $${i++}`); vals.push(params.from) }
  if (params.to)   { conds.push(`lpp.created_at <  $${i++}`); vals.push(params.to)   }
  return { where: conds.join(' AND '), vals, nextIdx: i }
}

function adaptWhere(where: string, tableAlias: string, schoolAlias: string) {
  return where
    .replace(/lpp\./g, `${tableAlias}.`)
    .replace(/s\.name/g, `${schoolAlias}.name`)
}

async function listPayments(req: NextRequest) {
  await ensureTables()
  const sp = new URL(req.url).searchParams
  const page   = Math.max(1, Number(sp.get('page') || 1))
  const limit  = Math.min(50, Number(sp.get('limit') || 20))
  const offset = (page - 1) * limit

  const { where, vals, nextIdx } = buildWhere({
    status: sp.get('status'), gateway: sp.get('gateway'),
    search: sp.get('search'), from: sp.get('from'), to: sp.get('to'),
  })

  const subWhere  = adaptWhere(where, 'sp', 's2')
  const featWhere = adaptWhere(where, 'flp', 's3')

  const [rows, totals] = await Promise.all([
    db.query(buildCombinedQuery(where, subWhere, featWhere, vals, limit, offset, nextIdx), [...vals, limit, offset]),
    db.query(`
      SELECT COUNT(*) AS count,
        COALESCE(SUM(amount_paise),0) AS total_amount,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS completed_amount,
        COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE THEN amount_paise END),0) AS today_amount,
        COALESCE(SUM(discount_paise),0) AS total_discount
      FROM (
        SELECT lpp.amount_paise, lpp.status, lpp.created_at,
          COALESCE(lpp.discount_paise,(lpp.meta->>'discount_paise')::int,0) AS discount_paise
        FROM lead_package_payments lpp LEFT JOIN schools s ON s.id=lpp.school_id WHERE ${where}
        UNION ALL
        SELECT sp.amount_paise, sp.status, sp.created_at, COALESCE(sp.discount_paise,0)
        FROM subscription_payments sp LEFT JOIN schools s2 ON s2.id=sp.school_id WHERE ${subWhere}
        UNION ALL
        SELECT flp.amount_paise, flp.status, flp.created_at, COALESCE(flp.discount_paise,0)
        FROM featured_listing_payments flp LEFT JOIN schools s3 ON s3.id=flp.school_id WHERE ${featWhere}
      ) all_pay
    `, vals),
  ])

  const t = totals.rows[0]
  return NextResponse.json({
    data: rows.rows.map((r: any) => ({
      id:             r.id,
      transactionId:  r.payment_id || r.order_id || r.id?.slice(0,12),
      orderId:        r.order_id,
      schoolName:     r.school_name  || '—',
      packageName:    r.package_name || '—',
      type:           r.payment_type === 'featured' ? 'Featured Listing' : r.payment_type === 'subscription' ? 'Subscription Plan' : 'Lead Purchase',
      amount:         Number(r.amount_paise) || 0,
      discount:       Number(r.discount_resolved) || 0,
      originalAmount: Number(r.original_amount_paise) || Number(r.amount_paise) || 0,
      couponCode:     r.coupon_code_resolved || null,
      creditsAdded:   Number(r.credits_added) || 0,
      gateway:        r.gateway || 'razorpay',
      status:         r.status  || 'pending',
      createdAt:      r.created_at,
    })),
    total:           Number(t.count),
    page, limit,
    totalAmount:     Number(t.total_amount),
    completedAmount: Number(t.completed_amount),
    todayAmount:     Number(t.today_amount),
    totalDiscount:   Number(t.total_discount),
  })
}

async function getAnalytics(req: NextRequest) {
  await ensureTables()
  const sp = new URL(req.url).searchParams
  const range = sp.get('range') || '30d'
  const intervalMap: Record<string, string> = { '7d':'7 days','30d':'30 days','90d':'90 days','1y':'1 year' }
  const interval = intervalMap[range] || '30 days'

  const allPaymentsCTE = `(
    SELECT gateway, status, amount_paise, created_at FROM lead_package_payments WHERE created_at >= NOW() - INTERVAL '${interval}'
    UNION ALL
    SELECT gateway, status, amount_paise, created_at FROM subscription_payments WHERE created_at >= NOW() - INTERVAL '${interval}'
    UNION ALL
    SELECT gateway, status, amount_paise, created_at FROM featured_listing_payments WHERE created_at >= NOW() - INTERVAL '${interval}'
  ) ap`

  const [pgWise, dailyTrend, weeklyTrend, monthlyTrend, statusBreakdown, topSchools, hourlyHeatmap] = await Promise.all([
    db.query(`SELECT gateway, COUNT(*) AS txn_count, COALESCE(SUM(amount_paise),0) AS total_amount,
      COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS completed_amount,
      COUNT(CASE WHEN status='completed' THEN 1 END) AS completed_count,
      COUNT(CASE WHEN status='pending' THEN 1 END) AS pending_count,
      COUNT(CASE WHEN status='failed' THEN 1 END) AS failed_count,
      ROUND(100.0*COUNT(CASE WHEN status='completed' THEN 1 END)/NULLIF(COUNT(*),0),1) AS success_rate
      FROM ${allPaymentsCTE} GROUP BY gateway ORDER BY total_amount DESC`).catch(()=>({rows:[]})),

    db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS txn_count,
      COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM ${allPaymentsCTE} GROUP BY DATE(created_at) ORDER BY day ASC`).catch(()=>({rows:[]})),

    db.query(`SELECT DATE_TRUNC('week',created_at)::date AS week_start, COUNT(*) AS txn_count,
      COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM (SELECT gateway,status,amount_paise,created_at FROM lead_package_payments WHERE created_at>=NOW()-INTERVAL '12 weeks'
      UNION ALL SELECT gateway,status,amount_paise,created_at FROM subscription_payments WHERE created_at>=NOW()-INTERVAL '12 weeks'
      UNION ALL SELECT gateway,status,amount_paise,created_at FROM featured_listing_payments WHERE created_at>=NOW()-INTERVAL '12 weeks') ap
      GROUP BY DATE_TRUNC('week',created_at) ORDER BY week_start ASC`).catch(()=>({rows:[]})),

    db.query(`SELECT TO_CHAR(DATE_TRUNC('month',created_at),'Mon YY') AS month,
      DATE_TRUNC('month',created_at) AS month_date, COUNT(*) AS txn_count,
      COALESCE(SUM(CASE WHEN status='completed' THEN amount_paise END),0) AS revenue
      FROM (SELECT gateway,status,amount_paise,created_at FROM lead_package_payments WHERE created_at>=NOW()-INTERVAL '12 months'
      UNION ALL SELECT gateway,status,amount_paise,created_at FROM subscription_payments WHERE created_at>=NOW()-INTERVAL '12 months'
      UNION ALL SELECT gateway,status,amount_paise,created_at FROM featured_listing_payments WHERE created_at>=NOW()-INTERVAL '12 months') ap
      GROUP BY DATE_TRUNC('month',created_at),TO_CHAR(DATE_TRUNC('month',created_at),'Mon YY') ORDER BY month_date ASC`).catch(()=>({rows:[]})),

    db.query(`SELECT status, COUNT(*) AS count, COALESCE(SUM(amount_paise),0) AS amount
      FROM ${allPaymentsCTE} GROUP BY status`).catch(()=>({rows:[]})),

    db.query(`SELECT school_name, COUNT(*) AS txn_count, COALESCE(SUM(amount_paise),0) AS revenue FROM (
      SELECT s.name AS school_name, lpp.amount_paise FROM lead_package_payments lpp LEFT JOIN schools s ON s.id=lpp.school_id WHERE lpp.created_at>=NOW()-INTERVAL '${interval}' AND lpp.status='completed'
      UNION ALL SELECT s2.name, sp.amount_paise FROM subscription_payments sp LEFT JOIN schools s2 ON s2.id=sp.school_id WHERE sp.created_at>=NOW()-INTERVAL '${interval}' AND sp.status='completed'
      UNION ALL SELECT s3.name, flp.amount_paise FROM featured_listing_payments flp LEFT JOIN schools s3 ON s3.id=flp.school_id WHERE flp.created_at>=NOW()-INTERVAL '${interval}' AND flp.status='completed'
      ) rs GROUP BY school_name ORDER BY revenue DESC LIMIT 8`).catch(()=>({rows:[]})),

    db.query(`SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS txn_count
      FROM ${allPaymentsCTE} WHERE status='completed' GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour`).catch(()=>({rows:[]})),
  ])

  return NextResponse.json({
    pgWise: pgWise.rows.map((r:any)=>({ gateway:r.gateway, txnCount:Number(r.txn_count), totalAmount:Number(r.total_amount), completedAmount:Number(r.completed_amount), completedCount:Number(r.completed_count), pendingCount:Number(r.pending_count), failedCount:Number(r.failed_count), successRate:Number(r.success_rate)||0 })),
    dailyTrend: dailyTrend.rows.map((r:any)=>({ day:String(r.day).slice(5), count:Number(r.txn_count), revenue:Number(r.revenue) })),
    weeklyTrend: weeklyTrend.rows.map((r:any)=>({ week:String(r.week_start).slice(5,10), count:Number(r.txn_count), revenue:Number(r.revenue) })),
    monthlyTrend: monthlyTrend.rows.map((r:any)=>({ month:r.month, count:Number(r.txn_count), revenue:Number(r.revenue) })),
    statusBreakdown: statusBreakdown.rows.map((r:any)=>({ status:r.status, count:Number(r.count), amount:Number(r.amount) })),
    couponStats: [],
    topSchools: topSchools.rows.map((r:any)=>({ name:r.school_name||'—', count:Number(r.txn_count), revenue:Number(r.revenue) })),
    hourlyHeatmap: (() => { const map:Record<number,number>={}; hourlyHeatmap.rows.forEach((r:any)=>{ map[Number(r.hour)]=Number(r.txn_count) }); return Array.from({length:24},(_,h)=>({hour:h,count:map[h]||0})) })(),
  })
}

async function exportPayments(req: NextRequest) {
  await ensureTables()
  const sp = new URL(req.url).searchParams
  const { where, vals } = buildWhere({ status:sp.get('status'), gateway:sp.get('gateway'), search:sp.get('search'), from:sp.get('from'), to:sp.get('to') })
  const subWhere  = adaptWhere(where, 'sp', 's2')
  const featWhere = adaptWhere(where, 'flp', 's3')

  const rows = await db.query(`
    SELECT * FROM (
      SELECT lpp.order_id, lpp.payment_id, s.name AS school_name, COALESCE(lp.name,'Lead Package') AS package_name, lpp.gateway, lpp.amount_paise, COALESCE(lpp.discount_paise,(lpp.meta->>'discount_paise')::int,0) AS discount_paise, COALESCE(lpp.coupon_code,lpp.meta->>'coupon_code') AS coupon_code, lpp.credits_added, lpp.status, lpp.created_at, 'Lead Credit' AS payment_type
      FROM lead_package_payments lpp LEFT JOIN schools s ON s.id=lpp.school_id LEFT JOIN lead_packages lp ON lp.id=lpp.package_id WHERE ${where}
      UNION ALL
      SELECT sp.order_id, sp.payment_id, s2.name, COALESCE(spl.name,sp.plan_key,'Subscription'), sp.gateway, sp.amount_paise, COALESCE(sp.discount_paise,0), sp.coupon_code, 0, sp.status, sp.created_at, 'Subscription Plan'
      FROM subscription_payments sp LEFT JOIN schools s2 ON s2.id=sp.school_id LEFT JOIN subscription_plans spl ON spl.plan_key=sp.plan_key WHERE ${subWhere}
      UNION ALL
      SELECT flp.order_id, flp.payment_id, s3.name, COALESCE(flp.plan_name,flp.plan_key,'Featured Listing'), flp.gateway, flp.amount_paise, COALESCE(flp.discount_paise,0), flp.coupon_code, 0, flp.status, flp.created_at, 'Featured Listing'
      FROM featured_listing_payments flp LEFT JOIN schools s3 ON s3.id=flp.school_id WHERE ${featWhere}
    ) combined ORDER BY created_at DESC LIMIT 10000
  `, vals)

  const header = 'Order ID,Payment ID,School,Package,Type,Gateway,Amount (₹),Discount (₹),Coupon,Credits,Status,Date\n'
  const csv = rows.rows.map((r:any) => [
    r.order_id||'', r.payment_id||'', r.school_name||'', r.package_name||'', r.payment_type||'',
    r.gateway||'', ((Number(r.amount_paise)||0)/100).toFixed(2), ((Number(r.discount_paise)||0)/100).toFixed(2),
    r.coupon_code||'', r.credits_added||0, r.status||'',
    r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '',
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')

  return new Response(header + csv, {
    headers: { 'Content-Type':'text/csv', 'Content-Disposition':`attachment; filename="payments_${new Date().toISOString().slice(0,10)}.csv"` },
  })
}

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
