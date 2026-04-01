import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Thynk Schooling' }

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
              Privacy Policy
            </h1>
            <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(14px,1.5vw,16px)', color:'#718096', fontWeight:300 }}>
              Last updated: January 2025 — We respect your privacy and handle your data responsibly.
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding:'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 280px', gap:48, alignItems:'start' }}>
            <div>
              
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  1. Information We Collect
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We collect information you provide directly: name, email, phone number, and your child's educational requirements when you use our school search and admission services. We also collect usage data such as pages visited and searches made, to improve our platform.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  2. How We Use Your Information
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We use your information to match you with relevant schools, send admission updates, provide counselling services, and improve our platform experience. We do not use your data for any purpose beyond what you have consented to.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  3. Information Sharing
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We share your contact details only with schools you explicitly express interest in by submitting an enquiry. We never sell your personal data to third parties. We do not share your data with advertisers.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  4. Data Security
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We implement industry-standard security measures including data encryption in transit and at rest, secure servers, regular security audits, and access controls to protect your personal information.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  5. Cookies
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  We use cookies to improve your browsing experience and remember your preferences. You can disable cookies in your browser settings, though some features of the platform may not work correctly without them.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  6. Your Rights
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent for communications. Contact us at privacy@thynkschooling.in to exercise these rights and we will respond within 30 days.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  7. Contact Us
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  For privacy-related queries, email us at privacy@thynkschooling.in. You may also write to our Grievance Officer at our registered office in New Delhi, India.
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
