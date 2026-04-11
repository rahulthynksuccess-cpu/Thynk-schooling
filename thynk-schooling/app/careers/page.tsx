'use client'
export const dynamic = 'force-dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useContent } from '@/hooks/useContent'

export default function Page() {
  const ct = useContent('careers') ?? {}
  const g = (k: string, d: string) => (ct[k] as string) || d

  const jobs = [
    { title: g('job1Title','Senior Full Stack Developer'), meta: g('job1Meta','Remote • Full-time • 4+ years experience'), desc: g('job1Desc','Build and scale our Next.js + PostgreSQL platform serving lakhs of Indian parents.') },
    { title: g('job2Title','School Admission Counsellor'), meta: g('job2Meta','Delhi / Mumbai / Bangalore • Full-time'), desc: g('job2Desc','Guide parents through the school selection and admission process with empathy and expertise.') },
    { title: g('job3Title','Business Development Manager — Schools'), meta: g('job3Meta','Pan India • Full-time'), desc: g('job3Desc','Onboard and manage relationships with premium schools across India.') },
  ]

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        <section style={{ padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.08)', background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
              {g('eyebrow','Join our mission to transform school admissions in India')}
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.4rem,5vw,4.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92 }}>
              {g('h1','Careers at Thynk Schooling')}
            </h1>
          </div>
        </section>
        <section style={{ padding:'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', fontFamily:'DM Sans,sans-serif', color:'#0D1117' }}>
            <p style={{ fontSize:18, color:'#4A5568', marginBottom:32 }}>{g('intro','We\'re building the future of school admissions in India. If you\'re passionate about EdTech and want to make a real difference, we\'d love to meet you.')}</p>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, marginBottom:24 }}>Open Positions</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:40 }}>
              {jobs.map(job => (
                <div key={job.title} style={{ background:'#F5F0E8', borderRadius:12, padding:24, borderLeft:'4px solid #B8860B' }}>
                  <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, marginBottom:8 }}>{job.title}</h3>
                  <p style={{ color:'#718096', fontSize:14, marginBottom:8 }}>{job.meta}</p>
                  <p style={{ fontSize:15, lineHeight:1.7 }}>{job.desc}</p>
                </div>
              ))}
            </div>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, marginBottom:16 }}>How to Apply</h2>
            <p style={{ fontSize:15, lineHeight:1.75 }}>{g('howToApply','Send your CV and a brief note about why you want to join us to careers@thynkschooling.in. We reply to every application within 5 business days.')}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
