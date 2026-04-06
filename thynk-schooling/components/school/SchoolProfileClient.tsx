'use client'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Star, BadgeCheck, Heart, Share2, GitCompare,
  ArrowRight, GraduationCap, BookOpen, Users, Calendar,
  Award, Building2, BookOpenCheck, Mic, X, CheckCircle2,
  Sparkles, PhoneCall, TrendingUp,
} from 'lucide-react'
import { School, Review } from '@/types'

/* ══════════════════════════════════════════════════════════
   DESIGN SYSTEM
══════════════════════════════════════════════════════════ */
const D = {
  // Backgrounds
  pageBg:    '#F5F0E8',
  cardBg:    '#FFFFFF',
  heroBg:    '#07090F',
  // Typography
  heading:   '#0C0E14',
  body:      '#3C4353',
  muted:     '#6B7280',
  faint:     '#9CA3AF',
  // Brand gold
  gold:      '#B8860B',
  goldBright:'#D4A017',
  goldLight: '#F5E6B8',
  goldPale:  '#FDF8EC',
  goldRing:  'rgba(184,134,11,0.25)',
  // Borders & shadows
  border:    'rgba(12,14,20,0.09)',
  shadow:    '0 1px 16px rgba(12,14,20,0.07)',
  shadowMd:  '0 6px 32px rgba(12,14,20,0.10)',
  shadowLg:  '0 16px 56px rgba(12,14,20,0.14)',
  // Status colours
  green:     '#166534',
  greenPale: 'rgba(22,101,52,0.08)',
  blue:      '#1E40AF',
  bluePale:  'rgba(30,64,175,0.07)',
  purple:    '#6D28D9',
  purplePale:'rgba(109,40,217,0.07)',
}

const TABS = ['Overview', 'Facilities', 'Fees', 'Admission', 'Reviews', 'Gallery']

/* ── Label prettifier ─────────────────────────────────── */
function label(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Co Educational Boys Girls', 'Co-Educational')
    .replace('Co Educational', 'Co-Educational')
    .replace(/\bCbse\b/, 'CBSE').replace(/\bIcse\b/, 'ICSE')
    .replace(/\bIb\b/, 'IB').replace('K12', 'K–12')
}

/* ── Stagger preset ───────────────────────────────────── */
const rise = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as any },
})

/* ══ PILL ═══════════════════════════════════════════════ */
type PillVariant = 'default' | 'gold' | 'green' | 'blue' | 'purple'
const pillStyle: Record<PillVariant, React.CSSProperties> = {
  default: { background: '#F0EBE2', color: D.body,   border: `1px solid ${D.border}` },
  gold:    { background: D.goldPale,color: D.gold,   border: `1px solid ${D.goldRing}` },
  green:   { background: D.greenPale,color:D.green,  border: '1px solid rgba(22,101,52,0.2)' },
  blue:    { background: D.bluePale, color:D.blue,   border: '1px solid rgba(30,64,175,0.15)' },
  purple:  { background: D.purplePale,color:D.purple,border: '1px solid rgba(109,40,217,0.15)' },
}
function Pill({ text, variant='default' }: { text: string; variant?: PillVariant }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'5px 13px', borderRadius:99,
      fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, ...pillStyle[variant] }}>
      {text}
    </span>
  )
}

/* ══ STAT CARD ══════════════════════════════════════════ */
function StatCard({ icon: Icon, title, value, accent }: {
  icon: React.ElementType; title: string; value?: string | number | null; accent?: boolean
}) {
  if (!value && value !== 0) return null
  return (
    <motion.div whileHover={{ y: -3, boxShadow: D.shadowMd }} transition={{ duration: 0.18 }}
      style={{
        background: accent ? `linear-gradient(145deg,${D.goldPale},rgba(253,248,236,0.5))` : D.cardBg,
        border: `1.5px solid ${accent ? D.goldRing : D.border}`,
        borderRadius: 16, padding: '17px 19px', boxShadow: D.shadow, cursor: 'default',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
        <div style={{ width:28, height:28, borderRadius:8,
          background: accent ? 'rgba(184,134,11,0.14)' : 'rgba(12,14,20,0.04)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:13, height:13, color: accent ? D.goldBright : D.faint }} />
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700,
          textTransform:'uppercase' as const, letterSpacing:'0.11em',
          color: accent ? D.gold : D.faint }}>{title}</span>
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:19,
        color: accent ? D.goldBright : D.heading, lineHeight:1.1 }}>{value}</div>
    </motion.div>
  )
}

