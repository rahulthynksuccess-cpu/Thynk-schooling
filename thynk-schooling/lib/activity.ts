import db from './db'

export async function logActivity(
  userId: string,
  action: string,
  detail?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.query(
      `INSERT INTO user_activity_logs (user_id, action, detail, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, detail || null, ipAddress || null, userAgent || null]
    )
  } catch (err) {
    console.error('[ts:activity]', err)
  }
}

export function getClientIP(req: Request): string {
  const h = (req as any).headers
  const get = (k: string) => h?.get?.(k)
  return (
    get('cf-connecting-ip') ||
    (get('x-forwarded-for') || '').split(',')[0].trim() ||
    get('x-real-ip') ||
    'unknown'
  )
}
