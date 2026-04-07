'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useContent } from '@/hooks/useContent'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const STEPS=[
  {num:'01',title:'Search Schools',desc:'Smart filters — board, city, fee, medium, 20+ criteria.',icon:'🔎',color:'#B8860B',light:'rgba(184,134,11,0.08)'},
  {num:'02',title:'Compare & Review',desc:'Side-by-side with verified parent reviews and ratings.',icon:'📊',color:'#0A5F55',light:'rgba(10,95,85,0.08)'},
  {num:'03',title:'Get Counselled',desc:'Free 30-min expert session to find your perfect fit.',icon:'🧑‍💼',color:'#7A4A9A',light:'rgba(122,74,154,0.08)'},
  {num:'04',title:'Apply & Enrol',desc:'One-click enquiries, track all applications in one place.',icon:'✅',color:'#B8860B',light:'rgba(184,134,11,0.08)'},
]

export function HowItWorks() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.08})
  const [active,setActive]=useState(0)
  const ct=useContent('home')??{}

  return (
    <section ref={ref} style={{ background:'#FDFAF5',padding:'clamp(80px,10vw,128px) 0',position:'relative',overflow:'hidden' }}>
      {/* decorative rings */}
      <div style={{ position:'absolute',top:'-80px',right:'-80px',width:420,height:420,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.07)',pointerEvents:'none',animation:'spinSlow 60s linear infinite' }}/>
      <div style={{ position:'absolute',top:'-40px',right:'-40px',width:280,height:280,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.10)',pointerEvents:'none',animation:'spinSlowRev 42s linear infinite' }}/>
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:160,background:'linear-gradient(to top,rgba(240,234,214,0.5),transparent)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1480px',margin:'0 auto',padding:'0 clamp(24px,5vw,72px)' }}>
        <div style={{ display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.6fr)',gap:'clamp(48px,7vw,96px)',alignItems:'center' }}>

          {/* Left */}
          <motion.div initial={{opacity:0,x:-28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            {/* eyebrow */}
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:22 }}>
              <span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>
              How It Works
            </div>

            <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.6rem,5.5vw,5rem)',color:'#0D1117',lineHeight:.88,letterSpacing:'-2.5px',marginBottom:20 }}>
              Admission<br/>
              <em style={{fontStyle:'italic',color:'#B8860B'}}>Made Simple</em>
            </h2>
            <p style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.5vw,16px)',color:'#4A5568',lineHeight:1.8,fontWeight:300,marginBottom:36 }}>
              From searching to enrolment — guided at every step. Completely free for parents, always.
            </p>

            {/* Step progress dots */}
            <div style={{ display:'flex',gap:8,marginBottom:32 }}>
              {STEPS.map((_,i)=>(
                <button key={i} onClick={()=>setActive(i)} style={{ height:4,flex:1,borderRadius:99,background:i===active?'#B8860B':'rgba(13,17,23,0.09)',border:'none',cursor:'pointer',transition:'all .3s',transform:i===active?'scaleY(1.6)':'scaleY(1)' }}/>
              ))}
            </div>

            {/* Active step preview */}
            <motion.div key={active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.32}}>
              <div style={{ padding:'20px 22px',background:'#fff',borderRadius:14,border:`1.5px solid ${STEPS[active].color}22`,boxShadow:`0 6px 28px ${STEPS[active].color}0D`,marginBottom:32 }}>
                <div style={{ fontSize:30,marginBottom:10 }}>{STEPS[active].icon}</div>
                <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:20,color:'#0D1117',marginBottom:5 }}>{STEPS[active].title}</div>
                <div style={{ fontFamily:'Inter,sans-serif',fontSize:14,color:'#4A5568',fontWeight:300,lineHeight:1.65 }}>{STEPS[active].desc}</div>
              </div>
            </motion.div>

            <Link href="/schools" style={{ display:'inline-flex',alignItems:'center',gap:9,padding:'13px 26px',background:'#0D1117',color:'#FAF7F2',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,textDecoration:'none',transition:'all .22s',boxShadow:'0 4px 18px rgba(13,17,23,0.18)' }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.boxShadow='0 4px 24px rgba(184,134,11,0.38)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#0D1117';el.style.boxShadow='0 4px 18px rgba(13,17,23,0.18)'}}>
              Start Your Search <ArrowRight style={{width:15,height:15}}/>
            </Link>
          </motion.div>

          {/* Right — step cards */}
          <div style={{ display:'flex',flexDirection:'column',gap:'clamp(10px,1.6vw,14px)',position:'relative' }}>
            {/* connector line */}
            <div style={{ position:'absolute',left:'calc(clamp(22px,2.5vw,28px))',top:48,bottom:48,width:1,background:'linear-gradient(to bottom,rgba(184,134,11,0.25),rgba(184,134,11,0.04))',pointerEvents:'none' }}/>

            {STEPS.map((step,i)=>(
              <motion.div key={step.num}
                initial={{opacity:0,x:32}} animate={inView?{opacity:1,x:0}:{}}
                transition={{delay:i*.09,duration:.6,ease:[.22,1,.36,1]}}
                onClick={()=>setActive(i)}
                style={{
                  display:'flex',gap:'clamp(16px,2vw,22px)',alignItems:'flex-start',
                  background:active===i?'#fff':'rgba(255,255,255,0.55)',
                  borderRadius:'clamp(14px,1.5vw,18px)',
                  padding:'clamp(18px,2.5vw,26px)',
                  border:`1.5px solid ${active===i?step.color+'30':'rgba(13,17,23,0.06)'}`,
                  boxShadow:active===i?`0 10px 36px ${step.color}10`:'0 1px 8px rgba(13,17,23,0.03)',
                  transition:'all .26s cubic-bezier(.22,1,.36,1)',
                  cursor:'pointer',
                  transform:active===i?'translateX(6px)':'translateX(0)',
                }}
              >
                <div style={{ width:'clamp(44px,5vw,52px)',height:'clamp(44px,5vw,52px)',borderRadius:'clamp(10px,1.2vw,13px)',background:active===i?step.light:'rgba(13,17,23,0.03)',border:`1.5px solid ${active===i?step.color+'22':'rgba(13,17,23,0.06)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(20px,2.5vw,24px)',flexShrink:0,zIndex:1,transition:'all .26s' }}>
                  {step.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:5 }}>
                    <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,color:step.color,letterSpacing:'.1em',background:`${step.color}10`,padding:'2px 7px',borderRadius:4 }}>{step.num}</span>
                    <h3 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(16px,1.8vw,20px)',color:'#0D1117',margin:0 }}>{step.title}</h3>
                  </div>
                  <p style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(12px,1.2vw,13.5px)',color:'#4A5568',lineHeight:1.65,margin:0,fontWeight:300 }}>{step.desc}</p>
                </div>
                {active===i && <CheckCircle2 style={{width:16,height:16,color:step.color,flexShrink:0,marginTop:2}} />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spinSlow{to{transform:rotate(360deg)}}@keyframes spinSlowRev{to{transform:rotate(-360deg)}}`}</style>
    </section>
  )
}
