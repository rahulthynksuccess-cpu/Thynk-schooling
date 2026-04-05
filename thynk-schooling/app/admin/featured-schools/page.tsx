'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Star, Save, Info, Layout, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  bg:      'var(--admin-bg,#04080F)',
  card:    'var(--admin-card-bg,#0C1422)',
  border:  'var(--admin-border,rgba(255,255,255,0.07))',
  t1:      'var(--admin-text,rgba(255,255,255,0.95))',
  t2:      'var(--admin-text-muted,rgba(255,255,255,0.65))',
  t3:      'var(--admin-text-faint,rgba(255,255,255,0.35))',
  gold:    'var(--admin-accent,#F5A623)',
  green:   '#00E5A0',
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/admin?action=settings', { cache: 'no-store' })
  const json = await res.json()
  return json?.settings ?? {}
}

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/admin?action=settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) throw new Error('Failed to save setting')
  return res.json()
}

export default function FeaturedSchoolsAdminPage() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettings,
    staleTime: 30_000,
  })

  const [count, setCount] = useState<number>(10)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings?.featured_schools_count) {
      const n = parseInt(settings.featured_schools_count, 10)
      if (!isNaN(n)) setCount(n)
    }
  }, [settings])

  const { mutate, isPending } = useMutation({
    mutationFn: () => saveSetting('featured_schools_count', String(count)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['featured-count'] })
      setSaved(true)
      toast.success('Featured schools count saved!')
      setTimeout(() => setSaved(false), 2500)
    },
    onError: () => toast.error('Failed to save. Check API connection.'),
  })

  const card: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: '28px 32px',
  }

  const PREVIEW_COUNTS = [4, 6, 8, 10, 12, 15, 20]

  return (
    <AdminLayout title="Featured Schools" subtitle="Control homepage featured school display">
      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Info banner */}
        <div style={{
          background: 'rgba(245,166,35,0.08)',
          border: `1px solid rgba(245,166,35,0.22)`,
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <Info style={{ width: 16, height: 16, color: T.gold, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: T.t2, lineHeight: 1.6 }}>
            <span style={{ color: T.t1, fontWeight: 700 }}>Featured Schools Section — </span>
            Controls how many featured school cards appear on the homepage. Only schools marked as
            <span style={{ color: T.gold }}> "Featured"</span> in the Schools panel will show. If fewer
            featured schools exist than the count set, only available ones are displayed.
          </div>
        </div>

        {/* Main control card */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,166,35,0.12)', border: `1px solid rgba(245,166,35,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Star style={{ width: 16, height: 16, color: T.gold }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: T.t1 }}>
                Homepage Featured Block Count
              </div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: T.t3, marginTop: 1 }}>
                Number of school cards shown in the Featured Schools section
              </div>
            </div>
          </div>

          {/* Quick select chips */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Quick Select
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PREVIEW_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 13,
                    transition: 'all 0.15s ease',
                    background: count === n ? T.gold : 'rgba(255,255,255,0.06)',
                    color: count === n ? '#000' : T.t2,
                    boxShadow: count === n ? '0 4px 16px rgba(245,166,35,0.3)' : 'none',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Custom number input */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Custom Count (1–20)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={e => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v)) setCount(Math.max(1, Math.min(20, v)))
                }}
                style={{
                  width: 100, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid rgba(255,255,255,0.12)`,
                  borderRadius: 10, fontSize: 18, fontWeight: 800,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: T.t1, outline: 'none',
                  textAlign: 'center',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: T.t3 }}>
                cards will appear on the homepage
              </div>
            </div>
          </div>

          {/* Visual preview grid */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Layout Preview
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 12,
              border: `1px solid ${T.border}`, padding: 16,
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                gap: 6,
              }}>
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} style={{
                    height: 36, borderRadius: 7,
                    background: `rgba(245,166,35,${0.6 - (i * 0.04)})`,
                    border: '1px solid rgba(245,166,35,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Star style={{ width: 12, height: 12, color: 'rgba(0,0,0,0.5)' }} />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: T.t3, marginTop: 10 }}>
                {count} featured school block{count !== 1 ? 's' : ''} across 4-column responsive grid
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={() => mutate()}
            disabled={isPending || isLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 24px',
              borderRadius: 12, border: 'none', cursor: isPending ? 'wait' : 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14,
              background: saved ? T.green : T.gold,
              color: '#000',
              transition: 'all 0.2s ease',
              boxShadow: saved
                ? '0 6px 24px rgba(0,229,160,0.3)'
                : '0 6px 24px rgba(245,166,35,0.3)',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending
              ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving…</>
              : saved
                ? <><CheckCircle2 style={{ width: 16, height: 16 }} /> Saved!</>
                : <><Save style={{ width: 16, height: 16 }} /> Save Featured Count</>
            }
          </button>
        </div>

        {/* How to mark schools as featured */}
        <div style={{ ...card, padding: '22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Layout style={{ width: 16, height: 16, color: T.t2 }} />
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.t1 }}>
              How to mark schools as Featured
            </span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {[
              'Go to Admin → Schools in the left sidebar',
              'Click on any school to open its edit panel',
              'Toggle the "Featured" switch to ON',
              'Save — the school will now appear in the homepage section',
            ].map((step, i) => (
              <li key={i} style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13,
                color: T.t2, lineHeight: 1.7, marginBottom: 4,
              }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  )
}
