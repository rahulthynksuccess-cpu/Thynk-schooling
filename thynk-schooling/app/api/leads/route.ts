export const dynamic = 'force-dynamic'
/**
 * GET  /api/leads?limit=N          — school admin: list leads for their school
 * POST /api/leads?id=X&action=purchase — school admin: purchase/unlock a lead
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUserId(req: NextRequest): string | null {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('ts_access_token')?.value ||
      ''
    if (!token) return null
    const p = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    return p?.userId || p?.id || null
  } catch { return null }
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID,
      school_id UUID,
      status VARCHAR(50) DEFAULT 'new',
      is_purchased BOOLEAN DEFAULT false,
      child_name VARCHAR(200),
      class_applying_for VARCHAR(50),
      city VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  // Add missing columns to existing leads table
  const cols = [
    'ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS child_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS class_applying_for VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
  ]
  for (const c of cols) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_credits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID UNIQUE,
      credits INTEGER DEFAULT 0,
      total_credits INTEGER DEFAULT 0,
      used_credits INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0`).catch(() => {})
  await db.query(`ALTER TABLE lead_credits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`).catch(() => {})
}

function maskName(name: string): string {
  if (!name) return '****'
  const parts = name.trim().split(' ')
  return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ')
}

function maskPhone(phone: string): string {
  if (!phone) return '***** *****'
  const digits = phone.replace(/\D/g, '')
  return digits.slice(0, 2) + '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-2)
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 10))
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const offset = (page - 1) * limit

    const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
    if (!school.rows.length) {
      return NextResponse.json({ data: [], total: 0, page, limit })
    }
    const schoolId = school.rows[0].id

    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT
           l.id, l.status, l.is_purchased AS "isPurchased",
           l.child_name AS "childName", l.class_applying_for AS "classApplyingFor",
           l.city, l.created_at AS "createdAt",
           u.full_name AS "fullName",
           u.phone AS "fullPhone"
         FROM leads l
         LEFT JOIN users u ON u.id = l.parent_id
         WHERE l.school_id = $1
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [schoolId, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM leads WHERE school_id=$1', [schoolId]),
    ])

    const data = dataRes.rows.map(row => ({
      ...row,
      maskedName: maskName(row.fullName || 'Parent'),
      maskedPhone: maskPhone(row.fullPhone || ''),
      // Only expose real name/phone if purchased
      fullName: row.isPurchased ? row.fullName : undefined,
      fullPhone: row.isPurchased ? row.fullPhone : undefined,
    }))

    return NextResponse.json({ data, total: Number(countRes.rows[0].count), page, limit })
  } catch (e: any) {
    console.error('[leads GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables()
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const leadId = url.searchParams.get('id')

    if (action !== 'purchase') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    if (!leadId) {
      return NextResponse.json({ error: 'Lead id required' }, { status: 400 })
    }

    const school = await db.query('SELECT id FROM schools WHERE admin_user_id=$1', [userId])
    if (!school.rows.length) {
      return NextResponse.json({ error: 'School not found' }, { status: 403 })
    }
    const schoolId = school.rows[0].id

    // Check lead belongs to this school
    const lead = await db.query(
      'SELECT id, is_purchased FROM leads WHERE id=$1 AND school_id=$2',
      [leadId, schoolId]
    )
    if (!lead.rows.length) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    if (lead.rows[0].is_purchased) {
      return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })
    }

    // Check credits
    const credRow = await db.query(
      'SELECT credits FROM lead_credits WHERE school_id=$1',
      [schoolId]
    )
    const available = credRow.rows[0]?.credits ?? 0
    if (available < 1) {
      return NextResponse.json({ error: 'Insufficient credits. Please purchase a lead package.' }, { status: 402 })
    }

    // Deduct credit and mark lead as purchased atomically
    await db.query('BEGIN')
    try {
      await db.query(
        `UPDATE lead_credits
           SET credits = credits - 1,
               used_credits = COALESCE(used_credits, 0) + 1,
               updated_at = NOW()
         WHERE school_id = $1`,
        [schoolId]
      )
      await db.query(
        `UPDATE leads SET is_purchased = true, updated_at = NOW() WHERE id = $1`,
        [leadId]
      )
      await db.query('COMMIT')
    } catch (err) {
      await db.query('ROLLBACK')
      throw err
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[leads POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
