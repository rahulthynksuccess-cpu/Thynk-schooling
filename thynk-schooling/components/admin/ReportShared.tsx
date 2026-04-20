/**
 * Shared components + constants for the 3 analytics report pages.
 * Import from: @/components/admin/ReportShared
 */
import { ArrowUp, ArrowDown, Minus, RefreshCw, Download } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  bg:     'var(--admin-bg,#04080F)',
  card:   'var(--admin-card-bg,#0C1422)',
  border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1:     'var(--admin-text,rgba(255,255,255,0.95))',
  t2:     'var(--admin-text-muted,rgba(255,255,255,0.6))',
  t3:     'var(--admin-text-faint,rgba(255,255,255,0.32))',
  gold:   '#F5A623', blue: '#4F8EF7', green: '#00E5A0',
  purple: '#9B72FF', teal: '#2DD4BF', orange: '#FF7A2E',
  rose:   '#FF5757', amber: '#FBBF24',
}
export const ff = 'Plus Jakarta Sans,Inter,sans-serif'
export const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }
export const axisTick = { fill: T.t3, fontSize: 11, fontFamily: ff }
export const PALETTE = ['#4F8EF7','#00E5A0','#F5A623','#9B72FF','#FF7A2E','#2DD4BF','#FF5757','#FBBF24','#34D399','#60A5FA','#A78BFA','#FB923C']

// ─── Time ranges ──────────────────────────────────────────────────────────────
export const RANGES = [
  { key: '1d',  label: 'Today'    },
  { key: '7d',  label: '7 Days'  },
  { key: '15d', label: '15 Days' },
  { key: '30d', label: '30 Days' },
  { key: '3m',  label: '3 Months'},
  { key: '6m',  label: '6 Months'},
  { key: '1y',  label: '1 Year'  },
]

