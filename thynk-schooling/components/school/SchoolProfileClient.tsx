'use client'
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Star, BadgeCheck, Heart, Share2,
  GitCompare, ArrowRight, GraduationCap, ChevronRight, ExternalLink,
  BookOpen, Users, Calendar, Award, Building2, Bus, Waves, Trophy,
  FlaskConical, Monitor, BookOpenCheck, UtensilsCrossed, Cross, Projector,
  Music, Drama, Palette, Code, Mic, Camera, Leaf, Shield, X
} from 'lucide-react'
import { School, Review } from '@/types'
import { clsx } from 'clsx'

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

/* ── colour palette ── */
const C = {
  bg:       '#FAF7F2',
  card:     '#FFFFFF',
  border:   'rgba(13,17,23,0.08)',
  ink:      '#0D1117',
  inkMuted: '#5A6472',
  inkFaint: '#A0ADB8',
  gold:     '#B8860B',
  goldBg:   'rgba(184,134,11,0.08)',
  goldBdr:  'rgba(184,134,11,0.22)',
  green:    '#16a34a',
  greenBg:  'rgba(22,163,74,0.08)',
}

/* ── shared card style ── */
const cardStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 16, overflow: 'hidden',
  boxShadow: '0 2px 12px rgba(13,17,23,0.06)',
}

/* ── stat pill ── */
function StatPill({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: React.ElementType }) {
  if (!value) return null
  return (
    <div style={{ ...cardStyle, padding: '16px 20px' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon style={{ width: 12, height: 12 }} />}
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 17, color: C.ink, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  )
}

/* ── tag chip ── */
function Tag({ label, color = 'gold' }: { label: string; color?: 'gold' | 'green' | 'blue' | 'purple' | 'orange' }) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    gold:   { bg: 'rgba(184,134,11,0.08)',   border: 'rgba(184,134,11,0.22)',  text: '#9A6F0B' },
    green:  { bg: 'rgba(22,163,74,0.08)',    border: 'rgba(22,163,74,0.22)',   text: '#15803d' },
    blue:   { bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.22)',  text: '#1d4ed8' },
    purple: { bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.22)', text: '#6d28d9' },
    orange: { bg: 'rgba(234,88,12,0.08)',    border: 'rgba(234,88,12,0.22)',   text: '#c2410c' },
  }
  const s = map[color]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', background: s.bg, border: `1px solid ${s.border}`, color: s.text, fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:100 }}>
      {label}
    </span>
  )
}

/* ── review card ── */
function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = review.parentName?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() || '?'
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
      style={{ ...cardStyle, padding: '20px 24px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background: C.goldBg, border: `1px solid ${C.goldBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color: C.gold }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>{review.parentName}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint, marginTop:1 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} style={{ width:13, height:13, fill: s<=review.rating?C.gold:'transparent', color: s<=review.rating?C.gold:'#D0D5DB' }} />
          ))}
        </div>
      </div>
      {review.title && <h4 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:17, color:C.ink, marginBottom:6 }}>{review.title}</h4>}
      <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted, lineHeight:1.7 }}>{review.body}</p>
      {review.schoolReply && (
        <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'rgba(184,134,11,0.06)', border:`1px solid ${C.goldBdr}` }}>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.gold, marginBottom:5 }}>School Response</div>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, lineHeight:1.6 }}>{review.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ── loading skeleton ── */
function ProfileSkeleton() {
  return (
    <div style={{ background: C.bg }}>
      <div className="skeleton" style={{ height:320, borderRadius:0 }} />
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', gap:24, marginTop:-40, marginBottom:24 }}>
          <div className="skeleton" style={{ width:100, height:100, borderRadius:20, flexShrink:0 }} />
          <div style={{ flex:1, paddingTop:48 }}>
            <div className="skeleton" style={{ height:28, width:'40%', marginBottom:10 }} />
            <div className="skeleton" style={{ height:14, width:'25%' }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32 }}>
          <div>
            <div className="skeleton" style={{ height:48, borderRadius:14, marginBottom:28 }} />
            <div className="skeleton" style={{ height:200, borderRadius:16 }} />
          </div>
          <div className="skeleton" style={{ height:400, borderRadius:20 }} />
        </div>
      </div>
    </div>
  )
}

