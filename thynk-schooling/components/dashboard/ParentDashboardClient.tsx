'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  LayoutDashboard, Users, FileText, Heart, Calendar,
  Bell, LogOut, GraduationCap, Menu, X, Plus, ArrowRight,
  ChevronRight, Sparkles, Star, MapPin, BookOpen, Loader2,
  TrendingUp, CheckCircle2, Clock, AlertCircle, Search
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Student, Application, School } from '@/types'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

/* ── palette ── */
const C = {
  bg:     '#FAF7F2',
  card:   '#FFFFFF',
  bdr:    'rgba(13,17,23,0.09)',
  ink:    '#0D1117',
  muted:  '#718096',
  faint:  '#A0ADB8',
  gold:   '#B8860B',
  goldBg: '#FEF7E0',
  serif:  "'Cormorant Garamond',Georgia,serif",
  sans:   "'Inter',system-ui,sans-serif",
}

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/parent' },
  { icon: Users,           label: 'My Children',   href: '/dashboard/parent/children' },
  { icon: FileText,        label: 'Applications',  href: '/dashboard/parent/applications' },
  { icon: Heart,           label: 'Saved Schools', href: '/dashboard/parent/saved' },
  { icon: Sparkles,        label: 'AI Matches',    href: '/dashboard/parent/recommendations' },
  { icon: Calendar,        label: 'Counselling',   href: '/dashboard/parent/sessions' },
  { icon: Bell,            label: 'Notifications', href: '/dashboard/parent/notifications' },
]

