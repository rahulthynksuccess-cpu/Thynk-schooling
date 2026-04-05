'use client'
import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'

const STATS=[{value:'12,000+',label:'Verified Schools'},{value:'1 Lakh+',label:'Parents Helped'},{value:'35+',label:'Indian Cities'},{value:'2021',label:'Founded'}]
const TEAM=[
  {name:'Arjun Mehra',role:'Co-Founder & CEO',initials:'AM',desc:'Former IIT Delhi, 10 years in EdTech across India and Southeast Asia.',color:'#B8860B'},
  {name:'Priya Nair',role:'Co-Founder & CPO',initials:'PN',desc:"Ex-BYJU'S product lead. Passionate about making education accessible.",color:'#0A5F55'},
  {name:'Rahul Agarwal',role:'Head of School Ops',initials:'RA',desc:'Built partnerships with 8,000+ schools across 20 Indian cities.',color:'#7A4A9A'},
  {name:'Sneha Krishnan',role:'Head of Counselling',initials:'SK',desc:'Certified education counsellor with 12 years of parent advisory experience.',color:'#B8860B'},
]
const VALUES=[
  {icon:'🎯',title:'Parent First',desc:'Every decision starts with — does this make life easier for parents?'},
  {icon:'✅',title:'Radical Honesty',desc:'No paid rankings, no hidden promotions, no fake reviews. Only verified data.'},
  {icon:'🤝',title:'Fairness',desc:'Free for parents always. Fair pricing for schools. No pay-to-win discovery.'},
  {icon:'🌍',title:'Access for All',desc:'Premium guidance should not be only for families who can afford counsellors.'},
]

function Section({children,bg='#FDFAF5',className=''}:{children:React.ReactNode,bg?:string,className?:string}) {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.08})
  return (
    <motion.section ref={ref} initial={{opacity:0,y:32}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}
      style={{background:bg,padding:'clamp(72px,10vw,120px) 0',position:'relative',overflow:'hidden'}} className={className}>
      {children}
    </motion.section>
  )
}

