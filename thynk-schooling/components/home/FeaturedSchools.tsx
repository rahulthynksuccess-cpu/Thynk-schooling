'use client'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Star, MapPin, BadgeCheck, GraduationCap, ArrowRight } from 'lucide-react'
import { School } from '@/types'

function Skeleton() {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'14px', overflow:'hidden' }}>
      <div className="skeleton" style={{ height:'152px', borderRadius:0 }} />
      <div style={{ padding:'18px' }}>
        <div className="skeleton" style={{ height:'18px', width:'70%', marginBottom:'8px' }} />
        <div className="skeleton" style={{ height:'13px', width:'40%', marginBottom:'12px' }} />
        <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
          <div className="skeleton" style={{ height:'18px', width:'50px', borderRadius:'100px' }} />
          <div className="skeleton" style={{ height:'18px', width:'50px', borderRadius:'100px' }} />
        </div>
        <div className="skeleton" style={{ height:'13px', width:'60%' }} />
      </div>
    </div>
  )
}

function SchoolCard({ school, i }: { school: School; i: number }) {
  const COVER_BG = ['linear-gradient(135deg,#F0EAD6,#E8DCC8)','linear-gradient(135deg,#EAF0EA,#D8E8D8)','linear-gradient(135deg,#EAE8F0,#D8D4E8)','linear-gradient(135deg,#F0EAE8,#E8D8D4)']
  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.09, duration:.55 }}>
      <Link href={`/schools/${school.slug}`} className="card-hover" style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', borderRadius:'14px' }}>
        {/* Cover */}
        <div style={{ height:'152px', background: school.coverImageUrl ? undefined : COVER_BG[i % 4], position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s ease' }} loading="lazy" />
            : <GraduationCap style={{ width:'48px', height:'48px', color:'rgba(13,17,23,0.15)' }} />
          }
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,17,23,0.12) 0%, transparent 50%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'10px', left:'10px', display:'flex', gap:'5px' }}>
            {school.isVerified  && <span className="badge-green"  style={{ fontSize:'10px' }}><BadgeCheck style={{ width:'10px', height:'10px' }} /> Verified</span>}
            {school.isFeatured  && <span className="badge-gold"   style={{ fontSize:'10px' }}>★ Featured</span>}
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:'18px', display:'flex', flexDirection:'column', flex:1 }}>
          <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'15px', color:'#0D1117', lineHeight:1.25, marginBottom:'5px' }}>{school.name}</h3>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8', marginBottom:'11px' }}>
            <MapPin style={{ width:'10px', height:'10px' }} /> {school.city}
          </div>
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'13px' }}>
            {school.board.slice(0,2).map(b => <span key={b} className="badge-gold" style={{ fontSize:'10px' }}>{b}</span>)}
            {school.genderPolicy && <span className="badge-light" style={{ fontSize:'10px' }}>{school.genderPolicy}</span>}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:'12px', borderTop:'1px solid rgba(13,17,23,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <Star style={{ width:'12px', height:'12px', fill:'#B8860B', color:'#B8860B' }} />
              <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'14px', color:'#0D1117' }}>{school.avgRating.toFixed(1)}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8' }}>({school.totalReviews})</span>
            </div>
            {school.monthlyFeeMin && (
              <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'14px', color:'#B8860B' }}>
                ₹{school.monthlyFeeMin.toLocaleString('en-IN')}<span style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#A0ADB8', fontWeight:300 }}>/mo</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedSchools() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.1 })
  const { data, isLoading } = useQuery<{ data: School[] }>({
    queryKey: ['featured-schools'],
    queryFn: () => fetch('/api/schools?isFeatured=true&limit=8',{cache:'no-store'}).then(r=>r.json()).then(d=>d.data??[]),
    enabled: inView, staleTime: 5*60*1000,
  })
  const schools = data?.data ?? []

  return (
    <section ref={ref} style={{ background:'#FAF7F2', padding:'96px 0' }}>
      <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'0 clamp(20px,5vw,80px)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'24px', marginBottom:'48px' }}>
          <div>
            <div className="eyebrow">Featured Schools</div>
            <h2 className="section-title" style={{ fontSize:'48px' }}>Top Schools Across <em>India</em></h2>
          </div>
          <Link href="/schools" className="btn-outline" style={{ flexShrink:0, alignSelf:'flex-start' }}>
            View All Schools <ArrowRight style={{ width:'14px', height:'14px' }} />
          </Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
          {isLoading
            ? Array.from({ length:8 }).map((_,i) => <Skeleton key={i} />)
            : schools.map((s, i) => <SchoolCard key={s.id} school={s} i={i} />)
          }
        </div>
      </div>
    </section>
  )
}
