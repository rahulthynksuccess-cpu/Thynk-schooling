'use client'
import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Star, BadgeCheck, Heart, Share2, GitCompare,
  ArrowRight, GraduationCap, BookOpen, Users, Calendar,
  Award, Building2, BookOpenCheck, Mic, X, CheckCircle2,
  Sparkles, PhoneCall,
} from 'lucide-react'
import { School, Review } from '@/types'

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg:       '#F8F4EE',
  cream:    '#EFE9DF',
  white:    '#FFFFFF',
  ink:      '#0C0F14',
  inkMid:   '#3D4452',
  inkMuted: '#727D8F',
  inkFaint: '#A8B0BC',
  gold:     '#A8720A',
  goldVib:  '#C9890E',
  goldPale: '#FBF3E3',
  goldBdr:  'rgba(168,114,10,0.22)',
  green:    '#166534',
  border:   'rgba(12,15,20,0.08)',
  shadow:   '0 2px 24px rgba(12,15,20,0.07)',
  shadowMd: '0 8px 40px rgba(12,15,20,0.11)',
  shadowLg: '0 20px 60px rgba(12,15,20,0.14)',
}

/* ─── Label formatter ────────────────────────────────────────────────────── */
function fmt(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace('Co Educational Boys Girls', 'Co-Educational')
    .replace('Co Educational', 'Co-Educational')
    .replace('Cbse', 'CBSE').replace('Icse', 'ICSE')
    .replace('Ib ', 'IB ').replace('K12', 'K–12')
}

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] as any },
})

/* ─── Tag pill ───────────────────────────────────────────────────────────── */
function Pill({ label, variant = 'default' }: { label: string; variant?: 'default' | 'gold' | 'green' | 'blue' | 'purple' }) {
  const s: Record<string, React.CSSProperties> = {
    default: { background: T.cream,    color: T.inkMid,  border: `1px solid ${T.border}` },
    gold:    { background: T.goldPale, color: T.gold,    border: `1px solid ${T.goldBdr}` },
    green:   { background: 'rgba(22,101,52,0.07)',  color: T.green,  border: '1px solid rgba(22,101,52,0.18)' },
    blue:    { background: 'rgba(29,78,216,0.06)',  color: '#1d4ed8',border: '1px solid rgba(29,78,216,0.15)' },
    purple:  { background: 'rgba(109,40,217,0.06)', color: '#6d28d9',border: '1px solid rgba(109,40,217,0.15)' },
  }
  return (
    <motion.span whileHover={{ scale: 1.03 }} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 14px', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'default', ...s[variant] }}>
      {label}
    </motion.span>
  )
}

/* ─── Sidebar fact row ───────────────────────────────────────────────────── */
function FactRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMuted }}>
        <Icon style={{ width: 13, height: 13, color: T.goldVib }} /> {label}
      </span>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: T.ink }}>{value}</span>
    </div>
  )
}

