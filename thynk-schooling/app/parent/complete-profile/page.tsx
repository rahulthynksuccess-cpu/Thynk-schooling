'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
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
  { badge: 'Step 1 of 6',  h1: "Your school's",     h2: 'first impression',  desc: 'These details appear at the top of your public profile — make them count.' },
  { badge: 'Step 2 of 6',  h1: 'Type, boards &',    h2: 'policies',           desc: 'Help parents filter and find you based on what matters most to their family.' },
  { badge: 'Step 3 of 6',  h1: 'Classes &',         h2: 'fee structure',      desc: 'Transparent fee information builds trust and converts more parents.' },
  { badge: 'Step 4 of 6',  h1: 'What makes your',   h2: 'school stand out?',  desc: 'Select everything your school offers — parents use this to compare and shortlist.' },
  { badge: 'Step 5 of 6',  h1: 'Where will parents',h2: 'find you?',           desc: 'Accurate location ensures you appear in the right area searches and map results.' },
  { badge: 'Step 6 of 6',  h1: 'Contact info &',    h2: 'your best photos',   desc: 'Add contact details and upload images — then your profile goes live!' },
]

const AMENITY_TABS = [
  { key: 'facility',        label: 'Facilities' },
  { key: 'sport',           label: 'Sports' },
  { key: 'language',        label: 'Languages' },
  { key: 'extracurricular', label: 'Extracurricular' },
]

const MAX_BYTES = 1 * 1024 * 1024
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ════════════════════════════════════════════════════════════
   DESIGN SYSTEM — Refined, Premium, Consistent
   Theme: Warm neutral base · Brand: #D4520F (deep orange)
   Inspired by Linear / Stripe / Notion
════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.sp *, .sp *::before, .sp *::after { box-sizing: border-box; margin: 0; padding: 0; }

