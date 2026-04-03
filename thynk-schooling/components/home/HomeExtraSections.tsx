'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight, Star, BookOpen, CheckCircle2, TrendingUp, Shield, Zap } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'

const C={maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'} as React.CSSProperties

const CITY_EMOJI:Record<string,string>={delhi:'🏛️',mumbai:'🌊',bangalore:'🌿',hyderabad:'💎',chennai:'🎭',pune:'📚',kolkata:'🎨',ahmedabad:'🏗️',jaipur:'🏰',lucknow:'🌸'}

export function TopCitiesGrid() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.1})
  const {options:cities,isLoading}=useDropdown('city')
  const ct=useContent('home')??{}
  const cityCount=ct.stat3Num||'350+'
  return (
    <section ref={ref} style={{background:'#FDFAF5',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
        <defs><radialGradient id="cg1" cx="50%" cy="50%"><stop stopColor="#B8860B" stopOpacity=".05"/><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient><filter id="cb"><feGaussianBlur stdDeviation="60"/></filter></defs>
        <rect width="100%" height="100%" fill="url(#cg1)" filter="url(#cb)"/>
      </svg>
      <div style={C}>
        <motion.div initial={{opacity:0,y:24}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:.65}} style={{textAlign:'center',marginBottom:'clamp(48px,6vw,72px)'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:20,justifyContent:'center'}}>
            <span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>Browse by City<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>
          </div>
          <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.4rem,5vw,4.5rem)',color:'#0D1117',lineHeight:.92,letterSpacing:'-2.5px',marginBottom:16}}>
            Schools in Your <em className="text-shimmer" style={{fontStyle:'italic'}}>City</em>
          </h2>
          <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.5vw,17px)',color:'#4A5568',fontWeight:300,maxWidth:480,margin:'0 auto'}}>Find top schools in {cityCount} Indian cities — all verified, all real.</p>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'clamp(10px,1.5vw,16px)'}}>
          {isLoading?Array.from({length:10},(_,i)=>(<div key={i} style={{height:110,borderRadius:14,background:'rgba(13,17,23,0.05)',animation:'shimmerBg 1.5s ease-in-out infinite'}}/>))
            :cities.slice(0,10).map((city,i)=>(
              <motion.div key={city.value} initial={{opacity:0,scale:.9,y:20}} animate={inView?{opacity:1,scale:1,y:0}:{}} transition={{delay:i*.05,duration:.5,ease:[.22,1,.36,1]}}>
                <Link href={`/schools?city=${city.value}`} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,textAlign:'center',padding:'clamp(18px,2.5vw,28px) 12px',background:'#fff',borderRadius:16,border:'1.5px solid rgba(13,17,23,0.06)',boxShadow:'0 4px 20px rgba(13,17,23,0.04)',textDecoration:'none',transition:'all .28s cubic-bezier(.22,1,.36,1)',display:'block'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px) scale(1.02)';el.style.boxShadow='0 20px 50px rgba(184,134,11,0.15)';el.style.borderColor='rgba(184,134,11,0.3)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow='0 4px 20px rgba(13,17,23,0.04)';el.style.borderColor='rgba(13,17,23,0.06)'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                    <span style={{fontSize:'clamp(26px,3.5vw,36px)',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}>{CITY_EMOJI[city.value.toLowerCase()]||'🏙️'}</span>
                    <span style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(13px,1.3vw,16px)',color:'#0D1117',lineHeight:1.2}}>{city.label}</span>
                    <span style={{display:'flex',alignItems:'center',gap:3,fontFamily:'Inter,sans-serif',fontSize:10,color:'#B8860B',fontWeight:600}}><MapPin style={{width:9,height:9}}/>View Schools</span>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>
        <div style={{textAlign:'center',marginTop:'clamp(24px,3vw,40px)'}}>
          <Link href="/cities" style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#B8860B',textDecoration:'none',padding:'11px 22px',border:'1.5px solid rgba(184,134,11,0.3)',borderRadius:10,transition:'all .22s',background:'transparent'}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.color='#fff';el.style.borderColor='#B8860B'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.color='#B8860B';el.style.borderColor='rgba(184,134,11,0.3)'}}>
            View all {cityCount} cities <ArrowRight style={{width:14,height:14}}/>
          </Link>
        </div>
      </div>
    </section>
  )
}

// BOARD COMPARISON
const BOARDS=[
  {name:'CBSE',full:'Central Board of Secondary Education',color:'#1A6B8A',bg:'#EBF5FA',tags:['National Level','Competitive Exams','Science Focus'],pros:['Best for JEE/NEET preparation','Accepted across all Indian states','Standardised curriculum'],ideal:'Families who may relocate across India'},
  {name:'ICSE',full:'Indian Certificate of Secondary Education',color:'#0A5F55',bg:'#E8F5F3',tags:['Holistic','English Strong','Arts & Commerce'],pros:['Strong English language focus','Comprehensive & well-rounded','High academic rigour'],ideal:'Students inclined towards humanities & arts'},
  {name:'IB',full:'International Baccalaureate',color:'#7A4A9A',bg:'#F3EEFA',tags:['Global Recognition','Research-Based','International'],pros:['Recognised by global universities','Critical thinking emphasis','Inquiry-based learning'],ideal:'Families considering studying abroad'},
]

export function BoardComparison() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.1})
  const [active,setActive]=useState(0)
  return (
    <section ref={ref} style={{background:'#0D1117',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bg1" cx="30%" cy="30%" r="60%"><stop stopColor="#B8860B" stopOpacity=".07"><animate attributeName="cx" values="30%;60%;30%" dur="20s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <filter id="bb"><feGaussianBlur stdDeviation="60"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg1)" filter="url(#bb)"/>
      </svg>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.07) 1px,transparent 1px)',backgroundSize:'30px 30px',pointerEvents:'none'}}/>

      <div style={{...C,position:'relative'}}>
        <motion.div initial={{opacity:0,y:24}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:.65}} style={{textAlign:'center',marginBottom:'clamp(48px,6vw,72px)'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:20,justifyContent:'center'}}>
            <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>Quick Guide<span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>
          </div>
          <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.4rem,5vw,4.5rem)',color:'#FAF7F2',lineHeight:.92,letterSpacing:'-2.5px'}}>
            CBSE vs ICSE vs <em style={{fontStyle:'italic',color:'#E8C547'}}>IB</em>
          </h2>
        </motion.div>

        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:'clamp(36px,5vw,56px)'}}>
          {BOARDS.map((b,i)=>(
            <button key={b.name} onClick={()=>setActive(i)} style={{padding:'10px 28px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,transition:'all .25s',background:active===i?'#B8860B':'rgba(255,255,255,0.07)',color:active===i?'#fff':'rgba(250,247,242,0.5)',boxShadow:active===i?'0 4px 20px rgba(184,134,11,0.4)':'none',transform:active===i?'scale(1.05)':'scale(1)'}}>
              {b.name}
            </button>
          ))}
        </div>

        <motion.div key={active} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.4,ease:[.22,1,.36,1]}}>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.4fr)',gap:'clamp(20px,3vw,36px)',alignItems:'stretch'}}>
            <div style={{background:BOARDS[active].bg,borderRadius:22,padding:'clamp(28px,4vw,52px)',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',bottom:-20,right:-20,width:180,height:180,borderRadius:'50%',background:`${BOARDS[active].color}10`,pointerEvents:'none'}}/>
              <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(60px,10vw,100px)',color:BOARDS[active].color,lineHeight:.85,letterSpacing:'-4px',marginBottom:14}}>{BOARDS[active].name}</div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:BOARDS[active].color,fontWeight:500,opacity:.65,marginBottom:24,lineHeight:1.5}}>{BOARDS[active].full}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:'auto'}}>
                {BOARDS[active].tags.map(t=><span key={t} style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,padding:'4px 10px',borderRadius:100,background:`${BOARDS[active].color}14`,color:BOARDS[active].color,letterSpacing:'.05em'}}>{t}</span>)}
              </div>
              <div style={{marginTop:28,padding:'16px 20px',background:`${BOARDS[active].color}0E`,border:`1px solid ${BOARDS[active].color}22`,borderRadius:14}}>
                <div style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,color:BOARDS[active].color,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Ideal For</div>
                <div style={{fontFamily:'"Cormorant Garamond",serif',fontSize:15,fontWeight:600,color:'#0D1117',lineHeight:1.4}}>{BOARDS[active].ideal}</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'clamp(10px,1.5vw,14px)'}}>
              {BOARDS[active].pros.map((pro,j)=>(
                <motion.div key={pro} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:j*.08,duration:.4}}
                  style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'clamp(18px,2.5vw,28px)',display:'flex',alignItems:'flex-start',gap:16,backdropFilter:'blur(8px)',transition:'all .22s',cursor:'default'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.15)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'}}>
                  <div style={{width:36,height:36,borderRadius:9,background:`${BOARDS[active].color}20`,border:`1px solid ${BOARDS[active].color}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <CheckCircle2 style={{width:16,height:16,color:'#E8C547'}}/>
                  </div>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.4vw,15px)',color:'rgba(250,247,242,0.75)',fontWeight:300,lineHeight:1.65,paddingTop:6}}>{pro}</div>
                </motion.div>
              ))}
              <Link href="/blog/cbse-vs-icse-vs-ib" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 24px',background:'rgba(184,134,11,0.12)',border:'1px solid rgba(184,134,11,0.3)',borderRadius:12,fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#E8C547',textDecoration:'none',transition:'all .22s',marginTop:4}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.color='#fff'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(184,134,11,0.12)';el.style.color='#E8C547'}}>
                Read Full Comparison Guide <ArrowRight style={{width:14,height:14}}/>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// TESTIMONIALS
const TESTIMONIALS=[
  {name:'Priya Sharma',city:'Delhi',child:'Daughter, Class 6',text:'Found the perfect CBSE school in just 2 days. The AI recommendations were uncannily accurate.',stars:5},
  {name:'Rahul Mehta',city:'Mumbai',child:'Son, Class 1',text:'Applied to 3 schools and got admission in all 3. The common form saved hours of effort.',stars:5},
  {name:'Anjali Nair',city:'Bangalore',child:'Twins, Nursery',text:'The IB vs CBSE comparison was a game-changer. Free counselling answered every question.',stars:5},
]

export function TestimonialsSection() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.1})
  return (
    <section ref={ref} style={{background:'#F5F0E8',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'8%',left:'2%',fontFamily:'Georgia,serif',fontSize:'clamp(150px,22vw,320px)',color:'rgba(184,134,11,0.05)',lineHeight:1,pointerEvents:'none',userSelect:'none'}}>&ldquo;</div>
      <div style={C}>
        <motion.div initial={{opacity:0,y:24}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:.65}} style={{textAlign:'center',marginBottom:'clamp(48px,6vw,72px)'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:20,justifyContent:'center'}}>
            <span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>Parent Stories<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>
          </div>
          <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.4rem,5vw,4.5rem)',color:'#0D1117',lineHeight:.92,letterSpacing:'-2.5px'}}>
            Trusted by <em className="text-shimmer" style={{fontStyle:'italic'}}>1 Lakh+ Parents</em>
          </h2>
        </motion.div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,2vw,20px)'}}>
          {TESTIMONIALS.map((t,i)=>(
            <motion.div key={t.name} initial={{opacity:0,y:32,scale:.96}} animate={inView?{opacity:1,y:0,scale:1}:{}} transition={{delay:i*.12,duration:.65,ease:[.22,1,.36,1]}}>
              <div style={{background:'#fff',borderRadius:20,padding:'clamp(24px,3.5vw,40px)',height:'100%',display:'flex',flexDirection:'column',border:'1.5px solid rgba(13,17,23,0.06)',boxShadow:'0 4px 24px rgba(13,17,23,0.05)',transition:'all .3s cubic-bezier(.22,1,.36,1)'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.boxShadow='0 24px 60px rgba(184,134,11,0.1)';el.style.borderColor='rgba(184,134,11,0.22)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow='0 4px 24px rgba(13,17,23,0.05)';el.style.borderColor='rgba(13,17,23,0.06)'}}>
                <div style={{display:'flex',gap:2,marginBottom:16}}>{Array.from({length:t.stars}).map((_,s)=><Star key={s} style={{width:13,height:13,fill:'#B8860B',color:'#B8860B'}}/>)}</div>
                <div style={{width:32,height:2,background:'linear-gradient(90deg,#B8860B,#E8C547)',borderRadius:2,marginBottom:18}}/>
                <p style={{fontFamily:'"Cormorant Garamond",serif',fontStyle:'italic',fontSize:'clamp(15px,1.6vw,19px)',color:'#1C2333',lineHeight:1.65,flex:1,marginBottom:24}}>&ldquo;{t.text}&rdquo;</p>
                <div style={{display:'flex',alignItems:'center',gap:12,paddingTop:18,borderTop:'1px solid rgba(13,17,23,0.07)'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#EDE5D8,#E4D9C8)',border:'1px solid rgba(13,17,23,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:17,color:'#B8860B',flexShrink:0}}>{t.name[0]}</div>
                  <div>
                    <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:15,color:'#0D1117'}}>{t.name}</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8'}}>{t.city} · {t.child}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// COUNSELLING CTA
export function CounsellingCTA() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.2})
  return (
    <section ref={ref} style={{background:'#FDFAF5',padding:'clamp(80px,10vw,130px) 0'}}>
      <div style={C}>
        <motion.div initial={{opacity:0,y:32}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
          <div style={{background:'linear-gradient(145deg,#0D1117 0%,#1a2540 100%)',borderRadius:'clamp(18px,2.5vw,28px)',padding:'clamp(40px,6vw,80px) clamp(32px,6vw,80px)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'clamp(32px,5vw,60px)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'-100px',right:'-100px',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(184,134,11,0.12) 0%,transparent 70%)',pointerEvents:'none',animation:'floatYSlow 8s ease-in-out infinite'}}/>
            <div style={{position:'absolute',bottom:'-60px',left:'25%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(10,95,85,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{flex:1,position:'relative'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:20}}>
                <span style={{width:20,height:1,background:'#B8860B',display:'block'}}/>100% Free
              </div>
              <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,5vw,4rem)',color:'#FAF7F2',lineHeight:.95,letterSpacing:'-1.5px',marginBottom:16}}>
                Talk to an Expert<br/><em style={{fontStyle:'italic',color:'#E8C547'}}>Education Counsellor</em>
              </h2>
              <div style={{width:40,height:1.5,background:'#B8860B',margin:'18px 0',borderRadius:2}}/>
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.4vw,16px)',color:'rgba(250,247,242,0.55)',lineHeight:1.8,fontWeight:300,maxWidth:420,marginBottom:28}}>Experts help 500+ families every month find the right school at absolutely zero cost.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {['CBSE vs ICSE vs IB — which board suits your child','School shortlisting by budget, location & values','Admission documents checklist & timelines'].map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(250,247,242,0.55)',fontWeight:300}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:'rgba(184,134,11,0.15)',border:'1px solid rgba(184,134,11,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#E8C547',flexShrink:0}}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{flexShrink:0,width:'clamp(240px,22vw,300px)',position:'relative'}}>
              <div style={{background:'rgba(250,247,242,0.06)',border:'1px solid rgba(232,197,71,0.2)',borderRadius:18,padding:'clamp(24px,3.5vw,36px)',textAlign:'center',backdropFilter:'blur(12px)'}}>
                <div style={{fontSize:40,marginBottom:14,animation:'floatY 3s ease-in-out infinite'}}>📞</div>
                <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(18px,2vw,24px)',color:'#FAF7F2',marginBottom:8}}>Book a Free Session</h3>
                <p style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'rgba(250,247,242,0.4)',marginBottom:24,lineHeight:1.6,fontWeight:300}}>Mon–Sat · 9 AM – 7 PM<br/>Hindi & English · No spam</p>
                <Link href="/counselling" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:'14px 20px',background:'linear-gradient(135deg,#B8860B,#C9960D)',color:'#fff',borderRadius:12,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,textDecoration:'none',transition:'all .22s',boxShadow:'0 4px 20px rgba(184,134,11,0.35)'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-1px)';el.style.boxShadow='0 8px 32px rgba(184,134,11,0.5)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow='0 4px 20px rgba(184,134,11,0.35)'}}>
                  Book Now — It&apos;s Free
                </Link>
                <p style={{fontFamily:'Inter,sans-serif',fontSize:10,color:'rgba(250,247,242,0.22)',marginTop:10,letterSpacing:'.02em'}}>No sales calls · No obligation</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// FOR SCHOOLS
export function ForSchoolsCTA() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.15})
  const PLANS=[
    {name:'Free',price:'₹0',leads:'5 leads/mo',hot:false,sub:'Basic profile · 5 images'},
    {name:'Silver',price:'₹2,999',leads:'25 leads/mo',hot:false,sub:'Verified badge · Analytics'},
    {name:'Gold',price:'₹5,999',leads:'75 leads/mo',hot:true,sub:'Featured listing · Priority'},
    {name:'Platinum',price:'₹9,999',leads:'Unlimited',hot:false,sub:'Top placement · Manager'},
  ]
  const PERKS=[
    {icon:<Shield style={{width:15,height:15}}/>,t:'Free school listing — no upfront cost ever'},
    {icon:<TrendingUp style={{width:15,height:15}}/>,t:'Verified parent leads with genuine intent'},
    {icon:<Zap style={{width:15,height:15}}/>,t:'Buy credits in bulk and save up to 70%'},
    {icon:<CheckCircle2 style={{width:15,height:15}}/>,t:'Full analytics dashboard with lead tracking'},
  ]
  return (
    <section ref={ref} style={{background:'#FDFAF5',padding:'clamp(80px,10vw,130px) 0'}}>
      <div style={C}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(16px,2.5vw,28px)'}}>
          <motion.div initial={{opacity:0,x:-28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div style={{background:'#fff',borderRadius:22,padding:'clamp(28px,4.5vw,52px)',height:'100%',display:'flex',flexDirection:'column',border:'1.5px solid rgba(13,17,23,0.07)',boxShadow:'0 4px 24px rgba(13,17,23,0.05)'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:20}}>
                <span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>For Schools
              </div>
              <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,4vw,3.4rem)',color:'#0D1117',lineHeight:.9,letterSpacing:'-2px',marginBottom:16}}>
                List Free.<br/><em className="text-shimmer" style={{fontStyle:'italic'}}>Buy Only What You Want.</em>
              </h3>
              <div style={{width:36,height:2,background:'#B8860B',margin:'16px 0',borderRadius:2}}/>
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.4vw,15px)',color:'#4A5568',lineHeight:1.8,fontWeight:300,marginBottom:28}}>See masked parent info first — buy only the leads you want. No wastage.</p>
              <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:36,flex:1}}>
                {PERKS.map(p=>(
                  <div key={p.t} style={{display:'flex',alignItems:'center',gap:12,fontFamily:'Inter,sans-serif',fontSize:13,color:'#4A5568',fontWeight:300}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'rgba(184,134,11,0.08)',border:'1px solid rgba(184,134,11,0.18)',display:'flex',alignItems:'center',justifyContent:'center',color:'#B8860B',flexShrink:0}}>{p.icon}</div>
                    {p.t}
                  </div>
                ))}
              </div>
              <Link href="/register?role=school" style={{alignSelf:'flex-start',display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',background:'#0D1117',color:'#FAF7F2',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,textDecoration:'none',transition:'all .22s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#B8860B';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0D1117';(e.currentTarget as HTMLElement).style.transform=''}}>
                List Your School Free <ArrowRight style={{width:14,height:14}}/>
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,x:28}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}} style={{display:'flex',flexDirection:'column',gap:'clamp(10px,1.5vw,14px)'}}>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:4}}>Pricing Plans</div>
            {PLANS.map((p,i)=>(
              <motion.div key={p.name} initial={{opacity:0,x:16}} animate={inView?{opacity:1,x:0}:{}} transition={{delay:.1+i*.07,duration:.5}}
                style={{background:p.hot?'linear-gradient(135deg,#FDFAF0,#FEF7E0)':'#fff',border:p.hot?'1.5px solid rgba(184,134,11,0.3)':'1.5px solid rgba(13,17,23,0.07)',borderRadius:14,padding:'clamp(14px,2vw,20px) clamp(16px,2vw,24px)',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:p.hot?'0 4px 24px rgba(184,134,11,0.12)':'none',transition:'all .22s cubic-bezier(.22,1,.36,1)',position:'relative',cursor:'default'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateX(4px)';el.style.boxShadow=`0 8px 32px rgba(184,134,11,${p.hot?.18:.08})`}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=p.hot?'0 4px 24px rgba(184,134,11,0.12)':'none'}}>
                {p.hot&&<div style={{position:'absolute',top:'-11px',right:16,background:'linear-gradient(135deg,#B8860B,#C9960D)',color:'#fff',fontFamily:'Inter,sans-serif',fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',padding:'3px 10px',borderRadius:100,boxShadow:'0 2px 8px rgba(184,134,11,0.3)'}}>Most Popular</div>}
                <div>
                  <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(15px,1.6vw,18px)',color:'#0D1117',marginBottom:3}}>{p.name}</div>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8'}}>{p.sub} · {p.leads}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(16px,1.8vw,22px)',color:p.hot?'#B8860B':'#0D1117'}}>{p.price}</div>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:10,color:'#A0ADB8'}}>/month</div>
                </div>
              </motion.div>
            ))}
            <Link href="/pricing" style={{alignSelf:'flex-start',display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#B8860B',textDecoration:'none',padding:'10px 18px',border:'1.5px solid rgba(184,134,11,0.3)',borderRadius:9,transition:'all .22s',marginTop:4}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.color='#fff'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.color='#B8860B'}}>
              View Full Pricing <ArrowRight style={{width:13,height:13}}/>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// BLOG
const POSTS=[
  {title:'CBSE vs ICSE vs IB: Which Board is Right?',slug:'cbse-vs-icse-vs-ib',tag:'Board Guide',time:'8 min',emoji:'📚'},
  {title:'How to Choose the Right School: 10 Questions to Ask',slug:'how-to-choose-school',tag:'Admission Tips',time:'6 min',emoji:'🏫'},
  {title:'Top 10 Boarding Schools in India 2026',slug:'top-boarding-schools-india',tag:'Rankings',time:'10 min',emoji:'🏆'},
]

export function BlogPreview() {
  const ref=useRef(null)
  const inView=useInView(ref,{once:true,amount:.1})
  return (
    <section ref={ref} style={{background:'#F5F0E8',padding:'clamp(80px,10vw,130px) 0',position:'relative',overflow:'hidden'}}>
      <div style={C}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'clamp(48px,6vw,72px)',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B',marginBottom:20}}>
              <span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>From the Blog
            </div>
            <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.4rem,5vw,4.5rem)',color:'#0D1117',lineHeight:.92,letterSpacing:'-2.5px'}}>
              Admission <em className="text-shimmer" style={{fontStyle:'italic'}}>Insights</em>
            </h2>
          </div>
          <Link href="/blog" style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#B8860B',textDecoration:'none',padding:'11px 22px',border:'1.5px solid rgba(184,134,11,0.3)',borderRadius:10,transition:'all .22s'}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.color='#fff'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.color='#B8860B'}}>
            All Articles <ArrowRight style={{width:14,height:14}}/>
          </Link>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,2vw,20px)'}}>
          {POSTS.map((p,i)=>(
            <motion.div key={p.slug} initial={{opacity:0,y:36,scale:.95}} animate={inView?{opacity:1,y:0,scale:1}:{}} transition={{delay:i*.12,duration:.65,ease:[.22,1,.36,1]}}>
              <Link href={`/blog/${p.slug}`} style={{display:'flex',flexDirection:'column',height:'100%',padding:'clamp(24px,3.5vw,40px)',background:'#fff',borderRadius:20,border:'1.5px solid rgba(13,17,23,0.06)',boxShadow:'0 4px 20px rgba(13,17,23,0.04)',textDecoration:'none',transition:'all .32s cubic-bezier(.22,1,.36,1)'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-8px)';el.style.boxShadow='0 24px 60px rgba(184,134,11,0.1)';el.style.borderColor='rgba(184,134,11,0.22)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow='0 4px 20px rgba(13,17,23,0.04)';el.style.borderColor='rgba(13,17,23,0.06)'}}>
                <div style={{fontSize:36,marginBottom:20}}>{p.emoji}</div>
                <span style={{display:'inline-flex',alignItems:'center',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'#B8860B',background:'rgba(184,134,11,0.08)',padding:'3px 9px',borderRadius:5,marginBottom:16,alignSelf:'flex-start'}}>{p.tag}</span>
                <h3 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(16px,1.8vw,22px)',color:'#0D1117',lineHeight:1.2,flex:1,marginBottom:20}}>{p.title}</h3>
                <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:16,borderTop:'1px solid rgba(13,17,23,0.07)',fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8'}}>
                  <BookOpen style={{width:12,height:12}}/> {p.time} read
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
