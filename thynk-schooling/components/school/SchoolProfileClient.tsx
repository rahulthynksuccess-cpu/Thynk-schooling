'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Phone, Globe, Star, BadgeCheck, Heart, Share2,
  GitCompare, ArrowRight, GraduationCap, ExternalLink,
  BookOpen, Users, Calendar, Award, Building2,
  BookOpenCheck, Mic, X, CheckCircle2, Zap, Trophy,
  ChevronRight, Sparkles, PhoneCall, Bell, ShieldCheck,
  TrendingUp, Clock, Eye, Bookmark,
} from 'lucide-react'
import { School, Review } from '@/types'

/* ── palette ── */
const C = {
  bg: '#FAF7F2', card: '#FFFFFF', border: 'rgba(13,17,23,0.07)',
  ink: '#0D1117', inkMuted: '#5A6472', inkFaint: '#A0ADB8',
  gold: '#B8860B', goldBg: 'rgba(184,134,11,0.08)', goldBdr: 'rgba(184,134,11,0.2)',
  goldLight: '#E8C547', success: '#16A34A', successBg: 'rgba(22,163,74,0.09)',
}

const card: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 20, boxShadow: '0 2px 20px rgba(13,17,23,0.05)',
}

function fmt(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    .replace('Co Educational Boys Girls','Co-Educational')
    .replace('Co Educational','Co-Educational')
    .replace(/\bCbse\b/,'CBSE').replace(/\bIcse\b/,'ICSE')
    .replace(/\bIb\b/,'IB').replace('K12','K–12')
}

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

/* ── floating particle ── */
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%', background: 'rgba(184,134,11,0.35)', pointerEvents: 'none' }}
      animate={{ y: [-12, 12, -12], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* ── Premium stat card ── */
function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: accent ? '0 16px 40px rgba(184,134,11,0.22)' : '0 16px 40px rgba(13,17,23,0.12)' }}
      transition={{ duration: 0.25 }}
      style={{
        background: accent
          ? 'linear-gradient(135deg,rgba(184,134,11,0.10) 0%,rgba(184,134,11,0.04) 100%)'
          : 'linear-gradient(135deg,#fff 0%,rgba(250,247,242,0.6) 100%)',
        border: `1px solid ${accent ? C.goldBdr : C.border}`,
        borderRadius: 18, padding: '16px 18px',
        cursor: 'default', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: accent ? `linear-gradient(90deg,transparent,${C.gold},transparent)` : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: accent ? `linear-gradient(135deg,${C.gold},#9A6F0B)` : 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: accent ? '0 4px 12px rgba(184,134,11,0.35)' : 'none' }}>
          <Icon style={{ width: 14, height: 14, color: accent ? '#fff' : C.inkFaint }} />
        </div>
        <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent ? C.gold : C.inkFaint }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 18, color: accent ? C.gold : C.ink, lineHeight: 1.2 }}>{value}</div>
    </motion.div>
  )
}

/* ── Glowing tag chip ── */
function Tag({ label, color = 'gold' }: { label: string; color?: 'gold' | 'green' | 'blue' | 'purple' }) {
  const map = {
    gold:   { bg: 'rgba(184,134,11,0.09)', b: 'rgba(184,134,11,0.25)', t: '#9A6F0B', glow: 'rgba(184,134,11,0.15)' },
    green:  { bg: 'rgba(22,163,74,0.09)',  b: 'rgba(22,163,74,0.25)',  t: '#15803d', glow: 'rgba(22,163,74,0.15)' },
    blue:   { bg: 'rgba(59,130,246,0.09)', b: 'rgba(59,130,246,0.25)', t: '#1d4ed8', glow: 'rgba(59,130,246,0.15)' },
    purple: { bg: 'rgba(139,92,246,0.09)', b: 'rgba(139,92,246,0.25)', t: '#6d28d9', glow: 'rgba(139,92,246,0.15)' },
  }
  const s = map[color]
  return (
    <motion.span whileHover={{ scale: 1.06, boxShadow: `0 4px 14px ${s.glow}` }}
      style={{ display: 'inline-flex', alignItems: 'center', background: s.bg, border: `1px solid ${s.b}`, color: s.t, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 100, cursor: 'default', transition: 'all 0.2s' }}>
      {label}
    </motion.span>
  )
}

