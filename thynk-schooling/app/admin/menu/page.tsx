'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Plus, Trash2, Save, GripVertical, X, Check,
  ExternalLink, AlignJustify, Loader2,
  ChevronDown, ChevronUp, Navigation, ArrowRight,
  ArrowLeftRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NavItem { id: string; label: string; href: string; openNewTab?: boolean }
interface FooterLink { id: string; label: string; href: string; openNewTab?: boolean }
interface FooterColumn { id: string; heading: string; links: FooterLink[] }

function uid() { return Math.random().toString(36).slice(2, 10) }

const S = {
  card: { background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, overflow: 'hidden' as const, color: '#0D1117' },
  inp: { padding: '9px 12px', background: '#FAF7F2', border: '1.5px solid #EDE5D8', borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#0D1117', outline: 'none', width: '100%', boxSizing: 'border-box' as const, colorScheme: 'light' as any },
  lbl: { fontSize: 10, fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#718096', fontFamily: 'Inter,sans-serif', display: 'block' as const, marginBottom: 4 },
}

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
      style={{ cursor: 'text', fontFamily: mono ? 'monospace' : 'Inter,sans-serif', fontSize: mono ? 12 : 13, color: mono ? '#4A5568' : '#0D1117', flex: 1, borderBottom: '1px dashed #EDE5D8', paddingBottom: 1, minWidth: 60 }}>
      {value || <span style={{ color: '#A0ADB8' }}>{placeholder}</span>}
    </span>
  )
}

