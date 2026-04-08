'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, FileText, Loader2, Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { authHeaders } from '@/utils/authHeaders'

// ─── Lazy export helpers ──────────────────────────────────────────────────────
async function exportToExcel(apps: any[]) {
  const XLSX = await import('xlsx')
  const rows = apps.map((a: any) => ({
    'Parent Name':  a.parent_name || a.parentName || '',
    'Child Name':   a.child_name  || a.childName  || '',
    'Class':        a.class_applying_for || a.classApplyingFor || '',
    'Applied On':   a.created_at  ? new Date(a.created_at).toLocaleDateString('en-IN') : '',
    'Status':       (a.status || '').replace(/_/g, ' '),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Applications')
  ws['!cols'] = [{wch:22},{wch:18},{wch:10},{wch:14},{wch:16}]
  XLSX.writeFile(wb, `applications-${new Date().toISOString().slice(0,10)}.xlsx`)
}

async function exportToPDF(apps: any[]) {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Admission Applications', 14, 16)
  doc.setFontSize(9); doc.setTextColor(120)
  doc.text(`Exported ${new Date().toLocaleDateString('en-IN')}`, 14, 22)
  autoTable(doc, {
    startY: 28,
    head: [['Parent','Child','Class','Applied On','Status']],
    body: apps.map((a: any) => [
      a.parent_name || a.parentName || '—',
      a.child_name  || a.childName  || '—',
      a.class_applying_for || a.classApplyingFor || '—',
      a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—',
      (a.status || '').replace(/_/g,' '),
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [17,17,17], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,249,250] },
  })
  doc.save(`applications-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  submitted:    { bg: 'rgba(37,99,235,0.07)',    color: '#1E40AF' },
  under_review: { bg: 'rgba(245,158,11,0.07)',   color: '#92400E' },
  accepted:     { bg: 'rgba(16,185,129,0.08)',   color: '#0D7A5F' },
  rejected:     { bg: 'rgba(239,68,68,0.07)',    color: '#991B1B' },
  waitlisted:   { bg: 'rgba(139,92,246,0.07)',   color: '#5B21B6' },
}

// ─── Shared sidebar nav ───────────────────────────────────────────────────────
const NAV = [
  { href: '/dashboard/school',              label: 'Overview',     icon: '📊' },
  { href: '/dashboard/school/leads',        label: 'Leads',        icon: '📋' },
  { href: '/dashboard/school/applications', label: 'Applications', icon: '📝' },
  { href: '/dashboard/school/reviews',      label: 'Reviews',      icon: '⭐' },
  { href: '/dashboard/school/packages',     label: 'Subscription', icon: '💳' },
  { href: '/dashboard/school/analytics',    label: 'Analytics',    icon: '📈' },
]

// ─── Export button ────────────────────────────────────────────────────────────
function ExportButton({ apps }: { apps: any[] }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<'xlsx'|'pdf'|null>(null)

  const handleExport = useCallback(async (type: 'xlsx'|'pdf') => {
    setOpen(false); setLoading(type)
    try {
      if (type === 'xlsx') await exportToExcel(apps)
      else                 await exportToPDF(apps)
      toast.success(`Exported as ${type.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setLoading(null) }
  }, [apps])

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[160,120,70,100,90].map((w,i) => (
        <td key={i} style={{ padding: '13px 20px' }}>
          <div style={{ height: 12, width: w, borderRadius: 4, background: 'linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SchoolApplicationsPage() {
  const { accessToken, user } = useAuthStore()
  const router  = useRouter()
  const [apps, setApps]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = '/dashboard/school/applications'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!accessToken || !user) { router.replace('/login'); return }
    // AbortController so stale requests don't overwrite fresh data
    const ctrl = new AbortController()
    fetch('/api/school-portal?action=applications', {
      credentials: 'include', headers: authHeaders(), signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(d => setApps(Array.isArray(d) ? d : d.data || d.applications || []))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [mounted, accessToken])

  if (!mounted) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Thynk<span style={{ color: '#E5A50A' }}>Schooling</span></div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>School portal</div>
            </div>
          </Link>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {NAV.map(item => {
            const active = item.href === pathname
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: active ? 500 : 400, marginBottom: 1, color: active ? '#B8860B' : '#6B7280', background: active ? 'rgba(229,165,10,0.07)' : 'transparent' }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h1 style={{ fontWeight: 600, fontSize: '1.4rem', color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>Applications</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Admission applications</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{apps.length} total</span>
            </div>
            {apps.length > 0 && <ExportButton apps={apps} />}
          </div>

          {loading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>{Array.from({ length: 4 }).map((_,i) => <SkeletonRow key={i} />)}</tbody>
            </table>
          ) : apps.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#F9FAFB', border: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="#D1D5DB" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>No applications yet</div>
              <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 280, lineHeight: 1.6 }}>When parents apply to your school, applications will appear here.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Applicant','Child','Class','Applied on','Status'].map(h => (
                    <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((a: any, i: number) => {
                  const st = STATUS_STYLE[a.status] || STATUS_STYLE.submitted
                  return (
                    <tr key={a.id || i} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.04)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 500, color: '#111827' }}>{a.parent_name || a.parentName || '—'}</td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: '#6B7280' }}>{a.child_name || a.childName || '—'}</td>
                      <td style={{ padding: '13px 18px' }}>
                        {(a.class_applying_for || a.classApplyingFor)
                          ? <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.07)', border: '0.5px solid rgba(99,102,241,0.15)', fontSize: 11, fontWeight: 500, color: '#3730A3' }}>
                              {a.class_applying_for || a.classApplyingFor}
                            </span>
                          : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 12, color: '#9CA3AF' }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, textTransform: 'capitalize', ...st }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                          {(a.status || 'submitted').replace(/_/g, ' ')}
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

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
