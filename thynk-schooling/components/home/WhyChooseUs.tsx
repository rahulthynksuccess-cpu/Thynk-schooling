'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'

const CARDS = [
  { icon:'🔍', title:'Smart Search',         desc:'Filter by board, city, fee, medium and 20+ parameters.',  accent:'#B8860B' },
  { icon:'⚖️', title:'Side-by-Side Compare', desc:'Compare up to 4 schools on fees, ratings and more.',      accent:'#0A5F55' },
  { icon:'🤖', title:'AI Recommendations',   desc:'Personalised suggestions based on your child\'s needs.',  accent:'#7A4A9A' },
  { icon:'📋', title:'One-Click Apply',       desc:'Submit enquiries to multiple schools simultaneously.',    accent:'#B8860B' },
  { icon:'👨‍💼', title:'Expert Counselling',  desc:'Free 1-on-1 sessions with certified counsellors.',       accent:'#0A5F55' },
  { icon:'✅', title:'Verified Listings',     desc:'Every school verified with real reviews and data.',       accent:'#7A4A9A' },
]

export function WhyChooseUs() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .08 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background:'#F5F0E8', padding:'clamp(80px,10vw,130px) 0', width:'100%', position:'relative', overflow:'hidden' }}>
      {/* Giant watermark */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:'"Cormorant Garamond",serif', fontSize:'clamp(120px,20vw,280px)', fontWeight:700, color:'rgba(13,17,23,0.025)', whiteSpace:'nowrap', pointerEvents:'none', userSelect:'none', letterSpacing:'-8px', lineHeight:1 }}>WHY US</div>

      {/* Top-right decorative circle */}
      <div style={{ position:'absolute', top:'-120px', right:'-120px', width:400, height:400, borderRadius:'50%', border:'1px solid rgba(184,134,11,0.12)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:300, height:300, borderRadius:'50%', border:'1px solid rgba(184,134,11,0.08)', pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'0 clamp(24px,5vw,80px)', position:'relative' }}>
        {/* Split header */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(40px,6vw,100px)', alignItems:'flex-end', marginBottom:'clamp(52px,7vw,88px)' }}>
          <motion.div initial={{ opacity:0, x:-24 }} animate={inView?{opacity:1,x:0}:{}} transition={{ duration:.65, ease:[.22,1,.36,1] }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#B8860B', marginBottom:20 }}>
              <span style={{ width:24, height:1.5, background:'#B8860B', display:'block', borderRadius:2 }}/>
              Why Parents Choose Us
              <span style={{ width:24, height:1.5, background:'#B8860B', display:'block', borderRadius:2 }}/>
            </div>
            <h2 style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:'clamp(2.4rem,5.5vw,5rem)', color:'#0D1117', lineHeight:.9, letterSpacing:'-2.5px', margin:0 }}>
              {ct.whyTitle||'Everything You Need,'}
              <em style={{ display:'block', fontStyle:'italic', color:'#B8860B' }}>Nothing You Don&apos;t</em>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity:0, x:24 }} animate={inView?{opacity:1,x:0}:{}} transition={{ duration:.65, delay:.1, ease:[.22,1,.36,1] }}
            style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(14px,1.6vw,17px)', color:'#4A5568', lineHeight:1.8, fontWeight:300, alignSelf:'flex-end', paddingBottom:4 }}>
            Built on feedback from real Indian parents. Every feature serves one purpose — helping you find the right school for your child, faster and with total confidence.
          </motion.p>
        </div>

        {/* 3-col cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(12px,1.8vw,20px)' }}>
          {CARDS.map((c, i) => (
            <motion.div key={c.title}
              initial={{ opacity:0, y:32 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ delay:i*.07, duration:.55, ease:[.22,1,.36,1] }}
              style={{ background:'#fff', borderRadius:'clamp(14px,1.8vw,22px)', padding:'clamp(24px,3vw,42px)', border:'1px solid rgba(13,17,23,0.07)', boxShadow:'0 2px 20px rgba(13,17,23,0.04)', transition:'all .28s cubic-bezier(.22,1,.36,1)', position:'relative', overflow:'hidden', cursor:'default' }}
              onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-6px)'; el.style.boxShadow=`0 20px 60px rgba(13,17,23,0.1), 0 0 0 1px ${c.accent}33`; el.style.borderColor=`${c.accent}33` }}
              onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='0 2px 20px rgba(13,17,23,0.04)'; el.style.borderColor='rgba(13,17,23,0.07)' }}>
              {/* Accent radial */}
              <div style={{ position:'absolute', top:0, right:0, width:100, height:100, background:`radial-gradient(circle at top right,${c.accent}0D 0%,transparent 70%)`, pointerEvents:'none' }}/>
              <div style={{ fontSize:'clamp(28px,3.5vw,40px)', marginBottom:20 }}>{c.icon}</div>
              <div style={{ width:28, height:2.5, background:c.accent, borderRadius:2, marginBottom:16 }}/>
              <h3 style={{ fontFamily:'"Cormorant Garamond",serif', fontWeight:700, fontSize:'clamp(17px,1.8vw,23px)', color:'#0D1117', marginBottom:10, lineHeight:1.1 }}>{c.title}</h3>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(13px,1.2vw,15px)', color:'#4A5568', lineHeight:1.7, margin:0, fontWeight:300 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
