'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Star, Zap, TrendingUp,
  ShoppingCart, Package, Settings, ChevronRight,
  BarChart3, GraduationCap, LogOut, Menu, X,
  ArrowUpRight, AlertCircle, CheckCircle2, Clock,
  Loader2, MapPin
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { Lead, LeadCredits, SchoolDashboardStats } from '@/types'
import toast from 'react-hot-toast'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/school' },
  { icon: Users,           label: 'Leads',          href: '/dashboard/school/leads' },
  { icon: FileText,        label: 'Applications',   href: '/dashboard/school/applications' },
  { icon: Star,            label: 'Reviews',        href: '/dashboard/school/reviews' },
  { icon: Package,         label: 'Lead Packages',  href: '/dashboard/school/packages' },
  { icon: BarChart3,       label: 'Analytics',      href: '/dashboard/school/analytics' },
  { icon: Settings,        label: 'School Profile', href: '/school/complete-profile' },
]

function Sidebar({ active, onClose, credits }: { active: string; onClose?: () => void; credits?: any }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  return (
    <aside style={{ width: 256, display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', borderRight: '1px solid rgba(13,17,23,0.08)' }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#E5B64A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
            <GraduationCap style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 15, color: '#0D1117', lineHeight: 1 }}>Thynk Schooling</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: '#B8860B', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>School Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X style={{ width: 16, height: 16, color: '#718096' }} /></button>}
      </div>
      <div style={{ margin: '12px 12px 4px', background: 'linear-gradient(135deg,#FEF7E0,#FAF7F2)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#E5B64A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 17, color: '#fff', flexShrink: 0 }}>
            {(user?.fullName || user?.phone || 'S')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'School Admin'}</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#B8860B', fontWeight: 600 }}>School Administrator</div>
          </div>
        </div>
        {credits && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(184,134,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#718096' }}>Lead Credits</span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, color: '#B8860B' }}>{credits.availableCredits}</span>
          </div>
        )}
      </div>
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = active === href
          return (
            <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 2, textDecoration: 'none', transition: 'all .15s', background: isActive ? 'linear-gradient(135deg,rgba(184,134,11,0.1),rgba(184,134,11,0.04))' : 'transparent', color: isActive ? '#B8860B' : '#4A5568', fontFamily: 'DM Sans,sans-serif', fontWeight: isActive ? 600 : 400, fontSize: 13, borderLeft: isActive ? '3px solid #B8860B' : '3px solid transparent' }}>
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight style={{ width: 13, height: 13, opacity: .5 }} />}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding: '10px', borderTop: '1px solid rgba(13,17,23,0.07)' }}>
        <button onClick={() => { logout(); router.replace('/login') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#E53E3E' }}>
          <LogOut style={{ width: 16, height: 16 }} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  const inner = (
    <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden', transition: 'all .2s', height: '100%' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}40)`, borderRadius: '14px 14px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        {href && <ArrowUpRight style={{ width: 14, height: 14, color: '#A0ADB8' }} />}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 34, color: '#0D1117', lineHeight: 1, letterSpacing: '-1px', marginBottom: 4 }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096' }}>{label}</div>
      {sub && <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color, fontWeight: 600, marginTop: 6 }}>{sub}</div>}
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>
  return inner
}

function LeadRow({ lead, onBuy, buying }: { lead: Lead; onBuy: (id: string) => void; buying: boolean }) {
  const statusColors: Record<string, string> = { new: '#16A34A', contacted: '#2563EB', interested: '#B8860B', lost: '#718096' }
  const color = statusColors[lead.status] || '#718096'
  return (
    <tr style={{ borderBottom: '1px solid rgba(13,17,23,0.05)' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117' }}>{lead.isPurchased ? lead.fullName : lead.maskedName}</div>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#718096', marginTop: 2 }}>{lead.childName} · Class {lead.classApplyingFor}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: lead.isPurchased ? '#0D1117' : '#718096' }}>{lead.isPurchased ? lead.fullPhone : lead.maskedPhone}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#4A5568' }}>
          <MapPin style={{ width: 12, height: 12, color: '#B8860B' }} />{lead.city}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: `${color}12`, border: `1px solid ${color}30`, fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 600, color }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />{lead.status}
        </span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        {lead.isPurchased ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#F0FDF4', border: '1px solid #BBF7D0', fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 600, color: '#16A34A' }}>
            <CheckCircle2 style={{ width: 11, height: 11 }} /> Unlocked
          </span>
        ) : (
          <button onClick={() => onBuy(lead.id)} disabled={buying} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#0D1117', border: 'none', color: '#FAF7F2', cursor: buying ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, opacity: buying ? .6 : 1 }}>
            {buying ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <ShoppingCart style={{ width: 12, height: 12 }} />}
            Buy Lead
          </button>
        )}
      </td>
    </tr>
  )
}

