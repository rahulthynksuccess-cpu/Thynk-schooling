'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ArrowRight, ArrowLeft, Save, Loader2, User } from 'lucide-react'
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

const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: '#4A5568', fontFamily: 'inherit' }
const reqStar: React.CSSProperties = { color: '#F97316', marginLeft: 2 }
const baseInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(13,17,23,0.14)', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', color: '#0D1117',
  background: '#fff', outline: 'none',
  transition: 'border-color .18s, box-shadow .18s',
  boxSizing: 'border-box' as const,
}
const baseSelect: React.CSSProperties = {
  ...baseInput, cursor: 'pointer', appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
}
const focusStyle: React.CSSProperties = { borderColor: '#B8860B', boxShadow: '0 0 0 3px rgba(184,134,11,0.12)' }

export default function ParentCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [focused, setFocused] = useState('')

  const [pData, setPData] = useState({
    fullName: '', state: '', city: '', locality: '', pincode: '',
    occupation: '', annualIncomeRange: '', religion: '',
    budgetMin: '', budgetMax: '', howDidYouHear: '',
  })
  const [cData, setCData] = useState({
    fullName: '', dob: '', gender: '', currentClass: '',
    applyingForClass: '', academicYear: '', bloodGroup: '',
    currentSchool: '', specialNeeds: '',
  })

  // Convert state name to value format that matches parentValue in DB
  // e.g. "Maharashtra" → "maharashtra"
  const stateValue = pData.state.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and')

  // Cities: only fetch when state is selected, passing parentValue to API
  const { options: cities,      isLoading: citiesLoading } = useDropdown('city', {
    parentValue: stateValue || undefined,
    enabled: true,
  })
  const { options: occupations  } = useDropdown('occupation')
  const { options: incomeRanges } = useDropdown('income_range')
  const { options: religions    } = useDropdown('religion')
  const { options: classLevels  } = useDropdown('class_level')
  const { options: genders      } = useDropdown('gender')
  const { options: bloodGroups  } = useDropdown('blood_group')
  const { options: academicYrs  } = useDropdown('academic_year')
  const { options: howHeard     } = useDropdown('how_did_you_hear')

  const pSet = (k: string, v: string) => setPData(p => {
    const next = { ...p, [k]: v }
    if (k === 'state') next.city = '' // reset city when state changes
    return next
  })
  const cSet = (k: string, v: string) => setCData(c => ({ ...c, [k]: v }))
  const f = (id: string) => focused === id ? focusStyle : {}

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/parent-profiles', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pData) })
      if (cData.fullName) await fetch('/api/students', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cData) })
      if (user) await fetch('/api/auth?action=complete-profile', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: pData.fullName, profileCompleted: true }) })
    },
    onSuccess: () => {
      if (user) setUser({ ...user, fullName: pData.fullName, profileCompleted: true })
      toast.success('Profile saved! Welcome to Thynk Schooling 🎉')
      router.push('/dashboard/parent')
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

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

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 99, background: i <= step ? '#B8860B' : '#E2D9CC', transition: 'background .3s', marginBottom: 6 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? '#B8860B' : '#9CA3AF', letterSpacing: '0.04em' }}>{s}</span>
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
                  <h2 style={{ fontFamily: 'var(--font-display,serif)', fontWeight: 700, fontSize: 26, color: '#0D1117', margin: '0 0 6px' }}>Your Profile</h2>
                  <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>Help us personalise your school search</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Full Name */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Full Name <span style={reqStar}>*</span></label>
                    <input value={pData.fullName} onChange={e => pSet('fullName', e.target.value)}
                      onFocus={() => setFocused('fullName')} onBlur={() => setFocused('')}
                      placeholder="e.g. Priya Sharma"
                      style={{ ...baseInput, ...f('fullName') }} />
                    {!pData.fullName && focused === '' && step === 0 && false /* only show on submit */ && (
                      <span style={{ fontSize: 11, color: '#EF4444' }}>Full name is required</span>
                    )}
                  </div>

                  {/* State */}
                  <div style={fieldWrap}>
                    <label style={lbl}>State</label>
                    <select value={pData.state} onChange={e => pSet('state', e.target.value)}
                      onFocus={() => setFocused('state')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('state'), color: pData.state ? '#0D1117' : '#9CA3AF' }}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* City — fetched fresh from API using parentValue=stateValue */}
                  <div style={fieldWrap}>
                    <label style={lbl}>City</label>
                    <select value={pData.city} onChange={e => pSet('city', e.target.value)}
                      onFocus={() => setFocused('city')} onBlur={() => setFocused('')}
                      disabled={!pData.state}
                      style={{ ...baseSelect, ...f('city'), color: pData.city ? '#0D1117' : '#9CA3AF', opacity: !pData.state ? 0.55 : 1, cursor: !pData.state ? 'not-allowed' : 'pointer' }}>
                      <option value="">{!pData.state ? 'Select state first' : citiesLoading ? 'Loading cities…' : cities.length === 0 ? 'No cities found' : 'Select City'}</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Locality */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Locality / Area</label>
                    <input value={pData.locality} onChange={e => pSet('locality', e.target.value)}
                      onFocus={() => setFocused('locality')} onBlur={() => setFocused('')}
                      placeholder="e.g. Sector 18, Noida"
                      style={{ ...baseInput, ...f('locality') }} />
                  </div>

                  {/* Occupation */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Occupation</label>
                    <select value={pData.occupation} onChange={e => pSet('occupation', e.target.value)}
                      onFocus={() => setFocused('occ')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('occ'), color: pData.occupation ? '#0D1117' : '#9CA3AF' }}>
                      <option value="">Select Occupation</option>
                      {occupations.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Pincode */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Pincode</label>
                    <input
                      value={pData.pincode}
                      onChange={e => pSet('pincode', e.target.value.replace(/\D/g,'').slice(0,6))}
                      onFocus={() => setFocused('pincode')} onBlur={() => setFocused('')}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      style={{ ...baseInput, ...f('pincode') }}
                    />
                  </div>

                  {/* Annual Income */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Annual Income</label>
                    <select value={pData.annualIncomeRange} onChange={e => pSet('annualIncomeRange', e.target.value)}
                      onFocus={() => setFocused('income')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('income'), color: pData.annualIncomeRange ? '#0D1117' : '#9CA3AF' }}>
                      <option value="">Select Annual Income</option>
                      {incomeRanges.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Religion */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Religion</label>
                    <select value={pData.religion} onChange={e => pSet('religion', e.target.value)}
                      onFocus={() => setFocused('rel')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('rel'), color: pData.religion ? '#0D1117' : '#9CA3AF' }}>
                      <option value="">Select Religion</option>
                      {religions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Budget */}
                  <div style={fieldWrap}>
                    <label style={lbl}>Monthly School Budget (₹)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input type="number" value={pData.budgetMin} onChange={e => pSet('budgetMin', e.target.value)}
                        onFocus={() => setFocused('bMin')} onBlur={() => setFocused('')}
                        placeholder="Min Budget" style={{ ...baseInput, ...f('bMin') }} />
                      <input type="number" value={pData.budgetMax} onChange={e => pSet('budgetMax', e.target.value)}
                        onFocus={() => setFocused('bMax')} onBlur={() => setFocused('')}
                        placeholder="Max Budget" style={{ ...baseInput, ...f('bMax') }} />
                    </div>
                  </div>

                  {/* How did you hear */}
                  <div style={fieldWrap}>
                    <label style={lbl}>How did you hear about us?</label>
                    <select value={pData.howDidYouHear} onChange={e => pSet('howDidYouHear', e.target.value)}
                      onFocus={() => setFocused('how')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('how'), color: pData.howDidYouHear ? '#0D1117' : '#9CA3AF' }}>
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
                    <input value={cData.fullName} onChange={e => cSet('fullName', e.target.value)}
                      onFocus={() => setFocused('cName')} onBlur={() => setFocused('')}
                      placeholder="e.g. Arjun Sharma" style={{ ...baseInput, ...f('cName') }} />
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Date of Birth</label>
                    <input type="date" value={cData.dob} onChange={e => cSet('dob', e.target.value)}
                      onFocus={() => setFocused('dob')} onBlur={() => setFocused('')}
                      max={new Date().toISOString().split('T')[0]}
                      style={{ ...baseInput, ...f('dob') }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldWrap}>
                      <label style={lbl}>Gender</label>
                      <select value={cData.gender} onChange={e => cSet('gender', e.target.value)}
                        onFocus={() => setFocused('gen')} onBlur={() => setFocused('')}
                        style={{ ...baseSelect, ...f('gen'), color: cData.gender ? '#0D1117' : '#9CA3AF' }}>
                        <option value="">Select</option>
                        {genders.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div style={fieldWrap}>
                      <label style={lbl}>Blood Group</label>
                      <select value={cData.bloodGroup} onChange={e => cSet('bloodGroup', e.target.value)}
                        onFocus={() => setFocused('bg')} onBlur={() => setFocused('')}
                        style={{ ...baseSelect, ...f('bg'), color: cData.bloodGroup ? '#0D1117' : '#9CA3AF' }}>
                        <option value="">Select</option>
                        {bloodGroups.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldWrap}>
                      <label style={lbl}>Current Class</label>
                      <select value={cData.currentClass} onChange={e => cSet('currentClass', e.target.value)}
                        onFocus={() => setFocused('cc')} onBlur={() => setFocused('')}
                        style={{ ...baseSelect, ...f('cc'), color: cData.currentClass ? '#0D1117' : '#9CA3AF' }}>
                        <option value="">Select</option>
                        {classLevels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div style={fieldWrap}>
                      <label style={lbl}>Applying for Class <span style={reqStar}>*</span></label>
                      <select value={cData.applyingForClass} onChange={e => cSet('applyingForClass', e.target.value)}
                        onFocus={() => setFocused('ac')} onBlur={() => setFocused('')}
                        style={{ ...baseSelect, ...f('ac'), color: cData.applyingForClass ? '#0D1117' : '#9CA3AF' }}>
                        <option value="">Select</option>
                        {classLevels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Admission Year <span style={reqStar}>*</span></label>
                    <select value={cData.academicYear} onChange={e => cSet('academicYear', e.target.value)}
                      onFocus={() => setFocused('ay')} onBlur={() => setFocused('')}
                      style={{ ...baseSelect, ...f('ay'), color: cData.academicYear ? '#0D1117' : '#9CA3AF' }}>
                      <option value="">Select Admission Year</option>
                      {academicYrs.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Current School Name</label>
                    <input value={cData.currentSchool} onChange={e => cSet('currentSchool', e.target.value)}
                      onFocus={() => setFocused('cs')} onBlur={() => setFocused('')}
                      placeholder="e.g. DPS Vasant Kunj" style={{ ...baseInput, ...f('cs') }} />
                  </div>

                  <div style={fieldWrap}>
                    <label style={lbl}>Special Learning Needs <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                    <textarea value={cData.specialNeeds} onChange={e => cSet('specialNeeds', e.target.value)}
                      onFocus={() => setFocused('sn')} onBlur={() => setFocused('')}
                      placeholder="Mention any learning support or medical needs the school should know about…"
                      rows={3} style={{ ...baseInput, ...f('sn'), resize: 'none', minHeight: 80 }} />
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
                  Your profile is complete. Start exploring schools for{' '}
                  <strong style={{ color: '#0D1117' }}>{cData.fullName || 'your child'}</strong>!
                </p>
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 24px', borderRadius: 12, background: '#0D1117', color: '#fff', border: 'none', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', opacity: saveMutation.isPending ? 0.7 : 1 }}>
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
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.14)', background: '#fff', color: '#4A5568', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', opacity: step === 0 ? 0.4 : 1 }}>
                <ArrowLeft style={{ width: 15, height: 15 }} /> Back
              </button>
              <button
                onClick={() => {
                  if (step === 0 && !pData.fullName.trim()) { toast.error('Full name is required'); return }
                  setStep(s => s + 1)
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, background: '#0D1117', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#B8860B'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#0D1117'}>
                {step === 0 ? 'Add Child Profile' : 'Review & Save'} <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>

        {step === 1 && (
          <button onClick={() => setStep(2)}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 12, background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#4A5568'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'}>
            Skip — I'll add a child later →
          </button>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