/* ── sidebar ── */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <aside style={{ width: 248, display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg,#0D1117 0%,#131B2A 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* logo */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(184,134,11,0.3)' }}>
            <GraduationCap style={{ width: 17, height: 17, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 14, color: '#FAF7F2', lineHeight: 1 }}>Thynk Schooling</div>
            <div style={{ fontFamily: C.sans, fontSize: 9.5, color: C.gold, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>Parent Portal</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(250,247,242,0.4)' }}><X style={{ width: 15, height: 15 }} /></button>}
      </div>

      {/* user card */}
      <div style={{ margin: '12px 12px 4px', background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontWeight: 700, fontSize: 17, color: '#fff', flexShrink: 0 }}>
            {(user?.fullName || user?.phone || 'P')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: '#FAF7F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'Parent'}</div>
            <div style={{ fontFamily: C.sans, fontSize: 10.5, color: C.gold, fontWeight: 600 }}>Parent Account</div>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav style={{ flex: 1, padding: '6px 8px', overflowY: 'auto' }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== '/dashboard/parent' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 2, textDecoration: 'none', fontFamily: C.sans, fontSize: 13, fontWeight: active ? 600 : 400, background: active ? 'rgba(184,134,11,0.15)' : 'transparent', color: active ? '#E8C547' : 'rgba(250,247,242,0.5)', transition: 'all .2s', borderLeft: active ? '3px solid #B8860B' : '3px solid transparent' }}>
              <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* sign out */}
      <div style={{ padding: '8px 8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/schools" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 4, textDecoration: 'none', fontFamily: C.sans, fontSize: 13, color: 'rgba(250,247,242,0.45)', background: 'transparent', transition: 'all .15s' }}>
          <Search style={{ width: 15, height: 15 }} /> Find Schools
        </Link>
        <button onClick={() => { logout(); router.replace('/login') }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.sans, fontSize: 13, color: 'rgba(239,68,68,0.7)' }}>
          <LogOut style={{ width: 15, height: 15 }} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

/* ── layout wrapper ── */
function DashLayout({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg,#FAF7F2 0%,#F0EAD6 100%)', overflow: 'hidden', fontFamily: C.sans }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,rgba(13,17,23,0.04) 25%,rgba(13,17,23,0.08) 50%,rgba(13,17,23,0.04) 75%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:8px}
        .dash-sidebar{display:flex;flex-direction:column;flex-shrink:0}
        .dash-mobile-btn{display:none}
        @media(max-width:1023px){.dash-sidebar{display:none!important}.dash-mobile-btn{display:flex!important}}
      `}</style>

      <div className="dash-sidebar"><Sidebar /></div>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 64, background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(184,134,11,0.12)', flexShrink: 0, boxShadow: '0 1px 20px rgba(13,17,23,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="dash-mobile-btn" onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 7, cursor: 'pointer', alignItems: 'center' }}>
              <Menu style={{ width: 16, height: 16, color: C.muted }} />
            </button>
            <div>
              <h1 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, margin: 0, lineHeight: 1.2, letterSpacing: '-0.5px' }}>{title}</h1>
              {subtitle && <p style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, margin: '2px 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,2.5vw,28px)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

/* ── stat card ── */
function StatCard({ icon: Icon, label, value, color, bg, href, loading }: any) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -5, boxShadow: `0 20px 60px rgba(13,17,23,0.12), 0 0 0 1px ${color}30` }}
        style={{ background: 'linear-gradient(135deg,#fff 0%,#FDFAF5 100%)', border: `1px solid ${color}18`, borderRadius: 16, padding: '22px 22px', position: 'relative', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(13,17,23,0.06)', transition: 'border-color .3s' }}>
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: '16px 16px 0 0' }} />
        {/* Corner glow */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />
        {/* Shimmer */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.6) 50%,transparent 70%)', backgroundSize: '200%', animation: 'shimmerBg 5s ease-in-out infinite', pointerEvents: 'none', opacity: 0.5 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}25`, boxShadow: `0 4px 12px ${color}20` }}>
            <Icon style={{ width: 18, height: 18, color }} />
          </div>
          <ChevronRight style={{ width: 14, height: 14, color: C.faint }} />
        </div>
        {loading
          ? <div className="skel" style={{ height: 36, width: '60%', marginBottom: 6 }} />
          : <div style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 38, color: C.ink, lineHeight: 1, marginBottom: 4, letterSpacing: '-1px' }}>{value}</div>}
        <div style={{ fontFamily: C.sans, fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</div>
      </motion.div>
    </Link>
  )
}

/* ── status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:      ['#B8860B', '#FEF7E0'],
    submitted:    ['#2563EB', '#EFF6FF'],
    under_review: ['#B8860B', '#FEF7E0'],
    shortlisted:  ['#16A34A', '#F0FDF4'],
    admitted:     ['#16A34A', '#F0FDF4'],
    rejected:     ['#E53E3E', '#FFF5F5'],
    waitlisted:   ['#7C3AED', '#F5F3FF'],
  }
  const [color, bg] = map[status] || ['#718096', '#F7FAFC']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: bg, fontFamily: C.sans, fontSize: 11, fontWeight: 600, color, textTransform: 'capitalize' }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════ */
export function ParentDashboardClient() {
  const { user, accessToken } = useAuthStore()
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
  const { data: children, isLoading: loadKids }  = useQuery<any[]>({ queryKey: ['students'], queryFn: () => fetch('/api/students',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled, staleTime: 5*60*1000 })
  const { data: appsRaw,  isLoading: loadApps }  = useQuery<any[]>({ queryKey: ['applications'], queryFn: () => fetch('/api/applications?limit=5',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled, staleTime: 2*60*1000 })
  const { data: savedRaw }  = useQuery<any[]>({ queryKey: ['saved-schools'], queryFn: () => fetch('/api/saved-schools?limit=4',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled, staleTime: 5*60*1000 })
  const { data: recsRaw }   = useQuery<any[]>({ queryKey: ['recommendations'], queryFn: () => fetch('/api/recommendations?limit=6',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled, staleTime: 10*60*1000 })

  if (!mounted || !accessToken || !user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: C.gold, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const kids  = Array.isArray(children) ? children : []
  const apps  = Array.isArray(appsRaw)  ? appsRaw  : (appsRaw as any)?.data ?? []
  const saved = Array.isArray(savedRaw) ? savedRaw : (savedRaw as any)?.data ?? []
  const recs  = Array.isArray(recsRaw)  ? recsRaw  : (recsRaw as any)?.data ?? []

  const firstName = user.fullName?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <DashLayout
      title={`${greeting}, ${firstName}! 👋`}
      subtitle="Your school admission journey at a glance"
      action={
        <Link href="/schools"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: C.ink, borderRadius: 10, color: '#FAF7F2', textDecoration: 'none', fontFamily: C.sans, fontSize: 13, fontWeight: 500, transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.gold}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.ink}>
          Find Schools <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      }
    >
      {/* profile completion banner */}
      {!user.profileCompleted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderRadius: 14, background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', border: '1px solid rgba(180,83,9,0.18)', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 14, color: '#92400E' }}>Complete your profile for personalised matches 🎯</div>
            <div style={{ fontFamily: C.sans, fontSize: 12, color: '#B45309', marginTop: 2 }}>Takes 2 minutes · Better recommendations for your child</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/parent/complete-profile" style={{ padding: '8px 16px', borderRadius: 9, background: '#B45309', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: C.sans }}>Complete Profile</Link>
          </div>
        </motion.div>
      )}

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Users}    label="My Children"   value={kids.length}   color="#B8860B" bg="#FEF7E0" href="/dashboard/parent/children"       loading={loadKids} />
        <StatCard icon={FileText} label="Applications"  value={apps.length}   color="#2563EB" bg="#EFF6FF" href="/dashboard/parent/applications"    loading={loadApps} />
        <StatCard icon={Heart}    label="Saved Schools" value={saved.length}  color="#DB2777" bg="#FDF2F8" href="/dashboard/parent/saved"           loading={false} />
        <StatCard icon={Sparkles} label="AI Matches"    value={recs.length}   color="#7C3AED" bg="#F5F3FF" href="/dashboard/parent/recommendations"  loading={false} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18, marginBottom: 18 }}>
        {/* children card */}
        <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 19, color: C.ink, margin: 0 }}>My Children</h3>
            <Link href="/dashboard/parent/children/add"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 8, textDecoration: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.gold }}>
              <Plus style={{ width: 12, height: 12 }} /> Add Child
            </Link>
          </div>
          {loadKids ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2].map(i => <div key={i} className="skel" style={{ height: 58 }} />)}
            </div>
          ) : kids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F7FAFC', border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Users style={{ width: 22, height: 22, color: C.faint }} />
              </div>
              <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, margin: '0 0 14px' }}>No children added yet</p>
              <Link href="/dashboard/parent/children/add"
                style={{ display: 'inline-block', padding: '8px 18px', background: C.ink, borderRadius: 9, color: '#FAF7F2', textDecoration: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 500 }}>
                Add Your First Child
              </Link>
            </div>
          ) : kids.map((child: any) => (
            <motion.div key={child.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, borderRadius: 12, marginBottom: 8, border: `1px solid ${C.bdr}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                {(child.full_name || child.fullName || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: '#FAF7F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {child.full_name || child.fullName}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 2 }}>
                  {[
                    child.applyingForClass || child.applying_for_class || child.currentClass || child.current_class || child.classLevel || child.class_level,
                    child.academicYear || child.academic_year || child.boardPreference || child.board_preference
                  ].filter(Boolean).join(' · ') || 'Profile added'}
                </div>
              </div>
              <Link href={`/schools`}
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: C.sans, fontSize: 11, fontWeight: 600, color: C.gold, textDecoration: 'none', padding: '4px 8px', background: C.goldBg, borderRadius: 6 }}>
                Find Schools <ChevronRight style={{ width: 11, height: 11 }} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* applications */}
        <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 19, color: C.ink, margin: 0 }}>Applications</h3>
            <Link href="/dashboard/parent/applications"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: C.sans, fontSize: 13, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
              View All <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          {loadApps ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skel" style={{ height: 58 }} />)}
            </div>
          ) : apps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F7FAFC', border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileText style={{ width: 22, height: 22, color: C.faint }} />
              </div>
              <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, margin: '0 0 14px' }}>No applications yet</p>
              <Link href="/schools"
                style={{ display: 'inline-block', padding: '8px 18px', background: C.ink, borderRadius: 9, color: '#FAF7F2', textDecoration: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 500 }}>
                Browse Schools
              </Link>
            </div>
          ) : apps.map((app: any) => (
            <motion.div key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: C.bg, borderRadius: 12, marginBottom: 8, border: `1px solid ${C.bdr}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.card, border: `1px solid ${C.bdr}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {app.school_logo || app.schoolLogo
                  ? <img src={app.school_logo || app.schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                  : <GraduationCap style={{ width: 18, height: 18, color: C.faint }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: '#FAF7F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.school_name || app.schoolName}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 2 }}>
                  {new Date(app.created_at || app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                </div>
              </div>
              <StatusBadge status={app.status || 'submitted'} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', marginBottom: 18, boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 19, color: C.ink, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles style={{ width: 17, height: 17, color: C.gold }} /> AI School Matches
            </h3>
            <p style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, margin: '4px 0 0' }}>Personalised recommendations based on your child's profile</p>
          </div>
          <Link href="/dashboard/parent/recommendations"
            style={{ fontFamily: C.sans, fontSize: 13, color: C.gold, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ChevronRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        {recs.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: C.bg, borderRadius: 12, border: `1px dashed rgba(184,134,11,0.3)` }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles style={{ width: 22, height: 22, color: C.gold }} />
            </div>
            <div>
              <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 3 }}>Add a child profile to unlock AI recommendations</div>
              <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint }}>We'll match schools based on class, location, board preference and budget</div>
            </div>
            <Link href="/dashboard/parent/children/add"
              style={{ marginLeft: 'auto', flexShrink: 0, padding: '8px 16px', background: C.gold, borderRadius: 9, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 600 }}>
              Add Child
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 12 }}>
            {recs.map((school: any, i: number) => (
              <Link key={school.id} href={`/schools/${school.slug}`}
                style={{ textDecoration: 'none', background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,134,11,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.bdr; (e.currentTarget as HTMLElement).style.transform = '' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: C.card, border: `1px solid ${C.bdr}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {school.logo_url || school.logoUrl ? <img src={school.logo_url || school.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} /> : <GraduationCap style={{ width: 15, height: 15, color: C.faint }} />}
                  </div>
                  <span style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 12, color: C.gold }}>{98 - i * 4}% match</span>
                </div>
                <div>
                  <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: C.ink, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{school.name}</div>
                  <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin style={{ width: 10, height: 10 }} />{school.city}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* counselling CTA */}
      <div style={{ background: 'linear-gradient(135deg,#FEF7E0 0%,#FAF7F2 60%)', border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 16, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
        <div>
          <div style={{ fontFamily: C.sans, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Free Expert Guidance</div>
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, margin: '0 0 6px' }}>Confused about which school to choose?</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.muted, margin: 0 }}>Book a free 1-on-1 session with a certified education counsellor.</p>
        </div>
        <Link href="/dashboard/parent/sessions"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: C.gold, borderRadius: 10, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontSize: 13, fontWeight: 600, flexShrink: 0, boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
          Book Free Session <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: MY CHILDREN
