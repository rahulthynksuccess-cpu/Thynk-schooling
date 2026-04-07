'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Search, MapPin, ArrowRight, Star, BadgeCheck, Sparkles } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=90&auto=format&fit=crop'

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const { options: cities } = useDropdown('city')
  const ct = useContent('home') ?? {}
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const imgY = useTransform(scrollY, [0, 600], [0, 60])

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'linear-gradient(168deg,#FDFAF5 0%,#F7F0E4 45%,#EEE3CC 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 80,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* dot grid */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.07) 1px,transparent 1px)',backgroundSize:'40px 40px' }} />

      {/* ambient glows */}
      <div style={{ position:'absolute',top:'10%',right:'10%',width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(184,134,11,0.10) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none',zIndex:0 }} />
      <div style={{ position:'absolute',bottom:'5%',left:'3%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(10,95,85,0.06) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none',zIndex:0 }} />

      {/* diagonal lines */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0 }} preserveAspectRatio="xMidYMid slice">
        {[980,1060,1140,1220,1300].map((x,i)=><line key={i} x1={x} y1="0" x2={x+480} y2="900" stroke="rgba(184,134,11,0.05)" strokeWidth="1"/>)}
      </svg>

      <div style={{ width:'100%',maxWidth:'1480px',margin:'0 auto',padding:'72px clamp(24px,5vw,72px)',position:'relative',zIndex:2 }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(40px,6vw,96px)',alignItems:'center',minHeight:'calc(100vh - 200px)' }}>

          {/* LEFT */}
          <div>
            {/* Eyebrow */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} style={{marginBottom:28}}>
              <span style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px 6px 8px',background:'rgba(184,134,11,0.09)',border:'1px solid rgba(184,134,11,0.22)',borderRadius:100,backdropFilter:'blur(8px)' }}>
                <span style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#B8860B,#E8C547)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(184,134,11,0.35)' }}>
                  <Sparkles style={{width:11,height:11,color:'#fff'}}/>
                </span>
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.13em',textTransform:'uppercase',color:'#8A6209' }}>
                  {ct.eyebrow||'AI-Powered · Free for Parents'}
                </span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{opacity:0,y:28}} animate={{opacity:1,y:0}}
              transition={{duration:0.8,delay:0.08,ease:[0.22,1,0.36,1]}}
              style={{ fontFamily:'"Cormorant Garamond",Georgia,serif',fontWeight:700,fontSize:'clamp(3.6rem,7vw,7.2rem)',lineHeight:0.88,letterSpacing:'-3px',color:'#0D1117',margin:'0 0 28px 0' }}
            >
              {ct.h1Line1||'Find the'}<br/>
              <em style={{fontStyle:'italic',color:'#B8860B'}}>{ct.h1Italic||'Perfect School'}</em><br/>
              <span style={{color:'rgba(13,17,23,0.18)',fontSize:'.62em',fontWeight:400,fontStyle:'normal',letterSpacing:'-2px'}}>{ct.h1Line3||'for Your Child'}</span>
            </motion.h1>

            {/* Sub */}
            <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2,ease:[0.22,1,0.36,1]}}
              style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(15px,1.6vw,17px)',fontWeight:300,color:'#4A5568',lineHeight:1.75,maxWidth:460,marginBottom:36 }}>
              {ct.subtext||'Search, compare & apply to 12,000+ verified schools across 350+ Indian cities. CBSE, ICSE, IB and more.'}
            </motion.p>

            {/* Search */}
            <motion.form initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.28,ease:[0.22,1,0.36,1]}}
              onSubmit={e=>{e.preventDefault();const p=new URLSearchParams;if(query)p.set('q',query);if(city)p.set('city',city);router.push(`/schools?${p}`)}}
              style={{marginBottom:32,maxWidth:540}}>
              <div style={{ background:'#fff',border:'1.5px solid rgba(13,17,23,0.09)',borderRadius:16,overflow:'hidden',boxShadow:'0 20px 56px rgba(13,17,23,0.10),0 2px 8px rgba(184,134,11,0.06)',transition:'box-shadow .28s,transform .28s' }}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow='0 24px 72px rgba(13,17,23,0.14),0 2px 12px rgba(184,134,11,0.12)';el.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow='0 20px 56px rgba(13,17,23,0.10),0 2px 8px rgba(184,134,11,0.06)';el.style.transform='translateY(0)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 18px',borderBottom:'1px solid rgba(13,17,23,0.06)'}}>
                  <Search style={{width:15,height:15,color:'#B8860B',flexShrink:0}}/>
                  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ct.searchPlaceholder||'School name, board, or keyword…'}
                    style={{flex:1,border:'none',outline:'none',fontSize:15,fontFamily:'Inter,sans-serif',fontWeight:300,color:'#0D1117',background:'transparent',padding:'17px 0'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 18px',flex:1}}>
                    <MapPin style={{width:13,height:13,color:'#B8860B',flexShrink:0}}/>
                    <select value={city} onChange={e=>setCity(e.target.value)}
                      style={{flex:1,border:'none',outline:'none',fontSize:14,fontFamily:'Inter,sans-serif',color:city?'#0D1117':'#A0ADB8',background:'transparent',cursor:'pointer',padding:'15px 0',appearance:'none'}}>
                      <option value="">All Cities</option>
                      {cities.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ background:'#0D1117',color:'#FAF7F2',border:'none',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',padding:'0 28px',height:54,cursor:'pointer',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',transition:'all .22s',flexShrink:0,letterSpacing:'.01em' }}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#B8860B';el.style.boxShadow='0 4px 20px rgba(184,134,11,0.35)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='#0D1117';el.style.boxShadow='none'}}>
                    {ct.ctaPrimary||'Search Schools'} <ArrowRight style={{width:14,height:14}}/>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.44,duration:0.6}}
              style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:16}}>
              <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:'rgba(255,255,255,0.75)',backdropFilter:'blur(12px)',borderRadius:10,border:'1px solid rgba(13,17,23,0.07)' }}>
                <div style={{display:'flex'}}>
                  {['P','R','A','S','M'].map((l,i)=>(
                    <div key={i} style={{ width:26,height:26,borderRadius:'50%',background:`hsl(${i*46+24},36%,66%)`,border:'2px solid rgba(253,250,245,0.95)',marginLeft:i>0?'-7px':'0',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:10,color:'#0D1117',position:'relative',zIndex:5-i }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div style={{display:'flex',gap:1,marginBottom:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:9,height:9,fill:'#B8860B',color:'#B8860B'}}/>)}</div>
                  <span style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096',fontWeight:300}}><strong style={{color:'#0D1117',fontWeight:600}}>1 Lakh+</strong> parents</span>
                </div>
              </div>
              <div style={{width:1,height:28,background:'rgba(13,17,23,0.08)'}}/>
              {[{icon:<BadgeCheck style={{width:12,height:12}}/>,t:'12K+ Schools'},{icon:<Sparkles style={{width:12,height:12}}/>,t:'AI Matched'},{icon:<Star style={{width:12,height:12}}/>,t:'100% Free'}].map(b=>(
                <div key={b.t} style={{display:'flex',alignItems:'center',gap:5,fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:500,color:'#718096'}}>
                  <span style={{color:'#B8860B'}}>{b.icon}</span>{b.t}
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{opacity:0,scale:0.93,x:32}} animate={{opacity:1,scale:1,x:0}} transition={{duration:0.9,delay:0.1,ease:[0.22,1,0.36,1]}} style={{position:'relative'}}>
            <motion.div style={{y:imgY,position:'relative'}}>
              {/* rings */}
              <div style={{ position:'absolute',inset:'-20px',border:'1px solid rgba(184,134,11,0.14)',borderRadius:28,pointerEvents:'none',animation:'spinSlow 40s linear infinite' }}/>
              <div style={{ position:'absolute',inset:'-38px',border:'1px dashed rgba(184,134,11,0.07)',borderRadius:36,pointerEvents:'none',animation:'spinSlowRev 28s linear infinite' }}/>
              <div style={{ position:'absolute',inset:'-8px',borderRadius:28,background:'linear-gradient(135deg,rgba(184,134,11,0.18),transparent,rgba(232,197,71,0.12),transparent)',filter:'blur(16px)',zIndex:-1 }}/>

              {/* Image */}
              <div style={{ borderRadius:22,overflow:'hidden',aspectRatio:'4/3',boxShadow:'0 48px 100px rgba(13,17,23,0.20),0 8px 32px rgba(184,134,11,0.10)',position:'relative',border:'1px solid rgba(255,255,255,0.45)' }}>
                <img src={ct.heroImage||DEFAULT_IMG} alt="Students"
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .6s ease'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.04)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(13,17,23,0.42) 0%,transparent 52%)',pointerEvents:'none'}}/>

                {/* AI badge */}
                <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{delay:0.72,duration:0.5}}
                  style={{ position:'absolute',top:16,right:16,background:'rgba(13,17,23,0.88)',backdropFilter:'blur(12px)',borderRadius:100,padding:'7px 14px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,color:'#E8C547',display:'flex',alignItems:'center',gap:6,border:'1px solid rgba(232,197,71,0.25)' }}>
                  <Sparkles style={{width:10,height:10}}/> AI Powered
                </motion.div>

                {/* Schools count */}
                <motion.div initial={{opacity:0,y:16,x:-8}} animate={{opacity:1,y:0,x:0}} transition={{delay:0.62,duration:0.6}}
                  className="float-slow"
                  style={{ position:'absolute',bottom:18,left:'-14px',background:'rgba(255,255,255,0.97)',backdropFilter:'blur(20px)',borderRadius:14,padding:'12px 16px',boxShadow:'0 16px 48px rgba(13,17,23,0.18)',display:'flex',alignItems:'center',gap:12,border:'1px solid rgba(255,255,255,0.9)' }}>
                  <div style={{ width:40,height:40,borderRadius:11,background:'rgba(184,134,11,0.10)',border:'1px solid rgba(184,134,11,0.18)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <BadgeCheck style={{width:20,height:20,color:'#B8860B'}}/>
                  </div>
                  <div>
                    <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',lineHeight:1}}>12,000+</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096',marginTop:2,fontWeight:400}}>Verified Schools</div>
                  </div>
                </motion.div>

                {/* Rating */}
                <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:0.78,duration:0.5}}
                  style={{ position:'absolute',bottom:18,right:'-10px',background:'rgba(13,17,23,0.90)',backdropFilter:'blur(14px)',borderRadius:12,padding:'9px 14px',display:'flex',alignItems:'center',gap:8,border:'1px solid rgba(255,255,255,0.07)',animation:'floatY 4s ease-in-out infinite',animationDelay:'-2s' }}>
                  <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:10,height:10,fill:'#E8C547',color:'#E8C547'}}/>)}</div>
                  <span style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(250,247,242,0.82)',fontWeight:400}}>4.8 avg rating</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Side stats */}
            <div style={{ position:'absolute',right:'-16px',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:8,zIndex:3 }}>
              {[{emoji:'🏙️',n:'350+',t:'Cities'},{emoji:'📋',n:'98%',t:'Success'},{emoji:'⭐',n:'4.8',t:'Rating'}].map((it,i)=>(
                <motion.div key={it.t} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:1+i*0.12}}
                  style={{ background:'rgba(255,255,255,0.94)',backdropFilter:'blur(16px)',borderRadius:10,padding:'8px 12px',boxShadow:'0 6px 24px rgba(13,17,23,0.10)',border:'1px solid rgba(255,255,255,0.85)',display:'flex',alignItems:'center',gap:8,animation:`heroFloat ${4+i}s ease-in-out infinite`,animationDelay:`${-i*1.3}s` }}>
                  <span style={{fontSize:16}}>{it.emoji}</span>
                  <div>
                    <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:14,color:'#0D1117',lineHeight:1}}>{it.n}</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:10,color:'#718096',fontWeight:500}}>{it.t}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.3,duration:0.8}}
        style={{ position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,zIndex:2 }}>
        <span style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(13,17,23,0.28)'}}>Explore</span>
        <div style={{width:1,height:44,background:'linear-gradient(to bottom,rgba(184,134,11,0.45),transparent)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,width:'100%',height:14,background:'rgba(184,134,11,0.65)',animation:'scrollDot 1.6s ease-in-out infinite'}}/>
        </div>
      </motion.div>

      <style>{`
        @keyframes scrollDot{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
        @keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        @keyframes spinSlowRev{to{transform:rotate(-360deg)}}
        .float-slow{animation:floatY 5s ease-in-out infinite}
      `}</style>
    </section>
  )
}
