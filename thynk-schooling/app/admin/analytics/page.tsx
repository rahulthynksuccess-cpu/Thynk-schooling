'use client'
// File: app/admin/analytics/page.tsx
// API route: app/api/admin/analytics/route.ts

import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState, useEffect, useRef } from 'react'
import { Users, TrendingUp, DollarSign, MapPin, School, FileText, Download, FileSpreadsheet } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import toast from 'react-hot-toast'

// ─── Design system ────────────────────────────────────────────────────────────
const S = {
  bg:       '#F7F8FC',
  card:     '#FFFFFF',
  border:   'rgba(0,0,0,0.07)',
  t1:       '#111827',
  t2:       '#6B7280',
  t3:       '#9CA3AF',
  amber:    '#E5A50A',
  amberBg:  'rgba(229,165,10,0.08)',
  blue:     '#2563EB',
  blueBg:   'rgba(37,99,235,0.07)',
  teal:     '#0D9488',
  tealBg:   'rgba(13,148,136,0.08)',
  violet:   '#7C3AED',
  violetBg: 'rgba(124,58,237,0.08)',
  green:    '#059669',
  greenBg:  'rgba(5,150,105,0.08)',
  rose:     '#DC2626',
  roseBg:   'rgba(220,38,38,0.07)',
  sky:      '#0284C7',
  skyBg:    'rgba(2,132,199,0.07)',
  ff:       "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif",
}

const BOARD_COLORS  = [S.blue, S.green, S.amber, S.violet, S.t3]
const FUNNEL_COLORS = [S.blue, S.violet, S.teal, S.green]
const CITY_COLORS   = [S.blue, '#1D4ED8', S.teal, '#0F766E', S.violet, '#6D28D9']

const card: React.CSSProperties = {
  background:   S.card,
  border:       `0.5px solid ${S.border}`,
  borderRadius: 10,
}

// ─── Range ────────────────────────────────────────────────────────────────────
const RANGES  = ['7d', '14d', '30d'] as const
const RANGE_LABELS: Record<string, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days' }
const RANGE_DAYS:  Record<string, number>  = { '7d': 7, '14d': 14, '30d': 30 }
type Range = typeof RANGES[number]

