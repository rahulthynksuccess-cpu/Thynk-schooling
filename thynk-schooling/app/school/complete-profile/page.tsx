'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2,
  Upload, MapPin, Phone, Mail, Globe, DollarSign,
  School, Building2, CheckCircle2, X, Star,
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

/* ── Types ───────────────────────────────────────────────────── */
type FD = Record<string, string | string[] | number | boolean>
interface AmenityOption {
  id: string; category: string; label: string; value: string; icon?: string
}

/* ── Steps ───────────────────────────────────────────────────── */
const STEPS = [
  { label: 'Basic Info',      sub: 'Name, tagline & description',      icon: School },
  { label: 'Type & Board',    sub: 'School type, boards & policies',    icon: GraduationCap },
  { label: 'Classes & Fees',  sub: 'Class range, fees & admission',     icon: DollarSign },
  { label: 'Features',        sub: 'Facilities, sports & activities',   icon: Star },
  { label: 'Location',        sub: 'Address & GPS coordinates',         icon: MapPin },
  { label: 'Contact & Media', sub: 'Phone, email & photos',             icon: Phone },
]

const AMENITY_TABS = [
  { key: 'facility',        label: 'Facilities' },
  { key: 'sport',           label: 'Sports' },
  { key: 'language',        label: 'Languages' },
  { key: 'infrastructure',  label: 'Infrastructure' },
  { key: 'extracurricular', label: 'Extracurricular' },
]

