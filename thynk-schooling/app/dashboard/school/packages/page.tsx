'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle, Loader2, ArrowLeft, CreditCard, X, Tag, AlertCircle, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type GatewayId = 'razorpay' | 'cashfree' | 'easebuzz' | 'paypal'
interface Gateway { id: string; name: string; priority: number }

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

const GW: Record<string, { emoji: string; color: string; desc: string }> = {
  razorpay: { emoji: '💙', color: '#3395FF', desc: 'UPI · Cards · Netbanking · Wallets' },
  cashfree: { emoji: '💚', color: '#00C853', desc: 'UPI · Cards · BNPL' },
  easebuzz: { emoji: '🟠', color: '#FF6600', desc: 'Cards · UPI · Netbanking' },
  paypal:   { emoji: '🌐', color: '#003087', desc: 'International · USD/AED/SAR' },
}

declare global {
  interface Window {
    Razorpay: new (o: object) => { open: () => void }
    Cashfree: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (options: { paymentSessionId: string; returnUrl: string }) => void
    }
  }
}

// ─── Shared Checkout Modal ────────────────────────────────────────────────────
function CheckoutModal({ planName, price, gateways, onClose, onPay }: {
  planName: string; price: number; gateways: Gateway[]
  onClose: () => void
  onPay: (g: GatewayId, couponId?: string, finalAmount?: number) => void
}) {
  const [couponCode, setCouponCode]       = useState('')
  const [couponResult, setCouponResult]   = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [selectedGw, setSelectedGw]       = useState<GatewayId>(gateways[0]?.id as GatewayId || 'razorpay')

  const effectivePrice = couponResult?.valid ? couponResult.final_amount_paise! : price
  const fmt = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), amount_paise: price, gateway: selectedGw }),
      })
      setCouponResult(await res.json())
    } catch {
      setCouponResult({ valid: false, message: 'Could not validate coupon' })
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',padding:16 }}>
      <motion.div initial={{ opacity:0,scale:0.95,y:10 }} animate={{ opacity:1,scale:1,y:0 }}
        style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:440,position:'relative',boxShadow:'0 24px 80px rgba(0,0,0,0.3)',maxHeight:'90vh',overflowY:'auto' }}>

        <button onClick={onClose} style={{ position:'absolute',top:14,right:14,background:'none',border:'none',cursor:'pointer',color:'#A0ADB8',padding:4 }}>
          <X style={{ width:16,height:16 }} />
        </button>

        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:4 }}>Subscribe to {planName}</div>
          <div style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096' }}>Secure payment · Cancel anytime</div>
        </div>

        {/* Price summary */}
        <div style={{ background:'#F9F7F4',border:'1px solid #E8DCC8',borderRadius:12,padding:'14px 16px',marginBottom:18 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:couponResult?.valid?8:0 }}>
            <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096' }}>Package price</span>
            <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:18,color:'#0D1117' }}>
              {price === 0 ? 'Free' : fmt(price)}
            </span>
          </div>
          {couponResult?.valid && <>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#16A34A' }}>Discount ({couponResult.code})</span>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#16A34A' }}>−{fmt(couponResult.discount_paise!)}</span>
            </div>
            <div style={{ height:1,background:'#E8DCC8',marginBottom:8 }} />
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:700,color:'#0D1117' }}>Total payable</span>
              <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#B8860B' }}>{fmt(effectivePrice)}</span>
            </div>
          </>}
        </div>

        {/* Coupon */}
        {price > 0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#9B8860',marginBottom:8 }}>Coupon Code</div>
            {couponResult?.valid ? (
              <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10 }}>
                <CheckCircle style={{ width:15,height:15,color:'#16A34A',flexShrink:0 }} />
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#16A34A',flex:1 }}>{couponResult.message}</span>
                <button onClick={() => { setCouponResult(null); setCouponCode('') }} style={{ background:'none',border:'none',cursor:'pointer',color:'#86EFAC',padding:2,display:'flex' }}>
                  <X style={{ width:14,height:14 }} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex',gap:8 }}>
                  <div style={{ flex:1,position:'relative' }}>
                    <Tag style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#C4A96A' }} />
                    <input value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null) }}
                      onKeyDown={e => e.key==='Enter' && validateCoupon()}
                      placeholder="ENTER CODE"
                      style={{ width:'100%',padding:'10px 12px 10px 34px',boxSizing:'border-box',border:'1px solid #E8DCC8',borderRadius:10,background:'#FDFAF5',fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',color:'#0D1117',letterSpacing:'.04em' }} />
                  </div>
                  <button onClick={validateCoupon} disabled={!couponCode.trim()||couponLoading}
                    style={{ padding:'10px 16px',borderRadius:10,border:'1px solid #D4B483',background:couponCode.trim()?'#FFF8E7':'#F5F0E8',color:'#B8860B',fontSize:13,fontWeight:700,cursor:couponCode.trim()?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6,opacity:couponCode.trim()?1:0.5 }}>
                    {couponLoading ? <Loader2 style={{ width:14,height:14,animation:'spin 1s linear infinite' }} /> : 'Apply'}
                  </button>
                </div>
                {couponResult && !couponResult.valid && (
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:7 }}>
                    <AlertCircle style={{ width:13,height:13,color:'#EF4444',flexShrink:0 }} />
                    <span style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'#EF4444' }}>{couponResult.message}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Gateway */}
        {gateways.length > 1 && price > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#9B8860',marginBottom:8 }}>Payment Method</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {gateways.map(gw => {
                const d = GW[gw.id]; if (!d) return null
                const active = selectedGw === gw.id
                return (
                  <button key={gw.id} onClick={() => { setSelectedGw(gw.id as GatewayId); setCouponResult(null) }}
                    style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:12,border:`1.5px solid ${active?d.color:'rgba(13,17,23,0.1)'}`,background:active?`${d.color}10`:`${d.color}04`,cursor:'pointer',textAlign:'left',width:'100%',transition:'all .15s' }}>
                    <span style={{ fontSize:24,flexShrink:0 }}>{d.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,color:'#0D1117',marginBottom:2 }}>{gw.name}</div>
                      <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096' }}>{d.desc}</div>
                    </div>
                    {active && <div style={{ width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0 }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => onPay(selectedGw, couponResult?.valid ? couponResult.coupon_id : undefined, couponResult?.valid ? effectivePrice : undefined)}
          style={{ width:'100%',padding:'14px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#B8860B,#D4A520)',color:'#fff',fontFamily:'Inter,sans-serif',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 6px 20px rgba(184,134,11,0.35)' }}>
          <CreditCard style={{ width:16,height:16 }} />
          {price === 0 ? 'Activate Free Plan →' : `Pay ${fmt(effectivePrice)} →`}
        </button>

        <p style={{ fontFamily:'Inter,sans-serif',fontSize:10,color:'#A0ADB8',textAlign:'center',marginTop:12,marginBottom:0 }}>
          🔒 Secure payment · No hidden fees
        </p>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: 'leads' | 'featured'; onChange: (t: 'leads' | 'featured') => void }) {
  return (
    <div style={{ display:'flex',background:'rgba(13,17,23,0.06)',borderRadius:14,padding:4,width:'fit-content',margin:'0 auto 40px' }}>
      {([
        { key: 'leads',    label: '📋 Leads Package',           sub: 'Get lead credits' },
        { key: 'featured', label: '⭐ Feature Listing Package', sub: 'Boost your visibility' },
      ] as const).map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          style={{
            padding:'12px 28px', borderRadius:11, border:'none', cursor:'pointer',
            fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14, transition:'all .2s',
            background: active === tab.key ? '#fff' : 'transparent',
            color: active === tab.key ? '#0D1117' : '#9B8860',
            boxShadow: active === tab.key ? '0 2px 12px rgba(13,17,23,0.12)' : 'none',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          }}>
          <span>{tab.label}</span>
          <span style={{ fontSize:10,fontWeight:400,color: active === tab.key ? '#9B8860' : '#B8A898' }}>{tab.sub}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Inner Page ───────────────────────────────────────────────────────────────
function PackagesInner() {
  const { accessToken } = useAuthStore()
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const [mounted, setMounted]             = useState(false)
  const [activeTab, setActiveTab]         = useState<'leads' | 'featured'>('leads')
  const [selectedLeadPlan, setSelectedLeadPlan] = useState<SubPlan | null>(null)
  const [selectedFeatPlan, setSelectedFeatPlan] = useState<FeaturedPlan | null>(null)
  const [payingId, setPayingId]           = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && !accessToken) router.replace('/login') }, [mounted, accessToken, router])

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'featured') setActiveTab('featured')
    else setActiveTab('leads')
  }, [searchParams])

  const handleTabChange = (t: 'leads' | 'featured') => {
    setActiveTab(t)
    router.replace(`/dashboard/school/packages?tab=${t}`, { scroll: false })
  }

  // Handle payment redirects
  useEffect(() => {
    if (!mounted || !accessToken) return
    const status  = searchParams.get('status')
    const gateway = searchParams.get('gateway')
    const orderId = searchParams.get('order_id')
    const tab     = searchParams.get('tab') || 'leads'
    if (status === 'failed')  { toast.error('Payment failed or was cancelled.');    router.replace(`/dashboard/school/packages?tab=${tab}`); return }
    if (status === 'success') { toast.success('🎉 Payment successful!');            router.replace(`/dashboard/school/packages?tab=${tab}`); return }
    if (gateway === 'cashfree' && orderId) {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const endpoint = tab === 'featured'
        ? '/api/featured-listing-plans?action=verify-payment'
        : '/api/subscriptions?action=verify-payment'
      fetch(endpoint, { method:'POST', credentials:'include', headers, body: JSON.stringify({ gateway:'cashfree', orderId, cfOrderId: orderId }) })
        .then(r => r.json())
        .then(res => res.success ? toast.success('🎉 Activated!') : toast.error(res.error || 'Verification failed'))
        .catch(() => toast.error('Could not verify payment'))
        .finally(() => router.replace(`/dashboard/school/packages?tab=${tab}`))
    }
  }, [mounted, accessToken, searchParams, router])

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: plansData, isLoading: leadsLoading } = useQuery<SubPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn:  () => fetch('/api/admin?action=subscription-plans').then(r => r.json()),
    staleTime: 5 * 60 * 1000, enabled: mounted,
  })
  const { data: featData, isLoading: featLoading } = useQuery<{ plans: FeaturedPlan[]; gateways: Gateway[] }>({
    queryKey: ['featured-listing-plans'],
    queryFn:  () => fetch('/api/featured-listing-plans', { credentials:'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted, staleTime: 5 * 60 * 1000,
  })
  const { data: gwData } = useQuery<{ gateways: Gateway[] }>({
    queryKey: ['payment-gateways'],
    queryFn:  () => fetch('/api/lead-packages', { credentials:'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted, staleTime: 10 * 60 * 1000,
  })
  const { data: currentSub } = useQuery<{ planKey?: string }>({
    queryKey: ['school-subscription'],
    queryFn:  () => fetch('/api/subscriptions?action=current', { credentials:'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted,
  })
  const { data: featStatus } = useQuery<{ isFeatured: boolean; featuredUntil?: string }>({
    queryKey: ['featured-status'],
    queryFn:  () => fetch('/api/featured-listing-plans?action=current', { credentials:'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted,
  })

  const activeLeadPlans = (plansData ?? []).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const activeFeatPlans = (featData?.plans ?? []).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const leadGateways    = gwData?.gateways ?? []
  const featGateways    = featData?.gateways ?? []

  const fmt     = (p: number) => p === 0 ? 'Free' : `₹${Math.round(p/100).toLocaleString('en-IN')}`
  const fmtDays = (d: number) => d >= 30 ? `${Math.round(d/30)} month${Math.round(d/30)>1?'s':''}` : `${d} days`

  // ── Lead plan payment ─────────────────────────────────────────────────────
  const handleLeadPay = async (plan: SubPlan, gatewayId: GatewayId, couponId?: string, finalAmountPaise?: number) => {
    setSelectedLeadPlan(null); setPayingId(plan.id)
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      if (plan.price === 0) {
        const res  = await fetch(`/api/subscriptions?action=activate-free&planKey=${plan.planKey}`, { method:'POST', credentials:'include', headers })
        const data = await res.json()
        data.success ? toast.success(`✅ ${plan.name} plan activated!`) : toast.error(data.error || 'Could not activate plan')
        setPayingId(null); return
      }
      const orderRes = await fetch(`/api/subscriptions?action=buy&planKey=${plan.planKey}&gateway=${gatewayId}${couponId?`&coupon_id=${couponId}`:''}`, { method:'POST', credentials:'include', headers })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')
      if (order._dev || order.success) { toast.success(`✅ Subscribed to ${plan.name}!`); setPayingId(null); return }
      if (gatewayId === 'razorpay') {
        const cp = order.clientPayload
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({ key:cp.key, amount:finalAmountPaise??cp.amount, currency:cp.currency, order_id:cp.orderId, name:'Thynk Schooling', description:`${plan.name} subscription`, theme:{color:'#B8860B'}, handler:async(resp:any)=>{ await fetch('/api/subscriptions?action=verify-payment',{method:'POST',credentials:'include',headers,body:JSON.stringify({gateway:'razorpay',coupon_id:couponId,...resp})}); resolve() }, modal:{ondismiss:()=>reject(new Error('Payment cancelled'))} })
          rzp.open()
        })
        toast.success(`🎉 Subscribed to ${plan.name}!`)
      } else if (gatewayId === 'cashfree') {
        const {sessionId,orderId,mode} = order.clientPayload
        if (!sessionId) throw new Error('Cashfree session ID missing')
        window.Cashfree({mode:mode==='live'?'production':'sandbox'}).checkout({paymentSessionId:sessionId,returnUrl:`${window.location.origin}/dashboard/school/packages?tab=leads&order_id=${orderId}&gateway=cashfree`})
      } else if (gatewayId === 'easebuzz') {
        const {accessKey,baseUrl} = order.clientPayload
        window.location.href = `${baseUrl}/pay/?access_key=${accessKey}`
      } else if (gatewayId === 'paypal') {
        if (order.clientPayload?.approveUrl) window.location.href = order.clientPayload.approveUrl
      }
    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed')
    }
    setPayingId(null)
  }

  // ── Featured plan payment ─────────────────────────────────────────────────
  const handleFeatPay = async (plan: FeaturedPlan, gatewayId: GatewayId, couponId?: string, finalAmountPaise?: number) => {
    setSelectedFeatPlan(null); setPayingId(plan.id)
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const orderRes = await fetch(`/api/featured-listing-plans?action=buy&id=${plan.id}&gateway=${gatewayId}${couponId?`&coupon_id=${couponId}`:''}`, { method:'POST', credentials:'include', headers })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')
      if (order._dev || order.success) { toast.success(`🎉 Featured listing activated for ${fmtDays(plan.durationDays)}!`); setPayingId(null); return }
      if (gatewayId === 'razorpay') {
        const cp = order.clientPayload
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({ key:cp.key, amount:finalAmountPaise??cp.amount, currency:cp.currency, order_id:cp.orderId, name:'Thynk Schooling', description:`${plan.name} – Featured Listing`, theme:{color:'#B8860B'}, handler:async(resp:any)=>{ await fetch('/api/featured-listing-plans?action=verify-payment',{method:'POST',credentials:'include',headers,body:JSON.stringify({gateway:'razorpay',orderId:cp.orderId,coupon_id:couponId,...resp})}); resolve() }, modal:{ondismiss:()=>reject(new Error('Payment cancelled'))} })
          rzp.open()
        })
        toast.success(`🎉 Featured listing activated!`)
      } else if (gatewayId === 'cashfree') {
        const {sessionId,orderId,mode} = order.clientPayload
        if (!sessionId) throw new Error('Cashfree session ID missing')
        window.Cashfree({mode:mode==='live'?'production':'sandbox'}).checkout({paymentSessionId:sessionId,returnUrl:`${window.location.origin}/dashboard/school/packages?tab=featured&order_id=${orderId}&gateway=cashfree`})
      } else if (gatewayId === 'easebuzz') {
        const {accessKey,baseUrl} = order.clientPayload
        window.location.href = `${baseUrl}/pay/?access_key=${accessKey}`
      }
    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed')
    }
    setPayingId(null)
  }

  if (!mounted) return null
  const allGateways = [...leadGateways, ...featGateways]

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 60%,#EEE0C0 100%)',padding:'40px 20px',fontFamily:'Inter,sans-serif' }}>
      {allGateways.some(g=>g.id==='razorpay') && <script src="https://checkout.razorpay.com/v1/checkout.js" async />}
      {allGateways.some(g=>g.id==='cashfree') && <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async />}

      <div style={{ maxWidth:1200,margin:'0 auto' }}>
        <Link href="/dashboard/school" style={{ display:'inline-flex',alignItems:'center',gap:8,color:'#6B5744',textDecoration:'none',fontSize:13,fontWeight:600,marginBottom:32,padding:'8px 14px',borderRadius:9,background:'rgba(184,134,11,0.08)',border:'1px solid rgba(184,134,11,0.15)' }}>
          <ArrowLeft style={{ width:14,height:14 }} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div style={{ textAlign:'center',maxWidth:960,margin:'0 auto 36px' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#B8860B',marginBottom:14 }}>
            <Package style={{ width:13,height:13 }} /> Packages
          </div>
          <h1 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,5vw,3.2rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95,margin:'0 0 14px' }}>
            Choose Your Package<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>& Grow Admissions</em>
          </h1>
          <p style={{ fontSize:15,color:'#718096',lineHeight:1.6,maxWidth:520,margin:'0 auto' }}>
            Subscribe for lead credits, or boost your school's visibility with a Featured Listing.
          </p>
        </div>

        {/* Tabs */}
        <TabBar active={activeTab} onChange={handleTabChange} />

        <AnimatePresence mode="wait">

          {/* ── LEADS TAB ─────────────────────────────────────────────────────── */}
          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:.22 }}>
              <div style={{ textAlign:'center',marginBottom:28 }}>
                <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(1.4rem,3vw,1.9rem)',color:'#0D1117',margin:'0 0 6px' }}>Leads Packages</h2>
                <p style={{ fontSize:13,color:'#9B8860',margin:0 }}>Subscribe to unlock parent enquiries with lead credits</p>
              </div>

              {leadsLoading ? (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,maxWidth:1100,margin:'0 auto 40px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height:420,borderRadius:20,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,maxWidth:1100,margin:'0 auto 40px' }}>
                  {activeLeadPlans.map((plan, i) => {
                    const isCurrent = currentSub?.planKey === plan.planKey
                    return (
                      <motion.div key={plan.id} initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}
                        style={{ background:plan.isHot?'#0D1117':'#FFFFFF', border:plan.isHot?'2px solid #B8860B':'1px solid #E8DCC8', borderRadius:20, padding:'28px 24px', display:'flex', flexDirection:'column', position:'relative', boxShadow:plan.isHot?'0 20px 60px rgba(13,17,23,0.25)':'0 2px 16px rgba(13,17,23,0.06)', transition:'transform .2s,box-shadow .2s' }}
                        onMouseEnter={e=>{ if(!plan.isHot){(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(13,17,23,0.12)'} }}
                        onMouseLeave={e=>{ if(!plan.isHot){(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(13,17,23,0.06)'} }}>

                        {plan.isHot && <div style={{ position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',background:'#B8860B',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:99,whiteSpace:'nowrap' }}>⭐ Most Popular</div>}
                        {isCurrent && <div style={{ position:'absolute',top:14,left:14,background:'#16A34A',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:99 }}>✓ Current Plan</div>}

                        <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:4,marginTop:plan.isHot||isCurrent?16:0 }}>{plan.name}</div>
                        <div style={{ fontSize:12,color:plan.isHot?'rgba(250,247,242,0.5)':'#9B8860',marginBottom:20,lineHeight:1.5 }}>{plan.description}</div>

                        <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:plan.leadCount!==0?6:20 }}>
                          <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:800,fontSize:42,color:plan.isHot?'#FAF7F2':'#0D1117',letterSpacing:'-2px',lineHeight:1 }}>{fmt(plan.price)}</span>
                        </div>

                        {plan.leadCount !== 0 && (
                          <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:20,padding:'5px 12px',borderRadius:8,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                            <span style={{ fontSize:13,fontWeight:700,color:'#B8860B' }}>{plan.leadCount===-1?'∞ Unlimited':`${plan.leadCount}`} lead credits</span>
                          </div>
                        )}

                        <div style={{ flex:1,marginBottom:24 }}>
                          {(plan.features??[]).map(f=>(
                            <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:9,marginBottom:10 }}>
                              <CheckCircle style={{ width:15,height:15,color:'#22C55E',flexShrink:0,marginTop:1 }} />
                              <span style={{ fontSize:13,color:plan.isHot?'rgba(250,247,242,0.75)':'#4A3728',lineHeight:1.4 }}>{f}</span>
                            </div>
                          ))}
                        </div>

                        <button onClick={()=>{ if(!accessToken){toast.error('Please log in first');router.push('/login');return} if(isCurrent){toast('You are already on this plan');return} setSelectedLeadPlan(plan) }} disabled={payingId===plan.id}
                          style={{ width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:isCurrent?'default':'pointer',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:isCurrent?'#16A34A':plan.isHot?'linear-gradient(135deg,#B8860B,#D4A520)':'#0D1117',color:'#fff',boxShadow:plan.isHot?'0 8px 24px rgba(184,134,11,0.4)':'0 4px 12px rgba(13,17,23,0.2)',opacity:payingId===plan.id?0.7:1 }}>
                          {payingId===plan.id?<Loader2 style={{width:16,height:16,animation:'spin 1s linear infinite'}}/>:isCurrent?'✓ Active Plan':<><CreditCard style={{width:15,height:15}}/>{plan.cta||'Subscribe'} →</>}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <div style={{ maxWidth:1100,margin:'0 auto',background:'white',border:'1px solid #E8DCC8',borderRadius:16,padding:'18px 24px',display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:20 }}>💡</span>
                <p style={{ margin:0,fontSize:13,color:'#6B5744',lineHeight:1.6 }}>
                  Need just a few leads? <strong>Buy individual leads</strong> directly from your{' '}
                  <Link href="/dashboard/school/leads" style={{ color:'#B8860B',fontWeight:600,textDecoration:'none' }}>Leads page</Link>
                  {' '}— pay only for what you unlock, no subscription needed.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── FEATURED TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'featured' && (
            <motion.div key="featured" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:.22 }}>
              <div style={{ textAlign:'center',marginBottom:28 }}>
                <h2 style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(1.4rem,3vw,1.9rem)',color:'#0D1117',margin:'0 0 6px' }}>Feature Listing Packages</h2>
                <p style={{ fontSize:13,color:'#9B8860',margin:0 }}>Get top-of-search placement and a Featured badge to attract more admissions</p>
              </div>

              {/* Active featured banner */}
              {featStatus?.isFeatured && featStatus.featuredUntil && (
                <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
                  style={{ maxWidth:1000,margin:'0 auto 28px',background:'linear-gradient(135deg,#FFF8E7,#FFF3CD)',border:'1px solid rgba(184,134,11,0.3)',borderRadius:14,padding:'16px 22px',display:'flex',alignItems:'center',gap:14 }}>
                  <Star style={{ width:20,height:20,color:'#B8860B',flexShrink:0 }} />
                  <div>
                    <div style={{ fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,color:'#7A5C00' }}>Your school is currently featured!</div>
                    <div style={{ fontFamily:'Inter,sans-serif',fontSize:12,color:'#9B7A00',marginTop:2 }}>
                      Featured until {new Date(featStatus.featuredUntil).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </div>
                  </div>
                </motion.div>
              )}

              {featLoading ? (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20,maxWidth:1000,margin:'0 auto 40px' }}>
                  {[1,2,3].map(i=><div key={i} style={{ height:460,borderRadius:20,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s ease-in-out infinite' }}/>)}
                </div>
              ) : activeFeatPlans.length === 0 ? (
                <div style={{ textAlign:'center',padding:'60px 24px',color:'#9B8860' }}>
                  <Zap style={{ width:32,height:32,margin:'0 auto 12px',opacity:.4 }} />
                  <p>No featured listing packages available right now.</p>
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20,maxWidth:1000,margin:'0 auto 40px' }}>
                  {activeFeatPlans.map((plan,i)=>(
                    <motion.div key={plan.id} initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}
                      style={{ background:plan.isHot?'#0D1117':'#FFFFFF', border:plan.isHot?'2px solid #B8860B':'1px solid #E8DCC8', borderRadius:20, padding:'28px 24px', display:'flex', flexDirection:'column', position:'relative', boxShadow:plan.isHot?'0 20px 60px rgba(13,17,23,0.25)':'0 2px 16px rgba(13,17,23,0.06)', transition:'transform .2s,box-shadow .2s' }}
                      onMouseEnter={e=>{ if(!plan.isHot){(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(13,17,23,0.12)'} }}
                      onMouseLeave={e=>{ if(!plan.isHot){(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(13,17,23,0.06)'} }}>

                      {plan.isHot && <div style={{ position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#B8860B,#D4A520)',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:99,whiteSpace:'nowrap' }}>⭐ Best Value</div>}

                      {/* Duration pill */}
                      <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14,marginTop:plan.isHot?16:0,padding:'4px 12px',borderRadius:8,background:plan.isHot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',border:`1px solid ${plan.isHot?'rgba(184,134,11,0.4)':'rgba(184,134,11,0.2)'}`,alignSelf:'flex-start' }}>
                        <span style={{ fontSize:12,fontWeight:700,color:'#B8860B' }}>⏱ {fmtDays(plan.durationDays)}</span>
                      </div>

                      <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:plan.isHot?'#FAF7F2':'#0D1117',marginBottom:4 }}>{plan.name}</div>
                      <div style={{ fontSize:12,color:plan.isHot?'rgba(250,247,242,0.5)':'#9B8860',marginBottom:20,lineHeight:1.5 }}>{plan.description}</div>

                      <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:20 }}>
                        <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:800,fontSize:42,color:plan.isHot?'#E8C547':'#0D1117',letterSpacing:'-2px',lineHeight:1 }}>{fmt(plan.price)}</span>
                      </div>

                      <div style={{ flex:1,marginBottom:24 }}>
                        {(plan.features??[]).map(f=>(
                          <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:9,marginBottom:10 }}>
                            <CheckCircle style={{ width:15,height:15,color:'#22C55E',flexShrink:0,marginTop:1 }} />
                            <span style={{ fontSize:13,color:plan.isHot?'rgba(250,247,242,0.75)':'#4A3728',lineHeight:1.4 }}>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button onClick={()=>{ if(!accessToken){toast.error('Please log in first');router.push('/login');return} setSelectedFeatPlan(plan) }} disabled={payingId===plan.id}
                        style={{ width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:plan.isHot?'linear-gradient(135deg,#B8860B,#D4A520)':'#0D1117',color:'#fff',boxShadow:plan.isHot?'0 8px 24px rgba(184,134,11,0.4)':'0 4px 12px rgba(13,17,23,0.2)',opacity:payingId===plan.id?0.7:1 }}>
                        {payingId===plan.id?<Loader2 style={{width:16,height:16,animation:'spin 1s linear infinite'}}/>:<><Star style={{width:15,height:15}}/>{plan.cta||'Get Featured'} →</>}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <div style={{ maxWidth:1000,margin:'0 auto',background:'white',border:'1px solid #E8DCC8',borderRadius:16,padding:'18px 24px',display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:20 }}>⭐</span>
                <p style={{ margin:0,fontSize:13,color:'#6B5744',lineHeight:1.6 }}>
                  Featured schools appear at the <strong>top of search results</strong> with a special badge, getting significantly more visibility and enquiries from parents.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lead Checkout Modal */}
      <AnimatePresence>
        {selectedLeadPlan && (
          <CheckoutModal
            planName={selectedLeadPlan.name} price={selectedLeadPlan.price} gateways={leadGateways}
            onClose={()=>setSelectedLeadPlan(null)}
            onPay={(gwId,couponId,finalAmount)=>handleLeadPay(selectedLeadPlan,gwId,couponId,finalAmount)}
          />
        )}
      </AnimatePresence>

      {/* Featured Checkout Modal */}
      <AnimatePresence>
        {selectedFeatPlan && (
          <CheckoutModal
            planName={selectedFeatPlan.name} price={selectedFeatPlan.price}
            gateways={featGateways.length>0?featGateways:leadGateways}
            onClose={()=>setSelectedFeatPlan(null)}
            onPay={(gwId,couponId,finalAmount)=>handleFeatPay(selectedFeatPlan,gwId,couponId,finalAmount)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>
    </div>
  )
}

export default function SchoolPackagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FDFAF5',fontFamily:'Inter,sans-serif',color:'#9B8860' }}>Loading…</div>}>
      <PackagesInner />
    </Suspense>
  )
}