function NavRow({ item, footerCols, onUpdate, onDelete, onMoveUp, onMoveDown, onMoveToFooter, isFirst, isLast }:
  { item: NavItem; footerCols: FooterColumn[]; onUpdate: (id: string, f: Partial<NavItem>) => void; onDelete: (id: string) => void; onMoveUp: () => void; onMoveDown: () => void; onMoveToFooter: (id: string, colId: string) => void; isFirst: boolean; isLast: boolean }) {
  const [del, setDel] = useState(false)
  const [moveMenu, setMoveMenu] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(13,17,23,0.05)', background: '#fff', position: 'relative' as const }}>
      <GripVertical style={{ width: 14, height: 14, color: '#D4D4D4', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.6 }}><ChevronUp style={{ width: 10, height: 10 }} /></button>
        <button onClick={onMoveDown} disabled={isLast} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.6 }}><ChevronDown style={{ width: 10, height: 10 }} /></button>
      </div>
      <Navigation style={{ width: 12, height: 12, color: '#B8860B', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineEdit value={item.label} onChange={v => onUpdate(item.id, { label: v })} placeholder="Label" />
      </div>
      <div style={{ width: 180, display: 'flex', alignItems: 'center', gap: 4 }}>
        <ArrowRight style={{ width: 11, height: 11, color: '#A0ADB8' }} />
        <InlineEdit value={item.href} onChange={v => onUpdate(item.id, { href: v })} placeholder="/path" mono />
      </div>
      <button onClick={() => onUpdate(item.id, { openNewTab: !item.openNewTab })}
        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${item.openNewTab ? '#B8860B' : '#EDE5D8'}`, background: item.openNewTab ? 'rgba(184,134,11,0.08)' : 'transparent', cursor: 'pointer', color: item.openNewTab ? '#B8860B' : '#A0ADB8', fontSize: 10, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
        <ExternalLink style={{ width: 9, height: 9 }} />{item.openNewTab ? 'New' : 'Same'}
      </button>
      {/* Move to Footer dropdown */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMoveMenu(!moveMenu)} title="Move to Footer"
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #EDE5D8', background: moveMenu ? '#FEF7E0' : '#fff', cursor: 'pointer', color: '#B8860B', fontSize: 10, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeftRight style={{ width: 10, height: 10 }} />Footer
        </button>
        {moveMenu && (
          <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid rgba(13,17,23,0.1)', borderRadius: 10, padding: '6px 4px', zIndex: 50, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8', padding: '4px 10px 6px' }}>Move to column</div>
            {footerCols.map(col => (
              <button key={col.id} onClick={() => { onMoveToFooter(item.id, col.id); setMoveMenu(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#0D1117', textAlign: 'left' as const, borderRadius: 7 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF7E0'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <AlignJustify style={{ width: 11, height: 11, color: '#B8860B' }} />{col.heading}
              </button>
            ))}
            {footerCols.length === 0 && <div style={{ padding: '6px 10px', fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>No footer columns yet</div>}
            <button onClick={() => setMoveMenu(false)} style={{ position: 'absolute', top: 4, right: 4, padding: 3, border: 'none', background: 'transparent', cursor: 'pointer', color: '#A0ADB8' }}><X style={{ width: 10, height: 10 }} /></button>
          </div>
        )}
      </div>
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

function FooterLinkRow({ link, colId, onUpdate, onDelete, onMoveUp, onMoveDown, onMoveToNav, isFirst, isLast }:
  { link: FooterLink; colId: string; onUpdate: (colId: string, linkId: string, f: Partial<FooterLink>) => void; onDelete: (colId: string, linkId: string) => void; onMoveUp: () => void; onMoveDown: () => void; onMoveToNav: (colId: string, linkId: string) => void; isFirst: boolean; isLast: boolean }) {
  const [del, setDel] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(13,17,23,0.04)', background: '#fff' }}>
      <GripVertical style={{ width: 12, height: 12, color: '#D4D4D4', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ padding: '1px 2px', border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.2 : 0.5 }}><ChevronUp style={{ width: 9, height: 9 }} /></button>
        <button onClick={onMoveDown} disabled={isLast} style={{ padding: '1px 2px', border: 'none', background: 'transparent', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.2 : 0.5 }}><ChevronDown style={{ width: 9, height: 9 }} /></button>
      </div>
      <div style={{ flex: 1 }}><InlineEdit value={link.label} onChange={v => onUpdate(colId, link.id, { label: v })} placeholder="Label" /></div>
      <div style={{ width: 160 }}><InlineEdit value={link.href} onChange={v => onUpdate(colId, link.id, { href: v })} placeholder="/path" mono /></div>
      <button onClick={() => onUpdate(colId, link.id, { openNewTab: !link.openNewTab })}
        style={{ padding: '3px 6px', borderRadius: 5, border: `1px solid ${link.openNewTab ? '#B8860B' : '#EDE5D8'}`, background: link.openNewTab ? 'rgba(184,134,11,0.06)' : 'transparent', cursor: 'pointer', color: link.openNewTab ? '#B8860B' : '#A0ADB8', fontSize: 9, fontFamily: 'Inter,sans-serif' }}>
        <ExternalLink style={{ width: 9, height: 9 }} />
      </button>
      {/* Move to Navbar */}
      <button onClick={() => onMoveToNav(colId, link.id)} title="Move to Navbar"
        style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid #EDE5D8', background: '#fff', cursor: 'pointer', color: '#B8860B', fontSize: 10, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
        <ArrowLeftRight style={{ width: 9, height: 9 }} />Nav
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

export default function AdminMenuPage() {
  const [tab, setTab] = useState<'navbar' | 'footer'>('navbar')
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [footerCols, setFooterCols] = useState<FooterColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=menus')
      const data = await res.json()
      setNavItems((data.navbar || []).map((item: any) => ({ id: item.id || uid(), label: item.label || '', href: item.href || '/', openNewTab: item.openNewTab || false })))
      let cols: FooterColumn[] = []
      if (Array.isArray(data.footer)) {
        cols = data.footer.map((col: any) => ({ id: col.id || uid(), heading: col.heading || '', links: (col.links || []).map((l: any) => ({ id: l.id || uid(), label: l.label || '', href: l.href || '/', openNewTab: l.openNewTab || false })) }))
      } else if (data.footer && typeof data.footer === 'object') {
        cols = Object.entries(data.footer).map(([heading, links]) => ({ id: uid(), heading, links: (links as any[]).map(l => ({ id: uid(), label: l[0] || l.label || '', href: l[1] || l.href || '/', openNewTab: false })) }))
      }
      setFooterCols(cols)
    } catch { toast.error('Failed to load menus') }
    setLoading(false); setDirty(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin?action=menus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ navbar: navItems, footer: footerCols }) })
      toast.success('Menus saved! Changes are live.'); setDirty(false)
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const D = () => setDirty(true)

  // Navbar
  const updateNav = (id: string, f: Partial<NavItem>) => { setNavItems(p => p.map(it => it.id === id ? { ...it, ...f } : it)); D() }
  const deleteNav = (id: string) => { setNavItems(p => p.filter(it => it.id !== id)); D() }
  const addNav = () => { setNavItems(p => [...p, { id: uid(), label: 'New Link', href: '/', openNewTab: false }]); D() }
  const moveNav = (idx: number, dir: -1 | 1) => { setNavItems(p => { const a = [...p], s = idx + dir; if (s < 0 || s >= a.length) return a; [a[idx], a[s]] = [a[s], a[idx]]; return a }); D() }

  // Move nav → footer
  const moveNavToFooter = (navId: string, colId: string) => {
    const item = navItems.find(it => it.id === navId); if (!item) return
    setNavItems(p => p.filter(it => it.id !== navId))
    setFooterCols(p => p.map(col => col.id === colId ? { ...col, links: [...col.links, { id: uid(), label: item.label, href: item.href, openNewTab: item.openNewTab }] } : col))
    D(); toast.success(`"${item.label}" moved to footer`)
  }

  // Footer
  const updateLink = (colId: string, linkId: string, f: Partial<FooterLink>) => { setFooterCols(p => p.map(col => col.id === colId ? { ...col, links: col.links.map(l => l.id === linkId ? { ...l, ...f } : l) } : col)); D() }
  const deleteLink = (colId: string, linkId: string) => { setFooterCols(p => p.map(col => col.id === colId ? { ...col, links: col.links.filter(l => l.id !== linkId) } : col)); D() }
  const addLink = (colId: string) => { setFooterCols(p => p.map(col => col.id === colId ? { ...col, links: [...col.links, { id: uid(), label: 'New Link', href: '/', openNewTab: false }] } : col)); D() }
  const moveLink = (colId: string, idx: number, dir: -1 | 1) => { setFooterCols(p => p.map(col => { if (col.id !== colId) return col; const a = [...col.links]; const s = idx + dir; if (s < 0 || s >= a.length) return col; [a[idx], a[s]] = [a[s], a[idx]]; return { ...col, links: a } })); D() }
  const updateHeading = (colId: string, heading: string) => { setFooterCols(p => p.map(col => col.id === colId ? { ...col, heading } : col)); D() }
  const addCol = () => { setFooterCols(p => [...p, { id: uid(), heading: 'New Column', links: [] }]); D() }
  const deleteCol = (colId: string) => { setFooterCols(p => p.filter(col => col.id !== colId)); D() }
  const moveCol = (idx: number, dir: -1 | 1) => { setFooterCols(p => { const a = [...p], s = idx + dir; if (s < 0 || s >= a.length) return a; [a[idx], a[s]] = [a[s], a[idx]]; return a }); D() }

  // Move footer → nav
  const moveFooterToNav = (colId: string, linkId: string) => {
    const col = footerCols.find(c => c.id === colId); const link = col?.links.find(l => l.id === linkId); if (!link) return
    setFooterCols(p => p.map(col => col.id === colId ? { ...col, links: col.links.filter(l => l.id !== linkId) } : col))
    setNavItems(p => [...p, { id: uid(), label: link.label, href: link.href, openNewTab: link.openNewTab }])
    D(); toast.success(`"${link.label}" moved to navbar`)
  }

  return (
    <AdminLayout pageClass="admin-page-settings" title="Menu Manager" subtitle="Control navbar links and footer columns — use ↔ to move items between sections">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 12 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#718096', fontFamily: 'Inter,sans-serif' }}>
          {dirty ? '⚠ Unsaved changes — click Save to apply to the live site' : 'Click any label or URL to edit. Use arrows to reorder. Use ↔ buttons to move items between Navbar and Footer.'}
        </div>
        <button onClick={save} disabled={saving || !dirty}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: dirty ? '#B8860B' : '#f3f4f6', border: 'none', color: dirty ? '#fff' : '#9ca3af', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
          {saving ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save style={{ width: 13, height: 13 }} />Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(13,17,23,0.04)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[{ key: 'navbar', label: '🔗 Navbar Menu' }, { key: 'footer', label: '📋 Footer Links' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === key ? '#fff' : 'transparent', color: tab === key ? '#0D1117' : '#718096', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: tab === key ? 700 : 400, cursor: 'pointer', boxShadow: tab === key ? '0 1px 4px rgba(13,17,23,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#A0ADB8', fontFamily: 'Inter,sans-serif' }}>Loading menus...</div>
      : tab === 'navbar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', background: '#FAFAFA' }}>
              <div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117' }}>Navigation Links</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8', marginTop: 2 }}>Displayed in top navbar · Click "Footer" button on any row to move it to a footer column</div>
              </div>
              <button onClick={addNav} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#FEF7E0', color: '#B8860B', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
                <Plus style={{ width: 12, height: 12 }} />Add Link
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '6px 16px', background: '#F8F8F8', borderBottom: '1px solid rgba(13,17,23,0.05)' }}>
              <div style={{ width: 50 }} />
              <div style={{ flex: 1, ...S.lbl, marginBottom: 0 }}>Label</div>
              <div style={{ width: 180, ...S.lbl, marginBottom: 0 }}>URL / Path</div>
              <div style={{ width: 62, ...S.lbl, marginBottom: 0 }}>Tab</div>
              <div style={{ width: 72, ...S.lbl, marginBottom: 0 }}>→ Footer</div>
              <div style={{ width: 72, ...S.lbl, marginBottom: 0 }}>Delete</div>
            </div>
            {navItems.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No nav items. <button onClick={addNav} style={{ background: 'none', border: 'none', color: '#B8860B', cursor: 'pointer', fontWeight: 700 }}>Add one</button></div>
              : navItems.map((item, i) => (
                <NavRow key={item.id} item={item} footerCols={footerCols}
                  onUpdate={updateNav} onDelete={deleteNav}
                  onMoveUp={() => moveNav(i, -1)} onMoveDown={() => moveNav(i, 1)}
                  onMoveToFooter={moveNavToFooter}
                  isFirst={i === 0} isLast={i === navItems.length - 1} />
              ))
            }
          </div>
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0ADB8' }}>Preview</div>
              <div style={{ padding: 16 }}>
                <div style={{ background: 'rgba(250,247,242,0.97)', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 13, color: '#0D1117', flexShrink: 0 }}>Thynk<em style={{ color: '#B8860B' }}>Schooling</em></span>
                  <div style={{ display: 'flex', gap: 14, flex: 1, flexWrap: 'wrap' as const }}>
                    {navItems.map(item => <span key={item.id} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#4A5568' }}>{item.label}</span>)}
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8', marginTop: 10, textAlign: 'center' as const }}>{navItems.length} item{navItems.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ ...S.card, marginTop: 14, padding: 16 }}>
              {[['✏️','Click label or URL to edit'],['↕️','Arrows reorder within navbar'],['↔️','Click "Footer" to move to a footer column'],['➕','Add Link adds a new item'],['💾','Save Changes when done']].map(([icon, tip]) => (
                <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {footerCols.map((col, colIdx) => (
              <div key={col.id} style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.07)', background: '#FAFAFA' }}>
                  <GripVertical style={{ width: 13, height: 13, color: '#D4D4D4' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <button onClick={() => moveCol(colIdx, -1)} disabled={colIdx === 0} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: colIdx === 0 ? 'default' : 'pointer', opacity: colIdx === 0 ? 0.2 : 0.6 }}><ChevronUp style={{ width: 10, height: 10 }} /></button>
                    <button onClick={() => moveCol(colIdx, 1)} disabled={colIdx === footerCols.length - 1} style={{ padding: '1px 3px', border: 'none', background: 'transparent', cursor: colIdx === footerCols.length - 1 ? 'default' : 'pointer', opacity: colIdx === footerCols.length - 1 ? 0.2 : 0.6 }}><ChevronDown style={{ width: 10, height: 10 }} /></button>
                  </div>
                  <AlignJustify style={{ width: 13, height: 13, color: '#B8860B', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><InlineEdit value={col.heading} onChange={v => updateHeading(col.id, v)} placeholder="Column heading" /></div>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>{col.links.length} links</span>
                  <button onClick={() => addLink(col.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#FEF7E0', color: '#B8860B', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
                    <Plus style={{ width: 10, height: 10 }} />Add
                  </button>
                  <button onClick={() => deleteCol(col.id)} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                </div>
                {col.links.length === 0
                  ? <div style={{ padding: '16px', textAlign: 'center', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: 12 }}>No links. <button onClick={() => addLink(col.id)} style={{ background: 'none', border: 'none', color: '#B8860B', cursor: 'pointer', fontWeight: 700 }}>Add one</button></div>
                  : col.links.map((link, linkIdx) => (
                    <FooterLinkRow key={link.id} link={link} colId={col.id}
                      onUpdate={updateLink} onDelete={deleteLink}
                      onMoveUp={() => moveLink(col.id, linkIdx, -1)} onMoveDown={() => moveLink(col.id, linkIdx, 1)}
                      onMoveToNav={moveFooterToNav}
                      isFirst={linkIdx === 0} isLast={linkIdx === col.links.length - 1} />
                  ))
                }
              </div>
            ))}
            <button onClick={addCol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: '2px dashed #EDE5D8', background: 'transparent', cursor: 'pointer', color: '#B8860B', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, width: '100%' }}>
              <Plus style={{ width: 14, height: 14 }} />Add Footer Column
            </button>
          </div>
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={S.card}>
              <div style={{ padding: '14px 16px', background: '#0D1117', borderRadius: '13px 13px 0 0' }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#B8860B', marginBottom: 12 }}>Footer Preview</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(footerCols.length, 2)}, 1fr)`, gap: 14 }}>
                  {footerCols.slice(0, 4).map(col => (
                    <div key={col.id}>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#B8860B', marginBottom: 8 }}>{col.heading}</div>
                      {col.links.slice(0, 4).map(link => <div key={link.id} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,247,242,0.4)', marginBottom: 5 }}>{link.label}</div>)}
                      {col.links.length > 4 && <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: 'rgba(184,134,11,0.6)' }}>+{col.links.length - 4} more</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                {[['✏️','Click headings or links to rename'],['↕️','Arrows reorder columns and links'],['↔️','Click "Nav" to move a link to navbar'],['➕','Add Column creates a new section'],['💾','Save once — all columns save together']].map(([icon, tip]) => (
                  <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
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
