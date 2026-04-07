'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, DollarSign, Info, MapPin, ChevronDown, Trash2, ToggleLeft, ToggleRight, Clock, Radio } from 'lucide-react'
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

interface PricingConfig {
  defaultPricePaise: number
  minPricePaise: number
  maxPricePaise: number
  maskBlurMeters: number
  leadExpiryDays: number
  // Discovery controls — NEW
  discoveryWindowDays: number  // how far back to show geo/pincode/search leads (default 90)
  radiusKm: number             // geo radius for discovery (default 10)
  statePricing: StatePricing[]
}

const DEFAULTS: PricingConfig = {
  defaultPricePaise: 29900,
  minPricePaise: 9900,
  maxPricePaise: 99900,
  maskBlurMeters: 1000,
  leadExpiryDays: 30,
  discoveryWindowDays: 90,
  radiusKm: 10,
  statePricing: [],
}

// Quick-select presets for timeline
const WINDOW_PRESETS = [
  { label: '30 days',   value: 30 },
  { label: '60 days',   value: 60 },
  { label: '90 days',   value: 90 },
  { label: '180 days',  value: 180 },
  { label: '1 year',    value: 365 },
]

// Quick-select presets for radius
const RADIUS_PRESETS = [
  { label: '2 km',  value: 2 },
  { label: '5 km',  value: 5 },
  { label: '10 km', value: 10 },
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
]

const card: React.CSSProperties = {
  background: 'var(--admin-card-bg,#0F1623)',
  border: '1px solid var(--admin-border,rgba(255,255,255,0.07))',
  borderRadius: '14px', padding: '24px',
}
const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  letterSpacing: '.1em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '8px', fontFamily: 'DM Sans,sans-serif',
}
const fieldInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#fff', fontSize: '14px',
  fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box',
}
const fieldHint: React.CSSProperties = {
  fontSize: '11px', color: 'rgba(255,255,255,0.4)',
  marginTop: '5px', fontFamily: 'DM Sans,sans-serif',
}

