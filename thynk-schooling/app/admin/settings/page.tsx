'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  GraduationCap, Save, X, Loader2, Search, ToggleLeft, ToggleRight,
  DollarSign, Package, BarChart3, Users, School, LogOut, Menu
} from 'lucide-react'
import { clsx } from 'clsx'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { DropdownOption, LeadPackage } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

// ── Dropdown categories (driven by API — shown here as navigation labels only) ──
const DROPDOWN_CATEGORIES = [
  { key: 'board',              label: 'Board',              icon: '📚' },
  { key: 'school_type',        label: 'School Type',        icon: '🏫' },
  { key: 'gender_policy',      label: 'Gender Policy',      icon: '⚧️' },
  { key: 'medium',             label: 'Medium',             icon: '🗣️' },
  { key: 'class_level',        label: 'Class Level',        icon: '🎓' },
  { key: 'academic_year',      label: 'Academic Year',      icon: '📅' },
  { key: 'city',               label: 'City',               icon: '🏙️' },
  { key: 'state',              label: 'State',              icon: '🗺️' },
  { key: 'religion',           label: 'Religion',           icon: '🕌' },
  { key: 'recognition',        label: 'Recognition',        icon: '🏅' },
  { key: 'blood_group',        label: 'Blood Group',        icon: '🩸' },
  { key: 'gender',             label: 'Gender',             icon: '👤' },
  { key: 'occupation',         label: 'Occupation',         icon: '💼' },
  { key: 'income_range',       label: 'Income Range',       icon: '💰' },
  { key: 'lead_status',        label: 'Lead Status',        icon: '📊' },
  { key: 'application_status', label: 'Application Status', icon: '✅' },
  { key: 'source',             label: 'Lead Source',        icon: '📡' },
  { key: 'how_did_you_hear',   label: 'How Did You Hear',   icon: '👂' },
]

const ADMIN_NAV = [
  { icon: BarChart3,  label: 'Overview',         href: '/admin' },
  { icon: Settings,   label: 'Dropdown Settings',href: '/admin/settings' },
  { icon: DollarSign, label: 'Lead Pricing',      href: '/admin/lead-pricing' },
  { icon: Package,    label: 'Lead Packages',     href: '/admin/packages' },
  { icon: School,     label: 'Schools',           href: '/admin/schools' },
  { icon: Users,      label: 'Users',             href: '/admin/users' },
]

