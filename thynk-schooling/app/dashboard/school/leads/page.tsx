'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Phone, MapPin, CheckCircle2, ShoppingCart,
  LayoutGrid, Zap, ChevronRight, Loader2, BookOpen,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authHeaders } from '@/utils/authHeaders'

const NAV = [
  { href: '/dashboard/school',              label: 'Overview',      icon: '📊' },
  { href: '/dashboard/school/leads',        label: 'Leads',         icon: '📋' },
  { href: '/dashboard/school/applications', label: 'Applications',  icon: '📝' },
  { href: '/dashboard/school/reviews',      label: 'Reviews',       icon: '⭐' },
  { href: '/dashboard/school/analytics',    label: 'Analytics',     icon: '📈' },
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
function formatPrice(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

function SchoolLayout({ children, title, credits }: { children: React.ReactNode; title: string; credits?: number }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F8FC', fontFamily: 'system-ui,sans-serif' }}>
      <aside style={{ width: 240, background: '#0D1117', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 18, color: '#FAF7F2', textDecoration: 'none' }}>
            Thynk<em style={{ fontStyle: 'italic', color: '#F59E0B' }}>Schooling</em>
          </Link>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>School Dashboard</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9,
              textDecoration: 'none', fontSize: 13,
              fontWeight: pathname === item.href ? 600 : 400,
              background: pathname === item.href ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: pathname === item.href ? '#F59E0B' : 'rgba(255,255,255,0.5)',
              borderLeft: pathname === item.href ? '3px solid #F59E0B' : '3px solid transparent',
            }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        {credits !== undefined && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="#F59E0B" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Credits:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{credits}</span>
          </div>
        )}
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(20px,3vw,40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: '#111827', letterSpacing: '-1px', margin: 0 }}>{title}</h1>
          <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#F59E0B', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
            <LayoutGrid size={14} /> Buy Lead Credits
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

// ── Single-lead purchase modal ────────────────────────────────────────────────
function BuyLeadModal({
  lead, priceLabel, onConfirm, onCancel, loading,
}: {
  lead: any; priceLabel: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ShoppingCart size={24} color="#F59E0B" />
        </div>
        <h2 style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 22, color: '#111827', marginBottom: 8 }}>Purchase This Lead</h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 20 }}>
          You have no credits. You can purchase this individual lead for{' '}
          <strong style={{ color: '#111827' }}>{priceLabel}</strong>.
          The parent's name and phone number will be revealed instantly.
        </p>
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', marginBottom: 24, border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Lead preview</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{maskName(lead.maskedName || lead.fullName || 'Parent')}</div>
          {lead.classApplyingFor && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>Class {lead.classApplyingFor}{lead.childName ? ` · ${lead.childName}` : ''}</div>
          )}
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{lead.city || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#F3F4F6', border: 'none', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 2, padding: '11px', borderRadius: 10, background: '#F59E0B', border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={15} />}
            Pay {priceLabel}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Or <Link href="/dashboard/school/packages" style={{ color: '#F59E0B', fontWeight: 600 }}>buy a credit pack</Link> for a lower per-lead cost.
        </p>
      </div>
    </div>
  )
}

