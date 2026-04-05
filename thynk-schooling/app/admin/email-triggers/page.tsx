'use client'
export const dynamic = 'force-dynamic'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Mail, MessageCircle, School, Users, Eye, EyeOff,
  ToggleLeft, ToggleRight, Save, Loader2, Plus, Trash2, Info, Pencil, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile  = 'school' | 'parent'
type Channel  = 'email' | 'whatsapp'

interface ChannelTemplate { subject?: string; body: string; enabled: boolean }
interface Trigger {
  id: string; triggerKey: string; category: string; event: string
  description: string; recipients: Profile[]; variables: string[]
  email:    { school: ChannelTemplate; parent: ChannelTemplate }
  whatsapp: { school: ChannelTemplate; parent: ChannelTemplate }
  sortOrder: number
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--a-card, #0C1428)',
  border: '1px solid var(--a-border, rgba(45,212,191,0.09))',
  borderRadius: 12,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  letterSpacing: '0.13em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.38)', marginBottom: 6, fontFamily: 'Inter, sans-serif',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, color: 'rgba(255,255,255,0.88)',
  fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
}
const CHANNEL_COLOR: Record<Channel, string> = { email: '#60A5FA', whatsapp: '#25D366' }
const CAT_COLOR: Record<string, string> = {
  Onboarding: '#2DD4BF', Leads: '#FBBF24', Subscription: '#E8C547',
  Applications: '#60A5FA', Reviews: '#A78BFA', Counselling: '#34D399', General: '#94A3B8',
}
const CATEGORIES = ['All', 'Onboarding', 'Leads', 'Subscription', 'Applications', 'Reviews', 'Counselling']

