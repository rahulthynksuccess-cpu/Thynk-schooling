'use client'
export const dynamic = 'force-dynamic'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Search, Download, TrendingUp, CreditCard, Tag,
  RefreshCw, Calendar, BarChart2, Activity, Award,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

/* ── style constants ──────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'var(--admin-payments-card-bg,#111820)',
  border: '1px solid var(--admin-payments-card-border,rgba(255,255,255,0.07))',
  borderRadius: 12, padding: 16,
}
const cell: React.CSSProperties = {
  padding: '11px 14px', fontSize: 12,
  fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0',
  borderBottom: '1px solid rgba(255,255,255,.05)',
}
const hdCell: React.CSSProperties = {
  padding: '9px 14px', fontSize: 11, fontWeight: 700,
  letterSpacing: '.08em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'DM Sans,sans-serif',
  borderBottom: '1px solid rgba(255,255,255,.06)',
  background: 'rgba(255,255,255,.03)',
  whiteSpace: 'nowrap',
}
const inp: React.CSSProperties = {
  background: 'none', border: 'none', outline: 'none',
  fontSize: 12, fontFamily: 'DM Sans,sans-serif',
  color: 'rgba(255,255,255,0.85)', flex: 1,
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: 'rgba(74,222,128,.12)',  color: '#4ADE80' },
  pending:   { bg: 'rgba(251,191,36,.12)',  color: '#FBBF24' },
  failed:    { bg: 'rgba(239,68,68,.12)',   color: '#F87171' },
  refunded:  { bg: 'rgba(96,165,250,.12)',  color: '#60A5FA' },
  demo:      { bg: 'rgba(168,85,247,.12)',  color: '#A855F7' },
}

const GW_COLOR: Record<string, string> = {
  razorpay: '#3395FF', cashfree: '#00C853',
  easebuzz: '#FF6600', paypal: '#003087', demo: '#A855F7',
}
const GW_LOGO: Record<string, string> = {
  razorpay: '💙', cashfree: '💚', easebuzz: '🟠', paypal: '🌐', demo: '🧪',
}

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

/* ── simple bar ─────────────────────────────────────────────────────────── */
function MiniBar({ value, max, color = '#FF5C00', height = 32 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ width: '100%', height, background: 'rgba(255,255,255,.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s', minWidth: pct > 0 ? 4 : 0 }} />
      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: 'rgba(255,255,255,.4)', fontFamily: 'DM Sans,sans-serif' }}>{pct}%</span>
    </div>
  )
}

/* ── sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ data, color = '#FF5C00', width = 200, height = 40 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - (v / max) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── trend chart ──────────────────────────────────────────────────────── */
function TrendChart({ data, labelKey, valueKey, color = '#FF5C00', label = 'Revenue' }: {
  data: any[]; labelKey: string; valueKey: string; color?: string; label?: string
}) {
  if (!data.length) return <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 12, fontFamily: 'DM Sans,sans-serif' }}>No data</div>
  const max = Math.max(...data.map((d: any) => Number(d[valueKey]) || 0), 1)

  return (
    <div style={{ padding: '0 4px' }}>
      {/* bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {data.map((d: any, i) => {
          const v   = Number(d[valueKey]) || 0
          const pct = (v / max) * 80
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              title={`${d[labelKey]}: ${label === 'Revenue' ? fmt(v) : v}`}>
              <div style={{ width: '100%', height: Math.max(pct, 2), background: color, borderRadius: '2px 2px 0 0', opacity: 0.85, transition: 'height .3s', minHeight: 2 }} />
            </div>
          )
        })}
      </div>
      {/* x-axis labels — show every nth */}
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {data.map((d: any, i) => {
          const show = data.length <= 12 || i % Math.ceil(data.length / 12) === 0
          return (
            <div key={i} style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,.25)', textAlign: 'center', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {show ? d[labelKey] : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ANALYTICS PANEL
══════════════════════════════════════════════════════════════════════════ */
function AnalyticsPanel({ range, setRange }: { range: string; setRange: (r: string) => void }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['payments-analytics', range],
    queryFn: () => fetch(`/api/admin/payments?action=analytics&range=${range}`, { cache: 'no-store' }).then(r => r.json()),
    staleTime: 3 * 60 * 1000,
  })

  const [subTab, setSubTab] = useState<'pg' | 'daily' | 'weekly' | 'monthly' | 'coupons' | 'schools'>('pg')

  const subTabs = [
    { k: 'pg',      icon: '💳', l: 'By Gateway'   },
    { k: 'daily',   icon: '📅', l: 'Daily'        },
    { k: 'weekly',  icon: '📆', l: 'Weekly'       },
    { k: 'monthly', icon: '🗓️', l: 'Monthly'      },
    { k: 'coupons', icon: '🏷️', l: 'Coupons'      },
    { k: 'schools', icon: '🏫', l: 'Top Schools'  },
  ] as const

  const RANGES = [
    { k: '7d', l: '7D' }, { k: '30d', l: '30D' },
    { k: '90d', l: '90D' }, { k: '1y', l: '1Y' },
  ]

  if (isLoading) return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>
      <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Loading analytics…
    </div>
  )

  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 style={{ width: 15, height: 15, color: '#FF5C00' }} />
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>Payment Analytics</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.k} onClick={() => setRange(r.k)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, background: range === r.k ? '#FF5C00' : 'rgba(255,255,255,.05)', color: range === r.k ? '#fff' : 'rgba(255,255,255,.4)' }}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* sub-tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap' }}>
        {subTabs.map(t => (
          <button key={t.k} onClick={() => setSubTab(t.k)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, background: subTab === t.k ? 'rgba(255,92,0,.2)' : 'rgba(255,255,255,.04)', color: subTab === t.k ? '#FF7A2E' : 'rgba(255,255,255,.4)' }}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* ── BY GATEWAY ── */}
        {subTab === 'pg' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 16 }}>
              {(data?.pgWise || []).map((gw: any) => (
                <div key={gw.gateway} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 14, border: `1px solid ${GW_COLOR[gw.gateway] || '#888'}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{GW_LOGO[gw.gateway] || '💳'}</span>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: GW_COLOR[gw.gateway] || '#fff', textTransform: 'capitalize' }}>{gw.gateway}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(74,222,128,.1)', color: '#4ADE80', fontFamily: 'DM Sans,sans-serif' }}>{gw.successRate}%</span>
                  </div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 2 }}>{fmt(gw.completedAmount)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: 'DM Sans,sans-serif', marginBottom: 8 }}>{gw.completedCount} completed · {gw.txnCount} total</div>
                  <MiniBar value={gw.completedCount} max={gw.txnCount} color={GW_COLOR[gw.gateway] || '#FF5C00'} height={24} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {[{l:'Pending',v:gw.pendingCount,c:'#FBBF24'},{l:'Failed',v:gw.failedCount,c:'#F87171'}].map(x => (
                      <div key={x.l} style={{ fontSize: 10, fontFamily: 'DM Sans,sans-serif', color: x.c }}>
                        {x.v} <span style={{ color: 'rgba(255,255,255,.25)' }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!(data?.pgWise?.length) && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 32, color: 'rgba(255,255,255,.2)', fontSize: 12, fontFamily: 'DM Sans,sans-serif' }}>No gateway data yet</div>
              )}
            </div>
          </div>
        )}

        {/* ── DAILY ── */}
        {subTab === 'daily' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {['Revenue', 'Transactions'].map(m => (
                <div key={m} style={{ ...card, flex: 1, padding: 12 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{m}</div>
                  <Sparkline
                    data={(data?.dailyTrend || []).map((d: any) => m === 'Revenue' ? d.revenue : d.count)}
                    color={m === 'Revenue' ? '#FF5C00' : '#60A5FA'}
                    width={200} height={36}
                  />
                </div>
              ))}
            </div>
            <TrendChart data={data?.dailyTrend || []} labelKey="day" valueKey="revenue" label="Revenue" color="#FF5C00" />
            <div style={{ marginTop: 12 }}>
              <TrendChart data={data?.dailyTrend || []} labelKey="day" valueKey="count" label="Transactions" color="#60A5FA" />
            </div>
          </div>
        )}

        {/* ── WEEKLY ── */}
        {subTab === 'weekly' && (
          <div>
            <TrendChart data={data?.weeklyTrend || []} labelKey="week" valueKey="revenue" label="Revenue" color="#A855F7" />
            <div style={{ marginTop: 12 }}>
              <TrendChart data={data?.weeklyTrend || []} labelKey="week" valueKey="count" label="Transactions" color="#60A5FA" />
            </div>
          </div>
        )}

        {/* ── MONTHLY ── */}
        {subTab === 'monthly' && (
          <div>
            <TrendChart data={data?.monthlyTrend || []} labelKey="month" valueKey="revenue" label="Revenue" color="#4ADE80" />
            <div style={{ marginTop: 12 }}>
              <TrendChart data={data?.monthlyTrend || []} labelKey="month" valueKey="count" label="Transactions" color="#FBBF24" />
            </div>
          </div>
        )}

        {/* ── COUPONS ── */}
        {subTab === 'coupons' && (
          <div>
            {!(data?.couponStats?.length)
              ? <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,.2)', fontSize: 12, fontFamily: 'DM Sans,sans-serif' }}>No coupons used in this period</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Coupon Code', 'Times Used', 'Total Discount', 'Revenue Generated'].map(h => (
                        <th key={h} style={hdCell}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.couponStats.map((c: any) => (
                      <tr key={c.code}>
                        <td style={cell}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#FBBF24', letterSpacing: 1 }}>{c.code}</span>
                        </td>
                        <td style={{ ...cell, color: '#60A5FA', fontWeight: 700 }}>{c.usageCount}×</td>
                        <td style={{ ...cell, color: '#F87171', fontWeight: 700 }}>−{fmt(c.totalDiscount)}</td>
                        <td style={{ ...cell, color: '#4ADE80', fontWeight: 700 }}>{fmt(c.revenueAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}

        {/* ── TOP SCHOOLS ── */}
        {subTab === 'schools' && (
          <div>
            {!(data?.topSchools?.length)
              ? <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,.2)', fontSize: 12, fontFamily: 'DM Sans,sans-serif' }}>No data yet</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.topSchools.map((s: any, i: number) => {
                    const maxRev = data.topSchools[0]?.revenue || 1
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 18, fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <MiniBar value={s.revenue} max={maxRev} color="#FF5C00" height={16} />
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: '#4ADE80' }}>{fmt(s.revenue)}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif' }}>{s.count} txns</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
const STATUS_TABS = ['all', 'completed', 'pending', 'failed', 'refunded', 'demo']
const GW_TABS     = ['all', 'razorpay', 'cashfree', 'easebuzz', 'paypal', 'demo']

export default function AdminPaymentsPage() {
  const [mainTab, setMainTab] = useState<'transactions' | 'analytics'>('transactions')
  const [statusTab, setStatusTab] = useState('all')
  const [gwTab,     setGwTab]     = useState('all')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [range,     setRange]     = useState('30d')

  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) params.set('search', search)
  if (statusTab !== 'all') params.set('status', statusTab)
  if (gwTab !== 'all')     params.set('gateway', gwTab)

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ['admin-payments', statusTab, gwTab, search, page],
    queryFn: () => fetch(`/api/admin/payments?${params}`, { cache: 'no-store' }).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const payments        = data?.data             || []
  const total           = data?.total            || 0
  const totalAmount     = data?.totalAmount      || 0
  const completedAmount = data?.completedAmount  || 0
  const todayAmount     = data?.todayAmount      || 0
  const totalDiscount   = data?.totalDiscount    || 0
  const totalPages      = Math.ceil(total / 20)

  const handleExport = useCallback(() => {
    const ep = new URLSearchParams(params)
    ep.set('action', 'export')
    window.open(`/api/admin/payments?${ep}`, '_blank')
  }, [params])

  const statCards = [
    { label: 'Total Transactions', value: String(total),       color: '#60A5FA', icon: Activity },
    { label: 'Total Revenue',      value: fmt(totalAmount),    color: '#FF5C00', icon: TrendingUp },
    { label: 'Completed Revenue',  value: fmt(completedAmount),color: '#4ADE80', icon: CreditCard },
    { label: "Today's Revenue",    value: fmt(todayAmount),    color: '#FBBF24', icon: Calendar },
    { label: 'Total Discount',     value: fmt(totalDiscount),  color: '#A855F7', icon: Tag },
  ]

  return (
    <AdminLayout pageClass="admin-page-payments" title="Payments" subtitle="Transactions, gateway analytics, coupon performance">
      {/* Analytics link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <a href="/admin/payments/analytics"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.22)', color: '#F5A623', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          📊 Payment Analytics Report →
        </a>
      </div>

      {/* ── stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {statCards.map((s, i) => (
          <div key={s.label} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <s.icon style={{ width: 14, height: 14, color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: s.value.startsWith('₹') ? 18 : 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── main tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { k: 'transactions', icon: '📋', l: 'Transactions' },
          { k: 'analytics',    icon: '📊', l: 'Analytics' },
        ].map(t => (
          <button key={t.k} onClick={() => setMainTab(t.k as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', background: mainTab === t.k ? '#FF5C00' : 'rgba(255,255,255,.05)', color: mainTab === t.k ? '#fff' : 'rgba(255,255,255,.4)' }}>
            {t.icon} {t.l}
          </button>
        ))}
        <button onClick={() => refetch()}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif' }}>
          <RefreshCw style={{ width: 11, height: 11 }} /> Refresh
        </button>
      </div>

      {/* ══ ANALYTICS TAB ══ */}
      {mainTab === 'analytics' && <AnalyticsPanel range={range} setRange={setRange} />}

      {/* ══ TRANSACTIONS TAB ══ */}
      {mainTab === 'transactions' && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {/* filters bar */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '7px 11px' }}>
                <Search style={{ width: 13, height: 13, color: 'rgba(255,255,255,.3)', flexShrink: 0 }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search transaction, school, coupon…" style={inp} />
              </div>
              {/* export */}
              <button onClick={handleExport}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}>
                <Download style={{ width: 12, height: 12 }} /> Export CSV
              </button>
            </div>

            {/* status filter */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif', alignSelf: 'center', marginRight: 2 }}>Status:</span>
              {STATUS_TABS.map(t => (
                <button key={t} onClick={() => { setStatusTab(t); setPage(1) }}
                  style={{ padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans,sans-serif', background: statusTab === t ? '#FF5C00' : 'rgba(255,255,255,.04)', color: statusTab === t ? '#fff' : 'rgba(255,255,255,.35)', textTransform: 'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* gateway filter */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif', alignSelf: 'center', marginRight: 2 }}>Gateway:</span>
              {GW_TABS.map(g => (
                <button key={g} onClick={() => { setGwTab(g); setPage(1) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans,sans-serif',
                    background: gwTab === g ? (GW_COLOR[g] || '#FF5C00') : 'rgba(255,255,255,.04)',
                    color: gwTab === g ? '#fff' : 'rgba(255,255,255,.35)', textTransform: 'capitalize' }}>
                  {g !== 'all' && GW_LOGO[g]}{' '}{g}
                </button>
              ))}
            </div>
          </div>

          {/* table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Transaction ID','School','Package','Amount','Discount','Coupon','Gateway','Credits','Date','Status'].map(h => (
                    <th key={h} style={hdCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={10} style={{ padding: '10px 14px' }}>
                        <div style={{ height: 32, background: 'rgba(255,255,255,.03)', borderRadius: 6 }} />
                      </td></tr>
                    ))
                  : payments.length === 0
                    ? <tr><td colSpan={10} style={{ ...cell, textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.2)' }}>No payments found</td></tr>
                    : payments.map((p: any) => {
                        const s  = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                        const gc = GW_COLOR[p.gateway] || '#888'
                        return (
                          <tr key={p.id}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                            <td style={{ ...cell, fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,.4)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={p.transactionId}>{p.transactionId || p.id?.slice(0, 12)}</td>
                            <td style={cell}><div style={{ fontWeight: 600, color: '#E2E8F0', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.schoolName}</div></td>
                            <td style={{ ...cell, color: 'rgba(255,255,255,.45)', fontSize: 11 }}>{p.packageName}</td>
                            <td style={{ ...cell, fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#4ADE80', fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(p.amount)}</td>
                            <td style={{ ...cell, fontFamily: 'Syne,sans-serif', fontWeight: 700, color: p.discount > 0 ? '#F87171' : 'rgba(255,255,255,.2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                              {p.discount > 0 ? `−${fmt(p.discount)}` : '—'}
                            </td>
                            <td style={cell}>
                              {p.couponCode
                                ? <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(251,191,36,.12)', color: '#FBBF24', letterSpacing: 1 }}>{p.couponCode}</span>
                                : <span style={{ color: 'rgba(255,255,255,.15)', fontSize: 11 }}>—</span>
                              }
                            </td>
                            <td style={cell}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: `${gc}18`, color: gc, textTransform: 'capitalize' }}>
                                {GW_LOGO[p.gateway] || '💳'} {p.gateway}
                              </span>
                            </td>
                            <td style={{ ...cell, color: '#60A5FA', fontWeight: 700, textAlign: 'center' }}>{p.creditsAdded || '—'}</td>
                            <td style={{ ...cell, fontSize: 11, color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>
                              {p.createdAt ? fmtDate(p.createdAt) : '—'}
                            </td>
                            <td style={cell}>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: s.bg, color: s.color, textTransform: 'capitalize' }}>{p.status}</span>
                            </td>
                          </tr>
                        )
                      })
                }
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif' }}>
                Page {page} of {totalPages} · {total} records
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft style={{ width: 13, height: 13 }} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: page === p ? '#FF5C00' : 'rgba(255,255,255,.05)', color: page === p ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                  <ChevronRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  )
}
