/**
 * THYNK SCHOOLING — Central Config
 * ─────────────────────────────────
 * ALL env vars are read here. Never use process.env directly in components.
 *
 * LOCAL DEV:  Create .env.local (copy from .env.example, fill values)
 * VERCEL:     Settings → Environment Variables → add each key
 * HOSTINGER:  Node.js App → Environment → add each key
 *
 * NEXT_PUBLIC_ prefix = available in browser (safe for public values)
 * No prefix          = server-only (secrets, DB passwords, API keys)
 */

export const config = {
  app: {
    name:  process.env.NEXT_PUBLIC_APP_NAME || 'Thynk Schooling',
    url:   process.env.NEXT_PUBLIC_APP_URL  || 'http://localhost:3000',
    env:   process.env.NEXT_PUBLIC_APP_ENV  || 'development',
    isDev: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
    isProd: process.env.NEXT_PUBLIC_APP_ENV === 'production',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
  },
  otp: {
    // Dev/QA bypass — any phone accepts this OTP when env != production
    // Set NEXT_PUBLIC_TEST_OTP=123456 in Vercel env vars
    // DELETE this variable completely on Hostinger (production)
    testOtp:        process.env.NEXT_PUBLIC_TEST_OTP || '',
    maxAttempts:    Number(process.env.OTP_MAX_ATTEMPTS)    || 5,
    lockoutMinutes: Number(process.env.OTP_LOCKOUT_MINUTES) || 60,
  },
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  },
  cdn: {
    url:    process.env.NEXT_PUBLIC_CDN_URL       || '',
    s3Host: process.env.NEXT_PUBLIC_S3_HOSTNAME   || '',
  },
  maps: {
    googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  },
  lead: {
    defaultPricePaise: Number(process.env.DEFAULT_LEAD_PRICE_PAISE) || 29900,
    maskBlurMeters:    Number(process.env.LEAD_MASK_BLUR_METERS)    || 1000,
  },
} as const

export type AppConfig = typeof config
