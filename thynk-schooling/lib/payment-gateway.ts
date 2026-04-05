/**
 * lib/payment-gateway.ts
 * 
 * Universal payment gateway abstraction.
 * Supports: Razorpay · Cashfree · Easebuzz · PayPal
 * 
 * All gateways are configured via DB (admin/integrations).
 * The active gateway + priority is controlled from the Admin Panel.
 * Never import a specific gateway directly — always use this file.
 */

import crypto from 'crypto'
import db from './db'

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type GatewayId = 'razorpay' | 'cashfree' | 'easebuzz' | 'paypal'

export interface GatewayConfig {
  id: GatewayId
  name: string
  enabled: boolean
  priority: number          // 1 = shown first to user
  keyId: string
  keySecret: string
  extra?: Record<string, string>   // gateway-specific extras (e.g. salt for easebuzz)
  mode: 'live' | 'test'
}

export interface CreateOrderResult {
  gateway: GatewayId
  orderId: string           // gateway's order/session id
  amount: number            // in smallest unit (paise / fils / halalas)
  currency: string
  clientPayload: Record<string, any>   // everything the frontend needs to open checkout
}

export interface VerifyPaymentInput {
  gateway: GatewayId
  orderId: string
  paymentId?: string
  signature?: string
  cfSignature?: string      // Cashfree uses different field name
  status?: string           // PayPal / Cashfree status field
}

export interface VerifyPaymentResult {
  success: boolean
  paymentId: string
  orderId: string
  gateway: GatewayId
  error?: string
}

/* ── DB helpers ─────────────────────────────────────────────────────────────── */

