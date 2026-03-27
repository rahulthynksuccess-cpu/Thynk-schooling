'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ArrowRight, ArrowLeft, Save, Loader2, Plus, User } from 'lucide-react'
import { apiPost, apiPut } from '@/lib/api'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Your Profile', 'Add Child', 'Done']

export default function ParentCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)

  const [parentData, setParentData] = useState({ fullName: '', occupation: '', annualIncomeRange: '', city: '', locality: '', religion: '', budgetMin: '', budgetMax: '', howDidYouHear: '' })
  const [childData,  setChildData]  = useState({ fullName: '', dob: '', gender: '', currentClass: '', applyingForClass: '', academicYear: '', bloodGroup: '', specialNeeds: '' })

  const { options: cities       } = useDropdown('city')
  const { options: occupations  } = useDropdown('occupation')
  const { options: incomeRanges } = useDropdown('income_range')
  const { options: religions    } = useDropdown('religion')
  const { options: classLevels  } = useDropdown('class_level')
  const { options: genders      } = useDropdown('gender')
  const { options: bloodGroups  } = useDropdown('blood_group')
  const { options: academicYrs  } = useDropdown('academic_year')
  const { options: howHeard     } = useDropdown('how_did_you_hear')

  const pSet = (k: string, v: string) => setParentData(p => ({ ...p, [k]: v }))
  const cSet = (k: string, v: string) => setChildData(c => ({ ...c, [k]: v }))

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiPost('/parent-profiles', parentData)
      if (childData.fullName) await apiPost('/students', childData)
      if (user) { await apiPut('/auth/complete-profile', { fullName: parentData.fullName, profileCompleted: true }) }
    },
    onSuccess: () => {
      if (user) setUser({ ...user, fullName: parentData.fullName, profileCompleted: true })
      toast.success('Profile saved! Welcome to Thynk Schooling 🎉')
      router.push('/dashboard/parent')
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  const DS = ({ label, fieldKey, options, target, required = false }: {
    label: string; fieldKey: string; options: { label: string; value: string }[];
    target: 'parent' | 'child'; required?: boolean
  }) => (
    <div>
      <label className="label">{label}{required && <span className="text-orange-400 ml-1">*</span>}</label>
      <select
        value={target === 'parent' ? (parentData as Record<string, string>)[fieldKey] : (childData as Record<string, string>)[fieldKey]}
        onChange={e => target === 'parent' ? pSet(fieldKey, e.target.value) : cSet(fieldKey, e.target.value)}
        className="input appearance-none cursor-pointer"
      >
        <option value="">— Select {label} —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-900 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Thynk<span className="text-orange-500">Schooling</span></span>
        </Link>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex-1 flex flex-col gap-1.5`}>
                <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-orange-500' : 'bg-navy-800'}`} />
                <span className={`text-xs font-display font-semibold ${i === step ? 'text-orange-400' : 'text-navy-500'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-7">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-display font-bold text-white text-xl mb-5">Your Profile</h2>
                <div>
                  <label className="label">Full Name <span className="text-orange-400">*</span></label>
                  <input value={parentData.fullName} onChange={e => pSet('fullName', e.target.value)}
                    placeholder="e.g. Priya Sharma" className="input" required />
                </div>
                <DS label="City"              fieldKey="city"              options={cities}       target="parent" />
                <div>
                  <label className="label">Locality / Area</label>
                  <input value={parentData.locality} onChange={e => pSet('locality', e.target.value)}
                    placeholder="e.g. Sector 18, Noida" className="input" />
                </div>
                <DS label="Occupation"        fieldKey="occupation"        options={occupations}  target="parent" />
                <DS label="Annual Income"     fieldKey="annualIncomeRange" options={incomeRanges} target="parent" />
                <DS label="Religion"          fieldKey="religion"          options={religions}    target="parent" />
                <div>
                  <label className="label">Monthly School Budget (₹)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={parentData.budgetMin} onChange={e => pSet('budgetMin', e.target.value)}
                      placeholder="Min e.g. 3000" className="input" />
                    <input type="number" value={parentData.budgetMax} onChange={e => pSet('budgetMax', e.target.value)}
                      placeholder="Max e.g. 10000" className="input" />
                  </div>
                </div>
                <DS label="How did you hear about us?" fieldKey="howDidYouHear" options={howHeard} target="parent" />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="child" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-xl">Add Your Child</h2>
                    <p className="text-navy-400 text-xs">You can add more children from your dashboard later.</p>
                  </div>
                </div>

                <div>
                  <label className="label">Child's Full Name <span className="text-orange-400">*</span></label>
                  <input value={childData.fullName} onChange={e => cSet('fullName', e.target.value)}
                    placeholder="e.g. Arjun Sharma" className="input" />
                </div>
                <div>
                  <label className="label">Date of Birth <span className="text-orange-400">*</span></label>
                  <input type="date" value={childData.dob} onChange={e => cSet('dob', e.target.value)}
                    className="input" max={new Date().toISOString().split('T')[0]} />
                </div>
                <DS label="Gender"               fieldKey="gender"           options={genders}     target="child" />
                <DS label="Blood Group"           fieldKey="bloodGroup"       options={bloodGroups} target="child" />
                <DS label="Current Class"         fieldKey="currentClass"     options={classLevels} target="child" />
                <DS label="Applying for Class"    fieldKey="applyingForClass" options={classLevels} target="child" required />
                <DS label="Admission Year"        fieldKey="academicYear"     options={academicYrs} target="child" required />
                <div>
                  <label className="label">Current School Name</label>
                  <input value={childData.specialNeeds} onChange={e => cSet('specialNeeds', e.target.value)}
                    placeholder="e.g. DPS Vasant Kunj" className="input" />
                </div>
                <div>
                  <label className="label">Special Learning Needs <span className="text-navy-500 text-xs font-normal">(if any)</span></label>
                  <textarea value={childData.specialNeeds} onChange={e => cSet('specialNeeds', e.target.value)}
                    placeholder="Mention any learning support or medical needs the school should know about…"
                    className="input min-h-[80px] resize-none" rows={3} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-display font-bold text-white text-2xl mb-2">You're All Set!</h2>
                <p className="text-navy-300 mb-6">Your profile is complete. Start exploring schools for {childData.fullName || 'your child'}!</p>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="btn-primary w-full justify-center text-base py-4 disabled:opacity-60"
                >
                  {saveMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save & Go to Dashboard</>
                  }
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 2 && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-surface-border">
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                className="btn-secondary disabled:opacity-40 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 justify-center">
                {step === 0 ? 'Add Child Profile' : 'Review & Save'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {step === 1 && (
          <button onClick={() => setStep(2)} className="w-full text-center text-navy-400 text-sm mt-3 hover:text-white transition-colors font-display">
            Skip — I'll add a child later
          </button>
        )}
      </div>
    </div>
  )
}
