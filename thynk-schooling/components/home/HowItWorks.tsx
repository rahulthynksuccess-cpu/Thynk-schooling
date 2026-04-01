'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { num:'01', title:'Search Schools',    desc:'Use our smart filters to find schools by city, board, fees, medium and 20+ more criteria.',   icon:'🔎', color:'#B8860B' },
  { num:'02', title:'Compare & Review', desc:'Place schools side-by-side. Read authentic parent reviews and check verified ratings.',          icon:'📊', color:'#0A5F55' },
  { num:'03', title:'Get Counselled',   desc:'Book a free 30-minute session with our expert counsellors to shortlist the right school.',       icon:'🧑‍💼', color:'#7A6A52' },
  { num:'04', title:'Apply & Enrol',    desc:'Submit enquiries to multiple schools in one click and track all your applications in one place.', icon:'✅', color:'#B8860B' },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background:'var(--how-bg,#FAF7F2)', padding:'clamp(60px,8vw,100px) 0', width:'100%' }}>
      <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', padding:'0 clamp(20px,5vw,60px)' }}>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.6fr)', gap:'clamp(40px,6vw,80px)', alignItems:'center' }}>

          {/* Left: heading */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={inView?{opacity:1,x:0}:{}} transition={{ duration:.6 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--gold,#B8860B)', marginBottom:20 }}>
              <span style={{ display:'block', width:22, height:1.5, background:'var(--gold,#B8860B)' }} />
              How It Works
            </div>
            <h2 style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontWeight:700, fontSize:'var(--how-title-size,clamp(2.2rem,5vw,4rem))', color:'var(--how-title-color,#0D1117)', lineHeight:.95, letterSpacing:'-2px', marginBottom:24 }}>
              {ct.howTitle || 'Admission'}
              <em style={{ display:'block', fontStyle:'italic', color:'var(--gold,#B8860B)' }}>Made Simple</em>
            </h2>
            <p style={{ fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'clamp(14px,1.5vw,17px)', color:'var(--ink-muted,#4A5568)', lineHeight:1.75, fontWeight:300, marginBottom:36 }}>
              From searching to enrolment — we guide you at every step. Completely free for parents.
            </p>
            <Link href="/schools" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 28px', background:'var(--ink,#0D1117)', color:'var(--ivory,#FAF7F2)', borderRadius:10, fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:14, fontWeight:600, textDecoration:'none', transition:'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='var(--gold,#B8860B)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='var(--ink,#0D1117)' }}>
              Start Your Search <ArrowRight style={{ width:16, height:16 }} />
            </Link>
          </motion.div>

          {/* Right: steps */}
          <div style={{ display:'flex', flexDirection:'column', gap:'clamp(16px,2vw,24px)' }}>
            {STEPS.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity:0, x:20 }} animate={inView?{opacity:1,x:0}:{}}
                transition={{ delay: i * 0.1, duration:.5 }}
                style={{ display:'flex', gap:'clamp(16px,2vw,24px)', alignItems:'flex-start', background:'var(--surface,#fff)', borderRadius:'clamp(12px,1.5vw,16px)', padding:'clamp(18px,2vw,28px)', border:'1px solid rgba(13,17,23,0.07)', boxShadow:'0 2px 12px rgba(13,17,23,0.04)' }}>
                <div style={{ width:'clamp(44px,5vw,56px)', height:'clamp(44px,5vw,56px)', borderRadius:'clamp(10px,1.2vw,14px)', background:`${step.color}12`, border:`1.5px solid ${step.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(20px,2.5vw,28px)', flexShrink:0 }}>
                  {step.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:11, fontWeight:700, color:step.color, letterSpacing:'.1em' }}>{step.num}</span>
                    <h3 style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize:'var(--how-step-title-size,clamp(16px,1.8vw,21px))', fontWeight:700, color:'var(--how-step-title-color,#0D1117)', margin:0 }}>{step.title}</h3>
                  </div>
                  <p style={{ fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--how-step-desc-size,clamp(12px,1.2vw,14px))', color:'var(--how-step-desc-color,#4A5568)', lineHeight:1.65, margin:0, fontWeight:300 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
