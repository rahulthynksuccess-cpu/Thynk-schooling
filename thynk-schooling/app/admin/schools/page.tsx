'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, CheckCircle2, XCircle, Eye, MapPin, Star, Shield, Zap, Building2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AdminSchool {
  id: string; name: string; slug: string; city: string; board: string[]
  isVerified: boolean; isActive: boolean; isFeatured: boolean
  avgRating: number; totalLeads: number; ownerPhone: string; createdAt: string
}

const TABS = ['All', 'Pending', 'Verified', 'Featured', 'Inactive']

export default function AdminSchoolsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab === 'Pending')   params.set('isVerified', 'false')
  if (tab === 'Verified')  params.set('isVerified', 'true')
  if (tab === 'Featured')  params.set('isFeatured', 'true')
  if (tab === 'Inactive')  params.set('isActive', 'false')

  const { data, isLoading, error } = useQuery<{ data: AdminSchool[]; total: number; error?: string }>({
    queryKey: ['admin-schools', tab, search, page],
    queryFn: () => fetch(`/api/admin?action=schools&${params}`, { cache: 'no-store' }).then(r => r.json()),
    staleTime: 0,
    retry: 2,
  })

  const inv = () => queryClient.invalidateQueries({ queryKey: ['admin-schools'] })
  const mut = (body: any, id: string) =>
    fetch(`/api/admin?action=schools&id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())

  const verifyMut   = useMutation({ mutationFn: ({ id, v }: any) => mut({ isVerified: v }, id),   onSuccess: (_, { v }) => { toast.success(v ? '✓ School verified' : 'Verification removed'); inv() }, onError: () => toast.error('Failed') })
  const featureMut  = useMutation({ mutationFn: ({ id, v }: any) => mut({ isFeatured: v }, id),  onSuccess: (_, { v }) => { toast.success(v ? '★ School featured' : 'Removed from featured'); inv() }, onError: () => toast.error('Failed') })
  const activeMut   = useMutation({ mutationFn: ({ id, v }: any) => mut({ isActive: v }, id),    onSuccess: () => { toast.success('Status updated'); inv() }, onError: () => toast.error('Failed') })

  const schools = data?.data ?? [], total = data?.total ?? 0

  const card: React.CSSProperties = { background: 'var(--admin-schools-card-bg,#111820)', border: '1px solid var(--admin-schools-card-border,rgba(255,255,255,0.08))', borderRadius: 14 }

  return (
    <AdminLayout pageClass="admin-page-schools" title="Schools Manager" subtitle="Verify, feature and manage all schools on the platform">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: total, color: '#60A5FA', icon: Building2 },
          { label: 'Pending Review', value: schools.filter(s => !s.isVerified).length, color: '#FBBF24', icon: XCircle },
          { label: 'Verified', value: schools.filter(s => s.isVerified).length, color: '#34D399', icon: CheckCircle2 },
          { label: 'Featured', value: schools.filter(s => s.isFeatured).length, color: '#B8860B', icon: Star },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted,rgba(255,255,255,0.4))', fontFamily: 'DM Sans,sans-serif', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '9px 13px' }}>
            <Search style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search school name, city, phone…"
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--admin-text,rgba(255,255,255,0.9))', fontSize: 13, fontFamily: 'DM Sans,sans-serif', flex: 1, minWidth: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1) }}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 400, fontFamily: 'DM Sans,sans-serif', transition: 'all .15s', whiteSpace: 'nowrap',
                  background: tab === t ? '#B8860B' : 'rgba(255,255,255,0.04)',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['School', 'City / Board', 'Owner', 'Rating', 'Leads', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.06))', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1,2,3,4,5,6,7,8].map(i => <tr key={i}><td colSpan={7} style={{ padding: '10px 16px' }}><div style={{ height: 36, background: 'rgba(255,255,255,0.04)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} /></td></tr>)
                : (data?.error)
                  ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#F87171', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>API Error: {data.error}</td></tr>
                  : schools.length === 0
                  ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No schools found.</td></tr>
                  : schools.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--admin-text,rgba(255,255,255,0.9))' }}>{s.name}</div>
                          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--admin-text-faint,rgba(255,255,255,0.3))', marginTop: 2 }}>/{s.slug}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                            <MapPin style={{ width: 11, height: 11, color: '#B8860B' }} />
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'var(--admin-text-muted,rgba(255,255,255,0.55))' }}>{s.city}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {s.board.slice(0, 2).map(b => (
                              <span key={b} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(184,134,11,0.12)', color: '#B8860B', border: '1px solid rgba(184,134,11,0.2)' }}>{b}</span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'var(--admin-text-muted,rgba(255,255,255,0.5))' }}>{s.ownerPhone}</td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star style={{ width: 12, height: 12, fill: '#FBBF24', color: '#FBBF24' }} />
                            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--admin-text,rgba(255,255,255,0.9))', fontWeight: 600 }}>{s.avgRating.toFixed(1)}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, color: '#34D399' }}>{s.totalLeads}</td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {s.isVerified
                              ? <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)', display: 'inline-flex', alignItems: 'center', gap: 3, width: 'fit-content', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}><CheckCircle2 style={{ width: 10, height: 10 }} /> Verified</span>
                              : <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)', display: 'inline-flex', alignItems: 'center', gap: 3, width: 'fit-content', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}><XCircle style={{ width: 10, height: 10 }} /> Pending</span>
                            }
                            {s.isFeatured && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(184,134,11,0.12)', color: '#B8860B', border: '1px solid rgba(184,134,11,0.25)', width: 'fit-content', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>★ Featured</span>}
                            {!s.isActive && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', width: 'fit-content', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>Inactive</span>}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Link href={`/schools/${s.slug}`} target="_blank"
                              style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif', transition: 'all .15s' }}>
                              <Eye style={{ width: 12, height: 12 }} /> View
                            </Link>
                            <button onClick={() => verifyMut.mutate({ id: s.id, v: !s.isVerified })}
                              style={{ padding: '6px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, transition: 'all .15s', background: s.isVerified ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', color: s.isVerified ? '#F87171' : '#34D399' }}>
                              {s.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button onClick={() => featureMut.mutate({ id: s.id, v: !s.isFeatured })}
                              style={{ padding: '6px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, background: 'rgba(184,134,11,0.12)', color: '#B8860B' }}>
                              {s.isFeatured ? 'Unfeature' : 'Feature ★'}
                            </button>
                            <button onClick={() => activeMut.mutate({ id: s.id, v: !s.isActive })}
                              style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans,sans-serif', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)' }}>
                              {s.isActive ? 'Deactivate' : 'Activate'}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--admin-border,rgba(255,255,255,0.07))' }}>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted,rgba(255,255,255,0.4))', fontFamily: 'DM Sans,sans-serif' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['← Prev', page === 1, () => setPage(p => Math.max(1, p - 1))], ['Next →', page * 20 >= total, () => setPage(p => p + 1)]].map(([label, disabled, fn]: any) => (
                <button key={label as string} onClick={fn} disabled={disabled}
                  style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'DM Sans,sans-serif', opacity: disabled ? .4 : 1 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
