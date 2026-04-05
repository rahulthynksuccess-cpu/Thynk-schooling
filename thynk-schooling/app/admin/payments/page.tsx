'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, Download, IndianRupee } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = ['All', 'Completed', 'Pending', 'Failed', 'Refunded']

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: 'rgba(74,222,128,.12)',  color: '#4ADE80' },
  pending:   { bg: 'rgba(251,191,36,.12)',  color: '#FBBF24' },
  failed:    { bg: 'rgba(239,68,68,.12)',   color: '#F87171' },
  refunded:  { bg: 'rgba(96,165,250,.12)',  color: '#60A5FA' },
}

const cell: React.CSSProperties   = { padding: '11px 14px', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,.05)' }
const hdCell: React.CSSProperties = { padding: '9px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.05)', whiteSpace: 'nowrap' }

export default function AdminPaymentsPage() {
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab !== 'All') params.set('status', tab.toLowerCase())

  const { data, isLoading } = useQuery<{ data: any[]; total: number; totalAmount: number; todayAmount: number }>({
    queryKey: ['admin-payments', tab, search, page],
    queryFn: () => fetch(`/api/admin/payments?${params}`,{cache:'no-store'}).then(r=>r.json()),
    staleTime: 2 * 60 * 1000,
  })

  const payments     = data?.data         || []
  const total        = data?.total        || 0
  const totalAmount  = data?.totalAmount  || 0
  const todayAmount  = data?.todayAmount  || 0

  return (
    <AdminLayout pageClass="admin-page-payments" title="Payments" subtitle="All transactions — lead purchases, subscription plan payments">

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Transactions', value: String(total),                                                  color: '#60A5FA' },
          { label: 'Total Revenue',      value: `₹${(totalAmount/100).toLocaleString('en-IN')}`,               color: '#FF5C00' },
          { label: "Today's Revenue",    value: `₹${(todayAmount/100).toLocaleString('en-IN')}`,               color: '#4ADE80' },
          { label: 'Completed',          value: String(payments.filter(p=>p.status==='completed').length),      color: '#FBBF24' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
            style={{ background: 'var(--admin-payments-card-bg,#111820)', border: '1px solid var(--admin-payments-card-border,rgba(255,255,255,0.07))', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: s.value.startsWith('₹') ? '20px' : '30px', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: 'var(--admin-payments-card-bg,#111820)', border: '1px solid var(--admin-payments-card-border,rgba(255,255,255,0.07))', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: '8px', padding: '7px 11px' }}>
            <Search style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,.3)', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search transaction ID, school, amount..."
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
            <Download style={{ width: '12px', height: '12px' }} /> Export
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Transaction ID','School','Type','Amount','Gateway','Date','Status'].map(h => <th key={h} style={hdCell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '10px 14px' }}>
                      <div style={{ height: '32px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', borderRadius: '6px' }} />
                    </td></tr>
                  ))
                : payments.length === 0
                  ? <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.25)' }}>No payments found.</td></tr>
                  : payments.map(p => {
                      const s = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                      return (
                        <tr key={p.id}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={{ ...cell, fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{p.transactionId || p.id?.slice(0,12)}</td>
                          <td style={cell}><div style={{ fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{p.schoolName || '—'}</div></td>
                          <td style={cell}><span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: 'rgba(255,92,0,.1)', color: '#FF7A2E' }}>{p.type || 'Lead Purchase'}</span></td>
                          <td style={{ ...cell, fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#4ADE80', fontSize: '13px' }}>₹{((p.amount||0)/100).toLocaleString('en-IN')}</td>
                          <td style={{ ...cell, color: 'rgba(255,255,255,.4)' }}>{p.gateway || 'Razorpay'}</td>
                          <td style={{ ...cell, fontSize: '11px', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                          </td>
                          <td style={cell}><span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: s.bg, color: s.color }}>{p.status}</span></td>
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
