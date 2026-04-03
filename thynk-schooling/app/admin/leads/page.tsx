'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, TrendingUp, Eye, Download } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = ['All', 'New', 'Purchased', 'Expired']

const cell: React.CSSProperties   = { padding: '11px 14px', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,.05)' }
const hdCell: React.CSSProperties = { padding: '9px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))', background: 'rgba(255,255,255,.05)', whiteSpace: 'nowrap' }

export default function AdminLeadsPage() {
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab !== 'All') params.set('status', tab.toLowerCase())

  const { data, isLoading } = useQuery<{ data: any[]; total: number; totalRevenue: number }>({
    queryKey: ['admin-leads', tab, search, page],
    queryFn: () => fetch(`/api/admin/leads?${params}`,{cache:'no-store'}).then(r=>r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const leads        = data?.data         || []
  const total        = data?.total        || 0
  const totalRevenue = data?.totalRevenue || 0

  return (
    <AdminLayout title="Leads" subtitle="All parent leads generated across all schools">

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Leads',    value: total,                                         color: '#60A5FA' },
          { label: 'New / Unlocked', value: leads.filter(l=>l.status==='new').length,      color: '#FBBF24' },
          { label: 'Purchased',      value: leads.filter(l=>l.isPurchased).length,         color: '#4ADE80' },
          { label: 'Revenue',        value: `₹${(totalRevenue/100).toLocaleString('en-IN')}`, color: '#FF5C00' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
            style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: typeof s.value==='string'?'22px':'30px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: 'var(--admin-bg,#0D1117)', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '8px', padding: '7px 11px' }}>
            <Search style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,.3)', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search parent name, phone, school..."
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
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans,sans-serif' }}>
            <Download style={{ width: '12px', height: '12px' }} /> Export CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Parent','School','Child / Class','Price','Purchased','Status','Date'].map(h => <th key={h} style={hdCell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '10px 14px' }}>
                      <div style={{ height: '32px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', borderRadius: '6px' }} />
                    </td></tr>
                  ))
                : leads.length === 0
                  ? <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.25)' }}>No leads found.</td></tr>
                  : leads.map(l => (
                      <tr key={l.id}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                        <td style={cell}>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{l.isPurchased ? l.parentName : `${(l.parentName||'Parent')[0]}***`}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{l.isPurchased ? l.parentPhone : '***** masked'}</div>
                        </td>
                        <td style={cell}><div style={{ fontWeight: 500 }}>{l.schoolName}</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{l.city}</div></td>
                        <td style={{ ...cell, color: 'rgba(255,255,255,.5)' }}>{l.childName} · Class {l.classApplied}</td>
                        <td style={{ ...cell, color: '#4ADE80', fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>₹{((l.price||0)/100).toLocaleString('en-IN')}</td>
                        <td style={cell}>
                          {l.isPurchased
                            ? <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: 'rgba(74,222,128,.12)', color: '#4ADE80' }}>Purchased</span>
                            : <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)' }}>Not yet</span>
                          }
                        </td>
                        <td style={cell}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', fontFamily: 'DM Sans,sans-serif',
                            background: l.status==='new' ? 'rgba(251,191,36,.12)' : l.status==='expired' ? 'rgba(239,68,68,.1)' : 'rgba(74,222,128,.12)',
                            color:      l.status==='new' ? '#FBBF24'              : l.status==='expired' ? '#F87171'             : '#4ADE80' }}>
                            {l.status || 'new'}
                          </span>
                        </td>
                        <td style={{ ...cell, fontSize: '11px', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', fontFamily: 'DM Sans,sans-serif' }}>{((page-1)*20)+1}–{Math.min(page*20,total)} of {total}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding: '6px 13px', borderRadius: '7px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', opacity: page===1?.4:1 }}>← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*20>=total} style={{ padding: '6px 13px', borderRadius: '7px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '11px', opacity: page*20>=total?.4:1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
