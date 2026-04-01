'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, School, Users, CheckCircle2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { User, Role } from '@/types'

const STEPS = ['Choose Role', 'Your Details', 'Verify OTP']

export function RegisterClient() {
  const router = useRouter()
  const { setUser, setAccessToken } = useAuthStore()
  const [step,     setStep]     = useState(0)
  const [role,     setRole]     = useState<Role | ''>('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [otp,      setOtp]      = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [name,     setName]     = useState('')

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/auth/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await r.json()
      if (!r.ok) throw data
      return data
    },
    onSuccess: () => { setStep(2); toast.success('OTP sent to your mobile!') },
    onError: (err: any) => toast.error(err?.message || 'Failed to send OTP. Please try again.'),
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role, otp, fullName: name }),
      })
      const data = await r.json()
      // Throw with body so onError can read the message (covers 409, 400, 500)
      if (!r.ok) throw data
      return data
    },
    onSuccess: (data) => {
      if (!data.user) {
        toast.error(data.message || 'Registration failed. Please try again.')
        return
      }
      setUser(data.user)
      setAccessToken(data.accessToken)
      toast.success('Account created! Welcome to Thynk Schooling 🎉')
      router.push(role === 'school_admin' ? '/school/complete-profile' : '/parent/complete-profile')
    },
    onError: (err: any) => {
      // Surface the exact API error message (e.g. "Phone number already registered")
      toast.error(err?.message || 'Registration failed. Please try again.')
    },
  })

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) { toast.error('Please select your role'); return }
    setStep(1)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match!'); return }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters.'); return }
    sendOtpMutation.mutate()
  }

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 42px', border: '1.5px solid var(--login-input-border, rgba(13,17,23,0.12))',
    borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans,sans-serif', color: '#0D1117',
    outline: 'none', background: 'var(--login-input-bg, #fff)', boxSizing: 'border-box' as const, transition: 'border-color .15s',
  }
  const lbl: React.CSSProperties = { fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: '#4A5568', letterSpacing: '.08em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--login-bg, #FAF7F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: 460 }}>

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

          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: 'var(--login-h1-size, 30px)', color: 'var(--login-h1-color, #0D1117)', margin: '0 0 4px' }}>
            Create Your Account
          </h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096', margin: '0 0 24px', fontWeight: 300 }}>
            Free forever for parents · 2-minute setup
          </p>

          {/* Progress steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 12, transition: 'all .2s',
                    background: i < step ? '#16A34A' : i === step ? '#B8860B' : 'rgba(13,17,23,0.07)',
                    color: i <= step ? '#fff' : '#A0ADB8',
                  }}>
                    {i < step ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : i + 1}
                  </div>
                  <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: i === step ? '#B8860B' : '#A0ADB8', fontWeight: i === step ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? '#16A34A' : 'rgba(13,17,23,0.07)', margin: '0 4px', marginBottom: 16, transition: 'all .3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Role selection */}
          {step === 0 && (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>I am a…</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {([
                    { r: 'parent', icon: Users, title: 'Parent', desc: 'Find & apply to schools for my child' },
                    { r: 'school_admin', icon: School, title: 'School', desc: 'List my school & manage leads' },
                  ] as { r: Role; icon: any; title: string; desc: string }[]).map(({ r, icon: Icon, title, desc }) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{
                        padding: '18px 14px', borderRadius: 12, border: `2px solid ${role === r ? '#B8860B' : 'rgba(13,17,23,0.1)'}`,
                        background: role === r ? '#FEF7E0' : '#fff', cursor: 'pointer', textAlign: 'left' as const, transition: 'all .15s',
                        boxShadow: role === r ? '0 0 0 3px rgba(184,134,11,0.12)' : 'none',
                      }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: role === r ? '#B8860B' : 'rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, transition: 'all .15s' }}>
                        <Icon style={{ width: 18, height: 18, color: role === r ? '#fff' : '#718096' }} />
                      </div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1117', marginBottom: 4 }}>{title}</div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#718096', lineHeight: 1.4 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: role ? '#0D1117' : 'rgba(13,17,23,0.3)', borderRadius: 10, border: 'none', color: '#FAF7F2', cursor: role ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500 }}>
                Continue <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <Users style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                  <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} style={inp} required />
                </div>
              </div>
              <div>
                <label style={lbl}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                  <input type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/, '').slice(0, 10))} style={inp} required />
                </div>
              </div>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: 42 }} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0ADB8', display: 'flex' }}>
                    {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#A0ADB8' }} />
                  <input type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inp} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setStep(0)} style={{ padding: '12px', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.12)', background: '#fff', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#4A5568' }}>Back</button>
                <button type="submit" disabled={sendOtpMutation.isPending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#0D1117', borderRadius: 10, border: 'none', color: '#FAF7F2', cursor: sendOtpMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, opacity: sendOtpMutation.isPending ? .7 : 1 }}>
                  {sendOtpMutation.isPending ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <>Send OTP <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleStep3} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12 }}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#16A34A', fontWeight: 600 }}>OTP sent to +91 {phone}</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#4A5568', marginTop: 4 }}>Check your messages and enter the 6-digit code</div>
              </div>
              <div>
                <label style={lbl}>Enter OTP</label>
                <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
                  style={{ width: '100%', padding: '14px', border: '1.5px solid var(--login-input-border, rgba(13,17,23,0.12))', borderRadius: 10, fontSize: 24, fontFamily: 'DM Sans,sans-serif', color: '#0D1117', outline: 'none', background: 'var(--login-input-bg, #fff)', boxSizing: 'border-box' as const, textAlign: 'center' as const, letterSpacing: '0.3em', fontWeight: 700 }}
                  maxLength={6} required />
              </div>
              <button type="button" onClick={() => sendOtpMutation.mutate()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', fontWeight: 600, textAlign: 'center' as const }}>
                Didn't receive it? Resend OTP
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{ padding: '12px', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.12)', background: '#fff', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#4A5568' }}>Back</button>
                <button type="submit" disabled={registerMutation.isPending || otp.length < 6}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#B8860B', borderRadius: 10, border: 'none', color: '#fff', cursor: (registerMutation.isPending || otp.length < 6) ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 600, opacity: (registerMutation.isPending || otp.length < 6) ? .7 : 1 }}>
                  {registerMutation.isPending ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <>Create Account <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#718096', margin: '24px 0 0' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