// ── Option Form Modal ──────────────────────────────────────────
function OptionModal({
  category, option, onClose, onSave,
}: {
  category: string
  option?: DropdownOption
  onClose: () => void
  onSave: (data: Partial<DropdownOption>) => void
}) {
  const [label,      setLabel]      = useState(option?.label      || '')
  const [value,      setValue]      = useState(option?.value      || '')
  const [sortOrder,  setSortOrder]  = useState(option?.sortOrder  ?? 0)
  const [parentVal,  setParentVal]  = useState(option?.parentValue || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !value.trim()) { toast.error('Label and value are required.'); return }
    onSave({ label, value, sortOrder, parentValue: parentVal || undefined, category })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative card w-full max-w-md p-6 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">
            {option ? 'Edit Option' : 'Add New Option'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
            <X className="w-4 h-4 text-navy-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <input value={category} readOnly className="input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Display Label <span className="text-orange-400">*</span></label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Central Board of Secondary Education"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Stored Value / Slug <span className="text-orange-400">*</span></label>
            <input
              value={value}
              onChange={e => setValue(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g. cbse"
              className="input font-mono text-sm"
              required
            />
            <p className="text-navy-500 text-xs mt-1">Lowercase, underscores only. This is stored in the database.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="label">Parent Value <span className="text-navy-500 text-xs font-normal">(optional)</span></label>
              <input
                value={parentVal}
                onChange={e => setParentVal(e.target.value)}
                placeholder="e.g. maharashtra"
                className="input text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save className="w-4 h-4" /> {option ? 'Save Changes' : 'Add Option'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Category Options List ──────────────────────────────────────
function CategoryOptions({ categoryKey }: { categoryKey: string }) {
  const queryClient = useQueryClient()
  const [search,      setSearch]      = useState('')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editOption,  setEditOption]  = useState<DropdownOption | undefined>()

  const { data: options, isLoading } = useQuery<DropdownOption[]>({
    queryKey: ['dropdown-options', categoryKey],
    queryFn:  () => apiGet(`/settings/dropdown?category=${categoryKey}&includeInactive=true`),
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dropdown-options', categoryKey] })
    queryClient.invalidateQueries({ queryKey: ['dropdown', categoryKey] }) // bust user-facing cache too
  }

  const addMutation = useMutation({
    mutationFn: (data: Partial<DropdownOption>) => apiPost('/settings/dropdown', data),
    onSuccess: () => { toast.success('Option added!'); setModalOpen(false); invalidate() },
    onError:   () => toast.error('Failed to add option.'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DropdownOption> }) => apiPut(`/settings/dropdown/${id}`, data),
    onSuccess: () => { toast.success('Option updated!'); setEditOption(undefined); setModalOpen(false); invalidate() },
    onError:   () => toast.error('Failed to update option.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/settings/dropdown/${id}`, { isActive }),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/settings/dropdown/${id}`),
    onSuccess: () => { toast.success('Option removed.'); invalidate() },
    onError:   () => toast.error('Cannot delete — option may be in use.'),
  })

  const handleSave = (data: Partial<DropdownOption>) => {
    if (editOption) {
      editMutation.mutate({ id: editOption.id, data })
    } else {
      addMutation.mutate(data)
    }
  }

  const filtered = (options ?? []).filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3 flex-1 input">
          <Search className="w-4 h-4 text-navy-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={`Search in ${categoryKey}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent flex-1 focus:outline-none text-white placeholder-navy-400 text-sm"
          />
        </div>
        <button
          onClick={() => { setEditOption(undefined); setModalOpen(true) }}
          className="btn-primary text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Option
        </button>
      </div>

      {/* Count */}
      <p className="text-navy-400 text-xs mb-4 font-display">
        {filtered.length} option{filtered.length !== 1 ? 's' : ''} 
        {!isLoading && options && ` · ${options.filter(o => o.isActive).length} active`}
      </p>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-10 h-10 text-navy-600 mx-auto mb-3" />
          <p className="text-navy-400">No options found. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((opt) => (
            <motion.div
              key={opt.id}
              layout
              className={clsx(
                'flex items-center gap-4 p-3.5 rounded-xl border transition-all',
                opt.isActive
                  ? 'bg-navy-800 border-surface-border'
                  : 'bg-navy-900 border-surface-border opacity-50'
              )}
            >
              {/* Sort handle */}
              <span className="text-navy-600 text-xs font-mono w-6 text-center flex-shrink-0">{opt.sortOrder}</span>

              {/* Label + value */}
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-white text-sm">{opt.label}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-navy-400 text-xs font-mono">{opt.value}</code>
                  {opt.parentValue && (
                    <span className="badge-gray text-[10px]">parent: {opt.parentValue}</span>
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleMutation.mutate({ id: opt.id, isActive: !opt.isActive })}
                className={clsx('transition-colors', opt.isActive ? 'text-green-400' : 'text-navy-600')}
                title={opt.isActive ? 'Deactivate' : 'Activate'}
              >
                {opt.isActive
                  ? <ToggleRight className="w-6 h-6" />
                  : <ToggleLeft  className="w-6 h-6" />
                }
              </button>

              {/* Edit */}
              <button
                onClick={() => { setEditOption(opt); setModalOpen(true) }}
                className="p-2 rounded-lg hover:bg-surface-hover text-navy-400 hover:text-white transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${opt.label}"? Existing records using this value will be unaffected.`)) {
                    deleteMutation.mutate(opt.id)
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-navy-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <OptionModal
            category={categoryKey}
            option={editOption}
            onClose={() => { setModalOpen(false); setEditOption(undefined) }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────
export default function AdminSettingsPage() {
  const { user, logout } = useAuthStore()
  const [activeCategory, setActiveCategory] = useState(DROPDOWN_CATEGORIES[0].key)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [catSearchQuery, setCatSearchQuery] = useState('')

  const filteredCats = DROPDOWN_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(catSearchQuery.toLowerCase())
  )

  const activeCatDef = DROPDOWN_CATEGORIES.find(c => c.key === activeCategory)

  const AdminNav = ({ onClose }: { onClose?: () => void }) => (
    <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col h-full">
      <div className="p-5 border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">Super Admin</span>
        </Link>
        {onClose && <button onClick={onClose}><X className="w-4 h-4 text-navy-400" /></button>}
      </div>
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center font-display font-bold text-red-400 text-sm">
            {(user?.fullName || 'A')[0]}
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">{user?.fullName || 'Admin'}</div>
            <span className="badge-orange text-[10px]">Super Admin</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {ADMIN_NAV.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-sm transition-all',
              href === '/admin/settings'
                ? 'bg-orange-500 text-white shadow-orange-sm'
                : 'text-navy-300 hover:text-white hover:bg-surface-hover'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-display font-semibold text-sm transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Desktop admin sidebar */}
      <div className="hidden lg:flex flex-col">
        <AdminNav />
      </div>

      {/* Mobile admin sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 flex flex-col"><AdminNav onClose={() => setSidebarOpen(false)} /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-surface-border bg-surface-card flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-navy-300" />
          </button>
          <div>
            <h1 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-400" /> Dropdown Settings
            </h1>
            <p className="text-navy-400 text-xs">
              Single source of truth — all dropdown values across the platform are managed here.
            </p>
          </div>
        </header>

        {/* Two-panel layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Category list panel */}
          <div className="w-64 border-r border-surface-border flex flex-col flex-shrink-0 overflow-hidden bg-surface-card/50">
            <div className="p-3 border-b border-surface-border">
              <div className="flex items-center gap-2 input py-2">
                <Search className="w-3.5 h-3.5 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={catSearchQuery}
                  onChange={e => setCatSearchQuery(e.target.value)}
                  className="bg-transparent flex-1 text-xs focus:outline-none text-white placeholder-navy-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filteredCats.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-display font-semibold',
                    activeCategory === cat.key
                      ? 'bg-orange-500 text-white'
                      : 'text-navy-300 hover:text-white hover:bg-surface-hover'
                  )}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="flex-1 truncate">{cat.label}</span>
                  {activeCategory === cat.key && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Options panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{activeCatDef?.icon}</span>
              <div>
                <h2 className="font-display font-bold text-white text-xl">{activeCatDef?.label}</h2>
                <p className="text-navy-400 text-xs font-mono">category: <span className="text-orange-400">{activeCategory}</span></p>
              </div>
            </div>

            <div className="p-3 mb-5 rounded-xl bg-orange-500/8 border border-orange-500/20 text-sm text-navy-200">
              ⚡ Changes here reflect across <strong className="text-white">all dropdowns, forms, and search filters</strong> within 5 minutes (React Query cache refresh).
              Deactivating a value hides it from new forms but does not affect existing records.
            </div>

            <CategoryOptions key={activeCategory} categoryKey={activeCategory} />
          </div>
        </div>
      </div>
    </div>
  )
}
