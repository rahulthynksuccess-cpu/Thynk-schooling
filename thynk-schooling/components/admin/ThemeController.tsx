'use client'
import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  Palette, Type, Layout, Eye, Save, RotateCcw,
  ChevronRight, Check, Moon, Sun, Sliders, Globe,
  ArrowLeft, Copy, Download
} from 'lucide-react'
import { clsx } from 'clsx'

// ── Types ──────────────────────────────────────────────────────
interface ThemeConfig {
  // Colours
  colorBg:           string
  colorBgAlt:        string
  colorBgDark:       string
  colorSurface:      string
  colorBorder:       string
  colorPrimary:      string
  colorPrimaryHover: string
  colorAccent:       string
  colorAccentHover:  string
  colorText:         string
  colorTextMuted:    string
  colorTextFaint:    string
  // Typography
  fontSerif:   string
  fontSans:    string
  fontScale:   number   // 0.85 – 1.2
  // Layout
  borderRadius: number  // px  4-24
  maxWidth:     number  // px  900-1400
  sectionPad:   number  // px  48-128
  // Buttons
  btnRadius:    number  // 0-16
  btnStyle:     'filled' | 'outline' | 'soft'
  // Cards
  cardShadow:   'none' | 'soft' | 'medium' | 'strong'
  cardRadius:   number
  // Nav
  navStyle:     'light' | 'dark' | 'glass'
  // Footer
  footerStyle:  'light' | 'dark' | 'ink'
  // Presets
  preset:       string
}

// ── Presets ────────────────────────────────────────────────────
const PRESETS: Record<string, Partial<ThemeConfig> & { label: string; emoji: string }> = {
  ivory_gold: {
    label:'Ivory & Gold', emoji:'🏛',
    colorBg:'#FAF7F2', colorBgAlt:'#F5F0E8', colorBgDark:'#EDE5D8', colorSurface:'#FFFFFF',
    colorBorder:'rgba(13,17,23,0.09)', colorPrimary:'#0D1117', colorPrimaryHover:'#1C2333',
    colorAccent:'#B8860B', colorAccentHover:'#C9960D',
    colorText:'#0D1117', colorTextMuted:'#4A5568', colorTextFaint:'#A0ADB8',
    fontSerif:'Cormorant Garamond', fontSans:'Inter',
    borderRadius:12, maxWidth:1160, sectionPad:96,
    btnRadius:6, btnStyle:'filled', cardShadow:'soft', cardRadius:12,
    navStyle:'light', footerStyle:'ink',
  },
  black_gold: {
    label:'Black & Rose Gold', emoji:'🖤',
    colorBg:'#050505', colorBgAlt:'#0D0D0D', colorBgDark:'#111111', colorSurface:'#1A1A1A',
    colorBorder:'rgba(255,255,255,0.07)', colorPrimary:'#F5F5F5', colorPrimaryHover:'#FFFFFF',
    colorAccent:'#C9A96E', colorAccentHover:'#D4B87A',
    colorText:'#F5F5F5', colorTextMuted:'rgba(245,245,245,0.55)', colorTextFaint:'rgba(245,245,245,0.28)',
    fontSerif:'Playfair Display', fontSans:'Inter',
    borderRadius:14, maxWidth:1200, sectionPad:100,
    btnRadius:8, btnStyle:'outline', cardShadow:'medium', cardRadius:14,
    navStyle:'dark', footerStyle:'dark',
  },
  sand_burgundy: {
    label:'Sand & Burgundy', emoji:'🏺',
    colorBg:'#F5EFE6', colorBgAlt:'#EDE0CC', colorBgDark:'#E2CEB0', colorSurface:'#FFF8F0',
    colorBorder:'rgba(26,10,0,0.09)', colorPrimary:'#8B2500', colorPrimaryHover:'#A63000',
    colorAccent:'#8B2500', colorAccentHover:'#A63000',
    colorText:'#1A0A00', colorTextMuted:'#6B4B3A', colorTextFaint:'#B09080',
    fontSerif:'Playfair Display', fontSans:'Inter',
    borderRadius:10, maxWidth:1160, sectionPad:96,
    btnRadius:5, btnStyle:'filled', cardShadow:'soft', cardRadius:10,
    navStyle:'light', footerStyle:'dark',
  },
  forest_green: {
    label:'Forest & Gold', emoji:'🌿',
    colorBg:'#071A0F', colorBgAlt:'#0F2918', colorBgDark:'#163820', colorSurface:'#0F2919',
    colorBorder:'rgba(212,175,55,0.15)', colorPrimary:'#D4AF37', colorPrimaryHover:'#E0C55A',
    colorAccent:'#D4AF37', colorAccentHover:'#E0C55A',
    colorText:'#F0EDD8', colorTextMuted:'rgba(240,237,216,0.55)', colorTextFaint:'rgba(240,237,216,0.3)',
    fontSerif:'Cormorant Garamond', fontSans:'DM Sans',
    borderRadius:16, maxWidth:1200, sectionPad:96,
    btnRadius:10, btnStyle:'filled', cardShadow:'medium', cardRadius:16,
    navStyle:'dark', footerStyle:'dark',
  },
  clean_minimal: {
    label:'Clean Minimal', emoji:'⬜',
    colorBg:'#FFFFFF', colorBgAlt:'#F8F9FA', colorBgDark:'#F1F3F5', colorSurface:'#FFFFFF',
    colorBorder:'rgba(0,0,0,0.08)', colorPrimary:'#111827', colorPrimaryHover:'#1F2937',
    colorAccent:'#2563EB', colorAccentHover:'#1D4ED8',
    colorText:'#111827', colorTextMuted:'#6B7280', colorTextFaint:'#9CA3AF',
    fontSerif:'Inter', fontSans:'Inter',
    borderRadius:10, maxWidth:1200, sectionPad:88,
    btnRadius:8, btnStyle:'filled', cardShadow:'soft', cardRadius:10,
    navStyle:'light', footerStyle:'ink',
  },
  royal_purple: {
    label:'Royal Purple', emoji:'💜',
    colorBg:'#0D0618', colorBgAlt:'#130924', colorBgDark:'#1A0D30', colorSurface:'#1A0D30',
    colorBorder:'rgba(167,139,250,0.15)', colorPrimary:'#A78BFA', colorPrimaryHover:'#C4B5FD',
    colorAccent:'#F59E0B', colorAccentHover:'#FCD34D',
    colorText:'#F5F3FF', colorTextMuted:'rgba(245,243,255,0.55)', colorTextFaint:'rgba(245,243,255,0.28)',
    fontSerif:'Playfair Display', fontSans:'Inter',
    borderRadius:16, maxWidth:1200, sectionPad:96,
    btnRadius:10, btnStyle:'soft', cardShadow:'medium', cardRadius:16,
    navStyle:'dark', footerStyle:'dark',
  },
}

