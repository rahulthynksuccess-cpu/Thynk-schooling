'use client'
import { useQuery } from '@tanstack/react-query'

interface SelectOption { label: string; value: string }

async function fetchDropdown(category: string, parentValue?: string): Promise<SelectOption[]> {
  const params = new URLSearchParams({ category })
  if (parentValue) params.set('parentValue', parentValue)

  params.set('action', 'dropdown')
  const res = await fetch(`/api/settings?${params}`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()

  // API returns { options: [...] }
  const raw: any[] = Array.isArray(data) ? data : (data.options ?? data.data ?? [])
  return raw.map((d: any) => ({
    label: d.label ?? d.name ?? String(d.value),
    value: String(d.value ?? d.id ?? d.label),
  }))
}

export function useDropdown(category: string, opts: { parentValue?: string; enabled?: boolean } = {}) {
  const { parentValue, enabled = true } = opts
  const { data = [], isLoading, isError } = useQuery<SelectOption[]>({
    queryKey: ['dropdown', category, parentValue],
    queryFn: () => fetchDropdown(category, parentValue),
    staleTime: 0,   // always fresh — admin changes reflect immediately
    gcTime:    5 * 60 * 1000,
    enabled,
    retry: 2,
  })
  return { options: data, isLoading, isError }
}

export function useDropdowns(categories: string[]) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return categories.map(cat => ({ category: cat, ...useDropdown(cat) }))
}
