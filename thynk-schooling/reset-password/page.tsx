'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle, XCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') || ''
  const [pw,      setPw]      = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [tokenOk, setTokenOk] = useState<boolean|null>(null)
  const [tokenErr,setTokenErr]= useState('')

  useEffect(() => {
    if (!token) { setTokenOk(false); setTokenErr('No token in link.'); return }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r=>r.json())
      .then(d=>{ setTokenOk(d.valid); if(!d.valid) setTokenErr(d.error||'Invalid link') })
      .catch(()=>{ setTokenOk(false); setTokenErr('Could not verify link') })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8) { toast.error('Min 8 characters'); return }
    if (pw !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, password: pw }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message||'Failed'); return }
      setDone(true)
      toast.success('Password updated!')
      setTimeout(()=>router.push('/login'), 2500)
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'12px 14px 12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontSize:'14px', color:'#fff', outline:'none', fontFamily:'DM Sans,sans-serif', boxSizing:'border-box' }

  if (tokenOk === null) return (
    <div style={{ textAlign:'center', padding:'30px 0' }}>
      <Loader2 style={{ width:28, height:28, animation:'spin 1s linear infinite', color:'#B8860B', margin:'0 auto 10px' }} />
      <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>Verifying reset link…</p>
    </div>
  )

  if (tokenOk === false) return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <XCircle style={{ width:40, height:40, color:'#F87171', margin:'0 auto 12px' }} />
      <h2 style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'22px', color:'#fff', marginBottom:'8px' }}>Link Invalid</h2>
      <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginBottom:'20px', fontFamily:'DM Sans,sans-serif' }}>{tokenErr}</p>
      <Link href="/forgot-password" style={{ padding:'10px 24px', borderRadius:'8px', background:'#B8860B', color:'#fff', textDecoration:'none', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'13px', display:'inline-block' }}>
        Request New Link
      </Link>
    </div>
  )

  if (done) return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <CheckCircle style={{ width:48, height:48, color:'#4ADE80', margin:'0 auto 14px' }} />
      <h2 style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'24px', color:'#fff', marginBottom:'8px' }}>Password Updated!</h2>
      <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif' }}>Redirecting to login…</p>
    </div>
  )

  return (
    <>
      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <Lock style={{ width:28, height:28, color:'#B8860B', margin:'0 auto 10px' }} />
        <h1 style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'28px', color:'#fff', marginBottom:'6px' }}>Set New Password</h1>
        <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif' }}>Choose a strong password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
        <div style={{ position:'relative' }}>
          <input style={{ ...inp, paddingRight:'44px' }} type={showPw?'text':'password'} placeholder="New password (min 8 chars)" value={pw} onChange={e=>setPw(e.target.value)} required />
          <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0 }}>
            {showPw ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
          </button>
        </div>
        {/* Strength bar */}
        <div style={{ display:'flex', gap:'4px' }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ flex:1, height:3, borderRadius:'2px', transition:'background .2s',
              background: pw.length>=n*2 ? (pw.length<6?'#F87171':pw.length<10?'#E8C547':'#4ADE80') : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        <input style={{ ...inp, borderColor: confirm&&pw!==confirm?'rgba(248,113,113,0.5)':undefined }}
          type={showPw?'text':'password'} placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
        {confirm&&pw!==confirm && <div style={{ fontSize:'11px', color:'#F87171', fontFamily:'DM Sans,sans-serif', marginTop:'-8px' }}>Passwords don't match</div>}
        <button type="submit" disabled={loading||pw!==confirm||pw.length<8}
          style={{ width:'100%', padding:'13px', borderRadius:'8px', background:'#B8860B', border:'none', color:'#fff', fontSize:'14px', fontWeight:600, fontFamily:'DM Sans,sans-serif', cursor:'pointer', opacity:(loading||pw!==confirm||pw.length<8)?.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'4px' }}>
          {loading ? <><Loader2 style={{width:15,height:15,animation:'spin 1s linear infinite'}}/>Updating…</> : 'Update Password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#050A14 0%,#0A1628 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(rgba(184,134,11,0.04) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
      <div style={{ width:'100%', maxWidth:'440px', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
            <div style={{ width:38, height:38, borderRadius:'9px', background:'#0D1117', border:'1px solid rgba(184,134,11,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap style={{ width:18, height:18, color:'#E8C547' }} />
            </div>
            <span style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontWeight:700, fontSize:'20px', color:'#fff' }}>Thynk Schooling</span>
          </Link>
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'36px', backdropFilter:'blur(20px)' }}>
          <Suspense fallback={<div style={{ color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'20px', fontFamily:'DM Sans,sans-serif' }}>Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
        <div style={{ textAlign:'center', marginTop:'14px' }}>
          <Link href="/login" style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', textDecoration:'none', fontFamily:'DM Sans,sans-serif' }}>← Back to login</Link>
        </div>
      </div>
    </div>
  )
}
