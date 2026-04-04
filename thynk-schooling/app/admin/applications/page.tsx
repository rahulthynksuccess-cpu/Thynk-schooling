'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Search, Download, Eye, MessageSquare, XCircle,
  FileText, Clock, ListFilter, GraduationCap, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react'

/* ── Types ── */
type AppStatus = 'pending' | 'shortlisted' | 'contacted' | 'admitted' | 'rejected'

interface Application {
  id: string
  parentName: string
  parentEmail: string
  parentPhone: string
  schoolName: string
  childName: string
  childClass: string
  appliedAt: string
  status: AppStatus
  notes?: string
}

/* ── Status config ── */
const STATUS_CONFIG: Record<AppStatus, { label: string; cls: string; color: string }> = {
  pending:     { label: 'Pending',     cls: 'badge-pending',   color: '#FCD34D' },
  shortlisted: { label: 'Shortlisted', cls: 'badge-complete',  color: '#34D399' },
  contacted:   { label: 'Contacted',   cls: 'badge-school',    color: '#A78BFA' },
  admitted:    { label: 'Admitted',    cls: 'badge-active',    color: '#34D399' },
  rejected:    { label: 'Rejected',    cls: 'badge-suspended', color: '#F87171' },
}

/* ── Stat Card ── */
function StatCard({
  label, value, color, icon: Icon, delay = 0
}: {
  label: string; value: number; color: 'gold'|'blue'|'green'|'red'; icon: React.ElementType; delay?: number
}) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const steps = 30; const inc = value / steps; let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= value) { setDisplayed(value); clearInterval(t) }
      else setDisplayed(Math.floor(cur))
    }, 800 / steps)
    return () => clearInterval(t)
  }, [value])

  return (
    <div className={`admin-stat-card ${color}`} style={{ animationDelay: `${delay}s` }}>
      <div className="stat-label">{label}</div>
      <div className={`stat-number ${color}`}>{displayed.toLocaleString()}</div>
      <div className="stat-sub">All applications</div>
      <div className="stat-bg-icon"><Icon size={24} /></div>
    </div>
  )
}

/* ── Status Badge ── */
function AppStatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

