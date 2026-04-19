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

// ─── Theme-aware design tokens ────────────────────────────────────────────────
// All colors that affect readability come from CSS variables set by the theme
// controller. Fallbacks match the default light theme.
function getCSSVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

// Static palette for charts (accent colors — not theme-controlled)
const PALETTE = {
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
}

const BOARD_COLORS  = [PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, '#9CA3AF']
const FUNNEL_COLORS = [PALETTE.blue, PALETTE.violet, PALETTE.teal, PALETTE.green]
const CITY_COLORS   = [PALETTE.blue, '#1D4ED8', PALETTE.teal, '#0F766E', PALETTE.violet, '#6D28D9']

// Theme CSS variable names — set by your theme controller
const CSS = {
  // Card / page backgrounds
  cardBg:       '--admin-card-bg',       // default #FFFFFF
  pageBg:       '--admin-bg',            // default #F7F8FC
  border:       '--admin-border',        // default rgba(0,0,0,0.07)
  // Text colors
  textPrimary:  '--admin-text',          // default #111827
  textMuted:    '--admin-text-muted',    // default #6B7280
  textFaint:    '--admin-text-faint',    // default #9CA3AF
  // Font
  fontFamily:   '--admin-font',          // default system-ui
}

// Hook that reads CSS vars on mount (and re-reads on theme changes via storage event)
function useThemeColors() {
  const [colors, setColors] = useState({
    cardBg:      '#FFFFFF',
    pageBg:      '#F7F8FC',
    border:      'rgba(0,0,0,0.07)',
    textPrimary: '#111827',
    textMuted:   '#6B7280',
    textFaint:   '#9CA3AF',
    fontFamily:  "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif",
  })

  useEffect(() => {
    function read() {
      setColors({
        cardBg:      getCSSVar(CSS.cardBg,      '#FFFFFF'),
        pageBg:      getCSSVar(CSS.pageBg,       '#F7F8FC'),
        border:      getCSSVar(CSS.border,       'rgba(0,0,0,0.07)'),
        textPrimary: getCSSVar(CSS.textPrimary,  '#111827'),
        textMuted:   getCSSVar(CSS.textMuted,    '#6B7280'),
        textFaint:   getCSSVar(CSS.textFaint,    '#9CA3AF'),
        fontFamily:  getCSSVar(CSS.fontFamily,   "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif"),
      })
    }
    read()
    // Re-read when theme controller saves a new theme
    window.addEventListener('storage', read)
    // Also listen for a custom event in case theme controller dispatches one
    window.addEventListener('themechange', read)
    return () => {
      window.removeEventListener('storage', read)
      window.removeEventListener('themechange', read)
    }
  }, [])

  return colors
}

// ─── Range ────────────────────────────────────────────────────────────────────
const RANGES       = ['7d', '14d', '30d'] as const
const RANGE_LABELS: Record<string, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days' }
const RANGE_DAYS:  Record<string, number>  = { '7d': 7, '14d': 14, '30d': 30 }
type Range = typeof RANGES[number]

