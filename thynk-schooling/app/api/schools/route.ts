export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city    = searchParams.get('city');
    const state   = searchParams.get('state');
    const board   = searchParams.get('board');
    const query   = searchParams.get('query') || searchParams.get('search') || searchParams.get('q');
    const page    = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit   = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset  = (page - 1) * limit;

    // Build filter conditions
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (city)  { params.push(city);           conditions.push(`city ILIKE $${params.length}`) }
    if (state) { params.push(state);          conditions.push(`state ILIKE $${params.length}`) }
    if (board) { params.push(`%${board}%`);   conditions.push(`board::text ILIKE $${params.length}`) }
    if (query) { params.push(`%${query}%`);   conditions.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR board::text ILIKE $${params.length})`) }

    // Additional filters
    const feeMin = searchParams.get('feeMin');
    const feeMax = searchParams.get('feeMax');
    const rating = searchParams.get('rating');
    const isFeatured = searchParams.get('isFeatured');
    const schoolType = searchParams.get('type');
    const gender = searchParams.get('gender_policy');
    const medium = searchParams.get('medium');

    if (feeMin)       { params.push(feeMin);        conditions.push(`fee_min >= $${params.length}`) }
    if (feeMax)       { params.push(feeMax);        conditions.push(`fee_max <= $${params.length}`) }
    if (rating)       { params.push(rating);        conditions.push(`rating >= $${params.length}`) }
    if (isFeatured)   {                             conditions.push(`is_featured = true`) }
    if (schoolType)   { params.push(schoolType);   conditions.push(`type ILIKE $${params.length}`) }
    if (gender)       { params.push(gender);       conditions.push(`gender_policy ILIKE $${params.length}`) }
    if (medium)       { params.push(medium);       conditions.push(`medium ILIKE $${params.length}`) }

    const where = conditions.join(' AND ');

    // Count query
    const countRes = await pool.query(`SELECT COUNT(*) FROM schools WHERE ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    // Data query
    params.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT * FROM schools WHERE ${where} ORDER BY is_featured DESC NULLS LAST, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error('Schools GET error:', err);
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 500 });
  }
}
