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
  ArrowUp, ArrowDown, LayoutGrid, TrendingUp
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { Lead, LeadCredits, SchoolDashboardStats } from '@/types'
import toast from 'react-hot-toast'

interface AnalyticsPoint { date: string; leads: number; applications: number }

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',        href: '/dashboard/school',              badge: null },
  { icon: Users,           label: 'Leads',             href: '/dashboard/school/leads',        badge: 'new' },
  { icon: FileText,        label: 'Applications',      href: '/dashboard/school/applications', badge: null },
  { icon: Star,            label: 'Reviews',           href: '/dashboard/school/reviews',      badge: null },
  { icon: LayoutGrid,      label: 'Subscription Plan', href: '/pricing',                       badge: null },
  { icon: BarChart3,       label: 'Analytics',         href: '/dashboard/school/analytics',    badge: null },
  { icon: Settings,        label: 'School Profile',    href: '/school/complete-profile',       badge: null },
]

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

function Sidebar({ active, onClose, credits }: { active: string; onClose?: () => void; credits?: LeadCredits }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  return (
    <aside className="dash-sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand">
          <div className="brand-icon"><GraduationCap size={18} color="#fff" /></div>
          <div>
            <div className="brand-name">Thynk<span>Schooling</span></div>
            <div className="brand-tag">School Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} className="sidebar-close"><X size={15} /></button>}
      </div>

      <div className="sidebar-user">
        <div className="user-avatar-wrap">
          <div className="user-avatar">{(user?.fullName || user?.phone || 'S')[0].toUpperCase()}</div>
          <div className="user-avatar-ring" />
        </div>
        <div className="user-info">
          <div className="user-name">{user?.fullName || 'School Admin'}</div>
          <div className="user-role"><span className="role-dot" />Administrator</div>
        </div>
      </div>

      {credits && (
        <div className="sidebar-credits">
          <div className="credits-left">
            <Zap size={13} color="#F59E0B" />
            <span className="credits-label">Lead Credits</span>
          </div>
          <span className="credits-badge">{Number(credits?.availableCredits) || 0}</span>
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

function StatCard({ icon: Icon, label, value, sub, color, href, trend, trendVal, delay = 0 }: any) {
  const isUp = trend === 'up'
  const inner = (
    <motion.div className="stat-card" style={{ '--card-color': color } as any}
      initial={{ opacity: 0, y: 28, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <div className="stat-noise" />
      <div className="stat-glow" />
      <div className="stat-top">
        <div className="stat-icon-wrap" style={{ background: `${color}16`, border: `1px solid ${color}28` }}>
          <Icon size={17} color={color} />
        </div>
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
      <div className="stat-bar" style={{ background: color }} />
    </motion.div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  return inner
}

function CreditRing({ credits }: { credits: LeadCredits }) {
  const avail = Math.max(Number(credits?.availableCredits) || 0, 0)
  const used = Number(credits?.usedCredits) || 0
  const data = [
    { name: 'Used',      value: used || (avail === 0 ? 1 : 0), fill: '#E5E7EB' },
    { name: 'Available', value: avail,                          fill: '#F59E0B' },
  ]
  return (
    <div className="credit-ring-wrap">
      <ResponsiveContainer width={150} height={150}>
        <PieChart>
          <Pie data={data} cx={70} cy={70} innerRadius={50} outerRadius={65}
            dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="credit-ring-center">
        <div className="credit-ring-val"><AnimatedNumber value={avail} /></div>
        <div className="credit-ring-sub">credits left</div>
      </div>
    </div>
  )
}

function LeadRow({ lead, onBuy, buying, index }: { lead: Lead; onBuy: (id: string) => void; buying: boolean; index: number }) {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    new:            { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'New' },
    contacted:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Contacted' },
    interested:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Interested' },
    not_interested: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)',label: 'Not Interested' },
    admitted:       { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Admitted' },
    lost:           { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  label: 'Lost' },
  }
  const st = statusConfig[lead.status] || statusConfig.new
  return (
    <motion.tr className="lead-row"
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <td className="lead-td lead-td-first">
        <div className="lead-avatar">{(lead.isPurchased ? lead.fullName : lead.maskedName || '?')[0]}</div>
        <div>
          <div className="lead-name">{lead.isPurchased ? lead.fullName : lead.maskedName}</div>
          <div className="lead-meta">{lead.childName} · Class {lead.classApplyingFor}</div>
        </div>
      </td>
      <td className="lead-td">
        <div className="lead-phone" style={{ opacity: lead.isPurchased ? 1 : 0.4 }}>
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
          <GraduationCap size={22} color="#fff" />
        </motion.div>
        <div className="loading-text">Loading dashboard…</div>
      </div>
    )
  }

  const profilePct = stats?.profileCompletion ?? 0
  const leads = leadsData?.data || []

  return (
    <>
      <style>{CSS}</style>
      <div className="dash-root">

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div className="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mobile-sidebar-wrap">
                <Sidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} credits={credits} />
              </div>
              <div className="overlay-backdrop" onClick={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop sidebar */}
        <div className="dash-sidebar-wrap">
          <Sidebar active="/dashboard/school" credits={credits} />
        </div>

        {/* Main */}
        <main className="dash-main">
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <div className="mobile-brand">ThynkSchooling</div>
          </div>

          <div className="dash-content">

            {/* ── Page Header ── */}
            <motion.div className="page-header"
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>
              <div>
                <h1 className="page-title">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
                  <span className="page-title-name"> {user?.fullName?.split(' ')[0] || 'Admin'}</span> 👋
                </h1>
                <p className="page-sub">Here's what's happening with your school today</p>
              </div>
              <div className="header-meta">
                <div className="header-date">
                  <Clock size={13} />
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
            </motion.div>

            {/* ── Profile Completion Banner ── */}
            {profilePct < 100 && (
              <motion.div className="profile-banner"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}>
                <div className="banner-shimmer" />
                <div className="banner-left">
                  <div className="banner-icon"><Sparkles size={18} color="#F59E0B" /></div>
                  <div>
                    <div className="banner-title">Complete your school profile to attract more parents</div>
                    <div className="banner-progress-wrap">
                      <div className="banner-progress-bar">
                        <motion.div className="banner-progress-fill"
                          initial={{ width: 0 }} animate={{ width: `${profilePct}%` }}
                          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }} />
                      </div>
                      <span className="banner-pct">{profilePct}% complete</span>
                    </div>
                  </div>
                </div>
                <Link href="/school/complete-profile" className="banner-cta">
                  Complete Profile <ArrowUpRight size={13} />
                </Link>
              </motion.div>
            )}

            {/* ── Stats Grid ── */}
            <div className="stats-grid">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="stat-skeleton" />)
              ) : (
                <>
                  <StatCard icon={Users}      label="Total Leads"       value={stats?.totalLeads ?? 0}       color="#F59E0B" sub="All time"         trend="up"   trendVal="+12%" delay={0.05} href="/dashboard/school/leads" />
                  <StatCard icon={Flame}      label="New This Month"    value={stats?.newLeadsThisMonth ?? 0} color="#EF4444" sub="Last 30 days"     trend="up"   trendVal="+8%"  delay={0.10} />
                  <StatCard icon={FileText}   label="Applications"      value={stats?.totalApplications ?? 0} color="#8B5CF6" sub="Received"         trend="down" trendVal="-3%"  delay={0.15} href="/dashboard/school/applications" />
                  <StatCard icon={Star}       label="Avg Rating"        value={stats?.avgRating ? `${Number(stats.avgRating).toFixed(1)}★` : '—'} color="#10B981" sub="From reviews" delay={0.20} href="/dashboard/school/reviews" />
                </>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="charts-row">

              {/* Area / Bar chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Performance Overview</div>
                    <div className="chart-sub">Leads & applications over 30 days</div>
                  </div>
                  <div className="chart-controls">
                    {(['area', 'bar'] as const).map(t => (
                      <button key={t} className={`chart-toggle${activeChart === t ? ' toggle-active' : ''}`}
                        onClick={() => setActiveChart(t)}>
                        {t === 'area' ? 'Area' : 'Bar'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#F59E0B' }} /> Leads</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#8B5CF6' }} /> Applications</div>
                </div>
                {analyticsData.length === 0 ? (
                  <div className="chart-empty">
                    <TrendingUp size={32} color="#E5E7EB" />
                    <p>No data yet — once parents start enquiring, your chart will appear here.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    {activeChart === 'area' ? (
                      <AreaChart data={analyticsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="leads" name="Leads" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gLeads)" dot={false} />
                        <Area type="monotone" dataKey="applications" name="Applications" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#gApps)" dot={false} />
                      </AreaChart>
                    ) : (
                      <BarChart data={analyticsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="leads" name="Leads" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="applications" name="Applications" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>

              {/* Credits donut */}
              <div className="credits-card">
                <div className="credits-card-top">
                  <div className="chart-title">Lead Credits</div>
                  <div className="chart-sub">Your current balance</div>
                </div>
                {credits ? (
                  <>
                    <CreditRing credits={credits} />
                    <div className="credit-stats">
                      <div className="credit-stat-row">
                        <span className="cs-label">Available</span>
                        <span className="cs-val" style={{ color: '#F59E0B' }}>{Number(credits.availableCredits) || 0}</span>
                      </div>
                      <div className="credit-stat-row">
                        <span className="cs-label">Used</span>
                        <span className="cs-val">{Number(credits.usedCredits) || 0}</span>
                      </div>
                      <div className="credit-stat-row">
                        <span className="cs-label">Total</span>
                        <span className="cs-val">{(Number(credits.availableCredits) || 0) + (Number(credits.usedCredits) || 0)}</span>
                      </div>
                    </div>
                    {credits.expiryDate && (
                      <div className="credit-expiry"><Clock size={11} /> Expires {new Date(credits.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    )}
                    <Link href="/pricing" className="credits-buy-btn">
                      <Zap size={14} /> Buy More Credits
                    </Link>
                  </>
                ) : (
                  <div className="credits-empty">
                    <Zap size={28} color="#E5E7EB" />
                    <p>No credits yet</p>
                    <Link href="/pricing" className="credits-buy-btn"><Zap size={13} /> Get Credits</Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── Leads Table ── */}
            <motion.div className="leads-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}>
              <div className="leads-header">
                <div>
                  <div className="chart-title">Recent Leads</div>
                  <div className="chart-sub">Latest parent enquiries for your school</div>
                </div>
                <Link href="/dashboard/school/leads" className="view-all-btn">
                  View all <ArrowUpRight size={13} />
                </Link>
              </div>

              {leadsLoading ? (
                <div className="leads-skeleton">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="lead-skel-row" />)}
                </div>
              ) : leads.length === 0 ? (
                <div className="leads-empty">
                  <div className="leads-empty-icon"><Users size={28} color="#D1D5DB" /></div>
                  <div className="leads-empty-title">No leads yet</div>
                  <div className="leads-empty-sub">Once parents start discovering your school, their enquiries will appear here.</div>
                  <Link href="/school/complete-profile" className="leads-empty-cta">Complete your profile <ArrowUpRight size={13} /></Link>
                </div>
              ) : (
                <div className="leads-table-wrap">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th className="leads-th">Parent</th>
                        <th className="leads-th">Phone</th>
                        <th className="leads-th">City</th>
                        <th className="leads-th">Status</th>
                        <th className="leads-th" style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <LeadRow key={lead.id} lead={lead} index={i}
                          onBuy={(id) => buyLeadMutation.mutate(id)}
                          buying={buyingId === lead.id && buyLeadMutation.isPending} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

          </div>
        </main>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #F6F3EE;
  --card: #FFFFFF;
  --sidebar-bg: #0E0C09;
  --sidebar-w: 248px;
  --gold: #D97706;
  --gold-2: #F59E0B;
  --border: rgba(13,17,23,0.07);
  --text: #0D1117;
  --muted: #6B7280;
  --font: 'DM Sans', sans-serif;
  --serif: 'Syne', sans-serif;
  --radius: 18px;
}

/* ── Root layout ── */
.dash-root { display:flex; min-height:100vh; background:var(--bg); font-family:var(--font); }
.dash-sidebar-wrap { width:var(--sidebar-w); flex-shrink:0; }
@media(max-width:860px) { .dash-sidebar-wrap { display:none; } }
.dash-main { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.dash-content { padding:32px 36px 48px; max-width:1140px; margin:0 auto; width:100%; }
@media(max-width:680px) { .dash-content { padding:20px 16px 40px; } }

/* ── Sidebar ── */
.dash-sidebar {
  width:var(--sidebar-w); height:100vh; background:var(--sidebar-bg);
  display:flex; flex-direction:column; position:sticky; top:0;
  overflow:hidden;
}
.dash-sidebar::before {
  content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
}
.sidebar-header { position:relative; z-index:1; padding:22px 20px 18px; border-bottom:1px solid rgba(255,255,255,0.06); }
.sidebar-brand { display:flex; align-items:center; gap:11px; text-decoration:none; }
.brand-icon { width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg,#D97706,#F59E0B); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(217,119,6,.4); }
.brand-name { font-family:var(--serif); font-size:17px; font-weight:800; color:#fff; letter-spacing:-.01em; }
.brand-name span { color:var(--gold-2); }
.brand-tag { font-size:10px; color:rgba(255,255,255,.28); font-weight:500; letter-spacing:.05em; margin-top:2px; }

.sidebar-close { background:none; border:none; color:rgba(255,255,255,.4); cursor:pointer; padding:4px; display:flex; position:absolute; right:16px; top:24px; z-index:2; }

.sidebar-user { position:relative; z-index:1; display:flex; align-items:center; gap:11px; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,.06); }
.user-avatar-wrap { position:relative; flex-shrink:0; }
.user-avatar { width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg,rgba(217,119,6,.3),rgba(245,158,11,.5)); display:flex; align-items:center; justify-content:center; font-family:var(--serif); font-weight:800; font-size:16px; color:#fff; }
.user-avatar-ring { position:absolute; inset:-2px; border-radius:13px; border:1.5px solid rgba(245,158,11,.4); pointer-events:none; }
.user-name { font-size:13px; font-weight:700; color:#fff; }
.user-role { display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,.3); margin-top:2px; }
.role-dot { width:5px; height:5px; border-radius:50%; background:#10B981; flex-shrink:0; box-shadow:0 0 5px #10B981; }

.sidebar-credits { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; margin:12px 16px; padding:10px 14px; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.2); border-radius:12px; }
.credits-left { display:flex; align-items:center; gap:6px; }
.credits-label { font-size:12px; font-weight:600; color:rgba(255,255,255,.6); }
.credits-badge { background:var(--gold-2); color:#fff; font-size:12px; font-weight:800; padding:2px 10px; border-radius:99px; font-family:var(--serif); }

.sidebar-nav { flex:1; overflow-y:auto; padding:10px 12px; position:relative; z-index:1; scrollbar-width:none; }
.sidebar-nav::-webkit-scrollbar { display:none; }
.nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:11px; text-decoration:none; color:rgba(255,255,255,.38); font-size:13px; font-weight:600; margin-bottom:2px; transition:all .18s; position:relative; }
.nav-item:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.7); }
.nav-active { background:rgba(217,119,6,.18) !important; color:#fff !important; }
.nav-active::before { content:''; position:absolute; left:0; top:8px; bottom:8px; width:3px; background:var(--gold-2); border-radius:0 3px 3px 0; }
.nav-icon-wrap { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.05); flex-shrink:0; }
.nav-active .nav-icon-wrap { background:rgba(217,119,6,.22); }
.nav-label { flex:1; }
.nav-badge { font-size:10px; font-weight:700; background:linear-gradient(135deg,#EF4444,#F97316); color:#fff; padding:2px 7px; border-radius:99px; }
.nav-chevron { color:rgba(255,255,255,.4); }

.sidebar-footer { position:relative; z-index:1; padding:14px 16px 20px; border-top:1px solid rgba(255,255,255,.06); }
.logout-btn { display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; border-radius:10px; border:none; background:rgba(255,255,255,.04); color:rgba(255,255,255,.35); cursor:pointer; font-family:var(--font); font-size:13px; font-weight:600; transition:all .18s; }
.logout-btn:hover { background:rgba(239,68,68,.1); color:#EF4444; }

/* ── Mobile topbar ── */
.mobile-topbar { display:none; align-items:center; gap:12px; padding:14px 16px; background:var(--sidebar-bg); border-bottom:1px solid rgba(255,255,255,.08); }
@media(max-width:860px) { .mobile-topbar { display:flex; } }
.mobile-menu-btn { background:none; border:none; color:rgba(255,255,255,.7); cursor:pointer; display:flex; padding:4px; }
.mobile-brand { font-family:var(--serif); font-size:16px; font-weight:800; color:#fff; }

/* ── Page header ── */
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:28px; padding-top:4px; }
.page-title { font-family:var(--serif); font-size:26px; font-weight:800; color:var(--text); letter-spacing:-.03em; line-height:1.2; }
.page-title-name { color:var(--gold); }
.page-sub { font-size:13px; color:var(--muted); margin-top:5px; }
.header-meta { flex-shrink:0; }
.header-date { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--muted); font-weight:500; background:var(--card); border:1px solid var(--border); padding:7px 12px; border-radius:99px; white-space:nowrap; box-shadow:0 1px 4px rgba(0,0,0,0.04); }

/* ── Profile Banner ── */
.profile-banner { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 24px; background:linear-gradient(135deg,#FFFBF0,#FEF7E0); border:1px solid rgba(217,119,6,.22); border-radius:var(--radius); margin-bottom:24px; box-shadow:0 4px 24px rgba(217,119,6,.08); position:relative; overflow:hidden; }
.banner-shimmer { position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.4) 50%,transparent 60%); background-size:200%; animation:bannerShimmer 3s ease-in-out infinite; pointer-events:none; }
@keyframes bannerShimmer { 0%,100%{background-position:200%} 50%{background-position:-200%} }
.banner-left { display:flex; align-items:center; gap:14px; }
.banner-icon { width:42px; height:42px; border-radius:12px; background:rgba(245,158,11,.14); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.banner-title { font-weight:700; font-size:13.5px; color:var(--text); margin-bottom:9px; }
.banner-progress-wrap { display:flex; align-items:center; gap:10px; }
.banner-progress-bar { width:200px; height:6px; background:rgba(245,158,11,.15); border-radius:99px; overflow:hidden; }
.banner-progress-fill { height:100%; background:linear-gradient(90deg,#D97706,#F59E0B); border-radius:99px; }
.banner-pct { font-size:12px; font-weight:700; color:var(--gold); }
.banner-cta { display:inline-flex; align-items:center; gap:5px; padding:10px 18px; border-radius:11px; background:var(--gold); color:#fff; text-decoration:none; font-weight:700; font-size:13px; white-space:nowrap; flex-shrink:0; transition:all .2s; box-shadow:0 4px 14px rgba(217,119,6,.35); }
.banner-cta:hover { background:#B45309; transform:translateY(-1px); }

/* ── Stats Grid ── */
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:22px; }
.stat-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px 22px 20px; position:relative; overflow:hidden; cursor:default; transition:box-shadow .28s, transform .28s; box-shadow:0 2px 12px rgba(13,17,23,0.04); }
.stat-noise { position:absolute; inset:0; pointer-events:none; opacity:.025; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
.stat-glow { position:absolute; top:-40px; right:-40px; width:130px; height:130px; border-radius:50%; background:var(--card-color,#B8860B); opacity:.1; filter:blur(28px); pointer-events:none; }
.stat-card:hover { box-shadow:0 16px 48px rgba(13,17,23,0.1), 0 0 0 1px rgba(217,119,6,.12) !important; }
.stat-card:hover .stat-glow { opacity:.2; }
.stat-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; }
.stat-icon-wrap { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
.stat-trend { display:flex; align-items:center; gap:3px; font-size:11px; font-weight:700; padding:4px 9px; border-radius:99px; }
.trend-up { color:#10B981; background:rgba(16,185,129,.1); }
.trend-down { color:#EF4444; background:rgba(239,68,68,.1); }
.stat-value { font-family:var(--serif); font-weight:800; font-size:38px; color:var(--text); line-height:1; letter-spacing:-2px; margin-bottom:6px; }
.stat-label { font-size:12px; color:var(--muted); font-weight:600; }
.stat-sub { font-size:11px; color:var(--muted); margin-top:4px; opacity:.7; }
.stat-bar { position:absolute; bottom:0; left:0; right:0; height:3px; opacity:.5; border-radius:0 0 18px 18px; }
.stat-skeleton { height:154px; border-radius:var(--radius); background:linear-gradient(90deg,#f0f0f0 25%,#f7f7f7 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes shimmerBg { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }

/* ── Charts Row ── */
.charts-row { display:grid; grid-template-columns:1fr 270px; gap:16px; margin-bottom:22px; }
@media(max-width:920px) { .charts-row { grid-template-columns:1fr; } }
.chart-card, .credits-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px 24px 20px; box-shadow:0 2px 12px rgba(13,17,23,0.04); }
.credits-card { display:flex; flex-direction:column; align-items:center; text-align:center; }
.credits-card-top { width:100%; margin-bottom:8px; }
.chart-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:8px; }
.chart-title { font-family:var(--serif); font-weight:800; font-size:17px; color:var(--text); letter-spacing:-.02em; }
.chart-sub { font-size:12px; color:var(--muted); margin-top:3px; }
.chart-controls { display:flex; gap:4px; background:#F3F4F6; border-radius:9px; padding:3px; }
.chart-toggle { padding:5px 12px; border-radius:7px; border:none; font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; background:transparent; color:var(--muted); transition:all .15s; }
.toggle-active { background:#fff !important; color:var(--text) !important; box-shadow:0 1px 4px rgba(0,0,0,.1) !important; }
.chart-legend { display:flex; gap:18px; margin-bottom:16px; }
.legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); font-weight:500; }
.legend-dot { width:10px; height:10px; border-radius:3px; }
.chart-empty { height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
.chart-empty p { font-size:13px; color:var(--muted); text-align:center; max-width:220px; line-height:1.6; }
.chart-tooltip { background:#fff; border:1px solid var(--border); border-radius:12px; padding:11px 15px; box-shadow:0 8px 24px rgba(0,0,0,.09); font-family:var(--font); }
.tooltip-label { font-size:11px; color:var(--muted); margin-bottom:7px; font-weight:600; }
.tooltip-row { display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:3px; }
.tooltip-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
.tooltip-name { color:var(--muted); flex:1; }
.tooltip-value { font-weight:700; color:var(--text); }

/* ── Credits card ── */
.credit-ring-wrap { position:relative; margin:8px 0 14px; }
.credit-ring-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; text-align:center; }
.credit-ring-val { font-family:var(--serif); font-weight:800; font-size:32px; color:var(--gold); line-height:1; }
.credit-ring-sub { font-size:11px; color:var(--muted); margin-top:3px; }
.credit-stats { width:100%; margin-bottom:12px; }
.credit-stat-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid rgba(0,0,0,.04); font-size:12px; }
.credit-stat-row:last-child { border-bottom:none; }
.cs-label { color:var(--muted); }
.cs-val { font-weight:700; }
.credit-expiry { display:flex; align-items:center; gap:5px; font-size:11px; color:#9CA3AF; margin-bottom:14px; }
.credits-buy-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:12px 16px; background:var(--text); border-radius:12px; color:#fff; text-decoration:none; font-weight:700; font-size:13px; transition:all .2s; margin-top:auto; box-shadow:0 4px 16px rgba(13,17,23,.15); }
.credits-buy-btn:hover { background:#1c2a3a; transform:translateY(-1px); }
.credits-empty { display:flex; flex-direction:column; align-items:center; gap:12px; flex:1; justify-content:center; }
.credits-empty p { font-size:13px; color:var(--muted); }

/* ── Leads Table ── */
.leads-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 12px rgba(13,17,23,0.04); }
.leads-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--border); }
.view-all-btn { display:inline-flex; align-items:center; gap:4px; font-size:13px; color:var(--gold); text-decoration:none; font-weight:700; transition:color .15s; }
.view-all-btn:hover { color:#B45309; }
.leads-table-wrap { overflow-x:auto; }
.leads-table { width:100%; border-collapse:collapse; }
.leads-th { padding:10px 20px; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#9CA3AF; background:#FAFAFA; border-bottom:1px solid var(--border); text-align:left; }
.lead-row { border-bottom:1px solid rgba(0,0,0,.04); transition:background .15s; }
.lead-row:hover { background:rgba(245,158,11,.025); }
.lead-row:last-child { border-bottom:none; }
.lead-td { padding:14px 20px; vertical-align:middle; }
.lead-td-first { display:flex; align-items:center; gap:11px; }
.lead-td-action { text-align:right; }
.lead-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(245,158,11,.3)); border:1px solid rgba(245,158,11,.2); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; color:var(--gold); flex-shrink:0; font-family:var(--serif); }
.lead-name { font-weight:700; font-size:13px; color:var(--text); }
.lead-meta { font-size:11px; color:var(--muted); margin-top:2px; }
.lead-phone { display:flex; align-items:center; gap:5px; font-size:12px; color:#4B5563; }
.lead-city { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--muted); }
.status-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:700; }
.status-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.unlocked-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:99px; background:rgba(16,185,129,.1); color:#10B981; font-size:11px; font-weight:700; }
.buy-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; background:var(--text); border:none; color:#fff; cursor:pointer; font-family:var(--font); font-size:12px; font-weight:700; transition:all .2s; }
.buy-btn:disabled { opacity:.5; cursor:not-allowed; }
.buy-btn:not(:disabled):hover { background:#1c2a3a; }
.leads-skeleton { padding:18px 24px; }
.lead-skel-row { height:56px; border-radius:10px; background:linear-gradient(90deg,#f5f5f5 25%,#fafafa 50%,#f5f5f5 75%); background-size:200% 100%; margin-bottom:10px; animation:shimmer 1.5s infinite; }
.leads-empty { padding:56px 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; }
.leads-empty-icon { width:64px; height:64px; border-radius:18px; background:#F3F4F6; display:flex; align-items:center; justify-content:center; }
.leads-empty-title { font-weight:800; font-size:15px; color:var(--text); font-family:var(--serif); }
.leads-empty-sub { font-size:13px; color:var(--muted); max-width:300px; line-height:1.6; }
.leads-empty-cta { display:inline-flex; align-items:center; gap:5px; padding:10px 20px; border-radius:11px; background:var(--gold); color:#fff; text-decoration:none; font-weight:700; font-size:13px; margin-top:4px; }

/* ── Mobile overlay ── */
.mobile-overlay { position:fixed; inset:0; z-index:50; display:flex; }
.mobile-sidebar-wrap { width:var(--sidebar-w); height:100%; flex-shrink:0; }
.overlay-backdrop { flex:1; background:rgba(0,0,0,.45); }

/* ── Loading ── */
.dash-loading { min-height:100vh; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; font-family:var(--font); }
.loading-spinner { width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,#D97706,#F59E0B); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 24px rgba(217,119,6,.4); }
.loading-text { font-size:14px; color:var(--muted); font-weight:500; }

/* ── Utils ── */
.spin { animation:spin-kf 1s linear infinite; }
@keyframes spin-kf { to { transform:rotate(360deg); } }
`
