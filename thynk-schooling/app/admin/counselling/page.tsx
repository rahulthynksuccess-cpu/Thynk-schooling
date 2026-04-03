'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, Phone, CheckCircle, Clock, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const TABS = ['All', 'Pending', 'Called', 'Completed', 'No Answer']

const cell: React.CSSProperties   = { padding: '11px 14px', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,.05)' }
const hdCell: React.CSSProperties = { padding: '9px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))', background: 'rgba(255,255,255,.05)', whiteSpace: 'nowrap' }

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,.12)', color: '#FBBF24' },
  called:    { bg: 'rgba(96,165,250,.12)', color: '#60A5FA' },
  completed: { bg: 'rgba(74,222,128,.12)', color: '#4ADE80' },
  no_answer: { bg: 'rgba(239,68,68,.12)',  color: '#F87171' },
}

export default function AdminCounsellingPage() {
  const qc = useQueryClient()
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab !== 'All') params.set('status', tab.toLowerCase().replace(' ', '_'))

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({
    queryKey: ['admin-counselling', tab, search, page],
    queryFn: () => fetch(`/api/admin/counselling?${params}`,{cache:'no-store'}).then(r=>r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const sessions = data?.data  || []
  const total    = data?.total || 0

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      fetch(`/api/admin/counselling?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,notes})}).then(r=>r.json()),
    onSuccess: () => { toast.success('Session updated!'); qc.invalidateQueries({ queryKey: ['admin-counselling'] }) },
    onError: () => toast.error('Update failed'),
  })

  return (
    <AdminLayout title="Free Counselling" subtitle="Manage parent callback requests and session status">

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Requests', value: total,                                               color: '#60A5FA' },
          { label: 'Pending Calls',  value: sessions.filter(s=>s.status==='pending').length,     color: '#FBBF24' },
          { label: 'Completed',      value: sessions.filter(s=>s.status==='completed').length,   color: '#4ADE80' },
          { label: 'No Answer',      value: sessions.filter(s=>s.status==='no_answer').length,   color: '#F87171' },
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
              placeholder="Search parent name, phone, city..."
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
                {['Parent','Phone','City','Child Age','Concern','Requested','Status','Actions'].map(h => <th key={h} style={hdCell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: '10px 14px' }}>
                      <div style={{ height: '32px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', borderRadius: '6px' }} />
                    </td></tr>
                  ))
                : sessions.length === 0
                  ? <tr><td colSpan={8} style={{ ...cell, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.25)' }}>No counselling requests.</td></tr>
                  : sessions.map(s => {
                      const st = STATUS_STYLE[s.status] || STATUS_STYLE.pending
                      return (
                        <tr key={s.id}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={cell}><div style={{ fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{s.name}</div></td>
                          <td style={cell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <a href={`tel:${s.phone}`} style={{ color: '#60A5FA', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                <Phone style={{ width: '11px', height: '11px' }} />{s.phone}
                              </a>
                            </div>
                          </td>
                          <td style={{ ...cell, color: 'rgba(255,255,255,.5)' }}>{s.city || '—'}</td>
                          <td style={{ ...cell, color: 'rgba(255,255,255,.5)' }}>{s.childAge ? `${s.childAge} yrs` : '—'}</td>
                          <td style={{ ...cell, maxWidth: '200px' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.concern || '—'}</div>
                          </td>
                          <td style={{ ...cell, fontSize: '11px', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                          </td>
                          <td style={cell}><span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: st.bg, color: st.color }}>{s.status?.replace('_',' ') || 'pending'}</span></td>
                          <td style={cell}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {s.status === 'pending' && (
                                <button onClick={() => updateMutation.mutate({ id: s.id, status: 'called' })}
                                  style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', color: '#60A5FA', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone style={{ width: '10px', height: '10px' }} /> Called
                                </button>
                              )}
                              {s.status === 'called' && (
                                <>
                                  <button onClick={() => updateMutation.mutate({ id: s.id, status: 'completed' })}
                                    style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', color: '#4ADE80', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                                    Done
                                  </button>
                                  <button onClick={() => updateMutation.mutate({ id: s.id, status: 'no_answer' })}
                                    style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#F87171', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                                    No Answer
                                  </button>
                                </>
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
      </div>
    </AdminLayout>
  )
}
