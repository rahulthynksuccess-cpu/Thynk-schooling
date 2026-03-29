'use client'
import { useQuery } from '@tanstack/react-query'

interface SelectOption { label: string; value: string }

let dropdownCache: Record<string, SelectOption[]> = {}

async function fetchDropdown(category: string, parentValue?: string): Promise<SelectOption[]> {
  const cacheKey = `${category}:${parentValue || ''}`
  if (dropdownCache[cacheKey]) return dropdownCache[cacheKey]
  
  const params = new URLSearchParams({ category })
  if (parentValue) params.set('parentValue', parentValue)
  
  const res = await fetch(`/api/settings/dropdown?${params}`, { cache: 'no-store' })
  const data = await res.json()
  
  // API returns { options: [...] } — handle both shapes
  const raw = Array.isArray(data) ? data : (data.options ?? data.data ?? [])
  const options: SelectOption[] = raw.map((d: any) => ({
    label: d.label ?? d.name ?? String(d.value),
    value: String(d.value ?? d.id ?? d.label),
  }))
  
  dropdownCache[cacheKey] = options
  return options
}

export function useDropdown(category: string, opts: { parentValue?: string; enabled?: boolean } = {}) {
  const { parentValue, enabled = true } = opts
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['dropdown', category, parentValue],
    queryFn: () => fetchDropdown(category, parentValue),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
  return { options: data, isLoading, isError }
}

export function useDropdowns(categories: string[]) {
  return categories.map(cat => ({ category: cat, ...useDropdown(cat) }))
}
