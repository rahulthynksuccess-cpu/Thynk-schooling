'use client'
export const dynamic = 'force-dynamic'
import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Phone, MapPin, CheckCircle2, ShoppingCart, LayoutGrid,
  Zap, ChevronRight, Loader2, BookOpen, Globe,
  Download, FileSpreadsheet, FileText,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authHeaders } from '@/utils/authHeaders'

// ─── Performance: lazy-load heavy libs only on export click ──────────────────
async function exportToExcel(leads: any[], priceLabel: string) {
  const XLSX = await import('xlsx')
  const rows = leads.map((l: any) => ({
    'Parent Name':    l.isPurchased ? (l.fullName  || '') : (l.maskedName  || ''),
    'Child Name':     l.childName   || '',
    'Class':          l.classApplyingFor || '',
    'Phone':          l.isPurchased ? (l.fullPhone || '') : (l.maskedPhone || ''),
    'City':           l.city        || '',
    'Source':         l.discoverySource || '',
    'Status':         l.status      || '',
    'Unlocked':       l.isPurchased ? 'Yes' : 'No',
  }))
  const ws  = XLSX.utils.json_to_sheet(rows)
  const wb  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  // Column widths
  ws['!cols'] = [
    {wch:22},{wch:16},{wch:10},{wch:16},{wch:14},{wch:12},{wch:14},{wch:10},
  ]
  XLSX.writeFile(wb, `leads-${new Date().toISOString().slice(0,10)}.xlsx`)
}

