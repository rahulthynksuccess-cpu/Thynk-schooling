'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STEPS = [
  { num:'01', emoji:'🔍', title:'Search & Discover',    desc:"AI-powered filters — city, board, fees, class — precisely matched to your child's profile and your preferences.",  col:'#B8860B' },
  { num:'02', emoji:'⇌', title:'Compare Schools',      desc:'Side-by-side comparison of fees, facilities, ratings and admission criteria across multiple schools at once.',       col:'#4A5568' },
  { num:'03', emoji:'📋', title:'Apply in One Click',  desc:'Fill the Common Admission Form once. Apply to multiple schools using your saved child profile — no repetition.',     col:'#B8860B' },
  { num:'04', emoji:'✓',  title:'Track & Get Admitted', desc:'Real-time application status on your dashboard. Get notified at every stage — shortlisted, admitted, or waitlisted.', col:'#4A5568' },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.1 })
  return (
    <section ref={ref} style={{ background:'#FAF7F2', padding:'96px 0' }}>
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 48px' }}>
        <motion.div initial={{ opacity:0, y:18 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ duration:.6 }} style={{ textAlign:'center', marginBottom:'68px' }}>
          <div className="eyebrow" style={{ justifyContent:'center' }}>How It Works</div>
          <h2 className="section-title" style={{ fontSize:'56px', marginBottom:'14px' }}>Admission Made <em>Simple</em></h2>
          <p className="section-sub" style={{ margin:'0 auto', textAlign:'center' }}>From search to admission in 4 easy steps — completely free for parents.</p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0', position:'relative' }}>
          <div style={{ position:'absolute', top:'36px', left:'12.5%', right:'12.5%', height:'1px', background:'linear-gradient(90deg, rgba(184,134,11,0.1), rgba(184,134,11,0.35), rgba(184,134,11,0.1))' }} />
          {STEPS.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity:0, y:24 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ delay:i*.13, duration:.6 }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 32px' }}>
              <div style={{ position:'relative', width:'72px', height:'72px', borderRadius:'18px', background:'#fff', border:'1px solid rgba(13,17,23,0.09)', boxShadow:'0 4px 20px rgba(13,17,23,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', marginBottom:'22px' }}>
                {s.emoji}
                <span style={{ position:'absolute', top:'-9px', right:'-9px', width:'22px', height:'22px', borderRadius:'50%', background:'#FAF7F2', border:`1px solid ${s.col}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontFamily:'Inter,sans-serif', fontWeight:600, color: s.col }}>
                  {i+1}
                </span>
              </div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color: s.col, marginBottom:'7px' }}>Step {s.num}</div>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'19px', color:'#0D1117', marginBottom:'9px' }}>{s.title}</h3>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#718096', lineHeight:1.65, fontWeight:300 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
