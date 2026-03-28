'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiGet, apiPut } from '@/lib/api'
import { Search, Eye, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TABS = ['All', 'Pending', 'Shortlisted', 'Admitted', 'Rejected']

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgba(251,191,36,.12)',  color: '#FBBF24', label: 'Pending'     },
  shortlisted: { bg: 'rgba(96,165,250,.12)',  color: '#60A5FA', label: 'Shortlisted' },
  admitted:    { bg: 'rgba(74,222,128,.12)',  color: '#4ADE80', label: 'Admitted'    },
  rejected:    { bg: 'rgba(239,68,68,.12)',   color: '#F87171', label: 'Rejected'    },
}

const cell: React.CSSProperties   = { padding: '11px 14px', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,.05)' }
const hdCell: React.CSSProperties = { padding: '9px 14px', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', whiteSpace: 'nowrap' }

export default function AdminApplicationsPage() {
  const qc = useQueryClient()
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab !== 'All') params.set('status', tab.toLowerCase())

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({
    queryKey: ['admin-applications', tab, search, page],
    queryFn: () => apiGet(`/admin/applications?${params}`),
    staleTime: 2 * 60 * 1000,
  })

  const apps  = data?.data  || []
  const total = data?.total || 0

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut(`/admin/applications/${id}`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Application ${status}`)
      qc.invalidateQueries({ queryKey: ['admin-applications'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const SUMMARY = [
    { label: 'Total',       value: total,                                            color: '#60A5FA' },
    { label: 'Pending',     value: apps.filter(a => a.status==='pending').length,    color: '#FBBF24' },
    { label: 'Shortlisted', value: apps.filter(a => a.status==='shortlisted').length,color: '#60A5FA' },
    { label: 'Admitted',    value: apps.filter(a => a.status==='admitted').length,   color: '#4ADE80' },
  ]

  return (
    <AdminLayout title="Applications" subtitle="All parent school applications across the platform">

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {SUMMARY.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
            style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,.06)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '30px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,.06)', borderRadius: '14px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '8px', padding: '7px 11px' }}>
            <Search style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,.3)', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search parent, school, child name..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#fff', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1) }}
                style={{ padding: '6px 13px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', background: tab===t ? '#FF5C00' : 'rgba(255,255,255,.04)', color: tab===t ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all .15s' }}>
                {t}
              </button>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif' }}>
            <Download style={{ width: '12px', height: '12px' }} /> Export
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Parent','School','Child / Class','Applied','Status','Actions'].map(h => <th key={h} style={hdCell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} style={{ padding: '10px 14px' }}>
                      <div style={{ height: '32px', background: 'rgba(255,255,255,.04)', borderRadius: '6px' }} />
                    </td></tr>
                  ))
                : apps.length === 0
                  ? <tr><td colSpan={6} style={{ ...cell, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.25)' }}>No applications found.</td></tr>
                  : apps.map((a, i) => {
                      const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending
                      return (
                        <tr key={a.id} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={cell}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{a.parentName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{a.parentPhone}</div>
                          </td>
                          <td style={cell}>
                            <div style={{ fontWeight: 500 }}>{a.schoolName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{a.city}</div>
                          </td>
                          <td style={{ ...cell, color: 'rgba(255,255,255,.5)' }}>
                            {a.childName} · Class {a.classApplied}
                          </td>
                          <td style={{ ...cell, color: 'rgba(255,255,255,.4)', fontSize: '11px' }}>
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                          </td>
                          <td style={cell}>
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: s.bg, color: s.color, fontFamily: 'DM Sans,sans-serif' }}>
                              {s.label}
                            </span>
                          </td>
                          <td style={cell}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {a.status === 'pending' && (
                                <>
                                  <button onClick={() => updateMutation.mutate({ id: a.id, status: 'shortlisted' })}
                                    style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', color: '#60A5FA', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                                    Shortlist
                                  </button>
                                  <button onClick={() => updateMutation.mutate({ id: a.id, status: 'rejected' })}
                                    style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#F87171', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {a.status === 'shortlisted' && (
                                <button onClick={() => updateMutation.mutate({ id: a.id, status: 'admitted' })}
                                  style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', color: '#4ADE80', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                                  Admit
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

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif' }}>
              {((page-1)*20)+1}–{Math.min(page*20,total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ padding: '6px 13px', borderRadius: '7px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', opacity: page===1 ? .4 : 1 }}>← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*20>=total}
                style={{ padding: '6px 13px', borderRadius: '7px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', opacity: page*20>=total ? .4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