/* ── Facility icon card ── */
function FacilityCard({ label, emoji, color }: { label: string; emoji: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(13,17,23,0.12)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 14px', textAlign: 'center', cursor: 'default', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top,${color} 0%,transparent 70%)`, opacity: 0.4, pointerEvents: 'none' }} />
      <div style={{ fontSize: 26, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{label}</div>
    </motion.div>
  )
}

/* ── review card ── */
function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = review.parentName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const rating = Number(review.rating) || 0
  const avatarColors = [
    ['#B8860B','#9A6F0B'],['#16A34A','#15803D'],['#2563EB','#1D4ED8'],['#7C3AED','#6D28D9'],['#DC2626','#B91C1C'],
  ]
  const [c1, c2] = avatarColors[i % avatarColors.length]
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 20px 50px rgba(13,17,23,0.10)' }}
      style={{ ...card, padding: '26px 28px', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.25s' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 3, borderRadius: '0 3px 3px 0', background: `linear-gradient(to bottom,${c1},${c2})` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0, boxShadow: `0 6px 18px ${c1}44` }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: C.ink }}>{review.parentName}</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: C.inkFaint, marginTop: 2 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,rgba(184,134,11,0.12),rgba(184,134,11,0.06))', border: `1px solid ${C.goldBdr}`, padding: '7px 13px', borderRadius: 99, flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 11, height: 11, fill: s <= rating ? C.gold : 'transparent', color: s <= rating ? C.gold : '#D0D5DB' }} />)}
          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, color: C.gold, marginLeft: 4 }}>{rating}.0</span>
        </div>
      </div>
      {review.title && <h4 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 19, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>{review.title}</h4>}
      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: C.inkMuted, lineHeight: 1.85 }}>{review.body}</p>
      {review.schoolReply && (
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 14, background: 'rgba(184,134,11,0.05)', border: `1px solid ${C.goldBdr}`, borderLeft: `3px solid ${C.gold}` }}>
          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>School Response</div>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.inkMuted, lineHeight: 1.7 }}>{review.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ── share toast ── */
function ShareToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
      style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#0D1117', color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 48px rgba(13,17,23,0.4)', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 600 }}>
      <CheckCircle2 style={{ width: 17, height: 17, color: '#4ADE80', flexShrink: 0 }} />
      Link copied to clipboard
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '3px 7px', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <X style={{ width: 12, height: 12 }} />
      </button>
    </motion.div>
  )
}

/* ── success toast ── */
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
      style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#166534', color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 48px rgba(22,101,52,0.4)', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <CheckCircle2 style={{ width: 17, height: 17, color: '#4ADE80', flexShrink: 0 }} />
      {message}
    </motion.div>
  )
}

