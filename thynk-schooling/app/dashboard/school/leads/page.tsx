'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Phone, Mail, Star, Filter, Download } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  {href:'/dashboard/school',label:'Overview',icon:'📊'},
  {href:'/dashboard/school/leads',label:'Leads',icon:'📋'},
  {href:'/dashboard/school/applications',label:'Applications',icon:'📝'},
  {href:'/dashboard/school/reviews',label:'Reviews',icon:'⭐'},
  {href:'/dashboard/school/analytics',label:'Analytics',icon:'📈'},
  {href:'/dashboard/school/packages',label:'Packages',icon:'📦'}
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

function LeadsTable() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/leads',{cache:'no-store'}).then(r=>r.json()).then(d=>setLeads(d.leads||d.data||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  return (
    <div style={{background:'#fff',borderRadius:14,border:'1px solid rgba(13,17,23,0.08)',overflow:'hidden'}}>
      <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(13,17,23,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'DM Sans,sans-serif',fontSize:14,fontWeight:600,color:'#0D1117'}}>Parent Leads</span>
        <span style={{fontSize:12,color:'#718096',fontFamily:'DM Sans,sans-serif'}}>{leads.length} total</span>
      </div>
      {loading ? <div style={{padding:40,textAlign:'center',color:'#718096',fontFamily:'DM Sans,sans-serif'}}>Loading…</div> :
      leads.length === 0 ? <div style={{padding:40,textAlign:'center'}}><div style={{fontSize:40,marginBottom:12}}>📋</div><p style={{fontFamily:'DM Sans,sans-serif',color:'#718096'}}>No leads yet. They will appear here once parents enquire about your school.</p></div> :
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr style={{background:'#F9F8F6'}}>
          {['Parent','Phone','Child Class','Status','Date'].map(h=><th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:'#718096',fontFamily:'DM Sans,sans-serif',letterSpacing:'.08em',textTransform:'uppercase'}}>{h}</th>)}
        </tr></thead>
        <tbody>{leads.map((l:any,i:number)=><tr key={l.id||i} style={{borderTop:'1px solid rgba(13,17,23,0.05)'}}>
          <td style={{padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#0D1117',fontWeight:500}}>{l.parentName||l.fullName||'—'}</td>
          <td style={{padding:'12px 16px',fontFamily:'monospace',fontSize:12,color:'#4A5568'}}>{l.phone||'—'}</td>
          <td style={{padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:12,color:'#4A5568'}}>{l.classLevel||l.class_level||'—'}</td>
          <td style={{padding:'12px 16px'}}><span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:600,background:'rgba(184,134,11,0.1)',color:'#B8860B',fontFamily:'DM Sans,sans-serif'}}>{l.status||'New'}</span></td>
          <td style={{padding:'12px 16px',fontSize:12,color:'#718096',fontFamily:'DM Sans,sans-serif'}}>{l.createdAt?new Date(l.createdAt).toLocaleDateString('en-IN'):'—'}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  )
}
export default function LeadsPage() { return <SchoolLayout title="Leads"><LeadsTable /></SchoolLayout> }