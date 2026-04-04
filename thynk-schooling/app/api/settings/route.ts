export const dynamic = 'force-dynamic'
/**
 * Consolidated Settings Route
 *
 * GET    /api/settings?action=dropdown&category=...  — get dropdown options
 * POST   /api/settings?action=dropdown               — create/upsert option
 * PUT    /api/settings?action=dropdown&id=...        — update option
 * DELETE /api/settings?action=dropdown&id=...        — delete option
 * POST   /api/settings?action=seed                   — seed dropdown data
 * GET    /api/settings?action=seed                   — check seed status
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureDropdownTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS dropdown_options (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category     VARCHAR(60)  NOT NULL,
      label        VARCHAR(120) NOT NULL,
      value        VARCHAR(120) NOT NULL,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      parent_value VARCHAR(120),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category, value)
    )
  `).catch(() => {})
}

// ─── dropdown ─────────────────────────────────────────────────────────────────

async function getDropdown(req: NextRequest) {
  await ensureDropdownTable()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 })
  const parentValue = searchParams.get('parentValue')
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const conditions: string[] = ['category=$1']; const params: any[] = [category]
  if (parentValue) { params.push(parentValue); conditions.push(`parent_value=$${params.length}`) }
  if (!includeInactive) conditions.push('is_active=true')
  const result = await db.query(`SELECT id,category,label,value,sort_order AS "sortOrder",is_active AS "isActive",parent_value AS "parentValue" FROM dropdown_options WHERE ${conditions.join(' AND ')} ORDER BY label ASC`, params)
  return NextResponse.json({ options: result.rows })
}

async function createDropdownOption(req: NextRequest) {
  await ensureDropdownTable()
  const { category, label, value, sortOrder = 0, parentValue } = await req.json()
  if (!category || !label || !value) return NextResponse.json({ error: 'category, label and value are required' }, { status: 400 })
  const result = await db.query(
    `INSERT INTO dropdown_options (category,label,value,sort_order,parent_value) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (category,value) DO UPDATE SET label=$2,sort_order=$4
     RETURNING id,category,label,value,sort_order AS "sortOrder",is_active AS "isActive",parent_value AS "parentValue"`,
    [category, label, value, sortOrder, parentValue||null]
  )
  return NextResponse.json({ option: result.rows[0] })
}

async function updateDropdownOption(req: NextRequest) {
  await ensureDropdownTable()
  const id = new URL(req.url).searchParams.get('id')
  const { label, value, sortOrder, isActive, parentValue } = await req.json()
  const result = await db.query(
    `UPDATE dropdown_options SET label=COALESCE($1,label),value=COALESCE($2,value),sort_order=COALESCE($3,sort_order),is_active=COALESCE($4,is_active),parent_value=$5 WHERE id=$6
     RETURNING id,category,label,value,sort_order AS "sortOrder",is_active AS "isActive",parent_value AS "parentValue"`,
    [label||null, value||null, sortOrder??null, isActive??null, parentValue||null, id]
  )
  if (!result.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ option: result.rows[0] })
}

async function deleteDropdownOption(req: NextRequest) {
  await ensureDropdownTable()
  const id = new URL(req.url).searchParams.get('id')
  await db.query('DELETE FROM dropdown_options WHERE id=$1', [id])
  return NextResponse.json({ success: true })
}

// ─── seed data ────────────────────────────────────────────────────────────────

const SEED_DATA = [
  // Boards
  ...['CBSE','ICSE','IB (International Baccalaureate)','Cambridge (IGCSE / A-Level)','Maharashtra State Board','Karnataka State Board','Tamil Nadu State Board','Delhi State Board','UP State Board','Gujarat State Board','Rajasthan State Board','Kerala State Board','West Bengal State Board','NIOS'].map((label,i) => ({ category:'board', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''), sortOrder: i+1 })),
  // School Types
  ...['Public / Government','Private','International','Boarding','Day Boarding','Aided','Unaided'].map((label,i) => ({ category:'school_type', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''), sortOrder: i+1 })),
  // Gender
  { category:'gender_policy', label:'Co-educational', value:'co_ed', sortOrder:1 },
  { category:'gender_policy', label:'Boys Only', value:'boys', sortOrder:2 },
  { category:'gender_policy', label:'Girls Only', value:'girls', sortOrder:3 },
  // Medium
  ...['English','Hindi','English & Hindi','Marathi','Kannada','Tamil','Telugu','Gujarati','Bengali'].map((label,i) => ({ category:'medium', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''), sortOrder: i+1 })),
  // Class Levels
  { category:'class_level', label:'Pre-Primary (Nursery / KG)', value:'pre_primary', sortOrder:1 },
  { category:'class_level', label:'Primary (Class 1–5)', value:'primary', sortOrder:2 },
  { category:'class_level', label:'Middle School (Class 6–8)', value:'middle', sortOrder:3 },
  { category:'class_level', label:'Secondary (Class 9–10)', value:'secondary', sortOrder:4 },
  { category:'class_level', label:'Senior Secondary (Class 11–12)', value:'senior_secondary', sortOrder:5 },
  { category:'class_level', label:'K–12 (Full School)', value:'k12', sortOrder:6 },
  // Academic Year
  { category:'academic_year', label:'2024–2025', value:'2024_2025', sortOrder:1 },
  { category:'academic_year', label:'2025–2026', value:'2025_2026', sortOrder:2 },
  { category:'academic_year', label:'2026–2027', value:'2026_2027', sortOrder:3 },
  // Cities (key ones)
  ...['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Lucknow','Surat','Kochi','Chandigarh','Nagpur','Indore'].map((label,i) => ({ category:'city', label, value: label.toLowerCase(), sortOrder: i+1 })),
  // States
  ...['Maharashtra','Delhi','Karnataka','Tamil Nadu','Telangana','Uttar Pradesh','Gujarat','Rajasthan','West Bengal','Kerala','Punjab','Haryana','Madhya Pradesh','Andhra Pradesh','Bihar','Odisha','Jharkhand','Assam','Uttarakhand','Goa'].map((label,i) => ({ category:'state', label, value: label.toLowerCase().replace(/\s+/g,'_'), sortOrder: i+1 })),
  // Facilities
  ...['Transport / School Bus','Swimming Pool','Sports Ground','Science Lab','Computer Lab','Library','Cafeteria / Canteen','Hostel / Boarding','Infirmary / Medical Room','Smart Classrooms','Auditorium','CCTV Surveillance','Wi-Fi Campus','Indoor Sports Hall'].map((label,i) => ({ category:'facility', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''), sortOrder: i+1 })),
  // Sports
  ...['Cricket','Football','Basketball','Volleyball','Badminton','Table Tennis','Athletics / Track','Swimming','Kabaddi','Chess','Yoga','Martial Arts','Skating','Gymnastics'].map((label,i) => ({ category:'sport', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''), sortOrder: i+1 })),
  // Extracurricular
  ...['Music','Dance','Drama / Theatre','Art & Craft','Robotics & Coding','Debate Club','Quiz Club','Model UN (MUN)','Photography','Environment Club','NCC','NSS','Scouts & Guides','Entrepreneurship'].map((label,i) => ({ category:'extracurricular', label, value: label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''), sortOrder: i+1 })),
  // Misc lookups
  ...['Hindi','English','Sanskrit','French','German','Spanish','Marathi','Kannada','Tamil','Telugu','Bengali','Gujarati','Punjabi'].map((label,i) => ({ category:'language', label, value: label.toLowerCase(), sortOrder: i+1 })),
  { category:'gender', label:'Male', value:'male', sortOrder:1 }, { category:'gender', label:'Female', value:'female', sortOrder:2 }, { category:'gender', label:'Other', value:'other', sortOrder:3 },
  ...['A+','A−','B+','B−','AB+','AB−','O+','O−'].map((label,i) => ({ category:'blood_group', label, value: label.toLowerCase().replace('+','_pos').replace('−','_neg'), sortOrder: i+1 })),
]

async function seedDropdown() {
  await ensureDropdownTable()
  let inserted = 0, skipped = 0
  for (const row of SEED_DATA) {
    const res = await db.query(`INSERT INTO dropdown_options (category,label,value,sort_order) VALUES ($1,$2,$3,$4) ON CONFLICT (category,value) DO NOTHING RETURNING id`, [row.category, row.label, row.value, row.sortOrder||0])
    if (res.rowCount && res.rowCount > 0) inserted++; else skipped++
  }
  return NextResponse.json({ success: true, message: `Seeded ${inserted} options. Skipped ${skipped}.`, inserted, skipped, total: SEED_DATA.length })
}

async function getSeedStatus() {
  const res = await db.query('SELECT category, COUNT(*) as count FROM dropdown_options GROUP BY category ORDER BY category').catch(() => ({ rows: [] }))
  return NextResponse.json({ categories: res.rows, totalCategories: res.rows.length, isEmpty: res.rows.length === 0 })
}

// ─── router ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'dropdown') return await getDropdown(req)
    if (action === 'seed')     return await getSeedStatus()
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'dropdown') return await createDropdownOption(req)
    if (action === 'seed')     return await seedDropdown()
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'dropdown') return await updateDropdownOption(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')
  try {
    if (action === 'dropdown') return await deleteDropdownOption(req)
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
