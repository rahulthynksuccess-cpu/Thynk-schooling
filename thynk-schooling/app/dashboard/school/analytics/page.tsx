'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Eye, Users, Star, BarChart3 } from 'lucide-react'
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

function AnalyticsCards() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/schools?action=analytics',{cache:'no-store'}).then(r=>r.json()).then(d=>setStats(d)).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  const cards = [
    {label:'Profile Views',value:stats.profileViews||'—',icon:'👁️',color:'#B8860B'},
    {label:'Total Leads',value:stats.totalLeads||'—',icon:'📋',color:'#0A5F55'},
    {label:'Applications',value:stats.totalApplications||'—',icon:'📝',color:'#7A6A52'},
    {label:'Avg Rating',value:stats.avgRating?`${Number(stats.avgRating).toFixed(1)}★`:'—',icon:'⭐',color:'#B8860B'},
    {label:'Reviews',value:stats.totalReviews||'—',icon:'💬',color:'#0A5F55'},
    {label:'Saved by Parents',value:stats.savedCount||'—',icon:'❤️',color:'#7A6A52'},
  ]
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
        {cards.map(c=>(
          <div key={c.label} style={{background:'#fff',borderRadius:12,border:'1px solid rgba(13,17,23,0.08)',padding:24}}>
            <div style={{fontSize:28,marginBottom:10}}>{c.icon}</div>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontWeight:700,fontSize:36,color:c.color,lineHeight:1}}>{loading?'…':c.value}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'#718096',marginTop:4}}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,border:'1px solid rgba(13,17,23,0.08)',padding:28}}>
        <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:700,color:'#0D1117',marginBottom:16}}>Analytics Details</h3>
        <p style={{fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#718096',lineHeight:1.65}}>Detailed analytics charts will appear here once your school has data. Ensure your school profile is complete and verified to start attracting parent enquiries.</p>
        <Link href="/dashboard/school" style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:16,padding:'10px 20px',background:'#B8860B',color:'#fff',borderRadius:8,textDecoration:'none',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600}}>Complete Profile →</Link>
      </div>
    </div>
  )
}
export default function AnalyticsPage() { return <SchoolLayout title="Analytics"><AnalyticsCards /></SchoolLayout> }