const DEFAULT: ThemeConfig = { ...PRESETS.ivory_gold, preset:'ivory_gold', fontScale:1 } as ThemeConfig

// ── CSS Generator ──────────────────────────────────────────────
function generateCSS(t: ThemeConfig): string {
  const fontImport = t.fontSerif === 'Cormorant Garamond'
    ? `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=${t.fontSans.replace(/ /g,'+')}:wght@300;400;500;600&display=swap');`
    : `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=${t.fontSans.replace(/ /g,'+')}:wght@300;400;500;600&display=swap');`

  const shadowMap = {
    none:   'none',
    soft:   '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    medium: '0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
    strong: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
  }

  return `/* ── THYNK SCHOOLING — GENERATED THEME ──────────────────── */
/* Generated: ${new Date().toLocaleString('en-IN')} */
/* Preset: ${t.preset} */
/* Edit via /admin/theme — do not edit manually */

${fontImport}

:root {
  /* ── Colours ── */
  --color-bg:            ${t.colorBg};
  --color-bg-alt:        ${t.colorBgAlt};
  --color-bg-dark:       ${t.colorBgDark};
  --color-surface:       ${t.colorSurface};
  --color-border:        ${t.colorBorder};
  --color-primary:       ${t.colorPrimary};
  --color-primary-hover: ${t.colorPrimaryHover};
  --color-accent:        ${t.colorAccent};
  --color-accent-hover:  ${t.colorAccentHover};
  --color-text:          ${t.colorText};
  --color-text-muted:    ${t.colorTextMuted};
  --color-text-faint:    ${t.colorTextFaint};

  /* ── Typography ── */
  --font-serif:   '${t.fontSerif}', Georgia, serif;
  --font-sans:    '${t.fontSans}', system-ui, sans-serif;
  --font-scale:   ${t.fontScale};

  /* ── Layout ── */
  --radius:       ${t.borderRadius}px;
  --max-width:    ${t.maxWidth}px;
  --section-pad:  ${t.sectionPad}px;

  /* ── Components ── */
  --btn-radius:   ${t.btnRadius}px;
  --card-radius:  ${t.cardRadius}px;
  --card-shadow:  ${shadowMap[t.cardShadow]};
}

/* ── Base ─────────────────────────────────────────────────────── */
html { scroll-behavior: smooth; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: calc(1rem * var(--font-scale));
  font-weight: 300;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
h1,h2,h3,h4 {
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.04;
  letter-spacing: -0.02em;
}
::selection { background: color-mix(in srgb, var(--color-accent) 20%, transparent); }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--color-bg-alt); }
::-webkit-scrollbar-thumb { background: var(--color-accent); border-radius: 99px; }

/* ── Buttons ─────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: ${t.btnStyle === 'outline' ? 'transparent' : t.colorPrimary};
  color: ${t.btnStyle === 'outline' ? t.colorPrimary : t.colorBg};
  border: 1px solid ${t.colorPrimary};
  font-family: var(--font-sans); font-size: calc(13px * var(--font-scale)); font-weight: 500;
  padding: 12px 26px; border-radius: var(--btn-radius); cursor: pointer;
  transition: all 0.22s ease;
}
.btn-primary:hover {
  background: ${t.colorPrimaryHover};
  color: ${t.colorBg};
  border-color: ${t.colorPrimaryHover};
  transform: translateY(-1px);
}
.btn-accent {
  display: inline-flex; align-items: center; gap: 8px;
  background: ${t.btnStyle === 'soft' ? `color-mix(in srgb, ${t.colorAccent} 15%, transparent)` : t.colorAccent};
  color: ${t.btnStyle === 'soft' ? t.colorAccent : t.colorBg};
  border: 1px solid ${t.colorAccent};
  font-family: var(--font-sans); font-size: calc(13px * var(--font-scale)); font-weight: 600;
  padding: 12px 26px; border-radius: var(--btn-radius); cursor: pointer;
  transition: all 0.22s ease;
}
.btn-accent:hover { background: ${t.colorAccentHover}; color: ${t.colorBg}; border-color: ${t.colorAccentHover}; transform: translateY(-1px); }
.btn-outline {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; color: var(--color-text);
  border: 1px solid var(--color-border);
  font-family: var(--font-sans); font-size: calc(13px * var(--font-scale)); font-weight: 500;
  padding: 11px 24px; border-radius: var(--btn-radius); cursor: pointer; transition: all 0.2s;
}
.btn-outline:hover { border-color: var(--color-accent); color: var(--color-accent); }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; color: var(--color-text-muted); border: none;
  font-family: var(--font-sans); font-size: calc(13px * var(--font-scale)); font-weight: 400;
  padding: 8px 14px; border-radius: calc(var(--btn-radius) - 2px); cursor: pointer; transition: all 0.18s;
}
.btn-ghost:hover { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 6%, transparent); }

/* ── Cards ───────────────────────────────────────────────────── */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--card-radius); box-shadow: var(--card-shadow); }
.card-hover { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--card-radius); box-shadow: var(--card-shadow); transition: all 0.28s ease; cursor: pointer; }
.card-hover:hover { border-color: var(--color-accent); box-shadow: var(--card-shadow), 0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent); transform: translateY(-3px); }

/* ── Form ────────────────────────────────────────────────────── */
.input {
  width: 100%; padding: 11px 14px; background: var(--color-surface);
  color: var(--color-text); border: 1px solid var(--color-border);
  border-radius: calc(var(--radius) - 4px); font-family: var(--font-sans);
  font-size: calc(13px * var(--font-scale)); font-weight: 300; outline: none; transition: all 0.2s;
}
.input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 10%, transparent); }

/* ── Section ─────────────────────────────────────────────────── */
.section { padding: var(--section-pad) 0; }
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 48px; }
.section-alt  { background: var(--color-bg-alt); }
.section-dark { background: var(--color-bg-dark); }

/* ── Typography ──────────────────────────────────────────────── */
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-sans); font-size: calc(10px * var(--font-scale)); font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 18px;
}
.eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--color-accent); }
.section-title { font-family: var(--font-serif); font-weight: 700; color: var(--color-text); letter-spacing: -0.025em; line-height: 1.04; }
.section-title em { font-style: italic; color: var(--color-accent); }
.section-sub { font-family: var(--font-sans); font-size: calc(15px * var(--font-scale)); font-weight: 300; color: var(--color-text-muted); line-height: 1.75; }
.nav-link { font-family: var(--font-sans); font-size: calc(13px * var(--font-scale)); font-weight: 400; color: var(--color-text-muted); text-decoration: none; transition: color 0.18s; }
.nav-link:hover { color: var(--color-text); }
.stat-number { font-family: var(--font-serif); font-weight: 700; color: var(--color-accent); line-height: 1; }
.stat-label { font-family: var(--font-sans); font-size: calc(10px * var(--font-scale)); font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-faint); }
.badge-accent { display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:calc(10px * var(--font-scale));font-weight:600;padding:3px 9px;border-radius:100px;background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent);border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent); }
.badge-primary { display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:calc(10px * var(--font-scale));font-weight:600;padding:3px 9px;border-radius:100px;background:var(--color-primary);color:var(--color-bg); }
.badge-light { display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:calc(10px * var(--font-scale));font-weight:500;padding:3px 9px;border-radius:100px;background:color-mix(in srgb,var(--color-text) 6%,transparent);color:var(--color-text-muted);border:1px solid var(--color-border); }
.badge-green { display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:calc(10px * var(--font-scale));font-weight:600;padding:3px 9px;border-radius:100px;background:color-mix(in srgb,#22c55e 12%,transparent);color:#16a34a;border:1px solid color-mix(in srgb,#22c55e 25%,transparent); }
.tag { display:inline-flex;align-items:center;font-family:var(--font-sans);font-size:calc(11px * var(--font-scale));font-weight:400;color:var(--color-text-muted);padding:5px 12px;border-radius:100px;border:1px solid var(--color-border);background:var(--color-surface);cursor:pointer;transition:all .18s; }
.tag:hover { border-color:var(--color-accent);color:var(--color-accent); }
.gold-rule { width:40px;height:1px;background:var(--color-accent);margin:16px 0; }
.divider { width:100%;height:1px;background:var(--color-border); }
.skeleton { background:linear-gradient(90deg,var(--color-bg-alt) 25%,var(--color-bg-dark) 50%,var(--color-bg-alt) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:calc(var(--radius) - 4px); }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.65)} }
.animate-fade-up { animation:fadeUp .6s ease forwards; }
.animate-float { animation:float 5s ease-in-out infinite; }
.animate-pulse-dot { animation:pulseDot 2s ease-in-out infinite; }
.no-scrollbar::-webkit-scrollbar { display:none; }
.no-scrollbar { -ms-overflow-style:none;scrollbar-width:none; }
`
}