// ── Main Leads Table ──────────────────────────────────────────────────────────
function LeadsContent() {
  const queryClient = useQueryClient()
  const [buyingId,    setBuyingId]    = useState<string | null>(null)
  const [confirmLead, setConfirmLead] = useState<any | null>(null) // modal state

  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache: 'no-store', credentials: 'include', headers: authHeaders() }).then(r => r.json()),
  })
  const credits = creditsData?.availableCredits ?? 0

  const { data, isLoading } = useQuery<{ data?: any[]; total?: number; error?: string; message?: string; singleLeadPricePaise?: number }>({
    queryKey: ['school-leads-full'],
    queryFn: () => fetch('/api/leads?limit=50', { cache: 'no-store', credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 30 * 1000,
  })
  const leads = data?.data ?? []
  const singleLeadPricePaise = data?.singleLeadPricePaise ?? 29900
  const priceLabel = formatPrice(singleLeadPricePaise)

  const isProfileIncomplete = data?.error === 'PROFILE_INCOMPLETE'
  const isAccountSuspended  = data?.error === 'ACCOUNT_SUSPENDED'

  const buyMutation = useMutation({
    mutationFn: (leadId: string) => {
      setBuyingId(leadId)
      return fetch(`/api/leads?id=${leadId}&action=purchase`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      }).then(r => r.json())
    },
    onSuccess: (res) => {
      setConfirmLead(null)
      if (res.error === 'NO_CREDITS') {
        // This shouldn't happen here since we open modal first, but safety net
        toast.error('No credits available.')
        setBuyingId(null)
        return
      }
      if (res.error) { toast.error(res.error); setBuyingId(null); return }
      toast.success('Lead unlocked! Contact details revealed.')
      queryClient.invalidateQueries({ queryKey: ['school-leads-full'] })
      queryClient.invalidateQueries({ queryKey: ['lead-credits'] })
      setBuyingId(null)
    },
    onError: () => { toast.error('Failed to unlock lead.'); setBuyingId(null); setConfirmLead(null) },
  })

  const handleUnlockClick = (lead: any) => {
    if (credits >= 1) {
      // Has credits — unlock directly
      buyMutation.mutate(lead.id)
    } else {
      // No credits — show single-lead purchase modal
      setConfirmLead(lead)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ height: 60, borderRadius: 10, background: '#F3F4F6' }} />
      ))}
    </div>
  )

  if (isProfileIncomplete) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 36 }}>🏫</div>
      <h2 style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 26, color: '#111827', marginBottom: 10, letterSpacing: '-0.5px' }}>Complete Your School Profile</h2>
      <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 440, lineHeight: 1.75, marginBottom: 28 }}>
        Please fill in all required details — school name, board, classes, fees, address and contact info — before you can access parent leads.
      </p>
      <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(245,158,11,0.35)', marginBottom: 16 }}>
        📝 Complete Profile Now
      </Link>
    </div>
  )

  if (isAccountSuspended) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: '#FEE2E2', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 36 }}>🚫</div>
      <h2 style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 26, color: '#111827', marginBottom: 10 }}>Account Suspended</h2>
      <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 380, lineHeight: 1.75, marginBottom: 24 }}>
        Your school account has been suspended. Please contact our support team to resolve this.
      </p>
      <a href="mailto:support@thynkschooling.in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: '#EF4444', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
        ✉️ Contact Support
      </a>
    </div>
  )

  return (
    <div>
      {/* Single-lead purchase modal */}
      {confirmLead && (
        <BuyLeadModal
          lead={confirmLead}
          priceLabel={priceLabel}
          loading={buyingId === confirmLead.id}
          onConfirm={() => buyMutation.mutate(confirmLead.id)}
          onCancel={() => { setConfirmLead(null); setBuyingId(null) }}
        />
      )}

      {/* No-credits banner — compact, NO subscription plan cards (they live on /packages) */}
      {credits === 0 && (
        <div style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={20} color="#F59E0B" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3 }}>You have 0 lead credits</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Buy a pack for the lowest per-lead cost, or purchase individual leads at {priceLabel} each.
            </div>
          </div>
          <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#F59E0B', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            View Packages <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Leads table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Parent Leads</span>
            <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>Includes nearby leads within your area</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {credits > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 600, color: '#D97706' }}>
                <Zap size={11} /> {credits} credits
              </span>
            )}
            <span style={{ fontSize: 12, color: '#6B7280' }}>{data?.total ?? 0} total</span>
          </div>
        </div>

        {leads.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 6 }}>No leads yet</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, maxWidth: 320, margin: '0 auto 16px' }}>
              Leads from parents in your area will appear here automatically.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Parent / Child', 'Class', 'Phone', 'City', 'Status', 'Action'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: i === 5 ? 'right' : 'left',
                      fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => {
                  const st = STATUS_COLORS[lead.status] || STATUS_COLORS.new
                  const displayName  = lead.isPurchased ? lead.fullName  : maskName(lead.maskedName || lead.fullName || 'Parent')
                  const displayPhone = lead.isPurchased ? lead.fullPhone : maskPhone(lead.maskedPhone || lead.fullPhone || '')
                  const isUnlocking  = buyingId === lead.id

                  return (
                    <tr key={lead.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      {/* Parent / Child */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#D97706', flexShrink: 0 }}>
                            {(displayName || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{displayName || '—'}</div>
                            {lead.childName && (
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{lead.childName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class — new dedicated column */}
                      <td style={{ padding: '13px 16px' }}>
                        {lead.classApplyingFor ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 11, fontWeight: 600, color: '#4338CA', whiteSpace: 'nowrap' }}>
                            <BookOpen size={10} /> {lead.classApplyingFor}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4B5563', fontFamily: 'monospace', opacity: lead.isPurchased ? 1 : 0.5 }}>
                          <Phone size={11} color="#9CA3AF" />{displayPhone || '—'}
                        </div>
                      </td>

                      {/* City */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
                          <MapPin size={11} color="#F59E0B" />{lead.city || '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color }} />{st.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        {lead.isPurchased ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, background: '#D1FAE5', color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                            <CheckCircle2 size={11} /> Unlocked
                          </span>
                        ) : credits >= 1 ? (
                          // Has credits: show "Unlock (1 credit)" button
                          <button
                            onClick={() => handleUnlockClick(lead)}
                            disabled={isUnlocking}
                            title="Use 1 credit to reveal contact"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#111827', border: 'none', color: '#fff', cursor: isUnlocking ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500 }}
                          >
                            {isUnlocking ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
                            Unlock (1 credit)
                          </button>
                        ) : (
                          // No credits: show "Buy Lead" button at single-lead price
                          <button
                            onClick={() => handleUnlockClick(lead)}
                            disabled={isUnlocking}
                            title={`Purchase this lead for ${priceLabel}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#F59E0B', border: 'none', color: '#fff', cursor: isUnlocking ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}
                          >
                            {isUnlocking ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={12} />}
                            Buy Lead · {priceLabel}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function LeadsPage() {
  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
  })

  return (
    <SchoolLayout title="Leads" credits={creditsData?.availableCredits}>
      <LeadsContent />
    </SchoolLayout>
  )
}
