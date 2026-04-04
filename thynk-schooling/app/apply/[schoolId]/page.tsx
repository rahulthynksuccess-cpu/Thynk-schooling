'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useDropdown } from '@/hooks/useDropdown'
import Link from 'next/link'
import {
  GraduationCap, ArrowLeft, CheckCircle2, Loader2,
  Phone, Mail, User, BookOpen, MapPin, AlertCircle,
} from 'lucide-react'

interface SchoolInfo {
  id: string; name: string; city: string; state: string
  logo_url?: string; school_type?: string; board?: string[]
  monthly_fee_min?: number; monthly_fee_max?: number
}

export default function ApplyPage() {
  const router   = useRouter()
  const params   = useParams()
  const schoolId = params.schoolId as string

  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [school, setSchool]   = useState<SchoolInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const { options: classOptions } = useDropdown('class_level')
  const { options: howOptions }   = useDropdown('how_did_you_hear')

  const [form, setForm] = useState({
    parentName: '', phone: '', email: '',
    childName: '', classApplyingFor: '',
    message: '', howDidYouHear: '',
  })

  useEffect(() => {
    setMounted(true)
    // Pre-fill from user profile
    if (user) setForm(f => ({ ...f, parentName: user.fullName || '', email: (user as any).email || '' }))
  }, [user])

  useEffect(() => {
    if (!schoolId) return
    // Fetch school info by ID via listing route
    fetch(`/api/schools?schoolId=${schoolId}`)
      .then(r => r.json())
      .then(d => {
        // Try direct data or first result
        const s = d.school || (d.data && d.data[0]) || null
        setSchool(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [schoolId])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.parentName.trim()) { setError('Please enter your name'); return }
    if (!form.phone.trim())      { setError('Please enter your phone number'); return }
    if (!form.childName.trim())  { setError('Please enter your child\'s name'); return }
    if (!form.classApplyingFor)  { setError('Please select the class applying for'); return }
    setError('')
    setSubmitting(true)

    try {
      const token = accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('ts_access_token') : '') || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          schoolId,
          parentName: form.parentName,
          phone: form.phone,
          email: form.email,
          childName: form.childName,
          classApplyingFor: form.classApplyingFor,
          message: form.message,
          howDidYouHear: form.howDidYouHear,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit application')
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  if (loading) return (
    <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Application Submitted!</h1>
        <p className="text-slate-400 mb-2">
          Your enquiry has been sent to <span className="text-orange-400 font-semibold">{school?.name || 'the school'}</span>.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          The school team will contact you on <span className="text-white font-medium">{form.phone}</span> within 1–2 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/schools" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors">
            Browse More Schools
          </Link>
          <Link href="/dashboard/parent" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-colors border border-white/10">
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  )

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400/50 text-sm font-sans"

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link href={`/schools`} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-orange-400" />
            </div>
            <span className="font-semibold text-sm text-white">Thynk Schooling</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* School info banner */}
        {school && (
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {school.logo_url
                ? <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain p-1" />
                : <GraduationCap className="w-7 h-7 text-orange-400" />}
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">{school.name}</h2>
              <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {school.city}{school.state ? `, ${school.state}` : ''}
              </p>
            </div>
          </div>
        )}

        <h1 className="text-xl font-bold text-white mb-1">Enquire &amp; Apply</h1>
        <p className="text-slate-400 text-sm mb-6">Fill in your details and the school will contact you directly.</p>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Your Name <span className="text-orange-400">*</span></label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input className={`${inp} pl-10`} placeholder="e.g. Rahul Sharma" value={form.parentName} onChange={e => set('parentName', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone <span className="text-orange-400">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className={`${inp} pl-10`} placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className={`${inp} pl-10`} placeholder="you@example.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Child's Name <span className="text-orange-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className={`${inp} pl-10`} placeholder="e.g. Aanya Sharma" value={form.childName} onChange={e => set('childName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Class Applying For <span className="text-orange-400">*</span></label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select className={`${inp} pl-10 appearance-none`} value={form.classApplyingFor} onChange={e => set('classApplyingFor', e.target.value)}>
                  <option value="">Select class</option>
                  {classOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message (optional)</label>
            <textarea
              className={inp}
              rows={3}
              placeholder="Any specific questions or requirements for the school…"
              value={form.message}
              onChange={e => set('message', e.target.value)}
            />
          </div>

          {howOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">How did you hear about us?</label>
              <select className={`${inp} appearance-none`} value={form.howDidYouHear} onChange={e => set('howDidYouHear', e.target.value)}>
                <option value="">Select option</option>
                {howOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Enquiry'}
          </button>

          <p className="text-center text-slate-500 text-xs">
            By submitting, you agree to be contacted by the school. Your details are shared only with this school.
          </p>
        </div>
      </div>
    </div>
  )
}
