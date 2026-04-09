'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Send, MessageCircle, ChevronDown } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface BotConfig { [key: string]: string }
interface FAQ { id: string; question: string; answer: string; keywords: string[] }
interface Message { role: 'user' | 'bot' | 'system'; content: string }

// ── Keyword matcher ───────────────────────────────────────────────────────────
function matchFAQ(input: string, faqs: FAQ[]): FAQ | null {
  const lower = input.toLowerCase()
  let best: FAQ | null = null
  let bestScore = 0
  for (const faq of faqs) {
    let score = 0
    for (const kw of faq.keywords) {
      if (lower.includes(kw.toLowerCase())) score++
    }
    if (score > bestScore) { bestScore = score; best = faq }
  }
  return bestScore > 0 ? best : null
}

// ── Quick reply topics ────────────────────────────────────────────────────────
const QUICK_TOPICS = ['Admission process', 'Documents needed', 'Fee structure', 'Payment modes', 'Age criteria', 'Which boards?']

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen]             = useState(false)
  const [config, setConfig]         = useState<BotConfig>({})
  const [faqs, setFaqs]             = useState<FAQ[]>([])
  const [messages, setMessages]     = useState<Message[]>([])
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const [stage, setStage]           = useState<'capture' | 'chat'>('capture')
  const [input, setInput]           = useState('')
  const [typing, setTyping]         = useState(false)
  const [showQuick, setShowQuick]   = useState(false)
  const [loaded, setLoaded]         = useState(false)

  // User form state
  const [userName,  setUserName]  = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [formErr,   setFormErr]   = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  // ── Load config + FAQs on mount ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/chatbot?action=widget-init')
      .then(r => r.json())
      .then(data => {
        setConfig(data.config || {})
        setFaqs(data.faqs || [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // ── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // ── Focus input when chat opens ───────────────────────────────────────────
  useEffect(() => {
    if (open && stage === 'chat') setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, stage])

  if (!loaded) return null
  if (config.bot_enabled === 'false') return null

  const brand  = config.brand_color  || '#FF5C00'
  const botName= config.bot_name     || 'Thynk Assistant'

  // ── Save message to DB ────────────────────────────────────────────────────
  async function saveMessage(sid: string, role: 'user' | 'bot', content: string) {
    try {
      await fetch('/api/chatbot?action=message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, role, content }),
      })
    } catch {}
  }

  // ── Start session ─────────────────────────────────────────────────────────
  async function startSession() {
    if (!userName.trim() || !userPhone.trim()) {
      setFormErr('Name and phone are required.')
      return
    }
    setFormErr('')
    try {
      const res = await fetch('/api/chatbot?action=session-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          userPhone: userPhone.trim(),
          userEmail: userEmail.trim() || null,
          pageUrl: window.location.href,
        }),
      })
      const data = await res.json()
      const sid = data.sessionId
      setSessionId(sid)
      setStage('chat')
      const greeting: Message = {
        role: 'bot',
        content: `Hi ${userName.trim()}! 😊 How can I help you today? Ask me about admissions, fee structure, required documents, and more.`,
      }
      setMessages([greeting])
      setShowQuick(true)
      if (sid) await saveMessage(sid, 'bot', greeting.content)
    } catch {
      setFormErr('Something went wrong. Please try again.')
    }
  }

  // ── Bot reply ─────────────────────────────────────────────────────────────
  async function botReply(userText: string, sid: string | null) {
    setTyping(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500))
    setTyping(false)

    const matched = matchFAQ(userText, faqs)
    let reply: string
    if (matched) {
      reply = matched.answer
    } else {
      reply = config.fallback_message || "Thanks for your question! Our team will get back to you shortly."
      const contact = [config.contact_phone, config.contact_email].filter(Boolean).join(' | ')
      if (contact) reply += `\n\n📞 ${contact}`
    }

    setMessages(prev => [...prev, { role: 'bot', content: reply }])
    setShowQuick(true)
    if (sid) await saveMessage(sid, 'bot', reply)
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput('')
    setShowQuick(false)
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    if (sessionId) await saveMessage(sessionId, 'user', trimmed)
    await botReply(trimmed, sessionId)
  }

  // ── Open chat for first time ──────────────────────────────────────────────
  function openChat() {
    setOpen(true)
    if (messages.length === 0 && stage === 'capture') {
      // Show greeting before form
    }
  }

  const greeting = config.greeting_message || "Hi! 👋 Welcome to Thynk Schooling. I'm here to help with admissions & fee queries. May I know your name?"

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => open ? setOpen(false) : openChat()}
        aria-label="Open chat"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: brand, border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 20px ${brand}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .2s, box-shadow .2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        {open
          ? <ChevronDown style={{ width: 24, height: 24, color: '#fff' }} />
          : <MessageCircle style={{ width: 24, height: 24, color: '#fff' }} />
        }
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9999,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          maxHeight: 'calc(100vh - 120px)',
          animation: 'tsSlideUp .2s ease',
        }}>
          <style>{`
            @keyframes tsSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
            @keyframes tsDot { 0%,60%,100%{ transform:translateY(0) } 30%{ transform:translateY(-5px) } }
          `}</style>

          {/* Header */}
          <div style={{ background: brand, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              🏫
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{botName}</div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>● Online · Admissions & Fees Help</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', padding: 4 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: '#f7f8fc' }}>

            {/* Stage: capture */}
            {stage === 'capture' && (
              <>
                <div style={{ alignSelf: 'flex-start', background: '#fff', color: '#1a1a2e', padding: '10px 13px', borderRadius: '12px 12px 12px 4px', fontSize: 13, lineHeight: 1.55, maxWidth: '86%', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  {greeting}
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginTop: 4 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>Full name *</div>
                    <input value={userName} onChange={e => setUserName(e.target.value)}
                      placeholder="Your name"
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onKeyDown={e => e.key === 'Enter' && startSession()} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>Phone *</div>
                    <input value={userPhone} onChange={e => setUserPhone(e.target.value)} type="tel"
                      placeholder="+91 ..."
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onKeyDown={e => e.key === 'Enter' && startSession()} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>Email <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></div>
                    <input value={userEmail} onChange={e => setUserEmail(e.target.value)} type="email"
                      placeholder="you@example.com"
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onKeyDown={e => e.key === 'Enter' && startSession()} />
                  </div>
                  {formErr && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{formErr}</div>}
                  <button onClick={startSession}
                    style={{ width: '100%', background: brand, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Start Chat →
                  </button>
                </div>
              </>
            )}

            {/* Stage: chat */}
            {stage === 'chat' && messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? brand : '#fff',
                color: m.role === 'user' ? '#fff' : '#1a1a2e',
                padding: '10px 13px',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                fontSize: 13, lineHeight: 1.55, maxWidth: '86%',
                boxShadow: m.role === 'bot' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: '12px 12px 12px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 4 }}>
                {[0, .2, .4].map((d, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaa', display: 'inline-block', animation: `tsDot 1.2s ${d}s infinite` }} />
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {stage === 'chat' && showQuick && !typing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px 4px', background: '#f7f8fc', flexShrink: 0 }}>
              {QUICK_TOPICS.map(t => (
                <button key={t} onClick={() => { setShowQuick(false); sendMessage(t) }}
                  style={{ background: '#fff', border: `1px solid ${brand}44`, color: brand, borderRadius: 20, padding: '4px 11px', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${brand}10` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {stage === 'chat' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
              <input ref={inputRef}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(input) }}
                placeholder="Type your question..."
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 20, padding: '8px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = brand }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
              <button onClick={() => sendMessage(input)} aria-label="Send"
                style={{ background: brand, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send style={{ width: 15, height: 15, color: '#fff' }} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
