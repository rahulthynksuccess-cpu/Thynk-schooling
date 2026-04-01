'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { School } from '@/types'
import { Search, X, Star, MapPin, BadgeCheck, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const MAX = 4

const ROW_LABELS = [
  { key: 'board',          label: 'Board'           },
  { key: 'schoolType',     label: 'School Type'     },
  { key: 'genderPolicy',   label: 'Gender Policy'   },
  { key: 'medium',         label: 'Medium'          },
  { key: 'monthlyFeeMin',  label: 'Monthly Fee'     },
  { key: 'avgRating',      label: 'Rating'          },
  { key: 'totalReviews',   label: 'Reviews'         },
  { key: 'classRange',     label: 'Classes'         },
  { key: 'hasTransport',   label: 'Transport'       },
  { key: 'hasHostel',      label: 'Hostel'          },
  { key: 'hasSports',      label: 'Sports'          },
  { key: 'hasLibrary',     label: 'Library'         },
  { key: 'isVerified',     label: 'Verified'        },
]

function getValue(school: School, key: string): string {
  const v = (school as Record<string, unknown>)[key]
  if (v === undefined || v === null) return '—'
  if (typeof v === 'boolean') return v ? '✓ Yes' : '✗ No'
  if (Array.isArray(v)) return v.join(', ')
  if (key === 'monthlyFeeMin') return `₹${Number(v).toLocaleString('en-IN')}/mo`
  if (key === 'avgRating') return `${Number(v).toFixed(1)} ★`
  return String(v)
}

export default function ComparePage() {
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState<School[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const { data, isLoading } = useQuery<{ data: School[] }>({
    queryKey: ['compare-search', query],
    queryFn: () => fetch(`/api/schools?query=${query}&limit=8`,{cache:'no-store'}).then(r=>r.json()).then(d=>d.data??[]),
    enabled: query.length > 1,
    staleTime: 30000,
  })
  const results = data?.data ?? []

  const addSchool = (school: School) => {
    if (selected.find(s => s.id === school.id)) return
    if (selected.length >= MAX) return
    setSelected(prev => [...prev, school])
    setQuery('')
    setSearchOpen(false)
  }

  const removeSchool = (id: string) => setSelected(prev => prev.filter(s => s.id !== id))

  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', minHeight: '100vh', paddingTop: '80px' }}>

        {/* Header */}
        <div style={{ background: '#F5F0E8', borderBottom: '1px solid rgba(13,17,23,0.08)', padding: '40px 48px' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Compare Schools
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '52px', color: '#0D1117', marginBottom: '10px', letterSpacing: '-1.5px' }}>
              Compare Up to <em style={{ fontStyle: 'italic', color: '#B8860B' }}>4 Schools</em>
            </h1>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', fontWeight: 300 }}>
              Side-by-side comparison of fees, facilities, ratings and more.
            </p>
          </div>
        </div>

        <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto', padding: '40px 48px' }}>

          {/* School slots */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX}, 1fr)`, gap: '16px', marginBottom: '32px' }}>
            {Array.from({ length: MAX }).map((_, i) => {
              const school = selected[i]
              return school ? (
                <div key={school.id} style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,17,23,0.06)' }}>
                  <div style={{ height: '100px', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
                    🏛
                    <button onClick={() => removeSchool(school.id)}
                      style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: '#0D1117', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X style={{ width: '12px', height: '12px', color: '#fff' }} />
                    </button>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '15px', color: '#0D1117', marginBottom: '4px' }}>{school.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif', marginBottom: '8px' }}>
                      <MapPin style={{ width: '10px', height: '10px' }} />{school.city}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {school.board?.slice(0, 2).map(b => (
                        <span key={b} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', background: '#FEF7E0', color: '#7A5800', border: '1px solid rgba(184,134,11,0.25)', fontFamily: 'DM Sans,sans-serif' }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i}
                  onClick={() => setSearchOpen(true)}
                  style={{ background: selected.length === 0 && i > 0 ? 'rgba(250,247,242,0.5)' : '#fff', border: '2px dashed rgba(13,17,23,0.12)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', cursor: 'pointer', gap: '8px', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#B8860B'; (e.currentTarget as HTMLDivElement).style.background = '#FDFAF0' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(13,17,23,0.12)'; (e.currentTarget as HTMLDivElement).style.background = '#fff' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: '18px', height: '18px', color: '#B8860B' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#B8860B', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>Add School</span>
                </div>
              )
            })}
          </div>

          {/* Search modal */}
          {searchOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '120px', background: 'rgba(13,17,23,0.5)' }}
              onClick={() => setSearchOpen(false)}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(13,17,23,0.2)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(13,17,23,0.12)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <Search style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search school name, city, board..."
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', color: '#0D1117' }} />
                </div>
                {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif', fontSize: '13px' }}>Searching...</div>}
                {results.map(school => (
                  <div key={school.id} onClick={() => addSchool(school)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FDFAF0'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏛</div>
                    <div>
                      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>{school.name}</div>
                      <div style={{ fontSize: '11px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>{school.city} · {school.board?.join(', ')}</div>
                    </div>
                    {selected.find(s => s.id === school.id) && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#B8860B', fontFamily: 'DM Sans,sans-serif' }}>Added</span>}
                  </div>
                ))}
                {query.length > 1 && !isLoading && results.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif', fontSize: '13px' }}>No schools found.</div>
                )}
              </div>
            </div>
          )}

          {/* Add school button when slots available */}
          {selected.length > 0 && selected.length < MAX && (
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button onClick={() => setSearchOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0D1117', color: '#FAF7F2', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer' }}>
                <Plus style={{ width: '15px', height: '15px' }} /> Add Another School
              </button>
            </div>
          )}

          {/* Comparison table */}
          {selected.length >= 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(13,17,23,0.08)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '20px', color: '#0D1117' }}>
                Comparison Table
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F0E8' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#718096', fontFamily: 'DM Sans,sans-serif', width: '160px' }}>Feature</th>
                      {selected.map(s => (
                        <th key={s.id} style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROW_LABELS.map((row, i) => (
                      <tr key={row.key} style={{ background: i % 2 === 0 ? '#fff' : '#FDFAF8' }}>
                        <td style={{ padding: '11px 20px', fontSize: '12px', fontWeight: 500, color: '#4A5568', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid rgba(13,17,23,0.05)' }}>{row.label}</td>
                        {selected.map(s => (
                          <td key={s.id} style={{ padding: '11px 20px', fontSize: '13px', color: '#0D1117', fontFamily: 'DM Sans,sans-serif', borderBottom: '1px solid rgba(13,17,23,0.05)' }}>
                            {getValue(s, row.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {selected.length < 2 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⇌</div>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '24px', color: '#0D1117', marginBottom: '8px' }}>Add at least 2 schools to compare</div>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '14px', color: '#718096', fontWeight: 300 }}>Click the + slots above to search and add schools</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
