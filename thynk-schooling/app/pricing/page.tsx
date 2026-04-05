'use client'
export const dynamic='force-dynamic'
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Check, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useContent } from '@/hooks/useContent'

// ── Default FAQ items (overridden by content controller) ─────────────────────
const DEFAULT_FAQ=[
  {q:'What is a lead credit?',a:'One lead credit = one parent enquiry. When a parent fills an admission form for your school, you use a credit to unlock their full contact details.'},
  {q:'Can I try before I pay?',a:'Yes! Our Free subscription plan lets you list your school and receive lead credits every month, forever. No credit card required.'},
  {q:'Do credits roll over?',a:'Monthly plan credits do not roll over. Credits refresh each month with your active subscription plan.'},
  {q:'Can I change plans anytime?',a:'Yes. Upgrade or downgrade instantly from your school dashboard. Unused credits from the old plan carry over for 30 days.'},
  {q:'Is there a setup fee?',a:'Never. Listing is free, plans are monthly with no lock-in, and you can cancel anytime.'},
]

interface SubPlan {
  id: string; planKey: string; name: string; description: string
  price: number; leadsPerMonth: number; features: string[]
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
}

export default function PricingPage() {
  const [openFaq,setOpenFaq]=useState<number|null>(null)
  const pricingContent = useContent('pricing')
  const {data:subPlans,isLoading:plansLoading}=useQuery<SubPlan[]>({
    queryKey:['subscription-plans'],
    queryFn:()=>fetch('/api/admin?action=subscription-plans').then(r=>r.json()),
    staleTime:5*60*1000,
  })
  const faqRef=useRef(null)
  const faqInView=useInView(faqRef,{once:true})

  const activePlans = (subPlans??[]).filter(p=>p.isActive)

  // Build FAQ from content controller values, falling back to defaults
  const FAQ = DEFAULT_FAQ.map((def,i)=>({
    q: pricingContent?.[`faq${i+1}q`] || def.q,
    a: pricingContent?.[`faq${i+1}a`] || def.a,
  }))

  const formatPrice = (paise:number) => {
    if (paise===0) return { label:'₹0', period:'forever' }
    const rs = Math.round(paise/100)
    return { label:`₹${rs.toLocaleString('en-IN')}`, period:'/month' }
  }

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
              List free. Subscribe to a plan and get leads included every month. No wastage, no lock-in.
            </motion.p>
            {/* Trust stars */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4,duration:.6}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:28}}>
              <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:14,height:14,fill:'#E8C547',color:'#E8C547'}}/>)}</div>
              <span style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(250,247,242,0.45)',fontWeight:300}}>Trusted by <strong style={{color:'rgba(250,247,242,0.7)',fontWeight:600}}>8,000+ schools</strong> across India</span>
            </motion.div>
          </div>
        </section>

        {/* ── SUBSCRIPTION PLANS ── */}
        <section style={{background:'#F5F0E8',padding:'clamp(72px,10vw,120px) 0',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'"Cormorant Garamond",serif',fontSize:'clamp(150px,22vw,300px)',fontWeight:700,color:'rgba(13,17,23,0.022)',whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',letterSpacing:'-8px'}}>PLANS</div>
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative'}}>
            {plansLoading ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'clamp(12px,2vw,20px)'}}>
                {Array.from({length:4}).map((_,i)=>(
                  <div key={i} style={{height:480,borderRadius:16,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s infinite'}}/>
                ))}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(activePlans.length||4,4)},1fr)`,gap:'clamp(12px,2vw,20px)'}} className="grid-3">
                {activePlans.map((plan,i)=>{
                  const {label,period}=formatPrice(plan.price)
                  return (
                    <motion.div key={plan.id} initial={{opacity:0,y:40,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,amount:.1}} transition={{delay:i*.1,duration:.65,ease:[.22,1,.36,1]}}>
                      {/* Card wrapper — relative so the vertical "Most Popular" strip can be positioned */}
                      <div className={`pricing-card${plan.isHot?' hot':''}`} style={{height:'100%',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>

                        {/* ── Most Popular vertical badge strip ── */}
                        {plan.isHot&&(
                          <div style={{
                            position:'absolute',
                            top:0,
                            right:0,
                            width:26,
                            height:'100%',
                            background:'linear-gradient(180deg,#B8860B,#E8C547)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            zIndex:2,
                          }}>
                            <span style={{
                              writingMode:'vertical-rl',
                              textOrientation:'mixed',
                              transform:'rotate(180deg)',
                              fontFamily:'Inter,sans-serif',
                              fontSize:9,
                              fontWeight:800,
                              letterSpacing:'.14em',
                              textTransform:'uppercase',
                              color:'#0D1117',
                              whiteSpace:'nowrap',
                              userSelect:'none',
                            }}>
                              ⚡ Most Popular
                            </span>
                          </div>
                        )}

                        {/* Card body — pad right so content never hides under the strip */}
                        <div style={{flex:1,display:'flex',flexDirection:'column',paddingRight: plan.isHot ? 34 : 0}}>
                          <div style={{marginBottom:24}}>
                            <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:4}}>{plan.name}</div>
                            <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'#718096',fontWeight:300}}>{plan.description}</div>
                          </div>
                          <div style={{marginBottom:28}}>
                            <span style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,4vw,3.2rem)',color:plan.isHot?'#B8860B':'#0D1117',letterSpacing:'-2px'}}>{label}</span>
                            <span style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'#A0ADB8',fontWeight:300,marginLeft:4}}>{period}</span>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:10,flex:1,marginBottom:28}}>
                            {plan.features.map(f=>(
                              <div key={f} style={{display:'flex',alignItems:'flex-start',gap:10,fontFamily:'Inter,sans-serif',fontSize:13,color:'#4A5568',fontWeight:300}}>
                                <div style={{width:18,height:18,borderRadius:'50%',background:plan.isHot?'rgba(184,134,11,0.12)':'rgba(13,17,23,0.06)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.25)':'rgba(13,17,23,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                                  <Check style={{width:10,height:10,color:plan.isHot?'#B8860B':'#4A5568'}}/>
                                </div>
                                {f}
                              </div>
                            ))}
                          </div>
                          <Link href={`/register?role=school&plan=${plan.planKey}`} className={plan.isHot?'btn btn-gold':'btn btn-dark'} style={{textAlign:'center',justifyContent:'center',display:'flex'}}>
                            {plan.cta} <ArrowRight style={{width:14,height:14}}/>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

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
