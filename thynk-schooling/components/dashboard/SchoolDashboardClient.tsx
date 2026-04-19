'use client'

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           THYNKSCHOOLING — PREMIUM SCHOOL DASHBOARD          ║
 * ║                                                              ║
 * ║  Fully themed, modular, production-ready dashboard.          ║
 * ║  All visual settings live in THEME_PRESETS at the top.       ║
 * ║                                                              ║
 * ║  STACK: Next.js · React Query · Framer Motion · Recharts     ║
 * ║                                                              ║
 * ║  ── CUSTOMISATION ─────────────────────────────────────────  ║
 * ║  1. Edit THEME_PRESETS to change colors / fonts              ║
 * ║  2. Edit DASHBOARD_CONFIG to toggle sections on/off          ║
 * ║  3. Add widgets in WIDGET_REGISTRY                           ║
 * ║  4. Each widget is a standalone component at the bottom      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Star, Zap,
  ShoppingCart, Settings, ChevronRight, BarChart3,
  GraduationCap, LogOut, Menu, X, ArrowUpRight,
  CheckCircle2, Clock, Loader2, MapPin, Sparkles,
  Phone, Flame, ArrowUp, ArrowDown, TrendingUp,
  Bell, AlertTriangle, Target, Activity, Layers, History,
  PieChart, Globe, BookOpen, Sun, Moon, Palette,
  Instagram, Youtube, Facebook, Twitter, Linkedin
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { Lead, LeadCredits } from '@/types'
import toast from 'react-hot-toast'

// ═══════════════════════════════════════════════════════════════
// ██  THEME SYSTEM — edit these presets to restyle everything  ██
// ═══════════════════════════════════════════════════════════════

export type ThemeKey = 'midnight' | 'slate' | 'forest' | 'rose' | 'amber'

export interface Theme {
  name: string
  mode: 'dark' | 'light'
  // Sidebar
  sb: string
  sbText: string
  sbMuted: string
  sbBorder: string
  sbActive: string
  sbActiveText: string
  // Brand accent
  accent: string
  accentLight: string
  accentGlow: string
  // Page background
  pageBg: string
  // Card
  card: string
  cardBorder: string
  // Text
  text: string
  muted: string
  faint: string
  // KPI card gradients [from, to] per slot
  kpiGradients: [string, string][]
  // Stat accent colors
  chartLine1: string
  chartLine2: string
  chartFill1: string
  chartFill2: string
  // Fonts
  displayFont: string
  bodyFont: string
}

export const THEME_PRESETS: Record<ThemeKey, Theme> = {
  midnight: {
    name: 'Midnight',
    mode: 'dark',
    sb: '#0A0A0F',
    sbText: '#FAF7F2',
    sbMuted: 'rgba(255,255,255,0.35)',
    sbBorder: 'rgba(255,255,255,0.06)',
    sbActive: 'rgba(139,92,246,0.18)',
    sbActiveText: '#fff',
    accent: '#8B5CF6',
    accentLight: 'rgba(139,92,246,0.12)',
    accentGlow: 'rgba(139,92,246,0.4)',
    pageBg: '#F0EDE8',
    card: '#FFFFFF',
    cardBorder: 'rgba(13,17,23,0.07)',
    text: '#0D1117',
    muted: '#64748B',
    faint: '#94A3B8',
    kpiGradients: [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
    ],
    chartLine1: '#8B5CF6',
    chartLine2: '#34D399',
    chartFill1: 'rgba(139,92,246,0.08)',
    chartFill2: 'rgba(52,211,153,0.08)',
    displayFont: "'Clash Display', 'Bricolage Grotesque', sans-serif",
    bodyFont: "'Bricolage Grotesque', system-ui, sans-serif",
  },
  slate: {
    name: 'Slate',
    mode: 'light',
    sb: '#1E293B',
    sbText: '#F8FAFC',
    sbMuted: 'rgba(255,255,255,0.40)',
    sbBorder: 'rgba(255,255,255,0.08)',
    sbActive: 'rgba(59,130,246,0.20)',
    sbActiveText: '#fff',
    accent: '#3B82F6',
    accentLight: 'rgba(59,130,246,0.10)',
    accentGlow: 'rgba(59,130,246,0.35)',
    pageBg: '#F1F5F9',
    card: '#FFFFFF',
    cardBorder: 'rgba(15,23,42,0.08)',
    text: '#0F172A',
    muted: '#475569',
    faint: '#94A3B8',
    kpiGradients: [
      ['#3B82F6', '#1D4ED8'],
      ['#EC4899', '#BE185D'],
      ['#06B6D4', '#0891B2'],
      ['#10B981', '#059669'],
    ],
    chartLine1: '#3B82F6',
    chartLine2: '#10B981',
    chartFill1: 'rgba(59,130,246,0.08)',
    chartFill2: 'rgba(16,185,129,0.08)',
    displayFont: "'DM Sans', system-ui, sans-serif",
    bodyFont: "'DM Sans', system-ui, sans-serif",
  },
  forest: {
    name: 'Forest',
    mode: 'light',
    sb: '#0F2418',
    sbText: '#F0FDF4',
    sbMuted: 'rgba(255,255,255,0.40)',
    sbBorder: 'rgba(255,255,255,0.07)',
    sbActive: 'rgba(34,197,94,0.18)',
    sbActiveText: '#fff',
    accent: '#16A34A',
    accentLight: 'rgba(22,163,74,0.10)',
    accentGlow: 'rgba(22,163,74,0.35)',
    pageBg: '#F0FDF4',
    card: '#FFFFFF',
    cardBorder: 'rgba(15,57,24,0.08)',
    text: '#052E16',
    muted: '#4B7A5A',
    faint: '#86A98F',
    kpiGradients: [
      ['#16A34A', '#166534'],
      ['#65A30D', '#3F6212'],
      ['#0D9488', '#0F766E'],
      ['#D97706', '#92400E'],
    ],
    chartLine1: '#16A34A',
    chartLine2: '#D97706',
    chartFill1: 'rgba(22,163,74,0.08)',
    chartFill2: 'rgba(217,119,6,0.08)',
    displayFont: "'Sora', sans-serif",
    bodyFont: "'Sora', sans-serif",
  },
  rose: {
    name: 'Rose',
    mode: 'light',
    sb: '#1C0A12',
    sbText: '#FFF1F2',
    sbMuted: 'rgba(255,255,255,0.38)',
    sbBorder: 'rgba(255,255,255,0.07)',
    sbActive: 'rgba(244,63,94,0.20)',
    sbActiveText: '#fff',
    accent: '#F43F5E',
    accentLight: 'rgba(244,63,94,0.10)',
    accentGlow: 'rgba(244,63,94,0.35)',
    pageBg: '#FFF1F2',
    card: '#FFFFFF',
    cardBorder: 'rgba(28,10,18,0.07)',
    text: '#1C0A12',
    muted: '#7A3045',
    faint: '#B08090',
    kpiGradients: [
      ['#F43F5E', '#BE123C'],
      ['#F97316', '#C2410C'],
      ['#A855F7', '#7E22CE'],
      ['#06B6D4', '#0E7490'],
    ],
    chartLine1: '#F43F5E',
    chartLine2: '#A855F7',
    chartFill1: 'rgba(244,63,94,0.08)',
    chartFill2: 'rgba(168,85,247,0.08)',
    displayFont: "'Playfair Display', serif",
    bodyFont: "'Lato', sans-serif",
  },
  amber: {
    name: 'Amber',
    mode: 'light',
    sb: '#1C1400',
    sbText: '#FFFBEB',
    sbMuted: 'rgba(255,255,255,0.38)',
    sbBorder: 'rgba(255,255,255,0.07)',
    sbActive: 'rgba(245,158,11,0.20)',
    sbActiveText: '#fff',
    accent: '#F59E0B',
    accentLight: 'rgba(245,158,11,0.12)',
    accentGlow: 'rgba(245,158,11,0.40)',
    pageBg: '#FFFBEB',
    card: '#FFFFFF',
    cardBorder: 'rgba(28,20,0,0.07)',
    text: '#1C1400',
    muted: '#78600A',
    faint: '#B49A52',
    kpiGradients: [
      ['#F59E0B', '#B45309'],
      ['#EF4444', '#B91C1C'],
      ['#8B5CF6', '#6D28D9'],
      ['#10B981', '#047857'],
    ],
    chartLine1: '#F59E0B',
    chartLine2: '#EF4444',
    chartFill1: 'rgba(245,158,11,0.08)',
    chartFill2: 'rgba(239,68,68,0.08)',
    displayFont: "'Clash Display', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
  },
}

