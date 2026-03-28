'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { apiGet, apiPut } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Shield, UserX, UserCheck, Phone, Calendar,
  Download, Globe, Monitor, Smartphone, Activity,
  X, CheckCircle, XCircle, Linkedin,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Types ── */
interface AdminUser {
  id: string; fullName: string; phone: string; email?: string
  role: 'parent' | 'school_admin' | 'super_admin'
  isActive: boolean; isPhoneVerified: boolean
  profileCompleted: boolean
  schoolName?: string; lastLoginAt?: string; lastIp?: string
  createdAt: string; totalApplications?: number; totalLeadsBought?: number
}

interface ActivityLog {
  id: string; action: string; detail?: string
  ip_address?: string; user_agent?: string; created_at: string
}

/* ── Constants ── */
const ROLE_TABS = ['All','Parents','Schools','Admins','Suspended']

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  parent:       { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', label: 'Parent'       },
  school_admin: { bg: 'rgba(255,92,0,0.12)',    color: '#FF7A2E', label: 'School Admin' },
  super_admin:  { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', label: 'Super Admin'  },
}

const ACTION_STYLE: Record<string, { color: string; bg: string; emoji: string }> = {
  login:            { color: '#4ADE80', bg: 'rgba(74,222,128,.12)',   emoji: '🔐' },
  login_failed:     { color: '#F87171', bg: 'rgba(239,68,68,.12)',    emoji: '⚠️' },
  register:         { color: '#60A5FA', bg: 'rgba(96,165,250,.12)',   emoji: '✨' },
  application:      { color: '#FF7A2E', bg: 'rgba(255,92,0,.12)',     emoji: '📋' },
  lead_purchase:    { color: '#A78BFA', bg: 'rgba(167,139,250,.12)',  emoji: '💰' },
  profile_updated:  { color: '#E8C547', bg: 'rgba(232,197,71,.12)',   emoji: '👤' },
  password_changed: { color: '#A78BFA', bg: 'rgba(167,139,250,.12)', emoji: '🔑' },
}

/* ── Helpers ── */
const fmtDate = (d?: string | null) => d
  ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })
  : '—'

const fmtDateTime = (d?: string | null) => d
  ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true })
  : '—'

function getDevice(ua: string | null) {
  if (!ua) return 'Unknown'
  const u = ua.toLowerCase()
  return (u.includes('mobile') || u.includes('android') || u.includes('iphone')) ? 'Mobile' : 'Desktop'
}

