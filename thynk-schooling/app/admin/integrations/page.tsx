'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Mail, MessageCircle, Save, Loader2, Eye, EyeOff,
  CreditCard, GripVertical, ChevronUp, ChevronDown,
  CheckCircle, AlertCircle, TestTube, Globe, Lock,
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

/* ── Gateway metadata ─────────────────────────────────────────────────────── */
const GATEWAY_META: Record<string, {
  name: string; logo: string; color: string; bg: string;
  description: string; domestic: boolean; international: boolean;
  fields: Array<{ key: string; label: string; hint: string; secret?: boolean }>
  extraFields?: Array<{ key: string; label: string; hint: string; secret?: boolean }>
  docs: string
}> = {
  razorpay: {
    name: 'Razorpay', logo: '💙', color: '#3395FF', bg: 'rgba(51,149,255,0.08)',
    description: 'India\'s leading payment gateway. Supports cards, UPI, netbanking, wallets.',
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
      { key: 'keyId',     label: 'Merchant Key', hint: 'From Easebuzz Dashboard → API' },
      { key: 'keySecret', label: 'Salt',          hint: 'Your Easebuzz salt for hash generation', secret: true },
    ],
    extraFields: [
      { key: 'salt', label: 'Salt (duplicate entry for hash)', hint: 'Same as Secret Key above', secret: true },
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

/* ── Secret field component ──────────────────────────────────────────────── */
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

/* ── Gateway card ─────────────────────────────────────────────────────────── */
function GatewayCard({ gw, onUpdate, onMoveUp, onMoveDown, isFirst, isLast, saving }:
  { gw: GatewayState; onUpdate: (id: string, patch: Partial<GatewayState>) => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean; saving: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const meta = GATEWAY_META[gw.id]
  if (!meta) return null
  const isConfigured = !!gw.keyId && !!gw.keySecret

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${gw.enabled ? meta.color + '40' : 'rgba(13,17,23,0.09)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: gw.enabled ? meta.bg : '#FAFAFA', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        {/* Drag/reorder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={isFirst}
            style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.5 }}>
            <ChevronUp style={{ width: 10, height: 10 }} />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={isLast}
            style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.5 }}>
            <ChevronDown style={{ width: 10, height: 10 }} />
          </button>
        </div>

        <GripVertical style={{ width: 14, height: 14, color: '#D4D4D4', flexShrink: 0 }} />

        {/* Priority badge */}
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: gw.enabled ? meta.color : '#E5E7EB', color: gw.enabled ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
          {gw.priority}
        </div>

        <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.logo}</span>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Enable toggle */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: gw.enabled ? meta.color : '#9CA3AF', fontWeight: 600 }}>
            {gw.enabled ? 'Active' : 'Off'}
          </span>
          <div onClick={() => onUpdate(gw.id, { enabled: !gw.enabled })}
            style={{ width: 40, height: 22, borderRadius: 11, background: gw.enabled ? meta.color : '#E5E7EB', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: gw.enabled ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        <ChevronDown style={{ width: 14, height: 14, color: '#A0ADB8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </div>

      {/* Expanded config area */}
      {expanded && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(13,17,23,0.07)' }}>
          {/* Live / Test toggle */}
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
                  <input type="text" value={(gw as any)[f.key] || ''} onChange={e => onUpdate(gw.id, { [f.key]: e.target.value } as any)}
                    placeholder={f.hint} style={inp} />
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '4px 0 0' }}>{f.hint}</p>
                </div>
              )
            )}
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={meta.docs} target="_blank" rel="noreferrer"
              style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: meta.color, textDecoration: 'none', fontWeight: 600 }}>
              📖 {meta.name} API docs →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function IntegrationsPage() {
  const [tab, setTab] = useState<'payments' | 'email' | 'whatsapp'>('payments')
  const [saving, setSaving] = useState(false)
  const [gateways, setGateways] = useState<GatewayState[]>([])
  const [loadingGW, setLoadingGW] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState({ fromName: 'Thynk Schooling', fromEmail: '', smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: '', smtpPass: '', enabled: false })
  const [wa, setWa] = useState({ provider: 'twilio', accountSid: '', authToken: '', fromNumber: '', metaToken: '', metaPhoneId: '', enabled: false })

  /* ── Load gateways from DB ── */
  useEffect(() => {
    fetch('/api/admin?action=payment-gateways', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.gateways) setGateways(d.gateways)
        else {
          // Fallback: show all gateways as unconfigured
          setGateways(Object.keys(GATEWAY_META).map((id, i) => ({
            id, name: GATEWAY_META[id].name, enabled: false, priority: i + 1,
            keyId: '', keySecret: '', extra: {}, mode: 'test' as const,
          })))
        }
        setLoadingGW(false)
      })
      .catch(() => setLoadingGW(false))

    fetch('/api/admin/settings', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.email_settings) setEmail(p => ({ ...p, ...d.email_settings }))
      if (d.whatsapp_settings) setWa(p => ({ ...p, ...d.whatsapp_settings }))
    }).catch(() => {})
  }, [])

  /* ── Gateway helpers ── */
  const updateGateway = (id: string, patch: Partial<GatewayState>) => {
    setGateways(p => p.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const moveGateway = (idx: number, dir: -1 | 1) => {
    setGateways(p => {
      const arr = [...p]; const s = idx + dir
      if (s < 0 || s >= arr.length) return arr
      ;[arr[idx], arr[s]] = [arr[s], arr[idx]]
      return arr.map((g, i) => ({ ...g, priority: i + 1 }))
    })
  }

  /* ── Save gateways ── */
  const saveGateways = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('ts_access_token') || ''
      await fetch('/api/admin?action=payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gateways }),
      })
      toast.success('Payment gateways saved!')
    } catch { toast.error('Save failed') }
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
    <AdminLayout pageClass="admin-page-settings" title="Integrations" subtitle="Payment gateways, email & WhatsApp — configure all external services here">

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[
          { k: 'payments', icon: '💳', l: 'Payment Gateways' },
          { k: 'email',    icon: '📧', l: 'Email / SMTP' },
          { k: 'whatsapp', icon: '💬', l: 'WhatsApp' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
              border: `1.5px solid ${tab === t.k ? '#B8860B' : 'rgba(13,17,23,0.12)'}`,
              background: tab === t.k ? '#FEF7E0' : '#fff', color: tab === t.k ? '#B8860B' : '#4A5568',
              fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t.icon} {t.l}
            {t.k === 'payments' && enabledCount > 0 && (
              <span style={{ padding: '1px 7px', borderRadius: 100, background: '#B8860B', color: '#fff', fontSize: 10, fontWeight: 700 }}>{enabledCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ PAYMENTS TAB ══════════ */}
      {tab === 'payments' && (
        <div>
          {/* Info bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
            <CreditCard style={{ width: 16, height: 16, color: '#B8860B', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>
                {enabledCount === 0 ? 'No gateways active — schools cannot make payments' : `${enabledCount} gateway${enabledCount > 1 ? 's' : ''} active`}
              </div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', marginTop: 2 }}>
                Enable multiple gateways — parents see them in priority order (drag to reorder). They choose one at checkout.
              </div>
            </div>
            <button onClick={saveGateways} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: saving ? 0.6 : 1 }}>
              {saving ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save style={{ width: 13, height: 13 }} />Save Gateways</>}
            </button>
          </div>

          {/* Priority legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '8px 14px', background: 'rgba(184,134,11,0.04)', borderRadius: 8, border: '1px solid rgba(184,134,11,0.12)' }}>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#B8860B', fontWeight: 700 }}>ℹ️ How it works:</span>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>
              Priority 1 = shown first at checkout. Schools can pick any enabled gateway. Use arrows to reorder.
            </span>
          </div>

          {/* Gateway cards */}
          {loadingGW ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>Loading gateway configuration...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gateways.map((gw, i) => (
                <GatewayCard key={gw.id} gw={gw}
                  onUpdate={updateGateway}
                  onMoveUp={() => moveGateway(i, -1)}
                  onMoveDown={() => moveGateway(i, 1)}
                  isFirst={i === 0} isLast={i === gateways.length - 1}
                  saving={saving} />
              ))}
            </div>
          )}

          {/* Checkout preview */}
          {enabledCount > 1 && (
            <div style={{ marginTop: 20, padding: '16px 20px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8', marginBottom: 12 }}>
                What schools will see at checkout (in this order)
              </div>
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

      {/* ══════════ EMAIL TAB ══════════ */}
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
              { k: 'fromName', l: 'Sender Name', ph: 'Thynk Schooling' },
              { k: 'fromEmail', l: 'From Email', ph: 'noreply@yourdomain.com' },
              { k: 'smtpHost', l: 'SMTP Host', ph: 'smtp.gmail.com' },
              { k: 'smtpPort', l: 'SMTP Port', ph: '587' },
              { k: 'smtpUser', l: 'Gmail Address', ph: 'your@gmail.com' },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.l}</label>
                <input value={(email as any)[f.k]} onChange={e => setEmail(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} />
              </div>
            ))}
            <div>
              <label style={lbl}>App Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={email.smtpPass}
                  onChange={e => setEmail(p => ({ ...p, smtpPass: e.target.value }))}
                  placeholder="xxxx xxxx xxxx xxxx" style={{ ...inp, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
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

      {/* ══════════ WHATSAPP TAB ══════════ */}
      {tab === 'whatsapp' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(13,17,23,0.09)', padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0D1117', fontFamily: 'Inter,sans-serif' }}>WhatsApp</div>
              <div style={{ fontSize: 13, color: '#718096', fontFamily: 'Inter,sans-serif' }}>Twilio or Meta Cloud API for WhatsApp notifications</div>
            </div>
            <button onClick={() => setWa(p => ({ ...p, enabled: !p.enabled }))}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: wa.enabled ? '#0D1117' : '#F5F0E8', color: wa.enabled ? '#FAF7F2' : '#718096', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {wa.enabled ? '✓ Enabled' : 'Disabled'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[{ k: 'twilio', l: 'Twilio' }, { k: 'meta', l: 'Meta Cloud API' }].map(p => (
              <button key={p.k} onClick={() => setWa(prev => ({ ...prev, provider: p.k }))}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${wa.provider === p.k ? '#B8860B' : 'rgba(13,17,23,0.12)'}`, background: wa.provider === p.k ? '#FEF7E0' : '#fff', color: wa.provider === p.k ? '#B8860B' : '#4A5568', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {p.l}
              </button>
            ))}
          </div>
          {wa.provider === 'twilio' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ k: 'accountSid', l: 'Account SID', ph: 'ACxxxxxxxx' }, { k: 'authToken', l: 'Auth Token', ph: 'Your Twilio Auth Token' }, { k: 'fromNumber', l: 'WhatsApp From Number', ph: 'whatsapp:+14155238886' }].map(f => (
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(wa as any)[f.k]} onChange={e => setWa(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ k: 'metaToken', l: 'Access Token', ph: 'EAAxxxxxxxx' }, { k: 'metaPhoneId', l: 'Phone Number ID', ph: '1234567890' }].map(f => (
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(wa as any)[f.k]} onChange={e => setWa(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} />
                </div>
              ))}
            </div>
          )}
          <button onClick={() => save('whatsapp_settings', wa, 'WhatsApp settings')} disabled={saving}
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', borderRadius: 9, background: '#B8860B', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
            Save WhatsApp Settings
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  )
}
