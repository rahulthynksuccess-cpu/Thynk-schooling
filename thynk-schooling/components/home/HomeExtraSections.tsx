'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight, Star, BookOpen } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'

const S = (bg='#FAF7F2') => ({ background: bg, padding: '96px 0' } as React.CSSProperties)
const C = { maxWidth:'var(--container-width,1400px)', margin:'0 auto', padding:'0 clamp(20px,5vw,80px)' } as React.CSSProperties

// ─── CITIES ────────────────────────────────────────────────────
const CITY_EMOJI: Record<string,string> = { delhi:'🏛️', mumbai:'🌊', bangalore:'🌿', hyderabad:'💎', chennai:'🎭', pune:'📚', kolkata:'🎨', ahmedabad:'🏗️', jaipur:'🏰', lucknow:'🌸' }

export function TopCitiesGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.1 })
  const { options: cities, isLoading } = useDropdown('city')
  return (
    <section ref={ref} style={S('#F5F0E8')}>
      <div style={C}>
        <motion.div initial={{ opacity:0, y:18 }} animate={inView ? { opacity:1, y:0 } : {}} style={{ textAlign:'center', marginBottom:'52px' }}>
          <div className="eyebrow" style={{ justifyContent:'center' }}>Browse by City</div>
          <h2 className="section-title" style={{ fontSize:'48px', marginBottom:'12px' }}>Schools in Your <em>City</em></h2>
          <p className="section-sub" style={{ margin:'0 auto', textAlign:'center' }}>Find top schools in 35+ Indian cities — all verified, all real.</p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px' }}>
          {isLoading
            ? Array.from({ length:10 }).map((_,i) => <div key={i} className="skeleton" style={{ height:'96px', borderRadius:'12px' }} />)
            : cities.slice(0,10).map((city, i) => (
                <motion.div key={city.value} initial={{ opacity:0, scale:.95 }} animate={inView ? { opacity:1, scale:1 } : {}} transition={{ delay:i*.04 }}>
                  <Link href={`/schools?city=${city.value}`} className="card-hover" style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', textAlign:'center' }}>
                    <span style={{ fontSize:'28px' }}>{CITY_EMOJI[city.value.toLowerCase()] || '🏙️'}</span>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'14px', color:'#0D1117' }}>{city.label}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:'3px', fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#A0ADB8' }}><MapPin style={{ width:'9px', height:'9px' }} />View Schools</span>
                  </Link>
                </motion.div>
              ))
          }
        </div>
        <div style={{ textAlign:'center', marginTop:'28px' }}>
          <Link href="/cities" className="btn-ghost" style={{ color:'#B8860B' }}>View all 35+ cities <ArrowRight style={{ width:'14px', height:'14px', display:'inline' }} /></Link>
        </div>
      </div>
    </section>
  )
}

// ─── COUNSELLING CTA ───────────────────────────────────────────
export function CounsellingCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.2 })
  return (
    <section ref={ref} style={S('#FAF7F2')}>
      <div style={C}>
        <motion.div initial={{ opacity:0, y:24 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ duration:.6 }}>
          <div style={{ background:'linear-gradient(145deg,#0D1117 0%,#1C2333 100%)', borderRadius:'20px', padding:'64px 72px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'48px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(184,134,11,0.12) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#E8C547', marginBottom:'18px' }}>
                <span style={{ width:'20px', height:'1px', background:'#B8860B', display:'block' }} /> 100% Free
              </div>
              <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'48px', color:'#FAF7F2', lineHeight:1.04, letterSpacing:'-1.5px', marginBottom:'14px' }}>
                Talk to an Expert<br /><em style={{ fontStyle:'italic', color:'#E8C547' }}>Education Counsellor</em>
              </h2>
              <div style={{ width:'40px', height:'1px', background:'#B8860B', margin:'16px 0' }} />
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'15px', color:'rgba(250,247,242,0.6)', lineHeight:1.75, fontWeight:300, maxWidth:'420px', marginBottom:'24px' }}>
                Confused about which board to choose? Our experts help 500+ families every month at absolutely zero cost.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {['CBSE vs ICSE vs IB — which board suits your child', 'School shortlisting by budget, location & values', 'Admission documents checklist & timelines'].map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px', fontFamily:'Inter,sans-serif', fontSize:'13px', color:'rgba(250,247,242,0.6)', fontWeight:300 }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'rgba(184,134,11,0.15)', border:'1px solid rgba(184,134,11,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#E8C547', flexShrink:0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flexShrink:0, width:'280px', position:'relative' }}>
              <div style={{ background:'rgba(250,247,242,0.06)', border:'1px solid rgba(232,197,71,0.2)', borderRadius:'16px', padding:'28px', textAlign:'center', backdropFilter:'blur(8px)' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>📞</div>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'20px', color:'#FAF7F2', marginBottom:'6px' }}>Book a Free Session</h3>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', color:'rgba(250,247,242,0.5)', marginBottom:'22px', lineHeight:1.5, fontWeight:300 }}>Mon–Sat · 9 AM – 7 PM<br/>Hindi & English · No spam</p>
                <Link href="/counselling" className="btn-gold" style={{ width:'100%', justifyContent:'center', display:'flex' }}>Book Now — It&apos;s Free</Link>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'rgba(250,247,242,0.3)', marginTop:'8px', letterSpacing:'.02em' }}>No sales calls · No obligation</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ──────────────────────────────────────────────
