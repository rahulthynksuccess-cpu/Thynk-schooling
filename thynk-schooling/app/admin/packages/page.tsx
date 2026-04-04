'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Plus, Pencil, Trash2, Save, X, Loader2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { LeadPackage } from '@/types'

const card: React.CSSProperties   = { background:'var(--admin-packages-card-bg,#111820)', border:'1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', borderRadius:'14px', padding:'20px' }
const lbl: React.CSSProperties    = { display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginBottom:'6px', fontFamily:'DM Sans,sans-serif' }
const inp: React.CSSProperties    = { width:'100%', padding:'10px 13px', background:'var(--admin-packages-card-bg,#111820)', border:'1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', borderRadius:'8px', color:'#fff', fontSize:'13px', fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }

interface PackageForm {
  name: string
  leadCredits: number
  price: number
  validityDays: number
  description: string
  isActive: boolean
}

const EMPTY: PackageForm = { name:'', leadCredits:10, price:199900, validityDays:90, description:'', isActive:true }

function PackageModal({ pkg, onClose, onSave }: {
  pkg?: LeadPackage
  onClose: () => void
  onSave: (data: PackageForm) => void
}) {
  const [form, setForm] = useState<PackageForm>(pkg ? {
    name: pkg.name, leadCredits: pkg.leadCredits, price: pkg.price,
    validityDays: pkg.validityDays, description: pkg.description || '',
    isActive: pkg.isActive,
  } : EMPTY)

  const set = (k: keyof PackageForm, v: PackageForm[keyof PackageForm]) => setForm(p => ({ ...p, [k]: v }))
  const priceRs = (form.price / 100).toFixed(0)
  const perLead = form.leadCredits > 0 ? Math.round(form.price / form.leadCredits / 100) : 0

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.96 }}
        style={{ ...card, width:'100%', maxWidth:'480px', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'16px', color:'#fff', margin:0 }}>
            {pkg ? 'Edit Package' : 'New Lead Package'}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', display:'flex' }}>
            <X style={{ width:'18px', height:'18px' }} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label style={lbl}>Package Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Starter 10, Growth 30, Pro 75"
              style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label style={lbl}>Lead Credits</label>
              <input type="number" value={form.leadCredits} min="1"
                onChange={e => set('leadCredits', Number(e.target.value))}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Price (₹)</label>
              <input type="number" value={priceRs} min="1"
                onChange={e => set('price', Math.round(parseFloat(e.target.value) * 100))}
                style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Validity (days)</label>
            <input type="number" value={form.validityDays} min="7" max="365"
              onChange={e => set('validityDays', Number(e.target.value))}
              style={inp} />
          </div>
          <div>
            <label style={lbl}>Description (optional)</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Short description shown on buy page"
              style={inp} />
          </div>

          {/* Price per lead preview */}
          <div style={{ padding:'12px', borderRadius:'8px', background:'rgba(255,92,0,0.06)', border:'1px solid rgba(255,92,0,0.2)' }}>
            <div style={{ fontSize:'12px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', fontFamily:'DM Sans,sans-serif' }}>Price per lead</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'22px', color:'#FF5C00' }}>₹{perLead}/lead</div>
          </div>

          <div style={{ display:'flex', gap:'10px', paddingTop:'4px' }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:'8px', background:'var(--admin-packages-card-bg,#111820)', border:'1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', cursor:'pointer', fontSize:'13px', fontFamily:'DM Sans,sans-serif', fontWeight:500 }}>
              Cancel
            </button>
            <button onClick={() => { if (!form.name || form.leadCredits < 1) { toast.error('Name and credits are required'); return } onSave(form) }}
              style={{ flex:1, padding:'11px', borderRadius:'8px', background:'#FF5C00', border:'none', color:'#fff', cursor:'pointer', fontSize:'13px', fontFamily:'DM Sans,sans-serif', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <Save style={{ width:'14px', height:'14px' }} /> {pkg ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LeadPackagesPage() {
  const queryClient = useQueryClient()
  const [modalPkg, setModalPkg]     = useState<LeadPackage | null | undefined>(undefined)
  const [modalOpen, setModalOpen]   = useState(false)

  const { data: packages, isLoading } = useQuery<LeadPackage[]>({
    queryKey: ['admin-lead-packages'],
    queryFn: () => fetch('/api/lead-packages?all=true',{cache:'no-store'}).then(r=>r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-lead-packages'] })

  const createMutation = useMutation({
    mutationFn: (data: PackageForm) => fetch('/api/lead-packages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess: () => { toast.success('Package created!'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to create package.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackageForm }) => fetch(`/api/lead-packages?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess: () => { toast.success('Package updated!'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to update package.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => fetch(`/api/lead-packages?id=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isActive})}).then(r=>r.json()),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/lead-packages?id=${id}`,{method:'DELETE'}).then(r=>r.json()),
    onSuccess: () => { toast.success('Package deleted.'); invalidate() },
    onError: () => toast.error('Cannot delete — package may have active purchases.'),
  })

  const handleSave = (data: PackageForm) => {
    if (modalPkg) {
      updateMutation.mutate({ id: modalPkg.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <AdminLayout pageClass="admin-page-packages" title="Lead Packages" subtitle="Create and manage bulk lead credit packages for schools">

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px' }}>
        <button onClick={() => { setModalPkg(null); setModalOpen(true) }}
          style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FF5C00', color:'#fff', border:'none', borderRadius:'8px', padding:'11px 20px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          <Plus style={{ width:'15px', height:'15px' }} /> New Package
        </button>
      </div>

      {/* Package grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'14px' }}>
        {isLoading
          ? Array.from({ length:5 }).map((_,i) => (
              <div key={i} style={{ ...card, height:'220px', animation:'pulse 1.5s infinite' }} />
            ))
          : (packages ?? []).map((pkg, i) => (
              <motion.div key={pkg.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                style={{ ...card, opacity: pkg.isActive ? 1 : .5, position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:'rgba(255,92,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Package style={{ width:'18px', height:'18px', color:'#FF5C00' }} />
                  </div>
                  <button onClick={() => toggleMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                    style={{ background:'none', border:'none', cursor:'pointer', color: pkg.isActive ? '#4ADE80' : '#8892B0', display:'flex' }}>
                    {pkg.isActive ? <ToggleRight style={{ width:'22px', height:'22px' }} /> : <ToggleLeft style={{ width:'22px', height:'22px' }} />}
                  </button>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'17px', color:'#fff', marginBottom:'3px' }}>{pkg.name}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'26px', color:'#FF5C00', marginBottom:'4px' }}>
                  ₹{(pkg.price / 100).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize:'12px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginBottom:'3px', fontFamily:'DM Sans,sans-serif' }}>
                  {pkg.leadCredits} credits · {pkg.validityDays} days
                </div>
                <div style={{ fontSize:'11px', color:'#4ADE80', marginBottom:'14px', fontFamily:'DM Sans,sans-serif' }}>
                  ₹{Math.round(pkg.price / pkg.leadCredits / 100)}/lead
                </div>
                {pkg.description && (
                  <div style={{ fontSize:'11px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginBottom:'14px', fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>{pkg.description}</div>
                )}
                <div style={{ display:'flex', gap:'8px', paddingTop:'12px', borderTop:'1px solid #1E2A52' }}>
                  <button onClick={() => { setModalPkg(pkg); setModalOpen(true) }}
                    style={{ flex:1, padding:'8px', borderRadius:'7px', background:'var(--admin-packages-card-bg,#111820)', border:'1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', cursor:'pointer', fontSize:'12px', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                    <Pencil style={{ width:'12px', height:'12px' }} /> Edit
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${pkg.name}"?`)) deleteMutation.mutate(pkg.id) }}
                    style={{ padding:'8px 12px', borderRadius:'7px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 style={{ width:'13px', height:'13px' }} />
                  </button>
                </div>
              </motion.div>
            ))
        }
      </div>

      {!isLoading && (packages ?? []).length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <Package style={{ width:'48px', height:'48px', color:'#1E2A52', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'15px', fontWeight:600, color:'#fff', marginBottom:'6px', fontFamily:'Syne,sans-serif' }}>No packages yet</div>
          <div style={{ fontSize:'13px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', fontFamily:'DM Sans,sans-serif' }}>Create your first lead credit package for schools.</div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <PackageModal
            pkg={modalPkg ?? undefined}
            onClose={() => { setModalOpen(false); setModalPkg(undefined) }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
