/**
 * Lead Pricing Resolver
 * Priority: City override → State override → Global default
 *
 * Usage:
 *   import { resolveLeadPrice } from '@/lib/leadPricing'
 *   const { defaultPricePaise, minPricePaise, maxPricePaise } =
 *     await resolveLeadPrice({ city: school.city, state: school.state })
 */

import db from '@/lib/db'

export interface PriceTier {
  defaultPricePaise: number
  minPricePaise: number
  maxPricePaise: number
}

const GLOBAL_DEFAULTS: PriceTier = {
  defaultPricePaise: 29900,
  minPricePaise: 9900,
  maxPricePaise: 99900,
}

/** Load global defaults from admin_settings */
async function loadGlobalDefaults(): Promise<PriceTier> {
  try {
    const res = await db.query(
      "SELECT value FROM admin_settings WHERE key='lead_pricing_defaults'"
    )
    if (!res.rows.length) return { ...GLOBAL_DEFAULTS }
    const saved = JSON.parse(res.rows[0].value)
    return {
      defaultPricePaise: saved.defaultPricePaise ?? GLOBAL_DEFAULTS.defaultPricePaise,
      minPricePaise: saved.minPricePaise ?? GLOBAL_DEFAULTS.minPricePaise,
      maxPricePaise: saved.maxPricePaise ?? GLOBAL_DEFAULTS.maxPricePaise,
    }
  } catch {
    return { ...GLOBAL_DEFAULTS }
  }
}

/**
 * Resolve the per-lead price for a school's city/state.
 * Follows the cascade: city override → state override → global default.
 */
export async function resolveLeadPrice({
  city,
  state,
}: {
  city?: string | null
  state?: string | null
}): Promise<PriceTier & { source: 'city' | 'state' | 'global' }> {
  const global = await loadGlobalDefaults()

  // 1. Try city-level override
  if (city) {
    try {
      const cityRes = await db.query(
        `SELECT default_price_paise, min_price_paise, max_price_paise
           FROM city_lead_pricing
          WHERE LOWER(city_name) = LOWER($1) AND is_active = true
          LIMIT 1`,
        [city.trim()]
      )
      if (cityRes.rows.length) {
        const r = cityRes.rows[0]
        return {
          defaultPricePaise: r.default_price_paise,
          minPricePaise: r.min_price_paise,
          maxPricePaise: r.max_price_paise,
          source: 'city',
        }
      }
    } catch {
      // table may not exist yet — fall through
    }
  }

  // 2. Try state-level override
  if (state) {
    try {
      const stateRes = await db.query(
        `SELECT default_price_paise, min_price_paise, max_price_paise
           FROM state_lead_pricing
          WHERE LOWER(state) = LOWER($1) AND is_active = true
          LIMIT 1`,
        [state.trim()]
      )
      if (stateRes.rows.length) {
        const r = stateRes.rows[0]
        return {
          defaultPricePaise: r.default_price_paise,
          minPricePaise: r.min_price_paise,
          maxPricePaise: r.max_price_paise,
          source: 'state',
        }
      }
    } catch {
      // fall through
    }
  }

  // 3. Global default
  return { ...global, source: 'global' }
}
