'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, School, Users, FileCheck, Star,
  TrendingUp, DollarSign, Package, Settings, Palette,
  LogOut, GraduationCap, Menu, X, Bell, PhoneCall,
  BarChart3, FileText, ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',       href: '/admin'               },
      { icon: BarChart3,       label: 'Analytics',        href: '/admin/analytics'     },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: School,    label: 'Schools',          href: '/admin/schools'       },
      { icon: Users,     label: 'Users',            href: '/admin/users'         },
      { icon: FileCheck, label: 'Applications',     href: '/admin/applications'  },
      { icon: TrendingUp,label: 'Leads',            href: '/admin/leads'         },
      { icon: Star,      label: 'Reviews',          href: '/admin/reviews'       },
      { icon: PhoneCall, label: 'Counselling',      href: '/admin/counselling'   },
    ],
  },
  {
    label: 'Monetisation',
    items: [
      { icon: DollarSign, label: 'Lead Pricing',    href: '/admin/lead-pricing'  },
      { icon: Package,    label: 'Lead Packages',   href: '/admin/packages'      },
      { icon: FileText,   label: 'Payments',        href: '/admin/payments'      },
    ],
  },
  {
    label: 'Platform',
    items: [
      { icon: Settings,   label: 'Dropdown Settings', href: '/admin/settings'   },
      { icon: Palette,    label: 'Theme',              href: '/admin/theme'      },
      { icon: Bell,       label: 'Notifications',      href: '/admin/notifications' },
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

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside style={{ width: '240px', background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FF5C00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap style={{ width: '15px', height: '15px', color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', letterSpacing: '-.2px' }}>Thynk Schooling</span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)', display: 'flex' }}>
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        )}
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,92,0,.15)', border: '1px solid rgba(255,92,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#FF5C00', flexShrink: 0, fontFamily: 'Syne,sans-serif' }}>
            {(user?.profile?.fullName || 'A')[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#fff', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.profile?.fullName || 'Admin'}
            </div>
            <div style={{ fontSize: '9px', background: 'rgba(255,92,0,.12)', color: '#FF7A2E', padding: '1px 7px', borderRadius: '100px', display: 'inline-block', marginTop: '2px', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, letterSpacing: '.06em' }}>SUPER ADMIN</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', padding: '0 8px', marginBottom: '4px' }}>
              {group.label}
            </div>
            {group.items.map(({ icon: Icon, label, href }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: 500, textDecoration: 'none', marginBottom: '1px', transition: 'all .15s', background: active ? '#FF5C00' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,.45)' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
                  <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: 500, color: '#F87171', transition: 'background .15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.08)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}>
          <LogOut style={{ width: '14px', height: '14px' }} /> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0F1E', overflow: 'hidden', fontFamily: 'DM Sans,sans-serif' }}>
      <div className="hidden lg:flex" style={{ flexShrink: 0 }}><Sidebar /></div>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <Sidebar onClose={() => setOpen(false)} />
          <div style={{ flex: 1, background: 'rgba(0,0,0,.6)' }} onClick={() => setOpen(false)} />
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,.06)', background: '#0D1117', flexShrink: 0 }}>
          <button className="lg:hidden" onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', display: 'flex' }}>
            <Menu style={{ width: '19px', height: '19px' }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '17px', color: '#fff', margin: 0, letterSpacing: '-.2px' }}>{title}</h1>
            {subtitle && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', margin: 0, marginTop: '1px' }}>{subtitle}</p>}
          </div>
          {/* Quick action */}
          <Link href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.5)', fontSize: '11px', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>
            <GraduationCap style={{ width: '12px', height: '12px' }} /> View Site
          </Link>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>{children}</main>
      </div>
    </div>
  )
}
