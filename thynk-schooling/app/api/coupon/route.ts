export const dynamic = 'force-dynamic'
/**
 * /api/coupon
 *
 * POST { code, amount_paise, gateway }
 *   → { valid, discount_paise, final_amount_paise, coupon_id, message }
 *
 * Called from checkout before creating the payment order.
 * Gateway filter: if coupon.applicable_gateways is non-empty,
 * the chosen gateway must be in the list.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { code, amount_paise, gateway } = await req.json()

    if (!code || !amount_paise) {
      return NextResponse.json({ valid: false, message: 'code and amount_paise are required' }, { status: 400 })
    }

    const upper = String(code).trim().toUpperCase()

    // Fetch coupon
    const res = await db.query(
      'SELECT * FROM discount_coupons WHERE code=$1',
      [upper]
    ).catch(() => ({ rows: [] }))

    if (!res.rows.length) {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code' })
    }

    const c = res.rows[0]

    // Active check
    if (!c.active) {
      return NextResponse.json({ valid: false, message: 'This coupon is inactive' })
    }

    // Expiry check
    if (c.valid_until && new Date(c.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired' })
    }

    // Not-yet-valid check
    if (c.valid_from && new Date(c.valid_from) > new Date()) {
      return NextResponse.json({ valid: false, message: 'This coupon is not valid yet' })
    }

    // Max uses check
    if (c.max_uses !== null && c.used_count >= c.max_uses) {
      return NextResponse.json({ valid: false, message: 'This coupon has reached its usage limit' })
    }

    // Minimum order check (min_amount stored in ₹, amount_paise in paise)
    const amount_rupees = amount_paise / 100
    if (c.min_amount > 0 && amount_rupees < Number(c.min_amount)) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of ₹${c.min_amount} required for this coupon`,
      })
    }

    // Gateway filter check
    if (
      gateway &&
      c.applicable_gateways &&
      c.applicable_gateways.length > 0 &&
      !c.applicable_gateways.includes(gateway)
    ) {
      const names = c.applicable_gateways.join(', ')
      return NextResponse.json({
        valid: false,
        message: `This coupon is only valid for: ${names}`,
      })
    }

    // Calculate discount
    let discount_paise: number
    if (c.type === 'percent') {
      discount_paise = Math.round((amount_paise * Number(c.value)) / 100)
    } else {
      // flat — c.value is in ₹
      discount_paise = Math.round(Number(c.value) * 100)
    }

    // Never discount more than the order
    discount_paise = Math.min(discount_paise, amount_paise)
    const final_amount_paise = amount_paise - discount_paise

    return NextResponse.json({
      valid: true,
      coupon_id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      discount_paise,
      final_amount_paise,
      applicable_gateways: c.applicable_gateways || [],
      message: c.type === 'percent'
        ? `${c.value}% discount applied — you save ₹${(discount_paise / 100).toFixed(2)}`
        : `₹${c.value} flat discount applied`,
    })
  } catch (e: any) {
    console.error('[coupon validate]', e)
    return NextResponse.json({ valid: false, message: 'Something went wrong' }, { status: 500 })
  }
}
