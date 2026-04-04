'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, MapPin, Star, BadgeCheck, GraduationCap,
  X, LayoutGrid, List, ChevronDown, ArrowRight,
  SlidersHorizontal, Plus, Check, Sparkles
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import { School, SchoolSearchFilters, PaginatedResponse } from '@/types'
import { clsx } from 'clsx'

type Filters = SchoolSearchFilters & {
  state?: string
  extraCurricular?: string[]
  language?: string[]
  facilities?: string[]
  sports?: string[]
}

const INIT: Filters = { page: 1, limit: 15, sortBy: 'rating' }

async function fetchSchools(f: Filters): Promise<PaginatedResponse<School>> {
  const p = new URLSearchParams()
  if (f.query)                   p.set('query',           f.query)
  if (f.city)                    p.set('city',            f.city)
  if (f.state)                   p.set('state',           f.state)
  if (f.board?.length)           p.set('board',           f.board.join(','))
  if (f.schoolType)              p.set('type',            f.schoolType)
  if (f.genderPolicy)            p.set('gender_policy',   f.genderPolicy)
  if (f.medium)                  p.set('medium',          f.medium)
  if (f.feeMin)                  p.set('feeMin',          String(f.feeMin))
  if (f.feeMax)                  p.set('feeMax',          String(f.feeMax))
  if (f.rating)                  p.set('rating',          String(f.rating))
  if (f.isFeatured)              p.set('isFeatured',      'true')
  if (f.facilities?.length)      p.set('facilities',      f.facilities.join(','))
  if (f.sports?.length)          p.set('sports',          f.sports.join(','))
  if (f.extraCurricular?.length) p.set('extra_curricular',f.extraCurricular.join(','))
  if (f.language?.length)        p.set('language',        f.language.join(','))
  if (f.page)                    p.set('page',            String(f.page))
  if (f.limit)                   p.set('limit',           String(f.limit))
  if (f.sortBy)                  p.set('sortBy',          f.sortBy)
  const res = await fetch(`/api/schools?${p}`, { cache: 'no-store' })
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  return res.json()
}

/* ─── useClickOutside ─── */
function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, cb])
}

/* ─── dropdown portal wrapper ─── */
const DROP_ANIM = {
  initial:  { opacity: 0, y: -8, scale: 0.97 },
  animate:  { opacity: 1, y: 0,  scale: 1 },
  exit:     { opacity: 0, y: -8, scale: 0.97 },
  transition: { duration: 0.18, ease: [0.22,1,0.36,1] }
}