// ── State dropdown ──────────────────────────────────────────────────────────
function StateDropdown({ selected, onAdd, onRemove }: {
  selected: string[]
  onAdd: (s: string) => void
  onRemove: (s: string) => void
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = INDIAN_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()) && !selected.includes(s))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...fieldInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Add state pricing…</span>
        <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.15s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: .15 }}
            style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: '#0F1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ padding: '8px' }}>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search states…"
                style={{ ...fieldInput, padding: '8px 12px', fontSize: 13 }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {filtered.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No states available</div>
                : filtered.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => { onAdd(s); setOpen(false); setSearch('') }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {s}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Preset pill selector ────────────────────────────────────────────────────
function PresetPills({ presets, value, onChange }: {
  presets: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {presets.map(p => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1px solid',
            borderColor: value === p.value ? '#F59E0B' : 'rgba(255,255,255,0.12)',
            background: value === p.value ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: value === p.value ? '#F59E0B' : 'rgba(255,255,255,0.45)',
            fontFamily: 'DM Sans,sans-serif',
            transition: 'all .15s',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function LeadPricingPage() {
  const queryClient = useQueryClient()
  const [cfg, setCfg] = useState<PricingConfig>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  const { isLoading } = useQuery({
    queryKey: ['lead-pricing'],
    queryFn: () => fetch('/api/admin?action=lead-pricing-defaults').then(r => r.json()),
    onSuccess: (data: any) => {
      setCfg({
        ...DEFAULTS,
        ...data,
        discoveryWindowDays: data.discoveryWindowDays ?? 90,
        radiusKm: data.radiusKm ?? (data.maskBlurMeters ? data.maskBlurMeters / 1000 : 10),
        statePricing: data.statePricing ?? [],
      })
      setLoaded(true)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload: PricingConfig) =>
      fetch('/api/admin?action=lead-pricing-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Lead pricing & discovery settings saved!')
      queryClient.invalidateQueries({ queryKey: ['lead-pricing'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const set = (key: keyof PricingConfig, val: any) =>
    setCfg(c => ({ ...c, [key]: val }))

  const addState = (state: string) => {
    if (cfg.statePricing.find(s => s.state === state)) return
    setCfg(c => ({
      ...c,
      statePricing: [...c.statePricing, {
        state,
        defaultPricePaise: c.defaultPricePaise,
        minPricePaise: c.minPricePaise,
        maxPricePaise: c.maxPricePaise,
        isActive: true,
      }],
    }))
  }

  const updateState = (state: string, key: keyof StatePricing, val: any) => {
    setCfg(c => ({
      ...c,
      statePricing: c.statePricing.map(s => s.state === state ? { ...s, [key]: val } : s),
    }))
  }

  const removeState = (state: string) => {
    setCfg(c => ({ ...c, statePricing: c.statePricing.filter(s => s.state !== state) }))
  }

  const handleSave = () => saveMutation.mutate(cfg)

  if (isLoading && !loaded) return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#F59E0B' }} />
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Lead Pricing &amp; Discovery</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Set single-lead prices and control how far back geo-discovery leads are shown.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
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
              {[
                { label: 'Default Price (paise)', hint: '29900 = ₹299', key: 'defaultPricePaise' as keyof PricingConfig },
                { label: 'Min Price (paise)',     hint: '9900 = ₹99',   key: 'minPricePaise'     as keyof PricingConfig },
                { label: 'Max Price (paise)',     hint: '99900 = ₹999', key: 'maxPricePaise'     as keyof PricingConfig },
              ].map(f => (
                <div key={f.key}>
                  <label style={fieldLabel}>{f.label}</label>
                  <input
                    type="number" min={0} value={cfg[f.key] as number}
                    onChange={e => set(f.key, Number(e.target.value))}
                    style={fieldInput}
                  />
                  <div style={fieldHint}>{f.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Discovery Controls ───────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#818CF8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Discovery Lead Controls</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  Geo/pincode/search leads shown to schools — window and radius
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
              <Info size={15} color="#818CF8" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: '#818CF8' }}>Discovery leads</strong> are parent registrations / searches that match a school's pincode or geo-radius, even if the parent never directly applied to that school. Schools see these masked and must pay to unlock. Use the controls below to set how far back to surface them and how wide the geo net is.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Discovery Window */}
              <div>
                <label style={fieldLabel}>
                  <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Discovery Window (days)
                </label>
                <input
                  type="number" min={1} max={730} value={cfg.discoveryWindowDays}
                  onChange={e => set('discoveryWindowDays', Math.max(1, Number(e.target.value)))}
                  style={fieldInput}
                />
                <div style={fieldHint}>
                  Leads created within this many days will be surfaced to matching schools.
                  Default: 90 days.
                </div>
                <PresetPills
                  presets={WINDOW_PRESETS}
                  value={cfg.discoveryWindowDays}
                  onChange={v => set('discoveryWindowDays', v)}
                />
              </div>

              {/* Geo Radius */}
              <div>
                <label style={fieldLabel}>
                  <Radio size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Geo Radius (km)
                </label>
                <input
                  type="number" min={1} max={100} value={cfg.radiusKm}
                  onChange={e => set('radiusKm', Math.max(1, Number(e.target.value)))}
                  style={fieldInput}
                />
                <div style={fieldHint}>
                  A parent's saved location must be within this radius of the school to appear as a discovery lead.
                  Default: 10 km.
                </div>
                <PresetPills
                  presets={RADIUS_PRESETS}
                  value={cfg.radiusKm}
                  onChange={v => set('radiusKm', v)}
                />
              </div>

            </div>

            {/* Live preview */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Current effective settings</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <span style={{ fontSize: 13, color: '#fff' }}>
                  📅 Show leads from last <strong style={{ color: '#F59E0B' }}>{cfg.discoveryWindowDays} days</strong>
                </span>
                <span style={{ fontSize: 13, color: '#fff' }}>
                  📡 Geo radius: <strong style={{ color: '#F59E0B' }}>{cfg.radiusKm} km</strong>
                </span>
                <span style={{ fontSize: 13, color: '#fff' }}>
                  💵 Single lead price: <strong style={{ color: '#F59E0B' }}>₹{Math.round(cfg.defaultPricePaise / 100)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ── Mask & Expiry ─────────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Display &amp; Expiry</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Blur radius for map pins and lead shelf-life</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
              <div>
                <label style={fieldLabel}>Map Blur Radius (metres)</label>
                <input
                  type="number" min={0} value={cfg.maskBlurMeters}
                  onChange={e => set('maskBlurMeters', Number(e.target.value))}
                  style={fieldInput}
                />
                <div style={fieldHint}>How far to blur the parent's map pin. 1000 = 1 km.</div>
              </div>
              <div>
                <label style={fieldLabel}>Lead Expiry (days)</label>
                <input
                  type="number" min={1} value={cfg.leadExpiryDays}
                  onChange={e => set('leadExpiryDays', Number(e.target.value))}
                  style={fieldInput}
                />
                <div style={fieldHint}>After this many days a lead is archived from school view.</div>
              </div>
            </div>
          </div>

          {/* ── State-level pricing ───────────────────────────────────────────── */}
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

            <StateDropdown
              selected={cfg.statePricing.map(s => s.state)}
              onAdd={addState}
              onRemove={removeState}
            />

            {cfg.statePricing.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                No state overrides yet. Add a state above to set custom pricing.
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
                      <button
                        type="button"
                        onClick={() => updateState(sp.state, 'isActive', !sp.isActive)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: sp.isActive ? '#10B981' : 'rgba(255,255,255,0.3)', padding: 4 }}
                      >
                        {sp.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeState(sp.state)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'Default (paise)', key: 'defaultPricePaise' as keyof StatePricing },
                      { label: 'Min (paise)',     key: 'minPricePaise'     as keyof StatePricing },
                      { label: 'Max (paise)',     key: 'maxPricePaise'     as keyof StatePricing },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ ...fieldLabel, marginBottom: 4 }}>{f.label}</label>
                        <input
                          type="number" min={0}
                          value={sp[f.key] as number}
                          onChange={e => updateState(sp.state, f.key, Number(e.target.value))}
                          style={{ ...fieldInput, padding: '8px 12px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button — bottom */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button
              onClick={handleSave}
              disabled={saveMutation.isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}
            >
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
