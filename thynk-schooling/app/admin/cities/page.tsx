'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Plus, Trash2, Save, Loader2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

// Default 100 Indian cities
const DEFAULT_CITIES = [
  ['Delhi','delhi','Delhi'],['Mumbai','mumbai','Maharashtra'],['Bangalore','bangalore','Karnataka'],
  ['Hyderabad','hyderabad','Telangana'],['Chennai','chennai','Tamil Nadu'],['Pune','pune','Maharashtra'],
  ['Kolkata','kolkata','West Bengal'],['Ahmedabad','ahmedabad','Gujarat'],['Jaipur','jaipur','Rajasthan'],
  ['Lucknow','lucknow','Uttar Pradesh'],['Surat','surat','Gujarat'],['Kochi','kochi','Kerala'],
  ['Chandigarh','chandigarh','Punjab'],['Nagpur','nagpur','Maharashtra'],['Indore','indore','Madhya Pradesh'],
  ['Bhopal','bhopal','Madhya Pradesh'],['Vadodara','vadodara','Gujarat'],['Gurgaon','gurgaon','Haryana'],
  ['Noida','noida','Uttar Pradesh'],['Coimbatore','coimbatore','Tamil Nadu'],['Visakhapatnam','visakhapatnam','Andhra Pradesh'],
  ['Mysore','mysore','Karnataka'],['Nashik','nashik','Maharashtra'],['Patna','patna','Bihar'],
  ['Ranchi','ranchi','Jharkhand'],['Bhubaneswar','bhubaneswar','Odisha'],['Guwahati','guwahati','Assam'],
  ['Dehradun','dehradun','Uttarakhand'],['Agra','agra','Uttar Pradesh'],['Varanasi','varanasi','Uttar Pradesh'],
  ['Meerut','meerut','Uttar Pradesh'],['Faridabad','faridabad','Haryana'],['Amritsar','amritsar','Punjab'],
  ['Kolhapur','kolhapur','Maharashtra'],['Thiruvananthapuram','thiruvananthapuram','Kerala'],
  ['Srinagar','srinagar','Jammu & Kashmir'],['Jodhpur','jodhpur','Rajasthan'],['Aurangabad','aurangabad','Maharashtra'],
  ['Raipur','raipur','Chhattisgarh'],['Vijayawada','vijayawada','Andhra Pradesh'],['Rajkot','rajkot','Gujarat'],
  ['Madurai','madurai','Tamil Nadu'],['Jabalpur','jabalpur','Madhya Pradesh'],['Jalandhar','jalandhar','Punjab'],
  ['Udaipur','udaipur','Rajasthan'],['Mangalore','mangalore','Karnataka'],['Hubli','hubli','Karnataka'],
  ['Thane','thane','Maharashtra'],['Navi Mumbai','navi-mumbai','Maharashtra'],['Pimpri-Chinchwad','pimpri-chinchwad','Maharashtra'],
  ['Ludhiana','ludhiana','Punjab'],['Kanpur','kanpur','Uttar Pradesh'],['Allahabad','allahabad','Uttar Pradesh'],
  ['Ghaziabad','ghaziabad','Uttar Pradesh'],['Howrah','howrah','West Bengal'],['Navi Mumbai','navi-mumbai-2','Maharashtra'],
  ['Solapur','solapur','Maharashtra'],['Tiruchirappalli','tiruchirappalli','Tamil Nadu'],['Bareilly','bareilly','Uttar Pradesh'],
  ['Moradabad','moradabad','Uttar Pradesh'],['Mysuru','mysuru','Karnataka'],['Gwalior','gwalior','Madhya Pradesh'],
  ['Aligarh','aligarh','Uttar Pradesh'],['Saharanpur','saharanpur','Uttar Pradesh'],['Gorakhpur','gorakhpur','Uttar Pradesh'],
  ['Warangal','warangal','Telangana'],['Guntur','guntur','Andhra Pradesh'],['Bhiwandi','bhiwandi','Maharashtra'],
  ['Cuttack','cuttack','Odisha'],['Firozabad','firozabad','Uttar Pradesh'],['Kota','kota','Rajasthan'],
  ['Bhilai','bhilai','Chhattisgarh'],['Durgapur','durgapur','West Bengal'],['Ajmer','ajmer','Rajasthan'],
  ['Siliguri','siliguri','West Bengal'],['Kozhikode','kozhikode','Kerala'],['Thrissur','thrissur','Kerala'],
  ['Bikaner','bikaner','Rajasthan'],['Nellore','nellore','Andhra Pradesh'],['Kolkata North','kolkata-north','West Bengal'],
  ['Dibrugarh','dibrugarh','Assam'],['Jammu','jammu','Jammu & Kashmir'],['Shillong','shillong','Meghalaya'],
  ['Imphal','imphal','Manipur'],['Aizawl','aizawl','Mizoram'],['Kohima','kohima','Nagaland'],
  ['Gangtok','gangtok','Sikkim'],['Port Blair','port-blair','Andaman & Nicobar'],['Panaji','panaji','Goa'],
  ['Margao','margao','Goa'],['Shimla','shimla','Himachal Pradesh'],['Dharamshala','dharamshala','Himachal Pradesh'],
  ['Haridwar','haridwar','Uttarakhand'],['Rishikesh','rishikesh','Uttarakhand'],['Nainital','nainital','Uttarakhand'],
  ['Mathura','mathura','Uttar Pradesh'],['Vrindavan','vrindavan','Uttar Pradesh'],['Ayodhya','ayodhya','Uttar Pradesh'],
].map(([name, slug, state], i) => ({ name, slug, state, sort_order: i, is_active: true, id: slug }))

