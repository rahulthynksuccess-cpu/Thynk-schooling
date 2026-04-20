'use client'
export const dynamic = 'force-dynamic'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useState, useEffect, useRef } from 'react'
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import toast from 'react-hot-toast'

// ─── Theme ─────────────────────────────────────────────────────────────────
function getCSSVar(n:string,fb:string):string{
  if(typeof window==='undefined')return fb
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||fb
}
function useTheme(){
  const [c,setC]=useState({cardBg:'#FFFFFF',pageBg:'#F7F8FC',border:'rgba(0,0,0,0.07)',t1:'#111827',t2:'#6B7280',t3:'#9CA3AF',ff:"-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif"})
  useEffect(()=>{
    const read=()=>setC({
      cardBg:getCSSVar('--admin-card-bg','#FFFFFF'),pageBg:getCSSVar('--admin-bg','#F7F8FC'),
      border:getCSSVar('--admin-border','rgba(0,0,0,0.07)'),t1:getCSSVar('--admin-text','#111827'),
      t2:getCSSVar('--admin-text-muted','#6B7280'),t3:getCSSVar('--admin-text-faint','#9CA3AF'),
      ff:getCSSVar('--admin-font',"-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif"),
    })
    read()
    window.addEventListener('storage',read)
    window.addEventListener('themechange',read)
    return()=>{window.removeEventListener('storage',read);window.removeEventListener('themechange',read)}
  },[])
  return c
}

// ─── Palette ───────────────────────────────────────────────────────────────
const P={
  amber:'#E5A50A',blue:'#2563EB',teal:'#0D9488',violet:'#7C3AED',
  green:'#059669',rose:'#DC2626',sky:'#0284C7',orange:'#D97706',
}
const BOARD_COLORS=[P.blue,P.green,P.amber,P.violet,'#9CA3AF']
const CITY_COLORS=[P.blue,'#1D4ED8',P.teal,'#0F766E',P.violet,'#6D28D9']

// ─── Ranges ────────────────────────────────────────────────────────────────
const RANGES=[
  {key:'7d',label:'7 Days',days:7},
  {key:'15d',label:'15 Days',days:15},
  {key:'30d',label:'30 Days',days:30},
  {key:'3m',label:'3 Months',days:90},
  {key:'6m',label:'6 Months',days:180},
  {key:'1y',label:'1 Year',days:365},
]

// ─── Export helpers ─────────────────────────────────────────────────────────
async function exportXLSX(data:any,range:string){
  const XLSX=await import('xlsx')
  const wb=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet((data.dailySeries||[]).map((r:any)=>({Date:r.label,Leads:r.leads,Users:r.users,Revenue:r.revenue}))),'Daily Activity')
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet((data.topCities||[]).map((r:any)=>({City:r.city,Leads:r.leads,Schools:r.schools}))),'Cities')
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet((data.boardDist||[]).map((r:any)=>({Board:r.name,Count:r.count,Pct:r.value+'%'}))),'Boards')
  XLSX.writeFile(wb,`analytics-${range}-${new Date().toISOString().slice(0,10)}.xlsx`)
}
async function exportPDF(data:any,range:string){
  const {jsPDF}=await import('jspdf')
  const autoTable=(await import('jspdf-autotable')).default
  const doc=new jsPDF({orientation:'landscape'})
  doc.setFontSize(14);doc.text('Analytics Report',14,16)
  doc.setFontSize(9);doc.setTextColor(120)
  doc.text(`Period: ${RANGES.find(r=>r.key===range)?.label}  |  Exported ${new Date().toLocaleDateString('en-IN')}`,14,22)
  autoTable(doc,{
    startY:28,head:[['Date','Leads','Users','Revenue (₹)']],
    body:(data.dailySeries||[]).map((r:any)=>[r.label,r.leads,r.users,Number(r.revenue).toLocaleString('en-IN')]),
    styles:{fontSize:8,cellPadding:3},
    headStyles:{fillColor:[17,17,17],textColor:255,fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,249,250]},
  })
  doc.save(`analytics-${range}-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function ChartTip({active,payload,label,T}:any){
  if(!active||!payload?.length)return null
  return(
    <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:8,padding:'9px 13px',fontSize:12,boxShadow:'0 4px 16px rgba(0,0,0,0.1)',fontFamily:T.ff}}>
      {label&&<div style={{color:T.t3,marginBottom:5,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div>}
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:i<payload.length-1?3:0}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:p.color||p.fill}}/>
          <span style={{color:T.t2}}>{p.name}:</span>
          <span style={{color:T.t1,fontWeight:600}}>
            {p.name==='revenue'?`₹${Number(p.value).toLocaleString('en-IN')}`:Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function KPICard({label,value,delta,deltaDir,color,icon,T}:any){
  const DI=deltaDir==='up'?TrendingUp:deltaDir==='down'?TrendingDown:Minus
  const dc=deltaDir==='up'?P.green:deltaDir==='down'?P.rose:T.t3
  return(
    <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},${color}00)`}}/>
      <div style={{fontSize:11,fontWeight:700,color:T.t3,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,fontFamily:T.ff}}>{label}</div>
      <div style={{fontSize:26,fontWeight:800,color:T.t1,letterSpacing:'-0.5px',fontFamily:T.ff}}>{value}</div>
      {delta&&(
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
          <DI style={{width:12,height:12,color:dc}}/>
          <span style={{fontSize:11,color:dc,fontWeight:600,fontFamily:T.ff}}>{delta}</span>
        </div>
      )}
    </div>
  )
}

