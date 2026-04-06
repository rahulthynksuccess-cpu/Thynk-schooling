'use client'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Globe, Star, BadgeCheck, Heart, Share2, GitCompare,
  ArrowRight, GraduationCap, ExternalLink, BookOpen, Users,
  Calendar, Award, Building2, BookOpenCheck, Mic, X,
  CheckCircle2, Sparkles, PhoneCall,
} from 'lucide-react'
import { School, Review } from '@/types'

/* ══════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════ */
const C = {
  bg:       '#F4F1EC',
  white:    '#FFFFFF',
  ink:      '#111318',
  soft:     '#525866',
  faint:    '#98A0AE',
  border:   'rgba(17,19,24,0.09)',
  borderS:  'rgba(17,19,24,0.05)',
  gold:     '#B8920A',
  goldBg:   'rgba(184,146,10,0.07)',
  goldBdr:  'rgba(184,146,10,0.22)',
  goldLt:   '#F0C94A',
  /* colour spectrum for info cards */
  palette: [
    { bg:'rgba(37,99,235,0.07)',   bdr:'rgba(37,99,235,0.2)',   txt:'#1D4ED8', ico:'#2563EB'  },
    { bg:'rgba(16,185,129,0.07)',  bdr:'rgba(16,185,129,0.2)',  txt:'#065F46', ico:'#10B981'  },
    { bg:'rgba(139,92,246,0.07)',  bdr:'rgba(139,92,246,0.2)',  txt:'#5B21B6', ico:'#7C3AED'  },
    { bg:'rgba(245,158,11,0.07)',  bdr:'rgba(245,158,11,0.2)',  txt:'#92400E', ico:'#D97706'  },
    { bg:'rgba(236,72,153,0.07)',  bdr:'rgba(236,72,153,0.2)',  txt:'#9D174D', ico:'#EC4899'  },
    { bg:'rgba(14,165,233,0.07)',  bdr:'rgba(14,165,233,0.2)',  txt:'#0C4A6E', ico:'#0EA5E9'  },
    { bg:'rgba(34,197,94,0.07)',   bdr:'rgba(34,197,94,0.2)',   txt:'#14532D', ico:'#22C55E'  },
    { bg:'rgba(249,115,22,0.07)',  bdr:'rgba(249,115,22,0.2)',  txt:'#7C2D12', ico:'#F97316'  },
  ],
}

function fmt(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    .replace('Co Educational Boys Girls','Co-Educational')
    .replace('Co Educational','Co-Educational')
    .replace(/\bCbse\b/,'CBSE').replace(/\bIcse\b/,'ICSE')
    .replace(/\bIb\b/,'IB').replace('K12','K–12')
}

const TABS = ['Overview','Facilities','Fees','Admission','Reviews','Gallery']

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}
@keyframes pulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.85;transform:scale(1.05)}}
.sk{background:linear-gradient(90deg,#EDE9E2 25%,#F4F1EC 50%,#EDE9E2 75%);background-size:400%;animation:shimmer 1.5s infinite;border-radius:12px}
`

/* ══ INFO CARD — individual colourful card per data point ══ */
function InfoCard({ icon:Icon, label, value, idx }: {
  icon:React.ElementType; label:string; value?:string|number|null; idx:number
}) {
  if (!value && value !== 0) return null
  const p = C.palette[idx % C.palette.length]
  return (
    <motion.div
      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:idx*0.05, duration:0.32, ease:[0.22,1,0.36,1] }}
      whileHover={{ y:-5, transition:{ duration:0.16 } }}
      style={{ background:p.bg, border:`1.5px solid ${p.bdr}`, borderRadius:18,
        padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'default' }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,${p.ico},transparent)`, borderRadius:'18px 18px 0 0' }} />
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:13 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.65)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon style={{ width:15, height:15, color:p.ico }} />
        </div>
        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:10, fontWeight:700,
          textTransform:'uppercase', letterSpacing:'0.1em', color:p.txt, opacity:0.72 }}>{label}</span>
      </div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:19, color:p.txt, lineHeight:1.25 }}>
        {value}
      </div>
    </motion.div>
  )
}

/* ══ CHIP ══ */
type CC = 'gold'|'green'|'blue'|'purple'|'neutral'
function Chip({ label, color='neutral' }: { label:string; color?:CC }) {
  const m: Record<CC,{bg:string;b:string;t:string}> = {
    gold:   { bg:C.goldBg,                     b:C.goldBdr,                    t:C.gold   },
    green:  { bg:'rgba(16,185,129,0.07)',       b:'rgba(16,185,129,0.22)',      t:'#065F46'},
    blue:   { bg:'rgba(37,99,235,0.07)',        b:'rgba(37,99,235,0.22)',       t:'#1D4ED8'},
    purple: { bg:'rgba(139,92,246,0.07)',       b:'rgba(139,92,246,0.22)',      t:'#5B21B6'},
    neutral:{ bg:'rgba(17,19,24,0.05)',         b:C.border,                     t:C.soft   },
  }
  const s = m[color]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', background:s.bg,
      border:`1px solid ${s.b}`, color:s.t, fontFamily:'Plus Jakarta Sans,sans-serif',
      fontSize:12, fontWeight:600, padding:'5px 13px', borderRadius:100 }}>{label}</span>
  )
}

