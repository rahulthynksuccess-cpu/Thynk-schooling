// app/blog/[slug]/page.tsx
// Reads from DB (blog_posts table) with fallback to original hardcoded content
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react'
import { notFound } from 'next/navigation'

// ── Hardcoded fallback content (original posts, shown if not in DB) ──
const HARDCODED: Record<string, { title: string; tag: string; time: string; date: string; author: string; body: string }> = {
  'cbse-vs-icse-vs-ib': {
    title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?',
    tag: 'Board Guide', time: '8 min', date: 'January 2026', author: 'Thynk Schooling Team',
    body: `Choosing the right education board is one of the most important decisions a parent makes.\n\n**CBSE (Central Board of Secondary Education)**\nIndia's most popular board with over 25,000 schools. CBSE is strong in science and mathematics and its syllabus aligns perfectly with competitive exams like JEE and NEET.\n\n**ICSE (Indian Certificate of Secondary Education)**\nICSE has a broader curriculum with strong emphasis on English, arts and social sciences. More application-based than CBSE. Ideal for students considering humanities or studying abroad.\n\n**IB (International Baccalaureate)**\nThe IB Diploma Programme is accepted by universities worldwide and develops critical thinking, research and communication skills.\n\n**Our Recommendation**\n- Engineering/Medicine ambitions → CBSE\n- Holistic development, humanities → ICSE\n- Studying abroad, international mindset → IB`,
  },
  'how-to-choose-school': {
    title: 'How to Choose the Right School: 10 Questions to Ask',
    tag: 'Admission Tips', time: '6 min', date: 'February 2026', author: 'Thynk Schooling Team',
    body: `Visiting a school can be overwhelming. Here are 10 questions that cut through the noise.\n\n**1. What is the student-teacher ratio?**\nAnything above 30:1 means your child gets less individual attention.\n\n**2. What percentage of students pass board exams?**\nAsk for last 3 years' data.\n\n**3. How are discipline issues handled?**\nThe answer reveals the school's culture more than any brochure.\n\n**4. What extra-curriculars are genuinely funded?**\nMany schools list activities that have no proper budget.\n\n**5. What is the homework policy?**\nHours of homework daily can be a red flag for child wellbeing.`,
  },
  'top-boarding-schools-india': {
    title: 'Top 10 Boarding Schools in India 2026',
    tag: 'Rankings', time: '10 min', date: 'January 2026', author: 'Thynk Schooling Team',
    body: `India has some of the finest residential schools in Asia.\n\n**1. The Doon School, Dehradun**\nFounded in 1935, consistently ranked India's #1 boys' boarding school.\n\n**2. Welham Girls' School, Dehradun**\nIndia's most prestigious girls' boarding school.\n\n**3. The Scindia School, Gwalior**\nLocated in a historic fort, known for strong values and academics.\n\n**4. Mayo College, Ajmer**\nOne of India's oldest and most respected schools for boys.\n\n**5. Woodstock School, Mussoorie**\nA co-educational international school with an IB programme.`,
  },
  'admission-timeline-guide': {
    title: 'School Admission Timeline: When to Start and What to Do',
    tag: 'Admission Tips', time: '5 min', date: 'February 2026', author: 'Thynk Schooling Team',
    body: `Most parents start too late. Here is your month-by-month guide.\n\n**October–December**\nRegistrations open for most schools. Begin your shortlist.\n\n**January–February**\nSchools conduct informal assessments and parent interactions.\n\n**March–April**\nResults and offer letters are announced.\n\n**May–June**\nFee payment and enrolment confirmation deadline.\n\n**The Golden Rule**\nStart your school search at least 12–18 months before the desired admission year.`,
  },
  'ib-schools-india': {
    title: 'Best IB Schools in India: City-Wise Complete List 2026',
    tag: 'School Lists', time: '12 min', date: 'January 2026', author: 'Thynk Schooling Team',
    body: `There are over 200 IB World Schools in India.\n\n**Mumbai**\n- Dhirubhai Ambani International School\n- BD Somani International School\n- Ecole Mondiale World School\n\n**Delhi NCR**\n- The Shri Ram School, Vasant Vihar\n- Pathways School Noida\n- Amity Global School\n\n**Bangalore**\n- Inventure Academy\n- Canadian International School\n- Stonehill International School\n\n**Pune**\n- Mahindra United World College\n- The Orchid School\n\n**Note:** Always verify IB authorisation status directly with IBO.`,
  },
  'school-fees-guide': {
    title: 'Understanding School Fees: What Parents Must Know',
    tag: 'Finance', time: '7 min', date: 'March 2026', author: 'Thynk Schooling Team',
    body: `School fees in India go beyond monthly tuition.\n\n**One-Time Fees**\n- Registration fee: ₹1,000–₹25,000\n- Admission/enrolment fee: ₹10,000–₹2,00,000\n- Security deposit (refundable): ₹10,000–₹50,000\n\n**Annual Fees**\n- Annual charges / development fee: ₹20,000–₹2,00,000\n- School diary, uniform, stationery\n\n**Monthly Fees**\n- Tuition: Ranges from ₹2,000 to ₹30,000+ per month\n- Transport: ₹1,500–₹5,000\n- Meals: ₹1,000–₹3,000\n\n**Questions to ask before admission**\n- What is the annual fee escalation?\n- Are there any compulsory purchases?\n- Is the security deposit truly refundable?`,
  },
}

