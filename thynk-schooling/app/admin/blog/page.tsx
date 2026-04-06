'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Plus, Trash2, Eye, Edit3, Save, X, Search, ChevronDown,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Image, Heading1, Heading2,
  Heading3, Quote, Code, Minus, ArrowLeft, ExternalLink,
  Upload, RotateCcw, Tag, Clock, Calendar, Globe, EyeOff,
  Check, AlertCircle, Loader2, FileText, BarChart3, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Types ────────────────────────────────────────────────────────── */
interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string           // HTML content
  tag: string
  readTime: string
  publishedAt: string
  status: 'published' | 'draft'
  coverImage: string
  metaTitle: string
  metaDesc: string
  author: string
  createdAt: string
  updatedAt: string
}

const EMPTY_POST: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
  slug: '', title: '', excerpt: '', body: '', tag: 'Admission Tips',
  readTime: '5 min', publishedAt: new Date().toISOString().slice(0, 10),
  status: 'draft', coverImage: '', metaTitle: '', metaDesc: '', author: 'Thynk Schooling Team',
}

const TAGS = ['Board Guide', 'Admission Tips', 'Rankings', 'School Lists', 'Finance', 'Success Stories', 'News', 'Events']
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'Board Guide':    { bg: '#FEF7E0', color: '#7A5800' },
  'Admission Tips': { bg: '#E8F5E8', color: '#1A5C1A' },
  'Rankings':       { bg: '#EDE5D8', color: '#4A3020' },
  'School Lists':   { bg: '#E8ECF5', color: '#1A2C5C' },
  'Finance':        { bg: '#F5E8ED', color: '#5C1A30' },
  'Success Stories':{ bg: '#EDE5F8', color: '#4A1A7C' },
  'News':           { bg: '#E5F5FF', color: '#1A4A7C' },
  'Events':         { bg: '#FFF0E5', color: '#7C3A1A' },
}

