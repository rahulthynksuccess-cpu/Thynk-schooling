'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2, Globe, Eye, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── Default theme (Ivory & Gold) ─── */
const DEFAULT: Record<string, any> = {
  /* Global colours */
  ivory:       '#FAF7F2', ivory2: '#F5F0E8', ivory3: '#EDE5D8',
  ink:         '#0D1117', ink2:   '#1C2333', inkMuted: '#4A5568', inkFaint: '#A0ADB8',
  gold:        '#B8860B', gold2:  '#C9960D', goldLight: '#E8C547', goldWash: '#FEF7E0',
  surface:     '#FFFFFF', border: 'rgba(13,17,23,0.09)',
  /* Fonts */
  fontSerif: 'Cormorant Garamond', fontSans: 'Inter',
  /* Admin panel */
  adminBg:         '#0A0F1A',
  adminText:       'rgba(255,255,255,0.9)',
  adminTextMuted:  'rgba(255,255,255,0.45)',
  adminTextFaint:  'rgba(255,255,255,0.25)',
  adminSidebarBg:  '#0D1117',
  adminSidebarBg:  '#0D1117',
  adminHeaderBg:   '#0D1117',
  adminCardBg:     '#111820',
  adminBorder:     '#1E2A3A',
  adminAccent:     '#B8860B',
  adminText:       'rgba(255,255,255,0.9)',
  adminTextMuted:  'rgba(255,255,255,0.45)',
  adminTextFaint:  'rgba(255,255,255,0.25)',
  /* Global radius */
  radius: 12, btnRadius: 6,
  /* Container width */
  containerWidth: 1600,
  /* Global typography */
  sizeBase: 16, sizeH1: 96, sizeH2: 60, sizeH3: 36, sizeH4: 22, sizeSmall: 13,
  weightBody: 300, weightHeading: 700, lineHeight: 160,
  /* Navbar */
  navBg: 'rgba(250,247,242,0.95)', navSize: 13, navColor: '#4A5568', navWeight: 400,
  navLogoColor: '#0D1117', navAccentColor: '#B8860B',
  /* Hero */
  heroBg: '#FAF7F2', heroBgGrad: '#F0EAD6',
  heroH1Size: 96, heroH1Color: '#0D1117', heroItalicColor: '#B8860B',
  heroSubSize: 17, heroSubColor: '#4A5568', heroSubWeight: 300,
  heroEyebrowColor: '#B8860B', heroEyebrowSize: 10,
  /* Stats bar */
  statsBg: '#F5F0E8', statNumSize: 38, statNumColor: '#0D1117',
  statLabelSize: 12, statLabelColor: '#718096',
  /* Featured schools */
  schoolCardBg: '#FFFFFF', schoolCardBorder: 'rgba(13,17,23,0.08)',
  schoolNameSize: 17, schoolNameColor: '#0D1117',
  schoolMetaSize: 12, schoolMetaColor: '#718096',
  /* Why Choose Us */
  whyBg: '#F5F0E8', whyTitleSize: 56, whyTitleColor: '#0D1117',
  whyCardBg: '#FFFFFF', whyCardTitleSize: 16, whyCardTitleColor: '#0D1117',
  whyCardDescSize: 13, whyCardDescColor: '#4A5568',
  /* How It Works */
  howBg: '#FAF7F2', howTitleSize: 56, howTitleColor: '#0D1117',
  howStepTitleSize: 17, howStepTitleColor: '#0D1117',
  howStepDescSize: 13, howStepDescColor: '#4A5568',
  /* Schools listing page */
  schoolsPageBg: '#FAF7F2', schoolsCardBg: '#FFFFFF',
  schoolsNameSize: 18, schoolsNameColor: '#0D1117',
  schoolsMetaSize: 13, schoolsMetaColor: '#718096',
  /* School profile page */
  profilePageBg: '#FAF7F2', profileNameSize: 40, profileNameColor: '#0D1117',
  profileMetaSize: 14, profileMetaColor: '#718096',
  profileTabSize: 13, profileTabColor: '#4A5568',
  /* Counselling page */
  counsellingBg: '#FAF7F2', counsellingH1Size: 48, counsellingH1Color: '#0D1117',
  counsellingSubSize: 16, counsellingSubColor: '#4A5568',
  /* Compare page */
  compareBg: '#FAF7F2', compareH1Size: 40, compareH1Color: '#0D1117',
  /* Pricing page */
  pricingBg: '#FAF7F2', pricingH1Size: 48, pricingH1Color: '#0D1117',
  pricingCardBg: '#FFFFFF', pricingCardBorder: 'rgba(13,17,23,0.09)',
  /* Blog page */
  blogBg: '#FAF7F2', blogTitleSize: 20, blogTitleColor: '#0D1117',
  blogExcerptSize: 13, blogExcerptColor: '#4A5568',
  /* Login / Register */
  loginBg: '#FAF7F2', loginCardBg: '#FFFFFF',
  loginH1Size: 28, loginH1Color: '#0D1117',
  loginInputBg: '#FFFFFF', loginInputBorder: 'rgba(13,17,23,0.12)',
  /* Dashboard */
  dashboardBg: '#FAF7F2', dashboardCardBg: '#FFFFFF',
  dashboardHeadingSize: 26, dashboardHeadingColor: '#0D1117',
  /* Footer */
  footerBg: '#0D1117', footerTextColor: 'rgba(250,247,242,0.4)',
  footerLinkHover: '#B8860B', footerTextSize: 13,
  footerHeadingColor: 'rgba(250,247,242,0.55)', footerHeadingSize: 11,
  /* CTA / Buttons */
  btnPrimaryBg: '#0D1117', btnPrimaryColor: '#FAF7F2',
  btnGoldBg: '#B8860B', btnGoldColor: '#FFFFFF',
  btnSize: 13, btnRadius2: 6,
}

