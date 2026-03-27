import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'

const CITIES = [
  { name: 'Delhi',     slug: 'delhi',     schools: 1240, emoji: '🏛️', desc: 'Capital city with CBSE, IB and Cambridge schools' },
  { name: 'Mumbai',    slug: 'mumbai',    schools: 980,  emoji: '🌊', desc: 'Financial hub with top ICSE and IB institutions' },
  { name: 'Bangalore', slug: 'bangalore', schools: 860,  emoji: '🌿', desc: 'Tech city with excellent international schools' },
  { name: 'Hyderabad', slug: 'hyderabad', schools: 720,  emoji: '💎', desc: 'Growing city with strong CBSE school network' },
  { name: 'Chennai',   slug: 'chennai',   schools: 640,  emoji: '🎭', desc: 'Cultural capital with heritage and modern schools' },
  { name: 'Pune',      slug: 'pune',      schools: 580,  emoji: '📚', desc: 'Education hub with CBSE, ICSE and IB options' },
  { name: 'Kolkata',   slug: 'kolkata',   schools: 520,  emoji: '🎨', desc: 'Historic city with renowned English-medium schools' },
  { name: 'Ahmedabad', slug: 'ahmedabad', schools: 460,  emoji: '🏗️', desc: 'Growing metro with quality CBSE schools' },
  { name: 'Jaipur',    slug: 'jaipur',    schools: 380,  emoji: '🏰', desc: 'Pink city with traditional and modern schools' },
  { name: 'Lucknow',   slug: 'lucknow',   schools: 340,  emoji: '🌸', desc: 'Cultural capital of UP with quality institutions' },
  { name: 'Chandigarh',slug: 'chandigarh',schools: 280,  emoji: '🌳', desc: 'Planned city with top-ranked schools' },
  { name: 'Indore',    slug: 'indore',    schools: 260,  emoji: '🏙️', desc: "Madhya Pradesh's education hub" },
  { name: 'Bhopal',    slug: 'bhopal',    schools: 220,  emoji: '🏞️', desc: 'State capital with improving school infrastructure' },
  { name: 'Nagpur',    slug: 'nagpur',    schools: 200,  emoji: '🍊', desc: 'Central India hub with CBSE and SSC schools' },
  { name: 'Kochi',     slug: 'kochi',     schools: 180,  emoji: '⛵', desc: "Kerala's commercial capital with top schools" },
  { name: 'Coimbatore',slug: 'coimbatore',schools: 170, emoji: '🏭', desc: 'Industrial city with strong education ecosystem' },
  { name: 'Surat',     slug: 'surat',     schools: 160,  emoji: '💎', desc: 'Diamond city with good English-medium schools' },
  { name: 'Dehradun',  slug: 'dehradun',  schools: 140,  emoji: '🏔', desc: "India's boarding school capital" },
  { name: 'Gurgaon',   slug: 'gurgaon',   schools: 130,  emoji: '🏢', desc: 'Corporate hub with premium international schools' },
  { name: 'Noida',     slug: 'noida',     schools: 120,  emoji: '🌆', desc: 'NCR satellite city with growing school options' },
]

export default function CitiesPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAF7F2', paddingTop: '80px' }}>

        {/* Header */}
        <section style={{ background: '#F5F0E8', padding: '56px 48px', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '14px', fontFamily: 'DM Sans,sans-serif' }}>
              <span style={{ width: '20px', height: '1px', background: '#B8860B' }} />Browse by Location
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '52px', color: '#0D1117', letterSpacing: '-1.5px', marginBottom: '10px' }}>
              Schools in Every <em style={{ fontStyle: 'italic', color: '#B8860B' }}>Indian City</em>
            </h1>
            <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '15px', color: '#4A5568', fontWeight: 300 }}>
              {CITIES.reduce((sum, c) => sum + c.schools, 0).toLocaleString('en-IN')}+ verified schools across {CITIES.length} cities — and growing every week.
            </p>
          </div>
        </section>

        {/* Cities grid */}
        <section style={{ padding: '56px 48px 80px' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {CITIES.map(city => (
                <Link key={city.slug} href={`/schools?city=${city.slug}`}
                  style={{ textDecoration: 'none', background: '#fff', border: '1px solid rgba(13,17,23,0.09)', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 10px rgba(13,17,23,0.05)', transition: 'all .25s', display: 'block' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-3px)'; el.style.borderColor = 'rgba(184,134,11,0.35)'; el.style.boxShadow = '0 8px 28px rgba(13,17,23,0.1)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(13,17,23,0.09)'; el.style.boxShadow = '0 2px 10px rgba(13,17,23,0.05)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{city.emoji}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 700, fontSize: '20px', color: '#0D1117', marginBottom: '4px' }}>{city.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#B8860B', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, marginBottom: '8px' }}>
                    <MapPin style={{ width: '10px', height: '10px' }} />{city.schools.toLocaleString('en-IN')} schools
                  </div>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', color: '#718096', lineHeight: 1.55, marginBottom: '14px', fontWeight: 300 }}>{city.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: '#B8860B', fontFamily: 'DM Sans,sans-serif' }}>
                    View Schools <ArrowRight style={{ width: '12px', height: '12px' }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
