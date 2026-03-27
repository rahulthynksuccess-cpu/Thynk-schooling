import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile, password, role } = await req.json();

    if (!name || !mobile || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE mobile = $1', [mobile]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Mobile already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, mobile, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, mobile, role`,
      [name, email, mobile, hashedPassword, role]
    );

    const user = result.rows[0];
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    return NextResponse.json({ user, accessToken, refreshToken }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
