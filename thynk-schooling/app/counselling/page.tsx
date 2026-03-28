'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { apiPost } from '@/lib/api'
import { motion } from 'framer-motion'
import { Phone, Clock, CheckCircle, Star, Calendar, MessageSquare, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDropdown } from '@/hooks/useDropdown'

const BENEFITS = [
  { icon: '🎓', title: 'Board Selection', desc: 'CBSE vs ICSE vs IB vs Cambridge — our experts help you pick what suits your child' },
  { icon: '🏫', title: 'School Shortlisting', desc: 'Personalised shortlist of 5–10 schools based on budget, location and values' },
  { icon: '📋', title: 'Admission Roadmap', desc: 'Step-by-step checklist with deadlines for every school you apply to' },
  { icon: '💰', title: 'Fee & Scholarship', desc: 'Navigate fee structures, hidden costs and scholarship opportunities' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi', text: 'The counsellor understood our exact needs and shortlisted 6 perfect schools. My daughter got admission in her first choice!', stars: 5 },
  { name: 'Rahul Mehta',  city: 'Mumbai', text: 'Amazing service. Cleared all my doubts about IB vs CBSE in one 45-minute call. Totally free and no pressure at all.', stars: 5 },
  { name: 'Anita Singh',  city: 'Bangalore', text: 'Helped us understand the admission timeline perfectly. Got our son into a top ICSE school with their guidance.', stars: 5 },
]

const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#718096', marginBottom: '6px', fontFamily: 'DM Sans,sans-serif' }
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid rgba(13,17,23,0.12)', borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans,sans-serif', color: '#0D1117', outline: 'none', background: '#fff', boxSizing: 'border-box' as const }

export default function CounsellingPage() {
  const { options: cities } = useDropdown('city')
  const [form, setForm] = useState({ name: '', phone: '', city: '', childAge: '', concern: '' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => apiPost('/counselling/book', form),
    onSuccess: () => {
      toast.success('Session booked! Our counsellor will call you within 2 hours.')
      setForm({ name: '', phone: '', city: '', childAge: '', concern: '' })
    },
    onError: () => toast.error('Booking failed. Please try again or call us directly.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    mutation.mutate()
  }

  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, #0D1117 0%, #1C2333 60%, #0D1117 100%)', padding: '80px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,134,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '60px', alignItems: 'center', position: 'relative' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8C547', marginBottom: '20px', fontFamily: 'DM Sans,sans-serif' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B' }} /> 100% Free Service
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '60px', color: '#FAF7F2', lineHeight: 1.0, letterSpacing: '-2px', marginBottom: '18px' }}>
                Free 1-on-1<br /><em style={{ fontStyle: 'italic', color: '#E8C547' }}>School Counselling</em>
              </h1>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '16px', color: 'rgba(250,247,242,0.6)', lineHeight: 1.75, maxWidth: '440px', marginBottom: '32px', fontWeight: 300 }}>
                Our expert education counsellors help 500+ families every month choose the right school — completely free, no sales pitch, no pressure.
              </p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { icon: Clock,    text: 'Mon–Sat · 9 AM – 7 PM' },
                  { icon: Phone,    text: 'Hindi & English'         },
                  { icon: Users,    text: '500+ families/month'     },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(250,247,242,0.6)', fontFamily: 'DM Sans,sans-serif' }}>
                    <Icon style={{ width: '14px', height: '14px', color: '#B8860B' }} />{text}
                  </div>
                ))}
              </div>
            </div>

            {/* Booking form */}
            <div style={{ background: '#fff', borderRadius: '18px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '24px', color: '#0D1117', marginBottom: '4px' }}>Book a Free Session</h3>
              <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', marginBottom: '24px', fontWeight: 300 }}>We call you back within 2 hours</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={lbl}>Your Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" style={inp} required />
                </div>
                <div>
                  <label style={lbl}>Mobile Number *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98000 00000" type="tel" style={inp} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>City</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Child Age</label>
                    <select value={form.childAge} onChange={e => set('childAge', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Select Age</option>
                      {Array.from({ length: 17 }, (_, i) => i + 2).map(age => (
                        <option key={age} value={String(age)}>{age} years</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Your Main Concern</label>
                  <textarea value={form.concern} onChange={e => set('concern', e.target.value)}
                    placeholder="e.g. Confused between CBSE and IB, looking for schools near Andheri under ₹8,000/mo"
                    rows={3} style={{ ...inp, resize: 'none' }} />
                </div>
                <button type="submit" disabled={mutation.isPending}
                  style={{ background: '#B8860B', color: '#FAF7F2', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: mutation.isPending ? .7 : 1 }}>
                  {mutation.isPending ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Booking...</> : <><Phone style={{ width: '16px', height: '16px' }} />Book Free Call</>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>No spam · No sales calls · 100% free</p>
              </form>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section style={{ padding: '80px 48px', background: '#F5F0E8' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
                <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />What We Cover
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '48px', color: '#0D1117', letterSpacing: '-1px' }}>
                Expert Guidance on <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Every Aspect</em>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {BENEFITS.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                  style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(13,17,23,0.05)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>{b.icon}</div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '18px', color: '#0D1117', marginBottom: '8px' }}>{b.title}</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', lineHeight: 1.65, fontWeight: 300 }}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 48px' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '40px', color: '#0D1117', textAlign: 'center', marginBottom: '40px' }}>
              What Parents Say
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                  style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: '14px', padding: '26px', boxShadow: '0 2px 12px rgba(13,17,23,0.05)' }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                    {Array.from({ length: t.stars }).map((_, s) => <Star key={s} style={{ width: '13px', height: '13px', fill: '#B8860B', color: '#B8860B' }} />)}
                  </div>
                  <div style={{ width: '32px', height: '1px', background: '#B8860B', marginBottom: '12px' }} />
                  <p style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '16px', color: '#1C2333', lineHeight: 1.65, marginBottom: '18px' }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(13,17,23,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#EDE5D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '16px', color: '#B8860B' }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>{t.name}</div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '11px', color: '#A0ADB8' }}>{t.city}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