.sp {
  /* ── Palette ── */
  --bg:          #FAFAF9;
  --surface:     #FFFFFF;
  --surface-2:   #F5F4F2;
  --ink:         #1A1612;
  --ink-2:       #4A443E;
  --ink-3:       #8C857E;
  --brand:       #D4520F;
  --brand-hover: #B8430D;
  --brand-pale:  #FEF3ED;
  --brand-border:#F5C9AD;
  --border:      #E8E4DF;
  --border-2:    #D6D0C9;
  --focus-ring:  rgba(212, 82, 15, 0.12);
  --sidebar-bg:  #141210;
  --sidebar-bdr: rgba(255,255,255,0.07);

  /* ── Type ── */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
  background: var(--bg);
  display: flex;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
.sp-sb {
  width: 260px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sp-sb-head {
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--sidebar-bdr);
}
.sp-sb-logo { display: flex; align-items: center; gap: 10px; }
.sp-sb-icon {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  background: var(--brand);
  display: flex; align-items: center; justify-content: center;
}
.sp-sb-name {
  font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.01em;
}
.sp-sb-name span { color: #F87239; }
.sp-sb-tagline {
  font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 6px;
  letter-spacing: 0.03em; font-weight: 400;
}

.sp-sb-steps { flex: 1; padding: 8px 0; overflow-y: auto; scrollbar-width: none; }
.sp-sb-steps::-webkit-scrollbar { display: none; }

.sp-sb-step {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 20px; position: relative;
  transition: background 0.15s;
  cursor: default;
}
.sp-sb-step.active { background: rgba(212,82,15,0.1); }
.sp-sb-step.active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 2px; background: var(--brand); border-radius: 0 2px 2px 0;
}

.sp-sb-num {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; transition: all 0.2s;
}
.sp-sb-step.done  .sp-sb-num { background: rgba(212,82,15,0.15); color: #F87239; }
.sp-sb-step.active .sp-sb-num { background: var(--brand); color: #fff; }
.sp-sb-step.todo  .sp-sb-num { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.06); }

.sp-sb-lbl { font-size: 13px; font-weight: 500; line-height: 1.2; }
.sp-sb-step.done  .sp-sb-lbl { color: rgba(255,255,255,0.38); }
.sp-sb-step.active .sp-sb-lbl { color: #fff; }
.sp-sb-step.todo  .sp-sb-lbl { color: rgba(255,255,255,0.18); }
.sp-sb-sub { font-size: 11px; margin-top: 2px; font-weight: 400; }
.sp-sb-step.done  .sp-sb-sub { color: rgba(255,255,255,0.15); }
.sp-sb-step.active .sp-sb-sub { color: rgba(255,255,255,0.38); }
.sp-sb-step.todo  .sp-sb-sub { color: rgba(255,255,255,0.1); }

.sp-sb-foot {
  padding: 16px 20px 24px;
  border-top: 1px solid var(--sidebar-bdr);
}
.sp-sb-pct-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.sp-sb-pct-lbl { font-size: 10px; color: rgba(255,255,255,0.25); font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
.sp-sb-pct-val { font-size: 22px; font-weight: 600; color: #F87239; letter-spacing: -0.02em; }
.sp-sb-track { height: 3px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
.sp-sb-fill { height: 100%; background: var(--brand); border-radius: 99px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

/* ─────────────────────────────────────────
   MAIN CONTENT
───────────────────────────────────────── */
.sp-main { flex: 1; overflow-y: auto; max-height: 100vh; background: var(--bg); }
.sp-main-inner { padding: 48px 56px 0; max-width: 680px; }

/* Step badge */
.sp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--brand-pale); border: 1px solid var(--brand-border);
  color: var(--brand); border-radius: 6px;
  padding: 4px 10px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 16px;
}

/* Step heading */
.sp-title {
  font-size: 30px; font-weight: 600; line-height: 1.15;
  letter-spacing: -0.025em; color: var(--ink); margin-bottom: 10px;
}
.sp-title-accent { color: var(--brand); }
.sp-desc {
  font-size: 14px; color: var(--ink-3); line-height: 1.65;
  margin-bottom: 36px; max-width: 460px;
}

/* ─────────────────────────────────────────
   FORM FIELDS
───────────────────────────────────────── */
.sp-field { margin-bottom: 20px; }
.sp-lbl {
  display: block; font-size: 12px; font-weight: 500;
  color: var(--ink-2); margin-bottom: 6px; letter-spacing: 0.01em;
}
.sp-req { color: var(--brand); }

.sp-inp, .sp-sel, .sp-ta {
  width: 100%; padding: 9px 13px;
  border: 1px solid var(--border); border-radius: 8px;
  font-family: 'Inter', sans-serif; font-size: 14px;
  color: var(--ink); background: var(--surface); outline: none;
  appearance: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.sp-inp:hover:not(:focus), .sp-sel:hover:not(:focus), .sp-ta:hover:not(:focus) {
  border-color: var(--border-2);
}
.sp-inp:focus, .sp-sel:focus, .sp-ta:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.sp-inp::placeholder, .sp-ta::placeholder { color: var(--ink-3); }
.sp-ta { resize: none; line-height: 1.6; }
.sp-sel { cursor: pointer; padding-right: 36px; }
.sp-sel-wrap { position: relative; }
.sp-sel-wrap::after {
  content: ''; position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  width: 0; height: 0;
  border-left: 4px solid transparent; border-right: 4px solid transparent;
  border-top: 5px solid var(--ink-3); pointer-events: none;
}
.sp-with-icon { position: relative; }
.sp-with-icon .sp-inp { padding-left: 38px; }
.sp-fi { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ink-3); display: flex; align-items: center; pointer-events: none; }
.sp-pfx { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 500; color: var(--ink-3); font-size: 14px; pointer-events: none; }
.sp-pfx-inp { padding-left: 24px !important; }
.sp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sp-note { font-size: 12px; color: var(--ink-3); line-height: 1.55; margin-top: 6px; }

/* Multi-select chips */
.sp-chip-wrap {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; min-height: 50px;
}
.sp-chip {
  padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
  border: 1px solid var(--border); color: var(--ink-2); cursor: pointer;
  transition: all 0.12s; background: var(--bg);
  font-family: 'Inter', sans-serif;
}
.sp-chip:hover { border-color: var(--brand-border); color: var(--brand); background: var(--brand-pale); }
.sp-chip.on { background: var(--brand); border-color: var(--brand); color: #fff; }
.sp-no-opts { font-size: 13px; color: var(--ink-3); font-style: italic; padding: 4px; }

/* Toggle */
.sp-tog-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
}
.sp-tog-lbl { font-size: 14px; font-weight: 500; color: var(--ink); }
.sp-tog { position: relative; width: 42px; height: 24px; cursor: pointer; flex-shrink: 0; }
.sp-tog input { opacity: 0; width: 0; height: 0; }
.sp-sl { position: absolute; inset: 0; background: var(--border-2); border-radius: 99px; transition: 0.2s; }
.sp-sl:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.sp-tog input:checked + .sp-sl { background: var(--brand); }
.sp-tog input:checked + .sp-sl:before { transform: translateX(18px); }

/* Amenities tabs */
.sp-a-nav { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; margin-bottom: 16px; padding-bottom: 2px; }
.sp-a-nav::-webkit-scrollbar { display: none; }
.sp-a-tab {
  padding: 7px 16px; border-radius: 7px; font-size: 13px; font-weight: 500;
  border: 1px solid var(--border); cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: all 0.12s; background: var(--surface); color: var(--ink-2);
  font-family: 'Inter', sans-serif;
}
.sp-a-tab:hover { border-color: var(--border-2); color: var(--ink); }
.sp-a-tab.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.sp-a-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 7px; }
.sp-a-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; transition: all 0.12s; background: var(--surface);
  font-size: 13px; font-weight: 500; color: var(--ink-2);
  font-family: 'Inter', sans-serif; width: 100%; text-align: left;
}
.sp-a-chip:hover { border-color: var(--brand-border); background: var(--brand-pale); color: var(--brand); }
.sp-a-chip.on { background: var(--brand-pale); border-color: var(--brand-border); color: var(--brand); }
.sp-a-chk { margin-left: auto; flex-shrink: 0; color: var(--brand); }
.sp-a-count { font-size: 12px; color: var(--brand); font-weight: 500; margin-top: 12px; }
.sp-a-empty {
  font-size: 13px; color: var(--ink-3); padding: 28px 20px;
  text-align: center; background: var(--surface-2);
  border: 1px dashed var(--border); border-radius: 8px; line-height: 1.65;
}

/* Image upload */
.sp-upload {
  border: 1px dashed var(--border); border-radius: 8px; padding: 24px 16px;
  text-align: center; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: block; background: var(--surface);
}
.sp-upload:hover { border-color: var(--brand-border); background: var(--brand-pale); }
.sp-u-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--brand-pale); display: flex; align-items: center; justify-content: center;
  margin: 0 auto 10px;
}
.sp-u-text { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-bottom: 4px; }
.sp-u-hint { font-size: 11px; color: var(--ink-3); }
.sp-file-prev {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: var(--brand-pale);
  border: 1px solid var(--brand-border); border-radius: 8px;
}
.sp-f-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.sp-f-name { font-size: 13px; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-f-size { font-size: 11px; color: var(--ink-3); margin-top: 2px; }

/* Section divider */
.sp-divider {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-3); margin: 28px 0 18px;
  display: flex; align-items: center; gap: 10px;
}
.sp-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* Info box */
.sp-info {
  padding: 14px 16px; background: var(--brand-pale);
  border: 1px solid var(--brand-border);
  border-radius: 8px; font-size: 13px; color: var(--ink-2); line-height: 1.65;
}

/* ─────────────────────────────────────────
   STICKY NAVIGATION BAR
───────────────────────────────────────── */
.sp-nav {
  position: sticky; bottom: 0;
  background: rgba(250,250,249,0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  padding: 16px 56px;
  display: flex; gap: 10px;
  margin: 0 -56px;
}
.sp-btn-back {
  padding: 9px 20px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500; color: var(--ink-2);
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.15s;
}
.sp-btn-back:hover:not(:disabled) { border-color: var(--border-2); color: var(--ink); }
.sp-btn-back:disabled { opacity: 0.4; cursor: default; }
.sp-btn-next {
  flex: 1; padding: 10px 22px; border-radius: 8px; border: none;
  background: var(--ink);
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: all 0.15s; letter-spacing: -0.01em;
}
.sp-btn-next:hover:not(:disabled) { background: #2A2420; }
.sp-btn-next:disabled { opacity: 0.5; cursor: default; }
.sp-btn-save { background: var(--brand) !important; }
.sp-btn-save:hover:not(:disabled) { background: var(--brand-hover) !important; }

/* ─────────────────────────────────────────
   EXISTING SCHOOL VIEW
───────────────────────────────────────── */
.sp-existing-wrap {
  min-height: 100vh; background: var(--bg);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 52px 24px 80px;
}
.sp-existing-inner { width: 100%; max-width: 640px; }
.sp-existing-header { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
.sp-existing-logo-btn {
  width: 36px; height: 36px; border-radius: 9px;
  background: var(--brand);
  display: flex; align-items: center; justify-content: center;
}
.sp-existing-brand { font-size: 16px; font-weight: 600; color: var(--ink); }
.sp-existing-brand span { color: var(--brand); }
.sp-existing-h1 { font-size: 28px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 6px; }
.sp-existing-sub { color: var(--ink-3); font-size: 14px; margin-bottom: 28px; }

.sp-school-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  margin-bottom: 14px;
}
.sp-school-card-top { height: 3px; background: var(--brand); }
.sp-school-card-body { padding: 22px 24px; }
.sp-school-meta { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
.sp-school-logo {
  width: 60px; height: 60px; border-radius: 10px;
  background: var(--brand-pale); border: 1px solid var(--brand-border);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.sp-school-logo img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
.sp-school-name { font-size: 18px; font-weight: 600; color: var(--ink); margin-bottom: 6px; letter-spacing: -0.01em; }
.sp-school-verified {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; border-radius: 5px;
  background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
  font-size: 11px; font-weight: 500; color: #16a34a;
  font-family: 'Inter', sans-serif; margin-left: 6px;
}
.sp-school-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.sp-school-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-3); }
.sp-school-board-tag {
  padding: 2px 10px; border-radius: 5px;
  background: var(--brand-pale); border: 1px solid var(--brand-border);
  font-size: 12px; font-weight: 500; color: var(--brand);
}
.sp-school-tagline { font-size: 12px; color: var(--ink-3); font-style: italic; }
.sp-school-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sp-btn-edit {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 10px 18px; border-radius: 8px; border: none;
  background: var(--ink); font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500; color: #fff; cursor: pointer;
  transition: all 0.15s;
}
.sp-btn-edit:hover { background: #2A2420; }
.sp-btn-outline {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  font-size: 13px; font-weight: 500; color: var(--ink-2);
  text-decoration: none; font-family: 'Inter', sans-serif;
  cursor: pointer; transition: all 0.15s;
}
.sp-btn-outline:hover { border-color: var(--border-2); color: var(--ink); }

.sp-add-school-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border-radius: 10px;
  border: 1px dashed var(--border);
  background: var(--surface);
  font-size: 13px; font-weight: 500; color: var(--ink-3);
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}
.sp-add-school-btn:hover { border-color: var(--brand-border); color: var(--brand); background: var(--brand-pale); }

@keyframes sp-spin { to { transform: rotate(360deg); } }

/* ─────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────── */
@media (max-width: 720px) {
  .sp-sb { display: none; }
  .sp-main-inner { padding: 24px 20px 0; }
  .sp-nav { padding: 14px 20px; margin: 0 -20px; }
  .sp-title { font-size: 24px; }
  .sp-g2 { grid-template-columns: 1fr; }
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
          style={{ color: formData[fieldKey] ? 'var(--ink)' : 'var(--ink-3)' }}
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

function ImageUpload({ label, hint, file, existingUrl, onChange, onClearExisting }: {
  label: string; hint: string; file: File | null; existingUrl?: string | null
  onChange: (f: File | null) => void; onClearExisting?: () => void
}) {
  const handle = (f: File | null) => {
    if (!f) { onChange(null); return }
    if (!IMG_TYPES.includes(f.type)) { toast.error(`${label}: JPG, PNG or WEBP only`); return }
    if (f.size > MAX_BYTES) { toast.error(`${label} too large — max 1 MB`); return }
    onChange(f)
  }

  const previewSrc = file ? URL.createObjectURL(file) : existingUrl || null
  const previewName = file ? file.name : 'Current saved image'
  const previewSize = file ? `${(file.size / 1024).toFixed(0)} KB` : 'Saved — upload new to replace'

  return (
    <Field label={label}>
      {previewSrc ? (
        <div className="sp-file-prev">
          <img className="sp-f-thumb" src={previewSrc} alt="" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sp-f-name">{previewName}</div>
            <div className="sp-f-size">{previewSize}</div>
          </div>
          <button type="button" onClick={() => { onChange(null); onClearExisting?.() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, display: 'flex', borderRadius: 4, transition: 'color 0.15s' }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="sp-upload">
          <input type="file" accept={IMG_TYPES.join(',')} style={{ display: 'none' }}
            onChange={e => { handle(e.target.files?.[0] ?? null); e.target.value = '' }} />
          <div className="sp-u-icon"><Upload size={18} color="var(--brand)" /></div>
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
      <div className="sp-badge">{m.badge}</div>
      <h1 className="sp-title">{m.h1} <span className="sp-title-accent">{m.h2}</span></h1>
      <p className="sp-desc">{m.desc}</p>
    </>
  )
}

function AmenitiesStep({ formData, toggle }: {
  formData: FD
  toggle: (k: string, v: string) => void
}) {
  const [activeTab, setActiveTab] = useState('facility')

  const { data: amenityData = {}, isLoading: lAmenities } = useQuery({
    queryKey: ['dropdowns-amenities'],
    queryFn: () => fetch('/api/settings/dropdown?categories=facility,sport,language,extracurricular').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
  const facilities       = useMemo(() => amenityData.facility        || [], [amenityData])
  const sports           = useMemo(() => amenityData.sport           || [], [amenityData])
  const languages        = useMemo(() => amenityData.language        || [], [amenityData])
  const extracurriculars = useMemo(() => amenityData.extracurricular || [], [amenityData])

  const TAB_DATA: Record<string, { options: { label: string; value: string }[]; isLoading: boolean; fieldKey: string }> = {
    facility:        { options: facilities,       isLoading: lAmenities, fieldKey: 'facilities' },
    sport:           { options: sports,           isLoading: lAmenities, fieldKey: 'sports' },
    language:        { options: languages,        isLoading: lAmenities, fieldKey: 'languages' },
    extracurricular: { options: extracurriculars, isLoading: lAmenities, fieldKey: 'extracurriculars' },
  }

  const current = TAB_DATA[activeTab]
  const selectedInTab = (formData[current.fieldKey] as string[]) || []

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
                {on && <CheckCircle2 className="sp-a-chk" size={14} />}
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
  const [existingLogoUrl,  setExistingLogoUrl]  = useState<string | null>(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null)

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
          const parseArr = (v: any): string[] => {
            if (Array.isArray(v)) return v.filter(Boolean)
            if (typeof v === 'string' && v.startsWith('{')) {
              return v.replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
            }
            if (typeof v === 'string' && v.startsWith('[')) {
              try { return JSON.parse(v).filter(Boolean) } catch { return [] }
            }
            return []
          }
          setFormData({
            name: s.name||'', tagline: s.tagline||'', affiliationNo: s.affiliation_no||'',
            description: s.description||'', foundingYear: s.founding_year||'',
            totalStudents: s.total_students||'', studentTeacherRatio: s.student_teacher_ratio||'',
            schoolType: s.school_type||'', board: parseArr(s.board),
            genderPolicy: s.gender_policy||'', mediumOfInstruction: s.medium_of_instruction||'',
            recognition: s.recognition||'', classesFrom: s.classes_from||'',
            classesTo: s.classes_to||'', monthlyFeeMin: s.monthly_fee_min||'',
            monthlyFeeMax: s.monthly_fee_max||'', annualFee: s.annual_fee||'',
            admissionAcademicYear: s.admission_academic_year||'', admissionOpen: s.admission_open||false,
            facilities: parseArr(s.facilities),
            sports: parseArr(s.sports),
            languages: parseArr(s.languages),
            extracurriculars: parseArr(s.extracurriculars),
            addressLine1: s.address_line1||'',
            locality: s.locality||'',
            city: s.city||'', state: s.state||'', pincode: s.pincode||'',
            latitude: s.latitude||'', longitude: s.longitude||'',
            phone: s.phone||'', email: s.email||'',
            websiteUrl: s.website_url||'', principalName: s.principal_name||'',
            facebookUrl:  s.facebook_url  || '',
            instagramUrl: s.instagram_url || '',
            youtubeUrl:   s.youtube_url   || '',
            twitterUrl:   s.twitter_url   || '',
          })
          setExistingLogoUrl(s.logo_url || null)
          setExistingCoverUrl(s.cover_url || null)
          setLogoFile(null)
          setCoverFile(null)
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

  const { data: formDropdowns = {}, isLoading: lFormDropdowns } = useQuery({
    queryKey: ['dropdowns-form'],
    queryFn: () => fetch('/api/settings/dropdown?categories=board,school_type,gender_policy,medium,recognition,class_level,state,academic_year').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
  const boards         = useMemo(() => formDropdowns.board           || [], [formDropdowns])
  const schoolTypes    = useMemo(() => formDropdowns.school_type     || [], [formDropdowns])
  const genderPolicies = useMemo(() => formDropdowns.gender_policy   || [], [formDropdowns])
  const mediums        = useMemo(() => formDropdowns.medium          || [], [formDropdowns])
  const recognitions   = useMemo(() => formDropdowns.recognition     || [], [formDropdowns])
  const classLevels    = useMemo(() => formDropdowns.class_level     || [], [formDropdowns])
  const states         = useMemo(() => formDropdowns.state           || [], [formDropdowns])
  const academicYears  = useMemo(() => formDropdowns.academic_year   || [], [formDropdowns])
  const lBoards = lFormDropdowns; const lTypes = lFormDropdowns; const lGender = lFormDropdowns
  const lMedium = lFormDropdowns; const lRecog = lFormDropdowns;  const lClass  = lFormDropdowns
  const lStates = lFormDropdowns; const lAcYear = lFormDropdowns

  // Cities still need individual fetch (depends on selected state)
  const { options: cities, isLoading: lCities } = useDropdown('city', {
    parentValue: formData.state as string,
    enabled: !!formData.state,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(i => fd.append(k, i))
        else fd.append(k, String(v))
      })
      if (logoFile)  fd.append('logo',  logoFile)
      if (coverFile) fd.append('cover', coverFile)
      if (!logoFile  && existingLogoUrl)  fd.append('logo_url',  existingLogoUrl)
      if (!coverFile && existingCoverUrl) fd.append('cover_url', existingCoverUrl)

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
      toast.success('School profile saved!')
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
            <input className="sp-inp" value={(formData.tagline as string) || ''} onChange={e => set('tagline', e.target.value)} placeholder="Empowering Minds, Shaping Futures" />
          </Field>
          <Field label="Affiliation Number">
            <input className="sp-inp" value={(formData.affiliationNo as string) || ''} onChange={e => set('affiliationNo', e.target.value)} placeholder="e.g. 2730071" />
          </Field>
        </div>
        <Field label="School Description" required>
          <textarea className="sp-ta sp-inp" rows={4}
            value={(formData.description as string) || ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe your school's vision, teaching philosophy, values, and what makes it unique…" />
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
            <input className="sp-inp" type="number" value={(formData.totalStudents as number) || ''} onChange={e => set('totalStudents', Number(e.target.value))} placeholder="e.g. 1500" />
          </Field>
          <Field label="Student : Teacher Ratio">
            <input className="sp-inp" value={(formData.studentTeacherRatio as string) || ''} onChange={e => set('studentTeacherRatio', e.target.value)} placeholder="e.g. 25:1" />
          </Field>
        </div>
        <MultiChip label="Board(s) of Education" fieldKey="board" options={boards} isLoading={lBoards} formData={formData} toggle={toggle} />
      </>
    )

    /* ── STEP 2: Classes & Fees ── */
    if (step === 2) return (
      <>
        <StepHeader step={2} />
        <div className="sp-g2">
          <DynSel label="Classes From" fieldKey="classesFrom" options={classLevels} isLoading={lClass} required placeholder="Select starting class" formData={formData} set={setS} />
          <DynSel label="Classes To"   fieldKey="classesTo"   options={classLevels} isLoading={lClass} required placeholder="Select ending class"   formData={formData} set={setS} />
        </div>
        <div className="sp-g2">
          <Field label="Monthly Fee — Min" required>
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number"
                value={(formData.monthlyFeeMin as number) || ''}
                onChange={e => set('monthlyFeeMin', Number(e.target.value))}
                placeholder="3000" />
            </div>
          </Field>
          <Field label="Monthly Fee — Max">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number"
                value={(formData.monthlyFeeMax as number) || ''}
                onChange={e => set('monthlyFeeMax', Number(e.target.value))}
                placeholder="8000" />
            </div>
          </Field>
          <Field label="Annual / One-Time Fee">
            <div style={{ position: 'relative' }}>
              <span className="sp-pfx">₹</span>
              <input className="sp-inp sp-pfx-inp" type="number"
                value={(formData.annualFee as number) || ''}
                onChange={e => set('annualFee', Number(e.target.value))}
                placeholder="50000" />
            </div>
          </Field>
          <DynSel label="Admission Academic Year" fieldKey="admissionAcademicYear" options={academicYears} isLoading={lAcYear} formData={formData} set={setS} />
        </div>
        <div className="sp-tog-row">
          <span className="sp-tog-lbl">Admissions Currently Open</span>
          <label className="sp-tog">
            <input type="checkbox" checked={!!formData.admissionOpen}
              onChange={e => set('admissionOpen', e.target.checked)} />
            <span className="sp-sl" />
          </label>
        </div>
      </>
    )

    /* ── STEP 3: Features / Amenities ── */
    if (step === 3) return <AmenitiesStep formData={formData} toggle={toggle} />

    /* ── STEP 4: Location ── */
    if (step === 4) return (
      <>
        <StepHeader step={4} />
        <Field label="Street Address" required>
          <input className="sp-inp" value={(formData.addressLine1 as string) || ''} onChange={e => set('addressLine1', e.target.value)} placeholder="Plot No. 12, Sector 132, Noida" />
        </Field>
        <div className="sp-g2">
          <DynSel label="State" fieldKey="state" options={states} isLoading={lStates} required formData={formData} set={setS} />
          <Field label="City" required>
            <div className="sp-sel-wrap">
              <select className="sp-sel"
                value={(formData.city as string) || ''}
                onChange={e => set('city', e.target.value)}
                disabled={!formData.state || lCities}
                style={{ color: formData.city ? 'var(--ink)' : 'var(--ink-3)' }}
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
            <input className="sp-inp" value={(formData.pincode as string) || ''} onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))} placeholder="201301" maxLength={6} />
          </Field>
          <Field label="Latitude">
            <input className="sp-inp" type="number" step="0.0000001" value={(formData.latitude as number) || ''} onChange={e => set('latitude', Number(e.target.value))} placeholder="28.5355" />
          </Field>
          <Field label="Longitude">
            <input className="sp-inp" type="number" step="0.0000001" value={(formData.longitude as number) || ''} onChange={e => set('longitude', Number(e.target.value))} placeholder="77.3910" />
          </Field>
        </div>
        <p className="sp-note">Tip: Right-click your school on Google Maps → &ldquo;What&apos;s here?&rdquo; to get GPS coordinates.</p>
      </>
    )

    /* ── STEP 5: Contact & Media ── */
    if (step === 5) return (
      <>
        <StepHeader step={5} />
        <div className="sp-g2">
          <Field label="School Phone">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Phone size={14} /></span>
              <input className="sp-inp" value={(formData.phone as string) || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </Field>
          <Field label="School Email">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi"><Mail size={14} /></span>
              <input className="sp-inp" type="email" value={(formData.email as string) || ''} onChange={e => set('email', e.target.value)} placeholder="admissions@school.edu.in" />
            </div>
          </Field>
        </div>
        <Field label="Website URL">
          <div className="sp-with-icon" style={{ position: 'relative' }}>
            <span className="sp-fi"><Globe size={14} /></span>
            <input className="sp-inp" value={(formData.websiteUrl as string) || ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://www.yourschool.edu.in" />
          </div>
        </Field>
        <Field label="Principal Name">
          <input className="sp-inp" value={(formData.principalName as string) || ''} onChange={e => set('principalName', e.target.value)} placeholder="Dr. Ranjana Sharma" />
        </Field>

        <div className="sp-divider">Social Media Pages</div>
        <div className="sp-g2">
          <Field label="Facebook Page URL">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi" style={{ fontSize: 13 }}>📘</span>
              <input className="sp-inp" value={(formData.facebookUrl as string) || ''} onChange={e => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/yourschool" />
            </div>
          </Field>
          <Field label="Instagram Profile URL">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi" style={{ fontSize: 13 }}>📸</span>
              <input className="sp-inp" value={(formData.instagramUrl as string) || ''} onChange={e => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/yourschool" />
            </div>
          </Field>
          <Field label="YouTube Channel URL">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi" style={{ fontSize: 13 }}>▶️</span>
              <input className="sp-inp" value={(formData.youtubeUrl as string) || ''} onChange={e => set('youtubeUrl', e.target.value)} placeholder="https://youtube.com/@yourschool" />
            </div>
          </Field>
          <Field label="Twitter / X Profile URL">
            <div className="sp-with-icon" style={{ position: 'relative' }}>
              <span className="sp-fi" style={{ fontSize: 13 }}>🐦</span>
              <input className="sp-inp" value={(formData.twitterUrl as string) || ''} onChange={e => set('twitterUrl', e.target.value)} placeholder="https://twitter.com/yourschool" />
            </div>
          </Field>
        </div>
        <div className="sp-divider">School Photos</div>
        <div className="sp-g2">
          <ImageUpload label="School Logo"  hint="Square · JPG, PNG, WEBP · Max 1 MB"  file={logoFile}  existingUrl={existingLogoUrl}  onChange={setLogoFile}  onClearExisting={() => setExistingLogoUrl(null)} />
          <ImageUpload label="Cover Photo"  hint="1200×400 px recommended · Max 1 MB"   file={coverFile} existingUrl={existingCoverUrl} onChange={setCoverFile} onClearExisting={() => setExistingCoverUrl(null)} />
        </div>
        <div className="sp-info" style={{ marginTop: 20 }}>
          <strong style={{ color: 'var(--brand)' }}>Almost done.</strong> After saving, upload gallery photos and manage all settings from your school dashboard.
        </div>
      </>
    )
  }

  /* ── LOADING ── */
  if (!mounted || mode === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #E8E4DF', borderTop: '2px solid #D4520F', borderRadius: '50%', margin: '0 auto 12px', animation: 'sp-spin 0.75s linear infinite' }} />
        <div style={{ color: '#8C857E', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Loading your profile…</div>
        <style>{`@keyframes sp-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  /* ── EXISTING SCHOOL VIEW ── */
  if (mode === 'existing' && existingSchool) return (
    <>
      <style>{CSS + `@keyframes sp-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="sp-existing-wrap">
        <div className="sp-existing-inner">

          <div className="sp-existing-header">
            <div className="sp-existing-logo-btn"><GraduationCap size={18} color="#fff" /></div>
            <span className="sp-existing-brand">Thynk<span>Schooling</span></span>
          </div>

          <h1 className="sp-existing-h1">Your School</h1>
          <p className="sp-existing-sub">Manage your school profile or add a new one.</p>

          <motion.div className="sp-school-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="sp-school-card-top" />
            <div className="sp-school-card-body">
              <div className="sp-school-meta">
                <div className="sp-school-logo">
                  {existingSchool.logo_url
                    ? <img src={existingSchool.logo_url} alt="" />
                    : <GraduationCap size={24} color="#D4520F" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                    <span className="sp-school-name">{existingSchool.name}</span>
                    {existingSchool.is_verified && (
                      <span className="sp-school-verified"><CheckCircle2 size={9} /> Verified</span>
                    )}
                  </div>
                  <div className="sp-school-tags">
                    {existingSchool.city && (
                      <span className="sp-school-tag">
                        <MapPin size={10} color="#D4520F" />
                        {existingSchool.city}{existingSchool.state ? `, ${existingSchool.state}` : ''}
                      </span>
                    )}
                    {existingSchool.school_type && (
                      <span className="sp-school-tag">{existingSchool.school_type.replace(/_/g, ' ')}</span>
                    )}
                    {Array.isArray(existingSchool.board) && existingSchool.board[0] && (
                      <span className="sp-school-board-tag">{existingSchool.board.slice(0, 2).join(' · ')}</span>
                    )}
                  </div>
                  {existingSchool.tagline && (
                    <p className="sp-school-tagline">"{existingSchool.tagline}"</p>
                  )}
                </div>
              </div>

              <div className="sp-school-actions">
                <button onClick={() => {
                  const s = existingSchool
                  const parseArr = (v: any): string[] => {
                    if (Array.isArray(v)) return v.filter(Boolean)
                    if (typeof v === 'string' && v.startsWith('{')) {
                      return v.replace(/[{}"]/g, '').split(',').map((x: string) => x.trim()).filter(Boolean)
                    }
                    if (typeof v === 'string' && v.startsWith('[')) {
                      try { return JSON.parse(v).filter(Boolean) } catch { return [] }
                    }
                    return []
                  }
                  setFormData({
                    name: s.name||'', tagline: s.tagline||'', affiliationNo: s.affiliation_no||'',
                    description: s.description||'', foundingYear: s.founding_year||'',
                    totalStudents: s.total_students||'', studentTeacherRatio: s.student_teacher_ratio||'',
                    schoolType: s.school_type||'', board: parseArr(s.board),
                    genderPolicy: s.gender_policy||'', mediumOfInstruction: s.medium_of_instruction||'',
                    recognition: s.recognition||'', classesFrom: s.classes_from||'',
                    classesTo: s.classes_to||'', monthlyFeeMin: s.monthly_fee_min||'',
                    monthlyFeeMax: s.monthly_fee_max||'', annualFee: s.annual_fee||'',
                    admissionAcademicYear: s.admission_academic_year||'', admissionOpen: s.admission_open||false,
                    facilities: parseArr(s.facilities),
                    sports: parseArr(s.sports),
                    languages: parseArr(s.languages),
                    extracurriculars: parseArr(s.extracurriculars),
                    addressLine1: s.address_line1||'', locality: s.locality||'',
                    city: s.city||'', state: s.state||'', pincode: s.pincode||'',
                    latitude: s.latitude||'', longitude: s.longitude||'',
                    phone: s.phone||'', email: s.email||'',
                    websiteUrl: s.website_url||'', principalName: s.principal_name||'',
                  })
                  setExistingLogoUrl(s.logo_url || null)
                  setExistingCoverUrl(s.cover_url || null)
                  setLogoFile(null)
                  setCoverFile(null)
                  setStep(0)
                  setMode('new')
                }} className="sp-btn-edit">
                  Edit Profile
                </button>
                {existingSchool.slug && (
                  <a href={`/schools/${existingSchool.slug}`} target="_blank" rel="noreferrer" className="sp-btn-outline">
                    View Live Profile
                  </a>
                )}
                <button onClick={() => router.push('/dashboard/school')} className="sp-btn-outline">
                  Dashboard
                </button>
              </div>
            </div>
          </motion.div>

          <motion.button
            className="sp-add-school-btn"
            onClick={() => {
              setExistingSchool(null)
              setFormData({ board: [], admissionOpen: false, facilities: [], sports: [], languages: [], extracurriculars: [] })
              setLogoFile(null); setCoverFile(null)
              setExistingLogoUrl(null); setExistingCoverUrl(null)
              setStep(0); setMode('new')
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            + Add Another School
          </motion.button>

        </div>
      </div>
    </>
  )

  /* ── MAIN MULTI-STEP FORM ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="sp">

        {/* SIDEBAR */}
        <aside className="sp-sb">
          <div className="sp-sb-head">
            <div className="sp-sb-logo">
              <div className="sp-sb-icon"><GraduationCap size={18} color="white" /></div>
              <div className="sp-sb-name">Thynk<span>Schooling</span></div>
            </div>
            <div className="sp-sb-tagline">School Registration Portal</div>
          </div>

          <div className="sp-sb-steps">
            {STEPS.map((s, i) => {
              const cls = i < step ? 'done' : i === step ? 'active' : 'todo'
              return (
                <div key={s.label} className={`sp-sb-step ${cls}`}>
                  <div className="sp-sb-num">
                    {i < step ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}
                  </div>
                  <div>
                    <div className="sp-sb-lbl">{s.label}</div>
                    <div className="sp-sb-sub">{s.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sp-sb-foot">
            <div className="sp-sb-pct-row">
              <div className="sp-sb-pct-lbl">Progress</div>
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="sp-nav">
              <button className="sp-btn-back" onClick={() => setStep(s => s - 1)} disabled={isFirst}>
                <ArrowLeft size={14} /> Back
              </button>
              {isLast ? (
                <button className="sp-btn-next sp-btn-save" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? <><Loader2 size={14} style={{ animation: 'sp-spin 1s linear infinite' }} /> Saving…</>
                    : <><Save size={14} /> Save &amp; Go to Dashboard</>
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
