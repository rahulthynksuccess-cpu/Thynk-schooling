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
              Join our mission to transform school admissions in India
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Careers at Thynk Schooling
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<p style="font-size:18px;color:#4A5568;margin-bottom:32px">We're building the future of school admissions in India. If you're passionate about EdTech and want to make a real difference, we'd love to meet you.</p> <h2>Open Positions</h2> <div style="display:flex;flex-direction:column;gap:16px;margin:24px 0"> <div style="background:#F5F0E8;border-radius:12px;padding:24px;border-left:4px solid #B8860B"> <h3 style="font-family:Cormorant Garamond,serif;font-size:22px;margin-bottom:8px">Senior Full Stack Developer</h3> <p style="color:#718096;font-size:14px">Remote • Full-time • 4+ years experience</p> <p>Build and scale our Next.js + PostgreSQL platform serving lakhs of Indian parents.</p> </div> <div style="background:#F5F0E8;border-radius:12px;padding:24px;border-left:4px solid #B8860B"> <h3 style="font-family:Cormorant Garamond,serif;font-size:22px;margin-bottom:8px">School Admission Counsellor</h3> <p style="color:#718096;font-size:14px">Delhi / Mumbai / Bangalore • Full-time</p> <p>Guide parents through the school selection and admission process with empathy and expertise.</p> </div> <div style="background:#F5F0E8;border-radius:12px;padding:24px;border-left:4px solid #B8860B"> <h3 style="font-family:Cormorant Garamond,serif;font-size:22px;margin-bottom:8px">Business Development Manager — Schools</h3> <p style="color:#718096;font-size:14px">Pan India • Full-time</p> <p>Onboard and manage relationships with premium schools across India.</p> </div> </div> <h2>How to Apply</h2><p>Send your CV and a brief note about why you want to join us to careers@thynkschooling.in. We reply to every application within 5 business days.</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
