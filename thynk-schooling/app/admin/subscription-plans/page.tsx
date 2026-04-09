'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Plus, Pencil, Trash2, Save, X, Loader2, LayoutGrid, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const card: React.CSSProperties = { background: 'var(--admin-packages-card-bg,#111820)', border: '1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', borderRadius: '14px', padding: '20px' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--admin-text-muted,rgba(255,255,255,0.45))', marginBottom: '6px', fontFamily: 'DM Sans,sans-serif' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', background: 'var(--admin-packages-card-bg,#111820)', border: '1px solid var(--admin-packages-card-border,rgba(255,255,255,0.07))', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }
const textarea: React.CSSProperties = { ...inp, minHeight: '72px', resize: 'vertical' } as React.CSSProperties

interface SubPlan {
  id: string; planKey: string; name: string; description: string
  price: number; leadCredits: number; features: string[]
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
  isFeaturedListing: boolean; featuredListingDays: number
}

interface PlanForm {
  planKey: string; name: string; description: string
  price: number; leadCredits: number; featuresRaw: string
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
  isFeaturedListing: boolean; featuredListingDays: number
}

const EMPTY: PlanForm = {
  planKey: '', name: '', description: '', price: 0, leadCredits: 25,
  featuresRaw: '', isHot: false, cta: 'Get Started', sortOrder: 0, isActive: true,
  isFeaturedListing: false, featuredListingDays: 30,
}

function PlanModal({ plan, onClose, onSave, saving }: {
  plan?: SubPlan; onClose: () => void
  onSave: (data: PlanForm) => void; saving: boolean
}) {
  const [form, setForm] = useState<PlanForm>(plan ? {
    planKey: plan.planKey, name: plan.name, description: plan.description,
    price: Math.round(plan.price / 100), leadCredits: plan.leadCredits,
    featuresRaw: plan.features.join('\n'), isHot: plan.isHot,
    cta: plan.cta, sortOrder: plan.sortOrder, isActive: plan.isActive,
    isFeaturedListing: plan.isFeaturedListing ?? false,
    featuredListingDays: plan.featuredListingDays ?? 30,
  } : EMPTY)

  const set = (k: keyof PlanForm, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }}
        style={{ ...card, width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', margin: 0 }}>
            {plan ? 'Edit Subscription Plan' : 'New Subscription Plan'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lbl}>Plan Key <span style={{ color: 'rgba(255,255,255,0.25)', textTransform: 'none', fontSize: '10px' }}>(unique slug)</span></label>
              <input value={form.planKey} onChange={e => set('planKey', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. gold, platinum-plus" style={inp} disabled={!!plan} />
            </div>
            <div>
              <label style={lbl}>Display Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gold" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Short tagline shown under plan name" style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              {/* FIX: removed "/month" — price is a one-time package price */}
              <label style={lbl}>Price (in Paise) <span style={{ color: 'rgba(255,255,255,0.25)', textTransform: 'none', fontSize: '10px' }}>e.g. 135000 = ₹1,350</span></label>
              <input type="number" min="0" value={form.price}
                onChange={e => set('price', Number(e.target.value))} style={inp} />
            </div>
            <div>
              {/* FIX: "Credits/month" → "Lead Credits" */}
              <label style={lbl}>Lead Credits <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>(-1 = unlimited)</span></label>
              <input type="number" min="-1" value={form.leadCredits}
                onChange={e => set('leadCredits', Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Sort Order</label>
              <input type="number" min="0" value={form.sortOrder}
                onChange={e => set('sortOrder', Number(e.target.value))} style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>CTA Button Text</label>
            <input value={form.cta} onChange={e => set('cta', e.target.value)}
              placeholder="e.g. Start Gold" style={inp} />
          </div>

          <div>
            <label style={lbl}>Features <span style={{ color: 'rgba(255,255,255,0.25)', textTransform: 'none', fontSize: '10px' }}>(one per line)</span></label>
            <textarea value={form.featuresRaw} onChange={e => set('featuresRaw', e.target.value)}
              placeholder={'75 lead credits included\nFeatured school badge\nTop placement in search'}
              style={textarea as any} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isHot} onChange={e => set('isHot', e.target.checked)}
                style={{ accentColor: '#FF5C00', width: '15px', height: '15px' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>Mark as Most Popular</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                style={{ accentColor: '#4ADE80', width: '15px', height: '15px' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>Active (visible on site)</span>
            </label>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeaturedListing} onChange={e => set('isFeaturedListing', e.target.checked)}
                style={{ accentColor: '#E8C547', width: '15px', height: '15px' }} />
              <span style={{ fontSize: '13px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, color: form.isFeaturedListing ? '#E8C547' : 'rgba(255,255,255,0.7)' }}>
                ⚡ Includes Featured Listing
              </span>
            </label>
            {form.isFeaturedListing && (
              <div>
                <label style={lbl}>Featured Listing Validity <span style={{ color: 'rgba(255,255,255,0.25)', textTransform: 'none', fontSize: '10px' }}>(days — e.g. 30, 90, 365)</span></label>
                <input type="number" min="1" value={form.featuredListingDays}
                  onChange={e => set('featuredListingDays', Number(e.target.value))}
                  placeholder="30" style={{ ...inp, borderColor: 'rgba(232,197,71,0.35)' }} />
                <div style={{ marginTop: '5px', fontSize: '11px', color: 'rgba(232,197,71,0.6)', fontFamily: 'DM Sans,sans-serif' }}>
                  School's featured_until = purchase date + {form.featuredListingDays} day{form.featuredListingDays !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '8px', background: 'var(--admin-packages-card-bg,#111820)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans,sans-serif' }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!form.planKey || !form.name) { toast.error('Plan key and name are required'); return }
                if (form.isFeaturedListing && (!form.featuredListingDays || form.featuredListingDays < 1)) {
                  toast.error('Featured listing validity must be at least 1 day'); return
                }
                const features = form.featuresRaw.split('\n').map(s => s.trim()).filter(Boolean)
                onSave({ ...form, price: form.price * 100, features: features as any, featuresRaw: form.featuresRaw })
              }}
              disabled={saving}
              style={{ flex: 1, padding: '11px', borderRadius: '8px', background: '#FF5C00', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? .6 : 1 }}>
              {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
              {plan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient()
  const [modalPlan, setModalPlan] = useState<SubPlan | null | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: plans, isLoading } = useQuery<SubPlan[]>({
    queryKey: ['admin-sub-plans'],
    queryFn: () => fetch('/api/admin?action=subscription-plans', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 3 * 60 * 1000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-sub-plans'] })

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin?action=subscription-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (res) => { if (res.error) { toast.error(res.error); return } toast.success('Plan created!'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to create plan.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin?action=subscription-plans&id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (res) => { if (res.error) { toast.error(res.error); return } toast.success('Plan updated!'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to update plan.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/admin?action=subscription-plans&id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }).then(r => r.json()),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin?action=subscription-plans&id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Plan deleted.'); invalidate() },
    onError: () => toast.error('Failed to delete plan.'),
  })

  const handleSave = (data: PlanForm) => {
    const payload = {
      planKey: data.planKey, name: data.name, description: data.description,
      price: data.price, leadCredits: data.leadCredits,
      features: (data as any).features ?? data.featuresRaw.split('\n').map((s: string) => s.trim()).filter(Boolean),
      isHot: data.isHot, cta: data.cta, sortOrder: data.sortOrder, isActive: data.isActive,
      isFeaturedListing: data.isFeaturedListing,
      featuredListingDays: data.isFeaturedListing ? data.featuredListingDays : 0,
    }
    if (modalPlan) updateMutation.mutate({ id: modalPlan.id, data: payload })
    else createMutation.mutate(payload)
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <AdminLayout pageClass="admin-page-packages" title="Subscription Plans" subtitle="Manage plan cards shown on the pricing page and homepage">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => { setModalPlan(null); setModalOpen(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FF5C00', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          <Plus style={{ width: '15px', height: '15px' }} /> New Plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '14px' }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...card, height: '260px', animation: 'pulse 1.5s infinite' }} />
          ))
          : (plans ?? []).map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}
              style={{ ...card, opacity: plan.isActive ? 1 : .5, position: 'relative', overflow: 'hidden' }}>

              {plan.isHot && (
                <div style={{ position: 'absolute', top: 0, right: 0, width: 22, height: '100%', background: 'linear-gradient(180deg,#B8860B,#E8C547)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: 'DM Sans,sans-serif', fontSize: '8px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0D1117', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    ⚡ Most Popular
                  </span>
                </div>
              )}

              <div style={{ paddingRight: plan.isHot ? 28 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,92,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutGrid style={{ width: '16px', height: '16px', color: '#FF5C00' }} />
                  </div>
                  <button onClick={() => toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: plan.isActive ? '#4ADE80' : '#8892B0', display: 'flex' }}>
                    {plan.isActive ? <ToggleRight style={{ width: '22px', height: '22px' }} /> : <ToggleLeft style={{ width: '22px', height: '22px' }} />}
                  </button>
                </div>

                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '17px', color: '#fff', marginBottom: '2px' }}>{plan.name}</div>

                {/* FIX: removed "/month" from price display */}
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '24px', color: '#FF5C00', marginBottom: '4px' }}>
                  {plan.price === 0 ? '₹0' : `₹${Math.round(plan.price / 100).toLocaleString('en-IN')}`}
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: '4px' }}>
                    {plan.price === 0 ? 'forever' : ''}
                  </span>
                </div>

                {/* FIX: "lead credits" not "credits/month" */}
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px', fontFamily: 'DM Sans,sans-serif' }}>
                  {plan.leadCredits === -1 ? 'Unlimited lead credits' : `${plan.leadCredits} lead credits`}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', fontFamily: 'DM Sans,sans-serif' }}>
                  {plan.features.length} features · sort #{plan.sortOrder}
                </div>

                {plan.isFeaturedListing && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(232,197,71,0.1)', border: '1px solid rgba(232,197,71,0.25)', borderRadius: '6px', padding: '3px 8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#E8C547', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, letterSpacing: '.04em' }}>
                      ⚡ FEATURED LISTING · {plan.featuredListingDays}d
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => { setModalPlan(plan); setModalOpen(true) }}
                    style={{ flex: 1, padding: '8px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Pencil style={{ width: '12px', height: '12px' }} /> Edit
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${plan.name}"? This cannot be undone.`)) deleteMutation.mutate(plan.id) }}
                    style={{ flex: 1, padding: '8px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Trash2 style={{ width: '12px', height: '12px' }} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {!isLoading && (plans ?? []).length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <LayoutGrid style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif' }}>No subscription plans yet. Create your first plan.</div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <PlanModal
            plan={modalPlan ?? undefined}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </AdminLayout>
  )
}