// ─── Export helpers ───────────────────────────────────────────────────────────
async function exportXLSX(data: any) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    (data.dailyLeads30 || []).map((r: any) => ({ Date: r.day, Leads: r.leads, Revenue: r.revenue }))
  ), 'Daily Leads')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    (data.signups || []).map((r: any) => ({ Date: r.day, 'New Parents': r.count }))
  ), 'Signups')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    (data.topCities || []).map((r: any) => ({ City: r.city, Leads: r.leads, Schools: r.schools }))
  ), 'Cities')
  XLSX.writeFile(wb, `analytics-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

async function exportPDF(data: any, range: string) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Analytics Report', 14, 16)
  doc.setFontSize(9); doc.setTextColor(120)
  doc.text(`Period: ${RANGE_LABELS[range]}  |  Exported ${new Date().toLocaleDateString('en-IN')}`, 14, 22)
  autoTable(doc, {
    startY: 28,
    head: [['Date', 'Leads', 'Revenue (₹)']],
    body: (data.dailyLeads30 || []).map((r: any) => [r.day, r.leads, Number(r.revenue).toLocaleString('en-IN')]),
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
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '9px 13px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      {label && <div style={{ color: '#9CA3AF', marginBottom: 5, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: '#6B7280' }}>{p.name}:</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>
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

function StatCard({ icon: Icon, label, value, color, colorBg, delta, T }: any) {
  const isUp   = delta?.startsWith('↑')
  const isDown = delta?.startsWith('↓')
  return (
    <div style={{ background: T.cardBg, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {delta && (
          <span style={{ fontSize: 11, fontWeight: 500, color: isUp ? PALETTE.green : isDown ? PALETTE.rose : T.textFaint, background: isUp ? PALETTE.greenBg : isDown ? PALETTE.roseBg : 'transparent', padding: '2px 6px', borderRadius: 4 }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textFaint, marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
    </div>
  )
}

function TabRow({ tabs, active, onChange, T }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void; T: any }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: `color-mix(in srgb, ${T.textPrimary} 5%, transparent)`, borderRadius: 7, padding: 3 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{ padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: T.fontFamily, fontSize: 12, fontWeight: active === t.key ? 600 : 400, background: active === t.key ? T.cardBg : 'transparent', color: active === t.key ? T.textPrimary : T.textMuted, transition: 'all .12s', boxShadow: active === t.key ? `0 0 0 0.5px ${T.border}` : 'none' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function CardHeader({ title, sub, T }: { title: string; sub?: string; T: any }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function HBar({ label, pct, color, value, T }: { label: string; pct: number; color: string; value: number; T: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: 12, color: T.textMuted, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: `color-mix(in srgb, ${T.textPrimary} 6%, transparent)`, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(2, pct)}%`, background: color, borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 11, color: T.textFaint, minWidth: 36, textAlign: 'right' }}>{value.toLocaleString()} <span>({pct}%)</span></div>
    </div>
  )
}

