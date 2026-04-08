'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

// ─── Lazy export helpers ──────────────────────────────────────────────────────
async function exportToExcel(reviews: any[]) {
  const XLSX = await import('xlsx')
  const rows = reviews.map((r: any) => ({
    'Reviewer':   r.reviewerName || r.parent_name || 'Anonymous',
    'Rating':     r.rating || '',
    'Review':     r.content || r.comment || '',
    'Date':       r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reviews')
  ws['!cols'] = [{wch:22},{wch:8},{wch:60},{wch:14}]
  XLSX.writeFile(wb, `reviews-${new Date().toISOString().slice(0,10)}.xlsx`)
}

async function exportToPDF(reviews: any[]) {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('School Reviews', 14, 16)
  doc.setFontSize(9); doc.setTextColor(120)
  doc.text(`Exported ${new Date().toLocaleDateString('en-IN')}`, 14, 22)
  autoTable(doc, {
    startY: 28,
    head: [['Reviewer','Rating','Review','Date']],
    body: reviews.map((r: any) => [
      r.reviewerName || r.parent_name || 'Anonymous',
      `${r.rating || 0}/5`,
      (r.content || r.comment || '').slice(0, 120),
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—',
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [17,17,17], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { cellWidth: 80 } },
    alternateRowStyles: { fillColor: [248,249,250] },
  })
  doc.save(`reviews-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/dashboard/school',              label: 'Overview',     icon: '📊' },
  { href: '/dashboard/school/leads',        label: 'Leads',        icon: '📋' },
  { href: '/dashboard/school/applications', label: 'Applications', icon: '📝' },
  { href: '/dashboard/school/reviews',      label: 'Reviews',      icon: '⭐' },
  { href: '/dashboard/school/analytics',    label: 'Analytics',    icon: '📈' },
]

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={12} fill={s <= rating ? '#E5A50A' : 'none'} color={s <= rating ? '#E5A50A' : '#D1D5DB'} />
      ))}
    </div>
  )
}

// ─── Export button ────────────────────────────────────────────────────────────
function ExportButton({ reviews }: { reviews: any[] }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<'xlsx'|'pdf'|null>(null)

  const handleExport = useCallback(async (type: 'xlsx'|'pdf') => {
    setOpen(false); setLoading(type)
    try {
      if (type === 'xlsx') await exportToExcel(reviews)
      else                 await exportToPDF(reviews)
      toast.success(`Exported as ${type.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setLoading(null) }
  }, [reviews])

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} disabled={!!loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
        {loading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
        Export
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

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F3F4F6' }} />
          <div>
            <div style={{ width: 100, height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 5 }} />
            <div style={{ width: 60, height: 10, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          </div>
        </div>
        <div style={{ width: 80, height: 12, borderRadius: 4, background: '#F3F4F6' }} />
      </div>
      <div style={{ width: '100%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 5 }} />
      <div style={{ width: '80%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function SchoolLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif' }}>
      <aside style={{ width: 220, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
          <Link href="/" style={{ fontSize: 15, fontWeight: 600, color: '#111827', textDecoration: 'none', letterSpacing: '-0.3px', display: 'block' }}>
            Thynk<em style={{ fontStyle: 'normal', color: '#E5A50A' }}>Schooling</em>
          </Link>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>School dashboard</div>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#B8860B' : '#6B7280', background: active ? 'rgba(229,165,10,0.07)' : 'transparent' }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '10px 12px', borderTop: '0.5px solid rgba(0,0,0,0.07)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 12, color: '#9CA3AF' }}>← View site</Link>
        </div>
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(20px,3vw,36px)' }}>
        <h1 style={{ fontWeight: 600, fontSize: '1.4rem', color: '#111827', marginBottom: 22, letterSpacing: '-0.4px' }}>{title}</h1>
        {children}
      </main>
    </div>
  )
}

// ─── Reviews list ─────────────────────────────────────────────────────────────
function ReviewsList() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/admin/reviews', { cache: 'no-store', signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setReviews(d.reviews || d.data || []))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  // Derived stats — computed once from data
  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null
  const totalCount = reviews.length

  return (
    <div>
      {/* Stats row */}
      {!loading && reviews.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)' }}>
            <Stars rating={Math.round(Number(avgRating))} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{avgRating}</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>avg · {totalCount} reviews</span>
          </div>
          <ExportButton reviews={reviews} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : reviews.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⭐</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 5 }}>No reviews yet</div>
            <p style={{ fontSize: 12, color: '#6B7280', maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>Parents will leave reviews about your school here.</p>
          </div>
        ) : reviews.map((r: any, i: number) => {
          const initials = (r.reviewerName || r.parent_name || 'A').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={r.id || i} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', padding: '16px 18px', transition: 'border-color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.14)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F3F4F6', border: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.reviewerName || r.parent_name || 'Anonymous parent'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                  </div>
                </div>
                <Stars rating={r.rating || 0} />
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{r.content || r.comment || 'No content'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <SchoolLayout title="Reviews">
      <ReviewsList />
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </SchoolLayout>
  )
}
