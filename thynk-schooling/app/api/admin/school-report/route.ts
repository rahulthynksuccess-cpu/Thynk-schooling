export const dynamic = 'force-dynamic'
/**
 * GET /api/admin/school-report
 *
 * ?action=filters
 *   Returns all states, cities, schools (no cascading — full list always)
 *
 * ?action=report
 *   &states=Gujarat,Maharashtra      (comma-separated, empty = all)
 *   &cities=Ahmedabad,Surat          (comma-separated, empty = all)
 *   &schoolIds=uuid1,uuid2           (comma-separated, empty = all)
 *   &from=YYYY-MM-DD &to=YYYY-MM-DD  (optional date range)
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseCsv(s: string | null): string[] {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean)
}

/** Build a WHERE fragment + append params for a multi-value IN clause.
 *  Returns empty string when values is empty (= "no filter"). */
function inClause(
  col: string,
  values: string[],
  params: any[],
  startIdx: number
): { clause: string; nextIdx: number } {
  if (values.length === 0) return { clause: '', nextIdx: startIdx }
  const placeholders = values.map((_, i) => `$${startIdx + i}`).join(', ')
  params.push(...values)
  return {
    clause: ` AND ${col} IN (${placeholders})`,
    nextIdx: startIdx + values.length,
  }
}

function dateClause(
  alias: string,
  from: string | null,
  to: string | null,
  params: any[],
  startIdx: number
): { clause: string; nextIdx: number } {
  let clause = ''
  let idx = startIdx
  if (from) { params.push(from);               clause += ` AND ${alias}.created_at >= $${idx++}` }
  if (to)   { params.push(to + ' 23:59:59');   clause += ` AND ${alias}.created_at <= $${idx++}` }
  return { clause, nextIdx: idx }
}

// ─── filters endpoint ─────────────────────────────────────────────────────────
// Always returns the COMPLETE lists — front-end handles display filtering

async function getFilters() {
  const [stateRows, cityRows, schoolRows] = await Promise.all([
    db.query(`
      SELECT DISTINCT TRIM(state) AS state
      FROM schools
      WHERE state IS NOT NULL AND TRIM(state) <> ''
      ORDER BY state ASC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT DISTINCT TRIM(city) AS city
      FROM schools
      WHERE city IS NOT NULL AND TRIM(city) <> ''
      ORDER BY city ASC
    `).catch(() => ({ rows: [] })),

    db.query(`
      SELECT id, name, TRIM(city) AS city, TRIM(state) AS state
      FROM schools
      WHERE name IS NOT NULL AND TRIM(name) <> ''
      ORDER BY name ASC
    `).catch(() => ({ rows: [] })),
  ])

  return NextResponse.json({
    states:  stateRows.rows.map((r: any) => r.state),
    cities:  cityRows.rows.map((r: any) => r.city),
    schools: schoolRows.rows.map((r: any) => ({
      id: r.id, name: r.name,
      city: r.city || '', state: r.state || '',
    })),
  })
}

// ─── resolve school IDs from filter params ────────────────────────────────────

async function resolveSchoolIds(
  schoolIds: string[],
  states: string[],
  cities: string[]
): Promise<string[]> {
  // If specific school IDs given, use them directly
  if (schoolIds.length > 0) return schoolIds

  // If no filters at all → empty array means "all schools" in query helpers
  if (states.length === 0 && cities.length === 0) return []

  const params: any[] = []
  let idx = 1
  let where = '1=1'

  if (states.length > 0) {
    const ph = states.map(() => `$${idx++}`).join(', ')
    params.push(...states)
    where += ` AND LOWER(TRIM(state)) IN (${states.map(s => `LOWER('${s.replace(/'/g,"''")}')`)}) `
    // Use proper parameterised version:
    const ph2 = states.map((_, i) => `$${i + 1}`).join(', ')
    params.length = 0; idx = 1
    states.forEach(s => params.push(s))
    where = `LOWER(TRIM(state)) IN (${ph2})`
    if (cities.length > 0) {
      const cityPh = cities.map((_, i) => `$${states.length + i + 1}`).join(', ')
      params.push(...cities)
      where += ` AND LOWER(TRIM(city)) IN (${cityPh})`
    }
  } else if (cities.length > 0) {
    const ph = cities.map((_, i) => `$${i + 1}`).join(', ')
    params.push(...cities)
    where = `LOWER(TRIM(city)) IN (${ph})`
  }

  const rows = await db.query(
    `SELECT id FROM schools WHERE ${where}`, params
  ).catch(() => ({ rows: [] }))
  return rows.rows.map((r: any) => r.id)
}

