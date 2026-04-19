'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, LayoutGrid, CreditCard, Users, Clock,
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Receipt, Tag, BookOpen, MapPin, Phone,
  History, ChevronRight, RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { authHeaders } from '@/utils/authHeaders'

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/dashboard/school',              label: 'Overview',     icon: '📊' },
  { href: '/dashboard/school/leads',        label: 'Leads',        icon: '📋' },
  { href: '/dashboard/school/applications', label: 'Applications', icon: '📝' },
  { href: '/dashboard/school/reviews',      label: 'Reviews',      icon: '⭐' },
  { href: '/dashboard/school/analytics',    label: 'Analytics',    icon: '📈' },
  { href: '/dashboard/school/history',      label: 'History',      icon: '🗂️' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(paise: number) {
  if (!paise && paise !== 0) return '—'
  if (paise === 0) return 'Free'
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function truncate(s: string, n = 22) {
  return s && s.length > n ? s.slice(0, n) + '…' : s || '—'
}

// ─── Shared layout ────────────────────────────────────────────────────────────
const S = {
  layout:   { display: 'flex', minHeight: '100vh', background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif' } as React.CSSProperties,
  aside:    { width: 220, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' as const, flexShrink: 0, position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const },
  logoWrap: { padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' },
  logo:     { fontSize: 15, fontWeight: 600, color: '#111827', letterSpacing: '-0.3px' } as React.CSSProperties,
  logoEm:   { fontStyle: 'normal' as const, color: '#E5A50A' },
  logoSub:  { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: 400 } as React.CSSProperties,
  nav:      { flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column' as const, gap: 1 },
}

function SchoolLayout({ children, title, credits }: { children: React.ReactNode; title: string; credits?: number }) {
  const pathname = usePathname()
  return (
    <div style={S.layout}>
      <aside style={S.aside}>
        <div style={S.logoWrap}>
          <Link href="/" style={{ ...S.logo, textDecoration: 'none', display: 'block' }}>
            Thynk<em style={S.logoEm}>Schooling</em>
          </Link>
          <div style={S.logoSub}>School dashboard</div>
        </div>
        <nav style={S.nav}>
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                borderRadius: 6, textDecoration: 'none', fontSize: 13,
                fontWeight: active ? 500 : 400,
                background: active ? 'rgba(229,165,10,0.07)' : 'transparent',
                color: active ? '#B8860B' : '#6B7280',
                transition: 'background 0.1s,color 0.1s',
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </nav>
        {credits !== undefined && (
          <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} color="#E5A50A" />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Credits</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginLeft: 2 }}>{credits}</span>
          </div>
        )}
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(20px,3vw,36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', color: '#111827', letterSpacing: '-0.5px', margin: 0 }}>{title}</h1>
          <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, background: '#111827', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}>
            <LayoutGrid size={12} /> Buy credits
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

// ─── Status badge for payments ────────────────────────────────────────────────
const PAYMENT_STATUS: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  completed: { bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', icon: <CheckCircle2 size={10} />, label: 'Completed' },
  success:   { bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', icon: <CheckCircle2 size={10} />, label: 'Success'   },
  paid:      { bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', icon: <CheckCircle2 size={10} />, label: 'Paid'      },
  pending:   { bg: 'rgba(245,158,11,0.08)',  color: '#92400E', icon: <Clock size={10} />,        label: 'Pending'   },
  failed:    { bg: 'rgba(239,68,68,0.07)',   color: '#991B1B', icon: <XCircle size={10} />,      label: 'Failed'    },
  refunded:  { bg: 'rgba(99,102,241,0.08)',  color: '#3730A3', icon: <RefreshCw size={10} />,    label: 'Refunded'  },
}

const GATEWAY_LABELS: Record<string, string> = {
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
  easebuzz: 'EaseBuzz',
  paypal:   'PayPal',
  demo:     'Demo',
  free:     'Free',
}

// ─── Source badge for leads ───────────────────────────────────────────────────
const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  direct:       { label: 'Applied',      bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', icon: '✓'  },
  pincode:      { label: 'Pincode',      bg: 'rgba(99,102,241,0.07)',  color: '#3730A3', icon: '📍' },
  geo:          { label: 'Nearby',       bg: 'rgba(37,99,235,0.07)',   color: '#1E40AF', icon: '📡' },
  search:       { label: 'Searched',     bg: 'rgba(245,158,11,0.07)',  color: '#92400E', icon: '🔍' },
  credits:      { label: 'Via Credits',  bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', icon: '⚡' },
  subscription: { label: 'Subscription', bg: 'rgba(99,102,241,0.07)',  color: '#3730A3', icon: '🎫' },
  single:       { label: 'Single Buy',   bg: 'rgba(229,165,10,0.08)',  color: '#92400E', icon: '🛒' },
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number[] }) {
  return (
    <tr>
      {cols.map((w, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div style={{ height: 13, width: w, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Subscriptions tab ────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['school-history-subscriptions'],
    queryFn: () => fetch('/api/school-history?tab=subscriptions', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const payments: any[] = data?.payments ?? []
  const activeSub       = data?.activeSub

  const statusStyle = (s: string) => PAYMENT_STATUS[s?.toLowerCase()] || {
    bg: '#F3F4F6', color: '#6B7280', icon: <AlertCircle size={10} />, label: s || '—',
  }

  return (
    <div>
      {/* Active subscription banner */}
      {!isLoading && activeSub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 10, border: '0.5px solid rgba(229,165,10,0.3)', background: 'rgba(229,165,10,0.04)', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(229,165,10,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="#E5A50A" />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
              Active: {activeSub.planName}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {activeSub.leadCount > 0 ? `${activeSub.leadCount} lead credits · ` : ''}
              {activeSub.activatedAt ? `Activated ${fmtDate(activeSub.activatedAt)}` : ''}
              {activeSub.expiresAt ? ` · Expires ${fmtDate(activeSub.expiresAt)}` : ''}
            </div>
          </div>
          <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#E5A50A', color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}>
            Upgrade <ChevronRight size={10} />
          </Link>
        </div>
      )}

      {/* Payments table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={14} color="#6B7280" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Payment History</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{payments.length} transaction{payments.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={[140, 90, 80, 100, 160, 80, 70]} />)}</tbody>
            </table>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 6 }}>No subscription history yet</div>
            <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 300, margin: '0 auto', lineHeight: 1.6, marginBottom: 18 }}>
              Your subscription purchases will appear here after you buy a plan.
            </div>
            <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#111827', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
              <LayoutGrid size={12} /> Browse plans
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Plan', 'Amount', 'Credits', 'Gateway', 'Transaction ID', 'Date', 'Status'].map((h, i) => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontSize: 10, fontWeight: 600, color: '#9CA3AF',
                      letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                      whiteSpace: 'nowrap', borderBottom: '0.5px solid rgba(0,0,0,0.07)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => {
                  const st = statusStyle(p.status)
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Plan */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(229,165,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={13} color="#E5A50A" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13, color: '#111827' }}>{p.planName || p.planKey}</div>
                            {p.couponCode && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.08)', color: '#0D7A5F', fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                                <Tag size={8} /> {p.couponCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{fmt(p.amountPaise)}</div>
                        {p.discountPaise > 0 && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>{fmt(p.originalAmountPaise)}</div>
                        )}
                      </td>

                      {/* Credits */}
                      <td style={{ padding: '11px 14px' }}>
                        {p.leadCredits > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(229,165,10,0.08)', border: '0.5px solid rgba(229,165,10,0.2)', fontSize: 11, fontWeight: 600, color: '#92400E' }}>
                            <Zap size={9} /> {p.leadCredits} leads
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                        )}
                      </td>

                      {/* Gateway */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                          {GATEWAY_LABELS[p.gateway] || p.gateway || '—'}
                        </span>
                      </td>

                      {/* Transaction ID */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: '#374151' }} title={p.transactionId || p.orderId || ''}>
                          {p.transactionId
                            ? truncate(p.transactionId, 20)
                            : p.orderId
                              ? truncate(p.orderId, 20)
                              : <span style={{ color: '#D1D5DB' }}>—</span>
                          }
                        </div>
                        {p.transactionId && p.orderId && p.transactionId !== p.orderId && (
                          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: '#9CA3AF', marginTop: 1 }} title={p.orderId}>
                            Order: {truncate(p.orderId, 16)}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontSize: 12, color: '#374151' }}>{fmtDate(p.createdAt)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Leads tab ────────────────────────────────────────────────────────────────
function LeadsTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['school-history-leads'],
    queryFn: () => fetch('/api/school-history?tab=leads', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const leads: any[] = data?.leads ?? []

  const srcBadge = (src: string) =>
    SOURCE_BADGE[src?.toLowerCase()] || SOURCE_BADGE.credits

  return (
    <div>
      {/* Summary bar */}
      {!isLoading && leads.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Total Purchased',
              value: leads.length,
              icon: <Users size={13} color="#E5A50A" />,
              bg: 'rgba(229,165,10,0.06)',
              border: 'rgba(229,165,10,0.2)',
            },
            {
              label: 'Via Credits',
              value: leads.filter((l: any) => !l.purchaseSource || l.purchaseSource === 'credits' || l.purchaseSource === 'subscription').length,
              icon: <Zap size={13} color="#0D7A5F" />,
              bg: 'rgba(16,185,129,0.06)',
              border: 'rgba(16,185,129,0.2)',
            },
            {
              label: 'Single Purchases',
              value: leads.filter((l: any) => l.purchaseSource === 'single').length,
              icon: <CreditCard size={13} color="#3730A3" />,
              bg: 'rgba(99,102,241,0.06)',
              border: 'rgba(99,102,241,0.15)',
            },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: stat.bg, border: `0.5px solid ${stat.border}`, flex: '0 0 auto' }}>
              {stat.icon}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leads table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={14} color="#6B7280" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Purchased Leads</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{leads.length} total</span>
        </div>

        {isLoading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={[180, 120, 80, 110, 80, 100, 110]} />)}</tbody>
            </table>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 6 }}>No purchased leads yet</div>
            <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 320, margin: '0 auto', lineHeight: 1.6, marginBottom: 18 }}>
              All leads you unlock — whether from a subscription pack or a single purchase — will appear here.
            </div>
            <Link href="/dashboard/school/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#111827', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
              View available leads →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Student / Parent', 'Grade', 'Phone', 'City', 'Source', 'Purchase Type', 'Purchased On'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontSize: 10, fontWeight: 600, color: '#9CA3AF',
                      letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                      whiteSpace: 'nowrap', borderBottom: '0.5px solid rgba(0,0,0,0.07)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => {
                  const src = srcBadge(lead.discoverySource)
                  const purchaseType = lead.purchaseSource === 'single'
                    ? SOURCE_BADGE.single
                    : lead.purchaseSource === 'subscription'
                      ? SOURCE_BADGE.subscription
                      : SOURCE_BADGE.credits

                  return (
                    <tr key={lead.id}
                      style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Student / Parent */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F3F4F6', border: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, color: '#6B7280', flexShrink: 0 }}>
                            {(lead.childName !== '—' ? lead.childName : lead.parentName || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13, color: '#111827' }}>
                              {lead.childName !== '—' ? lead.childName : lead.parentName}
                            </div>
                            {lead.childName !== '—' && (
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                                Parent: {lead.parentName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '11px 14px' }}>
                        {lead.grade !== '—' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.07)', border: '0.5px solid rgba(99,102,241,0.15)', fontSize: 11, fontWeight: 500, color: '#3730A3', whiteSpace: 'nowrap' }}>
                            <BookOpen size={9} /> {lead.grade}
                          </span>
                        ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151', fontFamily: 'ui-monospace,monospace' }}>
                          <Phone size={10} color="#D1D5DB" /> {lead.phone}
                        </div>
                      </td>

                      {/* City */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                          <MapPin size={10} color="#E5A50A" /> {lead.city}
                        </div>
                      </td>

                      {/* Source (how the lead was discovered) */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: src.bg, color: src.color, whiteSpace: 'nowrap' }}>
                          {src.icon} {src.label}
                        </span>
                      </td>

                      {/* Purchase Type */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: purchaseType.bg, color: purchaseType.color, whiteSpace: 'nowrap' }}>
                          {purchaseType.icon} {purchaseType.label}
                        </span>
                      </td>

                      {/* Purchased On */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontSize: 12, color: '#374151' }}>{fmtDate(lead.purchasedAt)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
                          {lead.purchasedAt ? new Date(lead.purchasedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
function HistoryContent() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'leads'>('subscriptions')

  const tabs: { id: 'subscriptions' | 'leads'; label: string; icon: React.ReactNode }[] = [
    { id: 'subscriptions', label: 'Subscriptions',  icon: <CreditCard size={13} /> },
    { id: 'leads',         label: 'Lead Purchases', icon: <Users size={13} />      },
  ]

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: '4px', background: '#fff', borderRadius: 9, border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: 20, width: 'fit-content' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 6, border: 'none',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: isActive ? '#111827' : 'transparent',
                color: isActive ? '#fff' : '#6B7280',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'subscriptions' ? <SubscriptionsTab /> : <LeadsTab />}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}

export default function HistoryPage() {
  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 60_000,
  })
  return (
    <SchoolLayout title="Subscription & Lead History" credits={creditsData?.availableCredits}>
      <HistoryContent />
    </SchoolLayout>
  )
}
