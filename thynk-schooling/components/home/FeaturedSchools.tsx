'use client'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Star, MapPin, BadgeCheck, GraduationCap, ArrowRight, BookOpen, Users, Sparkles } from 'lucide-react'
import { School } from '@/types'

async function fetchFeaturedCount(): Promise<number> {
  try {
    const res = await fetch('/api/admin?action=settings', { cache: 'no-store' })
    const json = await res.json()
    const raw = json?.settings?.featured_schools_count
    const n = parseInt(raw ?? '10', 10)
    return isNaN(n) || n < 1 ? 10 : Math.min(n, 20)
  } catch {
    return 10
  }
}

function Skeleton() {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.07)', borderRadius: '22px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '210px', borderRadius: 0 }} />
      <div style={{ padding: '22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: '17px', width: '68%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '12px', width: '42%' }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: '12px', width: '90%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '12px', width: '75%', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <div className="skeleton" style={{ height: '22px', width: '58px', borderRadius: '100px' }} />
          <div className="skeleton" style={{ height: '22px', width: '58px', borderRadius: '100px' }} />
        </div>
        <div className="skeleton" style={{ height: '13px', width: '55%' }} />
      </div>
    </div>
  )
}

const COVER_BG = [
  'linear-gradient(135deg,#1a0e2e,#2d1b4e)',
  'linear-gradient(135deg,#0a1e14,#0d3020)',
  'linear-gradient(135deg,#1a1000,#2d1f00)',
  'linear-gradient(135deg,#0a0e1a,#0d1f3c)',
  'linear-gradient(135deg,#1a0a0a,#3c1010)',
  'linear-gradient(135deg,#0a1a1a,#0d3030)',
]

