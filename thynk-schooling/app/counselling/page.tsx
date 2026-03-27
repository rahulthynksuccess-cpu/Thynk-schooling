'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, Loader2, Phone, User, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { apiGet, apiPost } from '@/lib/api'
import { CounsellingSlot } from '@/types'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

export const metadata = { title: 'Free Counselling — Thynk Schooling' }

const CONCERNS = [
  'Which board to choose (CBSE/ICSE/IB)',
  'School shortlisting in my city',
  'Admission process & documents',
  'Fee structure & scholarships',
  'Boarding school guidance',
  'Special needs / learning support',
  'Nursery & primary admissions',
  'Other',
]

export default function CounsellingPage() {
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [concern,      setConcern]      = useState<string>('')
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [booked,       setBooked]       = useState(false)

  const { data: slots, isLoading } = useQuery<CounsellingSlot[]>({
    queryKey: ['counselling-slots'],
    queryFn:  () => apiGet('/counselling/available-slots'),
    staleTime: 5 * 60 * 1000,
  })

  const bookMutation = useMutation({
    mutationFn: () => apiPost('/counselling/book', { slotId: selectedSlot, concern, parentName: name, parentPhone: phone }),
    onSuccess: () => setBooked(true),
    onError:   () => toast.error('Booking failed. Please try again.'),
  })

  // Group slots by date
  const slotsByDate = (slots ?? []).reduce<Record<string, CounsellingSlot[]>>((acc, slot) => {
    acc[slot.date] = acc[slot.date] ? [...acc[slot.date], slot] : [slot]
    return acc
  }, {})

  if (booked) return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md card p-10">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="font-display font-bold text-white text-2xl mb-2">Session Booked! 🎉</h2>
          <p className="text-navy-300 mb-2">Your free counselling session is confirmed.</p>
          <p className="text-navy-400 text-sm mb-6">Our counsellor will call you at <strong className="text-white">+91 {phone}</strong> at your chosen time. No spam, no sales calls.</p>
          <div className="badge-green inline-flex mx-auto mb-6">Mon–Sat · 9 AM – 7 PM</div>
          <a href="/" className="btn-primary w-full justify-center">Back to Home</a>
        </motion.div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        {/* Hero */}
        <div className="bg-navy-950 border-b border-surface-border py-16 text-center px-4">
          <span className="badge-orange mb-4 inline-flex">100% Free · No Sales Calls</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Talk to an Expert <span className="text-gradient">Education Counsellor</span>
          </h1>
          <p className="text-navy-300 text-lg max-w-xl mx-auto">
            Our certified advisors help 500+ families every month choose the right school. No cost, no obligation.
          </p>
        </div>

        <div className="container-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-400" /> Your Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Your Name <span className="text-orange-400">*</span></label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="input" />
                  </div>
                  <div>
                    <label className="label">Mobile Number <span className="text-orange-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-navy-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm text-navy-300 border-r border-surface-border pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/, '').slice(0, 10))}
                        placeholder="10-digit number"
                        className="input pl-20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Concern */}
              <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4">What do you need help with?</h3>
                <div className="flex flex-wrap gap-2">
                  {CONCERNS.map(c => (
                    <button
                      key={c}
                      onClick={() => setConcern(c)}
                      className={`px-4 py-2 rounded-xl text-sm font-display font-semibold border transition-all ${
                        concern === c
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-surface-border text-navy-300 bg-navy-800 hover:border-orange-500/40 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot picker */}
              <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" /> Pick a Time Slot
                </h3>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <p className="text-navy-400 text-sm">No slots available right now. Please check back or call us directly.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(slotsByDate).map(([date, daySlots]) => (
                      <div key={date}>
                        <div className="text-navy-400 text-xs font-display font-bold uppercase tracking-wider mb-2">
                          {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => !slot.isBooked && setSelectedSlot(slot.id)}
                              disabled={slot.isBooked}
                              className={clsx(
                                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-display font-semibold border transition-all',
                                slot.isBooked
                                  ? 'opacity-40 cursor-not-allowed border-surface-border text-navy-500 bg-navy-900'
                                  : selectedSlot === slot.id
                                    ? 'bg-orange-500 border-orange-500 text-white'
                                    : 'border-surface-border text-navy-300 bg-navy-800 hover:border-orange-500/40 hover:text-white'
                              )}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {slot.time}
                              {slot.isBooked && <span className="text-[10px]">(Full)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => bookMutation.mutate()}
                disabled={!name || !phone || !concern || !selectedSlot || bookMutation.isPending}
                className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bookMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</>
                  : <>Book My Free Session <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </div>

            {/* Info sidebar */}
            <div className="space-y-4">
              {[
                { emoji: '🎓', title: 'Expert Counsellors', desc: 'Our advisors have 5+ years in school admissions and education policy.' },
                { emoji: '🔒', title: 'Completely Private', desc: 'Your conversation is confidential. We never share your details with schools without consent.' },
                { emoji: '💬', title: 'Hindi & English', desc: 'Available in both languages. Speak comfortably in your preferred language.' },
                { emoji: '📱', title: 'We Call You', desc: 'No hold music. Our counsellor calls you at your chosen time — sharp.' },
              ].map(f => (
                <div key={f.title} className="card p-5">
                  <div className="text-2xl mb-2">{f.emoji}</div>
                  <h4 className="font-display font-bold text-white text-sm mb-1">{f.title}</h4>
                  <p className="text-navy-400 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
