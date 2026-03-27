'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight, Star, BookOpen } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const CITY_ICONS: Record<string, string> = {
  delhi:'🏛️', mumbai:'🌊', bangalore:'🌿', hyderabad:'💎', chennai:'🎭',
  pune:'📚', kolkata:'🎨', ahmedabad:'🏗️', jaipur:'🏰', lucknow:'🌸',
}

// ── CITIES ──────────────────────────────────────────────────────
export function TopCitiesGrid() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })
  const { options: cities, isLoading } = useDropdown('city')

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
          <div className="section-eyebrow justify-center">Browse by City</div>
          <h2 className="section-title text-5xl mb-4">Schools in Your <span className="text-gold-gradient italic">City</span></h2>
          <p className="section-sub max-w-lg mx-auto">Find top schools in 35+ Indian cities — all verified, all real.</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
            : cities.slice(0, 10).map((city, i) => (
                <motion.div key={city.value} initial={{ opacity: 0, scale: 0.92 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.05 }}>
                  <Link href={`/schools?city=${city.value}`} className="card-hover p-5 flex flex-col items-center gap-2 text-center group block">
                    <span className="text-3xl">{CITY_ICONS[city.value.toLowerCase()] || '🏙️'}</span>
                    <span className="font-serif font-bold text-sm transition-colors group-hover:text-gold-400" style={{ color: '#F0EDD8' }}>{city.label}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>
                      <MapPin className="w-3 h-3" />View Schools
                    </span>
                  </Link>
                </motion.div>
              ))
          }
        </div>
        <div className="text-center mt-8">
          <Link href="/cities" className="btn-ghost" style={{ color: '#D4AF37' }}>View all 35+ cities <ArrowRight className="w-4 h-4 inline" /></Link>
        </div>
      </div>
    </section>
  )
}

