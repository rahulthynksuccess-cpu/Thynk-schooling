'use client'
import { useEffect, useState } from 'react'

const DATA_CACHE: Record<string, any> = {}
let fetchPromise: Promise<void> | null = null
let fetched = false

async function fetchAll() {
  if (fetched) return
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/admin/content', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      // Handle both {pages:[]} and flat object
      if (Array.isArray(data?.pages)) {
        data.pages.forEach((p: any) => { DATA_CACHE[p.key] = p.value })
      } else {
        Object.assign(DATA_CACHE, data)
      }
      fetched = true
    })
    .catch(() => { fetched = true })
  return fetchPromise
}

export function useContent(key: string) {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    if (!fetched) fetchAll().then(() => forceUpdate(n => n + 1))
  }, [])
  return DATA_CACHE[key] ?? null
}
