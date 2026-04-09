'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  MessageCircle, Plus, Pencil, Trash2, Save, X, Loader2,
  Search, ToggleLeft, ToggleRight, Bot, Settings2, Download,
  ChevronRight, Eye, Hash, Zap, Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// ── Style tokens (mirrors existing admin pages) ───────────────────────────────
const V = {
  cardBg:  'var(--admin-card-bg, rgba(255,255,255,0.04))',
  border:  'var(--admin-border, rgba(255,255,255,0.07))',
  text:    'var(--admin-text, rgba(255,255,255,0.9))',
  muted:   'var(--admin-text-muted, rgba(255,255,255,0.45))',
  faint:   'var(--admin-text-faint, rgba(255,255,255,0.25))',
  accent:  '#FF5C00',
}
const card: React.CSSProperties = {
  background: V.cardBg, border: `1px solid ${V.border}`, borderRadius: 14,
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 9, color: V.text, fontSize: 13,
  fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px',
  textTransform: 'uppercase', color: V.muted, marginBottom: 6,
  fontFamily: 'DM Sans, sans-serif',
}
const cell: React.CSSProperties = {
  padding: '11px 14px', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
  color: V.text, borderBottom: `1px solid rgba(255,255,255,.05)`,
}
const hdCell: React.CSSProperties = {
  padding: '9px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
  textTransform: 'uppercase', color: V.muted, fontFamily: 'DM Sans, sans-serif',
  borderBottom: `1px solid ${V.border}`, background: 'rgba(255,255,255,.03)', whiteSpace: 'nowrap',
}

// ── API helpers ───────────────────────────────────────────────────────────────
function hdrs() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}
const apiFetch = (qs: string) => fetch(`/api/chatbot?${qs}`, { headers: hdrs() }).then(r => r.json())
const apiPost  = (action: string, body: any) =>
  fetch(`/api/chatbot?action=${action}`, { method: 'POST', headers: hdrs(), body: JSON.stringify(body) }).then(r => r.json())
