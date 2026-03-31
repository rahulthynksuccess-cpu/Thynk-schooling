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
              Refund Policy
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<h2>Platform Usage</h2><p>Basic school search, comparison, and counselling services on Thynk Schooling are completely free for parents. No payment is required to browse schools or book a counselling session.</p> <h2>Premium Services</h2><p>If you have purchased any premium subscription or paid service, you are eligible for a full refund within 7 days of purchase if the service has not been utilised.</p> <h2>How to Request a Refund</h2><p>Email refunds@thynkschooling.in with your order ID, registered email, and reason for refund. We will process your request within 5-7 business days.</p> <h2>Refund Processing</h2><p>Approved refunds are credited to the original payment method within 7-10 business days. UPI and wallet payments may be processed faster.</p> <h2>Non-Refundable Items</h2><p>Consultation fees paid directly to third-party counsellors, school application fees, and services fully rendered are non-refundable.</p> <h2>Contact</h2><p>For refund queries, contact us at refunds@thynkschooling.in or call +91 88000 00000.</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
