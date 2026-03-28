'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiGet } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  School, Users, DollarSign, Package, TrendingUp,
  ArrowRight, Settings, CheckCircle, Clock, XCircle
} from 'lucide-react'

interface OverviewStats {
  totalSchools: number
  pendingVerification: number
  totalParents: number
  totalLeads: number
  leadsToday: number
  totalRevenue: number
  activePackages: number
  recentSignups: { name: string; role: string; time: string }[]
  recentLeads: { school: string; parent: string; class: string; time: string }[]
}

const card = (bg = '#111830') => ({
  background: bg,
  border: '1px solid #1E2A52',
  borderRadius: '14px',
  padding: '20px',
} as React.CSSProperties)

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ['admin-overview'],
    queryFn: () => apiGet('/admin/overview'),
    staleTime: 2 * 60 * 1000,
  })

  const STAT_CARDS = [
    { icon: School,     label: 'Total Schools',       value: stats?.totalSchools ?? 0,       sub: `${stats?.pendingVerification ?? 0} pending verification`, color: '#FF5C00', bg: 'rgba(255,92,0,0.1)' },
    { icon: Users,      label: 'Registered Parents',  value: stats?.totalParents ?? 0,       sub: 'Active accounts',                                         color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    { icon: TrendingUp, label: 'Total Leads',          value: stats?.totalLeads ?? 0,         sub: `+${stats?.leadsToday ?? 0} today`,                        color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    { icon: DollarSign, label: 'Total Revenue',        value: `₹${((stats?.totalRevenue ?? 0)/100).toLocaleString('en-IN')}`, sub: 'All time', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  ]

  const QUICK_LINKS = [
    { icon: Settings,   label: 'Manage Dropdowns',  sub: 'Add cities, boards, classes',    href: '/admin/settings',     color: '#FF5C00' },
    { icon: DollarSign, label: 'Lead Pricing',       sub: 'Set platform default price',     href: '/admin/lead-pricing', color: '#60A5FA' },
    { icon: Package,    label: 'Lead Packages',      sub: 'Create & manage credit packs',   href: '/admin/packages',     color: '#4ADE80' },
    { icon: School,     label: 'Verify Schools',     sub: `${stats?.pendingVerification ?? 0} awaiting review`,         href: '/admin/schools',      color: '#FBBF24' },
  ]

  return (
    <AdminLayout title="Admin Overview" subtitle="Platform health at a glance">
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
        {STAT_CARDS.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.08 }}
              style={card()}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon style={{ width:'20px', height:'20px', color:s.color }} />
                </div>
              </div>
              {isLoading
                ? <div style={{ height:'32px', background:'#1E2A52', borderRadius:'8px', marginBottom:'6px', animation:'pulse 1.5s infinite' }} />
                : <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'32px', color:'#fff', marginBottom:'4px', lineHeight:1 }}>{s.value.toLocaleString()}</div>
              }
              <div style={{ fontSize:'12px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{s.label}</div>
              <div style={{ fontSize:'11px', color:s.color, marginTop:'4px', fontFamily:'DM Sans,sans-serif' }}>{s.sub}</div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
        {/* Quick actions */}
        <div style={card()}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff', marginBottom:'16px' }}>Quick Actions</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {QUICK_LINKS.map(q => {
              const Icon = q.icon
              return (
                <Link key={q.href} href={q.href} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderRadius:'10px', background:'rgba(255,255,255,0.03)', border:'1px solid #1E2A52', textDecoration:'none', transition:'all .18s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = q.color + '40'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1E2A52'}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:`${q.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon style={{ width:'17px', height:'17px', color:q.color }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{q.label}</div>
                    <div style={{ fontSize:'11px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{q.sub}</div>
                  </div>
                  <ArrowRight style={{ width:'14px', height:'14px', color:'#8892B0' }} />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div style={card()}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff', marginBottom:'16px' }}>Recent Signups</h3>
          {isLoading
            ? Array.from({ length:5 }).map((_,i) => (
                <div key={i} style={{ height:'44px', background:'#1E2A52', borderRadius:'8px', marginBottom:'8px' }} />
              ))
            : (stats?.recentSignups ?? []).length === 0
              ? <p style={{ fontSize:'13px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>No signups yet.</p>
              : (stats?.recentSignups ?? []).map((u, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom:'1px solid #1E2A52' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,92,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#FF5C00', flexShrink:0, fontFamily:'Syne,sans-serif' }}>
                      {u.name[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{u.name}</div>
                      <div style={{ fontSize:'11px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{u.role}</div>
                    </div>
                    <div style={{ fontSize:'11px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{u.time}</div>
                  </div>
                ))
          }
        </div>
      </div>

      {/* Recent leads */}
      <div style={card()}>
        <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff', marginBottom:'16px' }}>Recent Leads</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['School', 'Parent', 'Class', 'Time', 'Status'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'#8892B0', fontFamily:'DM Sans,sans-serif', borderBottom:'1px solid #1E2A52' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length:5 }).map((_,i) => (
                    <tr key={i}><td colSpan={5} style={{ padding:'10px 12px' }}>
                      <div style={{ height:'32px', background:'#1E2A52', borderRadius:'8px' }} />
                    </td></tr>
                  ))
                : (stats?.recentLeads ?? []).length === 0
                  ? <tr><td colSpan={5} style={{ padding:'24px 12px', textAlign:'center', color:'#8892B0', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>No leads yet.</td></tr>
                  : (stats?.recentLeads ?? []).map((l, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #1E2A52' }}>
                        <td style={{ padding:'11px 12px', fontSize:'13px', fontWeight:500, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{l.school}</td>
                        <td style={{ padding:'11px 12px', fontSize:'13px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{l.parent}</td>
                        <td style={{ padding:'11px 12px', fontSize:'13px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>Class {l.class}</td>
                        <td style={{ padding:'11px 12px', fontSize:'12px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>{l.time}</td>
                        <td style={{ padding:'11px 12px' }}>
                          <span style={{ fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:'rgba(74,222,128,0.12)', color:'#4ADE80', fontFamily:'DM Sans,sans-serif' }}>New</span>
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
