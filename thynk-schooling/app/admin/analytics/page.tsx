'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { TrendingUp, TrendingDown, Users, School, DollarSign, Eye, FileCheck, Phone } from 'lucide-react'

const card: React.CSSProperties = {
  background: 'var(--admin-card-bg, #0F1623)',
  border: '1px solid var(--admin-border, rgba(255,255,255,0.08))',
  borderRadius: 14, padding: '20px 22px',
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values?.length) return null
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1
  const w = 88, h = 36
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const last = pts.split(' ').pop()?.split(',')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />}
    </svg>
  )
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin/analytics', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const skel = (h = 32) => <div style={{ height: h, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />

  const METRICS = [
    { icon: Users,     label: 'Total Users',    value: data?.totalUsers   || 0, trend: data?.usersTrend   || 0, color: '#60A5FA', spark: data?.usersDaily },
    { icon: School,    label: 'Total Schools',  value: data?.totalSchools || 0, trend: data?.schoolsTrend || 0, color: '#B8860B', spark: data?.schoolsMonthly },
    { icon: TrendingUp,label: 'Total Leads',    value: data?.totalLeads   || 0, trend: data?.leadsTrend   || 0, color: '#34D399', spark: data?.leadsDaily },
    { icon: DollarSign,label: 'Revenue',        value: data?.totalRevenue || 0, trend: data?.revenueTrend || 0, color: '#F59E0B', spark: data?.revenueMonthly, rupee: true },
    { icon: Eye,       label: 'Page Views',     value: data?.totalViews   || 0, trend: data?.viewsTrend   || 0, color: '#A78BFA', spark: data?.viewsDaily },
    { icon: FileCheck, label: 'Applications',   value: data?.totalApps    || 0, trend: data?.appsTrend    || 0, color: '#FB923C', spark: data?.appsDaily },
  ]

  return (
    <AdminLayout title="Analytics" subtitle="Platform performance, growth trends and key metrics">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {METRICS.map((m, i) => {
          const Icon = m.icon
          const up = m.trend >= 0
          return (
            <div key={m.label} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${m.color},${m.color}00)` }} />
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${m.color}15`, border: `1px solid ${m.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 19, height: 19, color: m.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--admin-text,rgba(255,255,255,0.95))', lineHeight: 1 }}>
                  {m.rupee ? `₹${(m.value / 100).toLocaleString('en-IN')}` : m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted,rgba(255,255,255,0.4))', marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
                  {up ? <TrendingUp style={{ width: 11, height: 11, color: '#34D399' }} /> : <TrendingDown style={{ width: 11, height: 11, color: '#F87171' }} />}
                  <span style={{ fontSize: 11, color: up ? '#34D399' : '#F87171', fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>
                    {up ? '+' : ''}{m.trend}% this month
                  </span>
                </div>
              </div>
              {m.spark && <Sparkline values={m.spark} color={m.color} />}
            </div>
          )
        })}
      </div>

      {/* Bottom 3-col tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          { title: 'Top Cities', items: data?.topCities || [], key: 'city', val: 'count', color: '#60A5FA' },
          { title: 'Top Schools by Leads', items: data?.topSchools || [], key: 'name', sub: 'city', val: 'leadCount', color: '#34D399' },
          { title: 'Top Search Terms', items: data?.topSearches || [], key: 'term', val: 'count', color: '#F59E0B' },
        ].map(({ title, items, key, val, sub, color }) => (
          <div key={title} style={card}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--admin-text,rgba(255,255,255,0.95))', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
              {title}
            </div>
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i}>{skel()}</div>)
              : items.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--admin-text-faint,rgba(255,255,255,0.25))', fontFamily: 'DM Sans,sans-serif' }}>No data yet</p>
                : items.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.15)', minWidth: 20, textAlign: 'right' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[key]}</div>
                        {sub && <div style={{ fontSize: 10, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', fontFamily: 'DM Sans,sans-serif' }}>{item[sub]}</div>}
                      </div>
                      <span style={{ fontSize: 12, color, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, flexShrink: 0 }}>{item[val]}</span>
                    </div>
                  ))
            }
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
