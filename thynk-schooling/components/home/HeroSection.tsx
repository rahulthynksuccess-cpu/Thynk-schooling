'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, ArrowRight, BadgeCheck, Sparkles } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] },
})

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city,  setCity]  = useState('')
  const { options: cities } = useDropdown('city')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (city)  p.set('city', city)
    router.push(`/schools?${p.toString()}`)
  }

  return (
    <section style={{
      background: 'linear-gradient(160deg, var(--hero-bg,#FAF7F2) 55%, var(--hero-bg-grad,#F0EAD6) 100%)',
      minHeight: '95vh', display: 'flex', alignItems: 'center',
      paddingTop: '72px', overflow: 'hidden', position: 'relative',
    }}>
      {/* Texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.03) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, right:0, width:'600px', height:'600px', background:'radial-gradient(circle, rgba(184,134,11,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="container" style={{ width:'100%', padding:'0 24px', maxWidth:'1200px', margin:'0 auto' }}>
        {/* Two-col on desktop, single col on mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:'40px', alignItems:'center' }}>

          {/* Left / Main */}
          <div style={{ maxWidth:'680px' }}>

            {/* Eyebrow */}
            <motion.div {...fade(0.1)}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--hero-eyebrow-size,11px)', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--hero-eyebrow-color,#B8860B)', marginBottom:'24px' }}>
                <span style={{ display:'block', width:'22px', height:'1px', background:'var(--hero-eyebrow-color,#B8860B)' }} />
                AI-Powered School Matching — Free for Parents
              </div>
            </motion.div>

            {/* H1 — uses CSS var so theme controller works */}
            <motion.h1 {...fade(0.18)} style={{
              fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif',
              fontWeight: 700,
              fontSize: 'clamp(3rem, 8vw, var(--hero-h1-size,96px))',
              lineHeight: .94,
              letterSpacing: '-3px',
              color: 'var(--hero-h1-color,#0D1117)',
              marginBottom: '24px',
            }}>
              Find the
              <em style={{ display:'block', fontStyle:'italic', color:'var(--hero-italic-color,#B8860B)', fontSize:'1.04em' }}>Perfect School</em>
              <span style={{ display:'block', color:'rgba(13,17,23,0.2)', fontSize:'.62em', fontWeight:400, fontStyle:'normal', letterSpacing:'-1px' }}>for Your Child</span>
            </motion.h1>

            {/* Sub */}
            <motion.p {...fade(0.26)} style={{
              fontFamily: 'var(--font-sans,Inter),sans-serif',
              fontSize: 'clamp(15px, 2vw, var(--hero-sub-size,17px))',
              fontWeight: 'var(--hero-sub-weight,300)' as any,
              color: 'var(--hero-sub-color,#4A5568)',
              lineHeight: 1.75, maxWidth: '460px', marginBottom: '36px',
            }}>
              Search, compare &amp; apply to{' '}
              <strong style={{ color:'var(--ink,#0D1117)', fontWeight:500 }}>12,000+ verified schools</strong>{' '}
              across 35+ Indian cities — CBSE, ICSE, IB &amp; Cambridge.
            </motion.p>

            {/* Search bar */}
            <motion.form {...fade(0.32)} onSubmit={handleSearch} style={{ marginBottom:'20px' }}>
              <div style={{
                display:'flex', flexDirection:'column', gap:'8px',
                background:'#fff', border:'1px solid rgba(13,17,23,0.14)',
                borderRadius:'10px', overflow:'hidden',
                maxWidth:'520px', boxShadow:'0 2px 16px rgba(13,17,23,0.06)',
              }}>
                {/* Search input row */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 16px', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
                  <Search style={{ width:'16px', height:'16px', color:'#B8860B', opacity:.7, flexShrink:0 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="School name, board, or keyword…"
                    style={{ flex:1, border:'none', outline:'none', fontSize:'14px', fontFamily:'var(--font-sans,Inter),sans-serif', fontWeight:300, color:'#0D1117', background:'transparent', padding:'15px 0' }} />
                </div>
                {/* City + button row */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 16px', flex:1 }}>
                    <MapPin style={{ width:'14px', height:'14px', color:'#B8860B', opacity:.6, flexShrink:0 }} />
                    <select value={city} onChange={e => setCity(e.target.value)}
                      style={{ flex:1, border:'none', outline:'none', fontSize:'13px', fontFamily:'var(--font-sans,Inter),sans-serif', color: city ? '#0D1117' : '#A0ADB8', background:'transparent', cursor:'pointer', padding:'14px 0', appearance:'none' }}>
                      <option value="">All Cities</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ background:'var(--btn-gold-bg,#B8860B)', color:'var(--btn-gold-color,#fff)', border:'none', fontSize:'14px', fontWeight:600, fontFamily:'var(--font-sans,Inter),sans-serif', padding:'0 28px', height:'50px', cursor:'pointer', whiteSpace:'nowrap', transition:'background .2s', borderRadius:'0 0 10px 0' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--gold-2,#C9960D)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='var(--btn-gold-bg,#B8860B)'}>
                    Search →
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust badges */}
            <motion.div {...fade(0.4)} style={{ display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center' }}>
              {[
                { icon: <BadgeCheck style={{ width:14, height:14 }} />, text:'12,000+ Verified Schools' },
                { icon: <Sparkles style={{ width:14, height:14 }} />, text:'AI Recommendations' },
                { icon: <ArrowRight style={{ width:14, height:14 }} />, text:'100% Free for Parents' },
              ].map(b => (
                <div key={b.text} style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'12px', fontWeight:500, color:'var(--ink-muted,#718096)' }}>
                  <span style={{ color:'var(--gold,#B8860B)' }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
