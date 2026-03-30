export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

function isAdmin(req: NextRequest): boolean {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || ''
    if (!token) return false
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return payload?.role === 'admin' || payload?.role === 'super_admin'
  } catch { return false }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 })
    const q = includeInactive
      ? 'SELECT * FROM dropdown_options WHERE category = $1 ORDER BY label ASC'
      : 'SELECT * FROM dropdown_options WHERE category = $1 AND is_active = true ORDER BY label ASC'
    const result = await pool.query(q, [category])
    return NextResponse.json({ options: result.rows })
  } catch { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const { category, label, value, isActive = true } = await req.json()
    const result = await pool.query(
      `INSERT INTO dropdown_options (category, label, value, is_active) VALUES ($1,$2,$3,$4) RETURNING *`,
      [category, label, value || label.toLowerCase().replace(/\s+/g,'-'), isActive]
    )
    return NextResponse.json(result.rows[0])
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const body = await req.json()
    const fields: string[] = []
    const vals: any[] = []
    let i = 1
    if (body.label !== undefined)    { fields.push(`label=$${i++}`);     vals.push(body.label) }
    if (body.value !== undefined)    { fields.push(`value=$${i++}`);     vals.push(body.value) }
    if (body.isActive !== undefined) { fields.push(`is_active=$${i++}`); vals.push(body.isActive) }
    if (!fields.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    vals.push(id)
    const result = await pool.query(`UPDATE dropdown_options SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals)
    return NextResponse.json(result.rows[0])
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query('DELETE FROM dropdown_options WHERE id=$1', [id])
    return NextResponse.json({ message: 'Deleted' })
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
