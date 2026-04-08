'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, DollarSign, Info, MapPin, ChevronDown, Trash2, ToggleLeft, ToggleRight, Clock, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRef } from 'react'
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

interface PricingConfig {
  defaultPricePaise:  number
  minPricePaise:      number
  maxPricePaise:      number
  maskBlurMeters:     number
  leadExpiryDays:     number
  discoveryWindowDays: number
  radiusKm:           number
  statePricing:       StatePricing[]
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

// ── styles ────────────────────────────────────────────────────────────────────
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

// ── components ────────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LeadPricingPage() {
  const queryClient = useQueryClient()
  const [cfg, setCfg] = useState<PricingConfig>(DEFAULTS)

  // FIX: use dedicated /api/admin/lead-pricing endpoint (not the broken action switch)
  // FIX: don't use onSuccess on useQuery (removed in TanStack Query v5) — use useEffect instead
  const { data, isLoading } = useQuery<PricingConfig & { statePricing: StatePricing[] }>({
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
    })
  }, [data])

  // FIX: POST to dedicated endpoint — no action param needed
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
    setCfg(c => ({ ...c, statePricing: c.statePricing.filter(s => s.state !== state) }))

  if (isLoading) return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#F59E0B' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </AdminLayout>
  )

  const rupeesPreview = `₹${Math.round(cfg.defaultPricePaise / 100).toLocaleString('en-IN')}`

  return (
    <AdminLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Lead Pricing &amp; Discovery</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              All prices shown to schools are pulled live from these settings — no hardcoded values.
            </p>
          </div>
          <button onClick={() => saveMutation.mutate(cfg)} disabled={saveMutation.isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {saveMutation.isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            Save Settings
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Pricing ──────────────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Single-Lead Pricing</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Charged when a school buys a lead individually (no credits)</div>
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

            {/* Live rupee preview */}
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 13, color: '#F59E0B' }}>
              💡 Schools will see single-lead price as <strong>{rupeesPreview}</strong> — this updates live as you type.
            </div>
          </div>

          {/* ── Discovery Controls ───────────────────────────────────────────── */}
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
                Discovery leads are parents who registered nearby or searched in a school's area — even without directly applying. Schools see these masked and pay to unlock. The window and radius below control which leads are eligible.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={lbl}>
                  <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Discovery Window (days)
                </label>
                <input type="number" min={1} max={730}
                  value={cfg.discoveryWindowDays}
                  onChange={e => set('discoveryWindowDays', Math.max(1, Number(e.target.value)))}
                  style={inp} />
                <div style={hint}>Leads created within this window are surfaced to matching schools. Default: 90 days.</div>
                <PresetPills presets={WINDOW_PRESETS} value={cfg.discoveryWindowDays} onChange={v => set('discoveryWindowDays', v)} />
              </div>

              <div>
                <label style={lbl}>
                  <Radio size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Geo Radius (km)
                </label>
                <input type="number" min={1} max={100}
                  value={cfg.radiusKm}
                  onChange={e => set('radiusKm', Math.max(1, Number(e.target.value)))}
                  style={inp} />
                <div style={hint}>Parent's saved location must be within this radius of the school. Default: 10 km.</div>
                <PresetPills presets={RADIUS_PRESETS} value={cfg.radiusKm} onChange={v => set('radiusKm', v)} />
              </div>
            </div>

            {/* Live summary */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <span style={{ fontSize: 13, color: '#fff' }}>📅 Last <strong style={{ color: '#F59E0B' }}>{cfg.discoveryWindowDays} days</strong></span>
              <span style={{ fontSize: 13, color: '#fff' }}>📡 Within <strong style={{ color: '#F59E0B' }}>{cfg.radiusKm} km</strong></span>
              <span style={{ fontSize: 13, color: '#fff' }}>💵 Single-lead: <strong style={{ color: '#F59E0B' }}>{rupeesPreview}</strong></span>
            </div>
          </div>

          {/* ── Display & Expiry ──────────────────────────────────────────────── */}
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

          {/* ── State Overrides ───────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>State-Level Overrides</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Override default pricing for specific states</div>
              </div>
            </div>

            <StateDropdown selected={cfg.statePricing.map(s => s.state)} onAdd={addState} />

            {cfg.statePricing.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                No state overrides. Add a state above to set custom pricing.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: cfg.statePricing.length ? 16 : 0 }}>
              {cfg.statePricing.map(sp => (
                <div key={sp.state} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{sp.state}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: sp.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sp.isActive ? '#10B981' : '#EF4444' }}>
                        {sp.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {([
                      { label: 'Default (paise)', key: 'defaultPricePaise' as keyof StatePricing },
                      { label: 'Min (paise)',     key: 'minPricePaise'     as keyof StatePricing },
                      { label: 'Max (paise)',     key: 'maxPricePaise'     as keyof StatePricing },
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
                </div>
              ))}
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
