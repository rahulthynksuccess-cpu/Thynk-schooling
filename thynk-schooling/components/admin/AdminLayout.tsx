'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, School, Users, FileCheck, Star,
  TrendingUp, DollarSign, Package, Settings, Palette,
  LogOut, GraduationCap, Menu, X, Bell, PhoneCall,
  BarChart3, FileText, ChevronRight, ExternalLink, Mail,
  AlertTriangle, Image as ImageIcon, MapPin
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/* ─── CSS variable helpers ───────────────────────────────────────────────────
   All admin colours read from CSS vars set by the Theme Controller.
   Fallback values match the original dark design so it looks identical
   before any theme change is saved.
*/
const V = {
  /* backgrounds */
  pageBg:      'var(--admin-bg,          #080D14)',
  sidebarBg:   'var(--admin-sidebar-bg,  linear-gradient(180deg,#0B1018 0%,#0F1623 100%))',
  cardBg:      'var(--admin-card-bg,     #0F1623)',
  headerBg:    'var(--admin-header-bg,   rgba(8,13,20,0.98))',
  /* borders */
  border:      'var(--admin-border,      rgba(255,255,255,0.08))',
  borderLight: 'var(--admin-border,      rgba(255,255,255,0.06))',
  /* text */
  textPrimary: 'var(--admin-text,        rgba(255,255,255,0.92))',
  textMuted:   'var(--admin-text-muted,  rgba(255,255,255,0.45))',
  textFaint:   'var(--admin-text-faint,  rgba(255,255,255,0.22))',
  /* accent */
  accent:      'var(--admin-accent,      #B8860B)',
}

function DBStatusBanner() {
  const { data } = useQuery({
    queryKey: ['admin-db-health'],
    queryFn: () => fetch('/api/admin/health').then(r => r.json()),
    staleTime: 30_000,
    retry: false,
  })
  if (!data || data.db === 'connected') return null
  return (
    <div style={{
      marginBottom: 16, padding: '10px 16px', borderRadius: 10,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <AlertTriangle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12 }}>
        <span style={{ color: '#f87171', fontWeight: 700 }}>Database unreachable. </span>
        <span style={{ color: V.textMuted }}>
          Theme/content saves will not work. Fix: In Supabase → Settings → Database → use the{' '}
          <strong style={{ color: V.textPrimary }}>Transaction pooler</strong> connection string (port 6543) as DATABASE_URL.
          {data.message && <><br /><code style={{ color: 'rgba(255,100,100,0.8)', fontSize: 11 }}>{data.message}</code></>}
        </span>
      </div>
    </div>
  )
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',        href: '/admin',               color: 'var(--admin-accent,#B8860B)' },
      { icon: BarChart3,       label: 'Analytics',         href: '/admin/analytics',     color: 'var(--admin-accent,#B8860B)' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: School,     label: 'Schools',      href: '/admin/schools',      color: '#22C55E' },
      { icon: Users,      label: 'Users',        href: '/admin/users',        color: '#22C55E' },
      { icon: FileCheck,  label: 'Applications', href: '/admin/applications', color: '#22C55E' },
      { icon: TrendingUp, label: 'Leads',        href: '/admin/leads',        color: '#22C55E' },
      { icon: Star,       label: 'Reviews',      href: '/admin/reviews',      color: '#22C55E' },
      { icon: PhoneCall,  label: 'Counselling',  href: '/admin/counselling',  color: '#22C55E' },
    ],
  },
  {
    label: 'Monetisation',
    items: [
      { icon: DollarSign, label: 'Lead Pricing', href: '/admin/lead-pricing', color: 'var(--admin-accent,#B8860B)' },
      { icon: Package,    label: 'Packages',     href: '/admin/packages',     color: 'var(--admin-accent,#B8860B)' },
      { icon: FileText,   label: 'Payments',     href: '/admin/payments',     color: 'var(--admin-accent,#B8860B)' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { icon: Settings,   label: 'Settings',      href: '/admin/settings',      color: '#60A5FA' },
      { icon: Palette,    label: 'Theme',          href: '/admin/theme',         color: '#60A5FA' },
      { icon: Mail,       label: 'Integrations',   href: '/admin/integrations',  color: '#60A5FA' },
      { icon: FileText,   label: 'Page Content',   href: '/admin/content',       color: '#60A5FA' },
      { icon: Bell,       label: 'Notifications',  href: '/admin/notifications', color: '#60A5FA' },
      { icon: BarChart3,  label: 'SEO Manager',    href: '/admin/seo',           color: '#60A5FA' },
      { icon: ImageIcon,  label: 'Media & Brand',  href: '/admin/media',         color: '#60A5FA' },
      { icon: MapPin,     label: 'SEO Cities',     href: '/admin/cities',        color: '#60A5FA' },
    ],
  },
]

