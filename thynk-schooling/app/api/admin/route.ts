export const dynamic = 'force-dynamic'
/**
 * Consolidated Admin Route  (replaces 20+ admin/* routes)
 *
 * All requests: /api/admin?action=<name>
 *
 * Actions: overview, analytics, schools, users, applications, reviews,
 *          leads, payments, counselling, notifications, content, theme,
 *          seo, settings, media, cities, lead-pricing-defaults, seed-demo, health,
 *          blog
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

// ─── One-time migration guard ─────────────────────────────────────────────────
// All ensure* functions run DDL only ONCE per server process lifetime.
// Without this, every request ran 35+ sequential ALTER TABLEs before any query.
const _migrated = new Set<string>()
async function runOnce(key: string, fn: () => Promise<void>): Promise<void> {
  if (_migrated.has(key)) return
  await fn()
  _migrated.add(key)
}

// Exclude only known failure states — this way we never miss revenue
// due to an unexpected status variant from a payment gateway.
// Known failure statuses: failed, cancelled, refunded, expired, pending
const PAID_IN    = `status NOT IN ('failed','cancelled','refunded','expired','pending','')`

// ─── overview ─────────────────────────────────────────────────────────────────

async function getOverview() {
  await ensureSchoolsTable()
  const [
    users, schools, apps, leads, pendingSchoolsCt, newUsersToday, leadsToday,
    revenue, pendingApps, pendingReviews, reviews,
    weeklyLeads, monthlyGrowth, boardDist, appStatus,
    recentLeadsRows, recentUsersRows, pendingSchoolsRows,
  ] = await Promise.all([
    db.query("SELECT COUNT(*) FROM users WHERE role != 'super_admin'").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM schools").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM applications").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM leads").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM schools WHERE (is_verified = false OR is_verified IS NULL)").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM users WHERE role != 'super_admin' AND created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
    // Real revenue: lead_package_payments (lead credits) + subscription_payments (plans) combined
    db.query(`
      SELECT
        COALESCE(SUM(amount_paise), 0)          AS total_paise,
        COUNT(*)                                 AS total_count,
        COALESCE(SUM(original_amount_paise), 0) AS total_original_paise,
        STRING_AGG(DISTINCT status, ', ')        AS statuses
      FROM (
        SELECT amount_paise, original_amount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT amount_paise, original_amount_paise, status FROM subscription_payments
      ) AS all_payments
    `).catch(() => ({ rows: [{ total_paise: 0, total_count: 0, statuses: '' }] })),
    db.query("SELECT COUNT(*) FROM applications WHERE status = 'pending' OR status IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM reviews WHERE is_approved = false OR is_approved IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM reviews").catch(() => ({ rows: [{ count: 0 }] })),
    // Weekly leads + real revenue (lead packages + subscription plans combined)
    db.query(`
      SELECT
        to_char(DATE(l.created_at), 'Dy')          AS day,
        COUNT(l.id)                                 AS leads,
        COALESCE(SUM(all_pay.amount_paise), 0)      AS revenue_paise
      FROM leads l
      LEFT JOIN (
        SELECT created_at, amount_paise, status FROM lead_package_payments
        UNION ALL
        SELECT created_at, amount_paise, status FROM subscription_payments
      ) all_pay
        ON DATE(all_pay.created_at) = DATE(l.created_at)
        AND all_pay.status NOT IN ('failed','cancelled','refunded','expired','pending','')
      WHERE l.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(l.created_at), to_char(DATE(l.created_at), 'Dy')
      ORDER BY DATE(l.created_at)
    `).catch(() => ({ rows: [] })),
    // Monthly growth
    db.query(`
      SELECT
        to_char(DATE_TRUNC('month', created_at), 'Mon') AS month,
        COUNT(*) AS users,
        0        AS schools,
        0        AS leads
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at), to_char(DATE_TRUNC('month', created_at), 'Mon')
      ORDER BY DATE_TRUNC('month', created_at)
    `).catch(() => ({ rows: [] })),
    // Board — single varchar column, NOT an array
    db.query(`
      SELECT board AS name, COUNT(*) AS value
      FROM schools
      WHERE board IS NOT NULL AND board <> ''
      GROUP BY board
      ORDER BY value DESC
      LIMIT 5
    `).catch(() => ({ rows: [] })),
    db.query("SELECT COALESCE(status, 'pending') AS name, COUNT(*) AS value FROM applications GROUP BY status").catch(() => ({ rows: [] })),
    // Recent leads — parent_name stored directly on leads table
    db.query(`
      SELECT
        l.id,
        s.name                AS school_name,
        l.parent_name,
        l.class_applying_for,
        l.is_purchased,
        l.created_at,
        lpp.amount_paise      AS price
      FROM leads l
      LEFT JOIN schools s ON s.id = l.school_id
      LEFT JOIN LATERAL (
        SELECT amount_paise FROM lead_package_payments lpp2
        WHERE lpp2.school_id = l.school_id
          AND lpp2.status NOT IN ('failed','cancelled','refunded','expired','pending','')
        ORDER BY lpp2.created_at DESC LIMIT 1
      ) lpp ON true
      ORDER BY l.created_at DESC
      LIMIT 8
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT id, COALESCE(full_name, name) AS full_name, COALESCE(phone, mobile) AS phone, role
      FROM users WHERE role != 'super_admin' ORDER BY created_at DESC LIMIT 5
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT id, name, city FROM schools
      WHERE (is_verified = false OR is_verified IS NULL)
      ORDER BY created_at DESC LIMIT 5
    `).catch(() => ({ rows: [] })),
  ])

  const BOARD_COLORS: Record<string, string> = {
    CBSE: '#F5A623', ICSE: '#4F8EF7', 'State Board': '#00E5A0', IB: '#9B72FF',
  }
  const STATUS_COLORS: Record<string, string> = {
    pending: '#FBBF24', shortlisted: '#00E5A0', admitted: '#4F8EF7', rejected: '#FF5757',
  }

  // Board totals → percentages for the donut chart
  const boardTotal = boardDist.rows.reduce((s: number, r: any) => s + Number(r.value), 0) || 1

  return NextResponse.json({
    totalUsers:          Number(users.rows[0].count),
    totalSchools:        Number(schools.rows[0].count),
    totalApps:           Number(apps.rows[0].count),
    totalLeads:          Number(leads.rows[0].count),
    totalReviews:        Number(reviews.rows[0].count),
    pendingVerification: Number(pendingSchoolsCt.rows[0].count),
    newUsersToday:       Number(newUsersToday.rows[0].count),
    leadsToday:          Number(leadsToday.rows[0].count),
    // Stored as paise — dashboard KPI card divides by 100 to show rupees
    totalRevenue:        Number(revenue.rows[0]?.total_paise || 0),
    totalRevenueCount:   Number(revenue.rows[0]?.total_count || 0),
    revenueStatuses:     String(revenue.rows[0]?.statuses || ''),
    pendingApps:         Number(pendingApps.rows[0].count),
    pendingReviews:      Number(pendingReviews.rows[0].count),
    leadsWeekly: weeklyLeads.rows.map((r: any) => ({
      day:     r.day,
      leads:   Number(r.leads),
      revenue: Math.round(Number(r.revenue_paise) / 100), // paise → rupees
    })),
    monthlyGrowth: monthlyGrowth.rows.map((r: any) => ({
      month:   r.month,
      users:   Number(r.users),
      schools: Number(r.schools),
      leads:   Number(r.leads),
    })),
    // Percentages for the donut label
    schoolsByBoard: boardDist.rows.map((r: any, i: number) => ({
      name:  r.name,
      value: Math.round(Number(r.value) / boardTotal * 100),
      color: BOARD_COLORS[r.name] || ['#F5A623', '#4F8EF7', '#00E5A0', '#9B72FF', '#FF7A2E'][i] || '#888',
    })),
    appStatus: appStatus.rows.map((r: any) => ({
      name:  r.name,
      value: Number(r.value),
      fill:  STATUS_COLORS[r.name] || '#888',
    })),
    recentLeads: recentLeadsRows.rows.map((r: any) => ({
      id:           r.id,
      schoolName:   r.school_name          || '—',
      parentName:   r.parent_name          || '—',
      classApplied: r.class_applying_for   || '—',
      price:        Math.round(Number(r.price || 0) / 100), // paise → rupees
      isPurchased:  r.is_purchased         || false,
      createdAt:    r.created_at,
    })),
    recentUsers: recentUsersRows.rows.map((r: any) => ({
      id:       r.id,
      fullName: r.full_name || '—',
      phone:    r.phone     || '—',
      role:     r.role,
    })),
    pendingSchools: pendingSchoolsRows.rows,
    periodStats: await (async () => {
      const PAID = `status IN ('paid','captured','success','completed')`
      const [lp, rp, sp, up] = await Promise.all([
        db.query(`SELECT
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int AS today,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('week',NOW()) THEN 1 END)::int AS week,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month',NOW()) THEN 1 END)::int AS month,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('year',NOW()) THEN 1 END)::int AS year,
          COUNT(*)::int AS all FROM leads`).catch(() => ({ rows: [{}] })),
        db.query(`SELECT
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN amount_paise END),0)::bigint AS today,
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week',NOW()) THEN amount_paise END),0)::bigint AS week,
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month',NOW()) THEN amount_paise END),0)::bigint AS month,
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('year',NOW()) THEN amount_paise END),0)::bigint AS year,
          COALESCE(SUM(amount_paise),0)::bigint AS all
          FROM (SELECT created_at, amount_paise FROM lead_package_payments WHERE ${PAID}
                UNION ALL SELECT created_at, amount_paise FROM subscription_payments WHERE ${PAID}) pay`).catch(() => ({ rows: [{}] })),
        db.query(`SELECT
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int AS today,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('week',NOW()) THEN 1 END)::int AS week,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month',NOW()) THEN 1 END)::int AS month,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('year',NOW()) THEN 1 END)::int AS year,
          COUNT(*)::int AS all FROM schools`).catch(() => ({ rows: [{}] })),
        db.query(`SELECT
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int AS today,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('week',NOW()) THEN 1 END)::int AS week,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month',NOW()) THEN 1 END)::int AS month,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('year',NOW()) THEN 1 END)::int AS year,
          COUNT(*)::int AS all FROM users WHERE role='parent'`).catch(() => ({ rows: [{}] })),
      ])
      const l = lp.rows[0]||{}, r = rp.rows[0]||{}, s = sp.rows[0]||{}, u = up.rows[0]||{}
      const paise2rs = (v: any) => Math.round(Number(v||0)/100)
      return {
        leads:   { today: l.today||0, week: l.week||0, month: l.month||0, year: l.year||0, all: l.all||0 },
        revenue: { today: paise2rs(r.today), week: paise2rs(r.week), month: paise2rs(r.month), year: paise2rs(r.year), all: paise2rs(r.all) },
        schools: { today: s.today||0, week: s.week||0, month: s.month||0, year: s.year||0, all: s.all||0 },
        users:   { today: u.today||0, week: u.week||0, month: u.month||0, year: u.year||0, all: u.all||0 },
      }
    })(),
  })
}

// ─── analytics ────────────────────────────────────────────────────────────────

async function getAnalytics() {
  const [signups30, schools30, leads30, revenue30, topCities, boardDist, funnel] = await Promise.all([
    db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days' AND role = 'parent'
      GROUP BY day ORDER BY day
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM schools
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day ORDER BY day
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day ORDER BY day
    `).catch(() => ({ rows: [] })),
    // Real revenue from paid payments
    db.query(`
      SELECT DATE(created_at) AS day, COALESCE(SUM(amount_paise), 0) AS revenue_paise
      FROM lead_package_payments
      WHERE ${PAID_IN} AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day ORDER BY day
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(l.id) AS leads
      FROM schools s
      LEFT JOIN leads l ON l.school_id = s.id
      WHERE s.city IS NOT NULL AND s.city <> ''
      GROUP BY s.city ORDER BY leads DESC LIMIT 6
    `).catch(() => ({ rows: [] })),
    // board is a single varchar column, not an array
    db.query(`
      SELECT board AS name, COUNT(*) AS value
      FROM schools
      WHERE board IS NOT NULL AND board <> ''
      GROUP BY board ORDER BY value DESC LIMIT 5
    `).catch(() => ({ rows: [] })),
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'parent')        AS registered_parents,
        (SELECT COUNT(*) FROM schools)                            AS registered_schools,
        (SELECT COUNT(*) FROM leads WHERE is_purchased = true)    AS leads_purchased,
        (SELECT COUNT(*) FROM applications)                       AS applications
    `).catch(() => ({ rows: [{}] })),
  ])

  const BOARD_COLORS = ['#F5A623', '#4F8EF7', '#00E5A0', '#9B72FF', '#FF7A2E']
  const f = funnel.rows[0] || {}

  // Build a revenue map keyed by day string for merging with leads
  const revMap: Record<string, number> = {}
  revenue30.rows.forEach((r: any) => {
    revMap[String(r.day).slice(0, 10)] = Math.round(Number(r.revenue_paise) / 100)
  })

  return NextResponse.json({
    signups:  signups30.rows.map((r: any) => ({ day: String(r.day).slice(5), count: Number(r.count) })),
    schools:  schools30.rows.map((r: any) => ({ day: String(r.day).slice(5), count: Number(r.count) })),
    dailyLeads30: leads30.rows.map((r: any) => ({
      day:     String(r.day).slice(5),
      leads:   Number(r.count),
      revenue: revMap[String(r.day).slice(0, 10)] || 0, // paise → rupees already
    })),
    topCities: topCities.rows.map((r: any) => ({
      city: r.city, leads: Number(r.leads), schools: Number(r.schools),
    })),
    boardData: boardDist.rows.map((r: any, i: number) => ({
      name: r.name, value: Number(r.value), color: BOARD_COLORS[i] || '#888',
    })),
    funnelData: [
      { name: 'Registered parents', value: Number(f.registered_parents || 0) },
      { name: 'Registered schools', value: Number(f.registered_schools || 0) },
      { name: 'Leads purchased',    value: Number(f.leads_purchased    || 0) },
      { name: 'Applications',       value: Number(f.applications       || 0) },
    ],
  })
}

// ─── schools ──────────────────────────────────────────────────────────────────

async function ensureSchoolsTable() {
  await runOnce('schools', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(300), city VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  const cols = [
    'ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
    'ADD COLUMN IF NOT EXISTS board TEXT',
    'ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS slug VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS admin_user_id UUID',
    'ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
    'ADD COLUMN IF NOT EXISTS email VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)',
    'ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)',
    'ADD COLUMN IF NOT EXISTS description TEXT',
    'ADD COLUMN IF NOT EXISTS address_line1 TEXT',
    'ADD COLUMN IF NOT EXISTS locality VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
    'ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)',
    'ADD COLUMN IF NOT EXISTS website_url VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS principal_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS tagline VARCHAR(300)',
    'ADD COLUMN IF NOT EXISTS affiliation_no VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS founding_year INTEGER',
    'ADD COLUMN IF NOT EXISTS total_students INTEGER',
    'ADD COLUMN IF NOT EXISTS school_type VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS medium_of_instruction VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS classes_from VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS classes_to VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS monthly_fee_min INTEGER',
    'ADD COLUMN IF NOT EXISTS monthly_fee_max INTEGER',
    'ADD COLUMN IF NOT EXISTS annual_fee INTEGER',
    'ADD COLUMN IF NOT EXISTS admission_open BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS facilities TEXT[]',
    'ADD COLUMN IF NOT EXISTS sports TEXT[]',
    'ADD COLUMN IF NOT EXISTS languages TEXT[]',
    'ADD COLUMN IF NOT EXISTS extracurriculars TEXT[]',
  ]
  for (const col of cols) await db.query(`ALTER TABLE schools ${col}`).catch(() => {})
  }) // end runOnce
}

async function getAdminSchools(req: NextRequest) {
  try {
    await ensureSchoolsTable()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const isVerified = searchParams.get('isVerified'), isFeatured = searchParams.get('isFeatured'), isActive = searchParams.get('isActive')
    const status = searchParams.get('status')
    const conds: string[] = ['1=1']; const params: any[] = []
    if (search) { params.push(`%${search}%`); conds.push(`(s.name ILIKE $${params.length} OR s.city ILIKE $${params.length} OR COALESCE(u.phone,u.mobile) ILIKE $${params.length})`) }
    if (isVerified === 'true'  || status === 'verified')   conds.push('s.is_verified=true')
    if (isVerified === 'false' || status === 'unverified') conds.push('(s.is_verified=false OR s.is_verified IS NULL)')
    if (isFeatured === 'true'  || status === 'featured')   conds.push('s.is_featured=true')
    if (isActive === 'false')                              conds.push('(s.is_active=false OR s.is_active IS NULL)')
    const where = conds.join(' AND ')
    params.push(limit, offset)
    const [rows, ct] = await Promise.all([
      db.query(`SELECT s.id, s.name, s.slug, s.city, s.board, s.is_verified, s.is_featured, s.is_active, s.rating, s.created_at, COALESCE(u.phone,u.mobile) AS owner_phone FROM schools s LEFT JOIN users u ON u.id=s.admin_user_id WHERE ${where} ORDER BY s.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      db.query(`SELECT COUNT(*) FROM schools s LEFT JOIN users u ON u.id=s.admin_user_id WHERE ${where}`, params.slice(0,-2)),
    ])
    const data = rows.rows.map((s:any) => ({
      id: s.id, name: s.name || '—', slug: s.slug || '',
      city: s.city || '—', board: s.board ? [s.board] : [],
      isVerified: s.is_verified || false, isFeatured: s.is_featured || false, isActive: s.is_active !== false,
      avgRating: Number(s.rating) || 0, totalLeads: 0,
      ownerPhone: s.owner_phone || '—', createdAt: s.created_at,
    }))
    return NextResponse.json({ data, total: Number(ct.rows[0].count), page, limit })
  } catch (e: any) {
    console.error('[getAdminSchools]', e.message)
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20, error: e.message })
  }
}

async function updateAdminSchool(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  if (body.isVerified !== undefined) { params.push(body.isVerified); sets.push(`is_verified=$${params.length}`) }
  if (body.isFeatured !== undefined) { params.push(body.isFeatured); sets.push(`is_featured=$${params.length}`) }
  if (body.isActive   !== undefined) { params.push(body.isActive);   sets.push(`is_active=$${params.length}`) }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  params.push(id)
  await db.query(`UPDATE schools SET ${sets.join(', ')} WHERE id=$${params.length}`, params)
  return NextResponse.json({ success: true })
}

// ─── users ────────────────────────────────────────────────────────────────────

async function getAdminUsers(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role'), search = searchParams.get('search') || searchParams.get('q') || ''
  const status = searchParams.get('status')
  const isExport = searchParams.get('export') === '1'
  const limit = isExport ? 10000 : Math.min(50, Number(searchParams.get('limit') || 20))
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const offset = isExport ? 0 : (page - 1) * limit
  const conds: string[] = ["u.role!='super_admin'"]; const params: unknown[] = []; let idx = 1
  if (role && role !== 'suspended') { conds.push(`u.role=$${idx++}`); params.push(role) }
  if (status === 'suspended' || role === 'suspended') { conds.push(`u.is_active=$${idx++}`); params.push(false) }
  if (search) { conds.push(`(COALESCE(u.full_name,u.name) ILIKE $${idx} OR COALESCE(u.phone,u.mobile) ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${search}%`); idx++ }
  const where = conds.join(' AND ')
  const [rows, ct, parentCt, schoolCt, suspendedCt] = await Promise.all([
    db.query(`SELECT u.id, COALESCE(u.full_name,u.name) AS full_name, COALESCE(u.phone,u.mobile) AS phone, u.email, u.role, COALESCE(u.is_active,true) AS is_active, u.profile_completed, u.last_login_at, u.created_at, s.name AS school_name FROM users u LEFT JOIN schools s ON s.admin_user_id=u.id WHERE ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, limit, offset]),
    db.query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params),
    db.query("SELECT COUNT(*) FROM users WHERE role='parent'").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM users WHERE role='school_admin'").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM users WHERE is_active=false").catch(() => ({ rows: [{ count: 0 }] })),
  ])

  if (isExport) {
    const header = 'Name,Phone,Email,Role,School,Status,Joined\n'
    const csvRows = rows.rows.map((r: any) =>
      [r.full_name||'', r.phone||'', r.email||'', r.role||'', r.school_name||'',
       r.is_active===false?'suspended':'active',
       new Date(r.created_at).toLocaleDateString('en-IN')
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    ).join('\n')
    return new Response(header + csvRows, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="users.csv"' }
    })
  }

  const total = Number(ct.rows[0].count)
  const users = rows.rows.map((r: any) => ({
    id: r.id, fullName: r.full_name || '—', phone: r.phone || '—', email: r.email || null,
    role: r.role, profileDone: r.profile_completed || false,
    school: r.school_name || null,
    lastLogin: r.last_login_at || null, joinedAt: r.created_at, schoolName: r.school_name || null,
    status: r.is_active === false ? 'suspended' : 'active',
  }))
  return Response.json({
    users, data: users, total, page, limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: Number(ct.rows[0].count),
      parents: Number(parentCt.rows[0].count),
      schools: Number(schoolCt.rows[0].count),
      suspended: Number(suspendedCt.rows[0].count),
    }
  })
}

async function updateAdminUser(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const { isActive, role } = await req.json()
  if (isActive !== undefined) await db.query('UPDATE users SET is_active=$1 WHERE id=$2', [isActive, id])
  if (role) await db.query('UPDATE users SET role=$1 WHERE id=$2', [role, id])
  return Response.json({ message: 'Updated' })
}

async function getUserActivity(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const limit = Math.min(50, Number(new URL(req.url).searchParams.get('limit') || 30))
  const res = await db.query(`SELECT id,action,detail,ip_address,user_agent,created_at FROM user_activity_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [id, limit])
  return Response.json({ logs: res.rows })
}

// ─── applications ─────────────────────────────────────────────────────────────

async function getAdminApplications(req: NextRequest) {
  await runOnce('applications', () => db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {}))
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page')||1)), limit = Math.min(50, Number(searchParams.get('limit')||20))
  const offset = (page-1)*limit, status = searchParams.get('status')
  const conds = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`a.status=$${params.length}`) }
  const where = conds.join(' AND '); params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`SELECT a.*, s.name AS school_name, u.full_name AS parent_name FROM applications a LEFT JOIN schools s ON s.id=a.school_id LEFT JOIN users u ON u.id=a.parent_id WHERE ${where} ORDER BY a.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*) FROM applications a WHERE ${where}`, params.slice(0,-2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

async function updateAdminApplication(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const { status } = await req.json()
  await db.query('UPDATE applications SET status=$1 WHERE id=$2', [status, id])
  return NextResponse.json({ success: true })
}

// ─── reviews ──────────────────────────────────────────────────────────────────

async function getAdminReviews(req: NextRequest) {
  await runOnce('reviews', () => db.query(`CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID, user_id UUID, rating INTEGER, content TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {}))
  const { searchParams } = new URL(req.url)
  const page = Math.max(1,Number(searchParams.get('page')||1)), limit = Math.min(50,Number(searchParams.get('limit')||20))
  const offset = (page-1)*limit, status = searchParams.get('status')
  const conds = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`r.status=$${params.length}`) }
  const where = conds.join(' AND '); params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`SELECT r.*, s.name AS school_name, u.full_name AS user_name FROM reviews r LEFT JOIN schools s ON s.id=r.school_id LEFT JOIN users u ON u.id=r.user_id WHERE ${where} ORDER BY r.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*) FROM reviews r WHERE ${where}`, params.slice(0,-2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

async function updateAdminReview(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const { status } = await req.json()
  await db.query('UPDATE reviews SET status=$1 WHERE id=$2', [status, id])
  return NextResponse.json({ success: true })
}

async function deleteAdminReview(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  await db.query('DELETE FROM reviews WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─── leads (admin) ────────────────────────────────────────────────────────────

async function getAdminLeads(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(50, Number(searchParams.get('limit') || 20))
  const offset = (page - 1) * limit
  const status = searchParams.get('status')
  const conds = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`l.status=$${params.length}`) }
  const where = conds.join(' AND ')
  params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`
      SELECT l.*, s.name AS school_name
      FROM leads l
      LEFT JOIN schools s ON s.id = l.school_id
      WHERE ${where}
      ORDER BY l.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params),
    db.query(`SELECT COUNT(*) FROM leads l WHERE ${where}`, params.slice(0, -2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

// ─── payments ─────────────────────────────────────────────────────────────────

async function getAdminPayments(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(50, Number(searchParams.get('limit') || 20))
  const offset = (page - 1) * limit
  const rows = await db.query(`
    SELECT lpp.*, s.name AS school_name, lp.name AS package_name
    FROM lead_package_payments lpp
    LEFT JOIN schools s ON s.id = lpp.school_id
    LEFT JOIN lead_packages lp ON lp.id = lpp.package_id
    ORDER BY lpp.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]).catch(() => ({ rows: [] }))
  const ct = await db.query(`SELECT COUNT(*) FROM lead_package_payments WHERE ${PAID_IN}`) .catch(() => ({ rows: [{ count: 0 }] }))
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

// ─── counselling (admin) ──────────────────────────────────────────────────────

async function getAdminCounselling(req: NextRequest) {
  await runOnce('counselling_requests', () => db.query(`CREATE TABLE IF NOT EXISTS counselling_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, name VARCHAR(200), phone VARCHAR(20), city VARCHAR(100), status VARCHAR(50) DEFAULT 'pending', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {}))
  const { searchParams } = new URL(req.url)
  const page = Math.max(1,Number(searchParams.get('page')||1)), limit = Math.min(50,Number(searchParams.get('limit')||20))
  const offset = (page-1)*limit, status = searchParams.get('status')
  const conds = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`cr.status=$${params.length}`) }
  const where = conds.join(' AND '); params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`SELECT cr.*, u.full_name AS user_name FROM counselling_requests cr LEFT JOIN users u ON u.id=cr.parent_id WHERE ${where} ORDER BY cr.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*) FROM counselling_requests cr WHERE ${where}`, params.slice(0,-2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

async function updateAdminCounselling(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  const { status, notes } = await req.json()
  await db.query('UPDATE counselling_requests SET status=$1, notes=$2 WHERE id=$3', [status, notes, id])
  return NextResponse.json({ success: true })
}

// ─── content / theme / seo / settings / media ────────────────────────────────

async function ensureSettingsTable(table: string, schema: string) {
  await db.query(schema).catch(() => {})
}

async function getContent(req: NextRequest) {
  await ensureSettingsTable('page_content', `CREATE TABLE IF NOT EXISTS page_content (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
  await ensureSettingsTable('site_settings', `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
  const key = new URL(req.url).searchParams.get('key')
  if (key) {
    const res = await db.query("SELECT value FROM page_content WHERE key=$1", [key])
    if (!res.rows.length) return Response.json({ content: {} })
    try { return Response.json({ content: JSON.parse(res.rows[0].value) }) } catch { return Response.json({ content: res.rows[0].value }) }
  }
  const [pages, settings] = await Promise.all([db.query("SELECT key,value FROM page_content ORDER BY key"), db.query("SELECT key,value FROM site_settings WHERE key LIKE 'content%'")])
  const out: Record<string,any> = {}
  pages.rows.forEach((r: any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
  settings.rows.forEach((r: any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } })
}

async function saveContent(req: NextRequest) {
  const { key, value } = await req.json()
  const stored = JSON.stringify(value)
  await db.query(`INSERT INTO page_content (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`, [key, stored])
  return Response.json({ message: 'Saved' })
}

// ─── subscription plans ───────────────────────────────────────────────────────
const DEFAULT_SUB_PLANS = [
  { name:'Free',    price_paise:0,     description:'Get listed and start receiving leads.',          features:['5 lead credits included','Basic school profile','Up to 5 photos','Standard listing placement','Email support'],                                                                                  lead_count:5,   is_hot:false, cta:'Get Started Free', plan_key:'free' },
  { name:'Silver',  price_paise:299900,description:'For schools serious about admissions.',          features:['25 lead credits included','Verified school badge','Unlimited photos & video','Enhanced listing placement','Analytics dashboard','Priority email support'],                                    lead_count:25,  is_hot:false, cta:'Start Silver',     plan_key:'silver' },
  { name:'Gold',    price_paise:599900,description:'Most popular — best ROI for growing schools.',   features:['75 lead credits included','Featured school badge','Top placement in search','Full analytics & reports','School profile video','Dedicated account manager','WhatsApp support'],                lead_count:75,  is_hot:true,  cta:'Start Gold',       plan_key:'gold' },
  { name:'Platinum',price_paise:999900,description:'For chains and premium institutions.',           features:['Unlimited lead credits','Top-of-search placement','Homepage featured listing','AI-optimised profile','Multi-branch management','SLA-backed account manager'],                                  lead_count:-1,  is_hot:false, cta:'Start Platinum',   plan_key:'platinum' },
]

async function ensureSubPlansTable() {
  await runOnce('subscription_plans', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_key                  VARCHAR(50) NOT NULL UNIQUE,
      name                      VARCHAR(200) NOT NULL,
      description               TEXT,
      price_paise               INTEGER NOT NULL DEFAULT 0,
      lead_count                INTEGER NOT NULL DEFAULT 0,
      features                  TEXT NOT NULL DEFAULT '[]',
      is_hot                    BOOLEAN DEFAULT false,
      cta                       VARCHAR(200) NOT NULL DEFAULT 'Get Started',
      sort_order                INTEGER NOT NULL DEFAULT 0,
      is_active                 BOOLEAN DEFAULT true,
      created_at                TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  // Auto-migrate: rename old column name if it still exists
  await db.query(`ALTER TABLE subscription_plans RENAME COLUMN leads_per_month TO lead_count`).catch(() => {})
  // Add any missing columns
  await db.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS includes_featured_listing BOOLEAN NOT NULL DEFAULT false`).catch(() => {})
  await db.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS featured_listing_days INTEGER NOT NULL DEFAULT 30`).catch(() => {})
  const count = await db.query('SELECT COUNT(*) FROM subscription_plans').catch(() => ({ rows:[{ count:'0' }] }))
  if (parseInt(count.rows[0].count) === 0) {
    for (let i = 0; i < DEFAULT_SUB_PLANS.length; i++) {
      const p = DEFAULT_SUB_PLANS[i]
      await db.query(
        `INSERT INTO subscription_plans (plan_key,name,description,price_paise,lead_count,features,is_hot,cta,sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (plan_key) DO NOTHING`,
        [p.plan_key, p.name, p.description, p.price_paise, p.lead_count, JSON.stringify(p.features), p.is_hot, p.cta, i]
      ).catch(() => {})
    }
  }
  }) // end runOnce
}

function toSubPlan(row: any) {
  let features: string[] = []
  try { features = JSON.parse(row.features) } catch { features = [] }
  return {
    id: row.id, planKey: row.plan_key, name: row.name, description: row.description || '',
    price: row.price_paise, leadCount: row.lead_count,
    features, isHot: row.is_hot, cta: row.cta, sortOrder: row.sort_order, isActive: row.is_active,
    includesFeaturedListing: row.includes_featured_listing ?? false,
    featuredListingDays: row.featured_listing_days ?? 30,
  }
}

async function getSubPlans() {
  await ensureSubPlansTable()
  const rows = await db.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC, price_paise ASC')
  return NextResponse.json(rows.rows.map(toSubPlan))
}

async function saveSubPlan(req: NextRequest) {
  await ensureSubPlansTable()
  const body = await req.json()
  const { planKey, name, description, price, leadCount, features, isHot, cta, sortOrder, isActive, includesFeaturedListing, featuredListingDays } = body
  if (!planKey || !name) return NextResponse.json({ error: 'planKey and name are required' }, { status: 400 })
  const res = await db.query(
    `INSERT INTO subscription_plans (plan_key,name,description,price_paise,lead_count,features,is_hot,cta,sort_order,is_active,includes_featured_listing,featured_listing_days)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (plan_key) DO UPDATE SET
       name=$2, description=$3, price_paise=$4, lead_count=$5,
       features=$6, is_hot=$7, cta=$8, sort_order=$9, is_active=$10, includes_featured_listing=$11, featured_listing_days=$12
     RETURNING *`,
    [planKey, name, description||'', price??0, leadCount??0, JSON.stringify(features??[]), isHot??false, cta||'Get Started', sortOrder??0, isActive??true, includesFeaturedListing??false, featuredListingDays??30]
  )
  return NextResponse.json(toSubPlan(res.rows[0]))
}

async function updateSubPlan(req: NextRequest) {
  await ensureSubPlansTable()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  const map: Record<string,string> = { name:'name', description:'description', price:'price_paise', leadCount:'lead_count', isHot:'is_hot', cta:'cta', sortOrder:'sort_order', isActive:'is_active', includesFeaturedListing:'includes_featured_listing', featuredListingDays:'featured_listing_days' }
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) { params.push(body[k]); sets.push(`${col}=$${params.length}`) }
  }
  if (body.features !== undefined) { params.push(JSON.stringify(body.features)); sets.push(`features=$${params.length}`) }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  params.push(id)
  const res = await db.query(`UPDATE subscription_plans SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params)
  if (!res.rows.length) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  return NextResponse.json(toSubPlan(res.rows[0]))
}

async function deleteSubPlan(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('DELETE FROM subscription_plans WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─────────────────────────────────────────────────────────────────────────────

const THEME_DEFAULTS = { containerWidth:1600, ivory:'#FAF7F2', ivory2:'#F5F0E8', ivory3:'#EDE5D8', ink:'#0D1117', ink2:'#1C2333', inkMuted:'#4A5568', inkFaint:'#A0ADB8', gold:'#B8860B', gold2:'#C9960D', goldLight:'#E8C547', goldWash:'#FEF7E0' }

async function getTheme() {
  await db.query(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(() => {})
  const res = await db.query("SELECT value FROM site_settings WHERE key='theme'")
  let theme = res.rows.length ? JSON.parse(res.rows[0].value) : null
  if (theme && !theme.containerWidth) theme.containerWidth = 1600
  if (!theme) theme = THEME_DEFAULTS
  return Response.json({ theme }, { headers: { 'Cache-Control': 'no-store' } })
}

async function saveTheme(req: NextRequest) {
  const { theme } = await req.json()
  if (theme && !theme.containerWidth) theme.containerWidth = 1600
  await db.query(`INSERT INTO site_settings (key,value,updated_at) VALUES ('theme',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`, [JSON.stringify(theme)])
  return Response.json({ message: 'Theme saved' })
}

async function getSeo(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS seo_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), page_key VARCHAR(120) NOT NULL, param_key VARCHAR(200) NOT NULL, param_value TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(page_key,param_key))`).catch(() => {})
  const pageKey = new URL(req.url).searchParams.get('page') || 'global'
  const res = await db.query('SELECT param_key,param_value FROM seo_settings WHERE page_key=$1 ORDER BY param_key', [pageKey])
  const data: Record<string,string> = {}; res.rows.forEach((r: any) => { data[r.param_key] = r.param_value })
  return Response.json({ data })
}

async function saveSeo(req: NextRequest) {
  const { pageKey, params } = await req.json()
  for (const [k, v] of Object.entries(params as Record<string,string>))
    await db.query(`INSERT INTO seo_settings(page_key,param_key,param_value,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(page_key,param_key) DO UPDATE SET param_value=$3,updated_at=NOW()`, [pageKey, k, v])
  return Response.json({ message: 'SEO settings saved' })
}

async function getSettings() {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const res = await db.query("SELECT key,value FROM admin_settings")
  const out: Record<string,any> = {}; res.rows.forEach((r:any) => { try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value } })
  return Response.json(out)
}

async function saveSettings(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const { key, value } = await req.json()
  await db.query(`INSERT INTO admin_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`, [key, JSON.stringify(value)])
  return Response.json({ message: 'Saved' })
}

async function getMedia() {
  await db.query(`CREATE TABLE IF NOT EXISTS media_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(() => {})
  const res = await db.query('SELECT key,value FROM media_settings')
  const data: Record<string,string> = {}; res.rows.forEach((r: any) => { data[r.key] = r.value })
  return Response.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
}

async function saveMedia(req: NextRequest) {
  const { settings } = await req.json()
  for (const [k, v] of Object.entries(settings as Record<string,string>))
    await db.query(`INSERT INTO media_settings(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=$2,updated_at=NOW()`, [k, v])
  return Response.json({ message: 'Saved' })
}

// ─── cities ───────────────────────────────────────────────────────────────────

async function getCities() {
  await db.query(`CREATE TABLE IF NOT EXISTS seo_cities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE, state VARCHAR(120), sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(() => {})
  const res = await db.query('SELECT * FROM seo_cities ORDER BY sort_order ASC, name ASC')
  return Response.json({ cities: res.rows }, { headers: { 'Cache-Control': 'no-store' } })
}

async function saveCities(req: NextRequest) {
  const { cities } = await req.json()
  for (const c of cities)
    await db.query(`INSERT INTO seo_cities(name,slug,state,sort_order,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT(slug) DO UPDATE SET name=$1,state=$3,sort_order=$4`, [c.name, c.slug||c.name.toLowerCase().replace(/\s+/g,'-'), c.state||'', c.sort_order||0])
  return Response.json({ message: 'Saved' })
}

async function deleteCity(req: NextRequest) {
  const { slug } = await req.json()
  await db.query('DELETE FROM seo_cities WHERE slug=$1', [slug])
  return Response.json({ success: true })
}

// ─── lead pricing defaults ────────────────────────────────────────────────────

async function ensureLeadPricingTables() {
  await runOnce('lead_pricing', async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  await db.query(`CREATE TABLE IF NOT EXISTS state_lead_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(120) NOT NULL UNIQUE,
    default_price_paise INTEGER NOT NULL DEFAULT 29900,
    min_price_paise INTEGER NOT NULL DEFAULT 9900,
    max_price_paise INTEGER NOT NULL DEFAULT 99900,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {})
  }) // end runOnce
}

async function getLeadPricingDefaults() {
  await ensureLeadPricingTables()
  const [globalRes, stateRes] = await Promise.all([
    db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'"),
    db.query("SELECT * FROM state_lead_pricing ORDER BY state ASC"),
  ])
  const DEFAULTS = {
    defaultPricePaise: 29900,
    minPricePaise: 9900,
    maxPricePaise: 99900,
    maskBlurMeters: 1000,
    leadExpiryDays: 30,
  }
  let global = DEFAULTS
  if (globalRes.rows.length) {
    const saved = JSON.parse(globalRes.rows[0].value)
    if (saved.pricePerLead && !saved.defaultPricePaise) {
      global = { ...DEFAULTS, defaultPricePaise: saved.pricePerLead * 100 }
    } else {
      global = { ...DEFAULTS, ...saved }
    }
  }
  const statePricing = stateRes.rows.map((r: any) => ({
    id: r.id,
    state: r.state,
    defaultPricePaise: r.default_price_paise,
    minPricePaise: r.min_price_paise,
    maxPricePaise: r.max_price_paise,
    isActive: r.is_active,
  }))
  return NextResponse.json({ ...global, statePricing })
}

async function saveLeadPricingDefaults(req: NextRequest) {
  await ensureLeadPricingTables()
  const body = await req.json()
  const { statePricing, ...global } = body
  await db.query(
    `INSERT INTO admin_settings (key,value,updated_at) VALUES ('lead_pricing_defaults',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`,
    [JSON.stringify(global)]
  )
  if (Array.isArray(statePricing)) {
    for (const sp of statePricing) {
      await db.query(
        `INSERT INTO state_lead_pricing (state, default_price_paise, min_price_paise, max_price_paise, is_active, updated_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (state) DO UPDATE SET default_price_paise=$2, min_price_paise=$3, max_price_paise=$4, is_active=$5, updated_at=NOW()`,
        [sp.state, sp.defaultPricePaise, sp.minPricePaise, sp.maxPricePaise, sp.isActive !== false]
      )
    }
  }
  return NextResponse.json({ success: true })
}

// ─── notifications ────────────────────────────────────────────────────────────

async function sendNotification(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), audience VARCHAR(50), title TEXT, body TEXT, sent_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const { audience, title, body } = await req.json()
  await db.query('INSERT INTO notifications (audience,title,body) VALUES ($1,$2,$3)', [audience, title, body])
  return NextResponse.json({ success: true, message: 'Notification logged' })
}

// ─── message triggers ─────────────────────────────────────────────────────────

const DEFAULT_TRIGGERS = [
  { trigger_key:'welcome_school',              category:'Onboarding',   event:'School Registration',        description:'Sent when a school admin creates an account',               recipients:['school'], variables:['{{school_name}}','{{admin_name}}','{{login_url}}','{{profile_url}}'],
    email_school_subject:'Welcome to Thynk Schooling — {{school_name}} is now live!',
    email_school_body:`Hi {{admin_name}},\n\nCongratulations! {{school_name}} is now listed on Thynk Schooling.\n\nNext steps:\n• Complete your school profile\n• Your Free plan includes 5 lead credits\n• Parents in your city can now find and apply\n\nLogin: {{login_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`Hi {{admin_name}} 👋\n\n*{{school_name}}* is now live on Thynk Schooling!\n\nComplete your profile to start receiving leads 👉 {{profile_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:0 },
  { trigger_key:'welcome_parent',              category:'Onboarding',   event:'Parent Registration',        description:'Sent when a parent creates an account',                     recipients:['parent'], variables:['{{parent_name}}','{{login_url}}','{{search_url}}'],
    email_school_subject:'', email_school_body:'', email_school_enabled:false,
    email_parent_subject:'Welcome to Thynk Schooling, {{parent_name}}!',
    email_parent_body:`Hi {{parent_name}},\n\nWelcome! You now have access to 12,000+ verified schools across 350+ Indian cities.\n\nStart searching: {{search_url}}\n\nThe Thynk Schooling Team`,
    email_parent_enabled:true,
    wa_school_body:'', wa_school_enabled:false,
    wa_parent_body:`Hi {{parent_name}} 👋\n\nWelcome to *Thynk Schooling*! 🎓\n\nSearch 12,000+ verified schools across India 👉 {{search_url}}`,
    wa_parent_enabled:true, sort_order:1 },
  { trigger_key:'new_lead_school',             category:'Leads',        event:'New Lead Received',          description:'School notified when a parent submits an enquiry',          recipients:['school'], variables:['{{school_name}}','{{admin_name}}','{{child_name}}','{{class_applying}}','{{city}}','{{lead_count}}','{{dashboard_url}}'],
    email_school_subject:'New admission enquiry for {{school_name}} — {{child_name}}',
    email_school_body:`Hi {{admin_name}},\n\nNew admission enquiry!\nChild: {{child_name}} | Class: {{class_applying}} | City: {{city}}\n\nYou have {{lead_count}} unread leads. Unlock to see full contact details.\n\nDashboard: {{dashboard_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`🔔 *New lead for {{school_name}}!*\n\nChild: {{child_name}}\nClass: {{class_applying}} | City: {{city}}\n\nUnlock contact details 👉 {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:3 },
  { trigger_key:'application_confirmation',    category:'Leads',        event:'Application Submitted',      description:'Parent receives confirmation after submitting an enquiry',  recipients:['parent'], variables:['{{parent_name}}','{{child_name}}','{{school_name}}','{{class_applying}}','{{applications_url}}'],
    email_school_subject:'', email_school_body:'', email_school_enabled:false,
    email_parent_subject:'Application submitted — {{school_name}}',
    email_parent_body:`Hi {{parent_name}},\n\nYour admission enquiry has been submitted!\n\nSchool: {{school_name}}\nChild: {{child_name}} | Class: {{class_applying}}\n\nTrack applications: {{applications_url}}\n\nThe Thynk Schooling Team`,
    email_parent_enabled:true,
    wa_school_body:'', wa_school_enabled:false,
    wa_parent_body:`✅ *Application submitted!*\n\nHi {{parent_name}}, your enquiry for *{{school_name}}* ({{child_name}}, Class {{class_applying}}) is received.\n\nTrack it here 👉 {{applications_url}}`,
    wa_parent_enabled:true, sort_order:4 },
  { trigger_key:'subscription_activated',      category:'Subscription', event:'Plan Activated',             description:'School upgrades to a paid plan',                            recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{plan_name}}','{{credits_added}}','{{amount_paid}}','{{next_billing}}','{{dashboard_url}}'],
    email_school_subject:'{{plan_name}} plan activated for {{school_name}} 🎉',
    email_school_body:`Hi {{admin_name}},\n\nYour {{plan_name}} plan is now active for {{school_name}}!\n\nCredits added: {{credits_added}}\nAmount: ₹{{amount_paid}} | Next billing: {{next_billing}}\n\nDashboard: {{dashboard_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`🎉 *{{plan_name}} plan activated!*\n\n{{school_name}} is now on {{plan_name}}.\nCredits added: *{{credits_added}}* | Next billing: {{next_billing}}\n\nDashboard: {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:7 },
]

async function ensureTriggersTable() {
  await runOnce('message_triggers', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS message_triggers (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trigger_key     VARCHAR(100) NOT NULL UNIQUE,
      category        VARCHAR(100) NOT NULL DEFAULT 'General',
      event           VARCHAR(200) NOT NULL,
      description     TEXT,
      recipients      TEXT NOT NULL DEFAULT '[]',
      variables       TEXT NOT NULL DEFAULT '[]',
      email_school_subject  TEXT DEFAULT '',
      email_school_body     TEXT DEFAULT '',
      email_school_enabled  BOOLEAN DEFAULT false,
      email_parent_subject  TEXT DEFAULT '',
      email_parent_body     TEXT DEFAULT '',
      email_parent_enabled  BOOLEAN DEFAULT false,
      wa_school_body        TEXT DEFAULT '',
      wa_school_enabled     BOOLEAN DEFAULT false,
      wa_parent_body        TEXT DEFAULT '',
      wa_parent_enabled     BOOLEAN DEFAULT false,
      sort_order      INTEGER DEFAULT 0,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  const ct = await db.query('SELECT COUNT(*) FROM message_triggers').catch(() => ({ rows:[{ count:'0' }] }))
  if (parseInt(ct.rows[0].count) === 0) {
    for (const t of DEFAULT_TRIGGERS) {
      await db.query(
        `INSERT INTO message_triggers
          (trigger_key,category,event,description,recipients,variables,
           email_school_subject,email_school_body,email_school_enabled,
           email_parent_subject,email_parent_body,email_parent_enabled,
           wa_school_body,wa_school_enabled,wa_parent_body,wa_parent_enabled,sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (trigger_key) DO NOTHING`,
        [
          t.trigger_key, t.category, t.event, t.description,
          JSON.stringify(t.recipients), JSON.stringify(t.variables),
          t.email_school_subject, t.email_school_body, t.email_school_enabled,
          t.email_parent_subject, t.email_parent_body, t.email_parent_enabled,
          t.wa_school_body, t.wa_school_enabled, t.wa_parent_body, t.wa_parent_enabled,
          t.sort_order,
        ]
      ).catch(() => {})
    }
  }
  }) // end runOnce
}

function toTrigger(row: any) {
  return {
    id: row.id, triggerKey: row.trigger_key, category: row.category,
    event: row.event, description: row.description || '',
    recipients: (() => { try { return JSON.parse(row.recipients) } catch { return [] } })(),
    variables:  (() => { try { return JSON.parse(row.variables)  } catch { return [] } })(),
    email: {
      school: { subject: row.email_school_subject || '', body: row.email_school_body || '', enabled: !!row.email_school_enabled },
      parent: { subject: row.email_parent_subject || '', body: row.email_parent_body || '', enabled: !!row.email_parent_enabled },
    },
    whatsapp: {
      school: { body: row.wa_school_body || '', enabled: !!row.wa_school_enabled },
      parent: { body: row.wa_parent_body || '', enabled: !!row.wa_parent_enabled },
    },
    sortOrder: row.sort_order,
  }
}

async function getTriggers() {
  await ensureTriggersTable()
  const rows = await db.query('SELECT * FROM message_triggers ORDER BY sort_order ASC, created_at ASC')
  return NextResponse.json(rows.rows.map(toTrigger))
}

async function saveTrigger(req: NextRequest) {
  await ensureTriggersTable()
  const body = await req.json()
  const { triggerKey, category, event, description, recipients, variables, email, whatsapp, sortOrder } = body
  if (!triggerKey || !event) return NextResponse.json({ error: 'triggerKey and event required' }, { status: 400 })
  const res = await db.query(
    `INSERT INTO message_triggers
      (trigger_key,category,event,description,recipients,variables,
       email_school_subject,email_school_body,email_school_enabled,
       email_parent_subject,email_parent_body,email_parent_enabled,
       wa_school_body,wa_school_enabled,wa_parent_body,wa_parent_enabled,sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (trigger_key) DO UPDATE SET
       category=$2, event=$3, description=$4, recipients=$5, variables=$6,
       email_school_subject=$7,  email_school_body=$8,  email_school_enabled=$9,
       email_parent_subject=$10, email_parent_body=$11, email_parent_enabled=$12,
       wa_school_body=$13, wa_school_enabled=$14, wa_parent_body=$15, wa_parent_enabled=$16,
       sort_order=$17, updated_at=NOW()
     RETURNING *`,
    [
      triggerKey, category || 'General', event, description || '',
      JSON.stringify(recipients ?? []), JSON.stringify(variables ?? []),
      email?.school?.subject || '', email?.school?.body || '', email?.school?.enabled ?? false,
      email?.parent?.subject || '', email?.parent?.body || '', email?.parent?.enabled ?? false,
      whatsapp?.school?.body || '', whatsapp?.school?.enabled ?? false,
      whatsapp?.parent?.body || '', whatsapp?.parent?.enabled ?? false,
      sortOrder ?? 0,
    ]
  )
  return NextResponse.json(toTrigger(res.rows[0]))
}

async function deleteTrigger(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('DELETE FROM message_triggers WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

async function health() {
  try { await db.query('SELECT 1'); return Response.json({ db: 'connected' }) }
  catch (e: any) { return Response.json({ db: 'error', message: e.message }, { status: 500 }) }
}

// ─── seed demo ────────────────────────────────────────────────────────────────

async function seedDemo() {
  const schoolHash = await bcrypt.hash('School@123', 10)
  const parentHash = await bcrypt.hash('Parent@123', 10)
  await db.query(
    `INSERT INTO users (phone,password_hash,role,full_name,is_active,profile_completed) VALUES ('9000000001',$1,'school_admin','Demo School Admin',true,false),('9000000002',$2,'parent','Demo Parent User',true,false) ON CONFLICT (phone) DO UPDATE SET password_hash=EXCLUDED.password_hash,full_name=EXCLUDED.full_name,is_active=true`,
    [schoolHash, parentHash]
  )
  return NextResponse.json({ success: true, credentials: [{ role:'School Admin', phone:'9000000001', password:'School@123', dashboard:'/dashboard/school' },{ role:'Parent', phone:'9000000002', password:'Parent@123', dashboard:'/dashboard/parent' }] })
}

// ─── marquee ──────────────────────────────────────────────────────────────────

async function ensureMarqueeTable() {
  await runOnce('marquee_items', async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS marquee_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    text TEXT NOT NULL,
    emoji TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {})
  }) // end runOnce
}

async function getMarqueeItems() {
  await ensureMarqueeTable()
  const r = await db.query(`SELECT id, text, emoji, sort_order FROM marquee_items WHERE is_active=true ORDER BY sort_order, created_at`).catch(() => ({ rows: [] }))
  if (!r.rows.length) {
    const defaults = [
      {emoji:'🏫',text:'12,000+ Verified Schools Across India'},
      {emoji:'⭐',text:'Trusted by 1 Lakh+ Parents'},
      {emoji:'🎓',text:'CBSE · ICSE · IB · State Board Schools'},
      {emoji:'🏙️',text:'Schools in 350+ Indian Cities'},
      {emoji:'🤖',text:'AI-Powered School Recommendations'},
      {emoji:'✅',text:'Free to Use for Parents — Always'},
      {emoji:'📋',text:'One-Click Admission Applications'},
      {emoji:'💬',text:'1-on-1 Expert Counselling Available'},
    ]
    for (let i=0;i<defaults.length;i++) {
      await db.query(`INSERT INTO marquee_items(text,emoji,sort_order) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[defaults[i].text,defaults[i].emoji,i]).catch(()=>{})
    }
    const r2 = await db.query(`SELECT id,text,emoji,sort_order FROM marquee_items WHERE is_active=true ORDER BY sort_order`).catch(()=>({rows:[]}))
    return NextResponse.json({ items: r2.rows })
  }
  return NextResponse.json({ items: r.rows })
}

async function saveMarqueeItems(req: NextRequest) {
  await ensureMarqueeTable()
  const { items } = await req.json()
  await db.query(`DELETE FROM marquee_items`).catch(() => {})
  for (let i=0;i<(items||[]).length;i++) {
    const it = items[i]
    await db.query(`INSERT INTO marquee_items(id,text,emoji,sort_order,is_active) VALUES(COALESCE($1,gen_random_uuid()::text),$2,$3,$4,true)`,
      [it.id||null, it.text||'', it.emoji||'', i]).catch(()=>{})
  }
  return NextResponse.json({ success: true })
}

// ─── blog ─────────────────────────────────────────────────────────────────────

const SEED_BLOG_POSTS = [
  { slug:'cbse-vs-icse-vs-ib', title:'CBSE vs ICSE vs IB: Which Board is Right for Your Child?', excerpt:"A comprehensive breakdown of India's three major education boards — curriculum, assessment style, career impact and which suits different types of learners.", tag:'Board Guide', read_time:'8 min', published_at:'2026-01-15', status:'published', cover_image:'', meta_title:'', meta_desc:'', author:'Thynk Schooling Team',
    body:`<h2>Choosing the Right Board for Your Child</h2><p>Choosing the right education board is one of the most important decisions a parent makes. Each board has a distinct philosophy, curriculum depth, and career alignment.</p><h2>CBSE — Central Board of Secondary Education</h2><p>India's most popular board with over 25,000 schools. CBSE is strong in science and mathematics and its syllabus aligns perfectly with competitive exams like JEE and NEET.</p><h2>ICSE — Indian Certificate of Secondary Education</h2><p>ICSE has a broader curriculum with strong emphasis on English, arts and social sciences. Ideal for students considering humanities or studying abroad.</p><h2>IB — International Baccalaureate</h2><p>The IB Diploma Programme is accepted by universities worldwide and develops critical thinking, research and communication skills.</p>` },
  { slug:'how-to-choose-school', title:'How to Choose the Right School: 10 Questions to Ask', excerpt:'Visiting a school? Here are the 10 most important questions to ask the principal or admission coordinator before you commit.', tag:'Admission Tips', read_time:'6 min', published_at:'2026-02-10', status:'published', cover_image:'', meta_title:'', meta_desc:'', author:'Thynk Schooling Team',
    body:`<h2>10 Questions Every Parent Must Ask</h2><p>Visiting a school can be overwhelming. Here are 10 questions that cut through the noise.</p><h3>1. What is the student-teacher ratio?</h3><p>Anything above 30:1 means your child gets less individual attention.</p><h3>2. What percentage of students pass board exams?</h3><p>Ask for the last 3 years data.</p>` },
]

async function ensureBlogTable() {
  await runOnce('blog_posts', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug          VARCHAR(300) NOT NULL UNIQUE,
      title         TEXT NOT NULL DEFAULT '',
      excerpt       TEXT DEFAULT '',
      body          TEXT DEFAULT '',
      tag           VARCHAR(120) DEFAULT 'Admission Tips',
      read_time     VARCHAR(50) DEFAULT '5 min',
      published_at  DATE DEFAULT CURRENT_DATE,
      status        VARCHAR(20) DEFAULT 'draft',
      cover_image   VARCHAR(500) DEFAULT '',
      meta_title    TEXT DEFAULT '',
      meta_desc     TEXT DEFAULT '',
      author        VARCHAR(200) DEFAULT 'Thynk Schooling Team',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  const cols = [
    "ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS meta_desc TEXT DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS author VARCHAR(200) DEFAULT 'Thynk Schooling Team'",
  ]
  for (const col of cols) await db.query(`ALTER TABLE blog_posts ${col}`).catch(() => {})
  const ct = await db.query('SELECT COUNT(*) FROM blog_posts').catch(() => ({ rows:[{ count:'0' }] }))
  if (parseInt(ct.rows[0].count) === 0) {
    for (const p of SEED_BLOG_POSTS) {
      await db.query(
        `INSERT INTO blog_posts (slug,title,excerpt,body,tag,read_time,published_at,status,cover_image,meta_title,meta_desc,author)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (slug) DO NOTHING`,
        [p.slug,p.title,p.excerpt,p.body,p.tag,p.read_time,p.published_at,p.status,p.cover_image,p.meta_title,p.meta_desc,p.author]
      ).catch(() => {})
    }
  }
  }) // end runOnce
}

function toBlogPost(row: any) {
  return {
    id: row.id, slug: row.slug || '', title: row.title || '', excerpt: row.excerpt || '',
    body: row.body || '', tag: row.tag || 'Admission Tips', readTime: row.read_time || '5 min',
    publishedAt: row.published_at ? String(row.published_at).slice(0, 10) : '',
    status: row.status || 'draft', coverImage: row.cover_image || '',
    metaTitle: row.meta_title || '', metaDesc: row.meta_desc || '',
    author: row.author || 'Thynk Schooling Team',
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

async function getBlogPosts(req: NextRequest) {
  await ensureBlogTable()
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const status = searchParams.get('status')
  const isAdmin = searchParams.get('admin') === '1'
  if (slug) {
    const res = await db.query(`SELECT * FROM blog_posts WHERE slug=$1${isAdmin ? '' : " AND status='published'"}`, [slug])
    if (!res.rows.length) return NextResponse.json({ post: null }, { status: 404 })
    return NextResponse.json({ post: toBlogPost(res.rows[0]) })
  }
  const conds: string[] = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`status=$${params.length}`) }
  if (!isAdmin) conds.push("status='published'")
  const rows = await db.query(`SELECT * FROM blog_posts WHERE ${conds.join(' AND ')} ORDER BY published_at DESC, created_at DESC`, params)
  return NextResponse.json({ posts: rows.rows.map(toBlogPost) })
}

async function createBlogPost(req: NextRequest) {
  await ensureBlogTable()
  const body = await req.json()
  const { slug, title, excerpt, body: content, tag, readTime, publishedAt, status, coverImage, metaTitle, metaDesc, author } = body
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  const res = await db.query(
    `INSERT INTO blog_posts (slug,title,excerpt,body,tag,read_time,published_at,status,cover_image,meta_title,meta_desc,author)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [slug, title||'', excerpt||'', content||'', tag||'Admission Tips', readTime||'5 min',
     publishedAt||new Date().toISOString().slice(0,10), status||'draft',
     coverImage||'', metaTitle||'', metaDesc||'', author||'Thynk Schooling Team']
  )
  return NextResponse.json({ post: toBlogPost(res.rows[0]) })
}

async function updateBlogPost(req: NextRequest) {
  await ensureBlogTable()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  const map: Record<string, string> = {
    slug:'slug', title:'title', excerpt:'excerpt', body:'body', tag:'tag',
    readTime:'read_time', publishedAt:'published_at', status:'status',
    coverImage:'cover_image', metaTitle:'meta_title', metaDesc:'meta_desc', author:'author',
  }
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) { params.push(body[k]); sets.push(`${col}=$${params.length}`) }
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push(`updated_at=NOW()`)
  params.push(id)
  const res = await db.query(`UPDATE blog_posts SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params)
  if (!res.rows.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ post: toBlogPost(res.rows[0]) })
}

async function deleteBlogPost(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('DELETE FROM blog_posts WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─── menu management ──────────────────────────────────────────────────────────

async function ensureMenuTable() {
  await runOnce('site_menus', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_menus (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      menu_key   VARCHAR(50) NOT NULL UNIQUE,
      items      TEXT NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  }) // end runOnce
}

const DEFAULT_NAVBAR = [
  { label:'Find Schools', href:'/schools', location:'navbar' },
  { label:'Compare',      href:'/compare', location:'navbar' },
  { label:'Counselling',  href:'/counselling', location:'navbar' },
  { label:'Blog',         href:'/blog', location:'navbar' },
]

const DEFAULT_FOOTER: Record<string, Array<{label:string;href:string}>> = {
  'For Parents': [{label:'Find Schools',href:'/schools'},{label:'Compare Schools',href:'/compare'},{label:'Free Counselling',href:'/counselling'},{label:'AI Recommendations',href:'/recommendations'},{label:'Admission Guide',href:'/blog/admission-guide'}],
  'For Schools':  [{label:'List Your School',href:'/register?role=school'},{label:'School Dashboard',href:'/dashboard/school'},{label:'Lead Marketplace',href:'/dashboard/school/leads'},{label:'Pricing Plans',href:'/pricing'},{label:'Success Stories',href:'/blog/success-stories'}],
  'Company':      [{label:'About Us',href:'/about'},{label:'Blog',href:'/blog'},{label:'Careers',href:'/careers'},{label:'Press',href:'/press'},{label:'Contact Us',href:'/contact'}],
  'Legal':        [{label:'Privacy Policy',href:'/privacy'},{label:'Terms of Service',href:'/terms'},{label:'Refund Policy',href:'/refund'},{label:'Grievance Officer',href:'/grievance'}],
}

async function getMenus() {
  await ensureMenuTable()
  const [navRes, footerRes] = await Promise.all([
    db.query("SELECT items FROM site_menus WHERE menu_key='navbar'"),
    db.query("SELECT items FROM site_menus WHERE menu_key='footer'"),
  ])
  const navbar = navRes.rows.length ? JSON.parse(navRes.rows[0].items) : DEFAULT_NAVBAR
  const footer = footerRes.rows.length ? JSON.parse(footerRes.rows[0].items) : DEFAULT_FOOTER
  return NextResponse.json({ navbar, footer }, { headers: { 'Cache-Control': 'no-store' } })
}

async function saveMenus(req: NextRequest) {
  await ensureMenuTable()
  const { navbar, footer } = await req.json()
  if (navbar) await db.query(
    `INSERT INTO site_menus(menu_key,items,updated_at) VALUES('navbar',$1,NOW()) ON CONFLICT(menu_key) DO UPDATE SET items=$1,updated_at=NOW()`,
    [JSON.stringify(navbar)]
  )
  if (footer) await db.query(
    `INSERT INTO site_menus(menu_key,items,updated_at) VALUES('footer',$1,NOW()) ON CONFLICT(menu_key) DO UPDATE SET items=$1,updated_at=NOW()`,
    [JSON.stringify(footer)]
  )
  return NextResponse.json({ success: true })
}

// ─── payment gateways ─────────────────────────────────────────────────────────

async function getPaymentGateways() {
  const { ensureGatewayTable, getGatewayConfigs } = await import('@/lib/payment-gateway')
  await ensureGatewayTable()
  const configs = await getGatewayConfigs()
  const safe = configs.map(g => ({
    id: g.id, name: g.name, enabled: g.enabled, priority: g.priority,
    keyId: g.keyId,
    keySecret: g.keySecret ? '••••••••' + g.keySecret.slice(-4) : '',
    extra: g.extra, mode: g.mode,
  }))
  return NextResponse.json({ gateways: safe })
}

async function savePaymentGateways(req: NextRequest) {
  const { ensureGatewayTable } = await import('@/lib/payment-gateway')
  await ensureGatewayTable()
  const { gateways } = await req.json()
  if (!Array.isArray(gateways)) return NextResponse.json({ error: 'gateways array required' }, { status: 400 })
  for (const g of gateways) {
    if (g.keySecret && !g.keySecret.startsWith('••')) {
      await db.query(
        `UPDATE payment_gateways SET enabled=$1, priority=$2, key_id=$3, extra=$4, mode=$5, key_secret=$6, updated_at=NOW() WHERE id=$7`,
        [g.enabled, g.priority, g.keyId, JSON.stringify(g.extra || {}), g.mode, g.keySecret, g.id]
      ).catch(() => {})
    } else {
      await db.query(
        `UPDATE payment_gateways SET enabled=$1, priority=$2, key_id=$3, extra=$4, mode=$5, updated_at=NOW() WHERE id=$6`,
        [g.enabled, g.priority, g.keyId, JSON.stringify(g.extra || {}), g.mode, g.id]
      ).catch(() => {})
    }
  }
  return NextResponse.json({ success: true })
}

// ─── discount coupons ─────────────────────────────────────────────────────────

async function ensureCouponsTable() {
  await runOnce('discount_coupons', async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS discount_coupons (
      id                  SERIAL PRIMARY KEY,
      code                VARCHAR(50) UNIQUE NOT NULL,
      type                VARCHAR(10) NOT NULL DEFAULT 'percent',
      value               NUMERIC NOT NULL,
      min_amount          NUMERIC NOT NULL DEFAULT 0,
      max_uses            INTEGER,
      used_count          INTEGER NOT NULL DEFAULT 0,
      valid_from          TIMESTAMPTZ,
      valid_until         TIMESTAMPTZ,
      applicable_gateways TEXT[] DEFAULT '{}',
      active              BOOLEAN NOT NULL DEFAULT true,
      description         TEXT DEFAULT '',
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  }) // end runOnce
}

async function getCoupons() {
  await ensureCouponsTable()
  const res = await db.query('SELECT * FROM discount_coupons ORDER BY created_at DESC')
  return NextResponse.json({ coupons: res.rows })
}

async function createCoupon(req: NextRequest) {
  await ensureCouponsTable()
  const b = await req.json()
  if (!b.code) return NextResponse.json({ error: 'code required' }, { status: 400 })
  const code = b.code.trim().toUpperCase()
  const res = await db.query(
    `INSERT INTO discount_coupons (code,type,value,min_amount,max_uses,valid_from,valid_until,applicable_gateways,active,description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [code, b.type||'percent', Number(b.value)||0, Number(b.min_amount)||0,
     b.max_uses?Number(b.max_uses):null, b.valid_from||null, b.valid_until||null,
     b.applicable_gateways||[], b.active!==false, b.description||'']
  )
  return NextResponse.json({ coupon: res.rows[0] })
}

async function updateCoupon(req: NextRequest) {
  await ensureCouponsTable()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const b = await req.json()
  const code = b.code?.trim().toUpperCase()
  await db.query(
    `UPDATE discount_coupons SET code=$1,type=$2,value=$3,min_amount=$4,max_uses=$5,
     valid_from=$6,valid_until=$7,applicable_gateways=$8,active=$9,description=$10,updated_at=NOW() WHERE id=$11`,
    [code, b.type||'percent', Number(b.value)||0, Number(b.min_amount)||0,
     b.max_uses?Number(b.max_uses):null, b.valid_from||null, b.valid_until||null,
     b.applicable_gateways||[], b.active!==false, b.description||'', id]
  )
  return NextResponse.json({ success: true })
}

async function deleteCoupon(req: NextRequest) {
  await ensureCouponsTable()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.query('DELETE FROM discount_coupons WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─── Module-level startup: runs once when the route module is first imported ──
// This fires indexes + all migrations eagerly so the first real request is fast.
;(async () => {
  try { await ensureIndexes() } catch {}
})()

// ─── DB indexes (created once at startup) ────────────────────────────────────
// These eliminate the slow sequential scans on leads, payments, schools queries.
async function ensureIndexes() {
  await runOnce('indexes', async () => {
    const idxs = [
      'CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON leads(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_leads_school_id       ON leads(school_id)',
      'CREATE INDEX IF NOT EXISTS idx_leads_parent_id       ON leads(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_leads_is_purchased    ON leads(is_purchased)',
      'CREATE INDEX IF NOT EXISTS idx_lpp_created_at        ON lead_package_payments(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_lpp_school_id         ON lead_package_payments(school_id)',
      'CREATE INDEX IF NOT EXISTS idx_lpp_status            ON lead_package_payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at_role ON users(created_at, role)',
      'CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_schools_city          ON schools(city)',
      'CREATE INDEX IF NOT EXISTS idx_schools_admin_user    ON schools(admin_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_schools_verified      ON schools(is_verified)',
      'CREATE INDEX IF NOT EXISTS idx_applications_school   ON applications(school_id)',
      'CREATE INDEX IF NOT EXISTS idx_applications_parent   ON applications(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_applications_status   ON applications(status)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_school        ON reviews(school_id)',
    ]
    await Promise.all(idxs.map(sql => db.query(sql).catch(() => {})))
  })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'overview':              return await getOverview()
      case 'analytics':             return await getAnalytics()
      case 'schools':               return await getAdminSchools(req)
      case 'users': {
        const uid = new URL(req.url).searchParams.get('id')
        if (uid) {
          const r = await db.query(`SELECT u.id, COALESCE(u.full_name,u.name) AS full_name, COALESCE(u.phone,u.mobile) AS phone, u.email, u.role, COALESCE(u.is_active,true) AS is_active, u.profile_completed, u.last_login_at, u.created_at, s.name AS school_name FROM users u LEFT JOIN schools s ON s.admin_user_id=u.id WHERE u.id=$1`, [uid]).catch(() => ({ rows: [] }))
          if (!r.rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
          const u = r.rows[0]
          return NextResponse.json({ user: { id: u.id, fullName: u.full_name||'—', phone: u.phone||'—', email: u.email||null, role: u.role, school: u.school_name||null, schoolName: u.school_name||null, profileDone: u.profile_completed||false, lastLogin: u.last_login_at||null, joinedAt: u.created_at, status: u.is_active===false?'suspended':'active' } })
        }
        return await getAdminUsers(req)
      }
      case 'applications':          return await getAdminApplications(req)
      case 'reviews':               return await getAdminReviews(req)
      case 'leads':                 return await getAdminLeads(req)
      case 'payments':              return await getAdminPayments(req)
      case 'counselling':           return await getAdminCounselling(req)
      case 'content':               return await getContent(req)
      case 'theme':                 return await getTheme()
      case 'seo':                   return await getSeo(req)
      case 'settings':              return await getSettings()
      case 'media':                 return await getMedia()
      case 'cities':                return await getCities()
      case 'lead-pricing-defaults': return await getLeadPricingDefaults()
      case 'subscription-plans':    return await getSubPlans()
      case 'message-triggers':      return await getTriggers()
      case 'marquee-items':         return await getMarqueeItems()
      case 'blog':                  return await getBlogPosts(req)
      case 'menus':                 return await getMenus()
      case 'payment-gateways':      return await getPaymentGateways()
      case 'coupons':               return await getCoupons()
      case 'seed-demo':             return NextResponse.json({ info: 'POST to seed demo users', credentials: [{ role:'School Admin', phone:'9000000001', password:'School@123' },{ role:'Parent', phone:'9000000002', password:'Parent@123' }] })
      case 'health':                return await health()
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin GET:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'content':            return await saveContent(req)
      case 'theme':              return await saveTheme(req)
      case 'seo':                return await saveSeo(req)
      case 'settings':           return await saveSettings(req)
      case 'media':              return await saveMedia(req)
      case 'cities':             return await saveCities(req)
      case 'notifications':      return await sendNotification(req)
      case 'seed-demo':          return await seedDemo()
      case 'marquee-items':      return await saveMarqueeItems(req)
      case 'subscription-plans': return await saveSubPlan(req)
      case 'message-triggers':   return await saveTrigger(req)
      case 'blog':               return await createBlogPost(req)
      case 'menus':              return await saveMenus(req)
      case 'payment-gateways':   return await savePaymentGateways(req)
      case 'coupons':            return await createCoupon(req)
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin POST:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'schools':               return await updateAdminSchool(req)
      case 'users':                 return await updateAdminUser(req)
      case 'applications':          return await updateAdminApplication(req)
      case 'reviews':               return await updateAdminReview(req)
      case 'counselling':           return await updateAdminCounselling(req)
      case 'lead-pricing-defaults': return await saveLeadPricingDefaults(req)
      case 'subscription-plans':    return await updateSubPlan(req)
      case 'blog':                  return await updateBlogPost(req)
      case 'coupons':               return await updateCoupon(req)
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin PUT:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  try {
    switch (action) {
      case 'reviews':            return await deleteAdminReview(req)
      case 'cities':             return await deleteCity(req)
      case 'subscription-plans': return await deleteSubPlan(req)
      case 'message-triggers':   return await deleteTrigger(req)
      case 'blog':               return await deleteBlogPost(req)
      case 'coupons':            return await deleteCoupon(req)
      case 'theme':
        await db.query("DELETE FROM site_settings WHERE key='theme'").catch(() => {})
        return NextResponse.json({ success: true })
      case 'users': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        await db.query('DELETE FROM users WHERE id=$1', [id])
        return NextResponse.json({ success: true })
      }
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin DELETE:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  try {
    if (action === 'users-activity') return await getUserActivity(req)
    if (action === 'users') {
      const id = url.searchParams.get('id')
      const op = url.searchParams.get('op')
      if (id && op === 'suspend') {
        await db.query('UPDATE users SET is_active=false WHERE id=$1', [id])
        return NextResponse.json({ success: true })
      }
      return await updateAdminUser(req)
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
