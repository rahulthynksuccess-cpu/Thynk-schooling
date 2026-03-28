import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

export function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const token = authHeader.split(' ')[1];
    const user = verifyAccessToken(token) as any;
    return { user };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}
