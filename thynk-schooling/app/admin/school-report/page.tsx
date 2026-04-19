'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { ChevronDown, ChevronUp, Download, Search, X, Check } from 'lucide-react'

// ─── CSS var-aware tokens (respect Theme Controller) ────────────────────────
const T = {
  card:   'var(--admin-report-card-bg,   #0C1422)',
  border: 'var(--admin-report-card-border, rgba(255,255,255,0.08))',
  t1:     'var(--admin-report-heading-color, rgba(255,255,255,0.95))',
  t2:     'var(--admin-text-muted,  rgba(255,255,255,0.65))',
  t3:     'var(--admin-text-faint,  rgba(255,255,255,0.35))',
  bg:     'var(--admin-bg,          #04080F)',
  accent: 'var(--admin-accent,      #F5A623)',
  blue:   '#4F8EF7', green: '#00E5A0', gold: '#F5A623',
  purple: '#9B72FF', red:   '#FF5757', orange: '#FF7A2E', teal: '#2DD4BF',
  ff:     "'Plus Jakarta Sans', sans-serif",
}

const CARD: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
}

const BAR_COLORS = [T.blue, T.teal, T.green, T.gold, T.purple, T.orange, T.red]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n.toLocaleString('en-IN')
const fmtR = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`
const fmtD = (d: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
  : '—'

function StatusBadge({ s }: { s: string }) {
  const MAP: Record<string, [string, string]> = {
    new:         ['rgba(79,142,247,.15)',  '#4F8EF7'],
    purchased:   ['rgba(0,229,160,.12)',   '#00E5A0'],
    pending:     ['rgba(245,166,35,.12)',  '#F5A623'],
    shortlisted: ['rgba(45,212,191,.12)',  '#2DD4BF'],
    admitted:    ['rgba(0,229,160,.12)',   '#00E5A0'],
    rejected:    ['rgba(255,87,87,.12)',   '#FF5757'],
    completed:   ['rgba(0,229,160,.12)',   '#00E5A0'],
    approved:    ['rgba(0,229,160,.12)',   '#00E5A0'],
    failed:      ['rgba(255,87,87,.12)',   '#FF5757'],
    active:      ['rgba(0,229,160,.12)',   '#00E5A0'],
    expired:     ['rgba(255,87,87,.12)',   '#FF5757'],
  }
  const [bg, color] = MAP[s?.toLowerCase()] ?? ['rgba(255,255,255,.07)', T.t2]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: bg, color, fontFamily: T.ff, whiteSpace: 'nowrap',
    }}>{s || '—'}</span>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? T.gold : T.border, fontSize: 13 }}>★</span>
      ))}
    </span>
  )
}

// ─── Multi-select checkbox dropdown ──────────────────────────────────────────
function MultiSelect({
  label, options, selected, onChange, placeholder, disabled,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggleAll = () => {
    if (selected.length === options.length) onChange([])
    else onChange(options.map(o => o.value))
  }
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }

  const displayLabel = selected.length === 0 || selected.length === options.length
    ? (placeholder || `All ${label.toLowerCase()}`)
    : selected.length === 1
      ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{
        fontSize: 10, color: T.t2, fontFamily: T.ff,
        textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5,
      }}>{label}</div>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 6, padding: '7px 11px', background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? T.blue : T.border}`, borderRadius: 8,
          color: T.t1, fontFamily: T.ff, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1, outline: 'none', transition: 'border-color .15s',
        }}>
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selected.length > 0 && selected.length < options.length ? T.t1 : T.t2,
        }}>
          {displayLabel}
        </span>
        {open ? <ChevronUp size={13} style={{ flexShrink: 0, color: T.t2 }} />
               : <ChevronDown size={13} style={{ flexShrink: 0, color: T.t2 }} />}
      </button>

      {/* selected pills */}
      {selected.length > 0 && selected.length < options.length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
          {selected.map(v => (
            <span key={v} style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 99,
              background: `${T.blue}20`, color: T.blue, fontFamily: T.ff,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {options.find(o => o.value === v)?.label ?? v}
              <X size={9} style={{ cursor: 'pointer' }} onClick={() => toggle(v)} />
            </span>
          ))}
        </div>
      )}

      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#0C1422', border: `1px solid ${T.border}`, borderRadius: 10,
          minWidth: '100%', maxWidth: 280, maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Select all row */}
          <div
            onClick={toggleAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 12px', cursor: 'pointer',
              borderBottom: `1px solid ${T.border}`,
              background: 'rgba(255,255,255,0.03)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{
              width: 15, height: 15, borderRadius: 4, flexShrink: 0,
              background: selected.length === options.length ? T.blue : 'transparent',
              border: `1.5px solid ${selected.length === options.length ? T.blue : T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected.length === options.length && <Check size={9} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, fontFamily: T.ff }}>
              Select all
            </span>
          </div>

          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 12px', cursor: 'pointer',
                  borderBottom: `1px solid rgba(255,255,255,0.03)`,
                  background: checked ? 'rgba(79,142,247,0.07)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(79,142,247,0.07)' : 'transparent'}
              >
                <div style={{
                  width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                  background: checked ? T.blue : 'transparent',
                  border: `1.5px solid ${checked ? T.blue : T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <Check size={9} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 12, color: checked ? T.t1 : T.t2, fontFamily: T.ff }}>
                  {opt.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div style={{ ...CARD, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${color},${color}00)`,
      }} />
      <div style={{
        fontSize: 10, color: T.t2, fontFamily: T.ff,
        textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 7,
      }}>{label}</div>
      <div style={{
        fontSize: 28, fontWeight: 800, color: T.t1,
        fontFamily: T.ff, lineHeight: 1, letterSpacing: '-0.5px',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: T.t3, fontFamily: T.ff, marginTop: 5 }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Horizontal mini bars ─────────────────────────────────────────────────────
function HBars({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.slice(0, 10).map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 96, fontSize: 11, color: T.t2, fontFamily: T.ff,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{d.label}</div>
          <div style={{
            flex: 1, height: 5, background: 'rgba(255,255,255,0.06)',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${Math.max(3, (d.count / max) * 100)}%`,
              background: color, borderRadius: 3, transition: 'width .4s',
            }} />
          </div>
          <div style={{
            fontSize: 11, color: T.t2, fontFamily: T.ff,
            minWidth: 36, textAlign: 'right',
          }}>{fmt(d.count)}</div>
        </div>
      ))}
      {data.length === 0 && (
        <div style={{ fontSize: 12, color: T.t3, fontFamily: T.ff, padding: '8px 0' }}>
          No data
        </div>
      )}
    </div>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  num, title, color, children, defaultOpen = true,
}: {
  num: string; title: string; color: string;
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ ...CARD, overflow: 'visible', marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? `1px solid ${T.border}` : 'none',
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: 7,
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color, fontFamily: T.ff, flexShrink: 0,
        }}>{num}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, fontFamily: T.ff }}>
          {title}
        </span>
        <span style={{ marginLeft: 'auto', color: T.t3 }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && <div style={{ padding: '18px 18px 20px' }}>{children}</div>}
    </div>
  )
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [
    keys.join(','),
    ...rows.map(r =>
      keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
}

// ─── CSV Button ───────────────────────────────────────────────────────────────
function CsvBtn({ rows, filename }: { rows: any[]; filename: string }) {
  return (
    <button
      onClick={() => exportCSV(rows, filename)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
        borderRadius: 7, background: 'rgba(255,255,255,.05)',
        border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
        fontFamily: T.ff, cursor: 'pointer',
      }}
    >
      <Download size={11} /> CSV
    </button>
  )
}

