export const dynamic = 'force-dynamic'
/**
 * GET /api/lead-price?city=Noida&state=Uttar+Pradesh
 *
 * Returns the effective per-lead price for a school's location, following
 * the cascade: city_lead_pricing → state_lead_pricing → global default.
 *
 * Used by the school dashboard to display the correct "buy single lead" price.
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveLeadPrice } from '@/lib/leadPricing'

export async function GET(req: NextRequest) {
  try {
    const url   = new URL(req.url)
    const city  = url.searchParams.get('city')  || null
    const state = url.searchParams.get('state') || null

    const result = await resolveLeadPrice({ city, state })

    return NextResponse.json({
      city:              city  || null,
      state:             state || null,
      source:            result.source,       // 'city' | 'state' | 'global'
      defaultPricePaise: result.defaultPricePaise,
      minPricePaise:     result.minPricePaise,
      maxPricePaise:     result.maxPricePaise,
      // Convenience — formatted rupees string
      displayPrice:      `₹${Math.round(result.defaultPricePaise / 100).toLocaleString('en-IN')}`,
    })
  } catch (e: any) {
    console.error('[lead-price GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