export default function AboutPage() {
  const heroRef=useRef(null)
  const {scrollY}=useScroll()
  const heroY=useTransform(scrollY,[0,500],[0,60])

  return (
    <>
      <Navbar/>
      <main style={{background:'#FAF7F2',paddingTop:72}}>

        {/* ── HERO ── */}
        <section style={{background:'linear-gradient(160deg,#0D1117 0%,#1a2540 60%,#0D1117 100%)',padding:'clamp(80px,12vw,140px) 0',position:'relative',overflow:'hidden',minHeight:'70vh',display:'flex',alignItems:'center'}}>
          {/* Animated mesh */}
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="ag1" cx="20%" cy="30%"><stop stopColor="#B8860B" stopOpacity=".12"><animate attributeName="cx" values="20%;40%;20%" dur="18s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
              <radialGradient id="ag2" cx="80%" cy="70%"><stop stopColor="#0A5F55" stopOpacity=".07"><animate attributeName="cx" values="80%;60%;80%" dur="22s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
              <filter id="abl"><feGaussianBlur stdDeviation="60"/></filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#ag1)" filter="url(#abl)"/>
            <rect width="100%" height="100%" fill="url(#ag2)" filter="url(#abl)"/>
          </svg>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none'}}/>
          {/* Spinning rings */}
          <div className="spin-cw" style={{position:'absolute',top:'50%',right:'8%',width:400,height:400,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.12)',transform:'translate(0,-50%)',pointerEvents:'none'}}/>
          <div className="spin-ccw" style={{position:'absolute',top:'50%',right:'8%',width:280,height:280,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.08)',transform:'translate(60px,-50%)',pointerEvents:'none'}}/>

          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative',zIndex:1,width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(48px,7vw,100px)',alignItems:'center'}}>
              <div>
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6,ease:[.22,1,.36,1]}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:24}}>
                    <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>Our Story
                  </div>
                </motion.div>
                <motion.h1 initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:.75,delay:.08,ease:[.22,1,.36,1]}}
                  style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(3rem,6vw,5.5rem)',color:'#FAF7F2',lineHeight:.9,letterSpacing:'-3px',marginBottom:28}}>
                  Every Child Deserves the
                  <em className="shimmer-text" style={{display:'block',fontStyle:'italic'}}> Right School</em>
                </motion.h1>
                <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.2,ease:[.22,1,.36,1]}}
                  style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(15px,1.7vw,18px)',color:'rgba(250,247,242,0.65)',lineHeight:1.8,fontWeight:300,marginBottom:40,maxWidth:500}}>
                  Thynk Schooling was born from a simple frustration — finding the right school in India is unnecessarily hard. We changed that.
                </motion.p>
                <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.32,ease:[.22,1,.36,1]}}>
                  <Link href="/counselling" className="btn btn-gold" style={{display:'inline-flex',alignItems:'center',gap:8}}>
                    Talk to Us Free <ArrowRight style={{width:15,height:15}}/>
                  </Link>
                </motion.div>
              </div>
              {/* Stats grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(12px,2vw,18px)'}}>
                {STATS.map((s,i)=>(
                  <motion.div key={s.label} initial={{opacity:0,scale:.88,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{delay:.15+i*.1,duration:.6,ease:[.22,1,.36,1]}}
                    className="float" style={{animationDelay:`${i*.5}s`,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:18,padding:'clamp(22px,3vw,36px)',textAlign:'center',backdropFilter:'blur(12px)'}}>
                    <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,4vw,3.2rem)',color:'#E8C547',lineHeight:1,marginBottom:8,letterSpacing:'-1px'}}>{s.value}</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(10px,1vw,12px)',color:'rgba(250,247,242,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.12em'}}>{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MISSION ── */}
        <Section bg="#0D1117" className="section-dark">
          <div style={{maxWidth:'860px',margin:'0 auto',textAlign:'center',padding:'0 clamp(24px,5vw,80px)',position:'relative',zIndex:1}}>
            <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.65}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:24,justifyContent:'center'}}>
                <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>Our Mission<span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>
              </div>
              <blockquote style={{fontFamily:'"Cormorant Garamond",serif',fontStyle:'italic',fontWeight:600,fontSize:'clamp(1.8rem,4vw,3.2rem)',color:'#FAF7F2',lineHeight:1.2,letterSpacing:'-1.5px',marginBottom:32}}>
                &ldquo;To make school discovery radically transparent, fast, and free — for every parent in India.&rdquo;
              </blockquote>
              <div style={{width:60,height:2,background:'linear-gradient(90deg,#B8860B,#E8C547)',margin:'0 auto',borderRadius:2}}/>
            </motion.div>
          </div>
        </Section>

        {/* ── VALUES ── */}
        <Section bg="#F5F0E8">
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'}}>
            <div style={{textAlign:'center',marginBottom:'clamp(52px,7vw,80px)'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}><span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>Our Values<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/></div>
              <h2 className="section-title shimmer-text" style={{fontStyle:'italic',display:'inline-block'}}>What We Stand For</h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'clamp(12px,2vw,20px)'}} className="grid-3">
              {VALUES.map((v,i)=>(
                <motion.div key={v.title} initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.09,duration:.6,ease:[.22,1,.36,1]}}
                  className="team-card hover-lift" style={{textAlign:'left',cursor:'default'}}>
                  <div style={{fontSize:36,marginBottom:18}}>{v.icon}</div>
                  <div style={{width:28,height:2.5,background:'#B8860B',borderRadius:2,marginBottom:14}}/>
                  <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:10}}>{v.title}</h3>
                  <p style={{fontFamily:'Inter,sans-serif',fontSize:14,color:'#4A5568',lineHeight:1.7,fontWeight:300,margin:0}}>{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── TEAM ── */}
        <Section bg="#FDFAF5">
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'}}>
            <div style={{textAlign:'center',marginBottom:'clamp(52px,7vw,80px)'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}><span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>The Team<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/></div>
              <h2 className="section-title">People Behind <em className="shimmer-text" style={{fontStyle:'italic'}}>Thynk</em></h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'clamp(12px,2vw,20px)'}} className="grid-3">
              {TEAM.map((t,i)=>(
                <motion.div key={t.name} initial={{opacity:0,y:36,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true}} transition={{delay:i*.1,duration:.65,ease:[.22,1,.36,1]}}
                  className="team-card" style={{cursor:'default'}}>
                  <div style={{width:72,height:72,borderRadius:18,background:`linear-gradient(135deg,${t.color}18,${t.color}08)`,border:`1.5px solid ${t.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:24,color:t.color,margin:'0 auto 20px',boxShadow:`0 4px 20px ${t.color}15`}}>
                    {t.initials}
                  </div>
                  <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:20,color:'#0D1117',marginBottom:4,textAlign:'center'}}>{t.name}</h3>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:t.color,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>{t.role}</div>
                  <p style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'#4A5568',lineHeight:1.65,fontWeight:300,textAlign:'center',margin:0}}>{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── CTA ── */}
        <section style={{background:'linear-gradient(135deg,#B8860B 0%,#E8C547 50%,#C9960D 100%)',backgroundSize:'200% 200%',animation:'gradientDrift 5s ease infinite',padding:'clamp(72px,10vw,120px) 0',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,0.12) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
          <div style={{maxWidth:'700px',margin:'0 auto',padding:'0 clamp(24px,5vw,60px)',position:'relative',zIndex:1}}>
            <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.65}}>
              <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.4rem,5vw,4.2rem)',color:'#0D1117',lineHeight:.92,letterSpacing:'-2px',marginBottom:20}}>
                Ready to Find the Perfect School?
              </h2>
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.6vw,17px)',color:'rgba(13,17,23,0.65)',lineHeight:1.75,fontWeight:300,marginBottom:36}}>
                Join 1 lakh+ parents who found their child&apos;s school with Thynk Schooling. Free forever.
              </p>
              <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
                <Link href="/schools" className="btn btn-dark" style={{display:'inline-flex',alignItems:'center',gap:8}}>Find Schools <ArrowRight style={{width:15,height:15}}/></Link>
                <Link href="/counselling" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 26px',background:'rgba(13,17,23,0.1)',border:'1.5px solid rgba(13,17,23,0.2)',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,color:'#0D1117',textDecoration:'none',transition:'all .22s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(13,17,23,0.2)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(13,17,23,0.1)'}}>
                  Book Free Counselling
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}
