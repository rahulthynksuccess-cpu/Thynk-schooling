export const dynamic = 'force-dynamic'
/**
 * Consolidated Admin Route  (replaces 20+ admin/* routes)
 *
 * All requests: /api/admin?action=<name>
 *
 * Actions: overview, analytics, schools, users, applications, reviews,
 *          leads, payments, counselling, notifications, content, theme,
 *          seo, settings, media, cities, lead-pricing-defaults, seed-demo, health
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

// ─── overview ─────────────────────────────────────────────────────────────────

async function getOverview() {
  await ensureSchoolsTable()
  const [users, schools, apps, leads, pendingSchoolsCt, newUsersToday, leadsToday,
         revenue, pendingApps, pendingReviews, reviews,
         weeklyLeads, monthlyGrowth, boardDist, appStatus,
         recentLeadsRows, recentUsersRows, pendingSchoolsRows] = await Promise.all([
    db.query("SELECT COUNT(*) FROM users WHERE role!='super_admin'").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM schools").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM applications").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM lead_purchases").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM schools WHERE (is_verified=false OR is_verified IS NULL)").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM users WHERE role!='super_admin' AND created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM lead_purchases WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COALESCE(SUM(amount),0) AS total FROM lead_purchases").catch(() => ({ rows: [{ total: 0 }] })),
    db.query("SELECT COUNT(*) FROM applications WHERE status='pending' OR status IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM reviews WHERE is_approved=false OR is_approved IS NULL").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM reviews").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT to_char(DATE(created_at),'Dy') AS day, COUNT(*) AS leads, COUNT(*)*300 AS revenue FROM lead_purchases WHERE created_at >= NOW()-INTERVAL '7 days' GROUP BY DATE(created_at), to_char(DATE(created_at),'Dy') ORDER BY DATE(created_at)").catch(() => ({ rows: [] })),
    db.query("SELECT to_char(DATE_TRUNC('month',created_at),'Mon') AS month, COUNT(*) AS users, COUNT(*) AS schools, COUNT(*) AS leads FROM users WHERE created_at >= NOW()-INTERVAL '6 months' GROUP BY DATE_TRUNC('month',created_at), to_char(DATE_TRUNC('month',created_at),'Mon') ORDER BY DATE_TRUNC('month',created_at)").catch(() => ({ rows: [] })),
    db.query("SELECT UNNEST(board) AS name, COUNT(*) AS value FROM schools WHERE board IS NOT NULL GROUP BY name ORDER BY value DESC LIMIT 5").catch(() => ({ rows: [] })),
    db.query("SELECT COALESCE(status,'pending') AS name, COUNT(*) AS value FROM applications GROUP BY status").catch(() => ({ rows: [] })),
    // recent leads for dashboard table
    db.query(`SELECT lp.id, s.name AS school_name, COALESCE(u.full_name,u.name) AS parent_name,
              lp.class_applied, lp.amount AS price, lp.is_purchased, lp.created_at
              FROM lead_purchases lp
              LEFT JOIN schools s ON s.id=lp.school_id
              LEFT JOIN users u ON u.id=lp.user_id
              ORDER BY lp.created_at DESC LIMIT 8`).catch(() => ({ rows: [] })),
    // recent users for dashboard sidebar
    db.query(`SELECT id, COALESCE(full_name,name) AS full_name, COALESCE(phone,mobile) AS phone, role
              FROM users WHERE role!='super_admin' ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
    // pending schools for dashboard sidebar
    db.query(`SELECT id, name, city FROM schools WHERE (is_verified=false OR is_verified IS NULL)
              ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
  ])
  const BOARD_COLORS: Record<string,string> = { CBSE:'#F5A623', ICSE:'#4F8EF7', State:'#00E5A0', IB:'#9B72FF' }
  const STATUS_COLORS: Record<string,string> = { pending:'#FBBF24', shortlisted:'#00E5A0', admitted:'#4F8EF7', rejected:'#FF5757' }
  return NextResponse.json({
    totalUsers: Number(users.rows[0].count),
    totalSchools: Number(schools.rows[0].count),
    totalApps: Number(apps.rows[0].count),
    totalLeads: Number(leads.rows[0].count),
    totalReviews: Number(reviews.rows[0].count),
    pendingVerification: Number(pendingSchoolsCt.rows[0].count),
    newUsersToday: Number(newUsersToday.rows[0].count),
    leadsToday: Number(leadsToday.rows[0].count),
    totalRevenue: Number(revenue.rows[0].total) * 100,
    pendingApps: Number(pendingApps.rows[0].count),
    pendingReviews: Number(pendingReviews.rows[0].count),
    leadsWeekly: weeklyLeads.rows.map((r:any) => ({ day: r.day, leads: Number(r.leads), revenue: Number(r.revenue) })),
    monthlyGrowth: monthlyGrowth.rows.map((r:any) => ({ month: r.month, users: Number(r.users), schools: Number(r.schools), leads: Number(r.leads) })),
    schoolsByBoard: boardDist.rows.map((r:any,i:number) => ({ name: r.name, value: Number(r.value), color: BOARD_COLORS[r.name] || ['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E'][i] || '#888' })),
    appStatus: appStatus.rows.map((r:any) => ({ name: r.name, value: Number(r.value), fill: STATUS_COLORS[r.name] || '#888' })),
    recentLeads: recentLeadsRows.rows.map((r:any) => ({
      id: r.id, schoolName: r.school_name||'—', parentName: r.parent_name||'—',
      classApplied: r.class_applied||'—', price: Number(r.price)||0,
      isPurchased: r.is_purchased||false, createdAt: r.created_at,
    })),
    recentUsers: recentUsersRows.rows.map((r:any) => ({
      id: r.id, fullName: r.full_name||'—', phone: r.phone||'—', role: r.role,
    })),
    pendingSchools: pendingSchoolsRows.rows,
  })
}

// ─── analytics ────────────────────────────────────────────────────────────────

async function getAnalytics() {
  const [signups30, schools30, leads30, topCities, boardDist, funnel] = await Promise.all([
    db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
    db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM schools WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
    db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count, COUNT(*)*300 AS revenue FROM lead_purchases WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
    db.query("SELECT s.city, COUNT(DISTINCT s.id) AS schools, COUNT(lp.id) AS leads FROM schools s LEFT JOIN lead_purchases lp ON lp.school_id=s.id WHERE s.city IS NOT NULL GROUP BY s.city ORDER BY leads DESC LIMIT 6").catch(() => ({ rows: [] })),
    db.query("SELECT UNNEST(board) AS name, COUNT(*) AS value FROM schools WHERE board IS NOT NULL GROUP BY name ORDER BY value DESC LIMIT 5").catch(() => ({ rows: [] })),
    db.query(`SELECT
      (SELECT COUNT(*) FROM users WHERE role!='super_admin') AS visitors,
      (SELECT COUNT(*) FROM schools) AS school_views,
      (SELECT COUNT(*) FROM lead_purchases) AS leads_purchased,
      (SELECT COUNT(*) FROM applications) AS applications`).catch(() => ({ rows: [{}] })),
  ])
  const BOARD_COLORS = ['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E']
  const f = funnel.rows[0] || {}
  return NextResponse.json({
    signups: signups30.rows,
    schools: schools30.rows,
    dailyLeads30: leads30.rows.map((r:any) => ({ day: String(r.day).slice(5), leads: Number(r.count), revenue: Number(r.revenue) })),
    topCities: topCities.rows.map((r:any) => ({ city: r.city, leads: Number(r.leads), schools: Number(r.schools) })),
    boardData: boardDist.rows.map((r:any, i:number) => ({ name: r.name, value: Number(r.value), color: BOARD_COLORS[i] || '#888' })),
    funnelData: [
      { name:'Registered Users', value: Number(f.visitors||0) },
      { name:'School Views',     value: Number(f.school_views||0) },
      { name:'Leads Purchased',  value: Number(f.leads_purchased||0) },
      { name:'Applications',     value: Number(f.applications||0) },
    ],
  })
}

// ─── schools ──────────────────────────────────────────────────────────────────

async function ensureSchoolsTable() {
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
    'ADD COLUMN IF NOT EXISTS board TEXT[]',
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
      city: s.city || '—', board: Array.isArray(s.board) ? s.board : [],
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
  await db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, school_id UUID, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
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
  await db.query(`CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID, user_id UUID, rating INTEGER, content TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
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
  const page = Math.max(1,Number(searchParams.get('page')||1)), limit = Math.min(50,Number(searchParams.get('limit')||20))
  const offset = (page-1)*limit, status = searchParams.get('status')
  const conds = ['1=1']; const params: any[] = []
  if (status) { params.push(status); conds.push(`lp.status=$${params.length}`) }
  const where = conds.join(' AND '); params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`SELECT lp.*, s.name AS school_name, u.full_name AS parent_name FROM lead_purchases lp LEFT JOIN schools s ON s.id=lp.school_id LEFT JOIN users u ON u.id=lp.parent_id WHERE ${where} ORDER BY lp.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*) FROM lead_purchases lp WHERE ${where}`, params.slice(0,-2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

// ─── payments ─────────────────────────────────────────────────────────────────

async function getAdminPayments(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1,Number(searchParams.get('page')||1)), limit = Math.min(50,Number(searchParams.get('limit')||20))
  const offset = (page-1)*limit
  const rows = await db.query('SELECT lp.*, s.name AS school_name FROM lead_purchases lp LEFT JOIN schools s ON s.id=lp.school_id ORDER BY lp.created_at DESC LIMIT $1 OFFSET $2', [limit, offset]).catch(() => ({ rows: [] }))
  const ct = await db.query('SELECT COUNT(*) FROM lead_purchases').catch(() => ({ rows: [{ count: 0 }] }))
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
}

// ─── counselling (admin) ──────────────────────────────────────────────────────

async function getAdminCounselling(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS counselling_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID, name VARCHAR(200), phone VARCHAR(20), city VARCHAR(100), status VARCHAR(50) DEFAULT 'pending', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
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
  { name:'Free',    price_paise:0,     description:'Get listed and start receiving leads.',          features:['5 lead credits per month','Basic school profile','Up to 5 photos','Standard listing placement','Email support'],                                                                                  leads_per_month:5,   is_hot:false, cta:'Get Started Free', plan_key:'free' },
  { name:'Silver',  price_paise:299900,description:'For schools serious about admissions.',          features:['25 lead credits per month','Verified school badge','Unlimited photos & video','Enhanced listing placement','Analytics dashboard','Priority email support'],                                    leads_per_month:25,  is_hot:false, cta:'Start Silver',     plan_key:'silver' },
  { name:'Gold',    price_paise:599900,description:'Most popular — best ROI for growing schools.',   features:['75 lead credits per month','Featured school badge','Top placement in search','Full analytics & reports','School profile video','Dedicated account manager','WhatsApp support'],                leads_per_month:75,  is_hot:true,  cta:'Start Gold',       plan_key:'gold' },
  { name:'Platinum',price_paise:999900,description:'For chains and premium institutions.',           features:['Unlimited lead credits','Top-of-search placement','Homepage featured listing','AI-optimised profile','Multi-branch management','SLA-backed account manager'],                                  leads_per_month:-1,  is_hot:false, cta:'Start Platinum',   plan_key:'platinum' },
]

async function ensureSubPlansTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_key      VARCHAR(50) NOT NULL UNIQUE,
      name          VARCHAR(200) NOT NULL,
      description   TEXT,
      price_paise   INTEGER NOT NULL DEFAULT 0,
      leads_per_month INTEGER NOT NULL DEFAULT 0,
      features      TEXT NOT NULL DEFAULT '[]',
      is_hot        BOOLEAN DEFAULT false,
      cta           VARCHAR(200) NOT NULL DEFAULT 'Get Started',
      sort_order    INTEGER NOT NULL DEFAULT 0,
      is_active     BOOLEAN DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  const count = await db.query('SELECT COUNT(*) FROM subscription_plans').catch(() => ({ rows:[{ count:'0' }] }))
  if (parseInt(count.rows[0].count) === 0) {
    for (let i = 0; i < DEFAULT_SUB_PLANS.length; i++) {
      const p = DEFAULT_SUB_PLANS[i]
      await db.query(
        `INSERT INTO subscription_plans (plan_key,name,description,price_paise,leads_per_month,features,is_hot,cta,sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (plan_key) DO NOTHING`,
        [p.plan_key, p.name, p.description, p.price_paise, p.leads_per_month, JSON.stringify(p.features), p.is_hot, p.cta, i]
      ).catch(() => {})
    }
  }
}

function toSubPlan(row: any) {
  let features: string[] = []
  try { features = JSON.parse(row.features) } catch { features = [] }
  return {
    id: row.id, planKey: row.plan_key, name: row.name, description: row.description || '',
    price: row.price_paise, leadsPerMonth: row.leads_per_month,
    features, isHot: row.is_hot, cta: row.cta, sortOrder: row.sort_order, isActive: row.is_active,
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
  const { planKey, name, description, price, leadsPerMonth, features, isHot, cta, sortOrder, isActive } = body
  if (!planKey || !name) return NextResponse.json({ error: 'planKey and name are required' }, { status: 400 })
  const res = await db.query(
    `INSERT INTO subscription_plans (plan_key,name,description,price_paise,leads_per_month,features,is_hot,cta,sort_order,is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (plan_key) DO UPDATE SET
       name=$2, description=$3, price_paise=$4, leads_per_month=$5,
       features=$6, is_hot=$7, cta=$8, sort_order=$9, is_active=$10
     RETURNING *`,
    [planKey, name, description||'', price??0, leadsPerMonth??0, JSON.stringify(features??[]), isHot??false, cta||'Get Started', sortOrder??0, isActive??true]
  )
  return NextResponse.json(toSubPlan(res.rows[0]))
}

async function updateSubPlan(req: NextRequest) {
  await ensureSubPlansTable()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const sets: string[] = []; const params: any[] = []
  const map: Record<string,string> = { name:'name', description:'description', price:'price_paise', leadsPerMonth:'leads_per_month', isHot:'is_hot', cta:'cta', sortOrder:'sort_order', isActive:'is_active' }
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
    // Support both old schema (pricePerLead) and new schema (defaultPricePaise)
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
  // Save global settings
  await db.query(
    `INSERT INTO admin_settings (key,value,updated_at) VALUES ('lead_pricing_defaults',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`,
    [JSON.stringify(global)]
  )
  // Save/update state pricing rows
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

// ─── message triggers (email + whatsapp) ─────────────────────────────────────

const DEFAULT_TRIGGERS = [
  { trigger_key:'welcome_school',              category:'Onboarding',   event:'School Registration',        description:'Sent when a school admin creates an account',               recipients:['school'], variables:['{{school_name}}','{{admin_name}}','{{login_url}}','{{profile_url}}'],
    email_school_subject:'Welcome to Thynk Schooling — {{school_name}} is now live!',
    email_school_body:`Hi {{admin_name}},\n\nCongratulations! {{school_name}} is now listed on Thynk Schooling.\n\nNext steps:\n• Complete your school profile\n• Your Free plan includes 5 lead credits/month\n• Parents in your city can now find and apply\n\nLogin: {{login_url}}\n\nThe Thynk Schooling Team`,
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
  { trigger_key:'profile_complete_school',     category:'Onboarding',   event:'School Profile Completed',   description:'Sent when a school fills all profile fields',               recipients:['school'], variables:['{{school_name}}','{{admin_name}}','{{profile_url}}','{{dashboard_url}}'],
    email_school_subject:`{{school_name}} — Profile complete! You're ready to get leads`,
    email_school_body:`Hi {{admin_name}},\n\nGreat news — {{school_name}}'s profile is 100% complete!\n\nComplete profiles get 3x more parent views.\n\nView profile: {{profile_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`✅ *Profile complete!*\n\n{{school_name}}'s listing is fully set up. Complete profiles get 3x more views.\n\nDashboard: {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:2 },
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
  { trigger_key:'lead_credit_used',            category:'Leads',        event:'Lead Credit Used',           description:'School unlocked a lead — credit deducted',                 recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{credits_remaining}}','{{parent_name}}','{{parent_phone}}','{{child_name}}','{{upgrade_url}}'],
    email_school_subject:'Lead unlocked — {{credits_remaining}} credits remaining',
    email_school_body:`Hi {{admin_name}},\n\nYou've unlocked a lead for {{school_name}}.\n\nParent: {{parent_name}} | Phone: {{parent_phone}}\nChild: {{child_name}}\nCredits remaining: {{credits_remaining}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`🔓 *Lead unlocked!*\n\nParent: {{parent_name}}\nPhone: {{parent_phone}} | Child: {{child_name}}\n\nCredits remaining: *{{credits_remaining}}*`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:5 },
  { trigger_key:'lead_expiry_warning',         category:'Leads',        event:'Lead Expiry Warning',        description:'School warned 7 days before leads expire',                  recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{expiring_count}}','{{expiry_date}}','{{dashboard_url}}'],
    email_school_subject:'⚠️ {{expiring_count}} leads expiring in 7 days — {{school_name}}',
    email_school_body:`Hi {{admin_name}},\n\nYou have {{expiring_count}} unread leads expiring on {{expiry_date}}.\n\nUnlock them now: {{dashboard_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`⚠️ *{{expiring_count}} leads expire on {{expiry_date}}!*\n\nDon't lose these parent enquiries for {{school_name}}.\n\nUnlock now 👉 {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:6 },
  { trigger_key:'subscription_activated',      category:'Subscription', event:'Plan Activated',             description:'School upgrades to a paid plan',                            recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{plan_name}}','{{credits_added}}','{{amount_paid}}','{{next_billing}}','{{dashboard_url}}'],
    email_school_subject:'{{plan_name}} plan activated for {{school_name}} 🎉',
    email_school_body:`Hi {{admin_name}},\n\nYour {{plan_name}} plan is now active for {{school_name}}!\n\nCredits added: {{credits_added}}\nAmount: ₹{{amount_paid}} | Next billing: {{next_billing}}\n\nDashboard: {{dashboard_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`🎉 *{{plan_name}} plan activated!*\n\n{{school_name}} is now on {{plan_name}}.\nCredits added: *{{credits_added}}* | Next billing: {{next_billing}}\n\nDashboard: {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:7 },
  { trigger_key:'subscription_expiry_warning', category:'Subscription', event:'Plan Expiry Warning',        description:'School notified 5 days before subscription renews/expires',  recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{plan_name}}','{{expiry_date}}','{{renewal_url}}'],
    email_school_subject:'Your {{plan_name}} plan renews in 5 days — {{school_name}}',
    email_school_body:`Hi {{admin_name}},\n\nYour {{plan_name}} plan for {{school_name}} renews on {{expiry_date}}.\n\nUpdate billing if needed: {{renewal_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`⏰ *Plan renews in 5 days*\n\n{{school_name}}'s {{plan_name}} plan renews on {{expiry_date}}.\n\nManage subscription: {{renewal_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:8 },
  { trigger_key:'subscription_cancelled',      category:'Subscription', event:'Plan Cancelled / Expired',   description:'School plan lapses or is cancelled',                        recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{plan_name}}','{{upgrade_url}}'],
    email_school_subject:'Your {{plan_name}} plan has ended — {{school_name}}',
    email_school_body:`Hi {{admin_name}},\n\nYour {{plan_name}} subscription for {{school_name}} has ended.\n\nYou're now on the Free plan (5 credits/month).\n\nReactivate: {{upgrade_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`📋 *{{plan_name}} plan ended*\n\n{{school_name}} is now on the Free plan (5 credits/month).\n\nReactivate: {{upgrade_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:9 },
  { trigger_key:'application_status_update',   category:'Applications', event:'Application Status Changed', description:'Parent notified when school updates application status',     recipients:['parent'], variables:['{{parent_name}}','{{child_name}}','{{school_name}}','{{new_status}}','{{message}}','{{applications_url}}'],
    email_school_subject:'', email_school_body:'', email_school_enabled:false,
    email_parent_subject:`Update on {{child_name}}'s application — {{school_name}}`,
    email_parent_body:`Hi {{parent_name}},\n\nThere's an update on {{child_name}}'s application at {{school_name}}.\n\nStatus: {{new_status}}\n\nView details: {{applications_url}}\n\nThe Thynk Schooling Team`,
    email_parent_enabled:true,
    wa_school_body:'', wa_school_enabled:false,
    wa_parent_body:`📬 *Application update*\n\n{{child_name}}'s application at *{{school_name}}* is now: *{{new_status}}*\n\nView details 👉 {{applications_url}}`,
    wa_parent_enabled:true, sort_order:10 },
  { trigger_key:'review_approved',             category:'Reviews',      event:'Review Published',           description:'Parent notified when their review goes live',               recipients:['parent'], variables:['{{parent_name}}','{{school_name}}','{{review_url}}'],
    email_school_subject:'', email_school_body:'', email_school_enabled:false,
    email_parent_subject:'Your review for {{school_name}} is now live',
    email_parent_body:`Hi {{parent_name}},\n\nYour review for {{school_name}} has been approved and is now visible to other parents.\n\nView it: {{review_url}}\n\nThe Thynk Schooling Team`,
    email_parent_enabled:false,
    wa_school_body:'', wa_school_enabled:false,
    wa_parent_body:`⭐ *Your review is live!*\n\nYour review for *{{school_name}}* is now helping other parents.\n\nView it 👉 {{review_url}}`,
    wa_parent_enabled:false, sort_order:11 },
  { trigger_key:'new_review_school',           category:'Reviews',      event:'New Review Received',        description:'School notified when a new review is submitted',            recipients:['school'], variables:['{{admin_name}}','{{school_name}}','{{rating}}','{{review_snippet}}','{{dashboard_url}}'],
    email_school_subject:'New {{rating}}★ review for {{school_name}}',
    email_school_body:`Hi {{admin_name}},\n\n{{school_name}} has received a new review.\n\nRating: {{rating}}/5\n"{{review_snippet}}"\n\nView and respond: {{dashboard_url}}\n\nThe Thynk Schooling Team`,
    email_school_enabled:true, email_parent_subject:'', email_parent_body:'', email_parent_enabled:false,
    wa_school_body:`⭐ *New {{rating}}★ review!*\n\n"{{review_snippet}}"\n\nRespond on your dashboard 👉 {{dashboard_url}}`,
    wa_school_enabled:true, wa_parent_body:'', wa_parent_enabled:false, sort_order:12 },
  { trigger_key:'counselling_booked',          category:'Counselling',  event:'Counselling Session Booked', description:'Confirmation sent to parent after booking counselling',      recipients:['parent'], variables:['{{parent_name}}','{{counsellor_name}}','{{session_date}}','{{session_time}}','{{meeting_url}}'],
    email_school_subject:'', email_school_body:'', email_school_enabled:false,
    email_parent_subject:'Counselling session confirmed — {{session_date}}',
    email_parent_body:`Hi {{parent_name}},\n\nYour counselling session is confirmed!\n\nCounsellor: {{counsellor_name}}\nDate: {{session_date}} | Time: {{session_time}}\nJoin: {{meeting_url}}\n\nThe Thynk Schooling Team`,
    email_parent_enabled:true,
    wa_school_body:'', wa_school_enabled:false,
    wa_parent_body:`📅 *Counselling confirmed!*\n\nHi {{parent_name}},\nYour session with *{{counsellor_name}}* is on {{session_date}} at {{session_time}}.\n\nJoin here 👉 {{meeting_url}}`,
    wa_parent_enabled:true, sort_order:13 },
]

async function ensureTriggersTable() {
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
  // Seed defaults if empty
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
  const {
    triggerKey, category, event, description, recipients, variables,
    email, whatsapp, sortOrder,
  } = body
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

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'overview':              return await getOverview()
      case 'analytics':             return await getAnalytics()
      case 'schools':               return await getAdminSchools(req)
      case 'users':                 return await getAdminUsers(req)
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
      case 'content':        return await saveContent(req)
      case 'theme':          return await saveTheme(req)
      case 'seo':            return await saveSeo(req)
      case 'settings':       return await saveSettings(req)
      case 'media':          return await saveMedia(req)
      case 'cities':         return await saveCities(req)
      case 'notifications':  return await sendNotification(req)
      case 'seed-demo':      return await seedDemo()
      case 'subscription-plans': return await saveSubPlan(req)
      case 'message-triggers':   return await saveTrigger(req)
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
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin PUT:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  try {
    switch (action) {
      case 'reviews': return await deleteAdminReview(req)
      case 'cities':  return await deleteCity(req)
      case 'subscription-plans': return await deleteSubPlan(req)
      case 'message-triggers':   return await deleteTrigger(req)
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
      // suspend: ?action=users&id=X&op=suspend
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
