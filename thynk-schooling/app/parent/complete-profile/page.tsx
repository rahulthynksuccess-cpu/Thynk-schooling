'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2,
  User, MapPin, Briefcase, Heart, DollarSign, ChevronDown,
  CheckCircle2, Sparkles, BookOpen, Baby
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = [
  { label: 'Your Profile', icon: User,        desc: 'Tell us about yourself' },
  { label: 'Add Child',    icon: Baby,         desc: "Your child's details"   },
  { label: 'Done',         icon: CheckCircle2, desc: 'All set!'               },
]

/* ── Floating-label text input ── */
function FloatInput({ label, value, onChange, placeholder = '', type = 'text', icon: Icon, required = false, error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: any; required?: boolean; error?: string
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0
  return (
    <div className="tsf-field">
      {Icon && <Icon className={`tsf-icon${error ? ' err' : ''}`} size={16} />}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={active ? placeholder : ''}
        className={`tsf-input${Icon ? ' has-icon' : ''}${focused ? ' focused' : ''}${error ? ' error' : ''}`}
        required={required}
        max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
      />
      <label className={`tsf-label${active ? ' active' : ''}${Icon ? ' has-icon' : ''}${error ? ' err' : ''}`}>
        {label}{required && <span className="tsf-req">*</span>}
      </label>
      {error && <span className="tsf-err-msg">{error}</span>}
    </div>
  )
}

/* ── Animated custom select ── */
function FloatSelect({ label, value, onChange, options, icon: Icon, required = false, disabled = false, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
  icon?: any; required?: boolean; disabled?: boolean; placeholder?: string; error?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  return (
    <div className="tsf-field tsf-sel-wrap">
      {Icon && <Icon className="tsf-icon" size={16} />}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        className={`tsf-input tsf-sel-btn${Icon ? ' has-icon' : ''}${disabled ? ' disabled' : ''}${open ? ' focused' : ''}${error ? ' error' : ''}`}
        aria-expanded={open}
      >
        <span className={selected ? 'tsf-sel-val' : 'tsf-sel-ph'}>
          {selected ? selected.label : (placeholder || `— Select ${label} —`)}
        </span>
        <ChevronDown size={15} className="tsf-chev" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .22s' }} />
      </button>
      <label className={`tsf-label${value ? ' active' : ''}${Icon ? ' has-icon' : ''}${error ? ' err' : ''}`}>
        {label}{required && <span className="tsf-req">*</span>}
      </label>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tsf-overlay" onClick={() => setOpen(false)} />
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="tsf-ddlist"
            >
              {options.length === 0
                ? <li className="tsf-dd-empty">{disabled ? 'Select a state first' : 'No options — add via Admin → Dropdown Settings'}</li>
                : options.map(o => (
                  <li key={o.value} className={`tsf-dd-item${o.value === value ? ' sel' : ''}`} onClick={() => { onChange(o.value); setOpen(false) }}>
                    {o.value === value && <CheckCircle2 size={12} className="tsf-dd-chk" />}
                    {o.label}
                  </li>
                ))
              }
            </motion.ul>
          </>
        )}
      </AnimatePresence>
      {error && <span className="tsf-err-msg">{error}</span>}
    </div>
  )
}

/* ── Budget row ── */
function BudgetRow({ min, max, onMin, onMax }: { min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void }) {
  return (
    <div>
      <p className="tsf-sub-label"><DollarSign size={12} style={{ display:'inline', marginRight:4, color:'var(--tsg)' }} />Monthly School Budget (₹)</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <FloatInput label="Min Budget" value={min} onChange={onMin} placeholder="e.g. 3000"  type="number" />
        <FloatInput label="Max Budget" value={max} onChange={onMax} placeholder="e.g. 10000" type="number" />
      </div>
    </div>
  )
}

