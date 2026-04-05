export const dynamic = 'force-dynamic'
/**
 * Consolidated School Slug Route
 * GET /api/schools/[slug]              — get school by slug
 * GET /api/schools/[slug]?action=reviews — get reviews
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'reviews') {
      const limit = Number(new URL(req.url).searchParams.get('limit') || 5)
      const school = await db.query('SELECT id FROM schools WHERE slug=$1', [params.slug])
      if (!school.rows.length) return NextResponse.json({ reviews: [] })
      const rows = await db.query(
        `SELECT r.*, u.full_name AS user_name FROM reviews r
         LEFT JOIN users u ON u.id=r.user_id
         WHERE r.school_id=$1 AND r.status='approved'
         ORDER BY r.created_at DESC LIMIT $2`,
        [school.rows[0].id, limit]
      ).catch(() => ({ rows: [] }))
      return NextResponse.json({ reviews: rows.rows })
    }
    const result = await db.query('SELECT * FROM schools WHERE slug=$1', [params.slug])
    if (!result.rows.length) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    const s = result.rows[0]
    const school = {
      id: s.id, name: s.name || '', slug: s.slug || '',
      description: s.description || null,
      logoUrl: s.logo_url || null, coverImageUrl: s.cover_url || null,
      isVerified: s.is_verified || false, isFeatured: s.is_featured || false, isActive: s.is_active !== false,
      board: Array.isArray(s.board) ? s.board : [],
      schoolType: s.school_type || null, genderPolicy: s.gender_policy || null,
      mediumOfInstruction: s.medium_of_instruction || null,
      recognition: s.recognition || null,
      classesFrom: s.classes_from || null, classesTo: s.classes_to || null,
      foundingYear: s.founding_year || null, totalStudents: s.total_students || null,
      studentTeacherRatio: s.student_teacher_ratio || null,
      monthlyFeeMin: s.monthly_fee_min || null, monthlyFeeMax: s.monthly_fee_max || null, annualFee: s.annual_fee || null,
      phone: s.phone || null, email: s.email || null, websiteUrl: s.website_url || null,
      principalName: s.principal_name || null,
      addressLine1: s.address_line1 || null, city: s.city || null, state: s.state || null,
      locality: s.locality || null, pincode: s.pincode || null,
      latitude: s.latitude || null, longitude: s.longitude || null,
      avgRating: Number(s.rating) || 0, totalReviews: 0,
      facilities: Array.isArray(s.facilities) ? s.facilities : [],
      sports: Array.isArray(s.sports) ? s.sports : [],
      extraCurricular: Array.isArray(s.extracurriculars) ? s.extracurriculars : [],
      languagesOffered: Array.isArray(s.languages) ? s.languages : [],
      galleryImages: [],
      admissionInfo: s.admission_open != null ? {
        admissionOpen: s.admission_open || false,
        academicYear: s.admission_academic_year || null,
        lastDate: null, documentsRequired: [],
      } : null,
      tags: [], profileCompleted: s.profile_completed || false,
      createdAt: s.created_at,
    }
    return NextResponse.json({ school })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
