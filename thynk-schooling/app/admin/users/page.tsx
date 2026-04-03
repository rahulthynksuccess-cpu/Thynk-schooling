'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Search, Download, Eye, Ban, Trash2,
  Users, UserCheck, Building2, AlertTriangle,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'

/* ── Types ── */
type Role   = 'parent' | 'school_admin' | 'super_admin'
type Status = 'active' | 'pending' | 'suspended'

interface AdminUser {
  id: string
  fullName: string
  email: string
  phone: string
  role: Role
  school?: string
  profileDone: boolean
  ipAddress?: string
  lastLogin?: string
  joinedAt: string
  status: Status
}

const AVATAR_COLORS: Record<Role, string> = {
  parent:      'linear-gradient(135deg,#1D4ED8,#3B82F6)',
  school_admin:'linear-gradient(135deg,#6D28D9,#8B5CF6)',
  super_admin: 'linear-gradient(135deg,#B45309,#F59E0B)',
}

const ROLE_LABELS: Record<Role, string> = {
  parent:      'Parent',
  school_admin:'School Admin',
  super_admin: 'Super Admin',
}

/* ── Stat Card ── */
function StatCard({
  label, value, color, icon: Icon, delay = 0,
}: {
  label: string; value: number; color: 'gold'|'blue'|'green'|'red'; icon: React.ElementType; delay?: number
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (value === 0) return
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= value) { setDisplayed(value); clearInterval(interval) }
      else setDisplayed(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(interval)
  }, [value])

  return (
    <div className={`admin-stat-card ${color}`} style={{ animationDelay: `${delay}s` }}>
      <div className="stat-label">{label}</div>
      <div className={`stat-number ${color}`}>{displayed.toLocaleString()}</div>
      <div className="stat-sub">Platform-wide</div>
      <div className="stat-bg-icon">
        <Icon size={24} />
      </div>
    </div>
  )
}

