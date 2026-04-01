'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '@/hooks/useContent'

const CARDS = [
  { icon:'🔍', title:'Smart Search',        desc:'Filter by board, city, fee, medium and 20+ parameters in seconds.' },
  { icon:'⚖️', title:'Side-by-Side Compare',desc:'Compare up to 4 schools on fees, ratings, infrastructure and more.' },
  { icon:'🤖', title:'AI Recommendations',  desc:'Get personalised school suggestions based on your child\'s needs.' },
  { icon:'📋', title:'One-Click Apply',      desc:'Submit admission enquiries to multiple schools simultaneously.' },
  { icon:'👨‍💼', title:'Expert Counselling',  desc:'Free 1-on-1 sessions with certified school admission counsellors.' },
  { icon:'✅', title:'Verified Listings',    desc:'Every school is verified with real reviews and authentic data.' },
]

export function WhyChooseUs() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: .15 })
  const ct = useContent('home') ?? {}

  return (
    <section ref={ref} style={{ background:'var(--why-bg,#F5F0E8)', padding:'clamp(60px,8vw,100px) 0', width:'100%' }}>
      <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', padding:'0 clamp(20px,5vw,60px)' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:.6 }}
          style={{ textAlign:'center', marginBottom:'clamp(40px,5vw,64px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--gold,#B8860B)', marginBottom:16 }}>
            <span style={{ display:'block', width:22, height:1.5, background:'var(--gold,#B8860B)' }} />
            Why Parents Choose Us
            <span style={{ display:'block', width:22, height:1.5, background:'var(--gold,#B8860B)' }} />
          </div>
          <h2 style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontWeight:700, fontSize:'var(--why-title-size,clamp(2.2rem,5vw,4rem))', color:'var(--why-title-color,#0D1117)', lineHeight:.95, letterSpacing:'-2px', margin:0 }}>
            {ct.whyTitle || 'Everything You Need,'}
            <em style={{ display:'block', fontStyle:'italic', color:'var(--gold,#B8860B)' }}>Nothing You Don&apos;t</em>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'clamp(16px,2vw,24px)' }}>
          {CARDS.map((c, i) => (
            <motion.div key={c.title}
              initial={{ opacity:0, y:24 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ delay: i * 0.07, duration:.5 }}
              style={{ background:'var(--why-card-bg,#fff)', borderRadius:'clamp(12px,1.5vw,18px)', padding:'clamp(24px,3vw,36px)', border:'1px solid rgba(13,17,23,0.07)', boxShadow:'0 2px 16px rgba(13,17,23,0.04)', transition:'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(184,134,11,0.1)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(184,134,11,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(13,17,23,0.04)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(13,17,23,0.07)' }}>
              <div style={{ fontSize:'clamp(28px,4vw,40px)', marginBottom:16 }}>{c.icon}</div>
              <h3 style={{ fontFamily:'var(--font-serif,"Cormorant Garamond"),Georgia,serif', fontSize:'var(--why-card-title-size,clamp(17px,1.8vw,22px))', fontWeight:700, color:'var(--why-card-title-color,#0D1117)', marginBottom:10, lineHeight:1.1 }}>{c.title}</h3>
              <p style={{ fontFamily:'var(--font-sans,Inter),sans-serif', fontSize:'var(--why-card-desc-size,clamp(13px,1.2vw,15px))', color:'var(--why-card-desc-color,#4A5568)', lineHeight:1.7, margin:0, fontWeight:300 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
