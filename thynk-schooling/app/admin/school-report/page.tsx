'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import {
  TrendingUp, DollarSign, FileCheck, Star,
  ChevronDown, ChevronUp, Download, Search
} from 'lucide-react'

// ─── Design tokens (dark admin palette) ──────────────────────────────────────
const T = {
  bg:     'var(--admin-bg,#04080F)',
  card:   'var(--admin-card-bg,#0C1422)',
  border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1:     'var(--admin-text,rgba(255,255,255,0.95))',
  t2:     'var(--admin-text-muted,rgba(255,255,255,0.65))',
  t3:     'var(--admin-text-faint,rgba(255,255,255,0.35))',
  gold:   '#F5A623', blue: '#4F8EF7', green: '#00E5A0',
  purple: '#9B72FF', red: '#FF5757',  orange: '#FF7A2E', teal: '#2DD4BF',
  ff:     "'Plus Jakarta Sans',sans-serif",
}

const card: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
}

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '7px 11px', fontFamily: T.ff,
  fontSize: 12, color: T.t1, outline: 'none', width: '100%',
}

const sel: React.CSSProperties = {
  ...inp, cursor: 'pointer', appearance: 'none' as any,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n.toLocaleString('en-IN')
const fmtR = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

const SECTION_COLORS: Record<string, string> = {
  leads: T.blue, applications: T.green, reviews: T.gold, revenue: T.purple,
}
const BAR_COLORS = [T.blue, T.teal, T.green, T.gold, T.purple, T.orange, T.red]

function statusBadge(s: string) {
  const map: Record<string, [string, string]> = {
    new:         ['rgba(79,142,247,.15)', T.blue],
    purchased:   ['rgba(0,229,160,.12)',  T.green],
    pending:     ['rgba(245,166,35,.12)', T.gold],
    shortlisted: ['rgba(45,212,191,.12)', T.teal],
    admitted:    ['rgba(0,229,160,.12)',  T.green],
    rejected:    ['rgba(255,87,87,.12)',  T.red],
    completed:   ['rgba(0,229,160,.12)',  T.green],
    approved:    ['rgba(0,229,160,.12)',  T.green],
    failed:      ['rgba(255,87,87,.12)',  T.red],
  }
  const [bg, color] = map[s?.toLowerCase()] || ['rgba(255,255,255,.07)', T.t2]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: bg, color, fontFamily: T.ff, whiteSpace: 'nowrap' }}>
      {s || 'unknown'}
    </span>
  )
}

function stars(n: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? T.gold : T.border, fontSize: 12 }}>★</span>
  ))
}

// ─── Mini horizontal bar chart ────────────────────────────────────────────────
function HBars({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.slice(0, 8).map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 88, fontSize: 11, color: T.t2, fontFamily: T.ff,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {d.label}
          </div>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)',
            borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(3, d.count / max * 100)}%`,
              background: color, borderRadius: 3, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 11, color: T.t2, fontFamily: T.ff,
            minWidth: 32, textAlign: 'right' }}>{fmt(d.count)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ ...card, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${color},${color}00)` }} />
      <div style={{ fontSize: 11, color: T.t2, fontFamily: T.ff,
        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.t1,
        fontFamily: T.ff, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.t3, fontFamily: T.ff, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Section wrapper with collapse ───────────────────────────────────────────
function Section({
  num, title, color, children, defaultOpen = true,
}: {
  num: string; title: string; color: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ ...card, overflow: 'hidden', marginBottom: 14 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? `1px solid ${T.border}` : 'none' }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: `${color}22`,
          border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color, fontFamily: T.ff, flexShrink: 0 }}>{num}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, fontFamily: T.ff }}>{title}</span>
        <span style={{ marginLeft: 'auto', color: T.t3 }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && <div style={{ padding: '16px 18px' }}>{children}</div>}
    </div>
  )
}

