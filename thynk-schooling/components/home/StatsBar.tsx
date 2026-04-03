'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .3 })
  const ct = useContent('home') ?? {}

  const STATS = [
    { value: ct.stat1Num || '12,000+', label: ct.stat1Label || 'Verified Schools',  icon: '🏫' },
    { value: ct.stat2Num || '1 Lakh+', label: ct.stat2Label || 'Happy Parents',      icon: '👨‍👩‍👧' },
    { value: ct.stat3Num || '35+',     label: ct.stat3Label || 'Indian Cities',      icon: '🏙️' },
    { value: ct.stat4Num || '98%',     label: ct.stat4Label || 'Satisfaction Rate',  icon: '⭐' },
    { value: ct.stat5Num || '4.8★',   label: ct.stat5Label || 'Average Rating',     icon: '🏆' },
  ]

  return (
    <section ref={ref} style={{ background: 'var(--stats-bg,#0D1117)', padding: 'clamp(40px,6vw,72px) 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(184,134,11,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(184,134,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 'var(--container-width,1600px)', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'clamp(16px,3vw,40px)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: .55 }}
              style={{ textAlign: 'center', padding: 'clamp(16px,2vw,28px) 8px', position: 'relative' }}>
              {/* Divider between items */}
              {i < 4 && <div style={{ position: 'absolute', right: 0, top: '20%', height: '60%', width: '1px', background: 'rgba(255,255,255,0.07)' }} />}
              <div style={{ fontSize: 'clamp(22px,3vw,32px)', marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize: 'var(--stat-num-size,clamp(28px,4vw,44px))', fontWeight: 700, color: '#FAF7F2', lineHeight: 1, marginBottom: 6 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'var(--font-sans,Inter),sans-serif', fontSize: 'var(--stat-label-size,clamp(10px,1.1vw,13px))', color: 'rgba(250,247,242,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
