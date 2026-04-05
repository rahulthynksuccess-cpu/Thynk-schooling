'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, School, Calendar, Shield, Activity } from 'lucide-react'
import Link from 'next/link'

const T = {
  card: 'var(--admin-card-bg,#0C1422)',
  border: 'var(--admin-border,rgba(255,255,255,0.07))',
  t1: 'var(--admin-text,rgba(255,255,255,0.95))',
  t2: 'var(--admin-text-muted,rgba(255,255,255,0.65))',
  t3: 'var(--admin-text-faint,rgba(255,255,255,0.4))',
  gold: 'var(--admin-accent,#F5A623)',
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin?action=users&id=${id}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/admin?action=users-activity&id=${id}`, { method: 'PATCH' }).then(r => r.json()).catch(() => ({ logs: [] })),
    ]).then(([uData, lData]) => {
      setUser(uData?.user || uData?.users?.[0] || null)
      setLogs(lData?.logs || [])
      setLoading(false)
    })
  }, [id])

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 24px' }

  if (loading) return (
    <AdminLayout title="User Detail" subtitle="Loading...">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: T.t3, fontFamily: 'DM Sans,sans-serif' }}>Loading user…</div>
      </div>
    </AdminLayout>
  )

  if (!user) return (
    <AdminLayout title="User Detail" subtitle="User not found">
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <div style={{ color: T.t2, fontFamily: 'DM Sans,sans-serif', marginBottom: 24 }}>User not found</div>
        <Link href="/admin/users" style={{ color: T.gold, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>← Back to Users</Link>
      </div>
    </AdminLayout>
  )

  const ROLE_COLOR: Record<string, string> = { parent: '#4F8EF7', school_admin: '#F5A623', super_admin: '#9B72FF' }
  const roleColor = ROLE_COLOR[user.role] || '#888'

  return (
    <AdminLayout title="User Detail" subtitle={`Profile for ${user.fullName || user.full_name || user.phone}`}>
      {/* Back */}
      <button onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', color: T.t2, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Users
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Left — profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${roleColor}20`, border: `2px solid ${roleColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, fontWeight: 800, color: roleColor, fontFamily: 'DM Sans,sans-serif' }}>
              {(user.fullName || user.full_name || user.phone || 'U')[0].toUpperCase()}
            </div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 17, color: T.t1, marginBottom: 4 }}>
              {user.fullName || user.full_name || '—'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30`, display: 'inline-block', fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user.role?.replace('_', ' ')}
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: user.status === 'suspended' ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)', color: user.status === 'suspended' ? '#F87171' : '#34D399', fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>
                {user.status === 'suspended' ? 'Suspended' : 'Active'}
              </span>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Contact Info</div>
            {[
              { icon: Phone, label: 'Phone', value: user.phone || '—' },
              { icon: Mail,  label: 'Email', value: user.email || '—' },
              { icon: School,label: 'School', value: user.school || user.schoolName || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <Icon style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: T.t3, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 13, color: T.t1, fontFamily: 'DM Sans,sans-serif' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Account Info</div>
            {[
              { icon: Calendar, label: 'Joined', value: user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
              { icon: Activity, label: 'Last Login', value: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never' },
              { icon: Shield,   label: 'Profile', value: user.profileDone ? '✓ Complete' : '✗ Incomplete' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <Icon style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: T.t3, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 13, color: T.t1, fontFamily: 'DM Sans,sans-serif' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — activity log */}
        <div style={card}>
          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 16 }}>Activity Log</div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.t3, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>No activity recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Action', 'Detail', 'IP Address', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.t3, fontFamily: 'DM Sans,sans-serif', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, color: T.t1 }}>{log.action}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: T.t2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: T.t3 }}>{log.ip_address || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: T.t3, whiteSpace: 'nowrap' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
