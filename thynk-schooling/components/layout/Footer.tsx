'use client'
import Link from 'next/link'
import { GraduationCap, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Youtube, Facebook } from 'lucide-react'
import { useEffect, useState } from 'react'

const DEFAULT_LINKS: Record<string, [string, string][]> = {
  'For Parents': [['Find Schools','/schools'],['Compare Schools','/compare'],['Free Counselling','/counselling'],['AI Recommendations','/recommendations'],['Admission Guide','/blog/admission-guide']],
  'For Schools': [['List Your School','/register?role=school'],['School Dashboard','/dashboard/school'],['Lead Marketplace','/dashboard/school/leads'],['Pricing Plans','/pricing'],['Success Stories','/blog/success-stories']],
  'Company':     [['About Us','/about'],['Blog','/blog'],['Careers','/careers'],['Press','/press'],['Contact Us','/contact']],
  'Legal':       [['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Refund Policy','/refund'],['Grievance Officer','/grievance']],
}

// Cities loaded from DB (managed via Admin → Cities), fallback to hardcoded list
const FALLBACK_CITIES = [
  'Delhi','Mumbai','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad',
  'Jaipur','Lucknow','Surat','Kochi','Chandigarh','Nagpur','Indore','Bhopal',
  'Vadodara','Gurgaon','Noida','Coimbatore','Visakhapatnam','Mysore','Nashik',
  'Patna','Ranchi','Bhubaneswar','Guwahati','Dehradun','Agra','Varanasi',
  'Meerut','Faridabad','Amritsar','Kolhapur','Thiruvananthapuram','Srinagar',
  'Jodhpur','Aurangabad','Raipur','Vijayawada','Rajkot','Madurai','Jabalpur',
  'Jalandhar','Udaipur','Mangalore','Hubli','Thane','Navi Mumbai','Pimpri',
  'Ludhiana','Kanpur','Allahabad','Ghaziabad','Howrah','Solapur','Tiruchirappalli',
  'Bareilly','Moradabad','Gwalior','Aligarh','Saharanpur','Gorakhpur','Warangal',
  'Guntur','Bhiwandi','Cuttack','Kota','Durgapur','Ajmer','Siliguri','Kozhikode',
  'Thrissur','Bikaner','Nellore','Jammu','Shillong','Panaji','Shimla','Haridwar',
  'Rishikesh','Mathura','Vrindavan','Ayodhya','Dharamshala','Nainital',
]

interface FooterColumn { id?: string; heading: string; links: { id?: string; label: string; href: string; openNewTab?: boolean }[] }
type Media = Record<string, string>

