'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, Plus, Zap, RotateCcw, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react'

/* ── Types ── */
interface DropdownValue {
  id: string
  name: string
  slug: string
  active: boolean
  sortOrder?: number
}

interface DropdownCategory {
  key: string
  name: string
  emoji: string
  description: string
  values?: DropdownValue[]
}

/* ── Category definitions ── */
const CATEGORIES: DropdownCategory[] = [
  { key: 'board',        name: 'Board',           emoji: '📚', description: 'CBSE, ICSE, IB, State boards…' },
  { key: 'school_type',  name: 'School Type',      emoji: '🏛️', description: 'Private, Government, Aided…' },
  { key: 'gender_policy',name: 'Gender Policy',    emoji: '⚖️', description: 'Co-ed, Boys only, Girls only…' },
  { key: 'medium',       name: 'Medium',           emoji: '🌐', description: 'English, Hindi, Regional…' },
  { key: 'class_level',  name: 'Class Level',      emoji: '📊', description: 'Nursery to Class 12' },
  { key: 'academic_year',name: 'Academic Year',    emoji: '📅', description: '2024-25, 2025-26…' },
  { key: 'city',         name: 'City',             emoji: '🏙️', description: 'Delhi, Mumbai, Bengaluru…' },
  { key: 'state',        name: 'State',            emoji: '🗺️', description: 'All Indian states' },
  { key: 'religion',     name: 'Religion',         emoji: '🕌', description: 'Secular, Christian, Islamic…' },
  { key: 'recognition',  name: 'Recognition',      emoji: '🏆', description: 'NAAC, ISO, Govt Aided…' },
  { key: 'blood_group',  name: 'Blood Group',      emoji: '🩸', description: 'A+, B+, O+, AB+…' },
  { key: 'gender',       name: 'Gender',           emoji: '⚧️', description: 'Male, Female, Other' },
  { key: 'occupation',      name: 'Occupation',            emoji: '💼', description: 'Salaried, Business, Other…' },
  { key: 'income_range',    name: 'Annual Income Range',   emoji: '💰', description: 'e.g. ₹2–5L, ₹5–10L, ₹10L+…' },
  { key: 'how_did_you_hear',name: 'How Did You Hear?',     emoji: '📣', description: 'Google, Friend, Social Media…' },
]

/* ── Inline edit input ── */
function EditInput({
  value, onSave, onCancel
}: {
  value: string; onSave: (v: string) => void; onCancel: () => void
}) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(val)
          if (e.key === 'Escape') onCancel()
        }}
        style={{
          background: 'var(--a-bg)',
          border: '1px solid rgba(245,158,11,0.5)',
          borderRadius: 7,
          padding: '4px 10px',
          fontFamily: 'var(--a-sans)',
          fontSize: 13,
          color: 'var(--a-t1)',
          outline: 'none',
          flex: 1,
        }}
      />
      <button className="act-btn" title="Save" onClick={() => onSave(val)}>
        <Check size={12} style={{ color: 'var(--a-green)' }} />
      </button>
      <button className="act-btn" title="Cancel" onClick={onCancel}>
        <X size={12} />
      </button>
    </div>
  )
}

/* ── Add Value Row ── */
function AddValueRow({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(245,158,11,0.06)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: '12px 16px',
      animation: 'rowIn .3s ease',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--a-gold-dim)', border: '1px dashed rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={12} color="var(--a-gold)" />
      </div>
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) onAdd(name.trim())
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Enter value name…"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--a-sans)',
          fontSize: 13,
          color: 'var(--a-t1)',
        }}
      />
      <button
        style={{
          padding: '5px 12px',
          borderRadius: 7,
          background: 'var(--a-gold)',
          border: 'none',
          color: '#000',
          fontFamily: 'var(--a-sans)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          opacity: name.trim() ? 1 : 0.5,
        }}
        onClick={() => name.trim() && onAdd(name.trim())}
      >
        Add
      </button>
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-t3)' }}
        onClick={onCancel}
      >
        <X size={14} />
      </button>
    </div>
  )
}

