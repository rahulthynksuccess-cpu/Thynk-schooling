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


/* ── format raw DB values to readable labels ── */
function formatLabel(raw?: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/_/g, ' ')
    .replace(/\w/g, c => c.toUpperCase())
    .replace('Co Educational Boys Girls', 'Co-Educational')
    .replace('Co Educational', 'Co-Educational')
    .replace('Cbse', 'CBSE')
    .replace('Icse', 'ICSE')
    .replace('Ib ', 'IB ')
    .replace('K12', 'K–12')
    .replace('Day School', 'Day School')
    .replace('Boarding School', 'Boarding School')
    .replace('Pre Primary', 'Pre-Primary')
    .replace('Senior Secondary', 'Senior Secondary')
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

/* ── stat card ── */
function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(13,17,23,0.10)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: accent ? 'linear-gradient(135deg,rgba(184,134,11,0.08),rgba(184,134,11,0.03))' : '#fff',
        border: `1px solid ${accent ? C.goldBdr : C.border}`,
        borderRadius: 14, padding: '16px 18px', cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent ? C.goldBg : 'rgba(13,17,23,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color: accent ? C.gold : C.inkFaint }} />
        </div>
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.inkFaint }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 17, color: accent ? C.gold : C.ink, lineHeight: 1.2 }}>{value}</div>
    </motion.div>
  )
}

/* ── tag chip ── */
function Tag({ label, color = 'gold' }: { label: string; color?: 'gold' | 'green' | 'blue' | 'purple' }) {
  const map = {
    gold:   { bg: 'rgba(184,134,11,0.09)', b: 'rgba(184,134,11,0.25)', t: '#9A6F0B' },
    green:  { bg: 'rgba(22,163,74,0.09)',  b: 'rgba(22,163,74,0.25)',  t: '#15803d' },
    blue:   { bg: 'rgba(59,130,246,0.09)', b: 'rgba(59,130,246,0.25)', t: '#1d4ed8' },
    purple: { bg: 'rgba(139,92,246,0.09)', b: 'rgba(139,92,246,0.25)', t: '#6d28d9' },
  }
  const s = map[color]
  return (
    <motion.span whileHover={{ scale: 1.04 }} style={{ display: 'inline-flex', alignItems: 'center', background: s.bg, border: `1px solid ${s.b}`, color: s.t, fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 100, cursor: 'default' }}>
      {label}
    </motion.span>
  )
}

