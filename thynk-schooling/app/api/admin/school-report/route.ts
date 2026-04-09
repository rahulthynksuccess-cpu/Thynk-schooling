export const dynamic = 'force-dynamic'
/**
 * GET /api/admin/school-report
 *
 * ?action=filters            — cascading dropdown data (states → cities → schools)
 * ?action=report             — full report for given filters
 *   &state=X &city=Y &schoolId=Z (all optional; omit = "All")
 *   &from=YYYY-MM-DD &to=YYYY-MM-DD
 *   &section=leads|applications|reviews|revenue  (optional; omit = all 4)
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// ─── helpers ──────────────────────────────────────────────────────────────────

function dateWhere(
  alias: string,
  from: string | null,
  to: string | null,
  params: any[],
  idx: number
): { clause: string; idx: number } {
  let clause = ''
  if (from) { params.push(from);         clause += ` AND ${alias}.created_at >= $${idx++}` }
  if (to)   { params.push(to + ' 23:59:59'); clause += ` AND ${alias}.created_at <= $${idx++}` }
  return { clause, idx }
}

// ─── filters endpoint ─────────────────────────────────────────────────────────

async function getFilters(req: NextRequest) {
  const sp    = new URL(req.url).searchParams
  const state = sp.get('state') || ''
  const city  = sp.get('city')  || ''

  const [stateRows, cityRows, schoolRows] = await Promise.all([
    db.query(`
      SELECT DISTINCT state
      FROM schools
      WHERE state IS NOT NULL AND state <> ''
      ORDER BY state ASC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT DISTINCT city
      FROM schools
      WHERE city IS NOT NULL AND city <> ''
        ${state ? `AND LOWER(state) = LOWER($1)` : ''}
      ORDER BY city ASC
    `, state ? [state] : []).catch(() => ({ rows: [] })),

    db.query(`
      SELECT id, name, city, state
      FROM schools
      WHERE 1=1
        ${state ? `AND LOWER(state) = LOWER($1)` : ''}
        ${city  ? `AND LOWER(city) = LOWER($${state ? 2 : 1})` : ''}
      ORDER BY name ASC
    `, [state, city].filter(Boolean)).catch(() => ({ rows: [] })),
  ])

  return NextResponse.json({
    states:  stateRows.rows.map((r: any) => r.state),
    cities:  cityRows.rows.map((r: any) => r.city),
    schools: schoolRows.rows.map((r: any) => ({ id: r.id, name: r.name, city: r.city, state: r.state })),
  })
}

// ─── leads section ────────────────────────────────────────────────────────────

async function getLeadsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSchools  = schoolIds.length > 0
  const schoolParam = hasSchools ? schoolIds : null
  const ph          = schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',')

  const params: any[] = [...schoolIds]
  let idx = schoolIds.length + 1

  const { clause: dClause, idx: idx2 } = dateWhere('l', from, to, params, idx)
  idx = idx2

  const schoolFilter = hasSchools ? `AND l.school_id IN (${ph})` : ''

  // Total leads shown on school dashboard (all leads linked to these schools)
  const [totalsRow, purchasedRow, creditRows,
         gradeRows, genderRows, incomeRows, pincodeRows,
         sourceRows, detailRows] = await Promise.all([

    db.query(`
      SELECT COUNT(*) AS total
      FROM leads l
      WHERE 1=1 ${schoolFilter} ${dClause}
    `, params).catch(() => ({ rows: [{ total: 0 }] })),

    db.query(`
      SELECT COUNT(*) AS purchased
      FROM leads l
      WHERE l.is_purchased = true ${schoolFilter} ${dClause}
    `, params).catch(() => ({ rows: [{ purchased: 0 }] })),

    hasSchools
      ? db.query(`
          SELECT
            lc.school_id,
            COALESCE(lc.credits, 0) AS credits,
            COALESCE(lc.used_credits, 0) AS used_credits,
            COALESCE(lc.total_credits, 0) AS total_credits
          FROM lead_credits lc
          WHERE lc.school_id IN (${ph})
        `, schoolIds).catch(() => ({ rows: [] }))
      : db.query(`
          SELECT
            SUM(COALESCE(lc.credits, 0)) AS credits,
            SUM(COALESCE(lc.used_credits, 0)) AS used_credits,
            SUM(COALESCE(lc.total_credits, 0)) AS total_credits
          FROM lead_credits lc
        `).catch(() => ({ rows: [] })),

    // Grade/class breakdown
    db.query(`
      SELECT
        CASE
          WHEN LOWER(l.class_applying_for) IN ('nursery','lkg','ukg','pre-k','kg','pre primary','nursery-kg')
            THEN 'Nursery–KG'
          WHEN l.class_applying_for ~ '^[1-5]$' OR LOWER(l.class_applying_for) IN ('grade 1','grade 2','grade 3','grade 4','grade 5','class 1','class 2','class 3','class 4','class 5')
            THEN 'Grade 1–5'
          WHEN l.class_applying_for ~ '^([6-9]|10)$' OR LOWER(l.class_applying_for) SIMILAR TO '(grade|class) [6-9]|grade 10|class 10'
            THEN 'Grade 6–10'
          WHEN l.class_applying_for ~ '^(11|12)$' OR LOWER(l.class_applying_for) SIMILAR TO '(grade|class) 1[12]'
            THEN 'Grade 11–12'
          ELSE 'Other / Not specified'
        END AS grade_group,
        COUNT(*) AS cnt
      FROM leads l
      WHERE l.class_applying_for IS NOT NULL ${schoolFilter} ${dClause}
      GROUP BY grade_group
      ORDER BY cnt DESC
    `, params).catch(() => ({ rows: [] })),

    // Gender breakdown (from students table joined via parent_id)
    db.query(`
      SELECT
        COALESCE(NULLIF(TRIM(st.gender), ''), 'Not specified') AS gender,
        COUNT(DISTINCT l.id) AS cnt
      FROM leads l
      LEFT JOIN students st ON st.parent_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY gender
      ORDER BY cnt DESC
    `, params).catch(() => ({ rows: [] })),

    // Income breakdown (from parent_profiles)
    db.query(`
      SELECT
        COALESCE(NULLIF(TRIM(pp.income_range), ''), 'Not specified') AS income_range,
        COUNT(DISTINCT l.id) AS cnt
      FROM leads l
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY income_range
      ORDER BY cnt DESC
    `, params).catch(() => ({ rows: [] })),

    // Pincode breakdown (from parent_profiles or lead city)
    db.query(`
      SELECT
        COALESCE(NULLIF(TRIM(pp.pincode), ''), NULLIF(TRIM(l.city), ''), 'Unknown') AS pincode,
        COUNT(*) AS cnt
      FROM leads l
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY pincode
      ORDER BY cnt DESC
      LIMIT 20
    `, params).catch(() => ({ rows: [] })),

    // Source breakdown
    db.query(`
      SELECT
        COALESCE(NULLIF(TRIM(l.source), ''), 'direct') AS source,
        COUNT(*) AS cnt
      FROM leads l
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY source
      ORDER BY cnt DESC
    `, params).catch(() => ({ rows: [] })),

    // Detail rows (all leads, full info for admin)
    db.query(`
      SELECT
        l.id,
        l.created_at,
        l.status,
        l.is_purchased,
        l.class_applying_for,
        l.city           AS lead_city,
        l.source,
        l.message,
        COALESCE(u.full_name, u.name, l.parent_name)  AS parent_name,
        COALESCE(u.phone, u.mobile, l.phone)           AS parent_phone,
        u.email                                        AS parent_email,
        st.gender,
        pp.income_range,
        pp.pincode                                     AS parent_pincode,
        pp.city                                        AS parent_city,
        s.name                                         AS school_name,
        s.city                                         AS school_city,
        s.state                                        AS school_state
      FROM leads l
      LEFT JOIN users            u  ON u.id  = l.parent_id
      LEFT JOIN parent_profiles  pp ON pp.user_id = l.parent_id
      LEFT JOIN students         st ON st.parent_id = l.parent_id
      LEFT JOIN schools          s  ON s.id  = l.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY l.created_at DESC
      LIMIT 1000
    `, params).catch(() => ({ rows: [] })),
  ])

  const totalLeads     = Number(totalsRow.rows[0]?.total    || 0)
  const purchasedLeads = Number(purchasedRow.rows[0]?.purchased || 0)

  let creditsRemaining = 0
  let creditsUsed      = 0
  let creditsTotal     = 0
  if (hasSchools) {
    creditRows.rows.forEach((r: any) => {
      creditsRemaining += Number(r.credits     || 0)
      creditsUsed      += Number(r.used_credits || 0)
      creditsTotal     += Number(r.total_credits || 0)
    })
  } else {
    creditsRemaining = Number(creditRows.rows[0]?.credits      || 0)
    creditsUsed      = Number(creditRows.rows[0]?.used_credits  || 0)
    creditsTotal     = Number(creditRows.rows[0]?.total_credits || 0)
  }

  return {
    kpis: {
      totalLeads,
      purchasedLeads,
      creditsRemaining,
      creditsUsed,
      creditsTotal,
      purchaseRate: totalLeads > 0 ? Math.round((purchasedLeads / totalLeads) * 100) : 0,
    },
    drilldown: {
      byGrade:   gradeRows.rows.map((r: any) => ({ label: r.grade_group, count: Number(r.cnt) })),
      byGender:  genderRows.rows.map((r: any) => ({ label: r.gender, count: Number(r.cnt) })),
      byIncome:  incomeRows.rows.map((r: any) => ({ label: r.income_range, count: Number(r.cnt) })),
      byPincode: pincodeRows.rows.map((r: any) => ({ label: r.pincode, count: Number(r.cnt) })),
      bySource:  sourceRows.rows.map((r: any) => ({ label: r.source, count: Number(r.cnt) })),
    },
    details: detailRows.rows.map((r: any) => ({
      id:           r.id,
      parentName:   r.parent_name  || '—',
      parentPhone:  r.parent_phone || '—',
      parentEmail:  r.parent_email || '—',
      gender:       r.gender       || '—',
      incomeRange:  r.income_range || '—',
      parentPincode:r.parent_pincode || '—',
      classApplying:r.class_applying_for || '—',
      source:       r.source       || 'direct',
      isPurchased:  r.is_purchased || false,
      status:       r.status       || 'new',
      schoolName:   r.school_name  || '—',
      schoolCity:   r.school_city  || '—',
      schoolState:  r.school_state || '—',
      createdAt:    r.created_at,
    })),
  }
}

// ─── applications section ─────────────────────────────────────────────────────

async function getApplicationsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSchools  = schoolIds.length > 0
  const ph          = schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',')
  const params: any[] = [...schoolIds]
  let idx = schoolIds.length + 1
  const { clause: dClause, idx: idx2 } = dateWhere('a', from, to, params, idx)
  idx = idx2
  const schoolFilter = hasSchools ? `AND a.school_id IN (${ph})` : ''

  const [statusRows, detailRows] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(a.status, 'pending') AS status,
        COUNT(*) AS cnt
      FROM applications a
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY a.status
      ORDER BY cnt DESC
    `, params).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        a.id,
        a.status,
        a.created_at,
        COALESCE(u.full_name, u.name)   AS parent_name,
        COALESCE(u.phone, u.mobile)     AS parent_phone,
        s.name                          AS school_name,
        s.city                          AS school_city,
        s.state                         AS school_state,
        st.applying_for_class           AS grade
      FROM applications a
      LEFT JOIN users     u  ON u.id  = a.parent_id
      LEFT JOIN schools   s  ON s.id  = a.school_id
      LEFT JOIN students  st ON st.parent_id = a.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY a.created_at DESC
      LIMIT 1000
    `, params).catch(() => ({ rows: [] })),
  ])

  const statusMap: Record<string, number> = {}
  statusRows.rows.forEach((r: any) => { statusMap[r.status] = Number(r.cnt) })

  return {
    kpis: {
      total:       statusRows.rows.reduce((s: number, r: any) => s + Number(r.cnt), 0),
      pending:     statusMap['pending']     || 0,
      shortlisted: statusMap['shortlisted'] || 0,
      admitted:    statusMap['admitted']    || 0,
      rejected:    statusMap['rejected']    || 0,
    },
    byStatus: statusRows.rows.map((r: any) => ({ label: r.status, count: Number(r.cnt) })),
    details: detailRows.rows.map((r: any) => ({
      id:         r.id,
      parentName: r.parent_name  || '—',
      parentPhone:r.parent_phone || '—',
      schoolName: r.school_name  || '—',
      schoolCity: r.school_city  || '—',
      schoolState:r.school_state || '—',
      grade:      r.grade        || '—',
      status:     r.status       || 'pending',
      createdAt:  r.created_at,
    })),
  }
}

// ─── reviews section ──────────────────────────────────────────────────────────

async function getReviewsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSchools  = schoolIds.length > 0
  const ph          = schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',')
  const params: any[] = [...schoolIds]
  let idx = schoolIds.length + 1
  const { clause: dClause, idx: idx2 } = dateWhere('r', from, to, params, idx)
  idx = idx2
  const schoolFilter = hasSchools ? `AND r.school_id IN (${ph})` : ''

  const [statsRow, ratingRows, detailRows] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                                        AS total,
        ROUND(AVG(r.rating)::numeric, 1)                               AS avg_rating,
        COUNT(CASE WHEN r.is_approved = true  THEN 1 END)              AS approved,
        COUNT(CASE WHEN r.is_approved = false OR r.is_approved IS NULL THEN 1 END) AS pending
      FROM reviews r
      WHERE 1=1 ${schoolFilter} ${dClause}
    `, params).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT r.rating, COUNT(*) AS cnt
      FROM reviews r
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY r.rating
      ORDER BY r.rating DESC
    `, params).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        r.id,
        r.rating,
        r.content,
        r.is_approved,
        r.created_at,
        COALESCE(u.full_name, u.name) AS reviewer_name,
        COALESCE(u.phone, u.mobile)   AS reviewer_phone,
        s.name                        AS school_name,
        s.city                        AS school_city,
        s.state                       AS school_state
      FROM reviews r
      LEFT JOIN users    u ON u.id  = r.user_id
      LEFT JOIN schools  s ON s.id  = r.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY r.created_at DESC
      LIMIT 1000
    `, params).catch(() => ({ rows: [] })),
  ])

  const stats = statsRow.rows[0] || {}
  return {
    kpis: {
      total:     Number(stats.total     || 0),
      avgRating: Number(stats.avg_rating || 0),
      approved:  Number(stats.approved  || 0),
      pending:   Number(stats.pending   || 0),
    },
    byRating: ratingRows.rows.map((r: any) => ({ label: `${r.rating} star`, count: Number(r.cnt) })),
    details: detailRows.rows.map((r: any) => ({
      id:           r.id,
      rating:       Number(r.rating   || 0),
      content:      r.content         || '',
      isApproved:   r.is_approved     || false,
      reviewerName: r.reviewer_name   || '—',
      reviewerPhone:r.reviewer_phone  || '—',
      schoolName:   r.school_name     || '—',
      schoolCity:   r.school_city     || '—',
      schoolState:  r.school_state    || '—',
      createdAt:    r.created_at,
    })),
  }
}

// ─── revenue section ──────────────────────────────────────────────────────────

async function getRevenueSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSchools  = schoolIds.length > 0
  const ph          = schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',')
  const params: any[] = [...schoolIds]
  let idx = schoolIds.length + 1
  const { clause: dClause, idx: idx2 } = dateWhere('lpp', from, to, params, idx)
  idx = idx2
  const schoolFilter = hasSchools ? `AND lpp.school_id IN (${ph})` : ''

  const [totalsRow, byPackageRows, bySchoolRows, detailRows] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(SUM(lpp.amount_paise), 0)                                               AS total_paise,
        COALESCE(SUM(CASE WHEN lpp.status = 'completed' THEN lpp.amount_paise END), 0)  AS completed_paise,
        COALESCE(SUM(COALESCE(lpp.discount_paise, (lpp.meta->>'discount_paise')::int, 0)), 0) AS discount_paise,
        COUNT(*)                                                                          AS txn_count,
        COUNT(CASE WHEN lpp.status = 'completed' THEN 1 END)                            AS completed_count,
        SUM(lpp.credits_added)                                                           AS total_credits_sold
      FROM lead_package_payments lpp
      WHERE 1=1 ${schoolFilter} ${dClause}
    `, params).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT
        lp.name                                                                AS package_name,
        COUNT(lpp.id)                                                          AS txn_count,
        COALESCE(SUM(CASE WHEN lpp.status='completed' THEN lpp.amount_paise END), 0) AS revenue_paise,
        SUM(lpp.credits_added)                                                 AS credits_sold
      FROM lead_package_payments lpp
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY lp.name
      ORDER BY revenue_paise DESC
    `, params).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        s.name                                                                 AS school_name,
        s.city                                                                 AS school_city,
        s.state                                                                AS school_state,
        COUNT(lpp.id)                                                          AS txn_count,
        COALESCE(SUM(CASE WHEN lpp.status='completed' THEN lpp.amount_paise END), 0) AS revenue_paise,
        SUM(lpp.credits_added)                                                 AS credits_sold
      FROM lead_package_payments lpp
      LEFT JOIN schools s ON s.id = lpp.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY s.name, s.city, s.state
      ORDER BY revenue_paise DESC
      LIMIT 50
    `, params).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        lpp.id,
        lpp.order_id,
        lpp.payment_id,
        lpp.gateway,
        lpp.amount_paise,
        lpp.credits_added,
        COALESCE(lpp.discount_paise, (lpp.meta->>'discount_paise')::int, 0)   AS discount_paise,
        COALESCE(lpp.coupon_code, lpp.meta->>'coupon_code')                    AS coupon_code,
        lpp.status,
        lpp.created_at,
        lp.name   AS package_name,
        s.name    AS school_name,
        s.city    AS school_city,
        s.state   AS school_state
      FROM lead_package_payments lpp
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      LEFT JOIN schools       s  ON s.id  = lpp.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY lpp.created_at DESC
      LIMIT 1000
    `, params).catch(() => ({ rows: [] })),
  ])

  const t = totalsRow.rows[0] || {}
  return {
    kpis: {
      totalRevenuePaise:     Number(t.total_paise     || 0),
      completedRevenuePaise: Number(t.completed_paise || 0),
      discountPaise:         Number(t.discount_paise  || 0),
      txnCount:              Number(t.txn_count       || 0),
      completedCount:        Number(t.completed_count || 0),
      totalCreditsSold:      Number(t.total_credits_sold || 0),
    },
    byPackage: byPackageRows.rows.map((r: any) => ({
      packageName:  r.package_name  || 'Unknown Package',
      txnCount:     Number(r.txn_count     || 0),
      revenuePaise: Number(r.revenue_paise || 0),
      creditsSold:  Number(r.credits_sold  || 0),
    })),
    bySchool: bySchoolRows.rows.map((r: any) => ({
      schoolName:   r.school_name   || '—',
      schoolCity:   r.school_city   || '—',
      schoolState:  r.school_state  || '—',
      txnCount:     Number(r.txn_count     || 0),
      revenuePaise: Number(r.revenue_paise || 0),
      creditsSold:  Number(r.credits_sold  || 0),
    })),
    details: detailRows.rows.map((r: any) => ({
      id:           r.id,
      orderId:      r.order_id     || '—',
      paymentId:    r.payment_id   || '—',
      gateway:      r.gateway      || '—',
      amountPaise:  Number(r.amount_paise   || 0),
      discountPaise:Number(r.discount_paise || 0),
      creditsAdded: Number(r.credits_added  || 0),
      couponCode:   r.coupon_code  || null,
      status:       r.status       || 'pending',
      packageName:  r.package_name || '—',
      schoolName:   r.school_name  || '—',
      schoolCity:   r.school_city  || '—',
      schoolState:  r.school_state || '—',
      createdAt:    r.created_at,
    })),
  }
}

// ─── main report ─────────────────────────────────────────────────────────────

async function getReport(req: NextRequest) {
  const sp       = new URL(req.url).searchParams
  const state    = sp.get('state')    || ''
  const city     = sp.get('city')     || ''
  const schoolId = sp.get('schoolId') || ''
  const from     = sp.get('from')     || ''
  const to       = sp.get('to')       || ''
  const section  = sp.get('section')  || 'all'

  // Resolve school IDs based on filters
  let schoolIds: string[] = []

  if (schoolId) {
    schoolIds = [schoolId]
  } else if (state || city) {
    const whereParts: string[] = []
    const params: any[]        = []
    if (state) { params.push(state); whereParts.push(`LOWER(state) = LOWER($${params.length})`) }
    if (city)  { params.push(city);  whereParts.push(`LOWER(city)  = LOWER($${params.length})`) }
    const rows = await db.query(
      `SELECT id FROM schools WHERE ${whereParts.join(' AND ')}`, params
    ).catch(() => ({ rows: [] }))
    schoolIds = rows.rows.map((r: any) => r.id)
  }
  // If schoolIds is empty and no filter → "All" (no filter applied to queries)

  const fromVal = from || null
  const toVal   = to   || null

  const result: Record<string, any> = {
    filters: { state, city, schoolId, from, to },
    generatedAt: new Date().toISOString(),
  }

  const all = section === 'all'

  const [leadsData, appsData, reviewsData, revenueData] = await Promise.all([
    (all || section === 'leads')        ? getLeadsSection(schoolIds, fromVal, toVal)        : Promise.resolve(null),
    (all || section === 'applications') ? getApplicationsSection(schoolIds, fromVal, toVal) : Promise.resolve(null),
    (all || section === 'reviews')      ? getReviewsSection(schoolIds, fromVal, toVal)      : Promise.resolve(null),
    (all || section === 'revenue')      ? getRevenueSection(schoolIds, fromVal, toVal)      : Promise.resolve(null),
  ])

  if (leadsData)   result.leads        = leadsData
  if (appsData)    result.applications = appsData
  if (reviewsData) result.reviews      = reviewsData
  if (revenueData) result.revenue      = revenueData

  return NextResponse.json(result)
}

// ─── router ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const action = new URL(req.url).searchParams.get('action') || 'report'
    if (action === 'filters') return await getFilters(req)
    return await getReport(req)
  } catch (e: any) {
    console.error('[school-report]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
