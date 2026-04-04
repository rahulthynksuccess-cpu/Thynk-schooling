'use client'
export const dynamic='force-dynamic'
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Check, ArrowRight, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import { LeadPackage } from '@/types'

const PLANS=[
  {name:'Free',price:0,label:'₹0',period:'forever',desc:'Get listed and start receiving leads.',color:'#4A5568',features:['5 lead credits per month','Basic school profile','Up to 5 photos','Standard listing placement','Email support'],cta:'Get Started Free',href:'/register?role=school',hot:false},
  {name:'Silver',price:2999,label:'₹2,999',period:'/month',desc:'For schools serious about admissions.',color:'#718096',features:['25 lead credits per month','Verified school badge','Unlimited photos & video','Enhanced listing placement','Analytics dashboard','Priority email support'],cta:'Start Silver',href:'/register?role=school&plan=silver',hot:false},
  {name:'Gold',price:5999,label:'₹5,999',period:'/month',desc:'Most popular — best ROI for growing schools.',color:'#B8860B',features:['75 lead credits per month','Featured school badge','Top placement in search','Full analytics & reports','School profile video','Dedicated account manager','WhatsApp support'],cta:'Start Gold',href:'/register?role=school&plan=gold',hot:true},
  {name:'Platinum',price:9999,label:'₹9,999',period:'/month',desc:'For chains and premium institutions.',color:'#553C9A',features:['Unlimited lead credits','Top-of-search placement','Homepage featured listing','AI-optimised profile','Multi-branch management','SLA-backed account manager'],cta:'Start Platinum',href:'/register?role=school&plan=platinum',hot:false},
]

const FAQ=[
  {q:'What is a lead credit?',a:'One lead credit = one parent enquiry. When a parent fills an admission form for your school, you use a credit to unlock their full contact details.'},
  {q:'Can I try before I pay?',a:'Yes! Our Free plan lets you list your school and receive 5 lead credits every month, forever. No credit card required.'},
  {q:'Do credits roll over?',a:'Monthly plan credits do not roll over. However, bulk credit packs you purchase separately never expire.'},
  {q:'Can I change plans anytime?',a:'Yes. Upgrade or downgrade instantly from your school dashboard. Unused credits from the old plan carry over for 30 days.'},
  {q:'Is there a setup fee?',a:'Never. Listing is free, plans are monthly with no lock-in, and you can cancel anytime.'},
]

