'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiGet, apiPut } from '@/lib/api'
import { motion } from 'framer-motion'
import { Search, Shield, UserX, UserCheck, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminUser {
  id: string
  fullName: string
  phone: string
  email?: string
  role: 'parent' | 'school_admin' | 'super_admin'
  isActive: boolean
  isPhoneVerified: boolean
  schoolName?: string
  createdAt: string
  lastLoginAt?: string
  totalApplications?: number
  totalLeadsBought?: number
}

const ROLE_TABS = ['All', 'Parents', 'Schools', 'Admins', 'Suspended']

const cell: React.CSSProperties   = { padding: '12px 14px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#fff', borderBottom: '1px solid #1E2A52' }
const hdCell: React.CSSProperties = { padding: '10px 14px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8892B0', fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid #1E2A52', whiteSpace: 'nowrap' }

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  parent:       { bg: 'rgba(96,165,250,0.1)',  color: '#60A5FA' },
  school_admin: { bg: 'rgba(255,92,0,0.1)',    color: '#FF7A2E' },
  super_admin:  { bg: 'rgba(167,139,250,0.1)', color: '#A78BFA' },
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab === 'Parents')    params.set('role', 'parent')
  if (tab === 'Schools')    params.set('role', 'school_admin')
  if (tab === 'Admins')     params.set('role', 'super_admin')
  if (tab === 'Suspended')  params.set('isActive', 'false')

  const { data, isLoading } = useQuery<{ data: AdminUser[]; total: number }>({
    queryKey: ['admin-users', tab, search, page],
    queryFn: () => apiGet(`/admin/users?${params.toString()}`),
    staleTime: 2 * 60 * 1000,
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/admin/users/${id}`, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'User reactivated.' : 'User suspended.')
      invalidate()
    },
    onError: () => toast.error('Action failed.'),
  })

  const roleColors = (role: string) => ROLE_COLORS[role] ?? { bg: 'rgba(255,255,255,0.05)', color: '#8892B0' }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

  return (
    <AdminLayout title="Users Manager" subtitle="Manage all parents, school admins and platform users">

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Users',   value: total,                                          color: '#60A5FA' },
          { label: 'Parents',       value: users.filter(u => u.role === 'parent').length,       color: '#4ADE80' },
          { label: 'School Admins', value: users.filter(u => u.role === 'school_admin').length, color: '#FF5C00' },
          { label: 'Suspended',     value: users.filter(u => !u.isActive).length,               color: '#F87171' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
            style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '28px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '14px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #1E2A52' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', borderRadius: '8px', padding: '8px 12px' }}>
            <Search style={{ width: '15px', height: '15px', color: '#8892B0', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, phone, school…"
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {ROLE_TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1) }}
                style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', background: tab === t ? '#FF5C00' : 'rgba(255,255,255,0.04)', color: tab === t ? '#fff' : '#8892B0', whiteSpace: 'nowrap' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={hdCell}>User</th>
                <th style={hdCell}>Phone</th>
                <th style={hdCell}>Role</th>
                <th style={hdCell}>School</th>
                <th style={hdCell}>Activity</th>
                <th style={hdCell}>Joined</th>
                <th style={hdCell}>Status</th>
                <th style={hdCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: '12px 14px' }}>
                      <div style={{ height: '36px', background: '#1E2A52', borderRadius: '8px' }} />
                    </td></tr>
                  ))
                : users.length === 0
                  ? <tr><td colSpan={8} style={{ ...cell, textAlign: 'center', padding: '40px', color: '#8892B0' }}>No users found.</td></tr>
                  : users.map(user => {
                      const rc = roleColors(user.role)
                      return (
                        <tr key={user.id}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>

                          <td style={cell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: rc.bg, border: `1px solid ${rc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: rc.color, flexShrink: 0 }}>
                                {(user.fullName || user.phone)[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{user.fullName || '—'}</div>
                                {user.email && <div style={{ fontSize: '11px', color: '#8892B0' }}>{user.email}</div>}
                              </div>
                            </div>
                          </td>

                          <td style={cell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8892B0' }}>
                              <Phone style={{ width: '11px', height: '11px' }} />
                              {user.phone}
                              {user.isPhoneVerified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />}
                            </div>
                          </td>

                          <td style={cell}>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: rc.bg, color: rc.color, fontFamily: 'DM Sans, sans-serif' }}>
                              {user.role === 'school_admin' ? 'School' : user.role === 'super_admin' ? 'Admin' : 'Parent'}
                            </span>
                          </td>

                          <td style={{ ...cell, color: '#8892B0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.schoolName || '—'}
                          </td>

                          <td style={cell}>
                            {user.role === 'parent' && user.totalApplications !== undefined && (
                              <div style={{ fontSize: '12px', color: '#8892B0' }}>{user.totalApplications} applications</div>
                            )}
                            {user.role === 'school_admin' && user.totalLeadsBought !== undefined && (
                              <div style={{ fontSize: '12px', color: '#8892B0' }}>{user.totalLeadsBought} leads bought</div>
                            )}
                            {user.lastLoginAt && (
                              <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>
                                Last: {formatDate(user.lastLoginAt)}
                              </div>
                            )}
                          </td>

                          <td style={{ ...cell, color: '#8892B0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar style={{ width: '11px', height: '11px' }} />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>

                          <td style={cell}>
                            {user.isActive
                              ? <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '100px', background: 'rgba(74,222,128,0.1)', color: '#4ADE80', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Active</span>
                              : <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '100px', background: 'rgba(239,68,68,0.1)', color: '#F87171', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Suspended</span>
                            }
                          </td>

                          <td style={cell}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {user.role !== 'super_admin' && (
                                <button
                                  onClick={() => {
                                    if (!user.isActive || confirm(`Suspend "${user.fullName || user.phone}"?`)) {
                                      toggleMutation.mutate({ id: user.id, isActive: !user.isActive })
                                    }
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: user.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)', color: user.isActive ? '#F87171' : '#4ADE80' }}>
                                  {user.isActive
                                    ? <><UserX style={{ width: '12px', height: '12px' }} /> Suspend</>
                                    : <><UserCheck style={{ width: '12px', height: '12px' }} /> Restore</>
                                  }
                                </button>
                              )}
                              {user.role === 'parent' && (
                                <button
                                  onClick={() => toast('Role management coming soon.')}
                                  style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #1E2A52', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', background: 'rgba(255,255,255,0.04)', color: '#8892B0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Shield style={{ width: '12px', height: '12px' }} /> Role
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #1E2A52' }}>
            <span style={{ fontSize: '13px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif' }}>
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', color: '#8892B0', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', opacity: page === 1 ? .4 : 1 }}>
                ← Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                style={{ padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', color: '#8892B0', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', opacity: page * 20 >= total ? .4 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
