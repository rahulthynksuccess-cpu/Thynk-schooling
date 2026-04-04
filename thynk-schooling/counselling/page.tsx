'use client'
export const dynamic='force-dynamic'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Phone, Clock, CheckCircle, Star, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDropdown } from '@/hooks/useDropdown'

const BENEFITS=[
  {icon:'🎓',title:'Board Selection',desc:'CBSE vs ICSE vs IB — our experts help you pick what suits your child'},
  {icon:'🏫',title:'School Shortlisting',desc:'Personalised shortlist of 5–10 schools based on budget, location and values'},
  {icon:'📋',title:'Admission Roadmap',desc:'Step-by-step checklist with deadlines for every school you apply to'},
  {icon:'💰',title:'Fee & Scholarship',desc:'Navigate fee structures, hidden costs and scholarship opportunities'},
]
const TESTIMONIALS=[
  {name:'Priya Sharma',city:'Delhi',text:'The counsellor understood our exact needs and shortlisted 6 perfect schools. My daughter got admission in her first choice!',stars:5},
  {name:'Rahul Mehta',city:'Mumbai',text:'Amazing service. Cleared all my doubts about IB vs CBSE in one 45-minute call. Totally free and no pressure at all.',stars:5},
  {name:'Anita Singh',city:'Bangalore',text:'Helped us understand the admission timeline perfectly. Got our son into a top ICSE school with their guidance.',stars:5},
]