// ── Sub-components ─────────────────────────────────────────────
function ColourInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
      <span style={{ fontSize:'12px', color:'#4A5568', fontFamily:'Inter,sans-serif' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <input type="color" value={value.startsWith('rgba') || value.startsWith('rgb') ? '#888888' : value}
          onChange={e => onChange(e.target.value)}
          style={{ width:'28px', height:'28px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'6px', cursor:'pointer', padding:'2px' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:'120px', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'5px', padding:'4px 8px', fontSize:'11px', fontFamily:'monospace', background:'#F8F9FA' }} />
      </div>
    </div>
  )
}

function SliderInput({ label, value, min, max, step=1, unit='px', onChange }: { label:string;value:number;min:number;max:number;step?:number;unit?:string;onChange:(v:number)=>void }) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
        <span style={{ fontSize:'12px', color:'#4A5568', fontFamily:'Inter,sans-serif' }}>{label}</span>
        <span style={{ fontSize:'12px', fontWeight:500, color:'#0D1117', fontFamily:'Inter,sans-serif' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:'#B8860B' }} />
    </div>
  )
}

const TABS = [
  { id:'presets',    label:'Presets',    icon:Palette  },
  { id:'colours',   label:'Colours',    icon:Sliders  },
  { id:'type',      label:'Typography', icon:Type     },
  { id:'layout',    label:'Layout',     icon:Layout   },
  { id:'preview',   label:'Preview',    icon:Eye      },
]