export function AdminLayout({ children, title, subtitle }: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(i => isActive(i.href))
  const accentColor = 'var(--admin-accent, #B8860B)'

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside style={{
      width: '256px', flexShrink: 0,
      background: V.sidebarBg,
      borderRight: `1px solid ${V.border}`,
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${V.borderLight}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #B8860B, #E5B64A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(184,134,11,0.35)',
            }}>
              <GraduationCap style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '14px', color: V.textPrimary, letterSpacing: '-.3px', lineHeight: 1 }}>
                Thynk Schooling
              </div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '10px', color: V.textFaint, letterSpacing: '.04em', marginTop: '2px' }}>
                Admin Panel
              </div>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} style={{ background: V.cardBg, border: `1px solid ${V.border}`, borderRadius: '7px', cursor: 'pointer', color: V.textMuted, display: 'flex', padding: '5px', transition: 'all .15s' }}>
              <X style={{ width: '13px', height: '13px' }} />
            </button>
          )}
        </div>
      </div>

      {/* User card */}
      <div style={{ margin: '12px', borderRadius: '12px', padding: '12px 14px', background: V.cardBg, border: `1px solid ${V.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #B8860B, #E5B64A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: '15px', color: '#fff',
          }}>
            {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '13px', color: V.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.profile?.fullName || user?.fullName || 'Admin'}
            </div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: accentColor, marginTop: '2px' }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 10px', scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '4px' }}>
            <div style={{
              fontFamily: 'DM Sans,sans-serif', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.6px', textTransform: 'uppercase',
              color: V.textFaint, padding: '10px 10px 5px',
            }}>
              {group.label}
            </div>
            {group.items.map(({ icon: Icon, label, href, color }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '9px', marginBottom: '1px',
                  fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: active ? 600 : 400,
                  textDecoration: 'none', transition: 'all .18s',
                  background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
                  color: active ? V.textPrimary : V.textMuted,
                  borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = V.cardBg; (e.currentTarget as HTMLAnchorElement).style.color = V.textPrimary } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = V.textMuted } }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                    background: active ? `color-mix(in srgb, ${color} 20%, transparent)` : V.cardBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s',
                  }}>
                    <Icon style={{ width: '14px', height: '14px', color: active ? color : V.textMuted }} />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight style={{ width: '13px', height: '13px', color, opacity: .7 }} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: `1px solid ${V.borderLight}` }}>
        <Link href="/" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px',
          borderRadius: '9px', marginBottom: '4px', fontSize: '12px',
          color: V.textFaint, textDecoration: 'none',
          fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = V.cardBg; (e.currentTarget as HTMLAnchorElement).style.color = V.textMuted }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = V.textFaint }}>
          <ExternalLink style={{ width: '13px', height: '13px' }} />
          View Live Site
        </Link>
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          padding: '9px 10px', borderRadius: '9px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: 500,
          color: 'rgba(248,113,113,0.7)', transition: 'all .15s', textAlign: 'left',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#F87171' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.7)' }}>
          <LogOut style={{ width: '13px', height: '13px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: V.pageBg, overflow: 'hidden', fontFamily: 'DM Sans,sans-serif' }}>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ flexShrink: 0 }}><Sidebar /></div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <Sidebar onClose={() => setOpen(false)} />
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top header */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '0 24px', height: '60px', flexShrink: 0,
          background: V.headerBg,
          borderBottom: `1px solid ${V.border}`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accentColor}60, transparent 60%)` }} />

          <button className="lg:hidden" onClick={() => setOpen(true)}
            style={{ background: V.cardBg, border: `1px solid ${V.border}`, borderRadius: '8px', cursor: 'pointer', color: V.textMuted, display: 'flex', padding: '7px' }}>
            <Menu style={{ width: '16px', height: '16px' }} />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
              <h1 style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: '16px', color: V.textPrimary, margin: 0, letterSpacing: '-.2px' }}>{title}</h1>
            </div>
            {subtitle && <p style={{ fontSize: '11px', color: V.textFaint, margin: 0, marginTop: '1px', marginLeft: '14px' }}>{subtitle}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ width: '34px', height: '34px', borderRadius: '9px', background: V.cardBg, border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell style={{ width: '15px', height: '15px', color: V.textMuted }} />
              <div style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', borderRadius: '50%', background: accentColor, border: `1px solid ${V.pageBg}` }} />
            </button>
            <div style={{ width: '1px', height: '20px', background: V.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px 5px 5px', borderRadius: '10px', background: V.cardBg, border: `1px solid ${V.border}` }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg,#B8860B,#E5B64A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: '11px', color: '#fff' }}>
                {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
              </div>
              <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: 500, color: V.textMuted }}>
                {(user?.profile?.fullName || user?.fullName)?.split(' ')[0] || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 3vw, 24px)', background: V.pageBg }}>
          <DBStatusBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