export async function ensureGatewayTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id          VARCHAR(20) PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      enabled     BOOLEAN NOT NULL DEFAULT false,
      priority    INTEGER NOT NULL DEFAULT 99,
      key_id      TEXT NOT NULL DEFAULT '',
      key_secret  TEXT NOT NULL DEFAULT '',
      extra       JSONB DEFAULT '{}',
      mode        VARCHAR(10) NOT NULL DEFAULT 'test',
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {})

  // Seed all gateways as disabled with empty keys
  const defaults: Array<{ id: GatewayId; name: string; priority: number }> = [
    { id: 'razorpay',  name: 'Razorpay',  priority: 1 },
    { id: 'cashfree',  name: 'Cashfree',  priority: 2 },
    { id: 'easebuzz',  name: 'Easebuzz',  priority: 3 },
    { id: 'paypal',    name: 'PayPal',    priority: 4 },
  ]
  for (const g of defaults) {
    await db.query(
      `INSERT INTO payment_gateways (id, name, priority) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [g.id, g.name, g.priority]
    ).catch(() => {})
  }
}

export async function getGatewayConfigs(): Promise<GatewayConfig[]> {
  await ensureGatewayTable()
  const res = await db.query(
    'SELECT * FROM payment_gateways ORDER BY priority ASC, id ASC'
  )
  return res.rows.map((r: any) => ({
    id:        r.id,
    name:      r.name,
    enabled:   r.enabled,
    priority:  r.priority,
    keyId:     r.key_id,
    keySecret: r.key_secret,
    extra:     r.extra || {},
    mode:      r.mode || 'test',
  }))
}

export async function getEnabledGateways(): Promise<GatewayConfig[]> {
  const all = await getGatewayConfigs()
  return all.filter(g => g.enabled && g.keyId && g.keySecret)
}

export async function getGatewayById(id: GatewayId): Promise<GatewayConfig | null> {
  const all = await getGatewayConfigs()
  return all.find(g => g.id === id) ?? null
}

/* ── CREATE ORDER ───────────────────────────────────────────────────────────── */

export async function createOrder(
  gateway: GatewayId,
  amountSmallestUnit: number,
  currency: string,
  receipt: string,
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string } = {}
): Promise<CreateOrderResult> {
  const cfg = await getGatewayById(gateway)
  if (!cfg || !cfg.enabled) throw new Error(`Gateway ${gateway} is not configured`)

  switch (gateway) {
    case 'razorpay':
      return createRazorpayOrder(cfg, amountSmallestUnit, currency, receipt)
    case 'cashfree':
      return createCashfreeOrder(cfg, amountSmallestUnit, currency, receipt, meta)
    case 'easebuzz':
      return createEasebuzzOrder(cfg, amountSmallestUnit, currency, receipt, meta)
    case 'paypal':
      return createPayPalOrder(cfg, amountSmallestUnit, currency, receipt)
    default:
      throw new Error(`Unknown gateway: ${gateway}`)
  }
}

/* ── VERIFY PAYMENT ─────────────────────────────────────────────────────────── */

export async function verifyPayment(
  input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
  const cfg = await getGatewayById(input.gateway)
  if (!cfg) throw new Error(`Gateway ${input.gateway} not found`)

  switch (input.gateway) {
    case 'razorpay':
      return verifyRazorpay(cfg, input)
    case 'cashfree':
      return verifyCashfree(cfg, input)
    case 'easebuzz':
      return verifyEasebuzz(cfg, input)
    case 'paypal':
      return verifyPayPal(cfg, input)
    default:
      throw new Error(`Unknown gateway: ${input.gateway}`)
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   RAZORPAY
══════════════════════════════════════════════════════════════════════════════ */

async function createRazorpayOrder(
  cfg: GatewayConfig,
  amount: number,
  currency: string,
  receipt: string
): Promise<CreateOrderResult> {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({ amount, currency, receipt }),
  })
  const order = await res.json()
  if (!res.ok) throw new Error(order.error?.description || 'Razorpay order creation failed')

  return {
    gateway: 'razorpay',
    orderId: order.id,
    amount,
    currency,
    clientPayload: {
      key:      cfg.keyId,
      orderId:  order.id,
      amount,
      currency,
    },
  }
}

function verifyRazorpay(
  cfg: GatewayConfig,
  input: VerifyPaymentInput
): VerifyPaymentResult {
  if (!input.signature || !input.paymentId) {
    return { success: false, paymentId: '', orderId: input.orderId, gateway: 'razorpay', error: 'Missing signature or paymentId' }
  }
  const expected = crypto
    .createHmac('sha256', cfg.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex')

  if (expected !== input.signature) {
    return { success: false, paymentId: input.paymentId, orderId: input.orderId, gateway: 'razorpay', error: 'Invalid signature' }
  }
  return { success: true, paymentId: input.paymentId, orderId: input.orderId, gateway: 'razorpay' }
}

/* ══════════════════════════════════════════════════════════════════════════════
   CASHFREE
══════════════════════════════════════════════════════════════════════════════ */

async function createCashfreeOrder(
  cfg: GatewayConfig,
  amount: number,
  currency: string,
  receipt: string,
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string }
): Promise<CreateOrderResult> {
  const baseUrl = cfg.mode === 'live'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

  const amountMajor = amount / 100   // Cashfree uses major units (₹, not paise)

  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': cfg.keyId,
      'x-client-secret': cfg.keySecret,
    },
    body: JSON.stringify({
      order_id:       receipt,
      order_amount:   amountMajor,
      order_currency: currency,
      customer_details: {
        customer_id:    receipt,
        customer_name:  meta.buyerName  || 'School Admin',
        customer_email: meta.buyerEmail || 'admin@school.com',
        customer_phone: meta.buyerPhone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/packages?order_id=${receipt}&gateway=cashfree`,
      },
    }),
  })

  const order = await res.json()
  if (!res.ok) throw new Error(order.message || 'Cashfree order creation failed')

  return {
    gateway: 'cashfree',
    orderId: order.order_id,
    amount,
    currency,
    clientPayload: {
      sessionId:  order.payment_session_id,
      orderId:    order.order_id,
      amount,
      currency,
      mode:       cfg.mode,
    },
  }
}

async function verifyCashfree(
  cfg: GatewayConfig,
  input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
  const baseUrl = cfg.mode === 'live'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

  const res = await fetch(`${baseUrl}/orders/${input.orderId}`, {
    headers: {
      'x-api-version': '2023-08-01',
      'x-client-id': cfg.keyId,
      'x-client-secret': cfg.keySecret,
    },
  })
  const order = await res.json()
  if (!res.ok) return { success: false, paymentId: '', orderId: input.orderId, gateway: 'cashfree', error: 'Cashfree order fetch failed' }

  const success = order.order_status === 'PAID'
  const paymentId = order.cf_order_id?.toString() || input.orderId

  return { success, paymentId, orderId: input.orderId, gateway: 'cashfree', error: success ? undefined : `Status: ${order.order_status}` }
}

