export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

const PAID = `status IN ('paid','captured','success','completed')`

export async function GET(req: Request) {
  try {
    const url   = new URL(req.url)
    const range = url.searchParams.get('range') || '30d'
    const intv  = ({ '1d':'1 day','7d':'7 days','15d':'15 days','30d':'30 days','3m':'3 months','6m':'6 months','1y':'1 year' } as any)[range] || '30 days'

    const [
      users, schools, apps, leads, pendingSchoolsCt,
      newUsersToday, leadsToday, revenue,
      pendingApps, pendingReviews, reviews,
      boardDist, appStatus,
      recentLeadsRows, recentUsersRows, pendingSchoolsRows,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users WHERE role!='super_admin'`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM schools`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM applications`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM leads`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM schools WHERE (is_verified=false OR is_verified IS NULL)`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM users WHERE role!='super_admin' AND created_at>=CURRENT_DATE`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM leads WHERE created_at>=CURRENT_DATE`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COALESCE(SUM(amount_paise),0) AS total FROM (SELECT amount_paise FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT amount_paise FROM subscription_payments WHERE ${PAID} UNION ALL SELECT amount_paise FROM featured_listing_payments WHERE ${PAID}) p`).catch(()=>({rows:[{total:0}]})),
      db.query(`SELECT COUNT(*) FROM applications WHERE status='pending' OR status IS NULL`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM reviews WHERE is_approved=false OR is_approved IS NULL`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT COUNT(*) FROM reviews`).catch(()=>({rows:[{count:0}]})),
      db.query(`SELECT board AS name,COUNT(*) AS value FROM schools WHERE board IS NOT NULL AND board<>'' GROUP BY board ORDER BY value DESC LIMIT 6`).catch(()=>({rows:[]})),
      db.query(`SELECT COALESCE(status,'pending') AS name,COUNT(*) AS value FROM applications GROUP BY status`).catch(()=>({rows:[]})),
      db.query(`SELECT l.id,s.name AS school_name,COALESCE(u.full_name,u.name,l.parent_name) AS parent_name,l.class_applying_for AS class_applied,l.is_purchased,l.created_at FROM leads l LEFT JOIN schools s ON s.id=l.school_id LEFT JOIN users u ON u.id=l.parent_id ORDER BY l.created_at DESC LIMIT 8`).catch(()=>({rows:[]})),
      db.query(`SELECT id,COALESCE(full_name,name) AS full_name,COALESCE(phone,mobile) AS phone,role FROM users WHERE role!='super_admin' ORDER BY created_at DESC LIMIT 6`).catch(()=>({rows:[]})),
      db.query(`SELECT id,name,city FROM schools WHERE (is_verified=false OR is_verified IS NULL) ORDER BY created_at DESC LIMIT 5`).catch(()=>({rows:[]})),
    ])

    // ── Period KPI counters ─────────────────────────────────────────────────
    const [lp,rp,sp,up] = await Promise.all([
      db.query(`SELECT COUNT(*) FILTER(WHERE created_at>=CURRENT_DATE) AS today,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('week',CURRENT_DATE)) AS week,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('month',CURRENT_DATE)) AS month,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('year',CURRENT_DATE)) AS year FROM leads`).catch(()=>({rows:[{today:0,week:0,month:0,year:0}]})),
      db.query(`SELECT COALESCE(SUM(amount_paise) FILTER(WHERE created_at>=CURRENT_DATE),0) AS today,COALESCE(SUM(amount_paise) FILTER(WHERE created_at>=DATE_TRUNC('week',CURRENT_DATE)),0) AS week,COALESCE(SUM(amount_paise) FILTER(WHERE created_at>=DATE_TRUNC('month',CURRENT_DATE)),0) AS month,COALESCE(SUM(amount_paise) FILTER(WHERE created_at>=DATE_TRUNC('year',CURRENT_DATE)),0) AS year FROM(SELECT amount_paise,created_at FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT amount_paise,created_at FROM subscription_payments WHERE ${PAID} UNION ALL SELECT amount_paise,created_at FROM featured_listing_payments WHERE ${PAID}) p`).catch(()=>({rows:[{today:0,week:0,month:0,year:0}]})),
      db.query(`SELECT COUNT(*) FILTER(WHERE created_at>=CURRENT_DATE) AS today,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('week',CURRENT_DATE)) AS week,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('month',CURRENT_DATE)) AS month,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('year',CURRENT_DATE)) AS year FROM schools`).catch(()=>({rows:[{today:0,week:0,month:0,year:0}]})),
      db.query(`SELECT COUNT(*) FILTER(WHERE created_at>=CURRENT_DATE) AS today,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('week',CURRENT_DATE)) AS week,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('month',CURRENT_DATE)) AS month,COUNT(*) FILTER(WHERE created_at>=DATE_TRUNC('year',CURRENT_DATE)) AS year FROM users WHERE role!='super_admin'`).catch(()=>({rows:[{today:0,week:0,month:0,year:0}]})),
    ])
    const lpRow=lp.rows[0]||{},rpRow=rp.rows[0]||{},spRow=sp.rows[0]||{},upRow=up.rows[0]||{}
    const periodStats = {
      leads:   {today:+lpRow.today,week:+lpRow.week,month:+lpRow.month,year:+lpRow.year,all:Number(leads.rows[0].count)},
      revenue: {today:Math.round(+rpRow.today/100),week:Math.round(+rpRow.week/100),month:Math.round(+rpRow.month/100),year:Math.round(+rpRow.year/100),all:Math.round(Number(revenue.rows[0]?.total||0)/100)},
      schools: {today:+spRow.today,week:+spRow.week,month:+spRow.month,year:+spRow.year,all:Number(schools.rows[0].count)},
      users:   {today:+upRow.today,week:+upRow.week,month:+upRow.month,year:+upRow.year,all:Number(users.rows[0].count)},
    }

    // ── Time series for main chart ──────────────────────────────────────────
    let timeSeries: any[] = []
    try {
      if (range==='1d') {
        const r = await db.query(`SELECT to_char(gs.h,'HH24:00') AS label,COUNT(DISTINCT l.id) AS leads,COUNT(DISTINCT u.id) AS users,COALESCE(SUM(p.amount_paise),0) AS rev FROM generate_series(DATE_TRUNC('day',NOW()),NOW(),INTERVAL '1 hour') AS gs(h) LEFT JOIN leads l ON DATE_TRUNC('hour',l.created_at)=gs.h LEFT JOIN users u ON DATE_TRUNC('hour',u.created_at)=gs.h AND u.role!='super_admin' LEFT JOIN(SELECT created_at,amount_paise FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM subscription_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM featured_listing_payments WHERE ${PAID}) p ON DATE_TRUNC('hour',p.created_at)=gs.h GROUP BY gs.h ORDER BY gs.h`).catch(()=>({rows:[]}))
        timeSeries = r.rows.map((x:any)=>({label:x.label,leads:+x.leads,users:+x.users,revenue:Math.round(+x.rev/100)}))
      } else if (['7d','15d','30d'].includes(range)) {
        const r = await db.query(`SELECT to_char(gs.day,'DD Mon') AS label,COUNT(DISTINCT l.id) AS leads,COUNT(DISTINCT u.id) AS users,COUNT(DISTINCT s.id) AS schools,COALESCE(SUM(p.amount_paise),0) AS rev FROM generate_series((NOW()-INTERVAL '${intv}')::date,NOW()::date,INTERVAL '1 day') AS gs(day) LEFT JOIN leads l ON DATE(l.created_at)=gs.day LEFT JOIN users u ON DATE(u.created_at)=gs.day AND u.role!='super_admin' LEFT JOIN schools s ON DATE(s.created_at)=gs.day LEFT JOIN(SELECT created_at,amount_paise FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM subscription_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM featured_listing_payments WHERE ${PAID}) p ON DATE(p.created_at)=gs.day GROUP BY gs.day ORDER BY gs.day`).catch(()=>({rows:[]}))
        timeSeries = r.rows.map((x:any)=>({label:x.label,leads:+x.leads,users:+x.users,schools:+x.schools,revenue:Math.round(+x.rev/100)}))
      } else {
        const isYear=range==='1y'
        const bucket=isYear?`DATE_TRUNC('month',gs.day)`:`DATE_TRUNC('week',gs.day)`
        const fmt=isYear?`to_char(DATE_TRUNC('month',gs.day),'Mon YY')`:`to_char(DATE_TRUNC('week',gs.day),'DD Mon')`
        const step=isYear?'1 month':'1 week'
        const trunc=isYear?'month':'week'
        const r = await db.query(`SELECT ${fmt} AS label,COUNT(DISTINCT l.id) AS leads,COUNT(DISTINCT u.id) AS users,COUNT(DISTINCT s.id) AS schools,COALESCE(SUM(p.amount_paise),0) AS rev FROM generate_series(DATE_TRUNC('${trunc}',(NOW()-INTERVAL '${intv}')::date),NOW()::date,INTERVAL '${step}') AS gs(day) LEFT JOIN leads l ON ${bucket}=DATE_TRUNC('${trunc}',l.created_at) LEFT JOIN users u ON ${bucket}=DATE_TRUNC('${trunc}',u.created_at) AND u.role!='super_admin' LEFT JOIN schools s ON ${bucket}=DATE_TRUNC('${trunc}',s.created_at) LEFT JOIN(SELECT created_at,amount_paise FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM subscription_payments WHERE ${PAID} UNION ALL SELECT created_at,amount_paise FROM featured_listing_payments WHERE ${PAID}) p ON ${bucket}=DATE_TRUNC('${trunc}',p.created_at) GROUP BY ${bucket} ORDER BY ${bucket}`).catch(()=>({rows:[]}))
        timeSeries = r.rows.map((x:any)=>({label:x.label,leads:+x.leads,users:+x.users,schools:+x.schools,revenue:Math.round(+x.rev/100)}))
      }
    } catch {}

    // ── Supplementary ───────────────────────────────────────────────────────
    const [topCities,revBreakdown,funnel] = await Promise.all([
      db.query(`SELECT s.city,COUNT(DISTINCT s.id) AS schools,COUNT(l.id) AS leads FROM schools s LEFT JOIN leads l ON l.school_id=s.id WHERE s.city IS NOT NULL AND s.city<>'' GROUP BY s.city ORDER BY leads DESC LIMIT 6`).catch(()=>({rows:[]})),
      db.query(`SELECT 'Lead Packages' AS source,COALESCE(SUM(amount_paise),0) AS total FROM lead_package_payments WHERE ${PAID} UNION ALL SELECT 'Subscriptions',COALESCE(SUM(amount_paise),0) FROM subscription_payments WHERE ${PAID} UNION ALL SELECT 'Featured Listing',COALESCE(SUM(amount_paise),0) FROM featured_listing_payments WHERE ${PAID}`).catch(()=>({rows:[]})),
      db.query(`SELECT (SELECT COUNT(*) FROM users WHERE role='parent') AS parents,(SELECT COUNT(*) FROM leads) AS leads,(SELECT COUNT(*) FROM leads WHERE is_purchased=true) AS purchased,(SELECT COUNT(*) FROM applications) AS applications`).catch(()=>({rows:[{}]})),
    ])

    const BOARD_COLORS:Record<string,string>={CBSE:'#F5A623',ICSE:'#4F8EF7','State Board':'#00E5A0',IB:'#9B72FF'}
    const STATUS_COLORS:Record<string,string>={pending:'#FBBF24',shortlisted:'#00E5A0',admitted:'#4F8EF7',rejected:'#FF5757',submitted:'#A78BFA'}
    const boardTotal=boardDist.rows.reduce((s:number,r:any)=>s+Number(r.value),0)||1

    return NextResponse.json({
      totalUsers:Number(users.rows[0].count), totalSchools:Number(schools.rows[0].count),
      totalApps:Number(apps.rows[0].count), totalLeads:Number(leads.rows[0].count),
      totalReviews:Number(reviews.rows[0].count), pendingVerification:Number(pendingSchoolsCt.rows[0].count),
      newUsersToday:Number(newUsersToday.rows[0].count), leadsToday:Number(leadsToday.rows[0].count),
      totalRevenue:Number(revenue.rows[0]?.total||0), pendingApps:Number(pendingApps.rows[0].count),
      pendingReviews:Number(pendingReviews.rows[0].count), totalRevenueCount:0,
      periodStats, timeSeries, range,
      schoolsByBoard:boardDist.rows.map((r:any,i:number)=>({name:r.name,value:Math.round(Number(r.value)/boardTotal*100),count:Number(r.value),color:BOARD_COLORS[r.name]||['#F5A623','#4F8EF7','#00E5A0','#9B72FF','#FF7A2E','#34D399'][i]||'#888'})),
      appStatus:appStatus.rows.map((r:any)=>({name:r.name,value:Number(r.value),fill:STATUS_COLORS[r.name]||'#888'})),
      topCities:topCities.rows.map((r:any)=>({city:r.city,schools:Number(r.schools),leads:Number(r.leads)})),
      revBreakdown:revBreakdown.rows.map((r:any,i:number)=>({source:r.source,total:Math.round(Number(r.total)/100),color:['#4F8EF7','#F5A623','#00E5A0'][i]||'#888'})),
      funnel:funnel.rows[0]?{parents:+funnel.rows[0].parents,leads:+funnel.rows[0].leads,purchased:+funnel.rows[0].purchased,applications:+funnel.rows[0].applications}:null,
      recentLeads:recentLeadsRows.rows.map((r:any)=>({id:r.id,schoolName:r.school_name||'—',parentName:r.parent_name||'—',classApplied:r.class_applied||'—',isPurchased:r.is_purchased||false,createdAt:r.created_at})),
      recentUsers:recentUsersRows.rows.map((r:any)=>({id:r.id,fullName:r.full_name||'—',phone:r.phone||'—',role:r.role})),
      pendingSchools:pendingSchoolsRows.rows,
    })
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500})
  }
}
