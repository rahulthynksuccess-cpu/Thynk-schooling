import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const STATS = [
  { value: '12,000+', label: 'Verified Schools' },
  { value: '1 Lakh+', label: 'Parents Helped'  },
  { value: '35+',     label: 'Indian Cities'    },
  { value: '2021',    label: 'Founded'          },
]

const TEAM = [
  { name: 'Arjun Mehra',    role: 'Co-Founder & CEO',     initials: 'AM', desc: 'Former IIT Delhi, 10 years in EdTech across India and Southeast Asia.' },
  { name: 'Priya Nair',     role: 'Co-Founder & CPO',     initials: 'PN', desc: 'Ex-BYJU\'S product lead. Passionate about making education accessible.' },
  { name: 'Rahul Agarwal',  role: 'Head of School Ops',   initials: 'RA', desc: 'Built partnerships with 8,000+ schools across 20 Indian cities.' },
  { name: 'Sneha Krishnan', role: 'Head of Counselling',  initials: 'SK', desc: 'Certified education counsellor with 12 years of parent advisory experience.' },
]

const VALUES = [
  { icon: '🎯', title: 'Parent First',    desc: 'Every decision we make starts with the question — does this make life easier for parents?' },
  { icon: '✅', title: 'Radical Honesty', desc: 'We only show verified information. No paid rankings, no hidden promotions, no fake reviews.' },
  { icon: '🤝', title: 'Fairness',        desc: 'Free for parents always. Fair pricing for schools. No pay-to-win discovery.' },
  { icon: '🌍', title: 'Access for All',  desc: 'Premium guidance should not be only for families who can afford private counsellors.' },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>

        {/* Hero */}
        <section style={{ padding: '80px 48px', background: 'linear-gradient(160deg, #F5F0E8 60%, #EDE5D8 100%)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '18px', fontFamily: 'DM Sans,sans-serif' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Our Story
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '60px', color: '#0D1117', letterSpacing: '-2px', lineHeight: 1.0, marginBottom: '22px' }}>
                We Believe Every Child Deserves the <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Right School</em>
              </h1>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '16px', color: '#4A5568', lineHeight: 1.8, fontWeight: 300 }}>
                Thynk Schooling was born from a simple frustration — finding the right school in India is unnecessarily hard. Parents spend weeks calling schools, visiting campuses with incomplete information, and paying for advice that should be free.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '16px', padding: '28px', textAlign: 'center', boxShadow: '0 2px 12px rgba(13,17,23,0.05)' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '40px', color: '#B8860B', lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: '#A0ADB8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section style={{ padding: '80px 48px', background: '#0D1117' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8C547', marginBottom: '20px', fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Our Mission
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '48px', color: '#FAF7F2', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '20px' }}>
              Make School Discovery as Easy as <em style={{ fontStyle: 'italic', color: '#E8C547' }}>Booking a Flight</em>
            </h2>
            <div style={{ width: '40px', height: '1px', background: '#B8860B', margin: '0 auto 20px' }} />
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '17px', color: 'rgba(250,247,242,0.6)', lineHeight: 1.8, fontWeight: 300 }}>
              We are building India&apos;s most comprehensive, honest and parent-first school discovery platform — where every parent can find, compare and apply to the right school without needing connections, expensive consultants, or weeks of research.
            </p>
          </div>
        </section>

        {/* Values */}
        <section style={{ padding: '80px 48px', background: '#F5F0E8' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />What We Stand For
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '42px', color: '#0D1117' }}>Our Values</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {VALUES.map(v => (
                <div key={v.title} style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(13,17,23,0.05)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>{v.icon}</div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '20px', color: '#0D1117', marginBottom: '8px' }}>{v.title}</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', lineHeight: 1.65, fontWeight: 300 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section style={{ padding: '80px 48px' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Our Team
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '42px', color: '#0D1117' }}>
                Built by People Who <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Care About Education</em>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {TEAM.map(m => (
                <div key={m.name} style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '16px', padding: '28px', textAlign: 'center', boxShadow: '0 2px 12px rgba(13,17,23,0.05)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#EDE5D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '22px', color: '#B8860B', margin: '0 auto 16px' }}>{m.initials}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '18px', color: '#0D1117', marginBottom: '4px' }}>{m.name}</div>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '10px' }}>{m.role}</div>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', lineHeight: 1.6, fontWeight: 300 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '0 48px 80px' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ background: '#F5F0E8', borderRadius: '20px', padding: '52px', textAlign: 'center', border: '1px solid rgba(184,134,11,0.15)' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '40px', color: '#0D1117', marginBottom: '12px' }}>
                Join 1 Lakh+ Parents on <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Thynk Schooling</em>
              </h2>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', marginBottom: '28px', fontWeight: 300 }}>Start your school search for free. No account needed to browse.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0D1117', color: '#FAF7F2', padding: '13px 26px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
                  Find Schools <ArrowRight style={{ width: '15px', height: '15px' }} />
                </Link>
                <Link href="/counselling" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#B8860B', border: '1px solid rgba(184,134,11,0.35)', padding: '12px 26px', borderRadius: '8px', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
                  Free Counselling
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