// ─── Range pills ──────────────────────────────────────────────────────────────
export function RangePills({ value, onChange, accentColor = T.gold }: { value: string; onChange: (r: string) => void; accentColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
      {RANGES.map(r => (
        <button key={r.key} onClick={() => onChange(r.key)}
          style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 11, fontWeight: value === r.key ? 700 : 500, background: value === r.key ? accentColor : 'transparent', color: value === r.key ? '#000' : T.t2, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
export function ChartTip({ active, payload, label, currency = false }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0D1628', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: ff, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      {label && <div style={{ color: T.t2, marginBottom: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: T.t2, textTransform: 'capitalize' }}>{p.name}:</span>
          <span style={{ color: T.t1, fontWeight: 700 }}>
            {(currency || p.name === 'revenue' || p.name === 'Revenue') && typeof p.value === 'number'
              ? `₹${Number(p.value).toLocaleString('en-IN')}`
              : Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skel({ h = 200, r = 10 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.04)', animation: 'skel 1.4s ease-in-out infinite' }} />
}

// ─── KPI stat card ────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color, badge, loading }: any) {
  return (
    <div style={{ ...card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}00)` }} />
      {badge && (
        <div style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontFamily: ff, fontSize: 10, fontWeight: 700, color }}>
          {badge}
        </div>
      )}
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      {loading ? <Skel h={32} r={6} /> : (
        <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 26, color: T.t1, lineHeight: 1, letterSpacing: '-0.5px' }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
      )}
      <div style={{ fontFamily: ff, fontSize: 12, color: T.t2, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: ff, fontSize: 11, color: T.t3, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
export function SectionCard({ title, sub, children, icon: Icon, color = T.gold, action }: any) {
  return (
    <div style={{ ...card, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 15, height: 15, color }} />
          </div>
          <div>
            <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.t1, margin: 0 }}>{title}</h3>
            {sub && <p style={{ fontFamily: ff, fontSize: 11, color: T.t2, margin: '1px 0 0' }}>{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Horizontal progress bars ─────────────────────────────────────────────────
export function HorizBars({ data, colorArr = PALETTE, valueKey = 'count', nameKey = 'name', formatValue, max }: any) {
  const maxVal = max || Math.max(...(data || []).map((d: any) => d[valueKey] || 0), 1)
  const fmt = formatValue || ((v: number) => Number(v).toLocaleString('en-IN'))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {(data || []).slice(0, 15).map((item: any, i: number) => {
        const val = item[valueKey] || 0
        const pct = Math.round(val / maxVal * 100)
        const c = colorArr[i % colorArr.length]
        return (
          <div key={item[nameKey] || i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: ff, fontSize: 12, color: T.t2, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[nameKey]}</span>
              <span style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.t1 }}>{fmt(val)}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg,${c},${c}88)`, transition: 'width .5s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tag cloud ────────────────────────────────────────────────────────────────
export function TagCloud({ data, color = T.teal, valueKey = 'count', nameKey = 'name' }: any) {
  const maxVal = Math.max(...(data || []).map((d: any) => d[valueKey] || 0), 1)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(data || []).slice(0, 24).map((item: any, i: number) => {
        const intensity = (item[valueKey] || 0) / maxVal
        const c = Array.isArray(color) ? color[i % color.length] : color
        const alpha = Math.max(0.08, intensity * 0.35)
        const borderAlpha = Math.max(0.12, intensity * 0.55)
        return (
          <div key={item[nameKey] || i} style={{ padding: '4px 11px', borderRadius: 20, background: `${c}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`, border: `1px solid ${c}${Math.round(borderAlpha * 255).toString(16).padStart(2, '0')}`, fontFamily: ff, fontSize: 12, color: c, fontWeight: intensity > 0.4 ? 700 : 400 }}>
            {item[nameKey]} <span style={{ opacity: 0.55, fontSize: 10 }}>{Number(item[valueKey] || 0).toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Comparison data table ────────────────────────────────────────────────────
export function DataTable({ columns, rows, loading, maxH = 320, accentCol = 1 }: {
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center'; color?: string; format?: (v: any) => string }[]
  rows: any[]
  loading?: boolean
  maxH?: number
  accentCol?: number
}) {
  return (
    <div style={{ overflow: 'hidden', borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ maxHeight: maxH, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
              {columns.map((col, i) => (
                <th key={col.key} style={{ padding: '9px 14px', textAlign: col.align || (i === 0 ? 'left' : 'right'), fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: T.t3, whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={columns.length} style={{ padding: '10px 14px' }}><Skel h={16} r={4} /></td></tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: '28px 14px', textAlign: 'center', color: T.t3, fontFamily: ff }}>No data available</td></tr>
            ) : rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                {columns.map((col, ci) => {
                  const val = row[col.key]
                  const display = col.format ? col.format(val) : (typeof val === 'number' ? val.toLocaleString('en-IN') : val ?? '—')
                  return (
                    <td key={col.key} style={{ padding: '9px 14px', textAlign: col.align || (ci === 0 ? 'left' : 'right'), color: col.color || (ci === accentCol ? T.t1 : T.t2), fontWeight: ci === accentCol ? 700 : 400 }}>
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page action bar (range + refresh + export) ───────────────────────────────
export function PageActions({ range, onRangeChange, onRefresh, onExport, loading, accentColor = T.gold }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
      <RangePills value={range} onChange={onRangeChange} accentColor={accentColor} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onRefresh} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.t2, fontSize: 11, fontFamily: ff, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
        <button onClick={onExport}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: accentColor, color: '#000', fontSize: 11, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
          <Download style={{ width: 12, height: 12 }} />
          Export CSV
        </button>
      </div>
    </div>
  )
}

// ─── Comparison table with current vs prior period ────────────────────────────
export function ComparisonTable({ title, sub, icon: Icon, color = T.gold, columns, rows, loading }: any) {
  return (
    <SectionCard title={title} sub={sub} icon={Icon} color={color}>
      <DataTable columns={columns} rows={rows} loading={loading} accentCol={1} />
    </SectionCard>
  )
}

// ─── Mini trend indicator ─────────────────────────────────────────────────────
export function TrendBadge({ current, prior }: { current: number; prior: number }) {
  if (!prior) return null
  const pct = Math.round((current - prior) / prior * 100)
  const up = pct >= 0
  const Icon = up ? ArrowUp : ArrowDown
  const color = up ? T.green : T.rose
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 20, background: `${color}15`, color, fontFamily: ff, fontSize: 10, fontWeight: 700 }}>
      <Icon style={{ width: 9, height: 9 }} /> {Math.abs(pct)}%
    </span>
  )
}
