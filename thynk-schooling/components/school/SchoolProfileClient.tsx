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

/* ─────────────────────────────────────────
   DESIGN SYSTEM — Ink + Champagne + Cream
───────────────────────────────────────── */
const T = {
  /* backgrounds */
  bg:        '#F6F3EE',
  surface:   '#FFFFFF',
  surfaceAlt:'#FDFBF8',
  dark:      '#0C0E13',
  darkMid:   '#161B27',

  /* text */
  ink:       '#0C0E13',
  inkSoft:   '#4A505C',
  inkFaint:  '#9098A6',

  /* champagne accent */
  champ:     '#C9A84C',
  champDark: '#8C6A1F',
  champGlow: 'rgba(201,168,76,0.22)',
  champBg:   'rgba(201,168,76,0.08)',
  champLine: 'rgba(201,168,76,0.28)',

  /* semantic */
  green:     '#1A9E5C',
  greenBg:   'rgba(26,158,92,0.08)',
  blue:      '#2563EB',
  blueBg:    'rgba(37,99,235,0.08)',
  purple:    '#7C3AED',
  purpleBg:  'rgba(124,58,237,0.08)',
  red:       '#DC2626',

  /* borders */
  bdr:       'rgba(12,14,19,0.08)',
  bdrSoft:   'rgba(12,14,19,0.05)',
}

/* helpers */
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: T.surface,
  border: `1px solid ${T.bdr}`,
  borderRadius: 24,
  boxShadow: '0 2px 24px rgba(12,14,19,0.055)',
  ...extra,
})

function fmt(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    .replace('Co Educational Boys Girls','Co-Educational')
    .replace('Co Educational','Co-Educational')
    .replace(/\bCbse\b/,'CBSE').replace(/\bIcse\b/,'ICSE')
    .replace(/\bIb\b/,'IB').replace('K12','K–12')
}

const TABS = ['Overview','Facilities','Fees','Admission','Reviews','Gallery']

/* ─── GLOBAL STYLES ─────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes shimmer {
    0%   { background-position: -400% 0 }
    100% { background-position: 400% 0 }
  }
  @keyframes pulse-ring {
    0%,100% { opacity: 0.35; transform: scale(1) }
    50%      { opacity: 0.65; transform: scale(1.06) }
  }
  @keyframes float-up {
    0%,100% { transform: translateY(0) }
    50%      { transform: translateY(-8px) }
  }
  @keyframes grain {
    0%,100% { transform: translate(0,0) }
    20%      { transform: translate(-2%,-3%) }
    40%      { transform: translate(-4%,1%) }
    60%      { transform: translate(2%,-1%) }
    80%      { transform: translate(-1%,3%) }
  }
  @keyframes champ-glow {
    0%,100% { box-shadow: 0 0 0 rgba(201,168,76,0) }
    50%      { box-shadow: 0 0 28px rgba(201,168,76,0.45) }
  }

  .skel {
    background: linear-gradient(90deg,#EDE9E2 25%,#F6F3EE 50%,#EDE9E2 75%);
    background-size: 400% 100%;
    animation: shimmer 1.6s ease-in-out infinite;
    border-radius: 12px;
  }
  .tab-btn {
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  }
  .tab-btn:hover { color: ${T.ink} !important; }
`

/* ─── GRAIN OVERLAY ─────────────────────────────────────── */
function Grain() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat', backgroundSize: '180px',
      animation: 'grain 8s steps(1) infinite',
      mixBlendMode: 'multiply',
      opacity: 0.6,
    }} />
  )
}

/* ─── CHAMP LINE ─────────────────────────────────────────── */
function ChampLine({ width = '100%' }: { width?: string }) {
  return (
    <div style={{
      width, height: 1,
      background: `linear-gradient(90deg, transparent, ${T.champ}, transparent)`,
    }} />
  )
}

/* ─── SECTION HEADING ────────────────────────────────────── */
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: sub ? 6 : 0 }}>
        <div style={{ width: 3, height: 22, borderRadius: 2, background: `linear-gradient(to bottom, ${T.champ}, ${T.champDark})`, flexShrink: 0 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 26, color: T.ink, letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {sub && <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.inkFaint, paddingLeft: 15 }}>{sub}</p>}
    </div>
  )
}

