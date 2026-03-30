export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const SEED_DATA: Array<{ category: string; label: string; value: string; sortOrder?: number }> = [
  // Boards
  { category: 'board', label: 'CBSE',                                  value: 'cbse',            sortOrder: 1 },
  { category: 'board', label: 'ICSE',                                  value: 'icse',            sortOrder: 2 },
  { category: 'board', label: 'IB (International Baccalaureate)',       value: 'ib',              sortOrder: 3 },
  { category: 'board', label: 'Cambridge (IGCSE / A-Level)',            value: 'cambridge',       sortOrder: 4 },
  { category: 'board', label: 'Maharashtra State Board',                value: 'maharashtra',     sortOrder: 5 },
  { category: 'board', label: 'Karnataka State Board',                  value: 'karnataka',       sortOrder: 6 },
  { category: 'board', label: 'Tamil Nadu State Board',                 value: 'tamilnadu',       sortOrder: 7 },
  { category: 'board', label: 'Delhi State Board',                      value: 'delhi_state',     sortOrder: 8 },
  { category: 'board', label: 'UP State Board',                         value: 'up_state',        sortOrder: 9 },
  { category: 'board', label: 'Gujarat State Board',                    value: 'gujarat',         sortOrder: 10 },
  { category: 'board', label: 'Rajasthan State Board',                  value: 'rajasthan',       sortOrder: 11 },
  { category: 'board', label: 'Kerala State Board',                     value: 'kerala',          sortOrder: 12 },
  { category: 'board', label: 'West Bengal State Board',                value: 'west_bengal',     sortOrder: 13 },
  { category: 'board', label: 'NIOS',                                   value: 'nios',            sortOrder: 14 },
  // School Types
  { category: 'school_type', label: 'Public / Government',              value: 'government',      sortOrder: 1 },
  { category: 'school_type', label: 'Private',                          value: 'private',         sortOrder: 2 },
  { category: 'school_type', label: 'International',                    value: 'international',   sortOrder: 3 },
  { category: 'school_type', label: 'Boarding',                         value: 'boarding',        sortOrder: 4 },
  { category: 'school_type', label: 'Day Boarding',                     value: 'day_boarding',    sortOrder: 5 },
  { category: 'school_type', label: 'Aided',                            value: 'aided',           sortOrder: 6 },
  { category: 'school_type', label: 'Unaided',                          value: 'unaided',         sortOrder: 7 },
  // Gender Policy
  { category: 'gender_policy', label: 'Co-educational',                 value: 'co_ed',           sortOrder: 1 },
  { category: 'gender_policy', label: 'Boys Only',                      value: 'boys',            sortOrder: 2 },
  { category: 'gender_policy', label: 'Girls Only',                     value: 'girls',           sortOrder: 3 },
  // Medium
  { category: 'medium', label: 'English',                               value: 'english',         sortOrder: 1 },
  { category: 'medium', label: 'Hindi',                                 value: 'hindi',           sortOrder: 2 },
  { category: 'medium', label: 'English & Hindi',                       value: 'english_hindi',   sortOrder: 3 },
  { category: 'medium', label: 'Marathi',                               value: 'marathi',         sortOrder: 4 },
  { category: 'medium', label: 'Kannada',                               value: 'kannada',         sortOrder: 5 },
  { category: 'medium', label: 'Tamil',                                 value: 'tamil',           sortOrder: 6 },
  { category: 'medium', label: 'Telugu',                                value: 'telugu',          sortOrder: 7 },
  { category: 'medium', label: 'Gujarati',                              value: 'gujarati',        sortOrder: 8 },
  { category: 'medium', label: 'Bengali',                               value: 'bengali',         sortOrder: 9 },
  // Class Levels
  { category: 'class_level', label: 'Pre-Primary (Nursery / KG)',       value: 'pre_primary',     sortOrder: 1 },
  { category: 'class_level', label: 'Primary (Class 1–5)',              value: 'primary',         sortOrder: 2 },
  { category: 'class_level', label: 'Middle School (Class 6–8)',        value: 'middle',          sortOrder: 3 },
  { category: 'class_level', label: 'Secondary (Class 9–10)',           value: 'secondary',       sortOrder: 4 },
  { category: 'class_level', label: 'Senior Secondary (Class 11–12)',   value: 'senior_secondary',sortOrder: 5 },
  { category: 'class_level', label: 'K–12 (Full School)',               value: 'k12',             sortOrder: 6 },
  // Academic Year
  { category: 'academic_year', label: '2024–2025',                      value: '2024_2025',       sortOrder: 1 },
  { category: 'academic_year', label: '2025–2026',                      value: '2025_2026',       sortOrder: 2 },
  { category: 'academic_year', label: '2026–2027',                      value: '2026_2027',       sortOrder: 3 },
  // Cities
  { category: 'city', label: 'Mumbai',        value: 'mumbai',        sortOrder: 1 },
  { category: 'city', label: 'Delhi',         value: 'delhi',         sortOrder: 2 },
  { category: 'city', label: 'Bangalore',     value: 'bangalore',     sortOrder: 3 },
  { category: 'city', label: 'Hyderabad',     value: 'hyderabad',     sortOrder: 4 },
  { category: 'city', label: 'Chennai',       value: 'chennai',       sortOrder: 5 },
  { category: 'city', label: 'Pune',          value: 'pune',          sortOrder: 6 },
  { category: 'city', label: 'Kolkata',       value: 'kolkata',       sortOrder: 7 },
  { category: 'city', label: 'Ahmedabad',     value: 'ahmedabad',     sortOrder: 8 },
  { category: 'city', label: 'Jaipur',        value: 'jaipur',        sortOrder: 9 },
  { category: 'city', label: 'Lucknow',       value: 'lucknow',       sortOrder: 10 },
  { category: 'city', label: 'Surat',         value: 'surat',         sortOrder: 11 },
  { category: 'city', label: 'Kochi',         value: 'kochi',         sortOrder: 12 },
  { category: 'city', label: 'Chandigarh',    value: 'chandigarh',    sortOrder: 13 },
  { category: 'city', label: 'Nagpur',        value: 'nagpur',        sortOrder: 14 },
  { category: 'city', label: 'Indore',        value: 'indore',        sortOrder: 15 },
  { category: 'city', label: 'Bhopal',        value: 'bhopal',        sortOrder: 16 },
  { category: 'city', label: 'Vadodara',      value: 'vadodara',      sortOrder: 17 },
  { category: 'city', label: 'Thiruvananthapuram', value: 'trivandrum', sortOrder: 18 },
  { category: 'city', label: 'Gurgaon',       value: 'gurgaon',       sortOrder: 19 },
  { category: 'city', label: 'Noida',         value: 'noida',         sortOrder: 20 },
  { category: 'city', label: 'Coimbatore',    value: 'coimbatore',    sortOrder: 21 },
  { category: 'city', label: 'Visakhapatnam', value: 'visakhapatnam', sortOrder: 22 },
  { category: 'city', label: 'Mysore',        value: 'mysore',        sortOrder: 23 },
  { category: 'city', label: 'Nashik',        value: 'nashik',        sortOrder: 24 },
  { category: 'city', label: 'Patna',         value: 'patna',         sortOrder: 25 },
  { category: 'city', label: 'Ranchi',        value: 'ranchi',        sortOrder: 26 },
  { category: 'city', label: 'Bhubaneswar',   value: 'bhubaneswar',   sortOrder: 27 },
  { category: 'city', label: 'Guwahati',      value: 'guwahati',      sortOrder: 28 },
  { category: 'city', label: 'Dehradun',      value: 'dehradun',      sortOrder: 29 },
  { category: 'city', label: 'Agra',          value: 'agra',          sortOrder: 30 },
  { category: 'city', label: 'Varanasi',      value: 'varanasi',      sortOrder: 31 },
  { category: 'city', label: 'Meerut',        value: 'meerut',        sortOrder: 32 },
  { category: 'city', label: 'Faridabad',     value: 'faridabad',     sortOrder: 33 },
  { category: 'city', label: 'Amritsar',      value: 'amritsar',      sortOrder: 34 },
  { category: 'city', label: 'Kolhapur',      value: 'kolhapur',      sortOrder: 35 },
  // States
  { category: 'state', label: 'Maharashtra',     value: 'maharashtra',   sortOrder: 1 },
  { category: 'state', label: 'Delhi',            value: 'delhi',         sortOrder: 2 },
  { category: 'state', label: 'Karnataka',        value: 'karnataka',     sortOrder: 3 },
  { category: 'state', label: 'Tamil Nadu',       value: 'tamil_nadu',    sortOrder: 4 },
  { category: 'state', label: 'Telangana',        value: 'telangana',     sortOrder: 5 },
  { category: 'state', label: 'Uttar Pradesh',    value: 'uttar_pradesh', sortOrder: 6 },
  { category: 'state', label: 'Gujarat',          value: 'gujarat',       sortOrder: 7 },
  { category: 'state', label: 'Rajasthan',        value: 'rajasthan',     sortOrder: 8 },
  { category: 'state', label: 'West Bengal',      value: 'west_bengal',   sortOrder: 9 },
  { category: 'state', label: 'Kerala',           value: 'kerala',        sortOrder: 10 },
  { category: 'state', label: 'Punjab',           value: 'punjab',        sortOrder: 11 },
  { category: 'state', label: 'Haryana',          value: 'haryana',       sortOrder: 12 },
  { category: 'state', label: 'Madhya Pradesh',   value: 'madhya_pradesh',sortOrder: 13 },
  { category: 'state', label: 'Andhra Pradesh',   value: 'andhra_pradesh',sortOrder: 14 },
  { category: 'state', label: 'Bihar',            value: 'bihar',         sortOrder: 15 },
  { category: 'state', label: 'Odisha',           value: 'odisha',        sortOrder: 16 },
  { category: 'state', label: 'Jharkhand',        value: 'jharkhand',     sortOrder: 17 },
  { category: 'state', label: 'Assam',            value: 'assam',         sortOrder: 18 },
  { category: 'state', label: 'Uttarakhand',      value: 'uttarakhand',   sortOrder: 19 },
  { category: 'state', label: 'Goa',              value: 'goa',           sortOrder: 20 },
  // Religion
  { category: 'religion', label: 'Secular / Non-denominational', value: 'secular',    sortOrder: 1 },
  { category: 'religion', label: 'Christian',                    value: 'christian',  sortOrder: 2 },
  { category: 'religion', label: 'Hindu',                        value: 'hindu',      sortOrder: 3 },
  { category: 'religion', label: 'Muslim',                       value: 'muslim',     sortOrder: 4 },
  { category: 'religion', label: 'Sikh',                         value: 'sikh',       sortOrder: 5 },
  { category: 'religion', label: 'Jain',                         value: 'jain',       sortOrder: 6 },
  // Recognition
  { category: 'recognition', label: 'Recognised by State Govt',  value: 'state',      sortOrder: 1 },
  { category: 'recognition', label: 'Recognised by Central Govt',value: 'central',    sortOrder: 2 },
  { category: 'recognition', label: 'NAAC Accredited',           value: 'naac',       sortOrder: 3 },
  { category: 'recognition', label: 'ISO Certified',             value: 'iso',        sortOrder: 4 },
  // Blood Group
  { category: 'blood_group', label: 'A+',  value: 'a_pos',  sortOrder: 1 },
  { category: 'blood_group', label: 'A−',  value: 'a_neg',  sortOrder: 2 },
  { category: 'blood_group', label: 'B+',  value: 'b_pos',  sortOrder: 3 },
  { category: 'blood_group', label: 'B−',  value: 'b_neg',  sortOrder: 4 },
  { category: 'blood_group', label: 'AB+', value: 'ab_pos', sortOrder: 5 },
  { category: 'blood_group', label: 'AB−', value: 'ab_neg', sortOrder: 6 },
  { category: 'blood_group', label: 'O+',  value: 'o_pos',  sortOrder: 7 },
  { category: 'blood_group', label: 'O−',  value: 'o_neg',  sortOrder: 8 },
  // Gender
  { category: 'gender', label: 'Male',   value: 'male',   sortOrder: 1 },
  { category: 'gender', label: 'Female', value: 'female', sortOrder: 2 },
  { category: 'gender', label: 'Other',  value: 'other',  sortOrder: 3 },
  // Occupation
  { category: 'occupation', label: 'Salaried — Private',  value: 'salaried_private', sortOrder: 1 },
  { category: 'occupation', label: 'Salaried — Govt',     value: 'salaried_govt',    sortOrder: 2 },
  { category: 'occupation', label: 'Self Employed',       value: 'self_employed',    sortOrder: 3 },
  { category: 'occupation', label: 'Business Owner',      value: 'business',         sortOrder: 4 },
  { category: 'occupation', label: 'Professional',        value: 'professional',     sortOrder: 5 },
  { category: 'occupation', label: 'Homemaker',           value: 'homemaker',        sortOrder: 6 },
  { category: 'occupation', label: 'Retired',             value: 'retired',          sortOrder: 7 },
  // Income Range
  { category: 'income_range', label: 'Below ₹3 LPA',     value: 'below_3l',    sortOrder: 1 },
  { category: 'income_range', label: '₹3–6 LPA',         value: '3_6l',        sortOrder: 2 },
  { category: 'income_range', label: '₹6–12 LPA',        value: '6_12l',       sortOrder: 3 },
  { category: 'income_range', label: '₹12–25 LPA',       value: '12_25l',      sortOrder: 4 },
  { category: 'income_range', label: '₹25–50 LPA',       value: '25_50l',      sortOrder: 5 },
  { category: 'income_range', label: 'Above ₹50 LPA',    value: 'above_50l',   sortOrder: 6 },
  // Lead Status
  { category: 'lead_status', label: 'New',          value: 'new',          sortOrder: 1 },
  { category: 'lead_status', label: 'Contacted',    value: 'contacted',    sortOrder: 2 },
  { category: 'lead_status', label: 'Interested',   value: 'interested',   sortOrder: 3 },
  { category: 'lead_status', label: 'Not Interested',value:'not_interested',sortOrder: 4 },
  { category: 'lead_status', label: 'Converted',    value: 'converted',    sortOrder: 5 },
  { category: 'lead_status', label: 'Junk',         value: 'junk',         sortOrder: 6 },
  // Application Status
  { category: 'application_status', label: 'Submitted',   value: 'submitted',   sortOrder: 1 },
  { category: 'application_status', label: 'Under Review', value: 'under_review',sortOrder: 2 },
  { category: 'application_status', label: 'Shortlisted',  value: 'shortlisted', sortOrder: 3 },
  { category: 'application_status', label: 'Interview',    value: 'interview',   sortOrder: 4 },
  { category: 'application_status', label: 'Accepted',     value: 'accepted',    sortOrder: 5 },
  { category: 'application_status', label: 'Rejected',     value: 'rejected',    sortOrder: 6 },
  { category: 'application_status', label: 'Waitlisted',   value: 'waitlisted',  sortOrder: 7 },
  { category: 'application_status', label: 'Withdrawn',    value: 'withdrawn',   sortOrder: 8 },
  // Lead Source
  { category: 'source', label: 'Website',      value: 'website',       sortOrder: 1 },
  { category: 'source', label: 'Google Ads',   value: 'google_ads',    sortOrder: 2 },
  { category: 'source', label: 'Facebook',     value: 'facebook',      sortOrder: 3 },
  { category: 'source', label: 'Instagram',    value: 'instagram',     sortOrder: 4 },
  { category: 'source', label: 'Referral',     value: 'referral',      sortOrder: 5 },
  { category: 'source', label: 'Walk-in',      value: 'walk_in',       sortOrder: 6 },
  { category: 'source', label: 'School Fair',  value: 'school_fair',   sortOrder: 7 },
  { category: 'source', label: 'WhatsApp',     value: 'whatsapp',      sortOrder: 8 },
  { category: 'source', label: 'Other',        value: 'other',         sortOrder: 9 },
  // How Did You Hear
  { category: 'how_did_you_hear', label: 'Google Search',   value: 'google',      sortOrder: 1 },
  { category: 'how_did_you_hear', label: 'Social Media',    value: 'social',      sortOrder: 2 },
  { category: 'how_did_you_hear', label: 'Friend / Family', value: 'referral',    sortOrder: 3 },
  { category: 'how_did_you_hear', label: 'Advertisement',   value: 'ad',          sortOrder: 4 },
  { category: 'how_did_you_hear', label: 'School Website',  value: 'school_site', sortOrder: 5 },
  { category: 'how_did_you_hear', label: 'Other',           value: 'other',       sortOrder: 6 },
]

export async function POST() {
  try {
    await pool.query(`
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

    let inserted = 0
    let skipped  = 0

    for (const row of SEED_DATA) {
      const res = await pool.query(
        `INSERT INTO dropdown_options (category, label, value, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (category, value) DO NOTHING
         RETURNING id`,
        [row.category, row.label, row.value, row.sortOrder ?? 0]
      )
      if (res.rowCount && res.rowCount > 0) inserted++
      else skipped++
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} options. Skipped ${skipped} already-existing entries.`,
      inserted,
      skipped,
      total: SEED_DATA.length,
    })
  } catch (err: any) {
    console.error('[dropdown/seed] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — check how many options exist per category
export async function GET() {
  try {
    const res = await pool.query(
      `SELECT category, COUNT(*) as count FROM dropdown_options GROUP BY category ORDER BY category`
    ).catch(() => ({ rows: [] }))
    return NextResponse.json({
      categories: res.rows,
      totalCategories: res.rows.length,
      isEmpty: res.rows.length === 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
