'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, FileText } from 'lucide-react'
import { authHeaders } from '@/utils/authHeaders'

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

    fetch('/api/school-portal?action=applications', {
      credentials: 'include',
      headers: authHeaders(),
    })
      .then(r => r.json())
      .then(d => setApps(Array.isArray(d) ? d : d.data || d.applications || []))
      .finally(() => setLoading(false))
  }, [mounted, accessToken])

  if (!mounted) return null

  return (
    <div style={{
      display:'flex',
      minHeight:'100vh',
      background:'linear-gradient(180deg,#F8F6F2 0%,#F0EDE8 100%)'
    }}>

      {/* Spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Sidebar */}
      <aside style={{
  width:252,
  background:'linear-gradient(180deg,#020617 0%, #0F172A 100%)',
  boxShadow:'4px 0 40px rgba(0,0,0,0.5)',
  color:'#fff',
  display:'flex',
  flexDirection:'column'
}}>

  {/* Logo */}
  <div style={{
    padding:'22px 20px',
    borderBottom:'1px solid rgba(255,255,255,0.08)'
  }}>
    <Link href="/" style={{
      display:'flex',
      alignItems:'center',
      gap:12,
      textDecoration:'none'
    }}>
      <div style={{
        width:38,
        height:38,
        borderRadius:12,
        background:'linear-gradient(135deg,#F59E0B,#D97706)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        boxShadow:'0 6px 20px rgba(245,158,11,0.5)'
      }}>
        <GraduationCap size={18} color="#fff" />
      </div>

      <div>
        <div style={{
          fontSize:16,
          fontWeight:700,
          color:'#FFFFFF'
        }}>
          Thynk<span style={{ color:'#F59E0B' }}>Schooling</span>
        </div>

        <div style={{
          fontSize:10,
          color:'rgba(255,255,255,0.5)',
          marginTop:2,
          letterSpacing:'0.08em'
        }}>
          SCHOOL PANEL
        </div>
      </div>
    </Link>
  </div>

  {/* Menu */}
  <nav style={{ flex:1, padding:'12px' }}>
    {[
      { href:'/dashboard/school', label:'Dashboard', icon:'📊' },
      { href:'/dashboard/school/leads', label:'Leads', icon:'👥' },
      { href:'/dashboard/school/applications', label:'Applications', icon:'📝' },
      { href:'/dashboard/school/reviews', label:'Reviews', icon:'⭐' },
      { href:'/dashboard/school/packages', label:'Subscription', icon:'💳' },
      { href:'/dashboard/school/analytics', label:'Analytics', icon:'📈' },
    ].map(item => {
      const active = item.href.includes('applications')

      return (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display:'flex',
            alignItems:'center',
            gap:12,
            padding:'12px 14px',
            borderRadius:12,
            textDecoration:'none',
            fontSize:13,
            fontWeight:600,
            marginBottom:6,

            color: active ? '#fff' : 'rgba(255,255,255,0.75)',

            background: active
              ? 'linear-gradient(135deg,#F59E0B,#D97706)'
              : 'transparent',

            boxShadow: active
              ? '0 8px 20px rgba(245,158,11,0.35)'
              : 'none',

            transition:'all 0.2s ease'
          }}
        >
          <span style={{ fontSize:16 }}>{item.icon}</span>
          {item.label}
        </Link>
      )
    })}
  </nav>
</aside>

      {/* Main */}
      <main style={{ flex:1, padding:'40px' }}>

        <h1 style={{
          fontSize:32,
          fontWeight:800,
          letterSpacing:'-0.04em',
          marginBottom:28
        }}>
          Applications
        </h1>

        <div style={{
          background:'#fff',
          borderRadius:18,
          border:'1px solid rgba(13,17,23,0.07)',
          boxShadow:'0 10px 30px rgba(13,17,23,0.08)',
          overflow:'hidden'
        }}>

          <div style={{ padding:20, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between' }}>
            <strong>Admission Applications</strong>
            <span style={{ fontSize:12, color:'#64748B' }}>{apps.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <div style={{
                width:30,
                height:30,
                border:'3px solid #E5E7EB',
                borderTop:'3px solid #F59E0B',
                borderRadius:'50%',
                margin:'0 auto',
                animation:'spin 0.8s linear infinite'
              }} />
              <div style={{ marginTop:10, fontSize:12 }}>Loading applications...</div>
            </div>
          ) : apps.length === 0 ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <FileText size={40} color="#ccc" />
              <p>No applications yet</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAFAFA' }}>
                  {['Applicant','Child','Class','Applied On','Status'].map(h => (
                    <th key={h} style={{
                      padding:'10px 20px',
                      textAlign:'left',
                      fontSize:10,
                      fontWeight:700,
                      color:'#94A3B8'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {apps.map((a: any, i: number) => {
                  const st = a.status || 'submitted'
                  const [color, bg] = STATUS_STYLE[st]

                  return (
                    <tr
                      key={a.id || i}
                      style={{
                        background: i % 2 ? '#FAFAFA' : '#fff',
                        transition:'all 0.2s ease',
                        cursor:'pointer'
                      }}
                      onMouseEnter={e=>{
                        e.currentTarget.style.transform='scale(1.01)'
                        e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.06)'
                      }}
                      onMouseLeave={e=>{
                        e.currentTarget.style.transform='scale(1)'
                        e.currentTarget.style.boxShadow='none'
                      }}
                    >
                      <td style={{ padding:14, fontWeight:600 }}>{a.parent_name || '—'}</td>
                      <td style={{ padding:14 }}>{a.child_name || '—'}</td>
                      <td style={{ padding:14 }}>{a.class_applying_for || '—'}</td>
                      <td style={{ padding:14 }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding:14 }}>
                        <span style={{
                          background:bg,
                          color,
                          padding:'6px 10px',
                          borderRadius:20,
                          fontSize:11
                        }}>
                          {st}
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
