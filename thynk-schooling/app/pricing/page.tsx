'use client'
export const dynamic='force-dynamic'
import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Check, ArrowRight, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useContent } from '@/hooks/useContent'

const DEFAULT_FAQ=[
  {q:'What is a lead credit?',a:'One lead credit = one parent enquiry. When a parent fills an admission form for your school, you use a credit to unlock their full contact details.'},
  {q:'Can I try before I pay?',a:'Yes! Our Free subscription plan lets you list your school and receive lead credits every month, forever. No credit card required.'},
  {q:'Do credits roll over?',a:'Monthly plan credits do not roll over. Credits refresh each month with your active subscription plan.'},
  {q:'Can I change plans anytime?',a:'Yes. Upgrade or downgrade instantly from your school dashboard. Unused credits from the old plan carry over for 30 days.'},
  {q:'Is there a setup fee?',a:'Never. Listing is free, plans are monthly with no lock-in, and you can cancel anytime.'},
]

interface SubPlan {
  id: string; planKey: string; name: string; description: string
  price: number; leadsPerMonth: number; features: string[]
  isHot: boolean; cta: string; sortOrder: number; isActive: boolean
}

const ease = [0.22, 1, 0.36, 1] as const

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const pricingContent = useContent('pricing')
  const { data: subPlans, isLoading: plansLoading } = useQuery<SubPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => fetch('/api/admin?action=subscription-plans').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
  const faqRef = useRef(null)
  const plansRef = useRef(null)
  const faqInView = useInView(faqRef, { once: true })
  const plansInView = useInView(plansRef, { once: true, amount: 0.1 })

  const activePlans = (subPlans ?? []).filter(p => p.isActive)

  const FAQ = DEFAULT_FAQ.map((def, i) => ({
    q: pricingContent?.[`faq${i+1}q`] || def.q,
    a: pricingContent?.[`faq${i+1}a`] || def.a,
  }))

  const formatPrice = (paise: number) => {
    if (paise === 0) return { label: '₹0', period: 'forever' }
    const rs = Math.round(paise / 100)
    return { label: `₹${rs.toLocaleString('en-IN')}`, period: '/mo' }
  }

  const cols = Math.min(activePlans.length || 4, 4)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');

        .pricing-page-root { background: #0A0E17; }

        /* ── Hero grid bg ── */
        .pricing-hero-grid {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
          background:
            radial-gradient(ellipse 60% 60% at 50% -10%, rgba(184,134,11,0.18) 0%, transparent 60%),
            linear-gradient(rgba(184,134,11,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,134,11,0.04) 1px, transparent 1px);
          background-size: 100% 100%, 48px 48px, 48px 48px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 100%);
        }

        /* Floating orbs */
        .pricing-orb {
          position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px);
          animation: orbFloat 14s ease-in-out infinite;
        }
        .pricing-orb-1 { width: 400px; height: 400px; background: rgba(184,134,11,0.10); top: -80px; left: 10%; animation-delay: 0s; }
        .pricing-orb-2 { width: 280px; height: 280px; background: rgba(45,212,191,0.06); top: 60px; right: 8%; animation-delay: -7s; }
        @keyframes orbFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-28px) scale(1.06); }
        }

        /* ── Plan cards ── */
        .pc-card {
          background: #F5F0E8;
          border: 1px solid rgba(13,17,23,0.08);
          border-radius: 18px;
          padding: 28px 24px 24px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s cubic-bezier(.22,1,.36,1);
          cursor: default;
        }
        .pc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 56px rgba(13,17,23,0.13);
        }
        .pc-card.hot {
          background: #0D1117;
          border-color: rgba(184,134,11,0.35);
          box-shadow: 0 0 0 1px rgba(184,134,11,0.18), 0 8px 40px rgba(184,134,11,0.12);
        }
        .pc-card.hot:hover {
          transform: translateY(-8px);
          box-shadow: 0 0 0 1px rgba(184,134,11,0.35), 0 28px 64px rgba(184,134,11,0.2);
        }

        /* Shimmer on hot card */
        .pc-card.hot::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(232,197,71,0.07) 50%, transparent 60%);
          animation: cardShimmer 4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes cardShimmer {
          0%   { left: -100%; }
          40%  { left: 140%; }
          100% { left: 140%; }
        }

        /* Hot badge */
        .pc-hot-badge {
          position: absolute; top: 14px; right: 14px;
          background: linear-gradient(135deg, #B8860B, #E8C547);
          color: #0D1117; font-family: Inter,sans-serif;
          font-size: 9px; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; padding: 4px 9px; border-radius: 20px;
          display: flex; align-items: center; gap: 4px;
        }

        /* Feature check */
        .pc-check {
          width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
          display: flex; align-items: center; justify-content: center;
        }
        .pc-check.light { background: rgba(13,17,23,0.06); border: 1px solid rgba(13,17,23,0.1); }
        .pc-check.gold  { background: rgba(184,134,11,0.15); border: 1px solid rgba(184,134,11,0.3); }

        /* Plans section watermark */
        .plans-watermark {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(140px, 20vw, 260px); font-weight: 700;
          color: rgba(13,17,23,0.025); white-space: nowrap;
          pointer-events: none; user-select: none; letter-spacing: -8px;
        }

        /* FAQ item */
        .faq-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .faq-item.open { border-color: rgba(184,134,11,0.4); }
        .faq-trigger {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 18px 22px; border: none; background: transparent;
          cursor: pointer; text-align: left;
        }
        .faq-icon {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: rgba(184,134,11,0.12); border: 1px solid rgba(184,134,11,0.25);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.25s cubic-bezier(.22,1,.36,1), background 0.2s;
        }
        .faq-item.open .faq-icon { transform: rotate(45deg); background: rgba(184,134,11,0.2); }

        /* Shimmer text */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #B8860B 0%, #E8C547 40%, #F5D67A 50%, #E8C547 60%, #B8860B 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* Stat bar */
        .pricing-stat {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 0 clamp(16px, 2.5vw, 32px);
        }
        .pricing-stat + .pricing-stat {
          border-left: 1px solid rgba(250,247,242,0.1);
        }

        /* Grid responsive */
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Navbar />
      <main className="pricing-page-root" style={{ paddingTop: 72 }}>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', padding: 'clamp(72px,10vw,120px) 0 clamp(56px,8vw,96px)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div className="pricing-hero-grid" />
          <div className="pricing-orb pricing-orb-1" />
          <div className="pricing-orb pricing-orb-2" />

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,72px)', width: '100%', position: 'relative', zIndex: 1 }}>

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}
            >
              <span style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#E8C547' }}>For Schools</span>
              <span style={{ width: 28, height: 1, background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease }}
              style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(2.8rem,7vw,6rem)', color: '#FAF7F2', lineHeight: 0.9, letterSpacing: '-2.5px', textAlign: 'center', marginBottom: 20 }}
            >
              Simple Pricing,
              <em className="shimmer-text" style={{ display: 'block', fontStyle: 'italic' }}>Powerful Results</em>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease }}
              style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(250,247,242,0.5)', lineHeight: 1.75, fontWeight: 300, maxWidth: 500, margin: '0 auto 28px', textAlign: 'center' }}
            >
              List free. Subscribe and get leads included monthly. No wastage, no lock-in.
            </motion.p>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.55 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 44 }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, fill: '#E8C547', color: '#E8C547' }} />)}
              </div>
              <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(250,247,242,0.4)', fontWeight: 300 }}>
                Trusted by <strong style={{ color: 'rgba(250,247,242,0.7)', fontWeight: 600 }}>8,000+ schools</strong> across India
              </span>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6, ease }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 'clamp(16px,2vw,24px) clamp(12px,2vw,24px)', maxWidth: 680, margin: '0 auto' }}
            >
              {[
                { n: '12,000+', l: 'Schools Listed' },
                { n: '8,000+', l: 'Subscribers' },
                { n: '350+', l: 'Cities' },
                { n: '₹0', l: 'Setup Fee' },
              ].map((s, i) => (
                <div key={i} className="pricing-stat">
                  <span style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(22px,2.5vw,28px)', color: '#E8C547', letterSpacing: '-1px', lineHeight: 1 }}>{s.n}</span>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.4)', marginTop: 2 }}>{s.l}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section ref={plansRef} style={{ background: '#F5F0E8', padding: 'clamp(60px,8vw,96px) 0', position: 'relative', overflow: 'hidden' }}>
          <div className="plans-watermark">PLANS</div>

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,72px)', position: 'relative' }}>

            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, ease }}
              style={{ textAlign: 'center', marginBottom: 36 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 20, height: 1, background: '#B8860B' }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B' }}>Choose a Plan</span>
                <span style={{ width: 20, height: 1, background: '#B8860B' }} />
              </div>
              <h2 style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.4rem)', color: '#0D1117', letterSpacing: '-1.5px', lineHeight: 0.95 }}>
                Plans that grow<br /><em style={{ fontStyle: 'italic', color: '#B8860B' }}>with your school</em>
              </h2>
            </motion.div>

            {plansLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 420, borderRadius: 18, background: 'rgba(13,17,23,0.06)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : (
              <div
                className="plans-grid"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'clamp(10px,1.5vw,16px)', alignItems: 'start' }}
              >
                {activePlans.map((plan, i) => {
                  const { label, period } = formatPrice(plan.price)
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 32, scale: 0.96 }}
                      animate={plansInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                      transition={{ delay: i * 0.09, duration: 0.6, ease }}
                    >
                      <div className={`pc-card${plan.isHot ? ' hot' : ''}`}>

                        {plan.isHot && (
                          <div className="pc-hot-badge">
                            <Zap style={{ width: 9, height: 9 }} /> Most Popular
                          </div>
                        )}

                        {/* Name + description */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 20, color: plan.isHot ? '#FAF7F2' : '#0D1117', marginBottom: 3 }}>{plan.name}</div>
                          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: plan.isHot ? 'rgba(250,247,242,0.45)' : '#8A9AB0', fontWeight: 300, lineHeight: 1.5 }}>{plan.description}</div>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(2rem,3.5vw,2.8rem)', color: plan.isHot ? '#E8C547' : '#0D1117', letterSpacing: '-1.5px', lineHeight: 1 }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: plan.isHot ? 'rgba(250,247,242,0.4)' : '#A0ADB8', fontWeight: 300 }}>{period}</span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: plan.isHot ? 'rgba(255,255,255,0.07)' : 'rgba(13,17,23,0.07)', marginBottom: 16 }} />

                        {/* Features */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, marginBottom: 22 }}>
                          {plan.features.map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontFamily: 'Inter,sans-serif', fontSize: 12, color: plan.isHot ? 'rgba(250,247,242,0.7)' : '#4A5568', fontWeight: 300, lineHeight: 1.45 }}>
                              <div className={`pc-check ${plan.isHot ? 'gold' : 'light'}`}>
                                <Check style={{ width: 9, height: 9, color: plan.isHot ? '#E8C547' : '#6B7280' }} />
                              </div>
                              {f}
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        <Link
                          href={`/register?role=school&plan=${plan.planKey}`}
                          className={plan.isHot ? 'btn btn-gold' : 'btn btn-dark'}
                          style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', fontSize: 13 }}
                        >
                          {plan.cta} <ArrowRight style={{ width: 13, height: 13 }} />
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Footnote */}
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}
              style={{ textAlign: 'center', marginTop: 28, fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#A0ADB8', fontWeight: 300 }}
            >
              All prices in INR · Cancel anytime · No credit card needed for Free plan
            </motion.p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section ref={faqRef} style={{ background: '#0A0E17', padding: 'clamp(60px,8vw,96px) 0', position: 'relative' }}>
          {/* Subtle radial glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(184,134,11,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(20px,5vw,40px)', position: 'relative', zIndex: 1 }}>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={faqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease }}
              style={{ textAlign: 'center', marginBottom: 36 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 20, height: 1, background: '#B8860B' }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8C547' }}>FAQ</span>
                <span style={{ width: 20, height: 1, background: '#B8860B' }} />
              </div>
              <h2 style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.2rem)', color: '#FAF7F2', letterSpacing: '-1.5px', lineHeight: 0.92 }}>
                Common <em style={{ fontStyle: 'italic', color: '#E8C547' }}>Questions</em>
              </h2>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQ.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={faqInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.07, duration: 0.5, ease }}
                >
                  <div className={`faq-item${openFaq === i ? ' open' : ''}`}>
                    <button className="faq-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 600, fontSize: 'clamp(15px,1.8vw,18px)', color: '#FAF7F2', lineHeight: 1.3 }}>{f.q}</span>
                      <div className="faq-icon">
                        <span style={{ color: '#E8C547', fontSize: 15, lineHeight: 1, fontWeight: 300 }}>+</span>
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(13px,1.4vw,14px)', color: 'rgba(250,247,242,0.5)', lineHeight: 1.75, fontWeight: 300, margin: 0, padding: '0 22px 18px' }}>{f.a}</p>
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
        <section style={{ background: '#F5F0E8', padding: 'clamp(48px,6vw,72px) 0' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}
            style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}
          >
            <h2 style={{ fontFamily: '"Cormorant Garamond",serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: '#0D1117', letterSpacing: '-1.5px', lineHeight: 0.95, marginBottom: 14 }}>
              Ready to grow<br /><em style={{ fontStyle: 'italic', color: '#B8860B' }}>admissions?</em>
            </h2>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: '#718096', fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
              Start free — no credit card needed. Upgrade when you're ready.
            </p>
            <Link href="/register?role=school" className="btn btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              List Your School Free <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  )
}
