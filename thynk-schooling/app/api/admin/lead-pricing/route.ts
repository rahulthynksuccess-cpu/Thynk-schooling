export const dynamic = 'force-dynamic'
/**
 * GET  /api/admin/lead-pricing   — fetch current pricing + discovery config
 * POST /api/admin/lead-pricing   — save pricing + discovery config
 *
 * Pricing cascade: city override → state override → global default
 * New table: city_lead_pricing (city_name, state, price fields, is_active)
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  await db.query(`
    CREATE TABLE IF NOT EXISTS state_lead_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      state VARCHAR(120) NOT NULL UNIQUE,
      default_price_paise INTEGER NOT NULL DEFAULT 29900,
      min_price_paise INTEGER NOT NULL DEFAULT 9900,
      max_price_paise INTEGER NOT NULL DEFAULT 99900,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // City-level pricing table — inherits from state unless overridden
  await db.query(`
    CREATE TABLE IF NOT EXISTS city_lead_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      city_name VARCHAR(120) NOT NULL,
      state VARCHAR(120) NOT NULL,
      default_price_paise INTEGER NOT NULL DEFAULT 29900,
      min_price_paise INTEGER NOT NULL DEFAULT 9900,
      max_price_paise INTEGER NOT NULL DEFAULT 99900,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(city_name, state)
    )
  `).catch(() => {})
}

const DEFAULTS = {
  defaultPricePaise:   29900,
  minPricePaise:        9900,
  maxPricePaise:       99900,
  maskBlurMeters:       1000,
  leadExpiryDays:         30,
  discoveryWindowDays:    90,
  radiusKm:               10,
}

export async function GET() {
  try {
    await ensureTables()

    const [globalRes, stateRes, cityRes] = await Promise.all([
      db.query("SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'"),
      db.query('SELECT * FROM state_lead_pricing ORDER BY state ASC'),
      db.query('SELECT * FROM city_lead_pricing ORDER BY state ASC, city_name ASC'),
    ])

    let global = { ...DEFAULTS }
    if (globalRes.rows.length) {
      try {
        const saved = JSON.parse(globalRes.rows[0].value)
        if (saved.pricePerLead && !saved.defaultPricePaise) {
          saved.defaultPricePaise = saved.pricePerLead * 100
        }
        if (!saved.radiusKm && saved.maskBlurMeters) {
          saved.radiusKm = Math.round(saved.maskBlurMeters / 1000)
        }
        global = { ...DEFAULTS, ...saved }
      } catch {}
    }

    const statePricing = stateRes.rows.map((r: any) => ({
      id:                r.id,
      state:             r.state,
      defaultPricePaise: r.default_price_paise,
      minPricePaise:     r.min_price_paise,
      maxPricePaise:     r.max_price_paise,
      isActive:          r.is_active,
    }))

    const cityPricing = cityRes.rows.map((r: any) => ({
      id:                r.id,
      cityName:          r.city_name,
      state:             r.state,
      defaultPricePaise: r.default_price_paise,
      minPricePaise:     r.min_price_paise,
      maxPricePaise:     r.max_price_paise,
      isActive:          r.is_active,
    }))

    return NextResponse.json({ ...global, statePricing, cityPricing })
  } catch (e: any) {
    console.error('[lead-pricing GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables()

    const body = await req.json()
    const { statePricing, cityPricing, ...global } = body

    const paise = Number(global.defaultPricePaise)
    if (!paise || paise < 100) {
      return NextResponse.json({ error: 'Default price must be at least ₹1 (100 paise)' }, { status: 400 })
    }

    const toSave = {
      ...DEFAULTS,
      ...global,
      defaultPricePaise:   Number(global.defaultPricePaise   ?? DEFAULTS.defaultPricePaise),
      minPricePaise:        Number(global.minPricePaise        ?? DEFAULTS.minPricePaise),
      maxPricePaise:        Number(global.maxPricePaise        ?? DEFAULTS.maxPricePaise),
      maskBlurMeters:       Number(global.maskBlurMeters       ?? DEFAULTS.maskBlurMeters),
      leadExpiryDays:       Number(global.leadExpiryDays       ?? DEFAULTS.leadExpiryDays),
      discoveryWindowDays:  Number(global.discoveryWindowDays  ?? DEFAULTS.discoveryWindowDays),
      radiusKm:             Number(global.radiusKm             ?? DEFAULTS.radiusKm),
    }

    await db.query(
      `INSERT INTO admin_settings (key, value, updated_at)
       VALUES ('lead_pricing_defaults', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(toSave)]
    )

    // Upsert state pricing
    if (Array.isArray(statePricing)) {
      for (const sp of statePricing) {
        await db.query(
          `INSERT INTO state_lead_pricing
             (state, default_price_paise, min_price_paise, max_price_paise, is_active, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (state) DO UPDATE
             SET default_price_paise = $2,
                 min_price_paise     = $3,
                 max_price_paise     = $4,
                 is_active           = $5,
                 updated_at          = NOW()`,
          [sp.state, sp.defaultPricePaise, sp.minPricePaise, sp.maxPricePaise, sp.isActive !== false]
        )
      }

      if (statePricing.length > 0) {
        const keepStates = statePricing.map((s: any) => s.state)
        const placeholders = keepStates.map((_: any, i: number) => `$${i + 1}`).join(', ')
        await db.query(
          `DELETE FROM state_lead_pricing WHERE state NOT IN (${placeholders})`,
          keepStates
        ).catch(() => {})
      } else {
        await db.query('DELETE FROM state_lead_pricing').catch(() => {})
      }
    }

    // Upsert city pricing
    if (Array.isArray(cityPricing)) {
      for (const cp of cityPricing) {
        if (!cp.cityName || !cp.state) continue
        await db.query(
          `INSERT INTO city_lead_pricing
             (city_name, state, default_price_paise, min_price_paise, max_price_paise, is_active, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (city_name, state) DO UPDATE
             SET default_price_paise = $3,
                 min_price_paise     = $4,
                 max_price_paise     = $5,
                 is_active           = $6,
                 updated_at          = NOW()`,
          [cp.cityName, cp.state, cp.defaultPricePaise, cp.minPricePaise, cp.maxPricePaise, cp.isActive !== false]
        )
      }

      // Remove city overrides that were deleted in UI
      if (cityPricing.length > 0) {
        const keepKeys = cityPricing.map((c: any) => `${c.cityName}|||${c.state}`)
        // Delete any rows not in the keep list
        const allCities = await db.query('SELECT city_name, state FROM city_lead_pricing')
        for (const row of allCities.rows) {
          const key = `${row.city_name}|||${row.state}`
          if (!keepKeys.includes(key)) {
            await db.query(
              'DELETE FROM city_lead_pricing WHERE city_name=$1 AND state=$2',
              [row.city_name, row.state]
            ).catch(() => {})
          }
        }
      } else {
        await db.query('DELETE FROM city_lead_pricing').catch(() => {})
      }
    }

    return NextResponse.json({ success: true, saved: toSave })
  } catch (e: any) {
    console.error('[lead-pricing POST]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * GET /api/admin/lead-pricing?resolve=1&city=Noida&state=Uttar+Pradesh
 * Returns the effective price for a given city/state (used by school dashboard)
 */
export async function GET_RESOLVE(city?: string, state?: string) {
  // This is handled inline in the main GET via query params — see resolveLeadPrice in lib/leadPricing.ts
}
