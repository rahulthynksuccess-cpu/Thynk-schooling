'use client'
export const dynamic = 'force-dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useContent } from '@/hooks/useContent'

export default function Page() {
  const ct = useContent('press') ?? {}
  const g = (k: string, d: string) => (ct[k] as string) || d

  const stats = [
    { value: g('stat1Value','12,000+'), label: g('stat1Label','Verified Schools') },
    { value: g('stat2Value','1 Lakh+'), label: g('stat2Label','Parents Served') },
    { value: g('stat3Value','35+'),     label: g('stat3Label','Cities Covered') },
  ]

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        <section style={{ padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)', background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
              {g('eyebrow','Thynk Schooling in the news')}
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              {g('h1','Press & Media')}
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', color:'#0D1117' }}>
            <p style={{ fontSize:18, color:'#4A5568', marginBottom:32 }}>{g('intro','For press enquiries, interviews, or media kit requests, please contact us.')}</p>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, marginBottom:16 }}>About Thynk Schooling</h2>
            <p style={{ fontSize:15, lineHeight:1.75, marginBottom:32 }}>{g('about',"Thynk Schooling is India's fastest-growing school discovery and admission platform, connecting over 1 lakh parents with 12,000+ verified schools across 35+ cities.")}</p>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, marginBottom:16 }}>Key Facts</h2>
            <div style={{ background:'#F5F0E8', borderRadius:12, padding:28, marginBottom:32, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24 }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:36, color:'#B8860B' }}>{s.value}</div>
                  <div style={{ fontSize:14, color:'#4A5568' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, marginBottom:16 }}>Press Contact</h2>
            <p style={{ fontSize:15 }}>{g('pressContact','📧 press@thynkschooling.in | 📞 +91 88000 00000')}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
