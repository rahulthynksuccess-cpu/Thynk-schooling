'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import { DollarSign, CreditCard, TrendingUp, CheckCircle2, XCircle, Clock, Percent, Tag, Package, Zap } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { T, ff, card, axisTick, PALETTE, RangePills, ChartTip, Skel, StatCard, SectionCard, HorizBars, DataTable, PageActions, RANGES } from '@/components/admin/ReportShared'

const PG_COLORS: Record<string,string> = { razorpay:'#3395FF', cashfree:'#00C853', easebuzz:'#FF6600', payu:'#FF7722', demo:'#6B7280', stripe:'#635BFF' }
const PG_LABELS: Record<string,string> = { razorpay:'Razorpay', cashfree:'Cashfree', easebuzz:'Easebuzz', payu:'PayU', demo:'Demo', stripe:'Stripe' }
const STATUS_COLORS: Record<string,string> = { paid:'#00E5A0', captured:'#00E5A0', success:'#00E5A0', completed:'#00E5A0', pending:'#FBBF24', failed:'#FF5757', dropped:'#FF5757', cancelled:'#FF5757' }

function exportCSV(data: any, range: string) {
  if (!data) return
  const label = RANGES.find(r => r.key === range)?.label || range
  const t = data.totals || {}
  const rows = [`# PAYMENT ANALYTICS — ${label}`, `# Generated: ${new Date().toLocaleString('en-IN')}`, '',
    '## SUMMARY',
    `Total Initiated,₹${(t.totalInitiated||0).toLocaleString('en-IN')}`,
    `Total Collected,₹${(t.totalCollected||0).toLocaleString('en-IN')}`,
    `Period Collected,₹${(t.periodCollected||0).toLocaleString('en-IN')}`,
    `Discounts,₹${(t.totalDiscounts||0).toLocaleString('en-IN')}`,
    `Net Revenue,₹${(t.netRevenue||0).toLocaleString('en-IN')}`,
    `Conversion Rate,${t.conversionRate||0}%`,
    '', '## GATEWAY BREAKDOWN (ACTUAL COLLECTION)', 'Gateway,Initiated,Paid,Dropped,Pending,Collected,Net Collected,Conv%',
    ...(data.gatewayStats||[]).map((r: any) =>
      `${PG_LABELS[r.gateway]||r.gateway},${r.initiated},${r.paid},${r.dropped},${r.pending},₹${r.collected.toLocaleString('en-IN')},₹${r.netCollected.toLocaleString('en-IN')},${r.convPct}%`
    ),
    '', '## SUBSCRIPTION PLAN BREAKDOWN', 'Plan,Transactions,Revenue,Discounts',
    ...(data.planBreakdown||[]).map((r: any) => `${r.name},${r.count},₹${r.revenue.toLocaleString('en-IN')},₹${r.discounts.toLocaleString('en-IN')}`),
    '', '## LEAD PACKAGE BREAKDOWN', 'Package,Transactions,Revenue',
    ...(data.packageBreakdown||[]).map((r: any) => `${r.name},${r.count},₹${r.revenue.toLocaleString('en-IN')}`),
    '', '## COUPON BREAKUP', 'Code,Uses,Discount Given,Collected',
    ...(data.couponBreakdown||[]).map((r: any) => `${r.code},${r.uses},₹${r.discount.toLocaleString('en-IN')},₹${r.collected.toLocaleString('en-IN')}`),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payment-analytics-${range}-${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

export default function PaymentAnalyticsPage() {
  const [range, setRange] = useState('30d')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-payments', range],
    queryFn: () => fetch(`/api/admin/reports?type=payments&range=${range}`).then(r => r.json()),
    staleTime: 3 * 60_000, refetchOnWindowFocus: false, placeholderData: (prev: any) => prev,
  })

  const t = data?.totals || {}
  const curRangeLabel = RANGES.find(r => r.key === range)?.label || range

  return (
    <AdminLayout pageClass="admin-page-payment-analytics" title="Payment Analytics" subtitle="Revenue, collections, gateway performance and discount analysis">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <PageActions range={range} onRangeChange={setRange} onRefresh={refetch} onExport={() => exportCSV(data, range)} loading={isFetching} accentColor={T.gold}/>

      {/* A+B KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {isLoading ? [...Array(4)].map((_,i) => <Skel key={i} h={120}/>) : [
          { icon: TrendingUp,   color: T.gold,   label: 'A. Total Initiated',           value: `₹${(t.totalInitiated||0).toLocaleString('en-IN')}`, sub: `${t.totalTxns||0} total transactions` },
          { icon: CheckCircle2, color: T.green,  label: 'B. Actual Collected',          value: `₹${(t.totalCollected||0).toLocaleString('en-IN')}`, sub: `${t.paidCount||0} paid`, badge: `${t.conversionRate||0}% conv` },
          { icon: Tag,          color: T.purple, label: 'Discounts Given',              value: `₹${(t.totalDiscounts||0).toLocaleString('en-IN')}`, sub: `${(data?.couponBreakdown||[]).length} codes used` },
          { icon: DollarSign,   color: T.teal,   label: `Revenue in ${curRangeLabel}`,  value: `₹${(t.periodCollected||0).toLocaleString('en-IN')}`, sub: 'Actual collected in period' },
        ].map(k => <StatCard key={k.label} {...k}/>)}
      </div>

      {/* Transaction status row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {isLoading ? [...Array(4)].map((_,i) => <Skel key={i} h={80}/>) : [
          { label: 'Paid Transactions',   value: t.paidCount    || 0, color: T.green,   icon: CheckCircle2 },
          { label: 'Pending',             value: t.pendingCount || 0, color: T.amber,   icon: Clock },
          { label: 'Failed / Dropped',    value: t.failedCount  || 0, color: T.rose,    icon: XCircle },
          { label: 'Conversion Rate',     value: `${t.conversionRate||0}%`, color: T.blue, icon: Percent },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ ...card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 15, height: 15, color }}/>
            </div>
            <div>
              <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 20, color, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
              <div style={{ fontFamily: ff, fontSize: 11, color: T.t3, marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>Revenue Trend — {curRangeLabel}</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 14px' }}>Daily collected revenue and transaction count</p>
        {isLoading ? <Skel h={220}/> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data?.dailyRevenue||[]} margin={{ top:5, right:20, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="100%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor((data?.dailyRevenue||[]).length/6)||'preserveStartEnd'}/>
              <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip currency/>} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }}/>
              <Area yAxisId="l" type="monotone" dataKey="revenue" name="Revenue" stroke={T.gold} strokeWidth={2.5} fill="url(#gRev)" dot={false}/>
              <Line yAxisId="r" type="monotone" dataKey="txns" name="transactions" stroke={T.blue} strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue by source + Status pie + Gateway pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        <SectionCard title="G. Revenue by Source" sub="Subscriptions, lead packages, featured" icon={DollarSign} color={T.gold}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data?.revenueBySource||[]} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="revenue" nameKey="source">
                    {(data?.revenueBySource||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`]} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'source', label: 'Source', align: 'left' },
                  { key: 'count', label: 'Txns', align: 'right', color: T.blue },
                  { key: 'revenue', label: 'Revenue', align: 'right', color: T.gold, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                ]}
                rows={data?.revenueBySource||[]} maxH={160}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="D. Payment Status Breakdown" sub="Paid / pending / failed" icon={CheckCircle2} color={T.green}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data?.statusBreakdown||[]} cx="50%" cy="50%" outerRadius={58} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.statusBreakdown||[]).map((s: any) => <Cell key={s.name} fill={STATUS_COLORS[s.name]||T.t3} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any,n: any,p: any) => [Number(v).toLocaleString(), p.payload.name]} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Status', align: 'left' },
                  { key: 'count', label: 'Count', align: 'right', color: T.t1 },
                  { key: 'amount', label: 'Amount', align: 'right', color: T.gold, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                ]}
                rows={data?.statusBreakdown||[]} maxH={160}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="C. Gateway Collection" sub="Actual collected by gateway" icon={CreditCard} color={T.blue}>
          {isLoading ? <Skel h={220}/> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data?.gatewayStats||[]} cx="50%" cy="50%" outerRadius={58} paddingAngle={2} dataKey="collected" nameKey="gateway">
                    {(data?.gatewayStats||[]).map((g: any) => <Cell key={g.gateway} fill={PG_COLORS[g.gateway]||T.blue} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'collected']} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {(data?.gatewayStats||[]).map((g: any) => (
                  <div key={g.gateway} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: PG_COLORS[g.gateway]||T.blue }}/>
                      <span style={{ fontFamily: ff, fontSize: 11, color: T.t2 }}>{PG_LABELS[g.gateway]||g.gateway}</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: T.t1 }}>₹{Number(g.collected).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* E. Full Gateway Breakdown table — ACTUAL collection */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard style={{ width: 14, height: 14, color: T.blue }}/>
          </div>
          <div>
            <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>E. Payment Gateway Breakdown</h3>
            <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '1px 0 0' }}>PG name · initiated · paid · dropped · <strong style={{ color: T.gold }}>actual collected</strong> (not initiated) · net · conversion %</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Gateway','Initiated','Paid','Dropped','Pending','Collected ✓','Discounts','Net Collected','Period Rev','Conv %'].map((h,i) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: i===0?'left':'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: h==='Collected ✓'?T.gold:T.t3, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(3)].map((_,i) => <tr key={i}><td colSpan={10} style={{ padding: '12px 14px' }}><Skel h={18} r={4}/></td></tr>)
              : (data?.gatewayStats||[]).length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '28px', textAlign: 'center', color: T.t3 }}>No gateway data</td></tr>
              ) : (data?.gatewayStats||[]).map((g: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: `${PG_COLORS[g.gateway]||T.blue}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard style={{ width: 12, height: 12, color: PG_COLORS[g.gateway]||T.blue }}/>
                      </div>
                      <span style={{ fontWeight: 700, color: T.t1 }}>{PG_LABELS[g.gateway]||g.gateway}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.t2 }}>{Number(g.initiated).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{Number(g.paid).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.rose }}>{Number(g.dropped).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.amber }}>{Number(g.pending).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>₹{Number(g.collected).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.rose }}>₹{Number(g.discounts).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.green, fontWeight: 700 }}>₹{Number(g.netCollected).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: T.teal }}>₹{Number(g.periodCollected).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: g.convPct>=70?`${T.green}18`:g.convPct>=40?`${T.amber}18`:`${T.rose}18`, color: g.convPct>=70?T.green:g.convPct>=40?T.amber:T.rose, border: `1px solid ${g.convPct>=70?T.green:g.convPct>=40?T.amber:T.rose}25` }}>
                      {g.convPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan breakdown + Package breakdown side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <SectionCard title="G. Subscription Plan Revenue" sub="Revenue by plan (from DB names)" icon={Package} color={T.teal}>
          {isLoading ? <Skel h={240}/> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.planBreakdown||[]} margin={{ top:5, right:5, left:-10, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false} angle={-20} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip currency/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
                    {(data?.planBreakdown||[]).map((_: any,i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Plan', align: 'left' },
                  { key: 'count', label: 'Txns', align: 'right', color: T.blue },
                  { key: 'revenue', label: 'Revenue', align: 'right', color: T.teal, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                  { key: 'discounts', label: 'Discounts', align: 'right', color: T.rose, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                ]}
                rows={data?.planBreakdown||[]} maxH={160}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="G. Lead Package Revenue" sub="Revenue by package (from DB names)" icon={Zap} color={T.orange}>
          {isLoading ? <Skel h={240}/> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.packageBreakdown||[]} margin={{ top:5, right:5, left:-10, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false} angle={-20} textAnchor="end"/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip currency/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
                    {(data?.packageBreakdown||[]).map((_: any,i: number) => <Cell key={i} fill={[T.orange,T.gold,T.rose,T.purple,T.teal][i%5]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <DataTable loading={isLoading}
                columns={[
                  { key: 'name', label: 'Package', align: 'left' },
                  { key: 'count', label: 'Txns', align: 'right', color: T.blue },
                  { key: 'revenue', label: 'Revenue', align: 'right', color: T.orange, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                ]}
                rows={data?.packageBreakdown||[]} maxH={160}
              />
            </>
          )}
        </SectionCard>
      </div>

      {/* F. Coupon + Recent payments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 16 }}>
        <SectionCard title="F. Discount Code Breakup" sub="Coupon usage, discounts given, actual collected" icon={Tag} color={T.purple}>
          {isLoading ? <Skel h={240}/> : (
            <DataTable loading={isLoading}
              columns={[
                { key: 'code', label: 'Coupon', align: 'left' },
                { key: 'uses', label: 'Uses', align: 'right', color: T.blue },
                { key: 'discount', label: 'Discount', align: 'right', color: T.rose, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
                { key: 'collected', label: 'Collected', align: 'right', color: T.green, format: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
              ]}
              rows={data?.couponBreakdown||[]} maxH={280}
            />
          )}
        </SectionCard>

        <SectionCard title="Recent Transactions" sub="Latest 20 subscription payments" icon={CreditCard} color={T.teal}>
          {isLoading ? <Skel h={240}/> : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['School','Plan','Gateway','Amount','Discount','Coupon','Status','Date'].map((h,i) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: i<=1?'left':'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentPayments||[]).map((p: any, i: number) => {
                    const sc = STATUS_COLORS[p.status]||T.t3
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', color: T.t1, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.school}</td>
                        <td style={{ padding: '8px 12px', color: T.t2 }}>{p.label||'—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: `${PG_COLORS[p.gateway]||T.blue}20`, color: PG_COLORS[p.gateway]||T.blue, fontSize: 10, fontWeight: 700 }}>{PG_LABELS[p.gateway]||p.gateway}</span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: p.discount>0?T.rose:T.t3 }}>{p.discount>0?`-₹${p.discount.toLocaleString('en-IN')}`:'—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.t3, fontFamily: 'monospace', fontSize: 10 }}>{p.coupon||'—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: `${sc}15`, color: sc, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.t3, whiteSpace: 'nowrap' }}>
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* 12-month trend */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>12-Month Revenue Trend</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 14px' }}>Monthly collected revenue and transaction volume</p>
        {isLoading ? <Skel h={200}/> : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data?.monthlyRevenue||[]} margin={{ top:5, right:20, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gRevM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.25}/><stop offset="100%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip currency/>} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 11, color: T.t2, paddingTop: 8 }}/>
              <Area yAxisId="l" type="monotone" dataKey="revenue" name="Revenue" stroke={T.gold} strokeWidth={2.5} fill="url(#gRevM)" dot={false}/>
              <Line yAxisId="r" type="monotone" dataKey="txns" name="transactions" stroke={T.blue} strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </AdminLayout>
  )
}
