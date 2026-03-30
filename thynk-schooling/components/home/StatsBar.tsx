'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS_DEFAULT = [
  { value: '12,000+', label: 'Verified Schools'  },
  { value: '1 Lakh+', label: 'Happy Parents'     },
  { value: '35+',     label: 'Indian Cities'     },
  { value: '98%',     label: 'Satisfaction Rate' },
  { value: '4.8★',   label: 'Average Rating'    },
]

import { useContent } from '@/hooks/useContent'

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .3 })
  const raw = useContent('home')
  const ct = raw ?? {}
  const STATS = [
    { value: ct.stat1Num   || '12,000+', label: ct.stat1Label || 'Verified Schools'  },
    { value: ct.stat2Num   || '1 Lakh+', label: ct.stat2Label || 'Happy Parents'     },
    { value: ct.stat3Num   || '35+',     label: ct.stat3Label || 'Indian Cities'     },
    { value: ct.stat4Num   || '98%',     label: ct.stat4Label || 'Satisfaction Rate' },
    { value: ct.stat5Num   || '4.8★',   label: ct.stat5Label || 'Average Rating'    },
  ]
  return (
    <section ref={ref} style={{ background:'var(--stats-bg,#F5F0E8)', borderTop:'1px solid rgba(13,17,23,0.07)', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:16 }} animate={inView ? { opacity:1, y:0 } : {}}
              transition={{ delay: i*.09, duration:.5 }}
              style={{ padding:'28px 0', textAlign:'center', borderRight: i < 4 ? '1px solid rgba(13,17,23,0.06)' : 'none' }}>
              <div className="stat-number" style={{ fontSize:'var(--stat-num-size,38px)', color:'var(--stat-num-color,#0D1117)', marginBottom:'5px' }}>{s.value}</div>
              <div className="stat-label" style={{ fontSize:'var(--stat-label-size,12px)', color:'var(--stat-label-color,#718096)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
