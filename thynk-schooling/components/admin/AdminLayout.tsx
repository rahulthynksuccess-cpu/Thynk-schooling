'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users, School, FileText, BarChart2, Star, Phone,
  DollarSign, PlusCircle, Receipt, Settings, HelpCircle,
  Mail, Bell, Search, ChevronRight, GraduationCap, LogOut,
  LayoutDashboard, User
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import '../../app/admin/admin.css'

const NAV = [
  {
    section: 'CORE',
    items: [
      { label: 'Users Manager',      href: '/admin/users',        icon: Users },
      { label: 'Schools',            href: '/admin/schools',      icon: School },
      { label: 'Applications',       href: '/admin/applications', icon: FileText },
      { label: 'Analytics',          href: '/admin/analytics',    icon: BarChart2 },
      { label: 'Featured',           href: '/admin/featured',     icon: Star },
      { label: 'Counselling',        href: '/admin/counselling',  icon: Phone },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Payments',           href: '/admin/payments',     icon: DollarSign },
      { label: 'Subscriptions',      href: '/admin/subscriptions',icon: PlusCircle },
      { label: 'Invoices',           href: '/admin/invoices',     icon: Receipt },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Dropdown Settings',  href: '/admin/dropdown',     icon: Settings },
      { label: 'Help Center',        href: '/admin/help',         icon: HelpCircle },
      { label: 'Email Logs',         href: '/admin/emails',       icon: Mail },
    ],
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (window.innerWidth < 768) setExpanded(false)
  }, [pathname])

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA'

  return (
    <div className="admin-root">
      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar${expanded ? ' expanded' : ''}`}>
        {/* Toggle */}
        <button className="sidebar-toggle" onClick={() => setExpanded(!expanded)} aria-label="Toggle sidebar">
          <ChevronRight size={14} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo-row">
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} color="#fff" />
          </div>
          <span className="sidebar-logo-text">Thynk Admin</span>
        </div>

        {/* Navigation */}
        {NAV.map((group) => (
          <div key={group.section} style={{ width: '100%' }}>
            <div className="sidebar-section">{group.section}</div>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                >
                  <div className="sidebar-item-icon">
                    <Icon size={16} />
                  </div>
                  <span className="sidebar-item-label">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}

        {/* Sign out */}
        <div style={{ marginTop: 'auto', width: '100%', padding: '0 0 8px' }}>
          <button
            className="sidebar-item"
            style={{ color: 'rgba(239,68,68,0.7)', width: 'calc(100% - 16px)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => { logout(); router.push('/login') }}
          >
            <div className="sidebar-item-icon"><LogOut size={16} /></div>
            <span className="sidebar-item-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <div className="live-indicator" />
            <div>
              <h1 className="admin-header-title">{title}</h1>
              {subtitle && <p className="admin-header-sub">{subtitle}</p>}
            </div>
          </div>

          <div className="admin-header-right">
            {/* Quick search */}
            <div className="header-search">
              <Search size={14} color="rgba(255,255,255,0.3)" />
              <input placeholder="Quick search…" />
            </div>

            {/* Notifications */}
            <button className="header-icon-btn" aria-label="Notifications">
              <Bell size={15} />
              <div className="notif-dot" />
            </button>

            {/* Profile */}
            <div className="header-avatar" title={user?.fullName || 'Super Admin'}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
