'use client'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { School, Users, Star, CheckCircle } from 'lucide-react'

const STATS = [
  { icon: School,        value: '12,000+', label: 'Verified Schools',   color: 'text-orange-400' },
  { icon: Users,         value: '1 Lakh+', label: 'Happy Parents',      color: 'text-blue-400' },
  { icon: MapPin2,       value: '35+',     label: 'Indian Cities',      color: 'text-green-400' },
  { icon: CheckCircle,   value: '98%',     label: 'Satisfaction Rate',  color: 'text-purple-400' },
  { icon: Star,          value: '4.8★',   label: 'Average Rating',     color: 'text-yellow-400' },
]

function MapPin2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function StatsBar() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section ref={ref} className="py-12 border-y border-surface-border bg-surface-card/50">
      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x lg:divide-surface-border">
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center lg:px-6 gap-2"
              >
                <div className={`w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center mb-1`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`font-display font-bold text-3xl ${stat.color}`}>{stat.value}</div>
                <div className="font-body text-navy-300 text-sm">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
