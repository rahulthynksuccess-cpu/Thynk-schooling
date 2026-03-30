export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID UNIQUE,
      name VARCHAR(300),
      slug VARCHAR(300) UNIQUE,
      city VARCHAR(100),
      board TEXT[],
      type VARCHAR(100),
      gender_policy VARCHAR(100),
      medium VARCHAR(100),
      fee_min INTEGER,
      fee_max INTEGER,
      description TEXT,
      address TEXT,
      phone VARCHAR(20),
      email VARCHAR(200),
      website VARCHAR(300),
      rating NUMERIC(3,1) DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      profile_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})
}

function getUserId(req: NextRequest): string | null {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ','') || req.cookies.get('ts_access_token')?.value || ''
    return (jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any)?.userId || null
  } catch { return null }
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { name, city, board, type, genderPolicy, medium, feeMin, feeMax, description, address, phone, email, website } = body
    const slug = toSlug(name || 'school') + '-' + Date.now()

    await db.query(
      `INSERT INTO schools (admin_user_id,name,slug,city,board,type,gender_policy,medium,fee_min,fee_max,description,address,phone,email,website,profile_completed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true)
       ON CONFLICT (admin_user_id) DO UPDATE SET
         name=$2,city=$4,board=$5,type=$6,gender_policy=$7,medium=$8,fee_min=$9,fee_max=$10,
         description=$11,address=$12,phone=$13,email=$14,website=$15,profile_completed=true`,
      [userId, name, slug, city, board||[], type||null, genderPolicy||null, medium||null, feeMin||null, feeMax||null, description||null, address||null, phone||null, email||null, website||null]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
