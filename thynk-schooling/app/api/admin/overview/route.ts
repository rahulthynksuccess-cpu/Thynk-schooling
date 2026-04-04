import { NextRequest } from 'next/server'

// The dashboard fetches /api/admin/overview but the main handler uses ?action=overview
// This file just proxies to the main admin route with the correct action param
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  url.pathname = '/api/admin'
  url.searchParams.set('action', 'overview')
  return fetch(url.toString(), { headers: req.headers })
}