const INDIAN_STATES = [
  'Andaman & Nicobar','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chandigarh','Chhattisgarh','Dadra & Nagar Haveli','Daman & Diu','Delhi',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand',
  'Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
]

type City = { id: string; name: string; slug: string; state: string; sort_order: number; is_active: boolean }

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newState, setNewState] = useState('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    fetch('/api/admin/cities', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setCities(d.cities?.length ? d.cities : DEFAULT_CITIES as any))
      .catch(() => setCities(DEFAULT_CITIES as any))
      .finally(() => setLoading(false))
  }, [])

  const seedDefaults = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities: DEFAULT_CITIES }),
      })
      if (!res.ok) throw new Error('Failed')
      setCities(DEFAULT_CITIES as any)
      toast.success(`✅ ${DEFAULT_CITIES.length} default cities seeded!`)
    } catch(e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('✅ Cities saved!')
    } catch(e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const addCity = () => {
    if (!newName.trim()) return
    const slug = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (cities.find(c => c.slug === slug)) { toast.error('City already exists'); return }
    setCities(prev => [...prev, { id: slug, name: newName.trim(), slug, state: newState.trim(), sort_order: prev.length, is_active: true }])
    setNewName(''); setNewState('')
  }

  const remove = (slug: string) => setCities(prev => prev.filter(c => c.slug !== slug))

  const update = (slug: string, key: keyof City, val: string) =>
    setCities(prev => prev.map(c => c.slug === slug ? { ...c, [key]: val } : c))

  const inp: React.CSSProperties = { background:'var(--admin-card-bg,rgba(255,255,255,0.06))', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'7px 11px', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none' }

  return (
    <AdminLayout title="SEO Cities Manager" subtitle="Manage all city pages and footer city links — used for SEO">
      {/* Toolbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16, alignItems:'center' }}>
        <span style={{ color:'var(--admin-text-muted,rgba(255,255,255,0.4))', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>{cities.length} cities</span>
        <button onClick={seedDefaults} disabled={saving} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(184,134,11,0.15)', border:'1px solid rgba(184,134,11,0.3)', color:'#E8C547', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'DM Sans,sans-serif' }}>
          🌱 Seed 100 Default Cities
        </button>
        <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:9, background:'#B8860B', border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'DM Sans,sans-serif', marginLeft:'auto', opacity:saving?.7:1 }}>
          {saving ? <><Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} /> Saving…</> : <><Save style={{ width:13, height:13 }} /> Save All</>}
        </button>
      </div>

      {/* Add new */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', background:'var(--admin-card-bg,rgba(255,255,255,0.04))', border:'1px solid rgba(184,134,11,0.2)', borderRadius:10, padding:'10px 14px' }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter' && addCity()} placeholder="City name…" style={{ ...inp, flex:1 }} />
        <select value={newState} onChange={e => setNewState(e.target.value)} style={{ ...inp, width:190 }}>
          <option value="">Select state…</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={addCity} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(184,134,11,0.2)', border:'1px solid rgba(184,134,11,0.3)', color:'#E8C547', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
          <Plus style={{ width:13, height:13 }} /> Add City
        </button>
      </div>

      {/* City list */}
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {loading ? <div style={{ textAlign:'center', padding:40, color:'var(--admin-text-faint,rgba(255,255,255,0.3))', fontFamily:'DM Sans,sans-serif' }}>Loading…</div> :
          cities.map(city => (
            <div key={city.slug} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 140px 36px', gap:8, alignItems:'center', background:'var(--admin-card-bg,rgba(255,255,255,0.03))', border:'1px solid var(--admin-border,rgba(255,255,255,0.07))', borderRadius:8, padding:'7px 12px' }}>
              <input value={city.name} onChange={e => update(city.slug, 'name', e.target.value)} style={{ ...inp, padding:'5px 9px', fontSize:12 }} />
              <select value={city.state} onChange={e => update(city.slug, 'state', e.target.value)} style={{ ...inp, padding:'5px 9px', fontSize:12 }}>
                <option value="">Select state…</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <code style={{ color:'rgba(184,134,11,0.7)', fontSize:11, fontFamily:'monospace', padding:'4px 8px', background:'rgba(184,134,11,0.06)', borderRadius:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>/schools?city={city.slug}</code>
              <button onClick={() => remove(city.slug)} style={{ padding:6, background:'none', border:'none', color:'var(--admin-text-faint,rgba(255,255,255,0.2))', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#f87171'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.2)'}>
                <Trash2 style={{ width:13, height:13 }} />
              </button>
            </div>
          ))
        }
      </div>
    </AdminLayout>
  )
}
