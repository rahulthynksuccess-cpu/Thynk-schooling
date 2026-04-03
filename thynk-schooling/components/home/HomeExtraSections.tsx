'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight, Star, BookOpen, CheckCircle2, TrendingUp, Shield, Zap } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const W = { width: '100%' } as React.CSSProperties
const C = { maxWidth: 'var(--container-width,1600px)', margin: '0 auto', padding: '0 clamp(20px,5vw,80px)' } as React.CSSProperties

// ─── CITIES ─────────────────────────────────────────────────────
const CITY_EMOJI: Record<string, string> = {
  delhi: '🏛️', mumbai: '🌊', bangalore: '🌿', hyderabad: '💎',
  chennai: '🎭', pune: '📚', kolkata: '🎨', ahmedabad: '🏗️',
  jaipur: '🏰', lucknow: '🌸',
}

export function TopCitiesGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  const { options: cities, isLoading } = useDropdown('city')

  return (
    <section ref={ref} style={{ ...W, background: '#FAF7F2', padding: 'clamp(80px,10vw,120px) 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, rgba(245,240,232,0.6), transparent)', pointerEvents: 'none' }} />
      <div style={C}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,64px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 16, justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
            Browse by City
            <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,5vw,4rem)', color: '#0D1117', lineHeight: .95, letterSpacing: '-2px', marginBottom: 14 }}>
            Schools in Your <em style={{ fontStyle: 'italic', color: '#B8860B' }}>City</em>
          </h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,1.5vw,17px)', color: '#4A5568', fontWeight: 300, maxWidth: '480px', margin: '0 auto' }}>Find top schools in 35+ Indian cities — all verified, all real.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'clamp(10px,1.5vw,16px)' }}>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ height: '110px', borderRadius: '14px', background: 'rgba(13,17,23,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            : cities.slice(0, 10).map((city, i) => (
                <motion.div key={city.value} initial={{ opacity: 0, scale: .93 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * .04 }}>
                  <Link href={`/schools?city=${city.value}`} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center',
                    padding: 'clamp(16px,2vw,24px) 12px',
                    background: '#fff', borderRadius: '14px',
                    border: '1px solid rgba(13,17,23,0.07)',
                    boxShadow: '0 2px 12px rgba(13,17,23,0.04)',
                    textDecoration: 'none', transition: 'all .22s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 36px rgba(184,134,11,0.12)'; el.style.borderColor = 'rgba(184,134,11,0.25)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 2px 12px rgba(13,17,23,0.04)'; el.style.borderColor = 'rgba(13,17,23,0.07)' }}>
                    <span style={{ fontSize: 'clamp(24px,3vw,32px)' }}>{CITY_EMOJI[city.value.toLowerCase()] || '🏙️'}</span>
                    <span style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(13px,1.3vw,16px)', color: '#0D1117', lineHeight: 1.2 }}>{city.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Inter,sans-serif', fontSize: '10px', color: '#B8860B', fontWeight: 500 }}>
                      <MapPin style={{ width: 9, height: 9 }} /> View Schools
                    </span>
                  </Link>
                </motion.div>
              ))
          }
        </div>
        <div style={{ textAlign: 'center', marginTop: 'clamp(20px,3vw,36px)' }}>
          <Link href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, color: '#B8860B', textDecoration: 'none', padding: '10px 20px', border: '1px solid rgba(184,134,11,0.3)', borderRadius: '8px', transition: 'all .2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#B8860B'; el.style.color = '#fff' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#B8860B' }}>
            View all 35+ cities <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── BOARD COMPARISON (NEW SECTION) ─────────────────────────────
