'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Phone, MapPin, CheckCircle2, ShoppingCart, LayoutGrid, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const NAV = [
  {href:'/dashboard/school',label:'Overview',icon:'📊'},
  {href:'/dashboard/school/leads',label:'Leads',icon:'📋'},
  {href:'/dashboard/school/applications',label:'Applications',icon:'📝'},
  {href:'/dashboard/school/reviews',label:'Reviews',icon:'⭐'},
  {href:'/dashboard/school/analytics',label:'Analytics',icon:'📈'},
]

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  new:            { bg: '#D1FAE5', color: '#059669', label: 'New' },
  contacted:      { bg: '#DBEAFE', color: '#2563EB', label: 'Contacted' },
  interested:     { bg: '#FEF3C7', color: '#D97706', label: 'Interested' },
  not_interested: { bg: '#F3F4F6', color: '#6B7280', label: 'Not Interested' },
  admitted:       { bg: '#EDE9FE', color: '#7C3AED', label: 'Admitted' },
  lost:           { bg: '#FEE2E2', color: '#DC2626', label: 'Lost' },
}

function maskName(n: string) {
  if (!n) return '****'
  const parts = n.trim().split(' ')
  return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ')
}
function maskPhone(p: string) {
  if (!p) return '***** *****'
  const d = p.replace(/\D/g, '')
  return d.slice(0, 2) + '*'.repeat(Math.max(0, d.length - 4)) + d.slice(-2)
}

function SchoolLayout({ children, title, credits }: { children: React.ReactNode; title: string; credits?: number }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F7F8FC', fontFamily:'system-ui,sans-serif' }}>
      <aside style={{ width:240, background:'#0D1117', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ fontFamily:'serif', fontWeight:700, fontSize:18, color:'#FAF7F2', textDecoration:'none' }}>
            Thynk<em style={{ fontStyle:'italic', color:'#F59E0B' }}>Schooling</em>
          </Link>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>School Dashboard</div>
        </div>
        <nav style={{ flex:1, padding:'8px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9,
              textDecoration:'none', fontSize:13,
              fontWeight: pathname===item.href ? 600 : 400,
              background: pathname===item.href ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: pathname===item.href ? '#F59E0B' : 'rgba(255,255,255,0.5)',
              borderLeft: pathname===item.href ? '3px solid #F59E0B' : '3px solid transparent',
            }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        {credits !== undefined && (
          <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:6 }}>
            <Zap size={13} color="#F59E0B" />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Credits:</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#F59E0B' }}>{credits}</span>
          </div>
        )}
      </aside>
      <main style={{ flex:1, overflowY:'auto', padding:'clamp(20px,3vw,40px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
          <h1 style={{ fontFamily:'serif', fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'#111827', letterSpacing:'-1px', margin:0 }}>{title}</h1>
          <Link href="/pricing" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, background:'#F59E0B', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600, boxShadow:'0 4px 12px rgba(245,158,11,0.3)' }}>
            <LayoutGrid size={14} /> Upgrade Plan
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

