'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Bell, Send, Loader2, Users, School, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const TEMPLATES = [
  { label: 'New Feature Announcement', body: 'We have launched a new feature on Thynk Schooling! Check it out and let us know what you think.' },
  { label: 'Maintenance Notice',       body: 'Scheduled maintenance on Saturday 11 PM – 2 AM. The site may be briefly unavailable.' },
  { label: 'Welcome New Schools',      body: 'Welcome to Thynk Schooling! Your school profile is now live. Complete your profile to attract more parents.' },
  { label: 'Lead Expiry Reminder',     body: 'You have leads expiring in 7 days. Log in to your dashboard to review and unlock them.' },
]

const lbl: React.CSSProperties = { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '7px', fontFamily: 'DM Sans,sans-serif' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,.08)', borderRadius: '9px', color: 'var(--admin-text,rgba(255,255,255,0.9))', fontSize: '13px', fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState<'all' | 'parents' | 'schools'>('all')
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')

  const mutation = useMutation({
    mutationFn: () => fetch('/api/admin/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audience,title,body})}).then(r=>r.json()),
    onSuccess: () => {
      toast.success(`Notification sent to ${audience === 'all' ? 'all users' : audience}!`)
      setTitle(''); setBody('')
    },
    onError: () => toast.error('Failed to send notification'),
  })

  const AUDIENCE_OPTS = [
    { value: 'all',     icon: Globe,  label: 'All Users',     desc: 'Every parent and school admin',   color: '#60A5FA' },
    { value: 'parents', icon: Users,  label: 'Parents Only',  desc: 'All registered parent accounts',  color: '#4ADE80' },
    { value: 'schools', icon: School, label: 'Schools Only',  desc: 'All school admin accounts',        color: '#FF5C00' },
  ]

  return (
    <AdminLayout title="Notifications" subtitle="Send push notifications or in-app messages to users">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

        {/* Compose */}
        <div style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell style={{ width: '16px', height: '16px', color: '#FF5C00' }} /> Compose Notification
          </h3>

          {/* Audience */}
          <div style={{ marginBottom: '18px' }}>
            <label style={lbl}>Send To</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {AUDIENCE_OPTS.map(opt => {
                const Icon = opt.icon
                return (
                  <button key={opt.value} onClick={() => setAudience(opt.value as any)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: audience===opt.value ? `1.5px solid ${opt.color}` : '1px solid rgba(255,255,255,.08)', background: audience===opt.value ? `${opt.color}10` : 'rgba(255,255,255,.02)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                    <Icon style={{ width: '16px', height: '16px', color: opt.color, marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontFamily: 'DM Sans,sans-serif' }}>{opt.label}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif', marginTop: '2px' }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Notification Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0,80))}
              placeholder="e.g. New Feature Available!" style={inp} />
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', textAlign: 'right', marginTop: '3px', fontFamily: 'DM Sans,sans-serif' }}>{title.length}/80</div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Message Body *</label>
            <textarea value={body} onChange={e => setBody(e.target.value.slice(0,500))}
              placeholder="Write your message here..."
              rows={5}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', textAlign: 'right', marginTop: '3px', fontFamily: 'DM Sans,sans-serif' }}>{body.length}/500</div>
          </div>

          <button onClick={() => { if (!title || !body) { toast.error('Title and body required'); return } mutation.mutate() }}
            disabled={mutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FF5C00', color: 'var(--admin-text,rgba(255,255,255,0.9))', border: 'none', borderRadius: '9px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', opacity: mutation.isPending ? .7 : 1, boxShadow: '0 4px 14px rgba(255,92,0,.3)' }}>
            {mutation.isPending ? <><Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />Sending…</> : <><Send style={{ width: '15px', height: '15px' }} />Send Notification</>}
          </button>
        </div>

        {/* Templates + history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '14px' }}>Quick Templates</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => { setTitle(t.label); setBody(t.body) }}
                  style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', color: 'rgba(255,255,255,.6)', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', transition: 'all .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,92,0,.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.06)'}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '4px' }}>Preview</h4>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)', fontFamily: 'DM Sans,sans-serif', marginBottom: '14px' }}>How it will look on mobile</p>
            <div style={{ background: '#1A2233', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#FF5C00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell style={{ width: '16px', height: '16px', color: 'var(--admin-text,rgba(255,255,255,0.9))' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontFamily: 'DM Sans,sans-serif', marginBottom: '3px' }}>{title || 'Notification Title'}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{body || 'Your message will appear here...'}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', fontFamily: 'DM Sans,sans-serif', marginTop: '6px' }}>Thynk Schooling · just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
