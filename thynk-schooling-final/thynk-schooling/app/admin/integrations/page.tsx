'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Mail, MessageCircle, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1.5px solid rgba(13,17,23,0.12)', borderRadius:'9px', fontSize:'14px', fontFamily:'Inter,sans-serif', color:'#0D1117', background:'#fff', outline:'none', boxSizing:'border-box' as const }
const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase' as const, color:'#718096', marginBottom:'6px', fontFamily:'Inter,sans-serif' }

function apiSave(key: string, value: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ts_access_token')||'' : ''
  return fetch('/api/admin/settings', {
    method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body: JSON.stringify({ key, value }),
  }).then(r => { if(!r.ok) throw new Error('Save failed') })
}

export default function IntegrationsPage() {
  const [tab, setTab] = useState<'email'|'whatsapp'>('email')
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState({ fromName:'Thynk Schooling', fromEmail:'', smtpHost:'smtp.gmail.com', smtpPort:'587', smtpUser:'', smtpPass:'', enabled:false })
  const [wa, setWa] = useState({ provider:'twilio', accountSid:'', authToken:'', fromNumber:'', metaToken:'', metaPhoneId:'', enabled:false })

  useEffect(() => {
    fetch('/api/admin/settings',{cache:'no-store'}).then(r=>r.json()).then(d=>{
      if(d.email_settings) setEmail(p=>({...p,...d.email_settings}))
      if(d.whatsapp_settings) setWa(p=>({...p,...d.whatsapp_settings}))
    })
  }, [])

  const save = async (key: string, value: any, label: string) => {
    setSaving(true)
    try { await apiSave(key,value); toast.success(`${label} saved!`) }
    catch { toast.error('Save failed') }
    setSaving(false)
  }

  return (
    <AdminLayout title="Integrations" subtitle="Gmail & WhatsApp configuration">
      <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
        {[{k:'email',icon:'📧',l:'Email / Gmail'},{k:'whatsapp',icon:'💬',l:'WhatsApp'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'10px', border:`1.5px solid ${tab===t.k?'#B8860B':'rgba(13,17,23,0.12)'}`, background:tab===t.k?'#FEF7E0':'#fff', color:tab===t.k?'#B8860B':'#4A5568', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      {tab==='email' && (
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid rgba(13,17,23,0.09)', padding:'28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <div style={{ fontSize:'16px', fontWeight:700, color:'#0D1117', fontFamily:'Inter,sans-serif' }}>Gmail SMTP</div>
              <div style={{ fontSize:'13px', color:'#718096', fontFamily:'Inter,sans-serif' }}>Send emails via Gmail using an App Password</div>
            </div>
            <button onClick={()=>setEmail(p=>({...p,enabled:!p.enabled}))}
              style={{ padding:'8px 16px', borderRadius:'8px', border:'none', background:email.enabled?'#0D1117':'#F5F0E8', color:email.enabled?'#FAF7F2':'#718096', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
              {email.enabled?'✓ Enabled':'Disabled'}
            </button>
          </div>

          <div style={{ background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#B8860B', marginBottom:'8px', fontFamily:'Inter,sans-serif' }}>📋 Gmail App Password Setup</div>
            <ol style={{ margin:0, paddingLeft:'18px', fontSize:'12px', color:'#4A5568', fontFamily:'Inter,sans-serif', lineHeight:1.9 }}>
              <li>Go to <strong>myaccount.google.com</strong> → Security → 2-Step Verification → Enable</li>
              <li>Then go to <strong>App Passwords</strong> → Select Mail → Generate</li>
              <li>Copy the 16-character password and paste it below</li>
            </ol>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { label:'From Name', key:'fromName', type:'text', ph:'Thynk Schooling' },
              { label:'From Email', key:'fromEmail', type:'email', ph:'you@gmail.com' },
              { label:'SMTP Host', key:'smtpHost', type:'text', ph:'smtp.gmail.com' },
              { label:'SMTP Port', key:'smtpPort', type:'text', ph:'587' },
              { label:'SMTP Username', key:'smtpUser', type:'email', ph:'you@gmail.com' },
            ].map(f=>(
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input style={inp} type={f.type} value={(email as any)[f.key]} onChange={e=>setEmail(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} />
              </div>
            ))}
            <div>
              <label style={lbl}>App Password (16 chars)</label>
              <div style={{ position:'relative' }}>
                <input style={{...inp,paddingRight:'44px'}} type={showPass?'text':'password'} value={email.smtpPass} onChange={e=>setEmail(p=>({...p,smtpPass:e.target.value}))} placeholder="xxxx xxxx xxxx xxxx" />
                <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',color:'#718096' }}>
                  {showPass?<EyeOff style={{width:15,height:15}}/>:<Eye style={{width:15,height:15}}/>}
                </button>
              </div>
            </div>
          </div>

          <button onClick={()=>save('email_settings',email,'Email settings')} disabled={saving}
            style={{ display:'flex',alignItems:'center',gap:'7px',padding:'10px 22px',borderRadius:'9px',background:'#B8860B',color:'#fff',border:'none',fontFamily:'Inter,sans-serif',fontSize:'13px',fontWeight:700,cursor:'pointer',marginTop:'24px',opacity:saving?0.7:1 }}>
            {saving?<Loader2 style={{width:14,height:14,animation:'spin 1s linear infinite'}}/>:<Save style={{width:14,height:14}}/>} Save Email Settings
          </button>
        </div>
      )}

      {tab==='whatsapp' && (
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid rgba(13,17,23,0.09)', padding:'28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <div style={{ fontSize:'16px', fontWeight:700, color:'#0D1117', fontFamily:'Inter,sans-serif' }}>WhatsApp</div>
              <div style={{ fontSize:'13px', color:'#718096', fontFamily:'Inter,sans-serif' }}>Twilio or Meta Business API</div>
            </div>
            <button onClick={()=>setWa(p=>({...p,enabled:!p.enabled}))}
              style={{ padding:'8px 16px', borderRadius:'8px', border:'none', background:wa.enabled?'#25D366':'#F5F0E8', color:wa.enabled?'#fff':'#718096', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
              {wa.enabled?'✓ Enabled':'Disabled'}
            </button>
          </div>

          <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
            {['twilio','meta'].map(p=>(
              <button key={p} onClick={()=>setWa(prev=>({...prev,provider:p}))}
                style={{ padding:'8px 18px', borderRadius:'8px', border:`1.5px solid ${wa.provider===p?'#0D1117':'rgba(13,17,23,0.12)'}`, background:wa.provider===p?'#0D1117':'#fff', color:wa.provider===p?'#FAF7F2':'#4A5568', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                {p==='twilio'?'🟥 Twilio':'🟩 Meta Business'}
              </button>
            ))}
          </div>

          {wa.provider==='twilio' ? (
            <div>
              <div style={{ background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'#B8860B', marginBottom:'8px', fontFamily:'Inter,sans-serif' }}>📋 Twilio Setup</div>
                <ol style={{ margin:0, paddingLeft:'18px', fontSize:'12px', color:'#4A5568', fontFamily:'Inter,sans-serif', lineHeight:1.9 }}>
                  <li>Sign up at <strong>twilio.com</strong> → Enable WhatsApp (Sandbox or Business)</li>
                  <li>Get Account SID and Auth Token from Console Dashboard</li>
                  <li>WhatsApp sandbox number: whatsapp:+14155238886</li>
                </ol>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div><label style={lbl}>Account SID</label><input style={inp} value={wa.accountSid} onChange={e=>setWa(p=>({...p,accountSid:e.target.value}))} placeholder="ACxxxxxxxxxx" /></div>
                <div><label style={lbl}>Auth Token</label><input style={inp} type="password" value={wa.authToken} onChange={e=>setWa(p=>({...p,authToken:e.target.value}))} placeholder="Your auth token" /></div>
                <div><label style={lbl}>From Number</label><input style={inp} value={wa.fromNumber} onChange={e=>setWa(p=>({...p,fromNumber:e.target.value}))} placeholder="whatsapp:+14155238886" /></div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background:'#FEF7E0', border:'1px solid rgba(184,134,11,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'#B8860B', marginBottom:'8px', fontFamily:'Inter,sans-serif' }}>📋 Meta Business API Setup</div>
                <ol style={{ margin:0, paddingLeft:'18px', fontSize:'12px', color:'#4A5568', fontFamily:'Inter,sans-serif', lineHeight:1.9 }}>
                  <li>Go to <strong>developers.facebook.com</strong> → Create App → Business</li>
                  <li>Add WhatsApp product → Get Phone Number ID</li>
                  <li>Generate a Permanent Access Token from Graph API</li>
                </ol>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div><label style={lbl}>Permanent Access Token</label><input style={inp} type="password" value={wa.metaToken} onChange={e=>setWa(p=>({...p,metaToken:e.target.value}))} placeholder="EAAxxxxxxxxxx" /></div>
                <div><label style={lbl}>Phone Number ID</label><input style={inp} value={wa.metaPhoneId} onChange={e=>setWa(p=>({...p,metaPhoneId:e.target.value}))} placeholder="1234567890" /></div>
              </div>
            </div>
          )}

          <button onClick={()=>save('whatsapp_settings',wa,'WhatsApp settings')} disabled={saving}
            style={{ display:'flex',alignItems:'center',gap:'7px',padding:'10px 22px',borderRadius:'9px',background:'#25D366',color:'#fff',border:'none',fontFamily:'Inter,sans-serif',fontSize:'13px',fontWeight:700,cursor:'pointer',marginTop:'24px',opacity:saving?0.7:1 }}>
            {saving?<Loader2 style={{width:14,height:14,animation:'spin 1s linear infinite'}}/>:<Save style={{width:14,height:14}}/>} Save WhatsApp Settings
          </button>
        </div>
      )}
    </AdminLayout>
  )
}
