export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role     = searchParams.get('role')
  const isActive = searchParams.get('isActive')
  const search   = searchParams.get('search') || ''
  const limit    = Math.min(50, Number(searchParams.get('limit') || 20))
  const page     = Math.max(1, Number(searchParams.get('page') || 1))
  const offset   = (page - 1) * limit

  const conds: string[] = ["u.role != 'super_admin'"]
  const params: unknown[] = []
  let idx = 1

  if (role)              { conds.push(`u.role = $${idx++}`);      params.push(role) }
  if (isActive === 'false') { conds.push(`u.is_active = $${idx++}`); params.push(false) }
  if (search)            {
    conds.push(`(u.full_name ILIKE $${idx} OR u.name ILIKE $${idx} OR u.phone ILIKE $${idx} OR u.mobile ILIKE $${idx} OR u.email ILIKE $${idx})`)
    params.push(`%${search}%`); idx++
  }
  const where = conds.join(' AND ')

  try {
    const [rows, ct] = await Promise.all([
      db.query(
        `SELECT
           u.id,
           COALESCE(u.full_name, u.name)   AS full_name,
           COALESCE(u.phone, u.mobile)      AS phone,
           u.email,
           u.role,
           COALESCE(u.is_active, true)      AS is_active,
           COALESCE(u.is_phone_verified, u.is_verified, false) AS is_phone_verified,
           u.profile_completed,
           u.last_login_at,
           u.last_ip,
           u.created_at,
           s.name AS school_name,
           (SELECT COUNT(*) FROM applications a WHERE a.parent_id = u.id)      AS total_applications,
           (SELECT COUNT(*) FROM lead_purchases lp WHERE lp.school_id = s2.id) AS total_leads_bought
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         LEFT JOIN schools s  ON s.id  = up.school_id
         LEFT JOIN schools s2 ON s2.admin_user_id = u.id
         WHERE ${where}
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx+1}`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params),
    ])

    return Response.json({
      data: rows.rows.map(r => ({
        id: r.id,
        fullName: r.full_name || '—',
        phone: r.phone || '—',
        email: r.email || null,
        role: r.role,
        isActive: r.is_active,
        isPhoneVerified: r.is_phone_verified,
        profileCompleted: r.profile_completed || false,
        lastLoginAt: r.last_login_at || null,
        lastIp: r.last_ip || null,
        createdAt: r.created_at,
        schoolName: r.school_name || null,
        totalApplications: Number(r.total_applications) || 0,
        totalLeadsBought: Number(r.total_leads_bought) || 0,
      })),
      total: Number(ct.rows[0].count),
      page, limit,
    })
  } catch (err) {
    console.error('[admin/users GET]', err)
    return Response.json({ message: 'Failed' }, { status: 500 })
  }
}
