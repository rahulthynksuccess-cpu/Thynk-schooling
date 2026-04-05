'use client'
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Star, BadgeCheck, Heart, Share2,
  GitCompare, ArrowRight, GraduationCap, ExternalLink,
  BookOpen, Users, Calendar, Award, Building2,
  BookOpenCheck, Mic, X, CheckCircle2,
} from 'lucide-react'
import { School, Review } from '@/types'

const C = {
  bg: '#FAF7F2', card: '#FFFFFF', border: 'rgba(13,17,23,0.08)',
  ink: '#0D1117', inkMuted: '#5A6472', inkFaint: '#A0ADB8',
  gold: '#B8860B', goldBg: 'rgba(184,134,11,0.08)', goldBdr: 'rgba(184,134,11,0.22)',
}
const card: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 20, boxShadow: '0 2px 16px rgba(13,17,23,0.06)',
}
const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

function Tag({ label, color = 'gold' }: { label: string; color?: 'gold'|'green'|'blue'|'purple' }) {
  const map = {
    gold:   { bg: 'rgba(184,134,11,0.09)', b: 'rgba(184,134,11,0.25)', t: '#9A6F0B' },
    green:  { bg: 'rgba(22,163,74,0.09)',  b: 'rgba(22,163,74,0.25)',  t: '#15803d' },
    blue:   { bg: 'rgba(59,130,246,0.09)', b: 'rgba(59,130,246,0.25)', t: '#1d4ed8' },
    purple: { bg: 'rgba(139,92,246,0.09)', b: 'rgba(139,92,246,0.25)', t: '#6d28d9' },
  }
  const s = map[color]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', background:s.bg, border:`1px solid ${s.b}`, color:s.t, fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, padding:'5px 13px', borderRadius:100 }}>
      {label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value?: string|number|null; accent?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      background: accent ? 'linear-gradient(135deg,rgba(184,134,11,0.07),rgba(184,134,11,0.03))' : '#fff',
      border: `1px solid ${accent ? C.goldBdr : C.border}`,
      borderRadius: 14, padding: '16px 18px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background: accent ? C.goldBg : 'rgba(13,17,23,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:13, height:13, color: accent ? C.gold : C.inkFaint }} />
        </div>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.inkFaint }}>{label}</span>
      </div>
      <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:17, color: accent ? C.gold : C.ink, lineHeight:1.2 }}>{value}</div>
    </div>
  )
}

function ReviewCard({ review, i }: { review: Review; i: number }) {
  const initials = review.parentName?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'?'
  const rating = Number(review.rating)||0
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
      style={{ ...card, padding:'22px 26px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${C.goldBg},rgba(184,134,11,0.15))`, border:`1px solid ${C.goldBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:17, color:C.gold }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>{review.parentName}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint, marginTop:2 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:C.goldBg, border:`1px solid ${C.goldBdr}`, padding:'4px 10px', borderRadius:99 }}>
          <div style={{ display:'flex', gap:2 }}>
            {[1,2,3,4,5].map(s=><Star key={s} style={{ width:11,height:11, fill:s<=rating?C.gold:'transparent', color:s<=rating?C.gold:'#D0D5DB' }} />)}
          </div>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:C.gold }}>{rating}.0</span>
        </div>
      </div>
      {review.title && <h4 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:17, color:C.ink, marginBottom:6 }}>{review.title}</h4>}
      <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted, lineHeight:1.8 }}>{review.body}</p>
      {review.schoolReply && (
        <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'rgba(184,134,11,0.05)', border:`1px solid ${C.goldBdr}` }}>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.gold, marginBottom:4 }}>School Response</div>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, lineHeight:1.65 }}>{review.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

function ShareToast({ onClose }: { onClose:()=>void }) {
  return (
    <motion.div initial={{ opacity:0,y:20,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }} exit={{ opacity:0,y:20 }}
      style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:300, background:'#0D1117', color:'#fff', borderRadius:16, padding:'14px 22px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 12px 40px rgba(13,17,23,0.35)', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600 }}>
      <CheckCircle2 style={{ width:17,height:17, color:'#4ADE80' }} />
      Link copied to clipboard
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', borderRadius:6, padding:'3px 7px', color:'#fff' }}>
        <X style={{ width:12,height:12 }} />
      </button>
    </motion.div>
  )
}

