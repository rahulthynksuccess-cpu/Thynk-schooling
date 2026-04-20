'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  TrendingUp, MapPin, Hash, School, BookOpen,
  Download, RefreshCw, CheckCircle2, XCircle, Activity
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const T = {
  bg: 'var(--admin-bg,#04080F)', card: 'var(--admin-card-bg,#0C1422)',
  border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1: 'var(--admin-text,rgba(255,255,255,0.95))',
  t2: 'var(--admin-text-muted,rgba(255,255,255,0.6))',
  t3: 'var(--admin-text-faint,rgba(255,255,255,0.32))',
  gold: '#F5A623', blue: '#4F8EF7', green: '#00E5A0',
  purple: '#9B72FF', teal: '#2DD4BF', orange: '#FF7A2E', rose: '#FF5757',
}
const ff = 'Plus Jakarta Sans,Inter,sans-serif'
const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }
const axisTick = { fill: T.t3, fontSize: 11, fontFamily: ff }
const PALETTE = ['#4F8EF7','#00E5A0','#F5A623','#9B72FF','#FF7A2E','#2DD4BF','#FF5757','#FBBF24','#34D399','#60A5FA']

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: ff }}>
      {label && <div style={{ color: T.t2, marginBottom: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
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

function StatCard({ icon: Icon, label, value, sub, color, subColor }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}00)` }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 26, color: T.t1, lineHeight: 1, letterSpacing: '-0.5px' }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <div style={{ fontFamily: ff, fontSize: 12, color: T.t2, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: ff, fontSize: 11, color: subColor || T.t3, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, sub, children, icon: Icon, color = T.green }: any) {
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

function HorizBar({ data, colorArr = PALETTE, valueKey = 'count', nameKey = 'name' }: any) {
  const maxVal = Math.max(...(data || []).map((d: any) => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {(data || []).slice(0, 12).map((item: any, i: number) => {
        const pct = Math.round(item[valueKey] / maxVal * 100)
        const c = colorArr[i % colorArr.length]
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[nameKey]}</span>
              <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{Number(item[valueKey]).toLocaleString()}</span>
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

function exportCSV(data: any) {
  if (!data) return
  const rows = ['# LEAD ANALYTICS REPORT', `# Generated: ${new Date().toLocaleString('en-IN')}`, '',
    '## STATE WISE', 'State,Leads',
    ...(data.stateWise || []).map((r: any) => `${r.name},${r.count}`), '',
    '## CITY WISE', 'City,Leads',
    ...(data.cityWise || []).map((r: any) => `${r.name},${r.count}`), '',
    '## BOARD WISE', 'Board,Leads',
    ...(data.boardWise || []).map((r: any) => `${r.name},${r.count}`),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `lead-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
}

export default function LeadAnalyticsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-leads'],
    queryFn: () => fetch('/api/admin/reports?type=leads').then(r => r.json()),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const totals = data?.totals || {}
  const convRate = totals.total > 0 ? Math.round(totals.purchased / totals.total * 100) : 0

  return (
    <AdminLayout pageClass="admin-page-lead-analytics" title="Lead Analytics" subtitle="Complete lead funnel and geographic breakdown">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button onClick={() => refetch()} disabled={isFetching}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.t2, fontSize: 12, fontFamily: ff, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 12, height: 12 }} /> Refresh
        </button>
        <button onClick={() => exportCSV(data)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: T.green, color: '#000', fontSize: 12, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
          <Download style={{ width: 12, height: 12 }} /> Export CSV
        </button>
      </div>

      {/* D. Totals row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
        {isLoading ? [...Array(6)].map((_, i) => <Skel key={i} h={110} />) : [
          { icon: TrendingUp,    color: T.green,  label: 'Total Leads',    value: totals.total      || 0 },
          { icon: CheckCircle2, color: T.gold,   label: 'Purchased',      value: totals.purchased  || 0, sub: `${convRate}% conversion`, subColor: T.gold },
          { icon: XCircle,      color: T.t3,     label: 'Unpurchased',    value: totals.unpurchased || 0 },
          { icon: Activity,     color: T.blue,   label: 'Last 30 Days',   value: totals.new30d     || 0 },
          { icon: Activity,     color: T.teal,   label: 'Last 7 Days',    value: totals.new7d      || 0 },
          { icon: Activity,     color: T.orange, label: 'Today',          value: totals.today      || 0 },
        ].map(k => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Monthly trend */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>Monthly Lead Trend</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 16px' }}>Total leads vs purchased leads — last 12 months</p>
        {isLoading ? <Skel h={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data?.monthlyTrend || []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 12, color: T.t2, paddingTop: 10 }} />
              <Area type="monotone" dataKey="count" name="total leads" stroke={T.green} strokeWidth={2.5} fill="url(#gLeads)" dot={false} />
              <Line type="monotone" dataKey="purchased" name="purchased" stroke={T.gold} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row: State + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="A. State-wise Lead Count" sub="Top states by lead volume" icon={MapPin} color={T.blue}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={(data?.stateWise || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="leads" radius={[4, 4, 0, 0]}>
                    {(data?.stateWise || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 10 }}><HorizBar data={(data?.stateWise || []).slice(0, 8)} /></div>
            </>
          )}
        </SectionCard>

        <SectionCard title="B. City-wise Lead Count" sub="Top cities by lead volume" icon={MapPin} color={T.teal}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={(data?.cityWise || []).slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }} layout="vertical">
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="leads" radius={[0, 4, 4, 0]}>
                    {(data?.cityWise || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, padding: '10px 0', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 20, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 22, color: T.teal }}>{(data?.activePincodes || 0).toLocaleString()}</div>
                  <div style={{ fontFamily: ff, fontSize: 11, color: T.t3 }}>C. Active Pincodes</div>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Row: Board + School Type + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="E. Lead Count by Board" sub="Which board schools get most leads" icon={BookOpen} color={T.gold}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.boardWise || []} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.boardWise || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'leads']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {(data?.boardWise || []).slice(0, 5).map((b: any, i: number) => (
                  <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2 }}>{b.name}</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{b.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="F. Lead Count by School Type" sub="Day / boarding / residential" icon={School} color={T.purple}>
          {isLoading ? <Skel /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.typeWise || []} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.typeWise || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'leads']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}><HorizBar data={(data?.typeWise || []).slice(0, 5)} /></div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Lead Status Breakdown" sub="New / contacted / converted" icon={Activity} color={T.green}>
          {isLoading ? <Skel /> : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {(data?.statusBreakdown || []).map((s: any, i: number) => {
                  const total = (data?.statusBreakdown || []).reduce((sum: number, x: any) => sum + x.count, 0) || 1
                  const pct = Math.round(s.count / total * 100)
                  const c = PALETTE[i % PALETTE.length]
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                          <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, textTransform: 'capitalize' }}>{s.name}</span>
                          <span style={{ fontFamily: ff, fontSize: 10, color: c, background: `${c}18`, padding: '1px 5px', borderRadius: 8 }}>{pct}%</span>
                        </div>
                        <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{Number(s.count).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: c, transition: 'width .5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Top schools + Source breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="Top Schools by Leads" sub="Schools receiving most enquiries" icon={School} color={T.blue}>
          {isLoading ? <Skel h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(data?.topSchools || []).slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }} />
                <Bar dataKey="leads" name="total leads" fill={T.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchased" name="purchased" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Lead Source Breakdown" sub="Where leads come from" icon={Activity} color={T.teal}>
          {isLoading ? <Skel h={240} /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.sourceBreakdown || []} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.sourceBreakdown || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'leads']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {(data?.sourceBreakdown || []).slice(0, 6).map((s: any, i: number) => (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, textTransform: 'capitalize' }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{Number(s.count).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Full data table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { title: 'All States', rows: data?.stateWise, color: T.blue },
          { title: 'All Cities', rows: data?.cityWise, color: T.teal },
        ].map(({ title, rows, color }) => (
          <div key={title} style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.t1, margin: 0 }}>{title}</h3>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3 }}>Name</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3 }}>Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? [...Array(6)].map((_, i) => (
                    <tr key={i}><td colSpan={2} style={{ padding: '8px 16px' }}><div style={{ height: 16, borderRadius: 4, background: T.border, animation: 'skel 1.4s ease-in-out infinite' }} /></td></tr>
                  )) : (rows || []).map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 16px', color: T.t2 }}>{r.name}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color }}>{Number(r.count).toLocaleString('en-IN')}</td>
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
