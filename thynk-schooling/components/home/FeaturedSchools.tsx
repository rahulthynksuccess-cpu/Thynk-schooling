'use client'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Star, MapPin, ArrowRight, BadgeCheck, GraduationCap } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { School } from '@/types'

function SchoolCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 rounded-t-2xl rounded-b-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-16 rounded-full" /></div>
        <div className="skeleton h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  )
}

function SchoolCard({ school, index }: { school: School; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.5 }}>
      <Link href={`/schools/${school.slug}`} className="card-hover overflow-hidden flex flex-col h-full block">
        {/* Cover */}
        <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F2918, #163820)' }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-14 h-14" style={{ color: 'rgba(212,175,55,0.2)' }} /></div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,31,18,0.6) 0%, transparent 60%)' }} />
          <div className="absolute top-3 left-3 flex gap-2">
            {school.isFeatured && (
              <span className="badge badge-gold text-xs">✦ Featured</span>
            )}
            {school.isVerified && (
              <span className="badge badge-green text-xs flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
        {/* Body */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="font-serif font-bold text-base leading-tight mb-1.5" style={{ color: '#F0EDD8' }}>
              {school.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(240,237,216,0.45)', fontFamily: 'DM Sans' }}>
              <MapPin className="w-3 h-3 flex-shrink-0" /> {school.city}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {school.board.slice(0, 2).map(b => <span key={b} className="badge badge-gold text-xs">{b}</span>)}
            {school.genderPolicy && <span className="badge badge-cream text-xs">{school.genderPolicy}</span>}
          </div>
          <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#D4AF37' }} />
              <span className="font-serif font-bold text-sm" style={{ color: '#F0EDD8' }}>{school.avgRating.toFixed(1)}</span>
              <span className="text-xs" style={{ color: 'rgba(240,237,216,0.35)', fontFamily: 'DM Sans' }}>({school.totalReviews})</span>
            </div>
            {school.monthlyFeeMin && (
              <div className="font-serif font-bold text-sm" style={{ color: '#D4AF37' }}>
                ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                <span className="text-xs font-normal" style={{ color: 'rgba(240,237,216,0.35)', fontFamily: 'DM Sans' }}>/mo</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedSchools() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })
  const { data, isLoading } = useQuery<{ data: School[] }>({
    queryKey: ['featured-schools'],
    queryFn:  () => apiGet('/schools?isFeatured=true&limit=8&sortBy=rating'),
    enabled:  inView,
    staleTime: 5 * 60 * 1000,
  })
  const schools = data?.data ?? []

  return (
    <section ref={ref} className="section" style={{ background: 'var(--forest-800)' }}>
      <div className="container-xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="section-eyebrow">Featured Schools</div>
            <h2 className="section-title text-5xl">Top Schools Across <span className="text-gold-gradient italic">India</span></h2>
          </div>
          <Link href="/schools" className="btn-outline-gold flex-shrink-0 self-start sm:self-auto">
            View All Schools <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SchoolCardSkeleton key={i} />)
            : schools.map((s, i) => <SchoolCard key={s.id} school={s} index={i} />)
          }
        </div>
      </div>
    </section>
  )
}
