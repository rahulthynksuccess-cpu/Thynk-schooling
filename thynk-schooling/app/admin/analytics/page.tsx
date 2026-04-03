'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, School, DollarSign,
  Eye, FileCheck, Phone, BarChart3, MapPin, Search, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, Scatter, ScatterChart, ZAxis, FunnelChart, Funnel, LabelList
} from 'recharts'

const T = {
  bg:'#04080F', card:'#0C1422', border:'rgba(255,255,255,0.07)',
  t1:'rgba(255,255,255,0.95)', t2:'rgba(255,255,255,0.55)', t3:'rgba(255,255,255,0.25)',
  gold:'#F5A623', blue:'#4F8EF7', green:'#00E5A0', purple:'#9B72FF',
  red:'#FF5757', orange:'#FF7A2E', cyan:'#06D6F5', pink:'#F472B6',
}
const card: React.CSSProperties = { background:T.card, border:`1px solid ${T.border}`, borderRadius:16 }

/* ── Mock data sets ── */
const dailyLeads30 = Array.from({length:30},(_,i)=>({
  day:`D${i+1}`, leads:Math.floor(8+Math.random()*28), revenue:Math.floor(2400+Math.random()*8400),
}))
const monthlyRevenue = [
  {month:'Oct',revenue:124000,target:100000},{month:'Nov',revenue:198000,target:160000},
  {month:'Dec',revenue:167000,target:200000},{month:'Jan',revenue:241000,target:220000},
  {month:'Feb',revenue:289000,target:260000},{month:'Mar',revenue:334000,target:300000},
]
const topCities = [
  {city:'Mumbai',leads:234,schools:18},{city:'Delhi',leads:198,schools:22},
  {city:'Bengaluru',leads:176,schools:15},{city:'Chennai',leads:142,schools:12},
  {city:'Pune',leads:118,schools:9},{city:'Hyderabad',leads:94,schools:8},
]
const funnelData = [
  {name:'Visitors',value:12400,fill:T.blue},
  {name:'School Views',value:4820,fill:T.purple},
  {name:'Lead Submitted',value:1243,fill:T.cyan},
  {name:'Lead Purchased',value:387,fill:T.green},
  {name:'Application',value:112,fill:T.gold},
]
const boardData = [
  {name:'CBSE',value:45,color:T.gold},{name:'ICSE',value:22,color:T.blue},
  {name:'State',value:20,color:T.green},{name:'IB',value:8,color:T.purple},{name:'Other',value:5,color:T.orange},
]
const weeklyHeatmap = [
  {hour:'6am',Mon:2,Tue:3,Wed:1,Thu:4,Fri:2,Sat:1,Sun:0},
  {hour:'9am',Mon:8,Tue:12,Wed:9,Thu:15,Fri:11,Sat:4,Sun:2},
  {hour:'12pm',Mon:14,Tue:18,Wed:16,Thu:22,Fri:19,Sat:8,Sun:5},
  {hour:'3pm',Mon:11,Tue:16,Wed:13,Thu:18,Fri:15,Sat:12,Sun:7},
  {hour:'6pm',Mon:9,Tue:11,Wed:10,Thu:14,Fri:12,Sat:18,Sun:11},
  {hour:'9pm',Mon:5,Tue:7,Wed:6,Thu:9,Fri:8,Sat:14,Sun:9},
]
const acquisitionData = [
  {channel:'Organic Search',users:4820,pct:39},{channel:'Direct',users:2340,pct:19},
  {channel:'Social Media',users:1980,pct:16},{channel:'Referral',users:1450,pct:12},
  {channel:'Paid Ads',users:980,pct:8},{channel:'Email',users:730,pct:6},
]
const retentionData = [
  {week:'W1',users:100},{week:'W2',users:82},{week:'W3',users:71},
  {week:'W4',users:64},{week:'W5',users:58},{week:'W6',users:54},
  {week:'W7',users:50},{week:'W8',users:47},
]

