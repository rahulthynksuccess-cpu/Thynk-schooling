/**
 * lib/adminQuery.ts
 *
 * Shared React Query config for all admin pages.
 *
 * Usage:
 *   const { data, isLoading } = useQuery(adminQuery('leads', '/api/admin?action=leads&page=1'))
 *   const { data, isLoading } = useQuery(adminQuery('overview', '/api/admin?action=overview'))
 *
 * Prefetch on hover (put on nav links):
 *   onMouseEnter={() => prefetchAdmin(queryClient, 'overview', '/api/admin?action=overview')}
 */

import { QueryClient, UseQueryOptions } from '@tanstack/react-query'

// All admin pages use 5-minute stale time.
// Data is shown immediately from cache while revalidating in background.
const ADMIN_STALE_MS = 5 * 60_000

async function fetcher(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Drop-in replacement for useQuery options on any admin page.
 * Keeps previous data visible while new data loads (no flash of loading state).
 */
export function adminQuery<T = any>(
  key: string | (string | number | undefined)[],
  url: string,
  extraKeys?: any[]
): UseQueryOptions<T> {
  const queryKey = Array.isArray(key) ? key : [key, ...(extraKeys || [])]
  return {
    queryKey,
    queryFn: () => fetcher(url),
    staleTime: ADMIN_STALE_MS,
    refetchOnWindowFocus: false,
    placeholderData: (prev: any) => prev, // show stale data instantly, refresh in bg
  } as UseQueryOptions<T>
}

/**
 * Fire a prefetch when the user hovers a nav link.
 * By the time they click, data is already in cache.
 */
export function prefetchAdmin(
  queryClient: QueryClient,
  key: string,
  url: string
) {
  queryClient.prefetchQuery({
    queryKey: [key],
    queryFn:  () => fetcher(url),
    staleTime: ADMIN_STALE_MS,
  })
}

/**
 * Prefetch the most common admin pages eagerly after dashboard loads.
 * Call this once inside AdminDashboardPage after data arrives.
 */
export function prefetchCommonPages(queryClient: QueryClient) {
  const pages: [string, string][] = [
    ['admin-leads',    '/api/admin?action=leads&page=1&limit=20'],
    ['admin-schools',  '/api/admin?action=schools&page=1&limit=20'],
    ['admin-users',    '/api/admin?action=users&page=1&limit=20'],
    ['admin-payments', '/api/admin?action=payments&page=1&limit=20'],
    ['admin-reviews',  '/api/admin?action=reviews&page=1&limit=20'],
  ]
  pages.forEach(([key, url]) => {
    queryClient.prefetchQuery({
      queryKey: [key],
      queryFn:  () => fetcher(url),
      staleTime: ADMIN_STALE_MS,
    })
  })
}