const BOARDS = [
  {
    name: 'CBSE', full: 'Central Board of Secondary Education',
    color: '#1A6B8A', bg: '#EBF5FA',
    tags: ['National Level', 'Competitive Exams', 'Science & Maths Focus'],
    pros: ['Best for JEE/NEET preparation', 'Accepted across all Indian states', 'Standardised curriculum'],
    ideal: 'Families who may relocate across India',
  },
  {
    name: 'ICSE', full: 'Indian Certificate of Secondary Education',
    color: '#0A5F55', bg: '#E8F5F3',
    tags: ['Holistic', 'English Strong', 'Arts & Commerce'],
    pros: ['Strong English language focus', 'Comprehensive & well-rounded', 'High academic rigour'],
    ideal: 'Students inclined towards humanities & arts',
  },
  {
    name: 'IB', full: 'International Baccalaureate',
    color: '#7A4A9A', bg: '#F3EEFA',
    tags: ['Global Recognition', 'Research-Based', 'International'],
    pros: ['Recognised by global universities', 'Critical thinking emphasis', 'Inquiry-based learning'],
    ideal: 'Families considering studying abroad',
  },
]

export function BoardComparison() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  const [active, setActive] = useState(0)

  return (
    <section ref={ref} style={{ ...W, background: '#0D1117', padding: 'clamp(80px,10vw,120px) 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(184,134,11,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(184,134,11,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ ...C, position: 'relative' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,64px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#E8C547', marginBottom: 16, justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 22, height: 1, background: '#B8860B' }} />
            Quick Guide
            <span style={{ display: 'block', width: 22, height: 1, background: '#B8860B' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,5vw,4rem)', color: '#FAF7F2', lineHeight: .95, letterSpacing: '-2px', marginBottom: 14 }}>
            CBSE vs ICSE vs <em style={{ fontStyle: 'italic', color: '#E8C547' }}>IB</em>
          </h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,1.5vw,16px)', color: 'rgba(250,247,242,0.5)', fontWeight: 300, maxWidth: '480px', margin: '0 auto' }}>
            Choose the board that fits your child&apos;s strengths and your family&apos;s goals.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: 'clamp(32px,4vw,52px)' }}>
          {BOARDS.map((b, i) => (
            <button key={b.name} onClick={() => setActive(i)} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, transition: 'all .22s', background: active === i ? '#B8860B' : 'rgba(255,255,255,0.07)', color: active === i ? '#fff' : 'rgba(250,247,242,0.5)' }}>
              {b.name}
            </button>
          ))}
        </div>

        {/* Board detail card */}
        <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 'clamp(20px,3vw,40px)', alignItems: 'stretch' }}>
            {/* Left panel */}
            <div style={{ background: BOARDS[active].bg, borderRadius: '20px', padding: 'clamp(28px,4vw,48px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(56px,8vw,96px)', color: BOARDS[active].color, lineHeight: .85, letterSpacing: '-3px', marginBottom: 12 }}>
                {BOARDS[active].name}
              </div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: BOARDS[active].color, fontWeight: 500, opacity: 0.7, marginBottom: 24, lineHeight: 1.5 }}>
                {BOARDS[active].full}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 28 }}>
                {BOARDS[active].tags.map(t => (
                  <span key={t} style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: `${BOARDS[active].color}15`, color: BOARDS[active].color, letterSpacing: '.05em' }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 'auto', padding: '16px 20px', background: `${BOARDS[active].color}10`, border: `1px solid ${BOARDS[active].color}22`, borderRadius: '12px' }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 600, color: BOARDS[active].color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Ideal For</div>
                <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 15, fontWeight: 600, color: '#0D1117', lineHeight: 1.4 }}>{BOARDS[active].ideal}</div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,1.5vw,16px)' }}>
              {BOARDS[active].pros.map((pro, j) => (
                <motion.div key={pro} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * .08 }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: 'clamp(18px,2vw,28px)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '9px', background: `${BOARDS[active].color}22`, border: `1px solid ${BOARDS[active].color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: '#E8C547' }} />
                  </div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(250,247,242,0.75)', fontWeight: 300, lineHeight: 1.6, paddingTop: '6px' }}>{pro}</div>
                </motion.div>
              ))}
              <Link href="/blog/cbse-vs-icse-vs-ib" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.25)', borderRadius: '12px', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, color: '#E8C547', textDecoration: 'none', transition: 'all .2s', marginTop: 4 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B8860B'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,134,11,0.12)'; (e.currentTarget as HTMLElement).style.color = '#E8C547' }}>
                Read Full Comparison Guide <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── COUNSELLING CTA ─────────────────────────────────────────────
