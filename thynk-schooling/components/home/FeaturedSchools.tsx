'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { Star, MapPin, ArrowRight, BadgeCheck, GraduationCap } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { School } from '@/types'

function SchoolCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 w-full rounded-t-2xl rounded-b-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  )
}

function SchoolCard({ school, index }: { school: School; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/schools/${school.slug}`} className="card-hover overflow-hidden flex flex-col h-full block">
        {/* Cover */}
        <div className="relative h-44 bg-navy-800 overflow-hidden">
          {school.coverImageUrl ? (
            <img
              src={school.coverImageUrl}
              alt={school.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-700 to-navy-800">
              <GraduationCap className="w-12 h-12 text-navy-500" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {school.isFeatured && (
              <span className="badge-orange text-[10px] px-2 py-0.5">⭐ Featured</span>
            )}
            {school.isVerified && (
              <span className="badge-green text-[10px] px-2 py-0.5 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          {/* Logo */}
          {school.logoUrl && (
            <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl border-2 border-surface-card overflow-hidden bg-white shadow-card">
              <img src={school.logoUrl} alt={`${school.name} logo`} className="w-full h-full object-contain p-1" loading="lazy" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 pt-7 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="font-display font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-orange-400 transition-colors">
              {school.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-navy-300 text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{school.city}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {school.board.slice(0, 2).map((b) => (
              <span key={b} className="badge-orange text-[10px]">{b}</span>
            ))}
            {school.genderPolicy && (
              <span className="badge-gray text-[10px]">{school.genderPolicy}</span>
            )}
            {school.schoolType && (
              <span className="badge-blue text-[10px]">{school.schoolType}</span>
            )}
          </div>

          {/* Rating + Fee */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-border">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="font-display font-bold text-white text-sm">{school.avgRating.toFixed(1)}</span>
              <span className="text-navy-400 text-xs">({school.totalReviews})</span>
            </div>
            {school.monthlyFeeMin && (
              <div className="text-right">
                <div className="font-display font-bold text-white text-sm">
                  ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                  <span className="text-navy-400 font-normal text-xs">/mo</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedSchools() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const { data, isLoading } = useQuery<{ data: School[] }>({
    queryKey: ['featured-schools'],
    queryFn:  () => apiGet('/schools?isFeatured=true&limit=8&sortBy=rating'),
    enabled:  inView,
    staleTime: 5 * 60 * 1000,
  })

  const schools = data?.data ?? []

  return (
    <section ref={ref} className="section bg-navy-950">
      <div className="container-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="badge-orange mb-3 inline-flex">Featured Schools</span>
            <h2 className="section-title">
              Top Schools Across <span className="text-gradient">India</span>
            </h2>
          </div>
          <Link href="/schools" className="btn-outline flex-shrink-0 self-start sm:self-auto">
            View All Schools <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SchoolCardSkeleton key={i} />)
            : schools.map((school, i) => (
                <SchoolCard key={school.id} school={school} index={i} />
              ))
          }
        </div>
      </div>
    </section>
  )
}
