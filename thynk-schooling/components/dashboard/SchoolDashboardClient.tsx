'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Star, Zap, TrendingUp,
  MapPin, Phone, Eye, EyeOff, ShoppingCart, Package, Bell,
  Settings, ChevronRight, BarChart3, GraduationCap, LogOut,
  BadgeCheck, Menu, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { clsx } from 'clsx'
import { apiGet, apiPost } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Lead, LeadCredits, SchoolDashboardStats, Application } from '@/types'
import toast from 'react-hot-toast'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard/school' },
  { icon: Users,           label: 'Leads',         href: '/dashboard/school/leads' },
  { icon: FileText,        label: 'Applications',  href: '/dashboard/school/applications' },
  { icon: Star,            label: 'Reviews',       href: '/dashboard/school/reviews' },
  { icon: Package,         label: 'Lead Packages', href: '/dashboard/school/packages' },
  { icon: BarChart3,       label: 'Analytics',     href: '/dashboard/school/analytics' },
  { icon: Settings,        label: 'School Profile',href: '/school/complete-profile' },
]

function DashSidebar({ active, onClose }: { active: string; onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  return (
    <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">ThynkSchooling</span>
        </Link>
        {onClose && <button onClick={onClose}><X className="w-4 h-4 text-navy-400" /></button>}
      </div>

      {/* User */}
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center font-display font-bold text-orange-400">
            {(user?.fullName || user?.phone || 'S')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-white text-sm truncate">{user?.fullName || 'School Admin'}</div>
            <div className="text-navy-400 text-xs">{user?.phone}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-sm transition-all',
              active === href
                ? 'bg-orange-500 text-white shadow-orange-sm'
                : 'text-navy-300 hover:text-white hover:bg-surface-hover'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-display font-semibold text-sm transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )
}

function StatCard({ icon: Icon, label, value, change, color }: {
  icon: React.ElementType; label: string; value: string | number; change?: string; color: string
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && <div className="stat-change-up mt-1">{change}</div>}
    </div>
  )
}

function LeadRow({ lead, onBuy }: { lead: Lead; onBuy: (id: string) => void }) {
  const [revealed, setRevealed] = useState(lead.isPurchased)

  return (
    <tr className="border-b border-surface-border hover:bg-surface-hover/50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-display font-semibold text-white text-sm">{revealed ? lead.fullName : lead.maskedName}</div>
        <div className="text-navy-400 text-xs">{lead.childName} · Class {lead.classApplyingFor}</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-mono text-sm text-white">{revealed ? lead.fullPhone : lead.maskedPhone}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-navy-300 text-sm">{lead.city}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-navy-400 text-xs">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</span>
      </td>
      <td className="px-4 py-3">
        <span className={clsx('badge text-[10px]',
          lead.status === 'new'         ? 'badge-green'  :
          lead.status === 'contacted'   ? 'badge-blue'   :
          lead.status === 'interested'  ? 'badge-orange' : 'badge-gray'
        )}>{lead.status}</span>
      </td>
      <td className="px-4 py-3">
        {lead.isPurchased ? (
          <span className="badge-green text-[10px]">✓ Unlocked</span>
        ) : (
          <button
            onClick={() => onBuy(lead.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-display font-semibold hover:bg-orange-400 transition-colors"
          >
            <ShoppingCart className="w-3 h-3" /> Buy Lead
          </button>
        )}
      </td>
    </tr>
  )
}

export function SchoolDashboardClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: stats,   isLoading: statsLoading   } = useQuery<SchoolDashboardStats>({
    queryKey: ['school-dashboard-stats'],
    queryFn:  () => apiGet('/schools/me/dashboard-stats'),
    staleTime: 2 * 60 * 1000,
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[]; total: number }>({
    queryKey: ['school-leads', { limit: 10 }],
    queryFn:  () => apiGet('/leads?limit=10'),
    staleTime: 1 * 60 * 1000,
  })

  const { data: credits } = useQuery<LeadCredits>({
    queryKey: ['lead-credits'],
    queryFn:  () => apiGet('/lead-credits'),
    staleTime: 1 * 60 * 1000,
  })

  const { data: analyticsData } = useQuery<{ date: string; leads: number; applications: number }[]>({
    queryKey: ['school-analytics-30d'],
    queryFn:  () => apiGet('/schools/me/analytics?days=30'),
    staleTime: 5 * 60 * 1000,
  })

  const buyLeadMutation = useMutation({
    mutationFn: (leadId: string) => apiPost(`/leads/${leadId}/purchase`),
    onSuccess: () => {
      toast.success('Lead unlocked! Full details are now visible.')
      queryClient.invalidateQueries({ queryKey: ['school-leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-credits'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to purchase lead.')
    },
  })

  const leads = leadsData?.data ?? []
  const chartData = analyticsData ?? []

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col">
        <DashSidebar active="/dashboard/school" />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 flex flex-col"><DashSidebar active="/dashboard/school" onClose={() => setSidebarOpen(false)} /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-navy-300" />
            </button>
            <div>
              <h1 className="font-display font-bold text-white text-lg">School Dashboard</h1>
              <p className="text-navy-400 text-xs">Overview of your school's performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {credits && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 card rounded-xl">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="font-display font-bold text-white text-sm">{credits.availableCredits}</span>
                <span className="text-navy-400 text-xs">credits</span>
              </div>
            )}
            <Link href="/dashboard/school/packages" className="btn-primary text-xs px-4 py-2">
              Buy Credits
            </Link>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
            ) : (
              <>
                <StatCard icon={Users}    label="Total Leads"      value={stats?.totalLeads ?? 0}      change={`+${stats?.newLeadsToday ?? 0} today`} color="bg-orange-500" />
                <StatCard icon={FileText} label="Applications"     value={stats?.totalApplications ?? 0}                                               color="bg-blue-500" />
                <StatCard icon={Star}     label="Avg Rating"       value={`${stats?.avgRating?.toFixed(1) ?? '—'}★`}                                   color="bg-yellow-500" />
                <StatCard icon={Zap}      label="Lead Credits Left" value={credits?.availableCredits ?? 0}                                              color="bg-green-500" />
              </>
            )}
          </div>

          {/* Profile completeness */}
          {stats && stats.profileCompleteness < 100 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-white text-sm">Complete Your School Profile</h3>
                  <p className="text-navy-400 text-xs mt-0.5">A complete profile gets 3x more leads</p>
                </div>
                <span className="font-display font-bold text-orange-400 text-lg">{stats.profileCompleteness}%</span>
              </div>
              <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.profileCompleteness}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                />
              </div>
              <Link href="/school/complete-profile" className="btn-outline text-xs mt-3 inline-flex">
                Complete Profile <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Analytics Chart */}
            <div className="xl:col-span-2 card p-5">
              <h3 className="font-display font-bold text-white text-base mb-5">Lead Activity — Last 30 Days</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A52" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#6B7FCC', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7FCC', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '12px', fontFamily: 'DM Sans' }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Bar dataKey="leads"        name="Leads"        fill="#FF5C00" radius={[4,4,0,0]} />
                    <Bar dataKey="applications" name="Applications" fill="#3D52B0" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 text-navy-600 mx-auto mb-2" />
                    <p className="text-navy-400 text-sm">No data yet. Start getting leads!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Credit wallet */}
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="font-display font-bold text-white text-base">Lead Credits</h3>
              {credits ? (
                <>
                  <div className="text-center py-4">
                    <div className="font-display font-bold text-5xl text-orange-400">{credits.availableCredits}</div>
                    <div className="text-navy-400 text-sm mt-1">credits available</div>
                    {credits.expiresAt && (
                      <div className="text-navy-500 text-xs mt-1">Expires: {new Date(credits.expiresAt).toLocaleDateString('en-IN')}</div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Total Purchased</span>
                      <span className="text-white font-semibold">{credits.totalCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Used</span>
                      <span className="text-white font-semibold">{credits.usedCredits}</span>
                    </div>
                  </div>
                  <Link href="/dashboard/school/packages" className="btn-primary w-full justify-center text-sm">
                    Buy More Credits
                  </Link>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                  <Package className="w-10 h-10 text-navy-600" />
                  <p className="text-navy-400 text-sm">No credits yet</p>
                  <Link href="/dashboard/school/packages" className="btn-primary text-sm">Buy Lead Package</Link>
                </div>
              )}
            </div>
          </div>

          {/* Leads Table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h3 className="font-display font-bold text-white text-base">Recent Leads</h3>
              <Link href="/dashboard/school/leads" className="text-orange-400 text-sm font-display font-semibold hover:text-orange-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {leadsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : leads.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-navy-600 mx-auto mb-3" />
                <h4 className="font-display font-bold text-white text-sm mb-1">No leads yet</h4>
                <p className="text-navy-400 text-xs">Complete your profile to start receiving leads from parents.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border">
                      {['Parent / Child', 'Phone', 'City', 'Date', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-navy-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <LeadRow key={lead.id} lead={lead} onBuy={id => buyLeadMutation.mutate(id)} />
                    ))}
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