function ProfileSkeleton() {
  return (
    <div style={{ background:C.bg }}>
      <div className="skeleton" style={{ height:480, borderRadius:0 }} />
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px' }}>
        <div style={{ display:'flex', gap:24, marginTop:-64, marginBottom:36 }}>
          <div className="skeleton" style={{ width:120,height:120, borderRadius:24, flexShrink:0 }} />
          <div style={{ flex:1, paddingTop:72 }}>
            <div className="skeleton" style={{ height:32, width:'40%', marginBottom:12 }} />
            <div className="skeleton" style={{ height:14, width:'28%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SchoolProfileClient({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const coverY = useTransform(scrollY, [0,500],[0,100])

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.school??d),
    staleTime: 5*60*1000,
  })
  const { data: reviews } = useQuery<{ data: Review[]; total: number }>({
    queryKey: ['school-reviews', slug],
    queryFn: () => fetch(`/api/schools/${slug}/reviews?limit=6`,{cache:'no-store'}).then(r=>r.ok?r.json():({data:[],total:0})).catch(()=>({data:[],total:0})),
    enabled: !!school,
    staleTime: 5*60*1000,
  })

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setShowShare(true)
    setTimeout(()=>setShowShare(false),2500)
  }

  if (isLoading) return <ProfileSkeleton />
  if (!school) return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:C.bg }}>
      <div style={{ fontSize:64 }}>🏫</div>
      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:32, color:C.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding:'13px 30px', borderRadius:14, background:C.ink, color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, textDecoration:'none' }}>Browse Schools</Link>
    </div>
  )

  const reviewList = reviews?.data ?? []
  const rating = Number(school.avgRating)||0

  return (
    <div style={{ background:C.bg, paddingBottom:100 }}>
      <AnimatePresence>{showShare && <ShareToast onClose={()=>setShowShare(false)} />}</AnimatePresence>

      {/* HERO */}
      <div ref={coverRef} style={{ position:'relative', height:'clamp(360px,48vw,540px)', overflow:'hidden', background:'linear-gradient(135deg,#0a0e1a,#16213e,#0f3460)' }}>
        <motion.div style={{ y:coverY, position:'absolute', inset:'-20%', insetInline:0 }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'140%', objectFit:'cover', objectPosition:'center' }} />
            : (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                {[...Array(7)].map((_,i)=>(
                  <div key={i} style={{ position:'absolute', borderRadius:'50%', border:'1px solid rgba(184,134,11,0.12)', width:`${(i+1)*160}px`, height:`${(i+1)*160}px`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
                ))}
                <GraduationCap style={{ width:100,height:100, color:'rgba(255,255,255,0.07)', position:'relative', zIndex:1 }} />
              </div>
            )
          }
        </motion.div>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,17,23,0.88) 0%,rgba(13,17,23,0.35) 50%,rgba(13,17,23,0.12) 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(13,17,23,0.45) 0%,transparent 65%)' }} />

        {/* top-right actions */}
        <div style={{ position:'absolute', top:24, right:24, display:'flex', gap:10 }}>
          {[
            { label: saved?'Saved':'Save', icon: Heart, onClick:()=>setSaved(!saved), active:saved },
            { label:'Share', icon: Share2, onClick:handleShare, active:false },
          ].map((a,i)=>(
            <motion.button key={i} whileHover={{ scale:1.05,y:-2 }} whileTap={{ scale:0.95 }}
              onClick={a.onClick}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:99, border:'1px solid rgba(255,255,255,0.2)', background:a.active?'rgba(184,134,11,0.35)':'rgba(255,255,255,0.1)', backdropFilter:'blur(16px)', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'#fff' }}>
              <a.icon style={{ width:14,height:14, fill:a.active?'#fff':'transparent', color:'#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <motion.div whileHover={{ scale:1.05,y:-2 }} whileTap={{ scale:0.95 }}>
            <Link href={`/compare?add=${school.id}`}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:99, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(184,134,11,0.28)', backdropFilter:'blur(16px)', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'#fff', textDecoration:'none' }}>
              <GitCompare style={{ width:14,height:14 }} /> Compare
            </Link>
          </motion.div>
        </div>

        {/* bottom badges */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 clamp(20px,4vw,56px) 34px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {school.isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(22,163,74,0.88)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                <BadgeCheck style={{ width:12,height:12 }} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(184,134,11,0.88)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                ★ Featured
              </span>
            )}
            {(school.board||[]).slice(0,3).map(b=>(
              <span key={b} style={{ display:'inline-flex', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* PROFILE HEADER */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(20px,4vw,56px)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:24, marginTop:-60, marginBottom:40, flexWrap:'wrap' }}>
          <motion.div
            initial={{ opacity:0, scale:0.7, y:28 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
            style={{ width:120, height:120, borderRadius:26, background:'#fff', border:`4px solid ${C.bg}`, boxShadow:'0 8px 32px rgba(13,17,23,0.2)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }} />
              : <GraduationCap style={{ width:50,height:50, color:C.gold }} />
            }
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1, duration:0.5 }} style={{ flex:1, minWidth:0, paddingBottom:8 }}>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(28px,4vw,46px)', color:C.ink, lineHeight:1.06, letterSpacing:'-0.025em', marginBottom:12 }}>
              {school.name}
            </h1>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:20 }}>
              {school.city && (
                <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted }}>
                  <MapPin style={{ width:13,height:13, color:C.gold }} />
                  {school.addressLine1?`${school.addressLine1}, `:''}{school.city}{school.state?`, ${school.state}`:''}
                </span>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background:C.goldBg, border:`1px solid ${C.goldBdr}` }}>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(s=><Star key={s} style={{ width:12,height:12, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
                </div>
                <span style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:13, color:C.gold }}>{rating.toFixed(1)}</span>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint }}>({school.totalReviews||0} reviews)</span>
              </div>
              {school.phone && (
                <a href={`tel:${school.phone}`} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none' }}>
                  <Phone style={{ width:12,height:12 }} /> {school.phone}
                </a>
              )}
              {school.websiteUrl && (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif', fontSize:13, color:C.gold, textDecoration:'none', fontWeight:600 }}>
                  <Globe style={{ width:12,height:12 }} /> Visit Website <ExternalLink style={{ width:11,height:11 }} />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* TWO-COLUMN */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr clamp(300px,27vw,360px)', gap:40, alignItems:'start' }}>

          {/* LEFT */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
            {/* Tabs */}
            <div style={{ display:'flex', gap:4, background:'rgba(13,17,23,0.04)', borderRadius:16, padding:5, border:`1px solid ${C.border}`, marginBottom:36, overflowX:'auto' }}>
              {TABS.map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  style={{ padding:'10px 22px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, whiteSpace:'nowrap', transition:'all 0.2s', flexShrink:0,
                    background: activeTab===tab?C.ink:'transparent',
                    color: activeTab===tab?'#fff':C.inkMuted,
                    boxShadow: activeTab===tab?'0 3px 10px rgba(13,17,23,0.22)':'none',
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab==='Overview' && (
                <motion.div key="ov" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }}>
                  {school.description && (
                    <div style={{ marginBottom:36 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                        <span style={{ width:4, height:28, borderRadius:2, background:C.gold, display:'block', flexShrink:0 }} />
                        <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:26, color:C.ink }}>About {school.name}</h2>
                      </div>
                      <p style={{ fontFamily:'Inter,sans-serif', fontSize:15, color:C.inkMuted, lineHeight:1.85 }}>{school.description}</p>
                    </div>
                  )}
                  <div style={{ marginBottom:36 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                      <span style={{ width:4, height:26, borderRadius:2, background:C.gold, display:'block', flexShrink:0 }} />
                      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink }}>School Details</h2>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:10 }}>
                      <StatCard icon={BookOpenCheck} label="Board"         value={(school.board||[]).join(', ')} accent />
                      <StatCard icon={Building2}    label="School Type"   value={school.schoolType} />
                      <StatCard icon={Users}        label="Gender Policy" value={school.genderPolicy} />
                      <StatCard icon={Mic}          label="Medium"        value={school.mediumOfInstruction} />
                      <StatCard icon={GraduationCap} label="Classes"      value={school.classesFrom&&school.classesTo?`${school.classesFrom} – ${school.classesTo}`:null} />
                      <StatCard icon={Calendar}     label="Established"   value={school.foundingYear} />
                      <StatCard icon={Award}        label="Recognition"   value={school.recognition} />
                      <StatCard icon={Users}        label="Students"      value={school.totalStudents?.toLocaleString('en-IN')} />
                      <StatCard icon={BookOpen}     label="Teacher Ratio" value={school.studentTeacherRatio} />
                    </div>
                  </div>
                  {[
                    { label:'🏗️ Facilities',       items:school.facilities      as string[], color:'gold'   as const },
                    { label:'⚽ Sports',            items:school.sports          as string[], color:'green'  as const },
                    { label:'🎭 Extra Curricular',  items:school.extraCurricular as string[], color:'purple' as const },
                    { label:'🗣️ Languages',        items:school.languagesOffered as string[], color:'blue'   as const },
                  ].filter(g=>g.items?.length>0).map(g=>(
                    <div key={g.label} style={{ marginBottom:28 }}>
                      <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:20, color:C.ink, marginBottom:12 }}>{g.label}</h3>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {g.items.slice(0,10).map(item=><Tag key={item} label={item} color={g.color} />)}
                        {g.items.length>10 && <Tag label={`+${g.items.length-10} more`} />}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab==='Facilities' && (
                <motion.div key="fa" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  {[
                    { title:'Facilities & Infrastructure', items:school.facilities      as string[], color:'gold'   as const, emoji:'🏗️' },
                    { title:'Sports',                      items:school.sports          as string[], color:'green'  as const, emoji:'⚽' },
                    { title:'Extra Curricular',            items:school.extraCurricular as string[], color:'purple' as const, emoji:'🎭' },
                    { title:'Languages Offered',           items:school.languagesOffered as string[], color:'blue'   as const, emoji:'🗣️' },
                  ].filter(g=>g.items?.length>0).map(g=>(
                    <div key={g.title} style={{ ...card, padding:'26px 30px' }}>
                      <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:22, color:C.ink, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                        <span>{g.emoji}</span> {g.title}
                      </h2>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {g.items.map(item=><Tag key={item} label={item} color={g.color} />)}
                      </div>
                    </div>
                  ))}
                  {!school.facilities?.length&&!school.sports?.length&&!school.extraCurricular?.length&&!school.languagesOffered?.length&&(
                    <div style={{ textAlign:'center', padding:'72px 0', fontFamily:'Inter,sans-serif', color:C.inkFaint }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🏗️</div>No facility info yet.
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab==='Fees' && (
                <motion.div key="fe" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:26, color:C.ink, marginBottom:24 }}>Fee Structure</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
                    {[
                      { label:'Monthly Fee (Min)', value:school.monthlyFeeMin?`₹${school.monthlyFeeMin.toLocaleString('en-IN')}`:null, icon:'💰' },
                      { label:'Monthly Fee (Max)', value:school.monthlyFeeMax?`₹${school.monthlyFeeMax.toLocaleString('en-IN')}`:null, icon:'💰' },
                      { label:'Annual / Admission', value:school.annualFee?`₹${school.annualFee.toLocaleString('en-IN')}`:null, icon:'📋' },
                    ].filter(f=>f.value).map(f=>(
                      <div key={f.label} style={{ background:'linear-gradient(135deg,rgba(184,134,11,0.07),rgba(184,134,11,0.03))', border:`1px solid ${C.goldBdr}`, borderRadius:20, padding:'28px 24px', textAlign:'center' }}>
                        <div style={{ fontSize:28, marginBottom:10 }}>{f.icon}</div>
                        <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{f.label}</div>
                        <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:34, color:C.gold }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:C.goldBg, border:`1px solid ${C.goldBdr}`, borderRadius:14, padding:'14px 18px', fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, lineHeight:1.65 }}>
                    ℹ️ Fees are approximate. Contact school for exact fee schedule.
                  </div>
                </motion.div>
              )}

              {activeTab==='Admission' && (
                <motion.div key="ad" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:26, color:C.ink, marginBottom:24 }}>Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {[
                        { label:'Academic Year',    value:school.admissionInfo.academicYear },
                        { label:'Status',           value:school.admissionInfo.admissionOpen?'🟢 Open':'🔴 Closed' },
                        school.admissionInfo.lastDate?{ label:'Last Date', value:school.admissionInfo.lastDate }:null,
                      ].filter(Boolean).map((row:any)=>(
                        <div key={row.label} style={{ ...card, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, color:C.inkMuted }}>{row.label}</span>
                          <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:17, color:C.ink }}>{row.value}</span>
                        </div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length>0 && (
                        <div style={{ ...card, padding:'24px 28px', marginTop:8 }}>
                          <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:20, color:C.ink, marginBottom:16 }}>Documents Required</h3>
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {school.admissionInfo.documentsRequired.map((doc:string)=>(
                              <div key={doc} style={{ display:'flex', alignItems:'center', gap:10, fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted }}>
                                <CheckCircle2 style={{ width:15,height:15, color:C.gold, flexShrink:0 }} /> {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily:'Inter,sans-serif', color:C.inkFaint, textAlign:'center', padding:64 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {activeTab==='Reviews' && (
                <motion.div key="re" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }}>
                  <div style={{ ...card, padding:'28px 32px', marginBottom:24, display:'flex', alignItems:'center', gap:36, flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:72, color:C.gold, lineHeight:1 }}>{rating.toFixed(1)}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:8 }}>
                        {[1,2,3,4,5].map(s=><Star key={s} style={{ width:15,height:15, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
                      </div>
                      <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint, marginTop:6 }}>{reviews?.total??0} reviews</div>
                    </div>
                    <div style={{ flex:1, minWidth:180 }}>
                      {[5,4,3,2,1].map(star=>{
                        const cnt = reviewList.filter(r=>Math.round(Number(r.rating))===star).length
                        const pct = reviews?.total ? Math.round((cnt/reviews.total)*100) : 0
                        return (
                          <div key={star} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                            <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted, width:8 }}>{star}</span>
                            <Star style={{ width:11,height:11, fill:C.gold, color:C.gold, flexShrink:0 }} />
                            <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(13,17,23,0.08)', overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${C.gold},#E8C547)`, borderRadius:99 }} />
                            </div>
                            <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint, width:28 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {reviewList.map((r,i)=><ReviewCard key={r.id} review={r} i={i} />)}
                    {!reviewList.length&&(
                      <div style={{ textAlign:'center', padding:'72px 0', fontFamily:'Inter,sans-serif', color:C.inkFaint }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab==='Gallery' && (
                <motion.div key="ga" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:0.22 }}>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:26, color:C.ink, marginBottom:24 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                      {school.galleryImages.map((img,i)=>(
                        <motion.div key={i} initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} transition={{ delay:i*0.06 }}
                          style={{ aspectRatio:'4/3', borderRadius:16, overflow:'hidden', background:'#e9e4dc', cursor:'pointer' }}>
                          <img src={img} alt={`Gallery ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
                            onMouseEnter={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1.07)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1)'}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'72px 0', fontFamily:'Inter,sans-serif', color:C.inkFaint }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🖼️</div>No gallery images.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT SIDEBAR */}
          <div>
            <motion.div initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.25, duration:0.5 }} style={{ position:'sticky', top:90 }}>
              <div style={{ ...card, padding:'28px 26px 24px', marginBottom:16, borderRadius:24 }}>
                {school.monthlyFeeMin && (
                  <div style={{ textAlign:'center', paddingBottom:22, marginBottom:22, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Monthly Fee From</div>
                    <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:52, color:C.gold, lineHeight:1, letterSpacing:'-2px' }}>
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginTop:10 }}>
                      {[1,2,3,4,5].map(s=><Star key={s} style={{ width:13,height:13, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted, marginLeft:4 }}>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:22 }}>
                  <Link href={`/apply/${school.id}`}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px 20px', borderRadius:16, background:'linear-gradient(135deg,#B8860B,#9A6F0B)', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 24px rgba(184,134,11,0.35)' }}>
                    Apply Now <ArrowRight style={{ width:15,height:15 }} />
                  </Link>
                  <Link href="/counselling"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 20px', borderRadius:16, border:`1.5px solid ${C.border}`, background:'transparent', color:C.ink, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    📞 Get Counselling
                  </Link>
                  <button onClick={()=>setSaved(!saved)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 20px', borderRadius:16, cursor:'pointer', border:`1.5px solid ${saved?C.gold:C.border}`, background:saved?C.goldBg:'transparent', color:saved?C.gold:C.inkMuted, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, transition:'all 0.2s' }}>
                    <Heart style={{ width:14,height:14, fill:saved?C.gold:'transparent', color:saved?C.gold:'currentColor' }} />
                    {saved?'Saved to Wishlist':'Save School'}
                  </button>
                  <Link href={`/compare?add=${school.id}`}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 20px', borderRadius:16, border:`1.5px solid ${C.border}`, background:'transparent', color:C.inkMuted, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    <GitCompare style={{ width:14,height:14 }} /> Compare School
                  </Link>
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:18 }}>
                  <div style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:11, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Contact School</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      school.phone&&{ href:`tel:${school.phone}`, icon:Phone, text:school.phone },
                      school.email&&{ href:`mailto:${school.email}`, icon:Mail, text:school.email },
                      school.websiteUrl&&{ href:school.websiteUrl, icon:Globe, text:'Visit Website', ext:true },
                    ].filter(Boolean).map((c:any,i)=>(
                      <a key={i} href={c.href} target={c.ext?'_blank':undefined} rel={c.ext?'noopener noreferrer':undefined}
                        style={{ display:'flex', alignItems:'center', gap:10, fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkMuted, textDecoration:'none', transition:'color 0.15s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.color=C.gold}
                        onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.color=C.inkMuted}>
                        <div style={{ width:30,height:30, borderRadius:8, background:C.goldBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <c.icon style={{ width:13,height:13, color:C.gold }} />
                        </div>
                        {c.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              {(school.classesFrom||school.totalStudents||school.foundingYear) && (
                <div style={{ ...card, padding:'18px 22px', borderRadius:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {school.classesFrom&&school.classesTo&&(
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}><GraduationCap style={{ width:13,height:13, color:C.gold }} /> Classes</span>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{school.classesFrom} – {school.classesTo}</span>
                      </div>
                    )}
                    {school.totalStudents&&(
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}><Users style={{ width:13,height:13, color:C.gold }} /> Students</span>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{school.totalStudents.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {school.foundingYear&&(
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}><Calendar style={{ width:13,height:13, color:C.gold }} /> Established</span>
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
