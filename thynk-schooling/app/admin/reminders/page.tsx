'use client'
export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Clock, Mail, MessageCircle, Plus, Trash2, Pencil, X,
  ToggleLeft, ToggleRight, Loader2, ChevronDown, ChevronUp,
  Bell, Zap, AlertTriangle, CheckCircle2, BarChart3, RefreshCw,
  Play, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReminderSchedule {
  id?:                  string
  name:                 string
  triggerEvent:         string
  delayDays:            number
  delayHours:           number
  channels:             ('email' | 'whatsapp')[]
  messageEmailSubject:  string
  messageEmailBody:     string
  messageWaBody:        string
  waTemplateName:       string
  waTemplateLang:       string
  repeatEveryDays:      number
  maxRepeats:           number
  stopOnEvents:         string[]
  targetAudience:       string
  isActive:             boolean
  sortOrder:            number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TRIGGER_EVENTS = [
  { value: 'lead_not_unlocked', label: 'Lead Not Unlocked',    icon: '🔒', color: '#FBBF24', desc: 'Fired when a lead remains unlocked after N days' },
  { value: 'credits_low',       label: 'Credits Running Low',  icon: '⚡', color: '#F97316', desc: 'Fired when school credits fall to 2 or below' },
  { value: 'credits_expired',   label: 'Credits Expired',      icon: '🚫', color: '#EF4444', desc: 'Fired when school credits expire and reach 0' },
]

const STOP_EVENTS = [
  { value: 'lead_unlocked',    label: 'Lead Unlocked' },
  { value: 'credits_purchased', label: 'Credits Purchased' },
]

const CHANNEL_VARS: Record<string, string[]> = {
  lead_not_unlocked: ['{{school_name}}','{{leads_count}}','{{child_name}}','{{class_applying}}','{{city}}','{{dashboard_url}}','{{unlock_url}}'],
  credits_low:       ['{{school_name}}','{{credits_remaining}}','{{dashboard_url}}','{{packages_url}}'],
  credits_expired:   ['{{school_name}}','{{dashboard_url}}','{{packages_url}}'],
}

const EMPTY: ReminderSchedule = {
  name: '', triggerEvent: 'lead_not_unlocked',
  delayDays: 2, delayHours: 9,
  channels: ['email'],
  messageEmailSubject: '', messageEmailBody: '', messageWaBody: '',
  waTemplateName: '', waTemplateLang: 'en',
  repeatEveryDays: 0, maxRepeats: 1,
  stopOnEvents: ['lead_unlocked'],
  targetAudience: 'school', isActive: true, sortOrder: 0,
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = {
  card: {
    background: 'var(--a-card, #0C1428)',
    border: '1px solid var(--a-border, rgba(45,212,191,0.09))',
    borderRadius: 14,
  } as React.CSSProperties,
  lbl: {
    display: 'block', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontFamily: 'Inter,sans-serif',
  } as React.CSSProperties,
  inp: {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, color: 'rgba(255,255,255,0.88)', fontSize: 13,
    fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  select: {
    width: '100%', padding: '9px 12px',
    background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, color: 'rgba(255,255,255,0.88)', fontSize: 13,
    fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' as const,
    cursor: 'pointer',
  } as React.CSSProperties,
  textarea: {
    width: '100%', padding: '9px 12px', resize: 'vertical' as const,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, color: 'rgba(255,255,255,0.88)', fontSize: 12,
    fontFamily: 'ui-monospace,monospace', outline: 'none', boxSizing: 'border-box' as const,
    lineHeight: 1.7, minHeight: 110,
  } as React.CSSProperties,
  btn: (color = '#2DD4BF') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    background: color, color: '#fff', fontFamily: 'Inter,sans-serif',
  } as React.CSSProperties),
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
    fontSize: 12, fontWeight: 500, background: 'transparent',
    color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif',
  } as React.CSSProperties,
}

// ─── Auth headers ─────────────────────────────────────────────────────────────
function hdrs() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}

