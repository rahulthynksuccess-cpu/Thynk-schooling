export const dynamic = 'force-dynamic'
import db from '@/lib/db'

export async function GET() {
  try {
    await db.query('SELECT 1')
    return Response.json({ db: 'connected' })
  } catch (e: any) {
    return Response.json({ db: 'error', message: e.message }, { status: 500 })
  }
}
