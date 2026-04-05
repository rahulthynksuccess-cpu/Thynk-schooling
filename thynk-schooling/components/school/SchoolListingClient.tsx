'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, MapPin, Star, BadgeCheck, GraduationCap,
  X, LayoutGrid, List, ChevronDown, ArrowRight,
  SlidersHorizontal, Plus, Check, Sparkles, BookOpen,
  Users, GitCompare, Trophy, Navigation2, Loader2, Hash,
} from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { useAuthStore } from '@/store/authStore'
import { School, SchoolSearchFilters, PaginatedResponse } from '@/types'
import { clsx } from 'clsx'

type Filters = SchoolSearchFilters & {
  state?: string; extraCurricular?: string[]
  language?: string[]; facilities?: string[]; sports?: string[]
  pincode?: string; lat?: number; lng?: number; radius?: number; nearMe?: boolean
}
const INIT: Filters = { page: 1, limit: 15, sortBy: 'rating' }
const C = {
  gold: '#B8860B', goldBg: 'rgba(184,134,11,0.08)', goldBdr: 'rgba(184,134,11,0.22)',
  ink: '#0D1117', inkMuted: '#5A6472', inkFaint: '#A0ADB8',
  border: 'rgba(13,17,23,0.08)',
}

async function fetchSchools(f: Filters): Promise<PaginatedResponse<School>> {
  const p = new URLSearchParams()
  if (f.query)                   p.set('query',            f.query)
  if (f.city)                    p.set('city',             f.city)
  if (f.state)                   p.set('state',            f.state)
  if (f.board?.length)           p.set('board',            f.board.join(','))
  if (f.schoolType)              p.set('type',             f.schoolType)
  if (f.genderPolicy)            p.set('gender_policy',    f.genderPolicy)
  if (f.medium)                  p.set('medium',           f.medium)
  if (f.feeMin)                  p.set('feeMin',           String(f.feeMin))
  if (f.feeMax)                  p.set('feeMax',           String(f.feeMax))
  if (f.rating)                  p.set('rating',           String(f.rating))
  if (f.isFeatured)              p.set('isFeatured',       'true')
  if (f.facilities?.length)      p.set('facilities',       f.facilities.join(','))
  if (f.sports?.length)          p.set('sports',           f.sports.join(','))
  if (f.extraCurricular?.length) p.set('extra_curricular', f.extraCurricular.join(','))
  if (f.language?.length)        p.set('language',         f.language.join(','))
  if (f.page)                    p.set('page',             String(f.page))
  if (f.limit)                   p.set('limit',            String(f.limit))
  if (f.sortBy)                  p.set('sortBy',           f.sortBy)
  if (f.pincode)                 p.set('pincode',          f.pincode)
  if (f.lat !== undefined)       p.set('lat',              String(f.lat))
  if (f.lng !== undefined)       p.set('lng',              String(f.lng))
  if (f.radius !== undefined)    p.set('radius',           String(f.radius))
  const res = await fetch(`/api/schools?${p}`, { cache: 'no-store' })
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  return res.json()
}

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, cb])
}

const DA = { initial:{ opacity:0,y:-8,scale:0.97 }, animate:{ opacity:1,y:0,scale:1 }, exit:{ opacity:0,y:-8,scale:0.97 }, transition:{ duration:0.18 } }

