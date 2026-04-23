'use client'
export const dynamic = 'force-dynamic'
import { useRef, useState, useEffect, Suspense } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Check, ArrowRight, Star, Zap, Tag, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useContent } from '@/hooks/useContent'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────
const DEFAULT_FAQ = [
  { q: 'What is a lead credit?', a: 'One lead credit = one parent enquiry. When a parent fills an admission form for your school, you use a credit to unlock their full contact details.' },
  { q: 'Can I try before I pay?', a: 'Yes! Our Free subscription plan lets you list your school and receive lead credits included at no cost. No credit card required.' },
  { q: 'Do credits roll over?', a: 'Lead credits are included with your subscription plan purchase. Use them to unlock parent contact details anytime.' },
  { q: 'Can I change plans anytime?', a: 'Yes. Upgrade or downgrade instantly from your school dashboard. Unused credits from the old plan carry over for 30 days.' },
  { q: 'What is a Featured Listing?', a: 'Featured schools appear at the top of search results with a special badge and get significantly more parent enquiries. You can choose a 7, 30, or 90-day spotlight period.' },
  { q: 'Is there a setup fee?', a: 'Never. Listing is free, plans are monthly with no lock-in, and you can cancel anytime.' },
]

interface SubPlan {
  id: string; planKey: string; name: string; description: string
  price: number; leadCount: number; features: string[]
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
}
interface FeaturedPlan {
  id: string; planKey: string; name: string; description: string
  price: number; durationDays: number; features: string[]
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
}
interface CouponResult {
  valid: boolean; coupon_id?: string; code?: string
  discount_paise?: number; final_amount_paise?: number; message: string
}

const ease = [0.22, 1, 0.36, 1] as const

// ─── Shared feature row helpers ───────────────────────────────────────────────
const PRICING_LEADS_FEATURES = [
  { key: 'lead_count',    label: 'Lead Credits',         render: (p: SubPlan) => p.leadCount === -1 ? '∞ Unlimited' : `${p.leadCount} credits` },
  { key: 'price',         label: 'Price',                render: (p: SubPlan) => p.price === 0 ? 'Free' : `₹${Math.round(p.price/100).toLocaleString('en-IN')}` },
  { key: 'cost_per_lead', label: 'Cost per Lead',        render: (p: SubPlan) => p.leadCount > 0 && p.price > 0 ? `₹${Math.round(p.price/100/p.leadCount)}` : p.leadCount === -1 ? 'Unlimited' : '₹0' },
  { key: 'verified',      label: 'Verified Badge',       render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('verified')) ? '✓' : '—' },
  { key: 'analytics',     label: 'Analytics Dashboard',  render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('analytic')) ? '✓' : '—' },
  { key: 'photos',        label: 'Unlimited Photos',     render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('unlimited photo')) ? '✓' : '—' },
  { key: 'whatsapp',      label: 'WhatsApp Support',     render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('whatsapp')) ? '✓' : '—' },
  { key: 'account_mgr',   label: 'Account Manager',      render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('account manager')) ? '✓' : '—' },
  { key: 'featured_badge', label: 'Featured Badge',      render: (p: SubPlan) => p.features?.some(f => f.toLowerCase().includes('featured')) ? '✓' : '—' },
  { key: 'placement',     label: 'Search Placement',     render: (p: SubPlan) => {
    if (p.features?.some(f => f.toLowerCase().includes('top-of-search') || f.toLowerCase().includes('top placement'))) return 'Top of Search'
    if (p.features?.some(f => f.toLowerCase().includes('enhanced'))) return 'Enhanced'
    return 'Standard'
  }},
]