/* ══ FACILITY TILE ══ */
const ICONS = {
  fac: ['🏊','🏋️','🔬','📖','🎨','🖥️','🍽️','🚌','⚽','🎭','📚','🏥','🎯','🎪','🤖','🔭'],
  spt: ['⚽','🏏','🏸','🏊','🎾','🏐','🏀','🤸','🥊','🏑','🎱','🏓'],
  act: ['🎭','🎵','🎨','📸','💃','🎬','🗣️','✍️','🤖','🔭','🎯','🎪'],
  lng: ['🇮🇳','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇷🇺','🇨🇳','🇸🇦','🌍','📖','✏️','🔤'],
}
function FacTile({ label, emoji, color }:{ label:string; emoji:string; color:string }) {
  return (
    <motion.div whileHover={{ y:-4 }}
      style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
        padding:'14px 10px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0,
        background:`radial-gradient(ellipse at top,${color},transparent 65%)`,
        opacity:0.28, pointerEvents:'none' }} />
      <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
      <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, fontWeight:600,
        color:C.ink, lineHeight:1.35 }}>{fmt(label)}</div>
    </motion.div>
  )
}

/* ══ REVIEW CARD ══ */
function ReviewCard({ review, i }:{ review:Review; i:number }) {
  const initials = review.parentName?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'
  const rat = Number(review.rating)||0
  const col = [C.palette[0].ico,C.palette[1].ico,C.palette[2].ico,C.palette[3].ico,C.palette[4].ico][i%5]
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:i*0.07, duration:0.38, ease:[0.22,1,0.36,1] }}
      whileHover={{ y:-3 }}
      style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:20,
        padding:'24px 26px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4,
        background:col, borderRadius:'20px 0 0 20px' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        gap:12, marginBottom:14, paddingLeft:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:col,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'DM Serif Display,serif', fontSize:16, color:'#fff', flexShrink:0 }}>{initials}</div>
          <div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:14, color:C.ink }}>
              {review.parentName}</div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, color:C.faint, marginTop:2 }}>
              {new Date(review.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:C.goldBg,
          border:`1px solid ${C.goldBdr}`, padding:'5px 11px', borderRadius:99, flexShrink:0 }}>
          {[1,2,3,4,5].map(s=><Star key={s} style={{ width:10, height:10,
            fill:s<=rat?C.gold:'transparent', color:s<=rat?C.gold:'#CCC' }} />)}
          <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
            fontWeight:700, color:C.gold, marginLeft:4 }}>{rat}.0</span>
        </div>
      </div>
      <div style={{ paddingLeft:8 }}>
        {review.title && <h4 style={{ fontFamily:'DM Serif Display,serif', fontSize:18,
          color:C.ink, marginBottom:7, lineHeight:1.25 }}>{review.title}</h4>}
        <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14,
          color:C.soft, lineHeight:1.85 }}>{review.body}</p>
        {review.schoolReply && (
          <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:C.goldBg,
            border:`1px solid ${C.goldBdr}`, borderLeft:`3px solid ${C.gold}` }}>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:10, fontWeight:700,
              color:C.gold, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.1em' }}>School Response</div>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:C.soft, lineHeight:1.7 }}>
              {review.schoolReply}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ══ TOAST ══ */
function Toast({ msg, ok, onClose }:{ msg:string; ok?:boolean; onClose:()=>void }) {
  return (
    <motion.div initial={{ opacity:0, y:28, scale:0.93 }} animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:12 }}
      style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:600,
        background:ok?'#0F4C29':C.ink, color:'#fff', borderRadius:14, padding:'12px 20px',
        display:'flex', alignItems:'center', gap:10,
        boxShadow:'0 16px 48px rgba(0,0,0,0.35)',
        fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:600,
        whiteSpace:'nowrap', border:'1px solid rgba(255,255,255,0.08)' }}>
      <CheckCircle2 style={{ width:15, height:15, color:'#4ADE80', flexShrink:0 }} />
      {msg}
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none',
        cursor:'pointer', borderRadius:6, padding:'2px 6px', color:'#fff',
        display:'flex', alignItems:'center', marginLeft:4 }}>
        <X style={{ width:10, height:10 }} />
      </button>
    </motion.div>
  )
}

