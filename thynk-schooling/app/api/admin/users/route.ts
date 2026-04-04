export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const role   = searchParams.get('role')
    const search = searchParams.get('search') || searchParams.get('q') || ''
    const status = searchParams.get('status')
    const limit  = Math.min(50, Number(searchParams.get('limit') || 20))
    const page   = Math.max(1,  Number(searchParams.get('page')  || 1))
    const offset = (page - 1) * limit

    const conds: string[] = ["u.role != 'super_admin'"]
    const params: any[]   = []
    let idx = 1

    if (role && role !== 'suspended') { conds.push(`u.role = $${idx++}`); params.push(role) }
    if (status === 'suspended' || role === 'suspended') { conds.push(`u.is_active = $${idx++}`); params.push(false) }
    if (search) {
      conds.push(`(COALESCE(u.full_name,u.name) ILIKE $${idx} OR COALESCE(u.phone,u.mobile) ILIKE $${idx} OR u.email ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }

    const where = conds.join(' AND ')

    const [rows, ct, parentCt, schoolCt, suspendedCt] = await Promise.all([
      db.query(
        `SELECT u.id,
                COALESCE(u.full_name, u.name) AS full_name,
                COALESCE(u.phone, u.mobile)   AS phone,
                u.email, u.role,
                COALESCE(u.is_active, true)   AS is_active,
                u.profile_completed, u.last_login_at, u.created_at,
                s.name AS school_name
         FROM users u
         LEFT JOIN schools s ON s.admin_user_id = u.id
         WHERE ${where}
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params),
      db.query("SELECT COUNT(*) FROM users WHERE role='parent'").catch(()=>({rows:[{count:0}]})),
      db.query("SELECT COUNT(*) FROM users WHERE role='school_admin'").catch(()=>({rows:[{count:0}]})),
      db.query("SELECT COUNT(*) FROM users WHERE is_active=false").catch(()=>({rows:[{count:0}]})),
    ])

    const total = Number(ct.rows[0].count)
    const users = rows.rows.map((r: any) => ({
      id:          r.id,
      fullName:    r.full_name  || '—',
      phone:       r.phone      || '—',
      email:       r.email      || null,
      role:        r.role,
      school:      r.school_name || null,   // users page reads u.school
      schoolName:  r.school_name || null,
      profileDone: r.profile_completed || false,
      lastLogin:   r.last_login_at     || null,
      joinedAt:    r.created_at,
      status:      r.is_active === false ? 'suspended' : 'active',
    }))

    return NextResponse.json({
      users, data: users, total, page, limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total:     Number(ct.rows[0].count),
        parents:   Number(parentCt.rows[0].count),
        schools:   Number(schoolCt.rows[0].count),
        suspended: Number(suspendedCt.rows[0].count),
      },
    })
  } catch (e: any) {
    console.error('GET /api/admin/users:', e.message)
    return NextResponse.json({ users:[], data:[], total:0, totalPages:1, stats:{total:0,parents:0,schools:0,suspended:0} })
  }
}