/* ── Step bar ── */
function StepBar({ step }: { step: number }) {
  return (
    <div className="tsf-stepbar">
      {STEPS.map((s, i) => {
        const Icon = s.icon; const past = i < step; const cur = i === step
        return (
          <div key={s.label} className="tsf-step">
            <motion.div className={`tsf-sc${past ? ' past' : ''}${cur ? ' cur' : ''}`} animate={cur ? { scale:[1,1.15,1] } : { scale:1 }} transition={{ duration:.4 }}>
              {past ? <CheckCircle2 size={16} /> : <Icon size={16} />}
            </motion.div>
            <div className="tsf-st">
              <span className={`tsf-sl${cur ? ' cur' : ''}`}>{s.label}</span>
              <span className="tsf-sd">{s.desc}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`tsf-conn${i < step ? ' filled' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

/* ── Page ── */
export default function ParentCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [dir,  setDir ] = useState(1)

  const [parentData, setParentData] = useState({ fullName:'', occupation:'', annualIncomeRange:'', state:'', city:'', locality:'', religion:'', budgetMin:'', budgetMax:'', howDidYouHear:'' })
  const [childData,  setChildData ] = useState({ fullName:'', dob:'', gender:'', currentClass:'', applyingForClass:'', academicYear:'', bloodGroup:'', specialNeeds:'' })

  const { options: states      } = useDropdown('state')
  const { options: allCities   } = useDropdown('city', { parentValue: parentData.state || undefined, enabled: !!parentData.state })
  const { options: occupations } = useDropdown('occupation')
  const { options: incomeRanges} = useDropdown('income_range')
  const { options: religions   } = useDropdown('religion')
  const { options: classLevels } = useDropdown('class_level')
  const { options: genders     } = useDropdown('gender')
  const { options: bloodGroups } = useDropdown('blood_group')
  const { options: academicYrs } = useDropdown('academic_year')
  const { options: howHeard    } = useDropdown('how_did_you_hear')

  useEffect(() => { setParentData(p => ({ ...p, city:'' })) }, [parentData.state])

  const pSet = (k: string, v: string) => setParentData(p => ({ ...p, [k]: v }))
  const cSet = (k: string, v: string) => setChildData(c => ({ ...c, [k]: v }))

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/parent-profiles',{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(parentData) })
      if (childData.fullName) await fetch('/api/students',{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(childData) })
      if (user) await fetch('/api/auth/complete-profile',{ method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fullName:parentData.fullName, profileCompleted:true }) })
    },
    onSuccess: () => {
      if (user) setUser({ ...user, fullName:parentData.fullName, profileCompleted:true })
      toast.success('Profile saved! Welcome to Thynk Schooling 🎉')
      router.push('/dashboard/parent')
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (forStep: number): boolean => {
    const errs: Record<string, string> = {}
    if (forStep === 0) {
      if (!parentData.fullName.trim()) errs.fullName = 'Full name is required'
    }
    if (forStep === 1) {
      if (!childData.fullName.trim())   errs.childFullName = "Child's name is required"
      if (!childData.dob)               errs.childDob      = 'Date of birth is required'
      if (!childData.applyingForClass)  errs.childClass    = 'Applying for class is required'
      if (!childData.academicYear)      errs.childYear     = 'Admission year is required'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill in the required fields')
      return false
    }
    return true
  }

  const sv = {
    enter: (d: number) => ({ opacity:0, x: d > 0 ? 40 : -40, filter:'blur(4px)' }),
    center: { opacity:1, x:0, filter:'blur(0px)' },
    exit:   (d: number) => ({ opacity:0, x: d < 0 ? 40 : -40, filter:'blur(4px)' }),
  }
  const goNext = () => {
    if (!validate(step)) return
    setErrors({})
    setDir(1)
    setStep(s => s + 1)
  }
  const goBack = () => { setErrors({}); setDir(-1); setStep(s => s - 1) }

  return (
    <>
      <style>{CSS}</style>
      <div className="tsf-page">
        <div className="tsf-inner">

          <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, ease:[.22,1,.36,1] }}>
            <Link href="/" className="tsf-logo">
              <div className="tsf-logo-icon"><GraduationCap size={24} color="#fff" /></div>
              <span className="tsf-logo-text">Thynk<span className="tsf-logo-acc">Schooling</span></span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1, duration:.5, ease:[.22,1,.36,1] }}>
            <StepBar step={step} />
          </motion.div>

          <div className="tsf-dots">
            {STEPS.map((_,i) => <div key={i} className={`tsf-dot${i===step?' active':i<step?' past':''}`} />)}
          </div>

          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15, duration:.55, ease:[.22,1,.36,1] }} className="tsf-card">
            <AnimatePresence mode="wait" custom={dir}>

              {step === 0 && (
                <motion.div key="parent" custom={dir} variants={sv} initial="enter" animate="center" exit="exit" transition={{ duration:.3, ease:[.22,1,.36,1] }}>
                  <div className="tsf-head">
                    <div className="tsf-eyebrow"><Sparkles size={10} /> Step 1 of 2</div>
                    <div className="tsf-title">Your Profile</div>
                    <div className="tsf-sub">Help us personalise your school search</div>
                  </div>
                  <div className="tsf-fields">
                    <FloatInput label="Full Name" value={parentData.fullName} onChange={v => pSet('fullName',v)} placeholder="e.g. Priya Sharma" icon={User} required error={errors.fullName} />
                    <FloatSelect label="State"             value={parentData.state}            onChange={v => pSet('state',v)}            options={states}       icon={MapPin}   />
                    <FloatSelect label="City"              value={parentData.city}             onChange={v => pSet('city',v)}             options={allCities}    icon={MapPin}    disabled={!parentData.state} placeholder={parentData.state ? '— Select City —' : 'Select state first'} />
                    <FloatInput  label="Locality / Area"  value={parentData.locality}         onChange={v => pSet('locality',v)}         placeholder="e.g. Sector 18, Noida" icon={MapPin} />
                    <FloatSelect label="Occupation"        value={parentData.occupation}       onChange={v => pSet('occupation',v)}       options={occupations}  icon={Briefcase} />
                    <FloatSelect label="Annual Income"     value={parentData.annualIncomeRange} onChange={v => pSet('annualIncomeRange',v)} options={incomeRanges} icon={DollarSign} />
                    <FloatSelect label="Religion"          value={parentData.religion}         onChange={v => pSet('religion',v)}         options={religions}    icon={Heart}     />
                    <BudgetRow min={parentData.budgetMin} max={parentData.budgetMax} onMin={v => pSet('budgetMin',v)} onMax={v => pSet('budgetMax',v)} />
                    <FloatSelect label="How did you hear about us?" value={parentData.howDidYouHear} onChange={v => pSet('howDidYouHear',v)} options={howHeard} />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="child" custom={dir} variants={sv} initial="enter" animate="center" exit="exit" transition={{ duration:.3, ease:[.22,1,.36,1] }}>
                  <div className="tsf-head">
                    <div className="tsf-eyebrow"><BookOpen size={10} /> Step 2 of 2</div>
                    <div className="tsf-title">Add Your Child</div>
                    <div className="tsf-sub">You can add more children from the dashboard later</div>
                  </div>
                  <div className="tsf-fields">
                    <FloatInput  label="Child's Full Name"   value={childData.fullName}        onChange={v => cSet('fullName',v)}        placeholder="e.g. Arjun Sharma"    icon={User}      required error={errors.childFullName} />
                    <FloatInput  label="Date of Birth"       value={childData.dob}             onChange={v => cSet('dob',v)}             type="date"                        required error={errors.childDob} />
                    <FloatSelect label="Gender"              value={childData.gender}           onChange={v => cSet('gender',v)}           options={genders}     />
                    <FloatSelect label="Blood Group"         value={childData.bloodGroup}       onChange={v => cSet('bloodGroup',v)}       options={bloodGroups} />
                    <FloatSelect label="Current Class"       value={childData.currentClass}     onChange={v => cSet('currentClass',v)}     options={classLevels} />
                    <FloatSelect label="Applying for Class"  value={childData.applyingForClass} onChange={v => cSet('applyingForClass',v)} options={classLevels} required error={errors.childClass} />
                    <FloatSelect label="Admission Year"      value={childData.academicYear}     onChange={v => cSet('academicYear',v)}     options={academicYrs} required error={errors.childYear} />
                    <FloatInput  label="Current School Name" value={childData.specialNeeds}    onChange={v => cSet('specialNeeds',v)}    placeholder="e.g. DPS Vasant Kunj" icon={BookOpen} />
                    <div className="tsf-ta-wrap">
                      <p className="tsf-sub-label">Special Learning Needs <span style={{ color:'var(--ts-ink3)', fontWeight:300, marginLeft:4 }}>(if any)</span></p>
                      <textarea value={childData.specialNeeds} onChange={e => cSet('specialNeeds', e.target.value)} placeholder="Mention any learning support or medical needs the school should know about…" className="tsf-ta" rows={3} />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="done" custom={dir} variants={sv} initial="enter" animate="center" exit="exit" transition={{ duration:.3, ease:[.22,1,.36,1] }}>
                  <div className="tsf-done">
                    <div className="tsf-done-emoji">🎉</div>
                    <div className="tsf-done-title">You're All Set!</div>
                    <p className="tsf-done-sub">Your profile is complete. Start exploring schools tailored for <strong>{childData.fullName || 'your child'}</strong>!</p>
                    <button className="tsf-btn-save" style={{ width:'100%' }} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                      {saveMutation.isPending
                        ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Saving…</>
                        : <><Save size={16} /> Save & Go to Dashboard</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 2 && (
              <div className="tsf-actions">
                <button className="tsf-btn-back" onClick={goBack} disabled={step === 0}><ArrowLeft size={15} /> Back</button>
                <button className="tsf-btn-next" onClick={goNext}>{step === 0 ? 'Add Child Profile' : 'Review & Save'} <ArrowRight size={15} /></button>
              </div>
            )}
          </motion.div>

          {step === 1 && (
            <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }} className="tsf-skip"
              onClick={() => { setErrors({}); setDir(1); setStep(2) }}>
              Skip — I'll add a child later →
            </motion.button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

const CSS = `
:root {
  --tsg: #B8860B; --tsg2: #D4A520; --tsg3: #E8C547;
  --ts-ink: #0D1117; --ts-ink2: #4A5568; --ts-ink3: #A0ADB8;
  --ts-bg: #FAF7F2; --ts-card: #fff;
  --ts-border: rgba(13,17,23,0.09);
  --ts-r: 14px;
  --ts-font: 'Cormorant Garamond', Georgia, serif;
  --ts-sans: 'Inter', system-ui, sans-serif;
}

.tsf-page {
  min-height: 100vh;
  background: var(--ts-bg);
  background-image:
    radial-gradient(ellipse 900px 600px at 5% 10%,  rgba(184,134,11,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 700px 500px at 95% 85%, rgba(184,134,11,0.06) 0%, transparent 70%);
  padding: 48px 16px 80px;
  position: relative; overflow: hidden;
}
.tsf-page::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23B8860B' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none; z-index: 0;
}
.tsf-inner { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; }

/* Logo */
.tsf-logo { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:40px; text-decoration:none; }
.tsf-logo-icon { width:48px; height:48px; background:linear-gradient(135deg,#B8860B,#E8C547); border-radius:14px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(184,134,11,0.35); }
.tsf-logo-text { font-family:var(--ts-font); font-size:26px; font-weight:700; color:var(--ts-ink); letter-spacing:-0.5px; }
.tsf-logo-acc { color:var(--tsg); }

/* Step bar */
.tsf-stepbar { display:flex; align-items:flex-start; margin-bottom:32px; }
.tsf-step { display:flex; align-items:center; flex:1; }
.tsf-sc {
  width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  background:#fff; border:1.5px solid var(--ts-border); color:var(--ts-ink3); flex-shrink:0;
  box-shadow:0 2px 8px rgba(13,17,23,0.06); transition:all .35s cubic-bezier(.22,1,.36,1); position:relative; z-index:1;
}
.tsf-sc.cur { background:linear-gradient(135deg,#B8860B,#D4A520); border-color:transparent; color:#fff; box-shadow:0 4px 20px rgba(184,134,11,0.45); transform:scale(1.12); }
.tsf-sc.past { background:rgba(184,134,11,0.1); border-color:rgba(184,134,11,0.3); color:var(--tsg); }
.tsf-st { margin-left:10px; display:flex; flex-direction:column; min-width:0; }
.tsf-sl { font-family:var(--ts-sans); font-size:12px; font-weight:600; color:var(--ts-ink3); letter-spacing:.03em; white-space:nowrap; transition:color .3s; }
.tsf-sl.cur { color:var(--tsg); }
.tsf-sd { font-size:10px; color:var(--ts-ink3); margin-top:1px; white-space:nowrap; }
.tsf-conn { flex:1; height:1.5px; background:var(--ts-border); margin:0 10px; margin-bottom:18px; border-radius:2px; position:relative; overflow:hidden; min-width:16px; }
.tsf-conn.filled::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,#B8860B,#E8C547); animation:cFill .4s ease forwards; }
@keyframes cFill { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1)} }

/* Dots */
.tsf-dots { display:flex; justify-content:center; gap:6px; margin-bottom:24px; }
.tsf-dot { width:6px; height:6px; border-radius:50%; background:var(--ts-border); transition:all .3s; }
.tsf-dot.active { width:24px; border-radius:3px; background:var(--tsg); }
.tsf-dot.past { background:rgba(184,134,11,0.35); }

/* Card */
.tsf-card {
  background:var(--ts-card); border:1px solid rgba(13,17,23,0.08);
  border-radius:24px; padding:36px 32px;
  box-shadow:0 24px 64px rgba(13,17,23,0.10), 0 1px 2px rgba(13,17,23,0.06);
  position:relative; overflow:hidden;
}
.tsf-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg,#B8860B,#E8C547,#B8860B); background-size:200% 100%;
  animation:shimmer 3s linear infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Section heading */
.tsf-head { margin-bottom:28px; }
.tsf-eyebrow { display:inline-flex; align-items:center; gap:6px; font-family:var(--ts-sans); font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--tsg); margin-bottom:6px; }
.tsf-title { font-family:var(--ts-font); font-size:30px; font-weight:700; color:var(--ts-ink); line-height:1.1; letter-spacing:-0.5px; }
.tsf-sub { font-family:var(--ts-sans); font-size:13px; color:var(--ts-ink2); margin-top:4px; font-weight:300; }

/* Fields */
.tsf-fields { display:flex; flex-direction:column; gap:18px; }
.tsf-sub-label { font-family:var(--ts-sans); font-size:12px; font-weight:500; color:var(--ts-ink2); margin-bottom:8px; display:flex; align-items:center; }
.tsf-field { position:relative; width:100%; }
.tsf-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--ts-ink3); pointer-events:none; z-index:2; transition:color .2s; }
.tsf-field:focus-within .tsf-icon { color:var(--tsg); }
.tsf-input {
  width:100%; height:54px; padding:20px 14px 6px;
  font-family:var(--ts-sans); font-size:14px; color:var(--ts-ink);
  background:#F9F7F4; border:1.5px solid var(--ts-border);
  border-radius:var(--ts-r); outline:none;
  transition:all .22s cubic-bezier(.22,1,.36,1);
  appearance:none; -webkit-appearance:none;
}
.tsf-input.has-icon { padding-left:40px; }
.tsf-input:focus, .tsf-input.focused {
  background:#fff; border-color:var(--tsg);
  box-shadow:0 0 0 3px rgba(184,134,11,0.12);
}
.tsf-input.disabled { opacity:.5; cursor:not-allowed; }
.tsf-sel-btn { cursor:pointer; display:flex; align-items:center; justify-content:space-between; text-align:left; }
.tsf-sel-val { font-size:14px; color:var(--ts-ink); }
.tsf-sel-ph  { font-size:14px; color:var(--ts-ink3); }
.tsf-chev { color:var(--ts-ink3); flex-shrink:0; }
.tsf-label {
  position:absolute; left:14px; top:50%; transform:translateY(-50%);
  font-family:var(--ts-sans); font-size:14px; color:var(--ts-ink3);
  pointer-events:none; transition:all .2s cubic-bezier(.22,1,.36,1); z-index:1;
}
.tsf-label.has-icon { left:40px; }
.tsf-label.active { top:14px; transform:translateY(0) scale(0.82); transform-origin:left; color:var(--tsg); font-weight:600; letter-spacing:.03em; }
.tsf-req { color:#E05F2E; margin-left:2px; }
.tsf-sel-wrap { position:relative; }
.tsf-overlay { position:fixed; inset:0; z-index:40; }
.tsf-ddlist {
  position:absolute; top:calc(100% + 6px); left:0; right:0;
  background:#fff; border:1.5px solid rgba(184,134,11,0.25);
  border-radius:14px; box-shadow:0 16px 48px rgba(13,17,23,0.14);
  z-index:50; max-height:240px; overflow-y:auto; padding:6px;
  scrollbar-width:thin; scrollbar-color:rgba(184,134,11,0.3) transparent;
}
.tsf-dd-item { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:9px; cursor:pointer; font-family:var(--ts-sans); font-size:13.5px; color:var(--ts-ink); transition:all .15s; list-style:none; }
.tsf-dd-item:hover { background:rgba(184,134,11,0.07); color:var(--tsg); }
.tsf-dd-item.sel { background:rgba(184,134,11,0.1); color:var(--tsg); font-weight:600; }
.tsf-dd-chk { color:var(--tsg); flex-shrink:0; }
.tsf-dd-empty { padding:16px 12px; text-align:center; font-family:var(--ts-sans); font-size:13px; color:var(--ts-ink3); list-style:none; }
.tsf-ta-wrap { display:flex; flex-direction:column; }
.tsf-ta {
  width:100%; min-height:88px; padding:14px; resize:none;
  font-family:var(--ts-sans); font-size:14px; color:var(--ts-ink);
  background:#F9F7F4; border:1.5px solid var(--ts-border);
  border-radius:var(--ts-r); outline:none; transition:all .22s;
}
.tsf-ta:focus { background:#fff; border-color:var(--tsg); box-shadow:0 0 0 3px rgba(184,134,11,0.12); }

/* Errors */
.tsf-input.error { border-color:#E05F2E; background:#FFF8F6; }
.tsf-input.error:focus { border-color:#E05F2E; box-shadow:0 0 0 3px rgba(224,95,46,0.12); }
.tsf-label.err { color:#E05F2E !important; }
.tsf-icon.err { color:#E05F2E !important; }
.tsf-err-msg {
  display:block; font-family:var(--ts-sans); font-size:11px; font-weight:500;
  color:#E05F2E; margin-top:5px; padding-left:4px;
  animation:errIn .2s ease;
}
@keyframes errIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

/* Actions */
.tsf-actions { display:flex; gap:12px; margin-top:32px; padding-top:24px; border-top:1px solid var(--ts-border); align-items:center; }
.tsf-btn-back {
  display:flex; align-items:center; gap:6px; padding:13px 20px; border-radius:12px;
  background:transparent; border:1.5px solid var(--ts-border);
  font-family:var(--ts-sans); font-size:13px; font-weight:500; color:var(--ts-ink2);
  cursor:pointer; transition:all .22s; flex-shrink:0;
}
.tsf-btn-back:hover { border-color:var(--ts-ink); color:var(--ts-ink); }
.tsf-btn-back:disabled { opacity:.35; cursor:not-allowed; }
.tsf-btn-next {
  flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
  padding:15px 28px; border-radius:12px;
  background:linear-gradient(135deg,#0D1117,#1C2333); border:none;
  font-family:var(--ts-sans); font-size:14px; font-weight:600; color:#FAF7F2;
  cursor:pointer; box-shadow:0 8px 24px rgba(13,17,23,0.22);
  transition:all .28s cubic-bezier(.22,1,.36,1); position:relative; overflow:hidden;
}
.tsf-btn-next::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent,rgba(184,134,11,0.15)); opacity:0; transition:opacity .3s; }
.tsf-btn-next:hover::after { opacity:1; }
.tsf-btn-next:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(13,17,23,0.28); }
.tsf-btn-save {
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:16px 28px; border-radius:12px;
  background:linear-gradient(135deg,#B8860B,#D4A520); border:none;
  font-family:var(--ts-sans); font-size:14px; font-weight:700; color:#fff;
  cursor:pointer; box-shadow:0 8px 32px rgba(184,134,11,0.35);
  transition:all .28s cubic-bezier(.22,1,.36,1);
}
.tsf-btn-save:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(184,134,11,0.45); }
.tsf-btn-save:disabled { opacity:.6; cursor:not-allowed; transform:none; }

/* Done */
.tsf-done { text-align:center; padding:24px 0; }
.tsf-done-emoji { font-size:64px; margin-bottom:20px; display:block; animation:bounce 1s ease-in-out; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-16px)} 60%{transform:translateY(-8px)} }
.tsf-done-title { font-family:var(--ts-font); font-size:36px; font-weight:700; color:var(--ts-ink); margin-bottom:8px; }
.tsf-done-sub { font-family:var(--ts-sans); font-size:15px; color:var(--ts-ink2); margin-bottom:32px; line-height:1.6; }

/* Skip */
.tsf-skip { display:block; text-align:center; margin-top:16px; font-family:var(--ts-sans); font-size:13px; color:var(--ts-ink3); cursor:pointer; transition:color .2s; background:none; border:none; width:100%; }
.tsf-skip:hover { color:var(--ts-ink); }

@media(max-width:480px){
  .tsf-card { padding:28px 20px; border-radius:20px; }
  .tsf-sd { display:none; }
  .tsf-title { font-size:26px; }
}
`
