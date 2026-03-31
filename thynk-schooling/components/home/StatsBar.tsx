'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .3 })
  const ct = useContent('home') ?? {}

  const STATS = [
    { value: ct.stat1Num || '12,000+', label: ct.stat1Label || 'Verified Schools',   icon: '🏫' },
    { value: ct.stat2Num || '1 Lakh+', label: ct.stat2Label || 'Happy Parents',       icon: '👨‍👩‍👧' },
    { value: ct.stat3Num || '35+',     label: ct.stat3Label || 'Indian Cities',       icon: '🏙️' },
    { value: ct.stat4Num || '98%',     label: ct.stat4Label || 'Satisfaction Rate',   icon: '⭐' },
    { value: ct.stat5Num || '4.8★',   label: ct.stat5Label || 'Average Rating',      icon: '🏆' },
  ]

  return (
    <section ref={ref} style={{ background:'var(--stats-bg,#F5F0E8)', padding:'clamp(40px,6vw,72px) 0', borderTop:'1px solid rgba(13,17,23,0.06)', borderBottom:'1px solid rgba(13,17,23,0.06)' }}>
      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 clamp(20px,5vw,60px)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'clamp(16px,3vw,40px)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:16 }} animate={inView ? { opacity:1, y:0 } : {}}
              transition={{ delay: i * 0.08, duration:.5 }}
              style={{ textAlign:'center', padding:'clamp(16px,2vw,28px) 8px' }}>
              <div style={{ fontSize:'clamp(24px,3vw,36px)', marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize:'var(--stat-num-size,clamp(28px,4vw,44px))', fontWeight:700, color:'var(--stat-num-color,#0D1117)', lineHeight:1, marginBottom:6 }}>
                {s.value}
              </div>
              <div style={{ fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--stat-label-size,clamp(11px,1.2vw,14px))', color:'var(--stat-label-color,#718096)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.08em' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
