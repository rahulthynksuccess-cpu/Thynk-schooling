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
              Last updated: January 2025
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              Privacy Policy
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto', fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#0D1117', lineHeight:1.75 }}
            dangerouslySetInnerHTML={{ __html: `<h2>1. Information We Collect</h2><p>We collect information you provide directly, including name, email, phone number, and your child's educational requirements when you use our school search and admission services.</p> <h2>2. How We Use Your Information</h2><p>We use your information to match you with relevant schools, send admission updates, provide counselling services, and improve our platform.</p> <h2>3. Information Sharing</h2><p>We share your contact details only with schools you express interest in. We never sell your personal data to third parties.</p> <h2>4. Data Security</h2><p>We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data.</p> <h2>5. Cookies</h2><p>We use cookies to improve your experience. You can disable cookies in your browser settings, though some features may not work correctly.</p> <h2>6. Your Rights</h2><p>You have the right to access, correct, or delete your personal data. Contact us at privacy@thynkschooling.in to exercise these rights.</p> <h2>7. Contact Us</h2><p>For privacy-related queries, email us at privacy@thynkschooling.in or write to us at our registered office in New Delhi.</p>` }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