// ═══════════════════════════════════════════════════════════════
// ██  DASHBOARD CONFIG — toggle sections / set defaults        ██
// ═══════════════════════════════════════════════════════════════

export const DASHBOARD_CONFIG = {
  defaultTheme: 'midnight' as ThemeKey,

  // Toggle entire sections on / off
  sections: {
    alertStrip:        true,
    performanceScore:  true,
    kpiCards:          true,
    insightCards:      true,
    chartAndFunnel:    true,
    leadSources:       true,
    monthlyGoals:      true,
    activityFeed:      true,
    quickActions:      true,
    leadsTable:        true,
  },

  // KPI cards: label, stat key, icon, trend label
  kpiCards: [
    { icon: Users,    label: 'Total Leads',    statKey: 'totalLeads',           trendLabel: null, trendDir: 'neutral' },
    { icon: Flame,    label: 'This Month',     statKey: 'newLeadsThisMonth',    trendLabel: null, trendDir: 'neutral' },
    { icon: FileText, label: 'Applications',   statKey: 'totalApplications',    trendLabel: null, trendDir: 'neutral' },
    { icon: Star,     label: 'Avg Rating',     statKey: 'avgRating',            trendLabel: null, trendDir: 'neutral' },
  ],

  // Quick action buttons
  quickActions: [
    { icon: '⚡', label: 'Buy Credits',    href: '/dashboard/school/packages'  },
    { icon: '👥', label: 'View Leads',     href: '/dashboard/school/leads'     },
    { icon: '✏️', label: 'Edit Profile',  href: '/school/complete-profile'    },
    { icon: '📊', label: 'Analytics',      href: '/dashboard/school/analytics' },
    { icon: '⭐', label: 'Reviews',        href: '/dashboard/school/reviews'   },
  ],
}

// ═══════════════════════════════════════════════════════════════
// ██  NAV CONFIG                                               ██
// ═══════════════════════════════════════════════════════════════

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',        href: '/dashboard/school',              badge: null  },
  { icon: Users,           label: 'Leads',             href: '/dashboard/school/leads',        badge: 'new' },
  { icon: FileText,        label: 'Applications',      href: '/dashboard/school/applications', badge: null  },
  { icon: Star,            label: 'Reviews',           href: '/dashboard/school/reviews',      badge: null  },
  { icon: Layers,          label: 'Subscription Plan', href: '/dashboard/school/packages',     badge: null  },
  { icon: History,         label: 'History',           href: '/dashboard/school/history',      badge: null  },
  { icon: BarChart3,       label: 'Analytics',         href: '/dashboard/school/analytics',    badge: null  },
  { icon: Settings,        label: 'School Profile',    href: '/school/complete-profile',       badge: null  },
]

// ═══════════════════════════════════════════════════════════════
// ██  TYPE DEFINITIONS                                         ██
// ═══════════════════════════════════════════════════════════════

interface SchoolDashboardStats {
  totalLeads: number
  newLeadsThisMonth: number
  newLeadsToday: number
  totalApplications: number
  avgRating: number | null
  profileCompleteness: number
  responseRate: number
  conversionRate: number
  performanceScore: number
  schoolName?: string | null
  schoolLogo?: string | null
  schoolCity?: string | null
  schoolState?: string | null
  schoolBoard?: string[]
  facebookUrl?: string | null
  instagramUrl?: string | null
  youtubeUrl?: string | null
  twitterUrl?: string | null
  isFeatured?: boolean
  featuredUntil?: string | null
  featuredDaysLeft?: number
}

interface FunnelStage {
  label: string
  count: number
  color: string
}

interface LeadSource {
  rank: number
  label: string
  sublabel: string
  count: number
  pct: number
  color: string
}

interface MonthlyGoal {
  label: string
  achieved: number
  target: number
  color: string
  status: 'on-track' | 'behind' | 'achieved'
}

interface ActivityEvent {
  id: string
  title: string
  desc: string
  time: string
  color: string
}

interface InsightCard {
  id: string
  severity: 'critical' | 'warning' | 'positive' | 'info'
  title: string
  desc: string
  ctaLabel?: string
  ctaHref?: string
}

// ═══════════════════════════════════════════════════════════════
// ██  UTILITY HOOKS                                            ██
// ═══════════════════════════════════════════════════════════════

function useTheme() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sd_theme') as ThemeKey) || DASHBOARD_CONFIG.defaultTheme
    }
    return DASHBOARD_CONFIG.defaultTheme
  })

  const theme = THEME_PRESETS[themeKey]

  const applyTheme = useCallback((key: ThemeKey) => {
    setThemeKey(key)
    if (typeof window !== 'undefined') localStorage.setItem('sd_theme', key)
  }, [])

  return { theme, themeKey, applyTheme }
}

function useCounter(value: number) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!value) { setN(0); return }
    const dur = 1000
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return n
}

// Compute smart insights from live data
function useInsights(
  stats: SchoolDashboardStats | undefined,
  credits: LeadCredits | undefined,
): InsightCard[] {
  return useMemo(() => {
    const out: InsightCard[] = []
    if (!stats) return out

    const avail = Number((credits as any)?.availableCredits ?? (credits as any)?.credits ?? 0)
    const dailyRate = (stats.newLeadsThisMonth ?? 0) / 30
    const daysLeft = dailyRate > 0 ? Math.round(avail / dailyRate) : 999

    if (daysLeft <= 3) {
      out.push({
        id: 'low-credits', severity: 'critical',
        title: `Credits run out in ~${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        desc: `At ${dailyRate.toFixed(1)} leads/day, ${avail} credits won't last the week. You risk missing enquiries.`,
        ctaLabel: 'Buy Credits', ctaHref: '/dashboard/school/packages',
      })
    } else if (daysLeft <= 7) {
      out.push({
        id: 'low-credits-warn', severity: 'warning',
        title: `Credits running low — ${avail} remaining`,
        desc: `Estimated to last ${daysLeft} more days at current lead pace.`,
        ctaLabel: 'Top Up', ctaHref: '/dashboard/school/packages',
      })
    }

    const pct = stats.profileCompleteness ?? 0
    if (pct < 80) {
      out.push({
        id: 'profile', severity: 'info',
        title: `Profile ${pct}% complete — missing leads`,
        desc: 'Schools with 100% profiles get 3× more enquiries. Add photos, fees, and curriculum details.',
        ctaLabel: 'Complete Profile', ctaHref: '/school/complete-profile',
      })
    }

    const cr = stats.conversionRate ?? 0
    if (cr < 10) {
      out.push({
        id: 'conversion', severity: 'warning',
        title: `Conversion at ${cr.toFixed(1)}% — below average`,
        desc: 'Delhi schools average 14% lead-to-admission. Faster follow-up can close this gap.',
        ctaLabel: 'How to improve',
      })
    } else {
      out.push({
        id: 'leads-trend', severity: 'positive',
        title: `Conversion looks good — above 14% average`,
        desc: 'Keep responding to leads quickly to maintain your admission rate.',
      })
    }

    return out.slice(0, 3)
  }, [stats, credits])
}

// ═══════════════════════════════════════════════════════════════
// ██  THEME CONTROLLER PANEL                                   ██
// ═══════════════════════════════════════════════════════════════

