export const dynamic = 'force-dynamic'
/**
 * PUT /api/auth/complete-profile
 * Marks the authenticated user's profile_completed = true in the users table.
 * Called by /school/complete-profile page after saving school data.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const url = new URL(req.url)
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      url.searchParams.get('__token') ||
      ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const sets: string[] = []
    const params: any[] = []

    if (body.fullName !== undefined) {
      params.push(body.fullName)
      sets.push(`full_name=$${params.length}`)
    }
    if (body.profileCompleted !== undefined) {
      params.push(body.profileCompleted)
      sets.push(`profile_completed=$${params.length}`)
    }

    // Always mark profile completed when this endpoint is called
    if (!sets.some(s => s.startsWith('profile_completed'))) {
      params.push(true)
      sets.push(`profile_completed=$${params.length}`)
    }

    params.push(userId)
    await db.query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${params.length}`,
      params
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[auth/complete-profile PUT]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
