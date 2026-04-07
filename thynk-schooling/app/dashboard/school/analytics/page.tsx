'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Eye, Users, FileText, Star, MessageSquare, Heart, TrendingUp } from 'lucide-react'

const CARDS = [
  { key:'totalLeads',        label:'Total Leads',        icon:Users,        grad:'linear-gradient(135deg,#667eea,#764ba2)', shadow:'rgba(102,126,234,0.4)' },
  { key:'totalApplications', label:'Applications',       icon:FileText,     grad:'linear-gradient(135deg,#4facfe,#00f2fe)', shadow:'rgba(79,172,254,0.4)' },
  { key:'avgRating',         label:'Avg Rating',         icon:Star,         grad:'linear-gradient(135deg,#43e97b,#38f9d7)', shadow:'rgba(67,233,123,0.4)' },
  { key:'totalReviews',      label:'Reviews',            icon:MessageSquare,grad:'linear-gradient(135deg,#f093fb,#f5576c)', shadow:'rgba(245,87,108,0.4)' },
  { key:'profileViews',      label:'Profile Views',      icon:Eye,          grad:'linear-gradient(135deg,#fa709a,#fee140)', shadow:'rgba(250,112,154,0.4)' },
  { key:'newLeadsThisMonth', label:'New This Month',     icon:TrendingUp,   grad:'linear-gradient(135deg,#30cfd0,#330867)', shadow:'rgba(48,207,208,0.4)' },
]

export default function AnalyticsPage() {
  const { accessToken, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    fetch('/api/schools?action=dashboard-stats', { credentials: 'include' })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false))
  }, [mounted, accessToken])

  if (!mounted) return null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F0EDE8', fontFamily:"'Bricolage Grotesque',system-ui,sans-serif" }}>
      <aside style={{ width:252, background:'#0A0A0F', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
        <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#B8860B,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:17, fontWeight:700, color:'#FAF7F2' }}>Thynk<span style={{ color:'#F59E0B' }}>Schooling</span></div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2, letterSpacing:'0.1em', textTransform:'uppercase' }}>School Portal</div>
            </div>
          </Link>
        </div>
        <nav style={{ flex:1, padding:'10px 12px' }}>
          {[
            { href:'/dashboard/school', label:'Dashboard', icon:'📊' },
            { href:'/dashboard/school/leads', label:'Leads', icon:'👥' },
            { href:'/dashboard/school/applications', label:'Applications', icon:'📝' },
            { href:'/dashboard/school/reviews', label:'Reviews', icon:'⭐' },
            { href:'/dashboard/school/packages', label:'Subscription', icon:'💳' },
            { href:'/dashboard/school/analytics', label:'Analytics', icon:'📈' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, textDecoration:'none', fontSize:13, fontWeight:600, marginBottom:2, color: item.href.includes('analytics') ? '#fff' : 'rgba(255,255,255,0.36)', background: item.href.includes('analytics') ? 'rgba(184,134,11,0.16)' : 'transparent' }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={{ flex:1, padding:'36px 40px', overflowY:'auto' }}>
        <h1 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:28, fontWeight:700, color:'#0D1117', marginBottom:28, letterSpacing:'-0.03em' }}>Analytics</h1>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
          {CARDS.map(({ key, label, icon: Icon, grad, shadow }) => {
            const raw = stats[key]
            const val = key === 'avgRating' && raw ? `${Number(raw).toFixed(1)}★` : (raw ?? 0)
            return (
              <div key={key} style={{ background:grad, borderRadius:18, padding:'24px 22px', position:'relative', overflow:'hidden', boxShadow:`0 12px 40px ${shadow}` }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.2) 0%,transparent 60%)', pointerEvents:'none' }} />
                <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  <Icon size={18} color="#fff" />
                </div>
                <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:40, fontWeight:700, color:'#fff', lineHeight:1, letterSpacing:'-2px', marginBottom:6 }}>
                  {loading ? '…' : val}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{label}</div>
              </div>
            )
          })}
        </div>

        <div style={{ background:'#fff', borderRadius:18, border:'1px solid rgba(13,17,23,0.07)', padding:28, boxShadow:'0 2px 16px rgba(13,17,23,0.05)' }}>
          <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:20, fontWeight:700, color:'#0D1117', marginBottom:10 }}>Analytics Details</h3>
          <p style={{ fontSize:14, color:'#64748B', lineHeight:1.65 }}>Detailed charts will appear once your school receives enquiries. Keep your profile complete and verified to start attracting parents.</p>
        </div>
      </main>
    </div>
  )
}
