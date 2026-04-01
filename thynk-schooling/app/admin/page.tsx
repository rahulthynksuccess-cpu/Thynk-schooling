'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { School, Users, TrendingUp, DollarSign, FileCheck, Star, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'

/* ── Shared card style ── */
const C: React.CSSProperties = {
  background: 'var(--admin-card-bg,#111820)',
  border: '1px solid var(--admin-border,rgba(255,255,255,0.07))',
  borderRadius: '16px', padding: '20px',
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, sub, color, delay, href }: {
  icon: any; label: string; value: string | number; sub?: string
  color: string; delay: number; href: string
}) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:.5, ease:[.22,1,.36,1] }}>
      <Link href={href} style={{ ...C, display:'block', textDecoration:'none', transition:'all .22s', cursor:'pointer' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${color}40`; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 32px ${color}15` }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
          <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon style={{ width:'19px', height:'19px', color }} />
          </div>
          <ArrowRight style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'32px', color:'#fff', lineHeight:1, letterSpacing:'-1px', marginBottom:'4px' }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color, marginTop:'6px', fontWeight:600 }}>{sub}</div>}
      </Link>
    </motion.div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetch('/api/admin/overview',{cache:'no-store'}).then(r=>r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const STATS = [
    { icon: School,     label: 'Total Schools',    value: data?.totalSchools   || 0, sub: `${data?.pendingVerification||0} pending verification`, color:'#B8860B', href:'/admin/schools'      },
    { icon: Users,      label: 'Registered Users', value: data?.totalUsers     || 0, sub: 'Parents & school admins',                              color:'#0A5F55', href:'/admin/users'         },
    { icon: TrendingUp, label: 'Total Leads',       value: data?.totalLeads     || 0, sub: `+${data?.leadsToday||0} today`,                       color:'#12A090', href:'/admin/leads'         },
    { icon: DollarSign, label: 'Total Revenue',     value: `₹${((data?.totalRevenue||0)/100).toLocaleString('en-IN')}`, sub: 'All time',          color:'#C9922A', href:'/admin/payments'      },
    { icon: FileCheck,  label: 'Applications',      value: data?.totalApps      || 0, sub: `${data?.pendingApps||0} pending`,                     color:'#E5B64A', href:'/admin/applications'  },
    { icon: Star,       label: 'Reviews',           value: data?.totalReviews   || 0, sub: `${data?.pendingReviews||0} to moderate`,               color:'#7A6A52', href:'/admin/reviews'       },
  ]

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back — here's what's happening today">

      {/* Stat grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'22px' }}>
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * .07} />
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'14px', marginBottom:'22px' }}>

        {/* Recent schools pending verification */}
        <div style={C}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff' }}>Pending Verification</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.3)', marginTop:'2px' }}>Schools awaiting review</div>
            </div>
            <Link href="/admin/schools?isVerified=false" style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', background:'rgba(184,134,11,.1)', border:'1px solid rgba(184,134,11,.2)', color:'#B8860B', fontSize:'11px', fontWeight:600, fontFamily:'DM Sans,sans-serif', textDecoration:'none' }}>
              View All <ArrowRight style={{ width:'11px', height:'11px' }} />
            </Link>
          </div>
          {isLoading
            ? Array.from({length:4}).map((_,i) => <div key={i} style={{ height:'52px', background:'rgba(255,255,255,.04)', borderRadius:'10px', marginBottom:'8px' }} />)
            : (data?.pendingSchools || []).length === 0
              ? <div style={{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>
                  <CheckCircle style={{ width:'28px', height:'28px', margin:'0 auto 8px', opacity:.3 }} />
                  All schools verified
                </div>
              : (data?.pendingSchools || []).map((s: any) => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 14px', borderRadius:'10px', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)', marginBottom:'7px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(184,134,11,.1)', border:'1px solid rgba(184,134,11,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <School style={{ width:'16px', height:'16px', color:'#B8860B' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'13px', fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                      <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.35)' }}>{s.city} · {s.ownerPhone}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'100px', background:'rgba(251,191,36,.1)', color:'#FBBF24', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>Pending</span>
                  </div>
                ))
          }
        </div>

        {/* Recent users */}
        <div style={C}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff' }}>Recent Signups</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.3)', marginTop:'2px' }}>Latest registrations</div>
            </div>
            <Link href="/admin/users" style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', background:'rgba(10,95,85,.1)', border:'1px solid rgba(10,95,85,.2)', color:'#12A090', fontSize:'11px', fontWeight:600, fontFamily:'DM Sans,sans-serif', textDecoration:'none' }}>
              All <ArrowRight style={{ width:'11px', height:'11px' }} />
            </Link>
          </div>
          {isLoading
            ? Array.from({length:5}).map((_,i) => <div key={i} style={{ height:'44px', background:'rgba(255,255,255,.04)', borderRadius:'10px', marginBottom:'6px' }} />)
            : (data?.recentUsers || []).length === 0
              ? <div style={{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>No signups yet</div>
              : (data?.recentUsers || []).map((u: any, i: number) => {
                  const colors = ['#B8860B','#0A5F55','#C9922A','#12A090','#7A6A52']
                  const c = colors[i % colors.length]
                  return (
                    <div key={u.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${c}18`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'13px', color:c, flexShrink:0 }}>
                        {(u.fullName || u.phone || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'12px', fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.fullName || u.phone}</div>
                        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.3)' }}>{u.role === 'school_admin' ? 'School Admin' : 'Parent'}</div>
                      </div>
                    </div>
                  )
                })
          }
        </div>
      </div>

      {/* Recent leads */}
      <div style={C}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff' }}>Recent Leads</div>
            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.3)', marginTop:'2px' }}>Latest parent enquiries</div>
          </div>
          <Link href="/admin/leads" style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', background:'rgba(18,160,144,.1)', border:'1px solid rgba(18,160,144,.2)', color:'#12A090', fontSize:'11px', fontWeight:600, fontFamily:'DM Sans,sans-serif', textDecoration:'none' }}>
            View All <ArrowRight style={{ width:'11px', height:'11px' }} />
          </Link>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['School','Parent','Class','Price','Status','Date'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', fontFamily:'DM Sans,sans-serif', borderBottom:'1px solid rgba(255,255,255,.05)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({length:5}).map((_,i) => (
                    <tr key={i}><td colSpan={6} style={{ padding:'8px 12px' }}>
                      <div style={{ height:'32px', background:'rgba(255,255,255,.04)', borderRadius:'7px' }} />
                    </td></tr>
                  ))
                : (data?.recentLeads || []).length === 0
                  ? <tr><td colSpan={6} style={{ padding:'28px', textAlign:'center', color:'rgba(255,255,255,.25)', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>No leads yet</td></tr>
                  : (data?.recentLeads || []).map((l: any) => (
                      <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'11px 12px', fontFamily:'DM Sans,sans-serif', fontSize:'12px', fontWeight:600, color:'#fff' }}>{l.schoolName}</td>
                        <td style={{ padding:'11px 12px', fontFamily:'DM Sans,sans-serif', fontSize:'12px', color:'rgba(255,255,255,.5)' }}>{l.isPurchased ? l.parentName : `${(l.parentName||'P')[0]}***`}</td>
                        <td style={{ padding:'11px 12px', fontFamily:'DM Sans,sans-serif', fontSize:'12px', color:'rgba(255,255,255,.4)' }}>Class {l.classApplied}</td>
                        <td style={{ padding:'11px 12px', fontFamily:'Syne,sans-serif', fontSize:'12px', fontWeight:700, color:'#4ADE80' }}>₹{((l.price||0)/100).toLocaleString('en-IN')}</td>
                        <td style={{ padding:'11px 12px' }}>
                          <span style={{ fontSize:'10px', fontWeight:600, padding:'3px 8px', borderRadius:'100px', fontFamily:'DM Sans,sans-serif', background: l.isPurchased ? 'rgba(74,222,128,.1)' : 'rgba(251,191,36,.1)', color: l.isPurchased ? '#4ADE80' : '#FBBF24' }}>
                            {l.isPurchased ? 'Purchased' : 'New'}
                          </span>
                        </td>
                        <td style={{ padding:'11px 12px', fontFamily:'DM Sans,sans-serif', fontSize:'11px', color:'rgba(255,255,255,.3)', whiteSpace:'nowrap' }}>
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}
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