/* ── review card ── */
function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = review.parentName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const rating = Number(review.rating) || 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      style={{ ...card, padding: '22px 26px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${C.goldBg},rgba(184,134,11,0.18))`, border: `1px solid ${C.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 18, color: C.gold, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>{review.parentName}</div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint, marginTop: 2 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.goldBg, border: `1px solid ${C.goldBdr}`, padding: '5px 11px', borderRadius: 99, flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 11, height: 11, fill: s <= rating ? C.gold : 'transparent', color: s <= rating ? C.gold : '#D0D5DB' }} />)}
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: C.gold, marginLeft: 4 }}>{rating}.0</span>
        </div>
      </div>
      {review.title && <h4 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 18, color: C.ink, marginBottom: 6 }}>{review.title}</h4>}
      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.inkMuted, lineHeight: 1.8 }}>{review.body}</p>
      {review.schoolReply && (
        <div style={{ marginTop: 14, padding: '13px 16px', borderRadius: 12, background: 'rgba(184,134,11,0.05)', border: `1px solid ${C.goldBdr}` }}>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 5 }}>School Response</div>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted, lineHeight: 1.65 }}>{review.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ── share toast ── */
function ShareToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
      style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#0D1117', color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 48px rgba(13,17,23,0.4)', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600 }}
    >
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
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
      style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#166534', color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 48px rgba(22,101,52,0.4)', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id, action: 'request_call',
          parentName: name, phone, childName, classApplyingFor: classFor,
          source: 'request_call',
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onSuccess()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(8px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 32 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: '#fff', borderRadius: 28, padding: '40px', width: '100%', maxWidth: 480, boxShadow: '0 40px 120px rgba(13,17,23,0.3)', position: 'relative' }}
      >
        {/* gold top border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '28px 28px 0 0', background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />

        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(13,17,23,0.05)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X style={{ width: 15, height: 15, color: C.inkMuted }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: C.goldBg, border: `1.5px solid ${C.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall style={{ width: 22, height: 22, color: C.gold }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 24, color: C.ink, marginBottom: 3 }}>Request a Call Back</h2>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted }}>{school.name} will call you within 24 hours</p>
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
              <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: C.inkMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.ink, outline: 'none', background: '#FAFAF8', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#B91C1C' }}>
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={handleSubmit} disabled={loading}
          style={{ marginTop: 22, width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: loading ? '#ccc' : `linear-gradient(135deg,${C.gold},#9A6F0B)`, color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 28px rgba(184,134,11,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? 'Submitting…' : <><PhoneCall style={{ width: 16, height: 16 }} /> Request Call Back</>}
        </motion.button>

        <p style={{ marginTop: 14, fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint, textAlign: 'center', lineHeight: 1.6 }}>
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
      x: 5 + (i * 37 + 13) % 90,
      y: 5 + (i * 53 + 7) % 85,
      size: 2 + (i % 3),
      delay: i * 0.3,
      duration: 3 + (i % 5),
    }))
  )

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.school ?? d),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', slug],
    queryFn: () => fetch(`/api/schools/${slug}/reviews?limit=6`, { cache: 'no-store' }).then(r => r.ok ? r.json() : ({ data: [], total: 0 })).catch(() => ({ data: [], total: 0 })),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setShowShare(true)
    setTimeout(() => setShowShare(false), 2500)
  }

  // Create lead for Save / Compare / Request Call actions
  const createLead = useCallback(async (source: string, schoolId: string) => {
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, action: 'create_lead', source }),
      })
    } catch { /* silent */ }
  }, [])

  const handleSave = () => {
    if (!saved && school) createLead('save', school.id)
    setSaved(!saved)
    if (!saved) setToast('School saved to your wishlist!')
  }

  const handleCompare = () => {
    if (school) createLead('compare', school.id)
  }

  if (isLoading) return <ProfileSkeleton />
  if (!school) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: C.bg }}>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: 72 }}>🏫</motion.div>
      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 32, color: C.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding: '13px 32px', borderRadius: 14, background: C.ink, color: '#fff', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Browse Schools</Link>
    </div>
  )

  const reviewList = reviews?.data ?? []
  const rating = Number(school.avgRating) || 0
  const boards = (school.board || [])

  return (
    <div style={{ background: C.bg, paddingBottom: 100 }}>
      <AnimatePresence>
        {showShare && <ShareToast onClose={() => setShowShare(false)} />}
        {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
        {showCallModal && (
          <RequestCallModal
            school={school}
            onClose={() => setShowCallModal(false)}
            onSuccess={() => setToast('Request submitted! The school will call you soon.')}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════ COMPACT HERO ════════════════════
          Smaller hero with meaningful content (school name, stats, quick info)
          so the space feels intentional, not empty. */}
      <div
        ref={coverRef}
        style={{
          position: 'relative',
          height: 'clamp(280px,35vw,380px)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#060a14 0%,#0d1829 40%,#0f2642 100%)',
        }}
      >
        {/* Parallax cover or animated bg */}
        <motion.div style={{ y: coverY, position: 'absolute', inset: '-15%', insetInline: 0 }}>
          {school.coverImageUrl ? (
            <>
              <img src={school.coverImageUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45) saturate(0.8)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* animated rings */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                {[300, 460, 620, 780].map((size, i) => (
                  <motion.div key={i} style={{ position: 'absolute', borderRadius: '50%', width: size, height: size, top: -size/2, left: -size/2, border: `1px solid rgba(184,134,11,${0.18 - i*0.03})` }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3 + i * 0.8, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </div>
              {particles.current.map((p, i) => <Particle key={i} {...p} />)}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 100, height: 100, borderRadius: 28, background: 'rgba(184,134,11,0.12)', border: '1.5px solid rgba(184,134,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap style={{ width: 46, height: 46, color: 'rgba(184,134,11,0.6)' }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
            </div>
          )}
        </motion.div>

        {/* gradient layers */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(6,10,20,0.97) 0%,rgba(6,10,20,0.55) 45%,rgba(6,10,20,0.15) 75%,transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,10,20,0.6) 0%,transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 100%,rgba(184,134,11,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* ── top-right action pills ── */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
          {[
            { label: saved ? 'Saved' : 'Save', icon: Heart, onClick: handleSave, active: saved },
            { label: 'Share', icon: Share2, onClick: handleShare, active: false },
          ].map((a, i) => (
            <motion.button key={i} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }} onClick={a.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', background: a.active ? 'rgba(184,134,11,0.38)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <a.icon style={{ width: 13, height: 13, fill: (i === 0 && saved) ? '#fff' : 'transparent', color: '#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}>
            <Link href={`/compare?add=${school.id}`} onClick={handleCompare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(184,134,11,0.4)', background: 'rgba(184,134,11,0.22)', backdropFilter: 'blur(20px)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <GitCompare style={{ width: 13, height: 13 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* ── Hero bottom: school name + key stats ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(20px,4vw,56px) 28px', zIndex: 5 }}>
          {/* badges */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {school.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(22,163,74,0.88)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: 'Inter,sans-serif' }}>
                <BadgeCheck style={{ width: 11, height: 11 }} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, fontFamily: 'Inter,sans-serif' }}>
                <Sparkles style={{ width: 10, height: 10 }} /> Featured
              </span>
            )}
            {boards.slice(0, 3).map(b => (
              <span key={b} style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: 'Inter,sans-serif' }}>{b}</span>
            ))}
          </motion.div>

          {/* School name in hero */}
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.55 }}
            style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(24px,4vw,46px)', color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 14, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {school.name}
          </motion.h1>

          {/* Quick stats strip inside hero */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {school.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <MapPin style={{ width: 11, height: 11 }} />
                {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
              </span>
            )}
            {school.foundingYear && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <Calendar style={{ width: 11, height: 11 }} /> Est. {school.foundingYear}
              </span>
            )}
            {boards[0] && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(184,134,11,0.35)', color: '#FFD97D', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}>
                <BookOpenCheck style={{ width: 11, height: 11 }} /> {boards.join(' · ')}
              </span>
            )}
            {school.classesFrom && school.classesTo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 99 }}>
                <GraduationCap style={{ width: 11, height: 11 }} /> Class {school.classesFrom}–{school.classesTo}
              </span>
            )}
            {rating > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(184,134,11,0.35)', color: '#FFD97D', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}>
                <Star style={{ width: 11, height: 11, fill: '#FFD97D', color: '#FFD97D' }} /> {rating.toFixed(1)} ({school.totalReviews || 0} reviews)
              </span>
            )}
          </motion.div>
        </div>

        {/* gold bottom edge */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right,transparent,rgba(184,134,11,0.4),transparent)' }} />
      </div>

      {/* ════════════════════ PROFILE HEADER ════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,4vw,56px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -56, marginBottom: 36, flexWrap: 'wrap' }}>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.65, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 112, height: 112, borderRadius: 24, background: '#fff', border: `4px solid ${C.bg}`, boxShadow: '0 10px 36px rgba(13,17,23,0.22)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}
          >
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
              : <GraduationCap style={{ width: 48, height: 48, color: C.gold }} />
            }
          </motion.div>

          {/* Name + meta row (for screens where hero name might be hidden) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ flex: 1, minWidth: 0, paddingBottom: 6 }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(22px,3vw,38px)', color: C.ink, lineHeight: 1.08, letterSpacing: '-0.022em', marginBottom: 10 }}>
              {school.name}
            </h1>

            {/* ── Rich meta chips with board + founded year ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              {school.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted }}>
                  <MapPin style={{ width: 12, height: 12, color: C.gold, flexShrink: 0 }} />
                  {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              )}

              {/* Board chips */}
              {boards.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: C.goldBg, border: `1px solid ${C.goldBdr}`, fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: C.gold }}>
                  <BookOpenCheck style={{ width: 11, height: 11 }} />
                  {boards.join(' · ')}
                </span>
              )}

              {/* Founded year */}
              {school.foundingYear && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: 'rgba(13,17,23,0.05)', border: `1px solid ${C.border}`, fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: C.inkMuted }}>
                  <Calendar style={{ width: 11, height: 11 }} /> Est. {school.foundingYear}
                </span>
              )}

              {/* Rating */}
              {rating > 0 && (
                <motion.div whileHover={{ scale: 1.03 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 13px', borderRadius: 99, background: C.goldBg, border: `1px solid ${C.goldBdr}`, cursor: 'default' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 11, height: 11, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                  </div>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 12, color: C.gold }}>{rating.toFixed(1)}</span>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint }}>({school.totalReviews || 0})</span>
                </motion.div>
              )}

              {/* Website */}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe style={{ width: 12, height: 12 }} /> Visit Website <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* ════ TWO-COLUMN LAYOUT ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,370px)', gap: 44, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(13,17,23,0.04)', borderRadius: 18, padding: 5, border: `1px solid ${C.border}`, marginBottom: 36, overflowX: 'auto' }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '10px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.22s', flexShrink: 0, background: activeTab === tab ? C.ink : 'transparent', color: activeTab === tab ? '#fff' : C.inkMuted, boxShadow: activeTab === tab ? '0 4px 14px rgba(13,17,23,0.2)' : 'none' }}>
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeTab === 'Overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>

                  {/* About */}
                  {school.description && (
                    <div style={{ marginBottom: 36, padding: '28px 30px', background: 'linear-gradient(135deg,rgba(184,134,11,0.04),rgba(184,134,11,0.02))', border: `1px solid ${C.goldBdr}`, borderRadius: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 4, height: 26, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                        <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 24, color: C.ink }}>About {school.name}</h2>
                      </div>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: C.inkMuted, lineHeight: 1.88, margin: 0 }}>{school.description}</p>
                    </div>
                  )}

                  {/* School details grid — Board & Founded Year prominently shown */}
                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 22, color: C.ink }}>School Details</h2>
                    </div>

                    {/* Highlighted Board + Founded Year row */}
                    {(boards.length > 0 || school.foundingYear) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 10 }}>
                        {boards.length > 0 && (
                          <motion.div whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(184,134,11,0.18)' }}
                            style={{ background: 'linear-gradient(135deg,rgba(184,134,11,0.12),rgba(184,134,11,0.05))', border: `1.5px solid ${C.goldBdr}`, borderRadius: 16, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpenCheck style={{ width: 15, height: 15, color: C.gold }} />
                              </div>
                              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gold }}>Curriculum Board</span>
                            </div>
                            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 20, color: C.gold }}>{boards.join(', ')}</div>
                          </motion.div>
                        )}
                        {school.foundingYear && (
                          <motion.div whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(13,17,23,0.10)' }}
                            style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(13,17,23,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar style={{ width: 15, height: 15, color: C.inkFaint }} />
                              </div>
                              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.inkFaint }}>Founded Year</span>
                            </div>
                            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 20, color: C.ink }}>{school.foundingYear}</div>
                            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint, marginTop: 3 }}>{new Date().getFullYear() - school.foundingYear} years of excellence</div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 10 }}>
                      <StatCard icon={Building2}    label="School Type"   value={formatLabel(school.schoolType)} />
                      <StatCard icon={Users}        label="Gender Policy" value={formatLabel(school.genderPolicy)} />
                      <StatCard icon={Mic}          label="Medium"        value={school.mediumOfInstruction} />
                      <StatCard icon={GraduationCap} label="Classes"     value={school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null} />
                      <StatCard icon={Award}        label="Recognition"   value={school.recognition} />
                      <StatCard icon={Users}        label="Students"      value={school.totalStudents?.toLocaleString('en-IN')} />
                      <StatCard icon={BookOpen}     label="Teacher Ratio" value={school.studentTeacherRatio} />
                    </div>
                  </div>

                  {/* Tags */}
                  {[
                    { label: '🏗️ Facilities', items: school.facilities as string[], color: 'gold' as const },
                    { label: '⚽ Sports', items: school.sports as string[], color: 'green' as const },
                    { label: '🎭 Extra Curricular', items: school.extraCurricular as string[], color: 'purple' as const },
                    { label: '🗣️ Languages', items: school.languagesOffered as string[], color: 'blue' as const },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.label} style={{ marginBottom: 24 }}>
                      <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 10 }}>{g.label}</h3>
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
                <motion.div key="fa" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { title: 'Facilities & Infrastructure', items: school.facilities as string[], color: 'gold' as const, emoji: '🏗️' },
                    { title: 'Sports', items: school.sports as string[], color: 'green' as const, emoji: '⚽' },
                    { title: 'Extra Curricular', items: school.extraCurricular as string[], color: 'purple' as const, emoji: '🎭' },
                    { title: 'Languages Offered', items: school.languagesOffered as string[], color: 'blue' as const, emoji: '🗣️' },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.title} style={{ ...card, padding: '26px 30px' }}>
                      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{g.emoji}</span> {g.title}
                      </h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {g.items.map(item => <Tag key={item} label={item} color={g.color} />)}
                      </div>
                    </div>
                  ))}
                  {!school.facilities?.length && !school.sports?.length && !school.extraCurricular?.length && !school.languagesOffered?.length && (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Inter,sans-serif', color: C.inkFaint }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🏗️</div>No facility info yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FEES ── */}
              {activeTab === 'Fees' && (
                <motion.div key="fe" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 22 }}>
                    {[
                      { label: 'Monthly Fee From',  value: school.monthlyFeeMin ? `₹${school.monthlyFeeMin.toLocaleString('en-IN')}` : null, icon: '📅' },
                      { label: 'Monthly Fee To',    value: school.monthlyFeeMax ? `₹${school.monthlyFeeMax.toLocaleString('en-IN')}` : null, icon: '📈' },
                      { label: 'Annual / Admission', value: school.annualFee    ? `₹${school.annualFee.toLocaleString('en-IN')}`    : null, icon: '📋' },
                    ].filter(f => f.value).map(f => (
                      <motion.div key={f.label} whileHover={{ y: -3 }} style={{ background: 'linear-gradient(135deg,rgba(184,134,11,0.08),rgba(184,134,11,0.03))', border: `1px solid ${C.goldBdr}`, borderRadius: 22, padding: '32px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{f.label}</div>
                        <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 36, color: C.gold }}>{f.value}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ background: C.goldBg, border: `1px solid ${C.goldBdr}`, borderRadius: 14, padding: '14px 18px', fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted, lineHeight: 1.65 }}>
                    ℹ️ Fees are approximate. Contact school for exact fee schedule.
                  </div>
                </motion.div>
              )}

              {/* ── ADMISSION ── */}
              {activeTab === 'Admission' && (
                <motion.div key="ad" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 28 }}>Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Academic Year', value: school.admissionInfo.academicYear },
                        { label: 'Status', value: school.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed' },
                        school.admissionInfo.lastDate ? { label: 'Last Date', value: school.admissionInfo.lastDate } : null,
                      ].filter(Boolean).map((row: any) => (
                        <div key={row.label} style={{ ...card, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, color: C.inkMuted }}>{row.label}</span>
                          <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 18, color: C.ink }}>{row.value}</span>
                        </div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length > 0 && (
                        <div style={{ ...card, padding: '24px 28px', marginTop: 8 }}>
                          <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 16 }}>Documents Required</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {school.admissionInfo.documentsRequired.map((doc: string) => (
                              <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.inkMuted }}>
                                <CheckCircle2 style={{ width: 15, height: 15, color: C.gold, flexShrink: 0 }} /> {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily: 'Inter,sans-serif', color: C.inkFaint, textAlign: 'center', padding: 72 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === 'Reviews' && (
                <motion.div key="re" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <div style={{ ...card, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 80, color: C.gold, lineHeight: 1 }}>{rating.toFixed(1)}</div>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 16, height: 16, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                      </div>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkFaint, marginTop: 7 }}>{reviews?.total ?? 0} reviews</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      {[5,4,3,2,1].map(star => {
                        const cnt = reviewList.filter(r => Math.round(Number(r.rating)) === star).length
                        const pct = reviews?.total ? Math.round((cnt / reviews.total) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted, width: 8 }}>{star}</span>
                            <Star style={{ width: 11, height: 11, fill: C.gold, color: C.gold, flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(13,17,23,0.07)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + star * 0.08, duration: 0.6, ease: 'easeOut' }}
                                style={{ height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint, width: 30 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviewList.map((r, i) => <ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length && (
                      <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Inter,sans-serif', color: C.inkFaint }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── GALLERY ── */}
              {activeTab === 'Gallery' && (
                <motion.div key="ga" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 28 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
                      {school.galleryImages.map((img, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                          whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(13,17,23,0.18)' }}
                          style={{ aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden', background: '#e9e4dc', cursor: 'pointer' }}>
                          <img src={img} alt={`Gallery ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }}
                            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.07)'}
                            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Inter,sans-serif', color: C.inkFaint }}>
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

              {/* Primary CTA card */}
              <div style={{ ...card, padding: '30px 26px 26px', marginBottom: 14, borderRadius: 26, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />

                {/* Fee display */}
                {school.monthlyFeeMin && (
                  <div style={{ textAlign: 'center', paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Monthly Fee From</div>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}
                      style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 52, color: C.gold, lineHeight: 1, letterSpacing: '-3px' }}>
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </motion.div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 8 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted, marginLeft: 5 }}>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {/* Apply Now */}
                  <motion.div whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href={`/apply/${school.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 20px', borderRadius: 15, background: `linear-gradient(135deg,${C.gold},#9A6F0B)`, color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(184,134,11,0.38)' }}>
                      Apply Now <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </motion.div>

                  {/* ── Request Call Back (replaces phone number) ── */}
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCallModal(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 15, border: `1.5px solid ${C.goldBdr}`, background: C.goldBg, color: C.gold, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <PhoneCall style={{ width: 14, height: 14 }} /> Request Call Back
                  </motion.button>

                  <Link href="/counselling"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 15, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.ink, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    🎓 Get Expert Counselling
                  </Link>

                  {/* Save */}
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 15, cursor: 'pointer', border: `1.5px solid ${saved ? C.gold : C.border}`, background: saved ? C.goldBg : 'transparent', color: saved ? C.gold : C.inkMuted, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                    <Heart style={{ width: 14, height: 14, fill: saved ? C.gold : 'transparent', color: saved ? C.gold : 'currentColor', transition: 'all 0.2s' }} />
                    {saved ? 'Saved to Wishlist' : 'Save School'}
                  </button>

                  {/* Compare */}
                  <Link href={`/compare?add=${school.id}`} onClick={handleCompare}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 15, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.inkMuted, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <GitCompare style={{ width: 14, height: 14 }} /> Compare School
                  </Link>
                </div>

                {/* Website link only — no email, no phone number */}
                {school.websiteUrl && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, marginTop: 18 }}>
                    <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted, textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = C.gold}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = C.inkMuted}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: C.goldBg, border: `1px solid ${C.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Globe style={{ width: 13, height: 13, color: C.gold }} />
                      </div>
                      Visit School Website <ExternalLink style={{ width: 11, height: 11, marginLeft: 2 }} />
                    </a>
                  </div>
                )}
              </div>

              {/* Quick stats card with Board + Founded Year prominently */}
              <div style={{ ...card, padding: '20px 24px', borderRadius: 20 }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Quick Facts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {boards.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><BookOpenCheck style={{ width: 13, height: 13, color: C.gold }} /> Board</span>
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: C.gold }}>{boards.join(', ')}</span>
                    </div>
                  )}
                  {school.foundingYear && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><Calendar style={{ width: 13, height: 13, color: C.gold }} /> Founded</span>
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: C.ink }}>{school.foundingYear}</span>
                    </div>
                  )}
                  {school.classesFrom && school.classesTo && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><GraduationCap style={{ width: 13, height: 13, color: C.gold }} /> Classes</span>
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: C.ink }}>{school.classesFrom} – {school.classesTo}</span>
                    </div>
                  )}
                  {school.totalStudents && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><Users style={{ width: 13, height: 13, color: C.gold }} /> Students</span>
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: C.ink }}>{school.totalStudents.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {school.schoolType && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><Building2 style={{ width: 13, height: 13, color: C.gold }} /> Type</span>
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: C.ink }}>{formatLabel(school.schoolType)}</span>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