export function CounsellingCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .2 })
  return (
    <section ref={ref} style={{ ...W, background: '#FAF7F2', padding: 'clamp(80px,10vw,120px) 0' }}>
      <div style={C}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }}>
          <div style={{ background: 'linear-gradient(145deg,#0D1117 0%,#1C2333 100%)', borderRadius: 'clamp(16px,2vw,24px)', padding: 'clamp(40px,6vw,72px) clamp(32px,6vw,72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(32px,5vw,60px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(184,134,11,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,95,85,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter,sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8C547', marginBottom: '18px' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B', display: 'block' }} /> 100% Free
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2rem,5vw,4rem)', color: '#FAF7F2', lineHeight: 1.0, letterSpacing: '-1.5px', marginBottom: '14px' }}>
                Talk to an Expert<br /><em style={{ fontStyle: 'italic', color: '#E8C547' }}>Education Counsellor</em>
              </h2>
              <div style={{ width: '40px', height: '1px', background: '#B8860B', margin: '16px 0' }} />
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(250,247,242,0.55)', lineHeight: 1.75, fontWeight: 300, maxWidth: '420px', marginBottom: '24px' }}>
                Confused about which board to choose? Our experts help 500+ families every month at absolutely zero cost.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['CBSE vs ICSE vs IB — which board suits your child', 'School shortlisting by budget, location & values', 'Admission documents checklist & timelines'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Inter,sans-serif', fontSize: '13px', color: 'rgba(250,247,242,0.55)', fontWeight: 300 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#E8C547', flexShrink: 0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, width: 'clamp(240px,22vw,300px)', position: 'relative' }}>
              <div style={{ background: 'rgba(250,247,242,0.06)', border: '1px solid rgba(232,197,71,0.2)', borderRadius: '16px', padding: 'clamp(22px,3vw,32px)', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📞</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(18px,2vw,22px)', color: '#FAF7F2', marginBottom: '6px' }}>Book a Free Session</h3>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.45)', marginBottom: '22px', lineHeight: 1.5, fontWeight: 300 }}>Mon–Sat · 9 AM – 7 PM<br />Hindi & English · No spam</p>
                <Link href="/counselling" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '13px 20px', background: '#B8860B', color: '#fff', borderRadius: '10px', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#C9960D'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#B8860B'}>
                  Book Now — It&apos;s Free
                </Link>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: '10px', color: 'rgba(250,247,242,0.25)', marginTop: '8px', letterSpacing: '.02em' }}>No sales calls · No obligation</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi',     child: 'Daughter, Class 6', text: 'Found the perfect CBSE school in just 2 days. The AI recommendations were uncannily accurate and the counsellor was absolutely phenomenal.', stars: 5 },
  { name: 'Rahul Mehta',  city: 'Mumbai',    child: 'Son, Class 1',      text: 'Applied to 3 schools and got admission in all 3. The common form saved hours. The dashboard made tracking completely effortless.', stars: 5 },
  { name: 'Anjali Nair',  city: 'Bangalore', child: 'Twins, Nursery',    text: 'The IB vs CBSE comparison was a game-changer. Free counselling answered every question. Truly outstanding service all around.', stars: 5 },
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })

  return (
    <section ref={ref} style={{ ...W, background: '#F5F0E8', padding: 'clamp(80px,10vw,120px) 0', position: 'relative', overflow: 'hidden' }}>
      {/* Large quote mark bg */}
      <div style={{ position: 'absolute', top: '10%', left: '3%', fontFamily: 'Georgia,serif', fontSize: 'clamp(120px,18vw,300px)', color: 'rgba(184,134,11,0.06)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>&ldquo;</div>

      <div style={C}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,64px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 16, justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
            Parent Stories
            <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,5vw,4rem)', color: '#0D1117', lineHeight: .95, letterSpacing: '-2px' }}>
            Trusted by <em style={{ fontStyle: 'italic', color: '#B8860B' }}>1 Lakh+ Parents</em>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(12px,2vw,20px)' }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * .1 }}>
              <div style={{ background: '#fff', borderRadius: '18px', padding: 'clamp(24px,3vw,36px)', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(13,17,23,0.07)', boxShadow: '0 4px 20px rgba(13,17,23,0.05)', transition: 'all .22s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(184,134,11,0.1)'; el.style.borderColor = 'rgba(184,134,11,0.2)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 20px rgba(13,17,23,0.05)'; el.style.borderColor = 'rgba(13,17,23,0.07)' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                  {Array.from({ length: t.stars }).map((_, s) => <Star key={s} style={{ width: '13px', height: '13px', fill: '#B8860B', color: '#B8860B' }} />)}
                </div>
                <div style={{ width: '32px', height: '1.5px', background: '#B8860B', marginBottom: '16px', borderRadius: '2px' }} />
                <p style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: 'clamp(15px,1.6vw,18px)', color: '#1C2333', lineHeight: 1.65, flex: 1, marginBottom: '20px' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(13,17,23,0.07)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EDE5D8', border: '1px solid rgba(13,17,23,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '17px', color: '#B8860B', flexShrink: 0 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '15px', color: '#0D1117' }}>{t.name}</div>
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '11px', color: '#A0ADB8' }}>{t.city} · {t.child}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOR SCHOOLS CTA ─────────────────────────────────────────────
export function ForSchoolsCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .15 })
  const PLANS = [
    { name: 'Free',     price: '₹0',     leads: '5 leads/mo',  hot: false, sub: 'Basic profile · 5 images' },
    { name: 'Silver',   price: '₹2,999', leads: '25 leads/mo', hot: false, sub: 'Verified badge · Analytics' },
    { name: 'Gold',     price: '₹5,999', leads: '75 leads/mo', hot: true,  sub: 'Featured listing · Priority' },
    { name: 'Platinum', price: '₹9,999', leads: 'Unlimited',   hot: false, sub: 'Top placement · Manager' },
  ]
  const PERKS = [
    { icon: <Shield style={{ width: 16, height: 16 }} />, text: 'Free school listing — no upfront cost ever' },
    { icon: <TrendingUp style={{ width: 16, height: 16 }} />, text: 'Verified parent leads with genuine intent' },
    { icon: <Zap style={{ width: 16, height: 16 }} />, text: 'Buy credits in bulk and save up to 70%' },
    { icon: <CheckCircle2 style={{ width: 16, height: 16 }} />, text: 'Full analytics dashboard with lead tracking' },
  ]
  return (
    <section ref={ref} style={{ ...W, background: '#FAF7F2', padding: 'clamp(80px,10vw,120px) 0' }}>
      <div style={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(16px,2.5vw,28px)' }}>
          <motion.div initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: .6 }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: 'clamp(28px,4vw,48px)', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(13,17,23,0.07)', boxShadow: '0 4px 24px rgba(13,17,23,0.05)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 16 }}>
                <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
                For Schools
              </div>
              <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.2rem)', color: '#0D1117', lineHeight: .95, letterSpacing: '-2px', marginBottom: 14 }}>
                List Free.<br /><em style={{ fontStyle: 'italic', color: '#B8860B' }}>Buy Only What You Want.</em>
              </h3>
              <div style={{ width: '36px', height: '1.5px', background: '#B8860B', margin: '16px 0', borderRadius: '2px' }} />
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(13px,1.4vw,15px)', color: '#4A5568', lineHeight: 1.75, fontWeight: 300, marginBottom: '24px' }}>
                Parents applying through Thynk Schooling become leads. See masked info first — buy only the leads you&apos;re interested in.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                {PERKS.map(p => (
                  <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Inter,sans-serif', fontSize: '13px', color: '#4A5568', fontWeight: 300 }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8860B', flexShrink: 0 }}>{p.icon}</div>
                    {p.text}
                  </div>
                ))}
              </div>
              <Link href="/register?role=school" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', background: '#0D1117', color: '#FAF7F2', borderRadius: '10px', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#B8860B'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0D1117'}>
                List Your School Free <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: .6, delay: .1 }} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.5vw,14px)' }}>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 4 }}>Pricing Plans</div>
            {PLANS.map(p => (
              <div key={p.name} style={{ background: p.hot ? '#FDFAF0' : '#fff', border: p.hot ? '1.5px solid rgba(184,134,11,0.3)' : '1px solid rgba(13,17,23,0.09)', borderRadius: '14px', padding: 'clamp(14px,2vw,20px) clamp(16px,2vw,24px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: p.hot ? '0 4px 20px rgba(184,134,11,0.1)' : 'none', transition: 'all .2s', position: 'relative' }}>
                {p.hot && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#B8860B', color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '100px' }}>Most Popular</div>}
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(15px,1.6vw,18px)', color: '#0D1117', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '11px', color: '#A0ADB8' }}>{p.sub} · {p.leads}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(16px,1.8vw,20px)', color: p.hot ? '#B8860B' : '#0D1117' }}>{p.price}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '10px', color: '#A0ADB8' }}>/month</div>
                </div>
              </div>
            ))}
            <Link href="/pricing" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, color: '#B8860B', textDecoration: 'none', padding: '10px 18px', border: '1px solid rgba(184,134,11,0.3)', borderRadius: '8px', transition: 'all .2s', marginTop: 4 }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#B8860B'; el.style.color = '#fff' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#B8860B' }}>
              View Full Pricing <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── BLOG PREVIEW ────────────────────────────────────────────────
const POSTS = [
  { title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?', slug: 'cbse-vs-icse-vs-ib',        tag: 'Board Guide',    time: '8 min' },
  { title: 'How to Choose the Right School: 10 Questions to Ask',      slug: 'how-to-choose-school',      tag: 'Admission Tips', time: '6 min' },
  { title: 'Top 10 Boarding Schools in India 2026',                    slug: 'top-boarding-schools-india', tag: 'Rankings',      time: '10 min' },
]

export function BlogPreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .1 })
  return (
    <section ref={ref} style={{ ...W, background: '#F5F0E8', padding: 'clamp(80px,10vw,120px) 0', position: 'relative', overflow: 'hidden' }}>
      <div style={C}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(40px,5vw,60px)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 16 }}>
              <span style={{ display: 'block', width: 22, height: 1.5, background: '#B8860B' }} />
              From the Blog
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,5vw,4rem)', color: '#0D1117', lineHeight: .95, letterSpacing: '-2px' }}>
              Admission <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Insights</em>
            </h2>
          </div>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, color: '#B8860B', textDecoration: 'none', padding: '10px 18px', border: '1px solid rgba(184,134,11,0.3)', borderRadius: '8px', transition: 'all .2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#B8860B'; el.style.color = '#fff' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#B8860B' }}>
            All Articles <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(12px,2vw,20px)' }}>
          {POSTS.map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * .1 }}>
              <Link href={`/blog/${p.slug}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'clamp(24px,3vw,36px)', background: '#fff', borderRadius: '18px', border: '1px solid rgba(13,17,23,0.07)', boxShadow: '0 4px 20px rgba(13,17,23,0.05)', textDecoration: 'none', transition: 'all .22s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(184,134,11,0.1)'; el.style.borderColor = 'rgba(184,134,11,0.2)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 20px rgba(13,17,23,0.05)'; el.style.borderColor = 'rgba(13,17,23,0.07)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF7E0', border: '1px solid rgba(184,134,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', flexShrink: 0 }}>
                  <BookOpen style={{ width: '20px', height: '20px', color: '#B8860B' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B8860B', background: 'rgba(184,134,11,0.08)', padding: '3px 8px', borderRadius: '4px', marginBottom: 14, alignSelf: 'flex-start' }}>{p.tag}</span>
                <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(16px,1.8vw,20px)', color: '#0D1117', lineHeight: 1.25, flex: 1, marginBottom: '18px' }}>{p.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '14px', borderTop: '1px solid rgba(13,17,23,0.07)', fontFamily: 'Inter,sans-serif', fontSize: '11px', color: '#A0ADB8' }}>
                  📖 {p.time} read
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