═══════════════════════════════════════ */
export function ChildrenPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  const enabled = !!accessToken && mounted
  const { data, isLoading, refetch } = useQuery<any[]>({ queryKey: ['students'], queryFn: () => fetch('/api/students',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled })
  const kids = Array.isArray(data) ? data : []
  if (!mounted) return null
  return (
    <DashLayout title="My Children" subtitle="Manage your children's profiles"
      action={<Link href="/dashboard/parent/children/add" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: C.ink, borderRadius: 10, color: '#FAF7F2', textDecoration: 'none', fontFamily: C.sans, fontSize: 13, fontWeight: 500 }}><Plus style={{ width: 14, height: 14 }} />Add Child</Link>}>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skel" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : kids.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: '#F7FAFC', border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users style={{ width: 28, height: 28, color: C.faint }} />
          </div>
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 8 }}>No children added yet</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, marginBottom: 20 }}>Add your child's profile to get personalised school matches</p>
          <Link href="/dashboard/parent/children/add" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: C.gold, borderRadius: 10, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontWeight: 600 }}>
            <Plus style={{ width: 15, height: 15 }} /> Add Child Profile
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {kids.map((child: any) => (
            <motion.div key={child.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: '#fff' }}>
                  {(child.full_name || child.fullName || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 15, color: C.ink }}>{child.full_name || child.fullName}</div>
                  <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, marginTop: 2 }}>Added {new Date(child.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                { l: 'Applying For', v: child.applyingForClass || child.applying_for_class || child.currentClass || child.current_class || child.classLevel || child.class_level },
                { l: 'Academic Year', v: child.academicYear || child.academic_year },
                { l: 'Gender', v: child.gender },
                { l: 'Board', v: child.boardPreference || child.board_preference },
              ].map(f => f.v && (
                  <div key={f.l} style={{ padding: '8px 12px', background: C.bg, borderRadius: 9, border: `1px solid ${C.bdr}` }}>
                    <div style={{ fontFamily: C.sans, fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em' }}>{f.l}</div>
                    <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 2 }}>{f.v}</div>
                  </div>
                ))}
              </div>
              <Link href="/schools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 9, textDecoration: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.gold }}>
                Find Schools for {(child.full_name || child.fullName || '').split(' ')[0]} <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: ADD CHILD