/* ─── BADGE CHIP ─────────────────────────────────────────── */
function Chip({
  label, color = 'champ', size = 'md'
}: {
  label: string
  color?: 'champ'|'green'|'blue'|'purple'|'neutral'
  size?: 'sm'|'md'
}) {
  const map = {
    champ:   { bg: T.champBg,   b: T.champLine, t: T.champDark },
    green:   { bg: T.greenBg,   b: 'rgba(26,158,92,0.2)',  t: '#15783E' },
    blue:    { bg: T.blueBg,    b: 'rgba(37,99,235,0.2)',  t: '#1D4ED8' },
    purple:  { bg: T.purpleBg,  b: 'rgba(124,58,237,0.2)', t: '#6D28D9' },
    neutral: { bg: 'rgba(12,14,19,0.05)', b: T.bdr, t: T.inkSoft },
  }
  const s = map[color]
  const pad = size === 'sm' ? '4px 10px' : '6px 14px'
  const fs = size === 'sm' ? 11 : 12
  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      style={{
        display: 'inline-flex', alignItems: 'center',
        background: s.bg, border: `1px solid ${s.b}`, color: s.t,
        fontFamily: 'Outfit, sans-serif', fontSize: fs, fontWeight: 600,
        padding: pad, borderRadius: 100, cursor: 'default',
        transition: 'all 0.18s',
      }}
    >
      {label}
    </motion.span>
  )
}

/* ─── ICON STAT ROW ──────────────────────────────────────── */
function FactRow({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `1px solid ${T.bdrSoft}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: accent ? T.champBg : 'rgba(12,14,19,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon style={{ width: 13, height: 13, color: accent ? T.champ : T.inkFaint }} />
        </div>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.inkSoft }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 17, color: accent ? T.champ : T.ink }}>{value}</span>
    </div>
  )
}

/* ─── METRIC CARD ─────────────────────────────────────────── */
function MetricCard({ icon, value, label, sub, dark }: { icon: string; value: string; label: string; sub?: string; dark?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background: dark
          ? 'linear-gradient(145deg, #0C0E13 0%, #161B27 100%)'
          : T.surface,
        border: `1px solid ${dark ? 'rgba(201,168,76,0.18)' : T.bdr}`,
        borderRadius: 20,
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {dark && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${T.champ}, transparent)`,
        }} />
      )}
      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontWeight: 700, fontSize: 30,
        color: dark ? '#F0D98A' : T.champ,
        lineHeight: 1, letterSpacing: '-0.02em',
        marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: dark ? 'rgba(255,255,255,0.35)' : T.inkFaint,
      }}>
        {label}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'Outfit, sans-serif', fontSize: 10,
          color: dark ? 'rgba(255,255,255,0.18)' : T.inkFaint,
          marginTop: 3,
        }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
}

/* ─── FACILITY CARD ──────────────────────────────────────── */
function FacilityCard({ label, emoji, accent }: { label: string; emoji: string; accent: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: `0 14px 36px ${accent}` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: T.surface,
        border: `1px solid ${T.bdr}`,
        borderRadius: 16,
        padding: '18px 14px',
        textAlign: 'center',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at top, ${accent} 0%, transparent 65%)`,
        opacity: 0.45, pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 600, color: T.ink, lineHeight: 1.4 }}>{label}</div>
    </motion.div>
  )
}

/* ─── REVIEW CARD ────────────────────────────────────────── */
function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = review.parentName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const rating = Number(review.rating) || 0
  const palettes = [
    ['#C9A84C','#8C6A1F'], ['#1A9E5C','#0D6B3D'], ['#2563EB','#1D4ED8'],
    ['#7C3AED','#5B21B6'], ['#DC2626','#991B1B'],
  ]
  const [c1, c2] = palettes[i % palettes.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -3 }}
      style={{
        ...card(),
        padding: '28px 30px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.22s, box-shadow 0.22s',
      }}
    >
      {/* accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(to bottom, ${c1}, ${c2})`,
        borderRadius: '24px 0 0 24px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16, paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 18, color: '#fff', flexShrink: 0,
            boxShadow: `0 6px 18px ${c1}55`,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 15, color: T.ink }}>{review.parentName}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* rating pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: T.champBg, border: `1px solid ${T.champLine}`,
          padding: '6px 12px', borderRadius: 99, flexShrink: 0,
        }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} style={{ width: 10, height: 10, fill: s <= rating ? T.champ : 'transparent', color: s <= rating ? T.champ : '#CCC' }} />
          ))}
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: T.champ, marginLeft: 4 }}>{rating}.0</span>
        </div>
      </div>

      <div style={{ paddingLeft: 8 }}>
        {review.title && (
          <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: T.ink, marginBottom: 8, lineHeight: 1.25 }}>{review.title}</h4>
        )}
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: T.inkSoft, lineHeight: 1.85 }}>{review.body}</p>

        {review.schoolReply && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 14,
            background: T.champBg,
            border: `1px solid ${T.champLine}`,
            borderLeft: `3px solid ${T.champ}`,
          }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, color: T.champ, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              School Response
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.inkSoft, lineHeight: 1.7 }}>{review.schoolReply}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ─── TOAST ──────────────────────────────────────────────── */
function Toast({ message, variant = 'dark', onClose }: { message: string; variant?: 'dark'|'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t) }, [onClose])
  const bg = variant === 'success' ? '#15532A' : '#0C0E13'
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.96 }}
      style={{
        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 500, background: bg, color: '#fff',
        borderRadius: 16, padding: '14px 22px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 20px 50px rgba(12,14,19,0.4)',
        fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600,
        whiteSpace: 'nowrap', border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      <CheckCircle2 style={{ width: 16, height: 16, color: '#4ADE80', flexShrink: 0 }} />
      {message}
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '3px 7px', color: '#fff', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
        <X style={{ width: 11, height: 11 }} />
      </button>
    </motion.div>
  )
}

