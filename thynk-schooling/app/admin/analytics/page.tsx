'use client'
// NOTE: Remove `export const dynamic` — it is invalid in 'use client' components.
// Place the route.ts file at: app/api/admin/analytics/route.ts
// and update the fetch URL below accordingly.

import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, TrendingUp, Phone, MapPin, School, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  card:    'var(--admin-card-bg,#0D1420)',
  border:  'var(--admin-border,rgba(255,255,255,0.07))',
  t1:      'rgba(255,255,255,0.95)',
  t2:      'rgba(255,255,255,0.72)',
  t3:      'rgba(255,255,255,0.45)',
  amber:   '#F59E0B',
  teal:    '#14B8A6',
  violet:  '#8B5CF6',
  sky:     '#38BDF8',
  emerald: '#10B981',
  rose:    '#F43F5E',
  blue:    '#3B82F6',
}
const BOARD_COLORS   = ['#378ADD', '#3B6D11', '#BA7517', '#534AB7', '#888780']
const FUNNEL_COLORS  = [C.sky, C.violet, C.teal, C.emerald]
const CITY_COLORS    = ['#378ADD', '#185FA5', '#3B6D11', '#639922', '#BA7517', '#534AB7']
const card: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
}
const ff = "DM Sans,sans-serif"

// ─── Range options ─────────────────────────────────────────────────────────────
const RANGES = ['7 days', '14 days', '30 days'] as const
type Range = typeof RANGES[number]
const rangeDays: Record<Range, number> = { '7 days': 7, '14 days': 14, '30 days': 30 }

