'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import Link from 'next/link'
import {
  School, Users, TrendingUp, DollarSign, FileCheck,
  Star, ArrowUpRight, Clock, CheckCircle2, AlertCircle,
  Activity, Zap
} from 'lucide-react'

const GOLD = '#B8860B'
const card: React.CSSProperties = {
  background: 'var(--admin-card-bg, #0F1623)',
  border: '1px solid var(--admin-border, rgba(255,255,255,0.08))',
  borderRadius: 16, padding: '22px 24px',
}

function KPICard({ icon: Icon, label, value, sub, color, href, trend }: any) {
  return (
    <Link href={href} style={{ ...card, display: 'block', textDecoration: 'none', position: 'relative', overflow: 'hidden', transition: 'all .2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}18` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
      {/* top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 20, height: 20, color }} />
        </div>
        <ArrowUpRight style={{ width: 14, height: 14, color: 'var(--admin-text-faint, rgba(255,255,255,0.2))' }} />
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 34, color: 'var(--admin-text, rgba(255,255,255,0.95))', lineHeight: 1, letterSpacing: '-1px', marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--admin-text-muted, rgba(255,255,255,0.4))', fontWeight: 500, marginBottom: sub ? 8 : 0 }}>{label}</div>
      {sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color, fontWeight: 600 }}>{sub}</div>}
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetch('/api/admin/overview', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const KPIS = [
    { icon: School,     label: 'Total Schools',    value: (data?.totalSchools || 0).toLocaleString('en-IN'),   sub: `${data?.pendingVerification || 0} pending`,    color: GOLD,      href: '/admin/schools' },
    { icon: Users,      label: 'Registered Users', value: (data?.totalUsers || 0).toLocaleString('en-IN'),     sub: 'Parents & admins',                              color: '#60A5FA', href: '/admin/users' },
    { icon: TrendingUp, label: 'Total Leads',       value: (data?.totalLeads || 0).toLocaleString('en-IN'),     sub: `+${data?.leadsToday || 0} today`,               color: '#34D399', href: '/admin/leads' },
    { icon: DollarSign, label: 'Revenue',           value: `₹${((data?.totalRevenue || 0) / 100).toLocaleString('en-IN')}`, sub: 'All time',                          color: '#F59E0B', href: '/admin/payments' },
    { icon: FileCheck,  label: 'Applications',      value: (data?.totalApps || 0).toLocaleString('en-IN'),      sub: `${data?.pendingApps || 0} pending`,             color: '#A78BFA', href: '/admin/applications' },
    { icon: Star,       label: 'Reviews',           value: (data?.totalReviews || 0).toLocaleString('en-IN'),   sub: `${data?.pendingReviews || 0} to moderate`,      color: '#FB923C', href: '/admin/reviews' },
  ]

  const skel = (h = 48) => <div style={{ height: h, background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />

  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview — live data">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {KPIS.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Pending verification */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--admin-text,rgba(255,255,255,0.95))' }}>Pending Verification</div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', marginTop: 3 }}>Schools awaiting review</div>
            </div>
            <Link href="/admin/schools?isVerified=false" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: `${GOLD}15`, border: `1px solid ${GOLD}25`, color: GOLD, fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
              View All <ArrowUpRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          {isLoading ? [1,2,3,4].map(i => <div key={i}>{skel(52)}</div>) :
           (data?.pendingSchools || []).length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--admin-text-faint,rgba(255,255,255,0.25))', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>
                <CheckCircle2 style={{ width: 32, height: 32, margin: '0 auto 10px', opacity: .25 }} />
                All schools verified
              </div>
            : (data?.pendingSchools || []).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 7, transition: 'all .15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${GOLD}15`, border: `1px solid ${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <School style={{ width: 16, height: 16, color: GOLD }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.35))' }}>{s.city} · {s.ownerPhone}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', color: '#FBBF24', fontFamily: 'DM Sans,sans-serif', border: '1px solid rgba(251,191,36,0.2)', flexShrink: 0 }}>Pending</span>
                </div>
              ))
          }
        </div>

        {/* Recent signups */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--admin-text,rgba(255,255,255,0.95))' }}>Recent Signups</div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', marginTop: 3 }}>Latest registrations</div>
            </div>
            <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60A5FA', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
              All Users <ArrowUpRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          {isLoading ? [1,2,3,4,5].map(i => <div key={i}>{skel(42)}</div>) :
           (data?.recentUsers || []).length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--admin-text-faint,rgba(255,255,255,0.25))', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No signups yet</div>
            : (data?.recentUsers || []).map((u: any, i: number) => {
                const colors = [GOLD, '#60A5FA', '#34D399', '#F59E0B', '#A78BFA']
                const c = colors[i % colors.length]
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 13, color: c, flexShrink: 0 }}>
                      {(u.fullName || u.phone || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName || u.phone}</div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))' }}>{u.role === 'school_admin' ? 'School Admin' : 'Parent'}</div>
                    </div>
                    <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: u.role === 'school_admin' ? `${GOLD}15` : 'rgba(96,165,250,0.1)', color: u.role === 'school_admin' ? GOLD : '#60A5FA', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, border: `1px solid ${u.role === 'school_admin' ? GOLD : '#60A5FA'}25` }}>
                      {u.role === 'school_admin' ? 'School' : 'Parent'}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Recent leads table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.08))' }}>
          <div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--admin-text,rgba(255,255,255,0.95))' }}>Recent Leads</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', marginTop: 3 }}>Latest parent enquiries</div>
          </div>
          <Link href="/admin/leads" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
            View All <ArrowUpRight style={{ width: 11, height: 11 }} />
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['School', 'Parent', 'Class', 'Price', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.06))', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} style={{ padding: '10px 16px' }}><div style={{ height: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 7 }} /></td></tr>)
                : (data?.recentLeads || []).length === 0
                  ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-faint,rgba(255,255,255,0.25))', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No leads yet</td></tr>
                  : (data?.recentLeads || []).map((l: any) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{l.schoolName}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--admin-text-muted,rgba(255,255,255,0.5))' }}>{l.isPurchased ? l.parentName : `${(l.parentName || 'P')[0]}***`}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--admin-text-faint,rgba(255,255,255,0.4))' }}>Class {l.classApplied}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, color: '#34D399' }}>₹{((l.price || 0) / 100).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, fontFamily: 'DM Sans,sans-serif', background: l.isPurchased ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', color: l.isPurchased ? '#34D399' : '#FBBF24', border: `1px solid ${l.isPurchased ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}` }}>
                            {l.isPurchased ? '● Purchased' : '○ New'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', whiteSpace: 'nowrap' }}>
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