// ─── leads section ────────────────────────────────────────────────────────────

async function getLeadsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSch = schoolIds.length > 0
  const baseParams: any[] = [...schoolIds]
  let baseIdx = schoolIds.length + 1

  const schoolPH = hasSch ? schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',') : ''
  const schoolFilter = hasSch ? `AND l.school_id IN (${schoolPH})` : ''

  const { clause: dClause, nextIdx: idx2 } = dateClause('l', from, to, baseParams, baseIdx)

  const p = baseParams   // shared param array — each query builds its own copy

  const makeP = () => [...baseParams]

  const [totals, purchased, credits,
         gradeRows, genderRows, incomeRows, pincodeRows, sourceRows,
         details] = await Promise.all([

    db.query(`SELECT COUNT(*) AS total FROM leads l WHERE 1=1 ${schoolFilter} ${dClause}`, makeP())
      .catch(() => ({ rows: [{ total: 0 }] })),

    db.query(`SELECT COUNT(*) AS purchased FROM leads l WHERE l.is_purchased = true ${schoolFilter} ${dClause}`, makeP())
      .catch(() => ({ rows: [{ purchased: 0 }] })),

    hasSch
      ? db.query(
          `SELECT COALESCE(SUM(credits),0) AS credits,
                  COALESCE(SUM(used_credits),0) AS used,
                  COALESCE(SUM(total_credits),0) AS total
           FROM lead_credits WHERE school_id IN (${schoolPH})`,
          schoolIds
        ).catch(() => ({ rows: [{ credits: 0, used: 0, total: 0 }] }))
      : db.query(
          `SELECT COALESCE(SUM(credits),0) AS credits,
                  COALESCE(SUM(used_credits),0) AS used,
                  COALESCE(SUM(total_credits),0) AS total
           FROM lead_credits`
        ).catch(() => ({ rows: [{ credits: 0, used: 0, total: 0 }] })),

    // Grade
    db.query(`
      SELECT
        CASE
          WHEN LOWER(l.class_applying_for) = ANY(ARRAY['nursery','lkg','ukg','pre-k','kg','pre primary'])
            THEN 'Nursery–KG'
          WHEN l.class_applying_for ~ '^[1-5]$'
            THEN 'Grade 1–5'
          WHEN l.class_applying_for ~ '^([6-9]|10)$'
            THEN 'Grade 6–10'
          WHEN l.class_applying_for ~ '^(11|12)$'
            THEN 'Grade 11–12'
          ELSE 'Other'
        END AS grade_group,
        COUNT(*) AS cnt
      FROM leads l
      WHERE l.class_applying_for IS NOT NULL ${schoolFilter} ${dClause}
      GROUP BY grade_group ORDER BY cnt DESC
    `, makeP()).catch(() => ({ rows: [] })),

    // Gender
    db.query(`
      SELECT COALESCE(NULLIF(TRIM(st.gender),''),'Not specified') AS gender,
             COUNT(DISTINCT l.id) AS cnt
      FROM leads l
      LEFT JOIN students st ON st.parent_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY gender ORDER BY cnt DESC
    `, makeP()).catch(() => ({ rows: [] })),

    // Income
    db.query(`
      SELECT COALESCE(NULLIF(TRIM(pp.income_range),''),'Not specified') AS income_range,
             COUNT(DISTINCT l.id) AS cnt
      FROM leads l
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY income_range ORDER BY cnt DESC
    `, makeP()).catch(() => ({ rows: [] })),

    // Pincode
    db.query(`
      SELECT COALESCE(NULLIF(TRIM(pp.pincode),''), NULLIF(TRIM(l.city),''), 'Unknown') AS pincode,
             COUNT(*) AS cnt
      FROM leads l
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY pincode ORDER BY cnt DESC LIMIT 20
    `, makeP()).catch(() => ({ rows: [] })),

    // Source
    db.query(`
      SELECT COALESCE(NULLIF(TRIM(l.source),''),'direct') AS source,
             COUNT(*) AS cnt
      FROM leads l
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY source ORDER BY cnt DESC
    `, makeP()).catch(() => ({ rows: [] })),

    // Detail rows — full info, admin sees everything unmasked
    db.query(`
      SELECT
        l.id, l.created_at, l.status, l.is_purchased,
        l.class_applying_for, l.city AS lead_city, l.source,
        COALESCE(u.full_name, u.name, l.parent_name) AS parent_name,
        COALESCE(u.phone, u.mobile, l.phone)         AS parent_phone,
        u.email                                       AS parent_email,
        st.gender,
        pp.income_range,
        pp.pincode                                    AS parent_pincode,
        s.name  AS school_name,
        s.city  AS school_city,
        s.state AS school_state
      FROM leads l
      LEFT JOIN users           u  ON u.id  = l.parent_id
      LEFT JOIN parent_profiles pp ON pp.user_id = l.parent_id
      LEFT JOIN students        st ON st.parent_id = l.parent_id
      LEFT JOIN schools         s  ON s.id  = l.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY l.created_at DESC
      LIMIT 2000
    `, makeP()).catch(() => ({ rows: [] })),
  ])

  const cr = credits.rows[0] || {}
  const totalLeads     = Number(totals.rows[0]?.total     || 0)
  const purchasedLeads = Number(purchased.rows[0]?.purchased || 0)

  return {
    kpis: {
      totalLeads,
      purchasedLeads,
      creditsRemaining: Number(cr.credits || 0),
      creditsUsed:      Number(cr.used    || 0),
      creditsTotal:     Number(cr.total   || 0),
      purchaseRate: totalLeads > 0
        ? Math.round((purchasedLeads / totalLeads) * 100) : 0,
    },
    drilldown: {
      byGrade:   gradeRows.rows.map((r: any)  => ({ label: r.grade_group,   count: Number(r.cnt) })),
      byGender:  genderRows.rows.map((r: any) => ({ label: r.gender,        count: Number(r.cnt) })),
      byIncome:  incomeRows.rows.map((r: any) => ({ label: r.income_range,  count: Number(r.cnt) })),
      byPincode: pincodeRows.rows.map((r: any)=> ({ label: r.pincode,       count: Number(r.cnt) })),
      bySource:  sourceRows.rows.map((r: any) => ({ label: r.source,        count: Number(r.cnt) })),
    },
    details: details.rows.map((r: any) => ({
      id:            r.id,
      parentName:    r.parent_name    || '—',
      parentPhone:   r.parent_phone   || '—',
      parentEmail:   r.parent_email   || '—',
      gender:        r.gender         || '—',
      incomeRange:   r.income_range   || '—',
      parentPincode: r.parent_pincode || '—',
      classApplying: r.class_applying_for || '—',
      source:        r.source         || 'direct',
      isPurchased:   r.is_purchased   || false,
      status:        r.status         || 'new',
      schoolName:    r.school_name    || '—',
      schoolCity:    r.school_city    || '—',
      schoolState:   r.school_state   || '—',
      createdAt:     r.created_at,
    })),
  }
}