/* ── Main Component ── */
export default function AdminApplicationsPage() {
  const [apps, setApps]         = useState<Application[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState('All')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, admitted: 0 })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const PER_PAGE = 20

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
      if (query) params.set('q', query)
      if (filter !== 'All') params.set('status', filter.toLowerCase())
      const res = await fetch(`/api/admin/applications?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setApps(data.applications || [])
      setStats(data.stats || { total: 0, pending: 0, shortlisted: 0, admitted: 0 })
      setTotalPages(data.totalPages || 1)
    } catch {
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [query, filter, page])

  useEffect(() => { fetchApps() }, [fetchApps])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchApps() }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleExport = async () => {
    const res = await fetch('/api/admin/applications/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'applications.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  const updateStatus = async (id: string, status: AppStatus) => {
    await fetch(`/api/admin/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchApps()
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const FILTERS = ['All', 'Pending', 'Shortlisted', 'Contacted', 'Admitted', 'Rejected']

  return (
    <AdminLayout pageClass="admin-page-apps" title="Applications" subtitle="All parent school applications across the platform">

      {/* Stats */}
      <div className="admin-stat-grid">
        <StatCard label="Total"       value={stats.total}       color="gold"  icon={FileText}    delay={0}    />
        <StatCard label="Pending"     value={stats.pending}     color="blue"  icon={Clock}       delay={0.08} />
        <StatCard label="Shortlisted" value={stats.shortlisted} color="green" icon={ListFilter}  delay={0.16} />
        <StatCard label="Admitted"    value={stats.admitted}    color="green" icon={GraduationCap} delay={0.24} />
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="toolbar-search">
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parent, school, child name…"
          />
          {loading && (
            <RefreshCw size={13} style={{ color: 'var(--a-t3)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          )}
        </div>
        <div className="filter-pills">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill${filter === f ? ' active' : ''}`}
              onClick={() => { setFilter(f); setPage(1) }}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="export-btn" onClick={handleExport}>
          <Download size={13} />
          Export
        </button>
      </div>

      {/* Bulk action */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          background: 'var(--a-gold-dim)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 14,
          animation: 'fadeIn .25s ease',
        }}>
          <span style={{ fontSize: 13, color: 'var(--a-gold)', fontWeight: 600 }}>
            {selected.size} selected
          </span>
          {(['shortlisted', 'contacted', 'admitted', 'rejected'] as AppStatus[]).map((s) => (
            <button
              key={s}
              className={`badge ${STATUS_CONFIG[s].cls}`}
              style={{ cursor: 'pointer', border: 'none' }}
              onClick={async () => {
                await Promise.all([...selected].map((id) => updateStatus(id, s)))
                setSelected(new Set())
                fetchApps()
              }}
            >
              Mark {STATUS_CONFIG[s].label}
            </button>
          ))}
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--a-t3)', cursor: 'pointer', fontSize: 12 }}
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-card">
        <div
          className="table-header-row"
          style={{ gridTemplateColumns: '24px 2fr 1.5fr 1.2fr 1fr 1fr 1fr 100px' }}
        >
          <div className="th" />
          <div className="th">Parent</div>
          <div className="th">School</div>
          <div className="th">Child / Class</div>
          <div className="th">Applied</div>
          <div className="th">Status</div>
          <div className="th">Update</div>
          <div className="th">Actions</div>
        </div>

        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="table-data-row"
                style={{ gridTemplateColumns: '24px 2fr 1.5fr 1.2fr 1fr 1fr 1fr 100px', opacity: 0.5 - i * 0.08 }}
              >
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="td">
                    <div style={{
                      height: 12, borderRadius: 6, width: '65%',
                      background: 'rgba(255,255,255,0.06)',
                    }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon-wrap">
              <FileText size={24} color="rgba(255,255,255,0.3)" />
            </div>
            <div className="empty-title">No applications found</div>
            <div className="empty-sub">
              {query || filter !== 'All'
                ? 'Try adjusting your search or filter'
                : 'Applications will appear here once parents submit them'}
            </div>
          </div>
        ) : (
          apps.map((app, i) => (
            <div
              key={app.id}
              className="table-data-row"
              style={{
                gridTemplateColumns: '24px 2fr 1.5fr 1.2fr 1fr 1fr 1fr 100px',
                animationDelay: `${i * 0.04}s`,
                background: selected.has(app.id) ? 'rgba(245,158,11,0.04)' : undefined,
              }}
            >
              {/* Checkbox */}
              <div className="td">
                <div
                  onClick={() => toggleSelect(app.id)}
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `1px solid ${selected.has(app.id) ? 'var(--a-gold)' : 'var(--a-border2)'}`,
                    background: selected.has(app.id) ? 'var(--a-gold)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}
                >
                  {selected.has(app.id) && <CheckCircle2 size={10} color="#000" />}
                </div>
              </div>

              {/* Parent */}
              <div className="td">
                <div className="user-cell">
                  <div
                    className="user-avatar"
                    style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}
                  >
                    {app.parentName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{app.parentName}</div>
                    <div className="user-email">{app.parentPhone || app.parentEmail}</div>
                  </div>
                </div>
              </div>

              {/* School */}
              <div className="td">
                <span style={{ fontSize: 13, color: 'var(--a-t1)', fontWeight: 500 }}>{app.schoolName}</span>
              </div>

              {/* Child / Class */}
              <div className="td">
                <div>
                  <div style={{ fontSize: 13, color: 'var(--a-t1)', fontWeight: 500 }}>{app.childName}</div>
                  <div style={{ fontSize: 11, color: 'var(--a-t3)', marginTop: 1 }}>Class {app.childClass}</div>
                </div>
              </div>

              {/* Applied */}
              <div className="td" style={{ fontSize: 12 }}>
                {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
              </div>

              {/* Status */}
              <div className="td">
                <AppStatusBadge status={app.status} />
              </div>

              {/* Quick status update */}
              <div className="td">
                <select
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as AppStatus)}
                  style={{
                    background: 'var(--a-card2)',
                    border: '1px solid var(--a-border)',
                    borderRadius: 7,
                    color: 'var(--a-t2)',
                    fontSize: 11,
                    padding: '4px 8px',
                    fontFamily: 'var(--a-sans)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="td">
                <div className="action-btns">
                  <button
                    className="act-btn"
                    title="View application"
                    onClick={() => window.open(`/admin/applications/${app.id}`, '_blank')}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className="act-btn"
                    title="Send message"
                    onClick={() => window.open(`/admin/applications/${app.id}/message`, '_blank')}
                  >
                    <MessageSquare size={13} />
                  </button>
                  <button
                    className="act-btn danger"
                    title="Reject application"
                    onClick={() => updateStatus(app.id, 'rejected')}
                  >
                    <XCircle size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button
            className="act-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--a-t2)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="act-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </AdminLayout>
  )
}