/* ─── Overview detail card ───────────────────────────────────────────────── */
function DetailCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <motion.div whileHover={{ y: -3, boxShadow: T.shadowMd }} transition={{ duration: 0.2 }}
      style={{ background: accent ? `linear-gradient(135deg,${T.goldPale},rgba(251,243,227,0.4))` : T.white, border: `1.5px solid ${accent ? T.goldBdr : T.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: T.shadow, cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accent ? T.goldPale : T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color: accent ? T.goldVib : T.inkFaint }} />
        </div>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: accent ? T.gold : T.inkFaint }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: accent ? T.goldVib : T.ink, lineHeight: 1.1 }}>{value}</div>
    </motion.div>
  )
}

/* ─── Review card ────────────────────────────────────────────────────────── */
function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = (review.parentName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const rating = Number(review.rating) || 0
  return (
    <motion.div {...fadeUp(i * 0.06)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: T.shadow }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${T.goldPale},rgba(201,137,14,0.15))`, border: `1px solid ${T.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.goldVib, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: T.ink }}>{review.parentName}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.goldPale, border: `1px solid ${T.goldBdr}`, padding: '5px 10px', borderRadius: 99, flexShrink: 0 }}>
          {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 10, height: 10, fill: s <= rating ? T.goldVib : 'none', color: s <= rating ? T.goldVib : '#D0D5DB' }} />)}
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.goldVib, marginLeft: 4 }}>{rating}.0</span>
        </div>
      </div>
      {review.title && <h4 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 19, color: T.ink, marginBottom: 7 }}>{review.title}</h4>}
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.8, fontWeight: 300 }}>{review.body}</p>
      {review.schoolReply && (
        <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: T.goldPale, border: `1px solid ${T.goldBdr}` }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 5 }}>School Response</div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, lineHeight: 1.65, fontWeight: 300 }}>{review.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Request Call Modal ─────────────────────────────────────────────────── */
function CallModal({ school, onClose, onSuccess }: { school: School; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [classFor, setClassFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { setError('Name and phone are required'); return }
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) { setError('Enter a valid 10-digit number'); return }
    setLoading(true); setError('')
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, action: 'request_call', parentName: name, phone, childName, classApplyingFor: classFor, source: 'request_call' }) })
      onSuccess(); onClose()
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${T.border}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.ink, outline: 'none', background: T.bg, boxSizing: 'border-box' as const, transition: 'border-color 0.15s' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(12,15,20,0.65)', backdropFilter: 'blur(12px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.88, y: 32, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: T.white, borderRadius: 28, padding: '44px 40px', width: '100%', maxWidth: 460, boxShadow: T.shadowLg, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '28px 28px 0 0', background: `linear-gradient(90deg,transparent,${T.goldVib},#E8C547,${T.goldVib},transparent)` }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: T.cream, border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X style={{ width: 14, height: 14, color: T.inkMuted }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: T.goldPale, border: `1.5px solid ${T.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall style={{ width: 22, height: 22, color: T.goldVib }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: T.ink, marginBottom: 3 }}>Request a Call Back</h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMuted, fontWeight: 300 }}>{school.name} will call you within 24 hours</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Your Name *', val: name, set: setName, ph: 'Full name', type: 'text' },
            { label: 'Mobile Number *', val: phone, set: setPhone, ph: '10-digit mobile', type: 'tel' },
            { label: "Child's Name", val: childName, set: setChildName, ph: 'Optional', type: 'text' },
            { label: 'Applying for Class', val: classFor, set: setClassFor, ph: 'e.g. Grade 5, Nursery', type: 'text' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: T.inkFaint, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = T.goldVib)}
                onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
            </div>
          ))}
        </div>
        {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#B91C1C' }}>{error}</div>}
        <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={loading}
          style={{ marginTop: 22, width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: loading ? T.cream : `linear-gradient(135deg,${T.goldVib},${T.gold})`, color: loading ? T.inkMuted : '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 28px rgba(168,114,10,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <PhoneCall style={{ width: 16, height: 16 }} /> {loading ? 'Submitting…' : 'Request Call Back'}
        </motion.button>
        <p style={{ marginTop: 14, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkFaint, textAlign: 'center', lineHeight: 1.6 }}>🔒 Your info is shared only with this school</p>
      </motion.div>
    </motion.div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  const p = { animation: 'skP 1.6s ease-in-out infinite', background: `linear-gradient(90deg,${T.cream} 25%,#e8e2d8 50%,${T.cream} 75%)`, backgroundSize: '400% 100%' } as React.CSSProperties
  return (
    <>
      <style>{`@keyframes skP{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <div style={{ background: T.bg }}>
        <div style={{ ...p, height: 360 }} />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'flex', gap: 24, marginTop: -64, marginBottom: 48 }}>
            <div style={{ ...p, width: 120, height: 120, borderRadius: 24, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingTop: 72 }}>
              <div style={{ ...p, height: 36, width: '38%', marginBottom: 14, borderRadius: 8 }} />
              <div style={{ ...p, height: 14, width: '22%', borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 48 }}>
            <div><div style={{ ...p, height: 52, borderRadius: 14, marginBottom: 32 }} /><div style={{ ...p, height: 220, borderRadius: 20 }} /></div>
            <div style={{ ...p, height: 500, borderRadius: 24 }} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, 70])

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.school ?? d),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', slug],
    queryFn: () => fetch(`/api/schools/${slug}/reviews?limit=6`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { data: [], total: 0 }).catch(() => ({ data: [], total: 0 })),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  const createLead = useCallback(async (source: string, schoolId: string) => {
    try { await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, action: 'create_lead', source }) }) } catch {}
  }, [])

  const handleShare = () => { navigator.clipboard?.writeText(window.location.href); setShowShare(true); setTimeout(() => setShowShare(false), 2500) }
  const handleSave = () => { if (!saved && school) createLead('save', school.id); setSaved(!saved); if (!saved) setToast('School saved to wishlist!') }

  if (isLoading) return <Skeleton />
  if (!school) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: T.bg }}>
      <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} style={{ fontSize: 72 }}>🏫</motion.div>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding: '13px 32px', borderRadius: 14, background: T.ink, color: '#fff', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Browse Schools</Link>
    </div>
  )

  const reviewList = reviews?.data ?? []
  const rating = Number(school.avgRating) || 0
  const boards = school.board || []

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    .sptab{padding:10px 22px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;white-space:nowrap;transition:all .22s;flex-shrink:0}
    .sptab-on{background:${T.ink};color:#fff;box-shadow:0 4px 16px rgba(12,15,20,0.22)}
    .sptab-off{background:transparent;color:${T.inkMuted}}
    .sptab-off:hover{background:${T.cream};color:${T.ink}}
    .spbtn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;width:100%;border:none}
    .spbtn-primary{background:linear-gradient(135deg,${T.goldVib},${T.gold});color:#fff;box-shadow:0 8px 28px rgba(168,114,10,0.36)}
    .spbtn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(168,114,10,0.45)}
    .spbtn-outline{border:1.5px solid ${T.goldBdr}!important;background:${T.goldPale};color:${T.goldVib}}
    .spbtn-outline:hover{background:rgba(201,137,14,0.12)}
    .spbtn-ghost{border:1.5px solid ${T.border}!important;background:transparent;color:${T.inkMuted}}
    .spbtn-ghost:hover{border-color:${T.ink}!important;color:${T.ink};background:${T.cream}}
    @keyframes skP{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  `

  return (
    <div style={{ background: T.bg, paddingBottom: 120 }}>
      <style>{CSS}</style>

      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0, y: 14, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 10, x: '-50%' }}
            style={{ position: 'fixed', bottom: 28, left: '50%', zIndex: 500, background: T.ink, color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: T.shadowLg, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#4ADE80' }} /> Link copied!
            <button onClick={() => setShowShare(false)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '3px 7px', color: '#fff', display: 'flex', alignItems: 'center' }}><X style={{ width: 11, height: 11 }} /></button>
          </motion.div>
        )}
        {toast && (
          <motion.div key={toast} initial={{ opacity: 0, y: 14, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2500)}
            style={{ position: 'fixed', bottom: 28, left: '50%', zIndex: 500, background: '#166534', color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: T.shadowLg, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#86EFAC' }} /> {toast}
          </motion.div>
        )}
        {showCallModal && <CallModal school={school} onClose={() => setShowCallModal(false)} onSuccess={() => setToast('The school will call you soon!')} />}
      </AnimatePresence>

      {/* ══ HERO ══ */}
      <div ref={heroRef} style={{ position: 'relative', height: 'clamp(300px,40vw,440px)', overflow: 'hidden', background: 'linear-gradient(155deg,#06080f 0%,#0d1829 50%,#0e1f38 100%)' }}>
        <motion.div style={{ y: heroY, position: 'absolute', inset: '-15% 0', willChange: 'transform' }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt="" style={{ width: '100%', height: '115%', objectFit: 'cover', filter: 'brightness(0.4) saturate(0.75)' }} />
            : <>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                  {[280,440,600,760].map((s,i) => (
                    <motion.div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', top: -s/2, left: -s/2, border: `1px solid rgba(168,114,10,${0.16-i*0.03})` }}
                      animate={{ scale: [1,1.04,1], opacity: [0.5,1,0.5] }} transition={{ duration: 3+i, delay: i*0.5, repeat: Infinity, ease: 'easeInOut' }} />
                  ))}
                </div>
                {[{x:15,y:20,r:3},{x:75,y:35,r:2},{x:30,y:70,r:4},{x:85,y:60,r:2.5},{x:50,y:80,r:3.5},{x:8,y:55,r:2}].map((o,i) => (
                  <motion.div key={i} style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, width: o.r*2, height: o.r*2, borderRadius: '50%', background: 'rgba(168,114,10,0.5)' }}
                    animate={{ y: [-10,10,-10], opacity: [0.3,0.8,0.3] }} transition={{ duration: 3+i*0.7, repeat: Infinity, ease: 'easeInOut' }} />
                ))}
              </>
          }
        </motion.div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(6,8,15,0.97) 0%,rgba(6,8,15,0.5) 45%,rgba(6,8,15,0.1) 80%,transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,8,15,0.55) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 100%,rgba(168,114,10,0.15) 0%,transparent 65%)', pointerEvents: 'none' }} />

        {/* Action pills */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
          {[{label: saved ? 'Saved' : 'Save', icon: Heart, onClick: handleSave, active: saved},{label:'Share',icon: Share2,onClick: handleShare,active:false}].map((a,i)=>(
            <motion.button key={i} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }} onClick={a.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', background: a.active ? 'rgba(168,114,10,0.42)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <a.icon style={{ width: 13, height: 13, fill: (i===0&&saved)?'#fff':'transparent', color: '#fff' }} />{a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}>
            <Link href={`/compare?add=${school.id}`} onClick={() => createLead('compare', school.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(168,114,10,0.4)', background: 'rgba(168,114,10,0.22)', backdropFilter: 'blur(20px)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <GitCompare style={{ width: 13, height: 13 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px,5vw,60px)', paddingTop: 0, paddingBottom: 32, zIndex: 5 }}>
          <motion.div {...fadeUp(0.08)} style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            {school.isVerified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(22,101,52,0.85)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: "'DM Sans',sans-serif" }}><BadgeCheck style={{ width: 11, height: 11 }} /> Verified</span>}
            {school.isFeatured && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(168,114,10,0.88)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: "'DM Sans',sans-serif" }}><Sparkles style={{ width: 10, height: 10 }} /> Featured</span>}
            {boards.slice(0,3).map(b => <span key={b} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: "'DM Sans',sans-serif" }}>{b}</span>)}
          </motion.div>
          <motion.h1 {...fadeUp(0.14)} style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 'clamp(26px,4.5vw,52px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.025em', marginBottom: 16, textShadow: '0 3px 24px rgba(0,0,0,0.4)' }}>
            {school.name}
          </motion.h1>
          <motion.div {...fadeUp(0.2)} style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {school.city && <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}><MapPin style={{ width: 10, height: 10 }} />{school.city}{school.state?`,${school.state}`:''}</span>}
            {school.foundingYear && <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}><Calendar style={{ width: 10, height: 10 }} /> Est. {school.foundingYear}</span>}
            {boards[0] && <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(168,114,10,0.28)', backdropFilter: 'blur(10px)', border: '1px solid rgba(168,114,10,0.4)', color: '#FFD97D', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}><BookOpenCheck style={{ width: 10, height: 10 }} />{boards.join(' · ')}</span>}
            {rating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(168,114,10,0.28)', backdropFilter: 'blur(10px)', border: '1px solid rgba(168,114,10,0.4)', color: '#FFD97D', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}><Star style={{ width: 10, height: 10, fill: '#FFD97D' }} />{rating.toFixed(1)} ({school.totalReviews||0})</span>}
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right,transparent,rgba(168,114,10,0.5),transparent)' }} />
      </div>

      {/* ══ CONTENT ══ */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(20px,4vw,60px)' }}>

        {/* Profile header row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -60, marginBottom: 40, flexWrap: 'wrap' }}>
          <motion.div initial={{ opacity: 0, scale: 0.6, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
            style={{ width: 116, height: 116, borderRadius: 26, background: T.white, border: `4px solid ${T.bg}`, boxShadow: T.shadowLg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${T.goldPale},rgba(201,137,14,0.12))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap style={{ width: 46, height: 46, color: T.goldVib }} /></div>
            }
          </motion.div>
          <motion.div {...fadeUp(0.1)} style={{ flex: 1, minWidth: 0, paddingBottom: 8 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 'clamp(24px,3vw,42px)', color: T.ink, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 12 }}>{school.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {school.city && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMuted }}><MapPin style={{ width: 12, height: 12, color: T.goldVib, flexShrink: 0 }} />{school.addressLine1?`${school.addressLine1}, `:''}{school.city}{school.state?`, ${school.state}`:''}</span>}
              {boards.length > 0 && <Pill label={boards.join(' · ')} variant="gold" />}
              {school.foundingYear && <Pill label={`Est. ${school.foundingYear}`} />}
              {rating > 0 && (
                <motion.div whileHover={{ scale: 1.04 }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: T.goldPale, border: `1px solid ${T.goldBdr}`, cursor: 'default' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 11, height: 11, fill: s<=Math.round(rating)?T.goldVib:'none', color: s<=Math.round(rating)?T.goldVib:'#D0D5DB' }} />)}
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, color: T.goldVib, marginLeft: 3 }}>{rating.toFixed(1)}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkFaint }}>({school.totalReviews||0})</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Two column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,27vw,360px)', gap: 48, alignItems: 'start' }}>

          {/* LEFT */}
          <motion.div {...fadeUp(0.18)}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(12,15,20,0.04)', borderRadius: 18, padding: 5, border: `1px solid ${T.border}`, marginBottom: 38, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`sptab ${activeTab===tab?'sptab-on':'sptab-off'}`}>{tab}</button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* OVERVIEW */}
              {activeTab === 'Overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                  {school.description && (
                    <motion.div {...fadeUp(0)} style={{ marginBottom: 36, padding: '28px 32px', background: `linear-gradient(135deg,${T.goldPale},rgba(251,243,227,0.3))`, border: `1px solid ${T.goldBdr}`, borderRadius: 22, boxShadow: '0 4px 20px rgba(168,114,10,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom,${T.goldVib},#E8C547)`, flexShrink: 0 }} />
                        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 26, color: T.ink }}>About {school.name}</h2>
                      </div>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: T.inkMid, lineHeight: 1.9, fontWeight: 300 }}>{school.description}</p>
                    </motion.div>
                  )}

                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom,${T.goldVib},#E8C547)`, flexShrink: 0 }} />
                      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: T.ink }}>School Details</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
                      {boards.length > 0 && (
                        <motion.div whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(168,114,10,0.2)' }} transition={{ duration: 0.2 }}
                          style={{ background: `linear-gradient(135deg,${T.goldPale},rgba(251,243,227,0.5))`, border: `1.5px solid ${T.goldBdr}`, borderRadius: 18, padding: '20px 22px', boxShadow: '0 4px 16px rgba(168,114,10,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(168,114,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpenCheck style={{ width: 15, height: 15, color: T.goldVib }} /></div>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: T.gold }}>Board</span>
                          </div>
                          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 19, color: T.goldVib, lineHeight: 1.2 }}>{boards.join(', ')}</div>
                        </motion.div>
                      )}
                      {school.foundingYear && <DetailCard icon={Calendar} label="Founded" value={`${school.foundingYear} · ${new Date().getFullYear()-school.foundingYear}yr`} />}
                      <DetailCard icon={Building2}     label="School Type"     value={fmt(school.schoolType)} />
                      <DetailCard icon={Users}         label="Gender Policy"   value={fmt(school.genderPolicy)} />
                      <DetailCard icon={Mic}           label="Medium"          value={fmt(school.mediumOfInstruction)} />
                      <DetailCard icon={GraduationCap} label="Classes"         value={school.classesFrom&&school.classesTo?`${fmt(school.classesFrom)} – ${fmt(school.classesTo)}`:null} />
                      <DetailCard icon={Award}         label="Recognition"     value={school.recognition} />
                      <DetailCard icon={Users}         label="Students"        value={school.totalStudents?.toLocaleString()} />
                      <DetailCard icon={BookOpen}      label="Teacher Ratio"   value={school.studentTeacherRatio} />
                    </div>
                  </div>

                  {[
                    { label:'Facilities & Infrastructure', items: school.facilities as string[], v:'gold' as const,   emoji:'🏗️' },
                    { label:'Sports',                      items: school.sports as string[],     v:'green' as const,  emoji:'⚽' },
                    { label:'Extracurricular',             items: school.extraCurricular as string[], v:'purple' as const, emoji:'🎭' },
                    { label:'Languages Offered',           items: school.languagesOffered as string[], v:'blue' as const, emoji:'🗣️' },
                  ].filter(g => g.items?.length > 0).map((g, gi) => (
                    <motion.div key={g.label} {...fadeUp(gi*0.06)} style={{ marginBottom: 22, padding: '22px 26px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: T.shadow }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: T.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}><span>{g.emoji}</span>{g.label}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {g.items.slice(0,12).map(item => <Pill key={item} label={item} variant={g.v} />)}
                        {g.items.length > 12 && <Pill label={`+${g.items.length-12} more`} />}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* FACILITIES */}
              {activeTab === 'Facilities' && (
                <motion.div key="fa" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    { title:'Facilities & Infrastructure', items: school.facilities as string[], v:'gold' as const,   emoji:'🏗️' },
                    { title:'Sports',                      items: school.sports as string[],     v:'green' as const,  emoji:'⚽' },
                    { title:'Extra Curricular',            items: school.extraCurricular as string[], v:'purple' as const, emoji:'🎭' },
                    { title:'Languages',                   items: school.languagesOffered as string[], v:'blue' as const, emoji:'🗣️' },
                  ].filter(g => g.items?.length > 0).map((g, i) => (
                    <motion.div key={g.title} {...fadeUp(i*0.07)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 22, padding: '26px 30px', boxShadow: T.shadow }}>
                      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.ink, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}><span>{g.emoji}</span>{g.title}</h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{g.items.map(item => <Pill key={item} label={item} variant={g.v} />)}</div>
                    </motion.div>
                  ))}
                  {!school.facilities?.length && !school.sports?.length && !school.extraCurricular?.length && !school.languagesOffered?.length && (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'DM Sans',sans-serif", color: T.inkFaint }}><div style={{ fontSize: 52, marginBottom: 12 }}>🏗️</div>No facility info yet.</div>
                  )}
                </motion.div>
              )}

              {/* FEES */}
              {activeTab === 'Fees' && (
                <motion.div key="fe" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label:'Monthly Fee From', value: school.monthlyFeeMin ? `₹${school.monthlyFeeMin.toLocaleString()}`:null, emoji:'📅' },
                      { label:'Monthly Fee To',   value: school.monthlyFeeMax ? `₹${school.monthlyFeeMax.toLocaleString()}`:null, emoji:'📈' },
                      { label:'Annual Fee',        value: school.annualFee    ? `₹${school.annualFee.toLocaleString()}`:null,    emoji:'📋' },
                    ].filter(f=>f.value).map((f,i) => (
                      <motion.div key={f.label} {...fadeUp(i*0.07)} whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(168,114,10,0.18)' }}
                        style={{ background: `linear-gradient(135deg,${T.goldPale},rgba(251,243,227,0.4))`, border: `1.5px solid ${T.goldBdr}`, borderRadius: 22, padding: '32px 26px', textAlign: 'center', boxShadow: '0 4px 20px rgba(168,114,10,0.1)' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 10 }}>{f.label}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 38, color: T.goldVib }}>{f.value}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ background: T.goldPale, border: `1px solid ${T.goldBdr}`, borderRadius: 14, padding: '14px 18px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, lineHeight: 1.65, fontWeight: 300 }}>
                    ℹ️ Fees are approximate. Contact school for the exact current schedule.
                  </div>
                </motion.div>
              )}

              {/* ADMISSION */}
              {activeTab === 'Admission' && (
                <motion.div key="ad" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 30, color: T.ink, marginBottom: 28 }}>Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label:'Academic Year', value: school.admissionInfo.academicYear },
                        { label:'Status', value: school.admissionInfo.admissionOpen ? '🟢 Currently Open' : '🔴 Currently Closed' },
                        school.admissionInfo.lastDate ? { label:'Last Date', value: school.admissionInfo.lastDate } : null,
                      ].filter(Boolean).map((row:any) => (
                        <div key={row.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: T.shadow }}>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: T.inkMuted }}>{row.label}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.ink }}>{row.value}</span>
                        </div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length > 0 && (
                        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px 28px', marginTop: 8, boxShadow: T.shadow }}>
                          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 21, color: T.ink, marginBottom: 16 }}>Documents Required</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {school.admissionInfo.documentsRequired.map((doc:string) => (
                              <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.inkMid }}><CheckCircle2 style={{ width: 15, height: 15, color: T.goldVib, flexShrink: 0 }} />{doc}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily: "'DM Sans',sans-serif", color: T.inkFaint, textAlign: 'center', padding: 72 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {/* REVIEWS */}
              {activeTab === 'Reviews' && (
                <motion.div key="re" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                  <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 22, padding: '28px 32px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap', boxShadow: T.shadow }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 80, color: T.goldVib, lineHeight: 1 }}>{rating.toFixed(1)}</div>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8 }}>{[1,2,3,4,5].map(s=><Star key={s} style={{ width:15,height:15,fill:s<=Math.round(rating)?T.goldVib:'none',color:s<=Math.round(rating)?T.goldVib:'#D0D5DB' }} />)}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkFaint, marginTop: 7 }}>{reviews?.total??0} reviews</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      {[5,4,3,2,1].map(star => {
                        const cnt = reviewList.filter(r => Math.round(Number(r.rating))===star).length
                        const pct = reviews?.total ? Math.round((cnt/reviews.total)*100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMuted, width: 8 }}>{star}</span>
                            <Star style={{ width:11,height:11,fill:T.goldVib,color:T.goldVib,flexShrink:0 }} />
                            <div style={{ flex:1,height:6,borderRadius:99,background:T.cream,overflow:'hidden' }}>
                              <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.3+star*0.08,duration:0.7,ease:'easeOut' }} style={{ height:'100%',background:`linear-gradient(90deg,${T.goldVib},#E8C547)`,borderRadius:99 }} />
                            </div>
                            <span style={{ fontFamily: "'DM Sans',sans-serif",fontSize:11,color:T.inkFaint,width:30 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviewList.map((r,i) => <ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length && <div style={{ textAlign:'center',padding:'80px 0',fontFamily:"'DM Sans',sans-serif",color:T.inkFaint }}><div style={{ fontSize:52,marginBottom:12 }}>⭐</div>No reviews yet.</div>}
                  </div>
                </motion.div>
              )}

              {/* GALLERY */}
              {activeTab === 'Gallery' && (
                <motion.div key="ga" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 30, color: T.ink, marginBottom: 28 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
                      {school.galleryImages.map((img,i) => (
                        <motion.div key={i} {...fadeUp(i*0.05)} whileHover={{ scale: 1.02, boxShadow: T.shadowLg }}
                          style={{ aspectRatio:'4/3',borderRadius:18,overflow:'hidden',background:T.cream,cursor:'pointer' }}>
                          <img src={img} alt={`Gallery ${i+1}`} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s ease' }}
                            onMouseEnter={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1.07)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1)'} loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : <div style={{ textAlign:'center',padding:'80px 0',fontFamily:"'DM Sans',sans-serif",color:T.inkFaint }}><div style={{ fontSize:52,marginBottom:12 }}>🖼️</div>No gallery images yet.</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT SIDEBAR */}
          <motion.div initial={{ opacity:0,x:28 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.28,duration:0.55,ease:[0.22,1,0.36,1] }}
            style={{ position:'sticky',top:90 }}>

            {/* CTA Card */}
            <div style={{ background:T.white,border:`1px solid ${T.border}`,borderRadius:26,overflow:'hidden',boxShadow:T.shadowMd,marginBottom:14 }}>
              <div style={{ height:4,background:`linear-gradient(90deg,transparent,${T.goldVib},#E8C547,${T.goldVib},transparent)` }} />
              <div style={{ padding:'26px 24px 22px' }}>
                {school.monthlyFeeMin && (
                  <div style={{ textAlign:'center',paddingBottom:20,marginBottom:20,borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:T.inkFaint,textTransform:'uppercase' as const,letterSpacing:'0.14em',marginBottom:8 }}>Monthly Fee From</div>
                    <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ delay:0.4,duration:0.45 }}
                      style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:54,color:T.goldVib,lineHeight:1,letterSpacing:'-3px' }}>
                      ₹{school.monthlyFeeMin.toLocaleString()}
                    </motion.div>
                    {rating > 0 && (
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:3,marginTop:10 }}>
                        {[1,2,3,4,5].map(s=><Star key={s} style={{ width:12,height:12,fill:s<=Math.round(rating)?T.goldVib:'none',color:s<=Math.round(rating)?T.goldVib:'#D0D5DB' }} />)}
                        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMuted,marginLeft:5 }}>{rating.toFixed(1)} · {school.totalReviews||0} reviews</span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                  <motion.div whileHover={{ scale:1.01,y:-1 }} whileTap={{ scale:0.98 }}>
                    <Link href={`/apply/${school.id}`} className="spbtn spbtn-primary">Apply Now <ArrowRight style={{ width:15,height:15 }} /></Link>
                  </motion.div>
                  <motion.button whileHover={{ scale:1.01,y:-1 }} whileTap={{ scale:0.98 }} onClick={() => setShowCallModal(true)} className="spbtn spbtn-outline" style={{ border:`1.5px solid ${T.goldBdr}` }}>
                    <PhoneCall style={{ width:14,height:14 }} /> Request Call Back
                  </motion.button>
                  <Link href="/counselling" className="spbtn spbtn-ghost">🎓 Get Expert Counselling</Link>
                  <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }} onClick={handleSave}
                    className="spbtn spbtn-ghost"
                    style={{ border:`1.5px solid ${saved?T.goldBdr:T.border}`,background:saved?T.goldPale:'transparent',color:saved?T.goldVib:T.inkMuted }}>
                    <Heart style={{ width:14,height:14,fill:saved?T.goldVib:'none',color:saved?T.goldVib:'currentColor',transition:'all 0.2s' }} />
                    {saved ? 'Saved to Wishlist' : 'Save School'}
                  </motion.button>
                  <Link href={`/compare?add=${school.id}`} onClick={() => createLead('compare',school.id)} className="spbtn spbtn-ghost">
                    <GitCompare style={{ width:14,height:14 }} /> Compare School
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Facts */}
            <div style={{ background:T.white,border:`1px solid ${T.border}`,borderRadius:22,padding:'22px 24px',boxShadow:T.shadow }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:10,color:T.inkFaint,textTransform:'uppercase' as const,letterSpacing:'0.14em',marginBottom:6 }}>Quick Facts</div>
              {boards.length > 0 && <FactRow icon={BookOpenCheck} label="Board" value={boards.join(', ')} />}
              {school.foundingYear && <FactRow icon={Calendar} label="Founded" value={String(school.foundingYear)} />}
              {school.classesFrom && school.classesTo && <FactRow icon={GraduationCap} label="Classes" value={`${fmt(school.classesFrom)} – ${fmt(school.classesTo)}`} />}
              {school.totalStudents && <FactRow icon={Users} label="Students" value={school.totalStudents.toLocaleString()} />}
              {school.schoolType && <FactRow icon={Building2} label="Type" value={fmt(school.schoolType)} />}
              {school.genderPolicy && <FactRow icon={Users} label="Gender" value={fmt(school.genderPolicy)} />}
              {school.mediumOfInstruction && <FactRow icon={Mic} label="Medium" value={fmt(school.mediumOfInstruction)} />}
              <motion.div whileHover={{ scale:1.02 }} style={{ marginTop:16 }}>
                <Link href={`/apply/${school.id}`} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'11px',borderRadius:12,background:T.goldPale,border:`1px solid ${T.goldBdr}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:T.goldVib,textDecoration:'none' }}>
                  Apply for Admission <ArrowRight style={{ width:13,height:13 }} />
                </Link>
              </motion.div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