/* ── Main Component ── */
export default function AdminDropdownPage() {
  const [activeKey, setActiveKey]       = useState('board')
  const [values, setValues]             = useState<DropdownValue[]>([])
  const [loading, setLoading]           = useState(false)
  const [catSearch, setCatSearch]       = useState('')
  const [valSearch, setValSearch]       = useState('')
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [addingNew, setAddingNew]       = useState(false)
  const [toast, setToast]               = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [seeding, setSeeding]           = useState(false)

  const activeCategory = CATEGORIES.find((c) => c.key === activeKey)!

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchValues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings/dropdown?category=${activeKey}&includeInactive=true`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const opts = data.options || []
      setValues(opts.map((o: any) => ({
        id: o.id,
        name: o.label,
        slug: o.value,
        active: o.isActive ?? true,
        sortOrder: o.sortOrder,
      })))
    } catch {
      setValues([])
    } finally {
      setLoading(false)
    }
  }, [activeKey])

  useEffect(() => {
    setValSearch('')
    setEditingId(null)
    setAddingNew(false)
    fetchValues()
  }, [activeKey, fetchValues])

  const handleToggle = async (id: string, current: boolean) => {
    setValues((prev) => prev.map((v) => v.id === id ? { ...v, active: !current } : v))
    try {
      await fetch(`/api/settings/dropdown?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      })
      showToast(`Value ${!current ? 'activated' : 'deactivated'}`)
    } catch {
      setValues((prev) => prev.map((v) => v.id === id ? { ...v, active: current } : v))
      showToast('Failed to update', 'error')
    }
  }

  const handleEdit = async (id: string, name: string) => {
    if (!name.trim()) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')
    setValues((prev) => prev.map((v) => v.id === id ? { ...v, name, slug } : v))
    setEditingId(null)
    try {
      await fetch(`/api/settings/dropdown?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: name }),
      })
      showToast('Value updated')
    } catch {
      showToast('Failed to save', 'error')
      fetchValues()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dropdown value? This cannot be undone.')) return
    setValues((prev) => prev.filter((v) => v.id !== id))
    try {
      await fetch(`/api/settings/dropdown?id=${id}`, { method: 'DELETE' })
      showToast('Value deleted')
    } catch {
      showToast('Failed to delete', 'error')
      fetchValues()
    }
  }

  const handleAdd = async (name: string) => {
    setAddingNew(false)
    const tempId = `temp-${Date.now()}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '') 
    const optimistic: DropdownValue = { id: tempId, name, slug, active: true, sortOrder: values.length + 1 }
    setValues((prev) => [...prev, optimistic])
    try {
      const res = await fetch(`/api/settings/dropdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeKey, label: name, value: slug }),
      })
      const data = await res.json()
      const added = data.option || data.value
      if (added) {
        setValues((prev) => prev.map((v) => v.id === tempId ? {
          id: added.id, name: added.label, slug: added.value,
          active: added.isActive ?? true, sortOrder: added.sortOrder
        } : v))
      } else {
        fetchValues()
      }
      showToast('Value added')
    } catch {
      setValues((prev) => prev.filter((v) => v.id !== tempId))
      showToast('Failed to add', 'error')
    }
  }

  const handleSeedDefaults = async () => {
    if (!confirm('This will seed default values for all categories. Existing values will not be overwritten. Continue?')) return
    setSeeding(true)
    try {
      await fetch('/api/settings/dropdown/seed', { method: 'POST' })
      showToast('Default values seeded successfully')
      fetchValues()
    } catch {
      showToast('Seeding failed', 'error')
    } finally {
      setSeeding(false)
    }
  }

  const filtered = values.filter((v) =>
    v.name.toLowerCase().includes(valSearch.toLowerCase())
  )

  const activeCount   = values.filter((v) => v.active).length
  const inactiveCount = values.filter((v) => !v.active).length

  const filteredCats = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )

  return (
    <AdminLayout pageClass="admin-page-settings" title="Dropdown Settings" subtitle="Single source of truth — all dropdown values across the platform">

      {/* Alert banner */}
      <div className="admin-alert gold">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={18} color="var(--a-gold)" style={{ flexShrink: 0 }} />
          <div className="admin-alert-text">
            <div className="alert-title">Changes reflect across all dropdowns, forms, and search filters</div>
            <div className="alert-sub">Deactivating a value hides it from new forms but does not affect existing records</div>
          </div>
        </div>
        <button
          className="export-btn"
          onClick={handleSeedDefaults}
          style={{ flexShrink: 0 }}
          disabled={seeding}
        >
          <RotateCcw size={13} style={{ animation: seeding ? 'spin 1s linear infinite' : 'none' }} />
          {seeding ? 'Seeding…' : 'Seed Default Values'}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="dropdown-layout">

        {/* Category list */}
        <div className="cat-list-card">
          <div className="cat-search-wrap">
            <input
              className="cat-search-input"
              placeholder="Search categories…"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredCats.map((cat) => (
              <div
                key={cat.key}
                className={`cat-item${activeKey === cat.key ? ' active' : ''}`}
                onClick={() => setActiveKey(cat.key)}
              >
                <div className="cat-emoji">{cat.emoji}</div>
                <div>
                  <div className="cat-name">{cat.name}</div>
                  <div className="cat-sub">{cat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values panel */}
        <div className="values-panel">
          {/* Header */}
          <div className="values-panel-header">
            <div>
              <div className="panel-title">
                {activeCategory.emoji} {activeCategory.name}
              </div>
              <div className="panel-slug-line">
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{activeCategory.key}</span>
                &nbsp;·&nbsp;
                {activeCategory.description}
              </div>
            </div>
            <button className="add-value-btn" onClick={() => setAddingNew(true)}>
              <Plus size={13} />
              Add Value
            </button>
          </div>

          {/* Stats */}
          <div className="value-stats-row">
            <div className="value-stat-box">
              <div className="val-stat-num">{values.length}</div>
              <div className="val-stat-label">Total</div>
            </div>
            <div className="value-stat-box">
              <div className="val-stat-num green">{activeCount}</div>
              <div className="val-stat-label">Active</div>
            </div>
            <div className="value-stat-box">
              <div className="val-stat-num red">{inactiveCount}</div>
              <div className="val-stat-label">Inactive</div>
            </div>
          </div>

          {/* Search within values */}
          {values.length > 6 && (
            <div className="toolbar-search" style={{ margin: '0' }}>
              <Search size={13} color="rgba(255,255,255,0.3)" />
              <input
                value={valSearch}
                onChange={(e) => setValSearch(e.target.value)}
                placeholder={`Search in ${activeCategory.name.toLowerCase()}…`}
              />
            </div>
          )}

          {/* Add new row */}
          {addingNew && (
            <AddValueRow
              onAdd={handleAdd}
              onCancel={() => setAddingNew(false)}
            />
          )}

          {/* Values list */}
          <div className="values-list">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 52,
                    borderRadius: 10,
                    background: 'var(--a-card2)',
                    border: '1px solid var(--a-border)',
                    opacity: 0.6 - i * 0.08,
                  }}
                />
              ))
            ) : filtered.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 0' }}>
                <div className="empty-icon-wrap">
                  <AlertCircle size={22} color="rgba(255,255,255,0.3)" />
                </div>
                <div className="empty-title">No values found</div>
                <div className="empty-sub">
                  {valSearch ? 'Try a different search term' : 'Click "Add Value" to create the first entry'}
                </div>
              </div>
            ) : (
              filtered.map((val, i) => (
                <div
                  key={val.id}
                  className="value-item"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="value-rank">{val.sortOrder ?? i + 1}</div>

                  <div className="value-name-wrap">
                    {editingId === val.id ? (
                      <EditInput
                        value={val.name}
                        onSave={(v) => handleEdit(val.id, v)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <div className="value-main-name">{val.name}</div>
                        <div className="value-slug">{val.slug}</div>
                      </>
                    )}
                  </div>

                  <button
                    className={`val-toggle${val.active ? '' : ' inactive'}`}
                    onClick={() => handleToggle(val.id, val.active)}
                    title={val.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                    aria-label={val.active ? 'Deactivate' : 'Activate'}
                  />

                  <button
                    className="val-action-btn"
                    title="Edit"
                    onClick={() => setEditingId(editingId === val.id ? null : val.id)}
                  >
                    <Pencil size={12} />
                  </button>

                  <button
                    className="val-action-btn delete"
                    title="Delete"
                    onClick={() => handleDelete(val.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 12,
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.type === 'success' ? '#34D399' : '#F87171',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 999,
            animation: 'slideUp .3s ease',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.type === 'success' ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </AdminLayout>
  )
}
