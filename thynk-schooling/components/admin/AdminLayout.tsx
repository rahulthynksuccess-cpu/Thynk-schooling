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

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',        href: '/admin',               color: '#F5A623' },
      { icon: BarChart3,       label: 'Analytics',         href: '/admin/analytics',     color: '#F5A623' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: School,     label: 'Schools',      href: '/admin/schools',      color: '#00E5A0' },
      { icon: Users,      label: 'Users',        href: '/admin/users',        color: '#00E5A0' },
      { icon: FileCheck,  label: 'Applications', href: '/admin/applications', color: '#00E5A0' },
      { icon: TrendingUp, label: 'Leads',        href: '/admin/leads',        color: '#00E5A0' },
      { icon: Star,       label: 'Reviews',      href: '/admin/reviews',      color: '#00E5A0' },
      { icon: PhoneCall,  label: 'Counselling',  href: '/admin/counselling',  color: '#00E5A0' },
    ],
  },
  {
    label: 'Monetisation',
    items: [
      { icon: DollarSign, label: 'Lead Pricing', href: '/admin/lead-pricing', color: '#F5A623' },
      { icon: Package,    label: 'Packages',     href: '/admin/packages',     color: '#F5A623' },
      { icon: FileText,   label: 'Payments',     href: '/admin/payments',     color: '#F5A623' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { icon: Settings,   label: 'Settings',      href: '/admin/settings',      color: '#4F8EF7' },
      { icon: Palette,    label: 'Theme',          href: '/admin/theme',         color: '#4F8EF7' },
      { icon: Mail,       label: 'Integrations',   href: '/admin/integrations',  color: '#4F8EF7' },
      { icon: FileText,   label: 'Page Content',   href: '/admin/content',       color: '#4F8EF7' },
      { icon: Bell,       label: 'Notifications',  href: '/admin/notifications', color: '#4F8EF7' },
      { icon: BarChart3,  label: 'SEO Manager',    href: '/admin/seo',           color: '#4F8EF7' },
      { icon: ImageIcon,  label: 'Media & Brand',  href: '/admin/media',         color: '#4F8EF7' },
      { icon: MapPin,     label: 'SEO Cities',     href: '/admin/cities',        color: '#4F8EF7' },
    ],
  },
]

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
      marginBottom: 20, padding: '12px 18px', borderRadius: 14,
      background: 'rgba(255,87,87,0.08)', border: '1px solid rgba(255,87,87,0.25)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <AlertTriangle style={{ width: 16, height: 16, color: '#FF5757', flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontFamily: 'var(--a-sans, "Plus Jakarta Sans", sans-serif)', fontSize: 12.5 }}>
        <span style={{ color: '#FF5757', fontWeight: 700 }}>Database unreachable. </span>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>
          Theme/content saves will not work. Fix: In Supabase → Settings → Database → use the{' '}
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Transaction pooler</strong> connection string (port 6543) as DATABASE_URL.
          {data.message && <><br /><code style={{ color: 'rgba(255,120,120,0.8)', fontSize: 11, fontFamily: 'var(--a-mono)' }}>{data.message}</code></>}
        </span>
      </div>
    </div>
  )
}

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

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside className="admin-sidebar" style={{ height: '100%', width: '264px' }}>

      {/* Logo */}
      <Link href="/" className="sidebar-logo-row" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo-icon">
          <GraduationCap style={{ width: 20, height: 20, color: '#000', position: 'relative', zIndex: 1 }} />
        </div>
        <div>
          <div className="sidebar-logo-text">Thynk Schooling</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4,
          }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </Link>

      {/* User badge */}
      <div className="sidebar-user-badge">
        <div className="sidebar-user-avatar">
          {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.profile?.fullName || user?.fullName || 'Admin'}
          </div>
          <div className="sidebar-user-role">Super Admin</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="sidebar-section">{group.label}</div>
            {group.items.map(({ icon: Icon, label, href, color }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-item${active ? ' active' : ''}`}
                  style={active ? { color } : undefined}
                  onClick={() => onClose?.()}
                >
                  <div className="sidebar-item-icon">
                    <Icon style={{ width: 16, height: 16, color: active ? color : undefined }} />
                  </div>
                  <span className="sidebar-item-label">{label}</span>
                  {active && <ChevronRight style={{ width: 12, height: 12, marginLeft: 'auto', opacity: 0.7 }} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/" target="_blank" className="sidebar-item" style={{ marginBottom: 2, width: 'calc(100% - 0px)', margin: '0 0 2px 0' }}>
          <div className="sidebar-item-icon">
            <ExternalLink style={{ width: 14, height: 14 }} />
          </div>
          <span className="sidebar-item-label" style={{ opacity: 1, fontSize: 12 }}>View Live Site</span>
        </Link>
        <button
          onClick={logout}
          className="sidebar-item"
          style={{
            width: '100%', background: 'none', border: 'none',
            cursor: 'pointer', color: 'rgba(255,87,87,0.65)',
            margin: '0',
          }}
        >
          <div className="sidebar-item-icon">
            <LogOut style={{ width: 14, height: 14 }} />
          </div>
          <span className="sidebar-item-label" style={{ opacity: 1, fontSize: 12 }}>Sign Out</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="admin-root">
      {/* Ambient background elements */}
      <div className="admin-bg-grid" />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <Sidebar onClose={() => setOpen(false)} />
          <div
            style={{ flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="admin-main">

        {/* Top header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="lg:hidden header-icon-btn"
              onClick={() => setOpen(true)}
              style={{ display: 'flex' }}
            >
              <Menu style={{ width: 17, height: 17 }} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="live-indicator" />
                <h1 className="admin-header-title">{title}</h1>
              </div>
              {subtitle && <p className="admin-header-sub">{subtitle}</p>}
            </div>
          </div>

          <div className="admin-header-right">
            {/* Search bar */}
            <div className="header-search hidden md:flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search…" />
            </div>

            {/* Notification bell */}
            <button className="header-icon-btn">
              <Bell style={{ width: 16, height: 16 }} />
              <div className="notif-dot" />
            </button>

            {/* Avatar */}
            <div className="header-avatar">
              {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <DBStatusBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
