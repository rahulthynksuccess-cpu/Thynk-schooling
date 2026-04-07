'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useContent } from '@/hooks/useContent'

const CARDS=[
  {icon:'🔍',title:'Smart Search',desc:'Filter by board, city, fee, medium and 20+ parameters in seconds.',accent:'#B8860B',num:'01'},
  {icon:'⚖️',title:'Side-by-Side Compare',desc:'Compare up to 4 schools on fees, ratings, infrastructure and more.',accent:'#0A5F55',num:'02'},
  {icon:'🤖',title:'AI Recommendations',desc:'Personalised suggestions trained on thousands of parent journeys.',accent:'#7A4A9A',num:'03'},
  {icon:'📋',title:'One-Click Apply',desc:'Submit enquiries to multiple schools simultaneously.',accent:'#B8860B',num:'04'},
  {icon:'👨‍💼',title:'Expert Counselling',desc:'Free 1-on-1 sessions with certified admission counsellors.',accent:'#0A5F55',num:'05'},
  {icon:'✅',title:'Verified Listings',desc:'Every school verified with real reviews and authentic data.',accent:'#7A4A9A',num:'06'},
]

export function WhyChooseUs() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.06})
  const ct=useContent('home')??{}
  const [hovered,setHovered]=useState<number|null>(null)

  return (
    <section ref={ref} style={{background:'linear-gradient(160deg,#F5F0E8 0%,#EDE5D8 50%,#F0EAD6 100%)',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      {/* Giant watermark */}
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'"Cormorant Garamond",serif',fontSize:'clamp(160px,24vw,320px)',fontWeight:700,color:'rgba(13,17,23,0.022)',whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',letterSpacing:'-10px',lineHeight:1}}>WHY US</div>
      {/* SVG mesh */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="wg1" cx="90%" cy="10%" r="50%"><stop stopColor="#B8860B" stopOpacity=".05"/><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <radialGradient id="wg2" cx="10%" cy="90%" r="45%"><stop stopColor="#0A5F55" stopOpacity=".04"/><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
          <filter id="wb"><feGaussianBlur stdDeviation="50"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#wg1)" filter="url(#wb)"/>
        <rect width="100%" height="100%" fill="url(#wg2)" filter="url(#wb)"/>
      </svg>

      <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative'}}>
        {/* Split header */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(40px,6vw,100px)',alignItems:'flex-end',marginBottom:'clamp(52px,7vw,90px)'}}>
          <motion.div initial={{opacity:0,x:-28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:24}}>
              <span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>
              Why Parents Choose Us
              <span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>
            </div>
            <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.6rem,5.5vw,5.2rem)',color:'#0D1117',lineHeight:.88,letterSpacing:'-2.5px',margin:0}}>
              {ct.whyTitle||'Everything You Need,'}
              <em className="text-shimmer" style={{display:'block',fontStyle:'italic'}}>Nothing You Don&apos;t</em>
            </h2>
          </motion.div>
          <motion.p initial={{opacity:0,x:28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}
            style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.6vw,17px)',color:'#4A5568',lineHeight:1.8,fontWeight:300,alignSelf:'flex-end',paddingBottom:4}}>
            Built on feedback from real Indian parents. Every feature serves one purpose — helping you find the right school faster, with total confidence.
          </motion.p>
        </div>

        {/* Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,1.8vw,20px)'}}>
          {CARDS.map((c,i)=>(
            <motion.div key={c.title}
              initial={{opacity:0,y:40,scale:.93}} animate={inView?{opacity:1,y:0,scale:1}:{}}
              transition={{delay:i*.1,duration:.65,ease:[.22,1,.36,1]}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
              style={{background:hovered===i?'#fff':'rgba(255,255,255,0.75)',borderRadius:'clamp(14px,2vw,22px)',padding:'clamp(24px,3.5vw,44px)',border:`1.5px solid ${hovered===i?c.accent+'40':'rgba(13,17,23,0.06)'}`,boxShadow:hovered===i?`0 28px 72px rgba(13,17,23,0.12),0 0 0 1px ${c.accent}28`:'0 2px 16px rgba(13,17,23,0.04)',transition:'all .32s cubic-bezier(.22,1,.36,1)',position:'relative',overflow:'hidden',cursor:'default',transform:hovered===i?'translateY(-10px)':'translateY(0)'}}>
              {/* Corner glow */}
              <div style={{position:'absolute',top:'-20px',right:'-20px',width:150,height:150,background:`radial-gradient(circle,${c.accent}${hovered===i?'18':'0a'} 0%,transparent 70%)`,filter:'blur(20px)',transition:'opacity .32s',pointerEvents:'none'}}/>
              {/* Shimmer sweep */}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.7) 50%,transparent 70%)',backgroundSize:'200%',animation:hovered===i?'shimmerBg 1.8s ease-in-out infinite':'none',pointerEvents:'none'}}/>
              {/* Number watermark */}
              <div style={{position:'absolute',bottom:20,right:24,fontFamily:'"Cormorant Garamond",serif',fontSize:80,fontWeight:700,color:`${hovered===i?c.accent:'rgba(13,17,23,0.04)'}`,lineHeight:1,letterSpacing:'-4px',transition:'color .32s',pointerEvents:'none'}}>{c.num}</div>
              <div style={{fontSize:'clamp(28px,3.5vw,44px)',marginBottom:20,transition:'transform .35s cubic-bezier(.22,1,.36,1)',transform:hovered===i?'scale(1.15) translateY(-3px)':'scale(1)'}}>{c.icon}</div>
              <div style={{width:28,height:2.5,background:hovered===i?c.accent:'rgba(13,17,23,0.1)',borderRadius:2,marginBottom:16,transition:'all .35s cubic-bezier(.22,1,.36,1)',transform:hovered===i?'scaleX(1.6)':'scaleX(1)',transformOrigin:'left'}}/>
              <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(17px,1.8vw,23px)',color:'#0D1117',marginBottom:10,lineHeight:1.1}}>{c.title}</h3>
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.2vw,15px)',color:'#4A5568',lineHeight:1.7,margin:0,fontWeight:300}}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
