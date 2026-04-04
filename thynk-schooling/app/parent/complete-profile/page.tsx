'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ArrowRight, ArrowLeft, Save, Loader2, User, MapPin, Briefcase, DollarSign, Heart, Star } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Your Profile', 'Add Child', 'Done']

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi',
  'Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
]

/* ── Shared field styles ── */
const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
  color: '#4A5568', fontFamily: 'inherit',
}
const reqStar: React.CSSProperties = { color: '#F97316', marginLeft: 2 }
const inputS: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(13,17,23,0.14)',
  borderRadius: 10, fontSize: 14,
  fontFamily: 'inherit', color: '#0D1117',
  background: '#fff', outline: 'none',
  transition: 'border-color .18s, box-shadow .18s',
  boxSizing: 'border-box' as const,
}
const selectS: React.CSSProperties = {
  ...inputS,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
}

export default function ParentCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [parentData, setParentData] = useState({
    fullName: '', state: '', city: '', locality: '',
    occupation: '', annualIncomeRange: '', religion: '',
    budgetMin: '', budgetMax: '', howDidYouHear: '',
  })
  const [childData, setChildData] = useState({
    fullName: '', dob: '', gender: '', currentClass: '',
    applyingForClass: '', academicYear: '', bloodGroup: '',
    currentSchool: '', specialNeeds: '',
  })

  const { options: allCities   } = useDropdown('city')
  const { options: occupations } = useDropdown('occupation')
  const { options: incomeRanges} = useDropdown('income_range')
  const { options: religions   } = useDropdown('religion')
  const { options: classLevels } = useDropdown('class_level')
  const { options: genders     } = useDropdown('gender')
  const { options: bloodGroups } = useDropdown('blood_group')
  const { options: academicYrs } = useDropdown('academic_year')
  const { options: howHeard    } = useDropdown('how_did_you_hear')

  // Filter cities by selected state
  const filteredCities = parentData.state
    ? allCities.filter(c =>
        (c as any).parentValue?.toLowerCase().replace(/\s+/g,'_') ===
        parentData.state.toLowerCase().replace(/\s+/g,'_') ||
        (c as any).state?.toLowerCase() === parentData.state.toLowerCase()
      )
    : allCities

  const pSet = (k: string, v: string) => {
    setParentData(p => {
      const next = { ...p, [k]: v }
      // Reset city if state changes
      if (k === 'state') next.city = ''
      return next
    })
  }
  const cSet = (k: string, v: string) => setChildData(c => ({ ...c, [k]: v }))

  const getFocusStyle = (id: string): React.CSSProperties =>
    focusedField === id ? { borderColor: '#B8860B', boxShadow: '0 0 0 3px rgba(184,134,11,0.12)' } : {}

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/parent-profiles', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentData),
      })
      if (childData.fullName) {
        await fetch('/api/students', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childData),
        })
      }
      if (user) {
        await fetch('/api/auth/complete-profile', {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: parentData.fullName, profileCompleted: true }),
        })
      }
    },
    onSuccess: () => {
      if (user) setUser({ ...user, fullName: parentData.fullName, profileCompleted: true })
      toast.success('Profile saved! Welcome to Thynk Schooling 🎉')
      router.push('/dashboard/parent')
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  const canProceedStep0 = parentData.fullName.trim().length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--hero-bg,#FAF7F2)', padding: '40px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
          <div style={{ width: 42, height: 42, background: '#B8860B', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}>
            <GraduationCap style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display,serif)', fontWeight: 700, fontSize: 20, color: '#0D1117' }}>
            Thynk<span style={{ color: '#B8860B' }}>Schooling</span>
          </span>
        </Link>

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 99, background: i <= step ? '#B8860B' : '#E2D9CC', transition: 'background .3s', marginBottom: 6 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? '#B8860B' : '#9CA3AF', fontFamily: 'inherit', letterSpacing: '0.04em' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 4px 32px rgba(13,17,23,0.08)', padding: '32px 28px' }}>
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Parent Profile ── */}
            {step === 0 && (
              <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 6 }}>✦ STEP 1 OF 2</div>
                  <h2 style={{ fontFamily: 'var(--font-display,serif)', fontWeight: 700, fontSize: 26, color: '#0D1117', margin: '0 0 6px', lineHeight: 1.2 }}>Your Profile</h2>
                  <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>Help us personalise your school search</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Full Name */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Full Name <span style={reqStar}>*</span></label>
                    <input
                      value={parentData.fullName}
                      onChange={e => pSet('fullName', e.target.value)}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. Priya Sharma"
                      style={{ ...inputS, ...getFocusStyle('fullName') }}
                    />
                  </div>

                  {/* State */}
                  <div style={fieldWrap}>
                    <label style={lbl}>State</label>
                    <select
                      value={parentData.state}
                      onChange={e => pSet('state', e.target.value)}
                      onFocus={() => setFocusedField('state')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('state'), color: parentData.state ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* City */}
                  <div style={fieldWrap}>
                    <label style={lbl}>City</label>
                    <select
                      value={parentData.city}
                      onChange={e => pSet('city', e.target.value)}
                      onFocus={() => setFocusedField('city')}
                      onBlur={() => setFocusedField(null)}
                      disabled={!parentData.state && filteredCities.length === allCities.length && allCities.length > 100}
                      style={{ ...selectS, ...getFocusStyle('city'), color: parentData.city ? '#0D1117' : '#9CA3AF', opacity: (!parentData.state && allCities.length > 100) ? 0.6 : 1 }}
                    >
                      <option value="">{!parentData.state && allCities.length > 100 ? 'Select state first' : 'Select City'}</option>
                      {filteredCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Locality */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Locality / Area</label>
                    <input
                      value={parentData.locality}
                      onChange={e => pSet('locality', e.target.value)}
                      onFocus={() => setFocusedField('locality')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. Sector 18, Noida"
                      style={{ ...inputS, ...getFocusStyle('locality') }}
                    />
                  </div>

                  {/* Occupation */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Occupation</label>
                    <select
                      value={parentData.occupation}
                      onChange={e => pSet('occupation', e.target.value)}
                      onFocus={() => setFocusedField('occupation')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('occupation'), color: parentData.occupation ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select Occupation</option>
                      {occupations.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Annual Income */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Annual Income</label>
                    <select
                      value={parentData.annualIncomeRange}
                      onChange={e => pSet('annualIncomeRange', e.target.value)}
                      onFocus={() => setFocusedField('income')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('income'), color: parentData.annualIncomeRange ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select Annual Income</option>
                      {incomeRanges.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Religion */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Religion</label>
                    <select
                      value={parentData.religion}
                      onChange={e => pSet('religion', e.target.value)}
                      onFocus={() => setFocusedField('religion')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('religion'), color: parentData.religion ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select Religion</option>
                      {religions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Budget */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Monthly School Budget (₹)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input
                        type="number" value={parentData.budgetMin}
                        onChange={e => pSet('budgetMin', e.target.value)}
                        onFocus={() => setFocusedField('budgetMin')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Min Budget"
                        style={{ ...inputS, ...getFocusStyle('budgetMin') }}
                      />
                      <input
                        type="number" value={parentData.budgetMax}
                        onChange={e => pSet('budgetMax', e.target.value)}
                        onFocus={() => setFocusedField('budgetMax')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Max Budget"
                        style={{ ...inputS, ...getFocusStyle('budgetMax') }}
                      />
                    </div>
                  </div>

                  {/* How did you hear */}
                  <div style={fieldWrap}>
                    <label style={lbl}>How did you hear about us?</label>
                    <select
                      value={parentData.howDidYouHear}
                      onChange={e => pSet('howDidYouHear', e.target.value)}
                      onFocus={() => setFocusedField('howHeard')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('howHeard'), color: parentData.howDidYouHear ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select how you heard about us</option>
                      {howHeard.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Child Profile ── */}
            {step === 1 && (
              <motion.div key="child" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User style={{ width: 20, height: 20, color: '#4F46E5' }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display,serif)', fontWeight: 700, fontSize: 22, color: '#0D1117', margin: '0 0 3px' }}>Add Your Child</h2>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>You can add more children from your dashboard later.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div style={fieldWrap}>
                    <label style={lbl}>Child's Full Name <span style={reqStar}>*</span></label>
                    <input
                      value={childData.fullName}
                      onChange={e => cSet('fullName', e.target.value)}
                      onFocus={() => setFocusedField('cName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. Arjun Sharma"
                      style={{ ...inputS, ...getFocusStyle('cName') }}
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Date of Birth</label>
                    <input
                      type="date" value={childData.dob}
                      onChange={e => cSet('dob', e.target.value)}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      max={new Date().toISOString().split('T')[0]}
                      style={{ ...inputS, ...getFocusStyle('dob') }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldWrap}>
                      <label style={lbl}>Gender</label>
                      <select
                        value={childData.gender}
                        onChange={e => cSet('gender', e.target.value)}
                        onFocus={() => setFocusedField('gender')}
                        onBlur={() => setFocusedField(null)}
                        style={{ ...selectS, ...getFocusStyle('gender'), color: childData.gender ? '#0D1117' : '#9CA3AF' }}
                      >
                        <option value="">Select</option>
                        {genders.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div style={fieldWrap}>
                      <label style={lbl}>Blood Group</label>
                      <select
                        value={childData.bloodGroup}
                        onChange={e => cSet('bloodGroup', e.target.value)}
                        onFocus={() => setFocusedField('blood')}
                        onBlur={() => setFocusedField(null)}
                        style={{ ...selectS, ...getFocusStyle('blood'), color: childData.bloodGroup ? '#0D1117' : '#9CA3AF' }}
                      >
                        <option value="">Select</option>
                        {bloodGroups.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldWrap}>
                      <label style={lbl}>Current Class</label>
                      <select
                        value={childData.currentClass}
                        onChange={e => cSet('currentClass', e.target.value)}
                        onFocus={() => setFocusedField('curClass')}
                        onBlur={() => setFocusedField(null)}
                        style={{ ...selectS, ...getFocusStyle('curClass'), color: childData.currentClass ? '#0D1117' : '#9CA3AF' }}
                      >
                        <option value="">Select</option>
                        {classLevels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div style={fieldWrap}>
                      <label style={lbl}>Applying for Class <span style={reqStar}>*</span></label>
                      <select
                        value={childData.applyingForClass}
                        onChange={e => cSet('applyingForClass', e.target.value)}
                        onFocus={() => setFocusedField('appClass')}
                        onBlur={() => setFocusedField(null)}
                        style={{ ...selectS, ...getFocusStyle('appClass'), color: childData.applyingForClass ? '#0D1117' : '#9CA3AF' }}
                      >
                        <option value="">Select</option>
                        {classLevels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Admission Year <span style={reqStar}>*</span></label>
                    <select
                      value={childData.academicYear}
                      onChange={e => cSet('academicYear', e.target.value)}
                      onFocus={() => setFocusedField('acYear')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...selectS, ...getFocusStyle('acYear'), color: childData.academicYear ? '#0D1117' : '#9CA3AF' }}
                    >
                      <option value="">Select Admission Year</option>
                      {academicYrs.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Current School Name</label>
                    <input
                      value={childData.currentSchool}
                      onChange={e => cSet('currentSchool', e.target.value)}
                      onFocus={() => setFocusedField('curSchool')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. DPS Vasant Kunj"
                      style={{ ...inputS, ...getFocusStyle('curSchool') }}
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Special Learning Needs <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      value={childData.specialNeeds}
                      onChange={e => cSet('specialNeeds', e.target.value)}
                      onFocus={() => setFocusedField('special')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Mention any learning support or medical needs the school should know about…"
                      rows={3}
                      style={{ ...inputS, ...getFocusStyle('special'), resize: 'none', minHeight: 80 }}
                    />
                  </div>

                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Done ── */}
            {step === 2 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontFamily: 'var(--font-display,serif)', fontWeight: 700, fontSize: 26, color: '#0D1117', marginBottom: 8 }}>You're All Set!</h2>
                <p style={{ fontSize: 14, color: '#718096', marginBottom: 28, lineHeight: 1.6 }}>
                  Your profile is complete. Start exploring schools for <strong style={{ color: '#0D1117' }}>{childData.fullName || 'your child'}</strong>!
                </p>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 24px', borderRadius: 12, background: '#0D1117', color: '#fff', border: 'none', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', opacity: saveMutation.isPending ? 0.7 : 1, transition: 'all .2s' }}
                >
                  {saveMutation.isPending
                    ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : <><Save style={{ width: 16, height: 16 }} /> Save & Go to Dashboard</>
                  }
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 2 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(13,17,23,0.08)' }}>
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.14)', background: '#fff', color: '#4A5568', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', opacity: step === 0 ? 0.4 : 1 }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} /> Back
              </button>
              <button
                onClick={() => {
                  if (step === 0 && !canProceedStep0) { toast.error('Full name is required'); return }
                  setStep(s => s + 1)
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, background: '#0D1117', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', transition: 'background .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#B8860B'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#0D1117'}
              >
                {step === 0 ? 'Add Child Profile' : 'Review & Save'} <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>

        {step === 1 && (
          <button
            onClick={() => setStep(2)}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 12, background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#4A5568'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'}
          >
            Skip — I'll add a child later →
          </button>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
