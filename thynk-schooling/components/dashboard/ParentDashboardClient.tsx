'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Heart, Calendar,
  Bell, Settings, LogOut, GraduationCap, Menu, X,
  Plus, ArrowRight, ChevronRight, Sparkles, Star, MapPin, BookOpen
} from 'lucide-react'
import { clsx } from 'clsx'
import { apiGet } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Student, Application, School } from '@/types'
import { useState } from 'react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/parent' },
  { icon: Users,           label: 'My Children',   href: '/dashboard/parent/children' },
  { icon: FileText,        label: 'Applications',  href: '/dashboard/parent/applications' },
  { icon: Heart,           label: 'Saved Schools', href: '/dashboard/parent/saved' },
  { icon: Sparkles,        label: 'AI Matches',    href: '/dashboard/parent/recommendations' },
  { icon: Calendar,        label: 'Counselling',   href: '/dashboard/parent/sessions' },
  { icon: Bell,            label: 'Notifications', href: '/dashboard/parent/notifications' },
]

function ParentSidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  return (
    <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col h-full">
      <div className="p-5 border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">ThynkSchooling</span>
        </Link>
        {onClose && <button onClick={onClose}><X className="w-4 h-4 text-navy-400" /></button>}
      </div>
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-display font-bold text-blue-400">
            {(user?.fullName || user?.phone || 'P')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">{user?.fullName || 'Parent'}</div>
            <div className="text-navy-400 text-xs">{user?.phone}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-sm text-navy-300 hover:text-white hover:bg-surface-hover transition-all">
            <Icon className="w-4 h-4 flex-shrink-0" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-surface-border">
        <button onClick={useAuthStore.getState().logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-display font-semibold text-sm transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted:    'badge-blue',
    under_review: 'badge-orange',
    shortlisted:  'badge-green',
    admitted:     'badge-green',
    rejected:     'badge-gray',
    waitlisted:   'badge-purple',
  }
  return <span className={clsx('badge text-[10px]', map[status] || 'badge-gray')}>{status.replace('_', ' ')}</span>
}

export function ParentDashboardClient() {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: children, isLoading: childrenLoading } = useQuery<Student[]>({
    queryKey: ['parent-children'],
    queryFn:  () => apiGet('/students'),
    staleTime: 5 * 60 * 1000,
  })

  const { data: applications, isLoading: appsLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['parent-applications'],
    queryFn:  () => apiGet('/applications?limit=5'),
    staleTime: 2 * 60 * 1000,
  })

  const { data: savedSchools } = useQuery<{ data: School[] }>({
    queryKey: ['parent-saved-schools'],
    queryFn:  () => apiGet('/saved-schools?limit=4'),
    staleTime: 5 * 60 * 1000,
  })

  const { data: recommendations } = useQuery<{ data: School[] }>({
    queryKey: ['parent-recommendations'],
    queryFn:  () => apiGet('/recommendations?limit=4'),
    staleTime: 10 * 60 * 1000,
  })

  const apps = applications?.data ?? []
  const saved = savedSchools?.data ?? []
  const recs  = recommendations?.data ?? []

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <div className="hidden lg:flex flex-col">
        <ParentSidebar />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 flex flex-col"><ParentSidebar onClose={() => setSidebarOpen(false)} /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-navy-300" /></button>
            <div>
              <h1 className="font-display font-bold text-white text-lg">
                Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-navy-400 text-xs">Your admission journey at a glance</p>
            </div>
          </div>
          <Link href="/schools" className="btn-primary text-xs px-4 py-2">
            Find Schools <ArrowRight className="w-3 h-3" />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'My Children',   value: children?.length ?? 0,  icon: Users,    color: 'bg-blue-500' },
              { label: 'Applications',  value: apps.length,             icon: FileText, color: 'bg-orange-500' },
              { label: 'Saved Schools', value: saved.length,            icon: Heart,    color: 'bg-pink-500' },
              { label: 'AI Matches',    value: recs.length,             icon: Sparkles, color: 'bg-purple-500' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="stat-card">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Children */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white text-base">My Children</h3>
                <Link href="/dashboard/parent/children/add" className="flex items-center gap-1.5 text-orange-400 text-xs font-display font-semibold hover:text-orange-300">
                  <Plus className="w-3.5 h-3.5" /> Add Child
                </Link>
              </div>
              {childrenLoading ? (
                <div className="space-y-3">{Array.from({length:2}).map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
              ) : children?.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-navy-600 mx-auto mb-2" />
                  <p className="text-navy-400 text-sm mb-3">No children added yet</p>
                  <Link href="/dashboard/parent/children/add" className="btn-primary text-xs">Add Child Profile</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {children?.map(child => (
                    <div key={child.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-800 border border-surface-border">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-display font-bold text-blue-400 text-sm">
                        {child.fullName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-white text-sm">{child.fullName}</div>
                        <div className="text-navy-400 text-xs">Class {child.applyingForClass} · {child.academicYear}</div>
                      </div>
                      <Link href={`/schools?classFrom=${child.applyingForClass}`} className="text-orange-400 text-xs font-display font-semibold flex items-center gap-1 hover:text-orange-300">
                        Find <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applications */}
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white text-base">My Applications</h3>
                <Link href="/dashboard/parent/applications" className="text-orange-400 text-xs font-display font-semibold hover:text-orange-300">
                  View All <ChevronRight className="w-4 h-4 inline" />
                </Link>
              </div>
              {appsLoading ? (
                <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
              ) : apps.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-navy-600 mx-auto mb-3" />
                  <p className="text-navy-400 text-sm mb-3">No applications yet</p>
                  <Link href="/schools" className="btn-primary text-xs">Find Schools & Apply</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {apps.map(app => (
                    <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl bg-navy-800 border border-surface-border">
                      <div className="w-10 h-10 rounded-xl bg-navy-700 overflow-hidden flex-shrink-0">
                        {app.schoolLogo
                          ? <img src={app.schoolLogo} alt={app.schoolName} className="w-full h-full object-contain p-1" />
                          : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-5 h-5 text-navy-500" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-white text-sm truncate">{app.schoolName}</div>
                        <div className="text-navy-400 text-xs">{app.studentName} · {app.academicYear}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <AppStatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" /> AI School Recommendations
                </h3>
                <p className="text-navy-400 text-xs mt-0.5">Based on your child's profile and preferences</p>
              </div>
              <Link href="/dashboard/parent/recommendations" className="text-orange-400 text-xs font-display font-semibold hover:text-orange-300">
                View All <ChevronRight className="w-4 h-4 inline" />
              </Link>
            </div>
            {recs.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-navy-600 mx-auto mb-3" />
                <p className="text-navy-400 text-sm mb-3">Complete your child's profile to get AI recommendations</p>
                <Link href="/dashboard/parent/children/add" className="btn-primary text-xs">Add Child Profile</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recs.map((school, i) => (
                  <Link key={school.id} href={`/schools/${school.slug}`} className="card-hover p-4 flex flex-col gap-3 block">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-navy-800 overflow-hidden">
                        {school.logoUrl
                          ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-1" />
                          : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-5 h-5 text-navy-600" /></div>
                        }
                      </div>
                      <span className="font-display font-bold text-orange-400 text-sm">{98 - i*3}% match</span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-sm leading-tight line-clamp-2">{school.name}</h4>
                      <div className="flex items-center gap-1 text-navy-400 text-xs mt-1"><MapPin className="w-3 h-3" />{school.city}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {school.board.slice(0,1).map(b=><span key={b} className="badge-orange text-[10px]">{b}</span>)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA: Free Counselling */}
          <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #151D52 0%, #0F1640 100%)', border: '1px solid rgba(255,92,0,0.2)' }}
          >
            <div>
              <h3 className="font-display font-bold text-white text-lg mb-1">Need Help Choosing Schools?</h3>
              <p className="text-navy-300 text-sm">Book a free 1-on-1 session with an expert education counsellor.</p>
            </div>
            <Link href="/counselling" className="btn-primary flex-shrink-0">
              Book Free Session <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