/* ─── Single-select pill dropdown ─── */
function SelectPill({ label, icon, value, options, onChange }: {
  label: string; icon?: string
  value: string; options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const active = !!value
  const displayLabel = options.find(o => o.value === value)?.label || label

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          active
            ? 'bg-gold border-gold text-white shadow-gold'
            : 'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink hover:shadow-sm'
        )}
      >
        {icon && <span className="text-xs">{icon}</span>}
        <span className="font-semibold">{displayLabel}</span>
        {active ? (
          <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition-colors">
            <X className="w-2.5 h-2.5" />
          </span>
        ) : (
          <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200 text-ink-faint group-hover:text-gold', open && 'rotate-180')} />
        )}
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div {...DROP_ANIM}
            className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl shadow-lg-soft min-w-[200px] max-h-64 overflow-y-auto"
            style={{ boxShadow: '0 8px 40px rgba(13,17,23,0.12), 0 2px 8px rgba(13,17,23,0.06)' }}
          >
            <div className="p-1.5">
              {value && (
                <button onClick={() => { onChange(''); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gold font-semibold hover:bg-gold-wash rounded-xl mb-0.5 transition-colors">
                  ✕ Clear selection
                </button>
              )}
              {options.map(o => (
                <button key={o.value} onClick={() => { onChange(o.value); setOpen(false) }}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                    o.value === value
                      ? 'bg-gold-wash text-ink font-semibold'
                      : 'text-ink-light hover:bg-ivory hover:text-ink'
                  )}>
                  {o.label}
                  {o.value === value && <Check className="w-3.5 h-3.5 text-gold" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Multi-select checkbox pill ─── */
function MultiPill({ label, icon, options, selected, onChange }: {
  label: string; icon?: string
  options: { label: string; value: string }[]
  selected: string[]; onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const count = selected.length
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={clsx(
          'group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          count > 0
            ? 'bg-gold border-gold text-white shadow-gold'
            : 'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink hover:shadow-sm'
        )}>
        {icon && <span className="text-xs">{icon}</span>}
        <span className="font-semibold">{count > 0 ? `${label} (${count})` : label}</span>
        {count > 0 ? (
          <span onClick={e => { e.stopPropagation(); onChange([]); setOpen(false) }}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition-colors">
            <X className="w-2.5 h-2.5" />
          </span>
        ) : (
          <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200 text-ink-faint group-hover:text-gold', open && 'rotate-180')} />
        )}
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div {...DROP_ANIM}
            className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl min-w-[220px] max-h-64 overflow-y-auto"
            style={{ boxShadow: '0 8px 40px rgba(13,17,23,0.12), 0 2px 8px rgba(13,17,23,0.06)' }}
          >
            <div className="p-1.5">
              {count > 0 && (
                <button onClick={() => { onChange([]); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gold font-semibold hover:bg-gold-wash rounded-xl mb-0.5 transition-colors">
                  ✕ Clear all ({count} selected)
                </button>
              )}
              {options.map(o => (
                <label key={o.value}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ivory cursor-pointer transition-colors group">
                  <div className={clsx(
                    'w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    selected.includes(o.value)
                      ? 'bg-gold border-gold'
                      : 'border-[rgba(13,17,23,0.2)] group-hover:border-gold'
                  )}>
                    {selected.includes(o.value) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className={clsx('text-sm transition-colors', selected.includes(o.value) ? 'text-ink font-semibold' : 'text-ink-light group-hover:text-ink')}>
                    {o.label}
                  </span>
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

/* ─── Fee range pill ─── */
function FeePill({ feeMin, feeMax, onChange }: {
  feeMin?: number; feeMax?: number; onChange: (min?: number, max?: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [lMin, setLMin] = useState(feeMin ? String(feeMin) : '')
  const [lMax, setLMax] = useState(feeMax ? String(feeMax) : '')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const active = !!(feeMin || feeMax)
  const label = active
    ? `₹${feeMin?.toLocaleString('en-IN') ?? '0'} – ${feeMax ? '₹' + feeMax.toLocaleString('en-IN') : '∞'}`
    : 'Fee Range'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={clsx(
          'group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          active
            ? 'bg-gold border-gold text-white shadow-gold'
            : 'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink hover:shadow-sm'
        )}>
        <span className="font-semibold">{label}</span>
        {active ? (
          <span onClick={e => { e.stopPropagation(); onChange(undefined, undefined); setLMin(''); setLMax('') }}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition-colors">
            <X className="w-2.5 h-2.5" />
          </span>
        ) : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200 text-ink-faint group-hover:text-gold', open && 'rotate-180')} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...DROP_ANIM}
            className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl p-4 w-64"
            style={{ boxShadow: '0 8px 40px rgba(13,17,23,0.12), 0 2px 8px rgba(13,17,23,0.06)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Monthly Fee (₹)</p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="text-xs text-ink-muted mb-1 block">Min</label>
                <input type="number" placeholder="e.g. 3000" value={lMin} onChange={e => setLMin(e.target.value)}
                  className="w-full border border-[rgba(13,17,23,0.14)] rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-muted mb-1 block">Max</label>
                <input type="number" placeholder="e.g. 15000" value={lMax} onChange={e => setLMax(e.target.value)}
                  className="w-full border border-[rgba(13,17,23,0.14)] rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all" />
              </div>
            </div>
            <button onClick={() => { onChange(lMin ? Number(lMin) : undefined, lMax ? Number(lMax) : undefined); setOpen(false) }}
              className="w-full py-2.5 rounded-xl bg-ink text-ivory text-sm font-semibold hover:bg-gold transition-colors duration-200">
              Apply Range
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── More Filters panel ─── */
function MoreFilters({ filters, onChange }: { filters: Filters; onChange: (k: string, v: unknown) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const { options: facilities } = useDropdown('facility')
  const { options: sports     } = useDropdown('sport')
  const { options: extraCurr  } = useDropdown('extra_curricular')
  const { options: languages  } = useDropdown('language')
  if (!facilities.length && !sports.length && !extraCurr.length && !languages.length) return null

  const totalActive =
    (filters.facilities?.length ?? 0) + (filters.sports?.length ?? 0) +
    (filters.extraCurricular?.length ?? 0) + (filters.language?.length ?? 0)

  const ToggleGroup = ({ title, emoji, opts, fieldKey }: { title: string; emoji: string; opts: { label: string; value: string }[]; fieldKey: string }) => {
    if (!opts.length) return null
    const sel: string[] = (filters as any)[fieldKey] ?? []
    return (
      <div className="mb-5 last:mb-0">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2.5 flex items-center gap-1.5">
          <span>{emoji}</span>{title}
        </p>
        <div className="flex flex-wrap gap-2">
          {opts.map(o => {
            const on = sel.includes(o.value)
            return (
              <button key={o.value} onClick={() => {
                const next = on ? sel.filter(x => x !== o.value) : [...sel, o.value]
                onChange(fieldKey, next.length ? next : undefined)
              }}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                  on
                    ? 'bg-gold border-gold text-white shadow-sm'
                    : 'bg-ivory border-[rgba(13,17,23,0.1)] text-ink-light hover:border-gold hover:text-ink hover:bg-gold-wash'
                )}>
                {on && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={clsx(
          'group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          totalActive > 0
            ? 'bg-gold border-gold text-white shadow-gold'
            : 'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink hover:shadow-sm'
        )}>
        <Plus className="w-3.5 h-3.5" />
        <span className="font-semibold">More Filters{totalActive > 0 ? ` (${totalActive})` : ''}</span>
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200 text-current opacity-60', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div {...DROP_ANIM}
            className="absolute top-full right-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl w-[520px] max-h-[520px] overflow-y-auto"
            style={{ boxShadow: '0 16px 60px rgba(13,17,23,0.14), 0 4px 16px rgba(13,17,23,0.06)' }}>
            <div className="sticky top-0 bg-white border-b border-[rgba(13,17,23,0.07)] px-5 py-3.5 flex items-center justify-between rounded-t-2xl z-10">
              <span className="font-display font-bold text-ink text-base">More Filters</span>
              <div className="flex items-center gap-3">
                {totalActive > 0 && (
                  <button onClick={() => {
                    onChange('facilities', undefined); onChange('sports', undefined)
                    onChange('extraCurricular', undefined); onChange('language', undefined)
                  }} className="text-xs text-gold font-semibold hover:text-gold-2 transition-colors">
                    Clear all ({totalActive})
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-ivory hover:bg-ivory-2 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-ink-light" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <ToggleGroup title="Facilities"            emoji="🏗️" opts={facilities} fieldKey="facilities"     />
              <ToggleGroup title="Sports"                emoji="⚽" opts={sports}     fieldKey="sports"          />
              <ToggleGroup title="Extra Curricular"      emoji="🎭" opts={extraCurr}  fieldKey="extraCurricular" />
              <ToggleGroup title="Languages Offered"     emoji="🗣️" opts={languages}  fieldKey="language"        />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[rgba(13,17,23,0.07)] p-4 rounded-b-2xl">
              <button onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl bg-ink text-ivory text-sm font-bold hover:bg-gold transition-colors duration-200">
                Apply {totalActive > 0 ? `${totalActive} Filter${totalActive > 1 ? 's' : ''}` : 'Filters'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── School card ─── */
function SchoolCard({ school }: { school: School }) {
  return (
    <Link href={`/schools/${school.slug}`} className="card-hover block p-5 flex gap-4 items-start" style={{ borderRadius: 16 }}>
      <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-ivory-2 flex-shrink-0 border border-[rgba(13,17,23,0.07)] flex items-center justify-center">
        {school.logoUrl
          ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-2" loading="lazy" />
          : <GraduationCap className="w-8 h-8 text-ink-faint" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-display font-bold text-ink text-[17px] leading-tight group-hover:text-gold transition-colors"
              style={{ fontFamily: 'var(--font-serif)' }}>{school.name}</h3>
            <div className="flex items-center gap-1 text-ink-muted text-xs mt-0.5">
              <MapPin className="w-3 h-3 text-gold" />{school.city}{school.state ? `, ${school.state}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {school.isVerified && <span className="badge-green text-[10px]"><BadgeCheck className="w-3 h-3" />Verified</span>}
            {school.isFeatured && <span className="badge-gold text-[10px]">⭐ Featured</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 my-2.5">
          {school.board.slice(0, 2).map(b => <span key={b} className="badge-gold text-[10px]">{b}</span>)}
          {school.schoolType && <span className="badge-light text-[10px]">{school.schoolType}</span>}
          {school.genderPolicy && <span className="badge-light text-[10px]">{school.genderPolicy}</span>}
          {school.mediumOfInstruction && <span className="badge-light text-[10px]">{school.mediumOfInstruction}</span>}
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(13,17,23,0.06)]">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="font-bold text-ink">{school.avgRating.toFixed(1)}</span>
              <span className="text-ink-faint">({school.totalReviews})</span>
            </span>
            {school.classesFrom && school.classesTo &&
              <span className="text-ink-muted">Class {school.classesFrom}–{school.classesTo}</span>}
          </div>
          {school.monthlyFeeMin && (
            <span className="font-display font-bold text-gold text-sm">
              ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
              <span className="text-ink-faint font-sans font-normal text-xs">/mo</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 flex gap-4">
      <div className="skeleton w-[72px] h-[72px] rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-5 w-2/3 rounded-lg" />
        <div className="skeleton h-3.5 w-1/3 rounded-lg" />
        <div className="flex gap-2 mt-1"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-16 rounded-full" /></div>
        <div className="skeleton h-3.5 w-1/2 rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Guest modal ─── */
function GuestModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
        className="relative bg-white rounded-3xl p-8 max-w-[420px] w-full text-center"
        style={{ boxShadow: '0 32px 80px rgba(13,17,23,0.2), 0 8px 24px rgba(13,17,23,0.1)' }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ivory hover:bg-ivory-2 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-ink-light" />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-gold-wash border border-gold/20 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-gold" />
        </div>
        <h2 className="font-display font-bold text-ink text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
          Create a Free Account
        </h2>
        <p className="text-ink-muted text-sm mb-7 leading-relaxed">
          Sign up in 30 seconds to search, compare and save schools. Completely free for parents — always.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/register" onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-ink text-ivory text-sm font-bold hover:bg-gold transition-colors duration-200">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" onClick={onClose}
            className="flex items-center justify-center w-full py-3 rounded-2xl border-2 border-[rgba(13,17,23,0.12)] text-ink-light text-sm font-semibold hover:border-ink hover:text-ink transition-all duration-200">
            Already have an account? Log in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Active filter chip ─── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-gold-wash border border-gold/30 text-xs font-semibold text-ink"
    >
      {label}
      <button onClick={onRemove}
        className="w-4 h-4 rounded-full bg-gold/15 hover:bg-gold/30 flex items-center justify-center transition-colors">
        <X className="w-2.5 h-2.5 text-ink" />
      </button>
    </motion.span>
  )
}

/* ─── Main ─── */
export function SchoolListingClient() {
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const [filters, setFilters] = useState<Filters>({
    ...INIT,
    query: searchParams.get('q') || undefined,
    city:  searchParams.get('city') || undefined,
  })
  const [applied, setApplied] = useState<Filters>({ ...INIT })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showGuest, setShowGuest] = useState(false)

  /* all dropdowns from DB — zero hardcoding */
  const { options: states  } = useDropdown('state')
  const { options: cities  } = useDropdown('city', { parentValue: filters.state || undefined, enabled: true })
  const { options: boards  } = useDropdown('board')
  const { options: types   } = useDropdown('school_type')
  const { options: genders } = useDropdown('gender_policy')
  const { options: mediums } = useDropdown('medium')

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools', applied],
    queryFn: () => fetchSchools(applied),
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
    if (!isAuthenticated) { setShowGuest(true); return }
    setApplied({ ...filters, page: 1 })
  }, [isAuthenticated, filters])

  const reset = useCallback(() => { setFilters(INIT); setApplied(INIT) }, [])

  const schools = data?.data ?? []
  const total   = data?.total ?? 0
  const totalPg = data?.totalPages ?? 1

  /* build active chips */
  type Chip = { label: string; clear: () => void }
  const chips: Chip[] = []
  if (applied.state)        chips.push({ label: `🗺 ${applied.state}`, clear: () => { set('state', undefined); set('city', undefined); setApplied(f => ({...f, state: undefined, city: undefined})) }})
  if (applied.city)         chips.push({ label: `📍 ${applied.city}`,  clear: () => { set('city', undefined);  setApplied(f => ({...f, city: undefined})) }})
  if (applied.schoolType)   chips.push({ label: applied.schoolType,    clear: () => set('schoolType', undefined) })
  if (applied.genderPolicy) chips.push({ label: applied.genderPolicy,  clear: () => set('genderPolicy', undefined) })
  if (applied.medium)       chips.push({ label: applied.medium,        clear: () => set('medium', undefined) })
  applied.board?.forEach(b =>            chips.push({ label: b, clear: () => set('board', applied.board?.filter(x => x !== b)) }))
  applied.facilities?.forEach(f =>       chips.push({ label: `🏗 ${f}`, clear: () => set('facilities', applied.facilities?.filter(x => x !== f)) }))
  applied.sports?.forEach(s =>           chips.push({ label: `⚽ ${s}`, clear: () => set('sports', applied.sports?.filter(x => x !== s)) }))
  applied.extraCurricular?.forEach(e =>  chips.push({ label: `🎭 ${e}`, clear: () => set('extraCurricular', applied.extraCurricular?.filter(x => x !== e)) }))
  applied.language?.forEach(l =>         chips.push({ label: `🗣 ${l}`, clear: () => set('language', applied.language?.filter(x => x !== l)) }))

  const activeFilterCount = [
    filters.state, filters.city, filters.schoolType, filters.genderPolicy, filters.medium,
    filters.feeMin, filters.feeMax, filters.rating, filters.isFeatured,
  ].filter(Boolean).length +
    (filters.board?.length ?? 0) + (filters.facilities?.length ?? 0) +
    (filters.sports?.length ?? 0) + (filters.extraCurricular?.length ?? 0) +
    (filters.language?.length ?? 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--schools-page-bg, #FAF7F2)' }}>
      <AnimatePresence>{showGuest && <GuestModal onClose={() => setShowGuest(false)} />}</AnimatePresence>

      {/* ─── Hero ─── */}
      <div className="border-b border-[rgba(13,17,23,0.07)]" style={{ background: 'var(--hero-bg, #FAF7F2)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="font-display font-bold text-ink mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {filters.city
              ? <>Schools in <span style={{ color: 'var(--gold)' }}>{filters.city}</span></>
              : filters.state
                ? <>Schools in <span style={{ color: 'var(--gold)' }}>{filters.state}</span></>
                : <>Find Schools <span style={{ color: 'var(--gold)' }}>Across India</span></>}
          </motion.h1>
          <p className="text-ink-muted text-sm mb-7">Search, compare and shortlist from 12,000+ verified schools</p>

          {/* Search + button — same row */}
          <div className="flex gap-3 max-w-2xl mb-6">
            <div className="flex items-center gap-3 flex-1 bg-white border border-[rgba(13,17,23,0.14)] rounded-2xl px-4 py-3 focus-within:border-gold focus-within:shadow-[0_0_0_3px_rgba(184,134,11,0.1)] transition-all duration-200"
              style={{ boxShadow: '0 2px 8px rgba(13,17,23,0.06)' }}>
              <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input
                type="text"
                placeholder="School name, board, area, city…"
                value={filters.query || ''}
                onChange={e => set('query', e.target.value || undefined)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="flex-1 bg-transparent outline-none text-ink text-sm placeholder:text-ink-faint"
              />
              {filters.query && (
                <button onClick={() => set('query', undefined)}
                  className="w-5 h-5 rounded-full bg-ivory-2 flex items-center justify-center hover:bg-ivory-3 transition-colors">
                  <X className="w-3 h-3 text-ink-light" />
                </button>
              )}
            </div>
            <button onClick={search}
              className="flex items-center gap-2.5 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 hover:shadow-gold hover:-translate-y-0.5"
              style={{ background: 'var(--ink)', color: 'var(--ivory)', boxShadow: '0 2px 8px rgba(13,17,23,0.2)' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)'}>
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          {/* ─── Filter pills bar ─── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-faint mr-1 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </span>

            <SelectPill label="State"         icon="🗺️" value={filters.state || ''}        options={states}  onChange={v => set('state', v || undefined)} />
            <SelectPill label="City"          icon="📍" value={filters.city  || ''}        options={cities}  onChange={v => set('city',  v || undefined)} />
            <MultiPill  label="Board"         icon="📚" options={boards}  selected={filters.board        ?? []} onChange={v => set('board',        v.length ? v : undefined)} />
            <SelectPill label="School Type"   icon="🏫" value={filters.schoolType   || ''} options={types}   onChange={v => set('schoolType',   v || undefined)} />
            <SelectPill label="Gender Policy" icon="⚧️" value={filters.genderPolicy || ''} options={genders} onChange={v => set('genderPolicy', v || undefined)} />
            <SelectPill label="Medium"        icon="🗣" value={filters.medium       || ''} options={mediums} onChange={v => set('medium',       v || undefined)} />
            <FeePill feeMin={filters.feeMin} feeMax={filters.feeMax} onChange={(min, max) => { set('feeMin', min); set('feeMax', max) }} />
            <MultiPill label="Rating" icon="⭐" options={[
              { label: '3+ Stars', value: '3' }, { label: '3.5+ Stars', value: '3.5' },
              { label: '4+ Stars', value: '4' }, { label: '4.5+ Stars', value: '4.5' },
            ]} selected={filters.rating ? [String(filters.rating)] : []}
              onChange={v => set('rating', v.length ? Number(v[v.length - 1]) : undefined)} />

            <MoreFilters filters={filters} onChange={set} />

            {activeFilterCount > 0 && (
              <button onClick={reset}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-ink-muted hover:text-ink transition-colors duration-150">
                <X className="w-3.5 h-3.5" /> Reset ({activeFilterCount})
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-ink-faint text-xs mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              <Link href="/register" className="text-gold font-semibold hover:underline">Register free</Link>
              <span>to search, save and compare schools</span>
            </p>
          )}
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Active chips */}
        <AnimatePresence>
          {chips.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-5 overflow-hidden">
              {chips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.clear} />)}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-5">
          <p className="text-ink-muted text-sm">
            {isLoading
              ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin inline-block" /> Searching…</span>
              : <><span className="font-bold text-ink">{total.toLocaleString('en-IN')}</span> schools found
                {isFetching && !isLoading && <span className="ml-2 text-gold text-xs animate-pulse">Updating…</span>}
              </>}
          </p>
          <div className="flex items-center gap-2">
            <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)}
              className="border border-[rgba(13,17,23,0.12)] rounded-xl px-3 py-2 text-xs text-ink bg-white outline-none focus:border-gold transition-colors cursor-pointer">
              <option value="rating">Best Rated</option>
              <option value="newest">Newest First</option>
              <option value="fee_asc">Fee: Low → High</option>
              <option value="fee_desc">Fee: High → Low</option>
            </select>
            <div className="flex border border-[rgba(13,17,23,0.12)] rounded-xl overflow-hidden bg-white">
              <button onClick={() => setViewMode('list')}
                className={clsx('p-2 transition-colors', viewMode === 'list' ? 'bg-ink text-ivory' : 'text-ink-muted hover:bg-ivory')}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={clsx('p-2 transition-colors', viewMode === 'grid' ? 'bg-ink text-ivory' : 'text-ink-muted hover:bg-ivory')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className={clsx('gap-4', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col')}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : schools.length === 0
              ? (
                <div className="col-span-full py-24 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-ivory-2 border border-[rgba(13,17,23,0.07)] flex items-center justify-center">
                    <Search className="w-7 h-7 text-ink-faint" />
                  </div>
                  <h3 className="font-display font-bold text-ink text-xl" style={{ fontFamily: 'var(--font-serif)' }}>No Schools Found</h3>
                  <p className="text-ink-muted text-sm text-center max-w-sm">Try different filters or a broader search term.</p>
                  <button onClick={reset}
                    className="mt-1 px-6 py-2.5 rounded-xl bg-ink text-ivory text-sm font-semibold hover:bg-gold transition-colors duration-200">
                    Reset Filters
                  </button>
                </div>
              )
              : schools.map(school => <SchoolCard key={school.id} school={school} />)}
        </div>

        {!isLoading && totalPg > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={(applied.page ?? 1) <= 1}
              onClick={() => { const p = (applied.page ?? 1) - 1; set('page', p); setApplied(f => ({...f, page: p})) }}
              className="px-5 py-2.5 rounded-xl border border-[rgba(13,17,23,0.12)] bg-white text-ink-light text-sm font-medium hover:border-gold hover:text-gold disabled:opacity-40 transition-all duration-150">
              ← Prev
            </button>
            <span className="text-ink-muted text-sm">
              Page <span className="font-bold text-ink">{applied.page}</span> of <span className="font-bold text-ink">{totalPg}</span>
            </span>
            <button
              disabled={(applied.page ?? 1) >= totalPg}
              onClick={() => { const p = (applied.page ?? 1) + 1; set('page', p); setApplied(f => ({...f, page: p})) }}
              className="px-5 py-2.5 rounded-xl border border-[rgba(13,17,23,0.12)] bg-white text-ink-light text-sm font-medium hover:border-gold hover:text-gold disabled:opacity-40 transition-all duration-150">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