/* ══ REVIEW CARD ════════════════════════════════════════ */
function ReviewCard({ r, i }: { r: Review; i: number }) {
  const init = (r.parentName||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
  const stars = Number(r.rating) || 0
  return (
    <motion.div {...rise(i)} style={{ background:D.cardBg, border:`1px solid ${D.border}`,
      borderRadius:20, padding:'22px 26px', boxShadow:D.shadow }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:42, height:42, borderRadius:13, flexShrink:0,
            background:`linear-gradient(135deg,${D.goldPale},rgba(212,160,23,0.18))`,
            border:`1px solid ${D.goldRing}`, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:17, color:D.goldBright }}>
            {init}
          </div>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14, color:D.heading }}>{r.parentName}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:D.faint, marginTop:2 }}>
              {new Date(r.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:D.goldPale,
          border:`1px solid ${D.goldRing}`, padding:'4px 10px', borderRadius:99, flexShrink:0 }}>
          {[1,2,3,4,5].map(s=><Star key={s} style={{ width:10,height:10,
            fill:s<=stars?D.goldBright:'none',color:s<=stars?D.goldBright:'#D1D5DB' }} />)}
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:D.goldBright,marginLeft:4 }}>{stars}.0</span>
        </div>
      </div>
      {r.title && <h4 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:D.heading,marginBottom:7 }}>{r.title}</h4>}
      <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:D.body,lineHeight:1.8,fontWeight:300 }}>{r.body}</p>
      {r.schoolReply && (
        <div style={{ marginTop:13,padding:'11px 15px',borderRadius:11,background:D.goldPale,border:`1px solid ${D.goldRing}` }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:D.gold,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:4 }}>School Response</div>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:D.body,lineHeight:1.65,fontWeight:300 }}>{r.schoolReply}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ══ CALL MODAL ═════════════════════════════════════════ */
