'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'

function Counter({ to, suffix='' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const dur = 1600, start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to])
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

const STATS = [
  { icon:'🏫', num:12000, suffix:'+', label:'Verified Schools' },
  { icon:'👨‍👩‍👧', label:'Happy Parents', custom:'1 Lakh+' },
  { icon:'🏙️', num:35, suffix:'+', label:'Indian Cities' },
  { icon:'⭐', num:98, suffix:'%', label:'Satisfaction Rate' },
  { icon:'🏆', label:'Average Rating', custom:'4.8 ★' },
]

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .2 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background:'#0D1117', padding:'clamp(48px,7vw,80px) 0', position:'relative', overflow:'hidden' }}>
      {/* animated mesh */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sg1" cx="50%" cy="50%"><stop stopColor="#B8860B" stopOpacity=".07"/><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
          <filter id="sblur"><feGaussianBlur stdDeviation="60"/></filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg1)" filter="url(#sblur)"/>
      </svg>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'0 clamp(24px,5vw,80px)', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'clamp(12px,2vw,32px)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:28 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ delay:i*.1, duration:.55, ease:[.22,1,.36,1] }}
              style={{ textAlign:'center', padding:'clamp(20px,3vw,36px) 8px', position:'relative' }}>
              {i < 4 && <div style={{ position:'absolute', right:0, top:'22%', height:'56%', width:'1px', background:'rgba(255,255,255,0.06)' }}/>}
              <div style={{ fontSize:'clamp(24px,3.5vw,36px)', marginBottom:12, display:'inline-block', animation:`floatY ${3.5+i*.4}s ease-in-out infinite`, animationDelay:`${i*-.6}s` }}>{s.icon}</div>
              <div style={{ fontFamily:'"Cormorant Garamond",Georgia,serif', fontWeight:700, fontSize:'clamp(28px,4.5vw,52px)', color:'#FAF7F2', lineHeight:1, marginBottom:8 }}>
                {inView && (s.custom || (s.num !== undefined ? <Counter to={s.num} suffix={s.suffix}/> : s.custom))}
              </div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(10px,1vw,12px)', color:'rgba(250,247,242,0.4)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.12em' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
