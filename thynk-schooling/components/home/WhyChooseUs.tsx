'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'

const CARDS = [
  { icon: '🔍', title: 'Smart Search',         desc: 'Filter by board, city, fee, medium and 20+ parameters in seconds.', accent: '#B8860B' },
  { icon: '⚖️', title: 'Side-by-Side Compare', desc: 'Compare up to 4 schools on fees, ratings, infrastructure and more.', accent: '#0A5F55' },
  { icon: '🤖', title: 'AI Recommendations',   desc: 'Get personalised school suggestions based on your child\'s needs.',  accent: '#7A6A52' },
  { icon: '📋', title: 'One-Click Apply',       desc: 'Submit admission enquiries to multiple schools simultaneously.',    accent: '#B8860B' },
  { icon: '👨‍💼', title: 'Expert Counselling',  desc: 'Free 1-on-1 sessions with certified school admission counsellors.', accent: '#0A5F55' },
  { icon: '✅', title: 'Verified Listings',     desc: 'Every school is verified with real reviews and authentic data.',    accent: '#7A6A52' },
]

export function WhyChooseUs() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background: 'var(--why-bg,#F5F0E8)', padding: 'clamp(80px,10vw,120px) 0', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Big decorative text bg */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(100px,18vw,260px)', fontWeight: 700, color: 'rgba(13,17,23,0.025)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', letterSpacing: '-8px', lineHeight: 1 }}>
        THYNK
      </div>

      <div style={{ maxWidth: 'var(--container-width,1600px)', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative' }}>

        {/* Header — split layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 'clamp(40px,6vw,100px)', alignItems: 'flex-end', marginBottom: 'clamp(48px,6vw,80px)' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: .6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 20 }}>
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
              Why Parents Choose Us
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontWeight: 700, fontSize: 'var(--why-title-size,clamp(2.4rem,5.5vw,4.5rem))', color: '#0D1117', lineHeight: .92, letterSpacing: '-2px', margin: 0 }}>
              {ct.whyTitle || 'Everything You Need,'}
              <em style={{ display: 'block', fontStyle: 'italic', color: '#B8860B' }}>Nothing You Don&apos;t</em>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: .6, delay: .1 }}
            style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,1.6vw,17px)', color: '#4A5568', lineHeight: 1.75, fontWeight: 300, alignSelf: 'flex-end', paddingBottom: '4px' }}>
            We built every feature based on feedback from real Indian parents. Not generic software — a tool made specifically for finding the right school for your child in India.
          </motion.p>
        </div>

        {/* Cards grid — 3 col on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(12px,2vw,20px)' }}>
          {CARDS.map((c, i) => (
            <motion.div key={c.title}
              initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: .5 }}
              style={{ background: 'var(--why-card-bg,#fff)', borderRadius: 'clamp(14px,1.8vw,20px)', padding: 'clamp(24px,3vw,40px)', border: '1px solid rgba(13,17,23,0.07)', boxShadow: '0 2px 16px rgba(13,17,23,0.04)', transition: 'all .25s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-5px)'
                el.style.boxShadow = `0 16px 48px rgba(184,134,11,0.12)`
                el.style.borderColor = 'rgba(184,134,11,0.22)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'none'
                el.style.boxShadow = '0 2px 16px rgba(13,17,23,0.04)'
                el.style.borderColor = 'rgba(13,17,23,0.07)'
              }}>
              {/* Accent corner */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `radial-gradient(circle at top right, ${c.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ fontSize: 'clamp(28px,4vw,40px)', marginBottom: 18, display: 'inline-block' }}>{c.icon}</div>
              <div style={{ width: '28px', height: '2px', background: c.accent, borderRadius: '2px', marginBottom: 14 }} />
              <h3 style={{ fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize: 'var(--why-card-title-size,clamp(17px,1.8vw,22px))', fontWeight: 700, color: '#0D1117', marginBottom: 10, lineHeight: 1.1 }}>{c.title}</h3>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'var(--why-card-desc-size,clamp(13px,1.2vw,15px))', color: '#4A5568', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
