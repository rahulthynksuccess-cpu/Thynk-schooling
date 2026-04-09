'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Mail, MessageCircle, Save, Loader2, Eye, EyeOff,
  CreditCard, GripVertical, ChevronUp, ChevronDown,
  CheckCircle, AlertCircle, TestTube, Globe, Lock,
  Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check,
  Send, Zap, ExternalLink, Copy, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1.5px solid rgba(13,17,23,0.12)', borderRadius:'9px', fontSize:'13px', fontFamily:'Inter,sans-serif', color:'#0D1117', background:'#fff', outline:'none', boxSizing:'border-box' as const }
const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase' as const, color:'#718096', marginBottom:'6px', fontFamily:'Inter,sans-serif' }

function apiSave(key: string, value: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
  return fetch('/api/admin/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key, value }),
  }).then(r => { if (!r.ok) throw new Error('Save failed') })
}

function authHdr() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

const GATEWAY_META: Record<string, {
  name: string; logo: string; color: string; bg: string;
  description: string; domestic: boolean; international: boolean;
  fields: Array<{ key: string; label: string; hint: string; secret?: boolean }>
  docs: string
}> = {
  razorpay: {
    name: 'Razorpay', logo: '💙', color: '#3395FF', bg: 'rgba(51,149,255,0.08)',
    description: "India's leading payment gateway. Supports cards, UPI, netbanking, wallets.",
    domestic: true, international: false,
    fields: [
      { key: 'keyId',     label: 'Key ID',     hint: 'Starts with rzp_live_ or rzp_test_' },
      { key: 'keySecret', label: 'Key Secret', hint: 'From Razorpay Dashboard → API Keys', secret: true },
    ],
    docs: 'https://razorpay.com/docs/payments/dashboard/account-access/api-key/',
  },
  cashfree: {
    name: 'Cashfree', logo: '💚', color: '#00C853', bg: 'rgba(0,200,83,0.08)',
    description: 'Fast settlement, UPI AutoPay & subscriptions. Good for recurring billing.',
    domestic: true, international: false,
    fields: [
      { key: 'keyId',     label: 'App ID',      hint: 'From Cashfree Dashboard → Credentials' },
      { key: 'keySecret', label: 'Secret Key',  hint: 'From Cashfree Dashboard → Credentials', secret: true },
    ],
    docs: 'https://docs.cashfree.com/docs/getting-started',
  },
  easebuzz: {
    name: 'Easebuzz', logo: '🟠', color: '#FF6600', bg: 'rgba(255,102,0,0.08)',
    description: 'Cost-effective gateway with low MDR. Popular with EdTech platforms.',
    domestic: true, international: false,
    fields: [
      { key: 'keyId',     label: 'Merchant Key', hint: 'From Easebuzz Dashboard → Settings → API Keys' },
      { key: 'keySecret', label: 'Salt',          hint: 'Your Easebuzz salt for hash generation', secret: true },
    ],
    docs: 'https://docs.easebuzz.in/payments',
  },
  paypal: {
    name: 'PayPal', logo: '🌐', color: '#003087', bg: 'rgba(0,48,135,0.08)',
    description: 'International payments in USD/AED/SAR. Best for overseas schools & parents.',
    domestic: false, international: true,
    fields: [
      { key: 'keyId',     label: 'Client ID',     hint: 'From PayPal Developer Dashboard → Apps' },
      { key: 'keySecret', label: 'Client Secret', hint: 'From PayPal Developer Dashboard → Apps', secret: true },
    ],
    docs: 'https://developer.paypal.com/api/rest/',
  },
}

interface GatewayState {
  id: string; name: string; enabled: boolean; priority: number
  keyId: string; keySecret: string; extra: Record<string, string>; mode: 'live' | 'test'
}

interface Coupon {
  id: number; code: string; type: 'percent' | 'flat'; value: number
  min_amount: number; max_uses: number | null; used_count: number
  valid_from: string | null; valid_until: string | null
  applicable_gateways: string[]; active: boolean; description: string; created_at: string
}

const BLANK_COUPON = (): Partial<Coupon> => ({
  code: '', type: 'percent', value: 10, min_amount: 0,
  max_uses: undefined, valid_from: '', valid_until: '',
  applicable_gateways: [], active: true, description: '',
})

/* ─────────────────────────────────────────────────────────────────
   SECRET FIELD
───────────────────────────────────────────────────────────────── */
function SecretField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder={hint} style={{ ...inp, paddingRight: 40, fontFamily: show ? 'monospace' : 'Inter,sans-serif', fontSize: 12 }} />
        <button type="button" onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>{hint}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   GATEWAY CARD  (unchanged)