function CallModal({ school, onClose, onDone }:{school:School;onClose:()=>void;onDone:()=>void}) {
  const [name,setName]=useState('')
  const [phone,setPhone]=useState('')
  const [child,setChild]=useState('')
  const [cls,setCls]=useState('')
  const [busy,setBusy]=useState(false)
  const [err,setErr]=useState('')

  const go=async()=>{
    if(!name.trim()||!phone.trim()){setErr('Name and phone required');return}
    if(!/^\d{10}$/.test(phone.replace(/\s/g,''))){setErr('Valid 10-digit number required');return}
    setBusy(true);setErr('')
    try{
      await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({schoolId:school.id,action:'request_call',parentName:name,phone,childName:child,classApplyingFor:cls,source:'request_call'})})
      onDone();onClose()
    }catch{setErr('Something went wrong. Try again.')}
    setBusy(false)
  }

  const inp:React.CSSProperties={width:'100%',padding:'12px 16px',borderRadius:12,
    border:`1.5px solid ${D.border}`,fontFamily:"'DM Sans',sans-serif",fontSize:14,color:D.heading,
    outline:'none',background:'#FAFAF7',boxSizing:'border-box' as const,transition:'border-color .15s'}

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'fixed',inset:0,background:'rgba(7,9,15,0.7)',backdropFilter:'blur(14px)',zIndex:900,
        display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.88,y:28,opacity:0}} animate={{scale:1,y:0,opacity:1}}
        exit={{scale:.93,opacity:0}} transition={{duration:.32,ease:[.22,1,.36,1]}}
        style={{background:D.cardBg,borderRadius:28,padding:'40px 36px',width:'100%',maxWidth:440,
          boxShadow:D.shadowLg,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,
          background:`linear-gradient(90deg,transparent,${D.goldBright},#E8C547,${D.goldBright},transparent)`}} />
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:'#F2EDE4',border:'none',
          borderRadius:9,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <X style={{width:13,height:13,color:D.muted}} />
        </button>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
          <div style={{width:50,height:50,borderRadius:15,background:D.goldPale,border:`1.5px solid ${D.goldRing}`,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <PhoneCall style={{width:21,height:21,color:D.goldBright}} />
          </div>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:D.heading,marginBottom:2}}>Request a Call Back</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:D.muted,fontWeight:300}}>{school.name} will call within 24 hours</p>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:11}}>
          {[{l:'Your Name *',v:name,s:setName,p:'Full name',t:'text'},
            {l:'Mobile Number *',v:phone,s:setPhone,p:'10-digit mobile',t:'tel'},
            {l:"Child's Name",v:child,s:setChild,p:'Optional',t:'text'},
            {l:'Applying for Class',v:cls,s:setCls,p:'e.g. Grade 5, Nursery',t:'text'},
          ].map(f=>(
            <div key={f.l}>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,
                textTransform:'uppercase' as const,letterSpacing:'0.07em',color:D.faint,display:'block',marginBottom:5}}>{f.l}</label>
              <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.p} style={inp}
                onFocus={e=>e.currentTarget.style.borderColor=D.goldBright}
                onBlur={e=>e.currentTarget.style.borderColor=D.border} />
            </div>
          ))}
        </div>
        {err&&<div style={{marginTop:10,padding:'9px 13px',borderRadius:9,background:'rgba(220,38,38,.06)',
          border:'1px solid rgba(220,38,38,.18)',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#B91C1C'}}>{err}</div>}
        <motion.button whileHover={{scale:1.02,y:-1}} whileTap={{scale:.97}} onClick={go} disabled={busy}
          style={{marginTop:20,width:'100%',padding:'14px',borderRadius:14,border:'none',
            background:busy?'#E5E0D8':`linear-gradient(135deg,${D.goldBright},${D.gold})`,
            color:busy?D.muted:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,
            cursor:busy?'not-allowed':'pointer',
            boxShadow:busy?'none':'0 7px 24px rgba(184,134,11,0.35)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          <PhoneCall style={{width:15,height:15}} />{busy?'Submitting…':'Request Call Back'}
        </motion.button>
        <p style={{marginTop:12,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:D.faint,textAlign:'center',lineHeight:1.6}}>
          🔒 Shared only with this school · Protected by our privacy policy
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ══ SKELETON ════════════════════════════════════════════ */
function PageSkeleton() {
  const s:React.CSSProperties={borderRadius:12,background:`linear-gradient(90deg,#EDE8DF 25%,#E3DDD4 50%,#EDE8DF 75%)`,
    backgroundSize:'400% 100%',animation:'sp_sk 1.5s ease-in-out infinite'}
  return (
    <>
      <style>{`@keyframes sp_sk{0%,100%{background-position:0%}50%{background-position:100%}}`}</style>
      <div style={{background:D.pageBg}}>
        <div style={{height:380,...s,borderRadius:0}} />
        <div style={{maxWidth:1300,margin:'0 auto',padding:'40px clamp(20px,4vw,56px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:48}}>
            <div>
              <div style={{...s,height:48,width:'55%',marginBottom:20}} />
              <div style={{...s,height:16,width:'35%',marginBottom:40}} />
              <div style={{...s,height:56,marginBottom:36}} />
              <div style={{...s,height:220}} />
            </div>
            <div style={{...s,height:500}} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export function SchoolProfileClient({ slug }: { slug: string }) {
  const [tab, setTab]     = useState('Overview')
  const [saved, setSaved] = useState(false)
  const [callModal, setCallModal] = useState(false)
  const [toast, setToast] = useState<string|null>(null)

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', slug],
    queryFn: () => fetch(`/api/schools/${slug}`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.school??d),
    staleTime: 5*60*1000,
  })

  const { data: reviewData } = useQuery<{data:Review[];total:number}>({
    queryKey: ['school-reviews', slug],
    queryFn: () => fetch(`/api/schools/${slug}/reviews?limit=6`,{cache:'no-store'})
      .then(r=>r.ok?r.json():{data:[],total:0}).catch(()=>({data:[],total:0})),
    enabled: !!school,
    staleTime: 5*60*1000,
  })

  const lead = useCallback(async(src:string,id:string)=>{
    try{await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({schoolId:id,action:'create_lead',source:src})})}catch{}
  },[])

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),3000)}

  if (isLoading) return <PageSkeleton />
  if (!school) return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',gap:16,background:D.pageBg}}>
      <div style={{fontSize:72}}>🏫</div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:32,color:D.heading}}>School Not Found</h2>
      <Link href="/schools" style={{padding:'12px 28px',borderRadius:12,background:D.heading,color:'#fff',
        fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,textDecoration:'none'}}>Browse Schools</Link>
    </div>
  )

  const reviews = reviewData?.data ?? []
  const rating  = Number(school.avgRating) || 0
  const boards  = school.board || []

  /* ── CSS-in-JS sheet ── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    .spt{padding:9px 20px;border-radius:11px;border:none;cursor:pointer;
      font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
      white-space:nowrap;transition:all .2s;flex-shrink:0}
    .spt-on{background:${D.heading};color:#fff;box-shadow:0 3px 14px rgba(12,14,20,0.22)}
    .spt-off{background:transparent;color:${D.muted}}
    .spt-off:hover{background:rgba(12,14,20,0.05);color:${D.heading}}
    .spb{display:flex;align-items:center;justify-content:center;gap:8px;
      padding:13px 18px;border-radius:14px;font-family:'DM Sans',sans-serif;
      font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;
      text-decoration:none;width:100%;border:none;box-sizing:border-box}
    .spb-gold{background:linear-gradient(135deg,${D.goldBright},${D.gold});color:#fff;
      box-shadow:0 7px 26px rgba(184,134,11,0.38)}
    .spb-gold:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(184,134,11,0.46)}
    .spb-outline{border:1.5px solid ${D.goldRing}!important;background:${D.goldPale};color:${D.goldBright}}
    .spb-outline:hover{background:rgba(212,160,23,0.13)}
    .spb-ghost{border:1.5px solid ${D.border}!important;background:transparent;color:${D.muted}}
    .spb-ghost:hover{border-color:${D.heading}!important;color:${D.heading};background:rgba(12,14,20,0.04)}
    .spb-saved{border:1.5px solid ${D.goldRing}!important;background:${D.goldPale};color:${D.goldBright}}
  `

  return (
    <div style={{background:D.pageBg,minHeight:'100vh',paddingBottom:120}}>
      <style>{CSS}</style>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:16,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:10,x:'-50%'}}
            style={{position:'fixed',bottom:28,left:'50%',zIndex:800,background:D.heading,color:'#fff',
              borderRadius:14,padding:'12px 20px',display:'flex',alignItems:'center',gap:9,
              boxShadow:D.shadowLg,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,
              whiteSpace:'nowrap' as const}}>
            <CheckCircle2 style={{width:15,height:15,color:'#6EE7B7'}} />{toast}
          </motion.div>
        )}
        {callModal && <CallModal school={school} onClose={()=>setCallModal(false)} onDone={()=>showToast('Call back requested!')} />}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          HERO — full-bleed with school info embedded
          No floating logo — clean editorial layout
      ══════════════════════════════════════════ */}
      <div style={{position:'relative',overflow:'hidden',
        background:`linear-gradient(160deg, #07090F 0%, #0C1528 55%, #0A1A35 100%)`,
        minHeight:'clamp(360px,42vw,500px)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>

        {/* Cover image */}
        {school.coverImageUrl && (
          <div style={{position:'absolute',inset:0}}>
            <img src={school.coverImageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.35) saturate(0.7)'}} />
          </div>
        )}

        {/* No cover → animated background */}
        {!school.coverImageUrl && (
          <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
            {/* radial glow */}
            <div style={{position:'absolute',bottom:'-20%',left:'50%',transform:'translateX(-50%)',
              width:'120%',height:'80%',
              background:'radial-gradient(ellipse at center,rgba(184,134,11,0.12) 0%,transparent 65%)'}} />
            {/* rings */}
            {[240,380,520,660].map((r,i)=>(
              <motion.div key={r} style={{position:'absolute',top:'50%',left:'50%',
                width:r,height:r,borderRadius:'50%',marginTop:-r/2,marginLeft:-r/2,
                border:`1px solid rgba(184,134,11,${0.14-i*0.025})`}}
                animate={{scale:[1,1.05,1],opacity:[0.6,1,0.6]}}
                transition={{duration:3.5+i,repeat:Infinity,ease:'easeInOut',delay:i*0.5}} />
            ))}
            {/* orbs */}
            {[{x:12,y:22,sz:4},{x:78,y:38,sz:3},{x:35,y:72,sz:5},{x:88,y:62,sz:3},{x:55,y:85,sz:4}].map((o,i)=>(
              <motion.div key={i} style={{position:'absolute',left:`${o.x}%`,top:`${o.y}%`,
                width:o.sz*2,height:o.sz*2,borderRadius:'50%',background:'rgba(184,134,11,0.55)'}}
                animate={{y:[-12,12,-12],opacity:[0.25,0.75,0.25]}}
                transition={{duration:3.5+i*0.8,repeat:Infinity,ease:'easeInOut'}} />
            ))}
          </div>
        )}

        {/* Gradient vignettes */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(7,9,15,0.97) 0%,rgba(7,9,15,0.45) 50%,transparent 85%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(7,9,15,0.6) 0%,transparent 55%)',pointerEvents:'none'}} />

        {/* Action pills — top right */}
        <div style={{position:'absolute',top:20,right:20,display:'flex',gap:8,zIndex:20}}>
          <motion.button whileHover={{scale:1.06,y:-2}} whileTap={{scale:.94}}
            onClick={()=>{if(!saved&&school){lead('save',school.id);showToast('Saved to wishlist!')} setSaved(!saved)}}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 15px',borderRadius:99,
              border:'1px solid rgba(255,255,255,0.2)',
              background:saved?'rgba(184,134,11,0.45)':'rgba(255,255,255,0.1)',
              backdropFilter:'blur(16px)',cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:'#fff'}}>
            <Heart style={{width:12,height:12,fill:saved?'#fff':'none',color:'#fff'}} />
            {saved?'Saved':'Save'}
          </motion.button>
          <motion.button whileHover={{scale:1.06,y:-2}} whileTap={{scale:.94}}
            onClick={()=>{navigator.clipboard?.writeText(window.location.href);showToast('Link copied!')}}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 15px',borderRadius:99,
              border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',
              backdropFilter:'blur(16px)',cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:'#fff'}}>
            <Share2 style={{width:12,height:12}} />Share
          </motion.button>
          <motion.div whileHover={{scale:1.06,y:-2}} whileTap={{scale:.94}}>
            <Link href={`/compare?add=${school.id}`} onClick={()=>lead('compare',school.id)}
              style={{display:'flex',alignItems:'center',gap:6,padding:'7px 15px',borderRadius:99,
                border:'1px solid rgba(184,134,11,0.45)',background:'rgba(184,134,11,0.25)',
                backdropFilter:'blur(16px)',fontFamily:"'DM Sans',sans-serif",
                fontSize:12,fontWeight:600,color:'#fff',textDecoration:'none'}}>
              <GitCompare style={{width:12,height:12}} />Compare
            </Link>
          </motion.div>
        </div>

        {/* Hero body — logo inline with school name */}
        <div style={{position:'relative',zIndex:10,padding:'0 clamp(24px,5vw,60px) 40px'}}>

          {/* Badge row */}
          <motion.div {...rise(0)} style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:16}}>
            {school.isVerified && (
              <span style={{display:'inline-flex',alignItems:'center',gap:5,
                background:'rgba(22,101,52,0.85)',backdropFilter:'blur(12px)',
                color:'#fff',fontSize:11,fontWeight:700,padding:'4px 12px',
                borderRadius:100,fontFamily:"'DM Sans',sans-serif"}}>
                <BadgeCheck style={{width:11,height:11}} /> Verified School
              </span>
            )}
            {school.isFeatured && (
              <span style={{display:'inline-flex',alignItems:'center',gap:5,
                background:'rgba(184,134,11,0.9)',backdropFilter:'blur(12px)',
                color:'#fff',fontSize:11,fontWeight:700,padding:'4px 12px',
                borderRadius:100,fontFamily:"'DM Sans',sans-serif"}}>
                <Sparkles style={{width:10,height:10}} /> Featured
              </span>
            )}
          </motion.div>

          {/* Logo + Name side by side — NO floating, NO overlap */}
          <motion.div {...rise(1)} style={{display:'flex',alignItems:'center',gap:20,marginBottom:18,flexWrap:'wrap'}}>
            {/* Logo box */}
            <div style={{width:80,height:80,borderRadius:20,flexShrink:0,overflow:'hidden',
              background:'rgba(255,255,255,0.95)',
              border:'2px solid rgba(255,255,255,0.3)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {school.logoUrl
                ? <img src={school.logoUrl} alt={school.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:8}} />
                : <div style={{width:'100%',height:'100%',
                    background:`linear-gradient(135deg,${D.goldPale},rgba(212,160,23,0.15))`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <GraduationCap style={{width:36,height:36,color:D.goldBright}} />
                  </div>
              }
            </div>
            {/* Name */}
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,
              fontSize:'clamp(28px,4.2vw,52px)',color:'#FFFFFF',lineHeight:1.0,
              letterSpacing:'-0.02em',textShadow:'0 2px 20px rgba(0,0,0,0.5)',flex:1}}>
              {school.name}
            </h1>
          </motion.div>

          {/* Meta chips row */}
          <motion.div {...rise(2)} style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {school.city && (
              <span style={{display:'flex',alignItems:'center',gap:5,
                background:'rgba(255,255,255,0.1)',backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.18)',color:'rgba(255,255,255,0.92)',
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,padding:'5px 14px',borderRadius:99}}>
                <MapPin style={{width:10,height:10}} />{school.city}{school.state?`, ${school.state}`:''}
              </span>
            )}
            {school.foundingYear && (
              <span style={{display:'flex',alignItems:'center',gap:5,
                background:'rgba(255,255,255,0.1)',backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.18)',color:'rgba(255,255,255,0.92)',
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,padding:'5px 14px',borderRadius:99}}>
                <Calendar style={{width:10,height:10}} /> Est. {school.foundingYear}
              </span>
            )}
            {boards[0] && (
              <span style={{display:'flex',alignItems:'center',gap:5,
                background:'rgba(184,134,11,0.3)',backdropFilter:'blur(10px)',
                border:'1px solid rgba(184,134,11,0.45)',color:'#FFD97D',
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:99}}>
                <BookOpenCheck style={{width:10,height:10}} />{boards.join(' · ')}
              </span>
            )}
            {rating>0 && (
              <span style={{display:'flex',alignItems:'center',gap:5,
                background:'rgba(184,134,11,0.3)',backdropFilter:'blur(10px)',
                border:'1px solid rgba(184,134,11,0.45)',color:'#FFD97D',
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:99}}>
                <Star style={{width:10,height:10,fill:'#FFD97D'}} /> {rating.toFixed(1)} · {school.totalReviews||0} reviews
              </span>
            )}
          </motion.div>
        </div>

        <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,
          background:'linear-gradient(to right,transparent,rgba(184,134,11,0.45),transparent)'}} />
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div style={{maxWidth:1300,margin:'0 auto',padding:'44px clamp(20px,4vw,56px) 0'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr clamp(300px,26vw,355px)',gap:48,alignItems:'start'}}>

          {/* ── LEFT ── */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.15,duration:.5}}>

            {/* Tab bar */}
            <div style={{display:'flex',gap:4,background:'rgba(12,14,20,0.05)',borderRadius:16,
              padding:5,border:`1px solid ${D.border}`,marginBottom:36,
              overflowX:'auto',scrollbarWidth:'none' as const}}>
              {TABS.map(t=>(
                <button key={t} onClick={()=>setTab(t)} className={`spt ${tab===t?'spt-on':'spt-off'}`}>{t}</button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {tab==='Overview' && (
                <motion.div key="ov" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
                  {school.description && (
                    <motion.div {...rise(0)} style={{marginBottom:32,padding:'26px 30px',
                      background:`linear-gradient(145deg,${D.goldPale},rgba(253,248,236,0.4))`,
                      border:`1px solid ${D.goldRing}`,borderRadius:20,
                      boxShadow:'0 3px 18px rgba(184,134,11,0.08)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                        <div style={{width:3,height:26,borderRadius:2,
                          background:`linear-gradient(to bottom,${D.goldBright},#E8C547)`,flexShrink:0}} />
                        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:D.heading}}>
                          About {school.name}
                        </h2>
                      </div>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:D.body,lineHeight:1.88,fontWeight:300}}>{school.description}</p>
                    </motion.div>
                  )}

                  <div style={{marginBottom:32}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                      <div style={{width:3,height:22,borderRadius:2,
                        background:`linear-gradient(to bottom,${D.goldBright},#E8C547)`,flexShrink:0}} />
                      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:D.heading}}>School Details</h2>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(168px,1fr))',gap:11}}>
                      {boards.length>0 && (
                        <motion.div whileHover={{y:-3,boxShadow:'0 10px 30px rgba(184,134,11,0.18)'}}
                          style={{background:`linear-gradient(145deg,${D.goldPale},rgba(253,248,236,0.5))`,
                            border:`1.5px solid ${D.goldRing}`,borderRadius:16,padding:'18px 20px',
                            boxShadow:'0 3px 14px rgba(184,134,11,0.1)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                            <div style={{width:28,height:28,borderRadius:8,background:'rgba(184,134,11,0.14)',
                              display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <BookOpenCheck style={{width:13,height:13,color:D.goldBright}} />
                            </div>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,
                              textTransform:'uppercase' as const,letterSpacing:'0.1em',color:D.gold}}>Board</span>
                          </div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:D.goldBright,lineHeight:1.2}}>
                            {boards.join(', ')}
                          </div>
                        </motion.div>
                      )}
                      {school.foundingYear && <StatCard icon={Calendar} title="Founded" value={`${school.foundingYear} · ${new Date().getFullYear()-school.foundingYear}yr`} />}
                      <StatCard icon={Building2}     title="Type"          value={label(school.schoolType)} />
                      <StatCard icon={Users}         title="Gender"        value={label(school.genderPolicy)} />
                      <StatCard icon={Mic}           title="Medium"        value={label(school.mediumOfInstruction)} />
                      <StatCard icon={GraduationCap} title="Classes"       value={school.classesFrom&&school.classesTo?`${label(school.classesFrom)} – ${label(school.classesTo)}`:null} />
                      <StatCard icon={Award}         title="Recognition"   value={school.recognition} />
                      <StatCard icon={Users}         title="Students"      value={school.totalStudents?.toLocaleString()} />
                      <StatCard icon={BookOpen}      title="Teacher Ratio" value={school.studentTeacherRatio} />
                    </div>
                  </div>

                  {[
                    {h:'🏗️  Facilities & Infrastructure', items:school.facilities as string[], v:'gold' as PillVariant},
                    {h:'⚽  Sports',                      items:school.sports as string[],     v:'green' as PillVariant},
                    {h:'🎭  Extracurricular',             items:school.extraCurricular as string[], v:'purple' as PillVariant},
                    {h:'🗣️  Languages Offered',           items:school.languagesOffered as string[], v:'blue' as PillVariant},
                  ].filter(g=>g.items?.length>0).map((g,gi)=>(
                    <motion.div key={g.h} {...rise(gi)} style={{marginBottom:20,padding:'20px 24px',
                      background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:18,boxShadow:D.shadow}}>
                      <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:19,
                        color:D.heading,marginBottom:13}}>{g.h}</h3>
                      <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                        {g.items.slice(0,14).map(item=><Pill key={item} text={item} variant={g.v} />)}
                        {g.items.length>14&&<Pill text={`+${g.items.length-14} more`} />}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* ── FACILITIES ── */}
              {tab==='Facilities' && (
                <motion.div key="fa" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}
                  style={{display:'flex',flexDirection:'column',gap:16}}>
                  {[
                    {h:'🏗️  Facilities & Infrastructure', items:school.facilities as string[],     v:'gold' as PillVariant},
                    {h:'⚽  Sports',                      items:school.sports as string[],         v:'green' as PillVariant},
                    {h:'🎭  Extra Curricular',            items:school.extraCurricular as string[], v:'purple' as PillVariant},
                    {h:'🗣️  Languages',                   items:school.languagesOffered as string[],v:'blue' as PillVariant},
                  ].filter(g=>g.items?.length>0).map((g,i)=>(
                    <motion.div key={g.h} {...rise(i)} style={{background:D.cardBg,border:`1px solid ${D.border}`,
                      borderRadius:20,padding:'24px 28px',boxShadow:D.shadow}}>
                      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:21,color:D.heading,marginBottom:16}}>{g.h}</h2>
                      <div style={{display:'flex',flexWrap:'wrap',gap:7}}>{g.items.map(item=><Pill key={item} text={item} variant={g.v} />)}</div>
                    </motion.div>
                  ))}
                  {!school.facilities?.length&&!school.sports?.length&&!school.extraCurricular?.length&&!school.languagesOffered?.length&&(
                    <div style={{textAlign:'center',padding:'80px 0',fontFamily:"'DM Sans',sans-serif",color:D.faint}}>
                      <div style={{fontSize:48,marginBottom:12}}>🏗️</div>No facility info added yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FEES ── */}
              {tab==='Fees' && (
                <motion.div key="fe" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(196px,1fr))',gap:14,marginBottom:20}}>
                    {[
                      {l:'Monthly Fee From', v:school.monthlyFeeMin?`₹${school.monthlyFeeMin.toLocaleString()}`:null, e:'📅'},
                      {l:'Monthly Fee To',   v:school.monthlyFeeMax?`₹${school.monthlyFeeMax.toLocaleString()}`:null, e:'📈'},
                      {l:'Annual Fee',       v:school.annualFee?`₹${school.annualFee.toLocaleString()}`:null,         e:'📋'},
                    ].filter(f=>f.v).map((f,i)=>(
                      <motion.div key={f.l} {...rise(i)} whileHover={{y:-4,boxShadow:'0 14px 38px rgba(184,134,11,0.17)'}}
                        style={{background:`linear-gradient(145deg,${D.goldPale},rgba(253,248,236,0.4))`,
                          border:`1.5px solid ${D.goldRing}`,borderRadius:20,padding:'30px 24px',textAlign:'center',
                          boxShadow:'0 3px 18px rgba(184,134,11,0.1)'}}>
                        <div style={{fontSize:30,marginBottom:11}}>{f.e}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,color:D.faint,
                          textTransform:'uppercase' as const,letterSpacing:'0.1em',marginBottom:9}}>{f.l}</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:36,color:D.goldBright}}>{f.v}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div style={{background:D.goldPale,border:`1px solid ${D.goldRing}`,borderRadius:13,
                    padding:'13px 17px',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:D.body,lineHeight:1.65,fontWeight:300}}>
                    ℹ️ Fees are approximate. Contact the school for the exact current schedule.
                  </div>
                </motion.div>
              )}

              {/* ── ADMISSION ── */}
              {tab==='Admission' && (
                <motion.div key="ad" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:D.heading,marginBottom:26}}>Admission Information</h2>
                  {school.admissionInfo?(
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {[
                        {l:'Academic Year',value:school.admissionInfo.academicYear},
                        {l:'Status',value:school.admissionInfo.admissionOpen?'🟢 Currently Open':'🔴 Currently Closed'},
                        school.admissionInfo.lastDate?{l:'Last Date',value:school.admissionInfo.lastDate}:null,
                      ].filter(Boolean).map((row:any)=>(
                        <div key={row.l} style={{background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:14,
                          padding:'17px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:D.shadow}}>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:D.muted}}>{row.l}</span>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:17,color:D.heading}}>{row.value}</span>
                        </div>
                      ))}
                      {school.admissionInfo.documentsRequired?.length>0&&(
                        <div style={{background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:18,padding:'22px 26px',marginTop:6,boxShadow:D.shadow}}>
                          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:D.heading,marginBottom:14}}>Documents Required</h3>
                          <div style={{display:'flex',flexDirection:'column',gap:9}}>
                            {school.admissionInfo.documentsRequired.map((doc:string)=>(
                              <div key={doc} style={{display:'flex',alignItems:'center',gap:9,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:D.body}}>
                                <CheckCircle2 style={{width:14,height:14,color:D.goldBright,flexShrink:0}} />{doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ):(
                    <p style={{fontFamily:"'DM Sans',sans-serif",color:D.faint,textAlign:'center',padding:72}}>Admission details not yet added.</p>
                  )}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {tab==='Reviews' && (
                <motion.div key="re" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
                  {/* Rating summary */}
                  <div style={{background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:20,
                    padding:'26px 30px',marginBottom:20,display:'flex',alignItems:'center',gap:32,
                    flexWrap:'wrap',boxShadow:D.shadow}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:72,
                        color:D.goldBright,lineHeight:1}}>{rating.toFixed(1)}</div>
                      <div style={{display:'flex',gap:3,justifyContent:'center',marginTop:8}}>
                        {[1,2,3,4,5].map(s=><Star key={s} style={{width:14,height:14,
                          fill:s<=Math.round(rating)?D.goldBright:'none',
                          color:s<=Math.round(rating)?D.goldBright:'#D1D5DB'}} />)}
                      </div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:D.faint,marginTop:6}}>{reviewData?.total??0} reviews</div>
                    </div>
                    <div style={{flex:1,minWidth:170}}>
                      {[5,4,3,2,1].map(star=>{
                        const cnt=reviews.filter(r=>Math.round(Number(r.rating))===star).length
                        const pct=reviewData?.total?Math.round((cnt/reviewData.total)*100):0
                        return(
                          <div key={star} style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:D.muted,width:7}}>{star}</span>
                            <Star style={{width:10,height:10,fill:D.goldBright,color:D.goldBright,flexShrink:0}} />
                            <div style={{flex:1,height:6,borderRadius:99,background:'#EDE8DF',overflow:'hidden'}}>
                              <motion.div initial={{width:0}} animate={{width:`${pct}%`}}
                                transition={{delay:.3+star*.08,duration:.7,ease:'easeOut'}}
                                style={{height:'100%',background:`linear-gradient(90deg,${D.goldBright},#E8C547)`,borderRadius:99}} />
                            </div>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:D.faint,width:28}}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:13}}>
                    {reviews.map((r,i)=><ReviewCard key={r.id} r={r} i={i} />)}
                    {!reviews.length&&(
                      <div style={{textAlign:'center',padding:'72px 0',fontFamily:"'DM Sans',sans-serif",color:D.faint}}>
                        <div style={{fontSize:48,marginBottom:12}}>⭐</div>No reviews yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── GALLERY ── */}
              {tab==='Gallery' && (
                <motion.div key="ga" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:D.heading,marginBottom:26}}>School Gallery</h2>
                  {school.galleryImages?.length?(
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:13}}>
                      {school.galleryImages.map((img,i)=>(
                        <motion.div key={i} {...rise(i)} whileHover={{scale:1.02,boxShadow:D.shadowLg}}
                          style={{aspectRatio:'4/3',borderRadius:16,overflow:'hidden',background:'#E8E3D8',cursor:'pointer'}}>
                          <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .4s ease'}}
                            onMouseEnter={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1.07)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1)'}
                            loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  ):(
                    <div style={{textAlign:'center',padding:'72px 0',fontFamily:"'DM Sans',sans-serif",color:D.faint}}>
                      <div style={{fontSize:48,marginBottom:12}}>🖼️</div>No gallery images yet.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── SIDEBAR ── */}
          <motion.div initial={{opacity:0,x:22}} animate={{opacity:1,x:0}}
            transition={{delay:.22,duration:.5,ease:[.22,1,.36,1]}}
            style={{position:'sticky',top:88}}>

            {/* CTA CARD */}
            <div style={{background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:24,
              overflow:'hidden',boxShadow:D.shadowMd,marginBottom:14}}>
              {/* Gold top stripe */}
              <div style={{height:3,background:`linear-gradient(90deg,transparent,${D.goldBright},#E8C547,${D.goldBright},transparent)`}} />

              <div style={{padding:'24px 22px 20px'}}>
                {/* Fee */}
                {school.monthlyFeeMin && (
                  <div style={{textAlign:'center',paddingBottom:18,marginBottom:18,borderBottom:`1px solid ${D.border}`}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,color:D.faint,
                      textTransform:'uppercase' as const,letterSpacing:'0.16em',marginBottom:7}}>Monthly Fee From</div>
                    <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:.38,duration:.42}}
                      style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:50,
                        color:D.goldBright,lineHeight:1,letterSpacing:'-2px'}}>
                      ₹{school.monthlyFeeMin.toLocaleString()}
                    </motion.div>
                    {rating>0&&(
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:3,marginTop:9}}>
                        {[1,2,3,4,5].map(s=><Star key={s} style={{width:11,height:11,
                          fill:s<=Math.round(rating)?D.goldBright:'none',color:s<=Math.round(rating)?D.goldBright:'#D1D5DB'}} />)}
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:D.muted,marginLeft:4}}>
                          {rating.toFixed(1)} · {school.totalReviews||0} reviews
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <motion.div whileHover={{scale:1.01,y:-1}} whileTap={{scale:.98}}>
                    <Link href={`/apply/${school.id}`} className="spb spb-gold">
                      Apply Now <ArrowRight style={{width:14,height:14}} />
                    </Link>
                  </motion.div>

                  <motion.button whileHover={{scale:1.01,y:-1}} whileTap={{scale:.98}}
                    onClick={()=>setCallModal(true)}
                    className="spb spb-outline" style={{border:`1.5px solid ${D.goldRing}`}}>
                    <PhoneCall style={{width:13,height:13}} /> Request Call Back
                  </motion.button>

                  <Link href="/counselling" className="spb spb-ghost">
                    🎓 Get Expert Counselling
                  </Link>

                  <motion.button whileHover={{scale:1.01}} whileTap={{scale:.97}}
                    onClick={()=>{if(!saved&&school){lead('save',school.id);showToast('Saved to wishlist!')} setSaved(!saved)}}
                    className={`spb ${saved?'spb-saved':'spb-ghost'}`}
                    style={{border:`1.5px solid ${saved?D.goldRing:D.border}`}}>
                    <Heart style={{width:13,height:13,fill:saved?D.goldBright:'none',color:saved?D.goldBright:'currentColor',transition:'all .2s'}} />
                    {saved?'Saved to Wishlist':'Save School'}
                  </motion.button>

                  <Link href={`/compare?add=${school.id}`} onClick={()=>lead('compare',school.id)}
                    className="spb spb-ghost">
                    <GitCompare style={{width:13,height:13}} /> Compare School
                  </Link>
                </div>
              </div>
            </div>

            {/* QUICK FACTS CARD */}
            <div style={{background:D.cardBg,border:`1px solid ${D.border}`,borderRadius:20,
              padding:'20px 22px',boxShadow:D.shadow}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:9,color:D.faint,
                textTransform:'uppercase' as const,letterSpacing:'0.15em',marginBottom:8}}>Quick Facts</div>

              {[
                {icon:BookOpenCheck, l:'Board',    v:boards.length?boards.join(', '):null},
                {icon:Calendar,      l:'Founded',  v:school.foundingYear?String(school.foundingYear):null},
                {icon:GraduationCap, l:'Classes',  v:school.classesFrom&&school.classesTo?`${label(school.classesFrom)} – ${label(school.classesTo)}`:null},
                {icon:Users,         l:'Students', v:school.totalStudents?school.totalStudents.toLocaleString():null},
                {icon:Building2,     l:'Type',     v:label(school.schoolType)||null},
                {icon:Users,         l:'Gender',   v:label(school.genderPolicy)||null},
                {icon:Mic,           l:'Medium',   v:label(school.mediumOfInstruction)||null},
              ].filter(r=>r.v).map(r=>(
                <div key={r.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'9px 0',borderBottom:`1px solid ${D.border}`}}>
                  <span style={{display:'flex',alignItems:'center',gap:6,
                    fontFamily:"'DM Sans',sans-serif",fontSize:12,color:D.muted}}>
                    <r.icon style={{width:12,height:12,color:D.goldBright}} /> {r.l}
                  </span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:14,color:D.heading}}>{r.v}</span>
                </div>
              ))}

              <motion.div whileHover={{scale:1.02}} style={{marginTop:14}}>
                <Link href={`/apply/${school.id}`} style={{display:'flex',alignItems:'center',justifyContent:'center',
                  gap:6,padding:'10px',borderRadius:11,background:D.goldPale,border:`1px solid ${D.goldRing}`,
                  fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:D.goldBright,textDecoration:'none'}}>
                  Apply for Admission <ArrowRight style={{width:12,height:12}} />
                </Link>
              </motion.div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
