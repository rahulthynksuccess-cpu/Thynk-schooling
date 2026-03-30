export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), audience VARCHAR(50), title TEXT, body TEXT, sent_at TIMESTAMPTZ DEFAULT NOW())`).catch(()=>{})
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const { audience, title, body } = await req.json()
    await db.query(`INSERT INTO notifications (audience,title,body) VALUES ($1,$2,$3)`, [audience, title, body])
    return NextResponse.json({ success: true, message: 'Notification logged' })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