const PRESETS: Record<string, Record<string, any>> = {
  'Ivory & Gold (Default)': { ...DEFAULT },
  'Dark & Luxe': {
    ...DEFAULT,
    ivory:'#050505', ivory2:'#0D0D0D', ivory3:'#111111', surface:'#1A1A1A',
    ink:'#F5F5F5', ink2:'#E0E0E0', inkMuted:'rgba(245,245,245,0.55)', inkFaint:'rgba(245,245,245,0.28)',
    gold:'#C9A96E', gold2:'#D4B87A', goldLight:'#E8CC8A', goldWash:'rgba(201,169,110,0.1)',
    border:'rgba(255,255,255,0.07)',
    heroBg:'#050505', heroBgGrad:'#0D0D0D', heroH1Color:'#F5F5F5', heroSubColor:'rgba(245,245,245,0.55)',
    statsBg:'#0D0D0D', statNumColor:'#F5F5F5', statLabelColor:'rgba(245,245,245,0.4)',
    whyBg:'#0D0D0D', whyCardBg:'#1A1A1A', whyTitleColor:'#F5F5F5', whyCardTitleColor:'#F5F5F5', whyCardDescColor:'rgba(245,245,245,0.55)',
    howBg:'#050505', howTitleColor:'#F5F5F5', howStepTitleColor:'#F5F5F5', howStepDescColor:'rgba(245,245,245,0.55)',
    schoolCardBg:'#1A1A1A', schoolNameColor:'#F5F5F5', schoolMetaColor:'rgba(245,245,245,0.4)',
    schoolsPageBg:'#050505', schoolsCardBg:'#1A1A1A', schoolsNameColor:'#F5F5F5', schoolsMetaColor:'rgba(245,245,245,0.4)',
    navBg:'rgba(5,5,5,0.95)', navColor:'rgba(245,245,245,0.55)', navLogoColor:'#F5F5F5',
    loginBg:'#050505', loginCardBg:'#1A1A1A', loginH1Color:'#F5F5F5', loginInputBg:'#111111', loginInputBorder:'rgba(255,255,255,0.08)',
    footerBg:'#000000',
    btnPrimaryBg:'#F5F5F5', btnPrimaryColor:'#050505',
  },
  'Clean White': {
    ...DEFAULT,
    ivory:'#FFFFFF', ivory2:'#F8F9FA', ivory3:'#F1F3F5',
    gold:'#2563EB', gold2:'#1D4ED8', goldLight:'#60A5FA', goldWash:'#EFF6FF',
    heroBg:'#FFFFFF', heroBgGrad:'#F8F9FA', heroItalicColor:'#2563EB', heroEyebrowColor:'#2563EB',
    statsBg:'#F8F9FA',
    whyBg:'#F8F9FA', whyCardBg:'#FFFFFF',
    howBg:'#FFFFFF',
    navBg:'rgba(255,255,255,0.95)', navColor:'#6B7280',
    footerBg:'#111827',
    btnPrimaryBg:'#111827', btnGoldBg:'#2563EB',
  },
}

/* ─── Pages tree ─── */
const PAGES = [
  { label:'🌐 Global',               url: '/',                    sections:[
    { key:'colours',         label:'Colour Palette'     },
    { key:'typography',      label:'Typography & Width' },
    { key:'fonts',           label:'Fonts & Buttons'    },
  ]},
  { label:'🏠 Homepage',             url: '/',                    sections:[
    { key:'navbar',          label:'Navbar'             },
    { key:'hero',            label:'Hero Section'       },
    { key:'stats',           label:'Stats Bar'          },
    { key:'featured',        label:'Featured Schools'   },
    { key:'why',             label:'Why Choose Us'      },
    { key:'how',             label:'How It Works'       },
    { key:'cities',          label:'Cities Section'     },
    { key:'counsel-cta',     label:'Counselling CTA'    },
    { key:'for-schools',     label:'For Schools CTA'    },
    { key:'testimonials',    label:'Testimonials'       },
    { key:'footer',          label:'Footer'             },
  ]},
  { label:'🏫 Schools Page',         url: '/schools',             sections:[
    { key:'schools-list',    label:'School Listing'     },
    { key:'school-profile',  label:'School Profile'     },
  ]},
  { label:'🔐 Login / Register',     url: '/login',               sections:[
    { key:'login',           label:'Login & Register'   },
  ]},
  { label:'👨‍👩‍👧 Parent Dashboard',    url: '/dashboard/parent',    sections:[
    { key:'parent-dash',     label:'Parent Dashboard'   },
  ]},
  { label:'🏫 School Dashboard',     url: '/dashboard/school',    sections:[
    { key:'school-dash',     label:'School Dashboard'   },
  ]},
  { label:'🔍 Counselling',          url: '/counselling',         sections:[
    { key:'counselling',     label:'Counselling Page'   },
  ]},
  { label:'⇌ Compare',              url: '/compare',             sections:[
    { key:'compare',         label:'Compare Page'       },
  ]},
  { label:'💰 Pricing',              url: '/pricing',             sections:[
    { key:'pricing',         label:'Pricing Page'       },
  ]},
  { label:'📝 Blog',                 url: '/blog',                sections:[
    { key:'blog',            label:'Blog Page'          },
  ]},
  { label:'ℹ️ About Page',           url: '/about',               sections:[
    { key:'about',           label:'About Page'         },
  ]},
  { label:'📍 Cities Page',          url: '/cities',              sections:[
    { key:'cities-page',     label:'Cities Page'        },
  ]},
  { label:'🔒 Privacy / Terms',      url: '/privacy',             sections:[
    { key:'legal',           label:'Legal Pages'        },
  ]},
  { label:'📞 Contact / Careers',    url: '/contact',             sections:[
    { key:'contact-page',    label:'Contact & Careers'  },
  ]},
  { label:'⚙️ Admin — Overview',     url: '/admin',               sections:[
    { key:'admin-overview',  label:'Overview Dashboard'  },
    { key:'admin-style',     label:'Sidebar & Cards'    },
  ]},
  { label:'📊 Admin — Analytics',    url: '/admin/analytics',     sections:[
    { key:'admin-analytics', label:'Analytics Page'     },
  ]},
  { label:'🏫 Admin — Schools',      url: '/admin/schools',       sections:[
    { key:'admin-schools',   label:'Schools Manager'    },
  ]},
  { label:'👥 Admin — Users',        url: '/admin/users',         sections:[
    { key:'admin-users',     label:'Users Manager'      },
  ]},
  { label:'📋 Admin — Applications', url: '/admin/applications',  sections:[
    { key:'admin-apps',      label:'Applications'       },
  ]},
  { label:'📈 Admin — Leads',        url: '/admin/leads',         sections:[
    { key:'admin-leads',     label:'Leads Manager'      },
  ]},
  { label:'💳 Admin — Payments',     url: '/admin/payments',      sections:[
    { key:'admin-payments',  label:'Payments'           },
  ]},
  { label:'⭐ Admin — Reviews',      url: '/admin/reviews',       sections:[
    { key:'admin-reviews',   label:'Reviews'            },
  ]},
  { label:'📦 Admin — Packages',     url: '/admin/packages',      sections:[
    { key:'admin-packages',  label:'Lead Packages'      },
  ]},
]

