'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { value: '12,000+', label: 'Verified Schools',  color: '#D4AF37' },
  { value: '1 Lakh+', label: 'Happy Parents',     color: '#7DC28F' },
  { value: '35+',     label: 'Indian Cities',     color: '#D4AF37' },
  { value: '98%',     label: 'Satisfaction Rate', color: '#7DC28F' },
  { value: '4.8★',   label: 'Average Rating',    color: '#D4AF37' },
]

export function StatsBar() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} style={{ background: 'rgba(10,31,18,0.7)', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 lg:divide-x"
          style={{ '--tw-divide-opacity': '1', borderColor: 'rgba(212,175,55,0.08)' } as React.CSSProperties}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center py-4 lg:px-8">
              <div className="font-serif font-bold text-5xl mb-1" style={{ color: s.color, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
