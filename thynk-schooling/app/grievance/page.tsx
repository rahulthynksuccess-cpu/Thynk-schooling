import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Grievance Officer — Thynk Schooling' }

export default function Page() {
  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>

        {/* Hero */}
        <section style={{ background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))', padding:'clamp(48px,6vw,80px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:22, height:1.5, background:'#B8860B', display:'block' }} />Legal
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92, marginBottom:14 }}>
              Grievance Officer
            </h1>
            <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(14px,1.5vw,16px)', color:'#718096', fontWeight:300 }}>
              In accordance with the Information Technology Act, 2000 and IT (Intermediary Guidelines) Rules, 2021.
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding:'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 280px', gap:48, alignItems:'start' }}>
            <div>
              
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Grievance Officer Contact
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Name: Grievance Officer, Thynk Schooling Pvt. Ltd. | Email: grievance@thynkschooling.in | Phone: +91 88000 00000 | Address: Thynk Schooling Pvt. Ltd., New Delhi, India — 110001 | Working Hours: Monday to Friday, 10:00 AM – 6:00 PM IST
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  How to File a Grievance
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  You can file a grievance by emailing grievance@thynkschooling.in with the following details: your full name, registered email address, description of the issue, supporting documents or screenshots (if applicable), and the resolution you are seeking.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Resolution Timeline
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We acknowledge all grievances within 24 hours of receipt. We aim to resolve all grievances within 30 days in accordance with the Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Escalation
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  If you are unsatisfied with our resolution, you may escalate the matter to the Adjudicating Officer appointed under the IT Act, consumer forums under the Consumer Protection Act, 2019, or other applicable regulatory authorities.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Complaint Categories
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We address grievances related to: privacy and data protection, accuracy of school information, payment disputes, content removal requests, account-related issues, and any other platform-related concerns.
                </p>
              </div>
            </div>
            {/* Sidebar */}
            <aside style={{ position:'sticky', top:100 }}>
              <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:16, padding:24 }}>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, color:'#718096', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Other Policies</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <Link href="/privacy" style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#B8860B', textDecoration:'none', fontWeight:500 }}>Privacy Policy</Link>
                  <Link href="/terms" style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#B8860B', textDecoration:'none', fontWeight:500 }}>Terms of Service</Link>
                  <Link href="/refund" style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#B8860B', textDecoration:'none', fontWeight:500 }}>Refund Policy</Link>
                  <Link href="/grievance" style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#B8860B', textDecoration:'none', fontWeight:500 }}>Grievance Officer</Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
