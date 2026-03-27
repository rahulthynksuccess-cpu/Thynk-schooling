import Link from 'next/link'
import { GraduationCap, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { config } from '@/lib/config'

const FOOTER_LINKS = {
  'For Parents': [
    { label: 'Find Schools',         href: '/schools' },
    { label: 'Compare Schools',      href: '/compare' },
    { label: 'Free Counselling',     href: '/counselling' },
    { label: 'AI Recommendations',   href: '/recommendations' },
    { label: 'Admission Guide',      href: '/blog/admission-guide' },
  ],
  'For Schools': [
    { label: 'List Your School',     href: '/register?role=school' },
    { label: 'School Dashboard',     href: '/dashboard/school' },
    { label: 'Lead Marketplace',     href: '/dashboard/school/leads' },
    { label: 'Pricing Plans',        href: '/pricing' },
    { label: 'Success Stories',      href: '/blog/success-stories' },
  ],
  'Company': [
    { label: 'About Us',             href: '/about' },
    { label: 'Blog',                 href: '/blog' },
    { label: 'Careers',              href: '/careers' },
    { label: 'Press',                href: '/press' },
    { label: 'Contact Us',           href: '/contact' },
  ],
  'Legal': [
    { label: 'Privacy Policy',       href: '/privacy' },
    { label: 'Terms of Service',     href: '/terms' },
    { label: 'Refund Policy',        href: '/refund' },
    { label: 'Grievance Officer',    href: '/grievance' },
  ],
}

const SOCIAL = [
  { icon: Instagram, href: 'https://instagram.com/thynkschooling', label: 'Instagram' },
  { icon: Twitter,   href: 'https://twitter.com/thynkschooling',   label: 'Twitter' },
  { icon: Linkedin,  href: 'https://linkedin.com/company/thynkschooling', label: 'LinkedIn' },
  { icon: Youtube,   href: 'https://youtube.com/@thynkschooling',  label: 'YouTube' },
]

const TOP_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow']

export function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-surface-border">
      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Thynk<span className="text-orange-500">Schooling</span>
              </span>
            </Link>
            <p className="text-navy-300 text-sm leading-relaxed mb-6 max-w-xs">
              India's most trusted school admission platform. Connecting 1 lakh+ parents with 12,000+ verified schools pan-India.
            </p>
            <div className="flex flex-col gap-2 text-sm text-navy-300">
              <a href="mailto:hello@thynkschooling.in" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Mail className="w-4 h-4" /> hello@thynkschooling.in
              </a>
              <a href="tel:+918800000000" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Phone className="w-4 h-4" /> +91 88000 00000
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> New Delhi, India
              </span>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-navy-300 hover:text-orange-400 hover:border-orange-500/30 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display font-bold text-white text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-navy-300 text-sm hover:text-orange-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="py-6 border-t border-surface-border">
          <p className="text-navy-400 text-xs font-display font-semibold mb-3">Schools by City</p>
          <div className="flex flex-wrap gap-2">
            {TOP_CITIES.map((city) => (
              <Link
                key={city}
                href={`/schools/${city.toLowerCase()}`}
                className="tag hover:border-orange-500/30 hover:text-orange-400 transition-all"
              >
                Schools in {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-400 text-sm">
            © {new Date().getFullYear()} {config.app.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-navy-400 text-xs">Made with</span>
            <span className="text-orange-500 text-sm">♥</span>
            <span className="text-navy-400 text-xs">for Indian Parents</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
