'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { num:'01', title:'Search Schools',   desc:'Smart filters — board, city, fee, medium, and 20+ criteria.',  icon:'🔎', color:'#B8860B' },
  { num:'02', title:'Compare & Review', desc:'Side-by-side comparisons with verified parent reviews.',         icon:'📊', color:'#0A5F55' },
  { num:'03', title:'Get Counselled',   desc:'Free 30-min expert session to shortlist the right fit.',        icon:'🧑‍💼', color:'#7A4A9A' },
  { num:'04', title:'Apply & Enrol',    desc:'One-click enquiries to multiple schools, track everything.',    icon:'✅', color:'#B8860B' },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .08 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background:'#FDFAF5', padding:'clamp(80px,10vw,130px) 0', position:'relative', overflow:'hidden' }}>
      {/* Decorative diagonal stripe */}
      <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'100%', background:'linear-gradient(135deg,transparent 49%,rgba(184,134,11,0.025) 50%)', pointerEvents:'none' }}/>
      {/* Bottom-left circle accent */}
      <div style={{ position:'absolute', bottom:'-100px', left:'-100px', width:350, height:350, borderRadius:'50%', border:'1px solid rgba(184,134,11,0.1)', pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'0 clamp(24px,5vw,80px)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.6fr)', gap:'clamp(48px,6vw,100px)', alignItems:'center' }}>
          {/* Left */}
          <motion.div initial={{ opacity:0, x:-24 }} animate={inView?{opacity:1,x:0}:{}} transition={{ duration:.65, ease:[.22,1,.36,1] }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#B8860B', marginBottom:20 }}>
              <span style={{ width:22, height:1.5, background:'#B8860B', display:'block' }}/>
              How It Works
            </div>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:'clamp(2.4rem,5.5vw,5rem)', color:'#0D1117', lineHeight:.9, letterSpacing:'-2.5px', marginBottom:20 }}>
              {ct.howTitle||'Admission'}
              <em style={{ display:'block', fontStyle:'italic', color:'#B8860B' }}>Made Simple</em>
            </h2>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(14px,1.5vw,17px)', color:'#4A5568', lineHeight:1.8, fontWeight:300, marginBottom:36 }}>
              From searching to enrolment — guided at every step. Completely free for parents, always.
            </p>
            {/* Progress dots */}
            <div style={{ display:'flex', gap:6, marginBottom:36 }}>
              {STEPS.map((_,i)=><div key={i} style={{ height:3, flex:1, borderRadius:99, background:i===0?'#B8860B':'rgba(13,17,23,0.1)', transition:'background .3s' }}/>)}
            </div>
            <Link href="/schools" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 28px', background:'#0D1117', color:'#FAF7F2', borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600, textDecoration:'none', transition:'all .22s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#B8860B'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0D1117'}}>
              Start Your Search <ArrowRight style={{ width:15, height:15 }}/>
            </Link>
          </motion.div>

          {/* Right — steps */}
          <div style={{ display:'flex', flexDirection:'column', gap:'clamp(12px,1.8vw,18px)', position:'relative' }}>
            {/* Connector line */}
            <div style={{ position:'absolute', left:'calc(clamp(22px,2.5vw,28px))', top:36, bottom:36, width:1, background:'linear-gradient(to bottom,rgba(184,134,11,0.3),rgba(184,134,11,0.06))', pointerEvents:'none' }}/>

            {STEPS.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity:0, x:28 }} animate={inView?{opacity:1,x:0}:{}}
                transition={{ delay:i*.1, duration:.55, ease:[.22,1,.36,1] }}
                style={{ display:'flex', gap:'clamp(16px,2vw,24px)', alignItems:'flex-start', background:'#fff', borderRadius:'clamp(14px,1.5vw,18px)', padding:'clamp(18px,2.5vw,28px)', border:'1px solid rgba(13,17,23,0.07)', boxShadow:'0 2px 16px rgba(13,17,23,0.04)', transition:'all .25s cubic-bezier(.22,1,.36,1)', cursor:'default' }}
                onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform='translateX(6px)'; el.style.boxShadow=`0 8px 40px rgba(13,17,23,0.08)`; el.style.borderColor=`${step.color}30` }}
                onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='0 2px 16px rgba(13,17,23,0.04)'; el.style.borderColor='rgba(13,17,23,0.07)' }}>
                <div style={{ width:'clamp(44px,5vw,56px)', height:'clamp(44px,5vw,56px)', borderRadius:'clamp(10px,1.2vw,14px)', background:`${step.color}10`, border:`1.5px solid ${step.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(20px,2.5vw,26px)', flexShrink:0, zIndex:1 }}>{step.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700, color:step.color, letterSpacing:'.12em', background:`${step.color}10`, padding:'2px 7px', borderRadius:4 }}>{step.num}</span>
                    <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:'clamp(16px,1.8vw,21px)', color:'#0D1117', margin:0 }}>{step.title}</h3>
                  </div>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(12px,1.2vw,14px)', color:'#4A5568', lineHeight:1.65, margin:0, fontWeight:300 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
