'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, Image as ImageIcon, Link, Instagram, Twitter, Linkedin, Youtube, Facebook } from 'lucide-react'
import toast from 'react-hot-toast'

const SECTIONS = [
  {
    title: 'Logo & Brand',
    fields: [
      { key: 'logoUrl',       label: 'Logo Image URL',           hint: 'Displayed in navbar & footer' },
      { key: 'faviconUrl',    label: 'Favicon URL',              hint: '.ico or .png, shown in browser tab' },
      { key: 'brandName',     label: 'Brand Name',               hint: 'Overrides "Thynk Schooling" everywhere' },
      { key: 'tagline',       label: 'Tagline',                  hint: 'Short brand tagline shown in footer' },
    ],
  },
  {
    title: 'Homepage Images',
    fields: [
      { key: 'heroImage',         label: 'Hero Section Image (right side)', hint: 'Paste any image URL — Unsplash, CDN, etc.' },
      { key: 'whySectionImage',   label: 'Why Choose Us — Background Image', hint: 'Optional decorative background' },
      { key: 'howSectionImage',   label: 'How It Works — Illustration',      hint: 'Optional right-side graphic' },
      { key: 'statsSectionBg',    label: 'Stats Bar Background Image',       hint: 'Optional texture/pattern URL' },
      { key: 'counsellingImage',  label: 'Counselling CTA Image',            hint: 'Image shown on counselling section' },
      { key: 'aboutHeroImage',    label: 'About Page Hero Image',            hint: '' },
    ],
  },
  {
    title: 'School Listing & Profile',
    fields: [
      { key: 'schoolListingBanner', label: 'School Listing Page Banner',  hint: 'Top banner image on /schools page' },
      { key: 'defaultSchoolLogo',   label: 'Default School Logo',         hint: 'Shown when a school has no logo' },
      { key: 'defaultSchoolCover',  label: 'Default School Cover Image',  hint: 'Shown when a school has no cover photo' },
    ],
  },
  {
    title: 'Social Media Links',
    fields: [
      { key: 'socialInstagram', label: 'Instagram URL',  hint: 'https://instagram.com/yourpage' },
      { key: 'socialTwitter',   label: 'Twitter / X URL', hint: 'https://twitter.com/yourhandle' },
      { key: 'socialLinkedin',  label: 'LinkedIn URL',   hint: 'https://linkedin.com/company/...' },
      { key: 'socialYoutube',   label: 'YouTube URL',    hint: 'https://youtube.com/@yourchannel' },
      { key: 'socialFacebook',  label: 'Facebook URL',   hint: 'https://facebook.com/yourpage' },
    ],
  },
  {
    title: 'Contact Information',
    fields: [
      { key: 'contactEmail',   label: 'Contact Email',   hint: 'Shown in footer & contact page' },
      { key: 'contactPhone',   label: 'Phone Number',    hint: 'e.g. +91 88000 00000' },
      { key: 'contactAddress', label: 'Office Address',  hint: 'City, State shown in footer' },
      { key: 'whatsappNumber', label: 'WhatsApp Number', hint: 'Used for WhatsApp chat button' },
    ],
  },
]

const SOCIAL_ICONS: Record<string, any> = {
  socialInstagram: Instagram,
  socialTwitter: Twitter,
  socialLinkedin: Linkedin,
  socialYoutube: Youtube,
  socialFacebook: Facebook,
}

export default function AdminMediaPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    fetch('/api/admin/media', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setValues(d.data || {}))
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('✅ Media & branding settings saved!')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
    setSaving(false)
  }

  const set = (key: string, val: string) => setValues(p => ({ ...p, [key]: val }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'var(--admin-card-bg,rgba(255,255,255,0.06))', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans,sans-serif',
    color: 'var(--admin-text,rgba(255,255,255,0.9))', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <AdminLayout title="Media & Branding" subtitle="Update logo, images, social links and contact info — all editable, nothing hardcoded">

      {/* Save bar */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10, background:'#B8860B', border:'none', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'DM Sans,sans-serif', opacity: saving ? .7 : 1 }}>
          {saving ? <><Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> Saving…</> : <><Save style={{ width:14, height:14 }} /> Save All Changes</>}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ background:'var(--admin-card-bg,rgba(255,255,255,0.04))', border:'1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(184,134,11,0.06)' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#E8C547', margin:0 }}>{section.title}</h3>
            </div>
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {section.fields.map(field => {
                const SocialIcon = SOCIAL_ICONS[field.key]
                const isImage = field.key.toLowerCase().includes('image') || field.key.toLowerCase().includes('logo') || field.key.toLowerCase().includes('cover') || field.key.toLowerCase().includes('banner') || field.key.toLowerCase().includes('favicon') || field.key.toLowerCase().includes('bg')
                const isUrl = field.key.toLowerCase().includes('social') || field.key.toLowerCase().includes('url')
                return (
                  <div key={field.key} style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16, alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:3, display:'flex', alignItems:'center', gap:6 }}>
                        {SocialIcon && <SocialIcon style={{ width:13, height:13, color:'#B8860B' }} />}
                        {isImage && !SocialIcon && <ImageIcon style={{ width:13, height:13, color:'#B8860B' }} />}
                        {isUrl && !SocialIcon && !isImage && <Link style={{ width:13, height:13, color:'#B8860B' }} />}
                        {field.label}
                      </div>
                      {field.hint && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'var(--admin-text-faint,rgba(255,255,255,0.3))', lineHeight:1.5 }}>{field.hint}</div>}
                    </div>
                    <div>
                      <input
                        value={values[field.key] || ''}
                        onChange={e => set(field.key, e.target.value)}
                        placeholder={isImage ? 'https://...' : isUrl ? 'https://...' : ''}
                        style={inp}
                      />
                      {/* Image preview */}
                      {isImage && values[field.key] && (
                        <div style={{ marginTop:8, borderRadius:8, overflow:'hidden', maxHeight:120, border:'1px solid rgba(255,255,255,0.1)' }}>
                          <img src={values[field.key]} alt="" style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
