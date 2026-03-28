'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiGet, apiPut } from '@/lib/api'
import { motion } from 'framer-motion'
import { Search, CheckCircle, XCircle, Eye, MapPin, Star, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AdminSchool {
  id: string
  name: string
  slug: string
  city: string
  board: string[]
  isVerified: boolean
  isActive: boolean
  isFeatured: boolean
  avgRating: number
  totalLeads: number
  ownerPhone: string
  createdAt: string
}

const TABS = ['All', 'Pending Verification', 'Verified', 'Featured', 'Inactive']

const cell: React.CSSProperties = { padding: '12px 14px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#fff', borderBottom: '1px solid #1E2A52' }
const hdCell: React.CSSProperties = { padding: '10px 14px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8892B0', fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid #1E2A52', whiteSpace: 'nowrap' }

export default function AdminSchoolsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab === 'Pending Verification') params.set('isVerified', 'false')
  if (tab === 'Verified')             params.set('isVerified', 'true')
  if (tab === 'Featured')             params.set('isFeatured', 'true')
  if (tab === 'Inactive')             params.set('isActive', 'false')

  const { data, isLoading } = useQuery<{ data: AdminSchool[]; total: number }>({
    queryKey: ['admin-schools', tab, search, page],
    queryFn: () => apiGet(`/admin/schools?${params.toString()}`),
    staleTime: 2 * 60 * 1000,
  })

  const schools = data?.data ?? []
  const total   = data?.total ?? 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-schools'] })

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      apiPut(`/admin/schools/${id}`, { isVerified }),
    onSuccess: (_, { isVerified }) => { toast.success(isVerified ? 'School verified!' : 'Verification removed.'); invalidate() },
    onError: () => toast.error('Action failed.'),
  })

  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      apiPut(`/admin/schools/${id}`, { isFeatured }),
    onSuccess: (_, { isFeatured }) => { toast.success(isFeatured ? 'School featured!' : 'Removed from featured.'); invalidate() },
    onError: () => toast.error('Action failed.'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/admin/schools/${id}`, { isActive }),
    onSuccess: () => { toast.success('Status updated.'); invalidate() },
  })

  return (
    <AdminLayout title="Schools Manager" subtitle="Verify, feature and manage all schools on the platform">

      {/* Summary stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Schools',  value: total,  color: '#60A5FA' },
          { label: 'Pending Review', value: schools.filter(s => !s.isVerified).length, color: '#FBBF24' },
          { label: 'Verified',       value: schools.filter(s => s.isVerified).length,  color: '#4ADE80' },
          { label: 'Featured',       value: schools.filter(s => s.isFeatured).length,  color: '#FF5C00' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
            style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '28px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#8892B0', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#111830', border: '1px solid #1E2A52', borderRadius: '14px', marginBottom: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #1E2A52' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', borderRadius: '8px', padding: '8px 12px' }}>
            <Search style={{ width: '15px', height: '15px', color: '#8892B0', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search school name, city, phone…"
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', flex: 1 }} />
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {TABS.map(t => (
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
                <th style={hdCell}>School</th>
                <th style={hdCell}>City / Board</th>
                <th style={hdCell}>Owner</th>
                <th style={hdCell}>Rating</th>
                <th style={hdCell}>Leads</th>
                <th style={hdCell}>Status</th>
                <th style={hdCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '12px 14px' }}>
                      <div style={{ height: '36px', background: '#1E2A52', borderRadius: '8px' }} />
                    </td></tr>
                  ))
                : schools.length === 0
                  ? <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', padding: '40px', color: '#8892B0' }}>No schools found.</td></tr>
                  : schools.map(school => (
                      <tr key={school.id} style={{ transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>

                        <td style={cell}>
                          <div style={{ fontWeight: 500, color: '#fff' }}>{school.name}</div>
                          <div style={{ fontSize: '11px', color: '#8892B0', marginTop: '2px' }}>/{school.slug}</div>
                        </td>

                        <td style={cell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                            <MapPin style={{ width: '11px', height: '11px', color: '#8892B0' }} />
                            <span style={{ color: '#8892B0' }}>{school.city}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {school.board.slice(0, 2).map(b => (
                              <span key={b} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(255,92,0,0.1)', color: '#FF7A2E', border: '1px solid rgba(255,92,0,0.2)' }}>{b}</span>
                            ))}
                          </div>
                        </td>

                        <td style={{ ...cell, color: '#8892B0' }}>{school.ownerPhone}</td>

                        <td style={cell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star style={{ width: '12px', height: '12px', fill: '#FBBF24', color: '#FBBF24' }} />
                            <span>{school.avgRating.toFixed(1)}</span>
                          </div>
                        </td>

                        <td style={{ ...cell, color: '#4ADE80', fontWeight: 600 }}>{school.totalLeads}</td>

                        <td style={cell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {school.isVerified && (
                              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                                <CheckCircle style={{ width: '10px', height: '10px' }} /> Verified
                              </span>
                            )}
                            {!school.isVerified && (
                              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                                <XCircle style={{ width: '10px', height: '10px' }} /> Pending
                              </span>
                            )}
                            {school.isFeatured && (
                              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(255,92,0,0.1)', color: '#FF7A2E', border: '1px solid rgba(255,92,0,0.2)', width: 'fit-content' }}>★ Featured</span>
                            )}
                            {!school.isActive && (
                              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)', width: 'fit-content' }}>Inactive</span>
                            )}
                          </div>
                        </td>

                        <td style={cell}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Link href={`/schools/${school.slug}`} target="_blank"
                              style={{ padding: '6px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A52', color: '#8892B0', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Eye style={{ width: '12px', height: '12px' }} /> View
                            </Link>
                            <button
                              onClick={() => verifyMutation.mutate({ id: school.id, isVerified: !school.isVerified })}
                              style={{ padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: school.isVerified ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)', color: school.isVerified ? '#F87171' : '#4ADE80' }}>
                              {school.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => featureMutation.mutate({ id: school.id, isFeatured: !school.isFeatured })}
                              style={{ padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: school.isFeatured ? 'rgba(255,92,0,0.08)' : 'rgba(255,92,0,0.15)', color: '#FF7A2E' }}>
                              {school.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button
                              onClick={() => toggleActiveMutation.mutate({ id: school.id, isActive: !school.isActive })}
                              style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #1E2A52', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', background: 'rgba(255,255,255,0.04)', color: '#8892B0' }}>
                              {school.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
