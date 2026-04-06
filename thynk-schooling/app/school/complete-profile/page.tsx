'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
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

/* FIX 4: Removed 'infrastructure' tab */
const AMENITY_TABS = [
  { key: 'facility',        label: 'Facilities' },
  { key: 'sport',           label: 'Sports' },
  { key: 'language',        label: 'Languages' },
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

/* ── FIX 4: AmenitiesStep now uses useDropdown per category instead of /api/admin/amenities ── */
function AmenitiesStep({ formData, toggle }: {
  formData: FD
  toggle: (k: string, v: string) => void
}) {
  const [activeTab, setActiveTab] = useState('facility')

  /* Each tab maps to its own dropdown category key in the DB */
  const { options: facilities,        isLoading: lFac  } = useDropdown('facility')
  const { options: sports,            isLoading: lSport } = useDropdown('sport')
  const { options: languages,         isLoading: lLang  } = useDropdown('language')
  const { options: extracurriculars,  isLoading: lExtra } = useDropdown('extracurricular')

  const TAB_DATA: Record<string, { options: { label: string; value: string }[]; isLoading: boolean; fieldKey: string }> = {
    facility:        { options: facilities,       isLoading: lFac,   fieldKey: 'facilities' },
    sport:           { options: sports,           isLoading: lSport, fieldKey: 'sports' },
    language:        { options: languages,        isLoading: lLang,  fieldKey: 'languages' },
    extracurricular: { options: extracurriculars, isLoading: lExtra, fieldKey: 'extracurriculars' },
  }

  const current = TAB_DATA[activeTab]
  const selectedInTab = (formData[current.fieldKey] as string[]) || []

  /* Total selected across all tabs */
  const totalSelected = AMENITY_TABS.reduce((acc, t) => {
    return acc + ((formData[TAB_DATA[t.key].fieldKey] as string[]) || []).length
  }, 0)

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
      {current.isLoading ? (
        <div className="sp-a-empty">Loading options…</div>
      ) : current.options.length === 0 ? (
        <div className="sp-a-empty">
          No options configured yet.<br />
          Go to <strong style={{ color: 'var(--brand)' }}>Admin → Settings → Dropdowns</strong> and add options under the &ldquo;{activeTab}&rdquo; category.
        </div>
      ) : (
        <div className="sp-a-grid">
          {current.options.map(opt => {
            const on = selectedInTab.includes(opt.value)
            return (
              <button key={opt.value} type="button"
                className={`sp-a-chip${on ? ' on' : ''}`}
                onClick={() => toggle(current.fieldKey, opt.value)}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {on && <CheckCircle2 className="sp-a-chk" size={15} />}
              </button>
            )
          })}
        </div>
      )}
      {totalSelected > 0 && (
        <p className="sp-a-count">✓ {totalSelected} feature{totalSelected > 1 ? 's' : ''} selected across all categories</p>
      )}
    </>
  )
}

