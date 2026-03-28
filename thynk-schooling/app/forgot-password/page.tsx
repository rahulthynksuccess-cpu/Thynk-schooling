'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Phone, Loader2, CheckCircle, ArrowLeft, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [phone,    setPhone]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [devToken, setDevToken] = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { toast.error('Enter your phone number'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone }) })
      const data = await res.json()
      setSent(true)
      if (data.token) setDevToken(data.token)
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'12px 14px 12px 42px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontSize:'14px', color:'#fff', outline:'none', fontFamily:'DM Sans,sans-serif', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#050A14 0%,#0A1628 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.04) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'440px', position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
            <div style={{ width:38, height:38, borderRadius:'9px', background:'#0D1117', border:'1px solid rgba(184,134,11,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap style={{ width:18, height:18, color:'#E8C547' }} />
            </div>
            <span style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'20px', color:'#fff' }}>Thynk Schooling</span>
          </Link>
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'36px', backdropFilter:'blur(20px)' }}>
          {!sent ? (
            <>
              <div style={{ textAlign:'center', marginBottom:'24px' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(184,134,11,0.1)', border:'2px solid rgba(184,134,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Lock style={{ width:22, height:22, color:'#B8860B' }} />
                </div>
                <h1 style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'28px', color:'#fff', marginBottom:'8px' }}>Forgot Password?</h1>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7, fontFamily:'DM Sans,sans-serif' }}>Enter your registered phone number. We'll send a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <div style={{ position:'relative' }}>
                  <Phone style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'rgba(255,255,255,0.3)' }} />
                  <input style={inp} type="tel" placeholder="98XXXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} autoFocus />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'13px', borderRadius:'8px', background:'#B8860B', border:'none', color:'#fff', fontSize:'14px', fontWeight:600, fontFamily:'DM Sans,sans-serif', cursor:loading?'wait':'pointer', opacity:loading?.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {loading ? <><Loader2 style={{width:15,height:15,animation:'spin 1s linear infinite'}}/>Sending…</> : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ textAlign:'center', marginTop:'16px' }}>
                <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'rgba(255,255,255,0.4)', textDecoration:'none', fontFamily:'DM Sans,sans-serif' }}>
                  <ArrowLeft style={{width:12,height:12}}/> Back to login
                </Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(74,222,128,0.1)', border:'2px solid rgba(74,222,128,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <CheckCircle style={{ width:28, height:28, color:'#4ADE80' }} />
              </div>
              <h2 style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'24px', color:'#fff', marginBottom:'10px' }}>Check your phone</h2>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:'20px', fontFamily:'DM Sans,sans-serif' }}>
                If <strong style={{ color:'rgba(255,255,255,0.8)' }}>{phone}</strong> is registered, a reset link has been sent.
              </p>
              {devToken && (
                <div style={{ background:'rgba(184,134,11,0.08)', border:'1px dashed rgba(184,134,11,0.3)', borderRadius:'8px', padding:'12px', marginBottom:'16px', textAlign:'left' }}>
                  <div style={{ fontSize:'10px', fontWeight:600, color:'#B8860B', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'5px' }}>DEV MODE — RESET LINK</div>
                  <Link href={`/reset-password?token=${devToken}`} style={{ fontSize:'11px', color:'#60A5FA', wordBreak:'break-all' }}>
                    /reset-password?token={devToken.slice(0,20)}…
                  </Link>
                </div>
              )}
              <button onClick={()=>setSent(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'12px', fontFamily:'DM Sans,sans-serif', marginBottom:'12px' }}>
                Didn't get it? Try again
              </button>
              <br />
              <Link href="/login" style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', textDecoration:'none', fontFamily:'DM Sans,sans-serif', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                <ArrowLeft style={{width:12,height:12}}/> Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
