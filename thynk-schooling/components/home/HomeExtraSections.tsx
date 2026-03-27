'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useQuery } from '@tanstack/react-query'
import { MapPin, ArrowRight, Star, BookOpen } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useDropdown } from '@/hooks/useDropdown'

// ─────────────────────────────────────────────
// TOP CITIES GRID
// ─────────────────────────────────────────────
const CITY_ICONS: Record<string, string> = {
  delhi: '🏛️', mumbai: '🌊', bangalore: '🌿', hyderabad: '💎',
  chennai: '🎭', pune: '📚', kolkata: '🎨', ahmedabad: '🏗️',
  jaipur: '🏰', lucknow: '🌸',
}

export function TopCitiesGrid() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { options: cities, isLoading } = useDropdown('city')

  return (
    <section ref={ref} className="section bg-navy-950">
      <div className="container-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <span className="badge-orange mb-4 inline-flex">Browse by City</span>
          <h2 className="section-title mb-4">Schools in Your <span className="text-gradient">City</span></h2>
          <p className="section-sub max-w-lg mx-auto">Find top schools in 35+ Indian cities — all verified, all real.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))
            : cities.slice(0, 10).map((city, i) => (
                <motion.div
                  key={city.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/schools?city=${city.value}`}
                    className="card-hover p-5 flex flex-col items-center gap-2 text-center group"
                  >
                    <span className="text-3xl">{CITY_ICONS[city.value.toLowerCase()] || '🏙️'}</span>
                    <span className="font-display font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
                      {city.label}
                    </span>
                    <span className="flex items-center gap-1 text-navy-400 text-xs">
                      <MapPin className="w-3 h-3" /> View Schools
                    </span>
                  </Link>
                </motion.div>
              ))
          }
        </div>

        <div className="text-center mt-8">
          <Link href="/cities" className="btn-ghost text-orange-400 hover:text-orange-300">
            View all 35+ cities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// COUNSELLING CTA
// ─────────────────────────────────────────────
export function CounsellingCTA() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-10 md:p-16"
          style={{
            background: 'linear-gradient(135deg, #151D52 0%, #0F1640 40%, #1a0d00 100%)',
            border: '1px solid rgba(255,92,0,0.2)',
          }}
        >
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="badge-orange mb-4 inline-flex">100% Free</span>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
                Talk to an Expert<br />
                <span className="text-gradient">Education Counsellor</span>
              </h2>
              <p className="text-navy-200 text-lg leading-relaxed mb-6">
                Confused about which board to choose? Not sure about school fit? Our experts help 500+ families every month — completely free.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-navy-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                  CBSE vs ICSE vs IB guidance
                </div>
                <div className="flex items-center gap-2 text-navy-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                  School shortlisting help
                </div>
                <div className="flex items-center gap-2 text-navy-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                  Admission document checklist
                </div>
              </div>
            </div>

            <div className="card p-8 w-full md:w-80 flex-shrink-0 text-center">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Book a Free Session</h3>
              <p className="text-navy-300 text-sm mb-6">Mon–Sat · 9 AM – 7 PM · Available in Hindi & English</p>
              <Link href="/counselling" className="btn-primary w-full justify-center">
                Book Now — It's Free
              </Link>
              <p className="text-navy-400 text-xs mt-3">No spam · No sales calls</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi', child: 'Daughter, Class 6', text: 'Found the perfect CBSE school for my daughter in just 2 days. The counsellor was incredibly helpful!', stars: 5 },
  { name: 'Rahul Mehta',  city: 'Mumbai', child: 'Son, Class 1', text: 'AI recommendations were spot on. Applied to 3 schools through the platform, got admission in all 3!', stars: 5 },
  { name: 'Anjali Nair',  city: 'Bangalore', child: 'Twins, Nursery', text: 'Comparing IB vs CBSE schools was so easy with the comparison tool. Saved weeks of research.', stars: 5 },
  { name: 'Vikram Singh', city: 'Hyderabad', child: 'Son, Class 9', text: 'The boarding school filter helped us find the right school in Dehradun within our budget. Amazing platform!', stars: 5 },
  { name: 'Meera Patel',  city: 'Ahmedabad', child: 'Daughter, Class 3', text: 'Free counselling session answered all my questions. The counsellor even called back to follow up. Highly recommend!', stars: 5 },
]

export function TestimonialsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="section bg-navy-950">
      <div className="container-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <span className="badge-orange mb-4 inline-flex">Parent Stories</span>
          <h2 className="section-title mb-4">
            Trusted by <span className="text-gradient">1 Lakh+ Parents</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12 }}
              className="card p-6 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-orange-400 fill-orange-400" />
                ))}
              </div>
              <p className="text-navy-200 text-sm leading-relaxed italic">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center font-display font-bold text-orange-400 text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-display font-bold text-white text-sm">{t.name}</div>
                  <div className="text-navy-400 text-xs">{t.city} · {t.child}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FOR SCHOOLS CTA
// ─────────────────────────────────────────────
export function ForSchoolsCTA() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* School card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-10"
            style={{ background: 'linear-gradient(135deg, #0F1640 0%, #151D52 100%)', border: '1px solid #1E2A52' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <span className="badge-blue mb-4 inline-flex">For Schools</span>
            <h3 className="font-display font-bold text-3xl text-white mb-3">
              Get Qualified<br />Admission Leads
            </h3>
            <p className="text-navy-300 mb-6 leading-relaxed">
              List your school free. Get matched with parents actively seeking admission. Buy only the leads you want with our pay-per-lead marketplace.
            </p>
            <ul className="space-y-2 mb-8">
              {['Free school listing', 'Verified parent leads', 'AI-matched enquiries', 'Real-time dashboard'].map(f => (
                <li key={f} className="flex items-center gap-2 text-navy-200 text-sm">
                  <span className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?role=school" className="btn-primary">
              List Your School Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Pricing preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {[
              { plan: 'Free',     price: '₹0',      leads: '5 leads/mo',   badge: 'badge-gray',   features: 'Basic profile, 5 images' },
              { plan: 'Silver',   price: '₹2,999',  leads: '25 leads/mo',  badge: 'badge-gray',   features: 'Verified badge, analytics' },
              { plan: 'Gold',     price: '₹5,999',  leads: '75 leads/mo',  badge: 'badge-orange', features: 'Featured listing, priority', hot: true },
              { plan: 'Platinum', price: '₹9,999',  leads: 'Unlimited',    badge: 'badge-blue',   features: 'Top placement, manager' },
            ].map((p) => (
              <div
                key={p.plan}
                className={`card p-5 flex items-center justify-between gap-4 ${p.hot ? 'border-orange-500/40 shadow-orange-sm' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm">{p.plan}</span>
                      {p.hot && <span className="badge-orange text-[10px]">Most Popular</span>}
                    </div>
                    <div className="text-navy-400 text-xs mt-0.5">{p.features}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-orange-400 text-lg">{p.price}<span className="text-navy-400 font-normal text-xs">/mo</span></div>
                  <div className="text-navy-400 text-xs">{p.leads}</div>
                </div>
              </div>
            ))}
            <Link href="/pricing" className="btn-secondary text-center justify-center">
              View Full Pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// BLOG PREVIEW
// ─────────────────────────────────────────────
const BLOG_POSTS = [
  { title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?', slug: 'cbse-vs-icse-vs-ib', tag: 'Board Guide', readTime: '8 min' },
  { title: 'How to Choose the Right School: 10 Questions to Ask', slug: 'how-to-choose-school', tag: 'Admission Tips', readTime: '6 min' },
  { title: 'Top 10 Boarding Schools in India 2026', slug: 'top-boarding-schools-india', tag: 'Rankings', readTime: '10 min' },
]

export function BlogPreview() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="section bg-navy-950">
      <div className="container-xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="badge-orange mb-3 inline-flex">From the Blog</span>
            <h2 className="section-title">Admission <span className="text-gradient">Insights</span></h2>
          </div>
          <Link href="/blog" className="btn-ghost text-orange-400 hidden sm:flex">
            All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12 }}
            >
              <Link href={`/blog/${post.slug}`} className="card-hover p-6 flex flex-col gap-4 h-full block">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <span className="badge-orange text-[10px] mb-3 inline-flex">{post.tag}</span>
                  <h3 className="font-display font-bold text-white text-base leading-snug hover:text-orange-400 transition-colors">
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-navy-400 text-xs mt-auto pt-2 border-t border-surface-border">
                  <span>📖 {post.readTime} read</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
