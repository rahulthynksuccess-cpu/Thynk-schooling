'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Save, Loader2, DollarSign, Info, MapPin, ChevronDown,
  Trash2, ToggleLeft, ToggleRight, Clock, Radio,
  Building2, ChevronRight, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra & Nagar Haveli',
  'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

interface StatePricing {
  id?: string
  state: string
  defaultPricePaise: number
  minPricePaise: number
  maxPricePaise: number
  isActive: boolean
}

interface CityPricing {
  id?: string
  cityName: string
  state: string
  defaultPricePaise: number
  minPricePaise: number
  maxPricePaise: number
  isActive: boolean
}

interface PricingConfig {
  defaultPricePaise:    number
  minPricePaise:        number
  maxPricePaise:        number
  maskBlurMeters:       number
  leadExpiryDays:       number
  discoveryWindowDays:  number
  radiusKm:             number
  statePricing:         StatePricing[]
  cityPricing:          CityPricing[]
}

const DEFAULTS: PricingConfig = {
  defaultPricePaise:   29900,
  minPricePaise:        9900,
  maxPricePaise:       99900,
  maskBlurMeters:       1000,
  leadExpiryDays:         30,
  discoveryWindowDays:    90,
  radiusKm:               10,
  statePricing:           [],
  cityPricing:            [],
}

const WINDOW_PRESETS = [
  { label: '30 days',  value: 30  },
  { label: '60 days',  value: 60  },
  { label: '90 days',  value: 90  },
  { label: '180 days', value: 180 },
  { label: '1 year',   value: 365 },
]
const RADIUS_PRESETS = [
  { label: '2 km',  value: 2  },
  { label: '5 km',  value: 5  },
  { label: '10 km', value: 10 },
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
]

// ── styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--admin-card-bg,#0F1623)',
  border: '1px solid var(--admin-border,rgba(255,255,255,0.07))',
  borderRadius: 14, padding: 24,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '.1em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)', marginBottom: 8,
  fontFamily: 'DM Sans,sans-serif',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#fff', fontSize: 14,
  fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box',
}
const hint: React.CSSProperties = {
  fontSize: 11, color: 'rgba(255,255,255,0.4)',
  marginTop: 5, fontFamily: 'DM Sans,sans-serif',
}

