'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  SlidersHorizontal, Search, MapPin, Star, BadgeCheck,
  GraduationCap, X, ChevronDown, LayoutGrid, List, ArrowUpDown
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useDropdown } from '@/hooks/useDropdown'
import { School, SchoolSearchFilters, PaginatedResponse } from '@/types'
import { clsx } from 'clsx'

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 flex gap-4">
      <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  )
}

// ── Filter Sidebar ─────────────────────────────────────────────
function FilterSidebar({
  filters, onChange, onReset
}: {
  filters: SchoolSearchFilters
  onChange: (k: keyof SchoolSearchFilters, v: unknown) => void
  onReset: () => void
}) {
  const { options: cities   } = useDropdown('city')
  const { options: boards   } = useDropdown('board')
  const { options: types    } = useDropdown('school_type')
  const { options: genders  } = useDropdown('gender_policy')
  const { options: mediums  } = useDropdown('medium')
  const { options: classes  } = useDropdown('class_level')

  const MultiCheckbox = ({ label, optKey, options }: { label: string; optKey: keyof SchoolSearchFilters; options: { label: string; value: string }[] }) => {
    const selected = (filters[optKey] as string[] | undefined) ?? []
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
      onChange(optKey, next.length ? next : undefined)
    }
    return (
      <div className="mb-5">
        <div className="label mb-2">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => toggle(o.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all',
                selected.includes(o.value)
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/40 hover:text-white'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const RadioGroup = ({ label, optKey, options }: { label: string; optKey: keyof SchoolSearchFilters; options: { label: string; value: string }[] }) => {
    const val = filters[optKey] as string | undefined
    return (
      <div className="mb-5">
        <div className="label mb-2">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => onChange(optKey, val === o.value ? undefined : o.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all',
                val === o.value
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/40 hover:text-white'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

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

      {/* City */}
      <div className="mb-5">
        <div className="label mb-2">City</div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
          <select
            value={filters.city || ''}
            onChange={e => onChange('city', e.target.value || undefined)}
            className="input pl-9 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <MultiCheckbox label="Board"          optKey="board"        options={boards}  />
      <RadioGroup    label="School Type"    optKey="schoolType"   options={types}   />
      <RadioGroup    label="Gender Policy"  optKey="genderPolicy" options={genders} />
      <RadioGroup    label="Medium"         optKey="medium"       options={mediums} />

      {/* Fee range */}
      <div className="mb-5">
        <div className="label mb-2">Monthly Fee (₹)</div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.feeMin || ''}
            onChange={e => onChange('feeMin', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.feeMax || ''}
            onChange={e => onChange('feeMax', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-5">
        <div className="label mb-2">Minimum Rating</div>
        <div className="flex gap-2">
          {[3, 3.5, 4, 4.5].map(r => (
            <button
              key={r}
              onClick={() => onChange('rating', filters.rating === r ? undefined : r)}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all',
                filters.rating === r
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-navy-800 border-surface-border text-navy-300 hover:border-orange-500/40'
              )}
            >
              <Star className="w-3 h-3" /> {r}+
            </button>
          ))}
        </div>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-navy-800 border border-surface-border">
        <span className="font-display font-semibold text-sm text-white">Featured Only</span>
        <button
          onClick={() => onChange('isFeatured', filters.isFeatured ? undefined : true)}
          className={clsx(
            'w-10 h-5 rounded-full transition-colors relative',
            filters.isFeatured ? 'bg-orange-500' : 'bg-navy-600'
          )}
        >
          <span className={clsx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            filters.isFeatured ? 'translate-x-5' : 'translate-x-0.5'
          )} />
        </button>
      </div>
    </div>
  )
}

// ── School List Card ───────────────────────────────────────────
function SchoolListCard({ school }: { school: School }) {
  return (
    <Link href={`/schools/${school.slug}`} className="card-hover p-5 flex gap-4 items-start block">
      {/* Logo */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-navy-800 flex-shrink-0 border border-surface-border">
        {school.logoUrl
          ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-2" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-8 h-8 text-navy-500" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div>
            <h3 className="font-display font-bold text-white text-base leading-tight hover:text-orange-400 transition-colors">
              {school.name}
            </h3>
            <div className="flex items-center gap-1.5 text-navy-300 text-xs mt-0.5">
              <MapPin className="w-3 h-3" /> {school.city}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {school.isVerified && (
              <span className="badge-green text-[10px] hidden sm:inline-flex">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {school.isFeatured && <span className="badge-orange text-[10px] hidden sm:inline-flex">Featured</span>}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {school.board.slice(0, 2).map(b => <span key={b} className="badge-orange text-[10px]">{b}</span>)}
          {school.schoolType && <span className="badge-gray text-[10px]">{school.schoolType}</span>}
          {school.genderPolicy && <span className="badge-blue text-[10px]">{school.genderPolicy}</span>}
          {school.mediumOfInstruction && <span className="badge-gray text-[10px]">{school.mediumOfInstruction} Medium</span>}
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="font-bold text-white">{school.avgRating.toFixed(1)}</span>
              <span className="text-navy-400">({school.totalReviews})</span>
            </span>
            {school.classesFrom && school.classesTo && (
              <span className="text-navy-400">Class {school.classesFrom} – {school.classesTo}</span>
            )}
          </div>
          {school.monthlyFeeMin && (
            <div className="font-display font-bold text-orange-400 text-sm">
              ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
              <span className="text-navy-400 font-normal text-xs">/mo onwards</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Main Component ─────────────────────────────────────────────
const INITIAL_FILTERS: SchoolSearchFilters = { page: 1, limit: 15, sortBy: 'rating' }

export function SchoolListingClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<SchoolSearchFilters>({
    ...INITIAL_FILTERS,
    query: searchParams.get('q') || undefined,
    city:  searchParams.get('city') || undefined,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('list')

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools', filters],
    queryFn: () => apiGet<PaginatedResponse<School>>('/schools', filters),
    placeholderData: prev => prev,
    staleTime: 2 * 60 * 1000,
  })

  const updateFilter = useCallback((key: keyof SchoolSearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  const schools = data?.data ?? []
  const total   = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="min-h-screen">
      {/* ── Page Header ── */}
      <div className="bg-navy-950 border-b border-surface-border py-8">
        <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-3xl text-white mb-4">
            {filters.city ? `Schools in ${filters.city}` : 'Find Schools Across India'}
          </h1>

          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-1 input">
              <Search className="w-4 h-4 text-navy-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by school name, board, area…"
                value={filters.query || ''}
                onChange={e => updateFilter('query', e.target.value || undefined)}
                className="bg-transparent flex-1 focus:outline-none text-white placeholder-navy-400 text-sm"
              />
              {filters.query && (
                <button onClick={() => updateFilter('query', undefined)}>
                  <X className="w-4 h-4 text-navy-400 hover:text-white" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-secondary lg:hidden flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          {/* ── Filter Sidebar (desktop always visible, mobile drawer) ── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 w-80 bg-navy-900 border-r border-surface-border overflow-y-auto p-4 lg:hidden"
              >
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-xl">
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-10">
                  <FilterSidebar filters={filters} onChange={updateFilter} onReset={resetFilters} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div className="text-navy-300 text-sm">
                {isLoading ? 'Searching…' : (
                  <>
                    <span className="font-bold text-white">{total.toLocaleString('en-IN')}</span> schools found
                    {isFetching && !isLoading && <span className="ml-2 text-orange-400 text-xs animate-pulse">Updating…</span>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={filters.sortBy}
                  onChange={e => updateFilter('sortBy', e.target.value)}
                  className="input py-2 text-xs w-auto pr-8"
                >
                  <option value="rating">Best Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="fee_asc">Fee: Low to High</option>
                  <option value="fee_desc">Fee: High to Low</option>
                </select>
                {/* View toggle */}
                <div className="flex border border-surface-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={clsx('p-2 transition-colors', viewMode === 'list' ? 'bg-orange-500' : 'hover:bg-surface-hover')}
                  ><List className="w-4 h-4" /></button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx('p-2 transition-colors', viewMode === 'grid' ? 'bg-orange-500' : 'hover:bg-surface-hover')}
                  ><LayoutGrid className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {filters.city && (
                <span className="badge-orange flex items-center gap-1 pr-1.5">
                  📍 {filters.city}
                  <button onClick={() => updateFilter('city', undefined)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.board?.map(b => (
                <span key={b} className="badge-blue flex items-center gap-1 pr-1.5">
                  {b}
                  <button onClick={() => updateFilter('board', filters.board?.filter(x => x !== b))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.schoolType && (
                <span className="badge-gray flex items-center gap-1 pr-1.5">
                  {filters.schoolType}
                  <button onClick={() => updateFilter('schoolType', undefined)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>

            {/* List */}
            <div className={clsx(
              'gap-4',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'flex flex-col'
            )}>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : schools.length === 0
                  ? (
                    <div className="col-span-full text-center py-20">
                      <div className="text-5xl mb-4">🔍</div>
                      <h3 className="font-display font-bold text-white text-xl mb-2">No Schools Found</h3>
                      <p className="text-navy-300 mb-6">Try adjusting your filters or search term.</p>
                      <button onClick={resetFilters} className="btn-primary">Reset Filters</button>
                    </div>
                  )
                  : schools.map((school) => (
                    viewMode === 'list'
                      ? <SchoolListCard key={school.id} school={school} />
                      : (
                        <Link key={school.id} href={`/schools/${school.slug}`} className="card-hover overflow-hidden block">
                          <div className="h-36 bg-navy-800 relative">
                            {school.coverImageUrl
                              ? <img src={school.coverImageUrl} alt={school.name} className="w-full h-full object-cover" loading="lazy" />
                              : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-10 h-10 text-navy-600" /></div>
                            }
                            {school.isFeatured && <span className="absolute top-2 left-2 badge-orange text-[10px]">Featured</span>}
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="font-display font-bold text-white text-sm leading-tight">{school.name}</h3>
                            <div className="flex items-center gap-1 text-navy-300 text-xs"><MapPin className="w-3 h-3" />{school.city}</div>
                            <div className="flex gap-1 flex-wrap">
                              {school.board.slice(0, 1).map(b => <span key={b} className="badge-orange text-[10px]">{b}</span>)}
                              {school.schoolType && <span className="badge-gray text-[10px]">{school.schoolType}</span>}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                              <span className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                                <span className="font-bold text-white">{school.avgRating.toFixed(1)}</span>
                              </span>
                              {school.monthlyFeeMin && (
                                <span className="text-orange-400 font-display font-bold text-xs">
                                  ₹{school.monthlyFeeMin.toLocaleString('en-IN')}/mo
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                  ))
              }
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => updateFilter('page', (filters.page ?? 1) - 1)}
                  className="btn-secondary px-4 py-2 disabled:opacity-40"
                >← Prev</button>
                <span className="text-navy-300 text-sm font-display">
                  Page <span className="text-white font-bold">{filters.page}</span> of <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => updateFilter('page', (filters.page ?? 1) + 1)}
                  className="btn-secondary px-4 py-2 disabled:opacity-40"
                >Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
