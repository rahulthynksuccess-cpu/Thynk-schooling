'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users, School, DollarSign, Eye } from 'lucide-react'

const card: React.CSSProperties = { background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', padding: '20px' }

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values?.length) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80, h = 32
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()?.split(',')[0]} cy={pts.split(' ').pop()?.split(',')[1]} r="3" fill={color} />
    </svg>
  )
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin/analytics',{cache:'no-store'}).then(r=>r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const METRIC_CARDS = [
    { icon: Users,      label: 'Total Users',    value: data?.totalUsers    || 0, trend: data?.usersTrend    || 0, color: '#60A5FA', spark: data?.usersDaily    },
    { icon: School,     label: 'Total Schools',  value: data?.totalSchools  || 0, trend: data?.schoolsTrend  || 0, color: '#FF5C00', spark: data?.schoolsMonthly},
    { icon: TrendingUp, label: 'Total Leads',    value: data?.totalLeads    || 0, trend: data?.leadsTrend    || 0, color: '#4ADE80', spark: data?.leadsDaily    },
    { icon: DollarSign, label: 'Total Revenue',  value: data?.totalRevenue  || 0, trend: data?.revenueTrend  || 0, color: '#FBBF24', spark: data?.revenueMonthly, rupee: true },
    { icon: Eye,        label: 'Page Views',     value: data?.totalViews    || 0, trend: data?.viewsTrend    || 0, color: '#A78BFA', spark: data?.viewsDaily    },
    { icon: Users,      label: 'Applications',  value: data?.totalApps     || 0, trend: data?.appsTrend     || 0, color: '#F472B6', spark: data?.appsDaily     },
  ]

  const TOP_CITIES   = data?.topCities   || []
  const TOP_SCHOOLS  = data?.topSchools  || []
  const TOP_SEARCHES = data?.topSearches || []

  return (
    <AdminLayout title="Analytics" subtitle="Platform performance, growth trends and key metrics">

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {METRIC_CARDS.map((m, i) => {
          const Icon = m.icon
          const up   = m.trend >= 0
          return (
            <motion.div key={m.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
              style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '18px', height: '18px', color: m.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '26px', color: 'var(--admin-text,rgba(255,255,255,0.9))', lineHeight: 1 }}>
                  {m.rupee ? `₹${(m.value/100).toLocaleString('en-IN')}` : m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '3px', fontFamily: 'DM Sans,sans-serif' }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                  {up ? <TrendingUp style={{ width: '11px', height: '11px', color: '#4ADE80' }} /> : <TrendingDown style={{ width: '11px', height: '11px', color: '#F87171' }} />}
                  <span style={{ fontSize: '11px', color: up ? '#4ADE80' : '#F87171', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                    {up ? '+' : ''}{m.trend}% this month
                  </span>
                </div>
              </div>
              {m.spark && <div style={{ flexShrink: 0, opacity: .6 }}><Sparkline values={m.spark} color={m.color} /></div>}
            </motion.div>
          )
        })}
      </div>

      {/* Bottom 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>

        {/* Top cities */}
        <div style={card}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '16px' }}>Top Cities</h3>
          {isLoading
            ? Array.from({length:5}).map((_,i) => <div key={i} className="skeleton" style={{ height:28, marginBottom:6, background:'rgba(255,255,255,.04)', borderRadius:6 }} />)
            : TOP_CITIES.length === 0
              ? <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)', fontFamily: 'DM Sans,sans-serif' }}>No data yet.</p>
              : TOP_CITIES.map((c: any, i: number) => (
                  <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,.15)', minWidth: '20px' }}>0{i+1}</span>
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontFamily: 'DM Sans,sans-serif' }}>{c.city}</span>
                    <span style={{ fontSize: '12px', color: '#60A5FA', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>{c.count}</span>
                  </div>
                ))
          }
        </div>

        {/* Top schools */}
        <div style={card}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '16px' }}>Top Schools by Leads</h3>
          {isLoading
            ? Array.from({length:5}).map((_,i) => <div key={i} style={{ height:28, marginBottom:6, background:'rgba(255,255,255,.04)', borderRadius:6 }} />)
            : TOP_SCHOOLS.length === 0
              ? <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)', fontFamily: 'DM Sans,sans-serif' }}>No data yet.</p>
              : TOP_SCHOOLS.map((s: any, i: number) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,.15)', minWidth: '20px' }}>0{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif' }}>{s.city}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#4ADE80', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>{s.leadCount}</span>
                  </div>
                ))
          }
        </div>

        {/* Top searches */}
        <div style={card}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--admin-text,rgba(255,255,255,0.9))', marginBottom: '16px' }}>Top Search Keywords</h3>
          {isLoading
            ? Array.from({length:5}).map((_,i) => <div key={i} style={{ height:28, marginBottom:6, background:'rgba(255,255,255,.04)', borderRadius:6 }} />)
            : TOP_SEARCHES.length === 0
              ? <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)', fontFamily: 'DM Sans,sans-serif' }}>No data yet.</p>
              : TOP_SEARCHES.map((s: any, i: number) => (
                  <div key={s.term} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,.15)', minWidth: '20px' }}>0{i+1}</span>
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#E2E8F0', fontFamily: 'DM Sans,sans-serif' }}>{s.term}</span>
                    <span style={{ fontSize: '12px', color: '#FBBF24', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>{s.count}</span>
                  </div>
                ))
          }
        </div>
      </div>
    </AdminLayout>
  )
}