function SelectPill({ label, icon, value, options, onChange }: { label:string; icon?:string; value:string; options:{label:string;value:string}[]; onChange:(v:string)=>void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, ()=>setOpen(false))
  const active = !!value
  const displayLabel = options.find(o=>o.value===value)?.label || label
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className={clsx('group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          active ? 'bg-gold border-gold text-white' : 'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink')}>
        {icon && <span className="text-xs">{icon}</span>}
        <span className="font-semibold">{displayLabel}</span>
        {active
          ? <span onClick={e=>{e.stopPropagation();onChange('');setOpen(false)}} className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center"><X className="w-2.5 h-2.5" /></span>
          : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform text-ink-faint group-hover:text-gold', open&&'rotate-180')} />}
      </button>
      <AnimatePresence>
        {open && options.length>0 && (
          <motion.div {...DA} className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl min-w-[200px] max-h-64 overflow-y-auto" style={{ boxShadow:'0 8px 40px rgba(13,17,23,0.12)' }}>
            <div className="p-1.5">
              {value && <button onClick={()=>{onChange('');setOpen(false)}} className="w-full text-left px-3 py-2 text-xs text-gold font-semibold hover:bg-gold-wash rounded-xl mb-0.5">✕ Clear</button>}
              {options.map(o=>(
                <button key={o.value} onClick={()=>{onChange(o.value);setOpen(false)}}
                  className={clsx('w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all', o.value===value?'bg-gold-wash text-ink font-semibold':'text-ink-light hover:bg-ivory hover:text-ink')}>
                  {o.label}
                  {o.value===value && <Check className="w-3.5 h-3.5 text-gold" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MultiPill({ label, icon, options, selected, onChange }: { label:string; icon?:string; options:{label:string;value:string}[]; selected:string[]; onChange:(v:string[])=>void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, ()=>setOpen(false))
  const count = selected.length
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className={clsx('group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          count>0?'bg-gold border-gold text-white':'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink')}>
        {icon && <span className="text-xs">{icon}</span>}
        <span className="font-semibold">{count>0?`${label} (${count})`:label}</span>
        {count>0
          ? <span onClick={e=>{e.stopPropagation();onChange([]);setOpen(false)}} className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center"><X className="w-2.5 h-2.5" /></span>
          : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform text-ink-faint group-hover:text-gold', open&&'rotate-180')} />}
      </button>
      <AnimatePresence>
        {open && options.length>0 && (
          <motion.div {...DA} className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl min-w-[220px] max-h-64 overflow-y-auto" style={{ boxShadow:'0 8px 40px rgba(13,17,23,0.12)' }}>
            <div className="p-1.5">
              {count>0 && <button onClick={()=>{onChange([]);setOpen(false)}} className="w-full text-left px-3 py-2 text-xs text-gold font-semibold hover:bg-gold-wash rounded-xl mb-0.5">✕ Clear ({count})</button>}
              {options.map(o=>{
                const on = selected.includes(o.value)
                return (
                  <label key={o.value} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ivory cursor-pointer group">
                    <div className={clsx('w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all', on?'bg-gold border-gold':'border-[rgba(13,17,23,0.2)] group-hover:border-gold')}>
                      {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={clsx('text-sm', on?'text-ink font-semibold':'text-ink-light group-hover:text-ink')}>{o.label}</span>
                    <input type="checkbox" className="sr-only" checked={on} onChange={()=>onChange(on?selected.filter(x=>x!==o.value):[...selected,o.value])} />
                  </label>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeePill({ feeMin, feeMax, onChange }: { feeMin?:number; feeMax?:number; onChange:(min?:number,max?:number)=>void }) {
  const [open, setOpen] = useState(false)
  const [lMin, setLMin] = useState(feeMin?String(feeMin):'')
  const [lMax, setLMax] = useState(feeMax?String(feeMax):'')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, ()=>setOpen(false))
  const active = !!(feeMin||feeMax)
  const label = active ? `₹${feeMin?.toLocaleString('en-IN')??'0'} – ${feeMax?'₹'+feeMax.toLocaleString('en-IN'):'∞'}` : 'Fee Range'
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className={clsx('group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          active?'bg-gold border-gold text-white':'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink')}>
        <span className="font-semibold">{label}</span>
        {active
          ? <span onClick={e=>{e.stopPropagation();onChange(undefined,undefined);setLMin('');setLMax('')}} className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center"><X className="w-2.5 h-2.5" /></span>
          : <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform text-ink-faint group-hover:text-gold', open&&'rotate-180')} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...DA} className="absolute top-full left-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl p-4 w-64" style={{ boxShadow:'0 8px 40px rgba(13,17,23,0.12)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Monthly Fee (₹)</p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1"><label className="text-xs text-ink-muted mb-1 block">Min</label><input type="number" placeholder="3000" value={lMin} onChange={e=>setLMin(e.target.value)} className="w-full border border-[rgba(13,17,23,0.14)] rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-gold transition-all" /></div>
              <div className="flex-1"><label className="text-xs text-ink-muted mb-1 block">Max</label><input type="number" placeholder="15000" value={lMax} onChange={e=>setLMax(e.target.value)} className="w-full border border-[rgba(13,17,23,0.14)] rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-gold transition-all" /></div>
            </div>
            <button onClick={()=>{onChange(lMin?Number(lMin):undefined,lMax?Number(lMax):undefined);setOpen(false)}} className="w-full py-2.5 rounded-xl bg-ink text-ivory text-sm font-semibold hover:bg-gold transition-colors">Apply Range</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MoreFilters({ filters, onChange }: { filters:Filters; onChange:(k:string,v:unknown)=>void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, ()=>setOpen(false))
  const { options: facilities } = useDropdown('facility')
  const { options: sports }     = useDropdown('sport')
  const { options: extraCurr }  = useDropdown('extra_curricular')
  const { options: languages }  = useDropdown('language')
  if (!facilities.length&&!sports.length&&!extraCurr.length&&!languages.length) return null
  const totalActive = (filters.facilities?.length??0)+(filters.sports?.length??0)+(filters.extraCurricular?.length??0)+(filters.language?.length??0)

  const TG = ({ title, emoji, opts, fk }: { title:string; emoji:string; opts:{label:string;value:string}[]; fk:string }) => {
    if (!opts.length) return null
    const sel: string[] = (filters as any)[fk]??[]
    return (
      <div className="mb-5 last:mb-0">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2.5">{emoji} {title}</p>
        <div className="flex flex-wrap gap-2">
          {opts.map(o=>{
            const on = sel.includes(o.value)
            return (
              <button key={o.value} onClick={()=>{ const n=on?sel.filter(x=>x!==o.value):[...sel,o.value]; onChange(fk,n.length?n:undefined) }}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', on?'bg-gold border-gold text-white':'bg-ivory border-[rgba(13,17,23,0.1)] text-ink-light hover:border-gold hover:text-ink hover:bg-gold-wash')}>
                {on && <Check className="w-2.5 h-2.5" strokeWidth={3} />}{o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className={clsx('group flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-sans font-medium transition-all duration-200 select-none',
          totalActive>0?'bg-gold border-gold text-white':'bg-white border-[rgba(13,17,23,0.14)] text-ink-light hover:border-gold hover:text-ink')}>
        <Plus className="w-3.5 h-3.5" />
        <span className="font-semibold">More Filters{totalActive>0?` (${totalActive})`:''}</span>
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform opacity-60', open&&'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...DA} className="absolute top-full right-0 mt-2 z-[100] bg-white border border-[rgba(13,17,23,0.09)] rounded-2xl w-[520px] max-h-[520px] overflow-y-auto" style={{ boxShadow:'0 16px 60px rgba(13,17,23,0.14)' }}>
            <div className="sticky top-0 bg-white border-b border-[rgba(13,17,23,0.07)] px-5 py-3.5 flex items-center justify-between rounded-t-2xl z-10">
              <span className="font-bold text-ink text-base">More Filters</span>
              <div className="flex items-center gap-3">
                {totalActive>0 && <button onClick={()=>{onChange('facilities',undefined);onChange('sports',undefined);onChange('extraCurricular',undefined);onChange('language',undefined)}} className="text-xs text-gold font-semibold">Clear all ({totalActive})</button>}
                <button onClick={()=>setOpen(false)} className="w-7 h-7 rounded-full bg-ivory flex items-center justify-center"><X className="w-3.5 h-3.5 text-ink-light" /></button>
              </div>
            </div>
            <div className="p-5">
              <TG title="Facilities"       emoji="🏗️" opts={facilities} fk="facilities" />
              <TG title="Sports"           emoji="⚽" opts={sports}     fk="sports" />
              <TG title="Extra Curricular" emoji="🎭" opts={extraCurr}  fk="extraCurricular" />
              <TG title="Languages"        emoji="🗣️" opts={languages}  fk="language" />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[rgba(13,17,23,0.07)] p-4 rounded-b-2xl">
              <button onClick={()=>setOpen(false)} className="w-full py-3 rounded-xl bg-ink text-ivory text-sm font-bold hover:bg-gold transition-colors">Apply {totalActive>0?`${totalActive} Filter${totalActive>1?'s':''}`:''}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── COVER GRADIENTS ─── */
const COVERS = [
  'linear-gradient(135deg,#1a0a2e,#16213e)',
  'linear-gradient(135deg,#0a1628,#0f3460)',
  'linear-gradient(135deg,#0d2137,#1a3a5c)',
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#0a2020,#0f3030)',
]

/* ─── GRID CARD ─── */
function SchoolCardGrid({ school, i, selected, onToggle }: { school:School; i:number; selected:boolean; onToggle:(s:School)=>void }) {
  const rating = Number(school.avgRating)||0
  return (
    <motion.div
      initial={{ opacity:0, y:32, scale:0.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:i*0.06, duration:0.5, ease:[0.22,1,0.36,1] }}
      whileHover={{ y:-6, transition:{ duration:0.28, ease:[0.22,1,0.36,1] } }}
      style={{ position:'relative' }}>
      {selected && (
        <div style={{ position:'absolute', inset:-3, borderRadius:24, border:`2.5px solid ${C.gold}`, boxShadow:'0 0 0 6px rgba(184,134,11,0.12)', pointerEvents:'none', zIndex:2 }} />
      )}
      <div className="school-card-grid" style={{ borderRadius:22, overflow:'hidden', background:'linear-gradient(135deg,#fff 0%,#FDFAF8 100%)', border:`1px solid ${selected?C.gold:'rgba(184,134,11,0.12)'}`, boxShadow:selected?'0 12px 40px rgba(184,134,11,0.18)':'0 4px 24px rgba(13,17,23,0.08)', display:'flex', flexDirection:'column', transition:'all 0.3s cubic-bezier(.22,1,.36,1)' }}>

        {/* Cover */}
        <div style={{ height:200, position:'relative', overflow:'hidden', flexShrink:0, background:school.coverImageUrl?undefined:COVERS[i%COVERS.length], display:'flex', alignItems:'center', justifyContent:'center' }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.7s ease' }} className="school-card-img" loading="lazy" />
            : (
              <>
                {[...Array(4)].map((_,ci)=>(
                  <div key={ci} style={{ position:'absolute', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', width:`${(ci+1)*80}px`, height:`${(ci+1)*80}px`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
                ))}
                <GraduationCap style={{ width:36, height:36, color:'rgba(255,255,255,0.2)', position:'relative', zIndex:1 }} />
              </>
            )
          }
          {/* Gradient overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,17,23,0.7) 0%,rgba(13,17,23,0.08) 55%,transparent 100%)', pointerEvents:'none' }} />
          {/* Shimmer sweep on hover */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.08) 50%,transparent 65%)', backgroundSize:'200%', animation:'shimmerBg 5s linear infinite', pointerEvents:'none' }} />

          {/* Badges top-left */}
          <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:5 }}>
            {school.isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'rgba(22,163,74,0.88)', backdropFilter:'blur(8px)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 9px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                <BadgeCheck style={{ width:10, height:10 }} /> Verified
              </span>
            )}
            {school.isFeatured && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'rgba(184,134,11,0.88)', backdropFilter:'blur(8px)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 9px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                ★ Featured
              </span>
            )}
          </div>

          {/* Fee bottom-right */}
          {school.monthlyFeeMin && (
            <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', borderRadius:10, padding:'4px 10px' }}>
              <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:14, color:'#fff' }}>₹{school.monthlyFeeMin.toLocaleString('en-IN')}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, color:'rgba(255,255,255,0.6)', marginLeft:2 }}>/mo</span>
            </div>
          )}

          {/* Logo bubble */}
          <div style={{ position:'absolute', bottom:-20, left:16, width:46, height:46, borderRadius:12, background:'#fff', border:'2px solid #FAF7F2', boxShadow:'0 4px 16px rgba(13,17,23,0.18)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', zIndex:3 }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:5 }} loading="lazy" />
              : <GraduationCap style={{ width:20, height:20, color:C.gold }} />
            }
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'28px 16px 16px', display:'flex', flexDirection:'column', flex:1 }}>
          <Link href={`/schools/${school.slug}`} style={{ textDecoration:'none' }}>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:18, color:C.ink, lineHeight:1.22, marginBottom:5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {school.name}
            </h3>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted, marginBottom:8 }}>
            <MapPin style={{ width:11, height:11, color:C.gold, flexShrink:0 }} />
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{school.city}{school.state?`, ${school.state}`:''}</span>
          </div>

          {/* Description snippet */}
          {school.description && (
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint, lineHeight:1.65, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {school.description}
            </p>
          )}

          {/* Badges */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
            {school.board.slice(0,2).map(b=>(
              <span key={b} style={{ background:C.goldBg, border:`1px solid ${C.goldBdr}`, color:'#9A6F0B', fontSize:10, fontWeight:700, fontFamily:'Inter,sans-serif', padding:'3px 9px', borderRadius:100 }}>{b}</span>
            ))}
            {school.schoolType && <span style={{ background:'rgba(13,17,23,0.05)', border:`1px solid ${C.border}`, color:C.inkMuted, fontSize:10, fontWeight:600, fontFamily:'Inter,sans-serif', padding:'3px 9px', borderRadius:100 }}>{school.schoolType}</span>}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
            {school.classesFrom&&school.classesTo&&(
              <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkMuted }}>
                <BookOpen style={{ width:11,height:11 }} /> Class {school.classesFrom}–{school.classesTo}
              </span>
            )}
            {school.totalStudents&&(
              <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkMuted }}>
                <Users style={{ width:11,height:11 }} /> {school.totalStudents.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Footer */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:10, borderTop:'1px solid rgba(13,17,23,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ display:'flex', gap:1 }}>
                {[1,2,3,4,5].map(s=><Star key={s} style={{ width:11,height:11, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
              </div>
              <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:13, color:C.ink }}>{rating.toFixed(1)}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, color:C.inkFaint }}>({school.totalReviews})</span>
            </div>
            {/* Compare toggle button */}
            <button
              onClick={e=>{e.preventDefault();e.stopPropagation();onToggle(school)}}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:99, border:`1.5px solid ${selected?C.gold:C.border}`, background:selected?C.goldBg:'transparent', color:selected?C.gold:C.inkFaint, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>
              {selected ? <><Check style={{ width:10,height:10 }} /> Added</> : <><GitCompare style={{ width:10,height:10 }} /> Compare</>}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── LIST CARD ─── */
function SchoolCardList({ school, i, selected, onToggle }: { school:School; i:number; selected:boolean; onToggle:(s:School)=>void }) {
  const rating = Number(school.avgRating)||0
  return (
    <motion.div initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04, duration:0.35, ease:[0.22,1,0.36,1] }}>
      <div className="school-card-list" style={{ borderRadius:18, background:'#fff', border:`1px solid ${selected?C.gold:C.border}`, boxShadow:selected?'0 8px 28px rgba(184,134,11,0.14)':'0 2px 8px rgba(13,17,23,0.05)', display:'flex', overflow:'hidden', transition:'all 0.25s ease' }}>

        {/* Thumbnail */}
        <div style={{ width:130, flexShrink:0, position:'relative', overflow:'hidden', background:COVERS[i%COVERS.length], display:'flex', alignItems:'center', justifyContent:'center' }}>
          {school.coverImageUrl
            ? <img src={school.coverImageUrl} alt={school.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s ease' }} className="school-card-img" loading="lazy" />
            : <GraduationCap style={{ width:32,height:32, color:'rgba(255,255,255,0.2)' }} />
          }
        </div>

        {/* Content */}
        <div style={{ padding:'18px 20px', display:'flex', flex:1, gap:14, alignItems:'flex-start' }}>
          {/* Logo */}
          <div style={{ width:52, height:52, borderRadius:12, flexShrink:0, background:'#F5F0E8', border:'1px solid rgba(13,17,23,0.08)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }} loading="lazy" />
              : <GraduationCap style={{ width:22,height:22, color:C.gold }} />
            }
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:4 }}>
              <div>
                <Link href={`/schools/${school.slug}`} style={{ textDecoration:'none' }}>
                  <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:19, color:C.ink, lineHeight:1.2, marginBottom:4 }}>{school.name}</h3>
                </Link>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                  <MapPin style={{ width:11,height:11, color:C.gold }} />
                  {school.city}{school.state?`, ${school.state}`:''}
                </div>
              </div>
              <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                {school.isVerified && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'rgba(22,163,74,0.09)', color:'#16a34a', border:'1px solid rgba(22,163,74,0.25)', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                    <BadgeCheck style={{ width:10,height:10 }} /> Verified
                  </span>
                )}
                {school.isFeatured && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:C.goldBg, color:'#9A6F0B', border:`1px solid ${C.goldBdr}`, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:100, fontFamily:'Inter,sans-serif' }}>
                    ★ Featured
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {school.description && (
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkFaint, lineHeight:1.65, marginBottom:8, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {school.description}
              </p>
            )}

            {/* Tags */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
              {school.board.slice(0,3).map(b=>(
                <span key={b} style={{ background:C.goldBg, border:`1px solid ${C.goldBdr}`, color:'#9A6F0B', fontSize:10, fontWeight:700, fontFamily:'Inter,sans-serif', padding:'3px 9px', borderRadius:100 }}>{b}</span>
              ))}
              {school.schoolType && <span style={{ background:'rgba(13,17,23,0.05)', border:`1px solid ${C.border}`, color:C.inkMuted, fontSize:10, fontWeight:600, fontFamily:'Inter,sans-serif', padding:'3px 9px', borderRadius:100 }}>{school.schoolType}</span>}
              {school.genderPolicy && <span style={{ background:'rgba(13,17,23,0.05)', border:`1px solid ${C.border}`, color:C.inkMuted, fontSize:10, fontWeight:600, fontFamily:'Inter,sans-serif', padding:'3px 9px', borderRadius:100 }}>{school.genderPolicy}</span>}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid rgba(13,17,23,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ display:'flex', gap:1 }}>
                    {[1,2,3,4,5].map(s=><Star key={s} style={{ width:12,height:12, fill:s<=Math.round(rating)?C.gold:'transparent', color:s<=Math.round(rating)?C.gold:'#D0D5DB' }} />)}
                  </div>
                  <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:14, color:C.ink }}>{rating.toFixed(1)}</span>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:C.inkFaint }}>({school.totalReviews})</span>
                </div>
                {school.classesFrom&&school.classesTo&&(
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                    <BookOpen style={{ width:12,height:12 }} /> Class {school.classesFrom}–{school.classesTo}
                  </span>
                )}
                {school.totalStudents&&(
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:12, color:C.inkMuted }}>
                    <Users style={{ width:12,height:12 }} /> {school.totalStudents.toLocaleString('en-IN')} students
                  </span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {school.monthlyFeeMin && (
                  <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:16, color:C.gold }}>
                    ₹{school.monthlyFeeMin.toLocaleString('en-IN')}<span style={{ fontFamily:'Inter,sans-serif', fontWeight:400, fontSize:11, color:C.inkFaint }}>/mo</span>
                  </span>
                )}
                <button
                  onClick={e=>{e.preventDefault();e.stopPropagation();onToggle(school)}}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:99, border:`1.5px solid ${selected?C.gold:C.border}`, background:selected?C.goldBg:'transparent', color:selected?C.gold:C.inkFaint, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>
                  {selected ? <><Check style={{ width:10,height:10 }} /> Added</> : <><GitCompare style={{ width:10,height:10 }} /> Compare</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ borderRadius:22, overflow:'hidden', background:'#fff', border:'1px solid rgba(13,17,23,0.08)' }}>
      <div className="skeleton" style={{ height:200, borderRadius:0 }} />
      <div style={{ padding:18 }}>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <div className="skeleton" style={{ width:42,height:42, borderRadius:10, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div className="skeleton" style={{ height:16, width:'65%', marginBottom:7 }} />
            <div className="skeleton" style={{ height:11, width:'40%' }} />
          </div>
        </div>
        <div className="skeleton" style={{ height:10, width:'80%', marginBottom:12 }} />
        <div style={{ display:'flex', gap:5, marginBottom:12 }}>
          <div className="skeleton" style={{ height:18, width:52, borderRadius:100 }} />
          <div className="skeleton" style={{ height:18, width:52, borderRadius:100 }} />
        </div>
        <div className="skeleton" style={{ height:10, width:'55%' }} />
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ borderRadius:18, background:'#fff', border:'1px solid rgba(13,17,23,0.08)', display:'flex', overflow:'hidden' }}>
      <div className="skeleton" style={{ width:130, flexShrink:0 }} />
      <div style={{ padding:'18px 20px', flex:1, display:'flex', gap:14 }}>
        <div className="skeleton" style={{ width:52,height:52, borderRadius:12, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton" style={{ height:18, width:'55%', marginBottom:8 }} />
          <div className="skeleton" style={{ height:12, width:'35%', marginBottom:12 }} />
          <div style={{ display:'flex', gap:5, marginBottom:12 }}>
            <div className="skeleton" style={{ height:18, width:52, borderRadius:100 }} />
            <div className="skeleton" style={{ height:18, width:52, borderRadius:100 }} />
          </div>
          <div className="skeleton" style={{ height:12, width:'50%' }} />
        </div>
      </div>
    </div>
  )
}

function GuestModal({ onClose }: { onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity:0,scale:0.92,y:20 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.92,y:20 }} transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
        className="relative bg-white rounded-3xl p-8 max-w-[420px] w-full text-center" style={{ boxShadow:'0 32px 80px rgba(13,17,23,0.2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ivory flex items-center justify-center"><X className="w-4 h-4 text-ink-light" /></button>
        <div className="w-16 h-16 rounded-2xl bg-gold-wash border border-gold/20 flex items-center justify-center mx-auto mb-5"><Sparkles className="w-7 h-7 text-gold" /></div>
        <h2 className="font-display font-bold text-ink text-2xl mb-2" style={{ fontFamily:'var(--font-serif)' }}>Create a Free Account</h2>
        <p className="text-ink-muted text-sm mb-7 leading-relaxed">Sign up in 30 seconds to search, compare and save schools.</p>
        <div className="flex flex-col gap-3">
          <Link href="/register" onClick={onClose} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-ink text-ivory text-sm font-bold hover:bg-gold transition-colors">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" onClick={onClose} className="flex items-center justify-center w-full py-3 rounded-2xl border-2 border-[rgba(13,17,23,0.12)] text-ink-light text-sm font-semibold hover:border-ink hover:text-ink transition-all">
            Already have an account? Log in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function Chip({ label, onRemove }: { label:string; onRemove:()=>void }) {
  return (
    <motion.span initial={{ opacity:0,scale:0.8 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.8 }} transition={{ duration:0.15 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-gold-wash border border-gold/30 text-xs font-semibold text-ink">
      {label}
      <button onClick={onRemove} className="w-4 h-4 rounded-full bg-gold/15 hover:bg-gold/30 flex items-center justify-center transition-colors"><X className="w-2.5 h-2.5 text-ink" /></button>
    </motion.span>
  )
}

/* ─── COMPARE BAR ─── */
function CompareBar({ selected, onRemove, onCompare }: { selected:School[]; onRemove:(id:string)=>void; onCompare:()=>void }) {
  if (selected.length < 2) return null
  return (
    <motion.div
      initial={{ opacity:0, y:80 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:80 }}
      transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
      style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:150, display:'flex', alignItems:'center', gap:12, background:'#0D1117', borderRadius:20, padding:'14px 20px', boxShadow:'0 12px 48px rgba(13,17,23,0.45)', border:'1px solid rgba(255,255,255,0.08)', maxWidth:'90vw', flexWrap:'wrap', justifyContent:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <GitCompare style={{ width:16,height:16, color:C.gold, flexShrink:0 }} />
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Comparing:</span>
        {selected.map(s=>(
          <span key={s.id} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:99, padding:'4px 10px', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'#fff' }}>
            {s.name.split(' ').slice(0,2).join(' ')}
            <button onClick={()=>onRemove(s.id)} style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:16, height:16, cursor:'pointer', color:'#fff', padding:0, justifyContent:'center' }}>
              <X style={{ width:9,height:9 }} />
            </button>
          </span>
        ))}
      </div>
      <button onClick={onCompare}
        style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:12, background:'linear-gradient(135deg,#B8860B,#9A6F0B)', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(184,134,11,0.4)', flexShrink:0 }}>
        <Trophy style={{ width:14,height:14 }} />
        Compare {selected.length} Schools
        <ArrowRight style={{ width:13,height:13 }} />
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════ */
export function SchoolListingClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const urlFeatured = searchParams.get('featured') === 'true'

  const [filters, setFilters] = useState<Filters>({
    ...INIT,
    query:      searchParams.get('q')    || undefined,
    city:       searchParams.get('city') || undefined,
    isFeatured: urlFeatured || undefined,
  })
  const [applied, setApplied] = useState<Filters>({ ...INIT, isFeatured: urlFeatured || undefined })
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid')
  const [showGuest, setShowGuest] = useState(false)
  const [userHasSearched, setUserHasSearched] = useState(false)
  const [compareList, setCompareList] = useState<School[]>([])
  const [locStatus, setLocStatus] = useState<'idle'|'requesting'|'granted'|'denied'>('idle')

  const { options: states  } = useDropdown('state')
  const { options: cities  } = useDropdown('city', { parentValue: filters.state || undefined, enabled: true })
  const { options: boards  } = useDropdown('board')
  const { options: types   } = useDropdown('school_type')
  const { options: genders } = useDropdown('gender_policy')
  const { options: mediums } = useDropdown('medium')

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools', applied],
    queryFn:  () => fetchSchools(applied),
    placeholderData: prev => prev,
    staleTime: 2*60*1000,
  })

  const set = useCallback((key:string, value:unknown) => {
    setFilters(prev => { const next = { ...prev, [key]:value, page:1 }; if (key==='state') next.city=undefined; return next })
  }, [])

  const search = useCallback(() => {
    if (!isAuthenticated) { setShowGuest(true); return }
    setUserHasSearched(true)
    setApplied({ ...filters, page:1, isFeatured:undefined })
  }, [isAuthenticated, filters])

  const reset = useCallback(() => {
    setFilters({ ...INIT, isFeatured: urlFeatured||undefined })
    setApplied({ ...INIT, isFeatured: urlFeatured||undefined })
    setUserHasSearched(false)
  }, [urlFeatured])

  const requestLocation = useCallback(() => {
    if (!isAuthenticated) { setShowGuest(true); return }
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser. Please enter a pincode instead.'); return }
    setLocStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocStatus('granted')
        const next: Filters = { ...INIT, lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 10, nearMe: true, page: 1 }
        setFilters(next)
        setApplied(next)
        setUserHasSearched(true)
      },
      (err) => {
        setLocStatus('denied')
        if (err.code === 1) alert('Location access was denied. Please allow location in browser settings, or enter a pincode below.')
        else alert('Could not get your location. Please enter a pincode instead.')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [isAuthenticated])

  const clearLocation = useCallback(() => {
    setLocStatus('idle')
    setFilters(f => { const n = { ...f }; delete n.lat; delete n.lng; delete n.radius; delete n.nearMe; delete n.pincode; return { ...n, page: 1 } })
    setApplied(f => { const n = { ...f }; delete n.lat; delete n.lng; delete n.radius; delete n.nearMe; delete n.pincode; return { ...n, page: 1 } })
    setUserHasSearched(false)
  }, [])

  // Toggle school in compare list
  const toggleCompare = useCallback((school: School) => {
    setCompareList(prev => {
      const exists = prev.find(s=>s.id===school.id)
      if (exists) return prev.filter(s=>s.id!==school.id)
      if (prev.length >= 4) return prev  // cap at 4
      const next = [...prev, school]
      // Auto-redirect when 4 selected
      if (next.length === 4) {
        setTimeout(() => {
          router.push(`/compare?ids=${next.map(s=>s.id).join(',')}`)
        }, 300)
      }
      return next
    })
  }, [router])

  const removeFromCompare = useCallback((id:string) => {
    setCompareList(prev=>prev.filter(s=>s.id!==id))
  }, [])

  const goCompare = useCallback(() => {
    if (compareList.length < 2) return
    router.push(`/compare?ids=${compareList.map(s=>s.id).join(',')}`)
  }, [compareList, router])

  const schools = data?.data ?? []
  const total   = data?.total ?? 0
  const totalPg = data?.totalPages ?? 1

  type ChipData = { label:string; clear:()=>void }
  const chips: ChipData[] = []
  if (applied.nearMe)       chips.push({ label:`📍 Near Me (${applied.radius ?? 10} km)`, clear: clearLocation })
  if (applied.pincode && !applied.nearMe) chips.push({ label:`📮 Pincode: ${applied.pincode}`, clear:()=>{ set('pincode',undefined); setApplied(f=>({...f,pincode:undefined})) } })
  if (applied.state)        chips.push({ label:`🗺 ${applied.state}`, clear:()=>{ set('state',undefined); set('city',undefined); setApplied(f=>({...f,state:undefined,city:undefined})) }})
  if (applied.city)         chips.push({ label:`📍 ${applied.city}`,  clear:()=>{ set('city',undefined); setApplied(f=>({...f,city:undefined})) }})
  if (applied.schoolType)   chips.push({ label:applied.schoolType,    clear:()=>set('schoolType',undefined) })
  if (applied.genderPolicy) chips.push({ label:applied.genderPolicy,  clear:()=>set('genderPolicy',undefined) })
  if (applied.medium)       chips.push({ label:applied.medium,        clear:()=>set('medium',undefined) })
  applied.board?.forEach(b=>           chips.push({ label:b, clear:()=>set('board',applied.board?.filter(x=>x!==b)) }))
  applied.facilities?.forEach(f=>      chips.push({ label:`🏗 ${f}`, clear:()=>set('facilities',applied.facilities?.filter(x=>x!==f)) }))
  applied.sports?.forEach(s=>          chips.push({ label:`⚽ ${s}`, clear:()=>set('sports',applied.sports?.filter(x=>x!==s)) }))
  applied.extraCurricular?.forEach(e=> chips.push({ label:`🎭 ${e}`, clear:()=>set('extraCurricular',applied.extraCurricular?.filter(x=>x!==e)) }))
  applied.language?.forEach(l=>        chips.push({ label:`🗣 ${l}`, clear:()=>set('language',applied.language?.filter(x=>x!==l)) }))

  const activeFilterCount = [filters.state,filters.city,filters.schoolType,filters.genderPolicy,filters.medium,filters.feeMin,filters.feeMax,filters.rating].filter(Boolean).length +
    (filters.board?.length??0)+(filters.facilities?.length??0)+(filters.sports?.length??0)+(filters.extraCurricular?.length??0)+(filters.language?.length??0)

  const isFeaturedMode = urlFeatured && !userHasSearched

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(180deg,#FDFAF5 0%,#F5F0E8 100%)' }}>
      <style>{`
        .school-card-grid:hover { box-shadow:0 24px 64px rgba(13,17,23,0.14),0 0 0 1px rgba(184,134,11,0.2)!important; }
        .school-card-list:hover { box-shadow:0 8px 32px rgba(13,17,23,0.1),0 0 0 1px rgba(184,134,11,0.15)!important; }
        .school-card-grid:hover .school-card-img,
        .school-card-list:hover .school-card-img { transform:scale(1.07); }
        @keyframes shimmerBg{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes floatYSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
      `}</style>

      <AnimatePresence>{showGuest && <GuestModal onClose={()=>setShowGuest(false)} />}</AnimatePresence>
      <AnimatePresence>
        <CompareBar selected={compareList} onRemove={removeFromCompare} onCompare={goCompare} />
      </AnimatePresence>

      {/* HERO / SEARCH */}
      <div className="border-b border-[rgba(13,17,23,0.07)]" style={{ background:'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 70%,#EEE0C0 100%)', position:'relative', overflow:'hidden' }}>
        {/* Animated bg blobs */}
        <div style={{position:'absolute',top:'-60px',right:'5%',width:320,height:320,background:'radial-gradient(circle,rgba(184,134,11,0.12),transparent 70%)',filter:'blur(48px)',pointerEvents:'none',animation:'floatY 8s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:'-40px',left:'8%',width:240,height:240,background:'radial-gradient(circle,rgba(10,95,85,0.07),transparent 70%)',filter:'blur(40px)',pointerEvents:'none',animation:'floatYSlow 11s ease-in-out infinite',animationDelay:'-4s'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.07) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none'}}/>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{position:'relative',zIndex:1}}>
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.55,ease:[0.22,1,0.36,1] }}>
            {isFeaturedMode && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(184,134,11,0.1)', border:'1px solid rgba(184,134,11,0.25)', borderRadius:100, padding:'5px 14px', marginBottom:10 }}>
                <Star style={{ width:12,height:12, fill:C.gold, color:C.gold }} />
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:'#9A6F0B' }}>Showing Featured Schools</span>
              </div>
            )}
            <h1 className="font-display font-bold text-ink mb-1" style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4vw,42px)', letterSpacing:'-0.02em', lineHeight:1.15 }}>
              {filters.city
                ? <>Schools in <em style={{ color:'var(--gold)' }}>{filters.city}</em></>
                : filters.state
                  ? <>Schools in <em style={{ color:'var(--gold)' }}>{filters.state}</em></>
                  : isFeaturedMode
                    ? <>Featured Schools <em style={{ color:'var(--gold)', fontStyle:'italic' }}>Across India</em></>
                    : <>Find Schools <em style={{ color:'var(--gold)', fontStyle:'italic' }}>Across India</em></>}
            </h1>
          </motion.div>

          {/* Compare hint */}
          {compareList.length === 0 && (
            <p className="text-ink-faint text-xs mb-3 flex items-center gap-1.5">
              <GitCompare style={{ width:12,height:12 }} />
              Click <strong>Compare</strong> on any card to start comparing schools (select 2–4)
            </p>
          )}
          {compareList.length > 0 && compareList.length < 2 && (
            <p className="text-xs mb-3" style={{ color:C.gold, fontFamily:'Inter,sans-serif' }}>
              ✓ {compareList[0].name} selected — pick {2-compareList.length} more to compare
            </p>
          )}

          <p className="text-ink-muted text-sm mb-6">
            {isFeaturedMode ? 'Top verified featured schools — search to explore all schools' : 'Search, compare and shortlist from 12,000+ verified schools'}
          </p>

          {/* ── Search bar row ── */}
          <div className="flex gap-3 max-w-2xl mb-3">
            <div className="flex items-center gap-3 flex-1 bg-white border border-[rgba(13,17,23,0.14)] rounded-2xl px-4 py-3 focus-within:border-gold focus-within:shadow-[0_0_0_3px_rgba(184,134,11,0.1)] transition-all" style={{ boxShadow:'0 2px 8px rgba(13,17,23,0.06)' }}>
              <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input type="text" placeholder="School name, board, area, city…" value={filters.query||''}
                onChange={e=>set('query',e.target.value||undefined)}
                onKeyDown={e=>e.key==='Enter'&&search()}
                className="flex-1 bg-transparent outline-none text-ink text-sm placeholder:text-ink-faint" />
              {filters.query && (
                <button onClick={()=>set('query',undefined)} className="w-5 h-5 rounded-full bg-ivory-2 flex items-center justify-center"><X className="w-3 h-3 text-ink-light" /></button>
              )}
            </div>
            <button onClick={search}
              className="flex items-center gap-2.5 px-6 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 flex-shrink-0"
              style={{ background:'var(--ink)', color:'var(--ivory)', boxShadow:'0 2px 8px rgba(13,17,23,0.2)' }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='var(--gold)'}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='var(--ink)'}>
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          {/* ── Location row: GPS button + pincode input ── */}
          <div className="flex items-center gap-3 max-w-2xl mb-6 flex-wrap">
            {!filters.nearMe ? (
              <button
                onClick={requestLocation}
                disabled={locStatus === 'requesting'}
                className="group flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-semibold transition-all select-none"
                style={{
                  background: locStatus === 'denied' ? 'rgba(239,68,68,0.06)' : 'white',
                  border: locStatus === 'denied' ? '1.5px solid rgba(239,68,68,0.35)' : '1.5px solid rgba(13,17,23,0.15)',
                  color: locStatus === 'denied' ? '#EF4444' : 'var(--ink-light)',
                  cursor: locStatus === 'requesting' ? 'not-allowed' : 'pointer',
                }}
              >
                {locStatus === 'requesting'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color:'var(--gold)' }} />
                  : <Navigation2 className="w-3.5 h-3.5" style={{ color: locStatus === 'denied' ? '#EF4444' : 'var(--gold)' }} />}
                <span>
                  {locStatus === 'requesting' ? 'Getting location…'
                    : locStatus === 'denied'  ? 'Location denied'
                    : 'Use My Location'}
                </span>
                {locStatus === 'idle' && <span className="text-xs font-normal" style={{ color:'var(--ink-faint)' }}>· schools within 10 km</span>}
              </button>
            ) : (
              <div className="flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-semibold"
                style={{ background:'rgba(184,134,11,0.08)', border:'1.5px solid rgba(184,134,11,0.28)', color:'var(--gold)' }}>
                <Navigation2 className="w-3.5 h-3.5" />
                <span>Showing schools within 10 km</span>
                <button onClick={clearLocation} className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-gold/20 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            <span className="text-xs font-medium" style={{ color:'var(--ink-faint)' }}>or</span>

            {/* Pincode input */}
            <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-white transition-all focus-within:shadow-[0_0_0_3px_rgba(184,134,11,0.08)]"
              style={{ border:'1.5px solid rgba(13,17,23,0.15)' }}>
              <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--ink-faint)' }} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode"
                value={filters.pincode || ''}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g,'').slice(0,6)
                  if (filters.nearMe) clearLocation()
                  set('pincode', v || undefined)
                  if (v.length === 6) {
                    const next = { ...filters, pincode: v, lat: undefined, lng: undefined, nearMe: undefined, page: 1 }
                    setFilters(next); setApplied(next); setUserHasSearched(true)
                  }
                }}
                className="w-28 bg-transparent outline-none text-sm"
                style={{ color:'var(--ink)' }}
              />
              {filters.pincode && (
                <button onClick={()=>{ set('pincode',undefined); setApplied(f=>({...f,pincode:undefined})) }}
                  className="w-4 h-4 rounded-full bg-ivory-2 flex items-center justify-center flex-shrink-0 hover:bg-ivory-3 transition-colors">
                  <X className="w-2.5 h-2.5 text-ink-light" />
                </button>
              )}
            </div>

            {locStatus === 'denied' && (
              <p className="w-full text-xs" style={{ color:'#EF4444' }}>
                ⚠️ Location permission denied. Enable it in browser settings, or search by pincode above.
              </p>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-faint mr-1 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </span>
            <SelectPill label="State"         icon="🗺️" value={filters.state||''}        options={states}  onChange={v=>set('state',v||undefined)} />
            <SelectPill label="City"          icon="📍" value={filters.city||''}         options={cities}  onChange={v=>set('city',v||undefined)} />
            <MultiPill  label="Board"         icon="📚" options={boards}  selected={filters.board??[]}          onChange={v=>set('board',v.length?v:undefined)} />
            <SelectPill label="School Type"   icon="🏫" value={filters.schoolType||''}   options={types}   onChange={v=>set('schoolType',v||undefined)} />
            <SelectPill label="Gender Policy" icon="⚧️" value={filters.genderPolicy||''} options={genders} onChange={v=>set('genderPolicy',v||undefined)} />
            <SelectPill label="Medium"        icon="🗣" value={filters.medium||''}       options={mediums} onChange={v=>set('medium',v||undefined)} />
            <FeePill feeMin={filters.feeMin} feeMax={filters.feeMax} onChange={(min,max)=>{ set('feeMin',min); set('feeMax',max) }} />
            <MultiPill label="Rating" icon="⭐" options={[
              {label:'3+ Stars',value:'3'},{label:'3.5+ Stars',value:'3.5'},{label:'4+ Stars',value:'4'},{label:'4.5+ Stars',value:'4.5'},
            ]} selected={filters.rating?[String(filters.rating)]:[]}
              onChange={v=>set('rating',v.length?Number(v[v.length-1]):undefined)} />
            <MoreFilters filters={filters} onChange={set} />
            {activeFilterCount>0 && (
              <button onClick={reset} className="flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-ink-muted hover:text-ink transition-colors">
                <X className="w-3.5 h-3.5" /> Reset ({activeFilterCount})
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-ink-faint text-xs mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              <Link href="/register" className="text-gold font-semibold hover:underline">Register free</Link>
              <span>to search, save and compare schools</span>
            </p>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          {chips.length>0 && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }}
              className="flex flex-wrap gap-2 mb-5 overflow-hidden">
              {chips.map((c,i)=><Chip key={i} label={c.label} onRemove={c.clear} />)}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-5">
          <p className="text-ink-muted text-sm">
            {isLoading
              ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin inline-block" />Searching…</span>
              : <><span className="font-bold text-ink">{total.toLocaleString('en-IN')}</span> schools found{isFetching&&!isLoading&&<span className="ml-2 text-gold text-xs animate-pulse">Updating…</span>}</>
            }
          </p>
          <div className="flex items-center gap-2">
            <select value={filters.sortBy} onChange={e=>set('sortBy',e.target.value)}
              className="border border-[rgba(13,17,23,0.12)] rounded-xl px-3 py-2 text-xs text-ink bg-white outline-none focus:border-gold transition-colors cursor-pointer">
              <option value="rating">Best Rated</option>
              <option value="newest">Newest First</option>
              <option value="fee_asc">Fee: Low → High</option>
              <option value="fee_desc">Fee: High → Low</option>
            </select>
            <div className="flex border border-[rgba(13,17,23,0.12)] rounded-xl overflow-hidden bg-white">
              <button onClick={()=>setViewMode('grid')} className={clsx('p-2 transition-colors',viewMode==='grid'?'bg-ink text-ivory':'text-ink-muted hover:bg-ivory')}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={()=>setViewMode('list')} className={clsx('p-2 transition-colors',viewMode==='list'?'bg-ink text-ivory':'text-ink-muted hover:bg-ivory')}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {viewMode==='grid' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20, paddingBottom: compareList.length>=2 ? 100 : 0 }}>
            {isLoading
              ? Array.from({length:9}).map((_,i)=><SkeletonGrid key={i} />)
              : schools.length===0
                ? (
                  <div style={{ gridColumn:'1/-1', paddingBlock:96, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                    <div style={{ width:64,height:64, borderRadius:20, background:'rgba(13,17,23,0.05)', border:'1px solid rgba(13,17,23,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Search style={{ width:28,height:28, color:'rgba(13,17,23,0.2)' }} />
                    </div>
                    <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, color:C.ink, fontSize:22 }}>No Schools Found</h3>
                    <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:C.inkMuted, textAlign:'center', maxWidth:320 }}>Try different filters or a broader search.</p>
                    <button onClick={reset} style={{ marginTop:4, padding:'10px 24px', borderRadius:12, background:C.ink, color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, border:'none', cursor:'pointer' }}>Reset Filters</button>
                  </div>
                )
                : schools.map((s,i)=><SchoolCardGrid key={s.id} school={s} i={i} selected={!!compareList.find(c=>c.id===s.id)} onToggle={toggleCompare} />)
            }
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom: compareList.length>=2 ? 100 : 0 }}>
            {isLoading
              ? Array.from({length:8}).map((_,i)=><SkeletonList key={i} />)
              : schools.length===0
                ? (
                  <div style={{ paddingBlock:96, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                    <div style={{ width:64,height:64, borderRadius:20, background:'rgba(13,17,23,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Search style={{ width:28,height:28, color:'rgba(13,17,23,0.2)' }} />
                    </div>
                    <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, color:C.ink, fontSize:22 }}>No Schools Found</h3>
                    <button onClick={reset} style={{ padding:'10px 24px', borderRadius:12, background:C.ink, color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, border:'none', cursor:'pointer' }}>Reset Filters</button>
                  </div>
                )
                : schools.map((s,i)=><SchoolCardList key={s.id} school={s} i={i} selected={!!compareList.find(c=>c.id===s.id)} onToggle={toggleCompare} />)
            }
          </div>
        )}

        {!isLoading && totalPg>1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button disabled={(applied.page??1)<=1}
              onClick={()=>{ const p=(applied.page??1)-1; set('page',p); setApplied(f=>({...f,page:p})) }}
              className="px-5 py-2.5 rounded-xl border border-[rgba(13,17,23,0.12)] bg-white text-ink-light text-sm font-medium hover:border-gold hover:text-gold disabled:opacity-40 transition-all">
              ← Prev
            </button>
            <span className="text-ink-muted text-sm">Page <span className="font-bold text-ink">{applied.page}</span> of <span className="font-bold text-ink">{totalPg}</span></span>
            <button disabled={(applied.page??1)>=totalPg}
              onClick={()=>{ const p=(applied.page??1)+1; set('page',p); setApplied(f=>({...f,page:p})) }}
              className="px-5 py-2.5 rounded-xl border border-[rgba(13,17,23,0.12)] bg-white text-ink-light text-sm font-medium hover:border-gold hover:text-gold disabled:opacity-40 transition-all">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
