'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, GraduationCap, Star, ArrowRight, Sparkles } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}

export function HeroSection() {
  const router  = useRouter()
  const [query, setQuery] = useState('')
  const [city,  setCity]  = useState('')

  const { options: cities, isLoading: citiesLoading } = useDropdown('city')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (city)  params.set('city', city)
    router.push(`/schools?${params.toString()}`)
  }

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-hero-mesh" />
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-navy-400/10 blur-3xl pointer-events-none" />

      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-6"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-sm font-display font-semibold">
                <Sparkles className="w-4 h-4 animate-pulse-dot" />
                AI-Powered School Matching — Free for Parents
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.0] tracking-tight"
            >
              Find the{' '}
              <span className="relative inline-block">
                <span className="text-gradient">Perfect School</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10 Q75 2 150 8 Q225 14 298 6"
                    stroke="#FF5C00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="300"
                    strokeDashoffset="0"
                  />
                </svg>
              </span>
              <br />
              for Your Child
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              className="font-body text-navy-200 text-lg sm:text-xl max-w-2xl leading-relaxed"
            >
              Search, compare &amp; apply to <strong className="text-white">12,000+ verified schools</strong> across
              35+ Indian cities. CBSE · ICSE · IB · Cambridge — all in one place.
            </motion.p>

            {/* Search Box */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSearch}
              className="w-full max-w-3xl"
            >
              <div className="flex flex-col sm:flex-row gap-3 p-2.5 bg-surface-card border border-surface-border rounded-2xl shadow-card">
                {/* Query input */}
                <div className="flex items-center gap-3 flex-1 px-3">
                  <Search className="w-5 h-5 text-navy-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="School name, board, or keyword…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-navy-400 font-body text-sm focus:outline-none py-2"
                  />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-surface-border self-stretch my-1" />

                {/* City select */}
                <div className="flex items-center gap-3 px-3 min-w-[180px]">
                  <MapPin className="w-5 h-5 text-navy-400 flex-shrink-0" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-body text-white focus:outline-none py-2 cursor-pointer appearance-none"
                    disabled={citiesLoading}
                  >
                    <option value="" className="bg-surface-card">All Cities</option>
                    {cities.map((c) => (
                      <option key={c.value} value={c.value} className="bg-surface-card">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button type="submit" className="btn-primary px-8 py-3 flex-shrink-0">
                  Search
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>

            {/* Popular searches */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-navy-400 text-xs font-display font-semibold">Popular:</span>
              {['CBSE Schools Delhi', 'IB Schools Mumbai', 'Boarding Schools', 'ICSE Bangalore'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => router.push(`/schools?q=${encodeURIComponent(tag)}`)}
                  className="tag hover:border-orange-500/40 hover:text-orange-400 transition-all text-xs cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Floating school cards */}
        <div className="hidden xl:block">
          {/* Left card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute left-4 top-1/3 card p-4 w-64 animate-float"
            style={{ animationDelay: '0s' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-sm">DPS R.K. Puram</div>
                <div className="text-navy-300 text-xs">New Delhi</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-orange-400 fill-orange-400' : 'text-navy-500'}`} />
              ))}
              <span className="text-navy-300 text-xs ml-1">4.8 (320 reviews)</span>
            </div>
            <div className="flex gap-1 mt-2">
              <span className="badge-orange text-[10px]">CBSE</span>
              <span className="badge-gray text-[10px]">Co-Ed</span>
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="absolute right-4 top-1/4 card p-4 w-60 animate-float"
            style={{ animationDelay: '2s' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="font-display font-bold text-white text-sm">AI Match Found</span>
            </div>
            <div className="text-navy-300 text-xs mb-3">Based on your preferences</div>
            <div className="space-y-1.5">
              {['The Cathedral School', 'Bombay Scottish', 'Podar International'].map((s, i) => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-white text-xs font-semibold">{s}</span>
                  <span className="text-orange-400 text-xs font-bold">{98 - i * 3}% match</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute right-24 bottom-24 card p-3 w-52 animate-float"
            style={{ animationDelay: '4s' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <div>
                <div className="font-display font-bold text-white text-xs">Application Sent!</div>
                <div className="text-navy-300 text-[10px]">The Doon School · Class 8</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-navy-400 text-xs font-display font-semibold">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border border-surface-border flex items-start justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-orange-500"
          />
        </div>
      </motion.div>
    </section>
  )
}