// ─── applications section ─────────────────────────────────────────────────────

async function getApplicationsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSch = schoolIds.length > 0
  const schoolPH = hasSch ? schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',') : ''
  const schoolFilter = hasSch ? `AND a.school_id IN (${schoolPH})` : ''
  const makeP = () => {
    const p = [...schoolIds]
    dateClause('a', from, to, p, schoolIds.length + 1)
    return p
  }
  const baseP: any[] = [...schoolIds]
  const { clause: dClause } = dateClause('a', from, to, baseP, schoolIds.length + 1)

  const [statusRows, details] = await Promise.all([
    db.query(`
      SELECT COALESCE(a.status,'pending') AS status, COUNT(*) AS cnt
      FROM applications a
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY a.status ORDER BY cnt DESC
    `, [...baseP]).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        a.id, a.status, a.created_at,
        COALESCE(u.full_name, u.name) AS parent_name,
        COALESCE(u.phone, u.mobile)   AS parent_phone,
        s.name  AS school_name,
        s.city  AS school_city,
        s.state AS school_state,
        st.applying_for_class         AS grade
      FROM applications a
      LEFT JOIN users    u  ON u.id  = a.parent_id
      LEFT JOIN schools  s  ON s.id  = a.school_id
      LEFT JOIN students st ON st.parent_id = a.parent_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY a.created_at DESC LIMIT 2000
    `, [...baseP]).catch(() => ({ rows: [] })),
  ])

  const sm: Record<string, number> = {}
  statusRows.rows.forEach((r: any) => { sm[r.status] = Number(r.cnt) })

  return {
    kpis: {
      total:       statusRows.rows.reduce((s: number, r: any) => s + Number(r.cnt), 0),
      pending:     sm['pending']     || 0,
      shortlisted: sm['shortlisted'] || 0,
      admitted:    sm['admitted']    || 0,
      rejected:    sm['rejected']    || 0,
    },
    byStatus: statusRows.rows.map((r: any) => ({ label: r.status, count: Number(r.cnt) })),
    details:  details.rows.map((r: any) => ({
      id:          r.id,
      parentName:  r.parent_name  || '—',
      parentPhone: r.parent_phone || '—',
      schoolName:  r.school_name  || '—',
      schoolCity:  r.school_city  || '—',
      schoolState: r.school_state || '—',
      grade:       r.grade        || '—',
      status:      r.status       || 'pending',
      createdAt:   r.created_at,
    })),
  }
}

// ─── reviews section ──────────────────────────────────────────────────────────

async function getReviewsSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSch = schoolIds.length > 0
  const schoolPH = hasSch ? schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',') : ''
  const schoolFilter = hasSch ? `AND r.school_id IN (${schoolPH})` : ''
  const baseP: any[] = [...schoolIds]
  const { clause: dClause } = dateClause('r', from, to, baseP, schoolIds.length + 1)

  const [stats, ratingRows, details] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                              AS total,
        ROUND(AVG(r.rating)::numeric, 1)                     AS avg_rating,
        COUNT(CASE WHEN r.is_approved = true THEN 1 END)     AS approved,
        COUNT(CASE WHEN r.is_approved IS DISTINCT FROM true THEN 1 END) AS pending
      FROM reviews r WHERE 1=1 ${schoolFilter} ${dClause}
    `, [...baseP]).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT r.rating, COUNT(*) AS cnt
      FROM reviews r WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY r.rating ORDER BY r.rating DESC
    `, [...baseP]).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        r.id, r.rating, r.content, r.is_approved, r.created_at,
        COALESCE(u.full_name, u.name) AS reviewer_name,
        COALESCE(u.phone, u.mobile)   AS reviewer_phone,
        s.name  AS school_name,
        s.city  AS school_city,
        s.state AS school_state
      FROM reviews r
      LEFT JOIN users   u ON u.id  = r.user_id
      LEFT JOIN schools s ON s.id  = r.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY r.created_at DESC LIMIT 2000
    `, [...baseP]).catch(() => ({ rows: [] })),
  ])

  const st = stats.rows[0] || {}
  return {
    kpis: {
      total:     Number(st.total     || 0),
      avgRating: Number(st.avg_rating || 0),
      approved:  Number(st.approved  || 0),
      pending:   Number(st.pending   || 0),
    },
    byRating: ratingRows.rows.map((r: any) => ({
      label: `${r.rating} star`, count: Number(r.cnt),
    })),
    details: details.rows.map((r: any) => ({
      id:            r.id,
      rating:        Number(r.rating || 0),
      content:       r.content || '',
      isApproved:    r.is_approved || false,
      reviewerName:  r.reviewer_name  || '—',
      reviewerPhone: r.reviewer_phone || '—',
      schoolName:    r.school_name  || '—',
      schoolCity:    r.school_city  || '—',
      schoolState:   r.school_state || '—',
      createdAt:     r.created_at,
    })),
  }
}

