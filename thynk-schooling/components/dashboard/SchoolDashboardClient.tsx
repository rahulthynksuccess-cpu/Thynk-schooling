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
  ArrowUpRight, CheckCircle2, Clock, Loader2,
  MapPin, Sparkles, Phone, Flame, ArrowUp,
  ArrowDown, LayoutGrid, TrendingUp, Bell
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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
  { icon: LayoutGrid,      label: 'Subscription Plan', href: '/dashboard/school/packages',     badge: null },
  { icon: BarChart3,       label: 'Analytics',         href: '/dashboard/school/analytics',    badge: null },
  { icon: Settings,        label: 'School Profile',    href: '/school/complete-profile',       badge: null },
]

// Animated counter
function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!value) { setN(0); return }
    const dur = 1000, start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{n.toLocaleString('en-IN')}</>
}

function Sidebar({ active, onClose, credits }: { active: string; onClose?: () => void; credits?: LeadCredits }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const avail = Number(credits?.availableCredits) || Number((credits as any)?.credits) || 0
  return (
    <aside className="sd-sidebar">
      <div className="sd-sb-top">
        <Link href="/" className="sd-brand">
          <div className="sd-brand-icon"><GraduationCap size={17} color="#fff" /></div>
          <div>
            <div className="sd-brand-name">Thynk<span>Schooling</span></div>
            <div className="sd-brand-tag">School Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} className="sd-close-btn"><X size={14} /></button>}
      </div>

      <div className="sd-user">
        <div className="sd-avatar">{(user?.fullName || 'S')[0].toUpperCase()}</div>
        <div>
          <div className="sd-uname">{user?.fullName || 'School Admin'}</div>
          <div className="sd-urole"><span className="sd-dot" />Administrator</div>
        </div>
      </div>

      <div className="sd-credit-pill">
        <Zap size={12} color="#F59E0B" />
        <span className="sd-cp-label">Lead Credits</span>
        <span className="sd-cp-val">{avail}</span>
      </div>

      <nav className="sd-nav">
        {NAV.map(({ icon: Icon, label, href, badge }) => {
          const active_ = active === href
          return (
            <Link key={href} href={href} className={`sd-nav-item${active_ ? ' sd-nav-active' : ''}`}>
              <div className="sd-nav-icon"><Icon size={14} /></div>
              <span>{label}</span>
              {badge === 'new' && <span className="sd-new-badge">New</span>}
            </Link>
          )
        })}
      </nav>

      <button onClick={() => { logout(); router.replace('/login') }} className="sd-logout">
        <LogOut size={13} /><span>Sign Out</span>
      </button>
    </aside>
  )
}

