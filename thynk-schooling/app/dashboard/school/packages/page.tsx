'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Zap, CheckCircle, Loader2, ArrowLeft, CreditCard, X } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type GatewayId = 'razorpay' | 'cashfree' | 'easebuzz' | 'paypal'
interface Gateway  { id: string; name: string; priority: number }
interface LeadPkg  { id: string; name: string; description?: string; leadCredits: number; price: number; validityDays: number }

const GW: Record<string, { emoji: string; color: string; desc: string }> = {
  razorpay: { emoji: '💙', color: '#3395FF', desc: 'UPI · Cards · Netbanking · Wallets' },
  cashfree: { emoji: '💚', color: '#00C853', desc: 'UPI · Cards · BNPL' },
  easebuzz: { emoji: '🟠', color: '#FF6600', desc: 'Cards · UPI · Netbanking' },
  paypal:   { emoji: '🌐', color: '#003087', desc: 'International · USD/AED/SAR' },
}

declare global { interface Window { Razorpay: new (o: object) => { open: () => void }; Cashfree: any } }

function GatewayModal({ gateways, pkg, onClose, onPay }: { gateways: Gateway[]; pkg: LeadPkg; onClose: () => void; onPay: (g: GatewayId) => void }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)' }}>
      <motion.div initial={{ opacity:0,scale:0.95,y:10 }} animate={{ opacity:1,scale:1,y:0 }}
        style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:420,position:'relative',boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} style={{ position:'absolute',top:14,right:14,background:'none',border:'none',cursor:'pointer',color:'#A0ADB8',padding:4 }}><X style={{ width:16,height:16 }} /></button>
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:22,color:'#0D1117',marginBottom:4 }}>Choose Payment Method</div>
          <div style={{ fontFamily:'Inter,sans-serif',fontSize:13,color:'#718096' }}>
            <strong>{pkg.name}</strong> — {pkg.leadCredits} credits · <strong>₹{(pkg.price/100).toLocaleString()}</strong>
          </div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {gateways.map(gw => {
            const d = GW[gw.id]; if (!d) return null
            return (
              <button key={gw.id} onClick={() => onPay(gw.id as GatewayId)}
                style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,border:'1.5px solid rgba(13,17,23,0.1)',background:`${d.color}08`,cursor:'pointer',textAlign:'left',width:'100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=d.color }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(13,17,23,0.1)' }}>
                <span style={{ fontSize:28,flexShrink:0 }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,color:'#0D1117',marginBottom:2 }}>{gw.name}</div>
                  <div style={{ fontFamily:'Inter,sans-serif',fontSize:11,color:'#718096' }}>{d.desc}</div>
                </div>
                <CreditCard style={{ width:16,height:16,color:d.color,flexShrink:0 }} />
              </button>
            )
          })}
        </div>
        <p style={{ fontFamily:'Inter,sans-serif',fontSize:10,color:'#A0ADB8',textAlign:'center',marginTop:16 }}>🔒 Secure · Credits added instantly after payment</p>
      </motion.div>
    </div>
  )
}

