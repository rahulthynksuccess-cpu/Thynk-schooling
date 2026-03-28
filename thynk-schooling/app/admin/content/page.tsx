'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Page definitions with editable fields ── */
const PAGES = [
  {
    key: 'home',
    label: '🏠 Homepage',
    url: '/',
    fields: [
      { key: 'eyebrow',     label: 'Eyebrow Text',       type: 'text',     placeholder: 'AI-Powered School Matching — Free for Parents' },
      { key: 'h1Line1',     label: 'H1 Line 1',          type: 'text',     placeholder: 'Find the' },
      { key: 'h1Italic',    label: 'H1 Italic Word',     type: 'text',     placeholder: 'Perfect School' },
      { key: 'h1Line3',     label: 'H1 Line 3',          type: 'text',     placeholder: 'for Your Child' },
      { key: 'subtext',     label: 'Hero Subtext',        type: 'textarea', placeholder: 'Search, compare & apply to 12,000+ verified schools...' },
      { key: 'searchPlaceholder', label: 'Search Placeholder', type: 'text', placeholder: 'School name, board, or keyword…' },
      { key: 'ctaPrimary',  label: 'Primary CTA Button',  type: 'text',    placeholder: 'Search Schools' },
      { key: 'ctaSecondary',label: 'Secondary CTA Button',type: 'text',    placeholder: 'Free Counselling' },
      { key: 'stat1Num',    label: 'Stat 1 Number',       type: 'text',    placeholder: '12,000+' },
      { key: 'stat1Label',  label: 'Stat 1 Label',        type: 'text',    placeholder: 'Verified Schools' },
      { key: 'stat2Num',    label: 'Stat 2 Number',       type: 'text',    placeholder: '1 Lakh+' },
      { key: 'stat2Label',  label: 'Stat 2 Label',        type: 'text',    placeholder: 'Happy Parents' },
      { key: 'stat3Num',    label: 'Stat 3 Number',       type: 'text',    placeholder: '35+' },
      { key: 'stat3Label',  label: 'Stat 3 Label',        type: 'text',    placeholder: 'Cities' },
      { key: 'whyTitle',    label: '"Why Choose Us" Title',type: 'text',   placeholder: 'Why 1 Lakh+ Parents Trust Thynk' },
      { key: 'howTitle',    label: '"How It Works" Title', type: 'text',   placeholder: 'Find Your School in 3 Steps' },
    ],
  },
  {
    key: 'about',
    label: '📖 About Page',
    url: '/about',
    fields: [
      { key: 'h1',          label: 'Page Title',          type: 'text',     placeholder: 'About Thynk Schooling' },
      { key: 'mission',     label: 'Mission Statement',   type: 'textarea', placeholder: 'Our mission is...' },
      { key: 'vision',      label: 'Vision Statement',    type: 'textarea', placeholder: 'Our vision is...' },
      { key: 'founderName', label: 'Founder Name',        type: 'text',     placeholder: 'Founder Name' },
      { key: 'founderBio',  label: 'Founder Bio',         type: 'textarea', placeholder: 'Bio text here...' },
    ],
  },
  {
    key: 'counselling',
    label: '🎓 Counselling Page',
    url: '/counselling',
    fields: [
      { key: 'h1',          label: 'Page Headline',       type: 'text',     placeholder: 'Free 1-on-1 School Counselling' },
      { key: 'subtext',     label: 'Subtext',             type: 'textarea', placeholder: 'Our expert counsellors help you...' },
      { key: 'ctaLabel',    label: 'CTA Button Text',     type: 'text',     placeholder: 'Book Free Session' },
      { key: 'benefit1',    label: 'Benefit 1',           type: 'text',     placeholder: 'Personalised school shortlist' },
      { key: 'benefit2',    label: 'Benefit 2',           type: 'text',     placeholder: 'Application guidance' },
      { key: 'benefit3',    label: 'Benefit 3',           type: 'text',     placeholder: '100% free service' },
    ],
  },
  {
    key: 'pricing',
    label: '💰 Pricing Page',
    url: '/pricing',
    fields: [
      { key: 'h1',          label: 'Page Headline',       type: 'text',     placeholder: 'Simple, Transparent Pricing' },
      { key: 'subtext',     label: 'Subtext',             type: 'textarea', placeholder: 'Everything your school needs...' },
      { key: 'plan1Name',   label: 'Plan 1 Name',         type: 'text',     placeholder: 'Starter' },
      { key: 'plan1Price',  label: 'Plan 1 Price',        type: 'text',     placeholder: '₹2,999/mo' },
      { key: 'plan1Desc',   label: 'Plan 1 Description',  type: 'textarea', placeholder: 'Perfect for small schools' },
      { key: 'plan2Name',   label: 'Plan 2 Name',         type: 'text',     placeholder: 'Growth' },
      { key: 'plan2Price',  label: 'Plan 2 Price',        type: 'text',     placeholder: '₹5,999/mo' },
      { key: 'plan2Desc',   label: 'Plan 2 Description',  type: 'textarea', placeholder: 'For growing schools' },
      { key: 'plan3Name',   label: 'Plan 3 Name',         type: 'text',     placeholder: 'Enterprise' },
      { key: 'plan3Price',  label: 'Plan 3 Price',        type: 'text',     placeholder: 'Custom' },
      { key: 'plan3Desc',   label: 'Plan 3 Description',  type: 'textarea', placeholder: 'For large school groups' },
    ],
  },
  {
    key: 'footer',
    label: '🦶 Footer (Global)',
    url: '/',
    fields: [
      { key: 'tagline',     label: 'Footer Tagline',      type: 'textarea', placeholder: 'Find the perfect school for your child...' },
      { key: 'address',     label: 'Address',             type: 'textarea', placeholder: 'Thynk Success Pvt. Ltd., Mumbai' },
      { key: 'email',       label: 'Contact Email',       type: 'text',     placeholder: 'hello@thynkschooling.com' },
      { key: 'phone',       label: 'Contact Phone',       type: 'text',     placeholder: '+91 98765 43210' },
      { key: 'copyright',   label: 'Copyright Text',      type: 'text',     placeholder: '© 2026 Thynk Success Pvt. Ltd.' },
    ],
  },
  {
    key: 'seo',
    label: '🔍 SEO & Meta',
    url: '/',
    fields: [
      { key: 'siteTitle',   label: 'Site Title',          type: 'text',     placeholder: 'Thynk Schooling' },
      { key: 'homeMetaTitle', label: 'Home Meta Title',   type: 'text',     placeholder: 'Find the Best Schools in India' },
      { key: 'homeMetaDesc',  label: 'Home Meta Description', type: 'textarea', placeholder: 'Search, compare and apply to 12,000+ schools...' },
      { key: 'ogImage',     label: 'Default OG Image URL', type: 'text',    placeholder: 'https://...' },
    ],
  },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid rgba(13,17,23,0.12)',
  borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter,sans-serif',
  color: '#0D1117', background: '#fff', outline: 'none', boxSizing: 'border-box' as const,
  transition: 'border-color .15s',
}

