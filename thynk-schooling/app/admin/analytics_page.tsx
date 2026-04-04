'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import { Users, TrendingUp, Phone, MapPin } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const C = {
  card: 'var(--admin-card-bg,#0D1420)', border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1: 'rgba(255,255,255,0.95)', t2: 'rgba(255,255,255,0.75)', t3: 'rgba(255,255,255,0.5)',
  amber: '#F59E0B', teal: '#14B8A6', violet: '#8B5CF6', sky: '#38BDF8', emerald: '#10B981',
}
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }
const FUNNEL_COLORS = [C.sky, C.violet, C.teal, C.emerald]

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111927', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: 'DM Sans,sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}>
      {label && <div style={{ color: C.t2, marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: C.t2 }}>{p.name}:</span>
          <span style={{ color: C.t1, fontWeight: 700 }}>{p.name === 'revenue' ? `₹${Number(p.value).toLocaleString('en-IN')}` : Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function SH({ title, sub }: { title: string; sub: string }) {
  return <div style={{ marginBottom: 16 }}><h3 style={{ margin: 0, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: C.t1 }}>{title}</h3><p style={{ margin: '4px 0 0', fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: C.t2 }}>{sub}</p></div>
}

function Skel({ h = 40 }: { h?: number }) {
  return <div style={{ height: h, background: 'rgba(255,255,255,0.04)', borderRadius: 8, animation: 'as 1.4s ease-in-out infinite' }} />
}

function StatPill({ icon: Icon, label, value, color }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: C.t2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [leadsTab, setLeadsTab] = useState<'leads'|'revenue'>('leads')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin?action=analytics', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 3 * 60 * 1000,
  })

  const daily: any[]   = data?.dailyLeads30 || []
  const cities: any[]  = data?.topCities    || []
  const boards: any[]  = data?.boardData    || []
  const funnel: any[]  = data?.funnelData   || []
  const signups: any[] = data?.signups      || []
  const funnelMax = funnel[0]?.value || 1

  const totalLeads30   = daily.reduce((s: number, d: any) => s + (d.leads || 0), 0)
  const totalRev30     = daily.reduce((s: number, d: any) => s + (d.revenue || 0), 0)
  const totalSignups30 = signups.reduce((s: number, d: any) => s + Number(d.count || 0), 0)

  return (
    <AdminLayout pageClass="admin-page-analytics" title="Analytics" subtitle="Real platform data — last 30 days">
      <style>{`@keyframes as{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <StatPill icon={TrendingUp} label="Leads (30d)"    value={isLoading ? '…' : totalLeads30.toLocaleString()}                          color={C.amber}   />
        <StatPill icon={Users}      label="Signups (30d)"  value={isLoading ? '…' : totalSignups30.toLocaleString()}                         color={C.sky}     />
        <StatPill icon={Phone}      label="Revenue (30d)"  value={isLoading ? '…' : `₹${totalRev30.toLocaleString('en-IN')}`}               color={C.teal}    />
        <StatPill icon={MapPin}     label="Active Cities"  value={isLoading ? '…' : cities.length}                                           color={C.violet}  />
      </div>

      {/* Daily area chart */}
      <div style={{ ...card, padding: '22px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <SH title="Daily Activity" sub="Leads & revenue over last 30 days" />
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {(['leads','revenue'] as const).map(t => (
              <button key={t} onClick={() => setLeadsTab(t)}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: leadsTab === t ? 700 : 500, background: leadsTab === t ? C.amber : 'transparent', color: leadsTab === t ? '#000' : C.t2, transition: 'all .15s', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? <Skel h={220} /> : daily.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No data yet — leads will appear here once recorded</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={leadsTab === 'leads' ? C.amber : C.teal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={leadsTab === 'leads' ? C.amber : C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.t3, fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey={leadsTab} stroke={leadsTab === 'leads' ? C.amber : C.teal} strokeWidth={2.5} fill="url(#gA)" dot={false} activeDot={{ r: 5, fill: leadsTab === 'leads' ? C.amber : C.teal, stroke: C.card, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Signups + Cities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="New User Signups" sub="Daily registrations — last 30 days" />
          {isLoading ? <Skel h={200} /> : signups.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No signups yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={signups.map((r: any) => ({ day: String(r.day).slice(5), count: Number(r.count) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: C.t3, fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="count" name="signups" stroke={C.sky} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: C.sky, stroke: C.card, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Top Cities by Leads" sub="Geographic lead distribution" />
          {isLoading ? <Skel h={200} /> : cities.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No city data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cities} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: C.t3, fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: C.t2, fontSize: 12, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="leads" name="leads" fill={C.violet} radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Board pie + Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Schools by Board" sub="Curriculum breakdown" />
          {isLoading ? <Skel h={200} /> : boards.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No board data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={boards} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                    {boards.map((e: any, i: number) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
                {boards.map((b: any) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                    <span style={{ fontSize: 12, color: C.t2, fontFamily: 'DM Sans,sans-serif' }}>{b.name}</span>
                    <span style={{ fontSize: 12, color: C.t1, fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...card, padding: '22px 24px' }}>
          <SH title="Conversion Funnel" sub="Platform-wide user journey" />
          {isLoading ? <Skel h={200} /> : funnel.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No funnel data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              {funnel.map((f: any, i: number) => {
                const pct = Math.max(4, Math.round((f.value / funnelMax) * 100))
                const color = FUNNEL_COLORS[i] || C.t2
                return (
                  <div key={f.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: C.t1, fontWeight: 600 }}>{f.name}</span>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color, fontWeight: 700 }}>{Number(f.value).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
