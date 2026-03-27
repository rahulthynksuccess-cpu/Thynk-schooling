'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2, Upload,
  MapPin, Phone, Mail, Globe, DollarSign, Users, School, Image,
  CheckCircle2, Building2
} from 'lucide-react'
import { apiPost, apiPut } from '@/lib/api'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = [
  { label: 'Basic Info',      icon: School },
  { label: 'Type & Board',    icon: GraduationCap },
  { label: 'Classes & Fees',  icon: DollarSign },
  { label: 'Location',        icon: MapPin },
  { label: 'Contact & Media', icon: Image },
  { label: 'Lead Pricing',    icon: DollarSign },
]

type SchoolFormData = Record<string, string | string[] | number | boolean>

export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step,     setStep]     = useState(0)
  const [formData, setFormData] = useState<SchoolFormData>({
    board: [], facilitiesTransport: false, facilitiesPool: false,
    facilitiesSports: false, facilitiesScienceLab: false,
    facilitiesComputerLab: false, facilitiesLibrary: false,
    facilitiesCafeteria: false, facilitiesHostel: false,
    facilitiesSmartClassrooms: false, admissionOpen: false,
  })

  // All dropdowns fetched dynamically
  const { options: boards          } = useDropdown('board')
  const { options: schoolTypes     } = useDropdown('school_type')
  const { options: genderPolicies  } = useDropdown('gender_policy')
  const { options: mediums         } = useDropdown('medium')
  const { options: religions       } = useDropdown('religion')
  const { options: recognitions    } = useDropdown('recognition')
  const { options: classLevels     } = useDropdown('class_level')
  const { options: states          } = useDropdown('state')
  const { options: cities, isLoading: citiesLoading } = useDropdown('city', {
    parentValue: formData.state as string,
    enabled: !!formData.state,
  })
  const { options: academicYears   } = useDropdown('academic_year')

  const set = (key: string, val: SchoolFormData[string]) =>
    setFormData(prev => ({ ...prev, [key]: val }))

  const toggleArrayVal = (key: string, val: string) => {
    const arr = (formData[key] as string[]) || []
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const saveMutation = useMutation({
    mutationFn: () => apiPost('/schools/profile', formData),
    onSuccess: async () => {
      await apiPut('/auth/complete-profile', { profileCompleted: true })
      if (user) setUser({ ...user, profileCompleted: true })
      toast.success('School profile saved! 🎉')
      router.push('/dashboard/school')
    },
    onError: () => toast.error('Failed to save profile. Please try again.'),
  })

  const FACILITY_TOGGLES = [
    { key: 'facilitiesTransport',       label: 'Transport' },
    { key: 'facilitiesPool',            label: 'Swimming Pool' },
    { key: 'facilitiesSports',          label: 'Sports Ground' },
    { key: 'facilitiesScienceLab',      label: 'Science Lab' },
    { key: 'facilitiesComputerLab',     label: 'Computer Lab' },
    { key: 'facilitiesLibrary',         label: 'Library' },
    { key: 'facilitiesCafeteria',       label: 'Cafeteria' },
    { key: 'facilitiesHostel',          label: 'Hostel' },
    { key: 'facilitiesSmartClassrooms', label: 'Smart Classrooms' },
  ]

  const DynamicSelect = ({
    label, fieldKey, options, isLoading = false, required = false,
  }: { label: string; fieldKey: string; options: { label: string; value: string }[]; isLoading?: boolean; required?: boolean }) => (
    <div>
      <label className="label">{label}{required && <span className="text-orange-400 ml-1">*</span>}</label>
      <select
        value={(formData[fieldKey] as string) || ''}
        onChange={e => set(fieldKey, e.target.value)}
        className="input appearance-none cursor-pointer"
        disabled={isLoading}
        required={required}
      >
        <option value="">— Select {label} —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const MultiSelect = ({
    label, fieldKey, options,
  }: { label: string; fieldKey: string; options: { label: string; value: string }[] }) => {
    const selected = (formData[fieldKey] as string[]) || []
    return (
      <div>
        <label className="label">{label}</label>
        <div className="flex flex-wrap gap-2 p-3 bg-navy-800 border border-surface-border rounded-xl">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggleArrayVal(fieldKey, o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all ${
                selected.includes(o.value)
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-surface-border text-navy-300 hover:border-orange-500/40 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const STEP_CONTENT = [
    // Step 0: Basic Info
    <div key="basic" className="space-y-4">
      <div>
        <label className="label">School Name <span className="text-orange-400">*</span></label>
        <input value={(formData.name as string) || ''} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Delhi Public School, Sector 132" className="input" required />
      </div>
      <div>
        <label className="label">Tagline</label>
        <input value={(formData.tagline as string) || ''} onChange={e => set('tagline', e.target.value)}
          placeholder="e.g. Empowering Minds, Shaping Futures" className="input" />
      </div>
      <div>
        <label className="label">School Description <span className="text-orange-400">*</span></label>
        <textarea value={(formData.description as string) || ''} onChange={e => set('description', e.target.value)}
          placeholder="Describe your school's vision, values, and unique features…"
          className="input min-h-[120px] resize-none" rows={5} />
      </div>
      <div>
        <label className="label">Affiliation Number</label>
        <input value={(formData.affiliationNo as string) || ''} onChange={e => set('affiliationNo', e.target.value)}
          placeholder="e.g. 2730071" className="input" />
      </div>
      <div>
        <label className="label">Year Established</label>
        <input type="number" value={(formData.foundingYear as number) || ''} onChange={e => set('foundingYear', Number(e.target.value))}
          placeholder="e.g. 1972" min={1800} max={new Date().getFullYear()} className="input" />
      </div>
    </div>,

    // Step 1: Type & Board
    <div key="typeboard" className="space-y-5">
      <DynamicSelect label="School Type"          fieldKey="schoolType"          options={schoolTypes}    required />
      <MultiSelect   label="Board(s) of Education" fieldKey="board"               options={boards}                  />
      <DynamicSelect label="Gender Policy"         fieldKey="genderPolicy"        options={genderPolicies} required />
      <DynamicSelect label="Medium of Instruction" fieldKey="mediumOfInstruction" options={mediums}        required />
      <DynamicSelect label="Religion / Affiliation" fieldKey="religion"           options={religions}               />
      <DynamicSelect label="Recognition Type"      fieldKey="recognition"         options={recognitions}            />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Total Students</label>
          <input type="number" value={(formData.totalStudents as number) || ''} onChange={e => set('totalStudents', Number(e.target.value))}
            placeholder="e.g. 1500" className="input" />
        </div>
        <div>
          <label className="label">Student:Teacher Ratio</label>
          <input value={(formData.studentTeacherRatio as string) || ''} onChange={e => set('studentTeacherRatio', e.target.value)}
            placeholder="e.g. 20:1" className="input" />
        </div>
      </div>
    </div>,

    // Step 2: Classes & Fees
    <div key="classfees" className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <DynamicSelect label="Classes From" fieldKey="classesFrom" options={classLevels} required />
        <DynamicSelect label="Classes To"   fieldKey="classesTo"   options={classLevels} required />
      </div>
      <div>
        <label className="label">Monthly Fee (₹)</label>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={(formData.monthlyFeeMin as number) || ''} onChange={e => set('monthlyFeeMin', Number(e.target.value))}
            placeholder="Min e.g. 3000" className="input" />
          <input type="number" value={(formData.monthlyFeeMax as number) || ''} onChange={e => set('monthlyFeeMax', Number(e.target.value))}
            placeholder="Max e.g. 8000" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Annual / Admission Fee (₹)</label>
        <input type="number" value={(formData.annualFee as number) || ''} onChange={e => set('annualFee', Number(e.target.value))}
          placeholder="e.g. 25000" className="input" />
      </div>

      {/* Facilities */}
      <div>
        <label className="label mb-3 block">Facilities Available</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FACILITY_TOGGLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(key, !formData[key])}
              className={`p-3 rounded-xl border text-sm font-display font-semibold transition-all text-left ${
                formData[key]
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                  : 'bg-navy-800 border-surface-border text-navy-400 hover:border-orange-500/30'
              }`}
            >
              {formData[key] ? '✓ ' : '○ '}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Admission */}
      <div className="space-y-3">
        <label className="label">Admission Info</label>
        <DynamicSelect label="Current Academic Year" fieldKey="admissionAcademicYear" options={academicYears} />
        <div className="flex items-center gap-3 p-3 bg-navy-800 border border-surface-border rounded-xl">
          <span className="font-display font-semibold text-white text-sm flex-1">Admissions Currently Open</span>
          <button
            type="button"
            onClick={() => set('admissionOpen', !formData.admissionOpen)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.admissionOpen ? 'bg-orange-500' : 'bg-navy-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.admissionOpen ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>,

    // Step 3: Location
    <div key="location" className="space-y-4">
      <div>
        <label className="label">Street Address <span className="text-orange-400">*</span></label>
        <input value={(formData.addressLine1 as string) || ''} onChange={e => set('addressLine1', e.target.value)}
          placeholder="e.g. Plot No. 12, Sector 132" className="input" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DynamicSelect label="State"   fieldKey="state"   options={states} required />
        <div>
          <label className="label">City <span className="text-orange-400">*</span></label>
          <select
            value={(formData.city as string) || ''}
            onChange={e => set('city', e.target.value)}
            className="input appearance-none cursor-pointer"
            disabled={!formData.state || citiesLoading}
          >
            <option value="">{!formData.state ? '— Select State first —' : citiesLoading ? 'Loading…' : '— Select City —'}</option>
            {cities.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Locality / Area</label>
          <input value={(formData.locality as string) || ''} onChange={e => set('locality', e.target.value)}
            placeholder="e.g. Sector 18, Noida" className="input" />
        </div>
        <div>
          <label className="label">Pincode <span className="text-orange-400">*</span></label>
          <input value={(formData.pincode as string) || ''} onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))}
            placeholder="e.g. 201301" className="input" maxLength={6} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Latitude (GPS)</label>
          <input type="number" step="0.0000001" value={(formData.latitude as number) || ''} onChange={e => set('latitude', Number(e.target.value))}
            placeholder="e.g. 28.5355" className="input" />
        </div>
        <div>
          <label className="label">Longitude (GPS)</label>
          <input type="number" step="0.0000001" value={(formData.longitude as number) || ''} onChange={e => set('longitude', Number(e.target.value))}
            placeholder="e.g. 77.3910" className="input" />
        </div>
      </div>
      <p className="text-navy-500 text-xs">📍 GPS coordinates are used to show your school on the map and for lead matching. You can get them from Google Maps.</p>
    </div>,

    // Step 4: Contact & Media
    <div key="contact" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">School Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input value={(formData.phone as string) || ''} onChange={e => set('phone', e.target.value)}
              placeholder="+91 98765 43210" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">School Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input type="email" value={(formData.email as string) || ''} onChange={e => set('email', e.target.value)}
              placeholder="admissions@school.edu.in" className="input pl-10" />
          </div>
        </div>
      </div>
      <div>
        <label className="label">Website URL</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input value={(formData.websiteUrl as string) || ''} onChange={e => set('websiteUrl', e.target.value)}
            placeholder="https://www.yourschool.edu.in" className="input pl-10" />
        </div>
      </div>
      <div>
        <label className="label">Principal Name</label>
        <input value={(formData.principalName as string) || ''} onChange={e => set('principalName', e.target.value)}
          placeholder="e.g. Dr. Ranjana Sharma" className="input" />
      </div>

      {/* Media upload note */}
      <div className="p-4 rounded-xl border border-dashed border-surface-border bg-navy-800/50 text-center space-y-2">
        <Upload className="w-8 h-8 text-navy-500 mx-auto" />
        <p className="font-display font-semibold text-white text-sm">Logo & Gallery Photos</p>
        <p className="text-navy-400 text-xs">
          Upload school logo, cover photo, and gallery images (up to 50 depending on your plan) directly from your School Profile dashboard after saving.
        </p>
        <p className="text-navy-500 text-xs">Accepted: JPG, PNG, WEBP · Max 5MB per image</p>
      </div>
    </div>,

    // Step 5: Lead Pricing
    <div key="leadprice" className="space-y-5">
      <div className="p-4 rounded-xl bg-orange-500/8 border border-orange-500/20 text-sm text-navy-200">
        💡 Set your price per lead. Parents who express interest in your school become leads.
        Schools pay to unlock a parent's full contact details. The platform default is ₹299/lead.
      </div>
      <div>
        <label className="label">Your Price Per Lead (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 font-display font-bold">₹</span>
          <input
            type="number"
            value={(formData.pricePerLead as number) || ''}
            onChange={e => set('pricePerLead', Number(e.target.value))}
            placeholder="299"
            className="input pl-7"
            min={1}
          />
        </div>
        <p className="text-navy-500 text-xs mt-1">Leave blank to use the platform default pricing. The Super Admin sets floor and ceiling prices.</p>
      </div>
      <div className="card p-5 space-y-3">
        <h4 className="font-display font-bold text-white text-sm">How Lead Pricing Works</h4>
        <ul className="space-y-2 text-navy-300 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /> A parent applies or enquires about your school → a masked lead is created</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /> You see masked info (first name, last 5 digits) in your dashboard</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /> Click "Buy Lead" to unlock full name and phone number using credits or direct payment</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /> Buy lead credits in bulk via packages to save up to 70%</li>
        </ul>
      </div>
    </div>,
  ]

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-navy-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Thynk<span className="text-orange-500">Schooling</span></span>
        </Link>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-navy-400 text-xs font-display">Step {step + 1} of {STEPS.length}</span>
            <span className="font-display font-bold text-orange-400 text-sm">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold flex-shrink-0 transition-all ${
                    i === step   ? 'bg-orange-500 text-white' :
                    i < step     ? 'bg-orange-500/15 text-orange-400' :
                    'text-navy-500'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {s.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <div className="card p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-display font-bold text-white text-xl mb-5">{STEPS[step].label}</h2>
              {STEP_CONTENT[step]}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-40 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {saveMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Profile & Go to Dashboard</>
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="btn-primary flex-1 justify-center"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-navy-500 text-xs mt-4">
          You can always update your profile later from the dashboard.
        </p>
      </div>
    </div>
  )
}
