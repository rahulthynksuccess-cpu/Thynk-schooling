export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function ensure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID, name VARCHAR(200), phone VARCHAR(20), email VARCHAR(200),
      city VARCHAR(100), query TEXT, status VARCHAR(50) DEFAULT 'pending',
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(()=>{})
}

async function sendEmailNotification(data: { name: string; phone: string; email?: string; city?: string; query?: string }) {
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
    const TO_EMAIL = 'success@thynksuccess.com'
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@thynkschooling.in'

    if (SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: TO_EMAIL }] }],
          from: { email: FROM_EMAIL, name: 'Thynk Schooling' },
          reply_to: data.email ? { email: data.email, name: data.name } : undefined,
          subject: `New Counselling Request — ${data.name} (${data.phone})`,
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#B8860B;padding:20px 28px">
                  <h2 style="color:#fff;margin:0;font-size:20px">New Counselling Request</h2>
                  <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">via Thynk Schooling</p>
                </div>
                <div style="padding:24px 28px;background:#fff">
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px">Name</td><td style="padding:8px 0;color:#111827;font-weight:600">${data.name}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Phone</td><td style="padding:8px 0;color:#111827;font-weight:600">${data.phone}</td></tr>
                    ${data.email ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0;color:#111827">${data.email}</td></tr>` : ''}
                    ${data.city ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">City</td><td style="padding:8px 0;color:#111827">${data.city}</td></tr>` : ''}
                    ${data.query ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top">Query</td><td style="padding:8px 0;color:#111827">${data.query}</td></tr>` : ''}
                  </table>
                  <div style="margin-top:20px;padding:14px;background:#FEF7E0;border-radius:8px;border-left:3px solid #B8860B">
                    <p style="margin:0;font-size:13px;color:#92400e">Respond within 24 hours for best conversion.</p>
                  </div>
                </div>
              </div>
            `,
          }],
        }),
      })
    } else {
      console.log('[Counselling] Email notification (no SENDGRID_API_KEY):', {
        to: TO_EMAIL, subject: `New Counselling Request — ${data.name} (${data.phone})`, body: data,
      })
    }
  } catch (emailErr) {
    console.error('[Counselling] Email notification failed:', emailErr)
  }
}

export async function POST(req: NextRequest) {
  await ensure()
  try {
    const body = await req.json()
    const { name, phone, email, city, query } = body
    await db.query(
      `INSERT INTO counselling_requests (name, phone, email, city, query) VALUES ($1,$2,$3,$4,$5)`,
      [name, phone, email||null, city||null, query||null]
    )
    // Always send notification email to success@thynksuccess.com
    await sendEmailNotification({ name, phone, email, city, query })
    return NextResponse.json({ success: true, message: 'Booking received!' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
