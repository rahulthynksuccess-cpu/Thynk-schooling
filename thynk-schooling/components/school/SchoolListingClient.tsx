'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, MapPin, Star, BadgeCheck, GraduationCap,
  X, LayoutGrid, List, ChevronDown, ArrowRight, SlidersHorizontal, Plus
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import { School, SchoolSearchFilters, PaginatedResponse } from '@/types'
import { clsx } from 'clsx'

/* ── types ── */
type Filters = SchoolSearchFilters & {
  state?: string
  extraCurricular?: string[]
  language?: string[]
  facilities?: string[]
  sports?: string[]
}

/* ── fetch ── */
async function fetchSchools(f: Filters): Promise<PaginatedResponse<School>> {
  const p = new URLSearchParams()
  if (f.query)                p.set('query',           f.query)
  if (f.city)                 p.set('city',            f.city)
  if (f.state)                p.set('state',           f.state)
  if (f.board?.length)        p.set('board',           f.board.join(','))
  if (f.schoolType)           p.set('type',            f.schoolType)
  if (f.genderPolicy)         p.set('gender_policy',   f.genderPolicy)
  if (f.medium)               p.set('medium',          f.medium)
  if (f.feeMin)               p.set('feeMin',          String(f.feeMin))
  if (f.feeMax)               p.set('feeMax',          String(f.feeMax))
  if (f.rating)               p.set('rating',          String(f.rating))
  if (f.isFeatured)           p.set('isFeatured',      'true')
  if (f.facilities?.length)   p.set('facilities',      f.facilities.join(','))
  if (f.sports?.length)       p.set('sports',          f.sports.join(','))
  if (f.extraCurricular?.length) p.set('extra_curricular', f.extraCurricular.join(','))
  if (f.language?.length)     p.set('language',        f.language.join(','))
  if (f.page)                 p.set('page',            String(f.page))
  if (f.limit)                p.set('limit',           String(f.limit))
  if (f.sortBy)               p.set('sortBy',          f.sortBy)
  const res = await fetch(`/api/schools?${p}`, { cache: 'no-store' })
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  return res.json()
}

const INIT: Filters = { page: 1, limit: 15, sortBy: 'rating' }