═══════════════════════════════════════ */
export function AddChildPageClient() {
  const { accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', classLevel: '', boardPreference: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const { data: boards } = useQuery<any[]>({ queryKey: ['dd-board'], queryFn: () => fetch('/api/settings/dropdown?category=board').then(r=>r.json()).then(d=>d.options||[]), staleTime: 0 })
  const { data: classes } = useQuery<any[]>({ queryKey: ['dd-class'], queryFn: () => fetch('/api/settings/dropdown?category=class_level').then(r=>r.json()).then(d=>d.options||[]), staleTime: 0 })
  const handleSubmit = async () => {
    if (!form.fullName.trim()) return
    setSaving(true)
    await fetch('/api/students', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    router.push('/dashboard/parent/children')
  }
  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1.5px solid ${C.bdr}`, borderRadius: 10, fontSize: 14, fontFamily: C.sans, color: C.ink, background: C.card, outline: 'none', boxSizing: 'border-box' as const }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: C.faint, marginBottom: 6, fontFamily: C.sans }
  if (!mounted) return null
  return (
    <DashLayout title="Add Child Profile" subtitle="Help us find the right schools for your child">
      <div style={{ maxWidth: 500, margin: '0 auto', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 20, padding: '32px', boxShadow: '0 4px 24px rgba(13,17,23,0.08)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lbl}>Child's Full Name *</label>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Arjun Sharma" style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.gold} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.bdr} />
          </div>
          <div>
            <label style={lbl}>Class / Grade</label>
            <select value={form.classLevel} onChange={e => set('classLevel', e.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none' as const }}>
              <option value="">Select Class</option>
              {(classes || []).map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Board Preference</label>
            <select value={form.boardPreference} onChange={e => set('boardPreference', e.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none' as const }}>
              <option value="">Select Board</option>
              {(boards || []).map((b: any) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => router.back()} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1.5px solid ${C.bdr}`, background: C.card, color: C.muted, cursor: 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!form.fullName.trim() || saving}
              style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: saving ? C.faint : C.gold, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {saving ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Child Profile'}
            </button>
          </div>
        </div>
      </div>
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: APPLICATIONS
═══════════════════════════════════════ */
export function ApplicationsPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  const enabled = !!accessToken && mounted
  const { data, isLoading } = useQuery<any[]>({ queryKey: ['applications-all'], queryFn: () => fetch('/api/applications?limit=50',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled })
  const apps = Array.isArray(data) ? data : (data as any)?.data ?? []
  if (!mounted) return null
  return (
    <DashLayout title="My Applications" subtitle="Track all your school applications">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 72, borderRadius: 14 }} />)}</div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <FileText style={{ width: 40, height: 40, color: C.faint, margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 8 }}>No applications yet</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, marginBottom: 20 }}>Find a school and apply to start tracking here</p>
          <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: C.gold, borderRadius: 10, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontWeight: 600 }}>Browse Schools</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {apps.map((app: any) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: C.bg, border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {app.school_logo || app.schoolLogo ? <img src={app.school_logo || app.schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <GraduationCap style={{ width: 20, height: 20, color: C.faint }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink }}>{app.school_name || app.schoolName || 'School'}</div>
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, marginTop: 3 }}>Applied {new Date(app.created_at || app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              <StatusBadge status={app.status || 'submitted'} />
            </motion.div>
          ))}
        </div>
      )}
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: SAVED SCHOOLS
═══════════════════════════════════════ */
export function SavedSchoolsPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  const enabled = !!accessToken && mounted
  const { data, isLoading } = useQuery<any[]>({ queryKey: ['saved-schools-all'], queryFn: () => fetch('/api/saved-schools?limit=50',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled })
  const schools = Array.isArray(data) ? data : (data as any)?.data ?? []
  if (!mounted) return null
  return (
    <DashLayout title="Saved Schools" subtitle="Schools you've bookmarked">
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>{[1,2,3].map(i => <div key={i} className="skel" style={{ height: 140, borderRadius: 16 }} />)}</div>
      ) : schools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Heart style={{ width: 40, height: 40, color: C.faint, margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 8 }}>No saved schools yet</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, marginBottom: 20 }}>Browse schools and tap the heart icon to save them</p>
          <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: C.gold, borderRadius: 10, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontWeight: 600 }}>Browse Schools</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {schools.map((school: any) => (
            <Link key={school.id} href={`/schools/${school.slug}`} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(13,17,23,0.1)' }} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '16px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: C.bg, border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {school.logo_url || school.logoUrl ? <img src={school.logo_url || school.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <GraduationCap style={{ width: 20, height: 20, color: C.faint }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink }}>{school.name}</div>
                    <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 11, height: 11 }} />{school.city}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} /><span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.ink }}>{school.avg_rating?.toFixed(1) || school.avgRating?.toFixed(1) || '–'}</span></div>
                  {school.monthly_fee_min || school.monthlyFeeMin ? <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.gold }}>₹{(school.monthly_fee_min || school.monthlyFeeMin)?.toLocaleString('en-IN')}/mo</span> : null}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: AI MATCHES
