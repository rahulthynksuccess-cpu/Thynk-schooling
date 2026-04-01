'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, BadgeCheck, Sparkles, ArrowRight } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useContent } from '@/hooks/useContent'

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] },
})

// Default hero image — editable via Content admin
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=85&auto=format&fit=crop'

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city,  setCity]  = useState('')
  const { options: cities } = useDropdown('city')
  const raw = useContent('home')
  const ct = raw ?? {}

  const heroImage = ct.heroImage || DEFAULT_HERO_IMAGE

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (city)  p.set('city', city)
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
      {/* Dot grid texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.04) 1px, transparent 1px)', backgroundSize:'30px 30px', pointerEvents:'none', zIndex:0 }} />
      {/* Gold radial glow top-right */}
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'700px', height:'700px', background:'radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ width:'100%', maxWidth:'var(--container-width,1400px)', margin:'0 auto', padding:'60px clamp(20px,5vw,80px)', position:'relative', zIndex:1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)',
          gap: 'clamp(40px,6vw,100px)',
          alignItems: 'center',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Eyebrow */}
            <motion.div {...fade(0.05)}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--hero-eyebrow-size,11px)', fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--hero-eyebrow-color,#B8860B)', marginBottom:'28px' }}>
                <span style={{ display:'block', width:'28px', height:'1.5px', background:'var(--hero-eyebrow-color,#B8860B)', borderRadius:'2px' }} />
                {ct.eyebrow || 'AI-Powered School Matching — Free for Parents'}
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1 {...fade(0.12)} style={{
              fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif',
              fontWeight: 700,
              fontSize: 'clamp(3.5rem, 7vw, var(--hero-h1-size,108px))',
              lineHeight: .90,
              letterSpacing: '-3px',
              color: 'var(--hero-h1-color,#0D1117)',
              marginBottom: '28px',
            }}>
              {ct.h1Line1 || 'Find the'}
              <em style={{ display:'block', fontStyle:'italic', color:'var(--hero-italic-color,#B8860B)', fontSize:'1.06em', lineHeight:.88 }}>
                {ct.h1Italic || 'Perfect School'}
              </em>
              <span style={{ display:'block', color:'rgba(13,17,23,0.22)', fontSize:'.6em', fontWeight:400, fontStyle:'normal', letterSpacing:'-1px', lineHeight:1 }}>
                {ct.h1Line3 || 'for Your Child'}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p {...fade(0.22)} style={{
              fontFamily: 'var(--font-sans,Inter),sans-serif',
              fontSize: 'clamp(16px,2.2vw,var(--hero-sub-size,19px))',
              fontWeight: 'var(--hero-sub-weight,300)' as any,
              color: 'var(--hero-sub-color,#4A5568)',
              lineHeight: 1.75,
              maxWidth: '500px',
              marginBottom: '40px',
            }}>
              {ct.subtext || <>Search, compare &amp; apply to{' '}
                <strong style={{ color:'var(--ink,#0D1117)', fontWeight:600 }}>12,000+ verified schools</strong>
                {' '}across 35+ Indian cities — CBSE, ICSE, IB &amp; more.</>}
            </motion.p>

            {/* Search */}
            <motion.form {...fade(0.30)} onSubmit={handleSearch} style={{ marginBottom:'32px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                border: '1.5px solid rgba(13,17,23,0.13)',
                borderRadius: '14px',
                overflow: 'hidden',
                maxWidth: '560px',
                boxShadow: '0 4px 24px rgba(13,17,23,0.07), 0 1px 3px rgba(13,17,23,0.06)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 18px', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
                  <Search style={{ width:'16px', height:'16px', color:'#B8860B', flexShrink:0 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder={ct.searchPlaceholder || 'School name, board, or keyword…'}
                    style={{ flex:1, border:'none', outline:'none', fontSize:'15px', fontFamily:'var(--font-sans,Inter),sans-serif', fontWeight:300, color:'#0D1117', background:'transparent', padding:'17px 0' }} />
                </div>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 18px', flex:1 }}>
                    <MapPin style={{ width:'14px', height:'14px', color:'#B8860B', flexShrink:0 }} />
                    <select value={city} onChange={e => setCity(e.target.value)}
                      style={{ flex:1, border:'none', outline:'none', fontSize:'14px', fontFamily:'var(--font-sans,Inter),sans-serif', color: city ? '#0D1117' : '#A0ADB8', background:'transparent', cursor:'pointer', padding:'15px 0', appearance:'none' }}>
                      <option value="">All Cities</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ background:'var(--btn-gold-bg,#B8860B)', color:'var(--btn-gold-color,#fff)', border:'none', fontSize:'15px', fontWeight:600, fontFamily:'var(--font-sans,Inter),sans-serif', padding:'0 32px', height:'54px', cursor:'pointer', whiteSpace:'nowrap', transition:'background .2s', display:'flex', alignItems:'center', gap:'8px' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--gold-2,#C9960D)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='var(--btn-gold-bg,#B8860B)'}>
                    {ct.ctaPrimary || 'Search'} <ArrowRight style={{ width:14, height:14 }} />
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust badges */}
            <motion.div {...fade(0.38)} style={{ display:'flex', flexWrap:'wrap', gap:'20px', alignItems:'center' }}>
              {[
                { icon: <BadgeCheck style={{ width:15, height:15 }} />, text:'12,000+ Verified Schools' },
                { icon: <Sparkles   style={{ width:15, height:15 }} />, text:'AI Recommendations' },
                { icon: <ArrowRight style={{ width:15, height:15 }} />, text:'100% Free for Parents' },
              ].map(b => (
                <div key={b.text} style={{ display:'flex', alignItems:'center', gap:'7px', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'13px', fontWeight:500, color:'var(--ink-muted,#718096)' }}>
                  <span style={{ color:'var(--gold,#B8860B)' }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — editable image ── */}
          <motion.div
            initial={{ opacity:0, scale:.95, x:30 }}
            animate={{ opacity:1, scale:1, x:0 }}
            transition={{ duration:.8, delay:.2, ease:[.22,1,.36,1] }}
            style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            {/* Decorative ring */}
            <div style={{ position:'absolute', inset:'-20px', border:'1.5px solid rgba(184,134,11,0.12)', borderRadius:'32px', transform:'rotate(2deg)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', inset:'-36px', border:'1px solid rgba(184,134,11,0.06)', borderRadius:'40px', transform:'rotate(-1deg)', pointerEvents:'none' }} />

            {/* Main image */}
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(13,17,23,0.14), 0 8px 24px rgba(184,134,11,0.08)',
              border: '1px solid rgba(13,17,23,0.08)',
              position: 'relative',
            }}>
              <img
                src={heroImage}
                alt="Happy students in school"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
              {/* Gradient overlay */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,17,23,0.25) 0%, transparent 50%)', pointerEvents:'none' }} />

              {/* Floating stat card */}
              <div style={{
                position:'absolute', bottom:'20px', left:'20px',
                background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)',
                borderRadius:'14px', padding:'14px 18px',
                boxShadow:'0 8px 32px rgba(13,17,23,0.14)',
                display:'flex', alignItems:'center', gap:'14px',
                border:'1px solid rgba(13,17,23,0.06)',
              }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:'rgba(184,134,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <BadgeCheck style={{ width:'20px', height:'20px', color:'#B8860B' }} />
                </div>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'22px', color:'#0D1117', lineHeight:1 }}>12,000+</div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#718096', fontWeight:400, marginTop:'2px' }}>Verified Schools</div>
                </div>
              </div>

              {/* Floating badge top-right */}
              <div style={{
                position:'absolute', top:'20px', right:'20px',
                background:'rgba(184,134,11,0.92)', backdropFilter:'blur(8px)',
                borderRadius:'100px', padding:'7px 15px',
                fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:600, color:'#fff',
                display:'flex', alignItems:'center', gap:'6px',
                boxShadow:'0 4px 16px rgba(184,134,11,0.3)',
              }}>
                <Sparkles style={{ width:12, height:12 }} /> AI Powered
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'80px', background:'linear-gradient(to bottom, transparent, rgba(245,240,232,0.3))', pointerEvents:'none' }} />
    </section>
  )
}