// ── Fetch from DB ────────────────────────────────────────────────────
async function fetchPost(slug: string) {
  try {
    // Use NEXT_PUBLIC_APP_URL (set in your .env), fall back to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin?action=blog&slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.post ?? null
  } catch {
    return null
  }
}

async function fetchAllPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin?action=blog`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.posts ?? []
  } catch {
    return []
  }
}

// ── Render helpers ────────────────────────────────────────────────────
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'Board Guide':    { bg: '#FEF7E0', color: '#7A5800' },
  'Admission Tips': { bg: '#E8F5E8', color: '#1A5C1A' },
  'Rankings':       { bg: '#EDE5D8', color: '#4A3020' },
  'School Lists':   { bg: '#E8ECF5', color: '#1A2C5C' },
  'Finance':        { bg: '#F5E8ED', color: '#5C1A30' },
  'Success Stories':{ bg: '#EDE5F8', color: '#4A1A7C' },
  'News':           { bg: '#E5F5FF', color: '#1A4A7C' },
  'Events':         { bg: '#FFF0E5', color: '#7C3A1A' },
}

// Renders plain text body (for hardcoded fallback)
function renderPlainBody(body: string) {
  return body.split('\n\n').map((para, i) => {
    if (para.startsWith('**') && para.endsWith('**') && !para.slice(2).includes('**')) {
      return <h3 key={i} style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(18px,2vw,24px)', fontWeight: 700, color: '#0D1117', margin: '32px 0 12px', letterSpacing: '-.5px' }}>{para.slice(2, -2)}</h3>
    }
    const formatted = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    return <p key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(15px,1.5vw,17px)', color: '#374151', lineHeight: 1.85, margin: '0 0 20px', fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

type Params = { slug: string }

// generateStaticParams intentionally removed — pages are server-rendered
// dynamically so edits in the admin panel appear immediately on the live site.

export async function generateMetadata({ params }: { params: Params }) {
  const dbPost = await fetchPost(params.slug)
  if (dbPost) {
    return {
      title: (dbPost.metaTitle || dbPost.title) + ' — Thynk Schooling',
      description: dbPost.metaDesc || dbPost.excerpt || dbPost.body?.replace(/<[^>]*>/g, '').slice(0, 160),
    }
  }
  const hc = HARDCODED[params.slug]
  if (!hc) return { title: 'Article Not Found' }
  return { title: `${hc.title} — Thynk Schooling`, description: hc.body.replace(/\*\*/g, '').slice(0, 160) }
}

export default async function BlogArticlePage({ params }: { params: Params }) {
  // Try DB first, fall back to hardcoded
  const dbPost = await fetchPost(params.slug)
  const hc = HARDCODED[params.slug]
  const allDbPosts = await fetchAllPosts()

  if (!dbPost && !hc) notFound()

  const article = dbPost ?? (hc ? {
    slug: params.slug, title: hc.title, excerpt: '', body: '', tag: hc.tag,
    readTime: hc.time, publishedAt: hc.date, coverImage: '', author: hc.author, isHardcoded: true,
  } : null)

  if (!article) notFound()

  const tc = TAG_COLORS[article.tag] ?? { bg: '#EDE5D8', color: '#4A3020' }

  // Related posts (from DB + hardcoded, excluding current)
  const relatedDb = allDbPosts.filter((p: any) => p.slug !== params.slug).slice(0, 4)
  const relatedHc = Object.entries(HARDCODED)
    .filter(([s]) => s !== params.slug && !allDbPosts.find((p: any) => p.slug === s))
    .slice(0, 4 - relatedDb.length)
    .map(([s, a]) => ({ slug: s, title: a.title }))
  const related = [...relatedDb.map((p: any) => ({ slug: p.slug, title: p.title })), ...relatedHc]

  return (
    <>
      <style>{`
        .blog-body h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem,4vw,3rem); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; color: #0D1117; margin: 36px 0 16px; }
        .blog-body h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.5rem,3vw,2.2rem); font-weight: 700; letter-spacing: -1px; line-height: 1.15; color: #0D1117; margin: 32px 0 14px; }
        .blog-body h3 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.2rem,2vw,1.6rem); font-weight: 700; color: #0D1117; margin: 28px 0 12px; }
        .blog-body p  { font-family: 'DM Sans', sans-serif; font-size: clamp(15px,1.5vw,17px); color: #374151; line-height: 1.85; margin: 0 0 20px; font-weight: 300; }
        .blog-body ul, .blog-body ol { font-family: 'DM Sans', sans-serif; font-size: 16px; color: #374151; line-height: 1.8; padding-left: 24px; margin: 0 0 20px; }
        .blog-body li { margin-bottom: 8px; font-weight: 300; }
        .blog-body a  { color: #B8860B; text-decoration: underline; }
        .blog-body strong { font-weight: 700; color: #0D1117; }
        .blog-body em { font-style: italic; color: #4A5568; }
        .blog-body blockquote { border-left: 4px solid #B8860B; padding: 14px 22px; margin: 24px 0; background: rgba(184,134,11,0.06); font-style: italic; color: #4A5568; border-radius: 0 10px 10px 0; }
        .blog-body pre { background: #0D1117; color: #E8C547; padding: 18px 22px; border-radius: 10px; overflow: auto; font-family: monospace; font-size: 13px; margin: 20px 0; }
        .blog-body code { font-family: monospace; background: rgba(13,17,23,0.06); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        .blog-body img { max-width: 100%; border-radius: 12px; margin: 20px 0; display: block; }
        .blog-body hr { border: none; border-top: 2px solid #EDE5D8; margin: 32px 0; }
      `}</style>

      <Navbar />
      <main style={{ background: 'var(--ivory,#FAF7F2)', paddingTop: '72px', minHeight: '100vh' }}>

        {/* Cover image */}
        {article.coverImage && (
          <div style={{ height: 'clamp(260px,35vw,440px)', overflow: 'hidden', position: 'relative', background: '#EDE5D8' }}>
            <img src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(13,17,23,0.5) 100%)' }} />
          </div>
        )}

        {/* Hero */}
        <section style={{ background: 'linear-gradient(150deg,#FAF7F2,#F5F0E8)', padding: 'clamp(40px,5vw,72px) clamp(20px,5vw,80px)', borderBottom: '1px solid rgba(13,17,23,0.07)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B8860B', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, textDecoration: 'none', marginBottom: 24 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Blog
            </Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: tc.color, marginBottom: 16, fontFamily: 'DM Sans,sans-serif', background: tc.bg, padding: '5px 12px', borderRadius: 100 }}>
              {article.tag}
            </span>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2rem,5vw,4rem)', color: '#0D1117', letterSpacing: '-2px', lineHeight: .95, marginBottom: 20, maxWidth: 820 }}>
              {article.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#718096', fontFamily: 'DM Sans,sans-serif' }}>
                <Clock style={{ width: 13, height: 13 }} /> {article.readTime} read
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#718096', fontFamily: 'DM Sans,sans-serif' }}>
                <Calendar style={{ width: 13, height: 13 }} /> {article.publishedAt}
              </span>
              {article.author && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#718096', fontFamily: 'DM Sans,sans-serif' }}>
                  <User style={{ width: 13, height: 13 }} /> {article.author}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding: 'clamp(40px,5vw,72px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr clamp(280px,28vw,340px)', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>

            {/* Article */}
            <article>
              {/* Excerpt lead */}
              {article.excerpt && (
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 18, color: '#4A5568', lineHeight: 1.7, fontWeight: 400, borderLeft: '4px solid #B8860B', paddingLeft: 20, marginBottom: 32, fontStyle: 'italic' }}>
                  {article.excerpt}
                </p>
              )}

              {/* Body — DB post uses HTML, hardcoded uses plain text renderer */}
              {dbPost ? (
                <div className="blog-body" dangerouslySetInnerHTML={{ __html: dbPost.body }} />
              ) : hc ? (
                <div className="blog-body">{renderPlainBody(hc.body)}</div>
              ) : null}
            </article>

            {/* Sidebar */}
            <aside style={{ position: 'sticky', top: 90 }}>
              {/* CTA */}
              <div style={{ background: 'linear-gradient(135deg,#0D1117,#1a2540)', borderRadius: 18, padding: 28, marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, fontWeight: 700, color: '#FAF7F2', marginBottom: 10 }}>Free Counselling</h3>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(250,247,242,0.6)', lineHeight: 1.65, marginBottom: 20, fontWeight: 300 }}>
                  Not sure which school is right for your child? Talk to our experts at zero cost.
                </p>
                <Link href="/counselling" style={{ display: 'block', textAlign: 'center', padding: '13px 20px', background: 'linear-gradient(135deg,#B8860B,#C9960D)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 20px rgba(184,134,11,0.4)' }}>
                  Book Free Session →
                </Link>
              </div>

              {/* Find Schools */}
              <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 19, fontWeight: 700, color: '#0D1117', marginBottom: 10 }}>Find Schools</h3>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 16, fontWeight: 300 }}>Search 12,000+ verified schools across 350+ cities in India.</p>
                <Link href="/schools" style={{ display: 'block', textAlign: 'center', padding: '11px 20px', background: '#F5F0E8', color: '#0D1117', borderRadius: 9, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, border: '1px solid rgba(13,17,23,0.1)' }}>
                  Search Schools →
                </Link>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid rgba(13,17,23,0.08)', borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 19, fontWeight: 700, color: '#0D1117', marginBottom: 16 }}>More Articles</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {related.map((r: any) => (
                      <Link key={r.slug} href={`/blog/${r.slug}`} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', textDecoration: 'none', fontWeight: 500, lineHeight: 1.5, borderBottom: '1px solid rgba(13,17,23,0.06)', paddingBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <ArrowLeft style={{ width: 12, height: 12, transform: 'rotate(180deg)', flexShrink: 0, marginTop: 3, color: '#B8860B' }} />
                        {r.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
