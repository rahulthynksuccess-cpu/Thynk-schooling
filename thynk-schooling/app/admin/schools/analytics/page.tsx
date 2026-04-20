'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import {
  School, MapPin, Hash, BarChart2, Users, BookOpen,
  Dumbbell, Languages, Music, Download, RefreshCw, TrendingUp
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

// ─── Design tokens (matches admin dark theme) ─────────────────────────────
const T = {
  bg:     'var(--admin-bg,#04080F)',
  card:   'var(--admin-card-bg,#0C1422)',
  border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1:     'var(--admin-text,rgba(255,255,255,0.95))',
  t2:     'var(--admin-text-muted,rgba(255,255,255,0.6))',
  t3:     'var(--admin-text-faint,rgba(255,255,255,0.32))',
  gold:   '#F5A623', blue: '#4F8EF7', green: '#00E5A0',
  purple: '#9B72FF', teal: '#2DD4BF', orange: '#FF7A2E',
  rose:   '#FF5757',
}
const ff = 'Plus Jakarta Sans,Inter,sans-serif'
const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }
const axisTick = { fill: T.t3, fontSize: 11, fontFamily: ff }

const PALETTES = {
  blue:   ['#4F8EF7','#3B7DD8','#2669B8','#1A5098','#0D3A78'],
  green:  ['#00E5A0','#00C285','#00A06C','#007F54','#005F3F'],
  gold:   ['#F5A623','#D4891A','#B37012','#91570A','#703F05'],
  purple: ['#9B72FF','#8260E0','#6A4FBF','#513D9F','#3A2C7F'],
  mixed:  ['#4F8EF7','#00E5A0','#F5A623','#9B72FF','#FF7A2E','#2DD4BF','#FF5757','#FBBF24','#34D399','#60A5FA'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: ff }}>
      {label && <div style={{ color: T.t2, marginBottom: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: T.t2 }}>{p.name}:</span>
          <span style={{ color: T.t1, fontWeight: 700 }}>{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

const Skel = ({ h = 200 }: any) => (
  <div style={{ height: h, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'skel 1.4s ease-in-out infinite' }} />
)

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}00)` }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 28, color: T.t1, lineHeight: 1, letterSpacing: '-0.5px' }}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
      <div style={{ fontFamily: ff, fontSize: 12, color: T.t2, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: ff, fontSize: 11, color: T.t3, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, sub, children, icon: Icon, color = T.gold }: any) {
  return (
    <div style={{ ...card, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
        <div>
          <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>{title}</h3>
          {sub && <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '1px 0 0' }}>{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function HorizBar({ data, color = T.blue, valueKey = 'count', nameKey = 'name', max }: any) {
  const maxVal = max || Math.max(...data.map((d: any) => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.slice(0, 12).map((item: any, i: number) => {
        const pct = Math.round(item[valueKey] / maxVal * 100)
        const c = Array.isArray(color) ? color[i % color.length] : color
        return (
          <div key={item[nameKey] || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[nameKey]}</span>
              <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{Number(item[valueKey]).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg,${c},${c}88)`, transition: 'width .5s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TagCloud({ data, color = T.teal, valueKey = 'count', nameKey = 'name' }: any) {
  const maxVal = Math.max(...data.map((d: any) => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {data.slice(0, 20).map((item: any, i: number) => {
        const intensity = item[valueKey] / maxVal
        const c = Array.isArray(color) ? color[i % color.length] : color
        return (
          <div key={item[nameKey] || i}
            style={{ padding: '5px 12px', borderRadius: 20, background: `${c}${Math.round(intensity * 0.3 * 255).toString(16).padStart(2,'0')}`, border: `1px solid ${c}${Math.round(intensity * 0.5 * 255).toString(16).padStart(2,'0')}`, fontFamily: ff, fontSize: 12, color: c, fontWeight: intensity > 0.5 ? 700 : 400, cursor: 'default' }}>
            {item[nameKey]} <span style={{ opacity: 0.6, fontSize: 10 }}>{Number(item[valueKey]).toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}

async function exportCSV(data: any) {
  if (!data) return
  const rows: string[] = ['# SCHOOL ANALYTICS REPORT', `# Generated: ${new Date().toLocaleString('en-IN')}`, '']

  rows.push('## STATE WISE', 'State,Count,Verified')
  data.stateWise.forEach((r: any) => rows.push(`${r.name},${r.count},${r.verified}`))
  rows.push('', '## CITY WISE', 'City,Count,Verified')
  data.cityWise.forEach((r: any) => rows.push(`${r.name},${r.count},${r.verified}`))
  rows.push('', '## BOARD WISE', 'Board,Count')
  data.boardWise.forEach((r: any) => rows.push(`${r.name},${r.count}`))

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `school-analytics-${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function SchoolAnalyticsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-schools'],
    queryFn: () => fetch('/api/admin/reports?type=schools').then(r => r.json()),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const totals = data?.totals || {}

  return (
    <AdminLayout pageClass="admin-page-school-analytics" title="School Analytics" subtitle="Comprehensive school data breakdown — all dimensions">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button onClick={() => refetch()} disabled={isFetching}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.t2, fontSize: 12, fontFamily: ff, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 12, height: 12, animation: isFetching ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
        <button onClick={() => exportCSV(data)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: T.gold, color: '#000', fontSize: 12, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
          <Download style={{ width: 12, height: 12 }} /> Export CSV
        </button>
      </div>

      {/* A. Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
        {isLoading ? [...Array(6)].map((_, i) => <Skel key={i} h={110} />) : [
          { icon: School,     color: T.gold,   label: 'Total Schools',    value: totals.total    || 0 },
          { icon: TrendingUp, color: T.green,  label: 'Verified',         value: totals.verified || 0 },
          { icon: BarChart2,  color: T.blue,   label: 'Active',           value: totals.active   || 0 },
          { icon: School,     color: T.purple, label: 'Featured',         value: totals.featured || 0 },
          { icon: TrendingUp, color: T.teal,   label: 'New (30 Days)',    value: totals.new30d   || 0 },
          { icon: TrendingUp, color: T.orange, label: 'New (7 Days)',     value: totals.new7d    || 0 },
        ].map(k => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Monthly growth chart */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>Monthly School Growth</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 16px' }}>New school registrations — last 12 months</p>
        {isLoading ? <Skel h={220} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthlyGrowth || []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gSchool" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.gold} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="count" name="schools" stroke={T.gold} strokeWidth={2.5} fill="url(#gSchool)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row: State + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="State-wise Count" sub="Top states by school registrations" icon={MapPin} color={T.blue}>
          {isLoading ? <Skel /> : data?.stateWise?.length === 0 ? (
            <div style={{ color: T.t3, fontSize: 12, fontFamily: ff, textAlign: 'center', padding: '20px 0' }}>No state data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.stateWise || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="schools" radius={[4, 4, 0, 0]}>
                    {(data?.stateWise || []).slice(0, 10).map((_: any, i: number) => (
                      <Cell key={i} fill={PALETTES.blue[i % PALETTES.blue.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <HorizBar data={(data?.stateWise || []).slice(0, 8)} color={PALETTES.mixed} />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="City-wise Count" sub="Top cities by school registrations" icon={MapPin} color={T.teal}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.cityWise || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }} layout="vertical">
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="schools" radius={[0, 4, 4, 0]}>
                    {(data?.cityWise || []).slice(0, 10).map((_: any, i: number) => (
                      <Cell key={i} fill={PALETTES.green[i % PALETTES.green.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 22, color: T.teal }}>{data?.pincodes?.active?.toLocaleString() || 0}</div>
                  <div style={{ fontFamily: ff, fontSize: 11, color: T.t3 }}>Active Pincodes</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 22, color: T.blue }}>{data?.pincodes?.districts?.toLocaleString() || 0}</div>
                  <div style={{ fontFamily: ff, fontSize: 11, color: T.t3 }}>Districts Covered</div>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Row: Board + Gender + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="Board-wise Schools" sub="By curriculum / affiliation" icon={BookOpen} color={T.gold}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data?.boardWise || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count" nameKey="name">
                    {(data?.boardWise || []).map((_: any, i: number) => <Cell key={i} fill={PALETTES.mixed[i % PALETTES.mixed.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'schools']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(data?.boardWise || []).slice(0, 6).map((b: any, i: number) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTES.mixed[i % PALETTES.mixed.length] }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2 }}>{b.name}</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{b.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Gender Policy" sub="Co-ed / boys / girls split" icon={Users} color={T.purple}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.genderWise || []} cx="50%" cy="50%" outerRadius={65} paddingAngle={3} dataKey="count" nameKey="name">
                    {(data?.genderWise || []).map((_: any, i: number) => <Cell key={i} fill={[T.purple, T.blue, T.teal, T.orange, T.rose][i % 5]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'schools']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
                {(data?.genderWise || []).map((g: any, i: number) => (
                  <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: [T.purple, T.blue, T.teal, T.orange, T.rose][i % 5] }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2 }}>{g.name}</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{g.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="School Type" sub="Day / boarding / residential" icon={School} color={T.orange}>
          {isLoading ? <Skel /> : (
            <div style={{ marginTop: 4 }}>
              <HorizBar data={data?.typeWise || []} color={PALETTES.gold} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Row: Facilities + Sports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="Facility-wise Summary" sub="Top facilities offered by schools" icon={BarChart2} color={T.green}>
          {isLoading ? <Skel h={260} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.facilities || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 9 }} axisLine={false} tickLine={false} angle={-40} textAnchor="end" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="schools" radius={[4, 4, 0, 0]}>
                    {(data?.facilities || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={PALETTES.green[i % PALETTES.green.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <TagCloud data={data?.facilities || []} color={T.green} />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Sports-wise Summary" sub="Sports offered across schools" icon={Dumbbell} color={T.blue}>
          {isLoading ? <Skel h={260} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.sports || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 9 }} axisLine={false} tickLine={false} angle={-40} textAnchor="end" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="schools" radius={[4, 4, 0, 0]}>
                    {(data?.sports || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={PALETTES.blue[i % PALETTES.blue.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <TagCloud data={data?.sports || []} color={T.blue} />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Row: Languages + Extra-curricular */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="Languages-wise Summary" sub="Languages taught across schools" icon={Languages} color={T.teal}>
          {isLoading ? <Skel h={200} /> : (
            <>
              <HorizBar data={data?.languages || []} color={PALETTES.mixed} />
              <div style={{ marginTop: 14 }}>
                <TagCloud data={data?.languages || []} color={T.teal} />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Extra-Curricular Summary" sub="Activities offered by schools" icon={Music} color={T.purple}>
          {isLoading ? <Skel h={200} /> : (
            <>
              <HorizBar data={data?.extraCurricular || []} color={PALETTES.purple} />
              <div style={{ marginTop: 14 }}>
                <TagCloud data={data?.extraCurricular || []} color={T.purple} />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Full data tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          { title: 'All States', data: data?.stateWise, color: T.blue },
          { title: 'All Cities', data: data?.cityWise, color: T.teal },
          { title: 'All Boards', data: data?.boardWise, color: T.gold },
        ].map(({ title, data: rows, color }) => (
          <div key={title} style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.t1, margin: 0 }}>{title}</h3>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3 }}>Name</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3 }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? [...Array(6)].map((_, i) => (
                    <tr key={i}><td colSpan={2} style={{ padding: '8px 16px' }}><Skel h={16} /></td></tr>
                  )) : (rows || []).map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 16px', color: T.t2 }}>{r.name}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color }}>
                        {Number(r.count).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
