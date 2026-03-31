import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function Page() {
  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        <section style={{ padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)', background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
              In accordance with Information Technology Act, 2000
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Grievance Officer
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<h2>Grievance Officer Details</h2> <div style="background:#F5F0E8;border-radius:12px;padding:24px;margin:24px 0"> <p><strong>Name:</strong> Grievance Officer, Thynk Schooling</p> <p><strong>Email:</strong> grievance@thynkschooling.in</p> <p><strong>Phone:</strong> +91 88000 00000</p> <p><strong>Address:</strong> Thynk Schooling Pvt. Ltd., New Delhi, India — 110001</p> <p><strong>Working Hours:</strong> Monday to Friday, 10:00 AM – 6:00 PM IST</p> </div> <h2>How to File a Grievance</h2><p>You can file a grievance by emailing grievance@thynkschooling.in with your full name, registered email, description of the issue, and any supporting documents.</p> <h2>Resolution Timeline</h2><p>We acknowledge grievances within 24 hours and aim to resolve them within 30 days in accordance with the IT Act, 2000 and IT (Intermediary Guidelines) Rules, 2021.</p> <h2>Escalation</h2><p>If unsatisfied with the resolution, you may approach the Adjudicating Officer under the IT Act or consumer forums as applicable.</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
