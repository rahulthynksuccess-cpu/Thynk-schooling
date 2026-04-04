'use client'
import { useEffect, useState, useCallback } from 'react'

// Module-level cache — shared across all hook instances
const DATA_CACHE: Record<string, any> = {}
let fetchPromise: Promise<void> | null = null
let fetched = false

// Listeners so all mounted components re-render after a fetch/refresh
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

async function fetchAll(force = false) {
  if (fetched && !force) return
  if (fetchPromise && !force) return fetchPromise
  fetchPromise = fetch('/api/admin/content', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data?.pages)) {
        data.pages.forEach((p: any) => { DATA_CACHE[p.key] = p.value })
      } else if (data && typeof data === 'object') {
        Object.assign(DATA_CACHE, data)
      }
      fetched = true
      fetchPromise = null
      notify()
    })
    .catch(() => {
      fetched = true
      fetchPromise = null
    })
  return fetchPromise
}

// Call this after saving content — forces all components to re-render with fresh data
export function refreshContent() {
  fetched = false
  fetchPromise = null
  fetchAll(true)
}

export function useContent(key: string) {
  const [tick, setTick] = useState(0)

  const rerender = useCallback(() => setTick(n => n + 1), [])

  useEffect(() => {
    listeners.add(rerender)
    // Fetch if not already done
    if (!fetched) {
      fetchAll().then(() => rerender())
    }
    return () => { listeners.delete(rerender) }
  }, [rerender])

  return DATA_CACHE[key] ?? null
}