// ─── revenue section ──────────────────────────────────────────────────────────

async function getRevenueSection(
  schoolIds: string[],
  from: string | null,
  to: string | null
) {
  const hasSch = schoolIds.length > 0
  const schoolPH = hasSch ? schoolIds.map((_: any, i: number) => `$${i + 1}`).join(',') : ''
  const schoolFilter = hasSch ? `AND lpp.school_id IN (${schoolPH})` : ''
  const baseP: any[] = [...schoolIds]
  const { clause: dClause } = dateClause('lpp', from, to, baseP, schoolIds.length + 1)

  const [totals, byPackage, bySchool, details] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(SUM(lpp.amount_paise), 0)                                                AS total_paise,
        COALESCE(SUM(CASE WHEN lpp.status='completed' THEN lpp.amount_paise END), 0)      AS completed_paise,
        COALESCE(SUM(COALESCE(lpp.discount_paise,(lpp.meta->>'discount_paise')::int,0)),0) AS discount_paise,
        COUNT(*)                                                                            AS txn_count,
        COUNT(CASE WHEN lpp.status='completed' THEN 1 END)                                AS completed_count,
        COALESCE(SUM(lpp.credits_added), 0)                                               AS total_credits
      FROM lead_package_payments lpp
      WHERE 1=1 ${schoolFilter} ${dClause}
    `, [...baseP]).catch(() => ({ rows: [{}] })),

    db.query(`
      SELECT
        COALESCE(lp.name, 'Unknown')                                                       AS package_name,
        COUNT(lpp.id)                                                                       AS txn_count,
        COALESCE(SUM(CASE WHEN lpp.status='completed' THEN lpp.amount_paise END), 0)       AS revenue_paise,
        COALESCE(SUM(lpp.credits_added), 0)                                                AS credits_sold
      FROM lead_package_payments lpp
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY lp.name ORDER BY revenue_paise DESC
    `, [...baseP]).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        s.name  AS school_name,
        s.city  AS school_city,
        s.state AS school_state,
        COUNT(lpp.id)                                                                        AS txn_count,
        COALESCE(SUM(CASE WHEN lpp.status='completed' THEN lpp.amount_paise END), 0)        AS revenue_paise,
        COALESCE(SUM(lpp.credits_added), 0)                                                 AS credits_sold
      FROM lead_package_payments lpp
      LEFT JOIN schools s ON s.id = lpp.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      GROUP BY s.name, s.city, s.state
      ORDER BY revenue_paise DESC LIMIT 50
    `, [...baseP]).catch(() => ({ rows: [] })),

    db.query(`
      SELECT
        lpp.id, lpp.order_id, lpp.payment_id, lpp.gateway,
        lpp.amount_paise, lpp.credits_added,
        COALESCE(lpp.discount_paise,(lpp.meta->>'discount_paise')::int, 0)  AS discount_paise,
        COALESCE(lpp.coupon_code, lpp.meta->>'coupon_code')                 AS coupon_code,
        lpp.status, lpp.created_at,
        lp.name AS package_name,
        s.name  AS school_name,
        s.city  AS school_city,
        s.state AS school_state
      FROM lead_package_payments lpp
      LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
      LEFT JOIN schools       s  ON s.id  = lpp.school_id
      WHERE 1=1 ${schoolFilter} ${dClause}
      ORDER BY lpp.created_at DESC LIMIT 2000
    `, [...baseP]).catch(() => ({ rows: [] })),
  ])

  const t = totals.rows[0] || {}
  return {
    kpis: {
      totalRevenuePaise:     Number(t.total_paise     || 0),
      completedRevenuePaise: Number(t.completed_paise || 0),
      discountPaise:         Number(t.discount_paise  || 0),
      txnCount:              Number(t.txn_count        || 0),
      completedCount:        Number(t.completed_count  || 0),
      totalCreditsSold:      Number(t.total_credits    || 0),
    },
    byPackage: byPackage.rows.map((r: any) => ({
      packageName:  r.package_name,
      txnCount:     Number(r.txn_count     || 0),
      revenuePaise: Number(r.revenue_paise || 0),
      creditsSold:  Number(r.credits_sold  || 0),
    })),
    bySchool: bySchool.rows.map((r: any) => ({
      schoolName:   r.school_name  || '—',
      schoolCity:   r.school_city  || '—',
      schoolState:  r.school_state || '—',
      txnCount:     Number(r.txn_count     || 0),
      revenuePaise: Number(r.revenue_paise || 0),
      creditsSold:  Number(r.credits_sold  || 0),
    })),
    details: details.rows.map((r: any) => ({
      id:            r.id,
      orderId:       r.order_id     || '—',
      paymentId:     r.payment_id   || '—',
      gateway:       r.gateway      || '—',
      amountPaise:   Number(r.amount_paise   || 0),
      discountPaise: Number(r.discount_paise || 0),
      creditsAdded:  Number(r.credits_added  || 0),
      couponCode:    r.coupon_code  || null,
      status:        r.status       || 'pending',
      packageName:   r.package_name || '—',
      schoolName:    r.school_name  || '—',
      schoolCity:    r.school_city  || '—',
      schoolState:   r.school_state || '—',
      createdAt:     r.created_at,
    })),
  }
}

