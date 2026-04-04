'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2,
  Upload, MapPin, Phone, Mail, Globe, DollarSign,
  School, CheckCircle2, X, Star,
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

/* ── Types ── */
type FD = Record<string, string | string[] | number | boolean>
interface AmenityOption {
  id: string; category: string; label: string; value: string; icon?: string
}

/* ── Steps ── */
const STEPS = [
  { label: 'Basic Info',      sub: 'Name, tagline & description',     icon: School },
  { label: 'Type & Board',    sub: 'School type, boards & policies',  icon: GraduationCap },
  { label: 'Classes & Fees',  sub: 'Class range, fees & admission',   icon: DollarSign },
  { label: 'Features',        sub: 'Facilities, sports & activities', icon: Star },
  { label: 'Location',        sub: 'Address & GPS coordinates',       icon: MapPin },
  { label: 'Contact & Media', sub: 'Phone, email & photos',           icon: Phone },
]

const STEP_META = [
  { badge: 'Step 1 of 6 — Getting started',  h1: "Your school's",    h2: 'first impression',  desc: 'These details appear at the top of your public profile — make them count.' },
  { badge: 'Step 2 of 6 — Classification',   h1: 'Type, boards &',   h2: 'policies',           desc: 'Help parents filter and find you based on what matters most to their family.' },
  { badge: 'Step 3 of 6 — Fees & classes',   h1: 'Classes &',        h2: 'fee structure',      desc: 'Transparent fee information builds trust and converts more parents.' },
  { badge: 'Step 4 of 6 — Features',         h1: 'What makes your',  h2: 'school stand out?',  desc: 'Select everything your school offers — parents use this to compare and shortlist.' },
  { badge: 'Step 5 of 6 — Location',         h1: 'Where will parents', h2: 'find you?',        desc: 'Accurate location ensures you appear in the right area searches and map results.' },
  { badge: 'Step 6 of 6 — Almost there!',    h1: 'Contact info &',   h2: 'your best photos',   desc: 'Add contact details and upload images — then your profile goes live!' },
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Cabinet+Grotesk:wght@400;500;700&display=swap');
.sp *{box-sizing:border-box;margin:0;padding:0}
.sp{
  --bg:#F5F0E8;--white:#FFFFFF;--ink:#14110E;
  --brand:#D4520F;--brand2:#F06325;--brand-pale:#FEF0E7;
  --muted:#6B6259;--ghost:#A89F97;--bdr:#E2DAD0;
  font-family:'Cabinet Grotesk',sans-serif;
  background:var(--bg);color:var(--ink);
  display:flex;min-height:100vh;
}
.sp-sb{width:300px;flex-shrink:0;background:#14110E;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.sp-sb::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E")}
.sp-sb-head{position:relative;z-index:1;padding:28px 28px 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.sp-sb-logo{display:flex;align-items:center;gap:10px}
.sp-sb-icon{width:40px;height:40px;border-radius:12px;flex-shrink:0;background:linear-gradient(135deg,var(--brand),var(--brand2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(212,82,15,.45)}
.sp-sb-name{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;color:#fff;letter-spacing:-.01em}
.sp-sb-name span{color:var(--brand2)}
.sp-sb-tagline{font-size:11px;color:rgba(255,255,255,.28);margin-top:8px;font-weight:500;letter-spacing:.03em}
.sp-sb-steps{flex:1;padding:12px 0;overflow-y:auto;scrollbar-width:none;position:relative;z-index:1}
.sp-sb-steps::-webkit-scrollbar{display:none}
.sp-sb-conn{width:1px;height:18px;background:rgba(255,255,255,.07);margin-left:44px}
.sp-sb-step{display:flex;align-items:center;gap:14px;padding:12px 28px;position:relative;transition:background .2s}
.sp-sb-step.active{background:rgba(212,82,15,.15)}
.sp-sb-step.active::after{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:var(--brand2);border-radius:0 3px 3px 0}
.sp-sb-num{width:32px;height:32px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;transition:all .3s}
.sp-sb-step.done  .sp-sb-num{background:rgba(212,82,15,.22);color:var(--brand2)}
.sp-sb-step.active .sp-sb-num{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;box-shadow:0 4px 14px rgba(212,82,15,.4)}
.sp-sb-step.todo  .sp-sb-num{background:rgba(255,255,255,.05);color:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.07)}
.sp-sb-lbl{font-size:13px;font-weight:700;line-height:1.2;transition:color .2s}
.sp-sb-step.done  .sp-sb-lbl{color:rgba(255,255,255,.55)}
.sp-sb-step.active .sp-sb-lbl{color:#fff}
.sp-sb-step.todo  .sp-sb-lbl{color:rgba(255,255,255,.22)}
.sp-sb-sub{font-size:11px;margin-top:2px;font-weight:400}
.sp-sb-step.done  .sp-sb-sub{color:rgba(255,255,255,.2)}
.sp-sb-step.active .sp-sb-sub{color:rgba(255,255,255,.45)}
.sp-sb-step.todo  .sp-sb-sub{color:rgba(255,255,255,.12)}
.sp-sb-foot{position:relative;z-index:1;padding:18px 28px 26px;border-top:1px solid rgba(255,255,255,.07)}
.sp-sb-pct-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
.sp-sb-pct-lbl{font-size:11px;color:rgba(255,255,255,.3);font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.sp-sb-pct-val{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:var(--brand2)}
.sp-sb-track{height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden}
.sp-sb-fill{height:100%;background:linear-gradient(90deg,var(--brand),var(--brand2));border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.sp-main{flex:1;overflow-y:auto;max-height:100vh;background:var(--bg)}
.sp-main-inner{padding:52px 60px 20px;max-width:700px}
.sp-badge{display:inline-flex;align-items:center;gap:7px;background:var(--brand-pale);border:1px solid rgba(212,82,15,.25);color:var(--brand);border-radius:99px;padding:5px 13px;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:18px}
.sp-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--brand);flex-shrink:0}
.sp-title{font-family:'Syne',sans-serif;font-weight:800;font-size:44px;line-height:1.06;letter-spacing:-.025em;color:var(--ink);margin-bottom:10px}
.sp-title-accent{color:var(--brand);display:inline-block;position:relative}
.sp-title-accent::after{content:'';position:absolute;left:0;bottom:-3px;right:0;height:3px;background:linear-gradient(90deg,var(--brand),var(--brand2));border-radius:99px}
.sp-desc{font-size:15px;color:var(--muted);line-height:1.65;margin-bottom:38px;max-width:480px;font-weight:400}
.sp-field{margin-bottom:20px}
.sp-lbl{display:block;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ghost);margin-bottom:7px}
.sp-req{color:var(--brand)}
.sp-inp,.sp-sel,.sp-ta{width:100%;padding:13px 16px;border:1.5px solid var(--bdr);border-radius:12px;font-family:'Cabinet Grotesk',sans-serif;font-size:15px;color:var(--ink);background:var(--white);outline:none;appearance:none;transition:border .18s,box-shadow .18s}
.sp-inp:focus,.sp-sel:focus,.sp-ta:focus{border-color:var(--brand);box-shadow:0 0 0 4px rgba(212,82,15,.1)}
.sp-inp::placeholder,.sp-ta::placeholder{color:var(--ghost)}
.sp-ta{resize:none;line-height:1.65}
.sp-sel{cursor:pointer;padding-right:38px}
.sp-sel-wrap{position:relative}
.sp-sel-wrap::after{content:'';position:absolute;right:15px;top:50%;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--ghost);pointer-events:none}
.sp-with-icon{position:relative}
.sp-with-icon .sp-inp{padding-left:42px}
.sp-fi{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--ghost);display:flex;align-items:center;pointer-events:none}
.sp-pfx{position:absolute;left:15px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--muted);font-size:15px;pointer-events:none}
.sp-pfx-inp{padding-left:28px !important}
.sp-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sp-note{font-size:12px;color:var(--ghost);line-height:1.5;margin-top:6px}
.sp-chip-wrap{display:flex;flex-wrap:wrap;gap:8px;padding:14px;background:rgba(255,255,255,.6);border:1.5px solid var(--bdr);border-radius:14px;min-height:52px}
.sp-chip{padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;border:1.5px solid var(--bdr);color:var(--muted);cursor:pointer;transition:all .15s;background:var(--white);font-family:'Cabinet Grotesk',sans-serif}
.sp-chip:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-pale)}
.sp-chip.on{background:var(--brand);border-color:var(--brand);color:#fff}
.sp-no-opts{font-size:13px;color:var(--ghost);font-style:italic;padding:4px 0}
.sp-tog-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--white);border:1.5px solid var(--bdr);border-radius:12px}
.sp-tog-lbl{font-size:15px;font-weight:600;color:var(--ink)}
.sp-tog{position:relative;width:46px;height:26px;cursor:pointer;flex-shrink:0}
.sp-tog input{opacity:0;width:0;height:0}
.sp-sl{position:absolute;inset:0;background:#D5CFC8;border-radius:99px;transition:.25s}
.sp-sl:before{content:'';position:absolute;width:20px;height:20px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.sp-tog input:checked+.sp-sl{background:var(--brand)}
.sp-tog input:checked+.sp-sl:before{transform:translateX(20px)}
.sp-a-nav{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:16px;padding-bottom:2px}
.sp-a-nav::-webkit-scrollbar{display:none}
.sp-a-tab{padding:9px 18px;border-radius:10px;font-size:13px;font-weight:700;border:1.5px solid var(--bdr);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .18s;background:var(--white);color:var(--muted);font-family:'Cabinet Grotesk',sans-serif}
.sp-a-tab:hover{border-color:var(--brand);color:var(--brand)}
.sp-a-tab.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sp-a-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.sp-a-chip{display:flex;align-items:center;gap:9px;padding:11px 14px;border:1.5px solid var(--bdr);border-radius:12px;cursor:pointer;transition:all .15s;background:var(--white);font-size:13px;font-weight:500;color:var(--muted);font-family:'Cabinet Grotesk',sans-serif;width:100%;text-align:left}
.sp-a-chip:hover{border-color:var(--brand);background:var(--brand-pale);color:var(--brand)}
.sp-a-chip.on{background:var(--brand-pale);border-color:var(--brand);color:var(--brand);font-weight:700}
.sp-a-icon{font-size:18px;flex-shrink:0}
.sp-a-chk{margin-left:auto;flex-shrink:0;color:var(--brand)}
.sp-a-count{font-size:13px;color:var(--brand);font-weight:700;margin-top:12px}
.sp-a-empty{font-size:13px;color:var(--ghost);padding:28px;text-align:center;background:rgba(255,255,255,.5);border:1.5px dashed var(--bdr);border-radius:14px;line-height:1.6}
.sp-upload{border:2px dashed var(--bdr);border-radius:14px;padding:28px;text-align:center;cursor:pointer;transition:border .2s,background .2s;display:block}
.sp-upload:hover{border-color:var(--brand);background:var(--brand-pale)}
.sp-u-icon{width:48px;height:48px;border-radius:14px;background:var(--brand-pale);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.sp-u-text{font-size:14px;font-weight:700;color:var(--muted);margin-bottom:4px}
.sp-u-hint{font-size:12px;color:var(--ghost)}
.sp-file-prev{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--brand-pale);border:1.5px solid rgba(212,82,15,.25);border-radius:12px}
.sp-f-thumb{width:46px;height:46px;border-radius:10px;object-fit:cover;flex-shrink:0}
.sp-f-name{font-size:14px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-f-size{font-size:11px;color:var(--ghost)}
.sp-divider{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ghost);margin:28px 0 18px;display:flex;align-items:center;gap:10px}
.sp-divider::after{content:'';flex:1;height:1px;background:var(--bdr)}
.sp-info{padding:16px 18px;background:var(--brand-pale);border:1.5px solid rgba(212,82,15,.2);border-radius:14px;font-size:14px;color:var(--muted);line-height:1.65}
.sp-nav{position:sticky;bottom:0;background:rgba(245,240,232,.96);backdrop-filter:blur(16px);border-top:1px solid var(--bdr);padding:18px 60px;display:flex;gap:12px;margin:0 -60px}
.sp-btn-back{padding:13px 24px;border-radius:12px;border:1.5px solid var(--bdr);background:transparent;font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:700;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .18s}
.sp-btn-back:hover:not(:disabled){border-color:var(--ink);color:var(--ink)}
.sp-btn-back:disabled{opacity:.3;cursor:default}
.sp-btn-next{flex:1;padding:14px 24px;border-radius:12px;border:none;background:var(--ink);font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .22s;letter-spacing:-.01em;box-shadow:0 4px 20px rgba(20,17,14,.2)}
.sp-btn-next:hover:not(:disabled){background:var(--brand);transform:translateY(-1px);box-shadow:0 8px 24px rgba(212,82,15,.35)}
.sp-btn-next:disabled{opacity:.5;cursor:default;transform:none}
.sp-btn-save{background:var(--brand) !important}
.sp-btn-save:hover:not(:disabled){background:#B8420D !important}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@media(max-width:720px){
  .sp-sb{display:none}
  .sp-main-inner{padding:28px 20px}
  .sp-nav{padding:14px 20px;margin:0 -20px}
  .sp-title{font-size:32px}
  .sp-g2{grid-template-columns:1fr}
}
`

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

function DynSel({ label, fieldKey, options, isLoading, required, placeholder, formData, set }: {
  label: string; fieldKey: string; options: { label: string; value: string }[]
  isLoading?: boolean; required?: boolean; placeholder?: string
  formData: FD; set: (k: string, v: string) => void
}) {
  return (
    <Field label={label} required={required}>
      <div className="sp-sel-wrap">
        <select className="sp-sel"
          value={(formData[fieldKey] as string) || ''}
          onChange={e => set(fieldKey, e.target.value)}
          disabled={isLoading}
          style={{ color: formData[fieldKey] ? 'var(--ink)' : 'var(--ghost)' }}
        >
          <option value="">{isLoading ? 'Loading…' : placeholder || `Select ${label}`}</option>
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
          ? <span className="sp-no-opts">Loading…</span>
          : options.length === 0
            ? <span className="sp-no-opts">No options yet — add them in Admin → Settings</span>
            : options.map(o => (
              <button key={o.value} type="button"
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
  const handle = (f: File | null) => {
    if (!f) { onChange(null); return }
    if (!IMG_TYPES.includes(f.type)) { toast.error(`${label}: JPG, PNG or WEBP only`); return }
    if (f.size > MAX_BYTES) { toast.error(`${label} too large — max 1 MB`); return }
    onChange(f)
  }
  return (
    <Field label={label}>
      {file ? (
        <div className="sp-file-prev">
          <img className="sp-f-thumb" src={URL.createObjectURL(file)} alt="" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sp-f-name">{file.name}</div>
            <div className="sp-f-size">{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button type="button" onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ghost)', padding: 4, display: 'flex' }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className="sp-upload">
          <input type="file" accept={IMG_TYPES.join(',')} style={{ display: 'none' }}
            onChange={e => { handle(e.target.files?.[0] ?? null); e.target.value = '' }} />
          <div className="sp-u-icon"><Upload size={22} color="var(--brand)" /></div>
          <div className="sp-u-text">Upload {label}</div>
          <div className="sp-u-hint">{hint}</div>
        </label>
      )}
    </Field>
  )
}

function StepHeader({ step }: { step: number }) {
  const m = STEP_META[step]
  return (
    <>
      <div className="sp-badge"><span className="sp-badge-dot" />{m.badge}</div>
      <h1 className="sp-title">{m.h1}<br /><span className="sp-title-accent">{m.h2}</span></h1>
      <p className="sp-desc">{m.desc}</p>
    </>
  )
}

function AmenitiesStep({ selectedIds, toggle }: { selectedIds: string[]; toggle: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState('facility')
  const { data: allOptions = [], isLoading } = useAmenityOptions()
  const tabOptions = allOptions.filter(o => o.category === activeTab)
  return (
    <>
      <StepHeader step={3} />
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
          No options configured yet.<br />
          Go to <strong style={{ color: 'var(--brand)' }}>Admin → Amenities</strong> to add them.
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
                {on && <CheckCircle2 className="sp-a-chk" size={15} />}
              </button>
            )
          })}
        </div>
      )}
      {selectedIds.length > 0 && (
        <p className="sp-a-count">✓ {selectedIds.length} feature{selectedIds.length > 1 ? 's' : ''} selected across all categories</p>
      )}
    </>
  )
}

export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FD>({ board: [], admissionOpen: false })
  const [logoFile,  setLogoFile]  = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([])

  const set    = (k: string, v: FD[string]) => setFormData(p => ({ ...p, [k]: v }))
  const setS   = (k: string, v: string)     => set(k, v)
  const toggle = (k: string, v: string) => {
    const arr = (formData[k] as string[]) || []
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }
  const toggleAmenity = (id: string) =>
    setSelectedAmenityIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const { options: boards,         isLoading: lBoards }  = useDropdown('board')
  const { options: schoolTypes,    isLoading: lTypes }    = useDropdown('school_type')
  const { options: genderPolicies, isLoading: lGender }   = useDropdown('gender_policy')
  const { options: mediums,        isLoading: lMedium }   = useDropdown('medium')
  const { options: religions,      isLoading: lReligion } = useDropdown('religion')
  const { options: recognitions,   isLoading: lRecog }    = useDropdown('recognition')
  const { options: classLevels,    isLoading: lClass }    = useDropdown('class_level')
  const { options: states,         isLoading: lStates }   = useDropdown('state')
  const { options: cities,         isLoading: lCities }   = useDropdown('city', {
    parentValue: formData.state as string,
    enabled: !!formData.state,
  })
  const { options: academicYears,  isLoading: lAcYear }   = useDropdown('academic_year')

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
  const isLast  = step === STEPS.length - 1
  const isFirst = step === 0

  const renderStep = () => {
    if (step === 0) return (
      <>
        <StepHeader step={0} />
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
            placeholder="Describe your school's vision, teaching philosophy, values, and what makes it truly unique…" />
        </Field>
        <Field label="Year Established">
          <input className="sp-inp" type="number" style={{ maxWidth: 160 }}
            value={(formData.foundingYear as number) || ''}
            onChange={e => set('foundingYear', Number(e.target.value))}
            placeholder="e.g. 1978" min={1800} max={new Date().getFullYear()} />
        </Field>
      </>
    )

    if (step === 1) return (
      <>
        <StepHeader step={1} />
        <div className="sp-g2">
          <DynSel label="School Type"            fieldKey="schoolType"          options={schoolTypes}    isLoading={lTypes}    required formData={formData} set={setS} />
          <DynSel label="Gender Policy"          fieldKey="genderPolicy"        options={genderPolicies} isLoading={lGender}   required formData={formData} set={setS} />
          <DynSel label="Medium of Instruction"  fieldKey="mediumOfInstruction" options={mediums}        isLoading={lMedium}   required formData={formData} set={setS} />
          <DynSel label="Religion / Affiliation" fieldKey="religion"            options={religions}      isLoading={lReligion}          formData={formData} set={setS} />
          <DynSel label="Recognition"            fieldKey="recognition"         options={recognitions}   isLoading={lRecog}             formData={formData} set={setS} />
        </div>
        <div className="sp-g2">
          <Field label="Total Students">
            <input className="sp-inp" type="number" value={(formData.totalStudents as number) || ''} onChange={e => set('totalStudents', Number(e.target.value))} placeholder="e.g. 1,500" />
          </Field>
          <Field label="Student : Teacher Ratio">
            <input className="sp-inp" value={(formData.studentTeacherRatio as string) || ''} onChange={e => set('studentTeacherRatio', e.target.value)} placeholder="e.g. 25:1" />
          </Field>
        </div>
        <MultiChip label="Board(s) of Education" fieldKey="board" options={boards} isLoading={lBoards} formData={formData} toggle={toggle} />
      </>
    )

    if (step === 2) return (
      <>
        <StepHeader step={2} />
        <div className="sp-g2">
          <DynSel label="Classes From" fieldKey="classesFrom" options={classLevels} isLoading={lClass} required placeholder="Select starting class" formData={formData} set={setS} />
          <DynSel label="Classes To"   fieldKey="classesTo"   options={classLevels} isLoading={lClass} required placeholder="Select ending class"   formData={formData} set={setS} />
        </div>
        <div className="sp-divider">Monthly Tuition Fee (₹)</div>
        <div className="sp-g2">
          <Field label="Minimum">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number" value={(formData.monthlyFeeMin as number) || ''} onChange={e => set('monthlyFeeMin', Number(e.target.value))} placeholder="e.g. 3,000" />
            </div>
          </Field>
          <Field label="Maximum">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number" value={(formData.monthlyFeeMax as number) || ''} onChange={e => set('monthlyFeeMax', Number(e.target.value))} placeholder="e.g. 10,000" />
            </div>
          </Field>
        </div>
        <Field label="Annual / Admission Fee (₹)">
          <div style={{ position: 'relative', maxWidth: 220 }}>
            <span className="sp-pfx">₹</span>
            <input className="sp-inp sp-pfx-inp" type="number" value={(formData.annualFee as number) || ''} onChange={e => set('annualFee', Number(e.target.value))} placeholder="e.g. 25,000" />
          </div>
        </Field>
        <div className="sp-divider">Admission Info</div>
        <div style={{ maxWidth: 240, marginBottom: 16 }}>
          <DynSel label="Academic Year" fieldKey="admissionAcademicYear" options={academicYears} isLoading={lAcYear} formData={formData} set={setS} />
        </div>
        <div className="sp-tog-row">
          <span className="sp-tog-lbl">Admissions currently open</span>
          <label className="sp-tog">
            <input type="checkbox" checked={!!formData.admissionOpen} onChange={e => set('admissionOpen', e.target.checked)} />
            <span className="sp-sl" />
          </label>
        </div>
      </>
    )

    if (step === 3) return <AmenitiesStep selectedIds={selectedAmenityIds} toggle={toggleAmenity} />

    if (step === 4) return (
      <>
        <StepHeader step={4} />
        <Field label="Street Address" required>
          <input className="sp-inp" value={(formData.addressLine1 as string) || ''} onChange={e => set('addressLine1', e.target.value)} placeholder="e.g. Plot No. 12, Sector 132, Noida" />
        </Field>
        <div className="sp-g2">
          <DynSel label="State" fieldKey="state" options={states} isLoading={lStates} required formData={formData} set={setS} />
          <Field label="City" required>
            <div className="sp-sel-wrap">
              <select className="sp-sel"
                value={(formData.city as string) || ''}
                onChange={e => set('city', e.target.value)}
                disabled={!formData.state || lCities}
                style={{ color: formData.city ? 'var(--ink)' : 'var(--ghost)' }}
              >
                <option value="">{!formData.state ? 'Select state first' : lCities ? 'Loading…' : 'Select City'}</option>
                {cities.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Locality / Area">
            <input className="sp-inp" value={(formData.locality as string) || ''} onChange={e => set('locality', e.target.value)} placeholder="e.g. Sector 18" />
          </Field>
          <Field label="Pincode" required>
            <input className="sp-inp" value={(formData.pincode as string) || ''} onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))} placeholder="e.g. 201301" maxLength={6} />
          </Field>
          <Field label="Latitude (GPS)">
            <input className="sp-inp" type="number" step="0.0000001" value={(formData.latitude as number) || ''} onChange={e => set('latitude', Number(e.target.value))} placeholder="e.g. 28.5355" />
          </Field>
          <Field label="Longitude (GPS)">
            <input className="sp-inp" type="number" step="0.0000001" value={(formData.longitude as number) || ''} onChange={e => set('longitude', Number(e.target.value))} placeholder="e.g. 77.3910" />
          </Field>
        </div>
        <p className="sp-note">📍 Right-click your school on Google Maps → "What's here?" to get GPS coordinates.</p>
      </>
    )

    if (step === 5) return (
      <>
        <StepHeader step={5} />
        <div className="sp-g2">
          <Field label="School Phone">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Phone size={15} /></span>
              <input className="sp-inp" value={(formData.phone as string) || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </Field>
          <Field label="School Email">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Mail size={15} /></span>
              <input className="sp-inp" type="email" value={(formData.email as string) || ''} onChange={e => set('email', e.target.value)} placeholder="admissions@school.edu.in" />
            </div>
          </Field>
        </div>
        <Field label="Website URL">
          <div className="sp-with-icon" style={{ position: 'relative' }}>
            <span className="sp-fi"><Globe size={15} /></span>
            <input className="sp-inp" value={(formData.websiteUrl as string) || ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://www.yourschool.edu.in" />
          </div>
        </Field>
        <Field label="Principal Name">
          <input className="sp-inp" value={(formData.principalName as string) || ''} onChange={e => set('principalName', e.target.value)} placeholder="e.g. Dr. Ranjana Sharma" />
        </Field>
        <div className="sp-divider">School Photos</div>
        <div className="sp-g2">
          <ImageUpload label="School Logo"  hint="Square · JPG, PNG, WEBP · Max 1 MB"  file={logoFile}  onChange={setLogoFile} />
          <ImageUpload label="Cover Photo"  hint="1200×400px recommended · Max 1 MB"    file={coverFile} onChange={setCoverFile} />
        </div>
        <div className="sp-info" style={{ marginTop: 20 }}>
          <strong style={{ color: 'var(--brand)' }}>You're almost done!</strong> After saving, upload gallery photos and manage all settings from your school dashboard.
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sp">

        {/* SIDEBAR */}
        <aside className="sp-sb">
          <div className="sp-sb-head">
            <div className="sp-sb-logo">
              <div className="sp-sb-icon"><GraduationCap size={21} color="white" /></div>
              <div className="sp-sb-name">Thynk<span>Schooling</span></div>
            </div>
            <div className="sp-sb-tagline">School Registration Portal</div>
          </div>

          <div className="sp-sb-steps">
            {STEPS.map((s, i) => {
              const cls = i < step ? 'done' : i === step ? 'active' : 'todo'
              return (
                <div key={s.label}>
                  <div className={`sp-sb-step ${cls}`}>
                    <div className="sp-sb-num">
                      {i < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                    </div>
                    <div>
                      <div className="sp-sb-lbl">{s.label}</div>
                      <div className="sp-sb-sub">{s.sub}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className="sp-sb-conn" />}
                </div>
              )
            })}
          </div>

          <div className="sp-sb-foot">
            <div className="sp-sb-pct-row">
              <div className="sp-sb-pct-lbl">Completion</div>
              <div className="sp-sb-pct-val">{pct}%</div>
            </div>
            <div className="sp-sb-track">
              <div className="sp-sb-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="sp-main">
          <div className="sp-main-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="sp-nav">
              <button className="sp-btn-back" onClick={() => setStep(s => s - 1)} disabled={isFirst}>
                <ArrowLeft size={15} /> Back
              </button>
              {isLast ? (
                <button className="sp-btn-next sp-btn-save" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? <><Loader2 size={16} style={{ animation: 'sp-spin 1s linear infinite' }} /> Saving…</>
                    : <><Save size={15} /> Save Profile & Go to Dashboard</>
                  }
                </button>
              ) : (
                <button className="sp-btn-next" onClick={() => setStep(s => s + 1)}>
                  Continue <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </main>

      </div>
    </>
  )
}
