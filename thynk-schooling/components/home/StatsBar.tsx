'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'

function Counter({to,suffix='',prefix=''}:{to:number,suffix?:string,prefix?:string}) {
  const [v,setV]=useState(0)
  const ref=useRef<HTMLSpanElement>(null)
  const inView=useInView(ref,{once:true})
  useEffect(()=>{
    if(!inView)return
    const dur=1800,start=performance.now()
    const tick=(now:number)=>{const p=Math.min((now-start)/dur,1);const ease=1-Math.pow(1-p,3);setV(Math.round(ease*to));if(p<1)requestAnimationFrame(tick)}
    requestAnimationFrame(tick)
  },[inView,to])
  return <span ref={ref}>{prefix}{v.toLocaleString('en-IN')}{suffix}</span>
}

export function StatsBar() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.2})
  const ct=useContent('home')??{}

  const STATS=[
    {icon:'🏫',custom:ct.stat1Num||'12,000+',label:ct.stat1Label||'Verified Schools',sub:'Across India'},
    {icon:'👨‍👩‍👧',custom:ct.stat2Num||'1 Lakh+',label:ct.stat2Label||'Happy Parents',sub:'& counting'},
    {icon:'🏙️',custom:ct.stat3Num||'350+',label:ct.stat3Label||'Indian Cities',sub:'Covered'},
    {icon:'⭐',custom:ct.stat4Num||'98%',label:ct.stat4Label||'Satisfaction',sub:'Rate'},
    {icon:'🏆',custom:ct.stat5Num||'4.8 ★',label:ct.stat5Label||'Avg Rating',sub:'from parents'},
  ]

  return (
    <section ref={ref} style={{ background:'#0D1117',padding:'clamp(56px,8vw,88px) 0',position:'relative',overflow:'hidden' }}>
      {/* subtle gold glow centre */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:300,background:'radial-gradient(ellipse,rgba(184,134,11,0.07) 0%,transparent 70%)',filter:'blur(40px)',pointerEvents:'none' }}/>
      {/* dot grid */}
      <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none' }}/>
      {/* horizontal rule */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.2),rgba(184,134,11,0.1),transparent)' }}/>
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.15),transparent)' }}/>

      <div style={{ maxWidth:'1480px',margin:'0 auto',padding:'0 clamp(24px,5vw,72px)',position:'relative',zIndex:1 }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'clamp(0px,1px,1px)' }}>
          {STATS.map((s,i)=>(
            <motion.div key={s.label}
              initial={{opacity:0,y:24}} animate={inView?{opacity:1,y:0}:{}}
              transition={{delay:i*0.09,duration:0.55,ease:[0.22,1,0.36,1]}}
              style={{
                textAlign:'center',
                padding:'clamp(28px,3.5vw,44px) 16px',
                position:'relative',
                cursor:'default',
                transition:'all .3s cubic-bezier(.22,1,.36,1)',
                borderRight: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(184,134,11,0.06)';el.style.transform='translateY(-4px)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.transform=''}}
            >
              {/* icon */}
              <div style={{ fontSize:'clamp(28px,3.5vw,38px)',marginBottom:16,display:'inline-block',filter:'drop-shadow(0 0 10px rgba(184,134,11,0.28))' }}>{s.icon}</div>
              {/* number */}
              <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(30px,4.5vw,52px)',color:'#FAF7F2',lineHeight:0.95,marginBottom:10,letterSpacing:'-2px' }}>
                {s.custom}
              </div>
              {/* label */}
              <div style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(11px,1.1vw,12.5px)',color:'rgba(250,247,242,0.5)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:3 }}>{s.label}</div>
              <div style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(10px,1vw,11px)',color:'rgba(250,247,242,0.22)',fontWeight:300 }}>{s.sub}</div>
              {/* bottom accent */}
              <div style={{ position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:0,height:2,background:'linear-gradient(90deg,#B8860B,#E8C547)',borderRadius:99,transition:'width .3s ease' }} className="stat-bar"/>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`.stat-bar{transition:width .3s ease}div:hover .stat-bar{width:36px!important}`}</style>
    </section>
  )
}
