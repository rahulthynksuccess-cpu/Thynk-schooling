'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Search, GitCompare, FileText, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { icon: Search,       num: '01', title: 'Search & Discover',   desc: 'AI-powered filters — city, board, fees, class — to find schools matched perfectly to your child.',      accent: '#D4AF37', glow: 'rgba(212,175,55,0.2)' },
  { icon: GitCompare,   num: '02', title: 'Compare Schools',     desc: 'Side-by-side comparison of fees, facilities, ratings, and admission criteria across multiple schools.',    accent: '#7DC28F', glow: 'rgba(125,194,143,0.2)' },
  { icon: FileText,     num: '03', title: 'Apply in One Click',  desc: 'Fill the Common Admission Form once and apply to multiple schools with your saved child profile.',         accent: '#D4AF37', glow: 'rgba(212,175,55,0.2)' },
  { icon: CheckCircle2, num: '04', title: 'Track & Get Admitted', desc: 'Real-time status tracking at every stage. Get notified the moment something changes.',                   accent: '#7DC28F', glow: 'rgba(125,194,143,0.2)' },
]

export function HowItWorks() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section ref={ref} className="section" style={{ background: 'var(--forest-800)' }}>
      <div className="container-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <div className="section-eyebrow justify-center">How It Works</div>
          <h2 className="section-title text-6xl mb-4">
            Admission Made <span className="text-gold-gradient italic">Simple</span>
          </h2>
          <p className="section-sub max-w-xl mx-auto">From search to admission in 4 easy steps — completely free for parents.</p>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connector */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.1), rgba(212,175,55,0.3), rgba(212,175,55,0.1))' }} />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `rgba(15,41,25,0.8)`, border: `1px solid ${step.accent}30`, boxShadow: `0 0 30px ${step.glow}` }}>
                  <Icon className="w-8 h-8" style={{ color: step.accent }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--forest-900)', border: `1px solid ${step.accent}40`, color: step.accent, fontFamily: 'DM Sans' }}>
                    {i + 1}
                  </span>
                </div>
                <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: step.accent, fontFamily: 'DM Sans' }}>
                  Step {step.num}
                </div>
                <h3 className="font-serif font-bold text-xl mb-3" style={{ color: '#F0EDD8' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,237,216,0.5)', fontFamily: 'DM Sans', fontWeight: 300 }}>{step.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