// Multicolour stat cards
const STAT_THEMES = [
  { gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', shadow: 'rgba(102,126,234,0.45)', light: 'rgba(255,255,255,0.18)' },
  { gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)', shadow: 'rgba(245,87,108,0.45)', light: 'rgba(255,255,255,0.18)' },
  { gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', shadow: 'rgba(79,172,254,0.45)', light: 'rgba(255,255,255,0.18)' },
  { gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)', shadow: 'rgba(67,233,123,0.45)', light: 'rgba(255,255,255,0.18)' },
]

function StatCard({ icon: Icon, label, value, sub, trend, trendVal, href, themeIdx, delay = 0, loading }: any) {
  const t = STAT_THEMES[themeIdx % STAT_THEMES.length]
  const card = (
    <motion.div className="sd-stat"
      style={{ background: t.gradient, boxShadow: `0 12px 40px ${t.shadow}` } as any}
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: `0 20px 56px ${t.shadow}` }}
    >
      {/* shine overlay */}
      <div className="sd-stat-shine" />
      <div className="sd-stat-row1">
        <div className="sd-stat-icon" style={{ background: t.light }}><Icon size={17} color="#fff" /></div>
        {trend && (
          <div className={`sd-stat-trend ${trend === 'up' ? 'sd-trend-up' : 'sd-trend-dn'}`}>
            {trend === 'up' ? <ArrowUp size={9} /> : <ArrowDown size={9} />} {trendVal}
          </div>
        )}
      </div>
      {loading
        ? <div className="sd-stat-skel" />
        : <div className="sd-stat-val">{typeof value === 'number' ? <Counter value={value} /> : value}</div>
      }
      <div className="sd-stat-label">{label}</div>
      {sub && <div className="sd-stat-sub">{sub}</div>}
    </motion.div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link> : card
}

const TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="sd-tooltip">
      <div className="sd-tt-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="sd-tt-row">
          <span className="sd-tt-dot" style={{ background: p.color }} />
          <span className="sd-tt-name">{p.name}</span>
          <span className="sd-tt-val">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function LeadRow({ lead, onBuy, buying, index }: { lead: Lead; onBuy: (id: string) => void; buying: boolean; index: number }) {
  const STATUS: Record<string, [string, string]> = {
    new:            ['#6366F1', 'rgba(99,102,241,0.1)'],
    contacted:      ['#3B82F6', 'rgba(59,130,246,0.1)'],
    interested:     ['#F59E0B', 'rgba(245,158,11,0.1)'],
    not_interested: ['#94A3B8', 'rgba(148,163,184,0.1)'],
    admitted:       ['#10B981', 'rgba(16,185,129,0.1)'],
    lost:           ['#EF4444', 'rgba(239,68,68,0.1)'],
  }
  const [color, bg] = STATUS[lead.status] || STATUS.new
  return (
    <motion.tr className="sd-lead-row"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}>
      <td className="sd-td sd-td-first">
        <div className="sd-lead-av">{(lead.isPurchased ? lead.fullName : lead.maskedName || '?')[0]}</div>
        <div>
          <div className="sd-lead-name">{lead.isPurchased ? lead.fullName : lead.maskedName}</div>
          <div className="sd-lead-meta">{lead.childName}{lead.classApplyingFor ? ` · Class ${lead.classApplyingFor}` : ''}</div>
        </div>
      </td>
      <td className="sd-td">
        <span className="sd-lead-phone" style={{ opacity: lead.isPurchased ? 1 : 0.4 }}>
          <Phone size={10} color="#94A3B8" /> {lead.isPurchased ? lead.fullPhone : lead.maskedPhone}
        </span>
      </td>
      <td className="sd-td">
        <span className="sd-lead-city"><MapPin size={10} color="#F59E0B" /> {lead.city || '—'}</span>
      </td>
      <td className="sd-td">
        <span className="sd-chip" style={{ color, background: bg }}>
          <span className="sd-chip-dot" style={{ background: color }} />
          {(lead.status || 'new').replace(/_/g, ' ')}
        </span>
      </td>
      <td className="sd-td sd-td-r">
        {lead.isPurchased
          ? <span className="sd-unlocked"><CheckCircle2 size={11} /> Unlocked</span>
          : <motion.button onClick={() => onBuy(lead.id)} disabled={buying} className="sd-buy-btn"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              {buying ? <Loader2 size={11} className="sd-spin" /> : <ShoppingCart size={11} />} Unlock
            </motion.button>
        }
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
  const qc = useQueryClient()

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

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
  })

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['school-dashboard-stats'],
    queryFn: () => fetch('/api/schools?action=dashboard-stats', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
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

  const analyticsData: AnalyticsPoint[] = (() => {
    if (!analyticsRaw) return []
    const map: Record<string, AnalyticsPoint> = {}
    ;(analyticsRaw.leads || []).forEach(({ day, count }: any) => { map[day] = { date: day, leads: Number(count), applications: 0 } })
    ;(analyticsRaw.applications || []).forEach(({ day, count }: any) => {
      if (map[day]) map[day].applications = Number(count)
      else map[day] = { date: day, leads: 0, applications: Number(count) }
    })
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }))
  })()

  const [buyingId, setBuyingId] = useState<string | null>(null)
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

  if (!mounted || !accessToken || !user || user.role !== 'school_admin') {
    return (
      <div className="sd-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="sd-loading-icon"><GraduationCap size={22} color="#fff" /></motion.div>
        <span className="sd-loading-text">Loading dashboard…</span>
      </div>
    )
  }

  const leads = leadsData?.data || []
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.fullName?.split(' ')[0] || 'Admin'
  const profilePct = stats?.profileCompleteness ?? 0
  const avail = Number((credits as any)?.availableCredits ?? (credits as any)?.credits ?? 0)
  const used  = Number((credits as any)?.usedCredits ?? 0)

  return (
    <>
      <style>{CSS}</style>
      <div className="sd-root">

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div className="sd-mob-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="sd-mob-sb"><Sidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} credits={credits} /></div>
              <div className="sd-mob-backdrop" onClick={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sd-sidebar-wrap"><Sidebar active="/dashboard/school" credits={credits} /></div>

        <main className="sd-main">
          {/* Mobile topbar */}
          <div className="sd-topbar">
            <button className="sd-ham" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
            <span className="sd-topbar-brand">ThynkSchooling</span>
            <Bell size={16} color="rgba(255,255,255,0.5)" />
          </div>

          <div className="sd-content">

            {/* ── Header ── */}
            <motion.div className="sd-header" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div>
                <h1 className="sd-h1">{greeting}, <span className="sd-h1-name">{firstName}</span> 👋</h1>
                <p className="sd-h1-sub">Here's what's happening with your school today</p>
              </div>
              <div className="sd-header-right">
                <div className="sd-date-chip"><Clock size={12} />{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
            </motion.div>

            {/* ── Profile banner ── */}
            {profilePct < 100 && (
              <motion.div className="sd-banner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="sd-banner-shine" />
                <div className="sd-banner-left">
                  <div className="sd-banner-icon"><Sparkles size={17} color="#F59E0B" /></div>
                  <div>
                    <div className="sd-banner-title">Complete your school profile to attract more parents</div>
                    <div className="sd-banner-bar-row">
                      <div className="sd-banner-track">
                        <motion.div className="sd-banner-fill" initial={{ width: 0 }} animate={{ width: `${profilePct}%` }} transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }} />
                      </div>
                      <span className="sd-banner-pct">{profilePct}% complete</span>
                    </div>
                  </div>
                </div>
                <Link href="/school/complete-profile" className="sd-banner-cta">Complete Profile <ArrowUpRight size={12} /></Link>
              </motion.div>
            )}

            {/* ── 4 Stat Cards ── */}
            <div className="sd-stats">
              <StatCard icon={Users}    label="Total Leads"      value={stats?.totalLeads ?? 0}          sub="All time"      trend="up"   trendVal="+12%" themeIdx={0} delay={0.05} href="/dashboard/school/leads"       loading={statsLoading} />
              <StatCard icon={Flame}    label="New This Month"   value={stats?.newLeadsThisMonth ?? 0}   sub="Last 30 days"  trend="up"   trendVal="+8%"  themeIdx={1} delay={0.10}                                       loading={statsLoading} />
              <StatCard icon={FileText} label="Applications"     value={stats?.totalApplications ?? 0}   sub="Received"      trend="down" trendVal="-3%"  themeIdx={2} delay={0.15} href="/dashboard/school/applications" loading={statsLoading} />
              <StatCard icon={Star}     label="Avg Rating"       value={stats?.avgRating ? `${Number(stats.avgRating).toFixed(1)}★` : '—'} sub="From reviews" themeIdx={3} delay={0.20} href="/dashboard/school/reviews"  loading={statsLoading} />
            </div>

            {/* ── Middle row: Chart + Credits ── */}
            <div className="sd-mid">
              {/* Chart card */}
              <div className="sd-chart-card">
                <div className="sd-card-head">
                  <div>
                    <div className="sd-card-title">Performance Overview</div>
                    <div className="sd-card-sub">Leads & applications over 30 days</div>
                  </div>
                  <div className="sd-chart-tabs">
                    {(['area','bar'] as const).map(t => (
                      <button key={t} className={`sd-tab${activeChart===t?' sd-tab-on':''}`} onClick={() => setActiveChart(t)}>{t==='area'?'Area':'Bar'}</button>
                    ))}
                  </div>
                </div>
                <div className="sd-chart-legend">
                  <span className="sd-leg"><span className="sd-leg-dot" style={{ background:'#818CF8' }} />Leads</span>
                  <span className="sd-leg"><span className="sd-leg-dot" style={{ background:'#34D399' }} />Applications</span>
                </div>
                {analyticsData.length === 0
                  ? <div className="sd-chart-empty"><TrendingUp size={36} color="#E2E8F0" /><p>No data yet — once parents start enquiring, your chart will appear here.</p></div>
                  : <ResponsiveContainer width="100%" height={210}>
                      {activeChart === 'area'
                        ? <AreaChart data={analyticsData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                            <defs>
                              <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} /><stop offset="95%" stopColor="#818CF8" stopOpacity={0} /></linearGradient>
                              <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34D399" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                            <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<TOOLTIP />} />
                            <Area type="monotone" dataKey="leads" name="Leads" stroke="#818CF8" strokeWidth={2.5} fill="url(#gl)" dot={false} />
                            <Area type="monotone" dataKey="applications" name="Applications" stroke="#34D399" strokeWidth={2.5} fill="url(#ga)" dot={false} />
                          </AreaChart>
                        : <BarChart data={analyticsData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                            <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<TOOLTIP />} />
                            <Bar dataKey="leads" name="Leads" fill="#818CF8" radius={[4,4,0,0]} />
                            <Bar dataKey="applications" name="Applications" fill="#34D399" radius={[4,4,0,0]} />
                          </BarChart>
                      }
                    </ResponsiveContainer>
                }
              </div>

              {/* Credits card */}
              <div className="sd-credits-card">
                <div className="sd-card-title" style={{ marginBottom:4 }}>Lead Credits</div>
                <div className="sd-card-sub" style={{ marginBottom:20 }}>Your current balance</div>

                {/* Big donut visual */}
                <div className="sd-donut-wrap">
                  <svg viewBox="0 0 120 120" className="sd-donut-svg">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                    <circle cx="60" cy="60" r="48" fill="none" stroke="url(#dg)" strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(avail / Math.max(avail + used, 1)) * 301.6} 301.6`}
                      transform="rotate(-90 60 60)" />
                    <defs>
                      <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="sd-donut-center">
                    <div className="sd-donut-val"><Counter value={avail} /></div>
                    <div className="sd-donut-label">credits left</div>
                  </div>
                </div>

                <div className="sd-credit-rows">
                  {[['Available', avail, '#F59E0B'],['Used', used, '#94A3B8'],['Total', avail + used, '#0D1117']].map(([l,v,c]) => (
                    <div key={l as string} className="sd-cr-row">
                      <span className="sd-cr-label">{l}</span>
                      <span className="sd-cr-val" style={{ color: c as string }}>{v as number}</span>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard/school/packages" className="sd-buy-credits">
                  <Zap size={14} /> Buy More Credits
                </Link>
              </div>
            </div>

            {/* ── Leads table ── */}
            <motion.div className="sd-leads-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="sd-leads-head">
                <div>
                  <div className="sd-card-title">Recent Leads</div>
                  <div className="sd-card-sub">Latest parent enquiries for your school</div>
                </div>
                <Link href="/dashboard/school/leads" className="sd-view-all">View all <ArrowUpRight size={12} /></Link>
              </div>

              {leadsLoading ? (
                <div className="sd-skel-wrap">{[1,2,3,4].map(i => <div key={i} className="sd-skel-row" />)}</div>
              ) : leads.length === 0 ? (
                <div className="sd-empty">
                  <div className="sd-empty-icon"><Users size={28} color="#CBD5E1" /></div>
                  <div className="sd-empty-title">No leads yet</div>
                  <div className="sd-empty-sub">Once parents start discovering your school, their enquiries will appear here.</div>
                  <Link href="/school/complete-profile" className="sd-empty-cta">Complete your profile <ArrowUpRight size={12} /></Link>
                </div>
              ) : (
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>{['Parent','Phone','City','Status','Action'].map((h,i) => (
                        <th key={h} className="sd-th" style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <LeadRow key={lead.id} lead={lead} index={i}
                          onBuy={(id) => buyMutation.mutate(id)}
                          buying={buyingId === lead.id && buyMutation.isPending} />
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

/* ═══════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg:#F0EDE8;
  --card:#FFFFFF;
  --sb:#0A0A0F;
  --sbw:252px;
  --gold:#B8860B;
  --amber:#F59E0B;
  --border:rgba(13,17,23,0.07);
  --text:#0D1117;
  --muted:#64748B;
  --faint:#94A3B8;
  --display:'Clash Display','Bricolage Grotesque',sans-serif;
  --body:'Bricolage Grotesque',system-ui,sans-serif;
  --r:18px;
}

/* ROOT */
.sd-root{display:flex;min-height:100vh;background:var(--bg);font-family:var(--body)}
.sd-sidebar-wrap{width:var(--sbw);flex-shrink:0;position:sticky;top:0;height:100vh}
@media(max-width:880px){.sd-sidebar-wrap{display:none}}
.sd-main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.sd-content{flex:1;padding:32px 36px 52px;max-width:1180px;margin:0 auto;width:100%}
@media(max-width:680px){.sd-content{padding:20px 16px 40px}}

/* SIDEBAR */
.sd-sidebar{
  width:var(--sbw);height:100vh;background:var(--sb);
  display:flex;flex-direction:column;position:relative;overflow:hidden
}
.sd-sidebar::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(184,134,11,0.14),transparent)
}
.sd-sb-top{position:relative;z-index:1;padding:22px 20px 18px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between}
.sd-brand{display:flex;align-items:center;gap:11px;text-decoration:none}
.sd-brand-icon{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#B8860B,#F59E0B);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(184,134,11,0.5);flex-shrink:0}
.sd-brand-name{font-family:var(--display);font-size:17px;font-weight:700;color:#FAF7F2;letter-spacing:-0.02em}
.sd-brand-name span{color:var(--amber)}
.sd-brand-tag{font-size:9.5px;color:rgba(255,255,255,0.22);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px}
.sd-close-btn{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;padding:4px;display:flex;z-index:2}

.sd-user{position:relative;z-index:1;display:flex;align-items:center;gap:11px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05)}
.sd-avatar{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,rgba(184,134,11,0.35),rgba(245,158,11,0.6));display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;font-size:17px;color:#fff;flex-shrink:0;border:1.5px solid rgba(245,158,11,0.35)}
.sd-uname{font-size:13px;font-weight:700;color:#FAF7F2}
.sd-urole{display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px}
.sd-dot{width:5px;height:5px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981;flex-shrink:0}

.sd-credit-pill{position:relative;z-index:1;display:flex;align-items:center;gap:7px;margin:12px 16px;padding:10px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.22);border-radius:12px}
.sd-cp-label{font-size:12px;font-weight:600;color:rgba(255,255,255,0.55);flex:1}
.sd-cp-val{font-family:var(--display);font-size:13px;font-weight:700;color:var(--amber);background:rgba(245,158,11,0.15);padding:2px 10px;border-radius:99px}

.sd-nav{flex:1;overflow-y:auto;padding:10px 12px;position:relative;z-index:1;scrollbar-width:none}
.sd-nav::-webkit-scrollbar{display:none}
.sd-nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;text-decoration:none;color:rgba(255,255,255,0.36);font-size:13px;font-weight:600;margin-bottom:2px;transition:all .18s;position:relative}
.sd-nav-item:hover{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7)}
.sd-nav-active{background:rgba(184,134,11,0.16)!important;color:#fff!important}
.sd-nav-active::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:var(--amber);border-radius:0 3px 3px 0}
.sd-nav-icon{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sd-nav-active .sd-nav-icon{background:rgba(184,134,11,0.22)}
.sd-new-badge{font-size:10px;font-weight:700;background:linear-gradient(135deg,#F97316,#EF4444);color:#fff;padding:2px 7px;border-radius:99px}

.sd-logout{display:flex;align-items:center;gap:8px;width:calc(100% - 24px);margin:10px 12px 16px;padding:10px 14px;border-radius:10px;border:none;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);cursor:pointer;font-family:var(--body);font-size:13px;font-weight:600;transition:all .18s;position:relative;z-index:1}
.sd-logout:hover{background:rgba(239,68,68,0.1);color:#EF4444}

/* MOBILE TOPBAR */
.sd-topbar{display:none;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--sb);border-bottom:1px solid rgba(255,255,255,0.07)}
@media(max-width:880px){.sd-topbar{display:flex}}
.sd-ham{background:none;border:none;color:rgba(255,255,255,0.65);cursor:pointer;display:flex;padding:4px}
.sd-topbar-brand{font-family:var(--display);font-size:16px;font-weight:700;color:#FAF7F2}

/* PAGE HEADER */
.sd-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px}
.sd-h1{font-family:var(--display);font-size:28px;font-weight:700;color:var(--text);letter-spacing:-0.03em;line-height:1.15}
.sd-h1-name{color:var(--gold)}
.sd-h1-sub{font-size:13px;color:var(--muted);margin-top:5px;font-weight:500}
.sd-header-right{flex-shrink:0}
.sd-date-chip{display:flex;align-items:center;gap:6px;padding:8px 14px;background:white;border:1px solid var(--border);border-radius:99px;font-size:12px;color:var(--muted);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.04);white-space:nowrap}

/* PROFILE BANNER */
.sd-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;background:linear-gradient(135deg,#FFFBEF,#FFF3D0);border:1px solid rgba(184,134,11,0.22);border-radius:var(--r);margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(184,134,11,0.08)}
.sd-banner-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.5) 50%,transparent 65%);background-size:200%;animation:sdShine 3s ease-in-out infinite;pointer-events:none}
@keyframes sdShine{0%,100%{background-position:200%}50%{background-position:-200%}}
.sd-banner-left{display:flex;align-items:center;gap:14px}
.sd-banner-icon{width:40px;height:40px;border-radius:11px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sd-banner-title{font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:8px}
.sd-banner-bar-row{display:flex;align-items:center;gap:10px}
.sd-banner-track{width:180px;height:6px;background:rgba(184,134,11,0.15);border-radius:99px;overflow:hidden}
.sd-banner-fill{height:100%;background:linear-gradient(90deg,#B8860B,#F59E0B);border-radius:99px}
.sd-banner-pct{font-size:12px;font-weight:700;color:var(--gold)}
.sd-banner-cta{display:inline-flex;align-items:center;gap:5px;padding:10px 18px;border-radius:11px;background:var(--gold);color:#fff;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap;flex-shrink:0;box-shadow:0 4px 16px rgba(184,134,11,0.4);transition:all .2s}
.sd-banner-cta:hover{background:#9A7009;transform:translateY(-1px)}

/* ════ STAT CARDS — multicolour ════ */
.sd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:22px}
.sd-stat{border-radius:var(--r);padding:24px 22px 20px;position:relative;overflow:hidden;cursor:default;transition:transform .28s,box-shadow .28s}
.sd-stat-shine{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 60%);pointer-events:none}
.sd-stat-row1{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}
.sd-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.sd-stat-trend{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;padding:4px 9px;border-radius:99px;background:rgba(255,255,255,0.22);color:#fff}
.sd-trend-up{}
.sd-trend-dn{}
.sd-stat-val{font-family:var(--display);font-size:40px;font-weight:700;color:#fff;line-height:1;letter-spacing:-2px;margin-bottom:7px}
.sd-stat-label{font-size:13px;font-weight:700;color:rgba(255,255,255,0.9)}
.sd-stat-sub{font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px}
.sd-stat-skel{height:40px;width:60%;border-radius:8px;background:rgba(255,255,255,0.25);animation:sdPulse 1.4s ease-in-out infinite}
@keyframes sdPulse{0%,100%{opacity:1}50%{opacity:0.5}}

/* MIDDLE ROW */
.sd-mid{display:grid;grid-template-columns:1fr 280px;gap:18px;margin-bottom:22px}
@media(max-width:960px){.sd-mid{grid-template-columns:1fr}}

.sd-chart-card,.sd-credits-card,.sd-leads-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:24px;box-shadow:0 2px 16px rgba(13,17,23,0.05)}
.sd-credits-card{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 20px}

.sd-card-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px}
.sd-card-title{font-family:var(--display);font-size:17px;font-weight:700;color:var(--text);letter-spacing:-0.02em}
.sd-card-sub{font-size:12px;color:var(--muted);margin-top:3px}
.sd-chart-tabs{display:flex;gap:4px;background:#F1F5F9;border-radius:9px;padding:3px}
.sd-tab{padding:5px 13px;border-radius:7px;border:none;font-family:var(--body);font-size:12px;font-weight:600;cursor:pointer;background:transparent;color:var(--muted);transition:all .15s}
.sd-tab-on{background:#fff!important;color:var(--text)!important;box-shadow:0 1px 4px rgba(0,0,0,.1)!important}
.sd-chart-legend{display:flex;gap:18px;margin-bottom:16px}
.sd-leg{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);font-weight:500}
.sd-leg-dot{width:10px;height:10px;border-radius:3px}
.sd-chart-empty{height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.sd-chart-empty p{font-size:13px;color:var(--faint);text-align:center;max-width:220px;line-height:1.6}

.sd-tooltip{background:#fff;border:1px solid var(--border);border-radius:12px;padding:11px 15px;box-shadow:0 8px 28px rgba(0,0,0,.09);font-family:var(--body)}
.sd-tt-label{font-size:11px;color:var(--muted);margin-bottom:7px;font-weight:600}
.sd-tt-row{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:3px}
.sd-tt-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.sd-tt-name{color:var(--muted);flex:1}
.sd-tt-val{font-weight:700;color:var(--text)}

/* CREDITS CARD */
.sd-donut-wrap{position:relative;width:140px;height:140px;margin:0 auto 20px}
.sd-donut-svg{width:140px;height:140px}
.sd-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.sd-donut-val{font-family:var(--display);font-size:30px;font-weight:700;color:var(--amber);line-height:1}
.sd-donut-label{font-size:11px;color:var(--muted);margin-top:3px}
.sd-credit-rows{width:100%;margin-bottom:16px}
.sd-cr-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.04);font-size:13px}
.sd-cr-row:last-child{border-bottom:none}
.sd-cr-label{color:var(--muted);font-weight:500}
.sd-cr-val{font-weight:700}
.sd-buy-credits{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:12px;background:linear-gradient(135deg,#0D1117,#1C2333);border-radius:12px;color:#fff;text-decoration:none;font-weight:700;font-size:13px;transition:all .2s;box-shadow:0 4px 16px rgba(13,17,23,0.18);margin-top:auto}
.sd-buy-credits:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(13,17,23,0.25)}

/* LEADS TABLE */
.sd-leads-card{padding:0;overflow:hidden}
.sd-leads-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)}
.sd-view-all{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--gold);text-decoration:none;font-weight:700;transition:color .15s}
.sd-view-all:hover{color:#9A7009}
.sd-table-wrap{overflow-x:auto}
.sd-table{width:100%;border-collapse:collapse}
.sd-th{padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#94A3B8;background:#FAFAFA;border-bottom:1px solid var(--border)}
.sd-lead-row{border-bottom:1px solid rgba(0,0,0,0.04);transition:background .15s}
.sd-lead-row:hover{background:rgba(245,158,11,0.025)}
.sd-lead-row:last-child{border-bottom:none}
.sd-td{padding:14px 20px;vertical-align:middle;font-size:13px}
.sd-td-first{display:flex;align-items:center;gap:11px}
.sd-td-r{text-align:right}
.sd-lead-av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.3));border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#6366F1;flex-shrink:0;font-family:var(--display)}
.sd-lead-name{font-weight:700;font-size:13px;color:var(--text)}
.sd-lead-meta{font-size:11px;color:var(--muted);margin-top:2px}
.sd-lead-phone{display:flex;align-items:center;gap:5px;font-size:12px;color:#4B5563}
.sd-lead-city{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted)}
.sd-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:99px;font-size:11px;font-weight:700;text-transform:capitalize}
.sd-chip-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.sd-unlocked{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;background:rgba(16,185,129,0.1);color:#10B981;font-size:11px;font-weight:700}
.sd-buy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;color:#fff;cursor:pointer;font-family:var(--body);font-size:12px;font-weight:700;transition:all .2s;box-shadow:0 3px 12px rgba(99,102,241,0.35)}
.sd-buy-btn:disabled{opacity:0.5;cursor:not-allowed}
.sd-buy-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,0.45)}
.sd-skel-wrap{padding:18px 24px;display:flex;flex-direction:column;gap:10px}
.sd-skel-row{height:52px;border-radius:10px;background:linear-gradient(90deg,#f5f5f5 25%,#fafafa 50%,#f5f5f5 75%);background-size:200% 100%;animation:sdShimmer 1.5s infinite}
@keyframes sdShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.sd-empty{padding:56px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}
.sd-empty-icon{width:64px;height:64px;border-radius:18px;background:#F8FAFC;border:1px solid var(--border);display:flex;align-items:center;justify-content:center}
.sd-empty-title{font-family:var(--display);font-weight:700;font-size:16px;color:var(--text)}
.sd-empty-sub{font-size:13px;color:var(--muted);max-width:300px;line-height:1.6}
.sd-empty-cta{display:inline-flex;align-items:center;gap:5px;padding:10px 20px;border-radius:11px;background:var(--gold);color:#fff;text-decoration:none;font-weight:700;font-size:13px}

/* MOBILE OVERLAY */
.sd-mob-overlay{position:fixed;inset:0;z-index:50;display:flex}
.sd-mob-sb{width:var(--sbw);height:100%;flex-shrink:0}
.sd-mob-backdrop{flex:1;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px)}

/* LOADING */
.sd-loading{min-height:100vh;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:var(--body)}
.sd-loading-icon{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#B8860B,#F59E0B);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(184,134,11,0.45)}
.sd-loading-text{font-size:14px;color:var(--muted);font-weight:500}

.sd-spin{animation:sdSpin 1s linear infinite}
@keyframes sdSpin{to{transform:rotate(360deg)}}
`
