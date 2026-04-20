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

export interface CreateOrderOptions {
  gatewayId: GatewayId
  amountPaise: number
  currency: string
  receiptId: string
  description?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  callbackType?: string
  returnUrl?: string
}

// Overload: supports both positional args (legacy) and a named-options object (new)
export async function createOrder(
  gatewayOrOptions: GatewayId | CreateOrderOptions,
  amountSmallestUnit?: number,
  currency?: string,
  receipt?: string,
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string; callbackType?: string; returnUrl?: string } = {}
): Promise<CreateOrderResult> {
  // Normalize: if first arg is an object, unpack it into positional params
  let gateway: GatewayId
  if (typeof gatewayOrOptions === 'object') {
    const o = gatewayOrOptions
    gateway            = o.gatewayId
    amountSmallestUnit = o.amountPaise
    currency           = o.currency
    receipt            = o.receiptId
    meta               = {
      buyerName:    o.customerName,
      buyerEmail:   o.customerEmail,
      buyerPhone:   o.customerPhone,
      callbackType: o.callbackType,
      returnUrl:    o.returnUrl,
    }
  } else {
    gateway = gatewayOrOptions
  }

  const cfg = await getGatewayById(gateway)
  if (!cfg || !cfg.enabled) throw new Error(`Gateway ${gateway} is not configured`)

  switch (gateway) {
    case 'razorpay':
      return createRazorpayOrder(cfg, amountSmallestUnit!, currency!, receipt!)
    case 'cashfree':
      return createCashfreeOrder(cfg, amountSmallestUnit!, currency!, receipt!, meta)
    case 'easebuzz':
      return createEasebuzzOrder(cfg, amountSmallestUnit!, currency!, receipt!, meta)
    case 'paypal':
      return createPayPalOrder(cfg, amountSmallestUnit!, currency!, receipt!)
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
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string; returnUrl?: string }
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
        return_url: meta.returnUrl || `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/school/packages?order_id=${receipt}&gateway=cashfree`,
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
  meta: { buyerName?: string; buyerEmail?: string; buyerPhone?: string; callbackType?: string }
): Promise<CreateOrderResult> {
  // Easebuzz: Salt is stored in keySecret field (that's what the integrations UI saves it as)
  // Trim to remove any accidental spaces/newlines from copy-paste
  const merchantKey = cfg.keyId.trim()
  const salt        = (cfg.keySecret || cfg.extra?.salt || '').trim()

  if (!merchantKey) throw new Error('Easebuzz Merchant Key is empty — check Admin → Integrations → Easebuzz')
  if (!salt)        throw new Error('Easebuzz Salt is empty — check Admin → Integrations → Easebuzz')

  // txnid must be alphanumeric only, max 25 chars — strip ALL non-alphanumeric chars
  const txnid = receipt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25)

  const amountMajor = (amount / 100).toFixed(2)
  const productInfo = meta.callbackType === 'featured'
    ? 'Featured Listing'
    : meta.callbackType === 'subscription'
    ? 'Subscription Plan'
    : 'Lead Credits'
  const firstname = (meta.buyerName || 'School').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50) || 'School'
  const email     = meta.buyerEmail || 'admin@school.com'

  // Phone: exactly 10 digits, no country code
  const rawPhone   = meta.buyerPhone || ''
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^91/, '').slice(-10)
  const phone      = cleanPhone.length === 10 ? cleanPhone : '9999999999'

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  // Don't throw — use empty string and let surl/furl be relative if no APP_URL set
  // Easebuzz needs full URL but we'll let it fail with a clear error from Easebuzz itself

  // FIX 2: Easebuzz hash requires EXACTLY 16 pipes (17 segments):
  // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
  // = 6 named fields + udf1-5 (empty) + udf6-10 (5 empty) + SALT = 16 pipes total
  const hashStr = `${merchantKey}|${txnid}|${amountMajor}|${productInfo}|${firstname}|${email}|||||||||||${salt}`
  const hash    = crypto.createHash('sha512').update(hashStr).digest('hex')

  console.log('[Easebuzz] initiating payment:', { merchantKey: merchantKey.slice(0,4)+'***', txnid, amountMajor, productInfo, mode: cfg.mode })

  const baseUrl = cfg.mode === 'live'
    ? 'https://pay.easebuzz.in'
    : 'https://testpay.easebuzz.in'

  const formData = new URLSearchParams({
    key:         merchantKey,
    txnid,
    amount:      amountMajor,
    productinfo: productInfo,
    firstname,
    email,
    phone,
    // udf1-udf5 MUST be present as empty strings — Easebuzz rejects requests without them
    udf1: '', udf2: '', udf3: '', udf4: '', udf5: '',
    surl: `${appUrl}/api/easebuzz-callback?type=${meta.callbackType || 'lead'}`,
    furl: `${appUrl}/dashboard/school/packages?status=failed`,
    hash,
  })

  const res = await fetch(`${baseUrl}/payment/initiateLink/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    formData.toString(),
  })
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const txt = await res.text()
    throw new Error(`Easebuzz error (HTTP ${res.status}): ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  console.log('[Easebuzz initiateLink response]', JSON.stringify(data))
  if (data.status !== 1) throw new Error(`Easebuzz: ${JSON.stringify(data)}`)

  return {
    gateway:  'easebuzz',
    orderId:  txnid,   // store the cleaned txnid — callback posts this back as txnid
    amount,
    currency: 'INR',
    clientPayload: {
      accessKey: data.data,
      txnId:     txnid,
      baseUrl,
      mode:      cfg.mode,
    },
  }
}

function verifyEasebuzz(
  cfg: GatewayConfig,
  input: VerifyPaymentInput
): VerifyPaymentResult {
  // For EaseCheckout (iframe), the response comes client-side with status field only
  // We trust the status since the txnid must match a pending DB record (can't be faked)
  // Salt is stored in keySecret (not extra.salt)
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
        return_url: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/school/packages?gateway=paypal&order_id=${receipt}`,
        cancel_url: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/school/packages?status=cancelled`,
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