function SchoolCard({ school, i }: { school: School; i: number }) {
  const rating = Number(school.avgRating) || 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      <Link
        href={`/schools/${school.slug}`}
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          background: '#fff', borderRadius: '22px', overflow: 'hidden',
          border: '1px solid rgba(13,17,23,0.07)',
          boxShadow: '0 2px 16px rgba(13,17,23,0.06)',
          textDecoration: 'none', transition: 'all 0.32s ease',
        }}
        className="featured-school-card"
      >
        {/* Cover image */}
        <div style={{
          height: '210px',
          background: school.coverImageUrl ? undefined : COVER_BG[i % COVER_BG.length],
          position: 'relative', overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s ease' }}
                loading="lazy" className="featured-school-img" />
            : (
              <>
                {/* decorative rings for no-cover */}
                {[100, 170, 240, 310].map((size, ci) => (
                  <div key={ci} style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                ))}
                <GraduationCap style={{ width: '46px', height: '46px', color: 'rgba(255,255,255,0.18)', position: 'relative', zIndex: 1 }} />
              </>
            )
          }
          {/* gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.55) 0%, rgba(13,17,23,0.08) 50%, transparent 100%)', pointerEvents: 'none' }} />

          {/* top badges */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {school.isVerified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 9px', borderRadius: '100px', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
                <BadgeCheck style={{ width: '10px', height: '10px' }} /> Verified
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(184,134,11,0.92)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 9px', borderRadius: '100px', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(184,134,11,0.35)' }}>
                <Sparkles style={{ width: '9px', height: '9px' }} /> Featured
              </span>
            )}
          </div>

          {/* fee bottom-right */}
          {school.monthlyFeeMin && (
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '5px 11px' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginLeft: '2px' }}>/mo</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', marginBottom: '12px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
              background: '#F5F0E8', border: '1px solid rgba(13,17,23,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {school.logoUrl
                ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '7px' }} loading="lazy" />
                : <GraduationCap style={{ width: '22px', height: '22px', color: '#B8860B' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '18px',
                color: '#0D1117', lineHeight: 1.22, marginBottom: '5px',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{school.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8694' }}>
                <MapPin style={{ width: '11px', height: '11px', color: '#B8860B', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Description snippet — the missing piece */}
          {school.description && (
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: '#6B7280',
              lineHeight: 1.72, marginBottom: '13px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {school.description}
            </p>
          )}

          {/* Board + gender badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {school.board.slice(0, 2).map(b => (
              <span key={b} style={{
                background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.22)',
                color: '#9A6F0B', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                padding: '3px 10px', borderRadius: '100px',
              }}>{b}</span>
            ))}
            {school.genderPolicy && (
              <span style={{
                background: 'rgba(13,17,23,0.05)', border: '1px solid rgba(13,17,23,0.09)',
                color: '#5A6472', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                padding: '3px 10px', borderRadius: '100px',
              }}>{school.genderPolicy}</span>
            )}
          </div>

          {/* Classes + students */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            {school.classesFrom && school.classesTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#5A6472' }}>
                <BookOpen style={{ width: '12px', height: '12px' }} />
                Class {school.classesFrom}–{school.classesTo}
              </div>
            )}
            {school.totalStudents && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#5A6472' }}>
                <Users style={{ width: '12px', height: '12px' }} />
                {school.totalStudents.toLocaleString('en-IN')} students
              </div>
            )}
          </div>

          {/* Rating + view link */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(13,17,23,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} style={{
                    width: '12px', height: '12px',
                    fill: s <= Math.round(rating) ? '#B8860B' : 'transparent',
                    color: s <= Math.round(rating) ? '#B8860B' : '#D0D5DB',
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '15px', color: '#0D1117' }}>
                {rating.toFixed(1)}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#A0ADB8' }}>
                ({school.totalReviews})
              </span>
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#B8860B',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              View Details <ArrowRight style={{ width: '12px', height: '12px' }} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedSchools() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.08 })

  const { data: count } = useQuery<number>({
    queryKey: ['featured-count'],
    queryFn: fetchFeaturedCount,
    staleTime: 60 * 1000,
  })

  const limit = count ?? 10

  const { data, isLoading } = useQuery<{ data: School[] }>({
    queryKey: ['featured-schools', limit],
    queryFn: () =>
      fetch(`/api/schools?isFeatured=true&limit=${limit}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => ({ data: d.data ?? [] })),
    enabled: inView,
    staleTime: 5 * 60 * 1000,
  })

  const schools = data?.data ?? []

  return (
    <section ref={ref} style={{ background: 'linear-gradient(180deg,#FAF7F2 0%,#F0EAD6 100%)', padding: '100px 0', position:'relative', overflow:'hidden' }}>
      <style>{`
        .featured-school-card:hover {
          box-shadow: 0 20px 60px rgba(13,17,23,0.14) !important;
          transform: translateY(-4px);
          border-color: rgba(184,134,11,0.22) !important;
        }
        .featured-school-card:hover .featured-school-img { transform: scale(1.06); }
      `}</style>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)' }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '56px', flexWrap: 'wrap' }}
        >
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
              color: '#B8860B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px',
            }}>
              <Sparkles style={{ width: '12px', height: '12px' }} /> Featured Schools
            </div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(34px, 4.5vw, 56px)', color: '#0D1117',
              lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0,
            }}>
              Top Schools Across{' '}
              <em style={{ color: '#B8860B', fontStyle: 'italic' }}>India</em>
            </h2>
          </div>

          <motion.div
            whileHover={{ scale: 1.03, x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/schools?featured=true"
              style={{
                flexShrink: 0, alignSelf: 'flex-start',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                color: '#0D1117', textDecoration: 'none',
                border: '1.5px solid rgba(13,17,23,0.18)',
                borderRadius: '100px', padding: '11px 22px',
                transition: 'all 0.22s ease',
              }}
              className="featured-view-all"
            >
              All Featured Schools <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '22px',
        }}>
          {isLoading
            ? Array.from({ length: limit }).map((_, i) => <Skeleton key={i} />)
            : schools.map((s, i) => <SchoolCard key={s.id} school={s} i={i} />)
          }
        </div>
      </div>
    </section>
  )
}
