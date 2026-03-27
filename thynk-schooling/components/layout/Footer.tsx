import Link from 'next/link'
import { GraduationCap, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { config } from '@/lib/config'

const LINKS = {
  'For Parents': [
    { label: 'Find Schools',       href: '/schools' },
    { label: 'Compare Schools',    href: '/compare' },
    { label: 'Free Counselling',   href: '/counselling' },
    { label: 'AI Recommendations', href: '/recommendations' },
    { label: 'Admission Guide',    href: '/blog/admission-guide' },
  ],
  'For Schools': [
    { label: 'List Your School',   href: '/register?role=school' },
    { label: 'School Dashboard',   href: '/dashboard/school' },
    { label: 'Lead Marketplace',   href: '/dashboard/school/leads' },
    { label: 'Pricing Plans',      href: '/pricing' },
    { label: 'Success Stories',    href: '/blog/success-stories' },
  ],
  'Company': [
    { label: 'About Us',           href: '/about' },
    { label: 'Blog',               href: '/blog' },
    { label: 'Careers',            href: '/careers' },
    { label: 'Press',              href: '/press' },
    { label: 'Contact Us',         href: '/contact' },
  ],
  'Legal': [
    { label: 'Privacy Policy',     href: '/privacy' },
    { label: 'Terms of Service',   href: '/terms' },
    { label: 'Refund Policy',      href: '/refund' },
    { label: 'Grievance Officer',  href: '/grievance' },
  ],
}

const SOCIAL = [
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Twitter,   href: 'https://twitter.com',   label: 'Twitter' },
  { icon: Linkedin,  href: 'https://linkedin.com',  label: 'LinkedIn' },
  { icon: Youtube,   href: 'https://youtube.com',   label: 'YouTube' },
]

const TOP_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow']

export function Footer() {
  return (
    <footer style={{ background: 'var(--forest-950)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Main grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1E4D2B, #276338)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 0 16px rgba(212,175,55,0.12)' }}>
                <GraduationCap className="w-5 h-5" style={{ color: '#D4AF37' }} />
              </div>
              <div className="font-serif font-bold text-xl" style={{ color: '#F0EDD8' }}>
                Thynk<span style={{ color: '#D4AF37' }}>Schooling</span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'rgba(240,237,216,0.45)', fontFamily: 'DM Sans', fontWeight: 300 }}>
              India&apos;s most trusted school admission platform. Connecting 1 lakh+ parents with 12,000+ verified schools pan-India.
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { icon: Mail,  href: 'mailto:hello@thynkschooling.in', label: 'hello@thynkschooling.in' },
                { icon: Phone, href: 'tel:+918800000000',              label: '+91 88000 00000' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} className="flex items-center gap-2 text-sm transition-colors"
                  style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(240,237,216,0.4)'}>
                  <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                </a>
              ))}
              <span className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>
                <MapPin className="w-4 h-4" /> New Delhi, India
              </span>
            </div>

            <div className="flex items-center gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(240,237,216,0.4)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#D4AF37'; el.style.borderColor = 'rgba(212,175,55,0.3)'; el.style.background = 'rgba(212,175,55,0.06)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(240,237,216,0.4)'; el.style.borderColor = 'rgba(212,175,55,0.12)'; el.style.background = 'rgba(255,255,255,0.03)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-medium tracking-widest uppercase mb-5" style={{ color: '#D4AF37', fontFamily: 'DM Sans' }}>{heading}</h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm transition-colors"
                      style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans', fontWeight: 300 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(240,237,216,0.4)'}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="py-5" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(212,175,55,0.4)', fontFamily: 'DM Sans' }}>Schools by City</p>
          <div className="flex flex-wrap gap-2">
            {TOP_CITIES.map(city => (
              <Link key={city} href={`/schools?city=${city.toLowerCase()}`} className="tag text-xs">
                Schools in {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(240,237,216,0.3)', fontFamily: 'DM Sans' }}>
            © {new Date().getFullYear()} {config.app.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(240,237,216,0.3)', fontFamily: 'DM Sans' }}>
            Made with <span style={{ color: '#D4AF37' }}>♥</span> for Indian Parents
          </div>
        </div>
      </div>
    </footer>
  )
}
