'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, ShieldCheck, PhoneCall, Zap, Map, GitCompare, HeartHandshake, BarChart3 } from 'lucide-react'

const FEATURES = [
  { icon: Sparkles,       title: 'AI Recommendations',      desc: 'ML model matches your child\'s profile to recommend best-fit schools instantly.',               badge: 'Smart',      accent: '#D4AF37' },
  { icon: ShieldCheck,    title: '100% Verified Schools',   desc: 'Every school manually verified. Real photos, accurate fees, genuine reviews — no fakes.',         badge: 'Trusted',    accent: '#7DC28F' },
  { icon: PhoneCall,      title: 'Free 1-on-1 Counselling', desc: 'Expert education counsellors available Mon–Sat, 9 AM to 7 PM. Completely free.',                badge: 'Free',       accent: '#D4AF37' },
  { icon: Zap,            title: 'Instant OTP Registration', desc: 'Register in 30 seconds with just your mobile number. No email required.',                       badge: 'Fast',       accent: '#7DC28F' },
  { icon: Map,            title: 'Interactive School Map',  desc: 'Find schools near you on a live map. Filter by distance, board, and class range.',               badge: 'Visual',     accent: '#D4AF37' },
  { icon: GitCompare,     title: 'Side-by-Side Compare',    desc: 'Compare up to 4 schools on fees, facilities, ratings and board simultaneously.',                  badge: 'Smart',      accent: '#7DC28F' },
  { icon: HeartHandshake, title: 'Common Application',      desc: 'Fill once, apply anywhere. Your child\'s profile saved and reused across all schools.',           badge: 'Convenient', accent: '#D4AF37' },
  { icon: BarChart3,      title: 'Real-Time Tracking',      desc: 'Track every application from submission to admission in your parent dashboard.',                  badge: 'Live',       accent: '#7DC28F' },
]

export function WhyChooseUs() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <div className="section-eyebrow justify-center">Why Thynk Schooling</div>
          <h2 className="section-title text-6xl mb-4">
            Everything You Need,<br />
            <span className="text-gold-gradient italic">Nothing You Don&apos;t</span>
          </h2>
          <p className="section-sub max-w-xl mx-auto">Built specifically for the Indian school admission journey — from nursery to Class 12.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="card-hover p-6 flex flex-col gap-4 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
                <div className="flex items-start justify-between relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}20` }}>
                    <Icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: `${f.accent}10`, color: f.accent, border: `1px solid ${f.accent}20`, fontFamily: 'DM Sans' }}>
                    {f.badge}
                  </span>
                </div>
                <div className="relative">
                  <h3 className="font-serif font-bold text-base mb-2 transition-colors duration-200 group-hover:text-gold-300"
                    style={{ color: '#F0EDD8' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,237,216,0.5)', fontFamily: 'DM Sans', fontWeight: 300 }}>{f.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