// ─── Lazy export helpers ──────────────────────────────────────────────────────
async function exportXLSX(data: any) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  const leadsRows = (data.dailyLeads30 || []).map((r: any) => ({
    Date: r.day, Leads: r.leads, Revenue: r.revenue,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadsRows), 'Daily Leads')

  const signupRows = (data.signups || []).map((r: any) => ({ Date: r.day, 'New Parents': r.count }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(signupRows), 'Signups')

  const schoolRows = (data.schools || []).map((r: any) => ({ Date: r.day, 'New Schools': r.count }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schoolRows), 'Schools')

  const cityRows = (data.topCities || []).map((r: any) => ({
    City: r.city, Leads: r.leads, Schools: r.schools,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cityRows), 'Cities')

  XLSX.writeFile(wb, `analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

async function exportPDF(data: any, range: string) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('ThynkSchooling Analytics Report', 14, 16)
  doc.setFontSize(9); doc.setTextColor(120)
  doc.text(`Period: ${RANGE_LABELS[range]}  |  Exported ${new Date().toLocaleDateString('en-IN')}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Date', 'Leads', 'Revenue (₹)', 'New Parents', 'New Schools']],
    body: (data.dailyLeads30 || []).map((r: any, i: number) => [
      r.day,
      r.leads,
      Number(r.revenue).toLocaleString('en-IN'),
      data.signups?.[i]?.count ?? '',
      data.schools?.[i]?.count ?? '',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  })

  doc.save(`analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${S.border}`, borderRadius: 8, padding: '9px 13px', fontSize: 12, fontFamily: S.ff, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      {label && <div style={{ color: S.t3, marginBottom: 5, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: S.t2 }}>{p.name}:</span>
          <span style={{ color: S.t1, fontWeight: 600 }}>
            {p.name === 'revenue' ? `₹${Number(p.value).toLocaleString('en-IN')}` : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function Shimmer({ h = 40 }: { h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 7, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  )
}

function StatCard({ icon: Icon, label, value, color, colorBg, delta }: any) {
  const isUp   = delta?.startsWith('↑')
  const isDown = delta?.startsWith('↓')
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
        {delta && (
          <span style={{ fontSize: 11, fontWeight: 500, color: isUp ? S.green : isDown ? S.rose : S.t3, background: isUp ? S.greenBg : isDown ? S.roseBg : 'transparent', padding: '2px 6px', borderRadius: 4 }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: S.t1, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: S.t3, marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
    </div>
  )
}

function TabRow({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.04)', borderRadius: 7, padding: 3 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{ padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: S.ff, fontSize: 12, fontWeight: active === t.key ? 600 : 400, background: active === t.key ? '#fff' : 'transparent', color: active === t.key ? S.t1 : S.t2, transition: 'all .12s', boxShadow: active === t.key ? `0 0 0 0.5px ${S.border}` : 'none' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.t1 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: S.t3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function HBar({ label, pct, color, value }: { label: string; pct: number; color: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: 12, color: S.t2, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(2, pct)}%`, background: color, borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 11, color: S.t3, minWidth: 36, textAlign: 'right' }}>{value.toLocaleString()} <span style={{ color: S.t3 }}>({pct}%)</span></div>
    </div>
  )
}

function FunnelBar({ name, value, max, color, prevValue }: { name: string; value: number; max: number; color: string; prevValue?: number }) {
  const pct  = Math.max(3, Math.round((value / Math.max(max, 1)) * 100))
  const drop = prevValue && prevValue > 0 ? Math.round((1 - value / prevValue) * 100) : null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: S.t1, fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>
          {value.toLocaleString()}
          {drop !== null && <span style={{ fontSize: 10, color: S.t3, marginLeft: 5 }}>↓{drop}%</span>}
        </span>
      </div>
      <div style={{ height: 7, background: 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

function WeeklyHeatmap({ data }: { data: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const WEEKS = ['Week 4', 'Week 3', 'Week 2', 'This week']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth || 600
    canvas.width  = W
    canvas.height = 120
    const cellW = (W - 72) / 7
    const cellH = 22
    const offX  = 64
    const offY  = 20
    const maxV  = Math.max(1, ...data.flat())

    ctx.clearRect(0, 0, W, 120)
    ctx.font      = `10px ${S.ff}`
    ctx.fillStyle = S.t3
    DAYS.forEach((d, i)  => ctx.fillText(d, offX + i * cellW + cellW / 2 - 10, 12))
    WEEKS.forEach((w, j) => ctx.fillText(w, 2, offY + j * cellH + cellH / 2 + 4))

    data.forEach((row, j) => {
      row.forEach((v, i) => {
        const alpha = 0.07 + 0.78 * (v / maxV)
        ctx.fillStyle = `rgba(37,99,235,${alpha})`
        ctx.beginPath()
        ctx.roundRect(offX + i * cellW + 2, offY + j * cellH + 2, cellW - 4, cellH - 4, 4)
        ctx.fill()
        if (v > 0) {
          ctx.fillStyle = alpha > 0.5 ? '#fff' : S.t2
          ctx.fillText(String(v), offX + i * cellW + cellW / 2 - 5, offY + j * cellH + cellH / 2 + 4)
        }
      })
    })
  }, [data])

  return <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
}

// ─── Export button ────────────────────────────────────────────────────────────
function ExportMenu({ data, range }: { data: any; range: string }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<'xlsx'|'pdf'|null>(null)

  const handle = async (type: 'xlsx'|'pdf') => {
    setOpen(false); setLoading(type)
    try {
      if (type === 'xlsx') await exportXLSX(data)
      else                 await exportPDF(data, range)
      toast.success(`Exported as ${type.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setLoading(null) }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} disabled={!!loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#fff', border: `0.5px solid ${S.border}`, fontSize: 12, fontWeight: 500, color: S.t2, cursor: 'pointer', fontFamily: S.ff }}>
        <Download size={11} /> Export
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: `0.5px solid ${S.border}`, borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <button onClick={() => handle('xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: S.t1, cursor: 'pointer', fontFamily: S.ff, textAlign: 'left' }}>
            <FileSpreadsheet size={13} color="#059669" /> Excel (.xlsx)
          </button>
          <div style={{ height: '0.5px', background: S.border }} />
          <button onClick={() => handle('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: S.t1, cursor: 'pointer', fontFamily: S.ff, textAlign: 'left' }}>
            <FileText size={13} color="#DC2626" /> PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [activityTab, setActivityTab] = useState<'leads'|'revenue'|'signups'|'schools'|'parents'>('leads')
  const [range,       setRange]       = useState<Range>('30d')
  const [parentMode,  setParentMode]  = useState<'budget'|'class'|'city'>('budget')
  const [schoolMode,  setSchoolMode]  = useState<'type'|'city'>('type')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn:  () => fetch('/api/admin/analytics').then(r => r.json()),
    staleTime:           3 * 60_000,
    refetchOnWindowFocus: false,
  })

  // ── Derived ───────────────────────────────────────────────────────────────
  const days    = RANGE_DAYS[range]
  const daily   = (data?.dailyLeads30 || []).slice(-days)
  const signups = (data?.signups      || []).slice(-days)
  const schools = (data?.schools      || []).slice(-days)

  const totalLeads   = daily.reduce((s: number, d: any) => s + (d.leads   || 0), 0)
  const totalRev     = daily.reduce((s: number, d: any) => s + (d.revenue || 0), 0)
  const totalSignups = signups.reduce((s: number, d: any) => s + Number(d.count || 0), 0)
  const totalSchools = schools.reduce((s: number, d: any) => s + Number(d.count || 0), 0)

  const pp = data?.priorPeriod || {}

  const cities  = data?.topCities      || []
  const boards  = data?.boardData      || []
  const funnel  = data?.funnelData     || []
  const pstats  = data?.parentStats    || {}
  const heatmap = data?.weeklyHeatmap  || Array.from({ length: 4 }, () => Array(7).fill(0))

  const funnelMax = funnel[0]?.value || 1

  // Activity tab config
  const ACTIVITY_TABS = [
    { key: 'leads',    label: 'Leads'    },
    { key: 'revenue',  label: 'Revenue'  },
    { key: 'signups',  label: 'Parents'  },
    { key: 'schools',  label: 'Schools'  },
    { key: 'parents',  label: 'Parent activity' },
  ]

  const activityConfig: Record<string, { key: string; color: string; data: any[]; fmt?: (v: number) => string }> = {
    leads:   { key: 'leads',   color: S.amber, data: daily,   fmt: (v) => v.toLocaleString() },
    revenue: { key: 'revenue', color: S.teal,  data: daily,   fmt: (v) => `₹${v.toLocaleString('en-IN')}` },
    signups: { key: 'count',   color: S.blue,  data: signups, fmt: (v) => v.toLocaleString() },
    schools: { key: 'count',   color: S.violet,data: schools, fmt: (v) => v.toLocaleString() },
    parents: { key: 'count',   color: S.green, data: signups, fmt: (v) => v.toLocaleString() },
  }
  const act = activityConfig[activityTab]

  // Parent segment data — all from real API
  function parentSegRows() {
    if (parentMode === 'budget') {
      const total = (pstats.budgetLow || 0) + (pstats.budgetMid || 0) + (pstats.budgetHigh || 0) || 1
      return [
        { name: '< ₹50K',     value: pstats.budgetLow  || 0, pct: Math.round((pstats.budgetLow  || 0) / total * 100), color: S.blue   },
        { name: '₹50K – 1.5L',value: pstats.budgetMid  || 0, pct: Math.round((pstats.budgetMid  || 0) / total * 100), color: S.amber  },
        { name: '> ₹1.5L',    value: pstats.budgetHigh || 0, pct: Math.round((pstats.budgetHigh || 0) / total * 100), color: S.violet },
      ]
    }
    if (parentMode === 'class') {
      const colors = [S.sky, S.teal, S.violet, S.amber, S.t3]
      return (pstats.classPcts || []).map((r: any, i: number) => ({ ...r, color: colors[i] || S.t3 }))
    }
    // city
    const colors = [S.blue, S.teal, S.violet, S.amber, S.green, S.t3]
    return (pstats.cityPcts || []).map((r: any, i: number) => ({ ...r, color: colors[i] || S.t3 }))
  }
  const parentRows = parentSegRows()

  const schoolStats = schoolMode === 'type' ? (data?.schoolStatsByType || []) : (data?.schoolStatsByCity || [])

  return (
    <AdminLayout pageClass="admin-page-analytics" title="Analytics" subtitle="Real-time platform data">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        select.asel { background:#fff; color:${S.t1}; border:0.5px solid ${S.border}; border-radius:6px; font-family:${S.ff}; font-size:12px; padding:5px 10px; cursor:pointer; outline:none; }
        select.asel:focus { border-color:rgba(0,0,0,0.2); }
      `}</style>

      {/* ── Top action bar ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select className="asel" value={range} onChange={e => setRange(e.target.value as Range)}>
            {RANGES.map(r => <option key={r} value={r}>{RANGE_LABELS[r]}</option>)}
          </select>
        </div>
        {!isLoading && data && <ExportMenu data={data} range={range} />}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
        <StatCard icon={TrendingUp}  label={`Leads (${RANGE_LABELS[range]})`}   value={isLoading ? '…' : totalLeads.toLocaleString()}                              color={S.amber}  colorBg={S.amberBg}  delta={pp.leadsChange} />
        <StatCard icon={DollarSign}  label={`Revenue (${RANGE_LABELS[range]})`} value={isLoading ? '…' : `₹${Math.round(totalRev/1000)}K`}                         color={S.teal}   colorBg={S.tealBg}   delta={pp.revenueChange} />
        <StatCard icon={Users}       label={`New parents (${RANGE_LABELS[range]})`} value={isLoading ? '…' : totalSignups.toLocaleString()}                         color={S.blue}   colorBg={S.blueBg}   delta={pp.signupsChange} />
        <StatCard icon={School}      label={`New schools (${RANGE_LABELS[range]})`} value={isLoading ? '…' : totalSchools.toLocaleString()}                         color={S.violet} colorBg={S.violetBg} delta={pp.schoolsChange} />
        <StatCard icon={MapPin}      label="Active cities"                       value={isLoading ? '…' : cities.length}                                            color={S.sky}    colorBg={S.skyBg} />
        <StatCard icon={FileText}    label="Total schools"                       value={isLoading ? '…' : (data?.totalSchools || 0).toLocaleString()}               color={S.rose}   colorBg={S.roseBg} />
      </div>

      {/* ── Daily activity chart ─────────────────────────────────────────── */}
      <div style={{ ...card, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <CardHeader title="Daily activity" sub={`Trends over the last ${RANGE_LABELS[range]}`} />
          <TabRow tabs={ACTIVITY_TABS} active={activityTab} onChange={k => setActivityTab(k as any)} />
        </div>

        {/* Summary chips for current tab */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', val: activityTab === 'revenue' ? `₹${Math.round(totalRev/1000)}K` : activityTab === 'leads' ? totalLeads : activityTab === 'schools' ? totalSchools : totalSignups },
            { label: 'Avg / day', val: activityTab === 'revenue' ? `₹${Math.round(totalRev / Math.max(days,1) / 1000)}K` : Math.round((activityTab === 'leads' ? totalLeads : activityTab === 'schools' ? totalSchools : totalSignups) / Math.max(days,1)) },
            { label: 'Peak', val: act.data.length ? Math.max(...act.data.map((d: any) => Number(d[act.key] || 0))) : 0 },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 7, padding: '7px 12px', display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, color: S.t3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: S.t1 }}>{String(m.val)}</span>
            </div>
          ))}
        </div>

        {isLoading ? <Shimmer h={220} /> : act.data.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontFamily: S.ff, fontSize: 13 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={act.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={act.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={act.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: S.t3, fontSize: 11, fontFamily: S.ff }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: S.t3, fontSize: 11, fontFamily: S.ff }} axisLine={false} tickLine={false}
                tickFormatter={v => activityTab === 'revenue' ? `₹${Math.round(v/1000)}K` : String(v)} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey={act.key} stroke={act.color} strokeWidth={2} fill="url(#gradA)" dot={false}
                activeDot={{ r: 4, fill: act.color, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Cities + Funnel ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Top cities by leads" sub="Geographic distribution" />
          {isLoading ? <Shimmer h={200} /> : cities.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontSize: 13 }}>No city data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cities} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: S.t3, fontSize: 11, fontFamily: S.ff }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: S.t2, fontSize: 12, fontFamily: S.ff }} axisLine={false} tickLine={false} width={68} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="leads" name="leads" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {cities.map((_: any, i: number) => <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Conversion funnel" sub="Platform-wide user journey with drop-off" />
          {isLoading ? <Shimmer h={200} /> : (
            <div style={{ marginTop: 8 }}>
              {funnel.map((f: any, i: number) => (
                <FunnelBar key={f.name} name={f.name} value={f.value} max={funnelMax}
                  color={FUNNEL_COLORS[i] || S.t2} prevValue={i > 0 ? funnel[i - 1].value : undefined} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Boards + Signup trend ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Schools by board" sub="Curriculum breakdown" />
          {isLoading ? <Shimmer h={180} /> : boards.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontSize: 13 }}>No board data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={boards} cx="50%" cy="50%" innerRadius={34} outerRadius={58} paddingAngle={3} dataKey="value">
                    {boards.map((e: any, i: number) => <Cell key={i} fill={e.color || BOARD_COLORS[i]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginTop: 8 }}>
                {boards.map((b: any) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: S.t2 }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: S.t1, fontWeight: 600 }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="New user signups" sub={`Daily parent registrations — last ${RANGE_LABELS[range]}`} />
          {isLoading ? <Shimmer h={200} /> : signups.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontSize: 13 }}>No signups yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={signups} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: S.t3, fontSize: 11, fontFamily: S.ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: S.t3, fontSize: 11, fontFamily: S.ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="count" name="new parents" stroke={S.blue} strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: S.blue, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Parent segments + School performance ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <CardHeader title="Parent segments" sub="Who is searching for schools" />
            <select className="asel" value={parentMode} onChange={e => setParentMode(e.target.value as any)}>
              <option value="budget">By budget</option>
              <option value="class">By class seeking</option>
              <option value="city">By city</option>
            </select>
          </div>
          {isLoading ? <Shimmer h={140} /> : parentRows.length === 0 ? (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontSize: 13 }}>No data yet</div>
          ) : (
            <>
              {parentRows.map((s: any) => (
                <HBar key={s.name} label={s.name} pct={s.pct} value={s.value} color={s.color} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'Repeat buyers', val: `${pstats.repeatBuyerPct ?? 0}%`, color: S.teal   },
                  { label: 'Avg leads',     val: pstats.avgLeads ?? 0,             color: S.blue   },
                  { label: 'Avg spend',     val: pstats.avgSpend ? `₹${Number(pstats.avgSpend).toLocaleString('en-IN')}` : '₹0', color: S.amber },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '9px 11px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{String(m.val)}</div>
                    <div style={{ fontSize: 10, color: S.t3, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <CardHeader title="School performance" sub="Leads received vs applications" />
            <select className="asel" value={schoolMode} onChange={e => setSchoolMode(e.target.value as any)}>
              <option value="type">By school type</option>
              <option value="city">By city</option>
            </select>
          </div>
          {isLoading ? <Shimmer h={200} /> : schoolStats.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.t3, fontSize: 13 }}>No school data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={schoolStats.map((s: any) => ({ name: s.type, leads: s.leads, applications: s.applications }))}
                  margin={{ top: 0, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: S.t3, fontSize: 10, fontFamily: S.ff }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: S.t3, fontSize: 10, fontFamily: S.ff }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="leads"        name="leads"        fill={S.violet} radius={[3,3,0,0]} maxBarSize={16} />
                  <Bar dataKey="applications" name="applications" fill={S.green}  radius={[3,3,0,0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[{ label: 'Leads', c: S.violet }, { label: 'Applications', c: S.green }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: l.c }} />
                    <span style={{ fontSize: 11, color: S.t2 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Weekly heatmap ────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '20px 22px' }}>
        <CardHeader title="Weekly activity heatmap" sub="Lead purchases by day of week — last 4 weeks" />
        {isLoading ? <Shimmer h={120} /> : <WeeklyHeatmap data={heatmap} />}
      </div>

    </AdminLayout>
  )
}
