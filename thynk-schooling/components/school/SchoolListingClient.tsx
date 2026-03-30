'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  SlidersHorizontal, Search, MapPin, Star, BadgeCheck,
  GraduationCap, X, LayoutGrid, List, ChevronDown
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { School, SchoolSearchFilters, PaginatedResponse } from '@/types'
import { clsx } from 'clsx'

async function fetchSchools(filters: SchoolSearchFilters): Promise<PaginatedResponse<School>> {
  const params = new URLSearchParams()
  if (filters.query)         params.set('query',         filters.query)
  if (filters.city)          params.set('city',           filters.city)
  if (filters.state)         params.set('state',          filters.state as string)
  if (filters.board?.length) params.set('board',          filters.board.join(','))
  if (filters.schoolType)    params.set('type',           filters.schoolType)
  if (filters.genderPolicy)  params.set('gender_policy',  filters.genderPolicy)
  if (filters.medium)        params.set('medium',         filters.medium)
  if (filters.feeMin)        params.set('feeMin',         String(filters.feeMin))
  if (filters.feeMax)        params.set('feeMax',         String(filters.feeMax))
  if (filters.rating)        params.set('rating',         String(filters.rating))
  if (filters.isFeatured)    params.set('isFeatured',     'true')
  if (filters.page)          params.set('page',           String(filters.page))
  if (filters.limit)         params.set('limit',          String(filters.limit))
  if (filters.sortBy)        params.set('sortBy',         filters.sortBy)
  const res = await fetch(`/api/schools?${params}`, { cache: 'no-store' })
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  return res.json()
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

// Styled select wrapper
function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  options: { label: string; value: string }[]; placeholder: string
}) {
  return (
    <div className="mb-4">
      <div className="label mb-2">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input appearance-none cursor-pointer pr-8 w-full"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
      </div>
    </div>
  )
}

