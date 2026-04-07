'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, FileText, Clock, CheckCircle2, XCircle, Users } from 'lucide-react'

const STATUS_STYLE: Record<string, [string,string]> = {
  submitted:    ['#3B82F6','rgba(59,130,246,0.1)'],
  under_review: ['#F59E0B','rgba(245,158,11,0.1)'],
  accepted:     ['#10B981','rgba(16,185,129,0.1)'],
  rejected:     ['#EF4444','rgba(239,68,68,0.1)'],
  waitlisted:   ['#8B5CF6','rgba(139,92,246,0.1)'],
}

export default function SchoolApplicationsPage() {
  const { accessToken, user } = useAuthStore()
  const router = useRouter()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    fetch('/api/schools?action=applications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setApps(Array.isArray(d) ? d : d.data || d.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [mounted, accessToken])

  if (!mounted) return null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F0EDE8', fontFamily:"'Bricolage Grotesque',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:252, background:'#0A0A0F', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
        <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#B8860B,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 18px rgba(184,134,11,0.5)' }}>
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
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, textDecoration:'none', fontSize:13, fontWeight:600, marginBottom:2, color: item.href.includes('applications') ? '#fff' : 'rgba(255,255,255,0.36)', background: item.href.includes('applications') ? 'rgba(184,134,11,0.16)' : 'transparent' }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'36px 40px', overflowY:'auto' }}>
        <h1 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:28, fontWeight:700, color:'#0D1117', marginBottom:24, letterSpacing:'-0.03em' }}>Applications</h1>

        <div style={{ background:'#fff', borderRadius:18, border:'1px solid rgba(13,17,23,0.07)', overflow:'hidden', boxShadow:'0 2px 16px rgba(13,17,23,0.05)' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(13,17,23,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:'#0D1117' }}>Admission Applications</span>
            <span style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>{apps.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding:'48px', textAlign:'center', color:'#64748B' }}>Loading…</div>
          ) : apps.length === 0 ? (
            <div style={{ padding:'64px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'#F8FAFC', border:'1px solid rgba(13,17,23,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={28} color="#CBD5E1" />
              </div>
              <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:'#0D1117' }}>No applications yet</div>
              <div style={{ fontSize:13, color:'#64748B', maxWidth:300, lineHeight:1.6 }}>When parents apply to your school, applications will appear here.</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAFAFA' }}>
                  {['Applicant','Child','Class','Applied On','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'1.2px', textTransform:'uppercase', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((a: any, i: number) => {
                  const st = a.status || 'submitted'
                  const [color, bg] = STATUS_STYLE[st] || STATUS_STYLE.submitted
                  return (
                    <tr key={a.id || i} style={{ borderBottom:'1px solid rgba(13,17,23,0.04)' }}>
                      <td style={{ padding:'14px 20px', fontSize:13, fontWeight:700, color:'#0D1117' }}>{a.parent_name || a.parentName || '—'}</td>
                      <td style={{ padding:'14px 20px', fontSize:13, color:'#475569' }}>{a.child_name || a.childName || '—'}</td>
                      <td style={{ padding:'14px 20px', fontSize:13, color:'#475569' }}>{a.class_applying_for || a.classApplyingFor || '—'}</td>
                      <td style={{ padding:'14px 20px', fontSize:12, color:'#94A3B8' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                      <td style={{ padding:'14px 20px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:99, fontSize:11, fontWeight:700, color, background: bg, textTransform:'capitalize' }}>
                          {st.replace(/_/g,' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
