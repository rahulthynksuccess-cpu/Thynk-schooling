'use client'
export const dynamic = 'force-dynamic'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Zap, CheckCircle, Loader2, ArrowLeft, CreditCard, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { LeadPackage, LeadCredits } from '@/types'
import { config } from '@/lib/config'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { useState } from 'react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Gateway { id: string; name: string; priority: number }

type GatewayId = 'razorpay' | 'cashfree' | 'easebuzz' | 'paypal'

const GATEWAY_DISPLAY: Record<GatewayId, { logo: string; color: string; bg: string; description: string }> = {
  razorpay: { logo: '💙', color: '#3395FF', bg: 'rgba(51,149,255,0.06)', description: 'UPI · Cards · Netbanking · Wallets' },
  cashfree: { logo: '💚', color: '#00C853', bg: 'rgba(0,200,83,0.06)',   description: 'UPI · Cards · BNPL' },
  easebuzz: { logo: '🟠', color: '#FF6600', bg: 'rgba(255,102,0,0.06)',  description: 'Cards · UPI · Netbanking' },
  paypal:   { logo: '🌐', color: '#003087', bg: 'rgba(0,48,135,0.06)',   description: 'International · USD/AED/SAR' },
}

declare global {
  interface Window {
    Razorpay: new (opts: object) => { open: () => void }
    Cashfree: any
  }
}