export default function LeadPackagesPage() {
  const { accessToken, user } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<LeadPkg | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && !accessToken) router.replace('/login') }, [mounted, accessToken, router])

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

  const packages = data?.packages ?? []
  const gateways = data?.gateways ?? []
  const availableCredits = credits?.availableCredits ?? credits?.credits ?? 0

  const handlePay = async (pkg: LeadPkg, gatewayId: GatewayId) => {
    setSelectedPkg(null)
    setPayingId(pkg.id)
    try {
      const orderRes = await fetch(`/api/lead-packages?id=${pkg.id}&action=buy&gateway=${gatewayId}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')

      if (order._dev) {
        await fetch('/api/lead-packages?action=verify-payment', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gateway: gatewayId, orderId: order.orderId }),
        })
        toast.success('Credits added! (dev mode)')
        setPayingId(null); return
      }

      if (gatewayId === 'razorpay') {
        const { clientPayload: cp } = order
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({ key: cp.key, amount: cp.amount, currency: cp.currency, order_id: cp.orderId, name: 'Thynk Schooling', description: `${pkg.name} — ${pkg.leadCredits} credits`, theme: { color: '#B8860B' },
            handler: async (resp: any) => {
              await fetch('/api/lead-packages?action=verify-payment', { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ gateway:'razorpay', ...resp }) })
              resolve()
            }, modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
          })
          rzp.open()
        })
        toast.success('Payment successful! Credits added.')
      } else if (gatewayId === 'paypal') {
        if (order.clientPayload?.approveUrl) window.location.href = order.clientPayload.approveUrl
      }
    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed')
    }
    setPayingId(null)
  }

  if (!mounted) return null

  // ─── Premium Pricing Table (matches design in image 2) ───────────────────────
  const S = {
    page:    { minHeight:'100vh', background:'linear-gradient(160deg,#FDFAF5 0%,#F5EDD8 60%,#EEE0C0 100%)', padding:'40px 20px', fontFamily:'Inter,sans-serif' },
    back:    { display:'inline-flex',alignItems:'center',gap:8,color:'#6B5744',textDecoration:'none',fontSize:13,fontWeight:600,marginBottom:32,padding:'8px 14px',borderRadius:9,background:'rgba(184,134,11,0.08)',border:'1px solid rgba(184,134,11,0.15)' },
    center:  { textAlign:'center' as const, maxWidth:860,margin:'0 auto 48px' },
    eyebrow: { display:'inline-flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase' as const,color:'#B8860B',marginBottom:14 },
    h1:      { fontFamily:'"Cormorant Garamond",serif',fontWeight:700,fontSize:'clamp(2.2rem,5vw,3.2rem)',color:'#0D1117',letterSpacing:'-1.5px',lineHeight:0.95,margin:'0 0 14px' },
    sub:     { fontSize:15,color:'#718096',lineHeight:1.6,maxWidth:520,margin:'0 auto 24px' },
    creditBadge: { display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',borderRadius:99,background:'white',border:'1px solid #D4B483',boxShadow:'0 2px 8px rgba(184,134,11,0.12)',fontSize:13,color:'#2C1810',marginBottom:16 },
    gwRow:   { display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap' as const },
    gwBadge: (color: string) => ({ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:8,border:`1px solid ${color}30`,background:`${color}08`,fontSize:12,fontWeight:700,color }),
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

        {/* Packages grid */}
        {isLoading ? (
          <div style={S.grid}>
            {[1,2,3,4].map(i => <div key={i} style={{ height:360,borderRadius:20,background:'rgba(13,17,23,0.06)',animation:'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : (
          <div style={S.grid}>
            {packages.map((pkg, i) => {
              const hot = i === 1
              const pricePerLead = Math.round(pkg.price / pkg.leadCredits / 100)
              const features = [`${pkg.leadCredits} lead credits`, `Valid for ${pkg.validityDays} days`, 'Pool with subscription credits', 'Use anytime — no expiry rush']
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
                  <button
                    onClick={() => {
                      if (!accessToken) { toast.error('Please log in first'); router.push('/login'); return }
                      if (gateways.length === 0) { toast.error('No payment gateway configured. Contact support.'); return }
                      if (gateways.length === 1) { handlePay(pkg, gateways[0].id as GatewayId) } else { setSelectedPkg(pkg) }
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

        {/* Pay per lead note */}
        <div style={S.note}>
          <span style={{ fontSize:20 }}>💡</span>
          <p style={{ margin:0,fontSize:13,color:'#6B5744',lineHeight:1.6 }}>
            <strong>Pay-per-lead</strong> also available — unlock individual leads directly from your dashboard. Price: <strong>₹299/lead</strong> (school-specific pricing may apply).
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selectedPkg && gateways.length > 1 && (
          <GatewayModal gateways={gateways} pkg={selectedPkg} onClose={() => setSelectedPkg(null)} onPay={gwId => handlePay(selectedPkg, gwId)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