const TESTIMONIALS = [
  { name:'Priya Sharma', city:'Delhi',     child:'Daughter, Class 6', text:'Found the perfect CBSE school in just 2 days. The AI recommendations were uncannily accurate and the counsellor was absolutely phenomenal.', stars:5 },
  { name:'Rahul Mehta',  city:'Mumbai',    child:'Son, Class 1',      text:'Applied to 3 schools and got admission in all 3. The common form saved hours. The dashboard made tracking completely effortless.', stars:5 },
  { name:'Anjali Nair',  city:'Bangalore', child:'Twins, Nursery',    text:'The IB vs CBSE comparison was a game-changer. Free counselling answered every question. Truly outstanding service all around.', stars:5 },
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.1 })
  return (
    <section ref={ref} style={S('#F5F0E8')}>
      <div style={C}>
        <motion.div initial={{ opacity:0, y:18 }} animate={inView ? { opacity:1, y:0 } : {}} style={{ textAlign:'center', marginBottom:'52px' }}>
          <div className="eyebrow" style={{ justifyContent:'center' }}>Parent Stories</div>
          <h2 className="section-title" style={{ fontSize:'48px' }}>Trusted by <em>1 Lakh+ Parents</em></h2>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity:0, y:22 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ delay:i*.1 }}>
              <div className="card-hover" style={{ padding:'28px', height:'100%', display:'flex', flexDirection:'column', gap:'0' }}>
                <div style={{ display:'flex', gap:'2px', marginBottom:'16px' }}>
                  {Array.from({ length:t.stars }).map((_,s) => <Star key={s} style={{ width:'13px', height:'13px', fill:'#B8860B', color:'#B8860B' }} />)}
                </div>
                <div style={{ width:'36px', height:'1px', background:'#B8860B', marginBottom:'14px' }} />
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'17px', color:'#1C2333', lineHeight:1.65, flex:1, marginBottom:'20px' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', paddingTop:'16px', borderTop:'1px solid rgba(13,17,23,0.07)' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:'#EDE5D8', border:'1px solid rgba(13,17,23,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'16px', color:'#B8860B' }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'15px', color:'#0D1117' }}>{t.name}</div>
                    <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8' }}>{t.city} · {t.child}</div>
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

