'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, ArrowRight, Star, BadgeCheck, Sparkles } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'

const IMG = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=90&auto=format&fit=crop'

function useMouse() {
  const [p, setP] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const fn = (e: MouseEvent) => setP({ x: (e.clientX / window.innerWidth - .5) * 20, y: (e.clientY / window.innerHeight - .5) * 12 })
    window.addEventListener('mousemove', fn, { passive: true })
    return () => window.removeEventListener('mousemove', fn)
  }, [])
  return p
}

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const { options: cities } = useDropdown('city')
  const ct = useContent('home') ?? {}
  const mouse = useMouse()
  const img = ct.heroImage || IMG

  return (
    <section style={{ background:'#FDFAF5', minHeight:'100vh', display:'flex', alignItems:'center', paddingTop:72, overflow:'hidden', position:'relative', width:'100%' }}>

      {/* Animated SVG mesh */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="h1" cx="15%" cy="25%"><stop stopColor="#E8C547" stopOpacity=".14"><animate attributeName="cx" values="15%;30%;15%" dur="20s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#E8C547" stopOpacity="0"/></radialGradient>
          <radialGradient id="h2" cx="85%" cy="65%"><stop stopColor="#B8860B" stopOpacity=".09"><animate attributeName="cx" values="85%;68%;85%" dur="25s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <filter id="hblur"><feGaussianBlur stdDeviation="60"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#h1)" filter="url(#hblur)"/>
        <rect width="100%" height="100%" fill="url(#h2)" filter="url(#hblur)"/>
      </svg>

      {/* Dot grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.07) 1px, transparent 1px)', backgroundSize:'36px 36px', pointerEvents:'none' }}/>

      {/* Diagonal lines */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:.6 }} preserveAspectRatio="xMidYMid slice">
        {[1100,1180,1260,1340].map((x,i)=><line key={i} x1={x} y1="0" x2={x+500} y2="900" stroke="rgba(184,134,11,0.06)" strokeWidth="1"/>)}
      </svg>

      <div style={{ width:'100%', maxWidth:'1600px', margin:'0 auto', padding:'80px clamp(24px,5vw,80px)', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(48px,6vw,100px)', alignItems:'center' }}>

          {/* LEFT */}
          <div>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.65, ease:[.22,1,.36,1] }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px 6px 8px', background:'rgba(184,134,11,0.09)', border:'1px solid rgba(184,134,11,0.22)', borderRadius:100, marginBottom:32 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#B8860B', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles style={{ width:11, height:11, color:'#fff' }}/></div>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'#B8860B' }}>AI-Powered · Free for Parents</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.75, delay:.08, ease:[.22,1,.36,1] }}
              style={{ fontFamily:'"Cormorant Garamond",Georgia,serif', fontWeight:700, fontSize:'clamp(3.6rem,7vw,7rem)', lineHeight:.88, letterSpacing:'-3px', color:'#0D1117', margin:'0 0 28px' }}>
              Find the
              <em style={{ display:'block', fontStyle:'italic', background:'linear-gradient(120deg,#B8860B 0%,#E8C547 45%,#C9960D 100%)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimmerText 3.5s linear infinite' }}>Perfect School</em>
              <span style={{ display:'block', color:'rgba(13,17,23,0.18)', fontSize:'.65em', fontWeight:400, fontStyle:'normal', letterSpacing:'-1px' }}>for Your Child</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.2, ease:[.22,1,.36,1] }}
              style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(15px,1.7vw,18px)', fontWeight:300, color:'#4A5568', lineHeight:1.8, maxWidth:480, marginBottom:40 }}>
              Search, compare &amp; apply to <strong style={{ color:'#0D1117', fontWeight:600 }}>12,000+ verified schools</strong> across 35+ Indian cities. CBSE, ICSE, IB and more.
            </motion.p>

            {/* Search */}
            <motion.form initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.3, ease:[.22,1,.36,1] }} onSubmit={e=>{e.preventDefault();const p=new URLSearchParams();if(query)p.set('q',query);if(city)p.set('city',city);router.push(`/schools?${p}`)}} style={{ marginBottom:32, maxWidth:560 }}>
              <div style={{ background:'#fff', border:'1.5px solid rgba(13,17,23,0.1)', borderRadius:16, overflow:'hidden', boxShadow:'0 20px 60px rgba(13,17,23,0.1), 0 2px 8px rgba(184,134,11,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px', borderBottom:'1px solid rgba(13,17,23,0.06)' }}>
                  <Search style={{ width:15, height:15, color:'#B8860B', flexShrink:0 }}/>
                  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="School name, board, or keyword…" style={{ flex:1, border:'none', outline:'none', fontSize:15, fontFamily:'Inter,sans-serif', fontWeight:300, color:'#0D1117', background:'transparent', padding:'18px 0' }}/>
                </div>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px', flex:1 }}>
                    <MapPin style={{ width:13, height:13, color:'#B8860B', flexShrink:0 }}/>
                    <select value={city} onChange={e=>setCity(e.target.value)} style={{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'Inter,sans-serif', color:city?'#0D1117':'#A0ADB8', background:'transparent', cursor:'pointer', padding:'16px 0', appearance:'none' }}>
                      <option value="">All Cities</option>
                      {cities.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ background:'#B8860B', color:'#fff', border:'none', fontSize:14, fontWeight:600, fontFamily:'Inter,sans-serif', padding:'0 32px', height:56, cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', transition:'background .2s,letter-spacing .2s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#C9960D'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#B8860B'}}>
                    Search <ArrowRight style={{ width:14, height:14 }}/>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Social proof */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.46, duration:.6 }} style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex' }}>
                  {['P','R','A','S','M'].map((l,i)=>(
                    <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:`hsl(${i*50+20},38%,68%)`, border:'2px solid #FDFAF5', marginLeft:i>0?'-7px':'0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:11, color:'#0D1117', position:'relative', zIndex:5-i }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div style={{ display:'flex', gap:1, marginBottom:2 }}>{[1,2,3,4,5].map(s=><Star key={s} style={{ width:10, height:10, fill:'#B8860B', color:'#B8860B' }}/>)}</div>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#718096', fontWeight:300 }}><strong style={{ color:'#0D1117', fontWeight:600 }}>1 Lakh+</strong> happy parents</span>
                </div>
              </div>
              <div style={{ width:1, height:24, background:'rgba(13,17,23,0.1)' }}/>
              {['12K+ Schools','100% Free','AI Matched'].map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:500, color:'#718096' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#B8860B' }}/>{t}
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{ opacity:0, scale:.94, x:40 }} animate={{ opacity:1, scale:1, x:0 }} transition={{ duration:.9, delay:.12, ease:[.22,1,.36,1] }}
            style={{ position:'relative' }}>
            {/* Mouse-parallax container */}
            <div style={{ transform:`translate(${mouse.x*.4}px,${mouse.y*.3}px)`, transition:'transform .1s linear', position:'relative' }}>
              {/* Rotating rings */}
              <div style={{ position:'absolute', inset:'-28px', border:'1.5px solid rgba(184,134,11,0.14)', borderRadius:32, transform:'rotate(2.5deg)', animation:'spin36 40s linear infinite' }}/>
              <div style={{ position:'absolute', inset:'-44px', border:'1px solid rgba(184,134,11,0.07)', borderRadius:40, transform:'rotate(-2deg)', animation:'spin36 55s linear infinite reverse' }}/>

              {/* Image */}
              <div style={{ borderRadius:24, overflow:'hidden', aspectRatio:'4/3', boxShadow:'0 48px 120px rgba(13,17,23,0.2), 0 8px 32px rgba(184,134,11,0.1)', position:'relative' }}>
                <img src={img} alt="Students" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,17,23,0.4) 0%, transparent 50%)' }}/>
                {/* Shimmer sweep */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.06) 50%,transparent 60%)', backgroundSize:'200%', animation:'shimmerText 4s linear infinite' }}/>
              </div>

              {/* Floating cards with parallax */}
              <motion.div style={{ x: mouse.x * .6, y: mouse.y * .5 }} transition={{ type:'spring', stiffness:60, damping:20 }}
                className="float-card"
                css={{ position:'absolute', bottom:24, left:'-20px', background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', borderRadius:16, padding:'14px 20px', boxShadow:'0 16px 48px rgba(13,17,23,0.16)', display:'flex', alignItems:'center', gap:14, border:'1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ position:'absolute', bottom:24, left:'-20px', background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', borderRadius:16, padding:'14px 20px', boxShadow:'0 16px 48px rgba(13,17,23,0.16)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:'rgba(184,134,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><BadgeCheck style={{ width:22, height:22, color:'#B8860B' }}/></div>
                  <div><div style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:22, color:'#0D1117', lineHeight:1 }}>12,000+</div><div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#718096', marginTop:2 }}>Verified Schools</div></div>
                </div>
              </motion.div>

              {/* AI badge */}
              <div style={{ position:'absolute', top:20, right:20, background:'rgba(184,134,11,0.95)', borderRadius:100, padding:'8px 16px', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, color:'#fff', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 20px rgba(184,134,11,0.4)', animation:'floatY 3.5s ease-in-out infinite' }}>
                <Sparkles style={{ width:11, height:11 }}/> AI Powered
              </div>

              {/* Rating pill bottom-right */}
              <div style={{ position:'absolute', bottom:24, right:'-12px', background:'rgba(13,17,23,0.92)', backdropFilter:'blur(12px)', borderRadius:12, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, animation:'floatY 4.5s ease-in-out infinite', animationDelay:'-2s' }}>
                <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(s=><Star key={s} style={{ width:10, height:10, fill:'#E8C547', color:'#E8C547' }}/>)}</div>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(250,247,242,0.8)', fontWeight:400 }}>4.8 avg rating</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(transparent,rgba(245,240,232,0.5))', pointerEvents:'none' }}/>
    </section>
  )
}
