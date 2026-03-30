export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') || 4)
    const rows = await db.query(
      `SELECT * FROM schools WHERE is_active=true ORDER BY rating DESC NULLS LAST LIMIT $1`,
      [limit]
    ).catch(()=>({rows:[]}))
    return NextResponse.json(rows.rows)
  } catch { return NextResponse.json([]) }
}
