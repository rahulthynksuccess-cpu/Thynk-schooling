'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import { School, MapPin, BookOpen, Users, Dumbbell, Languages, Music, BarChart2, Hash, TrendingUp, Globe } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { T, ff, card, axisTick, PALETTE, RangePills, ChartTip, Skel, StatCard, SectionCard, HorizBars, TagCloud, DataTable, PageActions, RANGES } from '@/components/admin/ReportShared'

function exportCSV(data: any, range: string) {
  if (!data) return
  const label = RANGES.find(r => r.key === range)?.label || range
  const rows = [`# SCHOOL ANALYTICS — ${label}`, `# Generated: ${new Date().toLocaleString('en-IN')}`, '',
    '## STATE WISE', 'State,Total Schools,Verified,Period New',
    ...(data.stateWise||[]).map((r: any) => `${r.name},${r.count},${r.verified},${r.periodCount}`), '',
    '## CITY WISE', 'City,Total Schools,Verified,Period New',
    ...(data.cityWise||[]).map((r: any) => `${r.name},${r.count},${r.verified},${r.periodCount}`), '',
    '## BOARD WISE', 'Board,Count',
    ...(data.boardWise||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## GENDER POLICY', 'Policy,Count',
    ...(data.genderWise||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## SCHOOL TYPE', 'Type,Count',
    ...(data.typeWise||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## FACILITIES', 'Facility,Schools Offering',
    ...(data.facilities||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## SPORTS', 'Sport,Schools Offering',
    ...(data.sports||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## LANGUAGES', 'Language,Schools Offering',
    ...(data.languages||[]).map((r: any) => `${r.name},${r.count}`), '',
    '## EXTRA-CURRICULAR', 'Activity,Schools Offering',
    ...(data.extraCurricular||[]).map((r: any) => `${r.name},${r.count}`),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `school-analytics-${range}-${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

export default function SchoolAnalyticsPage() {
  const [range, setRange] = useState('30d')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-schools', range],
    queryFn: () => fetch(`/api/admin/reports?type=schools&range=${range}`).then(r => r.json()),
    staleTime: 5 * 60_000, refetchOnWindowFocus: false, placeholderData: (prev: any) => prev,
  })

  const t = data?.totals || {}
  const cov = data?.coverage || {}
  const curRangeLabel = RANGES.find(r => r.key === range)?.label || range

  return (
    <AdminLayout pageClass="admin-page-school-analytics" title="School Analytics" subtitle="Complete school database breakdown across all dimensions">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <PageActions range={range} onRangeChange={setRange} onRefresh={refetch} onExport={() => exportCSV(data, range)} loading={isFetching} accentColor={T.gold} />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {isLoading ? [...Array(4)].map((_,i) => <Skel key={i} h={110}/>) : [
          { icon: School,     color: T.gold,   label: 'Total Schools',     value: t.total    || 0 },
          { icon: TrendingUp, color: T.green,  label: `New in ${curRangeLabel}`, value: t.periodNew || 0, badge: `+${t.new7d||0} this week` },
          { icon: BarChart2,  color: T.blue,   label: 'Verified',          value: t.verified || 0, sub: `${t.total ? Math.round(t.verified/t.total*100) : 0}% of total` },
          { icon: School,     color: T.purple, label: 'Featured',          value: t.featured || 0 },
        ].map(k => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Coverage stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'States Covered',   value: cov.states    || 0, color: T.blue   },
          { label: 'Cities Covered',   value: cov.cities    || 0, color: T.teal   },
          { label: 'Active Pincodes',  value: cov.pincodes  || 0, color: T.orange },
          { label: 'Districts',        value: cov.districts || 0, color: T.purple },
        ].map(c => (
          <div key={c.label} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe style={{ width: 15, height: 15, color: c.color }} />
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
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>School Registration Trend</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 14px' }}>{curRangeLabel} · new registrations and verification rate</p>
        {isLoading ? <Skel h={220}/> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data?.dailyTrend||[]} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="100%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor((data?.dailyTrend||[]).length/6)||'preserveStartEnd'}/>
              <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }}/>
              <Area type="monotone" dataKey="count" name="registered" stroke={T.gold} strokeWidth={2.5} fill="url(#gS)" dot={false}/>
              <Line type="monotone" dataKey="verified" name="verified" stroke={T.green} strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* State + City bar charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="B. State-wise Count" sub={`Top states · ${curRangeLabel} period`} icon={MapPin} color={T.blue}>
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
                  <Bar dataKey="periodCount" name="period new" radius={[4,4,0,0]} fill={`${T.teal}88`}/>
                </BarChart>
              </ResponsiveContainer>
              {/* Comparison table */}
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'State', align: 'left' },
                    { key: 'count', label: 'Total', align: 'right', color: T.blue },
                    { key: 'verified', label: 'Verified', align: 'right', color: T.green },
                    { key: 'periodCount', label: curRangeLabel, align: 'right', color: T.gold },
                  ]}
                  rows={(data?.stateWise||[]).slice(0,12)}
                  maxH={200}
                />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="C. City-wise Count" sub={`Top cities · ${curRangeLabel} period`} icon={MapPin} color={T.teal}>
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
                  <Bar dataKey="periodCount" name="period new" radius={[0,4,4,0]} fill={`${T.teal}60`}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'City', align: 'left' },
                    { key: 'count', label: 'Total', align: 'right', color: T.teal },
                    { key: 'verified', label: 'Verified', align: 'right', color: T.green },
                    { key: 'periodCount', label: curRangeLabel, align: 'right', color: T.gold },
                  ]}
                  rows={(data?.cityWise||[]).slice(0,12)}
                  maxH={200}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Board + Gender + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="E. Board-wise Schools" sub="By curriculum affiliation" icon={BookOpen} color={T.gold}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.boardWise||[]} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="count" nameKey="name">
                    {(data?.boardWise||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'schools']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Board', align: 'left' },
                  { key: 'count', label: 'Schools', align: 'right', color: T.gold },
                ]}
                rows={data?.boardWise||[]} maxH={180}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="F. Gender Policy" sub="Co-ed / boys / girls split" icon={Users} color={T.purple}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.genderWise||[]} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.genderWise||[]).map((_: any,i: number) => <Cell key={i} fill={[T.purple,T.blue,T.teal,T.orange,T.rose][i%5]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'schools']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Policy', align: 'left' },
                  { key: 'count', label: 'Schools', align: 'right', color: T.purple },
                ]}
                rows={data?.genderWise||[]} maxH={150}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="G. School Type" sub="Day / boarding / residential" icon={School} color={T.orange}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <HorizBars data={data?.typeWise||[]} colorArr={PALETTE.slice(3)} />
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'Type', align: 'left' },
                    { key: 'count', label: 'Count', align: 'right', color: T.orange },
                  ]}
                  rows={data?.typeWise||[]} maxH={150}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Facilities + Sports bar charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionCard title="H. Facility-wise Summary" sub="Top facilities offered by schools" icon={BarChart2} color={T.green}>
          {isLoading ? <Skel h={280}/> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.facilities||[]).slice(0,10)} margin={{ top:5, right:5, left:-20, bottom:32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:9}} axisLine={false} tickLine={false} angle={-40} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="count" name="schools" radius={[4,4,0,0]}>
                    {(data?.facilities||[]).slice(0,10).map((_: any,i: number) => <Cell key={i} fill={`${T.green}${['FF','CC','AA','88'][i%4]}`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <TagCloud data={data?.facilities||[]} color={T.green}/>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'Facility', align: 'left' },
                    { key: 'count', label: 'Schools', align: 'right', color: T.green },
                  ]}
                  rows={data?.facilities||[]} maxH={180}
                />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="I. Sports-wise Summary" sub="Sports programmes across schools" icon={Dumbbell} color={T.blue}>
          {isLoading ? <Skel h={280}/> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.sports||[]).slice(0,10)} margin={{ top:5, right:5, left:-20, bottom:32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:9}} axisLine={false} tickLine={false} angle={-40} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="count" name="schools" radius={[4,4,0,0]}>
                    {(data?.sports||[]).slice(0,10).map((_: any,i: number) => <Cell key={i} fill={`${T.blue}${['FF','CC','AA','88'][i%4]}`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <TagCloud data={data?.sports||[]} color={T.blue}/>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'Sport', align: 'left' },
                    { key: 'count', label: 'Schools', align: 'right', color: T.blue },
                  ]}
                  rows={data?.sports||[]} maxH={180}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Languages + Extra-curricular */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SectionCard title="J. Languages-wise Summary" sub="Languages taught across schools" icon={Languages} color={T.teal}>
          {isLoading ? <Skel h={200}/> : (
            <>
              <HorizBars data={data?.languages||[]} colorArr={PALETTE}/>
              <div style={{ marginTop: 12 }}><TagCloud data={data?.languages||[]} color={T.teal}/></div>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'Language', align: 'left' },
                    { key: 'count', label: 'Schools', align: 'right', color: T.teal },
                  ]}
                  rows={data?.languages||[]} maxH={180}
                />
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="K. Extra-Curricular Summary" sub="Activities offered by schools" icon={Music} color={T.purple}>
          {isLoading ? <Skel h={200}/> : (
            <>
              <HorizBars data={data?.extraCurricular||[]} colorArr={PALETTE.slice(4)}/>
              <div style={{ marginTop: 12 }}><TagCloud data={data?.extraCurricular||[]} color={T.purple}/></div>
              <div style={{ marginTop: 12 }}>
                <DataTable loading={isLoading}
                  columns={[
                    { key: 'name', label: 'Activity', align: 'left' },
                    { key: 'count', label: 'Schools', align: 'right', color: T.purple },
                  ]}
                  rows={data?.extraCurricular||[]} maxH={180}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  )
}
