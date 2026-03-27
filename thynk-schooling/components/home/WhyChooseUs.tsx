'use client'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Sparkles, ShieldCheck, PhoneCall, Zap, Map, GitCompare, HeartHandshake, BarChart3 } from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Recommendations',
    desc: 'Our ML model matches your child's profile, learning style, and your preferences to recommend the best-fit schools.',
    badge: 'Smart',
    badgeClass: 'badge-orange',
  },
  {
    icon: ShieldCheck,
    title: '100% Verified Schools',
    desc: 'Every school is manually verified by our team. Real photos, accurate fees, and genuine reviews — no fake listings.',
    badge: 'Trusted',
    badgeClass: 'badge-green',
  },
  {
    icon: PhoneCall,
    title: 'Free 1-on-1 Counselling',
    desc: 'Book a free session with our expert education counsellors. Available Mon–Sat, 9 AM to 7 PM.',
    badge: 'Free',
    badgeClass: 'badge-blue',
  },
  {
    icon: Zap,
    title: 'Instant OTP Registration',
    desc: 'No long forms. Register in 30 seconds with just your mobile number — no email required.',
    badge: 'Fast',
    badgeClass: 'badge-purple',
  },
  {
    icon: Map,
    title: 'Interactive School Map',
    desc: 'See schools near you on an interactive map. Filter by distance, board, and class range.',
    badge: 'Visual',
    badgeClass: 'badge-orange',
  },
  {
    icon: GitCompare,
    title: 'Side-by-Side Comparison',
    desc: 'Compare up to 4 schools simultaneously across fees, facilities, ratings, board, and more.',
    badge: 'Smart',
    badgeClass: 'badge-blue',
  },
  {
    icon: HeartHandshake,
    title: 'Common Application Form',
    desc: 'Fill once, apply anywhere. Your child\'s profile is saved and reused across all school applications.',
    badge: 'Convenient',
    badgeClass: 'badge-green',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Status Tracking',
    desc: 'Track every application\'s progress from submission to admission — all in your parent dashboard.',
    badge: 'Live',
    badgeClass: 'badge-orange',
  },
]

export function WhyChooseUs() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-orange mb-4 inline-flex">Why Thynk Schooling</span>
          <h2 className="section-title mb-4">
            Everything You Need,<br />
            <span className="text-gradient">Nothing You Don't</span>
          </h2>
          <p className="section-sub max-w-xl mx-auto">
            Built specifically for the Indian school admission journey — from nursery to Class 12.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="card-hover p-6 flex flex-col gap-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className={f.badgeClass}>{f.badge}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="font-body text-navy-300 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