/* ── share toast ── */
function ShareToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:20, scale:0.95 }}
      style={{
        position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
        zIndex:300, background:'#0D1117', color:'#fff',
        borderRadius:14, padding:'12px 20px', display:'flex', alignItems:'center', gap:10,
        boxShadow:'0 8px 32px rgba(13,17,23,0.3)', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600,
      }}
    >
      ✅ Link copied to clipboard
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', borderRadius:6, padding:'2px 6px', color:'#fff' }}><X style={{ width:12, height:12 }} /></button>
    </motion.div>
  )
}

/* ─── Main Component ─── */
export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved,      setSaved]     = useState(false)
  const [showShare,  setShowShare] = useState(false)
  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const coverY = useTransform(scrollY, [0, 400], [0, 80])

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn:  () => fetch(`/api/schools/${slug}`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.school??d),
    staleTime: 5 * 60 * 1000,
  })

  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', slug],
    queryFn:  () => fetch(`/api/schools/${slug}/reviews?limit=5`,{cache:'no-store'}).then(r=>r.ok?r.json():({data:[],total:0})).catch(()=>({data:[],total:0})),
    enabled: !!school,
    staleTime: 5 * 60 * 1000,
  })

  const handleShare = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href)
    setShowShare(true)
    setTimeout(() => setShowShare(false), 2500)
  }

  if (isLoading) return <ProfileSkeleton />

  if (!school) return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:C.bg }}>
      <div style={{ fontSize:56 }}>🏫</div>
      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:28, color:C.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding:'12px 28px', borderRadius:14, background:C.ink, color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, textDecoration:'none' }}>
        Browse Schools
      </Link>
    </div>
  )

  const reviewList = reviews?.data ?? []

  return (
    <div style={{ background: C.bg, paddingBottom: 80 }}>
      <AnimatePresence>
        {showShare && <ShareToast onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      {/* ── HERO COVER ── */}
      <div ref={coverRef} style={{ position:'relative', height:'clamp(260px, 40vw, 440px)', overflow:'hidden', background:'#1a1a2e' }}>
        <motion.div style={{ y: coverY, position:'absolute', inset:'-20%', insetInline:0 }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'140%', objectFit:'cover', objectPosition:'center' }} />
            : (
              <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <GraduationCap style={{ width:80, height:80, color:'rgba(255,255,255,0.12)' }} />
              </div>
            )
          }
        </motion.div>
        {/* Multi-layer gradient for readability */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,17,23,0.75) 0%, rgba(13,17,23,0.3) 40%, rgba(13,17,23,0.1) 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(13,17,23,0.3) 0%, transparent 60%)' }} />

        {/* Cover actions top-right */}
        <div style={{ position:'absolute', top:20, right:20, display:'flex', gap:8 }}>
          {[
            { icon: saved ? Heart : Heart, filled: saved, onClick: () => setSaved(!saved), title: saved ? 'Saved' : 'Save' },
            { icon: Share2, filled: false, onClick: handleShare, title: 'Share' },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
              onClick={btn.onClick} title={btn.title}
              style={{
                width:40, height:40, borderRadius:12, border:'1px solid rgba(255,255,255,0.2)',
                background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                transition:'background 0.2s',
              }}>
              <btn.icon style={{ width:16, height:16, color:'#fff', fill: (i===0 && saved) ? '#fff' : 'transparent' }} />
            </motion.button>
          ))}
          <motion.div whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}>
            <Link href={`/compare?add=${school.id}`}
              style={{
                width:40, height:40, borderRadius:12, border:'1px solid rgba(255,255,255,0.2)',
                background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
              <GitCompare style={{ width:16, height:16, color:'#fff' }} />
            </Link>
          </motion.div>
        </div>

        {/* Cover bottom info overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 clamp(16px,4vw,48px) 28px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {school.isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(22,163,74,0.85)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                <BadgeCheck style={{ width:11, height:11 }} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(184,134,11,0.85)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                ★ Featured
              </span>
            )}
            {(school.board||[]).slice(0,2).map(b => (
              <span key={b} style={{ display:'inline-flex', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:20, marginTop:-40, marginBottom:28, flexWrap:'wrap' }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity:0, scale:0.8, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
            style={{
              width:96, height:96, borderRadius:20,
              background:'#fff', border:`3px solid ${C.bg}`,
              boxShadow:'0 4px 24px rgba(13,17,23,0.15)',
              overflow:'hidden', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }} />
              : <GraduationCap style={{ width:40, height:40, color:C.gold }} />
            }
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45 }} style={{ flex:1, minWidth:0, paddingBottom:4 }}>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontWeight:700, fontSize:'clamp(24px,3.5vw,40px)', color:C.ink, lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:8 }}>
              {school.name}
            </h1>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
              {school.city && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted }}>
                  <MapPin style={{ width:13, height:13, color:C.gold }} />
                  {school.addressLine1 ? `${school.addressLine1}, ` : ''}{school.city}, {school.state}
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} style={{ width:13, height:13, fill: s<=Math.round(school.avgRating)?C.gold:'transparent', color: s<=Math.round(school.avgRating)?C.gold:'#D0D5DB' }} />
                  ))}
                </div>
                <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:C.ink }}>{(Number(school.avgRating)||0).toFixed(1)}</span>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint }}>({school.totalReviews||0} reviews)</span>
              </div>
              {school.phone && (
                <a href={`tel:${school.phone}`} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none' }}>
                  <Phone style={{ width:12, height:12 }} /> {school.phone}
                </a>
              )}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:13, color:C.gold, textDecoration:'none', fontWeight:600 }}>
                  <Globe style={{ width:12, height:12 }} /> Visit Website <ExternalLink style={{ width:11, height:11 }} />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr clamp(280px,25vw,340px)', gap:32, alignItems:'start' }}>

          {/* ── LEFT: Main Content ── */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}>

            {/* Tabs */}
            <div style={{ display:'flex', gap:3, background:'rgba(13,17,23,0.04)', borderRadius:14, padding:4, border:`1px solid ${C.border}`, marginBottom:28, overflowX:'auto' }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding:'9px 18px', borderRadius:11, border:'none', cursor:'pointer',
                    fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, whiteSpace:'nowrap',
                    transition:'all 0.2s ease', flexShrink:0,
                    background: activeTab===tab ? C.ink : 'transparent',
                    color: activeTab===tab ? '#fff' : C.inkMuted,
                    boxShadow: activeTab===tab ? '0 2px 8px rgba(13,17,23,0.2)' : 'none',
                  }}
                >{tab}</button>
              ))}
            </div>

            {/* ── Overview ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'Overview' && (
                <motion.div key="overview" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}>
                  {school.description && (
                    <div style={{ marginBottom:32 }}>
                      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink, marginBottom:12 }}>
                        About {school.name}
                      </h2>
                      <p style={{ fontFamily:'Inter,sans-serif', fontSize:15, color:C.inkMuted, lineHeight:1.8 }}>{school.description}</p>
                    </div>
                  )}

                  {/* Quick stats grid */}
                  <div style={{ marginBottom:32 }}>
                    <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:22, color:C.ink, marginBottom:16 }}>School Details</h2>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:10 }}>
                      <StatPill label="Board"          value={(school.board||[]).join(', ')} icon={BookOpenCheck} />
                      <StatPill label="School Type"    value={school.schoolType}             icon={Building2} />
                      <StatPill label="Gender Policy"  value={school.genderPolicy}           icon={Users} />
                      <StatPill label="Medium"         value={school.mediumOfInstruction}    icon={Mic} />
                      <StatPill label="Classes"        value={school.classesFrom && school.classesTo ? `${school.classesFrom} – ${school.classesTo}` : null} icon={GraduationCap} />
                      <StatPill label="Established"    value={school.foundingYear}           icon={Calendar} />
                      <StatPill label="Recognition"    value={school.recognition}            icon={Award} />
                      <StatPill label="Students"       value={school.totalStudents?.toLocaleString('en-IN')} icon={Users} />
                      <StatPill label="Teacher Ratio"  value={school.studentTeacherRatio}    icon={BookOpen} />
                    </div>
                  </div>

                  {/* Highlights */}
                  {[
                    { label:'Facilities',       items: school.facilities       as string[], color:'gold'   as const },
                    { label:'Sports',           items: school.sports           as string[], color:'green'  as const },
                    { label:'Extra Curricular', items: school.extraCurricular  as string[], color:'purple' as const },
                    { label:'Languages',        items: school.languagesOffered as string[], color:'blue'   as const },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.label} style={{ marginBottom:24 }}>
                      <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:19, color:C.ink, marginBottom:12 }}>{g.label}</h3>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {g.items.slice(0,8).map(item => <Tag key={item} label={item} color={g.color} />)}
                        {g.items.length > 8 && (
                          <span style={{ display:'inline-flex', alignItems:'center', background:'rgba(13,17,23,0.05)', border:`1px solid ${C.border}`, color:C.inkMuted, fontSize:12, fontWeight:600, fontFamily:'Inter,sans-serif', padding:'5px 12px', borderRadius:100 }}>
                            +{g.items.length-8} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── Facilities ── */}
              {activeTab === 'Facilities' && (
                <motion.div key="facilities" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }} style={{ display:'flex', flexDirection:'column', gap:28 }}>
                  {[
                    { title:'Facilities & Infrastructure', items: school.facilities      as string[], color:'gold'   as const, emoji:'🏗️' },
                    { title:'Sports',                      items: school.sports          as string[], color:'green'  as const, emoji:'⚽' },
                    { title:'Extra Curricular Activities', items: school.extraCurricular as string[], color:'purple' as const, emoji:'🎭' },
                    { title:'Languages Offered',           items: school.languagesOffered as string[], color:'blue'   as const, emoji:'🗣️' },
                  ].filter(g => g.items?.length > 0).map(g => (
                    <div key={g.title} style={{ ...cardStyle, padding:'24px 28px' }}>
                      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:21, color:C.ink, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                        <span>{g.emoji}</span> {g.title}
                      </h2>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {g.items.map(item => <Tag key={item} label={item} color={g.color} />)}
                      </div>
                    </div>
                  ))}
                  {!school.facilities?.length && !school.sports?.length && !school.extraCurricular?.length && !school.languagesOffered?.length && (
                    <p style={{ fontFamily:'Inter,sans-serif', color:C.inkFaint, textAlign:'center', padding:48 }}>Facility information not yet added by this school.</p>
                  )}
                </motion.div>
              )}

              {/* ── Fees ── */}
              {activeTab === 'Fees' && (
                <motion.div key="fees" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink, marginBottom:20 }}>Fee Structure</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
                    {[
                      { label:'Monthly Fee (Min)', value: school.monthlyFeeMin ? `₹${school.monthlyFeeMin.toLocaleString('en-IN')}` : null },
                      { label:'Monthly Fee (Max)', value: school.monthlyFeeMax ? `₹${school.monthlyFeeMax.toLocaleString('en-IN')}` : null },
                      { label:'Annual / Admission', value: school.annualFee ? `₹${school.annualFee.toLocaleString('en-IN')}` : null },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} style={{ ...cardStyle, padding:'20px 24px', textAlign:'center' }}>
                        <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{f.label}</div>
                        <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:28, color:C.gold }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.goldBg, border:`1px solid ${C.goldBdr}`, borderRadius:12, padding:'14px 18px', fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, lineHeight:1.6 }}>
                    ℹ️ Fees are approximate and may vary by class and academic year. Contact the school directly for the exact fee schedule.
                  </div>
                </motion.div>
              )}

              {/* ── Admission ── */}
              {activeTab === 'Admission' && (
                <motion.div key="admission" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink, marginBottom:20 }}>Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {[
                        { label:'Academic Year',    value: school.admissionInfo.academicYear },
                        { label:'Admission Status', value: school.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed' },
                        school.admissionInfo.lastDate ? { label:'Last Date', value: school.admissionInfo.lastDate } : null,
                      ].filter(Boolean).map((row: any) => (
                        <div key={row.label} style={{ ...cardStyle, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, color:C.inkMuted }}>{row.label}</span>
                          <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:C.ink }}>{row.value}</span>
                        </div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length > 0 && (
                        <div style={{ ...cardStyle, padding:'20px 24px' }}>
                          <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:19, color:C.ink, marginBottom:14 }}>Documents Required</h3>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {school.admissionInfo.documentsRequired.map((doc: string) => (
                              <div key={doc} style={{ display:'flex', alignItems:'center', gap:10, fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:C.gold, flexShrink:0 }} />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily:'Inter,sans-serif', color:C.inkFaint, textAlign:'center', padding:48 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {/* ── Reviews ── */}
              {activeTab === 'Reviews' && (
                <motion.div key="reviews" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink }}>Parent Reviews</h2>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkFaint }}>{reviews?.total ?? 0} reviews</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {reviewList.map((r, i) => <ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length && (
                      <div style={{ textAlign:'center', padding:'64px 0', fontFamily:'Inter,sans-serif', color:C.inkFaint }}>
                        No reviews yet. Be the first to review!
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Gallery ── */}
              {activeTab === 'Gallery' && (
                <motion.div key="gallery" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink, marginBottom:20 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                      {school.galleryImages.map((img, i) => (
                        <motion.div key={i}
                          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.06 }}
                          style={{ aspectRatio:'4/3', borderRadius:14, overflow:'hidden', background:'#e9e4dc' }}>
                          <img src={img} alt={`Gallery ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease', cursor:'pointer' }}
                            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'}
                            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform='scale(1)'}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : <p style={{ textAlign:'center', padding:'64px 0', fontFamily:'Inter,sans-serif', color:C.inkFaint }}>No gallery images available.</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── RIGHT: Sticky Sidebar ── */}
          <div>
            <motion.div
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2, duration:0.45 }}
              style={{ position:'sticky', top:88 }}
            >
              <div style={{ ...cardStyle, padding:'24px 24px 20px', marginBottom:14 }}>
                {/* Fee */}
                {school.monthlyFeeMin && (
                  <div style={{ textAlign:'center', paddingBottom:18, marginBottom:18, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Monthly Fee From</div>
                    <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:38, color:C.gold, lineHeight:1 }}>
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginTop:8 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} style={{ width:13, height:13, fill: s<=Math.round(school.avgRating)?C.gold:'transparent', color: s<=Math.round(school.avgRating)?C.gold:'#D0D5DB' }} />
                      ))}
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted, marginLeft:4 }}>{(Number(school.avgRating)||0).toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
                  <Link href={`/apply/${school.id}`}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      padding:'14px 20px', borderRadius:14, background:C.ink, color:'#fff',
                      fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:700, textDecoration:'none',
                      boxShadow:'0 4px 16px rgba(13,17,23,0.2)', transition:'all 0.2s ease',
                    }}
                    onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background=C.gold; el.style.transform='translateY(-1px)' }}
                    onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background=C.ink; el.style.transform='translateY(0)' }}
                  >
                    Apply Now <ArrowRight style={{ width:15, height:15 }} />
                  </Link>
                  <Link href="/counselling"
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      padding:'13px 20px', borderRadius:14, border:`1.5px solid ${C.border}`,
                      background:'transparent', color:C.ink,
                      fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, textDecoration:'none',
                      transition:'all 0.2s ease',
                    }}
                    onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor=C.gold; el.style.color=C.gold }}
                    onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor=C.border; el.style.color=C.ink }}
                  >
                    📞 Get Counselling
                  </Link>
                  <button onClick={() => setSaved(!saved)}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      padding:'12px 20px', borderRadius:14, cursor:'pointer',
                      border:`1.5px solid ${saved ? C.gold : C.border}`,
                      background: saved ? C.goldBg : 'transparent',
                      color: saved ? C.gold : C.inkMuted,
                      fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600,
                      transition:'all 0.2s ease',
                    }}
                  >
                    <Heart style={{ width:14, height:14, fill: saved ? C.gold : 'transparent' }} />
                    {saved ? 'Saved to Wishlist' : 'Save School'}
                  </button>
                </div>

                {/* Contact */}
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                  <div style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:12, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Contact School</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                    {school.phone && (
                      <a href={`tel:${school.phone}`} style={{ display:'flex', alignItems:'center', gap:9, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none', transition:'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color=C.gold}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color=C.inkMuted}>
                        <Phone style={{ width:13, height:13, color:C.gold }} /> {school.phone}
                      </a>
                    )}
                    {school.email && (
                      <a href={`mailto:${school.email}`} style={{ display:'flex', alignItems:'center', gap:9, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none', transition:'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color=C.gold}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color=C.inkMuted}>
                        <Mail style={{ width:13, height:13, color:C.gold }} /> {school.email}
                      </a>
                    )}
                    {school.websiteUrl && (
                      <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:9, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none', transition:'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color=C.gold}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color=C.inkMuted}>
                        <Globe style={{ width:13, height:13, color:C.gold }} /> Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick info card below CTA */}
              {(school.classesFrom || school.totalStudents || school.foundingYear) && (
                <div style={{ ...cardStyle, padding:'16px 20px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {school.classesFrom && school.classesTo && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                          <GraduationCap style={{ width:13, height:13, color:C.gold }} /> Classes
                        </span>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{school.classesFrom} – {school.classesTo}</span>
                      </div>
                    )}
                    {school.totalStudents && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                          <Users style={{ width:13, height:13, color:C.gold }} /> Students
                        </span>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{school.totalStudents.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {school.foundingYear && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                          <Calendar style={{ width:13, height:13, color:C.gold }} /> Est.
                        </span>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{school.foundingYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
