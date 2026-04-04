'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useDropdown } from '@/hooks/useDropdown'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User, MapPin, Briefcase, DollarSign, Heart, Save, Loader2,
  ArrowLeft, Edit3, CheckCircle2, Phone, Mail, GraduationCap, Users
} from 'lucide-react'
import toast from 'react-hot-toast'

const C = {
  bg: '#FAF7F2', card: '#FFFFFF', bdr: 'rgba(13,17,23,0.09)',
  ink: '#0D1117', muted: '#718096', faint: '#A0ADB8',
  gold: '#B8860B', goldBg: '#FEF7E0',
  serif: "'Cormorant Garamond',Georgia,serif",
  sans: "'Inter',system-ui,sans-serif",
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1.5px solid ${C.bdr}`, borderRadius: 10,
  fontSize: 14, fontFamily: C.sans, color: C.ink,
  background: C.card, outline: 'none', boxSizing: 'border-box' as const,
  transition: 'border-color .18s',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  letterSpacing: '.08em', textTransform: 'uppercase' as const,
  color: C.faint, marginBottom: 6, fontFamily: C.sans,
}
const selS: React.CSSProperties = { ...inp, cursor: 'pointer', appearance: 'none' as const }

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi',
  'Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
]

export default function ProfilePage() {
  const { user, accessToken, setUser } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: '', state: '', city: '', locality: '',
    occupation: '', annualIncomeRange: '', religion: '',
    budgetMin: '', budgetMax: '', howDidYouHear: '',
  })

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && (!accessToken || !user)) router.replace('/login')
  }, [mounted, accessToken, user, router])

  const stateVal = form.state.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and')
  const { options: cities      } = useDropdown('city', { parentValue: stateVal || undefined, enabled: true })
  const { options: occupations } = useDropdown('occupation')
  const { options: incomeRanges} = useDropdown('income_range')
  const { options: religions   } = useDropdown('religion')
  const { options: howHeard    } = useDropdown('how_did_you_hear')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['parent-profile'],
    queryFn: () => fetch('/api/parent-profiles', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    enabled: !!accessToken && mounted,
    staleTime: 5 * 60 * 1000,
  })

  const { data: children } = useQuery<any[]>({
    queryKey: ['students'],
    queryFn: () => fetch('/api/students', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    enabled: !!accessToken && mounted,
    staleTime: 5 * 60 * 1000,
  })

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName:          profile.fullName          || user?.fullName || '',
        state:             profile.state             || '',
        city:              profile.city              || '',
        locality:          profile.locality          || '',
        occupation:        profile.occupation        || '',
        annualIncomeRange: profile.incomeRange       || '',
        religion:          profile.religion          || '',
        budgetMin:         profile.budgetMin ? String(profile.budgetMin) : '',
        budgetMax:         profile.budgetMax ? String(profile.budgetMax) : '',
        howDidYouHear:     profile.howDidYouHear     || '',
      })
    } else if (user) {
      setForm(f => ({ ...f, fullName: user.fullName || '' }))
    }
  }, [profile, user])

  const saveMut = useMutation({
    mutationFn: () => fetch('/api/parent-profiles', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budgetMin: form.budgetMin ? Number(form.budgetMin) : null, budgetMax: form.budgetMax ? Number(form.budgetMax) : null }),
    }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
    onSuccess: () => {
      toast.success('Profile saved!')
      if (user && form.fullName) setUser({ ...user, fullName: form.fullName })
      qc.invalidateQueries({ queryKey: ['parent-profile'] })
      setEditing(false)
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  const set = (k: string, v: string) => setForm(p => {
    const next = { ...p, [k]: v }
    if (k === 'state') next.city = ''
    return next
  })

  if (!mounted) return null

  const kids = Array.isArray(children) ? children : []
  const initials = (user?.fullName || user?.phone || 'P')[0].toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.sans }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.bdr}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard/parent" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.faint, textDecoration: 'none', fontSize: 13, transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.faint}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Dashboard
          </Link>
          <span style={{ color: C.faint }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>My Profile</span>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, color: C.gold, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: C.sans }}>
            <Edit3 style={{ width: 13, height: 13 }} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(false)}
              style={{ padding: '8px 16px', borderRadius: 9, background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: C.sans }}>
              Cancel
            </button>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: C.gold, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: C.sans, opacity: saveMut.isPending ? 0.7 : 1 }}>
              {saveMut.isPending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Avatar + name hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,#FEF7E0 0%,#FAF7F2 60%)', border: `1px solid rgba(184,134,11,0.18)`, borderRadius: 20, padding: '32px 36px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(184,134,11,0.08)' }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontWeight: 700, fontSize: 36, color: '#fff', flexShrink: 0, boxShadow: '0 4px 18px rgba(184,134,11,0.35)' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 28, color: C.ink, margin: '0 0 4px', lineHeight: 1.2 }}>
              {user?.fullName || 'Your Profile'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {user?.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.muted }}>
                  <Phone style={{ width: 13, height: 13 }} />{user.phone}
                </span>
              )}
              {profile?.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.muted }}>
                  <MapPin style={{ width: 13, height: 13 }} />{profile.city}{profile.state ? `, ${profile.state}` : ''}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.gold, background: C.goldBg, padding: '3px 10px', borderRadius: 99 }}>
                <Users style={{ width: 12, height: 12 }} />{kids.length} {kids.length === 1 ? 'child' : 'children'}
              </span>
            </div>
          </div>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#059669' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', fontFamily: C.sans }}>Profile Complete</span>
            </div>
          )}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          {/* Personal Info */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
            <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 18, color: C.ink, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User style={{ width: 16, height: 16, color: C.gold }} /> Personal Info
            </h3>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: C.bg, animation: 'shimmer 1.4s ease-in-out infinite', backgroundSize: '200% 100%' }} />)}
              </div>
            ) : editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your full name" style={inp}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.gold}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.bdr} />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} style={selS}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>City</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)} disabled={!form.state} style={{ ...selS, opacity: !form.state ? 0.5 : 1 }}>
                    <option value="">{!form.state ? 'Select state first' : 'Select City'}</option>
                    {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Locality / Area</label>
                  <input value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="e.g. Sector 18, Noida" style={inp}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.gold}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.bdr} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: User,    label: 'Full Name', value: profile?.fullName || user?.fullName },
                  { icon: MapPin,  label: 'Location',  value: [profile?.locality, profile?.city, profile?.state].filter(Boolean).join(', ') },
                  { icon: Phone,   label: 'Phone',     value: user?.phone },
                ].map(r => r.value && (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.bdr}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <r.icon style={{ width: 14, height: 14, color: C.gold }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{r.value}</div>
                    </div>
                  </div>
                ))}
                {!profile && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: C.faint, fontSize: 13 }}>
                    Click <strong style={{ color: C.gold }}>Edit Profile</strong> to add your details
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Professional & Financial */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)' }}>
            <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 18, color: C.ink, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase style={{ width: 16, height: 16, color: C.gold }} /> Professional Details
            </h3>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: C.bg }} />)}
              </div>
            ) : editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={lbl}>Occupation</label>
                  <select value={form.occupation} onChange={e => set('occupation', e.target.value)} style={selS}>
                    <option value="">Select Occupation</option>
                    {occupations.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Annual Income</label>
                  <select value={form.annualIncomeRange} onChange={e => set('annualIncomeRange', e.target.value)} style={selS}>
                    <option value="">Select Income Range</option>
                    {incomeRanges.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Religion</label>
                  <select value={form.religion} onChange={e => set('religion', e.target.value)} style={selS}>
                    <option value="">Select Religion</option>
                    {religions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Monthly School Budget (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input type="number" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} placeholder="Min" style={inp}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.gold}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.bdr} />
                    <input type="number" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} placeholder="Max" style={inp}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.gold}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.bdr} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>How did you hear about us?</label>
                  <select value={form.howDidYouHear} onChange={e => set('howDidYouHear', e.target.value)} style={selS}>
                    <option value="">Select</option>
                    {howHeard.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Briefcase,  label: 'Occupation',    value: profile?.occupation },
                  { icon: DollarSign, label: 'Annual Income', value: profile?.incomeRange },
                  { icon: Heart,      label: 'Religion',      value: profile?.religion },
                  { icon: DollarSign, label: 'School Budget', value: profile?.budgetMin || profile?.budgetMax ? `₹${profile?.budgetMin?.toLocaleString('en-IN') || '0'} – ₹${profile?.budgetMax?.toLocaleString('en-IN') || '∞'}/mo` : null },
                ].map(r => r.value && (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.bdr}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <r.icon style={{ width: 14, height: 14, color: C.gold }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{r.value}</div>
                    </div>
                  </div>
                ))}
                {!profile && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: C.faint, fontSize: 13 }}>
                    No professional details added yet
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Children */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: '22px', boxShadow: '0 1px 4px rgba(13,17,23,0.05)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 18, color: C.ink, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap style={{ width: 16, height: 16, color: C.gold }} /> My Children
              </h3>
              <Link href="/dashboard/parent/children/add"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: C.goldBg, border: `1px solid rgba(184,134,11,0.2)`, borderRadius: 9, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: C.sans }}>
                + Add Child
              </Link>
            </div>
            {kids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: C.faint, fontSize: 13 }}>
                No children added yet.&nbsp;
                <Link href="/dashboard/parent/children/add" style={{ color: C.gold, fontWeight: 600 }}>Add your first child →</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {kids.map((child: any) => (
                  <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, borderRadius: 12, border: `1px solid ${C.bdr}` }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#B8860B,#D4A520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                      {(child.full_name || child.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 13, color: C.ink }}>{child.full_name || child.fullName}</div>
                      <div style={{ fontFamily: C.sans, fontSize: 11, color: C.faint, marginTop: 2 }}>
                        {[
                          child.applyingForClass || child.applying_for_class || child.currentClass || child.current_class || child.classLevel || child.class_level,
                          child.academicYear || child.academic_year || child.boardPreference || child.board_preference
                        ].filter(Boolean).join(' · ') || 'Profile added'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  )
}
