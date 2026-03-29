'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiPost } from '@/lib/api'
import { Globe, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

type FieldType = 'text' | 'textarea' | 'color' | 'size'
interface Field { id: string; label: string; type: FieldType; cssVar?: string; default: string; min?: number; max?: number }
interface Section { id: string; label: string; fields: Field[] }
interface PageGroup { label: string; icon: string; contentKey: string; sections: Section[] }

const PAGES: PageGroup[] = [
  {
    label: 'Homepage', icon: '🏠', contentKey: 'home',
    sections: [
      {
        id: 'hero-text', label: 'Hero Section — Text',
        fields: [
          { id:'eyebrow',          label:'Eyebrow text',           type:'text',    default:'AI-Powered School Matching — Free for Parents' },
          { id:'h1Line1',          label:'H1 Line 1',              type:'text',    default:'Find the' },
          { id:'h1Italic',         label:'H1 Italic word',         type:'text',    default:'Perfect School' },
          { id:'h1Line3',          label:'H1 Line 3',              type:'text',    default:'for Your Child' },
          { id:'subtext',          label:'Hero subtitle',          type:'textarea',default:'Search, compare & apply to 12,000+ verified schools across 35+ Indian cities.' },
          { id:'searchPlaceholder',label:'Search box placeholder', type:'text',    default:'School name, board, or keyword…' },
          { id:'ctaPrimary',       label:'Search button text',     type:'text',    default:'Search →' },
        ],
      },
      {
        id: 'hero-style', label: 'Hero Section — Colours & Sizes',
        fields: [
          { id:'heroBg',           label:'Background colour',      type:'color', cssVar:'--hero-bg',             default:'#FAF7F2' },
          { id:'heroH1Color',      label:'H1 colour',              type:'color', cssVar:'--hero-h1-color',       default:'#0D1117' },
          { id:'heroH1Size',       label:'H1 font size',           type:'size',  cssVar:'--hero-h1-size',        default:'96', min:40, max:160 },
          { id:'heroItalicColor',  label:'Italic accent colour',   type:'color', cssVar:'--hero-italic-color',   default:'#B8860B' },
          { id:'heroSubColor',     label:'Subtitle colour',        type:'color', cssVar:'--hero-sub-color',      default:'#4A5568' },
          { id:'heroSubSize',      label:'Subtitle font size',     type:'size',  cssVar:'--hero-sub-size',       default:'17', min:12, max:28 },
          { id:'heroEyebrowColor', label:'Eyebrow colour',         type:'color', cssVar:'--hero-eyebrow-color',  default:'#B8860B' },
          { id:'btnGoldBg',        label:'Search button background',type:'color',cssVar:'--btn-gold-bg',         default:'#B8860B' },
          { id:'btnGoldColor',     label:'Search button text',     type:'color', cssVar:'--btn-gold-color',      default:'#ffffff' },
        ],
      },
      {
        id: 'stats', label: 'Stats Bar',
        fields: [
          { id:'stat1Num',   label:'Stat 1 — Number', type:'text',  default:'12,000+' },
          { id:'stat1Label', label:'Stat 1 — Label',  type:'text',  default:'Verified Schools' },
          { id:'stat2Num',   label:'Stat 2 — Number', type:'text',  default:'1 Lakh+' },
          { id:'stat2Label', label:'Stat 2 — Label',  type:'text',  default:'Happy Parents' },
          { id:'stat3Num',   label:'Stat 3 — Number', type:'text',  default:'35+' },
          { id:'stat3Label', label:'Stat 3 — Label',  type:'text',  default:'Indian Cities' },
          { id:'stat4Num',   label:'Stat 4 — Number', type:'text',  default:'98%' },
          { id:'stat4Label', label:'Stat 4 — Label',  type:'text',  default:'Satisfaction Rate' },
          { id:'stat5Num',   label:'Stat 5 — Number', type:'text',  default:'4.8★' },
          { id:'stat5Label', label:'Stat 5 — Label',  type:'text',  default:'Average Rating' },
          { id:'statsBg',    label:'Background',      type:'color', cssVar:'--stats-bg',        default:'#F5F0E8' },
          { id:'statNumColor',label:'Number colour',  type:'color', cssVar:'--stat-num-color',  default:'#0D1117' },
          { id:'statNumSize', label:'Number size',    type:'size',  cssVar:'--stat-num-size',   default:'38', min:20, max:72 },
          { id:'statLabelColor',label:'Label colour', type:'color', cssVar:'--stat-label-color',default:'#718096' },
        ],
      },
      {
        id: 'why', label: 'Why Choose Us Section',
        fields: [
          { id:'whyTitle',      label:'Section title',          type:'text',  default:'Everything You Need, Nothing You Don\'t' },
          { id:'whyBg',         label:'Background',             type:'color', cssVar:'--why-bg',          default:'#F5F0E8' },
          { id:'whyTitleColor', label:'Title colour',           type:'color', cssVar:'--why-title-color', default:'#0D1117' },
          { id:'whyTitleSize',  label:'Title size',             type:'size',  cssVar:'--why-title-size',  default:'56', min:24, max:80 },
        ],
      },
      {
        id: 'how', label: 'How It Works Section',
        fields: [
          { id:'howTitle',      label:'Section title',          type:'text',  default:'Admission Made Simple' },
          { id:'howBg',         label:'Background',             type:'color', cssVar:'--how-bg',          default:'#FAF7F2' },
          { id:'howTitleColor', label:'Title colour',           type:'color', cssVar:'--how-title-color', default:'#0D1117' },
          { id:'howTitleSize',  label:'Title size',             type:'size',  cssVar:'--how-title-size',  default:'56', min:24, max:80 },
        ],
      },
    ],
  },
  {
    label: 'Navbar', icon: '📌', contentKey: 'navbar',
    sections: [
      {
        id: 'navbar', label: 'Navigation Bar',
        fields: [
          { id:'link1Label',  label:'Nav link 1 text',    type:'text',  default:'Find Schools' },
          { id:'link2Label',  label:'Nav link 2 text',    type:'text',  default:'Compare' },
          { id:'link3Label',  label:'Nav link 3 text',    type:'text',  default:'Counselling' },
          { id:'link4Label',  label:'Nav link 4 text',    type:'text',  default:'Blog' },
          { id:'nav.ctaLabel',    label:'CTA button text',    type:'text',  default:'List Your School' },
          { id:'navBg',       label:'Navbar background',  type:'color', cssVar:'--nav-bg',    default:'rgba(250,247,242,0.95)' },
          { id:'navColor',    label:'Link colour',        type:'color', cssVar:'--nav-color', default:'#4A5568' },
          { id:'navSize',     label:'Link font size',     type:'size',  cssVar:'--nav-size',  default:'13', min:10, max:18 },
        ],
      },
    ],
  },
  {
    label: 'Footer', icon: '🦶', contentKey: 'footer',
    sections: [
      {
        id: 'footer', label: 'Footer',
        fields: [
          { id:'tagline',       label:'Tagline',           type:'textarea',default:'India\'s most trusted school discovery platform.' },
          { id:'copyright',     label:'Copyright text',    type:'text',    default:'© 2025 Thynk Schooling. All rights reserved.' },
          { id:'footerBg',      label:'Background',        type:'color',   cssVar:'--footer-bg',         default:'#0D1117' },
          { id:'footerTextColor',label:'Text colour',      type:'color',   cssVar:'--footer-text-color', default:'rgba(250,247,242,0.4)' },
          { id:'footerTextSize', label:'Text font size',   type:'size',    cssVar:'--footer-text-size',  default:'14', min:10, max:18 },
        ],
      },
    ],
  },
  {
    label: 'Schools Page', icon: '🏫', contentKey: 'schools',
    sections: [
      {
        id: 'schools', label: 'School Listing Page',
        fields: [
          { id:'heroTitle',   label:'Page title',          type:'text',  default:'Find Your School' },
          { id:'heroSub',     label:'Page subtitle',       type:'text',  default:'Search 12,000+ verified schools across India' },
          { id:'pageBg',      label:'Page background',     type:'color', cssVar:'--schools-page-bg',  default:'#FAF7F2' },
          { id:'cardBg',      label:'Card background',     type:'color', cssVar:'--schools-card-bg',  default:'#ffffff' },
          { id:'nameColor',   label:'School name colour',  type:'color', cssVar:'--schools-name-color',default:'#0D1117' },
          { id:'nameSize',    label:'School name size',    type:'size',  cssVar:'--schools-name-size', default:'19', min:13, max:28 },
          { id:'metaColor',   label:'Meta text colour',    type:'color', cssVar:'--schools-meta-color',default:'#718096' },
        ],
      },
    ],
  },
  {
    label: 'Login / Register', icon: '🔐', contentKey: 'auth',
    sections: [
      {
        id: 'auth', label: 'Auth Pages',
        fields: [
          { id:'loginTitle',   label:'Login page title',   type:'text',  default:'Welcome Back' },
          { id:'loginSub',     label:'Login subtitle',     type:'text',  default:'Sign in to your Thynk Schooling account' },
          { id:'regTitle',     label:'Register page title',type:'text',  default:'Create Account' },
          { id:'loginBg',      label:'Page background',    type:'color', cssVar:'--login-bg',           default:'#FAF7F2' },
          { id:'loginCardBg',  label:'Card background',    type:'color', cssVar:'--login-card-bg',      default:'#ffffff' },
          { id:'loginH1Color', label:'Heading colour',     type:'color', cssVar:'--login-h1-color',     default:'#0D1117' },
          { id:'loginH1Size',  label:'Heading size',       type:'size',  cssVar:'--login-h1-size',      default:'32', min:20, max:48 },
          { id:'loginInputBorder',label:'Input border',    type:'color', cssVar:'--login-input-border', default:'rgba(13,17,23,0.12)' },
        ],
      },
    ],
  },
  {
    label: 'Counselling Page', icon: '🎓', contentKey: 'counselling',
    sections: [
      {
        id: 'counselling', label: 'Counselling Page',
        fields: [
          { id:'h1',       label:'Page headline',          type:'text',     default:'Free 1-on-1 School Counselling' },
          { id:'counsel.subtext',  label:'Subtitle',               type:'textarea', default:'Our expert counsellors help you find the right school for your child.' },
          { id:'counsel.ctaLabel', label:'CTA button text',        type:'text',     default:'Book Free Session' },
          { id:'benefit1', label:'Benefit 1',              type:'text',     default:'Personalised school shortlist' },
          { id:'benefit2', label:'Benefit 2',              type:'text',     default:'Application guidance' },
          { id:'benefit3', label:'Benefit 3',              type:'text',     default:'100% free service' },
        ],
      },
    ],
  },
  {
    label: 'Cities Section', icon: '🏙️', contentKey: 'cities',
    sections: [
      { id: 'cities', label: 'Top Cities Section',
        fields: [
          { id:'citiesTitle',   label:'Section title',      type:'text',     default:'Schools in Your City' },
          { id:'citiesSub',     label:'Subtitle',           type:'textarea', default:'Find top schools in 35+ Indian cities — all verified, all real.' },
          { id:'citiesCtaText', label:'View all link text', type:'text',     default:'View all 35+ cities' },
          { id:'citiesBg',      label:'Background',         type:'color',    default:'#F5F0E8', cssVar:'--cities-bg' },
        ],
      },
    ],
  },
  {
    label: 'Counselling CTA', icon: '📞', contentKey: 'counselling-cta',
    sections: [
      { id: 'counsel-cta', label: 'Counselling CTA Section',
        fields: [
          { id:'ctaH2Line1',   label:'Headline line 1',      type:'text',     default:'Talk to an Expert' },
          { id:'ctaH2Line2',   label:'Headline italic',       type:'text',     default:'Education Counsellor' },
          { id:'ctaDesc',      label:'Description',           type:'textarea', default:'Confused about which board to choose? Our experts help 500+ families every month at absolutely zero cost.' },
          { id:'ctaBenefit1',  label:'Benefit 1',             type:'text',     default:'CBSE vs ICSE vs IB — which board suits your child' },
          { id:'ctaBenefit2',  label:'Benefit 2',             type:'text',     default:'School shortlisting by budget, location & values' },
          { id:'ctaBenefit3',  label:'Benefit 3',             type:'text',     default:'Admission documents checklist & timelines' },
          { id:'ctaBookBtn',   label:'Book button text',      type:'text',     default:'Book Now — It's Free' },
          { id:'ctaBg',        label:'Section background',    type:'color',    default:'#FAF7F2', cssVar:'--counsel-bg' },
        ],
      },
    ],
  },
  {
    label: 'For Schools CTA', icon: '🏫', contentKey: 'for-schools',
    sections: [
      { id: 'schools-cta', label: 'For Schools Section',
        fields: [
          { id:'fsTitle',   label:'Headline',            type:'text',     default:'List Free. Buy Only What You Want.' },
          { id:'fsDesc',    label:'Description',         type:'textarea', default:'Parents applying through Thynk Schooling become leads. See masked info first.' },
          { id:'fsBtn1',    label:'Primary button text', type:'text',     default:'List Your School Free' },
          { id:'fsBtn2',    label:'Secondary button',    type:'text',     default:'View Pricing Plans' },
          { id:'fsBg',      label:'Background',          type:'color',    default:'#FAF7F2', cssVar:'--for-schools-bg' },
        ],
      },
    ],
  },
  {
    label: 'Testimonials', icon: '⭐', contentKey: 'testimonials',
    sections: [
      { id: 'testimonials', label: 'Testimonials Section',
        fields: [
          { id:'testTitle',    label:'Section title',        type:'text',     default:'Trusted by 1 Lakh+ Parents' },
          { id:'testBg',       label:'Background',           type:'color',    default:'#F5F0E8', cssVar:'--testimonials-bg' },
          { id:'test1Name',    label:'Testimonial 1 — Name', type:'text',     default:'Priya Sharma' },
          { id:'test1Role',    label:'Testimonial 1 — Role', type:'text',     default:'Parent, Delhi' },
          { id:'test1Quote',   label:'Testimonial 1 — Quote',type:'textarea', default:'Found the perfect CBSE school in 3 days. The AI recommendations were spot on!' },
          { id:'test2Name',    label:'Testimonial 2 — Name', type:'text',     default:'Rahul Mehta' },
          { id:'test2Role',    label:'Testimonial 2 — Role', type:'text',     default:'Parent, Mumbai' },
          { id:'test2Quote',   label:'Testimonial 2 — Quote',type:'textarea', default:'The counsellor saved us months of research. Got our daughter into her dream school.' },
          { id:'test3Name',    label:'Testimonial 3 — Name', type:'text',     default:'Anita Desai' },
          { id:'test3Role',    label:'Testimonial 3 — Role', type:'text',     default:'Parent, Pune' },
          { id:'test3Quote',   label:'Testimonial 3 — Quote',type:'textarea', default:'Compared 12 schools side by side. Never thought finding a school could be this simple.' },
        ],
      },
    ],
  },
  {
    label: 'Blog Preview', icon: '📝', contentKey: 'blog-preview',
    sections: [
      { id: 'blog', label: 'Blog Preview Section',
        fields: [
          { id:'blogTitle',   label:'Section title',   type:'text',  default:'Admission Insights' },
          { id:'blogCtaText', label:'View all button', type:'text',  default:'Read All Articles →' },
          { id:'blogBg',      label:'Background',      type:'color', default:'#FAF7F2', cssVar:'--blog-preview-bg' },
          { id:'blog1Title',  label:'Article 1 title', type:'text',  default:'CBSE vs ICSE vs IB: Which Board is Right for Your Child?' },
          { id:'blog2Title',  label:'Article 2 title', type:'text',  default:'How to Choose the Right School: 10 Questions to Ask' },
          { id:'blog3Title',  label:'Article 3 title', type:'text',  default:'Top 10 Boarding Schools in India 2026' },
        ],
      },
    ],
  },
  {
    label: 'School Profile Page', icon: '📋', contentKey: 'school-profile',
    sections: [
      { id: 'school-profile', label: 'School Profile Page',
        fields: [
          { id:'spBg',        label:'Page background',    type:'color', default:'#FAF7F2', cssVar:'--profile-page-bg' },
          { id:'spCardBg',    label:'Card background',    type:'color', default:'#ffffff', cssVar:'--profile-card-bg' },
          { id:'spNameColor', label:'School name colour', type:'color', default:'#0D1117', cssVar:'--profile-name-color' },
          { id:'spNameSize',  label:'School name size',   type:'size',  default:'36', cssVar:'--profile-name-size', min:20, max:56 },
          { id:'spMetaColor', label:'Meta text colour',   type:'color', default:'#718096', cssVar:'--profile-meta-color' },
        ],
      },
    ],
  },
  {
    label: 'Dashboard', icon: '📊', contentKey: 'dashboard',
    sections: [
      { id: 'dashboard', label: 'Dashboard Pages',
        fields: [
          { id:'dashBg',       label:'Background',          type:'color', default:'#FAF7F2', cssVar:'--dashboard-bg' },
          { id:'dashCardBg',   label:'Card background',     type:'color', default:'#ffffff', cssVar:'--dashboard-card-bg' },
          { id:'dashHeadingColor',label:'Heading colour',   type:'color', default:'#0D1117', cssVar:'--dashboard-heading-color' },
          { id:'dashHeadingSize', label:'Heading size',     type:'size',  default:'28', cssVar:'--dashboard-heading-size', min:18, max:48 },
        ],
      },
    ],
  },
  {
    label: 'Global Buttons', icon: '🔘', contentKey: 'buttons',
    sections: [
      {
        id: 'buttons', label: 'Button Styles',
        fields: [
          { id:'btnPrimaryBg',    label:'Primary button background', type:'color', cssVar:'--btn-primary-bg',    default:'#0D1117' },
          { id:'btnPrimaryColor', label:'Primary button text',       type:'color', cssVar:'--btn-primary-color', default:'#FAF7F2' },
          { id:'global.btnGoldBg',       label:'Gold button background',    type:'color', cssVar:'--btn-gold-bg',       default:'#B8860B' },
          { id:'global.btnGoldColor',    label:'Gold button text',          type:'color', cssVar:'--btn-gold-color',    default:'#ffffff' },
          { id:'btnSize',         label:'Button font size',          type:'size',  cssVar:'--btn-size',          default:'14', min:11, max:20 },
          { id:'radius',          label:'Border radius',             type:'size',  cssVar:'--radius',            default:'12', min:0, max:32 },
        ],
      },
    ],
  },
]

// Build ALL_FIELDS flat map
const ALL_CSS_FIELDS: Record<string, Field> = {}
PAGES.forEach(p => p.sections.forEach(s => s.fields.forEach(f => {
  if (f.cssVar) ALL_CSS_FIELDS[f.id] = f
})))

function buildCSSVars(values: Record<string, string>): string {
  const lines: string[] = []
  Object.entries(ALL_CSS_FIELDS).forEach(([id, field]) => {
    const val = values[id]
    if (val && val !== field.default) {
      const cssVal = field.type === 'size' ? `${val}px` : val
      lines.push(`  ${field.cssVar}: ${cssVal};`)
    }
  })
  return lines.length ? `:root {\n${lines.join('\n')}\n}` : ''
}

// ── UI Components ──────────────────────────────────────────────
const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'#fff', border:'1.5px solid #EDE5D8', borderRadius:'8px', fontSize:'13px', fontFamily:'Inter,sans-serif', color:'#0D1117', outline:'none', boxSizing:'border-box' as const }
const lbl: React.CSSProperties = { display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase' as const, color:'#718096', fontFamily:'Inter,sans-serif', marginBottom:'5px' }

function FieldRow({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(13,17,23,0.05)' }}>
      <label style={{ ...lbl, marginBottom:0, minWidth:'180px', flexShrink:0 }}>{field.label}</label>
      <div style={{ flex:1 }}>
        {field.type === 'color' && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="color" value={value || field.default}
              onChange={e => onChange(e.target.value)}
              style={{ width:36, height:32, border:'1.5px solid #EDE5D8', borderRadius:'7px', padding:'2px', cursor:'pointer', background:'none', flexShrink:0 }} />
            <input type="text" value={value || field.default}
              onChange={e => onChange(e.target.value)}
              style={{ ...inp, fontFamily:'monospace', fontSize:'12px', maxWidth:'160px' }} />
          </div>
        )}
        {field.type === 'size' && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <input type="range" min={field.min || 8} max={field.max || 100} value={Number(value || field.default)}
              onChange={e => onChange(e.target.value)}
              style={{ flex:1, accentColor:'#B8860B', cursor:'pointer' }} />
            <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#B8860B', minWidth:'52px', textAlign:'right' as const }}>
              {value || field.default}px
            </span>
          </div>
        )}
        {field.type === 'text' && (
          <input type="text" value={value || ''} placeholder={field.default}
            onChange={e => onChange(e.target.value)} style={inp} />
        )}
        {field.type === 'textarea' && (
          <textarea value={value || ''} placeholder={field.default}
            onChange={e => onChange(e.target.value)}
            style={{ ...inp, resize:'vertical' as const, lineHeight:1.6 }} rows={2} />
        )}
      </div>
      <button onClick={() => onChange('')} title="Reset to default"
        style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid #EDE5D8', background:'transparent', color:'#A0ADB8', cursor:'pointer', fontSize:'11px', flexShrink:0 }}>
        Reset
      </button>
    </div>
  )
}

