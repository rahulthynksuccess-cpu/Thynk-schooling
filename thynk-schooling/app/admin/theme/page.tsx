'use client'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Copy, RotateCcw, Check, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESETS = {
  'Ivory & Gold':     { bg: '#FAF7F2', bgAlt: '#F5F0E8', bgDark: '#EDE5D8', surface: '#FFFFFF', border: 'rgba(13,17,23,0.09)', accent: '#B8860B', accentHover: '#C9960D', primary: '#0D1117', primaryHover: '#1C2333', text: '#0D1117', textMuted: '#4A5568', textFaint: '#A0ADB8', fontSerif: 'Cormorant Garamond', fontSans: 'Inter', radius: 12, btnRadius: 6, sectionPad: 96 },
  'Black & Rose Gold':{ bg: '#050505', bgAlt: '#0D0D0D', bgDark: '#111111', surface: '#1A1A1A', border: 'rgba(255,255,255,0.07)', accent: '#C9A96E', accentHover: '#D4B87A', primary: '#F5F5F5', primaryHover: '#FFFFFF', text: '#F5F5F5', textMuted: 'rgba(245,245,245,0.55)', textFaint: 'rgba(245,245,245,0.28)', fontSerif: 'Playfair Display', fontSans: 'Inter', radius: 14, btnRadius: 8, sectionPad: 100 },
  'Sand & Burgundy':  { bg: '#F5EFE6', bgAlt: '#EDE0CC', bgDark: '#E2CEB0', surface: '#FFF8F0', border: 'rgba(26,10,0,0.09)', accent: '#8B2500', accentHover: '#A63000', primary: '#8B2500', primaryHover: '#A63000', text: '#1A0A00', textMuted: '#6B4B3A', textFaint: '#B09080', fontSerif: 'Playfair Display', fontSans: 'Inter', radius: 10, btnRadius: 5, sectionPad: 96 },
  'Forest & Gold':    { bg: '#071A0F', bgAlt: '#0F2918', bgDark: '#163820', surface: '#0F2919', border: 'rgba(212,175,55,0.15)', accent: '#D4AF37', accentHover: '#E0C55A', primary: '#D4AF37', primaryHover: '#E0C55A', text: '#F0EDD8', textMuted: 'rgba(240,237,216,0.55)', textFaint: 'rgba(240,237,216,0.3)', fontSerif: 'Cormorant Garamond', fontSans: 'DM Sans', radius: 16, btnRadius: 10, sectionPad: 96 },
  'Clean White':      { bg: '#FFFFFF', bgAlt: '#F8F9FA', bgDark: '#F1F3F5', surface: '#FFFFFF', border: 'rgba(0,0,0,0.08)', accent: '#2563EB', accentHover: '#1D4ED8', primary: '#111827', primaryHover: '#1F2937', text: '#111827', textMuted: '#6B7280', textFaint: '#9CA3AF', fontSerif: 'Inter', fontSans: 'Inter', radius: 10, btnRadius: 8, sectionPad: 88 },
  'Royal Purple':     { bg: '#0D0618', bgAlt: '#130924', bgDark: '#1A0D30', surface: '#1A0D30', border: 'rgba(167,139,250,0.15)', accent: '#F59E0B', accentHover: '#FCD34D', primary: '#A78BFA', primaryHover: '#C4B5FD', text: '#F5F3FF', textMuted: 'rgba(245,243,255,0.55)', textFaint: 'rgba(245,243,255,0.28)', fontSerif: 'Playfair Display', fontSans: 'Inter', radius: 16, btnRadius: 10, sectionPad: 96 },
}

type Preset = typeof PRESETS['Ivory & Gold']