export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { setUser, user, accessToken } = useAuthStore()
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'loading'|'existing'|'new'>('loading')
  const [existingSchool, setExistingSchool] = useState<any>(null)
  const [formData, setFormData] = useState<FD>({
    board: [], admissionOpen: false,
    facilities: [], sports: [], languages: [], extracurriculars: [],
  })
  const [logoFile,  setLogoFile]  = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const token = accessToken || localStorage.getItem('ts_access_token') || ''
    if (!token) { setMode('new'); return }
    const tokenParam = `?__token=${encodeURIComponent(token)}`
    fetch(`/api/schools/profile${tokenParam}`, {
      cache: 'no-store', credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const s = d?.school
        if (s && s.id) {
          setExistingSchool(s)
          setFormData({
            name: s.name||'', tagline: s.tagline||'', affiliationNo: s.affiliation_no||'',
            description: s.description||'', foundingYear: s.founding_year||'',
            totalStudents: s.total_students||'', studentTeacherRatio: s.student_teacher_ratio||'',
            schoolType: s.school_type||'', board: Array.isArray(s.board)?s.board:[],
            genderPolicy: s.gender_policy||'', mediumOfInstruction: s.medium_of_instruction||'',
            recognition: s.recognition||'', classesFrom: s.classes_from||'',
            classesTo: s.classes_to||'', monthlyFeeMin: s.monthly_fee_min||'',
            monthlyFeeMax: s.monthly_fee_max||'', annualFee: s.annual_fee||'',
            admissionAcademicYear: s.admission_academic_year||'', admissionOpen: s.admission_open||false,
            facilities: Array.isArray(s.facilities)?s.facilities:[],
            sports: Array.isArray(s.sports)?s.sports:[],
            languages: Array.isArray(s.languages)?s.languages:[],
            extracurriculars: Array.isArray(s.extra_curricular)?s.extra_curricular:[],
            addressLine1: s.address_line1||'', addressLine2: s.address_line2||'',
            city: s.city||'', state: s.state||'', pincode: s.pincode||'',
            latitude: s.latitude||'', longitude: s.longitude||'',
            phone: s.phone||'', email: s.email||'',
            websiteUrl: s.website_url||'', principalName: s.principal_name||'',
          })
          setMode('existing')
        } else {
          setMode('new')
        }
      })
      .catch(() => setMode('new'))
  }, [mounted, accessToken])


  const set    = (k: string, v: FD[string]) => setFormData(p => ({ ...p, [k]: v }))
  const setS   = (k: string, v: string)     => set(k, v)
  const toggle = (k: string, v: string) => {
    const arr = (formData[k] as string[]) || []
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  const { options: boards,         isLoading: lBoards }  = useDropdown('board')
  const { options: schoolTypes,    isLoading: lTypes }    = useDropdown('school_type')
  const { options: genderPolicies, isLoading: lGender }   = useDropdown('gender_policy')
  const { options: mediums,        isLoading: lMedium }   = useDropdown('medium')
  /* FIX 1: religion removed — no longer fetched or rendered */
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
      if (logoFile)  fd.append('logo',  logoFile)
      if (coverFile) fd.append('cover', coverFile)

      // Vercel rewrites strip the Authorization header, so we also pass the token
      // as a query param (__token) which survives the rewrite intact.
      const token = accessToken || localStorage.getItem('ts_access_token') || ''
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const tokenParam = token ? `?__token=${encodeURIComponent(token)}` : ''

      const r = await fetch(`/api/schools?action=profile${tokenParam ? '&' + tokenParam.slice(1) : ''}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: fd,
      })
      const data = await r.json()
      if (!r.ok) throw data
      return data
    },
    onSuccess: async () => {
      const token = accessToken || localStorage.getItem('ts_access_token') || ''
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
      const tokenParam = token ? `?__token=${encodeURIComponent(token)}` : ''
      await fetch(`/api/auth?action=complete-profile${tokenParam ? '&' + tokenParam.slice(1) : ''}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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
    /* ── STEP 0: Basic Info ── */
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

    /* ── STEP 1: Type & Board ── */
    /* FIX 1: Religion / Affiliation field removed entirely */
    if (step === 1) return (
      <>
        <StepHeader step={1} />
        <div className="sp-g2">
          <DynSel label="School Type"           fieldKey="schoolType"          options={schoolTypes}    isLoading={lTypes}   required formData={formData} set={setS} />
          <DynSel label="Gender Policy"         fieldKey="genderPolicy"        options={genderPolicies} isLoading={lGender}  required formData={formData} set={setS} />
          <DynSel label="Medium of Instruction" fieldKey="mediumOfInstruction" options={mediums}        isLoading={lMedium}  required formData={formData} set={setS} />
          <DynSel label="Recognition"           fieldKey="recognition"         options={recognitions}   isLoading={lRecog}            formData={formData} set={setS} />
        </div>
        <div className="sp-g2">
          <Field label="Total Students">
            <input className="sp-inp" type="number" value={(formData.totalStudents as number) || ''} onChange={e => set('totalStudents', Number(e.target.value))} placeholder="e.g. 1,500" />
          </Field>
          <Field label="Student : Teacher Ratio">
            <input className="sp-inp" value={(formData.studentTeacherRatio as string) || ''} onChange={e => set('studentTeacherRatio', e.target.value)} placeholder="e.g. 25:1" />
          </Field>
        </div>
        {/* FIX 2: Board uses MultiChip with boards from useDropdown('board') — dynamic from DB */}
        <MultiChip label="Board(s) of Education" fieldKey="board" options={boards} isLoading={lBoards} formData={formData} toggle={toggle} />
      </>
    )

    /* ── STEP 2: Classes & Fees ── */
    /* FIX 3: "Monthly Tuition Fee" → "Average Monthly Tuition Fee" */
    if (step === 2) return (
      <>
        <StepHeader step={2} />
        <div className="sp-g2">
          <DynSel label="Classes From" fieldKey="classesFrom" options={classLevels} isLoading={lClass} required placeholder="Select starting class" formData={formData} set={setS} />
          <DynSel label="Classes To"   fieldKey="classesTo"   options={classLevels} isLoading={lClass} required placeholder="Select ending class"   formData={formData} set={setS} />
        </div>
        <div className="sp-divider">Average Monthly Tuition Fee (₹)</div>
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

    /* ── STEP 3: Features / Amenities ── */
    /* FIX 4: Uses useDropdown per category; Infrastructure removed */
    if (step === 3) return <AmenitiesStep formData={formData} toggle={toggle} />

    /* ── STEP 4: Location ── */
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
        <p className="sp-note">📍 Right-click your school on Google Maps → &ldquo;What&apos;s here?&rdquo; to get GPS coordinates.</p>
      </>
    )

    /* ── STEP 5: Contact & Media ── */
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
          <strong style={{ color: 'var(--brand)' }}>You&apos;re almost done!</strong> After saving, upload gallery photos and manage all settings from your school dashboard.
        </div>
      </>
    )
  }

  if (!mounted || mode === 'loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F0E8'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:'3px solid rgba(212,82,15,.15)',borderTop:'3px solid #D4520F',borderRadius:'50%',margin:'0 auto 12px',animation:'sp-spin .8s linear infinite'}} />
        <div style={{color:'#718096',fontSize:14,fontFamily:'Inter,sans-serif'}}>Loading…</div>
      </div>
    </div>
  )

  if (mode === 'existing' && existingSchool) return (
    <>
      <style>{CSS + `@keyframes sp-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{minHeight:'100vh',background:'#F5F0E8',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'48px 20px'}}>
        <div style={{width:'100%',maxWidth:680}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
            <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#D4520F,#E87B3F)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <GraduationCap size={20} color="#fff" />
            </div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:'#14110E'}}>
              Thynk<span style={{color:'#D4520F'}}>Schooling</span>
            </span>
          </div>

          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:34,color:'#14110E',letterSpacing:'-0.02em',margin:'0 0 6px'}}>Your School</h1>
          <p style={{color:'#718096',fontSize:15,fontFamily:'Inter,sans-serif',marginBottom:28}}>Manage your school profile or add a new one.</p>

          {/* Existing school card */}
          <div style={{background:'#fff',border:'1.5px solid rgba(212,82,15,0.2)',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 24px rgba(20,17,14,0.08)',marginBottom:16}}>
            <div style={{height:4,background:'linear-gradient(90deg,#D4520F,#E87B3F)'}} />
            <div style={{padding:'24px 26px'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:20}}>
                {/* Logo */}
                <div style={{width:72,height:72,borderRadius:16,background:'rgba(212,82,15,0.07)',border:'1.5px solid rgba(212,82,15,0.18)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                  {existingSchool.logo_url
                    ? <img src={existingSchool.logo_url} alt="" style={{width:'100%',height:'100%',objectFit:'contain',padding:8}} />
                    : <GraduationCap size={28} color="#D4520F" />}
                </div>
                {/* Info */}
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                    <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:'#14110E',margin:0}}>{existingSchool.name}</h2>
                    {existingSchool.is_verified && (
                      <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:99,background:'rgba(22,163,74,0.1)',border:'1px solid rgba(22,163,74,0.25)',fontSize:11,fontWeight:700,color:'#15803d',fontFamily:'Inter,sans-serif'}}>
                        <CheckCircle2 size={9} /> Verified
                      </span>
                    )}
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
                    {existingSchool.city && (
                      <span style={{display:'flex',alignItems:'center',gap:4,fontSize:13,color:'#718096',fontFamily:'Inter,sans-serif'}}>
                        <MapPin size={11} color="#D4520F" />{existingSchool.city}{existingSchool.state?`, ${existingSchool.state}`:''}
                      </span>
                    )}
                    {Array.isArray(existingSchool.board) && existingSchool.board[0] && (
                      <span style={{padding:'2px 10px',borderRadius:99,background:'rgba(212,82,15,0.08)',border:'1px solid rgba(212,82,15,0.2)',fontSize:12,fontWeight:600,color:'#D4520F',fontFamily:'Inter,sans-serif'}}>
                        {existingSchool.board.slice(0,2).join(' · ')}
                      </span>
                    )}
                    {existingSchool.school_type && (
                      <span style={{fontSize:12,color:'#9CA3AF',fontFamily:'Inter,sans-serif'}}>{existingSchool.school_type.replace(/_/g,' ')}</span>
                    )}
                  </div>
                  {existingSchool.tagline && (
                    <p style={{fontSize:13,color:'#9CA3AF',fontStyle:'italic',margin:0,fontFamily:'Inter,sans-serif'}}>"{existingSchool.tagline}"</p>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button onClick={()=>setMode('new')}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px 20px',borderRadius:12,border:'none',background:'#14110E',fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:'#fff',cursor:'pointer',boxShadow:'0 4px 16px rgba(20,17,14,0.2)'}}>
                  ✏️ Edit School Profile
                </button>
                {existingSchool.slug && (
                  <a href={`/schools/${existingSchool.slug}`} target="_blank" rel="noreferrer"
                    style={{display:'flex',alignItems:'center',gap:7,padding:'13px 20px',borderRadius:12,border:'1.5px solid rgba(20,17,14,0.12)',background:'transparent',fontSize:14,fontWeight:600,color:'#4A5568',textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
                    🔗 View Live Profile
                  </a>
                )}
                <button onClick={()=>router.push('/dashboard/school')}
                  style={{display:'flex',alignItems:'center',gap:7,padding:'13px 20px',borderRadius:12,border:'1.5px solid rgba(20,17,14,0.12)',background:'transparent',fontSize:14,fontWeight:600,color:'#4A5568',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  ← Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Add another school */}
          <button
            onClick={()=>{setExistingSchool(null);setFormData({board:[],admissionOpen:false,facilities:[],sports:[],languages:[],extracurriculars:[]});setStep(0);setMode('new')}}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px',borderRadius:16,border:'2px dashed rgba(212,82,15,0.3)',background:'rgba(212,82,15,0.02)',fontSize:14,fontWeight:600,color:'#D4520F',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            + Add Another School
          </button>
        </div>
      </div>
    </>
  )

  if (!mounted) return null

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
                    : <><Save size={15} /> Save Profile &amp; Go to Dashboard</>
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
