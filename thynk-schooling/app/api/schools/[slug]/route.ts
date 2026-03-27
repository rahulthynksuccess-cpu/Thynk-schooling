import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const result = await pool.query(
      'SELECT * FROM schools WHERE slug = $1', [params.slug]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    return NextResponse.json({ school: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
