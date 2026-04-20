'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, Percent, Tag,
  Download, RefreshCw, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
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
const PALETTE = ['#4F8EF7','#00E5A0','#F5A623','#9B72FF','#2DD4BF','#FF7A2E']
const PG_COLORS: Record<string, string> = {
  razorpay: '#072654', cashfree: '#11A67A', easebuzz: '#ED5700',
  payu: '#FF7722', demo: '#6B7280', stripe: '#635BFF',
}
const PG_LABELS: Record<string, string> = {
  razorpay: 'Razorpay', cashfree: 'Cashfree', easebuzz: 'Easebuzz',
  payu: 'PayU', demo: 'Demo', stripe: 'Stripe',
}
const STATUS_COLORS: Record<string, string> = {
  paid: '#00E5A0', captured: '#00E5A0', success: '#00E5A0', completed: '#00E5A0',
  pending: '#FBBF24', failed: '#FF5757', dropped: '#FF5757', cancelled: '#FF5757',
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: ff }}>
      {label && <div style={{ color: T.t2, marginBottom: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: T.t2 }}>{p.name}:</span>
          <span style={{ color: T.t1, fontWeight: 700 }}>
            {p.name.includes('revenue') || p.name.includes('Revenue') || p.name === 'txns'
              ? p.name === 'txns' ? Number(p.value).toLocaleString() : `₹${Number(p.value).toLocaleString('en-IN')}`
              : `₹${Number(p.value).toLocaleString('en-IN')}`}
          </span>
        </div>
      ))}
    </div>
  )
}

const Skel = ({ h = 200 }: any) => (
  <div style={{ height: h, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'skel 1.4s ease-in-out infinite' }} />
)

function KPICard({ icon: Icon, label, value, sub, color, badge }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}00)` }} />
      {badge && (
        <div style={{ position: 'absolute', top: 14, right: 14, padding: '2px 8px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontFamily: ff, fontSize: 10, fontWeight: 700, color }}>{badge}</div>
      )}
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 24, color: T.t1, lineHeight: 1, letterSpacing: '-0.5px' }}>
        {typeof value === 'number' ? (label.includes('Rate') ? `${value}%` : `₹${value.toLocaleString('en-IN')}`) : value}
      </div>
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

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}` }

