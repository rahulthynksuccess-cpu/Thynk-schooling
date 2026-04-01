import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function Page() {
  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        <section style={{ padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)', background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
              Thynk Schooling in the news
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Press & Media
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<p style="font-size:18px;color:#4A5568;margin-bottom:32px">For press enquiries, interviews, or media kit requests, please contact press@thynkschooling.in</p> <h2>About Thynk Schooling</h2> <p>Thynk Schooling is India's fastest-growing school discovery and admission platform, connecting over 1 lakh parents with 12,000+ verified schools across 35+ cities. Founded with the mission to make quality school admissions accessible and transparent for every Indian family.</p> <h2>Key Facts</h2> <div style="background:#F5F0E8;border-radius:12px;padding:28px;margin:24px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px"> <div><div style="font-size:36px;font-family:Cormorant Garamond,serif;font-weight:700;color:#B8860B">12,000+</div><div>Verified Schools</div></div> <div><div style="font-size:36px;font-family:Cormorant Garamond,serif;font-weight:700;color:#B8860B">1 Lakh+</div><div>Parents Served</div></div> <div><div style="font-size:36px;font-family:Cormorant Garamond,serif;font-weight:700;color:#B8860B">35+</div><div>Cities Covered</div></div> </div> <h2>Press Contact</h2><p>📧 press@thynkschooling.in | 📞 +91 88000 00000</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