// ─── Drill-down table ─────────────────────────────────────────────────────────
function DrillTable({
  cols, rows, emptyMsg,
}: {
  cols: { key: string; label: string; width?: string; render?: (v: any, row: any) => React.ReactNode }[];
  rows: any[];
  emptyMsg?: string;
}) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const PER = 20

  const filtered = rows.filter(r =>
    !search || cols.some(c => String(r[c.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  )
  const total = filtered.length
  const paged = filtered.slice((page - 1) * PER, page * PER)
  const pages = Math.ceil(total / PER)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '5px 10px', flex: 1 }}>
          <Search size={12} style={{ color: T.t3, flexShrink: 0 }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Filter rows…"
            style={{ background: 'none', border: 'none', outline: 'none',
              fontSize: 12, fontFamily: T.ff, color: T.t1, flex: 1 }} />
        </div>
        <span style={{ fontSize: 11, color: T.t3, fontFamily: T.ff, whiteSpace: 'nowrap' }}>
          {fmt(total)} rows
        </span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8,
        border: `1px solid ${T.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {cols.map(c => (
                <th key={c.key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10,
                  fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: T.t2, fontFamily: T.ff, borderBottom: `1px solid ${T.border}`,
                  whiteSpace: 'nowrap', width: c.width }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0
              ? <tr><td colSpan={cols.length} style={{ padding: '32px 12px', textAlign: 'center',
                  fontSize: 13, color: T.t3, fontFamily: T.ff }}>{emptyMsg || 'No data'}</td></tr>
              : paged.map((row, ri) => (
                  <tr key={row.id || ri}
                    style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    {cols.map(c => (
                      <td key={c.key} style={{ padding: '9px 12px', fontSize: 12,
                        color: T.t2, fontFamily: T.ff, whiteSpace: 'nowrap' }}>
                        {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 6, marginTop: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontFamily: T.ff,
              background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`,
              color: T.t2, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? .4 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 11, color: T.t3, fontFamily: T.ff }}>
            {page} / {pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontFamily: T.ff,
              background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`,
              color: T.t2, cursor: page === pages ? 'not-allowed' : 'pointer',
              opacity: page === pages ? .4 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── CSV export helper ────────────────────────────────────────────────────────
function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv  = [keys.join(','), ...rows.map(r =>
    keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')
  )].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchoolReportPage() {
  const [state,    setState]    = useState('')
  const [city,     setCity]     = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')
  const [runKey,   setRunKey]   = useState(0)

  // Cascading filter data
  const { data: filterData } = useQuery({
    queryKey: ['sr-filters', state, city],
    queryFn: () =>
      fetch(`/api/admin/school-report?action=filters&state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`)
        .then(r => r.json()),
    staleTime: 5 * 60_000,
  })

  const states  = filterData?.states  || []
  const cities  = filterData?.cities  || []
  const schools = filterData?.schools || []

  // Reset city/school when state changes
  useEffect(() => { setCity(''); setSchoolId('') }, [state])
  useEffect(() => { setSchoolId('') }, [city])

  // Report data — only fetched when user hits Run
  const reportUrl = `/api/admin/school-report?action=report&state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}&schoolId=${encodeURIComponent(schoolId)}&from=${from}&to=${to}`

  const { data: report, isLoading, isFetching } = useQuery({
    queryKey: ['sr-report', runKey],
    queryFn: () => runKey === 0 ? Promise.resolve(null) : fetch(reportUrl).then(r => r.json()),
    staleTime: 0,
    enabled: runKey > 0,
  })

  const leads   = report?.leads
  const apps    = report?.applications
  const reviews = report?.reviews
  const revenue = report?.revenue

  const loading = isLoading || isFetching

  const Skel = ({ w = '80%', h = 13 }: { w?: string; h?: number }) => (
    <div style={{ width: w, height: h, borderRadius: 6,
      background: 'rgba(255,255,255,0.05)', animation: 'sk 1.4s ease-in-out infinite' }} />
  )

  return (
    <AdminLayout pageClass="admin-page-schools" title="School Report" subtitle="Drill-down analytics by school, city & state">
      <style>{`@keyframes sk{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr 1fr 1fr auto auto', gap: 10, alignItems: 'flex-end' }}>

          <div>
            <div style={{ fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>State</div>
            <div style={{ position: 'relative' }}>
              <select value={state} onChange={e => setState(e.target.value)} style={sel}>
                <option value="">All states</option>
                {states.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>City</div>
            <select value={city} onChange={e => setCity(e.target.value)} style={sel}>
              <option value="">All cities</option>
              {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>School</div>
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} style={sel}>
              <option value="">All schools</option>
              {schools.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>From</div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp} />
          </div>

          <div>
            <div style={{ fontSize: 10, color: T.t2, fontFamily: T.ff,
              textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>To</div>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inp} />
          </div>

          <button onClick={() => setRunKey(k => k + 1)} disabled={loading}
            style={{ padding: '8px 20px', borderRadius: 9, background: T.gold, border: 'none',
              color: '#000', fontSize: 12, fontWeight: 800, fontFamily: T.ff,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? .6 : 1,
              whiteSpace: 'nowrap', marginTop: 20 }}>
            {loading ? 'Loading…' : 'Run Report'}
          </button>

          {report && (
            <button
              onClick={() => {
                const all = [
                  ...(leads?.details   || []).map((r: any) => ({ ...r, _section: 'leads' })),
                  ...(apps?.details    || []).map((r: any) => ({ ...r, _section: 'applications' })),
                  ...(reviews?.details || []).map((r: any) => ({ ...r, _section: 'reviews' })),
                  ...(revenue?.details || []).map((r: any) => ({ ...r, _section: 'revenue' })),
                ]
                exportCSV(all, `school-report-${new Date().toISOString().slice(0, 10)}.csv`)
              }}
              style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.05)',
                border: `1px solid ${T.border}`, color: T.t2, fontSize: 12, fontFamily: T.ff,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
              <Download size={13} /> Export
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {(state || city || schoolId || from || to) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[
              state    && `State: ${state}`,
              city     && `City: ${city}`,
              schoolId && `School: ${schools.find((s: any) => s.id === schoolId)?.name || schoolId}`,
              from     && `From: ${from}`,
              to       && `To: ${to}`,
            ].filter(Boolean).map((label: any) => (
              <span key={label} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 99,
                background: `${T.blue}18`, color: T.blue, fontFamily: T.ff, fontWeight: 600 }}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {runKey === 0 && (
        <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, fontFamily: T.ff, marginBottom: 6 }}>
            Select filters and run the report
          </div>
          <div style={{ fontSize: 13, color: T.t3, fontFamily: T.ff }}>
            Choose a state, city, or specific school — then click Run Report.
          </div>
        </div>
      )}

      {/* ── Section 1: Leads ─────────────────────────────────────────────────── */}
      {runKey > 0 && (
        <Section num="1" title="Leads" color={T.blue}>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ ...card, padding: '14px 16px' }}><Skel w="50%" h={11} /><Skel w="70%" h={26} /></div>)}
              </div>
            : leads && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  <KPI label="Total leads shown" value={fmt(leads.kpis.totalLeads)} sub="On school dashboard" color={T.blue} />
                  <KPI label="Leads purchased" value={fmt(leads.kpis.purchasedLeads)} sub="Unlocked by school" color={T.green} />
                  <KPI label="Credits remaining" value={fmt(leads.kpis.creditsRemaining)} sub={`${fmt(leads.kpis.creditsUsed)} used`} color={T.gold} />
                  <KPI label="Purchase rate" value={`${leads.kpis.purchaseRate}%`} sub="Purchased / shown" color={T.purple} />
                </div>

                {/* Drill-down charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { title: 'Grade wise', data: leads.drilldown.byGrade,   color: T.blue },
                    { title: 'Gender wise', data: leads.drilldown.byGender,  color: T.teal },
                    { title: 'Income wise', data: leads.drilldown.byIncome,  color: T.gold },
                    { title: 'Pincode wise', data: leads.drilldown.byPincode, color: T.purple },
                  ].map(({ title, data, color }) => (
                    <div key={title} style={{ ...card, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.t2,
                        fontFamily: T.ff, textTransform: 'uppercase',
                        letterSpacing: '.08em', marginBottom: 10, display: 'flex',
                        alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                        {title}
                      </div>
                      {data.length === 0
                        ? <div style={{ fontSize: 12, color: T.t3, fontFamily: T.ff }}>No data</div>
                        : <HBars data={data} color={color} />
                      }
                    </div>
                  ))}
                </div>

                {/* Source bar chart */}
                {leads.drilldown.bySource.length > 0 && (
                  <div style={{ ...card, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                      Lead source breakdown
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={leads.drilldown.bySource} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: T.t3, fontSize: 11, fontFamily: T.ff }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: T.t3, fontSize: 11, fontFamily: T.ff }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#111927', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.ff }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {leads.drilldown.bySource.map((_: any, i: number) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Detail table */}
                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, fontFamily: T.ff,
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Lead details
                  <button onClick={() => exportCSV(leads.details, 'leads.csv')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                      borderRadius: 7, background: 'rgba(255,255,255,.05)',
                      border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
                      fontFamily: T.ff, cursor: 'pointer' }}>
                    <Download size={11} /> CSV
                  </button>
                </div>
                <DrillTable
                  rows={leads.details}
                  emptyMsg="No leads in this period"
                  cols={[
                    { key: 'createdAt',    label: 'Date',    width: '90px',  render: v => fmtD(v) },
                    { key: 'parentName',   label: 'Parent' },
                    { key: 'parentPhone',  label: 'Phone' },
                    { key: 'parentEmail',  label: 'Email' },
                    { key: 'schoolName',   label: 'School' },
                    { key: 'schoolCity',   label: 'City' },
                    { key: 'classApplying',label: 'Grade' },
                    { key: 'gender',       label: 'Gender' },
                    { key: 'incomeRange',  label: 'Income' },
                    { key: 'parentPincode',label: 'Pincode' },
                    { key: 'source',       label: 'Source' },
                    { key: 'isPurchased',  label: 'Purchased', render: (v: boolean) => statusBadge(v ? 'purchased' : 'new') },
                    { key: 'status',       label: 'Status', render: (v: string) => statusBadge(v) },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ── Section 2: Applications ───────────────────────────────────────────── */}
      {runKey > 0 && (
        <Section num="2" title="Applications" color={T.green}>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ ...card, padding: '14px 16px' }}><Skel w="50%" h={11} /><Skel w="70%" h={26} /></div>)}
              </div>
            : apps && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
                  <KPI label="Total"       value={fmt(apps.kpis.total)}       color={T.green} />
                  <KPI label="Pending"     value={fmt(apps.kpis.pending)}     color={T.gold} />
                  <KPI label="Shortlisted" value={fmt(apps.kpis.shortlisted)} color={T.teal} />
                  <KPI label="Admitted"    value={fmt(apps.kpis.admitted)}    color={T.green} />
                  <KPI label="Rejected"    value={fmt(apps.kpis.rejected)}    color={T.red} />
                </div>

                {apps.byStatus.length > 0 && (
                  <div style={{ ...card, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                      Status breakdown
                    </div>
                    <HBars data={apps.byStatus} color={T.green} />
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, fontFamily: T.ff,
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Application details
                  <button onClick={() => exportCSV(apps.details, 'applications.csv')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                      borderRadius: 7, background: 'rgba(255,255,255,.05)',
                      border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
                      fontFamily: T.ff, cursor: 'pointer' }}>
                    <Download size={11} /> CSV
                  </button>
                </div>
                <DrillTable
                  rows={apps.details}
                  emptyMsg="No applications in this period"
                  cols={[
                    { key: 'createdAt',   label: 'Date',   width: '90px', render: v => fmtD(v) },
                    { key: 'parentName',  label: 'Parent' },
                    { key: 'parentPhone', label: 'Phone' },
                    { key: 'schoolName',  label: 'School' },
                    { key: 'schoolCity',  label: 'City' },
                    { key: 'schoolState', label: 'State' },
                    { key: 'grade',       label: 'Grade' },
                    { key: 'status',      label: 'Status', render: (v: string) => statusBadge(v) },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ── Section 3: Reviews ───────────────────────────────────────────────── */}
      {runKey > 0 && (
        <Section num="3" title="Reviews" color={T.gold}>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ ...card, padding: '14px 16px' }}><Skel w="50%" h={11} /><Skel w="70%" h={26} /></div>)}
              </div>
            : reviews && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  <KPI label="Total reviews"       value={fmt(reviews.kpis.total)}    color={T.gold} />
                  <KPI label="Avg rating"           value={`${reviews.kpis.avgRating || '—'} / 5`}
                    sub={reviews.kpis.avgRating ? Array(Math.round(reviews.kpis.avgRating)).fill('★').join('') + Array(5 - Math.round(reviews.kpis.avgRating)).fill('☆').join('') : ''}
                    color={T.gold} />
                  <KPI label="Approved"             value={fmt(reviews.kpis.approved)} color={T.green} />
                  <KPI label="Pending moderation"   value={fmt(reviews.kpis.pending)}  color={T.orange} />
                </div>

                {reviews.byRating.length > 0 && (
                  <div style={{ ...card, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                      textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                      Rating distribution
                    </div>
                    <HBars data={reviews.byRating} color={T.gold} />
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, fontFamily: T.ff,
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Review details
                  <button onClick={() => exportCSV(reviews.details, 'reviews.csv')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                      borderRadius: 7, background: 'rgba(255,255,255,.05)',
                      border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
                      fontFamily: T.ff, cursor: 'pointer' }}>
                    <Download size={11} /> CSV
                  </button>
                </div>
                <DrillTable
                  rows={reviews.details}
                  emptyMsg="No reviews in this period"
                  cols={[
                    { key: 'createdAt',    label: 'Date',   width: '90px', render: v => fmtD(v) },
                    { key: 'schoolName',   label: 'School' },
                    { key: 'schoolCity',   label: 'City' },
                    { key: 'schoolState',  label: 'State' },
                    { key: 'reviewerName', label: 'Reviewer' },
                    { key: 'reviewerPhone',label: 'Phone' },
                    { key: 'rating',       label: 'Rating', render: (v: number) => (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {stars(v)} <span style={{ fontSize: 11, color: T.t2, marginLeft: 4 }}>{v}/5</span>
                      </span>
                    )},
                    { key: 'content',      label: 'Review', width: '260px', render: (v: string) => (
                      <span style={{ color: T.t2, fontSize: 11, whiteSpace: 'normal',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v || '—'}</span>
                    )},
                    { key: 'isApproved',   label: 'Status', render: (v: boolean) => statusBadge(v ? 'approved' : 'pending') },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

      {/* ── Section 4: Revenue ───────────────────────────────────────────────── */}
      {runKey > 0 && (
        <Section num="4" title="Revenue" color={T.purple}>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ ...card, padding: '14px 16px' }}><Skel w="50%" h={11} /><Skel w="70%" h={26} /></div>)}
              </div>
            : revenue && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  <KPI label="Total revenue"   value={fmtR(revenue.kpis.totalRevenuePaise)}
                    sub="Lead buy + subscriptions" color={T.purple} />
                  <KPI label="Completed revenue" value={fmtR(revenue.kpis.completedRevenuePaise)}
                    sub={`${fmt(revenue.kpis.completedCount)} transactions`} color={T.green} />
                  <KPI label="Total credits sold" value={fmt(revenue.kpis.totalCreditsSold)}
                    sub="Across all packages" color={T.blue} />
                  <KPI label="Total discount"   value={fmtR(revenue.kpis.discountPaise)}
                    sub="Coupon savings" color={T.orange} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {revenue.byPackage.length > 0 && (
                    <div style={{ ...card, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                        Revenue by package
                      </div>
                      <HBars data={revenue.byPackage.map((r: any) => ({
                        label: r.packageName, count: Math.round(r.revenuePaise / 100)
                      }))} color={T.purple} />
                    </div>
                  )}
                  {revenue.bySchool.length > 0 && (
                    <div style={{ ...card, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, fontFamily: T.ff,
                        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                        Top schools by revenue
                      </div>
                      <HBars data={revenue.bySchool.slice(0, 8).map((r: any) => ({
                        label: r.schoolName, count: Math.round(r.revenuePaise / 100)
                      }))} color={T.teal} />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, fontFamily: T.ff,
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Transaction details
                  <button onClick={() => exportCSV(revenue.details, 'revenue.csv')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                      borderRadius: 7, background: 'rgba(255,255,255,.05)',
                      border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
                      fontFamily: T.ff, cursor: 'pointer' }}>
                    <Download size={11} /> CSV
                  </button>
                </div>
                <DrillTable
                  rows={revenue.details}
                  emptyMsg="No transactions in this period"
                  cols={[
                    { key: 'createdAt',    label: 'Date',    width: '90px', render: v => fmtD(v) },
                    { key: 'schoolName',   label: 'School' },
                    { key: 'schoolCity',   label: 'City' },
                    { key: 'schoolState',  label: 'State' },
                    { key: 'packageName',  label: 'Package' },
                    { key: 'amountPaise',  label: 'Amount',  render: (v: number) => <span style={{ color: T.green, fontWeight: 700 }}>{fmtR(v)}</span> },
                    { key: 'discountPaise',label: 'Discount',render: (v: number) => v > 0 ? <span style={{ color: T.orange }}>{fmtR(v)}</span> : '—' },
                    { key: 'couponCode',   label: 'Coupon',  render: (v: string | null) => v ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: `${T.orange}18`, color: T.orange }}>{v}</span> : '—' },
                    { key: 'creditsAdded', label: 'Credits', render: (v: number) => <span style={{ color: T.blue }}>{v}</span> },
                    { key: 'gateway',      label: 'Gateway' },
                    { key: 'orderId',      label: 'Order ID', render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.t3 }}>{v}</span> },
                    { key: 'status',       label: 'Status', render: (v: string) => statusBadge(v) },
                  ]}
                />
              </>
            )
          }
        </Section>
      )}

    </AdminLayout>
  )
}