/* ── Filter Pills ── */
function FilterPills({
  active, onChange,
}: {
  active: string; onChange: (v: string) => void
}) {
  const pills = ['All', 'Parents', 'Schools', 'Admins', 'Suspended']
  return (
    <div className="filter-pills">
      {pills.map((p) => (
        <button
          key={p}
          className={`filter-pill${active === p ? ' active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

/* ── Role Badge ── */
function RoleBadge({ role }: { role: Role }) {
  const cls = role === 'parent' ? 'badge-parent'
    : role === 'school_admin'  ? 'badge-school'
    : 'badge-super'
  return <span className={`badge ${cls}`}>{ROLE_LABELS[role]}</span>
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: Status }) {
  const cls = status === 'active' ? 'badge-active'
    : status === 'pending'       ? 'badge-pending'
    : 'badge-suspended'
  return (
    <span className={`badge ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/* ── Profile Badge ── */
function ProfileBadge({ done }: { done: boolean }) {
  return (
    <span className={`badge ${done ? 'badge-complete' : 'badge-incomplete'}`}>
      {done ? 'Complete' : 'Incomplete'}
    </span>
  )
}

/* ── Main Component ── */
export default function AdminUsersPage() {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState('All')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, parents: 0, schools: 0, suspended: 0 })

  const PER_PAGE = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
      if (query) params.set('q', query)
      if (filter !== 'All') {
        const roleMap: Record<string, string> = {
          Parents: 'parent', Schools: 'school_admin', Admins: 'super_admin', Suspended: 'suspended'
        }
        if (roleMap[filter]) params.set(filter === 'Suspended' ? 'status' : 'role', roleMap[filter])
      }
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || { total: 0, parents: 0, schools: 0, suspended: 0 })
      setTotalPages(data.totalPages || 1)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [query, filter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers() }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleExport = async () => {
    const res = await fetch('/api/admin/users/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'users.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user?')) return
    await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' })
    fetchUsers()
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <AdminLayout title="Users Manager" subtitle="All parents, school admins — view activity, IP logs and manage access">

      {/* Stat Cards */}
      <div className="admin-stat-grid">
        <StatCard label="Total Users"   value={stats.total}     color="gold"  icon={Users}         delay={0}    />
        <StatCard label="Parents"       value={stats.parents}   color="blue"  icon={UserCheck}     delay={0.08} />
        <StatCard label="School Admins" value={stats.schools}   color="green" icon={Building2}     delay={0.16} />
        <StatCard label="Suspended"     value={stats.suspended} color="red"   icon={AlertTriangle} delay={0.24} />
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="toolbar-search">
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, school…"
          />
          {loading && (
            <RefreshCw size={13} style={{ color: 'var(--a-t3)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          )}
        </div>
        <FilterPills active={filter} onChange={(v) => { setFilter(v); setPage(1) }} />
        <button className="export-btn" onClick={handleExport}>
          <Download size={13} />
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {/* Head */}
        <div
          className="table-header-row"
          style={{ gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1.5fr 1fr 1fr 1fr' }}
        >
          <div className="th">User</div>
          <div className="th">Role</div>
          <div className="th">School</div>
          <div className="th">Profile</div>
          <div className="th">IP Address</div>
          <div className="th">Last Login</div>
          <div className="th">Status</div>
          <div className="th">Actions</div>
        </div>

        {/* Body */}
        {loading ? (
          /* Skeleton rows */
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="table-data-row"
                style={{ gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1.5fr 1fr 1fr 1fr', opacity: 0.5 - i * 0.08 }}
              >
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="td">
                    <div style={{
                      height: 14, borderRadius: 6,
                      background: 'linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.04) 50%,rgba(255,255,255,0.06) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                      width: j === 0 ? '80%' : '60%',
                    }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon-wrap">
              <Users size={24} color="rgba(255,255,255,0.3)" />
            </div>
            <div className="empty-title">No users found</div>
            <div className="empty-sub">
              {query || filter !== 'All'
                ? 'Try adjusting your search or filter'
                : 'Users will appear here once they register on the platform'}
            </div>
          </div>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              className="table-data-row"
              style={{
                gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1.5fr 1fr 1fr 1fr',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {/* User */}
              <div className="td">
                <div className="user-cell">
                  <div
                    className="user-avatar"
                    style={{ background: AVATAR_COLORS[u.role] }}
                  >
                    {(u.fullName || u.email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{u.fullName || '—'}</div>
                    <div className="user-email">{u.email || u.phone}</div>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="td"><RoleBadge role={u.role} /></div>

              {/* School */}
              <div className="td" style={{ fontSize: 12, color: 'var(--a-t2)' }}>
                {u.school || <span style={{ color: 'var(--a-t4)' }}>—</span>}
              </div>

              {/* Profile */}
              <div className="td"><ProfileBadge done={u.profileDone} /></div>

              {/* IP */}
              <div className="td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {u.ipAddress || <span style={{ color: 'var(--a-t4)' }}>—</span>}
              </div>

              {/* Last Login */}
              <div className="td" style={{ fontSize: 12 }}>
                {u.lastLogin
                  ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                  : <span style={{ color: 'var(--a-t4)' }}>Never</span>}
              </div>

              {/* Status */}
              <div className="td"><StatusBadge status={u.status} /></div>

              {/* Actions */}
              <div className="td">
                <div className="action-btns">
                  <button
                    className="act-btn"
                    title="View profile"
                    onClick={() => window.open(`/admin/users/${u.id}`, '_blank')}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className="act-btn"
                    title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    onClick={() => handleSuspend(u.id)}
                  >
                    <Ban size={13} />
                  </button>
                  <button
                    className="act-btn danger"
                    title="Delete user"
                    onClick={() => handleDelete(u.id)}
                  >
                    <Trash2 size={13} />
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
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </AdminLayout>
  )
}