async function exportToPDF(leads: any[]) {
  const { jsPDF }   = await import('jspdf')
  const autoTable   = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Parent Leads Report', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Exported ${new Date().toLocaleDateString('en-IN')}`, 14, 22)
  autoTable(doc, {
    startY: 28,
    head: [['Parent','Child','Class','Phone','City','Source','Status','Unlocked']],
    body: leads.map((l: any) => [
      l.isPurchased ? (l.fullName  || '—') : (l.maskedName  || '—'),
      l.childName || '—',
      l.classApplyingFor || '—',
      l.isPurchased ? (l.fullPhone || '—') : (l.maskedPhone || '—'),
      l.city || '—',
      l.discoverySource || '—',
      l.status || '—',
      l.isPurchased ? 'Yes' : 'No',
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  })
  doc.save(`leads-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/dashboard/school',              label: 'Overview',     icon: '📊' },
  { href: '/dashboard/school/leads',        label: 'Leads',        icon: '📋' },
  { href: '/dashboard/school/applications', label: 'Applications', icon: '📝' },
  { href: '/dashboard/school/reviews',      label: 'Reviews',      icon: '⭐' },
  { href: '/dashboard/school/analytics',    label: 'Analytics',    icon: '📈' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  new:            { bg: 'rgba(16,185,129,0.08)',  color: '#0D7A5F', label: 'New' },
  contacted:      { bg: 'rgba(37,99,235,0.07)',   color: '#1E40AF', label: 'Contacted' },
  interested:     { bg: 'rgba(245,158,11,0.07)',  color: '#92400E', label: 'Interested' },
  not_interested: { bg: '#F3F4F6',                color: '#6B7280', label: 'Not Interested' },
  admitted:       { bg: 'rgba(99,102,241,0.08)',  color: '#3730A3', label: 'Admitted' },
  lost:           { bg: 'rgba(239,68,68,0.07)',   color: '#991B1B', label: 'Lost' },
}

const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  direct:  { label: 'Applied',  bg: 'rgba(16,185,129,0.08)', color: '#0D7A5F', icon: '✓' },
  pincode: { label: 'Pincode',  bg: 'rgba(99,102,241,0.07)', color: '#3730A3', icon: '📍' },
  geo:     { label: 'Nearby',   bg: 'rgba(37,99,235,0.07)',  color: '#1E40AF', icon: '📡' },
  search:  { label: 'Searched', bg: 'rgba(245,158,11,0.07)', color: '#92400E', icon: '🔍' },
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
function formatPrice(paise: number | undefined) {
  if (!paise) return '...'
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  layout:    { display: 'flex', minHeight: '100vh', background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif' } as React.CSSProperties,
  aside:     { width: 220, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' as const, flexShrink: 0, position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const },
  logoWrap:  { padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' },
  logo:      { fontSize: 15, fontWeight: 600, color: '#111827', letterSpacing: '-0.3px' } as React.CSSProperties,
  logoEm:    { fontStyle: 'normal' as const, color: '#E5A50A' },
  logoSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: 400 } as React.CSSProperties,
  nav:       { flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column' as const, gap: 1 },
}

// ─── Layout ───────────────────────────────────────────────────────────────────
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

// ─── Export button with dropdown ──────────────────────────────────────────────
function ExportButton({ leads }: { leads: any[] }) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState<'xlsx'|'pdf'|null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const handleExport = useCallback(async (type: 'xlsx' | 'pdf') => {
    setOpen(false)
    setLoading(type)
    try {
      if (type === 'xlsx') await exportToExcel(leads, '')
      else                 await exportToPDF(leads)
      toast.success(`Exported as ${type.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }, [leads])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!!loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 500, color: '#374151', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
      >
        {loading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
        Export
        <ChevronRight size={10} style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <button onClick={() => handleExport('xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <FileSpreadsheet size={13} color="#10B981" /> Excel (.xlsx)
          </button>
          <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.07)' }} />
          <button onClick={() => handleExport('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <FileText size={13} color="#EF4444" /> PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Buy lead modal ───────────────────────────────────────────────────────────
function BuyLeadModal({ lead, priceLabel, onConfirm, onCancel, loading }: {
  lead: any; priceLabel: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', maxWidth: 400, width: '100%', border: '0.5px solid rgba(0,0,0,0.1)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(229,165,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <ShoppingCart size={20} color="#E5A50A" />
        </div>
        <h2 style={{ fontWeight: 600, fontSize: 18, color: '#111827', marginBottom: 6 }}>Purchase this lead</h2>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, marginBottom: 18 }}>
          You have no credits. Purchase this lead individually for{' '}
          <strong style={{ color: '#111827' }}>{priceLabel}</strong>.
          Contact details revealed instantly.
        </p>
        <div style={{ background: '#F9FAFB', borderRadius: 9, padding: '12px 14px', marginBottom: 20, border: '0.5px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Lead preview</div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>{maskName(lead.maskedName || lead.fullName || 'Parent')}</div>
          {lead.classApplyingFor && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Class {lead.classApplyingFor}{lead.childName ? ` · ${lead.childName}` : ''}</div>}
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{lead.city || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#F3F4F6', border: 'none', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 2, padding: '9px', borderRadius: 8, background: '#111827', border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' }}>
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={13} />}
            Pay {priceLabel}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Or <Link href="/dashboard/school/packages" style={{ color: '#E5A50A', fontWeight: 500 }}>buy a credit pack</Link> for lower per-lead cost.
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton loader (faster perceived load) ──────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[200, 80, 100, 80, 70, 70, 90].map((w, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div style={{ height: 13, width: w, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────
function LeadsContent() {
  const queryClient = useQueryClient()
  const [buyingId,    setBuyingId]    = useState<string | null>(null)
  const [confirmLead, setConfirmLead] = useState<any | null>(null)

  // ── Credits query — separate, very fast, cached 60s ──
  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 60_000,       // don't refetch every render
    gcTime:    5 * 60_000,   // keep in cache 5 min
  })
  const credits = creditsData?.availableCredits ?? 0

  // ── Leads query — staleTime 30s, background refetch ──
  const { data, isLoading } = useQuery<{
    data?: any[]; total?: number; error?: string; message?: string;
    singleLeadPricePaise?: number; discoveryWindowDays?: number;
  }>({
    queryKey: ['school-leads-full'],
    queryFn: () => fetch('/api/leads?limit=50', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime:          30_000,
    gcTime:             5 * 60_000,
    refetchOnWindowFocus: false,   // ← stops refetch every tab switch
    placeholderData:    (prev) => prev,  // keep old data while refetching
  })

  const leads = data?.data ?? []
  const singleLeadPricePaise = data?.singleLeadPricePaise
  const discoveryWindowDays  = data?.discoveryWindowDays
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
      if (res.error === 'NO_CREDITS') { toast.error('No credits.'); setBuyingId(null); return }
      if (res.error) { toast.error(res.error); setBuyingId(null); return }
      toast.success('Lead unlocked!')
      // Optimistic invalidation — only the rows that changed
      queryClient.invalidateQueries({ queryKey: ['school-leads-full'] })
      queryClient.invalidateQueries({ queryKey: ['lead-credits'] })
      setBuyingId(null)
    },
    onError: () => { toast.error('Failed to unlock lead.'); setBuyingId(null); setConfirmLead(null) },
  })

  const handleUnlock = useCallback((lead: any) => {
    if (credits >= 1) buyMutation.mutate(lead.id)
    else              setConfirmLead(lead)
  }, [credits, buyMutation])

  // ── Profile incomplete ──
  if (isProfileIncomplete) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🏫</div>
      <h2 style={{ fontWeight: 600, fontSize: 22, color: '#111827', marginBottom: 8 }}>Complete your school profile</h2>
      <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 400, lineHeight: 1.75, marginBottom: 24 }}>
        Fill in all required details — school name, board, classes, fees, address and contact — before accessing parent leads.
      </p>
      <Link href="/school/complete-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 9, background: '#111827', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
        Complete profile →
      </Link>
    </div>
  )

  // ── Suspended ──
  if (isAccountSuspended) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
      <h2 style={{ fontWeight: 600, fontSize: 22, color: '#111827', marginBottom: 8 }}>Account suspended</h2>
      <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 360, lineHeight: 1.75, marginBottom: 20 }}>
        Your account has been suspended. Contact support to resolve.
      </p>
      <a href="mailto:support@thynkschooling.in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 9, background: '#EF4444', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
        Contact support
      </a>
    </div>
  )

  return (
    <div>
      {confirmLead && (
        <BuyLeadModal
          lead={confirmLead}
          priceLabel={priceLabel}
          loading={buyingId === confirmLead.id}
          onConfirm={() => buyMutation.mutate(confirmLead.id)}
          onCancel={() => { setConfirmLead(null); setBuyingId(null) }}
        />
      )}

      {/* No-credits banner */}
      {credits === 0 && !isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 8, border: '0.5px solid rgba(229,165,10,0.3)', background: 'rgba(229,165,10,0.04)', marginBottom: 14, flexWrap: 'wrap' }}>
          <Zap size={14} color="#E5A50A" />
          <span style={{ flex: 1, minWidth: 180, fontSize: 13, color: '#6B7280' }}>
            You have 0 credits. Buy a pack or purchase individual leads at <strong style={{ color: '#111827' }}>{priceLabel}</strong>.
          </span>
          <Link href="/dashboard/school/packages" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#E5A50A', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            View packages <ChevronRight size={11} />
          </Link>
        </div>
      )}

      {/* Discovery info bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', marginBottom: 14, flexWrap: 'wrap' }}>
        <Globe size={12} color="#9CA3AF" />
        <span style={{ fontSize: 12, color: '#6B7280' }}>
          Showing leads from the last <strong style={{ color: '#111827', fontWeight: 500 }}>{discoveryWindowDays !== undefined ? `${discoveryWindowDays} days` : '…'}</strong>
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginLeft: 4 }}>
          {Object.entries(SOURCE_BADGE).map(([key, b]) => (
            <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: b.bg, color: b.color }}>
              {b.icon} {b.label}
            </span>
          ))}
        </span>
      </div>

      {/* Leads table card */}
      <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Parent leads</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{data?.total ?? 0} total</span>
            {credits > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(229,165,10,0.08)', border: '0.5px solid rgba(229,165,10,0.2)', fontSize: 11, fontWeight: 600, color: '#92400E' }}>
                <Zap size={10} /> {credits} credits
              </span>
            )}
          </div>
          {/* Export button — only shown when there's data */}
          {leads.length > 0 && <ExportButton leads={leads} />}
        </div>

        {isLoading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 5 }}>No leads yet</div>
            <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              Leads from parents in your area will appear here automatically.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Parent / child', 'Class', 'Phone', 'City', 'Source', 'Status', 'Action'].map((h, i) => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: i === 6 ? 'right' : 'left',
                      fontSize: 10, fontWeight: 600, color: '#9CA3AF',
                      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                      borderBottom: '0.5px solid rgba(0,0,0,0.07)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => {
                  const st           = STATUS_COLORS[lead.status] || STATUS_COLORS.new
                  const srcBadge     = SOURCE_BADGE[lead.discoverySource] || SOURCE_BADGE.direct
                  const displayName  = lead.isPurchased ? lead.fullName  : maskName(lead.maskedName || lead.fullName || 'Parent')
                  const displayPhone = lead.isPurchased ? lead.fullPhone : maskPhone(lead.maskedPhone || lead.fullPhone || '')
                  const isUnlocking  = buyingId === lead.id
                  const rowPrice     = formatPrice(lead.singleLeadPricePaise ?? singleLeadPricePaise)

                  return (
                    <tr key={lead.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F3F4F6', border: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, color: '#6B7280', flexShrink: 0 }}>
                            {(displayName || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13, color: '#111827' }}>{displayName || '—'}</div>
                            {lead.childName && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{lead.childName}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        {lead.classApplyingFor
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.07)', border: '0.5px solid rgba(99,102,241,0.15)', fontSize: 11, fontWeight: 500, color: '#3730A3', whiteSpace: 'nowrap' }}>
                              <BookOpen size={9} /> {lead.classApplyingFor}
                            </span>
                          : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                        }
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: lead.isPurchased ? '#374151' : '#9CA3AF', fontFamily: 'ui-monospace,monospace' }}>
                          <Phone size={10} color="#D1D5DB" />{displayPhone || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                          <MapPin size={10} color="#E5A50A" />{lead.city || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: srcBadge.bg, color: srcBadge.color, whiteSpace: 'nowrap' }}>
                          {srcBadge.icon} {srcBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: st.bg, color: st.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, flexShrink: 0 }} />{st.label}
                        </span>
                      </td>

                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        {lead.isPurchased ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 5, background: 'rgba(16,185,129,0.08)', border: '0.5px solid rgba(16,185,129,0.2)', color: '#0D7A5F', fontSize: 11, fontWeight: 500 }}>
                            <CheckCircle2 size={10} /> Unlocked
                          </span>
                        ) : credits >= 1 ? (
                          <button onClick={() => handleUnlock(lead)} disabled={isUnlocking}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, background: '#111827', border: 'none', color: '#fff', cursor: isUnlocking ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'inherit' }}>
                            {isUnlocking ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={10} />}
                            Unlock (1 credit)
                          </button>
                        ) : (
                          <button onClick={() => handleUnlock(lead)} disabled={isUnlocking}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, background: '#E5A50A', border: 'none', color: '#fff', cursor: isUnlocking ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                            {isUnlocking ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={10} />}
                            Buy · {rowPrice}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}

export default function LeadsPage() {
  const { data: creditsData } = useQuery<any>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { credentials: 'include', headers: authHeaders() }).then(r => r.json()),
    staleTime: 60_000,
  })
  return (
    <SchoolLayout title="Leads" credits={creditsData?.availableCredits}>
      <LeadsContent />
    </SchoolLayout>
  )
}
