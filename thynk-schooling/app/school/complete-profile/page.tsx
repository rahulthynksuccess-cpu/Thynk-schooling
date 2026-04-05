'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Save, Loader2,
  Upload, MapPin, Phone, Mail, Globe, DollarSign,
  School, CheckCircle2, X, Star, Edit3, Plus, Building2,
  BookOpen, Users, Calendar, Award,
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

type FD = Record<string, string | string[] | number | boolean>

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
/* Profile view */
.spv{font-family:'Cabinet Grotesk',sans-serif;background:#F5F0E8;min-height:100vh;color:#14110E}
.spv-header{background:#fff;border-bottom:1px solid #E2DAD0;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.spv-logo{display:flex;align-items:center;gap:10px}
.spv-logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#D4520F,#F06325);display:flex;align-items:center;justify-content:center}
.spv-logo-name{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#14110E}
.spv-logo-name span{color:#D4520F}
.spv-crumb{font-size:13px;font-weight:600;color:#6B6259;margin-left:8px}
.spv-sep{color:#A89F97;margin:0 4px}
.spv-hbtn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;border:none}
.spv-btn-outline{background:#fff;border:1.5px solid #E2DAD0 !important;color:#6B6259}
.spv-btn-outline:hover{border-color:#14110E !important;color:#14110E}
.spv-btn-edit{background:#D4520F;color:#fff}
.spv-btn-edit:hover{background:#B8420D}
.spv-btn-add{background:#14110E;color:#fff}
.spv-btn-add:hover{background:#2a2520}
.spv-body{max-width:900px;margin:0 auto;padding:36px 32px 80px}
.spv-hero{background:#fff;border:1px solid #E2DAD0;border-radius:20px;overflow:hidden;margin-bottom:22px;box-shadow:0 2px 12px rgba(20,17,14,.06)}
.spv-cover{height:160px;background:linear-gradient(135deg,#D4520F,#F06325 60%,#FFB347);position:relative;overflow:hidden}
.spv-cover img{width:100%;height:100%;object-fit:cover}
.spv-cover-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(20,17,14,.3))}
.spv-badge-complete{position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:5px;padding:5px 12px;background:rgba(5,150,105,0.88);border-radius:99px;font-size:11px;font-weight:700;color:#fff;backdrop-filter:blur(4px)}
.spv-hero-body{padding:0 28px 28px}
.spv-logo-wrap{width:80px;height:80px;border-radius:18px;background:#fff;border:3px solid #fff;box-shadow:0 4px 18px rgba(20,17,14,.12);margin-top:-40px;margin-bottom:14px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.spv-logo-wrap img{width:100%;height:100%;object-fit:cover}
.spv-logo-fallback{width:100%;height:100%;background:linear-gradient(135deg,#D4520F,#F06325);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#fff}
.spv-school-name{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#14110E;margin-bottom:4px}
.spv-school-tagline{font-size:14px;color:#6B6259;margin-bottom:14px}
.spv-pills{display:flex;flex-wrap:wrap;gap:8px}
.spv-pill{display:flex;align-items:center;gap:5px;padding:5px 12px;background:#F5F0E8;border:1px solid #E2DAD0;border-radius:99px;font-size:12px;font-weight:600;color:#6B6259}
.spv-pill-green{background:rgba(5,150,105,0.08);border-color:rgba(5,150,105,0.25);color:#059669}
.spv-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.spv-card{background:#fff;border:1px solid #E2DAD0;border-radius:16px;padding:22px;box-shadow:0 1px 4px rgba(20,17,14,.04)}
.spv-card-full{grid-column:1/-1}
.spv-card-title{font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#A89F97;margin-bottom:16px;display:flex;align-items:center;gap:7px}
.spv-row{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #F5F0E8}
.spv-row:last-child{border-bottom:none;padding-bottom:0}
.spv-row-icon{width:30px;height:30px;border-radius:8px;background:#FEF0E7;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.spv-row-lbl{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#A89F97;margin-bottom:2px}
.spv-row-val{font-size:13px;font-weight:600;color:#14110E}
.spv-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.spv-chip-brand{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#FEF0E7;border:1px solid rgba(212,82,15,.2);color:#D4520F}
.spv-chip-muted{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#F5F0E8;border:1px solid #E2DAD0;color:#6B6259}
.spv-fee-box{background:linear-gradient(135deg,#FEF0E7,#fff);border:1.5px solid rgba(212,82,15,.2);border-radius:14px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
.spv-fee-lbl{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#A89F97;margin-bottom:4px}
.spv-fee-val{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#D4520F}
.spv-add-cta{background:#fff;border:2px dashed rgba(212,82,15,.3);border-radius:16px;padding:32px;text-align:center;cursor:pointer;transition:all .2s}
.spv-add-cta:hover{border-color:#D4520F;background:#FEF0E7;transform:translateY(-2px)}
.spv-add-icon{width:52px;height:52px;border-radius:14px;background:#FEF0E7;border:1.5px solid rgba(212,82,15,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.spv-add-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#14110E;margin-bottom:5px}
.spv-add-desc{font-size:13px;color:#6B6259}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@keyframes sp-loading{0%,100%{opacity:.4}50%{opacity:1}}
@media(max-width:720px){
  .sp-sb{display:none}
  .sp-main-inner{padding:28px 20px}
  .sp-nav{padding:14px 20px;margin:0 -20px}
  .sp-title{font-size:32px}
  .sp-g2{grid-template-columns:1fr}
  .spv-grid{grid-template-columns:1fr}
  .spv-body{padding:24px 16px 60px}
  .spv-header{padding:0 16px;flex-wrap:wrap;height:auto;padding-top:12px;padding-bottom:12px;gap:10px}
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

function ImageUpload({ label, hint, file, existingUrl, onChange }: {
  label: string; hint: string; file: File | null; existingUrl?: string | null
  onChange: (f: File | null) => void
}) {
  const handle = (f: File | null) => {
    if (!f) { onChange(null); return }
    if (!IMG_TYPES.includes(f.type)) { toast.error(`${label}: JPG, PNG or WEBP only`); return }
    if (f.size > MAX_BYTES) { toast.error(`${label} too large — max 1 MB`); return }
    onChange(f)
  }
  const previewSrc = file ? URL.createObjectURL(file) : existingUrl || null
  return (
    <Field label={label}>
      {previewSrc ? (
        <div className="sp-file-prev">
          <img className="sp-f-thumb" src={previewSrc} alt="" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sp-f-name">{file ? file.name : 'Current image'}</div>
            <div className="sp-f-size">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'Uploaded'}</div>
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

function AmenitiesStep({ formData, toggle }: { formData: FD; toggle: (k: string, v: string) => void }) {
  const [activeTab, setActiveTab] = useState('facility')
  const { options: facilities,       isLoading: lFac   } = useDropdown('facility')
  const { options: sports,           isLoading: lSport  } = useDropdown('sport')
  const { options: languages,        isLoading: lLang   } = useDropdown('language')
  const { options: extracurriculars, isLoading: lExtra  } = useDropdown('extracurricular')
  const TAB_DATA: Record<string, { options: { label: string; value: string }[]; isLoading: boolean; fieldKey: string }> = {
    facility:        { options: facilities,       isLoading: lFac,   fieldKey: 'facilities' },
    sport:           { options: sports,           isLoading: lSport, fieldKey: 'sports' },
    language:        { options: languages,        isLoading: lLang,  fieldKey: 'languages' },
    extracurricular: { options: extracurriculars, isLoading: lExtra, fieldKey: 'extracurriculars' },
  }
  const current = TAB_DATA[activeTab]
  const selectedInTab = (formData[current.fieldKey] as string[]) || []
  const totalSelected = AMENITY_TABS.reduce((acc, t) => acc + ((formData[TAB_DATA[t.key].fieldKey] as string[]) || []).length, 0)
  return (
    <>
      <StepHeader step={3} />
      <div className="sp-a-nav">
        {AMENITY_TABS.map(t => (
          <button key={t.key} type="button" className={`sp-a-tab${activeTab === t.key ? ' on' : ''}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {current.isLoading ? <div className="sp-a-empty">Loading options…</div>
        : current.options.length === 0
          ? <div className="sp-a-empty">No options configured yet.<br />Go to <strong style={{ color: 'var(--brand)' }}>Admin → Settings → Dropdowns</strong> and add options under the &ldquo;{activeTab}&rdquo; category.</div>
          : <div className="sp-a-grid">
              {current.options.map(opt => {
                const on = selectedInTab.includes(opt.value)
                return (
                  <button key={opt.value} type="button" className={`sp-a-chip${on ? ' on' : ''}`}
                    onClick={() => toggle(current.fieldKey, opt.value)}>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {on && <CheckCircle2 className="sp-a-chk" size={15} />}
                  </button>
                )
              })}
            </div>
      }
      {totalSelected > 0 && <p className="sp-a-count">✓ {totalSelected} feature{totalSelected > 1 ? 's' : ''} selected across all categories</p>}
    </>
  )
}

/* ── Profile View ── */
function ProfileView({ school, onEdit, onAddNew }: { school: any; onEdit: () => void; onAddNew: () => void }) {
  const router = useRouter()
  const fmt = (v: any) => (v != null && String(v).trim() !== '' ? String(v) : null)
  const fmtArr = (v: any): string[] | null => Array.isArray(v) && v.length > 0 ? v : null
  const fmtMoney = (v: any) => v ? `₹${Number(v).toLocaleString('en-IN')}` : null
  return (
    <div className="spv">
      <style>{CSS}</style>
      <header className="spv-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="spv-logo">
            <div className="spv-logo-icon"><GraduationCap size={16} color="white" /></div>
            <span className="spv-logo-name">Thynk<span>Schooling</span></span>
          </div>
          <span className="spv-sep">/</span>
          <span className="spv-crumb">School Profile</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="spv-hbtn spv-btn-outline" onClick={() => router.push('/dashboard/school')}>← Dashboard</button>
          <button className="spv-hbtn spv-btn-add" onClick={onAddNew}><Plus size={13} /> Add New School</button>
          <button className="spv-hbtn spv-btn-edit" onClick={onEdit}><Edit3 size={13} /> Edit Profile</button>
        </div>
      </header>
      <div className="spv-body">
        <motion.div className="spv-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="spv-cover">
            {school.cover_url && <img src={school.cover_url} alt="Cover" />}
            <div className="spv-cover-overlay" />
            <div className="spv-badge-complete"><CheckCircle2 size={12} /> Profile Complete</div>
          </div>
          <div className="spv-hero-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div className="spv-logo-wrap">
                {school.logo_url
                  ? <img src={school.logo_url} alt="Logo" />
                  : <div className="spv-logo-fallback">{(school.name || 'S')[0]}</div>
                }
              </div>
              <div style={{ paddingBottom: 6 }}>
                <div className="spv-school-name">{school.name}</div>
                {fmt(school.tagline) && <div className="spv-school-tagline">{school.tagline}</div>}
              </div>
            </div>
            <div className="spv-pills" style={{ marginTop: 14 }}>
              {fmt(school.city) && <span className="spv-pill"><MapPin size={11} color="#D4520F" />{[school.city, school.state].filter(Boolean).join(', ')}</span>}
              {fmt(school.school_type) && <span className="spv-pill"><Building2 size={11} color="#D4520F" />{school.school_type}</span>}
              {fmt(school.medium_of_instruction) && <span className="spv-pill"><BookOpen size={11} color="#D4520F" />{school.medium_of_instruction}</span>}
              {fmt(school.gender_policy) && <span className="spv-pill"><Users size={11} color="#D4520F" />{school.gender_policy}</span>}
              {fmt(school.founding_year) && <span className="spv-pill"><Calendar size={11} color="#D4520F" />Est. {school.founding_year}</span>}
              {school.admission_open && <span className="spv-pill spv-pill-green"><CheckCircle2 size={11} />Admissions Open</span>}
            </div>
          </div>
        </motion.div>

        {fmt(school.description) && (
          <motion.div className="spv-card" style={{ marginBottom: 18 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <div className="spv-card-title"><BookOpen size={13} color="#D4520F" /> About this School</div>
            <p style={{ fontSize: 14, color: '#6B6259', lineHeight: 1.7 }}>{school.description}</p>
          </motion.div>
        )}

        {(school.monthly_fee_min || school.monthly_fee_max) && (
          <motion.div className="spv-fee-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div>
              <div className="spv-fee-lbl">Monthly Tuition</div>
              <div className="spv-fee-val">{fmtMoney(school.monthly_fee_min)}{school.monthly_fee_max ? ` – ${fmtMoney(school.monthly_fee_max)}` : '+'}</div>
            </div>
            {school.annual_fee && <div><div className="spv-fee-lbl">Annual Fee</div><div className="spv-fee-val" style={{ fontSize: 18 }}>{fmtMoney(school.annual_fee)}</div></div>}
            {school.classes_from && <div><div className="spv-fee-lbl">Classes</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: '#14110E' }}>{school.classes_from}{school.classes_to ? ` – ${school.classes_to}` : ''}</div></div>}
          </motion.div>
        )}

        <div className="spv-grid">
          <motion.div className="spv-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="spv-card-title"><GraduationCap size={13} color="#D4520F" /> Academic</div>
            {fmtArr(school.board) && <div className="spv-row"><div className="spv-row-icon"><Award size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Boards</div><div className="spv-chips">{school.board.map((b: string) => <span key={b} className="spv-chip-brand">{b}</span>)}</div></div></div>}
            {fmt(school.recognition) && <div className="spv-row"><div className="spv-row-icon"><Award size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Recognition</div><div className="spv-row-val">{school.recognition}</div></div></div>}
            {fmt(school.total_students) && <div className="spv-row"><div className="spv-row-icon"><Users size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Students</div><div className="spv-row-val">{Number(school.total_students).toLocaleString('en-IN')}</div></div></div>}
            {fmt(school.student_teacher_ratio) && <div className="spv-row"><div className="spv-row-icon"><Users size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Student:Teacher</div><div className="spv-row-val">{school.student_teacher_ratio}</div></div></div>}
            {fmt(school.affiliation_no) && <div className="spv-row"><div className="spv-row-icon"><School size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Affiliation No.</div><div className="spv-row-val">{school.affiliation_no}</div></div></div>}
          </motion.div>

          <motion.div className="spv-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="spv-card-title"><Phone size={13} color="#D4520F" /> Contact & Location</div>
            {fmt(school.principal_name) && <div className="spv-row"><div className="spv-row-icon"><Users size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Principal</div><div className="spv-row-val">{school.principal_name}</div></div></div>}
            {fmt(school.phone) && <div className="spv-row"><div className="spv-row-icon"><Phone size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Phone</div><div className="spv-row-val">{school.phone}</div></div></div>}
            {fmt(school.email) && <div className="spv-row"><div className="spv-row-icon"><Mail size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Email</div><div className="spv-row-val">{school.email}</div></div></div>}
            {fmt(school.website_url) && <div className="spv-row"><div className="spv-row-icon"><Globe size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Website</div><a href={school.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#D4520F', wordBreak: 'break-all' }}>{school.website_url}</a></div></div>}
            {fmt(school.address_line1) && <div className="spv-row"><div className="spv-row-icon"><MapPin size={13} color="#D4520F" /></div><div><div className="spv-row-lbl">Address</div><div className="spv-row-val" style={{ lineHeight: 1.5, fontSize: 12 }}>{[school.address_line1, school.locality, school.city, school.state, school.pincode].filter(Boolean).join(', ')}</div></div></div>}
          </motion.div>

          {(fmtArr(school.facilities) || fmtArr(school.sports) || fmtArr(school.languages) || fmtArr(school.extracurriculars)) && (
            <motion.div className="spv-card spv-card-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="spv-card-title"><Star size={13} color="#D4520F" /> Features & Amenities</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 20 }}>
                {[
                  { label: 'Facilities', items: school.facilities },
                  { label: 'Sports', items: school.sports },
                  { label: 'Languages', items: school.languages },
                  { label: 'Extracurricular', items: school.extracurriculars },
                ].filter(g => fmtArr(g.items)).map(g => (
                  <div key={g.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#A89F97', marginBottom: 8 }}>{g.label}</div>
                    <div className="spv-chips">{g.items.map((i: string) => <span key={i} className="spv-chip-muted">{i}</span>)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <motion.div className="spv-add-cta" onClick={onAddNew} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onAddNew()}>
          <div className="spv-add-icon"><Plus size={22} color="#D4520F" /></div>
          <div className="spv-add-title">Register Another School</div>
          <div className="spv-add-desc">Manage multiple school profiles from one account</div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── Form Component ── */
function ProfileForm({ initialData, isEdit, onCancel, onSaved }: {
  initialData?: any; isEdit?: boolean; onCancel: () => void; onSaved: () => void
}) {
  const { setUser, user, accessToken } = useAuthStore()
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  const mapDb = (s: any): FD => ({
    name: s.name || '', tagline: s.tagline || '', affiliationNo: s.affiliation_no || '',
    description: s.description || '', foundingYear: s.founding_year || '',
    schoolType: s.school_type || '', board: Array.isArray(s.board) ? s.board : [],
    genderPolicy: s.gender_policy || '', mediumOfInstruction: s.medium_of_instruction || '',
    recognition: s.recognition || '', totalStudents: s.total_students || '',
    studentTeacherRatio: s.student_teacher_ratio || '', classesFrom: s.classes_from || '',
    classesTo: s.classes_to || '', monthlyFeeMin: s.monthly_fee_min || '',
    monthlyFeeMax: s.monthly_fee_max || '', annualFee: s.annual_fee || '',
    admissionOpen: !!s.admission_open, admissionAcademicYear: s.admission_academic_year || '',
    facilities: Array.isArray(s.facilities) ? s.facilities : [],
    sports: Array.isArray(s.sports) ? s.sports : [],
    languages: Array.isArray(s.languages) ? s.languages : [],
    extracurriculars: Array.isArray(s.extracurriculars) ? s.extracurriculars : [],
    addressLine1: s.address_line1 || '', state: s.state || '', city: s.city || '',
    locality: s.locality || '', pincode: s.pincode || '',
    latitude: s.latitude || '', longitude: s.longitude || '',
    phone: s.phone || '', email: s.email || '',
    websiteUrl: s.website_url || '', principalName: s.principal_name || '',
  })

  const [formData, setFormData] = useState<FD>(() =>
    initialData ? mapDb(initialData) : { board: [], admissionOpen: false, facilities: [], sports: [], languages: [], extracurriculars: [] }
  )
  const [logoFile,  setLogoFile]  = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  useEffect(() => { setMounted(true) }, [])

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
  const { options: recognitions,   isLoading: lRecog }    = useDropdown('recognition')
  const { options: classLevels,    isLoading: lClass }    = useDropdown('class_level')
  const { options: states,         isLoading: lStates }   = useDropdown('state')
  const { options: cities,         isLoading: lCities }   = useDropdown('city', { parentValue: formData.state as string, enabled: !!formData.state })
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
      const token = accessToken || localStorage.getItem('ts_access_token') || ''
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const tokenParam = token ? `?__token=${encodeURIComponent(token)}` : ''
      const r = await fetch(`/api/schools?action=profile${tokenParam ? '&' + tokenParam.slice(1) : ''}`, {
        method: 'POST', credentials: 'include', headers, body: fd,
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
      toast.success(isEdit ? 'Profile updated! 🎉' : 'School profile saved! 🎉')
      onSaved()
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
            value={(formData.description as string) || ''} onChange={e => set('description', e.target.value)}
            placeholder="Describe your school's vision, teaching philosophy, values…" />
        </Field>
        <Field label="Year Established">
          <input className="sp-inp" type="number" style={{ maxWidth: 160 }}
            value={(formData.foundingYear as number) || ''} onChange={e => set('foundingYear', Number(e.target.value))}
            placeholder="e.g. 1978" min={1800} max={new Date().getFullYear()} />
        </Field>
      </>
    )
    if (step === 1) return (
      <>
        <StepHeader step={1} />
        <div className="sp-g2">
          <DynSel label="School Type"           fieldKey="schoolType"          options={schoolTypes}    isLoading={lTypes}  required formData={formData} set={setS} />
          <DynSel label="Gender Policy"         fieldKey="genderPolicy"        options={genderPolicies} isLoading={lGender} required formData={formData} set={setS} />
          <DynSel label="Medium of Instruction" fieldKey="mediumOfInstruction" options={mediums}        isLoading={lMedium} required formData={formData} set={setS} />
          <DynSel label="Recognition"           fieldKey="recognition"         options={recognitions}   isLoading={lRecog}           formData={formData} set={setS} />
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
        <div className="sp-divider">Average Monthly Tuition Fee (₹)</div>
        <div className="sp-g2">
          <Field label="Minimum"><div style={{ position: 'relative' }}><span className="sp-pfx">₹</span><input className="sp-inp sp-pfx-inp" type="number" value={(formData.monthlyFeeMin as number) || ''} onChange={e => set('monthlyFeeMin', Number(e.target.value))} placeholder="3,000" /></div></Field>
          <Field label="Maximum"><div style={{ position: 'relative' }}><span className="sp-pfx">₹</span><input className="sp-inp sp-pfx-inp" type="number" value={(formData.monthlyFeeMax as number) || ''} onChange={e => set('monthlyFeeMax', Number(e.target.value))} placeholder="10,000" /></div></Field>
        </div>
        <Field label="Annual / Admission Fee (₹)">
          <div style={{ position: 'relative', maxWidth: 220 }}><span className="sp-pfx">₹</span><input className="sp-inp sp-pfx-inp" type="number" value={(formData.annualFee as number) || ''} onChange={e => set('annualFee', Number(e.target.value))} placeholder="25,000" /></div>
        </Field>
        <div className="sp-divider">Admission Info</div>
        <div style={{ maxWidth: 240, marginBottom: 16 }}>
          <DynSel label="Academic Year" fieldKey="admissionAcademicYear" options={academicYears} isLoading={lAcYear} formData={formData} set={setS} />
        </div>
        <div className="sp-tog-row">
          <span className="sp-tog-lbl">Admissions currently open</span>
          <label className="sp-tog"><input type="checkbox" checked={!!formData.admissionOpen} onChange={e => set('admissionOpen', e.target.checked)} /><span className="sp-sl" /></label>
        </div>
      </>
    )
    if (step === 3) return <AmenitiesStep formData={formData} toggle={toggle} />
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
              <select className="sp-sel" value={(formData.city as string) || ''} onChange={e => set('city', e.target.value)} disabled={!formData.state || lCities} style={{ color: formData.city ? 'var(--ink)' : 'var(--ghost)' }}>
                <option value="">{!formData.state ? 'Select state first' : lCities ? 'Loading…' : 'Select City'}</option>
                {cities.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Locality / Area"><input className="sp-inp" value={(formData.locality as string) || ''} onChange={e => set('locality', e.target.value)} placeholder="e.g. Sector 18" /></Field>
          <Field label="Pincode" required><input className="sp-inp" value={(formData.pincode as string) || ''} onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))} placeholder="e.g. 201301" maxLength={6} /></Field>
          <Field label="Latitude (GPS)"><input className="sp-inp" type="number" step="0.0000001" value={(formData.latitude as number) || ''} onChange={e => set('latitude', Number(e.target.value))} placeholder="e.g. 28.5355" /></Field>
          <Field label="Longitude (GPS)"><input className="sp-inp" type="number" step="0.0000001" value={(formData.longitude as number) || ''} onChange={e => set('longitude', Number(e.target.value))} placeholder="e.g. 77.3910" /></Field>
        </div>
        <p className="sp-note">📍 Right-click your school on Google Maps → &ldquo;What&apos;s here?&rdquo; to get GPS coordinates.</p>
      </>
    )
    if (step === 5) return (
      <>
        <StepHeader step={5} />
        <div className="sp-g2">
          <Field label="School Phone"><div className="sp-with-icon" style={{ position: 'relative' }}><span className="sp-fi"><Phone size={15} /></span><input className="sp-inp" value={(formData.phone as string) || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div></Field>
          <Field label="School Email"><div className="sp-with-icon" style={{ position: 'relative' }}><span className="sp-fi"><Mail size={15} /></span><input className="sp-inp" type="email" value={(formData.email as string) || ''} onChange={e => set('email', e.target.value)} placeholder="admissions@school.edu.in" /></div></Field>
        </div>
        <Field label="Website URL"><div className="sp-with-icon" style={{ position: 'relative' }}><span className="sp-fi"><Globe size={15} /></span><input className="sp-inp" value={(formData.websiteUrl as string) || ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://www.yourschool.edu.in" /></div></Field>
        <Field label="Principal Name"><input className="sp-inp" value={(formData.principalName as string) || ''} onChange={e => set('principalName', e.target.value)} placeholder="e.g. Dr. Ranjana Sharma" /></Field>
        <div className="sp-divider">School Photos</div>
        <div className="sp-g2">
          <ImageUpload label="School Logo"  hint="Square · JPG, PNG, WEBP · Max 1 MB" file={logoFile}  existingUrl={initialData?.logo_url}  onChange={setLogoFile} />
          <ImageUpload label="Cover Photo"  hint="1200×400px recommended · Max 1 MB"   file={coverFile} existingUrl={initialData?.cover_url} onChange={setCoverFile} />
        </div>
        <div className="sp-info" style={{ marginTop: 20 }}>
          <strong style={{ color: 'var(--brand)' }}>{isEdit ? 'Updating your profile.' : "You're almost done!"}</strong>{' '}
          {isEdit ? 'Changes will be reflected immediately on your public profile.' : 'After saving, manage all settings from your school dashboard.'}
        </div>
      </>
    )
  }

  if (!mounted) return null
  return (
    <>
      <style>{CSS}</style>
      <div className="sp">
        <aside className="sp-sb">
          <div className="sp-sb-head">
            <div className="sp-sb-logo">
              <div className="sp-sb-icon"><GraduationCap size={21} color="white" /></div>
              <div className="sp-sb-name">Thynk<span>Schooling</span></div>
            </div>
            <div className="sp-sb-tagline">{isEdit ? 'Edit School Profile' : 'School Registration Portal'}</div>
          </div>
          <div className="sp-sb-steps">
            {STEPS.map((s, i) => {
              const cls = i < step ? 'done' : i === step ? 'active' : 'todo'
              return (
                <div key={s.label}>
                  <div className={`sp-sb-step ${cls}`}>
                    <div className="sp-sb-num">{i < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}</div>
                    <div><div className="sp-sb-lbl">{s.label}</div></div>
                  </div>
                  {i < STEPS.length - 1 && <div className="sp-sb-conn" />}
                </div>
              )
            })}
          </div>
          <div className="sp-sb-foot">
            <div className="sp-sb-pct-row">
              <div className="sp-sb-pct-lbl">{isEdit ? 'Progress' : 'Completion'}</div>
              <div className="sp-sb-pct-val">{pct}%</div>
            </div>
            <div className="sp-sb-track"><div className="sp-sb-fill" style={{ width: `${pct}%` }} /></div>
            {isEdit && (
              <button onClick={onCancel} style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 13, fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 600 }}>
                ← Back to Profile
              </button>
            )}
          </div>
        </aside>
        <main className="sp-main">
          <div className="sp-main-inner">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
            <div className="sp-nav">
              <button className="sp-btn-back" onClick={() => isFirst ? onCancel() : setStep(s => s - 1)} disabled={!isEdit && isFirst}>
                <ArrowLeft size={15} /> {isFirst ? 'Cancel' : 'Back'}
              </button>
              {isLast ? (
                <button className="sp-btn-next sp-btn-save" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? <><Loader2 size={16} style={{ animation: 'sp-spin 1s linear infinite' }} /> Saving…</>
                    : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Save Profile & Go to Dashboard'}</>
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

/* ── Main Page ── */
export default function SchoolCompleteProfilePage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const qc = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit' | 'add-new'>('view')

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && (!accessToken || !user)) router.replace('/login')
  }, [mounted, accessToken, user, router])

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['school-profile-mine'],
    queryFn: async () => {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') : '') || ''
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const tokenParam = token ? `?__token=${encodeURIComponent(token)}` : ''
      const r = await fetch(`/api/schools/profile${tokenParam}`, { credentials: 'include', headers })
      if (!r.ok) return { school: null }
      return r.json()
    },
    enabled: !!accessToken && mounted,
    staleTime: 60 * 1000,
  })

  if (!mounted) return null

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cabinet Grotesk',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="#D4520F" style={{ animation: 'sp-spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: '#A89F97', fontSize: 14 }}>Loading your profile…</p>
        </div>
        <style>{`@keyframes sp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const school = profileData?.school
  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ['school-profile-mine'] })
    refetch().then(() => setMode('view'))
  }

  // No profile yet → blank form
  if (!school) {
    return <ProfileForm isEdit={false} onCancel={() => router.push('/dashboard/school')} onSaved={handleSaved} />
  }

  // Editing existing profile
  if (mode === 'edit') {
    return <ProfileForm initialData={school} isEdit={true} onCancel={() => setMode('view')} onSaved={handleSaved} />
  }

  // Adding a new school
  if (mode === 'add-new') {
    return <ProfileForm isEdit={false} onCancel={() => setMode('view')} onSaved={handleSaved} />
  }

  // Default: show completed profile
  return <ProfileView school={school} onEdit={() => setMode('edit')} onAddNew={() => setMode('add-new')} />
}
