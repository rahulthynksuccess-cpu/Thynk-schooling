'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Star, BadgeCheck, Heart, Share2,
  GitCompare, ArrowRight, GraduationCap, ExternalLink,
  BookOpen, Users, Calendar, Award, Building2,
  BookOpenCheck, Mic, X, CheckCircle2, Zap, Trophy,
  ChevronRight, Sparkles,
} from 'lucide-react'
import { School, Review } from '@/types'

/* ── palette ── */
const C = {
  bg: '#FAF7F2', card: '#FFFFFF', border: 'rgba(13,17,23,0.07)',
  ink: '#0D1117', inkMuted: '#5A6472', inkFaint: '#A0ADB8',
  gold: '#B8860B', goldBg: 'rgba(184,134,11,0.08)', goldBdr: 'rgba(184,134,11,0.2)',
  goldLight: '#E8C547',
}

const card: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 20, boxShadow: '0 2px 20px rgba(13,17,23,0.05)',
}

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

/* ── floating particle for hero ── */
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%', background: 'rgba(184,134,11,0.35)', pointerEvents: 'none' }}
      animate={{ y: [-12, 12, -12], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* ── animated ring for no-cover hero ── */
function HeroRings() {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
      {[340, 520, 700, 880, 1060].map((size, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', borderRadius: '50%',
            width: size, height: size,
            top: -size / 2, left: -size / 2,
            border: `1px solid rgba(184,134,11,${0.18 - i * 0.03})`,
          }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3 + i * 0.8, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* golden cross lines */}
      <div style={{ position: 'absolute', width: 1, height: 200, top: -100, left: -0.5, background: 'linear-gradient(to bottom,transparent,rgba(184,134,11,0.3),transparent)' }} />
      <div style={{ position: 'absolute', height: 1, width: 200, top: -0.5, left: -100, background: 'linear-gradient(to right,transparent,rgba(184,134,11,0.3),transparent)' }} />
    </div>
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

/* ── skeleton ── */
function ProfileSkeleton() {
  return (
    <div style={{ background: C.bg }}>
      <div className="skeleton" style={{ height: 500, borderRadius: 0 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 24, marginTop: -70, marginBottom: 40 }}>
          <div className="skeleton" style={{ width: 128, height: 128, borderRadius: 28, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingTop: 80 }}>
            <div className="skeleton" style={{ height: 36, width: '42%', marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,27vw,360px)', gap: 40 }}>
          <div>
            <div className="skeleton" style={{ height: 52, borderRadius: 14, marginBottom: 36 }} />
            <div className="skeleton" style={{ height: 220, borderRadius: 20, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 20 }} />
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

  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const coverYRaw = useTransform(scrollY, [0, 600], [0, 110])
  const coverY = useSpring(coverYRaw, { stiffness: 80, damping: 20 })

  // random particles — stable across renders
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: 5 + (i * 37 + 13) % 90,
      y: 5 + (i * 53 + 7) % 85,
      size: 2 + (i % 4),
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

  return (
    <div style={{ background: C.bg, paddingBottom: 100 }}>
      <AnimatePresence>{showShare && <ShareToast onClose={() => setShowShare(false)} />}</AnimatePresence>

      {/* ════════════════════ HERO ════════════════════ */}
      <div
        ref={coverRef}
        style={{ position: 'relative', height: 'clamp(380px,50vw,560px)', overflow: 'hidden', background: 'linear-gradient(135deg,#060a14 0%,#0d1829 40%,#0f2642 100%)' }}
      >
        {/* Parallax image or animated background */}
        <motion.div style={{ y: coverY, position: 'absolute', inset: '-20%', insetInline: 0 }}>
          {school.coverImageUrl ? (
            <>
              <img
                src={school.coverImageUrl} alt={school.name}
                style={{ width: '100%', height: '140%', objectFit: 'cover', objectPosition: 'center 30%' }}
              />
              {/* colour grade overlay on real photos */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,10,20,0.45) 0%,rgba(184,134,11,0.08) 100%)', mixBlendMode: 'multiply' }} />
            </>
          ) : (
            /* ── no cover: rich animated dark-gold scene ── */
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* radial ambient glow */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(184,134,11,0.18) 0%,transparent 70%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 40% 40% at 20% 80%,rgba(59,130,246,0.08) 0%,transparent 60%)' }} />
              {/* animated rings */}
              <HeroRings />
              {/* floating particles */}
              {particles.current.map((p, i) => <Particle key={i} {...p} />)}
              {/* centre icon */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2 }}>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 120, height: 120, borderRadius: 32, background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.25)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <GraduationCap style={{ width: 52, height: 52, color: 'rgba(184,134,11,0.55)' }} />
                </motion.div>
              </div>
              {/* subtle noise grain */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
            </div>
          )}
        </motion.div>

        {/* multi-layer gradient vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(6,10,20,0.96) 0%,rgba(6,10,20,0.5) 40%,rgba(6,10,20,0.15) 75%,transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,10,20,0.55) 0%,transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 100%,rgba(184,134,11,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* top-right action buttons */}
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 10, zIndex: 10 }}>
          {[
            { label: saved ? 'Saved' : 'Save', icon: Heart, onClick: () => setSaved(!saved), active: saved },
            { label: 'Share', icon: Share2, onClick: handleShare, active: false },
          ].map((a, i) => (
            <motion.button
              key={i} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}
              onClick={a.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', background: a.active ? 'rgba(184,134,11,0.38)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
            >
              <a.icon style={{ width: 14, height: 14, fill: (i === 0 && saved) ? '#fff' : 'transparent', color: '#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}>
            <Link
              href={`/compare?add=${school.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 99, border: '1px solid rgba(184,134,11,0.4)', background: 'rgba(184,134,11,0.22)', backdropFilter: 'blur(20px)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
            >
              <GitCompare style={{ width: 14, height: 14 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* bottom — badges + name teaser */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(20px,4vw,56px) 36px', zIndex: 5 }}>
          {/* badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}
          >
            {school.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(22,163,74,0.88)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 13px', borderRadius: 100, fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 12px rgba(22,163,74,0.3)' }}>
                <BadgeCheck style={{ width: 12, height: 12 }} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 13px', borderRadius: 100, fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 12px rgba(184,134,11,0.4)' }}>
                <Sparkles style={{ width: 11, height: 11 }} /> Featured School
              </span>
            )}
            {(school.board || []).slice(0, 3).map(b => (
              <span key={b} style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, padding: '5px 13px', borderRadius: 100, fontFamily: 'Inter,sans-serif' }}>{b}</span>
            ))}
          </motion.div>
        </div>

        {/* decorative bottom edge line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right,transparent,rgba(184,134,11,0.4),transparent)' }} />
      </div>

      {/* ════════════════════ PROFILE HEADER ════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,4vw,56px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, marginTop: -64, marginBottom: 44, flexWrap: 'wrap' }}>

          {/* Logo lifted from hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.65, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 128, height: 128, borderRadius: 28, background: '#fff', border: `4px solid ${C.bg}`, boxShadow: '0 12px 40px rgba(13,17,23,0.22)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}
          >
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14 }} />
              : <GraduationCap style={{ width: 54, height: 54, color: C.gold }} />
            }
          </motion.div>

          {/* Name + meta */}
          <motion.div
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ flex: 1, minWidth: 0, paddingBottom: 8 }}
          >
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(28px,4vw,50px)', color: C.ink, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 14 }}>
              {school.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
              {school.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted }}>
                  <MapPin style={{ width: 13, height: 13, color: C.gold, flexShrink: 0 }} />
                  {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              )}
              <motion.div
                whileHover={{ scale: 1.03 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 99, background: C.goldBg, border: `1px solid ${C.goldBdr}`, cursor: 'default' }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                </div>
                <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, color: C.gold }}>{rating.toFixed(1)}</span>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: C.inkFaint }}>({school.totalReviews || 0})</span>
              </motion.div>
              {school.phone && (
                <a href={`tel:${school.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted, textDecoration: 'none' }}>
                  <Phone style={{ width: 12, height: 12 }} /> {school.phone}
                </a>
              )}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
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
                <button
                  key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '11px 22px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                    whiteSpace: 'nowrap', transition: 'all 0.22s', flexShrink: 0,
                    background: activeTab === tab ? C.ink : 'transparent',
                    color: activeTab === tab ? '#fff' : C.inkMuted,
                    boxShadow: activeTab === tab ? '0 4px 14px rgba(13,17,23,0.2)' : 'none',
                  }}
                >
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
                    <div style={{ marginBottom: 40, padding: '28px 32px', background: 'linear-gradient(135deg,rgba(184,134,11,0.04),rgba(184,134,11,0.02))', border: `1px solid ${C.goldBdr}`, borderRadius: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                        <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 26, color: C.ink }}>About {school.name}</h2>
                      </div>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: C.inkMuted, lineHeight: 1.88, margin: 0 }}>{school.description}</p>
                    </div>
                  )}

                  {/* School details grid */}
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <div style={{ width: 4, height: 26, borderRadius: 2, background: `linear-gradient(to bottom,${C.gold},${C.goldLight})`, flexShrink: 0 }} />
                      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 24, color: C.ink }}>School Details</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: 10 }}>
                      <StatCard icon={BookOpenCheck} label="Board"         value={(school.board || []).join(', ')} accent />
                      <StatCard icon={Building2}    label="School Type"   value={school.schoolType} />
                      <StatCard icon={Users}        label="Gender Policy" value={school.genderPolicy} />
                      <StatCard icon={Mic}          label="Medium"        value={school.mediumOfInstruction} />
                      <StatCard icon={GraduationCap} label="Classes"      value={school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null} />
                      <StatCard icon={Calendar}     label="Established"   value={school.foundingYear} />
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
                    <div key={g.label} style={{ marginBottom: 28 }}>
                      <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 12 }}>{g.label}</h3>
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
                  <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 28 }}>Fee Structure</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Monthly Fee (Min)', value: school.monthlyFeeMin ? `₹${school.monthlyFeeMin.toLocaleString('en-IN')}` : null, icon: '💰' },
                      { label: 'Monthly Fee (Max)', value: school.monthlyFeeMax ? `₹${school.monthlyFeeMax.toLocaleString('en-IN')}` : null, icon: '💰' },
                      { label: 'Annual / Admission', value: school.annualFee ? `₹${school.annualFee.toLocaleString('en-IN')}` : null, icon: '📋' },
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
                  {/* Rating summary */}
                  <div style={{ ...card, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 80, color: C.gold, lineHeight: 1 }}>{rating.toFixed(1)}</div>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8 }}>
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 16, height: 16, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                      </div>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkFaint, marginTop: 7 }}>{reviews?.total ?? 0} reviews</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      {[5, 4, 3, 2, 1].map(star => {
                        const cnt = reviewList.filter(r => Math.round(Number(r.rating)) === star).length
                        const pct = reviews?.total ? Math.round((cnt / reviews.total) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted, width: 8 }}>{star}</span>
                            <Star style={{ width: 11, height: 11, fill: C.gold, color: C.gold, flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(13,17,23,0.07)', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + star * 0.08, duration: 0.6, ease: 'easeOut' }}
                                style={{ height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: 99 }}
                              />
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
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                          whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(13,17,23,0.18)' }}
                          style={{ aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden', background: '#e9e4dc', cursor: 'pointer' }}
                        >
                          <img src={img} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }}
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
            <motion.div
              initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28, duration: 0.52 }}
              style={{ position: 'sticky', top: 90 }}
            >
              {/* Primary CTA card */}
              <div style={{ ...card, padding: '30px 28px 26px', marginBottom: 16, borderRadius: 26, overflow: 'hidden', position: 'relative' }}>
                {/* gold shimmer top border */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)` }} />

                {school.monthlyFeeMin && (
                  <div style={{ textAlign: 'center', paddingBottom: 22, marginBottom: 22, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Monthly Fee From</div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}
                      style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 56, color: C.gold, lineHeight: 1, letterSpacing: '-3px' }}
                    >
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </motion.div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 10 }}>
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 13, height: 13, fill: s <= Math.round(rating) ? C.gold : 'transparent', color: s <= Math.round(rating) ? C.gold : '#D0D5DB' }} />)}
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted, marginLeft: 5 }}>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  <motion.div whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href={`/apply/${school.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '17px 20px', borderRadius: 16, background: `linear-gradient(135deg,${C.gold},#9A6F0B)`, color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(184,134,11,0.38)' }}>
                      Apply Now <ArrowRight style={{ width: 15, height: 15 }} />
                    </Link>
                  </motion.div>
                  <Link href="/counselling"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.ink, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'border-color 0.2s' }}>
                    📞 Get Counselling
                  </Link>
                  <button onClick={() => setSaved(!saved)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 16, cursor: 'pointer', border: `1.5px solid ${saved ? C.gold : C.border}`, background: saved ? C.goldBg : 'transparent', color: saved ? C.gold : C.inkMuted, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                    <Heart style={{ width: 14, height: 14, fill: saved ? C.gold : 'transparent', color: saved ? C.gold : 'currentColor', transition: 'all 0.2s' }} />
                    {saved ? 'Saved to Wishlist' : 'Save School'}
                  </button>
                  <Link href={`/compare?add=${school.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.inkMuted, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <GitCompare style={{ width: 14, height: 14 }} /> Compare School
                  </Link>
                </div>

                {/* Contact */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 11, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Contact School</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      school.phone && { href: `tel:${school.phone}`, icon: Phone, text: school.phone },
                      school.email && { href: `mailto:${school.email}`, icon: Mail, text: school.email },
                      school.websiteUrl && { href: school.websiteUrl, icon: Globe, text: 'Visit Website', ext: true },
                    ].filter(Boolean).map((c: any, i) => (
                      <a key={i} href={c.href} target={c.ext ? '_blank' : undefined} rel={c.ext ? 'noopener noreferrer' : undefined}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.inkMuted, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = C.gold}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = C.inkMuted}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.goldBg, border: `1px solid ${C.goldBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <c.icon style={{ width: 13, height: 13, color: C.gold }} />
                        </div>
                        {c.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats card */}
              {(school.classesFrom || school.totalStudents || school.foundingYear) && (
                <div style={{ ...card, padding: '18px 22px', borderRadius: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {school.classesFrom && school.classesTo && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><GraduationCap style={{ width: 13, height: 13, color: C.gold }} /> Classes</span>
                        <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 16, color: C.ink }}>{school.classesFrom} – {school.classesTo}</span>
                      </div>
                    )}
                    {school.totalStudents && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><Users style={{ width: 13, height: 13, color: C.gold }} /> Students</span>
                        <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 16, color: C.ink }}>{school.totalStudents.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {school.foundingYear && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.inkMuted }}><Calendar style={{ width: 13, height: 13, color: C.gold }} /> Established</span>
                        <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 16, color: C.ink }}>{school.foundingYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
