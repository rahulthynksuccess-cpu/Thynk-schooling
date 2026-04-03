'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { useState } from 'react'
import {
  School, Users, TrendingUp, DollarSign, FileCheck,
  Star, ArrowUpRight, CheckCircle2, PhoneCall, Package, Eye
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, RadialBarChart, RadialBar
} from 'recharts'

const T = {
  bg:'#04080F', card:'#0C1422', border:'rgba(255,255,255,0.07)',
  t1:'rgba(255,255,255,0.95)', t2:'rgba(255,255,255,0.55)', t3:'rgba(255,255,255,0.25)',
  gold:'#F5A623', blue:'#4F8EF7', green:'#00E5A0', purple:'#9B72FF',
  red:'#FF5757', orange:'#FF7A2E',
}
const card: React.CSSProperties = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16 }

const leadsWeekly = [
  {day:'Mon',leads:12,revenue:3600},{day:'Tue',leads:19,revenue:5700},
  {day:'Wed',leads:15,revenue:4500},{day:'Thu',leads:28,revenue:8400},
  {day:'Fri',leads:24,revenue:7200},{day:'Sat',leads:31,revenue:9300},{day:'Sun',leads:22,revenue:6600},
]
const monthlyGrowth = [
  {month:'Oct',users:42,schools:8,leads:85},{month:'Nov',users:67,schools:14,leads:134},
  {month:'Dec',users:55,schools:11,leads:110},{month:'Jan',users:89,schools:19,leads:178},
  {month:'Feb',users:112,schools:24,leads:224},{month:'Mar',users:143,schools:31,leads:286},
]
const schoolsByBoard = [
  {name:'CBSE',value:45,color:T.gold},{name:'ICSE',value:22,color:T.blue},
  {name:'State',value:20,color:T.green},{name:'IB',value:8,color:T.purple},{name:'Other',value:5,color:T.orange},
]
const appStatusData = [
  {name:'Pending',value:35,fill:'#FBBF24'},{name:'Shortlisted',value:25,fill:T.green},
  {name:'Admitted',value:28,fill:T.blue},{name:'Rejected',value:12,fill:T.red},
]

function ChartTip({active,payload,label}:any){
  if(!active||!payload?.length) return null
  return (
    <div style={{background:'#111927',border:`1px solid ${T.border}`,borderRadius:10,padding:'10px 14px',fontSize:12,fontFamily:'Plus Jakarta Sans,sans-serif',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {label&&<div style={{color:T.t2,marginBottom:6,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>}
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:i<payload.length-1?4:0}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color||p.fill}}/>
          <span style={{color:T.t2,textTransform:'capitalize'}}>{p.name}:</span>
          <span style={{color:T.t1,fontWeight:700}}>{p.name==='revenue'?`₹${p.value.toLocaleString('en-IN')}`:p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function TabBar({tabs,active,onChange}:{tabs:string[];active:string;onChange:(t:string)=>void}){
  return (
    <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,fontWeight:active===t?700:500,background:active===t?T.gold:'transparent',color:active===t?'#000':T.t2,transition:'all 0.15s'}}>{t}</button>
      ))}
    </div>
  )
}