export default function PricingPage() {
  const [openFaq,setOpenFaq]=useState<number|null>(null)
  const {data:packages}=useQuery<{data:LeadPackage[]}>({queryKey:['packages'],queryFn:()=>fetch('/api/admin/lead-pricing').then(r=>r.json()),staleTime:5*60*1000})
  const faqRef=useRef(null)
  const faqInView=useInView(faqRef,{once:true})

  return (
    <>
      <Navbar/>
      <main style={{background:'#0D1117',paddingTop:72}}>

        {/* ── HERO ── */}
        <section className="section-dark" style={{padding:'clamp(80px,12vw,140px) 0',minHeight:'55vh',display:'flex',alignItems:'center'}}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="pg1" cx="50%" cy="40%"><stop stopColor="#B8860B" stopOpacity=".1"><animate attributeName="cy" values="40%;60%;40%" dur="16s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
              <filter id="pbl"><feGaussianBlur stdDeviation="70"/></filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#pg1)" filter="url(#pbl)"/>
          </svg>
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',textAlign:'center',position:'relative',zIndex:1,width:'100%'}}>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:24}}>
                <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>For Schools<span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>
              </div>
            </motion.div>
            <motion.h1 initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:.75,delay:.08,ease:[.22,1,.36,1]}}
              style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(3rem,7vw,6.5rem)',color:'#FAF7F2',lineHeight:.88,letterSpacing:'-3px',marginBottom:24}}>
              Simple Pricing,
              <em className="shimmer-text" style={{display:'block',fontStyle:'italic'}}>Powerful Results</em>
            </motion.h1>
            <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.2,ease:[.22,1,.36,1]}}
              style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(15px,1.7vw,18px)',color:'rgba(250,247,242,0.55)',lineHeight:1.8,fontWeight:300,maxWidth:560,margin:'0 auto 12px'}}>
              List free. Buy leads you actually want. No wastage, no lock-in.
            </motion.p>
            {/* Trust stars */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4,duration:.6}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:28}}>
              <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:14,height:14,fill:'#E8C547',color:'#E8C547'}}/>)}</div>
              <span style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(250,247,242,0.45)',fontWeight:300}}>Trusted by <strong style={{color:'rgba(250,247,242,0.7)',fontWeight:600}}>8,000+ schools</strong> across India</span>
            </motion.div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section style={{background:'#F5F0E8',padding:'clamp(72px,10vw,120px) 0',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'"Cormorant Garamond",serif',fontSize:'clamp(150px,22vw,300px)',fontWeight:700,color:'rgba(13,17,23,0.022)',whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',letterSpacing:'-8px'}}>PLANS</div>
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'clamp(12px,2vw,20px)'}} className="grid-3">
              {PLANS.map((plan,i)=>(
                <motion.div key={plan.name} initial={{opacity:0,y:40,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,amount:.1}} transition={{delay:i*.1,duration:.65,ease:[.22,1,.36,1]}}>
                  <div className={`pricing-card${plan.hot?' hot':''}`} style={{height:'100%',display:'flex',flexDirection:'column',position:'relative'}}>
                    {plan.hot&&(
                      <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#B8860B,#E8C547)',color:'#0D1117',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',padding:'4px 16px',borderRadius:100,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(184,134,11,0.4)'}}>
                        ⚡ Most Popular
                      </div>
                    )}
                    <div style={{marginBottom:24}}>
                      <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:4}}>{plan.name}</div>
                      <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'#718096',fontWeight:300}}>{plan.desc}</div>
                    </div>
                    <div style={{marginBottom:28}}>
                      <span style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,4vw,3.2rem)',color:plan.hot?'#B8860B':'#0D1117',letterSpacing:'-2px'}}>{plan.label}</span>
                      <span style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'#A0ADB8',fontWeight:300,marginLeft:4}}>{plan.period}</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:10,flex:1,marginBottom:28}}>
                      {plan.features.map(f=>(
                        <div key={f} style={{display:'flex',alignItems:'flex-start',gap:10,fontFamily:'Inter,sans-serif',fontSize:13,color:'#4A5568',fontWeight:300}}>
                          <div style={{width:18,height:18,borderRadius:'50%',background:plan.hot?'rgba(184,134,11,0.12)':'rgba(13,17,23,0.06)',border:`1px solid ${plan.hot?'rgba(184,134,11,0.25)':'rgba(13,17,23,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                            <Check style={{width:10,height:10,color:plan.hot?'#B8860B':'#4A5568'}}/>
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                    <Link href={plan.href} className={plan.hot?'btn btn-gold':'btn btn-dark'} style={{textAlign:'center',justifyContent:'center',display:'flex'}}>
                      {plan.cta} <ArrowRight style={{width:14,height:14}}/>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CREDIT PACKS ── */}
        {(packages?.data?.length??0)>0&&(
          <section style={{background:'#FDFAF5',padding:'clamp(72px,10vw,120px) 0'}}>
            <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'}}>
              <div style={{textAlign:'center',marginBottom:'clamp(40px,5vw,60px)'}}>
                <div className="eyebrow" style={{justifyContent:'center'}}><span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>Bulk Packs<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/></div>
                <h2 className="section-title">Buy <em className="shimmer-text" style={{fontStyle:'italic'}}>Lead Credits</em> in Bulk</h2>
                <p className="section-sub" style={{maxWidth:480,margin:'16px auto 0'}}>Credits never expire. Combine with any plan.</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'clamp(10px,1.5vw,16px)'}} className="grid-3">
                {packages!.data.map((p,i)=>(
                  <motion.div key={p.id} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08,duration:.55,ease:[.22,1,.36,1]}}
                    className="card hover-lift" style={{padding:'clamp(20px,3vw,32px)',textAlign:'center'}}>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'#B8860B',marginBottom:12}}>{p.credits} Credits</div>
                    <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:36,color:'#0D1117',letterSpacing:'-1.5px',marginBottom:4}}>₹{p.price.toLocaleString('en-IN')}</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'#A0ADB8',marginBottom:20}}>₹{Math.round(p.price/p.credits)} per credit</div>
                    <Link href="/register?role=school" className="btn btn-outline-gold" style={{display:'flex',justifyContent:'center',fontSize:13}}>Buy Pack</Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section ref={faqRef} style={{background:'#0D1117',padding:'clamp(72px,10vw,120px) 0'}} className="section-dark">
          <div style={{maxWidth:'860px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative',zIndex:1}}>
            <div style={{textAlign:'center',marginBottom:'clamp(40px,5vw,60px)'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:20,justifyContent:'center'}}>
                <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>FAQ<span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>
              </div>
              <h2 style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,4.5vw,4rem)',color:'#FAF7F2',lineHeight:.92,letterSpacing:'-2px'}}>
                Common <em style={{fontStyle:'italic',color:'#E8C547'}}>Questions</em>
              </h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {FAQ.map((f,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-20}} animate={faqInView?{opacity:1,x:0}:{}} transition={{delay:i*.08,duration:.55,ease:[.22,1,.36,1]}}>
                  <div onClick={()=>setOpenFaq(openFaq===i?null:i)}
                    style={{background:'rgba(255,255,255,0.05)',border:`1px solid ${openFaq===i?'rgba(184,134,11,0.35)':'rgba(255,255,255,0.08)'}`,borderRadius:14,padding:'clamp(16px,2.5vw,24px) clamp(20px,3vw,28px)',cursor:'pointer',transition:'all .25s'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
                      <span style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:600,fontSize:'clamp(16px,1.8vw,20px)',color:'#FAF7F2'}}>{f.q}</span>
                      <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(184,134,11,0.15)',border:'1px solid rgba(184,134,11,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'transform .25s',transform:openFaq===i?'rotate(45deg)':'rotate(0)'}}>
                        <span style={{color:'#E8C547',fontSize:16,lineHeight:1}}>+</span>
                      </div>
                    </div>
                    {openFaq===i&&(
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                        <p style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.4vw,15px)',color:'rgba(250,247,242,0.55)',lineHeight:1.75,fontWeight:300,margin:0}}>{f.a}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}
