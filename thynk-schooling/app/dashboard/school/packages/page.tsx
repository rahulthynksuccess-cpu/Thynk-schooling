'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Zap, CheckCircle, Loader2, ArrowLeft, CreditCard, X, Tag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type GatewayId = 'razorpay' | 'cashfree' | 'easebuzz' | 'paypal'
interface Gateway  { id: string; name: string; priority: number }
interface LeadPkg  { id: string; name: string; description?: string; leadCredits: number; price: number; validityDays: number; isHot?: boolean }
interface LeadPricingConfig {
  defaultPricePaise: number
  statePricing: Array<{ state: string; defaultPricePaise: number; isActive: boolean }>
}
interface CouponResult {
  valid: boolean
  coupon_id?: string
  code?: string
  type?: 'percent' | 'flat'
  value?: number
  discount_paise?: number
  final_amount_paise?: number
  message: string
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

// ─── Gateway + Coupon Modal ───────────────────────────────────────────────────

function GatewayModal({
  gateways, pkg, onClose, onPay,
}: {
  gateways: Gateway[]
  pkg: LeadPkg
  onClose: () => void
  onPay: (g: GatewayId, couponId?: string, finalAmount?: number) => void
}) {
  const [couponCode, setCouponCode]     = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [selectedGw, setSelectedGw]     = useState<GatewayId>(gateways[0]?.id as GatewayId)

  const effectivePrice = couponResult?.valid ? couponResult.final_amount_paise! : pkg.price
  const fmt = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), amount_paise: pkg.price, gateway: selectedGw }),
      })
      setCouponResult(await res.json())
    } catch {
      setCouponResult({ valid: false, message: 'Could not validate coupon' })
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => { setCouponResult(null); setCouponCode('') }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',padding:16 }}>
      <motion.div initial={{ opacity:0,scale:0.95,y:10 }} animate={{ opacity:1,scale:1,y:0 }}
        style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:440,position:'relative',boxShadow:'0 24px 80px rgba(0,0,0,0.3)',maxHeight:'90vh',overflowY:'auto' }}>

        <button onClick={onClose} style={{ position:'absolute',top:14,right:14,background:'none',border:'none',cursor:'pointer',color:'#A0ADB8',padding:4 }}>
          <X style={{ width:16,height:16 }} />
        </button>

        {/* Header */}
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:4 }}>Complete Purchase</div>
          <div style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096' }}>
            <strong>{pkg.name}</strong> · {pkg.leadCredits} credits
          </div>
        </div>

        {/* Price summary */}
        <div style={{ background:'#F9F7F4',border:'1px solid #E8DCC8',borderRadius:12,padding:'14px 16px',marginBottom:18 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: couponResult?.valid ? 8 : 0 }}>
            <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096' }}>Package price</span>
            <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:18,color:'#0D1117' }}>{fmt(pkg.price)}</span>
          </div>
          {couponResult?.valid && (
            <>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#16A34A' }}>Discount ({couponResult.code})</span>
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,fontWeight:600,color:'#16A34A' }}>−{fmt(couponResult.discount_paise!)}</span>
              </div>
              <div style={{ height:1,background:'#E8DCC8',marginBottom:8 }} />
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:700,color:'#0D1117' }}>Total payable</span>
                <span style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#B8860B' }}>{fmt(effectivePrice)}</span>
              </div>
            </>
          )}
        </div>

        {/* Coupon field */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#9B8860',marginBottom:8 }}>
            Coupon Code
          </div>
          {couponResult?.valid ? (
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10 }}>
              <CheckCircle style={{ width:15,height:15,color:'#16A34A',flexShrink:0 }} />
              <span style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#16A34A',flex:1 }}>{couponResult.message}</span>
              <button onClick={removeCoupon} style={{ background:'none',border:'none',cursor:'pointer',color:'#86EFAC',padding:2,display:'flex' }}>
                <X style={{ width:14,height:14 }} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ display:'flex',gap:8 }}>
                <div style={{ flex:1,position:'relative' }}>
                  <Tag style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#C4A96A' }} />
                  <input
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null) }}
                    onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                    placeholder="ENTER CODE"
                    style={{ width:'100%',padding:'10px 12px 10px 34px',boxSizing:'border-box',border:'1px solid #E8DCC8',borderRadius:10,background:'#FDFAF5',fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',color:'#0D1117',letterSpacing:'.04em' }}
                  />
                </div>
                <button onClick={validateCoupon} disabled={!couponCode.trim() || couponLoading}
                  style={{ padding:'10px 16px',borderRadius:10,border:'1px solid #D4B483',background: couponCode.trim() ? '#FFF8E7':'#F5F0E8',color:'#B8860B',fontSize:13,fontWeight:700,cursor:couponCode.trim()?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6,opacity:couponCode.trim()?1:0.5,transition:'opacity .15s' }}>
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

        {/* Gateway selection */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#9B8860',marginBottom:8 }}>
            Payment Method
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {gateways.map(gw => {
              const d = GW[gw.id]; if (!d) return null
              const active = selectedGw === gw.id
              return (
                <button key={gw.id} onClick={() => { setSelectedGw(gw.id as GatewayId); if (couponResult?.valid) { /* re-validate with new gateway */ setCouponResult(null); setCouponCode(couponCode) } }}
                  style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:12,border:`1.5px solid ${active ? d.color : 'rgba(13,17,23,0.1)'}`,background: active ? `${d.color}10` : `${d.color}04`,cursor:'pointer',textAlign:'left',width:'100%',transition:'all .15s' }}>
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

        {/* Proceed button */}
        <button
          onClick={() => onPay(selectedGw, couponResult?.valid ? couponResult.coupon_id : undefined, couponResult?.valid ? effectivePrice : undefined)}
          style={{ width:'100%',padding:'14px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#B8860B,#D4A520)',color:'#fff',fontFamily:'Inter,sans-serif',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 6px 20px rgba(184,134,11,0.35)' }}>
          <CreditCard style={{ width:16,height:16 }} />
          Pay {fmt(effectivePrice)} →
        </button>

        <p style={{ fontFamily:'Inter,sans-serif',fontSize:10,color:'#A0ADB8',textAlign:'center',marginTop:12,marginBottom:0 }}>
          🔒 Secure payment · Credits added instantly after payment
        </p>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadPackagesPage() {
  const { accessToken, user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted]     = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<LeadPkg | null>(null)
  const [payingId, setPayingId]   = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && !accessToken) router.replace('/login') }, [mounted, accessToken, router])

  // ── Handle Cashfree / Easebuzz return redirect ──────────────────────────────
  useEffect(() => {
    if (!mounted || !accessToken) return
    const gateway = searchParams.get('gateway')
    const orderId  = searchParams.get('order_id')
    const status   = searchParams.get('status')

    if (status === 'failed') {
      toast.error('Payment failed or was cancelled.')
      router.replace('/dashboard/school/packages')
      return
    }

    if (gateway === 'cashfree' && orderId) {
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`
      fetch('/api/lead-packages?action=verify-payment', {
        method: 'POST', credentials: 'include', headers: authHeaders,
        body: JSON.stringify({ gateway: 'cashfree', orderId, cfOrderId: orderId }),
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            toast.success(`✅ Payment successful! ${res.creditsAdded} credits added.`)
            window.dispatchEvent(new Event('creditsUpdated'))
          } else {
            toast.error(res.error || 'Payment verification failed')
          }
        })
        .catch(() => toast.error('Could not verify Cashfree payment'))
        .finally(() => router.replace('/dashboard/school/packages'))
    }
  }, [mounted, accessToken, searchParams, router])

  // ── Data fetches ─────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<{ packages: LeadPkg[]; gateways: Gateway[] }>({
    queryKey: ['lead-packages'],
    queryFn: () => fetch('/api/lead-packages', { credentials: 'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted,
    staleTime: 10 * 60 * 1000,
  })

  const { data: credits } = useQuery<{ availableCredits?: number; credits?: number }>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { credentials: 'include' }).then(r => r.json()),
    enabled: !!accessToken && mounted,
  })

  // FIX: fetch per-lead price dynamically
  const { data: leadPricing } = useQuery<LeadPricingConfig>({
    queryKey: ['lead-pricing-cfg'],
    queryFn: () => fetch('/api/admin/lead-pricing', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
    enabled: mounted,
  })

  const packages  = data?.packages ?? []
  const gateways  = data?.gateways ?? []
  const availableCredits = credits?.availableCredits ?? credits?.credits ?? 0

  // Resolve per-lead price: state-specific for this school, else global default
  const perLeadPaise = (() => {
    if (!leadPricing) return null
    if (user?.state && leadPricing.statePricing?.length) {
      const stateRow = leadPricing.statePricing.find(
        s => s.isActive && s.state.toLowerCase() === (user.state ?? '').toLowerCase()
      )
      if (stateRow) return stateRow.defaultPricePaise
    }
    return leadPricing.defaultPricePaise
  })()

  const perLeadDisplay = perLeadPaise != null
    ? `₹${Math.round(perLeadPaise / 100).toLocaleString('en-IN')}/lead`
    : '₹299/lead' // fallback only if API hasn't loaded

  // ── Payment handler ───────────────────────────────────────────────────────

  const handlePay = async (pkg: LeadPkg, gatewayId: GatewayId, couponId?: string, finalAmountPaise?: number) => {
    setSelectedPkg(null)
    setPayingId(pkg.id)
    try {
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`

      // Pass coupon_id to order creation if coupon was applied
      const orderUrl = `/api/lead-packages?id=${pkg.id}&action=buy&gateway=${gatewayId}${couponId ? `&coupon_id=${couponId}` : ''}`
      const orderRes = await fetch(orderUrl, { method: 'POST', credentials: 'include', headers: authHeaders })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')

      if (order._dev || order.success) {
        toast.success(`✅ ${pkg.leadCredits} credits added successfully!`)
        setPayingId(null)
        window.dispatchEvent(new Event('creditsUpdated'))
        return
      }

      if (gatewayId === 'razorpay') {
        const { clientPayload: cp } = order
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: cp.key,
            // Use final discounted amount if coupon applied, otherwise original
            amount: finalAmountPaise ?? cp.amount,
            currency: cp.currency,
            order_id: cp.orderId,
            name: 'Thynk Schooling',
            description: `${pkg.name} — ${pkg.leadCredits} credits`,
            theme: { color: '#B8860B' },
            handler: async (resp: any) => {
              await fetch('/api/lead-packages?action=verify-payment', {
                method: 'POST', credentials: 'include', headers: authHeaders,
                body: JSON.stringify({ gateway: 'razorpay', coupon_id: couponId, ...resp }),
              })
              resolve()
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          })
          rzp.open()
        })
        toast.success('Payment successful! Credits added.')
        window.dispatchEvent(new Event('creditsUpdated'))

      } else if (gatewayId === 'cashfree') {
        const { sessionId, orderId, mode } = order.clientPayload
        if (!sessionId) throw new Error('Cashfree session ID missing — check gateway config')
        const cashfree = window.Cashfree({ mode: mode === 'live' ? 'production' : 'sandbox' })
        cashfree.checkout({
          paymentSessionId: sessionId,
          returnUrl: `${window.location.origin}/dashboard/school/packages?order_id=${orderId}&gateway=cashfree`,
        })

      } else if (gatewayId === 'easebuzz') {
        const { accessKey, baseUrl } = order.clientPayload
        if (!accessKey) throw new Error('Easebuzz access key missing — check gateway config')
        window.location.href = `${baseUrl}/pay/?access_key=${accessKey}`

      } else if (gatewayId === 'paypal') {
        if (order.clientPayload?.approveUrl) window.location.href = order.clientPayload.approveUrl
      }

    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed')
    }
    setPayingId(null)
  }

  if (!mounted) return null

  const S = {
    page:    { minHeight:'100vh',background:'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 60%,#EEE0C0 100%)',padding:'40px 20px',fontFamily:'Inter,sans-serif' },
    back:    { display:'inline-flex',alignItems:'center',gap:8,color:'#6B5744',textDecoration:'none',fontSize:13,fontWeight:600,marginBottom:32,padding:'8px 14px',borderRadius:9,background:'rgba(184,134,11,0.08)',border:'1px solid rgba(184,134,11,0.15)' },
    center:  { textAlign:'center' as const,maxWidth:860,margin:'0 auto 48px' },
    eyebrow: { display:'inline-flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase' as const,color:'#B8860B',marginBottom:14 },
    h1:      { fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,5vw,3.2rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95,margin:'0 0 14px' },
    sub:     { fontSize:15,color:'#718096',lineHeight:1.6,maxWidth:520,margin:'0 auto 24px' },
    creditBadge: { display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',borderRadius:99,background:'white',border:'1px solid #D4B483',boxShadow:'0 2px 8px rgba(184,134,11,0.12)',fontSize:13,color:'#2C1810',marginBottom:16 },
    gwRow:   { display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap' as const },
    gwBadge: (color: string) => ({ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:8,border:`1px solid ${color}30`,background:`${color}08`,fontSize:12,fontWeight:700,color }),
    // FIX: use auto-fit so ALL packages render regardless of count
    grid:    { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,maxWidth:960,margin:'0 auto 40px' },
    card:    (hot: boolean) => ({
      background: hot ? '#0D1117' : '#FFFFFF',
      border: hot ? '2px solid #B8860B' : '1px solid #E8DCC8',
      borderRadius:20,padding:'28px 24px',display:'flex',flexDirection:'column' as const,gap:0,position:'relative' as const,
      boxShadow: hot ? '0 20px 60px rgba(13,17,23,0.25)' : '0 2px 16px rgba(13,17,23,0.06)',
      transition:'transform .2s,box-shadow .2s',
    }),
    badge:   { position:'absolute' as const,top:-13,left:'50%',transform:'translateX(-50%)',background:'#B8860B',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:99,letterSpacing:'.06em',whiteSpace:'nowrap' as const },
    pkgName: (hot: boolean) => ({ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color: hot ? '#FAF7F2' : '#0D1117',marginBottom:4 }),
    pkgDesc: (hot: boolean) => ({ fontSize:12,color: hot ? 'rgba(250,247,242,0.5)' : '#9B8860',marginBottom:20,lineHeight:1.5 }),
    price:   (hot: boolean) => ({ fontFamily:'"Cormorant Garamond",serif',fontWeight:800,fontSize:42,color: hot ? '#FAF7F2' : '#0D1117',letterSpacing:'-2px',lineHeight:1,margin:'0 0 2px' }),
    perLead: (hot: boolean) => ({ fontSize:13,fontWeight:700,color:'#B8860B',marginBottom:20 }),
    featureRow: { display:'flex',alignItems:'flex-start',gap:9,marginBottom:10 },
    featureTxt: (hot: boolean) => ({ fontSize:13,color: hot ? 'rgba(250,247,242,0.75)' : '#4A3728',lineHeight:1.4 }),
    btn:     (hot: boolean) => ({
      width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:'pointer',
      fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,marginTop:'auto',paddingTop:'24px',
      display:'flex',alignItems:'center',justifyContent:'center',gap:8,
      background: hot ? 'linear-gradient(135deg,#B8860B,#D4A520)' : '#0D1117',
      color:'#fff',boxShadow: hot ? '0 8px 24px rgba(184,134,11,0.4)' : '0 4px 12px rgba(13,17,23,0.2)',
      transition:'all .2s',
    }),
    note:    { maxWidth:860,margin:'0 auto',background:'white',border:'1px solid #E8DCC8',borderRadius:16,padding:'18px 24px',display:'flex',alignItems:'center',gap:12 },
  }

  return (
    <div style={S.page}>
      {gateways.some(g => g.id === 'razorpay') && <script src="https://checkout.razorpay.com/v1/checkout.js" async />}
      {gateways.some(g => g.id === 'cashfree') && <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async />}

      <div style={{ maxWidth:1000,margin:'0 auto' }}>
        <Link href="/dashboard/school" style={S.back}><ArrowLeft style={{ width:14,height:14 }} /> Back to Dashboard</Link>

        {/* Header */}
        <div style={S.center}>
          <div style={S.eyebrow}><Package style={{ width:13,height:13 }} /> Lead Credit Packages</div>
          <h1 style={S.h1}>Buy Lead Credits in Bulk<br /><em style={{ fontStyle:'italic',color:'#B8860B' }}>& Save</em></h1>
          <p style={S.sub}>Purchase lead credits in bulk to unlock parent contact details at a lower per-lead cost.</p>

          <div style={S.creditBadge}>
            <Zap style={{ width:15,height:15,color:'#B8860B' }} />
            <span style={{ fontWeight:700 }}>{availableCredits}</span>
            <span style={{ color:'#9B8860' }}>credits available</span>
          </div>

          {gateways.length > 0 && (
            <div style={S.gwRow}>
              <span style={{ fontSize:12,color:'#9B8860' }}>Pay via:</span>
              {gateways.map(gw => {
                const d = GW[gw.id]; if (!d) return null
                return <span key={gw.id} style={S.gwBadge(d.color)}>{d.emoji} {gw.name}</span>
              })}
            </div>
          )}
        </div>

        {/* Packages grid — FIX: renders ALL packages, hot flag from API field */}
        {isLoading ? (
          <div style={S.grid}>
            {[1,2,3,4].map(i => <div key={i} style={{ height:360,borderRadius:20,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : (
          <div style={S.grid}>
            {packages.map((pkg, i) => {
              // FIX: use pkg.isHot from API instead of hardcoded i===1
              const hot = pkg.isHot ?? false
              const pricePerLead = Math.round(pkg.price / pkg.leadCredits / 100)
              const features = [
                `${pkg.leadCredits} lead credits`,
                `Valid for ${pkg.validityDays} days`,
                'Pool with subscription credits',
                'Use anytime — no expiry rush',
              ]
              return (
                <motion.div key={pkg.id}
                  initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}
                  style={S.card(hot)}
                  onMouseEnter={e => { if (!hot) { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(13,17,23,0.12)' }}}
                  onMouseLeave={e => { if (!hot) { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(13,17,23,0.06)' }}}>

                  {hot && <div style={S.badge}>⭐ Most Popular</div>}

                  <div style={{ width:44,height:44,borderRadius:12,background:hot?'rgba(184,134,11,0.2)':'rgba(184,134,11,0.08)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
                    <Package style={{ width:20,height:20,color:'#B8860B' }} />
                  </div>

                  <div style={S.pkgName(hot)}>{pkg.name}</div>
                  {pkg.description && <div style={S.pkgDesc(hot)}>{pkg.description}</div>}
                  <div style={S.price(hot)}>₹{(pkg.price/100).toLocaleString()}</div>
                  <div style={{ fontSize:12,color: hot ? 'rgba(250,247,242,0.4)':'#9B8860',marginBottom:6 }}>for {pkg.leadCredits} lead credits</div>
                  <div style={S.perLead(hot)}>₹{pricePerLead}/lead</div>

                  <div style={{ flex:1,marginBottom:24 }}>
                    {features.map(f => (
                      <div key={f} style={S.featureRow}>
                        <CheckCircle style={{ width:15,height:15,color:'#22C55E',flexShrink:0,marginTop:1 }} />
                        <span style={S.featureTxt(hot)}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* FIX: always open modal so coupon can be entered — even with 1 gateway */}
                  <button
                    onClick={() => {
                      if (!accessToken) { toast.error('Please log in first'); router.push('/login'); return }
                      setSelectedPkg(pkg)
                    }}
                    disabled={payingId === pkg.id}
                    style={S.btn(hot)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity='0.9'; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity='1'; (e.currentTarget as HTMLElement).style.transform='' }}>
                    {payingId === pkg.id
                      ? <Loader2 style={{ width:16,height:16,animation:'spin 1s linear infinite' }} />
                      : <><CreditCard style={{ width:15,height:15 }} /> Buy Package →</>}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* FIX: dynamic per-lead price from /api/admin/lead-pricing */}
        <div style={S.note}>
          <span style={{ fontSize:20 }}>💡</span>
          <p style={{ margin:0,fontSize:13,color:'#6B5744',lineHeight:1.6 }}>
            <strong>Pay-per-lead</strong> also available — unlock individual leads directly from your dashboard.{' '}
            Price: <strong>{perLeadDisplay}</strong>
            {user?.state && perLeadPaise != null && (
              <span style={{ color:'#9B8860',fontSize:12 }}> ({user.state} pricing)</span>
            )}
          </p>
        </div>
      </div>

      {/* FIX: modal always shown when package selected — includes coupon + gateway */}
      <AnimatePresence>
        {selectedPkg && gateways.length > 0 && (
          <GatewayModal
            gateways={gateways}
            pkg={selectedPkg}
            onClose={() => setSelectedPkg(null)}
            onPay={(gwId, couponId, finalAmount) => handlePay(selectedPkg, gwId, couponId, finalAmount)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>
    </div>
  )
}
