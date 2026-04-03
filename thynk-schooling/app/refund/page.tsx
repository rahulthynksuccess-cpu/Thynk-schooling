import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Refund Policy — Thynk Schooling' }

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
              Refund Policy
            </h1>
            <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(14px,1.5vw,16px)', color:'#718096', fontWeight:300 }}>
              Effective: January 2025 — We aim to be fair and transparent about our refund process.
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding:'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 280px', gap:48, alignItems:'start' }}>
            <div>
              
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Free Services
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Basic school search, comparison, and counselling services on Thynk Schooling are completely free for parents. No payment is required to browse schools, read reviews, or book a counselling session. No refund process applies to free services.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Premium Services
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  If you have purchased any premium subscription or paid service, you are eligible for a full refund within 7 days of purchase, provided the service has not been fully utilised. After 7 days, partial refunds may be considered on a case-by-case basis.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  How to Request a Refund
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Email refunds@thynkschooling.in with your order ID, registered email address, and reason for the refund. We will acknowledge your request within 24 hours and process it within 5-7 business days.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Refund Processing
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Approved refunds are credited to the original payment method within 7-10 business days. UPI and wallet payments may be processed faster. Bank transfers may take up to 15 business days depending on your bank.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Non-Refundable Items
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  Consultation fees paid directly to third-party counsellors, school application fees collected on behalf of schools, and services that have been fully rendered are non-refundable. Razorpay payment gateway charges are also non-refundable.
                </p>
              </div>
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:"clamp(1.4rem,2.5vw,2rem)", color:"#0D1117", letterSpacing:"-0.5px", marginBottom:12, paddingBottom:10, borderBottom:"2px solid rgba(184,134,11,0.15)" }}>
                  Contact for Refunds
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(15px,1.5vw,17px)", color:"#374151", lineHeight:1.8, fontWeight:300 }}>
                  For any refund-related queries, contact us at refunds@thynkschooling.in or call +91 88000 00000 during business hours (Monday–Friday, 10 AM–6 PM IST).
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
