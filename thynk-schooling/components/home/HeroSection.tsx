'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, ArrowRight, Sparkles, BadgeCheck, GraduationCap } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.13 } } }

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city,  setCity]  = useState('')
  const { options: cities, isLoading: citiesLoading } = useDropdown('city')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (city)  p.set('city', city)
    router.push(`/schools?${p.toString()}`)
  }

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">

      {/* ── Backgrounds ── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0A1F12 0%, #071A0F 40%, #030D08 100%)' }} />
      <div className="absolute inset-0 grid-bg opacity-100" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(39,99,56,0.35) 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left ── */}
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-7">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-widest uppercase"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'DM Sans' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#D4AF37' }} />
                AI-Powered School Matching — Free for Parents
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp}
              className="section-title text-7xl lg:text-8xl mb-6 leading-[0.95]" style={{ letterSpacing: '-0.03em' }}>
              Find the<br />
              <span className="text-gold-gradient italic">Perfect School</span><br />
              <span style={{ color: 'rgba(240,237,216,0.3)', fontSize: '0.75em' }}>for Your Child</span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fadeUp} className="section-sub text-lg mb-9 max-w-lg">
              Search, compare &amp; apply to <span style={{ color: '#F0EDD8', fontWeight: 500 }}>12,000+ verified schools</span> across
              35+ Indian cities — CBSE, ICSE, IB, Cambridge &amp; more.
            </motion.p>

            {/* Search */}
            <motion.form variants={fadeUp} onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl"
                style={{ background: 'rgba(15,41,25,0.8)', border: '1px solid rgba(212,175,55,0.15)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-3 flex-1 px-3">
                  <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.5)' }} />
                  <input type="text" placeholder="School name, board, or keyword…"
                    value={query} onChange={e => setQuery(e.target.value)}
                    className="bg-transparent flex-1 text-sm py-2 focus:outline-none"
                    style={{ color: '#F0EDD8', fontFamily: 'DM Sans' }} />
                </div>
                <div className="hidden sm:block w-px my-1" style={{ background: 'rgba(212,175,55,0.1)' }} />
                <div className="flex items-center gap-2 px-3 min-w-[160px]">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.5)' }} />
                  <select value={city} onChange={e => setCity(e.target.value)}
                    disabled={citiesLoading}
                    className="bg-transparent flex-1 text-sm py-2 focus:outline-none cursor-pointer appearance-none"
                    style={{ color: city ? '#F0EDD8' : 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>
                    <option value="" style={{ background: '#0F2919' }}>All Cities</option>
                    {cities.map(c => <option key={c.value} value={c.value} style={{ background: '#0F2919' }}>{c.label}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-gold px-7 py-3 rounded-xl text-sm flex-shrink-0">
                  Search <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>

            {/* Popular tags */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <span className="text-xs tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'DM Sans' }}>Popular:</span>
              {['CBSE Schools Delhi', 'IB Schools Mumbai', 'Boarding Schools', 'ICSE Bangalore'].map(t => (
                <button key={t} onClick={() => router.push(`/schools?q=${encodeURIComponent(t)}`)} className="tag text-xs">
                  {t}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Floating cards ── */}
          <div className="hidden lg:flex flex-col gap-4 relative">

            {/* Main school card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
              className="card-gold p-5 animate-float" style={{ animationDelay: '0s' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'rgba(39,99,56,0.3)', border: '1px solid rgba(212,175,55,0.15)' }}>🏛</div>
                  <div>
                    <div className="font-serif font-bold text-base" style={{ color: '#F0EDD8' }}>DPS R.K. Puram</div>
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'rgba(240,237,216,0.5)', fontFamily: 'DM Sans' }}>
                      <MapPin className="w-3 h-3" /> New Delhi
                    </div>
                  </div>
                </div>
                <div className="badge-green badge text-xs flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#D4AF37' }} />)}
                <span className="text-xs ml-1" style={{ color: 'rgba(240,237,216,0.5)', fontFamily: 'DM Sans' }}>4.9 (420 reviews)</span>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="flex gap-2">
                  <span className="badge badge-forest text-xs">CBSE</span>
                  <span className="badge badge-cream text-xs">Co-Ed</span>
                </div>
                <div className="font-serif font-bold text-base" style={{ color: '#D4AF37' }}>
                  ₹4,500<span className="text-xs font-normal" style={{ color: 'rgba(240,237,216,0.4)', fontFamily: 'DM Sans' }}>/mo</span>
                </div>
              </div>
            </motion.div>

            {/* AI Match card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.7 }}
              className="card-gold p-5 animate-float" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <span className="font-serif font-bold text-base" style={{ color: '#F0EDD8' }}>AI Match Found</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(240,237,216,0.45)', fontFamily: 'DM Sans' }}>Based on your child&apos;s profile</p>
              {[
                { name: 'The Cathedral School', pct: '98%' },
                { name: 'Bombay Scottish',      pct: '95%' },
                { name: 'Podar International',  pct: '91%' },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.06)' }}>
                  <span className="text-xs font-medium" style={{ color: '#F0EDD8', fontFamily: 'DM Sans' }}>{s.name}</span>
                  <span className="text-xs font-bold" style={{ color: '#D4AF37', fontFamily: 'DM Sans' }}>{s.pct}</span>
                </div>
              ))}
            </motion.div>

            {/* Admission confirmed */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.7 }}
              className="card-gold p-4 animate-float self-end w-3/4" style={{ animationDelay: '4s' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ background: 'rgba(77,160,96,0.15)', border: '1px solid rgba(77,160,96,0.2)' }}>✓</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#F0EDD8', fontFamily: 'DM Sans' }}>Application Sent!</div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,216,0.45)', fontFamily: 'DM Sans' }}>The Doon School · Class 8</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.4)', fontFamily: 'DM Sans' }}>Scroll</span>
        <div className="w-5 h-9 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
          <motion.div animate={{ y: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-1 h-1 rounded-full" style={{ background: '#D4AF37' }} />
        </div>
      </motion.div>
    </section>
  )
}