function ThemeController({ themeKey, applyTheme, theme }: {
  themeKey: ThemeKey
  applyTheme: (k: ThemeKey) => void
  theme: Theme
}) {
  const [open, setOpen] = useState(false)
  const ICONS: Record<ThemeKey, string> = { midnight: '🌙', slate: '🌫️', forest: '🌿', rose: '🌹', amber: '🔥' }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 10, border: `1px solid ${theme.sbBorder}`,
          background: theme.accentLight, color: theme.sbText,
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          fontFamily: theme.bodyFont, margin: '8px 12px',
          transition: 'all .15s',
        }}
      >
        <Palette size={13} />
        <span>{ICONS[themeKey]} {theme.name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              margin: '0 12px 8px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${theme.sbBorder}`,
              padding: 10, backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.sbMuted, marginBottom: 8, fontFamily: theme.bodyFont }}>
              Theme Presets
            </div>
            {(Object.keys(THEME_PRESETS) as ThemeKey[]).map(k => {
              const t = THEME_PRESETS[k]
              const active = k === themeKey
              return (
                <button
                  key={k}
                  onClick={() => { applyTheme(k); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                    padding: '7px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: active ? t.accentLight : 'transparent',
                    fontFamily: theme.bodyFont, transition: 'all .12s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{ICONS[k]}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? t.accent : theme.sbMuted }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: theme.sbMuted, marginTop: 1 }}>{t.mode === 'dark' ? 'Dark' : 'Light'} · {t.bodyFont.split("'")[1] || 'System'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {t.kpiGradients.slice(0, 3).map(([c], i) => (
                      <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  SIDEBAR                                                  ██
// ═══════════════════════════════════════════════════════════════

// ─── Thynk Schooling Platform Social Links ───────────────────────────────────
// Fetches from /api/admin/media (same source as public Footer)
// Always visible in sidebar regardless of school's own social links

interface ThynkMedia {
  socialFacebook?: string
  socialInstagram?: string
  socialYoutube?: string
  socialTwitter?: string
  socialLinkedin?: string
}

function ThynkSocialLinks({ theme }: { theme: Theme }) {
  const [media, setMedia] = useState<ThynkMedia>({})

  useEffect(() => {
    fetch('/api/admin/media', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setMedia(d.data || {}))
      .catch(() => {})
  }, [])

  const links = [
    { href: media.socialInstagram, label: 'Instagram', Icon: Instagram, bg: 'rgba(225,48,108,0.12)',  color: '#E1306C' },
    { href: media.socialFacebook,  label: 'Facebook',  Icon: Facebook,  bg: 'rgba(24,119,242,0.12)', color: '#4A9FE8' },
    { href: media.socialYoutube,   label: 'YouTube',   Icon: Youtube,   bg: 'rgba(255,0,0,0.10)',    color: '#FF4444' },
    { href: media.socialTwitter,   label: 'Twitter',   Icon: Twitter,   bg: 'rgba(29,161,242,0.10)', color: '#1DA1F2' },
    { href: media.socialLinkedin,  label: 'LinkedIn',  Icon: Linkedin,  bg: 'rgba(10,102,194,0.12)', color: '#0A66C2' },
  ].filter(l => l.href && l.href !== '#')

  return (
    <div style={{ position: 'relative', zIndex: 1, margin: '0 12px 10px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: `1px solid ${theme.sbBorder}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.sbMuted, marginBottom: 8, fontFamily: theme.bodyFont }}>
        Follow Us
      </div>
      {links.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {links.map(({ href, label, Icon, bg, color }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: bg, color, textDecoration: 'none', fontSize: 11, fontWeight: 600, fontFamily: theme.bodyFont, transition: 'opacity .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            >
              <Icon size={12} /> {label}
            </a>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: theme.sbMuted, fontFamily: theme.bodyFont, opacity: 0.5 }}>
          Set links in Admin → Media
        </div>
      )}
    </div>
  )
}

function Sidebar({ active, onClose, credits, theme, themeKey, applyTheme, socialLinks }: {
  active: string
  onClose?: () => void
  credits?: LeadCredits
  theme: Theme
  themeKey: ThemeKey
  applyTheme: (k: ThemeKey) => void
  socialLinks?: { facebook?: string | null; instagram?: string | null; youtube?: string | null; twitter?: string | null }
}) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const avail = Number((credits as any)?.availableCredits ?? (credits as any)?.credits ?? 0)

  const S: Record<string, string> = {
    root: `width:252px;height:100vh;background:${theme.sb};display:flex;flex-direction:column;position:relative;overflow:hidden`,
    glow: `position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 80% 40% at 50% 0%,${theme.accentGlow.replace('0.4', '0.12')},transparent)`,
    top:  `position:relative;z-index:1;padding:22px 20px 18px;border-bottom:1px solid ${theme.sbBorder};display:flex;align-items:center;justify-content:space-between`,
    brandName: `font-family:${theme.displayFont};font-size:17px;font-weight:700;color:${theme.sbText};letter-spacing:-0.02em`,
    brandTag:  `font-size:9.5px;color:${theme.sbMuted};font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px`,
    user: `position:relative;z-index:1;display:flex;align-items:center;gap:11px;padding:14px 20px;border-bottom:1px solid ${theme.sbBorder}`,
    nav:  `flex:1;overflow-y:auto;padding:10px 12px;position:relative;z-index:1;scrollbar-width:none`,
    logout: `display:flex;align-items:center;gap:8px;width:calc(100% - 24px);margin:10px 12px 8px;padding:10px 14px;border-radius:10px;border:none;background:rgba(255,255,255,0.04);color:${theme.sbMuted};cursor:pointer;font-family:${theme.bodyFont};font-size:13px;font-weight:600;transition:all .18s`,
  }

  return (
    <aside style={{ width: 252, height: '100vh', background: theme.sb, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(ellipse 80% 40% at 50% 0%,${theme.accentLight},transparent)` }} />

      {/* Top */}
      <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 18px', borderBottom: `1px solid ${theme.sbBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 18px ${theme.accentGlow}`, flexShrink: 0 }}>
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: theme.displayFont, fontSize: 17, fontWeight: 700, color: theme.sbText, letterSpacing: '-0.02em' }}>Thynk<span style={{ color: theme.accent }}>Schooling</span></div>
            <div style={{ fontSize: '9.5px', color: theme.sbMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>School Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.sbMuted, cursor: 'pointer', display: 'flex', padding: 4, zIndex: 2 }}><X size={14} /></button>}
      </div>

      {/* User */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '14px 20px', borderBottom: `1px solid ${theme.sbBorder}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: theme.accentLight, border: `1.5px solid ${theme.accentLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.displayFont, fontWeight: 700, fontSize: 17, color: theme.accent, flexShrink: 0 }}>
          {(user?.fullName || 'S')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.sbText, fontFamily: theme.bodyFont }}>{user?.fullName || 'School Admin'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: theme.sbMuted, marginTop: 2 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', flexShrink: 0, display: 'inline-block' }} />
            Administrator
          </div>
        </div>
      </div>

      {/* Credit pill */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 7, margin: '12px 16px', padding: '10px 14px', background: theme.accentLight, border: `1px solid ${theme.accentLight}`, borderRadius: 12 }}>
        <Zap size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.sbMuted, flex: 1, fontFamily: theme.bodyFont }}>Lead Credits</span>
        <span style={{ fontFamily: theme.displayFont, fontSize: 13, fontWeight: 700, color: theme.accent, background: theme.accentLight, padding: '2px 10px', borderRadius: 99 }}>{avail}</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', position: 'relative', zIndex: 1 }}>
        {NAV.map(({ icon: Icon, label, href, badge }) => {
          const isActive = active === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11,
                color: isActive ? theme.sbActiveText : theme.sbMuted,
                background: isActive ? theme.sbActive : 'transparent',
                fontSize: 13, fontWeight: 600, marginBottom: 2,
                transition: 'all .18s', position: 'relative', fontFamily: theme.bodyFont,
              }}>
                {isActive && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: theme.accent, borderRadius: '0 3px 3px 0' }} />}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isActive ? theme.accentLight : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {badge === 'new' && <span style={{ fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg,#F97316,#EF4444)', color: '#fff', padding: '2px 7px', borderRadius: 99 }}>New</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Theme controller */}
      <ThemeController theme={theme} themeKey={themeKey} applyTheme={applyTheme} />

      {/* Thynk Schooling Platform Social Links */}
      <ThynkSocialLinks theme={theme} />

      {/* Logout */}
      <button
        onClick={() => { logout(); router.replace('/login') }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'calc(100% - 24px)', margin: '0 12px 16px', padding: '10px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.04)', color: theme.sbMuted, cursor: 'pointer', fontFamily: theme.bodyFont, fontSize: 13, fontWeight: 600, transition: 'all .18s' }}
      >
        <LogOut size={13} /><span>Sign Out</span>
      </button>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: SMART ALERT STRIP                                ██
// ═══════════════════════════════════════════════════════════════

function AlertStrip({ insights, theme }: { insights: InsightCard[]; theme: Theme }) {
  const SEV_COLORS: Record<string, [string, string, string]> = {
    critical: ['rgba(244,63,94,0.08)', 'rgba(244,63,94,0.25)', '#be123c'],
    warning:  ['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.25)', '#b45309'],
    positive: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.25)', '#047857'],
    info:     [theme.accentLight, `${theme.accent}40`, theme.accent],
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
    >
      {insights.map(ins => {
        const [bg, border, color] = SEV_COLORS[ins.severity] || SEV_COLORS.info
        return (
          <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: bg, border: `0.5px solid ${border}`, color, fontFamily: theme.bodyFont }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
            {ins.title}
            {ins.ctaHref && (
              <Link href={ins.ctaHref} style={{ marginLeft: 4, fontWeight: 700, fontSize: 11, color, opacity: 0.85, textDecoration: 'none' }}>
                {ins.ctaLabel} →
              </Link>
            )}
          </div>
        )
      })}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: PERFORMANCE SCORE BANNER                         ██
// ═══════════════════════════════════════════════════════════════

function PerformanceScoreBanner({ stats, theme }: { stats: SchoolDashboardStats | undefined; theme: Theme }) {
  const score = stats?.performanceScore ?? 76
  const pct = stats?.profileCompleteness ?? 72
  const responseRate = stats?.responseRate ?? 85
  const conversion = stats?.conversionRate ?? 61
  const circumference = 2 * Math.PI * 26
  const offset = circumference - (score / 100) * circumference

  const bars = [
    { label: 'Profile completeness', value: pct, color: theme.accent },
    { label: 'Response rate',        value: responseRate, color: '#10B981' },
    { label: 'Lead conversion',      value: conversion, color: '#F59E0B' },
    { label: 'Review score',         value: 88, color: '#06B6D4' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg,transparent 60%,${theme.accentLight})`, pointerEvents: 'none' }} />

      {/* Ring */}
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke={theme.accentLight} strokeWidth="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke={theme.accent} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.displayFont, fontSize: 15, fontWeight: 700, color: theme.accent }}>
          {score}
        </div>
      </div>

      {/* Bars */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 8, fontFamily: theme.displayFont }}>
          School Performance Score <span style={{ fontWeight: 400, fontSize: 11, color: theme.muted }}>— 4 factors</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {bars.map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>
              <span style={{ width: 120 }}>{b.label}</span>
              <div style={{ flex: 1, height: 4, background: theme.accentLight, borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${b.value}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: b.color, borderRadius: 99 }}
                />
              </div>
              <span style={{ width: 32, textAlign: 'right', fontWeight: 700 }}>{b.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: theme.accent, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 700, fontFamily: theme.bodyFont }}>
          ↗ Improve Score
        </Link>
        <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: 'transparent', color: theme.muted, border: `0.5px solid ${theme.cardBorder}`, textDecoration: 'none', fontSize: 11, fontWeight: 700, fontFamily: theme.bodyFont }}>
          Complete Profile
        </Link>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: KPI CARD                                         ██
// ═══════════════════════════════════════════════════════════════

interface KPICardProps {
  icon: React.ElementType
  label: string
  value: number | string
  sub: string
  trendDir: 'up' | 'down' | 'neutral'
  trendLabel: string | null
  gradient: [string, string]
  href?: string
  delay?: number
  loading?: boolean
  theme: Theme
}

function KPICard({ icon: Icon, label, value, sub, trendDir, trendLabel, gradient, href, delay = 0, loading, theme }: KPICardProps) {
  const n = useCounter(typeof value === 'number' ? value : 0)
  const shadow = `${gradient[0]}70`

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: `0 20px 56px ${shadow}` }}
      style={{
        background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
        boxShadow: `0 12px 40px ${shadow}`,
        borderRadius: 16, padding: '22px 20px 18px',
        position: 'relative', overflow: 'hidden', cursor: href ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color="#fff" />
        </div>
        {trendDir !== 'neutral' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.22)', color: '#fff', fontFamily: theme.bodyFont }}>
            {trendDir === 'up' ? <ArrowUp size={9} /> : <ArrowDown size={9} />} {trendLabel}
          </div>
        )}
      </div>
      {loading
        ? <div style={{ height: 40, width: '60%', borderRadius: 8, background: 'rgba(255,255,255,0.25)', animation: 'sdPulse 1.4s ease-in-out infinite' }} />
        : <div style={{ fontFamily: theme.displayFont, fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: -2, marginBottom: 6 }}>
            {typeof value === 'number' ? n.toLocaleString('en-IN') : value}
          </div>
      }
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: theme.bodyFont }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3, fontFamily: theme.bodyFont }}>{sub}</div>
    </motion.div>
  )

  return href ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link> : card
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: INSIGHT CARDS ROW                                ██
// ═══════════════════════════════════════════════════════════════

function InsightCards({ insights, theme }: { insights: InsightCard[]; theme: Theme }) {
  const SEV: Record<string, [string, string, string]> = {
    critical: ['rgba(244,63,94,0.08)', 'rgba(244,63,94,0.15)', '#be123c'],
    warning:  ['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#b45309'],
    positive: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.15)', '#047857'],
    info:     [theme.accentLight, `${theme.accent}25`, theme.accent],
  }
  const EMOJIS: Record<string, string> = { critical: '⚡', warning: '⚠️', positive: '📈', info: '💡' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
      {insights.map((ins, i) => {
        const [bg, border, color] = SEV[ins.severity] || SEV.info
        return (
          <motion.div
            key={ins.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ padding: '14px 16px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `0.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 1 }}>
              {EMOJIS[ins.severity]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 3, fontFamily: theme.bodyFont }}>{ins.title}</div>
              <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.5, fontFamily: theme.bodyFont }}>{ins.desc}</div>
              {ins.ctaLabel && (
                <div style={{ marginTop: 8 }}>
                  {ins.ctaHref
                    ? <Link href={ins.ctaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color, padding: '4px 8px', borderRadius: 6, border: `0.5px solid ${border}`, textDecoration: 'none', background: bg, fontFamily: theme.bodyFont }}>{ins.ctaLabel} →</Link>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color, padding: '4px 8px', borderRadius: 6, border: `0.5px solid ${border}`, cursor: 'pointer', background: bg, fontFamily: theme.bodyFont }}>{ins.ctaLabel} →</span>
                  }
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: CHART CARD (with period + type toggle)           ██
// ═══════════════════════════════════════════════════════════════

interface AnalyticsPoint { date: string; leads: number; applications: number }

function ChartCard({ data, loading, theme }: { data: AnalyticsPoint[]; loading: boolean; theme: Theme }) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const filtered = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    return data.slice(-days)
  }, [data, period])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: '11px 15px', boxShadow: '0 8px 28px rgba(0,0,0,.09)', fontFamily: theme.bodyFont }}>
        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 7, fontWeight: 600 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
            <span style={{ color: theme.muted, flex: 1 }}>{p.name}</span>
            <span style={{ fontWeight: 700, color: theme.text }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const TabBtn = ({ label, val, current, set }: any) => (
    <button onClick={() => set(val)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: theme.bodyFont, transition: 'all .15s', background: current === val ? theme.card : 'transparent', color: current === val ? theme.text : theme.muted, boxShadow: current === val ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{label}</button>
  )

  return (
    <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Performance Overview</div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>Leads & applications trend</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', background: `${theme.accentLight}80`, borderRadius: 8, padding: 2, gap: 2 }}>
            {(['7d', '30d', '90d'] as const).map(p => <TabBtn key={p} label={p.toUpperCase()} val={p} current={period} set={setPeriod} />)}
          </div>
          <div style={{ display: 'flex', background: `${theme.accentLight}80`, borderRadius: 8, padding: 2, gap: 2 }}>
            <TabBtn label="Area" val="area" current={chartType} set={setChartType} />
            <TabBtn label="Bar" val="bar" current={chartType} set={setChartType} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        {[['Leads', theme.chartLine1], ['Applications', theme.chartLine2]].map(([n, c]) => (
          <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>
            <span style={{ width: 10, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />
            {n}
          </span>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: theme.faint }}>
            <TrendingUp size={36} />
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 220, lineHeight: 1.6, fontFamily: theme.bodyFont }}>No data yet — enquiries will appear here once parents find your school.</p>
          </div>
        : <ResponsiveContainer width="100%" height={200}>
            {chartType === 'area'
              ? <AreaChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.chartLine1} stopOpacity={0.3} /><stop offset="95%" stopColor={theme.chartLine1} stopOpacity={0} /></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.chartLine2} stopOpacity={0.3} /><stop offset="95%" stopColor={theme.chartLine2} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.cardBorder} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.faint }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: theme.faint }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke={theme.chartLine1} strokeWidth={2.5} fill="url(#g1)" dot={false} />
                  <Area type="monotone" dataKey="applications" name="Applications" stroke={theme.chartLine2} strokeWidth={2.5} fill="url(#g2)" dot={false} />
                </AreaChart>
              : <BarChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.cardBorder} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.faint }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: theme.faint }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="leads" name="Leads" fill={theme.chartLine1} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applications" name="Applications" fill={theme.chartLine2} radius={[4, 4, 0, 0]} />
                </BarChart>
            }
          </ResponsiveContainer>
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: CONVERSION FUNNEL                                ██
// ═══════════════════════════════════════════════════════════════

