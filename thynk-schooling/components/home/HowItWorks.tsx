'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useContent } from '@/hooks/useContent'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEPS=[
  {num:'01',title:'Search Schools',desc:'Smart filters — board, city, fee, medium, 20+ criteria.',icon:'🔎',color:'#B8860B',bg:'rgba(184,134,11,0.08)'},
  {num:'02',title:'Compare & Review',desc:'Side-by-side with verified parent reviews and ratings.',icon:'📊',color:'#0A5F55',bg:'rgba(10,95,85,0.08)'},
  {num:'03',title:'Get Counselled',desc:'Free 30-min expert session to find your perfect fit.',icon:'🧑‍💼',color:'#7A4A9A',bg:'rgba(122,74,154,0.08)'},
  {num:'04',title:'Apply & Enrol',desc:'One-click enquiries, track all applications in one place.',icon:'✅',color:'#B8860B',bg:'rgba(184,134,11,0.08)'},
]

export function HowItWorks() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.08})
  const [active,setActive]=useState(0)
  const ct=useContent('home')??{}

  return (
    <section ref={ref} style={{background:'#FDFAF5',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      {/* Background elements */}
      <div style={{position:'absolute',top:'-80px',right:'-80px',width:400,height:400,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.08)',pointerEvents:'none',animation:'spinSlow 50s linear infinite'}}/>
      <div style={{position:'absolute',top:'-40px',right:'-40px',width:280,height:280,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.12)',pointerEvents:'none',animation:'spinSlowRev 35s linear infinite'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:200,background:'linear-gradient(to top,rgba(245,240,232,0.5),transparent)',pointerEvents:'none'}}/>

      <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'}}>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.65fr)',gap:'clamp(48px,7vw,100px)',alignItems:'center'}}>

          {/* Left */}
          <motion.div initial={{opacity:0,x:-28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:24}}>
              <span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>
              How It Works
            </div>
            <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.6rem,5.5vw,5.2rem)',color:'#0D1117',lineHeight:.88,letterSpacing:'-2.5px',marginBottom:24}}>
              Admission
              <em className="text-shimmer" style={{display:'block',fontStyle:'italic'}}>Made Simple</em>
            </h2>
            <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.5vw,17px)',color:'#4A5568',lineHeight:1.8,fontWeight:300,marginBottom:40}}>
              From searching to enrolment — guided at every step. Completely free for parents, always.
            </p>

            {/* Step indicator dots */}
            <div style={{display:'flex',gap:8,marginBottom:40}}>
              {STEPS.map((_,i)=>(
                <button key={i} onClick={()=>setActive(i)} style={{height:4,flex:1,borderRadius:99,background:i===active?'#B8860B':'rgba(13,17,23,0.1)',border:'none',cursor:'pointer',transition:'all .3s',transform:i===active?'scaleY(1.5)':'scaleY(1)'}}/>
              ))}
            </div>

            {/* Active step detail */}
            <motion.div key={active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.35}}>
              <div style={{padding:'20px 24px',background:'#fff',borderRadius:14,border:`1.5px solid ${STEPS[active].color}22`,boxShadow:`0 8px 32px ${STEPS[active].color}10`,marginBottom:36}}>
                <div style={{fontSize:32,marginBottom:10}}>{STEPS[active].icon}</div>
                <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:6}}>{STEPS[active].title}</div>
                <div style={{fontFamily:'Inter,sans-serif',fontSize:14,color:'#4A5568',fontWeight:300,lineHeight:1.65}}>{STEPS[active].desc}</div>
              </div>
            </motion.div>

            <Link href="/schools" style={{display:'inline-flex',alignItems:'center',gap:10,padding:'14px 28px',background:'#0D1117',color:'#FAF7F2',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,textDecoration:'none',transition:'all .22s',boxShadow:'0 4px 20px rgba(13,17,23,0.2)'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.boxShadow='0 4px 24px rgba(184,134,11,0.4)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#0D1117';el.style.boxShadow='0 4px 20px rgba(13,17,23,0.2)'}}>
              Start Your Search <ArrowRight style={{width:15,height:15}}/>
            </Link>
          </motion.div>

          {/* Right — step cards */}
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(12px,1.8vw,16px)',position:'relative'}}>
            {/* Connector */}
            <div style={{position:'absolute',left:'calc(clamp(22px,2.5vw,28px))',top:40,bottom:40,width:1,background:'linear-gradient(to bottom,rgba(184,134,11,0.3),rgba(184,134,11,0.05))',pointerEvents:'none'}}/>

            {STEPS.map((step,i)=>(
              <motion.div key={step.num}
                initial={{opacity:0,x:32}} animate={inView?{opacity:1,x:0}:{}}
                transition={{delay:i*.1,duration:.6,ease:[.22,1,.36,1]}}
                onClick={()=>setActive(i)}
                style={{display:'flex',gap:'clamp(16px,2vw,24px)',alignItems:'flex-start',background:active===i?'#fff':'rgba(255,255,255,0.5)',borderRadius:'clamp(14px,1.5vw,18px)',padding:'clamp(18px,2.5vw,28px)',border:`1.5px solid ${active===i?step.color+'33':'rgba(13,17,23,0.06)'}`,boxShadow:active===i?`0 12px 40px ${step.color}12`:'0 2px 12px rgba(13,17,23,0.03)',transition:'all .28s cubic-bezier(.22,1,.36,1)',cursor:'pointer',transform:active===i?'translateX(8px)':'translateX(0)'}}>
                <div style={{width:'clamp(44px,5vw,56px)',height:'clamp(44px,5vw,56px)',borderRadius:'clamp(10px,1.2vw,14px)',background:active===i?step.bg:'rgba(13,17,23,0.04)',border:`1.5px solid ${active===i?step.color+'25':'rgba(13,17,23,0.06)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(20px,2.5vw,26px)',flexShrink:0,zIndex:1,transition:'all .28s'}}>
                  {step.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <span style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,color:step.color,letterSpacing:'.12em',background:`${step.color}10`,padding:'2px 7px',borderRadius:4,transition:'all .28s'}}>{step.num}</span>
                    <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(16px,1.8vw,21px)',color:'#0D1117',margin:0}}>{step.title}</h3>
                  </div>
                  <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(12px,1.2vw,14px)',color:'#4A5568',lineHeight:1.65,margin:0,fontWeight:300}}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