// ── PresetPills ──────────────────────────────────────────────────────────────
function PresetPills({ presets, value, onChange }: {
  presets: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {presets.map(p => (
        <button key={p.value} type="button" onClick={() => onChange(p.value)} style={{
          padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: '1px solid',
          borderColor: value === p.value ? '#F59E0B' : 'rgba(255,255,255,0.12)',
          background: value === p.value ? 'rgba(245,158,11,0.15)' : 'transparent',
          color: value === p.value ? '#F59E0B' : 'rgba(255,255,255,0.45)',
          fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
        }}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── StateDropdown ────────────────────────────────────────────────────────────
function StateDropdown({ selected, onAdd }: {
  selected: string[]
  onAdd: (s: string) => void
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = INDIAN_STATES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase()) && !selected.includes(s)
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        ...inp, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', cursor: 'pointer',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Add state override…</span>
        <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.15s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: .15 }}
            style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: '#0F1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ padding: 8 }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search states…" style={{ ...inp, padding: '8px 12px', fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {filtered.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No states available</div>
                : filtered.map(s => (
                  <button key={s} type="button"
                    onClick={() => { onAdd(s); setOpen(false); setSearch('') }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >{s}</button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── CityPricingTable — all cities listed by default, editable inline ─────────
function CityPricingTable({
  state,
  statePricing,
  cityPricing,
  allCities,
  globalDefault,
  onSetCity,
  onRemoveCity,
}: {
  state: string
  statePricing: StatePricing
  cityPricing: CityPricing[]
  allCities: { name: string; slug: string }[]
  globalDefault: number
  onSetCity: (cityName: string, state: string, prices: { defaultPricePaise: number; minPricePaise: number; maxPricePaise: number }) => void
  onRemoveCity: (cityName: string, state: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter]     = useState('')

  // The "effective" state price to show as inherited placeholder
  const stateDefault = statePricing.isActive ? statePricing.defaultPricePaise : globalDefault
  const stateMin     = statePricing.isActive ? statePricing.minPricePaise     : 9900
  const stateMax     = statePricing.isActive ? statePricing.maxPricePaise     : 99900

  const overrideCount = cityPricing.filter(c => c.state === state).length

  const displayCities = allCities.filter(c =>
    filter === '' || c.name.toLowerCase().includes(filter.toLowerCase())
  )

  if (allCities.length === 0) return (
    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
      No cities configured for {state} — add them in <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Admin → Cities Manager</strong> first.
    </div>
  )

  return (
    <div style={{ marginTop: 14 }}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, width: '100%' }}
      >
        <ChevronRight size={13} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '.15s', flexShrink: 0 }} />
        <Building2 size={13} style={{ flexShrink: 0 }} />
        <span>City-wise Pricing</span>
        <span style={{ padding: '1px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontSize: 11, fontWeight: 700 }}>
          {allCities.length} cities
        </span>
        {overrideCount > 0 && (
          <span style={{ padding: '1px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
            {overrideCount} custom
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
          {expanded ? 'collapse' : 'expand to set per-city prices'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: .2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: 10 }}>
              {/* Filter bar */}
              {allCities.length > 6 && (
                <div style={{ marginBottom: 10 }}>
                  <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder={`Filter cities in ${state}…`}
                    style={{ ...inp, padding: '8px 12px', fontSize: 12 }}
                  />
                </div>
              )}

              {/* Legend row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 32px', gap: 8, padding: '6px 10px', marginBottom: 4 }}>
                <div style={{ ...lbl, marginBottom: 0, fontSize: 10 }}>City</div>
                <div style={{ ...lbl, marginBottom: 0, fontSize: 10 }}>Default (₹)</div>
                <div style={{ ...lbl, marginBottom: 0, fontSize: 10 }}>Min (₹)</div>
                <div style={{ ...lbl, marginBottom: 0, fontSize: 10 }}>Max (₹)</div>
                <div />
              </div>

              {/* City rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
                {displayCities.map(city => {
                  const override = cityPricing.find(
                    c => c.cityName.toLowerCase() === city.name.toLowerCase() && c.state === state
                  )
                  const hasOverride = !!override
                  const defVal  = hasOverride ? override!.defaultPricePaise : stateDefault
                  const minVal  = hasOverride ? override!.minPricePaise     : stateMin
                  const maxVal  = hasOverride ? override!.maxPricePaise     : stateMax

                  const handleChange = (field: 'defaultPricePaise' | 'minPricePaise' | 'maxPricePaise', raw: string) => {
                    const n = Number(raw)
                    if (isNaN(n)) return
                    // When user edits any field, create/update the override
                    onSetCity(city.name, state, {
                      defaultPricePaise: field === 'defaultPricePaise' ? n : defVal,
                      minPricePaise:     field === 'minPricePaise'     ? n : minVal,
                      maxPricePaise:     field === 'maxPricePaise'     ? n : maxVal,
                    })
                  }

                  const rupeesDefault = Math.round(defVal / 100)

                  return (
                    <div
                      key={city.slug}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 110px 110px 110px 32px',
                        gap: 8, alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: hasOverride ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${hasOverride ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)'}`,
                        transition: 'background .15s',
                      }}
                    >
                      {/* City name + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <Building2 size={11} color={hasOverride ? '#818CF8' : 'rgba(255,255,255,0.25)'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: hasOverride ? '#fff' : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {city.name}
                        </span>
                        {hasOverride ? (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(99,102,241,0.2)', color: '#818CF8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            ₹{rupeesDefault} custom
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            ₹{rupeesDefault} inherited
                          </span>
                        )}
                      </div>

                      {/* Default price (paise input, shows ₹ value) */}
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number" min={0}
                          value={defVal}
                          onChange={e => handleChange('defaultPricePaise', e.target.value)}
                          style={{
                            ...inp, padding: '6px 8px', fontSize: 12,
                            borderColor: hasOverride ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                            background: hasOverride ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
                          }}
                        />
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'right', fontFamily: 'DM Sans,sans-serif' }}>
                          ₹{Math.round(defVal / 100)}
                        </div>
                      </div>

                      {/* Min price */}
                      <div>
                        <input
                          type="number" min={0}
                          value={minVal}
                          onChange={e => handleChange('minPricePaise', e.target.value)}
                          style={{
                            ...inp, padding: '6px 8px', fontSize: 12,
                            borderColor: hasOverride ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                            background: hasOverride ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
                          }}
                        />
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'right', fontFamily: 'DM Sans,sans-serif' }}>
                          ₹{Math.round(minVal / 100)}
                        </div>
                      </div>

                      {/* Max price */}
                      <div>
                        <input
                          type="number" min={0}
                          value={maxVal}
                          onChange={e => handleChange('maxPricePaise', e.target.value)}
                          style={{
                            ...inp, padding: '6px 8px', fontSize: 12,
                            borderColor: hasOverride ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                            background: hasOverride ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
                          }}
                        />
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'right', fontFamily: 'DM Sans,sans-serif' }}>
                          ₹{Math.round(maxVal / 100)}
                        </div>
                      </div>

                      {/* Clear override button — only visible when custom */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {hasOverride ? (
                          <button
                            type="button"
                            title="Remove override — revert to state price"
                            onClick={() => onRemoveCity(city.name, state)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', padding: 2, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <div style={{ width: 17 }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {displayCities.length === 0 && (
                <div style={{ padding: '16px 0', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'DM Sans,sans-serif' }}>
                  No cities match "{filter}"
                </div>
              )}

              {/* Footer legend */}
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(99,102,241,0.4)', marginRight: 5, verticalAlign: 'middle' }} />
                  Custom price set
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginRight: 5, verticalAlign: 'middle' }} />
                  Inherited from state — edit to override
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
                  Prices are in paise (100 paise = ₹1)
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadPricingPage() {
  const queryClient = useQueryClient()
  const [cfg, setCfg]             = useState<PricingConfig>(DEFAULTS)
  const [seoCities, setSeoCities] = useState<{ name: string; slug: string; state: string }[]>([])

  const { data, isLoading } = useQuery<PricingConfig & { statePricing: StatePricing[]; cityPricing: CityPricing[] }>({
    queryKey: ['lead-pricing-cfg'],
    queryFn: () => fetch('/api/admin/lead-pricing', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!data) return
    setCfg({
      ...DEFAULTS,
      ...data,
      discoveryWindowDays: data.discoveryWindowDays ?? DEFAULTS.discoveryWindowDays,
      radiusKm:            data.radiusKm            ?? DEFAULTS.radiusKm,
      statePricing:        data.statePricing         ?? [],
      cityPricing:         data.cityPricing          ?? [],
    })
  }, [data])

  useEffect(() => {
    fetch('/api/admin?action=cities', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.cities) setSeoCities(d.cities) })
      .catch(() => {})
  }, [])

  const refreshCities = () => {
    fetch('/api/admin?action=cities', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.cities) { setSeoCities(d.cities); toast.success('City list refreshed') } })
      .catch(() => toast.error('Failed to refresh cities'))
  }

  const saveMutation = useMutation({
    mutationFn: (payload: PricingConfig) =>
      fetch('/api/admin/lead-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Settings saved!')
      queryClient.invalidateQueries({ queryKey: ['lead-pricing-cfg'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const set = <K extends keyof PricingConfig>(key: K, val: PricingConfig[K]) =>
    setCfg(c => ({ ...c, [key]: val }))

  // ── State helpers ──────────────────────────────────────────────────────────
  const addState = (state: string) => {
    if (cfg.statePricing.find(s => s.state === state)) return
    setCfg(c => ({
      ...c,
      statePricing: [...c.statePricing, {
        state,
        defaultPricePaise: c.defaultPricePaise,
        minPricePaise:     c.minPricePaise,
        maxPricePaise:     c.maxPricePaise,
        isActive:          true,
      }],
    }))
  }

  const updateState = (state: string, key: keyof StatePricing, val: any) =>
    setCfg(c => ({
      ...c,
      statePricing: c.statePricing.map(s => s.state === state ? { ...s, [key]: val } : s),
    }))

  const removeState = (state: string) =>
    setCfg(c => ({
      ...c,
      statePricing: c.statePricing.filter(s => s.state !== state),
      cityPricing:  c.cityPricing.filter(cp => cp.state !== state),
    }))

  // ── City helpers ───────────────────────────────────────────────────────────
  // setCity = create-or-update a city override
  const setCity = (
    cityName: string,
    state: string,
    prices: { defaultPricePaise: number; minPricePaise: number; maxPricePaise: number }
  ) => {
    setCfg(c => {
      const exists = c.cityPricing.find(
        cp => cp.cityName.toLowerCase() === cityName.toLowerCase() && cp.state === state
      )
      if (exists) {
        return {
          ...c,
          cityPricing: c.cityPricing.map(cp =>
            cp.cityName.toLowerCase() === cityName.toLowerCase() && cp.state === state
              ? { ...cp, ...prices }
              : cp
          ),
        }
      }
      return {
        ...c,
        cityPricing: [...c.cityPricing, { cityName, state, ...prices, isActive: true }],
      }
    })
  }

  const removeCity = (cityName: string, state: string) =>
    setCfg(c => ({
      ...c,
      cityPricing: c.cityPricing.filter(
        cp => !(cp.cityName.toLowerCase() === cityName.toLowerCase() && cp.state === state)
      ),
    }))

  if (isLoading) return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#F59E0B' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </AdminLayout>
  )

  const rupeesPreview = `₹${Math.round(cfg.defaultPricePaise / 100).toLocaleString('en-IN')}`
  const totalCityOverrides = cfg.cityPricing.length

  return (
    <AdminLayout>
      <div style={{ maxWidth: 920, margin: '0 auto', fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Lead Pricing &amp; Discovery</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Prices cascade: <strong style={{ color: '#818CF8' }}>City</strong> → <strong style={{ color: '#F59E0B' }}>State</strong> → <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Global</strong>. Override at any level.
            </p>
          </div>
          <button onClick={() => saveMutation.mutate(cfg)} disabled={saveMutation.isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {saveMutation.isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            Save Settings
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Global Pricing ─────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Global Default Pricing</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Applies to all cities/states with no override</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
              {([
                { label: 'Default Price (paise)', key: 'defaultPricePaise', hint: `${cfg.defaultPricePaise} paise = ₹${Math.round(cfg.defaultPricePaise/100)}` },
                { label: 'Min Price (paise)',     key: 'minPricePaise',     hint: `${cfg.minPricePaise} paise = ₹${Math.round(cfg.minPricePaise/100)}` },
                { label: 'Max Price (paise)',     key: 'maxPricePaise',     hint: `${cfg.maxPricePaise} paise = ₹${Math.round(cfg.maxPricePaise/100)}` },
              ] as { label: string; key: keyof PricingConfig; hint: string }[]).map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input type="number" min={0}
                    value={cfg[f.key] as number}
                    onChange={e => set(f.key, Number(e.target.value))}
                    style={inp} />
                  <div style={hint}>{f.hint}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 13, color: '#F59E0B' }}>
              💡 Default per-lead price: <strong>{rupeesPreview}</strong>. State &amp; city overrides take priority when set.
            </div>
          </div>

          {/* ── Discovery Controls ─────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#818CF8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Discovery Lead Controls</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Controls geo/pincode/search leads surfaced to schools</div>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
              <Info size={15} color="#818CF8" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
                Discovery leads are parents who registered nearby or searched in a school's area — even without directly applying. Schools see these masked and pay to unlock.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={lbl}><Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Discovery Window (days)</label>
                <input type="number" min={1} max={730} value={cfg.discoveryWindowDays}
                  onChange={e => set('discoveryWindowDays', Math.max(1, Number(e.target.value)))} style={inp} />
                <div style={hint}>Leads within this window are surfaced to matching schools.</div>
                <PresetPills presets={WINDOW_PRESETS} value={cfg.discoveryWindowDays} onChange={v => set('discoveryWindowDays', v)} />
              </div>
              <div>
                <label style={lbl}><Radio size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Geo Radius (km)</label>
                <input type="number" min={1} max={100} value={cfg.radiusKm}
                  onChange={e => set('radiusKm', Math.max(1, Number(e.target.value)))} style={inp} />
                <div style={hint}>Parent must be within this radius of the school.</div>
                <PresetPills presets={RADIUS_PRESETS} value={cfg.radiusKm} onChange={v => set('radiusKm', v)} />
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <span style={{ fontSize: 13, color: '#fff' }}>📅 Last <strong style={{ color: '#F59E0B' }}>{cfg.discoveryWindowDays} days</strong></span>
              <span style={{ fontSize: 13, color: '#fff' }}>📡 Within <strong style={{ color: '#F59E0B' }}>{cfg.radiusKm} km</strong></span>
              <span style={{ fontSize: 13, color: '#fff' }}>💵 Default: <strong style={{ color: '#F59E0B' }}>{rupeesPreview}</strong></span>
            </div>
          </div>

          {/* ── Display & Expiry ───────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Display &amp; Expiry</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Map blur radius and lead shelf-life</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
              <div>
                <label style={lbl}>Map Blur (metres)</label>
                <input type="number" min={0} value={cfg.maskBlurMeters}
                  onChange={e => set('maskBlurMeters', Number(e.target.value))} style={inp} />
                <div style={hint}>How far to blur the parent's map pin. 1000 = 1 km.</div>
              </div>
              <div>
                <label style={lbl}>Lead Expiry (days)</label>
                <input type="number" min={1} value={cfg.leadExpiryDays}
                  onChange={e => set('leadExpiryDays', Number(e.target.value))} style={inp} />
                <div style={hint}>After this many days a lead is archived from school view.</div>
              </div>
            </div>
          </div>

          {/* ── State & City Overrides ─────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="#F59E0B" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>State &amp; City Pricing</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {cfg.statePricing.length} state{cfg.statePricing.length !== 1 ? 's' : ''}
                    {totalCityOverrides > 0 && (
                      <span> · <span style={{ color: '#818CF8' }}>{totalCityOverrides} city price{totalCityOverrides !== 1 ? 's' : ''} customised</span></span>
                    )}
                  </div>
                </div>
              </div>
              <button type="button" onClick={refreshCities}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans,sans-serif' }}>
                <RefreshCw size={12} />
                Refresh Cities
              </button>
            </div>

            {/* Cascade banner */}
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              <strong style={{ color: '#F59E0B' }}>How it works:</strong> Add a state below, set its price.
              Then expand "City-wise Pricing" inside any state to see <em>all cities of that state listed</em>.
              Edit any city's price to set a custom rate — others continue to inherit the state price.
              New cities added in Cities Manager appear here automatically after Refresh.
            </div>

            <StateDropdown selected={cfg.statePricing.map(s => s.state)} onAdd={addState} />

            {cfg.statePricing.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                No states added yet. Use the dropdown above to add a state and configure city-level pricing.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: cfg.statePricing.length ? 18 : 0 }}>
              {cfg.statePricing.map(sp => {
                const citiesForState = seoCities
                  .filter(c => c.state?.toLowerCase() === sp.state.toLowerCase())
                  .map(c => ({ name: c.name, slug: c.slug }))
                const cityOverrideCount = cfg.cityPricing.filter(c => c.state === sp.state).length

                return (
                  <div key={sp.state} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>

                    {/* State header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <MapPin size={14} color="#F59E0B" />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{sp.state}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: sp.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sp.isActive ? '#10B981' : '#EF4444' }}>
                          {sp.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {citiesForState.length > 0 && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                            {citiesForState.length} cities · {cityOverrideCount} with custom price
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => updateState(sp.state, 'isActive', !sp.isActive)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: sp.isActive ? '#10B981' : 'rgba(255,255,255,0.3)', padding: 4 }}>
                          {sp.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button type="button" onClick={() => removeState(sp.state)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', padding: 4 }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* State-level prices */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                      {([
                        { label: 'State Default (paise)', key: 'defaultPricePaise' as keyof StatePricing },
                        { label: 'Min (paise)',           key: 'minPricePaise'     as keyof StatePricing },
                        { label: 'Max (paise)',           key: 'maxPricePaise'     as keyof StatePricing },
                      ]).map(f => (
                        <div key={f.key}>
                          <label style={{ ...lbl, marginBottom: 4 }}>{f.label}</label>
                          <input type="number" min={0}
                            value={sp[f.key] as number}
                            onChange={e => updateState(sp.state, f.key, Number(e.target.value))}
                            style={{ ...inp, padding: '8px 12px' }} />
                          <div style={hint}>= ₹{Math.round((sp[f.key] as number) / 100)}</div>
                        </div>
                      ))}
                    </div>

                    {/* City table — all cities shown by default */}
                    <CityPricingTable
                      state={sp.state}
                      statePricing={sp}
                      cityPricing={cfg.cityPricing}
                      allCities={citiesForState}
                      globalDefault={cfg.defaultPricePaise}
                      onSetCity={setCity}
                      onRemoveCity={removeCity}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button onClick={() => saveMutation.mutate(cfg)} disabled={saveMutation.isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
              {saveMutation.isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              Save All Settings
            </button>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  )
}