// ── Subscription Plan Cards shown when no credits ────────────────────────────
function SubscriptionPlanCards() {
  interface SubPlan {
    id: string; planKey: string; name: string; description: string
    price: number; leadsPerMonth: number; features: string[]
    isHot: boolean; cta: string; sortOrder: number; isActive: boolean
  }

  const { data: plans, isLoading } = useQuery<SubPlan[]>({
    queryKey: ['subscription-plans-leads'],
    queryFn: () => fetch('/api/admin?action=subscription-plans', { cache:'no-store' }).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
      {Array.from({length:4}).map((_,i) => (
        <div key={i} style={{ height:220, borderRadius:14, background:'#F3F4F6', animation:'pulse 1.5s infinite' }} />
      ))}
    </div>
  )

  const activePlans = (plans ?? []).filter(p => p.isActive)
  if (!activePlans.length) return null

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {activePlans.map((plan, i) => (
          <Link key={plan.id} href={`/pricing`} style={{ textDecoration:'none' }}>
            <div style={{
              background:'#fff',
              border: plan.isHot ? '2px solid #F59E0B' : '1px solid rgba(0,0,0,0.08)',
              borderRadius:14, padding:'20px 18px', position:'relative', cursor:'pointer',
              transition:'transform 0.15s,box-shadow 0.15s',
              boxShadow: plan.isHot ? '0 4px 24px rgba(245,158,11,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Vertical Most Popular strip */}
              {plan.isHot && (
                <div style={{
                  position:'absolute', top:0, right:0, width:22, height:'100%',
                  background:'linear-gradient(180deg,#B8860B,#F59E0B)',
                  display:'flex', alignItems:'center', justifyContent:'center', zIndex:2,
                }}>
                  <span style={{
                    writingMode:'vertical-rl', textOrientation:'mixed', transform:'rotate(180deg)',
                    fontSize:8, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase',
                    color:'#fff', whiteSpace:'nowrap', userSelect:'none',
                  }}>
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              <div style={{ paddingRight: plan.isHot ? 28 : 0 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <LayoutGrid size={18} color="#F59E0B" />
                </div>
                <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:3 }}>{plan.name}</div>
                {plan.description && <div style={{ fontSize:11, color:'#6B7280', marginBottom:10 }}>{plan.description}</div>}
                <div style={{ fontWeight:800, fontSize:22, color:'#111827' }}>
                  {plan.price === 0 ? 'Free' : `₹${Math.round(plan.price / 100).toLocaleString('en-IN')}`}
                </div>
                <div style={{ fontSize:11, color:'#6B7280', marginBottom:10 }}>
                  {plan.price === 0 ? 'forever' : '/month'} · {plan.leadsPerMonth === -1 ? 'Unlimited' : plan.leadsPerMonth} leads/mo
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#F59E0B', fontWeight:600 }}>
                  {plan.cta} <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Leads Table ──────────────────────────────────────────────────────────
function LeadsContent() {
  const queryClient = useQueryClient()
  const [buyingId, setBuyingId] = useState<string|null>(null)

  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache:'no-store', credentials:'include' }).then(r => r.json()),
  })
  const credits = creditsData?.availableCredits ?? 0

  const { data, isLoading } = useQuery<{ data?: any[]; total?: number; error?: string; message?: string }>({
    queryKey: ['school-leads-full'],
    queryFn: () => fetch('/api/leads?limit=50', { cache:'no-store', credentials:'include' }).then(r => r.json()),
    staleTime: 30 * 1000,
  })
  const leads = data?.data ?? []
  const isProfileIncomplete = data?.error === 'PROFILE_INCOMPLETE'
  const isAccountSuspended  = data?.error === 'ACCOUNT_SUSPENDED'

  const buyMutation = useMutation({
    mutationFn: (leadId: string) => {
      setBuyingId(leadId)
      return fetch(`/api/leads?id=${leadId}&action=purchase`, {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
      }).then(r => r.json())
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Lead unlocked!')
      queryClient.invalidateQueries({ queryKey: ['school-leads-full'] })
      queryClient.invalidateQueries({ queryKey: ['lead-credits'] })
      setBuyingId(null)
    },
    onError: () => { toast.error('Failed to unlock lead.'); setBuyingId(null) },
  })

  if (isLoading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {Array.from({length:5}).map((_,i) => (
        <div key={i} style={{ height:60, borderRadius:10, background:'#F3F4F6' }} />
      ))}
    </div>
  )

  // ── Profile incomplete — block access ───────────────────────────────────────
  if (isProfileIncomplete) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 24px', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)', border:'2px solid rgba(245,158,11,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:36 }}>🏫</div>
      <h2 style={{ fontFamily:'serif', fontWeight:700, fontSize:26, color:'#111827', marginBottom:10, letterSpacing:'-0.5px' }}>Complete Your School Profile</h2>
      <p style={{ fontSize:14, color:'#6B7280', maxWidth:440, lineHeight:1.75, marginBottom:28 }}>
        Your school profile is not yet complete. Please fill in all required details — school name, board, classes, fees, address and contact info — before you can access parent leads.
      </p>
      <Link href="/school/complete-profile" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 32px', borderRadius:12, background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', marginBottom:16 }}>
        📝 Complete Profile Now
      </Link>
      <p style={{ fontSize:12, color:'#9CA3AF' }}>Once your profile is complete, parent leads will appear here automatically.</p>
      <div style={{ marginTop:40, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, maxWidth:480, width:'100%' }}>
        {[
          { icon:'🔒', title:'Leads Locked',   desc:'Profile must be 100% complete' },
          { icon:'👁️', title:'Not Visible',    desc:'Parents cannot find your school' },
          { icon:'💳', title:'Credits Paused', desc:'Purchase after completing profile' },
        ].map(item => (
          <div key={item.title} style={{ background:'#F9FAFB', borderRadius:12, padding:'16px 14px', border:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:26, marginBottom:8 }}>{item.icon}</div>
            <div style={{ fontWeight:700, fontSize:12, color:'#111827', marginBottom:3 }}>{item.title}</div>
            <div style={{ fontSize:11, color:'#6B7280', lineHeight:1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )

  if (isAccountSuspended) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 24px', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:24, background:'#FEE2E2', border:'2px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:36 }}>🚫</div>
      <h2 style={{ fontFamily:'serif', fontWeight:700, fontSize:26, color:'#111827', marginBottom:10 }}>Account Suspended</h2>
      <p style={{ fontSize:14, color:'#6B7280', maxWidth:380, lineHeight:1.75, marginBottom:24 }}>
        Your school account has been suspended by the admin. Please contact our support team to resolve this.
      </p>
      <a href="mailto:support@thynkschooling.in" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:12, background:'#EF4444', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700 }}>
        ✉️ Contact Support
      </a>
    </div>
  )

  return (
    <div>
      {/* No-credits banner + subscription plan cards */}
      {credits === 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:14, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap size={20} color="#F59E0B" />
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#111827', marginBottom:3 }}>You have 0 lead credits</div>
              <div style={{ fontSize:13, color:'#6B7280' }}>Upgrade your subscription plan to get lead credits included every month and start unlocking parent contacts.</div>
            </div>
            <Link href="/pricing" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, background:'#F59E0B', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600, flexShrink:0 }}>
              View Plans <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ fontWeight:600, fontSize:14, color:'#374151', marginBottom:12 }}>Choose a Subscription Plan</div>
          <SubscriptionPlanCards />
          <div style={{ height:1, background:'rgba(0,0,0,0.07)', margin:'28px 0' }} />
        </div>
      )}

      {/* Leads table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(0,0,0,0.08)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Parent Leads</span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {credits > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', fontSize:12, fontWeight:600, color:'#D97706' }}>
                <Zap size={11} /> {credits} credits
              </span>
            )}
            <span style={{ fontSize:12, color:'#6B7280' }}>{data?.total ?? 0} total</span>
          </div>
        </div>

        {leads.length === 0 ? (
          <div style={{ padding:'52px 20px', textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:600, fontSize:15, color:'#111827', marginBottom:6 }}>No leads yet</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:16, maxWidth:320, margin:'0 auto 16px' }}>
              Complete your school profile to start receiving parent enquiries.
            </div>
            <Link href="/school/complete-profile" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, background:'#111827', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600 }}>
              Complete Profile <ChevronRight size={13} />
            </Link>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAFAFA' }}>
                  {['Parent / Child', 'Phone', 'City', 'Status', 'Action'].map((h, i) => (
                    <th key={h} style={{ padding:'10px 16px', textAlign: i===4 ? 'right' : 'left', fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => {
                  const st = STATUS_COLORS[lead.status] || STATUS_COLORS.new
                  const displayName  = lead.isPurchased ? lead.fullName  : maskName(lead.maskedName || lead.fullName || 'Parent')
                  const displayPhone = lead.isPurchased ? lead.fullPhone : maskPhone(lead.maskedPhone || lead.fullPhone || '')
                  return (
                    <tr key={lead.id} style={{ borderTop:'1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(245,158,11,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#D97706', flexShrink:0 }}>
                            {(displayName || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{displayName || '—'}</div>
                            {(lead.childName || lead.classApplyingFor) && (
                              <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>
                                {lead.childName}{lead.childName && lead.classApplyingFor ? ' · ' : ''}{lead.classApplyingFor ? `Class ${lead.classApplyingFor}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#4B5563', fontFamily:'monospace', opacity: lead.isPurchased ? 1 : 0.5 }}>
                          <Phone size={11} color="#9CA3AF" />{displayPhone || '—'}
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' }}>
                          <MapPin size={11} color="#F59E0B" />{lead.city || '—'}
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:600, background:st.bg, color:st.color }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:st.color }} />{st.label}
                        </span>
                      </td>
                      <td style={{ padding:'13px 16px', textAlign:'right' }}>
                        {lead.isPurchased ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99, background:'#D1FAE5', color:'#10B981', fontSize:11, fontWeight:600 }}>
                            <CheckCircle2 size={11} /> Unlocked
                          </span>
                        ) : (
                          <button
                            onClick={() => buyMutation.mutate(lead.id)}
                            disabled={buyingId === lead.id || credits === 0}
                            title={credits === 0 ? 'Upgrade your plan to get credits' : 'Use 1 credit to unlock'}
                            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background: credits===0 ? '#F3F4F6' : '#111827', border:'none', color: credits===0 ? '#9CA3AF' : '#fff', cursor: credits===0 ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:500 }}
                          >
                            {buyingId === lead.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <ShoppingCart size={12} />}
                            {credits===0 ? 'No Credits' : 'Unlock (1 credit)'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}

export default function LeadsPage() {
  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache:'no-store', credentials:'include' }).then(r => r.json()),
  })

  return (
    <SchoolLayout title="Leads" credits={creditsData?.availableCredits}>
      <LeadsContent />
    </SchoolLayout>
  )
}
