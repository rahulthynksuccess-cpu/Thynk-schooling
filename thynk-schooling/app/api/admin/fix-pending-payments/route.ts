export const dynamic = 'force-dynamic'
/**
 * POST /api/admin/fix-pending-payments
 * 
 * Fixes all pending Easebuzz payments by:
 * 1. Finding every pending subscription_payment and featured_listing_payment with gateway=easebuzz
 * 2. Marking them completed
 * 3. Activating the subscription (inserts into school_subscriptions)
 * 4. Crediting leads into lead_credits
 * 5. Activating featured listing if plan includes it
 * 6. Sending payment notification to school
 *
 * Safe to run multiple times — uses ON CONFLICT DO UPDATE so no duplicates.
 * DELETE THIS FILE after running.
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  const results: any[] = []
  const errors:  any[] = []

  try {
    // ── Fix subscription_payments ─────────────────────────────────────────────
    const pending = await db.query(`
      SELECT sp.*, s.name AS school_name
      FROM subscription_payments sp
      LEFT JOIN schools s ON s.id = sp.school_id
      WHERE sp.gateway = 'easebuzz'
        AND sp.status  = 'pending'
      ORDER BY sp.created_at DESC
    `).catch(() => ({ rows: [] }))

    for (const rec of pending.rows) {
      try {
        const leadCount = rec.lead_count ?? 0

        // Get plan details
        const planRow = await db.query(
          `SELECT name, includes_featured_listing, featured_listing_days
           FROM subscription_plans WHERE plan_key = $1`,
          [rec.plan_key]
        ).catch(() => ({ rows: [] }))
        const planName   = planRow.rows[0]?.name || rec.plan_key
        const isFeatured = planRow.rows[0]?.includes_featured_listing ?? false
        const featDays   = Number(planRow.rows[0]?.featured_listing_days ?? 30)

        // 1. Activate subscription
        await db.query(`
          INSERT INTO school_subscriptions
            (school_id, plan_key, plan_name, lead_count, activated_at, payment_id)
          VALUES ($1,$2,$3,$4,NOW(),$5)
          ON CONFLICT (school_id) DO UPDATE
            SET plan_key=$2, plan_name=$3, lead_count=$4,
                activated_at=NOW(), payment_id=$5, updated_at=NOW()
        `, [rec.school_id, rec.plan_key, planName, leadCount, rec.id])

        // 2. Credit leads
        if (leadCount > 0) {
          await db.query(`
            INSERT INTO lead_credits (school_id, credits, total_credits, used_credits)
            VALUES ($1, $2, $2, 0)
            ON CONFLICT (school_id) DO UPDATE
              SET credits       = lead_credits.credits + $2,
                  total_credits = lead_credits.total_credits + $2,
                  updated_at    = NOW()
          `, [rec.school_id, leadCount])
        }

        // 3. Featured listing if included in plan
        if (isFeatured) {
          await db.query(
            `UPDATE schools SET is_featured=true,
             featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
            [String(featDays), rec.school_id]
          ).catch(() => {})
        }

        // 4. Mark payment completed
        await db.query(
          `UPDATE subscription_payments
           SET status='completed', payment_id='easebuzz_recovered', updated_at=NOW()
           WHERE id=$1`,
          [rec.id]
        )

        // 5. Notify school
        import('@/lib/notify').then(m =>
          m.notifyPaymentDone(rec.school_id, planName, rec.amount_paise)
        ).catch(() => {})

        results.push({
          type:       'subscription',
          orderId:    rec.order_id,
          school:     rec.school_name || rec.school_id,
          plan:       planName,
          leads:      leadCount,
          amount:     `₹${Math.round(rec.amount_paise / 100)}`,
          featured:   isFeatured,
          status:     'FIXED',
        })
      } catch (e: any) {
        errors.push({ orderId: rec.order_id, error: e.message })
      }
    }

    // ── Fix featured_listing_payments ─────────────────────────────────────────
    const pendingFeat = await db.query(`
      SELECT flp.*, s.name AS school_name
      FROM featured_listing_payments flp
      LEFT JOIN schools s ON s.id = flp.school_id
      WHERE flp.gateway = 'easebuzz'
        AND flp.status  = 'pending'
      ORDER BY flp.created_at DESC
    `).catch(() => ({ rows: [] }))

    for (const rec of pendingFeat.rows) {
      try {
        const days = rec.duration_days || 30

        // 1. Activate featured listing
        await db.query(
          `UPDATE schools SET is_featured=true,
           featured_until=NOW()+($1||' days')::INTERVAL WHERE id=$2`,
          [String(days), rec.school_id]
        )

        // 2. Mark payment completed
        await db.query(
          `UPDATE featured_listing_payments
           SET status='completed', payment_id='easebuzz_recovered', updated_at=NOW()
           WHERE id=$1`,
          [rec.id]
        )

        // 3. Notify school
        import('@/lib/notify').then(m =>
          m.notifyFeaturedActivated(rec.school_id, days)
        ).catch(() => {})

        results.push({
          type:    'featured',
          orderId: rec.order_id,
          school:  rec.school_name || rec.school_id,
          days,
          amount:  `₹${Math.round(rec.amount_paise / 100)}`,
          status:  'FIXED',
        })
      } catch (e: any) {
        errors.push({ orderId: rec.order_id, error: e.message })
      }
    }

    return NextResponse.json({
      fixed:   results.length,
      errors:  errors.length,
      results,
      errors:  errors,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
