'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, ArrowRight, BadgeCheck, Sparkles } from 'lucide-react'
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
    <section style={{ background: 'linear-gradient(160deg, #FAF7F2 55%, #F0EAD6 100%)', minHeight: '95vh', display: 'flex', alignItems: 'center', paddingTop: '72px', overflow: 'hidden', position: 'relative' }}>

      {/* Subtle texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.03) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, right:0, width:'600px', height:'600px', background:'radial-gradient(circle, rgba(184,134,11,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="container mx-auto" style={{ maxWidth:'1160px', padding:'0 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:'64px', alignItems:'center' }}>

          {/* ── Left ── */}
          <div>
            {/* Eyebrow */}
            <motion.div {...fade(0.1)}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#B8860B', marginBottom:'24px' }}>
                <span style={{ display:'block', width:'22px', height:'1px', background:'#B8860B' }} />
                AI-Powered School Matching — Free for Parents
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1 {...fade(0.18)} style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'80px', lineHeight:.96, letterSpacing:'-3px', color:'#0D1117', marginBottom:'22px' }}>
              Find the
              <em style={{ display:'block', fontStyle:'italic', color:'#B8860B', fontSize:'1.04em' }}>Perfect School</em>
              <span style={{ display:'block', color:'rgba(13,17,23,0.2)', fontSize:'.65em', fontWeight:400, fontStyle:'normal' }}>for Your Child</span>
            </motion.h1>

            {/* Sub */}
            <motion.p {...fade(0.26)} style={{ fontFamily:'Inter,sans-serif', fontSize:'15px', fontWeight:300, color:'#4A5568', lineHeight:1.75, maxWidth:'420px', marginBottom:'32px' }}>
              Search, compare &amp; apply to <strong style={{ color:'#0D1117', fontWeight:500 }}>12,000+ verified schools</strong> across 35+ Indian cities — CBSE, ICSE, IB &amp; Cambridge.
            </motion.p>

            {/* Search */}
            <motion.form {...fade(0.32)} onSubmit={handleSearch}>
              <div style={{ display:'flex', alignItems:'center', background:'#fff', border:'1px solid rgba(13,17,23,0.14)', borderRadius:'8px', overflow:'hidden', maxWidth:'480px', marginBottom:'14px', boxShadow:'0 2px 16px rgba(13,17,23,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, padding:'0 14px' }}>
                  <Search style={{ width:'15px', height:'15px', color:'#B8860B', opacity:.7, flexShrink:0 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="School name, board, or keyword…"
                    style={{ flex:1, border:'none', outline:'none', fontSize:'13px', fontFamily:'Inter,sans-serif', fontWeight:300, color:'#0D1117', background:'transparent', padding:'13px 0' }} />
                </div>
                <div style={{ width:'1px', background:'rgba(13,17,23,0.08)', alignSelf:'stretch', margin:'8px 0' }} />
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', minWidth:'140px' }}>
                  <MapPin style={{ width:'13px', height:'13px', color:'#B8860B', opacity:.6, flexShrink:0 }} />
                  <select value={city} onChange={e => setCity(e.target.value)}
                    style={{ flex:1, border:'none', outline:'none', fontSize:'12px', fontFamily:'Inter,sans-serif', color: city ? '#0D1117' : '#A0ADB8', background:'transparent', cursor:'pointer', padding:'13px 0', appearance:'none' }}>
                    <option value="">All Cities</option>
                    {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ background:'#B8860B', color:'#FAF7F2', border:'none', fontSize:'13px', fontWeight:600, fontFamily:'Inter,sans-serif', padding:'0 22px', height:'100%', minHeight:'50px', cursor:'pointer', whiteSpace:'nowrap', transition:'background .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='#C9960D'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='#B8860B'}>
                  Search →
                </button>
              </div>

              {/* Tags */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase', color:'#A0ADB8' }}>Popular:</span>
                {['CBSE Schools Delhi', 'IB Schools Mumbai', 'Boarding Schools', 'ICSE Bangalore'].map(t => (
                  <button key={t} type="button" onClick={() => router.push(`/schools?q=${encodeURIComponent(t)}`)} className="tag text-xs">{t}</button>
                ))}
              </div>
            </motion.form>

            {/* Trust row */}
            <motion.div {...fade(0.42)} style={{ display:'flex', alignItems:'center', gap:'20px', marginTop:'32px', paddingTop:'28px', borderTop:'1px solid rgba(13,17,23,0.07)' }}>
              <div style={{ display:'flex', gap:'-6px' }}>
                {['P','R','A','M'].map((l, i) => (
                  <div key={l} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#B8860B', border:'2px solid #FAF7F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#FAF7F2', fontFamily:'Cormorant Garamond,serif', marginLeft: i > 0 ? '-8px' : '0', zIndex: 4 - i }}>
                    {l}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#4A5568', fontWeight:300 }}>
                <strong style={{ color:'#0D1117', fontWeight:500 }}>1 lakh+</strong> parents found their school this year
              </div>
            </motion.div>
          </div>

          {/* ── Right: Cards ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'14px', position:'relative' }}>

            {/* Verified school card */}
            <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:.4, duration:.7, ease:[.22,1,.36,1] }}
              className="animate-float" style={{ animationDelay:'0s' }}>
              <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'14px', padding:'20px', boxShadow:'0 4px 20px rgba(13,17,23,0.08)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'14px' }}>
                  <div style={{ width:'46px', height:'46px', borderRadius:'10px', background:'#F5F0E8', border:'1px solid rgba(13,17,23,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>🏛</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'15px', color:'#0D1117', marginBottom:'2px' }}>DPS R.K. Puram</div>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8', display:'flex', alignItems:'center', gap:'4px' }}>
                      <MapPin style={{ width:'10px', height:'10px' }} /> New Delhi
                    </div>
                  </div>
                  <span className="badge-green" style={{ fontSize:'10px', flexShrink:0 }}>
                    <BadgeCheck style={{ width:'10px', height:'10px' }} /> Verified
                  </span>
                </div>
                <div style={{ display:'flex', gap:'2px', marginBottom:'12px' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width:'12px', height:'12px', fill:'#B8860B', color:'#B8860B' }} />)}
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8', marginLeft:'5px' }}>4.9 (420 reviews)</span>
                </div>
                <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
                  <span className="badge-gold">CBSE</span>
                  <span className="badge-light">Co-Ed</span>
                  <span className="badge-light">Day School</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'12px', borderTop:'1px solid rgba(13,17,23,0.06)' }}>
                  <span className="badge-ink">★ Featured</span>
                  <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'16px', color:'#0D1117' }}>
                    ₹4,500<span style={{ fontSize:'11px', color:'#A0ADB8', fontFamily:'Inter,sans-serif', fontWeight:300 }}>/mo</span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* AI Match card */}
            <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:.55, duration:.7, ease:[.22,1,.36,1] }}
              className="animate-float" style={{ animationDelay:'2s' }}>
              <div style={{ background:'#FDFAF0', border:'1px solid rgba(184,134,11,0.22)', borderRadius:'14px', padding:'18px', boxShadow:'0 4px 16px rgba(184,134,11,0.1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <Sparkles style={{ width:'14px', height:'14px', color:'#B8860B' }} />
                  <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'14px', color:'#0D1117' }}>AI Match Found</span>
                </div>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8', marginBottom:'12px' }}>Based on your child's profile &amp; preferences</p>
                {[
                  { name: 'The Cathedral School', pct: '98%' },
                  { name: 'Bombay Scottish',      pct: '95%' },
                  { name: 'Podar International',  pct: '91%' },
                ].map((s, i) => (
                  <div key={s.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom: i < 2 ? '1px solid rgba(13,17,23,0.05)' : 'none' }}>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#4A5568', fontWeight:400 }}>{s.name}</span>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'14px', color:'#B8860B' }}>{s.pct}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Application sent */}
            <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:.7, duration:.7, ease:[.22,1,.36,1] }}>
              <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'12px', padding:'14px 18px', boxShadow:'0 2px 12px rgba(13,17,23,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#E8F5E8', border:'1px solid rgba(26,92,26,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>✓</div>
                  <div>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:500, color:'#0D1117' }}>Application Sent!</div>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8' }}>The Doon School · Class 8 · 2026–27</div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
