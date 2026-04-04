import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { notFound } from 'next/navigation'

const CONTENT: Record<string, { title: string; tag: string; time: string; date: string; body: string }> = {
  'cbse-vs-icse-vs-ib': {
    title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?',
    tag: 'Board Guide', time: '8 min', date: 'January 2026',
    body: `Choosing the right education board is one of the most important decisions a parent makes. Each board has a distinct philosophy, curriculum and assessment style.\n\n**CBSE (Central Board of Secondary Education)**\nIndia's most popular board with over 25,000 schools. CBSE is strong in science and mathematics, follows NCERT textbooks, and its syllabus aligns perfectly with competitive exams like JEE and NEET. Best for students who aim for engineering or medicine.\n\n**ICSE (Indian Certificate of Secondary Education)**\nRun by CISCE, ICSE has a broader curriculum with strong emphasis on English, arts and social sciences. More application-based than CBSE. Ideal for students considering humanities or studying abroad.\n\n**IB (International Baccalaureate)**\nThe gold standard for globally mobile families. The IB Diploma Programme is accepted by universities worldwide and develops critical thinking, research and communication skills. Higher fees but unmatched in terms of holistic development.\n\n**Our Recommendation**\n- Engineering/Medicine ambitions → CBSE\n- Holistic development, humanities → ICSE\n- Studying abroad, international mindset → IB\n\nStill confused? Book a free counselling session and our experts will help you decide based on your child's strengths and your family's goals.`,
  },
  'how-to-choose-school': {
    title: 'How to Choose the Right School: 10 Questions to Ask',
    tag: 'Admission Tips', time: '6 min', date: 'February 2026',
    body: `Visiting a school can be overwhelming. Here are 10 questions that cut through the noise.\n\n**1. What is the student-teacher ratio?**\nAnything above 30:1 means your child gets less individual attention.\n\n**2. What percentage of students pass board exams?**\nAsk for last 3 years' data, not just the best year.\n\n**3. How are discipline issues handled?**\nThe answer reveals the school's culture more than any brochure.\n\n**4. What extra-curriculars are genuinely funded?**\nMany schools list activities that have no proper budget or equipment.\n\n**5. What is the homework policy?**\nHours of homework daily can be a red flag for child wellbeing.\n\n**6. How do they handle learning differences?**\nA good school has trained counsellors and differentiated teaching methods.\n\n**7. What is the fee escalation policy?**\nAsk for the fee history over the last 5 years — not just the current year.\n\n**8. How do they communicate with parents?**\nRegular, transparent communication is a sign of a well-run school.\n\n**9. What do current parents say?**\nRead reviews on Thynk Schooling and ask to speak to current parents.\n\n**10. What is the vision of the principal?**\nLeadership sets school culture. A 10-minute conversation tells you everything.`,
  },
  'admission-guide': {
    title: 'The Complete School Admission Guide for Indian Parents (2025)',
    tag: 'Admission Guide', time: '10 min', date: 'March 2026',
    body: `Getting your child admitted to the right school requires planning, patience and the right information. This comprehensive guide walks you through every step.\n\n**Step 1: Start Early**\nBegin your school search at least 12–18 months before the desired admission year. Most premium schools open registrations in October–November for the following academic year.\n\n**Step 2: Shortlist Based on Priorities**\nCreate a list of non-negotiables: board (CBSE/ICSE/IB), medium of instruction, distance from home, monthly fee budget, gender policy.\n\n**Step 3: Research Thoroughly**\nVisit school profiles on Thynk Schooling for board results, facilities, reviews from current parents, fee structures and teacher-student ratios. Don't rely on rankings alone.\n\n**Step 4: Attend Open Days**\nMost schools hold open houses between November and January. Attend them — the culture of a school is visible in how students and teachers interact.\n\n**Step 5: Complete the Application**\nMost schools require: birth certificate, previous class marksheets, passport photos, residential proof, and Aadhar card. Some schools require parent interviews.\n\n**Step 6: Prepare for Assessments**\nMany schools conduct informal assessments to gauge the child's readiness. Prepare with age-appropriate activities, not rote learning.\n\n**Step 7: Follow Up**\nAfter submitting your application, note the school's announcement date and follow up professionally.\n\n**Key Timelines**\n- Oct–Dec: Registration opens for most schools\n- Jan–Feb: Assessments and parent interactions\n- Mar–Apr: Results and offer letters\n- May–Jun: Fee payment and enrolment confirmation\n\nBook a free counselling session on Thynk Schooling for personalised guidance.`,
  },
  'success-stories': {
    title: 'Success Stories: How Parents Found the Perfect School',
    tag: 'Success Stories', time: '5 min', date: 'February 2026',
    body: `Real stories from real parents who used Thynk Schooling to find and secure admission for their children.\n\n**Priya Sharma, Delhi**\n"I was overwhelmed looking for an IB school in South Delhi within our budget. Thynk Schooling's filters helped me narrow down from 200+ schools to 8 that matched exactly. My daughter starts at Springdales this April!"\n\n**Rajesh Menon, Bangalore**\n"We relocated from Dubai and had no idea about CBSE schools in Whitefield. The counselling session was a game-changer — within 45 minutes we had a clear shortlist and a plan. My son is now happily settled."\n\n**Anita Krishnamurthy, Chennai**\n"The school comparison feature saved us weeks of research. We could see fees, ratings, board results and parent reviews side by side. We visited only 3 schools instead of 12."\n\n**Sanjay Agarwal, Mumbai**\n"Free counselling for parents? I was skeptical. But the counsellor knew every school in Andheri East — the good and the bad. No sales pitch, just honest advice. My twins are now in a school that suits both their very different personalities."\n\n**Share Your Story**\nDid Thynk Schooling help you find the right school? Email us at stories@thynkschooling.in`,
  },
}

