'use client'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Search, GitCompare, FileText, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    number: '01',
    title: 'Search & Discover',
    desc: 'Use AI-powered filters — city, board, fees, class, gender policy — to find schools perfectly matched to your child.',
    color: 'from-orange-500 to-orange-600',
    glow: 'shadow-[0_0_30px_rgba(255,92,0,0.25)]',
  },
  {
    icon: GitCompare,
    number: '02',
    title: 'Compare Schools',
    desc: 'Side-by-side comparison of fees, facilities, ratings, and admission criteria across multiple schools at once.',
    color: 'from-blue-500 to-blue-600',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.25)]',
  },
  {
    icon: FileText,
    number: '03',
    title: 'Apply in One Click',
    desc: 'Fill the Common Admission Form once and apply to multiple schools using your saved child profile.',
    color: 'from-purple-500 to-purple-600',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]',
  },
  {
    icon: CheckCircle2,
    number: '04',
    title: 'Track & Get Admitted',
    desc: 'Real-time status tracking on your parent dashboard. Get notified at every stage of the admission process.',
    color: 'from-green-500 to-green-600',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.25)]',
  },
]

export function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="section bg-navy-950">
      <div className="container-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-orange mb-4 inline-flex">How It Works</span>
          <h2 className="section-title mb-4">
            School Admission Made <span className="text-gradient">Simple</span>
          </h2>
          <p className="section-sub max-w-xl mx-auto">
            From search to admission — everything in 4 easy steps, completely free for parents.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-orange-500/20 via-orange-500/40 to-orange-500/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} ${step.glow} flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                    {/* Step number */}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-navy-900 border border-surface-border flex items-center justify-center font-display font-bold text-xs text-navy-200">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="font-body text-navy-300 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
