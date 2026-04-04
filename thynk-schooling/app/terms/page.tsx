import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Thynk Schooling' }

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
              Terms of Service
            </h1>
            <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(14px,1.5vw,16px)', color:'#718096', fontWeight:300 }}>
              Effective: January 2025 — Please read these terms carefully before using our platform.
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding:'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 280px', gap:48, alignItems:'start' }}>
            <div>
              
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  1. Acceptance of Terms
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  By accessing or using Thynk Schooling, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and school partners.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  2. Service Description
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Thynk Schooling is a school discovery and admission assistance platform connecting parents with verified schools across India. We provide search, comparison, counselling, and application facilitation services.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  3. User Accounts
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  You are responsible for maintaining the confidentiality of your account credentials and all activities that occur under your account. Notify us immediately of any unauthorised use of your account.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  4. Prohibited Activities
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  You may not use the platform for unlawful purposes, submit false information, impersonate others, attempt to access unauthorised areas, scrape data, or interfere with the platform's operation.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  5. School Listings & Accuracy
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  While we verify school information to the best of our ability, we cannot guarantee the accuracy of all details. Always verify critical information directly with schools before making admission decisions.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  6. Intellectual Property
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  All content on Thynk Schooling including text, graphics, logos, and software is owned by us or our licensors. You may not reproduce or distribute content without written permission.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  7. Limitation of Liability
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Thynk Schooling is not liable for admission decisions, school policies, fee changes, or any outcomes resulting from using our platform. Our total liability is limited to the amount paid for premium services, if any.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  8. Governing Law
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in New Delhi, India.
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