function PricingLeadsComparisonTable({ plans, isSchoolUser, onSelect }: {
  plans: SubPlan[]; isSchoolUser: boolean; onSelect: (p: SubPlan) => void
}) {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, ease }}
      style={{
        marginTop: 32,
        background: '#0D1117',
        border: '1px solid rgba(232,197,71,0.2)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 18, color: '#FAF7F2', margin: 0 }}>Plan Comparison</h3>
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,247,242,0.4)' }}>Full feature breakdown side by side</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter,sans-serif', fontSize: 14, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 180 }} />
            {sorted.map(p => <col key={p.id} />)}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(250,247,242,0.35)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Feature</th>
              {sorted.map(p => (
                <th key={p.id} style={{ padding: '14px 12px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.1)' : undefined }}>
                  <div style={{ position: 'relative', paddingTop: p.isHot ? 20 : 0 }}>
                    {p.isHot && (
                      <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#B8860B,#E8C547)', color: '#0D1117', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '.06em' }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 18, color: p.isHot ? '#E8C547' : '#FAF7F2' }}>{p.name}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_LEADS_FEATURES.map((feat, ri) => (
              <tr key={feat.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '11px 18px', color: 'rgba(250,247,242,0.75)', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>{feat.label}</td>
                {sorted.map(p => {
                  const val = feat.render(p)
                  const isCheck = val === '✓'
                  const isCross = val === '—'
                  const isHighlight = feat.key === 'lead_count' || feat.key === 'price'
                  return (
                    <td key={p.id} style={{ padding: '11px 12px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.05)' : undefined }}>
                      {isCheck ? (
                        <span style={{ color: '#4ADE80', fontSize: 16, fontWeight: 700 }}>✓</span>
                      ) : isCross ? (
                        <span style={{ color: 'rgba(250,247,242,0.2)', fontSize: 15 }}>—</span>
                      ) : (
                        <span style={{
                          fontFamily: isHighlight ? '"Cormorant Garamond",serif' : 'Inter,sans-serif',
                          fontSize: isHighlight ? 18 : 13,
                          fontWeight: isHighlight ? 700 : 500,
                          color: isHighlight ? '#E8C547' : 'rgba(250,247,242,0.85)',
                        }}>{val}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* CTA row */}
            <tr style={{ background: 'rgba(184,134,11,0.07)', borderTop: '1px solid rgba(184,134,11,0.2)' }}>
              <td style={{ padding: '14px 18px', color: 'rgba(250,247,242,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Get Started</td>
              {sorted.map(p => (
                <td key={p.id} style={{ padding: '14px 10px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.07)' : undefined }}>
                  {isSchoolUser ? (
                    <button onClick={() => onSelect(p)} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, background: p.isHot ? 'linear-gradient(135deg,#B8860B,#E8C547)' : 'rgba(255,255,255,0.1)', color: p.isHot ? '#0D1117' : '#FAF7F2', whiteSpace: 'nowrap' }}>
                      {p.price === 0 ? 'Activate Free' : p.cta || 'Choose Plan'}
                    </button>
                  ) : (
                    <Link href={`/register?role=school&plan=${p.planKey}`} style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 8, fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, background: p.isHot ? 'linear-gradient(135deg,#B8860B,#E8C547)' : 'rgba(255,255,255,0.1)', color: p.isHot ? '#0D1117' : '#FAF7F2', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      {p.cta || 'Get Started'}
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

const PRICING_FEATURED_FEATURES = [
  { key: 'duration',    label: 'Duration',       render: (p: FeaturedPlan) => { const d = p.durationDays; return d >= 30 ? `${Math.round(d/30)} Month${Math.round(d/30)>1?'s':''}` : `${d} Days` }},
  { key: 'price',       label: 'Price',          render: (p: FeaturedPlan) => `₹${Math.round(p.price/100).toLocaleString('en-IN')}` },
  { key: 'per_day',     label: 'Cost per Day',   render: (p: FeaturedPlan) => p.durationDays > 0 ? `₹${Math.round(p.price/100/p.durationDays)}` : '—' },
  { key: 'placement',   label: 'Top of Search',  render: () => '✓' },
  { key: 'badge',       label: 'Featured Badge', render: () => '✓' },
  { key: 'boost',       label: 'Visibility',     render: (p: FeaturedPlan) => { const d = p.durationDays; if(d>=90) return 'Maximum'; if(d>=30) return 'High'; return 'Standard' }},
  { key: 'best_for',    label: 'Best For',       render: (p: FeaturedPlan) => { const d = p.durationDays; if(d<=15) return 'Trial / Events'; if(d<=45) return 'Admission Season'; return 'Year-round' }},
]

function PricingFeaturedComparisonTable({ plans, isSchoolUser }: { plans: FeaturedPlan[]; isSchoolUser: boolean }) {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)
  const fmtDays = (d: number) => d >= 30 ? `${Math.round(d/30)} month${Math.round(d/30)>1?'s':''}` : `${d} days`
  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, ease }}
      style={{
        marginTop: 32,
        background: '#0D1117',
        border: '1px solid rgba(232,197,71,0.2)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 18, color: '#FAF7F2', margin: 0 }}>Featured Package Comparison</h3>
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,247,242,0.4)' }}>Choose the right spotlight duration</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter,sans-serif', fontSize: 14, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 180 }} />
            {sorted.map(p => <col key={p.id} />)}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(250,247,242,0.35)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Feature</th>
              {sorted.map(p => (
                <th key={p.id} style={{ padding: '14px 12px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.1)' : undefined }}>
                  <div style={{ position: 'relative', paddingTop: p.isHot ? 20 : 0 }}>
                    {p.isHot && (
                      <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#B8860B,#E8C547)', color: '#0D1117', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '.06em' }}>
                        BEST VALUE
                      </div>
                    )}
                    <div style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 18, color: p.isHot ? '#E8C547' : '#FAF7F2' }}>{p.name}</div>
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#B8860B', fontWeight: 600, marginTop: 3 }}>⏱ {fmtDays(p.durationDays)}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_FEATURED_FEATURES.map((feat, ri) => (
              <tr key={feat.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '11px 18px', color: 'rgba(250,247,242,0.75)', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>{feat.label}</td>
                {sorted.map(p => {
                  const val = feat.render(p)
                  const isCheck = val === '✓'
                  const isHighlight = feat.key === 'duration' || feat.key === 'price'
                  return (
                    <td key={p.id} style={{ padding: '11px 12px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.05)' : undefined }}>
                      {isCheck ? (
                        <span style={{ color: '#4ADE80', fontSize: 16, fontWeight: 700 }}>✓</span>
                      ) : (
                        <span style={{
                          fontFamily: isHighlight ? '"Cormorant Garamond",serif' : 'Inter,sans-serif',
                          fontSize: isHighlight ? 18 : 13,
                          fontWeight: isHighlight ? 700 : 500,
                          color: isHighlight ? '#E8C547' : feat.key === 'boost' && val === 'Maximum' ? '#E8C547' : 'rgba(250,247,242,0.85)',
                        }}>{val}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr style={{ background: 'rgba(184,134,11,0.07)', borderTop: '1px solid rgba(184,134,11,0.2)' }}>
              <td style={{ padding: '14px 18px', color: 'rgba(250,247,242,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Get Featured</td>
              {sorted.map(p => (
                <td key={p.id} style={{ padding: '14px 10px', textAlign: 'center', background: p.isHot ? 'rgba(184,134,11,0.07)' : undefined }}>
                  <Link href={isSchoolUser ? '/dashboard/school/packages?tab=featured' : '/register?role=school'} style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 8, fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, background: p.isHot ? 'linear-gradient(135deg,#B8860B,#E8C547)' : 'rgba(255,255,255,0.1)', color: p.isHot ? '#0D1117' : '#FAF7F2', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    {p.cta || 'Get Featured'}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ plan, onClose }: { plan: SubPlan; onClose: () => void }) {
  const [gateway, setGateway]         = useState<'razorpay' | 'cashfree'>('razorpay')
  const [couponCode, setCouponCode]   = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const effectiveAmount = couponResult?.valid ? couponResult.final_amount_paise! : plan.price
  const displayPrice = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode.trim(), amount_paise: plan.price, gateway }) })
      setCouponResult(await res.json())
    } catch { setCouponResult({ valid: false, message: 'Failed to validate coupon' }) }
    finally { setCouponLoading(false) }
  }

  const checkoutUrl = `/dashboard/school/packages?tab=leads&planKey=${plan.planKey}&gateway=${gateway}${couponResult?.valid ? `&coupon_id=${couponResult.coupon_id}` : ''}`

  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)' }} onClick={onClose} />
      <motion.div initial={{ opacity:0,scale:0.96,y:20 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.96,y:20 }} transition={{ duration:0.28,ease }}
        style={{ position:'relative',zIndex:1,background:'#0D1117',border:'1px solid rgba(184,134,11,0.25)',borderRadius:18,padding:28,width:'100%',maxWidth:440,boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
          <div>
            <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#FAF7F2',lineHeight:1 }}>{plan.name}</div>
            <div style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'rgba(250,247,242,0.45)',marginTop:4 }}>Complete your subscription</div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(250,247,242,0.4)',display:'flex',padding:4 }}>
            <X style={{ width:18,height:18 }} />
          </button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'14px 16px',marginBottom:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:couponResult?.valid?8:0 }}>
            <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(250,247,242,0.55)' }}>Subtotal</span>
            <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:18,color:'#FAF7F2' }}>{displayPrice(plan.price)}</span>
          </div>
          {couponResult?.valid && <>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#4ADE80' }}>Discount ({couponResult.code})</span>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#4ADE80' }}>−{displayPrice(couponResult.discount_paise!)}</span>
            </div>
            <div style={{ height:1,background:'rgba(255,255,255,0.07)',marginBottom:8 }} />
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#FAF7F2' }}>Total</span>
              <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#E8C547' }}>{displayPrice(effectiveAmount)}</span>
            </div>
          </>}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(250,247,242,0.45)',marginBottom:8 }}>Coupon Code</label>
          {couponResult?.valid ? (
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:10 }}>
              <CheckCircle2 style={{ width:15,height:15,color:'#4ADE80',flexShrink:0 }} />
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#4ADE80',flex:1 }}>{couponResult.message}</span>
              <button onClick={()=>{setCouponResult(null);setCouponCode('')}} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(74,222,128,0.6)',display:'flex',padding:2 }}><X style={{ width:14,height:14 }} /></button>
            </div>
          ) : (
            <>
              <div style={{ display:'flex',gap:8 }}>
                <div style={{ flex:1,position:'relative' }}>
                  <Tag style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'rgba(250,247,242,0.3)' }} />
                  <input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponResult(null)}} onKeyDown={e=>e.key==='Enter'&&validateCoupon()} placeholder="ENTER CODE"
                    style={{ width:'100%',padding:'11px 14px 11px 36px',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#FAF7F2',fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',letterSpacing:'.05em' }} />
                </div>
                <button onClick={validateCoupon} disabled={!couponCode.trim()||couponLoading}
                  style={{ padding:'11px 16px',borderRadius:10,border:'1px solid rgba(184,134,11,0.4)',background:'rgba(184,134,11,0.1)',color:'#E8C547',fontSize:13,fontWeight:600,cursor:couponCode.trim()?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6,opacity:couponCode.trim()?1:0.5 }}>
                  {couponLoading?<Loader2 style={{ width:14,height:14,animation:'spin 1s linear infinite' }}/>:'Apply'}
                </button>
              </div>
              {couponResult&&!couponResult.valid&&(
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8 }}>
                  <AlertCircle style={{ width:13,height:13,color:'#F87171',flexShrink:0 }} />
                  <span style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'#F87171' }}>{couponResult.message}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block',fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(250,247,242,0.45)',marginBottom:8 }}>Payment Gateway</label>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {(['razorpay','cashfree'] as const).map(gw=>(
              <button key={gw} onClick={()=>{setGateway(gw);if(couponResult?.valid)validateCoupon()}}
                style={{ padding:'12px 14px',borderRadius:10,cursor:'pointer',border:`1px solid ${gateway===gw?'rgba(184,134,11,0.5)':'rgba(255,255,255,0.1)'}`,background:gateway===gw?'rgba(184,134,11,0.12)':'rgba(255,255,255,0.03)',color:gateway===gw?'#E8C547':'rgba(250,247,242,0.5)',fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,textTransform:'capitalize',transition:'all .15s' }}>
                {gw==='razorpay'?'Razorpay':'Cashfree'}
              </button>
            ))}
          </div>
        </div>

        <Link href={checkoutUrl}
          style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 24px',borderRadius:12,background:'linear-gradient(135deg,#B8860B,#E8C547)',color:'#0D1117',fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:700,textDecoration:'none' }}>
          Proceed to Pay {displayPrice(effectiveAmount)} <ArrowRight style={{ width:14,height:14 }} />
        </Link>
        <p style={{ textAlign:'center',fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(250,247,242,0.3)',marginTop:14,marginBottom:0 }}>Secure payment · Cancel anytime · No hidden fees</p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Inner pricing page ───────────────────────────────────────────────────────
function PricingInner() {
  const [openFaq, setOpenFaq]           = useState<number | null>(null)
  const [checkoutPlan, setCheckoutPlan] = useState<SubPlan | null>(null)
  const [activeTab, setActiveTab]       = useState<'leads' | 'featured'>('leads')
  const { user, isAuthenticated }       = useAuthStore()
  const isSchoolUser = isAuthenticated && user?.role === 'school_admin'
  const pricingContent = useContent('pricing')
  const searchParams   = useSearchParams()
  const router         = useRouter()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'featured') setActiveTab('featured')
    else setActiveTab('leads')
  }, [searchParams])

  const handleTabChange = (t: 'leads' | 'featured') => {
    setActiveTab(t)
    router.replace(`/pricing?tab=${t}`, { scroll: false })
  }

  const { data: subPlans, isLoading: plansLoading } = useQuery<SubPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => fetch('/api/admin?action=subscription-plans').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
  const { data: featData, isLoading: featLoading } = useQuery<{ plans: FeaturedPlan[] }>({
    queryKey: ['featured-listing-plans-public'],
    queryFn: () => fetch('/api/featured-listing-plans').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const faqRef    = useRef(null)
  const plansRef  = useRef(null)
  const faqInView = useInView(faqRef, { once: true })
  const plansInView = useInView(plansRef, { once: true, amount: 0.1 })

  const activeLeadPlans = (subPlans ?? []).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const activeFeatPlans = (featData?.plans ?? []).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  const FAQ = DEFAULT_FAQ.map((def, i) => ({
    q: pricingContent?.[`faq${i + 1}q`] || def.q,
    a: pricingContent?.[`faq${i + 1}a`] || def.a,
  }))

  const fmt     = (p: number) => p === 0 ? { label: '₹0', period: 'forever' } : { label: `₹${Math.round(p/100).toLocaleString('en-IN')}`, period: '' }
  const fmtDays = (d: number) => d >= 30 ? `${Math.round(d/30)} month${Math.round(d/30)>1?'s':''}` : `${d} days`

  // ── Allow up to 5 cards for both tabs ──
  const leadCols = Math.min(Math.max(activeLeadPlans.length, 1), 5)
  const featCols = Math.min(Math.max(activeFeatPlans.length, 1), 5)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        .pricing-page-root { background: #0A0E17; }
        .pricing-hero-grid { position:absolute;inset:0;pointer-events:none;overflow:hidden;background:radial-gradient(ellipse 60% 60% at 50% -10%,rgba(184,134,11,0.18) 0%,transparent 60%),linear-gradient(rgba(184,134,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(184,134,11,0.04) 1px,transparent 1px);background-size:100% 100%,48px 48px,48px 48px;mask-image:radial-gradient(ellipse 90% 80% at 50% 0%,black 30%,transparent 100%); }
        .pricing-orb { position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);animation:orbFloat 14s ease-in-out infinite; }
        .pricing-orb-1 { width:400px;height:400px;background:rgba(184,134,11,0.10);top:-80px;left:10%;animation-delay:0s; }
        .pricing-orb-2 { width:280px;height:280px;background:rgba(45,212,191,0.06);top:60px;right:8%;animation-delay:-7s; }
        @keyframes orbFloat { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-28px) scale(1.06)} }

        /* ── Plan cards ── */
        .pc-card { background:#F5F0E8;border:1px solid rgba(13,17,23,0.08);border-radius:16px;padding:28px 22px 24px;display:flex;flex-direction:column;position:relative;overflow:hidden;transition:transform 0.22s cubic-bezier(.22,1,.36,1),box-shadow 0.22s cubic-bezier(.22,1,.36,1);min-height:420px; }
        .pc-card:hover { transform:translateY(-5px);box-shadow:0 20px 48px rgba(13,17,23,0.12); }
        .pc-card.hot { background:#0D1117;border-color:rgba(184,134,11,0.35);box-shadow:0 0 0 1px rgba(184,134,11,0.18),0 8px 40px rgba(184,134,11,0.12); }
        .pc-card.hot:hover { transform:translateY(-7px);box-shadow:0 0 0 1px rgba(184,134,11,0.35),0 24px 56px rgba(184,134,11,0.2); }
        .pc-card.hot::before { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(105deg,transparent 40%,rgba(232,197,71,0.07) 50%,transparent 60%);animation:cardShimmer 4s ease-in-out infinite;pointer-events:none; }
        @keyframes cardShimmer { 0%{left:-100%} 40%{left:140%} 100%{left:140%} }
        .pc-hot-badge { position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#B8860B,#E8C547);color:#0D1117;font-family:Inter,sans-serif;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:4px; }
        .pc-check { width:15px;height:15px;border-radius:50%;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center; }
        .pc-check.light { background:rgba(13,17,23,0.06);border:1px solid rgba(13,17,23,0.1); }
        .pc-check.gold  { background:rgba(184,134,11,0.15);border:1px solid rgba(184,134,11,0.3); }

        .plans-watermark { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond',serif;font-size:clamp(120px,18vw,220px);font-weight:700;color:rgba(13,17,23,0.022);white-space:nowrap;pointer-events:none;user-select:none;letter-spacing:-8px; }

        .faq-item { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;transition:border-color 0.2s; }
        .faq-item.open { border-color:rgba(184,134,11,0.4); }
        .faq-trigger { width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border:none;background:transparent;cursor:pointer;text-align:left; }
        .faq-icon { width:20px;height:20px;border-radius:50%;flex-shrink:0;background:rgba(184,134,11,0.12);border:1px solid rgba(184,134,11,0.25);display:flex;align-items:center;justify-content:center;transition:transform 0.25s cubic-bezier(.22,1,.36,1),background 0.2s; }
        .faq-item.open .faq-icon { transform:rotate(45deg);background:rgba(184,134,11,0.2); }

        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer-text { background:linear-gradient(90deg,#B8860B 0%,#E8C547 40%,#F5D67A 50%,#E8C547 60%,#B8860B 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite; }
        .pricing-stat { display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 clamp(12px,2vw,28px); }
        .pricing-stat + .pricing-stat { border-left:1px solid rgba(250,247,242,0.1); }

        /* Responsive: 5 → 3 → 2 → 1 */
        @media (max-width:1100px) { .plans-grid-5 { grid-template-columns:repeat(3,1fr) !important; } }
        @media (max-width:760px)  { .plans-grid-5 { grid-template-columns:repeat(2,1fr) !important; } .plans-grid-4 { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:520px)  { .plans-grid-5,.plans-grid-4,.plans-grid-3 { grid-template-columns:1fr !important; } }

        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <Navbar />
      <main className="pricing-page-root" style={{ paddingTop: 72 }}>

        {/* ── HERO ── */}
        <section style={{ position:'relative',padding:'clamp(56px,8vw,96px) 0 clamp(40px,6vw,72px)',display:'flex',alignItems:'center',overflow:'hidden',background:'linear-gradient(160deg,#0D1117 0%,#1a2540 60%,#0D1117 100%)' }}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="pg1" cx="20%" cy="30%"><stop stopColor="#B8860B" stopOpacity=".12"><animate attributeName="cx" values="20%;40%;20%" dur="18s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#B8860B" stopOpacity="0"/></radialGradient>
              <radialGradient id="pg2" cx="80%" cy="70%"><stop stopColor="#0A5F55" stopOpacity=".07"><animate attributeName="cx" values="80%;60%;80%" dur="22s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#0A5F55" stopOpacity="0"/></radialGradient>
              <filter id="pbl"><feGaussianBlur stdDeviation="60"/></filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#pg1)" filter="url(#pbl)"/>
            <rect width="100%" height="100%" fill="url(#pg2)" filter="url(#pbl)"/>
          </svg>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(184,134,11,0.08) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:'50%',right:'8%',width:400,height:400,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.12)',transform:'translate(0,-50%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:'50%',right:'8%',width:280,height:280,borderRadius:'50%',border:'1px solid rgba(184,134,11,0.08)',transform:'translate(60px,-50%)',pointerEvents:'none'}}/>

          <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px)',width:'100%',position:'relative',zIndex:1 }}>
            <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.55,ease }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16 }}>
              <span style={{ width:24,height:1,background:'linear-gradient(90deg,transparent,#B8860B)' }} />
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'#E8C547' }}>For Schools</span>
              <span style={{ width:24,height:1,background:'linear-gradient(90deg,#B8860B,transparent)' }} />
            </motion.div>

            <motion.h1 initial={{ opacity:0,y:28 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.08,ease }}
              style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.6rem,6.5vw,5.5rem)',color:'#FAF7F2',lineHeight:0.92,letterSpacing:'-2px',textAlign:'center',marginBottom:16 }}>
              Simple Pricing,
              <em className="shimmer-text" style={{ display:'block',fontStyle:'italic' }}>Powerful Results</em>
            </motion.h1>

            <motion.p initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6,delay:0.18,ease }}
              style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.5vw,15px)',color:'rgba(250,247,242,0.5)',lineHeight:1.7,fontWeight:300,maxWidth:460,margin:'0 auto 22px',textAlign:'center' }}>
              List free. Get lead credits with a subscription. Boost visibility with a Featured Listing. No lock-in.
            </motion.p>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.32,duration:0.55 }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:32 }}>
              <div style={{ display:'flex',gap:2 }}>
                {[1,2,3,4,5].map(s=><Star key={s} style={{ width:12,height:12,fill:'#E8C547',color:'#E8C547' }}/>)}
              </div>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'rgba(250,247,242,0.4)',fontWeight:300 }}>
                Trusted by <strong style={{ color:'rgba(250,247,242,0.7)',fontWeight:600 }}>8,000+ schools</strong> across India
              </span>
            </motion.div>

            <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.42,duration:0.6,ease }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:0,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'clamp(14px,1.8vw,20px) clamp(10px,1.5vw,20px)',maxWidth:640,margin:'0 auto' }}>
              {[{ n:'12,000+',l:'Schools Listed' },{ n:'8,000+',l:'Subscribers' },{ n:'350+',l:'Cities' },{ n:'₹0',l:'Setup Fee' }].map((s,i)=>(
                <div key={i} className="pricing-stat">
                  <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(20px,2.2vw,26px)',color:'#E8C547',letterSpacing:'-1px',lineHeight:1 }}>{s.n}</span>
                  <span style={{ fontFamily:'Inter,sans-serif',fontSize:9,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(250,247,242,0.4)',marginTop:2 }}>{s.l}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section ref={plansRef} style={{ background:'#F5F0E8',padding:'clamp(48px,6vw,72px) 0',position:'relative',overflow:'hidden' }}>
          <div className="plans-watermark">PLANS</div>

          <div style={{ maxWidth:1320,margin:'0 auto',padding:'0 clamp(16px,4vw,56px)',position:'relative' }}>

            {/* Section heading */}
            <motion.div initial={{ opacity:0,y:12 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.5,ease }}
              style={{ textAlign:'center',marginBottom:28 }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <span style={{ width:18,height:1,background:'#B8860B' }} />
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B' }}>Choose a Plan</span>
                <span style={{ width:18,height:1,background:'#B8860B' }} />
              </div>
              <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(1.9rem,3.5vw,3rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95 }}>
                Plans that grow<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>with your school</em>
              </h2>
            </motion.div>

            {/* Tab switcher */}
            <div style={{ display:'flex',justifyContent:'center',marginBottom:28 }}>
              <div style={{ display:'flex',background:'rgba(13,17,23,0.07)',border:'1px solid rgba(13,17,23,0.1)',borderRadius:12,padding:3 }}>
                {([
                  { key:'leads',    label:'📋 Leads Package',           sub:'Get lead credits' },
                  { key:'featured', label:'⭐ Feature Listing Package', sub:'Boost your visibility' },
                ] as const).map(tab=>(
                  <button key={tab.key} onClick={()=>handleTabChange(tab.key)}
                    style={{
                      padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer',
                      fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:13, transition:'all .2s',
                      background: activeTab===tab.key ? '#fff' : 'transparent',
                      color: activeTab===tab.key ? '#0D1117' : '#9B8860',
                      boxShadow: activeTab===tab.key ? '0 2px 10px rgba(13,17,23,0.1)' : 'none',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:1,
                    }}>
                    <span>{tab.label}</span>
                    <span style={{ fontSize:9,fontWeight:400,color:activeTab===tab.key?'#9B8860':'#B8A898' }}>{tab.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">

              {/* ── LEADS PLANS ── */}
              {activeTab === 'leads' && (
                <motion.div key="leads" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }} transition={{ duration:.2 }}>
                  {plansLoading ? (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12 }}>
                      {Array.from({length:5}).map((_,i)=><div key={i} style={{ height:380,borderRadius:14,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s infinite' }}/>)}
                    </div>
                  ) : (
                    <div
                      className={`plans-grid plans-grid-${leadCols}`}
                      style={{ display:'grid',gridTemplateColumns:`repeat(${leadCols},1fr)`,gap:'clamp(8px,1.2vw,14px)',alignItems:'start' }}
                    >
                      {activeLeadPlans.map((plan,i)=>{
                        const { label, period } = fmt(plan.price)
                        return (
                          <motion.div key={plan.id} initial={{ opacity:0,y:28,scale:0.97 }} animate={plansInView?{opacity:1,y:0,scale:1}:{}} transition={{ delay:i*0.07,duration:0.55,ease }}>
                            <div className={`pc-card${plan.isHot?' hot':''}`}>
                              {plan.isHot && <div className="pc-hot-badge"><Zap style={{ width:9,height:9 }}/> Most Popular</div>}
                              <div style={{ marginBottom:14 }}>
                                <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:4 }}>{plan.name}</div>
                                <div style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:plan.isHot?'rgba(250,247,242,0.45)':'#8A9AB0',fontWeight:300,lineHeight:1.5 }}>{plan.description}</div>
                              </div>
                              <div style={{ marginBottom:plan.leadCount!==0?7:18,display:'flex',alignItems:'baseline',gap:4 }}>
                                <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,3.5vw,2.8rem)',color:plan.isHot?'#E8C547':'#0D1117',letterSpacing:'-1.5px',lineHeight:1 }}>{label}</span>
                                <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:plan.isHot?'rgba(250,247,242,0.4)':'#A0ADB8',fontWeight:300 }}>{period}</span>
                              </div>
                              {plan.leadCount !== 0 && (
                                <div style={{ display:'inline-flex',alignItems:'center',gap:4,marginBottom:14,padding:'4px 10px',borderRadius:6,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                                  <span style={{ fontSize:12,fontWeight:700,color:'#B8860B' }}>{plan.leadCount===-1?'∞ Unlimited':`${plan.leadCount}`} lead credits</span>
                                </div>
                              )}
                              <div style={{ height:1,background:plan.isHot?'rgba(255,255,255,0.07)':'rgba(13,17,23,0.07)',marginBottom:14 }} />
                              <div style={{ display:'flex',flexDirection:'column',gap:9,flex:1,marginBottom:18 }}>
                                {plan.features.map(f=>(
                                  <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:8,fontFamily:'Inter,sans-serif',fontSize:13,color:plan.isHot?'rgba(250,247,242,0.75)':'#4A5568',fontWeight:400,lineHeight:1.4 }}>
                                    <div className={`pc-check ${plan.isHot?'gold':'light'}`}><Check style={{ width:9,height:9,color:plan.isHot?'#E8C547':'#6B7280' }}/></div>
                                    {f}
                                  </div>
                                ))}
                              </div>
                              {isSchoolUser ? (
                                <button onClick={()=>setCheckoutPlan(plan)}
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',alignItems:'center',gap:5,fontSize:14,width:'100%',cursor:'pointer',padding:'13px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700 }}>
                                  {plan.cta} <ArrowRight style={{ width:13,height:13 }}/>
                                </button>
                              ) : (
                                <Link href={`/register?role=school&plan=${plan.planKey}`}
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',alignItems:'center',gap:5,fontSize:14,padding:'13px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none' }}>
                                  {plan.cta} <ArrowRight style={{ width:13,height:13 }}/>
                                </Link>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  <motion.p initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.3,duration:0.5 }}
                    style={{ textAlign:'center',marginTop:20,fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8',fontWeight:300 }}>
                    All prices in INR · Cancel anytime · No credit card needed for Free plan · Buy single leads from your Leads page
                  </motion.p>

                  {/* Comparison table — dark bg on light section is rendered correctly */}
                  {!plansLoading && activeLeadPlans.length > 0 && (
                    <PricingLeadsComparisonTable plans={activeLeadPlans} isSchoolUser={isSchoolUser} onSelect={setCheckoutPlan} />
                  )}
                </motion.div>
              )}

              {/* ── FEATURED PLANS ── */}
              {activeTab === 'featured' && (
                <motion.div key="featured" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }} transition={{ duration:.2 }}>
                  {featLoading ? (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,maxWidth:900,margin:'0 auto' }}>
                      {[1,2,3].map(i=><div key={i} style={{ height:420,borderRadius:14,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s infinite' }}/>)}
                    </div>
                  ) : activeFeatPlans.length === 0 ? (
                    <div style={{ textAlign:'center',padding:'48px 24px',color:'#9B8860' }}>
                      <Zap style={{ width:28,height:28,margin:'0 auto 10px',opacity:.4 }} />
                      <p>No featured listing packages available right now.</p>
                    </div>
                  ) : (
                    <div
                      className={`plans-grid plans-grid-${featCols}`}
                      style={{ display:'grid',gridTemplateColumns:`repeat(${featCols},1fr)`,gap:'clamp(8px,1.2vw,14px)',alignItems:'start',maxWidth: featCols <= 3 ? 900 : '100%',margin:'0 auto' }}
                    >
                      {activeFeatPlans.map((plan,i)=>{
                        const { label } = fmt(plan.price)
                        return (
                          <motion.div key={plan.id} initial={{ opacity:0,y:28,scale:0.97 }} animate={plansInView?{opacity:1,y:0,scale:1}:{}} transition={{ delay:i*0.07,duration:0.55,ease }}>
                            <div className={`pc-card${plan.isHot?' hot':''}`}>
                              {plan.isHot && <div className="pc-hot-badge"><Star style={{ width:9,height:9 }}/> Best Value</div>}
                              <div style={{ display:'inline-flex',alignItems:'center',gap:4,marginBottom:12,padding:'4px 10px',borderRadius:6,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                                <span style={{ fontSize:13,fontWeight:700,color:'#B8860B' }}>⏱ {fmtDays(plan.durationDays)}</span>
                              </div>
                              <div style={{ marginBottom:14 }}>
                                <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:4 }}>{plan.name}</div>
                                <div style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:plan.isHot?'rgba(250,247,242,0.45)':'#8A9AB0',fontWeight:300,lineHeight:1.5 }}>{plan.description}</div>
                              </div>
                              <div style={{ marginBottom:18,display:'flex',alignItems:'baseline',gap:4 }}>
                                <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,3.5vw,2.8rem)',color:plan.isHot?'#E8C547':'#0D1117',letterSpacing:'-1.5px',lineHeight:1 }}>{label}</span>
                              </div>
                              <div style={{ height:1,background:plan.isHot?'rgba(255,255,255,0.07)':'rgba(13,17,23,0.07)',marginBottom:14 }} />
                              <div style={{ display:'flex',flexDirection:'column',gap:9,flex:1,marginBottom:18 }}>
                                {plan.features.map(f=>(
                                  <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:8,fontFamily:'Inter,sans-serif',fontSize:13,color:plan.isHot?'rgba(250,247,242,0.75)':'#4A5568',fontWeight:400,lineHeight:1.4 }}>
                                    <div className={`pc-check ${plan.isHot?'gold':'light'}`}><Check style={{ width:9,height:9,color:plan.isHot?'#E8C547':'#6B7280' }}/></div>
                                    {f}
                                  </div>
                                ))}
                              </div>
                              {isSchoolUser ? (
                                <Link href="/dashboard/school/packages?tab=featured"
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',alignItems:'center',gap:5,fontSize:14,padding:'13px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none' }}>
                                  {plan.cta || 'Get Featured'} <ArrowRight style={{ width:13,height:13 }}/>
                                </Link>
                              ) : (
                                <Link href="/register?role=school"
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',alignItems:'center',gap:5,fontSize:14,padding:'13px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none' }}>
                                  {plan.cta || 'Get Featured'} <ArrowRight style={{ width:13,height:13 }}/>
                                </Link>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  <motion.p initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.3,duration:0.5 }}
                    style={{ textAlign:'center',marginTop:20,fontFamily:'Inter,sans-serif',fontSize:11,color:'#A0ADB8',fontWeight:300 }}>
                    All prices in INR · Featured listing activates immediately after payment
                  </motion.p>

                  {!featLoading && activeFeatPlans.length > 0 && (
                    <PricingFeaturedComparisonTable plans={activeFeatPlans} isSchoolUser={isSchoolUser} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section ref={faqRef} style={{ background:'#0A0E17',padding:'clamp(48px,7vw,80px) 0',position:'relative' }}>
          <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 50% 100%,rgba(184,134,11,0.06) 0%,transparent 60%)',pointerEvents:'none' }} />
          <div style={{ maxWidth:720,margin:'0 auto',padding:'0 clamp(20px,5vw,40px)',position:'relative',zIndex:1 }}>
            <motion.div initial={{ opacity:0,y:16 }} animate={faqInView?{opacity:1,y:0}:{}} transition={{ duration:0.55,ease }}
              style={{ textAlign:'center',marginBottom:28 }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ width:18,height:1,background:'#B8860B' }} />
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547' }}>FAQ</span>
                <span style={{ width:18,height:1,background:'#B8860B' }} />
              </div>
              <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(1.8rem,3.5vw,3rem)',color:'#FAF7F2',letterSpacing:'-1.5px',lineHeight:0.92 }}>
                Common <em style={{ fontStyle:'italic',color:'#E8C547' }}>Questions</em>
              </h2>
            </motion.div>
            <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
              {FAQ.map((f,i)=>(
                <motion.div key={i} initial={{ opacity:0,x:-14 }} animate={faqInView?{opacity:1,x:0}:{}} transition={{ delay:i*0.06,duration:0.45,ease }}>
                  <div className={`faq-item${openFaq===i?' open':''}`}>
                    <button className="faq-trigger" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                      <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:600,fontSize:'clamp(14px,1.7vw,17px)',color:'#FAF7F2',lineHeight:1.3 }}>{f.q}</span>
                      <div className="faq-icon"><span style={{ color:'#E8C547',fontSize:14,lineHeight:1,fontWeight:300 }}>+</span></div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq===i&&(
                        <motion.div key="a" initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.3,ease:[0.22,1,0.36,1] }} style={{ overflow:'hidden' }}>
                          <p style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(12px,1.3vw,13px)',color:'rgba(250,247,242,0.55)',lineHeight:1.7,fontWeight:300,margin:0,padding:'0 20px 16px' }}>{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{ background:'#F5F0E8',padding:'clamp(40px,5vw,60px) 0' }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.6,ease }}
            style={{ maxWidth:560,margin:'0 auto',padding:'0 24px',textAlign:'center' }}>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(1.8rem,3.5vw,2.8rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95,marginBottom:12 }}>
              Ready to grow<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>admissions?</em>
            </h2>
            <p style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096',fontWeight:300,lineHeight:1.65,marginBottom:20 }}>
              Start free — no credit card needed. Upgrade when you're ready.
            </p>
            <Link href={isSchoolUser?'/dashboard/school/packages':'/register?role=school'}
              style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:13,padding:'13px 26px',borderRadius:11,background:'linear-gradient(135deg,#B8860B,#D4A520)',color:'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none' }}>
              List Your School Free <ArrowRight style={{ width:13,height:13 }}/>
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />

      <AnimatePresence>
        {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={()=>setCheckoutPlan(null)} />}
      </AnimatePresence>
    </>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh',background:'#0A0E17' }} />}>
      <PricingInner />
    </Suspense>
  )
}
