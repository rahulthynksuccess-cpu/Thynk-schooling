'use client'
import Link from 'next/link'
import { GraduationCap, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react'
import { config } from '@/lib/config'

const LINKS = {
  'For Parents': [['Find Schools','/schools'],['Compare Schools','/compare'],['Free Counselling','/counselling'],['AI Recommendations','/recommendations'],['Admission Guide','/blog/admission-guide']],
  'For Schools': [['List Your School','/register?role=school'],['School Dashboard','/dashboard/school'],['Lead Marketplace','/dashboard/school/leads'],['Pricing Plans','/pricing'],['Success Stories','/blog/success-stories']],
  'Company':     [['About Us','/about'],['Blog','/blog'],['Careers','/careers'],['Press','/press'],['Contact Us','/contact']],
  'Legal':       [['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Refund Policy','/refund'],['Grievance Officer','/grievance']],
}
const SOCIAL = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter,   href: '#', label: 'Twitter'   },
  { icon: Linkedin,  href: '#', label: 'LinkedIn'  },
  { icon: Youtube,   href: '#', label: 'YouTube'   },
]
const CITIES = ['Delhi','Mumbai','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Lucknow']

export function Footer() {
  return (
    <>
      <style>{`
        .ft-link { color: rgba(250,247,242,0.4); text-decoration: none; font-size: 13px; font-weight: 300; transition: color .2s; font-family: Inter, sans-serif; }
        .ft-link:hover { color: #B8860B; }
        .ft-social { width:32px; height:32px; border-radius:7px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; color:rgba(250,247,242,0.4); transition:all .2s; }
        .ft-social:hover { color:#B8860B; border-color:rgba(184,134,11,0.3); background:rgba(184,134,11,0.06); }
        .ft-city { display:inline-flex; align-items:center; font-family:Inter,sans-serif; font-size:11px; font-weight:400; color:rgba(250,247,242,0.4); padding:5px 12px; border-radius:100px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); cursor:pointer; transition:all .18s; text-decoration:none; }
        .ft-city:hover { border-color:rgba(184,134,11,0.3); color:#B8860B; background:rgba(184,134,11,0.06); }
      `}</style>
      <footer style={{ background:'var(--footer-bg,#0D1117)', color:'var(--footer-text-color,rgba(250,247,242,0.5))', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--footer-text-size,14px)' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>

          {/* Main grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'32px', padding:'60px 0 48px' }}>

            {/* Brand */}
            <div>
              <Link href="/" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px', textDecoration:'none' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'7px', background:'rgba(232,197,71,0.12)', border:'1px solid rgba(184,134,11,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <GraduationCap style={{ width:'15px', height:'15px', color:'#E8C547' }} />
                </div>
                <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'17px', color:'#FAF7F2', letterSpacing:'-.2px' }}>
                  Thynk<em style={{ fontStyle:'italic', color:'#B8860B' }}>Schooling</em>
                </span>
              </Link>
              <p style={{ fontSize:'13px', lineHeight:1.75, marginBottom:'22px', maxWidth:'240px', fontWeight:300 }}>
                India&apos;s most trusted school admission platform. Connecting 1 lakh+ parents with 12,000+ verified schools pan-India.
              </p>

              {/* Contact */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
                <a href="mailto:hello@thynkschooling.in" className="ft-link" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <Mail style={{ width:'13px', height:'13px', flexShrink:0 }} /> hello@thynkschooling.in
                </a>
                <a href="tel:+918800000000" className="ft-link" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <Phone style={{ width:'13px', height:'13px', flexShrink:0 }} /> +91 88000 00000
                </a>
                <span style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:300, color:'rgba(250,247,242,0.4)' }}>
                  <MapPin style={{ width:'13px', height:'13px', flexShrink:0 }} /> New Delhi, India
                </span>
              </div>

              {/* Social */}
              <div style={{ display:'flex', gap:'7px' }}>
                {SOCIAL.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label} className="ft-social">
                    <Icon style={{ width:'13px', height:'13px' }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 style={{ fontFamily:'Inter,sans-serif', fontSize:'var(--footer-heading-size,12px)', fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--footer-link-hover,#B8860B)', marginBottom:'16px' }}>
                  {heading}
                </h4>
                <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:'10px' }}>
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="ft-link">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Cities */}
          <div style={{ padding:'22px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize:'10px', fontWeight:500, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(184,134,11,0.5)', marginBottom:'12px' }}>
              Schools by City
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {CITIES.map(city => (
                <Link key={city} href={`/schools?city=${city.toLowerCase()}`} className="ft-city">
                  Schools in {city}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', borderTop:'1px solid rgba(255,255,255,0.05)', fontSize:'12px' }}>
            <span style={{ color:'rgba(250,247,242,0.3)', fontWeight:300 }}>
              © {new Date().getFullYear()} {config.app.name}. All rights reserved.
            </span>
            <span style={{ color:'rgba(250,247,242,0.3)', display:'flex', alignItems:'center', gap:'4px', fontWeight:300 }}>
              Made with <span style={{ color:'#B8860B' }}>♥</span> for Indian Parents
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