/* ── checkbox dropdown ── */
function CheckboxDropdown({ label, options, selected, onChange }: {
  label: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val])

  const count = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all whitespace-nowrap',
          count > 0
            ? 'bg-orange-500 border-orange-500 text-white'
            : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/50 hover:text-white'
        )}
      >
        {label}
        {count > 0 && (
          <span className="w-5 h-5 rounded-full bg-white/25 text-white text-xs flex items-center justify-center font-bold">{count}</span>
        )}
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-navy-900 border border-surface-border rounded-2xl shadow-2xl min-w-[220px] max-h-72 overflow-y-auto"
          >
            <div className="p-2">
              {count > 0 && (
                <button
                  onClick={() => { onChange([]); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-orange-400 font-display font-semibold hover:bg-surface-hover rounded-lg mb-1"
                >
                  Clear all ({count} selected)
                </button>
              )}
              {options.map(o => (
                <label key={o.value} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer group">
                  <div className={clsx(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    selected.includes(o.value)
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-navy-500 group-hover:border-orange-400'
                  )}>
                    {selected.includes(o.value) && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-navy-200 group-hover:text-white transition-colors font-display">{o.label}</span>
                  <input type="checkbox" className="sr-only" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── simple select pill ── */
function SelectPill({ label, value, options, onChange }: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = !!value
  const activeLabel = options.find(o => o.value === value)?.label

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all whitespace-nowrap',
          active
            ? 'bg-orange-500 border-orange-500 text-white'
            : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/50 hover:text-white'
        )}
      >
        {active ? activeLabel : label}
        {active
          ? <button onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}><X className="w-3 h-3" /></button>
          : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
        }
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-navy-900 border border-surface-border rounded-2xl shadow-2xl min-w-[180px] max-h-72 overflow-y-auto"
          >
            <div className="p-2">
              {value && (
                <button onClick={() => { onChange(''); setOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-orange-400 font-display font-semibold hover:bg-surface-hover rounded-lg mb-1">
                  Clear
                </button>
              )}
              {options.map(o => (
                <button key={o.value} onClick={() => { onChange(o.value); setOpen(false) }}
                  className={clsx('w-full text-left px-3 py-2 rounded-lg text-sm font-display transition-colors',
                    o.value === value ? 'text-orange-400 bg-orange-500/10 font-semibold' : 'text-navy-200 hover:bg-surface-hover hover:text-white'
                  )}>
                  {o.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── fee range pill ── */
function FeePill({ feeMin, feeMax, onChange }: {
  feeMin?: number; feeMax?: number
  onChange: (min?: number, max?: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [localMin, setLocalMin] = useState(feeMin ? String(feeMin) : '')
  const [localMax, setLocalMax] = useState(feeMax ? String(feeMax) : '')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = !!(feeMin || feeMax)
  const label = active
    ? `₹${feeMin ? feeMin.toLocaleString('en-IN') : '0'} – ₹${feeMax ? feeMax.toLocaleString('en-IN') : '∞'}`
    : 'Fee Range'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all whitespace-nowrap',
        active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/50 hover:text-white'
      )}>
        {label}
        {active
          ? <button onClick={e => { e.stopPropagation(); onChange(undefined, undefined); setLocalMin(''); setLocalMax('') }}><X className="w-3 h-3" /></button>
          : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-navy-900 border border-surface-border rounded-2xl shadow-2xl p-4 min-w-[220px]">
            <div className="text-xs font-display font-bold text-navy-400 uppercase tracking-wider mb-3">Monthly Fee (₹)</div>
            <div className="flex gap-2 mb-3">
              <input type="number" placeholder="Min" value={localMin} onChange={e => setLocalMin(e.target.value)}
                className="input text-sm flex-1" />
              <input type="number" placeholder="Max" value={localMax} onChange={e => setLocalMax(e.target.value)}
                className="input text-sm flex-1" />
            </div>
            <button onClick={() => { onChange(localMin ? Number(localMin) : undefined, localMax ? Number(localMax) : undefined); setOpen(false) }}
              className="btn-primary w-full justify-center text-sm py-2">Apply</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── more filters panel (facilities / sports / extra / language) ── */
function MoreFiltersPill({ filters, onChange }: {
  filters: Filters
  onChange: (k: string, v: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { options: facilities } = useDropdown('facility')
  const { options: sports     } = useDropdown('sport')
  const { options: extraCurr  } = useDropdown('extra_curricular')
  const { options: languages  } = useDropdown('language')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const totalActive =
    (filters.facilities?.length ?? 0) +
    (filters.sports?.length ?? 0) +
    (filters.extraCurricular?.length ?? 0) +
    (filters.language?.length ?? 0)

  const Section = ({ title, opts, fieldKey }: { title: string; opts: { label: string; value: string }[]; fieldKey: string }) => {
    if (opts.length === 0) return null
    const sel: string[] = (filters as any)[fieldKey] ?? []
    return (
      <div className="mb-5">
        <div className="text-xs font-display font-bold text-navy-400 uppercase tracking-wider mb-2">{title}</div>
        <div className="flex flex-wrap gap-2">
          {opts.map(o => (
            <button key={o.value} onClick={() => {
              const next = sel.includes(o.value) ? sel.filter(x => x !== o.value) : [...sel, o.value]
              onChange(fieldKey, next.length ? next : undefined)
            }} className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all',
              sel.includes(o.value)
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/40 hover:text-white'
            )}>
              {sel.includes(o.value) && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (facilities.length === 0 && sports.length === 0 && extraCurr.length === 0 && languages.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all whitespace-nowrap',
        totalActive > 0
          ? 'bg-orange-500 border-orange-500 text-white'
          : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/50 hover:text-white'
      )}>
        <Plus className="w-3.5 h-3.5" />
        More Filters
        {totalActive > 0 && (
          <span className="w-5 h-5 rounded-full bg-white/25 text-white text-xs flex items-center justify-center font-bold">{totalActive}</span>
        )}
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 bg-navy-900 border border-surface-border rounded-2xl shadow-2xl w-[480px] max-h-[480px] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-white text-base">More Search Filters</span>
              {totalActive > 0 && (
                <button onClick={() => {
                  onChange('facilities', undefined)
                  onChange('sports', undefined)
                  onChange('extraCurricular', undefined)
                  onChange('language', undefined)
                }} className="text-xs text-orange-400 font-display font-semibold hover:text-orange-300">
                  Clear all ({totalActive})
                </button>
              )}
            </div>
            <Section title="Facilities"              opts={facilities} fieldKey="facilities"      />
            <Section title="Sports"                  opts={sports}     fieldKey="sports"           />
            <Section title="Extra Curricular"        opts={extraCurr}  fieldKey="extraCurricular"  />
            <Section title="Languages Offered"       opts={languages}  fieldKey="language"         />
            <button onClick={() => setOpen(false)} className="btn-primary w-full justify-center text-sm py-2 mt-2">
              Apply Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── school card ── */
function SchoolListCard({ school }: { school: School }) {
  return (
    <Link href={`/schools/${school.slug}`} className="card-hover p-5 flex gap-4 items-start block">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-navy-800 flex-shrink-0 border border-surface-border">
        {school.logoUrl
          ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-2" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-8 h-8 text-navy-500" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div>
            <h3 className="font-display font-bold text-white text-base leading-tight hover:text-orange-400 transition-colors">{school.name}</h3>
            <div className="flex items-center gap-1.5 text-navy-300 text-xs mt-0.5"><MapPin className="w-3 h-3" /> {school.city}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {school.isVerified && <span className="badge-green text-[10px] hidden sm:inline-flex"><BadgeCheck className="w-3 h-3" /> Verified</span>}
            {school.isFeatured && <span className="badge-orange text-[10px] hidden sm:inline-flex">Featured</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {school.board.slice(0, 2).map(b => <span key={b} className="badge-orange text-[10px]">{b}</span>)}
          {school.schoolType && <span className="badge-gray text-[10px]">{school.schoolType}</span>}
          {school.genderPolicy && <span className="badge-blue text-[10px]">{school.genderPolicy}</span>}
          {school.mediumOfInstruction && <span className="badge-gray text-[10px]">{school.mediumOfInstruction} Medium</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="font-bold text-white">{school.avgRating.toFixed(1)}</span>
              <span className="text-navy-400">({school.totalReviews})</span>
            </span>
            {school.classesFrom && school.classesTo && <span className="text-navy-400">Class {school.classesFrom}–{school.classesTo}</span>}
          </div>
          {school.monthlyFeeMin && (
            <div className="font-display font-bold text-orange-400 text-sm">
              ₹{school.monthlyFeeMin.toLocaleString('en-IN')}<span className="text-navy-400 font-normal text-xs">/mo onwards</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 flex gap-4">
      <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="flex gap-2"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-16 rounded-full" /></div>
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  )
}

/* ── guest modal — fixed contrast ── */
function GuestSearchModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-5xl mb-5">🏫</div>
        <h2 className="font-display font-bold text-gray-900 text-2xl mb-2">Create a Free Account</h2>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          Sign up in 30 seconds to search and explore 12,000+ verified schools across India. Completely free for parents.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/register" onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gray-900 text-white font-display font-bold text-base hover:bg-orange-500 transition-colors">
            Register Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-display font-semibold text-sm hover:border-gray-900 hover:text-gray-900 transition-colors">
            Already have an account? Log in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

/* ── main component ── */
export function SchoolListingClient() {
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()

  const [filters, setFilters] = useState<Filters>({
    ...INIT,
    query: searchParams.get('q') || undefined,
    city: searchParams.get('city') || undefined,
  })
  const [activeFilters, setActiveFilters] = useState<Filters>({ ...INIT })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showGuestModal, setShowGuestModal] = useState(false)

  /* dropdowns — all from DB, zero hardcoding */
  const { options: states      } = useDropdown('state')
  const { options: cities      } = useDropdown('city', { parentValue: filters.state || undefined, enabled: true })
  const { options: boards      } = useDropdown('board')
  const { options: schoolTypes } = useDropdown('school_type')
  const { options: genderPols  } = useDropdown('gender_policy')
  const { options: mediums     } = useDropdown('medium')

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools', activeFilters],
    queryFn: () => fetchSchools(activeFilters),
    placeholderData: prev => prev,
    staleTime: 2 * 60 * 1000,
  })

  const set = useCallback((key: string, value: unknown) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value, page: 1 }
      if (key === 'state') next.city = undefined
      return next
    })
  }, [])

  const search = useCallback(() => {
    if (!isAuthenticated) { setShowGuestModal(true); return }
    setActiveFilters({ ...filters, page: 1 })
  }, [isAuthenticated, filters])

  const reset = useCallback(() => {
    setFilters(INIT)
    setActiveFilters(INIT)
  }, [])

  const schools = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  /* count active filters for badge */
  const activeCount = [
    filters.state, filters.city, filters.schoolType, filters.genderPolicy,
    filters.medium, filters.feeMin, filters.feeMax, filters.rating, filters.isFeatured,
  ].filter(Boolean).length +
    (filters.board?.length ?? 0) +
    (filters.facilities?.length ?? 0) +
    (filters.sports?.length ?? 0) +
    (filters.extraCurricular?.length ?? 0) +
    (filters.language?.length ?? 0)

  return (
    <div className="min-h-screen">
      {showGuestModal && <GuestSearchModal onClose={() => setShowGuestModal(false)} />}

      {/* ── Hero search bar ── */}
      <div className="bg-navy-950 border-b border-surface-border py-8">
        <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-3xl text-white mb-5">
            {filters.city
              ? `Schools in ${filters.city}`
              : filters.state
                ? `Schools in ${filters.state}`
                : 'Find Schools Across India'}
          </h1>

          {/* Search input row */}
          <div className="flex gap-3 max-w-3xl mb-5">
            <div className="flex items-center gap-3 flex-1 input">
              <Search className="w-4 h-4 text-navy-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by school name, board, area…"
                value={filters.query || ''}
                onChange={e => set('query', e.target.value || undefined)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="bg-transparent flex-1 focus:outline-none text-white placeholder-navy-400 text-sm"
              />
              {filters.query && (
                <button onClick={() => set('query', undefined)}><X className="w-4 h-4 text-navy-400 hover:text-white" /></button>
              )}
            </div>
            <button onClick={search} className="btn-primary flex items-center gap-2 px-6">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          {/* ── Horizontal filter bar — all from DB ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-navy-400 text-xs font-display font-bold uppercase tracking-wider mr-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* State */}
            <SelectPill
              label="State"
              value={filters.state || ''}
              options={states}
              onChange={v => set('state', v || undefined)}
            />

            {/* City — cascades from state */}
            <SelectPill
              label="City"
              value={filters.city || ''}
              options={cities}
              onChange={v => set('city', v || undefined)}
            />

            {/* Board — checkbox multi */}
            <CheckboxDropdown
              label="Board"
              options={boards}
              selected={filters.board ?? []}
              onChange={vals => set('board', vals.length ? vals : undefined)}
            />

            {/* School Type */}
            <SelectPill
              label="School Type"
              value={filters.schoolType || ''}
              options={schoolTypes}
              onChange={v => set('schoolType', v || undefined)}
            />

            {/* Gender Policy */}
            <SelectPill
              label="Gender Policy"
              value={filters.genderPolicy || ''}
              options={genderPols}
              onChange={v => set('genderPolicy', v || undefined)}
            />

            {/* Medium */}
            <SelectPill
              label="Medium"
              value={filters.medium || ''}
              options={mediums}
              onChange={v => set('medium', v || undefined)}
            />

            {/* Fee Range */}
            <FeePill
              feeMin={filters.feeMin}
              feeMax={filters.feeMax}
              onChange={(min, max) => { set('feeMin', min); set('feeMax', max) }}
            />

            {/* Rating */}
            <CheckboxDropdown
              label="Rating"
              options={[
                { label: '3+ Stars', value: '3' },
                { label: '3.5+ Stars', value: '3.5' },
                { label: '4+ Stars', value: '4' },
                { label: '4.5+ Stars', value: '4.5' },
              ]}
              selected={filters.rating ? [String(filters.rating)] : []}
              onChange={vals => set('rating', vals.length ? Number(vals[vals.length - 1]) : undefined)}
            />

            {/* More Filters — Facilities / Sports / Extra / Language from DB */}
            <MoreFiltersPill filters={filters} onChange={set} />

            {/* Reset */}
            {activeCount > 0 && (
              <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-display font-semibold text-navy-400 hover:text-orange-400 transition-colors">
                <X className="w-3.5 h-3.5" /> Reset ({activeCount})
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-navy-500 text-xs mt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
              <Link href="/register" className="text-orange-400 hover:underline font-semibold">Register free</Link>
              <span>to search, save and compare schools</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Active filter chips */}
        {(() => {
          const chips: { label: string; clear: () => void }[] = []
          if (activeFilters.state)       chips.push({ label: `🗺️ ${activeFilters.state}`, clear: () => { set('state', undefined); set('city', undefined); setActiveFilters(f => ({...f, state: undefined, city: undefined})) } })
          if (activeFilters.city)        chips.push({ label: `📍 ${activeFilters.city}`, clear: () => { set('city', undefined); setActiveFilters(f => ({...f, city: undefined})) } })
          if (activeFilters.schoolType)  chips.push({ label: activeFilters.schoolType, clear: () => set('schoolType', undefined) })
          if (activeFilters.genderPolicy) chips.push({ label: activeFilters.genderPolicy, clear: () => set('genderPolicy', undefined) })
          if (activeFilters.medium)      chips.push({ label: `${activeFilters.medium} Medium`, clear: () => set('medium', undefined) })
          activeFilters.board?.forEach(b => chips.push({ label: b, clear: () => set('board', activeFilters.board?.filter(x => x !== b)) }))
          activeFilters.facilities?.forEach(f => chips.push({ label: `🏗️ ${f}`, clear: () => set('facilities', activeFilters.facilities?.filter(x => x !== f)) }))
          activeFilters.sports?.forEach(s => chips.push({ label: `⚽ ${s}`, clear: () => set('sports', activeFilters.sports?.filter(x => x !== s)) }))
          activeFilters.extraCurricular?.forEach(e => chips.push({ label: `🎭 ${e}`, clear: () => set('extraCurricular', activeFilters.extraCurricular?.filter(x => x !== e)) }))
          activeFilters.language?.forEach(l => chips.push({ label: `🗣️ ${l}`, clear: () => set('language', activeFilters.language?.filter(x => x !== l)) }))
          if (!chips.length) return null
          return (
            <div className="flex flex-wrap gap-2 mb-5">
              {chips.map((c, i) => (
                <span key={i} className="badge-gray flex items-center gap-1 pr-1.5 text-xs">
                  {c.label}
                  <button onClick={c.clear}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )
        })()}

        <div className="flex items-center justify-between mb-5">
          <div className="text-navy-300 text-sm">
            {isLoading
              ? 'Searching…'
              : <><span className="font-bold text-white">{total.toLocaleString('en-IN')}</span> schools found
                {isFetching && !isLoading && <span className="ml-2 text-orange-400 text-xs animate-pulse">Updating…</span>}
              </>
            }
          </div>
          <div className="flex items-center gap-3">
            <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)} className="input py-2 text-xs w-auto pr-8">
              <option value="rating">Best Rated</option>
              <option value="newest">Newest First</option>
              <option value="fee_asc">Fee: Low→High</option>
              <option value="fee_desc">Fee: High→Low</option>
            </select>
            <div className="flex border border-surface-border rounded-xl overflow-hidden">
              <button onClick={() => setViewMode('list')} className={clsx('p-2 transition-colors', viewMode === 'list' ? 'bg-orange-500' : 'hover:bg-surface-hover')}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('grid')} className={clsx('p-2 transition-colors', viewMode === 'grid' ? 'bg-orange-500' : 'hover:bg-surface-hover')}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className={clsx('gap-4', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col')}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : schools.length === 0
              ? <div className="col-span-full text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-display font-bold text-white text-xl mb-2">No Schools Found</h3>
                  <p className="text-navy-300 mb-6">Try adjusting your filters or search term.</p>
                  <button onClick={reset} className="btn-primary">Reset Filters</button>
                </div>
              : schools.map(school => <SchoolListCard key={school.id} school={school} />)
          }
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={(activeFilters.page ?? 1) <= 1}
              onClick={() => { const p = (activeFilters.page ?? 1) - 1; set('page', p); setActiveFilters(f => ({...f, page: p})) }}
              className="btn-secondary px-4 py-2 disabled:opacity-40"
            >← Prev</button>
            <span className="text-navy-300 text-sm font-display">
              Page <span className="text-white font-bold">{activeFilters.page}</span> of <span className="text-white font-bold">{totalPages}</span>
            </span>
            <button
              disabled={(activeFilters.page ?? 1) >= totalPages}
              onClick={() => { const p = (activeFilters.page ?? 1) + 1; set('page', p); setActiveFilters(f => ({...f, page: p})) }}
              className="btn-secondary px-4 py-2 disabled:opacity-40"
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