const MAX_BYTES = 1 * 1024 * 1024
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ── Inline CSS (scoped with sp- prefix) ─────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap');
.sp *{box-sizing:border-box;margin:0;padding:0}
.sp{
  --cream:#F7F3ED;--cream2:#EFE9DF;--ink:#1C1814;--rust:#C84B1F;--rust2:#E05A2A;
  --muted:#7A6E65;--ghost:#B5ADA6;--bdr:#DDD5C8;--white:#FFFFFF;
  --serif:'Fraunces',Georgia,serif;--sans:'Instrument Sans',system-ui,sans-serif;
  font-family:var(--sans);background:var(--cream);color:var(--ink);
  display:flex;min-height:100vh;
}
/* Sidebar */
.sp-sidebar{width:280px;flex-shrink:0;background:var(--ink);position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column}
.sp-sb-brand{padding:28px 24px 22px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px}
.sp-sb-icon{width:38px;height:38px;background:var(--rust);border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sp-sb-name{font-family:var(--serif);font-size:18px;color:#fff;font-weight:600}
.sp-sb-name span{color:var(--rust2)}
.sp-sb-steps{flex:1;padding:16px 0;overflow-y:auto;scrollbar-width:none}
.sp-sb-steps::-webkit-scrollbar{display:none}
.sp-sb-step{display:flex;align-items:center;gap:12px;padding:11px 24px;position:relative;transition:background .2s}
.sp-sb-step.active{background:rgba(255,255,255,.07)}
.sp-sb-step.active::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rust2);border-radius:0 2px 2px 0}
.sp-sb-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;transition:all .25s}
.sp-sb-step.done .sp-sb-num{background:rgba(200,75,31,.25);color:var(--rust2)}
.sp-sb-step.active .sp-sb-num{background:var(--rust);color:#fff}
.sp-sb-step.todo .sp-sb-num{background:rgba(255,255,255,.06);color:rgba(255,255,255,.25)}
.sp-sb-label{font-size:13px;font-weight:600;line-height:1.2}
.sp-sb-step.active .sp-sb-label{color:#fff}
.sp-sb-step.done .sp-sb-label{color:rgba(255,255,255,.6)}
.sp-sb-step.todo .sp-sb-label{color:rgba(255,255,255,.28)}
.sp-sb-sub{font-size:11px;margin-top:1px}
.sp-sb-step.active .sp-sb-sub{color:rgba(255,255,255,.4)}
.sp-sb-step.done .sp-sb-sub{color:rgba(255,255,255,.22)}
.sp-sb-step.todo .sp-sb-sub{color:rgba(255,255,255,.15)}
.sp-sb-prog{padding:18px 24px 24px;border-top:1px solid rgba(255,255,255,.08)}
.sp-sb-prog-meta{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.3);margin-bottom:8px}
.sp-sb-prog-meta span{color:var(--rust2);font-weight:700}
.sp-sb-track{height:3px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden}
.sp-sb-fill{height:100%;background:linear-gradient(90deg,var(--rust),var(--rust2));border-radius:99px;transition:width .5s cubic-bezier(.4,0,.2,1)}
/* Main */
.sp-main{flex:1;overflow-y:auto;max-height:100vh}
.sp-main-inner{padding:48px 56px;max-width:680px}
.sp-eyebrow{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--rust);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sp-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bdr),transparent)}
.sp-title{font-family:var(--serif);font-size:38px;color:var(--ink);line-height:1.1;font-weight:600;margin-bottom:8px}
.sp-title em{font-style:italic;color:var(--rust)}
.sp-desc{font-size:14px;color:var(--muted);margin-bottom:36px;line-height:1.6;max-width:500px}
/* Fields */
.sp-field{margin-bottom:20px}
.sp-lbl{display:block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ghost);margin-bottom:7px}
.sp-req{color:var(--rust)}
.sp-inp,.sp-sel,.sp-ta{width:100%;padding:12px 16px;border:1.5px solid var(--bdr);border-radius:12px;font-family:var(--sans);font-size:14px;color:var(--ink);background:var(--white);outline:none;transition:border .18s,box-shadow .18s;appearance:none}
.sp-inp:focus,.sp-sel:focus,.sp-ta:focus{border-color:var(--rust);box-shadow:0 0 0 3px rgba(200,75,31,.12)}
.sp-inp::placeholder,.sp-ta::placeholder{color:var(--ghost)}
.sp-ta{resize:none;line-height:1.65}
.sp-sel-wrap{position:relative}
.sp-sel-wrap::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--ghost);pointer-events:none;font-size:12px}
.sp-sel{cursor:pointer;padding-right:36px}
.sp-with-icon{position:relative}
.sp-with-icon .sp-inp{padding-left:40px}
.sp-fi{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ghost);pointer-events:none;display:flex}
.sp-pfx{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-weight:600;color:var(--muted);font-size:14px;pointer-events:none}
.sp-pfx-inp{padding-left:26px !important}
.sp-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* Chips */
.sp-chip-wrap{display:flex;flex-wrap:wrap;gap:8px;padding:14px;background:var(--cream);border:1.5px solid var(--bdr);border-radius:12px;min-height:52px}
.sp-chip{padding:7px 14px;border-radius:99px;font-size:12px;font-weight:600;border:1.5px solid var(--bdr);color:var(--muted);cursor:pointer;transition:all .15s;background:var(--white);font-family:var(--sans)}
.sp-chip:hover{border-color:var(--rust);color:var(--rust);background:rgba(200,75,31,.05)}
.sp-chip.on{background:rgba(200,75,31,.1);border-color:var(--rust);color:var(--rust)}
.sp-no-opts{font-size:12px;color:var(--ghost);font-style:italic}
/* Toggle */
.sp-tog-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--cream);border:1.5px solid var(--bdr);border-radius:12px}
.sp-tog-label{font-size:14px;font-weight:500;color:var(--ink)}
.sp-tog{position:relative;width:44px;height:25px;cursor:pointer;flex-shrink:0}
.sp-tog input{opacity:0;width:0;height:0}
.sp-sl{position:absolute;inset:0;background:var(--bdr);border-radius:99px;transition:.25s}
.sp-sl:before{content:'';position:absolute;width:19px;height:19px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.sp-tog input:checked+.sp-sl{background:var(--rust)}
.sp-tog input:checked+.sp-sl:before{transform:translateX(19px)}
/* Amenity */
.sp-a-nav{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:16px;padding-bottom:2px}
.sp-a-nav::-webkit-scrollbar{display:none}
.sp-a-tab{padding:8px 16px;border-radius:10px;font-size:12px;font-weight:600;border:1.5px solid var(--bdr);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:var(--sans);background:var(--white);color:var(--muted)}
.sp-a-tab:hover{border-color:var(--rust);color:var(--rust)}
.sp-a-tab.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sp-a-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:8px}
.sp-a-chip{display:flex;align-items:center;gap:8px;padding:10px 13px;border:1.5px solid var(--bdr);border-radius:11px;cursor:pointer;transition:all .15s;background:var(--white);font-size:13px;font-weight:500;color:var(--muted);font-family:var(--sans);width:100%;text-align:left}
.sp-a-chip:hover{border-color:var(--rust);background:rgba(200,75,31,.04);color:var(--rust)}
.sp-a-chip.on{background:rgba(200,75,31,.08);border-color:var(--rust);color:var(--rust);font-weight:600}
.sp-a-icon{font-size:17px;flex-shrink:0}
.sp-a-check{margin-left:auto;flex-shrink:0;color:var(--rust)}
.sp-a-count{font-size:12px;color:var(--rust);font-weight:600;margin-top:12px}
.sp-a-empty{font-size:13px;color:var(--ghost);padding:24px;text-align:center;background:var(--cream);border:1.5px dashed var(--bdr);border-radius:12px}
/* Upload */
.sp-upload{border:2px dashed var(--bdr);border-radius:14px;padding:26px;text-align:center;cursor:pointer;transition:border .2s,background .2s;display:block}
.sp-upload:hover{border-color:var(--rust);background:rgba(200,75,31,.03)}
.sp-upload-icon{width:46px;height:46px;background:rgba(200,75,31,.1);border-radius:13px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px}
.sp-upload-text{font-size:13px;font-weight:600;color:var(--muted);margin-bottom:4px}
.sp-upload-hint{font-size:11px;color:var(--ghost)}
.sp-file-prev{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(200,75,31,.06);border:1.5px solid rgba(200,75,31,.25);border-radius:12px}
.sp-file-thumb{width:44px;height:44px;border-radius:9px;object-fit:cover;flex-shrink:0}
.sp-file-name{font-size:13px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-file-size{font-size:11px;color:var(--ghost)}
/* Divider */
.sp-divider{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ghost);margin:24px 0 16px;display:flex;align-items:center;gap:10px}
.sp-divider::after{content:'';flex:1;height:1px;background:var(--bdr)}
/* Info box */
.sp-info{padding:14px 16px;background:linear-gradient(135deg,rgba(200,75,31,.08),rgba(200,75,31,.04));border:1.5px solid rgba(200,75,31,.2);border-radius:12px;font-size:13px;color:var(--muted);line-height:1.6}
/* Nav */
.sp-nav{position:sticky;bottom:0;background:rgba(247,243,237,.96);backdrop-filter:blur(12px);border-top:1px solid var(--bdr);padding:16px 56px;display:flex;gap:12px;margin:0 -56px}
.sp-btn-back{padding:12px 22px;border-radius:12px;border:1.5px solid var(--bdr);background:transparent;font-family:var(--sans);font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .18s}
.sp-btn-back:hover:not(:disabled){border-color:var(--ink);color:var(--ink)}
.sp-btn-back:disabled{opacity:.3;cursor:default}
.sp-btn-next{flex:1;padding:13px 24px;border-radius:12px;border:none;background:var(--ink);font-family:var(--sans);font-size:14px;font-weight:600;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;box-shadow:0 4px 16px rgba(28,24,20,.18)}
.sp-btn-next:hover:not(:disabled){background:var(--rust);transform:translateY(-1px);box-shadow:0 6px 20px rgba(200,75,31,.3)}
.sp-btn-next:disabled{opacity:.5;cursor:default;transform:none}
.sp-note{font-size:12px;color:var(--ghost);line-height:1.5;margin-top:6px}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@media(max-width:700px){
  .sp-sidebar{display:none}
  .sp-main-inner{padding:28px 20px}
  .sp-nav{padding:14px 20px;margin:0 -20px}
  .sp-g2{grid-template-columns:1fr}
}
`

/* ── Amenities hook ──────────────────────────────────────────── */
function useAmenityOptions() {
  return useQuery<AmenityOption[]>({
    queryKey: ['amenity-options'],
    queryFn: async () => {
      const res = await fetch('/api/admin/amenities')
      const data = await res.json()
      return data.options || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

/* ── Sub-components ──────────────────────────────────────────── */
function Field({ label, required, children, note }: {
  label: string; required?: boolean; children: React.ReactNode; note?: string
}) {
  return (
    <div className="sp-field">
      <label className="sp-lbl">{label}{required && <span className="sp-req"> *</span>}</label>
      {children}
      {note && <p className="sp-note">{note}</p>}
    </div>
  )
}

function DynSel({ label, fieldKey, options, isLoading, required, formData, set, placeholder }: {
  label: string; fieldKey: string; options: { label: string; value: string }[]
  isLoading?: boolean; required?: boolean; formData: FD
  set: (k: string, v: string) => void; placeholder?: string
}) {
  return (
    <Field label={label} required={required}>
      <div className="sp-sel-wrap">
        <select
          className="sp-sel"
          value={(formData[fieldKey] as string) || ''}
          onChange={e => set(fieldKey, e.target.value)}
          disabled={isLoading}
          style={{ color: (formData[fieldKey] as string) ? 'var(--ink)' : 'var(--ghost)' }}
        >
          <option value="">{isLoading ? 'Loading…' : (placeholder || `Select ${label}`)}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </Field>
  )
}

function MultiChip({ label, fieldKey, options, isLoading, formData, toggle }: {
  label: string; fieldKey: string; options: { label: string; value: string }[]
  isLoading?: boolean; formData: FD; toggle: (k: string, v: string) => void
}) {
  const selected = (formData[fieldKey] as string[]) || []
  return (
    <Field label={label}>
      <div className="sp-chip-wrap">
        {isLoading
          ? <span className="sp-no-opts">Loading options…</span>
          : options.length === 0
            ? <span className="sp-no-opts">No options configured yet — add them in Admin → Settings</span>
            : options.map(o => (
              <button
                key={o.value} type="button"
                className={`sp-chip${selected.includes(o.value) ? ' on' : ''}`}
                onClick={() => toggle(fieldKey, o.value)}
              >{o.label}</button>
            ))
        }
      </div>
    </Field>
  )
}

function ImageUpload({ label, hint, file, onChange }: {
  label: string; hint: string; file: File | null; onChange: (f: File | null) => void
}) {
  const handleFile = (f: File | null) => {
    if (!f) { onChange(null); return }
    if (!IMG_TYPES.includes(f.type)) { toast.error(`${label}: JPG, PNG or WEBP only`); return }
    if (f.size > MAX_BYTES) { toast.error(`${label} too large — max 1 MB`); return }
    onChange(f)
  }
  return (
    <Field label={label}>
      {file ? (
        <div className="sp-file-prev">
          <img className="sp-file-thumb" src={URL.createObjectURL(file)} alt="preview" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sp-file-name">{file.name}</div>
            <div className="sp-file-size">{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button type="button" onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ghost)', padding: 4 }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className="sp-upload">
          <input type="file" accept={IMG_TYPES.join(',')} style={{ display: 'none' }}
            onChange={e => { handleFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
          <div className="sp-upload-icon"><Upload size={20} color="var(--rust)" /></div>
          <div className="sp-upload-text">Upload {label}</div>
          <div className="sp-upload-hint">{hint}</div>
        </label>
      )}
    </Field>
  )
}

/* ── Amenities Step ──────────────────────────────────────────── */
function AmenitiesStep({ selectedIds, toggle }: {
  selectedIds: string[]; toggle: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState('facility')
  const { data: allOptions = [], isLoading } = useAmenityOptions()
  const tabOptions = allOptions.filter(o => o.category === activeTab)

  return (
    <>
      <div className="sp-eyebrow">Step 4 of 6 — Features</div>
      <h1 className="sp-title">What makes your<br /><em>school stand out?</em></h1>
      <p className="sp-desc">Select everything your school offers. Parents use this to compare and shortlist.</p>

      <div className="sp-a-nav">
        {AMENITY_TABS.map(t => (
          <button key={t.key} type="button"
            className={`sp-a-tab${activeTab === t.key ? ' on' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="sp-a-empty">Loading options…</div>
      ) : tabOptions.length === 0 ? (
        <div className="sp-a-empty">
          No options yet for this category.<br />
          <strong style={{ color: 'var(--rust)' }}>Admin → Amenities</strong> to add them.
        </div>
      ) : (
        <div className="sp-a-grid">
          {tabOptions.map(opt => {
            const on = selectedIds.includes(opt.id)
            return (
              <button key={opt.id} type="button"
                className={`sp-a-chip${on ? ' on' : ''}`}
                onClick={() => toggle(opt.id)}
              >
                {opt.icon && <span className="sp-a-icon">{opt.icon}</span>}
                <span style={{ flex: 1 }}>{opt.label}</span>
                {on && <CheckCircle2 className="sp-a-check" size={15} />}
              </button>
            )
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="sp-a-count">
          ✓ {selectedIds.length} feature{selectedIds.length > 1 ? 's' : ''} selected across all categories
        </p>
      )}
    </>
  )
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FD>({ board: [], admissionOpen: false })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([])

  const set   = (k: string, v: FD[string]) => setFormData(p => ({ ...p, [k]: v }))
  const setS  = (k: string, v: string)     => set(k, v)
  const toggle = (k: string, v: string) => {
    const arr = (formData[k] as string[]) || []
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }
  const toggleAmenity = (id: string) =>
    setSelectedAmenityIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  /* ── All dropdowns from DB ── */
  const { options: boards,         isLoading: lBoards }   = useDropdown('board')
  const { options: schoolTypes,    isLoading: lTypes }     = useDropdown('school_type')
  const { options: genderPolicies, isLoading: lGender }    = useDropdown('gender_policy')
  const { options: mediums,        isLoading: lMedium }    = useDropdown('medium')
  const { options: religions,      isLoading: lReligion }  = useDropdown('religion')
  const { options: recognitions,   isLoading: lRecog }     = useDropdown('recognition')
  const { options: classLevels,    isLoading: lClass }     = useDropdown('class_level')
  const { options: states,         isLoading: lStates }    = useDropdown('state')
  const { options: cities,         isLoading: lCities }    = useDropdown('city', {
    parentValue: formData.state as string,
    enabled: !!formData.state,
  })
  const { options: academicYears,  isLoading: lAcYear }    = useDropdown('academic_year')

  /* ── Save ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(i => fd.append(k, i))
        else fd.append(k, String(v))
      })
      selectedAmenityIds.forEach(id => fd.append('amenityId', id))
      if (logoFile)  fd.append('logo',  logoFile)
      if (coverFile) fd.append('cover', coverFile)
      const r = await fetch('/api/schools/profile', { method: 'POST', credentials: 'include', body: fd })
      const data = await r.json()
      if (!r.ok) throw data
      return data
    },
    onSuccess: async () => {
      await fetch('/api/auth/complete-profile', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileCompleted: true }),
      })
      if (user) setUser({ ...user, profileCompleted: true })
      toast.success('School profile saved! 🎉')
      router.push('/dashboard/school')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save. Please try again.'),
  })

  const pct    = Math.round(((step + 1) / STEPS.length) * 100)
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  /* ── Step content ── */
  const renderStep = () => {
    /* Step 0 — Basic Info */
    if (step === 0) return (
      <>
        <div className="sp-eyebrow">Step 1 of 6 — Getting started</div>
        <h1 className="sp-title">Your school's<br /><em>first impression</em></h1>
        <p className="sp-desc">These details appear at the top of your public profile — make them compelling.</p>

        <Field label="School Name" required>
          <input className="sp-inp" value={(formData.name as string) || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Delhi Public School, Sector 132" />
        </Field>
        <div className="sp-g2">
          <Field label="Tagline">
            <input className="sp-inp" value={(formData.tagline as string) || ''} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Empowering Minds, Shaping Futures" />
          </Field>
          <Field label="Affiliation Number">
            <input className="sp-inp" value={(formData.affiliationNo as string) || ''} onChange={e => set('affiliationNo', e.target.value)} placeholder="e.g. 2730071" />
          </Field>
        </div>
        <Field label="School Description" required>
          <textarea className="sp-ta sp-inp" rows={4}
            value={(formData.description as string) || ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe your school's vision, teaching philosophy, values, and what makes it truly unique for a parent reading this…"
          />
        </Field>
        <Field label="Year Established">
          <input className="sp-inp" style={{ maxWidth: 160 }} type="number"
            value={(formData.foundingYear as number) || ''}
            onChange={e => set('foundingYear', Number(e.target.value))}
            placeholder="e.g. 1978" min={1800} max={new Date().getFullYear()} />
        </Field>
      </>
    )

    /* Step 1 — Type & Board */
    if (step === 1) return (
      <>
        <div className="sp-eyebrow">Step 2 of 6 — Classification</div>
        <h1 className="sp-title">Type, boards &<br /><em>policies</em></h1>
        <p className="sp-desc">Help parents filter and find you based on what matters most to their family.</p>

        <div className="sp-g2">
          <DynSel label="School Type"           fieldKey="schoolType"          options={schoolTypes}    isLoading={lTypes}   required formData={formData} set={setS} />
          <DynSel label="Gender Policy"         fieldKey="genderPolicy"        options={genderPolicies} isLoading={lGender}  required formData={formData} set={setS} />
          <DynSel label="Medium of Instruction" fieldKey="mediumOfInstruction" options={mediums}        isLoading={lMedium}  required formData={formData} set={setS} />
          <DynSel label="Religion / Affiliation" fieldKey="religion"           options={religions}      isLoading={lReligion}         formData={formData} set={setS} />
          <DynSel label="Recognition"           fieldKey="recognition"         options={recognitions}   isLoading={lRecog}            formData={formData} set={setS} />
        </div>
        <div className="sp-g2">
          <Field label="Total Students">
            <input className="sp-inp" type="number"
              value={(formData.totalStudents as number) || ''}
              onChange={e => set('totalStudents', Number(e.target.value))}
              placeholder="e.g. 1,500" />
          </Field>
          <Field label="Student : Teacher Ratio">
            <input className="sp-inp"
              value={(formData.studentTeacherRatio as string) || ''}
              onChange={e => set('studentTeacherRatio', e.target.value)}
              placeholder="e.g. 25:1" />
          </Field>
        </div>
        <MultiChip label="Board(s) of Education" fieldKey="board" options={boards} isLoading={lBoards} formData={formData} toggle={toggle} />
      </>
    )

    /* Step 2 — Classes & Fees */
    if (step === 2) return (
      <>
        <div className="sp-eyebrow">Step 3 of 6 — Fees & classes</div>
        <h1 className="sp-title">Classes &<br /><em>fee structure</em></h1>
        <p className="sp-desc">Transparent fee information builds trust and helps parents decide faster.</p>

        <div className="sp-g2">
          <DynSel label="Classes From" fieldKey="classesFrom" options={classLevels} isLoading={lClass} required formData={formData} set={setS} placeholder="Select starting class" />
          <DynSel label="Classes To"   fieldKey="classesTo"   options={classLevels} isLoading={lClass} required formData={formData} set={setS} placeholder="Select ending class" />
        </div>

        <div className="sp-divider">Monthly Tuition Fee (₹)</div>
        <div className="sp-g2">
          <Field label="Minimum">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number"
                value={(formData.monthlyFeeMin as number) || ''}
                onChange={e => set('monthlyFeeMin', Number(e.target.value))}
                placeholder="e.g. 3,000" />
            </div>
          </Field>
          <Field label="Maximum">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number"
                value={(formData.monthlyFeeMax as number) || ''}
                onChange={e => set('monthlyFeeMax', Number(e.target.value))}
                placeholder="e.g. 10,000" />
            </div>
          </Field>
        </div>
        <Field label="Annual / Admission Fee (₹)">
          <div style={{ position: 'relative', maxWidth: 220 }}>
            <span className="sp-pfx">₹</span>
            <input className="sp-inp sp-pfx-inp" type="number"
              value={(formData.annualFee as number) || ''}
              onChange={e => set('annualFee', Number(e.target.value))}
              placeholder="e.g. 25,000" />
          </div>
        </Field>

        <div className="sp-divider">Admission Info</div>
        <div style={{ maxWidth: 240, marginBottom: 16 }}>
          <DynSel label="Academic Year" fieldKey="admissionAcademicYear" options={academicYears} isLoading={lAcYear} formData={formData} set={setS} />
        </div>
        <div className="sp-tog-row">
          <span className="sp-tog-label">Admissions currently open</span>
          <label className="sp-tog">
            <input type="checkbox" checked={!!formData.admissionOpen}
              onChange={e => set('admissionOpen', e.target.checked)} />
            <span className="sp-sl" />
          </label>
        </div>
      </>
    )

    /* Step 3 — Features (Amenities) */
    if (step === 3) return (
      <AmenitiesStep selectedIds={selectedAmenityIds} toggle={toggleAmenity} />
    )

    /* Step 4 — Location */
    if (step === 4) return (
      <>
        <div className="sp-eyebrow">Step 5 of 6 — Location</div>
        <h1 className="sp-title">Where will parents<br /><em>find you?</em></h1>
        <p className="sp-desc">Accurate location ensures you appear in the right area searches and map results.</p>

        <Field label="Street Address" required>
          <input className="sp-inp"
            value={(formData.addressLine1 as string) || ''}
            onChange={e => set('addressLine1', e.target.value)}
            placeholder="e.g. Plot No. 12, Sector 132, Noida" />
        </Field>
        <div className="sp-g2">
          <DynSel label="State" fieldKey="state" options={states} isLoading={lStates} required formData={formData} set={setS} />
          <Field label="City" required>
            <div className="sp-sel-wrap">
              <select className="sp-sel"
                value={(formData.city as string) || ''}
                onChange={e => set('city', e.target.value)}
                disabled={!formData.state || lCities}
                style={{ color: (formData.city as string) ? 'var(--ink)' : 'var(--ghost)' }}
              >
                <option value="">
                  {!formData.state ? 'Select state first' : lCities ? 'Loading…' : 'Select city'}
                </option>
                {cities.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Locality / Area">
            <input className="sp-inp"
              value={(formData.locality as string) || ''}
              onChange={e => set('locality', e.target.value)}
              placeholder="e.g. Sector 18" />
          </Field>
          <Field label="Pincode" required>
            <input className="sp-inp"
              value={(formData.pincode as string) || ''}
              onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))}
              placeholder="e.g. 201301" maxLength={6} />
          </Field>
          <Field label="Latitude (GPS)">
            <input className="sp-inp" type="number" step="0.0000001"
              value={(formData.latitude as number) || ''}
              onChange={e => set('latitude', Number(e.target.value))}
              placeholder="e.g. 28.5355" />
          </Field>
          <Field label="Longitude (GPS)">
            <input className="sp-inp" type="number" step="0.0000001"
              value={(formData.longitude as number) || ''}
              onChange={e => set('longitude', Number(e.target.value))}
              placeholder="e.g. 77.3910" />
          </Field>
        </div>
        <p className="sp-note">
          📍 Right-click your school on Google Maps → "What's here?" to get GPS coordinates.
        </p>
      </>
    )

    /* Step 5 — Contact & Media (Last) */
    if (step === 5) return (
      <>
        <div className="sp-eyebrow">Step 6 of 6 — Almost there!</div>
        <h1 className="sp-title">Contact info &<br /><em>your best photos</em></h1>
        <p className="sp-desc">Add contact details and upload images — then your profile goes live!</p>

        <div className="sp-g2">
          <Field label="School Phone">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Phone size={15} /></span>
              <input className="sp-inp"
                value={(formData.phone as string) || ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
          </Field>
          <Field label="School Email">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Mail size={15} /></span>
              <input className="sp-inp" type="email"
                value={(formData.email as string) || ''}
                onChange={e => set('email', e.target.value)}
                placeholder="admissions@school.edu.in" />
            </div>
          </Field>
        </div>
        <Field label="Website URL">
          <div className="sp-with-icon" style={{ position: 'relative' }}>
            <span className="sp-fi"><Globe size={15} /></span>
            <input className="sp-inp"
              value={(formData.websiteUrl as string) || ''}
              onChange={e => set('websiteUrl', e.target.value)}
              placeholder="https://www.yourschool.edu.in" />
          </div>
        </Field>
        <Field label="Principal Name">
          <input className="sp-inp"
            value={(formData.principalName as string) || ''}
            onChange={e => set('principalName', e.target.value)}
            placeholder="e.g. Dr. Ranjana Sharma" />
        </Field>

        <div className="sp-divider">School Photos</div>
        <div className="sp-g2">
          <ImageUpload label="School Logo"  hint="Square · JPG, PNG, WEBP · Max 1 MB"         file={logoFile}  onChange={setLogoFile} />
          <ImageUpload label="Cover Photo"  hint="1200×400px recommended · Max 1 MB"           file={coverFile} onChange={setCoverFile} />
        </div>
        <div className="sp-info" style={{ marginTop: 20 }}>
          <strong style={{ color: 'var(--rust)' }}>Almost done!</strong> After saving, you can upload additional gallery photos, manage your team, and configure lead preferences from your school dashboard.
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sp">

        {/* ── SIDEBAR ── */}
        <aside className="sp-sidebar">
          <div className="sp-sb-brand">
            <div className="sp-sb-icon">
              <GraduationCap size={20} color="white" />
            </div>
            <div className="sp-sb-name">Thynk<span>Schooling</span></div>
          </div>

          <div className="sp-sb-steps">
            {STEPS.map((s, i) => {
              const cls = i < step ? 'done' : i === step ? 'active' : 'todo'
              return (
                <div key={s.label} className={`sp-sb-step ${cls}`}>
                  <div className="sp-sb-num">
                    {i < step
                      ? <CheckCircle2 size={13} />
                      : <span>{i + 1}</span>
                    }
                  </div>
                  <div>
                    <div className="sp-sb-label">{s.label}</div>
                    <div className="sp-sb-sub">{s.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sp-sb-prog">
            <div className="sp-sb-prog-meta">
              Profile completion <span>{pct}%</span>
            </div>
            <div className="sp-sb-track">
              <div className="sp-sb-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="sp-main">
          <div className="sp-main-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="sp-nav">
              <button className="sp-btn-back" onClick={() => setStep(s => s - 1)} disabled={isFirst}>
                <ArrowLeft size={14} /> Back
              </button>
              {isLast ? (
                <button className="sp-btn-next" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                  style={{ background: saveMutation.isPending ? 'var(--ghost)' : 'var(--rust)' }}>
                  {saveMutation.isPending
                    ? <><Loader2 size={15} style={{ animation: 'sp-spin 1s linear infinite' }} /> Saving…</>
                    : <><Save size={15} /> Save Profile & Go to Dashboard</>
                  }
                </button>
              ) : (
                <button className="sp-btn-next" onClick={() => setStep(s => s + 1)}>
                  Continue <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </main>

      </div>
    </>
  )
}