// ─── FOR SCHOOLS ───────────────────────────────────────────────
export function ForSchoolsCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.15 })
  const PLANS = [
    { name:'Free',     price:'₹0',     leads:'5 leads/mo',   hot:false, sub:'Basic profile · 5 images' },
    { name:'Silver',   price:'₹2,999', leads:'25 leads/mo',  hot:false, sub:'Verified badge · Analytics' },
    { name:'Gold',     price:'₹5,999', leads:'75 leads/mo',  hot:true,  sub:'Featured listing · Priority' },
    { name:'Platinum', price:'₹9,999', leads:'Unlimited',    hot:false, sub:'Top placement · Manager' },
  ]
  return (
    <section ref={ref} style={S('#FAF7F2')}>
      <div style={C}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
          <motion.div initial={{ opacity:0, x:-24 }} animate={inView ? { opacity:1, x:0 } : {}} transition={{ duration:.6 }}>
            <div className="card" style={{ padding:'40px', height:'100%', display:'flex', flexDirection:'column' }}>
              <div className="eyebrow" style={{ marginBottom:'16px' }}>For Schools</div>
              <h3 className="section-title" style={{ fontSize:'40px', marginBottom:'14px' }}>List Free.<br /><em>Buy Only What You Want.</em></h3>
              <div style={{ width:'36px', height:'1px', background:'#B8860B', margin:'16px 0' }} />
              <p className="section-sub" style={{ fontSize:'14px', marginBottom:'24px' }}>Parents applying through Thynk Schooling become leads. See masked info first — buy only the leads you're interested in. Credits pool with subscriptions.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'32px', flex:1 }}>
                {['Free school listing — no upfront cost ever', 'Verified parent leads with genuine intent', 'Buy credits in bulk and save up to 70%', 'Full analytics dashboard with lead tracking'].map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px', fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#4A5568', fontWeight:300 }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#B8860B', flexShrink:0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register?role=school" className="btn-primary" style={{ alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:'8px' }}>
                List Your School Free <ArrowRight style={{ width:'14px', height:'14px' }} />
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0, x:24 }} animate={inView ? { opacity:1, x:0 } : {}} transition={{ duration:.6, delay:.1 }} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div className="eyebrow" style={{ marginBottom:'4px' }}>Pricing Plans</div>
            {PLANS.map(p => (
              <div key={p.name} style={{ background: p.hot ? '#FDFAF0' : '#fff', border: p.hot ? '1px solid rgba(184,134,11,0.28)' : '1px solid rgba(13,17,23,0.09)', borderRadius:'11px', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: p.hot ? '0 2px 12px rgba(184,134,11,0.1)' : 'none', transition:'all .2s' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'16px', color:'#0D1117' }}>{p.name}</span>
                    {p.hot && <span className="badge-gold" style={{ fontSize:'10px' }}>Most Popular</span>}
                  </div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8' }}>{p.sub} · {p.leads}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'18px', color: p.hot ? '#B8860B' : '#0D1117' }}>{p.price}</div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#A0ADB8' }}>/month</div>
                </div>
              </div>
            ))}
            <Link href="/pricing" className="btn-outline" style={{ alignSelf:'flex-start' }}>
              View Full Pricing <ArrowRight style={{ width:'14px', height:'14px' }} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── BLOG PREVIEW ──────────────────────────────────────────────
const POSTS = [
  { title:'CBSE vs ICSE vs IB: Which Board is Right for Your Child?', slug:'cbse-vs-icse-vs-ib',       tag:'Board Guide',    time:'8 min' },
  { title:'How to Choose the Right School: 10 Questions to Ask',      slug:'how-to-choose-school',     tag:'Admission Tips', time:'6 min' },
  { title:'Top 10 Boarding Schools in India 2026',                    slug:'top-boarding-schools-india', tag:'Rankings',     time:'10 min'},
]

export function BlogPreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.1 })
  return (
    <section ref={ref} style={S('#F5F0E8')}>
      <div style={C}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'48px' }}>
          <div>
            <div className="eyebrow">From the Blog</div>
            <h2 className="section-title" style={{ fontSize:'48px' }}>Admission <em>Insights</em></h2>
          </div>
          <Link href="/blog" className="btn-ghost" style={{ color:'#B8860B' }}>All Articles →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          {POSTS.map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity:0, y:22 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ delay:i*.1 }}>
              <Link href={`/blog/${p.slug}`} className="card-hover" style={{ padding:'28px', display:'flex', flexDirection:'column', gap:'0', height:'100%' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.18)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
                  <BookOpen style={{ width:'18px', height:'18px', color:'#B8860B' }} />
                </div>
                <span className="badge-gold" style={{ fontSize:'10px', marginBottom:'12px', alignSelf:'flex-start' }}>{p.tag}</span>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'18px', color:'#0D1117', lineHeight:1.25, flex:1, marginBottom:'18px' }}>{p.title}</h3>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingTop:'14px', borderTop:'1px solid rgba(13,17,23,0.06)', fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#A0ADB8' }}>
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