/* ─── REQUEST CALL MODAL ─────────────────────────────────── */
function RequestCallModal({ school, onClose, onSuccess }: { school: School; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [classFor, setClassFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) { setError('Name and phone are required'); return }
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) { setError('Enter a valid 10-digit number'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: school.id, action: 'request_call', parentName: name, phone, childName, classApplyingFor: classFor, source: 'request_call' }) })
      if (!res.ok) throw new Error('Failed')
      onSuccess(); onClose()
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const fields = [
    { label: 'Your Name *', value: name, onChange: setName, placeholder: 'Full name', type: 'text' },
    { label: 'Mobile Number *', value: phone, onChange: setPhone, placeholder: '10-digit mobile', type: 'tel' },
    { label: "Child's Name", value: childName, onChange: setChildName, placeholder: 'Optional', type: 'text' },
    { label: 'Applying for Class', value: classFor, onChange: setClassFor, placeholder: 'e.g. Grade 5, Nursery', type: 'text' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(12,14,19,0.7)', backdropFilter: 'blur(12px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.22,1,0.36,1] }}
        style={{ background: '#fff', borderRadius: 32, padding: '44px', width: '100%', maxWidth: 460, boxShadow: '0 40px 120px rgba(12,14,19,0.28)', position: 'relative', overflow: 'hidden' }}
      >
        <ChampLine />
        <div style={{ paddingTop: 28 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(12,14,19,0.05)', border: 'none', cursor: 'pointer', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14, color: T.inkSoft }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${T.champ}, ${T.champDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${T.champGlow}` }}>
              <PhoneCall style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 26, color: T.ink, lineHeight: 1.1 }}>Request a Call Back</h2>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: T.inkFaint, marginTop: 3 }}>{school.name} will call within 24 hours</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map(f => (
              <div key={f.label}>
                <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 600, color: T.inkFaint, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</label>
                <input
                  type={f.type} value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${T.bdr}`, fontFamily: 'Outfit, sans-serif', fontSize: 14, color: T.ink, outline: 'none', background: T.surfaceAlt, transition: 'border-color 0.18s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.champ)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.bdr)}
                />
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.red }}>
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={handleSubmit} disabled={loading}
            style={{ marginTop: 24, width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: loading ? '#ccc' : `linear-gradient(135deg, ${T.champ}, ${T.champDark})`, color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 8px 28px ${T.champGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Submitting…' : <><PhoneCall style={{ width: 15, height: 15 }} /> Request Call Back</>}
          </motion.button>

          <p style={{ marginTop: 14, fontFamily: 'Outfit, sans-serif', fontSize: 11, color: T.inkFaint, textAlign: 'center', lineHeight: 1.6 }}>
            🔒 Info shared only with this school · Protected by our privacy policy
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── SKELETON ───────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <div className="skel" style={{ height: 380, borderRadius: 0 }} />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 24, marginTop: -60, marginBottom: 48 }}>
          <div className="skel" style={{ width: 110, height: 110, borderRadius: 26, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingTop: 68 }}>
            <div className="skel" style={{ height: 32, width: '38%', marginBottom: 12 }} />
            <div className="skel" style={{ height: 14, width: '22%' }} />
          </div>
        </div>
        <div className="skel" style={{ height: 80, borderRadius: 20, marginBottom: 40 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 36 }}>
          <div>
            <div className="skel" style={{ height: 54, borderRadius: 16, marginBottom: 32 }} />
            <div className="skel" style={{ height: 200, borderRadius: 24 }} />
          </div>
          <div className="skel" style={{ height: 460, borderRadius: 28 }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { scrollY } = useScroll()
  const coverYRaw = useTransform(scrollY, [0, 500], [0, 90])
  const coverY = useSpring(coverYRaw, { stiffness: 80, damping: 22 })

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`, { cache: 'no-store' }).then(r => r.json()).then(d => d.school ?? d),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', school?.slug ?? slug],
    queryFn: () => fetch(`/api/schools/${school?.slug ?? slug}/reviews?limit=6`, { cache: 'no-store' }).then(r => r.ok ? r.json() : ({ data: [], total: 0 })).catch(() => ({ data: [], total: 0 })),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setShowShare(true)
  }

  const createLead = useCallback(async (source: string, schoolId: string) => {
    try { await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, action: 'create_lead', source }) }) } catch {}
  }, [])

  const handleSave = () => {
    if (!saved && school) createLead('save', school.id)
    setSaved(!saved)
    if (!saved) setToast('Saved to your wishlist ✦')
  }

  if (isLoading) return <ProfileSkeleton />
  if (!school) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: T.bg }}>
      <style>{GLOBAL_CSS}</style>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: 72 }}>🏫</motion.div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 34, color: T.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding: '13px 32px', borderRadius: 14, background: T.ink, color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Browse Schools</Link>
    </div>
  )

  const reviewList = reviews?.data ?? []
  const rating = Number(school.avgRating) || 0
  const boards = school.board || []
  const yearsOld = school.foundingYear ? new Date().getFullYear() - school.foundingYear : 0

  const heroStats = [
    school.foundingYear ? { icon: '🏛', value: school.foundingYear.toString(), label: 'Established', sub: yearsOld > 0 ? `${yearsOld} yrs` : '' } : null,
    school.totalStudents ? { icon: '👨‍🎓', value: school.totalStudents.toLocaleString('en-IN'), label: 'Students', sub: 'Enrolled' } : null,
    school.classesFrom && school.classesTo ? { icon: '📚', value: `${school.classesFrom}–${school.classesTo}`, label: 'Classes', sub: 'Grade range' } : null,
    rating > 0 ? { icon: '⭐', value: rating.toFixed(1), label: 'Rating', sub: `${school.totalReviews ?? 0} reviews` } : null,
    school.studentTeacherRatio ? { icon: '👩‍🏫', value: school.studentTeacherRatio, label: 'Student : Teacher', sub: '' } : null,
  ].filter(Boolean) as { icon: string; value: string; label: string; sub: string }[]

  return (
    <div style={{ background: T.bg, paddingBottom: 120, position: 'relative' }}>
      <style>{GLOBAL_CSS}</style>
      <Grain />

      <AnimatePresence>
        {showShare && <Toast message="Link copied to clipboard" onClose={() => setShowShare(false)} />}
        {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}
        {showCallModal && (
          <RequestCallModal
            school={school}
            onClose={() => setShowCallModal(false)}
            onSuccess={() => setToast('Request submitted! School will call you soon.')}
          />
        )}
      </AnimatePresence>

      {/* ══════ HERO ══════ */}
      <div style={{ position: 'relative', height: 'clamp(320px,42vw,440px)', overflow: 'hidden', background: 'linear-gradient(145deg, #07090F 0%, #0F1520 50%, #0C1628 100%)' }}>
        {/* Parallax image */}
        <motion.div style={{ y: coverY, position: 'absolute', inset: '-18%', insetInline: 0 }}>
          {school.coverImageUrl ? (
            <img src={school.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.38) saturate(0.75)' }} />
          ) : (
            /* Geometric hero background */
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* concentric rings */}
              {[320, 500, 680, 860].map((size, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: `translate(-50%,-50%)`,
                  width: size, height: size, borderRadius: '50%',
                  border: `1px solid rgba(201,168,76,${0.16 - i * 0.03})`,
                  animation: `pulse-ring ${5 + i}s ease-in-out ${i * 0.5}s infinite`,
                  pointerEvents: 'none',
                }} />
              ))}
              {/* floating dots */}
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${6 + (i * 41 + 11) % 88}%`,
                  top: `${8 + (i * 57 + 5) % 84}%`,
                  width: 2 + (i % 3), height: 2 + (i % 3),
                  borderRadius: '50%',
                  background: `rgba(201,168,76,${0.25 + (i % 4) * 0.1})`,
                  animation: `float-up ${3 + i % 4}s ease-in-out ${i * 0.28}s infinite`,
                }} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,9,15,0.98) 0%, rgba(7,9,15,0.55) 45%, rgba(7,9,15,0.1) 80%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(7,9,15,0.65) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${T.champ}66, transparent)` }} />

        {/* Action buttons */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
          {[
            { label: saved ? 'Saved' : 'Save', icon: Heart, onClick: handleSave, active: saved },
            { label: 'Share', icon: Share2, onClick: handleShare, active: false },
          ].map((a, i) => (
            <motion.button
              key={i} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.92 }}
              onClick={a.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 99, cursor: 'pointer',
                border: `1px solid ${a.active ? T.champLine : 'rgba(255,255,255,0.16)'}`,
                background: a.active ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600, color: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
              }}
            >
              <a.icon style={{ width: 13, height: 13, fill: (i === 0 && saved) ? '#fff' : 'transparent', color: '#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale: 1.06, y: -2 }}>
            <Link href={`/compare?add=${school.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: `1px solid ${T.champLine}`, background: 'rgba(201,168,76,0.18)', backdropFilter: 'blur(20px)', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              <GitCompare style={{ width: 13, height: 13 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(20px,5vw,60px) 36px', zIndex: 5 }}>
          {/* badges row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {school.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(26,158,92,0.85)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: 'Outfit, sans-serif' }}>
                <BadgeCheck style={{ width: 11, height: 11 }} /> Verified
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `rgba(201,168,76,0.88)`, backdropFilter: 'blur(12px)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: 'Outfit, sans-serif', animation: 'champ-glow 2.4s ease-in-out infinite' }}>
                <Sparkles style={{ width: 10, height: 10 }} /> Featured
              </span>
            )}
            {boards.slice(0, 2).map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, fontFamily: 'Outfit, sans-serif' }}>{b}</span>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }}
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(28px,5vw,56px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.025em', marginBottom: 16, textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}
          >
            {school.name}
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {school.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif', fontSize: 12, padding: '5px 13px', borderRadius: 99 }}>
                <MapPin style={{ width: 11, height: 11 }} />
                {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
              </span>
            )}
            {school.classesFrom && school.classesTo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif', fontSize: 12, padding: '5px 13px', borderRadius: 99 }}>
                <GraduationCap style={{ width: 11, height: 11 }} /> Class {school.classesFrom}–{school.classesTo}
              </span>
            )}
            {rating > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(201,168,76,0.22)', backdropFilter: 'blur(10px)', border: `1px solid ${T.champLine}`, color: '#F0D98A', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 99 }}>
                <Star style={{ width: 11, height: 11, fill: '#F0D98A', color: '#F0D98A' }} /> {rating.toFixed(1)} · {school.totalReviews ?? 0} reviews
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* ══════ LAYOUT ══════ */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px,4vw,56px)' }}>

        {/* Profile avatar strip */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, marginTop: -54, marginBottom: 40, flexWrap: 'wrap' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
            style={{ width: 108, height: 108, borderRadius: 26, background: '#fff', border: `3.5px solid ${T.bg}`, boxShadow: '0 14px 44px rgba(12,14,19,0.22)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, position: 'relative' }}
          >
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
              : <GraduationCap style={{ width: 44, height: 44, color: T.champ }} />}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}
            style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(22px,3vw,38px)', color: T.ink, lineHeight: 1.05, letterSpacing: '-0.022em', marginBottom: 10 }}>
              {school.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {school.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.inkSoft }}>
                  <MapPin style={{ width: 12, height: 12, color: T.champ, flexShrink: 0 }} />
                  {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              )}
              {boards.length > 0 && <Chip label={boards.join(' · ')} color="champ" />}
              {school.foundingYear && <Chip label={`Est. ${school.foundingYear}`} color="neutral" />}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.champ, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe style={{ width: 12, height: 12 }} /> Visit Website <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── STATS STRIP ── */}
        {heroStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
            style={{ marginBottom: 44 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${heroStats.length}, 1fr)`,
              background: 'linear-gradient(145deg, #0C0E13 0%, #161B27 100%)',
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(12,14,19,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              {/* shimmer */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(201,168,76,0.055) 50%, transparent 65%)', backgroundSize: '300% 100%', animation: 'shimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
              {/* top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${T.champ}, rgba(240,217,138,0.9), ${T.champ}, transparent)` }} />

              {heroStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.07 }}
                  style={{
                    textAlign: 'center', padding: '28px 16px',
                    borderRight: i < heroStats.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 30, color: '#F0D98A', lineHeight: 1, letterSpacing: '-0.025em' }}>{s.value}</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.32)', marginTop: 8 }}>{s.label}</div>
                  {s.sub && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.16)', marginTop: 3 }}>{s.sub}</div>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════ TWO-COLUMN LAYOUT ══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,360px)', gap: 40, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

            {/* Tab bar */}
            <div style={{
              display: 'flex', gap: 2,
              background: 'rgba(12,14,19,0.04)',
              borderRadius: 18, padding: 5,
              border: `1px solid ${T.bdr}`,
              marginBottom: 36, overflowX: 'auto',
            }}>
              {TABS.map(tab => (
                <motion.button
                  key={tab} onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.95 }}
                  className="tab-btn"
                  style={{
                    padding: '10px 20px', borderRadius: 13, border: 'none',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: activeTab === tab ? T.ink : 'transparent',
                    color: activeTab === tab ? '#fff' : T.inkFaint,
                    boxShadow: activeTab === tab ? '0 4px 14px rgba(12,14,19,0.2)' : 'none',
                  }}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeTab === 'Overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {school.description && (
                    <div style={{
                      marginBottom: 36, padding: '30px 32px',
                      background: T.surfaceAlt,
                      border: `1px solid ${T.champLine}`,
                      borderRadius: 24, position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${T.champ}, transparent)` }} />
                      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${T.champGlow}, transparent 70%)`, pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.champBg, border: `1px solid ${T.champLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen style={{ width: 14, height: 14, color: T.champ }} />
                        </div>
                        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 24, color: T.ink }}>About the School</h2>
                      </div>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, color: T.inkSoft, lineHeight: 1.9 }}>{school.description}</p>
                    </div>
                  )}

                  {/* School Details */}
                  <div style={{ marginBottom: 36 }}>
                    <SectionHead title="School Details" />
                    <div style={{ ...card(), padding: '8px 20px' }}>
                      <FactRow icon={BookOpenCheck} label="Curriculum Board" value={boards.join(', ')} accent />
                      <FactRow icon={Calendar} label="Founded" value={school.foundingYear ? `${school.foundingYear}${yearsOld > 0 ? ` · ${yearsOld} years` : ''}` : null} />
                      <FactRow icon={Building2} label="School Type" value={fmt(school.schoolType)} />
                      <FactRow icon={Users} label="Gender Policy" value={fmt(school.genderPolicy)} />
                      <FactRow icon={Mic} label="Medium of Instruction" value={school.mediumOfInstruction} />
                      <FactRow icon={GraduationCap} label="Classes" value={school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null} />
                      <FactRow icon={Users} label="Total Students" value={school.totalStudents?.toLocaleString('en-IN')} />
                      <FactRow icon={BookOpen} label="Student : Teacher Ratio" value={school.studentTeacherRatio} />
                      <FactRow icon={Award} label="Recognition" value={school.recognition} />
                    </div>
                  </div>

                  {/* Tag groups */}
                  {[
                    { label: 'Facilities', emoji: '🏗️', items: school.facilities as string[], color: 'champ' as const },
                    { label: 'Sports', emoji: '⚽', items: school.sports as string[], color: 'green' as const },
                    { label: 'Extra Curricular', emoji: '🎭', items: school.extraCurricular as string[], color: 'purple' as const },
                    { label: 'Languages', emoji: '🗣️', items: school.languagesOffered as string[], color: 'blue' as const },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.label} style={{ marginBottom: 26 }}>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{g.emoji}</span> {g.label}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {g.items.slice(0, 12).map(item => <Chip key={item} label={item} color={g.color} />)}
                        {g.items.length > 12 && <Chip label={`+${g.items.length - 12} more`} color="neutral" />}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── FACILITIES ── */}
              {activeTab === 'Facilities' && (
                <motion.div key="fa" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {[
                    { title: 'Infrastructure & Facilities', items: school.facilities as string[], accent: 'rgba(201,168,76,0.12)', icons: ['🏊','🏋️','🔬','📖','🎨','🖥️','🍽️','🚌','⚽','🎭','📚','🏥'] },
                    { title: 'Sports', items: school.sports as string[], accent: 'rgba(26,158,92,0.12)', icons: ['⚽','🏏','🏸','🏊','🎾','🏐','🏀','🤸','🥊','🏑','🎱','🏓'] },
                    { title: 'Extra Curricular Activities', items: school.extraCurricular as string[], accent: 'rgba(124,58,237,0.12)', icons: ['🎭','🎵','🎨','📸','💃','🎬','🗣️','✍️','🤖','🔭','🎯','🎪'] },
                    { title: 'Languages Offered', items: school.languagesOffered as string[], accent: 'rgba(37,99,235,0.12)', icons: ['🇮🇳','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇷🇺','🇨🇳','🇸🇦','🌍','📖','✏️','🔤'] },
                  ].filter(g => g.items?.length > 0).map((g, gi) => (
                    <motion.div key={g.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }} style={{ marginBottom: 24 }}>
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 22, color: T.ink, marginBottom: 16 }}>{g.title}</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                        {g.items.map((item, ii) => (
                          <FacilityCard key={item} label={item} emoji={g.icons[ii % g.icons.length]} accent={g.accent} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {!school.facilities?.length && !school.sports?.length && !school.extraCurricular?.length && !school.languagesOffered?.length && (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Outfit, sans-serif', color: T.inkFaint }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🏗️</div>No facility info available yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FEES ── */}
              {activeTab === 'Fees' && (
                <motion.div key="fe" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <SectionHead title="Fee Structure" sub="Approximate fees — contact school for exact details" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Monthly Fee (From)', value: school.monthlyFeeMin, icon: '📅', dark: true },
                      { label: 'Monthly Fee (To)',   value: school.monthlyFeeMax, icon: '📈', dark: false },
                      { label: 'Annual / Admission', value: school.annualFee,    icon: '📋', dark: false },
                    ].filter(f => f.value).map((f, i) => (
                      <motion.div
                        key={f.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        style={{
                          background: f.dark
                            ? 'linear-gradient(145deg, #0C0E13 0%, #161B27 100%)'
                            : T.surface,
                          border: `1.5px solid ${f.dark ? T.champLine : T.bdr}`,
                          borderRadius: 24, padding: '30px 24px',
                          textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'default',
                        }}
                      >
                        {f.dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.champ}, transparent)` }} />}
                        <div style={{ fontSize: 34, marginBottom: 10 }}>{f.icon}</div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: f.dark ? 'rgba(255,255,255,0.35)' : T.inkFaint, marginBottom: 8 }}>
                          {f.label}
                        </div>
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 40, color: f.dark ? '#F0D98A' : T.champ, lineHeight: 1, letterSpacing: '-2px' }}>
                          ₹{(f.value as number).toLocaleString('en-IN')}
                        </div>
                        {f.dark && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 8 }}>per month</div>}
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ background: T.champBg, border: `1px solid ${T.champLine}`, borderRadius: 14, padding: '14px 18px', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: T.inkSoft, lineHeight: 1.65 }}>
                    ℹ️ Fees listed are indicative. Contact the school for the official fee schedule.
                  </div>
                </motion.div>
              )}

              {/* ── ADMISSION ── */}
              {activeTab === 'Admission' && (
                <motion.div key="ad" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <SectionHead title="Admission Information" />
                  {school.admissionInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Academic Year', value: school.admissionInfo.academicYear, icon: '📅' },
                        { label: 'Status', value: school.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed', icon: '🚪' },
                        school.admissionInfo.lastDate ? { label: 'Last Date', value: school.admissionInfo.lastDate, icon: '⏰' } : null,
                      ].filter(Boolean).map((row: any) => (
                        <motion.div key={row.label} whileHover={{ x: 4 }}
                          style={{ ...card(), padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{row.icon}</span>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: T.inkSoft }}>{row.label}</span>
                          </div>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 18, color: T.ink }}>{row.value}</span>
                        </motion.div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length > 0 && (
                        <div style={{ ...card(), padding: '26px 28px', marginTop: 8 }}>
                          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: T.ink, marginBottom: 18 }}>Documents Required</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {school.admissionInfo.documentsRequired.map((doc: string, i: number) => (
                              <motion.div key={doc} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.055 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(12,14,19,0.025)', border: `1px solid ${T.bdrSoft}` }}>
                                <div style={{ width: 22, height: 22, borderRadius: 7, background: T.champBg, border: `1px solid ${T.champLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <CheckCircle2 style={{ width: 12, height: 12, color: T.champ }} />
                                </div>
                                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: T.inkSoft }}>{doc}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'Outfit, sans-serif', color: T.inkFaint, textAlign: 'center', padding: 72 }}>Admission details not available.</p>
                  )}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === 'Reviews' && (
                <motion.div key="re" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {/* Summary bar */}
                  <div style={{
                    background: 'linear-gradient(145deg, #0C0E13 0%, #161B27 100%)',
                    borderRadius: 24, padding: '32px 36px', marginBottom: 28,
                    display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap',
                    position: 'relative', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.champ}, transparent)` }} />
                    {/* Big number */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
                        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 88, color: '#F0D98A', lineHeight: 1, letterSpacing: '-4px' }}>
                        {rating.toFixed(1)}
                      </motion.div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
                        {[1,2,3,4,5].map(s => (
                          <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + s * 0.07 }}>
                            <Star style={{ width: 16, height: 16, fill: s <= Math.round(rating) ? '#F0D98A' : 'transparent', color: s <= Math.round(rating) ? '#F0D98A' : 'rgba(255,255,255,0.18)' }} />
                          </motion.div>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 6 }}>{reviews?.total ?? 0} reviews</div>
                    </div>
                    {/* Bar chart */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      {[5,4,3,2,1].map((star, si) => {
                        const cnt = reviewList.filter(r => Math.round(Number(r.rating)) === star).length
                        const pct = reviews?.total ? Math.round((cnt / reviews.total) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: si < 4 ? 12 : 0 }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.38)', width: 10 }}>{star}</span>
                            <Star style={{ width: 10, height: 10, fill: T.champ, color: T.champ, flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.4 + si * 0.09, duration: 0.8, ease: 'easeOut' }}
                                style={{ height: '100%', background: `linear-gradient(90deg, ${T.champ}, #F0D98A)`, borderRadius: 99 }}
                              />
                            </div>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 28 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviewList.map((r, i) => <ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length && (
                      <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Outfit, sans-serif', color: T.inkFaint }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── GALLERY ── */}
              {activeTab === 'Gallery' && (
                <motion.div key="ga" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <SectionHead title="School Gallery" />
                  {school.galleryImages?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                      {school.galleryImages.map((img, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.055 }}
                          whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(12,14,19,0.2)' }}
                          style={{ aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden', background: '#EDE9E2', cursor: 'pointer' }}
                        >
                          <img src={img} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.09)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'Outfit, sans-serif', color: T.inkFaint }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🖼️</div>No gallery images yet.
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ── RIGHT SIDEBAR ── */}
          <div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26, duration: 0.5 }}
              style={{ position: 'sticky', top: 86 }}>

              {/* PRIMARY CTA CARD */}
              <div style={{
                background: 'linear-gradient(155deg, #0C0E13 0%, #161B27 100%)',
                borderRadius: 28, overflow: 'hidden', position: 'relative',
                marginBottom: 14, padding: '34px 26px 26px',
                boxShadow: '0 24px 60px rgba(12,14,19,0.28)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${T.champ}, #F0D98A, ${T.champ}, transparent)` }} />
                {/* Bottom glow orb */}
                <div style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />

                {/* Fee display */}
                {school.monthlyFeeMin && (
                  <div style={{ textAlign: 'center', paddingBottom: 22, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>Monthly Fee Starting</div>
                    <motion.div
                      initial={{ scale: 0.78, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.36, duration: 0.42 }}
                      style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 52, color: '#F0D98A', lineHeight: 1, letterSpacing: '-3px' }}
                    >
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </motion.div>
                    {rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(rating) ? T.champ : 'transparent', color: s <= Math.round(rating) ? T.champ : 'rgba(255,255,255,0.14)' }} />)}
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginLeft: 5 }}>{rating.toFixed(1)} rating</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link href={`/apply/${school.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 20px', borderRadius: 16, background: `linear-gradient(135deg, ${T.champ}, ${T.champDark})`, color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 10px 28px ${T.champGlow}`, letterSpacing: '0.01em' }}>
                      Apply Now <ArrowRight style={{ width: 15, height: 15 }} />
                    </Link>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCallModal(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 16, border: `1.5px solid ${T.champLine}`, background: 'rgba(201,168,76,0.1)', color: '#F0D98A', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <PhoneCall style={{ width: 13, height: 13 }} /> Request Call Back
                  </motion.button>

                  <Link href="/counselling"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                    🎓 Get Expert Counselling
                  </Link>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button onClick={handleSave}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${saved ? T.champLine : 'rgba(255,255,255,0.08)'}`, background: saved ? 'rgba(201,168,76,0.12)' : 'transparent', color: saved ? '#F0D98A' : 'rgba(255,255,255,0.45)', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600 }}>
                      <Heart style={{ width: 13, height: 13, fill: saved ? '#F0D98A' : 'transparent' }} />
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <Link href={`/compare?add=${school.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <GitCompare style={{ width: 13, height: 13 }} /> Compare
                    </Link>
                  </div>
                </div>
              </div>

              {/* QUICK FACTS CARD */}
              <div style={{ ...card(), padding: '20px 22px' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 9, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4 }}>Quick Facts</div>
                <ChampLine />
                <div style={{ marginTop: 4 }}>
                  <FactRow icon={BookOpenCheck} label="Board"    value={boards.join(', ')}                                            accent />
                  <FactRow icon={Calendar}      label="Founded"  value={school.foundingYear?.toString()} />
                  <FactRow icon={GraduationCap} label="Classes"  value={school.classesFrom && school.classesTo ? `${school.classesFrom}–${school.classesTo}` : null} />
                  <FactRow icon={Users}         label="Students" value={school.totalStudents?.toLocaleString('en-IN')} />
                  <FactRow icon={Building2}     label="Type"     value={fmt(school.schoolType)} />
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
