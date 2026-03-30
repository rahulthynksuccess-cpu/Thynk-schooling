'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Star, BadgeCheck, Heart, Share2,
  GitCompare, ArrowRight, Bus, Waves, Trophy, FlaskConical,
  Monitor, BookOpen, UtensilsCrossed, Building2, Cross, Projector,
  Calendar, Users, GraduationCap, ChevronRight, ExternalLink
} from 'lucide-react'
import { School, Review } from '@/types'
import { clsx } from 'clsx'

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

const FACILITY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  transport:       { icon: Bus,           label: 'Transport'         },
  swimmingPool:    { icon: Waves,         label: 'Swimming Pool'     },
  sportsGround:    { icon: Trophy,        label: 'Sports Ground'     },
  scienceLab:      { icon: FlaskConical,  label: 'Science Lab'       },
  computerLab:     { icon: Monitor,       label: 'Computer Lab'      },
  library:         { icon: BookOpen,      label: 'Library'           },
  cafeteria:       { icon: UtensilsCrossed,label: 'Cafeteria'        },
  hostel:          { icon: Building2,     label: 'Hostel'            },
  infirmary:       { icon: Cross,         label: 'Infirmary'         },
  smartClassrooms: { icon: Projector,     label: 'Smart Classrooms'  },
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center font-display font-bold text-orange-400">
            {review.parentName[0]}
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">{review.parentName}</div>
            <div className="text-navy-400 text-xs">{new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={clsx('w-3.5 h-3.5', s <= review.rating ? 'text-orange-400 fill-orange-400' : 'text-navy-600')} />
          ))}
        </div>
      </div>
      <h4 className="font-display font-semibold text-white text-sm">{review.title}</h4>
      <p className="text-navy-300 text-sm leading-relaxed">{review.body}</p>
      {review.schoolReply && (
        <div className="p-3 rounded-xl bg-navy-800 border border-surface-border">
          <div className="text-xs font-display font-bold text-orange-400 mb-1">School Response</div>
          <p className="text-navy-300 text-xs leading-relaxed">{review.schoolReply}</p>
        </div>
      )}
    </div>
  )
}

