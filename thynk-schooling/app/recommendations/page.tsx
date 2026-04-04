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
              Personalised school matches powered by AI
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              AI School Recommendations
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<div style="text-align:center;padding:40px 0;margin-bottom:32px"> <div style="font-size:64px;margin-bottom:16px">🤖</div> <h2 style="font-family:Cormorant Garamond,serif;font-size:36px;margin-bottom:12px">AI-Powered School Matching</h2> <p style="font-size:18px;color:#4A5568;max-width:560px;margin:0 auto">Our AI analyses your child's needs, budget, location preferences, and academic goals to recommend the best-fit schools.</p> </div> <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:32px 0"> <div style="background:#F5F0E8;border-radius:14px;padding:28px;text-align:center"><div style="font-size:36px;margin-bottom:12px">📋</div><h3>Share Preferences</h3><p>Tell us about your child — board preference, budget, location, activities, class level.</p></div> <div style="background:#F5F0E8;border-radius:14px;padding:28px;text-align:center"><div style="font-size:36px;margin-bottom:12px">⚡</div><h3>AI Analyses</h3><p>Our algorithm matches your requirements against 12,000+ verified schools in real time.</p></div> <div style="background:#F5F0E8;border-radius:14px;padding:28px;text-align:center"><div style="font-size:36px;margin-bottom:12px">🎯</div><h3>Get Matches</h3><p>Receive your top 10 personalised school recommendations with detailed comparisons.</p></div> </div> <div style="text-align:center;margin-top:32px"><a href="/schools" style="display:inline-flex;align-items:center;gap:10px;padding:16px 36px;background:#B8860B;color:#fff;text-decoration:none;border-radius:10px;font-family:DM Sans,sans-serif;font-size:16px;font-weight:700">Find My Schools →</a></div>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
