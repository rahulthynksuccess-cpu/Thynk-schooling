'use client'
import '../../app/admin/admin.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, School, Users, FileCheck, Star,
  TrendingUp, DollarSign, Settings, Palette, LayoutGrid,
  LogOut, GraduationCap, Menu, X, Bell, PhoneCall,
  BarChart3, FileText, ChevronRight, ExternalLink, Mail,
  AlertTriangle, Image as ImageIcon, MapPin, Zap, BookOpen,
  LayoutList
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV_GROUPS = [
  { label:'Overview', items:[
    { icon:LayoutDashboard, label:'Dashboard',   href:'/admin' },
    { icon:BarChart3,       label:'Analytics',   href:'/admin/analytics' },
  ]},
  { label:'Management', items:[
    { icon:School,     label:'Schools',          href:'/admin/schools' },
    { icon:Star,       label:'Featured Schools',  href:'/admin/featured-schools' },
    { icon:Users,      label:'Users',            href:'/admin/users' },
    { icon:FileCheck,  label:'Applications',     href:'/admin/applications' },
    { icon:TrendingUp, label:'Leads',            href:'/admin/leads' },
    { icon:Star,       label:'Reviews',          href:'/admin/reviews' },
    { icon:PhoneCall,  label:'Counselling',      href:'/admin/counselling' },
    { icon:BookOpen,   label:'Blog',             href:'/admin/blog' },
  ]},
  { label:'Monetisation', items:[
    { icon:DollarSign,   label:'Lead Pricing',         href:'/admin/lead-pricing' },
    { icon:LayoutGrid,   label:'Subscription Plans',   href:'/admin/subscription-plans' },
    { icon:FileText,     label:'Payments',             href:'/admin/payments' },
  ]},
  { label:'Platform', items:[
    { icon:Settings,     label:'Settings',         href:'/admin/settings' },
    { icon:Palette,      label:'Theme',            href:'/admin/theme' },
    { icon:Mail,         label:'Integrations',     href:'/admin/integrations' },
    { icon:FileText,     label:'Page Content',     href:'/admin/content' },
    { icon:LayoutList,   label:'Menu Manager',     href:'/admin/menu' },
    { icon:Bell,         label:'Notifications',    href:'/admin/notifications' },
    { icon:Zap,          label:'Message Triggers', href:'/admin/email-triggers' },
    { icon:BarChart3,    label:'SEO Manager',      href:'/admin/seo' },
    { icon:ImageIcon,    label:'Media & Brand',    href:'/admin/media' },
    { icon:MapPin,       label:'SEO Cities',       href:'/admin/cities' },
  ]},
]

function DBStatusBanner() {
  const { data } = useQuery({
    queryKey: ['admin-db-health'],
    queryFn: () => fetch('/api/admin/health').then(r => r.json()),
    staleTime: 30_000, retry: false,
  })
  if (!data || data.db === 'connected') return null
  return (
    <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'flex-start', gap:10 }}>
      <AlertTriangle style={{ width:15, height:15, color:'#DC2626', flexShrink:0, marginTop:2 }} />
      <div style={{ fontFamily:'Inter,sans-serif', fontSize:12 }}>
        <span style={{ color:'#DC2626', fontWeight:700 }}>Database unreachable. </span>
        <span style={{ color:'#6B7280' }}>Use the Transaction pooler connection string (port 6543) in Supabase Settings.</span>
      </div>
    </div>
  )
}

export function AdminLayout({ children, title, subtitle, pageClass }: { children: React.ReactNode; title: string; subtitle?: string; pageClass?: string }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside className="admin-sidebar" style={{ height:'100%', width:'240px' }}>
      <Link href="/" className="sidebar-logo-row" style={{ textDecoration:'none' }}>
        <div className="sidebar-logo-icon">
          <GraduationCap style={{ width:18, height:18, color:'#fff' }} />
        </div>
        <div>
          <div className="sidebar-logo-text">Thynk Schooling</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:4 }}>
            <X style={{ width:15, height:15 }} />
          </button>
        )}
      </Link>

      <div className="sidebar-user-badge">
        <div className="sidebar-user-avatar">
          {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="sidebar-user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.profile?.fullName || user?.fullName || 'Admin'}
          </div>
          <div className="sidebar-user-role">Super Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="sidebar-section">{group.label}</div>
            {group.items.map(({ icon: Icon, label, href }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} className={`sidebar-item${active ? ' active' : ''}`} onClick={() => onClose?.()}>
                  <div className="sidebar-item-icon">
                    <Icon style={{ width:14, height:14 }} />
                  </div>
                  <span className="sidebar-item-label">{label}</span>
                  {active && <ChevronRight style={{ width:11, height:11, marginLeft:'auto', opacity:0.6 }} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/" target="_blank" className="sidebar-item" style={{ margin:'0 0 2px 0', width:'calc(100% - 10px)' }}>
          <div className="sidebar-item-icon"><ExternalLink style={{ width:13, height:13 }} /></div>
          <span className="sidebar-item-label">View Live Site</span>
        </Link>
        <button onClick={logout} className="sidebar-item" style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#EF4444', margin:0 }}>
          <div className="sidebar-item-icon"><LogOut style={{ width:13, height:13 }} /></div>
          <span className="sidebar-item-label">Sign Out</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className={`admin-root${pageClass ? ` ${pageClass}` : ''}`}>
      <div className="hidden lg:flex" style={{ flexShrink:0, height:'100vh', position:'sticky', top:0 }}>
        <Sidebar />
      </div>

      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
          <Sidebar onClose={() => setOpen(false)} />
          <div style={{ flex:1, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="lg:hidden header-icon-btn" onClick={() => setOpen(true)} style={{ display:'flex' }}>
              <Menu style={{ width:16, height:16 }} />
            </button>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="live-indicator" />
                <h1 className="admin-header-title">{title}</h1>
              </div>
              {subtitle && <p className="admin-header-sub">{subtitle}</p>}
            </div>
          </div>
          <div className="admin-header-right">
            <div className="header-search hidden md:flex">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color:'#9CA3AF', flexShrink:0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search..." />
            </div>
            <button className="header-icon-btn">
              <Bell style={{ width:15, height:15 }} />
              <div className="notif-dot" />
            </button>
            <div className="header-avatar">
              {(user?.profile?.fullName || user?.fullName || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <DBStatusBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
