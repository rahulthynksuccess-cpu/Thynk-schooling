'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star, ThumbsUp, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  {href:'/dashboard/school',label:'Overview',icon:'📊'},
  {href:'/dashboard/school/leads',label:'Leads',icon:'📋'},
  {href:'/dashboard/school/applications',label:'Applications',icon:'📝'},
  {href:'/dashboard/school/reviews',label:'Reviews',icon:'⭐'},
  {href:'/dashboard/school/analytics',label:'Analytics',icon:'📈'},
  
]

function SchoolLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--ivory,#FAF7F2)' }}>
      <aside style={{ width:240, background:'#0D1117', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:18, color:'#FAF7F2', textDecoration:'none' }}>
            Thynk<em style={{ fontStyle:'italic', color:'#B8860B' }}>Schooling</em>
          </Link>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4, fontFamily:'DM Sans,sans-serif' }}>School Dashboard</div>
        </div>
        <nav style={{ flex:1, padding:'8px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9,
              textDecoration:'none', fontFamily:'DM Sans,sans-serif', fontSize:13,
              fontWeight: pathname===item.href ? 600 : 400,
              background: pathname===item.href ? 'rgba(184,134,11,0.12)' : 'transparent',
              color: pathname===item.href ? '#E8C547' : 'rgba(255,255,255,0.5)',
              borderLeft: pathname===item.href ? '3px solid #B8860B' : '3px solid transparent',
            }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:'10px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, textDecoration:'none', fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif' }}>← View Site</Link>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:'auto', padding:'clamp(20px,3vw,40px)' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(1.8rem,3vw,2.8rem)', color:'#0D1117', marginBottom:24, letterSpacing:'-1px' }}>{title}</h1>
        {children}
      </main>
    </div>
  )
}

function ReviewsList() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/admin/reviews',{cache:'no-store'}).then(r=>r.json()).then(d=>setReviews(d.reviews||d.data||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {loading ? <div style={{padding:40,textAlign:'center',color:'#718096',fontFamily:'DM Sans,sans-serif'}}>Loading…</div> :
      reviews.length === 0 ? <div style={{background:'#fff',borderRadius:14,border:'1px solid rgba(13,17,23,0.08)',padding:40,textAlign:'center'}}><div style={{fontSize:40,marginBottom:12}}>⭐</div><p style={{fontFamily:'DM Sans,sans-serif',color:'#718096'}}>No reviews yet. Parents will review your school here.</p></div> :
      reviews.map((r:any,i:number)=>(
        <div key={r.id||i} style={{background:'#fff',borderRadius:12,border:'1px solid rgba(13,17,23,0.08)',padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=(r.rating||0)?'#B8860B':'#E2E8F0',fontSize:14}}>★</span>)}</div>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'#718096'}}>{r.createdAt?new Date(r.createdAt).toLocaleDateString('en-IN'):''}</span>
          </div>
          <p style={{fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#0D1117',lineHeight:1.65,margin:0}}>{r.content||r.comment||'No content'}</p>
          <div style={{marginTop:8,fontSize:12,color:'#B8860B',fontFamily:'DM Sans,sans-serif',fontWeight:600}}>— {r.reviewerName||r.parent_name||'Anonymous Parent'}</div>
        </div>
      ))}
    </div>
  )
}
export default function ReviewsPage() { return <SchoolLayout title="Reviews"><ReviewsList /></SchoolLayout> }