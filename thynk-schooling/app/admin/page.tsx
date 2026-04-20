'use client'
export const dynamic = 'force-dynamic'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { prefetchCommonPages } from '@/lib/adminQuery'
import { useState, useMemo } from 'react'
import {
  School, Users, TrendingUp, DollarSign, FileCheck, Star,
  ArrowUpRight, ArrowUp, ArrowDown, Minus, Clock,
  Activity, Target, Zap, CheckCircle2, RefreshCw,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const T = {
  bg:'var(--admin-bg,#04080F)',card:'var(--admin-card-bg,#0C1422)',
  border:'var(--admin-border,rgba(255,255,255,0.07))',
  t1:'var(--admin-text,rgba(255,255,255,0.95))',
  t2:'var(--admin-text-muted,rgba(255,255,255,0.6))',
  t3:'var(--admin-text-faint,rgba(255,255,255,0.35))',
  gold:'#F5A623',blue:'#4F8EF7',green:'#00E5A0',
  purple:'#9B72FF',red:'#FF5757',teal:'#2DD4BF',orange:'#FF7A2E',
}
const card:React.CSSProperties={background:T.card,border:`1px solid ${T.border}`,borderRadius:16}
const ff='Plus Jakarta Sans,Inter,system-ui,sans-serif'
const axisTick={fill:T.t3,fontSize:11,fontFamily:ff}

const RANGES=[{key:'1d',label:'Today'},{key:'7d',label:'7 Days'},{key:'15d',label:'15 Days'},{key:'30d',label:'30 Days'},{key:'3m',label:'3 Mon'},{key:'6m',label:'6 Mon'},{key:'1y',label:'1 Year'}]
const PERIOD_MAP:Record<string,string>={'1d':'today','7d':'week','15d':'month','30d':'month','3m':'month','6m':'year','1y':'year'}
const BOARD_COLORS=['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E','#34D399']
const STATUS_COLORS:Record<string,string>={pending:'#FBBF24',shortlisted:'#00E5A0',admitted:'#4F8EF7',rejected:'#FF5757',submitted:'#A78BFA'}
const METRIC_COLORS:Record<string,string>={leads:'#00E5A0',revenue:'#F5A623',users:'#4F8EF7',schools:'#9B72FF'}

function ChartTip({active,payload,label}:any){
  if(!active||!payload?.length)return null
  return(
    <div style={{background:'#111927',border:`1px solid ${T.border}`,borderRadius:10,padding:'10px 14px',fontSize:12,fontFamily:ff,boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
      {label&&<div style={{color:T.t2,marginBottom:6,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>}
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:i<payload.length-1?4:0}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color||p.fill}}/>
          <span style={{color:T.t2,textTransform:'capitalize'}}>{p.name}:</span>
          <span style={{color:T.t1,fontWeight:700}}>
            {p.name==='revenue'?`₹${Number(p.value).toLocaleString('en-IN')}`:Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

const Skel=({h=40,r=8}:any)=>(
  <div style={{height:h,borderRadius:r,background:'rgba(255,255,255,0.04)',animation:'tskel 1.4s ease-in-out infinite'}}/>
)

function KPICard({icon:Icon,label,value,sub,subUp,color,href,loading}:any){
  const TI=subUp===true?ArrowUp:subUp===false?ArrowDown:Minus
  const tc=subUp===true?T.green:subUp===false?T.red:T.t3
  return(
    <Link href={href} style={{...card,display:'block',textDecoration:'none',padding:'20px 22px',position:'relative',overflow:'hidden',transition:'transform 0.18s,box-shadow 0.18s'}}
      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-3px)';el.style.boxShadow=`0 14px 40px ${color}1A`}}
      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.boxShadow='none'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},${color}00)`}}/>
      <div style={{position:'absolute',top:-40,right:-20,width:110,height:110,borderRadius:'50%',background:`${color}07`,pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${color}18`,border:`1px solid ${color}25`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon style={{width:19,height:19,color}}/>
        </div>
        <ArrowUpRight style={{width:13,height:13,color:T.t3}}/>
      </div>
      {loading?<Skel h={36} r={6}/>:<div style={{fontFamily:ff,fontWeight:800,fontSize:28,color:T.t1,lineHeight:1,letterSpacing:'-0.5px'}}>{value}</div>}
      <div style={{fontFamily:ff,fontSize:12,color:T.t2,marginTop:5,fontWeight:500}}>{label}</div>
      {sub&&<div style={{marginTop:10,display:'flex',alignItems:'center',gap:4}}><TI style={{width:11,height:11,color:tc}}/><span style={{fontSize:11,color:tc,fontWeight:700,fontFamily:ff}}>{sub}</span></div>}
    </Link>
  )
}

function RangePills({value,onChange}:{value:string;onChange:(r:string)=>void}){
  return(
    <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
      {RANGES.map(r=>(
        <button key={r.key} onClick={()=>onChange(r.key)}
          style={{padding:'5px 13px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:ff,fontSize:11,fontWeight:value===r.key?700:500,background:value===r.key?T.gold:'transparent',color:value===r.key?'#000':T.t2,transition:'all 0.15s',whiteSpace:'nowrap'}}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

export default function AdminDashboardPage(){
  const queryClient=useQueryClient()
  const [range,setRange]=useState('30d')
  const [chartMetric,setChartMetric]=useState<'leads'|'revenue'|'users'|'schools'>('leads')

  const {data,isLoading,dataUpdatedAt,refetch,isFetching}=useQuery({
    queryKey:['admin-overview',range],
    queryFn:async()=>{
      const res=await fetch(`/api/admin/overview?range=${range}`,{cache:'no-store'})
      const json=await res.json()
      prefetchCommonPages(queryClient)
      return json
    },
    staleTime:3*60_000,
    refetchOnWindowFocus:false,
    placeholderData:(prev:any)=>prev,
  })

  const periodKey=PERIOD_MAP[range]||'month'
  const ps=data?.periodStats
  const metricColor=METRIC_COLORS[chartMetric]
  const timeSeries:any[]=data?.timeSeries||[]

  const kpis=useMemo(()=>[
    {icon:School,color:T.gold,href:'/admin/schools',label:'Schools',
      value:isLoading?'—':(ps?.schools?.[periodKey]??data?.totalSchools??0).toLocaleString('en-IN'),
      sub:data?.pendingVerification?`${data.pendingVerification} pending`:undefined,subUp:undefined},
    {icon:Users,color:T.blue,href:'/admin/users',label:'Users',
      value:isLoading?'—':(ps?.users?.[periodKey]??data?.totalUsers??0).toLocaleString('en-IN'),
      sub:data?.newUsersToday?`+${data.newUsersToday} today`:undefined,subUp:true},
    {icon:TrendingUp,color:T.green,href:'/admin/leads',label:'Leads',
      value:isLoading?'—':(ps?.leads?.[periodKey]??data?.totalLeads??0).toLocaleString('en-IN'),
      sub:data?.leadsToday?`+${data.leadsToday} today`:undefined,subUp:true},
    {icon:DollarSign,color:'#F59E0B',href:'/admin/payments',label:'Revenue',
      value:isLoading?'—':`₹${(ps?.revenue?.[periodKey]??Math.round((data?.totalRevenue||0)/100)).toLocaleString('en-IN')}`,
      sub:data?.revBreakdown?.length?`${data.revBreakdown.length} streams`:undefined,subUp:true},
    {icon:FileCheck,color:T.purple,href:'/admin/applications',label:'Applications',
      value:isLoading?'—':(data?.totalApps??0).toLocaleString('en-IN'),
      sub:data?.pendingApps?`${data.pendingApps} pending`:undefined,subUp:undefined},
    {icon:Star,color:T.orange,href:'/admin/reviews',label:'Reviews',
      value:isLoading?'—':(data?.totalReviews??0).toLocaleString('en-IN'),
      sub:data?.pendingReviews?`${data.pendingReviews} to moderate`:undefined,subUp:undefined},
  ],[data,isLoading,periodKey,ps])

  const funnelSteps=data?.funnel?[
    {name:'Parents',value:data.funnel.parents,color:T.blue},
    {name:'Leads',value:data.funnel.leads,color:T.green},
    {name:'Purchased',value:data.funnel.purchased,color:T.gold},
    {name:'Applied',value:data.funnel.applications,color:T.purple},
  ]:[]

  const lastUpdated=dataUpdatedAt?new Date(dataUpdatedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):''

  return(
    <AdminLayout pageClass="admin-page-overview" title="Dashboard" subtitle="Platform analytics — live data">
      <style>{`
        @keyframes tskel{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ds{animation:fadeUp 0.35s ease both}
        .ds1{animation-delay:0.05s}.ds2{animation-delay:0.1s}.ds3{animation-delay:0.15s}.ds4{animation-delay:0.2s}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Top bar */}
      <div className="ds" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <RangePills value={range} onChange={r=>setRange(r)}/>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {lastUpdated&&<span style={{fontFamily:ff,fontSize:11,color:T.t3}}><Clock style={{width:11,height:11,display:'inline',marginRight:4,verticalAlign:'middle'}}/>Updated {lastUpdated}</span>}
          <button onClick={()=>refetch()} disabled={isFetching}
            style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:8,border:`1px solid ${T.border}`,background:'transparent',color:T.t2,fontSize:11,fontFamily:ff,cursor:'pointer',opacity:isFetching?0.5:1}}>
            <RefreshCw style={{width:11,height:11,animation:isFetching?'spin 1s linear infinite':'none'}}/>Refresh
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="ds ds1" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:22}}>
        {kpis.map(k=><KPICard key={k.label} {...k} loading={isLoading}/>)}
      </div>

      {/* Main time-series chart */}
      <div className="ds ds2" style={{...card,padding:'22px 24px',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
          <div>
            <h3 style={{fontFamily:ff,fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Platform Activity</h3>
            <p style={{fontFamily:ff,fontSize:12,color:T.t2,margin:'3px 0 0'}}>{RANGES.find(r=>r.key===range)?.label} · tap metric to switch view</p>
          </div>
          <div style={{display:'flex',gap:6}}>
            {(['leads','revenue','users','schools'] as const).map(m=>(
              <button key={m} onClick={()=>setChartMetric(m)}
                style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${chartMetric===m?METRIC_COLORS[m]:T.border}`,background:chartMetric===m?`${METRIC_COLORS[m]}18`:'transparent',color:chartMetric===m?METRIC_COLORS[m]:T.t3,fontSize:11,fontWeight:700,fontFamily:ff,cursor:'pointer',textTransform:'capitalize',transition:'all .15s'}}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {isLoading?<Skel h={240}/>:timeSeries.length===0?(
          <div style={{height:240,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3,fontSize:13,fontFamily:ff}}>No data for this range</div>
        ):(
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeSeries} margin={{top:5,right:5,left:-15,bottom:0}}>
              <defs>
                <linearGradient id={`grad_${chartMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricColor} stopOpacity={0.35}/>
                  <stop offset="100%" stopColor={metricColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}
                interval={timeSeries.length>20?Math.floor(timeSeries.length/8):'preserveStartEnd'}/>
              <YAxis tick={axisTick} axisLine={false} tickLine={false}
                tickFormatter={v=>chartMetric==='revenue'?`₹${(v/1000).toFixed(0)}k`:String(v)}/>
              <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
              <Area type="monotone" dataKey={chartMetric} name={chartMetric}
                stroke={metricColor} strokeWidth={2.5} fill={`url(#grad_${chartMetric})`}
                dot={false} activeDot={{r:5,fill:metricColor,stroke:T.card,strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 2: Revenue donut + App status + Funnel */}
      <div className="ds ds3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:16}}>

        {/* Revenue breakdown */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Revenue Streams</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 14px'}}>All-time by source</p>
          {isLoading?<Skel h={180}/>:(
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data?.revBreakdown||[]} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="total">
                    {(data?.revBreakdown||[]).map((e:any,i:number)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>`₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{background:'#111927',border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontFamily:ff}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:2}}>
                {(data?.revBreakdown||[]).map((r:any)=>(
                  <div key={r.source} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:r.color,flexShrink:0}}/>
                      <span style={{fontFamily:ff,fontSize:12,color:T.t2}}>{r.source}</span>
                    </div>
                    <span style={{fontFamily:ff,fontSize:12,fontWeight:700,color:T.t1}}>₹{Number(r.total).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Application status */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Application Status</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 14px'}}>Current pipeline</p>
          {isLoading?<Skel h={180}/>:(
            <>
              <ResponsiveContainer width="100%" height={155}>
                <BarChart data={data?.appStatus||[]} margin={{top:5,right:5,left:-25,bottom:0}} layout="vertical">
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false} width={70}/>
                  <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                  <Bar dataKey="value" name="applications" radius={[0,5,5,0]}>
                    {(data?.appStatus||[]).map((e:any,i:number)=><Cell key={i} fill={e.fill||STATUS_COLORS[e.name]||T.purple}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',marginTop:4}}>
                {(data?.appStatus||[]).map((s:any)=>(
                  <div key={s.name} style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:7,height:7,borderRadius:2,background:s.fill||STATUS_COLORS[s.name]||T.purple}}/>
                    <span style={{fontSize:10,fontFamily:ff,color:T.t3,textTransform:'capitalize'}}>{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Conversion funnel */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Conversion Funnel</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 14px'}}>Parent → lead → purchase</p>
          {isLoading?<Skel h={180}/>:funnelSteps.length===0?(
            <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3,fontSize:12,fontFamily:ff}}>No data</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
              {funnelSteps.map((step,i)=>{
                const pct=funnelSteps[0].value>0?Math.round(step.value/funnelSteps[0].value*100):0
                const convRate=i>0&&funnelSteps[i-1].value>0?Math.round(step.value/funnelSteps[i-1].value*100):null
                return(
                  <div key={step.name}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:step.color}}/>
                        <span style={{fontFamily:ff,fontSize:12,color:T.t2}}>{step.name}</span>
                        {convRate!==null&&<span style={{fontFamily:ff,fontSize:10,color:step.color,background:`${step.color}15`,padding:'1px 6px',borderRadius:10,fontWeight:700}}>{convRate}%</span>}
                      </div>
                      <span style={{fontFamily:ff,fontSize:13,fontWeight:700,color:T.t1}}>{step.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{height:5,borderRadius:4,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:4,width:`${pct}%`,background:`linear-gradient(90deg,${step.color},${step.color}88)`,transition:'width 0.6s ease'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Board dist + Top cities + Leads vs Revenue */}
      <div className="ds ds4" style={{display:'grid',gridTemplateColumns:'1fr 1.4fr 1.2fr',gap:14,marginBottom:16}}>

        {/* Board */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Schools by Board</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 10px'}}>Curriculum split</p>
          {isLoading?<Skel h={160}/>:(
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={data?.schoolsByBoard||[]} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={2} dataKey="value">
                    {(data?.schoolsByBoard||[]).map((e:any,i:number)=><Cell key={i} fill={e.color||BOARD_COLORS[i%BOARD_COLORS.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>[`${v}%`]} contentStyle={{background:'#111927',border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontFamily:ff}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',marginTop:6}}>
                {(data?.schoolsByBoard||[]).map((b:any,i:number)=>(
                  <div key={b.name} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:b.color||BOARD_COLORS[i%BOARD_COLORS.length]}}/>
                    <span style={{fontSize:11,fontFamily:ff,color:T.t2}}>{b.name} <span style={{color:T.t3}}>({b.value}%)</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top cities */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Top Cities by Leads</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 10px'}}>Geographic demand</p>
          {isLoading?<Skel h={185}/>:(
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={(data?.topCities||[]).slice(0,6)} margin={{top:5,right:5,left:-20,bottom:22}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="city" tick={{...axisTick,fontSize:10}} axisLine={false} tickLine={false} angle={-30} textAnchor="end"/>
                <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Bar dataKey="leads" name="leads" fill={T.green} radius={[4,4,0,0]}/>
                <Bar dataKey="schools" name="schools" fill={T.gold} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads vs Revenue bars */}
        <div style={{...card,padding:'20px 22px'}}>
          <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:'0 0 3px'}}>Leads vs Revenue</h3>
          <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'0 0 10px'}}>{RANGES.find(r=>r.key===range)?.label} comparison</p>
          {isLoading?<Skel h={185}/>:timeSeries.length===0?(
            <div style={{height:185,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3,fontSize:12,fontFamily:ff}}>No data</div>
          ):(
            <ResponsiveContainer width="100%" height={185}>
              <ComposedChart data={timeSeries.slice(-12)} margin={{top:5,right:5,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{...axisTick,fontSize:9}} axisLine={false} tickLine={false}
                  interval={timeSeries.length>12?2:'preserveStartEnd'}/>
                <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}
                  tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Bar yAxisId="l" dataKey="leads" name="leads" fill={`${T.green}80`} radius={[3,3,0,0]}/>
                <Bar yAxisId="r" dataKey="revenue" name="revenue" fill={`${T.gold}80`} radius={[3,3,0,0]}/>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 4: Recent leads + Recent users + Pending schools */}
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',gap:14,marginBottom:16}}>

        {/* Recent leads */}
        <div style={{...card,padding:'20px 0',overflow:'hidden'}}>
          <div style={{padding:'0 22px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:0}}>Recent Leads</h3>
              <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'2px 0 0'}}>Latest enquiries</p>
            </div>
            <Link href="/admin/leads" style={{fontFamily:ff,fontSize:11,color:T.gold,textDecoration:'none',fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
              View all<ArrowUpRight style={{width:11,height:11}}/>
            </Link>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`}}>
            {isLoading?(
              <div style={{padding:'12px 22px',display:'flex',flexDirection:'column',gap:10}}>
                {[...Array(5)].map((_,i)=><Skel key={i} h={36}/>)}
              </div>
            ):(data?.recentLeads||[]).slice(0,6).map((lead:any,i:number)=>(
              <div key={lead.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 22px',borderBottom:i<5?`1px solid ${T.border}`:'none'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                <div style={{width:32,height:32,borderRadius:8,background:`${T.green}15`,border:`1px solid ${T.green}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Activity style={{width:13,height:13,color:T.green}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:ff,fontSize:12,fontWeight:600,color:T.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lead.parentName}</div>
                  <div style={{fontFamily:ff,fontSize:11,color:T.t3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lead.schoolName} · {lead.classApplied}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <span style={{padding:'2px 7px',borderRadius:6,fontSize:10,fontWeight:700,fontFamily:ff,background:lead.isPurchased?`${T.green}18`:'rgba(255,255,255,0.05)',color:lead.isPurchased?T.green:T.t3,border:`1px solid ${lead.isPurchased?T.green+'30':'rgba(255,255,255,0.08)'}`}}>
                    {lead.isPurchased?'Unlocked':'New'}
                  </span>
                  <span style={{fontFamily:ff,fontSize:10,color:T.t3}}>
                    {new Date(lead.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div style={{...card,padding:'20px 0',overflow:'hidden'}}>
          <div style={{padding:'0 18px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:0}}>New Users</h3>
              <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'2px 0 0'}}>Recently registered</p>
            </div>
            <Link href="/admin/users" style={{fontFamily:ff,fontSize:11,color:T.gold,textDecoration:'none',fontWeight:600}}>All<ArrowUpRight style={{width:11,height:11}}/></Link>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`}}>
            {isLoading?(
              <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:10}}>
                {[...Array(5)].map((_,i)=><Skel key={i} h={34}/>)}
              </div>
            ):(data?.recentUsers||[]).map((u:any,i:number)=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 18px',borderBottom:i<(data.recentUsers.length-1)?`1px solid ${T.border}`:'none'}}>
                <div style={{width:30,height:30,borderRadius:8,background:u.role==='school_admin'?`${T.gold}15`:`${T.blue}15`,border:`1px solid ${u.role==='school_admin'?T.gold:T.blue}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {u.role==='school_admin'?<School style={{width:12,height:12,color:T.gold}}/>:<Users style={{width:12,height:12,color:T.blue}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:ff,fontSize:12,fontWeight:600,color:T.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.fullName}</div>
                  <div style={{fontFamily:ff,fontSize:10,color:T.t3}}>{u.phone}</div>
                </div>
                <span style={{padding:'2px 6px',borderRadius:5,fontSize:9,fontWeight:700,fontFamily:ff,textTransform:'uppercase',letterSpacing:'0.05em',background:u.role==='school_admin'?`${T.gold}15`:`${T.blue}15`,color:u.role==='school_admin'?T.gold:T.blue}}>
                  {u.role==='school_admin'?'School':'Parent'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending verification */}
        <div style={{...card,padding:'20px 0',overflow:'hidden'}}>
          <div style={{padding:'0 18px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <h3 style={{fontFamily:ff,fontWeight:700,fontSize:14,color:T.t1,margin:0}}>Pending Verify</h3>
              <p style={{fontFamily:ff,fontSize:11,color:T.t2,margin:'2px 0 0'}}>Awaiting approval</p>
            </div>
            <Link href="/admin/schools" style={{fontFamily:ff,fontSize:11,color:T.gold,textDecoration:'none',fontWeight:600}}>All<ArrowUpRight style={{width:11,height:11}}/></Link>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`}}>
            {isLoading?(
              <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:10}}>
                {[...Array(4)].map((_,i)=><Skel key={i} h={34}/>)}
              </div>
            ):(data?.pendingSchools||[]).length===0?(
              <div style={{padding:'30px 18px',textAlign:'center'}}>
                <CheckCircle2 style={{width:28,height:28,color:T.green,margin:'0 auto 8px'}}/>
                <div style={{fontFamily:ff,fontSize:12,color:T.t3}}>All schools verified!</div>
              </div>
            ):(data?.pendingSchools||[]).map((s:any,i:number)=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 18px',borderBottom:i<(data.pendingSchools.length-1)?`1px solid ${T.border}`:'none'}}>
                <div style={{width:30,height:30,borderRadius:8,background:`${T.orange}15`,border:`1px solid ${T.orange}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Zap style={{width:12,height:12,color:T.orange}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:ff,fontSize:12,fontWeight:600,color:T.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontFamily:ff,fontSize:10,color:T.t3}}>{s.city||'City unknown'}</div>
                </div>
                <Link href={`/admin/schools?id=${s.id}`}
                  style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,fontFamily:ff,background:`${T.orange}15`,color:T.orange,textDecoration:'none',border:`1px solid ${T.orange}25`,flexShrink:0}}>
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
        {[
          {href:'/admin/schools',icon:School,label:'Schools',color:T.gold},
          {href:'/admin/leads',icon:TrendingUp,label:'Leads',color:T.green},
          {href:'/admin/applications',icon:FileCheck,label:'Applications',color:T.purple},
          {href:'/admin/payments',icon:DollarSign,label:'Payments',color:'#F59E0B'},
          {href:'/admin/analytics',icon:Target,label:'Analytics',color:T.blue},
          {href:'/admin/users',icon:Users,label:'Users',color:T.teal},
        ].map(({href,icon:Icon,label,color})=>(
          <Link key={href} href={href}
            style={{...card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'14px 8px',textDecoration:'none',gap:7,transition:'all .15s'}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=`${color}0D`;el.style.borderColor=`${color}30`}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background=T.card;el.style.borderColor=T.border}}>
            <Icon style={{width:18,height:18,color}}/>
            <span style={{fontFamily:ff,fontSize:11,fontWeight:600,color:T.t2}}>{label}</span>
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}
