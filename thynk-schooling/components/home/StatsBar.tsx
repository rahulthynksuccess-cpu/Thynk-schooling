'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'

function Counter({to,suffix='',prefix=''}:{to:number,suffix?:string,prefix?:string}) {
  const [v,setV]=useState(0)
  const ref=useRef<HTMLSpanElement>(null)
  const inView=useInView(ref,{once:true})
  useEffect(()=>{
    if(!inView)return
    const dur=1800,start=performance.now()
    const tick=(now:number)=>{
      const p=Math.min((now-start)/dur,1)
      const ease=1-Math.pow(1-p,3)
      setV(Math.round(ease*to))
      if(p<1)requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  },[inView,to])
  return <span ref={ref}>{prefix}{v.toLocaleString('en-IN')}{suffix}</span>
}

export function StatsBar() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.2})
  const ct=useContent('home')??{}

  const STATS=[
    {icon:'🏫', custom: ct.stat1Num||'12,000+', label: ct.stat1Label||'Verified Schools',  sub:'Across India'},
    {icon:'👨‍👩‍👧', custom: ct.stat2Num||'1 Lakh+',  label: ct.stat2Label||'Happy Parents',    sub:'& counting'},
    {icon:'🏙️', custom: ct.stat3Num||'350+',     label: ct.stat3Label||'Indian Cities',    sub:'Covered'},
    {icon:'⭐',  custom: ct.stat4Num||'98%',      label: ct.stat4Label||'Satisfaction',     sub:'Rate'},
    {icon:'🏆',  custom: ct.stat5Num||'4.8 ★',   label: ct.stat5Label||'Avg Rating',       sub:'from parents'},
  ]
  return (
    <section ref={ref} style={{background:'#0D1117',padding:'clamp(56px,8vw,96px) 0',position:'relative',overflow:'hidden'}}>
      {/* Mesh */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sg1" cx="50%" cy="50%" r="60%"><stop stopColor="#B8860B" stopOpacity=".08"/><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <radialGradient id="sg2" cx="20%" cy="80%" r="40%"><stop stopColor="#0A5F55" stopOpacity=".05"/><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
          <filter id="sb"><feGaussianBlur stdDeviation="60"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg1)" filter="url(#sb)"/>
        <rect width="100%" height="100%" fill="url(#sg2)" filter="url(#sb)"/>
      </svg>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.1) 1px,transparent 1px)',backgroundSize:'30px 30px',pointerEvents:'none'}}/>
      {/* Gold horizontal line */}
      <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.15),rgba(184,134,11,0.08),transparent)',pointerEvents:'none'}}/>

      <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative',zIndex:1}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'clamp(12px,2vw,20px)'}}>
          {STATS.map((s,i)=>(
            <motion.div key={s.label}
              initial={{opacity:0,y:32,scale:.92}} animate={inView?{opacity:1,y:0,scale:1}:{}}
              transition={{delay:i*.1,duration:.6,ease:[.22,1,.36,1]}}
              style={{textAlign:'center',padding:'clamp(24px,3vw,36px) 16px',position:'relative',cursor:'default',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,backdropFilter:'blur(8px)',transition:'all .3s cubic-bezier(.22,1,.36,1)',overflow:'hidden'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(184,134,11,0.08)';el.style.borderColor='rgba(184,134,11,0.25)';el.style.transform='translateY(-6px)';el.style.boxShadow='0 20px 60px rgba(184,134,11,0.15)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(255,255,255,0.04)';el.style.borderColor='rgba(255,255,255,0.06)';el.style.transform='';el.style.boxShadow='none'}}>
              {/* Glow blob */}
              <div style={{position:'absolute',top:'-20px',left:'50%',transform:'translateX(-50%)',width:80,height:80,background:'radial-gradient(circle,rgba(184,134,11,0.2),transparent 70%)',filter:'blur(16px)',pointerEvents:'none'}}/>
              {/* Bottom accent line */}
              <div style={{position:'absolute',bottom:0,left:'20%',right:'20%',height:2,background:'linear-gradient(90deg,transparent,#B8860B,transparent)',borderRadius:99,opacity:.5}}/>

              {i<4&&<div style={{position:'absolute',right:0,top:'20%',height:'60%',width:'1px',background:'linear-gradient(to bottom,transparent,rgba(255,255,255,0.06),transparent)'}}/>}
              {/* Icon with glow */}
              <motion.div style={{fontSize:'clamp(26px,3.5vw,40px)',marginBottom:16,display:'inline-block',filter:'drop-shadow(0 0 12px rgba(184,134,11,0.3))',animation:`floatY ${3.5+i*.4}s ease-in-out infinite`,animationDelay:`${i*-.5}s`}}>{s.icon}</motion.div>
              {/* Number */}
              <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(30px,4.5vw,56px)',color:'#FAF7F2',lineHeight:.95,marginBottom:8,letterSpacing:'-2px'}}>
                {s.custom}
              </div>
              {/* Label */}
              <div style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(11px,1.1vw,13px)',color:'rgba(250,247,242,0.55)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4}}>{s.label}</div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(10px,1vw,11px)',color:'rgba(250,247,242,0.25)',fontWeight:300,letterSpacing:'.04em'}}>{s.sub}</div>
              {/* Gold underline accent on hover */}
              <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:0,height:2,background:'#B8860B',borderRadius:99,transition:'width .3s ease'}} className="stat-line"/>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`.stat-line{transition:width .3s ease;width:0}section:has(.stat-line) div:hover .stat-line{width:40px}`}</style>
    </section>
  )
}
