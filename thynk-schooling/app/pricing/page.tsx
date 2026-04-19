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

// ─── Checkout Modal (dark theme for pricing page) ─────────────────────────────
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

// ─── Pricing Tab Bar ──────────────────────────────────────────────────────────
function PricingTabBar({ active, onChange }: { active: 'leads' | 'featured'; onChange: (t: 'leads' | 'featured') => void }) {
  return (
    <div style={{ display:'flex',justifyContent:'center',marginBottom:40 }}>
      <div style={{ display:'flex',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:4 }}>
        {([
          { key:'leads',    label:'📋 Leads Package',           sub:'Get lead credits' },
          { key:'featured', label:'⭐ Feature Listing Package', sub:'Boost your visibility' },
        ] as const).map(tab=>(
          <button key={tab.key} onClick={()=>onChange(tab.key)}
            style={{
              padding:'12px 28px', borderRadius:11, border:'none', cursor:'pointer',
              fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14, transition:'all .2s',
              background: active===tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: active===tab.key ? '#FAF7F2' : 'rgba(250,247,242,0.45)',
              boxShadow: active===tab.key ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            }}>
            <span>{tab.label}</span>
            <span style={{ fontSize:10,fontWeight:400,color:active===tab.key?'rgba(250,247,242,0.5)':'rgba(250,247,242,0.3)' }}>{tab.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Inner pricing page (needs useSearchParams) ───────────────────────────────
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
  const leadCols   = Math.min(Math.max(activeLeadPlans.length, 1), 4)
  const featCols   = Math.min(Math.max(activeFeatPlans.length, 1), 3)

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
        .pc-card { background:#F5F0E8;border:1px solid rgba(13,17,23,0.08);border-radius:18px;padding:28px 24px 24px;display:flex;flex-direction:column;position:relative;overflow:hidden;transition:transform 0.22s cubic-bezier(.22,1,.36,1),box-shadow 0.22s cubic-bezier(.22,1,.36,1); }
        .pc-card:hover { transform:translateY(-6px);box-shadow:0 24px 56px rgba(13,17,23,0.13); }
        .pc-card.hot { background:#0D1117;border-color:rgba(184,134,11,0.35);box-shadow:0 0 0 1px rgba(184,134,11,0.18),0 8px 40px rgba(184,134,11,0.12); }
        .pc-card.hot:hover { transform:translateY(-8px);box-shadow:0 0 0 1px rgba(184,134,11,0.35),0 28px 64px rgba(184,134,11,0.2); }
        .pc-card.hot::before { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(105deg,transparent 40%,rgba(232,197,71,0.07) 50%,transparent 60%);animation:cardShimmer 4s ease-in-out infinite;pointer-events:none; }
        @keyframes cardShimmer { 0%{left:-100%} 40%{left:140%} 100%{left:140%} }
        .pc-hot-badge { position:absolute;top:14px;right:14px;background:linear-gradient(135deg,#B8860B,#E8C547);color:#0D1117;font-family:Inter,sans-serif;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 9px;border-radius:20px;display:flex;align-items:center;gap:4px; }
        .pc-check { width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center; }
        .pc-check.light { background:rgba(13,17,23,0.06);border:1px solid rgba(13,17,23,0.1); }
        .pc-check.gold  { background:rgba(184,134,11,0.15);border:1px solid rgba(184,134,11,0.3); }
        .plans-watermark { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond',serif;font-size:clamp(140px,20vw,260px);font-weight:700;color:rgba(13,17,23,0.025);white-space:nowrap;pointer-events:none;user-select:none;letter-spacing:-8px; }
        .faq-item { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;transition:border-color 0.2s; }
        .faq-item.open { border-color:rgba(184,134,11,0.4); }
        .faq-trigger { width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border:none;background:transparent;cursor:pointer;text-align:left; }
        .faq-icon { width:22px;height:22px;border-radius:50%;flex-shrink:0;background:rgba(184,134,11,0.12);border:1px solid rgba(184,134,11,0.25);display:flex;align-items:center;justify-content:center;transition:transform 0.25s cubic-bezier(.22,1,.36,1),background 0.2s; }
        .faq-item.open .faq-icon { transform:rotate(45deg);background:rgba(184,134,11,0.2); }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer-text { background:linear-gradient(90deg,#B8860B 0%,#E8C547 40%,#F5D67A 50%,#E8C547 60%,#B8860B 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite; }
        .pricing-stat { display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 clamp(16px,2.5vw,32px); }
        .pricing-stat + .pricing-stat { border-left:1px solid rgba(250,247,242,0.1); }
        @media (max-width:900px) { .plans-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:560px)  { .plans-grid { grid-template-columns:1fr !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <Navbar />
      <main className="pricing-page-root" style={{ paddingTop: 72 }}>

        {/* ── HERO ── */}
        <section style={{ position:'relative',padding:'clamp(72px,10vw,120px) 0 clamp(56px,8vw,96px)',display:'flex',alignItems:'center',overflow:'hidden' }}>
          <div className="pricing-hero-grid" />
          <div className="pricing-orb pricing-orb-1" />
          <div className="pricing-orb pricing-orb-2" />

          <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px)',width:'100%',position:'relative',zIndex:1 }}>
            <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.55,ease }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20 }}>
              <span style={{ width:28,height:1,background:'linear-gradient(90deg,transparent,#B8860B)' }} />
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'#E8C547' }}>For Schools</span>
              <span style={{ width:28,height:1,background:'linear-gradient(90deg,#B8860B,transparent)' }} />
            </motion.div>

            <motion.h1 initial={{ opacity:0,y:28 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.08,ease }}
              style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.8rem,7vw,6rem)',color:'#FAF7F2',lineHeight:0.9,letterSpacing:'-2.5px',textAlign:'center',marginBottom:20 }}>
              Simple Pricing,
              <em className="shimmer-text" style={{ display:'block',fontStyle:'italic' }}>Powerful Results</em>
            </motion.h1>

            <motion.p initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6,delay:0.18,ease }}
              style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(14px,1.6vw,16px)',color:'rgba(250,247,242,0.5)',lineHeight:1.75,fontWeight:300,maxWidth:500,margin:'0 auto 28px',textAlign:'center' }}>
              List free. Get lead credits with a subscription. Boost visibility with a Featured Listing. No lock-in.
            </motion.p>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.32,duration:0.55 }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:44 }}>
              <div style={{ display:'flex',gap:2 }}>
                {[1,2,3,4,5].map(s=><Star key={s} style={{ width:13,height:13,fill:'#E8C547',color:'#E8C547' }}/>)}
              </div>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'rgba(250,247,242,0.4)',fontWeight:300 }}>
                Trusted by <strong style={{ color:'rgba(250,247,242,0.7)',fontWeight:600 }}>8,000+ schools</strong> across India
              </span>
            </motion.div>

            <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.42,duration:0.6,ease }}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:0,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'clamp(16px,2vw,24px) clamp(12px,2vw,24px)',maxWidth:680,margin:'0 auto' }}>
              {[{ n:'12,000+',l:'Schools Listed' },{ n:'8,000+',l:'Subscribers' },{ n:'350+',l:'Cities' },{ n:'₹0',l:'Setup Fee' }].map((s,i)=>(
                <div key={i} className="pricing-stat">
                  <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(22px,2.5vw,28px)',color:'#E8C547',letterSpacing:'-1px',lineHeight:1 }}>{s.n}</span>
                  <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(250,247,242,0.4)',marginTop:2 }}>{s.l}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section ref={plansRef} style={{ background:'#F5F0E8',padding:'clamp(60px,8vw,96px) 0',position:'relative',overflow:'hidden' }}>
          <div className="plans-watermark">PLANS</div>

          <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px)',position:'relative' }}>
            <motion.div initial={{ opacity:0,y:12 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.5,ease }}
              style={{ textAlign:'center',marginBottom:36 }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ width:20,height:1,background:'#B8860B' }} />
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#B8860B' }}>Choose a Plan</span>
                <span style={{ width:20,height:1,background:'#B8860B' }} />
              </div>
              <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,4vw,3.4rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95 }}>
                Plans that grow<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>with your school</em>
              </h2>
            </motion.div>

            {/* Tab switcher (dark tabs on light section) */}
            <div style={{ display:'flex',justifyContent:'center',marginBottom:36 }}>
              <div style={{ display:'flex',background:'rgba(13,17,23,0.07)',border:'1px solid rgba(13,17,23,0.1)',borderRadius:14,padding:4 }}>
                {([
                  { key:'leads',    label:'📋 Leads Package',           sub:'Get lead credits' },
                  { key:'featured', label:'⭐ Feature Listing Package', sub:'Boost your visibility' },
                ] as const).map(tab=>(
                  <button key={tab.key} onClick={()=>handleTabChange(tab.key)}
                    style={{
                      padding:'12px 24px', borderRadius:11, border:'none', cursor:'pointer',
                      fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:13, transition:'all .2s',
                      background: activeTab===tab.key ? '#fff' : 'transparent',
                      color: activeTab===tab.key ? '#0D1117' : '#9B8860',
                      boxShadow: activeTab===tab.key ? '0 2px 12px rgba(13,17,23,0.12)' : 'none',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                    }}>
                    <span>{tab.label}</span>
                    <span style={{ fontSize:10,fontWeight:400,color:activeTab===tab.key?'#9B8860':'#B8A898' }}>{tab.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ── LEADS PLANS ── */}
              {activeTab === 'leads' && (
                <motion.div key="leads" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:.22 }}>
                  {plansLoading ? (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
                      {Array.from({length:4}).map((_,i)=><div key={i} style={{ height:420,borderRadius:18,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s infinite' }}/>)}
                    </div>
                  ) : (
                    <div className="plans-grid" style={{ display:'grid',gridTemplateColumns:`repeat(${leadCols},1fr)`,gap:'clamp(10px,1.5vw,16px)',alignItems:'start' }}>
                      {activeLeadPlans.map((plan,i)=>{
                        const { label, period } = fmt(plan.price)
                        return (
                          <motion.div key={plan.id} initial={{ opacity:0,y:32,scale:0.96 }} animate={plansInView?{opacity:1,y:0,scale:1}:{}} transition={{ delay:i*0.09,duration:0.6,ease }}>
                            <div className={`pc-card${plan.isHot?' hot':''}`}>
                              {plan.isHot && <div className="pc-hot-badge"><Zap style={{ width:9,height:9 }}/> Most Popular</div>}
                              <div style={{ marginBottom:16 }}>
                                <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:20,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:3 }}>{plan.name}</div>
                                <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,color:plan.isHot?'rgba(250,247,242,0.45)':'#8A9AB0',fontWeight:300,lineHeight:1.5 }}>{plan.description}</div>
                              </div>
                              <div style={{ marginBottom:plan.leadCount!==0?6:20,display:'flex',alignItems:'baseline',gap:4 }}>
                                <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,3.5vw,2.8rem)',color:plan.isHot?'#E8C547':'#0D1117',letterSpacing:'-1.5px',lineHeight:1 }}>{label}</span>
                                <span style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:plan.isHot?'rgba(250,247,242,0.4)':'#A0ADB8',fontWeight:300 }}>{period}</span>
                              </div>
                              {plan.leadCount !== 0 && (
                                <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:16,padding:'4px 10px',borderRadius:8,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                                  <span style={{ fontSize:11,fontWeight:700,color:'#B8860B' }}>{plan.leadCount===-1?'∞ Unlimited':`${plan.leadCount}`} lead credits</span>
                                </div>
                              )}
                              <div style={{ height:1,background:plan.isHot?'rgba(255,255,255,0.07)':'rgba(13,17,23,0.07)',marginBottom:16 }} />
                              <div style={{ display:'flex',flexDirection:'column',gap:9,flex:1,marginBottom:22 }}>
                                {plan.features.map(f=>(
                                  <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:9,fontFamily:'Inter,sans-serif',fontSize:12,color:plan.isHot?'rgba(250,247,242,0.7)':'#4A5568',fontWeight:300,lineHeight:1.45 }}>
                                    <div className={`pc-check ${plan.isHot?'gold':'light'}`}><Check style={{ width:9,height:9,color:plan.isHot?'#E8C547':'#6B7280' }}/></div>
                                    {f}
                                  </div>
                                ))}
                              </div>
                              {isSchoolUser ? (
                                <button onClick={()=>setCheckoutPlan(plan)} className={plan.isHot?'btn btn-gold':'btn btn-dark'}
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',fontSize:13,width:'100%',cursor:'pointer',padding:'12px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700 }}>
                                  {plan.cta} <ArrowRight style={{ width:13,height:13 }}/>
                                </button>
                              ) : (
                                <Link href={`/register?role=school&plan=${plan.planKey}`}
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',fontSize:13,padding:'12px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none',alignItems:'center',gap:6 }}>
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
                    style={{ textAlign:'center',marginTop:28,fontFamily:'Inter,sans-serif',fontSize:12,color:'#A0ADB8',fontWeight:300 }}>
                    All prices in INR · Cancel anytime · No credit card needed for Free plan · Buy single leads from your Leads page
                  </motion.p>
                </motion.div>
              )}

              {/* ── FEATURED PLANS ── */}
              {activeTab === 'featured' && (
                <motion.div key="featured" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:.22 }}>
                  {featLoading ? (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:960,margin:'0 auto' }}>
                      {[1,2,3].map(i=><div key={i} style={{ height:460,borderRadius:18,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s infinite' }}/>)}
                    </div>
                  ) : activeFeatPlans.length === 0 ? (
                    <div style={{ textAlign:'center',padding:'60px 24px',color:'#9B8860' }}>
                      <Zap style={{ width:32,height:32,margin:'0 auto 12px',opacity:.4 }} />
                      <p>No featured listing packages available right now.</p>
                    </div>
                  ) : (
                    <div className="plans-grid" style={{ display:'grid',gridTemplateColumns:`repeat(${featCols},1fr)`,gap:'clamp(10px,1.5vw,16px)',alignItems:'start',maxWidth:960,margin:'0 auto' }}>
                      {activeFeatPlans.map((plan,i)=>{
                        const { label } = fmt(plan.price)
                        return (
                          <motion.div key={plan.id} initial={{ opacity:0,y:32,scale:0.96 }} animate={plansInView?{opacity:1,y:0,scale:1}:{}} transition={{ delay:i*0.09,duration:0.6,ease }}>
                            <div className={`pc-card${plan.isHot?' hot':''}`}>
                              {plan.isHot && <div className="pc-hot-badge"><Star style={{ width:9,height:9 }}/> Best Value</div>}

                              {/* Duration pill */}
                              <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14,padding:'4px 12px',borderRadius:8,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                                <span style={{ fontSize:12,fontWeight:700,color:'#B8860B' }}>⏱ {fmtDays(plan.durationDays)}</span>
                              </div>

                              <div style={{ marginBottom:16 }}>
                                <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:20,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:3 }}>{plan.name}</div>
                                <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,color:plan.isHot?'rgba(250,247,242,0.45)':'#8A9AB0',fontWeight:300,lineHeight:1.5 }}>{plan.description}</div>
                              </div>

                              <div style={{ marginBottom:20,display:'flex',alignItems:'baseline',gap:4 }}>
                                <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,3.5vw,2.8rem)',color:plan.isHot?'#E8C547':'#0D1117',letterSpacing:'-1.5px',lineHeight:1 }}>{label}</span>
                              </div>

                              <div style={{ height:1,background:plan.isHot?'rgba(255,255,255,0.07)':'rgba(13,17,23,0.07)',marginBottom:16 }} />

                              <div style={{ display:'flex',flexDirection:'column',gap:9,flex:1,marginBottom:22 }}>
                                {plan.features.map(f=>(
                                  <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:9,fontFamily:'Inter,sans-serif',fontSize:12,color:plan.isHot?'rgba(250,247,242,0.7)':'#4A5568',fontWeight:300,lineHeight:1.45 }}>
                                    <div className={`pc-check ${plan.isHot?'gold':'light'}`}><Check style={{ width:9,height:9,color:plan.isHot?'#E8C547':'#6B7280' }}/></div>
                                    {f}
                                  </div>
                                ))}
                              </div>

                              {isSchoolUser ? (
                                <Link href="/dashboard/school/packages?tab=featured"
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',fontSize:13,padding:'12px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none',alignItems:'center',gap:6 }}>
                                  {plan.cta || 'Get Featured'} <ArrowRight style={{ width:13,height:13 }}/>
                                </Link>
                              ) : (
                                <Link href={`/register?role=school`}
                                  style={{ textAlign:'center',justifyContent:'center',display:'flex',fontSize:13,padding:'12px',borderRadius:10,border:'none',background:plan.isHot?'linear-gradient(135deg,#B8860B,#E8C547)':'#0D1117',color:plan.isHot?'#0D1117':'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none',alignItems:'center',gap:6 }}>
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
                    style={{ textAlign:'center',marginTop:28,fontFamily:'Inter,sans-serif',fontSize:12,color:'#A0ADB8',fontWeight:300 }}>
                    All prices in INR · Featured listing activates immediately after payment
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section ref={faqRef} style={{ background:'#0A0E17',padding:'clamp(60px,8vw,96px) 0',position:'relative' }}>
          <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 50% 100%,rgba(184,134,11,0.06) 0%,transparent 60%)',pointerEvents:'none' }} />
          <div style={{ maxWidth:740,margin:'0 auto',padding:'0 clamp(20px,5vw,40px)',position:'relative',zIndex:1 }}>
            <motion.div initial={{ opacity:0,y:16 }} animate={faqInView?{opacity:1,y:0}:{}} transition={{ duration:0.55,ease }}
              style={{ textAlign:'center',marginBottom:36 }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <span style={{ width:20,height:1,background:'#B8860B' }} />
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'#E8C547' }}>FAQ</span>
                <span style={{ width:20,height:1,background:'#B8860B' }} />
              </div>
              <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,4vw,3.2rem)',color:'#FAF7F2',letterSpacing:'-1.5px',lineHeight:0.92 }}>
                Common <em style={{ fontStyle:'italic',color:'#E8C547' }}>Questions</em>
              </h2>
            </motion.div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {FAQ.map((f,i)=>(
                <motion.div key={i} initial={{ opacity:0,x:-16 }} animate={faqInView?{opacity:1,x:0}:{}} transition={{ delay:i*0.07,duration:0.5,ease }}>
                  <div className={`faq-item${openFaq===i?' open':''}`}>
                    <button className="faq-trigger" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                      <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:600,fontSize:'clamp(15px,1.8vw,18px)',color:'#FAF7F2',lineHeight:1.3 }}>{f.q}</span>
                      <div className="faq-icon"><span style={{ color:'#E8C547',fontSize:15,lineHeight:1,fontWeight:300 }}>+</span></div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq===i&&(
                        <motion.div key="a" initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.32,ease:[0.22,1,0.36,1] }} style={{ overflow:'hidden' }}>
                          <p style={{ fontFamily:'Inter,sans-serif',fontSize:'clamp(13px,1.4vw,14px)',color:'rgba(250,247,242,0.5)',lineHeight:1.75,fontWeight:300,margin:0,padding:'0 22px 18px' }}>{f.a}</p>
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
        <section style={{ background:'#F5F0E8',padding:'clamp(48px,6vw,72px) 0' }}>
          <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.6,ease }}
            style={{ maxWidth:600,margin:'0 auto',padding:'0 24px',textAlign:'center' }}>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2rem,4vw,3rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95,marginBottom:14 }}>
              Ready to grow<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>admissions?</em>
            </h2>
            <p style={{ fontFamily:'Inter,sans-serif',fontSize:14,color:'#718096',fontWeight:300,lineHeight:1.7,marginBottom:24 }}>
              Start free — no credit card needed. Upgrade when you're ready.
            </p>
            <Link href={isSchoolUser?'/dashboard/school/packages':'/register?role=school'}
              style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:14,padding:'14px 28px',borderRadius:12,background:'linear-gradient(135deg,#B8860B,#D4A520)',color:'#fff',fontFamily:'Inter,sans-serif',fontWeight:700,textDecoration:'none' }}>
              List Your School Free <ArrowRight style={{ width:14,height:14 }}/>
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