function generateCSS(t: Preset): string {
  return `/* ═══════════════════════════════════════════════════
   THYNK SCHOOLING — GENERATED THEME
   Generated: ${new Date().toLocaleString('en-IN')}
   Admin: /admin/theme — do not edit manually
═══════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=${t.fontSerif.replace(/ /g,'+')}:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=${t.fontSans.replace(/ /g,'+')}:wght@300;400;500;600&display=swap');

:root {
  --color-bg:            ${t.bg};
  --color-bg-alt:        ${t.bgAlt};
  --color-bg-dark:       ${t.bgDark};
  --color-surface:       ${t.surface};
  --color-border:        ${t.border};
  --color-accent:        ${t.accent};
  --color-accent-hover:  ${t.accentHover};
  --color-primary:       ${t.primary};
  --color-primary-hover: ${t.primaryHover};
  --color-text:          ${t.text};
  --color-text-muted:    ${t.textMuted};
  --color-text-faint:    ${t.textFaint};
  --font-serif:          '${t.fontSerif}', Georgia, serif;
  --font-sans:           '${t.fontSans}', system-ui, sans-serif;
  --radius:              ${t.radius}px;
  --btn-radius:          ${t.btnRadius}px;
  --section-pad:         ${t.sectionPad}px;
}

body { background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
h1,h2,h3,h4 { font-family: var(--font-serif); font-weight: 700; }
.section { padding: var(--section-pad) 0; }
.section-alt { background: var(--color-bg-alt); }
.section-dark { background: var(--color-bg-dark); }
.card,.card-hover { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
.card-hover:hover { border-color: var(--color-accent); transform: translateY(-3px); }
.btn-primary { background: var(--color-primary); color: var(--color-bg); border: none; border-radius: var(--btn-radius); padding: 12px 26px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-accent { background: var(--color-accent); color: var(--color-bg); border: none; border-radius: var(--btn-radius); padding: 12px 26px; font-weight: 600; cursor: pointer; }
.btn-accent:hover { background: var(--color-accent-hover); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--btn-radius); padding: 11px 24px; cursor: pointer; }
.btn-outline:hover { border-color: var(--color-accent); color: var(--color-accent); }
.eyebrow { display:inline-flex;align-items:center;gap:10px;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--color-accent);margin-bottom:18px; }
.eyebrow::before { content:'';width:24px;height:1px;background:var(--color-accent); }
.section-title { font-family:var(--font-serif);font-weight:700;color:var(--color-text);letter-spacing:-0.025em;line-height:1.04; }
.section-title em { font-style:italic;color:var(--color-accent); }
.section-sub { font-size:15px;font-weight:300;color:var(--color-text-muted);line-height:1.75; }
.stat-number { font-family:var(--font-serif);font-weight:700;color:var(--color-accent); }
.stat-label { font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--color-text-faint); }
.badge-accent { font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent); }
.tag { font-size:11px;color:var(--color-text-muted);padding:5px 12px;border-radius:100px;border:1px solid var(--color-border);cursor:pointer;transition:all .18s; }
.tag:hover { border-color:var(--color-accent);color:var(--color-accent); }
`
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', marginBottom: '6px', fontFamily: 'DM Sans, sans-serif' }
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', borderRadius: '7px', color: '#fff', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }

export default function AdminThemePage() {
  const [activePreset, setActivePreset] = useState('Ivory & Gold')
  const [theme, setTheme]               = useState<Preset>(PRESETS['Ivory & Gold'])
  const [css, setCss]                   = useState('')
  const [copied, setCopied]             = useState(false)

  useEffect(() => { setCss(generateCSS(theme)) }, [theme])

  const applyPreset = (name: string) => {
    setActivePreset(name)
    setTheme({ ...PRESETS[name as keyof typeof PRESETS] })
  }

  const set = <K extends keyof Preset>(k: K, v: Preset[K]) => setTheme(p => ({ ...p, [k]: v }))

  const copyCss = async () => {
    await navigator.clipboard.writeText(css)
    setCopied(true)
    toast.success('CSS copied! Paste into app/globals.css → push to GitHub → site updates in 60s')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <AdminLayout title="Theme Controller" subtitle="Change colours, fonts & spacing — affects the entire website">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', height: 'calc(100vh - 120px)' }}>

        {/* ── Left controls ── */}
        <div style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Presets */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1E2A52' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', marginBottom: '10px', fontFamily: 'DM Sans, sans-serif' }}>Presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              {Object.entries(PRESETS).map(([name, p]) => (
                <button key={name} onClick={() => applyPreset(name)}
                  style={{ padding: '10px', borderRadius: '9px', border: activePreset === name ? '1px solid #FF5C00' : '1px solid #1E2A52', background: activePreset === name ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {[p.bg, p.accent, p.primary].map((c, i) => (
                      <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                    {activePreset === name && <Check style={{ width: '12px', height: '12px', color: '#FF5C00', marginLeft: 'auto' }} />}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>{name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Colours */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1E2A52' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', marginBottom: '10px', fontFamily: 'DM Sans, sans-serif' }}>Colours</div>
            {[
              { label: 'Background',    key: 'bg'           },
              { label: 'Alt Background', key: 'bgAlt'       },
              { label: 'Surface',        key: 'surface'     },
              { label: 'Accent',         key: 'accent'      },
              { label: 'Primary',        key: 'primary'     },
              { label: 'Text',           key: 'text'        },
              { label: 'Text Muted',     key: 'textMuted'   },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <input type="color"
                    value={(theme[key as keyof Preset] as string).startsWith('rgba') ? '#888888' : theme[key as keyof Preset] as string}
                    onChange={e => set(key as keyof Preset, e.target.value as any)}
                    style={{ width: '26px', height: '26px', border: '1px solid #1E2A52', borderRadius: '5px', cursor: 'pointer', padding: '2px', background: 'none' }} />
                  <input type="text" value={theme[key as keyof Preset] as string}
                    onChange={e => set(key as keyof Preset, e.target.value as any)}
                    style={{ ...inp, width: '110px', fontSize: '11px', fontFamily: 'monospace', padding: '4px 8px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Typography */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1E2A52' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', marginBottom: '10px', fontFamily: 'DM Sans, sans-serif' }}>Typography</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Heading Font</label>
              <select value={theme.fontSerif} onChange={e => set('fontSerif', e.target.value)}
                style={{ ...inp }}>
                {['Cormorant Garamond', 'Playfair Display', 'EB Garamond', 'Lora', 'Inter'].map(f => (
                  <option key={f} value={f} style={{ background: '#111830' }}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Body Font</label>
              <select value={theme.fontSans} onChange={e => set('fontSans', e.target.value)}
                style={{ ...inp }}>
                {['Inter', 'DM Sans', 'Plus Jakarta Sans', 'Nunito', 'Outfit'].map(f => (
                  <option key={f} value={f} style={{ background: '#111830' }}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Layout */}
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', marginBottom: '12px', fontFamily: 'DM Sans, sans-serif' }}>Layout & Spacing</div>
            {[
              { label: 'Border Radius', key: 'radius',     min: 0, max: 28 },
              { label: 'Button Radius', key: 'btnRadius',  min: 0, max: 24 },
              { label: 'Section Pad',   key: 'sectionPad', min: 48, max: 128 },
            ].map(({ label, key, min, max }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>{theme[key as keyof Preset]}px</span>
                </div>
                <input type="range" min={min} max={max} value={theme[key as keyof Preset] as number}
                  onChange={e => set(key as keyof Preset, Number(e.target.value) as any)}
                  style={{ width: '100%', accentColor: '#FF5C00' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Preview + CSS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* Live Preview */}
          <div style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2A52', fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', fontFamily: 'DM Sans, sans-serif' }}>Live Preview</div>
            <div style={{ padding: '24px', background: theme.bg }}>

              {/* Nav preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontFamily: `'${theme.fontSerif}', serif`, fontWeight: 700, fontSize: '18px', color: theme.text }}>
                  Thynk<em style={{ fontStyle: 'italic', color: theme.accent }}>Schooling</em>
                </span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {['Find Schools', 'Compare', 'Counselling'].map(l => (
                    <span key={l} style={{ fontFamily: `'${theme.fontSans}', sans-serif`, fontSize: '12px', color: theme.textMuted }}>{l}</span>
                  ))}
                </div>
                <button style={{ background: theme.primary, color: theme.bg, border: 'none', borderRadius: `${theme.btnRadius}px`, padding: '9px 20px', fontSize: '12px', fontFamily: `'${theme.fontSans}', sans-serif`, fontWeight: 500, cursor: 'pointer' }}>
                  Get Started
                </button>
              </div>

              {/* Hero preview */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: theme.accent, fontFamily: `'${theme.fontSans}', sans-serif`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ width: '20px', height: '1px', background: theme.accent }} /> AI-Powered
                </div>
                <div style={{ fontFamily: `'${theme.fontSerif}', serif`, fontWeight: 700, fontSize: '52px', lineHeight: .97, letterSpacing: '-2px', color: theme.text, marginBottom: '14px' }}>
                  Find the<br />
                  <em style={{ fontStyle: 'italic', color: theme.accent }}>Perfect School</em><br />
                  <span style={{ fontSize: '.62em', color: theme.textFaint, fontWeight: 400 }}>for Your Child</span>
                </div>
                <p style={{ fontFamily: `'${theme.fontSans}', sans-serif`, fontSize: '14px', color: theme.textMuted, maxWidth: '380px', lineHeight: 1.7, marginBottom: '20px', fontWeight: 300 }}>
                  Search & apply to <strong style={{ color: theme.text, fontWeight: 500 }}>12,000+ verified schools</strong> across 35+ cities.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ background: theme.primary, color: theme.bg, border: 'none', borderRadius: `${theme.btnRadius}px`, padding: '11px 22px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: `'${theme.fontSans}', sans-serif` }}>
                    Get Started Free
                  </button>
                  <button style={{ background: 'transparent', color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: `${theme.btnRadius}px`, padding: '10px 22px', fontSize: '13px', cursor: 'pointer', fontFamily: `'${theme.fontSans}', sans-serif` }}>
                    Free Counselling →
                  </button>
                </div>
              </div>

              {/* Stats preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: theme.bgAlt, border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}px`, marginBottom: '24px' }}>
                {[['12K+','Schools'],['1L+','Parents'],['35+','Cities'],['98%','Satisfaction'],['4.8★','Rating']].map(([v,l],i) => (
                  <div key={l} style={{ padding: '16px 0', textAlign: 'center', borderRight: i < 4 ? `1px solid ${theme.border}` : 'none' }}>
                    <div style={{ fontFamily: `'${theme.fontSerif}', serif`, fontWeight: 700, fontSize: '26px', color: theme.accent, lineHeight: 1, marginBottom: '3px' }}>{v}</div>
                    <div style={{ fontSize: '10px', color: theme.textFaint, fontFamily: `'${theme.fontSans}', sans-serif`, textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Cards preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                {[['🏛','DPS R.K. Puram','Delhi','CBSE','₹4,500'],['🌊','Cathedral School','Mumbai','ICSE','₹6,200'],['🌿','Intl Bangalore','Bangalore','IB','₹18,000'],['🏔','The Doon School','Dehradun','CBSE','₹55,000']].map(([e,n,c,b,p]) => (
                  <div key={n} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}px`, overflow: 'hidden' }}>
                    <div style={{ height: '70px', background: theme.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{e}</div>
                    <div style={{ padding: '10px' }}>
                      <div style={{ fontFamily: `'${theme.fontSerif}', serif`, fontWeight: 700, fontSize: '12px', color: theme.text, marginBottom: '3px' }}>{n}</div>
                      <div style={{ fontSize: '10px', color: theme.textFaint, marginBottom: '7px' }}>📍 {c}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '100px', background: `${theme.accent}18`, color: theme.accent }}>{b}</span>
                        <span style={{ fontFamily: `'${theme.fontSerif}', serif`, fontWeight: 700, fontSize: '12px', color: theme.accent }}>{p}<span style={{ fontSize: '9px', color: theme.textFaint, fontFamily: `'${theme.fontSans}', sans-serif`, fontWeight: 300 }}>/mo</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generated CSS */}
          <div style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1E2A52' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8892B0', fontFamily: 'DM Sans, sans-serif' }}>Generated CSS</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setTheme(PRESETS['Ivory & Gold'])}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', color: '#8892B0', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  <RotateCcw style={{ width: '12px', height: '12px' }} /> Reset
                </button>
                <button onClick={copyCss}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '7px', background: copied ? '#4ADE80' : '#FF5C00', border: 'none', color: copied ? '#0A0F2E' : '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {copied ? <><Check style={{ width: '12px', height: '12px' }} /> Copied!</> : <><Copy style={{ width: '12px', height: '12px' }} /> Copy CSS</>}
                </button>
              </div>
            </div>
            <textarea readOnly value={css}
              style={{ width: '100%', height: '280px', padding: '14px 16px', background: '#0A0F2E', border: 'none', color: '#8892B0', fontSize: '11px', fontFamily: 'monospace', resize: 'none', outline: 'none', lineHeight: 1.6 }} />
            <div style={{ padding: '12px 16px', background: 'rgba(255,92,0,0.06)', borderTop: '1px solid rgba(255,92,0,0.2)' }}>
              <div style={{ fontSize: '12px', color: '#FF7A2E', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, marginBottom: '4px' }}>How to apply</div>
              <div style={{ fontSize: '12px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                1. Click <strong style={{ color: '#fff' }}>Copy CSS</strong> &nbsp;→&nbsp; 2. Open <code style={{ background: '#1E2A52', padding: '1px 6px', borderRadius: '4px' }}>app/globals.css</code> &nbsp;→&nbsp; 3. Replace everything after <code style={{ background: '#1E2A52', padding: '1px 6px', borderRadius: '4px' }}>@tailwind utilities</code> &nbsp;→&nbsp; 4. Push to GitHub → Vercel deploys → <strong style={{ color: '#4ADE80' }}>done in 60s ✓</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