// ── Main component ──────────────────────────────────────────────
export function ThemeControllerClient() {
  const [theme, setTheme]   = useState<ThemeConfig>(DEFAULT)
  const [tab, setTab]       = useState('presets')
  const [saved, setSaved]   = useState(false)
  const [cssOut, setCssOut] = useState('')

  // Generate CSS whenever theme changes
  useEffect(() => {
    setCssOut(generateCSS(theme))
  }, [theme])

  // Apply to page live for preview
  useEffect(() => {
    const el = document.getElementById('ts-theme-preview-style') || (() => {
      const s = document.createElement('style')
      s.id = 'ts-theme-preview-style'
      document.head.appendChild(s)
      return s
    })()
    // Only apply CSS vars to preview section
    const vars = `
      #theme-live-preview {
        --color-bg:${theme.colorBg};--color-bg-alt:${theme.colorBgAlt};
        --color-surface:${theme.colorSurface};--color-border:${theme.colorBorder};
        --color-primary:${theme.colorPrimary};--color-accent:${theme.colorAccent};
        --color-text:${theme.colorText};--color-text-muted:${theme.colorTextMuted};
        --color-text-faint:${theme.colorTextFaint};--radius:${theme.borderRadius}px;
        --btn-radius:${theme.btnRadius}px;--card-radius:${theme.cardRadius}px;
        background:${theme.colorBg};color:${theme.colorText};
      }
    `
    el.textContent = vars
  }, [theme])

  const set = useCallback(<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    setTheme(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const applyPreset = (key: string) => {
    const p = PRESETS[key]
    if (!p) return
    setTheme(prev => ({ ...prev, ...p, preset: key, fontScale: prev.fontScale }))
    setSaved(false)
  }

  const saveMutation = useMutation({
    mutationFn: () => apiPost('/admin/theme', { css: cssOut, config: theme }),
    onSuccess: () => { setSaved(true); toast.success('Theme saved! Changes applied site-wide.') },
    onError:   () => toast.error('Save failed. CSS copied to clipboard instead.'),
  })

  const handleSave = async () => {
    try { await navigator.clipboard.writeText(cssOut); toast.success('CSS copied! Paste into app/globals.css') } catch {}
    saveMutation.mutate()
  }

  const reset = () => { setTheme(DEFAULT); setSaved(false); toast('Reset to default theme') }
  const copyCSS = async () => { await navigator.clipboard.writeText(cssOut); toast.success('CSS copied to clipboard!') }

  // ── Render ──
  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FA', fontFamily:'Inter,sans-serif' }}>

      {/* Top bar */}
      <div style={{ background:'#0D1117', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'60px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <Link href="/dashboard/school" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize:'13px', textDecoration:'none' }}>
            <ArrowLeft style={{ width:'14px', height:'14px' }} /> Back
          </Link>
          <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.1)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Palette style={{ width:'16px', height:'16px', color:'#B8860B' }} />
            <span style={{ color:'#FAF7F2', fontWeight:600, fontSize:'15px' }}>Theme Controller</span>
            <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', fontWeight:400 }}>— changes affect the entire website</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {saved && <span style={{ fontSize:'12px', color:'#4ADE80', display:'flex', alignItems:'center', gap:'4px' }}><Check style={{ width:'13px', height:'13px' }} /> Saved</span>}
          <button onClick={copyCSS} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'8px 14px', color:'rgba(255,255,255,0.7)', fontSize:'12px', cursor:'pointer' }}>
            <Copy style={{ width:'13px', height:'13px' }} /> Copy CSS
          </button>
          <button onClick={reset} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'8px 14px', color:'rgba(255,255,255,0.7)', fontSize:'12px', cursor:'pointer' }}>
            <RotateCcw style={{ width:'13px', height:'13px' }} /> Reset
          </button>
          <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#B8860B', border:'none', borderRadius:'7px', padding:'8px 18px', color:'#FAF7F2', fontSize:'13px', fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(184,134,11,0.3)' }}>
            <Save style={{ width:'13px', height:'13px' }} /> Save & Apply
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', height:'calc(100vh - 60px)' }}>

        {/* ── Left panel ── */}
        <div style={{ background:'#fff', borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ flex:1, padding:'12px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', border:'none', cursor:'pointer', fontSize:'10px', fontWeight:500, letterSpacing:'.06em', textTransform:'uppercase', transition:'all .18s',
                    background: tab===t.id ? '#FDFAF0' : 'transparent',
                    color: tab===t.id ? '#B8860B' : '#9CA3AF',
                    borderBottom: tab===t.id ? '2px solid #B8860B' : '2px solid transparent',
                  }}>
                  <Icon style={{ width:'15px', height:'15px' }} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Panel content */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

            {/* ── PRESETS ── */}
            {tab === 'presets' && (
              <div>
                <p style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'16px', lineHeight:1.5 }}>
                  Choose a preset to set the entire colour palette, fonts, and spacing at once. You can fine-tune individual values afterwards.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button key={key} onClick={() => applyPreset(key)}
                      style={{ padding:'14px', borderRadius:'10px', border: theme.preset===key ? '2px solid #B8860B' : '1px solid #E5E7EB', background: theme.preset===key ? '#FDFAF0' : '#F9FAFB', cursor:'pointer', textAlign:'left', transition:'all .18s', position:'relative' }}>
                      {theme.preset===key && <Check style={{ position:'absolute', top:'8px', right:'8px', width:'13px', height:'13px', color:'#B8860B' }} />}
                      <div style={{ fontSize:'22px', marginBottom:'6px' }}>{p.emoji}</div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:'#0D1117', marginBottom:'4px' }}>{p.label}</div>
                      <div style={{ display:'flex', gap:'4px' }}>
                        {[p.colorBg, p.colorAccent, p.colorPrimary].map((c,i) => (
                          <div key={i} style={{ width:'16px', height:'16px', borderRadius:'50%', background: c, border:'1px solid rgba(0,0,0,0.1)' }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── COLOURS ── */}
            {tab === 'colours' && (
              <div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', marginBottom:'8px' }}>Backgrounds</div>
                  <ColourInput label="Main Background"    value={theme.colorBg}      onChange={v => set('colorBg', v)} />
                  <ColourInput label="Alt Background"     value={theme.colorBgAlt}   onChange={v => set('colorBgAlt', v)} />
                  <ColourInput label="Dark Background"    value={theme.colorBgDark}  onChange={v => set('colorBgDark', v)} />
                  <ColourInput label="Surface (cards)"    value={theme.colorSurface} onChange={v => set('colorSurface', v)} />
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', marginBottom:'8px' }}>Accent & Primary</div>
                  <ColourInput label="Accent Colour"      value={theme.colorAccent}       onChange={v => set('colorAccent', v)} />
                  <ColourInput label="Accent Hover"       value={theme.colorAccentHover}  onChange={v => set('colorAccentHover', v)} />
                  <ColourInput label="Primary (buttons)"  value={theme.colorPrimary}      onChange={v => set('colorPrimary', v)} />
                  <ColourInput label="Primary Hover"      value={theme.colorPrimaryHover} onChange={v => set('colorPrimaryHover', v)} />
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', marginBottom:'8px' }}>Text</div>
                  <ColourInput label="Text Primary"  value={theme.colorText}      onChange={v => set('colorText', v)} />
                  <ColourInput label="Text Muted"    value={theme.colorTextMuted} onChange={v => set('colorTextMuted', v)} />
                  <ColourInput label="Text Faint"    value={theme.colorTextFaint} onChange={v => set('colorTextFaint', v)} />
                </div>
              </div>
            )}

            {/* ── TYPOGRAPHY ── */}
            {tab === 'type' && (
              <div>
                <div style={{ marginBottom:'18px' }}>
                  <label style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:'8px' }}>Heading Font (Serif)</label>
                  {['Cormorant Garamond','Playfair Display','EB Garamond','Libre Baskerville','Lora'].map(f => (
                    <button key={f} onClick={() => set('fontSerif', f)}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 12px', marginBottom:'5px', borderRadius:'7px', border: theme.fontSerif===f ? '1px solid #B8860B' : '1px solid #E5E7EB', background: theme.fontSerif===f ? '#FDFAF0' : 'transparent', cursor:'pointer', fontSize:'14px', fontFamily:`'${f}', Georgia, serif`, color:'#0D1117', fontWeight:600 }}>
                      {f} <span style={{ opacity:.5, fontStyle:'italic', fontWeight:400 }}>— The Perfect School</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom:'18px' }}>
                  <label style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:'8px' }}>Body Font (Sans)</label>
                  {['Inter','DM Sans','Plus Jakarta Sans','Nunito','Outfit'].map(f => (
                    <button key={f} onClick={() => set('fontSans', f)}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 12px', marginBottom:'5px', borderRadius:'7px', border: theme.fontSans===f ? '1px solid #B8860B' : '1px solid #E5E7EB', background: theme.fontSans===f ? '#FDFAF0' : 'transparent', cursor:'pointer', fontSize:'13px', fontFamily:`'${f}', system-ui, sans-serif`, color:'#4A5568' }}>
                      {f} — Search 12,000+ verified schools
                    </button>
                  ))}
                </div>
                <SliderInput label="Font Scale" value={theme.fontScale} min={0.85} max={1.2} step={0.05} unit="×" onChange={v => set('fontScale', v)} />
              </div>
            )}

            {/* ── LAYOUT ── */}
            {tab === 'layout' && (
              <div>
                <SliderInput label="Page Max Width"    value={theme.maxWidth}     min={900}  max={1400} unit="px" onChange={v => set('maxWidth', v)} />
                <SliderInput label="Section Padding"   value={theme.sectionPad}   min={48}   max={128}  unit="px" onChange={v => set('sectionPad', v)} />
                <SliderInput label="Border Radius"     value={theme.borderRadius} min={0}    max={24}   unit="px" onChange={v => set('borderRadius', v)} />
                <SliderInput label="Button Radius"     value={theme.btnRadius}    min={0}    max={24}   unit="px" onChange={v => set('btnRadius', v)} />
                <SliderInput label="Card Radius"       value={theme.cardRadius}   min={0}    max={28}   unit="px" onChange={v => set('cardRadius', v)} />

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:'8px' }}>Button Style</label>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {(['filled','outline','soft'] as const).map(s => (
                      <button key={s} onClick={() => set('btnStyle', s)}
                        style={{ flex:1, padding:'8px', borderRadius:'7px', border: theme.btnStyle===s ? '1px solid #B8860B' : '1px solid #E5E7EB', background: theme.btnStyle===s ? '#FDFAF0' : 'transparent', cursor:'pointer', fontSize:'11px', fontWeight:600, color: theme.btnStyle===s ? '#B8860B' : '#6B7280', textTransform:'capitalize' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:'8px' }}>Card Shadow</label>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {(['none','soft','medium','strong'] as const).map(s => (
                      <button key={s} onClick={() => set('cardShadow', s)}
                        style={{ flex:1, padding:'8px', borderRadius:'7px', border: theme.cardShadow===s ? '1px solid #B8860B' : '1px solid #E5E7EB', background: theme.cardShadow===s ? '#FDFAF0' : 'transparent', cursor:'pointer', fontSize:'11px', fontWeight:600, color: theme.cardShadow===s ? '#B8860B' : '#6B7280', textTransform:'capitalize' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:'8px' }}>Navbar Style</label>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {(['light','dark','glass'] as const).map(s => (
                      <button key={s} onClick={() => set('navStyle', s)}
                        style={{ flex:1, padding:'8px', borderRadius:'7px', border: theme.navStyle===s ? '1px solid #B8860B' : '1px solid #E5E7EB', background: theme.navStyle===s ? '#FDFAF0' : 'transparent', cursor:'pointer', fontSize:'11px', fontWeight:600, color: theme.navStyle===s ? '#B8860B' : '#6B7280', textTransform:'capitalize' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PREVIEW TAB ── */}
            {tab === 'preview' && (
              <div>
                <p style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'12px', lineHeight:1.5 }}>
                  Generated CSS that will be written to <code style={{ background:'#F3F4F6', padding:'1px 5px', borderRadius:'4px', fontSize:'10px' }}>app/globals.css</code>. Click <strong>Save & Apply</strong> to apply site-wide.
                </p>
                <textarea readOnly value={cssOut}
                  style={{ width:'100%', height:'400px', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'12px', fontSize:'11px', fontFamily:'monospace', color:'#374151', background:'#F9FAFB', resize:'none', outline:'none', lineHeight:1.6 }} />
                <button onClick={copyCSS} style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'6px', background:'#0D1117', border:'none', borderRadius:'7px', padding:'9px 16px', color:'#FAF7F2', fontSize:'12px', fontWeight:500, cursor:'pointer', width:'100%', justifyContent:'center' }}>
                  <Copy style={{ width:'13px', height:'13px' }} /> Copy Full CSS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Live Preview ── */}
        <div style={{ overflowY:'auto', background:'#E5E7EB', padding:'24px' }}>
          <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>Live Preview</span>
            <span style={{ fontSize:'11px', color:'#9CA3AF' }}>— updates as you change settings</span>
          </div>

          <div id="theme-live-preview" style={{ background: theme.colorBg, borderRadius:'12px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>

            {/* Preview Nav */}
            <div style={{ padding:'16px 32px', background: theme.navStyle==='dark' ? theme.colorBgDark : theme.navStyle==='glass' ? `${theme.colorBg}CC` : theme.colorBg, borderBottom:`1px solid ${theme.colorBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:'17px', color: theme.colorText }}>
                Thynk<em style={{ fontStyle:'italic', color: theme.colorAccent }}>Schooling</em>
              </span>
              <div style={{ display:'flex', gap:'24px' }}>
                {['Find Schools','Compare','Counselling'].map(l => (
                  <span key={l} style={{ fontFamily:`'${theme.fontSans}',sans-serif`, fontSize:'12px', color: theme.colorTextMuted }}>{l}</span>
                ))}
              </div>
              <button style={{ background: theme.colorPrimary, color: theme.colorBg, border:'none', borderRadius:`${theme.btnRadius}px`, padding:'9px 20px', fontSize:'12px', fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:500, cursor:'pointer' }}>Get Started Free</button>
            </div>

            {/* Preview Hero */}
            <div style={{ padding:'48px 32px', background: `linear-gradient(160deg, ${theme.colorBg} 55%, ${theme.colorBgAlt} 100%)` }}>
              <div style={{ fontSize:'10px', letterSpacing:'.18em', textTransform:'uppercase', color: theme.colorAccent, fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:600, marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:'20px', height:'1px', background: theme.colorAccent }} /> AI-Powered School Matching
              </div>
              <h1 style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:`${Math.round(56 * theme.fontScale)}px`, lineHeight:.97, letterSpacing:'-2px', color: theme.colorText, marginBottom:'14px' }}>
                Find the<br />
                <em style={{ fontStyle:'italic', color: theme.colorAccent }}>Perfect School</em><br />
                <span style={{ fontSize:'.65em', fontWeight:400, color:`${theme.colorText}33` }}>for Your Child</span>
              </h1>
              <p style={{ fontFamily:`'${theme.fontSans}',sans-serif`, fontSize:`${Math.round(14 * theme.fontScale)}px`, color: theme.colorTextMuted, lineHeight:1.72, maxWidth:'380px', marginBottom:'24px', fontWeight:300 }}>
                Search, compare &amp; apply to <strong style={{ color: theme.colorText, fontWeight:500 }}>12,000+ verified schools</strong> across 35+ Indian cities.
              </p>
              <div style={{ display:'flex', gap:'10px' }}>
                <button style={{ background: theme.colorPrimary, color: theme.colorBg, border:'none', borderRadius:`${theme.btnRadius}px`, padding:'12px 24px', fontSize:'13px', fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:500, cursor:'pointer' }}>Get Started Free</button>
                <button style={{ background:'transparent', color: theme.colorAccent, border:`1px solid ${theme.colorAccent}`, borderRadius:`${theme.btnRadius}px`, padding:'11px 22px', fontSize:'13px', fontFamily:`'${theme.fontSans}',sans-serif`, cursor:'pointer' }}>Free Counselling →</button>
              </div>
            </div>

            {/* Preview Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', background: theme.colorBgAlt, borderTop:`1px solid ${theme.colorBorder}`, borderBottom:`1px solid ${theme.colorBorder}` }}>
              {[['12,000+','Schools'],['1 Lakh+','Parents'],['35+','Cities'],['98%','Satisfaction'],['4.8★','Rating']].map(([v,l],i) => (
                <div key={l} style={{ padding:'20px 0', textAlign:'center', borderRight: i<4 ? `1px solid ${theme.colorBorder}` : 'none' }}>
                  <div style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:`${Math.round(30 * theme.fontScale)}px`, color: theme.colorAccent, lineHeight:1, marginBottom:'4px' }}>{v}</div>
                  <div style={{ fontFamily:`'${theme.fontSans}',sans-serif`, fontSize:'10px', fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase', color: theme.colorTextFaint }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Preview Cards */}
            <div style={{ padding:'36px 32px', background: theme.colorBg }}>
              <div style={{ fontSize:'10px', letterSpacing:'.18em', textTransform:'uppercase', color: theme.colorAccent, fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:600, marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:'20px', height:'1px', background: theme.colorAccent }} /> Featured Schools
              </div>
              <h2 style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:`${Math.round(40 * theme.fontScale)}px`, color: theme.colorText, marginBottom:'24px' }}>
                Top Schools Across <em style={{ fontStyle:'italic', color: theme.colorAccent }}>India</em>
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                {[
                  { name:'DPS R.K. Puram',        city:'New Delhi',  price:'₹4,500', emoji:'🏛', board:'CBSE' },
                  { name:'The Cathedral School',   city:'Mumbai',     price:'₹6,200', emoji:'🌊', board:'ICSE' },
                  { name:'Intl School Bangalore',  city:'Bangalore',  price:'₹18,000',emoji:'🌿', board:'IB'   },
                  { name:'The Doon School',        city:'Dehradun',   price:'₹55,000',emoji:'🏔', board:'CBSE' },
                ].map(s => (
                  <div key={s.name} style={{ background: theme.colorSurface, border:`1px solid ${theme.colorBorder}`, borderRadius:`${theme.cardRadius}px`, overflow:'hidden', boxShadow: theme.cardShadow === 'none' ? 'none' : theme.cardShadow === 'soft' ? '0 1px 4px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0,0,0,0.1)' }}>
                    <div style={{ height:'80px', display:'flex', alignItems:'center', justifyContent:'center', background: theme.colorBgAlt, fontSize:'28px' }}>{s.emoji}</div>
                    <div style={{ padding:'12px' }}>
                      <div style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:`${Math.round(13 * theme.fontScale)}px`, color: theme.colorText, marginBottom:'3px' }}>{s.name}</div>
                      <div style={{ fontFamily:`'${theme.fontSans}',sans-serif`, fontSize:'11px', color: theme.colorTextFaint, marginBottom:'8px' }}>📍 {s.city}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'100px', background:`${theme.colorAccent}18`, color: theme.colorAccent, border:`1px solid ${theme.colorAccent}33` }}>{s.board}</span>
                        <span style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:'13px', color: theme.colorAccent }}>{s.price}<span style={{ fontSize:'10px', color: theme.colorTextFaint, fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:300 }}>/mo</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview CTA */}
            <div style={{ padding:'40px 32px', background: theme.colorBgDark }}>
              <div style={{ background: theme.navStyle==='dark' ? 'rgba(0,0,0,0.3)' : '#0D1117', borderRadius:`${theme.cardRadius}px`, padding:'32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'24px', border:`1px solid ${theme.colorAccent}33` }}>
                <div>
                  <div style={{ fontSize:'10px', letterSpacing:'.16em', textTransform:'uppercase', color: theme.colorAccent, fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:600, marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'16px', height:'1px', background: theme.colorAccent }} /> 100% Free
                  </div>
                  <h3 style={{ fontFamily:`'${theme.fontSerif}',serif`, fontWeight:700, fontSize:`${Math.round(32 * theme.fontScale)}px`, color:'#FAF7F2', marginBottom:'8px' }}>
                    Talk to an Expert<br /><em style={{ fontStyle:'italic', color: theme.colorAccent }}>Education Counsellor</em>
                  </h3>
                  <p style={{ fontFamily:`'${theme.fontSans}',sans-serif`, fontSize:'13px', color:'rgba(250,247,242,0.55)', fontWeight:300 }}>Our experts help 500+ families every month. Completely free.</p>
                </div>
                <button style={{ background: theme.colorAccent, color: '#0D1117', border:'none', borderRadius:`${theme.btnRadius}px`, padding:'14px 24px', fontSize:'13px', fontFamily:`'${theme.fontSans}',sans-serif`, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Book Free Session</button>
              </div>
            </div>

          </div>

          {/* How to use note */}
          <div style={{ marginTop:'20px', background:'#fff', borderRadius:'10px', padding:'16px 20px', border:'1px solid #E5E7EB' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>How to apply to your live site</div>
            <ol style={{ fontSize:'12px', color:'#6B7280', lineHeight:1.8, paddingLeft:'16px' }}>
              <li>Click <strong style={{ color:'#0D1117' }}>Save & Apply</strong> — this saves via API OR copies CSS to clipboard</li>
              <li>If copied: paste into <code style={{ background:'#F3F4F6', padding:'1px 5px', borderRadius:'4px' }}>app/globals.css</code>, replacing everything after <code style={{ background:'#F3F4F6', padding:'1px 5px', borderRadius:'4px' }}>@tailwind utilities</code></li>
              <li>Push to GitHub → Vercel auto-deploys → changes live site-wide in ~60 seconds</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
