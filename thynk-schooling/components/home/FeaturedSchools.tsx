'use client'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Star, MapPin, BadgeCheck, GraduationCap, ArrowRight, BookOpen, Users } from 'lucide-react'
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
    <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '200px', borderRadius: 0 }} />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: '16px', width: '70%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '12px', width: '45%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          <div className="skeleton" style={{ height: '20px', width: '55px', borderRadius: '100px' }} />
          <div className="skeleton" style={{ height: '20px', width: '55px', borderRadius: '100px' }} />
        </div>
        <div className="skeleton" style={{ height: '12px', width: '60%' }} />
      </div>
    </div>
  )
}

const COVER_BG = [
  'linear-gradient(135deg,#F5EFE0,#EDE2C8)',
  'linear-gradient(135deg,#E8F0E8,#D4E8D4)',
  'linear-gradient(135deg,#E8E4F5,#D8D0EE)',
  'linear-gradient(135deg,#F5E8E4,#EED0C8)',
  'linear-gradient(135deg,#E4EFF5,#C8DDE8)',
  'linear-gradient(135deg,#F5F0E4,#EEE4C8)',
]

function SchoolCard({ school, i }: { school: School; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      <Link
        href={`/schools/${school.slug}`}
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          background: '#fff', borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(13,17,23,0.08)',
          boxShadow: '0 2px 12px rgba(13,17,23,0.06)',
          textDecoration: 'none', transition: 'all 0.3s ease',
        }}
        className="featured-school-card"
      >
        <div style={{
          height: '200px',
          background: school.coverImageUrl ? undefined : COVER_BG[i % COVER_BG.length],
          position: 'relative', overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                loading="lazy" />
            : <GraduationCap style={{ width: '52px', height: '52px', color: 'rgba(13,17,23,0.18)' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.22) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
            {school.isVerified && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: 'rgba(22,163,74,0.9)', color: '#fff',
                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px',
                fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(4px)',
              }}><BadgeCheck style={{ width: '10px', height: '10px' }} /> Verified</span>
            )}
            {school.isFeatured && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: 'rgba(184,134,11,0.92)', color: '#fff',
                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px',
                fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(4px)',
              }}>★ Featured</span>
            )}
          </div>
          {school.monthlyFeeMin && (
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              borderRadius: '10px', padding: '4px 10px',
            }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginLeft: '2px' }}>/mo</span>
            </div>
          )}
        </div>

        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
              background: '#F5F0E8', border: '1px solid rgba(13,17,23,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {school.logoUrl
                ? <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} loading="lazy" />
                : <GraduationCap style={{ width: '22px', height: '22px', color: '#B8860B' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '17px',
                color: '#0D1117', lineHeight: 1.25, marginBottom: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{school.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8694' }}>
                <MapPin style={{ width: '11px', height: '11px', color: '#B8860B', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {school.city}{school.state ? `, ${school.state}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {school.board.slice(0, 2).map(b => (
              <span key={b} style={{
                background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.25)',
                color: '#9A6F0B', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                padding: '3px 9px', borderRadius: '100px',
              }}>{b}</span>
            ))}
            {school.genderPolicy && (
              <span style={{
                background: 'rgba(13,17,23,0.05)', border: '1px solid rgba(13,17,23,0.1)',
                color: '#5A6472', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                padding: '3px 9px', borderRadius: '100px',
              }}>{school.genderPolicy}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
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

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(13,17,23,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} style={{
                    width: '11px', height: '11px',
                    fill: s <= Math.round(school.avgRating) ? '#B8860B' : 'transparent',
                    color: s <= Math.round(school.avgRating) ? '#B8860B' : '#D0D5DB',
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>
                {school.avgRating.toFixed(1)}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#A0ADB8' }}>
                ({school.totalReviews})
              </span>
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#B8860B',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              View Details <ArrowRight style={{ width: '11px', height: '11px' }} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedSchools() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

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
    <section ref={ref} style={{ background: '#FAF7F2', padding: '100px 0' }}>
      <style>{`
        .featured-school-card:hover { box-shadow: 0 16px 48px rgba(13,17,23,0.16) !important; }
        .featured-school-card:hover img { transform: scale(1.05); }
      `}</style>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '52px' }}
        >
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
              color: '#B8860B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px',
            }}>
              <Star style={{ width: '12px', height: '12px', fill: '#B8860B' }} /> Featured Schools
            </div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 52px)', color: '#0D1117',
              lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0,
            }}>
              Top Schools Across <em style={{ color: '#B8860B', fontStyle: 'italic' }}>India</em>
            </h2>
          </div>
          <Link
            href="/schools?featured=true"
            style={{
              flexShrink: 0, alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
              color: '#0D1117', textDecoration: 'none',
              border: '1.5px solid rgba(13,17,23,0.2)',
              borderRadius: '100px', padding: '10px 20px',
              transition: 'all 0.2s ease',
            }}
            className="featured-view-all"
          >
            All Featured Schools <ArrowRight style={{ width: '14px', height: '14px' }} />
          </Link>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
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