// ── COUNSELLING CTA ─────────────────────────────────────────────
export function CounsellingCTA() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="section" style={{ background: 'var(--forest-800)' }}>
      <div className="container-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-10 md:p-16"
          style={{ background: 'linear-gradient(135deg, #0A1F12 0%, #0F2918 50%, #071A0F 100%)', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 0 80px rgba(212,175,55,0.06)' }}>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(39,99,56,0.15) 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="section-eyebrow mb-5">100% Free</div>
              <h2 className="section-title text-5xl mb-5">
                Talk to an Expert<br />
                <span className="text-gold-gradient italic">Education Counsellor</span>
              </h2>
              <p className="section-sub mb-7">Confused about which board to choose? Our experts help 500+ families every month — at absolutely zero cost to you.</p>
              <div className="flex flex-col gap-3">
                {['CBSE vs ICSE vs IB — which board suits your child', 'School shortlisting by budget, location & values', 'Admission documents checklist & timelines'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(240,237,216,0.65)', fontFamily: 'DM Sans', fontWeight: 300 }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(125,194,143,0.15)', border: '1px solid rgba(125,194,143,0.2)' }}>
                      <span className="text-xs" style={{ color: '#7DC28F' }}>✓</span>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-gold p-8 w-full md:w-80 flex-shrink-0 text-center">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="font-serif font-bold text-2xl mb-2" style={{ color: '#F0EDD8' }}>Book a Free Session</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(240,237,216,0.5)', fontFamily: 'DM Sans', fontWeight: 300 }}>Mon–Sat · 9 AM – 7 PM<br/>Hindi &amp; English · No spam</p>
              <Link href="/counselling" className="btn-gold w-full justify-center block">Book Now — It&apos;s Free</Link>
              <p className="text-xs mt-3" style={{ color: 'rgba(240,237,216,0.3)', fontFamily: 'DM Sans' }}>No sales calls · No obligation</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ── TESTIMONIALS ─────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi',     child: 'Daughter, Class 6', text: 'Found the perfect CBSE school for my daughter in just 2 days. The AI recommendations were uncannily accurate and the counsellor was phenomenal!', stars: 5 },
  { name: 'Rahul Mehta',  city: 'Mumbai',    child: 'Son, Class 1',      text: 'Applied to 3 schools through the platform and got admission in all 3. The common application form alone saved me 6 hours of paperwork.',           stars: 5 },
  { name: 'Anjali Nair',  city: 'Bangalore', child: 'Twins, Nursery',    text: 'The IB vs CBSE comparison was a game-changer. The free counselling session answered every question we had. Absolutely outstanding service.',         stars: 5 },
]

export function TestimonialsSection() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
          <div className="section-eyebrow justify-center">Parent Stories</div>
          <h2 className="section-title text-5xl">Trusted by <span className="text-gold-gradient italic">1 Lakh+ Parents</span></h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12 }}
              className="card-hover p-7 flex flex-col gap-5">
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-current" style={{ color: '#D4AF37' }} />
                ))}
              </div>
              <div className="gold-divider" />
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(240,237,216,0.65)', fontFamily: 'DM Sans', fontWeight: 300, fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-base"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-serif font-bold text-sm" style={{ color: '#F0EDD8' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>{t.city} · {t.child}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FOR SCHOOLS ──────────────────────────────────────────────────
export function ForSchoolsCTA() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="section" style={{ background: 'var(--forest-800)' }}>
      <div className="container-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}
            className="card-gold p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(212,175,55,0.05) 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="section-eyebrow mb-4">For Schools</div>
              <h3 className="section-title text-4xl mb-4">Get Qualified<br />Admission <span className="text-gold-gradient italic">Leads</span></h3>
              <p className="section-sub text-sm mb-6">List your school free. Get matched with parents actively seeking admission. Buy only the leads you want with our pay-per-lead marketplace.</p>
              <div className="flex flex-col gap-2.5 mb-8">
                {['Free school listing — no upfront cost', 'Verified parent leads with real intent', 'Buy credits in bulk and save up to 70%', 'Full dashboard with analytics & lead tracking'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(240,237,216,0.6)', fontFamily: 'DM Sans', fontWeight: 300 }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <span className="text-[9px]" style={{ color: '#D4AF37' }}>✓</span>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <Link href="/register?role=school" className="btn-gold self-start">List Your School Free <ArrowRight className="w-4 h-4" /></Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4">
            <div className="section-eyebrow">Pricing Plans</div>
            {[
              { plan: 'Free',     price: '₹0',     leads: '5 leads/mo',   hot: false, sub: 'Basic profile · 5 images' },
              { plan: 'Silver',   price: '₹2,999', leads: '25 leads/mo',  hot: false, sub: 'Verified badge · Analytics' },
              { plan: 'Gold',     price: '₹5,999', leads: '75 leads/mo',  hot: true,  sub: 'Featured listing · Priority' },
              { plan: 'Platinum', price: '₹9,999', leads: 'Unlimited',    hot: false, sub: 'Top placement · Manager' },
            ].map(p => (
              <div key={p.plan} className={`flex items-center justify-between gap-4 p-5 rounded-2xl transition-all duration-200 ${p.hot ? 'hover:shadow-[0_0_0_1px_rgba(212,175,55,0.4)]' : 'hover:border-[rgba(212,175,55,0.2)]'}`}
                style={{
                  background: p.hot ? 'rgba(212,175,55,0.06)' : 'rgba(15,41,25,0.5)',
                  border: p.hot ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(30,77,43,0.6)',
                }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif font-bold text-base" style={{ color: '#F0EDD8' }}>{p.plan}</span>
                    {p.hot && <span className="badge badge-gold text-xs">Most Popular</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>{p.sub} · {p.leads}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-serif font-bold text-xl" style={{ color: '#D4AF37' }}>{p.price}</div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,216,0.35)', fontFamily: 'DM Sans' }}>/month</div>
                </div>
              </div>
            ))}
            <Link href="/pricing" className="btn-outline-gold text-center justify-center">View Full Pricing <ArrowRight className="w-4 h-4" /></Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── BLOG PREVIEW ─────────────────────────────────────────────────
const BLOG_POSTS = [
  { title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?', slug: 'cbse-vs-icse-vs-ib',       tag: 'Board Guide',    readTime: '8 min'  },
  { title: 'How to Choose the Right School: 10 Questions to Ask',      slug: 'how-to-choose-school',     tag: 'Admission Tips', readTime: '6 min'  },
  { title: 'Top 10 Boarding Schools in India 2026',                    slug: 'top-boarding-schools-india', tag: 'Rankings',     readTime: '10 min' },
]

export function BlogPreview() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section ref={ref} className="section">
      <div className="container-xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="section-eyebrow">From the Blog</div>
            <h2 className="section-title text-5xl">Admission <span className="text-gold-gradient italic">Insights</span></h2>
          </div>
          <Link href="/blog" className="btn-ghost hidden sm:flex" style={{ color: '#D4AF37' }}>
            All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {BLOG_POSTS.map((post, i) => (
            <motion.div key={post.slug} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12 }}>
              <Link href={`/blog/${post.slug}`} className="card-hover p-7 flex flex-col gap-5 h-full block group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <BookOpen className="w-6 h-6" style={{ color: '#D4AF37' }} />
                </div>
                <div>
                  <span className="badge badge-gold text-xs mb-3 inline-flex">{post.tag}</span>
                  <h3 className="font-serif font-bold text-lg leading-snug transition-colors group-hover:text-gold-400" style={{ color: '#F0EDD8' }}>
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs mt-auto pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)', color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>
                  📖 {post.readTime} read
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
