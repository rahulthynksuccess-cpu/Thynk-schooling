'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Marquee } from '@/components/ui/Marquee'
import Link from 'next/link'
import { ArrowRight, Clock, Search } from 'lucide-react'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string
  tag: string; readTime: string; publishedAt: string
  status: string; coverImage: string
}

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

// Fallback hardcoded posts (shown while loading or if DB empty)
const FALLBACK: BlogPost[] = [
  { id:'1', slug:'cbse-vs-icse-vs-ib',        title:'CBSE vs ICSE vs IB: Which Board is Right for Your Child?',   excerpt:"A comprehensive breakdown of India's three major education boards — curriculum, assessment style, career impact and which suits different types of learners.", tag:'Board Guide',    readTime:'8 min',  publishedAt:'2026-01-15', status:'published', coverImage:'' },
  { id:'2', slug:'how-to-choose-school',       title:'How to Choose the Right School: 10 Questions to Ask',        excerpt:'Visiting a school? Here are the 10 most important questions to ask the principal or admission coordinator before you commit.',                          tag:'Admission Tips', readTime:'6 min',  publishedAt:'2026-02-10', status:'published', coverImage:'' },
  { id:'3', slug:'top-boarding-schools-india', title:'Top 10 Boarding Schools in India 2026',                       excerpt:'From The Doon School to Scindia School — a ranked guide to India\'s finest residential schools, admission criteria and fees.',                        tag:'Rankings',       readTime:'10 min', publishedAt:'2026-01-28', status:'published', coverImage:'' },
  { id:'4', slug:'admission-timeline-guide',   title:'School Admission Timeline: When to Start and What to Do',    excerpt:'Most parents start too late. Here is your month-by-month guide to school admissions — from nursery to senior secondary.',                             tag:'Admission Tips', readTime:'5 min',  publishedAt:'2026-02-20', status:'published', coverImage:'' },
  { id:'5', slug:'ib-schools-india',           title:'Best IB Schools in India: City-Wise Complete List 2026',     excerpt:'A city-wise guide to all IB World Schools in India, covering fees, authorisation status and admission contacts.',                                    tag:'School Lists',   readTime:'12 min', publishedAt:'2026-01-05', status:'published', coverImage:'' },
  { id:'6', slug:'school-fees-guide',          title:'Understanding School Fees: What Parents Must Know',           excerpt:'Admission fees, development charges, annual charges — decode the real cost of schooling and how to plan your budget.',                               tag:'Finance',        readTime:'7 min',  publishedAt:'2026-03-01', status:'published', coverImage:'' },
]