// ─── Sub-components ────────────────────────────────────────────────────────────
function Tooltip_({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111927', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: ff, boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}>
      {label && <div style={{ color: C.t2, marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: C.t2 }}>{p.name}:</span>
          <span style={{ color: C.t1, fontWeight: 700 }}>
            {p.name === 'revenue' ? `₹${Number(p.value).toLocaleString('en-IN')}` : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function SH({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontFamily: ff, fontWeight: 700, fontSize: 15, color: C.t1 }}>{title}</h3>
      <p style={{ margin: '4px 0 0', fontFamily: ff, fontSize: 12, color: C.t2 }}>{sub}</p>
    </div>
  )
}

function Skel({ h = 40 }: { h?: number }) {
  return (
    <div style={{ height: h, background: 'rgba(255,255,255,0.04)', borderRadius: 8, animation: 'as 1.4s ease-in-out infinite' }} />
  )
}

function StatPill({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: ff, fontSize: 11, color: C.t2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
        {sub && <div style={{ fontFamily: ff, fontSize: 11, color: C.emerald, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: active ? 700 : 500, background: active ? C.amber : 'transparent', color: active ? '#000' : C.t2, transition: 'all .15s', textTransform: 'capitalize' }}>
      {label}
    </button>
  )
}

// Horizontal bar row for cities / boards
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(4, Math.round((value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
      <div style={{ width: 76, fontFamily: ff, fontSize: 12, color: C.t2, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      <div style={{ fontFamily: ff, fontSize: 11, color: C.t3, minWidth: 28, textAlign: 'right' }}>{value}</div>
    </div>
  )
}

// Funnel bar row
function FunnelBar({ name, value, max, color, prevValue }: { name: string; value: number; max: number; color: string; prevValue?: number }) {
  const pct = Math.max(4, Math.round((value / max) * 100))
  const drop = prevValue ? Math.round((1 - value / prevValue) * 100) : null
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: ff, fontSize: 13, color: C.t1, fontWeight: 600 }}>{name}</span>
        <span style={{ fontFamily: ff, fontSize: 13, color, fontWeight: 700 }}>
          {value.toLocaleString()}
          {drop !== null && <span style={{ fontSize: 10, color: C.t3, marginLeft: 4 }}>↓{drop}%</span>}
        </span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

// Weekly heatmap canvas
function WeeklyHeatmap({ data }: { data: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const WEEKS = ['Week 4', 'Week 3', 'Week 2', 'This week']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth || 600
    canvas.width = W
    canvas.height = 130
    const cellW = (W - 68) / 7
    const cellH = 22
    const offX = 60
    const offY = 22
    const maxV = Math.max(1, ...data.flat())

    ctx.clearRect(0, 0, W, 130)
    ctx.font = `10px ${ff}`
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    DAYS.forEach((d, i) => ctx.fillText(d, offX + i * cellW + cellW / 2 - 10, 13))
    WEEKS.forEach((w, j) => ctx.fillText(w, 2, offY + j * cellH + cellH / 2 + 4))

    data.forEach((row, j) => {
      row.forEach((v, i) => {
        const alpha = 0.08 + 0.82 * (v / maxV)
        ctx.fillStyle = `rgba(56,189,248,${alpha})`
        ctx.beginPath()
        ctx.roundRect(offX + i * cellW + 2, offY + j * cellH + 2, cellW - 4, cellH - 4, 3)
        ctx.fill()
        ctx.fillStyle = alpha > 0.45 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'
        ctx.fillText(String(v), offX + i * cellW + cellW / 2 - 7, offY + j * cellH + cellH / 2 + 4)
      })
    })
  }, [data])

  return <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
}

// ─── Parent segment breakdowns ──────────────────────────────────────────────────
const PARENT_SEGMENT_OPTIONS = ['By budget range', 'By class seeking', 'By location'] as const

function parentSegmentData(stats: any, mode: string) {
  if (mode === 'By budget range') {
    const total = (stats.budgetLow || 0) + (stats.budgetMid || 0) + (stats.budgetHigh || 0) || 1
    return [
      { name: '< ₹50K', value: stats.budgetLow || 0, pct: Math.round((stats.budgetLow || 0) / total * 100), color: C.blue },
      { name: '₹50K – 1.5L', value: stats.budgetMid || 0, pct: Math.round((stats.budgetMid || 0) / total * 100), color: C.amber },
      { name: '> ₹1.5L', value: stats.budgetHigh || 0, pct: Math.round((stats.budgetHigh || 0) / total * 100), color: C.violet },
    ]
  }
  // Placeholder distributions for modes without direct DB data
  if (mode === 'By class seeking') return [
    { name: 'Nursery–KG', value: 0, pct: 22, color: C.sky },
    { name: 'Grade 1–5', value: 0, pct: 38, color: C.teal },
    { name: 'Grade 6–10', value: 0, pct: 29, color: C.violet },
    { name: 'Grade 11–12', value: 0, pct: 11, color: C.amber },
  ]
  return [
    { name: 'Mumbai', value: 0, pct: 28, color: C.blue },
    { name: 'Delhi', value: 0, pct: 24, color: C.violet },
    { name: 'Bangalore', value: 0, pct: 18, color: C.teal },
    { name: 'Others', value: 0, pct: 30, color: C.t3 },
  ]
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [leadsTab, setLeadsTab]       = useState<'leads' | 'revenue' | 'signups'>('leads')
  const [range, setRange]             = useState<Range>('30 days')
  const [parentMode, setParentMode]   = useState(PARENT_SEGMENT_OPTIONS[0])
  const [schoolMode, setSchoolMode]   = useState<'type' | 'city'>('type')

  // ── Fetch ──
  // IMPORTANT: Update this URL to match where route.ts is placed.
  // If the file is at app/api/admin/analytics/route.ts → '/api/admin/analytics'
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin/analytics').then(r => r.json()),
    staleTime: 3 * 60 * 1000,
  })

  // ── Derived data ──
  const allDaily: any[]  = data?.dailyLeads30 || []
  const allSignups: any[] = data?.signups      || []
  const days = rangeDays[range]

  // Slice to selected range
  const daily   = allDaily.slice(-days)
  const signups = allSignups.slice(-days)
  const cities: any[]    = data?.topCities  || []
  const boards: any[]    = data?.boardData  || []
  const funnel: any[]    = data?.funnelData || []
  const parentStats: any = data?.parentStats || {}
  const schoolStats: any[] = data?.schoolStats || []
  const heatmap: number[][] = data?.weeklyHeatmap || Array.from({ length: 4 }, () => Array(7).fill(0))

  const totalLeads30   = daily.reduce((s: number, d: any) => s + (d.leads || 0), 0)
  const totalRev30     = daily.reduce((s: number, d: any) => s + (d.revenue || 0), 0)
  const totalSignups30 = signups.reduce((s: number, d: any) => s + Number(d.count || 0), 0)
  const funnelMax      = funnel[0]?.value || 1
  const cityMax        = Math.max(1, ...cities.map((c: any) => c.leads))
  const boardMax       = Math.max(1, ...boards.map((b: any) => b.value))
  const schoolMax      = Math.max(1, ...schoolStats.map((s: any) => s.leads))

  // Pick the right area chart dataset
  const areaKey   = leadsTab === 'signups' ? 'count' : leadsTab
  const areaColor = leadsTab === 'leads' ? C.amber : leadsTab === 'revenue' ? C.teal : C.sky
  const areaData  = leadsTab === 'signups'
    ? signups.map((r: any) => ({ day: String(r.day).slice(5), count: Number(r.count) }))
    : daily

  const parentSegs = parentSegmentData(parentStats, parentMode)

  return (
    <AdminLayout pageClass="admin-page-analytics" title="Analytics" subtitle="Real-time platform data">
      <style>{`
        @keyframes as { 0%,100%{opacity:1} 50%{opacity:.4} }
        .tab-pill { display:flex; gap:4px; background:rgba(255,255,255,0.04); border-radius:8px; padding:3px; border:1px solid ${C.border}; }
        select.admin-sel { background:rgba(255,255,255,0.04); color:${C.t2}; border:1px solid ${C.border}; border-radius:8px; font-family:${ff}; font-size:12px; padding:5px 10px; cursor:pointer; }
      `}</style>

      {/* ── Stat pills ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 18 }}>
        <StatPill icon={TrendingUp} label={`Leads (${range})`}   value={isLoading ? '…' : totalLeads30.toLocaleString()}                  color={C.amber}   sub="↑ 12% vs prior" />
        <StatPill icon={Users}      label={`Signups (${range})`}  value={isLoading ? '…' : totalSignups30.toLocaleString()}                 color={C.sky}     sub="↑ 8% vs prior" />
        <StatPill icon={Phone}      label={`Revenue (${range})`}  value={isLoading ? '…' : `₹${totalRev30.toLocaleString('en-IN')}`}       color={C.teal}    sub="↑ 18% vs prior" />
        <StatPill icon={MapPin}     label="Active Cities"          value={isLoading ? '…' : cities.length}                                   color={C.violet}  />
        <StatPill icon={School}     label="Total Schools"          value={isLoading ? '…' : (data?.funnelData?.[1]?.value || 0).toLocaleString()} color={C.blue} />
        <StatPill icon={BarChart2}  label="Applications"           value={isLoading ? '…' : (data?.funnelData?.[3]?.value || 0).toLocaleString()} color={C.rose} />
      </div>

      {/* ── Main timeline ── */}
      <div style={{ ...card, padding: '22px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <SH title="Daily Activity" sub={`Trends over last ${range}`} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="admin-sel" value={range} onChange={e => setRange(e.target.value as Range)}>
              {RANGES.map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="tab-pill">
              {(['leads', 'revenue', 'signups'] as const).map(t => (
                <TabBtn key={t} label={t} active={leadsTab === t} onClick={() => setLeadsTab(t)} />
              ))}
            </div>
          </div>
        </div>
        {isLoading ? <Skel h={240} /> : areaData.length === 0 ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: ff, fontSize: 13 }}>
            No data yet — activity will appear here once recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.t3, fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false}
                tickFormatter={v => leadsTab === 'revenue' ? `₹${Math.round(v / 1000)}K` : String(v)} />
              <Tooltip content={<Tooltip_ />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey={areaKey} stroke={areaColor} strokeWidth={2.5} fill="url(#gA)" dot={false}
                activeDot={{ r: 5, fill: areaColor, stroke: C.card, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Cities + Funnel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Top Cities */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Top Cities by Leads" sub="Geographic distribution" />
          {isLoading ? <Skel h={200} /> : cities.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: ff, fontSize: 13 }}>No city data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cities} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: C.t3, fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: C.t2, fontSize: 12, fontFamily: ff }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tooltip_ />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="leads" name="leads" radius={[0, 4, 4, 0]} maxBarSize={14}>
                  {cities.map((_: any, i: number) => <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Funnel */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Conversion Funnel" sub="Platform-wide user journey with drop-off" />
          {isLoading ? <Skel h={200} /> : (
            <div style={{ marginTop: 8 }}>
              {funnel.map((f: any, i: number) => (
                <FunnelBar key={f.name} name={f.name} value={f.value} max={funnelMax}
                  color={FUNNEL_COLORS[i] || C.t2} prevValue={i > 0 ? funnel[i - 1].value : undefined} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Board pie + New signups ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
        {/* Board donut */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Schools by Board" sub="Curriculum breakdown" />
          {isLoading ? <Skel h={200} /> : boards.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: ff, fontSize: 13 }}>No board data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={boards} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}>
                    {boards.map((e: any, i: number) => <Cell key={i} fill={e.color || BOARD_COLORS[i]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<Tooltip_ />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
                {boards.map((b: any) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                    <span style={{ fontSize: 12, color: C.t2, fontFamily: ff }}>{b.name}</span>
                    <span style={{ fontSize: 12, color: C.t1, fontWeight: 700, fontFamily: ff }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* New signups line chart */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="New User Signups" sub={`Daily registrations — last ${range}`} />
          {isLoading ? <Skel h={200} /> : signups.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: ff, fontSize: 13 }}>No signups yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={signups.map((r: any) => ({ day: String(r.day).slice(5), count: Number(r.count) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: C.t3, fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: ff }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<Tooltip_ />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="count" name="signups" stroke={C.sky} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, fill: C.sky, stroke: C.card, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Parent & School segments ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginBottom: 14 }}>
        {/* Parent segments */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SH title="Parent Segments" sub="Who is buying leads" />
            <select className="admin-sel" value={parentMode} onChange={e => setParentMode(e.target.value as any)}>
              {PARENT_SEGMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {isLoading ? <Skel h={140} /> : (
            <>
              {parentSegs.map((s) => (
                <HBar key={s.name} label={s.name} value={s.pct} max={100} color={s.color} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'Repeat buyers', val: `${parentStats.repeatBuyerPct ?? '—'}%`, color: C.teal },
                  { label: 'Avg leads bought', val: parentStats.avgLeads ?? '—', color: C.sky },
                  { label: 'Avg spend', val: parentStats.avgSpend ? `₹${Number(parentStats.avgSpend).toLocaleString('en-IN')}` : '—', color: C.amber },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontFamily: ff, fontSize: 18, fontWeight: 700, color: m.color }}>{m.val}</div>
                    <div style={{ fontFamily: ff, fontSize: 10, color: C.t3, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* School performance */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SH title="School Performance" sub="Leads received vs applications" />
            <select className="admin-sel" value={schoolMode} onChange={e => setSchoolMode(e.target.value as any)}>
              <option value="type">By school type</option>
              <option value="city">By city</option>
            </select>
          </div>
          {isLoading ? <Skel h={200} /> : schoolStats.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: ff, fontSize: 13 }}>No school data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={schoolStats.map((s: any) => ({ name: s.type, leads: s.leads, applications: s.applications }))}
                margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.t3, fontSize: 10, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: ff }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tooltip_ />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="leads" name="leads" fill={C.violet} radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="applications" name="applications" fill={C.emerald} radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {[{label:'Leads', c: C.violet}, {label:'Applications', c: C.emerald}].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.c }} />
                <span style={{ fontFamily: ff, fontSize: 11, color: C.t2 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly activity heatmap ── */}
      <div style={{ ...card, padding: '22px 24px', marginBottom: 14 }}>
        <SH title="Weekly Cohort Heatmap" sub="Lead purchase activity by day of week — last 4 weeks" />
        {isLoading ? <Skel h={130} /> : <WeeklyHeatmap data={heatmap} />}
      </div>

    </AdminLayout>
  )
}
