'use client'
export const dynamic = 'force-dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useContent } from '@/hooks/useContent'

export default function Page() {
  const ct = useContent('contact') ?? {}
  const D = {
    eyebrow: 'We\'d love to hear from you',
    h1: 'Contact Us',
    genEmail: 'hello@thynkschooling.in',
    genPhone: '+91 88000 00000',
    genHours: 'Mon–Fri, 10 AM – 7 PM IST',
    schoolEmail: 'schools@thynkschooling.in',
    schoolPhone: '+91 88000 00001',
    pressEmail: 'press@thynkschooling.in',
    officeAddress: 'New Delhi, India — 110001',
    officeName: 'Thynk Schooling Pvt. Ltd.',
  }
  const g = (k: string) => (ct[k] as string) || (D as any)[k]

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        <section style={{ padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)', background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>{g('eyebrow')}</div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>{g('h1')}</h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
            {[
              { title:'General Enquiries', lines:[`📧 ${g('genEmail')}`, `📞 ${g('genPhone')}`, `🕐 ${g('genHours')}`] },
              { title:'School Partnerships', lines:[`📧 ${g('schoolEmail')}`, `📞 ${g('schoolPhone')}`, 'List your school on our platform'] },
              { title:'Press & Media', lines:[`📧 ${g('pressEmail')}`, 'For media kits and interview requests'] },
              { title:'Office Address', lines:[`📍 ${g('officeName')}`, g('officeAddress')] },
            ].map(card => (
              <div key={card.title} style={{ background:'#F5F0E8', borderRadius:14, padding:28 }}>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, marginBottom:16 }}>{card.title}</h3>
                {card.lines.map(l => <p key={l} style={{ fontFamily:'DM Sans,sans-serif', fontSize:15, color:'#4A5568', marginBottom:8 }}>{l}</p>)}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