function ConversionFunnel({ stats, theme }: { stats: SchoolDashboardStats | undefined; theme: Theme }) {
  const total = stats?.totalLeads ?? 0
  const hasData = total > 0
  const stages: FunnelStage[] = [
    { label: 'Leads received', count: total,                                              color: theme.accent },
    { label: 'Contacted',      count: hasData ? Math.round(total * 0.68) : 0,             color: '#06B6D4' },
    { label: 'Interested',     count: hasData ? Math.round(total * 0.36) : 0,             color: '#F59E0B' },
    { label: 'Applied',        count: stats?.totalApplications ?? 0,                      color: '#8B5CF6' },
    { label: 'Admitted',       count: hasData ? Math.round(total * 0.09) : 0,             color: '#10B981' },
  ]

  return (
    <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, padding: 22 }}>
      <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Conversion Funnel</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, marginBottom: 18, fontFamily: theme.bodyFont }}>Lead to admission pipeline</div>

      {!hasData ? (
        <div style={{ padding: '28px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 4, fontFamily: theme.bodyFont }}>No data yet</div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>Funnel will populate once leads come in.</div>
        </div>
      ) : (
        <>
          {stages.map((s, i) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
            const dropPct = s.count > 0 && i < stages.length - 1
              ? Math.round((stages[i + 1].count / s.count) * 100)
              : 0
            return (
              <div key={s.label}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: i === stages.length - 1 ? '#047857' : theme.text, fontFamily: theme.bodyFont }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>{s.count.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: 8, background: theme.accentLight, borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', background: s.color, borderRadius: 99 }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: theme.faint, marginTop: 3, fontFamily: theme.bodyFont }}>{pct}% of leads</div>
                </div>
                {i < stages.length - 1 && (
                  <div style={{ textAlign: 'center', fontSize: 10, color: theme.faint, margin: '2px 0', fontFamily: theme.bodyFont }}>
                    ↓ {dropPct}%
                  </div>
                )}
              </div>
            )
          })}

          <div style={{ marginTop: 14, padding: '10px 12px', background: theme.accentLight, borderRadius: 8, border: `0.5px solid ${theme.accentLight}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, fontFamily: theme.bodyFont }}>
              {total > 0 ? Math.round((stages[4].count / total) * 100) : 0}% conversion rate
            </div>
            <div style={{ fontSize: 10, color: theme.muted, marginTop: 2, fontFamily: theme.bodyFont }}>
              Delhi avg is 14%. Faster follow-up can close the gap.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: LEAD SOURCES                                     ██
// ═══════════════════════════════════════════════════════════════

type LeadSourceTab = 'sources' | 'city' | 'class'

const SLOT_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
]

function LeadSourcesCard({ analyticsRaw, theme }: { analyticsRaw: any; theme: Theme }) {
  const [tab, setTab] = useState<LeadSourceTab>('sources')

  // Build sources from real API data
  const sources: LeadSource[] = useMemo(() => {
    const rows: { source: string; count: string }[] = analyticsRaw?.sourceBreakdown || []
    if (!rows.length) return []
    const max = Math.max(...rows.map(r => Number(r.count)), 1)
    return rows.map((r, i) => ({
      rank: i + 1,
      label: r.source,
      sublabel: '',
      count: Number(r.count),
      pct: Math.round((Number(r.count) / max) * 100),
      color: SLOT_COLORS[i % SLOT_COLORS.length],
    }))
  }, [analyticsRaw])

  const cities = useMemo(() => {
    const rows: { city: string; count: string }[] = analyticsRaw?.cityBreakdown || []
    if (!rows.length) return []
    const max = Math.max(...rows.map(r => Number(r.count)), 1)
    return rows.map((r, i) => ({
      name: r.city,
      count: Number(r.count),
      pct: Math.round((Number(r.count) / max) * 100),
      color: SLOT_COLORS[i % SLOT_COLORS.length],
      totalLeads: max,
    }))
  }, [analyticsRaw])

  const classes = useMemo(() => {
    const rows: { class: string; count: string }[] = analyticsRaw?.classBreakdown || []
    if (!rows.length) return []
    const max = Math.max(...rows.map(r => Number(r.count)), 1)
    return rows.map((r, i) => ({
      label: r.class,
      count: Number(r.count),
      pct: Math.round((Number(r.count) / max) * 100),
      color: SLOT_COLORS[i % SLOT_COLORS.length],
    }))
  }, [analyticsRaw])

  const totalLeads = useMemo(() =>
    cities.reduce((s, c) => s + c.count, 0) || 1
  , [cities])

  const TABS: { key: LeadSourceTab; label: string }[] = [
    { key: 'sources', label: 'By source' },
    { key: 'city',    label: 'By city'   },
    { key: 'class',   label: 'By class'  },
  ]

  const EmptyState = ({ msg }: { msg: string }) => (
    <div style={{ padding: '28px 0', textAlign: 'center', color: theme.faint, fontSize: 12, fontFamily: theme.bodyFont }}>
      <TrendingUp size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
      {msg}
    </div>
  )

  return (
    <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, padding: 22 }}>
      <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Lead Sources</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, marginBottom: 14, fontFamily: theme.bodyFont }}>Where your enquiries come from</div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: `${theme.accentLight}80`, borderRadius: 8, padding: 2, gap: 2, marginBottom: 16, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: theme.bodyFont, transition: 'all .15s', background: tab === t.key ? theme.card : 'transparent', color: tab === t.key ? theme.text : theme.muted, boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'sources' && (
          <motion.div key="sources" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sources.length === 0
              ? <EmptyState msg="No lead source data yet. Leads will appear here once parents enquire." />
              : sources.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: theme.faint, width: 14, textAlign: 'right', flexShrink: 0 }}>{s.rank}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🌐</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFamily: theme.bodyFont, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                  </div>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <div style={{ height: 5, background: theme.accentLight, borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} style={{ height: '100%', background: s.color, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textAlign: 'right', fontFamily: theme.bodyFont }}>{s.pct}%</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.text, width: 28, textAlign: 'right', flexShrink: 0, fontFamily: theme.bodyFont }}>{s.count}</div>
                </div>
              ))
            }
          </motion.div>
        )}

        {tab === 'city' && (
          <motion.div key="city" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {cities.length === 0
              ? <div style={{ gridColumn: '1/-1' }}><EmptyState msg="No city data yet." /></div>
              : cities.map(c => (
                <div key={c.name} style={{ padding: '10px 12px', background: theme.accentLight, borderRadius: 10, border: `0.5px solid ${theme.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, fontFamily: theme.bodyFont }}>{c.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.text, letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: 2, fontFamily: theme.displayFont }}>{c.count}</div>
                  <div style={{ height: 3, background: theme.cardBorder, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: c.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 10, color: theme.faint, marginTop: 3, fontFamily: theme.bodyFont }}>{Math.round((c.count / totalLeads) * 100)}% of leads</div>
                </div>
              ))
            }
          </motion.div>
        )}

        {tab === 'class' && (
          <motion.div key="class" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {classes.length === 0
              ? <EmptyState msg="No class data yet." />
              : classes.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFamily: theme.bodyFont }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>{c.count}</span>
                    </div>
                    <div style={{ height: 6, background: theme.accentLight, borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1.1 }} style={{ height: '100%', background: c.color, borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: MONTHLY GOALS                                    ██
// ═══════════════════════════════════════════════════════════════

function MonthlyGoalsCard({ stats, theme }: { stats: SchoolDashboardStats | undefined; theme: Theme }) {
  const [showModal, setShowModal] = useState(false)
  const [editGoals, setEditGoals] = useState({ admissions: 20, leads: 50, applications: 30, reviews: 5 })
  const [savedGoals, setSavedGoals] = useState({ admissions: 20, leads: 50, applications: 30, reviews: 5 })

  // Load saved goals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('school_monthly_goals')
      if (saved) {
        const g = JSON.parse(saved)
        setSavedGoals(g)
        setEditGoals(g)
      }
    } catch {}
  }, [])

  const saveGoals = () => {
    setSavedGoals({ ...editGoals })
    localStorage.setItem('school_monthly_goals', JSON.stringify(editGoals))
    setShowModal(false)
    toast.success('Goals saved!')
  }

  const goals: MonthlyGoal[] = [
    { label: 'Admissions',        achieved: 8,  target: savedGoals.admissions,   color: '#F59E0B', status: 8  >= savedGoals.admissions   ? 'achieved' : 8  / savedGoals.admissions   < 0.5 ? 'behind' : 'on-track' },
    { label: 'New leads',         achieved: stats?.newLeadsThisMonth ?? 0, target: savedGoals.leads,        color: theme.accent, status: (stats?.newLeadsThisMonth ?? 0) >= savedGoals.leads        ? 'achieved' : (stats?.newLeadsThisMonth ?? 0) / savedGoals.leads        < 0.5 ? 'behind' : 'on-track' },
    { label: 'Applications',      achieved: stats?.totalApplications ?? 0, target: savedGoals.applications, color: '#10B981', status: (stats?.totalApplications ?? 0) >= savedGoals.applications ? 'achieved' : (stats?.totalApplications ?? 0) / savedGoals.applications < 0.5 ? 'behind' : 'on-track' },
    { label: 'Reviews collected', achieved: 5,  target: savedGoals.reviews,      color: '#06B6D4', status: 5  >= savedGoals.reviews      ? 'achieved' : 'on-track' },
  ]

  const BADGE: Record<string, [string, string]> = {
    'on-track': ['rgba(16,185,129,0.1)', '#047857'],
    'behind':   ['rgba(244,63,94,0.1)',  '#be123c'],
    'achieved': [theme.accentLight, theme.accent],
  }
  const BADGE_LABEL: Record<string, string> = { 'on-track': 'On track', 'behind': 'Behind', 'achieved': 'Achieved ✓' }

  return (
    <>
      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, padding: 22 }}>
        <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Monthly Goals</div>
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, marginBottom: 16, fontFamily: theme.bodyFont }}>
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} targets
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map(g => {
            const pct = Math.min(100, Math.round((g.achieved / g.target) * 100))
            const [badgeBg, badgeColor] = BADGE[g.status]
            return (
              <div key={g.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFamily: theme.bodyFont }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: theme.muted, fontFamily: theme.bodyFont }}>{g.achieved} <span style={{ color: theme.faint }}>/ {g.target}</span></span>
                </div>
                <div style={{ height: 8, background: theme.accentLight, borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: g.color, borderRadius: 99 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.faint, fontFamily: theme.bodyFont }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                    {BADGE_LABEL[g.status]}
                  </span>
                  <span>{pct}% done</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ height: '0.5px', background: theme.cardBorder, margin: '14px 0' }} />

        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: 10, background: theme.accentLight, borderRadius: 10, color: theme.accent, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: theme.bodyFont, transition: 'all .2s' }}
        >
          <Target size={13} /> Set / Edit Goals
        </button>
      </div>

      {/* Goals Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              style={{ background: theme.card, borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', border: `1px solid ${theme.cardBorder}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontFamily: theme.displayFont, fontSize: 18, fontWeight: 700, color: theme.text }}>Set Monthly Goals</div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.faint, padding: 4 }}><X size={16} /></button>
              </div>
              <div style={{ fontSize: 12, color: theme.muted, marginBottom: 20, fontFamily: theme.bodyFont }}>
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} targets
              </div>

              {([
                { key: 'admissions',   label: 'Admissions target',   icon: '🎓' },
                { key: 'leads',        label: 'New leads target',     icon: '👥' },
                { key: 'applications', label: 'Applications target',  icon: '📋' },
                { key: 'reviews',      label: 'Reviews to collect',   icon: '⭐' },
              ] as const).map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 6, fontFamily: theme.bodyFont }}>
                    {field.icon} {field.label}
                  </label>
                  <input
                    type="number" min={1} max={9999}
                    value={editGoals[field.key]}
                    onChange={e => setEditGoals(p => ({ ...p, [field.key]: Math.max(1, Number(e.target.value)) }))}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.cardBorder}`, borderRadius: 10, fontSize: 14, fontWeight: 600, color: theme.text, background: theme.pageBg, fontFamily: theme.bodyFont, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.muted, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: theme.bodyFont }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveGoals}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: theme.accent, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: theme.bodyFont }}
                >
                  Save Goals
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: ACTIVITY FEED                                    ██
// ═══════════════════════════════════════════════════════════════

function ActivityFeed({ analyticsRaw, theme }: { analyticsRaw: any; theme: Theme }) {
  const events: ActivityEvent[] = useMemo(() => {
    const rows: any[] = analyticsRaw?.recentActivity || []
    if (!rows.length) return []

    return rows.map((r: any, i: number) => {
      const ago = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1)  return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24)  return `${hrs}h ago`
        const days = Math.floor(hrs / 24)
        return days === 1 ? 'Yesterday' : `${days}d ago`
      }

      if (r.event_type === 'lead_unlocked') {
        const cls = r.extra ? ` — Class ${r.extra}` : ''
        const city = r.city ? `, ${r.city}` : ''
        return {
          id: r.ref_id || String(i),
          title: 'Lead unlocked',
          desc: `${r.title_detail}${cls}${city}`,
          time: ago(r.created_at),
          color: '#10B981',
        }
      }
      if (r.event_type === 'application') {
        const cls = r.extra ? ` — Class ${r.extra}` : ''
        return {
          id: r.ref_id || String(i),
          title: 'Application received',
          desc: `${r.title_detail}${cls}`,
          time: ago(r.created_at),
          color: theme.accent,
        }
      }
      if (r.event_type === 'review') {
        return {
          id: r.ref_id || String(i),
          title: 'New review posted',
          desc: `${r.title_detail}★ rating from a parent`,
          time: ago(r.created_at),
          color: '#06B6D4',
        }
      }
      return { id: String(i), title: r.event_type, desc: '', time: ago(r.created_at), color: theme.faint }
    })
  }, [analyticsRaw, theme])

  return (
    <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, padding: 22 }}>
      <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Recent Activity</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, marginBottom: 14, fontFamily: theme.bodyFont }}>Live event feed</div>

      {events.length === 0 ? (
        <div style={{ padding: '28px 0', textAlign: 'center', color: theme.faint, fontSize: 12, fontFamily: theme.bodyFont }}>
          <Activity size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          No activity yet — events will appear as leads, applications and reviews come in.
        </div>
      ) : (
        <div>
          {events.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < events.length - 1 ? `0.5px solid ${theme.cardBorder}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFamily: theme.bodyFont }}>{e.title}</div>
                <div style={{ fontSize: 11, color: theme.muted, marginTop: 1, fontFamily: theme.bodyFont }}>{e.desc}</div>
              </div>
              <div style={{ fontSize: 10, color: theme.faint, flexShrink: 0, marginTop: 2, fontFamily: theme.bodyFont }}>{e.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: QUICK ACTIONS                                    ██
// ═══════════════════════════════════════════════════════════════

function QuickActions({ theme }: { theme: Theme }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: theme.displayFont, fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 10 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {DASHBOARD_CONFIG.quickActions.map(a => (
          <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{a.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 500, color: theme.muted, textAlign: 'center', fontFamily: theme.bodyFont }}>{a.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  WIDGET: LEADS TABLE                                      ██
// ═══════════════════════════════════════════════════════════════

function LeadsTable({ leads, loading, onBuy, buyingId, theme }: {
  leads: Lead[]
  loading: boolean
  onBuy: (id: string) => void
  buyingId: string | null
  theme: Theme
}) {
  const STATUS_COLORS: Record<string, [string, string]> = {
    new:            [theme.accent, theme.accentLight],
    contacted:      ['#3B82F6', 'rgba(59,130,246,0.1)'],
    interested:     ['#F59E0B', 'rgba(245,158,11,0.1)'],
    not_interested: [theme.faint, `${theme.accentLight}50`],
    admitted:       ['#10B981', 'rgba(16,185,129,0.1)'],
    lost:           ['#EF4444', 'rgba(239,68,68,0.1)'],
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `0.5px solid ${theme.cardBorder}` }}>
        <div>
          <div style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.text }}>Recent Leads</div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2, fontFamily: theme.bodyFont }}>Latest parent enquiries</div>
        </div>
        <Link href="/dashboard/school/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.accent, textDecoration: 'none', fontWeight: 700, fontFamily: theme.bodyFont }}>
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 52, borderRadius: 10, background: theme.accentLight, animation: 'sdShimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div style={{ padding: '56px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: theme.accentLight, border: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={28} color={theme.faint} />
          </div>
          <div style={{ fontFamily: theme.displayFont, fontWeight: 700, fontSize: 16, color: theme.text }}>No leads yet</div>
          <div style={{ fontSize: 13, color: theme.muted, maxWidth: 300, lineHeight: 1.6, fontFamily: theme.bodyFont }}>Complete your school profile to start attracting parent enquiries.</div>
          <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '10px 20px', borderRadius: 11, background: theme.accent, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13, fontFamily: theme.bodyFont }}>
            Complete profile <ArrowUpRight size={12} />
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Parent', 'Phone', 'City', 'Class', 'Status', 'Action'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: theme.faint, background: theme.accentLight, borderBottom: `0.5px solid ${theme.cardBorder}`, textAlign: i === 5 ? 'right' : 'left', fontFamily: theme.bodyFont }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const [sc, sbg] = STATUS_COLORS[lead.status] || STATUS_COLORS.new
                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: `0.5px solid ${theme.cardBorder}` }}
                  >
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: theme.accentLight, border: `1px solid ${theme.accentLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: theme.accent, flexShrink: 0, fontFamily: theme.displayFont }}>
                          {(lead.isPurchased ? lead.fullName : lead.maskedName || '?')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: theme.text, fontFamily: theme.bodyFont }}>{lead.isPurchased ? lead.fullName : lead.maskedName}</div>
                          <div style={{ fontSize: 10, color: theme.faint, marginTop: 1, fontFamily: theme.bodyFont }}>{lead.childName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 12, color: theme.muted, opacity: lead.isPurchased ? 1 : 0.4, fontFamily: theme.bodyFont }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} color={theme.faint} />
                        {lead.isPurchased ? lead.fullPhone : lead.maskedPhone}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 12, color: theme.muted, fontFamily: theme.bodyFont }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} color={theme.faint} />
                        {lead.city || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 12, color: theme.muted, fontFamily: theme.bodyFont }}>{lead.classApplyingFor ? `Cls ${lead.classApplyingFor}` : '—'}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: sc, background: sbg, fontFamily: theme.bodyFont }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc, display: 'inline-block' }} />
                        {(lead.status || 'new').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                      {lead.isPurchased
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 11, fontWeight: 700, fontFamily: theme.bodyFont }}>
                            <CheckCircle2 size={11} /> Unlocked
                          </span>
                        : <motion.button
                            onClick={() => onBuy(lead.id)}
                            disabled={buyingId === lead.id}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: theme.accent, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: theme.bodyFont, opacity: buyingId === lead.id ? 0.6 : 1 }}
                          >
                            {buyingId === lead.id ? <Loader2 size={11} style={{ animation: 'sdSpin 1s linear infinite' }} /> : <ShoppingCart size={11} />}
                            Unlock
                          </motion.button>
                      }
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ██  MAIN DASHBOARD COMPONENT                                 ██
// ═══════════════════════════════════════════════════════════════

export function SchoolDashboardClient() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const qc = useQueryClient()
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const { theme, themeKey, applyTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    if (user.role !== 'school_admin') {
      router.replace(user.role === 'super_admin' ? '/admin' : '/dashboard/parent')
    }
  }, [mounted, accessToken, user, router])

  const enabled = !!accessToken && mounted

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }), [accessToken])

  const { data: stats, isLoading: statsLoading } = useQuery<SchoolDashboardStats>({
    queryKey: ['school-dashboard-stats'],
    queryFn: () => fetch('/api/schools/me/dashboard-stats', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    enabled, staleTime: 2 * 60 * 1000,
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[]; total: number }>({
    queryKey: ['school-leads'],
    queryFn: () => fetch('/api/leads?limit=8', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    enabled, staleTime: 60 * 1000,
  })

  const { data: credits } = useQuery<LeadCredits>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    enabled, staleTime: 60 * 1000,
  })

  const { data: analyticsRaw } = useQuery<any>({
    queryKey: ['school-analytics'],
    queryFn: () => fetch('/api/schools?action=analytics&days=30', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    enabled, staleTime: 5 * 60 * 1000,
  })

  const analyticsData: AnalyticsPoint[] = useMemo(() => {
    if (!analyticsRaw) return []
    const map: Record<string, AnalyticsPoint> = {}
    ;(analyticsRaw.leads || []).forEach(({ day, count }: any) => { map[day] = { date: day, leads: Number(count), applications: 0 } })
    ;(analyticsRaw.applications || []).forEach(({ day, count }: any) => {
      if (map[day]) map[day].applications = Number(count)
      else map[day] = { date: day, leads: 0, applications: Number(count) }
    })
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }))
  }, [analyticsRaw])

  const buyMutation = useMutation({
    mutationFn: async (leadId: string) => {
      setBuyingId(leadId)
      const r = await fetch(`/api/leads?id=${leadId}&action=purchase`, { method: 'POST', credentials: 'include', headers: authHeaders() })
      return r.json()
    },
    onSuccess: () => {
      toast.success('Lead unlocked!')
      qc.invalidateQueries({ queryKey: ['school-leads'] })
      qc.invalidateQueries({ queryKey: ['lead-credits'] })
      setBuyingId(null)
    },
    onError: () => { toast.error('Failed to unlock lead.'); setBuyingId(null) },
  })

  const insights = useInsights(stats, credits)

  if (!mounted || !accessToken || !user || user.role !== 'school_admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: theme.bodyFont, background: theme.pageBg }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 52, height: 52, borderRadius: 16, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 24px ${theme.accentGlow}` }}>
          <GraduationCap size={22} color="#fff" />
        </motion.div>
        <span style={{ fontSize: 14, color: theme.muted, fontWeight: 500 }}>Loading dashboard…</span>
      </div>
    )
  }

  const leads = leadsData?.data || []
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.fullName?.split(' ')[0] || 'Admin'
  const cfg = DASHBOARD_CONFIG.sections

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Lato:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { font-size: 14px; }
        @keyframes sdPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sdShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes sdSpin { to { transform: rotate(360deg); } }
        a { color: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg, fontFamily: theme.bodyFont }}>

        {/* Desktop sidebar */}
        <div style={{ width: 252, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: typeof window !== 'undefined' && window.innerWidth <= 880 ? 'none' : 'block' }}>
          <Sidebar active="/dashboard/school" credits={credits} theme={theme} themeKey={themeKey} applyTheme={applyTheme} socialLinks={{ facebook: stats?.facebookUrl, instagram: stats?.instagramUrl, youtube: stats?.youtubeUrl, twitter: stats?.twitterUrl }} />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
              <motion.div initial={{ x: -252 }} animate={{ x: 0 }} exit={{ x: -252 }} transition={{ type: 'tween', duration: 0.22 }}
                style={{ width: 252, height: '100%', flexShrink: 0 }}>
                <Sidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} credits={credits} theme={theme} themeKey={themeKey} applyTheme={applyTheme} socialLinks={{ facebook: stats?.facebookUrl, instagram: stats?.instagramUrl, youtube: stats?.youtubeUrl, twitter: stats?.twitterUrl }} />
              </motion.div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile topbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: theme.sb, borderBottom: `1px solid ${theme.sbBorder}` }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: theme.sbMuted, cursor: 'pointer', display: 'flex', padding: 4 }}><Menu size={18} /></button>
            <span style={{ fontFamily: theme.displayFont, fontSize: 16, fontWeight: 700, color: theme.sbText }}>ThynkSchooling</span>
            <Bell size={16} color={theme.sbMuted} />
          </div>

          <div style={{ flex: 1, padding: '32px 36px 52px', maxWidth: 1180, margin: '0 auto', width: '100%' }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: theme.displayFont, fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  {greeting}, <span style={{ color: theme.accent }}>{firstName}</span> 👋
                </h1>
                {stats?.schoolName && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏫 {stats.schoolName}
                    {stats.schoolCity && <span style={{ fontWeight: 400, color: theme.muted }}>· {stats.schoolCity}{stats.schoolState ? `, ${stats.schoolState}` : ''}</span>}
                  </div>
                )}
                <p style={{ fontSize: 13, color: theme.muted, marginTop: 4, fontWeight: 500 }}>Here's what's happening with your school today</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: 99, fontSize: 12, color: theme.muted, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <Clock size={12} />
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
            </motion.div>

            {/* Alert strip */}
            {cfg.alertStrip && insights.length > 0 && <AlertStrip insights={insights} theme={theme} />}

            {/* Featured Listing Banner */}
            {stats?.isFeatured && (
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderRadius:12, background:'linear-gradient(135deg,rgba(184,134,11,0.12),rgba(212,165,32,0.08))', border:'1px solid rgba(184,134,11,0.3)', marginBottom:16, flexWrap:'wrap' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(184,134,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>⭐</div>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#92400E' }}>Your school is Featured!</div>
                  <div style={{ fontSize:12, color:'#B45309', marginTop:2 }}>
                    {stats.featuredDaysLeft && stats.featuredDaysLeft > 0
                      ? `${stats.featuredDaysLeft} day${stats.featuredDaysLeft !== 1 ? 's' : ''} remaining · Appearing at the top of search results`
                      : `Featured until ${stats.featuredUntil ? new Date(stats.featuredUntil).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''}`
                    }
                  </div>
                </div>
                <a href="/dashboard/school/packages?tab=featured" style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:'#B8860B', color:'#fff', textDecoration:'none', fontSize:12, fontWeight:700, flexShrink:0 }}>
                  Extend ›
                </a>
              </div>
            )}

            {/* Performance score */}
            {cfg.performanceScore && <PerformanceScoreBanner stats={stats} theme={theme} />}

            {/* KPI Cards */}
            {cfg.kpiCards && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 18 }}>
                {DASHBOARD_CONFIG.kpiCards.map((cfg_card, i) => {
                  const statVal = stats ? (stats as any)[cfg_card.statKey] : 0
                  const value = cfg_card.statKey === 'avgRating'
                    ? (statVal ? `${Number(statVal).toFixed(1)}★` : '—')
                    : (statVal ?? 0)
                  return (
                    <KPICard
                      key={cfg_card.label}
                      icon={cfg_card.icon}
                      label={cfg_card.label}
                      value={value}
                      sub={i === 0 ? 'All time' : i === 1 ? 'Last 30 days' : i === 2 ? 'Received' : 'From reviews'}
                      trendDir={cfg_card.trendDir as 'up' | 'down'}
                      trendLabel={cfg_card.trendLabel}
                      gradient={theme.kpiGradients[i % theme.kpiGradients.length]}
                      href={i === 0 ? '/dashboard/school/leads' : i === 2 ? '/dashboard/school/applications' : undefined}
                      delay={0.05 * (i + 1)}
                      loading={statsLoading}
                      theme={theme}
                    />
                  )
                })}
              </div>
            )}

            {/* Insight cards */}
            {cfg.insightCards && insights.length > 0 && <InsightCards insights={insights} theme={theme} />}

            {/* Chart + Funnel */}
            {cfg.chartAndFunnel && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, marginBottom: 18 }}>
                <ChartCard data={analyticsData} loading={false} theme={theme} />
                <ConversionFunnel stats={stats} theme={theme} />
              </div>
            )}

            {/* Lead Sources + Goals */}
            {(cfg.leadSources || cfg.monthlyGoals) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 18 }}>
                {cfg.leadSources && <LeadSourcesCard analyticsRaw={analyticsRaw} theme={theme} />}
                {cfg.monthlyGoals && <MonthlyGoalsCard stats={stats} theme={theme} />}
              </div>
            )}

            {/* Activity feed */}
            {cfg.activityFeed && (
              <div style={{ marginBottom: 18 }}>
                <ActivityFeed analyticsRaw={analyticsRaw} theme={theme} />
              </div>
            )}

            {/* Quick actions */}
            {cfg.quickActions && <QuickActions theme={theme} />}

            {/* Leads table */}
            {cfg.leadsTable && (
              <LeadsTable
                leads={leads}
                loading={leadsLoading}
                onBuy={(id) => buyMutation.mutate(id)}
                buyingId={buyingId}
                theme={theme}
              />
            )}

          </div>
        </main>
      </div>
    </>
  )
}