// Cover image placeholder by tag
function CoverPlaceholder({ tag, coverImage, title }: { tag: string; coverImage: string; title: string }) {
  const tc = TAG_COLORS[tag] ?? { bg: '#EDE5D8', color: '#4A3020' }
  if (coverImage) {
    return <img src={coverImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  }
  const emojis: Record<string, string> = {
    'Board Guide': '📚', 'Admission Tips': '✅', 'Rankings': '🏆',
    'School Lists': '🏫', 'Finance': '💰', 'Success Stories': '⭐',
    'News': '📰', 'Events': '📅',
  }
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${tc.bg}, ${tc.bg}dd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
      {emojis[tag] ?? '📝'}
    </div>
  )
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('all')

  useEffect(() => {
    fetch('/api/admin?action=blog', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        // Only use DB posts if the fetch succeeded — even if array is empty
        // Don't fall back to FALLBACK if DB returned a valid (possibly empty) response
        if (d && Array.isArray(d.posts)) {
          setPosts(d.posts.length > 0 ? d.posts : [])
        }
        // d === null means fetch failed — keep FALLBACK showing
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const allTags = Array.from(new Set(posts.map(p => p.tag)))

  const filtered = posts.filter(p => {
    if (activeTag !== 'all' && p.tag !== activeTag) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !p.excerpt.toLowerCase().includes(q)) return false
    }
    return true
  })

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>
        <Marquee variant="light" speed={36} />

        {/* Header */}
        <section style={{ background: 'linear-gradient(150deg, #F5F0E8, #EDE5D8)', padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,80px)', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase' as const, color: '#B8860B', marginBottom: 14, fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: 20, height: 1, background: '#B8860B' }} />Admission Insights
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
              <div>
                <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(2.4rem,5vw,3.8rem)', color: '#0D1117', letterSpacing: '-2px', marginBottom: 12, lineHeight: 0.95 }}>
                  The School <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Admission Blog</em>
                </h1>
                <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 16, color: '#4A5568', fontWeight: 300 }}>
                  Expert guides, rankings and tips to help you navigate school admissions in India.
                </p>
              </div>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(13,17,23,0.1)', borderRadius: 12, padding: '10px 16px', minWidth: 240, backdropFilter: 'blur(8px)' }}>
                <Search style={{ width: 14, height: 14, color: '#A0ADB8', flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#0D1117', width: '100%' }} />
              </div>
            </div>

            {/* Tag filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 28 }}>
              {['all', ...allTags].map(tag => {
                const tc = tag === 'all' ? { bg: '#0D1117', color: '#fff' } : TAG_COLORS[tag] ?? { bg: '#EDE5D8', color: '#4A3020' }
                const active = activeTag === tag
                return (
                  <button key={tag} onClick={() => setActiveTag(tag)}
                    style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all .2s',
                      background: active ? (tag === 'all' ? '#0D1117' : tc.bg) : 'rgba(255,255,255,0.6)',
                      color: active ? (tag === 'all' ? '#fff' : tc.color) : '#718096',
                      boxShadow: active ? '0 2px 8px rgba(13,17,23,0.12)' : 'none' }}>
                    {tag === 'all' ? 'All Articles' : tag}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured post */}
        {featured && !loading && (
          <section style={{ padding: 'clamp(40px,5vw,64px) clamp(20px,5vw,80px) 0' }}>
            <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>
              <Link href={`/blog/${featured.slug}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(24px,4vw,56px)', textDecoration: 'none', background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: 20, overflow: 'hidden', transition: 'all .25s', boxShadow: '0 4px 24px rgba(13,17,23,0.07)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 48px rgba(13,17,23,0.12)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 24px rgba(13,17,23,0.07)' }}>
                {/* Image */}
                <div style={{ height: 320, overflow: 'hidden' }}>
                  <CoverPlaceholder tag={featured.tag} coverImage={featured.coverImage} title={featured.title} />
                </div>
                {/* Text */}
                <div style={{ padding: 'clamp(24px,3vw,44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    {(() => { const tc = TAG_COLORS[featured.tag] ?? { bg:'#EDE5D8', color:'#4A3020' }; return (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 11px', borderRadius: 100, background: tc.bg, color: tc.color, fontFamily: 'DM Sans,sans-serif' }}>{featured.tag}</span>
                    )})()}
                    <span style={{ fontSize: 11, color: '#B8860B', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', background: 'rgba(184,134,11,0.08)', padding: '2px 10px', borderRadius: 100 }}>Featured</span>
                  </div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 'clamp(22px,2.5vw,32px)', color: '#0D1117', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 14 }}>
                    {featured.title}
                  </h2>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#4A5568', lineHeight: 1.7, fontWeight: 300, marginBottom: 24 }}>
                    {featured.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#A0ADB8' }}>
                      <Clock style={{ width: 12, height: 12 }} /> {featured.readTime} read
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#B8860B', fontWeight: 600 }}>
                      Read Article <ArrowRight style={{ width: 13, height: 13 }} />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Posts grid */}
        <section style={{ padding: 'clamp(40px,5vw,64px) clamp(20px,5vw,80px) clamp(60px,8vw,100px)' }}>
          <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 320, borderRadius: 16, background: 'linear-gradient(90deg,#F5F0E8 25%,#EDE5D8 50%,#F5F0E8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                ))}
              </div>
            ) : rest.length === 0 && !featured ? (
              <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'DM Sans,sans-serif', color: '#A0ADB8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                <p>No articles found{search ? ` for "${search}"` : ''}.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
                {rest.map(post => {
                  const tc = TAG_COLORS[post.tag] ?? { bg: '#EDE5D8', color: '#4A3020' }
                  return (
                    <Link key={post.slug} href={`/blog/${post.slug}`}
                      style={{ textDecoration: 'none', background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,17,23,0.05)', display: 'flex', flexDirection: 'column', transition: 'all .25s' }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 10px 40px rgba(13,17,23,0.12)'; el.style.borderColor = 'rgba(184,134,11,0.3)' }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(13,17,23,0.05)'; el.style.borderColor = 'rgba(13,17,23,0.09)' }}>
                      <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
                        <CoverPlaceholder tag={post.tag} coverImage={post.coverImage} title={post.title} />
                      </div>
                      <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: tc.bg, color: tc.color, fontFamily: 'DM Sans,sans-serif' }}>{post.tag}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0ADB8', fontFamily: 'DM Sans,sans-serif' }}>
                            <Clock style={{ width: 10, height: 10 }} />{post.readTime} read
                          </span>
                        </div>
                        <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: 19, color: '#0D1117', lineHeight: 1.25, marginBottom: 10, flex: 1 }}>{post.title}</h2>
                        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#718096', lineHeight: 1.65, marginBottom: 18, fontWeight: 300 }}>{post.excerpt}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#B8860B', fontFamily: 'DM Sans,sans-serif', paddingTop: 14, borderTop: '1px solid rgba(13,17,23,0.06)' }}>
                          Read Article <ArrowRight style={{ width: 13, height: 13 }} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <Marquee variant="dark" speed={42} />
      </main>
      <Footer />
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </>
  )
}
