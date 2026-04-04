export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page')  || 1))
    const limit  = Math.min(50, Number(searchParams.get('limit') || 20))
    const offset = (page - 1) * limit
    const search      = searchParams.get('search')     || ''
    const isVerified  = searchParams.get('isVerified')
    const isFeatured  = searchParams.get('isFeatured')
    const isActive    = searchParams.get('isActive')
    const status      = searchParams.get('status')

    const conds: string[] = ['1=1']
    const params: any[]   = []

    if (search) {
      params.push(`%${search}%`)
      conds.push(`(s.name ILIKE $${params.length} OR s.city ILIKE $${params.length} OR COALESCE(u.phone,u.mobile) ILIKE $${params.length})`)
    }
    if (isVerified === 'true'  || status === 'verified')   conds.push('s.is_verified = true')
    if (isVerified === 'false' || status === 'unverified') conds.push('(s.is_verified = false OR s.is_verified IS NULL)')
    if (isFeatured === 'true'  || status === 'featured')   conds.push('s.is_featured = true')
    if (isActive   === 'false')                            conds.push('(s.is_active = false OR s.is_active IS NULL)')

    const where = conds.join(' AND ')
    params.push(limit, offset)

    const [rows, ct] = await Promise.all([
      db.query(
        `SELECT s.id, s.name, s.slug, s.city, s.board,
                s.is_verified, s.is_featured, s.is_active,
                s.rating, s.created_at,
                COALESCE(u.phone, u.mobile) AS owner_phone
         FROM schools s
         LEFT JOIN users u ON u.id = s.admin_user_id
         WHERE ${where}
         ORDER BY s.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      db.query(
        `SELECT COUNT(*) FROM schools s LEFT JOIN users u ON u.id = s.admin_user_id WHERE ${where}`,
        params.slice(0, -2)
      ),
    ])

    const data = rows.rows.map((s: any) => ({
      id:         s.id,
      name:       s.name       || '—',
      slug:       s.slug       || '',
      city:       s.city       || '—',
      board:      Array.isArray(s.board) ? s.board : [],
      isVerified: !!s.is_verified,
      isFeatured: !!s.is_featured,
      isActive:   s.is_active !== false,
      avgRating:  Number(s.rating) || 0,
      totalLeads: 0,
      ownerPhone: s.owner_phone || '—',
      createdAt:  s.created_at,
    }))

    return NextResponse.json({ data, total: Number(ct.rows[0].count), page, limit })
  } catch (e: any) {
    console.error('GET /api/admin/schools:', e.message)
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id   = new URL(req.url).searchParams.get('id')
    const body = await req.json()
    const sets: string[] = []
    const params: any[]  = []

    if (body.isVerified !== undefined) { params.push(body.isVerified); sets.push(`is_verified = $${params.length}`) }
    if (body.isFeatured !== undefined) { params.push(body.isFeatured); sets.push(`is_featured = $${params.length}`) }
    if (body.isActive   !== undefined) { params.push(body.isActive);   sets.push(`is_active   = $${params.length}`) }

    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    params.push(id)
    await db.query(`UPDATE schools SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
