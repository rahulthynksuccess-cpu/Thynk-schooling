export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/admin/seed-demo
// Creates two test accounts:
//   School:  phone=9000000001  password=School@123
//   Parent:  phone=9000000002  password=Parent@123
export async function POST() {
  try {
    const schoolHash = await bcrypt.hash('School@123', 10)
    const parentHash = await bcrypt.hash('Parent@123', 10)

    // Ensure users table exists — gracefully skip if it does
    await db.query(`
      INSERT INTO users (phone, password_hash, role, full_name, is_active, profile_completed)
      VALUES
        ('9000000001', $1, 'school_admin', 'Demo School Admin', true, false),
        ('9000000002', $2, 'parent',       'Demo Parent User',  true, false)
      ON CONFLICT (phone) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            full_name     = EXCLUDED.full_name,
            is_active     = true
    `, [schoolHash, parentHash])

    return NextResponse.json({
      success: true,
      credentials: [
        { role: 'School Admin', phone: '9000000001', password: 'School@123', dashboard: '/dashboard/school' },
        { role: 'Parent',       phone: '9000000002', password: 'Parent@123', dashboard: '/dashboard/parent' },
      ],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to this endpoint to create demo users',
    credentials: [
      { role: 'School Admin', phone: '9000000001', password: 'School@123', dashboard: '/dashboard/school' },
      { role: 'Parent',       phone: '9000000002', password: 'Parent@123', dashboard: '/dashboard/parent' },
    ],
  })
}
