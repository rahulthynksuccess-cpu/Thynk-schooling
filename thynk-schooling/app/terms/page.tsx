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
              Effective: January 2025
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Terms of Service
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<h2>1. Acceptance of Terms</h2><p>By using Thynk Schooling, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p> <h2>2. Service Description</h2><p>Thynk Schooling is a school discovery and admission assistance platform connecting parents with verified schools across India.</p> <h2>3. User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account and all activities under your account.</p> <h2>4. Prohibited Activities</h2><p>You may not use the platform for unlawful purposes, submit false information, or attempt to access unauthorised areas of the platform.</p> <h2>5. School Listings</h2><p>While we verify school information, we cannot guarantee the accuracy of all details. Always verify directly with schools before making admission decisions.</p> <h2>6. Intellectual Property</h2><p>All content on Thynk Schooling is owned by us or our licensors. You may not reproduce or distribute content without written permission.</p> <h2>7. Limitation of Liability</h2><p>Thynk Schooling is not liable for admission decisions, school policies, or outcomes resulting from using our platform.</p> <h2>8. Governing Law</h2><p>These terms are governed by Indian law. Disputes shall be subject to the exclusive jurisdiction of courts in New Delhi.</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