function SectionCard({title,sub,children,T,action}:any){
  return(
    <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:'20px 22px'}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h3 style={{fontFamily:T.ff,fontWeight:700,fontSize:14,color:T.t1,margin:0}}>{title}</h3>
          {sub&&<p style={{fontFamily:T.ff,fontSize:12,color:T.t2,margin:'3px 0 0'}}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function AnalyticsPage(){
  const T=useTheme()
  const [range,setRange]=useState('30d')
  const axisTick={fill:T.t3,fontSize:11,fontFamily:T.ff}

  const {data,isLoading}=useQuery({
    queryKey:['admin-analytics',range],
    queryFn:async()=>{
      const res=await fetch(`/api/admin/analytics?range=${range}`,{cache:'no-store'})
      return res.json()
    },
    staleTime:3*60_000,
    refetchOnWindowFocus:false,
    placeholderData:(prev:any)=>prev,
  })

  // Derived KPIs with period-vs-prior comparison
  const ds=data?.dailySeries||[]
  const totalLeads=ds.reduce((s:number,r:any)=>s+Number(r.leads||0),0)
  const totalUsers=ds.reduce((s:number,r:any)=>s+Number(r.users||0),0)
  const totalRev=ds.reduce((s:number,r:any)=>s+Number(r.revenue||0),0)
  const totalSchools=ds.reduce((s:number,r:any)=>s+Number(r.schools||0),0)

  const Skel=({h=120}:any)=>(
    <div style={{height:h,borderRadius:8,background:T.border,animation:'tskel 1.4s ease-in-out infinite'}}/>
  )

  const tipWithTheme=(props:any)=><ChartTip {...props} T={T}/>

  return(
    <AdminLayout pageClass="admin-page-analytics" title="Analytics" subtitle="Deep-dive platform metrics with time range comparison">
      <style>{`@keyframes tskel{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>

      {/* Range selector + export */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:3,background:T.border.replace('0.07','0.04'),borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
          {RANGES.map(r=>(
            <button key={r.key} onClick={()=>setRange(r.key)}
              style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:T.ff,fontSize:12,fontWeight:range===r.key?700:500,background:range===r.key?P.amber:'transparent',color:range===r.key?'#fff':T.t2,transition:'all 0.15s'}}>
              {r.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>exportPDF(data,range).catch(()=>toast.error('PDF export failed'))}
            style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:`1px solid ${T.border}`,background:'transparent',color:T.t2,fontSize:12,fontFamily:T.ff,cursor:'pointer'}}>
            <Download style={{width:13,height:13}}/>PDF
          </button>
          <button onClick={()=>exportXLSX(data,range).catch(()=>toast.error('XLSX export failed'))}
            style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'none',background:P.green,color:'#fff',fontSize:12,fontFamily:T.ff,cursor:'pointer',fontWeight:600}}>
            <FileSpreadsheet style={{width:13,height:13}}/>Export XLSX
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <KPICard label="New Leads" value={isLoading?'…':totalLeads.toLocaleString('en-IN')} color={P.green} T={T}
          delta={data?.priorPeriod?.leads?`vs ${Number(data.priorPeriod.leads).toLocaleString()} prior`:''}
          deltaDir={data?.priorPeriod?.leads&&totalLeads>data.priorPeriod.leads?'up':data?.priorPeriod?.leads&&totalLeads<data.priorPeriod.leads?'down':'flat'}/>
        <KPICard label="New Users" value={isLoading?'…':totalUsers.toLocaleString('en-IN')} color={P.blue} T={T}
          delta={data?.priorPeriod?.users?`vs ${Number(data.priorPeriod.users).toLocaleString()} prior`:''}
          deltaDir={data?.priorPeriod?.users&&totalUsers>data.priorPeriod.users?'up':data?.priorPeriod?.users&&totalUsers<data.priorPeriod.users?'down':'flat'}/>
        <KPICard label="Revenue" value={isLoading?'…':`₹${totalRev.toLocaleString('en-IN')}`} color={P.amber} T={T}
          delta={data?.priorPeriod?.revenue?`vs ₹${Number(data.priorPeriod.revenue).toLocaleString()} prior`:''}
          deltaDir={data?.priorPeriod?.revenue&&totalRev>data.priorPeriod.revenue?'up':data?.priorPeriod?.revenue&&totalRev<data.priorPeriod.revenue?'down':'flat'}/>
        <KPICard label="New Schools" value={isLoading?'…':totalSchools.toLocaleString('en-IN')} color={P.violet} T={T}/>
      </div>

      {/* Main daily chart */}
      <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:'20px 22px',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <h3 style={{fontFamily:T.ff,fontWeight:700,fontSize:15,color:T.t1,margin:0}}>Daily Activity Trend</h3>
            <p style={{fontFamily:T.ff,fontSize:12,color:T.t2,margin:'3px 0 0'}}>{RANGES.find(r=>r.key===range)?.label} · leads, users and revenue</p>
          </div>
        </div>
        {isLoading?<Skel h={260}/>:(
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={ds} margin={{top:5,right:20,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="glLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.green} stopOpacity={0.25}/><stop offset="100%" stopColor={P.green} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="glUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.blue} stopOpacity={0.2}/><stop offset="100%" stopColor={P.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}
                interval={ds.length>20?Math.floor(ds.length/8):'preserveStartEnd'}/>
              <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}
                tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={tipWithTheme} cursor={{stroke:T.border,strokeWidth:1}}/>
              <Legend wrapperStyle={{fontFamily:T.ff,fontSize:12,color:T.t2,paddingTop:10}}/>
              <Area yAxisId="l" type="monotone" dataKey="leads" name="leads" stroke={P.green} strokeWidth={2} fill="url(#glLeads)" dot={false} activeDot={{r:4}}/>
              <Area yAxisId="l" type="monotone" dataKey="users" name="users" stroke={P.blue} strokeWidth={2} fill="url(#glUsers)" dot={false} activeDot={{r:4}}/>
              <Bar yAxisId="r" dataKey="revenue" name="revenue" fill={`${P.amber}60`} radius={[2,2,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 2: Schools trend + Signups */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        <SectionCard title="School Registrations" sub={`${RANGES.find(r=>r.key===range)?.label} growth`} T={T}>
          {isLoading?<Skel/>:(
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ds} margin={{top:5,right:5,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="glSchools" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={P.violet} stopOpacity={0.3}/><stop offset="100%" stopColor={P.violet} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor(ds.length/5)||'preserveStartEnd'}/>
                <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                <Tooltip content={tipWithTheme} cursor={{stroke:T.border,strokeWidth:1}}/>
                <Area type="monotone" dataKey="schools" name="schools" stroke={P.violet} strokeWidth={2.5} fill="url(#glSchools)" dot={false} activeDot={{r:4}}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Parent Signups" sub="Daily new parent registrations" T={T}>
          {isLoading?<Skel/>:(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ds} margin={{top:5,right:5,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor(ds.length/5)||'preserveStartEnd'}/>
                <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                <Tooltip content={tipWithTheme} cursor={{fill:T.border}}/>
                <Bar dataKey="users" name="users" radius={[3,3,0,0]}>
                  {ds.map((_:any,i:number)=><Cell key={i} fill={`${P.blue}${i%2===0?'CC':'77'}`}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Row 3: Board dist + Top cities + Funnel */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.3fr 1.1fr',gap:14,marginBottom:16}}>

        {/* Board pie */}
        <SectionCard title="Schools by Board" sub="Curriculum breakdown" T={T}>
          {isLoading?<Skel h={200}/>:(
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.boardDist||[]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count">
                    {(data?.boardDist||[]).map((_:any,i:number)=><Cell key={i} fill={BOARD_COLORS[i%BOARD_COLORS.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={(v:any,n:any,p:any)=>[`${v} schools (${p.payload.value}%)`]} contentStyle={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontFamily:T.ff}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
                {(data?.boardDist||[]).map((b:any,i:number)=>(
                  <div key={b.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:BOARD_COLORS[i%BOARD_COLORS.length]}}/>
                      <span style={{fontFamily:T.ff,fontSize:12,color:T.t2}}>{b.name}</span>
                    </div>
                    <span style={{fontFamily:T.ff,fontSize:12,fontWeight:600,color:T.t1}}>{b.count} <span style={{color:T.t3,fontWeight:400}}>({b.value}%)</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Top cities */}
        <SectionCard title="Top Cities" sub="Leads & schools by city" T={T}>
          {isLoading?<Skel h={220}/>:(
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data?.topCities||[]).slice(0,6)} layout="vertical" margin={{top:5,right:20,left:5,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false}/>
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="city" tick={{...axisTick,fontSize:11}} axisLine={false} tickLine={false} width={72}/>
                <Tooltip content={tipWithTheme} cursor={{fill:T.border}}/>
                <Legend wrapperStyle={{fontFamily:T.ff,fontSize:11,color:T.t2}}/>
                <Bar dataKey="leads" name="leads" radius={[0,4,4,0]}>
                  {(data?.topCities||[]).map((_:any,i:number)=><Cell key={i} fill={CITY_COLORS[i%CITY_COLORS.length]}/>)}
                </Bar>
                <Bar dataKey="schools" name="schools" fill={P.amber} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Conversion funnel */}
        <SectionCard title="Conversion Funnel" sub="Platform journey" T={T}>
          {isLoading?<Skel h={220}/>:!data?.funnel?(
            <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3,fontSize:12,fontFamily:T.ff}}>No data</div>
          ):(()=>{
            const steps=[
              {name:'Registered Parents',value:data.funnel.registeredParents||0,color:P.blue},
              {name:'Submitted Leads',value:data.funnel.leads||0,color:P.green},
              {name:'Purchased Leads',value:data.funnel.purchased||0,color:P.amber},
              {name:'Applications',value:data.funnel.applications||0,color:P.violet},
            ]
            const max=steps[0].value||1
            return(
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
                {steps.map((s,i)=>{
                  const w=Math.round(s.value/max*100)
                  const convRate=i>0&&steps[i-1].value>0?Math.round(s.value/steps[i-1].value*100):null
                  return(
                    <div key={s.name}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:s.color}}/>
                          <span style={{fontFamily:T.ff,fontSize:11,color:T.t2}}>{s.name}</span>
                          {convRate!==null&&<span style={{fontFamily:T.ff,fontSize:10,color:s.color,background:`${s.color}15`,padding:'1px 5px',borderRadius:8,fontWeight:700}}>{convRate}%</span>}
                        </div>
                        <span style={{fontFamily:T.ff,fontSize:13,fontWeight:700,color:T.t1}}>{s.value.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{height:6,borderRadius:4,background:`${T.border}`,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:4,width:`${w}%`,background:`linear-gradient(90deg,${s.color},${s.color}88)`,transition:'width .6s ease'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </SectionCard>
      </div>

      {/* Row 4: Revenue line + School type radar */}
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14,marginBottom:16}}>

        <SectionCard title="Revenue Over Time" sub={`${RANGES.find(r=>r.key===range)?.label} daily revenue (₹)`} T={T}>
          {isLoading?<Skel h={200}/>:(
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ds} margin={{top:5,right:5,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="glRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={P.amber} stopOpacity={0.3}/><stop offset="100%" stopColor={P.amber} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.floor(ds.length/6)||'preserveStartEnd'}/>
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={tipWithTheme} cursor={{stroke:T.border,strokeWidth:1}}/>
                <Area type="monotone" dataKey="revenue" name="revenue" stroke={P.amber} strokeWidth={2.5} fill="url(#glRev)" dot={false} activeDot={{r:5,fill:P.amber,stroke:T.cardBg,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="School Types" sub="By school category" T={T}>
          {isLoading?<Skel h={200}/>:(data?.schoolStatsByType||[]).length===0?(
            <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3,fontSize:12,fontFamily:T.ff}}>No type data</div>
          ):(
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data?.schoolStatsByType||[]} cx="50%" cy="50%" outerRadius={62} paddingAngle={2} dataKey="value">
                    {(data?.schoolStatsByType||[]).map((_:any,i:number)=><Cell key={i} fill={[P.blue,P.green,P.amber,P.violet,P.teal,P.rose][i%6]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontFamily:T.ff}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px 14px'}}>
                {(data?.schoolStatsByType||[]).map((s:any,i:number)=>(
                  <div key={s.name} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:7,height:7,borderRadius:2,background:[P.blue,P.green,P.amber,P.violet,P.teal,P.rose][i%6]}}/>
                    <span style={{fontFamily:T.ff,fontSize:11,color:T.t2}}>{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Summary table */}
      <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:'16px 22px',borderBottom:`1px solid ${T.border}`}}>
          <h3 style={{fontFamily:T.ff,fontWeight:700,fontSize:14,color:T.t1,margin:0}}>Daily Summary Table</h3>
          <p style={{fontFamily:T.ff,fontSize:12,color:T.t2,margin:'3px 0 0'}}>Full breakdown for {RANGES.find(r=>r.key===range)?.label}</p>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.ff,fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                {['Date','Leads','Users','Schools','Revenue (₹)'].map(h=>(
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:T.t3}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading?[...Array(5)].map((_,i)=>(
                <tr key={i}><td colSpan={5} style={{padding:'10px 16px'}}><div style={{height:20,borderRadius:4,background:T.border,animation:'tskel 1.4s ease-in-out infinite'}}/></td></tr>
              )):ds.slice().reverse().slice(0,14).map((row:any,i:number)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:'background .1s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=T.border.replace('0.07','0.03')}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <td style={{padding:'10px 16px',color:T.t2,fontWeight:500}}>{row.label}</td>
                  <td style={{padding:'10px 16px',color:P.green,fontWeight:600}}>{Number(row.leads||0).toLocaleString()}</td>
                  <td style={{padding:'10px 16px',color:P.blue,fontWeight:600}}>{Number(row.users||0).toLocaleString()}</td>
                  <td style={{padding:'10px 16px',color:P.violet,fontWeight:600}}>{Number(row.schools||0).toLocaleString()}</td>
                  <td style={{padding:'10px 16px',color:P.amber,fontWeight:600}}>₹{Number(row.revenue||0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