function exportCSV(data: any) {
  if (!data) return
  const t = data.totals || {}
  const rows = [
    '# PAYMENT ANALYTICS REPORT', `# Generated: ${new Date().toLocaleString('en-IN')}`, '',
    '## SUMMARY',
    `Total Initiated,${formatINR(t.totalInitiated || 0)}`,
    `Total Collected,${formatINR(t.totalCollected || 0)}`,
    `Total Discounts,${formatINR(t.totalDiscounts || 0)}`,
    `Net Revenue,${formatINR(t.netRevenue || 0)}`,
    `Conversion Rate,${t.conversionRate || 0}%`,
    '', '## GATEWAY WISE', 'Gateway,Initiated,Paid,Dropped,Collected,Conv%',
    ...(data.gatewayStats || []).map((r: any) =>
      `${PG_LABELS[r.gateway] || r.gateway},${r.initiated},${r.paid},${r.dropped},${formatINR(r.collected)},${r.convPct}%`
    ),
    '', '## COUPON BREAKUP', 'Code,Uses,Discount Given,Collected',
    ...(data.couponBreakdown || []).map((r: any) =>
      `${r.code},${r.uses},${formatINR(r.discount)},${formatINR(r.collected)}`
    ),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `payment-analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
}

export default function PaymentAnalyticsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-payments'],
    queryFn: () => fetch('/api/admin/reports?type=payments').then(r => r.json()),
    staleTime: 3 * 60_000,
    refetchOnWindowFocus: false,
  })

  const t = data?.totals || {}

  return (
    <AdminLayout pageClass="admin-page-payment-analytics" title="Payment Analytics" subtitle="Revenue, collections, gateway performance and discount analysis">
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button onClick={() => refetch()} disabled={isFetching}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.t2, fontSize: 12, fontFamily: ff, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 12, height: 12 }} /> Refresh
        </button>
        <button onClick={() => exportCSV(data)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: T.gold, color: '#000', fontSize: 12, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
          <Download style={{ width: 12, height: 12 }} /> Export CSV
        </button>
      </div>

      {/* A+B. KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {isLoading ? [...Array(4)].map((_, i) => <Skel key={i} h={120} />) : [
          { icon: TrendingUp,   color: T.gold,   label: 'A. Total Initiated',   value: t.totalInitiated   || 0, sub: `${t.totalTxns || 0} transactions` },
          { icon: CheckCircle2, color: T.green,  label: 'B. Actual Collected',  value: t.totalCollected   || 0, sub: `${t.paidCount || 0} paid transactions`, badge: `${t.conversionRate || 0}% conv` },
          { icon: Tag,          color: T.purple, label: 'Discounts Given',      value: t.totalDiscounts   || 0, sub: `${(data?.couponBreakdown || []).length} unique codes used` },
          { icon: DollarSign,   color: T.teal,   label: 'Net Revenue',          value: t.netRevenue       || 0, sub: 'Collected minus discounts' },
        ].map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Transaction status row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {isLoading ? [...Array(4)].map((_, i) => <Skel key={i} h={80} />) : [
          { label: 'Paid Transactions',    value: t.paidCount    || 0, color: T.green,  icon: CheckCircle2 },
          { label: 'Pending',              value: t.pendingCount || 0, color: '#FBBF24', icon: Clock },
          { label: 'Failed / Dropped',     value: t.failedCount  || 0, color: T.rose,   icon: XCircle },
          { label: 'Conversion Rate',      value: t.conversionRate || 0, color: T.blue, icon: Percent },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 16, height: 16, color }} />
            </div>
            <div>
              <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>
                {label.includes('Rate') ? `${value}%` : Number(value).toLocaleString('en-IN')}
              </div>
              <div style={{ fontFamily: ff, fontSize: 11, color: T.t3, marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: '0 0 4px' }}>Monthly Revenue Trend</h3>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.t2, margin: '0 0 16px' }}>Collected revenue and transaction count — last 12 months</p>
        {isLoading ? <Skel h={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data?.monthlyRevenue || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontFamily: ff, fontSize: 12, color: T.t2, paddingTop: 10 }} />
              <Area yAxisId="l" type="monotone" dataKey="revenue" name="Revenue" stroke={T.gold} strokeWidth={2.5} fill="url(#gRev)" dot={false} activeDot={{ r: 5 }} />
              <Line yAxisId="r" type="monotone" dataKey="txns" name="txns" stroke={T.blue} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row: Revenue by source + Status pie + Gateway pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        <SectionCard title="G. Revenue by Source" sub="Subscriptions, lead packages, featured" icon={DollarSign} color={T.gold}>
          {isLoading ? <Skel h={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.revenueBySource || []} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="revenue" nameKey="source">
                    {(data?.revenueBySource || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`]} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {(data?.revenueBySource || []).map((r: any, i: number) => (
                  <div key={r.source} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2 }}>{r.source}</span>
                      <span style={{ fontFamily: ff, fontSize: 10, color: T.t3 }}>({r.count})</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>₹{Number(r.revenue).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="D. Payment Status Breakdown" sub="Paid / pending / failed" icon={CheckCircle2} color={T.green}>
          {isLoading ? <Skel h={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.statusBreakdown || []} cx="50%" cy="50%" outerRadius={62} paddingAngle={2} dataKey="count" nameKey="name">
                    {(data?.statusBreakdown || []).map((s: any) => <Cell key={s.name} fill={STATUS_COLORS[s.name] || T.t3} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any, p: any) => [Number(v).toLocaleString(), p.payload.name]} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                {(data?.statusBreakdown || []).map((s: any) => (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.name] || T.t3 }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, textTransform: 'capitalize' }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{Number(s.count).toLocaleString()}</span>
                      <span style={{ fontFamily: ff, fontSize: 10, color: T.t3, marginLeft: 6 }}>₹{Number(s.amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="C. Gateway-wise Collection" sub="Revenue by payment gateway" icon={CreditCard} color={T.blue}>
          {isLoading ? <Skel h={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.gatewayBreakdown || []} cx="50%" cy="50%" outerRadius={62} paddingAngle={2} dataKey="collected" nameKey="name">
                    {(data?.gatewayBreakdown || []).map((g: any) => <Cell key={g.name} fill={PG_COLORS[g.name] || T.blue} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`]} contentStyle={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                {(data?.gatewayBreakdown || []).map((g: any) => (
                  <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PG_COLORS[g.name] || T.blue }} />
                      <span style={{ fontFamily: ff, fontSize: 12, color: T.t2 }}>{PG_LABELS[g.name] || g.name}</span>
                      <span style={{ fontFamily: ff, fontSize: 10, color: T.t3 }}>({g.txns})</span>
                    </div>
                    <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>₹{Number(g.collected).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* E. Gateway Breakdown Table — full PG stats */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard style={{ width: 15, height: 15, color: T.blue }} />
          </div>
          <div>
            <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>E. Payment Gateway Breakdown</h3>
            <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '1px 0 0' }}>PG name · initiated · paid · dropped · collected · conversion %</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Gateway', 'Initiated', 'Paid', 'Dropped', 'Pending', 'Collected', 'Conv %'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Gateway' ? 'left' : 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={7} style={{ padding: '12px 16px' }}><div style={{ height: 18, borderRadius: 4, background: T.border, animation: 'skel 1.4s ease-in-out infinite' }} /></td></tr>
              )) : (data?.gatewayStats || []).length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '30px 16px', textAlign: 'center', color: T.t3, fontFamily: ff }}>No gateway data available</td></tr>
              ) : (data?.gatewayStats || []).map((g: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${PG_COLORS[g.gateway] || T.blue}30`, border: `1px solid ${PG_COLORS[g.gateway] || T.blue}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard style={{ width: 12, height: 12, color: PG_COLORS[g.gateway] || T.blue }} />
                      </div>
                      <span style={{ fontWeight: 700, color: T.t1 }}>{PG_LABELS[g.gateway] || g.gateway}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: T.t2 }}>{Number(g.initiated).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: T.green, fontWeight: 700 }}>{Number(g.paid).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: T.rose }}>{Number(g.dropped).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#FBBF24' }}>{Number(g.pending).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>₹{Number(g.collected).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: g.convPct >= 70 ? `${T.green}18` : g.convPct >= 40 ? '#FBBF2418' : `${T.rose}18`, color: g.convPct >= 70 ? T.green : g.convPct >= 40 ? '#FBBF24' : T.rose, border: `1px solid ${g.convPct >= 70 ? T.green : g.convPct >= 40 ? '#FBBF24' : T.rose}25` }}>
                      {g.convPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* F. Coupon Breakdown + G. Plan Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag style={{ width: 15, height: 15, color: T.purple }} />
              </div>
              <div>
                <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>F. Discount Code Breakup</h3>
                <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '1px 0 0' }}>Coupon usage, discounts given, revenue collected</p>
              </div>
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Coupon Code', 'Uses', 'Discount', 'Collected'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: h === 'Coupon Code' ? 'left' : 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} style={{ padding: '10px 16px' }}><Skel h={16} /></td></tr>)
                : (data?.couponBreakdown || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: T.t3 }}>No coupon usage data</td></tr>
                ) : (data?.couponBreakdown || []).map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 5, background: `${T.purple}15`, color: T.purple, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700 }}>{c.code}</span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: T.t2 }}>{c.uses}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: T.rose, fontWeight: 600 }}>₹{Number(c.discount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: T.green, fontWeight: 700 }}>₹{Number(c.collected).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionCard title="G. Plan-wise Revenue" sub="Revenue per subscription plan" icon={TrendingUp} color={T.orange}>
          {isLoading ? <Skel h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.planBreakdown || []} margin={{ top: 5, right: 5, left: -15, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {(data?.planBreakdown || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Recent payments table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>Recent Transactions</h3>
          <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '2px 0 0' }}>Latest 20 subscription payments with full details</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['School', 'Plan', 'Gateway', 'Amount', 'Coupon', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} style={{ padding: '12px 14px' }}><div style={{ height: 18, borderRadius: 4, background: T.border, animation: 'skel 1.4s ease-in-out infinite' }} /></td></tr>)
              : (data?.recentPayments || []).map((p: any, i: number) => {
                const statusColor = STATUS_COLORS[p.status] || T.t3
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: T.t1, fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.school}</td>
                    <td style={{ padding: '10px 14px', color: T.t2 }}>{p.label || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 5, background: `${PG_COLORS[p.gateway] || T.blue}18`, color: PG_COLORS[p.gateway] || T.blue, fontSize: 10, fontWeight: 700 }}>
                        {PG_LABELS[p.gateway] || p.gateway}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', color: T.t3, fontFamily: 'JetBrains Mono,monospace', fontSize: 11 }}>{p.coupon || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 5, background: `${statusColor}15`, color: statusColor, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: T.t3, whiteSpace: 'nowrap' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
