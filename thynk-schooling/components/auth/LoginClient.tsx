'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types'

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
    mutationFn: async () => {
      const endpoint = mode === 'password' ? '/api/auth/login-mobile' : '/api/auth/login-otp'
      const body     = mode === 'password' ? { phone, password } : { phone, otp }
      const res = await fetch(endpoint, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      return data as { user: User; accessToken: string }
    },
    onSuccess: (data) => {
      setUser(data.user)
      setAccessToken(data.accessToken)
      toast.success(`Welcome back, ${data.user.fullName || 'there'}!`)
      router.push(
        !data.user.profileCompleted ? (data.user.role === 'school_admin' ? '/school/complete-profile' : '/parent/complete-profile')
          : data.user.role === 'school_admin' ? '/dashboard/school'
          : data.user.role === 'super_admin'  ? '/admin'
          : '/dashboard/parent'
      )
    },
    onError: (err: unknown) => toast.error((err as Error)?.message || 'Login failed. Please try again.'),
  })

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/send-otp', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP')
      return data
    },
    onSuccess: () => { setOtpSent(true); toast.success('OTP sent to your mobile!') },
    onError: () => toast.error('Failed to send OTP. Try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'otp' && !otpSent) { sendOtpMutation.mutate(); return }
    loginMutation.mutate()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 42px', border: '1.5px solid var(--login-input-border, rgba(13,17,23,0.12))',
    borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans,sans-serif', color: '#0D1117',
    outline: 'none', background: 'var(--login-input-bg, #fff)', boxSizing: 'border-box' as const, transition: 'border-color .15s'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--login-bg, #FAF7F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#B8860B,#E5B64A)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(184,134,11,0.3)' }}>
            <GraduationCap style={{ width: 24, height: 24, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 24, color: '#0D1117' }}>
            Thynk<span style={{ color: '#B8860B' }}>Schooling</span>
          </span>
        </Link>

        {/* Card */}
        <div style={{ background: 'var(--login-card-bg, #fff)', border: '1px solid rgba(13,17,23,0.09)', borderRadius: 18, padding: '36px 32px', boxShadow: '0 8px 40px rgba(13,17,23,0.08)' }}>

          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 'var(--login-h1-size, 30px)', color: 'var(--login-h1-color, #0D1117)', margin: '0 0 6px' }}>
            Welcome Back
          </h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096', margin: '0 0 24px', fontWeight: 300 }}>
            Sign in to your Thynk Schooling account
          </p>

          {/* Mode tabs */}
          <div style={{ display: 'flex', background: '#F5F0E8', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(['password','otp'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setOtpSent(false); setOtp('') }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? '#0D1117' : '#718096',
                  boxShadow: mode === m ? '0 1px 6px rgba(13,17,23,0.1)' : 'none' }}>
                {m === 'password' ? '🔒 Password' : '📱 OTP Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Phone */}
            <div>
              <label style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#4A5568', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                <input type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/, '').slice(0, 10))} style={inp} required />
              </div>
            </div>

            {mode === 'password' ? (
              <div>
                <label style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#4A5568', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: 42 }} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0ADB8', display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <Link href="/forgot-password" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#B8860B', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
                </div>
              </div>
            ) : otpSent ? (
              <div>
                <label style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#4A5568', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Enter OTP</label>
                <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))} style={{ ...inp, paddingLeft: 14, textAlign: 'center', fontSize: 20, letterSpacing: '0.3em', fontWeight: 700 }} maxLength={6} required />
                <button type="button" onClick={() => sendOtpMutation.mutate()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#B8860B', fontWeight: 600, marginTop: 6, padding: 0 }}>Resend OTP</button>
              </div>
            ) : null}

            <button type="submit" disabled={loginMutation.isPending || sendOtpMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: '#0D1117', borderRadius: 10, border: 'none', color: '#FAF7F2', cursor: loginMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, opacity: loginMutation.isPending ? .7 : 1, transition: 'all .15s' }}>
              {loginMutation.isPending || sendOtpMutation.isPending
                ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                : mode === 'otp' && !otpSent ? 'Send OTP' : 'Sign In'
              }
              {!loginMutation.isPending && !sendOtpMutation.isPending && <ArrowRight style={{ width: 16, height: 16 }} />}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(13,17,23,0.09)' }} />
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#A0ADB8' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(13,17,23,0.09)' }} />
          </div>

          <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.1)', background: '#fff', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, color: '#0D1117', transition: 'all .15s' }}>
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096', margin: '20px 0 0' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>Sign Up Free</Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div style={{ background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096' }}>
          <strong style={{ color: '#B8860B' }}>Test accounts:</strong> School: <code>9000000001</code> / <code>School@123</code> — Parent: <code>9000000002</code> / <code>Parent@123</code>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