export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved,     setSaved]     = useState(false)

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn:  () => fetch(`/api/schools/${slug}`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.school??d),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', slug],
    queryFn:  () => fetch(`/api/schools/${slug}/reviews?limit=5`,{cache:'no-store'}).then(r=>r.ok?r.json():({reviews:[]})).catch(()=>({reviews:[]})),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="container-xl mx-auto px-4 py-10 space-y-5">
      <div className="skeleton h-64 rounded-2xl" />
      <div className="skeleton h-32 rounded-2xl" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  )

  if (!school) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">🏫</div>
      <h2 className="font-display font-bold text-white text-2xl">School Not Found</h2>
      <Link href="/schools" className="btn-primary">Browse Schools</Link>
    </div>
  )

  return (
    <div className="pb-20">
      {/* ── Cover ── */}
      <div className="relative h-64 sm:h-80 bg-navy-800 overflow-hidden">
        {school.coverImageUrl
          ? <img src={school.coverImageUrl} alt={school.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
              <GraduationCap className="w-20 h-20 text-navy-600" />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setSaved(!saved)}
            className={clsx('p-2.5 rounded-xl border transition-all', saved ? 'bg-orange-500 border-orange-500' : 'glass border-surface-border hover:border-orange-500/40')}
          ><Heart className={clsx('w-4 h-4', saved ? 'text-white fill-white' : 'text-white')} /></button>
          <button className="p-2.5 rounded-xl glass border border-surface-border hover:border-orange-500/40 transition-all">
            <Share2 className="w-4 h-4 text-white" />
          </button>
          <Link href={`/compare?add=${school.id}`} className="p-2.5 rounded-xl glass border border-surface-border hover:border-orange-500/40 transition-all">
            <GitCompare className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-14 flex items-end gap-5 mb-6">
          {/* Logo */}
          <div className="w-24 h-24 rounded-2xl border-4 border-navy-900 overflow-hidden bg-white flex-shrink-0 shadow-card">
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-2" />
              : <div className="w-full h-full bg-navy-800 flex items-center justify-center"><GraduationCap className="w-10 h-10 text-navy-500" /></div>
            }
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {school.isVerified && <span className="badge-green text-xs"><BadgeCheck className="w-3 h-3" /> Verified</span>}
              {school.isFeatured && <span className="badge-orange text-xs">⭐ Featured</span>}
              {school.board.map(b => <span key={b} className="badge-orange text-xs">{b}</span>)}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight">{school.name}</h1>
          </div>
        </div>

        {/* ── Meta bar ── */}
        <div className="flex flex-wrap items-center gap-5 mb-8 pb-6 border-b border-surface-border">
          <div className="flex items-center gap-1.5 text-navy-300 text-sm">
            <MapPin className="w-4 h-4 text-orange-400" />
            {school.addressLine1}, {school.city}, {school.state}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={clsx('w-4 h-4', s <= Math.round(school.avgRating) ? 'text-orange-400 fill-orange-400' : 'text-navy-600')} />
              ))}
            </div>
            <span className="font-display font-bold text-white text-sm">{school.avgRating.toFixed(1)}</span>
            <span className="text-navy-400 text-xs">({school.totalReviews} reviews)</span>
          </div>
          {school.phone && (
            <a href={`tel:${school.phone}`} className="flex items-center gap-1.5 text-navy-300 text-sm hover:text-orange-400 transition-colors">
              <Phone className="w-4 h-4" /> {school.phone}
            </a>
          )}
          {school.websiteUrl && (
            <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-navy-300 text-sm hover:text-orange-400 transition-colors">
              <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Main content ── */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar mb-8 p-1 bg-surface-card border border-surface-border rounded-xl">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-display font-semibold whitespace-nowrap transition-all flex-shrink-0',
                    activeTab === tab
                      ? 'bg-orange-500 text-white shadow-orange-sm'
                      : 'text-navy-300 hover:text-white hover:bg-surface-hover'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {school.description && (
                  <div>
                    <h2 className="font-display font-bold text-white text-xl mb-3">About {school.name}</h2>
                    <p className="text-navy-300 leading-relaxed">{school.description}</p>
                  </div>
                )}

                {/* Quick facts grid */}
                <div>
                  <h2 className="font-display font-bold text-white text-xl mb-4">School Details</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Board',        value: school.board.join(', ')       },
                      { label: 'School Type',  value: school.schoolType             },
                      { label: 'Gender',       value: school.genderPolicy           },
                      { label: 'Medium',       value: school.mediumOfInstruction    },
                      { label: 'Classes',      value: `${school.classesFrom} – ${school.classesTo}` },
                      { label: 'Est.',         value: school.foundingYear?.toString() },
                      { label: 'Recognition',  value: school.recognition            },
                      { label: 'Students',     value: school.totalStudents?.toLocaleString('en-IN') },
                      { label: 'Teacher Ratio',value: school.studentTeacherRatio    },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="card p-3">
                        <div className="text-navy-400 text-xs font-display font-semibold mb-1">{f.label}</div>
                        <div className="font-display font-bold text-white text-sm">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Facilities' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-display font-bold text-white text-xl mb-5">Facilities & Infrastructure</h2>
                {school.facilities ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Object.entries(school.facilities).map(([key, hasIt]) => {
                      const def = FACILITY_ICONS[key]
                      if (!def) return null
                      const Icon = def.icon
                      return (
                        <div key={key} className={clsx('card p-4 flex flex-col items-center gap-2 text-center', !hasIt && 'opacity-40')}>
                          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', hasIt ? 'bg-orange-500/15' : 'bg-navy-800')}>
                            <Icon className={clsx('w-6 h-6', hasIt ? 'text-orange-400' : 'text-navy-500')} />
                          </div>
                          <span className="font-display font-semibold text-sm text-white">{def.label}</span>
                          <span className={clsx('text-xs', hasIt ? 'text-green-400' : 'text-navy-500')}>{hasIt ? 'Available' : 'Not Available'}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-navy-400">Facility information not available.</p>}
              </motion.div>
            )}

            {activeTab === 'Fees' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-display font-bold text-white text-xl mb-5">Fee Structure</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {school.monthlyFeeMin && (
                    <div className="card p-5 text-center">
                      <div className="text-navy-400 text-xs font-display font-semibold mb-2">Monthly Fee (Min)</div>
                      <div className="font-display font-bold text-2xl text-orange-400">₹{school.monthlyFeeMin.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {school.monthlyFeeMax && (
                    <div className="card p-5 text-center">
                      <div className="text-navy-400 text-xs font-display font-semibold mb-2">Monthly Fee (Max)</div>
                      <div className="font-display font-bold text-2xl text-orange-400">₹{school.monthlyFeeMax.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {school.annualFee && (
                    <div className="card p-5 text-center">
                      <div className="text-navy-400 text-xs font-display font-semibold mb-2">Annual / Admission Fee</div>
                      <div className="font-display font-bold text-2xl text-orange-400">₹{school.annualFee.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-navy-200">
                  ℹ️ Fees shown are approximate and may vary by class and academic year. Contact the school directly for the exact fee schedule.
                </div>
              </motion.div>
            )}

            {activeTab === 'Admission' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-display font-bold text-white text-xl mb-5">Admission Information</h2>
                {school.admissionInfo ? (
                  <div className="space-y-4">
                    <div className="card p-5 flex items-center justify-between">
                      <span className="text-navy-300 font-display font-semibold">Academic Year</span>
                      <span className="font-bold text-white">{school.admissionInfo.academicYear}</span>
                    </div>
                    <div className="card p-5 flex items-center justify-between">
                      <span className="text-navy-300 font-display font-semibold">Admission Status</span>
                      <span className={clsx('badge', school.admissionInfo.admissionOpen ? 'badge-green' : 'badge-gray')}>
                        {school.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    </div>
                    {school.admissionInfo.lastDate && (
                      <div className="card p-5 flex items-center justify-between">
                        <span className="text-navy-300 font-display font-semibold">Last Date to Apply</span>
                        <span className="font-bold text-white">{school.admissionInfo.lastDate}</span>
                      </div>
                    )}
                    {school.admissionInfo.documentsRequired?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="font-display font-bold text-white mb-3">Documents Required</h3>
                        <ul className="space-y-2">
                          {school.admissionInfo.documentsRequired.map(doc => (
                            <li key={doc} className="flex items-center gap-2 text-navy-300 text-sm">
                              <span className="text-orange-400">→</span> {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : <p className="text-navy-400">Admission details not available.</p>}
              </motion.div>
            )}

            {activeTab === 'Reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-white text-xl">Parent Reviews</h2>
                  <span className="text-navy-400 text-sm">{reviews?.total ?? 0} reviews</span>
                </div>
                {(reviews?.data ?? []).map(r => <ReviewCard key={r.id} review={r} />)}
                {!reviews?.data?.length && <p className="text-navy-400 text-center py-8">No reviews yet. Be the first to review!</p>}
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-display font-bold text-white text-xl mb-5">School Gallery</h2>
                {school.galleryImages?.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {school.galleryImages.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-navy-800">
                        <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-navy-400">No gallery images available.</p>}
              </motion.div>
            )}
          </div>

          {/* ── Right: Sticky action panel ── */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20 space-y-4">
              <div className="text-center pb-4 border-b border-surface-border">
                {school.monthlyFeeMin && (
                  <div>
                    <div className="text-navy-400 text-xs font-display font-semibold mb-1">Monthly Fee From</div>
                    <div className="font-display font-bold text-3xl text-orange-400">
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={clsx('w-3.5 h-3.5', s <= Math.round(school.avgRating) ? 'text-orange-400 fill-orange-400' : 'text-navy-600')} />)}
                  </div>
                  <span className="text-white text-sm font-bold">{school.avgRating.toFixed(1)}</span>
                </div>
              </div>

              <Link href={`/apply/${school.id}`} className="btn-primary w-full justify-center text-sm">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/counselling" className="btn-secondary w-full justify-center text-sm">
                📞 Get Counselling
              </Link>
              <button
                onClick={() => setSaved(!saved)}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-display font-semibold text-sm transition-all',
                  saved
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                    : 'border-surface-border text-navy-300 hover:border-orange-500/30 hover:text-white'
                )}
              >
                <Heart className={clsx('w-4 h-4', saved && 'fill-orange-400')} />
                {saved ? 'Saved to Wishlist' : 'Save School'}
              </button>

              {/* Contact info */}
              <div className="pt-4 border-t border-surface-border space-y-2">
                <div className="font-display font-bold text-white text-sm mb-3">Contact School</div>
                {school.phone && (
                  <a href={`tel:${school.phone}`} className="flex items-center gap-2 text-navy-300 text-sm hover:text-orange-400 transition-colors">
                    <Phone className="w-4 h-4" /> {school.phone}
                  </a>
                )}
                {school.email && (
                  <a href={`mailto:${school.email}`} className="flex items-center gap-2 text-navy-300 text-sm hover:text-orange-400 transition-colors">
                    <Mail className="w-4 h-4" /> {school.email}
                  </a>
                )}
                {school.websiteUrl && (
                  <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy-300 text-sm hover:text-orange-400 transition-colors">
                    <Globe className="w-4 h-4" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
