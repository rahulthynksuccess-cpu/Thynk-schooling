'use client'
export const dynamic = 'force-dynamic'
import { useContent } from '@/hooks/useContent'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function RecommendationsPage() {
  const ct = useContent('recommendations') ?? {}
  const g = (k: string, d: string) => (ct[k] as string) || d

  const steps = [
    { icon: g('step1Icon','📋'), title: g('step1Title','Share Preferences'), desc: g('step1Desc',"Tell us about your child — board preference, budget, location, activities, class level.") },
    { icon: g('step2Icon','⚡'), title: g('step2Title','AI Analyses'),        desc: g('step2Desc','Our algorithm matches your requirements against 12,000+ verified schools in real time.') },
    { icon: g('step3Icon','🎯'), title: g('step3Title','Get Matches'),         desc: g('step3Desc','Receive your top 10 personalised school recommendations with detailed comparisons.') },
  ]

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--ivory,#FAF7F2)', paddingTop: 72, minHeight: '100vh' }}>
        <section style={{ padding: 'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', background: 'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 16, fontFamily: 'DM Sans,sans-serif' }}>
              {g('eyebrow','Personalised For Your Child')}
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.4rem,5vw,4.5rem)', color: '#0D1117', letterSpacing: '-2px', lineHeight: .92, marginBottom: 20 }}>
              {g('h1','AI-Powered School Recommendations')}
            </h1>
            <p style={{ fontSize: 18, color: '#4A5568', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              {g('subtext',"Our AI analyses your child's needs, budget, location preferences, and academic goals to recommend the best-fit schools.")}
            </p>
          </div>
        </section>

        <section style={{ padding: 'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 40 }}>
              {steps.map((step) => (
                <div key={step.title} style={{ background: '#F5F0E8', borderRadius: 14, padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, color: '#0D1117', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 15, color: '#4A5568', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <a href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: '#B8860B', color: '#fff', textDecoration: 'none', borderRadius: 10, fontFamily: 'DM Sans,sans-serif', fontSize: 16, fontWeight: 700 }}>
                {g('ctaBtn','Find My Schools →')}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
