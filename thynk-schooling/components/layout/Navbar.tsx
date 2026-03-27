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
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const dashHref =
    user?.role === 'school_admin' ? '/dashboard/school' :
    user?.role === 'super_admin'  ? '/admin/settings'   : '/dashboard/parent'

  return (
    <>
      <header className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'glass border-b border-[rgba(212,175,55,0.12)] shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1E4D2B, #276338)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 16px rgba(212,175,55,0.15)' }}>
                <GraduationCap className="w-5 h-5 text-gold-400" style={{ color: '#E0C55A' }} />
              </div>
              <div className="font-serif font-bold text-xl" style={{ color: '#F0EDD8', letterSpacing: '-0.01em' }}>
                Thynk<span style={{ color: '#D4AF37' }}>Schooling</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV.map(l => (
                <Link key={l.href} href={l.href}
                  className={clsx('nav-link', pathname.startsWith(l.href) && '!text-[#F0EDD8] after:!w-full')}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <button className="relative p-2 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                    <Bell className="w-5 h-5" style={{ color: 'rgba(240,237,216,0.5)' }} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse-dot"
                      style={{ background: '#D4AF37' }} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                        style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                        {(user.fullName || user.phone)?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: '#F0EDD8', fontFamily: 'DM Sans' }}>
                        {user.fullName || user.phone}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 transition-transform', profileOpen && 'rotate-180')}
                        style={{ color: 'rgba(240,237,216,0.4)' }} />
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-52 card py-1 z-50">
                          <Link href={dashHref} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                            style={{ color: 'rgba(240,237,216,0.7)' }}>
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                            style={{ color: 'rgba(240,237,216,0.7)' }}>
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                          <div className="border-t border-[#1E4D2B] my-1" />
                          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(239,68,68,0.08)]"
                            style={{ color: '#F87171' }}>
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">Login</Link>
                  <Link href="/register" className="btn-gold text-sm px-5 py-2.5">Get Started Free</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="lg:hidden p-2 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.05)]"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-[rgba(212,175,55,0.12)] overflow-hidden">
            <div className="px-6 py-6 flex flex-col gap-1">
              {NAV.map(l => (
                <Link key={l.href} href={l.href}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ color: 'rgba(240,237,216,0.65)', fontFamily: 'DM Sans' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F0EDD8'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(240,237,216,0.65)'; (e.target as HTMLElement).style.background = 'transparent' }}>
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-[#1E4D2B] mt-3 pt-3 flex flex-col gap-2">
                {isAuthenticated
                  ? <Link href={dashHref} className="btn-forest text-center justify-center">Dashboard</Link>
                  : <>
                      <Link href="/login"    className="btn-forest text-center justify-center">Login</Link>
                      <Link href="/register" className="btn-gold text-center justify-center">Get Started Free</Link>
                    </>
                }
              </div>
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
