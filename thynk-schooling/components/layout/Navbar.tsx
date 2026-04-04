'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, GraduationCap, Bell, LogOut, LayoutDashboard, User } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { label: 'Find Schools', href: '/schools' },
  { label: 'Compare',      href: '/compare' },
  { label: 'Counselling',  href: '/counselling' },
  { label: 'Blog',         href: '/blog' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => setMobileOpen(false), [pathname])

  const dashHref =
    user?.role === 'school_admin' ? '/dashboard/school' :
    user?.role === 'super_admin'  ? '/admin/settings'   : '/dashboard/parent'

  return (
    <>
      <header className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-400',
        scrolled
          ? 'bg-[rgba(250,247,242,0.95)] backdrop-blur-md border-b border-[rgba(13,17,23,0.08)] shadow-[0_2px_20px_rgba(13,17,23,0.06)]'
          : 'bg-transparent'
      )}>
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-[7px] flex items-center justify-center"
                style={{ background: '#0D1117', boxShadow: '0 2px 8px rgba(13,17,23,0.2)' }}>
                <GraduationCap className="w-4 h-4" style={{ color: '#E8C547' }} />
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, fontSize: '19px', letterSpacing: '-0.3px', color: '#0D1117' }}>
                Thynk<em style={{ fontStyle: 'italic', color: '#B8860B' }}>Schooling</em>
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-9">
              {NAV.map(l => (
                <Link key={l.href} href={l.href} className={clsx('nav-link', pathname.startsWith(l.href) && '!text-ink after:!w-full')}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <button className="relative p-2 rounded-lg transition-colors hover:bg-ivory-2">
                    <Bell className="w-4 h-4 text-ink-muted" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold animate-pulse-dot" />
                  </button>
                  <div className="relative">
                    <button onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ivory-2 transition-colors">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                        style={{ background: '#B8860B', color: '#FAF7F2', fontFamily: 'Inter' }}>
                        {(user.fullName || user.phone)?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-ink-light max-w-[100px] truncate" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                        {user.fullName || user.phone}
                      </span>
                      <ChevronDown className={clsx('w-3.5 h-3.5 text-ink-faint transition-transform', profileOpen && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div initial={{ opacity:0, y:6, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }}
                          exit={{ opacity:0, y:6, scale:.97 }} transition={{ duration:.15 }}
                          className="absolute right-0 top-full mt-1.5 w-48 card py-1 z-50">
                          <Link href={dashHref} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-light hover:text-ink hover:bg-ivory-2 transition-colors" style={{ fontFamily: 'Inter' }}>
                            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                          </Link>
                          <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-light hover:text-ink hover:bg-ivory-2 transition-colors" style={{ fontFamily: 'Inter' }}>
                            <User className="w-3.5 h-3.5" /> My Profile
                          </Link>
                          <div className="divider my-1" />
                          <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors" style={{ color: '#DC2626', fontFamily: 'Inter' }}>
                            <LogOut className="w-3.5 h-3.5" /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">Login</Link>
                  <Link href="/register" className="btn-primary text-sm">Get Started Free</Link>
                </>
              )}
            </div>

            {/* Mobile */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-ivory-2 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5 text-ink" /> : <Menu className="w-5 h-5 text-ink" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} transition={{ duration:.22 }}
            className="fixed top-[72px] left-0 right-0 z-40 overflow-hidden"
            style={{ background: 'var(--nav-bg,rgba(250,247,242,0.97))', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
            <div className="max-w-[1600px] mx-auto px-12 py-6 flex flex-col gap-1">
              {NAV.map(l => (
                <Link key={l.href} href={l.href} className="nav-link px-2 py-3 text-sm">{l.label}</Link>
              ))}
              <div className="divider mt-3 mb-3" />
              {isAuthenticated
                ? <Link href={dashHref} className="btn-outline text-center justify-center">Dashboard</Link>
                : <div className="flex flex-col gap-2">
                    <Link href="/login"    className="btn-outline text-center justify-center">Login</Link>
                    <Link href="/register" className="btn-primary text-center justify-center">Get Started Free</Link>
                  </div>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {(mobileOpen || profileOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setMobileOpen(false); setProfileOpen(false) }} />
      )}
    </>
  )
}
