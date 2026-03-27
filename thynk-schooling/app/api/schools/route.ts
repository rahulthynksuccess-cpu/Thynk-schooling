import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const board = searchParams.get('board');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM schools WHERE 1=1';
    const params: any[] = [];

    if (city) { params.push(city); query += ` AND city = $${params.length}`; }
    if (board) { params.push(board); query += ` AND board = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND name ILIKE $${params.length}`; }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    return NextResponse.json({ schools: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
