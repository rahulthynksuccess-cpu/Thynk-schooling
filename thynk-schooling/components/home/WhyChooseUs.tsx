'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContent } from '@/hooks/useContent'
import { Sparkles, ShieldCheck, PhoneCall, Zap, Map, GitCompare, HeartHandshake, BarChart3 } from 'lucide-react'

const FEATURES = [
  { icon:Sparkles,       title:'AI Recommendations',       desc:"ML model matches your child's profile to recommend the best-fit schools — personalised, precise, instant.",            badge:'Smart'       },
  { icon:ShieldCheck,    title:'100% Verified Schools',    desc:'Every school manually verified by our team. Real photos, accurate fees, genuine reviews — absolutely no fakes.',          badge:'Trusted'      },
  { icon:PhoneCall,      title:'Free 1-on-1 Counselling',  desc:'Expert education counsellors available Mon–Sat, 9 AM to 7 PM in Hindi and English. Zero cost, zero obligation.',         badge:'Free'         },
  { icon:Zap,            title:'Instant OTP Registration', desc:'Register in 30 seconds with just your mobile number. No email, no long forms, no friction whatsoever.',                    badge:'Fast'         },
  { icon:Map,            title:'Interactive School Map',   desc:'Find schools near you on a live map. Filter by walking distance, board, class range and admission status.',               badge:'Visual'       },
  { icon:GitCompare,     title:'Side-by-Side Compare',     desc:'Compare up to 4 schools simultaneously on fees, facilities, ratings, board and gender policy.',                           badge:'Smart'        },
  { icon:HeartHandshake, title:'Common Application',       desc:"Fill the admission form once and apply to multiple schools. Your child's profile is saved and reused everywhere.",        badge:'Convenient'   },
  { icon:BarChart3,      title:'Real-Time Tracking',       desc:'Track every application from submission to final admission — all on your parent dashboard with live status updates.',      badge:'Live'         },
]

export function WhyChooseUs() {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, amount:.08 })
  const raw = useContent('home')
  const ct = raw ?? {}
  return (
    <section ref={ref} style={{ background:'var(--why-bg,#F5F0E8)', padding:'96px 0' }}>
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 48px' }}>
        <motion.div initial={{ opacity:0, y:18 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ duration:.6 }} style={{ textAlign:'center', marginBottom:'56px' }}>
          <div className="eyebrow" style={{ justifyContent:'center' }}>Why Thynk Schooling</div>
          <h2 className="section-title" style={{ fontSize:'var(--why-title-size,56px)', color:'var(--why-title-color,#0D1117)', marginBottom:'14px' }}>{ct.whyTitle || <>Everything You Need, <em>Nothing You Don&apos;t</em></>}</h2>
          <p className="section-sub" style={{ margin:'0 auto', textAlign:'center' }}>Built specifically for the Indian school admission journey — from nursery to Class 12.</p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} initial={{ opacity:0, y:24 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ delay:i*.06, duration:.5 }}>
                <div className="card-hover" style={{ padding:'24px', height:'100%', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px', background:'radial-gradient(circle at top right, rgba(184,134,11,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon style={{ width:'18px', height:'18px', color:'#B8860B' }} />
                    </div>
                    <span className="badge-gold" style={{ fontSize:'10px' }}>{f.badge}</span>
                  </div>
                  <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'16px', color:'#0D1117', marginBottom:'8px' }}>{f.title}</h3>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#718096', lineHeight:1.65, fontWeight:300 }}>{f.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