───────────────────────────────────────────────────────────────── */
function GatewayCard({ gw, onUpdate, onMoveUp, onMoveDown, isFirst, isLast, saving }:
  { gw: GatewayState; onUpdate: (id: string, patch: Partial<GatewayState>) => void
    onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean; saving: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const meta = GATEWAY_META[gw.id]
  if (!meta) return null
  const isConfigured = !!gw.keyId && !!gw.keySecret

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${gw.enabled ? meta.color + '40' : 'rgba(13,17,23,0.09)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: gw.enabled ? meta.bg : '#FAFAFA', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={isFirst}
            style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.6 }}>
            <ChevronUp style={{ width: 10, height: 10 }} />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={isLast}
            style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.6 }}>
            <ChevronDown style={{ width: 10, height: 10 }} />
          </button>
        </div>
        <GripVertical style={{ width: 14, height: 14, color: '#C4C9D4', flexShrink: 0, cursor: 'grab' }} />
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: gw.enabled ? meta.color : '#E5E7EB', color: gw.enabled ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
          {gw.priority}
        </div>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.logo}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1117' }}>{meta.name}</span>
            {meta.domestic && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', color: '#15803d', fontFamily: 'Inter,sans-serif' }}>Domestic</span>}
            {meta.international && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(59,130,246,0.1)', color: '#1d4ed8', fontFamily: 'Inter,sans-serif' }}>International</span>}
            {isConfigured
              ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', color: '#15803d', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle style={{ width: 8, height: 8 }} />Keys set</span>
              : <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle style={{ width: 8, height: 8 }} />Not configured</span>
            }
          </div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', marginTop: 2 }}>{meta.description}</div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: gw.enabled ? meta.color : '#9CA3AF', fontWeight: 600 }}>{gw.enabled ? 'Active' : 'Off'}</span>
          <div onClick={() => onUpdate(gw.id, { enabled: !gw.enabled })}
            style={{ width: 40, height: 22, borderRadius: 11, background: gw.enabled ? meta.color : '#E5E7EB', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: gw.enabled ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        <ChevronDown style={{ width: 14, height: 14, color: '#A0ADB8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(13,17,23,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#FAF7F2', borderRadius: 10, border: '1px solid #EDE5D8' }}>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: '#718096' }}>Mode:</span>
            {(['test', 'live'] as const).map(m => (
              <button key={m} onClick={() => onUpdate(gw.id, { mode: m })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700,
                  background: gw.mode === m ? (m === 'live' ? '#B8860B' : '#0D1117') : 'transparent',
                  color: gw.mode === m ? '#fff' : '#718096' }}>
                {m === 'live' ? <Globe style={{ width: 11, height: 11 }} /> : <TestTube style={{ width: 11, height: 11 }} />}
                {m === 'live' ? 'Live' : 'Test / Sandbox'}
              </button>
            ))}
            {gw.mode === 'live' && (
              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock style={{ width: 10, height: 10 }} />Real money — double-check keys
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {meta.fields.map(f => f.secret
              ? <SecretField key={f.key} label={f.label} hint={f.hint} value={(gw as any)[f.key] || ''} onChange={v => onUpdate(gw.id, { [f.key]: v } as any)} />
              : (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input type="text" value={(gw as any)[f.key] || ''} onChange={e => onUpdate(gw.id, { [f.key]: e.target.value } as any)} placeholder={f.hint} style={inp} />
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>{f.hint}</p>
                </div>
              )
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <a href={meta.docs} target="_blank" rel="noreferrer" style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: meta.color, textDecoration: 'none', fontWeight: 600 }}>
              📖 {meta.name} API docs →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COUPON MODAL  (unchanged)
═══════════════════════════════════════════════════════════════════ */
function CouponModal({ coupon, onSave, onClose, saving }: {
  coupon: Partial<Coupon>; onSave: (c: Partial<Coupon>) => void; onClose: () => void; saving: boolean
}) {
  const [form, setForm] = useState<Partial<Coupon>>(coupon)
  const set = (k: keyof Coupon, v: any) => setForm(p => ({ ...p, [k]: v }))
  const gwIds = Object.keys(GATEWAY_META)
  const isEdit = !!coupon.id
  const toggleGw = (id: string) => {
    const cur = form.applicable_gateways || []
    set('applicable_gateways', cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,17,23,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(13,17,23,0.08)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF7E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag style={{ width: 17, height: 17, color: '#B8860B' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 16, color: '#0D1117' }}>{isEdit ? 'Edit Coupon' : 'Create Coupon'}</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>Works across all enabled payment gateways</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096', padding: 4 }}><X style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lbl}>Coupon Code *</label>
            <input value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g,''))}
              placeholder="e.g. BACK2SCHOOL20"
              style={{ ...inp, fontFamily: 'monospace', fontWeight: 700, fontSize: 15, letterSpacing: 2 }} />
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Uppercase, no spaces.</p>
          </div>
          <div>
            <label style={lbl}>Internal Description</label>
            <input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="e.g. 20% off for back-to-school season" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Discount Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ k: 'percent', l: '% Percent' }, { k: 'flat', l: '₹ Flat Amount' }].map(t => (
                  <button key={t.k} onClick={() => set('type', t.k)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid ${form.type === t.k ? '#B8860B' : 'rgba(13,17,23,0.12)'}`, background: form.type === t.k ? '#FEF7E0' : '#fff', color: form.type === t.k ? '#B8860B' : '#4A5568', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>{form.type === 'percent' ? 'Discount %' : 'Flat Amount (₹)'}</label>
              <input type="number" value={form.value ?? ''} onChange={e => set('value', Number(e.target.value))} min={0} max={form.type === 'percent' ? 100 : undefined} placeholder={form.type === 'percent' ? '10' : '500'} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Minimum Order Amount (₹)</label>
              <input type="number" value={form.min_amount ?? 0} onChange={e => set('min_amount', Number(e.target.value))} min={0} placeholder="0 = no minimum" style={inp} />
            </div>
            <div>
              <label style={lbl}>Max Uses (blank = unlimited)</label>
              <input type="number" value={form.max_uses ?? ''} onChange={e => set('max_uses', e.target.value === '' ? null : Number(e.target.value))} min={1} placeholder="Unlimited" style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Valid From (optional)</label>
              <input type="date" value={(form.valid_from || '').slice(0,10)} onChange={e => set('valid_from', e.target.value || null)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Valid Until (optional)</label>
              <input type="date" value={(form.valid_until || '').slice(0,10)} onChange={e => set('valid_until', e.target.value || null)} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Applicable Gateways</label>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', margin: '0 0 10px' }}>Leave all unselected → applies on <strong>all active gateways</strong>.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {gwIds.map(id => {
                const m = GATEWAY_META[id]; const sel = (form.applicable_gateways || []).includes(id)
                return (
                  <button key={id} onClick={() => toggleGw(id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${sel ? m.color : 'rgba(13,17,23,0.12)'}`, background: sel ? m.bg : '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: sel ? m.color : '#4A5568' }}>
                    {sel && <Check style={{ width: 10, height: 10 }} />}{m.logo} {m.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9F9F9', borderRadius: 10, border: '1px solid rgba(13,17,23,0.07)' }}>
            <div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>Coupon Active</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>Inactive coupons are silently rejected at checkout</div>
            </div>
            <div onClick={() => set('active', !form.active)}
              style={{ width: 44, height: 24, borderRadius: 12, background: form.active ? '#22C55E' : '#E5E7EB', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.active ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(13,17,23,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid rgba(13,17,23,0.12)', background: '#fff', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#4A5568' }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.code}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: saving || !form.code ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: saving || !form.code ? 0.6 : 1 }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
            {isEdit ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COUPONS TAB  (unchanged)
═══════════════════════════════════════════════════════════════════ */
function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<Partial<Coupon> | false>(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/api/admin?action=coupons'); const d = await r.json(); setCoupons(d.coupons || []) }
    catch { toast.error('Failed to load coupons') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveCoupon = async (form: Partial<Coupon>) => {
    if (!form.code) return; setSaving(true)
    try {
      const isEdit = !!form.id
      const r = await fetch(isEdit ? `/api/admin?action=coupons&id=${form.id}` : '/api/admin?action=coupons', { method: isEdit ? 'PUT' : 'POST', headers: authHdr(), body: JSON.stringify(form) })
      if (!r.ok) throw new Error('Save failed')
      toast.success(isEdit ? 'Coupon updated!' : 'Coupon created!'); setModal(false); await load()
    } catch (e: any) { toast.error(e.message || 'Save failed') }
    setSaving(false)
  }

  const toggleActive = async (c: Coupon) => {
    try {
      await fetch(`/api/admin?action=coupons&id=${c.id}`, { method: 'PUT', headers: authHdr(), body: JSON.stringify({ ...c, active: !c.active }) })
      setCoupons(p => p.map(x => x.id === c.id ? { ...x, active: !x.active } : x))
    } catch { toast.error('Update failed') }
  }

  const deleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return
    try { await fetch(`/api/admin?action=coupons&id=${id}`, { method: 'DELETE', headers: authHdr() }); toast.success('Deleted'); setCoupons(p => p.filter(x => x.id !== id)) }
    catch { toast.error('Delete failed') }
  }

  const isExpired   = (c: Coupon) => !!c.valid_until && new Date(c.valid_until) < new Date()
  const isExhausted = (c: Coupon) => c.max_uses !== null && c.used_count >= c.max_uses
  const statusOf    = (c: Coupon) => {
    if (!c.active)      return { label: '○ Inactive',   bg: 'rgba(113,128,150,0.1)', color: '#718096' }
    if (isExpired(c))   return { label: '⚠ Expired',    bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' }
    if (isExhausted(c)) return { label: '⚠ Exhausted',  bg: 'rgba(245,158,11,0.1)', color: '#B45309' }
    return                     { label: '● Active',     bg: 'rgba(34,197,94,0.1)',   color: '#15803d' }
  }
  const gwNames = (c: Coupon) => c.applicable_gateways?.length ? c.applicable_gateways.map(id => GATEWAY_META[id]?.name || id).join(', ') : 'All gateways'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag style={{ width: 16, height: 16, color: '#B8860B', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>
              {loading ? 'Loading…' : coupons.length === 0 ? 'No coupons yet' : `${coupons.filter(c => c.active && !isExpired(c) && !isExhausted(c)).length} active · ${coupons.length} total`}
            </div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', marginTop: 2 }}>Discount coupons work across all payment gateways.</div>
          </div>
        </div>
        <button onClick={() => setModal(BLANK_COUPON())} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
          <Plus style={{ width: 14, height: 14 }} /> New Coupon
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />Loading coupons…
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, background: '#fff', borderRadius: 16, border: '1.5px dashed rgba(13,17,23,0.13)' }}>
          <Tag style={{ width: 36, height: 36, color: '#D4D4D4', display: 'block', margin: '0 auto 14px' }} />
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, fontWeight: 700, color: '#0D1117', marginBottom: 6 }}>No coupons yet</div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#A0ADB8', marginBottom: 22 }}>Create a discount coupon to offer deals at checkout.</div>
          <button onClick={() => setModal(BLANK_COUPON())} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
            <Plus style={{ width: 14, height: 14 }} /> Create First Coupon
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => {
            const st = statusOf(c)
            return (
              <div key={c.id} style={{ background: '#fff', border: '1.5px solid rgba(13,17,23,0.09)', borderRadius: 14, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 14, opacity: !c.active ? 0.72 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#0D1117', letterSpacing: 1.5 }}>{c.code}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(184,134,11,0.12)', color: '#B8860B', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>{c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                    {c.description && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>{c.description}</span>}
                    {c.min_amount > 0 && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>Min ₹{c.min_amount}</span>}
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>Used: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</span>
                    {c.valid_until && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: isExpired(c) ? '#dc2626' : '#A0ADB8' }}>Expires {new Date(c.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>{gwNames(c)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleActive(c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${c.active ? 'rgba(34,197,94,0.3)' : 'rgba(13,17,23,0.12)'}`, background: c.active ? 'rgba(34,197,94,0.07)' : '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: c.active ? '#15803d' : '#718096' }}>
                    {c.active ? <ToggleRight style={{ width: 14, height: 14 }} /> : <ToggleLeft style={{ width: 14, height: 14 }} />}{c.active ? 'Active' : 'Off'}
                  </button>
                  <button onClick={() => setModal({ ...c })} style={{ padding: 7, borderRadius: 8, border: '1.5px solid rgba(13,17,23,0.12)', background: '#fff', cursor: 'pointer', color: '#4A5568', display: 'flex' }}><Pencil style={{ width: 13, height: 13 }} /></button>
                  <button onClick={() => deleteCoupon(c.id)} style={{ padding: 7, borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {modal !== false && <CouponModal coupon={modal} onSave={saveCoupon} onClose={() => setModal(false)} saving={saving} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP TAB  ← fully rebuilt with ThynkComm provider
═══════════════════════════════════════════════════════════════════ */

// Provider definitions — one source of truth
const WA_PROVIDERS = {
  thynkcomm: {
    label:       'ThynkComm',
    badge:       '⚡ Recommended',
    badgeColor:  '#166534',
    badgeBg:     'rgba(22,101,52,0.1)',
    iconBg:      'linear-gradient(135deg,#1ab8a8,#0e8a7d)',
    icon:        '💬',
    description: 'Use your ThynkComm deployment as the WhatsApp channel. Authenticate with the API Key + Secret generated in ThynkComm → Integrations.',
    docsUrl:     'https://thynkcom.vercel.app',
    color:       '#1ab8a8',
    colorBg:     'rgba(26,184,168,0.08)',
    colorBorder: 'rgba(26,184,168,0.3)',
  },
  meta: {
    label:       'Meta Cloud API',
    badge:       'Direct',
    badgeColor:  '#1d4ed8',
    badgeBg:     'rgba(29,78,216,0.1)',
    iconBg:      'linear-gradient(135deg,#1877F2,#0d47a1)',
    icon:        '🔵',
    description: 'Connect directly to the Meta WhatsApp Business Cloud API using your own Access Token and Phone Number ID.',
    docsUrl:     'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    color:       '#1877F2',
    colorBg:     'rgba(24,119,242,0.08)',
    colorBorder: 'rgba(24,119,242,0.3)',
  },
  twilio: {
    label:       'Twilio',
    badge:       'International',
    badgeColor:  '#6B21A8',
    badgeBg:     'rgba(107,33,168,0.1)',
    iconBg:      'linear-gradient(135deg,#F22F46,#a51829)',
    icon:        '🔴',
    description: 'Twilio WhatsApp sandbox and production. Best for international SMS+WhatsApp hybrid setups.',
    docsUrl:     'https://www.twilio.com/docs/whatsapp',
    color:       '#F22F46',
    colorBg:     'rgba(242,47,70,0.08)',
    colorBorder: 'rgba(242,47,70,0.3)',
  },
} as const

type WaProvider = keyof typeof WA_PROVIDERS

interface WaSettings {
  provider: WaProvider
  enabled:  boolean
  // ThynkComm
  tcUrl:        string
  tcApiKey:     string
  tcApiSecret:  string
  // Meta direct
  metaToken:    string
  metaPhoneId:  string
  // Twilio
  accountSid:   string
  authToken:    string
  fromNumber:   string
}

const WA_DEFAULTS: WaSettings = {
  provider:    'thynkcomm',
  enabled:     false,
  tcUrl:       '',
  tcApiKey:    '',
  tcApiSecret: '',
  metaToken:   '',
  metaPhoneId: '',
  accountSid:  '',
  authToken:   '',
  fromNumber:  '',
}

function WhatsAppTab({ saving, setSaving }: { saving: boolean; setSaving: (v: boolean) => void }) {
  const [wa,         setWa]         = useState<WaSettings>(WA_DEFAULTS)
  const [testing,    setTesting]    = useState(false)
  const [testPhone,  setTestPhone]  = useState('')
  const [testMsg,    setTestMsg]    = useState('Hello from Thynk Schooling! Your WhatsApp integration is working. 🎉')
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showToken,  setShowToken]  = useState(false)

  // load saved settings
  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.whatsapp_settings) setWa(p => ({ ...WA_DEFAULTS, ...d.whatsapp_settings })) })
      .catch(() => {})
  }, [])

  const set = (patch: Partial<WaSettings>) => setWa(p => ({ ...p, ...patch }))

  const save = async () => {
    setSaving(true)
    try { await apiSave('whatsapp_settings', wa); toast.success('WhatsApp settings saved!') }
    catch { toast.error('Save failed') }
    setSaving(false)
  }

  // ── validation helper ────────────────────────────────────────────
  const isConfigured = () => {
    if (wa.provider === 'thynkcomm') return !!(wa.tcUrl && wa.tcApiKey && wa.tcApiSecret)
    if (wa.provider === 'meta')      return !!(wa.metaToken && wa.metaPhoneId)
    if (wa.provider === 'twilio')    return !!(wa.accountSid && wa.authToken && wa.fromNumber)
    return false
  }

  // ── test-send helper ─────────────────────────────────────────────
  const sendTest = async () => {
    if (!testPhone) { toast.error('Enter a test phone number'); return }
    if (!isConfigured()) { toast.error('Configure credentials first'); return }
    setTesting(true); setTestResult(null)
    try {
      let res: Response

      if (wa.provider === 'thynkcomm') {
        // → ThynkComm /api/send-message using API Key + Secret
        const url = wa.tcUrl.replace(/\/$/, '') + '/api/send-message'
        res = await fetch(url, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key':    wa.tcApiKey,
            'x-api-secret': wa.tcApiSecret,
          },
          body: JSON.stringify({ to: testPhone.replace(/\D/g, ''), message: testMsg }),
        })
      } else if (wa.provider === 'meta') {
        // → Meta Cloud API direct
        res = await fetch(`https://graph.facebook.com/v19.0/${wa.metaPhoneId}/messages`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wa.metaToken}` },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to:   testPhone.replace(/\D/g, ''),
            type: 'text',
            text: { body: testMsg },
          }),
        })
      } else {
        // → Twilio
        const creds = btoa(`${wa.accountSid}:${wa.authToken}`)
        const from  = wa.fromNumber.startsWith('whatsapp:') ? wa.fromNumber : `whatsapp:${wa.fromNumber}`
        const to    = `whatsapp:${testPhone.replace(/\D/g, '')}`
        const body  = new URLSearchParams({ From: from, To: to, Body: testMsg })
        res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${wa.accountSid}/Messages.json`, {
          method:  'POST',
          headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        })
      }

      const data = await res.json()
      if (res.ok && (data.success || data.messages || data.sid)) {
        setTestResult({ ok: true,  msg: 'Message sent! Check the phone for the WhatsApp message.' })
        toast.success('Test message sent!')
      } else {
        const errMsg = data.error || data.message || data.error_description || JSON.stringify(data)
        setTestResult({ ok: false, msg: errMsg })
        toast.error('Send failed: ' + errMsg)
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message })
      toast.error(e.message)
    }
    setTesting(false)
  }

  const prov  = WA_PROVIDERS[wa.provider]
  const provs = Object.entries(WA_PROVIDERS) as [WaProvider, typeof WA_PROVIDERS[WaProvider]][]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Provider selector ───────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(13,17,23,0.09)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1117', fontFamily: 'Inter,sans-serif' }}>WhatsApp Provider</div>
            <div style={{ fontSize: 12, color: '#718096', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>Choose how Thynk Schooling sends WhatsApp messages to parents & staff</div>
          </div>
          {/* Global enable toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: wa.enabled ? '#15803d' : '#718096' }}>{wa.enabled ? 'Enabled' : 'Disabled'}</span>
            <div onClick={() => set({ enabled: !wa.enabled })}
              style={{ width: 44, height: 24, borderRadius: 12, background: wa.enabled ? '#22C55E' : '#E5E7EB', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: wa.enabled ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {provs.map(([id, meta]) => {
            const selected = wa.provider === id
            return (
              <button key={id} onClick={() => set({ provider: id })}
                style={{ padding: '16px 14px', borderRadius: 12, border: `2px solid ${selected ? meta.color : 'rgba(13,17,23,0.1)'}`, background: selected ? meta.colorBg : '#FAFAFA', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', outline: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{meta.icon}</div>
                  {selected && <div style={{ width: 16, height: 16, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check style={{ width: 9, height: 9, color: '#fff' }} />
                  </div>}
                </div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, color: '#0D1117', marginBottom: 4 }}>{meta.label}</div>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: meta.badgeBg, color: meta.badgeColor, fontFamily: 'Inter,sans-serif', marginBottom: 6 }}>{meta.badge}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', lineHeight: 1.4 }}>{meta.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Credentials card ────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${prov.colorBorder}`, padding: 24 }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: prov.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{prov.icon}</div>
            <div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 15, color: '#0D1117' }}>{prov.label} Credentials</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', marginTop: 1 }}>
                {isConfigured()
                  ? <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle style={{ width: 11, height: 11 }} />All credentials provided</span>
                  : <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle style={{ width: 11, height: 11 }} />Missing required credentials</span>
                }
              </div>
            </div>
          </div>
          <a href={prov.docsUrl} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${prov.colorBorder}`, background: prov.colorBg, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: prov.color, textDecoration: 'none' }}>
            <ExternalLink style={{ width: 11, height: 11 }} />{wa.provider === 'thynkcomm' ? 'Open ThynkComm' : 'View Docs'}
          </a>
        </div>

        {/* ── ThynkComm fields ── */}
        {wa.provider === 'thynkcomm' && (
          <>
            {/* How-to banner */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(26,184,168,0.07)', border: '1px solid rgba(26,184,168,0.2)', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: '#1ab8a8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap style={{ width: 13, height: 13 }} />How to get your ThynkComm API Key
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  'Open your ThynkComm dashboard (e.g. thynkcom.vercel.app)',
                  'Go to Integrations → Other Apps tab',
                  'Click "+ New Integration Key" → fill in name (e.g. "Thynk Schooling")',
                  'Select permissions: Send Messages ✓',
                  'Click Generate Key — copy the API Key and Secret Key',
                  'Paste both below, along with your ThynkComm URL',
                ].map((s, i) => (
                  <li key={i} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#4A5568', lineHeight: 1.5 }}>{s}</li>
                ))}
              </ol>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {/* URL */}
              <div>
                <label style={lbl}>ThynkComm URL *</label>
                <input value={wa.tcUrl} onChange={e => set({ tcUrl: e.target.value })}
                  placeholder="https://thynkcom.vercel.app" style={inp} />
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Your Vercel deployment URL — no trailing slash.</p>
              </div>

              {/* API Key + Secret in a 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>API Key *</label>
                  <div style={{ position: 'relative' }}>
                    <input value={wa.tcApiKey} onChange={e => set({ tcApiKey: e.target.value })}
                      placeholder="tk_XXXXXXXXXXXXXXXX"
                      style={{ ...inp, fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Starts with tk_ — from ThynkComm Integrations</p>
                </div>
                <div>
                  <label style={lbl}>API Secret *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showSecret ? 'text' : 'password'} value={wa.tcApiSecret} onChange={e => set({ tcApiSecret: e.target.value })}
                      placeholder="sk_live_xxxxxxxxxxxxxxxx"
                      style={{ ...inp, paddingRight: 40, fontFamily: 'monospace', fontSize: 12 }} />
                    <button type="button" onClick={() => setShowSecret(!showSecret)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                      {showSecret ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                    </button>
                  </div>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Starts with sk_live_ — shown once at creation</p>
                </div>
              </div>
            </div>

            {/* How the request is built — info box */}
            <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: '#F8F9FA', border: '1px solid rgba(13,17,23,0.07)' }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#718096', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Request ThynkComm receives</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#4A5568', lineHeight: 1.8 }}>
                <span style={{ color: '#1ab8a8' }}>POST</span> {wa.tcUrl || 'https://thynkcom.vercel.app'}/api/send-message<br />
                <span style={{ color: '#B8860B' }}>x-api-key:</span> {wa.tcApiKey ? wa.tcApiKey.slice(0,10) + '••••' : '<your-api-key>'}<br />
                <span style={{ color: '#B8860B' }}>x-api-secret:</span> {wa.tcApiSecret ? wa.tcApiSecret.slice(0,12) + '••••' : '<your-secret>'}<br />
                <span style={{ color: '#718096' }}>{'{ "to": "919876543210", "message": "..." }'}</span>
              </div>
            </div>
          </>
        )}

        {/* ── Meta direct fields ── */}
        {wa.provider === 'meta' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Access Token *</label>
              <div style={{ position: 'relative' }}>
                <input type={showToken ? 'text' : 'password'} value={wa.metaToken} onChange={e => set({ metaToken: e.target.value })}
                  placeholder="EAAxxxxxxxx… (permanent system user token)"
                  style={{ ...inp, paddingRight: 40, fontFamily: 'monospace', fontSize: 12 }} />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                  {showToken ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#dc2626', margin: '4px 0 0' }}>⚠ Use a permanent System User token — temporary tokens expire in 24 hours.</p>
            </div>
            <div>
              <label style={lbl}>Phone Number ID *</label>
              <input value={wa.metaPhoneId} onChange={e => set({ metaPhoneId: e.target.value })}
                placeholder="1234567890" style={inp} />
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Meta → WhatsApp → API Setup → Phone Number ID</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer"
                style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#1877F2', fontWeight: 600, textDecoration: 'none' }}>📖 Meta Cloud API guide →</a>
            </div>
          </div>
        )}

        {/* ── Twilio fields ── */}
        {wa.provider === 'twilio' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Account SID *</label>
              <input value={wa.accountSid} onChange={e => set({ accountSid: e.target.value })} placeholder="ACxxxxxxxxxxxxxxxx" style={inp} />
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Twilio Console → Account Info</p>
            </div>
            <SecretField label="Auth Token *" hint="Twilio Console → Account Info" value={wa.authToken} onChange={v => set({ authToken: v })} />
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>WhatsApp From Number *</label>
              <input value={wa.fromNumber} onChange={e => set({ fromNumber: e.target.value })} placeholder="whatsapp:+14155238886" style={inp} />
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Include the <code>whatsapp:</code> prefix. Use your approved sender number.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Test message card ────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(13,17,23,0.09)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send style={{ width: 16, height: 16, color: '#15803d' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1117' }}>Send a Test Message</div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>Verify the integration is working before saving</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Phone Number *</label>
            <input value={testPhone} onChange={e => setTestPhone(e.target.value)}
              placeholder="919876543210" style={inp} />
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>Country code + number, no + or spaces</p>
          </div>
          <div>
            <label style={lbl}>Message</label>
            <input value={testMsg} onChange={e => setTestMsg(e.target.value)} style={inp} />
          </div>
        </div>

        {testResult && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: testResult.ok ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${testResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {testResult.ok
              ? <CheckCircle style={{ width: 15, height: 15, color: '#15803d', flexShrink: 0, marginTop: 1 }} />
              : <AlertCircle style={{ width: 15, height: 15, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />}
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: testResult.ok ? '#15803d' : '#dc2626', lineHeight: 1.5 }}>{testResult.msg}</span>
          </div>
        )}

        <button onClick={sendTest} disabled={testing || !isConfigured()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 9, background: isConfigured() ? '#15803d' : '#E5E7EB', border: 'none', color: isConfigured() ? '#fff' : '#9CA3AF', cursor: testing || !isConfigured() ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: testing ? 0.7 : 1 }}>
          {testing ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
          {testing ? 'Sending…' : 'Send Test Message'}
        </button>
      </div>

      {/* ── Save button ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 10, background: '#B8860B', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
          Save WhatsApp Settings
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function IntegrationsPage() {
  const [tab,       setTab]       = useState<'payments' | 'coupons' | 'email' | 'whatsapp'>('payments')
  const [saving,    setSaving]    = useState(false)
  const [gateways,  setGateways]  = useState<GatewayState[]>([])
  const [loadingGW, setLoadingGW] = useState(true)
  const [showPass,  setShowPass]  = useState(false)
  const [email,     setEmail]     = useState({ fromName: 'Thynk Schooling', fromEmail: '', smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: '', smtpPass: '', enabled: false })

  const dragIdx     = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)
  const [dragActive, setDragActive] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin?action=payment-gateways', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.gateways) setGateways(d.gateways)
        else setGateways(Object.keys(GATEWAY_META).map((id, i) => ({ id, name: GATEWAY_META[id].name, enabled: false, priority: i + 1, keyId: '', keySecret: '', extra: {}, mode: 'test' as const })))
        setLoadingGW(false)
      }).catch(() => setLoadingGW(false))

    fetch('/api/admin/settings', { cache: 'no-store' }).then(r => r.json())
      .then(d => { if (d.email_settings) setEmail(p => ({ ...p, ...d.email_settings })) })
      .catch(() => {})
  }, [])

  const updateGateway = (id: string, patch: Partial<GatewayState>) =>
    setGateways(p => p.map(g => g.id === id ? { ...g, ...patch } : g))

  const moveGateway = (idx: number, dir: -1 | 1) => {
    setGateways(p => {
      const arr = [...p], s = idx + dir
      if (s < 0 || s >= arr.length) return arr
      ;[arr[idx], arr[s]] = [arr[s], arr[idx]]
      return arr.map((g, i) => ({ ...g, priority: i + 1 }))
    })
  }

  const onDragStart = (idx: number) => { dragIdx.current = idx; setDragActive(idx) }
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverIdx.current = idx }
  const onDrop      = () => {
    const from = dragIdx.current, to = dragOverIdx.current
    if (from !== null && to !== null && from !== to) {
      setGateways(p => {
        const arr = [...p]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
        return arr.map((g, i) => ({ ...g, priority: i + 1 }))
      })
    }
    dragIdx.current = null; dragOverIdx.current = null; setDragActive(null)
  }

  const saveGateways = async () => {
    setSaving(true)
    try { await fetch('/api/admin?action=payment-gateways', { method: 'POST', headers: authHdr(), body: JSON.stringify({ gateways }) }); toast.success('Payment gateways saved!') }
    catch { toast.error('Save failed') }
    setSaving(false)
  }

  const save = async (key: string, value: any, label: string) => {
    setSaving(true)
    try { await apiSave(key, value); toast.success(`${label} saved!`) }
    catch { toast.error('Save failed') }
    setSaving(false)
  }

  const enabledCount = gateways.filter(g => g.enabled && g.keyId).length

  return (
    <AdminLayout pageClass="admin-page-settings" title="Integrations" subtitle="Payment gateways, discount coupons, email & WhatsApp — all external services">

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { k: 'payments',  icon: '💳', l: 'Payment Gateways', badge: enabledCount > 0 ? String(enabledCount) : null },
          { k: 'coupons',   icon: '🏷️', l: 'Discount Coupons', badge: null },
          { k: 'email',     icon: '📧', l: 'Email / SMTP',      badge: null },
          { k: 'whatsapp',  icon: '💬', l: 'WhatsApp',          badge: null },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${tab === t.k ? '#B8860B' : 'rgba(13,17,23,0.12)'}`, background: tab === t.k ? '#FEF7E0' : '#fff', color: tab === t.k ? '#B8860B' : '#4A5568', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t.icon} {t.l}
            {t.badge && <span style={{ padding: '1px 7px', borderRadius: 100, background: '#B8860B', color: '#fff', fontSize: 10, fontWeight: 700 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ══ PAYMENTS TAB ══ */}
      {tab === 'payments' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
            <CreditCard style={{ width: 16, height: 16, color: '#B8860B', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>{enabledCount === 0 ? 'No gateways active — schools cannot make payments' : `${enabledCount} gateway${enabledCount > 1 ? 's' : ''} active`}</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', marginTop: 2 }}>Drag ⠿ or use ▲▼ arrows to reorder. Priority 1 = shown first at checkout.</div>
            </div>
            <button onClick={saveGateways} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: saving ? 0.6 : 1 }}>
              {saving ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save style={{ width: 13, height: 13 }} />Save Order & Config</>}
            </button>
          </div>
          {loadingGW ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>Loading gateway configuration...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gateways.map((gw, i) => (
                <div key={gw.id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop} onDragEnd={() => { dragIdx.current = null; setDragActive(null) }}
                  style={{ opacity: dragActive === i ? 0.45 : 1, transition: 'opacity .15s', outline: dragOverIdx.current === i && dragActive !== i ? '2px dashed #B8860B' : 'none', borderRadius: 14 }}>
                  <GatewayCard gw={gw} onUpdate={updateGateway} onMoveUp={() => moveGateway(i, -1)} onMoveDown={() => moveGateway(i, 1)} isFirst={i === 0} isLast={i === gateways.length - 1} saving={saving} />
                </div>
              ))}
            </div>
          )}
          {enabledCount > 1 && (
            <div style={{ marginTop: 20, padding: '16px 20px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8', marginBottom: 12 }}>Checkout preview — what schools see in this order</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {gateways.filter(g => g.enabled && g.keyId).map((gw, i) => {
                  const m = GATEWAY_META[gw.id]
                  return (
                    <div key={gw.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, border: `1.5px solid ${m.color}30`, background: m.bg }}>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8', fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ fontSize: 16 }}>{m.logo}</span>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: '#0D1117' }}>{m.name}</span>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: gw.mode === 'live' ? '#dc2626' : '#6B7280', fontWeight: 600 }}>{gw.mode}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ COUPONS TAB ══ */}
      {tab === 'coupons' && <CouponsTab />}

      {/* ══ EMAIL TAB ══ */}
      {tab === 'email' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(13,17,23,0.09)', padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0D1117', fontFamily: 'Inter,sans-serif' }}>Gmail SMTP</div>
              <div style={{ fontSize: 13, color: '#718096', fontFamily: 'Inter,sans-serif' }}>Send emails via Gmail using an App Password</div>
            </div>
            <button onClick={() => setEmail(p => ({ ...p, enabled: !p.enabled }))}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: email.enabled ? '#0D1117' : '#F5F0E8', color: email.enabled ? '#FAF7F2' : '#718096', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {email.enabled ? '✓ Enabled' : 'Disabled'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { k: 'fromName',  l: 'Sender Name',   ph: 'Thynk Schooling' },
              { k: 'fromEmail', l: 'From Email',     ph: 'noreply@yourdomain.com' },
              { k: 'smtpHost',  l: 'SMTP Host',      ph: 'smtp.gmail.com' },
              { k: 'smtpPort',  l: 'SMTP Port',      ph: '587' },
              { k: 'smtpUser',  l: 'Gmail Address',  ph: 'your@gmail.com' },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.l}</label>
                <input value={(email as any)[f.k]} onChange={e => setEmail(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} />
              </div>
            ))}
            <div>
              <label style={lbl}>App Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={email.smtpPass} onChange={e => setEmail(p => ({ ...p, smtpPass: e.target.value }))} placeholder="xxxx xxxx xxxx xxxx" style={{ ...inp, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => save('email_settings', email, 'Email settings')} disabled={saving}
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
            Save Email Settings
          </button>
        </div>
      )}

      {/* ══ WHATSAPP TAB ══ */}
      {tab === 'whatsapp' && <WhatsAppTab saving={saving} setSaving={setSaving} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  )
}
