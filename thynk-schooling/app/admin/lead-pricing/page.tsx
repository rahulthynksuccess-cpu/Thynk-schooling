'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, DollarSign, Info, MapPin, ChevronDown, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
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
  statePricing: StatePricing[]
}

const DEFAULTS: PricingConfig = {
  defaultPricePaise: 29900,
  minPricePaise: 9900,
  maxPricePaise: 99900,
  maskBlurMeters: 1000,
  leadExpiryDays: 30,
  statePricing: [],
}

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

function StateDropdown({ selected, onAdd, onRemove }: {
  selected: string[]
  onAdd: (s: string) => void
  onRemove: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = INDIAN_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
        <span style={{ color: selected.length ? '#fff' : 'rgba(255,255,255,0.35)' }}>
          {selected.length === 0 ? 'Select states to configure…' : `${selected.length} state${selected.length !== 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: '#0D1520', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '10px' }}>
              <input placeholder="Search states…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...fieldInput, padding: '8px 12px', fontSize: '12px' }} autoFocus />
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filtered.map(state => {
                const checked = selected.includes(state)
                return (
                  <div key={state} onClick={() => checked ? onRemove(state) : onAdd(state)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', background: checked ? 'rgba(255,92,0,0.08)' : 'transparent', transition: 'background .1s' }}
                    onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(255,92,0,0.08)' : 'transparent' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: checked ? '2px solid #FF5C00' : '2px solid rgba(255,255,255,0.2)', background: checked ? '#FF5C00' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}>
                      {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontSize: '13px', color: checked ? '#fff' : 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans,sans-serif' }}>{state}</span>
                  </div>
                )
              })}
              {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'DM Sans,sans-serif' }}>No states found</div>}
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>{selected.length} / {INDIAN_STATES.length} selected</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#FF5C00', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Done</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LeadPricingPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PricingConfig>(DEFAULTS)
  const [dataLoaded, setDataLoaded] = useState(false)

  const { data, isLoading } = useQuery<PricingConfig>({
    queryKey: ['admin-lead-pricing'],
    queryFn: () => fetch('/api/admin?action=lead-pricing-defaults', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (data && !dataLoaded) {
      setForm({
        defaultPricePaise: Number(data.defaultPricePaise) || DEFAULTS.defaultPricePaise,
        minPricePaise:     Number(data.minPricePaise)     || DEFAULTS.minPricePaise,
        maxPricePaise:     Number(data.maxPricePaise)     || DEFAULTS.maxPricePaise,
        maskBlurMeters:    Number(data.maskBlurMeters)    || DEFAULTS.maskBlurMeters,
        leadExpiryDays:    Number(data.leadExpiryDays)    || DEFAULTS.leadExpiryDays,
        statePricing:      Array.isArray(data.statePricing) ? data.statePricing : [],
      })
      setDataLoaded(true)
    }
  }, [data, dataLoaded])

  const mutation = useMutation({
    mutationFn: () => fetch('/api/admin?action=lead-pricing-defaults', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    }).then(r => r.json()),
    onSuccess: () => { toast.success('Lead pricing saved!'); queryClient.invalidateQueries({ queryKey: ['admin-lead-pricing'] }) },
    onError: () => toast.error('Failed to save.'),
  })

  const setG = (k: keyof Omit<PricingConfig, 'statePricing'>, v: number) => setForm(p => ({ ...p, [k]: v }))
  const toRs = (paise: number) => isNaN(paise) ? '' : String(Math.round(paise / 100))
  const toPa = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : Math.round(n * 100) }

  const selectedStates = form.statePricing.map(s => s.state)
  const addState = (state: string) => {
    if (selectedStates.includes(state)) return
    setForm(p => ({ ...p, statePricing: [...p.statePricing, { state, defaultPricePaise: p.defaultPricePaise, minPricePaise: p.minPricePaise, maxPricePaise: p.maxPricePaise, isActive: true }] }))
  }
  const removeState = (state: string) => setForm(p => ({ ...p, statePricing: p.statePricing.filter(s => s.state !== state) }))
  const updState = (state: string, k: keyof StatePricing, v: any) =>
    setForm(p => ({ ...p, statePricing: p.statePricing.map(s => s.state === state ? { ...s, [k]: v } : s) }))

  const INFO_CARDS = [
    { title: 'Default Price', value: `₹${toRs(form.defaultPricePaise) || '—'}`, sub: 'per lead', color: '#FF5C00' },
    { title: 'Min Price',     value: `₹${toRs(form.minPricePaise)     || '—'}`, sub: 'floor',    color: '#60A5FA' },
    { title: 'Max Price',     value: `₹${toRs(form.maxPricePaise)     || '—'}`, sub: 'ceiling',  color: '#4ADE80' },
  ]

  return (
    <AdminLayout pageClass="admin-page-settings" title="Lead Pricing" subtitle="Set platform-wide default and state-wise prices for leads">

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
        {INFO_CARDS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }}
            style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${c.color}18`, border: `1px solid ${c.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign style={{ width: '22px', height: '22px', color: c.color }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '28px', color: '#fff', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', fontFamily: 'DM Sans,sans-serif' }}>{c.title} · {c.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Global config */}
          <div style={card}>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '17px', color: '#fff', marginBottom: '20px' }}>Global Pricing Configuration</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {([
                { k: 'defaultPricePaise' as const, label: 'Default Price (₹)', hint: 'When school has no custom price' },
                { k: 'minPricePaise'     as const, label: 'Floor Price (₹)',   hint: 'Schools cannot set below this' },
                { k: 'maxPricePaise'     as const, label: 'Ceiling Price (₹)', hint: 'Schools cannot set above this' },
              ]).map(f => (
                <div key={f.k}>
                  <label style={fieldLabel}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>₹</span>
                    <input type="number" min="1" value={toRs(form[f.k])} onChange={e => setG(f.k, toPa(e.target.value))} style={{ ...fieldInput, paddingLeft: '28px' }} />
                  </div>
                  <p style={fieldHint}>{f.hint}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={fieldLabel}>Location Blur (meters)</label>
                <input type="number" value={form.maskBlurMeters} min="100" max="5000" onChange={e => setG('maskBlurMeters', Number(e.target.value))} style={fieldInput} />
                <p style={fieldHint}>GPS fuzz radius for unpurchased leads</p>
              </div>
              <div>
                <label style={fieldLabel}>Lead Expiry (days)</label>
                <input type="number" value={form.leadExpiryDays} min="7" max="90" onChange={e => setG('leadExpiryDays', Number(e.target.value))} style={fieldInput} />
                <p style={fieldHint}>Days before a lead expires automatically</p>
              </div>
            </div>
          </div>

          {/* State-wise pricing */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '17px', color: '#fff', margin: 0 }}>State-wise Lead Pricing</h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif', marginTop: '3px' }}>Override global pricing for specific states. All schools in selected states will see the updated lead price.</p>
              </div>
              {selectedStates.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.22)', borderRadius: '8px', padding: '6px 12px' }}>
                  <MapPin style={{ width: '13px', height: '13px', color: '#FF5C00' }} />
                  <span style={{ fontSize: '12px', color: '#FF5C00', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>{selectedStates.length} state{selectedStates.length !== 1 ? 's' : ''} configured</span>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Add / Remove States</label>
              <StateDropdown selected={selectedStates} onAdd={addState} onRemove={removeState} />
            </div>

            {form.statePricing.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <MapPin style={{ width: '32px', height: '32px', margin: '0 auto 10px', display: 'block', color: 'rgba(255,255,255,0.12)' }} />
                Select states above to set custom pricing
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 60px 36px', gap: '10px', padding: '0 0 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['State', 'Default (₹)', 'Floor (₹)', 'Ceiling (₹)', 'Active', ''].map(h => (
                    <span key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>{h}</span>
                  ))}
                </div>
                <AnimatePresence>
                  {form.statePricing.map((sp, i) => (
                    <motion.div key={sp.state} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ delay: i * .03 }}
                      style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 60px 36px', gap: '10px', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <MapPin style={{ width: '12px', height: '12px', color: '#FF5C00', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.state}</span>
                      </div>
                      {(['defaultPricePaise', 'minPricePaise', 'maxPricePaise'] as const).map(k => (
                        <div key={k} style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>₹</span>
                          <input type="number" min="1" value={toRs(sp[k])} onChange={e => updState(sp.state, k, toPa(e.target.value))}
                            style={{ ...fieldInput, paddingLeft: '22px', padding: '8px 8px 8px 22px', fontSize: '12px' }} />
                        </div>
                      ))}
                      <button onClick={() => updState(sp.state, 'isActive', !sp.isActive)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sp.isActive ? '#4ADE80' : 'rgba(255,255,255,0.2)' }}>
                        {sp.isActive ? <ToggleRight style={{ width: '24px', height: '24px' }} /> : <ToggleLeft style={{ width: '24px', height: '24px' }} />}
                      </button>
                      <button onClick={() => removeState(sp.state)}
                        style={{ width: '32px', height: '32px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Save */}
          <div>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#FF5C00,#FF8A00)', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '14px', fontWeight: 700, cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? .7 : 1, fontFamily: 'DM Sans,sans-serif', boxShadow: '0 4px 20px rgba(255,92,0,0.35)' }}>
              {mutation.isPending ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Saving…</> : <><Save style={{ width: '16px', height: '16px' }} />Save All Pricing</>}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ ...card, background: 'rgba(255,92,0,0.05)', borderColor: 'rgba(255,92,0,0.18)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Info style={{ width: '16px', height: '16px', color: '#FF5C00', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>How Lead Pricing Works</span>
            </div>
            <ul style={{ padding: '0 0 0 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'When a parent applies to a school, a lead is created',
                'School sees masked info (first name + last 5 digits)',
                'School pays the price per lead to unlock full details',
                'School can set their own price within floor-ceiling range',
                'State pricing overrides global defaults for that state',
                'If no custom price, the global default applies',
              ].map((t, i) => <li key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.7 }}>{t}</li>)}
            </ul>
          </div>

          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'DM Sans,sans-serif' }}>Current Global Settings</div>
            {[
              { label: 'Default',        value: `₹${toRs(form.defaultPricePaise) || '—'}/lead` },
              { label: 'Floor',          value: `₹${toRs(form.minPricePaise)     || '—'}/lead` },
              { label: 'Ceiling',        value: `₹${toRs(form.maxPricePaise)     || '—'}/lead` },
              { label: 'GPS Blur',       value: `${form.maskBlurMeters}m radius` },
              { label: 'Expiry',         value: `${form.leadExpiryDays} days` },
              { label: 'State Overrides',value: `${form.statePricing.filter(s => s.isActive).length} active` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans,sans-serif' }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'DM Sans,sans-serif' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {form.statePricing.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'DM Sans,sans-serif' }}>State Overrides</div>
              {form.statePricing.map(sp => (
                <div key={sp.state} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sp.isActive ? '#4ADE80' : '#F87171' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans,sans-serif' }}>{sp.state}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C00', fontFamily: 'DM Sans,sans-serif' }}>₹{toRs(sp.defaultPricePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
