'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, BadgeCheck, Sparkles, ArrowRight, Star } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'
import { ParticleCanvas, FloatingOrbs } from './HomeVisualEffects'

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] },
})

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=85&auto=format&fit=crop'

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const { options: cities } = useDropdown('city')
  const raw = useContent('home')
  const ct = raw ?? {}
  const heroImage = ct.heroImage || DEFAULT_HERO_IMAGE

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (city) p.set('city', city)
    router.push(`/schools?${p.toString()}`)
  }

  return (
    <section style={{
      background: 'linear-gradient(150deg, var(--hero-bg,#FAF7F2) 0%, var(--hero-bg-grad,#F0EAD6) 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '72px',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    }}>
      {/* Particle canvas */}
      <ParticleCanvas />
      {/* Floating orb blobs */}
      <FloatingOrbs variant="light" />
      {/* Dot grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.06) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />

      <div style={{ width:'100%', maxWidth:'var(--container-width,1600px)', margin:'0 auto', padding:'60px clamp(20px,5vw,80px)', position:'relative', zIndex:2 }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.15fr) minmax(0,0.85fr)', gap:'clamp(40px,6vw,100px)', alignItems:'center' }}>

          {/* LEFT */}
          <div>
            <motion.div {...fade(0.05)}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'11px', fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:'28px', padding:'7px 14px', background:'rgba(184,134,11,0.08)', borderRadius:'100px', border:'1px solid rgba(184,134,11,0.18)' }}>
                <Sparkles style={{ width:11, height:11 }} />
                {ct.eyebrow || 'AI-Powered School Matching — Free for Parents'}
              </div>
            </motion.div>

            <motion.h1 {...fade(0.12)} style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontWeight:700, fontSize:'clamp(3.5rem,7vw,var(--hero-h1-size,108px))', lineHeight:.90, letterSpacing:'-3px', color:'#0D1117', marginBottom:'28px' }}>
              {ct.h1Line1 || 'Find the'}
              <em className="text-shimmer" style={{ display:'block', fontStyle:'italic', fontSize:'1.06em', lineHeight:.88 }}>
                {ct.h1Italic || 'Perfect School'}
              </em>
              <span style={{ display:'block', color:'rgba(13,17,23,0.2)', fontSize:'.6em', fontWeight:400, fontStyle:'normal', letterSpacing:'-1px', lineHeight:1 }}>
                {ct.h1Line3 || 'for Your Child'}
              </span>
            </motion.h1>

            <motion.p {...fade(0.22)} style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(16px,2.2vw,19px)', fontWeight:300, color:'#4A5568', lineHeight:1.75, maxWidth:'500px', marginBottom:'40px' }}>
              {ct.subtext || <>Search, compare &amp; apply to{' '}
                <strong style={{ color:'#0D1117', fontWeight:600 }}>12,000+ verified schools</strong>
                {' '}across 35+ Indian cities — CBSE, ICSE, IB &amp; more.</>}
            </motion.p>

            {/* Search box */}
            <motion.form {...fade(0.30)} onSubmit={handleSearch} style={{ marginBottom:'32px' }}>
              <div className="border-glow" style={{ display:'flex', flexDirection:'column', background:'#fff', border:'1.5px solid rgba(13,17,23,0.12)', borderRadius:'14px', overflow:'hidden', maxWidth:'560px', boxShadow:'0 8px 40px rgba(13,17,23,0.09), 0 1px 3px rgba(13,17,23,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 18px', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
                  <Search style={{ width:'16px', height:'16px', color:'#B8860B', flexShrink:0 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder={ct.searchPlaceholder || 'School name, board, or keyword…'}
                    style={{ flex:1, border:'none', outline:'none', fontSize:'15px', fontFamily:'Inter,sans-serif', fontWeight:300, color:'#0D1117', background:'transparent', padding:'17px 0' }} />
                </div>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 18px', flex:1 }}>
                    <MapPin style={{ width:'14px', height:'14px', color:'#B8860B', flexShrink:0 }} />
                    <select value={city} onChange={e => setCity(e.target.value)}
                      style={{ flex:1, border:'none', outline:'none', fontSize:'14px', fontFamily:'Inter,sans-serif', color:city?'#0D1117':'#A0ADB8', background:'transparent', cursor:'pointer', padding:'15px 0', appearance:'none' }}>
                      <option value="">All Cities</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ background:'#B8860B', color:'#fff', border:'none', fontSize:'15px', fontWeight:600, fontFamily:'Inter,sans-serif', padding:'0 32px', height:'54px', cursor:'pointer', whiteSpace:'nowrap', transition:'background .2s, transform .1s', display:'flex', alignItems:'center', gap:'8px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#C9960D'; (e.currentTarget as HTMLElement).style.transform='scale(1.02)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='#B8860B'; (e.currentTarget as HTMLElement).style.transform='scale(1)' }}>
                    {ct.ctaPrimary || 'Search'} <ArrowRight style={{ width:14, height:14 }} />
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust badges */}
            <motion.div {...fade(0.38)} style={{ display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center', marginBottom:'28px' }}>
              {[
                { icon:<BadgeCheck style={{ width:14, height:14 }}/>, text:'12,000+ Verified Schools' },
                { icon:<Sparkles style={{ width:14, height:14 }}/>, text:'AI Recommendations' },
                { icon:<ArrowRight style={{ width:14, height:14 }}/>, text:'100% Free for Parents' },
              ].map(b => (
                <div key={b.text} style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:500, color:'#718096' }}>
                  <span style={{ color:'#B8860B' }}>{b.icon}</span>{b.text}
                </div>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div {...fade(0.44)} style={{ display:'inline-flex', alignItems:'center', gap:'14px', padding:'12px 18px', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(16px)', borderRadius:'12px', border:'1px solid rgba(13,17,23,0.08)', boxShadow:'0 4px 20px rgba(13,17,23,0.06)' }}>
              <div style={{ display:'flex' }}>
                {['P','R','A','S'].map((l,i) => (
                  <div key={i} style={{ width:'28px', height:'28px', borderRadius:'50%', background:`hsl(${i*45+30},35%,72%)`, border:'2px solid #fff', marginLeft:i>0?'-6px':'0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'11px', color:'#0D1117', position:'relative', zIndex:4-i }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ display:'flex', gap:'2px', marginBottom:'1px' }}>
                  {[1,2,3,4,5].map(s=><Star key={s} style={{ width:'10px', height:'10px', fill:'#B8860B', color:'#B8860B' }}/>)}
                </div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#718096', fontWeight:300 }}>
                  <strong style={{ color:'#0D1117', fontWeight:600 }}>1 Lakh+</strong> parents found their school
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — image with floating cards */}
          <motion.div initial={{ opacity:0, scale:.94, x:30 }} animate={{ opacity:1, scale:1, x:0 }} transition={{ duration:.85, delay:.15, ease:[.22,1,.36,1] }}
            style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {/* Rotating decorative rings */}
            <div style={{ position:'absolute', inset:'-24px', border:'1.5px solid rgba(184,134,11,0.13)', borderRadius:'32px', transform:'rotate(2deg)', pointerEvents:'none', animation:'orbFloat 12s ease-in-out infinite' }} />
            <div style={{ position:'absolute', inset:'-40px', border:'1px solid rgba(184,134,11,0.06)', borderRadius:'40px', transform:'rotate(-1.5deg)', pointerEvents:'none', animation:'orbFloat 18s ease-in-out infinite', animationDelay:'-6s' }} />

            <div style={{ width:'100%', aspectRatio:'4/3', borderRadius:'24px', overflow:'hidden', boxShadow:'0 40px 100px rgba(13,17,23,0.18), 0 8px 30px rgba(184,134,11,0.1)', border:'1px solid rgba(13,17,23,0.08)', position:'relative' }}>
              <img src={heroImage} alt="Happy students in school" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,17,23,0.35) 0%, transparent 55%)', pointerEvents:'none' }} />
              {/* Shimmer overlay */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)', backgroundSize:'200% auto', animation:'shimmerGold 4s linear infinite', pointerEvents:'none' }} />

              {/* Floating stat card — bottom left */}
              <motion.div className="float-card" style={{ position:'absolute', bottom:'20px', left:'20px', background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', borderRadius:'14px', padding:'14px 18px', boxShadow:'0 12px 40px rgba(13,17,23,0.18)', display:'flex', alignItems:'center', gap:'14px', border:'1px solid rgba(13,17,23,0.06)' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:'rgba(184,134,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <BadgeCheck style={{ width:'20px', height:'20px', color:'#B8860B' }} />
                </div>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'22px', color:'#0D1117', lineHeight:1 }}>12,000+</div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#718096', fontWeight:400, marginTop:'2px' }}>Verified Schools</div>
                </div>
              </motion.div>

              {/* AI badge — top right */}
              <div style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(184,134,11,0.94)', backdropFilter:'blur(8px)', borderRadius:'100px', padding:'8px 16px', fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:600, color:'#fff', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 20px rgba(184,134,11,0.35)', animation:'floatY 4s ease-in-out infinite' }}>
                <Sparkles style={{ width:12, height:12 }} /> AI Powered
              </div>

              {/* Rating — bottom right */}
              <div style={{ position:'absolute', bottom:'20px', right:'18px', background:'rgba(13,17,23,0.9)', backdropFilter:'blur(12px)', borderRadius:'12px', padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:'8px', animation:'floatY 5s ease-in-out infinite', animationDelay:'-2s' }}>
                <div style={{ display:'flex', gap:'2px' }}>
                  {[1,2,3,4,5].map(s=><Star key={s} style={{ width:'10px', height:'10px', fill:'#E8C547', color:'#E8C547' }}/>)}
                </div>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'rgba(250,247,242,0.75)', fontWeight:300 }}>4.8 avg rating</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'100px', background:'linear-gradient(to bottom, transparent, rgba(245,240,232,0.4))', pointerEvents:'none', zIndex:1 }} />
    </section>
  )
}