// ─── Variable chips ───────────────────────────────────────────────────────────
function VarChips({ vars, onInsert }: { vars: string[]; onInsert: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
      {vars.map(v => (
        <button key={v} onClick={() => onInsert(v)}
          style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(45,212,191,0.2)',
            background: 'rgba(45,212,191,0.07)', color: '#2DD4BF', fontSize: 10,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.02em' }}>
          {v}
        </button>
      ))}
    </div>
  )
}

// ─── Reminder card ────────────────────────────────────────────────────────────
function ScheduleCard({ s, onEdit, onDelete, onToggle }: {
  s: ReminderSchedule & { id: string }
  onEdit: (s: ReminderSchedule & { id: string }) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}) {
  const ev = TRIGGER_EVENTS.find(e => e.value === s.triggerEvent)
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      ...css.card,
      opacity: s.isActive ? 1 : 0.55,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
           onClick={() => setExpanded(e => !e)}>

        {/* Event color dot */}
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${ev?.color || '#9CA3AF'}18`,
          border: `1px solid ${ev?.color || '#9CA3AF'}30`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {ev?.icon || '🔔'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', fontFamily: 'Inter,sans-serif', marginBottom: 3 }}>
            {s.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: ev?.color || '#9CA3AF', fontWeight: 500 }}>{ev?.label || s.triggerEvent}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              <Clock size={9} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {s.delayDays > 0 ? `${s.delayDays}d ` : ''}{s.delayHours > 0 ? `${s.delayHours}h` : ''} after event
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>·</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {s.channels.includes('email') && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px',
                  borderRadius: 4, background: 'rgba(96,165,250,0.12)', fontSize: 10, color: '#60A5FA', fontWeight: 600 }}>
                  <Mail size={8} /> Email
                </span>
              )}
              {s.channels.includes('whatsapp') && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px',
                  borderRadius: 4, background: 'rgba(37,211,102,0.12)', fontSize: 10, color: '#25D366', fontWeight: 600 }}>
                  <MessageCircle size={8} /> WhatsApp
                </span>
              )}
            </div>
            {s.repeatEveryDays > 0 && (
              <span style={{ fontSize: 10, color: '#FBBF24', fontWeight: 500 }}>
                Repeats every {s.repeatEveryDays}d (max {s.maxRepeats}×)
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Toggle */}
          <button onClick={e => { e.stopPropagation(); onToggle(s.id, !s.isActive) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.isActive ? '#2DD4BF' : 'rgba(255,255,255,0.3)' }}>
            {s.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(s) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 4 }}>
            <Pencil size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(s.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
            <Trash2 size={13} />
          </button>
          <div style={{ color: 'rgba(255,255,255,0.3)' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          {s.messageEmailSubject && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60A5FA', marginBottom: 4 }}>Email Subject</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '7px 10px', fontFamily: 'ui-monospace,monospace' }}>{s.messageEmailSubject}</div>
            </div>
          )}
          {s.messageEmailBody && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60A5FA', marginBottom: 4 }}>Email Body</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '7px 10px', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto' }}>{s.messageEmailBody}</div>
            </div>
          )}
          {s.messageWaBody && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#25D366', marginBottom: 4 }}>
                WhatsApp Template{s.waTemplateName ? ` — ${s.waTemplateName}` : ''}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '7px 10px', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto' }}>{s.messageWaBody}</div>
            </div>
          )}
          {s.stopOnEvents.length > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              <CheckCircle2 size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Stops if: {s.stopOnEvents.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ item, onClose, onSave, saving }: {
  item: Partial<ReminderSchedule>
  onClose: () => void
  onSave: (s: ReminderSchedule) => void
  saving: boolean
}) {
  const [form, setForm] = useState<ReminderSchedule>({ ...EMPTY, ...item })
  const vars = CHANNEL_VARS[form.triggerEvent] || []

  function set(key: keyof ReminderSchedule, val: any) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function toggleChannel(ch: 'email' | 'whatsapp') {
    setForm(p => {
      const next = p.channels.includes(ch) ? p.channels.filter(c => c !== ch) : [...p.channels, ch]
      return { ...p, channels: next }
    })
  }

  function toggleStopEvent(ev: string) {
    setForm(p => {
      const next = p.stopOnEvents.includes(ev) ? p.stopOnEvents.filter(e => e !== ev) : [...p.stopOnEvents, ev]
      return { ...p, stopOnEvents: next }
    })
  }

  function insertVar(field: 'messageEmailSubject' | 'messageEmailBody' | 'messageWaBody', v: string) {
    setForm(p => ({ ...p, [field]: (p[field] || '') + v }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...css.card, width: '100%', maxWidth: 760, maxHeight: '94vh', overflowY: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif' }}>
              {item.id ? 'Edit Reminder' : 'New Reminder Schedule'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'Inter,sans-serif' }}>
              Configure when and how to send automated reminders
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Name */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={css.lbl}>Reminder Name</label>
            <input style={css.inp} value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Unlock Reminder — Day 2" />
          </div>

          {/* Trigger event */}
          <div>
            <label style={css.lbl}>Trigger Event</label>
            <select style={css.select} value={form.triggerEvent} onChange={e => set('triggerEvent', e.target.value)}>
              {TRIGGER_EVENTS.map(ev => (
                <option key={ev.value} value={ev.value}>{ev.icon} {ev.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>
              {TRIGGER_EVENTS.find(e => e.value === form.triggerEvent)?.desc}
            </div>
          </div>

          {/* Delay */}
          <div>
            <label style={css.lbl}>Send After</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input style={css.inp} type="number" min={0} value={form.delayDays}
                  onChange={e => set('delayDays', parseInt(e.target.value) || 0)}
                  placeholder="Days" />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>days</div>
              </div>
              <div style={{ flex: 1 }}>
                <input style={css.inp} type="number" min={0} max={23} value={form.delayHours}
                  onChange={e => set('delayHours', parseInt(e.target.value) || 0)}
                  placeholder="Hours" />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>hours</div>
              </div>
            </div>
          </div>

          {/* Channels */}
          <div>
            <label style={css.lbl}>Channels</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['email', 'whatsapp'] as const).map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderColor: form.channels.includes(ch)
                      ? ch === 'email' ? '#60A5FA' : '#25D366'
                      : 'rgba(255,255,255,0.1)',
                    background: form.channels.includes(ch)
                      ? ch === 'email' ? 'rgba(96,165,250,0.1)' : 'rgba(37,211,102,0.1)'
                      : 'transparent',
                    color: form.channels.includes(ch)
                      ? ch === 'email' ? '#60A5FA' : '#25D366'
                      : 'rgba(255,255,255,0.4)',
                  }}>
                  {ch === 'email' ? <Mail size={12} /> : <MessageCircle size={12} />}
                  {ch === 'email' ? 'Email' : 'WhatsApp'}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label style={css.lbl}>Repeat</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input style={css.inp} type="number" min={0} value={form.repeatEveryDays}
                  onChange={e => set('repeatEveryDays', parseInt(e.target.value) || 0)}
                  placeholder="0 = no repeat" />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>every N days (0=off)</div>
              </div>
              <div style={{ flex: 1 }}>
                <input style={css.inp} type="number" min={1} value={form.maxRepeats}
                  onChange={e => set('maxRepeats', parseInt(e.target.value) || 1)} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>max repeats</div>
              </div>
            </div>
          </div>

          {/* Stop on events */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={css.lbl}>Stop Sending When</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STOP_EVENTS.map(ev => (
                <button key={ev.value} onClick={() => toggleStopEvent(ev.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 7, border: '1px solid', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, fontFamily: 'Inter,sans-serif',
                    borderColor: form.stopOnEvents.includes(ev.value) ? '#2DD4BF' : 'rgba(255,255,255,0.1)',
                    background: form.stopOnEvents.includes(ev.value) ? 'rgba(45,212,191,0.1)' : 'transparent',
                    color: form.stopOnEvents.includes(ev.value) ? '#2DD4BF' : 'rgba(255,255,255,0.45)',
                  }}>
                  {form.stopOnEvents.includes(ev.value) && <CheckCircle2 size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                  {ev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available variables */}
          {vars.length > 0 && (
            <div style={{ gridColumn: '1/-1', padding: '10px 14px', background: 'rgba(45,212,191,0.05)', borderRadius: 8, border: '1px solid rgba(45,212,191,0.1)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2DD4BF', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>
                Available variables — click to insert
              </div>
              <VarChips vars={vars} onInsert={v => insertVar('messageEmailBody', v)} />
            </div>
          )}

          {/* Email fields — shown if email channel active */}
          {form.channels.includes('email') && (<>
            <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Mail size={13} color="#60A5FA" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Template</span>
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={css.lbl}>Subject</label>
              <VarChips vars={vars} onInsert={v => insertVar('messageEmailSubject', v)} />
              <input style={css.inp} value={form.messageEmailSubject}
                onChange={e => set('messageEmailSubject', e.target.value)}
                placeholder="e.g. Reminder: {{leads_count}} lead(s) waiting — {{school_name}}" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={css.lbl}>Body</label>
              <VarChips vars={vars} onInsert={v => insertVar('messageEmailBody', v)} />
              <textarea style={css.textarea} value={form.messageEmailBody}
                onChange={e => set('messageEmailBody', e.target.value)}
                placeholder="Write the email body text. Use {{variable}} placeholders." rows={6} />
            </div>
          </>)}

          {/* WhatsApp fields — shown if whatsapp channel active */}
          {form.channels.includes('whatsapp') && (<>
            <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <MessageCircle size={13} color="#25D366" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#25D366', fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WhatsApp Template</span>
              </div>
            </div>
            <div>
              <label style={css.lbl}>Meta Template Name</label>
              <input style={css.inp} value={form.waTemplateName}
                onChange={e => set('waTemplateName', e.target.value)}
                placeholder="e.g. lead_unlock_reminder" />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>
                Must be an approved template in Meta Business Manager
              </div>
            </div>
            <div>
              <label style={css.lbl}>Language Code</label>
              <select style={css.select} value={form.waTemplateLang} onChange={e => set('waTemplateLang', e.target.value)}>
                <option value="en">en — English</option>
                <option value="en_IN">en_IN — English (India)</option>
                <option value="hi">hi — Hindi</option>
                <option value="mr">mr — Marathi</option>
                <option value="gu">gu — Gujarati</option>
                <option value="ta">ta — Tamil</option>
                <option value="te">te — Telugu</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={css.lbl}>Preview / Reference Body</label>
              <VarChips vars={vars} onInsert={v => insertVar('messageWaBody', v)} />
              <textarea style={css.textarea} value={form.messageWaBody}
                onChange={e => set('messageWaBody', e.target.value)}
                placeholder="Reference text for the WhatsApp template. This matches the approved template body." rows={4} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>
                ⚠️ Must match your approved Meta template exactly. Variable order must be consistent.
              </div>
            </div>
          </>)}

          {/* Sort order */}
          <div>
            <label style={css.lbl}>Sort Order</label>
            <input style={{ ...css.inp, width: 100 }} type="number" value={form.sortOrder}
              onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
            <button onClick={() => set('isActive', !form.isActive)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: form.isActive ? '#2DD4BF' : 'rgba(255,255,255,0.3)' }}>
              {form.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
            </button>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif' }}>
              {form.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={css.btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ ...css.btn('#2DD4BF'), opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            {item.id ? 'Save Changes' : 'Create Reminder'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Logs Panel ───────────────────────────────────────────────────────────────
function LogsPanel({ scheduleId, onClose }: { scheduleId?: string; onClose: () => void }) {
  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ['reminder-logs', scheduleId],
    queryFn: () => {
      const url = scheduleId
        ? `/api/admin/reminders?action=logs&schedule_id=${scheduleId}`
        : `/api/admin/reminders?action=logs`
      return fetch(url, { headers: hdrs() }).then(r => r.json())
    },
    refetchInterval: 30_000,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...css.card, width: '100%', maxWidth: 720, maxHeight: '88vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif' }}>
            Execution Logs
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : !logs?.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>
            No logs yet. Reminders are processed every hour by the cron job.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logs.map((log: any) => (
              <div key={log.id} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: log.status === 'sent' ? '#2DD4BF' : '#EF4444' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'Inter,sans-serif' }}>
                    {log.schedule_name}
                    {log.school_name && <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>→ {log.school_name}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'Inter,sans-serif' }}>
                    {(() => { try { return JSON.parse(log.channels_sent).join(', ') } catch { return log.channels_sent } })()}
                    {log.error_message && <span style={{ color: '#EF4444', marginLeft: 6 }}>{log.error_message}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
                  {new Date(log.sent_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RemindersPage() {
  const queryClient = useQueryClient()
  const [modal,    setModal]    = useState<Partial<ReminderSchedule> | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const { data: schedules = [], isLoading } = useQuery<(ReminderSchedule & { id: string })[]>({
    queryKey: ['reminder-schedules'],
    queryFn: () => fetch('/api/admin/reminders', { headers: hdrs() }).then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (body: ReminderSchedule) =>
      fetch('/api/admin/reminders', { method: 'POST', headers: hdrs(), body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Reminder saved')
      setModal(null)
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] })
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/reminders?id=${id}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Deleted')
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch('/api/admin/reminders?action=toggle', { method: 'POST', headers: hdrs(), body: JSON.stringify({ id, isActive }) }).then(r => r.json()),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? 'Reminder activated' : 'Reminder paused')
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] })
    },
  })

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Delete this reminder schedule?')) return
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const activeCount  = schedules.filter(s => s.isActive).length
  const emailCount   = schedules.filter(s => s.channels.includes('email')).length
  const waCount      = schedules.filter(s => s.channels.includes('whatsapp')).length

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              Reminder Scheduler
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, fontFamily: 'Inter,sans-serif', margin: 0 }}>
              Automated reminders via Email &amp; WhatsApp. Cron runs every hour.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowLogs(true)} style={css.btnGhost}>
              <BarChart3 size={12} /> Logs
            </button>
            <button onClick={() => setModal({})} style={css.btn('#2DD4BF')}>
              <Plus size={13} /> New Reminder
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Schedules', value: schedules.length, icon: <Bell size={14} />, color: '#2DD4BF' },
            { label: 'Active',          value: activeCount,       icon: <Zap size={14} />,  color: '#FBBF24' },
            { label: 'Email',           value: emailCount,        icon: <Mail size={14} />, color: '#60A5FA' },
            { label: 'WhatsApp',        value: waCount,           icon: <MessageCircle size={14} />, color: '#25D366' },
          ].map(stat => (
            <div key={stat.label} style={{ ...css.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontFamily: 'Inter,sans-serif' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cron info banner */}
        <div style={{ ...css.card, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={13} color="#FBBF24" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter,sans-serif' }}>
            Cron job runs <strong style={{ color: '#FBBF24' }}>every hour</strong> at <code style={{ fontSize: 11, color: '#2DD4BF' }}>0 * * * *</code> via <code style={{ fontSize: 11, color: '#2DD4BF' }}>/api/cron/reminders</code>.
            Set <code style={{ fontSize: 11, color: '#2DD4BF' }}>CRON_SECRET</code> env variable to protect the endpoint.
          </span>
        </div>

        {/* Schedule list */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ ...css.card, padding: 48, textAlign: 'center' }}>
            <Bell size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter,sans-serif', marginBottom: 6 }}>No reminders configured</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, fontFamily: 'Inter,sans-serif' }}>Create your first automated reminder schedule</div>
            <button onClick={() => setModal({})} style={css.btn('#2DD4BF')}>
              <Plus size={12} /> Create Reminder
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schedules.map(s => (
              <ScheduleCard
                key={s.id}
                s={s}
                onEdit={item => setModal(item)}
                onDelete={handleDelete}
                onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <Modal
          item={modal}
          onClose={() => setModal(null)}
          onSave={s => saveMutation.mutate(s)}
          saving={saveMutation.isPending}
        />
      )}

      {/* Logs panel */}
      {showLogs && <LogsPanel onClose={() => setShowLogs(false)} />}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  )
}
