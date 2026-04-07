'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useDropdown } from '@/hooks/useDropdown'
import Link from 'next/link'
import {
  GraduationCap, ArrowLeft, CheckCircle2, Loader2,
  Phone, Mail, User, BookOpen, MapPin, AlertCircle, ChevronDown,
} from 'lucide-react'

interface SchoolInfo {
  id: string; name: string; city: string; state: string
  logo_url?: string; school_type?: string; board?: string[]
}

// ─── Custom Dropdown — escapes parent overflow:hidden via fixed positioning ──
function CustomSelect({
  value, onChange, options, placeholder, icon: Icon,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  icon?: React.ElementType
}) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropH = Math.min(options.length * 40 + 16, 280)
      const openUp = spaceBelow < dropH && rect.top > dropH
      setDropStyle({
        position: 'fixed',
        top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 bg-white border border-[#D4B483] rounded-xl px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/40 hover:border-[#B8860B] transition-colors"
      >
        {Icon && <Icon className="w-4 h-4 text-[#B8860B] flex-shrink-0" />}
        <span className={`flex-1 ${selected ? "text-[#2C1810]" : "text-[#9B8860]"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#B8860B] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div style={{ ...dropStyle, background: "#fff", border: "1px solid #D4B483", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#9B8860", background: "none", border: "none", cursor: "pointer", display: "block" }}
            >
              {placeholder}
            </button>
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13,
                  background: value === o.value ? "#FFF3D4" : "none",
                  color: value === o.value ? "#B8860B" : "#2C1810",
                  fontWeight: value === o.value ? 600 : 400,
                  border: "none", cursor: "pointer", display: "block",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


const inp = "w-full bg-white border border-[#D4B483] rounded-xl px-4 py-3 text-[#2C1810] placeholder-[#9B8860] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/40 focus:border-[#B8860B] text-sm transition-colors"

export default function ApplyPage() {
  const params   = useParams()
  const schoolId = params.schoolId as string

  const { user, accessToken } = useAuthStore()
  const [mounted, setMounted]       = useState(false)
  const [school, setSchool]         = useState<SchoolInfo | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const { options: classOptions } = useDropdown('class_level')
  const { options: howOptions }   = useDropdown('how_did_you_hear')

  const [form, setForm] = useState({
    parentName: '', phone: '', email: '',
    childName: '', classApplyingFor: '',
    message: '', howDidYouHear: '',
  })

  // Pre-fill from logged-in parent profile
  useEffect(() => {
    setMounted(true)
    if (user) {
      setForm(f => ({
        ...f,
        parentName: user.fullName || '',
        email:      (user as any).email || '',
        phone:      user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (!schoolId) return
    fetch(`/api/schools?schoolId=${schoolId}`)
      .then(r => r.json())
      .then(d => setSchool(d.school || (d.data && d.data[0]) || null))
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
        method: 'POST', headers, credentials: 'include',
        body: JSON.stringify({ schoolId, ...form }),
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

  const pageBg = { background: 'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 60%,#EEE0C0 100%)', minHeight: '100vh' }

  if (loading) return (
    <div style={pageBg} className="flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#B8860B] animate-spin" />
    </div>
  )

  if (done) return (
    <div style={pageBg} className="flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#2C1810] mb-3">Application Submitted!</h1>
        <p className="text-[#6B5744] mb-2">
          Your enquiry has been sent to <span className="text-[#B8860B] font-semibold">{school?.name || 'the school'}</span>.
        </p>
        <p className="text-[#9B8860] text-sm mb-8">
          The school team will contact you on <span className="text-[#2C1810] font-medium">{form.phone}</span> within 1–2 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/schools" className="px-5 py-2.5 bg-[#B8860B] hover:bg-[#9A7009] text-white rounded-xl font-semibold text-sm transition-colors">
            Browse More Schools
          </Link>
          <Link href="/dashboard/parent" className="px-5 py-2.5 bg-white hover:bg-[#FDF6E9] text-[#2C1810] rounded-xl font-semibold text-sm transition-colors border border-[#D4B483]">
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={pageBg}>
      {/* Header */}
      <div className="border-b border-[#D4B483]/60 bg-white/60 backdrop-blur-sm px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link href="/schools" className="p-2 rounded-lg hover:bg-[#FDF6E9] transition-colors text-[#9B8860] hover:text-[#B8860B]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8860B]/15 border border-[#B8860B]/30 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#B8860B]" />
            </div>
            <span className="font-bold text-sm text-[#2C1810]">Thynk Schooling</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* School banner */}
        {school && (
          <div className="bg-white/80 border border-[#D4B483] rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-[#FDF6E9] border border-[#D4B483] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {school.logo_url
                ? <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain p-1" />
                : <GraduationCap className="w-7 h-7 text-[#B8860B]" />}
            </div>
            <div>
              <h2 className="font-bold text-[#2C1810] text-base leading-tight">{school.name}</h2>
              <p className="text-[#9B8860] text-sm mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {school.city}{school.state ? `, ${school.state}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white/80 border border-[#D4B483] rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-[#2C1810] mb-1">Enquire &amp; Apply</h1>
          <p className="text-[#9B8860] text-sm mb-6">Fill in your details and the school will contact you directly.</p>

          <div className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                Your Name <span className="text-[#B8860B]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B] pointer-events-none" />
                <input className={`${inp} pl-10`} placeholder="e.g. Rahul Sharma" value={form.parentName} onChange={e => set('parentName', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                  Phone <span className="text-[#B8860B]">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B] pointer-events-none" />
                  <input className={`${inp} pl-10`} placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B] pointer-events-none" />
                  <input className={`${inp} pl-10`} placeholder="you@example.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                  Child's Name <span className="text-[#B8860B]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B] pointer-events-none" />
                  <input className={`${inp} pl-10`} placeholder="e.g. Aanya Sharma" value={form.childName} onChange={e => set('childName', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                  Class Applying For <span className="text-[#B8860B]">*</span>
                </label>
                <CustomSelect
                  value={form.classApplyingFor}
                  onChange={v => set('classApplyingFor', v)}
                  options={classOptions}
                  placeholder="Select class"
                  icon={BookOpen}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                Message <span className="text-[#9B8860] font-normal normal-case">(optional)</span>
              </label>
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
                <label className="block text-xs font-semibold text-[#6B5744] uppercase tracking-wider mb-1.5">
                  How did you hear about us?
                </label>
                <CustomSelect
                  value={form.howDidYouHear}
                  onChange={v => set('howDidYouHear', v)}
                  options={howOptions}
                  placeholder="Select option"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-[#B8860B] hover:bg-[#9A7009] disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Enquiry'}
            </button>

            <p className="text-center text-[#9B8860] text-xs">
              By submitting, you agree to be contacted by the school. Your details are shared only with this school.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
