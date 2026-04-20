'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import { TrendingUp, MapPin, BookOpen, School, Activity, CheckCircle2, XCircle, Hash, Users } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { T, ff, card, axisTick, PALETTE, RangePills, ChartTip, Skel, StatCard, SectionCard, HorizBars, TagCloud, DataTable, PageActions, RANGES } from '@/components/admin/ReportShared'

function exportCSV(data: any, range: string) {
  if (!data) return
  const label = RANGES.find(r => r.key === range)?.label || range
  const rows = [`# LEAD ANALYTICS — ${label}`, `# Generated: ${new Date().toLocaleString('en-IN')}`, '',
    '## STATE WISE', 'State,Total Leads,Purchased,Period Leads',
    ...(data.stateWise||[]).map((r: any) => `${r.name},${r.count},${r.purchased},${r.periodCount}`), '',
    '## CITY WISE', 'City,Total Leads,Purchased,Period Leads',
    ...(data.cityWise||[]).map((r: any) => `${r.name},${r.count},${r.purchased},${r.periodCount}`), '',
    '## BOARD WISE', 'Board,Total Leads,Purchased',
    ...(data.boardWise||[]).map((r: any) => `${r.name},${r.count},${r.purchased}`), '',
    '## SCHOOL TYPE', 'Type,Total Leads,Purchased',
    ...(data.typeWise||[]).map((r: any) => `${r.name},${r.count},${r.purchased}`), '',
    '## CLASS BREAKDOWN', 'Class,Leads',
    ...(data.classBreakdown||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## TOP SCHOOLS', 'School,Leads,Purchased,Conv%',
    ...(data.topSchools||[]).map((r: any) => `${r.name},${r.leads},${r.purchased},${r.convPct}%`),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lead-analytics-${range}-${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

export default function LeadAnalyticsPage() {
  const [range, setRange] = useState('30d')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-leads', range],
    queryFn: () => fetch(`/api/admin/reports?type=leads&range=${range}`).then(r => r.json()),
    staleTime: 5 * 60_000, refetchOnWindowFocus: false, placeholderData: (prev: any) => prev,
  })

  const t = data?.totals || {}
  const cov = data?.coverage || {}
  const curRangeLabel = RANGES.find(r => r.key === range)?.label || range

  return (
    <AdminLayout pageClass="admin-page-lead-analytics" title="Lead Analytics" subtitle="Full lead funnel, conversion rates, and geographic breakdown">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <PageActions range={range} onRangeChange={setRange} onRefresh={refetch} onExport={() => exportCSV(data, range)} loading={isFetching} accentColor={T.green}/>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {isLoading ? [...Array(4)].map((_,i) => <Skel key={i} h={110}/>) : [
          { icon: TrendingUp,   color: T.green,  label: 'D. Total Leads',       value: t.total     || 0 },
          { icon: TrendingUp,   color: T.gold,   label: `New in ${curRangeLabel}`, value: t.periodCount || 0, badge: `+${t.new7d||0} this week` },
          { icon: CheckCircle2, color: T.blue,   label: 'Purchased',            value: t.purchased || 0, badge: `${t.convRate||0}% conv` },
          { icon: Activity,     color: T.orange, label: 'Today',                value: t.today     || 0 },
        ].map(k => <StatCard key={k.label} {...k}/>)}
      </div>

      {/* Coverage row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'C. Active Pincodes', value: cov.pincodes || 0, color: T.teal   },
          { label: 'Cities with Leads',  value: cov.cities   || 0, color: T.blue   },
          { label: 'States with Leads',  value: cov.states   || 0, color: T.purple },
        ].map(c => (
          <div key={c.label} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash style={{ width: 15, height: 15, color: c.color }}/>
            </div>
            <div>
              <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 22, color: c.color, lineHeight: 1 }}>{Number(c.value).toLocaleString('en-IN')}</div>
              <div style={{ fontFamily: ff, fontSize: 11, color: T.t3, marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily trend chart */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>Lead Trend — {curRangeLabel}</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 14px' }}>Total leads vs purchased leads over time</p>
        {isLoading ? <Skel h={220}/> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data?.dailyTrend||[]} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <defs>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.3}/><stop offset="100%" stopColor={T.green} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor((data?.dailyTrend||[]).length/6)||'preserveStartEnd'}/>
              <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }}/>
              <Area type="monotone" dataKey="count" name="total leads" stroke={T.green} strokeWidth={2.5} fill="url(#gL)" dot={false}/>
              <Line type="monotone" dataKey="purchased" name="purchased" stroke={T.gold} strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* State + City with comparison tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="A. State-wise Lead Count" sub={`Top states · ${curRangeLabel}`} icon={MapPin} color={T.blue}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(data?.stateWise||[]).slice(0,10)} margin={{ top:5, right:5, left:-20, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:9}} axisLine={false} tickLine={false} angle={-35} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="count" name="total" radius={[4,4,0,0]}>
                    {(data?.stateWise||[]).slice(0,10).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Bar>
                  <Bar dataKey="purchased" name="purchased" radius={[4,4,0,0]} fill={`${T.gold}80`}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'State', align: 'left' },
                    { key: 'count', label: 'Leads', align: 'right', color: T.blue },
                    { key: 'purchased', label: 'Purchased', align: 'right', color: T.gold },
                    { key: 'periodCount', label: curRangeLabel, align: 'right', color: T.green },
                  ]}
                  rows={(data?.stateWise||[]).slice(0,15)} maxH={200}
                />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="B. City-wise Lead Count" sub={`Top cities · ${curRangeLabel}`} icon={MapPin} color={T.teal}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(data?.cityWise||[]).slice(0,10)} margin={{ top:5, right:5, left:-20, bottom:30 }} layout="vertical">
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false} width={80}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="count" name="total" radius={[0,4,4,0]}>
                    {(data?.cityWise||[]).slice(0,10).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Bar>
                  <Bar dataKey="purchased" name="purchased" radius={[0,4,4,0]} fill={`${T.gold}80`}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'City', align: 'left' },
                    { key: 'count', label: 'Leads', align: 'right', color: T.teal },
                    { key: 'purchased', label: 'Purchased', align: 'right', color: T.gold },
                    { key: 'periodCount', label: curRangeLabel, align: 'right', color: T.green },
                  ]}
                  rows={(data?.cityWise||[]).slice(0,15)} maxH={200}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Board + Type + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="E. Lead Count by Board" sub="Which board schools get most leads" icon={BookOpen} color={T.gold}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.boardWise||[]} cx="50%" cy="50%" innerRadius={32} outerRadius={60} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.boardWise||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'leads']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Board', align: 'left' },
                  { key: 'count', label: 'Total', align: 'right', color: T.gold },
                  { key: 'purchased', label: 'Purchased', align: 'right', color: T.green },
                ]}
                rows={data?.boardWise||[]} maxH={170}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="F. Lead Count by School Type" sub="Day / boarding / residential" icon={School} color={T.purple}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={data?.typeWise||[]} cx="50%" cy="50%" outerRadius={55} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.typeWise||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'leads']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Type', align: 'left' },
                  { key: 'count', label: 'Total', align: 'right', color: T.purple },
                  { key: 'purchased', label: 'Purch.', align: 'right', color: T.green },
                ]}
                rows={data?.typeWise||[]} maxH={150}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="Lead Status & Class" sub="Pipeline status + class distribution" icon={Activity} color={T.green}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <div style={{ marginBottom: 12 }}>
                {(data?.statusBreakdown||[]).map((s: any, i: number) => {
                  const total = (data?.statusBreakdown||[]).reduce((sum: number, x: any) => sum + x.count, 0) || 1
                  const pct = Math.round(s.count/total*100)
                  const c = PALETTE[i%PALETTE.length]
                  return (
                    <div key={s.name} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }}/>
                          <span style={{ fontFamily: ff, fontSize: 11, color: T.t2, textTransform: 'capitalize' }}>{s.name}</span>
                          <span style={{ fontFamily: ff, fontSize: 10, color: c, background: `${c}18`, padding: '1px 5px', borderRadius: 8 }}>{pct}%</span>
                        </div>
                        <span style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: T.t1 }}>{Number(s.count).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: c, transition: 'width .5s' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                <div style={{ fontFamily: ff, fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Class Applied For</div>
                <HorizBars data={(data?.classBreakdown||[]).slice(0,8)} colorArr={PALETTE.slice(2)}/>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Top Schools + Conversion by Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="Top Schools by Leads" sub={`Most active in ${curRangeLabel}`} icon={School} color={T.blue}>
          {isLoading ? <Skel h={240}/> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(data?.topSchools||[]).slice(0,8)} margin={{ top:5, right:5, left:-20, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:9}} axisLine={false} tickLine={false} angle={-30} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Legend wrapperStyle={{ fontFamily: ff, fontSize: 10, color: T.t2, paddingTop: 6 }}/>
                  <Bar dataKey="leads" name="total leads" fill={T.green} radius={[4,4,0,0]}/>
                  <Bar dataKey="purchased" name="purchased" fill={T.gold} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'School', align: 'left' },
                  { key: 'leads', label: 'Leads', align: 'right', color: T.green },
                  { key: 'purchased', label: 'Purchased', align: 'right', color: T.gold },
                  { key: 'convPct', label: 'Conv%', align: 'right', color: T.teal, format: (v: any) => `${v}%` },
                ]}
                rows={data?.topSchools||[]} maxH={180}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="Conversion by Board" sub="Purchase rate per curriculum" icon={TrendingUp} color={T.teal}>
          {isLoading ? <Skel h={240}/> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.conversionByBoard||[]} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="board" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="convPct" name="conv%" radius={[4,4,0,0]}>
                    {(data?.conversionByBoard||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'board', label: 'Board', align: 'left' },
                  { key: 'total', label: 'Leads', align: 'right', color: T.blue },
                  { key: 'purchased', label: 'Purch.', align: 'right', color: T.gold },
                  { key: 'convPct', label: 'Conv%', align: 'right', color: T.teal, format: (v: any) => `${v}%` },
                ]}
                rows={data?.conversionByBoard||[]} maxH={170}
              />
            </>
          )}
        </SectionCard>
      </div>

      {/* 12-month trend */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>12-Month Lead Trend</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 14px' }}>Monthly leads and purchase volume — last 12 months</p>
        {isLoading ? <Skel h={200}/> : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data?.monthlyTrend||[]} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false}/>
              <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }}/>
              <Bar dataKey="count" name="total leads" fill={`${T.green}50`} radius={[3,3,0,0]}/>
              <Line type="monotone" dataKey="purchased" name="purchased" stroke={T.gold} strokeWidth={2.5} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </AdminLayout>
  )
}