function FunnelBar({ name, value, max, color, prevValue, T }: { name: string; value: number; max: number; color: string; prevValue?: number; T: any }) {
  const pct  = Math.max(3, Math.round((value / Math.max(max, 1)) * 100))
  const drop = prevValue && prevValue > 0 ? Math.round((1 - value / prevValue) * 100) : null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>
          {value.toLocaleString()}
          {drop !== null && <span style={{ fontSize: 10, color: T.textFaint, marginLeft: 5 }}>↓{drop}%</span>}
        </span>
      </div>
      <div style={{ height: 7, background: `color-mix(in srgb, ${T.textPrimary} 6%, transparent)`, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

function WeeklyHeatmap({ data, T }: { data: number[][]; T: any }) {
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
    ctx.font      = `10px ${T.fontFamily}`
    ctx.fillStyle = T.textFaint
    DAYS.forEach((d, i) => ctx.fillText(d, offX + i * cellW + cellW / 2 - 10, 12))
    WEEKS.forEach((w, j) => ctx.fillText(w, 2, offY + j * cellH + cellH / 2 + 4))

    data.forEach((row, j) => {
      row.forEach((v, i) => {
        const alpha = 0.07 + 0.78 * (v / maxV)
        ctx.fillStyle = `rgba(37,99,235,${alpha})`
        ctx.beginPath()
        ctx.roundRect(offX + i * cellW + 2, offY + j * cellH + 2, cellW - 4, cellH - 4, 4)
        ctx.fill()
        if (v > 0) {
          ctx.fillStyle = alpha > 0.5 ? '#fff' : T.textMuted
          ctx.fillText(String(v), offX + i * cellW + cellW / 2 - 5, offY + j * cellH + cellH / 2 + 4)
        }
      })
    })
  }, [data, T])

  return <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
}

function ExportMenu({ data, range, T }: { data: any; range: string; T: any }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<'xlsx' | 'pdf' | null>(null)

  const handle = async (type: 'xlsx' | 'pdf') => {
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
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: T.cardBg, border: `0.5px solid ${T.border}`, fontSize: 12, fontWeight: 500, color: T.textMuted, cursor: 'pointer', fontFamily: T.fontFamily }}>
        <Download size={11} /> Export
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: T.cardBg, border: `0.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <button onClick={() => handle('xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: T.textPrimary, cursor: 'pointer', fontFamily: T.fontFamily, textAlign: 'left' }}>
            <FileSpreadsheet size={13} color="#059669" /> Excel (.xlsx)
          </button>
          <div style={{ height: '0.5px', background: T.border }} />
          <button onClick={() => handle('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: T.textPrimary, cursor: 'pointer', fontFamily: T.fontFamily, textAlign: 'left' }}>
            <FileText size={13} color="#DC2626" /> PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const T = useThemeColors()  // All theme-controlled colors live here

  const [activityTab, setActivityTab] = useState<'leads' | 'revenue' | 'signups' | 'schools' | 'parents'>('leads')
  const [range,       setRange]       = useState<Range>('30d')
  const [parentMode,  setParentMode]  = useState<'budget' | 'class' | 'city'>('budget')
  const [schoolMode,  setSchoolMode]  = useState<'type' | 'city'>('type')

  const { data, isLoading } = useQuery({
    queryKey:  ['admin-analytics'],
    queryFn:   () => fetch('/api/admin/analytics').then(r => r.json()),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev: any) => prev,
  })

  // Derived
  const days    = RANGE_DAYS[range]
  const daily   = (data?.dailyLeads30 || []).slice(-days)
  const signups = (data?.signups      || []).slice(-days)
  const schools = (data?.schools      || []).slice(-days)

  const totalLeads   = daily.reduce((s: number, d: any) => s + (d.leads   || 0), 0)
  const totalRev     = daily.reduce((s: number, d: any) => s + (d.revenue || 0), 0)
  const totalSignups = signups.reduce((s: number, d: any) => s + Number(d.count || 0), 0)
  const totalSchools = schools.reduce((s: number, d: any) => s + Number(d.count || 0), 0)

  const pp      = data?.priorPeriod    || {}
  const cities  = data?.topCities      || []
  const boards  = data?.boardData      || []
  const funnel  = data?.funnelData     || []
  const pstats  = data?.parentStats    || {}
  const heatmap = data?.weeklyHeatmap  || Array.from({ length: 4 }, () => Array(7).fill(0))
  const funnelMax = funnel[0]?.value || 1

  const ACTIVITY_TABS = [
    { key: 'leads',   label: 'Leads'   },
    { key: 'revenue', label: 'Revenue' },
    { key: 'signups', label: 'Parents' },
    { key: 'schools', label: 'Schools' },
    { key: 'parents', label: 'Parent activity' },
  ]

  const activityConfig: Record<string, { key: string; color: string; data: any[]; }> = {
    leads:   { key: 'leads',  color: PALETTE.amber,  data: daily   },
    revenue: { key: 'revenue',color: PALETTE.teal,   data: daily   },
    signups: { key: 'count',  color: PALETTE.blue,   data: signups },
    schools: { key: 'count',  color: PALETTE.violet, data: schools },
    parents: { key: 'count',  color: PALETTE.green,  data: signups },
  }
  const act = activityConfig[activityTab]

  function parentSegRows() {
    if (parentMode === 'budget') {
      const total = (pstats.budgetLow || 0) + (pstats.budgetMid || 0) + (pstats.budgetHigh || 0) || 1
      return [
        { name: '< ₹50K',      value: pstats.budgetLow  || 0, pct: Math.round((pstats.budgetLow  || 0) / total * 100), color: PALETTE.blue   },
        { name: '₹50K – 1.5L', value: pstats.budgetMid  || 0, pct: Math.round((pstats.budgetMid  || 0) / total * 100), color: PALETTE.amber  },
        { name: '> ₹1.5L',     value: pstats.budgetHigh || 0, pct: Math.round((pstats.budgetHigh || 0) / total * 100), color: PALETTE.violet },
      ]
    }
    if (parentMode === 'class') {
      const colors = [PALETTE.sky, PALETTE.teal, PALETTE.violet, PALETTE.amber, '#9CA3AF']
      return (pstats.classPcts || []).map((r: any, i: number) => ({ ...r, color: colors[i] || '#9CA3AF' }))
    }
    const colors = [PALETTE.blue, PALETTE.teal, PALETTE.violet, PALETTE.amber, PALETTE.green, '#9CA3AF']
    return (pstats.cityPcts || []).map((r: any, i: number) => ({ ...r, color: colors[i] || '#9CA3AF' }))
  }
  const parentRows = parentSegRows()

  const schoolStats = schoolMode === 'type' ? (data?.schoolStatsByType || []) : (data?.schoolStatsByCity || [])

  // Shared card style using theme colors
  const card: React.CSSProperties = {
    background:   T.cardBg,
    border:       `0.5px solid ${T.border}`,
    borderRadius: 10,
  }

  // Axis tick style — uses theme text color so it's always readable
  const axisTick = { fill: T.textFaint, fontSize: 11, fontFamily: T.fontFamily }

  return (
    <AdminLayout pageClass="admin-page-analytics" title="Analytics" subtitle="Real-time platform data">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        select.asel {
          background: ${T.cardBg};
          color: ${T.textPrimary};
          border: 0.5px solid ${T.border};
          border-radius: 6px;
          font-family: ${T.fontFamily};
          font-size: 12px;
          padding: 5px 10px;
          cursor: pointer;
          outline: none;
        }
        select.asel:focus { border-color: rgba(0,0,0,0.2); }
        select.asel option { background: ${T.cardBg}; color: ${T.textPrimary}; }
      `}</style>

      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select className="asel" value={range} onChange={e => setRange(e.target.value as Range)}>
            {RANGES.map(r => <option key={r} value={r}>{RANGE_LABELS[r]}</option>)}
          </select>
        </div>
        {!isLoading && data && <ExportMenu data={data} range={range} T={T} />}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
        <StatCard icon={TrendingUp} label={`Leads (${RANGE_LABELS[range]})`}      value={isLoading ? '…' : totalLeads.toLocaleString()}                 color={PALETTE.amber}  colorBg={PALETTE.amberBg}  delta={pp.leadsChange}   T={T} />
        <StatCard icon={DollarSign} label={`Revenue (${RANGE_LABELS[range]})`}    value={isLoading ? '…' : `₹${Math.round(totalRev / 1000)}K`}          color={PALETTE.teal}   colorBg={PALETTE.tealBg}   delta={pp.revenueChange} T={T} />
        <StatCard icon={Users}      label={`New parents (${RANGE_LABELS[range]})`} value={isLoading ? '…' : totalSignups.toLocaleString()}              color={PALETTE.blue}   colorBg={PALETTE.blueBg}   delta={pp.signupsChange} T={T} />
        <StatCard icon={School}     label={`New schools (${RANGE_LABELS[range]})`} value={isLoading ? '…' : totalSchools.toLocaleString()}              color={PALETTE.violet} colorBg={PALETTE.violetBg} delta={pp.schoolsChange} T={T} />
        <StatCard icon={MapPin}     label="Active cities"                          value={isLoading ? '…' : cities.length}                              color={PALETTE.sky}    colorBg={PALETTE.skyBg}    T={T} />
        <StatCard icon={FileText}   label="Total schools"                          value={isLoading ? '…' : (data?.totalSchools || 0).toLocaleString()} color={PALETTE.rose}   colorBg={PALETTE.roseBg}   T={T} />
      </div>

      {/* Daily activity chart */}
      <div style={{ ...card, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <CardHeader title="Daily activity" sub={`Trends over the last ${RANGE_LABELS[range]}`} T={T} />
          <TabRow tabs={ACTIVITY_TABS} active={activityTab} onChange={k => setActivityTab(k as any)} T={T} />
        </div>

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    val: activityTab === 'revenue' ? `₹${Math.round(totalRev / 1000)}K` : activityTab === 'leads' ? totalLeads : activityTab === 'schools' ? totalSchools : totalSignups },
            { label: 'Avg/day', val: activityTab === 'revenue' ? `₹${Math.round(totalRev / Math.max(days, 1) / 1000)}K` : Math.round((activityTab === 'leads' ? totalLeads : activityTab === 'schools' ? totalSchools : totalSignups) / Math.max(days, 1)) },
            { label: 'Peak',    val: act.data.length ? Math.max(...act.data.map((d: any) => Number(d[act.key] || 0))) : 0 },
          ].map(m => (
            <div key={m.label} style={{ background: `color-mix(in srgb, ${T.textPrimary} 4%, transparent)`, borderRadius: 7, padding: '7px 12px', display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, color: T.textFaint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>{String(m.val)}</span>
            </div>
          ))}
        </div>

        {isLoading ? <Shimmer h={220} /> : act.data.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={act.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={act.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={act.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`color-mix(in srgb, ${T.textPrimary} 5%, transparent)`} vertical={false} />
              <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false}
                tickFormatter={v => activityTab === 'revenue' ? `₹${Math.round(v / 1000)}K` : String(v)} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: `color-mix(in srgb, ${T.textPrimary} 8%, transparent)`, strokeWidth: 1 }} />
              <Area type="monotone" dataKey={act.key} stroke={act.color} strokeWidth={2} fill="url(#gradA)" dot={false}
                activeDot={{ r: 4, fill: act.color, stroke: T.cardBg, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cities + Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Top cities by leads" sub="Geographic distribution" T={T} />
          {isLoading ? <Shimmer h={200} /> : cities.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No city data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cities} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`color-mix(in srgb, ${T.textPrimary} 5%, transparent)`} horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ ...axisTick, fill: T.textMuted }} axisLine={false} tickLine={false} width={68} />
                <Tooltip content={<ChartTip />} cursor={{ fill: `color-mix(in srgb, ${T.textPrimary} 3%, transparent)` }} />
                <Bar dataKey="leads" name="leads" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {cities.map((_: any, i: number) => <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Conversion funnel" sub="Platform-wide user journey with drop-off" T={T} />
          {isLoading ? <Shimmer h={200} /> : (
            <div style={{ marginTop: 8 }}>
              {funnel.map((f: any, i: number) => (
                <FunnelBar key={f.name} name={f.name} value={f.value} max={funnelMax}
                  color={FUNNEL_COLORS[i] || '#9CA3AF'} prevValue={i > 0 ? funnel[i - 1].value : undefined} T={T} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Boards + Signup trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="Schools by board" sub="Curriculum breakdown" T={T} />
          {isLoading ? <Shimmer h={180} /> : boards.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No board data yet</div>
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
                    <span style={{ fontSize: 11, color: T.textMuted }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: T.textPrimary, fontWeight: 600 }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <CardHeader title="New user signups" sub={`Daily parent registrations — last ${RANGE_LABELS[range]}`} T={T} />
          {isLoading ? <Shimmer h={200} /> : signups.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No signups yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={signups} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`color-mix(in srgb, ${T.textPrimary} 5%, transparent)`} vertical={false} />
                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="count" name="new parents" stroke={PALETTE.blue} strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: PALETTE.blue, stroke: T.cardBg, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Parent segments + School performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <CardHeader title="Parent segments" sub="Who is searching for schools" T={T} />
            <select className="asel" value={parentMode} onChange={e => setParentMode(e.target.value as any)}>
              <option value="budget">By budget</option>
              <option value="class">By class seeking</option>
              <option value="city">By city</option>
            </select>
          </div>
          {isLoading ? <Shimmer h={140} /> : parentRows.length === 0 ? (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No data yet</div>
          ) : (
            <>
              {parentRows.map((s: any) => (
                <HBar key={s.name} label={s.name} pct={s.pct} value={s.value} color={s.color} T={T} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'Repeat buyers', val: `${pstats.repeatBuyerPct ?? 0}%`,  color: PALETTE.teal  },
                  { label: 'Avg leads',     val: pstats.avgLeads ?? 0,              color: PALETTE.blue  },
                  { label: 'Avg spend',     val: pstats.avgSpend ? `₹${Number(pstats.avgSpend).toLocaleString('en-IN')}` : '₹0', color: PALETTE.amber },
                ].map(m => (
                  <div key={m.label} style={{ background: `color-mix(in srgb, ${T.textPrimary} 4%, transparent)`, borderRadius: 8, padding: '9px 11px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{String(m.val)}</div>
                    <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <CardHeader title="School performance" sub="Leads received vs applications" T={T} />
            <select className="asel" value={schoolMode} onChange={e => setSchoolMode(e.target.value as any)}>
              <option value="type">By school type</option>
              <option value="city">By city</option>
            </select>
          </div>
          {isLoading ? <Shimmer h={200} /> : schoolStats.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: 13 }}>No school data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={schoolStats.map((s: any) => ({ name: s.type, leads: s.leads, applications: s.applications }))}
                  margin={{ top: 0, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`color-mix(in srgb, ${T.textPrimary} 5%, transparent)`} vertical={false} />
                  {/* dataKey="name" — field is called 'name' after the map above */}
                  <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: `color-mix(in srgb, ${T.textPrimary} 3%, transparent)` }} />
                  <Bar dataKey="leads"        name="leads"        fill={PALETTE.violet} radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="applications" name="applications" fill={PALETTE.green}  radius={[3, 3, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[{ label: 'Leads', c: PALETTE.violet }, { label: 'Applications', c: PALETTE.green }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: l.c }} />
                    <span style={{ fontSize: 11, color: T.textMuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly heatmap */}
      <div style={{ ...card, padding: '20px 22px' }}>
        <CardHeader title="Weekly activity heatmap" sub="Lead activity by day of week — last 4 weeks" T={T} />
        {isLoading ? <Shimmer h={120} /> : <WeeklyHeatmap data={heatmap} T={T} />}
      </div>
    </AdminLayout>
  )
}