/* ── Gateway Selector Modal ─────────────────────────────────────────────────── */
function GatewayModal({ gateways, pkg, onClose, onPay }:
  { gateways: Gateway[]; pkg: LeadPackage; onClose: () => void; onPay: (gatewayId: GatewayId) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#A0ADB8', padding: 4 }}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 22, color: '#0D1117', marginBottom: 4 }}>Choose Payment Method</div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#718096' }}>
            Paying for <strong>{pkg.name}</strong> — {pkg.leadCredits} credits ·{' '}
            <strong>₹{(pkg.price / 100).toLocaleString()}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gateways.map(gw => {
            const d = GATEWAY_DISPLAY[gw.id as GatewayId]
            if (!d) return null
            return (
              <button key={gw.id} onClick={() => onPay(gw.id as GatewayId)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, border: '1.5px solid rgba(13,17,23,0.1)', background: d.bg, cursor: 'pointer', transition: 'all .15s', textAlign: 'left' as const, width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = d.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${d.color}20` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,17,23,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{d.logo}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1117', marginBottom: 2 }}>{gw.name}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#718096' }}>{d.description}</div>
                </div>
                <CreditCard style={{ width: 16, height: 16, color: d.color, flexShrink: 0 }} />
              </button>
            )
          })}
        </div>

        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#A0ADB8', textAlign: 'center', marginTop: 16 }}>
          🔒 Secure payment · Credits added instantly after payment
        </p>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function LeadPackagesPage() {
  const [selectedPkg, setSelectedPkg] = useState<LeadPackage | null>(null)
  const [paying, setPayingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ packages: LeadPackage[]; gateways: Gateway[] }>({
    queryKey: ['lead-packages'],
    queryFn: () => fetch('/api/lead-packages', { cache: 'no-store' }).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  })

  const packages  = data?.packages  ?? []
  const gateways  = data?.gateways  ?? []

  const { data: credits } = useQuery<LeadCredits>({
    queryKey: ['lead-credits'],
    queryFn: () => fetch('/api/lead-credits', { cache: 'no-store', credentials: 'include' }).then(r => r.json()),
  })

  /* ── Handle gateway checkout ── */
  const handlePay = async (pkg: LeadPackage, gatewayId: GatewayId) => {
    setSelectedPkg(null)
    setPayingId(pkg.id)
    try {
      const orderRes = await fetch(
        `/api/lead-packages?id=${pkg.id}&action=buy&gateway=${gatewayId}`,
        { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      )
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')

      if (order._dev) {
        // Dev mode — auto verify
        await fetch('/api/lead-packages?action=verify-payment', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gateway: gatewayId, orderId: order.orderId }),
        })
        toast.success('Credits added! (dev mode)')
        setPayingId(null)
        return
      }

      switch (gatewayId) {
        case 'razorpay': {
          const { clientPayload } = order
          await new Promise<void>((resolve, reject) => {
            const rzp = new window.Razorpay({
              key:         clientPayload.key,
              amount:      clientPayload.amount,
              currency:    clientPayload.currency,
              order_id:    clientPayload.orderId,
              name:        'Thynk Schooling',
              description: `${pkg.name} — ${pkg.leadCredits} lead credits`,
              theme:       { color: '#B8860B' },
              handler: async (resp: any) => {
                await fetch('/api/lead-packages?action=verify-payment', {
                  method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gateway: 'razorpay',
                    orderId: resp.razorpay_order_id,
                    razorpay_order_id:   resp.razorpay_order_id,
                    razorpay_payment_id: resp.razorpay_payment_id,
                    razorpay_signature:  resp.razorpay_signature,
                  }),
                })
                resolve()
              },
              modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            })
            rzp.open()
          })
          toast.success('Payment successful! Credits added.')
          break
        }

        case 'cashfree': {
          const { clientPayload } = order
          // Load Cashfree SDK dynamically
          const cfScript = document.createElement('script')
          cfScript.src = clientPayload.mode === 'live'
            ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
            : 'https://sdk.cashfree.com/js/v3/cashfree.js'
          document.head.appendChild(cfScript)
          await new Promise(r => { cfScript.onload = r })

          const cashfree = window.Cashfree({ mode: clientPayload.mode })
          await cashfree.checkout({
            paymentSessionId: clientPayload.sessionId,
            returnUrl: `${window.location.origin}/dashboard/school/packages?gateway=cashfree&order_id=${clientPayload.orderId}`,
          })
          // Verification happens on return redirect
          break
        }

        case 'easebuzz': {
          const { clientPayload } = order
          // Easebuzz uses a redirect/form flow
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = `${clientPayload.baseUrl}/pay/`
          const field = document.createElement('input')
          field.type = 'hidden'; field.name = 'access_key'; field.value = clientPayload.accessKey
          form.appendChild(field)
          document.body.appendChild(form)
          form.submit()
          break
        }

        case 'paypal': {
          const { clientPayload } = order
          // PayPal uses a redirect flow
          if (clientPayload.approveUrl) {
            window.location.href = clientPayload.approveUrl
          } else {
            throw new Error('PayPal approval URL missing')
          }
          break
        }
      }
    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed')
    }
    setPayingId(null)
  }

  const RECOMMENDED_INDEX = 1

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      {/* Load Razorpay SDK if it's a configured gateway */}
      {gateways.some(g => g.id === 'razorpay') && (
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      )}

      <div className="container-xl mx-auto max-w-5xl">
        <Link href="/dashboard/school" className="inline-flex items-center gap-2 text-navy-400 hover:text-white font-display font-semibold text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <span className="badge-orange mb-4 inline-flex"><Package className="w-3.5 h-3.5" /> Lead Credit Packages</span>
          <h1 className="font-display font-bold text-4xl text-white mb-3">
            Buy Lead Credits in <span className="text-gradient">Bulk & Save</span>
          </h1>
          <p className="text-navy-300 text-lg max-w-xl mx-auto">
            Purchase lead credits in bulk to unlock parent contact details at a lower per-lead cost.
          </p>

          {credits && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 card rounded-xl">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="font-display font-bold text-white">{credits.availableCredits}</span>
              <span className="text-navy-400 text-sm">credits available</span>
            </div>
          )}

          {/* Payment methods info */}
          {gateways.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-navy-400 text-xs">Pay via:</span>
              {gateways.map(gw => {
                const d = GATEWAY_DISPLAY[gw.id as GatewayId]
                return d ? (
                  <span key={gw.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold" style={{ background: d.bg, color: d.color }}>
                    {d.logo} {gw.name}
                  </span>
                ) : null
              })}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, i) => (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={clsx('card p-6 flex flex-col gap-4 relative', i === RECOMMENDED_INDEX && 'border-orange-500/50 shadow-orange')}>
                {i === RECOMMENDED_INDEX && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-orange text-xs px-3 py-1">⭐ Most Popular</div>
                )}
                <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-xl">{pkg.name}</h3>
                  {pkg.description && <p className="text-navy-400 text-xs mt-1">{pkg.description}</p>}
                </div>
                <div>
                  <div className="font-display font-bold text-3xl text-white">
                    ₹{(pkg.price / 100).toLocaleString()}
                  </div>
                  <div className="text-navy-400 text-xs mt-0.5">for {pkg.leadCredits} lead credits</div>
                </div>
                <div className="text-orange-400 font-display font-bold text-sm">
                  ₹{Math.round(pkg.price / pkg.leadCredits / 100)}/lead
                </div>
                <ul className="space-y-2 flex-1">
                  {[`${pkg.leadCredits} lead credits`, `Valid for ${pkg.validityDays} days`, 'Pool with subscription credits', 'Use anytime — no expiry rush'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-navy-300 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                {/* Buy button — shows gateway selector if multiple gateways */}
                <button
                  onClick={() => {
                    if (gateways.length === 1) {
                      handlePay(pkg, gateways[0].id as GatewayId)
                    } else if (gateways.length === 0) {
                      toast.error('No payment gateway configured. Contact support.')
                    } else {
                      setSelectedPkg(pkg)
                    }
                  }}
                  disabled={paying === pkg.id}
                  className={clsx('w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm transition-all', i === RECOMMENDED_INDEX ? 'btn-primary' : 'btn-secondary')}>
                  {paying === pkg.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : gateways.length > 1
                      ? <><CreditCard className="w-4 h-4" />Buy Package</>
                      : 'Buy Package'
                  }
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 p-5 card text-center">
          <p className="text-navy-300 text-sm">
            💡 <strong className="text-white">Pay-per-lead</strong> also available — unlock individual leads directly from your dashboard.
            Price: ₹{config.lead.defaultPricePaise / 100}/lead (school-specific pricing may apply).
          </p>
        </div>
      </div>

      {/* Gateway selector modal */}
      <AnimatePresence>
        {selectedPkg && gateways.length > 1 && (
          <GatewayModal
            gateways={gateways}
            pkg={selectedPkg}
            onClose={() => setSelectedPkg(null)}
            onPay={gwId => handlePay(selectedPkg, gwId)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
