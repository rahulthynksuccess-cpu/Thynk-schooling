'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Plus, Trash2, Save, GripVertical, Edit3, X, Check,
  ExternalLink, Monitor, Smartphone, ArrowRight, Globe,
  Navigation, AlignJustify, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Types ─────────────────────────────────────────────────────────── */
interface NavItem {
  id: string
  label: string
  href: string
  location: 'navbar'
  openNewTab?: boolean
}

interface FooterLink {
  id: string
  label: string
  href: string
  openNewTab?: boolean
}

interface FooterColumn {
  id: string
  heading: string
  links: FooterLink[]
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const S = {
  card: { background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, overflow: 'hidden' as const, color: '#0D1117' },
  inp: { padding: '9px 12px', background: '#FAF7F2', border: '1.5px solid #EDE5D8', borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#0D1117', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  lbl: { fontSize: 10, fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#718096', fontFamily: 'Inter,sans-serif', display: 'block' as const, marginBottom: 4 },
}

/* ── Inline editable field ───────────────────────────────────────────── */
function InlineEdit({ value, onChange, placeholder, mono = false }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => { onChange(draft.trim() || value); setEditing(false) }

  if (editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        style={{ ...S.inp, fontFamily: mono ? 'monospace' : 'Inter,sans-serif', fontSize: mono ? 12 : 13, padding: '5px 8px' }} />
      <button onClick={commit} style={{ padding: 5, background: '#E8F5E8', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#1A5C1A' }}><Check style={{ width: 12, height: 12 }} /></button>
      <button onClick={() => setEditing(false)} style={{ padding: 5, background: '#FEF2F2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#DC2626' }}><X style={{ width: 12, height: 12 }} /></button>
    </div>
  )

  return (
    <span onClick={() => { setDraft(value); setEditing(true) }}
      style={{ cursor: 'text', fontFamily: mono ? 'monospace' : 'Inter,sans-serif', fontSize: mono ? 12 : 13, color: mono ? '#4A5568' : '#0D1117', flex: 1,
        borderBottom: '1px dashed #EDE5D8', paddingBottom: 1 }}>
      {value || <span style={{ color: '#A0ADB8' }}>{placeholder}</span>}
    </span>
  )
}

/* ── Navbar Item Row ─────────────────────────────────────────────────── */
function NavRow({ item, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }:
  { item: NavItem; onUpdate: (id: string, f: Partial<NavItem>) => void; onDelete: (id: string) => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const [del, setDel] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(13,17,23,0.05)', background: '#fff' }}>
      {/* drag handle */}
      <GripVertical style={{ width: 14, height: 14, color: '#D4D4D4', flexShrink: 0, cursor: 'grab' }} />

      {/* move up/down */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.6 }}>
          <ChevronUp style={{ width: 10, height: 10 }} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.6 }}>
          <ChevronDown style={{ width: 10, height: 10 }} />
        </button>
      </div>

      {/* label */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Navigation style={{ width: 12, height: 12, color: '#B8860B', flexShrink: 0 }} />
        <InlineEdit value={item.label} onChange={v => onUpdate(item.id, { label: v })} placeholder="Menu label" />
      </div>

      {/* href */}
      <div style={{ width: 200, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowRight style={{ width: 11, height: 11, color: '#A0ADB8', flexShrink: 0 }} />
        <InlineEdit value={item.href} onChange={v => onUpdate(item.id, { href: v })} placeholder="/path" mono />
      </div>

      {/* new tab toggle */}
      <button onClick={() => onUpdate(item.id, { openNewTab: !item.openNewTab })}
        title={item.openNewTab ? 'Opens in new tab' : 'Opens in same tab'}
        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${item.openNewTab ? '#B8860B' : '#EDE5D8'}`,
          background: item.openNewTab ? 'rgba(184,134,11,0.08)' : 'transparent', cursor: 'pointer',
          color: item.openNewTab ? '#B8860B' : '#A0ADB8', fontSize: 10, fontWeight: 600, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
        <ExternalLink style={{ width: 10, height: 10 }} />
        {item.openNewTab ? 'New Tab' : 'Same'}
      </button>

      {/* delete */}
      {del ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onDelete(item.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Delete</button>
          <button onClick={() => setDel(false)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #EDE5D8', background: '#fff', color: '#718096', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setDel(true)} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      )}
    </div>
  )
}

/* ── Footer Link Row ─────────────────────────────────────────────────── */
function FooterLinkRow({ link, colId, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }:
  { link: FooterLink; colId: string; onUpdate: (colId: string, linkId: string, f: Partial<FooterLink>) => void; onDelete: (colId: string, linkId: string) => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const [del, setDel] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(13,17,23,0.04)', background: '#fff' }}>
      <GripVertical style={{ width: 12, height: 12, color: '#D4D4D4', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ padding: '1px 2px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.5 }}><ChevronUp style={{ width: 9, height: 9 }} /></button>
        <button onClick={onMoveDown} disabled={isLast} style={{ padding: '1px 2px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.5 }}><ChevronDown style={{ width: 9, height: 9 }} /></button>
      </div>
      <div style={{ flex: 1 }}>
        <InlineEdit value={link.label} onChange={v => onUpdate(colId, link.id, { label: v })} placeholder="Link label" />
      </div>
      <div style={{ width: 180 }}>
        <InlineEdit value={link.href} onChange={v => onUpdate(colId, link.id, { href: v })} placeholder="/path" mono />
      </div>
      <button onClick={() => onUpdate(colId, link.id, { openNewTab: !link.openNewTab })}
        style={{ padding: '3px 7px', borderRadius: 5, border: `1px solid ${link.openNewTab ? '#B8860B' : '#EDE5D8'}`,
          background: link.openNewTab ? 'rgba(184,134,11,0.06)' : 'transparent', cursor: 'pointer',
          color: link.openNewTab ? '#B8860B' : '#A0ADB8', fontSize: 10, fontFamily: 'Inter,sans-serif' }}>
        <ExternalLink style={{ width: 9, height: 9 }} />
      </button>
      {del ? (
        <div style={{ display: 'flex', gap: 3 }}>
          <button onClick={() => onDelete(colId, link.id)} style={{ padding: '3px 7px', borderRadius: 5, border: 'none', background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Del</button>
          <button onClick={() => setDel(false)} style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid #EDE5D8', background: '#fff', color: '#718096', fontSize: 10, cursor: 'pointer' }}>No</button>
        </div>
      ) : (
        <button onClick={() => setDel(true)} style={{ padding: '4px 5px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
          <Trash2 style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                             */
/* ══════════════════════════════════════════════════════════════════════ */
export default function AdminMenuPage() {
  const [tab, setTab] = useState<'navbar' | 'footer'>('navbar')
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [footerCols, setFooterCols] = useState<FooterColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=menus')
      const data = await res.json()

      // Navbar items
      const nav: NavItem[] = (data.navbar || []).map((item: any) => ({
        id: item.id || uid(),
        label: item.label || '',
        href: item.href || '/',
        location: 'navbar',
        openNewTab: item.openNewTab || false,
      }))
      setNavItems(nav)

      // Footer columns — data.footer is { heading: [{label,href}] } or [{id,heading,links}]
      let cols: FooterColumn[] = []
      if (Array.isArray(data.footer)) {
        cols = data.footer.map((col: any) => ({
          id: col.id || uid(),
          heading: col.heading || '',
          links: (col.links || []).map((l: any) => ({ id: l.id || uid(), label: l.label || '', href: l.href || '/', openNewTab: l.openNewTab || false })),
        }))
      } else if (data.footer && typeof data.footer === 'object') {
        cols = Object.entries(data.footer).map(([heading, links]) => ({
          id: uid(),
          heading,
          links: (links as any[]).map(l => ({ id: uid(), label: l[0] || l.label || '', href: l[1] || l.href || '/', openNewTab: false })),
        }))
      }
      setFooterCols(cols)
    } catch {
      toast.error('Failed to load menus')
    }
    setLoading(false)
    setDirty(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Save ── */
  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin?action=menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navbar: navItems, footer: footerCols }),
      })
      toast.success('Menus saved! Changes are live.')
      setDirty(false)
    } catch {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  /* ── Navbar helpers ── */
  const markDirty = () => setDirty(true)

  const updateNavItem = (id: string, fields: Partial<NavItem>) => {
    setNavItems(p => p.map(it => it.id === id ? { ...it, ...fields } : it))
    markDirty()
  }

  const deleteNavItem = (id: string) => {
    setNavItems(p => p.filter(it => it.id !== id))
    markDirty()
  }

  const addNavItem = () => {
    setNavItems(p => [...p, { id: uid(), label: 'New Link', href: '/', location: 'navbar', openNewTab: false }])
    markDirty()
  }

  const moveNav = (idx: number, dir: -1 | 1) => {
    setNavItems(p => {
      const arr = [...p]
      const swp = idx + dir
      if (swp < 0 || swp >= arr.length) return arr
      ;[arr[idx], arr[swp]] = [arr[swp], arr[idx]]
      return arr
    })
    markDirty()
  }

  /* ── Footer helpers ── */
  const updateFooterLink = (colId: string, linkId: string, fields: Partial<FooterLink>) => {
    setFooterCols(p => p.map(col => col.id === colId
      ? { ...col, links: col.links.map(l => l.id === linkId ? { ...l, ...fields } : l) }
      : col
    ))
    markDirty()
  }

  const deleteFooterLink = (colId: string, linkId: string) => {
    setFooterCols(p => p.map(col => col.id === colId
      ? { ...col, links: col.links.filter(l => l.id !== linkId) }
      : col
    ))
    markDirty()
  }

  const addFooterLink = (colId: string) => {
    setFooterCols(p => p.map(col => col.id === colId
      ? { ...col, links: [...col.links, { id: uid(), label: 'New Link', href: '/', openNewTab: false }] }
      : col
    ))
    markDirty()
  }

  const moveFooterLink = (colId: string, idx: number, dir: -1 | 1) => {
    setFooterCols(p => p.map(col => {
      if (col.id !== colId) return col
      const arr = [...col.links]; const swp = idx + dir
      if (swp < 0 || swp >= arr.length) return col
      ;[arr[idx], arr[swp]] = [arr[swp], arr[idx]]
      return { ...col, links: arr }
    }))
    markDirty()
  }

  const updateColHeading = (colId: string, heading: string) => {
    setFooterCols(p => p.map(col => col.id === colId ? { ...col, heading } : col))
    markDirty()
  }

  const addFooterCol = () => {
    setFooterCols(p => [...p, { id: uid(), heading: 'New Column', links: [] }])
    markDirty()
  }

  const deleteFooterCol = (colId: string) => {
    setFooterCols(p => p.filter(col => col.id !== colId))
    markDirty()
  }

  const moveFooterCol = (idx: number, dir: -1 | 1) => {
    setFooterCols(p => {
      const arr = [...p]; const swp = idx + dir
      if (swp < 0 || swp >= arr.length) return arr
      ;[arr[idx], arr[swp]] = [arr[swp], arr[idx]]
      return arr
    })
    markDirty()
  }

  /* ── Render ── */
  return (
    <AdminLayout pageClass="admin-page-settings" title="Menu Manager" subtitle="Control navbar links and footer columns — changes go live instantly">

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#718096', fontFamily: 'Inter,sans-serif' }}>
          {dirty ? '⚠ Unsaved changes — click Save to apply to the live site' : 'Click any label or URL to edit it inline. Use arrows to reorder.'}
        </div>
        <button onClick={save} disabled={saving || !dirty}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9,
            background: dirty ? '#B8860B' : '#f3f4f6', border: 'none',
            color: dirty ? '#fff' : '#9ca3af', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', opacity: saving ? 0.6 : 1 }}>
          {saving ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save style={{ width: 13, height: 13 }} />Save Changes</>}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(13,17,23,0.04)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { key: 'navbar', icon: Monitor, label: 'Navbar Menu' },
          { key: 'footer', icon: AlignJustify, label: 'Footer Links' },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: 'none',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#0D1117' : '#718096',
              fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: tab === key ? 700 : 400,
              cursor: 'pointer', boxShadow: tab === key ? '0 1px 4px rgba(13,17,23,0.1)' : 'none' }}>
            <Icon style={{ width: 14, height: 14 }} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>Loading menus...</div>
      ) : tab === 'navbar' ? (

        /* ── NAVBAR TAB ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ ...S.card }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', background: '#FAFAFA' }}>
                <div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>Navigation Links</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8', marginTop: 2 }}>Displayed in the top navbar across all pages</div>
                </div>
                <button onClick={addNavItem}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none',
                    background: '#FEF7E0', color: '#B8860B', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
                  <Plus style={{ width: 12, height: 12 }} />Add Link
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', background: '#F8F8F8', borderBottom: '1px solid rgba(13,17,23,0.05)' }}>
                <div style={{ width: 14 + 8 + 28 }} />
                <div style={{ flex: 1, ...S.lbl, marginBottom: 0 }}>Label (click to edit)</div>
                <div style={{ width: 200, ...S.lbl, marginBottom: 0 }}>URL / Path</div>
                <div style={{ width: 70, ...S.lbl, marginBottom: 0 }}>Tab</div>
                <div style={{ width: 80, ...S.lbl, marginBottom: 0 }}>Actions</div>
              </div>

              {navItems.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                  No nav items. <button onClick={addNavItem} style={{ background: 'none', border: 'none', color: '#B8860B', cursor: 'pointer', fontWeight: 700 }}>Add one</button>
                </div>
              ) : navItems.map((item, i) => (
                <NavRow key={item.id} item={item}
                  onUpdate={updateNavItem} onDelete={deleteNavItem}
                  onMoveUp={() => moveNav(i, -1)} onMoveDown={() => moveNav(i, 1)}
                  isFirst={i === 0} isLast={i === navItems.length - 1} />
              ))}
            </div>
          </div>

          {/* Preview panel */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ ...S.card }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8' }}>
                Live Preview
              </div>
              {/* Navbar mockup */}
              <div style={{ padding: 16 }}>
                <div style={{ background: 'rgba(250,247,242,0.97)', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 32 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 15, color: '#0D1117' }}>Thynk<em style={{ color: '#B8860B' }}>Schooling</em></span>
                  <div style={{ display: 'flex', gap: 20, flex: 1 }}>
                    {navItems.map(item => (
                      <span key={item.id} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#4A5568', fontWeight: 400 }}>{item.label}</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8', marginTop: 10, textAlign: 'center' }}>
                  {navItems.length} item{navItems.length !== 1 ? 's' : ''} in navbar
                </p>
              </div>
            </div>

            <div style={{ ...S.card, marginTop: 14 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8' }}>
                Tips
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✏️', tip: 'Click any label or URL to edit it inline' },
                  { icon: '↕️', tip: 'Use the arrows to reorder items' },
                  { icon: '🔗', tip: 'Use /path for internal pages, https:// for external' },
                  { icon: '↗️', tip: 'Toggle "New Tab" for external links' },
                  { icon: '💾', tip: 'Click Save Changes when done — goes live instantly' },
                ].map(({ icon, tip }) => (
                  <div key={tip} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* ── FOOTER TAB ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {footerCols.map((col, colIdx) => (
              <div key={col.id} style={{ ...S.card }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', background: '#FAFAFA' }}>
                  <GripVertical style={{ width: 13, height: 13, color: '#D4D4D4' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <button onClick={() => moveFooterCol(colIdx, -1)} disabled={colIdx === 0} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: colIdx === 0 ? 'default' : 'pointer', opacity: colIdx === 0 ? 0.2 : 0.6 }}><ChevronUp style={{ width: 10, height: 10 }} /></button>
                    <button onClick={() => moveFooterCol(colIdx, 1)} disabled={colIdx === footerCols.length - 1} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: colIdx === footerCols.length - 1 ? 'default' : 'pointer', opacity: colIdx === footerCols.length - 1 ? 0.2 : 0.6 }}><ChevronDown style={{ width: 10, height: 10 }} /></button>
                  </div>
                  <AlignJustify style={{ width: 13, height: 13, color: '#B8860B', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <InlineEdit value={col.heading} onChange={v => updateColHeading(col.id, v)} placeholder="Column heading" />
                  </div>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>{col.links.length} links</span>
                  <button onClick={() => addFooterLink(col.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#FEF7E0', color: '#B8860B', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
                    <Plus style={{ width: 10, height: 10 }} />Add
                  </button>
                  <button onClick={() => deleteFooterCol(col.id)}
                    style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                </div>

                {/* Column links */}
                {col.links.length === 0 ? (
                  <div style={{ padding: '16px 16px', textAlign: 'center', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: 12 }}>
                    No links. <button onClick={() => addFooterLink(col.id)} style={{ background: 'none', border: 'none', color: '#B8860B', cursor: 'pointer', fontWeight: 700 }}>Add one</button>
                  </div>
                ) : col.links.map((link, linkIdx) => (
                  <FooterLinkRow key={link.id} link={link} colId={col.id}
                    onUpdate={updateFooterLink} onDelete={deleteFooterLink}
                    onMoveUp={() => moveFooterLink(col.id, linkIdx, -1)}
                    onMoveDown={() => moveFooterLink(col.id, linkIdx, 1)}
                    isFirst={linkIdx === 0} isLast={linkIdx === col.links.length - 1} />
                ))}
              </div>
            ))}

            {/* Add column */}
            <button onClick={addFooterCol}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12,
                border: '2px dashed #EDE5D8', background: 'transparent', cursor: 'pointer', color: '#B8860B',
                fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, width: '100%' }}>
              <Plus style={{ width: 14, height: 14 }} />Add Footer Column
            </button>
          </div>

          {/* Footer tips panel */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8' }}>
                Footer Preview
              </div>
              <div style={{ padding: 16, background: '#0D1117', borderRadius: '0 0 12px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(footerCols.length, 2)}, 1fr)`, gap: 16 }}>
                  {footerCols.slice(0, 4).map(col => (
                    <div key={col.id}>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#B8860B', marginBottom: 8 }}>{col.heading}</div>
                      {col.links.slice(0, 4).map(link => (
                        <div key={link.id} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,247,242,0.4)', marginBottom: 5 }}>{link.label}</div>
                      ))}
                      {col.links.length > 4 && <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: 'rgba(184,134,11,0.5)' }}>+{col.links.length - 4} more</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...S.card }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8' }}>
                Tips
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✏️', tip: 'Click any heading or link label to rename' },
                  { icon: '↕️', tip: 'Arrows reorder both columns and links within them' },
                  { icon: '➕', tip: 'Add Column to create a new footer section' },
                  { icon: '🗑️', tip: 'Delete columns or individual links anytime' },
                  { icon: '💾', tip: 'Save once when done — all columns save together' },
                ].map(({ icon, tip }) => (
                  <div key={tip} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  )
}