export default function AdminContentPage() {
  const qc = useQueryClient()
  const [activeKey, setActiveKey] = useState(PAGES[0].key)
  const [showPreview, setShowPreview] = useState(false)
  const activePage = PAGES.find(p => p.key === activeKey)!

  const { data, isLoading } = useQuery({
    queryKey: ['page-content', activeKey],
    queryFn: () => apiGet<{ content: Record<string, string> }>(`/admin/content?key=${activeKey}`),
  })

  const [fields, setFields] = useState<Record<string, string>>({})
  const content: Record<string, string> = data?.content ?? {}

  const getValue = (key: string) => fields[key] ?? content[key] ?? ''
  const handleChange = (key: string, val: string) => setFields(p => ({ ...p, [key]: val }))

  const saveMutation = useMutation({
    mutationFn: () => apiPost('/admin/content', {
      key: activeKey,
      value: { ...content, ...fields },
    }),
    onSuccess: () => {
      toast.success('✅ Content saved!')
      qc.invalidateQueries({ queryKey: ['page-content', activeKey] })
      setFields({})
    },
    onError: () => toast.error('Failed to save'),
  })

  return (
    <AdminLayout title="Page Content" subtitle="Edit text content for all pages — changes apply site-wide">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>

        {/* LEFT — page list */}
        <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          {PAGES.map(p => (
            <button key={p.key} onClick={() => { setActiveKey(p.key); setFields({}) }}
              style={{
                width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid rgba(13,17,23,0.05)',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '13px', fontWeight: activeKey === p.key ? 600 : 400,
                textAlign: 'left', background: activeKey === p.key ? 'rgba(184,134,11,0.08)' : '#fff',
                color: activeKey === p.key ? '#B8860B' : '#0D1117',
                transition: 'all .15s',
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* RIGHT — fields + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ flex: 1, fontFamily: 'Inter,sans-serif', fontSize: '13px', fontWeight: 600, color: '#0D1117' }}>{activePage.label}</span>
            <button onClick={() => setShowPreview(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(13,17,23,0.1)', background: showPreview ? 'rgba(184,134,11,0.08)' : 'rgba(13,17,23,0.04)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '12px', color: showPreview ? '#B8860B' : '#718096' }}>
              {showPreview ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 22px', borderRadius: '8px', background: '#0D1117', border: 'none', color: '#FAF7F2', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter,sans-serif', opacity: saveMutation.isPending ? .7 : 1 }}>
              {saveMutation.isPending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
              Save Content
            </button>
          </div>

          {/* Fields */}
          <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '12px', padding: '24px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: '13px' }}>Loading content…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {activePage.fields.map(f => (
                  <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? 'span 2' : 'span 1' }}>
                    <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#718096', marginBottom: '6px' }}>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea value={getValue(f.key)} onChange={e => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder} rows={3}
                        style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                    ) : (
                      <input type="text" value={getValue(f.key)} onChange={e => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder} style={inp} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live page preview */}
          {showPreview && (
            <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter,sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A0ADB8' }}>
                <Eye style={{ width: 12, height: 12 }} /> Live Page Preview — {activePage.url}
              </div>
              <iframe
                src={activePage.url}
                style={{ width: '100%', height: '600px', border: 'none', display: 'block' }}
                title="Page Preview"
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