function exportCSV(users: AdminUser[]) {
  const headers = ['Name','Phone','Email','Role','School','Profile Complete','Last IP','Active','Joined','Last Login','Applications','Leads Bought']
  const rows = users.map(u => [
    u.fullName, u.phone, u.email||'', u.role, u.schoolName||'',
    u.profileCompleted?'Yes':'No', u.lastIp||'',
    u.isActive?'Active':'Suspended', fmtDate(u.createdAt), fmtDate(u.lastLoginAt),
    u.totalApplications||0, u.totalLeadsBought||0,
  ])
  const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}))
  a.download = `thynk-schooling-users-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  toast.success('Exported as CSV — opens in Excel')
}

/* ── Cell styles ── */
const cell: React.CSSProperties   = { padding:'11px 13px', fontSize:'12px', fontFamily:'DM Sans,sans-serif', color:'rgba(255,255,255,0.85)', borderBottom:'1px solid #1E2A52', verticalAlign:'top' }
const hdCell: React.CSSProperties = { padding:'9px 13px', fontSize:'10px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#8892B0', fontFamily:'DM Sans,sans-serif', borderBottom:'1px solid #1E2A52', whiteSpace:'nowrap', background:'rgba(255,255,255,0.02)' }

/* ── Activity Drawer ── */
function ActivityDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ logs: ActivityLog[] }>({
    queryKey: ['ts-user-activity', user.id],
    queryFn:  () => apiGet(`/admin/users/${user.id}/activity?limit=50`),
    staleTime: 30000,
  })
  const logs = data?.logs || []
  const rc = ROLE_COLORS[user.role] || ROLE_COLORS.parent

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      style={{ position:'fixed', top:0, right:0, bottom:0, width:'440px', zIndex:200,
               background:'#0D1117', borderLeft:'1px solid #1E2A52',
               boxShadow:'-12px 0 48px rgba(0,0,0,.5)', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'20px', borderBottom:'1px solid #1E2A52', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'18px', color:'#fff' }}>Activity Log</div>
          <button onClick={onClose}
            style={{ width:30, height:30, borderRadius:'8px', border:'1px solid #1E2A52', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#8892B0' }}>
            <X style={{ width:14, height:14 }} />
          </button>
        </div>

        {/* User summary */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', marginBottom:'12px', border:'1px solid #1E2A52' }}>
          <div style={{ width:40, height:40, borderRadius:'10px', background:rc.bg, border:`1px solid ${rc.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'15px', color:rc.color, flexShrink:0 }}>
            {(user.fullName||user.phone||'U')[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:'13px', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.fullName}</div>
            <div style={{ fontSize:'11px', color:'#8892B0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.phone}{user.email ? ` · ${user.email}` : ''}</div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#8892B0', fontFamily:'monospace', justifyContent:'flex-end' }}>
              <Globe style={{ width:10, height:10 }} /> {user.lastIp || '—'}
            </div>
            <div style={{ fontSize:'10px', color:'#4A5568', marginTop:'2px' }}>Last IP</div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
          {[
            { label:'Events',     value: logs.length },
            { label:'Last Login', value: fmtDate(user.lastLoginAt) },
            { label:'Joined',     value: fmtDate(user.createdAt) },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'8px', textAlign:'center', border:'1px solid #1E2A52' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'14px', color:'#fff', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'9px', color:'#8892B0', marginTop:'3px', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {isLoading
          ? Array.from({length:5}).map((_,i) => (
              <div key={i} style={{ height:54, background:'rgba(255,255,255,0.03)', borderRadius:'8px', marginBottom:'8px' }} />
            ))
          : logs.length === 0
            ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#4A5568' }}>
                <Activity style={{ width:32, height:32, margin:'0 auto 10px', opacity:.3 }} />
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>No activity yet</div>
              </div>
            )
            : logs.map((log, i) => {
                const s = ACTION_STYLE[log.action] || { color:'#8892B0', bg:'rgba(255,255,255,0.04)', emoji:'•' }
                return (
                  <div key={log.id} style={{ display:'flex', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                      <div style={{ width:32, height:32, borderRadius:'8px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{s.emoji}</div>
                      {i < logs.length-1 && <div style={{ width:1, flex:1, background:'rgba(255,255,255,0.06)', marginTop:'4px', minHeight:'8px' }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0, paddingBottom:'8px' }}>
                      <div style={{ marginBottom:'3px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'100px', background:s.bg, color:s.color, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'.06em' }}>
                          {log.action.replace(/_/g,' ')}
                        </span>
                      </div>
                      {log.detail && (
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', fontFamily:'DM Sans,sans-serif', marginBottom:'4px', fontWeight:500 }}>{log.detail}</div>
                      )}
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'10px', color:'#8892B0', fontFamily:'DM Sans,sans-serif' }}>🕐 {fmtDateTime(log.created_at)}</span>
                        {log.ip_address && (
                          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', color:'#8892B0', fontFamily:'monospace' }}>
                            <Globe style={{ width:9, height:9 }} /> {log.ip_address}
                          </span>
                        )}
                        {log.user_agent && (
                          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', color:'#8892B0' }}>
                            {getDevice(log.user_agent) === 'Mobile'
                              ? <Smartphone style={{ width:9, height:9 }} />
                              : <Monitor style={{ width:9, height:9 }} />}
                            {getDevice(log.user_agent)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
        }
      </div>
    </motion.div>
  )
}

/* ── Main Page ── */
export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [tab,        setTab]        = useState('All')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null)

  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (tab === 'Parents')   params.set('role', 'parent')
  if (tab === 'Schools')   params.set('role', 'school_admin')
  if (tab === 'Admins')    params.set('role', 'super_admin')
  if (tab === 'Suspended') params.set('isActive', 'false')

  const { data, isLoading } = useQuery<{ data: AdminUser[]; total: number }>({
    queryKey: ['ts-admin-users', tab, search, page],
    queryFn:  () => apiGet(`/admin/users?${params.toString()}`),
    staleTime: 2 * 60 * 1000,
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const invalidate = () => qc.invalidateQueries({ queryKey: ['ts-admin-users'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/admin/users/${id}`, { isActive }),
    onSuccess: (_, { isActive }) => { toast.success(isActive ? 'User reactivated' : 'User suspended'); invalidate() },
    onError: () => toast.error('Action failed'),
  })

  return (
    <AdminLayout title="Users Manager" subtitle="All parents, school admins — view activity, IP logs and manage access">

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'18px' }}>
        {[
          { label:'Total',         value: total,                                              color:'#60A5FA' },
          { label:'Parents',       value: users.filter(u=>u.role==='parent').length,          color:'#4ADE80' },
          { label:'School Admins', value: users.filter(u=>u.role==='school_admin').length,    color:'#FF7A2E' },
          { label:'Profile Done',  value: users.filter(u=>u.profileCompleted).length,         color:'#E8C547' },
          { label:'Suspended',     value: users.filter(u=>!u.isActive).length,                color:'#F87171' },
        ].map((s,i) => (
          <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
            style={{ background:'#111830', border:'1px solid #1E2A52', borderRadius:'12px', padding:'14px 16px' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'26px', color:s.color, lineHeight:1, marginBottom:'4px' }}>{s.value}</div>
            <div style={{ fontSize:'10px', color:'#8892B0', fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background:'#111830', border:'1px solid #1E2A52', borderRadius:'14px', overflow:'hidden' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', borderBottom:'1px solid #1E2A52' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid #1E2A52', borderRadius:'8px', padding:'8px 12px' }}>
            <Search style={{ width:13, height:13, color:'#8892B0', flexShrink:0 }} />
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
              placeholder="Search name, phone, email, school..."
              style={{ background:'none', border:'none', outline:'none', fontSize:'13px', fontFamily:'DM Sans,sans-serif', color:'#fff', flex:1 }} />
          </div>
          <div style={{ display:'flex', gap:'5px' }}>
            {ROLE_TABS.map(t => (
              <button key={t} onClick={()=>{setTab(t);setPage(1)}}
                style={{ padding:'7px 13px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:600, fontFamily:'DM Sans,sans-serif', transition:'all .15s', whiteSpace:'nowrap',
                  background: tab===t ? '#B8860B' : 'rgba(255,255,255,0.05)',
                  color:      tab===t ? '#fff'    : '#8892B0' }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={()=>exportCSV(users)} disabled={!users.length}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:'1px solid rgba(184,134,11,0.3)', background:'rgba(184,134,11,0.08)', color:'#E8C547', cursor:'pointer', fontSize:'11px', fontWeight:600, fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
            <Download style={{ width:12, height:12 }} /> Export Excel
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['User','Role','School','Profile','IP Address','Last Login','Joined','Status','Actions'].map(h => (
                  <th key={h} style={hdCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({length:8}).map((_,i) => (
                    <tr key={i}><td colSpan={9} style={{padding:'10px 14px'}}>
                      <div style={{height:'36px',background:'rgba(255,255,255,0.03)',borderRadius:'6px'}} />
                    </td></tr>
                  ))
                : users.length === 0
                  ? <tr><td colSpan={9} style={{...cell,textAlign:'center',padding:'40px',color:'#8892B0'}}>No users found.</td></tr>
                  : users.map((u) => {
                      const rc = ROLE_COLORS[u.role] || ROLE_COLORS.parent
                      return (
                        <tr key={u.id}
                          onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='rgba(255,255,255,0.02)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background='transparent'}>

                          {/* User */}
                          <td style={{...cell, minWidth:'160px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                              <div style={{width:34,height:34,borderRadius:'9px',background:rc.bg,border:`1px solid ${rc.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'13px',color:rc.color,flexShrink:0}}>
                                {(u.fullName||u.phone||'U')[0].toUpperCase()}
                              </div>
                              <div style={{minWidth:0}}>
                                <div style={{fontWeight:600,fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'130px'}}>{u.fullName||'—'}</div>
                                <div style={{fontSize:'11px',color:'#8892B0',display:'flex',alignItems:'center',gap:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'130px'}}>
                                  <Phone style={{width:9,height:9}}/> {u.phone}
                                  {u.isPhoneVerified && <span style={{width:5,height:5,borderRadius:'50%',background:'#4ADE80',display:'inline-block',flexShrink:0}} />}
                                </div>
                                {u.email && <div style={{fontSize:'10px',color:'#4A5568',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'130px'}}>{u.email}</div>}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={cell}>
                            <span style={{fontSize:'10px',fontWeight:600,padding:'3px 9px',borderRadius:'100px',background:rc.bg,color:rc.color,whiteSpace:'nowrap'}}>
                              {rc.label}
                            </span>
                          </td>

                          {/* School */}
                          <td style={{...cell,maxWidth:'130px'}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'12px',color:'#8892B0'}}>
                              {u.schoolName || (u.role==='parent' ? `${u.totalApplications||0} applications` : '—')}
                            </div>
                          </td>

                          {/* Profile */}
                          <td style={{...cell,textAlign:'center'}}>
                            {u.profileCompleted
                              ? <span style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'11px',fontWeight:600,color:'#4ADE80'}}><CheckCircle style={{width:11,height:11}}/>Done</span>
                              : <span style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'11px',fontWeight:600,color:'#F87171'}}><XCircle style={{width:11,height:11}}/>Pending</span>}
                          </td>

                          {/* IP */}
                          <td style={{...cell,fontFamily:'monospace',fontSize:'11px',color:'#8892B0',whiteSpace:'nowrap'}}>
                            {u.lastIp
                              ? <div style={{display:'flex',alignItems:'center',gap:'4px'}}><Globe style={{width:10,height:10}}/>{u.lastIp}</div>
                              : '—'}
                          </td>

                          {/* Last Login */}
                          <td style={{...cell,fontSize:'11px',color:'#8892B0',whiteSpace:'nowrap'}}>{fmtDate(u.lastLoginAt)}</td>

                          {/* Joined */}
                          <td style={{...cell,fontSize:'11px',color:'#8892B0',whiteSpace:'nowrap'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                              <Calendar style={{width:10,height:10}}/>{fmtDate(u.createdAt)}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={cell}>
                            <span style={{fontSize:'10px',fontWeight:600,padding:'3px 9px',borderRadius:'100px',whiteSpace:'nowrap',
                              background:u.isActive?'rgba(74,222,128,0.1)':'rgba(239,68,68,0.1)',
                              color:     u.isActive?'#4ADE80'            :'#F87171'}}>
                              {u.isActive?'Active':'Suspended'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={cell}>
                            <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
                              <button onClick={()=>setActiveUser(u)}
                                style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'6px',border:'1px solid rgba(232,197,71,0.3)',background:'rgba(232,197,71,0.06)',color:'#E8C547',cursor:'pointer',fontSize:'11px',fontWeight:600,fontFamily:'DM Sans,sans-serif',whiteSpace:'nowrap'}}>
                                <Activity style={{width:10,height:10}}/> Logs
                              </button>
                              {u.role !== 'super_admin' && (
                                <button onClick={()=>{
                                    if (!u.isActive || confirm(`Suspend "${u.fullName||u.phone}"?`))
                                      toggleMutation.mutate({id:u.id,isActive:!u.isActive})
                                  }}
                                  style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:600,fontFamily:'DM Sans,sans-serif',whiteSpace:'nowrap',
                                    background:u.isActive?'rgba(239,68,68,0.1)':'rgba(74,222,128,0.1)',
                                    color:     u.isActive?'#F87171'            :'#4ADE80'}}>
                                  {u.isActive?<><UserX style={{width:10,height:10}}/>Suspend</>:<><UserCheck style={{width:10,height:10}}/>Restore</>}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderTop:'1px solid #1E2A52'}}>
            <span style={{fontSize:'12px',color:'#8892B0',fontFamily:'DM Sans,sans-serif'}}>{((page-1)*20)+1}–{Math.min(page*20,total)} of {total} users</span>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{padding:'6px 14px',borderRadius:'7px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2A52',color:'#8892B0',cursor:'pointer',fontSize:'12px',opacity:page===1?.4:1}}>← Prev</button>
              <button onClick={()=>setPage(p=>p+1)} disabled={page*20>=total}
                style={{padding:'6px 14px',borderRadius:'7px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2A52',color:'#8892B0',cursor:'pointer',fontSize:'12px',opacity:page*20>=total?.4:1}}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Activity drawer */}
      <AnimatePresence>
        {activeUser && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setActiveUser(null)}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:199,backdropFilter:'blur(3px)'}} />
            <ActivityDrawer user={activeUser} onClose={()=>setActiveUser(null)} />
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
