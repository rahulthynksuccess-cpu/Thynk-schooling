'use client'
export const dynamic = 'force-dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

const POSTS = [
  { slug: 'cbse-vs-icse-vs-ib',        title: 'CBSE vs ICSE vs IB: Which Board is Right for Your Child?',    tag: 'Board Guide',    time: '8 min',  excerpt: 'A comprehensive breakdown of India\'s three major education boards — curriculum, assessment style, career impact and which suits different types of learners.' },
  { slug: 'how-to-choose-school',       title: 'How to Choose the Right School: 10 Questions to Ask',         tag: 'Admission Tips', time: '6 min',  excerpt: 'Visiting a school? Here are the 10 most important questions to ask the principal or admission coordinator before you commit.' },
  { slug: 'top-boarding-schools-india', title: 'Top 10 Boarding Schools in India 2026',                        tag: 'Rankings',       time: '10 min', excerpt: 'From The Doon School to Scindia School — a ranked guide to India\'s finest residential schools, admission criteria and fees.' },
  { slug: 'admission-timeline-guide',   title: 'School Admission Timeline: When to Start and What to Do',     tag: 'Admission Tips', time: '5 min',  excerpt: 'Most parents start too late. Here is your month-by-month guide to school admissions — from nursery to senior secondary.' },
  { slug: 'ib-schools-india',           title: 'Best IB Schools in India: City-Wise Complete List 2026',      tag: 'School Lists',   time: '12 min', excerpt: 'A city-wise guide to all IB World Schools in India, covering fees, authorisation status and admission contacts.' },
  { slug: 'school-fees-guide',          title: 'Understanding School Fees: What Parents Must Know',            tag: 'Finance',        time: '7 min',  excerpt: 'Admission fees, development charges, annual charges — decode the real cost of schooling and how to plan your budget.' },
]

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'Board Guide':    { bg: '#FEF7E0', color: '#7A5800' },
  'Admission Tips': { bg: '#E8F5E8', color: '#1A5C1A' },
  'Rankings':       { bg: '#EDE5D8', color: '#4A3020' },
  'School Lists':   { bg: '#E8ECF5', color: '#1A2C5C' },
  'Finance':        { bg: '#F5E8ED', color: '#5C1A30' },
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>

        {/* Header */}
        <section style={{ background: '#F5F0E8', padding: '56px 48px', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Admission Insights
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '56px', color: '#0D1117', letterSpacing: '-2px', marginBottom: '12px' }}>
              The School <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Admission Blog</em>
            </h1>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '16px', color: '#4A5568', fontWeight: 300 }}>
              Expert guides, rankings and tips to help you navigate school admissions in India.
            </p>
          </div>
        </section>

        {/* Posts grid */}
        <section style={{ padding: '56px 48px 80px' }}>
          <div style={{ maxWidth:'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {POSTS.map(post => {
                const tagStyle = TAG_COLORS[post.tag] ?? { bg: '#EDE5D8', color: '#4A3020' }
                return (
                  <Link key={post.slug} href={`/blog/${post.slug}`}
                    style={{ textDecoration: 'none', background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,17,23,0.05)', display: 'flex', flexDirection: 'column', transition: 'all .25s' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 32px rgba(13,17,23,0.12)'; el.style.borderColor = 'rgba(184,134,11,0.3)' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(13,17,23,0.05)'; el.style.borderColor = 'rgba(13,17,23,0.09)' }}>
                    <div style={{ height: '120px', background: 'linear-gradient(135deg, #F5F0E8, #EDE5D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
                    <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: tagStyle.bg, color: tagStyle.color, fontFamily: 'DM Sans,sans-serif' }}>{post.tag}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>
                          <Clock style={{ width: '10px', height: '10px' }} />{post.time} read
                        </span>
                      </div>
                      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '19px', color: '#0D1117', lineHeight: 1.25, marginBottom: '10px', flex: 1 }}>{post.title}</h2>
                      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13px', color: '#718096', lineHeight: 1.65, marginBottom: '18px', fontWeight: 300 }}>{post.excerpt}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, color: '#B8860B', fontFamily: 'DM Sans,sans-serif', paddingTop: '14px', borderTop: '1px solid rgba(13,17,23,0.06)' }}>
                        Read Article <ArrowRight style={{ width: '14px', height: '14px' }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
