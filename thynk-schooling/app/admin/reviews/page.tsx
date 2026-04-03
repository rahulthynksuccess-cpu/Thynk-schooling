'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, Star, CheckCircle, Trash2, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const TABS = ['All', 'Pending', 'Approved', 'Flagged']

const cell: React.CSSProperties   = { padding: '12px 14px', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,.05)' }
const hdCell: React.CSSProperties = { padding: '9px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))', background: 'rgba(255,255,255,.05)', whiteSpace: 'nowrap' }

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} style={{ width: '12px', height: '12px', fill: s<=rating ? '#FBBF24' : 'transparent', color: s<=rating ? '#FBBF24' : 'rgba(255,255,255,.2)' }} />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const qc = useQueryClient()
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab === 'Pending')  params.set('status', 'pending')
  if (tab === 'Approved') params.set('status', 'approved')
  if (tab === 'Flagged')  params.set('status', 'flagged')

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({
    queryKey: ['admin-reviews', tab, search, page],
    queryFn: () => fetch(`/api/admin/reviews?${params}`,{cache:'no-store'}).then(r=>r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const reviews = data?.data  || []
  const total   = data?.total || 0

  const qInvalidate = () => qc.invalidateQueries({ queryKey: ['admin-reviews'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/reviews?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'approved'})}).then(r=>r.json()),
    onSuccess: () => { toast.success('Review approved!'); qInvalidate() },
    onError: () => toast.error('Action failed'),
  })
  const flagMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/reviews?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'flagged'})}).then(r=>r.json()),
    onSuccess: () => { toast.success('Review flagged.'); qInvalidate() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/reviews?id=${id}`,{method:'DELETE'}).then(r=>r.json()),
    onSuccess: () => { toast.success('Review deleted.'); qInvalidate() },
    onError: () => toast.error('Delete failed'),
  })

  return (
    <AdminLayout title="Reviews" subtitle="Moderate parent reviews before they appear on school profiles">

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Reviews', value: total,                                           color: '#60A5FA' },
          { label: 'Pending',       value: reviews.filter(r=>r.status==='pending').length,  color: '#FBBF24' },
          { label: 'Approved',      value: reviews.filter(r=>r.status==='approved').length, color: '#4ADE80' },
          { label: 'Flagged',       value: reviews.filter(r=>r.status==='flagged').length,  color: '#F87171' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
            style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '30px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '8px', padding: '7px 11px' }}>
            <Search style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,.3)', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search school or reviewer..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: 'var(--admin-text,rgba(255,255,255,0.9))', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1) }}
                style={{ padding: '6px 13px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', background: tab===t ? '#FF5C00' : 'rgba(255,255,255,.04)', color: tab===t ? '#fff' : 'rgba(255,255,255,.4)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Reviewer','School','Rating','Review','Date','Status','Actions'].map(h => <th key={h} style={hdCell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '10px 14px' }}>
                      <div style={{ height: '32px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', borderRadius: '6px' }} />
                    </td></tr>
                  ))
                : reviews.length === 0
                  ? <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.25)' }}>No reviews found.</td></tr>
                  : reviews.map(r => (
                      <tr key={r.id}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                        <td style={cell}>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{r.reviewerName || 'Anonymous'}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{r.reviewerRole || 'Parent'}</div>
                        </td>
                        <td style={cell}>
                          <div style={{ fontWeight: 500 }}>{r.schoolName || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{r.city}</div>
                        </td>
                        <td style={cell}><StarRating rating={r.rating || 0} /></td>
                        <td style={{ ...cell, maxWidth: '260px' }}>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                            {r.review || '—'}
                          </div>
                        </td>
                        <td style={{ ...cell, color: 'rgba(255,255,255,.35)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                        </td>
                        <td style={cell}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', fontFamily: 'DM Sans,sans-serif',
                            background: r.status==='approved' ? 'rgba(74,222,128,.12)' : r.status==='flagged' ? 'rgba(239,68,68,.12)' : 'rgba(251,191,36,.12)',
                            color:      r.status==='approved' ? '#4ADE80'              : r.status==='flagged' ? '#F87171'              : '#FBBF24' }}>
                            {r.status || 'pending'}
                          </span>
                        </td>
                        <td style={cell}>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {r.status !== 'approved' && (
                              <button onClick={() => approveMutation.mutate(r.id)}
                                style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', color: '#4ADE80', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle style={{ width: '11px', height: '11px' }} /> Approve
                              </button>
                            )}
                            {r.status !== 'flagged' && (
                              <button onClick={() => flagMutation.mutate(r.id)}
                                style={{ padding: '5px 9px', borderRadius: '6px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.15)', color: '#FBBF24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Flag style={{ width: '11px', height: '11px' }} />
                              </button>
                            )}
                            <button onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(r.id) }}
                              style={{ padding: '5px 9px', borderRadius: '6px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Trash2 style={{ width: '11px', height: '11px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
