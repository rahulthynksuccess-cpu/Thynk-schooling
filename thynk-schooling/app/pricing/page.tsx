'use client'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { apiGet } from '@/lib/api'
import { Check, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LeadPackage } from '@/types'

const PLANS = [
  {
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    period: 'forever',
    desc: 'Get listed and start receiving leads.',
    color: '#4A5568',
    features: [
      '5 lead credits per month',
      'Basic school profile',
      'Up to 5 photos',
      'Standard listing placement',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/register?role=school',
    hot: false,
  },
  {
    name: 'Silver',
    price: 2999,
    priceLabel: '₹2,999',
    period: '/month',
    desc: 'For schools serious about admissions.',
    color: '#718096',
    features: [
      '25 lead credits per month',
      'Verified school badge',
      'Unlimited photos & video',
      'Enhanced listing placement',
      'Analytics dashboard',
      'Priority email support',
    ],
    cta: 'Start Silver',
    href: '/register?role=school&plan=silver',
    hot: false,
  },
  {
    name: 'Gold',
    price: 5999,
    priceLabel: '₹5,999',
    period: '/month',
    desc: 'Most popular — best ROI for growing schools.',
    color: '#B8860B',
    features: [
      '75 lead credits per month',
      'Featured school badge',
      'Top placement in search',
      'Full analytics & reports',
      'School profile video',
      'Dedicated account manager',
      'WhatsApp support',
    ],
    cta: 'Start Gold',
    href: '/register?role=school&plan=gold',
    hot: true,
  },
  {
    name: 'Platinum',
    price: 9999,
    priceLabel: '₹9,999',
    period: '/month',
    desc: 'For chains and premium institutions.',
    color: '#553C9A',
    features: [
      'Unlimited lead credits',
      'Top-of-search placement',
      'Homepage featured listing',
      'AI-optimised profile',
      'Custom landing page',
      'Priority phone support',
      'Monthly strategy review',
    ],
    cta: 'Start Platinum',
    href: '/register?role=school&plan=platinum',
    hot: false,
  },
]

const FAQ = [
  { q: 'What is a lead credit?', a: 'A lead credit lets you unlock the full contact details of one parent who has applied to or shown interest in your school. Without purchasing, you only see masked information.' },
  { q: 'Do unused credits carry forward?', a: 'Yes! Unused monthly credits roll over for up to 90 days. Bulk package credits never expire.' },
  { q: 'Can I change my plan later?', a: 'Absolutely. Upgrade or downgrade anytime. Changes take effect at the start of your next billing cycle.' },
  { q: 'Is listing really free?', a: 'Yes — creating your school profile and appearing in search results is completely free. You only pay when you want to unlock lead contact details.' },
  { q: 'What payment methods do you accept?', a: 'UPI, credit/debit cards, net banking, and Razorpay payment links. GST invoices provided for all transactions.' },
]

export default function PricingPage() {
  const { data: packages } = useQuery<LeadPackage[]>({
    queryKey: ['lead-packages'],
    queryFn: () => apiGet('/lead-packages'),
    staleTime: 10 * 60 * 1000,
  })

  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>

        {/* Header */}
        <section style={{ padding: '64px 48px 0', textAlign: 'center' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '16px', fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />For Schools
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '60px', color: '#0D1117', letterSpacing: '-2px', marginBottom: '16px', lineHeight: 1.0 }}>
              Simple, Transparent <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Pricing</em>
            </h1>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '16px', color: '#4A5568', lineHeight: 1.75, fontWeight: 300 }}>
              Start free. Pay only for the leads you want. No hidden fees, no lock-in contracts.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section style={{ padding: '48px 48px 80px' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {PLANS.map((plan, i) => (
                <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .09 }}
                  style={{ background: '#fff', border: plan.hot ? `2px solid ${plan.color}` : '1px solid rgba(13,17,23,0.09)', borderRadius: '18px', padding: '28px', boxShadow: plan.hot ? `0 8px 40px rgba(184,134,11,0.15)` : '0 2px 12px rgba(13,17,23,0.05)', position: 'relative' }}>
                  {plan.hot && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#B8860B', color: '#FAF7F2', fontSize: '10px', fontWeight: 600, padding: '4px 14px', borderRadius: '100px', whiteSpace: 'nowrap', fontFamily: 'DM Sans,sans-serif', letterSpacing: '.06em' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '22px', color: '#0D1117', marginBottom: '4px' }}>{plan.name}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '40px', color: plan.hot ? plan.color : '#0D1117', lineHeight: 1 }}>
                      {plan.priceLabel}
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 300, fontSize: '14px', color: '#A0ADB8' }}>{plan.period}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', marginBottom: '20px', lineHeight: 1.55, fontWeight: 300 }}>{plan.desc}</p>
                  <div style={{ width: '100%', height: '1px', background: 'rgba(13,17,23,0.07)', marginBottom: '20px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4A5568', fontFamily: 'DM Sans,sans-serif', fontWeight: 300 }}>
                        <Check style={{ width: '14px', height: '14px', color: plan.hot ? plan.color : '#4ADE80', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href={plan.href}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '9px', background: plan.hot ? plan.color : 'transparent', color: plan.hot ? '#FAF7F2' : '#0D1117', border: plan.hot ? 'none' : '1px solid rgba(13,17,23,0.15)', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none', transition: 'all .2s' }}>
                    {plan.cta} <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Credit packages */}
        {packages && packages.length > 0 && (
          <section style={{ padding: '64px 48px', background: '#F5F0E8' }}>
            <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
                  <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Bulk Credits
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '42px', color: '#0D1117' }}>
                  Buy Credits in <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Bulk & Save</em>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(packages.length, 4)},1fr)`, gap: '14px' }}>
                {packages.map((pkg, i) => (
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
                    style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 10px rgba(13,17,23,0.05)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Zap style={{ width: '16px', height: '16px', color: '#B8860B' }} />
                      <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '17px', color: '#0D1117' }}>{pkg.name}</span>
                    </div>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '32px', color: '#B8860B', marginBottom: '4px' }}>
                      ₹{(pkg.price / 100).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', color: '#718096', marginBottom: '4px' }}>{pkg.leadCredits} credits · {pkg.validityDays} days</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: 600, color: '#4ADE80', marginBottom: '16px' }}>
                      ₹{Math.round(pkg.price / pkg.leadCredits / 100)}/lead
                    </div>
                    {pkg.description && <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', color: '#A0ADB8', marginBottom: '16px', lineHeight: 1.5 }}>{pkg.description}</p>}
                    <Link href="/dashboard/school" style={{ display: 'block', padding: '10px', borderRadius: '8px', background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.25)', color: '#7A5800', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
                      Buy Package
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section style={{ padding: '80px 48px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '42px', color: '#0D1117', textAlign: 'center', marginBottom: '40px' }}>
              Frequently Asked <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Questions</em>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {FAQ.map((f, i) => (
                <div key={f.q} style={{ padding: '20px 0', borderBottom: i < FAQ.length - 1 ? '1px solid rgba(13,17,23,0.08)' : 'none' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '18px', color: '#0D1117', marginBottom: '8px' }}>{f.q}</div>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '14px', color: '#4A5568', lineHeight: 1.7, fontWeight: 300 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: '0 48px 80px' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ background: '#0D1117', borderRadius: '20px', padding: '52px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '42px', color: '#FAF7F2', marginBottom: '12px' }}>
                Ready to Get More <em style={{ fontStyle: 'italic', color: '#E8C547' }}>Admissions?</em>
              </h2>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: 'rgba(250,247,242,0.55)', marginBottom: '28px', fontWeight: 300 }}>
                List your school free today. No credit card required.
              </p>
              <Link href="/register?role=school"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#B8860B', color: '#FAF7F2', border: 'none', borderRadius: '9px', padding: '14px 30px', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none', boxShadow: '0 4px 20px rgba(184,134,11,0.3)' }}>
                List Your School Free <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
