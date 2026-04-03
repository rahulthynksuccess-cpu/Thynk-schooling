'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Settings, Plus, Pencil, Trash2,
  Save, X, Loader2, Search,
  ToggleLeft, ToggleRight, ChevronRight, Sprout, Hash
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DropdownOption } from '@/types'
import toast from 'react-hot-toast'

/* ─── CSS var helpers (same pattern as AdminLayout) ─── */
const V = {
  pageBg:    'var(--admin-bg, #0A0F1A)',
  cardBg:    'var(--admin-card-bg, rgba(255,255,255,0.04))',
  border:    'var(--admin-border, rgba(255,255,255,0.07))',
  text:      'var(--admin-text, rgba(255,255,255,0.9))',
  textMuted: 'var(--admin-text-muted, rgba(255,255,255,0.45))',
  textFaint: 'var(--admin-text-faint, rgba(255,255,255,0.25))',
  accent:    'var(--admin-accent, #B8860B)',
}

const DROPDOWN_CATEGORIES = [
  { key: 'board',              label: 'Board',              icon: '📚', desc: 'CBSE, ICSE, IB, State boards…' },
  { key: 'school_type',        label: 'School Type',        icon: '🏫', desc: 'Private, Government, Aided…' },
  { key: 'gender_policy',      label: 'Gender Policy',      icon: '⚧️', desc: 'Co-ed, Boys only, Girls only…' },
  { key: 'medium',             label: 'Medium',             icon: '🗣️', desc: 'English, Hindi, Regional…' },
  { key: 'class_level',        label: 'Class Level',        icon: '🎓', desc: 'Nursery to Class 12' },
  { key: 'academic_year',      label: 'Academic Year',      icon: '📅', desc: '2024-25, 2025-26…' },
  { key: 'city',               label: 'City',               icon: '🏙️', desc: 'Delhi, Mumbai, Bengaluru…' },
  { key: 'state',              label: 'State',              icon: '🗺️', desc: 'All Indian states' },
  { key: 'religion',           label: 'Religion',           icon: '🕌', desc: 'Secular, Christian, Islamic…' },
  { key: 'recognition',        label: 'Recognition',        icon: '🏅', desc: 'NAAC, ISO, Govt Aided…' },
  { key: 'blood_group',        label: 'Blood Group',        icon: '🩸', desc: 'A+, B+, O+, AB+…' },
  { key: 'gender',             label: 'Gender',             icon: '👤', desc: 'Male, Female, Other' },
  { key: 'occupation',         label: 'Occupation',         icon: '💼', desc: 'Salaried, Business, Other…' },
  { key: 'income_range',       label: 'Income Range',       icon: '💰', desc: 'Below 5L, 5-15L, 15L+…' },
  { key: 'lead_status',        label: 'Lead Status',        icon: '📊', desc: 'New, Contacted, Converted…' },
  { key: 'application_status', label: 'Application Status', icon: '✅', desc: 'Pending, Shortlisted, Admitted…' },
  { key: 'source',             label: 'Lead Source',        icon: '📡', desc: 'Organic, Paid, Referral…' },
  { key: 'how_did_you_hear',   label: 'How Did You Hear',   icon: '👂', desc: 'Google, Instagram, Word of mouth…' },
]

const iS: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--admin-card-bg,rgba(255,255,255,0.04))',
  border: '1.5px solid rgba(255,255,255,0.08)',
  borderRadius: '9px', fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif',
  color: 'var(--admin-text, rgba(255,255,255,0.9))',
  outline: 'none', boxSizing: 'border-box' as const,
}