export function SchoolDashboardClient() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    if (user.role !== 'school_admin') {
      if (user.role === 'super_admin') router.replace('/admin')
      else router.replace('/dashboard/parent')
    }
  }, [mounted, accessToken, user, router])

  const enabled = !!accessToken && mounted
  const { data: stats, isLoading: statsLoading } = useQuery<SchoolDashboardStats>({ queryKey: ['school-dashboard-stats'], queryFn: () => fetch('/api/schools/me/dashboard-stats',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 2*60*1000 })
  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[]; total: number }>({ queryKey: ['school-leads',{limit:8}], queryFn: () => fetch('/api/leads?limit=8',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 60*1000 })
  const { data: credits } = useQuery<LeadCredits>({ queryKey: ['lead-credits'], queryFn: () => fetch('/api/lead-credits',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 60*1000 })
  const { data: analyticsData } = useQuery<{ date: string; leads: number; applications: number }[]>({ queryKey: ['school-analytics-30d'], queryFn: () => fetch('/api/schools/me/analytics?days=30',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 5*60*1000 })

  const [buyingId, setBuyingId] = useState<string | null>(null)
  const buyLeadMutation = useMutation({
    mutationFn: async (leadId: string) => { setBuyingId(leadId); return fetch(`/api/leads?id=${leadId}&action=purchase`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'}}).then(r=>r.json()) },
    onSuccess: () => { toast.success('Lead unlocked!'); queryClient.invalidateQueries({queryKey:['school-leads']}); queryClient.invalidateQueries({queryKey:['lead-credits']}); setBuyingId(null) },
    onError: () => { toast.error('Failed to purchase lead.'); setBuyingId(null) },
  })

  if (!mounted || !accessToken || !user || user.role !== 'school_admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#B8860B,#E5B64A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(184,134,11,0.3)' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096' }}>Loading…</div>
        </div>
      </div>
    )
  }

  const leads = leadsData?.data ?? []
  const STAT_CARDS = [
    { icon: Users,    label: 'Total Leads',      value: stats?.totalLeads ?? 0,       sub: `+${stats?.newLeadsToday ?? 0} today`, color: '#B8860B', href: '/dashboard/school/leads' },
    { icon: FileText, label: 'Applications',      value: stats?.totalApplications ?? 0, sub: undefined,                           color: '#2563EB', href: '/dashboard/school/applications' },
    { icon: Star,     label: 'Average Rating',    value: stats?.avgRating ? `${stats.avgRating.toFixed(1)}★` : '—', sub: undefined, color: '#16A34A', href: '/dashboard/school/reviews' },
    { icon: Zap,      label: 'Lead Credits',       value: credits?.availableCredits ?? 0, sub: 'Click to buy more',               color: '#7C3AED', href: '/dashboard/school/packages' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAF7F2', overflow: 'hidden', fontFamily: 'DM Sans,sans-serif' }}>
      <style>{`@media(min-width:1024px){.lg-only{display:flex!important}}@media(max-width:1023px){.mobile-btn{display:flex!important}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <div className="lg-only" style={{ display: 'none', flexDirection: 'column', flexShrink: 0 }}>
        <Sidebar active="/dashboard/school" credits={credits} />
      </div>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ width: 256, display: 'flex', flexDirection: 'column' }}>
            <Sidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} credits={credits} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 64, background: '#fff', borderBottom: '1px solid rgba(13,17,23,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: '1px solid rgba(13,17,23,0.12)', borderRadius: 8, padding: 7, cursor: 'pointer' }}>
              <Menu style={{ width: 16, height: 16, color: '#4A5568' }} />
            </button>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 22, color: '#0D1117', margin: 0, lineHeight: 1 }}>School Dashboard</h1>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', margin: 0, marginTop: 2 }}>Good to see you, {user.fullName?.split(' ')[0] || 'Admin'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {credits && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 9 }}>
                <Zap style={{ width: 14, height: 14, color: '#B8860B' }} />
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1117' }}>{credits.availableCredits}</span>
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#B8860B' }}>credits</span>
              </div>
            )}
            <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0D1117', borderRadius: 8, color: '#FAF7F2', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 500 }}>
              Buy Credits
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,28px)' }}>
          {stats && stats.profileCompleteness < 100 && (
            <div style={{ background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle style={{ width: 18, height: 18, color: '#B8860B', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117' }}>Profile {stats.profileCompleteness}% complete — finish to get 3× more leads</div>
                  <div style={{ width: 200, height: 4, background: 'rgba(184,134,11,0.15)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.profileCompleteness}%`, background: 'linear-gradient(90deg,#B8860B,#E5B64A)', borderRadius: 99 }} />
                  </div>
                </div>
              </div>
              <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#B8860B', borderRadius: 8, color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                Complete Profile <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 140, background: '#fff', border: '1px solid rgba(13,17,23,0.07)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />)
              : STAT_CARDS.map(card => <StatCard key={card.label} {...card} />)
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: 0 }}>Lead Activity</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', margin: '2px 0 0' }}>Last 30 days</p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#718096' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#B8860B', display: 'inline-block' }} /> Leads</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#718096' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#2563EB', display: 'inline-block' }} /> Applications</span>
                </div>
              </div>
              {(analyticsData ?? []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analyticsData ?? []} barSize={10} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,17,23,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#A0ADB8', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#A0ADB8', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(13,17,23,0.1)', borderRadius: 10, fontFamily: 'DM Sans', boxShadow: '0 4px 20px rgba(13,17,23,0.1)' }} />
                    <Bar dataKey="leads" name="Leads" fill="#B8860B" radius={[4,4,0,0]} />
                    <Bar dataKey="applications" name="Applications" fill="#2563EB" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <BarChart3 style={{ width: 36, height: 36, color: '#E2E8F0' }} />
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#A0ADB8', margin: 0 }}>No data yet — start receiving leads!</p>
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: '0 0 16px' }}>Lead Credits</h3>
              {credits ? (
                <>
                  <div style={{ textAlign: 'center', padding: '16px 0', background: 'linear-gradient(135deg,#FEF7E0,#FAF7F2)', borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 52, color: '#B8860B', lineHeight: 1 }}>{credits.availableCredits}</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', marginTop: 4 }}>credits available</div>
                    {credits.expiresAt && <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#A0ADB8', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Clock style={{ width: 11, height: 11 }} />Expires {new Date(credits.expiresAt).toLocaleDateString('en-IN')}</div>}
                  </div>
                  {[['Total Purchased', credits.totalCredits], ['Used', credits.usedCredits], ['Remaining', credits.availableCredits]].map(([l, v]) => (
                    <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans,sans-serif', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: '#718096' }}>{l}</span><span style={{ fontWeight: 600, color: '#0D1117' }}>{v}</span>
                    </div>
                  ))}
                  <Link href="/dashboard/school/packages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: '#0D1117', borderRadius: 8, color: '#FAF7F2', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 500, marginTop: 'auto' }}>Buy More Credits</Link>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                  <Package style={{ width: 36, height: 36, color: '#E2E8F0' }} />
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#A0ADB8', margin: 0 }}>No credits yet</p>
                  <Link href="/dashboard/school/packages" style={{ padding: '8px 18px', background: '#B8860B', borderRadius: 8, color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600 }}>Buy Lead Package</Link>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(13,17,23,0.07)' }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: 0 }}>Recent Leads</h3>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', margin: '2px 0 0' }}>{leadsData?.total ? `${leadsData.total} total leads` : 'Parents looking for schools like yours'}</p>
              </div>
              <Link href="/dashboard/school/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', textDecoration: 'none', fontWeight: 600 }}>
                View All <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
            {leadsLoading ? (
              <div style={{ padding: 20 }}>{Array.from({length:4}).map((_,i)=><div key={i} style={{ height:52, background:'rgba(13,17,23,0.04)', borderRadius:8, marginBottom:8, animation:'pulse 1.5s ease-in-out infinite' }} />)}</div>
            ) : leads.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <Users style={{ width: 36, height: 36, color: '#E2E8F0', margin: '0 auto 12px' }} />
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1117', marginBottom: 6 }}>No leads yet</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#718096' }}>Complete your school profile to start receiving leads.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
                      {['Parent / Child', 'Phone', 'City', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: h==='Action'?'right':'left', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'#A0ADB8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => <LeadRow key={lead.id} lead={lead} onBuy={id => buyLeadMutation.mutate(id)} buying={buyingId === lead.id} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
