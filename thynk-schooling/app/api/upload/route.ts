export const dynamic = "force-dynamic"
import { NextRequest } from 'next/server'
import db from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization') || '')
  if (!token) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { base64, mimeType } = await req.json()

    if (!base64 || !mimeType)
      return Response.json({ error: 'base64 and mimeType required' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(mimeType))
      return Response.json({ error: 'Only JPEG, PNG and WebP allowed' }, { status: 400 })

    const approxBytes = (base64.length * 3) / 4
    if (approxBytes > 5 * 1024 * 1024)
      return Response.json({ error: 'Image must be under 5 MB' }, { status: 400 })

    const dataUrl = `data:${mimeType};base64,${base64}`

    await db.query(
      'UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2',
      [dataUrl, payload.userId]
    )

    return Response.json({ avatarUrl: dataUrl })
  } catch (err) {
    console.error('[POST /upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