═══════════════════════════════════════ */
export function RecommendationsPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  const enabled = !!accessToken && mounted
  const { data, isLoading } = useQuery<any[]>({ queryKey: ['recs-all'], queryFn: () => fetch('/api/recommendations?limit=20',{credentials:'include'}).then(r=>r.ok?r.json():[]), enabled })
  const recs = Array.isArray(data) ? data : (data as any)?.data ?? []
  if (!mounted) return null
  return (
    <DashLayout title="AI School Matches" subtitle="Personalised recommendations based on your child's profile">
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>{[1,2,3,4,5,6].map(i => <div key={i} className="skel" style={{ height: 160, borderRadius: 16 }} />)}</div>
      ) : recs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Sparkles style={{ width: 28, height: 28, color: C.gold }} />
          </div>
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 8 }}>No matches yet</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>Add your child's class, board and location to unlock AI-powered school recommendations</p>
          <Link href="/dashboard/parent/children/add" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: C.gold, borderRadius: 10, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontWeight: 600 }}><Plus style={{ width: 15, height: 15 }} />Add Child Profile</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {recs.map((school: any, i: number) => (
            <Link key={school.id} href={`/schools/${school.slug}`} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(13,17,23,0.1)' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '18px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: C.bg, border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {school.logo_url || school.logoUrl ? <img src={school.logo_url || school.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <GraduationCap style={{ width: 20, height: 20, color: C.faint }} />}
                  </div>
                  <span style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 13, color: C.gold, background: C.goldBg, padding: '3px 10px', borderRadius: 99 }}>{98 - i * 3}% match</span>
                </div>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink, lineHeight: 1.35, marginBottom: 6 }}>{school.name}</div>
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}><MapPin style={{ width: 11, height: 11 }} />{school.city}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} /><span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.ink }}>{school.avg_rating?.toFixed(1) || school.avgRating?.toFixed(1) || '–'}</span></div>
                  {school.monthly_fee_min || school.monthlyFeeMin ? <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.gold }}>₹{(school.monthly_fee_min || school.monthlyFeeMin)?.toLocaleString('en-IN')}/mo</span> : null}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: COUNSELLING