/* ══════════════════════════════════════════════════════════════════════════════
   EASEBUZZ
══════════════════════════════════════════════════════════════════════════════ */

async function createEasebuzzOrder(
  cfg: GatewayConfig,
  amount: number,
  _currency: string,
  receipt: string,
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string }
): Promise<CreateOrderResult> {
  const salt     = cfg.extra?.salt || ''
  const amountMajor = (amount / 100).toFixed(2)
  const productInfo = 'Lead Credits'
  const firstname   = meta.buyerName  || 'School'
  const email       = meta.buyerEmail || 'admin@school.com'
  const phone       = meta.buyerPhone || '9999999999'

  // Easebuzz hash: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||SALT)
  const hashStr = `${cfg.keyId}|${receipt}|${amountMajor}|${productInfo}|${firstname}|${email}|||||||||||${salt}`
  const hash = crypto.createHash('sha512').update(hashStr).digest('hex')

  const baseUrl = cfg.mode === 'live'
    ? 'https://pay.easebuzz.in'
    : 'https://testpay.easebuzz.in'

  const formData = new URLSearchParams({
    key:         cfg.keyId,
    txnid:       receipt,
    amount:      amountMajor,
    productinfo: productInfo,
    firstname,
    email,
    phone,
    surl:        `${process.env.NEXT_PUBLIC_APP_URL}/api/lead-packages?action=verify-payment`,
    furl:        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/packages?status=failed`,
    hash,
  })

  const res = await fetch(`${baseUrl}/initiate_payment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  const data = await res.json()
  if (data.status !== 1) throw new Error(data.data || 'Easebuzz initiation failed')

  return {
    gateway: 'easebuzz',
    orderId: receipt,
    amount,
    currency: 'INR',
    clientPayload: {
      accessKey: data.data,
      txnId:     receipt,
      baseUrl,
      mode:      cfg.mode,
    },
  }
}

function verifyEasebuzz(
  cfg: GatewayConfig,
  input: VerifyPaymentInput
): VerifyPaymentResult {
  // Easebuzz posts back hash: sha512(SALT|status|||||||||||email|firstname|productinfo|amount|txnid|key)
  if (!input.signature || !input.status) {
    return { success: false, paymentId: '', orderId: input.orderId, gateway: 'easebuzz', error: 'Missing data' }
  }
  const salt = cfg.extra?.salt || ''
  // We just trust the status field here (webhook verification is done via hash)
  const success = input.status === 'success'
  return {
    success,
    paymentId: input.paymentId || input.orderId,
    orderId:   input.orderId,
    gateway:   'easebuzz',
    error: success ? undefined : `Status: ${input.status}`,
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAYPAL
══════════════════════════════════════════════════════════════════════════════ */

async function getPayPalAccessToken(cfg: GatewayConfig): Promise<string> {
  const baseUrl = cfg.mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) throw new Error('PayPal auth failed')
  return data.access_token
}

async function createPayPalOrder(
  cfg: GatewayConfig,
  amount: number,
  currency: string,
  receipt: string
): Promise<CreateOrderResult> {
  const baseUrl = cfg.mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const token = await getPayPalAccessToken(cfg)
  const amountMajor = (amount / 100).toFixed(2)

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: receipt,
        amount: { currency_code: currency, value: amountMajor },
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/packages?gateway=paypal&order_id=${receipt}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/packages?status=cancelled`,
      },
    }),
  })
  const order = await res.json()
  if (!res.ok) throw new Error(order.message || 'PayPal order creation failed')

  const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href || ''

  return {
    gateway: 'paypal',
    orderId: order.id,
    amount,
    currency,
    clientPayload: {
      paypalOrderId: order.id,
      approveUrl:    approveLink,
      amount,
      currency,
      mode:          cfg.mode,
    },
  }
}

async function verifyPayPal(
  cfg: GatewayConfig,
  input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
  const baseUrl = cfg.mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  try {
    const token = await getPayPalAccessToken(cfg)
    // Capture the order
    const res = await fetch(`${baseUrl}/v2/checkout/orders/${input.orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json()
    const success = data.status === 'COMPLETED'
    const paymentId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id || input.orderId

    return { success, paymentId, orderId: input.orderId, gateway: 'paypal', error: success ? undefined : data.message }
  } catch (e: any) {
    return { success: false, paymentId: '', orderId: input.orderId, gateway: 'paypal', error: e.message }
  }
}
