'use client'
/**
 * useDropdown — fetches dropdown options from the Settings API.
 * ALL dropdowns in the app use this hook. Nothing is hardcoded.
 * Results are cached for 5 minutes (React Query staleTime).
 *
 * Usage:
 *   const { options, isLoading } = useDropdown('board')
 *   const { options } = useDropdown('city', { parentValue: 'maharashtra' }) // cascading
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { DropdownOption } from '@/types'

interface UseDropdownOptions {
  parentValue?: string
  enabled?: boolean
}

interface SelectOption {
  label: string
  value: string
}

export function useDropdown(category: string, opts: UseDropdownOptions = {}) {
  const { parentValue, enabled = true } = opts

  const { data, isLoading, isError } = useQuery<DropdownOption[]>({
    queryKey: ['dropdown', category, parentValue],
    queryFn: () =>
      apiGet<DropdownOption[]>('/settings/dropdown', {
        category,
        ...(parentValue ? { parentValue } : {}),
      }),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime:    10 * 60 * 1000,  // 10 minutes
    enabled,
    placeholderData: [],
  })

  const options: SelectOption[] = (data ?? []).map((d) => ({
    label: d.label,
    value: d.value,
  }))

  return { options, isLoading, isError, raw: data ?? [] }
}

// ── Multi-category fetch (used in search filters) ─────────────
export function useDropdowns(categories: string[]) {
  const results = categories.map((cat) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return { category: cat, ...useDropdown(cat) }
  })
  return results
}
