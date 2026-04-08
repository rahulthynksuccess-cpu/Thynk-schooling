'use client'
// File: app/dashboard/school/analytics/page.tsx
// API route must be at: app/api/schools/me/analytics/route.ts

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, Eye, Users, FileText, Star,
  MessageSquare, TrendingUp, BarChart2, LayoutDashboard,
  CreditCard,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG   = '#F5F3EF'
const CARD = '#FFFFFF'
const DARK = '#0A0A0F'
const ff   = "'DM Sans', system-ui, sans-serif"
const cdff = "'Clash Display', sans-serif"

const VIOLET  = '#7C3AED'
const AMBER   = '#F59E0B'
const EMERALD = '#10B981'
const ROSE    = '#F43F5E'
const BLUE    = '#3B82F6'

const CLASS_COLORS  = [VIOLET, '#8B5CF6', '#A78BFA', '#6D28D9', '#DDD6FE', '#C4B5FD']
const STATUS_COLORS: Record<string, string> = { pending: AMBER, shortlisted: VIOLET, admitted: EMERALD, rejected: ROSE, submitted: BLUE, under_review: AMBER, accepted: EMERALD }
const SOURCE_COLORS = [VIOLET, AMBER, EMERALD, BLUE, ROSE, '#64748B']
const DOW_LABELS    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RANGE_OPTIONS = [7, 14, 30, 90] as const
type Range = typeof RANGE_OPTIONS[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: CARD, borderRadius: 16,
    border: '1px solid rgba(13,17,23,0.07)',
    boxShadow: '0 2px 12px rgba(13,17,23,0.04)',
    ...extra,
  }
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.10)', borderRadius: 10, padding: '9px 13px', fontSize: 12, fontFamily: ff, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
      {label && <div style={{ color: '#64748B', marginBottom: 5, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: '#64748B' }}>{p.name}:</span>
          <span style={{ color: '#0D1117', fontWeight: 700 }}>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function SH({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: cdff, fontWeight: 700, fontSize: 15, color: '#0D1117', letterSpacing: '-.01em' }}>{title}</h3>
        {sub && <p style={{ margin: '3px 0 0', fontFamily: ff, fontSize: 11, color: '#94A3B8' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function Skel({ h = 40 }: { h?: number }) {
  return <div style={{ height: h, background: '#F1EDE8', borderRadius: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
}

function KpiCard({ icon: Icon, label, value, color, trend, trendUp }: {
  icon: React.ElementType; label: string; value: string | number
  color: string; trend?: string; trendUp?: boolean
}) {
  return (
    <div style={cardStyle({ padding: '16px 15px', display: 'flex', flexDirection: 'column' })}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontFamily: cdff, fontSize: 28, fontWeight: 700, color: '#0D1117', letterSpacing: '-2px', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontFamily: ff, fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      {trend && (
        <div style={{ fontFamily: ff, fontSize: 10, fontWeight: 600, color: trendUp ? EMERALD : ROSE, marginTop: 4 }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B', fontFamily: ff }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  )
}

function Empty({ h = 160, msg = 'No data for this period yet' }: { h?: number; msg?: string }) {
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontFamily: ff, fontSize: 13 }}>
      {msg}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/dashboard/school',              label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/dashboard/school/leads',        label: 'Leads',        Icon: Users },
  { href: '/dashboard/school/applications', label: 'Applications', Icon: FileText },
  { href: '/dashboard/school/reviews',      label: 'Reviews',      Icon: Star },
  { href: '/dashboard/school/packages',     label: 'Subscription', Icon: CreditCard },
  { href: '/dashboard/school/analytics',    label: 'Analytics',    Icon: BarChart2 },
]

function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{ width: 248, background: DARK, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#B8860B,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: cdff, fontSize: 17, fontWeight: 700, color: '#FAF7F2' }}>
              Thynk<span style={{ color: AMBER }}>Schooling</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 2, letterSpacing: '.1em', textTransform: 'uppercase' }}>School Portal</div>
          </div>
        </Link>
      </div>
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard/school' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 11, textDecoration: 'none', fontSize: 13, fontWeight: 600,
              marginBottom: 2, fontFamily: ff,
              color: active ? '#fff' : 'rgba(255,255,255,0.36)',
              background: active ? 'rgba(184,134,11,0.18)' : 'transparent',
            }}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { accessToken, user } = useAuthStore()
  const router    = useRouter()
  const [mounted, setMounted]     = useState(false)
  const [range, setRange]         = useState<Range>(30)
  const [dashStats, setDashStats] = useState<any>({})
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { setMounted(true) }, [])

  // FIX: Fetch from the correct dashboard-stats endpoint (not /api/schools?action=dashboard-stats)
  // The route lives at /api/schools/me/dashboard-stats
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    fetch('/api/schools/me/dashboard-stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setDashStats(d))
      .catch(() => {})
  }, [mounted, accessToken, user, router])

  const fetchAnalytics = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/schools/me/analytics?days=${d}`, { credentials: 'include' })
      const data = await res.json()
      setAnalytics(data)
    } catch { /* Empty state handles this */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!mounted || !accessToken) return
    fetchAnalytics(range)
  }, [mounted, accessToken, range, fetchAnalytics])

  if (!mounted) return null

  // ── Derived data ──────────────────────────────────────────────────────────
  const leads     = analytics?.leads            || []
  const apps      = analytics?.applications     || []
  const classWise = analytics?.classWise        || []
  const monthly   = analytics?.monthly          || []
  const dowData   = analytics?.dayOfWeek        || Array(7).fill(0)
  const sources   = analytics?.sourceBreakdown  || []
  const statuses  = analytics?.statusBreakdown  || []
  const totals    = analytics?.totals           || {}

  // Merge leads + apps onto shared day-label axis
  const timelineMap: Record<string, { day: string; leads: number; applications: number }> = {}
  leads.forEach((r: any) => {
    const label = r.day.slice(5) // "YYYY-MM-DD" → "MM-DD"
    timelineMap[label] = { day: label, leads: r.count, applications: 0 }
  })
  apps.forEach((r: any) => {
    const label = r.day.slice(5)
    if (timelineMap[label]) timelineMap[label].applications = r.count
    else timelineMap[label] = { day: label, leads: 0, applications: r.count }
  })
  const timelineData = Object.values(timelineMap).sort((a, b) => a.day.localeCompare(b.day))

  const dowChartData = DOW_LABELS.map((d, i) => ({ day: d, leads: dowData[i] || 0 }))
  const dowMax       = Math.max(1, ...dowData)

  const statusData = statuses.map((s: any) => ({
    name:  s.status.charAt(0).toUpperCase() + s.status.slice(1).replace(/_/g, ' '),
    value: s.count,
    color: STATUS_COLORS[s.status.toLowerCase()] || '#94A3B8',
  }))

  // Profile views: show '—' when zero (table may not have data yet)
  const profileViewsDisplay = loading ? '…'
    : totals.profileViews > 0
      ? totals.profileViews > 999
        ? `${(totals.profileViews / 1000).toFixed(1)}K`
        : totals.profileViews
      : dashStats.profileViews > 0
        ? dashStats.profileViews
        : '—'

  // FIX: use dashStats values from correct endpoint — these are now consistent
  // with analytics totals because both routes use the same queries
  const avgRating    = dashStats.avgRating    ?? totals.avgRating
  const totalReviews = dashStats.totalReviews ?? '—'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
      <Sidebar />

      <main style={{ flex: 1, padding: '32px 36px 56px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Header + Range selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: cdff, fontSize: 26, fontWeight: 700, color: '#0D1117', margin: 0, letterSpacing: '-.03em' }}>Analytics</h1>
          <div style={{ display: 'flex', gap: 3, background: '#E8E4DE', borderRadius: 10, padding: 3 }}>
            {RANGE_OPTIONS.map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: ff, fontSize: 11, fontWeight: 600,
                background: range === r ? '#fff' : 'transparent',
                color: range === r ? '#0D1117' : '#64748B',
                boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .13s',
              }}>
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }}>
          {/* FIX: all KPI values now from analytics totals (consistent with charts below) */}
          <KpiCard icon={TrendingUp}    label="Total Leads"   value={loading ? '…' : (totals.leads        ?? 0).toLocaleString()} color={VIOLET} />
          <KpiCard icon={FileText}      label="Applications"  value={loading ? '…' : (totals.applications ?? 0).toLocaleString()} color={AMBER}  />
          <KpiCard icon={BarChart2}     label="Conversion"    value={loading ? '…' : `${totals.conversion ?? 0}%`}                color={EMERALD} />
          <KpiCard icon={Eye}           label="Profile Views" value={loading ? '…' : profileViewsDisplay}                         color={BLUE}    />
          <KpiCard icon={Star}          label="Avg Rating"    value={avgRating ? Number(avgRating).toFixed(1) : '—'}               color={AMBER}   />
          <KpiCard icon={MessageSquare} label="Reviews"       value={totalReviews}                                                  color={ROSE}    />
        </div>

        {/* Timeline — leads + applications */}
        <div style={cardStyle({ padding: '22px 24px' })}>
          <SH title="Leads & Applications over time" sub={`Daily counts — last ${range} days`} />
          <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <LegendDot color={VIOLET} label="Leads" />
            <LegendDot color={AMBER}  label="Applications" />
          </div>
          {loading ? <Skel h={220} /> : timelineData.length === 0 ? <Empty h={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={VIOLET} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={AMBER} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="leads"        name="Leads"        stroke={VIOLET} strokeWidth={2.5} fill="url(#gL)" dot={false} activeDot={{ r: 4, fill: VIOLET, stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke={AMBER}  strokeWidth={2.5} fill="url(#gA)" dot={false} activeDot={{ r: 4, fill: AMBER,  stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Class-wise + Application status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
          <div style={cardStyle({ padding: '22px 24px' })}>
            {/* FIX: correct column name is class_applying_for (not class_grade) — fixed in API */}
            <SH title="Leads by class group" sub="Inquiries per grade band" />
            {loading ? <Skel h={220} /> : classWise.length === 0 ? (
              <Empty h={220} msg="No class data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classWise} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="leads" radius={[5, 5, 0, 0]} maxBarSize={36}>
                    {classWise.map((_: any, i: number) => (
                      <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={cardStyle({ padding: '22px 24px' })}>
            <SH title="Application status" sub="Current pipeline breakdown" />
            {loading ? <Skel h={220} /> : statusData.length === 0 ? <Empty h={220} /> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={3} dataKey="value">
                      {statusData.map((s: any, i: number) => <Cell key={i} fill={s.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 14px', marginTop: 10 }}>
                  {statusData.map((s: any) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 12, color: '#64748B', fontFamily: ff }}>{s.name}</span>
                      <span style={{ fontSize: 12, color: '#0D1117', fontWeight: 700, fontFamily: ff }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Day-of-week + Source */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={cardStyle({ padding: '22px 24px' })}>
            <SH title="Leads by day of week" sub="Which days get the most enquiries" />
            {loading ? <Skel h={180} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dowChartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="leads" name="leads" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {dowChartData.map((d, i) => (
                      <Cell key={i} fill={`rgba(124,58,237,${0.22 + 0.72 * (d.leads / dowMax)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={cardStyle({ padding: '22px 24px' })}>
            <SH title="Leads by source" sub="How parents find your school" />
            {loading ? <Skel h={180} /> : sources.length === 0 ? (
              <Empty h={180} msg="No source data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 10, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fill: '#475569', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="leads" radius={[0, 4, 4, 0]} maxBarSize={14}>
                    {sources.map((_: any, i: number) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly bar — last 6 months */}
        <div style={cardStyle({ padding: '22px 24px' })}>
          <SH
            title="Monthly lead volume — last 6 months"
            sub="Grouped by calendar month"
            action={
              <div style={{ display: 'flex', gap: 14 }}>
                <LegendDot color={VIOLET} label="Leads" />
                <LegendDot color={AMBER}  label="Applications" />
              </div>
            }
          />
          {loading ? <Skel h={160} /> : monthly.length === 0 ? <Empty h={160} /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthly} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="leads"        name="Leads"        fill={VIOLET} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="applications" name="Applications" fill={AMBER}  radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </main>
    </div>
  )
}