/* ─── Add/Edit Modal ─── */
function OptionModal({ category, option, onClose, onSave }: {
  category: string; option?: DropdownOption
  onClose: () => void; onSave: (d: Partial<DropdownOption>) => void
}) {
  const [label,     setLabel]     = useState(option?.label      || '')
  const [value,     setValue]     = useState(option?.value      || '')
  const [sortOrder, setSortOrder] = useState(option?.sortOrder  ?? 0)
  const [parentVal, setParentVal] = useState(option?.parentValue || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !value.trim()) { toast.error('Label and value are required.'); return }
    onSave({ label, value, sortOrder, parentValue: parentVal || undefined, category })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 480, zIndex: 1,
          background: 'var(--admin-bg, #0D1117)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: V.text, margin: 0 }}>
              {option ? 'Edit Option' : 'Add New Option'}
            </h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: V.textMuted, margin: '3px 0 0' }}>
              Category: <span style={{ color: V.accent }}>{category}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--admin-card-bg,rgba(255,255,255,0.05))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 8, cursor: 'pointer', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 15, height: 15, color: V.textMuted }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: V.textMuted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Display Label *</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Central Board of Secondary Education" style={iS} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: V.textMuted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Stored Value / Slug *</label>
            <input value={value} onChange={e => setValue(e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="e.g. cbse" style={{ ...iS, fontFamily: 'monospace' }} required />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: V.textFaint, marginTop: 5 }}>Lowercase, underscores only. Stored in the database.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: V.textMuted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={iS} min={0} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: V.textMuted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Parent Value <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input value={parentVal} onChange={e => setParentVal(e.target.value)} placeholder="e.g. maharashtra" style={iS} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 9, color: V.textMuted, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit"
              style={{ flex: 1, padding: '11px', background: V.accent, border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 20px rgba(184,134,11,0.3)' }}>
              <Save style={{ width: 14, height: 14 }} /> {option ? 'Save Changes' : 'Add Option'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ─── Category Options Panel ─── */
const INDIAN_STATES_LIST = [
  'Andaman & Nicobar','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chandigarh','Chhattisgarh','Dadra & Nagar Haveli','Daman & Diu','Delhi',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand',
  'Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
]

function CategoryOptions({ categoryKey }: { categoryKey: string }) {
  const queryClient = useQueryClient()
  const [search,      setSearch]      = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editOpt,     setEditOpt]     = useState<DropdownOption | undefined>()

  const { data: options, isLoading } = useQuery<DropdownOption[]>({
    queryKey: ['dropdown-options', categoryKey],
    queryFn: () => fetch(`/api/settings/dropdown?category=${categoryKey}&includeInactive=true`, { cache: 'no-store' })
      .then(r => r.json()).then(d => d.options || d || []),
    staleTime: 2 * 60 * 1000,
  })

  const inv = () => {
    queryClient.invalidateQueries({ queryKey: ['dropdown-options', categoryKey] })
    queryClient.invalidateQueries({ queryKey: ['dropdown', categoryKey] })
  }

  const addMutation = useMutation({
    mutationFn: (d: Partial<DropdownOption>) => fetch('/api/settings/dropdown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json()),
    onSuccess: () => { toast.success('Option added!'); setModalOpen(false); inv() },
    onError: () => toast.error('Failed to add.'),
  })
  const editMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<DropdownOption> }) => fetch(`/api/settings/dropdown?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json()),
    onSuccess: () => { toast.success('Updated!'); setEditOpt(undefined); setModalOpen(false); inv() },
    onError: () => toast.error('Failed to update.'),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => fetch(`/api/settings/dropdown?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }).then(r => r.json()),
    onSuccess: () => inv(),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/settings/dropdown?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Deleted.'); inv() },
    onError: () => toast.error('Cannot delete — option may be in use.'),
  })

  const handleSave = (d: Partial<DropdownOption>) => {
    if (editOpt) editMutation.mutate({ id: editOpt.id, d })
    else addMutation.mutate(d)
  }

  const filtered = (options ?? []).filter(o => {
    const matchesSearch = o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase())
    const matchesState = categoryKey !== 'city' || !stateFilter ||
      (o.parentValue || '').toLowerCase() === stateFilter.toLowerCase().replace(/\s+/g, '_')
    return matchesSearch && matchesState
  })
  const activeCount = (options ?? []).filter(o => o.isActive).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 9, padding: '0 14px' }}>
          <Search style={{ width: 14, height: 14, color: V.textFaint, flexShrink: 0 }} />
          <input type="text" placeholder={`Search in ${categoryKey}…`} value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: V.text, padding: '10px 0' }} />
        </div>
        {categoryKey === 'city' && (
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            style={{ padding: '0 12px', background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 9, color: V.text, fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">All States</option>
            {INDIAN_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button onClick={() => { setEditOpt(undefined); setModalOpen(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: V.accent, border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0, boxShadow: '0 2px 12px rgba(184,134,11,0.3)' }}>
          <Plus style={{ width: 14, height: 14 }} /> Add Option
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Total', value: options?.length ?? 0, color: V.text },
          { label: 'Active', value: activeCount, color: '#4ADE80' },
          { label: 'Inactive', value: (options?.length ?? 0) - activeCount, color: V.textMuted },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'var(--admin-card-bg,rgba(255,255,255,0.03))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: V.textMuted, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--admin-card-bg,rgba(255,255,255,0.03))', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Hash style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.1)' }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: V.textMuted }}>No options found. Add your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(opt => (
            <motion.div key={opt.id} layout
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 10,
                background: opt.isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                border: '1px solid var(--admin-border,rgba(255,255,255,0.07))',
                opacity: opt.isActive ? 1 : 0.55,
                transition: 'all .15s',
              }}>
              {/* Sort */}
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: V.textFaint, width: 22, textAlign: 'center', flexShrink: 0 }}>{opt.sortOrder}</span>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: V.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <code style={{ fontFamily: 'monospace', fontSize: 11, color: V.textMuted }}>{opt.value}</code>
                  {opt.parentValue && (
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: V.textFaint, background: 'var(--admin-card-bg,rgba(255,255,255,0.05))', padding: '1px 7px', borderRadius: 99 }}>parent: {opt.parentValue}</span>
                  )}
                </div>
              </div>
              {/* Toggle */}
              <button onClick={() => toggleMutation.mutate({ id: opt.id, isActive: !opt.isActive })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: opt.isActive ? '#4ADE80' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                title={opt.isActive ? 'Deactivate' : 'Activate'}>
                {opt.isActive ? <ToggleRight style={{ width: 22, height: 22 }} /> : <ToggleLeft style={{ width: 22, height: 22 }} />}
              </button>
              {/* Edit */}
              <button onClick={() => { setEditOpt(opt); setModalOpen(true) }}
                style={{ background: 'var(--admin-card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 7, padding: '6px', cursor: 'pointer', display: 'flex', color: V.textMuted, flexShrink: 0 }}>
                <Pencil style={{ width: 13, height: 13 }} />
              </button>
              {/* Delete */}
              <button onClick={() => { if (window.confirm(`Delete "${opt.label}"?`)) deleteMutation.mutate(opt.id) }}
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 7, padding: '6px', cursor: 'pointer', display: 'flex', color: 'rgba(248,113,113,0.7)', flexShrink: 0 }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <OptionModal category={categoryKey} option={editOpt} onClose={() => { setModalOpen(false); setEditOpt(undefined) }} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Page ─── */
export default function AdminSettingsPage() {
  const [activeCategory, setActiveCategory] = useState(DROPDOWN_CATEGORIES[0].key)
  const [catSearch,      setCatSearch]      = useState('')
  const [seeding,        setSeeding]        = useState(false)
  const queryClient = useQueryClient()

  const handleSeed = async () => {
    if (!window.confirm('Add default Indian school dropdown values for empty categories. Existing entries will not be overwritten. Continue?')) return
    setSeeding(true)
    try {
      const res  = await fetch('/api/settings/dropdown/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Seed failed')
      toast.success(`✅ ${data.message}`)
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] })
      queryClient.invalidateQueries({ queryKey: ['dropdown'] })
    } catch (e: any) {
      toast.error(e.message || 'Seed failed')
    }
    setSeeding(false)
  }

  const filteredCats = DROPDOWN_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(catSearch.toLowerCase())
  )
  const activeCatDef = DROPDOWN_CATEGORIES.find(c => c.key === activeCategory)

  return (
    <AdminLayout title="Dropdown Settings" subtitle="Single source of truth — all dropdown values across the platform">

      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '14px 18px', background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.18)', borderRadius: 12 }}>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: V.text, marginBottom: 3 }}>
            ⚡ Changes reflect across all dropdowns, forms, and search filters
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: V.textMuted }}>
            Deactivating a value hides it from new forms but does not affect existing records.
          </div>
        </div>
        <button onClick={handleSeed} disabled={seeding}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 9, color: '#4ADE80', cursor: seeding ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0, opacity: seeding ? 0.7 : 1 }}>
          {seeding ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Seeding…</> : <><Sprout style={{ width: 14, height: 14 }} /> Seed Default Values</>}
        </button>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 230px)', minHeight: 0 }}>

        {/* Left: Category list */}
        <div style={{ background: 'var(--admin-card-bg, rgba(255,255,255,0.04))', border: '1px solid var(--admin-border, rgba(255,255,255,0.07))', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--admin-card-bg,rgba(255,255,255,0.05))', border: '1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius: 8, padding: '0 12px' }}>
              <Search style={{ width: 13, height: 13, color: V.textFaint, flexShrink: 0 }} />
              <input type="text" placeholder="Search categories…" value={catSearch} onChange={e => setCatSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: V.text, padding: '9px 0' }} />
            </div>
          </div>

          {/* Category list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filteredCats.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'all .15s',
                  background: activeCategory === cat.key ? 'rgba(184,134,11,0.15)' : 'transparent',
                  borderLeft: activeCategory === cat.key ? '3px solid var(--admin-accent, #B8860B)' : '3px solid transparent',
                }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: activeCategory === cat.key ? 700 : 500, color: activeCategory === cat.key ? 'var(--admin-accent, #B8860B)' : V.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: V.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.desc}</div>
                </div>
                {activeCategory === cat.key && <ChevronRight style={{ width: 13, height: 13, color: 'var(--admin-accent, #B8860B)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Options panel */}
        <div style={{ background: 'var(--admin-card-bg, rgba(255,255,255,0.04))', border: '1px solid var(--admin-border, rgba(255,255,255,0.07))', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--admin-border,rgba(255,255,255,0.07))', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {activeCatDef?.icon}
            </div>
            <div>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: V.text, margin: 0 }}>{activeCatDef?.label}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <code style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--admin-accent, #B8860B)', background: 'rgba(184,134,11,0.1)', padding: '2px 8px', borderRadius: 5 }}>{activeCategory}</code>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: V.textFaint }}>{activeCatDef?.desc}</span>
              </div>
            </div>
          </div>

          {/* Options content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <CategoryOptions key={activeCategory} categoryKey={activeCategory} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