/* ── Request Call Modal ── */
function RequestCallModal({ school, onClose, onSuccess }: { school: School; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [classFor, setClassFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) { setError('Name and phone are required'); return }
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) { setError('Enter a valid 10-digit phone number'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: school.id, action: 'request_call', parentName: name, phone, childName, classApplyingFor: classFor, source: 'request_call' }) })
      if (!res.ok) throw new Error('Failed')
      onSuccess(); onClose()
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,17,23,0.65)', backdropFilter: 'blur(10px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.88, opacity: 0, y: 32 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: '#fff', borderRadius: 28, padding: '40px', width: '100%', maxWidth: 480, boxShadow: '0 40px 120px rgba(13,17,23,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '28px 28px 0 0', background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(13,17,23,0.05)', border: 'none', cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 15, height: 15, color: C.inkMuted }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.gold},#9A6F0B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(184,134,11,0.38)' }}>
            <PhoneCall style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 24, color: C.ink, marginBottom: 3 }}>Request a Call Back</h2>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.inkMuted }}>{school.name} will call you within 24 hours</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Your Name *', value: name, onChange: setName, placeholder: 'Enter your full name', type: 'text' },
            { label: 'Mobile Number *', value: phone, onChange: setPhone, placeholder: '10-digit mobile number', type: 'tel' },
            { label: "Child's Name", value: childName, onChange: setChildName, placeholder: "Child's full name (optional)", type: 'text' },
            { label: 'Applying for Class', value: classFor, onChange: setClassFor, placeholder: 'e.g. Grade 5, Nursery', type: 'text' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: C.inkMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: C.ink, outline: 'none', background: '#FAFAF8', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
            </div>
          ))}
        </div>
        {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B91C1C' }}>{error}</div>}
        <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
          style={{ marginTop: 22, width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: loading ? '#ccc' : `linear-gradient(135deg,${C.gold},#9A6F0B)`, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 28px rgba(184,134,11,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? 'Submitting…' : <><PhoneCall style={{ width: 16, height: 16 }} /> Request Call Back</>}
        </motion.button>
        <p style={{ marginTop: 14, fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: C.inkFaint, textAlign: 'center', lineHeight: 1.6 }}>
          🔒 Your contact info is shared only with this school and protected by our privacy policy.
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ── skeleton ── */
function ProfileSkeleton() {
  return (
    <div style={{ background: C.bg }}>
      <div className="skeleton" style={{ height: 340, borderRadius: 0 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 24, marginTop: -60, marginBottom: 40 }}>
          <div className="skeleton" style={{ width: 120, height: 120, borderRadius: 24, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingTop: 70 }}>
            <div className="skeleton" style={{ height: 34, width: '42%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,27vw,360px)', gap: 40 }}>
          <div>
            <div className="skeleton" style={{ height: 52, borderRadius: 14, marginBottom: 36 }} />
            <div className="skeleton" style={{ height: 220, borderRadius: 20, marginBottom: 16 }} />
          </div>
          <div className="skeleton" style={{ height: 480, borderRadius: 24 }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════ */
export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const coverYRaw = useTransform(scrollY, [0, 500], [0, 80])
  const coverY = useSpring(coverYRaw, { stiffness: 80, damping: 20 })

  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: 5 + (i * 37 + 13) % 90, y: 5 + (i * 53 + 7) % 85,
      size: 2 + (i % 3), delay: i * 0.3, duration: 3 + (i % 5),
    }))
  )

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.school ?? d),
    staleTime: 5 * 60 * 1000,
  })

  // ✅ FIX: use school.slug (from DB) instead of URL slug to avoid 404
  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', school?.slug ?? slug],
    queryFn: () => fetch(`/api/schools/${school?.slug ?? slug}/reviews?limit=6`, { cache: 'no-store' }).then(r => r.ok ? r.json() : ({ data: [], total: 0 })).catch(() => ({ data: [], total: 0 })),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setShowShare(true)
    setTimeout(() => setShowShare(false), 2500)
  }

  const createLead = useCallback(async (source: string, schoolId: string) => {
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, action: 'create_lead', source }) })
    } catch { /* silent */ }
  }, [])

  const handleSave = () => {
    if (!saved && school) createLead('save', school.id)
    setSaved(!saved)
    if (!saved) setToast('School saved to your wishlist!')
  }
  const handleCompare = () => { if (school) createLead('compare', school.id) }

  if (isLoading) return <ProfileSkeleton />
  if (!school) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: C.bg }}>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: 72 }}>🏫</motion.div>
      <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 32, color: C.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding: '13px 32px', borderRadius: 14, background: C.ink, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Browse Schools</Link>
    </div>
  )

  const reviewList = reviews?.data ?? []
  const rating = Number(school.avgRating) || 0
  const boards = (school.board || [])
  const yearsOld = school.foundingYear ? new Date().getFullYear() - school.foundingYear : 0

  return (
    <div style={{ background: C.bg, paddingBottom: 100 }}>
      {/* Fonts + keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes gradientPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      <AnimatePresence>
        {showShare && <ShareToast onClose={() => setShowShare(false)} />}
        {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
        {showCallModal && <RequestCallModal school={school} onClose={() => setShowCallModal(false)} onSuccess={() => setToast('Request submitted! The school will call you soon.')} />}
      </AnimatePresence>

      {/* ══════════ CINEMATIC HERO ══════════ */}
      <div ref={coverRef} style={{ position: 'relative', height: 'clamp(320px,40vw,420px)', overflow: 'hidden', background: 'linear-gradient(135deg,#060a14 0%,#0d1829 40%,#0f2642 100%)' }}>
        <motion.div style={{ y: coverY, position: 'absolute', inset: '-15%', insetInline: 0 }}>
          {school.coverImageUrl ? (
            <img src={school.coverImageUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45) saturate(0.8)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                {[300, 460, 620, 800].map((size, i) => (
                  <motion.div key={i}
                    style={{ position: 'absolute', borderRadius: '50%', width: size, height: size, top: -size/2, left: -size/2, border: `1px solid rgba(184,134,11,${0.18 - i*0.03})` }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 4 + i, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }} />
                ))}
              </div>
              {particles.current.map((p, i) => <Particle key={i} {...p} />)}
              {/* ✅ FIX: very low opacity so it doesn't clash with logo card */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 90, height: 90, borderRadius: 24, background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <GraduationCap style={{ width: 38, height: 38, color: 'rgba(184,134,11,0.4)' }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
            </div>
          )}
        </motion.div>

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(6,10,20,0.97) 0%,rgba(6,10,20,0.5) 45%,rgba(6,10,20,0.1) 75%,transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,10,20,0.6) 0%,transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 100%,rgba(184,134,11,0.14) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Action pills */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
          {[
            { label: saved ? 'Saved' : 'Save', icon: Heart, onClick: handleSave, active: saved },
            { label: 'Share', icon: Share2, onClick: handleShare, active: false },
          ].map((a, i) => (
            <motion.button key={i} whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.94 }} onClick={a.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', background: a.active ? 'rgba(184,134,11,0.42)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <a.icon style={{ width: 13, height: 13, fill: (i === 0 && saved) ? '#fff' : 'transparent', color: '#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale: 1.07, y: -2 }}>
            <Link href={`/compare?add=${school.id}`} onClick={handleCompare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(184,134,11,0.4)', background: 'rgba(184,134,11,0.22)', backdropFilter: 'blur(20px)', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              <GitCompare style={{ width: 13, height: 13 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* Hero bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(20px,4vw,56px) 30px', zIndex: 5 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {school.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(22,163,74,0.88)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: 'DM Sans,sans-serif' }}>
                <BadgeCheck style={{ width: 11, height: 11 }} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <motion.span animate={{ boxShadow: ['0 0 0 rgba(184,134,11,0)', '0 0 18px rgba(184,134,11,0.6)', '0 0 0 rgba(184,134,11,0)'] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: 'DM Sans,sans-serif' }}>
                <Sparkles style={{ width: 10, height: 10 }} /> Featured
              </motion.span>
            )}
            {boards.slice(0, 3).map(b => (
              <span key={b} style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: 'DM Sans,sans-serif' }}>{b}</span>
            ))}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.55 }}
            style={{ fontFamily: 'Playfair Display,serif', fontWeight: 800, fontSize: 'clamp(26px,4.5vw,52px)', color: '#fff', lineHeight: 1.02, letterSpacing: '-0.02em', marginBottom: 14, textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
            {school.name}
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {school.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <MapPin style={{ width: 11, height: 11 }} />
                {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
              </span>
            )}
            {school.foundingYear && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <Calendar style={{ width: 11, height: 11 }} /> Est. {school.foundingYear}
              </span>
            )}
            {boards[0] && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.24)', backdropFilter: 'blur(10px)', border: '1px solid rgba(184,134,11,0.4)', color: '#FFD97D', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}>
                <BookOpenCheck style={{ width: 11, height: 11 }} /> {boards.join(' · ')}
              </span>
            )}
            {school.classesFrom && school.classesTo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <GraduationCap style={{ width: 11, height: 11 }} /> Class {school.classesFrom}–{school.classesTo}
              </span>
            )}
            {rating > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.24)', backdropFilter: 'blur(10px)', border: '1px solid rgba(184,134,11,0.4)', color: '#FFD97D', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}>
                <Star style={{ width: 11, height: 11, fill: '#FFD97D', color: '#FFD97D' }} /> {rating.toFixed(1)} ({school.totalReviews || 0} reviews)
              </span>
            )}
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right,transparent,rgba(184,134,11,0.5),transparent)' }} />
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,4vw,56px)' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -60, marginBottom: 36, flexWrap: 'wrap' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 116, height: 116, borderRadius: 26, background: '#fff', border: `4px solid ${C.bg}`, boxShadow: '0 14px 44px rgba(13,17,23,0.24)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
              : <GraduationCap style={{ width: 48, height: 48, color: C.gold }} />}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ flex: 1, minWidth: 0, paddingBottom: 6 }}>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 800, fontSize: 'clamp(22px,3vw,40px)', color: C.ink, lineHeight: 1.05, letterSpacing: '-0.022em', marginBottom: 10 }}>{school.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {school.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.inkMuted }}>
                  <MapPin style={{ width: 12, height: 12, color: C.gold, flexShrink: 0 }} />
                  {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              )}
              {boards.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: C.goldBg, border: `1px solid ${C.goldBdr}`, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700, color: C.gold }}>
                  <BookOpenCheck style={{ width: 11, height: 11 }} /> {boards.join(' · ')}
                </span>
              )}
              {school.foundingYear && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: 'rgba(13,17,23,0.05)', border: `1px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: C.inkMuted }}>
                  <Calendar style={{ width: 11, height: 11 }} /> Est. {school.foundingYear}
                </span>
              )}
              {rating > 0 && (
                <motion.div whileHover={{ scale: 1.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 13px', borderRadius: 99, background: C.goldBg, border: `1px solid ${C.goldBdr}`, cursor: 'default' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 11, height: 11, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                  <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 12, color: C.gold }}>{rating.toFixed(1)}</span>
                  <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: C.inkFaint }}>({school.totalReviews || 0})</span>
                </motion.div>
              )}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe style={{ width: 12, height: 12 }} /> Visit Website <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── HERO STATS STRIP (dark cinematic bar) ── */}
        {(school.foundingYear || school.totalStudents || school.classesFrom || rating > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 0, marginBottom: 40, background: 'linear-gradient(135deg,#0d1117 0%,#1a2640 100%)', borderRadius: 24, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(13,17,23,0.22)' }}>
            {/* Shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 40%,rgba(184,134,11,0.06) 50%,transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right,transparent,rgba(184,134,11,0.2),transparent)' }} />

            {[
              school.foundingYear ? { icon: '🏛️', value: school.foundingYear.toString(), label: 'Established', sub: yearsOld > 0 ? `${yearsOld} yrs` : '' } : null,
              school.totalStudents ? { icon: '👨‍🎓', value: school.totalStudents.toLocaleString('en-IN'), label: 'Students', sub: 'Enrolled' } : null,
              school.classesFrom && school.classesTo ? { icon: '📚', value: `${school.classesFrom}–${school.classesTo}`, label: 'Classes', sub: 'Grade range' } : null,
              rating > 0 ? { icon: '⭐', value: rating.toFixed(1) + ' / 5', label: 'Rating', sub: `${school.totalReviews || 0} reviews` } : null,
              school.studentTeacherRatio ? { icon: '👩‍🏫', value: school.studentTeacherRatio, label: 'Teacher Ratio', sub: 'Student:Teacher' } : null,
            ].filter(Boolean).map((s: any, i, arr) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
                style={{ textAlign: 'center', padding: '28px 12px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', position: 'relative' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 28, color: C.goldLight, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>{s.label}</div>
                {s.sub && <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 3 }}>{s.sub}</div>}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ════ TWO-COLUMN LAYOUT ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,370px)', gap: 44, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

            {/* Premium tab bar */}
            <div style={{ display: 'flex', gap: 2, background: 'rgba(13,17,23,0.04)', borderRadius: 18, padding: 5, border: `1px solid ${C.border}`, marginBottom: 36, overflowX: 'auto' }}>
              {TABS.map(tab => (
                <motion.button key={tab} onClick={() => setActiveTab(tab)} whileTap={{ scale: 0.95 }}
                  style={{ padding: '10px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, background: activeTab === tab ? C.ink : 'transparent', color: activeTab === tab ? '#fff' : C.inkMuted, boxShadow: activeTab === tab ? '0 4px 14px rgba(13,17,23,0.22)' : 'none', transition: 'all 0.22s' }}>
                  {tab}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeTab === 'Overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  {school.description && (
                    <div style={{ marginBottom: 36, padding: '28px 30px', background: 'linear-gradient(135deg,rgba(184,134,11,0.05),rgba(184,134,11,0.02))', border: `1px solid ${C.goldBdr}`, borderRadius: 22, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(184,134,11,0.12),transparent 70%)', pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                        <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 24, color: C.ink }}>About {school.name}</h2>
                      </div>
                      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 15, color: C.inkMuted, lineHeight: 1.9, margin: 0 }}>{school.description}</p>
                    </div>
                  )}

                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <div style={{ width: 4, height: 26, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                      <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 22, color: C.ink }}>School Details</h2>
                    </div>

                    {/* Board + Founded hero cards */}
                    {(boards.length > 0 || school.foundingYear) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 12 }}>
                        {boards.length > 0 && (
                          <motion.div whileHover={{ y: -4, boxShadow: '0 16px 44px rgba(184,134,11,0.2)' }}
                            style={{ background: 'linear-gradient(135deg,rgba(184,134,11,0.13),rgba(184,134,11,0.05))', border: `1.5px solid ${C.goldBdr}`, borderRadius: 20, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.gold},transparent)` }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${C.gold},#9A6F0B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(184,134,11,0.4)' }}>
                                <BookOpenCheck style={{ width: 16, height: 16, color: '#fff' }} />
                              </div>
                              <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold }}>Curriculum Board</span>
                            </div>
                            <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 22, color: C.gold }}>{boards.join(', ')}</div>
                          </motion.div>
                        )}
                        {school.foundingYear && (
                          <motion.div whileHover={{ y: -4, boxShadow: '0 16px 44px rgba(13,17,23,0.12)' }}
                            style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(13,17,23,0.04),transparent 70%)', pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(13,17,23,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar style={{ width: 16, height: 16, color: C.inkFaint }} />
                              </div>
                              <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.inkFaint }}>Founded Year</span>
                            </div>
                            <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 22, color: C.ink }}>{school.foundingYear}</div>
                            {yearsOld > 0 && <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: C.inkFaint, marginTop: 4 }}>{yearsOld} years of excellence</div>}
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10 }}>
                      <StatCard icon={Building2}     label="School Type"    value={fmt(school.schoolType)} />
                      <StatCard icon={Users}         label="Gender Policy"  value={fmt(school.genderPolicy)} />
                      <StatCard icon={Mic}           label="Medium"         value={school.mediumOfInstruction} />
                      <StatCard icon={GraduationCap} label="Classes"        value={school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null} />
                      <StatCard icon={Award}         label="Recognition"    value={school.recognition} />
                      <StatCard icon={Users}         label="Students"       value={school.totalStudents?.toLocaleString('en-IN')} />
                      <StatCard icon={BookOpen}      label="Teacher Ratio"  value={school.studentTeacherRatio} />
                    </div>
                  </div>

                  {[
                    { label: '🏗️ Facilities', items: school.facilities as string[], color: 'gold' as const },
                    { label: '⚽ Sports', items: school.sports as string[], color: 'green' as const },
                    { label: '🎭 Extra Curricular', items: school.extraCurricular as string[], color: 'purple' as const },
                    { label: '🗣️ Languages', items: school.languagesOffered as string[], color: 'blue' as const },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.label} style={{ marginBottom: 24 }}>
                      <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 12 }}>{g.label}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {g.items.slice(0, 10).map(item => <Tag key={item} label={item} color={g.color} />)}
                        {g.items.length > 10 && <Tag label={`+${g.items.length - 10} more`} />}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── FACILITIES ── */}
              {activeTab === 'Facilities' && (
                <motion.div key="fa" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  {[
                    { title: 'Facilities & Infrastructure', items: school.facilities as string[], color: 'rgba(184,134,11,0.12)', emoji: '🏗️', icons: ['🏊','🏋️','🔬','📖','🎨','🖥️','🍽️','🚌','⚽','🎭','📚','🏥'] },
                    { title: 'Sports', items: school.sports as string[], color: 'rgba(22,163,74,0.12)', emoji: '⚽', icons: ['⚽','🏏','🏸','🏊','🎾','🏐','🏀','🤸','🥊','🏑','🎱','🏓'] },
                    { title: 'Extra Curricular', items: school.extraCurricular as string[], color: 'rgba(139,92,246,0.12)', emoji: '🎭', icons: ['🎭','🎵','🎨','📸','💃','🎬','🗣️','✍️','🤖','🔭','🎯','🎪'] },
                    { title: 'Languages Offered', items: school.languagesOffered as string[], color: 'rgba(59,130,246,0.12)', emoji: '🗣️', icons: ['🇮🇳','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇷🇺','🇨🇳','🇸🇦','🌍','📖','✏️','🔤'] },
                  ].filter(g => g.items?.length > 0).map((g, gi) => (
                    <motion.div key={g.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.1 }}
                      style={{ ...card, padding: '28px 30px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle,${g.color},transparent 70%)`, pointerEvents: 'none' }} />
                      <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{g.emoji}</span> {g.title}
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 10 }}>
                        {g.items.map((item, ii) => (
                          <FacilityCard key={item} label={item} emoji={g.icons[ii % g.icons.length]} color={g.color} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {!school.facilities?.length && !school.sports?.length && !school.extraCurricular?.length && !school.languagesOffered?.length && (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'DM Sans,sans-serif', color: C.inkFaint }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🏗️</div>No facility info yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FEES ── */}
              {activeTab === 'Fees' && (
                <motion.div key="fe" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Monthly Fee From', value: school.monthlyFeeMin, icon: '📅', accent: true },
                      { label: 'Monthly Fee To',   value: school.monthlyFeeMax, icon: '📈', accent: false },
                      { label: 'Annual / Admission', value: school.annualFee,  icon: '📋', accent: false },
                    ].filter(f => f.value).map((f, i) => (
                      <motion.div key={f.label}
                        initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.1, duration: 0.4 }}
                        whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(184,134,11,0.24)' }}
                        style={{ background: f.accent ? 'linear-gradient(145deg,#0d1117 0%,#1a2640 100%)' : '#fff', border: `1.5px solid ${f.accent ? 'rgba(184,134,11,0.3)' : C.border}`, borderRadius: 24, padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
                        {f.accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />}
                        {f.accent && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at bottom,rgba(184,134,11,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />}
                        <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: f.accent ? 'rgba(255,255,255,0.4)' : C.inkFaint, marginBottom: 10 }}>{f.label}</div>
                        <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 38, color: f.accent ? C.goldLight : C.gold, lineHeight: 1, letterSpacing: '-2px' }}>
                          ₹{(f.value as number).toLocaleString('en-IN')}
                        </div>
                        {f.accent && <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>per month</div>}
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ background: C.goldBg, border: `1px solid ${C.goldBdr}`, borderRadius: 14, padding: '14px 18px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.inkMuted, lineHeight: 1.65 }}>
                    ℹ️ Fees are approximate. Contact school for exact fee schedule.
                  </div>
                </motion.div>
              )}

              {/* ── ADMISSION ── */}
              {activeTab === 'Admission' && (
                <motion.div key="ad" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 28 }}>Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Academic Year', value: school.admissionInfo.academicYear, icon: '📅' },
                        { label: 'Status', value: school.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed', icon: '🚪' },
                        school.admissionInfo.lastDate ? { label: 'Last Date', value: school.admissionInfo.lastDate, icon: '⏰' } : null,
                      ].filter(Boolean).map((row: any) => (
                        <motion.div key={row.label} whileHover={{ x: 4 }}
                          style={{ ...card, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{row.icon}</span>
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 14, color: C.inkMuted }}>{row.label}</span>
                          </div>
                          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 18, color: C.ink }}>{row.value}</span>
                        </motion.div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length > 0 && (
                        <div style={{ ...card, padding: '26px 30px', marginTop: 8 }}>
                          <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 18 }}>Documents Required</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {school.admissionInfo.documentsRequired.map((doc: string, i: number) => (
                              <motion.div key={doc} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(13,17,23,0.02)', border: `1px solid ${C.border}` }}>
                                <div style={{ width: 22, height: 22, borderRadius: 7, background: C.goldBg, border: `1px solid ${C.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <CheckCircle2 style={{ width: 12, height: 12, color: C.gold }} />
                                </div>
                                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: C.inkMuted }}>{doc}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily: 'DM Sans,sans-serif', color: C.inkFaint, textAlign: 'center', padding: 72 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === 'Reviews' && (
                <motion.div key="re" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  {/* Dark premium rating card */}
                  <div style={{ background: 'linear-gradient(135deg,#0d1117 0%,#1a2640 100%)', borderRadius: 24, padding: '32px 36px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at bottom right,rgba(184,134,11,0.1) 0%,transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
                        style={{ fontFamily: 'Playfair Display,serif', fontWeight: 800, fontSize: 90, color: C.goldLight, lineHeight: 1, letterSpacing: '-4px' }}>
                        {rating.toFixed(1)}
                      </motion.div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
                        {[1,2,3,4,5].map(s => (
                          <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + s * 0.08 }}>
                            <Star style={{ width: 18, height: 18, fill: s <= Math.round(rating) ? C.goldLight : 'transparent', color: s <= Math.round(rating) ? C.goldLight : 'rgba(255,255,255,0.2)' }} />
                          </motion.div>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>{reviews?.total ?? 0} reviews</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {[5,4,3,2,1].map((star, si) => {
                        const cnt = reviewList.filter(r => Math.round(Number(r.rating)) === star).length
                        const pct = reviews?.total ? Math.round((cnt / reviews.total) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: si < 4 ? 12 : 0 }}>
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', width: 10, textAlign: 'right' }}>{star}</span>
                            <Star style={{ width: 11, height: 11, fill: C.gold, color: C.gold, flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4 + si * 0.1, duration: 0.7, ease: 'easeOut' }}
                                style={{ height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: 99, boxShadow: `0 0 8px rgba(184,134,11,0.5)` }} />
                            </div>
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 32 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviewList.map((r, i) => <ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length && (
                      <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'DM Sans,sans-serif', color: C.inkFaint }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── GALLERY ── */}
              {activeTab === 'Gallery' && (
                <motion.div key="ga" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 24 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
                      {school.galleryImages.map((img, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                          whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(13,17,23,0.2)' }}
                          style={{ aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden', background: '#e9e4dc', cursor: 'pointer' }}>
                          <img src={img} alt={`Gallery ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)'}
                            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'DM Sans,sans-serif', color: C.inkFaint }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🖼️</div>No gallery images.
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ── RIGHT SIDEBAR ── */}
          <div>
            <motion.div initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28, duration: 0.52 }}
              style={{ position: 'sticky', top: 90 }}>

              {/* Primary CTA — dark premium */}
              <div style={{ background: 'linear-gradient(145deg,#0d1117 0%,#1a2640 100%)', borderRadius: 28, overflow: 'hidden', position: 'relative', marginBottom: 14, padding: '32px 26px 26px', boxShadow: '0 24px 60px rgba(13,17,23,0.28)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />
                <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(184,134,11,0.14) 0%,transparent 70%)', pointerEvents: 'none' }} />

                {school.monthlyFeeMin && (
                  <div style={{ textAlign: 'center', paddingBottom: 22, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Monthly Fee From</div>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}
                      style={{ fontFamily: 'Playfair Display,serif', fontWeight: 800, fontSize: 54, color: C.goldLight, lineHeight: 1, letterSpacing: '-3px' }}>
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </motion.div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : 'rgba(255,255,255,0.15)' }} />)}
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 5 }}>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link href={`/apply/${school.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '17px 20px', borderRadius: 16, background: `linear-gradient(135deg,${C.gold},#9A6F0B)`, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 10px 28px rgba(184,134,11,0.45)', letterSpacing: '0.01em' }}>
                      Apply Now <ArrowRight style={{ width: 15, height: 15 }} />
                    </Link>
                  </motion.div>
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCallModal(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 16, border: '1.5px solid rgba(184,134,11,0.35)', background: 'rgba(184,134,11,0.12)', color: C.goldLight, fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <PhoneCall style={{ width: 14, height: 14 }} /> Request Call Back
                  </motion.button>
                  <Link href="/counselling"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    🎓 Get Expert Counselling
                  </Link>
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 16, cursor: 'pointer', border: `1.5px solid ${saved ? 'rgba(184,134,11,0.4)' : 'rgba(255,255,255,0.1)'}`, background: saved ? 'rgba(184,134,11,0.15)' : 'transparent', color: saved ? C.goldLight : 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600 }}>
                    <Heart style={{ width: 14, height: 14, fill: saved ? C.goldLight : 'transparent' }} />
                    {saved ? 'Saved to Wishlist' : 'Save School'}
                  </button>
                  <Link href={`/compare?add=${school.id}`} onClick={handleCompare}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <GitCompare style={{ width: 14, height: 14 }} /> Compare School
                  </Link>
                </div>
              </div>

              {/* Quick Facts — clean light card */}
              <div style={{ ...card, padding: '22px 24px', borderRadius: 22 }}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>Quick Facts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {[
                    { icon: BookOpenCheck, label: 'Board', value: boards.join(', '), accent: true },
                    { icon: Calendar, label: 'Founded', value: school.foundingYear?.toString(), accent: false },
                    { icon: GraduationCap, label: 'Classes', value: school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null, accent: false },
                    { icon: Users, label: 'Students', value: school.totalStudents?.toLocaleString('en-IN'), accent: false },
                    { icon: Building2, label: 'Type', value: fmt(school.schoolType), accent: false },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: C.inkMuted }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: r.accent ? C.goldBg : 'rgba(13,17,23,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <r.icon style={{ width: 12, height: 12, color: r.accent ? C.gold : C.inkFaint }} />
                        </div>
                        {r.label}
                      </span>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 15, color: r.accent ? C.gold : C.ink }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