export default function CounsellingPage() {
  const {options:cities}=useDropdown('city')
  const [form,setForm]=useState({name:'',phone:'',city:'',childAge:'',concern:''})
  const set=(k:string,v:string)=>setForm(p=>({...p,[k]:v}))
  const mutation=useMutation({
    mutationFn:()=>fetch('/api/counselling/book',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json()),
    onSuccess:()=>{toast.success('Session booked! Our counsellor will call you within 2 hours.');setForm({name:'',phone:'',city:'',childAge:'',concern:''})},
    onError:()=>toast.error('Booking failed. Please try again.'),
  })
  const handleSubmit=(e:React.FormEvent)=>{e.preventDefault();if(!form.name||!form.phone){toast.error('Name and phone are required');return};mutation.mutate()}

  return (
    <>
      <Navbar/>
      <main style={{background:'#FAF7F2',paddingTop:72}}>

        {/* ── HERO ── */}
        <section style={{background:'linear-gradient(160deg,#0D1117 0%,#1C2333 60%,#0D1117 100%)',padding:'clamp(80px,12vw,140px) 0',position:'relative',overflow:'hidden',minHeight:'80vh',display:'flex',alignItems:'center'}}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="cg1" cx="20%" cy="40%"><stop stopColor="#B8860B" stopOpacity=".12"><animate attributeName="cx" values="20%;40%;20%" dur="16s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
              <radialGradient id="cg2" cx="80%" cy="60%"><stop stopColor="#0A5F55" stopOpacity=".07"/><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
              <filter id="cbl"><feGaussianBlur stdDeviation="65"/></filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#cg1)" filter="url(#cbl)"/>
            <rect width="100%" height="100%" fill="url(#cg2)" filter="url(#cbl)"/>
          </svg>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px,transparent 1px)',backgroundSize:'30px 30px',pointerEvents:'none'}}/>
          <div className="spin-cw" style={{position:'absolute',top:'-120px',right:'-120px',width:480,height:480,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.1)',pointerEvents:'none'}}/>

          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)',position:'relative',zIndex:1,width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 420px',gap:'clamp(48px,6vw,80px)',alignItems:'center'}}>
              <div>
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547',marginBottom:24}}>
                    <span style={{width:22,height:1,background:'#B8860B',display:'block'}}/>100% Free Service
                  </div>
                </motion.div>
                <motion.h1 initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:.75,delay:.08,ease:[.22,1,.36,1]}}
                  style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.8rem,6vw,5.5rem)',color:'#FAF7F2',lineHeight:.9,letterSpacing:'-3px',marginBottom:28}}>
                  Talk to an Expert
                  <em className="shimmer-text" style={{display:'block',fontStyle:'italic'}}>Education Counsellor</em>
                </motion.h1>
                <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.2,ease:[.22,1,.36,1]}}
                  style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(15px,1.7vw,17px)',color:'rgba(250,247,242,0.6)',lineHeight:1.8,fontWeight:300,marginBottom:40,maxWidth:480}}>
                  Our experts have helped 500+ families every month find the right school. Free, with zero pressure.
                </motion.p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {BENEFITS.map((b,i)=>(
                    <motion.div key={b.title} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.3+i*.08,duration:.55,ease:[.22,1,.36,1]}}
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'clamp(16px,2.5vw,24px)',backdropFilter:'blur(8px)',transition:'all .22s cursor-default'}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.09)';(e.currentTarget as HTMLElement).style.borderColor='rgba(184,134,11,0.3)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'}}>
                      <div style={{fontSize:24,marginBottom:10}}>{b.icon}</div>
                      <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:17,color:'#FAF7F2',marginBottom:6}}>{b.title}</div>
                      <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'rgba(250,247,242,0.5)',lineHeight:1.6,fontWeight:300}}>{b.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Booking form */}
              <motion.div initial={{opacity:0,x:32,scale:.96}} animate={{opacity:1,x:0,scale:1}} transition={{duration:.75,delay:.15,ease:[.22,1,.36,1]}}>
                <div style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(20px)',borderRadius:22,padding:'clamp(28px,4vw,40px)',boxShadow:'0 40px 100px rgba(13,17,23,0.4)',border:'1px solid rgba(255,255,255,0.8)'}}>
                  <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:26,color:'#0D1117',marginBottom:6}}>Book a Free Session</div>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'#718096',marginBottom:24,fontWeight:300}}>Mon–Sat · 9 AM – 7 PM · Hindi & English</div>
                  <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
                    {[{k:'name',ph:"Parent's Name",type:'text'},{k:'phone',ph:'Phone Number',type:'tel'}].map(({k,ph,type})=>(
                      <input key={k} type={type} placeholder={ph} value={(form as any)[k]} onChange={e=>set(k,e.target.value)} className="form-field"/>
                    ))}
                    <select value={form.city} onChange={e=>set('city',e.target.value)} className="form-field" style={{appearance:'none',color:form.city?'#0D1117':'#A0ADB8'}}>
                      <option value="">Select City</option>
                      {cities.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={form.childAge} onChange={e=>set('childAge',e.target.value)} className="form-field" style={{appearance:'none',color:form.childAge?'#0D1117':'#A0ADB8'}}>
                      <option value="">Child's Current Class</option>
                      {['Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea value={form.concern} onChange={e=>set('concern',e.target.value)} placeholder="What's your main concern? (optional)" className="form-field" rows={3} style={{resize:'none'}}/>
                    <button type="submit" disabled={mutation.isPending}
                      style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'15px',background:'linear-gradient(135deg,#B8860B,#C9960D)',color:'#fff',border:'none',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:15,fontWeight:600,cursor:mutation.isPending?'not-allowed':'pointer',transition:'all .22s',boxShadow:'0 4px 20px rgba(184,134,11,0.35)',opacity:mutation.isPending?.7:1}}
                      onMouseEnter={e=>{if(!mutation.isPending)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform=''}}>
                      {mutation.isPending?<><Loader2 style={{width:16,height:16}} className="animate-spin"/>Booking…</>:<>Book My Free Session <ArrowRight style={{width:15,height:15}}/></>}
                    </button>
                  </form>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8',textAlign:'center',marginTop:12}}>No sales calls · No obligation · 100% free</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{background:'#F5F0E8',padding:'clamp(72px,10vw,120px) 0',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'10%',left:'2%',fontFamily:'Georgia,serif',fontSize:'clamp(150px,22vw,320px)',color:'rgba(184,134,11,0.05)',lineHeight:1,pointerEvents:'none',userSelect:'none'}}>&ldquo;</div>
          <div style={{maxWidth:'1600px',margin:'0 auto',padding:'0 clamp(24px,5vw,80px)'}}>
            <div style={{textAlign:'center',marginBottom:'clamp(40px,5vw,60px)'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}><span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/>Parent Stories<span style={{width:22,height:1.5,background:'#B8860B',display:'block'}}/></div>
              <h2 className="section-title">What Parents <em className="shimmer-text" style={{fontStyle:'italic'}}>Say</em></h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,2vw,20px)'}} className="grid-3">
              {TESTIMONIALS.map((t,i)=>(
                <motion.div key={t.name} initial={{opacity:0,y:32,scale:.96}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true}} transition={{delay:i*.12,duration:.65,ease:[.22,1,.36,1]}}
                  className="card hover-lift" style={{padding:'clamp(24px,3.5vw,40px)'}}>
                  <div style={{display:'flex',gap:2,marginBottom:16}}>{Array.from({length:t.stars}).map((_,s)=><Star key={s} style={{width:13,height:13,fill:'#B8860B',color:'#B8860B'}}/>)}</div>
                  <p style={{fontFamily:'"Cormorant Garamond",serif',fontStyle:'italic',fontSize:'clamp(15px,1.6vw,19px)',color:'#1C2333',lineHeight:1.65,marginBottom:20}}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{display:'flex',alignItems:'center',gap:12,paddingTop:16,borderTop:'1px solid rgba(13,17,23,0.07)'}}>
                    <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#EDE5D8,#E4D9C8)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:16,color:'#B8860B'}}>{t.name[0]}</div>
                    <div>
                      <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:15,color:'#0D1117'}}>{t.name}</div>
                      <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8'}}>{t.city}</div>
                    </div>
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
