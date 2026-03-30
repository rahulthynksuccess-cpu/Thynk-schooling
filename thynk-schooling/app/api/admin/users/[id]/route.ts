export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!guard(req)) return Response.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const { isActive, role } = await req.json()
    if (isActive !== undefined)
      await db.query('UPDATE users SET is_active=$1 WHERE id=$2', [isActive, params.id])
    if (role)
      await db.query('UPDATE users SET role=$1 WHERE id=$2', [role, params.id])
    return Response.json({ message: 'Updated' })
  } catch (err) {
    return Response.json({ message: 'Failed' }, { status: 500 })
  }
}