/* ─── Helpers ─── */
const inp: React.CSSProperties = { width:'100%', padding:'8px 11px', border:'1.5px solid rgba(13,17,23,0.12)', borderRadius:'7px', fontSize:'12px', fontFamily:'Inter,sans-serif', color:'#0D1117', outline:'none', background:'#fff', boxSizing:'border-box' as const }
const lbl: React.CSSProperties = { fontSize:'10px', fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase' as const, color:'#718096', fontFamily:'Inter,sans-serif', marginBottom:'6px', display:'block' }

function CP({ label, k, t, onChange }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(13,17,23,0.05)' }}>
      <span style={{ fontSize:'12px', color:'#0D1117', fontFamily:'Inter,sans-serif' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <input type="color" value={String(t[k]||'#000000').startsWith('#') ? String(t[k]) : '#000000'}
          onChange={e=>onChange(k,e.target.value)}
          style={{ width:22, height:22, borderRadius:'5px', border:'1.5px solid rgba(13,17,23,0.12)', cursor:'pointer', padding:'1px', background:'none' }} />
        <input type="text" value={String(t[k]||'')} onChange={e=>onChange(k,e.target.value)}
          style={{ ...inp, width:'130px', fontSize:'10px', fontFamily:'monospace', padding:'3px 6px' }} />
      </div>
    </div>
  )
}

function SR({ label, k, min, max, unit='px', t, onChange }: any) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
        <span style={{ fontSize:'12px', color:'#0D1117', fontFamily:'Inter,sans-serif' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:'11px', fontWeight:700, color:'#B8860B' }}>{t[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={Number(t[k]||min)}
        onChange={e=>onChange(k,Number(e.target.value))} style={{ width:'100%', accentColor:'#B8860B' }} />
    </div>
  )
}

function WS({ label, k, t, onChange }: any) {
  return (
    <div style={{ marginBottom:'10px' }}>
      <label style={{ ...lbl, marginBottom:'4px' }}>{label}</label>
      <select value={String(t[k]||300)} onChange={e=>onChange(k,Number(e.target.value))} style={inp}>
        {[300,400,500,600,700].map(w=><option key={w} value={w}>{w}</option>)}
      </select>
    </div>
  )
}

function G2({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'20px' }}>{children}</div>
}

function Heading({ text }: { text: string }) {
  return <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'17px', fontWeight:700, color:'#0D1117', marginBottom:'16px', paddingBottom:'8px', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>{text}</div>
}

function SectionControls({ section, t, onChange }: { section:string; t:any; onChange:(k:string,v:any)=>void }) {
  switch(section) {
    case 'colours': return (
      <div>
        <Heading text="Colour Palette — Site-wide defaults" />
        <G2>
          <div>
            <label style={lbl}>Background Colours</label>
            {[['ivory','Page Background'],['ivory2','Alt Background'],['ivory3','Dark Background'],['surface','Surface / Card']].map(([k,l])=><CP key={k} label={l} k={k} t={t} onChange={onChange} />)}
          </div>
          <div>
            <label style={lbl}>Text Colours</label>
            {[['ink','Text Primary'],['ink2','Text Secondary'],['inkMuted','Text Muted'],['inkFaint','Text Faint']].map(([k,l])=><CP key={k} label={l} k={k} t={t} onChange={onChange} />)}
          </div>
        </G2>
        <div style={{ marginTop:'16px' }}>
          <G2>
            <div>
              <label style={lbl}>Gold / Accent</label>
              {[['gold','Gold Primary'],['gold2','Gold Hover'],['goldLight','Gold Light'],['goldWash','Gold Wash']].map(([k,l])=><CP key={k} label={l} k={k} t={t} onChange={onChange} />)}
            </div>
            <div>
              <label style={lbl}>Other</label>
              <CP label="Border colour" k="border" t={t} onChange={onChange} />
            </div>
          </G2>
        </div>
      </div>
    )

    case 'typography': return (
      <div>
        <Heading text="Typography Scale" />
        <G2>
          <div>
            <label style={lbl}>Font Sizes</label>
            <SR label="Body text"   k="sizeBase" min={12} max={20} t={t} onChange={onChange} />
            <SR label="H1"          k="sizeH1"   min={32} max={120} t={t} onChange={onChange} />
            <SR label="H2"          k="sizeH2"   min={24} max={80}  t={t} onChange={onChange} />
            <SR label="H3"          k="sizeH3"   min={18} max={56}  t={t} onChange={onChange} />
            <SR label="H4"          k="sizeH4"   min={14} max={32}  t={t} onChange={onChange} />
            <SR label="Small/label" k="sizeSmall" min={10} max={16} t={t} onChange={onChange} />
          </div>
          <div>
            <WS label="Body weight"    k="weightBody"    t={t} onChange={onChange} />
            <WS label="Heading weight" k="weightHeading" t={t} onChange={onChange} />
            <SR label="Line height" k="lineHeight" min={130} max={220} unit="%" t={t} onChange={onChange} />
            <SR label="Max page width" k="containerWidth" min={960} max={2400} unit="px" t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'fonts': return (
      <div>
        <Heading text="Fonts & Buttons" />
        <G2>
          <div>
            <label style={lbl}>Heading font</label>
            <select value={String(t.fontSerif)} onChange={e=>onChange('fontSerif',e.target.value)} style={{ ...inp, marginBottom:'12px' }}>
              {['Cormorant Garamond','Playfair Display','EB Garamond','Lora','Merriweather','Georgia'].map(f=><option key={f}>{f}</option>)}
            </select>
            <label style={lbl}>Body font</label>
            <select value={String(t.fontSans)} onChange={e=>onChange('fontSans',e.target.value)} style={{ ...inp, marginBottom:'12px' }}>
              {['Inter','DM Sans','Plus Jakarta Sans','Outfit','Nunito','Poppins','Manrope'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <SR label="Default radius"  k="radius"    min={0} max={24} t={t} onChange={onChange} />
            <SR label="Button radius"   k="btnRadius" min={0} max={20} t={t} onChange={onChange} />
            <CP label="Primary btn bg"    k="btnPrimaryBg"    t={t} onChange={onChange} />
            <CP label="Primary btn text"  k="btnPrimaryColor" t={t} onChange={onChange} />
            <CP label="Gold btn bg"       k="btnGoldBg"       t={t} onChange={onChange} />
            <CP label="Gold btn text"     k="btnGoldColor"    t={t} onChange={onChange} />
            <SR label="Button font size" k="btnSize" min={11} max={18} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'navbar': return (
      <div>
        <Heading text="Navbar" />
        <G2>
          <div>
            <CP label="Background"    k="navBg"          t={t} onChange={onChange} />
            <CP label="Link colour"   k="navColor"       t={t} onChange={onChange} />
            <CP label="Logo colour"   k="navLogoColor"   t={t} onChange={onChange} />
            <CP label="Accent colour" k="navAccentColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Link size"   k="navSize"   min={11} max={18} t={t} onChange={onChange} />
            <WS label="Link weight" k="navWeight" t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'hero': return (
      <div>
        <Heading text="Hero Section — Homepage Top" />
        <G2>
          <div>
            <CP label="Background start"  k="heroBg"          t={t} onChange={onChange} />
            <CP label="Background end"    k="heroBgGrad"      t={t} onChange={onChange} />
            <CP label="H1 colour"         k="heroH1Color"     t={t} onChange={onChange} />
            <CP label="Italic accent"     k="heroItalicColor" t={t} onChange={onChange} />
            <CP label="Sub text colour"   k="heroSubColor"    t={t} onChange={onChange} />
            <CP label="Eyebrow colour"    k="heroEyebrowColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="H1 size"      k="heroH1Size"      min={36} max={120} t={t} onChange={onChange} />
            <SR label="Sub size"     k="heroSubSize"     min={13} max={24}  t={t} onChange={onChange} />
            <SR label="Eyebrow size" k="heroEyebrowSize" min={8}  max={16}  t={t} onChange={onChange} />
            <WS label="Sub weight"   k="heroSubWeight"   t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'stats': return (
      <div>
        <Heading text="Stats Bar — 12,000+, 1 Lakh+, etc." />
        <G2>
          <div>
            <CP label="Background"    k="statsBg"       t={t} onChange={onChange} />
            <CP label="Number colour" k="statNumColor"  t={t} onChange={onChange} />
            <CP label="Label colour"  k="statLabelColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Number size" k="statNumSize"   min={20} max={60} t={t} onChange={onChange} />
            <SR label="Label size"  k="statLabelSize" min={9}  max={18} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'featured': return (
      <div>
        <Heading text="Featured Schools Section" />
        <G2>
          <div>
            <CP label="Card background" k="schoolCardBg"     t={t} onChange={onChange} />
            <CP label="Card border"     k="schoolCardBorder" t={t} onChange={onChange} />
            <CP label="School name"     k="schoolNameColor"  t={t} onChange={onChange} />
            <CP label="Meta text"       k="schoolMetaColor"  t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Name size" k="schoolNameSize" min={13} max={24} t={t} onChange={onChange} />
            <SR label="Meta size" k="schoolMetaSize" min={10} max={16} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'why': return (
      <div>
        <Heading text="Why Choose Us Section" />
        <G2>
          <div>
            <CP label="Background"       k="whyBg"           t={t} onChange={onChange} />
            <CP label="Card background"  k="whyCardBg"       t={t} onChange={onChange} />
            <CP label="Title colour"     k="whyTitleColor"   t={t} onChange={onChange} />
            <CP label="Card title"       k="whyCardTitleColor" t={t} onChange={onChange} />
            <CP label="Card description" k="whyCardDescColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Section title"   k="whyTitleSize"     min={24} max={80} t={t} onChange={onChange} />
            <SR label="Card title"      k="whyCardTitleSize" min={13} max={24} t={t} onChange={onChange} />
            <SR label="Card desc"       k="whyCardDescSize"  min={11} max={17} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'how': return (
      <div>
        <Heading text="How It Works Section" />
        <G2>
          <div>
            <CP label="Background"     k="howBg"           t={t} onChange={onChange} />
            <CP label="Title colour"   k="howTitleColor"   t={t} onChange={onChange} />
            <CP label="Step title"     k="howStepTitleColor" t={t} onChange={onChange} />
            <CP label="Step desc"      k="howStepDescColor"  t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Section title" k="howTitleSize"     min={24} max={80} t={t} onChange={onChange} />
            <SR label="Step title"    k="howStepTitleSize" min={13} max={24} t={t} onChange={onChange} />
            <SR label="Step desc"     k="howStepDescSize"  min={11} max={17} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'footer': return (
      <div>
        <Heading text="Footer" />
        <G2>
          <div>
            <CP label="Background"       k="footerBg"          t={t} onChange={onChange} />
            <CP label="Text colour"      k="footerTextColor"   t={t} onChange={onChange} />
            <CP label="Link hover"       k="footerLinkHover"   t={t} onChange={onChange} />
            <CP label="Heading colour"   k="footerHeadingColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Text size"    k="footerTextSize"    min={11} max={16} t={t} onChange={onChange} />
            <SR label="Heading size" k="footerHeadingSize" min={8}  max={14} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'schools-list': return (
      <div>
        <Heading text="Schools Listing Page" />
        <G2>
          <div>
            <CP label="Page background" k="schoolsPageBg"   t={t} onChange={onChange} />
            <CP label="Card background" k="schoolsCardBg"   t={t} onChange={onChange} />
            <CP label="School name"     k="schoolsNameColor" t={t} onChange={onChange} />
            <CP label="Meta text"       k="schoolsMetaColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Name size" k="schoolsNameSize" min={14} max={28} t={t} onChange={onChange} />
            <SR label="Meta size" k="schoolsMetaSize" min={11} max={16} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'school-profile': return (
      <div>
        <Heading text="School Profile Page" />
        <G2>
          <div>
            <CP label="Page background" k="profilePageBg"    t={t} onChange={onChange} />
            <CP label="School name"     k="profileNameColor" t={t} onChange={onChange} />
            <CP label="Meta text"       k="profileMetaColor" t={t} onChange={onChange} />
            <CP label="Tab text"        k="profileTabColor"  t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Name size" k="profileNameSize" min={24} max={64} t={t} onChange={onChange} />
            <SR label="Meta size" k="profileMetaSize" min={11} max={18} t={t} onChange={onChange} />
            <SR label="Tab size"  k="profileTabSize"  min={11} max={16} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'counselling': return (
      <div>
        <Heading text="Free Counselling Page" />
        <G2>
          <div>
            <CP label="Background"  k="counsellingBg"      t={t} onChange={onChange} />
            <CP label="Headline"    k="counsellingH1Color" t={t} onChange={onChange} />
            <CP label="Subtext"     k="counsellingSubColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Headline size" k="counsellingH1Size"  min={24} max={72} t={t} onChange={onChange} />
            <SR label="Subtext size"  k="counsellingSubSize" min={13} max={24} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'compare': return (
      <div>
        <Heading text="Compare Schools Page" />
        <G2>
          <div>
            <CP label="Background" k="compareBg"      t={t} onChange={onChange} />
            <CP label="Headline"   k="compareH1Color" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Headline size" k="compareH1Size" min={24} max={64} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'pricing': return (
      <div>
        <Heading text="Pricing Page" />
        <G2>
          <div>
            <CP label="Background"      k="pricingBg"          t={t} onChange={onChange} />
            <CP label="Headline"        k="pricingH1Color"     t={t} onChange={onChange} />
            <CP label="Card background" k="pricingCardBg"      t={t} onChange={onChange} />
            <CP label="Card border"     k="pricingCardBorder"  t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Headline size" k="pricingH1Size" min={24} max={72} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'blog': return (
      <div>
        <Heading text="Blog Page" />
        <G2>
          <div>
            <CP label="Background"    k="blogBg"           t={t} onChange={onChange} />
            <CP label="Post title"    k="blogTitleColor"   t={t} onChange={onChange} />
            <CP label="Excerpt text"  k="blogExcerptColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Title size"   k="blogTitleSize"   min={14} max={32} t={t} onChange={onChange} />
            <SR label="Excerpt size" k="blogExcerptSize" min={11} max={17} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'login': return (
      <div>
        <Heading text="Login & Register Pages" />
        <G2>
          <div>
            <CP label="Page background"  k="loginBg"          t={t} onChange={onChange} />
            <CP label="Card background"  k="loginCardBg"      t={t} onChange={onChange} />
            <CP label="Headline colour"  k="loginH1Color"     t={t} onChange={onChange} />
            <CP label="Input background" k="loginInputBg"     t={t} onChange={onChange} />
            <CP label="Input border"     k="loginInputBorder" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Headline size" k="loginH1Size" min={20} max={48} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'dashboard': return (
      <div>
        <Heading text="Parent & School Dashboard" />
        <G2>
          <div>
            <CP label="Background"      k="dashboardBg"           t={t} onChange={onChange} />
            <CP label="Card background" k="dashboardCardBg"       t={t} onChange={onChange} />
            <CP label="Heading colour"  k="dashboardHeadingColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Heading size" k="dashboardHeadingSize" min={18} max={40} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'cities': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Background"    k="citiesBg"               t={t} onChange={onChange} />
        <CP label="Title colour"  k="citiesTitleColor"       t={t} onChange={onChange} />
        <SR label="Title size"    k="citiesTitleSize"        t={t} onChange={onChange} min={24} max={80} />
      </div>
    )
    case 'counsel-cta': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Background"    k="counselCtaBg"           t={t} onChange={onChange} />
        <CP label="H2 colour"     k="counselCtaH2Color"      t={t} onChange={onChange} />
        <SR label="H2 size"       k="counselCtaH2Size"       t={t} onChange={onChange} min={24} max={80} />
      </div>
    )
    case 'for-schools': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Background"    k="forSchoolsBg"           t={t} onChange={onChange} />
        <CP label="Title colour"  k="forSchoolsTitleColor"   t={t} onChange={onChange} />
      </div>
    )
    case 'testimonials': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Background"    k="testimonialsBg"         t={t} onChange={onChange} />
        <CP label="Title colour"  k="testimonialsTitleColor" t={t} onChange={onChange} />
      </div>
    )
    case 'about': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Background"    k="aboutBg"                t={t} onChange={onChange} />
        <CP label="H1 colour"     k="aboutH1Color"           t={t} onChange={onChange} />
        <SR label="H1 size"       k="aboutH1Size"            t={t} onChange={onChange} min={24} max={80} />
      </div>
    )
    case 'admin-overview': return (
      <div>
        <Heading text="Admin Panel — Page & Card Backgrounds" />
        <G2>
          <div>
            <label style={lbl}>Backgrounds</label>
            <CP label="Page background"    k="adminBg"        t={t} onChange={onChange} />
            <CP label="Sidebar background" k="adminSidebarBg" t={t} onChange={onChange} />
            <CP label="Header background"  k="adminHeaderBg"  t={t} onChange={onChange} />
            <CP label="Card background"    k="adminCardBg"    t={t} onChange={onChange} />
            <CP label="Border colour"      k="adminBorder"    t={t} onChange={onChange} />
          </div>
          <div>
            <label style={lbl}>Text & Accent</label>
            <CP label="Accent / gold colour"  k="adminAccent"     t={t} onChange={onChange} />
            <CP label="Primary text"          k="adminText"       t={t} onChange={onChange} />
            <CP label="Muted text"            k="adminTextMuted"  t={t} onChange={onChange} />
            <CP label="Faint text"            k="adminTextFaint"  t={t} onChange={onChange} />
            <SR label="Heading size"          k="adminHeadingSize" min={16} max={40} t={t} onChange={onChange} />
          </div>
        </G2>
        <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(184,134,11,0.08)', borderRadius:'8px', fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#718096', borderLeft:'3px solid #B8860B' }}>
          💡 These changes apply to every admin page — Dashboard, Schools, Users, Analytics, etc.
          <br/>Set dark backgrounds for a dark theme or light (#fff, #f9fafb) for a light admin panel.
        </div>
      </div>
    )
    case 'admin-style': return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <CP label="Sidebar background"    k="adminSidebarBg"          t={t} onChange={onChange} />
        <CP label="Sidebar active colour" k="adminSidebarActiveColor" t={t} onChange={onChange} />
      </div>
    )

    case 'parent-dash': return (
      <div>
        <Heading text="Parent Dashboard" />
        <G2>
          <div>
            <CP label="Page background"  k="dashboardBg"          t={t} onChange={onChange} />
            <CP label="Card background"  k="dashboardCardBg"      t={t} onChange={onChange} />
            <CP label="Heading colour"   k="dashboardHeadingColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Heading size" k="dashboardHeadingSize" min={18} max={40} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'school-dash': return (
      <div>
        <Heading text="School Dashboard" />
        <G2>
          <div>
            <CP label="Page background"  k="dashboardBg"          t={t} onChange={onChange} />
            <CP label="Card background"  k="dashboardCardBg"      t={t} onChange={onChange} />
            <CP label="Heading colour"   k="dashboardHeadingColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Heading size" k="dashboardHeadingSize" min={18} max={40} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'admin-analytics':
    case 'admin-schools':
    case 'admin-users':
    case 'admin-apps':
    case 'admin-leads':
    case 'admin-payments':
    case 'admin-reviews':
    case 'admin-packages':
    case 'admin-counselling':
    case 'admin-settings':
    case 'admin-seo':
    case 'admin-media': return (
      <div>
        <Heading text="Admin Panel — Global Style" />
        <G2>
          <div>
            <label style={lbl}>Admin Background</label>
            <CP label="Page background"  k="adminBg"           t={t} onChange={onChange} />
            <CP label="Card background"  k="adminCardBg"       t={t} onChange={onChange} />
            <CP label="Sidebar bg"       k="adminSidebarBg"    t={t} onChange={onChange} />
          </div>
          <div>
            <label style={lbl}>Admin Text</label>
            <CP label="Heading colour"   k="adminHeadingColor" t={t} onChange={onChange} />
            <CP label="Accent colour"    k="adminSidebarActiveColor" t={t} onChange={onChange} />
            <SR label="Heading size"     k="adminHeadingSize" min={16} max={40} t={t} onChange={onChange} />
          </div>
        </G2>
        <div style={{ marginTop:12, padding:'12px', background:'rgba(184,134,11,0.06)', borderRadius:'8px', fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#718096' }}>
          💡 Admin pages share a global dark style. Changes here affect all admin tabs.
        </div>
      </div>
    )

    case 'cities-page': return (
      <div>
        <Heading text="Cities Directory Page" />
        <G2>
          <div>
            <CP label="Background"   k="citiesPageBg"    t={t} onChange={onChange} />
            <CP label="Title colour" k="citiesTitleColor" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="Title size" k="citiesTitleSize" min={24} max={80} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'legal': return (
      <div>
        <Heading text="Privacy / Terms / Legal Pages" />
        <G2>
          <div>
            <CP label="Background"   k="legalBg"      t={t} onChange={onChange} />
            <CP label="H1 colour"    k="legalH1Color" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="H1 size" k="legalH1Size" min={24} max={72} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    case 'contact-page': return (
      <div>
        <Heading text="Contact & Careers Pages" />
        <G2>
          <div>
            <CP label="Background"  k="contactBg"      t={t} onChange={onChange} />
            <CP label="H1 colour"   k="contactH1Color" t={t} onChange={onChange} />
          </div>
          <div>
            <SR label="H1 size" k="contactH1Size" min={24} max={72} t={t} onChange={onChange} />
          </div>
        </G2>
      </div>
    )

    default: return <div style={{ color:'#718096', fontSize:'13px', padding:'20px 0', fontFamily:'Inter,sans-serif' }}>Select a section from the left.</div>
  }
}

/* ── Build a :root{} CSS string from a theme object (for postMessage live preview) ── */
function buildThemeCssText(t: Record<string,any>): string {
  const px = (k: string, d: number) => `${t[k] ?? d}px`
  const co = (k: string, d: string) => t[k] ?? d
  return `:root {
  --ivory: ${co('ivory','#FAF7F2')};
  --ivory-2: ${co('ivory2','#F5F0E8')};
  --ivory-3: ${co('ivory3','#EDE5D8')};
  --ink: ${co('ink','#0D1117')};
  --ink-2: ${co('ink2','#1C2333')};
  --ink-muted: ${co('inkMuted','#4A5568')};
  --ink-faint: ${co('inkFaint','#A0ADB8')};
  --gold: ${co('gold','#B8860B')};
  --gold-2: ${co('gold2','#C9960D')};
  --gold-light: ${co('goldLight','#E8C547')};
  --gold-wash: ${co('goldWash','#FEF7E0')};
  --border: ${co('border','rgba(13,17,23,0.09)')};
  --font-serif: '${co('fontSerif','Cormorant Garamond')}', Georgia, serif;
  --font-sans: '${co('fontSans','Inter')}', system-ui, sans-serif;
  --radius: ${px('radius',12)};
  --radius-sm: ${px('btnRadius',6)};
  --container-width: ${t.containerWidth ?? 1600}px;
  --nav-bg: ${co('navBg','rgba(250,247,242,0.95)')};
  --nav-size: ${px('navSize',14)};
  --nav-color: ${co('navColor','#4A5568')};
  --nav-weight: ${co('navWeight','400')};
  --hero-bg: ${co('heroBg','#FAF7F2')};
  --hero-bg-grad: ${co('heroBgGrad','#F0EAD6')};
  --hero-h1-size: ${px('heroH1Size',96)};
  --hero-h1-color: ${co('heroH1Color','#0D1117')};
  --hero-italic-color: ${co('heroItalicColor','#B8860B')};
  --hero-sub-size: ${px('heroSubSize',17)};
  --hero-sub-color: ${co('heroSubColor','#4A5568')};
  --hero-sub-weight: ${co('heroSubWeight','300')};
  --hero-eyebrow-size: ${px('heroEyebrowSize',11)};
  --hero-eyebrow-color: ${co('heroEyebrowColor','#B8860B')};
  --stats-bg: ${co('statsBg','#F5F0E8')};
  --stat-num-size: ${px('statNumSize',42)};
  --stat-num-color: ${co('statNumColor','#0D1117')};
  --stat-label-size: ${px('statLabelSize',13)};
  --stat-label-color: ${co('statLabelColor','#718096')};
  --school-card-bg: ${co('schoolCardBg','#ffffff')};
  --school-name-size: ${px('schoolNameSize',18)};
  --school-name-color: ${co('schoolNameColor','#0D1117')};
  --why-bg: ${co('whyBg','#F5F0E8')};
  --why-card-bg: ${co('whyCardBg','#ffffff')};
  --why-title-size: ${px('whyTitleSize',60)};
  --why-title-color: ${co('whyTitleColor','#0D1117')};
  --how-bg: ${co('howBg','#FAF7F2')};
  --how-title-size: ${px('howTitleSize',60)};
  --how-title-color: ${co('howTitleColor','#0D1117')};
  --footer-bg: ${co('footerBg','#0D1117')};
  --footer-text-color: ${co('footerTextColor','rgba(250,247,242,0.4)')};
  --footer-link-hover: ${co('footerLinkHover','#B8860B')};
  --footer-text-size: ${px('footerTextSize',14)};
  --login-bg: ${co('loginBg','#FAF7F2')};
  --login-card-bg: ${co('loginCardBg','#ffffff')};
  --login-h1-size: ${px('loginH1Size',32)};
  --login-h1-color: ${co('loginH1Color','#0D1117')};
  --schools-page-bg: ${co('schoolsPageBg','#FAF7F2')};
  --schools-card-bg: ${co('schoolsCardBg','#ffffff')};
  --schools-name-size: ${px('schoolsNameSize',19)};
  --schools-name-color: ${co('schoolsNameColor','#0D1117')};
  --btn-primary-bg: ${co('btnPrimaryBg','#0D1117')};
  --btn-primary-color: ${co('btnPrimaryColor','#FAF7F2')};
  --btn-gold-bg: ${co('btnGoldBg','#B8860B')};
  --btn-gold-color: ${co('btnGoldColor','#ffffff')};
  --btn-size: ${px('btnSize',14)};
  --admin-bg: ${co('adminBg','#0A0F1A')};
  --admin-sidebar-bg: ${co('adminSidebarBg','linear-gradient(180deg,#0D1117 0%,#111820 100%)')};
  --admin-header-bg: ${co('adminHeaderBg','rgba(13,17,23,0.95)')};
  --admin-card-bg: ${co('adminCardBg','rgba(255,255,255,0.04)')};
  --admin-border: ${co('adminBorder','rgba(255,255,255,0.07)')};
  --admin-accent: ${co('adminAccent','#B8860B')};
  --admin-text: ${co('adminText','rgba(255,255,255,0.9)')};
  --admin-text-muted: ${co('adminTextMuted','rgba(255,255,255,0.45)')};
  --admin-text-faint: ${co('adminTextFaint','rgba(255,255,255,0.25)')};
}`
}

function applyToDom(t: Record<string,any>) {
  const r = document.documentElement
  const s = (k:string, v:string) => r.style.setProperty(k, v)
  s('--ivory',      String(t.ivory||'#FAF7F2'))
  s('--ivory-2',    String(t.ivory2||'#F5F0E8'))
  s('--ivory-3',    String(t.ivory3||'#EDE5D8'))
  s('--ink',        String(t.ink||'#0D1117'))
  s('--ink-2',      String(t.ink2||'#1C2333'))
  s('--ink-muted',  String(t.inkMuted||'#4A5568'))
  s('--ink-faint',  String(t.inkFaint||'#A0ADB8'))
  s('--gold',       String(t.gold||'#B8860B'))
  s('--gold-2',     String(t.gold2||'#C9960D'))
  s('--gold-light', String(t.goldLight||'#E8C547'))
  s('--gold-wash',  String(t.goldWash||'#FEF7E0'))
  s('--border',     String(t.border||'rgba(13,17,23,0.09)'))
  if (t.fontSerif) s('--font-serif', `'${t.fontSerif}', Georgia, serif`)
  if (t.fontSans)  s('--font-sans',  `'${t.fontSans}', system-ui, sans-serif`)
  s('--container-width', `${t.containerWidth ?? 1600}px`)
  // Section vars
  s('--nav-bg',                    String(t.navBg||'rgba(250,247,242,0.95)'))
  s('--nav-size',                  `${t.navSize||13}px`)
  s('--nav-color',                 String(t.navColor||'#4A5568'))
  s('--nav-weight',                String(t.navWeight||400))
  s('--hero-bg',                   String(t.heroBg||'#FAF7F2'))
  s('--hero-bg-grad',              String(t.heroBgGrad||'#F0EAD6'))
  s('--hero-h1-size',              `${t.heroH1Size||80}px`)
  s('--hero-h1-color',             String(t.heroH1Color||'#0D1117'))
  s('--hero-italic-color',         String(t.heroItalicColor||'#B8860B'))
  s('--hero-sub-size',             `${t.heroSubSize||15}px`)
  s('--hero-sub-color',            String(t.heroSubColor||'#4A5568'))
  s('--hero-sub-weight',           String(t.heroSubWeight||300))
  s('--hero-eyebrow-size',         `${t.heroEyebrowSize||10}px`)
  s('--hero-eyebrow-color',        String(t.heroEyebrowColor||'#B8860B'))
  s('--stats-bg',                  String(t.statsBg||'#F5F0E8'))
  s('--stat-num-size',             `${t.statNumSize||38}px`)
  s('--stat-num-color',            String(t.statNumColor||'#0D1117'))
  s('--stat-label-size',           `${t.statLabelSize||12}px`)
  s('--stat-label-color',          String(t.statLabelColor||'#718096'))
  s('--school-card-bg',            String(t.schoolCardBg||'#fff'))
  s('--school-name-size',          `${t.schoolNameSize||17}px`)
  s('--school-name-color',         String(t.schoolNameColor||'#0D1117'))
  s('--school-meta-size',          `${t.schoolMetaSize||12}px`)
  s('--school-meta-color',         String(t.schoolMetaColor||'#718096'))
  s('--why-bg',                    String(t.whyBg||'#F5F0E8'))
  s('--why-card-bg',               String(t.whyCardBg||'#fff'))
  s('--why-title-size',            `${t.whyTitleSize||56}px`)
  s('--why-title-color',           String(t.whyTitleColor||'#0D1117'))
  s('--why-card-title-size',       `${t.whyCardTitleSize||16}px`)
  s('--why-card-title-color',      String(t.whyCardTitleColor||'#0D1117'))
  s('--why-card-desc-size',        `${t.whyCardDescSize||13}px`)
  s('--why-card-desc-color',       String(t.whyCardDescColor||'#4A5568'))
  s('--how-bg',                    String(t.howBg||'#FAF7F2'))
  s('--how-title-size',            `${t.howTitleSize||56}px`)
  s('--how-title-color',           String(t.howTitleColor||'#0D1117'))
  s('--how-step-title-size',       `${t.howStepTitleSize||17}px`)
  s('--how-step-title-color',      String(t.howStepTitleColor||'#0D1117'))
  s('--how-step-desc-size',        `${t.howStepDescSize||13}px`)
  s('--how-step-desc-color',       String(t.howStepDescColor||'#4A5568'))
  s('--footer-bg',                 String(t.footerBg||'#0D1117'))
  s('--footer-text-color',         String(t.footerTextColor||'rgba(250,247,242,0.4)'))
  s('--footer-link-hover',         String(t.footerLinkHover||'#B8860B'))
  s('--footer-heading-color',      String(t.footerHeadingColor||'rgba(250,247,242,0.55)'))
  s('--footer-text-size',          `${t.footerTextSize||13}px`)
  s('--footer-heading-size',       `${t.footerHeadingSize||11}px`)
  s('--login-bg',                  String(t.loginBg||'#FAF7F2'))
  s('--login-card-bg',             String(t.loginCardBg||'#fff'))
  s('--login-h1-size',             `${t.loginH1Size||28}px`)
  s('--login-h1-color',            String(t.loginH1Color||'#0D1117'))
  s('--login-input-bg',            String(t.loginInputBg||'#fff'))
  s('--login-input-border',        String(t.loginInputBorder||'rgba(13,17,23,0.12)'))
  s('--pricing-bg',                String(t.pricingBg||'#FAF7F2'))
  s('--pricing-card-bg',           String(t.pricingCardBg||'#fff'))
  s('--schools-page-bg',           String(t.schoolsPageBg||'#FAF7F2'))
  s('--schools-card-bg',           String(t.schoolsCardBg||'#fff'))
  s('--schools-name-size',         `${t.schoolsNameSize||18}px`)
  s('--schools-name-color',        String(t.schoolsNameColor||'#0D1117'))
  s('--schools-meta-size',         `${t.schoolsMetaSize||13}px`)
  s('--schools-meta-color',        String(t.schoolsMetaColor||'#718096'))
  s('--profile-page-bg',           String(t.profilePageBg||'#FAF7F2'))
  s('--profile-name-size',         `${t.profileNameSize||40}px`)
  s('--profile-name-color',        String(t.profileNameColor||'#0D1117'))
  s('--dashboard-bg',              String(t.dashboardBg||'#FAF7F2'))
  s('--dashboard-card-bg',         String(t.dashboardCardBg||'#fff'))
  s('--blog-bg',                   String(t.blogBg||'#FAF7F2'))
  s('--blog-title-size',           `${t.blogTitleSize||20}px`)
  s('--blog-title-color',          String(t.blogTitleColor||'#0D1117'))
  s('--btn-primary-bg',            String(t.btnPrimaryBg||'#0D1117'))
  s('--btn-primary-color',         String(t.btnPrimaryColor||'#FAF7F2'))
  s('--btn-gold-bg',               String(t.btnGoldBg||'#B8860B'))
  s('--btn-gold-color',            String(t.btnGoldColor||'#fff'))
  s('--btn-size',                  `${t.btnSize||13}px`)
  // Admin panel vars
  s('--admin-bg',          String(t.adminBg         || '#0A0F1A'))
  s('--admin-sidebar-bg',  String(t.adminSidebarBg  || 'linear-gradient(180deg,#0D1117 0%,#111820 100%)'))
  s('--admin-header-bg',   String(t.adminHeaderBg   || 'rgba(13,17,23,0.95)'))
  s('--admin-card-bg',     String(t.adminCardBg     || 'rgba(255,255,255,0.04)'))
  s('--admin-border',      String(t.adminBorder     || 'rgba(255,255,255,0.07)'))
  s('--admin-accent',      String(t.adminAccent     || '#B8860B'))
  s('--admin-text',        String(t.adminText       || 'rgba(255,255,255,0.9)'))
  s('--admin-text-muted',  String(t.adminTextMuted  || 'rgba(255,255,255,0.45)'))
  s('--admin-text-faint',  String(t.adminTextFaint  || 'rgba(255,255,255,0.25)'))
}

export default function AdminThemePage() {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [theme,         setTheme]         = useState<Record<string,any>>({ ...DEFAULT })
  const [activePage,    setActivePage]    = useState(0)
  const [activeSection, setActiveSection] = useState('colours')
  const [unsaved,       setUnsaved]       = useState(false)
  const [activePreset,  setActivePreset]  = useState('Ivory & Gold (Default)')

  const { data: savedData } = useQuery({
    queryKey: ['admin-theme'],
    queryFn: () => fetch('/api/admin/theme', { cache:'no-store' }).then(r=>r.json()),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (savedData?.theme) {
      const merged = { ...DEFAULT, ...savedData.theme }
      setTheme(merged)
      applyToDom(merged)
    }
  }, [savedData])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      })
      if (!res.ok) throw new Error('Save failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('✅ Theme saved! Refreshing preview…')
      setUnsaved(false)
      // Refresh Next.js SSR cache so live site picks up new theme vars
      router.refresh()
      // Reload the preview iframe so it shows updated theme
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
      }, 800)
    },
    onError: () => toast.error('Failed to save theme'),
  })

  const handleChange = (key: string, val: any) => {
    setTheme(p => {
      const n = { ...p, [key]: val }
      applyToDom(n)
      // Push live CSS vars into the preview iframe via postMessage
      try {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'TS_THEME_VARS', cssText: buildThemeCssText(n) },
          '*'
        )
      } catch (_) {}
      return n
    })
    setUnsaved(true)
    setActivePreset('Custom')
  }

  const applyPreset = (name: string) => {
    const p = PRESETS[name]
    if (!p) return
    setTheme({ ...p }); applyToDom({ ...p })
    setActivePreset(name); setUnsaved(true)
    toast.success(`Preset "${name}" applied`)
  }

  const handleReset = () => { applyPreset('Ivory & Gold (Default)') }

  return (
    <AdminLayout title="Theme Controller" subtitle="Customise every page and section — save to apply site-wide">

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', padding:'12px 16px', background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'10px' }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background: unsaved ? '#B8860B' : '#4ADE80', boxShadow: unsaved ? '0 0 8px rgba(184,134,11,.4)' : '0 0 8px rgba(74,222,128,.4)' }} />
        <span style={{ fontSize:'12px', color:'#718096', flex:1, fontFamily:'Inter,sans-serif' }}>
          {unsaved ? '⚠ Unsaved changes' : '✓ All changes saved'}
        </span>
        {/* Presets */}
        <div style={{ display:'flex', gap:'5px' }}>
          {Object.keys(PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)}
              style={{ padding:'5px 11px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:500, fontFamily:'Inter,sans-serif', transition:'all .15s',
                background: activePreset===name ? '#0D1117' : 'rgba(13,17,23,0.05)',
                color: activePreset===name ? '#FAF7F2' : '#4A5568' }}>
              {name}
            </button>
          ))}
        </div>
        <button onClick={handleReset} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'7px', background:'rgba(13,17,23,0.05)', border:'1px solid rgba(13,17,23,0.1)', color:'#718096', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>
          <RotateCcw style={{ width:12, height:12 }} /> Reset
        </button>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'8px', background:'#0D1117', border:'none', color:'#FAF7F2', cursor:'pointer', fontSize:'13px', fontWeight:500, fontFamily:'Inter,sans-serif', opacity: saveMutation.isPending ? .7 : 1, boxShadow:'0 2px 8px rgba(13,17,23,0.2)' }}>
          {saveMutation.isPending ? <><Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} />Saving…</> : <><Globe style={{ width:13, height:13 }} />Save to Site</>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'clamp(160px,22vw,220px) 1fr', gap:'16px', minWidth:0 }}>

        {/* LEFT tree */}
        <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'12px', overflow:'hidden' }}>
          {PAGES.map((page, pi) => (
            <div key={page.label}>
              <button onClick={() => { setActivePage(pi); setActiveSection(page.sections[0].key) }}
                style={{ width:'100%', display:'flex', alignItems:'center', padding:'10px 14px', border:'none', borderBottom:'1px solid rgba(13,17,23,0.05)', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:600, textAlign:'left',
                  background: activePage===pi ? 'rgba(184,134,11,0.07)' : '#F8F6F1',
                  color: activePage===pi ? '#B8860B' : '#0D1117' }}>
                {page.label}
              </button>
              {activePage === pi && page.sections.map(sec => (
                <button key={sec.key} onClick={() => setActiveSection(sec.key)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px 8px 24px', border:'none', borderBottom:'1px solid rgba(13,17,23,0.04)', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:'12px', textAlign:'left', transition:'all .15s',
                    background: activeSection===sec.key ? 'rgba(184,134,11,0.1)' : '#fff',
                    color: activeSection===sec.key ? '#B8860B' : '#718096',
                    fontWeight: activeSection===sec.key ? 600 : 400 }}>
                  {activeSection===sec.key && <span style={{ width:2, height:12, background:'#B8860B', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />}
                  {sec.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT controls + preview */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

          {/* Controls */}
          <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'12px', padding:'22px' }}>
            <SectionControls section={activeSection} t={theme} onChange={handleChange} />
          </div>

          {/* Live preview — real iframe of actual page */}
          <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(13,17,23,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter,sans-serif' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'10px', fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'#A0ADB8' }}>
                <Eye style={{ width:12, height:12 }} /> Live Page Preview
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'11px', color:'#A0ADB8', fontFamily:'monospace' }}>{PAGES[activePage]?.url || '/'}</span>
                <a href={PAGES[activePage]?.url || '/'} target="_blank" rel="noreferrer"
                  style={{ padding:'4px 10px', background:'rgba(13,17,23,0.05)', borderRadius:'5px', fontSize:'11px', color:'#718096', textDecoration:'none' }}>
                  Open ↗
                </a>
              </div>
            </div>
            <div style={{ background:'#f0f0f0', padding:'8px', display:'flex', gap:'6px', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#FF5F56' }} />
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#FFBD2E' }} />
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#27C93F' }} />
              <div style={{ flex:1, background:'#fff', borderRadius:'4px', padding:'2px 10px', fontSize:'11px', color:'#999', fontFamily:'monospace' }}>{typeof window!=='undefined'?window.location.host:''}{PAGES[activePage]?.url || '/'}</div>
            </div>
            <iframe
              ref={iframeRef}
              key={`preview-${activePage}`}
              src={PAGES[activePage]?.url || '/'}
              style={{ width:'100%', height:'640px', border:'none', display:'block' }}
              title="Page Preview"
              onLoad={() => {
                // Send theme vars after iframe loads — retry multiple times
                // to ensure ContentStyleInjector's useEffect has run
                const css = buildThemeCssText(theme)
                const send = () => {
                  try {
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: 'TS_THEME_VARS', cssText: css }, '*'
                    )
                  } catch (_) {}
                }
                setTimeout(send, 300)
                setTimeout(send, 800)
                setTimeout(send, 1800)
                setTimeout(send, 3500)
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
