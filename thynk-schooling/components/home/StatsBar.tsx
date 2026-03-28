'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { value: '12,000+', label: 'Verified Schools'  },
  { value: '1 Lakh+', label: 'Happy Parents'     },
  { value: '35+',     label: 'Indian Cities'     },
  { value: '98%',     label: 'Satisfaction Rate' },
  { value: '4.8★',   label: 'Average Rating'    },
]

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .3 })
  return (
    <section ref={ref} style={{ background:'#F5F0E8', borderTop:'1px solid rgba(13,17,23,0.07)', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:16 }} animate={inView ? { opacity:1, y:0 } : {}}
              transition={{ delay: i*.09, duration:.5 }}
              style={{ padding:'28px 0', textAlign:'center', borderRight: i < 4 ? '1px solid rgba(13,17,23,0.06)' : 'none' }}>
              <div className="stat-number" style={{ fontSize:'38px', marginBottom:'5px' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
