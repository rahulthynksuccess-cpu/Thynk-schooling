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
    <section ref={ref} style={{ background:'linear-gradient(160deg,#F5F0E8 0%,#EDE5D8 50%,#F0EAD6 100%)',padding:'clamp(80px,10vw,128px) 0',position:'relative',overflow:'hidden' }}>
      {/* watermark text */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'"Cormorant Garamond",serif',fontSize:'clamp(120px,20vw,260px)',fontWeight:700,color:'rgba(13,17,23,0.02)',whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',letterSpacing:'-8px',lineHeight:1 }}>WHY US</div>
      {/* ambient glows */}
      <div style={{ position:'absolute',top:'10%',right:'5%',width:360,height:360,background:'radial-gradient(circle,rgba(184,134,11,0.07) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',bottom:'10%',left:'5%',width:300,height:300,background:'radial-gradient(circle,rgba(10,95,85,0.05) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1480px',margin:'0 auto',padding:'0 clamp(24px,5vw,72px)',position:'relative' }}>
        {/* header */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(40px,6vw,100px)',alignItems:'flex-end',marginBottom:'clamp(52px,7vw,88px)' }}>
          <motion.div initial={{opacity:0,x:-28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:22 }}>
              <span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>Why Parents Choose Us<span style={{width:24,height:1.5,background:'#B8860B',display:'block',borderRadius:2}}/>
            </div>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.6rem,5.5vw,5rem)',color:'#0D1117',lineHeight:.88,letterSpacing:'-2.5px',margin:0 }}>
              {ct.whyTitle||'Everything You Need,'}<br/>
              <em style={{fontStyle:'italic',color:'#B8860B'}}>Nothing You Don&apos;t</em>
            </h2>
          </motion.div>
          <motion.p initial={{opacity:0,x:28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}
            style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.6vw,16px)',color:'#4A5568',lineHeight:1.8,fontWeight:300,alignSelf:'flex-end',paddingBottom:4 }}>
            Built on feedback from real Indian parents. Every feature serves one purpose — helping you find the right school faster, with total confidence.
          </motion.p>
        </div>

        {/* Cards — 3 col */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,1.8vw,18px)' }}>
          {CARDS.map((c,i)=>(
            <motion.div key={c.title}
              initial={{opacity:0,y:36,scale:.94}} animate={inView?{opacity:1,y:0,scale:1}:{}}
              transition={{delay:i*.09,duration:.6,ease:[.22,1,.36,1]}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
              style={{
                background:hovered===i?'#fff':'rgba(255,255,255,0.72)',
                borderRadius:'clamp(14px,2vw,20px)',
                padding:'clamp(24px,3.5vw,40px)',
                border:`1.5px solid ${hovered===i?c.accent+'38':'rgba(13,17,23,0.06)'}`,
                boxShadow:hovered===i?`0 24px 64px rgba(13,17,23,0.11),0 0 0 1px ${c.accent}1A`:'0 2px 12px rgba(13,17,23,0.04)',
                transition:'all .3s cubic-bezier(.22,1,.36,1)',
                position:'relative',overflow:'hidden',cursor:'default',
                transform:hovered===i?'translateY(-8px)':'translateY(0)',
              }}
            >
              {/* corner glow */}
              <div style={{ position:'absolute',top:'-16px',right:'-16px',width:120,height:120,background:`radial-gradient(circle,${c.accent}${hovered===i?'15':'08'} 0%,transparent 70%)`,filter:'blur(18px)',transition:'opacity .3s',pointerEvents:'none' }}/>
              {/* number watermark */}
              <div style={{ position:'absolute',bottom:16,right:22,fontFamily:'"Cormorant Garamond",serif',fontSize:72,fontWeight:700,color:`${hovered===i?c.accent:'rgba(13,17,23,0.04)'}`,lineHeight:1,letterSpacing:'-3px',transition:'color .32s',pointerEvents:'none' }}>{c.num}</div>
              {/* top accent bar */}
              <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:hovered===i?`linear-gradient(90deg,${c.accent},transparent)`:' transparent',borderRadius:'20px 20px 0 0',transition:'background .3s' }}/>

              <div style={{ fontSize:'clamp(28px,3.5vw,40px)',marginBottom:18,transition:'transform .32s',transform:hovered===i?'scale(1.12) translateY(-3px)':'scale(1)' }}>{c.icon}</div>
              <div style={{ width:26,height:2.5,background:hovered===i?c.accent:'rgba(13,17,23,0.08)',borderRadius:2,marginBottom:14,transition:'all .32s',transform:hovered===i?'scaleX(1.5)':'scaleX(1)',transformOrigin:'left' }}/>
              <h3 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(17px,1.8vw,22px)',color:'#0D1117',marginBottom:9,lineHeight:1.1 }}>{c.title}</h3>
              <p style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.2vw,14px)',color:'#4A5568',lineHeight:1.7,margin:0,fontWeight:300 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
