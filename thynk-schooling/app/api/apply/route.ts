export const dynamic = 'force-dynamic'
/**
 * POST /api/apply
 * Called from /apply/[schoolId] — creates a lead for the school.
 * Works for both logged-in parents (links parent_id) and guests (phone/email only).
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
  // leads table (mirrors /api/leads/route.ts)
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id         UUID,
      school_id         UUID NOT NULL,
      status            VARCHAR(50) DEFAULT 'new',
      is_purchased      BOOLEAN DEFAULT false,
      child_name        VARCHAR(200),
      class_applying_for VARCHAR(50),
      city              VARCHAR(100),
      phone             VARCHAR(20),
      email             VARCHAR(200),
      parent_name       VARCHAR(200),
      message           TEXT,
      how_did_you_hear  VARCHAR(100),
      source            VARCHAR(100) DEFAULT 'apply_page',
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // Safe column additions for existing tables
  const cols = [
    'ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
    'ADD COLUMN IF NOT EXISTS email VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS parent_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS message TEXT',
    'ADD COLUMN IF NOT EXISTS how_did_you_hear VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT \'apply_page\'',
    'ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false',
    'ADD COLUMN IF NOT EXISTS child_name VARCHAR(200)',
    'ADD COLUMN IF NOT EXISTS class_applying_for VARCHAR(50)',
    'ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
    'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
  ]
  for (const c of cols) await db.query(`ALTER TABLE leads ${c}`).catch(() => {})

  // applications table
  await db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id   UUID,
      school_id   UUID NOT NULL,
      lead_id     UUID,
      status      VARCHAR(50) DEFAULT 'submitted',
      child_name  VARCHAR(200),
      class_applying_for VARCHAR(50),
      message     TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables()

    const body = await req.json()
    const {
      schoolId, parentName, phone, email,
      childName, classApplyingFor, message, howDidYouHear,
    } = body

    if (!schoolId) return NextResponse.json({ error: 'schoolId is required' }, { status: 400 })
    if (!parentName?.trim()) return NextResponse.json({ error: 'Parent name is required' }, { status: 400 })
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    if (!childName?.trim()) return NextResponse.json({ error: 'Child name is required' }, { status: 400 })
    if (!classApplyingFor) return NextResponse.json({ error: 'Class is required' }, { status: 400 })

    // Verify school exists — fetch by id (could be UUID or slug)
    const schoolRes = await db.query(
      'SELECT id, city FROM schools WHERE id=$1 OR slug=$1',
      [schoolId]
    )
    if (!schoolRes.rows.length) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    const school = schoolRes.rows[0]

    // Optionally link to logged-in parent user
    const userId = getUserId(req)

    // Prevent duplicate lead submission from same phone to same school within 7 days
    const existing = await db.query(
      `SELECT id FROM leads
       WHERE school_id=$1 AND phone=$2
       AND created_at > NOW() - INTERVAL '7 days'`,
      [school.id, phone.trim()]
    )
    if (existing.rows.length > 0) {
      // Return success silently (don't tell user to prevent spam detection)
      return NextResponse.json({ success: true, leadId: existing.rows[0].id })
    }

    // Insert lead
    const leadRes = await db.query(
      `INSERT INTO leads (
        parent_id, school_id, status, is_purchased,
        parent_name, phone, email,
        child_name, class_applying_for,
        city, message, how_did_you_hear, source
      ) VALUES ($1,$2,'new',false,$3,$4,$5,$6,$7,$8,$9,$10,'apply_page')
      RETURNING id`,
      [
        userId || null,
        school.id,
        parentName.trim(),
        phone.trim(),
        email?.trim() || null,
        childName.trim(),
        classApplyingFor,
        school.city || null,
        message?.trim() || null,
        howDidYouHear || null,
      ]
    )
    const leadId = leadRes.rows[0].id

    // Also create an application record so the school sees it in applications tab
    await db.query(
      `INSERT INTO applications (parent_id, school_id, lead_id, status, child_name, class_applying_for, message)
       VALUES ($1,$2,$3,'submitted',$4,$5,$6)`,
      [userId || null, school.id, leadId, childName.trim(), classApplyingFor, message?.trim() || null]
    ).catch(() => {}) // Non-fatal

    return NextResponse.json({ success: true, leadId })
  } catch (e: any) {
    console.error('[apply POST]', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