function KPICard({icon:Icon,label,value,sub,color,href,trendUp}:any){
  return (
    <Link href={href} style={{...card,display:'block',textDecoration:'none',padding:'20px 22px',position:'relative',overflow:'hidden',transition:'transform 0.2s,box-shadow 0.2s'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 40px ${color}20`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},${color}00)`}}/>
      <div style={{position:'absolute',top:-30,right:-20,width:100,height:100,borderRadius:'50%',background:`${color}06`,pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${color}15`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon style={{width:19,height:19,color}}/>
        </div>
        <ArrowUpRight style={{width:13,height:13,color:T.t3}}/>
      </div>
      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:30,color:T.t1,lineHeight:1,letterSpacing:'-0.5px'}}>{value}</div>
      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:4}}>{label}</div>
      {sub&&<div style={{marginTop:10}}><span style={{fontSize:11,color:trendUp!==false?T.green:T.red,fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{sub}</span></div>}
    </Link>
  )
}

export default function AdminDashboardPage(){
  const [chartTab,setChartTab]=useState('Leads')
  const [growthTab,setGrowthTab]=useState('6M')
  const {data,isLoading}=useQuery({
    queryKey:['admin-overview'],
    queryFn:()=>fetch('/api/admin/overview',{cache:'no-store'}).then(r=>r.json()),
    staleTime:2*60*1000,
  })
  const skel=(h=40)=><div style={{height:h,background:'rgba(255,255,255,0.04)',borderRadius:8,animation:'tskel 1.4s ease-in-out infinite'}}/>
  const KPIS=[
    {icon:School,    label:'Total Schools',   value:(data?.totalSchools||0).toLocaleString('en-IN'),                    sub:`${data?.pendingVerification||0} pending`,    trendUp:true, color:T.gold,   href:'/admin/schools'},
    {icon:Users,     label:'Registered Users',value:(data?.totalUsers||0).toLocaleString('en-IN'),                      sub:`+${data?.newUsersToday||0} today`,           trendUp:true, color:T.blue,   href:'/admin/users'},
    {icon:TrendingUp,label:'Total Leads',     value:(data?.totalLeads||0).toLocaleString('en-IN'),                      sub:`+${data?.leadsToday||0} today`,             trendUp:true, color:T.green,  href:'/admin/leads'},
    {icon:DollarSign,label:'Total Revenue',   value:`₹${((data?.totalRevenue||0)/100).toLocaleString('en-IN')}`,       sub:'All-time collections',                      trendUp:true, color:'#F59E0B',href:'/admin/payments'},
    {icon:FileCheck, label:'Applications',    value:(data?.totalApps||0).toLocaleString('en-IN'),                       sub:`${data?.pendingApps||0} pending`,           trendUp:null, color:T.purple, href:'/admin/applications'},
    {icon:Star,      label:'Reviews',         value:(data?.totalReviews||0).toLocaleString('en-IN'),                    sub:`${data?.pendingReviews||0} to moderate`,    trendUp:null, color:T.orange, href:'/admin/reviews'},
  ]
  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview — live data">
      <style>{`@keyframes tskel{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}.ds{animation:fadeUp 0.4s ease both}`}</style>

      {/* KPI Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}} className="ds">
        {KPIS.map(k=><KPICard key={k.label} {...k}/>)}
      </div>

      {/* Charts Row 1 */}
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14,marginBottom:14}} className="ds">
        {/* Weekly area chart */}
        <div style={{...card,padding:'22px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Weekly Activity</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:3}}>Leads & revenue — last 7 days</p>
            </div>
            <TabBar tabs={['Leads','Revenue']} active={chartTab} onChange={setChartTab}/>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={leadsWeekly} margin={{top:5,right:5,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="glL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.35}/><stop offset="100%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                <linearGradient id="glR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.35}/><stop offset="100%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:T.t3,fontSize:11,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.t3,fontSize:11,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
              {chartTab==='Leads'&&<Area type="monotone" dataKey="leads" stroke={T.green} strokeWidth={2.5} fill="url(#glL)" dot={false} activeDot={{r:5,fill:T.green,stroke:T.card,strokeWidth:2}}/>}
              {chartTab==='Revenue'&&<Area type="monotone" dataKey="revenue" stroke={T.gold} strokeWidth={2.5} fill="url(#glR)" dot={false} activeDot={{r:5,fill:T.gold,stroke:T.card,strokeWidth:2}}/>}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Board donut */}
        <div style={{...card,padding:'22px 24px'}}>
          <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Schools by Board</h3>
          <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:16}}>Curriculum distribution</p>
          <ResponsiveContainer width="100%" height={155}>
            <PieChart>
              <Pie data={schoolsByBoard} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                {schoolsByBoard.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip content={<ChartTip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:6}}>
            {schoolsByBoard.map(b=>(
              <div key={b.name} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:8,height:8,borderRadius:2,background:b.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{b.name}</span>
                <span style={{fontSize:11,color:T.t1,fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{b.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}} className="ds">
        {/* Monthly growth bar */}
        <div style={{...card,padding:'22px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Platform Growth</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:3}}>Users, schools & leads monthly</p>
            </div>
            <TabBar tabs={['6M','3M','1M']} active={growthTab} onChange={setGrowthTab}/>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyGrowth} margin={{top:5,right:5,left:-20,bottom:0}} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:T.t3,fontSize:11,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.t3,fontSize:11,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans',paddingTop:8}}/>
              <Bar dataKey="users" fill={T.blue} radius={[4,4,0,0]} maxBarSize={22}/>
              <Bar dataKey="schools" fill={T.gold} radius={[4,4,0,0]} maxBarSize={22}/>
              <Bar dataKey="leads" fill={T.green} radius={[4,4,0,0]} maxBarSize={22}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application pipeline radial */}
        <div style={{...card,padding:'22px 24px'}}>
          <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Application Pipeline</h3>
          <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:16}}>Status breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={75} data={appStatusData} startAngle={90} endAngle={-270}>
              <RadialBar minAngle={8} dataKey="value" cornerRadius={4}/>
              <Tooltip content={<ChartTip/>}/>
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px',marginTop:4}}>
            {appStatusData.map(a=>(
              <div key={a.name} style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:9,height:9,borderRadius:3,background:a.fill,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans,sans-serif',flex:1}}>{a.name}</span>
                <span style={{fontSize:12,color:T.t1,fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginBottom:24}} className="ds">
        {/* Recent leads table */}
        <div style={{...card,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${T.border}`}}>
            <div>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Recent Leads</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:3}}>Latest parent enquiries</p>
            </div>
            <Link href="/admin/leads" style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:`${T.green}12`,border:`1px solid ${T.green}22`,color:T.green,fontSize:11,fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif',textDecoration:'none'}}>
              View All <ArrowUpRight style={{width:11,height:11}}/>
            </Link>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  {['School','Parent','Class','Price','Status','Date'].map(h=>(
                    <th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:T.t3,fontFamily:'Plus Jakarta Sans,sans-serif',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ?[1,2,3,4,5].map(i=><tr key={i}><td colSpan={6} style={{padding:'10px 16px'}}><div style={{height:30,background:'rgba(255,255,255,0.04)',borderRadius:6,animation:'tskel 1.4s ease-in-out infinite'}}/></td></tr>)
                  :(data?.recentLeads||[]).length===0
                    ?<tr><td colSpan={6} style={{padding:40,textAlign:'center',color:T.t3,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13}}>No leads yet</td></tr>
                    :(data?.recentLeads||[]).map((l:any)=>(
                        <tr key={l.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background .15s'}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          <td style={{padding:'11px 16px',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:600,color:T.t1}}>{l.schoolName}</td>
                          <td style={{padding:'11px 16px',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,color:T.t2}}>{l.isPurchased?l.parentName:`${(l.parentName||'P')[0]}***`}</td>
                          <td style={{padding:'11px 16px',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t3}}>Cls {l.classApplied}</td>
                          <td style={{padding:'11px 16px',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,color:T.green}}>₹{((l.price||0)/100).toLocaleString('en-IN')}</td>
                          <td style={{padding:'11px 16px'}}>
                            <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,background:l.isPurchased?`${T.green}14`:'rgba(251,191,36,0.12)',color:l.isPurchased?T.green:'#FBBF24',border:`1px solid ${l.isPurchased?T.green:'#FBBF24'}22`}}>
                              {l.isPurchased?'● Bought':'○ New'}
                            </span>
                          </td>
                          <td style={{padding:'11px 16px',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t3,whiteSpace:'nowrap'}}>
                            {l.createdAt?new Date(l.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panels stacked */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{...card,padding:'18px 20px',flex:1,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:14,color:T.t1,margin:0}}>Pending Verification</h3>
              <Link href="/admin/schools?isVerified=false" style={{fontSize:11,color:T.gold,fontWeight:700,textDecoration:'none',fontFamily:'Plus Jakarta Sans,sans-serif'}}>View all →</Link>
            </div>
            {isLoading?[1,2,3].map(i=><div key={i} style={{marginBottom:8}}>{skel(44)}</div>):
             (data?.pendingSchools||[]).length===0
              ?<div style={{textAlign:'center',padding:'20px 0',color:T.t3,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12}}>
                  <CheckCircle2 style={{width:24,height:24,margin:'0 auto 8px',opacity:0.2}}/> All clear
                </div>
              :(data?.pendingSchools||[]).slice(0,3).map((s:any)=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${T.border}`,marginBottom:7}}>
                    <div style={{width:34,height:34,borderRadius:8,background:`${T.gold}12`,border:`1px solid ${T.gold}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <School style={{width:15,height:15,color:T.gold}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t3}}>{s.city}</div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'rgba(251,191,36,0.1)',color:'#FBBF24',border:'1px solid rgba(251,191,36,0.18)',flexShrink:0}}>PENDING</span>
                  </div>
                ))
            }
          </div>
          <div style={{...card,padding:'18px 20px',flex:1}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:14,color:T.t1,margin:0}}>New Signups</h3>
              <Link href="/admin/users" style={{fontSize:11,color:T.blue,fontWeight:700,textDecoration:'none',fontFamily:'Plus Jakarta Sans,sans-serif'}}>View all →</Link>
            </div>
            {isLoading?[1,2,3,4].map(i=><div key={i} style={{marginBottom:7}}>{skel(36)}</div>):
             (data?.recentUsers||[]).slice(0,4).map((u:any,i:number)=>{
               const colors=[T.gold,T.blue,T.green,T.purple,T.orange]; const c=colors[i%colors.length]
               return (
                 <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                   <div style={{width:30,height:30,borderRadius:8,background:`${c}18`,border:`1px solid ${c}28`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:12,color:c,flexShrink:0}}>
                     {(u.fullName||u.phone||'U')[0].toUpperCase()}
                   </div>
                   <div style={{flex:1,minWidth:0}}>
                     <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.fullName||u.phone}</div>
                     <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:10,color:T.t3}}>{u.role==='school_admin'?'School Admin':'Parent'}</div>
                   </div>
                   <div style={{fontSize:9,padding:'2px 7px',borderRadius:99,background:u.role==='school_admin'?`${T.gold}12`:`${T.blue}12`,color:u.role==='school_admin'?T.gold:T.blue,fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,border:`1px solid ${u.role==='school_admin'?T.gold:T.blue}20`}}>
                     {u.role==='school_admin'?'SCHOOL':'PARENT'}
                   </div>
                 </div>
               )
             })
            }
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ds">
        <h2 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:15,color:T.t1,margin:'0 0 12px'}}>Quick Actions</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {icon:School,    label:'Verify Schools',   sub:'Review pending',  color:T.gold,   href:'/admin/schools?isVerified=false'},
            {icon:Eye,       label:'Moderate Reviews', sub:'Approve & flag',  color:T.purple, href:'/admin/reviews'},
            {icon:PhoneCall, label:'Counselling Queue',sub:'Call pending',    color:T.green,  href:'/admin/counselling'},
            {icon:Package,   label:'Manage Packages',  sub:'Edit lead packs', color:T.blue,   href:'/admin/packages'},
          ].map(a=>(
            <Link key={a.label} href={a.href} style={{...card,padding:'16px 18px',textDecoration:'none',display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${a.color}30`;(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.transform='none'}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${a.color}14`,border:`1px solid ${a.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <a.icon style={{width:17,height:17,color:a.color}}/>
              </div>
              <div>
                <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,color:T.t1}}>{a.label}</div>
                <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t3,marginTop:2}}>{a.sub}</div>
              </div>
              <ArrowUpRight style={{width:13,height:13,color:T.t3,marginLeft:'auto'}}/>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
