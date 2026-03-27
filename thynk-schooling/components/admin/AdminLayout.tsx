'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Settings, DollarSign, Package,
  School, Users, LogOut, GraduationCap, Menu, X, Palette
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',          href: '/admin' },
  { icon: Settings,        label: 'Dropdown Settings', href: '/admin/settings' },
  { icon: DollarSign,      label: 'Lead Pricing',      href: '/admin/lead-pricing' },
  { icon: Package,         label: 'Lead Packages',     href: '/admin/packages' },
  { icon: School,          label: 'Schools',           href: '/admin/schools' },
  { icon: Users,           label: 'Users',             href: '/admin/users' },
  { icon: Palette,         label: 'Theme',             href: '/admin/theme' },
]

const S: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' }

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  return (
    <aside style={{ width:'256px', background:'#111830', borderRight:'1px solid #1E2A52', display:'flex', flexDirection:'column', height:'100%', flexShrink:0 }}>
      <div style={{ padding:'20px', borderBottom:'1px solid #1E2A52', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FF5C00', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <GraduationCap style={{ width:'16px', height:'16px', color:'#fff' }} />
          </div>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'14px', color:'#fff' }}>Super Admin</span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892B0', display:'flex' }}>
            <X style={{ width:'16px', height:'16px' }} />
          </button>
        )}
      </div>

      <div style={{ padding:'16px', borderBottom:'1px solid #1E2A52' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,92,0,0.15)', border:'1px solid rgba(255,92,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'14px', color:'#FF5C00' }}>
            {(user?.fullName || 'A')[0]}
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:'13px', color:'#fff', ...S }}>{user?.fullName || 'Admin'}</div>
            <div style={{ fontSize:'10px', background:'rgba(255,92,0,0.12)', color:'#FF7A2E', padding:'2px 8px', borderRadius:'100px', display:'inline-block', marginTop:'2px', fontWeight:600, letterSpacing:'.04em', ...S }}>SUPER ADMIN</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:'12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'2px' }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'10px 12px', borderRadius:'10px',
              fontWeight:500, fontSize:'13px', textDecoration:'none',
              background: active ? '#FF5C00' : 'transparent',
              color: active ? '#fff' : '#8892B0', ...S,
            }}>
              <Icon style={{ width:'16px', height:'16px', flexShrink:0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding:'12px', borderTop:'1px solid #1E2A52' }}>
        <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'#F87171', ...S }}>
          <LogOut style={{ width:'16px', height:'16px' }} /> Logout
        </button>
      </div>
    </aside>
  )
}

export function AdminLayout({ children, title, subtitle }: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0A0F2E', overflow:'hidden', ...S }}>
      {/* Desktop sidebar */}
      <div style={{ display:'none' }} className="lg:flex">
        <Sidebar />
      </div>
      <div className="hidden lg:flex" style={{ flexShrink:0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
          <Sidebar onClose={() => setOpen(false)} />
          <div style={{ flex:1, background:'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)} />
        </div>
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 24px', borderBottom:'1px solid #1E2A52', background:'#111830', flexShrink:0 }}>
          <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892B0', display:'flex' }} className="lg:hidden">
            <Menu style={{ width:'20px', height:'20px' }} />
          </button>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'18px', color:'#fff', margin:0 }}>{title}</h1>
            {subtitle && <p style={{ fontSize:'12px', color:'#8892B0', margin:0, marginTop:'2px' }}>{subtitle}</p>}
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:'24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