/* ══ CALL MODAL ══ */
function CallModal({ school, onClose, onSuccess }:{ school:School; onClose:()=>void; onSuccess:()=>void }) {
  const [name,setName]=useState(''); const [phone,setPhone]=useState('')
  const [child,setChild]=useState(''); const [cls,setCls]=useState('')
  const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const submit = async () => {
    if(!name.trim()||!phone.trim()){setErr('Name and phone are required');return}
    if(!/^\d{10}$/.test(phone.replace(/\s/g,''))){setErr('Enter a valid 10-digit number');return}
    setLoading(true);setErr('')
    try {
      const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({schoolId:school.id,action:'request_call',parentName:name,phone,
          childName:child,classApplyingFor:cls,source:'request_call'})})
      if(!r.ok) throw new Error()
      onSuccess();onClose()
    } catch{setErr('Something went wrong. Please try again.')}
    finally{setLoading(false)}
  }
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, background:'rgba(17,19,24,0.65)', backdropFilter:'blur(12px)',
        zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{ scale:0.88, y:32, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
        exit={{ scale:0.93, opacity:0 }} transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
        style={{ background:C.white, borderRadius:28, padding:'40px', width:'100%', maxWidth:460,
          boxShadow:'0 40px 120px rgba(17,19,24,0.28)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,transparent,${C.gold},${C.goldLt},${C.gold},transparent)` }} />
        <button onClick={onClose} style={{ position:'absolute', top:18, right:18,
          background:'rgba(17,19,24,0.05)', border:'none', cursor:'pointer', borderRadius:9,
          width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X style={{ width:13, height:13, color:C.soft }} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:15,
            background:`linear-gradient(135deg,${C.gold},#7A5C00)`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PhoneCall style={{ width:20, height:20, color:'#fff' }} />
          </div>
          <div>
            <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:C.ink, lineHeight:1.1 }}>
              Request a Call Back</h2>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
              color:C.faint, marginTop:3 }}>{school.name} will call within 24 hours</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            {label:'Your Name *',       val:name,  set:setName,  ph:'Full name',            t:'text'},
            {label:'Mobile Number *',   val:phone, set:setPhone, ph:'10-digit mobile',       t:'tel' },
            {label:"Child's Name",      val:child, set:setChild, ph:'Optional',              t:'text'},
            {label:'Applying for Class',val:cls,   set:setCls,   ph:'e.g. Grade 5, Nursery', t:'text'},
          ].map(f=>(
            <div key={f.label}>
              <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:10, fontWeight:700,
                color:C.faint, display:'block', marginBottom:5, textTransform:'uppercase',
                letterSpacing:'0.07em' }}>{f.label}</label>
              <input type={f.t} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{ width:'100%', padding:'11px 14px', borderRadius:11,
                  border:`1.5px solid ${C.border}`, fontFamily:'Plus Jakarta Sans,sans-serif',
                  fontSize:14, color:C.ink, outline:'none', background:'#FAFAF8',
                  transition:'border-color 0.16s' }}
                onFocus={e=>(e.currentTarget.style.borderColor=C.gold)}
                onBlur={e=>(e.currentTarget.style.borderColor=C.border)} />
            </div>
          ))}
        </div>
        {err&&<div style={{ marginTop:10, padding:'9px 13px', borderRadius:9,
          background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)',
          fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#B91C1C' }}>{err}</div>}
        <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}
          onClick={submit} disabled={loading}
          style={{ marginTop:22, width:'100%', padding:'15px', borderRadius:15, border:'none',
            background:loading?'#ccc':`linear-gradient(135deg,${C.gold},#7A5C00)`,
            color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700,
            cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:8 }}>
          {loading?'Submitting…':<><PhoneCall style={{ width:15, height:15 }} /> Request Call Back</>}
        </motion.button>
        <p style={{ marginTop:12, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
          color:C.faint, textAlign:'center', lineHeight:1.6 }}>
          🔒 Info shared only with this school · Protected by our privacy policy</p>
      </motion.div>
    </motion.div>
  )
}