/* ── Styles ───────────────────────────────────────────────────────── */
const S = {
  card: { background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 14, overflow: 'hidden' as const, color: '#0D1117' },
  inp: { width: '100%', padding: '10px 13px', background: '#FAF7F2', border: '1.5px solid #EDE5D8', borderRadius: 9, fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#0D1117', outline: 'none', boxSizing: 'border-box' as const },
  lbl: { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#718096', fontFamily: 'Inter,sans-serif', marginBottom: 5 },
  btn: (bg: string, col: string, border = 'none') => ({ display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6, padding: '9px 18px', borderRadius: 9, background: bg, border, color: col, fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer' as const }),
}

/* ── Slug generator ───────────────────────────────────────────────── */
function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 80)
}

/* ── Rich Text Toolbar Button ─────────────────────────────────────── */
function TB({ icon: Icon, label, onClick, active = false }: { icon: any; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button title={label} onClick={onClick}
      style={{ padding: '5px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', background: active ? 'rgba(184,134,11,0.15)' : 'transparent', color: active ? '#B8860B' : '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: 14, height: 14 }} />
    </button>
  )
}

/* ── Rich Text Editor ─────────────────────────────────────────────── */
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({})

  // Sync external value → editor (only on mount or when value externally set)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // eslint-disable-line

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    syncFormats()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const syncFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    })
  }

  const insertBlock = (tag: string, content = 'Your heading here') => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0)
      const el = document.createElement(tag)
      const selectedText = range.toString()
      el.textContent = selectedText || content
      range.deleteContents()
      range.insertNode(el)
      // Move cursor after
      range.setStartAfter(el)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      document.execCommand('insertHTML', false, `<${tag}>${content}</${tag}><p><br></p>`)
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:', 'https://')
    if (url) exec('insertImage', url)
  }

  const insertHR = () => {
    exec('insertHTML', '<hr style="border:none;border-top:2px solid #EDE5D8;margin:24px 0"/><p><br></p>')
  }

  const insertBlockquote = () => {
    exec('insertHTML', '<blockquote style="border-left:4px solid #B8860B;padding:12px 20px;margin:16px 0;background:rgba(184,134,11,0.06);font-style:italic;color:#4A5568">Your quote here</blockquote><p><br></p>')
  }

  const insertCode = () => {
    exec('insertHTML', '<pre style="background:#0D1117;color:#E8C547;padding:16px 20px;border-radius:9px;overflow:auto;font-family:monospace;font-size:13px;margin:16px 0">// code here</pre><p><br></p>')
  }

  return (
    <div style={{ border: '1.5px solid #EDE5D8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 2, padding: '8px 10px', borderBottom: '1px solid #EDE5D8', background: '#FAF7F2', alignItems: 'center' }}>
        {/* Headings */}
        <TB icon={Heading1} label="H1" onClick={() => insertBlock('h1', 'Heading 1')} />
        <TB icon={Heading2} label="H2" onClick={() => insertBlock('h2', 'Heading 2')} />
        <TB icon={Heading3} label="H3" onClick={() => insertBlock('h3', 'Heading 3')} />
        <div style={{ width: 1, height: 18, background: '#EDE5D8', margin: '0 4px' }} />

        {/* Text formatting */}
        <TB icon={Bold}       label="Bold"      onClick={() => exec('bold')}      active={activeFormats.bold} />
        <TB icon={Italic}     label="Italic"    onClick={() => exec('italic')}    active={activeFormats.italic} />
        <TB icon={Underline}  label="Underline" onClick={() => exec('underline')} active={activeFormats.underline} />
        <div style={{ width: 1, height: 18, background: '#EDE5D8', margin: '0 4px' }} />

        {/* Font family */}
        <select onChange={e => exec('fontName', e.target.value)} defaultValue=""
          style={{ padding: '4px 6px', borderRadius: 5, border: '1px solid #EDE5D8', fontSize: 11, background: '#fff', color: '#0D1117', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          <option value="" disabled>Font</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="'Cormorant Garamond', serif">Cormorant</option>
          <option value="'DM Sans', sans-serif">DM Sans</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="monospace">Monospace</option>
        </select>

        {/* Font size */}
        <select onChange={e => exec('fontSize', e.target.value)} defaultValue=""
          style={{ padding: '4px 6px', borderRadius: 5, border: '1px solid #EDE5D8', fontSize: 11, background: '#fff', color: '#0D1117', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          <option value="" disabled>Size</option>
          {['1','2','3','4','5','6','7'].map(s => (
            <option key={s} value={s}>{['10','13','16','18','24','32','48'][Number(s)-1]}px</option>
          ))}
        </select>

        {/* Color */}
        <label title="Text colour" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 5 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#B8860B', border: '1px solid #EDE5D8' }} />
          <input type="color" defaultValue="#B8860B" onChange={e => exec('foreColor', e.target.value)}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} />
        </label>
        <div style={{ width: 1, height: 18, background: '#EDE5D8', margin: '0 4px' }} />

        {/* Alignment */}
        <TB icon={AlignLeft}   label="Align Left"   onClick={() => exec('justifyLeft')}   active={activeFormats.justifyLeft} />
        <TB icon={AlignCenter} label="Align Center" onClick={() => exec('justifyCenter')} active={activeFormats.justifyCenter} />
        <TB icon={AlignRight}  label="Align Right"  onClick={() => exec('justifyRight')}  active={activeFormats.justifyRight} />
        <div style={{ width: 1, height: 18, background: '#EDE5D8', margin: '0 4px' }} />

        {/* Lists */}
        <TB icon={List}        label="Bullet List"  onClick={() => exec('insertUnorderedList')} active={activeFormats.insertUnorderedList} />
        <TB icon={ListOrdered} label="Ordered List" onClick={() => exec('insertOrderedList')}   active={activeFormats.insertOrderedList} />
        <div style={{ width: 1, height: 18, background: '#EDE5D8', margin: '0 4px' }} />

        {/* Inserts */}
        <TB icon={Quote}    label="Blockquote" onClick={insertBlockquote} />
        <TB icon={Code}     label="Code Block" onClick={insertCode} />
        <TB icon={Minus}    label="Divider"    onClick={insertHR} />
        <TB icon={LinkIcon} label="Insert Link"  onClick={insertLink} />
        <TB icon={Image}    label="Insert Image" onClick={insertImage} />
        <div style={{ flex: 1 }} />

        {/* Undo/Redo */}
        <TB icon={RotateCcw} label="Undo" onClick={() => { exec('undo'); if (editorRef.current) onChange(editorRef.current.innerHTML) }} />
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML) }}
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        style={{
          minHeight: 480,
          padding: '24px 28px',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          lineHeight: 1.8,
          color: '#0D1117',
          background: '#fff',
          overflowY: 'auto' as const,
        }}
      />

      {/* Editor CSS for rich content */}
      <style>{`
        [contenteditable] h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.4rem; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; color: #0D1117; margin: 28px 0 14px; }
        [contenteditable] h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 700; letter-spacing: -1px; line-height: 1.15; color: #0D1117; margin: 24px 0 12px; }
        [contenteditable] h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 700; color: #0D1117; margin: 20px 0 10px; }
        [contenteditable] p  { margin: 0 0 16px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 26px; margin: 12px 0 16px; }
        [contenteditable] li { margin-bottom: 6px; }
        [contenteditable] a  { color: #B8860B; text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 10px; margin: 12px 0; display: block; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u  { text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 2px solid #EDE5D8; margin: 24px 0; }
        [contenteditable]:empty::before { content: 'Start writing your article here...'; color: #A0ADB8; pointer-events: none; }
      `}</style>
    </div>
  )
}

/* ── Post List Row ────────────────────────────────────────────────── */
function PostRow({ post, onEdit, onDelete, onToggleStatus }: {
  post: BlogPost
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const [delConfirm, setDelConfirm] = useState(false)
  const tc = TAG_COLORS[post.tag] ?? { bg: '#EDE5D8', color: '#4A3020' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 110px 130px', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(13,17,23,0.05)', transition: 'background .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FDFAF5'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      {/* Title */}
      <div>
        <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1117', marginBottom: 3, lineHeight: 1.3 }}>{post.title || <em style={{ color: '#A0ADB8' }}>Untitled</em>}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 100, background: tc.bg, color: tc.color, fontFamily: 'Inter,sans-serif' }}>{post.tag}</span>
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>/{post.slug || '—'}</span>
        </div>
      </div>
      {/* Author */}
      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096' }}>{post.author}</div>
      {/* Read time */}
      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock style={{ width: 11, height: 11 }} /> {post.readTime}
      </div>
      {/* Date */}
      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Calendar style={{ width: 11, height: 11 }} /> {post.publishedAt?.slice(0, 10) ?? '—'}
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Status pill */}
        <button onClick={onToggleStatus}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: 'none', cursor: 'pointer', background: post.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(250,204,21,0.15)', color: post.status === 'published' ? '#15803d' : '#92400e', fontSize: 10, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
          {post.status === 'published' ? <><Globe style={{ width: 9, height: 9 }} />Live</> : <><EyeOff style={{ width: 9, height: 9 }} />Draft</>}
        </button>
        <button onClick={onEdit}
          style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #EDE5D8', background: '#fff', cursor: 'pointer', color: '#4A5568' }}>
          <Edit3 style={{ width: 12, height: 12 }} />
        </button>
        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
          style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #EDE5D8', background: '#fff', color: '#4A5568', display: 'flex' }}>
          <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
        {delConfirm ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onDelete} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            <button onClick={() => setDelConfirm(false)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #EDE5D8', background: '#fff', color: '#718096', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setDelConfirm(true)}
            style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                         */
/* ══════════════════════════════════════════════════════════════════ */
export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Editor state
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [form, setForm] = useState<typeof EMPTY_POST>({ ...EMPTY_POST })
  const [saving, setSaving] = useState(false)
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'seo' | 'settings'>('content')
  const [slugEdited, setSlugEdited] = useState(false)

  /* ── Load posts ── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=blog&admin=1')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch { toast.error('Failed to load posts') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Derived ── */
  const filtered = posts.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false
    if (tagFilter !== 'all' && p.tag !== tagFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
  }

  /* ── Open editor ── */
  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_POST })
    setSlugEdited(false)
    setActiveEditorTab('content')
  }

  const openEdit = (post: BlogPost) => {
    setEditing(post)
    setForm({
      slug: post.slug, title: post.title, excerpt: post.excerpt, body: post.body,
      tag: post.tag, readTime: post.readTime, publishedAt: post.publishedAt?.slice(0, 10),
      status: post.status, coverImage: post.coverImage, metaTitle: post.metaTitle,
      metaDesc: post.metaDesc, author: post.author,
    })
    setSlugEdited(true)
    setActiveEditorTab('content')
  }

  const closeEditor = () => { setEditing(null); setForm({ ...EMPTY_POST }) }

  /* ── Form helpers ── */
  const set = (key: keyof typeof EMPTY_POST, val: string) => {
    setForm(p => {
      const next = { ...p, [key]: val }
      // Auto-generate slug from title (unless manually edited)
      if (key === 'title' && !slugEdited) next.slug = toSlug(val)
      // Auto meta title
      if (key === 'title' && !p.metaTitle) next.metaTitle = val
      return next
    })
  }

  /* ── Save ── */
  const save = async (statusOverride?: 'published' | 'draft') => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.slug.trim())  { toast.error('Slug is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, status: statusOverride ?? form.status }
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/admin?action=blog&id=${editing.id}` : '/api/admin?action=blog'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
      toast.success(editing ? 'Post updated!' : 'Post created!')
      await load()
      closeEditor()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  /* ── Delete ── */
  const deletePost = async (id: string) => {
    try {
      await fetch(`/api/admin?action=blog&id=${id}`, { method: 'DELETE' })
      toast.success('Post deleted')
      setPosts(p => p.filter(x => x.id !== id))
    } catch { toast.error('Delete failed') }
  }

  /* ── Toggle status ── */
  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      await fetch(`/api/admin?action=blog&id=${post.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setPosts(p => p.map(x => x.id === post.id ? { ...x, status: newStatus } : x))
      toast.success(newStatus === 'published' ? 'Post published!' : 'Moved to draft')
    } catch { toast.error('Update failed') }
  }

  /* ══════════ EDITOR VIEW ══════════ */
  if (form.title !== undefined && (editing !== null || form.title !== '')) {
    // Check if editor is open (new or edit mode)
    const editorOpen = editing !== null || (form.title === '' && form.body === '' && form.slug === '' ? false : true)
    // Actually, let's use a separate flag
  }

  const [editorOpen, setEditorOpen] = useState(false)

  const handleOpenNew = () => { openNew(); setEditorOpen(true) }
  const handleOpenEdit = (post: BlogPost) => { openEdit(post); setEditorOpen(true) }
  const handleCloseEditor = () => { closeEditor(); setEditorOpen(false) }

  /* ══════════ EDITOR PANEL ══════════ */
  if (editorOpen) {
    return (
      <AdminLayout pageClass="admin-page-blog" title="" subtitle="">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

          {/* ── Left: Main editor ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Top bar */}
            <div style={{ ...S.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleCloseEditor} style={{ ...S.btn('transparent', '#4A5568', '1px solid #EDE5D8'), padding: '7px 12px' }}>
                <ArrowLeft style={{ width: 13, height: 13 }} /> All Posts
              </button>
              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0D1117', flex: 1 }}>
                {editing ? `Editing: ${editing.title || 'Untitled'}` : 'New Blog Post'}
              </span>
              <button onClick={() => save('draft')} disabled={saving}
                style={{ ...S.btn('#FAF7F2', '#B8860B', '1.5px solid #B8860B'), opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 12, height: 12 }} />}
                Save Draft
              </button>
              <button onClick={() => save('published')} disabled={saving}
                style={{ ...S.btn('#B8860B', '#fff'), opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Globe style={{ width: 12, height: 12 }} />}
                Publish
              </button>
            </div>

            {/* Editor tabs */}
            <div style={{ display: 'flex', gap: 2, background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 10, padding: 4, alignSelf: 'flex-start' }}>
              {(['content', 'seo', 'settings'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveEditorTab(tab)}
                  style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' as const,
                    background: activeEditorTab === tab ? '#0D1117' : 'transparent',
                    color: activeEditorTab === tab ? '#fff' : '#718096' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Content tab ── */}
            {activeEditorTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Title */}
                <div style={S.card}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                      placeholder="Post title..."
                      style={{ width: '100%', border: 'none', outline: 'none', fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#0D1117', background: 'transparent', letterSpacing: '-0.5px' }} />
                  </div>
                  <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#A0ADB8' }}>Permalink:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#718096' }}>/blog/</span>
                    <input value={form.slug} onChange={e => { setSlugEdited(true); set('slug', toSlug(e.target.value)) }}
                      style={{ fontFamily: 'monospace', fontSize: 11, color: '#B8860B', border: 'none', outline: 'none', background: 'transparent', minWidth: 120, borderBottom: '1px dashed #EDE5D8' }} />
                    <button onClick={() => { setSlugEdited(false); set('slug', toSlug(form.title)) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0ADB8', padding: 0 }}>
                      <RotateCcw style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                </div>

                {/* Cover Image */}
                <div style={S.card}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image style={{ width: 14, height: 14, color: '#B8860B' }} />
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>Cover Image</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {form.coverImage ? (
                      <div style={{ position: 'relative', width: 140, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#EDE5D8' }}>
                        <img src={form.coverImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
                        <button onClick={() => set('coverImage', '')}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X style={{ width: 10, height: 10, color: '#fff' }} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: 140, height: 90, borderRadius: 8, background: '#F5F0E8', border: '1.5px dashed #EDE5D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Upload style={{ width: 20, height: 20, color: '#C4B8A0' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <label style={S.lbl}>Image URL</label>
                      <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        style={{ ...S.inp, fontSize: 12 }} />
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', margin: '5px 0 0' }}>Use Unsplash, Cloudinary, or any direct image URL. Recommended: 1200×630px.</p>
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <div style={S.card}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText style={{ width: 14, height: 14, color: '#B8860B' }} />
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>Excerpt (shown in blog listing)</span>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                      placeholder="A brief 1-2 sentence summary shown in the blog grid..."
                      style={{ ...S.inp, resize: 'vertical' as const, lineHeight: 1.6 }} rows={3} />
                  </div>
                </div>

                {/* Body / Rich Editor */}
                <div style={S.card}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 style={{ width: 14, height: 14, color: '#B8860B' }} />
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>Article Body</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', marginLeft: 4 }}>Full rich text editor with font, heading & formatting controls</span>
                  </div>
                  <div style={{ padding: '0' }}>
                    <RichEditor value={form.body} onChange={v => set('body', v)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── SEO tab ── */}
            {activeEditorTab === 'seo' && (
              <div style={{ ...S.card, padding: '20px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#0D1117', marginBottom: 20 }}>SEO Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={S.lbl}>Meta Title <span style={{ color: '#A0ADB8', fontWeight: 400, fontSize: 10 }}>(shown in Google)</span></label>
                    <input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)}
                      placeholder={form.title || 'SEO title...'}
                      style={S.inp} />
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: form.metaTitle.length > 60 ? '#DC2626' : '#A0ADB8', marginTop: 4 }}>
                      {form.metaTitle.length}/60 characters
                    </div>
                  </div>
                  <div>
                    <label style={S.lbl}>Meta Description <span style={{ color: '#A0ADB8', fontWeight: 400, fontSize: 10 }}>(shown in Google snippet)</span></label>
                    <textarea value={form.metaDesc} onChange={e => set('metaDesc', e.target.value)}
                      placeholder={form.excerpt || 'A 155–160 character description...'}
                      style={{ ...S.inp, resize: 'vertical' as const, lineHeight: 1.6 }} rows={3} />
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: form.metaDesc.length > 160 ? '#DC2626' : '#A0ADB8', marginTop: 4 }}>
                      {form.metaDesc.length}/160 characters
                    </div>
                  </div>
                  {/* Google preview */}
                  <div style={{ background: '#F8F9FA', border: '1px solid #E8EAED', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: 12, color: '#009900', marginBottom: 2 }}>
                      thynkschooling.in › blog › {form.slug || 'your-post-slug'}
                    </div>
                    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: 18, color: '#1A0DAB', fontWeight: 400, marginBottom: 3, lineHeight: 1.3 }}>
                      {form.metaTitle || form.title || 'Post Title'}
                    </div>
                    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: 13, color: '#545454', lineHeight: 1.5, maxWidth: 550 }}>
                      {form.metaDesc || form.excerpt || 'Meta description will appear here...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Settings tab ── */}
            {activeEditorTab === 'settings' && (
              <div style={{ ...S.card, padding: '20px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#0D1117', marginBottom: 20 }}>Post Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={S.lbl}>Author</label>
                    <input value={form.author} onChange={e => set('author', e.target.value)} style={S.inp} />
                  </div>
                  <div>
                    <label style={S.lbl}>Read Time</label>
                    <input value={form.readTime} onChange={e => set('readTime', e.target.value)} placeholder="5 min" style={S.inp} />
                  </div>
                  <div>
                    <label style={S.lbl}>Published Date</label>
                    <input type="date" value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} style={S.inp} />
                  </div>
                  <div>
                    <label style={S.lbl}>Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value as any)}
                      style={{ ...S.inp, cursor: 'pointer' }}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>
            {/* Publish box */}
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)', background: 'rgba(184,134,11,0.03)' }}>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>Publish</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: form.status === 'published' ? 'rgba(34,197,94,0.07)' : 'rgba(250,204,21,0.08)', borderRadius: 8, border: `1px solid ${form.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(250,204,21,0.3)'}` }}>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: form.status === 'published' ? '#15803d' : '#92400e' }}>
                    {form.status === 'published' ? '● Live' : '○ Draft'}
                  </span>
                  <button onClick={() => set('status', form.status === 'published' ? 'draft' : 'published')}
                    style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Switch
                  </button>
                </div>
                <button onClick={() => save('draft')} disabled={saving}
                  style={{ ...S.btn('#FAF7F2', '#0D1117', '1.5px solid #EDE5D8'), width: '100%', justifyContent: 'center', fontSize: 13 }}>
                  <Save style={{ width: 13, height: 13 }} /> Save Draft
                </button>
                <button onClick={() => save('published')} disabled={saving}
                  style={{ ...S.btn('#B8860B', '#fff'), width: '100%', justifyContent: 'center', fontSize: 13 }}>
                  <Globe style={{ width: 13, height: 13 }} /> Publish
                </button>
                {editing && (
                  <a href={`/blog/${editing.slug}`} target="_blank" rel="noreferrer"
                    style={{ ...S.btn('transparent', '#4A5568', '1px solid #EDE5D8'), width: '100%', justifyContent: 'center', fontSize: 12, textDecoration: 'none' }}>
                    <Eye style={{ width: 12, height: 12 }} /> Preview Post
                  </a>
                )}
              </div>
            </div>

            {/* Category / Tag */}
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Tag style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />Category
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TAGS.map(tag => {
                  const tc = TAG_COLORS[tag] ?? { bg: '#EDE5D8', color: '#4A3020' }
                  return (
                    <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                      <div onClick={() => set('tag', tag)}
                        style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${form.tag === tag ? '#B8860B' : '#EDE5D8'}`, background: form.tag === tag ? '#B8860B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                        {form.tag === tag && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 100, background: tc.bg, color: tc.color, fontFamily: 'Inter,sans-serif' }}>{tag}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Checklist */}
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '1px' }}>Pre-publish Checklist</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Title added', ok: !!form.title.trim() },
                  { label: 'Slug set', ok: !!form.slug.trim() },
                  { label: 'Excerpt written', ok: !!form.excerpt.trim() },
                  { label: 'Content written', ok: form.body.replace(/<[^>]*>/g, '').trim().length > 50 },
                  { label: 'Cover image', ok: !!form.coverImage.trim() },
                  { label: 'Meta description', ok: !!form.metaDesc.trim() },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 12, color: item.ok ? '#15803d' : '#718096' }}>
                    {item.ok
                      ? <Check style={{ width: 13, height: 13, color: '#22c55e', flexShrink: 0 }} />
                      : <AlertCircle style={{ width: 13, height: 13, color: '#D1D5DB', flexShrink: 0 }} />}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  /* ══════════ LIST VIEW ══════════ */
  return (
    <AdminLayout pageClass="admin-page-blog" title="Blog Manager" subtitle="Create, edit and manage all blog posts">

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Posts', value: stats.total, icon: FileText, color: '#B8860B' },
          { label: 'Published', value: stats.published, icon: Globe, color: '#22c55e' },
          { label: 'Drafts', value: stats.draft, icon: EyeOff, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon style={{ width: 17, height: 17, color: s.color }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 26, color: '#0D1117', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ ...S.card, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '1.5px solid #EDE5D8', borderRadius: 9, padding: '8px 12px' }}>
          <Search style={{ width: 13, height: 13, color: '#A0ADB8', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#0D1117', flex: 1 }} />
        </div>
        {/* Tag filter */}
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          style={{ ...S.inp, width: 'auto', minWidth: 140 }}>
          <option value="all">All Categories</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...S.inp, width: 'auto', minWidth: 120 }}>
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={handleOpenNew} style={{ ...S.btn('#B8860B', '#fff'), marginLeft: 'auto' }}>
          <Plus style={{ width: 13, height: 13 }} /> New Post
        </button>
      </div>

      {/* Posts table */}
      <div style={S.card}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 110px 130px', gap: 12, padding: '10px 20px', background: '#FDFAF5', borderBottom: '1px solid rgba(13,17,23,0.07)' }}>
          {['Title & Category', 'Author', 'Read Time', 'Published', 'Actions'].map(h => (
            <span key={h} style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#A0ADB8' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#A0ADB8', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
            <Loader2 style={{ width: 22, height: 22, animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
            Loading posts...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#0D1117', marginBottom: 8 }}>
              {search || tagFilter !== 'all' || statusFilter !== 'all' ? 'No posts found' : 'No blog posts yet'}
            </div>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#718096', marginBottom: 20 }}>
              {search || tagFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first blog post to get started.'}
            </p>
            {!search && tagFilter === 'all' && (
              <button onClick={handleOpenNew} style={S.btn('#B8860B', '#fff')}>
                <Plus style={{ width: 13, height: 13 }} /> Create First Post
              </button>
            )}
          </div>
        ) : (
          filtered.map(post => (
            <PostRow key={post.id} post={post}
              onEdit={() => handleOpenEdit(post)}
              onDelete={() => deletePost(post.id)}
              onToggleStatus={() => toggleStatus(post)}
            />
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  )
}