type Params = { slug: string }

export async function generateStaticParams() {
  return Object.keys(CONTENT).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const article = CONTENT[params.slug]
  if (!article) return { title: 'Article Not Found' }
  return { title: `${article.title} — Thynk Schooling`, description: article.body.slice(0, 160) }
}

function formatBody(body: string) {
  return body.split('\n\n').map((para, i) => {
    if (para.startsWith('**') && para.endsWith('**') && !para.slice(2).includes('**')) {
      return <h3 key={i} style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(18px,2vw,24px)', fontWeight:700, color:'#0D1117', margin:'28px 0 10px', letterSpacing:'-.5px' }}>{para.slice(2,-2)}</h3>
    }
    const formatted = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/→/g, '→')
    return <p key={i} style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,1.5vw,17px)', color:'#374151', lineHeight:1.8, margin:'0 0 18px', fontWeight:300 }} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export default function BlogArticlePage({ params }: { params: Params }) {
  const article = CONTENT[params.slug]
  if (!article) notFound()

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px', minHeight:'100vh' }}>
        {/* Hero */}
        <section style={{ background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))', padding:'clamp(48px,6vw,80px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto' }}>
            <Link href="/blog" style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13, color:'#B8860B', fontFamily:'DM Sans,sans-serif', fontWeight:600, textDecoration:'none', marginBottom:24 }}>
              <ArrowLeft style={{ width:14, height:14 }} /> Back to Blog
            </Link>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:11, fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:'#B8860B', marginBottom:16, fontFamily:'DM Sans,sans-serif', background:'rgba(184,134,11,0.08)', padding:'5px 12px', borderRadius:100 }}>
              {article.tag}
            </div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2rem,5vw,4rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.95, marginBottom:20, maxWidth:800 }}>
              {article.title}
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#718096', fontFamily:'DM Sans,sans-serif' }}>
                <Clock style={{ width:13, height:13 }} /> {article.time} read
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#718096', fontFamily:'DM Sans,sans-serif' }}>
                <Calendar style={{ width:13, height:13 }} /> {article.date}
              </span>
            </div>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding:'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 320px', gap:48, alignItems:'start' }}>
            <article>
              {formatBody(article.body)}
            </article>
            {/* Sidebar */}
            <aside>
              <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:16, padding:28, marginBottom:20 }}>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:700, color:'#0D1117', marginBottom:12 }}>Free Counselling</h3>
                <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#4A5568', lineHeight:1.65, marginBottom:16, fontWeight:300 }}>Not sure which school is right? Talk to our experts for free.</p>
                <Link href="/counselling" style={{ display:'block', textAlign:'center', padding:'12px 20px', background:'#B8860B', color:'#fff', borderRadius:9, textDecoration:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:700 }}>Book Free Session →</Link>
              </div>
              <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:16, padding:28 }}>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, fontWeight:700, color:'#0D1117', marginBottom:14 }}>More Articles</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {Object.entries(CONTENT).filter(([s]) => s !== params.slug).map(([s, a]) => (
                    <Link key={s} href={`/blog/${s}`} style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#B8860B', textDecoration:'none', fontWeight:500, lineHeight:1.5, borderBottom:'1px solid rgba(13,17,23,0.06)', paddingBottom:10 }}>
                      {a.title}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