function ChartTip({active,payload,label}:any){
  if(!active||!payload?.length) return null
  return (
    <div style={{background:'#111927',border:`1px solid ${T.border}`,borderRadius:10,padding:'10px 14px',fontSize:12,fontFamily:'Plus Jakarta Sans,sans-serif',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {label&&<div style={{color:T.t2,marginBottom:6,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>}
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:i<payload.length-1?4:0}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color||p.fill||p.stroke}}/>
          <span style={{color:T.t2}}>{p.name}:</span>
          <span style={{color:T.t1,fontWeight:700}}>{
            ['revenue','target'].includes(p.name)?`₹${p.value.toLocaleString('en-IN')}`:p.value.toLocaleString()
          }</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({icon:Icon,label,value,trend,color,rupee}:any){
  const up=trend>=0
  return (
    <div style={{...card,padding:'20px 22px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},${color}00)`}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:10,background:`${color}15`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon style={{width:18,height:18,color}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:8,background:up?'rgba(0,229,160,0.1)':'rgba(255,87,87,0.1)'}}>
          {up?<TrendingUp style={{width:11,height:11,color:T.green}}/>:<TrendingDown style={{width:11,height:11,color:T.red}}/>}
          <span style={{fontSize:11,color:up?T.green:T.red,fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{up?'+':''}{trend}%</span>
        </div>
      </div>
      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:28,color:T.t1,lineHeight:1}}>
        {rupee?`₹${(value/100).toLocaleString('en-IN')}`:value.toLocaleString()}
      </div>
      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:4}}>{label}</div>
    </div>
  )
}

const REPORT_TABS = ['Overview','Leads & Revenue','User Acquisition','Geographic','Conversions']

export default function AdminAnalyticsPage(){
  const [tab,setTab]=useState('Overview')
  const {data,isLoading}=useQuery({
    queryKey:['admin-analytics'],
    queryFn:()=>fetch('/api/admin/analytics',{cache:'no-store'}).then(r=>r.json()),
    staleTime:5*60*1000,
  })
  const skel=(h=32)=><div style={{height:h,background:'rgba(255,255,255,0.05)',borderRadius:8,marginBottom:8,animation:'tskel 1.4s ease-in-out infinite'}}/>
  const METRICS=[
    {icon:Users,    label:'Total Users',   value:data?.totalUsers  ||4820, trend:data?.usersTrend  ||12,  color:T.blue},
    {icon:School,   label:'Total Schools', value:data?.totalSchools||312,  trend:data?.schoolsTrend||8,   color:T.gold},
    {icon:TrendingUp,label:'Total Leads',  value:data?.totalLeads  ||2847, trend:data?.leadsTrend  ||23,  color:T.green},
    {icon:DollarSign,label:'Revenue',      value:data?.totalRevenue||3340000,trend:data?.revenueTrend||18,color:'#F59E0B',rupee:true},
    {icon:Eye,      label:'Page Views',    value:data?.totalViews  ||84200, trend:data?.viewsTrend  ||-3, color:T.purple},
    {icon:FileCheck,label:'Applications',  value:data?.totalApps   ||673,  trend:data?.appsTrend   ||31,  color:T.orange},
  ]
  return (
    <AdminLayout title="Analytics" subtitle="Platform performance, growth trends and key metrics">
      <style>{`@keyframes tskel{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── Report Tabs ── */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.03)',borderRadius:12,padding:4,border:`1px solid ${T.border}`,width:'fit-content'}}>
        {REPORT_TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 18px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,fontWeight:tab===t?700:500,background:tab===t?T.gold:'transparent',color:tab===t?'#000':T.t2,transition:'all 0.15s',whiteSpace:'nowrap'}}>
            {t}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {tab==='Overview'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {METRICS.map(m=><MetricCard key={m.label} {...m}/>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
            {/* Top cities */}
            <div style={{...card,padding:'22px 24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}>
                <MapPin style={{width:15,height:15,color:T.blue}}/> Top Cities
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topCities} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                  <XAxis type="number" tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="city" tick={{fill:T.t2,fontSize:11,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                  <Bar dataKey="leads" fill={T.blue} radius={[0,4,4,0]} maxBarSize={16}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Board donut */}
            <div style={{...card,padding:'22px 24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 16px'}}>Schools by Board</h3>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={boardData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {boardData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',marginTop:8}}>
                {boardData.map(b=>(
                  <div key={b.name} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:7,height:7,borderRadius:2,background:b.color}}/>
                    <span style={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{b.name} <strong style={{color:T.t1}}>{b.value}%</strong></span>
                  </div>
                ))}
              </div>
            </div>
            {/* Top schools */}
            <div style={{...card,padding:'22px 24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 16px'}}>Top Schools by Leads</h3>
              {isLoading?[1,2,3,4,5].map(i=><div key={i}>{skel()}</div>):
               (data?.topSchools||[{name:'Delhi Public School',city:'Delhi',leadCount:84},{name:'Ryan International',city:'Mumbai',leadCount:71},{name:'Kendriya Vidyalaya',city:'Bengaluru',leadCount:63},{name:'DAV Public School',city:'Pune',leadCount:54},{name:'St. Xavier\'s',city:'Chennai',leadCount:48}]).map((s:any,i:number)=>(
                 <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                   <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:11,color:T.t3,minWidth:20,textAlign:'right'}}>{String(i+1).padStart(2,'0')}</span>
                   <div style={{flex:1,minWidth:0}}>
                     <div style={{fontSize:12,fontWeight:600,color:T.t1,fontFamily:'Plus Jakarta Sans,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                     <div style={{fontSize:10,color:T.t3,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{s.city}</div>
                   </div>
                   <span style={{fontSize:12,color:T.green,fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,flexShrink:0}}>{s.leadCount}</span>
                 </div>
               ))
              }
            </div>
          </div>
        </>
      )}

      {/* ══ LEADS & REVENUE TAB ══ */}
      {tab==='Leads & Revenue'&&(
        <>
          {/* 30-day dual-axis chart */}
          <div style={{...card,padding:'24px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Leads & Revenue — Last 30 Days</h3>
                <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginTop:3}}>Daily breakdown of lead generation and revenue collected</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={dailyLeads30} margin={{top:5,right:20,left:-10,bottom:0}}>
                <defs>
                  <linearGradient id="glLeads30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.green} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false} interval={4}/>
                <YAxis yAxisId="left" tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans',paddingTop:8}}/>
                <Area yAxisId="left" type="monotone" dataKey="leads" stroke={T.green} strokeWidth={2} fill="url(#glLeads30)" dot={false}/>
                <Bar yAxisId="right" dataKey="revenue" fill={`${T.gold}60`} stroke={T.gold} strokeWidth={1} radius={[3,3,0,0]} maxBarSize={14}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Target + Activity Heatmap */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Revenue vs Target</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>Monthly performance against goals</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyRevenue} margin={{top:5,right:5,left:-10,bottom:0}} barGap={5}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans',paddingTop:8}}/>
                  <Bar dataKey="target" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" radius={[4,4,0,0]} maxBarSize={28}/>
                  <Bar dataKey="revenue" fill={T.gold} radius={[4,4,0,0]} maxBarSize={28}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Activity heatmap as stacked bar approximation */}
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Activity by Hour & Day</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>When parents are most active</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyHeatmap} margin={{top:5,right:5,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="hour" tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:10,color:T.t2,fontFamily:'Plus Jakarta Sans',paddingTop:8}}/>
                  <Bar dataKey="Mon" fill={T.blue}    stackId="a" maxBarSize={36}/>
                  <Bar dataKey="Wed" fill={T.green}   stackId="a" maxBarSize={36}/>
                  <Bar dataKey="Fri" fill={T.gold}    stackId="a" maxBarSize={36}/>
                  <Bar dataKey="Sat" fill={T.purple}  stackId="a" maxBarSize={36} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ══ USER ACQUISITION TAB ══ */}
      {tab==='User Acquisition'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14,marginBottom:14}}>
            {/* Acquisition channels */}
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Traffic Sources</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>Where your users come from</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {acquisitionData.map((a,i)=>{
                  const colors=[T.blue,T.green,T.purple,T.gold,T.orange,T.cyan]
                  const c=colors[i%colors.length]
                  return (
                    <div key={a.channel}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,color:T.t1,fontWeight:500}}>{a.channel}</span>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2}}>{a.users.toLocaleString()} users</span>
                          <span style={{fontSize:11,fontWeight:700,color:c,fontFamily:'Plus Jakarta Sans,sans-serif',minWidth:30,textAlign:'right'}}>{a.pct}%</span>
                        </div>
                      </div>
                      <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${c},${c}99)`,width:`${a.pct}%`,transition:'width 0.6s ease'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* User retention line */}
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>User Retention</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>% of users returning each week</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={retentionData} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="glRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.purple} stopOpacity={0.35}/>
                      <stop offset="100%" stopColor={T.purple} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="week" tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
                  <Area type="monotone" dataKey="users" stroke={T.purple} strokeWidth={2.5} fill="url(#glRet)" dot={{r:4,fill:T.purple,stroke:T.card,strokeWidth:2}} activeDot={{r:6}}/>
                </AreaChart>
              </ResponsiveContainer>
              <div style={{marginTop:16,padding:'12px 16px',borderRadius:10,background:'rgba(155,114,255,0.08)',border:'1px solid rgba(155,114,255,0.15)'}}>
                <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2}}>
                  <span style={{color:T.purple,fontWeight:700}}>47%</span> of users return after 8 weeks — above industry avg of <span style={{color:T.t1,fontWeight:600}}>32%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ GEOGRAPHIC TAB ══ */}
      {tab==='Geographic'&&(
        <>
          <div style={{...card,padding:'24px',marginBottom:14}}>
            <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Leads by City</h3>
            <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>Top performing cities by lead volume</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCities} margin={{top:5,right:20,left:10,bottom:0}} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="city" tick={{fill:T.t2,fontSize:12,fontFamily:'Plus Jakarta Sans'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:T.t2,fontFamily:'Plus Jakarta Sans',paddingTop:8}}/>
                <Bar dataKey="leads" name="Leads" fill={T.blue} radius={[6,6,0,0]} maxBarSize={44}/>
                <Bar dataKey="schools" name="Schools" fill={T.gold} radius={[6,6,0,0]} maxBarSize={44}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {topCities.map((c,i)=>{
              const colors=[T.blue,T.green,T.gold,T.purple,T.orange,T.cyan]; const col=colors[i%colors.length]
              const maxLeads=topCities[0].leads; const pct=Math.round((c.leads/maxLeads)*100)
              return (
                <div key={c.city} style={{...card,padding:'18px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:9,background:`${col}15`,border:`1px solid ${col}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <MapPin style={{width:15,height:15,color:col}}/>
                    </div>
                    <div>
                      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:14,color:T.t1}}>{c.city}</div>
                      <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t3}}>{c.schools} schools</div>
                    </div>
                  </div>
                  <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:26,color:col,lineHeight:1,marginBottom:8}}>{c.leads}</div>
                  <div style={{fontSize:11,color:T.t3,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:8}}>leads generated</div>
                  <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.06)'}}>
                    <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${col},${col}80)`,width:`${pct}%`}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ══ CONVERSIONS TAB ══ */}
      {tab==='Conversions'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14,marginBottom:14}}>
            {/* Funnel */}
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Conversion Funnel</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>Visitors → Applications pipeline</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {funnelData.map((f,i)=>{
                  const pct=Math.round((f.value/funnelData[0].value)*100)
                  const prevPct=i>0?Math.round((funnelData[i-1].value/funnelData[0].value)*100):100
                  const dropPct=i>0?Math.round(((funnelData[i-1].value-f.value)/funnelData[i-1].value)*100):0
                  return (
                    <div key={f.name}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:8,height:8,borderRadius:2,background:f.fill}}/>
                          <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,color:T.t1,fontWeight:500}}>{f.name}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          {i>0&&<span style={{fontSize:11,color:T.red,fontFamily:'Plus Jakarta Sans,sans-serif'}}>-{dropPct}%</span>}
                          <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,color:T.t1}}>{f.value.toLocaleString()}</span>
                          <span style={{fontSize:11,color:f.fill,fontFamily:'Plus Jakarta Sans,sans-serif',minWidth:36,textAlign:'right'}}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{height:10,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${f.fill},${f.fill}80)`,width:`${pct}%`,transition:'width 0.7s ease'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div style={{padding:'12px 14px',borderRadius:10,background:`${T.green}0A`,border:`1px solid ${T.green}18`}}>
                  <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:20,color:T.green}}>3.1%</div>
                  <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t2,marginTop:2}}>Lead → Application rate</div>
                </div>
                <div style={{padding:'12px 14px',borderRadius:10,background:`${T.gold}0A`,border:`1px solid ${T.gold}18`}}>
                  <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:20,color:T.gold}}>31%</div>
                  <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:11,color:T.t2,marginTop:2}}>Lead purchase rate</div>
                </div>
              </div>
            </div>

            {/* Conversion over time */}
            <div style={{...card,padding:'24px'}}>
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:T.t1,margin:'0 0 4px'}}>Conversion Trend</h3>
              <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2,marginBottom:20}}>Lead → Purchase conversion monthly</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyRevenue} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="glConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.cyan} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={T.cyan} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:T.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
                  <Line type="monotone" dataKey="revenue" stroke={T.cyan} strokeWidth={2.5} dot={{r:4,fill:T.cyan,stroke:T.card,strokeWidth:2}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{marginTop:16}}>
                {[
                  {label:'Avg. Lead Value',value:'₹1,170',color:T.green},
                  {label:'Avg. Time to Convert',value:'2.4 days',color:T.blue},
                  {label:'Top Converting City',value:'Bengaluru',color:T.gold},
                ].map(s=>(
                  <div key={s.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,color:T.t2}}>{s.label}</span>
                    <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,color:s.color}}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
