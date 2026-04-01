'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Heart, Calendar,
  Bell, Settings, LogOut, GraduationCap, Menu, X,
  Plus, ArrowRight, ChevronRight, Sparkles, Star, MapPin,
  BookOpen, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Student, Application, School } from '@/types'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/parent' },
  { icon: Users,           label: 'My Children',   href: '/dashboard/parent/children' },
  { icon: FileText,        label: 'Applications',  href: '/dashboard/parent/applications' },
  { icon: Heart,           label: 'Saved Schools', href: '/dashboard/parent/saved' },
  { icon: Sparkles,        label: 'AI Matches',    href: '/dashboard/parent/recommendations' },
  { icon: Calendar,        label: 'Counselling',   href: '/dashboard/parent/sessions' },
  { icon: Bell,            label: 'Notifications', href: '/dashboard/parent/notifications' },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
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
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: '#B8860B', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>Parent Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X style={{ width: 16, height: 16, color: '#718096' }} /></button>}
      </div>

      <div style={{ margin: '12px 12px 4px', background: 'linear-gradient(135deg,#EFF6FF,#F0F9FF)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 17, color: '#fff', flexShrink: 0 }}>
            {(user?.fullName || user?.phone || 'P')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'Parent'}</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Parent Account</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 2, textDecoration: 'none', color: '#4A5568', fontFamily: 'DM Sans,sans-serif', fontWeight: 400, fontSize: 13 }}>
            <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid rgba(13,17,23,0.07)' }}>
        <button onClick={() => { logout(); router.replace('/login') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#E53E3E' }}>
          <LogOut style={{ width: 16, height: 16 }} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    submitted:    ['#2563EB', '#EFF6FF'],
    under_review: ['#B8860B', '#FEF7E0'],
    shortlisted:  ['#16A34A', '#F0FDF4'],
    admitted:     ['#16A34A', '#F0FDF4'],
    rejected:     ['#718096', '#F7FAFC'],
    waitlisted:   ['#7C3AED', '#F5F3FF'],
  }
  const [color, bg] = map[status] || ['#718096', '#F7FAFC']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: bg, fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 600, color }}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function ParentDashboardClient() {
  const { user, accessToken } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    if (user.role === 'school_admin') router.replace('/dashboard/school')
    else if (user.role === 'super_admin') router.replace('/admin')
  }, [mounted, accessToken, user, router])

  const enabled = !!accessToken && mounted
  const { data: children, isLoading: childrenLoading } = useQuery<Student[]>({ queryKey: ['parent-children'], queryFn: () => fetch('/api/students',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 5*60*1000 })
  const { data: applications, isLoading: appsLoading } = useQuery<{ data: Application[] }>({ queryKey: ['parent-applications'], queryFn: () => fetch('/api/applications?limit=5',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 2*60*1000 })
  const { data: savedSchools } = useQuery<{ data: School[] }>({ queryKey: ['parent-saved-schools'], queryFn: () => fetch('/api/saved-schools?limit=4',{cache:'no-store',credentials:'include'}).then(r=>r.json()), enabled, staleTime: 5*60*1000 })
  const { data: recommendations } = useQuery<{ data: School[] }>({ queryKey: ['parent-recommendations'], queryFn: () => fetch('/api/recommendations?limit=4',{cache:'no-store'}).then(r=>r.json()), enabled, staleTime: 10*60*1000 })

  if (!mounted || !accessToken || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096' }}>Loading…</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const apps = applications?.data ?? []
  const saved = savedSchools?.data ?? []
  const recs  = recommendations?.data ?? []

  const STATS = [
    { label: 'My Children',   value: children?.length ?? 0,  icon: Users,    color: '#2563EB', bg: '#EFF6FF',  href: '/dashboard/parent/children' },
    { label: 'Applications',  value: apps.length,             icon: FileText, color: '#B8860B', bg: '#FEF7E0',  href: '/dashboard/parent/applications' },
    { label: 'Saved Schools', value: saved.length,            icon: Heart,    color: '#DB2777', bg: '#FDF2F8',  href: '/dashboard/parent/saved' },
    { label: 'AI Matches',    value: recs.length,             icon: Sparkles, color: '#7C3AED', bg: '#F5F3FF',  href: '/dashboard/parent/recommendations' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAF7F2', overflow: 'hidden', fontFamily: 'DM Sans,sans-serif' }}>
      <style>{`@media(min-width:1024px){.lg-only{display:flex!important}}@media(max-width:1023px){.mobile-btn{display:flex!important}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <div className="lg-only" style={{ display: 'none', flexDirection: 'column', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ width: 256, display: 'flex', flexDirection: 'column' }}><Sidebar onClose={() => setSidebarOpen(false)} /></div>
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
              <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 22, color: '#0D1117', margin: 0, lineHeight: 1 }}>
                Welcome back{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
              </h1>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', margin: 0, marginTop: 2 }}>Your admission journey at a glance</p>
            </div>
          </div>
          <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0D1117', borderRadius: 8, color: '#FAF7F2', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 500 }}>
            Find Schools <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            {STATS.map(s => {
              const Icon = s.icon
              return (
                <Link key={s.label} href={s.href} style={{ textDecoration: 'none', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden', transition: 'all .2s', display: 'block' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${s.color},${s.color}40)`, borderRadius: '14px 14px 0 0' }} />
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon style={{ width: 18, height: 18, color: s.color }} />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 30, color: '#0D1117', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096' }}>{s.label}</div>
                </Link>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0,1fr)', gap: 16 }}>
            {/* Children */}
            <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: 0 }}>My Children</h3>
                <Link href="/dashboard/parent/children/add" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#B8860B', textDecoration: 'none', fontWeight: 600 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add
                </Link>
              </div>
              {childrenLoading ? (
                <div>{Array.from({length:2}).map((_,i)=><div key={i} style={{ height:56, background:'rgba(13,17,23,0.04)', borderRadius:10, marginBottom:8, animation:'pulse 1.5s ease-in-out infinite' }} />)}</div>
              ) : !children?.length ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Users style={{ width: 32, height: 32, color: '#E2E8F0', margin: '0 auto 10px' }} />
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#A0ADB8', margin: '0 0 12px' }}>No children added yet</p>
                  <Link href="/dashboard/parent/children/add" style={{ display: 'inline-block', padding: '7px 14px', background: '#0D1117', borderRadius: 8, color: '#FAF7F2', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 12 }}>Add Child Profile</Link>
                </div>
              ) : children?.map(child => (
                <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#FAF7F2', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0 }}>
                    {child.fullName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.fullName}</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#718096' }}>Class {child.applyingForClass} · {child.academicYear}</div>
                  </div>
                  <Link href={`/schools?classFrom=${child.applyingForClass}`} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#B8860B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    Find <ChevronRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
              ))}
            </div>

            {/* Applications */}
            <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: 0 }}>My Applications</h3>
                <Link href="/dashboard/parent/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', textDecoration: 'none', fontWeight: 600 }}>
                  View All <ChevronRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
              {appsLoading ? (
                <div>{Array.from({length:3}).map((_,i)=><div key={i} style={{ height:60, background:'rgba(13,17,23,0.04)', borderRadius:10, marginBottom:8, animation:'pulse 1.5s ease-in-out infinite' }} />)}</div>
              ) : apps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <FileText style={{ width: 36, height: 36, color: '#E2E8F0', margin: '0 auto 10px' }} />
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#A0ADB8', margin: '0 0 12px' }}>No applications yet</p>
                  <Link href="/schools" style={{ display: 'inline-block', padding: '7px 14px', background: '#0D1117', borderRadius: 8, color: '#FAF7F2', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 12 }}>Find Schools & Apply</Link>
                </div>
              ) : apps.map(app => (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#FAF7F2', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {app.schoolLogo ? <img src={app.schoolLogo} alt={app.schoolName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <GraduationCap style={{ width: 18, height: 18, color: '#A0ADB8' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.schoolName}</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#718096' }}>{app.studentName} · {app.academicYear}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 18, color: '#0D1117', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles style={{ width: 18, height: 18, color: '#B8860B' }} /> AI School Recommendations
                </h3>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', margin: '4px 0 0' }}>Personalised matches based on your child's profile</p>
              </div>
              <Link href="/dashboard/parent/recommendations" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
            {recs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <Sparkles style={{ width: 36, height: 36, color: '#E2E8F0', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#A0ADB8', margin: '0 0 12px' }}>Add a child profile to get AI recommendations</p>
                <Link href="/dashboard/parent/children/add" style={{ display: 'inline-block', padding: '7px 14px', background: '#B8860B', borderRadius: 8, color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600 }}>Add Child Profile</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                {recs.map((school, i) => (
                  <Link key={school.id} href={`/schools/${school.slug}`} style={{ textDecoration: 'none', background: '#FAF7F2', border: '1px solid rgba(13,17,23,0.07)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {school.logoUrl ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} /> : <GraduationCap style={{ width: 16, height: 16, color: '#A0ADB8' }} />}
                      </div>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 12, color: '#B8860B' }}>{98 - i*3}% match</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{school.name}</div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#718096', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 11, height: 11 }} />{school.city}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ background: 'linear-gradient(135deg,#FEF7E0,#FAF7F2)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 20, color: '#0D1117', margin: 0 }}>Need Help Choosing the Right School?</h3>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#718096', margin: '6px 0 0' }}>Book a free 1-on-1 session with an expert education counsellor.</p>
            </div>
            <Link href="/counselling" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#B8860B', borderRadius: 9, color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Book Free Session <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