// ─── API ──────────────────────────────────────────────────────────────────────
function hdrs() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}
const apiFetch  = ()      => fetch('/api/admin?action=message-triggers').then(r => r.json()) as Promise<Trigger[]>
const apiUpsert = (b: any) => fetch('/api/admin?action=message-triggers', { method: 'POST', headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json())
const apiDelete = (id: string) => fetch(`/api/admin?action=message-triggers&id=${id}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json())

// ─── Add/Edit modal ───────────────────────────────────────────────────────────
const EMPTY: Partial<Trigger> = {
  triggerKey: '', category: 'General', event: '', description: '',
  recipients: [], variables: [],
  email:    { school: { subject: '', body: '', enabled: false }, parent: { subject: '', body: '', enabled: false } },
  whatsapp: { school: { body: '', enabled: false }, parent: { body: '', enabled: false } },
  sortOrder: 0,
}

function Modal({ trigger, onClose, onSave, saving }: {
  trigger?: Trigger; onClose: () => void; onSave: (t: Partial<Trigger>) => void; saving: boolean
}) {
  const [form, setForm] = useState<Partial<Trigger>>(trigger ? JSON.parse(JSON.stringify(trigger)) : JSON.parse(JSON.stringify(EMPTY)))
  const [vars, setVars] = useState((trigger?.variables ?? []).join(', '))
  const [recs, setRecs] = useState((trigger?.recipients ?? []).join(', '))

  function deep(path: string[], val: any) {
    setForm(prev => {
      const n: any = JSON.parse(JSON.stringify(prev))
      let c = n; for (let i = 0; i < path.length - 1; i++) c = c[path[i]]
      c[path[path.length - 1]] = val; return n
    })
  }

  const get = (ch: Channel, pr: Profile, f: string) => (form as any)?.[ch]?.[pr]?.[f] ?? ''

  function submit() {
    onSave({
      ...form,
      variables: vars.split(',').map(v => v.trim()).filter(Boolean),
      recipients: recs.split(',').map(v => v.trim().toLowerCase()).filter(v => v === 'school' || v === 'parent') as Profile[],
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...card, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'auto', padding: 26 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif' }}>
            {trigger ? 'Edit Trigger' : 'Add New Trigger'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={lbl}>Trigger Key *</label>
            <input value={form.triggerKey ?? ''} disabled={!!trigger}
              onChange={e => setForm(p => ({ ...p, triggerKey: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              style={{ ...inp, opacity: trigger ? 0.5 : 1 }} placeholder="e.g. payment_received" />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category ?? 'General'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}>
              {[...CATEGORIES.filter(c => c !== 'All'), 'General'].map(c => <option key={c} value={c} style={{ background: '#0C1428' }}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Event Name *</label>
            <input value={form.event ?? ''} onChange={e => setForm(p => ({ ...p, event: e.target.value }))}
              style={inp} placeholder="e.g. Payment Received" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Description</label>
            <input value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={inp} placeholder="When is this triggered?" />
          </div>
          <div>
            <label style={lbl}>Recipients (school, parent)</label>
            <input value={recs} onChange={e => setRecs(e.target.value)} style={inp} placeholder="school, parent" />
          </div>
          <div>
            <label style={lbl}>Variables (comma-separated)</label>
            <input value={vars} onChange={e => setVars(e.target.value)} style={inp} placeholder="{{name}}, {{url}}" />
          </div>
        </div>

        {/* Templates: 2×2 grid (school/parent × email/whatsapp) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {(['school', 'parent'] as Profile[]).flatMap(pr =>
            (['email', 'whatsapp'] as Channel[]).map(ch => {
              const color = CHANNEL_COLOR[ch]
              const Icon  = ch === 'email' ? Mail : MessageCircle
              return (
                <div key={`${pr}_${ch}`} style={{ background: `${color}05`, border: `1px solid ${color}18`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'capitalize' }}>
                      <Icon style={{ width: 11, height: 11 }} />
                      {ch === 'whatsapp' ? 'WA' : 'Email'} → {pr}
                    </span>
                    <button onClick={() => deep([ch, pr, 'enabled'], !get(ch, pr, 'enabled'))}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, border: `1px solid ${get(ch, pr, 'enabled') ? color : 'rgba(255,255,255,0.1)'}`, background: get(ch, pr, 'enabled') ? `${color}18` : 'transparent', color: get(ch, pr, 'enabled') ? color : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      {get(ch, pr, 'enabled') ? <ToggleRight style={{ width: 11, height: 11 }} /> : <ToggleLeft style={{ width: 11, height: 11 }} />}
                      {get(ch, pr, 'enabled') ? 'On' : 'Off'}
                    </button>
                  </div>
                  {ch === 'email' && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...lbl, color: `${color}99` }}>Subject</label>
                      <input value={get(ch, pr, 'subject')} onChange={e => deep([ch, pr, 'subject'], e.target.value)}
                        style={{ ...inp, fontSize: 12 }} placeholder="Subject…" />
                    </div>
                  )}
                  <div>
                    <label style={{ ...lbl, color: `${color}99` }}>{ch === 'whatsapp' ? 'Message' : 'Body'}</label>
                    <textarea value={get(ch, pr, 'body')} onChange={e => deep([ch, pr, 'body'], e.target.value)}
                      rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontSize: 12 }}
                      placeholder={ch === 'whatsapp' ? '*bold*, _italic_ supported' : 'Email body…'} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 8, border: 'none', background: '#B8860B', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
            Save Trigger
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Template editor panel ────────────────────────────────────────────────────
function Editor({ trigger, channel, profile, onSave, saving }: {
  trigger: Trigger; channel: Channel; profile: Profile
  onSave: (updated: Trigger) => void; saving: boolean
}) {
  const tmpl    = trigger[channel][profile]
  const isEmail = channel === 'email'
  const color   = CHANNEL_COLOR[channel]
  const [preview, setPreview] = useState(false)

  function update(field: string, value: any) {
    const next: any = JSON.parse(JSON.stringify(trigger))
    next[channel][profile][field] = value
    onSave(next as Trigger)
  }

  function insertVar(v: string) {
    update('body', (tmpl.body || '') + (tmpl.body?.endsWith('\n') ? '' : '\n') + v)
  }

  if (!trigger.recipients.includes(profile)) return (
    <div style={{ ...card, padding: 24, textAlign: 'center' }}>
      <Info style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontFamily: 'Inter,sans-serif' }}>
        This trigger doesn't send to <strong style={{ color: 'rgba(255,255,255,0.45)' }}>{profile}s</strong>
      </div>
    </div>
  )

  return (
    <div style={{ ...card, padding: 18 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {isEmail ? <Mail style={{ width: 13, height: 13, color }} /> : <MessageCircle style={{ width: 13, height: 13, color }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'Inter,sans-serif' }}>
            {isEmail ? 'Email' : 'WhatsApp'} → {profile}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {isEmail && (
            <button onClick={() => setPreview(!preview)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: preview ? 'rgba(255,255,255,0.06)' : 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {preview ? <EyeOff style={{ width: 11, height: 11 }} /> : <Eye style={{ width: 11, height: 11 }} />}
              {preview ? 'Edit' : 'Preview'}
            </button>
          )}
          <button onClick={() => update('enabled', !tmpl.enabled)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7, border: `1px solid ${tmpl.enabled ? color : 'rgba(255,255,255,0.1)'}`, background: tmpl.enabled ? `${color}18` : 'transparent', color: tmpl.enabled ? color : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>
            {tmpl.enabled ? <ToggleRight style={{ width: 13, height: 13 }} /> : <ToggleLeft style={{ width: 13, height: 13 }} />}
            {tmpl.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Variable chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {trigger.variables.map(v => (
          <button key={v} onClick={() => insertVar(v)} title="Click to insert"
            style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)', color: '#E8C547', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Email preview */}
      {preview && isEmail ? (
        <div style={{ background: '#F5F0E8', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A9AB0', marginBottom: 4, fontFamily: 'Inter,sans-serif' }}>Subject</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1117', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(13,17,23,0.1)', fontFamily: 'Inter,sans-serif' }}>{tmpl.subject || '(no subject)'}</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'Inter,sans-serif' }}>{tmpl.body || '(no body)'}</div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(13,17,23,0.08)', fontSize: 11, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>Sent by Thynk Schooling · Unsubscribe</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isEmail && (
            <div>
              <label style={lbl}>Subject</label>
              <input value={tmpl.subject ?? ''} onChange={e => update('subject', e.target.value)} style={inp} placeholder="Email subject…" />
            </div>
          )}
          <div>
            <label style={lbl}>{isEmail ? 'Body' : 'Message'}</label>
            <textarea value={tmpl.body} onChange={e => update('body', e.target.value)}
              rows={channel === 'whatsapp' ? 6 : 11}
              placeholder={isEmail ? 'Email body…' : 'WhatsApp message — *bold*, _italic_ supported'}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }} />
          </div>
        </div>
      )}

      {/* WhatsApp bubble preview */}
      {channel === 'whatsapp' && tmpl.body && (
        <div style={{ marginTop: 12, padding: 14, background: '#0B1418', borderRadius: 10, borderLeft: '3px solid #25D366' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#25D366', marginBottom: 6, fontFamily: 'Inter,sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview</div>
          <div style={{ background: '#1F2C34', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', maxWidth: 280, display: 'inline-block' }}>
            <div style={{ fontSize: 12, color: '#E9EDEF', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'Inter,sans-serif' }}
              dangerouslySetInnerHTML={{ __html: tmpl.body
                .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
                .replace(/_(.+?)_/g, '<em>$1</em>') }} />
            <div style={{ fontSize: 10, color: '#8696A0', marginTop: 4, textAlign: 'right', fontFamily: 'Inter,sans-serif' }}>12:34 ✓✓</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={() => onSave(trigger)} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#B8860B', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(184,134,11,0.25)' }}>
          {saving ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 12, height: 12 }} />}
          Save Template
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MessageTriggersPage() {
  const qc = useQueryClient()
  const [activeTrigger, setActiveTrigger] = useState<Trigger | null>(null)
  const [activeChannel, setActiveChannel] = useState<Channel>('email')
  const [activeProfile, setActiveProfile] = useState<Profile>('school')
  const [filterCat, setFilterCat]         = useState('All')
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<Trigger | undefined>()
  const [savingId, setSavingId]           = useState<string | null>(null)

  const { data: triggers = [], isLoading } = useQuery<Trigger[]>({
    queryKey: ['message-triggers'],
    queryFn: apiFetch,
    staleTime: 30_000,
    onSuccess: data => { if (!activeTrigger && data.length) setActiveTrigger(data[0]) },
  })

  const upsertMut = useMutation({
    mutationFn: apiUpsert,
    onSuccess: saved => {
      qc.setQueryData(['message-triggers'], (old: Trigger[] = []) => {
        const exists = old.find(t => t.id === saved.id)
        return exists ? old.map(t => t.id === saved.id ? saved : t) : [...old, saved]
      })
      setActiveTrigger(saved)
      setShowModal(false)
      toast.success('Trigger saved')
    },
    onError: () => toast.error('Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: apiDelete,
    onSuccess: (_, id) => {
      qc.setQueryData(['message-triggers'], (old: Trigger[] = []) => old.filter(t => t.id !== id))
      setActiveTrigger(null)
      toast.success('Trigger deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  const saveTemplate = useCallback(async (updated: Trigger) => {
    setSavingId(updated.id)
    try {
      const saved = await apiUpsert(updated)
      qc.setQueryData(['message-triggers'], (old: Trigger[] = []) => old.map(t => t.id === saved.id ? saved : t))
      setActiveTrigger(saved)
      toast.success('Template saved')
    } catch { toast.error('Save failed') }
    setSavingId(null)
  }, [qc])

  const filtered = triggers.filter(t => filterCat === 'All' || t.category === filterCat)
  const emailOn  = triggers.filter(t => t.email.school.enabled || t.email.parent.enabled).length
  const waOn     = triggers.filter(t => t.whatsapp.school.enabled || t.whatsapp.parent.enabled).length

  return (
    <AdminLayout pageClass="admin-page-email-triggers" title="Message Triggers"
      subtitle="Manage automated emails & WhatsApp messages for every platform event — live from database">

      {/* ── Top controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Channel tabs */}
          {(['email', 'whatsapp'] as Channel[]).map(ch => {
            const Icon  = ch === 'email' ? Mail : MessageCircle
            const color = CHANNEL_COLOR[ch]
            const count = ch === 'email' ? emailOn : waOn
            const active = activeChannel === ch
            return (
              <button key={ch} onClick={() => setActiveChannel(ch)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: active ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: active ? `${color}14` : 'transparent', color: active ? color : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>
                <Icon style={{ width: 14, height: 14 }} />
                {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
                <span style={{ fontSize: 10, background: active ? color : 'rgba(255,255,255,0.08)', color: active ? '#0D1117' : 'rgba(255,255,255,0.4)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>{count}</span>
              </button>
            )
          })}

          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />

          {/* Profile tabs */}
          {(['school', 'parent'] as Profile[]).map(p => {
            const Icon  = p === 'school' ? School : Users
            const color = p === 'school' ? '#2DD4BF' : '#60A5FA'
            const active = activeProfile === p
            return (
              <button key={p} onClick={() => setActiveProfile(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, border: active ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: active ? `${color}12` : 'transparent', color: active ? color : 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>
                <Icon style={{ width: 13, height: 13 }} />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const color = CAT_COLOR[cat] ?? '#2DD4BF'
              const active = filterCat === cat
              return (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: active ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.07)', background: active ? `${color}12` : 'transparent', color: active ? color : 'rgba(255,255,255,0.32)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', letterSpacing: '0.05em', transition: 'all .15s' }}>
                  {cat}
                </button>
              )
            })}
          </div>
          <button onClick={() => { setEditTarget(undefined); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#B8860B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', boxShadow: '0 3px 12px rgba(184,134,11,0.25)' }}>
            <Plus style={{ width: 13, height: 13 }} /> Add Trigger
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 14, alignItems: 'start' }}>

        {/* ── Trigger list ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'Inter,sans-serif' }}>
              {filtered.length} trigger{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'Inter,sans-serif' }}>No triggers here</div>
          ) : (
            filtered.map(t => {
              const isActive = activeTrigger?.id === t.id
              const catColor = CAT_COLOR[t.category] ?? '#94A3B8'
              const eOn = t.email[activeProfile]?.enabled
              const wOn = t.whatsapp[activeProfile]?.enabled
              return (
                <button key={t.id} onClick={() => setActiveTrigger(t)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', border: 'none', textAlign: 'left', background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent', borderLeft: isActive ? `2px solid ${catColor}` : '2px solid transparent', cursor: 'pointer', transition: 'all .12s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.68)', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.event}</div>
                    <div style={{ fontSize: 10, color: catColor, fontFamily: 'Inter,sans-serif', marginTop: 1, opacity: 0.8 }}>{t.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <div title={`Email ${eOn ? 'on' : 'off'}`} style={{ width: 7, height: 7, borderRadius: '50%', background: eOn ? '#60A5FA' : 'rgba(255,255,255,0.1)' }} />
                    <div title={`WhatsApp ${wOn ? 'on' : 'off'}`} style={{ width: 7, height: 7, borderRadius: '50%', background: wOn ? '#25D366' : 'rgba(255,255,255,0.1)' }} />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* ── Editor ── */}
        {activeTrigger ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Trigger header */}
            <div style={{ ...card, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif' }}>{activeTrigger.event}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: 'Inter,sans-serif', background: `${CAT_COLOR[activeTrigger.category] ?? '#94A3B8'}15`, color: CAT_COLOR[activeTrigger.category] ?? '#94A3B8', border: `1px solid ${CAT_COLOR[activeTrigger.category] ?? '#94A3B8'}30` }}>{activeTrigger.category}</span>
                  {/* recipient chips */}
                  {activeTrigger.recipients.map(r => (
                    <span key={r} style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: 'Inter,sans-serif', background: r === 'school' ? 'rgba(45,212,191,0.1)' : 'rgba(96,165,250,0.1)', color: r === 'school' ? '#2DD4BF' : '#60A5FA', border: `1px solid ${r === 'school' ? 'rgba(45,212,191,0.25)' : 'rgba(96,165,250,0.25)'}` }}>{r}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter,sans-serif' }}>{activeTrigger.description}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'JetBrains Mono, monospace', marginTop: 3 }}>key: {activeTrigger.triggerKey}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditTarget(activeTrigger); setShowModal(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  <Pencil style={{ width: 11, height: 11 }} /> Edit
                </button>
                <button onClick={() => { if (confirm(`Delete "${activeTrigger.event}"?`)) deleteMut.mutate(activeTrigger.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: '#F87171', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  <Trash2 style={{ width: 11, height: 11 }} /> Delete
                </button>
              </div>
            </div>

            <Editor
              key={`${activeTrigger.id}_${activeChannel}_${activeProfile}`}
              trigger={activeTrigger}
              channel={activeChannel}
              profile={activeProfile}
              onSave={saveTemplate}
              saving={savingId === activeTrigger.id}
            />
          </div>
        ) : (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter,sans-serif' }}>
              {isLoading ? 'Loading triggers from database…' : 'Select a trigger from the list'}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          trigger={editTarget}
          onClose={() => setShowModal(false)}
          onSave={data => upsertMut.mutate(data)}
          saving={upsertMut.isLoading}
        />
      )}
    </AdminLayout>
  )
}
