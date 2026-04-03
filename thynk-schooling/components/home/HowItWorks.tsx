'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { num: '01', title: 'Search Schools',    desc: 'Use our smart filters to find schools by city, board, fees, medium and 20+ more criteria.',   icon: '🔎', color: '#B8860B' },
  { num: '02', title: 'Compare & Review',  desc: 'Place schools side-by-side. Read authentic parent reviews and check verified ratings.',         icon: '📊', color: '#0A5F55' },
  { num: '03', title: 'Get Counselled',    desc: 'Book a free 30-minute session with our expert counsellors to shortlist the right school.',      icon: '🧑‍💼', color: '#7A6A52' },
  { num: '04', title: 'Apply & Enrol',     desc: 'Submit enquiries to multiple schools in one click and track all applications in one place.',    icon: '✅', color: '#B8860B' },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background: 'var(--how-bg,#FAF7F2)', padding: 'clamp(80px,10vw,120px) 0', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Diagonal stripe accent */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(135deg, transparent 49%, rgba(184,134,11,0.03) 50%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 'var(--container-width,1600px)', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.65fr)', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }}>

          {/* Left: heading + CTA */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: .6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 20 }}>
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
              How It Works
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontWeight: 700, fontSize: 'var(--how-title-size,clamp(2.4rem,5.5vw,4.5rem))', color: '#0D1117', lineHeight: .92, letterSpacing: '-2px', marginBottom: 20 }}>
              {ct.howTitle || 'Admission'}
              <em style={{ display: 'block', fontStyle: 'italic', color: '#B8860B' }}>Made Simple</em>
            </h2>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,1.5vw,17px)', color: '#4A5568', lineHeight: 1.75, fontWeight: 300, marginBottom: 36 }}>
              From searching to enrolment — we guide you at every step. Completely free for parents, no hidden fees, ever.
            </p>

            {/* Mini progress indicator */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: 36 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ height: '3px', flex: 1, borderRadius: '99px', background: i === 0 ? '#B8860B' : 'rgba(13,17,23,0.1)' }} />
              ))}
            </div>

            <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: '#0D1117', color: '#FAF7F2', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B8860B' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0D1117' }}>
              Start Your Search <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </motion.div>

          {/* Right: steps with connecting line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px,2vw,20px)', position: 'relative' }}>
            {/* Vertical connector line */}
            <div style={{ position: 'absolute', left: 'calc(clamp(22px,2.5vw,28px))', top: '36px', bottom: '36px', width: '1px', background: 'linear-gradient(to bottom, rgba(184,134,11,0.3), rgba(184,134,11,0.08))', pointerEvents: 'none' }} />

            {STEPS.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1, duration: .5 }}
                style={{ display: 'flex', gap: 'clamp(16px,2vw,24px)', alignItems: 'flex-start', background: '#fff', borderRadius: 'clamp(12px,1.5vw,16px)', padding: 'clamp(18px,2vw,28px)', border: '1px solid rgba(13,17,23,0.07)', boxShadow: '0 2px 12px rgba(13,17,23,0.04)', transition: 'all .2s', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(184,134,11,0.1)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(184,134,11,0.2)` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,17,23,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,17,23,0.07)' }}>
                <div style={{ width: 'clamp(44px,5vw,56px)', height: 'clamp(44px,5vw,56px)', borderRadius: 'clamp(10px,1.2vw,14px)', background: `${step.color}12`, border: `1.5px solid ${step.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(20px,2.5vw,26px)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: '.12em', background: `${step.color}12`, padding: '2px 6px', borderRadius: '4px' }}>{step.num}</span>
                    <h3 style={{ fontFamily: 'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize: 'var(--how-step-title-size,clamp(16px,1.8vw,21px))', fontWeight: 700, color: '#0D1117', margin: 0 }}>{step.title}</h3>
                  </div>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'var(--how-step-desc-size,clamp(12px,1.2vw,14px))', color: '#4A5568', lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