// ─── main report ──────────────────────────────────────────────────────────────

async function getReport(req: NextRequest) {
  const sp = new URL(req.url).searchParams

  const states    = parseCsv(sp.get('states'))
  const cities    = parseCsv(sp.get('cities'))
  const schoolIds = parseCsv(sp.get('schoolIds'))
  const from      = sp.get('from') || null
  const to        = sp.get('to')   || null

  // Resolve final list of school IDs
  const resolvedIds = await resolveSchoolIds(schoolIds, states, cities)

  const [leadsData, appsData, reviewsData, revenueData] = await Promise.all([
    getLeadsSection(resolvedIds, from, to),
    getApplicationsSection(resolvedIds, from, to),
    getReviewsSection(resolvedIds, from, to),
    getRevenueSection(resolvedIds, from, to),
  ])

  return NextResponse.json({
    filters: { states, cities, schoolIds, from, to, resolvedSchoolCount: resolvedIds.length },
    generatedAt: new Date().toISOString(),
    leads:        leadsData,
    applications: appsData,
    reviews:      reviewsData,
    revenue:      revenueData,
  })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const action = new URL(req.url).searchParams.get('action') || 'report'
    if (action === 'filters') return await getFilters()
    return await getReport(req)
  } catch (e: any) {
    console.error('[school-report]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
