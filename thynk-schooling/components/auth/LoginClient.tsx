'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiPost } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types'

// ── LOGIN PAGE ─────────────────────────────────────────────────
export function LoginClient() {
  const router = useRouter()
  const { setUser, setAccessToken } = useAuthStore()
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [mode,     setMode]     = useState<'password' | 'otp'>('password')
  const [otp,      setOtp]      = useState('')
  const [otpSent,  setOtpSent]  = useState(false)

  const loginMutation = useMutation({
    mutationFn: () => apiPost<{ user: User; accessToken: string }>(
      mode === 'password' ? '/auth/login-mobile' : '/auth/login-otp',
      mode === 'password' ? { phone, password } : { phone, otp }
    ),
    onSuccess: (data) => {
      setUser(data.user)
      setAccessToken(data.accessToken)
      toast.success(`Welcome back, ${data.user.fullName || 'there'}!`)
      router.push(
        !data.user.profileCompleted ? (data.user.role === 'school_admin' ? '/school/complete-profile' : '/parent/complete-profile')
          : data.user.role === 'school_admin' ? '/dashboard/school'
          : data.user.role === 'super_admin'  ? '/admin/settings'
          : '/dashboard/parent'
      )
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Login failed. Please try again.')
    },
  })

  const sendOtpMutation = useMutation({
    mutationFn: () => apiPost('/auth/send-otp', { phone }),
    onSuccess: () => { setOtpSent(true); toast.success('OTP sent to your mobile!') },
    onError: () => toast.error('Failed to send OTP. Try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'otp' && !otpSent) { sendOtpMutation.mutate(); return }
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-mesh" />
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">
            Thynk<span className="text-orange-500">Schooling</span>
          </span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1">Welcome Back</h1>
          <p className="text-navy-300 text-sm mb-6">Sign in to your account to continue</p>

          {/* Mode switcher */}
          <div className="flex p-1 bg-navy-800 rounded-xl border border-surface-border mb-6">
            {(['password', 'otp'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setOtpSent(false); setOtp('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-display font-semibold transition-all ${
                  mode === m ? 'bg-orange-500 text-white shadow-orange-sm' : 'text-navy-300 hover:text-white'
                }`}
              >
                {m === 'password' ? '🔒 Password' : '📱 OTP Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-navy-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm text-navy-300 border-r border-surface-border pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/, '').slice(0, 10))}
                  className="input pl-20"
                  required
                />
              </div>
            </div>

            {/* Password or OTP */}
            {mode === 'password' ? (
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-white transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link href="/forgot-password" className="text-orange-400 text-xs hover:text-orange-300 font-display font-semibold">Forgot Password?</Link>
                </div>
              </div>
            ) : otpSent ? (
              <div>
                <label className="label">Enter OTP</label>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
                  className="input text-center text-2xl font-display tracking-widest"
                  maxLength={6}
                  required
                />
                <button type="button" onClick={() => sendOtpMutation.mutate()} className="text-orange-400 text-xs font-display font-semibold mt-1.5 hover:text-orange-300">
                  Resend OTP
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loginMutation.isPending || sendOtpMutation.isPending}
              className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending || sendOtpMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === 'otp' && !otpSent ? 'Send OTP'
                : 'Sign In'
              }
              {!loginMutation.isPending && !sendOtpMutation.isPending && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-navy-400 text-xs font-display">OR</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Google OAuth */}
          <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-surface-border bg-navy-800 text-white font-display font-semibold text-sm hover:border-orange-500/30 hover:bg-surface-hover transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-navy-400 text-sm mt-5">
            Don't have an account?{' '}
            <Link href="/register" className="text-orange-400 font-display font-semibold hover:text-orange-300">
              Sign Up Free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
