'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, School, Users } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiPost } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { User, Role } from '@/types'

const STEPS = ['Role', 'Details', 'Verify OTP']

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

  const sendOtpMutation = useMutation({
    mutationFn: () => apiPost('/auth/send-otp', { phone }),
    onSuccess: () => { setStep(2); toast.success('OTP sent to your mobile!') },
    onError:   () => toast.error('Failed to send OTP. Please try again.'),
  })

  const registerMutation = useMutation({
    mutationFn: () => apiPost<{ user: User; accessToken: string }>('/auth/register-mobile', { phone, password, role, otp }),
    onSuccess: (data) => {
      setUser(data.user)
      setAccessToken(data.accessToken)
      toast.success('Account created successfully! 🎉')
      router.push(role === 'school_admin' ? '/school/complete-profile' : '/parent/complete-profile')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Registration failed. Please try again.')
    },
  })

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match!'); return }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters.'); return }
    sendOtpMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-mesh" />
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Thynk<span className="text-orange-500">Schooling</span></span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1">Create Your Account</h1>
          <p className="text-navy-300 text-sm mb-6">Free forever for parents · Quick 2-minute setup</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs flex-shrink-0 transition-all ${
                  i < step  ? 'bg-orange-500 text-white' :
                  i === step ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400' :
                  'bg-navy-800 border border-surface-border text-navy-500'
                }`}>{i < step ? '✓' : i + 1}</div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-orange-500' : 'bg-surface-border'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Role Selection */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display font-bold text-white text-lg mb-4">I am a…</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { value: 'parent' as Role, icon: Users, label: 'Parent', desc: 'Looking for schools for my child', color: 'from-blue-500 to-blue-600' },
                    { value: 'school_admin' as Role, icon: School, label: 'School', desc: 'I manage a school and want leads', color: 'from-orange-500 to-orange-600' },
                  ].map(opt => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setRole(opt.value)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          role === opt.value
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-surface-border hover:border-orange-500/40 bg-navy-800'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="font-display font-bold text-white text-base">{opt.label}</div>
                        <div className="text-navy-400 text-xs mt-1">{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => { if (!role) { toast.error('Please select your role.'); return } setStep(1) }}
                  className="btn-primary w-full justify-center"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <label className="label">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-navy-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm text-navy-300 border-r border-surface-border pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/, '').slice(0, 10))}
                        className="input pl-20"
                        required
                        minLength={10}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        className="input pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-shrink-0">← Back</button>
                    <button type="submit" disabled={sendOtpMutation.isPending} className="btn-primary flex-1 justify-center disabled:opacity-60">
                      {sendOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📱</div>
                  <h2 className="font-display font-bold text-white text-lg">Verify Your Number</h2>
                  <p className="text-navy-300 text-sm mt-1">OTP sent to +91 {phone}</p>
                </div>

                <div className="mb-6">
                  <label className="label text-center block">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
                    className="input text-center text-3xl font-display tracking-[0.5em] py-4"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={otp.length < 6 || registerMutation.isPending}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
                >
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => setStep(1)} className="text-navy-400 hover:text-white font-display font-semibold transition-colors">← Back</button>
                  <button onClick={() => sendOtpMutation.mutate()} className="text-orange-400 hover:text-orange-300 font-display font-semibold transition-colors">Resend OTP</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-navy-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 font-display font-semibold hover:text-orange-300">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
