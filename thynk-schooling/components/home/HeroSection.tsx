'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Search, MapPin, ArrowRight, Star, BadgeCheck, Sparkles } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=90&auto=format&fit=crop'

function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    let id: number, w = 0, h = 0
    const dpr = Math.min(devicePixelRatio||1,2)
    const resize = () => { w=innerWidth; h=innerHeight; c.width=w*dpr; c.height=h*dpr; c.style.width=w+'px'; c.style.height=h+'px'; ctx.scale(dpr,dpr) }
    resize(); window.addEventListener('resize',resize,{passive:true})
    const N=40, pts=Array.from({length:N},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*2+.5,a:Math.random()*.4+.05}))
    const draw=()=>{
      ctx.clearRect(0,0,w,h)
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(184,134,11,${p.a})`;ctx.fill()})
      for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(184,134,11,${.07*(1-d/140)})`;ctx.lineWidth=.6;ctx.stroke()}}
      id=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(id);window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} style={{position:'absolute',inset:0,zIndex:0,pointerEvents:'none'}}/>
}

function Twinkling() {
  return (
    <div style={{position:'absolute',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      {Array.from({length:20},(_,i)=>(
        <div key={i} style={{position:'absolute',width:3,height:3,borderRadius:'50%',background:'#B8860B',left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,animation:`twinkle ${2+Math.random()*3}s ease-in-out infinite`,animationDelay:`${Math.random()*4}s`,opacity:.3}}/>
      ))}
    </div>
  )
}

export function HeroSection() {
  const router = useRouter()
  const [query,setQuery]=useState('')
  const [city,setCity]=useState('')
  const [mousePos,setMousePos]=useState({x:0,y:0})
  const {options:cities}=useDropdown('city')
  const ct=useContent('home')??{}
  const sectionRef=useRef<HTMLDivElement>(null)
  const {scrollY}=useScroll()
  const imgY=useTransform(scrollY,[0,600],[0,80])

  useEffect(()=>{
    const fn=(e:MouseEvent)=>setMousePos({x:(e.clientX/innerWidth-.5)*30,y:(e.clientY/innerHeight-.5)*18})
    window.addEventListener('mousemove',fn,{passive:true})
    return ()=>window.removeEventListener('mousemove',fn)
  },[])

  return (
    <section ref={sectionRef} style={{background:'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 60%,#EEE0C0 100%)',minHeight:'100vh',display:'flex',alignItems:'center',paddingTop:80,overflow:'hidden',position:'relative',width:'100%'}}>
      <ParticleField/>
      <Twinkling/>

      {/* Animated mesh gradient */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="g1" cx="15%" cy="20%" r="50%"><stop stopColor="#E8C547" stopOpacity=".18"><animate attributeName="cx" values="15%;32%;15%" dur="18s" repeatCount="indefinite"/><animate attributeName="cy" values="20%;35%;20%" dur="22s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#E8C547" stopOpacity="0"/></radialGradient>
          <radialGradient id="g2" cx="80%" cy="70%" r="45%"><stop stopColor="#B8860B" stopOpacity=".1"><animate attributeName="cx" values="80%;62%;80%" dur="26s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <radialGradient id="g3" cx="50%" cy="95%" r="40%"><stop stopColor="#0A5F55" stopOpacity=".06"><animate attributeName="cy" values="95%;75%;95%" dur="19s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
          <filter id="hblur"><feGaussianBlur stdDeviation="55"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#g1)" filter="url(#hblur)"/>
        <rect width="100%" height="100%" fill="url(#g2)" filter="url(#hblur)"/>
        <rect width="100%" height="100%" fill="url(#g3)" filter="url(#hblur)"/>
      </svg>

      {/* Fine grid */}
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px,transparent 1px)',backgroundSize:'38px 38px',zIndex:0,pointerEvents:'none'}}/>
      {/* Diagonal lines */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} preserveAspectRatio="xMidYMid slice">
        {[1050,1130,1210,1290,1370].map((x,i)=><line key={i} x1={x} y1="0" x2={x+520} y2="900" stroke="rgba(184,134,11,0.06)" strokeWidth="1"/>)}
      </svg>

      <div style={{width:'100%',maxWidth:'1600px',margin:'0 auto',padding:'80px clamp(24px,5vw,80px)',position:'relative',zIndex:2}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(48px,6vw,100px)',alignItems:'center',minHeight:'calc(100vh - 160px)'}}>

          {/* LEFT */}
          <div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px 6px 8px',background:'rgba(184,134,11,0.1)',border:'1px solid rgba(184,134,11,0.25)',borderRadius:100,marginBottom:32,backdropFilter:'blur(8px)'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#B8860B,#E8C547)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(184,134,11,0.4)'}}>
                  <Sparkles style={{width:12,height:12,color:'#fff'}}/>
                </div>
                <span style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:'#926A09'}}>{ct.eyebrow||'AI-Powered · Free for Parents'}</span>
              </div>
            </motion.div>

            <div style={{overflow:'hidden',marginBottom:32}}>
              <motion.h1 initial={{opacity:0,y:'100%'}} animate={{opacity:1,y:0}} transition={{duration:.8,delay:.08,ease:[.22,1,.36,1]}}
                style={{fontFamily:'"Cormorant Garamond",Georgia,serif',fontWeight:700,fontSize:'clamp(3.8rem,7.5vw,7.8rem)',lineHeight:.86,letterSpacing:'-4px',color:'#0D1117',margin:0}}>
                {ct.h1Line1||'Find the'}
                <br/>
                <span className="text-shimmer" style={{fontStyle:'italic'}}>{ct.h1Italic||'Perfect School'}</span>
                <br/>
                <span style={{color:'rgba(13,17,23,0.16)',fontSize:'.65em',fontWeight:400,fontStyle:'normal',letterSpacing:'-2px'}}>{ct.h1Line3||'for Your Child'}</span>
              </motion.h1>
            </div>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.22,ease:[.22,1,.36,1]}}
              style={{fontFamily:'Inter,sans-serif',fontSize:'clamp(15px,1.7vw,18px)',fontWeight:300,color:'#4A5568',lineHeight:1.8,maxWidth:480,marginBottom:40}}>
              {ct.subtext||'Search, compare & apply to 12,000+ verified schools across 350+ Indian cities. CBSE, ICSE, IB and more.'}
            </motion.p>

            {/* Search box */}
            <motion.form initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.3,ease:[.22,1,.36,1]}} onSubmit={e=>{e.preventDefault();const p=new URLSearchParams;if(query)p.set('q',query);if(city)p.set('city',city);router.push(`/schools?${p}`)}} style={{marginBottom:32,maxWidth:560}}>
              <div style={{background:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(13,17,23,0.1)',borderRadius:18,overflow:'hidden',boxShadow:'0 24px 64px rgba(13,17,23,0.12),0 2px 8px rgba(184,134,11,0.08)',backdropFilter:'blur(20px)',transition:'box-shadow .3s,transform .3s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow='0 28px 80px rgba(13,17,23,0.15),0 2px 12px rgba(184,134,11,0.14)';el.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow='0 24px 64px rgba(13,17,23,0.12),0 2px 8px rgba(184,134,11,0.08)';el.style.transform='translateY(0)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 20px',borderBottom:'1px solid rgba(13,17,23,0.06)'}}>
                  <Search style={{width:16,height:16,color:'#B8860B',flexShrink:0}}/>
                  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ct.searchPlaceholder||"School name, board, or keyword…"} style={{flex:1,border:'none',outline:'none',fontSize:15,fontFamily:'Inter,sans-serif',fontWeight:300,color:'#0D1117',background:'transparent',padding:'18px 0'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 20px',flex:1}}>
                    <MapPin style={{width:14,height:14,color:'#B8860B',flexShrink:0}}/>
                    <select value={city} onChange={e=>setCity(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14,fontFamily:'Inter,sans-serif',color:city?'#0D1117':'#A0ADB8',background:'transparent',cursor:'pointer',padding:'16px 0',appearance:'none'}}>
                      <option value="">All Cities</option>
                      {cities.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{background:'linear-gradient(135deg,#B8860B,#C9960D)',color:'#fff',border:'none',fontSize:14,fontWeight:600,fontFamily:'Inter,sans-serif',padding:'0 32px',height:58,cursor:'pointer',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',transition:'all .22s',flexShrink:0,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15)'}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='linear-gradient(135deg,#C9960D,#D4A520)';el.style.boxShadow='0 4px 20px rgba(184,134,11,0.4)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='linear-gradient(135deg,#B8860B,#C9960D)';el.style.boxShadow='inset 0 1px 0 rgba(255,255,255,0.15)'}}>
                    {ct.ctaPrimary||'Search Schools'} <ArrowRight style={{width:15,height:15}}/>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust row */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.46,duration:.6}} style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.7)',backdropFilter:'blur(12px)',borderRadius:12,border:'1px solid rgba(13,17,23,0.08)'}}>
                <div style={{display:'flex'}}>
                  {['P','R','A','S','M'].map((l,i)=>(
                    <div key={i} style={{width:26,height:26,borderRadius:'50%',background:`hsl(${i*50+20},38%,68%)`,border:'2px solid rgba(253,250,245,0.9)',marginLeft:i>0?'-7px':'0',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:10,color:'#0D1117',position:'relative',zIndex:5-i}}>{l}</div>
                  ))}
                </div>
                <div>
                  <div style={{display:'flex',gap:1,marginBottom:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:9,height:9,fill:'#B8860B',color:'#B8860B'}}/>)}</div>
                  <span style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096',fontWeight:300}}><strong style={{color:'#0D1117',fontWeight:600}}>1 Lakh+</strong> parents</span>
                </div>
              </div>
              <div style={{width:1,height:28,background:'rgba(13,17,23,0.1)'}}/>
              {[{icon:<BadgeCheck style={{width:12,height:12}}/>,t:'12K+ Schools'},{icon:<Sparkles style={{width:12,height:12}}/>,t:'AI Matched'},{icon:<Star style={{width:12,height:12}}/>,t:'100% Free'}].map(b=>(
                <div key={b.t} style={{display:'flex',alignItems:'center',gap:5,fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:500,color:'#718096'}}>
                  <span style={{color:'#B8860B'}}>{b.icon}</span>{b.t}
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{opacity:0,scale:.92,x:40}} animate={{opacity:1,scale:1,x:0}} transition={{duration:.9,delay:.12,ease:[.22,1,.36,1]}} style={{position:'relative'}}>
            <motion.div style={{x:mousePos.x*.4,y:mousePos.y*.3,transition:'all .15s ease-out',position:'relative'}}>

              {/* Spinning rings */}
              <div className="spin-slow" style={{position:'absolute',inset:'-32px',border:'1.5px solid rgba(184,134,11,0.18)',borderRadius:32,pointerEvents:'none'}}/>
              <div className="spin-rev" style={{position:'absolute',inset:'-52px',border:'1px solid rgba(184,134,11,0.08)',borderRadius:42,pointerEvents:'none'}}/>
              {/* Glow ring */}
              <div style={{position:'absolute',inset:'-4px',borderRadius:28,background:'linear-gradient(135deg,rgba(184,134,11,0.2),transparent,rgba(232,197,71,0.15),transparent)',filter:'blur(12px)',zIndex:-1}}/>

              {/* Image with parallax */}
              <motion.div style={{y:imgY}} transition={{type:'spring',stiffness:40,damping:25}}>
                <div style={{borderRadius:24,overflow:'hidden',aspectRatio:'4/3',boxShadow:'0 60px 120px rgba(13,17,23,0.22),0 12px 40px rgba(184,134,11,0.12)',position:'relative',border:'1px solid rgba(255,255,255,0.4)'}}>
                  <img src={ct.heroImage||DEFAULT_IMG} alt="Students" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .6s ease'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.04)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}/>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(13,17,23,0.45) 0%,transparent 55%)',pointerEvents:'none'}}/>
                  {/* Shimmer sweep */}
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.07) 50%,transparent 65%)',backgroundSize:'200%',animation:'shimmerBg 4s linear infinite',pointerEvents:'none'}}/>

                  {/* Bottom-left stat card */}
                  <motion.div initial={{opacity:0,y:20,x:-10}} animate={{opacity:1,y:0,x:0}} transition={{delay:.6,duration:.6}} className="float-slow"
                    style={{position:'absolute',bottom:20,left:'-16px',background:'rgba(255,255,255,0.98)',backdropFilter:'blur(20px)',borderRadius:16,padding:'14px 18px',boxShadow:'0 20px 60px rgba(13,17,23,0.2)',display:'flex',alignItems:'center',gap:14,border:'1px solid rgba(255,255,255,0.9)'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,rgba(184,134,11,0.15),rgba(184,134,11,0.05))',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(184,134,11,0.2)'}}>
                      <BadgeCheck style={{width:22,height:22,color:'#B8860B'}}/>
                    </div>
                    <div>
                      <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:24,color:'#0D1117',lineHeight:1}}>12,000+</div>
                      <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096',marginTop:2,fontWeight:400}}>Verified Schools</div>
                    </div>
                  </motion.div>

                  {/* Top-right AI badge */}
                  <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{delay:.7,duration:.5}} className="float-fast"
                    style={{position:'absolute',top:18,right:18,background:'linear-gradient(135deg,rgba(184,134,11,0.96),rgba(201,150,13,0.96))',borderRadius:100,padding:'8px 16px',fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,color:'#fff',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 20px rgba(184,134,11,0.5),0 1px 0 rgba(255,255,255,0.2) inset'}}>
                    <Sparkles style={{width:11,height:11}}/> AI Powered
                  </motion.div>

                  {/* Bottom-right rating */}
                  <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:.75,duration:.5}} style={{animation:'floatY 4.5s ease-in-out infinite',animationDelay:'-2.2s',position:'absolute',bottom:20,right:'-10px',background:'rgba(13,17,23,0.92)',backdropFilter:'blur(16px)',borderRadius:12,padding:'10px 16px',display:'flex',alignItems:'center',gap:8,border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:10,height:10,fill:'#E8C547',color:'#E8C547'}}/>)}</div>
                    <span style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(250,247,242,0.85)',fontWeight:400}}>4.8 avg rating</span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes scrollDot{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
        @keyframes blobMorph{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}25%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}50%{border-radius:50% 60% 30% 60%/30% 40% 70% 50%}75%{border-radius:40% 60% 50% 40%/60% 30% 50% 40%}}
        @keyframes heroFloat{0%,100%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-10px) rotate(1.5deg)}66%{transform:translateY(-5px) rotate(-1deg)}}
        @keyframes spin-slow{to{transform:rotate(360deg)}}
        @keyframes spin-rev{to{transform:rotate(-360deg)}}
        @keyframes float-fast{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.8);opacity:0}}
        .spin-slow{animation:spin-slow 30s linear infinite}
        .spin-rev{animation:spin-rev 22s linear infinite}
        .float-fast{animation:float-fast 3s ease-in-out infinite}
        .blob-shape{animation:blobMorph 12s ease-in-out infinite}
      `}</style>

      {/* Morphing blobs */}
      <div style={{position:'absolute',top:'8%',right:'5%',width:320,height:320,background:'radial-gradient(circle,rgba(184,134,11,0.12),transparent 70%)',filter:'blur(40px)',pointerEvents:'none',zIndex:0,animation:'heroFloat 9s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'15%',left:'2%',width:260,height:260,background:'radial-gradient(circle,rgba(10,95,85,0.08),transparent 70%)',filter:'blur(50px)',pointerEvents:'none',zIndex:0,animation:'heroFloat 12s ease-in-out infinite',animationDelay:'-4s'}}/>
      <div className="blob-shape" style={{position:'absolute',top:'40%',right:'2%',width:180,height:180,background:'rgba(232,197,71,0.07)',filter:'blur(30px)',pointerEvents:'none',zIndex:0}}/>

      {/* Scroll indicator */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2,duration:.8}} style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,zIndex:2}}>
        <span style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(13,17,23,0.3)'}}>Scroll</span>
        <div style={{width:1,height:48,background:'linear-gradient(to bottom,rgba(184,134,11,0.4),transparent)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,width:'100%',height:16,background:'rgba(184,134,11,0.6)',animation:'scrollDot 1.5s ease-in-out infinite'}}/>
        </div>
      </motion.div>

      {/* Floating side achievements */}
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:1,duration:.7,ease:[.22,1,.36,1]}}
        style={{position:'absolute',left:'clamp(8px,2vw,24px)',top:'38%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:10,zIndex:3,pointerEvents:'none'}}>
        {[{emoji:'🏫',n:'350+',t:'Cities'},{emoji:'📋',n:'98%',t:'Success'},{emoji:'⭐',n:'4.8',t:'Rating'}].map((it,i)=>(
          <motion.div key={it.t} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:1.1+i*.12}}
            style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(16px)',borderRadius:12,padding:'10px 14px',boxShadow:'0 8px 32px rgba(13,17,23,0.12)',border:'1px solid rgba(255,255,255,0.8)',display:'flex',alignItems:'center',gap:8,animation:`heroFloat ${4+i}s ease-in-out infinite`,animationDelay:`${-i*1.5}s`}}>
            <span style={{fontSize:18}}>{it.emoji}</span>
            <div>
              <div style={{fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:15,color:'#0D1117',lineHeight:1}}>{it.n}</div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:10,color:'#718096',fontWeight:500}}>{it.t}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
