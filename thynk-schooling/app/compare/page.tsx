'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  GraduationCap, Star, BadgeCheck, X, ArrowRight,
  Plus, GitCompare, MapPin, Check, Trophy,
} from 'lucide-react'

const C = {
  bg: '#FAF7F2', card: '#FFFFFF', border: 'rgba(13,17,23,0.08)',
  ink: '#0D1117', inkMuted: '#5A6472', inkFaint: '#A0ADB8',
  gold: '#B8860B', goldBg: 'rgba(184,134,11,0.08)', goldBdr: 'rgba(184,134,11,0.22)',
  green: '#16a34a', greenBg: 'rgba(22,163,74,0.08)', greenBdr: 'rgba(22,163,74,0.22)',
}

type School = Record<string, any>

async function fetchSchool(id: string): Promise<School | null> {
  try {
    const r = await fetch(`/api/schools/${id}`, { cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    return d.school ?? d
  } catch { return null }
}

function Tag({ label, color = 'gold' }: { label: string; color?: 'gold'|'green'|'blue'|'purple' }) {
  const m = {
    gold:   { bg:'rgba(184,134,11,0.09)', b:'rgba(184,134,11,0.25)', t:'#9A6F0B' },
    green:  { bg:'rgba(22,163,74,0.09)',  b:'rgba(22,163,74,0.25)',  t:'#15803d' },
    blue:   { bg:'rgba(59,130,246,0.09)', b:'rgba(59,130,246,0.25)', t:'#1d4ed8' },
    purple: { bg:'rgba(139,92,246,0.09)', b:'rgba(139,92,246,0.25)', t:'#6d28d9' },
  }
  const s = m[color]
  return (
    <span style={{ display:'inline-flex', background:s.bg, border:`1px solid ${s.b}`, color:s.t, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:100 }}>
      {label}
    </span>
  )
}

/* ─── School slot card at the top ─── */
function SlotCard({ school, index, onRemove }: { school: School | null; index: number; onRemove: (i:number)=>void }) {
  const rating = Number(school?.avgRating)||0
  return (
    <div style={{
      background: school ? C.card : 'rgba(13,17,23,0.03)',
      border: `2px solid ${school ? (index===0 ? C.gold : C.border) : 'rgba(13,17,23,0.08)'}`,
      borderRadius: 20, overflow: 'hidden', position: 'relative',
      boxShadow: school ? '0 4px 24px rgba(13,17,23,0.08)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {index===0 && school && (
        <div style={{ position:'absolute', top:0, left:0, right:0, background:'linear-gradient(90deg,#B8860B,#9A6F0B)', padding:'4px 0', textAlign:'center', fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700, color:'#fff', letterSpacing:'0.08em' }}>
          ★ TOP PICK
        </div>
      )}

      {school ? (
        <div style={{ paddingTop: index===0 ? 24 : 0 }}>
          {/* Cover mini */}
          <div style={{ height:90, overflow:'hidden', position:'relative', background:'linear-gradient(135deg,#1a1a2e,#16213e)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {school.coverImageUrl
              ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <GraduationCap style={{ width:28,height:28, color:'rgba(255,255,255,0.15)' }} />
            }
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,17,23,0.6),transparent)' }} />
            {/* Logo */}
            <div style={{ position:'absolute', bottom:-18, left:12, width:40,height:40, borderRadius:10, background:'#fff', border:'2px solid #FAF7F2', boxShadow:'0 3px 12px rgba(13,17,23,0.18)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {school.logoUrl
                ? <img src={school.logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
                : <GraduationCap style={{ width:18,height:18, color:C.gold }} />
              }
            </div>
          </div>

          <div style={{ padding:'24px 14px 14px' }}>
            <Link href={`/schools/${school.slug}`} style={{ textDecoration:'none' }}>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink, lineHeight:1.25, marginBottom:5 }}>
                {school.name}
              </div>
            </Link>
            <div style={{ display:'flex', alignItems:'center', gap:3, fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkMuted, marginBottom:8 }}>
              <MapPin style={{ width:10,height:10, color:C.gold }} />
              {school.city}{school.state?`, ${school.state}`:''}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:10 }}>
              <div style={{ display:'flex', gap:1 }}>
                {[1,2,3,4,5].map(s=><Star key={s} style={{ width:10,height:10, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
              </div>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, color:C.gold }}>{rating.toFixed(1)}</span>
            </div>
            {school.isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:C.greenBg, border:`1px solid ${C.greenBdr}`, color:C.green, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                <BadgeCheck style={{ width:9,height:9 }} /> Verified
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ height:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:16 }}>
          <div style={{ width:36,height:36, borderRadius:10, border:`2px dashed ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Plus style={{ width:16,height:16, color:C.inkFaint }} />
          </div>
          <Link href="/schools"
            style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:C.gold, textDecoration:'none', background:C.goldBg, border:`1px solid ${C.goldBdr}`, padding:'5px 12px', borderRadius:99 }}>
            + Add School
          </Link>
        </div>
      )}

      {school && (
        <button onClick={()=>onRemove(index)}
          style={{ position:'absolute', top:8, right:8, width:22,height:22, borderRadius:'50%', background:'rgba(13,17,23,0.12)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(220,50,50,0.2)'}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(13,17,23,0.12)'}>
          <X style={{ width:11,height:11, color:C.inkMuted }} />
        </button>
      )}
    </div>
  )
}

/* ─── Table section header ─── */
function SectionHeader({ emoji, title, cols }: { emoji:string; title:string; cols:number }) {
  return (
    <tr>
      <td colSpan={cols+1} style={{ padding:'24px 20px 10px', background:'rgba(13,17,23,0.02)', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:18, color:C.ink }}>
          <span>{emoji}</span> {title}
        </div>
      </td>
    </tr>
  )
}

/* ─── Best badge ─── */
function Best({ label }: { label: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:C.goldBg, border:`1px solid ${C.goldBdr}`, color:C.gold, fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>
      <Trophy style={{ width:9,height:9 }} /> {label}
    </span>
  )
}

/* ═════════════════════════════════════════════════════ */
export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [schools, setSchools] = useState<(School|null)[]>([null,null,null,null])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const idsParam = searchParams.get('ids') || ''
    const addParam = searchParams.get('add')  || ''
    const ids = [...new Set([...idsParam.split(','), ...addParam.split(',')].filter(Boolean))].slice(0,4)

    if (ids.length===0) { setLoading(false); return }

    Promise.all(ids.map(id=>fetchSchool(id))).then(results=>{
      const slots: (School|null)[] = [null,null,null,null]
      results.forEach((s,i)=>{ if (s) slots[i]=s })
      setSchools(slots)
      setLoading(false)
    })
  }, [searchParams])

  const filled = schools.filter(Boolean) as School[]
  const cols = Math.max(filled.length, 2)

  const removeSchool = (index: number) => {
    setSchools(prev => {
      const next = [...prev]
      next[index] = null
      // compact: bring non-null to front
      const compact: (School|null)[] = next.filter(Boolean) as School[]
      while (compact.length<4) compact.push(null)
      return compact
    })
  }

  /* ─── Helpers for best/lowest per row ─── */
  const numVals = (key: string) => filled.map(s=>Number(s[key])||0)
  const maxIdx  = (key: string) => { const v=numVals(key); const m=Math.max(...v); return v.indexOf(m) }
  const minIdx  = (key: string) => { const v=numVals(key).filter(x=>x>0); if(!v.length) return -1; const m=Math.min(...v); return numVals(key).indexOf(m) }

  /* ─── Generic row renderer ─── */
  const Row = ({ label, render, bestIdx }: {
    label: string;
    render: (s: School) => React.ReactNode;
    bestIdx?: number;
  }) => (
    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
      <td style={{ padding:'14px 20px', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:C.inkFaint, textTransform:'uppercase', letterSpacing:'0.07em', width:160, verticalAlign:'middle', background:'rgba(13,17,23,0.015)' }}>
        {label}
      </td>
      {Array.from({length:cols}).map((_,ci)=>{
        const s = schools[ci]
        const isBest = bestIdx===ci
        return (
          <td key={ci} style={{ padding:'14px 16px', verticalAlign:'middle', background:isBest?'rgba(184,134,11,0.04)':'transparent', borderLeft:`1px solid ${C.border}` }}>
            {s ? render(s) : <span style={{ color:C.inkFaint, fontFamily:'Inter,sans-serif', fontSize:13 }}>—</span>}
          </td>
        )
      })}
    </tr>
  )

  const BoolRow = ({ label, field }: { label:string; field:string }) => (
    <Row label={label} render={s => s[field]
      ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:C.green, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600 }}><Check style={{ width:13,height:13 }} /> Yes</span>
      : <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.inkFaint }}>✗ No</span>
    } />
  )

  const TagsRow = ({ label, field, color = 'gold' }: { label:string; field:string; color?:'gold'|'green'|'blue'|'purple' }) => (
    <Row label={label} render={s => {
      const arr: string[] = s[field] || []
      if (!arr.length) return <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint }}>—</span>
      return (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {arr.slice(0,4).map((t:string)=><Tag key={t} label={t} color={color} />)}
          {arr.length>4 && <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint }}>+{arr.length-4}</span>}
        </div>
      )
    }} />
  )

  const feeMin = numVals('monthlyFeeMin')
  const lowestFeeIdx = feeMin.some(v=>v>0) ? feeMin.indexOf(feeMin.filter(v=>v>0).reduce((a,b)=>Math.min(a,b))) : -1

  return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:100 }}>

      {/* HERO HEADER */}
      <div style={{ background:'linear-gradient(135deg,#0a0e1a,#16213e,#0f3460)', padding:'48px clamp(20px,5vw,80px) 40px', position:'relative', overflow:'hidden' }}>
        {[...Array(5)].map((_,i)=>(
          <div key={i} style={{ position:'absolute', borderRadius:'50%', border:'1px solid rgba(184,134,11,0.1)', width:`${(i+1)*200}px`, height:`${(i+1)*200}px`, top:'50%', left:'60%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'relative', zIndex:1, maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(184,134,11,0.2)', border:'1px solid rgba(184,134,11,0.35)', borderRadius:99, padding:'6px 16px', marginBottom:16 }}>
            <GitCompare style={{ width:14,height:14, color:C.gold }} />
            <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:C.gold }}>School Comparison</span>
          </div>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(28px,4vw,48px)', color:'#fff', lineHeight:1.08, marginBottom:10 }}>
            Compare Schools<br />
            <em style={{ color:C.gold, fontStyle:'italic' }}>Side by Side</em>
          </h1>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>
            Select up to 4 schools and compare them across academics, fees, facilities, sports, and more.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(20px,4vw,56px)' }}>

        {/* SLOT GRID */}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols+1},1fr)`, gap:14, marginTop:32, marginBottom:32 }}>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', paddingBottom:14 }}>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:18, color:C.ink, marginBottom:4 }}>Your Schools</div>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint }}>Up to 4 schools</p>
          </div>
          {Array.from({length:cols}).map((_,i)=>(
            <SlotCard key={i} school={schools[i]} index={i} onRemove={removeSchool} />
          ))}
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'64px 0', fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkFaint }}>
            <div style={{ width:32,height:32, borderRadius:'50%', border:`3px solid ${C.gold}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
            Loading school data…
          </div>
        )}

        {!loading && filled.length < 2 && (
          <div style={{ textAlign:'center', padding:'64px 0' }}>
            <GitCompare style={{ width:48,height:48, color:C.inkFaint, margin:'0 auto 16px' }} />
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:26, color:C.ink, marginBottom:10 }}>Select Schools to Compare</h2>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted, marginBottom:24 }}>Go to the school listing and click "Compare" on any card.</p>
            <Link href="/schools"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:14, background:'linear-gradient(135deg,#B8860B,#9A6F0B)', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 20px rgba(184,134,11,0.3)' }}>
              Browse Schools <ArrowRight style={{ width:15,height:15 }} />
            </Link>
          </div>
        )}

        {/* COMPARISON TABLE */}
        {!loading && filled.length >= 2 && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.4 }}>
            <div style={{ overflowX:'auto', borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 2px 16px rgba(13,17,23,0.06)', background:C.card }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                <tbody>

                  {/* ── ACADEMICS ── */}
                  <SectionHeader emoji="🎓" title="Academics" cols={cols} />

                  <Row label="Board" render={s=>(
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(s.board||[]).slice(0,3).map((b:string)=><Tag key={b} label={b} color="gold" />)}
                    </div>
                  )} />

                  <Row label="School Type" render={s=>(
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.ink }}>{s.schoolType||'—'}</span>
                  )} />

                  <Row label="Classes" render={s=>(
                    s.classesFrom&&s.classesTo
                      ? <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>Class {s.classesFrom} – {s.classesTo}</span>
                      : <span style={{ color:C.inkFaint }}>—</span>
                  )} />

                  <Row label="Medium" render={s=>(
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.ink }}>{s.mediumOfInstruction||'—'}</span>
                  )} />

                  <Row label="Gender Policy" render={s=>(
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.ink }}>{s.genderPolicy||'—'}</span>
                  )} />

                  <Row label="Recognition" render={s=>(
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.ink }}>{s.recognition||'—'}</span>
                  )} />

                  {/* ── FEES ── */}
                  <SectionHeader emoji="💰" title="Fees" cols={cols} />

                  <Row label="Monthly Fee" render={(s) => {
                    const v = s.monthlyFeeMin
                    const idx = schools.indexOf(s)
                    const isBest = idx === lowestFeeIdx
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:18, color:v?C.gold:C.inkFaint }}>
                          {v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'}
                        </span>
                        {isBest && v && <Best label="LOWEST" />}
                      </div>
                    )
                  }} />

                  <Row label="Monthly Fee Max" render={s=>(
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:s.monthlyFeeMax?C.gold:C.inkFaint }}>
                      {s.monthlyFeeMax ? `₹${Number(s.monthlyFeeMax).toLocaleString('en-IN')}` : '—'}
                    </span>
                  )} />

                  <Row label="Annual Fee" render={s=>(
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:s.annualFee?C.gold:C.inkFaint }}>
                      {s.annualFee ? `₹${Number(s.annualFee).toLocaleString('en-IN')}` : '—'}
                    </span>
                  )} />

                  {/* ── RATINGS & SIZE ── */}
                  <SectionHeader emoji="⭐" title="Ratings & Size" cols={cols} />

                  <Row label="Rating" bestIdx={maxIdx('avgRating')} render={(s) => {
                    const rating = Number(s.avgRating)||0
                    const idx = schools.indexOf(s)
                    const isBest = idx===maxIdx('avgRating')
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ display:'flex', gap:2 }}>
                            {[1,2,3,4,5].map(st=><Star key={st} style={{ width:12,height:12, fill:st<=Math.round(rating)?C.gold:'transparent', color:st<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
                          </div>
                          <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:C.ink }}>{rating.toFixed(1)}</span>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint }}>({s.totalReviews||0})</span>
                        </div>
                        {isBest && rating>0 && <Best label="BEST RATED" />}
                      </div>
                    )
                  }} />

                  <Row label="Total Students" bestIdx={maxIdx('totalStudents')} render={(s) => {
                    const idx = schools.indexOf(s)
                    const isBest = idx===maxIdx('totalStudents')
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>
                          {s.totalStudents ? Number(s.totalStudents).toLocaleString('en-IN') : '—'}
                        </span>
                        {isBest && s.totalStudents && <Best label="LARGEST" />}
                      </div>
                    )
                  }} />

                  <Row label="Teacher Ratio" render={s=>(
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.ink }}>{s.studentTeacherRatio||'—'}</span>
                  )} />

                  <Row label="Founded" render={s=>(
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:15, color:C.ink }}>{s.foundingYear||'—'}</span>
                  )} />

                  {/* ── VERIFICATION ── */}
                  <SectionHeader emoji="✅" title="Trust & Verification" cols={cols} />

                  <BoolRow label="Verified"  field="isVerified" />
                  <BoolRow label="Featured"  field="isFeatured" />

                  <Row label="Admission"  render={s=>(
                    s.admissionInfo?.admissionOpen !== undefined
                      ? <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, color:s.admissionInfo.admissionOpen?C.green:'#dc2626' }}>
                          {s.admissionInfo.admissionOpen ? '🟢 Open' : '🔴 Closed'}
                        </span>
                      : <span style={{ color:C.inkFaint }}>—</span>
                  )} />

                  {/* ── LANGUAGES ── */}
                  <SectionHeader emoji="🗣️" title="Languages Offered" cols={cols} />
                  <TagsRow label="Languages" field="languagesOffered" color="blue" />

                  {/* ── FACILITIES ── */}
                  <SectionHeader emoji="🏗️" title="Facilities & Infrastructure" cols={cols} />
                  <TagsRow label="Facilities" field="facilities" color="gold" />

                  {/* ── SPORTS ── */}
                  <SectionHeader emoji="⚽" title="Sports" cols={cols} />
                  <TagsRow label="Sports" field="sports" color="green" />

                  {/* ── EXTRA CURRICULAR ── */}
                  <SectionHeader emoji="🎭" title="Extra Curricular" cols={cols} />
                  <TagsRow label="Activities" field="extraCurricular" color="purple" />

                </tbody>
              </table>
            </div>

            {/* APPLY SECTION */}
            <div style={{ marginTop:40, padding:'32px 36px', background:C.card, border:`1px solid ${C.border}`, borderRadius:20, boxShadow:'0 2px 16px rgba(13,17,23,0.06)' }}>
              <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:24, color:C.ink, marginBottom:6 }}>Made Your Decision?</h2>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted, marginBottom:24 }}>Apply to your preferred school or get free counselling to help decide.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
                {filled.map((s,i)=>(
                  <Link key={s.id} href={`/apply/${s.id}`}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:14, background:i===0?'linear-gradient(135deg,#B8860B,#9A6F0B)':'rgba(13,17,23,0.06)', color:i===0?'#fff':C.ink, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, textDecoration:'none', border:'none', boxShadow:i===0?'0 4px 16px rgba(184,134,11,0.3)':'none', transition:'all 0.2s' }}>
                    Apply to {s.name.split(' ').slice(0,2).join(' ')} <ArrowRight style={{ width:13,height:13 }} />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