function FilterSidebar({ filters, onChange, onReset }: {
  filters: SchoolSearchFilters & { state?: string }
  onChange: (k: string, v: unknown) => void
  onReset: () => void
}) {
  const { options: states  } = useDropdown('state')
  const { options: cities  } = useDropdown('city', { parentValue: (filters as any).state || undefined, enabled: true })
  const { options: boards  } = useDropdown('board')
  const { options: types   } = useDropdown('school_type')
  const { options: genders } = useDropdown('gender_policy')
  const { options: mediums } = useDropdown('medium')

  // Filter cities by selected state if state has a value
  const filteredCities = (filters as any).state
    ? cities.filter((c: any) => !c.parentValue || c.parentValue === (filters as any).state).concat(
        cities.filter((c: any) => !c.parentValue)
      ).filter((c, i, arr) => arr.findIndex(x => x.value === c.value) === i)
    : cities

  return (
    <div className="card p-5 sticky top-20">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-orange-400" /> Filters
        </h3>
        <button onClick={onReset} className="text-orange-400 text-xs font-display font-semibold hover:text-orange-300 transition-colors">
          Reset All
        </button>
      </div>

      {/* State */}
      <FilterSelect
        label="State"
        value={(filters as any).state || ''}
        onChange={v => { onChange('state', v || undefined); onChange('city', undefined) }}
        options={states}
        placeholder="All States"
      />

      {/* City — cascades from State */}
      <div className="mb-4">
        <div className="label mb-2">City</div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
          <select
            value={filters.city || ''}
            onChange={e => onChange('city', e.target.value || undefined)}
            className="input pl-9 appearance-none cursor-pointer w-full"
          >
            <option value="">{(filters as any).state ? 'All Cities in State' : 'All Cities'}</option>
            {(filteredCities.length > 0 ? filteredCities : cities).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
        </div>
      </div>

      {/* Board as dropdown multi-select (shown as pills with a select) */}
      <FilterSelect label="Board" value="" onChange={v => {
        if (!v) return
        const cur = (filters.board as string[]) ?? []
        if (!cur.includes(v)) onChange('board', [...cur, v])
      }} options={boards.filter(b => !((filters.board as string[]) ?? []).includes(b.value))} placeholder="Add Board…" />
      {((filters.board as string[]) ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 -mt-2">
          {((filters.board as string[]) ?? []).map(b => (
            <span key={b} className="badge-orange flex items-center gap-1 pr-1">
              {boards.find(x => x.value === b)?.label || b}
              <button onClick={() => onChange('board', (filters.board as string[]).filter(x => x !== b))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      <FilterSelect label="School Type"   value={filters.schoolType   || ''} onChange={v => onChange('schoolType',   v || undefined)} options={types}   placeholder="All Types" />
      <FilterSelect label="Gender Policy" value={filters.genderPolicy || ''} onChange={v => onChange('genderPolicy', v || undefined)} options={genders} placeholder="All" />
      <FilterSelect label="Medium"        value={filters.medium       || ''} onChange={v => onChange('medium',       v || undefined)} options={mediums} placeholder="All Mediums" />

      {/* Fee */}
      <div className="mb-4">
        <div className="label mb-2">Monthly Fee (₹)</div>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.feeMin || ''}
            onChange={e => onChange('feeMin', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-sm" />
          <input type="number" placeholder="Max" value={filters.feeMax || ''}
            onChange={e => onChange('feeMax', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-sm" />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <div className="label mb-2">Min Rating</div>
        <div className="flex gap-2 flex-wrap">
          {[3, 3.5, 4, 4.5].map(r => (
            <button key={r} onClick={() => onChange('rating', filters.rating === r ? undefined : r)}
              className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all',
                filters.rating === r ? 'bg-orange-500 border-orange-500 text-white' : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/40'
              )}>
              <Star className="w-3 h-3" /> {r}+
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-navy-800 border border-surface-border">
        <span className="font-display font-semibold text-sm text-white">Featured Only</span>
        <button onClick={() => onChange('isFeatured', filters.isFeatured ? undefined : true)}
          className={clsx('w-10 h-5 rounded-full transition-colors relative', filters.isFeatured ? 'bg-orange-500' : 'bg-navy-600')}>
          <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', filters.isFeatured ? 'translate-x-5' : 'translate-x-0.5')} />
        </button>
      </div>
    </div>
  )
}

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
          <div className="flex items-center gap-3 flex-shrink-0">
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

const INITIAL_FILTERS: SchoolSearchFilters & { state?: string } = { page: 1, limit: 15, sortBy: 'rating' }

export function SchoolListingClient() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<SchoolSearchFilters & { state?: string }>({
    ...INITIAL_FILTERS,
    query: searchParams.get('q') || undefined,
    city:  searchParams.get('city') || undefined,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools', filters],
    queryFn: () => fetchSchools(filters),
    placeholderData: prev => prev,
    staleTime: 2 * 60 * 1000,
  })

  const updateFilter = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), [])

  const schools = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="min-h-screen">
      <div className="bg-navy-950 border-b border-surface-border py-8">
        <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-3xl text-white mb-4">
            {filters.city ? `Schools in ${filters.city}` : (filters as any).state ? `Schools in ${(filters as any).state}` : 'Find Schools Across India'}
          </h1>
          <div className="flex gap-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-1 input">
              <Search className="w-4 h-4 text-navy-400 flex-shrink-0" />
              <input type="text" placeholder="Search by school name, board, area…"
                value={filters.query || ''}
                onChange={e => updateFilter('query', e.target.value || undefined)}
                className="bg-transparent flex-1 focus:outline-none text-white placeholder-navy-400 text-sm" />
              {filters.query && <button onClick={() => updateFilter('query', undefined)}><X className="w-4 h-4 text-navy-400 hover:text-white" /></button>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-secondary lg:hidden flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          <div className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 w-80 bg-navy-900 border-r border-surface-border overflow-y-auto p-4 lg:hidden">
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-xl"><X className="w-5 h-5" /></button>
                <div className="mt-10"><FilterSidebar filters={filters} onChange={updateFilter} onReset={resetFilters} /></div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div className="text-navy-300 text-sm">
                {isLoading ? 'Searching…' : <><span className="font-bold text-white">{total.toLocaleString('en-IN')}</span> schools found{isFetching && !isLoading && <span className="ml-2 text-orange-400 text-xs animate-pulse">Updating…</span>}</>}
              </div>
              <div className="flex items-center gap-3">
                <select value={filters.sortBy} onChange={e => updateFilter('sortBy', e.target.value)} className="input py-2 text-xs w-auto pr-8">
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

            {/* Active chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(filters as any).state && <span className="badge-gray flex items-center gap-1 pr-1.5">🗺️ {(filters as any).state}<button onClick={() => { updateFilter('state', undefined); updateFilter('city', undefined) }}><X className="w-3 h-3" /></button></span>}
              {filters.city && <span className="badge-orange flex items-center gap-1 pr-1.5">📍 {filters.city}<button onClick={() => updateFilter('city', undefined)}><X className="w-3 h-3" /></button></span>}
              {filters.board?.map(b => <span key={b} className="badge-blue flex items-center gap-1 pr-1.5">{b}<button onClick={() => updateFilter('board', filters.board?.filter(x => x !== b))}><X className="w-3 h-3" /></button></span>)}
              {filters.schoolType && <span className="badge-gray flex items-center gap-1 pr-1.5">{filters.schoolType}<button onClick={() => updateFilter('schoolType', undefined)}><X className="w-3 h-3" /></button></span>}
              {filters.genderPolicy && <span className="badge-gray flex items-center gap-1 pr-1.5">{filters.genderPolicy}<button onClick={() => updateFilter('genderPolicy', undefined)}><X className="w-3 h-3" /></button></span>}
              {filters.medium && <span className="badge-gray flex items-center gap-1 pr-1.5">{filters.medium}<button onClick={() => updateFilter('medium', undefined)}><X className="w-3 h-3" /></button></span>}
            </div>

            <div className={clsx('gap-4', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col')}>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : schools.length === 0
                  ? <div className="col-span-full text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="font-display font-bold text-white text-xl mb-2">No Schools Found</h3><p className="text-navy-300 mb-6">Try adjusting your filters.</p><button onClick={resetFilters} className="btn-primary">Reset Filters</button></div>
                  : schools.map(school => <SchoolListCard key={school.id} school={school} />)
              }
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={(filters.page ?? 1) <= 1} onClick={() => updateFilter('page', (filters.page ?? 1) - 1)} className="btn-secondary px-4 py-2 disabled:opacity-40">← Prev</button>
                <span className="text-navy-300 text-sm font-display">Page <span className="text-white font-bold">{filters.page}</span> of <span className="text-white font-bold">{totalPages}</span></span>
                <button disabled={(filters.page ?? 1) >= totalPages} onClick={() => updateFilter('page', (filters.page ?? 1) + 1)} className="btn-secondary px-4 py-2 disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
