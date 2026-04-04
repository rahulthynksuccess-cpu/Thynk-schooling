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
  const [users, schools, apps, leads] = await Promise.all([
    db.query("SELECT COUNT(*) FROM users WHERE role!='super_admin'").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM schools").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM applications").catch(() => ({ rows: [{ count: 0 }] })),
    db.query("SELECT COUNT(*) FROM lead_purchases").catch(() => ({ rows: [{ count: 0 }] })),
  ])
  return NextResponse.json({ totalUsers: Number(users.rows[0].count), totalSchools: Number(schools.rows[0].count), totalApps: Number(apps.rows[0].count), totalLeads: Number(leads.rows[0].count) })
}

// ─── analytics ────────────────────────────────────────────────────────────────

async function getAnalytics() {
  const [signups, schools] = await Promise.all([
    db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
    db.query("SELECT DATE(created_at) AS day, COUNT(*) AS count FROM schools WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day").catch(() => ({ rows: [] })),
  ])
  return NextResponse.json({ signups: signups.rows, schools: schools.rows })
}

// ─── schools ──────────────────────────────────────────────────────────────────

async function getAdminSchools(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(50, Number(searchParams.get('limit') || 20))
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || '', status = searchParams.get('status')
  const conds: string[] = ['1=1']; const params: any[] = []
  if (search) { params.push(`%${search}%`); conds.push(`(s.name ILIKE $${params.length} OR s.city ILIKE $${params.length})`) }
  if (status === 'verified')   conds.push('s.is_verified=true')
  if (status === 'unverified') conds.push('(s.is_verified=false OR s.is_verified IS NULL)')
  if (status === 'featured')   conds.push('s.is_featured=true')
  const where = conds.join(' AND ')
  params.push(limit, offset)
  const [rows, ct] = await Promise.all([
    db.query(`SELECT s.*, u.email AS admin_email FROM schools s LEFT JOIN users u ON u.id=s.admin_user_id WHERE ${where} ORDER BY s.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*) FROM schools s WHERE ${where}`, params.slice(0,-2)),
  ])
  return NextResponse.json({ data: rows.rows, total: Number(ct.rows[0].count), page, limit })
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
  const role = searchParams.get('role'), isActive = searchParams.get('isActive'), search = searchParams.get('search') || ''
  const limit = Math.min(50, Number(searchParams.get('limit') || 20))
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const offset = (page - 1) * limit
  const conds: string[] = ["u.role!='super_admin'"]; const params: unknown[] = []; let idx = 1
  if (role)               { conds.push(`u.role=$${idx++}`); params.push(role) }
  if (isActive === 'false'){ conds.push(`u.is_active=$${idx++}`); params.push(false) }
  if (search)             { conds.push(`(u.full_name ILIKE $${idx} OR u.name ILIKE $${idx} OR u.phone ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${search}%`); idx++ }
  const where = conds.join(' AND ')
  const [rows, ct] = await Promise.all([
    db.query(`SELECT u.id, COALESCE(u.full_name,u.name) AS full_name, COALESCE(u.phone,u.mobile) AS phone, u.email, u.role, COALESCE(u.is_active,true) AS is_active, COALESCE(u.is_phone_verified,u.is_verified,false) AS is_phone_verified, u.profile_completed, u.last_login_at, u.last_ip, u.created_at, s.name AS school_name FROM users u LEFT JOIN user_profiles up ON up.user_id=u.id LEFT JOIN schools s ON s.id=up.school_id WHERE ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, limit, offset]),
    db.query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params),
  ])
  return Response.json({ data: rows.rows.map((r: any) => ({ id: r.id, fullName: r.full_name||'—', phone: r.phone||'—', email: r.email||null, role: r.role, isActive: r.is_active, isPhoneVerified: r.is_phone_verified, profileCompleted: r.profile_completed||false, lastLoginAt: r.last_login_at||null, lastIp: r.last_ip||null, createdAt: r.created_at, schoolName: r.school_name||null })), total: Number(ct.rows[0].count), page, limit })
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

async function getLeadPricingDefaults() {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const res = await db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'")
  if (!res.rows.length) return NextResponse.json({ pricePerLead:299, bulkDiscount:10, minLeads:5 })
  return NextResponse.json(JSON.parse(res.rows[0].value))
}

async function saveLeadPricingDefaults(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const body = await req.json()
  await db.query(`INSERT INTO admin_settings (key,value,updated_at) VALUES ('lead_pricing_defaults',$1,NOW()) ON CONFLICT (key) DO UPDATE SET value=$1,updated_at=NOW()`, [JSON.stringify(body)])
  return NextResponse.json({ success: true })
}

// ─── notifications ────────────────────────────────────────────────────────────

async function sendNotification(req: NextRequest) {
  await db.query(`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), audience VARCHAR(50), title TEXT, body TEXT, sent_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {})
  const { audience, title, body } = await req.json()
  await db.query('INSERT INTO notifications (audience,title,body) VALUES ($1,$2,$3)', [audience, title, body])
  return NextResponse.json({ success: true, message: 'Notification logged' })
}

// ─── health ───────────────────────────────────────────────────────────────────

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
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin PUT:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    switch (action) {
      case 'reviews': return await deleteAdminReview(req)
      case 'cities':  return await deleteCity(req)
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) { console.error(`[admin DELETE:${action}]`, e); return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'users-activity') return await getUserActivity(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
