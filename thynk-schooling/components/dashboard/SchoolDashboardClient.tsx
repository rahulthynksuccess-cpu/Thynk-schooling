'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Star, Zap,
  ShoppingCart, Package, Settings, ChevronRight,
  BarChart3, GraduationCap, LogOut, Menu, X,
  ArrowUpRight, CheckCircle2, Clock,
  Loader2, MapPin, Sparkles, Phone, Flame,
  ArrowUp, ArrowDown, LayoutGrid
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { Lead, LeadCredits, SchoolDashboardStats } from '@/types'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsPoint { date: string; leads: number; applications: number }

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/school',              badge: null },
  { icon: Users,           label: 'Leads',          href: '/dashboard/school/leads',        badge: 'new' },
  { icon: FileText,        label: 'Applications',   href: '/dashboard/school/applications', badge: null },
  { icon: Star,            label: 'Reviews',        href: '/dashboard/school/reviews',      badge: null },
  { icon: LayoutGrid,      label: 'Subscription Plan', href: '/pricing',                       badge: null },
  { icon: BarChart3,       label: 'Analytics',      href: '/dashboard/school/analytics',    badge: null },
  { icon: Settings,        label: 'School Profile', href: '/school/complete-profile',       badge: null },
]

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplayed(0); return }
    const start = 0; const end = value; const duration = 1200
    const startTime = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(start + (end - start) * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{displayed.toLocaleString('en-IN')}</>
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.color }} />
          <span className="tooltip-name">{p.name}</span>
          <span className="tooltip-value">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, onClose, credits }: { active: string; onClose?: () => void; credits?: LeadCredits }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  return (
    <aside className="dash-sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand">
          <div className="brand-icon"><GraduationCap size={18} color="#fff" /></div>
          <div>
            <div className="brand-name">Thynk Schooling</div>
            <div className="brand-tag">School Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} className="sidebar-close"><X size={15} /></button>}
      </div>
      <div className="sidebar-user">
        <div className="user-avatar">{(user?.fullName || user?.phone || 'S')[0].toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user?.fullName || 'School Admin'}</div>
          <div className="user-role"><span className="role-dot" />Administrator</div>
        </div>
      </div>
      {credits && (
        <div className="sidebar-credits">
          <Zap size={13} color="#F59E0B" />
          <span className="credits-label">Lead Credits</span>
          <span className="credits-value">{credits.availableCredits}</span>
        </div>
      )}
      <nav className="sidebar-nav">
        {NAV.map(({ icon: Icon, label, href, badge }) => {
          const isActive = active === href
          return (
            <Link key={href} href={href} className={`nav-item${isActive ? ' nav-active' : ''}`}>
              <div className="nav-icon-wrap"><Icon size={15} /></div>
              <span className="nav-label">{label}</span>
              {badge === 'new' && <span className="nav-badge">New</span>}
              {isActive && <ChevronRight size={12} className="nav-chevron" />}
            </Link>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => { logout(); router.replace('/login') }} className="logout-btn">
          <LogOut size={14} /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, href, trend, trendVal, delay = 0 }: any) {
  const isUp = trend === 'up'
  const inner = (
    <motion.div className="stat-card" style={{ '--card-color': color } as any}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
    >
      <div className="stat-glow" />
      <div className="stat-top">
        <div className="stat-icon-wrap"><Icon size={17} color={color} /></div>
        {trend && (
          <div className={`stat-trend trend-${isUp ? 'up' : 'down'}`}>
            {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {trendVal}
          </div>
        )}
      </div>
      <div className="stat-value">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div className="stat-bar" />
    </motion.div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  return inner
}

// ─── Credit Ring ──────────────────────────────────────────────────────────────
function CreditRing({ credits }: { credits: LeadCredits }) {
  const data = [
    { name: 'Used',      value: credits.usedCredits,      fill: '#E5E7EB' },
    { name: 'Available', value: Math.max(credits.availableCredits, 0), fill: '#F59E0B' },
  ]
  if (data[0].value === 0 && data[1].value === 0) data[1].value = 1
  return (
    <div className="credit-ring-wrap">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx={65} cy={65} innerRadius={48} outerRadius={62}
            dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="credit-ring-center">
        <div className="credit-ring-val"><AnimatedNumber value={credits.availableCredits} /></div>
        <div className="credit-ring-sub">credits</div>
      </div>
    </div>
  )
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, onBuy, buying, index }: { lead: Lead; onBuy: (id: string) => void; buying: boolean; index: number }) {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    new:             { color: '#10B981', bg: '#D1FAE5', label: 'New' },
    contacted:       { color: '#3B82F6', bg: '#DBEAFE', label: 'Contacted' },
    interested:      { color: '#F59E0B', bg: '#FEF3C7', label: 'Interested' },
    not_interested:  { color: '#6B7280', bg: '#F3F4F6', label: 'Not Interested' },
    admitted:        { color: '#8B5CF6', bg: '#EDE9FE', label: 'Admitted' },
    lost:            { color: '#EF4444', bg: '#FEE2E2', label: 'Lost' },
  }
  const st = statusConfig[lead.status] || statusConfig.new
  return (
    <motion.tr className="lead-row"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <td className="lead-td lead-td-first">
        <div className="lead-avatar">{(lead.isPurchased ? lead.fullName : lead.maskedName || '?')[0]}</div>
        <div>
          <div className="lead-name">{lead.isPurchased ? lead.fullName : lead.maskedName}</div>
          <div className="lead-meta">{lead.childName} · Class {lead.classApplyingFor}</div>
        </div>
      </td>
      <td className="lead-td">
        <div className="lead-phone" style={{ opacity: lead.isPurchased ? 1 : 0.45 }}>
          <Phone size={11} color="#9CA3AF" />
          {lead.isPurchased ? lead.fullPhone : lead.maskedPhone}
        </div>
      </td>
      <td className="lead-td">
        <div className="lead-city"><MapPin size={11} color="#F59E0B" />{lead.city}</div>
      </td>
      <td className="lead-td">
        <span className="status-chip" style={{ color: st.color, background: st.bg }}>
          <span className="status-dot" style={{ background: st.color }} />{st.label}
        </span>
      </td>
      <td className="lead-td lead-td-action">
        {lead.isPurchased ? (
          <span className="unlocked-chip"><CheckCircle2 size={11} /> Unlocked</span>
        ) : (
          <motion.button onClick={() => onBuy(lead.id)} disabled={buying} className="buy-btn"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {buying ? <Loader2 size={12} className="spin" /> : <ShoppingCart size={12} />}
            Unlock Lead
          </motion.button>
        )}
      </td>
    </motion.tr>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function SchoolDashboardClient() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area')
  const queryClient = useQueryClient()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    if (user.role !== 'school_admin') {
      if (user.role === 'super_admin') router.replace('/admin')
      else router.replace('/dashboard/parent')
    }
  }, [mounted, accessToken, user, router])

  const enabled = !!accessToken && mounted

  const { data: stats, isLoading: statsLoading } = useQuery<SchoolDashboardStats>({
    queryKey: ['school-dashboard-stats'],
    queryFn: () => fetch('/api/schools?action=dashboard-stats', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
    enabled, staleTime: 2 * 60 * 1000,
  })
  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[]; total: number }>({
    queryKey: ['school-leads', { limit: 8 }],
    queryFn: () => fetch('/api/leads?limit=8', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
    enabled, staleTime: 60 * 1000,
  })
  const { data: credits } = useQuery<LeadCredits>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
    enabled, staleTime: 60 * 1000,
  })
  const { data: analyticsRaw } = useQuery<{ leads: any[]; applications: any[] }>({
    queryKey: ['school-analytics-30d'],
    queryFn: () => fetch('/api/schools?action=analytics&days=30', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
    enabled, staleTime: 5 * 60 * 1000,
  })

  // Merge leads + apps into one series
  const analyticsData: AnalyticsPoint[] = (() => {
    if (!analyticsRaw) return []
    const map: Record<string, AnalyticsPoint> = {}
    ;(analyticsRaw.leads || []).forEach(({ day, count }: any) => {
      map[day] = { date: day, leads: Number(count), applications: 0 }
    })
    ;(analyticsRaw.applications || []).forEach(({ day, count }: any) => {
      if (map[day]) map[day].applications = Number(count)
      else map[day] = { date: day, leads: 0, applications: Number(count) }
    })
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }))
  })()

  const [buyingId, setBuyingId] = useState<string | null>(null)
  const buyLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      setBuyingId(leadId)
      return fetch(`/api/leads?id=${leadId}&action=purchase`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }).then(r => r.json())
    },
    onSuccess: () => {
      toast.success('Lead unlocked!')
      queryClient.invalidateQueries({ queryKey: ['school-leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-credits'] })
      setBuyingId(null)
    },
    onError: () => { toast.error('Failed to purchase lead.'); setBuyingId(null) },
  })

  if (!mounted || !accessToken || !user || user.role !== 'school_admin') {
    return (
      <div className="dash-loading">
        <motion.div className="loading-spinner"
          animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <GraduationCap size={22} color="#F59E0B" />
        </motion.div>
        <div className="loading-text">Loading dashboard…</div>
      </div>
    )
  }

  const leads = leadsData?.data ?? []

  const STAT_CARDS = [
    { icon: Users,    label: 'Total Leads',    value: stats?.totalLeads ?? 0,        color: '#F59E0B', href: '/dashboard/school/leads',        trend: 'up', trendVal: `+${stats?.newLeadsToday ?? 0} today`, sub: 'Parent enquiries' },
    { icon: FileText, label: 'Applications',   value: stats?.totalApplications ?? 0, color: '#6366F1', href: '/dashboard/school/applications', trend: null, trendVal: null, sub: 'Admission requests' },
    { icon: Star,     label: 'Avg Rating',     value: stats?.avgRating ? parseFloat(stats.avgRating.toFixed(1)) : 0, color: '#10B981', href: '/dashboard/school/reviews', trend: null, trendVal: null, sub: 'Parent reviews' },
    { icon: Zap,      label: 'Lead Credits',   value: credits?.availableCredits ?? 0, color: '#EC4899', href: '/pricing', trend: null, trendVal: null, sub: 'Available to unlock' },
  ]

  return (
    <>
      <style>{STYLES}</style>
      <div className="dash-root">

        {/* Desktop Sidebar */}
        <div className="dash-sidebar-desktop">
          <Sidebar active="/dashboard/school" credits={credits} />
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div className="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="mobile-sidebar-wrap"
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Sidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} credits={credits} />
              </motion.div>
              <div className="overlay-backdrop" onClick={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="dash-main">

          {/* Header */}
          <header className="dash-header">
            <div className="header-left">
              <button className="menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={16} /></button>
              <div>
                <h1 className="header-title">School <em style={{fontStyle:"italic",color:"var(--gold,#B8860B)"}}>Dashboard</em></h1>
                <p className="header-sub">Welcome back, {user.fullName?.split(' ')[0] || 'Admin'} 👋</p>
              </div>
            </div>
            <div className="header-right">
              {credits && (
                <div className="header-credits">
                  <Zap size={13} color="#F59E0B" />
                  <span className="hc-val">{credits.availableCredits}</span>
                  <span className="hc-label">credits</span>
                </div>
              )}
              <Link href="/pricing" className="header-buy-btn">
                <Sparkles size={13} /> Upgrade Plan
              </Link>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="dash-content">

            {/* Profile Banner */}
            {stats && (stats as any).profileCompleteness < 100 && (
              <motion.div className="profile-banner"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="banner-left">
                  <div className="banner-icon"><Flame size={16} color="#F59E0B" /></div>
                  <div>
                    <div className="banner-title">
                      Profile {(stats as any).profileCompleteness}% complete — finish to get 3× more leads
                    </div>
                    <div className="banner-progress-wrap">
                      <div className="banner-progress-bar">
                        <motion.div className="banner-progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats as any).profileCompleteness}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }} />
                      </div>
                      <span className="banner-pct">{(stats as any).profileCompleteness}%</span>
                    </div>
                  </div>
                </div>
                <Link href="/school/complete-profile" className="banner-cta">
                  Complete Now <ChevronRight size={14} />
                </Link>
              </motion.div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              {statsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="stat-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))
                : STAT_CARDS.map((card, i) => <StatCard key={card.label} {...card} delay={i * 0.08} />)
              }
            </div>

            {/* Charts Row */}
            <div className="charts-row">

              {/* Activity Chart */}
              <motion.div className="chart-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Activity Overview</h3>
                    <p className="chart-sub">Leads & applications · last 30 days</p>
                  </div>
                  <div className="chart-controls">
                    <button className={`chart-toggle${activeChart === 'area' ? ' toggle-active' : ''}`} onClick={() => setActiveChart('area')}>Area</button>
                    <button className={`chart-toggle${activeChart === 'bar' ? ' toggle-active' : ''}`} onClick={() => setActiveChart('bar')}>Bar</button>
                  </div>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#F59E0B' }} />Leads</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#6366F1' }} />Applications</span>
                </div>
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    {activeChart === 'area' ? (
                      <AreaChart data={analyticsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="leads" name="Leads" stroke="#F59E0B" strokeWidth={2} fill="url(#gLeads)" dot={false} activeDot={{ r: 5, fill: '#F59E0B' }} />
                        <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366F1" strokeWidth={2} fill="url(#gApps)" dot={false} activeDot={{ r: 5, fill: '#6366F1' }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={analyticsData} barSize={8} barGap={3} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="leads" name="Leads" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="applications" name="Applications" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    <BarChart3 size={40} color="#E5E7EB" />
                    <p>No activity yet — complete your profile to start receiving leads</p>
                  </div>
                )}
              </motion.div>

              {/* Credits Card */}
              <motion.div className="credits-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <h3 className="chart-title" style={{ marginBottom: 4 }}>Lead Credits</h3>
                <p className="chart-sub" style={{ marginBottom: 16 }}>Unlock parent contact details</p>
                {credits ? (
                  <>
                    <CreditRing credits={credits} />
                    <div className="credit-stats">
                      {[
                        { label: 'Total Purchased', val: credits.totalCredits,     color: '#374151' },
                        { label: 'Used',            val: credits.usedCredits,      color: '#EF4444' },
                        { label: 'Available',       val: credits.availableCredits, color: '#10B981' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="credit-stat-row">
                          <span className="cs-label">{label}</span>
                          <span className="cs-val" style={{ color }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {credits.expiresAt && (
                      <div className="credit-expiry">
                        <Clock size={11} color="#9CA3AF" />
                        Expires {new Date(credits.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <Link href="/pricing" className="credits-buy-btn">
                      <Package size={14} /> Buy More Credits
                    </Link>
                  </>
                ) : (
                  <div className="credits-empty">
                    <Package size={40} color="#E5E7EB" />
                    <p>No credits yet</p>
                    <Link href="/pricing" className="credits-buy-btn">Upgrade Plan</Link>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Leads Table */}
            <motion.div className="leads-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <div className="leads-header">
                <div>
                  <h3 className="chart-title">Recent Leads</h3>
                  <p className="chart-sub">{leadsData?.total ? `${leadsData.total} total leads` : 'Parents looking for schools like yours'}</p>
                </div>
                <Link href="/dashboard/school/leads" className="view-all-btn">
                  View All <ChevronRight size={13} />
                </Link>
              </div>

              {leadsLoading ? (
                <div className="leads-skeleton">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="lead-skel-row" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="leads-empty">
                  <Users size={44} color="#E5E7EB" />
                  <div className="leads-empty-title">No leads yet</div>
                  <div className="leads-empty-sub">Complete your school profile to start receiving leads.</div>
                  <Link href="/school/complete-profile" className="leads-empty-cta">
                    Complete Profile <ChevronRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="leads-table-wrap">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        {['Parent / Child', 'Phone', 'City', 'Status', 'Action'].map(h => (
                          <th key={h} className="leads-th" style={{ textAlign: h === 'Action' ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <LeadRow key={lead.id} lead={lead} index={i}
                          onBuy={id => buyLeadMutation.mutate(id)}
                          buying={buyingId === lead.id} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

          </main>
        </div>
      </div>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --gold: #F59E0B; --gold-light: #FEF3C7; --indigo: #6366F1;
  --green: #10B981; --pink: #EC4899; --red: #EF4444;
  --bg: #F7F8FC; --surface: #fff; --border: rgba(0,0,0,0.07);
  --text: #111827; --muted: #6B7280;
  --sidebar-w: 252px; --radius: 16px;
  --font: 'Outfit', sans-serif; --serif: 'Playfair Display', Georgia, serif;
}

.dash-root { display:flex; height:100vh; background:var(--bg); font-family:var(--font); overflow:hidden; }
.dash-sidebar-desktop { display:none; width:var(--sidebar-w); flex-shrink:0; height:100%; }
@media(min-width:1024px){ .dash-sidebar-desktop { display:flex; flex-direction:column; } }
.dash-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }

/* Sidebar */
.dash-sidebar { width:var(--sidebar-w); height:100%; display:flex; flex-direction:column; background:#fff; border-right:1px solid var(--border); }
.sidebar-header { padding:20px 18px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.sidebar-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
.brand-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#F59E0B,#FBBF24); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(245,158,11,.35); flex-shrink:0; }
.brand-name { font-family:var(--serif); font-weight:700; font-size:14px; color:var(--text); line-height:1; }
.brand-tag { font-size:9px; font-weight:600; color:var(--gold); letter-spacing:.1em; text-transform:uppercase; margin-top:2px; }
.sidebar-close { background:none; border:none; cursor:pointer; padding:4px; color:var(--muted); }
.sidebar-user { display:flex; align-items:center; gap:10px; margin:12px 12px 8px; padding:12px 14px; background:linear-gradient(135deg,#FFFBEB,#FEF9EE); border:1px solid rgba(245,158,11,.15); border-radius:12px; }
.user-avatar { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#F59E0B,#FBBF24); display:flex; align-items:center; justify-content:center; font-family:var(--serif); font-weight:700; font-size:16px; color:#fff; flex-shrink:0; }
.user-info { min-width:0; }
.user-name { font-weight:600; font-size:13px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-role { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--gold); font-weight:500; margin-top:2px; }
.role-dot { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 0 2px rgba(16,185,129,.2); animation:pdot 2s ease-in-out infinite; }
@keyframes pdot { 0%,100%{box-shadow:0 0 0 2px rgba(16,185,129,.2)} 50%{box-shadow:0 0 0 4px rgba(16,185,129,.08)} }
.sidebar-credits { display:flex; align-items:center; gap:6px; margin:0 12px 8px; padding:8px 14px; background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.15); border-radius:8px; font-size:12px; }
.credits-label { flex:1; color:var(--muted); }
.credits-value { font-weight:700; font-size:14px; color:var(--gold); }
.sidebar-nav { flex:1; overflow-y:auto; padding:6px 10px; }
.nav-item { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px; margin-bottom:2px; text-decoration:none; font-size:13px; font-weight:400; color:var(--muted); transition:all .15s ease; border-left:3px solid transparent; }
.nav-item:hover { background:rgba(0,0,0,.04); color:var(--text); }
.nav-active { background:rgba(245,158,11,.08)!important; color:#D97706!important; font-weight:600!important; border-left-color:#F59E0B!important; }
.nav-icon-wrap { width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.nav-label { flex:1; }
.nav-badge { font-size:9px; font-weight:700; padding:2px 6px; border-radius:99px; background:var(--green); color:#fff; text-transform:uppercase; letter-spacing:.05em; }
.nav-chevron { opacity:.5; }
.sidebar-footer { padding:10px; border-top:1px solid var(--border); }
.logout-btn { width:100%; display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:9px; background:none; border:none; cursor:pointer; font-family:var(--font); font-size:13px; color:var(--red); transition:background .15s; }
.logout-btn:hover { background:rgba(239,68,68,.06); }

/* Header */
.dash-header { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:66px; background:#fff; border-bottom:1px solid var(--border); flex-shrink:0; gap:12px; }
.header-left { display:flex; align-items:center; gap:14px; }
.menu-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:none; border:1px solid var(--border); border-radius:9px; cursor:pointer; color:var(--muted); flex-shrink:0; }
@media(min-width:1024px){ .menu-btn { display:none; } }
.header-title { font-family:var(--serif); font-weight:700; font-size:20px; color:var(--text); line-height:1; }
.header-sub { font-size:12px; color:var(--muted); margin-top:2px; }
.header-right { display:flex; align-items:center; gap:10px; }
.header-credits { display:flex; align-items:center; gap:6px; padding:7px 12px; background:#FFFBEB; border:1px solid rgba(245,158,11,.25); border-radius:9px; }
.hc-val { font-weight:700; font-size:14px; color:var(--text); }
.hc-label { font-size:11px; color:var(--gold); }
.header-buy-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:9px; background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#fff; font-weight:600; font-size:13px; text-decoration:none; box-shadow:0 4px 12px rgba(245,158,11,.35); transition:all .2s; }
.header-buy-btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(245,158,11,.4); }

/* Content */
.dash-content { flex:1; overflow-y:auto; padding:clamp(16px,2.5vw,28px); }

/* Profile Banner */
.profile-banner { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 20px; background:linear-gradient(135deg,#FFFBEB,#FEF9EE); border:1px solid rgba(245,158,11,.25); border-radius:var(--radius); margin-bottom:22px; }
.banner-left { display:flex; align-items:center; gap:14px; }
.banner-icon { width:38px; height:38px; border-radius:10px; background:rgba(245,158,11,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.banner-title { font-weight:600; font-size:13px; color:var(--text); margin-bottom:8px; }
.banner-progress-wrap { display:flex; align-items:center; gap:10px; }
.banner-progress-bar { width:180px; height:5px; background:rgba(245,158,11,.15); border-radius:99px; overflow:hidden; }
.banner-progress-fill { height:100%; background:linear-gradient(90deg,#F59E0B,#FBBF24); border-radius:99px; }
.banner-pct { font-size:12px; font-weight:600; color:var(--gold); }
.banner-cta { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:9px; background:var(--gold); color:#fff; text-decoration:none; font-weight:600; font-size:12px; white-space:nowrap; flex-shrink:0; transition:all .2s; }
.banner-cta:hover { background:#D97706; }

/* Stats */
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:16px; margin-bottom:20px; }
.stat-card { background:#fff; border:1px solid var(--border); border-radius:var(--radius); padding:22px 20px; position:relative; overflow:hidden; cursor:default; }
.stat-glow { position:absolute; top:-40px; right:-40px; width:100px; height:100px; border-radius:50%; background:var(--card-color,#F59E0B); opacity:.06; filter:blur(20px); pointer-events:none; }
.stat-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
.stat-icon-wrap { width:40px; height:40px; border-radius:11px; background:rgba(0,0,0,.04); display:flex; align-items:center; justify-content:center; }
.stat-trend { display:flex; align-items:center; gap:3px; font-size:11px; font-weight:600; padding:3px 7px; border-radius:99px; }
.trend-up { color:#10B981; background:#D1FAE5; }
.trend-down { color:#EF4444; background:#FEE2E2; }
.stat-value { font-family:var(--serif); font-weight:700; font-size:34px; color:var(--text); line-height:1; letter-spacing:-1px; margin-bottom:5px; }
.stat-label { font-size:12px; color:var(--muted); font-weight:500; }
.stat-sub { font-size:11px; color:var(--muted); margin-top:5px; }
.stat-bar { position:absolute; bottom:0; left:0; right:0; height:3px; background:var(--card-color,#F59E0B); opacity:.35; border-radius:0 0 16px 16px; }
.stat-skeleton { height:148px; border-radius:var(--radius); background:linear-gradient(90deg,#f0f0f0 25%,#f7f7f7 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Charts */
.charts-row { display:grid; grid-template-columns:1fr 260px; gap:16px; margin-bottom:20px; }
@media(max-width:900px){ .charts-row { grid-template-columns:1fr; } }
.chart-card, .credits-card { background:#fff; border:1px solid var(--border); border-radius:var(--radius); padding:22px 22px 18px; }
.credits-card { display:flex; flex-direction:column; align-items:center; text-align:center; }
.chart-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6px; }
.chart-title { font-family:var(--serif); font-weight:700; font-size:18px; color:var(--text); }
.chart-sub { font-size:12px; color:var(--muted); margin-top:2px; }
.chart-controls { display:flex; gap:4px; background:#F3F4F6; border-radius:8px; padding:3px; }
.chart-toggle { padding:4px 10px; border-radius:6px; border:none; font-family:var(--font); font-size:11px; font-weight:500; cursor:pointer; background:transparent; color:var(--muted); transition:all .15s; }
.toggle-active { background:#fff!important; color:var(--text)!important; font-weight:600!important; box-shadow:0 1px 3px rgba(0,0,0,.1)!important; }
.chart-legend { display:flex; gap:16px; margin-bottom:16px; }
.legend-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); }
.legend-dot { width:10px; height:10px; border-radius:3px; }
.chart-empty { height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; }
.chart-empty p { font-size:13px; color:var(--muted); text-align:center; max-width:200px; }
.chart-tooltip { background:#fff; border:1px solid var(--border); border-radius:10px; padding:10px 14px; box-shadow:0 8px 24px rgba(0,0,0,.1); font-family:var(--font); }
.tooltip-label { font-size:11px; color:var(--muted); margin-bottom:6px; font-weight:500; }
.tooltip-row { display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:2px; }
.tooltip-dot { width:8px; height:8px; border-radius:2px; }
.tooltip-name { color:var(--muted); flex:1; }
.tooltip-value { font-weight:700; color:var(--text); }

/* Credits card */
.credit-ring-wrap { position:relative; margin-bottom:12px; }
.credit-ring-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; }
.credit-ring-val { font-family:var(--serif); font-weight:700; font-size:30px; color:var(--gold); line-height:1; }
.credit-ring-sub { font-size:11px; color:var(--muted); margin-top:2px; }
.credit-stats { width:100%; margin-bottom:10px; }
.credit-stat-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(0,0,0,.04); font-size:12px; }
.cs-label { color:var(--muted); }
.cs-val { font-weight:700; }
.credit-expiry { display:flex; align-items:center; gap:5px; font-size:11px; color:#9CA3AF; margin-bottom:12px; }
.credits-buy-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:11px 16px; background:var(--text); border-radius:10px; color:#fff; text-decoration:none; font-weight:600; font-size:13px; transition:all .2s; margin-top:auto; }
.credits-buy-btn:hover { background:#1F2937; transform:translateY(-1px); }
.credits-empty { display:flex; flex-direction:column; align-items:center; gap:10px; flex:1; justify-content:center; }
.credits-empty p { font-size:13px; color:var(--muted); }

/* Leads Table */
.leads-card { background:#fff; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
.leads-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--border); }
.view-all-btn { display:inline-flex; align-items:center; gap:4px; font-size:13px; color:var(--gold); text-decoration:none; font-weight:600; transition:color .15s; }
.view-all-btn:hover { color:#D97706; }
.leads-table-wrap { overflow-x:auto; }
.leads-table { width:100%; border-collapse:collapse; }
.leads-th { padding:10px 18px; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#9CA3AF; background:#FAFAFA; border-bottom:1px solid var(--border); }
.lead-row { border-bottom:1px solid rgba(0,0,0,.04); transition:background .15s; }
.lead-row:hover { background:rgba(245,158,11,.02); }
.lead-row:last-child { border-bottom:none; }
.lead-td { padding:13px 18px; vertical-align:middle; }
.lead-td-first { display:flex; align-items:center; gap:10px; }
.lead-td-action { text-align:right; }
.lead-avatar { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(245,158,11,.3)); border:1px solid rgba(245,158,11,.2); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; color:var(--gold); flex-shrink:0; font-family:var(--serif); }
.lead-name { font-weight:600; font-size:13px; color:var(--text); }
.lead-meta { font-size:11px; color:var(--muted); margin-top:2px; }
.lead-phone { display:flex; align-items:center; gap:5px; font-size:12px; color:#4B5563; font-family:'Courier New',monospace; }
.lead-city { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--muted); }
.status-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:99px; font-size:11px; font-weight:600; }
.status-dot { width:5px; height:5px; border-radius:50%; }
.unlocked-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:99px; background:#D1FAE5; color:#10B981; font-size:11px; font-weight:600; }
.buy-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; background:var(--text); border:none; color:#fff; cursor:pointer; font-family:var(--font); font-size:12px; font-weight:500; transition:background .2s; }
.buy-btn:disabled { opacity:.5; cursor:not-allowed; }
.buy-btn:not(:disabled):hover { background:#1F2937; }
.leads-skeleton { padding:16px 22px; }
.lead-skel-row { height:52px; border-radius:9px; background:linear-gradient(90deg,#f5f5f5 25%,#fafafa 50%,#f5f5f5 75%); background-size:200% 100%; margin-bottom:8px; animation:shimmer 1.5s infinite; }
.leads-empty { padding:52px 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; }
.leads-empty-title { font-weight:600; font-size:15px; color:var(--text); }
.leads-empty-sub { font-size:13px; color:var(--muted); max-width:300px; }
.leads-empty-cta { display:inline-flex; align-items:center; gap:5px; padding:9px 18px; border-radius:9px; background:var(--gold); color:#fff; text-decoration:none; font-weight:600; font-size:13px; margin-top:4px; }

/* Mobile overlay */
.mobile-overlay { position:fixed; inset:0; z-index:50; display:flex; }
.mobile-sidebar-wrap { width:var(--sidebar-w); height:100%; flex-shrink:0; }
.overlay-backdrop { flex:1; background:rgba(0,0,0,.4); }

/* Loading */
.dash-loading { min-height:100vh; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; font-family:var(--font); }
.loading-spinner { width:50px; height:50px; border-radius:14px; background:linear-gradient(135deg,#F59E0B,#FBBF24); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 20px rgba(245,158,11,.35); }
.loading-text { font-size:14px; color:var(--muted); }

/* Utils */
.spin { animation:spin-kf 1s linear infinite; }
@keyframes spin-kf { to { transform:rotate(360deg); } }
`