// ─── Drill-down table with search + pagination ────────────────────────────────
function DrillTable({ cols, rows, emptyMsg }: {
  cols: {
    key: string; label: string; width?: string
    render?: (v: any, row: any) => React.ReactNode
  }[]
  rows: any[]
  emptyMsg?: string
}) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const PER = 20

  const filtered = rows.filter(r =>
    !search || cols.some(c =>
      String(r[c.key] ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )
  const total = filtered.length
  const paged = filtered.slice((page - 1) * PER, page * PER)
  const pages = Math.ceil(total / PER) || 1

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 7, fontSize: 11, fontFamily: T.ff,
    background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`,
    color: T.t2, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  })

  return (
    <div>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '5px 10px',
        }}>
          <Search size={12} style={{ color: T.t3, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Filter rows…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, fontFamily: T.ff, color: T.t1, width: '100%',
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: T.t3, fontFamily: T.ff, whiteSpace: 'nowrap' }}>
          {fmt(total)} row{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {cols.map(c => (
                <th key={c.key} style={{
                  padding: '9px 13px', textAlign: 'left', fontSize: 10,
                  fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: T.t2, fontFamily: T.ff,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                  width: c.width,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{
                  padding: '36px 13px', textAlign: 'center',
                  fontSize: 13, color: T.t3, fontFamily: T.ff,
                }}>
                  {emptyMsg || 'No data'}
                </td>
              </tr>
            ) : paged.map((row, ri) => (
              <tr
                key={row.id || ri}
                style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {cols.map(c => (
                  <td key={c.key} style={{
                    padding: '9px 13px', fontSize: 12,
                    color: T.t2, fontFamily: T.ff, whiteSpace: 'nowrap',
                  }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 6, marginTop: 8,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={btnStyle(page === 1)}
          >← Prev</button>
          <span style={{ fontSize: 11, color: T.t3, fontFamily: T.ff }}>
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={btnStyle(page === pages)}
          >Next →</button>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = '80%', h = 13 }: { w?: string; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'rgba(255,255,255,0.05)',
      animation: 'srSkel 1.4s ease-in-out infinite',
    }} />
  )
}

function KpiSkelRow({ n }: { n: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${n}, minmax(160px, 1fr))`,
      gap: 10, marginBottom: 16,
    }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ ...CARD, padding: '16px 18px' }}>
          <Skel w="55%" h={10} />
          <div style={{ marginTop: 10 }}><Skel w="65%" h={26} /></div>
        </div>
      ))}
    </div>
  )
}