═══════════════════════════════════════ */
export function CounsellingPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  if (!mounted) return null
  return (
    <DashLayout title="Free Counselling" subtitle="Book a session with a certified education counsellor">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#FEF7E0,#FAF7F2)', border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 20, padding: '36px', textAlign: 'center', marginBottom: 24, boxShadow: '0 4px 24px rgba(184,134,11,0.1)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar style={{ width: 28, height: 28, color: C.gold }} />
          </div>
          <h2 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 26, color: C.ink, marginBottom: 10 }}>Book a Free Session</h2>
          <p style={{ fontFamily: C.sans, fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
            Our certified education counsellors help you choose the right school based on your child's learning style, budget and goals. 100% free for parents.
          </p>
          <Link href="/counselling"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 28px', background: C.gold, borderRadius: 12, color: '#fff', textDecoration: 'none', fontFamily: C.sans, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
            Schedule a Callback <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
        {[{icon: CheckCircle2, title: 'Expert Guidance', desc: 'Counsellors with 10+ years of education experience'}, {icon: Clock, title: '30-Minute Sessions', desc: 'Focused, structured conversation about your child'},{icon: Sparkles, title: 'Personalised Advice', desc: 'Specific school recommendations based on your needs'}].map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <f.icon style={{ width: 18, height: 18, color: C.gold }} />
            </div>
            <div>
              <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink }}>{f.title}</div>
              <div style={{ fontFamily: C.sans, fontSize: 13, color: C.faint, marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </DashLayout>
  )
}

/* ═══════════════════════════════════════
   SUB-PAGE: NOTIFICATIONS
═══════════════════════════════════════ */
export function NotificationsPageClient() {
  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && (!accessToken || !user)) router.replace('/login') }, [mounted, accessToken, user, router])
  const enabled = !!accessToken && mounted
  const { data, isLoading } = useQuery<any[]>({ queryKey: ['notifications'], queryFn: () => fetch('/api/notifications',{credentials:'include'}).then(r=>r.ok?r.json():[]).catch(()=>[]), enabled })
  const notifs = Array.isArray(data) ? data : []
  if (!mounted) return null
  return (
    <DashLayout title="Notifications" subtitle="Updates and alerts from Thynk Schooling">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skel" style={{ height: 70, borderRadius: 14 }} />)}</div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Bell style={{ width: 40, height: 40, color: C.faint, margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 22, color: C.ink, marginBottom: 8 }}>All caught up!</h3>
          <p style={{ fontFamily: C.sans, fontSize: 13, color: C.faint }}>No notifications right now. We'll let you know about important updates.</p>
        </div>
      ) : notifs.map((n: any) => (
        <div key={n.id} style={{ background: n.read ? C.card : C.goldBg, border: `1px solid ${n.read ? C.bdr : 'rgba(184,134,11,0.2)'}`, borderRadius: 14, padding: '16px 20px', marginBottom: 10, display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell style={{ width: 16, height: 16, color: C.gold }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 3 }}>{n.title}</div>
            <div style={{ fontFamily: C.sans, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{n.body || n.message}</div>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 6 }}>{n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
          </div>
        </div>
      ))}
    </DashLayout>
  )
}
