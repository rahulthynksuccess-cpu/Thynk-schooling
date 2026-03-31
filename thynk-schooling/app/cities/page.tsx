'use client'
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { MapPin, ArrowRight, ChevronDown, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CITIES_DATA = [
  {name:'Agra',slug:'agra',state:'Uttar Pradesh',emoji:'🕌',schools:200},
  {name:'Ahmedabad',slug:'ahmedabad',state:'Gujarat',emoji:'🏗️',schools:460},
  {name:'Ajmer',slug:'ajmer',state:'Rajasthan',emoji:'🕌',schools:120},
  {name:'Allahabad',slug:'allahabad',state:'Uttar Pradesh',emoji:'🏛️',schools:180},
  {name:'Amritsar',slug:'amritsar',state:'Punjab',emoji:'🙏',schools:140},
  {name:'Aurangabad',slug:'aurangabad',state:'Maharashtra',emoji:'🏯',schools:130},
  {name:'Ayodhya',slug:'ayodhya',state:'Uttar Pradesh',emoji:'🕍',schools:80},
  {name:'Bangalore',slug:'bangalore',state:'Karnataka',emoji:'🌿',schools:860},
  {name:'Bareilly',slug:'bareilly',state:'Uttar Pradesh',emoji:'🏙️',schools:120},
  {name:'Bhopal',slug:'bhopal',state:'Madhya Pradesh',emoji:'🏞️',schools:220},
  {name:'Bhubaneswar',slug:'bhubaneswar',state:'Odisha',emoji:'🏛️',schools:150},
  {name:'Bikaner',slug:'bikaner',state:'Rajasthan',emoji:'🐪',schools:90},
  {name:'Chandigarh',slug:'chandigarh',state:'Punjab',emoji:'🌳',schools:280},
  {name:'Chennai',slug:'chennai',state:'Tamil Nadu',emoji:'🎭',schools:640},
  {name:'Coimbatore',slug:'coimbatore',state:'Tamil Nadu',emoji:'🏭',schools:170},
  {name:'Cuttack',slug:'cuttack',state:'Odisha',emoji:'🌉',schools:100},
  {name:'Dehradun',slug:'dehradun',state:'Uttarakhand',emoji:'🏔️',schools:140},
  {name:'Delhi',slug:'delhi',state:'Delhi',emoji:'🏛️',schools:1240},
  {name:'Dharamshala',slug:'dharamshala',state:'Himachal Pradesh',emoji:'⛰️',schools:60},
  {name:'Durgapur',slug:'durgapur',state:'West Bengal',emoji:'🏭',schools:90},
  {name:'Faridabad',slug:'faridabad',state:'Haryana',emoji:'🏗️',schools:160},
  {name:'Ghaziabad',slug:'ghaziabad',state:'Uttar Pradesh',emoji:'🌆',schools:180},
  {name:'Gorakhpur',slug:'gorakhpur',state:'Uttar Pradesh',emoji:'🏙️',schools:110},
  {name:'Guntur',slug:'guntur',state:'Andhra Pradesh',emoji:'🌶️',schools:100},
  {name:'Gurgaon',slug:'gurgaon',state:'Haryana',emoji:'🏢',schools:130},
  {name:'Guwahati',slug:'guwahati',state:'Assam',emoji:'🌿',schools:120},
  {name:'Gwalior',slug:'gwalior',state:'Madhya Pradesh',emoji:'🏯',schools:130},
  {name:'Haridwar',slug:'haridwar',state:'Uttarakhand',emoji:'🙏',schools:80},
  {name:'Howrah',slug:'howrah',state:'West Bengal',emoji:'🌉',schools:120},
  {name:'Hubli',slug:'hubli',state:'Karnataka',emoji:'🏙️',schools:110},
  {name:'Hyderabad',slug:'hyderabad',state:'Telangana',emoji:'💎',schools:720},
  {name:'Indore',slug:'indore',state:'Madhya Pradesh',emoji:'🏙️',schools:260},
  {name:'Jabalpur',slug:'jabalpur',state:'Madhya Pradesh',emoji:'🌊',schools:120},
  {name:'Jaipur',slug:'jaipur',state:'Rajasthan',emoji:'🏰',schools:380},
  {name:'Jalandhar',slug:'jalandhar',state:'Punjab',emoji:'🏙️',schools:130},
  {name:'Jammu',slug:'jammu',state:'Jammu & Kashmir',emoji:'⛰️',schools:100},
  {name:'Jodhpur',slug:'jodhpur',state:'Rajasthan',emoji:'🏯',schools:150},
  {name:'Kanpur',slug:'kanpur',state:'Uttar Pradesh',emoji:'🏭',schools:210},
  {name:'Kochi',slug:'kochi',state:'Kerala',emoji:'⛵',schools:180},
  {name:'Kolhapur',slug:'kolhapur',state:'Maharashtra',emoji:'🥛',schools:130},
  {name:'Kolkata',slug:'kolkata',state:'West Bengal',emoji:'🎨',schools:520},
  {name:'Kota',slug:'kota',state:'Rajasthan',emoji:'📚',schools:140},
  {name:'Kozhikode',slug:'kozhikode',state:'Kerala',emoji:'🌴',schools:100},
  {name:'Lucknow',slug:'lucknow',state:'Uttar Pradesh',emoji:'🌸',schools:340},
  {name:'Ludhiana',slug:'ludhiana',state:'Punjab',emoji:'🏭',schools:160},
  {name:'Madurai',slug:'madurai',state:'Tamil Nadu',emoji:'🕌',schools:130},
  {name:'Mangalore',slug:'mangalore',state:'Karnataka',emoji:'🌊',schools:120},
  {name:'Mathura',slug:'mathura',state:'Uttar Pradesh',emoji:'🙏',schools:90},
  {name:'Meerut',slug:'meerut',state:'Uttar Pradesh',emoji:'⚔️',schools:170},
  {name:'Moradabad',slug:'moradabad',state:'Uttar Pradesh',emoji:'🏙️',schools:100},
  {name:'Mumbai',slug:'mumbai',state:'Maharashtra',emoji:'🌊',schools:980},
  {name:'Mysore',slug:'mysore',state:'Karnataka',emoji:'🏯',schools:200},
  {name:'Nagpur',slug:'nagpur',state:'Maharashtra',emoji:'🍊',schools:200},
  {name:'Nainital',slug:'nainital',state:'Uttarakhand',emoji:'🏔️',schools:60},
  {name:'Nashik',slug:'nashik',state:'Maharashtra',emoji:'🍇',schools:160},
  {name:'Navi Mumbai',slug:'navi-mumbai',state:'Maharashtra',emoji:'🌆',schools:140},
  {name:'Nellore',slug:'nellore',state:'Andhra Pradesh',emoji:'🌾',schools:90},
  {name:'Noida',slug:'noida',state:'Uttar Pradesh',emoji:'🌆',schools:120},
  {name:'Panaji',slug:'panaji',state:'Goa',emoji:'🏖️',schools:70},
  {name:'Patna',slug:'patna',state:'Bihar',emoji:'🏛️',schools:180},
  {name:'Pimpri-Chinchwad',slug:'pimpri',state:'Maharashtra',emoji:'🏭',schools:120},
  {name:'Pune',slug:'pune',state:'Maharashtra',emoji:'📚',schools:580},
  {name:'Raipur',slug:'raipur',state:'Chhattisgarh',emoji:'🏙️',schools:120},
  {name:'Rajkot',slug:'rajkot',state:'Gujarat',emoji:'🏙️',schools:140},
  {name:'Ranchi',slug:'ranchi',state:'Jharkhand',emoji:'🌿',schools:130},
  {name:'Rishikesh',slug:'rishikesh',state:'Uttarakhand',emoji:'🙏',schools:70},
  {name:'Saharanpur',slug:'saharanpur',state:'Uttar Pradesh',emoji:'🌿',schools:90},
  {name:'Shillong',slug:'shillong',state:'Meghalaya',emoji:'🌧️',schools:80},
  {name:'Shimla',slug:'shimla',state:'Himachal Pradesh',emoji:'❄️',schools:80},
  {name:'Siliguri',slug:'siliguri',state:'West Bengal',emoji:'🍵',schools:100},
  {name:'Solapur',slug:'solapur',state:'Maharashtra',emoji:'🏙️',schools:100},
  {name:'Srinagar',slug:'srinagar',state:'Jammu & Kashmir',emoji:'🌷',schools:90},
  {name:'Surat',slug:'surat',state:'Gujarat',emoji:'💎',schools:160},
  {name:'Thane',slug:'thane',state:'Maharashtra',emoji:'🌆',schools:150},
  {name:'Thiruvananthapuram',slug:'thiruvananthapuram',state:'Kerala',emoji:'🌴',schools:130},
  {name:'Thrissur',slug:'thrissur',state:'Kerala',emoji:'🐘',schools:90},
  {name:'Tiruchirappalli',slug:'tiruchirappalli',state:'Tamil Nadu',emoji:'🏛️',schools:110},
  {name:'Udaipur',slug:'udaipur',state:'Rajasthan',emoji:'🏰',schools:120},
  {name:'Vadodara',slug:'vadodara',state:'Gujarat',emoji:'🏙️',schools:180},
  {name:'Varanasi',slug:'varanasi',state:'Uttar Pradesh',emoji:'🕉️',schools:160},
  {name:'Vijayawada',slug:'vijayawada',state:'Andhra Pradesh',emoji:'🌉',schools:130},
  {name:'Visakhapatnam',slug:'visakhapatnam',state:'Andhra Pradesh',emoji:'🌊',schools:200},
  {name:'Warangal',slug:'warangal',state:'Telangana',emoji:'🏯',schools:100},
]

const STATES = [...new Set(CITIES_DATA.map(c => c.state))].sort()
const sel: React.CSSProperties = { width:'100%', padding:'12px 40px 12px 16px', background:'#fff', border:'1.5px solid rgba(13,17,23,0.12)', borderRadius:'10px', fontSize:'15px', fontFamily:'DM Sans,sans-serif', color:'#0D1117', outline:'none', appearance:'none', cursor:'pointer' }

export default function CitiesPage() {
  const router = useRouter()
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity,  setSelectedCity]  = useState('')
  const [search, setSearch] = useState('')

  const citiesInState = useMemo(() =>
    selectedState ? CITIES_DATA.filter(c => c.state === selectedState).sort((a,b) => a.name.localeCompare(b.name)) : [],
    [selectedState]
  )

  const displayCities = useMemo(() => {
    let list = CITIES_DATA
    if (selectedState) list = list.filter(c => c.state === selectedState)
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    return list.sort((a,b) => a.name.localeCompare(b.name))
  }, [selectedState, search])

  const handleGo = () => {
    if (selectedCity) router.push(`/schools?city=${selectedCity}`)
    else if (selectedState) router.push(`/schools?state=${selectedState.toLowerCase().replace(/\s+/g,'-')}`)
  }

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--ivory,#FAF7F2)', paddingTop:'72px' }}>
        {/* Hero */}
        <section style={{ background:'linear-gradient(150deg,var(--ivory,#FAF7F2),var(--ivory-2,#F5F0E8))', padding:'clamp(48px,7vw,96px) clamp(20px,5vw,80px)', borderBottom:'1px solid rgba(13,17,23,0.07)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'clamp(36px,5vw,56px)' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:11, fontWeight:600, letterSpacing:'.2em', textTransform:'uppercase', color:'#B8860B', marginBottom:18, fontFamily:'DM Sans,sans-serif' }}>
                <span style={{ width:22, height:1.5, background:'#B8860B', display:'block' }} />Browse by City<span style={{ width:22, height:1.5, background:'#B8860B', display:'block' }} />
              </div>
              <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(2.8rem,6vw,5.5rem)', color:'#0D1117', letterSpacing:'-2px', lineHeight:.92, marginBottom:16 }}>
                Schools in Your <em style={{ fontStyle:'italic', color:'#B8860B' }}>City</em>
              </h1>
              <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'clamp(15px,2vw,19px)', color:'#4A5568', fontWeight:300, maxWidth:560, margin:'0 auto 0' }}>
                Find top schools in {CITIES_DATA.length}+ Indian cities — all verified, all real.
              </p>
            </div>

            {/* Filter bar */}
            <div style={{ maxWidth:860, margin:'0 auto', background:'#fff', border:'1.5px solid rgba(13,17,23,0.1)', borderRadius:16, padding:'clamp(16px,3vw,28px)', boxShadow:'0 4px 32px rgba(13,17,23,0.07)', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'end' }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'#718096', fontFamily:'DM Sans,sans-serif', marginBottom:6 }}>State</label>
                  <div style={{ position:'relative' }}>
                    <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedCity('') }} style={sel}>
                      <option value="">All States</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#B8860B', pointerEvents:'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'#718096', fontFamily:'DM Sans,sans-serif', marginBottom:6 }}>City</label>
                  <div style={{ position:'relative' }}>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={sel}>
                      <option value="">{selectedState ? `All cities in ${selectedState}` : 'All Cities'}</option>
                      {(selectedState ? citiesInState : CITIES_DATA.slice().sort((a,b)=>a.name.localeCompare(b.name))).map(c =>
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      )}
                    </select>
                    <ChevronDown style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#B8860B', pointerEvents:'none' }} />
                  </div>
                </div>
                <button onClick={handleGo} style={{ padding:'12px 28px', background:'#B8860B', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, fontFamily:'DM Sans,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', height:48, alignSelf:'flex-end' }}>
                  View Schools <ArrowRight style={{ width:16, height:16 }} />
                </button>
              </div>
              <div style={{ position:'relative' }}>
                <Search style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#B8860B' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Or search city name…"
                  style={{ ...sel, paddingLeft:44, fontSize:14 }} />
              </div>
            </div>
          </div>
        </section>

        {/* Cities grid */}
        <section style={{ padding:'clamp(40px,6vw,80px) clamp(20px,5vw,80px)' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
            {selectedState && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#B8860B', fontWeight:600, marginBottom:20 }}>{displayCities.length} cities in {selectedState}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'clamp(10px,1.5vw,18px)' }}>
              {displayCities.map(city => (
                <Link key={city.slug} href={`/schools?city=${city.slug}`}
                  style={{ textDecoration:'none', background:'#fff', border:'1px solid rgba(13,17,23,0.08)', borderRadius:'clamp(10px,1.2vw,14px)', padding:'clamp(16px,2vw,24px)', boxShadow:'0 2px 12px rgba(13,17,23,0.04)', transition:'all .22s', display:'block' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform='translateY(-4px)'; el.style.borderColor='rgba(184,134,11,0.3)'; el.style.boxShadow='0 12px 36px rgba(13,17,23,0.1)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform='none'; el.style.borderColor='rgba(13,17,23,0.08)'; el.style.boxShadow='0 2px 12px rgba(13,17,23,0.04)' }}>
                  <div style={{ fontSize:'clamp(22px,3vw,32px)', marginBottom:10 }}>{city.emoji}</div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:'clamp(16px,1.8vw,21px)', color:'#0D1117', marginBottom:3 }}>{city.name}</div>
                  <div style={{ fontSize:11, color:'#B8860B', fontFamily:'DM Sans,sans-serif', fontWeight:600, marginBottom:4, display:'flex', alignItems:'center', gap:3 }}>
                    <MapPin style={{ width:10, height:10 }} />{city.schools.toLocaleString('en-IN')} schools
                  </div>
                  <div style={{ fontSize:11, color:'#718096', fontFamily:'DM Sans,sans-serif', marginBottom:10 }}>{city.state}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, color:'#B8860B', fontFamily:'DM Sans,sans-serif' }}>
                    View Schools <ArrowRight style={{ width:11, height:11 }} />
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
