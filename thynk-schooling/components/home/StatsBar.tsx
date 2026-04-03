'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'
import { FloatingOrbs, CountUp } from './HomeVisualEffects'

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .3 })
  const ct = useContent('home') ?? {}

  const STATS = [
    { raw: 12000, display: ct.stat1Num || '12,000+', suffix: '+', label: ct.stat1Label || 'Verified Schools',  icon: '🏫', countTo: 12000 },
    { raw: 100000, display: ct.stat2Num || '1 Lakh+', suffix: '+', label: ct.stat2Label || 'Happy Parents',    icon: '👨‍👩‍👧', countTo: 100000 },
    { raw: 35,    display: ct.stat3Num || '35+',     suffix: '+', label: ct.stat3Label || 'Indian Cities',    icon: '🏙️', countTo: 35 },
    { raw: 98,    display: ct.stat4Num || '98%',     suffix: '%', label: ct.stat4Label || 'Satisfaction Rate',icon: '⭐', countTo: 98 },
    { raw: 48,    display: ct.stat5Num || '4.8★',   suffix: '★', label: ct.stat5Label || 'Average Rating',   icon: '🏆', countTo: 48 },
  ]

  return (
    <section ref={ref} style={{ background: '#0D1117', padding: 'clamp(48px,7vw,80px) 0', position: 'relative', overflow: 'hidden' }}>
      <FloatingOrbs variant="dark" />
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.07) 1px, transparent 1px)', backgroundSize:'30px 30px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'200px', background:'radial-gradient(ellipse, rgba(184,134,11,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:'var(--container-width,1600px)', margin:'0 auto', padding:'0 clamp(20px,5vw,80px)', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'clamp(12px,2vw,32px)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:24 }} animate={inView ? { opacity:1, y:0 } : {}}
              transition={{ delay: i * 0.1, duration:.55 }}
              style={{ textAlign:'center', padding:'clamp(20px,3vw,36px) 8px', position:'relative' }}>
              {i < 4 && <div style={{ position:'absolute', right:0, top:'25%', height:'50%', width:'1px', background:'rgba(255,255,255,0.06)' }} />}

              <div style={{ fontSize:'clamp(24px,3vw,34px)', marginBottom:10, filter:'grayscale(0)', display:'inline-block', animation:'floatY 4s ease-in-out infinite', animationDelay:`${i*0.5}s` }}>{s.icon}</div>

              <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(28px,4.5vw,52px)', color:'#FAF7F2', lineHeight:1, marginBottom:8 }}>
                {inView && ct[`stat${i+1}Num`] ? s.display : inView ? (
                  i === 4
                    ? <><CountUp to={48} />{' '}★</>
                    : i === 1
                      ? <>1L+</>
                      : <CountUp to={s.countTo} suffix={s.suffix} />
                ) : '0'}
              </div>

              <div style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(10px,1.1vw,12px)', color:'rgba(250,247,242,0.4)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.12em' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
