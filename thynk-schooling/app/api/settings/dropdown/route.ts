import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const category = new URL(req.url).searchParams.get('category');
    if (!category) {
      return NextResponse.json({ error: 'Category required' }, { status: 400 });
    }
    const result = await pool.query(
      'SELECT * FROM dropdown_options WHERE category = $1 ORDER BY label ASC',
      [category]
    );
    return NextResponse.json({ options: result.rows });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
