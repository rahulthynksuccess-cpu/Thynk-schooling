'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, Zap, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { apiGet, apiPost } from '@/lib/api'
import { LeadPackage, LeadCredits } from '@/types'
import { config } from '@/lib/config'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

declare global { interface Window { Razorpay: new (opts: object) => { open: () => void } } }

export default function LeadPackagesPage() {
  const { data: packages, isLoading } = useQuery<LeadPackage[]>({
    queryKey: ['lead-packages'],
    queryFn:  () => apiGet('/lead-packages'),
    staleTime: 10 * 60 * 1000,
  })

  const { data: credits } = useQuery<LeadCredits>({
    queryKey: ['lead-credits'],
    queryFn:  () => apiGet('/lead-credits'),
  })

  const buyMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const order = await apiPost<{ orderId: string; amount: number; currency: string }>(`/lead-packages/${packageId}/buy`)
      return new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:          config.razorpay.keyId,
          amount:       order.amount,
          currency:     order.currency,
          order_id:     order.orderId,
          name:         'Thynk Schooling',
          description:  'Lead Credit Package',
          theme:        { color: '#FF5C00' },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            await apiPost('/lead-packages/verify-payment', response)
            resolve()
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        })
        rzp.open()
      })
    },
    onSuccess: () => toast.success('Credits added! You can now unlock leads.'),
    onError: (err) => { if ((err as Error).message !== 'Payment cancelled') toast.error('Payment failed. Please try again.') },
  })

  const RECOMMENDED_INDEX = 1

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

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
            Credits pool with your subscription and never expire early.
          </p>

          {credits && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 card rounded-xl">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="font-display font-bold text-white">{credits.availableCredits}</span>
              <span className="text-navy-400 text-sm">credits available</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-80 rounded-2xl"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(packages ?? []).map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={clsx(
                  'card p-6 flex flex-col gap-4 relative',
                  i === RECOMMENDED_INDEX && 'border-orange-500/50 shadow-orange'
                )}
              >
                {i === RECOMMENDED_INDEX && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-orange text-xs px-3 py-1">
                    ⭐ Most Popular
                  </div>
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
                    ₹{(pkg.price / 100).toLocaleString('en-IN')}
                  </div>
                  <div className="text-navy-400 text-xs mt-0.5">for {pkg.leadCredits} lead credits</div>
                </div>

                <div className="text-orange-400 font-display font-bold text-sm">
                  ₹{Math.round(pkg.price / pkg.leadCredits / 100)}/lead
                </div>

                <ul className="space-y-2 flex-1">
                  {[
                    `${pkg.leadCredits} lead credits`,
                    `Valid for ${pkg.validityDays} days`,
                    'Pool with subscription credits',
                    'Use anytime — no expiry rush',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-navy-300 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => buyMutation.mutate(pkg.id)}
                  disabled={buyMutation.isPending}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm transition-all',
                    i === RECOMMENDED_INDEX
                      ? 'btn-primary'
                      : 'btn-secondary'
                  )}
                >
                  {buyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Package'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 p-5 card text-center">
          <p className="text-navy-300 text-sm">
            💡 <strong className="text-white">Pay-per-lead</strong> also available — unlock individual leads directly from your dashboard without buying a package.
            Price: ₹{config.lead.defaultPricePaise / 100}/lead (school-specific pricing may apply).
          </p>
        </div>
      </div>
    </div>
  )
}
