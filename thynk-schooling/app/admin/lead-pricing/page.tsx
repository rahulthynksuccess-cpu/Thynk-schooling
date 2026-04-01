'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, DollarSign, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface PricingConfig {
  defaultPricePaise: number
  minPricePaise: number
  maxPricePaise: number
  maskBlurMeters: number
  leadExpiryDays: number
}

const card: React.CSSProperties = { background:'var(--admin-card-bg,#0F1623)', border:'1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius:'14px', padding:'24px' }
const label: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginBottom:'8px', fontFamily:'DM Sans,sans-serif' }
const input: React.CSSProperties = { width:'100%', padding:'11px 14px', background:'var(--admin-card-bg,rgba(255,255,255,0.04))', border:'1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius:'8px', color:'#fff', fontSize:'14px', fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }
const hint: React.CSSProperties = { fontSize:'11px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginTop:'5px', fontFamily:'DM Sans,sans-serif' }

export default function LeadPricingPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<PricingConfig>({
    queryKey: ['admin-lead-pricing'],
    queryFn: () => fetch('/api/admin/lead-pricing-defaults',{cache:'no-store'}).then(r=>r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const [form, setForm] = useState<PricingConfig>({
    defaultPricePaise: 29900,
    minPricePaise:     9900,
    maxPricePaise:     99900,
    maskBlurMeters:    1000,
    leadExpiryDays:    30,
  })

  // Sync form when data loads
  const loaded = data && form.defaultPricePaise === 29900
  if (data && loaded) {
    setForm(data)
  }

  const mutation = useMutation({
    mutationFn: () => fetch('/api/admin/lead-pricing-defaults',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json()),
    onSuccess: () => {
      toast.success('Lead pricing updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin-lead-pricing'] })
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  const set = (k: keyof PricingConfig, v: number) => setForm(p => ({ ...p, [k]: v }))
  const toRupees = (paise: number) => (paise / 100).toFixed(0)
  const toPaise  = (rupees: string) => Math.round(parseFloat(rupees) * 100)

  const INFO_CARDS = [
    { icon: DollarSign, title: 'Default Price', value: `₹${toRupees(form.defaultPricePaise)}`, sub: 'per lead', color: '#FF5C00' },
    { icon: DollarSign, title: 'Min Price',     value: `₹${toRupees(form.minPricePaise)}`,     sub: 'floor',    color: '#60A5FA' },
    { icon: DollarSign, title: 'Max Price',     value: `₹${toRupees(form.maxPricePaise)}`,     sub: 'ceiling',  color: '#4ADE80' },
  ]

  return (
    <AdminLayout title="Lead Pricing" subtitle="Set platform-wide default and floor/ceiling prices for leads">

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }}>
        {INFO_CARDS.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div key={c.title} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.08 }}
              style={{ ...card, display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:`${c.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon style={{ width:'20px', height:'20px', color:c.color }} />
              </div>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'24px', color:'#fff', lineHeight:1 }}>{c.value}</div>
                <div style={{ fontSize:'11px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', marginTop:'3px', fontFamily:'DM Sans,sans-serif' }}>{c.title} · {c.sub}</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Form */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px' }}>
        <div style={card}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'16px', color:'#fff', marginBottom:'20px' }}>Pricing Configuration</h3>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            <div>
              <label style={label}>Default Price (₹)</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', fontFamily:'DM Sans,sans-serif' }}>₹</span>
                <input type="number" value={toRupees(form.defaultPricePaise)} min="1"
                  onChange={e => set('defaultPricePaise', toPaise(e.target.value))}
                  style={{ ...input, paddingLeft:'28px' }} />
              </div>
              <p style={hint}>Applied when school has no custom price set</p>
            </div>
            <div>
              <label style={label}>Floor Price (₹)</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--admin-text-muted,rgba(255,255,255,0.45))' }}>₹</span>
                <input type="number" value={toRupees(form.minPricePaise)} min="1"
                  onChange={e => set('minPricePaise', toPaise(e.target.value))}
                  style={{ ...input, paddingLeft:'28px' }} />
              </div>
              <p style={hint}>Schools cannot set price below this</p>
            </div>
            <div>
              <label style={label}>Ceiling Price (₹)</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--admin-text-muted,rgba(255,255,255,0.45))' }}>₹</span>
                <input type="number" value={toRupees(form.maxPricePaise)} min="1"
                  onChange={e => set('maxPricePaise', toPaise(e.target.value))}
                  style={{ ...input, paddingLeft:'28px' }} />
              </div>
              <p style={hint}>Schools cannot set price above this</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
            <div>
              <label style={label}>Location Blur (meters)</label>
              <input type="number" value={form.maskBlurMeters} min="100" max="5000"
                onChange={e => set('maskBlurMeters', Number(e.target.value))}
                style={input} />
              <p style={hint}>GPS fuzz radius for unpurchased leads</p>
            </div>
            <div>
              <label style={label}>Lead Expiry (days)</label>
              <input type="number" value={form.leadExpiryDays} min="7" max="90"
                onChange={e => set('leadExpiryDays', Number(e.target.value))}
                style={input} />
              <p style={hint}>Days before a lead expires automatically</p>
            </div>
          </div>

          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FF5C00', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'13px', fontWeight:600, cursor:'pointer', opacity: mutation.isPending ? .6 : 1, fontFamily:'DM Sans,sans-serif' }}>
            {mutation.isPending ? <><Loader2 style={{ width:'15px', height:'15px', animation:'spin 1s linear infinite' }} /> Saving…</> : <><Save style={{ width:'15px', height:'15px' }} /> Save Pricing</>}
          </button>
        </div>

        {/* Info panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ ...card, background:'rgba(255,92,0,0.06)', borderColor:'rgba(255,92,0,0.2)' }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
              <Info style={{ width:'16px', height:'16px', color:'#FF5C00', flexShrink:0, marginTop:'1px' }} />
              <span style={{ fontSize:'13px', fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>How Lead Pricing Works</span>
            </div>
            <ul style={{ padding:'0 0 0 16px', margin:0, display:'flex', flexDirection:'column', gap:'7px' }}>
              {[
                'When a parent applies to a school, a lead is created',
                'School sees masked info (first name + last 5 digits)',
                'School pays the price per lead to unlock full details',
                'School can set their own price within floor-ceiling range',
                'If no custom price, the default price applies',
              ].map((t, i) => (
                <li key={i} style={{ fontSize:'12px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>{t}</li>
              ))}
            </ul>
          </div>

          <div style={card}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--admin-text-muted,rgba(255,255,255,0.45))', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'DM Sans,sans-serif' }}>Current Settings</div>
            {[
              { label:'Default', value:`₹${toRupees(form.defaultPricePaise)}/lead` },
              { label:'Floor',   value:`₹${toRupees(form.minPricePaise)}/lead` },
              { label:'Ceiling', value:`₹${toRupees(form.maxPricePaise)}/lead` },
              { label:'GPS Blur',value:`${form.maskBlurMeters}m radius` },
              { label:'Expiry',  value:`${form.leadExpiryDays} days` },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1E2A52' }}>
                <span style={{ fontSize:'12px', color:'var(--admin-text-muted,rgba(255,255,255,0.45))', fontFamily:'DM Sans,sans-serif' }}>{r.label}</span>
                <span style={{ fontSize:'13px', fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
