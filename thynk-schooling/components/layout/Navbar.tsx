'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, GraduationCap, Bell, LogOut, User, LayoutDashboard } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'

const NAV_LINKS = [
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
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const dashboardHref =
    user?.role === 'school_admin' ? '/dashboard/school' :
    user?.role === 'super_admin'  ? '/admin/settings'   : '/dashboard/parent'

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'glass border-b border-surface-border shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange-sm group-hover:shadow-orange transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Thynk<span className="text-orange-500">Schooling</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'nav-link pb-0.5',
                    pathname.startsWith(link.href) && 'text-white after:w-full'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors">
                    <Bell className="w-5 h-5 text-navy-300" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse-dot" />
                  </Link>
                  {/* Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                        {user.avatarUrl
                          ? <img src={user.avatarUrl} alt={user.fullName || ''} className="w-full h-full rounded-full object-cover" />
                          : <span className="font-display font-bold text-orange-400 text-sm">
                              {(user.fullName || user.phone)?.[0]?.toUpperCase()}
                            </span>
                        }
                      </div>
                      <span className="font-display font-semibold text-sm text-white max-w-[120px] truncate">
                        {user.fullName || user.phone}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 text-navy-300 transition-transform', profileOpen && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-52 card py-1 z-50"
                        >
                          <Link href={dashboardHref} className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-200 hover:text-white hover:bg-surface-hover transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-200 hover:text-white hover:bg-surface-hover transition-colors">
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                          <div className="border-t border-surface-border my-1" />
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login"    className="btn-ghost">Login</Link>
                  <Link href="/register" className="btn-primary">Get Started Free</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-surface-hover transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-surface-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 rounded-xl text-navy-200 hover:text-white hover:bg-surface-hover font-display font-semibold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-surface-border mt-3 pt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link href={dashboardHref} className="btn-secondary w-full justify-center">Dashboard</Link>
                    <button onClick={logout} className="btn-ghost text-red-400 w-full justify-center">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login"    className="btn-secondary w-full justify-center">Login</Link>
                    <Link href="/register" className="btn-primary  w-full justify-center">Get Started Free</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {(mobileOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setMobileOpen(false); setProfileOpen(false) }}
        />
      )}
    </>
  )
}
