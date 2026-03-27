import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'

const CONTENT: Record<string, { title: string; tag: string; time: string; date: string; body: string }> = {
  'cbse-vs-icse-vs-ib': {
    title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?',
    tag: 'Board Guide', time: '8 min', date: 'January 2026',
    body: `Choosing the right education board is one of the most important decisions a parent makes. Each board has a distinct philosophy, curriculum and assessment style.

**CBSE (Central Board of Secondary Education)**
India's most popular board with over 25,000 schools. CBSE is strong in science and mathematics, follows NCERT textbooks, and its syllabus aligns perfectly with competitive exams like JEE and NEET. Best for students who aim for engineering or medicine.

**ICSE (Indian Certificate of Secondary Education)**
Run by CISCE, ICSE has a broader curriculum with strong emphasis on English, arts and social sciences. More application-based than CBSE. Ideal for students considering humanities or studying abroad.

**IB (International Baccalaureate)**
The gold standard for globally mobile families. The IB Diploma Programme is accepted by universities worldwide and develops critical thinking, research and communication skills. Higher fees but unmatched in terms of holistic development.

**Our Recommendation**
- Engineering/Medicine ambitions → CBSE
- Holistic development, humanities → ICSE  
- Studying abroad, international mindset → IB

Still confused? Book a free counselling session and our experts will help you decide based on your child's strengths and your family's goals.`,
  },
  'how-to-choose-school': {
    title: 'How to Choose the Right School: 10 Questions to Ask',
    tag: 'Admission Tips', time: '6 min', date: 'February 2026',
    body: `Visiting a school can be overwhelming. Here are 10 questions that cut through the noise.

**1. What is the student-teacher ratio?**
Anything above 30:1 means your child gets less individual attention.

**2. What percentage of students pass board exams?**
Ask for last 3 years' data, not just the best year.

**3. How are discipline issues handled?**
The answer reveals the school's culture more than any brochure.

**4. What extra-curriculars are genuinely funded?**
Many schools list activities that have no proper budget or equipment.

**5. What is the homework policy?**
Hours of homework daily can be a red flag for child wellbeing.

**6. How do they handle learning differences?**
A good school has trained counsellors and differentiated teaching methods.

**7. What is the transport situation?**
Distance and commute time significantly affect children.

**8. What is the fee escalation history?**
Ask how much fees have increased in the last 5 years.

**9. Can you speak to current parents?**
Schools confident in their quality will connect you with parent communities.

**10. What is the vision of the principal?**
Leadership sets school culture. A 10-minute conversation tells you everything.`
  },
}

type Params = { slug: string }

export async function generateStaticParams() {
  return Object.keys(CONTENT).map(slug => ({ slug }))
}

export default function BlogPostPage({ params }: { params: Params }) {
  const post = CONTENT[params.slug]

  if (!post) {
    return (
      <>
        <Navbar />
        <main style={{ background: '#FAF7F2', paddingTop: '80px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '72px', color: '#EDE5D8', marginBottom: '16px' }}>404</div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '28px', color: '#0D1117', marginBottom: '12px' }}>Article not found</h1>
            <Link href="/blog" style={{ color: '#B8860B', fontFamily: 'DM Sans,sans-serif', fontSize: '14px' }}>← Back to Blog</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const paragraphs = post.body.split('\n\n').filter(Boolean)

  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>
        <article style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 48px 80px' }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B8860B', fontFamily: 'DM Sans,sans-serif', textDecoration: 'none', marginBottom: '28px' }}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} /> Back to Blog
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: '#FEF7E0', color: '#7A5800', fontFamily: 'DM Sans,sans-serif' }}>{post.tag}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>
              <Clock style={{ width: '11px', height: '11px' }} />{post.time} read
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>
              <Calendar style={{ width: '11px', height: '11px' }} />{post.date}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '48px', color: '#0D1117', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '28px' }}>
            {post.title}
          </h1>
          <div style={{ width: '40px', height: '2px', background: '#B8860B', marginBottom: '28px' }} />
          {paragraphs.map((para, i) => {
            const isHeading = para.startsWith('**') && para.endsWith('**')
            const isBold = para.includes('**')
            if (isHeading) {
              return <h2 key={i} style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '26px', color: '#0D1117', margin: '28px 0 12px' }}>{para.replace(/\*\*/g, '')}</h2>
            }
            if (isBold) {
              const parts = para.split('**')
              return (
                <p key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', lineHeight: 1.8, marginBottom: '16px', fontWeight: 300 }}>
                  {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#0D1117', fontWeight: 600 }}>{part}</strong> : part)}
                </p>
              )
            }
            if (para.startsWith('- ')) {
              return <p key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', lineHeight: 1.8, marginBottom: '8px', paddingLeft: '16px', fontWeight: 300, borderLeft: '2px solid rgba(184,134,11,0.3)' }}>{para.replace('- ', '')}</p>
            }
            return <p key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', lineHeight: 1.8, marginBottom: '16px', fontWeight: 300 }}>{para}</p>
          })}

          {/* CTA */}
          <div style={{ marginTop: '48px', padding: '32px', background: '#F5F0E8', borderRadius: '16px', border: '1px solid rgba(184,134,11,0.2)', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '24px', color: '#0D1117', marginBottom: '8px' }}>Still have questions?</h3>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '18px', fontWeight: 300 }}>Talk to a free education counsellor — no sales pitch, no pressure.</p>
            <Link href="/counselling" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#B8860B', color: '#FAF7F2', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none' }}>
              Book Free Counselling
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