export default function AdminContentPage() {
  const [values,       setValues]      = useState<Record<string,string>>({})
  const [activeGroup,  setActiveGroup] = useState('Homepage')
  const [openSections, setOpenSections]= useState<Record<string,boolean>>({ 'hero-text':true })
  const [savedGroups,  setSavedGroups] = useState<Record<string,boolean>>({})
  const [dirtyGroups,  setDirtyGroups] = useState<Record<string,boolean>>({})
  const [pushing,      setPushing]     = useState(false)

  // Load saved values on mount
  useEffect(() => {
    fetch('/api/admin/content', { cache:'no-store' })
      .then(r => r.json())
      .then(data => {
        const merged: Record<string,string> = {}
        // Merge all page content into flat values map
        if (data) {
          Object.entries(data).forEach(([key, val]: [string, any]) => {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              Object.entries(val).forEach(([k, v]) => {
                if (typeof v === 'string') merged[k] = v
              })
            }
          })
          // Also load content.styles if present
          if (data['content.styles']) Object.assign(merged, data['content.styles'])
        }
        setValues(merged)
      })
      .catch(() => {})
  }, [])

  const set = useCallback((id: string, v: string) => {
    setValues(p => ({ ...p, [id]: v }))
    setDirtyGroups(p => ({ ...p, [activeGroup]: true }))
    setSavedGroups(p => ({ ...p, [activeGroup]: false }))
    // Live preview
    const field = ALL_CSS_FIELDS[id]
    if (field?.cssVar) {
      const cssVal = field.type === 'size' ? `${v}px` : v
      document.documentElement.style.setProperty(field.cssVar, cssVal)
    }
  }, [activeGroup])

  const saveGroup = () => {
    setSavedGroups(p => ({ ...p, [activeGroup]: true }))
    setDirtyGroups(p => ({ ...p, [activeGroup]: false }))
    toast.success(`✅ "${activeGroup}" saved — push when ready`)
  }

  const pushAll = async () => {
    setPushing(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token') || '' : ''
    const save = async (key: string, value: any) => {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error(`Save failed for ${key}`)
    }
    try {
      const css = buildCSSVars(values)
      if (css) await save('content.css', css)
      for (const page of PAGES) {
        const pageValues: Record<string,string> = {}
        page.sections.forEach(s => s.fields.forEach(f => {
          if (values[f.id] !== undefined && values[f.id] !== '') pageValues[f.id] = values[f.id]
        }))
        if (Object.keys(pageValues).length > 0) await save(page.contentKey, pageValues)
      }
      setSavedGroups({})
      setDirtyGroups({})
      toast.success('🚀 All changes live on site!')
    } catch (e: any) { toast.error(e.message || 'Push failed') }
    setPushing(false)
  }

  const activePage = PAGES.find(p => p.label === activeGroup)
  const readyCount = Object.values(savedGroups).filter(Boolean).length

  return (
    <AdminLayout title="Content & Style Manager" subtitle="Edit text, colours and sizes — changes apply live">

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', padding:'12px 16px', background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px' }}>
        <span style={{ fontSize:'12px', color:'#718096', flex:1, fontFamily:'Inter,sans-serif' }}>
          {readyCount > 0 ? `${readyCount} group(s) ready to push` : 'Edit a section, save it, then push to site'}
        </span>
        <button onClick={saveGroup} disabled={!dirtyGroups[activeGroup]}
          style={{ padding:'8px 18px', borderRadius:'8px', background: dirtyGroups[activeGroup] ? '#FEF7E0' : '#f3f4f6', border:`1px solid ${dirtyGroups[activeGroup] ? '#B8860B' : '#e5e7eb'}`, color: dirtyGroups[activeGroup] ? '#B8860B' : '#9ca3af', cursor: dirtyGroups[activeGroup] ? 'pointer' : 'not-allowed', fontSize:'13px', fontWeight:700, fontFamily:'Inter,sans-serif' }}>
          ✓ Save {activeGroup}
        </button>
        <button onClick={pushAll} disabled={pushing || readyCount === 0}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'9px', background:'#B8860B', border:'none', color:'#fff', cursor:(pushing||readyCount===0)?'not-allowed':'pointer', fontSize:'13px', fontWeight:700, fontFamily:'Inter,sans-serif', opacity:(pushing||readyCount===0)?0.5:1 }}>
          {pushing ? <><Loader2 style={{width:13,height:13,animation:'spin 1s linear infinite'}}/>Pushing…</> : <><Globe style={{width:13,height:13}}/>Push to Site</>}
        </button>
      </div>

      {/* 3-col layout */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'14px', alignItems:'start' }}>

        {/* Left sidebar */}
        <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', overflow:'hidden', position:'sticky', top:'80px' }}>
          {PAGES.map(page => (
            <button key={page.label} onClick={() => setActiveGroup(page.label)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', border:'none', borderBottom:'1px solid rgba(13,17,23,0.05)', cursor:'pointer', textAlign:'left' as const,
                background: activeGroup===page.label ? 'rgba(184,134,11,0.07)' : '#fff',
                borderLeft: activeGroup===page.label ? '3px solid #B8860B' : '3px solid transparent' }}>
              <span style={{ fontSize:'16px' }}>{page.icon}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight: activeGroup===page.label ? 700 : 500, color: activeGroup===page.label ? '#B8860B' : '#0D1117' }}>{page.label}</span>
              {savedGroups[page.label] && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />}
              {dirtyGroups[page.label] && !savedGroups[page.label] && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {activePage?.sections.map(section => (
            <div key={section.id} style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', overflow:'hidden' }}>
              <button onClick={() => setOpenSections(p => ({ ...p, [section.id]: !p[section.id] }))}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', border:'none', background: openSections[section.id] ? 'rgba(184,134,11,0.03)' : '#fff', cursor:'pointer', textAlign:'left' as const }}>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700, color:'#B8860B', flex:1, textTransform:'uppercase' as const, letterSpacing:'1px' }}>{section.label}</span>
                {openSections[section.id] ? <ChevronDown style={{width:14,height:14,color:'#A0ADB8'}}/> : <ChevronRight style={{width:14,height:14,color:'#A0ADB8'}}/>}
              </button>
              {openSections[section.id] && (
                <div style={{ padding:'0 16px 8px' }}>
                  {section.fields.map(field => (
                    <FieldRow key={field.id} field={field} value={values[field.id] || ''} onChange={v => set(field.id, v)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