const apiDel   = (action: string, id: string) =>
  fetch(`/api/chatbot?action=${action}&id=${id}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json())

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Bot Settings', 'FAQ Manager', 'Chat Logs'] as const
type Tab = typeof TABS[number]

// ── FAQ Modal ─────────────────────────────────────────────────────────────────
function FaqModal({ faq, onClose, onSave }: {
  faq?: any; onClose: () => void; onSave: (d: any) => void
}) {
  const [question, setQuestion] = useState(faq?.question || '')
  const [answer,   setAnswer]   = useState(faq?.answer   || '')
  const [keywords, setKeywords] = useState<string>(faq?.keywords?.join(', ') || '')
  const [active,   setActive]   = useState(faq?.is_active ?? true)

  const handleSave = () => {
    if (!question.trim() || !answer.trim() || !keywords.trim()) {
      toast.error('Question, answer and keywords are required.')
      return
    }
    const kw = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    onSave({ id: faq?.id, question, answer, keywords: kw, isActive: active })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }} onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:.95, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ position:'relative', width:'100%', maxWidth:540, background:'#0C1428', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:700, color:V.text, fontFamily:'Syne, sans-serif' }}>
            {faq ? 'Edit FAQ' : 'Add FAQ'}
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:V.muted, padding:4 }}>
            <X style={{ width:16, height:16 }} />
          </button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Question</label>
          <input style={inp} value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. What documents are required for admission?" />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Bot's Answer</label>
          <textarea style={{ ...inp, minHeight:100, resize:'vertical' as const, lineHeight:1.6 }}
            value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="Write the bot's reply here..." />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Trigger Keywords (comma-separated)</label>
          <input style={inp} value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="e.g. documents, papers, certificate, id proof" />
          <div style={{ fontSize:11, color:V.faint, marginTop:5, fontFamily:'DM Sans, sans-serif' }}>
            Bot matches these words when a user types a question.
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, padding:'10px 0', borderTop:`1px solid ${V.border}` }}>
          <span style={{ fontSize:13, color:V.muted, fontFamily:'DM Sans, sans-serif' }}>Active (show in bot)</span>
          <button onClick={() => setActive(!active)} style={{ background:'none', border:'none', cursor:'pointer', color: active ? '#4ADE80' : V.faint }}>
            {active ? <ToggleRight style={{ width:28, height:28 }} /> : <ToggleLeft style={{ width:28, height:28 }} />}
          </button>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSave}
            style={{ flex:1, padding:'10px', background:V.accent, color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Save style={{ width:14, height:14 }} /> {faq ? 'Update FAQ' : 'Add FAQ'}
          </button>
          <button onClick={onClose}
            style={{ padding:'10px 18px', background:'rgba(255,255,255,0.04)', color:V.muted, border:`1px solid ${V.border}`, borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Transcript Modal ──────────────────────────────────────────────────────────
function TranscriptModal({ session, onClose }: { session: any; onClose: () => void }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chatbot-messages', session.id],
    queryFn: () => apiFetch(`action=messages&sessionId=${session.id}`),
  })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }} onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:.95, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ position:'relative', width:'100%', maxWidth:520, maxHeight:'80vh', background:'#0C1428', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden', zIndex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:V.text, fontFamily:'Syne, sans-serif' }}>
              {session.user_name || 'Anonymous'}
            </div>
            <div style={{ fontSize:11, color:V.muted, fontFamily:'DM Sans, sans-serif' }}>
              {session.user_phone || '—'} · {session.user_email || '—'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:V.muted }}>
            <X style={{ width:16, height:16 }} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8, background:'#080f1c' }}>
          {isLoading
            ? <div style={{ color:V.muted, textAlign:'center', padding:24, fontSize:13 }}>Loading…</div>
            : (messages || []).map((m: any) => (
                <div key={m.id} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? V.accent : 'rgba(255,255,255,0.07)',
                  color: '#fff', padding:'9px 13px', borderRadius:10,
                  fontSize:13, fontFamily:'DM Sans, sans-serif', maxWidth:'80%', lineHeight:1.5,
                  borderBottomRightRadius: m.role === 'user' ? 3 : 10,
                  borderBottomLeftRadius: m.role === 'bot' ? 3 : 10,
                }}>
                  {m.content}
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:4 }}>
                    {new Date(m.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              ))
          }
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminChatbotPage() {
  const qc = useQueryClient()
  const [tab, setTab]             = useState<Tab>('Bot Settings')
  const [faqModal, setFaqModal]   = useState<any>(null) // null | {} | faq object
  const [viewSession, setViewSession] = useState<any>(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['chatbot-stats'],
    queryFn: () => apiFetch('action=stats'),
    staleTime: 60_000,
  })

  const { data: config, isLoading: cfgLoading } = useQuery({
    queryKey: ['chatbot-config'],
    queryFn: () => apiFetch('action=config'),
    staleTime: 30_000,
  })

  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['chatbot-faqs'],
    queryFn: () => apiFetch('action=faqs'),
    staleTime: 30_000,
    enabled: tab === 'FAQ Manager',
  })

  const params = new URLSearchParams({ action: 'sessions', page: String(page), limit: '20', search })
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatbot-sessions', page, search],
    queryFn: () => apiFetch(params.toString()),
    staleTime: 30_000,
    enabled: tab === 'Chat Logs',
  })

  // ── Local config state ───────────────────────────────────────────────────
  const [cfgLocal, setCfgLocal] = useState<Record<string, string>>({})
  useEffect(() => { if (config) setCfgLocal(config) }, [config])

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveCfg = useMutation({
    mutationFn: () => apiPost('config', { updates: cfgLocal }),
    onSuccess: () => { toast.success('Settings saved!'); qc.invalidateQueries({ queryKey: ['chatbot-config'] }) },
    onError: () => toast.error('Failed to save settings'),
  })

  const upsertFaq = useMutation({
    mutationFn: (d: any) => apiPost('faq-upsert', d),
    onSuccess: () => { toast.success(faqModal?.id ? 'FAQ updated!' : 'FAQ added!'); setFaqModal(null); qc.invalidateQueries({ queryKey: ['chatbot-faqs'] }) },
    onError: () => toast.error('Failed to save FAQ'),
  })

  const deleteFaq = useMutation({
    mutationFn: (id: string) => apiDel('faq', id),
    onSuccess: () => { toast.success('FAQ deleted'); qc.invalidateQueries({ queryKey: ['chatbot-faqs'] }) },
    onError: () => toast.error('Failed to delete FAQ'),
  })

  const deleteSession = useMutation({
    mutationFn: (id: string) => apiDel('session', id),
    onSuccess: () => { toast.success('Session deleted'); qc.invalidateQueries({ queryKey: ['chatbot-sessions'] }) },
    onError: () => toast.error('Failed to delete session'),
  })

  // ── CSV export ───────────────────────────────────────────────────────────
  function exportCSV() {
    const sessions = sessionsData?.data || []
    const header = ['Name', 'Phone', 'Email', 'Messages', 'Page', 'Date']
    const rows = sessions.map((s: any) => [
      s.user_name || '', s.user_phone || '', s.user_email || '',
      s.msg_count, s.page_url || '',
      new Date(s.started_at).toLocaleDateString('en-IN'),
    ])
    const csv = [header, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'chatbot_sessions.csv'
    a.click()
  }

  const sessions = sessionsData?.data || []
  const totalSessions = sessionsData?.total || 0

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Chats',   value: stats?.totalSessions   ?? '—', color: '#60A5FA' },
    { label: 'Leads Captured',value: stats?.identifiedLeads ?? '—', color: '#4ADE80' },
    { label: 'Today',         value: stats?.todaySessions   ?? '—', color: '#FBBF24' },
    { label: 'Active FAQs',   value: stats?.activeFaqs      ?? '—', color: V.accent  },
  ]

  return (
    <AdminLayout pageClass="admin-page-chatbot" title="AI Chatbot" subtitle="Configure bot, manage FAQs, view all chat sessions">

      <AnimatePresence>
        {faqModal !== null && (
          <FaqModal faq={faqModal?.id ? faqModal : undefined}
            onClose={() => setFaqModal(null)}
            onSave={d => upsertFaq.mutate(d)} />
        )}
        {viewSession && (
          <TranscriptModal session={viewSession} onClose={() => setViewSession(null)} />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * .06 }}
            style={{ ...card, padding:16 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:28, color:s.color, lineHeight:1, marginBottom:4 }}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </div>
            <div style={{ fontSize:11, color:V.muted, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'.08em' }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:`1px solid ${V.border}`, paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'9px 18px', borderRadius:'9px 9px 0 0', border:'none', cursor:'pointer', fontSize:12,
              fontWeight:600, fontFamily:'DM Sans,sans-serif',
              background: tab === t ? V.accent : 'transparent',
              color: tab === t ? '#fff' : V.muted,
              borderBottom: tab === t ? `2px solid ${V.accent}` : '2px solid transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── BOT SETTINGS ── */}
      {tab === 'Bot Settings' && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
          <div style={{ ...card, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <Settings2 style={{ width:16, height:16, color:V.accent }} />
              <span style={{ fontSize:14, fontWeight:700, color:V.text, fontFamily:'Syne,sans-serif' }}>Brand & Appearance</span>
            </div>
            {cfgLoading ? (
              <div style={{ color:V.muted, fontSize:13, textAlign:'center', padding:24 }}>Loading…</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { key:'bot_name',     label:'Bot Name',      placeholder:'Thynk Assistant' },
                  { key:'brand_color',  label:'Brand Color',   placeholder:'#FF5C00', type:'color' },
                  { key:'contact_phone',label:'Contact Phone', placeholder:'+91 88000 00000' },
                  { key:'contact_email',label:'Contact Email', placeholder:'hello@thynkschooling.in' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input style={f.type === 'color' ? { ...inp, height:42, padding:4, cursor:'pointer' } : inp}
                      type={f.type || 'text'}
                      value={cfgLocal[f.key] || ''}
                      onChange={e => setCfgLocal(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...card, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <MessageCircle style={{ width:16, height:16, color:V.accent }} />
              <span style={{ fontSize:14, fontWeight:700, color:V.text, fontFamily:'Syne,sans-serif' }}>Bot Messages</span>
            </div>
            {[
              { key:'greeting_message',  label:'Greeting Message',  hint:'First message when user opens chat.' },
              { key:'fallback_message',  label:'Fallback Message',  hint:'Shown when bot cannot match any FAQ.' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={lbl}>{f.label}</label>
                <textarea style={{ ...inp, minHeight:80, resize:'vertical' as const, lineHeight:1.6 }}
                  value={cfgLocal[f.key] || ''}
                  onChange={e => setCfgLocal(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.hint} />
                <div style={{ fontSize:11, color:V.faint, marginTop:4, fontFamily:'DM Sans,sans-serif' }}>{f.hint}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', ...card, padding:'14px 20px' }}>
            <div>
              <div style={{ fontSize:14, color:V.text, fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>Chat Widget Enabled</div>
              <div style={{ fontSize:12, color:V.muted, marginTop:2, fontFamily:'DM Sans,sans-serif' }}>Turn off to hide the chatbot from your website</div>
            </div>
            <button onClick={() => setCfgLocal(p => ({ ...p, bot_enabled: p.bot_enabled === 'false' ? 'true' : 'false' }))}
              style={{ background:'none', border:'none', cursor:'pointer', color: cfgLocal.bot_enabled !== 'false' ? '#4ADE80' : V.faint }}>
              {cfgLocal.bot_enabled !== 'false'
                ? <ToggleRight style={{ width:32, height:32 }} />
                : <ToggleLeft  style={{ width:32, height:32 }} />}
            </button>
          </div>

          <button onClick={() => saveCfg.mutate()} disabled={saveCfg.isPending}
            style={{ marginTop:16, display:'flex', alignItems:'center', gap:7, padding:'11px 22px', background:V.accent, color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {saveCfg.isPending ? <Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> : <Save style={{ width:14, height:14 }} />}
            Save Settings
          </button>
        </motion.div>
      )}

      {/* ── FAQ MANAGER ── */}
      {tab === 'FAQ Manager' && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:13, color:V.muted, fontFamily:'DM Sans,sans-serif' }}>
              {(faqs || []).length} FAQ entries · bot answers parents automatically
            </div>
            <button onClick={() => setFaqModal({})}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:V.accent, color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              <Plus style={{ width:14, height:14 }} /> Add FAQ
            </button>
          </div>

          <div style={{ ...card, overflow:'hidden' }}>
            {faqsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding:'14px 16px', borderBottom:`1px solid ${V.border}` }}>
                  <div style={{ height:16, background:'rgba(255,255,255,0.04)', borderRadius:6, marginBottom:8, width:'60%' }} />
                  <div style={{ height:12, background:'rgba(255,255,255,0.03)', borderRadius:6, width:'90%' }} />
                </div>
              ))
            ) : (faqs || []).length === 0 ? (
              <div style={{ textAlign:'center', padding:48, color:V.faint, fontSize:13, fontFamily:'DM Sans,sans-serif' }}>
                No FAQs yet. Add your first one.
              </div>
            ) : (faqs || []).map((f: any, i: number) => (
              <motion.div key={f.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                style={{ padding:'14px 18px', borderBottom:`1px solid rgba(255,255,255,.04)`, display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,92,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <Hash style={{ width:12, height:12, color:V.accent }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:V.text, fontFamily:'DM Sans,sans-serif', marginBottom:4 }}>{f.question}</div>
                  <div style={{ fontSize:12, color:V.muted, fontFamily:'DM Sans,sans-serif', lineHeight:1.5, marginBottom:6,
                    overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
                    {f.answer}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {(f.keywords || []).slice(0, 6).map((kw: string) => (
                      <span key={kw} style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(255,92,0,0.1)', color:V.accent, fontFamily:'DM Sans,sans-serif' }}>
                        {kw}
                      </span>
                    ))}
                    {!f.is_active && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(239,68,68,0.1)', color:'#F87171', fontFamily:'DM Sans,sans-serif' }}>Inactive</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button onClick={() => setFaqModal(f)}
                    style={{ padding:'5px 10px', borderRadius:7, background:'rgba(96,165,250,0.1)', color:'#60A5FA', border:'none', cursor:'pointer', fontSize:11, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
                    <Pencil style={{ width:11, height:11 }} /> Edit
                  </button>
                  <button onClick={() => { if (confirm('Delete this FAQ?')) deleteFaq.mutate(f.id) }}
                    style={{ padding:'5px 10px', borderRadius:7, background:'rgba(239,68,68,0.1)', color:'#F87171', border:'none', cursor:'pointer', fontSize:11, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
                    <Trash2 style={{ width:11, height:11 }} /> Del
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── CHAT LOGS ── */}
      {tab === 'Chat Logs' && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:200, background:V.cardBg, border:`1px solid ${V.border}`, borderRadius:8, padding:'7px 11px' }}>
              <Search style={{ width:13, height:13, color:'rgba(255,255,255,.3)', flexShrink:0 }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name, phone or email..."
                style={{ background:'none', border:'none', outline:'none', fontSize:12, fontFamily:'DM Sans,sans-serif', color:V.text, flex:1 }} />
            </div>
            <button onClick={exportCSV}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:V.cardBg, border:`1px solid ${V.border}`, color:V.muted, cursor:'pointer', fontSize:11, fontFamily:'DM Sans,sans-serif' }}>
              <Download style={{ width:12, height:12 }} /> Export CSV
            </button>
          </div>

          <div style={{ ...card, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['#','Name','Phone','Email','Msgs','Started','Actions'].map(h => <th key={h} style={hdCell}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sessionsLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} style={{ padding:'10px 14px' }}>
                          <div style={{ height:32, background:'rgba(255,255,255,0.03)', borderRadius:6 }} />
                        </td></tr>
                      ))
                    : sessions.length === 0
                      ? <tr><td colSpan={7} style={{ ...cell, textAlign:'center', padding:48, color:'rgba(255,255,255,.2)' }}>No chat sessions found.</td></tr>
                      : sessions.map((s: any, i: number) => (
                          <tr key={s.id}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                            <td style={{ ...cell, color:'rgba(255,255,255,.25)' }}>{(page - 1) * 20 + i + 1}</td>
                            <td style={cell}>
                              <div style={{ fontWeight:600 }}>{s.user_name || <em style={{ color:'rgba(255,255,255,.25)', fontStyle:'italic' }}>Anonymous</em>}</div>
                            </td>
                            <td style={cell}>{s.user_phone || <span style={{ color:'rgba(255,255,255,.2)' }}>—</span>}</td>
                            <td style={{ ...cell, color:'rgba(255,255,255,.45)', fontSize:11 }}>{s.user_email || '—'}</td>
                            <td style={cell}>
                              <span style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:100, background:'rgba(96,165,250,.1)', color:'#60A5FA' }}>
                                {s.msg_count} msgs
                              </span>
                            </td>
                            <td style={{ ...cell, fontSize:11, color:'rgba(255,255,255,.35)', whiteSpace:'nowrap' }}>
                              {new Date(s.started_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}
                              {' · '}
                              {new Date(s.started_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </td>
                            <td style={cell}>
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={() => setViewSession(s)}
                                  style={{ padding:'4px 10px', borderRadius:7, background:'rgba(96,165,250,0.1)', color:'#60A5FA', border:'none', cursor:'pointer', fontSize:11, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
                                  <Eye style={{ width:11, height:11 }} /> View
                                </button>
                                <button onClick={() => { if (confirm('Delete this session?')) deleteSession.mutate(s.id) }}
                                  style={{ padding:'4px 8px', borderRadius:7, background:'rgba(239,68,68,0.08)', color:'#F87171', border:'none', cursor:'pointer', fontSize:11 }}>
                                  <Trash2 style={{ width:11, height:11 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                  }
                </tbody>
              </table>
            </div>

            {totalSessions > 20 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderTop:`1px solid rgba(255,255,255,.05)` }}>
                <span style={{ fontSize:11, color:V.faint, fontFamily:'DM Sans,sans-serif' }}>
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, totalSessions)} of {totalSessions}
                </span>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding:'6px 13px', borderRadius:7, background:V.cardBg, border:`1px solid ${V.border}`, color:V.muted, cursor:'pointer', fontSize:11, opacity: page === 1 ? .4 : 1 }}>
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= totalSessions}
                    style={{ padding:'6px 13px', borderRadius:7, background:V.cardBg, border:`1px solid ${V.border}`, color:V.muted, cursor:'pointer', fontSize:11, opacity: page * 20 >= totalSessions ? .4 : 1 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

    </AdminLayout>
  )
}
