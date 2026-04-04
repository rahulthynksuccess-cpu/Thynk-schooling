'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2, Upload,
  MapPin, Phone, Mail, Globe, DollarSign, Users, BookOpen,
  CheckCircle2, X, School, Building2, Trophy, Languages,
  Music, Dumbbell, FlaskConical, Check
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

/* ── design tokens (matches site globals) ── */
const C = {
  bg:     '#FAF7F2',
  card:   '#FFFFFF',
  bdr:    'rgba(13,17,23,0.1)',
  ink:    '#0D1117',
  muted:  '#718096',
  faint:  '#A0ADB8',
  gold:   '#B8860B',
  goldBg: '#FEF7E0',
  serif:  "'Cormorant Garamond',Georgia,serif",
  sans:   "'Inter',system-ui,sans-serif",
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1.5px solid ${C.bdr}`, borderRadius: 10,
  fontSize: 13, fontFamily: C.sans, color: C.ink,
  background: C.card, outline: 'none', boxSizing: 'border-box' as const,
  transition: 'border-color .18s, box-shadow .18s',
}
const inpFocus: React.CSSProperties = { borderColor: C.gold, boxShadow: `0 0 0 3px rgba(184,134,11,0.1)` }
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10.5, fontWeight: 700,
  letterSpacing: '.08em', textTransform: 'uppercase' as const,
  color: C.faint, marginBottom: 5, fontFamily: C.sans,
}

const STEPS = [
  { label: 'Basic Info',        short: 'Basics',   icon: School },
  { label: 'Type & Board',      short: 'Type',     icon: GraduationCap },
  { label: 'Classes & Fees',    short: 'Fees',     icon: DollarSign },
  { label: 'Facilities',        short: 'Facilities',icon: Building2 },
  { label: 'Location',          short: 'Location', icon: MapPin },
  { label: 'Contact & Media',   short: 'Contact',  icon: Phone },
]

type FD = Record<string, string | string[] | number | boolean>

const MAX_MB = 2
const MAX_BYTES = MAX_MB * 1024 * 1024
const IMG_TYPES = ['image/jpeg','image/png','image/webp']

export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [focused, setFocused] = useState('')
  const [formData, setFormData] = useState<FD>({
    board: [], facilities: [], sports: [], extraCurricular: [],
    languagesOffered: [], infrastructure: [], admissionOpen: false,
  })
  const [logoFile,  setLogoFile]  = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  /* all dropdowns from DB — zero hardcoding */
  const { options: boards         } = useDropdown('board')
  const { options: schoolTypes    } = useDropdown('school_type')
  const { options: genderPolicies } = useDropdown('gender_policy')
  const { options: mediums        } = useDropdown('medium')
  const { options: religions      } = useDropdown('religion')
  const { options: recognitions   } = useDropdown('recognition')
  const { options: classLevels    } = useDropdown('class_level')
  const { options: states         } = useDropdown('state')
  const { options: cities, isLoading: citiesLoading } = useDropdown('city', {
    parentValue: formData.state as string,
    enabled: !!formData.state,
  })
  const { options: academicYears  } = useDropdown('academic_year')
  const { options: facilitiesOpts } = useDropdown('facility')
  const { options: sportsOpts     } = useDropdown('sport')
  const { options: extraCurrOpts  } = useDropdown('extra_curricular')
  const { options: languageOpts   } = useDropdown('language')

  const set = (k: string, v: FD[string]) => setFormData(p => ({ ...p, [k]: v }))
  const toggle = (k: string, v: string) => {
    const arr = (formData[k] as string[]) || []
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }
  const f = (id: string): React.CSSProperties => focused === id ? inpFocus : {}

  const handleImg = (file: File | null, setter: (f: File | null) => void, label: string) => {
    if (!file) { setter(null); return }
    if (!IMG_TYPES.includes(file.type)) { toast.error(`${label}: JPG, PNG or WEBP only`); return }
    if (file.size > MAX_BYTES) { toast.error(`${label} too large. Max ${MAX_MB} MB`); return }
    setter(file)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(i => fd.append(k, i))
        else fd.append(k, String(v))
      })
      if (logoFile)  fd.append('logo',  logoFile)
      if (coverFile) fd.append('cover', coverFile)
      const r = await fetch('/api/schools/profile', { method: 'POST', credentials: 'include', body: fd })
      const data = await r.json()
      if (!r.ok) throw data
      return data
    },
    onSuccess: async () => {
      await fetch('/api/auth/complete-profile', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileCompleted: true }) })
      if (user) setUser({ ...user, profileCompleted: true })
      toast.success('School profile saved! 🎉')
      router.push('/dashboard/school')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save. Please try again.'),
  })

  /* ── sub-components ── */
  const Field = ({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: C.gold, marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  )

  const Sel = ({ id, label, fieldKey, options, required, disabled, placeholder }: {
    id: string; label: string; fieldKey: string
    options: { label: string; value: string }[]; required?: boolean; disabled?: boolean; placeholder?: string
  }) => (
    <Field id={id} label={label} required={required}>
      <select
        value={(formData[fieldKey] as string) || ''}
        onChange={e => set(fieldKey, e.target.value)}
        disabled={disabled}
        onFocus={() => setFocused(id)} onBlur={() => setFocused('')}
        style={{ ...inp, ...f(id), cursor: 'pointer', appearance: 'none' as const, opacity: disabled ? 0.55 : 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
          color: (formData[fieldKey] as string) ? C.ink : C.faint,
        }}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )

  const MultiToggle = ({ label, fieldKey, options, icon: Icon, color }: {
    label: string; fieldKey: string; options: { label: string; value: string }[]; icon?: any; color?: string
  }) => {
    if (!options.length) return null
    const selected = (formData[fieldKey] as string[]) || []
    const col = color || C.gold
    return (
      <div style={{ background: '#FAFAFA', border: `1px solid ${C.bdr}`, borderRadius: 14, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          {Icon && <div style={{ width: 28, height: 28, borderRadius: 7, background: `${col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 14, height: 14, color: col }} />
          </div>}
          <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 700, color: C.ink, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{label}</span>
          {selected.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: col, background: `${col}15`, padding: '2px 8px', borderRadius: 99 }}>{selected.length} selected</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {options.map(o => {
            const on = selected.includes(o.value)
            return (
              <button key={o.value} type="button" onClick={() => toggle(fieldKey, o.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${on ? col : C.bdr}`, background: on ? `${col}10` : C.card, cursor: 'pointer', fontFamily: C.sans, fontSize: 12, fontWeight: on ? 600 : 400, color: on ? col : C.muted, transition: 'all .15s' }}>
                {on && <Check style={{ width: 10, height: 10, strokeWidth: 3 }} />}
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const ImageField = ({ label, hint, file, onChange }: { label: string; hint: string; file: File | null; onChange: (f: File | null) => void }) => (
    <Field id={label} label={label}>
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1.5px solid ${C.gold}`, borderRadius: 10, background: C.goldBg }}>
          <img src={URL.createObjectURL(file)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 4 }}><X style={{ width: 15, height: 15 }} /></button>
        </div>
      ) : (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px', border: `1.5px dashed ${C.bdr}`, borderRadius: 10, cursor: 'pointer', background: '#FAFAFA', transition: 'border-color .18s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.gold}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.bdr}>
          <Upload style={{ width: 20, height: 20, color: C.faint }} />
          <span style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.muted }}>Upload {label}</span>
          <span style={{ fontFamily: C.sans, fontSize: 11, color: C.faint }}>{hint}</span>
          <input type="file" accept={IMG_TYPES.join(',')} style={{ display: 'none' }} onChange={e => { handleImg(e.target.files?.[0] ?? null, onChange, label); e.target.value = '' }} />
        </label>
      )}
    </Field>
  )

  const Toggle = ({ label, fieldKey }: { label: string; fieldKey: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFAFA', border: `1px solid ${C.bdr}`, borderRadius: 10 }}>
      <span style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 500, color: C.ink }}>{label}</span>
      <button type="button" onClick={() => set(fieldKey, !formData[fieldKey])}
        style={{ width: 40, height: 22, borderRadius: 99, background: formData[fieldKey] ? C.gold : '#D1D5DB', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: formData[fieldKey] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )

  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const gap = (n = 14): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', gap: n })

  /* ══════════════════════════════════════
     STEP CONTENT
  ══════════════════════════════════════ */
  const STEPS_CONTENT = [

    /* ── Step 0: Basic Info ── */
    <div key="basic" style={gap()}>
      <div style={grid2}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field id="name" label="School Name" required>
            <input value={(formData.name as string)||''} onChange={e=>set('name',e.target.value)}
              placeholder="e.g. Delhi Public School, Sector 132"
              onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')}
              style={{...inp,...f('name')}} />
          </Field>
        </div>
        <Field id="tagline" label="Tagline">
          <input value={(formData.tagline as string)||''} onChange={e=>set('tagline',e.target.value)}
            placeholder="e.g. Empowering Minds, Shaping Futures"
            onFocus={()=>setFocused('tagline')} onBlur={()=>setFocused('')}
            style={{...inp,...f('tagline')}} />
        </Field>
        <Field id="affNo" label="Affiliation No.">
          <input value={(formData.affiliationNo as string)||''} onChange={e=>set('affiliationNo',e.target.value)}
            placeholder="e.g. 2730071"
            onFocus={()=>setFocused('affNo')} onBlur={()=>setFocused('')}
            style={{...inp,...f('affNo')}} />
        </Field>
        <Field id="founded" label="Year Established">
          <input type="number" value={(formData.foundingYear as number)||''} onChange={e=>set('foundingYear',Number(e.target.value))}
            placeholder="e.g. 1985" min={1800} max={new Date().getFullYear()}
            onFocus={()=>setFocused('founded')} onBlur={()=>setFocused('')}
            style={{...inp,...f('founded')}} />
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field id="desc" label="School Description" required>
            <textarea value={(formData.description as string)||''} onChange={e=>set('description',e.target.value)}
              placeholder="Describe your school's vision, values, and what makes it unique…"
              rows={3} onFocus={()=>setFocused('desc')} onBlur={()=>setFocused('')}
              style={{...inp,...f('desc'),resize:'none',lineHeight:1.6}} />
          </Field>
        </div>
      </div>
    </div>,

    /* ── Step 1: Type & Board ── */
    <div key="typeboard" style={gap()}>
      <div style={grid2}>
        <Sel id="stype" label="School Type" fieldKey="schoolType" options={schoolTypes} required />
        <Sel id="gender" label="Gender Policy" fieldKey="genderPolicy" options={genderPolicies} required />
        <Sel id="medium" label="Medium of Instruction" fieldKey="mediumOfInstruction" options={mediums} required />
        <Sel id="religion" label="Religion / Affiliation" fieldKey="religion" options={religions} />
        <Sel id="recog" label="Recognition" fieldKey="recognition" options={recognitions} />
        <div style={{ gridColumn: '1/-1' }}>
          <MultiToggle label="Board(s) of Education" fieldKey="board" options={boards} icon={BookOpen} color={C.gold} />
        </div>
        <Field id="students" label="Total Students">
          <input type="number" value={(formData.totalStudents as number)||''} onChange={e=>set('totalStudents',Number(e.target.value))}
            placeholder="e.g. 1500" onFocus={()=>setFocused('students')} onBlur={()=>setFocused('')}
            style={{...inp,...f('students')}} />
        </Field>
        <Field id="ratio" label="Student:Teacher Ratio">
          <input value={(formData.studentTeacherRatio as string)||''} onChange={e=>set('studentTeacherRatio',e.target.value)}
            placeholder="e.g. 25:1" onFocus={()=>setFocused('ratio')} onBlur={()=>setFocused('')}
            style={{...inp,...f('ratio')}} />
        </Field>
      </div>
    </div>,

    /* ── Step 2: Classes & Fees ── */
    <div key="fees" style={gap()}>
      <div style={grid2}>
        <Sel id="cfrom" label="Classes From" fieldKey="classesFrom" options={classLevels} required />
        <Sel id="cto"   label="Classes To"   fieldKey="classesTo"   options={classLevels} required />
      </div>
      <div>
        <label style={lbl}>Monthly Fee Range (₹)</label>
        <div style={grid2}>
          <input type="number" value={(formData.monthlyFeeMin as number)||''} onChange={e=>set('monthlyFeeMin',Number(e.target.value))}
            placeholder="Min e.g. 3,000" onFocus={()=>setFocused('fmin')} onBlur={()=>setFocused('')}
            style={{...inp,...f('fmin')}} />
          <input type="number" value={(formData.monthlyFeeMax as number)||''} onChange={e=>set('monthlyFeeMax',Number(e.target.value))}
            placeholder="Max e.g. 10,000" onFocus={()=>setFocused('fmax')} onBlur={()=>setFocused('')}
            style={{...inp,...f('fmax')}} />
        </div>
      </div>
      <Field id="annualFee" label="Annual / Admission Fee (₹)">
        <input type="number" value={(formData.annualFee as number)||''} onChange={e=>set('annualFee',Number(e.target.value))}
          placeholder="e.g. 25,000" onFocus={()=>setFocused('annualFee')} onBlur={()=>setFocused('')}
          style={{...inp,...f('annualFee')}} />
      </Field>
      <div style={gap(8)}>
        <Sel id="acYear" label="Admission Academic Year" fieldKey="admissionAcademicYear" options={academicYears} />
        <Toggle label="Admissions Currently Open" fieldKey="admissionOpen" />
      </div>
    </div>,

    /* ── Step 3: Facilities (NEW COMPREHENSIVE STEP) ── */
    <div key="facilities" style={gap(12)}>
      <MultiToggle label="Facilities & Infrastructure" fieldKey="facilities"     options={facilitiesOpts} icon={Building2}  color="#2563EB" />
      <MultiToggle label="Sports"                      fieldKey="sports"         options={sportsOpts}     icon={Trophy}      color="#059669" />
      <MultiToggle label="Extra Curricular Activities" fieldKey="extraCurricular" options={extraCurrOpts} icon={Music}       color="#7C3AED" />
      <MultiToggle label="Languages Offered"           fieldKey="languagesOffered" options={languageOpts} icon={Languages}   color="#B45309" />
      {/* fallback message if none of the dropdowns have data yet */}
      {!facilitiesOpts.length && !sportsOpts.length && !extraCurrOpts.length && !languageOpts.length && (
        <div style={{ textAlign: 'center', padding: '32px 20px', border: `1.5px dashed ${C.bdr}`, borderRadius: 14, background: '#FAFAFA' }}>
          <Building2 style={{ width: 28, height: 28, color: C.faint, margin: '0 auto 10px' }} />
          <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>No options yet</div>
          <div style={{ fontFamily: C.sans, fontSize: 12, color: C.faint }}>
            Ask your Super Admin to add Facilities, Sports, Extra Curricular and Language options in<br />
            <strong style={{ color: C.gold }}>Admin → Settings → Dropdown Settings</strong>
          </div>
        </div>
      )}
    </div>,

    /* ── Step 4: Location ── */
    <div key="location" style={gap()}>
      <Field id="addr" label="Street Address" required>
        <input value={(formData.addressLine1 as string)||''} onChange={e=>set('addressLine1',e.target.value)}
          placeholder="e.g. Plot No. 12, Sector 132, Noida"
          onFocus={()=>setFocused('addr')} onBlur={()=>setFocused('')}
          style={{...inp,...f('addr')}} />
      </Field>
      <div style={grid2}>
        <Sel id="state" label="State" fieldKey="state" options={states} required />
        <Field id="city" label="City" required>
          <select value={(formData.city as string)||''} onChange={e=>set('city',e.target.value)}
            disabled={!formData.state || citiesLoading}
            onFocus={()=>setFocused('city')} onBlur={()=>setFocused('')}
            style={{ ...inp,...f('city'), cursor:'pointer', appearance:'none' as const, opacity:!formData.state?0.55:1,
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32,
              color:(formData.city as string)?C.ink:C.faint }}>
            <option value="">{!formData.state?'Select state first':citiesLoading?'Loading…':'Select City'}</option>
            {cities.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field id="locality" label="Locality / Area">
          <input value={(formData.locality as string)||''} onChange={e=>set('locality',e.target.value)}
            placeholder="e.g. Sector 18" onFocus={()=>setFocused('locality')} onBlur={()=>setFocused('')}
            style={{...inp,...f('locality')}} />
        </Field>
        <Field id="pin" label="Pincode" required>
          <input value={(formData.pincode as string)||''} onChange={e=>set('pincode',e.target.value.replace(/\D/,'').slice(0,6))}
            placeholder="e.g. 201301" maxLength={6} onFocus={()=>setFocused('pin')} onBlur={()=>setFocused('')}
            style={{...inp,...f('pin')}} />
        </Field>
        <Field id="lat" label="Latitude (GPS)">
          <input type="number" step="0.0000001" value={(formData.latitude as number)||''} onChange={e=>set('latitude',Number(e.target.value))}
            placeholder="e.g. 28.5355" onFocus={()=>setFocused('lat')} onBlur={()=>setFocused('')}
            style={{...inp,...f('lat')}} />
        </Field>
        <Field id="lng" label="Longitude (GPS)">
          <input type="number" step="0.0000001" value={(formData.longitude as number)||''} onChange={e=>set('longitude',Number(e.target.value))}
            placeholder="e.g. 77.3910" onFocus={()=>setFocused('lng')} onBlur={()=>setFocused('')}
            style={{...inp,...f('lng')}} />
        </Field>
      </div>
      <div style={{ fontSize: 11, color: C.faint, fontFamily: C.sans, display: 'flex', alignItems: 'center', gap: 5 }}>
        <MapPin style={{ width: 12, height: 12, color: C.gold, flexShrink: 0 }} />
        GPS coordinates help show your school on maps. Get them from Google Maps by right-clicking your school location.
      </div>
    </div>,

    /* ── Step 5: Contact & Media (LAST — triggers save) ── */
    <div key="contact" style={gap()}>
      <div style={grid2}>
        <Field id="phone" label="School Phone">
          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.faint }} />
            <input value={(formData.phone as string)||''} onChange={e=>set('phone',e.target.value)}
              placeholder="+91 98765 43210"
              onFocus={()=>setFocused('phone')} onBlur={()=>setFocused('')}
              style={{...inp,...f('phone'),paddingLeft:36}} />
          </div>
        </Field>
        <Field id="email" label="School Email">
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.faint }} />
            <input type="email" value={(formData.email as string)||''} onChange={e=>set('email',e.target.value)}
              placeholder="admissions@school.edu.in"
              onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
              style={{...inp,...f('email'),paddingLeft:36}} />
          </div>
        </Field>
        <Field id="web" label="Website URL">
          <div style={{ position: 'relative' }}>
            <Globe style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.faint }} />
            <input value={(formData.websiteUrl as string)||''} onChange={e=>set('websiteUrl',e.target.value)}
              placeholder="https://www.yourschool.edu.in"
              onFocus={()=>setFocused('web')} onBlur={()=>setFocused('')}
              style={{...inp,...f('web'),paddingLeft:36}} />
          </div>
        </Field>
        <Field id="principal" label="Principal Name">
          <input value={(formData.principalName as string)||''} onChange={e=>set('principalName',e.target.value)}
            placeholder="e.g. Dr. Ranjana Sharma"
            onFocus={()=>setFocused('principal')} onBlur={()=>setFocused('')}
            style={{...inp,...f('principal')}} />
        </Field>
      </div>
      <div style={grid2}>
        <ImageField label="School Logo" hint="Square · JPG/PNG/WEBP · Max 2 MB" file={logoFile} onChange={setLogoFile} />
        <ImageField label="Cover Photo" hint="1200×400px recommended · Max 2 MB" file={coverFile} onChange={setCoverFile} />
      </div>
      <div style={{ padding: '12px 14px', background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 10, fontFamily: C.sans, fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 style={{ width: 14, height: 14, color: C.gold, flexShrink: 0 }} />
        After saving, you can upload more gallery images from your school dashboard.
      </div>
    </div>,
  ]

  const isLast = step === STEPS.length - 1
  const pct = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.sans }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4 }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 48px' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(184,134,11,0.3)' }}>
            <GraduationCap style={{ width: 19, height: 19, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 20, color: C.ink }}>
            Thynk<span style={{ color: C.gold }}>Schooling</span>
          </span>
        </Link>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.faint, fontWeight: 500 }}>Step {step + 1} of {STEPS.length} — {STEPS[step].label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: '#E9E5DE', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg,${C.gold},#D4A520)`, borderRadius: 99 }} />
          </div>
          {/* Step pills */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const done = i < step, active = i === step
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, flexShrink: 0, transition: 'all .2s',
                  background: active ? C.gold : done ? `${C.gold}18` : 'rgba(13,17,23,0.05)',
                  border: `1px solid ${active ? C.gold : done ? `${C.gold}30` : 'transparent'}`,
                  color: active ? '#fff' : done ? C.gold : C.faint,
                }}>
                  {done
                    ? <CheckCircle2 style={{ width: 11, height: 11 }} />
                    : <Icon style={{ width: 11, height: 11 }} />
                  }
                  <span style={{ fontSize: 11, fontWeight: active || done ? 600 : 400 }}>{s.short}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.bdr}`, boxShadow: '0 4px 32px rgba(13,17,23,0.07)', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.bdr}`, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            {(() => { const Icon = STEPS[step].icon; return (
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 17, height: 17, color: C.gold }} />
              </div>
            )})()}
            <div>
              <h2 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 20, color: C.ink, margin: 0, lineHeight: 1.2 }}>{STEPS[step].label}</h2>
              <p style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, margin: '2px 0 0' }}>
                {['Fill in your school\'s basic details', 'Select type, boards and policies', 'Set class range, fees and admission info', 'Add facilities, sports and activities from your options', 'Enter your school\'s location details', 'Add contact info and upload images to save your profile'][step]}
              </p>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: '20px 24px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                {STEPS_CONTENT[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card footer nav */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${C.bdr}`, background: '#FAFAFA' }}>
            <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${C.bdr}`, background: C.card, color: step === 0 ? C.faint : C.muted, cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 500, opacity: step === 0 ? 0.5 : 1, transition: 'all .15s' }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>
            {isLast ? (
              <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: saveMutation.isPending ? C.faint : C.gold, color: '#fff', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 600, transition: 'all .15s', boxShadow: saveMutation.isPending ? 'none' : '0 3px 12px rgba(184,134,11,0.3)' }}>
                {saveMutation.isPending
                  ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Saving profile…</>
                  : <><Save style={{ width: 14, height: 14 }} /> Save Profile & Go to Dashboard</>
                }
              </button>
            ) : (
              <button type="button" onClick={() => setStep(s => s + 1)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: C.ink, color: '#FAF7F2', cursor: 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 500, transition: 'background .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = C.gold}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = C.ink}>
                Continue <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 14 }}>
          You can update your profile at any time from the school dashboard.
        </p>
      </div>
    </div>
  )
}