export function Footer() {
  const [media, setMedia] = useState<Media>({})
  const [dbCities, setDbCities] = useState<{ name: string; slug: string }[]>([])
  const [footerCols, setFooterCols] = useState<FooterColumn[] | null>(null)

  useEffect(() => {
    fetch('/api/admin/media', { cache: 'no-store' }).then(r => r.json()).then(d => setMedia(d.data || {})).catch(() => {})
    fetch('/api/admin/cities', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.cities?.length) setDbCities(d.cities)
    }).catch(() => {})
    // Load menu from DB
    fetch('/api/admin?action=menus', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.footer) return
        // Normalize: could be array [{heading, links}] or object {heading: [[label,href]]}
        if (Array.isArray(d.footer) && d.footer.length) {
          setFooterCols(d.footer.map((col: any) => ({
            id: col.id,
            heading: col.heading,
            links: (col.links || []).map((l: any) => ({ label: l.label || l[0], href: l.href || l[1], openNewTab: l.openNewTab })),
          })))
        } else if (d.footer && typeof d.footer === 'object' && !Array.isArray(d.footer)) {
          setFooterCols(Object.entries(d.footer).map(([heading, links]) => ({
            heading,
            links: (links as any[]).map(l => ({ label: l[0] || l.label, href: l[1] || l.href, openNewTab: l.openNewTab })),
          })))
        }
      })
      .catch(() => {})
  }, [])

  // Resolve which columns to render
  const columns: FooterColumn[] = footerCols ?? Object.entries(DEFAULT_LINKS).map(([heading, links]) => ({
    heading,
    links: links.map(([label, href]) => ({ label, href })),
  }))

  const socialLinks = [
    { icon: Instagram, href: media.socialInstagram || '#', label: 'Instagram' },
    { icon: Twitter,   href: media.socialTwitter   || '#', label: 'Twitter'   },
    { icon: Linkedin,  href: media.socialLinkedin  || '#', label: 'LinkedIn'  },
    { icon: Youtube,   href: media.socialYoutube   || '#', label: 'YouTube'   },
    { icon: Facebook,  href: media.socialFacebook  || '#', label: 'Facebook'  },
  ]

  return (
    <>
      <style>{`
        .ft-link{color:rgba(250,247,242,0.4);text-decoration:none;font-size:13px;font-weight:300;transition:color .2s;font-family:Inter,sans-serif}
        .ft-link:hover{color:#B8860B}
        .ft-social{width:32px;height:32px;border-radius:7px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(250,247,242,0.4);transition:all .2s}
        .ft-social:hover{color:#B8860B;border-color:rgba(184,134,11,0.3);background:rgba(184,134,11,0.06)}
        .ft-city{display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:11px;color:rgba(250,247,242,0.4);padding:4px 10px;border-radius:100px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);transition:all .18s;text-decoration:none}
        .ft-city:hover{border-color:rgba(184,134,11,0.3);color:#B8860B;background:rgba(184,134,11,0.05)}
      `}</style>
      <footer style={{ background:'var(--footer-bg,#0D1117)', color:'var(--footer-text-color,rgba(250,247,242,0.5))', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--footer-text-size,14px)' }}>
        <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'0 clamp(16px,4vw,60px)' }}>

          {/* Main grid */}
          <div style={{ display:'grid', gridTemplateColumns:`minmax(240px,1.4fr) repeat(${columns.length},1fr)`, gap:'40px', padding:'64px 0 48px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>

            {/* Brand column */}
            <div>
              <Link href="/" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px', textDecoration:'none' }}>
                {media.logoUrl ? (
                  <img src={media.logoUrl} alt={media.brandName || 'Thynk Schooling'} style={{ height:32, objectFit:'contain' }} />
                ) : (
                  <>
                    <div style={{ width:'32px', height:'32px', borderRadius:'7px', background:'rgba(232,197,71,0.12)', border:'1px solid rgba(184,134,11,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <GraduationCap style={{ width:'15px', height:'15px', color:'#E8C547' }} />
                    </div>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'18px', color:'#FAF7F2', letterSpacing:'-.2px' }}>
                      {media.brandName || <><span>Thynk</span><em style={{ fontStyle:'italic', color:'#B8860B' }}>Schooling</em></>}
                    </span>
                  </>
                )}
              </Link>
              <p style={{ fontSize:'13px', lineHeight:1.8, marginBottom:'22px', maxWidth:'260px', fontWeight:300, color:'rgba(250,247,242,0.4)' }}>
                {media.tagline || "India's most trusted school admission platform. Connecting 1 lakh+ parents with 12,000+ verified schools."}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'22px' }}>
                <a href={`mailto:${media.contactEmail || 'hello@thynkschooling.in'}`} className="ft-link" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <Mail style={{ width:'13px', height:'13px', flexShrink:0 }} /> {media.contactEmail || 'hello@thynkschooling.in'}
                </a>
                <a href={`tel:${media.contactPhone || '+918800000000'}`} className="ft-link" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <Phone style={{ width:'13px', height:'13px', flexShrink:0 }} /> {media.contactPhone || '+91 88000 00000'}
                </a>
                <span style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:300, color:'rgba(250,247,242,0.4)' }}>
                  <MapPin style={{ width:'13px', height:'13px', flexShrink:0 }} /> {media.contactAddress || 'New Delhi, India'}
                </span>
              </div>
              <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label} className="ft-social">
                    <Icon style={{ width:'13px', height:'13px' }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Dynamic link columns from DB or fallback */}
            {columns.map(col => (
              <div key={col.heading}>
                <h4 style={{ fontFamily:'Inter,sans-serif', fontSize:'var(--footer-heading-size,11px)', fontWeight:700, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--footer-link-hover,#B8860B)', marginBottom:'18px' }}>
                  {col.heading}
                </h4>
                <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:'10px' }}>
                  {col.links.map(link => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="ft-link"
                        target={link.openNewTab ? '_blank' : undefined}
                        rel={link.openNewTab ? 'noreferrer' : undefined}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Cities — full list for SEO */}
          <div style={{ padding:'28px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize:'10px', fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(184,134,11,0.5)', marginBottom:'14px' }}>
              Schools by City — India&apos;s Most Complete School Directory
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {(dbCities.length > 0 ? dbCities.map(c => c.name) : FALLBACK_CITIES).map(city => (
                <Link key={city} href={`/schools?city=${city.toLowerCase().replace(/\s+/g,'-')}`} className="ft-city">
                  {city}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'12px', padding:'20px 0', fontSize:'12px' }}>
            <span style={{ color:'rgba(250,247,242,0.25)', fontWeight:300 }}>
              © {new Date().getFullYear()} {media.brandName || 'Thynk Schooling'}. All rights reserved.
            </span>
            <span style={{ color:'rgba(250,247,242,0.25)', fontWeight:300 }}>
              Made with <span style={{ color:'#B8860B' }}>♥</span> for Indian Parents
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
