import { NextRequest } from 'next/server'

// The analytics page fetches /api/admin/analytics but the main handler uses ?action=analytics
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  url.pathname = '/api/admin'
  url.searchParams.set('action', 'analytics')
  return fetch(url.toString(), { headers: req.headers })
}