/* ══ SKELETON ══ */
function Skel() {
  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div className="sk" style={{ height:260, borderRadius:0 }} />
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 40px', marginTop:32 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:36 }}>
          <div>
            <div className="sk" style={{ height:50, borderRadius:14, marginBottom:28 }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
              {[1,2,3,4].map(i=><div key={i} className="sk" style={{ height:90 }} />)}
            </div>
            <div className="sk" style={{ height:200, borderRadius:20 }} />
          </div>
          <div className="sk" style={{ height:440, borderRadius:24 }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function SchoolProfileClient({ slug }:{ slug:string }) {
  const [tab,   setTab]   = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{msg:string;ok?:boolean}|null>(null)
  const [modal, setModal] = useState(false)

  const { data:school, isLoading } = useQuery<School>({
    queryKey:['school',slug],
    queryFn:()=>fetch(`/api/schools/${slug}`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.school??d),
    staleTime:5*60*1000,
  })
  const { data:reviews } = useQuery<{data:Review[];total:number}>({
    queryKey:['reviews',school?.slug??slug],
    queryFn:()=>fetch(`/api/schools/${school?.slug??slug}/reviews?limit=6`,{cache:'no-store'})
      .then(r=>r.ok?r.json():{data:[],total:0}).catch(()=>({data:[],total:0})),
    enabled:!!school,
    staleTime:5*60*1000,
  })

  const lead = useCallback(async(src:string,id:string)=>{
    try{await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({schoolId:id,action:'create_lead',source:src})})}catch{}
  },[])

  const handleSave = () => {
    if(!saved&&school) lead('save',school.id)
    setSaved(!saved)
    if(!saved) setToast({msg:'Saved to your wishlist ✦',ok:true})
  }
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setToast({msg:'Link copied to clipboard'})
  }

  if(isLoading) return <Skel />
  if(!school) return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:16, background:C.bg }}>
      <style>{CSS}</style>
      <div style={{ fontSize:72 }}>🏫</div>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:34, color:C.ink }}>School Not Found</h2>
      <Link href="/schools" style={{ padding:'12px 28px', borderRadius:13, background:C.ink,
        color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600,
        fontSize:14, textDecoration:'none' }}>Browse Schools</Link>
    </div>
  )

  const list   = reviews?.data ?? []
  const rating = Number(school.avgRating) || 0
  const boards = school.board || []
  const yrsOld = school.foundingYear ? new Date().getFullYear()-school.foundingYear : 0
  const loc    = [school.addressLine1,school.city,school.state].filter(Boolean).join(', ')

  return (
    <div style={{ background:C.bg, paddingBottom:100 }}>
      <style>{CSS}</style>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)} />}
        {modal && <CallModal school={school} onClose={()=>setModal(false)}
          onSuccess={()=>setToast({msg:'Request submitted! School will call you soon.',ok:true})} />}
      </AnimatePresence>

      {/* ════════════════════════════════
          HERO — compact, one band only
          Everything shown here is UNIQUE
          and appears NOWHERE else
      ════════════════════════════════ */}
      <div style={{ position:'relative', overflow:'hidden',
        background:'linear-gradient(160deg,#0A0C12 0%,#141928 60%,#0E1620 100%)' }}>

        {/* background */}
        {school.coverImageUrl
          ? <div style={{ position:'absolute', inset:0 }}>
              <img src={school.coverImageUrl} alt=""
                style={{ width:'100%', height:'100%', objectFit:'cover',
                  filter:'brightness(0.26) saturate(0.6)' }} />
            </div>
          : [260,440,600].map((s,i)=>(
              <div key={i} style={{ position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)', width:s, height:s, borderRadius:'50%',
                border:`1px solid rgba(184,146,10,${0.14-i*0.04})`,
                animation:`pulse ${5+i*2}s ease-in-out ${i*0.6}s infinite`,
                pointerEvents:'none' }} />
            ))
        }
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top,rgba(10,12,18,1) 0%,rgba(10,12,18,0.4) 55%,transparent 100%)',
          pointerEvents:'none' }} />

        {/* action pills — top right */}
        <div style={{ position:'absolute', top:18, right:18, display:'flex', gap:7, zIndex:10 }}>
          {([
            {label:saved?'Saved':'Save', icon:Heart,   fn:handleSave, on:saved, isHeart:true},
            {label:'Share',             icon:Share2,   fn:handleShare,on:false, isHeart:false},
          ] as const).map((a,i)=>(
            <motion.button key={i} whileHover={{ scale:1.07, y:-2 }} whileTap={{ scale:0.92 }}
              onClick={a.fn}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px',
                borderRadius:99, cursor:'pointer',
                border:`1px solid ${a.on?C.goldBdr:'rgba(255,255,255,0.15)'}`,
                background:a.on?'rgba(184,146,10,0.28)':'rgba(255,255,255,0.07)',
                backdropFilter:'blur(20px)', fontFamily:'Plus Jakarta Sans,sans-serif',
                fontSize:12, fontWeight:600, color:'#fff' }}>
              <a.icon style={{ width:12, height:12,
                fill:a.isHeart&&saved?'#fff':'transparent', color:'#fff' }} />
              {a.label}
            </motion.button>
          ))}
          <Link href={`/compare?add=${school.id}`} onClick={()=>lead('compare',school.id)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:99,
              border:`1px solid ${C.goldBdr}`, background:'rgba(184,146,10,0.18)',
              backdropFilter:'blur(20px)', fontFamily:'Plus Jakarta Sans,sans-serif',
              fontSize:12, fontWeight:600, color:'#fff', textDecoration:'none' }}>
            <GitCompare style={{ width:12, height:12 }} /> Compare
          </Link>
        </div>

        {/* Hero body */}
        <div style={{ position:'relative', zIndex:5,
          padding:'clamp(56px,9vw,84px) clamp(24px,5vw,64px) 38px' }}>

          {/* Logo + name */}
          <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:18 }}>
            <div style={{ width:68, height:68, borderRadius:17, background:C.white,
              boxShadow:'0 8px 30px rgba(0,0,0,0.3)', overflow:'hidden', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {school.logoUrl
                ? <img src={school.logoUrl} alt={school.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }} />
                : <GraduationCap style={{ width:32, height:32, color:C.gold }} />}
            </div>
            <div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:9 }}>
                {school.isVerified && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                    background:'rgba(16,185,129,0.85)', backdropFilter:'blur(12px)', color:'#fff',
                    fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:100,
                    fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                    <BadgeCheck style={{ width:10, height:10 }} /> Verified
                  </span>
                )}
                {school.isFeatured && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                    background:'rgba(184,146,10,0.88)', backdropFilter:'blur(12px)', color:'#fff',
                    fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:100,
                    fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                    <Sparkles style={{ width:10, height:10 }} /> Featured
                  </span>
                )}
                {boards.map(b=>(
                  <span key={b} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
                    color:'#fff', border:'1px solid rgba(255,255,255,0.22)', fontSize:11,
                    fontWeight:600, padding:'3px 10px', borderRadius:100,
                    fontFamily:'Plus Jakarta Sans,sans-serif' }}>{b}</span>
                ))}
              </div>
              <h1 style={{ fontFamily:'DM Serif Display,serif',
                fontSize:'clamp(26px,4.5vw,50px)', color:'#fff',
                lineHeight:1.0, letterSpacing:'-0.025em',
                textShadow:'0 2px 24px rgba(0,0,0,0.5)' }}>
                {school.name}
              </h1>
            </div>
          </div>

          {/* Meta pills — single source of truth */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {loc && (
              <span style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(255,255,255,0.08)', backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.82)',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
                padding:'5px 12px', borderRadius:99 }}>
                <MapPin style={{ width:11, height:11 }} />{loc}
              </span>
            )}
            {school.foundingYear && (
              <span style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(255,255,255,0.08)', backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.82)',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
                padding:'5px 12px', borderRadius:99 }}>
                <Calendar style={{ width:11, height:11 }} />
                Est. {school.foundingYear}{yrsOld>0?` · ${yrsOld} yrs`:''}
              </span>
            )}
            {school.classesFrom && school.classesTo && (
              <span style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(255,255,255,0.08)', backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.82)',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
                padding:'5px 12px', borderRadius:99 }}>
                <GraduationCap style={{ width:11, height:11 }} />
                {fmt(String(school.classesFrom))} – {fmt(String(school.classesTo))}
              </span>
            )}
            {rating>0 && (
              <span style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(184,146,10,0.22)', backdropFilter:'blur(10px)',
                border:`1px solid ${C.goldBdr}`, color:C.goldLt,
                fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, fontWeight:600,
                padding:'5px 12px', borderRadius:99 }}>
                <Star style={{ width:11, height:11, fill:C.goldLt, color:C.goldLt }} />
                {rating.toFixed(1)} · {school.totalReviews??0} reviews
              </span>
            )}
            {school.websiteUrl && (
              <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:5,
                  background:'rgba(184,146,10,0.22)', backdropFilter:'blur(10px)',
                  border:`1px solid ${C.goldBdr}`, color:C.goldLt,
                  fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, fontWeight:600,
                  padding:'5px 12px', borderRadius:99, textDecoration:'none' }}>
                <Globe style={{ width:11, height:11 }} /> Website
                <ExternalLink style={{ width:10, height:10 }} />
              </a>
            )}
          </div>
        </div>
        <div style={{ height:1, background:`linear-gradient(to right,transparent,${C.gold}55,transparent)` }} />
      </div>

      {/* ════════════════════════════════
          PAGE BODY
      ════════════════════════════════ */}
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 clamp(20px,4vw,56px)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr clamp(300px,27vw,355px)',
          gap:40, alignItems:'start', marginTop:36 }}>

          {/* ── LEFT CONTENT ── */}
          <div>
            {/* Tab bar */}
            <div style={{ display:'flex', gap:2, background:'rgba(17,19,24,0.04)',
              borderRadius:16, padding:4, border:`1px solid ${C.border}`,
              marginBottom:32, overflowX:'auto' }}>
              {TABS.map(t=>(
                <motion.button key={t} onClick={()=>setTab(t)} whileTap={{ scale:0.95 }}
                  style={{ padding:'9px 18px', borderRadius:12, border:'none', cursor:'pointer',
                    fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:600,
                    whiteSpace:'nowrap', flexShrink:0,
                    background:tab===t?C.ink:'transparent',
                    color:tab===t?'#fff':C.faint,
                    boxShadow:tab===t?'0 4px 14px rgba(17,19,24,0.18)':'none',
                    transition:'all 0.2s' }}>
                  {t}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {tab==='Overview' && (
                <motion.div key="ov" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>

                  {school.description && (
                    <div style={{ marginBottom:32, padding:'24px 26px', background:C.white,
                      border:`1px solid ${C.goldBdr}`, borderRadius:20,
                      position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                        background:`linear-gradient(to right,${C.gold},transparent)` }} />
                      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:11 }}>
                        <div style={{ width:30, height:30, borderRadius:9, background:C.goldBg,
                          border:`1px solid ${C.goldBdr}`, display:'flex', alignItems:'center',
                          justifyContent:'center' }}>
                          <BookOpen style={{ width:13, height:13, color:C.gold }} />
                        </div>
                        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.ink }}>
                          About the School</h2>
                      </div>
                      <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14,
                        color:C.soft, lineHeight:1.9 }}>{school.description}</p>
                    </div>
                  )}

                  {/* ══ COLOURFUL CARD GRID — one card per data point ══ */}
                  <div style={{ marginBottom:36 }}>
                    <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:C.ink,
                      marginBottom:18 }}>School Details</h2>
                    <div style={{ display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:12 }}>
                      {boards.length>0 &&
                        <InfoCard icon={BookOpenCheck} label="Board"
                          value={boards.join(', ')} idx={0} />}
                      {school.foundingYear &&
                        <InfoCard icon={Calendar} label="Founded"
                          value={`${school.foundingYear}${yrsOld>0?` · ${yrsOld} yrs`:''}`} idx={1} />}
                      {school.schoolType &&
                        <InfoCard icon={Building2} label="School Type"
                          value={fmt(school.schoolType)} idx={2} />}
                      {school.genderPolicy &&
                        <InfoCard icon={Users} label="Gender Policy"
                          value={fmt(school.genderPolicy)} idx={3} />}
                      {school.mediumOfInstruction &&
                        <InfoCard icon={Mic} label="Medium"
                          value={fmt(school.mediumOfInstruction)} idx={4} />}
                      {school.classesFrom && school.classesTo &&
                        <InfoCard icon={GraduationCap} label="Classes"
                          value={`${fmt(String(school.classesFrom))} – ${fmt(String(school.classesTo))}`}
                          idx={5} />}
                      {school.totalStudents &&
                        <InfoCard icon={Users} label="Students"
                          value={school.totalStudents.toLocaleString('en-IN')} idx={6} />}
                      {school.studentTeacherRatio &&
                        <InfoCard icon={BookOpen} label="Student : Teacher"
                          value={school.studentTeacherRatio} idx={7} />}
                      {school.recognition &&
                        <InfoCard icon={Award} label="Recognition"
                          value={school.recognition} idx={0} />}
                    </div>
                  </div>

                  {/* Tag groups */}
                  {([
                    {label:'Facilities',       emoji:'🏗️', items:school.facilities      as string[], col:'gold'   as CC},
                    {label:'Sports',           emoji:'⚽', items:school.sports           as string[], col:'green'  as CC},
                    {label:'Extra Curricular', emoji:'🎭', items:school.extraCurricular  as string[], col:'purple' as CC},
                    {label:'Languages',        emoji:'🗣️', items:school.languagesOffered as string[], col:'blue'   as CC},
                  ] as const).filter(g=>g.items?.length>0).map(g=>(
                    <div key={g.label} style={{ marginBottom:24 }}>
                      <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700,
                        fontSize:13, color:C.faint, textTransform:'uppercase',
                        letterSpacing:'0.1em', marginBottom:11,
                        display:'flex', alignItems:'center', gap:7 }}>
                        <span style={{ fontSize:15 }}>{g.emoji}</span>{g.label}
                      </h3>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {g.items.slice(0,14).map(item=><Chip key={item} label={fmt(item)} color={g.col} />)}
                        {g.items.length>14 && <Chip label={`+${g.items.length-14} more`} />}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── FACILITIES ── */}
              {tab==='Facilities' && (
                <motion.div key="fa" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>
                  {[
                    {title:'Infrastructure & Facilities', items:school.facilities      as string[], color:'rgba(184,146,10,0.12)',  icons:ICONS.fac},
                    {title:'Sports',                      items:school.sports           as string[], color:'rgba(16,185,129,0.12)', icons:ICONS.spt},
                    {title:'Extra Curricular',            items:school.extraCurricular  as string[], color:'rgba(139,92,246,0.12)', icons:ICONS.act},
                    {title:'Languages Offered',           items:school.languagesOffered as string[], color:'rgba(37,99,235,0.12)',  icons:ICONS.lng},
                  ].filter(g=>g.items?.length>0).map((g,gi)=>(
                    <motion.div key={g.title} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:gi*0.08 }} style={{ marginBottom:28 }}>
                      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.ink,
                        marginBottom:14 }}>{g.title}</h2>
                      <div style={{ display:'grid',
                        gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))', gap:10 }}>
                        {g.items.map((item,ii)=>(
                          <FacTile key={item} label={item}
                            emoji={g.icons[ii%g.icons.length]} color={g.color} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {!school.facilities?.length&&!school.sports?.length&&
                   !school.extraCurricular?.length&&!school.languagesOffered?.length && (
                    <div style={{ textAlign:'center', padding:'80px 0',
                      fontFamily:'Plus Jakarta Sans,sans-serif', color:C.faint }}>
                      <div style={{ fontSize:52, marginBottom:12 }}>🏗️</div>No facility info yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FEES ── */}
              {tab==='Fees' && (
                <motion.div key="fe" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>
                  <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:C.ink, marginBottom:6 }}>
                    Fee Structure</h2>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:C.faint, marginBottom:24 }}>
                    Approximate fees — contact school for the official schedule</p>
                  <div style={{ display:'grid',
                    gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:20 }}>
                    {[
                      {label:'Monthly Fee (From)',val:school.monthlyFeeMin,dark:true, icon:'📅'},
                      {label:'Monthly Fee (To)',  val:school.monthlyFeeMax,dark:false,icon:'📈'},
                      {label:'Annual / Admission',val:school.annualFee,    dark:false,icon:'📋'},
                    ].filter(f=>f.val).map((f,i)=>(
                      <motion.div key={f.label}
                        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.09 }}
                        whileHover={{ y:-5, transition:{ duration:0.18 } }}
                        style={{ background:f.dark?'linear-gradient(145deg,#0A0C12,#141928)':C.white,
                          border:`1.5px solid ${f.dark?C.goldBdr:C.border}`,
                          borderRadius:22, padding:'28px 22px', textAlign:'center',
                          position:'relative', overflow:'hidden', cursor:'default' }}>
                        {f.dark && <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                          background:`linear-gradient(90deg,transparent,${C.gold},transparent)` }} />}
                        <div style={{ fontSize:32, marginBottom:10 }}>{f.icon}</div>
                        <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:10,
                          fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
                          color:f.dark?'rgba(255,255,255,0.35)':C.faint, marginBottom:8 }}>{f.label}</div>
                        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:38,
                          color:f.dark?C.goldLt:C.gold, lineHeight:1, letterSpacing:'-2px' }}>
                          ₹{(f.val as number).toLocaleString('en-IN')}
                        </div>
                        {f.dark && <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                          color:'rgba(255,255,255,0.22)', marginTop:6 }}>per month</div>}
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ background:C.goldBg, border:`1px solid ${C.goldBdr}`,
                    borderRadius:13, padding:'13px 17px', fontFamily:'Plus Jakarta Sans,sans-serif',
                    fontSize:13, color:C.soft }}>
                    ℹ️ Fee details are indicative. Contact the school for the official schedule.
                  </div>
                </motion.div>
              )}

              {/* ── ADMISSION ── */}
              {tab==='Admission' && (
                <motion.div key="ad" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>
                  <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:C.ink, marginBottom:24 }}>
                    Admission Information</h2>
                  {school.admissionInfo ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {[
                        {label:'Academic Year',val:school.admissionInfo.academicYear,         icon:'📅'},
                        {label:'Status',       val:school.admissionInfo.admissionOpen?'🟢 Open':'🔴 Closed',icon:'🚪'},
                        school.admissionInfo.lastDate
                          ?{label:'Last Date',val:school.admissionInfo.lastDate,icon:'⏰'}:null,
                      ].filter(Boolean).map((row:any)=>(
                        <motion.div key={row.label} whileHover={{ x:4 }}
                          style={{ background:C.white, border:`1px solid ${C.border}`,
                            borderRadius:16, padding:'15px 22px', display:'flex',
                            alignItems:'center', gap:12, justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:17 }}>{row.icon}</span>
                            <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif',
                              fontWeight:600, fontSize:14, color:C.soft }}>{row.label}</span>
                          </div>
                          <span style={{ fontFamily:'DM Serif Display,serif',
                            fontSize:18, color:C.ink }}>{row.val}</span>
                        </motion.div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length>0 && (
                        <div style={{ background:C.white, border:`1px solid ${C.border}`,
                          borderRadius:18, padding:'22px 24px', marginTop:6 }}>
                          <h3 style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:C.ink,
                            marginBottom:14 }}>Documents Required</h3>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {school.admissionInfo.documentsRequired.map((doc:string,i:number)=>(
                              <motion.div key={doc} initial={{ opacity:0, x:-10 }}
                                animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                                style={{ display:'flex', alignItems:'center', gap:11,
                                  padding:'9px 13px', borderRadius:11,
                                  background:'rgba(17,19,24,0.025)', border:`1px solid ${C.borderS}` }}>
                                <div style={{ width:20, height:20, borderRadius:6, background:C.goldBg,
                                  border:`1px solid ${C.goldBdr}`, display:'flex',
                                  alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  <CheckCircle2 style={{ width:11, height:11, color:C.gold }} />
                                </div>
                                <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif',
                                  fontSize:14, color:C.soft }}>{doc}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:C.faint,
                        textAlign:'center', padding:72 }}>Admission details not available.</p>}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {tab==='Reviews' && (
                <motion.div key="re" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>
                  <div style={{ background:'linear-gradient(145deg,#0A0C12,#141928)',
                    borderRadius:22, padding:'28px 32px', marginBottom:24,
                    display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
                    position:'relative', overflow:'hidden',
                    border:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                      background:`linear-gradient(90deg,transparent,${C.gold},transparent)` }} />
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }}
                        transition={{ duration:0.5 }}
                        style={{ fontFamily:'DM Serif Display,serif', fontSize:80,
                          color:C.goldLt, lineHeight:1, letterSpacing:'-3px' }}>
                        {rating.toFixed(1)}
                      </motion.div>
                      <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:8 }}>
                        {[1,2,3,4,5].map(s=>(
                          <Star key={s} style={{ width:15, height:15,
                            fill:s<=Math.round(rating)?C.goldLt:'transparent',
                            color:s<=Math.round(rating)?C.goldLt:'rgba(255,255,255,0.18)' }} />
                        ))}
                      </div>
                      <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                        color:'rgba(255,255,255,0.3)', marginTop:6 }}>{reviews?.total??0} reviews</div>
                    </div>
                    <div style={{ flex:1, minWidth:160 }}>
                      {[5,4,3,2,1].map((star,si)=>{
                        const cnt=list.filter(r=>Math.round(Number(r.rating))===star).length
                        const pct=reviews?.total?Math.round((cnt/reviews.total)*100):0
                        return (
                          <div key={star} style={{ display:'flex', alignItems:'center',
                            gap:9, marginBottom:si<4?10:0 }}>
                            <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                              color:'rgba(255,255,255,0.38)', width:10 }}>{star}</span>
                            <Star style={{ width:10, height:10, fill:C.gold, color:C.gold, flexShrink:0 }} />
                            <div style={{ flex:1, height:6, borderRadius:99,
                              background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                              <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                                transition={{ delay:0.4+si*0.08, duration:0.7, ease:'easeOut' }}
                                style={{ height:'100%',
                                  background:`linear-gradient(90deg,${C.gold},${C.goldLt})`,
                                  borderRadius:99 }} />
                            </div>
                            <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:10,
                              color:'rgba(255,255,255,0.25)', width:26 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {list.map((r,i)=><ReviewCard key={r.id} review={r} i={i} />)}
                    {!list.length && (
                      <div style={{ textAlign:'center', padding:'80px 0',
                        fontFamily:'Plus Jakarta Sans,sans-serif', color:C.faint }}>
                        <div style={{ fontSize:52, marginBottom:12 }}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── GALLERY ── */}
              {tab==='Gallery' && (
                <motion.div key="ga" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>
                  <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:C.ink,
                    marginBottom:20 }}>School Gallery</h2>
                  {school.galleryImages?.length ? (
                    <div style={{ display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                      {school.galleryImages.map((img:string,i:number)=>(
                        <motion.div key={i} initial={{ opacity:0, scale:0.94 }}
                          animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.05 }}
                          whileHover={{ scale:1.03 }}
                          style={{ aspectRatio:'4/3', borderRadius:16,
                            overflow:'hidden', background:'#EDE9E2', cursor:'pointer' }}>
                          <img src={img} alt={`${i+1}`} loading="lazy"
                            style={{ width:'100%', height:'100%', objectFit:'cover',
                              transition:'transform 0.5s ease' }}
                            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.08)')}
                            onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'80px 0',
                      fontFamily:'Plus Jakarta Sans,sans-serif', color:C.faint }}>
                      <div style={{ fontSize:52, marginBottom:12 }}>🖼️</div>No gallery images yet.
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── RIGHT SIDEBAR — CTA only, zero data duplication ── */}
          <div>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:0.22, duration:0.5 }}
              style={{ position:'sticky', top:86 }}>

              {/* CTA card */}
              <div style={{ background:'linear-gradient(155deg,#0A0C12 0%,#141928 100%)',
                borderRadius:26, overflow:'hidden', position:'relative',
                padding:'30px 22px 22px', marginBottom:12,
                boxShadow:'0 24px 60px rgba(10,12,18,0.32)',
                border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                  background:`linear-gradient(90deg,transparent,${C.gold},${C.goldLt},${C.gold},transparent)` }} />
                <div style={{ position:'absolute', bottom:-40, left:'50%',
                  transform:'translateX(-50%)', width:150, height:150, borderRadius:'50%',
                  background:'radial-gradient(circle,rgba(184,146,10,0.1),transparent 70%)',
                  pointerEvents:'none' }} />

                {/* fee */}
                {school.monthlyFeeMin && (
                  <div style={{ textAlign:'center', paddingBottom:18, marginBottom:18,
                    borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:9, fontWeight:700,
                      color:'rgba(255,255,255,0.3)', textTransform:'uppercase',
                      letterSpacing:'0.16em', marginBottom:7 }}>Monthly Fee Starting</div>
                    <motion.div initial={{ scale:0.8, opacity:0 }}
                      animate={{ scale:1, opacity:1 }} transition={{ delay:0.34, duration:0.4 }}
                      style={{ fontFamily:'DM Serif Display,serif', fontSize:48,
                        color:C.goldLt, lineHeight:1, letterSpacing:'-3px' }}>
                      ₹{school.monthlyFeeMin.toLocaleString('en-IN')}
                    </motion.div>
                    {rating>0 && (
                      <div style={{ display:'flex', alignItems:'center',
                        justifyContent:'center', gap:3, marginTop:9 }}>
                        {[1,2,3,4,5].map(s=>(
                          <Star key={s} style={{ width:11, height:11,
                            fill:s<=Math.round(rating)?C.gold:'transparent',
                            color:s<=Math.round(rating)?C.gold:'rgba(255,255,255,0.14)' }} />
                        ))}
                        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                          color:'rgba(255,255,255,0.38)', marginLeft:5 }}>
                          {rating.toFixed(1)} rating</span>
                      </div>
                    )}
                  </div>
                )}

                {/* admission status */}
                {school.admissionInfo?.admissionOpen !== undefined && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                    borderRadius:10, marginBottom:13,
                    background:school.admissionInfo.admissionOpen
                      ?'rgba(16,185,129,0.1)':'rgba(220,38,38,0.08)',
                    border:`1px solid ${school.admissionInfo.admissionOpen
                      ?'rgba(16,185,129,0.28)':'rgba(220,38,38,0.22)'}` }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
                      background:school.admissionInfo.admissionOpen?'#10B981':'#EF4444',
                      boxShadow:`0 0 6px ${school.admissionInfo.admissionOpen?'#10B981':'#EF4444'}` }} />
                    <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600,
                      fontSize:12, color:school.admissionInfo.admissionOpen
                        ?'#6EE7B7':'#FCA5A5' }}>
                      Admissions {school.admissionInfo.admissionOpen?'Open Now':'Currently Closed'}
                    </span>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <motion.div whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.97 }}>
                    <Link href={`/apply/${school.id}`}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center',
                        gap:8, padding:'15px 20px', borderRadius:15,
                        background:`linear-gradient(135deg,${C.gold},#7A5C00)`,
                        color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif',
                        fontSize:15, fontWeight:700, textDecoration:'none',
                        boxShadow:`0 10px 28px rgba(184,146,10,0.28)`,
                        letterSpacing:'0.01em' }}>
                      Apply Now <ArrowRight style={{ width:15, height:15 }} />
                    </Link>
                  </motion.div>

                  <motion.button whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.97 }}
                    onClick={()=>setModal(true)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center',
                      gap:8, padding:'12px 20px', borderRadius:15,
                      border:`1.5px solid ${C.goldBdr}`, background:'rgba(184,146,10,0.09)',
                      color:C.goldLt, fontFamily:'Plus Jakarta Sans,sans-serif',
                      fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    <PhoneCall style={{ width:13, height:13 }} /> Request Call Back
                  </motion.button>

                  <Link href="/counselling"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center',
                      gap:8, padding:'11px 20px', borderRadius:15,
                      border:'1.5px solid rgba(255,255,255,0.08)',
                      background:'transparent', color:'rgba(255,255,255,0.52)',
                      fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13,
                      fontWeight:500, textDecoration:'none' }}>
                    🎓 Get Expert Counselling
                  </Link>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <button onClick={handleSave}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center',
                        gap:6, padding:'10px', borderRadius:13, cursor:'pointer',
                        border:`1.5px solid ${saved?C.goldBdr:'rgba(255,255,255,0.08)'}`,
                        background:saved?'rgba(184,146,10,0.12)':'transparent',
                        color:saved?C.goldLt:'rgba(255,255,255,0.42)',
                        fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, fontWeight:600 }}>
                      <Heart style={{ width:12, height:12,
                        fill:saved?C.goldLt:'transparent' }} />
                      {saved?'Saved':'Save'}
                    </button>
                    <Link href={`/compare?add=${school.id}`}
                      onClick={()=>lead('compare',school.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center',
                        gap:6, padding:'10px', borderRadius:13,
                        border:'1.5px solid rgba(255,255,255,0.08)',
                        background:'transparent', color:'rgba(255,255,255,0.42)',
                        fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12,
                        fontWeight:600, textDecoration:'none' }}>
                      <GitCompare style={{ width:12, height:12 }} /> Compare
                    </Link>
                  </div>
                </div>
              </div>

              {/* Verified / Featured badge card — only if applicable */}
              {(school.isVerified||school.isFeatured) && (
                <div style={{ background:C.white, border:`1px solid ${C.border}`,
                  borderRadius:20, padding:'18px 20px', overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                    background:`linear-gradient(to right,${C.gold},transparent)` }} />
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700,
                    fontSize:9, color:C.faint, textTransform:'uppercase',
                    letterSpacing:'0.16em', marginBottom:12 }}>Verified Info</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {school.isVerified && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                        borderRadius:11, background:'rgba(16,185,129,0.06)',
                        border:'1px solid rgba(16,185,129,0.18)' }}>
                        <BadgeCheck style={{ width:15, height:15, color:'#10B981', flexShrink:0 }} />
                        <div>
                          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600,
                            fontSize:13, color:'#065F46' }}>Verified School</div>
                          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                            color:C.faint }}>Details confirmed by our team</div>
                        </div>
                      </div>
                    )}
                    {school.isFeatured && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                        borderRadius:11, background:C.goldBg, border:`1px solid ${C.goldBdr}` }}>
                        <Sparkles style={{ width:14, height:14, color:C.gold, flexShrink:0 }} />
                        <div>
                          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600,
                            fontSize:13, color:C.gold }}>Featured School</div>
                          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11,
                            color:C.faint }}>Top-rated in your area</div>
                        </div>
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