// ─── Sub-heading row ──────────────────────────────────────────────────────────
function SubHead({ title, rows, filename }: { title: string; rows: any[]; filename: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 700, color: T.t1, fontFamily: T.ff,
      marginBottom: 8,
    }}>
      {title}
      <CsvBtn rows={rows} filename={filename} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchoolReportPage() {
  // filters — arrays for multi-select
  const [selStates,  setSelStates]  = useState<string[]>([])
  const [selCities,  setSelCities]  = useState<string[]>([])
  const [selSchools, setSelSchools] = useState<string[]>([])
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const [runKey, setRunKey] = useState(0)

  // fetch ALL filter options up front (no cascading restriction — show all)
  const { data: filterData } = useQuery({
    queryKey: ['sr-filters'],
    queryFn: () => fetch('/api/admin/school-report?action=filters').then(r => r.json()),
    staleTime: 5 * 60_000,
  })

  const allStates:  string[]                          = filterData?.states  ?? []
  const allCities:  string[]                          = filterData?.cities  ?? []
  const allSchools: { id: string; name: string; city: string; state: string }[] =
    filterData?.schools ?? []

  // When states change → reset cities/schools that no longer match
  useEffect(() => {
    if (selStates.length === 0) return
    const validCities  = allCities.filter(c =>
      allSchools.some(s => s.city === c && selStates.includes(s.state))
    )
    setSelCities(prev => prev.filter(c => validCities.includes(c)))
  }, [selStates])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selCities.length === 0 && selStates.length === 0) return
    const validSchools = allSchools.filter(s =>
      (selStates.length  === 0 || selStates.includes(s.state)) &&
      (selCities.length  === 0 || selCities.includes(s.city))
    )
    setSelSchools(prev => prev.filter(id => validSchools.some(s => s.id === id)))
  }, [selCities, selStates])  // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered option lists (cities & schools narrow when states/cities are selected)
  const cityOptions = allCities
    .filter(c => selStates.length === 0 || allSchools.some(s => s.city === c && selStates.includes(s.state)))
    .map(c => ({ value: c, label: c }))

  const schoolOptions = allSchools
    .filter(s =>
      (selStates.length === 0 || selStates.includes(s.state)) &&
      (selCities.length === 0 || selCities.includes(s.city))
    )
    .map(s => ({
      value: s.id,
      label: s.name + (s.city ? ` — ${s.city}` : ''),
    }))

  // Build report query string
  const reportUrl = `/api/admin/school-report?action=report` +
    `&states=${encodeURIComponent(selStates.join(','))}` +
    `&cities=${encodeURIComponent(selCities.join(','))}` +
    `&schoolIds=${encodeURIComponent(selSchools.join(','))}` +
    `&from=${from}&to=${to}`

  const { data: report, isLoading, isFetching } = useQuery({
    queryKey: ['sr-report', runKey],
    queryFn: () => runKey === 0
      ? Promise.resolve(null)
      : fetch(reportUrl).then(r => r.json()),
    staleTime: 0,
    enabled: runKey > 0,
  })

  const loading = isLoading || isFetching
  const leads   = report?.leads
  const apps    = report?.applications
  const reviews = report?.reviews
  const revenue = report?.revenue
  const subscriptions = report?.subscriptions

  // Active filter pill labels
  const activePills = [
    selStates.length > 0  && selStates.length < allStates.length
      && `${selStates.length} state${selStates.length > 1 ? 's' : ''}`,
    selCities.length > 0  && selCities.length < allCities.length
      && `${selCities.length} cit${selCities.length > 1 ? 'ies' : 'y'}`,
    selSchools.length > 0 && selSchools.length < allSchools.length
      && `${selSchools.length} school${selSchools.length > 1 ? 's' : ''}`,
    from && `From: ${from}`,
    to   && `To: ${to}`,
  ].filter(Boolean) as string[]

  return (
    <AdminLayout
      pageClass="admin-page-report"
      title="School Report"
      subtitle="Drill-down analytics by school, city & state"
    >
      <style>{`
        @keyframes srSkel { 0%,100%{opacity:1} 50%{opacity:.35} }
        .admin-page-report {
          --admin-report-card-bg:            var(--admin-report-card-bg,     #0C1422);
          --admin-report-card-border:        var(--admin-report-card-border, rgba(255,255,255,0.08));
          --admin-report-heading-color:      var(--admin-report-heading-color, rgba(255,255,255,0.95));
        }
      `}</style>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px 12px',
          alignItems: 'flex-start',
        }}>
          <MultiSelect
            label="State"
            options={allStates.map(s => ({ value: s, label: s }))}
            selected={selStates}
            onChange={setSelStates}
            placeholder="All states"
          />
          <MultiSelect
            label="City"
            options={cityOptions}
            selected={selCities}
            onChange={setSelCities}
            placeholder="All cities"
          />
          <MultiSelect
            label="School"
            options={schoolOptions}
            selected={selSchools}
            onChange={setSelSchools}
            placeholder="All schools"
          />

          <div>
            <div style={{
              fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5,
            }}>From date</div>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={{
                width: '100%', padding: '7px 11px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${T.border}`, borderRadius: 8,
                color: T.t1, fontFamily: T.ff, fontSize: 12,
                outline: 'none', colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <div style={{
              fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5,
            }}>To date</div>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              style={{
                width: '100%', padding: '7px 11px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${T.border}`, borderRadius: 8,
                color: T.t1, fontFamily: T.ff, fontSize: 12,
                outline: 'none', colorScheme: 'dark',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, color: 'transparent', fontFamily: T.ff, marginBottom: 5 }}>
              &nbsp;
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setRunKey(k => k + 1)}
                disabled={loading}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 9,
                  background: T.gold, border: 'none',
                  color: '#000', fontSize: 12, fontWeight: 800,
                  fontFamily: T.ff, cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Loading…' : 'Run Report'}
              </button>
              {report && (
                <button
                  onClick={() => {
                    const all = [
                      ...(leads?.details   ?? []).map((r: any) => ({ ...r, _section: 'leads' })),
                      ...(apps?.details    ?? []).map((r: any) => ({ ...r, _section: 'applications' })),
                      ...(reviews?.details ?? []).map((r: any) => ({ ...r, _section: 'reviews' })),
                      ...(revenue?.details ?? []).map((r: any) => ({ ...r, _section: 'revenue' })),
                    ]
                    exportCSV(all, `school-report-${new Date().toISOString().slice(0, 10)}.csv`)
                  }}
                  style={{
                    padding: '7px 12px', borderRadius: 9,
                    background: 'rgba(255,255,255,.05)',
                    border: `1px solid ${T.border}`, color: T.t2,
                    fontSize: 12, fontFamily: T.ff, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Download size={13} /> Export
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {activePills.map(label => (
              <span key={label} style={{
                fontSize: 10, padding: '2px 9px', borderRadius: 99,
                background: `${T.blue}20`, color: T.blue,
                fontFamily: T.ff, fontWeight: 600,
              }}>
                {label}
              </span>
            ))}
            <button
              onClick={() => { setSelStates([]); setSelCities([]); setSelSchools([]); setFrom(''); setTo('') }}
              style={{
                fontSize: 10, padding: '2px 9px', borderRadius: 99,
                background: 'rgba(255,87,87,.12)', color: T.red,
                fontFamily: T.ff, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {runKey === 0 && (
        <div style={{ ...CARD, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: T.t1,
            fontFamily: T.ff, marginBottom: 6,
          }}>
            Select filters and run the report
          </div>
          <div style={{ fontSize: 13, color: T.t3, fontFamily: T.ff }}>
            Use the checkboxes above to pick states, cities, or specific schools — then click Run Report.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — LEADS
      ══════════════════════════════════════════════════════════════════════ */}
      {runKey > 0 && (
        <Section num="1" title="Leads" color={T.blue}>
          {loading
            ? <KpiSkelRow n={4} />
            : leads && (
              <>
                {/* KPIs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  <KPI
                    label="Total leads shown"
                    value={fmt(leads.kpis.totalLeads)}
                    sub="On school dashboard"
                    color={T.blue}
                  />
                  <KPI
                    label="Leads purchased"
                    value={fmt(leads.kpis.purchasedLeads)}
                    sub="Unlocked by school"
                    color={T.green}
                  />
                  <KPI
                    label="Credits remaining"
                    value={fmt(leads.kpis.creditsRemaining)}
                    sub={`${fmt(leads.kpis.creditsUsed)} used · ${fmt(leads.kpis.creditsTotal)} total`}
                    color={T.gold}
                  />
                  <KPI
                    label="Purchase rate"
                    value={`${leads.kpis.purchaseRate}%`}
                    sub="Purchased / shown"
                    color={T.purple}
                  />
                </div>

                {/* Drill-down charts */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 10, marginBottom: 14,
                }}>
                  {[
                    { title: 'Grade wise',   data: leads.drilldown.byGrade,   color: T.blue   },
                    { title: 'Gender wise',  data: leads.drilldown.byGender,  color: T.teal   },
                    { title: 'Income wise',  data: leads.drilldown.byIncome,  color: T.gold   },
                    { title: 'Pincode wise', data: leads.drilldown.byPincode, color: T.purple },
                  ].map(({ title, data, color }) => (
                    <div key={title} style={{ ...CARD, padding: '14px 16px' }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: T.t2,
                        fontFamily: T.ff, textTransform: 'uppercase',
                        letterSpacing: '.09em', marginBottom: 12,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                        {title}
                      </div>
                      <HBars data={data} color={color} />
                    </div>
                  ))}
                </div>

                {/* Source chart */}
                {leads.drilldown.bySource.length > 0 && (
                  <div style={{ ...CARD, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12,
                    }}>
                      Lead source breakdown
                    </div>
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart
                        data={leads.drilldown.bySource}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: T.t3, fontSize: 11, fontFamily: T.ff }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: T.t3, fontSize: 11, fontFamily: T.ff }}
                          axisLine={false} tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#111927', border: `1px solid ${T.border}`,
                            borderRadius: 8, fontSize: 12, fontFamily: T.ff,
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                          {leads.drilldown.bySource.map((_: any, i: number) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* source legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 8 }}>
                      {[
                        { label: 'Direct',        color: T.blue   },
                        { label: 'Pincode match', color: T.purple },
                        { label: 'Geo (10 km)',   color: T.teal   },
                        { label: 'Search match',  color: T.gold   },
                      ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
                          <span style={{ fontSize: 10, color: T.t2, fontFamily: T.ff }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detail table */}
                <SubHead title="Lead details" rows={leads.details} filename="leads.csv" />
                <DrillTable
                  rows={leads.details}
                  emptyMsg="No leads in this period"
                  cols={[
                    { key: 'createdAt',     label: 'Date',      width: '88px',  render: v => fmtD(v) },
                    { key: 'parentName',    label: 'Parent' },
                    { key: 'parentPhone',   label: 'Phone' },
                    { key: 'parentEmail',   label: 'Email' },
                    { key: 'schoolName',    label: 'School' },
                    { key: 'schoolCity',    label: 'City' },
                    { key: 'schoolState',   label: 'State' },
                    { key: 'classApplying', label: 'Grade' },
                    { key: 'gender',        label: 'Gender' },
                    { key: 'incomeRange',   label: 'Income' },
                    { key: 'parentPincode', label: 'Pincode' },
                    { key: 'source',        label: 'Source' },
                    {
                      key: 'isPurchased', label: 'Purchased',
                      render: (v: boolean) => <StatusBadge s={v ? 'purchased' : 'new'} />,
                    },
                    { key: 'status', label: 'Status', render: v => <StatusBadge s={v} /> },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — APPLICATIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {runKey > 0 && (
        <Section num="2" title="Applications" color={T.green}>
          {loading
            ? <KpiSkelRow n={5} />
            : apps && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  <KPI label="Total"       value={fmt(apps.kpis.total)}       color={T.green}  />
                  <KPI label="Pending"     value={fmt(apps.kpis.pending)}     color={T.gold}   />
                  <KPI label="Shortlisted" value={fmt(apps.kpis.shortlisted)} color={T.teal}   />
                  <KPI label="Admitted"    value={fmt(apps.kpis.admitted)}    color={T.green}  />
                  <KPI label="Rejected"    value={fmt(apps.kpis.rejected)}    color={T.red}    />
                </div>

                {apps.byStatus.length > 0 && (
                  <div style={{ ...CARD, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12,
                    }}>Status breakdown</div>
                    <HBars data={apps.byStatus} color={T.green} />
                  </div>
                )}

                <SubHead title="Application details" rows={apps.details} filename="applications.csv" />
                <DrillTable
                  rows={apps.details}
                  emptyMsg="No applications in this period"
                  cols={[
                    { key: 'createdAt',   label: 'Date',   width: '88px', render: v => fmtD(v) },
                    { key: 'parentName',  label: 'Parent' },
                    { key: 'parentPhone', label: 'Phone' },
                    { key: 'schoolName',  label: 'School' },
                    { key: 'schoolCity',  label: 'City' },
                    { key: 'schoolState', label: 'State' },
                    { key: 'grade',       label: 'Grade' },
                    { key: 'status',      label: 'Status', render: v => <StatusBadge s={v} /> },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — REVIEWS
      ══════════════════════════════════════════════════════════════════════ */}
      {runKey > 0 && (
        <Section num="3" title="Reviews" color={T.gold}>
          {loading
            ? <KpiSkelRow n={4} />
            : reviews && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  <KPI label="Total reviews"     value={fmt(reviews.kpis.total)}    color={T.gold}   />
                  <KPI
                    label="Avg rating"
                    value={`${reviews.kpis.avgRating || '—'} / 5`}
                    sub={reviews.kpis.avgRating
                      ? '★'.repeat(Math.round(reviews.kpis.avgRating)) +
                        '☆'.repeat(5 - Math.round(reviews.kpis.avgRating))
                      : undefined}
                    color={T.gold}
                  />
                  <KPI label="Approved"           value={fmt(reviews.kpis.approved)} color={T.green}  />
                  <KPI label="Pending moderation" value={fmt(reviews.kpis.pending)}  color={T.orange} />
                </div>

                {reviews.byRating.length > 0 && (
                  <div style={{ ...CARD, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12,
                    }}>Rating distribution</div>
                    <HBars data={reviews.byRating} color={T.gold} />
                  </div>
                )}

                <SubHead title="Review details" rows={reviews.details} filename="reviews.csv" />
                <DrillTable
                  rows={reviews.details}
                  emptyMsg="No reviews in this period"
                  cols={[
                    { key: 'createdAt',     label: 'Date',   width: '88px', render: v => fmtD(v) },
                    { key: 'schoolName',    label: 'School' },
                    { key: 'schoolCity',    label: 'City' },
                    { key: 'schoolState',   label: 'State' },
                    { key: 'reviewerName',  label: 'Reviewer' },
                    { key: 'reviewerPhone', label: 'Phone' },
                    {
                      key: 'rating', label: 'Rating',
                      render: (v: number) => (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Stars n={v} />
                          <span style={{ fontSize: 11, color: T.t2 }}>{v}/5</span>
                        </span>
                      ),
                    },
                    {
                      key: 'content', label: 'Review', width: '240px',
                      render: (v: string) => (
                        <span style={{
                          color: T.t2, fontSize: 11, whiteSpace: 'normal',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{v || '—'}</span>
                      ),
                    },
                    {
                      key: 'isApproved', label: 'Status',
                      render: (v: boolean) => <StatusBadge s={v ? 'approved' : 'pending'} />,
                    },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — REVENUE
      ══════════════════════════════════════════════════════════════════════ */}
      {runKey > 0 && (
        <Section num="4" title="Revenue" color={T.purple}>
          {loading
            ? <KpiSkelRow n={4} />
            : revenue && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  <KPI
                    label="Total revenue"
                    value={fmtR(revenue.kpis.totalRevenuePaise)}
                    sub="Lead packages"
                    color={T.purple}
                  />
                  <KPI
                    label="Completed revenue"
                    value={fmtR(revenue.kpis.completedRevenuePaise)}
                    sub={`${fmt(revenue.kpis.completedCount)} transactions`}
                    color={T.green}
                  />
                  <KPI
                    label="Total credits sold"
                    value={fmt(revenue.kpis.totalCreditsSold)}
                    sub="Across all packages"
                    color={T.blue}
                  />
                  <KPI
                    label="Total discount"
                    value={fmtR(revenue.kpis.discountPaise)}
                    sub="Coupon savings"
                    color={T.orange}
                  />
                </div>

                {/* By package + By school side-by-side */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 10, marginBottom: 16,
                }}>
                  {revenue.byPackage.length > 0 && (
                    <div style={{ ...CARD, padding: '14px 16px' }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                        textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12,
                      }}>Revenue by package</div>
                      <HBars
                        data={revenue.byPackage.map((r: any) => ({
                          label: r.packageName,
                          count: Math.round(r.revenuePaise / 100),
                        }))}
                        color={T.purple}
                      />
                    </div>
                  )}
                  {revenue.bySchool.length > 0 && (
                    <div style={{ ...CARD, padding: '14px 16px' }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                        textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12,
                      }}>Top schools by revenue</div>
                      <HBars
                        data={revenue.bySchool.slice(0, 8).map((r: any) => ({
                          label: r.schoolName,
                          count: Math.round(r.revenuePaise / 100),
                        }))}
                        color={T.teal}
                      />
                    </div>
                  )}
                </div>

                <SubHead title="Transaction details" rows={revenue.details} filename="revenue.csv" />
                <DrillTable
                  rows={revenue.details}
                  emptyMsg="No transactions in this period"
                  cols={[
                    { key: 'createdAt',     label: 'Date',     width: '88px', render: v => fmtD(v) },
                    { key: 'schoolName',    label: 'School' },
                    { key: 'schoolCity',    label: 'City' },
                    { key: 'schoolState',   label: 'State' },
                    {
                      key: 'paymentType', label: 'Type',
                      render: (v: string) => (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99, fontFamily: T.ff,
                          background: v === 'Subscription' ? `${T.teal}18` : `${T.purple}18`,
                          color: v === 'Subscription' ? T.teal : T.purple,
                        }}>{v}</span>
                      ),
                    },
                    { key: 'packageName',   label: 'Package' },
                    {
                      key: 'amountPaise', label: 'Amount',
                      render: (v: number) => (
                        <span style={{ color: T.green, fontWeight: 700 }}>{fmtR(v)}</span>
                      ),
                    },
                    {
                      key: 'discountPaise', label: 'Discount',
                      render: (v: number) => v > 0
                        ? <span style={{ color: T.orange }}>{fmtR(v)}</span>
                        : '—',
                    },
                    {
                      key: 'couponCode', label: 'Coupon',
                      render: (v: string | null) => v
                        ? <span style={{
                            fontSize: 10, padding: '2px 7px', borderRadius: 99,
                            background: `${T.orange}18`, color: T.orange,
                          }}>{v}</span>
                        : '—',
                    },
                    {
                      key: 'creditsAdded', label: 'Credits',
                      render: (v: number) => v > 0 ? <span style={{ color: T.blue }}>{v}</span> : '—',
                    },
                    { key: 'gateway',   label: 'Gateway' },
                    {
                      key: 'orderId', label: 'Order ID',
                      render: (v: string) => (
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.t3 }}>{v}</span>
                      ),
                    },
                    { key: 'status', label: 'Status', render: v => <StatusBadge s={v} /> },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — SUBSCRIPTIONS PURCHASED
      ══════════════════════════════════════════════════════════════════════ */}
      {runKey > 0 && (
        <Section num="5" title="Subscriptions Purchased" color={T.teal}>
          {loading
            ? <KpiSkelRow n={4} />
            : subscriptions && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  <KPI label="Subscription payments"  value={fmt(subscriptions.kpis.totalPayments)}     sub={`${fmt(subscriptions.kpis.successfulPayments)} successful`} color={T.teal} />
                  <KPI label="Subscription revenue"   value={fmtR(subscriptions.kpis.revenuePaise)}     sub="From subscriptions only"                                   color={T.green} />
                  <KPI label="Schools subscribed"     value={fmt(subscriptions.kpis.uniqueSchools)}     sub={`${fmt(subscriptions.kpis.currentlyActive)} currently active`} color={T.blue} />
                  <KPI label="Active subscriptions"   value={fmt(subscriptions.kpis.totalActive)}       sub={`${fmt(subscriptions.kpis.uniquePlans)} unique plans`}     color={T.purple} />
                </div>

                {subscriptions.byPlan.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 16 }}>
                    <div style={{ ...CARD, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12 }}>Revenue by plan</div>
                      <HBars data={subscriptions.byPlan.map((r: any) => ({ label: r.planName, count: Math.round(r.revenuePaise / 100) }))} color={T.teal} />
                    </div>
                    <div style={{ ...CARD, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, fontFamily: T.ff, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12 }}>Schools per plan</div>
                      <HBars data={subscriptions.byPlan.map((r: any) => ({ label: r.planName, count: r.schoolCount }))} color={T.blue} />
                    </div>
                  </div>
                )}

                <SubHead title="Active subscriptions" rows={subscriptions.activeDetails} filename="active-subscriptions.csv" />
                <DrillTable
                  rows={subscriptions.activeDetails}
                  emptyMsg="No active subscriptions in this period"
                  cols={[
                    { key: 'activatedAt', label: 'Activated', width: '88px', render: (v: any) => fmtD(v) },
                    { key: 'schoolName',  label: 'School' },
                    { key: 'schoolCity',  label: 'City' },
                    { key: 'schoolState', label: 'State' },
                    { key: 'planName',    label: 'Plan' },
                    { key: 'leadCount',   label: 'Leads Included', render: (v: number) => <span style={{ color: T.blue, fontWeight: 700 }}>{v}</span> },
                    { key: 'expiresAt',   label: 'Expires', render: (v: string | null) => v ? fmtD(v) : <span style={{ color: T.green, fontSize: 10 }}>No expiry</span> },
                    { key: 'isActive',    label: 'Status', render: (v: boolean) => <StatusBadge s={v ? 'active' : 'expired'} /> },
                  ]}
                />

                <div style={{ marginTop: 20 }}>
                  <SubHead title="Subscription payment transactions" rows={subscriptions.paymentDetails} filename="subscription-payments.csv" />
                  <DrillTable
                    rows={subscriptions.paymentDetails}
                    emptyMsg="No subscription payments in this period"
                    cols={[
                      { key: 'createdAt',  label: 'Date',    width: '88px', render: (v: any) => fmtD(v) },
                      { key: 'schoolName', label: 'School' },
                      { key: 'schoolCity', label: 'City' },
                      { key: 'planName',   label: 'Plan' },
                      { key: 'amountPaise', label: 'Amount', render: (v: number) => <span style={{ color: T.green, fontWeight: 700 }}>{fmtR(v)}</span> },
                      { key: 'leadCount',  label: 'Leads', render: (v: number) => v > 0 ? <span style={{ color: T.blue }}>{v}</span> : '—' },
                      { key: 'gateway',    label: 'Gateway' },
                      { key: 'orderId',    label: 'Order ID', render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.t3 }}>{v}</span> },
                      { key: 'status',     label: 'Status', render: (v: any) => <StatusBadge s={v} /> },
                    ]}
                  />
                </div>
              </>
            )
          }
        </Section>
      )}

    </AdminLayout>
  )
}
