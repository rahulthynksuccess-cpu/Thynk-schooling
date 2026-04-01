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
              We'd love to hear from you
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Contact Us
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:24px 0"> <div style="background:#F5F0E8;border-radius:14px;padding:28px"> <h3 style="font-family:Cormorant Garamond,serif;font-size:24px;margin-bottom:16px">General Enquiries</h3> <p>📧 hello@thynkschooling.in</p> <p>📞 +91 88000 00000</p> <p>🕐 Mon–Fri, 10 AM – 7 PM IST</p> </div> <div style="background:#F5F0E8;border-radius:14px;padding:28px"> <h3 style="font-family:Cormorant Garamond,serif;font-size:24px;margin-bottom:16px">School Partnerships</h3> <p>📧 schools@thynkschooling.in</p> <p>📞 +91 88000 00001</p> <p>List your school on our platform</p> </div> <div style="background:#F5F0E8;border-radius:14px;padding:28px"> <h3 style="font-family:Cormorant Garamond,serif;font-size:24px;margin-bottom:16px">Press & Media</h3> <p>📧 press@thynkschooling.in</p> <p>For media kits and interview requests</p> </div> <div style="background:#F5F0E8;border-radius:14px;padding:28px"> <h3 style="font-family:Cormorant Garamond,serif;font-size:24px;margin-bottom:16px">Office Address</h3> <p>📍 Thynk Schooling Pvt. Ltd.</p> <p>New Delhi, India — 110001</p> </div> </div>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
